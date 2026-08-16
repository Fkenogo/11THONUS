/**
 * Regression tests for a Codex review finding (P1) on `ENG-P2-004B` PR #107:
 * a document with a non-empty `permissions` field was silently read as
 * `overrides: []`, meaning a persisted revocation (or any override state we
 * have no governed serialization for) would be silently discarded rather
 * than failing closed — potentially allowing a role-default permission the
 * stored data may actually revoke.
 *
 * `ENG-P2-004D` persistence correction (Founder-approved Option C): the
 * previously-undesigned `permissions` encoding is now resolved — a
 * Firestore array of structured override maps
 * (`{permissionId, direction, grantedBy, grantedAt}`), TRD10 §10.6.4. The
 * fail-closed posture above is preserved for anything that isn't exactly
 * that shape; the tests below cover the newly-readable well-formed case
 * plus every malformed-element variant, including partial-mix rejection.
 */

import { describe, it, expect } from "vitest";
import { fromBusinessMembershipDocument } from "./businessMembershipDocument";

const VALID_BASE = { userId: "user-1", businessId: "biz-a", role: "manager", status: "active" };

/** Duck-typed Firestore `Timestamp` stand-in — this module stays framework-independent (no `firebase-admin` import), so tests must not import the real type either. */
function timestampLike(date: Date) {
  return { toDate: () => date };
}

const GRANTED_AT = new Date("2026-08-15T10:00:00.000Z");

describe("fromBusinessMembershipDocument", () => {
  it("reads a valid document with no permissions field as overrides: []", () => {
    const result = fromBusinessMembershipDocument("mem-1", VALID_BASE);
    expect(result).toEqual({ id: "mem-1", ...VALID_BASE, overrides: [] });
  });

  it("reads a valid document with an empty permissions array as overrides: []", () => {
    const result = fromBusinessMembershipDocument("mem-1", { ...VALID_BASE, permissions: [] });
    expect(result).toEqual({ id: "mem-1", ...VALID_BASE, overrides: [] });
  });

  it("reads a well-formed grant override element, deriving businessId/membershipId structurally rather than from the element itself", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "user-owner",
          grantedAt: timestampLike(GRANTED_AT),
        },
      ],
    });
    expect(result).toEqual({
      id: "mem-1",
      ...VALID_BASE,
      overrides: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          businessId: "biz-a",
          membershipId: "mem-1",
        },
      ],
    });
  });

  it("reads a well-formed revoke override element", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [
        {
          permissionId: "transaction.reverse",
          direction: "revoke",
          grantedBy: "user-owner",
          grantedAt: timestampLike(GRANTED_AT),
        },
      ],
    });
    expect(result).toEqual({
      id: "mem-1",
      ...VALID_BASE,
      overrides: [
        {
          permissionId: "transaction.reverse",
          direction: "revoke",
          businessId: "biz-a",
          membershipId: "mem-1",
        },
      ],
    });
  });

  it("reads multiple well-formed override elements in order", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "user-owner",
          grantedAt: timestampLike(GRANTED_AT),
        },
        {
          permissionId: "report.exportFinancial",
          direction: "revoke",
          grantedBy: "user-owner",
          grantedAt: timestampLike(GRANTED_AT),
        },
      ],
    });
    expect(result?.overrides).toEqual([
      {
        permissionId: "staff.manage",
        direction: "grant",
        businessId: "biz-a",
        membershipId: "mem-1",
      },
      {
        permissionId: "report.exportFinancial",
        direction: "revoke",
        businessId: "biz-a",
        membershipId: "mem-1",
      },
    ]);
  });

  it("treats a non-array permissions value as malformed", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: "transaction.reverse",
    });
    expect(result).toBeNull();
  });

  it("treats a bare permission-id string element (the old, pre-004D-correction shape) as malformed rather than silently discarding it", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: ["transaction.reverse"],
    });
    expect(result).toBeNull();
  });

  it("treats an element with a malformed permissionId as malformed", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [
        {
          permissionId: "not_well_formed",
          direction: "grant",
          grantedBy: "u1",
          grantedAt: timestampLike(GRANTED_AT),
        },
      ],
    });
    expect(result).toBeNull();
  });

  it("treats an element with an invalid direction as malformed", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "deny",
          grantedBy: "u1",
          grantedAt: timestampLike(GRANTED_AT),
        },
      ],
    });
    expect(result).toBeNull();
  });

  it("treats an element with a blank grantedBy as malformed", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "  ",
          grantedAt: timestampLike(GRANTED_AT),
        },
      ],
    });
    expect(result).toBeNull();
  });

  it("treats an element with a non-Timestamp-like grantedAt as malformed", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "u1",
          grantedAt: "2026-08-15T10:00:00.000Z",
        },
      ],
    });
    expect(result).toBeNull();
  });

  it("treats a mix of one valid and one malformed element as malformed — no partial acceptance", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [
        {
          permissionId: "staff.manage",
          direction: "grant",
          grantedBy: "u1",
          grantedAt: timestampLike(GRANTED_AT),
        },
        {
          permissionId: "transaction.reverse",
          direction: "sideways",
          grantedBy: "u1",
          grantedAt: timestampLike(GRANTED_AT),
        },
      ],
    });
    expect(result).toBeNull();
  });

  it("treats a non-blank permissionSetId as malformed — a referenced permission set could contain a revocation this reader cannot resolve (Codex review pass 4, PR #107)", () => {
    const result = fromBusinessMembershipDocument("mem-1", {
      ...VALID_BASE,
      permissions: [],
      permissionSetId: "set-123",
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
