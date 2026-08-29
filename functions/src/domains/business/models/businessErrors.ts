/**
 * Business domain errors (`ENG-P2-002A`).
 *
 * Domain-local error type, structurally compatible with the shared error
 * shape but defined independently so this domain layer stays
 * framework-independent (`functions/src/domains/identity/models/identityErrors.ts`'s
 * own precedent for why — no `commandDispatcher.ts` import here either).
 *
 * Every category used below is one of the existing, closed 14 categories
 * `functions/src/shared/errors/errorCategories.ts` defines (TRD11 §11.35,
 * `ENG-P2-002-DESIGN-001` §18) — no new category is introduced.
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class BusinessDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "BusinessDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidBusinessFieldError(field: string, value: string): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    `Invalid business field "${field}": "${value}" is not acceptable.`,
    [{ field, code: "invalid", messageKey: "business.field.invalid" }],
  );
}

export function invalidBusinessBranchFieldError(field: string, value: string): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    `Invalid business branch field "${field}": "${value}" is not acceptable.`,
    [{ field, code: "invalid", messageKey: "businessBranch.field.invalid" }],
  );
}

/** Design §6/§18: invalid lifecycle transitions map to the taxonomy's dedicated category. */
export function invalidBusinessStatusTransitionError(
  from: string,
  to: string,
): BusinessDomainError {
  return new BusinessDomainError(
    "INVALID_STATE_TRANSITION",
    `Cannot transition business status from "${from}" to "${to}".`,
  );
}

export function businessAlreadyClosedError(businessId: string): BusinessDomainError {
  return new BusinessDomainError(
    "INVALID_STATE_TRANSITION",
    `Business "${businessId}" is already closed.`,
  );
}

export function businessArchivedError(businessId: string): BusinessDomainError {
  return new BusinessDomainError(
    "INVALID_STATE_TRANSITION",
    `Business "${businessId}" is archived and cannot be modified.`,
  );
}

export function invalidBusinessCodeFormatError(value: string): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    `Invalid business code: "${value}" does not match the governed format (§24 FD-3).`,
  );
}

/**
 * Design §18: `businessCode` duplicate/idempotency conflict. Defined here
 * (not only in a future `002B` module) because it is a pure taxonomy
 * mapping with no persistence dependency — `002B`'s repository/service
 * layer is the actual caller once transactional reservation exists;
 * `002A` never triggers this itself (no Firestore uniqueness check is
 * performed here).
 */
export function duplicateBusinessCodeError(businessCode: string): BusinessDomainError {
  return new BusinessDomainError(
    "IDEMPOTENCY_CONFLICT",
    `Business code "${businessCode}" is already assigned to another business.`,
  );
}

/**
 * Design §18: a `businessCode` collision-retry bound exhausted — never a
 * caller-visible defect, the same customer-invisible-retry posture
 * `DEC-DATA-007` established for the Loyalty Number, adopted independently
 * for `businessCode` (§24 FD-3). `002A` only defines the mapping; the
 * retry loop itself is `002B`'s.
 */
export function businessCodeGenerationExhaustedError(attempts: number): BusinessDomainError {
  return new BusinessDomainError(
    "TEMPORARY_UNAVAILABLE",
    `Business code generation did not find an available code after ${attempts} attempts.`,
  );
}

/**
 * Bootstrap authority boundary (§11, §24 FD-2): a client-supplied
 * `ownerUserId` differing from the server-derived authenticated principal
 * must be rejected, never silently honored or silently overwritten.
 */
export function clientSuppliedOwnerUserIdError(): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    "ownerUserId is derived from the authenticated principal and must not be supplied by the client.",
  );
}

/** §10.3.2: the authenticated principal must resolve to an existing, eligible Customer Identity. */
export function invalidCustomerIdentityForOwnerError(userId: string): BusinessDomainError {
  return new BusinessDomainError(
    "AUTH_REQUIRED",
    `No eligible Customer Identity resolves for authenticated principal "${userId}".`,
  );
}

