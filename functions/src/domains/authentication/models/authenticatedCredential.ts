/**
 * Authenticated credential (AUTH-01, per AUTH-BP §3/§4).
 *
 * The provider-neutral result of a *verified* provider sign-in: which
 * authentication reference it maps to, when it was verified, and any
 * non-sensitive provider signals. It **never** carries credential material
 * (token / OTP secret / provider token) — those remain in Firebase
 * Authentication (TRD10 §10.6.1); this is a *reference* only.
 *
 * Provider neutrality (`DEC-IDENTITY-001` / `DEC-PROV-004` point 2): the
 * `referenceType` reuses the merged Customer Identity vocabulary
 * (`AuthenticationReferenceType` — `phone_otp`/`google_sign_in`/`email`/
 * `future_provider`); this module does not redefine or duplicate it.
 *
 * Pure domain module — no Firebase import.
 */

import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import { invalidAuthenticatedCredentialError } from "./authenticationErrors";

export type ProviderSignals = Record<string, string | number | boolean>;

export type AuthenticatedCredential = {
  readonly referenceType: AuthenticationReferenceType;
  readonly referenceId: string;
  readonly verifiedAt: Date;
  readonly providerSignals: ProviderSignals;
};

export type CreateAuthenticatedCredentialParams = {
  referenceType: AuthenticationReferenceType;
  referenceId: string;
  verifiedAt: Date;
  providerSignals?: ProviderSignals;
};

export function createAuthenticatedCredential(
  params: CreateAuthenticatedCredentialParams,
): AuthenticatedCredential {
  if (typeof params.referenceId !== "string" || params.referenceId.trim().length === 0) {
    throw invalidAuthenticatedCredentialError("referenceId", String(params.referenceId));
  }
  if (!(params.verifiedAt instanceof Date) || Number.isNaN(params.verifiedAt.getTime())) {
    throw invalidAuthenticatedCredentialError("verifiedAt", String(params.verifiedAt));
  }

  return {
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    verifiedAt: params.verifiedAt,
    providerSignals: { ...(params.providerSignals ?? {}) },
  };
}
