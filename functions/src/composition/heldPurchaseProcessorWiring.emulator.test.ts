/**
 * WP-COM-06a -- held-Purchase processor wiring against the real Firestore Emulator.
 *
 * Proves the post-commit signal's coalescing (Business + time window, NOT trigger reason), the
 * persisted continuation state used for Business fairness, and the persisted run summary.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../shared/logging/logger", () => ({ log: vi.fn() }));

import { log } from "../shared/logging/logger";
import {
  HELD_PURCHASE_RUN_COLLECTION,
  HELD_PURCHASE_SIGNAL_COLLECTION,
  HELD_PURCHASE_STATE_COLLECTION,
  SIGNAL_COALESCING_WINDOW_MS,
  admissionSignalDocumentId,
  claimAdmissionSignal,
  createAdmissionSignalNotifier,
  createFirestoreRecoveryStateStore,
  createHeldPurchaseObserver,
} from "./heldPurchaseProcessorWiring";

const app = initializeApp({ projectId: "demo-11thonus" }, "heldPurchaseWiringEmulatorTest");
const db = getFirestore(app);

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error("FIRESTORE_EMULATOR_HOST is not set — run under the Firebase Emulator Suite.");
  }
});
afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});
beforeEach(async () => {
  vi.mocked(log).mockClear();
  for (const name of [
    HELD_PURCHASE_SIGNAL_COLLECTION,
    HELD_PURCHASE_STATE_COLLECTION,
    HELD_PURCHASE_RUN_COLLECTION,
  ]) {
    const snapshot = await db.collection(name).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

const T0 = new Date("2026-10-01T12:00:10.000Z");
const signal = (businessId: string, reason: string) => ({
  businessId,
  reason,
  correlationId: `corr-${reason}`,
});

describe("signal coalescing: one document per Business per window", () => {
  it("collapses every reason for one Business in one window into ONE signal document", async () => {
    const notifier = createAdmissionSignalNotifier(db, { now: () => T0 });
    await notifier.notify(signal("biz-a", "settlement_confirmed"));
    await notifier.notify(signal("biz-a", "trial_granted"));
    await notifier.notify(signal("biz-a", "settlement_confirmed"));
    const docs = await db.collection(HELD_PURCHASE_SIGNAL_COLLECTION).get();
    expect(docs.size).toBe(1); // => a single processor invocation, not one per trigger type
    const data = docs.docs[0].data();
    expect(data["businessId"]).toBe("biz-a");
    expect([...data["reasons"]].sort()).toEqual(["settlement_confirmed", "trial_granted"]);
    expect(data["signalCount"]).toBe(3);
    expect(data["expiresAt"]).toBeDefined(); // TTL hint
  });

  it("keeps Businesses isolated", async () => {
    const notifier = createAdmissionSignalNotifier(db, { now: () => T0 });
    await notifier.notify(signal("biz-a", "trial_granted"));
    await notifier.notify(signal("biz-b", "trial_granted"));
    const docs = await db.collection(HELD_PURCHASE_SIGNAL_COLLECTION).get();
    expect(docs.docs.map((d) => d.data()["businessId"]).sort()).toEqual(["biz-a", "biz-b"]);
  });

  it("opens a NEW document once the window has passed (a later change is not swallowed)", async () => {
    let now = T0;
    const notifier = createAdmissionSignalNotifier(db, { now: () => now });
    await notifier.notify(signal("biz-a", "trial_granted"));
    now = new Date(T0.getTime() + SIGNAL_COALESCING_WINDOW_MS);
    await notifier.notify(signal("biz-a", "trial_granted"));
    expect((await db.collection(HELD_PURCHASE_SIGNAL_COLLECTION).get()).size).toBe(2);
  });

  it("derives the id from Business + window only, never from the reason", () => {
    const a = admissionSignalDocumentId("biz-a", T0, SIGNAL_COALESCING_WINDOW_MS);
    const b = admissionSignalDocumentId(
      "biz-a",
      new Date(T0.getTime() + 20_000),
      SIGNAL_COALESCING_WINDOW_MS,
    );
    expect(a).toBe(b); // same minute
    expect(a).toMatch(/^biz-a__\d+$/);
    expect(admissionSignalDocumentId("a/b", T0, SIGNAL_COALESCING_WINDOW_MS)).not.toContain("/");
  });

  it("claims every signal counted so far exactly once, including signals that arrive after an earlier claim", async () => {
    const notifier = createAdmissionSignalNotifier(db, { now: () => T0 });
    const id = admissionSignalDocumentId("biz-a", T0, SIGNAL_COALESCING_WINDOW_MS);
    expect(await claimAdmissionSignal(db, id)).toBe(false); // no such document
    await notifier.notify(signal("biz-a", "trial_granted"));
    expect(await claimAdmissionSignal(db, id)).toBe(true);
    expect(await claimAdmissionSignal(db, id)).toBe(false); // nothing new (also the re-fire case)
    await notifier.notify(signal("biz-a", "credit_adjusted_up")); // coalesced, after the first claim
    expect(await claimAdmissionSignal(db, id)).toBe(true); // not swallowed
    expect(await claimAdmissionSignal(db, id)).toBe(false);
    // Concurrent claimants: exactly one wins a given count.
    await notifier.notify(signal("biz-a", "settlement_confirmed"));
    const wins = await Promise.all(Array.from({ length: 6 }, () => claimAdmissionSignal(db, id)));
    expect(wins.filter(Boolean)).toHaveLength(1);
  });

  it("a concurrent burst of signals still yields exactly one document", async () => {
    const notifier = createAdmissionSignalNotifier(db, { now: () => T0 });
    await Promise.all(
      Array.from({ length: 8 }, (_, i) => notifier.notify(signal("biz-a", `reason_${i % 3}`))),
    );
    const docs = await db.collection(HELD_PURCHASE_SIGNAL_COLLECTION).get();
    expect(docs.size).toBe(1);
    expect(docs.docs[0].data()["signalCount"]).toBe(8);
  });
});

describe("persisted continuation state (fairness)", () => {
  it("round-trips the Business cursor and per-Business tail cursors, including a wrap", async () => {
    const store = createFirestoreRecoveryStateStore(db);
    expect(await store.getBusinessCursor()).toBeNull();
    await store.setBusinessCursor("biz-c");
    expect(await store.getBusinessCursor()).toBe("biz-c");
    await store.setBusinessCursor(null);
    expect(await store.getBusinessCursor()).toBeNull();

    const cursor = { purchaseDate: "2026-09-28 10:00:00.123456+00", id: "id-1" };
    expect(await store.getTailCursor("biz-a")).toBeNull();
    await store.setTailCursor("biz-a", cursor);
    expect(await store.getTailCursor("biz-a")).toEqual(cursor);
    expect(await store.getTailCursor("biz-b")).toBeNull();
    await store.setTailCursor("biz-a", null);
    expect(await store.getTailCursor("biz-a")).toBeNull();
  });
});

describe("observability: structured logs + persisted run state", () => {
  it("logs per-Purchase failures at the right severity with no payload data", () => {
    const observer = createHeldPurchaseObserver(db);
    observer.purchaseFailure!({
      businessId: "biz-a",
      purchaseId: "p-1",
      failureClass: "permanent",
      code: "CONSTRAINT_23514",
      correlationId: "c-1",
    });
    observer.purchaseFailure!({
      businessId: "biz-a",
      purchaseId: "p-2",
      failureClass: "transient",
      code: "DEADLOCK_DETECTED",
      correlationId: "c-1",
    });
    const entries = vi.mocked(log).mock.calls.map((c) => c[0]);
    expect(entries.map((e) => [e.operation, e.severity, e.errorCode])).toEqual([
      ["held_purchase_failed", "error", "CONSTRAINT_23514"],
      ["held_purchase_failed", "warning", "DEADLOCK_DETECTED"],
    ]);
    expect(entries[0]).toMatchObject({
      domain: "purchase",
      businessId: "biz-a",
      aggregateId: "p-1",
    });
  });

  it("a continuation-state failure is logged at error severity BEFORE persistence, so it survives a Firestore outage", async () => {
    const deadDb = {
      collection: () => ({
        doc: () => ({
          set: async () => {
            throw new Error("firestore unavailable");
          },
        }),
      }),
    } as unknown as Parameters<typeof createHeldPurchaseObserver>[0];
    const observer = createHeldPurchaseObserver(deadDb);
    await expect(
      observer.runCompleted!({
        correlationId: "run-state",
        status: "partial",
        startedAt: T0,
        durationMs: 5,
        businessesExamined: 1,
        businessesFailed: 0,
        businessesSaturated: 0,
        purchasesExamined: 1,
        admittedFromPending: 0,
        stillHeld: 1,
        skippedForCapacity: 0,
        skippedOvertaken: 0,
        notPending: 0,
        failedTransient: 0,
        failedPermanent: 0,
        cursorStart: null,
        cursorEnd: null,
        wrapped: false,
        budgetExhausted: false,
        stateError: true,
        backlog: null,
      }),
    ).rejects.toThrow("firestore unavailable"); // persistence failure is NOT swallowed
    const entries = vi.mocked(log).mock.calls.map((c) => c[0]);
    expect(entries.map((e) => [e.operation, e.severity, e.errorCode])).toEqual([
      ["held_purchase_continuation_state_failed", "error", "CONTINUATION_STATE_FAILED"],
      ["held_purchase_recovery_run", "error", undefined],
    ]);
  });

  it("reports a saturated scan window and persists the run summary + latest state", async () => {
    const observer = createHeldPurchaseObserver(db);
    const stats = {
      businessId: "biz-a",
      examined: 1000,
      windowLimit: 1000,
      saturated: true,
      lastCursor: null,
      admitted: 0,
      held: 1000,
      heldByReason: { insufficient_capacity: 1000 },
      skippedOvertaken: 0,
      notPending: 0,
      failedTransient: 0,
      failedPermanent: 0,
    };
    observer.businessPass!({
      businessId: "biz-a",
      trigger: "recovery",
      correlationId: "c-2",
      head: stats,
      tail: null,
      headSaturated: true,
      stateError: false,
      durationMs: 12,
    });
    expect(vi.mocked(log).mock.calls.map((c) => c[0].operation)).toEqual([
      "held_purchase_business_pass_recovery",
      "held_purchase_scan_window_saturated",
    ]);

    await observer.runCompleted!({
      correlationId: "run-1",
      status: "partial",
      startedAt: T0,
      durationMs: 321,
      businessesExamined: 3,
      businessesFailed: 0,
      businessesSaturated: 1,
      purchasesExamined: 1010,
      admittedFromPending: 4,
      stillHeld: 1006,
      skippedForCapacity: 1000,
      skippedOvertaken: 2,
      notPending: 0,
      failedTransient: 1,
      failedPermanent: 0,
      cursorStart: null,
      cursorEnd: "biz-c",
      wrapped: false,
      budgetExhausted: false,
      stateError: false,
      backlog: {
        totalPending: 1006,
        businessesWithPending: 3,
        oldestPurchaseDate: new Date(T0.getTime() - 3600_000),
        businessesOverWindow: 1,
        topBusinesses: [
          {
            businessId: "biz-a",
            pending: 1000,
            oldestPurchaseDate: new Date(T0.getTime() - 3600_000),
          },
        ],
      },
    });
    const run = (await db.collection(HELD_PURCHASE_RUN_COLLECTION).doc("run-1").get()).data()!;
    const latest = (
      await db.collection(HELD_PURCHASE_STATE_COLLECTION).doc("latest").get()
    ).data()!;
    for (const doc of [run, latest]) {
      expect(doc).toMatchObject({
        status: "partial",
        admittedFromPending: 4,
        stillHeld: 1006,
        skippedForCapacity: 1000,
        skippedOvertaken: 2,
        failedTransient: 1,
        businessesSaturated: 1,
        durationMs: 321,
      });
      expect(doc["backlog"]).toMatchObject({
        totalPending: 1006,
        businessesOverWindow: 1,
        oldestPendingAgeSeconds: 3600,
      });
    }
    const calls = vi.mocked(log).mock.calls;
    const lastLog = calls[calls.length - 1]![0];
    expect(lastLog).toMatchObject({
      operation: "held_purchase_recovery_run",
      severity: "warning",
      result: "partial",
      durationMs: 321,
    });
  });
});