/**
 * `ENG-P3-002-CORR-EST-IDEMP-001`: a concurrent bootstrap attempt under the
 * *same* idempotency key is still `processing` (the winning concurrent call
 * has not committed yet). This is never a genuine conflict — the caller
 * supplied the same key and the same request, so the correct eventual
 * outcome is the winner's result, not a rejection. Mapped to
 * `TEMPORARY_UNAVAILABLE` (the same category `commandDispatcher.ts`'s
 * governed `in_progress` handling already uses for this exact reservation
 * outcome, TRD11 §11.14) rather than `IDEMPOTENCY_CONFLICT` (reserved for a
 * same-key request whose *content* actually differs) — `IDEMPOTENCY_CONFLICT`
 * maps to a non-retryable client error code, which was causing the caller to
 * discard its held idempotency key and retry under a brand-new one once the
 * winner completed, producing a duplicate Business. `TEMPORARY_UNAVAILABLE`
 * maps to a retryable code, so a caller retrying with the *same* key instead
 * observes the winner's now-`completed` record and replays its result.
 */
export function businessCreationInProgressError(idempotencyKey: string): BusinessDomainError {
  return new BusinessDomainError(
    "TEMPORARY_UNAVAILABLE",
    `Business creation for idempotency key "${idempotencyKey}" is still in progress.`,
  );
}

/** `ENG-P2-002C`: a profile/lifecycle command targeted a Business that does not exist. */
export function businessNotFoundError(businessId: string): BusinessDomainError {
  return new BusinessDomainError("RESOURCE_NOT_FOUND", `Business "${businessId}" was not found.`);
}

/**
 * `ENG-P2-002C`: a branch profile command targeted a branch that does not
 * exist, *or* that exists but belongs to a different Business than the
 * authorized context (Phase N tenant isolation) — both fail closed onto
 * the same `RESOURCE_NOT_FOUND`, never distinguishing the two cases in the
 * client-facing error (enumeration resistance: a caller cannot use this
 * error to learn whether a given branch id exists at all).
 */
export function businessBranchNotFoundError(branchId: string): BusinessDomainError {
  return new BusinessDomainError(
    "RESOURCE_NOT_FOUND",
    `Business branch "${branchId}" was not found.`,
  );
}

/**
 * `ENG-P3-001C` addendum: Business-classification reference validation
 * against the authoritative Commerce Knowledge repository (design
 * `ENG-P3-001-DESIGN-001` §G/§H, `referenceEligibility.ts`). Every category
 * below maps onto the same closed, pre-existing `ErrorCategory` taxonomy
 * `businessErrors.ts` already uses — no new category is introduced (Phase K).
 *
 * `primaryCategoryId`/`businessTypeId` "not found" also covers a persisted
 * `KnowledgeNode` document that exists but is structurally malformed —
 * `getKnowledgeNodeInTransaction` (`commerceKnowledge/repositories
 * /knowledgeNodeRepository.ts`) does not distinguish the two, matching that
 * repository's own established fail-closed precedent
 * (`resolveHierarchyPlacement`'s parent/ancestor resolution).
 */
export function primaryCategoryNotFoundError(categoryId: string): BusinessDomainError {
  return new BusinessDomainError(
    "RESOURCE_NOT_FOUND",
    `primaryCategoryId "${categoryId}" does not resolve to an existing Commerce Knowledge node.`,
    [
      {
        field: "primaryCategoryId",
        code: "not_found",
        messageKey: "business.primaryCategoryId.notFound",
      },
    ],
  );
}

export function primaryCategoryInvalidTypeError(categoryId: string): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    `primaryCategoryId "${categoryId}" does not resolve to a Commerce Knowledge node of type "business_category".`,
    [
      {
        field: "primaryCategoryId",
        code: "invalid_node_type",
        messageKey: "business.primaryCategoryId.invalidNodeType",
      },
    ],
  );
}

export function primaryCategoryNotEligibleError(categoryId: string): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    `primaryCategoryId "${categoryId}" is not eligible for a new reference — only an "active" Commerce Knowledge node may be newly referenced.`,
    [
      {
        field: "primaryCategoryId",
        code: "not_eligible",
        messageKey: "business.primaryCategoryId.notEligible",
      },
    ],
  );
}

