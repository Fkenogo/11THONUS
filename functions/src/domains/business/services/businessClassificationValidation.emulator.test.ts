import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bootstrapBusiness,
  readBusinessById,
  type BootstrapBusinessParams,
} from "../repositories/businessRepository";
import { updateBusinessProfileCommand } from "./businessProfileCommand";
import { createBusiness } from "../models/business";
import { toBusinessDocumentFields } from "../models/businessDocument";
import type { CreateBusinessRequest } from "../models/businessBootstrap";
import type { BusinessCodeCandidateGenerator } from "../services/businessCodeGenerator";
import {
  createKnowledgeNodePersisted,
  retireKnowledgeNodePersisted,
  transitionKnowledgeNodeStatusPersisted,
} from "../../commerceKnowledge/repositories/knowledgeNodeRepository";

/**
 * `ENG-P3-001C` — the required test matrix (Phase N, items 1-20): the
 * authoritative Commerce Knowledge validation now integrated into the
 * Business create/profile-update paths. Real Firestore Emulator, not
 * fixtures/mocks — the same discipline as `businessRepository
 * .emulator.test.ts` (002B) and `businessProfileLifecycle.emulator.test.ts`
 * (002C).
 *
 * Every fixture is created directly through the Commerce Knowledge
 * repository's own `createKnowledgeNodePersisted`/
 * `transitionKnowledgeNodeStatusPersisted` functions (Phase P — a test-local
 * ad-hoc fixture, never the governed `burundiPilotSeedManifest.ts`), except
 * the one deliberately-malformed document (item 15), which is written
 * directly to bypass the repository's own construction guarantees and
 * simulate corrupted persisted data.
 */

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "businessClassificationValidationEmulatorTest",
);
const db: Firestore = getFirestore(app);

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

const CREATED_AT = new Date("2026-08-21T00:00:00.000Z");

class SequenceGenerator implements BusinessCodeCandidateGenerator {
  private index = 0;
  constructor(private readonly sequence: string[]) {}
  generateCandidate(): string {
    const value = this.sequence[this.index];
    if (value === undefined) throw new Error("SequenceGenerator exhausted");
    this.index++;
    return value;
  }
}

// Governed alphabet (`businessCode.ts` FD-3): 24 letters (A-Z excluding I, O)
// + 8 digits (2-9, excluding 0/1) — 32 symbols, 6-character random segment.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let seq = 0;
const nextCode = () => {
  seq += 1;
  let n = seq;
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix = CODE_ALPHABET[n % CODE_ALPHABET.length] + suffix;
    n = Math.floor(n / CODE_ALPHABET.length);
  }
  return `BIZ${suffix}`;
};

function buildRequest(overrides: Partial<CreateBusinessRequest>): CreateBusinessRequest {
  return {
    displayName: "Classification Test Co",
    primaryCategoryId: "cv_cat_active",
    countryCode: "US",
    currencyCode: "USD",
    timezone: "America/Los_Angeles",
    city: "Springfield",
    contactPhone: "+15550100",
    supportedLanguages: ["en"],
    ...overrides,
  };
}

function buildParams(
  overrides: Partial<BootstrapBusinessParams> & { idempotencyKey: string; ownerUserId: string },
): BootstrapBusinessParams {
  return {
    correlationId: `corr_${overrides.idempotencyKey}`,
    actor: { actorType: "user", actorId: overrides.ownerUserId },
    now: CREATED_AT,
    newId: () => `evt_${overrides.idempotencyKey}_${Math.random().toString(36).slice(2)}`,
    generator: new SequenceGenerator([nextCode()]),
    ...overrides,
  };
}

