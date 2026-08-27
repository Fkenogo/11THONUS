import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readDisplayName, setDisplayName } from "./displayNameRepository";
import { createCustomerIdentity } from "./customerIdentityRepository";
import { IdentityDomainError } from "../models/identityErrors";
import type { EventActor } from "../../../shared/events/domainEvent";

// Real Firestore round trip against the Firebase Emulator Suite
// (FIRESTORE_EMULATOR_HOST, set automatically by `firebase emulators:exec`).
// Not run as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "displayNameRepositoryEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite.",
    );
  }
});

beforeEach(async () => {
  for (const collection of ["users", "idempotencyRecords", "outboxEntries"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

async function seedIdentity(customerIdentityId: string) {
  await createCustomerIdentity(db, {
    eventId: `evt_${customerIdentityId}`,
    correlationId: `corr_${customerIdentityId}`,
    actor,
    occurredAt: "2026-08-27T00:00:00.000Z",
    customerIdentityId,
    initialAuthenticationReference: {
      referenceId: `auth_${customerIdentityId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-08-27T00:00:00.000Z"),
      createdBy: customerIdentityId,
    },
    createdAt: new Date("2026-08-27T00:00:00.000Z"),
    createdBy: customerIdentityId,
    idempotencyKey: `create-${customerIdentityId}`,
    requestHash: `create-hash-${customerIdentityId}`,
  });
}

describe("setDisplayName", () => {
  it("1. sets the Display Name when previously absent", async () => {
    await seedIdentity("cust_1");

    const result = await setDisplayName(db, {
      customerIdentityId: "cust_1",
      displayName: "Fred Kenogo",
      idempotencyKey: "set-1",
      correlationId: "corr-1",
    });

    expect(result.displayName).toBe("Fred Kenogo");
    const stored = await db.collection("users").doc("cust_1").get();
    expect(stored.data()?.["displayName"]).toBe("Fred Kenogo");
  });

  it("2. updates an already-set Display Name", async () => {
    await seedIdentity("cust_2");
    await setDisplayName(db, {
      customerIdentityId: "cust_2",
      displayName: "Old Name",
      idempotencyKey: "set-2a",
      correlationId: "corr-2a",
    });

    const result = await setDisplayName(db, {
      customerIdentityId: "cust_2",
      displayName: "New Name",
      idempotencyKey: "set-2b",
      correlationId: "corr-2b",
    });

    expect(result.displayName).toBe("New Name");
    const stored = await db.collection("users").doc("cust_2").get();
    expect(stored.data()?.["displayName"]).toBe("New Name");
  });

  it("12. two different Customer Identities may share the same Display Name (no uniqueness enforced)", async () => {
    await seedIdentity("cust_3a");
    await seedIdentity("cust_3b");

    await setDisplayName(db, {
      customerIdentityId: "cust_3a",
      displayName: "Same Name",
      idempotencyKey: "set-3a",
      correlationId: "corr-3a",
    });
    await setDisplayName(db, {
      customerIdentityId: "cust_3b",
      displayName: "Same Name",
      idempotencyKey: "set-3b",
      correlationId: "corr-3b",
    });

    const a = await db.collection("users").doc("cust_3a").get();
    const b = await db.collection("users").doc("cust_3b").get();
    expect(a.data()?.["displayName"]).toBe("Same Name");
    expect(b.data()?.["displayName"]).toBe("Same Name");
  });

  it("13. unrelated User fields are preserved by the targeted update", async () => {
    await seedIdentity("cust_4");
    const before = await db.collection("users").doc("cust_4").get();

    await setDisplayName(db, {
      customerIdentityId: "cust_4",
      displayName: "Fred Kenogo",
      idempotencyKey: "set-4",
      correlationId: "corr-4",
    });

    const after = await db.collection("users").doc("cust_4").get();
    expect(after.data()?.["status"]).toBe(before.data()?.["status"]);
    expect(after.data()?.["authenticationReferences"]).toEqual(
      before.data()?.["authenticationReferences"],
    );
    expect(after.data()?.["createdAt"]).toEqual(before.data()?.["createdAt"]);
    expect(after.data()?.["createdBy"]).toBe(before.data()?.["createdBy"]);
  });

  it("rejects an invalid Display Name before ever reserving an idempotency key", async () => {
    await seedIdentity("cust_5");

    await expect(
      setDisplayName(db, {
        customerIdentityId: "cust_5",
        displayName: "   ",
        idempotencyKey: "set-5",
        correlationId: "corr-5",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const idempotencyDoc = await db.collection("idempotencyRecords").doc("set-5").get();
    expect(idempotencyDoc.exists).toBe(false);
  });

  it("18. fails closed for a target Customer Identity that does not exist (malformed/absent target)", async () => {
    await expect(
      setDisplayName(db, {
        customerIdentityId: "does-not-exist",
        displayName: "Fred Kenogo",
        idempotencyKey: "set-6",
        correlationId: "corr-6",
      }),
    ).rejects.toThrow(IdentityDomainError);

    const stored = await db.collection("users").doc("does-not-exist").get();
    expect(stored.exists).toBe(false);
  });

  it("is idempotent: a repeated call with the same idempotency key returns the same result without a second write", async () => {
    await seedIdentity("cust_7");

    const first = await setDisplayName(db, {
      customerIdentityId: "cust_7",
      displayName: "Fred Kenogo",
      idempotencyKey: "set-7",
      correlationId: "corr-7",
    });
    const second = await setDisplayName(db, {
      customerIdentityId: "cust_7",
      displayName: "Fred Kenogo",
      idempotencyKey: "set-7",
      correlationId: "corr-7",
    });

    expect(second).toEqual(first);
  });

  it("rolls back the idempotency reservation on failure so an identical retry (same request) can succeed once the target identity exists", async () => {
    const params = {
      customerIdentityId: "cust_8",
      displayName: "Fred Kenogo",
      idempotencyKey: "set-8",
      correlationId: "corr-8",
    };

    // The target identity doesn't exist yet — fails RESOURCE_NOT_FOUND,
    // and failIdempotencyKey marks the reservation "failed" rather than
    // leaving it stuck "processing".
    await expect(setDisplayName(db, params)).rejects.toThrow();

    await seedIdentity("cust_8");
    // Same idempotency key, same request content (same hash) — a "failed"
    // record is eligible for retry (evaluateIdempotency's own documented
    // "failed" → "new" rule), not treated as a duplicate or conflict.
    const retry = await setDisplayName(db, params);
    expect(retry.displayName).toBe("Fred Kenogo");
  });
});

describe("readDisplayName", () => {
  it("15. returns the existing Display Name", async () => {
    await seedIdentity("cust_9");
    await setDisplayName(db, {
      customerIdentityId: "cust_9",
      displayName: "Fred Kenogo",
      idempotencyKey: "set-9",
      correlationId: "corr-9",
    });

    const result = await readDisplayName(db, "cust_9");
    expect(result.displayName).toBe("Fred Kenogo");
  });

  it("14. represents a missing Display Name as genuinely absent, never a fabricated placeholder", async () => {
    await seedIdentity("cust_10");

    const result = await readDisplayName(db, "cust_10");
    expect(result.displayName).toBeUndefined();
    expect("displayName" in result).toBe(true);
  });

  it("16. never falls back to CustomerProfile or Firebase Auth data — the stored document has no such fields to read", async () => {
    await seedIdentity("cust_11");
    const stored = await db.collection("users").doc("cust_11").get();

    // Structural proof: the seeded `users` document contains no
    // firstName/lastName/authUid/primaryEmail field at all (userDocument.ts
    // never writes them), so readDisplayName has no such data available to
    // fall back to even if it tried.
    expect(stored.data()?.["firstName"]).toBeUndefined();
    expect(stored.data()?.["authUid"]).toBeUndefined();

    const result = await readDisplayName(db, "cust_11");
    expect(result.displayName).toBeUndefined();
  });

  it("cross-user isolation: reading one identity's Display Name never returns another's", async () => {
    await seedIdentity("cust_12a");
    await seedIdentity("cust_12b");
    await setDisplayName(db, {
      customerIdentityId: "cust_12a",
      displayName: "Alice",
      idempotencyKey: "set-12a",
      correlationId: "corr-12a",
    });
    await setDisplayName(db, {
      customerIdentityId: "cust_12b",
      displayName: "Bob",
      idempotencyKey: "set-12b",
      correlationId: "corr-12b",
    });

    expect((await readDisplayName(db, "cust_12a")).displayName).toBe("Alice");
    expect((await readDisplayName(db, "cust_12b")).displayName).toBe("Bob");
  });

  it("18. fails closed for an unknown Customer Identity id", async () => {
    await expect(readDisplayName(db, "does-not-exist")).rejects.toThrow(IdentityDomainError);
  });
});
