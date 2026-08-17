/**
 * `riskGateBoundaryTestFixtures` / `standardParticipationTestFixtures`
 * repositories (CAP-P2-ITM-D, internal test-only).
 *
 * Bounded internal fixtures — no production risk-gated action exists yet
 * (`ITM-DESIGN-001` §14/§20; task Phase G forbids minting one merely to
 * exercise ITM-D), so these mirror `domains/permissions/repositories/
 * permissionBoundaryFixtureRepository.ts` (`ENG-P2-004D`)'s own precedent
 * for proving a read-only decision contract end-to-end without a real
 * consumer. Two separate synthetic collections, not one, so the "ordinary
 * participation is never trust-gated" proof (`ITM-DESIGN-001` §10, task
 * Phase K) is structural: `standardParticipationTestFixtures` is written
 * by a code path (`../services/touchStandardParticipationFixtureCommand.ts`)
 * that has no dependency on `checkRiskGateService.ts` at all, not merely
 * one that happens not to call it at runtime.
 *
 * Never exposed as a Cloud Function endpoint; never referenced outside
 * this domain's own tests and the two test-only command shims.
 */

import type { Firestore } from "firebase-admin/firestore";
import { serverTimestamp } from "../../../shared/metadata/serverTimestamp";

const RISK_GATE_FIXTURE_COLLECTION = "riskGateBoundaryTestFixtures";
const STANDARD_PARTICIPATION_FIXTURE_COLLECTION = "standardParticipationTestFixtures";

export type BoundaryFixture = {
  readonly id: string;
  readonly touchedCount: number;
};

function fixtureRef(db: Firestore, collection: string, fixtureId: string) {
  return db.collection(collection).doc(fixtureId);
}

async function readFixture(
  db: Firestore,
  collection: string,
  fixtureId: string,
): Promise<BoundaryFixture> {
  const snapshot = await fixtureRef(db, collection, fixtureId).get();
  const data = snapshot.data() as Partial<{ touchedCount: unknown }> | undefined;
  return {
    id: fixtureId,
    touchedCount: typeof data?.touchedCount === "number" ? data.touchedCount : 0,
  };
}

async function writeFixtureTouch(
  db: Firestore,
  collection: string,
  fixtureId: string,
  nextTouchedCount: number,
): Promise<void> {
  await fixtureRef(db, collection, fixtureId).set({
    touchedCount: nextTouchedCount,
    lastTouchedAt: serverTimestamp(),
  });
}

/** Read-then-write touch against the trust-gated synthetic fixture — used only after a `"sufficient"` risk-gate decision. */
export async function touchRiskGateFixture(db: Firestore, fixtureId: string): Promise<number> {
  const current = await readFixture(db, RISK_GATE_FIXTURE_COLLECTION, fixtureId);
  const next = current.touchedCount + 1;
  await writeFixtureTouch(db, RISK_GATE_FIXTURE_COLLECTION, fixtureId, next);
  return next;
}

/** Read-then-write touch against the ordinary, never-trust-gated synthetic fixture. */
export async function touchStandardParticipationFixture(
  db: Firestore,
  fixtureId: string,
): Promise<number> {
  const current = await readFixture(db, STANDARD_PARTICIPATION_FIXTURE_COLLECTION, fixtureId);
  const next = current.touchedCount + 1;
  await writeFixtureTouch(db, STANDARD_PARTICIPATION_FIXTURE_COLLECTION, fixtureId, next);
  return next;
}
