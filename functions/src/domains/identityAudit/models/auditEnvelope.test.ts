import { describe, expect, it } from "vitest";
import { toIdentityAuditRecord } from "./auditEnvelope";
import type { OutboxEntry } from "../../../shared/outbox/outboxEntry";

function buildOutboxEntry(overrides: Partial<OutboxEntry> = {}): OutboxEntry {
  return {
    id: "evt_1",
    event: {
      eventId: "evt_1",
      eventType: "identity.customer_identity_activated.v1",
      eventVersion: 1,
      sourceDomain: "identity",
      aggregateType: "customer_identity",
      aggregateId: "cust_1",
      correlationId: "corr_1",
      actor: { actorType: "service", actorId: "svc_1" },
      occurredAt: "2026-08-05T10:00:00.000Z",
      payload: { customerIdentityId: "cust_1", previousStatus: "dormant" },
    },
    status: "completed",
    retryCount: 0,
    createdAt: { seconds: 1_754_388_000, nanoseconds: 0 } as never,
    ...overrides,
  };
}

describe("toIdentityAuditRecord", () => {
  it("projects a canonical audit record from an outbox entry", () => {
    const entry = buildOutboxEntry();
    const record = toIdentityAuditRecord(entry);

    expect(record).toEqual({
      eventId: "evt_1",
      eventType: "identity.customer_identity_activated.v1",
      eventVersion: 1,
      sourceDomain: "identity",
      aggregateType: "customer_identity",
      customerIdentityId: "cust_1",
      correlationId: "corr_1",
      causationId: undefined,
      actor: { actorType: "service", actorId: "svc_1" },
      occurredAt: "2026-08-05T10:00:00.000Z",
      persistedAt: entry.createdAt,
      status: "completed",
      privacyClassification: "class_2_internal_operational",
      payload: { customerIdentityId: "cust_1", previousStatus: "dormant" },
    });
  });

  it("carries causationId through when the underlying event has one", () => {
    const entry = buildOutboxEntry();
    entry.event.causationId = "cause_1";

    const record = toIdentityAuditRecord(entry);

    expect(record.causationId).toBe("cause_1");
  });

  it("classifies a loyalty number issuance event as class 3 personal data", () => {
    const entry = buildOutboxEntry();
    entry.event.eventType = "loyaltyNumber.loyalty_number_issued.v1";

    const record = toIdentityAuditRecord(entry);

    expect(record.privacyClassification).toBe("class_3_personal_data");
  });

  it("never exposes internal outbox processing fields (retryCount, lastError, deadLetter, claimedAt)", () => {
    const entry = buildOutboxEntry({
      retryCount: 2,
      lastError: { message: "boom", classification: "retryable", occurredAt: {} as never },
    });

    const record = toIdentityAuditRecord(entry);

    expect(record).not.toHaveProperty("retryCount");
    expect(record).not.toHaveProperty("lastError");
    expect(record).not.toHaveProperty("deadLetter");
    expect(record).not.toHaveProperty("claimedAt");
  });
});
