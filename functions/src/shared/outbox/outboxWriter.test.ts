import { describe, expect, it, vi } from "vitest";
import type { DomainEvent } from "../events/domainEvent";
import { writeOutboxEntry } from "./outboxWriter";

const event: DomainEvent<{ purchaseId: string }> = {
  eventId: "evt-1",
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

describe("writeOutboxEntry", () => {
  it("writes the entry to the outbox collection at the event's own ID, via the given transaction", () => {
    const docRef = { id: "evt-1" };
    const doc = vi.fn().mockReturnValue(docRef);
    const collection = vi.fn().mockReturnValue({ doc });
    const db = { collection } as never;
    const transactionSet = vi.fn();
    const transaction = { set: transactionSet } as never;

    writeOutboxEntry(transaction, db, event);

    expect(collection).toHaveBeenCalledWith("outboxEntries");
    expect(doc).toHaveBeenCalledWith("evt-1");
    expect(transactionSet).toHaveBeenCalledWith(
      docRef,
      expect.objectContaining({ event, status: "pending", retryCount: 0 }),
    );
  });
});
