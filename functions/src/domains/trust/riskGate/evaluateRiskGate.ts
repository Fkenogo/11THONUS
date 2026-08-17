/**
 * Risk-gate evaluator — pure decision function (CAP-P2-ITM-D).
 *
 * Implements `ITM-DESIGN-001` §9.1's contract: "Does current trust
 * evidence satisfy the risk requirement for this specific, already-
 * authorized action?" Pure: never touches Firestore, never imports
 * `domains/identity`/`domains/permissions`/`domains/authentication`,
 * never reads the wall clock (`input.now` is supplied by the caller) —
 * mirrors `domains/permissions/evaluator/evaluatePermission.ts` and
 * `domains/trust/derivation/deriveEffectiveTrust.ts`'s purity discipline
 * exactly, so calling this function twice with the same input always
 * produces byte-identical output.
 *
 * This function answers ONE question only — never role/permission
 * authorization (`ENG-P2-004`'s separate contract, §9) and never
 * authentication (Authentication's separate contract). It consumes
 * ITM-C's already-derived `EffectiveTrustResult` (via the
 * `EffectiveTrustReadResult` union, `./types.ts`) as the sole source of
 * trust truth — it never reads a persisted `trustLevel`, never
 * re-derives trust from raw evidence, and never overrides ITM-C's rule
 * version (task Phase H).
 */

import { isAtLeastTrustLevel } from "../models/trustLevel";
import { CURRENT_TRUST_RULE_VERSION } from "../derivation/types";
import {
  RISK_REQUIREMENT_RULE_VERSION,
  isRiskRequirementId,
  minimumTrustLevelForRequirement,
} from "./riskRequirement";
import type { RiskGateDecision, RiskGateEvaluationInput } from "./types";

/**
 * The effective-trust rule version this evaluator knows how to compare
 * against — task Phase O: "do not silently compare effectiveTrustLevel
 * from version X against a requirement designed for version Y." At MVP
 * this is simply ITM-C's own current version; a future ITM-D revision
 * that supports multiple trust-rule versions would widen this set
 * explicitly, never implicitly.
 */
const SUPPORTED_TRUST_RULE_VERSION = CURRENT_TRUST_RULE_VERSION;

export function evaluateRiskGate(input: RiskGateEvaluationInput): RiskGateDecision {
  const { riskRequirement, effectiveTrust, now } = input;

  // Fail closed on a malformed/unknown requirement before even looking at
  // trust evidence — no fallback to a lower requirement, no default
  // "unverified" requirement for a blank/unrecognized value (task Phase N).
  if (!isRiskRequirementId(riskRequirement)) {
    return {
      decision: "unavailable",
      reasonCode: "UNKNOWN_RISK_REQUIREMENT",
      ruleVersion: RISK_REQUIREMENT_RULE_VERSION,
      evaluatedAt: now,
      errorCategory: "VALIDATION_FAILED",
    };
  }

  const requiredTrustLevel = minimumTrustLevelForRequirement(riskRequirement);

  if (effectiveTrust.kind === "unavailable") {
    return {
      decision: "unavailable",
      reasonCode: "EFFECTIVE_TRUST_UNAVAILABLE",
      requiredTrustLevel,
      ruleVersion: RISK_REQUIREMENT_RULE_VERSION,
      evaluatedAt: now,
      errorCategory: effectiveTrust.errorCategory,
    };
  }

  // Rule-version consistency (task Phase O/P): never compare an effective
  // trust result derived under an unrecognized ITM-C rule version.
  if (effectiveTrust.result.ruleVersion !== SUPPORTED_TRUST_RULE_VERSION) {
    return {
      decision: "unavailable",
      reasonCode: "UNSUPPORTED_TRUST_RULE_VERSION",
      requiredTrustLevel,
      ruleVersion: RISK_REQUIREMENT_RULE_VERSION,
      evaluatedAt: now,
      errorCategory: "VALIDATION_FAILED",
    };
  }

  const { effectiveTrustLevel } = effectiveTrust.result;
  const satisfied = isAtLeastTrustLevel(effectiveTrustLevel, requiredTrustLevel);

  return {
    decision: satisfied ? "sufficient" : "insufficient",
    reasonCode: satisfied ? "TRUST_SUFFICIENT" : "TRUST_INSUFFICIENT",
    requiredTrustLevel,
    effectiveTrustLevel,
    ruleVersion: RISK_REQUIREMENT_RULE_VERSION,
    evaluatedAt: now,
  };
}
