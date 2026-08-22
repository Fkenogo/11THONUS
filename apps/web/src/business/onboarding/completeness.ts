/**
 * Explicit, tested completeness predicates for onboarding resume (design
 * §8/§38): "where should the wizard open" is derived purely from the
 * server-authoritative `BusinessContext`, never from a persisted
 * `onboardingStep` field or loose truthiness. Each predicate names exactly
 * the governed required field(s) it checks.
 */

import type { BusinessContext, BusinessContextBranch } from "../api/businessContext";

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** `displayName`, `countryCode`, `city`, `contactPhone` — the `createBusiness` required-field set. */
export function isBusinessDetailsComplete(context: BusinessContext): boolean {
  return (
    isNonEmpty(context.displayName) &&
    isNonEmpty(context.countryCode) &&
    isNonEmpty(context.city) &&
    isNonEmpty(context.contactPhone)
  );
}

/** `primaryCategoryId` is required; `businessTypeId` is deliberately optional. */
export function isClassificationComplete(context: BusinessContext): boolean {
  return isNonEmpty(context.primaryCategoryId);
}

function isBranchRecordComplete(branch: BusinessContextBranch): boolean {
  return (
    isNonEmpty(branch.displayName) && isNonEmpty(branch.countryCode) && isNonEmpty(branch.city)
  );
}

/** A `null` branch is an integrity failure (Phase L), not an incomplete-but-normal step. */
export function isBranchComplete(context: BusinessContext): boolean {
  return context.branch !== null && isBranchRecordComplete(context.branch);
}

export function isTermsComplete(context: BusinessContext): boolean {
  return context.termsAcceptance.accepted === true;
}

export function isReadyToSubmit(context: BusinessContext): boolean {
  return (
    isBusinessDetailsComplete(context) &&
    isClassificationComplete(context) &&
    isBranchComplete(context) &&
    isTermsComplete(context)
  );
}
