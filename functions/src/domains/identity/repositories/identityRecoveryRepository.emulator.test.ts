import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "./customerIdentityRepository";
import { transitionCustomerIdentityStatus } from "./identityLifecycleRepository";
import { recoverCustomerIdentityByReference } from "./identityRecoveryRepository";
import { issueLoyaltyNumberForIdentity } from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import type { LoyaltyNumberCandidateGenerator } from "../../loyaltyNumber/services/loyaltyNumberGenerator";
import { issueQrIdentityForIdentity } from "../../qrIdentity/repositories/qrIdentityRepository";
import type { QrReferenceGenerator } from "../../qrIdentity/services/qrReferenceGenerator";
import { IdentityDomainError } from "../models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { RecoveryProof } from "../models/recoveryProof";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "identityRecoveryRepositoryEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

class FixedGenerator implements LoyaltyNumberCandidateGenerator, QrReferenceGenerator {
  constructor(private readonly value: string) {}
  generateCandidate(): string {
    return this.value;
  }
  generateReference(): string {
    return this.value;
  }
}

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

async function suspendIdentity(customerIdentityId: string, keySuffix: string) {
  await transitionCustomerIdentityStatus(db, {
    eventId: `evt_${keySuffix}`,
    correlationId: `corr_${keySuffix}`,
    actor,
    occurredAt: "2026-08-05T00:30:00.000Z",
    customerIdentityId,
    toStatus: "suspended",
    authority: "administrator_initiated",
    reason: "administrative_suspension",
    updatedAt: new Date("2026-08-05T00:30:00.000Z"),
    updatedBy: "admin_1",
    idempotencyKey: `suspend_${keySuffix}`,
    requestHash: `hash_suspend_${keySuffix}`,
  });
}

