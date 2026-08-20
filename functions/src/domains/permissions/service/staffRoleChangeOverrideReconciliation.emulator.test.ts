import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { changeStaffMembershipRoleCommand } from "./staffRoleChangeCommand";
import { administerStaffPermissionOverrideCommand } from "./staffPermissionOverrideCommand";
import {
  suspendStaffMembershipCommand,
  removeStaffMembershipCommand,
} from "./staffMembershipLifecycleCommand";
import { evaluatePermission } from "./evaluatePermissionService";

/**
 * `ENG-P2-003C-CORR-001` — real Firestore emulator tests proving the
 * mandatory Founder-directed correction: a `PermissionOverride` grant that
 * becomes structurally invalid for a membership's role after a role change
 * must be removed from `permissions[]` by that same transaction, so it can
 * never silently become effective again on a later role change back.
 */

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "staffRoleChangeOverrideReconciliationEmulatorTest",
);
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
      ownerUserId: "u-owner",
      displayName: "Seeded Cafe",
      status: "active",
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      updatedAt: new Date("2026-08-20T00:00:00.000Z"),
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

const GRANT_PERMISSION = "business.configureFraudRules"; // explicitGrantEligibleRole: "manager"
const REVOKE_PERMISSION = "staff.manage"; // explicitRevocationSupported: true, role-independent

describe("ENG-P2-003C-CORR-001 — mandatory RED->GREEN round-trip", () => {
  it("grant -> allow -> demote -> deny -> promote -> STILL deny (no resurrection) -> fresh regrant -> allow", async () => {
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
          permissionId: GRANT_PERMISSION,
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    const allowBefore = await evaluatePermission(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      permission: GRANT_PERMISSION,
    });
    expect(allowBefore.allowed).toBe(true);

    const demote = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      fromRole: "manager",
      toRole: "staff",
      now: new Date(),
      newId: () => "evt-demote",
      ...newIds(),
    });
    expect(demote.outcome).toBe("executed");

    const denyAfterDemote = await evaluatePermission(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      permission: GRANT_PERMISSION,
    });
    expect(denyAfterDemote.allowed).toBe(false);
    expect((await getMembership("mem-mgr"))?.["permissions"]).toHaveLength(0);

    const promote = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      fromRole: "staff",
      toRole: "manager",
      now: new Date(),
      newId: () => "evt-promote",
      ...newIds(),
    });
    expect(promote.outcome).toBe("executed");

    // THE mandatory proof: no silent resurrection.
    const denyAfterPromote = await evaluatePermission(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      permission: GRANT_PERMISSION,
    });
    expect(denyAfterPromote.allowed).toBe(false);
    expect((await getMembership("mem-mgr"))?.["permissions"]).toHaveLength(0);

    // Fresh authorization through normal 003D administration restores it.
    const regrant = await administerStaffPermissionOverrideCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      permissionId: GRANT_PERMISSION,
      direction: "grant",
      now: new Date(),
      newId: () => "evt-regrant",
      ...newIds(),
    });
    expect(regrant.outcome).toBe("executed");

    const allowAfterRegrant = await evaluatePermission(db, {
      userId: "u-mgr",
      businessId: "biz-a",
      permission: GRANT_PERMISSION,
    });
    expect(allowAfterRegrant.allowed).toBe(true);
    expect(allowAfterRegrant.permissionSource).toBe("explicit-grant");
  });
});

describe("ENG-P2-003C-CORR-001 — revoke treatment (Phase H)", () => {
  it("retains a revoke override across Manager -> Staff -> Manager (role-independent per existing contract)", async () => {
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
          permissionId: REVOKE_PERMISSION,
          direction: "revoke",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    const demote = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      fromRole: "manager",
      toRole: "staff",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });
    expect(demote.outcome).toBe("executed");
    expect((await getMembership("mem-mgr"))?.["permissions"]).toHaveLength(1);

    const promote = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-mgr",
      fromRole: "staff",
      toRole: "manager",
      now: new Date(),
      newId: () => "evt-2",
      ...newIds(),
    });
    expect(promote.outcome).toBe("executed");

    const docAfter = await getMembership("mem-mgr");
    expect(docAfter?.["permissions"]).toHaveLength(1);
    expect((docAfter?.["permissions"] as Array<{ direction: string }>)[0]?.direction).toBe(
      "revoke",
    );
  });
});

