import { describe, expect, it } from "vitest";
import { toCallUpdateBusinessBranchProfile, toCallUpdateBusinessProfile } from "./businessProfile";

describe("toCallUpdateBusinessProfile", () => {
  it("passes businessId, patch fields and idempotencyKey through", async () => {
    const call = toCallUpdateBusinessProfile(async (payload) => {
      expect(payload).toMatchObject({
        businessId: "b-1",
        displayName: "New Name",
        idempotencyKey: "key-1",
      });
      return { data: { outcome: "executed", decision: {}, result: { businessId: "b-1" } } };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1", patch: { displayName: "New Name" }, idempotencyKey: "key-1" },
    );

    expect(result).toEqual({ businessId: "b-1" });
  });
});

describe("toCallUpdateBusinessBranchProfile", () => {
  it("passes businessId, branchId, patch fields and idempotencyKey through", async () => {
    const call = toCallUpdateBusinessBranchProfile(async (payload) => {
      expect(payload).toMatchObject({
        businessId: "b-1",
        branchId: "br-1",
        city: "Gitega",
        idempotencyKey: "key-2",
      });
      return { data: { outcome: "executed", decision: {}, result: { branchId: "br-1" } } };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1", branchId: "br-1", patch: { city: "Gitega" }, idempotencyKey: "key-2" },
    );

    expect(result).toEqual({ branchId: "br-1" });
  });
});
