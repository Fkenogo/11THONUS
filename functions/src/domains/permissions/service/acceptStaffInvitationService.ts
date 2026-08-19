/**
 * ACCEPT command — consume a Staff Invitation and create the resulting
 * `businessMembership` (`ENG-P2-003B`, Phase L/M/N/O, FD-3-STAFF).
 *
 * **Not gated by `authorizeAndExecute`/`staff.manage`.** Acceptance is
 * self-service (design §8: "None — the invitation is the authority") — the
 * accepting principal has no Business membership yet, so there is no
 * `(userId, businessId)` context for `ENG-P2-004`'s evaluator to resolve
 * against. This command instead implements its own bespoke authority
 * model, exactly the three FD-3-STAFF requirements, and nothing else:
 *
 *   1. an authenticated Customer Identity, resolved **only** from
 *      `params.authenticatedCustomerIdentityId` — the caller (the Cloud
 *      Function boundary) must derive this from AUTH-02's verified
 *      credential-resolution path before calling this command; it is
 *      never read from `request` (there is no such field on
 *      `AcceptInvitationRequest` — `invitationAcceptanceHandoff.ts` proves
 *      this structurally at compile time, `ENG-P2-003A`);
 *   2. a valid invitation proof — the opaque `invitationReference` must
 *      resolve to exactly one `pending`, unexpired invitation;
 *   3. verified entitlement — the accepting identity must hold a
 *      currently-linked `AuthenticationReference` whose verified value
 *      matches the invitation's delivery target
 *      (`invitationEntitlement.ts`).
 *
 * Client-supplied `userId` is structurally impossible to smuggle in: no
 * parameter of this function or of `AcceptInvitationRequest` names a
 * userId the client controls. The membership's `userId` field is always
 * `params.authenticatedCustomerIdentityId` (§ M).
 *
 * **Consistency boundary (§8a, Phase O).** One `db.runTransaction`: all
 * reads (invitation, accepting identity, existing-membership check)
 * precede all writes (membership creation, invitation consumption,
 * outbox), per Firestore's own read-before-write transaction requirement.
 * The transaction body never throws for an ordinary domain-rule failure —
 * it returns a `{ kind: "ok" | "fail" }` result instead, so a "lazily
 * discovered expired" invitation can still have its terminal-state write
 * committed (§9/Phase V) even though the overall ACCEPT attempt fails; any
 * other failure kind performs no write at all, so the transaction commits
 * an effect-free no-op and the caller still observes a clean, fail-closed
 * error. No partial success is possible either way: a membership is never
 * created without the invitation being marked `accepted` in the same
 * transaction, and vice versa (Phase O).
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import {
  createAcceptInvitationRequest,
  type AcceptInvitationRequest,
  type AcceptInvitationResult,
} from "../models/invitationAcceptanceHandoff";
import { transitionInvitationStatus } from "../models/businessMembershipInvitation";
import { invitationRoleAsRole } from "../models/invitationRole";
import { isInvitationPastExpiry } from "../models/invitationPolicy";
import { isEntitledToAcceptInvitation } from "../models/invitationEntitlement";
import {
  getInvitationByReference,
  writeInvitation,
} from "../repositories/businessMembershipInvitationRepository";
import { getBusinessMembershipByUserAndBusiness } from "../repositories/businessMembershipRepository";
import {
  mintBusinessMembershipId,
  writeNewBusinessMembership,
} from "../repositories/businessMembershipWriteRepository";
import { createActiveBusinessMembership } from "../models/businessMembershipWrite";
import { getCustomerIdentityById } from "../../identity/repositories/customerIdentityRepository";
import { IdentityDomainError } from "../../identity/models/identityErrors";
import {
  buildStaffInvitationAcceptedEvent,
  buildStaffMembershipActivatedEvent,
} from "../events/staffInvitationEvents";
import {
  duplicateBusinessMembershipError,
  invitationAcceptanceEntitlementDeniedError,
  invitationAlreadyAcceptedError,
  invitationExpiredError,
  invitationNotFoundError,
  invitationRevokedError,
  membershipReadTransientFailureError,
  PermissionDomainError,
} from "../models/permissionErrors";

export type AcceptStaffInvitationParams = {
  request: AcceptInvitationRequest;
  /** Server-derived Customer Identity id of the authenticated caller — never client-supplied. */
  authenticatedCustomerIdentityId: string;
  idempotencyKey: string;
  correlationId: string;
  actor: EventActor;
  now: Date;
  newId: () => string;
};

const OPERATION_TYPE = "staffInvitation.accept";

type TransactionOutcome =
  { kind: "ok"; result: AcceptInvitationResult } | { kind: "fail"; error: PermissionDomainError };

async function readExistingMembershipStatus(
  db: Firestore,
  userId: string,
  businessId: string,
  transaction: Transaction,
): Promise<"active" | "suspended" | "removed" | "none" | "malformed" | "transient_failure"> {
  const read = await getBusinessMembershipByUserAndBusiness(db, userId, businessId, transaction);
  if (read.kind === "not_found") return "none";
  if (read.kind === "malformed") return "malformed";
  if (read.kind === "transient_failure") return "transient_failure";
  return read.membership.status as "active" | "suspended" | "removed";
}