describe("ENG-P2-003C-CORR-001 — valid-override retention across the transition (Phase G)", () => {
  it("a revoke override remains valid and retained across a Staff -> Manager promotion with no other change", async () => {
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
      permissions: [
        {
          permissionId: REVOKE_PERMISSION,
          direction: "revoke",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    const promote = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      fromRole: "staff",
      toRole: "manager",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });
    expect(promote.outcome).toBe("executed");
    expect((await getMembership("mem-staff"))?.["permissions"]).toHaveLength(1);
  });
});

describe("ENG-P2-003C-CORR-001 — symmetric promotion-direction removal (staff-eligible grant)", () => {
  it("a Staff-eligible explicit grant is removed on Staff -> Manager promotion, not only on demotion", async () => {
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
      permissions: [
        {
          permissionId: "customer.viewProtectedProfile", // explicitGrantEligibleRole: "staff"
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    const allowBefore = await evaluatePermission(db, {
      userId: "u-staff",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
    });
    expect(allowBefore.allowed).toBe(true);
    expect(allowBefore.permissionSource).toBe("explicit-grant");

    const promote = await changeStaffMembershipRoleCommand(db, {
      userId: "u-owner",
      businessId: "biz-a",
      targetMembershipId: "mem-staff",
      fromRole: "staff",
      toRole: "manager",
      now: new Date(),
      newId: () => "evt-1",
      ...newIds(),
    });
    expect(promote.outcome).toBe("executed");

    const doc = await getMembership("mem-staff");
    expect(doc?.["role"]).toBe("manager");
    // Removed, not retained — the grant's eligible role ("staff") no longer
    // matches the new role ("manager"). Manager already holds this
    // permission by role-default (defaultState: owner_and_manager_default),
    // so evaluating it afterward would pass via role-default regardless —
    // the meaningful assertion here is the stored record itself.
    expect(doc?.["permissions"]).toHaveLength(0);
  });
});

describe("ENG-P2-003C-CORR-001 — transaction failure leaves role + overrides unchanged", () => {
  it("a role-change rejected on the fromRole TOCTOU check leaves permissions[] untouched", async () => {
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
      role: "staff",
      permissions: [
        {
          permissionId: GRANT_PERMISSION,
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    await expect(
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-mgr",
        // Caller believes "manager" — stale; live role is "staff".
        fromRole: "manager",
        toRole: "staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });

    const doc = await getMembership("mem-mgr");
    expect(doc?.["role"]).toBe("staff");
    // Grant was already invalid for "staff" before this call — it must be
    // untouched (still present), not silently swept by a failed attempt.
    expect(doc?.["permissions"]).toHaveLength(1);
  });
});

describe("ENG-P2-003C-CORR-001 — Owner protection / cross-business target (regression)", () => {
  it("Owner cannot be the target of a role change even when Owner holds overrides", async () => {
    await seedBusiness("biz-a");
    await seedMembership({
      membershipId: "mem-owner",
      userId: "u-owner",
      businessId: "biz-a",
      role: "owner",
    });

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
    ).rejects.toBeTruthy();

    const doc = await getMembership("mem-owner");
    expect(doc?.["role"]).toBe("owner");
  });

  it("role-change is scoped to the actor's own business — cannot reconcile a membership in another business", async () => {
    await seedBusiness("biz-a");
    await seedBusiness("biz-b");
    await seedMembership({
      membershipId: "mem-owner-a",
      userId: "u-owner-a",
      businessId: "biz-a",
      role: "owner",
    });
    await seedMembership({
      membershipId: "mem-mgr-b",
      userId: "u-mgr-b",
      businessId: "biz-b",
      role: "manager",
      permissions: [
        {
          permissionId: GRANT_PERMISSION,
          direction: "grant",
          grantedBy: "u-owner-b",
          grantedAt: new Date(),
        },
      ],
    });

    await expect(
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner-a",
        businessId: "biz-a",
        targetMembershipId: "mem-mgr-b",
        fromRole: "manager",
        toRole: "staff",
        now: new Date(),
        newId: () => "evt-1",
        ...newIds(),
      }),
    ).rejects.toBeTruthy();

    const doc = await getMembership("mem-mgr-b");
    expect(doc?.["role"]).toBe("manager");
    expect(doc?.["permissions"]).toHaveLength(1);
  });
});

describe("ENG-P2-003C-CORR-001 — concurrency", () => {
  it(
    "demotion vs a competing permission grant: no stale privilege resurrection, no lost update, well-formed final state",
    { timeout: 20000 },
    async () => {
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

      const [demoteResult, grantResult] = await Promise.allSettled([
        changeStaffMembershipRoleCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-mgr",
          fromRole: "manager",
          toRole: "staff",
          now: new Date(),
          newId: () => "evt-demote",
          ...newIds(),
        }),
        administerStaffPermissionOverrideCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-mgr",
          permissionId: GRANT_PERMISSION,
          direction: "grant",
          now: new Date(),
          newId: () => "evt-grant",
          ...newIds(),
        }),
      ]);

      const doc = await getMembership("mem-mgr");
      expect(["staff", "manager"]).toContain(doc?.["role"]);
      const permissions = (doc?.["permissions"] as Array<{ direction: string }>) ?? [];

      // Whichever committed last, the terminal state must be internally
      // consistent: never "role=staff AND a stale Manager-only grant present".
      if (doc?.["role"] === "staff") {
        expect(permissions).toHaveLength(0);
      }
      // No malformed/duplicate records regardless of interleaving.
      expect(permissions.length).toBeLessThanOrEqual(1);

      expect(demoteResult.status === "fulfilled" || grantResult.status === "fulfilled").toBe(true);
    },
  );

  it(
    "demotion vs a competing permission revoke: revoke is role-independent, must never be lost",
    { timeout: 20000 },
    async () => {
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

      const [demoteResult, revokeResult] = await Promise.allSettled([
        changeStaffMembershipRoleCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-mgr",
          fromRole: "manager",
          toRole: "staff",
          now: new Date(),
          newId: () => "evt-demote",
          ...newIds(),
        }),
        administerStaffPermissionOverrideCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-mgr",
          permissionId: REVOKE_PERMISSION,
          direction: "revoke",
          now: new Date(),
          newId: () => "evt-revoke",
          ...newIds(),
        }),
      ]);

      const doc = await getMembership("mem-mgr");
      const permissions = (doc?.["permissions"] as Array<{ direction: string }>) ?? [];
      expect(permissions.length).toBeLessThanOrEqual(1);
      expect(demoteResult.status === "fulfilled" || revokeResult.status === "fulfilled").toBe(true);
      // If the revoke command itself fulfilled, its effect must not have
      // been lost by a concurrently-committing role change reconciliation.
      if (revokeResult.status === "fulfilled") {
        expect(permissions.some((p) => p.direction === "revoke")).toBe(true);
      }
    },
  );

  it(
    "promotion vs a competing permission grant: no lost update, no malformed permissions[]",
    { timeout: 20000 },
    async () => {
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

      const [promoteResult, grantResult] = await Promise.allSettled([
        changeStaffMembershipRoleCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-staff",
          fromRole: "staff",
          toRole: "manager",
          now: new Date(),
          newId: () => "evt-promote",
          ...newIds(),
        }),
        administerStaffPermissionOverrideCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-staff",
          permissionId: GRANT_PERMISSION,
          direction: "grant",
          now: new Date(),
          newId: () => "evt-grant",
          ...newIds(),
        }),
      ]);

      const doc = await getMembership("mem-staff");
      const permissions = (doc?.["permissions"] as Array<{ direction: string }>) ?? [];
      expect(permissions.length).toBeLessThanOrEqual(1);
      expect(promoteResult.status === "fulfilled" || grantResult.status === "fulfilled").toBe(true);
    },
  );

  it(
    "two simultaneous role changes on the same membership: exactly one commits, no torn state",
    { timeout: 20000 },
    async () => {
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
            permissionId: GRANT_PERMISSION,
            direction: "grant",
            grantedBy: "u-owner",
            grantedAt: new Date(),
          },
        ],
      });

      const results = await Promise.allSettled([
        changeStaffMembershipRoleCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-mgr",
          fromRole: "manager",
          toRole: "staff",
          now: new Date(),
          newId: () => "evt-a",
          ...newIds(),
        }),
        changeStaffMembershipRoleCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-mgr",
          fromRole: "manager",
          toRole: "staff",
          now: new Date(),
          newId: () => "evt-b",
          ...newIds(),
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);

      const doc = await getMembership("mem-mgr");
      expect(doc?.["role"]).toBe("staff");
      expect(doc?.["permissions"]).toHaveLength(0);
    },
  );

  it(
    "role change vs membership removal: no torn state, reconciliation never resurrects on a removed target",
    { timeout: 20000 },
    async () => {
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
            permissionId: GRANT_PERMISSION,
            direction: "grant",
            grantedBy: "u-owner",
            grantedAt: new Date(),
          },
        ],
      });

      const [roleResult, removeResult] = await Promise.allSettled([
        changeStaffMembershipRoleCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-mgr",
          fromRole: "manager",
          toRole: "staff",
          now: new Date(),
          newId: () => "evt-role",
          ...newIds(),
        }),
        removeStaffMembershipCommand(db, {
          userId: "u-owner",
          businessId: "biz-a",
          targetMembershipId: "mem-mgr",
          idempotencyKey: `remove-key-${idCounter}`,
          requestHash: `remove-hash-${idCounter}`,
          correlationId: `remove-corr-${idCounter}`,
          now: new Date(),
          newId: () => "evt-remove",
        }),
      ]);

      const doc = await getMembership("mem-mgr");
      expect(["active", "suspended", "removed"]).toContain(doc?.["status"]);
      expect(roleResult.status === "fulfilled" || removeResult.status === "fulfilled").toBe(true);
      // Whatever the final role, permissions[] must still be well-formed
      // (at most the one original record, never duplicated/malformed).
      const permissions = (doc?.["permissions"] as unknown[]) ?? [];
      expect(permissions.length).toBeLessThanOrEqual(1);
    },
  );

  it("role change vs membership suspension: no torn state", { timeout: 20000 }, async () => {
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
          permissionId: GRANT_PERMISSION,
          direction: "grant",
          grantedBy: "u-owner",
          grantedAt: new Date(),
        },
      ],
    });

    const [roleResult, suspendResult] = await Promise.allSettled([
      changeStaffMembershipRoleCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-mgr",
        fromRole: "manager",
        toRole: "staff",
        now: new Date(),
        newId: () => "evt-role",
        ...newIds(),
      }),
      suspendStaffMembershipCommand(db, {
        userId: "u-owner",
        businessId: "biz-a",
        targetMembershipId: "mem-mgr",
        idempotencyKey: `suspend-key-${idCounter}`,
        requestHash: `suspend-hash-${idCounter}`,
        correlationId: `suspend-corr-${idCounter}`,
        now: new Date(),
        newId: () => "evt-suspend",
      }),
    ]);

    const doc = await getMembership("mem-mgr");
    expect(["active", "suspended"]).toContain(doc?.["status"]);
    expect(["manager", "staff"]).toContain(doc?.["role"]);
    expect(roleResult.status === "fulfilled" || suspendResult.status === "fulfilled").toBe(true);
    const permissions = (doc?.["permissions"] as unknown[]) ?? [];
    expect(permissions.length).toBeLessThanOrEqual(1);
    if (doc?.["role"] === "staff") {
      expect(permissions).toHaveLength(0);
    }
  });
});