function buildProof(
  targetCustomerIdentityId: string,
  overrides: Partial<RecoveryProof> = {},
): RecoveryProof {
  return {
    result: "accepted",
    methodCategory: "support_assisted",
    proofReference: `proof_${targetCustomerIdentityId}_${Math.random().toString(36).slice(2)}`,
    authority: "support_initiated",
    completedAt: new Date("2026-08-05T01:00:00.000Z"),
    targetCustomerIdentityId,
    ...overrides,
  };
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
    "idempotencyRecords",
    "outboxEntries",
    "recoveryProofReferences",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("recoverCustomerIdentityByReference", () => {
  it("resolves via a direct Customer Identity ID reference", async () => {
    await seedIdentity("cust_1", "a1");
    await suspendIdentity("cust_1", "a1");

    const identity = await recoverCustomerIdentityByReference(db, {
      eventId: "evt_a1",
      correlationId: "corr_a1",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      targetReference: { type: "customer_identity_id", value: "cust_1" },
      recoveryProof: buildProof("cust_1"),
      recoveredAt: new Date("2026-08-05T01:00:00.000Z"),
      recoveredBy: "support_1",
      idempotencyKey: "key_a1_recover",
      requestHash: "hash_a1_recover",
    });

    expect(identity.status).toBe("active");
    expect(identity.id).toBe("cust_1");
  });

  it("resolves via a Loyalty Number reference", async () => {
    await seedIdentity("cust_2", "a2");
    await suspendIdentity("cust_2", "a2");
    await issueLoyaltyNumberForIdentity(db, {
      eventId: "evt_ln_a2",
      correlationId: "corr_ln_a2",
      actor,
      occurredAt: "2026-08-05T00:15:00.000Z",
      customerIdentityId: "cust_2",
      assignedAt: new Date("2026-08-05T00:15:00.000Z"),
      createdBy: "cust_2",
      generator: new FixedGenerator("ABC234"),
      idempotencyKey: "key_ln_a2",
      requestHash: "hash_ln_a2",
    });

    const identity = await recoverCustomerIdentityByReference(db, {
      eventId: "evt_a2",
      correlationId: "corr_a2",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      targetReference: { type: "loyalty_number", value: "ABC234" },
      recoveryProof: buildProof("cust_2"),
      recoveredAt: new Date("2026-08-05T01:00:00.000Z"),
      recoveredBy: "support_1",
      idempotencyKey: "key_a2_recover",
      requestHash: "hash_a2_recover",
    });

    expect(identity.status).toBe("active");
    expect(identity.id).toBe("cust_2");
  });

  it("resolves via a current (active) QR reference", async () => {
    await seedIdentity("cust_3", "a3");
    await suspendIdentity("cust_3", "a3");
    await issueQrIdentityForIdentity(db, {
      eventId: "evt_qr_a3",
      correlationId: "corr_qr_a3",
      actor,
      occurredAt: "2026-08-05T00:15:00.000Z",
      customerIdentityId: "cust_3",
      loyaltyNumber: "ABD235",
      issuedAt: new Date("2026-08-05T00:15:00.000Z"),
      createdBy: "cust_3",
      generator: new FixedGenerator("qr_ref_003"),
      idempotencyKey: "key_qr_a3",
      requestHash: "hash_qr_a3",
    });

    const identity = await recoverCustomerIdentityByReference(db, {
      eventId: "evt_a3",
      correlationId: "corr_a3",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      targetReference: { type: "qr_reference", value: "qr_ref_003" },
      recoveryProof: buildProof("cust_3"),
      recoveredAt: new Date("2026-08-05T01:00:00.000Z"),
      recoveredBy: "support_1",
      idempotencyKey: "key_a3_recover",
      requestHash: "hash_a3_recover",
    });

    expect(identity.status).toBe("active");
    expect(identity.id).toBe("cust_3");
  });

  it("rejects an unknown Loyalty Number reference (fails closed, no identity created)", async () => {
    await expect(
      recoverCustomerIdentityByReference(db, {
        eventId: "evt_a4",
        correlationId: "corr_a4",
        actor,
        occurredAt: "2026-08-05T01:00:00.000Z",
        targetReference: { type: "loyalty_number", value: "LOY_UNKNOWN" },
        recoveryProof: buildProof("cust_4"),
        recoveredAt: new Date("2026-08-05T01:00:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_a4_recover",
        requestHash: "hash_a4_recover",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects an unknown/invalidated QR reference (fails closed, no identity created)", async () => {
    await expect(
      recoverCustomerIdentityByReference(db, {
        eventId: "evt_a5",
        correlationId: "corr_a5",
        actor,
        occurredAt: "2026-08-05T01:00:00.000Z",
        targetReference: { type: "qr_reference", value: "qr_ref_unknown" },
        recoveryProof: buildProof("cust_5"),
        recoveredAt: new Date("2026-08-05T01:00:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_a5_recover",
        requestHash: "hash_a5_recover",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects when a Loyalty Number resolves to a different identity than the proof targets (duplicate-identity risk)", async () => {
    await seedIdentity("cust_6", "a6");
    await suspendIdentity("cust_6", "a6");
    await issueLoyaltyNumberForIdentity(db, {
      eventId: "evt_ln_a6",
      correlationId: "corr_ln_a6",
      actor,
      occurredAt: "2026-08-05T00:15:00.000Z",
      customerIdentityId: "cust_6",
      assignedAt: new Date("2026-08-05T00:15:00.000Z"),
      createdBy: "cust_6",
      generator: new FixedGenerator("ABE236"),
      idempotencyKey: "key_ln_a6",
      requestHash: "hash_ln_a6",
    });

    await expect(
      recoverCustomerIdentityByReference(db, {
        eventId: "evt_a6",
        correlationId: "corr_a6",
        actor,
        occurredAt: "2026-08-05T01:00:00.000Z",
        targetReference: { type: "loyalty_number", value: "ABE236" },
        recoveryProof: buildProof("cust_other"),
        recoveredAt: new Date("2026-08-05T01:00:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_a6_recover",
        requestHash: "hash_a6_recover",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });
});
