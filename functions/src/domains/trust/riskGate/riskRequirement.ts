/**
 * Risk requirement vocabulary (CAP-P2-ITM-D).
 *
 * `ITM-DESIGN-001` §9.1: "a `riskRequirement` identifier declared by the
 * calling action (not a raw trust-level comparison the caller invents ad
 * hoc — the requirement vocabulary is ITM-owned and closed, analogous to
 * the closed 14-category error taxonomy, TRD11 §11.35)." A caller (a
 * future, explicitly opted-in action) may only reference one of the
 * closed identifiers below — it can never construct its own `minimum
 * TrustLevel` threshold, which would let any future domain invent its
 * own ad hoc trust policy (§9.2).
 *
 * No production risk-gated action identifier is minted here — task
 * Phase G ("no invented high-risk action catalogue") and `ITM-DESIGN-001`
 * §14/§20 both confirm no concrete risk-gated action (large redemption,
 * ownership change, etc.) is governed at Capability-2 MVP; those remain
 * illustrative-only examples in `DEC-IDENTITY-001`. This vocabulary is
 * therefore expressed directly in terms of the one thing ITM-C already
 * derives — the closed `TrustLevel` band (`../models/trustLevel.ts`) —
 * so that exercising ITM-D requires no product-policy invention, only a
 * bounded, internal test fixture (`../services/touchRiskGateBoundaryFixtureCommand.ts`).
 */

import { TRUST_LEVELS, type TrustLevel } from "../models/trustLevel";

/** Versioned per `ITM-DESIGN-001` §9.1 ("deterministic and versioned"). Bump only via a new value, never redefine in place. */
export const RISK_REQUIREMENT_RULE_VERSION = 1;

export const RISK_REQUIREMENTS = [
  "TRUST_UNVERIFIED_OR_ABOVE",
  "TRUST_PROVISIONAL_OR_ABOVE",
  "TRUST_ESTABLISHED_OR_ABOVE",
] as const;

export type RiskRequirementId = (typeof RISK_REQUIREMENTS)[number];

const REQUIREMENT_MINIMUM_TRUST_LEVEL: Record<RiskRequirementId, TrustLevel> = {
  TRUST_UNVERIFIED_OR_ABOVE: "unverified",
  TRUST_PROVISIONAL_OR_ABOVE: "provisional",
  TRUST_ESTABLISHED_OR_ABOVE: "established",
};

export function isRiskRequirementId(value: string): value is RiskRequirementId {
  return (RISK_REQUIREMENTS as readonly string[]).includes(value);
}

/** Throws only for a value already validated by `isRiskRequirementId` — callers must check first (fail-closed callers never call this blind). */
export function minimumTrustLevelForRequirement(id: RiskRequirementId): TrustLevel {
  const level = REQUIREMENT_MINIMUM_TRUST_LEVEL[id];
  if (!TRUST_LEVELS.includes(level)) {
    throw new Error(`Unreachable: risk requirement "${id}" has no mapped trust level.`);
  }
  return level;
}
