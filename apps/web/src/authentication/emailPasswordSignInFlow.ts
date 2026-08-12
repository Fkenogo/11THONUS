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

type FirebaseUserResult = { user: { getIdToken: () => Promise<string> } };

export type EmailPasswordSignInDeps = AuthenticateDeps & {
  /** Registration seam — defaults to the real `createUserWithEmailAndPassword`. */
  register?: (auth: Auth, email: string, password: string) => Promise<FirebaseUserResult>;
  /** Sign-in seam — defaults to the real `signInWithEmailAndPassword`. */
  signIn?: (auth: Auth, email: string, password: string) => Promise<FirebaseUserResult>;
};

async function bridge(result: FirebaseUserResult, deps: AuthenticateDeps) {
  return authenticate({ getIdToken: () => result.user.getIdToken(), referenceType: "email" }, deps);
}

export async function registerWithEmailPassword(
  auth: Auth,
  email: string,
  password: string,
  deps: EmailPasswordSignInDeps,
): Promise<AuthenticateOutcome> {
  const register = deps.register ?? createUserWithEmailAndPassword;
  return bridge(await register(auth, email, password), deps);
}

export async function signInWithEmailPassword(
  auth: Auth,
  email: string,
  password: string,
  deps: EmailPasswordSignInDeps,
): Promise<AuthenticateOutcome> {
  const signIn = deps.signIn ?? signInWithEmailAndPassword;
  return bridge(await signIn(auth, email, password), deps);
}
