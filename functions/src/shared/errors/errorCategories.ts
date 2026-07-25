/**
 * Standard error categories (ENG-P1-002).
 *
 * The closed set of error categories TRD11 §11.35 defines. No domain
 * introduces a 15th category or repurposes one of these for a different
 * meaning without a TRD change.
 */

export const ERROR_CATEGORIES = [
  "AUTH_REQUIRED",
  "AUTH_FORBIDDEN",
  "ACCOUNT_SUSPENDED",
  "BUSINESS_INACTIVE",
  "SUBSCRIPTION_LIMIT_REACHED",
  "INVALID_STATE_TRANSITION",
  "PURCHASE_ALREADY_RESPONDED",
  "REWARD_NOT_AVAILABLE",
  "REWARD_ALREADY_REDEEMED",
  "IDEMPOTENCY_CONFLICT",
  "VALIDATION_FAILED",
  "RESOURCE_NOT_FOUND",
  "TEMPORARY_UNAVAILABLE",
  "INTEGRATION_FAILED",
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

export function isErrorCategory(value: string): value is ErrorCategory {
  return (ERROR_CATEGORIES as readonly string[]).includes(value);
}
