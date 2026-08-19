import { describe, expect, it } from "vitest";
import {
  isPermittedLifecycleTransition,
  targetStatusForLifecycleAction,
  type MembershipStatus,
} from "./staffMembershipLifecycle";

const ALL_STATUSES: readonly MembershipStatus[] = ["invited", "active", "suspended", "removed"];

describe("isPermittedLifecycleTransition", () => {
  it("permits suspend only from active", () => {
    for (const status of ALL_STATUSES) {
      expect(isPermittedLifecycleTransition(status, "suspend")).toBe(status === "active");
    }
  });

  it("permits reactivate only from suspended", () => {
    for (const status of ALL_STATUSES) {
      expect(isPermittedLifecycleTransition(status, "reactivate")).toBe(status === "suspended");
    }
  });

  it("permits remove only from active or suspended", () => {
    for (const status of ALL_STATUSES) {
      expect(isPermittedLifecycleTransition(status, "remove")).toBe(
        status === "active" || status === "suspended",
      );
    }
  });

  it("never permits reactivate from removed (non-reversible, FD-4-STAFF)", () => {
    expect(isPermittedLifecycleTransition("removed", "reactivate")).toBe(false);
  });

  it("never permits any transition from removed (terminal)", () => {
    expect(isPermittedLifecycleTransition("removed", "suspend")).toBe(false);
    expect(isPermittedLifecycleTransition("removed", "reactivate")).toBe(false);
    expect(isPermittedLifecycleTransition("removed", "remove")).toBe(false);
  });

  it("never permits any transition from invited (no businessMembership is ever created invited)", () => {
    expect(isPermittedLifecycleTransition("invited", "suspend")).toBe(false);
    expect(isPermittedLifecycleTransition("invited", "reactivate")).toBe(false);
    expect(isPermittedLifecycleTransition("invited", "remove")).toBe(false);
  });
});

describe("targetStatusForLifecycleAction", () => {
  it("maps each action to its governed target status", () => {
    expect(targetStatusForLifecycleAction("suspend")).toBe("suspended");
    expect(targetStatusForLifecycleAction("reactivate")).toBe("active");
    expect(targetStatusForLifecycleAction("remove")).toBe("removed");
  });
});
