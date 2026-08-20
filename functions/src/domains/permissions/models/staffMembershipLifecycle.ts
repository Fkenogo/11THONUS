/**
 * Staff Membership lifecycle state machine (`ENG-P2-003C`).
 *
 * Pure domain-invariant predicate — re-derived from `ENG-P2-003-DESIGN-001`
 * §5.3's governed transition table (rows: SUSPEND `active -> suspended`,
 * REACTIVATE `suspended -> active`, REMOVE `active|suspended -> removed`),
 * cross-checked against TRD10 §10.6.4's closed four-value `businessMembership`
 * status enum (`invited`/`active`/`suspended`/`removed`).
 *
 * `removed` is terminal under every transition this module defines — the
 * design's FD-4-STAFF disposition is explicit that REMOVE is
 * **non-reversible**: a removed member is brought back only via a fresh
 * invitation/acceptance (`ENG-P2-003B`'s separately-governed re-invitation
 * path, which reuses the same document id but is not a "transition" this
 * lifecycle module exposes or permits). `invited` never appears as a
 * `businessMembership` status under the resolved FD-2-STAFF model (no
 * `businessMembership` document is ever created in an `invited` state), but
 * the schema still recognises the value (unmodified), so this module treats
 * it as a legitimate — if practically unreached — non-`active`/`suspended`
 * status: no lifecycle command in this package permits any transition out of
 * `invited` either (it is not `active` or `suspended`, so it fails every
 * guard below identically to `removed`).
 *
 * This module answers only "is this *state* transition structurally legal
 * for this membership status?" — never "is this actor/target combination
 * authorized?" (that remains `staffMembershipTargetPolicy.ts`, consumed
 * separately, never duplicated here) and never "does the actor hold the
 * governing permission?" (that remains `ENG-P2-004`'s evaluator, via
 * `authorizeAndExecute`).
 */

import type { EvaluationBusinessMembership } from "../evaluator/types";

export type MembershipStatus = EvaluationBusinessMembership["status"];

export const STAFF_LIFECYCLE_ACTIONS = ["suspend", "reactivate", "remove"] as const;

export type StaffLifecycleAction = (typeof STAFF_LIFECYCLE_ACTIONS)[number];

/**
 * The exact, closed set of governed status transitions
 * (`ENG-P2-003-DESIGN-001` §5.3): SUSPEND (`active -> suspended`),
 * REACTIVATE (`suspended -> active`), REMOVE (`active -> removed` and
 * `suspended -> removed`). No other transition is ever legal — in
 * particular `removed -> active` (REACTIVATE) is deliberately absent: the
 * design explicitly distinguishes this from `ENG-P2-003B`'s separate,
 * governed re-invitation/reactivation-in-place path, which is not an
 * ordinary lifecycle transition this package may assume or invoke.
 */
const LIFECYCLE_TRANSITIONS: Readonly<Record<StaffLifecycleAction, MembershipStatus>> = {
  suspend: "suspended",
  reactivate: "active",
  remove: "removed",
};

const REQUIRED_CURRENT_STATUS: Readonly<Record<StaffLifecycleAction, readonly MembershipStatus[]>> =
  {
    suspend: ["active"],
    reactivate: ["suspended"],
    remove: ["active", "suspended"],
  };

/**
 * Whether `action` is structurally legal from `currentStatus`, per the
 * closed transition table above. Pure — no I/O, no authorization check.
 */
export function isPermittedLifecycleTransition(
  currentStatus: MembershipStatus,
  action: StaffLifecycleAction,
): boolean {
  return REQUIRED_CURRENT_STATUS[action].includes(currentStatus);
}

/** The status `action` transitions a membership to, once permitted. */
export function targetStatusForLifecycleAction(action: StaffLifecycleAction): MembershipStatus {
  return LIFECYCLE_TRANSITIONS[action];
}
