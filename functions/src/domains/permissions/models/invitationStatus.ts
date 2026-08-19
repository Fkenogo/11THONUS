/**
 * Business Membership Invitation lifecycle status model (`ENG-P2-003A`).
 *
 * The closed four-value lifecycle `ENG-P2-003-DESIGN-001` §7.2a resolves:
 * `pending` is the only non-terminal state; `accepted`/`revoked`/`expired`
 * are all terminal. No reverse transition back to `pending` is modeled —
 * a reissue/resend creates a **new** invitation record rather than
 * reactivating a terminal one (FD-4-STAFF). This module expresses only the
 * structural transition table — mirrors the precedent
 * `functions/src/domains/business/models/businessStatus.ts` set for
 * `Business`'s own lifecycle: no runtime transition service, no
 * persistence, no authorization — pure contract/validation only (Phase G).
 */

export const INVITATION_STATUSES = ["pending", "accepted", "revoked", "expired"] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export function isInvitationStatus(value: unknown): value is InvitationStatus {
  return typeof value === "string" && (INVITATION_STATUSES as readonly string[]).includes(value);
}

const PERMITTED_TRANSITIONS: Record<InvitationStatus, readonly InvitationStatus[]> = {
  pending: ["accepted", "revoked", "expired"],
  accepted: [],
  revoked: [],
  expired: [],
};

export function isValidInvitationStatusTransition(
  from: InvitationStatus,
  to: InvitationStatus,
): boolean {
  return PERMITTED_TRANSITIONS[from].includes(to);
}

export function isTerminalInvitationStatus(status: InvitationStatus): boolean {
  return PERMITTED_TRANSITIONS[status].length === 0;
}
