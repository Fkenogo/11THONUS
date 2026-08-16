import { describe, expect, it } from "vitest";
import {
  createTrustEvidenceCategory,
  isTrustEvidenceCategory,
  TRUST_EVIDENCE_CATEGORIES,
} from "./trustEvidenceCategory";
import { TrustDomainError } from "./trustErrors";

describe("createTrustEvidenceCategory", () => {
  it.each(TRUST_EVIDENCE_CATEGORIES)("accepts the known category %s", (value) => {
    expect(createTrustEvidenceCategory(value)).toBe(value);
  });

  it("rejects an ungoverned future category (purchase history)", () => {
    expect(() => createTrustEvidenceCategory("purchase_history")).toThrow(TrustDomainError);
  });

  it("rejects an ungoverned future category (device history)", () => {
    expect(() => createTrustEvidenceCategory("device_history")).toThrow(TrustDomainError);
  });

  it("rejects an empty string", () => {
    expect(() => createTrustEvidenceCategory("")).toThrow(TrustDomainError);
  });
});

describe("isTrustEvidenceCategory", () => {
  it("returns false for an unrecognised value", () => {
    expect(isTrustEvidenceCategory("merchant_history")).toBe(false);
  });
});
