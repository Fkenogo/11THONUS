/**
 * `ENG-P2-004C` — permission audit event factory tests. Mirrors the
 * assertions AUTH-08's own `authenticationEventFactories.test.ts` makes
 * for its deterministic eventId derivation.
 */

import { describe, it, expect } from "vitest";
import {
  buildPermissionDecisionRecordedEvent,
  derivePermissionAuditEventId,
} from "./permissionAuditEventFactory";

const BASE_PARAMS = {
  actorUserId: "user-1",
  businessId: "biz-a",
  membershipId: "mem-1",
  permission: "staff.manage",
  result: "allow" as const,
  decisionSource: "owner-floor" as const,
  effectiveRole: "owner" as const,
  reasonCode: "OWNER_FLOOR" as const,
  idempotencyKey: "key-1",
  occurredAt: "2026-08-15T00:00:00.000Z",
};

describe("derivePermissionAuditEventId", () => {
  it("is deterministic for the same (businessId, idempotencyKey)", () => {
    const id1 = derivePermissionAuditEventId("biz-a", "key-1");
    const id2 = derivePermissionAuditEventId("biz-a", "key-1");
    expect(id1).toBe(id2);
  });

  it("differs for a different idempotencyKey", () => {
    const id1 = derivePermissionAuditEventId("biz-a", "key-1");
    const id2 = derivePermissionAuditEventId("biz-a", "key-2");
    expect(id1).not.toBe(id2);
  });

  it("differs for a different businessId", () => {
    const id1 = derivePermissionAuditEventId("biz-a", "key-1");
    const id2 = derivePermissionAuditEventId("biz-b", "key-1");
    expect(id1).not.toBe(id2);
  });

  it("is Firestore-doc-id-safe (hex digest, no '/')", () => {
    const id = derivePermissionAuditEventId("biz-a", "key-1");
    expect(id).toMatch(/^permaudit_[0-9a-f]{64}$/);
  });
});

describe("buildPermissionDecisionRecordedEvent", () => {
  it("builds a well-formed DomainEvent envelope", () => {
    const event = buildPermissionDecisionRecordedEvent(BASE_PARAMS);
    expect(event.eventType).toBe("permissions.permission_decision_recorded.v1");
    expect(event.sourceDomain).toBe("permissions");
    expect(event.aggregateType).toBe("business_membership");
    expect(event.aggregateId).toBe("mem-1");
    expect(event.actor).toEqual({ actorType: "user", actorId: "user-1" });
    expect(event.payload.privacyClassification).toBe("class_2_internal_operational");
    expect(event.payload.schemaVersion).toBe(1);
  });

  it("falls back to businessId as aggregateId when no membershipId is available", () => {
    const event = buildPermissionDecisionRecordedEvent({ ...BASE_PARAMS, membershipId: undefined });
    expect(event.aggregateId).toBe("biz-a");
    expect(event.payload.membershipId).toBeUndefined();
  });

  it("omits effectiveRole from the payload when the decision has no resolved role", () => {
    const event = buildPermissionDecisionRecordedEvent({
      ...BASE_PARAMS,
      effectiveRole: undefined,
    });
    expect(Object.keys(event.payload)).not.toContain("effectiveRole");
  });
});
