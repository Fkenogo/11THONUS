/**
 * Sign-out flow (AUTH-07, per AUTH-BP §9).
 *
 * Clears the *client* session. Firebase Auth is the token authority and the
 * server holds no long-lived session state to revoke beyond Firebase's own
 * (TRD10 §10.6.1), so sign-out is a client-session clear via Firebase `signOut`
 * — there is no bespoke backend session store to invalidate.
 *
 * The `signOut` call is an injected seam (unit-testable without live transport);
 * the default is the real `firebase/auth` `signOut`. No credential material is
 * read, stored, or logged.
 */

import { signOut, type Auth } from "firebase/auth";

export type SignOutDeps = {
  signOut?: (auth: Auth) => Promise<void>;
};

export async function signOutCurrentSession(auth: Auth, deps: SignOutDeps = {}): Promise<void> {
  const doSignOut = deps.signOut ?? signOut;
  await doSignOut(auth);
}
