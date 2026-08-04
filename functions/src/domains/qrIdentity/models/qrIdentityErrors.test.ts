import { describe, expect, it } from "vitest";
import {
  QrIdentityDomainError,
  invalidQrReferenceError,
  invalidCustomerIdentityIdForQrIdentityError,
  invalidLoyaltyNumberForQrIdentityError,
  conflictingQrIdentityAssociationError,
  duplicateActiveQrIdentityError,
  qrRegenerationNotPermittedError,
} from "./qrIdentityErrors";

describe("QrIdentityDomainError", () => {
  it("carries category, message, and optional fieldErrors", () => {
    const error = new QrIdentityDomainError("VALIDATION_FAILED", "bad value");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("QrIdentityDomainError");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("bad value");
    expect(error.fieldErrors).toBeUndefined();
  });
});

describe("invalidQrReferenceError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    const error = invalidQrReferenceError("nope");
    expect(error).toBeInstanceOf(QrIdentityDomainError);
    expect(error.category).toBe("VALIDATION_FAILED");
  });
});

describe("invalidCustomerIdentityIdForQrIdentityError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    expect(invalidCustomerIdentityIdForQrIdentityError("").category).toBe("VALIDATION_FAILED");
  });
});

describe("invalidLoyaltyNumberForQrIdentityError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    expect(invalidLoyaltyNumberForQrIdentityError("bad").category).toBe("VALIDATION_FAILED");
  });
});

describe("conflictingQrIdentityAssociationError", () => {
  it("returns an INVALID_STATE_TRANSITION error", () => {
    expect(conflictingQrIdentityAssociationError("cust_1").category).toBe(
      "INVALID_STATE_TRANSITION",
    );
  });
});

describe("duplicateActiveQrIdentityError", () => {
  it("returns an INVALID_STATE_TRANSITION error", () => {
    expect(duplicateActiveQrIdentityError("cust_1").category).toBe("INVALID_STATE_TRANSITION");
  });
});

describe("qrRegenerationNotPermittedError", () => {
  it("returns an INVALID_STATE_TRANSITION error", () => {
    expect(qrRegenerationNotPermittedError("cust_1").category).toBe("INVALID_STATE_TRANSITION");
  });
});
