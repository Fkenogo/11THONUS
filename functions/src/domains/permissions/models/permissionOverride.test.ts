import { describe, expect, it } from "vitest";
import { createPermissionOverride, isGrant, isRevocation } from "./permissionOverride";
import { PermissionDomainError } from "./permissionErrors";

const BASE_INPUT = {
  permissionId: "staff.manage",
  direction: "grant" as const,
  businessId: "business-1",
  membershipId: "membership-1",
  grantedBy: "user-owner-1",
  grantedAt: new Date("2026-08-14T00:00:00.000Z"),
  targetRole: "manager" as const,
};

describe("createPermissionOverride", () => {
  it("represents an explicit grant unambiguously", () => {
    const override = createPermissionOverride(BASE_INPUT);
    expect(override.permissionId).toBe("staff.manage");
    expect(override.direction).toBe("grant");
    expect(override.businessId).toBe("business-1");
    expect(override.membershipId).toBe("membership-1");
    expect(isGrant(override)).toBe(true);
    expect(isRevocation(override)).toBe(false);
  });

  it("represents an explicit revocation unambiguously", () => {
    const override = createPermissionOverride({ ...BASE_INPUT, direction: "revoke" });
    expect(isRevocation(override)).toBe(true);
    expect(isGrant(override)).toBe(false);
  });

  it("does not store targetRole on the returned override", () => {
    const override = createPermissionOverride(BASE_INPUT);
    expect(override).not.toHaveProperty("targetRole");
  });

  it("rejects a malformed permission identifier", () => {
    expect(() => createPermissionOverride({ ...BASE_INPUT, permissionId: "bad id" })).toThrow(
      PermissionDomainError,
    );
  });

  it("rejects an unrecognised direction", () => {
    expect(() => createPermissionOverride({ ...BASE_INPUT, direction: "allow" as never })).toThrow(
      PermissionDomainError,
    );
  });

  it("rejects a blank businessId", () => {
    expect(() => createPermissionOverride({ ...BASE_INPUT, businessId: "  " })).toThrow(
      PermissionDomainError,
    );
  });

  it("rejects a blank membershipId", () => {
    expect(() => createPermissionOverride({ ...BASE_INPUT, membershipId: "" })).toThrow(
      PermissionDomainError,
    );
  });

  it("rejects a blank grantedBy", () => {
    expect(() => createPermissionOverride({ ...BASE_INPUT, grantedBy: "" })).toThrow(
      PermissionDomainError,
    );
  });

  it("refuses an override that targets an Owner membership", () => {
    expect(() => createPermissionOverride({ ...BASE_INPUT, targetRole: "owner" })).toThrow(
      PermissionDomainError,
    );
  });

  it("permits an override for a non-sensitive permission targeting staff", () => {
    expect(() =>
      createPermissionOverride({
        ...BASE_INPUT,
        permissionId: "purchase.record",
        targetRole: "staff",
      }),
    ).not.toThrow();
  });

  it("permits an override that explicitly grants a sensitive permission (this is the approved mechanism)", () => {
    const override = createPermissionOverride({
      ...BASE_INPUT,
      permissionId: "transaction.reverse",
      targetRole: "manager",
    });
    expect(override.permissionId).toBe("transaction.reverse");
  });
});
