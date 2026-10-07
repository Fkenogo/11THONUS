import { describe, expect, it } from "vitest";
import {
  PURCHASE_BUSINESS_REVIEW_CATALOGUE_ENTRY,
  PURCHASE_BUSINESS_REVIEW_GRANT_ELIGIBLE_ROLES,
  PURCHASE_BUSINESS_REVIEW_PERMISSION_ID,
  isPurchaseBusinessReviewPermission,
} from "./purchaseBusinessReviewPermissionCatalogue";
import { getSensitivePermissionEntry, isSensitivePermission } from "./sensitivePermissionCatalogue";
import { isOrdinaryPermission } from "./ordinaryPermissionCatalogue";
import { isRewardProgramPermission } from "./rewardProgramPermissionCatalogue";
import { isPurchasePermission } from "./purchasePermissionCatalogue";
import { isQualifyingItemPermission } from "./qualifyingItemPermissionCatalogue";
import { isRedemptionPermission } from "./redemptionPermissionCatalogue";
import { createPermissionOverride } from "./permissionOverride";

/** `purchase.businessReview` catalogue module (`EA-BL-001-CORR-002-BR`, `DEC-PROD-015`). */
describe("purchaseBusinessReviewPermissionCatalogue", () => {
  it("is a registered, mandatory-audit sensitive permission claimed by no other catalogue", () => {
    expect(isSensitivePermission(PURCHASE_BUSINESS_REVIEW_PERMISSION_ID)).toBe(true);
    expect(getSensitivePermissionEntry(PURCHASE_BUSINESS_REVIEW_PERMISSION_ID)).toBe(
      PURCHASE_BUSINESS_REVIEW_CATALOGUE_ENTRY,
    );
    expect(PURCHASE_BUSINESS_REVIEW_CATALOGUE_ENTRY.auditRequirement).toBe("mandatory");
    const id = PURCHASE_BUSINESS_REVIEW_PERMISSION_ID;
    expect(isOrdinaryPermission(id)).toBe(false);
    expect(isRewardProgramPermission(id)).toBe(false);
    expect(isPurchasePermission(id)).toBe(false);
    expect(isQualifyingItemPermission(id)).toBe(false);
    expect(isRedemptionPermission(id)).toBe(false);
    expect(isPurchaseBusinessReviewPermission(id)).toBe(true);
    expect(isPurchaseBusinessReviewPermission("purchase.record")).toBe(false);
  });

  it("Manager default with revoke support; the ONLY grant-eligible role is Manager", () => {
    expect(PURCHASE_BUSINESS_REVIEW_CATALOGUE_ENTRY.defaultState).toBe("owner_and_manager_default");
    expect(PURCHASE_BUSINESS_REVIEW_CATALOGUE_ENTRY.explicitRevocationSupported).toBe(true);
    expect(PURCHASE_BUSINESS_REVIEW_GRANT_ELIGIBLE_ROLES).toEqual(["manager"]);
  });

  const base = {
    permissionId: PURCHASE_BUSINESS_REVIEW_PERMISSION_ID,
    businessId: "biz-a",
    membershipId: "mem-1",
    grantedBy: "owner-1",
    grantedAt: new Date("2026-10-06T00:00:00.000Z"),
  };

  it("construction layer: a Staff-targeted grant is refused", () => {
    expect(() =>
      createPermissionOverride({ ...base, direction: "grant", targetRole: "staff" }),
    ).toThrow();
  });

  it("construction layer: Manager re-grant is accepted; Owner targets are refused", () => {
    expect(
      createPermissionOverride({ ...base, direction: "grant", targetRole: "manager" }).direction,
    ).toBe("grant");
    expect(() =>
      createPermissionOverride({ ...base, direction: "grant", targetRole: "owner" }),
    ).toThrow();
  });
});
