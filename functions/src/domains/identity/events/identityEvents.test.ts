import { describe, expect, it } from "vitest";
import {
  buildCustomerIdentityRegisteredEvent,
  buildCustomerIdentityActivatedEvent,
  buildCustomerIdentitySuspendedEvent,
  buildCustomerIdentityLockedEvent,
  buildCustomerIdentityClosedEvent,
  buildCustomerIdentityArchivedEvent,
  buildAuthenticationReferenceLinkedEvent,
  buildAuthenticationReferenceUnlinkedEvent,
  buildTrustReferenceUpdatedEvent,
  buildIdentityBecameDormantEvent,
  buildIdentityRecoveredEvent,
} from "./identityEvents";

const base = {
  eventId: "evt-1",
  correlationId: "corr-1",
  actor: { actorType: "user" as const, actorId: "cust_1" },
  occurredAt: "2026-08-02T00:00:00.000Z",
};

describe("buildCustomerIdentityRegisteredEvent", () => {
  it("builds a correctly-typed, versioned identity domain event", () => {
    const event = buildCustomerIdentityRegisteredEvent({
      ...base,
      customerIdentityId: "cust_1",
    });

    expect(event.eventType).toBe("identity.customer_identity_registered.v1");
    expect(event.sourceDomain).toBe("identity");
    expect(event.aggregateType).toBe("customer_identity");
    expect(event.aggregateId).toBe("cust_1");
    expect(event.payload).toEqual({ customerIdentityId: "cust_1" });
  });
});

describe("buildCustomerIdentityActivatedEvent", () => {
  it("records the previous status the reactivation transitioned from, plus authority and reason", () => {
    const event = buildCustomerIdentityActivatedEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "dormant",
      authority: "customer_initiated",
      reason: "customer_request",
    });

    expect(event.eventType).toBe("identity.customer_identity_activated.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      previousStatus: "dormant",
      authority: "customer_initiated",
      reason: "customer_request",
    });
  });
});

describe("buildCustomerIdentitySuspendedEvent", () => {
  it("builds the suspended event carrying authority and reason", () => {
    const event = buildCustomerIdentitySuspendedEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "active",
      authority: "administrator_initiated",
      reason: "administrative_suspension",
    });
    expect(event.eventType).toBe("identity.customer_identity_suspended.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      previousStatus: "active",
      authority: "administrator_initiated",
      reason: "administrative_suspension",
    });
  });
});

describe("buildCustomerIdentityLockedEvent", () => {
  it("builds the locked event carrying authority and reason", () => {
    const event = buildCustomerIdentityLockedEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "active",
      authority: "security_policy_initiated",
      reason: "suspected_compromise",
    });
    expect(event.eventType).toBe("identity.customer_identity_locked.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      previousStatus: "active",
      authority: "security_policy_initiated",
      reason: "suspected_compromise",
    });
  });
});

describe("buildCustomerIdentityClosedEvent", () => {
  it("builds the closed event carrying authority and reason", () => {
    const event = buildCustomerIdentityClosedEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "active",
      authority: "customer_initiated",
      reason: "account_closure",
    });
    expect(event.eventType).toBe("identity.customer_identity_closed.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      previousStatus: "active",
      authority: "customer_initiated",
      reason: "account_closure",
    });
  });
});

describe("buildCustomerIdentityArchivedEvent", () => {
  it("builds the archived event carrying authority and reason", () => {
    const event = buildCustomerIdentityArchivedEvent({
      ...base,
      customerIdentityId: "cust_1",
      authority: "system_initiated",
      reason: "archival_retention_completion",
    });
    expect(event.eventType).toBe("identity.customer_identity_archived.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      authority: "system_initiated",
      reason: "archival_retention_completion",
    });
  });
});

describe("buildAuthenticationReferenceLinkedEvent", () => {
  it("builds the linked event with the reference id and type", () => {
    const event = buildAuthenticationReferenceLinkedEvent({
      ...base,
      customerIdentityId: "cust_1",
      referenceId: "authuid_1",
      referenceType: "google_sign_in",
    });

    expect(event.eventType).toBe("identity.authentication_reference_linked.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      referenceId: "authuid_1",
      referenceType: "google_sign_in",
    });
  });
});

describe("buildAuthenticationReferenceUnlinkedEvent", () => {
  it("builds the unlinked event", () => {
    const event = buildAuthenticationReferenceUnlinkedEvent({
      ...base,
      customerIdentityId: "cust_1",
      referenceId: "authuid_1",
    });
    expect(event.eventType).toBe("identity.authentication_reference_unlinked.v1");
  });
});

describe("buildTrustReferenceUpdatedEvent", () => {
  it("builds the trust-reference-updated event", () => {
    const event = buildTrustReferenceUpdatedEvent({
      ...base,
      customerIdentityId: "cust_1",
      trustRecordId: "trust_1",
    });
    expect(event.eventType).toBe("identity.trust_reference_updated.v1");
    expect(event.payload).toEqual({ customerIdentityId: "cust_1", trustRecordId: "trust_1" });
  });
});

describe("buildIdentityBecameDormantEvent", () => {
  it("builds the became-dormant event carrying authority and reason", () => {
    const event = buildIdentityBecameDormantEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "active",
      authority: "system_initiated",
      reason: "customer_inactivity",
    });
    expect(event.eventType).toBe("identity.identity_became_dormant.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      previousStatus: "active",
      authority: "system_initiated",
      reason: "customer_inactivity",
    });
  });
});

describe("buildIdentityRecoveredEvent", () => {
  it("builds the recovered event, carrying the previous status, authority, and reason", () => {
    const event = buildIdentityRecoveredEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "locked",
      authority: "support_initiated",
      reason: "support_recovery",
    });
    expect(event.eventType).toBe("identity.identity_recovered.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      previousStatus: "locked",
      authority: "support_initiated",
      reason: "support_recovery",
    });
  });

  it("never carries phone numbers, emails, tokens, or trust evidence", () => {
    const event = buildIdentityRecoveredEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "suspended",
      authority: "administrator_initiated",
      reason: "support_recovery",
    });
    const keys = Object.keys(event.payload).map((k) => k.toLowerCase());
    for (const forbidden of ["phone", "email", "token", "trust"]) {
      expect(keys).not.toContain(forbidden);
    }
  });
});
