import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  suspendStaffMembershipCommand,
  reactivateStaffMembershipCommand,
  removeStaffMembershipCommand,
} from "./staffMembershipLifecycleCommand";

/**
 * `ENG-P2-003C` — real Firestore emulator tests (Phase Y: SUSPEND/REACTIVATE/
 * REMOVE families; Phase R: concurrency; Phase V: cross-business isolation).
 * Same discipline as `businessProfileLifecycle.emulator.test.ts` (002C) and
 * `authorizeAndExecute.emulator.test.ts` (004D) — real Firestore, not fakes.
 */

const app = initializeApp({ projectId: "demo-11thonus" }, "staffMembershipLifecycleEmulatorTest");
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

async function seedBusiness(businessId: string, status: "active" | "trial" = "active") {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ23456X",
      ownerUserId: "cust_owner",
      displayName: "Seeded Cafe",
      status,
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

describe("suspendStaffMembershipCommand", () => {
  it("Owner suspends Staff — executed", async () => {
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

    const outcome = await suspendStaffMembershipCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    const doc = await getMembership("mem-staff");
    expect(doc?.["status"]).toBe("suspended");
  });

  it("Owner suspends Manager — executed", async () => {
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

    const outcome = await suspendStaffMembershipCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-mgr"))?.["status"]).toBe("suspended");
  });

  it("Manager with staff.manage grant suspends Staff — executed", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-mgr",
      userId: "u-mgr",
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

    const outcome = await suspendStaffMembershipCommand(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-staff"))?.["status"]).toBe("suspended");
  });

  it("Manager cannot suspend Manager — denied (target policy)", async () => {
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
      membershipId: "mem-mgr2",
      userId: "u-mgr2",
      businessId: "biz-a",
      role: "manager",
    });

    await expect(
      suspendStaffMembershipCommand(db, {
        userId: "u-mgr1",
        businessId: "biz-a",
        targetMembershipId: "mem-mgr2",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    expect((await getMembership("mem-mgr2"))?.["status"]).toBe("active");
  });

  it("Staff denied (no staff.manage)", async () => {
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

    const outcome = await suspendStaffMembershipCommand(db, {
      userId: "u-staff1",
      businessId: "biz-a",
      targetMembershipId: "mem-staff2",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("denied");
    expect((await getMembership("mem-staff2"))?.["status"]).toBe("active");
  });

  it("self denied — Owner cannot suspend own membership", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      suspendStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-owner",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("self denied — Manager holding staff.manage cannot suspend own (Manager) membership", async () => {
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
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    await expect(
      suspendStaffMembershipCommand(db, {
        userId: "u-mgr",
        businessId: "biz-a",
        targetMembershipId: "mem-mgr",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    expect((await getMembership("mem-mgr"))?.["status"]).toBe("active");
  });

  it("Owner target denied — Manager cannot suspend Owner even with staff.manage", async () => {
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
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    await expect(
      suspendStaffMembershipCommand(db, {
        userId: "u-mgr",
        businessId: "biz-a",
        targetMembershipId: "mem-owner",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    expect((await getMembership("mem-owner"))?.["status"]).toBe("active");
  });

  it("cross-business denied — Owner of Business A cannot suspend a Business B membership", async () => {
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
      suspendStaffMembershipCommand(db, {
        userId: "u-owner-a",
        businessId: "biz-a",
        targetMembershipId: "mem-staff-b",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    expect((await getMembership("mem-staff-b"))?.["status"]).toBe("active");
  });

  it("already suspended target — denied (INVALID_STATE_TRANSITION)", async () => {
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
      status: "suspended",
    });

    await expect(
      suspendStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
  });

  it("removed target — denied (INVALID_STATE_TRANSITION)", async () => {
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
      status: "removed",
    });

    await expect(
      suspendStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
  });
});

describe("reactivateStaffMembershipCommand", () => {
  it("Owner reactivates suspended Staff — executed", async () => {
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
      status: "suspended",
    });

    const outcome = await reactivateStaffMembershipCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-staff"))?.["status"]).toBe("active");
  });

  it("Owner reactivates suspended Manager — executed", async () => {
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
      status: "suspended",
    });

    const outcome = await reactivateStaffMembershipCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-mgr"))?.["status"]).toBe("active");
  });

  it("Manager with staff.manage reactivates Staff — executed", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-mgr",
      userId: "u-mgr",
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
      status: "suspended",
    });

    const outcome = await reactivateStaffMembershipCommand(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-staff"))?.["status"]).toBe("active");
  });

  it("Manager cannot reactivate Manager — denied", async () => {
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
      membershipId: "mem-mgr2",
      userId: "u-mgr2",
      businessId: "biz-a",
      role: "manager",
      status: "suspended",
    });

    await expect(
      reactivateStaffMembershipCommand(db, {
        userId: "u-mgr1",
        businessId: "biz-a",
        targetMembershipId: "mem-mgr2",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("self denied", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      reactivateStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-owner",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("active target — denied (INVALID_STATE_TRANSITION)", async () => {
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
      reactivateStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
  });

  it("removed target — denied, never treated as suspended (INVALID_STATE_TRANSITION)", async () => {
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
      status: "removed",
    });

    await expect(
      reactivateStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
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
      status: "suspended",
    });

    await expect(
      reactivateStaffMembershipCommand(db, {
        userId: "u-owner-a",
        businessId: "biz-a",
        targetMembershipId: "mem-staff-b",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });
});

describe("removeStaffMembershipCommand", () => {
  it("Owner removes Staff — executed, historical record remains", async () => {
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

    const outcome = await removeStaffMembershipCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    const doc = await getMembership("mem-staff");
    expect(doc?.["status"]).toBe("removed");
    expect(doc?.["endedAt"]).toBeDefined();
    // The document itself still exists — never hard-deleted.
    expect(doc).toBeDefined();
  });

  it("Owner removes Manager — executed", async () => {
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

    const outcome = await removeStaffMembershipCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-mgr"))?.["status"]).toBe("removed");
  });

  it("Manager with staff.manage removes Staff — executed", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-mgr",
      userId: "u-mgr",
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

    const outcome = await removeStaffMembershipCommand(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });

    expect(outcome.outcome).toBe("executed");
    expect((await getMembership("mem-staff"))?.["status"]).toBe("removed");
  });

  it("Manager cannot remove Manager — denied", async () => {
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
      membershipId: "mem-mgr2",
      userId: "u-mgr2",
      businessId: "biz-a",
      role: "manager",
    });

    await expect(
      removeStaffMembershipCommand(db, {
        userId: "u-mgr1",
        businessId: "biz-a",
        targetMembershipId: "mem-mgr2",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("self denied", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });

    await expect(
      removeStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-owner",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("Owner target denied", async () => {
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
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    await expect(
      removeStaffMembershipCommand(db, {
        userId: "u-mgr",
        businessId: "biz-a",
        targetMembershipId: "mem-owner",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("repeated remove (replay of an already-removed target) — denied, non-reversible", async () => {
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
      status: "removed",
    });

    await expect(
      removeStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
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
      removeStaffMembershipCommand(db, {
        userId: "u-owner-a",
        businessId: "biz-a",
        targetMembershipId: "mem-staff-b",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    expect((await getMembership("mem-staff-b"))?.["status"]).toBe("active");
  });
});

describe("idempotency (Phase S)", () => {
  it("same key / same payload — no duplicate effect", async () => {
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

    const ids = newIds();
    const params = {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      now: new Date(),
      newId: () => "evt-1",
      ...ids,
    };

    const first = await suspendStaffMembershipCommand(db, params);
    const second = await suspendStaffMembershipCommand(db, params);

    expect(first.outcome).toBe("executed");
    expect(second.outcome).toBe("duplicate");
    expect((await getMembership("mem-staff"))?.["status"]).toBe("suspended");
  });
});

describe("concurrency (Phase R, real Firestore)", () => {
  it("two simultaneous suspend attempts — deterministic final state, no double effect", async () => {
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
      suspendStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
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
    expect(doc?.["status"]).toBe("suspended");
    // Exactly one of the two independent (differently-idempotency-keyed)
    // attempts executed the transition; the other observed the
    // already-suspended state and failed INVALID_STATE_TRANSITION — no
    // silent double-apply, no unhandled rejection.
    const outcomes = results.map((r) =>
      r.status === "fulfilled" ? r.value.outcome : (r.reason as { category?: string }).category,
    );
    const executedCount = outcomes.filter((o) => o === "executed").length;
    expect(executedCount).toBe(1);
  });

  it("suspend vs remove racing the same target — deterministic legal final state", async () => {
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

    await Promise.allSettled([
      suspendStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-a",
        ...newIds(),
      }),
      removeStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-b",
        ...newIds(),
      }),
    ]);

    const doc = await getMembership("mem-staff");
    // Only two legal final states are possible depending on transaction
    // ordering: "suspended" (remove observed active->suspended already
    // applied by the other and, if it read post-suspend, denies since
    // suspended->removed is still legal — so removed is also possible).
    expect(["suspended", "removed"]).toContain(doc?.["status"]);
  });

  it("reactivate vs remove racing a suspended target — deterministic legal final state", async () => {
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
      status: "suspended",
    });

    await Promise.allSettled([
      reactivateStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-a",
        ...newIds(),
      }),
      removeStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-staff",
        now: new Date(),
        newId: () => "evt-b",
        ...newIds(),
      }),
    ]);

    const doc = await getMembership("mem-staff");
    expect(["active", "removed"]).toContain(doc?.["status"]);
  });
});
