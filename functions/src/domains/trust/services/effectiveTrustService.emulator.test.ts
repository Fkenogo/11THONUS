import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import type { EventActor } from "../../../shared/events/domainEvent";
import { buildCustomerAuthenticatedEvent } from "../../authentication/events/authenticationEventFactories";
import { ingestAuthenticationSignal } from "./trustSignalIngestionService";
import { ingestTrustEvidence } from "../repositories/trustRecordRepository";
import { getEffectiveTrust } from "./effectiveTrustService";
import { TrustDomainError } from "../models/trustErrors";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "effectiveTrustServiceEmulatorTest");
const db: Firestore = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };
const DAY_MS = 86_400_000;

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeEach(async () => {
  for (const collection of ["trustRecords", "users", "outboxEntries", "idempotencyRecords"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

let seedCounter = 0;

async function seedCustomerIdentity(customerIdentityId: string, createdAt: Date): Promise<void> {
  seedCounter += 1;
  await createCustomerIdentity(db, {
    eventId: `evt_seed_${seedCounter}`,
    correlationId: `corr_seed_${seedCounter}`,
    actor,
    occurredAt: createdAt.toISOString(),
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: `auth_${customerIdentityId}`,
      referenceType: "phone_otp",
      createdAt,
      createdBy: customerIdentityId,
    },
    createdAt,
    createdBy: customerIdentityId,
    idempotencyKey: `idem_seed_${seedCounter}`,
    requestHash: `hash_seed_${seedCounter}`,
  });
}

describe("ITM-C — effective trust derivation (real Firestore emulator)", () => {
  it("no trust record yet + existing identity -> unverified, without persisting anything", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-notrust", registeredAt);

    const result = await getEffectiveTrust(
      db,
      "cust-notrust",
      new Date("2026-08-16T00:00:00.000Z"),
    );

    expect(result.effectiveTrustLevel).toBe("unverified");
    expect(result.basis.hasSuccessfulAuthentication).toBe(false);

    const trustRecordSnapshot = await db.collection("trustRecords").doc("cust-notrust").get();
    expect(trustRecordSnapshot.exists).toBe(false);
  });

  it("real ITM-B ingestion + account age >= 30 days -> established", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-established", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-established",
        referenceType: "phone_otp",
        idempotencyKey: "key-established",
        occurredAt: "2026-07-01T00:00:00.000Z",
      }),
    );

    const exactlyThirtyDaysLater = new Date(registeredAt.getTime() + 30 * DAY_MS);
    const result = await getEffectiveTrust(db, "cust-established", exactlyThirtyDaysLater);

    expect(result.effectiveTrustLevel).toBe("established");
    expect(result.basis.accountAgeDays).toBe(30);
  });

  it("real ITM-B ingestion + account age < 30 days -> provisional", async () => {
    const registeredAt = new Date("2026-08-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-provisional", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-provisional",
        referenceType: "phone_otp",
        idempotencyKey: "key-provisional",
        occurredAt: "2026-08-01T00:00:00.000Z",
      }),
    );

    const result = await getEffectiveTrust(
      db,
      "cust-provisional",
      new Date(registeredAt.getTime() + 5 * DAY_MS),
    );

    expect(result.effectiveTrustLevel).toBe("provisional");
  });

  it("stale persisted trustLevel cache is never trusted — recomputes established from evidence + time alone", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-stale-cache", registeredAt);

    // Simulate a trust record whose persisted `trustLevel` was cached at
    // `unverified` on day 0 and never refreshed (ITM-DESIGN-001 §6.6.1) —
    // constructed directly through ITM-B's own repository, not by
    // reaching into Firestore raw, so this exercises the real persisted
    // shape rather than a hand-rolled document.
    await ingestTrustEvidence(db, {
      customerIdentityId: "cust-stale-cache",
      category: "customer_authenticated",
      eventId: "evt-stale-cache",
      correlationId: "corr-stale-cache",
      occurredAt: registeredAt,
      actorId: null,
    });
    const persistedBefore = await db.collection("trustRecords").doc("cust-stale-cache").get();
    expect(persistedBefore.data()?.["trustLevel"]).toBe("unverified");

    const fortyDaysLater = new Date(registeredAt.getTime() + 40 * DAY_MS);
    const result = await getEffectiveTrust(db, "cust-stale-cache", fortyDaysLater);

    expect(result.effectiveTrustLevel).toBe("established");

    // Confirms ITM-C did not write back to the cache (task Phase N — no
    // cache mutation unless clearly authorized; design says refresh
    // happens only on ITM-B's own signal-driven write path).
    const persistedAfter = await db.collection("trustRecords").doc("cust-stale-cache").get();
    expect(persistedAfter.data()?.["trustLevel"]).toBe("unverified");
    expect(persistedAfter.data()?.["version"]).toBe(persistedBefore.data()?.["version"]);
  });

  it("missing Customer Identity fails closed with RESOURCE_NOT_FOUND", async () => {
    await expect(getEffectiveTrust(db, "cust-does-not-exist", new Date())).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
    await expect(getEffectiveTrust(db, "cust-does-not-exist", new Date())).rejects.toBeInstanceOf(
      TrustDomainError,
    );
  });

  it("recovery-only evidence never elevates trust, even with account age >= 30 days (real Firestore round trip)", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-recovery-only", registeredAt);
    await ingestTrustEvidence(db, {
      customerIdentityId: "cust-recovery-only",
      category: "authentication_recovery_proof_provided",
      eventId: "evt-recovery-only",
      correlationId: "corr-recovery-only",
      occurredAt: registeredAt,
      actorId: null,
    });

    const fortyDaysLater = new Date(registeredAt.getTime() + 40 * DAY_MS);
    const result = await getEffectiveTrust(db, "cust-recovery-only", fortyDaysLater);

    expect(result.effectiveTrustLevel).toBe("unverified");
    expect(result.basis.hasSuccessfulAuthentication).toBe(false);
  });

  it("repeated calls with the same inputs produce identical results (determinism, real Firestore round trip)", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-deterministic", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-deterministic",
        referenceType: "phone_otp",
        idempotencyKey: "key-deterministic",
        occurredAt: "2026-07-01T00:00:00.000Z",
      }),
    );

    const at = new Date(registeredAt.getTime() + 10 * DAY_MS);
    const first = await getEffectiveTrust(db, "cust-deterministic", at);
    const second = await getEffectiveTrust(db, "cust-deterministic", at);

    expect(first).toEqual(second);
  });
});
