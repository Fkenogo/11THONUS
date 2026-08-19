/**
 * REVOKE command — cancel a still-pending Staff Invitation (`ENG-P2-003B`,
 * Phase K).
 *
 * `staff.manage`-gated via `authorizeAndExecute`, identical authorization
 * shape to INVITE. Cross-business isolation (Phase K/§13): the invitation
 * must belong to the *requested* `businessId` — a `businessId` mismatch is
 * treated identically to "not found" (fail-closed, never confirms the
 * invitation's existence in a different Business to an unauthorized
 * caller). Terminal invitations are never hard-deleted (§7.2a) — REVOKE
 * only transitions a `pending` invitation; replaying REVOKE against an
 * already-terminal invitation with a *fresh* idempotency key fails closed
 * with `INVALID_STATE_TRANSITION` (a genuine state conflict, distinct from
 * idempotent replay of the *same* key, which the shared idempotency layer
 * already handles beneath this command without re-executing it).
 *
 * **Expiry precedence (independent-review correction).** A `pending`
 * invitation whose `expiresAt` has already passed is, in truth, already
 * `expired` — FD-4-STAFF's "incapable of acceptance after expiry" is a
 * fact about the invitation's own timeline, not something a later REVOKE
 * call gets to overwrite by recording a "revoked" decision no one actually
 * made in time. This command checks expiry *before* transitioning: a
 * past-due `pending` invitation is reclassified to `expired` (not
 * `revoked`) — the actor's underlying goal (the invitation must no longer
 * be acceptable) is still achieved, but the persisted terminal state and
 * its outbox evidence honestly reflect why.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { authorizeAndExecute, type TransactionWriter } from "../service/authorizeAndExecute";
import type { AuthorizationDecision } from "../evaluator/types";
import {
  transitionInvitationStatus,
  type BusinessMembershipInvitation,
} from "../models/businessMembershipInvitation";
import { isInvitationPastExpiry } from "../models/invitationPolicy";
import {
  getInvitationByReference,
  writeInvitation,
} from "../repositories/businessMembershipInvitationRepository";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import {
  buildStaffInvitationExpiredEvent,
  buildStaffInvitationRevokedEvent,
} from "../events/staffInvitationEvents";
import type { EventActor } from "../../../shared/events/domainEvent";
import {
  invitationCrossBusinessMismatchError,
  invitationNotFoundError,
} from "../models/permissionErrors";

export type RevokeStaffInvitationRequest = {
  businessId: string;
  invitationId: string;
};

export type RevokeStaffInvitationParams = {
  actorUserId: string;
  idempotencyKey: string;
  correlationId: string;
  actor: EventActor;
  now: Date;
  newId: () => string;
};

export type RevokeStaffInvitationOutcome =
  | { outcome: "revoked"; invitation: BusinessMembershipInvitation }
  | { outcome: "denied"; decision: AuthorizationDecision }
  | { outcome: "duplicate" }
  | { outcome: "in_progress" };

const OPERATION_TYPE = "staffInvitation.revoke";

function stableRequestHash(actorUserId: string, request: RevokeStaffInvitationRequest): string {
  const sortedEntries = Object.keys(request)
    .sort()
    .map((key) => [key, (request as Record<string, unknown>)[key]] as const);
  return `${OPERATION_TYPE}:${actorUserId}:${JSON.stringify(sortedEntries)}`;
}

export async function revokeStaffInvitation(
  db: Firestore,
  request: RevokeStaffInvitationRequest,
  params: RevokeStaffInvitationParams,
): Promise<RevokeStaffInvitationOutcome> {
  const requestHash = stableRequestHash(params.actorUserId, request);

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
      async prepare(transaction: Transaction) {
        const read = await getInvitationByReference(db, request.invitationId, transaction);
        if (read.kind === "not_found") {
          throw invitationNotFoundError();
        }
        if (read.invitation.businessId !== request.businessId) {
          // Never distinguishes "exists in another Business" from "does not
          // exist at all" to the caller — both fail closed identically.
          throw invitationCrossBusinessMismatchError();
        }
        if (
          read.invitation.status === "pending" &&
          isInvitationPastExpiry(read.invitation.expiresAt, params.now)
        ) {
          // Expiry precedence — see the module comment. Reclassify to
          // `expired`, never `revoked`.
          return transitionInvitationStatus(read.invitation, "expired", {
            resolvedAt: params.now,
          });
        }
        return transitionInvitationStatus(read.invitation, "revoked", { resolvedAt: params.now });
      },
      apply(writer: TransactionWriter, invitation: BusinessMembershipInvitation) {
        writeInvitation(writer, db, invitation);

        const event =
          invitation.status === "expired"
            ? buildStaffInvitationExpiredEvent({
                eventId: params.newId(),
                correlationId: params.correlationId,
                actor: params.actor,
                occurredAt: params.now.toISOString(),
                invitationId: invitation.id,
                businessId: invitation.businessId,
              })
            : buildStaffInvitationRevokedEvent({
                eventId: params.newId(),
                correlationId: params.correlationId,
                actor: params.actor,
                occurredAt: params.now.toISOString(),
                invitationId: invitation.id,
                businessId: invitation.businessId,
                revokedBy: params.actorUserId,
              });
        writeOutboxEntry(writer, db, event);

        return invitation;
      },
    },
  });

  if (result.outcome === "executed") {
    return { outcome: "revoked", invitation: result.result };
  }
  if (result.outcome === "denied") {
    return { outcome: "denied", decision: result.decision };
  }
  return { outcome: result.outcome };
}
