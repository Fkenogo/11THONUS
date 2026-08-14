import { describe, expect, it } from "vitest";
import { createPermissionId, isWellFormedPermissionId } from "./permissionId";
import { PermissionDomainError } from "./permissionErrors";
import { SENSITIVE_PERMISSION_IDS } from "./sensitivePermissionCatalogue";

describe("createPermissionId", () => {
  it.each(SENSITIVE_PERMISSION_IDS)("accepts the governed catalogue id %s", (value) => {
    expect(createPermissionId(value)).toBe(value);
  });

  it("accepts a well-formed dot-namespaced identifier outside the catalogue", () => {
    expect(createPermissionId("purchase.record")).toBe("purchase.record");
  });

  it("rejects an empty string", () => {
    expect(() => createPermissionId("")).toThrow(PermissionDomainError);
  });

  it("rejects an identifier with no namespace separator", () => {
    expect(() => createPermissionId("manage")).toThrow(PermissionDomainError);
  });

  it("rejects an identifier with more than one dot", () => {
    expect(() => createPermissionId("staff.manage.extra")).toThrow(PermissionDomainError);
  });

  it("rejects an identifier starting with an uppercase segment", () => {
    expect(() => createPermissionId("Staff.manage")).toThrow(PermissionDomainError);
  });

  it("rejects an identifier with whitespace", () => {
    expect(() => createPermissionId("staff. manage")).toThrow(PermissionDomainError);
  });
});

describe("isWellFormedPermissionId", () => {
  it("returns true for a well-formed id", () => {
    expect(isWellFormedPermissionId("business.transferOwnership")).toBe(true);
  });

  it("returns false for a malformed id", () => {
    expect(isWellFormedPermissionId("not-a-permission")).toBe(false);
  });
});
