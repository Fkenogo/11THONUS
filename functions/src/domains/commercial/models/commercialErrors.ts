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

// ---------------------------------------------------------------------------
// WP-COM-02 (price schedules, settlements). Same closed `ErrorCategory` set.
// ---------------------------------------------------------------------------

/** Single, enumeration-resistant denial for every authority failure cause. */
export function commercialAuthorityDeniedError(): CommercialDomainError {
  return new CommercialDomainError(
    "AUTH_FORBIDDEN",
    "Only an active Platform Administrator with verified MFA may perform Commercial administration.",
  );
}

/** No schedule applies: there is deliberately no fallback price and no FX. */
export function commercialNoApplicablePriceError(
  market: string,
  currency: string,
  at: Date,
): CommercialDomainError {
  return new CommercialDomainError(
    "RESOURCE_NOT_FOUND",
    `No Commercial price schedule applies to market "${market}" (${currency}) at ${at.toISOString()}; a price must be set by the Platform Administrator first.`,
  );
}

export function commercialSettlementNotFoundError(settlementId: string): CommercialDomainError {
  return new CommercialDomainError(
    "RESOURCE_NOT_FOUND",
    `No Commercial settlement "${settlementId}" exists for this Business.`,
  );
}

export function commercialSettlementStateError(
  settlementId: string,
  status: string,
): CommercialDomainError {
  return new CommercialDomainError(
    "INVALID_STATE_TRANSITION",
    `Commercial settlement "${settlementId}" is "${status}"; only a "recorded" settlement can be confirmed.`,
  );
}

export function commercialSettlementReferenceConflictError(): CommercialDomainError {
  return new CommercialDomainError(
    "INVALID_STATE_TRANSITION",
    "A settlement with this method and external reference is already recorded.",
  );
}

export function commercialCommandInProgressError(): CommercialDomainError {
  return new CommercialDomainError(
    "TEMPORARY_UNAVAILABLE",
    "A Commercial command with this idempotency key is still in progress; retry.",
  );
}

// ---------------------------------------------------------------------------
// WP-COM-03 (manual administration). Same closed `ErrorCategory` set.
// ---------------------------------------------------------------------------

export function commercialBusinessNotFoundError(businessId: string): CommercialDomainError {
  return new CommercialDomainError(
    "RESOURCE_NOT_FOUND",
    `Business "${businessId}" does not exist.`,
  );
}

/** A well-formed request against an account/settlement whose current state forbids it. */
export function commercialStateConflictError(message: string): CommercialDomainError {
  return new CommercialDomainError("INVALID_STATE_TRANSITION", message);
}
