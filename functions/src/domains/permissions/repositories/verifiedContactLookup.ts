/**
 * Live Firebase Auth verified-contact lookup (`ENG-P2-003B`,
 * independent-review correction, Phase C/D/L).
 *
 * Resolves a Firebase Auth UID (the value every `AuthenticationReference.
 * referenceId` actually holds — see `invitationEntitlement.ts`'s module
 * comment) to that account's own verified `email`/`phoneNumber`, straight
 * from Firebase Auth itself — the same Admin SDK surface
 * `firebaseTokenVerifier.ts` already treats as this platform's sole
 * token/identity authority. No email/phone value is read from or written
 * to this application's own Firestore by this lookup.
 *
 * A verified email requires `emailVerified: true` on the Firebase user
 * record — Firebase's `password` provider does not guarantee a verified
 * email by default, so an unverified email is treated identically to no
 * email at all (fails closed, never satisfies entitlement). A `phone`
 * provider account is inherently OTP-verified at sign-in by Firebase
 * itself — no separate verified flag exists or is needed.
 *
 * Firebase-adapter (repositories) sub-layer — a Firebase SDK import is
 * permitted here (ESLint boundary exempts `permissions/repositories/**`,
 * mirroring the rest of this domain's repositories/service split).
 */

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "../../../infrastructure/firebase/admin";
import type { VerifiedContactLookup } from "../models/invitationEntitlement";

export const lookupVerifiedContactByFirebaseUid: VerifiedContactLookup = async (firebaseUid) => {
  let user;
  try {
    user = await getAuth(getAdminApp()).getUser(firebaseUid);
  } catch {
    // Unknown/deleted Firebase user, or a transient Auth-service failure —
    // either way, fail closed: no verified contact can be confirmed.
    return undefined;
  }

  if (user.email && user.emailVerified) {
    return { type: "email", value: user.email };
  }
  if (user.phoneNumber) {
    return { type: "phone", value: user.phoneNumber };
  }
  return undefined;
};
