import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  issueLoyaltyNumberForIdentity,
  getLoyaltyNumberAssignmentForIdentity,
} from "./loyaltyNumberRepository";
import type { LoyaltyNumberCandidateGenerator } from "../services/loyaltyNumberGenerator";
import type { EventActor } from "../../../shared/events/domainEvent";

// Real Firestore round trip against the Firebase Emulator Suite. Not run
// as part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "loyaltyNumberRepositoryEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };

class SequenceGenerator implements LoyaltyNumberCandidateGenerator {
  private index = 0;
  constructor(private readonly sequence: string[]) {}
  generateCandidate(): string {
    const value = this.sequence[this.index];
    if (value === undefined) {
      throw new Error("SequenceGenerator exhausted");
    }
    this.index++;
    return value;
  }
}

function buildParams(
  customerIdentityId: string,
  idempotencyKey: string,
  generator: LoyaltyNumberCandidateGenerator,
) {
  return {
    eventId: `evt_${idempotencyKey}`,
    correlationId: `corr_${idempotencyKey}`,
    actor,
    occurredAt: "2026-08-04T00:00:00.000Z",
    customerIdentityId,
    assignedAt: new Date("2026-08-04T00:00:00.000Z"),
    createdBy: customerIdentityId,
    generator,
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
    "loyaltyNumbers",
    "customerProfiles",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("issueLoyaltyNumberForIdentity", () => {
  it("persists a new loyaltyNumbers record and the customerProfiles projection", async () => {
    const assignment = await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_1", "key_1", new SequenceGenerator(["ABC234"])),
    );

    expect(assignment.loyaltyNumber).toBe("ABC234");

    const record = await db.collection("loyaltyNumbers").doc("ABC234").get();
    expect(record.exists).toBe(true);
    expect(record.data()?.["customerIdentityId"]).toBe("cust_1");

    const profile = await db.collection("customerProfiles").doc("cust_1").get();
    expect(profile.exists).toBe(true);
    expect(profile.data()?.["loyaltyNumber"]).toBe("ABC234");
  });

  it("writes an outbox entry for the issuance event", async () => {
    await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_2", "key_2", new SequenceGenerator(["ABD234"])),
    );

    const snapshot = await db.collection("outboxEntries").get();
    const events = snapshot.docs.map((doc) => doc.data()["event"]);
    expect(events.some((event: { eventType: string }) => event.eventType.includes("issued"))).toBe(
      true,
    );
  });

  it("enforces global uniqueness: a colliding candidate is retried until a free one is found", async () => {
    await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_3", "key_3", new SequenceGenerator(["ABE234"])),
    );

    const assignment = await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_4", "key_4", new SequenceGenerator(["ABE234", "ABF234"])),
    );

    expect(assignment.loyaltyNumber).toBe("ABF234");

    const outboxSnapshot = await db.collection("outboxEntries").get();
    const events = outboxSnapshot.docs.map((doc) => doc.data()["event"]);
    expect(
      events.some((event: { eventType: string }) => event.eventType.includes("collision_detected")),
    ).toBe(true);
  });

  it("never recycles a value: the original owner's record is untouched after a collision on the same value", async () => {
    await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_5", "key_5", new SequenceGenerator(["ABG234"])),
    );
    await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_6", "key_6", new SequenceGenerator(["ABG234", "ABH234"])),
    );

    const record = await db.collection("loyaltyNumbers").doc("ABG234").get();
    expect(record.data()?.["customerIdentityId"]).toBe("cust_5");
  });

  it("is idempotent: a repeated call with the same idempotency key does not create a second record", async () => {
    const generator = new SequenceGenerator(["ABM234"]);
    const params = buildParams("cust_7", "key_7", generator);

    const first = await issueLoyaltyNumberForIdentity(db, params);
    const second = await issueLoyaltyNumberForIdentity(db, params);

    expect(second.loyaltyNumber).toBe(first.loyaltyNumber);

    const snapshot = await db.collection("loyaltyNumbers").get();
    expect(snapshot.docs).toHaveLength(1);
  });

  it("repeat issuance for an identity that already has a loyalty number returns the existing assignment without writing a new record", async () => {
    const first = await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_8", "key_8", new SequenceGenerator(["ABJ234"])),
    );

    const second = await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_8", "key_8_retry", new SequenceGenerator(["ABK234"])),
    );

    expect(second.loyaltyNumber).toBe(first.loyaltyNumber);

    const snapshot = await db.collection("loyaltyNumbers").get();
    expect(snapshot.docs).toHaveLength(1);
  });

  it("rolls back cleanly on failure: an exhausted generator leaves no partial write", async () => {
    await expect(
      issueLoyaltyNumberForIdentity(db, buildParams("cust_9", "key_9", new SequenceGenerator([]))),
    ).rejects.toThrow();

    const snapshot = await db.collection("loyaltyNumbers").get();
    expect(snapshot.docs).toHaveLength(0);
  });
});

describe("getLoyaltyNumberAssignmentForIdentity", () => {
  it("retrieves a previously issued assignment", async () => {
    await issueLoyaltyNumberForIdentity(
      db,
      buildParams("cust_10", "key_10", new SequenceGenerator(["ABL234"])),
    );

    const assignment = await getLoyaltyNumberAssignmentForIdentity(db, "cust_10");
    expect(assignment?.loyaltyNumber).toBe("ABL234");
  });

  it("returns undefined for an identity with no issued loyalty number", async () => {
    const assignment = await getLoyaltyNumberAssignmentForIdentity(db, "does-not-exist");
    expect(assignment).toBeUndefined();
  });
});
