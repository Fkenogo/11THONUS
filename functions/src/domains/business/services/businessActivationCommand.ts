/**
 * Platform-Administrator-authorized Business activation
 * (`PLATFORM-BASELINE-003`, `FD-BUS-ACT-001`).
 *
 * The one governed way a Business enters `trial`: a fixed-target
 * `pending_verification → trial` transition executed only by an authorized
 * Platform Administrator, with the current Terms revalidated inside the
 * same transaction. Reuses the structural state machine
 * (`transitionBusinessStatus`, `ENG-P2-002A`, unchanged), the shared
 * Terms-precondition helper (`assertCurrentBusinessTermsAccepted`,
 * `ENG-P3-002A`, unchanged), the lifecycle event/outbox convention
 * (`buildBusinessLifecycleChangedEvent`), and the shared idempotency
 * facility — the same composition shape `submitBusinessForVerification`
 * uses, minus its Owner-RBAC authorization.
 *
 * Authority model (deliberately not Business RBAC): this command never
 * reads memberships, roles, or the Business permission evaluator, so no
 * Business-scoped permission — owner, manager, staff, or otherwise — can
 * ever grant activation, and `business.activate` is not added to the
 * ordinary permission catalogue. Authority derives exclusively from the
 * Platform Administration domain: an existing `platformAdministrators`
 * record in `active` status for the server-resolved caller id (the same
 * record and the same status test `evaluateKnowledgePlatformPermission`
 * and `discoverPlatformAdministrator` use, so the three cannot disagree
 * about who is a functioning administrator) plus genuinely verified
 * second-factor evidence (`verifiedMfaSatisfied`, derived by the transport
 * via `deriveVerifiedMfaSatisfied` — never a persisted flag, never a
 * client claim). No finer role scoping is applied: only the Knowledge
 * Studio MVP roles are activated (`FD-KS-1`), and inventing a
 * business-operations administrator role or permission would require its
 * own Founder disposition — role-scoping activation further awaits that,
 * and is explicitly not inferred here.
 *
 * Denial is a normal outcome (`denied`), not an exception — mirroring the
 * sibling lifecycle commands' contract (`submitBusinessForVerification` /
 * `closeBusiness` return `authorizeAndExecute`'s denied outcome rather
 * than throwing on authorization failure). A single, enumeration-resistant
 * reason covers every denial cause (no record, non-active record,
 * malformed record, missing MFA evidence). The committed activation is
 * audited through the Business lifecycle event (actor = the Platform
 * Administrator, from/to statuses, timestamps, correlation/event ids) —
 * no platform-audit-vocabulary change (that vocabulary is closed) and no
 * second audit system.
 *
 * `PLATFORM-BASELINE-003-CORR-001`: a successful activation's idempotency
 * completion (`completeIdempotencyKeyInTransaction`) is staged inside the
 * same transaction as the Business transition and its lifecycle event, so
 * the three commit or abort together — a same-key retry after a committed
 * activation can only ever observe "duplicate", never a false
 * "failed"/retryable state from a bookkeeping write that happened to run
 * after a Business mutation had already landed.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  completeIdempotencyKeyInTransaction,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { AuthorizeAndExecuteError } from "../../permissions/service/authorizeAndExecute";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { transitionBusinessStatus, type Business } from "../models/business";
import {
  businessNotFoundError,
  invalidBusinessStatusTransitionError,
} from "../models/businessErrors";
import { buildBusinessLifecycleChangedEvent } from "../events/businessEvents";
import { readBusinessById, writeBusinessUpdate } from "../repositories/businessRepository";
import { assertCurrentBusinessTermsAccepted } from "./businessLifecycleCommand";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../../platformAdministration/repositories/platformAdministratorRepository";
import { fromPlatformAdministratorDocument } from "../../platformAdministration/repositories/platformAdministratorDocument";

const OPERATION_TYPE = "business.activateAfterVerification";

/** Fixed target — never client input (mirrors the sibling commands' fixed targets). */
const TARGET_STATUS = "trial" as const;

export type ActivateBusinessAfterVerificationParams = {
  /** Server-resolved caller id (from the verified credential) — never client-supplied. */
  adminUserId: string;
  /** Genuinely verified second-factor evidence for this request — never a persisted flag. */
  verifiedMfaSatisfied: boolean;
  businessId: string;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  now: Date;
  newId: () => string;
  /**
   * Test-only interleaving hook for the real TOCTOU proof — never supplied
   * by the transport layer (mirrors `submitBusinessForVerification`'s seam).
   */
  testOnlyAfterTermsVersionReadHook?: () => Promise<void>;
  /**
   * Test-only hook (`PLATFORM-BASELINE-003-CORR-001`) that fires after the
   * Business transition, its lifecycle event, and the idempotency
   * completion have all been staged in this transaction but before it
   * returns — never supplied by the transport layer. Throwing here aborts
   * the transaction, proving the atomic-completion invariant: none of the
   * three staged writes survive independently of the others.
   */
  testOnlyBeforeCommitHook?: () => Promise<void>;
};

