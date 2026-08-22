import { describe, expect, it } from "vitest";
import {
  isBranchComplete,
  isBusinessDetailsComplete,
  isClassificationComplete,
  isReadyToSubmit,
  isTermsComplete,
} from "./completeness";
import type { BusinessContext } from "../api/businessContext";

const baseContext: BusinessContext = {
  businessId: "b-1",
  businessCode: "BC-1",
  displayName: "Acme Salon",
  status: "draft",
  primaryCategoryId: "cat-1",
  countryCode: "BI",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  branch: {
    branchId: "br-1",
    displayName: "Main",
    countryCode: "BI",
    city: "Bujumbura",
  },
  termsAcceptance: { accepted: false },
};

describe("isBusinessDetailsComplete", () => {
  it("is true when every required detail field is populated", () => {
    expect(isBusinessDetailsComplete(baseContext)).toBe(true);
  });

  it("is false when displayName is empty", () => {
    expect(isBusinessDetailsComplete({ ...baseContext, displayName: "" })).toBe(false);
  });

  it("is false when contactPhone is empty", () => {
    expect(isBusinessDetailsComplete({ ...baseContext, contactPhone: "" })).toBe(false);
  });
});

describe("isClassificationComplete", () => {
  it("is true when primaryCategoryId is set (businessTypeId is optional)", () => {
    expect(isClassificationComplete(baseContext)).toBe(true);
  });

  it("is false when primaryCategoryId is empty", () => {
    expect(isClassificationComplete({ ...baseContext, primaryCategoryId: "" })).toBe(false);
  });
});

describe("isBranchComplete", () => {
  it("is true when the branch exists with its required fields populated", () => {
    expect(isBranchComplete(baseContext)).toBe(true);
  });

  it("is false when branch is null (integrity failure, not a normal onboarding step)", () => {
    expect(isBranchComplete({ ...baseContext, branch: null })).toBe(false);
  });

  it("is false when the branch is missing a required field", () => {
    expect(
      isBranchComplete({
        ...baseContext,
        branch: { branchId: "br-1", displayName: "", countryCode: "BI", city: "Bujumbura" },
      }),
    ).toBe(false);
  });
});

describe("isTermsComplete", () => {
  it("is true only when termsAcceptance.accepted is true", () => {
    expect(
      isTermsComplete({ ...baseContext, termsAcceptance: { accepted: true, version: "v1" } }),
    ).toBe(true);
  });

  it("is false when not accepted", () => {
    expect(isTermsComplete(baseContext)).toBe(false);
  });
});

describe("isReadyToSubmit", () => {
  it("is true only when details, classification, branch, and terms are all complete", () => {
    expect(
      isReadyToSubmit({ ...baseContext, termsAcceptance: { accepted: true, version: "v1" } }),
    ).toBe(true);
  });

  it("is false when any single required stage is incomplete", () => {
    expect(isReadyToSubmit(baseContext)).toBe(false); // terms not accepted
    expect(isReadyToSubmit({ ...baseContext, branch: null })).toBe(false);
    expect(isReadyToSubmit({ ...baseContext, primaryCategoryId: "" })).toBe(false);
  });
});
