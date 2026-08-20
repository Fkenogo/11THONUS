/**
 * STAFF PERMISSION OVERRIDE ADMINISTRATION command (`ENG-P2-003D`).
 *
 * Grant/revoke administration for another membership's `PermissionOverride`
 * configuration — governed by `staff.assignPermissions`
 * (`sensitivePermissionCatalogue.ts` — Owner by default,
 * `explicitGrantEligibleRole: "manager"`), evaluated exclusively through
 * `authorizeAndExecute`, the same consumption discipline
 * `staffRoleChangeCommand.ts`/`staffMembershipLifecycleCommand.ts` already
 * use for their own sensitive permission. This file never re-implements or
 * duplicates override-precedence, role-eligibility, or Owner-floor logic —
 * `ENG-P2-004A`'s `createPermissionOverride` remains the sole authority for
 * whether a given `(permissionId, direction, targetRole)` combination is
 * constructible at all (Phase C's architectural boundary: 003D writes valid
 * configuration, 004 alone interprets/evaluates it).
 *
 * **`permissions[]` is current configuration, not history (FD-003D-1,
 * `ENG-P2-003-DESIGN-001` §29).** For the target `(membershipId,
 * permissionId)`, there is at most one current override. A new valid
 * override atomically *replaces* whatever previously existed for that
 * permission (grant<->revoke or same-direction reconfirmation); it is never
 * appended alongside a prior entry. Historical grant/revoke activity is
 * preserved separately via `staffPermissionOverrideEvents.ts`'s outbox
 * event, fired only when the persisted configuration actually changes.
 *
 * **Target-status policy (FD-003D-2, §29), read live inside the
 * transaction, never trusted from the request:**
 *   - `active` — grant and revoke both allowed, subject to
 *     `createPermissionOverride`'s existing eligibility contract.
 *   - `suspended` — revoke only. Grant is refused before any persisted
 *     mutation: a suspended membership must never be used to stage new
 *     authority that becomes effective merely by later reactivation.
 *     Suspension may *reduce* authority; it must never be used to *stage*
 *     authority.
 *   - `removed` / `invited` — neither grant nor revoke; the relationship is
 *     historical/terminal (removed) or not yet a `businessMembership` at
 *     all (invited, per `ENG-P2-003`'s invitation-then-acceptance model).
 *
 * **Sensitive-only administration boundary (Phase N).** `createPermissionOverride`
 * itself does not reject a non-sensitive `permissionId` — it only applies
 * its extra eligibility checks *when* the permission is sensitive. This
 * command therefore gates on `getSensitivePermissionEntry` *before* calling
 * `createPermissionOverride`, so an ordinary (`ENG-P2-004-CORR-001`) or
 * wholly unknown permission id is refused here rather than silently
 * accepted and persisted as a no-op override the evaluator would never
 * consult (`evaluatePermission.ts` Step 5a resolves ordinary permissions
 * without ever reaching override resolution) — CORR-001's explicit
 * "do not add ordinary-permission grant/revoke support" boundary
 * (FD-CORR-6) is preserved by construction.
 *
 * **TOCTOU-safe (Phase M/P).** Authorization, the target membership's live
 * role/status, its live persisted overrides, and the replaced write all
 * happen inside the one `authorizeAndExecute` transaction — a concurrent
 * role change, suspension, or removal is read fresh on every attempt
 * (Firestore transaction retry), never staged against stale data.
 */

import type { Firestore } from "firebase-admin/firestore";
import { authorizeAndExecute, type AuthorizeAndExecuteResult } from "./authorizeAndExecute";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { getBusinessMembershipWithRawOverridesById } from "../repositories/permissionOverrideAdminRepository";
import {
  writeMembershipPermissionOverrides,
  type PersistedPermissionOverrideRecordFields,
} from "../repositories/businessMembershipWriteRepository";
import {
  createPermissionOverride,
  type PermissionOverrideDirection,
} from "../models/permissionOverride";
import { getSensitivePermissionEntry } from "../models/sensitivePermissionCatalogue";
import { buildStaffPermissionOverrideChangedEvent } from "../events/staffPermissionOverrideEvents";
import {
  membershipCrossBusinessMismatchError,
  membershipReadTransientFailureError,
  overrideAdminMalformedExistingOverrideStateError,
  overrideAdminTargetStatusNotPermittedError,
  targetMembershipConfigMalformedError,
  targetMembershipNotFoundError,
} from "../models/permissionErrors";

const PERMISSION = "staff.assignPermissions";

export type AdministerStaffPermissionOverrideCommandParams = {
  /** The authenticated actor's own userId — never client-supplied as "target". */
  userId: string;
  businessId: string;
  targetMembershipId: string;
  permissionId: string;
  direction: PermissionOverrideDirection;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  now: Date;
  newId: () => string;
};

export type AdministerStaffPermissionOverrideResult = {
  membershipId: string;
  businessId: string;
  userId: string;
  permissionId: string;
  direction: PermissionOverrideDirection;
  changed: boolean;
  updatedAt: string;
};

type PreparedOverrideAdministration = {
  membershipId: string;
  businessId: string;
  targetUserId: string;
  otherOverrides: readonly PersistedPermissionOverrideRecordFields[];
  existingDirection: PermissionOverrideDirection | undefined;
  /** `undefined` when this is a no-op (existing record already matches the requested direction and remains constructible). */
  newRecord: PersistedPermissionOverrideRecordFields | undefined;
};

