/**
 * `ENG-P2-003A` — Business Membership Invitation domain contract tests.
 * TDD: written before `businessMembershipInvitation.ts` exists (RED
 * captured in the implementation report), then implemented to GREEN.
 */

import { describe, it, expect } from "vitest";
import {
  createBusinessMembershipInvitation,
  transitionInvitationStatus,
  fromBusinessMembershipInvitationDocument,
} from "./businessMembershipInvitation";

const INVITED_AT = new Date("2026-08-19T10:00:00.000Z");
const EXPIRES_AT = new Date("2026-08-26T10:00:00.000Z");

function baseParams(
  overrides: Partial<Parameters<typeof createBusinessMembershipInvitation>[0]> = {},
) {
  return {
    id: "inv-1",
    businessId: "biz-a",
    role: "staff",
    deliveryTarget: { type: "email" as const, value: "person@example.com" },
    invitedBy: "user-owner",
    invitedAt: INVITED_AT,
    expiresAt: EXPIRES_AT,
    ...overrides,
  };
}

function timestampLike(date: Date) {
  return { toDate: () => date };
}

describe("createBusinessMembershipInvitation", () => {
  it("creates a pending invitation with the exact shape governed by ENG-P2-003-DESIGN-001 §7.1a", () => {
    const invitation = createBusinessMembershipInvitation(baseParams());
    expect(invitation).toEqual({
      id: "inv-1",
      businessId: "biz-a",
      role: "staff",
      deliveryTarget: { type: "email", value: "person@example.com" },
      invitedBy: "user-owner",
      status: "pending",
      invitedAt: INVITED_AT,
      expiresAt: EXPIRES_AT,
      resolvedAt: undefined,
      acceptedMembershipId: undefined,
      createdAt: INVITED_AT,
      updatedAt: INVITED_AT,
      schemaVersion: 1,
    });
  });

  it("accepts a valid email delivery target", () => {
    const invitation = createBusinessMembershipInvitation(
      baseParams({ deliveryTarget: { type: "email", value: "a@b.com" } }),
    );
    expect(invitation.deliveryTarget).toEqual({ type: "email", value: "a@b.com" });
  });

  it("accepts a valid phone delivery target", () => {
    const invitation = createBusinessMembershipInvitation(
      baseParams({ deliveryTarget: { type: "phone", value: "+15551234567" } }),
    );
    expect(invitation.deliveryTarget).toEqual({ type: "phone", value: "+15551234567" });
  });

  it("rejects an unsupported delivery type", () => {
    expect(() =>
      createBusinessMembershipInvitation(
        // @ts-expect-error deliberately malformed for the test
        baseParams({ deliveryTarget: { type: "loyaltyNumber", value: "12345" } }),
      ),
    ).toThrow(/delivery type/i);
  });

  it("rejects a missing/blank businessId", () => {
    expect(() => createBusinessMembershipInvitation(baseParams({ businessId: "" }))).toThrow(
      /businessId/i,
    );
  });

  it("rejects a blank id", () => {
    expect(() => createBusinessMembershipInvitation(baseParams({ id: "" }))).toThrow(/id/i);
  });

  it("rejects owner as the intended role", () => {
    expect(() =>
      // @ts-expect-error deliberately malformed for the test
      createBusinessMembershipInvitation(baseParams({ role: "owner" })),
    ).toThrow(/owner/i);
  });

  it("accepts manager as the intended role", () => {
    const invitation = createBusinessMembershipInvitation(baseParams({ role: "manager" }));
    expect(invitation.role).toBe("manager");
  });

  it("accepts staff as the intended role", () => {
    const invitation = createBusinessMembershipInvitation(baseParams({ role: "staff" }));
    expect(invitation.role).toBe("staff");
  });

  it("rejects an expiry not strictly after the issued time", () => {
    expect(() => createBusinessMembershipInvitation(baseParams({ expiresAt: INVITED_AT }))).toThrow(
      /expir/i,
    );
  });

  it("rejects a blank invitedBy", () => {
    expect(() => createBusinessMembershipInvitation(baseParams({ invitedBy: "" }))).toThrow(
      /invitedBy/i,
    );
  });

  it("does not require or accept an authoritative userId field", () => {
    const invitation = createBusinessMembershipInvitation(baseParams());
    expect("userId" in invitation).toBe(false);
  });

  it("does not contain any token/credential/password/OTP/session field", () => {
    const invitation = createBusinessMembershipInvitation(baseParams());
    const keys = Object.keys(invitation);
    for (const forbidden of ["token", "credential", "password", "otp", "session"]) {
      expect(keys.some((k) => k.toLowerCase().includes(forbidden))).toBe(false);
    }
  });
});

