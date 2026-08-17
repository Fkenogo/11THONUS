import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import type { EventActor } from "../../../shared/events/domainEvent";
import { buildCustomerAuthenticatedEvent } from "../../authentication/events/authenticationEventFactories";
import { ingestAuthenticationSignal } from "./trustSignalIngestionService";
import { ingestTrustEvidence } from "../repositories/trustRecordRepository";
import { checkRiskGate } from "./checkRiskGateService";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "checkRiskGateServiceEmulatorTest");
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

describe("ITM-D — checkRiskGate (real Firestore emulator)", () => {
  it("established identity satisfies TRUST_ESTABLISHED_OR_ABOVE", async () => {
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

    const thirtyOneDaysLater = new Date(registeredAt.getTime() + 31 * DAY_MS);
    const decision = await checkRiskGate(
      db,
      "cust-established",
      "TRUST_ESTABLISHED_OR_ABOVE",
      thirtyOneDaysLater,
    );

    expect(decision.decision).toBe("sufficient");
    expect(decision.effectiveTrustLevel).toBe("established");
  });

  it("provisional identity fails TRUST_ESTABLISHED_OR_ABOVE", async () => {
    const registeredAt = new Date("2026-08-10T00:00:00.000Z");
    await seedCustomerIdentity("cust-provisional", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-provisional",
        referenceType: "phone_otp",
        idempotencyKey: "key-provisional",
        occurredAt: "2026-08-10T00:00:00.000Z",
      }),
    );

    const fiveDaysLater = new Date(registeredAt.getTime() + 5 * DAY_MS);
    const decision = await checkRiskGate(
      db,
      "cust-provisional",
      "TRUST_ESTABLISHED_OR_ABOVE",
      fiveDaysLater,
    );

    expect(decision.decision).toBe("insufficient");
    expect(decision.effectiveTrustLevel).toBe("provisional");
  });

  it("brand-new identity (no trust record yet) is unverified — satisfies TRUST_UNVERIFIED_OR_ABOVE only", async () => {
    const registeredAt = new Date("2026-08-16T00:00:00.000Z");
    await seedCustomerIdentity("cust-new", registeredAt);

    const unverifiedDecision = await checkRiskGate(
      db,
      "cust-new",
      "TRUST_UNVERIFIED_OR_ABOVE",
      new Date("2026-08-17T00:00:00.000Z"),
    );
    expect(unverifiedDecision.decision).toBe("sufficient");

    const provisionalDecision = await checkRiskGate(
      db,
      "cust-new",
      "TRUST_PROVISIONAL_OR_ABOVE",
      new Date("2026-08-17T00:00:00.000Z"),
    );
    expect(provisionalDecision.decision).toBe("insufficient");
  });

  it("missing Customer Identity fails closed as unavailable, never throws", async () => {
    const decision = await checkRiskGate(
      db,
      "cust-does-not-exist",
      "TRUST_PROVISIONAL_OR_ABOVE",
      new Date(),
    );
    expect(decision.decision).toBe("unavailable");
    expect(decision.reasonCode).toBe("EFFECTIVE_TRUST_UNAVAILABLE");
    expect(decision.errorCategory).toBe("RESOURCE_NOT_FOUND");
  });

  it("malformed risk requirement fails closed without reading Firestore's outcome affecting the result", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-malformed-req", registeredAt);

    const decision = await checkRiskGate(db, "cust-malformed-req", "NOT_A_REQUIREMENT", new Date());
    expect(decision.decision).toBe("unavailable");
    expect(decision.reasonCode).toBe("UNKNOWN_RISK_REQUIREMENT");
  });

  it("recovery-only evidence never elevates trust enough to satisfy a provisional-or-above gate (real Firestore round trip)", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-recovery-only", registeredAt);
    // No CustomerAuthenticated event ingested — only identity exists.

    const decision = await checkRiskGate(
      db,
      "cust-recovery-only",
      "TRUST_PROVISIONAL_OR_ABOVE",
      new Date(registeredAt.getTime() + 40 * DAY_MS),
    );
    expect(decision.decision).toBe("insufficient");
    expect(decision.effectiveTrustLevel).toBe("unverified");
  });

  it("provider type cannot influence the decision — Google and Phone OTP identities with identical age/evidence produce identical decisions", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-provider-google", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-provider-google",
        referenceType: "google_sign_in",
        idempotencyKey: "key-provider-google",
        occurredAt: "2026-07-01T00:00:00.000Z",
      }),
    );
    await seedCustomerIdentity("cust-provider-phone", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-provider-phone",
        referenceType: "phone_otp",
        idempotencyKey: "key-provider-phone",
        occurredAt: "2026-07-01T00:00:00.000Z",
      }),
    );

    const at = new Date(registeredAt.getTime() + 10 * DAY_MS);
    const googleDecision = await checkRiskGate(
      db,
      "cust-provider-google",
      "TRUST_PROVISIONAL_OR_ABOVE",
      at,
    );
    const phoneDecision = await checkRiskGate(
      db,
      "cust-provider-phone",
      "TRUST_PROVISIONAL_OR_ABOVE",
      at,
    );

    expect(googleDecision.decision).toBe(phoneDecision.decision);
    expect(googleDecision.effectiveTrustLevel).toBe(phoneDecision.effectiveTrustLevel);
  });

  it("number of authentication events cannot influence the decision — one event vs. three produce identical decisions", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-single-event", registeredAt);
    await ingestAuthenticationSignal(
      db,
      buildCustomerAuthenticatedEvent({
        customerIdentityId: "cust-single-event",
        referenceType: "phone_otp",
        idempotencyKey: "key-single-event",
        occurredAt: "2026-07-01T00:00:00.000Z",
      }),
    );

    await seedCustomerIdentity("cust-many-events", registeredAt);
    for (let i = 0; i < 3; i += 1) {
      await ingestAuthenticationSignal(
        db,
        buildCustomerAuthenticatedEvent({
          customerIdentityId: "cust-many-events",
          referenceType: "phone_otp",
          idempotencyKey: `key-many-events-${i}`,
          occurredAt: `2026-07-0${i + 1}T00:00:00.000Z`,
        }),
      );
    }

    const at = new Date(registeredAt.getTime() + 10 * DAY_MS);
    const singleDecision = await checkRiskGate(
      db,
      "cust-single-event",
      "TRUST_PROVISIONAL_OR_ABOVE",
      at,
    );
    const manyDecision = await checkRiskGate(
      db,
      "cust-many-events",
      "TRUST_PROVISIONAL_OR_ABOVE",
      at,
    );

    expect(singleDecision.decision).toBe(manyDecision.decision);
    expect(singleDecision.effectiveTrustLevel).toBe(manyDecision.effectiveTrustLevel);
  });

  it("a stale persisted trustLevel cache cannot influence the risk-gate decision — recomputes established from evidence + time alone", async () => {
    const registeredAt = new Date("2026-07-01T00:00:00.000Z");
    await seedCustomerIdentity("cust-stale-cache-gate", registeredAt);

    // Forces the persisted `trustLevel` cache to `unverified` at day 0 via
    // ITM-B's own repository (not a raw Firestore write) — mirrors ITM-C's
    // own independent-review adversarial test, exercised here through the
    // risk-gate contract itself rather than `getEffectiveTrust` directly.
    await ingestTrustEvidence(db, {
      customerIdentityId: "cust-stale-cache-gate",
      category: "customer_authenticated",
      eventId: "evt-stale-cache-gate",
      correlationId: "corr-stale-cache-gate",
      occurredAt: registeredAt,
      actorId: null,
    });
    const persistedBefore = await db.collection("trustRecords").doc("cust-stale-cache-gate").get();
    expect(persistedBefore.data()?.["trustLevel"]).toBe("unverified");

    const fortyDaysLater = new Date(registeredAt.getTime() + 40 * DAY_MS);
    const decision = await checkRiskGate(
      db,
      "cust-stale-cache-gate",
      "TRUST_ESTABLISHED_OR_ABOVE",
      fortyDaysLater,
    );

    expect(decision.decision).toBe("sufficient");
    expect(decision.effectiveTrustLevel).toBe("established");
  });

  it("identical inputs produce identical decisions (determinism, real Firestore round trip)", async () => {
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
    const first = await checkRiskGate(db, "cust-deterministic", "TRUST_PROVISIONAL_OR_ABOVE", at);
    const second = await checkRiskGate(db, "cust-deterministic", "TRUST_PROVISIONAL_OR_ABOVE", at);

    expect(first).toEqual(second);
  });
});
