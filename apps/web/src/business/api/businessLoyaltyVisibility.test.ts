import { describe, expect, it } from "vitest";
import {
  toCallListAvailableRewardsForBusiness,
  toCallListLoyaltyCycleProgressForBusiness,
} from "./businessLoyaltyVisibility";
import { BusinessApiError } from "./businessCallableClient";

const actor = { getIdToken: async () => "tok", referenceType: "email" as const };

describe("toCallListAvailableRewardsForBusiness", () => {
  it("sends only businessId/filter/pagination plus the actor token", async () => {
    const call = toCallListAvailableRewardsForBusiness(async (payload) => {
      expect(payload).toEqual({
        businessId: "b-1",
        limit: 100,
        rawToken: "tok",
        referenceType: "email",
      });
      return { data: { rewards: [] } };
    });
    expect(await call(actor, { businessId: "b-1", limit: 100 })).toEqual({ rewards: [] });
  });

  it("normalizes a denied call into a BusinessApiError", async () => {
    const call = toCallListAvailableRewardsForBusiness(async () => {
      throw Object.assign(new Error("denied"), { code: "functions/permission-denied" });
    });
    await expect(call(actor, { businessId: "b-1" })).rejects.toBeInstanceOf(BusinessApiError);
  });
});

describe("toCallListLoyaltyCycleProgressForBusiness", () => {
  it("passes the optional program filter through", async () => {
    const call = toCallListLoyaltyCycleProgressForBusiness(async (payload) => {
      expect(payload).toMatchObject({ businessId: "b-1", rewardProgramId: "rp-1" });
      return { data: { cycles: [] } };
    });
    expect(await call(actor, { businessId: "b-1", rewardProgramId: "rp-1" })).toEqual({
      cycles: [],
    });
  });
});
