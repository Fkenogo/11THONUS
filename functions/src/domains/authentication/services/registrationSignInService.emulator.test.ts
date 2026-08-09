import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerOrSignIn, type RegistrationSignInCommand } from "./registrationSignInService";
import { linkAuthenticationReferenceForIdentity } from "../../identity/repositories/authenticationReferenceRepository";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { EventActor } from "../../../shared/events/domainEvent";

// AUTH-03 — registration / sign-in orchestration against the real Firebase
// Emulator Suite. Proves the -09-resolved new-vs-returning branch end to end,
// AND the four post-implementation review findings' corrections with real
// Firestore transaction/idempotency behaviour (not mocks):
//   P1-1 concurrent same-credential / different-key registration (no orphan);
//   P1-2 identity-created / link-failed / same-key retry resumes on one id;
//   P2-3 same-key retry of a completed registration replays `registered`;
//   P2-4 a path-bearing idempotency key fails closed before touching Firestore.
// Not run under `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

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

function commandFor(idempotencyKey: string): RegistrationSignInCommand {
  return {
    idempotencyKey,
    requestHash: `auth03_hash_${idempotencyKey}`,
    issuedAt: new Date("2026-08-08T12:00:00.000Z"),
  };
}

async function count(collection: string): Promise<number> {
  return (await db.collection(collection).get()).size;
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
  it("registers an unregistered credential (-01 → -08) and makes it resolvable (-09)", async () => {
    const outcome = await registerOrSignIn(
      db,
      credentialFor("authuid_r1"),
      envelopeFor("r1"),
      commandFor("key_r1"),
      { generateCustomerIdentityId: () => "cust_r1" },
    );

    expect(outcome.mode).toBe("registered");
    expect(outcome.customerIdentityId).toBe("cust_r1");
    const owner = await db.collection("authenticationReferences").doc("phone_otp:authuid_r1").get();
    expect(owner.exists).toBe(true);
    expect(owner.data()?.["customerIdentityId"]).toBe("cust_r1");
  });

  it("signs in a returning credential without creating a second identity", async () => {
    await registerOrSignIn(
      db,
      credentialFor("authuid_r2"),
      envelopeFor("r2a"),
      commandFor("key_r2a"),
      {
        generateCustomerIdentityId: () => "cust_r2",
      },
    );

    const second = await registerOrSignIn(
      db,
      credentialFor("authuid_r2"),
      envelopeFor("r2b"),
      commandFor("key_r2b"),
      { generateCustomerIdentityId: () => "cust_r2_SHOULD_NOT_BE_USED" },
    );

    expect(second.mode).toBe("signed_in");
    expect(second.customerIdentityId).toBe("cust_r2");
    expect(await count("users")).toBe(1);
  });

  it("P2-3: a same-key retry of a completed registration replays `registered` (not sign-in)", async () => {
    const first = await registerOrSignIn(
      db,
      credentialFor("authuid_r3"),
      envelopeFor("r3a"),
      commandFor("key_r3"),
      { generateCustomerIdentityId: () => "cust_r3" },
    );
    expect(first.mode).toBe("registered");

    // Same idempotency key — even though the credential now resolves via -09.
    const replay = await registerOrSignIn(
      db,
      credentialFor("authuid_r3"),
      envelopeFor("r3b"),
      commandFor("key_r3"),
      { generateCustomerIdentityId: () => "cust_r3_dupe" },
    );

    expect(replay.mode).toBe("registered");
    expect(replay.customerIdentityId).toBe("cust_r3");
    expect(replay.session.issuedAt).toEqual(first.session.issuedAt);
    expect(await count("users")).toBe(1);
    expect(await count("authenticationReferences")).toBe(1);
  });

  it("P1-2: identity-created then link-failed, same-key retry resumes on the SAME identity", async () => {
    const failingLink = (async () => {
      throw new Error("simulated -08 link failure");
    }) as typeof linkAuthenticationReferenceForIdentity;

    // First attempt: -01 create succeeds, -08 link fails → whole command fails.
    await expect(
      registerOrSignIn(db, credentialFor("authuid_r4"), envelopeFor("r4a"), commandFor("key_r4"), {
        linkReference: failingLink,
        generateCustomerIdentityId: () => "cust_r4",
      }),
    ).rejects.toThrow();

    // Retry with the SAME key and a deliberately different generator: the id
    // must be RECOVERED from the durable create record, not regenerated.
    const resumed = await registerOrSignIn(
      db,
      credentialFor("authuid_r4"),
      envelopeFor("r4b"),
      commandFor("key_r4"),
      { generateCustomerIdentityId: () => "cust_r4_WRONG" },
    );

    expect(resumed.mode).toBe("registered");
    expect(resumed.customerIdentityId).toBe("cust_r4");
    expect(await count("users")).toBe(1);
    const owner = await db.collection("authenticationReferences").doc("phone_otp:authuid_r4").get();
    expect(owner.exists).toBe(true);
    expect(owner.data()?.["customerIdentityId"]).toBe("cust_r4");
  });

  it("P1-1: two concurrent registrations for the same credential (different keys) leave ONE identity, no orphan", async () => {
    const results = await Promise.allSettled([
      registerOrSignIn(db, credentialFor("authuid_r5"), envelopeFor("r5a"), commandFor("key_r5a")),
      registerOrSignIn(db, credentialFor("authuid_r5"), envelopeFor("r5b"), commandFor("key_r5b")),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    // Exactly one wins; the other fails closed (no fabricated success).
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // The losing request left NO orphan identity — exactly one usable identity.
    expect(await count("users")).toBe(1);
    expect(await count("authenticationReferences")).toBe(1);
    const owner = await db.collection("authenticationReferences").doc("phone_otp:authuid_r5").get();
    expect(owner.exists).toBe(true);
  });

  it("P2-4: a path-bearing idempotency key fails closed before touching Firestore", async () => {
    await expect(
      registerOrSignIn(db, credentialFor("authuid_r6"), envelopeFor("r6"), commandFor("bad/key")),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });

    // Nothing was written — no identity, no idempotency record.
    expect(await count("users")).toBe(0);
    expect(await count("idempotencyRecords")).toBe(0);
  });

  it("emits the domain state-change events but NOT CustomerAuthenticated (that is AUTH-08)", async () => {
    await registerOrSignIn(
      db,
      credentialFor("authuid_r7"),
      envelopeFor("r7a"),
      commandFor("key_r7a"),
      {
        generateCustomerIdentityId: () => "cust_r7",
      },
    );
    await registerOrSignIn(
      db,
      credentialFor("authuid_r7"),
      envelopeFor("r7b"),
      commandFor("key_r7b"),
      {
        generateCustomerIdentityId: () => "cust_r7_dupe",
      },
    );

    const types = await outboxEventTypes();
    expect(types.some((t) => t.includes("customer_identity_registered"))).toBe(true);
    expect(types.some((t) => t.includes("authentication_reference_linked"))).toBe(true);
    expect(types.some((t) => t.includes("customer_authenticated"))).toBe(false);
  });

  it("persists no raw credential/token material anywhere on the registration path", async () => {
    await registerOrSignIn(
      db,
      credentialFor("authuid_r8"),
      envelopeFor("r8"),
      commandFor("key_r8"),
      {
        generateCustomerIdentityId: () => "cust_r8",
      },
    );

    for (const collection of ["users", "authenticationReferences", "outboxEntries"]) {
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
