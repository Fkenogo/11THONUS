/**
 * `permissionBoundaryTestFixtures` repository (`ENG-P2-004D`, internal test-only).
 *
 * Bounded internal fixture the design's §14 "governed test fixtures,
 * harnesses, and adapters internal to this package" language explicitly
 * permits, since no Capability-3 protected command exists yet to
 * integrate against. Mutates a synthetic, non-product collection only —
 * never a real domain collection, never exposed as a Cloud Function
 * endpoint, never referenced outside this domain's own tests and the
 * test-only command shim (`touchPermissionBoundaryFixture.ts`) that
 * composes it with `authorizeAndExecute`.
 *
 * Split into a read (`readFixture`, used in a protected mutation's
 * `prepare` phase) and a write (`writeFixtureTouch`, used in `apply`) so
 * the boundary's reads-before-writes discipline is trivially satisfiable
 * by any caller composing this fixture.
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { serverTimestamp } from "../../../shared/metadata/serverTimestamp";

const COLLECTION = "permissionBoundaryTestFixtures";

export type PermissionBoundaryFixture = {
  readonly id: string;
  readonly businessId: string;
  readonly touchedCount: number;
};

export function permissionBoundaryFixtureRef(db: Firestore, fixtureId: string) {
  return db.collection(COLLECTION).doc(fixtureId);
}

/** Read-only — safe to call from a `prepare` phase (before any transaction write). */
export async function readPermissionBoundaryFixture(
  transaction: Transaction,
  db: Firestore,
  fixtureId: string,
): Promise<PermissionBoundaryFixture | null> {
  const snapshot = await transaction.get(permissionBoundaryFixtureRef(db, fixtureId));
  if (!snapshot.exists) return null;
  const data = snapshot.data() as Partial<{ businessId: unknown; touchedCount: unknown }>;
  return {
    id: fixtureId,
    businessId: typeof data.businessId === "string" ? data.businessId : "",
    touchedCount: typeof data.touchedCount === "number" ? data.touchedCount : 0,
  };
}

/**
 * Write-only — the only thing a protected mutation's `apply` phase is
 * permitted to do. Takes a write-only `TransactionWriter`
 * (`authorizeAndExecute.ts`), not the full `Transaction`, so this
 * function cannot itself read even if it wanted to.
 */
export function writePermissionBoundaryFixtureTouch(
  writer: Pick<Transaction, "set">,
  db: Firestore,
  params: {
    fixtureId: string;
    businessId: string;
    actorUserId: string;
    nextTouchedCount: number;
  },
): void {
  writer.set(permissionBoundaryFixtureRef(db, params.fixtureId), {
    businessId: params.businessId,
    touchedCount: params.nextTouchedCount,
    lastActionBy: params.actorUserId,
    lastActionAt: serverTimestamp(),
  });
}
