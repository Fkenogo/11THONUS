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

/**
 * Uniform rejection for a purchase item that is not on the locked version's
 * qualification set (`PLATFORM-BASELINE-013C`). Deliberately identical for a
 * fabricated id, a foreign-Business id, a non-qualifying Business item, and
 * a malformed id -- the client learns only that the selection is not valid
 * for this Reward Program, never whether a foreign-Business id exists
 * (PB-012 §7/§10, §17A CF-2).
 */
export function purchaseQualifyingItemError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "VALIDATION_FAILED",
    "The selected qualifying item is not available for this Reward Program.",
  );
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

/**
 * Redemption confirmation errors (`CAPABILITY-6-REDEMPTION-ENGINE-001`,
 * `DEC-LOY-018`).
 *
 * Same posture as every other Purchase-domain error: a domain-local message
 * that `index.ts`'s `toHttpsError` never echoes, so a client learns the
 * outcome category and nothing about any other Business's Reward ids,
 * Customer identities, or the identity of the confirming member.
 */

/**
 * The Reward id does not resolve to a Reward at all. Deliberately identical
 * for a fabricated id, a malformed id, and a Reward belonging to a
 * different Business — tenant existence is never disclosed.
 */
export function redemptionRewardNotFoundError(rewardId: string): PurchaseDomainError {
  return new PurchaseDomainError("RESOURCE_NOT_FOUND", `Reward "${rewardId}" was not found.`);
}

/**
 * The caller's Business membership does not own the Reward. Kept
 * indistinguishable from a not-found Reward for a caller with no other
 * relationship to it, so tenant probing learns nothing.
 */
export function redemptionTenantIsolationError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "AUTH_FORBIDDEN",
    "Not authorized to redeem this Reward: it belongs to a different Business.",
  );
}

/**
 * The Reward is not in the one state Product Truth permits redemption from
 * (`available`) — already `redeemed`, or otherwise not redeemable. There
 * is no other transition available to this command, and no reversal,
 * cancellation, or restoration path exists here (`DEC-LOY-004`).
 */
export function redemptionStaleStateError(actual: string): PurchaseDomainError {
  return new PurchaseDomainError(
    "INVALID_STATE_TRANSITION",
    `Reward cannot be redeemed from state "${actual}" (expected "available").`,
  );
}
