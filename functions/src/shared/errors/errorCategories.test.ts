import { describe, expect, it } from "vitest";
import { ERROR_CATEGORIES, isErrorCategory } from "./errorCategories";

describe("ERROR_CATEGORIES", () => {
  it("contains exactly the 14 categories TRD11 §11.35 defines", () => {
    expect(ERROR_CATEGORIES).toEqual([
      "AUTH_REQUIRED",
      "AUTH_FORBIDDEN",
      "ACCOUNT_SUSPENDED",
      "BUSINESS_INACTIVE",
      "SUBSCRIPTION_LIMIT_REACHED",
      "INVALID_STATE_TRANSITION",
      "PURCHASE_ALREADY_RESPONDED",
      "REWARD_NOT_AVAILABLE",
      "REWARD_ALREADY_REDEEMED",
      "IDEMPOTENCY_CONFLICT",
      "VALIDATION_FAILED",
      "RESOURCE_NOT_FOUND",
      "TEMPORARY_UNAVAILABLE",
      "INTEGRATION_FAILED",
    ]);
  });
});

describe("isErrorCategory", () => {
  it("returns true for a known category", () => {
    expect(isErrorCategory("IDEMPOTENCY_CONFLICT")).toBe(true);
  });

  it("returns false for an unknown string", () => {
    expect(isErrorCategory("NOT_A_REAL_CATEGORY")).toBe(false);
  });
});
