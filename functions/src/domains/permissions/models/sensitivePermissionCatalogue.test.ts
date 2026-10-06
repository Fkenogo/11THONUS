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
  "staff.assignRole",
  "business.transferOwnership",
  "business.configureFraudRules",
  "transaction.reverse",
  "reward.override",
  "customer.viewProtectedProfile",
  "report.exportFinancial",
  "redemption.confirm",
  "purchase.businessReview",
] as const;

describe("SENSITIVE_PERMISSION_CATALOGUE", () => {
  it("has exactly the eleven entries (eight design-specified plus ENG-P2-004-CORR-002's staff.assignRole plus DEC-LOY-018's redemption.confirm plus EA-BL-001-CORR-002-BR's purchase.businessReview), in order", () => {
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

  it("marks exactly customer.viewProtectedProfile, report.exportFinancial, redemption.confirm and purchase.businessReview as inheritable", () => {
    const inheritable = SENSITIVE_PERMISSION_CATALOGUE.filter((e) => e.inheritAllowed).map(
      (e) => e.id,
    );
    expect(inheritable).toEqual([
      "customer.viewProtectedProfile",
      "report.exportFinancial",
      "redemption.confirm",
      "purchase.businessReview",
    ]);
  });

  it("marks rows 1-6 plus staff.assignRole as owner_only and non-inheritable", () => {
    const nonInheritableOwnerOnly = [
      "staff.manage",
      "staff.assignPermissions",
      "staff.assignRole",
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
    for (const id of [
      "customer.viewProtectedProfile",
      "report.exportFinancial",
      "redemption.confirm",
      "purchase.businessReview",
    ]) {
      expect(getSensitivePermissionEntry(id).defaultState).toBe("owner_and_manager_default");
    }
  });

  it("business.transferOwnership is not grantable/revocable via the ordinary override path", () => {
    const entry = getSensitivePermissionEntry("business.transferOwnership");
    expect(entry.explicitGrantRequired).toBe(false);
    expect(entry.explicitRevocationSupported).toBe(false);
  });

  it("staff.assignRole is not grantable/revocable via the ordinary override path (Owner-only, non-delegable per Founder MVP policy)", () => {
    const entry = getSensitivePermissionEntry("staff.assignRole");
    expect(entry.explicitGrantRequired).toBe(false);
    expect(entry.explicitRevocationSupported).toBe(false);
  });

  it.each(
    EXPECTED_IDS.filter((id) => id !== "business.transferOwnership" && id !== "staff.assignRole"),
  )("%s supports explicit grant and revocation", (id) => {
    const entry = getSensitivePermissionEntry(id);
    expect(entry.explicitGrantRequired).toBe(true);
    expect(entry.explicitRevocationSupported).toBe(true);
  });

  it("business.transferOwnership has no explicit-grant-eligible roles", () => {
    expect(
      getSensitivePermissionEntry("business.transferOwnership").explicitGrantEligibleRoles,
    ).toBe(null);
  });

  it("staff.assignRole has no explicit-grant-eligible roles (no Manager/Staff grant path exists)", () => {
    expect(getSensitivePermissionEntry("staff.assignRole").explicitGrantEligibleRoles).toBe(null);
  });

  it("staff.assignRole's meaning matches the Founder-approved MVP policy", () => {
    expect(getSensitivePermissionEntry("staff.assignRole").meaning).toBe(
      "Change a Business membership role between Staff and Manager",
    );
  });

  it.each([
    "staff.manage",
    "staff.assignPermissions",
    "business.configureFraudRules",
    "transaction.reverse",
    "reward.override",
  ])(
    "%s names exactly [Manager] as the explicit-grant-eligible roles (design §3.2 'Yes (Manager)' — DEC-LOY-018 generalisation must not widen this)",
    (id) => {
      expect(getSensitivePermissionEntry(id).explicitGrantEligibleRoles).toEqual(["manager"]);
    },
  );

  it.each(["customer.viewProtectedProfile", "report.exportFinancial"])(
    "%s names exactly [Staff] as the explicit-grant-eligible roles (design §3.2 'Yes for Staff' — Owner/Manager already default to it; DEC-LOY-018 generalisation must not widen this)",
    (id) => {
      expect(getSensitivePermissionEntry(id).explicitGrantEligibleRoles).toEqual(["staff"]);
    },
  );

  it("redemption.confirm names exactly [Manager, Staff] (DEC-LOY-018: Manager re-grant plus Staff grant)", () => {
    expect(getSensitivePermissionEntry("redemption.confirm").explicitGrantEligibleRoles).toEqual([
      "manager",
      "staff",
    ]);
  });

  it("redemption.confirm is the registered definition from its own structurally separate module (DEC-LOY-017 precedent)", async () => {
    const { REDEMPTION_CONFIRM_CATALOGUE_ENTRY } = await import("./redemptionPermissionCatalogue");
    expect(getSensitivePermissionEntry("redemption.confirm")).toBe(
      REDEMPTION_CONFIRM_CATALOGUE_ENTRY,
    );
  });
});

describe("SENSITIVE_PERMISSION_CATALOGUE — eligibleBusinessStatuses (ENG-P2-004-CORR-003)", () => {
  it("staff.manage carries exactly the Founder-approved pre-operational override: draft, pending_verification, trial, active", () => {
    expect(getSensitivePermissionEntry("staff.manage").eligibleBusinessStatuses).toEqual([
      "draft",
      "pending_verification",
      "trial",
      "active",
    ]);
  });

  it("redemption.confirm carries exactly the DEC-LOY-011 suspension override: trial, active, suspended", () => {
    expect(getSensitivePermissionEntry("redemption.confirm").eligibleBusinessStatuses).toEqual([
      "trial",
      "active",
      "suspended",
    ]);
  });

  it.each(EXPECTED_IDS.filter((id) => id !== "staff.manage" && id !== "redemption.confirm"))(
    "%s carries no eligibleBusinessStatuses override (legacy {trial, active} fallback applies)",
    (id) => {
      expect(getSensitivePermissionEntry(id).eligibleBusinessStatuses).toBeUndefined();
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
  it("returns exactly the four inheritable entries", () => {
    const ids = getInheritableSensitivePermissionEntries().map((e) => e.id);
    expect(ids).toEqual([
      "customer.viewProtectedProfile",
      "report.exportFinancial",
      "redemption.confirm",
      "purchase.businessReview",
    ]);
  });
});
