import { describe, expect, it } from "vitest";
import { isEstablishmentComplete } from "./establishmentCompleteness";
import type { BusinessContext } from "../../api/businessContext";

const baseContext: BusinessContext = {
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

describe("isEstablishmentComplete", () => {
  it("is true for a persisted Business with identity, classification, and a real branch — regardless of Terms/Team state", () => {
    expect(isEstablishmentComplete(baseContext)).toBe(true);
  });

  it("is false when the branch is null (integrity failure), never treated as a normal incomplete step", () => {
    expect(isEstablishmentComplete({ ...baseContext, branch: null })).toBe(false);
  });

  it("does not depend on Terms acceptance at all", () => {
    expect(isEstablishmentComplete({ ...baseContext, termsAcceptance: { accepted: true } })).toBe(
      true,
    );
  });
});
