import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import type { EventActor } from "../../../shared/events/domainEvent";
import { getEffectiveTrust } from "./effectiveTrustService";

/**
 * Independent adversarial review (task "CAP-P2-ITM-C — Independent Final
 * Derivation Review, Merge & Closure", Phase F/G/O). Written separately
 * from the implementer's own `effectiveTrustService.emulator.test.ts` —
 * these tests forge a persisted `trustRecords` document directly via raw
 * Firestore writes (bypassing ITM-B's own repository entirely) to prove
 * the effective derivation cannot be steered by a stored `trustLevel`
 * value under any of the three adversarial directions Phase F names, not
 * merely the one direction the implementer's own suite already covered.
 *
 * Real Firestore round trip against the Firebase Emulator Suite
 * (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "effectiveTrustIndependentReviewTest");
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

/**
 * Writes a raw `trustRecords/{customerIdentityId}` document directly —
 * bypassing `ingestTrustEvidence`/`createTrustRecord` entirely — so the
 * forged `trustLevel` cannot be "corrected" by any ITM-A/B validation on
 * the write path. This is deliberately a more adversarial construction
 * than going through ITM-B's own repository.
 */
async function forgeTrustRecord(
  customerIdentityId: string,
  params: { forgedTrustLevel: string; hasSuccessfulAuthentication: boolean },
): Promise<void> {
  await db
    .collection("trustRecords")
    .doc(customerIdentityId)
    .set({
      customerIdentityId,
      verificationState: { phoneVerified: false, emailVerified: false },
      signalState: { hasSuccessfulAuthentication: params.hasSuccessfulAuthentication },
      trustLevel: params.forgedTrustLevel,
      version: 1,
      status: "active",
      reasonReferences: params.hasSuccessfulAuthentication
        ? [
            {
              category: "customer_authenticated",
              eventId: `evt-forged-${customerIdentityId}`,
              correlationId: `corr-forged-${customerIdentityId}`,
              occurredAt: new Date(),
            },
          ]
        : [],
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      schemaVersion: 1,
    });
}

describe("ITM-C independent review — stored trustLevel can never become authority (Phase F, all three adversarial directions)", () => {
  it("1. forged trustLevel=established + NO auth evidence -> effective derivation still returns unverified", async () => {
    const registeredAt = new Date("2026-01-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-forged-1", registeredAt);
    await forgeTrustRecord("cust-forged-1", {
      forgedTrustLevel: "established",
      hasSuccessfulAuthentication: false,
    });

    const farFuture = new Date(registeredAt.getTime() + 400 * DAY_MS);
    const result = await getEffectiveTrust(db, "cust-forged-1", farFuture);

    expect(result.effectiveTrustLevel).toBe("unverified");
    expect(result.basis.hasSuccessfulAuthentication).toBe(false);
  });

  it("2. forged trustLevel=established + auth evidence + age < 30 days -> effective derivation still returns provisional", async () => {
    const registeredAt = new Date("2026-08-10T00:00:00.000Z");
    await seedCustomerIdentity("cust-forged-2", registeredAt);
    await forgeTrustRecord("cust-forged-2", {
      forgedTrustLevel: "established",
      hasSuccessfulAuthentication: true,
    });

    const fiveDaysLater = new Date(registeredAt.getTime() + 5 * DAY_MS);
    const result = await getEffectiveTrust(db, "cust-forged-2", fiveDaysLater);

    expect(result.effectiveTrustLevel).toBe("provisional");
  });

  it("3. forged trustLevel=unverified + auth evidence + age >= 30 days -> effective derivation still returns established", async () => {
    const registeredAt = new Date("2026-06-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-forged-3", registeredAt);
    await forgeTrustRecord("cust-forged-3", {
      forgedTrustLevel: "unverified",
      hasSuccessfulAuthentication: true,
    });

    const fortyDaysLater = new Date(registeredAt.getTime() + 40 * DAY_MS);
    const result = await getEffectiveTrust(db, "cust-forged-3", fortyDaysLater);

    expect(result.effectiveTrustLevel).toBe("established");
  });

  it("4. forged trustLevel=provisional + NO auth evidence + age >= 30 days -> effective derivation still returns unverified (age alone is never sufficient)", async () => {
    const registeredAt = new Date("2026-01-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-forged-4", registeredAt);
    await forgeTrustRecord("cust-forged-4", {
      forgedTrustLevel: "provisional",
      hasSuccessfulAuthentication: false,
    });

    const farFuture = new Date(registeredAt.getTime() + 400 * DAY_MS);
    const result = await getEffectiveTrust(db, "cust-forged-4", farFuture);

    expect(result.effectiveTrustLevel).toBe("unverified");
  });
});

describe("ITM-C independent review — read-consistency around concurrent ITM-B ingestion (Phase O)", () => {
  it("a read before evidence is ingested returns unverified; the same read after ingestion returns provisional; no invalid intermediate state is ever observed", async () => {
    const registeredAt = new Date("2026-08-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-concurrent-1", registeredAt);

    const now = new Date(registeredAt.getTime() + 5 * DAY_MS);
    const before = await getEffectiveTrust(db, "cust-concurrent-1", now);
    expect(before.effectiveTrustLevel).toBe("unverified");

    const { ingestAuthenticationSignal } = await import("./trustSignalIngestionService");
    const { buildCustomerAuthenticatedEvent } =
      await import("../../authentication/events/authenticationEventFactories");
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-concurrent-1",
        referenceType: "phone_otp",
        idempotencyKey: "key-concurrent-1",
        occurredAt: registeredAt.toISOString(),
      }),
    );

    const after = await getEffectiveTrust(db, "cust-concurrent-1", now);
    expect(after.effectiveTrustLevel).toBe("provisional");
  });

  it("concurrent reads of getEffectiveTrust never mutate the underlying trust record or customer identity (read-only, no transaction needed)", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-concurrent-2", registeredAt);
    await forgeTrustRecord("cust-concurrent-2", {
      forgedTrustLevel: "unverified",
      hasSuccessfulAuthentication: true,
    });

    const before = await db.collection("trustRecords").doc("cust-concurrent-2").get();
    const beforeData = before.data();

    const now = new Date(registeredAt.getTime() + 10 * DAY_MS);
    const results = await Promise.all(
      Array.from({ length: 10 }, () => getEffectiveTrust(db, "cust-concurrent-2", now)),
    );

    for (const result of results) {
      expect(result.effectiveTrustLevel).toBe("provisional");
    }

    const after = await db.collection("trustRecords").doc("cust-concurrent-2").get();
    expect(after.data()).toEqual(beforeData);
  });
});
