/**
 * Regression tests for a Codex review finding (P1) on `ENG-P2-004B` PR #107:
 * a document with a non-empty `permissions` field was silently read as
 * `overrides: []`, meaning a persisted revocation (or any override state we
 * have no governed serialization for) would be silently discarded rather
 * than failing closed — potentially allowing a role-default permission the
 * stored data may actually revoke.
 */

import { describe, it, expect } from "vitest";
import { fromBusinessMembershipDocument } from "./businessMembershipDocument";

const VALID_BASE = { userId: "user-1", businessId: "biz-a", role: "manager", status: "active" };

describe("fromBusinessMembershipDocument", () => {
  it("reads a valid document with no permissions field as overrides: []", () => {
    const result = fromBusinessMembershipDocument("mem-1", VALID_BASE);
    expect(result).toEqual({ id: "mem-1", ...VALID_BASE, overrides: [] });
  });

  it("reads a valid document with an empty permissions array as overrides: []", () => {
    const result = fromBusinessMembershipDocument("mem-1", { ...VALID_BASE, permissions: [] });
    expect(result).toEqual({ id: "mem-1", ...VALID_BASE, overrides: [] });
  });

  it("treats a non-empty permissions array as malformed (unreadable, unserialized override state) rather than silently discarding it", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: ["transaction.reverse"],
    });
    expect(result).toBeNull();
  });

  it("returns null for an unrecognized role", () => {
    expect(
      fromBusinessMembershipDocument("mem-1", { ...VALID_BASE, role: "superadmin" }),
    ).toBeNull();
  });

  it("returns null for an unrecognized status", () => {
    expect(
      fromBusinessMembershipDocument("mem-1", { ...VALID_BASE, status: "pending" }),
    ).toBeNull();
  });
});
