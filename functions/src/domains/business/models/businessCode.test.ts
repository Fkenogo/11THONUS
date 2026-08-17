import { describe, expect, it } from "vitest";
import {
  BUSINESS_CODE_ALPHABET,
  BUSINESS_CODE_PREFIX,
  BUSINESS_CODE_RANDOM_LENGTH,
  MAX_BUSINESS_CODE_GENERATION_ATTEMPTS,
  createBusinessCode,
  formatBusinessCodeForDisplay,
  isWellFormedBusinessCode,
} from "./businessCode";

describe("BUSINESS_CODE_ALPHABET", () => {
  it("excludes ambiguous characters (I, O, 0, 1)", () => {
    expect(BUSINESS_CODE_ALPHABET).not.toMatch(/[IO01]/);
  });

  it("is exactly 32 symbols (24 letters + 8 digits)", () => {
    expect(BUSINESS_CODE_ALPHABET).toHaveLength(32);
    expect(new Set(BUSINESS_CODE_ALPHABET.split("")).size).toBe(32);
  });
});

describe("createBusinessCode", () => {
  it("accepts a well-formed canonical code", () => {
    expect(createBusinessCode("BIZABCDEF")).toBe("BIZABCDEF");
  });

  it("accepts a hyphenated display-format input and canonicalizes it", () => {
    expect(createBusinessCode("BIZ-ABCDEF")).toBe("BIZABCDEF");
  });

  it("is case-insensitive on input, canonical form is uppercase", () => {
    expect(createBusinessCode("biz-abcdef")).toBe("BIZABCDEF");
  });

  it("rejects a code with the wrong prefix", () => {
    expect(() => createBusinessCode("XYZABCDEF")).toThrow();
  });

  it("rejects a code with the wrong random-segment length", () => {
    expect(() => createBusinessCode("BIZABCDE")).toThrow();
    expect(() => createBusinessCode("BIZABCDEFG")).toThrow();
  });

  it("rejects ambiguous characters (I, O, 0, 1) in the random segment", () => {
    expect(() => createBusinessCode("BIZABCDEI")).toThrow();
    expect(() => createBusinessCode("BIZABCDEO")).toThrow();
    expect(() => createBusinessCode("BIZABCDE0")).toThrow();
    expect(() => createBusinessCode("BIZABCDE1")).toThrow();
  });

  it("rejects the exact Loyalty Number shape (structurally disjoint format)", () => {
    expect(() => createBusinessCode("ABC234")).toThrow();
  });

  it("rejects empty/blank input", () => {
    expect(() => createBusinessCode("")).toThrow();
    expect(() => createBusinessCode("   ")).toThrow();
  });
});

describe("isWellFormedBusinessCode", () => {
  it("returns true only for a valid canonical code, never throws", () => {
    expect(isWellFormedBusinessCode("BIZABCDEF")).toBe(true);
    expect(isWellFormedBusinessCode("not-a-code")).toBe(false);
    expect(isWellFormedBusinessCode("")).toBe(false);
  });
});

describe("formatBusinessCodeForDisplay", () => {
  it("inserts a hyphen after the prefix, canonical storage has none", () => {
    const code = createBusinessCode("BIZABCDEF");
    expect(formatBusinessCodeForDisplay(code)).toBe("BIZ-ABCDEF");
    expect(code).toBe("BIZABCDEF");
  });
});

describe("policy constants", () => {
  it("BUSINESS_CODE_PREFIX is the constant, non-variable disambiguation tag", () => {
    expect(BUSINESS_CODE_PREFIX).toBe("BIZ");
  });

  it("BUSINESS_CODE_RANDOM_LENGTH matches the derived namespace size", () => {
    expect(BUSINESS_CODE_RANDOM_LENGTH).toBe(6);
  });

  it("MAX_BUSINESS_CODE_GENERATION_ATTEMPTS is a small bounded retry count (policy only — execution is 002B's)", () => {
    expect(MAX_BUSINESS_CODE_GENERATION_ATTEMPTS).toBe(5);
  });
});
