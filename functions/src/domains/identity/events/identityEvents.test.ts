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
  buildAuthenticationReferenceConflictDetectedEvent,
  buildTrustReferenceUpdatedEvent,
  buildIdentityBecameDormantEvent,
  buildIdentityRecoveredEvent,
  buildIdentityLookupAttemptedEvent,
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
  it("builds the linked event with the reference id, type, authority, and reason (ENG-P2-001-08)", () => {
    const event = buildAuthenticationReferenceLinkedEvent({
      ...base,
      customerIdentityId: "cust_1",
      referenceId: "authuid_1",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
    });

    expect(event.eventType).toBe("identity.authentication_reference_linked.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      referenceId: "authuid_1",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
    });
  });
});

describe("buildAuthenticationReferenceUnlinkedEvent", () => {
  it("builds the unlinked event with authority and reason (ENG-P2-001-08)", () => {
    const event = buildAuthenticationReferenceUnlinkedEvent({
      ...base,
      customerIdentityId: "cust_1",
      referenceId: "authuid_1",
      authority: "customer_initiated",
      reason: "customer_request",
    });
    expect(event.eventType).toBe("identity.authentication_reference_unlinked.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      referenceId: "authuid_1",
      authority: "customer_initiated",
      reason: "customer_request",
    });
  });
});

describe("buildAuthenticationReferenceConflictDetectedEvent", () => {
  it("builds the conflict-detected event without exposing which other identity owns the reference", () => {
    const event = buildAuthenticationReferenceConflictDetectedEvent({
      ...base,
      customerIdentityId: "cust_1",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
    });
    expect(event.eventType).toBe("identity.authentication_reference_conflict_detected.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
    });
  });

  it("never carries the owning identity, raw subject id, phone numbers, emails, or tokens", () => {
    const event = buildAuthenticationReferenceConflictDetectedEvent({
      ...base,
      customerIdentityId: "cust_1",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
    });
    const keys = Object.keys(event.payload).map((k) => k.toLowerCase());
    for (const forbidden of ["owner", "referenceid", "phone", "email", "token"]) {
      expect(keys).not.toContain(forbidden);
    }
  });
});

describe("buildIdentityLookupAttemptedEvent", () => {
  it("builds a resolved lookup event carrying the resolved identity id", () => {
    const event = buildIdentityLookupAttemptedEvent({
      ...base,
      customerIdentityId: "cust_1",
      lookupType: "loyalty_number",
      purpose: "support",
      outcome: "resolved",
    });
    expect(event.eventType).toBe("identity.identity_lookup_attempted.v1");
    expect(event.aggregateId).toBe("cust_1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      lookupType: "loyalty_number",
      purpose: "support",
      outcome: "resolved",
    });
  });

  it("builds a not-found lookup event with no resolved identity id", () => {
    const event = buildIdentityLookupAttemptedEvent({
      ...base,
      customerIdentityId: null,
      lookupType: "qr_reference",
      purpose: "recovery",
      outcome: "not_found",
    });
    expect(event.aggregateId).toBe("unresolved");
    expect(event.payload).toEqual({
      customerIdentityId: null,
      lookupType: "qr_reference",
      purpose: "recovery",
      outcome: "not_found",
    });
  });

  it("never carries the raw looked-up value, phone numbers, emails, or tokens", () => {
    const event = buildIdentityLookupAttemptedEvent({
      ...base,
      customerIdentityId: null,
      lookupType: "authentication_reference",
      purpose: "authentication",
      outcome: "purpose_not_permitted",
    });
    const keys = Object.keys(event.payload).map((k) => k.toLowerCase());
    for (const forbidden of ["value", "referenceid", "phone", "email", "token"]) {
      expect(keys).not.toContain(forbidden);
    }
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
  it("builds the recovered event, carrying previous/resulting status, authority, reason, and proof evidence (ENG-P2-001-07)", () => {
    const event = buildIdentityRecoveredEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "locked",
      resultingStatus: "active",
      authority: "support_initiated",
      reason: "support_recovery",
      recoveryProofReference: "proof_1",
      proofMethodCategory: "support_assisted",
    });
    expect(event.eventType).toBe("identity.identity_recovered.v1");
    expect(event.payload).toEqual({
      customerIdentityId: "cust_1",
      previousStatus: "locked",
      resultingStatus: "active",
      authority: "support_initiated",
      reason: "support_recovery",
      recoveryProofReference: "proof_1",
      proofMethodCategory: "support_assisted",
    });
  });

  it("never carries phone numbers, emails, tokens, or trust evidence", () => {
    const event = buildIdentityRecoveredEvent({
      ...base,
      customerIdentityId: "cust_1",
      previousStatus: "suspended",
      resultingStatus: "active",
      authority: "administrator_initiated",
      reason: "support_recovery",
      recoveryProofReference: "proof_2",
      proofMethodCategory: "administrator_assisted",
    });
    const keys = Object.keys(event.payload).map((k) => k.toLowerCase());
    for (const forbidden of ["phone", "email", "token", "trust"]) {
      expect(keys).not.toContain(forbidden);
    }
  });
});
