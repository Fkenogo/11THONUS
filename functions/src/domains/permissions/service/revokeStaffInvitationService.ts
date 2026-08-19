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
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { authorizeAndExecute, type TransactionWriter } from "../service/authorizeAndExecute";
import type { AuthorizationDecision } from "../evaluator/types";
import {
  transitionInvitationStatus,
  type BusinessMembershipInvitation,
} from "../models/businessMembershipInvitation";
import {
  getInvitationByReference,
  writeInvitation,
} from "../repositories/businessMembershipInvitationRepository";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import { buildStaffInvitationRevokedEvent } from "../events/staffInvitationEvents";
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
        return transitionInvitationStatus(read.invitation, "revoked", { resolvedAt: params.now });
      },
      apply(writer: TransactionWriter, invitation: BusinessMembershipInvitation) {
        writeInvitation(writer, db, invitation);

        const event = buildStaffInvitationRevokedEvent({
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
