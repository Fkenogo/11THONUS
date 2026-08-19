/**
 * Business Membership Invitation delivery-target contract (`ENG-P2-003A`).
 *
 * Per `ENG-P2-003-DESIGN-001` §6.3/§7.1a: an invitation's email/phone is
 * **delivery/targeting evidence, never authoritative platform identity**.
 * This closed type represents only "how the invitation was addressed" —
 * it is never read anywhere as a stand-in for a Customer Identity `userId`.
 *
 * Closed to exactly the two channels the merged design confirms
 * (§6.4 addendum, FD-1-STAFF): `"email"` and `"phone"`. No loyalty-number
 * invitation, username, social account, or QR-identity delivery type is
 * introduced (Phase F's explicit non-goals).
 *
 * No format-specific normalization (e.g. RFC 5322 email validation, E.164
 * phone validation) is invented here — no governed, reusable email/phone
 * validator exists elsewhere in the codebase to reuse (verified by search),
 * and Phase Q explicitly prohibits inventing one. Only structural
 * well-formedness (non-blank string) is enforced.
 *
 * Framework-independent (`eslint.config.js`, `permissions/**` boundary
 * rule) — no Firebase SDK import.
 */

import {
  invalidInvitationDeliveryTypeError,
  invalidInvitationDeliveryTargetError,
} from "./permissionErrors";

export const INVITATION_DELIVERY_TYPES = ["email", "phone"] as const;

export type InvitationDeliveryType = (typeof INVITATION_DELIVERY_TYPES)[number];

export type InvitationDeliveryTarget = {
  readonly type: InvitationDeliveryType;
  readonly value: string;
};

export function isInvitationDeliveryType(value: unknown): value is InvitationDeliveryType {
  return (
    typeof value === "string" && (INVITATION_DELIVERY_TYPES as readonly string[]).includes(value)
  );
}

export type CreateInvitationDeliveryTargetInput = {
  type: string;
  value: string;
};

export function createInvitationDeliveryTarget(
  input: CreateInvitationDeliveryTargetInput,
): InvitationDeliveryTarget {
  if (!isInvitationDeliveryType(input.type)) {
    throw invalidInvitationDeliveryTypeError(input.type);
  }
  if (typeof input.value !== "string" || input.value.trim().length === 0) {
    throw invalidInvitationDeliveryTargetError("value");
  }
  return { type: input.type, value: input.value };
}
