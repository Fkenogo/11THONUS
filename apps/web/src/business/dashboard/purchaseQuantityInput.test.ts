import { describe, expect, it } from "vitest";
import { parsePurchaseRecordQuantity } from "./purchaseQuantityInput";

describe("parsePurchaseRecordQuantity", () => {
  it("accepts a plain positive integer and returns the exact numeric value", () => {
    expect(parsePurchaseRecordQuantity("1")).toBe(1);
    expect(parsePurchaseRecordQuantity("2")).toBe(2);
    expect(parsePurchaseRecordQuantity("42")).toBe(42);
  });

  it.each([
    ["empty input", ""],
    ["whitespace-only input", "   "],
    ["zero", "0"],
    ["negative values", "-1"],
    ["a fractional value", "1.5"],
    ["trailing garbage after digits", "2abc"],
    ["non-numeric text", "abc"],
    ["the literal NaN", "NaN"],
    ["the literal Infinity", "Infinity"],
    ["a leading-zero value", "007"],
    ["leading whitespace around a valid digit", " 3"],
    ["trailing whitespace around a valid digit", "3 "],
    ["a plus-signed value", "+3"],
  ])("rejects %s (%j)", (_label, input) => {
    expect(parsePurchaseRecordQuantity(input)).toBeNull();
  });
});
