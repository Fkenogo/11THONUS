import { describe, expect, it } from "vitest";
import type { DomainEvent } from "../events/domainEvent";
import type { OutboxEntry } from "./outboxEntry";

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

describe("OutboxEntry", () => {
  it("accepts a pending entry with only the required fields", () => {
    const entry: OutboxEntry<{ purchaseId: string }> = {
      id: "evt-1",
      event,
      status: "pending",
      retryCount: 0,
      createdAt: {} as never,
    };

    expect(entry.status).toBe("pending");
  });

  it("accepts a dead_letter entry with the full deadLetter object populated", () => {
    const entry: OutboxEntry<{ purchaseId: string }> = {
      id: "evt-1",
      event,
      status: "dead_letter",
      retryCount: 5,
      lastError: { message: "boom", classification: "non_retryable", occurredAt: {} as never },
      deadLetter: {
        reason: "max_retries_exceeded",
        processingAttempts: 5,
        recommendedAction: "Investigate downstream failure before manual replay.",
      },
      createdAt: {} as never,
    };

    expect(entry.deadLetter?.reason).toBe("max_retries_exceeded");
  });
});
