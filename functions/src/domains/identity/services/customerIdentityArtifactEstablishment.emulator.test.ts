/**
 * Customer Identity artifact establishment (`PLATFORM-BASELINE-002`,
 * `FD-CUST-ID-ART-001`) against the real Firebase Emulator Suite.
 *
 * Proves the server-authoritative lifecycle with real Firestore
 * transaction/concurrency semantics (not mocks): fresh establishment,
 * idempotent rerun, partial repair (LN-present and interrupted-run shapes),
 * fail-closed contradictions (duplicate Loyalty Numbers, incompatible QR
 * bindings, multiple current QRs, malformed records, non-active identity),
 * simultaneous-establishment safety, read purity of the existing lookup
 * surface, and retry after a simulated mid-run failure.
 *
 * Not run under `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  ensureCustomerIdentityArtifacts,
  type EnsureCustomerIdentityArtifactsParams,
} from "./customerIdentityArtifactEstablishment";
import { createCustomerIdentity } from "../repositories/customerIdentityRepository";
import { transitionCustomerIdentityStatus } from "../repositories/identityLifecycleRepository";
import { issueLoyaltyNumberForIdentity } from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import type { LoyaltyNumberCandidateGenerator } from "../../loyaltyNumber/services/loyaltyNumberGenerator";
import type { QrReferenceGenerator } from "../../qrIdentity/services/qrReferenceGenerator";
import { lookupCustomerIdentityById } from "../repositories/identityLookupRepository";
import { getLoyaltyNumberAssignmentForIdentity } from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import { getActiveQrIdentityByCustomerIdentityId } from "../../qrIdentity/repositories/qrIdentityRepository";
import { IdentityDomainError } from "../models/identityErrors";
import { LoyaltyNumberDomainError } from "../../loyaltyNumber/models/loyaltyNumberErrors";
import { QrIdentityDomainError } from "../../qrIdentity/models/qrIdentityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "customerIdentityArtifactEstablishmentEmulatorTest",
);
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };
const NOW = new Date("2026-09-11T00:00:00.000Z");

class FixedGenerator implements LoyaltyNumberCandidateGenerator, QrReferenceGenerator {
  constructor(private readonly value: string) {}
  generateCandidate(): string {
    return this.value;
  }
  generateReference(): string {
    return this.value;
  }
}

/** QR generator that fails exactly once, then behaves — models a mid-run interruption. */
class FailOnceQrGenerator implements QrReferenceGenerator {
  private calls = 0;
  constructor(private readonly value: string) {}
  generateReference(): string {
    this.calls += 1;
    if (this.calls === 1) {
      throw new Error("simulated QR generator failure");
    }
    return this.value;
  }
}

async function seedIdentity(customerIdentityId: string, keySuffix: string) {
  return createCustomerIdentity(db, {
    eventId: `evt_art_create_${keySuffix}`,
    correlationId: `corr_art_create_${keySuffix}`,
    actor,
    occurredAt: "2026-09-11T00:00:00.000Z",
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: `authuid_${customerIdentityId}`,
      referenceType: "phone_otp" as const,
      createdAt: NOW,
      createdBy: customerIdentityId,
    },
    createdAt: NOW,
    createdBy: customerIdentityId,
    idempotencyKey: `art_create_${keySuffix}`,
    requestHash: `art_hash_create_${keySuffix}`,
  });
}

function ensureParams(
  customerIdentityId: string,
  suffix: string,
  overrides: Partial<EnsureCustomerIdentityArtifactsParams> = {},
): EnsureCustomerIdentityArtifactsParams {
  return {
    eventId: `evt_art_ensure_${suffix}`,
    correlationId: `corr_art_ensure_${suffix}`,
    actor,
    occurredAt: "2026-09-11T00:00:00.000Z",
    customerIdentityId,
    now: NOW,
    createdBy: customerIdentityId,
    ...overrides,
  };
}