export type ActivateBusinessAfterVerificationResult = {
  businessId: string;
  status: typeof TARGET_STATUS;
  updatedAt: string;
};

/** Single, enumeration-resistant denial reason for every authorization failure cause. */
export type BusinessActivationDenyReason = "NOT_PLATFORM_ADMINISTRATOR";

export type ActivateBusinessAfterVerificationOutcome =
  | {
      readonly outcome: "executed";
      readonly result: ActivateBusinessAfterVerificationResult;
    }
  | { readonly outcome: "denied"; readonly reason: BusinessActivationDenyReason }
  | { readonly outcome: "duplicate" }
  | { readonly outcome: "in_progress" };

/**
 * Reads the caller's administrator record inside the caller's own
 * transaction (no evaluate-then-actuate gap) and decides authorization
 * from authoritative state: record exists, parses, is `active`, and this
 * request carries verified second-factor evidence. Malformed records deny
 * (fail closed as unknown, mirroring the discovery boundary's posture).
 */
function isAuthorizedPlatformAdministrator(
  raw: FirebaseFirestore.DocumentData | undefined,
  adminUserId: string,
  verifiedMfaSatisfied: boolean,
): boolean {
  if (!raw) return false;
  const administrator = fromPlatformAdministratorDocument(adminUserId, raw);
  if (!administrator) return false;
  if (administrator.status !== "active") return false;
  if (verifiedMfaSatisfied !== true) return false;
  return true;
}

export async function activateBusinessAfterVerificationCommand(
  db: Firestore,
  params: ActivateBusinessAfterVerificationParams,
): Promise<ActivateBusinessAfterVerificationOutcome> {
  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: OPERATION_TYPE,
    actorId: params.adminUserId,
    requestHash: params.requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return { outcome: "duplicate" };
  }
  if (reservation.outcome === "in_progress") {
    return { outcome: "in_progress" };
  }
  if (reservation.outcome === "conflict") {
    throw new AuthorizeAndExecuteError(reservation.error.code, reservation.error.messageKey);
  }

  try {
    const result = await db.runTransaction(async (transaction: Transaction) => {
      // Phase 1 — platform-administrator gate, first: a denied caller never
      // reaches Business or Terms state (no existence/status leakage).
      const adminSnapshot = await transaction.get(
        db.collection(PLATFORM_ADMINISTRATORS_COLLECTION).doc(params.adminUserId),
      );
      if (
        !isAuthorizedPlatformAdministrator(
          adminSnapshot.data(),
          params.adminUserId,
          params.verifiedMfaSatisfied,
        )
      ) {
        return { outcome: "denied", reason: "NOT_PLATFORM_ADMINISTRATOR" } as const;
      }

      // Phase 2 — Business existence and exact pending status, read-only.
      const business: Business | null = await readBusinessById(transaction, db, params.businessId);
      if (!business) {
        throw businessNotFoundError(params.businessId);
      }
      if (business.status !== "pending_verification") {
        throw invalidBusinessStatusTransitionError(business.status, TARGET_STATUS);
      }

      // Phase 3 — current Terms revalidation in the same transaction
      // (TOCTOU: version read + acceptance read + status write commit or
      // abort together; a concurrent Terms-version change forces a retry
      // that observes the new version).
      await assertCurrentBusinessTermsAccepted(
        transaction,
        db,
        business,
        params.testOnlyAfterTermsVersionReadHook,
      );

      // Phase 4 — writes only: the transition, its audit event, and the
      // idempotency completion, all staged in this one transaction
      // (`PLATFORM-BASELINE-003-CORR-001`) so a commit makes all three
      // durable together and an abort makes none of them durable — a
      // same-key retry after a committed activation can therefore only ever
      // observe "duplicate", never a false "failed"/retryable state.
      const actor: EventActor = { actorType: "user", actorId: params.adminUserId };
      const { business: updated } = transitionBusinessStatus(business, TARGET_STATUS, {
        updatedAt: params.now,
      });
      writeBusinessUpdate(transaction, db, updated);
      writeOutboxEntry(
        transaction,
        db,
        buildBusinessLifecycleChangedEvent({
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor,
          occurredAt: params.now.toISOString(),
          businessId: params.businessId,
          fromStatus: business.status,
          toStatus: updated.status,
        }),
      );
      completeIdempotencyKeyInTransaction(transaction, db, params.idempotencyKey);

      if (params.testOnlyBeforeCommitHook) {
        await params.testOnlyBeforeCommitHook();
      }

      return {
        outcome: "executed",
        result: {
          businessId: updated.id,
          status: TARGET_STATUS,
          updatedAt: updated.updatedAt.toISOString(),
        },
      } as const;
    });

    if (result.outcome === "denied") {
      // Denial never mutates Business state, so this bookkeeping write
      // carries none of the atomicity concern Phase 4 addresses above —
      // unchanged from before this correction.
      await completeIdempotencyKey(db, params.idempotencyKey);
    }
    return result;
  } catch (error) {
    // Reached only when the activation transaction itself failed to
    // commit (including a thrown `testOnlyBeforeCommitHook`) — a
    // committed success can no longer land here, since its idempotency
    // completion is now staged inside that same transaction.
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}
