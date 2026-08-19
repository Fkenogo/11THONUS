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
 * **Permission overrides are never touched (Phase N/O).** This command
 * writes only the `role` field (`writeMembershipRoleChange`) — it never
 * reads, clears, or recalculates `permissions[]`. `ENG-P2-004`'s evaluator
 * already re-checks override role-eligibility (`explicitGrantEligibleRole
 * === role`) against the membership's *current, live* `role` on every
 * evaluation (`evaluatePermission.ts` Step 7) — so a stale override
 * granted while eligible for the old role is automatically no longer
 * honored the moment the role changes, with no cleanup required here. See
 * the implementation report's Phase N/O analysis for the full security
 * review this command's design relies on.
 */

import type { Firestore } from "firebase-admin/firestore";
import { authorizeAndExecute, type AuthorizeAndExecuteResult } from "./authorizeAndExecute";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { getBusinessMembershipById } from "../repositories/businessMembershipRepository";
import { writeMembershipRoleChange } from "../repositories/businessMembershipWriteRepository";
import { isPermittedRoleChangeTarget } from "../models/staffMembershipTargetPolicy";
import { createStaffRoleChangeRequest } from "../models/staffRoleChangeRequest";
import { buildStaffRoleChangedEvent } from "../events/staffMembershipLifecycleEvents";
import {
  membershipCrossBusinessMismatchError,
  membershipReadTransientFailureError,
  roleChangeFromRoleMismatchError,
  roleChangeTargetNotPermittedError,
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

        const targetRead = await getBusinessMembershipById(db, request.membershipId, transaction);
        if (targetRead.kind === "transient_failure") {
          // Distinct from not_found/malformed (Phase AB independent review
          // finding, same as staffMembershipLifecycleCommand.ts) — a
          // transient read failure is retry-safe and must not be reported
          // as "this membership doesn't exist."
          throw membershipReadTransientFailureError();
        }
        if (targetRead.kind === "not_found" || targetRead.kind === "malformed") {
          throw targetMembershipNotFoundError();
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

        return target;
      },
      apply: (writer, target) => {
        const updatedAt = params.now;
        writeMembershipRoleChange(writer, db, target.id, request.toRole, updatedAt);

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
