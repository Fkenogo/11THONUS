import { describe, expect, it } from "vitest";
import {
  registerCustomerIdentity,
  transitionIdentityStatus,
  linkAuthenticationReference,
  unlinkAuthenticationReference,
  setTrustReference,
} from "./customerIdentity";
import { IdentityDomainError } from "./identityErrors";

const actor = { actorType: "user" as const, actorId: "cust_1" };
const envelope = {
  eventId: "evt-1",
  correlationId: "corr-1",
  actor,
  occurredAt: "2026-08-02T00:00:00.000Z",
};
const now = new Date("2026-08-02T00:00:00.000Z");
const transitionMeta = {
  authority: "administrator_initiated" as const,
  reason: "administrative_suspension" as const,
};
const linkMeta = {
  authority: "customer_initiated" as const,
  reason: "customer_request" as const,
};

function register() {
  return registerCustomerIdentity({
    customerIdentityId: "cust_1",
    initialAuthenticationReference: {
      referenceId: "authuid_1",
      referenceType: "phone_otp",
      createdAt: now,
      createdBy: "cust_1",
    },
    createdAt: now,
    createdBy: "cust_1",
    ...envelope,
  });
}

describe("registerCustomerIdentity", () => {
  it("creates a new identity with the given id and the initial authentication reference", () => {
    const { identity } = register();

    expect(identity.id).toBe("cust_1");
    expect(identity.authenticationReferences).toHaveLength(1);
    expect(identity.authenticationReferences[0]?.referenceId).toBe("authuid_1");
  });

  it("has a default initial status of active, with no verification gate", () => {
    const { identity } = register();
    expect(identity.status).toBe("active");
  });

  it("stamps immutable creation metadata", () => {
    const { identity } = register();
    expect(identity.createdAt).toBe(now);
    expect(identity.createdBy).toBe("cust_1");
    expect(identity.updatedAt).toBe(now);
    expect(identity.updatedBy).toBe("cust_1");
  });

  it("rejects an empty customer identity id", () => {
    expect(() =>
      registerCustomerIdentity({
        customerIdentityId: "",
        initialAuthenticationReference: {
          referenceId: "authuid_1",
          referenceType: "phone_otp",
          createdAt: now,
          createdBy: "cust_1",
        },
        createdAt: now,
        createdBy: "cust_1",
        ...envelope,
      }),
    ).toThrow(IdentityDomainError);
  });

  it("emits exactly one CustomerIdentityRegistered event", () => {
    const { events } = register();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe("identity.customer_identity_registered.v1");
  });

  it("has no trust reference until one is explicitly set", () => {
    const { identity } = register();
    expect(identity.trustReference).toBeUndefined();
  });
});

describe("transitionIdentityStatus", () => {
  it("permits a valid transition and updates the status", () => {
    const { identity } = register();
    const result = transitionIdentityStatus(identity, "dormant", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    });
    expect(result.identity.status).toBe("dormant");
  });

  it("emits IdentityBecameDormant when transitioning to dormant (ENG-P2-001-06)", () => {
    const { identity } = register();
    const result = transitionIdentityStatus(identity, "dormant", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    });
    expect(result.event?.eventType).toBe("identity.identity_became_dormant.v1");
  });

  it("carries transition authority and reason on the emitted event (ENG-P2-001-06 correction, PR #61)", () => {
    const { identity } = register();
    const result = transitionIdentityStatus(identity, "dormant", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    });
    expect(result.event?.payload).toMatchObject({
      authority: "administrator_initiated",
      reason: "administrative_suspension",
    });
  });

  it("emits CustomerIdentityActivated when reactivating from dormant", () => {
    const { identity } = register();
    const dormant = transitionIdentityStatus(identity, "dormant", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    }).identity;
    const result = transitionIdentityStatus(dormant, "active", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    });
    expect(result.event?.eventType).toBe("identity.customer_identity_activated.v1");
  });

  it("emits CustomerIdentityClosed when closing", () => {
    const { identity } = register();
    const result = transitionIdentityStatus(identity, "closed", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    });
    expect(result.event?.eventType).toBe("identity.customer_identity_closed.v1");
  });

  it("permits closed to archived and emits CustomerIdentityArchived", () => {
    const { identity } = register();
    const closed = transitionIdentityStatus(identity, "closed", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    }).identity;
    const result = transitionIdentityStatus(closed, "archived", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    });
    expect(result.identity.status).toBe("archived");
    expect(result.event?.eventType).toBe("identity.customer_identity_archived.v1");
  });

  it("rejects an invalid transition with a typed domain error", () => {
    const { identity } = register();
    expect(() =>
      transitionIdentityStatus(identity, "registered", {
        ...envelope,
        updatedAt: now,
        updatedBy: "system",
        ...transitionMeta,
      }),
    ).toThrow(IdentityDomainError);
  });

  it("rejects any transition attempted on an already-closed identity, except to archived", () => {
    const { identity } = register();
    const closed = transitionIdentityStatus(identity, "closed", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    }).identity;

    expect(() =>
      transitionIdentityStatus(closed, "active", {
        ...envelope,
        updatedAt: now,
        updatedBy: "system",
        ...transitionMeta,
      }),
    ).toThrow(IdentityDomainError);
  });

  it("rejects any transition attempted on an archived (terminal) identity", () => {
    const { identity } = register();
    const closed = transitionIdentityStatus(identity, "closed", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    }).identity;
    const archived = transitionIdentityStatus(closed, "archived", {
      ...envelope,
      updatedAt: now,
      updatedBy: "system",
      ...transitionMeta,
    }).identity;

    expect(() =>
      transitionIdentityStatus(archived, "closed", {
        ...envelope,
        updatedAt: now,
        updatedBy: "system",
        ...transitionMeta,
      }),
    ).toThrow(IdentityDomainError);
  });
});

