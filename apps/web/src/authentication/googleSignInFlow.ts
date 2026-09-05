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
import {
  createPendingMfaChallenge,
  isMfaRequiredError,
  type MfaChallengeSdkDeps,
  type PendingMfaChallenge,
} from "./mfa/mfaSdkChallenge";

type FirebaseUserResult = { user: { getIdToken: () => Promise<string> } };

/** Google first-factor result — either bridged, or a pending TOTP challenge. */
export type GoogleSignInResult = AuthenticateOutcome | PendingMfaChallenge;

export type GoogleSignInDeps = AuthenticateDeps & {
  signIn?: (auth: Auth) => Promise<FirebaseUserResult>;
  /** Challenge SDK seam (AUTH-MFA-003C) — defaults to the real SDK; injected only in tests. */
  challengeSdk?: MfaChallengeSdkDeps;
};

export async function signInWithGoogle(
  auth: Auth,
  deps: GoogleSignInDeps,
): Promise<GoogleSignInResult> {
  const signIn = deps.signIn ?? ((a: Auth) => signInWithPopup(a, new GoogleAuthProvider()));
  try {
    const credential = await signIn(auth);
    return authenticate(
      { getIdToken: () => credential.user.getIdToken(), referenceType: "google_sign_in" },
      deps,
    );
  } catch (error) {
    // A federated first-factor sign-in raises `auth/multi-factor-auth-required`
    // through the popup for an MFA-enrolled user: surface a bounded TOTP
    // challenge instead of an error (AUTH-MFA-003C).
    if (isMfaRequiredError(error)) {
      return createPendingMfaChallenge({
        auth,
        error,
        referenceType: "google_sign_in",
        deps,
        sdk: deps.challengeSdk,
      });
    }
    throw error;
  }
}
