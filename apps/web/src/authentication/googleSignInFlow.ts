/**
 * Google sign-in flow (AUTH-04, AUTH-BP §3/§5/§6).
 *
 * Runs the Firebase Google provider popup, then hands the *verified* Firebase
 * user to the AUTH-03 `authenticate` orchestration as a `google_sign_in`
 * credential. Provider-neutral by construction — identical bridge to the phone
 * flow, only the provider differs. No token is stored or returned.
 *
 * The popup call is an injected seam (unit-testable without live transport); the
 * default is the real `signInWithPopup(auth, new GoogleAuthProvider())`.
 */

import { GoogleAuthProvider, signInWithPopup, type Auth } from "firebase/auth";
import {
  authenticate,
  type AuthenticateDeps,
  type AuthenticateOutcome,
} from "./authenticateClient";

export type GoogleSignInDeps = AuthenticateDeps & {
  signIn?: (auth: Auth) => Promise<{ user: { getIdToken: () => Promise<string> } }>;
};

export async function signInWithGoogle(
  auth: Auth,
  deps: GoogleSignInDeps,
): Promise<AuthenticateOutcome> {
  const signIn = deps.signIn ?? ((a: Auth) => signInWithPopup(a, new GoogleAuthProvider()));
  const credential = await signIn(auth);
  return authenticate(
    { getIdToken: () => credential.user.getIdToken(), referenceType: "google_sign_in" },
    deps,
  );
}
