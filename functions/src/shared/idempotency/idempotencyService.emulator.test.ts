import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  checkAndReserveIdempotencyKey,
  checkIdempotency,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "./idempotencyService";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.
//
// ENG-P1-002-CR1: also proves the concurrency-safety corrections —
// checkAndReserveIdempotencyKey is the only path that claims ownership,
// and a "processing"/"failed" record is never mistaken for a safe
// cached success.

const app = initializeApp({ projectId: "demo-11thonus" }, "idempotencyServiceEmulatorTest");
const db = getFirestore(app);

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

beforeEach(async () => {
  const snapshot = await db.collection("idempotencyRecords").get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("checkIdempotency (read-only peek)", () => {
  it("reports 'new' before a key has been reserved", async () => {
    const result = await checkIdempotency(db, "key-new", "hash-1", "corr-1");

    expect(result).toEqual({ outcome: "new" });
  });
});

describe("checkAndReserveIdempotencyKey — atomic claim", () => {
  it("acquires ownership for a brand-new key", async () => {
    const result = await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-acquire",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
      correlationId: "corr-1",
    });

    expect(result).toEqual({ outcome: "acquired" });

    const stored = await db.collection("idempotencyRecords").doc("key-acquire").get();
    expect(stored.data()?.["status"]).toBe("processing");
  });

  it("reports 'in_progress' — not a synthesized duplicate — for a same-hash key still 'processing'", async () => {
    await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-in-progress",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
      correlationId: "corr-1",
    });

    const result = await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-in-progress",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
      correlationId: "corr-2",
    });

    expect(result).toEqual({ outcome: "in_progress" });
  });

  it("reports 'conflict' when the same key is reused with a different request hash", async () => {
    await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-conflict",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
      correlationId: "corr-1",
    });

    const result = await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-conflict",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-different",
      correlationId: "corr-2",
    });

    expect(result).toEqual({
      outcome: "conflict",
      error: {
        code: "IDEMPOTENCY_CONFLICT",
        messageKey: "errors.idempotencyConflict",
        correlationId: "corr-2",
        retryable: false,
      },
    });
  });

  it("reports 'duplicate' with the stored response after completeIdempotencyKey", async () => {
    await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-complete",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
      correlationId: "corr-1",
    });
    await completeIdempotencyKey(db, "key-complete", "purchases/p-1", { purchaseId: "p-1" });

    const result = await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-complete",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
      correlationId: "corr-2",
    });

    expect(result.outcome).toBe("duplicate");
    if (result.outcome === "duplicate") {
      expect(result.record.status).toBe("completed");
      expect(result.record.responseSnapshot).toEqual({ purchaseId: "p-1" });
    }
  });

  it("re-acquires ownership (treats as retryable) for a same-hash key that previously failed", async () => {
    await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-failed",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
      correlationId: "corr-1",
    });
    await failIdempotencyKey(db, "key-failed");

    const result = await checkAndReserveIdempotencyKey(db, {
      idempotencyKey: "key-failed",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
      correlationId: "corr-2",
    });

    expect(result).toEqual({ outcome: "acquired" });

    const stored = await db.collection("idempotencyRecords").doc("key-failed").get();
    expect(stored.data()?.["status"]).toBe("processing");
  });

  it("two simultaneous callers with the same key: exactly one acquires ownership", async () => {
    const attempt = () =>
      checkAndReserveIdempotencyKey(db, {
        idempotencyKey: "key-race",
        operationType: "purchase.recordPurchase",
        actorId: "actor-1",
        requestHash: "hash-1",
        correlationId: "corr-1",
      });

    const [first, second] = await Promise.all([attempt(), attempt()]);
    const outcomes = [first.outcome, second.outcome].sort();

    // Firestore transactions serialize the two concurrent attempts: exactly
    // one observes "acquired", the other observes the winner's write
    // ("in_progress", since the winner hasn't completed yet by the time
    // both transactions have settled).
    expect(outcomes).toEqual(["acquired", "in_progress"]);
  });
});
