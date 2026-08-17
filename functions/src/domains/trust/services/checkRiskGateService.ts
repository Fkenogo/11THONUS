/**
 * Risk-gate read contract — Firestore orchestrator (CAP-P2-ITM-D).
 *
 * `ITM-DESIGN-001` §9.1's `checkRiskGate(customerIdentityId,
 * riskRequirement)`. Read-only, no side effects (mirrors ITM-C's
 * `getEffectiveTrust` and `ENG-P2-004`'s evaluator both being read-
 * only/pure). Delegates all trust derivation to ITM-C's
 * `getEffectiveTrust` — this file never reads a persisted `trustLevel`,
 * never re-derives trust from raw signal state, and never re-implements
 * the 30-day algorithm (task Phase H: "there must be one effective-trust
 * derivation authority").
 *
 * `getEffectiveTrust` throws `TrustDomainError` on failure (its own
 * module contract, `../services/effectiveTrustService.ts`) — this
 * orchestrator is the single place that catches that and translates it
 * into the `EffectiveTrustReadResult` union the pure evaluator
 * (`../riskGate/evaluateRiskGate.ts`) consumes, so the risk-gate
 * contract itself never throws: a decision function, not an error-
 * throwing gate (`ITM-DESIGN-001` §13).
 */

import type { Firestore } from "firebase-admin/firestore";
import { getEffectiveTrust } from "./effectiveTrustService";
import { TrustDomainError } from "../models/trustErrors";
import { evaluateRiskGate } from "../riskGate/evaluateRiskGate";
import type { EffectiveTrustReadResult, RiskGateDecision } from "../riskGate/types";

/**
 * Evaluates whether `customerIdentityId`'s current effective trust
 * satisfies `riskRequirement` (one of the closed identifiers,
 * `../riskGate/riskRequirement.ts`). Never mutates any trust record or
 * customer identity. Never authenticates the caller and never evaluates
 * role/permission authorization — those remain separate authorities a
 * risk-gated action composes independently (`ITM-DESIGN-001` §9).
 */
export async function checkRiskGate(
  db: Firestore,
  customerIdentityId: string,
  riskRequirement: string,
  now: Date = new Date(),
): Promise<RiskGateDecision> {
  let effectiveTrust: EffectiveTrustReadResult;
  try {
    const result = await getEffectiveTrust(db, customerIdentityId, now);
    effectiveTrust = { kind: "derived", result };
  } catch (error) {
    if (error instanceof TrustDomainError) {
      effectiveTrust = { kind: "unavailable", errorCategory: error.category };
    } else {
      // Fail closed even for a genuinely unexpected error shape — never
      // let an unrecognized throw escape this decision-function contract.
      effectiveTrust = { kind: "unavailable", errorCategory: "TEMPORARY_UNAVAILABLE" };
    }
  }

  return evaluateRiskGate({ riskRequirement, effectiveTrust, now });
}
