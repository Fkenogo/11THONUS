import { describe, expect, it } from "vitest";
import {
  BUSINESS_STATUSES,
  isTerminalBusinessStatus,
  isValidBusinessStatusTransition,
} from "./businessStatus";

describe("BUSINESS_STATUSES", () => {
  it("contains exactly the eight statuses governed by TRD10 §10.6.3", () => {
    expect(BUSINESS_STATUSES).toEqual([
      "draft",
      "pending_verification",
      "trial",
      "active",
      "suspended",
      "expired",
      "closed",
      "archived",
    ]);
  });
});

describe("isValidBusinessStatusTransition", () => {
  it("allows every transition the design's §6 lifecycle table names", () => {
    expect(isValidBusinessStatusTransition("draft", "pending_verification")).toBe(true);
    expect(isValidBusinessStatusTransition("pending_verification", "trial")).toBe(true);
    expect(isValidBusinessStatusTransition("trial", "active")).toBe(true);
    expect(isValidBusinessStatusTransition("active", "suspended")).toBe(true);
    expect(isValidBusinessStatusTransition("suspended", "active")).toBe(true);
    expect(isValidBusinessStatusTransition("trial", "expired")).toBe(true);
    expect(isValidBusinessStatusTransition("active", "expired")).toBe(true);
    expect(isValidBusinessStatusTransition("closed", "archived")).toBe(true);
  });

  it("allows any → closed for every non-terminal status", () => {
    for (const from of [
      "draft",
      "pending_verification",
      "trial",
      "active",
      "suspended",
      "expired",
    ] as const) {
      expect(isValidBusinessStatusTransition(from, "closed")).toBe(true);
    }
  });

  it("rejects transitions the design explicitly does not govern", () => {
    // pending_verification -> trial's verification mechanism is ungoverned
    // (§6, §24 item 3) but the structural edge itself IS governed and must
    // still validate true (see the test above) — only the *mechanism* is
    // out of scope, not the transition-table entry.
    expect(isValidBusinessStatusTransition("draft", "trial")).toBe(false);
    expect(isValidBusinessStatusTransition("draft", "active")).toBe(false);
    expect(isValidBusinessStatusTransition("suspended", "trial")).toBe(false);
    expect(isValidBusinessStatusTransition("suspended", "expired")).toBe(false);
    // expired re-activation is never described (§6) — not implemented.
    expect(isValidBusinessStatusTransition("expired", "active")).toBe(false);
    expect(isValidBusinessStatusTransition("expired", "trial")).toBe(false);
  });

  it("rejects any transition out of a terminal status", () => {
    expect(isValidBusinessStatusTransition("archived", "draft")).toBe(false);
    expect(isValidBusinessStatusTransition("archived", "active")).toBe(false);
    expect(isValidBusinessStatusTransition("archived", "closed")).toBe(false);
  });

  it("rejects a status transitioning to itself", () => {
    for (const status of BUSINESS_STATUSES) {
      expect(isValidBusinessStatusTransition(status, status)).toBe(false);
    }
  });
});

describe("isTerminalBusinessStatus", () => {
  it("treats only archived as terminal", () => {
    expect(isTerminalBusinessStatus("archived")).toBe(true);
    for (const status of BUSINESS_STATUSES) {
      if (status === "archived") continue;
      expect(isTerminalBusinessStatus(status)).toBe(false);
    }
  });
});
