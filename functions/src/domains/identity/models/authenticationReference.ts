/**
 * Authentication reference (ENG-P2-001-01).
 *
 * The identity-side pointer to a linked Authentication credential
 * (`ENG-P2-ARCH-001` §7 — "Authentication provides access. Authentication
 * does not own identity."). Carries only a provider-independent reference
 * id, its type, link status, and creation attribution — never a token,
 * OTP detail, email-link implementation, passkey, or OAuth credential.
 */

import { invalidAuthenticationReferenceIdError } from "./identityErrors";

export type AuthenticationReferenceType =
  "phone_otp" | "google_sign_in" | "email" | "future_provider";

export type AuthenticationReferenceLinkStatus = "linked" | "unlinked";

export type AuthenticationReference = {
  readonly referenceId: string;
  readonly referenceType: AuthenticationReferenceType;
  readonly linkStatus: AuthenticationReferenceLinkStatus;
  readonly createdAt: Date;
  readonly createdBy: string | null;
};

export type CreateAuthenticationReferenceParams = {
  referenceId: string;
  referenceType: AuthenticationReferenceType;
  createdAt: Date;
  createdBy: string | null;
};

export function createAuthenticationReference(
  params: CreateAuthenticationReferenceParams,
): AuthenticationReference {
  if (params.referenceId.trim().length === 0) {
    throw invalidAuthenticationReferenceIdError(params.referenceId);
  }

  return {
    referenceId: params.referenceId,
    referenceType: params.referenceType,
    linkStatus: "linked",
    createdAt: params.createdAt,
    createdBy: params.createdBy,
  };
}
