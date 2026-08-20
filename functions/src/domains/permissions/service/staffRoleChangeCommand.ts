/**
 * ROLE CHANGE command (`ENG-P2-003C`, Phase J/K/L/M).
 *
 * Governed by `staff.assignRole` (`ENG-P2-004-CORR-002`'s catalogue entry —
 * Owner-only, non-delegable: `explicitGrantRequired: false`,
 * `explicitGrantEligibleRole: null`, `explicitRevocationSupported: false`),
 * evaluated exclusively through `authorizeAndExecute`, exactly the same
 * consumption discipline `staffMembershipLifecycleCommand.ts` uses for
 * `staff.manage` — this file never re-implements or duplicates the
 * catalogue's Owner-only rule locally (Phase K's explicit instruction).
 *
 * Consumes `staffRoleChangeRequest.ts` (`ENG-P2-003A`, unmodified) for the
 * request's own structural validation (`fromRole !== toRole`, both in
 * `{"manager","staff"}`) and `staffMembershipTargetPolicy.ts`'s
 * `isPermittedRoleChangeTarget` (unmodified) for Owner-target exclusion
 * (Phase M) and self-role-change exclusion (Phase L) — the latter enforced
 * structurally via server-computed `isSelfAction`, not a client flag, so
 * the invariant holds even if authority policy ever changes to allow a
 * non-Owner actor (Phase L's explicit forward-compatibility requirement).
 *
 * **TOCTOU-safe `fromRole` re-check (Phase Q).** The request's `fromRole`
 * is re-validated against the target membership's *live*, transaction-read
 * role — not merely the caller's possibly-stale belief — before any write.
 * A mismatch fails closed (`roleChangeFromRoleMismatchError`,
 * `INVALID_STATE_TRANSITION`) rather than silently applying `toRole`
 * regardless of the membership's actual current role.
 *
 * **Permission-override reconciliation (`ENG-P2-003C-CORR-001`, Founder
 * policy: "fresh elevated authority requires fresh authorization").** An
 * earlier version of this command left `permissions[]` untouched, relying
 * solely on `ENG-P2-004`'s evaluator re-checking role-eligibility live on
 * every call. That left a stale, structurally-invalid override *persisted*
 * in `permissions[]` after a demotion — inert only until a later promotion
 * happened to restore the exact role the stale override was originally
 * eligible for, at which point it silently became effective again with no
 * fresh authorization action. `ENG-P2-003E`'s integration validation
 * empirically confirmed this round-trip. This command now reconciles
 * `permissions[]` against the NEW role in the same transaction as the role
 * mutation (`reconcilePermissionOverridesForRoleChange`,
 * `ENG-P2-004A`'s own `createPermissionOverride` reused unmodified as the
 * sole validity authority — no new validity rule invented, no evaluator
 * change). A grant is role-scoped and is removed if it no longer matches
 * the new role; a revoke has no role dependency in the existing contract
 * and is always retained. `permissions[]` remains CURRENT configuration
 * only (FD-003D-1) — historical evidence of a removed override lives in
 * this command's own `StaffRoleChanged` event (`overridesRemoved`, ids
 * only), not in a stale current-config record.
 */

import type { Firestore } from "firebase-admin/firestore";
import { authorizeAndExecute, type AuthorizeAndExecuteResult } from "./authorizeAndExecute";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { getBusinessMembershipWithRawOverridesById } from "../repositories/permissionOverrideAdminRepository";
import { writeMembershipRoleChangeWithOverrideReconciliation } from "../repositories/businessMembershipWriteRepository";
import { isPermittedRoleChangeTarget } from "../models/staffMembershipTargetPolicy";
import { createStaffRoleChangeRequest } from "../models/staffRoleChangeRequest";
import { reconcilePermissionOverridesForRoleChange } from "../models/staffRoleChangeOverrideReconciliation";
import { buildStaffRoleChangedEvent } from "../events/staffMembershipLifecycleEvents";
import {
  membershipCrossBusinessMismatchError,
  membershipReadTransientFailureError,
  roleChangeFromRoleMismatchError,
  roleChangeTargetNotPermittedError,
  targetMembershipConfigMalformedError,
  targetMembershipNotFoundError,
} from "../models/permissionErrors";

const PERMISSION = "staff.assignRole";

export type ChangeStaffMembershipRoleCommandParams = {
  /** The authenticated actor's own userId — never client-supplied as "target". */
  userId: string;
  businessId: string;
  targetMembershipId: string;
  fromRole: "manager" | "staff";
  toRole: "manager" | "staff";
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  now: Date;
  newId: () => string;
};