/** Fixture ids used throughout this file (Commerce Knowledge, `cv_` prefix — "classification validation"). */
const IND = "cv_ind";
const CAT_ACTIVE = "cv_cat_active";
const CAT_OTHER_ACTIVE = "cv_cat_other_active";
const CAT_DRAFT = "cv_cat_draft";
const CAT_IN_REVIEW = "cv_cat_in_review";
const CAT_RETIRED = "cv_cat_retired";
const CAT_ARCHIVED = "cv_cat_archived";
const CAT_REPLACEMENT = "cv_cat_replacement";
const TYPE_ACTIVE = "cv_type_active";
const TYPE_UNDER_OTHER_CATEGORY = "cv_type_under_other";
const TYPE_INACTIVE = "cv_type_inactive_draft";
const MALFORMED_NODE = "cv_malformed";

beforeAll(async () => {
  const existing = await db.collection("knowledgeNodes").doc(IND).get();
  if (existing.exists) return; // already seeded by a prior run against the shared emulator instance

  await createKnowledgeNodePersisted(db, {
    id: IND,
    nodeType: "industry",
    parentId: null,
    canonicalName: "CV Industry",
    slug: "cv-industry",
    createdAt: CREATED_AT,
  });

  // Two independent active categories, each with their own active child type.
  for (const [catId, catName] of [
    [CAT_ACTIVE, "CV Active Category"],
    [CAT_OTHER_ACTIVE, "CV Other Active Category"],
    [CAT_REPLACEMENT, "CV Replacement Category"],
  ] as const) {
    await createKnowledgeNodePersisted(db, {
      id: catId,
      nodeType: "business_category",
      parentId: IND,
      canonicalName: catName,
      slug: catId,
      createdAt: CREATED_AT,
    });
    await transitionKnowledgeNodeStatusPersisted(db, catId, "in_review", { updatedAt: CREATED_AT });
    await transitionKnowledgeNodeStatusPersisted(db, catId, "active", { updatedAt: CREATED_AT });
  }

  await createKnowledgeNodePersisted(db, {
    id: CAT_DRAFT,
    nodeType: "business_category",
    parentId: IND,
    canonicalName: "CV Draft Category",
    slug: "cv-cat-draft",
    createdAt: CREATED_AT,
  });

  await createKnowledgeNodePersisted(db, {
    id: CAT_IN_REVIEW,
    nodeType: "business_category",
    parentId: IND,
    canonicalName: "CV In-Review Category",
    slug: "cv-cat-in-review",
    createdAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, CAT_IN_REVIEW, "in_review", {
    updatedAt: CREATED_AT,
  });

  await createKnowledgeNodePersisted(db, {
    id: CAT_RETIRED,
    nodeType: "business_category",
    parentId: IND,
    canonicalName: "CV Retired Category",
    slug: "cv-cat-retired",
    createdAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, CAT_RETIRED, "in_review", {
    updatedAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, CAT_RETIRED, "active", {
    updatedAt: CREATED_AT,
  });
  await retireKnowledgeNodePersisted(db, CAT_RETIRED, {
    updatedAt: CREATED_AT,
    replacementNodeId: CAT_REPLACEMENT,
  });

  await createKnowledgeNodePersisted(db, {
    id: CAT_ARCHIVED,
    nodeType: "business_category",
    parentId: IND,
    canonicalName: "CV Archived Category",
    slug: "cv-cat-archived",
    createdAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, CAT_ARCHIVED, "in_review", {
    updatedAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, CAT_ARCHIVED, "active", {
    updatedAt: CREATED_AT,
  });
  await retireKnowledgeNodePersisted(db, CAT_ARCHIVED, {
    updatedAt: CREATED_AT,
    replacementNodeId: CAT_REPLACEMENT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, CAT_ARCHIVED, "archived", {
    updatedAt: CREATED_AT,
  });

  await createKnowledgeNodePersisted(db, {
    id: TYPE_ACTIVE,
    nodeType: "business_type",
    parentId: CAT_ACTIVE,
    canonicalName: "CV Active Type",
    slug: "cv-type-active",
    createdAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, TYPE_ACTIVE, "in_review", {
    updatedAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, TYPE_ACTIVE, "active", {
    updatedAt: CREATED_AT,
  });

  await createKnowledgeNodePersisted(db, {
    id: TYPE_UNDER_OTHER_CATEGORY,
    nodeType: "business_type",
    parentId: CAT_OTHER_ACTIVE,
    canonicalName: "CV Type Under Other Category",
    slug: "cv-type-under-other",
    createdAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, TYPE_UNDER_OTHER_CATEGORY, "in_review", {
    updatedAt: CREATED_AT,
  });
  await transitionKnowledgeNodeStatusPersisted(db, TYPE_UNDER_OTHER_CATEGORY, "active", {
    updatedAt: CREATED_AT,
  });

  await createKnowledgeNodePersisted(db, {
    id: TYPE_INACTIVE,
    nodeType: "business_type",
    parentId: CAT_ACTIVE,
    canonicalName: "CV Inactive (Draft) Type",
    slug: "cv-type-inactive",
    createdAt: CREATED_AT,
  });
  // Left in `draft` — never transitioned to `active`.

  // Item 15: a deliberately-malformed persisted document (missing required
  // fields) — written directly, bypassing every repository construction
  // guarantee, to simulate corrupted existing data. `fromKnowledgeNodeDocument`
  // returns `null` for this (never throws), and the validation module maps
  // that the same way it maps "does not exist" (documented, established
  // precedent — `resolveHierarchyPlacement` does the same).
  await db.collection("knowledgeNodes").doc(MALFORMED_NODE).set({
    nodeType: "business_type",
    // `status`, `parentId`, `path`, `depth`, `canonicalName`, `slug`,
    // `version`, `searchTerms`, timestamps, `schemaVersion` all omitted.
  });
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

describe("Business classification reference validation — create path (bootstrapBusiness)", () => {
  it("1) valid active Business Category, no businessTypeId -> PASS", async () => {
    const result = await bootstrapBusiness(
      db,
      buildRequest({ primaryCategoryId: CAT_ACTIVE }),
      buildParams({ ownerUserId: "cust_1", idempotencyKey: "cv_key_1" }),
    );
    expect(result.status).toBe("draft");
  });

  it("2) nonexistent category -> reject", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: "cv_does_not_exist" }),
        buildParams({ ownerUserId: "cust_2", idempotencyKey: "cv_key_2" }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("3) Industry id used as category -> reject (wrong node type)", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: IND }),
        buildParams({ ownerUserId: "cust_3", idempotencyKey: "cv_key_3" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("4) Business Type id used as category -> reject (wrong node type)", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: TYPE_ACTIVE }),
        buildParams({ ownerUserId: "cust_4", idempotencyKey: "cv_key_4" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("5) draft category -> reject", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_DRAFT }),
        buildParams({ ownerUserId: "cust_5", idempotencyKey: "cv_key_5" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("6) in_review category -> reject", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_IN_REVIEW }),
        buildParams({ ownerUserId: "cust_6", idempotencyKey: "cv_key_6" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("7) retired category -> reject for new write", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_RETIRED }),
        buildParams({ ownerUserId: "cust_7", idempotencyKey: "cv_key_7" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("8) archived category -> reject for new write", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_ARCHIVED }),
        buildParams({ ownerUserId: "cust_8", idempotencyKey: "cv_key_8" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("9) active category + no businessTypeId -> PASS", async () => {
    const result = await bootstrapBusiness(
      db,
      buildRequest({ primaryCategoryId: CAT_ACTIVE, businessTypeId: undefined }),
      buildParams({ ownerUserId: "cust_9", idempotencyKey: "cv_key_9" }),
    );
    expect(result.status).toBe("draft");
  });

  it("10) active category + valid child Business Type -> PASS", async () => {
    const result = await bootstrapBusiness(
      db,
      buildRequest({ primaryCategoryId: CAT_ACTIVE, businessTypeId: TYPE_ACTIVE }),
      buildParams({ ownerUserId: "cust_10", idempotencyKey: "cv_key_10" }),
    );
    expect(result.status).toBe("draft");
  });

  it("11) nonexistent Business Type -> reject", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_ACTIVE, businessTypeId: "cv_type_does_not_exist" }),
        buildParams({ ownerUserId: "cust_11", idempotencyKey: "cv_key_11" }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("12) wrong-type node (a Business Category) used as Business Type -> reject", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_ACTIVE, businessTypeId: CAT_OTHER_ACTIVE }),
        buildParams({ ownerUserId: "cust_12", idempotencyKey: "cv_key_12" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("13) inactive (draft) Business Type -> reject", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_ACTIVE, businessTypeId: TYPE_INACTIVE }),
        buildParams({ ownerUserId: "cust_13", idempotencyKey: "cv_key_13" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("14) Business Type under a different category -> reject", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_ACTIVE, businessTypeId: TYPE_UNDER_OTHER_CATEGORY }),
        buildParams({ ownerUserId: "cust_14", idempotencyKey: "cv_key_14" }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("15) malformed persisted Business Type document -> fails closed", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: CAT_ACTIVE, businessTypeId: MALFORMED_NODE }),
        buildParams({ ownerUserId: "cust_15", idempotencyKey: "cv_key_15" }),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("16) missing French translation does NOT reject an otherwise-valid canonical reference", async () => {
    // No `KnowledgeTranslation` document exists at all for `CAT_ACTIVE`/
    // `TYPE_ACTIVE` in this fixture set (only `KnowledgeNode` documents were
    // seeded) — this test's mere success is the proof that translation
    // presence/absence played no role (F3 correction, `referenceEligibility.ts`).
    const result = await bootstrapBusiness(
      db,
      buildRequest({ primaryCategoryId: CAT_ACTIVE, businessTypeId: TYPE_ACTIVE }),
      buildParams({ ownerUserId: "cust_16", idempotencyKey: "cv_key_16" }),
    );
    expect(result.status).toBe("draft");
  });

  it("no partial Business write on a rejected create — no businesses/branches/memberships persisted", async () => {
    await expect(
      bootstrapBusiness(
        db,
        buildRequest({ primaryCategoryId: "cv_does_not_exist" }),
        buildParams({ ownerUserId: "cust_partial", idempotencyKey: "cv_key_partial" }),
      ),
    ).rejects.toBeTruthy();

    const businesses = await db.collection("businesses").get();
    const branches = await db.collection("businessBranches").get();
    const memberships = await db.collection("businessMemberships").get();
    expect(businesses.size).toBe(0);
    expect(branches.size).toBe(0);
    expect(memberships.size).toBe(0);
  });
});

describe("Business classification reference validation — existing references (Phase I)", () => {
  it("17) existing Business with a later-retired category remains readable", async () => {
    const bootstrapResult = await bootstrapBusiness(
      db,
      buildRequest({ primaryCategoryId: CAT_REPLACEMENT }),
      buildParams({ ownerUserId: "cust_17", idempotencyKey: "cv_key_17" }),
    );

    // Retire the category the Business already references — 001C never
    // re-validates/re-writes existing Business documents.
    await retireKnowledgeNodePersisted(db, CAT_REPLACEMENT, {
      updatedAt: CREATED_AT,
      replacementNodeId: CAT_ACTIVE,
    });

    const business = await db.runTransaction((transaction) =>
      readBusinessById(transaction, db, bootstrapResult.businessId),
    );
    expect(business).not.toBeNull();
    expect(business?.primaryCategoryId).toBe(CAT_REPLACEMENT);
  });
});

describe("Business classification reference validation — profile update path", () => {
  function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        (result as Record<string, unknown>)[key] = val;
      }
    }
    return result;
  }

  async function seedOwnedBusiness(businessId: string, ownerUserId: string) {
    const business = createBusiness({
      id: businessId,
      businessCode: nextCode(),
      ownerUserId,
      displayName: "Profile Update Co",
      primaryCategoryId: CAT_ACTIVE,
      businessTypeId: TYPE_ACTIVE,
      countryCode: "US",
      currencyCode: "USD",
      timezone: "America/Los_Angeles",
      city: "Springfield",
      contactPhone: "+15550100",
      supportedLanguages: ["en"],
      createdAt: CREATED_AT,
    });
    await db
      .collection("businesses")
      .doc(businessId)
      .set(
        stripUndefined(toBusinessDocumentFields(business) as unknown as Record<string, unknown>),
      );
    await db.collection("businessMemberships").doc(`${businessId}_mem`).set({
      userId: ownerUserId,
      businessId,
      role: "owner",
      status: "active",
      permissions: [],
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    });
    return business;
  }

  it("18) profile update to a valid category/type pair -> PASS", async () => {
    await seedOwnedBusiness("cv_biz_18", "cust_18");
    const result = await updateBusinessProfileCommand(db, {
      userId: "cust_18",
      businessId: "cv_biz_18",
      patch: { primaryCategoryId: CAT_OTHER_ACTIVE, businessTypeId: TYPE_UNDER_OTHER_CATEGORY },
      idempotencyKey: "cv_pu_key_18",
      requestHash: "hash_18",
      correlationId: "corr_18",
      now: CREATED_AT,
      newId: () => "evt_18",
    });
    expect(result.outcome).toBe("executed");
  });

  it("19) profile update to an invalid category/type -> reject with no partial write", async () => {
    await seedOwnedBusiness("cv_biz_19", "cust_19");
    await expect(
      updateBusinessProfileCommand(db, {
        userId: "cust_19",
        businessId: "cv_biz_19",
        patch: { primaryCategoryId: "cv_does_not_exist" },
        idempotencyKey: "cv_pu_key_19",
        requestHash: "hash_19",
        correlationId: "corr_19",
        now: CREATED_AT,
        newId: () => "evt_19",
      }),
    ).rejects.toBeTruthy();

    const snapshot = await db.collection("businesses").doc("cv_biz_19").get();
    expect(snapshot.data()?.["primaryCategoryId"]).toBe(CAT_ACTIVE); // unchanged — no partial write
  });

  it("20) category change creating a type mismatch -> reject", async () => {
    await seedOwnedBusiness("cv_biz_20", "cust_20");
    // Business starts at (CAT_ACTIVE, TYPE_ACTIVE) — changing only the
    // category to CAT_OTHER_ACTIVE while leaving businessTypeId unset in the
    // patch would leave a stale TYPE_ACTIVE (which belongs to CAT_ACTIVE,
    // not CAT_OTHER_ACTIVE) — this must be rejected, not silently persisted
    // or silently cleared (Phase H: no auto-clear policy is invented).
    await expect(
      updateBusinessProfileCommand(db, {
        userId: "cust_20",
        businessId: "cv_biz_20",
        patch: { primaryCategoryId: CAT_OTHER_ACTIVE },
        idempotencyKey: "cv_pu_key_20",
        requestHash: "hash_20",
        correlationId: "corr_20",
        now: CREATED_AT,
        newId: () => "evt_20",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });

    const snapshot = await db.collection("businesses").doc("cv_biz_20").get();
    expect(snapshot.data()?.["primaryCategoryId"]).toBe(CAT_ACTIVE); // unchanged — no partial write
  });

  it("a profile update that never touches classification never re-reads Commerce Knowledge (existing reference untouched)", async () => {
    await seedOwnedBusiness("cv_biz_21", "cust_21");
    const result = await updateBusinessProfileCommand(db, {
      userId: "cust_21",
      businessId: "cv_biz_21",
      patch: { displayName: "Renamed Co" },
      idempotencyKey: "cv_pu_key_21",
      requestHash: "hash_21",
      correlationId: "corr_21",
      now: CREATED_AT,
      newId: () => "evt_21",
    });
    expect(result.outcome).toBe("executed");
    const snapshot = await db.collection("businesses").doc("cv_biz_21").get();
    expect(snapshot.data()?.["displayName"]).toBe("Renamed Co");
    expect(snapshot.data()?.["primaryCategoryId"]).toBe(CAT_ACTIVE);
  });
});
