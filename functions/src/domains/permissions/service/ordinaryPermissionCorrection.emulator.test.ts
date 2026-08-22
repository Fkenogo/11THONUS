import { randomUUID } from "node:crypto";
import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { touchPermissionBoundaryFixture } from "./touchPermissionBoundaryFixtureCommand";

/**
 * `ENG-P2-004-CORR-001` — 002C compatibility proof (Phase Q).
 *
 * Proves, against real Firestore (not fixtures), that the four
 * Founder-approved ordinary permissions
 * (`business.updateProfile`/`businessBranch.updateProfile`/
 * `business.submitForVerification`/`business.close`) now authorize
 * correctly through the exact same trusted `authorizeAndExecute`
 * boundary (`ENG-P2-004D`) the paused `ENG-P2-002C` command contracts
 * (`businessProfileCommand.ts`, `businessBranchProfileCommand.ts`,
 * `businessLifecycleCommand.ts`) already call unmodified — reusing the
 * existing `touchPermissionBoundaryFixture` test-only shim (Phase G,
 * `ENG-P2-004D`) rather than a second production implementation of any
 * 002C command. This file does not read, write, or import anything from
 * the paused `ENG-P2-002C` worktree/branch.
 */

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "ordinaryPermissionCorrectionEmulatorTest",
);
const db = getFirestore(app);

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
    "businessMemberships",
    "outboxEntries",
    "permissionBoundaryTestFixtures",
    "idempotencyRecords",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

async function seedBusiness(businessId: string, status: string) {
  await db.collection("businesses").doc(businessId).set({ status });
}

async function seedMembership(params: {
  membershipId: string;
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
}) {
  await db.collection("businessMemberships").doc(params.membershipId).set({
    userId: params.userId,
    businessId: params.businessId,
    role: params.role,
    status: "active",
    permissions: [],
  });
}

function newIds() {
  const id = randomUUID();
  return { idempotencyKey: id, requestHash: `hash-${id}`, correlationId: `corr-${id}` };
}

describe("ENG-P2-004-CORR-001 — 002C compatibility proof: business.updateProfile", () => {
  it("Owner on a draft Business → executed (the CAP-P3-BIZ-AUTH-001 deadlock is resolved)", async () => {
    await seedBusiness("biz-a", "draft");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "business.updateProfile",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
  });

  it("Owner on a suspended Business → denied (FD-CORR-5/7)", async () => {
    await seedBusiness("biz-a", "suspended");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "business.updateProfile",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("Manager on an active Business → denied (FD-CORR-4)", async () => {
    await seedBusiness("biz-a", "active");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "manager",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "business.updateProfile",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });
});

describe("ENG-P2-004-CORR-001 — 002C compatibility proof: businessBranch.updateProfile", () => {
  it("Owner on a pending_verification Business → executed", async () => {
    await seedBusiness("biz-a", "pending_verification");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "businessBranch.updateProfile",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
  });
});

describe("ENG-P2-004-CORR-001 — 002C compatibility proof: business.submitForVerification", () => {
  it("Owner on a draft Business → executed", async () => {
    await seedBusiness("biz-a", "draft");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "business.submitForVerification",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
  });

  it("Owner on a pending_verification Business → denied (narrowness — Phase H)", async () => {
    await seedBusiness("biz-a", "pending_verification");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "business.submitForVerification",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });
});

describe("ENG-P2-004-CORR-001 — 002C compatibility proof: business.close", () => {
  it("Owner on a suspended Business → executed (any non-terminal → closed)", async () => {
    await seedBusiness("biz-a", "suspended");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "business.close",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
  });

  it("Owner on an already-closed Business → denied (terminal)", async () => {
    await seedBusiness("biz-a", "closed");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "business.close",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });
});

describe("ENG-P2-004-CORR-001 — 002C compatibility proof: sensitive-permission non-regression through the same boundary", () => {
  it("a sensitive permission (business.configureFraudRules — carries no ENG-P2-004-CORR-003 lifecycle override) on a draft Business still denies through authorizeAndExecute", async () => {
    // Was `staff.manage` — ENG-P2-004-CORR-003 (Founder-approved) intentionally
    // widened staff.manage's own lifecycle eligibility to include `draft`, so
    // it is no longer a valid example of "the general sensitive gate is
    // unchanged." Swapped to a permission with no lifecycle override, which
    // still proves the general boundary behavior this test exists to cover.
    // See `evaluatePermission.corr003.test.ts` for staff.manage's own,
    // intentionally different, CORR-003 lifecycle proof.
    await seedBusiness("biz-a", "draft");
    await seedMembership({
      membershipId: "mem-1",
      userId: "user-1",
      businessId: "biz-a",
      role: "owner",
    });

    const outcome = await touchPermissionBoundaryFixture(db, {
      userId: "user-1",
      businessId: "biz-a",
      permission: "business.configureFraudRules",
      fixtureId: "fixture-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });
});
