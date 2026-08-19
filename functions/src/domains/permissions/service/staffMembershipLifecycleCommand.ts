/**
 * SUSPEND / REACTIVATE / REMOVE commands (`ENG-P2-003C`).
 *
 * Governed by `staff.manage` (`ENG-P2-004A`'s existing catalogue entry),
 * evaluated exclusively through `authorizeAndExecute` (`ENG-P2-004D`) — this
 * file never re-implements or locally short-circuits that evaluation
 * (Phase E). `authorizeAndExecute` already supplies: the TOCTOU-safe single
 * transaction boundary (Phase Q), the shared idempotency
 * reserve/complete/fail pattern (Phase S), and the mandatory sensitive-
 * decision audit write (`ENG-P2-004C`, unconditional and separate from the
 * domain events this file writes).
 *
 * What this file *does* own, layered on top of that trusted `staff.manage`
 * grant, exactly per `ENG-P2-003-DESIGN-001` §11.6.1/§12/FD-5-STAFF:
 *
 *   1. resolve the **target** membership by `membershipId` — a different
 *      membership than the actor's own (`getBusinessMembershipById`,
 *      `ENG-P2-003C`'s additive read function);
 *   2. cross-business isolation (Phase V, §13): the target's own
 *      `businessId` must equal the authorized Business context — a
 *      membership id alone is never authority;
 *   3. `staffMembershipTargetPolicy.ts`'s pure `isPermittedStaffManagementTarget`
 *      predicate (already-merged `ENG-P2-003A` contract, consumed
 *      unmodified) — Owner protection (Phase H) and self-action protection
 *      (Phase I) both fall out of this one predicate plus the
 *      server-computed `isSelfAction` below, never a client-supplied flag;
 *   4. `staffMembershipLifecycle.ts`'s closed transition table — the
 *      target's current status must structurally permit the requested
 *      action.
 *
 * **Self-action (Phase I).** `isSelfAction` is computed by comparing the
 * *resolved* target membership's `userId` against the *authenticated*
 * actor's own `userId` (`params.userId`, the same trusted value
 * `authorizeAndExecute`'s evaluator already used to resolve the actor's own
 * membership) — never a client-supplied boolean or a comparison against a
 * client-supplied "target userId" field (there is no such field; the
 * client supplies only a `membershipId`).
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { authorizeAndExecute, type AuthorizeAndExecuteResult } from "./authorizeAndExecute";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { getBusinessMembershipById } from "../repositories/businessMembershipRepository";
import {
  writeMembershipLifecycleTransition,
  writeMembershipRemoval,
} from "../repositories/businessMembershipWriteRepository";
import { isPermittedStaffManagementTarget } from "../models/staffMembershipTargetPolicy";
import {
  isPermittedLifecycleTransition,
  type StaffLifecycleAction,
} from "../models/staffMembershipLifecycle";
import type { EvaluationBusinessMembership } from "../evaluator/types";
import type { Role } from "../models/role";
import {
  buildStaffMembershipSuspendedEvent,
  buildStaffMembershipReactivatedEvent,
  buildStaffMembershipRemovedEvent,
} from "../events/staffMembershipLifecycleEvents";
import {
  invalidMembershipLifecycleTransitionError,
  membershipCrossBusinessMismatchError,
  staffManagementTargetNotPermittedError,
  targetMembershipNotFoundError,
} from "../models/permissionErrors";

const PERMISSION = "staff.manage";

export type StaffMembershipLifecycleCommandParams = {
  /** The authenticated actor's own userId — never client-supplied as "target". */
  userId: string;
  businessId: string;
  /** The membership being suspended/reactivated/removed — distinct from the actor's own membership. */
  targetMembershipId: string;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  now: Date;
  newId: () => string;
};

export type StaffMembershipLifecycleResult = {
  membershipId: string;
  businessId: string;
  userId: string;
  role: string;
  status: "active" | "suspended" | "removed";
  updatedAt: string;
};