describe("linkAuthenticationReference", () => {
  it("adds a new authentication reference and emits AuthenticationReferenceLinked", () => {
    const { identity } = register();
    const result = linkAuthenticationReference(
      identity,
      {
        referenceId: "authuid_2",
        referenceType: "google_sign_in",
        createdAt: now,
        createdBy: "cust_1",
      },
      envelope,
      linkMeta,
    );

    expect(result.identity.authenticationReferences).toHaveLength(2);
    expect(result.event.eventType).toBe("identity.authentication_reference_linked.v1");
  });

  it("carries authority and reason on the emitted event (ENG-P2-001-08)", () => {
    const { identity } = register();
    const result = linkAuthenticationReference(
      identity,
      {
        referenceId: "authuid_2",
        referenceType: "google_sign_in",
        createdAt: now,
        createdBy: "cust_1",
      },
      envelope,
      linkMeta,
    );

    expect(result.event.payload).toMatchObject({
      authority: "customer_initiated",
      reason: "customer_request",
    });
  });

  it("rejects linking a referenceId that is already linked", () => {
    const { identity } = register();
    expect(() =>
      linkAuthenticationReference(
        identity,
        {
          referenceId: "authuid_1",
          referenceType: "phone_otp",
          createdAt: now,
          createdBy: "cust_1",
        },
        envelope,
        linkMeta,
      ),
    ).toThrow(IdentityDomainError);
  });
});

describe("unlinkAuthenticationReference", () => {
  it("removes a reference when at least one other remains linked", () => {
    const { identity } = register();
    const withTwo = linkAuthenticationReference(
      identity,
      {
        referenceId: "authuid_2",
        referenceType: "google_sign_in",
        createdAt: now,
        createdBy: "cust_1",
      },
      envelope,
      linkMeta,
    ).identity;

    const result = unlinkAuthenticationReference(withTwo, "authuid_2", envelope, linkMeta);

    expect(result.identity.authenticationReferences).toHaveLength(1);
    expect(result.event.eventType).toBe("identity.authentication_reference_unlinked.v1");
    expect(result.event.payload).toMatchObject({
      authority: "customer_initiated",
      reason: "customer_request",
    });
  });

  it("rejects unlinking the last remaining authentication reference", () => {
    const { identity } = register();
    expect(() => unlinkAuthenticationReference(identity, "authuid_1", envelope, linkMeta)).toThrow(
      IdentityDomainError,
    );
  });

  it("rejects unlinking a reference that does not exist", () => {
    const { identity } = register();
    const withTwo = linkAuthenticationReference(
      identity,
      {
        referenceId: "authuid_2",
        referenceType: "google_sign_in",
        createdAt: now,
        createdBy: "cust_1",
      },
      envelope,
      linkMeta,
    ).identity;

    expect(() =>
      unlinkAuthenticationReference(withTwo, "authuid_missing", envelope, linkMeta),
    ).toThrow(IdentityDomainError);
  });
});

describe("setTrustReference", () => {
  it("assigns a trust reference and emits TrustReferenceUpdated", () => {
    const { identity } = register();
    const result = setTrustReference(
      identity,
      { trustRecordId: "trust_1", createdAt: now, createdBy: "system" },
      envelope,
    );

    expect(result.identity.trustReference?.trustRecordId).toBe("trust_1");
    expect(result.event.eventType).toBe("identity.trust_reference_updated.v1");
  });

  it("permits updating to a genuinely different trust record", () => {
    const { identity } = register();
    const withTrust = setTrustReference(
      identity,
      { trustRecordId: "trust_1", createdAt: now, createdBy: "system" },
      envelope,
    ).identity;

    const result = setTrustReference(
      withTrust,
      { trustRecordId: "trust_2", createdAt: now, createdBy: "system" },
      envelope,
    );

    expect(result.identity.trustReference?.trustRecordId).toBe("trust_2");
  });

  it("rejects re-assigning the identical trust record as a duplicate", () => {
    const { identity } = register();
    const withTrust = setTrustReference(
      identity,
      { trustRecordId: "trust_1", createdAt: now, createdBy: "system" },
      envelope,
    ).identity;

    expect(() =>
      setTrustReference(
        withTrust,
        { trustRecordId: "trust_1", createdAt: now, createdBy: "system" },
        envelope,
      ),
    ).toThrow(IdentityDomainError);
  });
});
