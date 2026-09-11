import { describe, expect, it } from "vitest";
import { REQUIRED_VERIFIED_UNITS_MVP, REWARD_QUANTITY_FIXED } from "./loyaltyInvariants";

describe("loyaltyInvariants", () => {
  it("fixes the MVP Verified Units threshold at exactly 10", () => {
    expect(REQUIRED_VERIFIED_UNITS_MVP).toBe(10);
  });

  it("fixes rewardQuantity at exactly 1 per DEC-LOY-009", () => {
    expect(REWARD_QUANTITY_FIXED).toBe(1);
  });
});
