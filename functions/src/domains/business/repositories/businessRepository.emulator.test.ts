import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { bootstrapBusiness, type BootstrapBusinessParams } from "./businessRepository";
import type { CreateBusinessRequest } from "../models/businessBootstrap";
import type { BusinessCodeCandidateGenerator } from "../services/businessCodeGenerator";
import { getBusinessMembershipByUserAndBusiness } from "../../permissions/repositories/businessMembershipRepository";
import { evaluatePermission } from "../../permissions/service/evaluatePermissionService";

// Real Firestore round trip against the Firebase Emulator Suite. Not run as
// part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp({ projectId: "demo-11thonus" }, "businessRepositoryEmulatorTest");
const db = getFirestore(app);

const actor = { actorType: "user" as const, actorId: "cust_owner" };

class SequenceGenerator implements BusinessCodeCandidateGenerator {
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

const baseRequest: CreateBusinessRequest = {
  displayName: "Emulator Cafe",
  primaryCategoryId: "cat_food",
  countryCode: "US",
  currencyCode: "USD",
  timezone: "America/Los_Angeles",
  city: "Springfield",
  contactPhone: "+15550100",
  supportedLanguages: ["en"],
};

function buildParams(
  overrides: Partial<BootstrapBusinessParams> & { idempotencyKey: string; ownerUserId: string },
): BootstrapBusinessParams {
  return {
    correlationId: `corr_${overrides.idempotencyKey}`,
    actor,
    now: new Date("2026-08-17T00:00:00.000Z"),
    newId: () => `evt_${overrides.idempotencyKey}_${Math.random().toString(36).slice(2)}`,
    generator: new SequenceGenerator(["BIZ234567"]),
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
    "businesses",
    "businessBranches",
    "businessMemberships",
    "businessCodeReservations",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("bootstrapBusiness — atomic bootstrap", () => {
  it("commits Business + Branch + Owner membership + businessCode reservation + outbox entry together", async () => {
    const result = await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({ ownerUserId: "cust_1", idempotencyKey: "key_atomic_1" }),
    );

    expect(result.businessCode).toBe("BIZ234567");
    expect(result.status).toBe("draft");

    const business = await db.collection("businesses").doc(result.businessId).get();
    expect(business.exists).toBe(true);
    expect(business.data()?.["ownerUserId"]).toBe("cust_1");
    expect(business.data()?.["businessCode"]).toBe("BIZ234567");
    expect(business.data()?.["status"]).toBe("draft");

    const branch = await db.collection("businessBranches").doc(result.branchId).get();
    expect(branch.exists).toBe(true);
    expect(branch.data()?.["businessId"]).toBe(result.businessId);

    const membershipSnapshot = await db
      .collection("businessMemberships")
      .where("userId", "==", "cust_1")
      .where("businessId", "==", result.businessId)
      .get();
    expect(membershipSnapshot.size).toBe(1);
    expect(membershipSnapshot.docs[0]?.data()["role"]).toBe("owner");
    expect(membershipSnapshot.docs[0]?.data()["status"]).toBe("active");
    expect(membershipSnapshot.docs[0]?.data()["permissions"]).toEqual([]);

    const reservation = await db.collection("businessCodeReservations").doc("BIZ234567").get();
    expect(reservation.exists).toBe(true);
    expect(reservation.data()?.["businessId"]).toBe(result.businessId);

    const outboxSnapshot = await db.collection("outboxEntries").get();
    expect(outboxSnapshot.size).toBe(1);
    const outboxEvent = outboxSnapshot.docs[0]?.data()["event"];
    expect(outboxEvent.eventType).toBe("business.business_created.v1");
    expect(outboxEvent.payload.businessId).toBe(result.businessId);
    expect(outboxEvent.payload.ownerUserId).toBe("cust_1");
    expect(outboxEvent.payload.businessCode).toBe("BIZ234567");
    // Privacy-minimal: no contact details in the event payload.
    expect(outboxEvent.payload.contactPhone).toBeUndefined();
    expect(outboxEvent.payload.contactEmail).toBeUndefined();
  });
});

describe("bootstrapBusiness — idempotency", () => {
  it("replays the original result unchanged on a same-key, same-request retry, creating nothing new", async () => {
    const params = buildParams({ ownerUserId: "cust_2", idempotencyKey: "key_replay_1" });
    const first = await bootstrapBusiness(db, baseRequest, params);
    const second = await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({ ownerUserId: "cust_2", idempotencyKey: "key_replay_1" }),
    );

    expect(second).toEqual(first);

    const businessesSnapshot = await db.collection("businesses").get();
    expect(businessesSnapshot.size).toBe(1);
    const membershipsSnapshot = await db.collection("businessMemberships").get();
    expect(membershipsSnapshot.size).toBe(1);
    const branchesSnapshot = await db.collection("businessBranches").get();
    expect(branchesSnapshot.size).toBe(1);
    const outboxSnapshot = await db.collection("outboxEntries").get();
    expect(outboxSnapshot.size).toBe(1);
  });

  it("rejects a same-key, materially different request as IDEMPOTENCY_CONFLICT", async () => {
    await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({ ownerUserId: "cust_3", idempotencyKey: "key_conflict_1" }),
    );

    await expect(
      bootstrapBusiness(
        db,
        { ...baseRequest, displayName: "A Totally Different Business" },
        buildParams({
          ownerUserId: "cust_3",
          idempotencyKey: "key_conflict_1",
          generator: new SequenceGenerator(["BIZ234568"]),
        }),
      ),
    ).rejects.toMatchObject({ category: "IDEMPOTENCY_CONFLICT" });

    const businessesSnapshot = await db.collection("businesses").get();
    expect(businessesSnapshot.size).toBe(1);
  });

  it("handles concurrent same-key, same-request calls without creating duplicate side effects", async () => {
    const idempotencyKey = "key_concurrent_1";
    const results = await Promise.allSettled([
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId: "cust_4",
          idempotencyKey,
          generator: new SequenceGenerator(["BIZ234569"]),
        }),
      ),
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId: "cust_4",
          idempotencyKey,
          generator: new SequenceGenerator(["BIZ23456A"]),
        }),
      ),
    ]);

    const businessesSnapshot = await db.collection("businesses").get();
    expect(businessesSnapshot.size).toBe(1);
    const membershipsSnapshot = await db.collection("businessMemberships").get();
    expect(membershipsSnapshot.size).toBe(1);
    // At least one settles; a losing concurrent attempt fails closed
    // (in_progress) rather than creating a second Business.
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
  });

  it("does not block the same Customer Identity from creating two different Businesses with different keys", async () => {
    const first = await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({
        ownerUserId: "cust_5",
        idempotencyKey: "key_multi_1",
        generator: new SequenceGenerator(["BIZ23456B"]),
      }),
    );
    const second = await bootstrapBusiness(
      db,
      { ...baseRequest, displayName: "Second Business" },
      buildParams({
        ownerUserId: "cust_5",
        idempotencyKey: "key_multi_2",
        generator: new SequenceGenerator(["BIZ23456C"]),
      }),
    );

    expect(second.businessId).not.toBe(first.businessId);
    const businessesSnapshot = await db
      .collection("businesses")
      .where("ownerUserId", "==", "cust_5")
      .get();
    expect(businessesSnapshot.size).toBe(2);
  });
});

