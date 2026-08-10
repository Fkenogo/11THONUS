/**
 * Privileged re-authentication client flow (AUTH-07, per AUTH-BP §9 / TRD12
 * §12.29).
 *
 * Before a privileged/sensitive action, the user must supply a **fresh proof**
 * ("a fresh proof, not a new identity"). This helper runs a provider
 * re-authentication (which advances the Firebase user's `auth_time`) and then
 * returns a **force-refreshed** ID token so the token carries the new
 * `auth_time` — the freshness signal the backend privileged gate
 * (`authorizePrivilegedAction`) enforces server-side. The client cannot vouch
 * for its own freshness; it only obtains a token the server can trust.
 *
 * The `reauthenticate` call is an injected, provider-specific seam
 * (`reauthenticateWithPopup` for Google, the phone re-auth credential for Phone
 * OTP) — unit-testable without live transport. No token is stored or logged; the
 * fresh raw token is returned once for the immediate privileged call.
 */

import type { Auth } from "firebase/auth";

export type ReauthenticatedUser = {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

export type PrivilegedReauthDeps = {
  /**
   * Provider-specific re-authentication of the current user. Advances the
   * Firebase user's `auth_time`; must resolve to the re-authenticated user.
   */
  reauthenticate: (auth: Auth) => Promise<{ user: ReauthenticatedUser }>;
};

/**
 * Re-authenticate the current user and return a fresh ID token whose `auth_time`
 * reflects the re-authentication. The token is force-refreshed so the backend
 * freshness gate sees the updated authentication instant rather than a cached
 * token.
 */
export async function reauthenticateForPrivilegedAction(
  auth: Auth,
  deps: PrivilegedReauthDeps,
): Promise<string> {
  const { user } = await deps.reauthenticate(auth);
  return user.getIdToken(true);
}
