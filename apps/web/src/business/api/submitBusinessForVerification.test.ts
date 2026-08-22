import { describe, expect, it } from "vitest";
import { toCallSubmitBusinessForVerification } from "./submitBusinessForVerification";

describe("toCallSubmitBusinessForVerification", () => {
  it("passes businessId and idempotencyKey through and unwraps the executed result", async () => {
    const call = toCallSubmitBusinessForVerification(async (payload) => {
      expect(payload).toMatchObject({ businessId: "b-1", idempotencyKey: "key-1" });
      return {
        data: {
          outcome: "executed",
          decision: {},
          result: { businessId: "b-1", status: "pending_verification" },
        },
      };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1", idempotencyKey: "key-1" },
    );

    expect(result).toEqual({ businessId: "b-1", status: "pending_verification" });
  });

  it("surfaces a denied outcome as a forbidden error rather than a fake success", async () => {
    const call = toCallSubmitBusinessForVerification(async () => ({
      data: { outcome: "denied", decision: {} },
    }));

    await expect(
      call(
        { getIdToken: async () => "t", referenceType: "email" },
        { businessId: "b-1", idempotencyKey: "k" },
      ),
    ).rejects.toMatchObject({ code: "auth_forbidden" });
  });
});
