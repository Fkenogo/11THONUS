import { describe, expect, it } from "vitest";
import {
  ORDINARY_PERMISSION_CATALOGUE,
  ORDINARY_PERMISSION_IDS,
  isOrdinaryPermission,
  getOrdinaryPermissionEntry,
} from "./ordinaryPermissionCatalogue";
import { isWellFormedPermissionId } from "./permissionId";
import { isSensitivePermission } from "./sensitivePermissionCatalogue";
import { PermissionDomainError } from "./permissionErrors";

const EXPECTED_IDS = [
  "business.updateProfile",
  "businessBranch.updateProfile",
  "business.submitForVerification",
  "business.close",
] as const;

describe("ORDINARY_PERMISSION_CATALOGUE — FD-CORR-3 (exact approved ids, closed set)", () => {
  it("has exactly the four Founder-approved entries, in order", () => {
    expect(ORDINARY_PERMISSION_CATALOGUE.map((entry) => entry.id)).toEqual(EXPECTED_IDS);
  });

  it("has no duplicate ids", () => {
    const ids = ORDINARY_PERMISSION_CATALOGUE.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ORDINARY_PERMISSION_CATALOGUE)("$id is a well-formed permission id", (entry) => {
    expect(isWellFormedPermissionId(entry.id)).toBe(true);
  });

  it.each(ORDINARY_PERMISSION_CATALOGUE)(
    "$id is not also a member of the Sensitive Permission Catalogue (structural separation)",
    (entry) => {
      expect(isSensitivePermission(entry.id)).toBe(false);
    },
  );

  it("does not contain business.advanceLifecycle (Founder-rejected wording, FD-CORR-3)", () => {
    expect(
      ORDINARY_PERMISSION_CATALOGUE.some((entry) => entry.id === "business.advanceLifecycle"),
    ).toBe(false);
  });
});

describe("ORDINARY_PERMISSION_CATALOGUE — FD-CORR-4 (Owner allow, Manager/Staff deny)", () => {
  it.each(ORDINARY_PERMISSION_CATALOGUE)(
    "$id defaults Owner=allow, Manager=deny, Staff=deny",
    (entry) => {
      expect(entry.roleDefaults.owner).toBe(true);
      expect(entry.roleDefaults.manager).toBe(false);
      expect(entry.roleDefaults.staff).toBe(false);
    },
  );
});

describe("ORDINARY_PERMISSION_CATALOGUE — FD-CORR-5/7 (exact approved lifecycle-eligibility matrix)", () => {
  it("business.updateProfile: draft/pending_verification/trial/active/expired eligible; suspended/closed/archived not", () => {
    const entry = getOrdinaryPermissionEntry("business.updateProfile");
    expect([...entry.eligibleBusinessStatuses].sort()).toEqual(
      ["active", "draft", "expired", "pending_verification", "trial"].sort(),
    );
  });

  it("businessBranch.updateProfile: identical treatment to business.updateProfile", () => {
    const profile = getOrdinaryPermissionEntry("business.updateProfile");
    const branch = getOrdinaryPermissionEntry("businessBranch.updateProfile");
    expect([...branch.eligibleBusinessStatuses].sort()).toEqual(
      [...profile.eligibleBusinessStatuses].sort(),
    );
  });

  it("business.submitForVerification: only draft is eligible (narrow, structural draft→pending_verification only)", () => {
    const entry = getOrdinaryPermissionEntry("business.submitForVerification");
    expect(entry.eligibleBusinessStatuses).toEqual(["draft"]);
  });

  it("business.close: every non-terminal status eligible; closed/archived not (structural 'any→closed' row)", () => {
    const entry = getOrdinaryPermissionEntry("business.close");
    expect([...entry.eligibleBusinessStatuses].sort()).toEqual(
      ["active", "draft", "expired", "pending_verification", "suspended", "trial"].sort(),
    );
  });
});

describe("isOrdinaryPermission / getOrdinaryPermissionEntry", () => {
  it("recognises every catalogue id", () => {
    for (const id of ORDINARY_PERMISSION_IDS) {
      expect(isOrdinaryPermission(id)).toBe(true);
    }
  });

  it("does not recognise an unconfigured/unknown permission id", () => {
    expect(isOrdinaryPermission("some.ungoverned")).toBe(false);
    expect(isOrdinaryPermission("purchase.record")).toBe(false);
  });

  it("does not recognise a sensitive-catalogue id as ordinary", () => {
    expect(isOrdinaryPermission("staff.manage")).toBe(false);
  });

  it("throws a PermissionDomainError for getOrdinaryPermissionEntry on an unrecognised id", () => {
    expect(() => getOrdinaryPermissionEntry("some.ungoverned")).toThrow(PermissionDomainError);
  });
});
