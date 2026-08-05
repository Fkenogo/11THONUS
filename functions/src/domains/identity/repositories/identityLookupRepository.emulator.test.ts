import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "./customerIdentityRepository";
import { linkAuthenticationReferenceForIdentity } from "./authenticationReferenceRepository";
import {
  lookupCustomerIdentityById,
  lookupCustomerIdentityByLoyaltyNumber,
  lookupCustomerIdentityByQrReference,
  lookupCustomerIdentityByAuthenticationReference,
} from "./identityLookupRepository";
import { issueLoyaltyNumberForIdentity } from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import type { LoyaltyNumberCandidateGenerator } from "../../loyaltyNumber/services/loyaltyNumberGenerator";
import {
  issueQrIdentityForIdentity,
  regenerateQrIdentityForIdentity,
} from "../../qrIdentity/repositories/qrIdentityRepository";
import type { QrReferenceGenerator } from "../../qrIdentity/services/qrReferenceGenerator";
import { IdentityDomainError } from "../models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "identityLookupRepositoryEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

class FixedGenerator implements LoyaltyNumberCandidateGenerator, QrReferenceGenerator {
  constructor(private readonly value: string) {}
  generateCandidate(): string {
    return this.value;
  }
  generateReference(): string {
    return this.value;
  }
}

