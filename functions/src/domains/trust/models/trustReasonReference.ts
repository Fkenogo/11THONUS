/**
 * Trust reason reference (CAP-P2-ITM-A).
 *
 * One entry in a trust record's bounded evidence trail (`ITM-DESIGN-001`
 * §5's `reasonReferences`: "a governed reason code + correlation ID
 * pointing at the outbox event that produced the current state" —
 * references, not copies of the event payload). Auditability (design
 * Principle 8) without re-storing event payloads.
 *
 * Deliberately carries **no** trust-movement field of any kind (no
 * `direction`, `delta`, `weight`, or `trustImpact`) — evidence is a
 * record of *what happened*, never of *how much trust it produced*.
 * This is what makes `AD-ITM-2`'s neutrality requirement for
 * `authentication_recovery_proof_provided` evidence structurally true
 * rather than merely a documented convention: there is no field this
 * type could use to encode a positive or negative trust movement, so no
 * caller can accidentally attach one. Progression/derivation logic that
 * turns evidence into a trust level is ITM-C's responsibility, not this
 * module's.
 */

import type { TrustEvidenceCategory } from "./trustEvidenceCategory";
import { createTrustEvidenceCategory } from "./trustEvidenceCategory";
import {
  invalidTrustRecordTimestampError,
  invalidTrustReasonReferenceFieldError,
} from "./trustErrors";

export type TrustReasonReference = {
  readonly category: TrustEvidenceCategory;
  readonly eventId: string;
  readonly correlationId: string;
  readonly occurredAt: Date;
};

export type CreateTrustReasonReferenceParams = {
  category: string;
  eventId: string;
  correlationId: string;
  occurredAt: Date;
};

function requireNonBlank(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw invalidTrustReasonReferenceFieldError(field, value);
  }
}

export function createTrustReasonReference(
  params: CreateTrustReasonReferenceParams,
): TrustReasonReference {
  const category = createTrustEvidenceCategory(params.category);
  requireNonBlank(params.eventId, "eventId");
  requireNonBlank(params.correlationId, "correlationId");

  if (!(params.occurredAt instanceof Date) || Number.isNaN(params.occurredAt.getTime())) {
    throw invalidTrustRecordTimestampError("occurredAt");
  }

  return {
    category,
    eventId: params.eventId,
    correlationId: params.correlationId,
    occurredAt: params.occurredAt,
  };
}
