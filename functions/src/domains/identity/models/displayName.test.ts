import { describe, expect, it } from "vitest";
import { DISPLAY_NAME_MAX_LENGTH, normalizeDisplayName } from "./displayName";
import { IdentityDomainError } from "./identityErrors";

describe("normalizeDisplayName", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeDisplayName("  Fred Kenogo  ")).toBe("Fred Kenogo");
  });

  it("rejects an empty value", () => {
    expect(() => normalizeDisplayName("")).toThrow(IdentityDomainError);
  });

  it("rejects a whitespace-only value", () => {
    expect(() => normalizeDisplayName("   ")).toThrow(IdentityDomainError);
  });

  it("accepts a 1-character value", () => {
    expect(normalizeDisplayName("A")).toBe("A");
  });

  it("accepts a 50-character value", () => {
    const value = "A".repeat(DISPLAY_NAME_MAX_LENGTH);
    expect(normalizeDisplayName(value)).toBe(value);
  });

  it("rejects a 51-character value", () => {
    expect(() => normalizeDisplayName("A".repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toThrow(
      IdentityDomainError,
    );
  });

  it("accepts Unicode content", () => {
    expect(normalizeDisplayName("김민준")).toBe("김민준");
    expect(normalizeDisplayName("Amélie Dubois")).toBe("Amélie Dubois");
    expect(normalizeDisplayName("😀 star")).toBe("😀 star");
  });

  it("does not require username-style syntax (spaces, punctuation permitted)", () => {
    expect(normalizeDisplayName("Fred O'Kenogo-Smith Jr.")).toBe("Fred O'Kenogo-Smith Jr.");
  });

  it("rejects a non-string input", () => {
    expect(() => normalizeDisplayName(42 as unknown as string)).toThrow(IdentityDomainError);
  });

  it("uses the VALIDATION_FAILED category", () => {
    try {
      normalizeDisplayName("");
      expect.unreachable();
    } catch (error) {
      expect((error as IdentityDomainError).category).toBe("VALIDATION_FAILED");
    }
  });
});
