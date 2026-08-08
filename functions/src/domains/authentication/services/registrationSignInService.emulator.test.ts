import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerOrSignIn } from "./registrationSignInService";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { EventActor } from "../../../shared/events/domainEvent";

// AUTH-03 — registration / sign-in orchestration against the real Firebase
// Emulator Suite. Proves the -09-resolved new-vs-returning branch end to end:
// a new credential registers (via -01 create + -08 establish) and becomes
// resolvable; the same credential then signs in with no new identity; the flow
// is idempotent; AUTH-03 emits NO CustomerAuthenticated (that is AUTH-08); and
// no raw credential material is persisted. Not run under `pnpm test` — see
// `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp({ projectId: "demo-11thonus" }, "registrationSignInServiceEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

function credentialFor(referenceId: string) {
  return createAuthenticatedCredential({
    referenceType: "phone_otp",
    referenceId,
    verifiedAt: new Date("2026-08-08T12:00:00.000Z"),
    providerSignals: { signInProvider: "phone" },
  });
}

function envelopeFor(suffix: string) {
  return {
    eventId: `evt_auth03_${suffix}`,
    correlationId: `corr_auth03_${suffix}`,
    actor,
    occurredAt: "2026-08-08T12:00:00.000Z",
  };
}

function commandFor(suffix: string) {
  return {
    idempotencyKey: `auth03_key_${suffix}`,
    requestHash: `auth03_hash_${suffix}`,
    issuedAt: new Date("2026-08-08T12:00:00.000Z"),
  };
}

async function outboxEventTypes(): Promise<string[]> {
  const snapshot = await db.collection("outboxEntries").get();
  return snapshot.docs.map((doc) => {
    const event = doc.data()["event"] as { eventType?: unknown } | undefined;
    return String(event?.eventType ?? "");
  });
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

describe("AUTH-03 — registration / sign-in orchestration (emulator)", () => {
  it("registers an unregistered credential (-01 → -08) and makes it resolvable (-09), issuing a session", async () => {
    const outcome = await registerOrSignIn(
      db,
      credentialFor("authuid_r1"),
      envelopeFor("r1"),
      commandFor("r1"),
      { generateCustomerIdentityId: () => "cust_r1" },
    );

    expect(outcome.mode).toBe("registered");
    expect(outcome.customerIdentityId).toBe("cust_r1");
    expect(outcome.session.customerIdentityId).toBe("cust_r1");
    expect(outcome.session.authReference).toEqual({
      referenceType: "phone_otp",
      referenceId: "authuid_r1",
    });

    // The authoritative reference now exists and points to the new identity.
    const owner = await db.collection("authenticationReferences").doc("phone_otp:authuid_r1").get();
    expect(owner.exists).toBe(true);
    expect(owner.data()?.["customerIdentityId"]).toBe("cust_r1");
  });

  it("signs in a returning credential without creating a second identity", async () => {
    await registerOrSignIn(db, credentialFor("authuid_r2"), envelopeFor("r2a"), commandFor("r2a"), {
      generateCustomerIdentityId: () => "cust_r2",
    });

    const second = await registerOrSignIn(
      db,
      credentialFor("authuid_r2"),
      envelopeFor("r2b"),
      commandFor("r2b"),
      { generateCustomerIdentityId: () => "cust_r2_SHOULD_NOT_BE_USED" },
    );

    expect(second.mode).toBe("signed_in");
    expect(second.customerIdentityId).toBe("cust_r2");

    const users = await db.collection("users").get();
    expect(users.size).toBe(1);
  });

  it("is idempotent across a repeated register→sign-in for the same credential (single identity, single authoritative record)", async () => {
    const command = commandFor("r3");
    await registerOrSignIn(db, credentialFor("authuid_r3"), envelopeFor("r3a"), command, {
      generateCustomerIdentityId: () => "cust_r3",
    });
    // A retry of the same request: the credential now resolves → sign-in, no new writes.
    await registerOrSignIn(db, credentialFor("authuid_r3"), envelopeFor("r3b"), command, {
      generateCustomerIdentityId: () => "cust_r3_dupe",
    });

    const users = await db.collection("users").get();
    const refs = await db.collection("authenticationReferences").get();
    expect(users.size).toBe(1);
    expect(refs.size).toBe(1);
  });

  it("emits the domain state-change events but NOT CustomerAuthenticated (that is AUTH-08)", async () => {
    // Registration then a returning sign-in.
    await registerOrSignIn(db, credentialFor("authuid_r4"), envelopeFor("r4a"), commandFor("r4a"), {
      generateCustomerIdentityId: () => "cust_r4",
    });
    await registerOrSignIn(db, credentialFor("authuid_r4"), envelopeFor("r4b"), commandFor("r4b"), {
      generateCustomerIdentityId: () => "cust_r4_dupe",
    });

    // eventType format is `${domain}.${snake_case_name}.v${n}`.
    const types = await outboxEventTypes();
    expect(types.some((t) => t.includes("customer_identity_registered"))).toBe(true);
    expect(types.some((t) => t.includes("authentication_reference_linked"))).toBe(true);
    // AUTH-03 must not emit the fire-and-forget trust signal — AUTH-08 owns it.
    expect(types.some((t) => t.includes("customer_authenticated"))).toBe(false);
  });

  it("persists no raw credential/token material anywhere on the registration path", async () => {
    await registerOrSignIn(db, credentialFor("authuid_r5"), envelopeFor("r5"), commandFor("r5"), {
      generateCustomerIdentityId: () => "cust_r5",
    });

    const collections = ["users", "authenticationReferences", "outboxEntries"];
    for (const collection of collections) {
      const snapshot = await db.collection(collection).get();
      for (const doc of snapshot.docs) {
        const serialized = JSON.stringify(doc.data()).toLowerCase();
        for (const forbidden of ["token", "secret", "password", "rawtoken"]) {
          expect(serialized).not.toContain(forbidden);
        }
      }
    }
  });
});
