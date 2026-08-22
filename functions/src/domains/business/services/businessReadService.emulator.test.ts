import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getOwnedBusinesses, getBusinessContext } from "./businessReadService";
import { createBusiness } from "../models/business";
import { createBusinessBranch } from "../models/businessBranch";
import { toBusinessDocumentFields } from "../models/businessDocument";
import { toBusinessBranchDocumentFields } from "../models/businessBranchDocument";
import type { BusinessStatus } from "../models/businessStatus";

/**
 * `ENG-P3-002A` — Business hydration read transport emulator tests (design
 * §9/§14/§25/§37.7, task Phase AC "BUSINESS READS" items 1-5).
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "businessReadServiceEmulatorTest");
const db = getFirestore(app);

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
    "businessBranches",
    "businessMemberships",
    "businessTermsAcceptances",
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

async function seedBusiness(
  businessId: string,
  ownerUserId: string,
  status: BusinessStatus = "draft",
  businessCode = "BIZ23456X",
) {
  const business = createBusiness({
    id: businessId,
    businessCode,
    ownerUserId,
    displayName: "Read Test Cafe",
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
    .set(stripUndefined(toBusinessDocumentFields({ ...business, status })));
  return business;
}

async function seedBranch(businessId: string, branchId: string) {
  const branch = createBusinessBranch({
    id: branchId,
    businessId,
    displayName: "Main Branch",
    countryCode: "US",
    city: "Springfield",
    createdAt: CREATED_AT,
  });
  await db
    .collection("businessBranches")
    .doc(branchId)
    .set(stripUndefined(toBusinessBranchDocumentFields(branch)));
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

describe("getOwnedBusinesses", () => {
  it("1. authenticated owner lists own Business", async () => {
    await seedBusiness("biz-a", "cust_owner");
    const result = await getOwnedBusinesses(db, "cust_owner");
    expect(result).toHaveLength(1);
    expect(result[0]!.businessId).toBe("biz-a");
    expect(result[0]!.status).toBe("draft");
  });

  it("returns an empty list for an identity with no Business yet (§38 scenario 1)", async () => {
    const result = await getOwnedBusinesses(db, "cust_nobody");
    expect(result).toEqual([]);
  });

  it("2. cannot list another owner's Business", async () => {
    await seedBusiness("biz-a", "cust_owner");
    const result = await getOwnedBusinesses(db, "cust_other");
    expect(result).toEqual([]);
  });

  it("supports multi-Business ownership (§10) — lists every Business owned by the caller", async () => {
    await seedBusiness("biz-a", "cust_owner", "draft", "BIZ23456X");
    await seedBusiness("biz-b", "cust_owner", "draft", "BIZ23457X");
    const result = await getOwnedBusinesses(db, "cust_owner");
    expect(result.map((b) => b.businessId).sort()).toEqual(["biz-a", "biz-b"]);
  });

  it("3. bounded Business summary — never exposes ownerUserId/schemaVersion/timestamps", async () => {
    await seedBusiness("biz-a", "cust_owner");
    const result = await getOwnedBusinesses(db, "cust_owner");
    const dto = result[0] as unknown as Record<string, unknown>;
    expect(dto["ownerUserId"]).toBeUndefined();
    expect(dto["schemaVersion"]).toBeUndefined();
    expect(dto["createdAt"]).toBeUndefined();
    expect(dto["updatedAt"]).toBeUndefined();
    expect(dto["subscriptionId"]).toBeUndefined();
  });
});

describe("getBusinessContext", () => {
  it("returns the full onboarding-hydration DTO for the authorized owner, including the default Branch", async () => {
    await seedBusiness("biz-a", "cust_owner");
    await seedBranch("biz-a", "branch-1");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const context = await getBusinessContext(db, "cust_owner", "biz-a");
    expect(context.businessId).toBe("biz-a");
    expect(context.status).toBe("draft");
    expect(context.branch).not.toBeNull();
    expect(context.branch?.branchId).toBe("branch-1");
    expect(context.termsAcceptance.accepted).toBe(false);
  });

  it("2. cannot read another owner's Business — fails identically to not-found (enumeration resistance)", async () => {
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(getBusinessContext(db, "cust_intruder", "biz-a")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("a suspended membership no longer grants read access (re-derived live, not cached)", async () => {
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
      status: "suspended",
    });

    await expect(getBusinessContext(db, "cust_owner", "biz-a")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("4. a Business with zero Branch documents fails closed as structural corruption (Phase K, ENG-P3-002A independent review correction) — the atomic ENG-P2-002B bootstrap always creates exactly one Branch, so zero Branch can only mean corruption, never 'not yet built'", async () => {
    await seedBusiness("biz-a", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(getBusinessContext(db, "cust_owner", "biz-a")).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
  });

  it("4b. a Branch document that EXISTS with blank/default optional fields is the legitimate 'profile incomplete' state — distinct from a missing Branch document, and must not fail closed", async () => {
    await seedBusiness("biz-a", "cust_owner");
    await seedBranch("biz-a", "branch-1"); // createBusinessBranch's own defaults leave `address` unset
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const context = await getBusinessContext(db, "cust_owner", "biz-a");
    expect(context.branch).not.toBeNull();
    expect(context.branch?.branchId).toBe("branch-1");
    expect(context.branch?.address).toBeUndefined();
  });

  it("4c. a malformed Branch document (fails structural parsing) fails closed identically to a missing Branch", async () => {
    await seedBusiness("biz-a", "cust_owner");
    await db.collection("businessBranches").doc("branch-bad").set({
      businessId: "biz-a",
      // missing required fields (displayName/countryCode/city/createdAt/schemaVersion) — fails fromBusinessBranchDocument parsing
    });
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(getBusinessContext(db, "cust_owner", "biz-a")).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
  });

  it("5. multiple Branch documents for one Business fail closed", async () => {
    await seedBusiness("biz-a", "cust_owner");
    await seedBranch("biz-a", "branch-1");
    await seedBranch("biz-a", "branch-2");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(getBusinessContext(db, "cust_owner", "biz-a")).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
  });

  it("a non-existent Business fails closed identically to unauthorized", async () => {
    await expect(getBusinessContext(db, "cust_owner", "biz-does-not-exist")).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("a Manager/Staff member (not just the Owner) may also read the Business context — any active membership grants read authority (§21)", async () => {
    await seedBusiness("biz-a", "cust_owner");
    await seedBranch("biz-a", "branch-1");
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

    const context = await getBusinessContext(db, "cust_manager", "biz-a");
    expect(context.businessId).toBe("biz-a");
  });
});
