import { describe, expect, it } from "vitest";
import { BusinessApiError } from "./businessCallableClient";
import {
  toCallAcceptStaffInvitation,
  toCallChangeStaffMembershipRole,
  toCallReactivateStaffMembership,
  toCallRemoveStaffMembership,
  toCallSuspendStaffMembership,
} from "./staffMembershipMutations";

const actor = { getIdToken: async () => "t", referenceType: "email" as const };

describe("toCallAcceptStaffInvitation", () => {
  it("passes invitationReference and idempotencyKey through and returns the wire result directly (no outcome envelope)", async () => {
    const call = toCallAcceptStaffInvitation(async (payload) => {
      expect(payload).toMatchObject({
        invitationReference: "inv-ref-1",
        idempotencyKey: "key-1",
      });
      return {
        data: {
          membershipId: "mem-1",
          businessId: "b-1",
          userId: "u-1",
          role: "staff",
          acceptedAt: "2026-09-12T00:00:00.000Z",
        },
      };
    });

    const result = await call(actor, {
      invitationReference: "inv-ref-1",
      idempotencyKey: "key-1",
    });

    expect(result).toEqual({
      membershipId: "mem-1",
      businessId: "b-1",
      userId: "u-1",
      role: "staff",
      acceptedAt: "2026-09-12T00:00:00.000Z",
    });
  });
});

describe("toCallSuspendStaffMembership", () => {
  it("passes businessId, targetMembershipId and idempotencyKey through and unwraps the executed result", async () => {
    const call = toCallSuspendStaffMembership(async (payload) => {
      expect(payload).toMatchObject({
        businessId: "b-1",
        targetMembershipId: "mem-9",
        idempotencyKey: "key-2",
      });
      return {
        data: {
          outcome: "executed",
          decision: {},
          result: {
            membershipId: "mem-9",
            businessId: "b-1",
            userId: "u-9",
            role: "staff",
            status: "suspended",
            updatedAt: "2026-09-12T00:00:00.000Z",
          },
        },
      };
    });

    const result = await call(actor, {
      businessId: "b-1",
      targetMembershipId: "mem-9",
      idempotencyKey: "key-2",
    });

    expect(result?.status).toBe("suspended");
  });

  it("maps a denied outcome to auth_forbidden (never a raw permission id)", async () => {
    const call = toCallSuspendStaffMembership(async () => ({
      data: { outcome: "denied", decision: {} },
    }));

    await expect(
      call(actor, { businessId: "b-1", targetMembershipId: "mem-9", idempotencyKey: "k" }),
    ).rejects.toBeInstanceOf(BusinessApiError);
  });
});

describe("toCallReactivateStaffMembership", () => {
  it("passes businessId, targetMembershipId and idempotencyKey through and unwraps the executed result", async () => {
    const call = toCallReactivateStaffMembership(async (payload) => {
      expect(payload).toMatchObject({
        businessId: "b-1",
        targetMembershipId: "mem-9",
        idempotencyKey: "key-3",
      });
      return {
        data: {
          outcome: "executed",
          decision: {},
          result: {
            membershipId: "mem-9",
            businessId: "b-1",
            userId: "u-9",
            role: "staff",
            status: "active",
            updatedAt: "2026-09-12T00:00:00.000Z",
          },
        },
      };
    });

    const result = await call(actor, {
      businessId: "b-1",
      targetMembershipId: "mem-9",
      idempotencyKey: "key-3",
    });

    expect(result?.status).toBe("active");
  });
});

describe("toCallRemoveStaffMembership", () => {
  it("passes businessId, targetMembershipId and idempotencyKey through and unwraps the executed result", async () => {
    const call = toCallRemoveStaffMembership(async (payload) => {
      expect(payload).toMatchObject({
        businessId: "b-1",
        targetMembershipId: "mem-9",
        idempotencyKey: "key-4",
      });
      return {
        data: {
          outcome: "executed",
          decision: {},
          result: {
            membershipId: "mem-9",
            businessId: "b-1",
            userId: "u-9",
            role: "staff",
            status: "removed",
            updatedAt: "2026-09-12T00:00:00.000Z",
          },
        },
      };
    });

    const result = await call(actor, {
      businessId: "b-1",
      targetMembershipId: "mem-9",
      idempotencyKey: "key-4",
    });

    expect(result?.status).toBe("removed");
  });
});

describe("toCallChangeStaffMembershipRole", () => {
  it("passes businessId, targetMembershipId, fromRole, toRole and idempotencyKey through and unwraps the executed result", async () => {
    const call = toCallChangeStaffMembershipRole(async (payload) => {
      expect(payload).toMatchObject({
        businessId: "b-1",
        targetMembershipId: "mem-9",
        fromRole: "staff",
        toRole: "manager",
        idempotencyKey: "key-5",
      });
      return {
        data: {
          outcome: "executed",
          decision: {},
          result: {
            membershipId: "mem-9",
            businessId: "b-1",
            userId: "u-9",
            fromRole: "staff",
            toRole: "manager",
            updatedAt: "2026-09-12T00:00:00.000Z",
          },
        },
      };
    });

    const result = await call(actor, {
      businessId: "b-1",
      targetMembershipId: "mem-9",
      fromRole: "staff",
      toRole: "manager",
      idempotencyKey: "key-5",
    });

    expect(result?.toRole).toBe("manager");
  });

  it("maps a denied outcome to auth_forbidden", async () => {
    const call = toCallChangeStaffMembershipRole(async () => ({
      data: { outcome: "denied", decision: {} },
    }));

    await expect(
      call(actor, {
        businessId: "b-1",
        targetMembershipId: "mem-9",
        fromRole: "staff",
        toRole: "manager",
        idempotencyKey: "k",
      }),
    ).rejects.toBeInstanceOf(BusinessApiError);
  });
});
