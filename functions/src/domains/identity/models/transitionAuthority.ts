/**
 * Identity status transition authority (ENG-P2-001-06).
 *
 * The minimum authority *reference* a lifecycle transition command must
 * carry — who or what category of actor is requesting the transition —
 * per TRD12 §12.13 (customer-requested trusted server actions, e.g.
 * account closure), §12.30-31 (support-assisted recovery), §12.33
 * (administrative suspension). This is a closed category, not a role or
 * permission system: no UI, no caller-supplied unvalidated claim is
 * accepted here — a future application boundary is what maps a real
 * caller onto one of these categories before invoking the lifecycle
 * service; this module only validates the category shape.
 */

import { invalidTransitionAuthorityError } from "./identityErrors";

export const TRANSITION_AUTHORITIES = [
  "customer_initiated",
  "system_initiated",
  "support_initiated",
  "administrator_initiated",
  "security_policy_initiated",
] as const;

export type TransitionAuthority = (typeof TRANSITION_AUTHORITIES)[number];

export function createTransitionAuthority(raw: string): TransitionAuthority {
  if ((TRANSITION_AUTHORITIES as readonly string[]).includes(raw)) {
    return raw as TransitionAuthority;
  }
  throw invalidTransitionAuthorityError(raw);
}