export type ChangeStaffMembershipRoleResult = {
  membershipId: string;
  businessId: string;
  userId: string;
  fromRole: string;
  toRole: string;
  updatedAt: string;
};

export async function changeStaffMembershipRoleCommand(
  db: Firestore,
  params: ChangeStaffMembershipRoleCommandParams,
): Promise<AuthorizeAndExecuteResult<ChangeStaffMembershipRoleResult>> {
  // Structural validation (fromRole !== toRole, both governed roles) —
  // consumes ENG-P2-003A's contract unmodified, throws before any
  // authorization read if the request itself is malformed.
  const request = createStaffRoleChangeRequest({
    businessId: params.businessId,
    membershipId: params.targetMembershipId,
    fromRole: params.fromRole,
    toRole: params.toRole,
    requestedBy: params.userId,
  });

  const actor: EventActor = { actorType: "user", actorId: params.userId };

  return authorizeAndExecute(db, {
    request: { userId: params.userId, businessId: params.businessId, permission: PERMISSION },
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
    actorId: params.userId,
    mutation: {
      prepare: async (transaction, decision) => {
        const actorRole = decision.role;
        if (!actorRole) {
          // Structurally unreachable (see staffMembershipLifecycleCommand.ts's
          // identical note) — fails closed rather than assuming a role.
          throw roleChangeTargetNotPermittedError();
        }

        // ENG-P2-003C-CORR-001: a single transaction read of the target
        // resolves both the evaluator-shaped membership (for the target-
        // policy/fromRole checks below, unchanged) and the FULL raw
        // `permissions[]` records (grantedBy/grantedAt included) needed to
        // reconcile and rewrite them — reusing 003D's existing repository
        // function unmodified rather than a second read of the same doc.
        const targetRead = await getBusinessMembershipWithRawOverridesById(
          db,
          request.membershipId,
          transaction,
        );
        if (targetRead.kind === "transient_failure") {
          // Distinct from not_found/malformed (Phase AB independent review
          // finding, same as staffMembershipLifecycleCommand.ts) — a
          // transient read failure is retry-safe and must not be reported
          // as "this membership doesn't exist."
          throw membershipReadTransientFailureError();
        }
        if (targetRead.kind === "not_found") {
          throw targetMembershipNotFoundError();
        }
        if (targetRead.kind === "malformed") {
          // Matches the malformed-target mapping `staffPermissionOverrideCommand.ts`
          // already uses for the same read shape (AUTH_FORBIDDEN) —
          // deliberately not `targetMembershipNotFoundError`'s
          // RESOURCE_NOT_FOUND, which is reserved for "no document exists."
          throw targetMembershipConfigMalformedError();
        }
        const target = targetRead.membership;

        if (target.businessId !== params.businessId) {
          throw membershipCrossBusinessMismatchError();
        }

        const isSelfAction = target.userId === params.userId;
        if (!isPermittedRoleChangeTarget(actorRole, target.role, isSelfAction)) {
          throw roleChangeTargetNotPermittedError();
        }

        if (target.role !== request.fromRole) {
          throw roleChangeFromRoleMismatchError();
        }

        const reconciliation = reconcilePermissionOverridesForRoleChange(targetRead.rawOverrides, {
          businessId: target.businessId,
          membershipId: target.id,
          newRole: request.toRole,
        });

        return { target, reconciliation };
      },
      apply: (writer, { target, reconciliation }) => {
        const updatedAt = params.now;
        writeMembershipRoleChangeWithOverrideReconciliation(
          writer,
          db,
          target.id,
          request.toRole,
          reconciliation.retained,
          updatedAt,
        );

        writeOutboxEntry(
          writer,
          db,
          buildStaffRoleChangedEvent({
            eventId: params.newId(),
            correlationId: params.correlationId,
            actor,
            occurredAt: updatedAt.toISOString(),
            membershipId: target.id,
            businessId: target.businessId,
            userId: target.userId,
            fromRole: request.fromRole,
            toRole: request.toRole,
            changedBy: params.userId,
            overridesRemoved: reconciliation.removed.map((o) => o.permissionId),
          }),
        );

        return {
          membershipId: target.id,
          businessId: target.businessId,
          userId: target.userId,
          fromRole: request.fromRole,
          toRole: request.toRole,
          updatedAt: updatedAt.toISOString(),
        };
      },
    },
  });
}