async function resolveAuthorizedTarget(
  db: Firestore,
  transaction: Transaction,
  params: StaffMembershipLifecycleCommandParams,
  actorRole: Role,
  action: StaffLifecycleAction,
): Promise<EvaluationBusinessMembership> {
  const targetRead = await getBusinessMembershipById(db, params.targetMembershipId, transaction);
  if (
    targetRead.kind === "not_found" ||
    targetRead.kind === "malformed" ||
    targetRead.kind === "transient_failure"
  ) {
    throw targetMembershipNotFoundError();
  }
  const target = targetRead.membership;

  if (target.businessId !== params.businessId) {
    throw membershipCrossBusinessMismatchError();
  }

  const isSelfAction = target.userId === params.userId;
  if (!isPermittedStaffManagementTarget(actorRole, target.role, isSelfAction)) {
    throw staffManagementTargetNotPermittedError();
  }

  if (!isPermittedLifecycleTransition(target.status, action)) {
    throw invalidMembershipLifecycleTransitionError(target.status, action);
  }

  return target;
}

async function runLifecycleCommand(
  db: Firestore,
  action: StaffLifecycleAction,
  params: StaffMembershipLifecycleCommandParams,
): Promise<AuthorizeAndExecuteResult<StaffMembershipLifecycleResult>> {
  const actor: EventActor = { actorType: "user", actorId: params.userId };

  return authorizeAndExecute(db, {
    request: { userId: params.userId, businessId: params.businessId, permission: PERMISSION },
    idempotencyKey: params.idempotencyKey,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
    actorId: params.userId,
    mutation: {
      prepare: async (transaction, decision) => {
        const role = decision.role;
        if (!role) {
          // Structurally unreachable: an `allowed` decision always carries
          // the actor's resolved role (evaluator contract, §6.2). Fails
          // closed rather than assuming a role if it somehow were absent.
          throw staffManagementTargetNotPermittedError();
        }
        return resolveAuthorizedTarget(db, transaction, params, role, action);
      },
      apply: (writer, target) => {
        const updatedAt = params.now;

        if (action === "remove") {
          writeMembershipRemoval(writer, db, target.id, updatedAt);
        } else {
          const status = action === "suspend" ? "suspended" : "active";
          writeMembershipLifecycleTransition(writer, db, target.id, status, updatedAt);
        }

        const eventEnvelope = {
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor,
          occurredAt: updatedAt.toISOString(),
          membershipId: target.id,
          businessId: target.businessId,
          userId: target.userId,
          role: target.role,
        };

        if (action === "suspend") {
          writeOutboxEntry(
            writer,
            db,
            buildStaffMembershipSuspendedEvent({ ...eventEnvelope, suspendedBy: params.userId }),
          );
        } else if (action === "reactivate") {
          writeOutboxEntry(
            writer,
            db,
            buildStaffMembershipReactivatedEvent({
              ...eventEnvelope,
              reactivatedBy: params.userId,
            }),
          );
        } else {
          writeOutboxEntry(
            writer,
            db,
            buildStaffMembershipRemovedEvent({ ...eventEnvelope, removedBy: params.userId }),
          );
        }

        const status: "active" | "suspended" | "removed" =
          action === "suspend" ? "suspended" : action === "reactivate" ? "active" : "removed";

        return {
          membershipId: target.id,
          businessId: target.businessId,
          userId: target.userId,
          role: target.role,
          status,
          updatedAt: updatedAt.toISOString(),
        };
      },
    },
  });
}

export async function suspendStaffMembershipCommand(
  db: Firestore,
  params: StaffMembershipLifecycleCommandParams,
): Promise<AuthorizeAndExecuteResult<StaffMembershipLifecycleResult>> {
  return runLifecycleCommand(db, "suspend", params);
}

export async function reactivateStaffMembershipCommand(
  db: Firestore,
  params: StaffMembershipLifecycleCommandParams,
): Promise<AuthorizeAndExecuteResult<StaffMembershipLifecycleResult>> {
  return runLifecycleCommand(db, "reactivate", params);
}

export async function removeStaffMembershipCommand(
  db: Firestore,
  params: StaffMembershipLifecycleCommandParams,
): Promise<AuthorizeAndExecuteResult<StaffMembershipLifecycleResult>> {
  return runLifecycleCommand(db, "remove", params);
}
