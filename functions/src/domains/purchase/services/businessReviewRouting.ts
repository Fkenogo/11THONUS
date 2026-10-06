/**
 * Business Review routing rule (`EA-BL-001-CORR-002-BR`, `DEC-PROD-015`).
 *
 * A pure function of (locked version threshold, whole-record quantity) deciding ONLY which initial
 * status a freshly recorded Purchase enters:
 *
 *   threshold NULL                 -> waiting_for_customer   (Business Review disabled)
 *   quantity <  threshold          -> waiting_for_customer
 *   quantity >= threshold          -> business_review_required
 *
 * It is routing and nothing else: never a quantity cap, never a rejection rule, never reward or
 * loyalty math (`DEC-LOY-003`: a threshold crossing never auto-rejects). It is deliberately
 * independent of `bulk_review_threshold` (review-visibility-only metadata, untouched). A
 * non-positive or non-integer threshold cannot reach here through the schema (`CHECK >= 1`), but
 * fails CLOSED to "disabled" rather than "review everything" if it ever did.
 */

import type { PurchaseStatus } from "../models/purchase";

export type BusinessReviewRoutingStatus = Extract<
  PurchaseStatus,
  "waiting_for_customer" | "business_review_required"
>;

export function resolveBusinessReviewRouting(params: {
  readonly threshold: number | null;
  readonly quantity: number;
}): BusinessReviewRoutingStatus {
  const { threshold, quantity } = params;
  if (threshold === null || !Number.isInteger(threshold) || threshold < 1) {
    return "waiting_for_customer";
  }
  return quantity >= threshold ? "business_review_required" : "waiting_for_customer";
}
