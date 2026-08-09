/**
 * Phone OTP sign-in flow (AUTH-04, AUTH-BP §3/§5/§6).
 *
 * Two provider-neutral steps over Firebase Phone Sign-In: (1) `startPhoneSignIn`
 * sends the OTP via `signInWithPhoneNumber` (reCAPTCHA/App-Check enforced by the
 * `ApplicationVerifier` the caller supplies — the merged `appCheck.ts` pattern),
 * and (2) `confirmPhoneSignIn` confirms the code, then hands the *verified*
 * Firebase user to the AUTH-03 `authenticate` orchestration as a `phone_otp`
 * credential. No OTP or token is stored or returned — the code is consumed by
 * `confirm`, and only the provider-neutral outcome flows out.
 *
 * The Firebase SDK calls are injected seams so the flow is unit-testable with no
 * live transport; the defaults are the real SDK functions.
 */

import {
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  type ApplicationVerifier,
  type Auth,
} from "firebase/auth";
import {
  authenticate,
  type AuthenticateDeps,
  type AuthenticateOutcome,
} from "./authenticateClient";

/** The subset of `ConfirmationResult` the flow needs (kept minimal for testability). */
export type PhoneConfirmation = {
  confirm: (code: string) => Promise<{ user: { getIdToken: () => Promise<string> } }>;
};

export type StartPhoneSignInDeps = {
  signInWithPhoneNumber?: (
    auth: Auth,
    phoneNumber: string,
    verifier: ApplicationVerifier,
  ) => Promise<PhoneConfirmation>;
};

export function startPhoneSignIn(
  auth: Auth,
  phoneNumber: string,
  verifier: ApplicationVerifier,
  deps: StartPhoneSignInDeps = {},
): Promise<PhoneConfirmation> {
  const send = deps.signInWithPhoneNumber ?? firebaseSignInWithPhoneNumber;
  return send(auth, phoneNumber, verifier);
}

export async function confirmPhoneSignIn(
  confirmation: PhoneConfirmation,
  code: string,
  deps: AuthenticateDeps,
): Promise<AuthenticateOutcome> {
  const credential = await confirmation.confirm(code);
  return authenticate(
    { getIdToken: () => credential.user.getIdToken(), referenceType: "phone_otp" },
    deps,
  );
}