describe("transitionInvitationStatus", () => {
  it("pending -> accepted is valid and sets resolvedAt + acceptedMembershipId", () => {
    const invitation = createBusinessMembershipInvitation(baseParams());
    const resolvedAt = new Date("2026-08-20T00:00:00.000Z");
    const result = transitionInvitationStatus(invitation, "accepted", {
      resolvedAt,
      acceptedMembershipId: "mem-1",
    });
    expect(result.status).toBe("accepted");
    expect(result.resolvedAt).toEqual(resolvedAt);
    expect(result.acceptedMembershipId).toBe("mem-1");
  });

  it("pending -> revoked is valid", () => {
    const invitation = createBusinessMembershipInvitation(baseParams());
    const resolvedAt = new Date("2026-08-20T00:00:00.000Z");
    const result = transitionInvitationStatus(invitation, "revoked", { resolvedAt });
    expect(result.status).toBe("revoked");
  });

  it("pending -> expired is valid", () => {
    const invitation = createBusinessMembershipInvitation(baseParams());
    const resolvedAt = new Date("2026-08-27T00:00:00.000Z");
    const result = transitionInvitationStatus(invitation, "expired", { resolvedAt });
    expect(result.status).toBe("expired");
  });

  it("rejects transitioning out of a terminal state (accepted -> revoked)", () => {
    const invitation = createBusinessMembershipInvitation(baseParams());
    const resolvedAt = new Date("2026-08-20T00:00:00.000Z");
    const accepted = transitionInvitationStatus(invitation, "accepted", { resolvedAt });
    expect(() => transitionInvitationStatus(accepted, "revoked", { resolvedAt })).toThrow(
      /transition/i,
    );
  });

  it("rejects a reverse transition back to pending", () => {
    const invitation = createBusinessMembershipInvitation(baseParams());
    const resolvedAt = new Date("2026-08-20T00:00:00.000Z");
    const revoked = transitionInvitationStatus(invitation, "revoked", { resolvedAt });
    expect(() =>
      // @ts-expect-error deliberately invalid transition target for the test
      transitionInvitationStatus(revoked, "pending", { resolvedAt }),
    ).toThrow(/transition/i);
  });
});

describe("fromBusinessMembershipInvitationDocument", () => {
  const VALID_RAW = {
    businessId: "biz-a",
    role: "staff",
    deliveryTarget: { type: "email", value: "person@example.com" },
    invitedBy: "user-owner",
    status: "pending",
    invitedAt: timestampLike(INVITED_AT),
    expiresAt: timestampLike(EXPIRES_AT),
    createdAt: timestampLike(INVITED_AT),
    updatedAt: timestampLike(INVITED_AT),
    schemaVersion: 1,
  };

  it("reads a well-formed pending invitation document", () => {
    const result = fromBusinessMembershipInvitationDocument("inv-1", VALID_RAW);
    expect(result?.id).toBe("inv-1");
    expect(result?.status).toBe("pending");
  });

  it("reads a well-formed accepted invitation document with resolvedAt/acceptedMembershipId", () => {
    const raw = {
      ...VALID_RAW,
      status: "accepted",
      resolvedAt: timestampLike(new Date("2026-08-20T00:00:00.000Z")),
      acceptedMembershipId: "mem-1",
    };
    const result = fromBusinessMembershipInvitationDocument("inv-1", raw);
    expect(result?.status).toBe("accepted");
    expect(result?.acceptedMembershipId).toBe("mem-1");
  });

  it("fails closed on an unknown status", () => {
    const result = fromBusinessMembershipInvitationDocument("inv-1", {
      ...VALID_RAW,
      status: "bogus",
    });
    expect(result).toBeNull();
  });

  it("fails closed on a malformed timestamp", () => {
    const result = fromBusinessMembershipInvitationDocument("inv-1", {
      ...VALID_RAW,
      invitedAt: "not-a-timestamp",
    });
    expect(result).toBeNull();
  });

  it("fails closed on a blank businessId", () => {
    const result = fromBusinessMembershipInvitationDocument("inv-1", {
      ...VALID_RAW,
      businessId: "",
    });
    expect(result).toBeNull();
  });

  it("fails closed on an invalid schemaVersion", () => {
    const result = fromBusinessMembershipInvitationDocument("inv-1", {
      ...VALID_RAW,
      schemaVersion: 0,
    });
    expect(result).toBeNull();
  });

  it("fails closed on a malformed delivery type", () => {
    const result = fromBusinessMembershipInvitationDocument("inv-1", {
      ...VALID_RAW,
      deliveryTarget: { type: "loyaltyNumber", value: "12345" },
    });
    expect(result).toBeNull();
  });

  it("fails closed on owner intended role", () => {
    const result = fromBusinessMembershipInvitationDocument("inv-1", {
      ...VALID_RAW,
      role: "owner",
    });
    expect(result).toBeNull();
  });
});
