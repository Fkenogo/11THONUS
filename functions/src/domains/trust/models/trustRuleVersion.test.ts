import { describe, expect, it } from "vitest";
import { createTrustRuleVersion } from "./trustRuleVersion";
import { TrustDomainError } from "./trustErrors";

describe("createTrustRuleVersion", () => {
  it("accepts a positive integer", () => {
    expect(createTrustRuleVersion(1)).toBe(1);
    expect(createTrustRuleVersion(2)).toBe(2);
  });

  it("rejects zero", () => {
    expect(() => createTrustRuleVersion(0)).toThrow(TrustDomainError);
  });

  it("rejects a negative number", () => {
    expect(() => createTrustRuleVersion(-1)).toThrow(TrustDomainError);
  });

  it("rejects a non-integer", () => {
    expect(() => createTrustRuleVersion(1.5)).toThrow(TrustDomainError);
  });

  it("rejects NaN", () => {
    expect(() => createTrustRuleVersion(Number.NaN)).toThrow(TrustDomainError);
  });
});
