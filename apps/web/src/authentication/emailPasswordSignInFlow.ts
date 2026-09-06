/**
 * Email/Password sign-in flow (AUTH-04, AUTH-CORR-003).
 *
 * Two provider-neutral operations over Firebase Email/Password Authentication:
 * `registerWithEmailPassword` (`createUserWithEmailAndPassword`) and
 * `signInWithEmailPassword` (`signInWithEmailAndPassword`). Each runs the
 * Firebase call, then hands the *verified* Firebase user to the AUTH-03
 * `authenticate` orchestration as an `email` credential — identical bridge to
 * the Google/Phone flows, only the provider differs.
 *
 * The password is passed straight to Firebase Authentication and never stored,
 * logged, or returned by 11thONUS; no token is stored or returned either
 * (TRD10 §10.6.1). Firebase is the sole credential authority — there is no
 * custom password store. The Firebase SDK calls are injected seams so the flow
 * is unit-testable with no live transport; the defaults are the real SDK
 * functions.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type Auth,
} from "firebase/auth";
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

/** Email/Password first-factor result — either bridged, or a pending TOTP challenge. */
export type EmailPasswordSignInResult = AuthenticateOutcome | PendingMfaChallenge;

export type EmailPasswordSignInDeps = AuthenticateDeps & {
  /** Registration seam — defaults to the real `createUserWithEmailAndPassword`. */
  register?: (auth: Auth, email: string, password: string) => Promise<FirebaseUserResult>;
  /** Sign-in seam — defaults to the real `signInWithEmailAndPassword`. */
  signIn?: (auth: Auth, email: string, password: string) => Promise<FirebaseUserResult>;
  /** Challenge SDK seam (AUTH-MFA-003C) — defaults to the real SDK; injected only in tests. */
  challengeSdk?: MfaChallengeSdkDeps;
};

async function bridge(result: FirebaseUserResult, deps: AuthenticateDeps) {
  return authenticate({ getIdToken: () => result.user.getIdToken(), referenceType: "email" }, deps);
}

/**
 * Runs one Email/Password Firebase operation, then either bridges the verified
 * user to AUTH-03 (`email` reference type) or — when Firebase raises
 * `auth/multi-factor-auth-required` — returns a bounded TOTP challenge instead
 * (AUTH-MFA-003C). Any other error passes through unchanged, preserving the
 * pre-existing behaviour.
 */
async function runEmailFirstFactor(
  operation: () => Promise<FirebaseUserResult>,
  auth: Auth,
  deps: EmailPasswordSignInDeps,
): Promise<EmailPasswordSignInResult> {
  try {
    return await bridge(await operation(), deps);
  } catch (error) {
    if (isMfaRequiredError(error)) {
      return createPendingMfaChallenge({
        auth,
        error,
        referenceType: "email",
        deps,
        sdk: deps.challengeSdk,
      });
    }
    throw error;
  }
}

export async function registerWithEmailPassword(
  auth: Auth,
  email: string,
  password: string,
  deps: EmailPasswordSignInDeps,
): Promise<EmailPasswordSignInResult> {
  const register = deps.register ?? createUserWithEmailAndPassword;
  return runEmailFirstFactor(() => register(auth, email, password), auth, deps);
}

export async function signInWithEmailPassword(
  auth: Auth,
  email: string,
  password: string,
  deps: EmailPasswordSignInDeps,
): Promise<EmailPasswordSignInResult> {
  const signIn = deps.signIn ?? signInWithEmailAndPassword;
  return runEmailFirstFactor(() => signIn(auth, email, password), auth, deps);
}