export function businessTypeNotFoundError(businessTypeId: string): BusinessDomainError {
  return new BusinessDomainError(
    "RESOURCE_NOT_FOUND",
    `businessTypeId "${businessTypeId}" does not resolve to an existing Commerce Knowledge node.`,
    [
      {
        field: "businessTypeId",
        code: "not_found",
        messageKey: "business.businessTypeId.notFound",
      },
    ],
  );
}

export function businessTypeInvalidTypeError(businessTypeId: string): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    `businessTypeId "${businessTypeId}" does not resolve to a Commerce Knowledge node of type "business_type".`,
    [
      {
        field: "businessTypeId",
        code: "invalid_node_type",
        messageKey: "business.businessTypeId.invalidNodeType",
      },
    ],
  );
}

export function businessTypeNotEligibleError(businessTypeId: string): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    `businessTypeId "${businessTypeId}" is not eligible for a new reference — only an "active" Commerce Knowledge node may be newly referenced.`,
    [
      {
        field: "businessTypeId",
        code: "not_eligible",
        messageKey: "business.businessTypeId.notEligible",
      },
    ],
  );
}

/** Design §I/§J: the resolved `businessTypeId` node does not descend from (its persisted `parentId` does not equal) the selected `primaryCategoryId`. */
export function businessTypeCategoryMismatchError(
  businessTypeId: string,
  primaryCategoryId: string,
): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    `businessTypeId "${businessTypeId}" does not belong under primaryCategoryId "${primaryCategoryId}" in the authoritative Commerce Knowledge hierarchy.`,
    [
      {
        field: "businessTypeId",
        code: "category_mismatch",
        messageKey: "business.businessTypeId.categoryMismatch",
      },
    ],
  );
}

/**
 * `ENG-P3-002A` read-transport addendum (§21/§25): a caller has no
 * verified relationship (owner or active membership) to the requested
 * `businessId`. Deliberately identical, client-facing, to
 * `businessNotFoundError` in every read path that uses it — a caller must
 * not be able to distinguish "this Business does not exist" from "this
 * Business exists but is not yours" (enumeration resistance, mirrors
 * `businessBranchNotFoundError`'s established precedent).
 */
export function businessReadNotAuthorizedError(businessId: string): BusinessDomainError {
  return new BusinessDomainError("RESOURCE_NOT_FOUND", `Business "${businessId}" was not found.`);
}

/**
 * `ENG-P3-002A` (§37.9): the currently-required Business Terms version is
 * not configured server-side (`businessTermsConfig.ts` returned `null`).
 * Fails closed — never silently skips the Terms check, never falls back
 * to a fabricated version. Mapped to `TEMPORARY_UNAVAILABLE` (a governance/
 * configuration gap, not a caller mistake — the caller did nothing wrong
 * and cannot self-correct by retrying with different input).
 */
export function businessTermsConfigurationUnavailableError(): BusinessDomainError {
  return new BusinessDomainError(
    "TEMPORARY_UNAVAILABLE",
    "The currently-required Business Terms version is not configured. Terms acceptance is unavailable until governance configures one.",
  );
}

/**
 * `ENG-P3-002A` (§37.9/§40): `submitBusinessForVerification` was called
 * without a `BusinessTermsAcceptance` record matching the current
 * server-authoritative Terms version for this Business's current owner.
 * Covers "never accepted," "accepted an old version," and "accepted by a
 * different Business/identity" uniformly — the precondition is simply not
 * satisfied, and the client-facing message never distinguishes which of
 * those three actually occurred (no cross-Business/cross-identity
 * enumeration signal).
 */
/** `ENG-P3-002A`: a same-`(userId, businessId)` Terms-acceptance call is already in flight under a different, not-yet-resolved idempotency key attempt. */
export function businessTermsAcceptanceInProgressError(): BusinessDomainError {
  return new BusinessDomainError(
    "IDEMPOTENCY_CONFLICT",
    "A Business Terms acceptance request for this Business is already in progress.",
  );
}

export function currentBusinessTermsNotAcceptedError(): BusinessDomainError {
  return new BusinessDomainError(
    "VALIDATION_FAILED",
    "The current Business Terms version has not been accepted by this Business's onboarding owner.",
    [
      {
        field: "termsAcceptance",
        code: "not_accepted",
        messageKey: "business.terms.notAccepted",
      },
    ],
  );
}
