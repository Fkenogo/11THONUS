/**
 * Commercial-domain errors (`WP-COM-01`). Same shape as
 * `purchaseErrors.ts`: a domain-local class carrying one existing closed
 * `ErrorCategory` -- no new category is introduced. Not wired into
 * `index.ts` (no Commercial endpoint exists in this work package).
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";

export class CommercialDomainError extends Error {
  readonly category: ErrorCategory;

  constructor(category: ErrorCategory, message: string) {
    super(message);
    this.name = "CommercialDomainError";
    this.category = category;
  }
}

export function commercialAccountNotFoundError(businessId: string): CommercialDomainError {
  return new CommercialDomainError(
    "RESOURCE_NOT_FOUND",
    `No Commercial account exists for Business "${businessId}".`,
  );
}

export function commercialAccountAlreadyExistsError(businessId: string): CommercialDomainError {
  return new CommercialDomainError(
    "INVALID_STATE_TRANSITION",
    `A Commercial account already exists for Business "${businessId}".`,
  );
}

export function commercialValidationError(message: string): CommercialDomainError {
  return new CommercialDomainError("VALIDATION_FAILED", message);
}

export function commercialIdempotencyConflictError(): CommercialDomainError {
  return new CommercialDomainError(
    "IDEMPOTENCY_CONFLICT",
    "This idempotency key was already used with a different Commercial request.",
  );
}
