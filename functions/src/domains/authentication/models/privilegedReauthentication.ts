/**
 * Privileged re-authentication freshness policy (AUTH-07, per AUTH-BP §9 /
 * TRD12 §12.29).
 *
 * A privileged/sensitive action requires *recent* authentication — "a fresh
 * proof, not a new identity". This pure module decides freshness from the
 * credential's trusted, server-derived `authenticatedAt` (the Firebase
 * `auth_time`), compared against a **server-controlled** current instant.
 *
 * Security invariants (Founder-directed):
 *   - freshness is measured from `authenticatedAt`, **never** `verifiedAt`,
 *     token issue/verification time, or any client timestamp — a token refresh
 *     advances verification time but not the authentication instant;
 *   - the comparison instant `now` is always injected by the caller (the
 *     server), never taken from the request;
 *   - absent or anomalous authentication-time evidence fails **closed**
 *     (`AUTH_REQUIRED`, closed 14-category taxonomy — no new category);
 *   - the maximum age is configurable per TRD12 §12.29; the platform default is
 *     5 minutes (Founder decision) — a default, not a fixed architectural
 *     constant.
 *
 * Pure domain module — no Firebase import.
 */

import type { AuthenticatedCredential } from "./authenticatedCredential";
import {
  authenticationRequiredError,
  invalidAuthenticatedCredentialError,
} from "./authenticationErrors";

/**
 * Platform default maximum age for privileged-operation authentication
 * freshness: 5 minutes (Founder decision, 2026-08-10). Configurable per
 * TRD12 §12.29 — callers may inject a different window; this is only the
 * default.
 */
export const DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Assert the credential was authenticated recently enough for a privileged
 * action. Throws `AUTH_REQUIRED` (caller must re-authenticate) when the trusted
 * authentication instant is absent, anomalous (in the future relative to the
 * server clock), or older than `maxAgeMs`. Eligible iff `0 <= age <= maxAgeMs`.
 */
export function assertFreshAuthentication(
  credential: AuthenticatedCredential,
  now: Date,
  maxAgeMs: number = DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS,
): void {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw invalidAuthenticatedCredentialError("now", String(now));
  }

  const authenticatedAt = credential.authenticatedAt;
  // Missing trusted authentication-time evidence → fail closed. `verifiedAt`
  // is deliberately not consulted as a substitute.
  if (!(authenticatedAt instanceof Date) || Number.isNaN(authenticatedAt.getTime())) {
    throw authenticationRequiredError();
  }

  const ageMs = now.getTime() - authenticatedAt.getTime();
  // Future authentication time (ageMs < 0) is anomalous and not "recent";
  // an age beyond the window requires a fresh proof.
  if (ageMs < 0 || ageMs > maxAgeMs) {
    throw authenticationRequiredError();
  }
}
