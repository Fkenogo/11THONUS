import { describe, expect, it } from "vitest";
import { toCallCreateBusiness } from "./createBusiness";

describe("toCallCreateBusiness", () => {
  it("passes the required fields and idempotencyKey through, and returns the bootstrap result directly (no authorizeAndExecute wrapper — bootstrap precedes any Business to authorize against)", async () => {
    const call = toCallCreateBusiness(async (payload) => {
      expect(payload).toMatchObject({
        displayName: "Acme Salon",
        primaryCategoryId: "cat-1",
        countryCode: "BI",
        currencyCode: "BIF",
        timezone: "Africa/Bujumbura",
        city: "Bujumbura",
        contactPhone: "+25761234567",
        idempotencyKey: "key-1",
      });
      return {
        data: { businessId: "b-1", businessCode: "BC-1", branchId: "br-1", status: "draft" },
      };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      {
        displayName: "Acme Salon",
        primaryCategoryId: "cat-1",
        countryCode: "BI",
        currencyCode: "BIF",
        timezone: "Africa/Bujumbura",
        city: "Bujumbura",
        contactPhone: "+25761234567",
        idempotencyKey: "key-1",
      },
    );

    expect(result).toEqual({
      businessId: "b-1",
      businessCode: "BC-1",
      branchId: "br-1",
      status: "draft",
    });
  });
});
