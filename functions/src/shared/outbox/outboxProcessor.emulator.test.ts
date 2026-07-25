import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { DomainEvent } from "../events/domainEvent";
import {
  NonRetryableProcessingError,
  processOutboxEntries,
  RetryableProcessingError,
} from "./outboxProcessor";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.

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
