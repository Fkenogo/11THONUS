import { describe, expect, it } from "vitest";
import { recoverCustomerIdentity } from "./identityLifecycleService";
import { registerCustomerIdentity, type CustomerIdentity } from "../models/customerIdentity";
import { transitionIdentityStatus } from "../models/customerIdentity";
import { IdentityDomainError } from "../models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

const actor: EventActor = { actorType: "system", actorId: "system" };
const now = new Date("2026-08-04T00:00:00.000Z");
const envelope = {
  eventId: "evt-1",
  correlationId: "corr-1",
  actor,
  occurredAt: "2026-08-04T00:00:00.000Z",
};

function buildIdentity(status: CustomerIdentity["status"]): CustomerIdentity {
  const { identity } = registerCustomerIdentity({
    ...envelope,
    customerIdentityId: "cust_1",
    initialAuthenticationReference: {
      referenceId: "authuid_1",
      referenceType: "phone_otp",
      createdAt: now,
      createdBy: "cust_1",
    },
    createdAt: now,
    createdBy: "cust_1",
  });

  if (status === "active") {
    return identity;
  }

  return transitionIdentityStatus(identity, status, {
    ...envelope,
    updatedAt: now,
    updatedBy: "cust_1",
  }).identity;
}

describe("recoverCustomerIdentity", () => {
  it("restores a suspended identity to active", () => {
    const identity = buildIdentity("suspended");
    const result = recoverCustomerIdentity(identity, {
      ...envelope,
      recoveredAt: now,
      recoveredBy: "support_1",
      authority: "support_initiated",
    });
    expect(result.identity.status).toBe("active");
  });

  it("restores a locked identity to active", () => {
    const identity = buildIdentity("locked");
    const result = recoverCustomerIdentity(identity, {
      ...envelope,
      recoveredAt: now,
      recoveredBy: "support_1",
      authority: "support_initiated",
    });
    expect(result.identity.status).toBe("active");
  });

  it("preserves the Customer Identity ID", () => {
    const identity = buildIdentity("locked");
    const result = recoverCustomerIdentity(identity, {
      ...envelope,
      recoveredAt: now,
      recoveredBy: "support_1",
      authority: "support_initiated",
    });
    expect(result.identity.id).toBe(identity.id);
  });

  it("preserves authentication references unchanged", () => {
    const identity = buildIdentity("locked");
    const result = recoverCustomerIdentity(identity, {
      ...envelope,
      recoveredAt: now,
      recoveredBy: "support_1",
      authority: "support_initiated",
    });
    expect(result.identity.authenticationReferences).toEqual(identity.authenticationReferences);
  });

  it("never creates a second/replacement identity object with a different id", () => {
    const identity = buildIdentity("suspended");
    const result = recoverCustomerIdentity(identity, {
      ...envelope,
      recoveredAt: now,
      recoveredBy: "support_1",
      authority: "support_initiated",
    });
    expect(result.identity.id).toBe(identity.id);
    expect(result.identity).not.toBe(identity);
  });

  it("emits IdentityRecovered carrying the previous status and authority", () => {
    const identity = buildIdentity("suspended");
    const result = recoverCustomerIdentity(identity, {
      ...envelope,
      recoveredAt: now,
      recoveredBy: "support_1",
      authority: "support_initiated",
    });
    expect(result.event.eventType).toBe("identity.identity_recovered.v1");
    expect(result.event.payload).toEqual({
      customerIdentityId: identity.id,
      previousStatus: "suspended",
      authority: "support_initiated",
    });
  });

  it("rejects recovery from active (nothing to recover)", () => {
    const identity = buildIdentity("active");
    expect(() =>
      recoverCustomerIdentity(identity, {
        ...envelope,
        recoveredAt: now,
        recoveredBy: "support_1",
        authority: "support_initiated",
      }),
    ).toThrow(IdentityDomainError);
  });

  it("rejects recovery from dormant (no recovery step needed for dormant, per ENG-P2-ARCH-001 §3)", () => {
    const identity = buildIdentity("dormant");
    expect(() =>
      recoverCustomerIdentity(identity, {
        ...envelope,
        recoveredAt: now,
        recoveredBy: "support_1",
        authority: "support_initiated",
      }),
    ).toThrow(IdentityDomainError);
  });

  it("rejects recovery from closed (terminal-in, not a recovery target)", () => {
    const identity = buildIdentity("closed");
    expect(() =>
      recoverCustomerIdentity(identity, {
        ...envelope,
        recoveredAt: now,
        recoveredBy: "support_1",
        authority: "support_initiated",
      }),
    ).toThrow(IdentityDomainError);
  });
});
