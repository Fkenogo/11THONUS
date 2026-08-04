/**
 * Identity Lifecycle status model (ENG-P2-001-01).
 *
 * Per `ENG-P2-ARCH-001` §3 and `ENG-P2-GATE-001`'s confirmed classification:
 * `recovered` is a transition/event/audit marker, not a persistent status,
 * and is therefore not a member of this set — recovery is owned by
 * `ENG-P2-001-06`/`-07`/`-10`, not this domain-foundation module.
 *
 * `registered` is never externally observable in practice — the transition
 * to `active` is automatic (`DEC-IDENTITY-001` Standard Participation
 * Principle: no verification gate) — but it remains a defined status so the
 * transition table below can express that single, immediate step.
 *
 * `suspended`/`locked` resolve only back to `active` or forward to `closed`
 * — direct lateral movement between them is not permitted. This is this
 * module's own minimal, explicit design choice (not asserted by any
 * governing document), made because *some* transition table is required
 * for the state machine to function; the real-world authority/trigger for
 * resolving a `suspended`/`locked` identity back to `active` (who may do
 * it, under what evidence) is deliberately not decided here — a future
 * service-level policy owns that, this module only exposes the transition.
 */

export const IDENTITY_STATUSES = [
  "registered",
  "active",
  "dormant",
  "suspended",
  "locked",
  "closed",
  "archived",
] as const;

export type IdentityStatus = (typeof IDENTITY_STATUSES)[number];

const PERMITTED_TRANSITIONS: Record<IdentityStatus, readonly IdentityStatus[]> = {
  registered: ["active"],
  active: ["dormant", "suspended", "locked", "closed"],
  dormant: ["active", "suspended", "locked", "closed"],
  suspended: ["active", "closed"],
  locked: ["active", "closed"],
  closed: ["archived"],
  archived: [],
};

export function isValidIdentityStatusTransition(from: IdentityStatus, to: IdentityStatus): boolean {
  return PERMITTED_TRANSITIONS[from].includes(to);
}

export function isTerminalIdentityStatus(status: IdentityStatus): boolean {
  return PERMITTED_TRANSITIONS[status].length === 0;
}
