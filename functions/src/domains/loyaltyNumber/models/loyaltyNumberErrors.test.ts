import { describe, expect, it } from "vitest";
import {
  LoyaltyNumberDomainError,
  invalidLoyaltyNumberFormatError,
  invalidCustomerIdentityIdForLoyaltyNumberError,
  loyaltyNumberIssuanceExhaustedError,
  conflictingLoyaltyNumberAssignmentError,
  identityNotEligibleForIssuanceError,
  loyaltyNumberUniquenessCheckFailedError,
} from "./loyaltyNumberErrors";

describe("LoyaltyNumberDomainError", () => {
  it("carries category, message, and optional fieldErrors", () => {
    const error = new LoyaltyNumberDomainError("VALIDATION_FAILED", "bad value");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("LoyaltyNumberDomainError");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("bad value");
    expect(error.fieldErrors).toBeUndefined();
  });
});

describe("invalidLoyaltyNumberFormatError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    const error = invalidLoyaltyNumberFormatError("nope");
    expect(error).toBeInstanceOf(LoyaltyNumberDomainError);
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toContain("nope");
  });
});

describe("invalidCustomerIdentityIdForLoyaltyNumberError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    const error = invalidCustomerIdentityIdForLoyaltyNumberError("");
    expect(error.category).toBe("VALIDATION_FAILED");
  });
});

describe("loyaltyNumberIssuanceExhaustedError", () => {
  it("returns a TEMPORARY_UNAVAILABLE error naming the identity and attempt count", () => {
    const error = loyaltyNumberIssuanceExhaustedError("cust_1", 5);
    expect(error.category).toBe("TEMPORARY_UNAVAILABLE");
    expect(error.message).toContain("cust_1");
    expect(error.message).toContain("5");
  });
});

describe("conflictingLoyaltyNumberAssignmentError", () => {
  it("returns an INVALID_STATE_TRANSITION error", () => {
    const error = conflictingLoyaltyNumberAssignmentError("cust_1");
    expect(error.category).toBe("INVALID_STATE_TRANSITION");
  });
});

describe("identityNotEligibleForIssuanceError", () => {
  it("returns an INVALID_STATE_TRANSITION error", () => {
    const error = identityNotEligibleForIssuanceError("cust_1");
    expect(error.category).toBe("INVALID_STATE_TRANSITION");
  });
});

describe("loyaltyNumberUniquenessCheckFailedError", () => {
  it("returns an INTEGRATION_FAILED error", () => {
    const error = loyaltyNumberUniquenessCheckFailedError("cust_1");
    expect(error.category).toBe("INTEGRATION_FAILED");
  });
});
