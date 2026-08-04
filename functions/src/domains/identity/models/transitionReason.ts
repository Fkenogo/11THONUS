/**
 * Identity status transition reason (ENG-P2-001-06).
 *
 * A bounded reason category attached to every lifecycle transition
 * command, for audit purposes — never arbitrary free-text narrative.
 * Where a free-text note is genuinely needed later, that belongs to a
 * future application/audit layer, not the domain event or this value
 * object (per this task's own privacy/observability constraint: no
 * sensitive narrative content inside domain events or logs).
 */

import { invalidTransitionReasonError } from "./identityErrors";

export const TRANSITION_REASONS = [
  "customer_inactivity",
  "customer_request",
  "suspected_compromise",
  "administrative_suspension",
  "policy_breach",
  "support_recovery",
  "account_closure",
  "archival_retention_completion",
  "system_lifecycle_rule",
] as const;

export type TransitionReason = (typeof TRANSITION_REASONS)[number];

export function createTransitionReason(raw: string): TransitionReason {
  if ((TRANSITION_REASONS as readonly string[]).includes(raw)) {
    return raw as TransitionReason;
  }
  throw invalidTransitionReasonError(raw);
}
