/**
 * Session context (AUTH-01, per AUTH-BP §9).
 *
 * The resolved *access context* an authenticated action carries: the
 * customer identity it resolved to, the authentication *reference* used, and
 * when it was issued. This is the shape/contract only — session *management*
 * (issuing from a Firebase ID token, validity/expiry, privileged re-auth,
 * sign-out) is AUTH-07, not this module. Carries only a reference, never
 * credential material (TRD10 §10.6.1).
 *
 * Pure domain module — no Firebase import.
 */

import type { AuthenticatedCredential } from "./authenticatedCredential";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import { invalidAuthenticatedCredentialError } from "./authenticationErrors";

export type SessionAuthReference = {
  readonly referenceType: AuthenticationReferenceType;
  readonly referenceId: string;
};

export type SessionContext = {
  readonly customerIdentityId: string;
  readonly authReference: SessionAuthReference;
  readonly issuedAt: Date;
};

export type CreateSessionContextParams = {
  customerIdentityId: string;
  credential: AuthenticatedCredential;
  issuedAt: Date;
};

export function createSessionContext(params: CreateSessionContextParams): SessionContext {
  if (
    typeof params.customerIdentityId !== "string" ||
    params.customerIdentityId.trim().length === 0
  ) {
    throw invalidAuthenticatedCredentialError(
      "customerIdentityId",
      String(params.customerIdentityId),
    );
  }
  if (!(params.issuedAt instanceof Date) || Number.isNaN(params.issuedAt.getTime())) {
    throw invalidAuthenticatedCredentialError("issuedAt", String(params.issuedAt));
  }

  return {
    customerIdentityId: params.customerIdentityId,
    authReference: {
      referenceType: params.credential.referenceType,
      referenceId: params.credential.referenceId,
    },
    issuedAt: params.issuedAt,
  };
}
