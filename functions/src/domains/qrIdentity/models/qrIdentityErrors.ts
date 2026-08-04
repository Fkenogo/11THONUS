/**
 * QR Identity domain errors (ENG-P2-001-04).
 *
 * Mirrors the identity/loyaltyNumber domains' error pattern: a
 * domain-local error type, structurally compatible with the shared
 * `DomainCommandError` but defined independently to avoid its Firebase
 * dependency. Every category is one of the existing closed 14 categories
 * (`functions/src/shared/errors/errorCategories.ts`, TRD11 §11.35).
 *
 * No separate "invalid payload" error exists: the approved QR payload
 * contains only the opaque reference (`DEC-DATA-007`'s "plain opaque
 * reference" contract), so payload validation collapses into reference
 * validation — a distinct error here would never have a genuine trigger
 * and would be an invented, unused distinction.
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class QrIdentityDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "QrIdentityDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidQrReferenceError(value: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid QR reference: "${value}" must be a non-empty, safe-charset opaque token.`,
  );
}

export function invalidCustomerIdentityIdForQrIdentityError(value: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid customer identity id: "${value}" must be a non-empty, non-whitespace string.`,
  );
}

export function invalidLoyaltyNumberForQrIdentityError(value: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "VALIDATION_FAILED",
    `Invalid loyalty number: "${value}" does not match the approved format.`,
  );
}

export function conflictingQrIdentityAssociationError(
  customerIdentityId: string,
): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "INVALID_STATE_TRANSITION",
    `The existing QR identity association provided does not permit issuance for customer identity "${customerIdentityId}".`,
  );
}

export function duplicateActiveQrIdentityError(customerIdentityId: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "INVALID_STATE_TRANSITION",
    `Customer identity "${customerIdentityId}" already has an active QR identity association.`,
  );
}

export function qrRegenerationNotPermittedError(customerIdentityId: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "INVALID_STATE_TRANSITION",
    `QR identity regeneration is not permitted for customer identity "${customerIdentityId}": the current association is not active.`,
  );
}

/**
 * Persistence-boundary errors (ENG-P2-001-05).
 *
 * Reuses this same `QrIdentityDomainError` class for repository-layer
 * failures — one bounded error type per domain, not a competing
 * persistence-specific error hierarchy.
 */

export function duplicateActiveQrRecordError(qrReference: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "VALIDATION_FAILED",
    `An active QR identity record already exists for reference "${qrReference}".`,
  );
}

export function invalidatedQrReferenceError(qrReference: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "RESOURCE_NOT_FOUND",
    `QR reference "${qrReference}" has been invalidated and cannot be used for active lookup.`,
  );
}

export function unknownQrReferenceError(qrReference: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "RESOURCE_NOT_FOUND",
    `No QR identity record exists for reference "${qrReference}".`,
  );
}

export function malformedQrIdentityRecordError(qrReference: string): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "VALIDATION_FAILED",
    `The stored QR identity record for reference "${qrReference}" does not match the expected shape.`,
  );
}

export function qrIdentityRepositoryUnavailableError(
  customerIdentityId: string,
): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "INTEGRATION_FAILED",
    `The QR identity repository is unavailable while processing customer identity "${customerIdentityId}".`,
  );
}

export function qrRegenerationTransactionConflictError(
  customerIdentityId: string,
): QrIdentityDomainError {
  return new QrIdentityDomainError(
    "TEMPORARY_UNAVAILABLE",
    `The QR regeneration transaction for customer identity "${customerIdentityId}" could not be committed due to a concurrent conflict.`,
  );
}
