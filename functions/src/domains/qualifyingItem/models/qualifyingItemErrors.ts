/**
 * Qualifying Item domain errors (`PLATFORM-BASELINE-013A.2`).
 *
 * Framework-independent, structurally compatible with the shared error
 * shape (mirrors `rewardProgramErrors.ts`). Every category used below is
 * one of the existing, closed 14 categories
 * `functions/src/shared/errors/errorCategories.ts` defines -- no new
 * category is introduced.
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class QualifyingItemDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "QualifyingItemDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Deliberately the ONLY error for both "no such item" and "an item that
 * exists but belongs to a different Business" (and for a malformed id):
 * ownership is enforced by scoping every repository statement to the
 * caller's Business, so a foreign or fabricated id is indistinguishable
 * from an absent one -- the caller can never learn whether another
 * Business owns a given id.
 */
export function qualifyingItemNotFoundError(): QualifyingItemDomainError {
  return new QualifyingItemDomainError("RESOURCE_NOT_FOUND", "Qualifying Item not found.");
}

export function invalidQualifyingItemNameError(reason: string): QualifyingItemDomainError {
  return new QualifyingItemDomainError(
    "VALIDATION_FAILED",
    `Qualifying Item name is not valid: ${reason}.`,
    [{ field: "name", code: "invalid", messageKey: "qualifyingItem.name.invalid" }],
  );
}

/**
 * The optional Commerce Knowledge classification, when SUPPLIED, must still
 * be a real, eligible node (`DEC-LOY-016`: classification is optional, never
 * qualification authority -- but a supplied mapping must not be fabricated).
 * Never raised for an absent/`null` mapping.
 */
export function invalidQualifyingItemKnowledgeNodeError(
  knowledgeNodeId: string,
  reason: string,
): QualifyingItemDomainError {
  return new QualifyingItemDomainError(
    "VALIDATION_FAILED",
    `Commerce Knowledge classification "${knowledgeNodeId}" is not eligible: ${reason}.`,
    [
      {
        field: "knowledgeNodeId",
        code: "invalid_reference",
        messageKey: "qualifyingItem.knowledgeNode.invalid",
      },
    ],
  );
}

/** A retired Qualifying Item is terminal and read-only: it cannot be edited or retired again. */
export function qualifyingItemNotActiveError(): QualifyingItemDomainError {
  return new QualifyingItemDomainError(
    "INVALID_STATE_TRANSITION",
    "This Qualifying Item is retired and can no longer be changed.",
  );
}

export function noEditableQualifyingItemFieldsError(): QualifyingItemDomainError {
  return new QualifyingItemDomainError(
    "VALIDATION_FAILED",
    "No editable fields were supplied for this Qualifying Item update.",
  );
}

/** Same-key retry whose request hash differs from the key's original reservation. */
export function qualifyingItemIdempotencyConflictError(): QualifyingItemDomainError {
  return new QualifyingItemDomainError(
    "IDEMPOTENCY_CONFLICT",
    "This idempotency key was already reserved for a materially different request.",
  );
}

/** The key is still held by a first attempt that has not yet produced a known outcome. */
export function qualifyingItemIdempotencyInProgressError(): QualifyingItemDomainError {
  return new QualifyingItemDomainError(
    "TEMPORARY_UNAVAILABLE",
    "This idempotency key is currently reserved by a request that is still in progress; retry.",
  );
}
