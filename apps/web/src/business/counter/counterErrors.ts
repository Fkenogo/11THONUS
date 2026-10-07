/**
 * Counter error classification (`EA-BL-001-CORR-002-B`, §15/§16).
 *
 * Reduces a thrown `BusinessApiError` to one of a few UX kinds. Only the closed, server-supplied
 * public `reason` token (never a raw code or message) selects a validation-failure copy; a missing or
 * unknown token is the generic message. The only kind that keeps the current transaction intent (and
 * so its idempotency key) is `uncertain` — the call may or may not have committed.
 */

import { PURCHASE_FAILURE_REASONS, type PurchaseFailureReason } from "../api/purchaseMutations";

export type CounterErrorKind =
  | "customer_artifact"
  | "programme"
  | "item"
  | "quantity"
  | "generic"
  | "uncertain"
  | "session"
  | "forbidden";

const REASON_TO_KIND: Record<PurchaseFailureReason, CounterErrorKind> = {
  customer_artifact_invalid_or_not_found: "customer_artifact",
  programme_unavailable: "programme",
  qualifying_item_invalid: "item",
  quantity_invalid: "quantity",
  generic_validation_failed: "generic",
};

export function classifyCounterError(error: unknown): CounterErrorKind {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  switch (code) {
    case "unavailable":
    case "timeout":
      return "uncertain";
    case "auth_required":
      return "session";
    case "auth_forbidden":
      return "forbidden";
    case "validation_failed": {
      const reason = (error as { reason?: unknown }).reason;
      return (PURCHASE_FAILURE_REASONS as readonly unknown[]).includes(reason)
        ? REASON_TO_KIND[reason as PurchaseFailureReason]
        : "generic";
    }
    default:
      // not_found, conflict, failed, or anything unexpected: never invent a cause.
      return "generic";
  }
}

/** True when the failed submission may have committed, so the SAME intent must be retried. */
export function isUncertainCounterError(kind: CounterErrorKind): boolean {
  return kind === "uncertain";
}
