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

import { useId, useRef, useState } from "react";
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
  registerWithEmail: (email: string, password: string) => Promise<AuthenticateOutcome>;
  signInWithEmail: (email: string, password: string) => Promise<AuthenticateOutcome>;
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
  const emailInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();
  const mismatchErrorId = useId();
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

  // Store the stable error *code*, not a translated string, so a runtime
  // language switch re-translates any visible alert (never leaks a server
  // message — one message per code, resolved at render time).
  function codeFor(error: unknown): AuthenticateErrorCode {
    return error instanceof AuthenticateError ? error.code : "failed";
  }

  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<PhoneConfirmation | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Register mode only; frontend validation value — never sent to Firebase/authenticate,
  // never persisted/logged/returned, never enters a domain object or event.
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailMode, setEmailMode] = useState<"signin" | "register">("signin");
  // Client-side validation error, kept separate from the server `errorCode` so the
  // two never collide and each clears independently.
  const [localError, setLocalError] = useState<"passwordMismatch" | null>(null);
  const [outcome, setOutcome] = useState<AuthenticateOutcome | null>(null);
  const [errorCode, setErrorCode] = useState<AuthenticateErrorCode | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneEnabled = actions.enabledProviders.has("phone_otp");
  const googleEnabled = actions.enabledProviders.has("google_sign_in");
  const emailEnabled = actions.enabledProviders.has("email");

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

  // Register (new) and sign-in (returning) are distinct Firebase operations;
  // password and confirm-password are cleared unconditionally after either so
  // neither lingers in state/DOM (mirrors the OTP-clearing guard). Firebase is
  // the sole credential authority — 11thONUS stores/logs/returns no password.
  async function runEmail(op: (email: string, password: string) => Promise<AuthenticateOutcome>) {
    const result = await run(() => op(email, password));
    setPassword("");
    setConfirmPassword("");
    if (result) {
      setOutcome(result as AuthenticateOutcome);
      onSignedIn?.(result as AuthenticateOutcome);
    }
  }

  // Create Account: frontend-only confirm-password validation before any Firebase
  // call. On mismatch, fail closed (no Firebase), surface a localized accessible
  // error, and focus the confirm field. Only `email`+`password` reach
  // `registerWithEmail` — the confirm value is never passed on.
  async function handleCreateAccount() {
    if (password !== confirmPassword) {
      setLocalError("passwordMismatch");
      confirmPasswordRef.current?.focus();
      return;
    }
    setLocalError(null);
    await runEmail(actions.registerWithEmail);
  }

  // Switching Email modes is a pure UI transition: never invokes Firebase; clears
  // both credential values and any stale validation/server errors; preserves the
  // (non-sensitive) email so a customer who mistyped a mode keeps their address.
  function switchEmailMode(next: "signin" | "register") {
    setEmailMode(next);
    setPassword("");
    setConfirmPassword("");
    setLocalError(null);
    setErrorCode(null);
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

  if (!phoneEnabled && !googleEnabled && !emailEnabled) {
    return (
      <section aria-label={t("signIn.ariaLabel")}>
        <p role="status">{t("signIn.unavailable")}</p>
      </section>
    );
  }

  const registerMode = emailMode === "register";
  const emailFilled = email.trim() !== "";
  const signInReady = emailFilled && password !== "";
  const registerReady = emailFilled && password !== "" && confirmPassword !== "";

  return (
    <section aria-label={t("signIn.ariaLabel")} className="flex flex-col gap-4">
      {outcome && <p role="status">{t("signIn.signedIn", { mode: outcome.mode })}</p>}
      {errorCode && <p role="alert">{t(`errors.${errorCode}`)}</p>}

      {googleEnabled && (
        <button type="button" onClick={handleGoogle} disabled={busy}>
          {t("signIn.continueWithGoogle")}
        </button>
      )}

      {emailEnabled && (
        <div className="flex flex-col gap-2">
          <label htmlFor={emailInputId}>{t("signIn.emailLabel")}</label>
          <input
            id={emailInputId}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor={passwordInputId}>{t("signIn.passwordLabel")}</label>
          <input
            id={passwordInputId}
            type="password"
            autoComplete={registerMode ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              // A mismatch can be corrected from either field — clear the stale
              // validation state when the primary password changes too.
              if (localError) setLocalError(null);
            }}
          />

          {registerMode ? (
            <>
              <label htmlFor={confirmPasswordInputId}>{t("signIn.confirmPasswordLabel")}</label>
              <input
                id={confirmPasswordInputId}
                ref={confirmPasswordRef}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (localError) setLocalError(null);
                }}
                aria-invalid={localError === "passwordMismatch"}
                aria-describedby={localError === "passwordMismatch" ? mismatchErrorId : undefined}
              />
              {localError === "passwordMismatch" && (
                <p id={mismatchErrorId} role="alert">
                  {t("signIn.passwordMismatch")}
                </p>
              )}
              <button type="button" onClick={handleCreateAccount} disabled={busy || !registerReady}>
                {t("signIn.createAccount")}
              </button>
              <button type="button" onClick={() => switchEmailMode("signin")} disabled={busy}>
                {t("signIn.switchToSignIn")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => runEmail(actions.signInWithEmail)}
                disabled={busy || !signInReady}
              >
                {t("signIn.emailSignIn")}
              </button>
              <button type="button" onClick={() => switchEmailMode("register")} disabled={busy}>
                {t("signIn.switchToRegister")}
              </button>
            </>
          )}
        </div>
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
