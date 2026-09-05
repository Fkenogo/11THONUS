/**
 * Maps the currently-signed-in Firebase user's provider id onto the closed
 * backend `AuthProviderId`/`referenceType` vocabulary (`providerConfig.ts`).
 *
 * Deliberately duplicated from `identity/api/authReference.ts` (which is
 * itself duplicated from `business/api/authReference.ts`) rather than
 * cross-domain imported (`AUTH-MFA-003B`), mirroring the repository's
 * "disclosed duplication" convention for this generic, framework-independent
 * mapping.
 */

import type { AuthProviderId } from "../../providerConfig";

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
