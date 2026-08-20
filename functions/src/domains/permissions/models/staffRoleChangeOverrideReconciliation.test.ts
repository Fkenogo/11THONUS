import { describe, expect, it } from "vitest";
import { reconcilePermissionOverridesForRoleChange } from "./staffRoleChangeOverrideReconciliation";
import type { RawPermissionOverrideRecord } from "./businessMembershipDocument";

const CONTEXT_BASE = { businessId: "biz_1", membershipId: "mem_1" };

function override(
  overrides: Partial<RawPermissionOverrideRecord> = {},
): RawPermissionOverrideRecord {
  return {
    permissionId: "business.configureFraudRules",
    direction: "grant",
    grantedBy: "owner_1",
    grantedAt: new Date("2026-08-20T00:00:00.000Z"),
    ...overrides,
  };
}

describe("reconcilePermissionOverridesForRoleChange", () => {
  it("removes a Manager-eligible grant when the new role is Staff", () => {
    const result = reconcilePermissionOverridesForRoleChange([override({ direction: "grant" })], {
      ...CONTEXT_BASE,
      newRole: "staff",
    });
    expect(result.retained).toHaveLength(0);
    expect(result.removed).toHaveLength(1);
  });

  it("retains a Manager-eligible grant when the new role is (still) Manager", () => {
    const result = reconcilePermissionOverridesForRoleChange([override({ direction: "grant" })], {
      ...CONTEXT_BASE,
      newRole: "manager",
    });
    expect(result.retained).toHaveLength(1);
    expect(result.removed).toHaveLength(0);
  });

  it("retains a revoke override across a Manager -> Staff role change (role-independent per existing contract)", () => {
    const result = reconcilePermissionOverridesForRoleChange([override({ direction: "revoke" })], {
      ...CONTEXT_BASE,
      newRole: "staff",
    });
    expect(result.retained).toHaveLength(1);
    expect(result.removed).toHaveLength(0);
  });

  it("retains a revoke override across a Staff -> Manager role change", () => {
    const result = reconcilePermissionOverridesForRoleChange([override({ direction: "revoke" })], {
      ...CONTEXT_BASE,
      newRole: "manager",
    });
    expect(result.retained).toHaveLength(1);
    expect(result.removed).toHaveLength(0);
  });

  it("handles a mixed set: removes the invalid grant, keeps the revoke", () => {
    const grant = override({ permissionId: "staff.manage", direction: "grant" });
    const revoke = override({ permissionId: "staff.assignPermissions", direction: "revoke" });
    const result = reconcilePermissionOverridesForRoleChange([grant, revoke], {
      ...CONTEXT_BASE,
      newRole: "staff",
    });
    expect(result.retained).toEqual([revoke]);
    expect(result.removed).toEqual([grant]);
  });

  it("returns empty retained/removed for an empty input", () => {
    const result = reconcilePermissionOverridesForRoleChange([], {
      ...CONTEXT_BASE,
      newRole: "staff",
    });
    expect(result.retained).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
  });

  it("does not mutate order or attribution of retained overrides", () => {
    const revoke = override({
      permissionId: "staff.manage",
      direction: "revoke",
      grantedBy: "owner_specific",
      grantedAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const result = reconcilePermissionOverridesForRoleChange([revoke], {
      ...CONTEXT_BASE,
      newRole: "manager",
    });
    expect(result.retained[0]).toBe(revoke);
  });
});
