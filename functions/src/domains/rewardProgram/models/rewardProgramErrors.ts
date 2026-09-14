/**
 * Reward Program domain errors (`PLATFORM-BASELINE-005A`).
 *
 * Framework-independent, structurally compatible with the shared error
 * shape (mirrors `businessErrors.ts`'s own precedent). Every category used
 * below is one of the existing, closed 14 categories
 * `functions/src/shared/errors/errorCategories.ts` defines -- no new
 * category is introduced.
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class RewardProgramDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "RewardProgramDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function rewardProgramNotFoundError(): RewardProgramDomainError {
  return new RewardProgramDomainError("RESOURCE_NOT_FOUND", "Reward Program not found.");
}

export function rewardProgramVersionNotFoundError(): RewardProgramDomainError {
  return new RewardProgramDomainError("RESOURCE_NOT_FOUND", "Reward Program version not found.");
}

export function rewardProgramCrossBusinessMismatchError(): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "AUTH_FORBIDDEN",
    "Reward Program does not belong to the requested Business.",
  );
}

export function rewardProgramVersionNotDraftError(): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "INVALID_STATE_TRANSITION",
    "Only a draft version may be edited or published; this version has already been published.",
  );
}

export function rewardProgramVersionAlreadyPublishedElsewhereError(): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "INVALID_STATE_TRANSITION",
    "This Reward Program already has an active version; publish supersedes it atomically.",
  );
}

export function invalidQualifyingNodeError(
  knowledgeNodeId: string,
  reason: string,
): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "VALIDATION_FAILED",
    `Qualifying Commerce Knowledge node "${knowledgeNodeId}" is not eligible: ${reason}.`,
    [
      {
        field: "qualifyingNodes",
        code: "invalid_reference",
        messageKey: "rewardProgram.qualifyingNode.invalid",
      },
    ],
  );
}

export function invalidCategoryNodeError(reason: string): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "VALIDATION_FAILED",
    `Reward Program category reference is not eligible: ${reason}.`,
    [
      {
        field: "rewardProgramCategoryId",
        code: "invalid_reference",
        messageKey: "rewardProgram.category.invalid",
      },
    ],
  );
}

export function invalidStandardRewardNodeError(reason: string): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "VALIDATION_FAILED",
    `Standard reward node reference is not eligible: ${reason}.`,
    [
      {
        field: "standardRewardNodeId",
        code: "invalid_reference",
        messageKey: "rewardProgram.standardRewardNode.invalid",
      },
    ],
  );
}

export function businessNotEligibleError(): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "BUSINESS_INACTIVE",
    "This Business is not in a lifecycle status eligible for Reward Program management.",
  );
}

export function noEditableDraftFieldsError(): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "VALIDATION_FAILED",
    "No editable fields were supplied for this draft update.",
  );
}

export function staleDraftUpdateError(): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "IDEMPOTENCY_CONFLICT",
    "This draft was modified by another request since it was last read; reload and retry.",
  );
}

/**
 * A same-key idempotent retry whose request hash differs from the key's
 * original reservation (`PLATFORM-BASELINE-005A-CORR-001` Finding 6). The
 * closed 14-category taxonomy (`errorCategories.ts`) already owns
 * `IDEMPOTENCY_CONFLICT` for exactly this; mapping it here -- instead of
 * the plain `Error` this package first threw -- guarantees the callable
 * boundary surfaces the governed `aborted` code, never a raw/internal
 * error.
 */
export function rewardProgramIdempotencyConflictError(): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "IDEMPOTENCY_CONFLICT",
    "This idempotency key was already reserved for a materially different request.",
  );
}

/**
 * The key is still held by a first attempt that has not yet produced a
 * known outcome (`PLATFORM-BASELINE-005A-CORR-001` Finding 6). The closed
 * category taxonomy has no dedicated in-progress category, so the
 * established vocabulary is `TEMPORARY_UNAVAILABLE` -- the same
 * retryable/unavailable mapping (`unavailable` on the wire) every other
 * domain's in-progress reservation already uses, and the same code the
 * client-side `settleKeyOnError` convention retains a key on.
 */
export function rewardProgramIdempotencyInProgressError(): RewardProgramDomainError {
  return new RewardProgramDomainError(
    "TEMPORARY_UNAVAILABLE",
    "This idempotency key is currently reserved by a request that is still in progress; retry.",
  );
}
