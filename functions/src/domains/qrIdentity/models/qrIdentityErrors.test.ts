import { describe, expect, it } from "vitest";
import {
  QrIdentityDomainError,
  invalidQrReferenceError,
  invalidCustomerIdentityIdForQrIdentityError,
  invalidLoyaltyNumberForQrIdentityError,
  conflictingQrIdentityAssociationError,
  duplicateActiveQrIdentityError,
  qrRegenerationNotPermittedError,
  duplicateActiveQrRecordError,
  invalidatedQrReferenceError,
  unknownQrReferenceError,
  malformedQrIdentityRecordError,
  qrIdentityRepositoryUnavailableError,
  qrRegenerationTransactionConflictError,
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

describe("duplicateActiveQrRecordError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    expect(duplicateActiveQrRecordError("ref1").category).toBe("VALIDATION_FAILED");
  });
});

describe("invalidatedQrReferenceError", () => {
  it("returns a RESOURCE_NOT_FOUND error (fails closed for active lookup)", () => {
    expect(invalidatedQrReferenceError("ref1").category).toBe("RESOURCE_NOT_FOUND");
  });
});

describe("unknownQrReferenceError", () => {
  it("returns a RESOURCE_NOT_FOUND error", () => {
    expect(unknownQrReferenceError("ref1").category).toBe("RESOURCE_NOT_FOUND");
  });
});

describe("malformedQrIdentityRecordError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    expect(malformedQrIdentityRecordError("ref1").category).toBe("VALIDATION_FAILED");
  });
});

describe("qrIdentityRepositoryUnavailableError", () => {
  it("returns an INTEGRATION_FAILED error", () => {
    expect(qrIdentityRepositoryUnavailableError("cust_1").category).toBe("INTEGRATION_FAILED");
  });
});

describe("qrRegenerationTransactionConflictError", () => {
  it("returns a TEMPORARY_UNAVAILABLE error", () => {
    expect(qrRegenerationTransactionConflictError("cust_1").category).toBe("TEMPORARY_UNAVAILABLE");
  });
});
