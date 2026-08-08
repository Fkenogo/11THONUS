import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "./customerIdentityRepository";
import {
  linkAuthenticationReferenceForIdentity,
  getActiveAuthenticationReferenceOwner,
} from "./authenticationReferenceRepository";
import { lookupCustomerIdentityByAuthenticationReference } from "./identityLookupRepository";
import { resolveAuthenticatedCredential } from "../../authentication/services/credentialResolutionService";
import { createAuthenticatedCredential } from "../../authentication/models/authenticatedCredential";
import { IdentityDomainError } from "../models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

// AUTH-CORR-001 — the -01 -> -08 -> -09 initial authentication-reference
// lifecycle, against the real Firebase Emulator Suite. Proves that an
// identity's initial embedded reference (created by -01) can be
// authoritatively established through the existing -08 responsibility and
// then resolved through -09 (and consumed by AUTH-02), without weakening
// uniqueness. Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "initialAuthenticationReferenceLinkingEmulatorTest",
);
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

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

function establishInitialParams(customerIdentityId: string, keySuffix: string) {
  return {
    eventId: `evt_establish_${keySuffix}`,
    correlationId: `corr_establish_${keySuffix}`,
    actor,
    occurredAt: "2026-08-05T01:00:00.000Z",
    customerIdentityId,
    referenceId: `authuid_${customerIdentityId}`,
    referenceType: "phone_otp" as const,
    authority: "customer_initiated" as const,
    reason: "customer_request" as const,
    linkedAt: new Date("2026-08-05T01:00:00.000Z"),
    linkedBy: customerIdentityId,
    idempotencyKey: `key_establish_${keySuffix}`,
    requestHash: `hash_establish_${keySuffix}`,
  };
}

function envelope(suffix: string) {
  return {
    eventId: `evt_lookup_${suffix}`,
    correlationId: `corr_lookup_${suffix}`,
    actor,
    occurredAt: "2026-08-05T02:00:00.000Z",
  };
}

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(async () => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
  // Warm the Firestore gRPC channel before the timed tests (cold-start guard).
  await db.collection("users").limit(1).get();
}, 30000);

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

