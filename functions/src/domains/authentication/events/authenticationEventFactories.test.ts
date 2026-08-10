/**
 * AUTH-08 — authentication event factories (unit).
 *
 * Proves the pure construction of the two AUTH-08-owned fire-and-forget trust
 * signals (`CustomerAuthenticated`, `AuthenticationRecoveryProofProvided`) from
 * the shared `DomainEvent`/`buildEventType` contract: deterministic, retry-stable
 * event identity keyed on the logical operation's idempotency identity, the
 * governed snake_case event names the `-10` audit projection consumes, and
 * privacy-minimised payloads carrying only the AUTH-01 contract fields (no
 * credential/token/OTP/proof material).
 */

import { describe, expect, it } from "vitest";
import {
  buildCustomerAuthenticatedEvent,
  buildAuthenticationRecoveryProofProvidedEvent,
  deriveAuthenticationEventId,
} from "./authenticationEventFactories";

const occurredAt = "2026-08-10T12:00:00.000Z";

describe("buildCustomerAuthenticatedEvent", () => {
  const base = {
    customerIdentityId: "cid_1",
    referenceType: "phone_otp" as const,
    idempotencyKey: "idem-key-1",
    occurredAt,
  };

  it("builds the governed authentication.customer_authenticated.v1 envelope", () => {
    const event = buildCustomerAuthenticatedEvent(base);
    expect(event.eventType).toBe("authentication.customer_authenticated.v1");
    expect(event.eventVersion).toBe(1);
    expect(event.sourceDomain).toBe("authentication");
    expect(event.aggregateType).toBe("customer_identity");
    expect(event.aggregateId).toBe("cid_1");
    expect(event.actor).toEqual({ actorType: "user", actorId: "cid_1" });
    expect(event.occurredAt).toBe(occurredAt);
  });

  it("projects only the privacy-safe AUTH-01 payload fields", () => {
    const event = buildCustomerAuthenticatedEvent(base);
    expect(event.payload).toEqual({ customerIdentityId: "cid_1", referenceType: "phone_otp" });
  });

  it("derives a deterministic event id stable across the same logical retry", () => {
    const a = buildCustomerAuthenticatedEvent(base);
    const b = buildCustomerAuthenticatedEvent({ ...base, occurredAt: "2026-08-10T13:00:00.000Z" });
    // Same logical operation (same identity + idempotency key), different wall
    // clock on retry → identical event identity and correlation.
    expect(a.eventId).toBe(b.eventId);
    expect(a.correlationId).toBe(b.correlationId);
  });

  it("gives distinct legitimate authentications distinct event identities", () => {
    const differentKey = buildCustomerAuthenticatedEvent({ ...base, idempotencyKey: "idem-key-2" });
    const differentIdentity = buildCustomerAuthenticatedEvent({
      ...base,
      customerIdentityId: "cid_2",
    });
    const original = buildCustomerAuthenticatedEvent(base);
    expect(differentKey.eventId).not.toBe(original.eventId);
    expect(differentIdentity.eventId).not.toBe(original.eventId);
  });
});

describe("buildAuthenticationRecoveryProofProvidedEvent", () => {
  const base = {
    customerIdentityId: "cid_9",
    referenceType: "google_sign_in" as const,
    proofMethodCategory: "linked_provider",
    idempotencyKey: "rec-key-1",
    occurredAt,
  };

  it("builds the governed authentication.authentication_recovery_proof_provided.v1 envelope", () => {
    const event = buildAuthenticationRecoveryProofProvidedEvent(base);
    expect(event.eventType).toBe("authentication.authentication_recovery_proof_provided.v1");
    expect(event.sourceDomain).toBe("authentication");
    expect(event.aggregateType).toBe("customer_identity");
    expect(event.aggregateId).toBe("cid_9");
  });

  it("projects only the privacy-safe AUTH-01 payload fields (incl. proof-method category)", () => {
    const event = buildAuthenticationRecoveryProofProvidedEvent(base);
    expect(event.payload).toEqual({
      customerIdentityId: "cid_9",
      referenceType: "google_sign_in",
      proofMethodCategory: "linked_provider",
    });
  });

  it("derives a deterministic event id stable across the same logical retry", () => {
    const a = buildAuthenticationRecoveryProofProvidedEvent(base);
    const b = buildAuthenticationRecoveryProofProvidedEvent({
      ...base,
      occurredAt: "2026-08-10T14:00:00.000Z",
    });
    expect(a.eventId).toBe(b.eventId);
  });

  it("does not collide with a CustomerAuthenticated event sharing the same identity/key", () => {
    const shared = { customerIdentityId: "cid_x", idempotencyKey: "shared-key", occurredAt };
    const auth = buildCustomerAuthenticatedEvent({ ...shared, referenceType: "phone_otp" });
    const rec = buildAuthenticationRecoveryProofProvidedEvent({
      ...shared,
      referenceType: "phone_otp",
      proofMethodCategory: "phone_otp",
    });
    expect(auth.eventId).not.toBe(rec.eventId);
  });
});

describe("deriveAuthenticationEventId", () => {
  it("is a stable pure function of (eventName, customerIdentityId, idempotencyKey)", () => {
    expect(deriveAuthenticationEventId("customer_authenticated", "cid_1", "k")).toBe(
      deriveAuthenticationEventId("customer_authenticated", "cid_1", "k"),
    );
    expect(deriveAuthenticationEventId("customer_authenticated", "cid_1", "k")).not.toBe(
      deriveAuthenticationEventId("customer_authenticated", "cid_1", "k2"),
    );
  });

  it("produces a Firestore-safe document id (no slashes)", () => {
    const id = deriveAuthenticationEventId("customer_authenticated", "cid/1", "k");
    expect(id).not.toContain("/");
  });
});
