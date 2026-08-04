import { describe, expect, it } from "vitest";
import { createLoyaltyNumber, formatLoyaltyNumberForDisplay } from "./loyaltyNumber";
import { LoyaltyNumberDomainError } from "./loyaltyNumberErrors";

describe("createLoyaltyNumber", () => {
  it("accepts the confirmed baseline format with a separator", () => {
    const value = createLoyaltyNumber("ABC-234");
    expect(value).toBe("ABC234");
  });

  it("accepts the confirmed baseline format without a separator", () => {
    const value = createLoyaltyNumber("ABC234");
    expect(value).toBe("ABC234");
  });

  it("normalises lowercase input to the canonical uppercase form", () => {
    const value = createLoyaltyNumber("abc-234");
    expect(value).toBe("ABC234");
  });

  it("rejects a value with the wrong length", () => {
    expect(() => createLoyaltyNumber("AB-234")).toThrow(LoyaltyNumberDomainError);
    expect(() => createLoyaltyNumber("ABCD-234")).toThrow(LoyaltyNumberDomainError);
  });

  it("rejects excluded letters I and O", () => {
    expect(() => createLoyaltyNumber("ABI-234")).toThrow(LoyaltyNumberDomainError);
    expect(() => createLoyaltyNumber("ABO-234")).toThrow(LoyaltyNumberDomainError);
  });

  it("rejects excluded digits 0 and 1", () => {
    expect(() => createLoyaltyNumber("ABC-034")).toThrow(LoyaltyNumberDomainError);
    expect(() => createLoyaltyNumber("ABC-134")).toThrow(LoyaltyNumberDomainError);
  });

  it("rejects non-alphanumeric characters", () => {
    expect(() => createLoyaltyNumber("AB$-234")).toThrow(LoyaltyNumberDomainError);
  });

  it("rejects the deferred checksum-enhanced extended format", () => {
    expect(() => createLoyaltyNumber("ABC-234-X")).toThrow(LoyaltyNumberDomainError);
    expect(() => createLoyaltyNumber("ABC234X")).toThrow(LoyaltyNumberDomainError);
  });

  it("rejects an empty value", () => {
    expect(() => createLoyaltyNumber("")).toThrow(LoyaltyNumberDomainError);
  });

  it("two loyalty numbers created from equivalent input are equal by value", () => {
    const a = createLoyaltyNumber("ABC-234");
    const b = createLoyaltyNumber("abc234");
    expect(a).toBe(b);
  });

  it("round-trips through JSON without formatting applied (serialization boundary)", () => {
    const value = createLoyaltyNumber("ABC-234");
    const serialized = JSON.stringify({ loyaltyNumber: value });
    const parsed = JSON.parse(serialized) as { loyaltyNumber: string };
    expect(parsed.loyaltyNumber).toBe("ABC234");
  });
});

describe("formatLoyaltyNumberForDisplay", () => {
  it("applies the separator only at render time", () => {
    const value = createLoyaltyNumber("ABC234");
    expect(formatLoyaltyNumberForDisplay(value)).toBe("ABC-234");
  });
});
