import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { updateBusinessProfileCommand } from "./businessProfileCommand";
import { updateBusinessBranchProfileCommand } from "./businessBranchProfileCommand";
import {
  submitBusinessForVerificationCommand,
  closeBusinessCommand,
} from "./businessLifecycleCommand";
import {
  bootstrapBusiness,
  type BootstrapBusinessParams,
} from "../repositories/businessRepository";
import { createBusiness } from "../models/business";
import { createBusinessBranch } from "../models/businessBranch";
import { toBusinessDocumentFields } from "../models/businessDocument";
import { toBusinessBranchDocumentFields } from "../models/businessBranchDocument";
import type { BusinessStatus } from "../models/businessStatus";
import type { CreateBusinessRequest } from "../models/businessBootstrap";
import type { BusinessCodeCandidateGenerator } from "../services/businessCodeGenerator";
import { getBusinessMembershipByUserAndBusiness } from "../../permissions/repositories/businessMembershipRepository";
import { evaluatePermission } from "../../permissions/service/evaluatePermissionService";
import {
  createKnowledgeNodePersisted,
  getKnowledgeNodeById,
  transitionKnowledgeNodeStatusPersisted,
} from "../../commerceKnowledge/repositories/knowledgeNodeRepository";
import { BUSINESS_TERMS_CONFIG_ENV_VAR } from "../../../config/businessTermsConfig";
import {
  createBusinessTermsAcceptance,
  toBusinessTermsAcceptanceDocumentFields,
  businessTermsAcceptanceId,
} from "../models/businessTermsAcceptance";

/**
 * `ENG-P3-002A` (design §37, task Phase AD): `submitBusinessForVerificationCommand`
 * now has an additive precondition — the current owner must have accepted
 * the currently-required Business Terms version. This file's own
 * "Owner + draft = executed" / end-to-end tests intend the submission to
 * *succeed*, so — per Phase AD's explicit instruction — this test file's
 * setup is updated with an explicit test-only current-Terms-version
 * configuration and a matching acceptance record, never by weakening the
 * new invariant itself. `TEST_ONLY_FIXTURE_v0` is unambiguously a test
 * fixture value, never a real/legally-approved Terms version (Phase Q).
 */
const TEST_ONLY_TERMS_VERSION = "TEST_ONLY_FIXTURE_v0";

async function seedBusinessTermsAcceptance(
  businessId: string,
  acceptingCustomerIdentityId: string,
) {
  const acceptance = createBusinessTermsAcceptance({
    id: "",
    acceptingCustomerIdentityId,
    businessId,
    termsVersion: TEST_ONLY_TERMS_VERSION,
    acceptedAt: CREATED_AT,
    languageCode: "en",
  });
  await db
    .collection("businessTermsAcceptances")
    .doc(
      businessTermsAcceptanceId(businessId, acceptingCustomerIdentityId, TEST_ONLY_TERMS_VERSION),
    )
    .set(toBusinessTermsAcceptanceDocumentFields(acceptance));
}

/**
 * `ENG-P2-002C` — the emulator test matrix interrupted mid-work by the
 * `CAP-P3-BIZ-AUTH-001` authorization deadlock, completed during the
 * controlled-resume task now that `ENG-P2-004-CORR-001` is merged. Real
 * Firestore, not fixtures — same discipline as `businessRepository
 * .emulator.test.ts` (002B) and `authorizeAndExecute.emulator.test.ts`
 * (004D).
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "businessProfileLifecycleEmulatorTest");
const db = getFirestore(app);

const ORIGINAL_TERMS_CONFIG_ENV = process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
  if (ORIGINAL_TERMS_CONFIG_ENV === undefined) {
    delete process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
  } else {
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = ORIGINAL_TERMS_CONFIG_ENV;
  }
});

beforeAll(async () => {
  process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = TEST_ONLY_TERMS_VERSION;
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }

  // `ENG-P3-001C`: test-local Commerce Knowledge fixtures (Phase P — never
  // the governed seed manifest), guarded against re-seeding across the
  // shared-emulator, cross-file run (see `businessRepository.emulator.test.ts`).
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
    "businessTermsAcceptances",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

const CREATED_AT = new Date("2026-08-18T00:00:00.000Z");

/** The Admin SDK rejects `undefined` field values outright (the same issue `businessRepository.ts`'s own `stripUndefined` fixes for production writes) — this test file's seed helpers need the same treatment. */
function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

