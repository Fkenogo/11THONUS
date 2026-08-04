/**
 * Loyalty Number domain errors (ENG-P2-001-03).
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

export class LoyaltyNumberDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "LoyaltyNumberDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidLoyaltyNumberFormatError(value: string): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "VALIDATION_FAILED",
    `Invalid loyalty number: "${value}" does not match the approved format (3 letters excluding I/O, 3 digits excluding 0/1, e.g. "ABC-234").`,
  );
}

export function invalidCustomerIdentityIdForLoyaltyNumberError(
  value: string,
): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "VALIDATION_FAILED",
    `Invalid customer identity id: "${value}" must be a non-empty, non-whitespace string.`,
  );
}

export function loyaltyNumberIssuanceExhaustedError(
  customerIdentityId: string,
  attemptsMade: number,
): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "TEMPORARY_UNAVAILABLE",
    `Loyalty number issuance for customer identity "${customerIdentityId}" exhausted its bounded retry limit after ${attemptsMade} attempts due to repeated candidate collisions.`,
  );
}

export function conflictingLoyaltyNumberAssignmentError(
  customerIdentityId: string,
): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "INVALID_STATE_TRANSITION",
    `The existing loyalty number assignment provided does not belong to customer identity "${customerIdentityId}".`,
  );
}

export function identityNotEligibleForIssuanceError(
  customerIdentityId: string,
): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "INVALID_STATE_TRANSITION",
    `Customer identity "${customerIdentityId}" is not eligible to receive a new loyalty number issuance.`,
  );
}

export function loyaltyNumberUniquenessCheckFailedError(
  customerIdentityId: string,
): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "INTEGRATION_FAILED",
    `The uniqueness check for a loyalty number candidate failed for customer identity "${customerIdentityId}".`,
  );
}

/**
 * Persistence-boundary errors (ENG-P2-001-05).
 *
 * Reuses this same `LoyaltyNumberDomainError` class for repository-layer
 * failures — one bounded error type per domain, not a competing
 * persistence-specific error hierarchy.
 */

export function duplicateLoyaltyNumberRecordError(loyaltyNumber: string): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "VALIDATION_FAILED",
    `A loyalty number record already exists for "${loyaltyNumber}".`,
  );
}

export function malformedLoyaltyNumberRecordError(loyaltyNumber: string): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "VALIDATION_FAILED",
    `The stored loyalty number record for "${loyaltyNumber}" does not match the expected shape.`,
  );
}

export function loyaltyNumberRepositoryUnavailableError(
  customerIdentityId: string,
): LoyaltyNumberDomainError {
  return new LoyaltyNumberDomainError(
    "INTEGRATION_FAILED",
    `The loyalty number repository is unavailable while processing customer identity "${customerIdentityId}".`,
  );
}
