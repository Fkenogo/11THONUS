import { describe, expect, it } from "vitest";
import {
  applyPlatformAdministratorTransition,
  isPermittedPlatformAdministratorTransition,
} from "./platformAdministratorStatus";
import { PlatformAdministrationDomainError } from "./platformAdministrationErrors";

describe("platformAdministratorStatus lifecycle", () => {
  it("permits activate only from invited", () => {
    expect(isPermittedPlatformAdministratorTransition("invited", "activate")).toBe(true);
    expect(isPermittedPlatformAdministratorTransition("active", "activate")).toBe(false);
    expect(isPermittedPlatformAdministratorTransition("suspended", "activate")).toBe(false);
    expect(isPermittedPlatformAdministratorTransition("removed", "activate")).toBe(false);
  });

  it("permits suspend only from active", () => {
    expect(isPermittedPlatformAdministratorTransition("active", "suspend")).toBe(true);
    expect(isPermittedPlatformAdministratorTransition("invited", "suspend")).toBe(false);
    expect(isPermittedPlatformAdministratorTransition("suspended", "suspend")).toBe(false);
  });

  it("permits reactivate only from suspended", () => {
    expect(isPermittedPlatformAdministratorTransition("suspended", "reactivate")).toBe(true);
    expect(isPermittedPlatformAdministratorTransition("active", "reactivate")).toBe(false);
  });

  it("permits remove from invited, active, or suspended — never from removed", () => {
    expect(isPermittedPlatformAdministratorTransition("invited", "remove")).toBe(true);
    expect(isPermittedPlatformAdministratorTransition("active", "remove")).toBe(true);
    expect(isPermittedPlatformAdministratorTransition("suspended", "remove")).toBe(true);
    expect(isPermittedPlatformAdministratorTransition("removed", "remove")).toBe(false);
  });

  it("removed is terminal — no transition out of it is ever permitted", () => {
    for (const action of ["activate", "suspend", "reactivate", "remove"] as const) {
      expect(isPermittedPlatformAdministratorTransition("removed", action)).toBe(false);
    }
  });

  it("applyPlatformAdministratorTransition throws a domain error for an illegal transition", () => {
    expect(() => applyPlatformAdministratorTransition("removed", "reactivate")).toThrow(
      PlatformAdministrationDomainError,
    );
  });

  it("applyPlatformAdministratorTransition returns the correct resulting status", () => {
    expect(applyPlatformAdministratorTransition("active", "suspend")).toBe("suspended");
    expect(applyPlatformAdministratorTransition("suspended", "reactivate")).toBe("active");
  });
});
