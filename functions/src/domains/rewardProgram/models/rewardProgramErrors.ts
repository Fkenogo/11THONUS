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
