/**
 * Identity Audit domain errors (ENG-P2-001-10).
 *
 * Mirrors the identity domain's `IdentityDomainError` pattern
 * (`functions/src/domains/identity/models/identityErrors.ts`): a
 * domain-local error type, structurally compatible with the shared
 * `DomainCommandError`, defined independently so this domain never
 * imports `commandDispatcher.ts`'s Firebase-dependent import chain.
 *
 * Every category used here is one of the existing, closed 14 categories
 * `functions/src/shared/errors/errorCategories.ts` defines (TRD11 §11.35)
 * — no new category is introduced.
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class IdentityAuditDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "IdentityAuditDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidAuditQueryAuthorityError(value: string): IdentityAuditDomainError {
  return new IdentityAuditDomainError(
    "VALIDATION_FAILED",
    `Invalid audit query authority: "${value}" is not a recognised authority category.`,
  );
}

export function invalidAuditQueryParamsError(reason: string): IdentityAuditDomainError {
  return new IdentityAuditDomainError(
    "VALIDATION_FAILED",
    `Invalid audit query params: ${reason}.`,
  );
}

export function auditRepositoryUnavailableError(): IdentityAuditDomainError {
  return new IdentityAuditDomainError(
    "INTEGRATION_FAILED",
    "The identity audit repository is unavailable while processing this query.",
  );
}
