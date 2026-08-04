import { describe, expect, it } from "vitest";
import {
  IdentityDomainError,
  invalidCustomerIdentityIdError,
  invalidAuthenticationReferenceIdError,
  invalidTrustRecordIdError,
  invalidIdentityStatusTransitionError,
  identityAlreadyClosedError,
  identityArchivedError,
  duplicateAuthenticationReferenceError,
  authenticationReferenceNotFoundError,
  duplicateTrustReferenceError,
  lastAuthenticationReferenceCannotBeUnlinkedError,
  duplicateCustomerIdentityError,
  unknownCustomerIdentityError,
  malformedCustomerIdentityRecordError,
  identityRepositoryUnavailableError,
} from "./identityErrors";

describe("IdentityDomainError", () => {
  it("is a real Error subclass carrying a category", () => {
    const error = new IdentityDomainError("VALIDATION_FAILED", "example message");
    expect(error).toBeInstanceOf(Error);
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("example message");
  });
});

describe("invalidCustomerIdentityIdError", () => {
  it("returns a VALIDATION_FAILED IdentityDomainError", () => {
    const error = invalidCustomerIdentityIdError("");
    expect(error).toBeInstanceOf(IdentityDomainError);
    expect(error.category).toBe("VALIDATION_FAILED");
  });
});

describe("invalidAuthenticationReferenceIdError", () => {
  it("returns a VALIDATION_FAILED IdentityDomainError", () => {
    const error = invalidAuthenticationReferenceIdError("");
    expect(error).toBeInstanceOf(IdentityDomainError);
    expect(error.category).toBe("VALIDATION_FAILED");
  });
});

describe("invalidTrustRecordIdError", () => {
  it("returns a VALIDATION_FAILED IdentityDomainError", () => {
    const error = invalidTrustRecordIdError("");
    expect(error).toBeInstanceOf(IdentityDomainError);
    expect(error.category).toBe("VALIDATION_FAILED");
  });
});

describe("invalidIdentityStatusTransitionError", () => {
  it("returns an INVALID_STATE_TRANSITION error naming the two statuses", () => {
    const error = invalidIdentityStatusTransitionError("archived", "active");
    expect(error.category).toBe("INVALID_STATE_TRANSITION");
    expect(error.message).toContain("archived");
    expect(error.message).toContain("active");
  });
});

describe("identityAlreadyClosedError", () => {
  it("returns an INVALID_STATE_TRANSITION error", () => {
    expect(identityAlreadyClosedError("cust_1").category).toBe("INVALID_STATE_TRANSITION");
  });
});

describe("identityArchivedError", () => {
  it("returns an INVALID_STATE_TRANSITION error", () => {
    expect(identityArchivedError("cust_1").category).toBe("INVALID_STATE_TRANSITION");
  });
});

describe("duplicateAuthenticationReferenceError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    expect(duplicateAuthenticationReferenceError("ref_1").category).toBe("VALIDATION_FAILED");
  });
});

describe("authenticationReferenceNotFoundError", () => {
  it("returns a RESOURCE_NOT_FOUND error", () => {
    expect(authenticationReferenceNotFoundError("ref_1").category).toBe("RESOURCE_NOT_FOUND");
  });
});

describe("duplicateTrustReferenceError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    expect(duplicateTrustReferenceError("cust_1").category).toBe("VALIDATION_FAILED");
  });
});

describe("lastAuthenticationReferenceCannotBeUnlinkedError", () => {
  it("returns an INVALID_STATE_TRANSITION error", () => {
    expect(lastAuthenticationReferenceCannotBeUnlinkedError("cust_1").category).toBe(
      "INVALID_STATE_TRANSITION",
    );
  });
});

describe("duplicateCustomerIdentityError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    expect(duplicateCustomerIdentityError("cust_1").category).toBe("VALIDATION_FAILED");
  });
});

describe("unknownCustomerIdentityError", () => {
  it("returns a RESOURCE_NOT_FOUND error", () => {
    expect(unknownCustomerIdentityError("cust_1").category).toBe("RESOURCE_NOT_FOUND");
  });
});

describe("malformedCustomerIdentityRecordError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    expect(malformedCustomerIdentityRecordError("cust_1").category).toBe("VALIDATION_FAILED");
  });
});

describe("identityRepositoryUnavailableError", () => {
  it("returns an INTEGRATION_FAILED error", () => {
    expect(identityRepositoryUnavailableError("cust_1").category).toBe("INTEGRATION_FAILED");
  });
});
