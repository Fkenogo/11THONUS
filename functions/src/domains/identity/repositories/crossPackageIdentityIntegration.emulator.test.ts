import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity, getCustomerIdentityById } from "./customerIdentityRepository";
import {
  linkAuthenticationReferenceForIdentity,
  unlinkAuthenticationReferenceForIdentity,
  getActiveAuthenticationReferenceOwner,
} from "./authenticationReferenceRepository";
import {
  transitionCustomerIdentityStatus,
  recoverCustomerIdentityStatus,
} from "./identityLifecycleRepository";
import { recoverCustomerIdentityByReference } from "./identityRecoveryRepository";
import {
  lookupCustomerIdentityById,
  lookupCustomerIdentityByLoyaltyNumber,
  lookupCustomerIdentityByQrReference,
  lookupCustomerIdentityByAuthenticationReference,
} from "./identityLookupRepository";
import {
  issueLoyaltyNumberForIdentity,
  getLoyaltyNumberAssignmentForIdentity,
} from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import type { LoyaltyNumberCandidateGenerator } from "../../loyaltyNumber/services/loyaltyNumberGenerator";
import {
  issueQrIdentityForIdentity,
  regenerateQrIdentityForIdentity,
  getActiveQrIdentityByReference,
} from "../../qrIdentity/repositories/qrIdentityRepository";
import type { QrReferenceGenerator } from "../../qrIdentity/services/qrReferenceGenerator";
import {
  queryAuditRecordsByCustomerIdentityId,
  queryAuditRecordsByEventType,
} from "../../identityAudit/repositories/identityAuditQueryRepository";
import { IdentityDomainError } from "../models/identityErrors";
import { QrIdentityDomainError } from "../../qrIdentity/models/qrIdentityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { RecoveryProof } from "../models/recoveryProof";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.
//
// ENG-P2-ARCH-CORR-002: resolves Architecture Review Finding F2. Every
// scenario below sequences real, already-merged public repository
// functions exactly as a future orchestration boundary would call them —
// no test-only business logic is introduced. Where no single composite
// production command exists (issuance, replay), the longest real chain
// of governed package commands is exercised instead, and that limitation
// is recorded in the correction report's coverage matrix, not hidden.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "crossPackageIdentityIntegrationEmulatorTest",
);
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
    occurredAt: "2026-08-06T00:00:00.000Z",
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: `authuid_${customerIdentityId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-08-06T00:00:00.000Z"),
      createdBy: customerIdentityId,
    },
    createdAt: new Date("2026-08-06T00:00:00.000Z"),
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
    occurredAt: "2026-08-06T02:00:00.000Z",
  };
}

async function issueLoyaltyNumber(customerIdentityId: string, suffix: string, value: string) {
  return issueLoyaltyNumberForIdentity(db, {
    eventId: `evt_ln_${suffix}`,
    correlationId: `corr_ln_${suffix}`,
    actor,
    occurredAt: "2026-08-06T00:05:00.000Z",
    customerIdentityId,
    assignedAt: new Date("2026-08-06T00:05:00.000Z"),
    createdBy: customerIdentityId,
    generator: new FixedGenerator(value),
    idempotencyKey: `key_ln_${suffix}`,
    requestHash: `hash_ln_${suffix}`,
  });
}

async function issueQrIdentity(
  customerIdentityId: string,
  loyaltyNumber: string,
  suffix: string,
  value: string,
) {
  return issueQrIdentityForIdentity(db, {
    eventId: `evt_qr_${suffix}`,
    correlationId: `corr_qr_${suffix}`,
    actor,
    occurredAt: "2026-08-06T00:10:00.000Z",
    customerIdentityId,
    loyaltyNumber,
    issuedAt: new Date("2026-08-06T00:10:00.000Z"),
    createdBy: customerIdentityId,
    generator: new FixedGenerator(value),
    idempotencyKey: `key_qr_${suffix}`,
    requestHash: `hash_qr_${suffix}`,
  });
}

async function readRawOutboxEvents(): Promise<Array<{ eventType: string; payload: unknown }>> {
  const snapshot = await db.collection("outboxEntries").get();
  return snapshot.docs.map((doc) => doc.data()["event"] as { eventType: string; payload: unknown });
}

function stringifyPayloads(events: Array<{ payload: unknown }>): string {
  return JSON.stringify(events.map((e) => e.payload));
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
    "recoveryProofReferences",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("Scenario 1 — Identity Issuance Chain", () => {
  it("produces one identity, one Loyalty Number, one active QR, correct links, expected outbox events, and minimised audit projections", async () => {
    const identity = await seedIdentity("cust_s1", "s1");
    expect(identity.status).toBe("active");

    const assignment = await issueLoyaltyNumber("cust_s1", "s1", "ABC234");
    expect(assignment.loyaltyNumber).toBe("ABC234");
    expect(assignment.customerIdentityId).toBe("cust_s1");

    const qr = await issueQrIdentity("cust_s1", "ABC234", "s1", "qr_ref_s1");
    expect(qr.qrReference).toBe("qr_ref_s1");
    expect(qr.customerIdentityId).toBe("cust_s1");
    expect(qr.loyaltyNumber).toBe("ABC234");

    // One Customer Identity ID, one Loyalty Number, one active QR — no duplicates.
    const usersSnapshot = await db.collection("users").get();
    expect(usersSnapshot.docs).toHaveLength(1);
    const loyaltyNumbersSnapshot = await db.collection("loyaltyNumbers").get();
    expect(loyaltyNumbersSnapshot.docs).toHaveLength(1);
    const qrRecordsSnapshot = await db.collection("qrIdentityRecords").get();
    expect(qrRecordsSnapshot.docs).toHaveLength(1);
    expect(qrRecordsSnapshot.docs[0]?.data()["status"]).toBe("active");

    // Correct ownership links, resolvable through every public lookup route.
    const byId = await lookupCustomerIdentityById(db, {
      ...envelope("s1_lookup_id"),
      customerIdentityId: "cust_s1",
      purpose: "internal_service",
    });
    expect(byId.customerIdentityId).toBe("cust_s1");

    const byLoyaltyNumber = await lookupCustomerIdentityByLoyaltyNumber(db, {
      ...envelope("s1_lookup_ln"),
      loyaltyNumber: "ABC234",
      purpose: "internal_service",
    });
    expect(byLoyaltyNumber.customerIdentityId).toBe("cust_s1");

    const byQr = await lookupCustomerIdentityByQrReference(db, {
      ...envelope("s1_lookup_qr"),
      qrReference: "qr_ref_s1",
      purpose: "internal_service",
    });
    expect(byQr.customerIdentityId).toBe("cust_s1");

    // Expected outbox events: identity registered, loyalty number issued, QR issued.
    const rawEvents = await readRawOutboxEvents();
    const eventTypes = rawEvents.map((e) => e.eventType);
    expect(eventTypes.some((t) => t.includes("customer_identity_registered"))).toBe(true);
    expect(eventTypes.some((t) => t.includes("loyalty_number_issued"))).toBe(true);
    expect(eventTypes.some((t) => t.includes("qr_identity_issued"))).toBe(true);

    // Raw internal outbox evidence retains the real values, unchanged.
    expect(stringifyPayloads(rawEvents)).toContain("ABC234");
    expect(stringifyPayloads(rawEvents)).toContain("qr_ref_s1");

    // Audit queries expose minimised payloads: the settled identifiers
    // are deliberately never returned by the query projection.
    const auditResult = await queryAuditRecordsByCustomerIdentityId(
      db,
      "cust_s1",
      "internal_service",
    );
    expect(auditResult.records.length).toBeGreaterThan(0);
    const auditPayloadsJson = JSON.stringify(auditResult.records.map((r) => r.payload));
    expect(auditPayloadsJson).not.toContain("ABC234");
    expect(auditPayloadsJson).not.toContain("qr_ref_s1");
  });
});

describe("Scenario 2 — Cross-Package Idempotent Replay", () => {
  it("replays the full issuance chain with the same idempotency keys and produces no duplicates", async () => {
    await seedIdentity("cust_s2", "s2");
    const firstLn = await issueLoyaltyNumber("cust_s2", "s2", "DEF345");
    const firstQr = await issueQrIdentity("cust_s2", "DEF345", "s2", "qr_ref_s2");

    const beforeReplay = {
      users: (await db.collection("users").get()).docs.length,
      loyaltyNumbers: (await db.collection("loyaltyNumbers").get()).docs.length,
      qrRecords: (await db.collection("qrIdentityRecords").get()).docs.length,
      outbox: (await db.collection("outboxEntries").get()).docs.length,
    };

    // Replay the SAME governed commands with the SAME idempotency keys —
    // no single composite command exists across these three packages, so
    // this exercises idempotent replay across the actual package
    // commands in their governed sequence, per the task's own guidance.
    const secondIdentity = await seedIdentity("cust_s2", "s2");
    const secondLn = await issueLoyaltyNumber("cust_s2", "s2", "DEF345");
    const secondQr = await issueQrIdentity("cust_s2", "DEF345", "s2", "qr_ref_s2");

    expect(secondIdentity.id).toBe("cust_s2");
    expect(secondLn).toEqual(firstLn);
    expect(secondQr).toEqual(firstQr);

    const afterReplay = {
      users: (await db.collection("users").get()).docs.length,
      loyaltyNumbers: (await db.collection("loyaltyNumbers").get()).docs.length,
      qrRecords: (await db.collection("qrIdentityRecords").get()).docs.length,
      outbox: (await db.collection("outboxEntries").get()).docs.length,
    };
    expect(afterReplay).toEqual(beforeReplay);

    // Creation metadata is unchanged across replay.
    const loyaltyDoc = await db.collection("loyaltyNumbers").doc("DEF345").get();
    const qrDoc = await db.collection("qrIdentityRecords").doc("qr_ref_s2").get();
    expect(loyaltyDoc.data()?.["createdAt"]).toBeDefined();
    expect(qrDoc.data()?.["createdAt"]).toBeDefined();
  });
});

describe("Scenario 3 — QR Regeneration and Lookup", () => {
  it("regenerates the active QR, invalidates the old reference, and keeps identity/Loyalty Number stable", async () => {
    await seedIdentity("cust_s3", "s3");
    await issueLoyaltyNumber("cust_s3", "s3", "GHJ456");
    await issueQrIdentity("cust_s3", "GHJ456", "s3", "qr_ref_s3_old");

    // 1. Existing active QR resolves.
    const resolvedOld = await getActiveQrIdentityByReference(db, "qr_ref_s3_old");
    expect(resolvedOld.customerIdentityId).toBe("cust_s3");

    await regenerateQrIdentityForIdentity(db, {
      eventId: "evt_qr_s3_regen",
      correlationId: "corr_qr_s3_regen",
      actor,
      occurredAt: "2026-08-06T00:15:00.000Z",
      customerIdentityId: "cust_s3",
      regeneratedAt: new Date("2026-08-06T00:15:00.000Z"),
      createdBy: "cust_s3",
      generator: new FixedGenerator("qr_ref_s3_new"),
      idempotencyKey: "key_qr_s3_regen",
      requestHash: "hash_qr_s3_regen",
    });

    // 2/3. Old reference invalidated and still stored (not deleted).
    const oldDoc = await db.collection("qrIdentityRecords").doc("qr_ref_s3_old").get();
    expect(oldDoc.exists).toBe(true);
    expect(oldDoc.data()?.["status"]).toBe("invalidated");

    // 4. New reference active.
    const newDoc = await db.collection("qrIdentityRecords").doc("qr_ref_s3_new").get();
    expect(newDoc.exists).toBe(true);
    expect(newDoc.data()?.["status"]).toBe("active");

    // 5/6. Customer Identity ID and Loyalty Number unchanged.
    const identity = await getCustomerIdentityById(db, "cust_s3");
    expect(identity.id).toBe("cust_s3");
    const loyaltyAssignment = await getLoyaltyNumberAssignmentForIdentity(db, "cust_s3");
    expect(loyaltyAssignment?.loyaltyNumber).toBe("GHJ456");

    // 7. Active lookup resolves the new reference.
    const activeLookup = await lookupCustomerIdentityByQrReference(db, {
      ...envelope("s3_active"),
      qrReference: "qr_ref_s3_new",
      purpose: "internal_service",
    });
    expect(activeLookup.customerIdentityId).toBe("cust_s3");

    // 8. Old-reference lookup fails closed.
    await expect(
      lookupCustomerIdentityByQrReference(db, {
        ...envelope("s3_old"),
        qrReference: "qr_ref_s3_old",
        purpose: "internal_service",
      }),
    ).rejects.toThrow(IdentityDomainError);
    await expect(getActiveQrIdentityByReference(db, "qr_ref_s3_old")).rejects.toThrow(
      QrIdentityDomainError,
    );

    // 9. Audit query exposes no raw old or new QR reference.
    const auditResult = await queryAuditRecordsByCustomerIdentityId(
      db,
      "cust_s3",
      "internal_service",
    );
    const auditPayloadsJson = JSON.stringify(auditResult.records.map((r) => r.payload));
    expect(auditPayloadsJson).not.toContain("qr_ref_s3_old");
    expect(auditPayloadsJson).not.toContain("qr_ref_s3_new");

    // 10. Retry (idempotent replay) does not create a third reference.
    await regenerateQrIdentityForIdentity(db, {
      eventId: "evt_qr_s3_regen",
      correlationId: "corr_qr_s3_regen",
      actor,
      occurredAt: "2026-08-06T00:15:00.000Z",
      customerIdentityId: "cust_s3",
      regeneratedAt: new Date("2026-08-06T00:15:00.000Z"),
      createdBy: "cust_s3",
      generator: new FixedGenerator("qr_ref_s3_new"),
      idempotencyKey: "key_qr_s3_regen",
      requestHash: "hash_qr_s3_regen",
    });
    const allQrDocsSnapshot = await db.collection("qrIdentityRecords").get();
    expect(allQrDocsSnapshot.docs).toHaveLength(2);
  });
});

describe("Scenario 4 — Lifecycle Transition and Audit", () => {
  it("persists an ordinary transition atomically, projects it minimised, and rejects duplicate/stale transitions", async () => {
    await seedIdentity("cust_s4", "s4");

    const suspended = await transitionCustomerIdentityStatus(db, {
      eventId: "evt_s4_suspend",
      correlationId: "corr_s4_suspend",
      actor,
      occurredAt: "2026-08-06T00:20:00.000Z",
      customerIdentityId: "cust_s4",
      toStatus: "suspended",
      authority: "administrator_initiated",
      reason: "administrative_suspension",
      updatedAt: new Date("2026-08-06T00:20:00.000Z"),
      updatedBy: "admin_1",
      idempotencyKey: "key_s4_suspend",
      requestHash: "hash_s4_suspend",
    });
    expect(suspended.status).toBe("suspended");

    const userDoc = await db.collection("users").doc("cust_s4").get();
    expect(userDoc.data()?.["status"]).toBe("suspended");
    expect(userDoc.data()?.["updatedAt"]).toBeDefined();

    const outboxAfterFirst = await readRawOutboxEvents();
    expect(
      outboxAfterFirst.filter((e) => e.eventType.includes("customer_identity_suspended")),
    ).toHaveLength(1);

    // Idempotent replay creates no duplicate event.
    await transitionCustomerIdentityStatus(db, {
      eventId: "evt_s4_suspend",
      correlationId: "corr_s4_suspend",
      actor,
      occurredAt: "2026-08-06T00:20:00.000Z",
      customerIdentityId: "cust_s4",
      toStatus: "suspended",
      authority: "administrator_initiated",
      reason: "administrative_suspension",
      updatedAt: new Date("2026-08-06T00:20:00.000Z"),
      updatedBy: "admin_1",
      idempotencyKey: "key_s4_suspend",
      requestHash: "hash_s4_suspend",
    });
    const outboxAfterReplay = await readRawOutboxEvents();
    expect(
      outboxAfterReplay.filter((e) => e.eventType.includes("customer_identity_suspended")),
    ).toHaveLength(1);

    // Audit query returns the privacy-minimised event.
    const auditResult = await queryAuditRecordsByEventType(
      db,
      "identity.customer_identity_suspended.v1",
      "internal_service",
    );
    expect(auditResult.records.length).toBeGreaterThan(0);

    // Terminal transition (closed -> archived is the only governed
    // terminal step) — take the identity to closed, then archived.
    await transitionCustomerIdentityStatus(db, {
      eventId: "evt_s4_close",
      correlationId: "corr_s4_close",
      actor,
      occurredAt: "2026-08-06T00:25:00.000Z",
      customerIdentityId: "cust_s4",
      toStatus: "closed",
      expectedCurrentStatus: "suspended",
      authority: "customer_initiated",
      reason: "customer_request",
      updatedAt: new Date("2026-08-06T00:25:00.000Z"),
      updatedBy: "cust_s4",
      idempotencyKey: "key_s4_close",
      requestHash: "hash_s4_close",
    });
    const archived = await transitionCustomerIdentityStatus(db, {
      eventId: "evt_s4_archive",
      correlationId: "corr_s4_archive",
      actor,
      occurredAt: "2026-08-06T00:30:00.000Z",
      customerIdentityId: "cust_s4",
      toStatus: "archived",
      expectedCurrentStatus: "closed",
      authority: "system_initiated",
      reason: "archival_retention_completion",
      updatedAt: new Date("2026-08-06T00:30:00.000Z"),
      updatedBy: null,
      idempotencyKey: "key_s4_archive",
      requestHash: "hash_s4_archive",
    });
    expect(archived.status).toBe("archived");

    // Stale transition fails without partial writes.
    const beforeStale = await db.collection("users").doc("cust_s4").get();
    await expect(
      transitionCustomerIdentityStatus(db, {
        eventId: "evt_s4_stale",
        correlationId: "corr_s4_stale",
        actor,
        occurredAt: "2026-08-06T00:35:00.000Z",
        customerIdentityId: "cust_s4",
        toStatus: "active",
        expectedCurrentStatus: "suspended",
        authority: "customer_initiated",
        reason: "customer_request",
        updatedAt: new Date("2026-08-06T00:35:00.000Z"),
        updatedBy: "cust_s4",
        idempotencyKey: "key_s4_stale",
        requestHash: "hash_s4_stale",
      }),
    ).rejects.toThrow(IdentityDomainError);
    const afterStale = await db.collection("users").doc("cust_s4").get();
    expect(afterStale.data()?.["status"]).toBe(beforeStale.data()?.["status"]);
    expect(afterStale.data()?.["updatedAt"]).toEqual(beforeStale.data()?.["updatedAt"]);
  });
});

describe("Scenario 5 — Recovery Integration", () => {
  function buildRecoveryProof(
    targetCustomerIdentityId: string,
    proofReference: string,
  ): RecoveryProof {
    return {
      result: "accepted",
      methodCategory: "support_assisted",
      proofReference,
      authority: "support_initiated",
      completedAt: new Date("2026-08-06T00:45:00.000Z"),
      targetCustomerIdentityId,
    };
  }

  it("recovers a suspended identity resolved by Loyalty Number, preserving identity/LN/QR/AuthRefs and reserving the proof exactly once", async () => {
    await seedIdentity("cust_s5", "s5");
    await issueLoyaltyNumber("cust_s5", "s5", "JKL567");
    await issueQrIdentity("cust_s5", "JKL567", "s5", "qr_ref_s5");
    await transitionCustomerIdentityStatus(db, {
      eventId: "evt_s5_suspend",
      correlationId: "corr_s5_suspend",
      actor,
      occurredAt: "2026-08-06T00:40:00.000Z",
      customerIdentityId: "cust_s5",
      toStatus: "suspended",
      authority: "administrator_initiated",
      reason: "administrative_suspension",
      updatedAt: new Date("2026-08-06T00:40:00.000Z"),
      updatedBy: "admin_1",
      idempotencyKey: "key_s5_suspend",
      requestHash: "hash_s5_suspend",
    });

    // Recovery resolved via the Loyalty Number — a real cross-package
    // production boundary (loyaltyNumbers -> identity lifecycle).
    const recovered = await recoverCustomerIdentityByReference(db, {
      eventId: "evt_s5_recover",
      correlationId: "corr_s5_recover",
      actor,
      occurredAt: "2026-08-06T00:50:00.000Z",
      targetReference: { type: "loyalty_number", value: "JKL567" },
      recoveryProof: buildRecoveryProof("cust_s5", "proof_s5"),
      recoveredAt: new Date("2026-08-06T00:50:00.000Z"),
      recoveredBy: "support_1",
      idempotencyKey: "key_s5_recover",
      requestHash: "hash_s5_recover",
    });

    expect(recovered.status).toBe("active");
    expect(recovered.id).toBe("cust_s5");
    expect(recovered.authenticationReferences).toHaveLength(1);

    const loyaltyAssignment = await getLoyaltyNumberAssignmentForIdentity(db, "cust_s5");
    expect(loyaltyAssignment?.loyaltyNumber).toBe("JKL567");
    const qrAssociation = await getActiveQrIdentityByReference(db, "qr_ref_s5");
    expect(qrAssociation.customerIdentityId).toBe("cust_s5");

    // Proof reserved exactly once.
    const proofDoc = await db.collection("recoveryProofReferences").doc("proof_s5").get();
    expect(proofDoc.exists).toBe(true);
    const allProofDocs = await db.collection("recoveryProofReferences").get();
    expect(allProofDocs.docs).toHaveLength(1);

    // Event/outbox evidence created once.
    const outboxEvents = await readRawOutboxEvents();
    expect(outboxEvents.filter((e) => e.eventType.includes("identity_recovered"))).toHaveLength(1);

    // Audit query omits the raw proof reference.
    const auditResult = await queryAuditRecordsByCustomerIdentityId(
      db,
      "cust_s5",
      "internal_service",
    );
    const auditPayloadsJson = JSON.stringify(auditResult.records.map((r) => r.payload));
    expect(auditPayloadsJson).not.toContain("proof_s5");

    // Idempotent replay returns the existing result.
    const replay = await recoverCustomerIdentityByReference(db, {
      eventId: "evt_s5_recover",
      correlationId: "corr_s5_recover",
      actor,
      occurredAt: "2026-08-06T00:50:00.000Z",
      targetReference: { type: "loyalty_number", value: "JKL567" },
      recoveryProof: buildRecoveryProof("cust_s5", "proof_s5"),
      recoveredAt: new Date("2026-08-06T00:50:00.000Z"),
      recoveredBy: "support_1",
      idempotencyKey: "key_s5_recover",
      requestHash: "hash_s5_recover",
    });
    expect(replay.status).toBe("active");
    const outboxAfterReplay = await readRawOutboxEvents();
    expect(
      outboxAfterReplay.filter((e) => e.eventType.includes("identity_recovered")),
    ).toHaveLength(1);
  });

  it("does not consume the proof when recovery fails (identity not recovery-eligible)", async () => {
    await seedIdentity("cust_s5b", "s5b");
    // Identity remains "active" — not recovery-eligible.

    await expect(
      recoverCustomerIdentityByReference(db, {
        eventId: "evt_s5b_recover",
        correlationId: "corr_s5b_recover",
        actor,
        occurredAt: "2026-08-06T00:55:00.000Z",
        targetReference: { type: "customer_identity_id", value: "cust_s5b" },
        recoveryProof: buildRecoveryProof("cust_s5b", "proof_s5b"),
        recoveredAt: new Date("2026-08-06T00:55:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_s5b_recover",
        requestHash: "hash_s5b_recover",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const proofDoc = await db.collection("recoveryProofReferences").doc("proof_s5b").get();
    expect(proofDoc.exists).toBe(false);
  });
});

describe("Scenario 6 — Authentication Reference Linking and Lookup", () => {
  it("links, resolves, unlinks preserving history, relinks same-identity, and fails closed on cross-identity relink", async () => {
    await seedIdentity("cust_s6a", "s6a");
    await seedIdentity("cust_s6b", "s6b");
    await issueLoyaltyNumber("cust_s6a", "s6a", "MNP678");
    await issueQrIdentity("cust_s6a", "MNP678", "s6a", "qr_ref_s6a");

    // Validated provider-neutral reference links to an existing identity.
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_s6_link",
      correlationId: "corr_s6_link",
      actor,
      occurredAt: "2026-08-06T01:00:00.000Z",
      customerIdentityId: "cust_s6a",
      referenceId: "email_s6a",
      referenceType: "email_verification",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-06T01:00:00.000Z"),
      linkedBy: "cust_s6a",
      idempotencyKey: "key_s6_link",
      requestHash: "hash_s6_link",
    });

    // Active lookup resolves that identity.
    const lookedUp = await lookupCustomerIdentityByAuthenticationReference(db, {
      ...envelope("s6_lookup1"),
      referenceType: "email_verification",
      referenceId: "email_s6a",
      purpose: "authentication",
    });
    expect(lookedUp.customerIdentityId).toBe("cust_s6a");

    // Unlink preserves historical ownership.
    await unlinkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_s6_unlink",
      correlationId: "corr_s6_unlink",
      actor,
      occurredAt: "2026-08-06T01:05:00.000Z",
      customerIdentityId: "cust_s6a",
      referenceId: "email_s6a",
      referenceType: "email_verification",
      authority: "customer_initiated",
      reason: "customer_request",
      unlinkedAt: new Date("2026-08-06T01:05:00.000Z"),
      unlinkedBy: "cust_s6a",
      idempotencyKey: "key_s6_unlink",
      requestHash: "hash_s6_unlink",
    });
    const ownerAfterUnlink = await getActiveAuthenticationReferenceOwner(
      db,
      "email_verification",
      "email_s6a",
    );
    // Unlinked reference no longer resolves as active.
    expect(ownerAfterUnlink).toBeUndefined();
    const rawRecord = await db
      .collection("authenticationReferences")
      .doc("email_verification:email_s6a")
      .get();
    expect(rawRecord.exists).toBe(true);
    expect(rawRecord.data()?.["customerIdentityId"]).toBe("cust_s6a");
    expect(rawRecord.data()?.["status"]).toBe("unlinked");

    // Same-identity relink succeeds.
    const relinked = await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_s6_relink",
      correlationId: "corr_s6_relink",
      actor,
      occurredAt: "2026-08-06T01:10:00.000Z",
      customerIdentityId: "cust_s6a",
      referenceId: "email_s6a",
      referenceType: "email_verification",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-06T01:10:00.000Z"),
      linkedBy: "cust_s6a",
      idempotencyKey: "key_s6_relink",
      requestHash: "hash_s6_relink",
    });
    expect(relinked.id).toBe("cust_s6a");

    // Cross-identity relink fails closed.
    await expect(
      linkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_s6_crosslink",
        correlationId: "corr_s6_crosslink",
        actor,
        occurredAt: "2026-08-06T01:15:00.000Z",
        customerIdentityId: "cust_s6b",
        referenceId: "email_s6a",
        referenceType: "email_verification",
        authority: "customer_initiated",
        reason: "customer_request",
        linkedAt: new Date("2026-08-06T01:15:00.000Z"),
        linkedBy: "cust_s6b",
        idempotencyKey: "key_s6_crosslink",
        requestHash: "hash_s6_crosslink",
      }),
    ).rejects.toThrow(IdentityDomainError);

    // Conflict audit event contains no raw subject reference.
    const conflictAudit = await queryAuditRecordsByEventType(
      db,
      "identity.authentication_reference_conflict_detected.v1",
      "internal_service",
    );
    expect(conflictAudit.records.length).toBeGreaterThan(0);
    const conflictPayloadsJson = JSON.stringify(conflictAudit.records.map((r) => r.payload));
    expect(conflictPayloadsJson).not.toContain("email_s6a");

    // Permanent identity, Loyalty Number, QR references remain unchanged.
    const identity = await getCustomerIdentityById(db, "cust_s6a");
    expect(identity.id).toBe("cust_s6a");
    const loyaltyAssignment = await getLoyaltyNumberAssignmentForIdentity(db, "cust_s6a");
    expect(loyaltyAssignment?.loyaltyNumber).toBe("MNP678");
    const qrAssociation = await getActiveQrIdentityByReference(db, "qr_ref_s6a");
    expect(qrAssociation.customerIdentityId).toBe("cust_s6a");
  });
});

describe("Scenario 7 — Combined Conflict and Rollback (recovery racing with closure)", () => {
  it("resolves a real Firestore-level race between recovery and closure on the same identity with no partial state", async () => {
    await seedIdentity("cust_s7", "s7");
    await transitionCustomerIdentityStatus(db, {
      eventId: "evt_s7_suspend",
      correlationId: "corr_s7_suspend",
      actor,
      occurredAt: "2026-08-06T01:20:00.000Z",
      customerIdentityId: "cust_s7",
      toStatus: "suspended",
      authority: "administrator_initiated",
      reason: "administrative_suspension",
      updatedAt: new Date("2026-08-06T01:20:00.000Z"),
      updatedBy: "admin_1",
      idempotencyKey: "key_s7_suspend",
      requestHash: "hash_s7_suspend",
    });

    const recoveryProof: RecoveryProof = {
      result: "accepted",
      methodCategory: "support_assisted",
      proofReference: "proof_s7",
      authority: "support_initiated",
      completedAt: new Date("2026-08-06T01:25:00.000Z"),
      targetCustomerIdentityId: "cust_s7",
    };

    // Two real, independent repository calls, both targeting the same
    // `users/cust_s7` document, fired concurrently via Promise.all —
    // an actual Firestore-transaction-level race, not simulated.
    const results = await Promise.allSettled([
      recoverCustomerIdentityStatus(db, {
        eventId: "evt_s7_recover",
        correlationId: "corr_s7_recover",
        actor,
        occurredAt: "2026-08-06T01:25:00.000Z",
        customerIdentityId: "cust_s7",
        recoveryProof,
        recoveredAt: new Date("2026-08-06T01:25:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_s7_recover",
        requestHash: "hash_s7_recover",
      }),
      transitionCustomerIdentityStatus(db, {
        eventId: "evt_s7_close",
        correlationId: "corr_s7_close",
        actor,
        occurredAt: "2026-08-06T01:25:00.000Z",
        customerIdentityId: "cust_s7",
        toStatus: "closed",
        expectedCurrentStatus: "suspended",
        authority: "administrator_initiated",
        reason: "administrative_suspension",
        updatedAt: new Date("2026-08-06T01:25:00.000Z"),
        updatedBy: "admin_2",
        idempotencyKey: "key_s7_close",
        requestHash: "hash_s7_close",
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // No partial state: exactly one operation commits.
    expect(fulfilled.length).toBe(1);
    // The other fails with a real, bounded domain error — not a crash.
    expect(rejected.length).toBe(1);
    if (rejected[0]?.status === "rejected") {
      expect(rejected[0].reason).toBeInstanceOf(IdentityDomainError);
    }

    // The final persisted status is exactly one of the two governed
    // outcomes — never a torn/partial state.
    const finalDoc = await db.collection("users").doc("cust_s7").get();
    const finalStatus = finalDoc.data()?.["status"];
    expect(["active", "closed"]).toContain(finalStatus);

    // No duplicate outbox evidence: exactly one status-change event for
    // whichever operation actually won.
    const outboxEvents = await readRawOutboxEvents();
    const statusChangeEvents = outboxEvents.filter(
      (e) =>
        e.eventType.includes("identity_recovered") ||
        e.eventType.includes("customer_identity_closed"),
    );
    expect(statusChangeEvents).toHaveLength(1);

    // Immutable identifiers unchanged.
    const identity = await getCustomerIdentityById(db, "cust_s7");
    expect(identity.id).toBe("cust_s7");
  });
});
