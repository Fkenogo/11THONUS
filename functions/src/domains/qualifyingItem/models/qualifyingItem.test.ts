import { describe, expect, it } from "vitest";
import {
  QUALIFYING_ITEM_NAME_MAX_LENGTH,
  QUALIFYING_ITEM_STATUSES,
  isWellFormedQualifyingItemId,
  normalizeQualifyingItemName,
} from "./qualifyingItem";
import { QualifyingItemDomainError } from "./qualifyingItemErrors";

describe("QualifyingItem lifecycle vocabulary", () => {
  it("matches the migration 0016 CHECK constraint exactly: active, retired", () => {
    expect([...QUALIFYING_ITEM_STATUSES]).toEqual(["active", "retired"]);
  });
});

describe("normalizeQualifyingItemName", () => {
  it("trims surrounding whitespace and preserves the Business-authored casing/content", () => {
    expect(normalizeQualifyingItemName("  Black Coffee  ")).toBe("Black Coffee");
  });

  it("accepts a name at exactly the maximum length", () => {
    const name = "a".repeat(QUALIFYING_ITEM_NAME_MAX_LENGTH);
    expect(normalizeQualifyingItemName(name)).toBe(name);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a number", 42],
    ["an object", {}],
    ["the empty string", ""],
    ["whitespace only", "   \t\n "],
  ])("rejects %s with VALIDATION_FAILED on the name field", (_label, value) => {
    try {
      normalizeQualifyingItemName(value);
      expect.unreachable("expected a QualifyingItemDomainError");
    } catch (error) {
      expect(error).toBeInstanceOf(QualifyingItemDomainError);
      expect((error as QualifyingItemDomainError).category).toBe("VALIDATION_FAILED");
      expect((error as QualifyingItemDomainError).fieldErrors?.[0]?.field).toBe("name");
    }
  });

  it("rejects a name longer than the maximum after trimming", () => {
    const tooLong = "a".repeat(QUALIFYING_ITEM_NAME_MAX_LENGTH + 1);
    expect(() => normalizeQualifyingItemName(tooLong)).toThrow(QualifyingItemDomainError);
    // Padding does not count toward the limit.
    expect(
      normalizeQualifyingItemName(`  ${"a".repeat(QUALIFYING_ITEM_NAME_MAX_LENGTH)}  `),
    ).toHaveLength(QUALIFYING_ITEM_NAME_MAX_LENGTH);
  });

  it("does not require or interpret any Commerce Knowledge taxonomy for the name", () => {
    // A plain Business-authored label is valid on its own.
    expect(normalizeQualifyingItemName("Medium Pizza")).toBe("Medium Pizza");
  });
});

describe("isWellFormedQualifyingItemId", () => {
  it("accepts a canonical UUID", () => {
    expect(isWellFormedQualifyingItemId("3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b3c")).toBe(true);
  });

  it.each([
    "",
    "not-a-uuid",
    "123",
    "../../etc/passwd",
    "3f2b8c1e9d4a4e6b8a1c0d5e7f9a2b3c",
    "'; DROP TABLE qualifying_items;--",
  ])("rejects the malformed/fabricated id %j before it can reach the database", (value) => {
    expect(isWellFormedQualifyingItemId(value)).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isWellFormedQualifyingItemId(undefined as never)).toBe(false);
    expect(isWellFormedQualifyingItemId(null as never)).toBe(false);
  });
});
