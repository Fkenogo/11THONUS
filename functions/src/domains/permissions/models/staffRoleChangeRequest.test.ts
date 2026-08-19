/**
 * `ENG-P2-003A` — Staff role-change request/result contract tests
 * (Phase M). TDD: written before `staffRoleChangeRequest.ts` exists.
 */

import { describe, it, expect } from "vitest";
import { createStaffRoleChangeRequest } from "./staffRoleChangeRequest";

function baseParams(overrides: Partial<Parameters<typeof createStaffRoleChangeRequest>[0]> = {}) {
  return {
    businessId: "biz-a",
    membershipId: "mem-1",
    fromRole: "staff" as const,
    toRole: "manager" as const,
    requestedBy: "user-owner",
    ...overrides,
  };
}

describe("createStaffRoleChangeRequest", () => {
  it("accepts staff -> manager", () => {
    const request = createStaffRoleChangeRequest(baseParams());
    expect(request.fromRole).toBe("staff");
    expect(request.toRole).toBe("manager");
  });

  it("accepts manager -> staff", () => {
    const request = createStaffRoleChangeRequest(
      baseParams({ fromRole: "manager", toRole: "staff" }),
    );
    expect(request.fromRole).toBe("manager");
    expect(request.toRole).toBe("staff");
  });

  it("rejects a no-op role change (fromRole === toRole)", () => {
    expect(() =>
      createStaffRoleChangeRequest(baseParams({ fromRole: "staff", toRole: "staff" })),
    ).toThrow();
  });

  it("rejects owner as fromRole", () => {
    expect(() =>
      // @ts-expect-error deliberately malformed for the test
      createStaffRoleChangeRequest(baseParams({ fromRole: "owner" })),
    ).toThrow(/owner/i);
  });

  it("rejects owner as toRole", () => {
    expect(() =>
      // @ts-expect-error deliberately malformed for the test
      createStaffRoleChangeRequest(baseParams({ toRole: "owner" })),
    ).toThrow(/owner/i);
  });

  it("rejects a blank businessId", () => {
    expect(() => createStaffRoleChangeRequest(baseParams({ businessId: "" }))).toThrow();
  });

  it("rejects a blank membershipId", () => {
    expect(() => createStaffRoleChangeRequest(baseParams({ membershipId: "" }))).toThrow();
  });

  it("rejects a blank requestedBy", () => {
    expect(() => createStaffRoleChangeRequest(baseParams({ requestedBy: "" }))).toThrow();
  });

  it("has no way to encode role: owner in either role field (type-level)", () => {
    type AssertNeverOwner = "owner" extends Parameters<
      typeof createStaffRoleChangeRequest
    >[0]["toRole"]
      ? never
      : true;
    const assertion: AssertNeverOwner = true;
    expect(assertion).toBe(true);
  });
});
