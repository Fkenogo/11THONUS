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
