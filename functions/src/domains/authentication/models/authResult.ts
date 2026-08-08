/**
 * Authentication resolution result (AUTH-01, per AUTH-BP §4/§5/§6).
 *
 * The *outcome* of resolving a verified credential against the merged
 * Customer Identity lookup: either it maps to an existing identity
 * (`resolved` → sign-in path) or it does not (`unregistered` → registration
 * path). This is a value contract only — the act of resolving (calling the
 * merged `identityLookupRepository`) is AUTH-02/AUTH-03, not this module.
 *
 * Pure domain module — no Firebase import; no orchestration.
 */

import type { AuthenticatedCredential } from "./authenticatedCredential";
import { invalidAuthenticatedCredentialError } from "./authenticationErrors";

export type ResolvedAuthResult = {
  readonly outcome: "resolved";
  readonly customerIdentityId: string;
  readonly credential: AuthenticatedCredential;
};

export type UnregisteredAuthResult = {
  readonly outcome: "unregistered";
  readonly credential: AuthenticatedCredential;
};

export type AuthResult = ResolvedAuthResult | UnregisteredAuthResult;

export function resolvedAuthResult(
  customerIdentityId: string,
  credential: AuthenticatedCredential,
): ResolvedAuthResult {
  if (typeof customerIdentityId !== "string" || customerIdentityId.trim().length === 0) {
    throw invalidAuthenticatedCredentialError("customerIdentityId", String(customerIdentityId));
  }
  return { outcome: "resolved", customerIdentityId, credential };
}

export function unregisteredAuthResult(
  credential: AuthenticatedCredential,
): UnregisteredAuthResult {
  return { outcome: "unregistered", credential };
}
