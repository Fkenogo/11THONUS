import { describe, expect, it } from "vitest";
import {
  BusinessDomainError,
  businessAlreadyClosedError,
  businessArchivedError,
  businessCodeGenerationExhaustedError,
  clientSuppliedOwnerUserIdError,
  duplicateBusinessCodeError,
  invalidBusinessBranchFieldError,
  invalidBusinessCodeFormatError,
  invalidBusinessFieldError,
  invalidBusinessStatusTransitionError,
  invalidCustomerIdentityForOwnerError,
} from "./businessErrors";

describe("BusinessDomainError", () => {
  it("carries a category from the closed taxonomy and an optional fieldErrors array", () => {
    const error = new BusinessDomainError("VALIDATION_FAILED", "message", [
      { field: "displayName", code: "invalid", messageKey: "business.field.invalid" },
    ]);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("BusinessDomainError");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("message");
    expect(error.fieldErrors).toHaveLength(1);
  });
});

describe("factory functions map to the existing closed taxonomy only", () => {
  it("invalidBusinessFieldError -> VALIDATION_FAILED", () => {
    expect(invalidBusinessFieldError("displayName", "").category).toBe("VALIDATION_FAILED");
  });

  it("invalidBusinessBranchFieldError -> VALIDATION_FAILED", () => {
    expect(invalidBusinessBranchFieldError("city", "").category).toBe("VALIDATION_FAILED");
  });

  it("invalidBusinessStatusTransitionError -> INVALID_STATE_TRANSITION", () => {
    expect(invalidBusinessStatusTransitionError("draft", "active").category).toBe(
      "INVALID_STATE_TRANSITION",
    );
  });

  it("businessAlreadyClosedError -> INVALID_STATE_TRANSITION", () => {
    expect(businessAlreadyClosedError("biz-1").category).toBe("INVALID_STATE_TRANSITION");
  });

  it("businessArchivedError -> INVALID_STATE_TRANSITION", () => {
    expect(businessArchivedError("biz-1").category).toBe("INVALID_STATE_TRANSITION");
  });

  it("invalidBusinessCodeFormatError -> VALIDATION_FAILED", () => {
    expect(invalidBusinessCodeFormatError("bad").category).toBe("VALIDATION_FAILED");
  });

  it("duplicateBusinessCodeError -> IDEMPOTENCY_CONFLICT (002B persistence boundary, defined here for shared reuse)", () => {
    expect(duplicateBusinessCodeError("BIZABC234").category).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("businessCodeGenerationExhaustedError -> TEMPORARY_UNAVAILABLE (design §18, customer-invisible retry exhaustion)", () => {
    expect(businessCodeGenerationExhaustedError(5).category).toBe("TEMPORARY_UNAVAILABLE");
  });

  it("clientSuppliedOwnerUserIdError -> VALIDATION_FAILED (bootstrap authority boundary, §11)", () => {
    expect(clientSuppliedOwnerUserIdError().category).toBe("VALIDATION_FAILED");
  });

  it("invalidCustomerIdentityForOwnerError -> AUTH_REQUIRED", () => {
    expect(invalidCustomerIdentityForOwnerError("user-1").category).toBe("AUTH_REQUIRED");
  });
});
