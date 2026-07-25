import { describe, expect, it } from "vitest";
import type { DomainEvent } from "./domainEvent";

describe("DomainEvent", () => {
  it("accepts an event with only the required fields", () => {
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

    expect(event.payload.purchaseId).toBe("p-1");
  });

  it("accepts an event with causationId and actor.role populated", () => {
    const event: DomainEvent<{ purchaseId: string }> = {
      eventId: "evt-1",
      eventType: "purchase.purchaseRecorded.v1",
      eventVersion: 1,
      sourceDomain: "purchase",
      aggregateType: "Purchase",
      aggregateId: "agg-1",
      correlationId: "corr-1",
      causationId: "cmd-1",
      actor: { actorType: "service", actorId: "outboxProcessor", role: "system" },
      occurredAt: "2026-07-25T00:00:00.000Z",
      payload: { purchaseId: "p-1" },
    };

    expect(event.causationId).toBe("cmd-1");
    expect(event.actor.actorType).toBe("service");
  });
});
