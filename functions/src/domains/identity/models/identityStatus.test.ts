import { describe, expect, it } from "vitest";
import {
  IDENTITY_STATUSES,
  isTerminalIdentityStatus,
  isValidIdentityStatusTransition,
} from "./identityStatus";

describe("IDENTITY_STATUSES", () => {
  it("contains exactly the statuses this domain foundation supports", () => {
    expect(IDENTITY_STATUSES).toEqual([
      "registered",
      "active",
      "dormant",
      "suspended",
      "locked",
      "closed",
      "archived",
    ]);
  });

  it("does not include recovered as a persistent status", () => {
    expect(IDENTITY_STATUSES).not.toContain("recovered");
  });
});

describe("isValidIdentityStatusTransition", () => {
  it("permits registered to active", () => {
    expect(isValidIdentityStatusTransition("registered", "active")).toBe(true);
  });

  it("permits active to dormant", () => {
    expect(isValidIdentityStatusTransition("active", "dormant")).toBe(true);
  });

  it("permits dormant back to active directly, without a recovery step", () => {
    expect(isValidIdentityStatusTransition("dormant", "active")).toBe(true);
  });

  it("permits active to suspended", () => {
    expect(isValidIdentityStatusTransition("active", "suspended")).toBe(true);
  });

  it("permits suspended back to active", () => {
    expect(isValidIdentityStatusTransition("suspended", "active")).toBe(true);
  });

  it("permits active to locked", () => {
    expect(isValidIdentityStatusTransition("active", "locked")).toBe(true);
  });

  it("permits locked back to active", () => {
    expect(isValidIdentityStatusTransition("locked", "active")).toBe(true);
  });

  it("permits active to closed", () => {
    expect(isValidIdentityStatusTransition("active", "closed")).toBe(true);
  });

  it("permits closed to archived", () => {
    expect(isValidIdentityStatusTransition("closed", "archived")).toBe(true);
  });

  it("rejects registered to any status other than active", () => {
    expect(isValidIdentityStatusTransition("registered", "dormant")).toBe(false);
    expect(isValidIdentityStatusTransition("registered", "closed")).toBe(false);
  });

  it("rejects transitioning out of closed except to archived", () => {
    expect(isValidIdentityStatusTransition("closed", "active")).toBe(false);
  });

  it("rejects any transition out of archived", () => {
    expect(isValidIdentityStatusTransition("archived", "active")).toBe(false);
    expect(isValidIdentityStatusTransition("archived", "closed")).toBe(false);
  });

  it("rejects suspended transitioning directly to locked", () => {
    expect(isValidIdentityStatusTransition("suspended", "locked")).toBe(false);
  });

  it("rejects a status transitioning to itself", () => {
    expect(isValidIdentityStatusTransition("active", "active")).toBe(false);
  });
});

describe("isTerminalIdentityStatus", () => {
  it("treats archived as the only terminal status", () => {
    expect(isTerminalIdentityStatus("archived")).toBe(true);
    expect(isTerminalIdentityStatus("closed")).toBe(false);
    expect(isTerminalIdentityStatus("active")).toBe(false);
  });
});
