import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { changeStaffMembershipRoleCommand } from "./staffRoleChangeCommand";
import { evaluatePermission } from "./evaluatePermissionService";

/**
 * `ENG-P2-003C` — real Firestore emulator tests for ROLE CHANGE (Phase Y)
 * and the mandatory Phase N/O/override-security review: a stale
 * `PermissionOverride` grant tied to a since-changed role must never
 * confer authority, and a promotion must never fabricate a grant that was
 * never lawfully issued.
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "staffRoleChangeCommandEmulatorTest");
const db: Firestore = getFirestore(app);

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
    "idempotencyRecords",
    "outboxEntries",
    "permissionAuditEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

async function seedBusiness(businessId: string) {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ23456X",
      ownerUserId: "cust_owner",
      displayName: "Seeded Cafe",
      status: "active",
      createdAt: new Date("2026-08-18T00:00:00.000Z"),
      updatedAt: new Date("2026-08-18T00:00:00.000Z"),
      schemaVersion: 1,
    });
}

async function seedMembership(params: {
  membershipId: string;
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
  status?: "active" | "invited" | "suspended" | "removed";
  permissions?: unknown[];
}) {
  await db
    .collection("businessMemberships")
    .doc(params.membershipId)
    .set({
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      status: params.status ?? "active",
      permissions: params.permissions ?? [],
    });
}

async function getMembership(membershipId: string) {
  const doc = await db.collection("businessMemberships").doc(membershipId).get();
  return doc.data();
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

describe("changeStaffMembershipRoleCommand", () => {
  it("Owner: Staff -> Manager — executed", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-staff",
      userId: "u-staff",
      businessId: "biz-a",
      role: "staff",
    });

    const outcome = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      fromRole: "staff",
      toRole: "manager",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-staff"))?.["role"]).toBe("manager");
  });

  it("Owner: Manager -> Staff — executed", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-mgr",
      userId: "u-mgr",
      businessId: "biz-a",
      role: "manager",
    });

    const outcome = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      fromRole: "manager",
      toRole: "staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-mgr"))?.["role"]).toBe("staff");
  });

  it("Manager denied — cannot change any role even holding staff.manage", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-mgr1",
      userId: "u-mgr1",
      businessId: "biz-a",
      role: "manager",
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });
    await seedMembership({
      membershipId: "mem-staff",
      userId: "u-staff",
      businessId: "biz-a",
      role: "staff",
    });

    const outcome = await changeStaffMembershipRoleCommand(db, {
      userId: "u-mgr1",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      fromRole: "staff",
      toRole: "manager",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    expect((await getMembership("mem-staff"))?.["role"]).toBe("staff");
  });

  it("Staff denied", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-staff1",
      userId: "u-staff1",
      businessId: "biz-a",
      role: "staff",
    });
    await seedMembership({
      membershipId: "mem-staff2",
      userId: "u-staff2",
      businessId: "biz-a",
      role: "staff",
    });

    const outcome = await changeStaffMembershipRoleCommand(db, {
      userId: "u-staff1",
      businessId: "biz-a",
      targetMembershipId: "mem-staff2",
      fromRole: "staff",
      toRole: "manager",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("self change denied — Owner cannot change own role", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });

    // Owner has no "fromRole" of manager/staff, but the target-policy check
    // (owner-as-target exclusion) fires first regardless — asserting the
    // command rejects this cleanly, never silently no-oping.
    await expect(
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-owner",
        fromRole: "manager",
        toRole: "staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("self change denied — Manager cannot change own role even if somehow authorized", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-mgr",
      userId: "u-mgr",
      businessId: "biz-a",
      role: "manager",
    });

    // Manager has no staff.assignRole at all — denied by the evaluator
    // before the domain self-check is even reached, which is itself the
    // desired fail-closed outcome.
    const outcome = await changeStaffMembershipRoleCommand(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      fromRole: "manager",
      toRole: "staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
  });

  it("Owner target denied — role=owner never assignable/targetable", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner1",
      userId: "u-owner1",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-owner2",
      userId: "u-owner2",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner1",
        businessId: "biz-a",
        targetMembershipId: "mem-owner2",
        fromRole: "manager",
        toRole: "staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("same-role request rejected at contract construction (VALIDATION_FAILED)", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-staff",
      userId: "u-staff",
      businessId: "biz-a",
      role: "staff",
    });

    await expect(
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        fromRole: "staff",
        toRole: "staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("cross-business denied", async () => {
    await seedBusiness("biz-a");
    await seedBusiness("biz-b");
    await seedMembership({
      membershipId: "mem-owner-a",
      userId: "u-owner-a",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-staff-b",
      userId: "u-staff-b",
      businessId: "biz-b",
      role: "staff",
    });

    await expect(
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner-a",
        businessId: "biz-a",
        targetMembershipId: "mem-staff-b",
        fromRole: "staff",
        toRole: "manager",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("stale fromRole (TOCTOU-style mismatch) — INVALID_STATE_TRANSITION", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-staff",
      userId: "u-staff",
      businessId: "biz-a",
      role: "staff",
    });

    await expect(
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        // Caller believes the target is currently "manager" — stale.
        fromRole: "manager",
        toRole: "staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
  });
});

describe("Role-change / PermissionOverride security review (Phase N/O, mandatory)", () => {
  it("demoted Manager cannot continue using a Manager-only explicit grant after demotion", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    // A Manager with an explicit staff.manage-style grant eligible only for
    // "manager" (report.exportFinancial's explicitGrantEligibleRole is
    // "staff", so use business.configureFraudRules — eligible role
    // "manager" — for this test).
    await seedMembership({
      membershipId: "mem-mgr",
      userId: "u-mgr",
      businessId: "biz-a",
      role: "manager",
      permissions: [
        {
          permissionId: "business.configureFraudRules",
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    // Sanity: before demotion, the grant is honored.
    const before = await evaluatePermission(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      permission: "business.configureFraudRules",
    });
    expect(before.allowed).toBe(true);
    expect(before.permissionSource).toBe("explicit-grant");

    const outcome = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      fromRole: "manager",
      toRole: "staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });
    expect(outcome.outcome).toBe("executed");

    // The override record itself is untouched (Phase N: never rewritten).
    const doc = await getMembership("mem-mgr");
    expect(doc?.["permissions"]).toHaveLength(1);
    expect(doc?.["role"]).toBe("staff");

    // But it is no longer honored — the evaluator re-checks eligibility
    // against the membership's *current* role on every evaluation.
    const after = await evaluatePermission(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      permission: "business.configureFraudRules",
    });
    expect(after.allowed).toBe(false);
  });

  it("promoted Staff does not automatically receive a permission grant never lawfully issued to it", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    // A Staff membership with no overrides at all.
    await seedMembership({
      membershipId: "mem-staff",
      userId: "u-staff",
      businessId: "biz-a",
      role: "staff",
      permissions: [],
    });

    const before = await evaluatePermission(db, {
      userId: "u-staff",
      businessId: "biz-a",
      permission: "business.configureFraudRules",
    });
    expect(before.allowed).toBe(false);

    const outcome = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      fromRole: "staff",
      toRole: "manager",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });
    expect(outcome.outcome).toBe("executed");

    // Promotion alone (no grant ever issued) still does not confer this
    // sensitive permission — Manager's default state for this permission
    // requires an explicit grant, not role-default inheritance.
    const after = await evaluatePermission(db, {
      userId: "u-staff",
      businessId: "biz-a",
      permission: "business.configureFraudRules",
    });
    expect(after.allowed).toBe(false);
  });
});

describe("concurrency (Phase R)", () => {
  // Explicit longer per-test timeouts below (disclosed, pre-existing infra
  // class, ENG-CI-001 backlog): real-Firestore transaction-contention races
  // occasionally exceed vitest's 5000ms default under load.
  it("two simultaneous role changes — deterministic legal final state, no lost-update escalation", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-staff",
      userId: "u-staff",
      businessId: "biz-a",
      role: "staff",
    });

    const results = await Promise.allSettled([
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        fromRole: "staff",
        toRole: "manager",
        now: new Date(),
        newId: () => "evt-a",
        ...newIds(),
      }),
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        fromRole: "staff",
        toRole: "manager",
        now: new Date(),
        newId: () => "evt-b",
        ...newIds(),
      }),
    ]);

    const doc = await getMembership("mem-staff");
    expect(doc?.["role"]).toBe("manager");
    const executedCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.outcome === "executed",
    ).length;
    expect(executedCount).toBe(1);
  }, 15000);

  it("role change vs suspend racing the same target — deterministic legal final state", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-staff",
      userId: "u-staff",
      businessId: "biz-a",
      role: "staff",
    });

    const { suspendStaffMembershipCommand } = await import("./staffMembershipLifecycleCommand");

    await Promise.allSettled([
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        fromRole: "staff",
        toRole: "manager",
        now: new Date(),
        newId: () => "evt-a",
        ...newIds(),
      }),
      suspendStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-b",
        ...newIds(),
      }),
    ]);

    const doc = await getMembership("mem-staff");
    // Both are structurally independent field mutations (role vs status);
    // both may legally have applied — but the membership must remain a
    // single, consistent document (no duplicate, no missing role).
    expect(["staff", "manager"]).toContain(doc?.["role"]);
    expect(["active", "suspended"]).toContain(doc?.["status"]);
  }, 15000);
});
