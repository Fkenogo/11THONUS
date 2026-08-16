/**
 * Trust rule version (CAP-P2-ITM-A).
 *
 * The smallest possible versioning contract required to support §6.6.2's
 * "versioned evolution without rebuilding identity": a positive integer
 * identifying which band-derivation rule set governs an interpretation
 * of `signalState`. Changing a threshold, renaming a band, or adjusting
 * band count in a future revision is expressed as bumping this value —
 * no rule *engine*, no hard-coded future rule set, and no threshold
 * table is implemented here (task Phase J instruction). ITM-C is the
 * package that will define what each version number actually means and
 * perform the derivation itself; this module only makes "a rule version"
 * a type-safe, validated value other packages can pass around.
 */

import { invalidTrustRuleVersionError } from "./trustErrors";

export type TrustRuleVersion = number;

export function createTrustRuleVersion(value: number): TrustRuleVersion {
  if (!Number.isInteger(value) || value < 1) {
    throw invalidTrustRuleVersionError(value);
  }
  return value;
}
