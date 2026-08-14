import { describe, expect, it } from "vitest";
import {
  SENSITIVE_PERMISSION_CATALOGUE,
  SENSITIVE_PERMISSION_IDS,
  isSensitivePermission,
  getSensitivePermissionEntry,
  getInheritableSensitivePermissionEntries,
} from "./sensitivePermissionCatalogue";
import { isWellFormedPermissionId } from "./permissionId";
import { PermissionDomainError } from "./permissionErrors";

const EXPECTED_IDS = [
  "staff.manage",
  "staff.assignPermissions",
  "business.transferOwnership",
  "business.configureFraudRules",
  "transaction.reverse",
  "reward.override",
  "customer.viewProtectedProfile",
  "report.exportFinancial",
] as const;

describe("SENSITIVE_PERMISSION_CATALOGUE", () => {
  it("has exactly the eight entries the approved design specifies, in order", () => {
    expect(SENSITIVE_PERMISSION_CATALOGUE.map((entry) => entry.id)).toEqual(EXPECTED_IDS);
  });

  it("has no duplicate ids", () => {
    const ids = SENSITIVE_PERMISSION_CATALOGUE.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SENSITIVE_PERMISSION_CATALOGUE)("$id has a well-formed permission id", (entry) => {
    expect(isWellFormedPermissionId(entry.id)).toBe(true);
  });

  it("marks every entry as mandatory audit (design §3.2)", () => {
    for (const entry of SENSITIVE_PERMISSION_CATALOGUE) {
      expect(entry.auditRequirement).toBe("mandatory");
    }
  });

  it("marks exactly rows 7-8 (customer.viewProtectedProfile, report.exportFinancial) as inheritable", () => {
    const inheritable = SENSITIVE_PERMISSION_CATALOGUE.filter((e) => e.inheritAllowed).map(
      (e) => e.id,
    );
    expect(inheritable).toEqual(["customer.viewProtectedProfile", "report.exportFinancial"]);
  });

  it("marks rows 1-6 as owner_only and non-inheritable", () => {
    const nonInheritableOwnerOnly = [
      "staff.manage",
      "staff.assignPermissions",
      "business.transferOwnership",
      "business.configureFraudRules",
      "transaction.reverse",
      "reward.override",
    ];
    for (const id of nonInheritableOwnerOnly) {
      const entry = getSensitivePermissionEntry(id);
      expect(entry.inheritAllowed).toBe(false);
      expect(entry.defaultState).toBe("owner_only");
    }
  });

  it("marks rows 7-8 as owner_and_manager_default", () => {
    for (const id of ["customer.viewProtectedProfile", "report.exportFinancial"]) {
      expect(getSensitivePermissionEntry(id).defaultState).toBe("owner_and_manager_default");
    }
  });

  it("business.transferOwnership is not grantable/revocable via the ordinary override path", () => {
    const entry = getSensitivePermissionEntry("business.transferOwnership");
    expect(entry.explicitGrantRequired).toBe(false);
    expect(entry.explicitRevocationSupported).toBe(false);
  });

  it.each(EXPECTED_IDS.filter((id) => id !== "business.transferOwnership"))(
    "%s supports explicit grant and revocation",
    (id) => {
      const entry = getSensitivePermissionEntry(id);
      expect(entry.explicitGrantRequired).toBe(true);
      expect(entry.explicitRevocationSupported).toBe(true);
    },
  );
});

describe("SENSITIVE_PERMISSION_IDS", () => {
  it("matches the catalogue's own ids", () => {
    expect(SENSITIVE_PERMISSION_IDS).toEqual(SENSITIVE_PERMISSION_CATALOGUE.map((e) => e.id));
  });
});

describe("isSensitivePermission", () => {
  it.each(EXPECTED_IDS)("returns true for catalogue member %s", (id) => {
    expect(isSensitivePermission(id)).toBe(true);
  });

  it("returns false for a non-catalogue permission", () => {
    expect(isSensitivePermission("purchase.record")).toBe(false);
  });
});

describe("getSensitivePermissionEntry", () => {
  it("returns the entry for a known permission", () => {
    expect(getSensitivePermissionEntry("staff.manage").meaning).toBe(
      "Invite, suspend, remove staff/manager memberships",
    );
  });

  it("throws for an unrecognised permission", () => {
    expect(() => getSensitivePermissionEntry("purchase.record")).toThrow(PermissionDomainError);
  });
});

describe("getInheritableSensitivePermissionEntries", () => {
  it("returns exactly the two inheritable entries", () => {
    const ids = getInheritableSensitivePermissionEntries().map((e) => e.id);
    expect(ids).toEqual(["customer.viewProtectedProfile", "report.exportFinancial"]);
  });
});
