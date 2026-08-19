/**
 * Business Membership Invitation expiry policy (`ENG-P2-003B`, FD-4-STAFF).
 *
 * `ENG-P2-003-DESIGN-001` §9/§28 FD-4-STAFF approves that invitations are
 * time-limited but leaves the exact duration Engineering-owned. A single
 * named constant (rather than a value inlined inside a command) so the
 * duration can be revised later without touching command logic — per the
 * task's own "avoid hardcoding the value deep inside domain logic" note.
 *
 * 7 days: long enough that a prospective hire checking email/SMS a few
 * days late is not blocked, short enough that a stale, unconsumed
 * invitation does not linger indefinitely as a standing target. No
 * governed source specifies a different value; this is a disclosed,
 * revisable Engineering default, not a Founder policy (FD-4-STAFF's own
 * text: "no numeric value is frozen by this document").
 */

export const INVITATION_EXPIRY_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function computeInvitationExpiresAt(invitedAt: Date): Date {
  return new Date(invitedAt.getTime() + INVITATION_EXPIRY_DURATION_MS);
}

export function isInvitationPastExpiry(expiresAt: Date, now: Date): boolean {
  return now.getTime() >= expiresAt.getTime();
}