export async function acceptStaffInvitation(
  db: Firestore,
  params: AcceptStaffInvitationParams,
): Promise<AcceptInvitationResult> {
  const request = createAcceptInvitationRequest(params.request);
  const requestHash = `${OPERATION_TYPE}:${params.authenticatedCustomerIdentityId}:${request.invitationReference}`;

  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: OPERATION_TYPE,
    actorId: params.authenticatedCustomerIdentityId,
    requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return reservation.record.responseSnapshot as AcceptInvitationResult;
  }
  if (reservation.outcome === "in_progress") {
    throw new PermissionDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Invitation acceptance for idempotency key "${params.idempotencyKey}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new PermissionDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const membershipId = mintBusinessMembershipId(db);

  try {
    const outcome = await db.runTransaction<TransactionOutcome>(async (transaction) => {
      // --- Reads ---
      const invitationRead = await getInvitationByReference(
        db,
        request.invitationReference,
        transaction,
      );
      if (invitationRead.kind === "not_found") {
        return { kind: "fail", error: invitationNotFoundError() };
      }
      const invitation = invitationRead.invitation;

      if (invitation.status === "accepted") {
        return { kind: "fail", error: invitationAlreadyAcceptedError() };
      }
      if (invitation.status === "revoked") {
        return { kind: "fail", error: invitationRevokedError() };
      }
      if (invitation.status === "expired") {
        return { kind: "fail", error: invitationExpiredError() };
      }

      // invitation.status === "pending" from here.
      if (isInvitationPastExpiry(invitation.expiresAt, params.now)) {
        // Lazily discovered expiry (§9/Phase V): persist the terminal
        // transition durably now, even though this ACCEPT attempt fails —
        // this is the one branch that writes despite ultimately failing.
        const expired = transitionInvitationStatus(invitation, "expired", {
          resolvedAt: params.now,
        });
        writeInvitation(transaction, db, expired);
        return { kind: "fail", error: invitationExpiredError() };
      }

      let identity;
      try {
        identity = await getCustomerIdentityById(
          db,
          params.authenticatedCustomerIdentityId,
          transaction,
        );
      } catch (error) {
        if (error instanceof IdentityDomainError && error.category === "RESOURCE_NOT_FOUND") {
          // An authenticated principal with no resolvable Customer Identity
          // record is a fail-closed entitlement denial, not a crash.
          return { kind: "fail", error: invitationAcceptanceEntitlementDeniedError() };
        }
        throw error;
      }

      const entitled = isEntitledToAcceptInvitation(
        invitation.deliveryTarget,
        identity.authenticationReferences,
      );
      if (!entitled) {
        return { kind: "fail", error: invitationAcceptanceEntitlementDeniedError() };
      }

      const existingStatus = await readExistingMembershipStatus(
        db,
        params.authenticatedCustomerIdentityId,
        invitation.businessId,
        transaction,
      );
      if (existingStatus === "transient_failure") {
        return { kind: "fail", error: membershipReadTransientFailureError() };
      }
      if (
        existingStatus === "malformed" ||
        existingStatus === "active" ||
        existingStatus === "suspended"
      ) {
        // Blocks active/suspended (a current membership already exists) and
        // fails closed on an unreadable/malformed existing record, rather
        // than risk a silent duplicate. A "removed" (terminal, historical)
        // existing record does NOT block — §5.3's own "REMOVE is
        // non-reversible; re-invited as a fresh record" precedent is
        // exactly this scenario: a removed member re-accepting a new
        // invitation gets a brand-new membership document (new id), the
        // prior removed record staying untouched as history (TRD10's
        // "historical records remain" rule). Disclosed Engineering
        // judgment call — see the implementation report's Phase N note.
        return { kind: "fail", error: duplicateBusinessMembershipError() };
      }

      // --- Writes ---
      const membership = createActiveBusinessMembership({
        id: membershipId,
        userId: params.authenticatedCustomerIdentityId,
        businessId: invitation.businessId,
        role: invitationRoleAsRole(invitation.role),
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt,
        acceptedAt: params.now,
      });
      writeNewBusinessMembership(transaction, db, membership);

      const acceptedInvitation = transitionInvitationStatus(invitation, "accepted", {
        resolvedAt: params.now,
        acceptedMembershipId: membershipId,
      });
      writeInvitation(transaction, db, acceptedInvitation);

      writeOutboxEntry(
        transaction,
        db,
        buildStaffInvitationAcceptedEvent({
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor: params.actor,
          occurredAt: params.now.toISOString(),
          invitationId: invitation.id,
          businessId: invitation.businessId,
          membershipId,
        }),
      );
      writeOutboxEntry(
        transaction,
        db,
        buildStaffMembershipActivatedEvent({
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor: params.actor,
          occurredAt: params.now.toISOString(),
          membershipId,
          businessId: invitation.businessId,
          userId: params.authenticatedCustomerIdentityId,
          role: membership.role,
          invitationId: invitation.id,
        }),
      );

      const result: AcceptInvitationResult = {
        membershipId,
        businessId: invitation.businessId,
        userId: params.authenticatedCustomerIdentityId,
        role: invitation.role,
        acceptedAt: params.now,
      };
      return { kind: "ok", result };
    });

    if (outcome.kind === "fail") {
      throw outcome.error;
    }

    await completeIdempotencyKey(
      db,
      params.idempotencyKey,
      `businessMemberships/${outcome.result.membershipId}`,
      outcome.result,
    );
    return outcome.result;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}
