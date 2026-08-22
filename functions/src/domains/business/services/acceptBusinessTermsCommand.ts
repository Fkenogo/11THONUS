/**
 * `acceptBusinessTerms` command (`ENG-P3-002A`, design §37.6/§37.8/§37.9,
 * §Phase T of the task spec).
 *
 * Server sequence, exactly as design §37 Phase T specifies:
 *   1. the caller is already authenticated by the time this command runs
 *      (`resolveAuthenticatedBusinessActor`, at the callable boundary);
 *   2. the accepting Customer Identity is the server-resolved `userId` —
 *      never a request field (§37.8, non-negotiable);
 *   3. `resolveAuthorizedBusinessForOwnerAction` re-derives and enforces
 *      Owner-only authority over `businessId` from the caller's live
 *      membership — a Manager/Staff member, or an unrelated identity,
 *      cannot accept Terms on this Business's behalf (§37.8);
 *   4. the currently-required Terms version is read from
 *      `businessTermsConfig.ts` — server-authoritative, never client-input
 *      (§37.5/Phase Q) — fails closed if unconfigured (§37.9);
 *   5. `getOrCreateBusinessTermsAcceptanceInTransaction` writes (or
 *      idempotently reuses) the immutable acceptance record (§37.3/§Phase S);
 *   6. a bounded confirmation is returned, including the accepted version.
 *
 * No lifecycle transition occurs here (§Phase T) — this command never
 * touches `Business.status`.
 *
 * TOCTOU (§37/Phase V, `ENG-P3-002A` independent review correction): the
 * current-Terms-version read is a `transaction.get()` against
 * `platformConfig/businessTerms` (`businessTermsConfigRepository.ts`) —
 * not a `process.env` read — so it is a real member of this transaction's
 * Firestore read set. A concurrent write to that document before this
 * transaction commits forces Firestore to retry the whole transaction body,
 * which re-reads the new version. This is what actually makes "the
 * current-Terms-version read and the acceptance write happen inside the
 * same transaction" a TOCTOU guarantee rather than just true-but-irrelevant
 * co-location.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { buildBusinessTermsAcceptedEvent } from "../events/businessEvents";
import { resolveAuthorizedBusinessForOwnerAction } from "./businessCallerAuthority";
import { getOrCreateBusinessTermsAcceptanceInTransaction } from "../repositories/businessTermsAcceptanceRepository";
import { getCurrentlyRequiredBusinessTermsVersionInTransaction } from "../repositories/businessTermsConfigRepository";
import {
  businessTermsConfigurationUnavailableError,
  businessTermsAcceptanceInProgressError,
} from "../models/businessErrors";
import { BusinessDomainError } from "../models/businessErrors";
import type { LanguageCode } from "../../commerceKnowledge/models/languageCode";
import {
  isSupportedLanguageCode,
  DEFAULT_LANGUAGE_CODE,
} from "../../commerceKnowledge/models/languageCode";

const OPERATION_TYPE = "business.acceptTerms";

export type AcceptBusinessTermsParams = {
  /** Server-resolved authenticated Customer Identity — never client-supplied. */
  userId: string;
  businessId: string;
  /** UI presentation language (§37.3 `languageCode`) — not an authority claim. */
  languageCode?: string;
  collectionMethod?: string;
  idempotencyKey: string;
  correlationId: string;
  now: Date;
  newId: () => string;
  /**
   * Test-only interleaving hook for the real TOCTOU proof — never supplied
   * by `index.ts`'s transport layer. See `businessTermsConfigRepository.ts`.
   */
  testOnlyAfterTermsVersionReadHook?: () => Promise<void>;
};

export type AcceptBusinessTermsResult = {
  businessId: string;
  termsVersion: string;
  acceptedAt: string;
  alreadyAccepted: boolean;
};

function stableRequestHash(userId: string, businessId: string): string {
  return `${OPERATION_TYPE}:${userId}:${businessId}`;
}

function resolveLanguageCode(value: string | undefined): LanguageCode {
  if (value && isSupportedLanguageCode(value)) return value;
  return DEFAULT_LANGUAGE_CODE;
}

export async function acceptBusinessTermsCommand(
  db: Firestore,
  params: AcceptBusinessTermsParams,
): Promise<AcceptBusinessTermsResult> {
  // Request-shape idempotency binds only (userId, businessId) — the
  // *content* being accepted is never client-controlled (the server
  // resolves `termsVersion` itself, §37.5), so there is no additional
  // client-supplied field whose drift could indicate "a materially
  // different request" the way `createBusiness`'s full-field hash does.
  const requestHash = stableRequestHash(params.userId, params.businessId);

  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: OPERATION_TYPE,
    actorId: params.userId,
    requestHash,
    correlationId: params.correlationId,
    businessId: params.businessId,
  });

  if (reservation.outcome === "duplicate") {
    return reservation.record.responseSnapshot as AcceptBusinessTermsResult;
  }
  if (reservation.outcome === "in_progress") {
    throw businessTermsAcceptanceInProgressError();
  }
  if (reservation.outcome === "conflict") {
    throw new BusinessDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const actor: EventActor = { actorType: "user", actorId: params.userId };
  const languageCode = resolveLanguageCode(params.languageCode);

  try {
    const result = await db.runTransaction(async (transaction: Transaction) => {
      const business = await resolveAuthorizedBusinessForOwnerAction(
        db,
        params.userId,
        params.businessId,
        transaction,
      );

      const currentTermsVersion = await getCurrentlyRequiredBusinessTermsVersionInTransaction(
        transaction,
        db,
        params.testOnlyAfterTermsVersionReadHook,
      );
      if (!currentTermsVersion) {
        throw businessTermsConfigurationUnavailableError();
      }

      const { acceptance, created } = await getOrCreateBusinessTermsAcceptanceInTransaction(
        transaction,
        transaction,
        db,
        {
          id: "",
          acceptingCustomerIdentityId: params.userId,
          businessId: business.id,
          termsVersion: currentTermsVersion,
          acceptedAt: params.now,
          languageCode,
          collectionMethod: params.collectionMethod,
        },
      );

      if (created) {
        const event = buildBusinessTermsAcceptedEvent({
          eventId: params.newId(),
          correlationId: params.correlationId,
          actor,
          occurredAt: params.now.toISOString(),
          acceptanceId: acceptance.id,
          businessId: business.id,
          acceptingCustomerIdentityId: params.userId,
          termsVersion: acceptance.termsVersion,
          languageCode: acceptance.languageCode,
        });
        writeOutboxEntry(transaction, db, event);
      }

      return {
        businessId: business.id,
        termsVersion: acceptance.termsVersion,
        acceptedAt: acceptance.acceptedAt.toISOString(),
        alreadyAccepted: !created,
      };
    });

    await completeIdempotencyKey(db, params.idempotencyKey, result.businessId, result);
    return result;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}
