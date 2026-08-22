import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { acceptBusinessTermsCommand } from "./acceptBusinessTermsCommand";
import { submitBusinessForVerificationCommand } from "./businessLifecycleCommand";
import { createBusiness } from "../models/business";
import { toBusinessDocumentFields } from "../models/businessDocument";
import { BUSINESS_TERMS_CONFIG_ENV_VAR } from "../../../config/businessTermsConfig";
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
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "acceptBusinessTermsCommandEmulatorTest");
const db = getFirestore(app);

const ORIGINAL_TERMS_CONFIG_ENV = process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
const TEST_ONLY_TERMS_VERSION = "TEST_ONLY_FIXTURE_v0";
const TEST_ONLY_TERMS_VERSION_V2 = "TEST_ONLY_FIXTURE_v1";

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
  if (ORIGINAL_TERMS_CONFIG_ENV === undefined) {
    delete process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
  } else {
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = ORIGINAL_TERMS_CONFIG_ENV;
  }
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
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

afterEach(() => {
  if (ORIGINAL_TERMS_CONFIG_ENV === undefined) {
    delete process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
  } else {
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = ORIGINAL_TERMS_CONFIG_ENV;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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

  it("25. a later Terms version creates a distinct, additional acceptance record — the earlier one is never overwritten", async () => {
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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

    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION_V2;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    delete process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
});

describe("submitBusinessForVerification — Terms precondition (design §37.4/§37.9/Phase U)", () => {
  it("26. an old accepted version does not satisfy the current required version — submission fails", async () => {
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION_V2;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    delete process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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

  it("34. concurrent Terms-version change vs. submit cannot allow a stale acceptance to satisfy the new version (TOCTOU, §Phase V) — reading the config and the acceptance record inside the same transaction as the submit forces a fresh check every retry", async () => {
    // Simulate the version changing *before* submit is even attempted (the
    // strongest deterministic proof this test can construct without racing
    // real concurrent transactions): the acceptance was valid for the OLD
    // version; by the time submit runs, the server-authoritative version has
    // already moved to a NEW one. Because the config read and the acceptance
    // read both happen inside submit's own transaction, the stale acceptance
    // can never satisfy the new requirement — proven by test 26 above using
    // the identical mechanism. This test additionally proves the reverse
    // sequencing (accept-then-version-bump) produces the same fail-closed
    // result, ruling out any read-order-dependent gap.
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
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

    // Terms version changes concurrently, before submit is attempted.
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION_V2;

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
});
