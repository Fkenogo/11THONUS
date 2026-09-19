import { describe, expect, it } from "vitest";
import {
  QUALIFYING_ITEM_PERMISSION_CATALOGUE,
  QUALIFYING_ITEM_PERMISSION_IDS,
  getQualifyingItemPermissionEntry,
  isQualifyingItemPermission,
} from "./qualifyingItemPermissionCatalogue";
import {
  REWARD_PROGRAM_PERMISSION_CATALOGUE,
  isRewardProgramPermission,
} from "./rewardProgramPermissionCatalogue";
import { isPurchasePermission } from "./purchasePermissionCatalogue";
import { isOrdinaryPermission } from "./ordinaryPermissionCatalogue";
import { isSensitivePermission } from "./sensitivePermissionCatalogue";
import { PermissionDomainError } from "./permissionErrors";

// `PLATFORM-BASELINE-013A.2` / `DEC-LOY-017`: a fifth, structurally separate
// catalogue holding exactly `qualifyingItem.manage`.
describe("Qualifying Item permission catalogue (DEC-LOY-017)", () => {
  it("holds exactly one entry: qualifyingItem.manage", () => {
    expect(QUALIFYING_ITEM_PERMISSION_IDS).toEqual(["qualifyingItem.manage"]);
    expect(QUALIFYING_ITEM_PERMISSION_CATALOGUE).toHaveLength(1);
  });

  it("role defaults are owner=true, manager=true, staff=false (exact matrix)", () => {
    const entry = getQualifyingItemPermissionEntry("qualifyingItem.manage");
    expect(entry.roleDefaults).toEqual({ owner: true, manager: true, staff: false });
  });

  it("is eligible only while the Business is trial or active (matches both existing domain catalogues)", () => {
    const entry = getQualifyingItemPermissionEntry("qualifyingItem.manage");
    expect([...entry.eligibleBusinessStatuses].sort()).toEqual(["active", "trial"]);
  });

  it("isQualifyingItemPermission recognises only the governed id", () => {
    expect(isQualifyingItemPermission("qualifyingItem.manage")).toBe(true);
    expect(isQualifyingItemPermission("qualifyingItem.view")).toBe(false);
    expect(isQualifyingItemPermission("rewardProgram.manage")).toBe(false);
    expect(isQualifyingItemPermission("")).toBe(false);
  });

  it("getQualifyingItemPermissionEntry throws a PermissionDomainError for an unrecognised id", () => {
    expect(() => getQualifyingItemPermissionEntry("qualifyingItem.doesNotExist")).toThrow(
      PermissionDomainError,
    );
  });

  // Test AC (PB-012 §15): structural separation from every other catalogue.
  it("qualifyingItem.manage is claimed by no other catalogue (structurally disjoint)", () => {
    expect(isSensitivePermission("qualifyingItem.manage")).toBe(false);
    expect(isOrdinaryPermission("qualifyingItem.manage")).toBe(false);
    expect(isRewardProgramPermission("qualifyingItem.manage")).toBe(false);
    expect(isPurchasePermission("qualifyingItem.manage")).toBe(false);
  });

  // Test Z (PB-012 §15): the regression gate against widening the existing permission.
  it("rewardProgram.manage remains Owner-only (NOT widened by this catalogue)", () => {
    const entry = REWARD_PROGRAM_PERMISSION_CATALOGUE.find((e) => e.id === "rewardProgram.manage");
    expect(entry?.roleDefaults).toEqual({ owner: true, manager: false, staff: false });
  });

  it("the two manage permissions are distinct ids in distinct catalogues", () => {
    expect(isRewardProgramPermission("rewardProgram.manage")).toBe(true);
    expect(isQualifyingItemPermission("rewardProgram.manage")).toBe(false);
    expect(isRewardProgramPermission("qualifyingItem.manage")).toBe(false);
  });
});
