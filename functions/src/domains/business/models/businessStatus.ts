/**
 * Business lifecycle status model (`ENG-P2-002A`).
 *
 * The eight `status` values TRD10 §10.6.3 governs, per
 * `ENG-P2-002-DESIGN-001` §6's lifecycle table. This module expresses only
 * the *structural* transition table §6 actually describes — it does not
 * implement, and must not be read as authorizing, any of the mechanisms
 * behind a transition:
 *
 * - `pending_verification` → `trial`: the verification mechanism gating
 *   this transition is explicitly ungoverned (§6, §24 item 3) — the edge
 *   below only expresses that the transition exists once whatever
 *   triggers it fires; that trigger is not designed here or anywhere yet.
 * - `active`/`trial` → `expired`: named, mechanism ("subscription lapse
 *   detection") not detailed — same treatment.
 * - `expired` → anything but `closed`: re-activation from `expired` is
 *   "never described" (§6) — not implemented; `expired` only transitions
 *   forward to `closed`.
 * - `active` → `suspended`: the administrator path is governed (TRD18
 *   §18.12); the owner-self-suspend variant is explicitly excluded from
 *   `ENG-P2-002A` (§8, §24 item 1) — this module expresses the edge that
 *   both paths would use, not who may invoke it.
 * - any non-terminal status → `closed`: §6's own "any → closed" row.
 *
 * Who may invoke a transition, and under what precondition, is a
 * command/service-layer concern (`ENG-P2-002B`/`002C`) — this module is
 * the structural state machine only, exactly mirroring the precedent
 * `functions/src/domains/identity/models/identityStatus.ts` set for
 * Customer Identity's own lifecycle.
 */

export const BUSINESS_STATUSES = [
  "draft",
  "pending_verification",
  "trial",
  "active",
  "suspended",
  "expired",
  "closed",
  "archived",
] as const;

export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

const PERMITTED_TRANSITIONS: Record<BusinessStatus, readonly BusinessStatus[]> = {
  draft: ["pending_verification", "closed"],
  pending_verification: ["trial", "closed"],
  trial: ["active", "expired", "closed"],
  active: ["suspended", "expired", "closed"],
  suspended: ["active", "closed"],
  expired: ["closed"],
  closed: ["archived"],
  archived: [],
};

export function isValidBusinessStatusTransition(from: BusinessStatus, to: BusinessStatus): boolean {
  return PERMITTED_TRANSITIONS[from].includes(to);
}

export function isTerminalBusinessStatus(status: BusinessStatus): boolean {
  return PERMITTED_TRANSITIONS[status].length === 0;
}