describe("bootstrapBusiness — businessCode collision handling", () => {
  it("retries past a forced collision against a pre-existing reservation and still reserves atomically", async () => {
    await db.collection("businessCodeReservations").doc("BIZ23456D").set({
      businessId: "some-other-business",
      reservedAt: new Date(),
    });

    const result = await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({
        ownerUserId: "cust_6",
        idempotencyKey: "key_collision_1",
        generator: new SequenceGenerator(["BIZ23456D", "BIZ23456E"]),
      }),
    );

    expect(result.businessCode).toBe("BIZ23456E");
  });

  it("issues unique codes to two different customers created concurrently", async () => {
    const [a, b] = await Promise.all([
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId: "cust_7",
          idempotencyKey: "key_unique_a",
          generator: new SequenceGenerator(["BIZ23456F"]),
        }),
      ),
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId: "cust_8",
          idempotencyKey: "key_unique_b",
          generator: new SequenceGenerator(["BIZ23456G"]),
        }),
      ),
    ]);

    expect(a.businessCode).not.toBe(b.businessCode);
  });
});

describe("bootstrapBusiness — partial failure leaves no persistent state", () => {
  it("commits nothing when the transaction callback throws after all reads settle", async () => {
    // Force exhaustion: every candidate the generator offers is pre-reserved.
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const doomedCandidates = Array.from({ length: 5 }, (_, i) => `BIZ23456${alphabet[i]}`);
    await Promise.all(
      doomedCandidates.map((code) =>
        db.collection("businessCodeReservations").doc(code).set({
          businessId: "blocker",
          reservedAt: new Date(),
        }),
      ),
    );

    await expect(
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId: "cust_9",
          idempotencyKey: "key_exhaustion_1",
          generator: new SequenceGenerator(doomedCandidates),
        }),
      ),
    ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });

    const businessesSnapshot = await db
      .collection("businesses")
      .where("ownerUserId", "==", "cust_9")
      .get();
    expect(businessesSnapshot.size).toBe(0);
    const membershipsSnapshot = await db
      .collection("businessMemberships")
      .where("userId", "==", "cust_9")
      .get();
    expect(membershipsSnapshot.size).toBe(0);

    // The idempotency key is left "failed", not "processing" forever — retryable.
    const record = await db.collection("idempotencyRecords").doc("key_exhaustion_1").get();
    expect(record.data()?.["status"]).toBe("failed");
  });
});

describe("bootstrapBusiness — ENG-P2-004 evaluator compatibility (read-only)", () => {
  it("the initial Owner membership is readable and well-formed for the existing evaluator", async () => {
    const result = await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({
        ownerUserId: "cust_10",
        idempotencyKey: "key_evaluator_1",
        generator: new SequenceGenerator(["BIZ23456H"]),
      }),
    );

    const membershipRead = await getBusinessMembershipByUserAndBusiness(
      db,
      "cust_10",
      result.businessId,
    );
    expect(membershipRead.kind).toBe("found");
    if (membershipRead.kind === "found") {
      expect(membershipRead.membership.role).toBe("owner");
      expect(membershipRead.membership.status).toBe("active");
      expect(membershipRead.membership.overrides).toEqual([]);
    }

    // A freshly-bootstrapped Business is `draft` (§6's only initial
    // transition) — the evaluator correctly denies on business-not-active,
    // never on a malformed/not-found membership or business read. This is
    // the designed boundary (Phase V/§10.1): 002B does not special-case a
    // newly-created business, and 002C's lifecycle transitions are the only
    // path to an operational business.
    const decision = await evaluatePermission(db, {
      userId: "cust_10",
      businessId: result.businessId,
      permission: "business.viewSettings",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("BUSINESS_NOT_ACTIVE");
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });
});
