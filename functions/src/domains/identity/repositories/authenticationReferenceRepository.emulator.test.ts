import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity } from "./customerIdentityRepository";
import {
  linkAuthenticationReferenceForIdentity,
  unlinkAuthenticationReferenceForIdentity,
} from "./authenticationReferenceRepository";
import { IdentityDomainError } from "../models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "authenticationReferenceRepositoryEmulatorTest",
);
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

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
    "authenticationReferences",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("linkAuthenticationReferenceForIdentity", () => {
  it("links a new reference and creates the authoritative uniqueness record", async () => {
    await seedIdentity("cust_1", "b1");

    const identity = await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b1_link",
      correlationId: "corr_b1_link",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_1",
      referenceId: "google_sub_1",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_1",
      idempotencyKey: "key_b1_link",
      requestHash: "hash_b1_link",
    });

    expect(identity.authenticationReferences).toHaveLength(2);

    const authRefSnap = await db
      .collection("authenticationReferences")
      .doc("google_sign_in:google_sub_1")
      .get();
    expect(authRefSnap.exists).toBe(true);
    expect(authRefSnap.data()?.["customerIdentityId"]).toBe("cust_1");
    expect(authRefSnap.data()?.["status"]).toBe("linked");
  });

  it("is idempotent on retry with the same idempotency key (no duplicate reference added)", async () => {
    await seedIdentity("cust_2", "b2");

    const params = {
      eventId: "evt_b2_link",
      correlationId: "corr_b2_link",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_2",
      referenceId: "google_sub_2",
      referenceType: "google_sign_in" as const,
      authority: "customer_initiated" as const,
      reason: "customer_request" as const,
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_2",
      idempotencyKey: "key_b2_link",
      requestHash: "hash_b2_link",
    };

    const first = await linkAuthenticationReferenceForIdentity(db, params);
    const second = await linkAuthenticationReferenceForIdentity(db, params);

    expect(first.authenticationReferences).toHaveLength(2);
    expect(second.authenticationReferences).toHaveLength(2);
  });

  it("rejects linking a reference already active on the same identity", async () => {
    await seedIdentity("cust_3", "b3");

    await expect(
      linkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_b3_link",
        correlationId: "corr_b3_link",
        actor,
        occurredAt: "2026-08-05T01:00:00.000Z",
        customerIdentityId: "cust_3",
        referenceId: "authuid_cust_3",
        referenceType: "phone_otp",
        authority: "customer_initiated",
        reason: "customer_request",
        linkedAt: new Date("2026-08-05T01:00:00.000Z"),
        linkedBy: "cust_3",
        idempotencyKey: "key_b3_link",
        requestHash: "hash_b3_link",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("fails closed on a cross-identity conflict and records privacy-safe audit evidence", async () => {
    await seedIdentity("cust_4a", "b4a");
    await seedIdentity("cust_4b", "b4b");

    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b4_link_first",
      correlationId: "corr_b4_link_first",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_4a",
      referenceId: "google_sub_shared",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_4a",
      idempotencyKey: "key_b4_link_first",
      requestHash: "hash_b4_link_first",
    });

    await expect(
      linkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_b4_link_second",
        correlationId: "corr_b4_link_second",
        actor,
        occurredAt: "2026-08-05T01:05:00.000Z",
        customerIdentityId: "cust_4b",
        referenceId: "google_sub_shared",
        referenceType: "google_sign_in",
        authority: "customer_initiated",
        reason: "customer_request",
        linkedAt: new Date("2026-08-05T01:05:00.000Z"),
        linkedBy: "cust_4b",
        idempotencyKey: "key_b4_link_second",
        requestHash: "hash_b4_link_second",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const authRefSnap = await db
      .collection("authenticationReferences")
      .doc("google_sign_in:google_sub_shared")
      .get();
    expect(authRefSnap.data()?.["customerIdentityId"]).toBe("cust_4a");

    const outboxSnap = await db.collection("outboxEntries").doc("evt_b4_link_second").get();
    expect(outboxSnap.exists).toBe(true);
    const payload = (outboxSnap.data() as { event: { eventType: string; payload: object } }).event;
    expect(payload.eventType).toBe("identity.authentication_reference_conflict_detected.v1");
    const keys = Object.keys(payload.payload).map((k) => k.toLowerCase());
    for (const forbidden of ["owner", "referenceid"]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("rejects linking against an unknown customer identity", async () => {
    await expect(
      linkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_b5_link",
        correlationId: "corr_b5_link",
        actor,
        occurredAt: "2026-08-05T01:00:00.000Z",
        customerIdentityId: "cust_missing",
        referenceId: "google_sub_5",
        referenceType: "google_sign_in",
        authority: "customer_initiated",
        reason: "customer_request",
        linkedAt: new Date("2026-08-05T01:00:00.000Z"),
        linkedBy: "cust_missing",
        idempotencyKey: "key_b5_link",
        requestHash: "hash_b5_link",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const authRefSnap = await db
      .collection("authenticationReferences")
      .doc("google_sign_in:google_sub_5")
      .get();
    expect(authRefSnap.exists).toBe(false);
  });

  it("permits the same identity to re-link a reference it previously unlinked", async () => {
    await seedIdentity("cust_6", "b6");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b6_link",
      correlationId: "corr_b6_link",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_6",
      referenceId: "google_sub_6",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_6",
      idempotencyKey: "key_b6_link",
      requestHash: "hash_b6_link",
    });
    await unlinkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b6_unlink",
      correlationId: "corr_b6_unlink",
      actor,
      occurredAt: "2026-08-05T01:10:00.000Z",
      customerIdentityId: "cust_6",
      referenceId: "google_sub_6",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      unlinkedAt: new Date("2026-08-05T01:10:00.000Z"),
      unlinkedBy: "cust_6",
      idempotencyKey: "key_b6_unlink",
      requestHash: "hash_b6_unlink",
    });

    const identity = await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b6_relink",
      correlationId: "corr_b6_relink",
      actor,
      occurredAt: "2026-08-05T01:20:00.000Z",
      customerIdentityId: "cust_6",
      referenceId: "google_sub_6",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:20:00.000Z"),
      linkedBy: "cust_6",
      idempotencyKey: "key_b6_relink",
      requestHash: "hash_b6_relink",
    });

    expect(
      identity.authenticationReferences.some((ref) => ref.referenceId === "google_sub_6"),
    ).toBe(true);
  });

  it("resolves exactly one winner when two identities race to link the same reference concurrently", async () => {
    await seedIdentity("cust_7a", "b7a");
    await seedIdentity("cust_7b", "b7b");

    const attempt = (customerIdentityId: string, suffix: string) =>
      linkAuthenticationReferenceForIdentity(db, {
        eventId: `evt_b7_${suffix}`,
        correlationId: `corr_b7_${suffix}`,
        actor,
        occurredAt: "2026-08-05T01:00:00.000Z",
        customerIdentityId,
        referenceId: "google_sub_race",
        referenceType: "google_sign_in",
        authority: "customer_initiated",
        reason: "customer_request",
        linkedAt: new Date("2026-08-05T01:00:00.000Z"),
        linkedBy: customerIdentityId,
        idempotencyKey: `key_b7_${suffix}`,
        requestHash: `hash_b7_${suffix}`,
      });

    const results = await Promise.allSettled([
      attempt("cust_7a", "race_a"),
      attempt("cust_7b", "race_b"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const authRefSnap = await db
      .collection("authenticationReferences")
      .doc("google_sign_in:google_sub_race")
      .get();
    expect(["cust_7a", "cust_7b"]).toContain(authRefSnap.data()?.["customerIdentityId"]);
  });

  it("links two different providers to the same identity concurrently without losing either", async () => {
    await seedIdentity("cust_8", "b8");

    const attempt = (referenceType: "google_sign_in" | "email", suffix: string) =>
      linkAuthenticationReferenceForIdentity(db, {
        eventId: `evt_b8_${suffix}`,
        correlationId: `corr_b8_${suffix}`,
        actor,
        occurredAt: "2026-08-05T01:00:00.000Z",
        customerIdentityId: "cust_8",
        referenceId: `ref_b8_${suffix}`,
        referenceType,
        authority: "customer_initiated",
        reason: "customer_request",
        linkedAt: new Date("2026-08-05T01:00:00.000Z"),
        linkedBy: "cust_8",
        idempotencyKey: `key_b8_${suffix}`,
        requestHash: `hash_b8_${suffix}`,
      });

    await Promise.all([attempt("google_sign_in", "g"), attempt("email", "e")]);

    const identitySnap = await db.collection("users").doc("cust_8").get();
    const refs = identitySnap.data()?.["authenticationReferences"] as unknown[];
    expect(refs).toHaveLength(3);
  });
});

describe("unlinkAuthenticationReferenceForIdentity", () => {
  it("unlinks a reference and preserves its history on the authoritative record", async () => {
    await seedIdentity("cust_9", "b9");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b9_link",
      correlationId: "corr_b9_link",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_9",
      referenceId: "google_sub_9",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_9",
      idempotencyKey: "key_b9_link",
      requestHash: "hash_b9_link",
    });

    const identity = await unlinkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b9_unlink",
      correlationId: "corr_b9_unlink",
      actor,
      occurredAt: "2026-08-05T01:10:00.000Z",
      customerIdentityId: "cust_9",
      referenceId: "google_sub_9",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      unlinkedAt: new Date("2026-08-05T01:10:00.000Z"),
      unlinkedBy: "cust_9",
      idempotencyKey: "key_b9_unlink",
      requestHash: "hash_b9_unlink",
    });

    expect(identity.authenticationReferences).toHaveLength(1);

    const authRefSnap = await db
      .collection("authenticationReferences")
      .doc("google_sign_in:google_sub_9")
      .get();
    expect(authRefSnap.data()?.["status"]).toBe("unlinked");
    expect(authRefSnap.data()?.["unlinkedAt"]).toBeTruthy();
  });

  it("is idempotent on retry with the same idempotency key", async () => {
    await seedIdentity("cust_10", "b10");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b10_link",
      correlationId: "corr_b10_link",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_10",
      referenceId: "google_sub_10",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_10",
      idempotencyKey: "key_b10_link",
      requestHash: "hash_b10_link",
    });

    const params = {
      eventId: "evt_b10_unlink",
      correlationId: "corr_b10_unlink",
      actor,
      occurredAt: "2026-08-05T01:10:00.000Z",
      customerIdentityId: "cust_10",
      referenceId: "google_sub_10",
      referenceType: "google_sign_in" as const,
      authority: "customer_initiated" as const,
      reason: "customer_request" as const,
      unlinkedAt: new Date("2026-08-05T01:10:00.000Z"),
      unlinkedBy: "cust_10",
      idempotencyKey: "key_b10_unlink",
      requestHash: "hash_b10_unlink",
    };

    const first = await unlinkAuthenticationReferenceForIdentity(db, params);
    const second = await unlinkAuthenticationReferenceForIdentity(db, params);

    expect(first.authenticationReferences).toHaveLength(1);
    expect(second.authenticationReferences).toHaveLength(1);
  });

  it("rejects unlinking the last remaining authentication reference", async () => {
    await seedIdentity("cust_11", "b11");

    await expect(
      unlinkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_b11_unlink",
        correlationId: "corr_b11_unlink",
        actor,
        occurredAt: "2026-08-05T01:10:00.000Z",
        customerIdentityId: "cust_11",
        referenceId: "authuid_cust_11",
        referenceType: "phone_otp",
        authority: "customer_initiated",
        reason: "customer_request",
        unlinkedAt: new Date("2026-08-05T01:10:00.000Z"),
        unlinkedBy: "cust_11",
        idempotencyKey: "key_b11_unlink",
        requestHash: "hash_b11_unlink",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects unlinking a reference that does not exist for that identity", async () => {
    await seedIdentity("cust_12", "b12");

    await expect(
      unlinkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_b12_unlink",
        correlationId: "corr_b12_unlink",
        actor,
        occurredAt: "2026-08-05T01:10:00.000Z",
        customerIdentityId: "cust_12",
        referenceId: "authuid_missing",
        referenceType: "phone_otp",
        authority: "customer_initiated",
        reason: "customer_request",
        unlinkedAt: new Date("2026-08-05T01:10:00.000Z"),
        unlinkedBy: "cust_12",
        idempotencyKey: "key_b12_unlink",
        requestHash: "hash_b12_unlink",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects unlinking a reference owned by a different identity, without revealing ownership", async () => {
    await seedIdentity("cust_13a", "b13a");
    await seedIdentity("cust_13b", "b13b");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b13_link",
      correlationId: "corr_b13_link",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_13a",
      referenceId: "google_sub_13",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_13a",
      idempotencyKey: "key_b13_link",
      requestHash: "hash_b13_link",
    });

    await expect(
      unlinkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_b13_unlink",
        correlationId: "corr_b13_unlink",
        actor,
        occurredAt: "2026-08-05T01:10:00.000Z",
        customerIdentityId: "cust_13b",
        referenceId: "google_sub_13",
        referenceType: "google_sign_in",
        authority: "customer_initiated",
        reason: "customer_request",
        unlinkedAt: new Date("2026-08-05T01:10:00.000Z"),
        unlinkedBy: "cust_13b",
        idempotencyKey: "key_b13_unlink",
        requestHash: "hash_b13_unlink",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rejects unlink when the expected status does not match (stale state)", async () => {
    await seedIdentity("cust_14", "b14");
    await linkAuthenticationReferenceForIdentity(db, {
      eventId: "evt_b14_link",
      correlationId: "corr_b14_link",
      actor,
      occurredAt: "2026-08-05T01:00:00.000Z",
      customerIdentityId: "cust_14",
      referenceId: "google_sub_14",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_request",
      linkedAt: new Date("2026-08-05T01:00:00.000Z"),
      linkedBy: "cust_14",
      idempotencyKey: "key_b14_link",
      requestHash: "hash_b14_link",
    });

    await expect(
      unlinkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_b14_unlink",
        correlationId: "corr_b14_unlink",
        actor,
        occurredAt: "2026-08-05T01:10:00.000Z",
        customerIdentityId: "cust_14",
        referenceId: "google_sub_14",
        referenceType: "google_sign_in",
        authority: "customer_initiated",
        reason: "customer_request",
        unlinkedAt: new Date("2026-08-05T01:10:00.000Z"),
        unlinkedBy: "cust_14",
        idempotencyKey: "key_b14_unlink",
        requestHash: "hash_b14_unlink",
        expectedStatus: "unlinked",
      }),
    ).rejects.toThrow(IdentityDomainError);
  });

  it("rolls back cleanly when the transaction fails partway (no partial authoritative-record mutation)", async () => {
    await seedIdentity("cust_15", "b15");

    await expect(
      unlinkAuthenticationReferenceForIdentity(db, {
        eventId: "evt_b15_unlink",
        correlationId: "corr_b15_unlink",
        actor,
        occurredAt: "2026-08-05T01:10:00.000Z",
        customerIdentityId: "cust_missing_15",
        referenceId: "authuid_cust_15",
        referenceType: "phone_otp",
        authority: "customer_initiated",
        reason: "customer_request",
        unlinkedAt: new Date("2026-08-05T01:10:00.000Z"),
        unlinkedBy: "cust_15",
        idempotencyKey: "key_b15_unlink",
        requestHash: "hash_b15_unlink",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const authRefSnap = await db
      .collection("authenticationReferences")
      .doc("phone_otp:authuid_cust_15")
      .get();
    expect(authRefSnap.exists).toBe(false);
  });
});
