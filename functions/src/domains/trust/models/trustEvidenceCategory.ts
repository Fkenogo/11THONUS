/**
 * Trust evidence category (CAP-P2-ITM-A).
 *
 * The closed set of signal categories governed for the Capability-2 ITM
 * MVP (`ITM-DESIGN-001` §7): only the two `AUTH-08` (merged) events that
 * currently have a real data source. Purchase history, merchant-history,
 * device-history, and future fraud/risk signals are explicitly deferred
 * (§7 "Future" rows) — not invented here (task Phase G: "do not invent a
 * data source that does not exist yet"). Extending this set in a future
 * governed revision is a versioned schema change, not a reinterpretation
 * of this closed list.
 */

import { invalidTrustEvidenceCategoryError } from "./trustErrors";

export const TRUST_EVIDENCE_CATEGORIES = [
  "customer_authenticated",
  "authentication_recovery_proof_provided",
] as const;

export type TrustEvidenceCategory = (typeof TRUST_EVIDENCE_CATEGORIES)[number];

export function createTrustEvidenceCategory(value: string): TrustEvidenceCategory {
  if ((TRUST_EVIDENCE_CATEGORIES as readonly string[]).includes(value)) {
    return value as TrustEvidenceCategory;
  }
  throw invalidTrustEvidenceCategoryError(value);
}

export function isTrustEvidenceCategory(value: string): value is TrustEvidenceCategory {
  return (TRUST_EVIDENCE_CATEGORIES as readonly string[]).includes(value);
}
