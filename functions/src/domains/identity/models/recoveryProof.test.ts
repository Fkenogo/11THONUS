import { describe, expect, it } from "vitest";
import {
  RECOVERY_PROOF_METHOD_CATEGORIES,
  createRecoveryProofMethodCategory,
  validateRecoveryProof,
  type RecoveryProof,
} from "./recoveryProof";
import { IdentityDomainError } from "./identityErrors";

const now = new Date("2026-08-05T00:00:00.000Z");

function buildProof(overrides: Partial<RecoveryProof> = {}): RecoveryProof {
  return {
    result: "accepted",
    methodCategory: "support_assisted",
    proofReference: "proof_ref_1",
    authority: "support_initiated",
    completedAt: now,
    targetCustomerIdentityId: "cust_1",
    ...overrides,
  };
}

describe("RECOVERY_PROOF_METHOD_CATEGORIES / createRecoveryProofMethodCategory", () => {
  it("accepts every defined category", () => {
    for (const category of RECOVERY_PROOF_METHOD_CATEGORIES) {
      expect(createRecoveryProofMethodCategory(category)).toBe(category);
    }
  });

  it("rejects an unrecognised category", () => {
    expect(() => createRecoveryProofMethodCategory("sms_otp")).toThrow(IdentityDomainError);
  });

  it("does not include a business-ownership-specific category (TRD12 §12.32 is a separate concern)", () => {
    expect(RECOVERY_PROOF_METHOD_CATEGORIES).not.toContain("business_owner_recovery");
  });
});

describe("validateRecoveryProof", () => {
  it("accepts a valid, matching, unexpired proof", () => {
    expect(() => validateRecoveryProof(buildProof(), "cust_1", now)).not.toThrow();
  });

  it("rejects a missing proof", () => {
    expect(() => validateRecoveryProof(undefined, "cust_1", now)).toThrow(IdentityDomainError);
  });

  it("rejects an empty/whitespace proof reference as malformed", () => {
    expect(() =>
      validateRecoveryProof(buildProof({ proofReference: "   " }), "cust_1", now),
    ).toThrow(IdentityDomainError);
  });

  it("rejects a rejected proof result", () => {
    expect(() => validateRecoveryProof(buildProof({ result: "rejected" }), "cust_1", now)).toThrow(
      IdentityDomainError,
    );
  });

  it("rejects a proof issued for a different target identity", () => {
    expect(() =>
      validateRecoveryProof(buildProof({ targetCustomerIdentityId: "cust_2" }), "cust_1", now),
    ).toThrow(IdentityDomainError);
  });

  it("rejects an expired proof when expiry is governed", () => {
    const expiresAt = new Date(now.getTime() - 1000);
    expect(() => validateRecoveryProof(buildProof({ expiresAt }), "cust_1", now)).toThrow(
      IdentityDomainError,
    );
  });

  it("accepts a proof with a future expiry", () => {
    const expiresAt = new Date(now.getTime() + 1000);
    expect(() => validateRecoveryProof(buildProof({ expiresAt }), "cust_1", now)).not.toThrow();
  });

  it("accepts a proof with no expiry at all (ungoverned)", () => {
    expect(() =>
      validateRecoveryProof(buildProof({ expiresAt: undefined }), "cust_1", now),
    ).not.toThrow();
  });
});
