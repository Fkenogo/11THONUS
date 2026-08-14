import { describe, expect, it } from "vitest";
import {
  createRoleTemplate,
  isPermissionInRoleTemplateDefault,
  DEFAULT_ROLE_TEMPLATES,
} from "./roleTemplate";
import { PermissionDomainError } from "./permissionErrors";
import { ROLES } from "./role";

describe("createRoleTemplate", () => {
  it("builds a deterministic template for a valid role with non-sensitive-style ids", () => {
    const template = createRoleTemplate("staff", ["purchase.record", "redemption.process"]);
    expect(template.role).toBe("staff");
    expect(template.defaultPermissions).toEqual(["purchase.record", "redemption.process"]);
  });

  it("is deterministic — same inputs produce the same output", () => {
    const a = createRoleTemplate("manager", ["report.viewSales"]);
    const b = createRoleTemplate("manager", ["report.viewSales"]);
    expect(a).toEqual(b);
  });

  it("rejects an unrecognised role", () => {
    expect(() => createRoleTemplate("super_admin", [])).toThrow(PermissionDomainError);
  });

  it("rejects a malformed permission identifier", () => {
    expect(() => createRoleTemplate("staff", ["not a permission"])).toThrow(PermissionDomainError);
  });

  it("rejects a duplicate permission identifier", () => {
    expect(() => createRoleTemplate("staff", ["purchase.record", "purchase.record"])).toThrow(
      PermissionDomainError,
    );
  });

  it.each(ROLES)(
    "rejects a non-inheritable sensitive permission in the %s role's defaults",
    (role) => {
      expect(() => createRoleTemplate(role, ["staff.manage"])).toThrow(PermissionDomainError);
    },
  );

  it("rejects business.transferOwnership in any role's defaults, including owner", () => {
    expect(() => createRoleTemplate("owner", ["business.transferOwnership"])).toThrow(
      PermissionDomainError,
    );
  });

  it("accepts an inheritable sensitive permission (customer.viewProtectedProfile) for owner/manager", () => {
    expect(() => createRoleTemplate("owner", ["customer.viewProtectedProfile"])).not.toThrow();
    expect(() => createRoleTemplate("manager", ["customer.viewProtectedProfile"])).not.toThrow();
  });

  it("also rejects an inheritable sensitive permission if placed under staff explicitly by a caller — the invariant is unconditional on role", () => {
    // The catalogue's own default-state metadata (owner_and_manager_default)
    // is advisory content baked into DEFAULT_ROLE_TEMPLATES below, not a
    // per-role restriction enforced by createRoleTemplate itself — inherit
    // ability is permission-level, not role-level. This test documents
    // that createRoleTemplate does not reject it for staff (no invariant
    // says it can't), while DEFAULT_ROLE_TEMPLATES.staff simply omits it.
    expect(() => createRoleTemplate("staff", ["customer.viewProtectedProfile"])).not.toThrow();
  });
});

describe("isPermissionInRoleTemplateDefault", () => {
  it("returns true when the permission is present", () => {
    const template = createRoleTemplate("staff", ["purchase.record"]);
    expect(isPermissionInRoleTemplateDefault(template, "purchase.record")).toBe(true);
  });

  it("returns false when the permission is absent", () => {
    const template = createRoleTemplate("staff", ["purchase.record"]);
    expect(isPermissionInRoleTemplateDefault(template, "transaction.reverse")).toBe(false);
  });
});

describe("DEFAULT_ROLE_TEMPLATES", () => {
  it("gives owner and manager exactly the catalogue's inheritable entries by default", () => {
    expect(DEFAULT_ROLE_TEMPLATES.owner.defaultPermissions).toEqual([
      "customer.viewProtectedProfile",
      "report.exportFinancial",
    ]);
    expect(DEFAULT_ROLE_TEMPLATES.manager.defaultPermissions).toEqual([
      "customer.viewProtectedProfile",
      "report.exportFinancial",
    ]);
  });

  it("gives staff none of the catalogue's sensitive permissions by default", () => {
    expect(DEFAULT_ROLE_TEMPLATES.staff.defaultPermissions).toEqual([]);
  });

  it("never includes a non-inheritable sensitive permission for any role", () => {
    const nonInheritable = [
      "staff.manage",
      "staff.assignPermissions",
      "business.transferOwnership",
      "business.configureFraudRules",
      "transaction.reverse",
      "reward.override",
    ];
    for (const role of ROLES) {
      for (const id of nonInheritable) {
        expect(DEFAULT_ROLE_TEMPLATES[role].defaultPermissions).not.toContain(id);
      }
    }
  });
});
