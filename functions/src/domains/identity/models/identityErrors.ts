/**
 * Identity domain errors (ENG-P2-001-01).
 *
 * Domain-local error type, structurally compatible with the shared
 * `DomainCommandError` (`functions/src/shared/commands/commandDispatcher.ts`)
 * — same `category`/`message`/`fieldErrors` shape — but defined here
 * independently so the identity domain layer never imports
 * `commandDispatcher.ts`, whose own import chain pulls in
 * `firebase-functions/logger` at the value level. A future command-handler
 * layer adapts these into `DomainCommandError`/`PlatformErrorResponse` at
 * the API boundary; this module has zero Firebase dependency.
 *
 * Every category used here is one of the existing, closed 14 categories
 * `functions/src/shared/errors/errorCategories.ts` defines (TRD11 §11.35)
 * — no new category is introduced.
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class IdentityDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "IdentityDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidCustomerIdentityIdError(value: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid customer identity id: "${value}" must be a non-empty, non-whitespace string.`,
  );
}

export function invalidAuthenticationReferenceIdError(value: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid authentication reference id: "${value}" must be a non-empty, non-whitespace string.`,
  );
}

export function invalidTrustRecordIdError(value: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid trust record id: "${value}" must be a non-empty, non-whitespace string.`,
  );
}

export function invalidIdentityStatusTransitionError(
  from: string,
  to: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "INVALID_STATE_TRANSITION",
    `Cannot transition customer identity status from "${from}" to "${to}".`,
  );
}

export function identityAlreadyClosedError(customerIdentityId: string): IdentityDomainError {
  return new IdentityDomainError(
    "INVALID_STATE_TRANSITION",
    `Customer identity "${customerIdentityId}" is already closed.`,
  );
}

export function identityArchivedError(customerIdentityId: string): IdentityDomainError {
  return new IdentityDomainError(
    "INVALID_STATE_TRANSITION",
    `Customer identity "${customerIdentityId}" is archived and cannot be modified.`,
  );
}

export function duplicateAuthenticationReferenceError(referenceId: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Authentication reference "${referenceId}" is already linked to this customer identity.`,
  );
}

export function authenticationReferenceNotFoundError(referenceId: string): IdentityDomainError {
  return new IdentityDomainError(
    "RESOURCE_NOT_FOUND",
    `Authentication reference "${referenceId}" was not found on this customer identity.`,
  );
}

export function duplicateTrustReferenceError(customerIdentityId: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Customer identity "${customerIdentityId}" already has a trust reference assigned.`,
  );
}

export function lastAuthenticationReferenceCannotBeUnlinkedError(
  customerIdentityId: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "INVALID_STATE_TRANSITION",
    `Customer identity "${customerIdentityId}" must retain at least one linked authentication reference.`,
  );
}

/**
 * Persistence-boundary errors (ENG-P2-001-05).
 *
 * Reuses this same `IdentityDomainError` class for repository-layer
 * failures too — one bounded error type per domain, not a competing
 * persistence-specific error hierarchy.
 */

export function duplicateCustomerIdentityError(customerIdentityId: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `A customer identity record already exists for "${customerIdentityId}".`,
  );
}

export function unknownCustomerIdentityError(customerIdentityId: string): IdentityDomainError {
  return new IdentityDomainError(
    "RESOURCE_NOT_FOUND",
    `No customer identity record exists for "${customerIdentityId}".`,
  );
}

export function malformedCustomerIdentityRecordError(
  customerIdentityId: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `The stored customer identity record for "${customerIdentityId}" does not match the expected shape.`,
  );
}

export function identityRepositoryUnavailableError(
  customerIdentityId: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "INTEGRATION_FAILED",
    `The identity repository is unavailable while processing customer identity "${customerIdentityId}".`,
  );
}

/**
 * Lifecycle-boundary errors (ENG-P2-001-06).
 *
 * Reuses this same `IdentityDomainError` class for lifecycle-service and
 * lifecycle-persistence failures — one bounded error type per domain,
 * not a competing lifecycle-specific error hierarchy.
 */

export function invalidTransitionAuthorityError(value: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid transition authority: "${value}" is not a recognised authority category.`,
  );
}

export function invalidTransitionReasonError(value: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid transition reason: "${value}" is not a recognised reason category.`,
  );
}

export function staleIdentityStatusError(
  customerIdentityId: string,
  expectedStatus: string,
  actualStatus: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "IDEMPOTENCY_CONFLICT",
    `Customer identity "${customerIdentityId}" is not in the expected status "${expectedStatus}" (currently "${actualStatus}").`,
  );
}

export function recoveryNotPermittedError(customerIdentityId: string): IdentityDomainError {
  return new IdentityDomainError(
    "INVALID_STATE_TRANSITION",
    `Customer identity "${customerIdentityId}" is not in a status that permits recovery.`,
  );
}
