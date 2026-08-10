/**
 * AUTH-08 — authentication event emission (per AUTH-BP §10/§12).
 *
 * The durable handoff for the two AUTH-08-owned fire-and-forget authentication
 * trust/audit signals. Called by the `functions/src/index.ts` callables at the
 * **composition boundary**, immediately after the completed AUTH-03
 * (`handleAuthenticate`) / AUTH-06 (`handleRecoverIdentity`) orchestration returns
 * success — so those completed services keep their "no emit seam" boundary intact
 * and AUTH-08 owns emission alone.
 *
 * **Durable, not best-effort.** Emission is a real, awaited write through the
 * shared outbox (`shared/outbox`) — never an un-awaited/void "best-effort" fire.
 * Following the existing outbox reliability contract, a write failure *propagates*
 * to the caller as a retryable request failure; the underlying authentication /
 * recovery outcome is idempotently replayable (AUTH-03/AUTH-06 are keyed on the
 * client idempotency key), and the emitted event identity is deterministic, so a
 * retry re-attempts the *same* event rather than minting a new one.
 *
 * **Idempotent enqueue.** The write runs in its own Firestore transaction that
 * first reads the target entry (keyed by the deterministic `eventId`) and does
 * nothing if it already exists — so a duplicate/retried emit neither creates a
 * second entry nor resets an entry the outbox processor has already advanced.
 * This yields durable at-least-once delivery with dedup-by-`eventId` consumption
 * (the merged `-10` audit projection and any future ITM consumer dedupe on the
 * authoritative event id) — never a claim of exactly-once.
 *
 * Payloads carry only the AUTH-01 contract fields (customer identity, categorical
 * reference type, governed proof-method category) — never credential/token/OTP/
 * proof material (TRD10 §10.6.1; TRD21).
 */

import type { Firestore } from "firebase-admin/firestore";
import type { DomainEvent } from "../../../shared/events/domainEvent";
import { outboxEntryRef, writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import {
  buildAuthenticationRecoveryProofProvidedEvent,
  buildCustomerAuthenticatedEvent,
} from "../events/authenticationEventFactories";

export type AuthenticationEmitterDeps = {
  /** Clock seam (occurredAt); event identity is independent of it. */
  now?: () => Date;
};

/** Outcome of an idempotent enqueue: whether this call wrote the entry or found it already present. */
export type EmitOutcome = { written: boolean; eventId: string };

/**
 * Idempotently enqueue a fire-and-forget domain event: inside one transaction,
 * read the entry at its deterministic id and skip if present, else write it. The
 * transaction is awaited and any failure propagates (durable, not best-effort).
 */
async function enqueueOnce<T>(db: Firestore, event: DomainEvent<T>): Promise<EmitOutcome> {
  return db.runTransaction(async (transaction) => {
    const ref = outboxEntryRef(db, event.eventId);
    const existing = await transaction.get(ref);
    if (existing.exists) {
      return { written: false, eventId: event.eventId };
    }
    writeOutboxEntry(transaction, db, event);
    return { written: true, eventId: event.eventId };
  });
}

export type EmitCustomerAuthenticatedParams = {
  customerIdentityId: string;
  referenceType: AuthenticationReferenceType;
  /** The logical authentication request's client idempotency key (event-identity input). */
  idempotencyKey: string;
};

export async function emitCustomerAuthenticated(
  db: Firestore,
  params: EmitCustomerAuthenticatedParams,
  deps: AuthenticationEmitterDeps = {},
): Promise<EmitOutcome> {
  const now = deps.now ?? (() => new Date());
  const event = buildCustomerAuthenticatedEvent({
    customerIdentityId: params.customerIdentityId,
    referenceType: params.referenceType,
    idempotencyKey: params.idempotencyKey,
    occurredAt: now().toISOString(),
  });
  return enqueueOnce(db, event);
}

export type EmitAuthenticationRecoveryProofProvidedParams = {
  customerIdentityId: string;
  referenceType: AuthenticationReferenceType;
  proofMethodCategory: string;
  /** The logical recovery request's client idempotency key (event-identity input). */
  idempotencyKey: string;
};

export async function emitAuthenticationRecoveryProofProvided(
  db: Firestore,
  params: EmitAuthenticationRecoveryProofProvidedParams,
  deps: AuthenticationEmitterDeps = {},
): Promise<EmitOutcome> {
  const now = deps.now ?? (() => new Date());
  const event = buildAuthenticationRecoveryProofProvidedEvent({
    customerIdentityId: params.customerIdentityId,
    referenceType: params.referenceType,
    proofMethodCategory: params.proofMethodCategory,
    idempotencyKey: params.idempotencyKey,
    occurredAt: now().toISOString(),
  });
  return enqueueOnce(db, event);
}
