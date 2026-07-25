import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { DomainEvent } from "../events/domainEvent";
import {
  applyOwnedTransition,
  claimOutboxEntry,
  NonRetryableProcessingError,
  processOutboxEntries,
  RetryableProcessingError,
} from "./outboxProcessor";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.
//
// ENG-P1-002-CR1: also proves the concurrent-worker safety corrections —
// only one of two racing claim attempts can obtain ownership, an expired
// claim can be recovered by another worker, and a worker that has lost
// ownership can no longer complete or retry the entry.

const app = initializeApp({ projectId: "demo-11thonus" }, "outboxProcessorEmulatorTest");
const db = getFirestore(app);

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

function makeEvent(eventId: string): DomainEvent<{ purchaseId: string }> {
  return {
    eventId,
    eventType: "purchase.purchaseRecorded.v1",
    eventVersion: 1,
    sourceDomain: "purchase",
    aggregateType: "Purchase",
    aggregateId: "agg-1",
    correlationId: "corr-1",
    actor: { actorType: "user", actorId: "actor-1" },
    occurredAt: "2026-07-25T00:00:00.000Z",
    payload: { purchaseId: "p-1" },
  };
}

async function seedPendingEntry(
  eventId: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await db
    .collection("outboxEntries")
    .doc(eventId)
    .set({
      event: makeEvent(eventId),
      status: "pending",
      retryCount: 0,
      createdAt: new Date(),
      ...extra,
    });
}

