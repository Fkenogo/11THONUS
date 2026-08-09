/**
 * Production composition for the sign-in surface (AUTH-04).
 *
 * Builds the `SignInPanel` actions from a `FirebasePlatform`: the
 * disabled-by-default enabled-provider set (`providerConfig`), the Google popup
 * flow, and the two-step Phone OTP flow — all sharing one callable adapter bound
 * to `platform.functions`. The reCAPTCHA `ApplicationVerifier` is supplied by the
 * page (which owns its DOM lifecycle, per the merged `phoneAuthHarness`
 * precedent), so this module stays free of DOM concerns.
 *
 * The flow functions are injected seams (defaults = the real flows) so the
 * wiring is unit-testable with no live transport.
 */

import type { ApplicationVerifier, Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { makeCallAuthenticate } from "./authenticateCallable";
import type { CallAuthenticate } from "./authenticateClient";
import { signInWithGoogle } from "./googleSignInFlow";
import { confirmPhoneSignIn, startPhoneSignIn } from "./phoneSignInFlow";
import { resolveEnabledAuthProviders } from "./providerConfig";
import type { SignInPanelActions } from "./SignInPanel";

export type CreateSignInActionsDeps = {
  flagSource: Record<string, string | undefined>;
  /** Page-owned reCAPTCHA verifier factory (fresh per send attempt). */
  getRecaptchaVerifier: () => ApplicationVerifier;
  /** Callable seam — defaults to the real adapter bound to `platform.functions`. */
  callAuthenticate?: CallAuthenticate;
  /** Flow seams (defaults = real flows) — injected only in tests. */
  runGoogle?: typeof signInWithGoogle;
  runStartPhone?: typeof startPhoneSignIn;
  runConfirmPhone?: typeof confirmPhoneSignIn;
};

export function createSignInActions(
  platform: { auth: Auth; functions: Functions },
  deps: CreateSignInActionsDeps,
): SignInPanelActions {
  const callAuthenticate = deps.callAuthenticate ?? makeCallAuthenticate(platform.functions);
  const runGoogle = deps.runGoogle ?? signInWithGoogle;
  const runStartPhone = deps.runStartPhone ?? startPhoneSignIn;
  const runConfirmPhone = deps.runConfirmPhone ?? confirmPhoneSignIn;

  return {
    enabledProviders: resolveEnabledAuthProviders(deps.flagSource),
    signInWithGoogle: () => runGoogle(platform.auth, { callAuthenticate }),
    sendPhoneCode: (phoneNumber) =>
      runStartPhone(platform.auth, phoneNumber, deps.getRecaptchaVerifier()),
    confirmPhoneCode: (confirmation, code) =>
      runConfirmPhone(confirmation, code, { callAuthenticate }),
  };
}
