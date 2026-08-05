import { describe, expect, it } from "vitest";
import {
  IdentityAuditDomainError,
  invalidAuditQueryAuthorityError,
  invalidAuditQueryParamsError,
  auditRepositoryUnavailableError,
} from "./identityAuditErrors";

describe("IdentityAuditDomainError", () => {
  it("carries category, message, and optional fieldErrors", () => {
    const error = new IdentityAuditDomainError("VALIDATION_FAILED", "bad value");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("IdentityAuditDomainError");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("bad value");
    expect(error.fieldErrors).toBeUndefined();
  });
});

describe("invalidAuditQueryAuthorityError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    const error = invalidAuditQueryAuthorityError("caller_supplied_claim");
    expect(error).toBeInstanceOf(IdentityAuditDomainError);
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toContain("caller_supplied_claim");
  });
});

describe("invalidAuditQueryParamsError", () => {
  it("returns a VALIDATION_FAILED error", () => {
    const error = invalidAuditQueryParamsError("time range end precedes start");
    expect(error).toBeInstanceOf(IdentityAuditDomainError);
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toContain("time range end precedes start");
  });
});

describe("auditRepositoryUnavailableError", () => {
  it("returns an INTEGRATION_FAILED error", () => {
    const error = auditRepositoryUnavailableError();
    expect(error).toBeInstanceOf(IdentityAuditDomainError);
    expect(error.category).toBe("INTEGRATION_FAILED");
  });
});
