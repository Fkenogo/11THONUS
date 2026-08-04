import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCustomerIdentity, getCustomerIdentityById } from "./customerIdentityRepository";
import { IdentityDomainError } from "../models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "customerIdentityRepositoryEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

function buildParams(customerIdentityId: string, idempotencyKey: string) {
  return {
    eventId: `evt_${idempotencyKey}`,
    correlationId: `corr_${idempotencyKey}`,
    actor,
    occurredAt: "2026-08-04T00:00:00.000Z",
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: `auth_${customerIdentityId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-08-04T00:00:00.000Z"),
      createdBy: customerIdentityId,
    },
    createdAt: new Date("2026-08-04T00:00:00.000Z"),
    createdBy: customerIdentityId,
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
  for (const collection of ["users", "idempotencyRecords", "outboxEntries"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("createCustomerIdentity", () => {
  it("persists a new customer identity to the users collection", async () => {
    const identity = await createCustomerIdentity(db, buildParams("cust_1", "key_1"));

    expect(identity.id).toBe("cust_1");
    expect(identity.status).toBe("active");

    const stored = await db.collection("users").doc("cust_1").get();
    expect(stored.exists).toBe(true);
    expect(stored.data()?.["id"]).toBe("cust_1");
    expect(stored.data()?.["authUid"]).toBeUndefined();
  });

  it("writes an outbox entry for CustomerIdentityRegistered", async () => {
    await createCustomerIdentity(db, buildParams("cust_2", "key_2"));

    const snapshot = await db.collection("outboxEntries").get();
    const events = snapshot.docs.map((doc) => doc.data()["event"]);
    expect(
      events.some((event: { eventType: string }) =>
        event.eventType.includes("customer_identity_registered"),
      ),
    ).toBe(true);
  });

  it("rejects creating a second identity at the same customerIdentityId (defence-in-depth beneath idempotency)", async () => {
    await createCustomerIdentity(db, buildParams("cust_3", "key_3"));

    await expect(createCustomerIdentity(db, buildParams("cust_3", "key_3_b"))).rejects.toThrow(
      IdentityDomainError,
    );
  });

  it("is idempotent: a repeated call with the same idempotency key returns the same identity without a duplicate write", async () => {
    const first = await createCustomerIdentity(db, buildParams("cust_4", "key_4"));
    const second = await createCustomerIdentity(db, buildParams("cust_4", "key_4"));

    expect(second.id).toBe(first.id);

    const snapshot = await db.collection("users").get();
    expect(snapshot.docs).toHaveLength(1);
  });

  it("rolls back the idempotency reservation on failure so a retry with a corrected request can succeed", async () => {
    const badParams = buildParams("", "key_5");
    await expect(createCustomerIdentity(db, badParams)).rejects.toThrow();

    const retryParams = buildParams("cust_5", "key_5");
    const identity = await createCustomerIdentity(db, retryParams);
    expect(identity.id).toBe("cust_5");
  });
});

describe("getCustomerIdentityById", () => {
  it("retrieves a previously persisted identity", async () => {
    await createCustomerIdentity(db, buildParams("cust_6", "key_6"));

    const identity = await getCustomerIdentityById(db, "cust_6");
    expect(identity.id).toBe("cust_6");
  });

  it("fails closed for an unknown customer identity id", async () => {
    await expect(getCustomerIdentityById(db, "does-not-exist")).rejects.toThrow(
      IdentityDomainError,
    );
  });
});
