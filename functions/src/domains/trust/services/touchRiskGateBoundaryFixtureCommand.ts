/**
 * `touchRiskGateBoundaryFixture` — internal test-only command shim
 * (CAP-P2-ITM-D).
 *
 * Proves the risk-gate read contract end-to-end the way a real,
 * explicitly opted-in risk-gated action would: it calls `checkRiskGate`
 * itself and only proceeds to mutate the bounded, synthetic
 * `riskGateBoundaryTestFixtures` collection when the decision is
 * `"sufficient"` — never for `"insufficient"` or `"unavailable"`. Not a
 * Cloud Function endpoint; not exported outside this domain's own
 * emulator tests. Mints no production risk-gated action identifier
 * (`ITM-DESIGN-001` §14/§20, task Phase G) — `riskRequirement` is always
 * one of ITM-D's own closed identifiers (`../riskGate/riskRequirement.ts`).
 */

import type { Firestore } from "firebase-admin/firestore";
import { checkRiskGate } from "./checkRiskGateService";
import { touchRiskGateFixture } from "../repositories/riskGateBoundaryFixtureRepository";
import type { RiskGateDecision } from "../riskGate/types";

export type TouchRiskGateBoundaryFixtureParams = {
  readonly customerIdentityId: string;
  readonly riskRequirement: string;
  readonly fixtureId: string;
  readonly now?: Date;
};

export type TouchRiskGateBoundaryFixtureResult =
  | {
      readonly outcome: "allowed";
      readonly touchedCount: number;
      readonly decision: RiskGateDecision;
    }
  | { readonly outcome: "denied"; readonly decision: RiskGateDecision };

export async function touchRiskGateBoundaryFixture(
  db: Firestore,
  params: TouchRiskGateBoundaryFixtureParams,
): Promise<TouchRiskGateBoundaryFixtureResult> {
  const decision = await checkRiskGate(
    db,
    params.customerIdentityId,
    params.riskRequirement,
    params.now,
  );

  if (decision.decision !== "sufficient") {
    return { outcome: "denied", decision };
  }

  const touchedCount = await touchRiskGateFixture(db, params.fixtureId);
  return { outcome: "allowed", touchedCount, decision };
}
