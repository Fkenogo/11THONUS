/**
 * Trust signal ingestion errors (CAP-P2-ITM-B).
 *
 * Reuses ITM-A's `TrustDomainError` shape (`../models/trustErrors.ts`)
 * rather than inventing a parallel error type — same closed 14-category
 * taxonomy (TRD11 §11.35), no 15th category (ITM-DESIGN-001 §13). These
 * factories are ITM-B's own (event-ingestion-boundary failures), kept out
 * of `models/trustErrors.ts` so ITM-A's file is not touched by this
 * package (Phase U: no ITM-A semantic change).
 */

import { TrustDomainError } from "../models/trustErrors";

export function unsupportedTrustSignalEventTypeError(eventType: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Event type "${eventType}" is not a governed ITM trust-signal event (ITM-DESIGN-001 §7).`,
  );
}

export function malformedTrustSignalEventError(eventId: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Trust-signal event "${eventId}" has a malformed or missing payload.`,
  );
}

export function unknownCustomerIdentityForTrustEvidenceError(
  customerIdentityId: string,
): TrustDomainError {
  return new TrustDomainError(
    "RESOURCE_NOT_FOUND",
    `Cannot ingest trust evidence: customer identity "${customerIdentityId}" does not exist. ` +
      "A trust signal must never create a Customer Identity.",
  );
}

/**
 * A distinct failure from `unknownCustomerIdentityForTrustEvidenceError`:
 * the `users/{id}` document exists but does not match the identity
 * domain's expected shape (`IdentityDomainError` `VALIDATION_FAILED`, not
 * `RESOURCE_NOT_FOUND`). Mapped into ITM-B's own error type so
 * `trustEventHandler.ts`'s `TrustDomainError` classification catches it —
 * without this, it would propagate as a raw, un-recognised
 * `IdentityDomainError` and fall through to the outbox handler's generic
 * *retryable* default, which cannot fix a data-shape problem (found during
 * `CAP-P2-ITM-B`'s independent adversarial review, Phase C).
 */
export function malformedCustomerIdentityForTrustEvidenceError(
  customerIdentityId: string,
): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Cannot ingest trust evidence: the stored customer identity record for "${customerIdentityId}" does not match the expected shape.`,
  );
}
