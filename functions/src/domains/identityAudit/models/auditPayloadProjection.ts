/**
 * Audit read-model payload projection (ENG-P2-001-10 correction, Founder
 * Review — "Audit Read-Model Minimisation Principle").
 *
 * The underlying domain events and their stored outbox payloads are
 * unchanged and remain the immutable audit evidence of record — this
 * module never touches them. It exists solely to bound what an
 * audit-QUERY caller sees: an explicit per-event-type allow-list of
 * fields, never a raw pass-through of `event.payload`.
 *
 * Governing policy: audit-query results must not expose raw Loyalty
 * Numbers, QR references, Authentication subject references, phone
 * numbers, emails, credentials, tokens, OTPs, or other sensitive/
 * customer-linked identifiers unless a future explicitly governed audit
 * purpose requires them. No masking, truncation, or unsalted hashing is
 * used as a substitute for omission — every identifier this policy
 * names is either fully present (nowhere does that apply here) or fully
 * absent from the projected result, since each identifier's space is
 * enumerable (a Loyalty Number, QR reference, or provider subject
 * reference can be brute-forced/guessed if a masked/hashed form were
 * exposed instead).
 *
 * Unknown event types fail closed: `{ payloadOmitted: true }`, never an
 * arbitrary object.
 */

import { extractEventName } from "./auditPrivacyClassification";

export type AuditSafePayload = Record<string, unknown>;

function pick(source: unknown, keys: readonly string[]): AuditSafePayload {
  const record = (source ?? {}) as Record<string, unknown>;
  const result: AuditSafePayload = {};
  for (const key of keys) {
    if (key in record) {
      result[key] = record[key];
    }
  }
  return result;
}

const LIFECYCLE_TRANSITION_FIELDS = ["previousStatus", "authority", "reason"] as const;
const ARCHIVED_FIELDS = ["authority", "reason"] as const;
const RECOVERED_FIELDS = [
  "previousStatus",
  "resultingStatus",
  "authority",
  "reason",
  "proofMethodCategory",
] as const;
const AUTH_REFERENCE_LINKED_FIELDS = ["referenceType", "authority", "reason"] as const;
const AUTH_REFERENCE_UNLINKED_FIELDS = ["authority", "reason"] as const;
const AUTH_REFERENCE_CONFLICT_FIELDS = ["referenceType", "authority", "reason"] as const;
const LOOKUP_ATTEMPTED_FIELDS = ["lookupType", "purpose", "outcome"] as const;
// AUTH-08 fire-and-forget authentication trust/audit signals (AUTH-BP §10). Only
// categorical, non-sensitive context — never the customer's provider subject/
// referenceId, token, OTP, or proof material (none is present on these payloads).
const CUSTOMER_AUTHENTICATED_FIELDS = ["referenceType"] as const;
const RECOVERY_PROOF_PROVIDED_FIELDS = ["referenceType", "proofMethodCategory"] as const;
const ISSUANCE_COLLISION_FIELDS = ["attemptNumber"] as const;
const ISSUANCE_FAILED_FIELDS = ["attemptsMade"] as const;

export function projectAuditPayload(eventType: string, rawPayload: unknown): AuditSafePayload {
  const eventName = extractEventName(eventType);

  switch (eventName) {
    case "customer_identity_registered":
      return {};

    case "customer_identity_activated":
    case "customer_identity_suspended":
    case "customer_identity_locked":
    case "customer_identity_closed":
    case "identity_became_dormant":
      return pick(rawPayload, LIFECYCLE_TRANSITION_FIELDS);

    case "customer_identity_archived":
      return pick(rawPayload, ARCHIVED_FIELDS);

    case "identity_recovered":
      // recoveryProofReference is deliberately never picked — the proof
      // reference itself is not needed to explain what happened;
      // proofMethodCategory already conveys the method category.
      return pick(rawPayload, RECOVERED_FIELDS);

    case "authentication_reference_linked":
      // referenceId is deliberately never picked.
      return pick(rawPayload, AUTH_REFERENCE_LINKED_FIELDS);

    case "authentication_reference_unlinked":
      // referenceId is deliberately never picked.
      return pick(rawPayload, AUTH_REFERENCE_UNLINKED_FIELDS);

    case "authentication_reference_conflict_detected":
      return pick(rawPayload, AUTH_REFERENCE_CONFLICT_FIELDS);

    case "identity_lookup_attempted":
      // No raw lookup value has ever been present on this payload (-09).
      return pick(rawPayload, LOOKUP_ATTEMPTED_FIELDS);

    case "customer_authenticated":
      // AUTH-08 fire-and-forget sign-in/registration trust signal. Only the
      // categorical provider reference type; the provider subject/referenceId is
      // never on this payload (AUTH-01 contract) and never projected.
      return pick(rawPayload, CUSTOMER_AUTHENTICATED_FIELDS);

    case "authentication_recovery_proof_provided":
      // AUTH-08 fire-and-forget recovery-proof trust signal. Categorical provider
      // reference type + governed proof-method category only; no proof material.
      return pick(rawPayload, RECOVERY_PROOF_PROVIDED_FIELDS);

    case "loyalty_number_issued":
    case "qr_identity_issued":
    case "qr_identity_invalidated":
    case "qr_identity_regenerated":
      // The settled identifier value is deliberately never picked.
      return {};

    case "trust_reference_updated":
      // trustRecordId is an opaque, enumerable pointer to an external ITM
      // record — deliberately never picked, matching the same treatment
      // as recoveryProofReference/referenceId/settled Loyalty Number and
      // QR reference elsewhere in this catalogue (ENG-P2-ARCH-CORR-003,
      // Finding F3). `-01` defines this event's domain model, but no
      // repository currently emits it (no persistence call site exists
      // yet); this explicit case ensures it is not silently caught by
      // the unrecognised-event fallback once a future ITM integration
      // wires it into an actual write path.
      return {};

    case "loyalty_number_issuance_collision_detected":
      return pick(rawPayload, ISSUANCE_COLLISION_FIELDS);

    case "loyalty_number_issuance_failed":
      return pick(rawPayload, ISSUANCE_FAILED_FIELDS);

    default:
      return { payloadOmitted: true };
  }
}
