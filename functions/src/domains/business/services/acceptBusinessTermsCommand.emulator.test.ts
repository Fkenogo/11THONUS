import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { acceptBusinessTermsCommand } from "./acceptBusinessTermsCommand";
import { submitBusinessForVerificationCommand } from "./businessLifecycleCommand";
import { createBusiness } from "../models/business";
import { toBusinessDocumentFields } from "../models/businessDocument";
import {
  BUSINESS_TERMS_CONFIG_COLLECTION,
  BUSINESS_TERMS_CONFIG_DOCUMENT_ID,
} from "../repositories/businessTermsConfigRepository";
import {
  businessTermsAcceptanceId,
  createBusinessTermsAcceptance,
  toBusinessTermsAcceptanceDocumentFields,
} from "../models/businessTermsAcceptance";

/**
 * `ENG-P3-002A` — the Terms-of-Service acceptance emulator test matrix
 * (design §37, task Phase AC "TERMS" items 20-34). This is the
 * highest-stakes surface in this package: server-authoritative Terms
 * versioning, identity-spoofing resistance, cross-Business authorization,
 * write-once idempotency, and TOCTOU safety are all real security
 * boundaries under test here against a real Firestore emulator, not mocks.
 *
 * **Independent review correction (`ENG-P3-002A` finding F3-1):** the
 * currently-required Terms version is now a Firestore document
 * (`platformConfig/businessTerms`, `businessTermsConfigRepository.ts`),
 * read inside the same transaction as the acceptance/precondition check —
 * not `process.env`, which cannot participate in Firestore's optimistic
 * concurrency control at all. `setTermsConfig`/`clearTermsConfig` below
 * seed/clear that document directly, mirroring how every other emulator
 * test in this codebase seeds fixture documents.
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "acceptBusinessTermsCommandEmulatorTest");
const db = getFirestore(app);

const TEST_ONLY_TERMS_VERSION = "TEST_ONLY_FIXTURE_v0";
const TEST_ONLY_TERMS_VERSION_V2 = "TEST_ONLY_FIXTURE_v1";

function termsConfigRef() {
  return db.collection(BUSINESS_TERMS_CONFIG_COLLECTION).doc(BUSINESS_TERMS_CONFIG_DOCUMENT_ID);
}

async function setTermsConfig(version: string): Promise<void> {
  await termsConfigRef().set({ currentVersion: version });
}

async function clearTermsConfig(): Promise<void> {
  await termsConfigRef().delete();
}

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
  for (const collection of [
    "businesses",
    "businessMemberships",
    "businessTermsAcceptances",
    "idempotencyRecords",
    "outboxEntries",
    BUSINESS_TERMS_CONFIG_COLLECTION,
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

const CREATED_AT = new Date("2026-08-21T00:00:00.000Z");

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) (result as Record<string, unknown>)[key] = val;
  }
  return result;
}

async function seedBusiness(businessId: string, ownerUserId: string, businessCode = "BIZ23456X") {
  const business = createBusiness({
    id: businessId,
    businessCode,
    ownerUserId,
    displayName: "Terms Test Cafe",
    primaryCategoryId: "cat_food",
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
    .set(stripUndefined(toBusinessDocumentFields(business)));
  return business;
}

async function seedMembership(params: {
  membershipId: string;
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
  status?: "active" | "invited" | "suspended" | "removed";
}) {
  await db
    .collection("businessMemberships")
    .doc(params.membershipId)
    .set({
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      status: params.status ?? "active",
      permissions: [],
    });
}

async function seedAcceptance(
  businessId: string,
  acceptingCustomerIdentityId: string,
  version: string,
) {
  const acceptance = createBusinessTermsAcceptance({
    id: "",
    acceptingCustomerIdentityId,
    businessId,
    termsVersion: version,
    acceptedAt: CREATED_AT,
    languageCode: "en",
  });
  await db
    .collection("businessTermsAcceptances")
    .doc(businessTermsAcceptanceId(businessId, acceptingCustomerIdentityId, version))
    .set(toBusinessTermsAcceptanceDocumentFields(acceptance));
}

let idCounter = 0;
function nextIdempotencyKey() {
  idCounter += 1;
  return `terms-key-${idCounter}`;
}

describe("acceptBusinessTermsCommand", () => {
  it("20. server derives the accepting Customer Identity from userId — never a request field", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const result = await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });

    expect(result.termsVersion).toBe(TEST_ONLY_TERMS_VERSION);
    const doc = await db
      .collection("businessTermsAcceptances")
      .doc(businessTermsAcceptanceId("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION))
      .get();
    expect(doc.exists).toBe(true);
    expect(doc.data()?.["acceptingCustomerIdentityId"]).toBe("cust_owner");
  });

  // 21: caller cannot mass-assign accepting identity — proven structurally
  // at the transport layer (index.ts's whitelist parser has no
  // `acceptingCustomerIdentityId` field at all — see index.test.ts) and
  // here at the command layer: the command's own signature has no such
  // parameter to smuggle a value through even if a caller tried.
  it("21. the command signature has no acceptingCustomerIdentityId parameter to mass-assign", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    // Cast through `unknown` — the production parameter type structurally
    // has no `acceptingCustomerIdentityId` field at all, so a real caller
    // cannot express this without bypassing TypeScript entirely; this test
    // proves that even if a caller *did* smuggle the field past the type
    // system (e.g. from untyped JSON), the command still ignores it.
    const params = {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
      acceptingCustomerIdentityId: "cust_attacker",
    } as unknown as Parameters<typeof acceptBusinessTermsCommand>[1];
    const result = await acceptBusinessTermsCommand(db, params);
    // The extra field is simply ignored — the recorded identity is always `userId`.
    const doc = await db
      .collection("businessTermsAcceptances")
      .doc(businessTermsAcceptanceId("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION))
      .get();
    expect(doc.data()?.["acceptingCustomerIdentityId"]).toBe("cust_owner");
    expect(result.businessId).toBe("biz-a");
  });

  it("22. caller cannot choose termsVersion — the command signature has no such parameter", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const smuggledParams = {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
      termsVersion: "cust_chosen_v99",
    } as unknown as Parameters<typeof acceptBusinessTermsCommand>[1];
    const result = await acceptBusinessTermsCommand(db, smuggledParams);
    expect(result.termsVersion).toBe(TEST_ONLY_TERMS_VERSION);
  });

  it("23. the current server Terms version is accepted and recorded", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const result = await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });
    expect(result.termsVersion).toBe(TEST_ONLY_TERMS_VERSION);
    expect(result.alreadyAccepted).toBe(false);
  });

  it("24. identical repeat acceptance is idempotent — deterministic no-op, same evidence", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });
    const second = await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-2",
      now: new Date("2026-08-22T00:00:00.000Z"),
      newId: () => "evt-2",
    });
    expect(second.alreadyAccepted).toBe(true);
    expect(second.acceptedAt).toBe(CREATED_AT.toISOString());

    const snapshot = await db
      .collection("businessTermsAcceptances")
      .where("businessId", "==", "biz-a")
      .get();
    expect(snapshot.docs).toHaveLength(1);
  });

  it("24b. a corrupted/tuple-mismatching document written directly at the deterministic id (bypassing the repository) is rejected, not returned as valid acceptance evidence (Phase J)", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    // Write a structurally well-formed but tuple-MISMATCHING document
    // directly at the id `acceptBusinessTermsCommand` will compute for
    // (biz-a, cust_owner, TEST_ONLY_TERMS_VERSION) — simulating corruption
    // (e.g. a bad manual data fix) rather than going through the
    // repository's own write path.
    const wrongTupleAcceptance = createBusinessTermsAcceptance({
      id: "",
      acceptingCustomerIdentityId: "someone_else_entirely",
      businessId: "a-completely-different-business",
      termsVersion: "some_other_version",
      acceptedAt: CREATED_AT,
      languageCode: "en",
    });
    await db
      .collection("businessTermsAcceptances")
      .doc(businessTermsAcceptanceId("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION))
      .set(toBusinessTermsAcceptanceDocumentFields(wrongTupleAcceptance));

    // The command must fail closed (reject the corrupted document as
    // evidence) rather than treating it as an idempotent replay.
    await expect(
      acceptBusinessTermsCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toThrow();
  });

  it("25. a later Terms version creates a distinct, additional acceptance record — the earlier one is never overwritten", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });

    await setTermsConfig(TEST_ONLY_TERMS_VERSION_V2);
    const second = await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-2",
      now: new Date("2026-09-01T00:00:00.000Z"),
      newId: () => "evt-2",
    });
    expect(second.termsVersion).toBe(TEST_ONLY_TERMS_VERSION_V2);
    expect(second.alreadyAccepted).toBe(false);

    const oldRecord = await db
      .collection("businessTermsAcceptances")
      .doc(businessTermsAcceptanceId("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION))
      .get();
    expect(oldRecord.exists).toBe(true);
    const newRecord = await db
      .collection("businessTermsAcceptances")
      .doc(businessTermsAcceptanceId("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION_V2))
      .get();
    expect(newRecord.exists).toBe(true);
  });

  it("28. accepting requires the caller's own live Owner membership — a Manager cannot accept Terms on the Business's behalf", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-2",
      userId: "cust_manager",
      businessId: "biz-a",
      role: "manager",
    });

    await expect(
      acceptBusinessTermsCommand(db, {
        userId: "cust_manager",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("a random authenticated identity with no membership cannot accept Terms for another Business", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      acceptBusinessTermsCommand(db, {
        userId: "cust_stranger",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });

    const snapshot = await db
      .collection("businessTermsAcceptances")
      .where("businessId", "==", "biz-a")
      .get();
    expect(snapshot.empty).toBe(true);
  });

  it("29. no required Terms config fails closed", async () => {
    await clearTermsConfig();
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      acceptBusinessTermsCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });
  });

  it("29c. a malformed config document (blank currentVersion) fails closed identically to absence", async () => {
    await termsConfigRef().set({ currentVersion: "   " });
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      acceptBusinessTermsCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });
  });

  it("32. Terms acceptance does not alter Business lifecycle", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });

    const doc = await db.collection("businesses").doc("biz-a").get();
    expect(doc.data()?.["status"]).toBe("draft");
  });

  it("33. acceptance history remains immutable — acceptedAt on a repeated call never changes", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const first = await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });
    const muchLater = new Date("2027-01-01T00:00:00.000Z");
    const second = await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-2",
      now: muchLater,
      newId: () => "evt-2",
    });
    expect(second.acceptedAt).toBe(first.acceptedAt);
  });

  it("35. BusinessTermsAccepted outbox event's aggregateId is the acceptance record's own id, not businessId (Phase S)", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });

    const acceptanceId = businessTermsAcceptanceId("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION);
    const entries = await db.collection("outboxEntries").get();
    expect(entries.docs).toHaveLength(1);
    const event = entries.docs[0]?.data()["event"];
    expect(event.aggregateType).toBe("business_terms_acceptance");
    expect(event.aggregateId).toBe(acceptanceId);
    expect(event.aggregateId).not.toBe("biz-a");
  });
});

describe("submitBusinessForVerification — Terms precondition (design §37.4/§37.9/Phase U)", () => {
  it("26. an old accepted version does not satisfy the current required version — submission fails", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION_V2);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedAcceptance("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION);

    await expect(
      submitBusinessForVerificationCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        requestHash: "hash-1",
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });

    const doc = await db.collection("businesses").doc("biz-a").get();
    expect(doc.data()?.["status"]).toBe("draft");
  });

  it("27. another Business's acceptance does not satisfy this Business's precondition", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedBusiness("biz-b", "cust_owner", "BIZ23457X");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-2",
      userId: "cust_owner",
      businessId: "biz-b",
      role: "owner",
    });
    // Acceptance exists only for biz-b, not biz-a.
    await seedAcceptance("biz-b", "cust_owner", TEST_ONLY_TERMS_VERSION);

    await expect(
      submitBusinessForVerificationCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        requestHash: "hash-1",
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("28b. another identity's acceptance for the same Business does not satisfy the required owner acceptance", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-2",
      userId: "cust_manager",
      businessId: "biz-a",
      role: "manager",
    });
    // The Manager accepted, not the Owner.
    await seedAcceptance("biz-a", "cust_manager", TEST_ONLY_TERMS_VERSION);

    await expect(
      submitBusinessForVerificationCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        requestHash: "hash-1",
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("29b. no required Terms config fails closed for submission too", async () => {
    await clearTermsConfig();
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      submitBusinessForVerificationCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        requestHash: "hash-1",
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });
  });

  it("30. submit without any acceptance is denied", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      submitBusinessForVerificationCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        requestHash: "hash-1",
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("31. submit with current-version acceptance succeeds", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedAcceptance("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION);

    const outcome = await submitBusinessForVerificationCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      requestHash: "hash-1",
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });
    expect(outcome.outcome).toBe("executed");
    const doc = await db.collection("businesses").doc("biz-a").get();
    expect(doc.data()?.["status"]).toBe("pending_verification");
  });

  it("31b. a tuple-mismatching document at the deterministic acceptance id does not satisfy the precondition (Phase J) — treated identically to no acceptance at all", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    const wrongTupleAcceptance = createBusinessTermsAcceptance({
      id: "",
      acceptingCustomerIdentityId: "someone_else_entirely",
      businessId: "a-completely-different-business",
      termsVersion: "some_other_version",
      acceptedAt: CREATED_AT,
      languageCode: "en",
    });
    await db
      .collection("businessTermsAcceptances")
      .doc(businessTermsAcceptanceId("biz-a", "cust_owner", TEST_ONLY_TERMS_VERSION))
      .set(toBusinessTermsAcceptanceDocumentFields(wrongTupleAcceptance));

    await expect(
      submitBusinessForVerificationCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        requestHash: "hash-1",
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("34. sequential version-bump-before-submit cannot allow a stale acceptance to satisfy the new version", async () => {
    await setTermsConfig(TEST_ONLY_TERMS_VERSION);
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await acceptBusinessTermsCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      idempotencyKey: nextIdempotencyKey(),
      correlationId: "corr-1",
      now: CREATED_AT,
      newId: () => "evt-1",
    });

    // Terms version changes before submit is even attempted.
    await setTermsConfig(TEST_ONLY_TERMS_VERSION_V2);

    await expect(
      submitBusinessForVerificationCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        idempotencyKey: nextIdempotencyKey(),
        requestHash: "hash-1",
        correlationId: "corr-1",
        now: CREATED_AT,
        newId: () => "evt-1",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });

    const doc = await db.collection("businesses").doc("biz-a").get();
    expect(doc.data()?.["status"]).toBe("draft");
  });

  /**
   * **Disclosed finding, not a passing claim (`ENG-P3-002A` independent
   * review, Phase D/F/G).** A genuine concurrent-transaction interleaving
   * proof was attempted here: pause `submitBusinessForVerificationCommand`'s
   * (and separately `acceptBusinessTermsCommand`'s) transaction immediately
   * after its `testOnlyAfterTermsVersionReadHook` fires — i.e. immediately
   * after `transaction.get()` reads the config document — commit a fully
   * independent, concurrent write to that same document, then release the
   * pause and let the held transaction proceed to its own write/commit.
   *
   * Against the real Firestore Emulator, this reproducibly did **not**
   * trigger a transaction retry: the paused transaction committed
   * successfully using the stale value it had already read, with no
   * conflict detected. This was independently isolated with a minimal
   * standalone script exercising nothing but a bare `db.runTransaction`
   * call against two plain documents (no application code involved at
   * all) — same result. This rules out a bug in
   * `businessTermsConfigRepository.ts` or in this test's own construction;
   * the gap is in the local emulator's fidelity to Firestore's documented
   * production `Transaction.get()`/optimistic-concurrency contract for
   * this specific "read, then externally-delayed write" interleaving
   * shape. This is recorded honestly rather than shipping a test that
   * would either be flaky or falsely claim a proof this environment cannot
   * produce — see `businessTermsConfigRepository.emulator.test.ts` for the
   * parallel disclosure and the independent review report for the full
   * reproduction.
   *
   * What genuinely IS proven, by real passing tests: (1) structurally —
   * `getCurrentlyRequiredBusinessTermsVersionInTransaction` reads via
   * `transaction.get()`, which is, by Firestore's own documented API
   * contract, unconditionally part of that transaction's read set,
   * unlike the original `process.env` read, which touches no Firestore
   * RPC at all and therefore could not have participated in conflict
   * detection under any interleaving, provable or not; (2) functionally —
   * test 34 above (and test 26) prove that whatever value the config
   * document holds at the moment a transaction's `transaction.get()` call
   * actually executes is the value that transaction enforces, end to end,
   * against real seeded/mutated Firestore state.
   */
  it.skip("DISCLOSED FINDING (not proven here): a concurrent config write during a deliberately-held-open submit/accept transaction did not force a retry against the local Firestore Emulator, despite this being production Firestore's documented transaction.get() contract — see the review report", () => {});
});
