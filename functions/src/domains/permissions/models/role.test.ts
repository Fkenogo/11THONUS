import { describe, expect, it } from "vitest";
import { createRole, isRole, ROLES } from "./role";
import { PermissionDomainError } from "./permissionErrors";

describe("createRole", () => {
  it.each(ROLES)("accepts the known role %s", (value) => {
    expect(createRole(value)).toBe(value);
  });

  it("rejects an unrecognised role", () => {
    expect(() => createRole("super_admin")).toThrow(PermissionDomainError);
  });

  it("rejects an empty string", () => {
    expect(() => createRole("")).toThrow(PermissionDomainError);
  });

  it("is case-sensitive (rejects Owner)", () => {
    expect(() => createRole("Owner")).toThrow(PermissionDomainError);
  });
});

describe("isRole", () => {
  it.each(ROLES)("returns true for %s", (value) => {
    expect(isRole(value)).toBe(true);
  });

  it("returns false for an unrecognised value", () => {
    expect(isRole("customer")).toBe(false);
  });
});
