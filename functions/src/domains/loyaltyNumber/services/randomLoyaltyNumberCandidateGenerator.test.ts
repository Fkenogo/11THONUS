import { describe, expect, it } from "vitest";
import { RandomLoyaltyNumberCandidateGenerator } from "./randomLoyaltyNumberCandidateGenerator";
import { createLoyaltyNumber } from "../models/loyaltyNumber";

describe("RandomLoyaltyNumberCandidateGenerator", () => {
  it("generates candidates that pass createLoyaltyNumber validation", () => {
    const generator = new RandomLoyaltyNumberCandidateGenerator();
    for (let i = 0; i < 50; i++) {
      const candidate = generator.generateCandidate();
      expect(() => createLoyaltyNumber(candidate)).not.toThrow();
    }
  });

  it("never includes the excluded letters I/O or excluded digits 0/1", () => {
    const generator = new RandomLoyaltyNumberCandidateGenerator();
    for (let i = 0; i < 50; i++) {
      const candidate = generator.generateCandidate();
      expect(candidate).not.toMatch(/[IO01]/);
    }
  });
});
