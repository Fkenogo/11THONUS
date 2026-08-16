import { describe, expect, it } from "vitest";
import {
  compareTrustLevels,
  createTrustLevel,
  isAtLeastTrustLevel,
  isTrustLevel,
  TRUST_LEVELS,
  TrustLevel,
} from "./trustLevel";
import { TrustDomainError } from "./trustErrors";

describe("createTrustLevel", () => {
  it.each(TRUST_LEVELS)("accepts the known trust level %s", (value) => {
    expect(createTrustLevel(value)).toBe(value);
  });

  it("rejects an unrecognised trust level", () => {
    expect(() => createTrustLevel("verified")).toThrow(TrustDomainError);
  });

  it("rejects a numeric-looking score string", () => {
    expect(() => createTrustLevel("73")).toThrow(TrustDomainError);
  });

  it("rejects an empty string", () => {
    expect(() => createTrustLevel("")).toThrow(TrustDomainError);
  });

  it("is case-sensitive (rejects Established)", () => {
    expect(() => createTrustLevel("Established")).toThrow(TrustDomainError);
  });
});

describe("isTrustLevel", () => {
  it.each(TRUST_LEVELS)("returns true for %s", (value) => {
    expect(isTrustLevel(value)).toBe(true);
  });

  it("returns false for an unrecognised value", () => {
    expect(isTrustLevel("gold")).toBe(false);
  });
});

describe("TRUST_LEVELS closed set", () => {
  it("contains exactly the three Founder-countersigned bands, in order", () => {
    expect(TRUST_LEVELS).toEqual(["unverified", "provisional", "established"]);
  });

  it("has exactly three members (no numeric score, no extra band)", () => {
    expect(TRUST_LEVELS.length).toBe(3);
  });
});

describe("compareTrustLevels", () => {
  it("orders unverified < provisional < established", () => {
    expect(compareTrustLevels("unverified", "provisional")).toBeLessThan(0);
    expect(compareTrustLevels("provisional", "established")).toBeLessThan(0);
    expect(compareTrustLevels("unverified", "established")).toBeLessThan(0);
  });

  it("returns 0 for equal levels", () => {
    const levels: TrustLevel[] = ["unverified", "provisional", "established"];
    for (const level of levels) {
      expect(compareTrustLevels(level, level)).toBe(0);
    }
  });

  it("is anti-symmetric", () => {
    expect(compareTrustLevels("established", "unverified")).toBeGreaterThan(0);
  });
});

describe("isAtLeastTrustLevel", () => {
  it("returns true when the level meets the minimum", () => {
    expect(isAtLeastTrustLevel("established", "provisional")).toBe(true);
    expect(isAtLeastTrustLevel("provisional", "provisional")).toBe(true);
  });

  it("returns false when the level is below the minimum", () => {
    expect(isAtLeastTrustLevel("unverified", "provisional")).toBe(false);
  });
});
