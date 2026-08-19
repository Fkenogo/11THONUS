/**
 * Invitation acceptance entitlement check (`ENG-P2-003B`, FD-3-STAFF).
 *
 * `ENG-P2-003-DESIGN-001` §8/§8a (FD-3-STAFF) requires that ACCEPT verify
 * the authenticated identity is actually entitled to the invitation's
 * delivery target — possession of the opaque invitation reference alone is
 * insufficient.
 *
 * **Independent-review correction.** The original version of this module
 * compared the invitation's delivery target directly against
 * `AuthenticationReference.referenceId`, on the mistaken assumption that
 * `referenceId` holds the literal verified email address or phone number.
 * It does not: per `firebaseTokenVerifier.ts` (AUTH-02 — its own explicit
 * doc comment and code, `referenceId: decoded.uid`), `referenceId` is
 * always the opaque **Firebase Auth UID**, for every reference type,
 * including `"email"` and `"phone_otp"`. Comparing a UID string against an
 * email/phone string could never match in production — the original
 * implementation would have fail-closed-denied every legitimate accepting
 * recipient. Caught only by re-deriving this fact directly from the
 * token-verification source rather than trusting the prior report.
 *
 * The corrected mechanism: for each of the accepting identity's `linked`
 * `AuthenticationReference`s of the matching provider type (`email`→
 * `email`, `phone`→`phone_otp`), the caller resolves that reference's
 * Firebase UID to its live Firebase Auth user record — the same Firebase
 * Auth project this platform's own token verifier already treats as the
 * sole token/identity authority (TRD10 §10.6.1: "Firebase Auth remains the
 * token authority; no bespoke token store") — and this module compares
 * *that* record's verified `email`/`phoneNumber` against the invitation's
 * delivery target. This reuses the platform's existing, already-verified
 * source of contact truth; it does not invent a new verification
 * mechanism, and it does not persist any new email/phone data into this
 * application's own Firestore (preserving `AuthenticatedCredential`'s
 * deliberate privacy-by-design choice not to carry raw contact values).
 *
 * This module stays framework-independent (`eslint.config.js`,
 * `permissions/models/**` boundary rule — no `firebase-admin` import): the
 * Firebase Auth lookup itself is injected by the caller
 * (`acceptStaffInvitationService.ts`, `permissions/service/**`, where such
 * imports are permitted) via `VerifiedContactLookup`; the real
 * implementation lives in `repositories/verifiedContactLookup.ts`.
 *
 * `"phone"` maps to `"phone_otp"`, the only phone credential type this
 * platform currently verifies — a `"future_provider"`/`"google_sign_in"`
 * reference is never matched (fails closed on any provider type this
 * module cannot positively confirm as email/phone-verifying).
 */

import type { InvitationDeliveryTarget } from "./invitationDeliveryTarget";
import type { AuthenticationReference } from "../../identity/models/authenticationReference";

export type VerifiedContact = { type: "email"; value: string } | { type: "phone"; value: string };

/** Resolves a Firebase Auth UID to its live, verified contact record, or `undefined` if none/unavailable. */
export type VerifiedContactLookup = (firebaseUid: string) => Promise<VerifiedContact | undefined>;

function normalizeForComparison(type: InvitationDeliveryTarget["type"], value: string): string {
  const trimmed = value.trim();
  return type === "email" ? trimmed.toLowerCase() : trimmed;
}

/**
 * `true` only if at least one of the identity's currently-linked
 * authentication references of the matching provider type resolves, via
 * `lookup`, to a verified contact value equal to the invitation's delivery
 * target. Fails closed (`false`) for an unlinked reference, a lookup
 * miss/failure, a type mismatch, a value mismatch, or an empty reference
 * list.
 */
export async function isEntitledToAcceptInvitation(
  deliveryTarget: InvitationDeliveryTarget,
  authenticationReferences: readonly AuthenticationReference[],
  lookup: VerifiedContactLookup,
): Promise<boolean> {
  const expectedReferenceType = deliveryTarget.type === "email" ? "email" : "phone_otp";
  const expectedValue = normalizeForComparison(deliveryTarget.type, deliveryTarget.value);

  const candidates = authenticationReferences.filter(
    (reference) =>
      reference.linkStatus === "linked" && reference.referenceType === expectedReferenceType,
  );

  for (const candidate of candidates) {
    const contact = await lookup(candidate.referenceId);
    if (!contact || contact.type !== deliveryTarget.type) continue;
    if (normalizeForComparison(deliveryTarget.type, contact.value) === expectedValue) {
      return true;
    }
  }
  return false;
}
