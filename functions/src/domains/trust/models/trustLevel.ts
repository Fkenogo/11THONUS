/**
 * Trust level / band (CAP-P2-ITM-A).
 *
 * The Founder-countersigned closed set (`ITM-DESIGN-001` §6.6, `AD-ITM-1`,
 * 2026-08-16): three discrete, evidence-derived bands — `unverified` <
 * `provisional` < `established` — never a numeric score (§6.4's rejection
 * of numeric scoring is machine-enforced here by construction: there is
 * no field, no arithmetic, and no fourth value this type can hold).
 *
 * `established` is internal-only and means precisely "established under
 * the current MVP trust-evidence model" (§6.6.3) — never legal-identity
 * verification, fraud clearance, financial credibility, or eligibility
 * for standard participation. This module enforces only the closed
 * membership and ordering of the set; it does not itself decide which
 * band an identity is in — that derivation is ITM-C's responsibility
 * (§6.6.1: `trustLevel` is derived state, never authoritative-when-
 * persisted; recomputed from `signalState` + current server time +
 * rule version, not from this module).
 */

import { invalidTrustLevelError } from "./trustErrors";

export const TRUST_LEVELS = ["unverified", "provisional", "established"] as const;

export type TrustLevel = (typeof TRUST_LEVELS)[number];

export function createTrustLevel(value: string): TrustLevel {
  if ((TRUST_LEVELS as readonly string[]).includes(value)) {
    return value as TrustLevel;
  }
  throw invalidTrustLevelError(value);
}

export function isTrustLevel(value: string): value is TrustLevel {
  return (TRUST_LEVELS as readonly string[]).includes(value);
}

/** Ordinal rank of a trust level within the closed, ordered set (0 = `unverified`). */
export function trustLevelRank(level: TrustLevel): number {
  return TRUST_LEVELS.indexOf(level);
}

/** Negative if `a` < `b`, 0 if equal, positive if `a` > `b`, per the §6.6 ordering. */
export function compareTrustLevels(a: TrustLevel, b: TrustLevel): number {
  return trustLevelRank(a) - trustLevelRank(b);
}

/** Whether `level` meets or exceeds `minimum` in the §6.6 ordering. */
export function isAtLeastTrustLevel(level: TrustLevel, minimum: TrustLevel): boolean {
  return compareTrustLevels(level, minimum) >= 0;
}
