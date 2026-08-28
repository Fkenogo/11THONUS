import { describe, expect, it } from "vitest";
import {
  toCallListStaffInvitations,
  toCallListStaffMemberships,
  type StaffInvitationSummary,
} from "./staffLists";

describe("toCallListStaffInvitations", () => {
  it("passes businessId and optional statusFilter through", async () => {
    const invitations: StaffInvitationSummary[] = [
      {
        invitationId: "inv-1",
        role: "staff",
        status: "invited",
        deliveryType: "email",
        invitedAt: "t1",
        expiresAt: "t2",
      },
    ];
    const call = toCallListStaffInvitations(async (payload) => {
      expect(payload).toMatchObject({ businessId: "b-1", statusFilter: "invited" });
      return { data: invitations };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1", statusFilter: "invited" },
    );

    expect(result).toEqual(invitations);
  });

  it("passes the additive email field through unchanged when present (FD-P3-002-G-001)", async () => {
    const invitations: StaffInvitationSummary[] = [
      {
        invitationId: "inv-1",
        role: "staff",
        status: "invited",
        deliveryType: "email",
        email: "invitee@example.com",
        invitedAt: "t1",
        expiresAt: "t2",
      },
    ];
    const call = toCallListStaffInvitations(async () => ({ data: invitations }));

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1" },
    );

    expect(result[0]?.email).toBe("invitee@example.com");
  });
});

describe("toCallListStaffMemberships", () => {
  it("passes businessId through", async () => {
    const memberships = [{ membershipId: "m-1", role: "owner", status: "active" }];
    const call = toCallListStaffMemberships(async (payload) => {
      expect(payload).toMatchObject({ businessId: "b-1" });
      return { data: memberships };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1" },
    );

    expect(result).toEqual(memberships);
  });

  it("passes the additive displayName field through unchanged when present (FD-P3-002-G-001)", async () => {
    const memberships = [
      { membershipId: "m-1", role: "owner", status: "active", displayName: "Ada Lovelace" },
    ];
    const call = toCallListStaffMemberships(async () => ({ data: memberships }));

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1" },
    );

    expect(result[0]?.displayName).toBe("Ada Lovelace");
  });
});
