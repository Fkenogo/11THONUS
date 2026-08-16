/**
 * Trust domain errors (CAP-P2-ITM-A).
 *
 * Domain-local error type, structurally compatible with the shared
 * `DomainCommandError` (`functions/src/shared/commands/commandDispatcher.ts`)
 * — same `category`/`message`/`fieldErrors` shape — but defined here
 * independently so this domain layer never imports `commandDispatcher.ts`
 * (same rationale as `identityErrors.ts`/`permissionErrors.ts`).
 *
 * Every category used here is one of the existing, closed 14 categories
 * `functions/src/shared/errors/errorCategories.ts` defines (TRD11 §11.35)
 * — no new category is introduced (ITM-DESIGN-001 §13).
 *
 * `ITM-A` is a contract/value-object layer, not a runtime decision
 * engine: every error here is a construction-time validation failure of
 * a domain value, never a risk-gate allow/deny outcome (that is a future
 * ITM-D concern) and never a progression/derivation decision (ITM-C).
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class TrustDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "TrustDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidTrustRecordIdError(value: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid trust record id: "${value}" must be a non-empty, non-whitespace string.`,
  );
}

export function invalidCustomerIdentityReferenceError(value: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid customer identity reference: "${value}" must be a non-empty, non-whitespace string.`,
  );
}

export function invalidTrustLevelError(value: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid trust level: "${value}" is not a recognised trust level (must be "unverified", "provisional", or "established").`,
  );
}

export function invalidVerificationStateFieldError(field: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid verification state field "${field}": must be a boolean.`,
  );
}

export function invalidSignalStateFieldError(field: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid signal state field "${field}": must be a boolean.`,
  );
}

export function invalidTrustRecordStatusError(value: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid trust record status: "${value}" is not a recognised status (must be "active", "frozen", or "suspended").`,
  );
}

export function invalidTrustEvidenceCategoryError(value: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid trust evidence category: "${value}" is not a governed evidence category for the Capability-2 ITM MVP.`,
  );
}

export function invalidTrustReasonReferenceFieldError(
  field: string,
  value: string,
): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid trust evidence reference field "${field}": "${value}" is not acceptable.`,
    [{ field, code: "invalid", messageKey: "trustReasonReference.field.invalid" }],
  );
}

export function duplicateTrustEvidenceError(eventId: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Trust evidence for event "${eventId}" has already been recorded on this trust record.`,
  );
}

export function invalidTrustRuleVersionError(value: number): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid trust rule version: "${value}" must be a positive integer.`,
  );
}

export function invalidTrustRecordVersionError(value: number): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid trust record version: "${value}" must be a positive integer (optimistic-concurrency token).`,
  );
}

export function invalidTrustRecordTimestampError(field: string): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    `Invalid trust record timestamp "${field}": must be a valid Date.`,
  );
}

export function trustRecordUpdatedBeforeCreatedError(): TrustDomainError {
  return new TrustDomainError(
    "VALIDATION_FAILED",
    "Invalid trust record timestamps: updatedAt cannot be earlier than createdAt.",
  );
}
