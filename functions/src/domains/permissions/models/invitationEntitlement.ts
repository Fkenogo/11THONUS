/**
 * Invitation acceptance entitlement check (`ENG-P2-003B`, FD-3-STAFF).
 *
 * `ENG-P2-003-DESIGN-001` §8/§8a (FD-3-STAFF) requires that ACCEPT verify
 * the authenticated identity is actually entitled to the invitation's
 * delivery target — possession of the opaque invitation reference alone is
 * insufficient. This module implements the "secure verification" FD-3-STAFF
 * leaves Engineering-owned, using the *only* source of already-verified
 * contact evidence this platform has: the accepting Customer Identity's own
 * linked `AuthenticationReference`s (`identity/models/authenticationReference.ts`)
 * — each one is itself the product of a completed, Firebase-verified
 * provider sign-in (phone OTP or email link/password), never a raw,
 * unverified profile field. No new verification mechanism, OTP, or
 * confirmation step is invented here; this reuses identity data that is
 * already authoritative and already durably persisted.
 *
 * `InvitationDeliveryType` (`"email" | "phone"`) is mapped onto
 * `AuthenticationReferenceType` (`"email" | "phone_otp" | "google_sign_in" |
 * "future_provider"`) — `"phone"` maps to `"phone_otp"`, the only phone
 * credential type this platform currently verifies. A future phone
 * provider (`"future_provider"`) is deliberately not matched — this
 * module fails closed on any provider it cannot positively confirm.
 *
 * Comparison: no reusable email/phone normalizer exists anywhere in this
 * codebase (confirmed by `invitationDeliveryTarget.ts`'s own search, and by
 * this module's own search — none found). Rather than invent one, this
 * module applies only the minimum comparison-time normalization safe to do
 * without a validator: case-insensitive, trimmed comparison for `"email"`
 * (email local/domain parts are conventionally case-insensitive in
 * practice, and Firebase Auth itself lowercases email identifiers), and
 * exact (trimmed) comparison for `"phone"` (phone numbers are not
 * case-sensitive and no safe normalization beyond trimming is invented).
 * Neither the invitation's stored `deliveryTarget.value` nor the identity's
 * stored `referenceId` is mutated by this comparison — normalization is
 * applied only transiently, at comparison time.
 */

import type { InvitationDeliveryTarget } from "./invitationDeliveryTarget";
import type {
  AuthenticationReference,
  AuthenticationReferenceType,
} from "../../identity/models/authenticationReference";

function deliveryTypeToReferenceType(
  type: InvitationDeliveryTarget["type"],
): AuthenticationReferenceType {
  return type === "email" ? "email" : "phone_otp";
}

function normalizeForComparison(type: InvitationDeliveryTarget["type"], value: string): string {
  const trimmed = value.trim();
  return type === "email" ? trimmed.toLowerCase() : trimmed;
}

/**
 * `true` only if the identity holds a currently-linked authentication
 * reference of the matching provider type whose verified reference value
 * equals the invitation's delivery target. Fails closed (`false`) for an
 * unlinked reference, a mismatched value, or an empty reference list —
 * never assumes entitlement from the invitation's own data alone.
 */
export function isEntitledToAcceptInvitation(
  deliveryTarget: InvitationDeliveryTarget,
  authenticationReferences: readonly AuthenticationReference[],
): boolean {
  const expectedReferenceType = deliveryTypeToReferenceType(deliveryTarget.type);
  const expectedValue = normalizeForComparison(deliveryTarget.type, deliveryTarget.value);

  return authenticationReferences.some(
    (reference) =>
      reference.linkStatus === "linked" &&
      reference.referenceType === expectedReferenceType &&
      normalizeForComparison(deliveryTarget.type, reference.referenceId) === expectedValue,
  );
}
