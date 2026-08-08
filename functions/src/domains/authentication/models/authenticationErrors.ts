/**
 * Authentication domain error contract (AUTH-01, per AUTH-BP §11).
 *
 * One bounded error type for the Authentication domain — `AuthenticationDomainError`
 * — mirroring the Identity domain's `IdentityDomainError` pattern, not a
 * competing hierarchy. Every category used is one of the closed 14
 * (TRD11 §11.35, `shared/errors/errorCategories`); **no new category is
 * introduced.** Pure domain module: no Firebase import.
 *
 * Enumeration resistance (AUTH-BP §11): `unresolvedCredentialError` is a
 * single generic error identical regardless of reason — a caller cannot
 * learn whether a credential "exists".
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class AuthenticationDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "AuthenticationDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function authenticationRequiredError(): AuthenticationDomainError {
  return new AuthenticationDomainError(
    "AUTH_REQUIRED",
    "Authentication is required to perform this action.",
  );
}

export function authenticationForbiddenError(): AuthenticationDomainError {
  return new AuthenticationDomainError(
    "AUTH_FORBIDDEN",
    "The authenticated credential is not permitted to perform this action.",
  );
}

export function accountSuspendedForAuthenticationError(
  customerIdentityId: string,
): AuthenticationDomainError {
  return new AuthenticationDomainError(
    "ACCOUNT_SUSPENDED",
    `Access for customer identity "${customerIdentityId}" is suspended.`,
  );
}

/**
 * Deliberately generic and identical for every "this credential does not
 * resolve to an active identity" case — enumeration resistance (AUTH-BP §11,
 * matching the `-09` lookup boundary).
 */
export function unresolvedCredentialError(): AuthenticationDomainError {
  return new AuthenticationDomainError(
    "RESOURCE_NOT_FOUND",
    "No active identity resolves for the presented credential.",
  );
}

export function invalidAuthenticatedCredentialError(
  field: string,
  value: string,
): AuthenticationDomainError {
  return new AuthenticationDomainError(
    "VALIDATION_FAILED",
    `Invalid authenticated credential field "${field}": "${value}".`,
    [{ field, code: "invalid", messageKey: "authentication.credential.invalid" }],
  );
}

export function authenticationCommandConflictError(operation: string): AuthenticationDomainError {
  return new AuthenticationDomainError(
    "IDEMPOTENCY_CONFLICT",
    `An authentication operation "${operation}" is already in progress.`,
  );
}

export function authenticationProviderUnavailableError(
  provider: string,
): AuthenticationDomainError {
  return new AuthenticationDomainError(
    "TEMPORARY_UNAVAILABLE",
    `The authentication provider "${provider}" is temporarily unavailable.`,
  );
}

export function authenticationProviderIntegrationError(
  provider: string,
): AuthenticationDomainError {
  return new AuthenticationDomainError(
    "INTEGRATION_FAILED",
    `The authentication provider "${provider}" returned an integration failure.`,
  );
}