async function issueLoyaltyNumberDirect(customerIdentityId: string, suffix: string, value: string) {
  return issueLoyaltyNumberForIdentity(db, {
    eventId: `evt_art_ln_${suffix}`,
    correlationId: `corr_art_ln_${suffix}`,
    actor,
    occurredAt: "2026-09-11T00:00:00.000Z",
    customerIdentityId,
    assignedAt: NOW,
    createdBy: customerIdentityId,
    generator: new FixedGenerator(value),
    idempotencyKey: `art_ln_${suffix}`,
    requestHash: `art_hash_ln_${suffix}`,
  });
}

async function suspendIdentity(customerIdentityId: string, keySuffix: string) {
  await transitionCustomerIdentityStatus(db, {
    eventId: `evt_art_suspend_${keySuffix}`,
    correlationId: `corr_art_suspend_${keySuffix}`,
    actor,
    occurredAt: "2026-09-11T00:00:00.000Z",
    customerIdentityId,
    toStatus: "suspended",
    authority: "administrator_initiated",
    reason: "administrative_suspension",
    updatedAt: NOW,
    updatedBy: "admin_1",
    idempotencyKey: `art_suspend_${keySuffix}`,
    requestHash: `art_hash_suspend_${keySuffix}`,
  });
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

async function profileOf(customerIdentityId: string): Promise<Record<string, unknown>> {
  const snapshot = await db.collection("customerProfiles").doc(customerIdentityId).get();
  return (snapshot.data() ?? {}) as Record<string, unknown>;
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

describe("ensureCustomerIdentityArtifacts — fresh establishment", () => {
  it("creates exactly one Loyalty Number and exactly one current QR for an active identity with neither", async () => {
    await seedIdentity("cust_art_fresh", "fresh");

    const result = await ensureCustomerIdentityArtifacts(
      db,
      ensureParams("cust_art_fresh", "fresh", {
        loyaltyNumberGenerator: new FixedGenerator("ABC234"),
        qrReferenceGenerator: new FixedGenerator("qr_art_fresh"),
      }),
    );

    expect(result.status).toBe("established");
    expect(result.customerIdentityId).toBe("cust_art_fresh");
    expect(result.loyaltyNumber).toBe("ABC234");
    expect(result.qrReference).toBe("qr_art_fresh");

    expect(await count("loyaltyNumbers")).toBe(1);
    expect(await count("qrIdentityRecords")).toBe(1);
    const qrDoc = await db.collection("qrIdentityRecords").doc("qr_art_fresh").get();
    expect(qrDoc.data()?.["status"]).toBe("active");
    expect(qrDoc.data()?.["customerIdentityId"]).toBe("cust_art_fresh");
    expect(qrDoc.data()?.["loyaltyNumber"]).toBe("ABC234");

    const profile = await profileOf("cust_art_fresh");
    expect(profile["loyaltyNumber"]).toBe("ABC234");
    expect(profile["qrReference"]).toBe("qr_art_fresh");

    const types = await outboxEventTypes();
    expect(types.some((t) => t.includes("loyalty_number_issued"))).toBe(true);
    expect(types.some((t) => t.includes("qr_identity_issued"))).toBe(true);
  });
});

describe("ensureCustomerIdentityArtifacts — idempotent rerun", () => {
  it("reuses the same artifacts and writes nothing new on repeat runs", async () => {
    await seedIdentity("cust_art_idem", "idem");

    const first = await ensureCustomerIdentityArtifacts(
      db,
      ensureParams("cust_art_idem", "idem1", {
        loyaltyNumberGenerator: new FixedGenerator("ABC234"),
        qrReferenceGenerator: new FixedGenerator("qr_art_idem"),
      }),
    );
    const outboxAfterFirst = await count("outboxEntries");
    const idempotencyAfterFirst = await count("idempotencyRecords");

    const second = await ensureCustomerIdentityArtifacts(
      db,
      ensureParams("cust_art_idem", "idem2", {
        loyaltyNumberGenerator: new FixedGenerator("ZZZ999"),
        qrReferenceGenerator: new FixedGenerator("qr_art_idem_other"),
      }),
    );

    expect(second.loyaltyNumber).toBe(first.loyaltyNumber);
    expect(second.qrReference).toBe(first.qrReference);
    expect(second.status).toBe("established");
    expect(await count("loyaltyNumbers")).toBe(1);
    expect(await count("qrIdentityRecords")).toBe(1);
    // A converged rerun is read-only: no new artifacts, no new outbox events,
    // no new idempotency reservations.
    expect(await count("outboxEntries")).toBe(outboxAfterFirst);
    expect(await count("idempotencyRecords")).toBe(idempotencyAfterFirst);
  });
});

describe("ensureCustomerIdentityArtifacts — partial repair", () => {
  it("repair A: existing Loyalty Number, missing QR — creates only the QR", async () => {
    await seedIdentity("cust_art_repa", "repa");
    const issued = await issueLoyaltyNumberDirect("cust_art_repa", "repa", "ABC234");

    const result = await ensureCustomerIdentityArtifacts(
      db,
      ensureParams("cust_art_repa", "repa", {
        qrReferenceGenerator: new FixedGenerator("qr_art_repa"),
      }),
    );

    expect(result.loyaltyNumber).toBe(issued.loyaltyNumber);
    expect(result.loyaltyNumber).toBe("ABC234");
    expect(result.qrReference).toBe("qr_art_repa");
    expect(await count("loyaltyNumbers")).toBe(1);
    expect(await count("qrIdentityRecords")).toBe(1);
    expect((await profileOf("cust_art_repa"))["qrReference"]).toBe("qr_art_repa");
  });

  it("repair B / retry after interruption: QR failure after Loyalty Number creation converges on retry without duplicates", async () => {
    await seedIdentity("cust_art_repb", "repb");

    await expect(
      ensureCustomerIdentityArtifacts(
        db,
        ensureParams("cust_art_repb", "repb1", {
          loyaltyNumberGenerator: new FixedGenerator("ABC234"),
          qrReferenceGenerator: new FailOnceQrGenerator("qr_art_repb"),
        }),
      ),
    ).rejects.toThrow("simulated QR generator failure");

    // The interrupted run left exactly the Loyalty Number behind — no QR.
    expect(await count("loyaltyNumbers")).toBe(1);
    expect(await count("qrIdentityRecords")).toBe(0);

    const result = await ensureCustomerIdentityArtifacts(
      db,
      ensureParams("cust_art_repb", "repb2", {
        loyaltyNumberGenerator: new FixedGenerator("ZZZ999"),
        qrReferenceGenerator: new FixedGenerator("qr_art_repb"),
      }),
    );

    expect(result.loyaltyNumber).toBe("ABC234");
    expect(result.qrReference).toBe("qr_art_repb");
    expect(await count("loyaltyNumbers")).toBe(1);
    expect(await count("qrIdentityRecords")).toBe(1);
  });
});

describe("ensureCustomerIdentityArtifacts — fail-closed contradictions", () => {
  it("duplicate Loyalty Numbers fail closed with no mutation", async () => {
    await seedIdentity("cust_art_dup", "dup");
    const base = {
      status: "active",
      customerIdentityId: "cust_art_dup",
      issuedAt: NOW,
      createdAt: NOW,
      createdBy: "cust_art_dup",
      updatedAt: NOW,
      updatedBy: "cust_art_dup",
    };
    await db
      .collection("loyaltyNumbers")
      .doc("ABC234")
      .set({ ...base, loyaltyNumber: "ABC234" });
    await db
      .collection("loyaltyNumbers")
      .doc("DEF345")
      .set({ ...base, loyaltyNumber: "DEF345" });

    await expect(
      ensureCustomerIdentityArtifacts(db, ensureParams("cust_art_dup", "dup")),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof LoyaltyNumberDomainError && e.category === "VALIDATION_FAILED",
    );

    expect(await count("loyaltyNumbers")).toBe(2);
    expect(await count("qrIdentityRecords")).toBe(0);
  });

  it("a QR bound to a different Loyalty Number fails closed with no silent rewrite", async () => {
    await seedIdentity("cust_art_badqr", "badqr");
    await issueLoyaltyNumberDirect("cust_art_badqr", "badqr", "ABC234");
    await db.collection("qrIdentityRecords").doc("qr_art_bad").set({
      id: "qr_art_bad",
      status: "active",
      qrReference: "qr_art_bad",
      customerIdentityId: "cust_art_badqr",
      loyaltyNumber: "XYZ999",
      issuedAt: NOW,
      replacedByReference: null,
      createdAt: NOW,
      createdBy: "cust_art_badqr",
      updatedAt: NOW,
      updatedBy: "cust_art_badqr",
    });
    await db.collection("customerProfiles").doc("cust_art_badqr").update({
      qrReference: "qr_art_bad",
    });

    await expect(
      ensureCustomerIdentityArtifacts(db, ensureParams("cust_art_badqr", "badqr")),
    ).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof QrIdentityDomainError && e.category === "INVALID_STATE_TRANSITION",
    );

    expect(await count("qrIdentityRecords")).toBe(1);
    expect(await count("loyaltyNumbers")).toBe(1);
  });

  it("multiple active QR records fail closed", async () => {
    await seedIdentity("cust_art_multiqr", "multiqr");
    await issueLoyaltyNumberDirect("cust_art_multiqr", "multiqr", "ABC234");
    const base = {
      status: "active",
      customerIdentityId: "cust_art_multiqr",
      loyaltyNumber: "ABC234",
      issuedAt: NOW,
      replacedByReference: null,
      createdAt: NOW,
      createdBy: "cust_art_multiqr",
      updatedAt: NOW,
      updatedBy: "cust_art_multiqr",
    };
    await db
      .collection("qrIdentityRecords")
      .doc("qr_art_m1")
      .set({ ...base, id: "qr_art_m1", qrReference: "qr_art_m1" });
    await db
      .collection("qrIdentityRecords")
      .doc("qr_art_m2")
      .set({ ...base, id: "qr_art_m2", qrReference: "qr_art_m2" });

    await expect(
      ensureCustomerIdentityArtifacts(db, ensureParams("cust_art_multiqr", "multiqr")),
    ).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof QrIdentityDomainError && e.category === "INVALID_STATE_TRANSITION",
    );

    expect(await count("qrIdentityRecords")).toBe(2);
  });

  it("a projection pointer bound to another identity's QR fails closed", async () => {
    await seedIdentity("cust_art_ptra", "ptra");
    await issueLoyaltyNumberDirect("cust_art_ptra", "ptra", "ABC234");
    await seedIdentity("cust_art_ptrb", "ptrb");
    await issueLoyaltyNumberDirect("cust_art_ptrb", "ptrb", "DEF345");
    await ensureCustomerIdentityArtifacts(
      db,
      ensureParams("cust_art_ptrb", "ptrb", {
        qrReferenceGenerator: new FixedGenerator("qr_art_ptrb"),
      }),
    );
    // Point A's projection at B's live QR — a contradictory binding.
    await db.collection("customerProfiles").doc("cust_art_ptra").update({
      qrReference: "qr_art_ptrb",
    });

    await expect(
      ensureCustomerIdentityArtifacts(db, ensureParams("cust_art_ptra", "ptra2")),
    ).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof QrIdentityDomainError && e.category === "INVALID_STATE_TRANSITION",
    );

    // B's artifacts are untouched; A gained nothing.
    expect((await profileOf("cust_art_ptrb"))["qrReference"]).toBe("qr_art_ptrb");
    const aRecords = await db
      .collection("qrIdentityRecords")
      .where("customerIdentityId", "==", "cust_art_ptra")
      .get();
    expect(aRecords.size).toBe(0);
  });

  it("a malformed Loyalty Number record fails closed", async () => {
    await seedIdentity("cust_art_mal", "mal");
    await db.collection("loyaltyNumbers").doc("ABC234").set({
      id: "ABC234",
      customerIdentityId: "cust_art_mal",
    });

    await expect(
      ensureCustomerIdentityArtifacts(db, ensureParams("cust_art_mal", "mal")),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof LoyaltyNumberDomainError && e.category === "VALIDATION_FAILED",
    );

    expect(await count("qrIdentityRecords")).toBe(0);
  });

  it("a malformed QR record fails closed", async () => {
    await seedIdentity("cust_art_malqr", "malqr");
    await issueLoyaltyNumberDirect("cust_art_malqr", "malqr", "ABC234");
    await db.collection("qrIdentityRecords").doc("qr_art_mal").set({
      id: "qr_art_mal",
      customerIdentityId: "cust_art_malqr",
    });

    await expect(
      ensureCustomerIdentityArtifacts(db, ensureParams("cust_art_malqr", "malqr")),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof QrIdentityDomainError && e.category === "VALIDATION_FAILED",
    );
  });

  it("a non-active identity fails closed with no artifact creation", async () => {
    await seedIdentity("cust_art_susp", "susp");
    await suspendIdentity("cust_art_susp", "susp");

    await expect(
      ensureCustomerIdentityArtifacts(db, ensureParams("cust_art_susp", "susp2")),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof IdentityDomainError && e.category === "INVALID_STATE_TRANSITION",
    );

    expect(await count("loyaltyNumbers")).toBe(0);
    expect(await count("qrIdentityRecords")).toBe(0);
  });

  it("an unknown identity fails closed with RESOURCE_NOT_FOUND", async () => {
    await expect(
      ensureCustomerIdentityArtifacts(db, ensureParams("cust_art_ghost", "ghost")),
    ).rejects.toSatisfy(
      (e: unknown) => e instanceof IdentityDomainError && e.category === "RESOURCE_NOT_FOUND",
    );
  });
});

