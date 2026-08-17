import { describe, expect, it } from "vitest";
import { isWellFormedBusinessCode, createBusinessCode } from "../models/businessCode";
import { RandomBusinessCodeCandidateGenerator } from "./randomBusinessCodeCandidateGenerator";

describe("RandomBusinessCodeCandidateGenerator", () => {
  it("generates candidates that are always well-formed business codes", () => {
    const generator = new RandomBusinessCodeCandidateGenerator();
    for (let i = 0; i < 200; i++) {
      const candidate = generator.generateCandidate();
      expect(isWellFormedBusinessCode(candidate)).toBe(true);
    }
  });

  it("canonicalizing a generated candidate is idempotent (already canonical)", () => {
    const generator = new RandomBusinessCodeCandidateGenerator();
    const candidate = generator.generateCandidate();
    expect(createBusinessCode(candidate)).toBe(candidate);
  });

  it("does not draw from a sequential/predictable pattern across repeated calls", () => {
    const generator = new RandomBusinessCodeCandidateGenerator();
    const candidates = new Set<string>();
    for (let i = 0; i < 50; i++) {
      candidates.add(generator.generateCandidate());
    }
    // With a 1.07B-combination space, 50 draws colliding down to a tiny
    // distinct set would indicate a broken (non-random/sequential)
    // generator, not genuine collision — assert genuine variety.
    expect(candidates.size).toBeGreaterThan(45);
  });
});
