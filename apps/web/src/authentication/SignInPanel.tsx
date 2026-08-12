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
import { useTranslation } from "react-i18next";
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

export function SignInPanel({
  actions,
  onSignedIn,
}: {
  actions: SignInPanelActions;
  onSignedIn?: (outcome: AuthenticateOutcome) => void;
}) {
  const { t } = useTranslation("auth");
  const phoneInputId = useId();
  const codeInputId = useId();

  // Store the stable error *code*, not a translated string, so a runtime
  // language switch re-translates any visible alert (never leaks a server
  // message — one message per code, resolved at render time).
  function codeFor(error: unknown): AuthenticateErrorCode {
    return error instanceof AuthenticateError ? error.code : "failed";
  }

  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<PhoneConfirmation | null>(null);
  const [outcome, setOutcome] = useState<AuthenticateOutcome | null>(null);
  const [errorCode, setErrorCode] = useState<AuthenticateErrorCode | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneEnabled = actions.enabledProviders.has("phone_otp");
  const googleEnabled = actions.enabledProviders.has("google_sign_in");

  // A confirmation is bound to the exact number it was sent for. If the number
  // is edited after the code was sent, invalidate the pending confirmation (and
  // any typed code) so the verify step can never authenticate the old number
  // while the panel displays a new one (wrong-identity guard, esp. SMS autofill).
  function handlePhoneNumberChange(next: string) {
    setPhoneNumber(next);
    if (confirmation) {
      setConfirmation(null);
      setCode("");
      setErrorCode(null);
    }
  }

  async function run(op: () => Promise<AuthenticateOutcome | PhoneConfirmation | void>) {
    if (busy) return;
    setBusy(true);
    setErrorCode(null);
    try {
      return await op();
    } catch (error) {
      setErrorCode(codeFor(error));
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
      <section aria-label={t("signIn.ariaLabel")}>
        <p role="status">{t("signIn.unavailable")}</p>
      </section>
    );
  }

  return (
    <section aria-label={t("signIn.ariaLabel")} className="flex flex-col gap-4">
      {outcome && <p role="status">{t("signIn.signedIn", { mode: outcome.mode })}</p>}
      {errorCode && <p role="alert">{t(`errors.${errorCode}`)}</p>}

      {googleEnabled && (
        <button type="button" onClick={handleGoogle} disabled={busy}>
          {t("signIn.continueWithGoogle")}
        </button>
      )}

      {phoneEnabled && (
        <div className="flex flex-col gap-2">
          <label htmlFor={phoneInputId}>{t("signIn.phoneLabel")}</label>
          <input
            id={phoneInputId}
            type="tel"
            autoComplete="off"
            value={phoneNumber}
            onChange={(e) => handlePhoneNumberChange(e.target.value)}
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={busy || phoneNumber.trim() === ""}
          >
            {t("signIn.sendCode")}
          </button>

          {confirmation && (
            <div className="flex flex-col gap-2">
              <label htmlFor={codeInputId}>{t("signIn.verificationCode")}</label>
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
                {t("signIn.verifyCode")}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
