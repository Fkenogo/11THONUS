import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bootstrapBusiness,
  stableRequestHash,
  type BootstrapBusinessParams,
} from "./businessRepository";
import type { CreateBusinessRequest } from "../models/businessBootstrap";
import type { BusinessCodeCandidateGenerator } from "../services/businessCodeGenerator";
import { getBusinessMembershipByUserAndBusiness } from "../../permissions/repositories/businessMembershipRepository";
import { evaluatePermission } from "../../permissions/service/evaluatePermissionService";
import {
  createKnowledgeNodePersisted,
  getKnowledgeNodeById,
  transitionKnowledgeNodeStatusPersisted,
} from "../../commerceKnowledge/repositories/knowledgeNodeRepository";

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

beforeAll(async () => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }

  // `ENG-P3-001C`: `baseRequest.primaryCategoryId` must now resolve to a real,
  // active `business_category` KnowledgeNode — seeded once here via the
  // Commerce Knowledge repository's own create/transition functions (test-
  // local ad-hoc fixture, Phase P — never the governed seed manifest).
  // `knowledgeNodes` is not cleared between emulator test *files* (only
  // within-file collections are reset), so this guards against a
  // `duplicateKnowledgeNodeIdError` when another suite already seeded the
  // same well-known fixture id against the one shared emulator Firestore.
  if (!(await getKnowledgeNodeById(db, "cat_food"))) {
    await createKnowledgeNodePersisted(db, {
      id: "ind_test",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Test Industry",
      slug: "test-industry",
      createdAt: new Date("2026-08-17T00:00:00.000Z"),
    });
    await createKnowledgeNodePersisted(db, {
      id: "cat_food",
      nodeType: "business_category",
      parentId: "ind_test",
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: new Date("2026-08-17T00:00:00.000Z"),
    });
    await transitionKnowledgeNodeStatusPersisted(db, "cat_food", "in_review", {
      updatedAt: new Date("2026-08-17T00:00:00.000Z"),
    });
    await transitionKnowledgeNodeStatusPersisted(db, "cat_food", "active", {
      updatedAt: new Date("2026-08-17T00:00:00.000Z"),
    });
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

  it("persists an empty supportedLanguages array exactly as sent, with every other field unaffected (ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001 — the governed creation-time default now sent by NewBusinessPage)", async () => {
    const result = await bootstrapBusiness(
      db,
      { ...baseRequest, supportedLanguages: [] },
      buildParams({
        ownerUserId: "cust_1",
        idempotencyKey: "key_supported_languages_empty",
        generator: new SequenceGenerator(["BIZ234568"]),
      }),
    );

    const business = await db.collection("businesses").doc(result.businessId).get();
    expect(business.data()?.["supportedLanguages"]).toEqual([]);
    // Nothing else about the persisted Business is affected by this field.
    expect(business.data()?.["displayName"]).toBe(baseRequest.displayName);
    expect(business.data()?.["countryCode"]).toBe(baseRequest.countryCode);
    expect(business.data()?.["currencyCode"]).toBe(baseRequest.currencyCode);
    expect(business.data()?.["status"]).toBe("draft");

    const branch = await db.collection("businessBranches").doc(result.branchId).get();
    expect(branch.exists).toBe(true);
    expect(branch.data()?.["businessId"]).toBe(result.businessId);
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
    // At least one settles; a losing concurrent attempt under the same key
    // must fail *retryable* (TEMPORARY_UNAVAILABLE) — never a fail-closed
    // conflict — since the winner is completing the same requested
    // operation, not a genuinely different one
    // (`ENG-P3-002-CORR-EST-IDEMP-001`).
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
    for (const r of results) {
      if (r.status === "rejected") {
        expect(r.reason).toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });
      }
    }
  });

  it("ENG-P3-002-CORR-EST-IDEMP-001: a same-key call observing a concurrent 'processing' reservation fails retryable (TEMPORARY_UNAVAILABLE), never a fail-closed conflict, and creates no Business", async () => {
    // Deterministic reproduction of the Package H race's decisive branch —
    // no reliance on real transaction-timing luck (Phase H: "a timing-
    // sensitive test that merely 'usually passes' is not sufficient closure
    // evidence"). A winning concurrent call's `checkAndReserveIdempotencyKey`
    // is exactly this: a "processing" record already committed under this
    // key/hash before this call's own reservation transaction reads it.
    const idempotencyKey = "key_in_progress_1";
    const ownerUserId = "cust_in_progress";
    const requestHash = stableRequestHash(ownerUserId, baseRequest);
    await db.collection("idempotencyRecords").doc(idempotencyKey).set({
      idempotencyKey,
      operationType: "business.create",
      actorId: ownerUserId,
      requestHash,
      status: "processing",
      createdAt: new Date(),
    });

    await expect(
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId,
          idempotencyKey,
          generator: new SequenceGenerator(["BIZ23456B"]),
        }),
      ),
    ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });

    const businessesSnapshot = await db
      .collection("businesses")
      .where("ownerUserId", "==", ownerUserId)
      .get();
    expect(businessesSnapshot.size).toBe(0);

    // Once the real winner's transaction actually commits (simulated here
    // by transitioning the same record to "completed" with its response),
    // a retry under the SAME key converges on that result — never creates a
    // Business of its own.
    const winningResult = {
      businessId: "biz_winner_1",
      businessCode: "BIZ23456Z",
      branchId: "branch_winner_1",
      status: "draft" as const,
    };
    await db.collection("idempotencyRecords").doc(idempotencyKey).update({
      status: "completed",
      completedAt: new Date(),
      resultReference: winningResult.businessId,
      responseSnapshot: winningResult,
    });

    const retryResult = await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({ ownerUserId, idempotencyKey }),
    );
    expect(retryResult).toEqual(winningResult);

    const businessesAfterRetry = await db
      .collection("businesses")
      .where("ownerUserId", "==", ownerUserId)
      .get();
    expect(businessesAfterRetry.size).toBe(0);
  });

  it("ENG-P3-002-CORR-EST-IDEMP-001-REVIEW: rejects the same key reused by a different resolved owner as IDEMPOTENCY_CONFLICT, never a cross-user cache hit (Phase F/16 cross-user isolation)", async () => {
    const idempotencyKey = "key_cross_owner_1";
    const first = await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({
        ownerUserId: "cust_owner_a",
        idempotencyKey,
        generator: new SequenceGenerator(["BIZ23456D"]),
      }),
    );

    // Same key, identical request body, but a *different* server-resolved
    // owner (never client-supplied — `ownerUserId` always comes from the
    // verified credential). `stableRequestHash` binds `ownerUserId`, so
    // this must be a fail-closed conflict, never a silent replay of
    // `cust_owner_a`'s Business handed back to `cust_owner_b`.
    await expect(
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId: "cust_owner_b",
          idempotencyKey,
          generator: new SequenceGenerator(["BIZ23456E"]),
        }),
      ),
    ).rejects.toMatchObject({ category: "IDEMPOTENCY_CONFLICT" });

    const ownerBBusinesses = await db
      .collection("businesses")
      .where("ownerUserId", "==", "cust_owner_b")
      .get();
    expect(ownerBBusinesses.size).toBe(0);

    const ownerABusinesses = await db
      .collection("businesses")
      .where("ownerUserId", "==", "cust_owner_a")
      .get();
    expect(ownerABusinesses.size).toBe(1);
    expect(ownerABusinesses.docs[0]?.id).toBe(first.businessId);
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

  it("two concurrent bootstraps racing for the exact same first-choice candidate never both claim it", async () => {
    // Both generators offer the *identical* first candidate, forcing a real
    // `transaction.get()`-level race on `businessCodeReservations/{code}`.
    //
    // Firestore's own optimistic concurrency means a transaction whose read
    // is invalidated by a concurrent writer is retried *from scratch* by
    // `db.runTransaction` — re-invoking `reserveBusinessCode` again, which
    // draws the *next* item from the (deliberately stateful, for this test)
    // generator rather than repeating the exact same first candidate. So the
    // one guaranteed, safety-relevant property under real contention is: the
    // contested code is never assigned twice — never that a specific caller
    // is guaranteed to win it (that depends on Firestore's own retry timing,
    // which this test does not control and must not assert on).
    const contestedCode = "BIZ23456H";
    const [a, b] = await Promise.all([
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId: "cust_racer_1",
          idempotencyKey: "key_race_a",
          generator: new SequenceGenerator([contestedCode, "BIZ23456J", "BIZ23456M"]),
        }),
      ),
      bootstrapBusiness(
        db,
        baseRequest,
        buildParams({
          ownerUserId: "cust_racer_2",
          idempotencyKey: "key_race_b",
          generator: new SequenceGenerator([contestedCode, "BIZ23456K", "BIZ23456N"]),
        }),
      ),
    ]);

    // The core safety property: two concurrent callers racing for the same
    // candidate never both end up with it — whatever codes they land on,
    // they are always distinct, and both businesses are created.
    expect(a.businessCode).not.toBe(b.businessCode);
    expect(a.businessId).not.toBe(b.businessId);

    // If the contested code was actually claimed by either side (it may or
    // may not have been, depending on retry timing — see above), its
    // reservation doc correctly attributes exactly the business that holds
    // that code as its `businessCode` — never a mismatched or dangling owner.
    const winner = [a, b].find((result) => result.businessCode === contestedCode);
    if (winner) {
      const reservation = await db.collection("businessCodeReservations").doc(contestedCode).get();
      expect(reservation.exists).toBe(true);
      expect(reservation.data()?.["businessId"]).toBe(winner.businessId);
    }

    const businessesSnapshot = await db
      .collection("businesses")
      .where("ownerUserId", "in", ["cust_racer_1", "cust_racer_2"])
      .get();
    expect(businessesSnapshot.size).toBe(2);
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
    // transition). `business.viewSettings` is not one of the four
    // Founder-approved Ordinary Permission Catalogue entries
    // (`ENG-P2-004-CORR-001`) — it remains an unconfigured/ungoverned
    // permission id, so it is denied on the unknown-permission fail-closed
    // path, never on a malformed/not-found membership or business read.
    //
    // Before `ENG-P2-004-CORR-001`, every permission (governed or not)
    // was denied via the single global `business.status ∈ {trial, active}`
    // gate applied ahead of permission classification — that is what this
    // test originally asserted, and it is exactly the architectural
    // deadlock `CAP-P3-BIZ-AUTH-001` identified (it denied the four
    // ordinary Business-administration permissions too, on the Owner's own
    // freshly-bootstrapped Business). The correction replaced that single
    // gate with a per-permission-class one: an *unconfigured* permission
    // like this one no longer receives any lifecycle gate at all (there is
    // no governed eligibility table for it to consult) and instead denies
    // at the evaluator's existing fail-closed step, `NO_APPLICABLE_GRANT`/
    // `AUTH_FORBIDDEN` — never `BUSINESS_NOT_ACTIVE`/`BUSINESS_INACTIVE`,
    // since that reason code is now reserved for a business-status failure
    // against a *governed* permission's own eligibility set.
    const decision = await evaluatePermission(db, {
      userId: "cust_10",
      businessId: result.businessId,
      permission: "business.viewSettings",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("NO_APPLICABLE_GRANT");
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("business.updateProfile (a governed ordinary permission) is now allowed for the Owner on a freshly-bootstrapped draft Business (ENG-P2-004-CORR-001 — the CAP-P3-BIZ-AUTH-001 deadlock is resolved)", async () => {
    const result = await bootstrapBusiness(
      db,
      baseRequest,
      buildParams({
        ownerUserId: "cust_11",
        idempotencyKey: "key_evaluator_2",
        generator: new SequenceGenerator(["BIZ23456J"]),
      }),
    );

    const decision = await evaluatePermission(db, {
      userId: "cust_11",
      businessId: result.businessId,
      permission: "business.updateProfile",
    });
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
  });
});
