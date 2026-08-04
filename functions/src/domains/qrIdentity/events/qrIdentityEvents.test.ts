import { describe, expect, it } from "vitest";
import {
  buildQrIdentityIssuedEvent,
  buildQrIdentityInvalidatedEvent,
  buildQrIdentityRegeneratedEvent,
} from "./qrIdentityEvents";

const envelope = {
  eventId: "evt-1",
  correlationId: "corr-1",
  actor: { actorType: "system" as const, actorId: "qr-identity-service" },
  occurredAt: "2026-08-04T00:00:00.000Z",
};

describe("buildQrIdentityIssuedEvent", () => {
  it("builds a correctly typed event carrying the issued reference", () => {
    const event = buildQrIdentityIssuedEvent({
      ...envelope,
      customerIdentityId: "cust_1",
      qrReference: "abc123",
    });

    expect(event.eventType).toBe("qrIdentity.qr_identity_issued.v1");
    expect(event.sourceDomain).toBe("qrIdentity");
    expect(event.aggregateId).toBe("cust_1");
    expect(event.payload).toEqual({ customerIdentityId: "cust_1", qrReference: "abc123" });
  });
});

describe("buildQrIdentityInvalidatedEvent", () => {
  it("builds an event carrying the invalidated reference", () => {
    const event = buildQrIdentityInvalidatedEvent({
      ...envelope,
      customerIdentityId: "cust_1",
      qrReference: "abc123",
    });

    expect(event.eventType).toBe("qrIdentity.qr_identity_invalidated.v1");
    expect(event.payload).toEqual({ customerIdentityId: "cust_1", qrReference: "abc123" });
  });
});

describe("buildQrIdentityRegeneratedEvent", () => {
  it("builds an event carrying both the new and previous reference", () => {
    const event = buildQrIdentityRegeneratedEvent({
      ...envelope,
      customerIdentityId: "cust_1",
      qrReference: "def456",
      previousQrReference: "abc123",
    });

    expect(event.eventType).toBe("qrIdentity.qr_identity_regenerated.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      qrReference: "def456",
      previousQrReference: "abc123",
    });
  });
});
