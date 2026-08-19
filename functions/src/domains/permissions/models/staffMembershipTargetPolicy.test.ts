/**
 * `ENG-P2-003A` — Staff-management and role-change target-policy contract
 * tests (Phase L/M). TDD: written before `staffMembershipTargetPolicy.ts`
 * exists.
 */

import { describe, it, expect } from "vitest";
import {
  isPermittedStaffManagementTarget,
  isPermittedRoleChangeTarget,
} from "./staffMembershipTargetPolicy";

describe("isPermittedStaffManagementTarget (staff.manage target matrix, §11.6.1)", () => {
  it("Owner may target Manager", () => {
    expect(isPermittedStaffManagementTarget("owner", "manager", false)).toBe(true);
  });

  it("Owner may target Staff", () => {
    expect(isPermittedStaffManagementTarget("owner", "staff", false)).toBe(true);
  });

  it("Owner may never target Owner", () => {
    expect(isPermittedStaffManagementTarget("owner", "owner", false)).toBe(false);
  });

  it("Manager may target Staff only", () => {
    expect(isPermittedStaffManagementTarget("manager", "staff", false)).toBe(true);
  });

  it("Manager may never target Manager", () => {
    expect(isPermittedStaffManagementTarget("manager", "manager", false)).toBe(false);
  });

  it("Manager may never target Owner", () => {
    expect(isPermittedStaffManagementTarget("manager", "owner", false)).toBe(false);
  });

  it("Staff may never target anyone", () => {
    expect(isPermittedStaffManagementTarget("staff", "staff", false)).toBe(false);
    expect(isPermittedStaffManagementTarget("staff", "manager", false)).toBe(false);
    expect(isPermittedStaffManagementTarget("staff", "owner", false)).toBe(false);
  });

  it("self-action is always prohibited, regardless of role", () => {
    expect(isPermittedStaffManagementTarget("owner", "owner", true)).toBe(false);
    expect(isPermittedStaffManagementTarget("manager", "manager", true)).toBe(false);
  });
});

describe("isPermittedRoleChangeTarget (staff.assignRole target matrix, §11.6.2)", () => {
  it("Owner may promote Staff to Manager", () => {
    expect(isPermittedRoleChangeTarget("owner", "staff", false)).toBe(true);
  });

  it("Owner may demote Manager to Staff", () => {
    expect(isPermittedRoleChangeTarget("owner", "manager", false)).toBe(true);
  });

  it("Owner may never target Owner", () => {
    expect(isPermittedRoleChangeTarget("owner", "owner", false)).toBe(false);
  });

  it("Manager has no role-change authority at MVP, even over Staff", () => {
    expect(isPermittedRoleChangeTarget("manager", "staff", false)).toBe(false);
    expect(isPermittedRoleChangeTarget("manager", "manager", false)).toBe(false);
  });

  it("Staff has no role-change authority", () => {
    expect(isPermittedRoleChangeTarget("staff", "staff", false)).toBe(false);
  });

  it("no actor may change their own role, including Owner", () => {
    expect(isPermittedRoleChangeTarget("owner", "staff", true)).toBe(false);
    expect(isPermittedRoleChangeTarget("owner", "manager", true)).toBe(false);
  });
});
