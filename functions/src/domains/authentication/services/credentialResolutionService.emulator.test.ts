import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import { linkAuthenticationReferenceForIdentity } from "../../identity/repositories/authenticationReferenceRepository";
import { resolveAuthenticatedCredential } from "./credentialResolutionService";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { EventActor } from "../../../shared/events/domainEvent";

// AUTH-02 — Credential → identity resolution against the real Firebase
// Emulator Suite (Firestore only; Firebase Auth is not needed because
// resolution reads a provider-neutral reference, never a token). Not run as
// part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "credentialResolutionServiceEmulatorTest",
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

beforeAll(async () => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
  // Warm up the Firestore gRPC channel before the timed tests. A freshly
  // booted emulator's first round trip can take several seconds to establish
  // the connection; without this the file's first test would absorb that
  // cold-start latency and could exceed the default per-test timeout when this
  // file runs in isolation (in the full `emulators:validate` suite an earlier
  // file warms the channel). This touches no test data.
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

describe("resolveAuthenticatedCredential (emulator)", () => {
  it("resolves a verified credential to the owning identity (sign-in path)", async () => {
    await seedIdentity("cust_r1", "r1");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_link_r1",
      correlationId: "corr_link_r1",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_r1",
      referenceId: "authuid_google_r1",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_r1",
      idempotencyKey: "key_link_r1",
      requestHash: "hash_link_r1",
    });

    const credential = createAuthenticatedCredential({
      referenceType: "google_sign_in",
      referenceId: "authuid_google_r1",
      verifiedAt: new Date("2026-08-08T12:00:00.000Z"),
      providerSignals: { signInProvider: "google.com" },
    });

    const result = await resolveAuthenticatedCredential(db, credential, envelope("r1"));

    expect(result.outcome).toBe("resolved");
    if (result.outcome === "resolved") {
      expect(result.customerIdentityId).toBe("cust_r1");
      expect(result.credential).toEqual(credential);
    }
  });

  it("returns the unregistered (registration) path for a credential with no linked identity", async () => {
    const credential = createAuthenticatedCredential({
      referenceType: "google_sign_in",
      referenceId: "authuid_never_seen",
      verifiedAt: new Date("2026-08-08T12:00:00.000Z"),
      providerSignals: { signInProvider: "google.com" },
    });

    const result = await resolveAuthenticatedCredential(db, credential, envelope("r2"));

    expect(result).toEqual({ outcome: "unregistered", credential });
  });

  it("does NOT resolve an identity's initial embedded reference until it is linked via -08 (verified -01/-09 boundary)", async () => {
    // Merged-code fact (verified against `customerIdentityRepository.createCustomerIdentity`):
    // `createCustomerIdentity({ initialAuthenticationReference })` writes only the
    // `users/{id}` document with the *embedded* `authenticationReferences[]`
    // projection — it does NOT write the authoritative
    // `authenticationReferences/{type}:{id}` uniqueness document that `-09`'s
    // `getActiveAuthenticationReferenceOwner` resolves against. Only `-08`
    // `linkAuthenticationReferenceForIdentity` writes that document. Resolution
    // therefore correctly reports `unregistered` for an initial reference that
    // was never linked via `-08`. AUTH-03 registration must link the initial
    // reference via `-08` for the returning-user sign-in path to resolve (see
    // the AUTH-02 report's cross-package finding). This test pins that boundary
    // so a future change is caught.
    await seedIdentity("cust_r3", "r3");

    const credential = createAuthenticatedCredential({
      referenceType: "phone_otp",
      referenceId: "authuid_cust_r3",
      verifiedAt: new Date("2026-08-08T12:00:00.000Z"),
      providerSignals: { signInProvider: "phone" },
    });

    const result = await resolveAuthenticatedCredential(db, credential, envelope("r3"));

    expect(result).toEqual({ outcome: "unregistered", credential });
  });
});