describe("ensureCustomerIdentityArtifacts — concurrency", () => {
  it("two simultaneous establishments leave exactly one Loyalty Number and one current QR", async () => {
    await seedIdentity("cust_art_conc", "conc");
    const paramsFor = (suffix: string) =>
      ensureParams("cust_art_conc", suffix, {
        loyaltyNumberGenerator: new FixedGenerator("ABC234"),
        qrReferenceGenerator: new FixedGenerator("qr_art_conc"),
      });

    const results = await Promise.allSettled([
      ensureCustomerIdentityArtifacts(db, paramsFor("conc1")),
      ensureCustomerIdentityArtifacts(db, paramsFor("conc2")),
    ]);

    // A loser observes a retryable in-progress conflict at most — retry it to
    // convergence, then every invocation agrees on one established state.
    for (const result of results) {
      if (result.status === "rejected") {
        const retried = await ensureCustomerIdentityArtifacts(db, paramsFor("conc3"));
        expect(retried.status).toBe("established");
      }
    }

    expect(await count("loyaltyNumbers")).toBe(1);
    const qrRecords = await db
      .collection("qrIdentityRecords")
      .where("customerIdentityId", "==", "cust_art_conc")
      .get();
    expect(qrRecords.size).toBe(1);
    expect(qrRecords.docs[0]?.data()["status"]).toBe("active");
    expect(qrRecords.docs[0]?.data()["loyaltyNumber"]).toBe("ABC234");

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    for (const result of fulfilled) {
      if (result.status === "fulfilled") {
        expect(result.value.loyaltyNumber).toBe("ABC234");
        expect(result.value.qrReference).toBe("qr_art_conc");
      }
    }
  });
});

