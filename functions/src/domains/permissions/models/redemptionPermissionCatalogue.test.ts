import { describe, expect, it } from "vitest";
import {
  REDEMPTION_CONFIRM_CATALOGUE_ENTRY,
  REDEMPTION_CONFIRM_ELIGIBLE_STATUSES,
  REDEMPTION_CONFIRM_GRANT_ELIGIBLE_ROLES,
  REDEMPTION_CONFIRM_PERMISSION_ID,
  isRedemptionPermission,
} from "./redemptionPermissionCatalogue";
import { isSensitivePermission, getSensitivePermissionEntry } from "./sensitivePermissionCatalogue";
import { isOrdinaryPermission } from "./ordinaryPermissionCatalogue";
import { isRewardProgramPermission } from "./rewardProgramPermissionCatalogue";
import { isPurchasePermission } from "./purchasePermissionCatalogue";
import { isQualifyingItemPermission } from "./qualifyingItemPermissionCatalogue";

/**
 * `redemption.confirm` catalogue module (`CAPABILITY-6-REDEMPTION-ENGINE-001`,
 * `DEC-LOY-018`).
 */
describe("redemptionPermissionCatalogue", () => {
  it("mints the governed redemption-confirmation identifier (never reward.override)", () => {
    expect(REDEMPTION_CONFIRM_PERMISSION_ID).toBe("redemption.confirm");
    expect(REDEMPTION_CONFIRM_PERMISSION_ID).not.toBe("reward.override");
  });

  it("is registered as a sensitive permission (Owner floor, overrides, mandatory audit govern it)", () => {
    expect(isSensitivePermission(REDEMPTION_CONFIRM_PERMISSION_ID)).toBe(true);
    expect(getSensitivePermissionEntry(REDEMPTION_CONFIRM_PERMISSION_ID)).toBe(
      REDEMPTION_CONFIRM_CATALOGUE_ENTRY,
    );
  });

  it("is structurally separate: claimed by no other catalogue (DEC-LOY-017 precedent)", () => {
    expect(isOrdinaryPermission(REDEMPTION_CONFIRM_PERMISSION_ID)).toBe(false);
    expect(isRewardProgramPermission(REDEMPTION_CONFIRM_PERMISSION_ID)).toBe(false);
    expect(isPurchasePermission(REDEMPTION_CONFIRM_PERMISSION_ID)).toBe(false);
    expect(isQualifyingItemPermission(REDEMPTION_CONFIRM_PERMISSION_ID)).toBe(false);
  });

  it("holds Manager by default, never Staff (DEC-LOY-018 D-2, PRD01 matrix row)", () => {
    expect(REDEMPTION_CONFIRM_CATALOGUE_ENTRY.defaultState).toBe("owner_and_manager_default");
    expect(REDEMPTION_CONFIRM_CATALOGUE_ENTRY.inheritAllowed).toBe(true);
  });

  it("supports explicit grant and revocation with mandatory audit", () => {
    expect(REDEMPTION_CONFIRM_CATALOGUE_ENTRY.explicitGrantRequired).toBe(true);
    expect(REDEMPTION_CONFIRM_CATALOGUE_ENTRY.explicitRevocationSupported).toBe(true);
    expect(REDEMPTION_CONFIRM_CATALOGUE_ENTRY.auditRequirement).toBe("mandatory");
  });

  it("names exactly Manager and Staff as grant-eligible (re-grant plus delegation)", () => {
    expect(REDEMPTION_CONFIRM_GRANT_ELIGIBLE_ROLES).toEqual(["manager", "staff"]);
    expect(REDEMPTION_CONFIRM_CATALOGUE_ENTRY.explicitGrantEligibleRoles).toEqual([
      "manager",
      "staff",
    ]);
  });

  it("stays eligible during commercial suspension (DEC-LOY-011 default-allow)", () => {
    expect(REDEMPTION_CONFIRM_ELIGIBLE_STATUSES).toEqual(["trial", "active", "suspended"]);
    expect(REDEMPTION_CONFIRM_CATALOGUE_ENTRY.eligibleBusinessStatuses).toEqual([
      "trial",
      "active",
      "suspended",
    ]);
  });

  it("isRedemptionPermission matches only the redemption identifier", () => {
    expect(isRedemptionPermission("redemption.confirm")).toBe(true);
    expect(isRedemptionPermission("reward.override")).toBe(false);
    expect(isRedemptionPermission("purchase.record")).toBe(false);
  });
});
