import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "./customerIdentityRepository";
import {
  transitionCustomerIdentityStatus,
  recoverCustomerIdentityStatus,
} from "./identityLifecycleRepository";
import { IdentityDomainError } from "../models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "identityLifecycleRepositoryEmulatorTest",
);
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

async function seedIdentity(customerIdentityId: string, keySuffix: string) {
  return createCustomerIdentity(db, {
    eventId: `evt_create_${keySuffix}`,
    correlationId: `corr_create_${keySuffix}`,
    actor,
    occurredAt: "2026-08-04T00:00:00.000Z",
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: `authuid_${customerIdentityId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-08-04T00:00:00.000Z"),
      createdBy: customerIdentityId,
    },
    createdAt: new Date("2026-08-04T00:00:00.000Z"),
    createdBy: customerIdentityId,
    idempotencyKey: `create_${keySuffix}`,
    requestHash: `hash_create_${keySuffix}`,
  });
}

function buildTransitionParams(
  customerIdentityId: string,
  toStatus: "dormant" | "suspended" | "locked" | "closed" | "archived" | "active",
  idempotencyKey: string,
  extra: { expectedCurrentStatus?: string } = {},
) {
  return {
    eventId: `evt_${idempotencyKey}`,
    correlationId: `corr_${idempotencyKey}`,
    actor,
    occurredAt: "2026-08-04T01:00:00.000Z",
    customerIdentityId,
    toStatus,
    expectedCurrentStatus: extra.expectedCurrentStatus,
    authority: "administrator_initiated" as const,
    reason: "administrative_suspension" as const,
    updatedAt: new Date("2026-08-04T01:00:00.000Z"),
    updatedBy: "admin_1",
    idempotencyKey,
    requestHash: `hash_${idempotencyKey}`,
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
    "idempotencyRecords",
    "outboxEntries",
    "recoveryProofReferences",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("transitionCustomerIdentityStatus", () => {
  it("applies a valid transition and persists the new status", async () => {
    await seedIdentity("cust_1", "t1");
    const identity = await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_1", "suspended", "key_t1"),
    );
    expect(identity.status).toBe("suspended");

    const doc = await db.collection("users").doc("cust_1").get();
    expect(doc.data()?.["status"]).toBe("suspended");
  });

  it("writes an outbox entry for the transition event", async () => {
    await seedIdentity("cust_2", "t2");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_2", "dormant", "key_t2"),
    );

    const snapshot = await db.collection("outboxEntries").get();
    const events = snapshot.docs.map((doc) => doc.data()["event"]);
    expect(
      events.some((e: { eventType: string }) => e.eventType.includes("identity_became_dormant")),
    ).toBe(true);
  });

  it("carries authority and reason on the outbox event payload, not as raw fields on users/{id} (ENG-P2-001-06 correction, PR #61)", async () => {
    await seedIdentity("cust_11", "t11");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_11", "suspended", "key_t11"),
    );

    const snapshot = await db.collection("outboxEntries").get();
    const dormantEntry = snapshot.docs
      .map((doc) => doc.data()["event"] as { eventType: string; payload: unknown })
      .find((e) => e.eventType.includes("customer_identity_suspended"));
    expect(dormantEntry?.payload).toMatchObject({
      authority: "administrator_initiated",
      reason: "administrative_suspension",
    });

    const doc = await db.collection("users").doc("cust_11").get();
    expect(doc.data()).not.toHaveProperty("lastTransitionAuthority");
    expect(doc.data()).not.toHaveProperty("lastTransitionReason");
  });

  it("rejects an illegal transition (active -> archived)", async () => {
    await seedIdentity("cust_3", "t3");
    await expect(
      transitionCustomerIdentityStatus(db, buildTransitionParams("cust_3", "archived", "key_t3")),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects a stale expected-status assumption", async () => {
    await seedIdentity("cust_4", "t4");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_4", "suspended", "key_t4a"),
    );

    await expect(
      transitionCustomerIdentityStatus(
        db,
        buildTransitionParams("cust_4", "active", "key_t4b", { expectedCurrentStatus: "active" }),
      ),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("is idempotent: a repeated call with the same idempotency key does not apply a second transition", async () => {
    await seedIdentity("cust_5", "t5");
    const params = buildTransitionParams("cust_5", "suspended", "key_t5");

    const first = await transitionCustomerIdentityStatus(db, params);
    const second = await transitionCustomerIdentityStatus(db, params);

    expect(second.status).toBe(first.status);

    const outboxSnapshot = await db.collection("outboxEntries").get();
    const suspendedEvents = outboxSnapshot.docs.filter((doc) =>
      (doc.data()["event"] as { eventType: string }).eventType.includes(
        "customer_identity_suspended",
      ),
    );
    expect(suspendedEvents).toHaveLength(1);
  });

  it("supports repeated closure and repeated archival without creating duplicate events", async () => {
    await seedIdentity("cust_6", "t6");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_6", "closed", "key_t6_close"),
    );
    const closeParams = buildTransitionParams("cust_6", "closed", "key_t6_close");
    await expect(transitionCustomerIdentityStatus(db, closeParams)).resolves.toBeDefined();

    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_6", "archived", "key_t6_archive"),
    );
    const archiveParams = buildTransitionParams("cust_6", "archived", "key_t6_archive");
    await expect(transitionCustomerIdentityStatus(db, archiveParams)).resolves.toBeDefined();

    const outboxSnapshot = await db.collection("outboxEntries").get();
    const events = outboxSnapshot.docs.map(
      (doc) => (doc.data()["event"] as { eventType: string }).eventType,
    );
    expect(events.filter((t) => t.includes("customer_identity_closed"))).toHaveLength(1);
    expect(events.filter((t) => t.includes("customer_identity_archived"))).toHaveLength(1);
  });

  it("two concurrent conflicting transitions resolve safely: exactly one wins per idempotency key", async () => {
    await seedIdentity("cust_7", "t7");
    const attempt = () =>
      transitionCustomerIdentityStatus(
        db,
        buildTransitionParams("cust_7", "suspended", "key_t7_race"),
      );

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const doc = await db.collection("users").doc("cust_7").get();
    expect(doc.data()?.["status"]).toBe("suspended");
  });
});

function buildRecoveryProof(
  targetCustomerIdentityId: string,
  overrides: Partial<Parameters<typeof recoverCustomerIdentityStatus>[1]["recoveryProof"]> = {},
) {
  return {
    result: "accepted" as const,
    methodCategory: "support_assisted" as const,
    proofReference: `proof_${targetCustomerIdentityId}`,
    authority: "support_initiated" as const,
    completedAt: new Date("2026-08-04T02:00:00.000Z"),
    targetCustomerIdentityId,
    ...overrides,
  };
}

describe("recoverCustomerIdentityStatus", () => {
  it("restores a suspended identity to active and emits IdentityRecovered", async () => {
    await seedIdentity("cust_8", "r1");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_8", "suspended", "key_r1_s"),
    );

    const identity = await recoverCustomerIdentityStatus(db, {
      eventId: "evt_r1",
      correlationId: "corr_r1",
      actor,
      occurredAt: "2026-08-04T02:00:00.000Z",
      customerIdentityId: "cust_8",
      recoveryProof: buildRecoveryProof("cust_8"),
      recoveredAt: new Date("2026-08-04T02:00:00.000Z"),
      recoveredBy: "support_1",
      idempotencyKey: "key_r1_recover",
      requestHash: "hash_r1_recover",
    });

    expect(identity.status).toBe("active");
    expect(identity.id).toBe("cust_8");
    expect(identity.authenticationReferences).toHaveLength(1);

    const snapshot = await db.collection("outboxEntries").get();
    const events = snapshot.docs.map((doc) => doc.data()["event"]);
    expect(
      events.some((e: { eventType: string }) => e.eventType.includes("identity_recovered")),
    ).toBe(true);

    const recoveredEntry = snapshot.docs
      .map((doc) => doc.data()["event"] as { eventType: string; payload: unknown })
      .find((e) => e.eventType.includes("identity_recovered"));
    expect(recoveredEntry?.payload).toMatchObject({
      authority: "support_initiated",
      reason: "support_recovery",
      resultingStatus: "active",
      recoveryProofReference: "proof_cust_8",
      proofMethodCategory: "support_assisted",
    });

    const userDoc = await db.collection("users").doc("cust_8").get();
    expect(userDoc.data()).not.toHaveProperty("lastTransitionAuthority");
    expect(userDoc.data()).not.toHaveProperty("lastTransitionReason");

    const proofDoc = await db.collection("recoveryProofReferences").doc("proof_cust_8").get();
    expect(proofDoc.exists).toBe(true);
    const proofData = proofDoc.data() ?? {};
    expect(Object.keys(proofData).sort()).toEqual(
      [
        "id",
        "schemaVersion",
        "status",
        "proofReference",
        "customerIdentityId",
        "createdAt",
        "createdBy",
        "updatedAt",
        "updatedBy",
      ].sort(),
    );
    expect(proofData["id"]).toBe("proof_cust_8");
    expect(proofData["schemaVersion"]).toBe(1);
    expect(proofData["status"]).toBe("active");
    expect(proofData["proofReference"]).toBe("proof_cust_8");
    expect(proofData["customerIdentityId"]).toBe("cust_8");
    expect(proofData["createdAt"]).toBeDefined();
    expect(proofData["createdBy"]).toBe("support_1");
    expect(proofData["updatedAt"]).toBeDefined();
    expect(proofData["updatedBy"]).toBe("support_1");
  });

  it("rejects duplicate recovery commands beyond idempotent replay", async () => {
    await seedIdentity("cust_9", "r2");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_9", "locked", "key_r2_l"),
    );

    const params = {
      eventId: "evt_r2",
      correlationId: "corr_r2",
      actor,
      occurredAt: "2026-08-04T02:00:00.000Z",
      customerIdentityId: "cust_9",
      recoveryProof: buildRecoveryProof("cust_9"),
      recoveredAt: new Date("2026-08-04T02:00:00.000Z"),
      recoveredBy: "support_1",
      idempotencyKey: "key_r2_recover",
      requestHash: "hash_r2_recover",
    };

    const first = await recoverCustomerIdentityStatus(db, params);

    const firstProofSnapshot = await db.collection("recoveryProofReferences").get();
    expect(firstProofSnapshot.docs).toHaveLength(1);
    const firstCreatedAt = firstProofSnapshot.docs[0]?.data()["createdAt"];

    const second = await recoverCustomerIdentityStatus(db, params);
    expect(second.status).toBe(first.status);

    const snapshot = await db.collection("outboxEntries").get();
    const events = snapshot.docs.map(
      (doc) => (doc.data()["event"] as { eventType: string }).eventType,
    );
    expect(events.filter((t) => t.includes("identity_recovered"))).toHaveLength(1);

    const secondProofSnapshot = await db.collection("recoveryProofReferences").get();
    expect(secondProofSnapshot.docs).toHaveLength(1);
    expect(secondProofSnapshot.docs[0]?.data()["createdAt"]).toEqual(firstCreatedAt);
  });

  it("rejects recovery for an identity not in a recovery-eligible status", async () => {
    await seedIdentity("cust_10", "r3");

    await expect(
      recoverCustomerIdentityStatus(db, {
        eventId: "evt_r3",
        correlationId: "corr_r3",
        actor,
        occurredAt: "2026-08-04T02:00:00.000Z",
        customerIdentityId: "cust_10",
        recoveryProof: buildRecoveryProof("cust_10"),
        recoveredAt: new Date("2026-08-04T02:00:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_r3_recover",
        requestHash: "hash_r3_recover",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const proofSnapshot = await db.collection("recoveryProofReferences").get();
    expect(proofSnapshot.docs).toHaveLength(0);
  });

  it("rejects a recovery proof issued for a different target identity", async () => {
    await seedIdentity("cust_11", "r4");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_11", "suspended", "key_r4_s"),
    );

    await expect(
      recoverCustomerIdentityStatus(db, {
        eventId: "evt_r4",
        correlationId: "corr_r4",
        actor,
        occurredAt: "2026-08-04T02:00:00.000Z",
        customerIdentityId: "cust_11",
        recoveryProof: buildRecoveryProof("cust_other"),
        recoveredAt: new Date("2026-08-04T02:00:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_r4_recover",
        requestHash: "hash_r4_recover",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects an expired recovery proof", async () => {
    await seedIdentity("cust_12", "r5");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_12", "suspended", "key_r5_s"),
    );

    await expect(
      recoverCustomerIdentityStatus(db, {
        eventId: "evt_r5",
        correlationId: "corr_r5",
        actor,
        occurredAt: "2026-08-04T02:00:00.000Z",
        customerIdentityId: "cust_12",
        recoveryProof: buildRecoveryProof("cust_12", {
          expiresAt: new Date("2026-08-04T01:00:00.000Z"),
        }),
        recoveredAt: new Date("2026-08-04T02:00:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_r5_recover",
        requestHash: "hash_r5_recover",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects a reused recovery proof under a different idempotency key", async () => {
    await seedIdentity("cust_13", "r6");
    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_13", "suspended", "key_r6_s"),
    );

    const proof = buildRecoveryProof("cust_13");

    await recoverCustomerIdentityStatus(db, {
      eventId: "evt_r6a",
      correlationId: "corr_r6a",
      actor,
      occurredAt: "2026-08-04T02:00:00.000Z",
      customerIdentityId: "cust_13",
      recoveryProof: proof,
      recoveredAt: new Date("2026-08-04T02:00:00.000Z"),
      recoveredBy: "support_1",
      idempotencyKey: "key_r6a_recover",
      requestHash: "hash_r6a_recover",
    });

    await transitionCustomerIdentityStatus(
      db,
      buildTransitionParams("cust_13", "suspended", "key_r6_s3", {
        expectedCurrentStatus: "active",
      }),
    );

    await expect(
      recoverCustomerIdentityStatus(db, {
        eventId: "evt_r6b",
        correlationId: "corr_r6b",
        actor,
        occurredAt: "2026-08-04T03:00:00.000Z",
        customerIdentityId: "cust_13",
        recoveryProof: proof,
        recoveredAt: new Date("2026-08-04T03:00:00.000Z"),
        recoveredBy: "support_1",
        idempotencyKey: "key_r6b_recover",
        requestHash: "hash_r6b_recover",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });
});
