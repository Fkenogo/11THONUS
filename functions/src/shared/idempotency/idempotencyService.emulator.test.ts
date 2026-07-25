import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  checkIdempotency,
  completeIdempotencyKey,
  failIdempotencyKey,
  reserveIdempotencyKey,
} from "./idempotencyService";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" });
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

describe("idempotency Firestore round trip", () => {
  it("reports 'new' before a key has been reserved", async () => {
    const result = await checkIdempotency(db, "key-new", "hash-1", "corr-1");

    expect(result).toEqual({ outcome: "new" });
  });

  it("reports 'duplicate' with the stored record after reservation, for the same request hash", async () => {
    await reserveIdempotencyKey(db, {
      idempotencyKey: "key-duplicate",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
    });

    const result = await checkIdempotency(db, "key-duplicate", "hash-1", "corr-1");

    expect(result.outcome).toBe("duplicate");
    if (result.outcome === "duplicate") {
      expect(result.record.status).toBe("processing");
      expect(result.record.requestHash).toBe("hash-1");
    }
  });

  it("reports 'conflict' when the same key is reused with a different request hash", async () => {
    await reserveIdempotencyKey(db, {
      idempotencyKey: "key-conflict",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
    });

    const result = await checkIdempotency(db, "key-conflict", "hash-different", "corr-1");

    expect(result).toEqual({
      outcome: "conflict",
      error: {
        code: "IDEMPOTENCY_CONFLICT",
        messageKey: "errors.idempotencyConflict",
        correlationId: "corr-1",
        retryable: false,
      },
    });
  });

  it("reflects 'completed' status and resultReference after completeIdempotencyKey", async () => {
    await reserveIdempotencyKey(db, {
      idempotencyKey: "key-complete",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
    });

    await completeIdempotencyKey(db, "key-complete", "purchases/p-1");

    const result = await checkIdempotency(db, "key-complete", "hash-1", "corr-1");

    expect(result.outcome).toBe("duplicate");
    if (result.outcome === "duplicate") {
      expect(result.record.status).toBe("completed");
      expect(result.record.resultReference).toBe("purchases/p-1");
    }
  });

  it("reflects 'failed' status after failIdempotencyKey", async () => {
    await reserveIdempotencyKey(db, {
      idempotencyKey: "key-failed",
      operationType: "purchase.recordPurchase",
      actorId: "actor-1",
      requestHash: "hash-1",
    });

    await failIdempotencyKey(db, "key-failed");

    const result = await checkIdempotency(db, "key-failed", "hash-1", "corr-1");

    expect(result.outcome).toBe("duplicate");
    if (result.outcome === "duplicate") {
      expect(result.record.status).toBe("failed");
    }
  });
});
