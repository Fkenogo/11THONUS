/**
 * INVITE command — create a Staff Invitation (`ENG-P2-003B`, Phase E/F).
 *
 * Sequence, per the task's own Phase F requirement ("ENG-P2-004
 * authorization + domain target restriction — not one or the other"):
 *   1. `authorizeAndExecute` evaluates `staff.manage` against the trusted
 *      `(actorUserId, businessId)` membership — the caller's own identity
 *      is never trusted, never client-supplied (`ENG-P2-004B`, consumed
 *      unmodified).
 *   2. Only once that decision allows does `mutation.prepare` apply the
 *      Founder-approved target restriction (FD-5-STAFF, design §11.6.1):
 *      an actor holding `staff.manage` only through an Owner-granted
 *      Manager role may invite `staff` only, never `manager`. An Owner
 *      (`decision.role === "owner"`) may invite either.
 *   3. `mutation.prepare` also enforces the one structural invite-time
 *      invariant that does not require an identity lookup:
 *      `INVITE_ALREADY_PENDING` (design §5.2) — no identity-existence
 *      lookup is performed at invite time (Phase G, avoids
 *      account-enumeration; also structurally impossible under FD-1-STAFF,
 *      since the invitee's identity is not yet known).
 *
 * `DEC-SUB-002` staff-count entitlement (design §16.1 addendum): **not
 * implemented here** — disclosed, non-blocking future integration hook
 * only. `DEC-SUB-002` remains `OPEN_FOUNDER`; this command never invents a
 * plan-limit number.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { authorizeAndExecute, type TransactionWriter } from "../service/authorizeAndExecute";
import type { AuthorizationDecision } from "../evaluator/types";
import {
  createBusinessMembershipInvitation,
  type BusinessMembershipInvitation,
} from "../models/businessMembershipInvitation";
import { computeInvitationExpiresAt } from "../models/invitationPolicy";
import {
  hasPendingInvitationForDeliveryTarget,
  mintInvitationReference,
  writeInvitation,
} from "../repositories/businessMembershipInvitationRepository";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import { buildStaffInvitationCreatedEvent } from "../events/staffInvitationEvents";
import type { EventActor } from "../../../shared/events/domainEvent";
import {
  invitationAlreadyPendingError,
  invitationTargetNotPermittedForActorError,
} from "../models/permissionErrors";

export type CreateStaffInvitationRequest = {
  businessId: string;
  role: string;
  deliveryTarget: { type: string; value: string };
};

export type CreateStaffInvitationParams = {
  /** Server-derived Customer Identity id of the inviting actor — never client-supplied. */
  actorUserId: string;
  idempotencyKey: string;
  correlationId: string;
  actor: EventActor;
  now: Date;
  newId: () => string;
};

export type CreateStaffInvitationOutcome =
  | { outcome: "created"; invitation: BusinessMembershipInvitation }
  | { outcome: "denied"; decision: AuthorizationDecision }
  | { outcome: "duplicate" }
  | { outcome: "in_progress" };

const OPERATION_TYPE = "staffInvitation.create";

function stableRequestHash(actorUserId: string, request: CreateStaffInvitationRequest): string {
  const sortedEntries = Object.keys(request)
    .sort()
    .map((key) => [key, (request as Record<string, unknown>)[key]] as const);
  return `${OPERATION_TYPE}:${actorUserId}:${JSON.stringify(sortedEntries)}`;
}

/**
 * Founder-approved target restriction (FD-5-STAFF, design §11.6.1): a
 * Manager holding `staff.manage` may invite Staff only. An Owner (holding
 * `staff.manage` by the `owner_only` default state) may invite either.
 */
function assertRolePermittedForActor(decision: AuthorizationDecision, targetRole: string): void {
  if (decision.role === "manager" && targetRole === "manager") {
    throw invitationTargetNotPermittedForActorError(decision.role, targetRole);
  }
}

export async function createStaffInvitation(
  db: Firestore,
  request: CreateStaffInvitationRequest,
  params: CreateStaffInvitationParams,
): Promise<CreateStaffInvitationOutcome> {
  const requestHash = stableRequestHash(params.actorUserId, request);
  const invitationId = mintInvitationReference(db);

  const result = await authorizeAndExecute<
    BusinessMembershipInvitation,
    BusinessMembershipInvitation
  >(db, {
    request: {
      userId: params.actorUserId,
      businessId: request.businessId,
      permission: "staff.manage",
    },
    idempotencyKey: params.idempotencyKey,
    requestHash,
    correlationId: params.correlationId,
    actorId: params.actorUserId,
    mutation: {
      async prepare(transaction: Transaction, decision: AuthorizationDecision) {
        assertRolePermittedForActor(decision, request.role);

        const alreadyPending = await hasPendingInvitationForDeliveryTarget(
          db,
          request.businessId,
          request.deliveryTarget,
          transaction,
        );
        if (alreadyPending) {
          throw invitationAlreadyPendingError();
        }

        const invitedAt = params.now;
        return createBusinessMembershipInvitation({
          id: invitationId,
          businessId: request.businessId,
          role: request.role,
          deliveryTarget: request.deliveryTarget,
          invitedBy: params.actorUserId,
          invitedAt,
          expiresAt: computeInvitationExpiresAt(invitedAt),
        });
      },
      apply(writer: TransactionWriter, invitation: BusinessMembershipInvitation) {
        writeInvitation(writer, db, invitation);

        const event = buildStaffInvitationCreatedEvent({
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor: params.actor,
          occurredAt: params.now.toISOString(),
          invitationId: invitation.id,
          businessId: invitation.businessId,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
        });
        writeOutboxEntry(writer, db, event);

        return invitation;
      },
    },
  });

  if (result.outcome === "executed") {
    return { outcome: "created", invitation: result.result };
  }
  if (result.outcome === "denied") {
    return { outcome: "denied", decision: result.decision };
  }
  return { outcome: result.outcome };
}
