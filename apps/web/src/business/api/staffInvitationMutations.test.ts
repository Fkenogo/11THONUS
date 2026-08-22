import { describe, expect, it } from "vitest";
import {
  toCallCreateStaffInvitation,
  toCallRevokeStaffInvitation,
} from "./staffInvitationMutations";

describe("toCallCreateStaffInvitation", () => {
  it("passes businessId, role, deliveryTarget and idempotencyKey through and unwraps the result", async () => {
    const call = toCallCreateStaffInvitation(async (payload) => {
      expect(payload).toMatchObject({
        businessId: "b-1",
        role: "staff",
        deliveryTarget: { type: "email", value: "a@b.com" },
        idempotencyKey: "key-1",
      });
      return { data: { outcome: "executed", decision: {}, result: { invitationId: "inv-1" } } };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      {
        businessId: "b-1",
        role: "staff",
        deliveryTarget: { type: "email", value: "a@b.com" },
        idempotencyKey: "key-1",
      },
    );

    expect(result).toEqual({ invitationId: "inv-1" });
  });
});

describe("toCallRevokeStaffInvitation", () => {
  it("passes businessId, invitationId and idempotencyKey through", async () => {
    const call = toCallRevokeStaffInvitation(async (payload) => {
      expect(payload).toMatchObject({
        businessId: "b-1",
        invitationId: "inv-1",
        idempotencyKey: "key-2",
      });
      return { data: { outcome: "executed", decision: {}, result: { invitationId: "inv-1" } } };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1", invitationId: "inv-1", idempotencyKey: "key-2" },
    );

    expect(result).toEqual({ invitationId: "inv-1" });
  });
});