async function seedIdentity(customerIdentityId: string, keySuffix: string) {
  return createCustomerIdentity(db, {
    eventId: `evt_create_${keySuffix}`,
    correlationId: `corr_create_${keySuffix}`,
    actor,
    occurredAt: "2026-08-05T00:00:00.000Z",
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: `authuid_${customerIdentityId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-08-05T00:00:00.000Z"),
      createdBy: customerIdentityId,
    },
    createdAt: new Date("2026-08-05T00:00:00.000Z"),
    createdBy: customerIdentityId,
    idempotencyKey: `create_${keySuffix}`,
    requestHash: `hash_create_${keySuffix}`,
  });
}

function envelope(suffix: string) {
  return {
    eventId: `evt_${suffix}`,
    correlationId: `corr_${suffix}`,
    actor,
    occurredAt: "2026-08-05T02:00:00.000Z",
  };
}

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

beforeEach(async () => {
  for (const collection of [
    "users",
    "customerProfiles",
    "loyaltyNumbers",
    "qrIdentityRecords",
    "authenticationReferences",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("lookupCustomerIdentityById", () => {
  it("resolves an existing identity with a bounded result, omitting authenticationReferences for a non-authentication purpose", async () => {
    await seedIdentity("cust_1", "l1");

    const result = await lookupCustomerIdentityById(db, {
      ...envelope("l1"),
      customerIdentityId: "cust_1",
      purpose: "internal_service",
    });

    expect(result.customerIdentityId).toBe("cust_1");
    expect(result.status).toBe("active");
    expect(result.authenticationReferences).toBeUndefined();
  });

  it("fails closed for an unknown Customer Identity ID", async () => {
    await expect(
      lookupCustomerIdentityById(db, {
        ...envelope("l2"),
        customerIdentityId: "cust_missing",
        purpose: "internal_service",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("fails closed for a malformed (empty) Customer Identity ID", async () => {
    await expect(
      lookupCustomerIdentityById(db, {
        ...envelope("l3"),
        customerIdentityId: "",
        purpose: "internal_service",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects a purpose not permitted for this lookup type", async () => {
    await seedIdentity("cust_4", "l4");

    await expect(
      lookupCustomerIdentityById(db, {
        ...envelope("l4"),
        customerIdentityId: "cust_4",
        purpose: "merchant_transaction",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("never returns phone, email, trust, or profile data", async () => {
    await seedIdentity("cust_5", "l5");

    const result = await lookupCustomerIdentityById(db, {
      ...envelope("l5"),
      customerIdentityId: "cust_5",
      purpose: "support",
    });

    const keys = Object.keys(result).map((k) => k.toLowerCase());
    for (const forbidden of ["phone", "email", "trust", "purchase", "reward"]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("does not distinguish caller identity when checking purpose authority — purpose alone is never verified authority", async () => {
    await seedIdentity("cust_23", "l23");

    const supportAgentA = await lookupCustomerIdentityById(db, {
      eventId: "evt_l23a",
      correlationId: "corr_l23a",
      actor: { actorType: "user", actorId: "support_agent_alice" },
      occurredAt: "2026-08-05T02:00:00.000Z",
      customerIdentityId: "cust_23",
      purpose: "support",
    });
    const supportAgentB = await lookupCustomerIdentityById(db, {
      eventId: "evt_l23b",
      correlationId: "corr_l23b",
      actor: { actorType: "user", actorId: "anyone_at_all" },
      occurredAt: "2026-08-05T02:00:00.000Z",
      customerIdentityId: "cust_23",
      purpose: "support",
    });

    // Both succeed identically — the declared `purpose` string, not the
    // caller's actor identity, is the only thing this package checks. No
    // credential, role, or session is verified here; that belongs to a
    // future trusted application boundary.
    expect(supportAgentA.customerIdentityId).toBe("cust_23");
    expect(supportAgentB.customerIdentityId).toBe("cust_23");
  });
});

describe("lookupCustomerIdentityByLoyaltyNumber", () => {
  it("resolves an existing identity by exact Loyalty Number match, excluding Authentication References for a merchant-transaction lookup", async () => {
    await seedIdentity("cust_6", "l6");
    await issueLoyaltyNumberForIdentity(db, {
      eventId: "evt_ln_l6",
      correlationId: "corr_ln_l6",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_6",
      assignedAt: new Date("2026-08-05T01:00:00.000Z"),
      createdBy: "cust_6",
      generator: new FixedGenerator("ABC234"),
      idempotencyKey: "key_ln_l6",
      requestHash: "hash_ln_l6",
    });

    const result = await lookupCustomerIdentityByLoyaltyNumber(db, {
      ...envelope("l6"),
      loyaltyNumber: "ABC234",
      purpose: "merchant_transaction",
    });

    expect(result.customerIdentityId).toBe("cust_6");
    expect(result.authenticationReferences).toBeUndefined();
    const keys = Object.keys(result).map((k) => k.toLowerCase());
    expect(keys).not.toContain("authenticationreferences");
  });

  it("fails closed for a malformed Loyalty Number, before any Firestore read", async () => {
    await expect(
      lookupCustomerIdentityByLoyaltyNumber(db, {
        ...envelope("l7"),
        loyaltyNumber: "not-a-loyalty-number",
        purpose: "merchant_transaction",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("fails closed for an unknown (but validly formatted) Loyalty Number", async () => {
    await expect(
      lookupCustomerIdentityByLoyaltyNumber(db, {
        ...envelope("l8"),
        loyaltyNumber: "ABD235",
        purpose: "merchant_transaction",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("never matches a near-miss value (exact match only, no prefix/partial)", async () => {
    await seedIdentity("cust_9", "l9");
    await issueLoyaltyNumberForIdentity(db, {
      eventId: "evt_ln_l9",
      correlationId: "corr_ln_l9",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_9",
      assignedAt: new Date("2026-08-05T01:00:00.000Z"),
      createdBy: "cust_9",
      generator: new FixedGenerator("ABE236"),
      idempotencyKey: "key_ln_l9",
      requestHash: "hash_ln_l9",
    });

    await expect(
      lookupCustomerIdentityByLoyaltyNumber(db, {
        ...envelope("l9b"),
        loyaltyNumber: "ABE237",
        purpose: "merchant_transaction",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects a purpose not permitted for this lookup type", async () => {
    await expect(
      lookupCustomerIdentityByLoyaltyNumber(db, {
        ...envelope("l10"),
        loyaltyNumber: "ABC234",
        purpose: "authentication",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });
});

describe("lookupCustomerIdentityByQrReference", () => {
  it("resolves an existing identity for an active QR reference, excluding Authentication References for a merchant-transaction lookup", async () => {
    await seedIdentity("cust_11", "l11");
    await issueQrIdentityForIdentity(db, {
      eventId: "evt_qr_l11",
      correlationId: "corr_qr_l11",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_11",
      loyaltyNumber: "ABF236",
      issuedAt: new Date("2026-08-05T01:00:00.000Z"),
      createdBy: "cust_11",
      generator: new FixedGenerator("qr_ref_l11"),
      idempotencyKey: "key_qr_l11",
      requestHash: "hash_qr_l11",
    });

    const result = await lookupCustomerIdentityByQrReference(db, {
      ...envelope("l11"),
      qrReference: "qr_ref_l11",
      purpose: "merchant_transaction",
    });

    expect(result.customerIdentityId).toBe("cust_11");
    expect(result.authenticationReferences).toBeUndefined();
    const keys = Object.keys(result).map((k) => k.toLowerCase());
    expect(keys).not.toContain("authenticationreferences");
  });

  it("fails closed for an invalidated QR reference", async () => {
    await seedIdentity("cust_12", "l12");
    await issueQrIdentityForIdentity(db, {
      eventId: "evt_qr_l12",
      correlationId: "corr_qr_l12",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_12",
      loyaltyNumber: "ABG237",
      issuedAt: new Date("2026-08-05T01:00:00.000Z"),
      createdBy: "cust_12",
      generator: new FixedGenerator("qr_ref_l12_old"),
      idempotencyKey: "key_qr_l12",
      requestHash: "hash_qr_l12",
    });
    await regenerateQrIdentityForIdentity(db, {
      eventId: "evt_qr_l12_regen",
      correlationId: "corr_qr_l12_regen",
      actor,
      occurredAt: "2026-08-05T01:05:00.000Z",
      customerIdentityId: "cust_12",
      regeneratedAt: new Date("2026-08-05T01:05:00.000Z"),
      createdBy: "cust_12",
      generator: new FixedGenerator("qr_ref_l12_new"),
      idempotencyKey: "key_qr_l12_regen",
      requestHash: "hash_qr_l12_regen",
    });

    await expect(
      lookupCustomerIdentityByQrReference(db, {
        ...envelope("l12"),
        qrReference: "qr_ref_l12_old",
        purpose: "merchant_transaction",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("fails closed for an unknown QR reference", async () => {
    await expect(
      lookupCustomerIdentityByQrReference(db, {
        ...envelope("l13"),
        qrReference: "qr_ref_never_issued",
        purpose: "merchant_transaction",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects a purpose not permitted for this lookup type", async () => {
    await expect(
      lookupCustomerIdentityByQrReference(db, {
        ...envelope("l14"),
        qrReference: "qr_ref_any",
        purpose: "authentication",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects the support purpose (removed per Founder policy — QR is trusted-internal and authenticated-transaction use only, plus explicitly-governed recovery)", async () => {
    await expect(
      lookupCustomerIdentityByQrReference(db, {
        ...envelope("l14b"),
        qrReference: "qr_ref_any",
        purpose: "support",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });
});

describe("lookupCustomerIdentityByAuthenticationReference", () => {
  it("resolves the owning identity for an active reference, including authenticationReferences for the authentication purpose", async () => {
    await seedIdentity("cust_15", "l15");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_auth_l15",
      correlationId: "corr_auth_l15",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_15",
      referenceId: "google_sub_l15",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_15",
      idempotencyKey: "key_auth_l15",
      requestHash: "hash_auth_l15",
    });

    const result = await lookupCustomerIdentityByAuthenticationReference(db, {
      ...envelope("l15"),
      referenceType: "google_sign_in",
      referenceId: "google_sub_l15",
      purpose: "authentication",
    });

    expect(result.customerIdentityId).toBe("cust_15");
    expect(result.authenticationReferences).toHaveLength(2);
  });

  it("permits the recovery purpose (Founder-approved policy expansion — the lookup capability only; -07's own recovery orchestration remains unmodified/not wired to this route)", async () => {
    await seedIdentity("cust_15b", "l15b");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_auth_l15b",
      correlationId: "corr_auth_l15b",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_15b",
      referenceId: "google_sub_l15b",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_15b",
      idempotencyKey: "key_auth_l15b",
      requestHash: "hash_auth_l15b",
    });

    const result = await lookupCustomerIdentityByAuthenticationReference(db, {
      ...envelope("l15b"),
      referenceType: "google_sign_in",
      referenceId: "google_sub_l15b",
      purpose: "recovery",
    });

    expect(result.customerIdentityId).toBe("cust_15b");
    // recovery is not the `authentication` purpose — no reference list needed.
    expect(result.authenticationReferences).toBeUndefined();
  });

  it("fails closed for an inactive (never-linked) reference", async () => {
    await expect(
      lookupCustomerIdentityByAuthenticationReference(db, {
        ...envelope("l16"),
        referenceType: "google_sign_in",
        referenceId: "google_sub_never_linked",
        purpose: "authentication",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("never resolves a reference to a different identity than its true owner (cross-identity blocked)", async () => {
    await seedIdentity("cust_17a", "l17a");
    await seedIdentity("cust_17b", "l17b");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_auth_l17a",
      correlationId: "corr_auth_l17a",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_17a",
      referenceId: "google_sub_l17a",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_17a",
      idempotencyKey: "key_auth_l17a",
      requestHash: "hash_auth_l17a",
    });
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_auth_l17b",
      correlationId: "corr_auth_l17b",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_17b",
      referenceId: "google_sub_l17b",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_17b",
      idempotencyKey: "key_auth_l17b",
      requestHash: "hash_auth_l17b",
    });

    const resultA = await lookupCustomerIdentityByAuthenticationReference(db, {
      ...envelope("l17a"),
      referenceType: "google_sign_in",
      referenceId: "google_sub_l17a",
      purpose: "authentication",
    });
    const resultB = await lookupCustomerIdentityByAuthenticationReference(db, {
      ...envelope("l17b"),
      referenceType: "google_sign_in",
      referenceId: "google_sub_l17b",
      purpose: "authentication",
    });

    expect(resultA.customerIdentityId).toBe("cust_17a");
    expect(resultB.customerIdentityId).toBe("cust_17b");
  });

  it("rejects a purpose not permitted for this lookup type", async () => {
    await expect(
      lookupCustomerIdentityByAuthenticationReference(db, {
        ...envelope("l18"),
        referenceType: "google_sign_in",
        referenceId: "google_sub_any",
        purpose: "merchant_transaction",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("never carries a provider credential, token, or raw OAuth field in the error", async () => {
    try {
      await lookupCustomerIdentityByAuthenticationReference(db, {
        ...envelope("l19"),
        referenceType: "google_sign_in",
        referenceId: "google_sub_never_linked_2",
        purpose: "authentication",
      });
      throw new Error("expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityDomainError);
      const message = (error as Error).message.toLowerCase();
      for (const forbidden of ["token", "credential", "oauth"]) {
        expect(message).not.toContain(forbidden);
      }
    }
  });
});

describe("audit events", () => {
  it("emits an IdentityLookupAttempted event for a support-purpose lookup", async () => {
    await seedIdentity("cust_20", "l20");

    await lookupCustomerIdentityById(db, {
      ...envelope("l20"),
      customerIdentityId: "cust_20",
      purpose: "support",
    });

    const outboxSnap = await db.collection("outboxEntries").doc("evt_l20").get();
    expect(outboxSnap.exists).toBe(true);
    const stored = (outboxSnap.data() as { event: { eventType: string } }).event;
    expect(stored.eventType).toBe("identity.identity_lookup_attempted.v1");
  });

  it("emits an audit event for a failed (invalid) QR lookup regardless of purpose", async () => {
    await expect(
      lookupCustomerIdentityByQrReference(db, {
        ...envelope("l21"),
        qrReference: "qr_ref_never_issued_l21",
        purpose: "merchant_transaction",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const outboxSnap = await db.collection("outboxEntries").doc("evt_l21").get();
    expect(outboxSnap.exists).toBe(true);
  });

  it("does not emit an audit event for an ordinary successful internal_service lookup", async () => {
    await seedIdentity("cust_22", "l22");

    await lookupCustomerIdentityById(db, {
      ...envelope("l22"),
      customerIdentityId: "cust_22",
      purpose: "internal_service",
    });

    const outboxSnap = await db.collection("outboxEntries").doc("evt_l22").get();
    expect(outboxSnap.exists).toBe(false);
  });
});
