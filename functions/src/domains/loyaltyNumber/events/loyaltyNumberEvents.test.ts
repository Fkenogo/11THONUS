import { describe, expect, it } from "vitest";
import {
  buildLoyaltyNumberIssuedEvent,
  buildLoyaltyNumberIssuanceCollisionDetectedEvent,
  buildLoyaltyNumberIssuanceFailedEvent,
} from "./loyaltyNumberEvents";

const envelope = {
  eventId: "evt-1",
  correlationId: "corr-1",
  actor: { actorType: "system" as const, actorId: "loyalty-number-service" },
  occurredAt: "2026-08-04T00:00:00.000Z",
};

describe("buildLoyaltyNumberIssuedEvent", () => {
  it("builds a correctly typed event carrying the assigned number", () => {
    const event = buildLoyaltyNumberIssuedEvent({
      ...envelope,
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC234",
    });

    expect(event.eventType).toBe("loyaltyNumber.loyalty_number_issued.v1");
    expect(event.sourceDomain).toBe("loyaltyNumber");
    expect(event.aggregateId).toBe("cust_1");
    expect(event.payload).toEqual({ customerIdentityId: "cust_1", loyaltyNumber: "ABC234" });
  });
});

describe("buildLoyaltyNumberIssuanceCollisionDetectedEvent", () => {
  it("builds an event that never carries the colliding candidate value", () => {
    const event = buildLoyaltyNumberIssuanceCollisionDetectedEvent({
      ...envelope,
      customerIdentityId: "cust_1",
      attemptNumber: 2,
    });

    expect(event.eventType).toBe("loyaltyNumber.loyalty_number_issuance_collision_detected.v1");
    expect(event.payload).toEqual({ customerIdentityId: "cust_1", attemptNumber: 2 });
    expect(JSON.stringify(event)).not.toContain("candidate");
  });
});

describe("buildLoyaltyNumberIssuanceFailedEvent", () => {
  it("builds an event carrying only the identity and attempt count", () => {
    const event = buildLoyaltyNumberIssuanceFailedEvent({
      ...envelope,
      customerIdentityId: "cust_1",
      attemptsMade: 5,
    });

    expect(event.eventType).toBe("loyaltyNumber.loyalty_number_issuance_failed.v1");
    expect(event.payload).toEqual({ customerIdentityId: "cust_1", attemptsMade: 5 });
  });
});
