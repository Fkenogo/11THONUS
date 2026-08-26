import { describe, expect, it } from "vitest";
import { toCallGetBusinessContext } from "./businessContextCallable";
import type { BusinessContext } from "./businessContext";

const context: BusinessContext = {
  businessId: "b-1",
  businessCode: "BC-1",
  displayName: "Acme",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  branch: { branchId: "br-1", displayName: "Main", countryCode: "BI", city: "Bujumbura" },
  termsAcceptance: { accepted: false },
};

describe("toCallGetBusinessContext", () => {
  it("passes businessId through and returns the resolved context", async () => {
    const call = toCallGetBusinessContext(async (payload) => {
      expect(payload).toMatchObject({ businessId: "b-1" });
      return { data: context };
    });

    const result = await call(
      { getIdToken: async () => "t", referenceType: "email" },
      { businessId: "b-1" },
    );

    expect(result).toEqual(context);
  });
});
