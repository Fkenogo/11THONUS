/**
 * Purchase-domain errors (`PLATFORM-BASELINE-006A`).
 *
 * Same shape as `rewardProgramErrors.ts`: a domain-local error class
 * carrying one of the existing closed `ErrorCategory` values — no new
 * category is introduced. `index.ts`'s `toHttpsError` maps this class to
 * the stable client message (never echoed).
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class PurchaseDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "PurchaseDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function purchaseNotFoundError(purchaseId: string): PurchaseDomainError {
  return new PurchaseDomainError(
    "RESOURCE_NOT_FOUND",
    `Purchase Record "${purchaseId}" was not found.`,
  );
}

export function purchaseStaleStateError(expected: string, actual: string): PurchaseDomainError {
  return new PurchaseDomainError(
    "INVALID_STATE_TRANSITION",
    `Purchase cannot transition from "${actual}" (expected "${expected}").`,
  );
}

export function purchaseOwnershipError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "AUTH_FORBIDDEN",
    "Not authorized for this Purchase Record: it belongs to a different Customer.",
  );
}

export function purchaseValidationError(message: string): PurchaseDomainError {
  return new PurchaseDomainError("VALIDATION_FAILED", message);
}

export function purchaseArtifactError(message: string): PurchaseDomainError {
  return new PurchaseDomainError("VALIDATION_FAILED", message);
}

export function purchaseProgramError(message: string): PurchaseDomainError {
  return new PurchaseDomainError("VALIDATION_FAILED", message);
}

export function purchaseSharedPolicyError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "VALIDATION_FAILED",
    "This Reward Program does not allow Loyalty Number recording: present the Customer's current QR Identity.",
  );
}

export function purchaseQuantityError(message: string): PurchaseDomainError {
  return new PurchaseDomainError("VALIDATION_FAILED", message);
}

export function purchaseIdempotencyConflictError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "IDEMPOTENCY_CONFLICT",
    "Idempotency key already used for a different purchase request.",
  );
}

export function purchaseIdempotencyInProgressError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "TEMPORARY_UNAVAILABLE",
    "The same purchase request is already being processed; retry shortly.",
  );
}