beforeEach(async () => {
  const snapshot = await db.collection("outboxEntries").get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("processOutboxEntries", () => {
  it("marks a successfully handled entry as completed", async () => {
    await seedPendingEntry("evt-success");

    await processOutboxEntries(db, async () => {
      // handler succeeds
    });

    const doc = await db.collection("outboxEntries").doc("evt-success").get();
    expect(doc.data()?.["status"]).toBe("completed");
  });

  it("moves an entry to pending with an incremented retry count after a retryable failure", async () => {
    await seedPendingEntry("evt-retry");

    await processOutboxEntries(db, async () => {
      throw new RetryableProcessingError("temporary downstream failure");
    });

    const doc = await db.collection("outboxEntries").doc("evt-retry").get();
    expect(doc.data()?.["status"]).toBe("pending");
    expect(doc.data()?.["retryCount"]).toBe(1);
    expect(doc.data()?.["nextRetryAt"]).toBeDefined();
  });

  it("moves an entry straight to dead_letter after a non-retryable failure", async () => {
    await seedPendingEntry("evt-dead-letter");

    await processOutboxEntries(db, async () => {
      throw new NonRetryableProcessingError(
        "unsupported event version",
        "invalid_payload_for_version",
      );
    });

    const doc = await db.collection("outboxEntries").doc("evt-dead-letter").get();
    expect(doc.data()?.["status"]).toBe("dead_letter");
    expect(doc.data()?.["deadLetter"]?.["reason"]).toBe("invalid_payload_for_version");
  });

  it("never reprocesses a completed entry (event replay safety)", async () => {
    await seedPendingEntry("evt-already-completed", { status: "completed" });

    let handlerCalls = 0;
    await processOutboxEntries(db, async () => {
      handlerCalls += 1;
    });

    expect(handlerCalls).toBe(0);
  });

  it("does not reprocess an entry whose nextRetryAt is still in the future", async () => {
    const future = new Date(Date.now() + 60_000);
    await seedPendingEntry("evt-not-due", { retryCount: 1, nextRetryAt: future });

    let handlerCalls = 0;
    await processOutboxEntries(db, async () => {
      handlerCalls += 1;
    });

    expect(handlerCalls).toBe(0);
  });
});

describe("claimOutboxEntry — concurrent-worker safety (ENG-P1-002-CR1)", () => {
  it("two workers racing to claim the same pending entry: exactly one obtains ownership", async () => {
    await seedPendingEntry("evt-race");

    const [first, second] = await Promise.all([
      claimOutboxEntry(db, "evt-race"),
      claimOutboxEntry(db, "evt-race"),
    ]);

    const claims = [first, second].filter((claim) => claim !== undefined);
    expect(claims).toHaveLength(1);

    const doc = await db.collection("outboxEntries").doc("evt-race").get();
    expect(doc.data()?.["status"]).toBe("processing");
  });

  it("does not claim a 'processing' entry whose claim has not yet expired", async () => {
    await seedPendingEntry("evt-live-claim");
    const original = await claimOutboxEntry(db, "evt-live-claim");
    expect(original).toBeDefined();

    // Default CLAIM_TIMEOUT_MS (5 minutes) has certainly not elapsed.
    const reclaim = await claimOutboxEntry(db, "evt-live-claim");

    expect(reclaim).toBeUndefined();
  });

  it("recovers an expired claim: a second worker can reclaim a 'processing' entry once the claim timeout has elapsed", async () => {
    await seedPendingEntry("evt-expired-claim");
    const original = await claimOutboxEntry(db, "evt-expired-claim");
    expect(original).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 20));

    // A 10ms claim-timeout override simulates an abandoned claim without
    // waiting out the real CLAIM_TIMEOUT_MS in the test.
    const reclaim = await claimOutboxEntry(db, "evt-expired-claim", 10);

    expect(reclaim).toBeDefined();
    expect(reclaim?.claimedAt.isEqual(original!.claimedAt)).toBe(false);
  });

  it("a stale worker cannot complete an entry after another worker has reclaimed it", async () => {
    await seedPendingEntry("evt-stale-complete");
    const staleClaim = await claimOutboxEntry(db, "evt-stale-complete");
    expect(staleClaim).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 20));
    const freshClaim = await claimOutboxEntry(db, "evt-stale-complete", 10);
    expect(freshClaim).toBeDefined();

    const staleApplied = await applyOwnedTransition(
      db,
      "evt-stale-complete",
      staleClaim!.claimedAt,
      {
        status: "completed",
        completedAt: new Date(),
      },
    );
    expect(staleApplied).toBe(false);

    const doc = await db.collection("outboxEntries").doc("evt-stale-complete").get();
    expect(doc.data()?.["status"]).toBe("processing");

    const freshApplied = await applyOwnedTransition(
      db,
      "evt-stale-complete",
      freshClaim!.claimedAt,
      {
        status: "completed",
        completedAt: new Date(),
      },
    );
    expect(freshApplied).toBe(true);

    const finalDoc = await db.collection("outboxEntries").doc("evt-stale-complete").get();
    expect(finalDoc.data()?.["status"]).toBe("completed");
  });

  it("a stale worker cannot retry-transition an entry after losing ownership — the fresh owner's failure handling is not clobbered", async () => {
    await seedPendingEntry("evt-stale-retry");
    const staleClaim = await claimOutboxEntry(db, "evt-stale-retry");
    expect(staleClaim).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 20));
    const freshClaim = await claimOutboxEntry(db, "evt-stale-retry", 10);
    expect(freshClaim).toBeDefined();

    // The stale worker (unaware it lost ownership) finishes and tries to
    // record a retryable failure — this must be rejected.
    const staleApplied = await applyOwnedTransition(db, "evt-stale-retry", staleClaim!.claimedAt, {
      status: "pending",
      retryCount: 1,
      nextRetryAt: new Date(Date.now() + 1_000),
      lastError: { message: "stale worker failure", classification: "retryable" },
    });
    expect(staleApplied).toBe(false);

    // The fresh owner then completes successfully — its state must win.
    const freshApplied = await applyOwnedTransition(db, "evt-stale-retry", freshClaim!.claimedAt, {
      status: "completed",
      completedAt: new Date(),
    });
    expect(freshApplied).toBe(true);

    const doc = await db.collection("outboxEntries").doc("evt-stale-retry").get();
    expect(doc.data()?.["status"]).toBe("completed");
  });

  it("end to end: two concurrent processOutboxEntries runs never both invoke the handler for the same entry", async () => {
    await seedPendingEntry("evt-concurrent-process");

    let handlerCalls = 0;
    const runWorker = () =>
      processOutboxEntries(db, async () => {
        handlerCalls += 1;
      });

    await Promise.all([runWorker(), runWorker()]);

    expect(handlerCalls).toBe(1);
    const doc = await db.collection("outboxEntries").doc("evt-concurrent-process").get();
    expect(doc.data()?.["status"]).toBe("completed");
  });
});
