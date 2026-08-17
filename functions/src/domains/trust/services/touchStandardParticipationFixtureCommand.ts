/**
 * `touchStandardParticipationFixture` — internal test-only command shim
 * (CAP-P2-ITM-D).
 *
 * Represents an ordinary, non-risk-gated platform action (registration,
 * earning, standard redemption, etc., `ITM-DESIGN-001` §10) that must
 * never require any trust check. Deliberately has **no source-level
 * dependency on the risk-gate read contract or its evaluator at all** —
 * not merely a code path that happens not to call it — so the "standard
 * participation is never trust-gated" proof (task Phase K) is a static,
 * mechanically checkable fact (`./riskGateStandardParticipationBoundary.test.ts`),
 * not a runtime-observed one.
 */

import type { Firestore } from "firebase-admin/firestore";
import { touchStandardParticipationFixture as writeStandardParticipationTouch } from "../repositories/riskGateBoundaryFixtureRepository";

export type TouchStandardParticipationFixtureParams = {
  readonly fixtureId: string;
};

export async function touchStandardParticipationFixture(
  db: Firestore,
  params: TouchStandardParticipationFixtureParams,
): Promise<{ readonly touchedCount: number }> {
  const touchedCount = await writeStandardParticipationTouch(db, params.fixtureId);
  return { touchedCount };
}