export async function administerStaffPermissionOverrideCommand(
  db: Firestore,
  params: AdministerStaffPermissionOverrideCommandParams,
): Promise<AuthorizeAndExecuteResult<AdministerStaffPermissionOverrideResult>> {
  // Sensitive-only administration boundary (Phase N) — checked before any
  // transaction I/O, same "fail fast on malformed request shape" discipline
  // `createStaffRoleChangeRequest` uses in the role-change command. Throws
  // `unrecognisedSensitivePermissionError` (VALIDATION_FAILED) for any
  // ordinary or unknown permissionId.
  getSensitivePermissionEntry(params.permissionId);

  const actor: EventActor = { actorType: "user", actorId: params.userId };

  return authorizeAndExecute(db, {
    request: { userId: params.userId, businessId: params.businessId, permission: PERMISSION },
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
    actorId: params.userId,
    mutation: {
      prepare: async (transaction, decision): Promise<PreparedOverrideAdministration> => {
        void decision; // authorizeAndExecute already gated on staff.assignPermissions; role is re-derived from the TARGET below, never the actor's own role.

        const targetRead = await getBusinessMembershipWithRawOverridesById(
          db,
          params.targetMembershipId,
          transaction,
        );
        if (targetRead.kind === "transient_failure") {
          throw membershipReadTransientFailureError();
        }
        if (targetRead.kind === "not_found") {
          throw targetMembershipNotFoundError();
        }
        if (targetRead.kind === "malformed") {
          throw targetMembershipConfigMalformedError();
        }
        const { membership: target, rawOverrides } = targetRead;

        if (target.businessId !== params.businessId) {
          throw membershipCrossBusinessMismatchError();
        }

        // FD-003D-2 (§29) — authoritative, live target status gate.
        if (target.status === "removed" || target.status === "invited") {
          throw overrideAdminTargetStatusNotPermittedError(target.status, params.direction);
        }
        if (target.status === "suspended" && params.direction === "grant") {
          throw overrideAdminTargetStatusNotPermittedError(target.status, params.direction);
        }
        // target.status is "active", or "suspended" with direction === "revoke" — both permitted to proceed.

        const matching = rawOverrides.filter((o) => o.permissionId === params.permissionId);
        if (matching.length > 1) {
          throw overrideAdminMalformedExistingOverrideStateError();
        }
        const existing = matching[0];
        const otherOverrides: readonly PersistedPermissionOverrideRecordFields[] = rawOverrides
          .filter((o) => o.permissionId !== params.permissionId)
          .map((o) => ({
            permissionId: o.permissionId,
            direction: o.direction,
            grantedBy: o.grantedBy,
            grantedAt: o.grantedAt,
          }));

        // Always re-validated against the target's CURRENT, live role/target
        // — never trusted from request-supplied data (Phase F/K). Reuses
        // ENG-P2-004A's contract unmodified; this is the sole authority for
        // whether (permissionId, direction, target.role) is constructible.
        const constructed = createPermissionOverride({
          permissionId: params.permissionId,
          direction: params.direction,
          businessId: target.businessId,
          membershipId: target.id,
          grantedBy: params.userId,
          grantedAt: params.now,
          targetRole: target.role,
        });

        const isNoOp = existing !== undefined && existing.direction === params.direction;

        return {
          membershipId: target.id,
          businessId: target.businessId,
          targetUserId: target.userId,
          otherOverrides,
          existingDirection: existing?.direction,
          newRecord: isNoOp
            ? undefined
            : {
                permissionId: constructed.permissionId,
                direction: constructed.direction,
                grantedBy: constructed.grantedBy,
                grantedAt: constructed.grantedAt,
              },
        };
      },
      apply: (writer, prepared) => {
        const updatedAt = params.now;

        if (prepared.newRecord === undefined) {
          // Same-direction replay (FD-003D-1 idempotence): the target's
          // current override for this permission already matches the
          // requested direction and remains validly constructible under the
          // live role/status just re-checked in `prepare`. No Firestore
          // write, no domain event — a genuine no-op, not merely a
          // client-retry idempotency-key replay (that case is handled
          // separately, by `authorizeAndExecute`'s own shared idempotency
          // wrapper, before this command ever runs again).
          return {
            membershipId: prepared.membershipId,
            businessId: prepared.businessId,
            userId: prepared.targetUserId,
            permissionId: params.permissionId,
            direction: params.direction,
            changed: false,
            updatedAt: updatedAt.toISOString(),
          };
        }

        const newPermissions: readonly PersistedPermissionOverrideRecordFields[] = [
          ...prepared.otherOverrides,
          prepared.newRecord,
        ];
        writeMembershipPermissionOverrides(
          writer,
          db,
          prepared.membershipId,
          newPermissions,
          updatedAt,
        );

        writeOutboxEntry(
          writer,
          db,
          buildStaffPermissionOverrideChangedEvent({
            eventId: params.newId(),
            correlationId: params.correlationId,
            actor,
            occurredAt: updatedAt.toISOString(),
            membershipId: prepared.membershipId,
            businessId: prepared.businessId,
            targetUserId: prepared.targetUserId,
            permissionId: params.permissionId,
            direction: params.direction,
            previousDirection: prepared.existingDirection ?? null,
            administeredBy: params.userId,
          }),
        );

        return {
          membershipId: prepared.membershipId,
          businessId: prepared.businessId,
          userId: prepared.targetUserId,
          permissionId: params.permissionId,
          direction: params.direction,
          changed: true,
          updatedAt: updatedAt.toISOString(),
        };
      },
    },
  });
}