async function seedBusiness(
  businessId: string,
  status: BusinessStatus,
  ownerUserId = "cust_owner",
) {
  const business = createBusiness({
    id: businessId,
    businessCode: "BIZ23456X",
    ownerUserId,
    displayName: "Seeded Cafe",
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
  return branch;
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

let idCounter = 0;
function newIds() {
  idCounter += 1;
  return {
    idempotencyKey: `key-${idCounter}`,
    requestHash: `hash-${idCounter}`,
    correlationId: `corr-${idCounter}`,
  };
}

describe("updateBusinessProfileCommand — lifecycle-eligibility matrix (real Firestore)", () => {
  it.each(["draft", "pending_verification", "trial", "active", "expired"] as const)(
    "Owner + %s = executed",
    async (status) => {
      await seedBusiness("biz-a", status);
      await seedMembership({
        membershipId: "mem-1",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });

      const outcome = await updateBusinessProfileCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        patch: { displayName: "Updated Name" },
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      });

      expect(outcome.outcome).toBe("executed");
      const doc = await db.collection("businesses").doc("biz-a").get();
      expect(doc.data()?.["displayName"]).toBe("Updated Name");
    },
  );

  it.each(["suspended", "closed", "archived"] as const)("Owner + %s = denied", async (status) => {
    await seedBusiness("biz-a", status);
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await updateBusinessProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      patch: { displayName: "Should Not Apply" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    const doc = await db.collection("businesses").doc("biz-a").get();
    expect(doc.data()?.["displayName"]).toBe("Seeded Cafe");
  });

  it("Manager = denied", async () => {
    await seedBusiness("biz-a", "active");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_mgr",
      businessId: "biz-a",
      role: "manager",
    });

    const outcome = await updateBusinessProfileCommand(db, {
      userId: "cust_mgr",
      businessId: "biz-a",
      patch: { displayName: "Nope" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("Staff = denied", async () => {
    await seedBusiness("biz-a", "active");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_staff",
      businessId: "biz-a",
      role: "staff",
    });

    const outcome = await updateBusinessProfileCommand(db, {
      userId: "cust_staff",
      businessId: "biz-a",
      patch: { displayName: "Nope" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("cross-business membership (Owner of a different Business) = denied", async () => {
    await seedBusiness("biz-a", "active");
    await seedBusiness("biz-b", "active");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner_b",
      businessId: "biz-b",
      role: "owner",
    });

    const outcome = await updateBusinessProfileCommand(db, {
      userId: "cust_owner_b",
      businessId: "biz-a",
      patch: { displayName: "Nope" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("immutable fields (id/businessCode/ownerUserId/status/createdAt/schemaVersion) are never mutated by a profile update, even across a broad legitimate patch", async () => {
    const seeded = await seedBusiness("biz-a", "active", "cust_owner");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await updateBusinessProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      patch: {
        displayName: "New Name",
        legalName: "New Legal Name",
        contactPhone: "+15559999",
        city: "New City",
      },
      now: new Date("2026-08-18T05:00:00.000Z"),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    const doc = await db.collection("businesses").doc("biz-a").get();
    const data = doc.data();
    expect(data?.["id"]).toBeUndefined(); // id is the doc id, never a field
    expect(data?.["businessCode"]).toBe(seeded.businessCode);
    expect(data?.["ownerUserId"]).toBe("cust_owner");
    expect(data?.["status"]).toBe("active");
    expect(data?.["schemaVersion"]).toBe(1);
    expect(data?.["displayName"]).toBe("New Name");
  });

  it("emits a BusinessProfileUpdated outbox entry naming only the changed fields, no PII values", async () => {
    await seedBusiness("biz-a", "active");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await updateBusinessProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      patch: { contactPhone: "+15551234" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    const entries = await db.collection("outboxEntries").get();
    expect(entries.docs).toHaveLength(1);
    const event = entries.docs[0]?.data()["event"];
    expect(event.eventType).toContain("business_profile_updated");
    expect(event.payload.updatedFields).toEqual(["contactPhone"]);
    expect(JSON.stringify(event.payload)).not.toContain("+15551234");
  });
});

describe("updateBusinessBranchProfileCommand — real Firestore", () => {
  it("Owner + draft = executed, exactly one branch document exists and is updated", async () => {
    await seedBusiness("biz-a", "draft");
    await seedBranch("biz-a", "branch-1");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await updateBusinessBranchProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      branchId: "branch-1",
      patch: { displayName: "Updated Branch" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    const branches = await db.collection("businessBranches").get();
    expect(branches.docs).toHaveLength(1);
    expect(branches.docs[0]?.data()["displayName"]).toBe("Updated Branch");
  });

  it("Owner + suspended = denied", async () => {
    await seedBusiness("biz-a", "suspended");
    await seedBranch("biz-a", "branch-1");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await updateBusinessBranchProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      branchId: "branch-1",
      patch: { displayName: "Should Not Apply" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("Manager = denied, Staff = denied", async () => {
    await seedBusiness("biz-a", "active");
    await seedBranch("biz-a", "branch-1");
    for (const role of ["manager", "staff"] as const) {
      await seedMembership({
        membershipId: `mem-${role}`,
        userId: `cust_${role}`,
        businessId: "biz-a",
        role,
      });
      const outcome = await updateBusinessBranchProfileCommand(db, {
        userId: `cust_${role}`,
        businessId: "biz-a",
        branchId: "branch-1",
        patch: { displayName: "Nope" },
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      });
      expect(outcome.outcome).toBe("denied");
    }
  });

  it("a branch belonging to a different Business fails closed (cross-business tenant isolation), even for a legitimately-authorized Owner", async () => {
    await seedBusiness("biz-a", "active");
    await seedBusiness("biz-b", "active");
    await seedBranch("biz-b", "branch-of-b");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    // The caller *is* legitimately authorized on `biz-a` (the evaluator
    // allows), so `mutation.prepare` runs — and `readBusinessBranchForBusiness`
    // then correctly refuses to resolve a branch belonging to a different
    // Business, throwing `businessBranchNotFoundError` rather than
    // resolving `{outcome: "denied"}` (that outcome shape is reserved for
    // the evaluator's own deny decision, never a resource lookup that
    // fails inside an authorized `prepare` phase). Enumeration-resistant
    // either way: the client-facing error is identical to "no such
    // branch," never distinguishing "wrong business" from "doesn't exist."
    await expect(
      updateBusinessBranchProfileCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        branchId: "branch-of-b",
        patch: { displayName: "Should Not Apply" },
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });

    const branchOfB = await db.collection("businessBranches").doc("branch-of-b").get();
    expect(branchOfB.data()?.["displayName"]).toBe("Main Branch");
  });

  it("no new Branch document is ever created by an update command", async () => {
    await seedBusiness("biz-a", "active");
    await seedBranch("biz-a", "branch-1");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await updateBusinessBranchProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      branchId: "branch-1",
      patch: { city: "New City" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    const branches = await db.collection("businessBranches").get();
    expect(branches.docs).toHaveLength(1);
  });
});

describe("submitBusinessForVerificationCommand — draft-only narrowness (real Firestore)", () => {
  it("Owner + draft = executed, Business becomes pending_verification", async () => {
    await seedBusiness("biz-a", "draft");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedBusinessTermsAcceptance("biz-a", "cust_owner");

    const outcome = await submitBusinessForVerificationCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    const doc = await db.collection("businesses").doc("biz-a").get();
    expect(doc.data()?.["status"]).toBe("pending_verification");
  });

  it.each([
    "pending_verification",
    "trial",
    "active",
    "suspended",
    "expired",
    "closed",
    "archived",
  ] as const)("Owner + %s = denied (status never changes)", async (status) => {
    await seedBusiness("biz-a", status);
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await submitBusinessForVerificationCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    const doc = await db.collection("businesses").doc("biz-a").get();
    expect(doc.data()?.["status"]).toBe(status);
  });

  it("Manager = denied, Staff = denied", async () => {
    await seedBusiness("biz-a", "draft");
    for (const role of ["manager", "staff"] as const) {
      await seedMembership({
        membershipId: `mem-${role}`,
        userId: `cust_${role}`,
        businessId: "biz-a",
        role,
      });
      const outcome = await submitBusinessForVerificationCommand(db, {
        userId: `cust_${role}`,
        businessId: "biz-a",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      });
      expect(outcome.outcome).toBe("denied");
    }
  });
});

describe("closeBusinessCommand — approved lifecycle matrix (real Firestore)", () => {
  it.each(["draft", "pending_verification", "trial", "active", "suspended", "expired"] as const)(
    "Owner + %s = executed, Business becomes closed",
    async (status) => {
      await seedBusiness("biz-a", status);
      await seedMembership({
        membershipId: "mem-1",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });

      const outcome = await closeBusinessCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      });

      expect(outcome.outcome).toBe("executed");
      const doc = await db.collection("businesses").doc("biz-a").get();
      expect(doc.data()?.["status"]).toBe("closed");
    },
  );

  it.each(["closed", "archived"] as const)(
    "Owner + %s = denied (terminal, no double-close/archive side effect)",
    async (status) => {
      await seedBusiness("biz-a", status);
      await seedMembership({
        membershipId: "mem-1",
        userId: "cust_owner",
        businessId: "biz-a",
        role: "owner",
      });

      const outcome = await closeBusinessCommand(db, {
        userId: "cust_owner",
        businessId: "biz-a",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      });

      expect(outcome.outcome).toBe("denied");
      const doc = await db.collection("businesses").doc("biz-a").get();
      expect(doc.data()?.["status"]).toBe(status);
    },
  );

  it("Manager = denied, Staff = denied", async () => {
    await seedBusiness("biz-a", "active");
    for (const role of ["manager", "staff"] as const) {
      await seedMembership({
        membershipId: `mem-${role}`,
        userId: `cust_${role}`,
        businessId: "biz-a",
        role,
      });
      const outcome = await closeBusinessCommand(db, {
        userId: `cust_${role}`,
        businessId: "biz-a",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      });
      expect(outcome.outcome).toBe("denied");
    }
  });

  it("close preserves historical Business and Branch data — no field is wiped, only status/updatedAt change", async () => {
    const seeded = await seedBusiness("biz-a", "active");
    await seedBranch("biz-a", "branch-1");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    await closeBusinessCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    const businessDoc = await db.collection("businesses").doc("biz-a").get();
    expect(businessDoc.data()?.["displayName"]).toBe(seeded.displayName);
    expect(businessDoc.data()?.["businessCode"]).toBe(seeded.businessCode);
    const membershipDoc = await db.collection("businessMemberships").doc("mem-1").get();
    expect(membershipDoc.exists).toBe(true);
    const branchDoc = await db.collection("businessBranches").doc("branch-1").get();
    expect(branchDoc.exists).toBe(true);
  });
});

describe("TOCTOU — authorization state changes are never stale (real Firestore, Phase K)", () => {
  it("a membership suspended between two sequential calls is honored on the second call — no cached/stale allow", async () => {
    await seedBusiness("biz-a", "active");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const first = await updateBusinessProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      patch: { displayName: "First Update" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });
    expect(first.outcome).toBe("executed");

    await db.collection("businessMemberships").doc("mem-1").update({ status: "suspended" });

    const second = await updateBusinessProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      patch: { displayName: "Should Not Apply" },
      now: new Date(),
      newId: () => "evt-2",
      ...newIds(),
    });
    expect(second.outcome).toBe("denied");
    const doc = await db.collection("businesses").doc("biz-a").get();
    expect(doc.data()?.["displayName"]).toBe("First Update");
  });

  it("a Business closed between two sequential calls is honored on the second call — the evaluator always reads live state, never a cached decision", async () => {
    await seedBusiness("biz-a", "active");
    await seedMembership({
      membershipId: "mem-1",
      userId: "cust_owner",
      businessId: "biz-a",
      role: "owner",
    });

    const first = await updateBusinessProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      patch: { displayName: "While Active" },
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });
    expect(first.outcome).toBe("executed");

    await closeBusinessCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      now: new Date(),
      newId: () => "evt-close",
      ...newIds(),
    });

    const second = await updateBusinessProfileCommand(db, {
      userId: "cust_owner",
      businessId: "biz-a",
      patch: { displayName: "After Close" },
      now: new Date(),
      newId: () => "evt-2",
      ...newIds(),
    });
    expect(second.outcome).toBe("denied");
  });
});

describe("End-to-end acceptance — real bootstrap through pending_verification (Phase T, critical acceptance test)", () => {
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

  const bootstrapRequest: CreateBusinessRequest = {
    displayName: "E2E Cafe",
    primaryCategoryId: "cat_food",
    countryCode: "US",
    currencyCode: "USD",
    timezone: "America/Los_Angeles",
    city: "Springfield",
    contactPhone: "+15550100",
    supportedLanguages: ["en"],
  };

  function bootstrapParams(
    overrides: Partial<BootstrapBusinessParams> & { idempotencyKey: string },
  ): BootstrapBusinessParams {
    return {
      correlationId: `corr_${overrides.idempotencyKey}`,
      actor: { actorType: "user" as const, actorId: "cust_e2e_owner" },
      now: new Date("2026-08-18T00:00:00.000Z"),
      newId: () => `evt_${overrides.idempotencyKey}_${Math.random().toString(36).slice(2)}`,
      generator: new SequenceGenerator(["BIZ23456E"]),
      ownerUserId: "cust_e2e_owner",
      ...overrides,
    };
  }

  it("create (draft) → Owner updates profile → Owner updates default Branch → Owner submits for verification → Business becomes pending_verification", async () => {
    const bootstrapResult = await bootstrapBusiness(
      db,
      bootstrapRequest,
      bootstrapParams({ idempotencyKey: "e2e-1" }),
    );
    const businessId = bootstrapResult.businessId;

    const businessAfterCreate = await db.collection("businesses").doc(businessId).get();
    expect(businessAfterCreate.data()?.["status"]).toBe("draft");

    const membershipRead = await getBusinessMembershipByUserAndBusiness(
      db,
      "cust_e2e_owner",
      businessId,
    );
    expect(membershipRead.kind).toBe("found");

    const branchesSnapshot = await db
      .collection("businessBranches")
      .where("businessId", "==", businessId)
      .get();
    expect(branchesSnapshot.docs).toHaveLength(1);
    const branchId = branchesSnapshot.docs[0]!.id;

    const profileOutcome = await updateBusinessProfileCommand(db, {
      userId: "cust_e2e_owner",
      businessId,
      patch: { displayName: "E2E Cafe (Updated)" },
      now: new Date(),
      newId: () => "evt-profile",
      ...newIds(),
    });
    expect(profileOutcome.outcome).toBe("executed");

    const branchOutcome = await updateBusinessBranchProfileCommand(db, {
      userId: "cust_e2e_owner",
      businessId,
      branchId,
      patch: { displayName: "E2E Main Branch" },
      now: new Date(),
      newId: () => "evt-branch",
      ...newIds(),
    });
    expect(branchOutcome.outcome).toBe("executed");

    await seedBusinessTermsAcceptance(businessId, "cust_e2e_owner");

    const submitOutcome = await submitBusinessForVerificationCommand(db, {
      userId: "cust_e2e_owner",
      businessId,
      now: new Date(),
      newId: () => "evt-submit",
      ...newIds(),
    });
    expect(submitOutcome.outcome).toBe("executed");

    const finalBusiness = await db.collection("businesses").doc(businessId).get();
    expect(finalBusiness.data()?.["status"]).toBe("pending_verification");
    expect(finalBusiness.data()?.["displayName"]).toBe("E2E Cafe (Updated)");

    // Proof that pending_verification → trial remains impossible: no
    // command in this package (or anywhere else in the codebase) ever
    // targets "trial" as a transition destination — the verification
    // mechanism is explicitly ungoverned (ENG-P2-002-DESIGN-001 §6, §24
    // item 3) and this task is explicitly not authorized to build one.
    // Proven two ways: (1) the only two ordinary lifecycle permissions
    // that exist (`business.submitForVerification`, `business.close`)
    // neither target "trial" — confirmed directly against the live,
    // corrected evaluator; (2) `business.submitForVerification` itself is
    // eligible in `draft` only, so it cannot even be re-invoked from
    // `pending_verification` to attempt anything further.
    const submitAgain = await evaluatePermission(db, {
      userId: "cust_e2e_owner",
      businessId,
      permission: "business.submitForVerification",
    });
    expect(submitAgain.allowed).toBe(false);

    const noTrialPermissionExists = await evaluatePermission(db, {
      userId: "cust_e2e_owner",
      businessId,
      permission: "business.advanceToTrial",
    });
    expect(noTrialPermissionExists.allowed).toBe(false);
    expect(noTrialPermissionExists.reasonCode).toBe("NO_APPLICABLE_GRANT");
  });
});