describe("AUTH-CORR-001 — initial authentication-reference linking (-01 → -08 → -09)", () => {
  it("establishes the authoritative reference for a newly-created identity's initial embedded reference through -08", async () => {
    await seedIdentity("cust_i1", "i1");
    // Precondition: the authoritative doc does not yet exist (only the embedded projection).
    expect(await getActiveAuthenticationReferenceOwner(db, "phone_otp", "authuid_cust_i1")).toBe(
      undefined,
    );

    const identity = await linkAuthenticationReferenceForIdentity(
      db,
      establishInitialParams("cust_i1", "i1"),
    );

    // The embedded projection is preserved (still exactly the one initial reference).
    expect(identity.authenticationReferences).toHaveLength(1);
    expect(identity.authenticationReferences[0]?.referenceId).toBe("authuid_cust_i1");

    // The authoritative uniqueness record now exists for this identity.
    const owner = await getActiveAuthenticationReferenceOwner(db, "phone_otp", "authuid_cust_i1");
    expect(owner?.customerIdentityId).toBe("cust_i1");
  });

  it("makes the established reference resolvable through -09", async () => {
    await seedIdentity("cust_i2", "i2");
    await linkAuthenticationReferenceForIdentity(db, establishInitialParams("cust_i2", "i2"));

    const result = await lookupCustomerIdentityByAuthenticationReference(db, {
      ...envelope("i2"),
      referenceType: "phone_otp",
      referenceId: "authuid_cust_i2",
      purpose: "authentication",
    });

    expect(result.customerIdentityId).toBe("cust_i2");
  });

  it("is idempotent on retry with the same idempotency key (no duplicate authoritative record, no error)", async () => {
    await seedIdentity("cust_i3", "i3");
    const params = establishInitialParams("cust_i3", "i3");

    const first = await linkAuthenticationReferenceForIdentity(db, params);
    const second = await linkAuthenticationReferenceForIdentity(db, params);

    expect(first.authenticationReferences).toHaveLength(1);
    expect(second.authenticationReferences).toHaveLength(1);
    const owner = await getActiveAuthenticationReferenceOwner(db, "phone_otp", "authuid_cust_i3");
    expect(owner?.customerIdentityId).toBe("cust_i3");
  });

  it("still rejects establishing a reference genuinely owned by another identity (cross-identity, fail closed)", async () => {
    await seedIdentity("cust_i4a", "i4a");
    await seedIdentity("cust_i4b", "i4b");
    // i4a establishes its own initial reference authoritatively.
    await linkAuthenticationReferenceForIdentity(db, establishInitialParams("cust_i4a", "i4a"));

    // i4b tries to claim i4a's reference id → cross-identity conflict, fail closed.
    await expect(
      linkAuthenticationReferenceForIdentity(db, {
        ...establishInitialParams("cust_i4b", "i4b_steal"),
        customerIdentityId: "cust_i4b",
        referenceId: "authuid_cust_i4a",
      }),
    ).rejects.toThrow(IdentityDomainError);

    // Ownership is unchanged — still i4a.
    const owner = await getActiveAuthenticationReferenceOwner(db, "phone_otp", "authuid_cust_i4a");
    expect(owner?.customerIdentityId).toBe("cust_i4a");
  });

  it("enforces global uniqueness when two identities race to establish the same reference id", async () => {
    await seedIdentity("cust_i5a", "i5a");
    await seedIdentity("cust_i5b", "i5b");

    // Both embed the same collision id via a fresh link attempt on a shared reference.
    // i5a establishes it; i5b then attempts the same id and must fail closed.
    await linkAuthenticationReferenceForIdentity(db, {
      ...establishInitialParams("cust_i5a", "i5a_shared"),
      customerIdentityId: "cust_i5a",
      referenceId: "google_shared_i5",
      referenceType: "google_sign_in",
    });

    await expect(
      linkAuthenticationReferenceForIdentity(db, {
        ...establishInitialParams("cust_i5b", "i5b_shared"),
        customerIdentityId: "cust_i5b",
        referenceId: "google_shared_i5",
        referenceType: "google_sign_in",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const owner = await getActiveAuthenticationReferenceOwner(
      db,
      "google_sign_in",
      "google_shared_i5",
    );
    expect(owner?.customerIdentityId).toBe("cust_i5a");
  });

  it("produces a reference AUTH-02 resolution can consume (-01 → -08 → -09 → AUTH-02)", async () => {
    await seedIdentity("cust_i6", "i6");
    await linkAuthenticationReferenceForIdentity(db, establishInitialParams("cust_i6", "i6"));

    const credential = createAuthenticatedCredential({
      referenceType: "phone_otp",
      referenceId: "authuid_cust_i6",
      verifiedAt: new Date("2026-08-08T12:00:00.000Z"),
      providerSignals: { signInProvider: "phone" },
    });

    const result = await resolveAuthenticatedCredential(db, credential, envelope("i6"));

    expect(result.outcome).toBe("resolved");
    if (result.outcome === "resolved") {
      expect(result.customerIdentityId).toBe("cust_i6");
    }
  });

  it("persists no raw authentication credential/token on the authoritative record", async () => {
    await seedIdentity("cust_i7", "i7");
    await linkAuthenticationReferenceForIdentity(db, establishInitialParams("cust_i7", "i7"));

    const snap = await db
      .collection("authenticationReferences")
      .doc("phone_otp:authuid_cust_i7")
      .get();
    expect(snap.exists).toBe(true);
    const data = snap.data() ?? {};
    // Reference-level fields only: it points to the reference, never carries
    // credential material.
    expect(data["referenceType"]).toBe("phone_otp");
    expect(data["referenceId"]).toBe("authuid_cust_i7");
    expect(data["customerIdentityId"]).toBe("cust_i7");
    expect(data["status"]).toBe("linked");
    // No raw credential/token material of any kind is persisted. ("phone_otp"
    // is the provider *type* name, not OTP secret material, so "otp" as a
    // bare substring is intentionally not screened here.)
    const serialized = JSON.stringify(data).toLowerCase();
    for (const forbidden of ["token", "secret", "password", "credential", "rawtoken"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
