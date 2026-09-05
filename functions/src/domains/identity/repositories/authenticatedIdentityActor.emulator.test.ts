import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveAuthenticatedIdentityActor,
  resolveAuthenticatedIdentityActorReadOnly,
} from "./authenticatedIdentityActor";
import { createCustomerIdentity } from "./customerIdentityRepository";
import { linkAuthenticationReferenceForIdentity } from "./authenticationReferenceRepository";
import type { EventActor } from "../../../shared/events/domainEvent";

// Real-Firestore regression for the AUTH-MFA-003A1 read-only fix (Codex
// P2): the audited resolution twin persists an `IdentityLookupAttempted`
// outbox event on every lookup; the read-only twin (used by
// `discoverPlatformAdministrator`) writes nothing on any outcome. Asserts
// are relative to a post-seeding snapshot so the seeding repositories'
// own (unrelated) outbox writes can never make the test flaky.

const app = initializeApp({ projectId: "demo-11thonus" }, "authenticatedIdentityActorEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };
const OUTBOX_COLLECTION = "outboxEntries";

async function seedIdentity(customerIdentityId: string, referenceId: string) {
  await createCustomerIdentity(db, {
    eventId: `evt_seed_${customerIdentityId}`,
    correlationId: `corr_seed_${customerIdentityId}`,
    actor,
    occurredAt: "2026-09-04T00:00:00.000Z",
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId,
      referenceType: "google_sign_in",
      createdAt: new Date("2026-09-04T00:00:00.000Z"),
      createdBy: customerIdentityId,
    },
    createdAt: new Date("2026-09-04T00:00:00.000Z"),
    createdBy: customerIdentityId,
    idempotencyKey: `create_seed_${customerIdentityId}`,
    requestHash: `hash_seed_${customerIdentityId}`,
  });
  // Create the standalone `authenticationReferences/{type}:{id}` document
  // the merged `-09` reference lookup reads (`getActiveAuthenticationReferenceOwner`);
  // the initial reference above is embedded-only by `registerCustomerIdentity`.
  await linkAuthenticationReferenceForIdentity(db, {
    eventId: `evt_link_${customerIdentityId}`,
    correlationId: `corr_link_${customerIdentityId}`,
    actor,
    occurredAt: "2026-09-04T01:00:00.000Z",
    customerIdentityId,
    referenceId,
    referenceType: "google_sign_in",
    authority: "customer_initiated",
    reason: "customer_request",
    linkedAt: new Date("2026-09-04T00:30:00.000Z"),
    linkedBy: customerIdentityId,
    idempotencyKey: `link_seed_${customerIdentityId}`,
    requestHash: `hash_link_seed_${customerIdentityId}`,
  });
}

function fakeVerifier(credential: { referenceType: "google_sign_in"; referenceId: string }) {
  return { verify: vi.fn().mockResolvedValue(credential) };
}

async function outboxCount(): Promise<number> {
  return (await db.collection(OUTBOX_COLLECTION).get()).docs.length;
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
    "authenticationReferences",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("identity-actor resolution vs the shared outbox (AUTH-MFA-003A1)", () => {
  it("audited twin persists an IdentityLookupAttempted outbox event per resolution", async () => {
    await seedIdentity("cust_audited", "google_sub_cust_audited");
    const before = await outboxCount();

    const result = await resolveAuthenticatedIdentityActor(
      db,
      { rawToken: "tok", referenceType: "google_sign_in" },
      {
        verifier: fakeVerifier({
          referenceType: "google_sign_in",
          referenceId: "google_sub_cust_audited",
        }),
      },
    );

    expect(result.userId).toBe("cust_audited");
    const docs = (await db.collection(OUTBOX_COLLECTION).get()).docs;
    expect(docs.length).toBe(before + 1);
    const lookupEvents = docs.filter((doc) =>
      String(doc.data()["event"]?.["eventType"]).endsWith("identity_lookup_attempted.v1"),
    );
    expect(lookupEvents).toHaveLength(1);
  });

  it("read-only twin resolves the same identity while writing zero outbox events", async () => {
    await seedIdentity("cust_readonly", "google_sub_cust_readonly");
    const before = await outboxCount();

    const result = await resolveAuthenticatedIdentityActorReadOnly(
      db,
      { rawToken: "tok", referenceType: "google_sign_in" },
      {
        verifier: fakeVerifier({
          referenceType: "google_sign_in",
          referenceId: "google_sub_cust_readonly",
        }),
      },
    );

    expect(result.userId).toBe("cust_readonly");
    expect(await outboxCount()).toBe(before);
  });

  it("read-only twin fails closed on an unknown reference — zero outbox events", async () => {
    const before = await outboxCount();

    await expect(
      resolveAuthenticatedIdentityActorReadOnly(
        db,
        { rawToken: "tok", referenceType: "google_sign_in" },
        {
          verifier: fakeVerifier({
            referenceType: "google_sign_in",
            referenceId: "google_sub_never_existed",
          }),
        },
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });

    expect(await outboxCount()).toBe(before);
  });

  it("read-only twin fails closed on a suspended identity — zero outbox events", async () => {
    await seedIdentity("cust_suspended", "google_sub_cust_suspended");
    await db.collection("users").doc("cust_suspended").update({ status: "suspended" });
    const before = await outboxCount();

    await expect(
      resolveAuthenticatedIdentityActorReadOnly(
        db,
        { rawToken: "tok", referenceType: "google_sign_in" },
        {
          verifier: fakeVerifier({
            referenceType: "google_sign_in",
            referenceId: "google_sub_cust_suspended",
          }),
        },
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });

    expect(await outboxCount()).toBe(before);
  });
});
