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
 *
 * Error-category note (`ENG-P2-ARCH-CORR-004` Finding F9 → F9b; Founder
 * decision recorded 2026-08-07, `F9B-DEC-001`): several factories below
 * (`duplicateCustomerIdentityError`, `duplicateAuthenticationReferenceError`,
 * `duplicateTrustReferenceError`, `authenticationReferenceLinkedToDifferentIdentityError`)
 * map an identity conflict that is *not* an idempotency-key conflict to
 * `VALIDATION_FAILED`. Per the Founder decision, this is the intended,
 * governed mapping for the current MVP error contract: non-idempotency
 * identity conflicts continue to map to `VALIDATION_FAILED` while
 * retaining their specific bounded-domain error internally, and
 * `IDEMPOTENCY_CONFLICT` remains reserved exclusively for genuine
 * idempotency conflicts. No general `CONFLICT` category is introduced;
 * the 14-category governed taxonomy (TRD11 §11.35) is unchanged. A
 * broader conflict category may be reconsidered only through a future
 * versioned review of the governed error contract if multiple
 * capabilities demonstrate a recurring cross-domain requirement. F9b is
 * closed.
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

/**
 * Recovery-proof boundary errors (ENG-P2-001-07).
 *
 * Reuses this same `IdentityDomainError` class for the recovery-proof
 * validation boundary — one bounded error type per domain, not a
 * competing recovery-specific error hierarchy.
 */

export function recoveryProofMissingError(): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    "Recovery proof is missing or malformed: a valid, non-empty proof reference is required.",
  );
}

export function recoveryProofRejectedError(proofReference: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Recovery proof "${proofReference}" was not accepted by the upstream proof process.`,
  );
}

export function recoveryProofExpiredError(proofReference: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Recovery proof "${proofReference}" has expired.`,
  );
}

export function recoveryProofIdentityMismatchError(
  proofReference: string,
  expectedCustomerIdentityId: string,
  actualCustomerIdentityId: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Recovery proof "${proofReference}" targets customer identity "${actualCustomerIdentityId}", not the expected "${expectedCustomerIdentityId}".`,
  );
}

export function recoveryProofAlreadyUsedError(proofReference: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Recovery proof "${proofReference}" has already been used and cannot be reused.`,
  );
}

export function recoveryCommandConflictError(customerIdentityId: string): IdentityDomainError {
  return new IdentityDomainError(
    "IDEMPOTENCY_CONFLICT",
    `A recovery command for customer identity "${customerIdentityId}" is already in progress.`,
  );
}

export function invalidRecoveryProofMethodCategoryError(value: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid recovery proof method category: "${value}" is not a recognised category.`,
  );
}

/**
 * Identity linking/duplicate-prevention boundary errors (ENG-P2-001-08).
 *
 * Reuses this same `IdentityDomainError` class — one bounded error type
 * per domain, not a competing identity-linking-specific error hierarchy.
 */

export function authenticationReferenceLinkedToDifferentIdentityError(
  referenceType: string,
  referenceId: string,
  attemptedCustomerIdentityId: string,
  owningCustomerIdentityId: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Authentication reference "${referenceType}:${referenceId}" is already linked to a different customer identity; refusing to link it to "${attemptedCustomerIdentityId}" (owned by "${owningCustomerIdentityId}").`,
  );
}

export function staleAuthenticationReferenceStatusError(
  referenceType: string,
  referenceId: string,
  expectedStatus: string,
  actualStatus: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "IDEMPOTENCY_CONFLICT",
    `Authentication reference "${referenceType}:${referenceId}" is not in the expected status "${expectedStatus}" (currently "${actualStatus}").`,
  );
}

export function authenticationReferenceCommandConflictError(
  referenceType: string,
  referenceId: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "IDEMPOTENCY_CONFLICT",
    `A link/unlink command for authentication reference "${referenceType}:${referenceId}" is already in progress.`,
  );
}

/**
 * Identity query/lookup boundary errors (ENG-P2-001-09).
 *
 * Reuses this same `IdentityDomainError` class — one bounded error type
 * per domain, not a competing lookup-specific error hierarchy.
 */

export function invalidIdentityLookupPurposeError(value: string): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid identity lookup purpose: "${value}" is not a recognised purpose category.`,
  );
}

export function malformedIdentityLookupError(
  lookupType: string,
  value: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "VALIDATION_FAILED",
    `Malformed ${lookupType} lookup value: "${value}" is not a valid identifier.`,
  );
}

/**
 * Deliberately generic and identical for every "this identifier does not
 * currently resolve to an active identity" case — unknown, invalidated
 * (QR), or unlinked (Authentication Reference) all collapse to this one
 * error, at this lookup boundary only. The underlying `-04`/`-08`
 * repositories keep their own more specific errors unchanged; this
 * normalization exists so a caller of the `-09` lookup surface cannot
 * distinguish "never existed" from "existed but is no longer active" —
 * the same enumeration-resistance property already established for
 * Authentication Reference unlink in `-08`.
 */
export function identityLookupNotFoundError(lookupType: string): IdentityDomainError {
  return new IdentityDomainError(
    "RESOURCE_NOT_FOUND",
    `No active identity resolves for the given ${lookupType}.`,
  );
}

export function identityLookupPurposeNotPermittedError(
  purpose: string,
  lookupType: string,
): IdentityDomainError {
  return new IdentityDomainError(
    "AUTH_FORBIDDEN",
    `Lookup purpose "${purpose}" is not permitted for ${lookupType} lookup.`,
  );
}
