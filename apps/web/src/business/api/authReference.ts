/**
 * Maps the currently-signed-in Firebase user's provider id onto the closed
 * backend `AuthProviderId`/`referenceType` vocabulary (`providerConfig.ts`).
 *
 * Every business callable (`getOwnedBusinesses`, `getBusinessContext`, ...)
 * requires `rawToken`+`referenceType` in its payload, exactly like the AUTH-03
 * `authenticate` callable — there is no ambient `request.auth` reliance on the
 * client side. Sign-in flows know their own `referenceType` statically
 * (`googleSignInFlow.ts`), but a page load *after* sign-in (e.g. resuming
 * onboarding) only has the Firebase `User`, so this module derives the same
 * value from `user.providerData[0].providerId` instead of re-deriving or
 * guessing it.
 */

import type { AuthProviderId } from "../../authentication/providerConfig";

const FIREBASE_PROVIDER_ID_TO_AUTH_PROVIDER_ID: Readonly<Record<string, AuthProviderId>> = {
  "google.com": "google_sign_in",
  password: "email",
  phone: "phone_otp",
};

export class UnresolvedAuthReferenceError extends Error {
  constructor(providerId: string | undefined) {
    super(`no backend referenceType is mapped for Firebase provider id "${providerId ?? ""}"`);
    this.name = "UnresolvedAuthReferenceError";
  }
}

/** Throws rather than guessing when the signed-in user's provider is unmapped. */
export function resolveAuthReferenceType(providerId: string | undefined): AuthProviderId {
  const referenceType = providerId
    ? FIREBASE_PROVIDER_ID_TO_AUTH_PROVIDER_ID[providerId]
    : undefined;
  if (!referenceType) {
    throw new UnresolvedAuthReferenceError(providerId);
  }
  return referenceType;
}
