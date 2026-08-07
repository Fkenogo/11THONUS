/**
 * Authentication reference (ENG-P2-001-01).
 *
 * The identity-side pointer to a linked Authentication credential
 * (`ENG-P2-ARCH-001` §7 — "Authentication provides access. Authentication
 * does not own identity."). Carries only a provider-independent reference
 * id, its type, link status, and creation attribution — never a token,
 * OTP detail, email-link implementation, passkey, or OAuth credential.
 *
 * Naming note (`ENG-P2-ARCH-CORR-004`, Finding F5): this domain type and
 * the embedded `users/{id}.authenticationReferences[]` projection
 * (`userDocument.ts`) both name this field `linkStatus`. The separate,
 * authoritative `authenticationReferences/{type}:{id}` document
 * (`authenticationReferenceRepository.ts`) persists the identical
 * `AuthenticationReferenceLinkStatus` value under the field name
 * `status` instead. This is cosmetic drift, not a functional defect —
 * no code reads the wrong field — retained as-is because both names are
 * live, persisted Firestore field names; renaming either is a schema-
 * affecting change deferred to a future, dedicated naming-consistency
 * task (`ENG-P2-001-NAMING-001`).
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