describe("ensureCustomerIdentityArtifacts — read purity", () => {
  it("the existing read surface creates nothing on an artifact-less active identity", async () => {
    await seedIdentity("cust_art_pure", "pure");
    // Baseline after seeding: the seed itself wrote its own identity outbox
    // event and idempotency record — the reads below must add nothing.
    const outboxBaseline = await count("outboxEntries");
    const idempotencyBaseline = await count("idempotencyRecords");

    const lookup = await lookupCustomerIdentityById(db, {
      eventId: "evt_art_pure_lookup",
      correlationId: "corr_art_pure_lookup",
      actor,
      occurredAt: "2026-09-11T00:00:00.000Z",
      customerIdentityId: "cust_art_pure",
      purpose: "internal_service",
    });
    expect(lookup.customerIdentityId).toBe("cust_art_pure");
    expect(await getLoyaltyNumberAssignmentForIdentity(db, "cust_art_pure")).toBeUndefined();
    expect(await getActiveQrIdentityByCustomerIdentityId(db, "cust_art_pure")).toBeUndefined();

    expect(await count("loyaltyNumbers")).toBe(0);
    expect(await count("qrIdentityRecords")).toBe(0);
    expect(await count("outboxEntries")).toBe(outboxBaseline);
    expect(await count("idempotencyRecords")).toBe(idempotencyBaseline);
  });
});
