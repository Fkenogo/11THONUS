import { describe, expect, it } from "vitest";
import {
  AuthenticationDomainError,
  authenticationRequiredError,
  authenticationForbiddenError,
  accountSuspendedForAuthenticationError,
  unresolvedCredentialError,
  invalidAuthenticatedCredentialError,
  authenticationCommandConflictError,
  authenticationProviderUnavailableError,
  authenticationProviderIntegrationError,
} from "./authenticationErrors";

describe("AuthenticationDomainError", () => {
  it("is an Error carrying a governed category", () => {
    const error = authenticationRequiredError();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AuthenticationDomainError);
    expect(error.name).toBe("AuthenticationDomainError");
    expect(error.category).toBe("AUTH_REQUIRED");
  });

  it("maps every factory to one of the closed 14 categories (no new category)", () => {
    expect(authenticationRequiredError().category).toBe("AUTH_REQUIRED");
    expect(authenticationForbiddenError().category).toBe("AUTH_FORBIDDEN");
    expect(accountSuspendedForAuthenticationError("ci_1").category).toBe("ACCOUNT_SUSPENDED");
    expect(unresolvedCredentialError().category).toBe("RESOURCE_NOT_FOUND");
    expect(invalidAuthenticatedCredentialError("referenceId", "").category).toBe(
      "VALIDATION_FAILED",
    );
    expect(authenticationCommandConflictError("op_1").category).toBe("IDEMPOTENCY_CONFLICT");
    expect(authenticationProviderUnavailableError("phone_otp").category).toBe(
      "TEMPORARY_UNAVAILABLE",
    );
    expect(authenticationProviderIntegrationError("google_sign_in").category).toBe(
      "INTEGRATION_FAILED",
    );
  });

  it("carries a PlatformFieldError for field-level validation failures", () => {
    const error = invalidAuthenticatedCredentialError("referenceId", "   ");
    expect(error.fieldErrors?.[0]).toMatchObject({ field: "referenceId", code: "invalid" });
  });

  it("never resolves a credential-not-found error to a message that leaks existence", () => {
    // enumeration resistance: the message is generic and identical regardless of reason
    expect(unresolvedCredentialError().message).not.toMatch(/exists|registered|found for/i);
  });
});
