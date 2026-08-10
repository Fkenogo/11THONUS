/**
 * Authenticated credential (AUTH-01, per AUTH-BP §3/§4).
 *
 * The provider-neutral result of a *verified* provider sign-in: which
 * authentication reference it maps to, when it was verified, the trusted
 * instant the user actually authenticated, and any non-sensitive provider
 * signals. It **never** carries credential material (token / OTP secret /
 * provider token) — those remain in Firebase Authentication (TRD10 §10.6.1);
 * this is a *reference* only.
 *
 * `authenticatedAt` (AUTH-07 additive extension, Founder-authorized): the
 * server-derived instant the *user* authenticated (the Firebase `auth_time`
 * claim), as distinct from `verifiedAt` (when this token was verified). It is
 * the freshness anchor for AUTH-07 privileged re-authentication (AUTH-BP §9,
 * TRD12 §12.29) — a token refresh advances `verifiedAt` but never `auth_time`,
 * so freshness must be measured from `authenticatedAt`, never `verifiedAt`.
 * Optional at the contract level so the extension is non-breaking for existing
 * consumers; the AUTH-02 verifier always populates it from verified claims and
 * fails closed when the trusted signal is absent, so a production credential
 * always carries it. It is **never** accepted from client input.
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
  /**
   * The trusted, server-derived instant the user authenticated (Firebase
   * `auth_time`). Optional so the extension is non-breaking; production
   * credentials always carry it (see the module note).
   */
  readonly authenticatedAt?: Date;
  readonly providerSignals: ProviderSignals;
};

export type CreateAuthenticatedCredentialParams = {
  referenceType: AuthenticationReferenceType;
  referenceId: string;
  verifiedAt: Date;
  authenticatedAt?: Date;
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
  if (
    params.authenticatedAt !== undefined &&
    (!(params.authenticatedAt instanceof Date) || Number.isNaN(params.authenticatedAt.getTime()))
  ) {
    throw invalidAuthenticatedCredentialError("authenticatedAt", String(params.authenticatedAt));
  }

  return {
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    verifiedAt: params.verifiedAt,
    ...(params.authenticatedAt !== undefined ? { authenticatedAt: params.authenticatedAt } : {}),
    providerSignals: { ...(params.providerSignals ?? {}) },
  };
}
