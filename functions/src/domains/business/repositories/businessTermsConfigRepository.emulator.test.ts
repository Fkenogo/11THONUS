import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  BUSINESS_TERMS_CONFIG_COLLECTION,
  BUSINESS_TERMS_CONFIG_DOCUMENT_ID,
  getCurrentlyRequiredBusinessTermsVersion,
  getCurrentlyRequiredBusinessTermsVersionInTransaction,
} from "./businessTermsConfigRepository";

/**
 * `ENG-P3-002A` independent review correction (Phase C-H): replaces
 * `config/businessTermsConfig.test.ts` (deleted — the `process.env`-based
 * mechanism it tested is gone). Proves the fail-closed contract survives
 * the move to a real Firestore document, and that the transactional reader
 * genuinely participates in `transaction`'s own read set.
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "businessTermsConfigRepositoryTest");
const db = getFirestore(app);

function configRef() {
  return db.collection(BUSINESS_TERMS_CONFIG_COLLECTION).doc(BUSINESS_TERMS_CONFIG_DOCUMENT_ID);
}

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite.",
    );
  }
});

beforeEach(async () => {
  const snapshot = await db.collection(BUSINESS_TERMS_CONFIG_COLLECTION).get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("getCurrentlyRequiredBusinessTermsVersion (non-transactional)", () => {
  it("returns null (fails closed) when the document does not exist", async () => {
    expect(await getCurrentlyRequiredBusinessTermsVersion(db)).toBeNull();
  });

  it("returns null (fails closed) when currentVersion is blank/whitespace-only", async () => {
    await configRef().set({ currentVersion: "   " });
    expect(await getCurrentlyRequiredBusinessTermsVersion(db)).toBeNull();
  });

  it("returns null (fails closed) when currentVersion is missing or the wrong type", async () => {
    await configRef().set({ someOtherField: true });
    expect(await getCurrentlyRequiredBusinessTermsVersion(db)).toBeNull();
    await configRef().set({ currentVersion: 42 });
    expect(await getCurrentlyRequiredBusinessTermsVersion(db)).toBeNull();
  });

  it("returns the trimmed configured value when set", async () => {
    await configRef().set({ currentVersion: "  TEST_ONLY_FIXTURE_v0  " });
    expect(await getCurrentlyRequiredBusinessTermsVersion(db)).toBe("TEST_ONLY_FIXTURE_v0");
  });

  it("never fabricates a value that looks like a real, legally-approved production Terms version", async () => {
    const value = await getCurrentlyRequiredBusinessTermsVersion(db);
    expect(value).not.toBe("v1");
    expect(value).not.toBe("1.0");
    expect(value).toBeNull();
  });
});

describe("getCurrentlyRequiredBusinessTermsVersionInTransaction", () => {
  it("returns the same fail-closed/parse contract as the non-transactional reader", async () => {
    await configRef().set({ currentVersion: "TEST_ONLY_FIXTURE_v0" });
    const value = await db.runTransaction((transaction) =>
      getCurrentlyRequiredBusinessTermsVersionInTransaction(transaction, db),
    );
    expect(value).toBe("TEST_ONLY_FIXTURE_v0");
  });

  it("returns null (fails closed) inside a transaction when unconfigured", async () => {
    const value = await db.runTransaction((transaction) =>
      getCurrentlyRequiredBusinessTermsVersionInTransaction(transaction, db),
    );
    expect(value).toBeNull();
  });

  /**
   * **Disclosed finding, not a passing claim (`ENG-P3-002A` independent
   * review, Phase F).** The strongest available proof that this read
   * genuinely participates in Firestore's optimistic-concurrency conflict
   * detection is Firestore's own documented `Transaction.get()` contract —
   * every read performed via `transaction.get()` is, by definition, part of
   * that transaction's read set, and a concurrent committed write to a
   * document in that set forces the SDK to retry the transaction callback
   * before allowing commit. This is a structural, contractual guarantee of
   * the Admin SDK's transaction API, not something that needs to be
   * independently re-proven per call site.
   *
   * A live two-transaction interleaving proof against the **local Firestore
   * Emulator** was attempted here (holding this transaction open via an
   * artificial pause immediately after its `transaction.get()` read, then
   * committing a concurrent write to the same document, then releasing the
   * pause). It was reproducibly unsuccessful for a reason worth recording
   * honestly: the local emulator, unlike documented production behavior,
   * allowed the paused transaction to commit its stale read with no
   * conflict detected — i.e., it did not force a retry. This was verified
   * directly with a minimal standalone repro script against a bare
   * `db.runTransaction` call with no `businessTermsConfigRepository.ts`
   * code involved at all, ruling out an application-level bug: the gap is
   * in the local emulator's transaction-contention fidelity for this
   * interleaving shape, not in this module. This is reported here rather
   * than shipping a flaky or falsely-passing test — see the independent
   * review report for the reproduction details.
   *
   * What *is* proven by real, deterministic, passing emulator tests
   * (`acceptBusinessTermsCommand.emulator.test.ts` tests 26/34, and this
   * file's own tests above): a config value changed at any point before a
   * transaction's `transaction.get()` call is what that transaction
   * observes and enforces — the functional behavior every caller actually
   * depends on. Combined with the structural read-set guarantee above,
   * this is the correction the independent review requires: the version
   * check is now backed by a real Firestore document read, not a
   * `process.env` read that could never have participated in conflict
   * detection under any interleaving, proven or not.
   */
  it.skip("DISCLOSED FINDING (not proven here): a concurrent write during a deliberately-held-open transaction did not force a retry against the local Firestore Emulator, despite this being production Firestore's documented `transaction.get()` contract — see the review report", () => {});
});
