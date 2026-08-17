import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import type { EventActor } from "../../../shared/events/domainEvent";
import { buildCustomerAuthenticatedEvent } from "../../authentication/events/authenticationEventFactories";
import { ingestAuthenticationSignal } from "./trustSignalIngestionService";
import { touchRiskGateBoundaryFixture } from "./touchRiskGateBoundaryFixtureCommand";
import { touchStandardParticipationFixture } from "./touchStandardParticipationFixtureCommand";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "riskGateBoundaryFixtureEmulatorTest");
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
  for (const collection of [
    "trustRecords",
    "users",
    "outboxEntries",
    "idempotencyRecords",
    "riskGateBoundaryTestFixtures",
    "standardParticipationTestFixtures",
  ]) {
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

describe("ITM-D boundary fixture — explicit opt-in vs standard participation (real Firestore emulator)", () => {
  it("gated fixture: sufficient trust -> allowed, fixture mutated", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-sufficient", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-sufficient",
        referenceType: "phone_otp",
        idempotencyKey: "key-sufficient",
        occurredAt: "2026-07-01T00:00:00.000Z",
      }),
    );

    const result = await touchRiskGateBoundaryFixture(db, {
      customerIdentityId: "cust-sufficient",
      riskRequirement: "TRUST_ESTABLISHED_OR_ABOVE",
      fixtureId: "fixture-sufficient",
      now: new Date(registeredAt.getTime() + 31 * DAY_MS),
    });

    expect(result.outcome).toBe("allowed");
    if (result.outcome === "allowed") {
      expect(result.touchedCount).toBe(1);
    }

    const snapshot = await db
      .collection("riskGateBoundaryTestFixtures")
      .doc("fixture-sufficient")
      .get();
    expect(snapshot.exists).toBe(true);
    expect(snapshot.data()?.["touchedCount"]).toBe(1);
  });

  it("gated fixture: insufficient trust -> denied, fixture never mutated", async () => {
    const registeredAt = new Date("2026-08-15T00:00:00.000Z");
    await seedCustomerIdentity("cust-insufficient", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-insufficient",
        referenceType: "phone_otp",
        idempotencyKey: "key-insufficient",
        occurredAt: "2026-08-15T00:00:00.000Z",
      }),
    );

    const result = await touchRiskGateBoundaryFixture(db, {
      customerIdentityId: "cust-insufficient",
      riskRequirement: "TRUST_ESTABLISHED_OR_ABOVE",
      fixtureId: "fixture-insufficient",
      now: new Date(registeredAt.getTime() + 2 * DAY_MS),
    });

    expect(result.outcome).toBe("denied");
    if (result.outcome === "denied") {
      expect(result.decision.decision).toBe("insufficient");
    }

    const snapshot = await db
      .collection("riskGateBoundaryTestFixtures")
      .doc("fixture-insufficient")
      .get();
    expect(snapshot.exists).toBe(false);
  });

  it("gated fixture: unknown identity -> denied as unavailable, fixture never mutated", async () => {
    const result = await touchRiskGateBoundaryFixture(db, {
      customerIdentityId: "cust-unknown",
      riskRequirement: "TRUST_PROVISIONAL_OR_ABOVE",
      fixtureId: "fixture-unknown-identity",
    });

    expect(result.outcome).toBe("denied");
    if (result.outcome === "denied") {
      expect(result.decision.decision).toBe("unavailable");
    }

    const snapshot = await db
      .collection("riskGateBoundaryTestFixtures")
      .doc("fixture-unknown-identity")
      .get();
    expect(snapshot.exists).toBe(false);
  });

  it("standard participation fixture: succeeds unconditionally, with no customer identity or trust record involved at all", async () => {
    const result = await touchStandardParticipationFixture(db, {
      fixtureId: "fixture-standard",
    });

    expect(result.touchedCount).toBe(1);

    const secondResult = await touchStandardParticipationFixture(db, {
      fixtureId: "fixture-standard",
    });
    expect(secondResult.touchedCount).toBe(2);

    // Confirms this path never created or touched any trust-domain state.
    const trustRecordsSnapshot = await db.collection("trustRecords").get();
    expect(trustRecordsSnapshot.empty).toBe(true);
  });
});
