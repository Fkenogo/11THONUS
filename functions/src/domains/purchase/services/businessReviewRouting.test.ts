import { describe, expect, it } from "vitest";
import { resolveBusinessReviewRouting } from "./businessReviewRouting";

describe("resolveBusinessReviewRouting (EA-BL-001-CORR-002-BR)", () => {
  it("threshold NULL → waiting_for_customer at any quantity (Business Review disabled)", () => {
    for (const quantity of [1, 5, 10_000]) {
      expect(resolveBusinessReviewRouting({ threshold: null, quantity })).toBe(
        "waiting_for_customer",
      );
    }
  });

  it("below threshold → waiting_for_customer", () => {
    expect(resolveBusinessReviewRouting({ threshold: 10, quantity: 9 })).toBe(
      "waiting_for_customer",
    );
  });

  it("exactly at threshold → business_review_required", () => {
    expect(resolveBusinessReviewRouting({ threshold: 10, quantity: 10 })).toBe(
      "business_review_required",
    );
  });

  it("above threshold → business_review_required (never a rejection, never a cap)", () => {
    expect(resolveBusinessReviewRouting({ threshold: 10, quantity: 500 })).toBe(
      "business_review_required",
    );
  });

  it("an invalid threshold fails closed to disabled rather than reviewing everything", () => {
    expect(resolveBusinessReviewRouting({ threshold: 0, quantity: 3 })).toBe(
      "waiting_for_customer",
    );
    expect(resolveBusinessReviewRouting({ threshold: -2, quantity: 3 })).toBe(
      "waiting_for_customer",
    );
    expect(resolveBusinessReviewRouting({ threshold: 2.5, quantity: 3 })).toBe(
      "waiting_for_customer",
    );
  });
});
