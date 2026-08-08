import { describe, expect, it } from "vitest";
import {
  AUTHENTICATION_EVENT_TYPES,
  AUTHENTICATION_SOURCE_DOMAIN,
  type CustomerAuthenticatedPayload,
  type AuthenticationRecoveryProofProvidedPayload,
} from "./authenticationEvents";
import type { DomainEvent } from "../../../shared/events/domainEvent";

describe("authentication event contracts", () => {
  it("declares its own bounded, closed set of event types (contracts only, no emission)", () => {
    expect(AUTHENTICATION_EVENT_TYPES).toContain("CustomerAuthenticated");
    expect(AUTHENTICATION_EVENT_TYPES).toContain("AuthenticationRecoveryProofProvided");
    // closed set — exactly the events Authentication newly owns
    expect(AUTHENTICATION_EVENT_TYPES).toHaveLength(2);
  });

  it("names the source domain for outbox routing", () => {
    expect(AUTHENTICATION_SOURCE_DOMAIN).toBe("authentication");
  });

  it("carries only privacy-safe reference payloads (no credential material)", () => {
    const event: DomainEvent<CustomerAuthenticatedPayload> = {
      eventId: "e1",
      eventType: "CustomerAuthenticated",
      eventVersion: 1,
      sourceDomain: AUTHENTICATION_SOURCE_DOMAIN,
      aggregateType: "CustomerIdentity",
      aggregateId: "ci_123",
      correlationId: "corr_1",
      actor: { actorType: "user", actorId: "ci_123" },
      occurredAt: "2026-08-08T10:00:00.000Z",
      payload: { customerIdentityId: "ci_123", referenceType: "phone_otp" },
    };
    expect(event.payload.customerIdentityId).toBe("ci_123");
    expect(event.payload.referenceType).toBe("phone_otp");
    expect("token" in (event.payload as Record<string, unknown>)).toBe(false);

    const recovery: AuthenticationRecoveryProofProvidedPayload = {
      customerIdentityId: "ci_123",
      referenceType: "google_sign_in",
      proofMethodCategory: "provider_reauthentication",
    };
    expect(recovery.proofMethodCategory).toBe("provider_reauthentication");
  });
});
