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

/**
 * Safe public failure discriminator for the Staff Counter (`EA-BL-001-CORR-002-B`, assessment
 * §23.2). A closed, stable set of tokens that may cross the callable boundary as
 * `HttpsError.details.reason`; the domain `message` itself still never does. Each token names a
 * category the Counter can turn into truthful copy -- never a cause the caller could use to probe
 * policy or identity (a shared-number policy refusal, an unknown vs. inactive customer artifact,
 * and a foreign-Business item all collapse into the neutral token for their family).
 */
export const PURCHASE_FAILURE_REASONS = [
  "customer_artifact_invalid_or_not_found",
  "programme_unavailable",
  "qualifying_item_invalid",
  "quantity_invalid",
  "generic_validation_failed",
] as const;

export type PurchaseFailureReason = (typeof PURCHASE_FAILURE_REASONS)[number];

export class PurchaseDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];
  /** Present only on validation failures; see {@link PurchaseFailureReason}. */
  readonly reason?: PurchaseFailureReason;

  constructor(
    category: ErrorCategory,
    message: string,
    fieldErrors?: PlatformFieldError[],
    reason?: PurchaseFailureReason,
  ) {
    super(message);
    this.name = "PurchaseDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
    this.reason = reason;
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

/**
 * Business Review self-review prohibition (`EA-BL-001-CORR-002-BR`): the reviewer is the member who
 * recorded the Purchase. No exception, no role exemption, no sole-reviewer bypass -- fail closed.
 */
export function purchaseSelfReviewError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "AUTH_FORBIDDEN",
    "A Purchase cannot be reviewed by the member who recorded it.",
  );
}

export function purchaseOwnershipError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "AUTH_FORBIDDEN",
    "Not authorized for this Purchase Record: it belongs to a different Customer.",
  );
}

export function purchaseValidationError(message: string): PurchaseDomainError {
  return new PurchaseDomainError(
    "VALIDATION_FAILED",
    message,
    undefined,
    "generic_validation_failed",
  );
}

/**
 * The presented Customer artifact is malformed, unknown, or no longer active. Deliberately one
 * token for all of them (and for the neutral shared-number refusal below): the Counter learns only
 * "that customer code did not work", never which identities or policies exist.
 */
export function purchaseArtifactError(message: string): PurchaseDomainError {
  return new PurchaseDomainError(
    "VALIDATION_FAILED",
    message,
    undefined,
    "customer_artifact_invalid_or_not_found",
  );
}

export function purchaseProgramError(message: string): PurchaseDomainError {
  return new PurchaseDomainError("VALIDATION_FAILED", message, undefined, "programme_unavailable");
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
    undefined,
    "qualifying_item_invalid",
  );
}

/**
 * Shared-Loyalty-Number policy refusal. Mapped to the NEUTRAL customer-code token so the public
 * discriminator never reveals the programme's shared-number policy (assessment §23.2).
 */
export function purchaseSharedPolicyError(): PurchaseDomainError {
  return new PurchaseDomainError(
    "VALIDATION_FAILED",
    "This Reward Program does not allow Loyalty Number recording: present the Customer's current QR Identity.",
    undefined,
    "customer_artifact_invalid_or_not_found",
  );
}

export function purchaseQuantityError(message: string): PurchaseDomainError {
  return new PurchaseDomainError("VALIDATION_FAILED", message, undefined, "quantity_invalid");
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

/**
 * The Reward's governing Loyalty Cycle was not in `reward_available`, so it
 * cannot be closed as a redeemed Cycle. Fail closed rather than redeem a
 * Reward whose Cycle lifecycle is not what Product Truth describes — the whole
 * transaction (Reward state, redemption evidence, Trust Events, intents) rolls
 * back, so no partial redemption can survive.
 */
export function redemptionCycleStateError(actual: string): PurchaseDomainError {
  return new PurchaseDomainError(
    "INVALID_STATE_TRANSITION",
    `The Reward's governing Loyalty Cycle cannot be completed from state "${actual}" (expected "reward_available").`,
  );
}
