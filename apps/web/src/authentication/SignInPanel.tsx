/**
 * Customer-facing sign-in surface (AUTH-04, AUTH-BP §3/§5/§6).
 *
 * Renders only the providers that are explicitly enabled (disabled-by-default,
 * `providerConfig`), drives the Google popup and the two-step Phone OTP flow,
 * and reports the resolved outcome or a stable, enumeration-resistant error
 * message. Every provider/backend interaction is an **injected action** — the
 * component imports no `firebase/*` transport, so it is tested with a
 * network-safety harness (fakes, no live transport). No credential material is
 * rendered: the OTP input is a cleared password field and no token is displayed.
 *
 * Session management, protected-action gating, and sign-out are AUTH-07;
 * account linking is AUTH-05; recovery is AUTH-06 — deliberately not here.
 */

import { useId, useState } from "react";
import type { AuthProviderId } from "./providerConfig";
import {
  AuthenticateError,
  type AuthenticateErrorCode,
  type AuthenticateOutcome,
} from "./authenticateClient";
import type { PhoneConfirmation } from "./phoneSignInFlow";

export type SignInPanelActions = {
  enabledProviders: ReadonlySet<AuthProviderId>;
  signInWithGoogle: () => Promise<AuthenticateOutcome>;
  sendPhoneCode: (phoneNumber: string) => Promise<PhoneConfirmation>;
  confirmPhoneCode: (confirmation: PhoneConfirmation, code: string) => Promise<AuthenticateOutcome>;
};

/** Stable, non-leaking client messages — one per code, never a server string. */
const ERROR_MESSAGE: Record<AuthenticateErrorCode, string> = {
  auth_required: "We couldn't verify your sign-in. Please try again.",
  auth_forbidden: "This account can't sign in right now. Please contact support.",
  not_found: "We couldn't complete sign-in. Please try again.",
  validation_failed: "Something about that request was invalid. Please try again.",
  conflict: "That sign-in is already being processed. Please wait a moment and retry.",
  unavailable: "Sign-in is temporarily unavailable. Please try again shortly.",
  failed: "Sign-in didn't work. Please try again.",
};

function messageFor(error: unknown): string {
  if (error instanceof AuthenticateError) return ERROR_MESSAGE[error.code];
  return ERROR_MESSAGE.failed;
}

export function SignInPanel({
  actions,
  onSignedIn,
}: {
  actions: SignInPanelActions;
  onSignedIn?: (outcome: AuthenticateOutcome) => void;
}) {
  const phoneInputId = useId();
  const codeInputId = useId();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<PhoneConfirmation | null>(null);
  const [outcome, setOutcome] = useState<AuthenticateOutcome | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneEnabled = actions.enabledProviders.has("phone_otp");
  const googleEnabled = actions.enabledProviders.has("google_sign_in");

  async function run(op: () => Promise<AuthenticateOutcome | PhoneConfirmation | void>) {
    if (busy) return;
    setBusy(true);
    setErrorText(null);
    try {
      return await op();
    } catch (error) {
      setErrorText(messageFor(error));
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await run(() => actions.signInWithGoogle());
    if (result) {
      setOutcome(result as AuthenticateOutcome);
      onSignedIn?.(result as AuthenticateOutcome);
    }
  }

  async function handleSendCode() {
    const result = await run(() => actions.sendPhoneCode(phoneNumber));
    if (result) setConfirmation(result as PhoneConfirmation);
  }

  async function handleVerifyCode() {
    if (!confirmation) return;
    const result = await run(() => actions.confirmPhoneCode(confirmation, code));
    // Clear the OTP unconditionally so it never lingers in the DOM/state.
    setCode("");
    if (result) {
      setConfirmation(null);
      setOutcome(result as AuthenticateOutcome);
      onSignedIn?.(result as AuthenticateOutcome);
    }
  }

  if (!phoneEnabled && !googleEnabled) {
    return (
      <section aria-label="Sign in">
        <p role="status">Sign-in is currently unavailable.</p>
      </section>
    );
  }

  return (
    <section aria-label="Sign in" className="flex flex-col gap-4">
      {outcome && <p role="status">Signed in ({outcome.mode}).</p>}
      {errorText && <p role="alert">{errorText}</p>}

      {googleEnabled && (
        <button type="button" onClick={handleGoogle} disabled={busy}>
          Continue with Google
        </button>
      )}

      {phoneEnabled && (
        <div className="flex flex-col gap-2">
          <label htmlFor={phoneInputId}>Phone number (E.164, e.g. +257…)</label>
          <input
            id={phoneInputId}
            type="tel"
            autoComplete="off"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={busy || phoneNumber.trim() === ""}
          >
            Send code
          </button>

          {confirmation && (
            <div className="flex flex-col gap-2">
              <label htmlFor={codeInputId}>Verification code</label>
              <input
                id={codeInputId}
                type="password"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={busy || code.trim() === ""}
              >
                Verify code
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
