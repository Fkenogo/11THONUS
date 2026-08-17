/**
 * Risk-gate evaluation contracts (CAP-P2-ITM-D).
 *
 * Mirrors `domains/permissions/evaluator/types.ts` (`ENG-P2-004B`) and
 * `domains/trust/derivation/types.ts` (`ITM-C`): the pure evaluator
 * consumes an explicit result union modeling ITM-C's read outcome
 * (`EffectiveTrustReadResult`) rather than calling Firestore or
 * `getEffectiveTrust` itself, so every fail-closed branch is a
 * first-class, directly testable case (task Phase J/N) and the function
 * stays a genuine function of its input (task Phase Q scenario 24).
 *
 * `ITM-DESIGN-001` §9.1: output is a bounded decision
 * (`sufficient`/`insufficient`/`unavailable`) plus a governed reason
 * code — never the raw trust record, never a numeric score. `basis` is
 * intentionally omitted from `RiskGateDecision`: only the two already-
 * closed-band values (`effectiveTrustLevel`, `requiredTrustLevel`) are
 * surfaced, never `EffectiveTrustResult.basis`'s underlying evidence
 * (task Phase R — "do not expose raw evidence payload").
 */

import type { TrustLevel } from "../models/trustLevel";
import type { EffectiveTrustResult } from "../derivation/types";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

/**
 * Models the orchestrator's (`../services/checkRiskGateService.ts`) call to
 * ITM-C's `getEffectiveTrust` as an explicit result rather than a thrown
 * exception reaching this pure layer — `getEffectiveTrust` itself throws
 * `TrustDomainError` on failure (its own module contract); the
 * orchestrator catches that and translates it into the `"unavailable"`
 * variant below before calling the pure evaluator.
 */
export type EffectiveTrustReadResult =
  | { readonly kind: "derived"; readonly result: EffectiveTrustResult }
  | { readonly kind: "unavailable"; readonly errorCategory: ErrorCategory };

export const RISK_GATE_REASON_CODES = [
  "TRUST_SUFFICIENT",
  "TRUST_INSUFFICIENT",
  "UNKNOWN_RISK_REQUIREMENT",
  "UNSUPPORTED_TRUST_RULE_VERSION",
  "EFFECTIVE_TRUST_UNAVAILABLE",
] as const;

export type RiskGateReasonCode = (typeof RISK_GATE_REASON_CODES)[number];

export type RiskGateDecisionValue = "sufficient" | "insufficient" | "unavailable";

/**
 * The bounded result a future, explicitly-opted-in risk-gated action
 * consumes (`ITM-DESIGN-001` §9.1). Never thrown — a decision function,
 * not an error-throwing gate (§13's failure-model table: "ITM's read
 * contract is a decision function... mirrors ENG-P2-004's evaluator,
 * which returns decisions, not exceptions").
 */
export type RiskGateDecision = {
  readonly decision: RiskGateDecisionValue;
  readonly reasonCode: RiskGateReasonCode;
  /** Present only when a required trust level was resolvable (i.e. the requirement id itself was valid). */
  readonly requiredTrustLevel?: TrustLevel;
  /** Present only when effective trust was successfully derived. */
  readonly effectiveTrustLevel?: TrustLevel;
  readonly ruleVersion: number;
  readonly evaluatedAt: Date;
  /** Present only when `decision` is `"unavailable"` — the client-facing closed-taxonomy category. */
  readonly errorCategory?: ErrorCategory;
};

export type RiskGateEvaluationInput = {
  readonly riskRequirement: string;
  readonly effectiveTrust: EffectiveTrustReadResult;
  /** The evaluation instant, supplied by the caller — see module docstring; genuine purity requires no wall-clock read inside this function. */
  readonly now: Date;
};
