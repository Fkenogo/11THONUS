import { describe, expect, it } from "vitest";
import {
  buildBusinessProfileUpdatedEvent,
  buildBusinessLifecycleChangedEvent,
  buildBusinessBranchUpdatedEvent,
} from "./businessEvents";

const actor = { actorType: "user" as const, actorId: "cust_1" };
const envelope = {
  eventId: "evt-1",
  correlationId: "corr-1",
  actor,
  occurredAt: "2026-08-19T00:00:00.000Z",
};

describe("buildBusinessProfileUpdatedEvent (ENG-P2-002C, Phase Q)", () => {
  it("carries only businessId and the changed field names — never values", () => {
    const event = buildBusinessProfileUpdatedEvent({
      ...envelope,
      businessId: "biz-1",
      updatedFields: ["displayName", "contactPhone"],
    });

    expect(event.eventType).toBe("business.business_profile_updated.v1");
    expect(event.aggregateId).toBe("biz-1");
    expect(event.payload).toEqual({
      businessId: "biz-1",
      updatedFields: ["displayName", "contactPhone"],
    });
    // Privacy-minimal: no field values anywhere in the payload.
    expect(JSON.stringify(event.payload)).not.toContain("New Name Café");
  });
});

describe("buildBusinessLifecycleChangedEvent (ENG-P2-002C, Phase Q)", () => {
  it("carries businessId, fromStatus, toStatus", () => {
    const event = buildBusinessLifecycleChangedEvent({
      ...envelope,
      businessId: "biz-1",
      fromStatus: "draft",
      toStatus: "pending_verification",
    });

    expect(event.eventType).toBe("business.business_lifecycle_changed.v1");
    expect(event.payload).toEqual({
      businessId: "biz-1",
      fromStatus: "draft",
      toStatus: "pending_verification",
    });
  });
});

describe("buildBusinessBranchUpdatedEvent (ENG-P2-002C, Phase Q)", () => {
  it("carries businessId, branchId, and the changed field names — never values", () => {
    const event = buildBusinessBranchUpdatedEvent({
      ...envelope,
      businessId: "biz-1",
      branchId: "branch-1",
      updatedFields: ["city"],
    });

    expect(event.eventType).toBe("business.business_branch_updated.v1");
    expect(event.aggregateId).toBe("branch-1");
    expect(event.payload).toEqual({
      businessId: "biz-1",
      branchId: "branch-1",
      updatedFields: ["city"],
    });
  });
});
