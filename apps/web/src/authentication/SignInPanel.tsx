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

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { AuthProviderId } from "./providerConfig";
import {
  AuthenticateError,
  type AuthenticateErrorCode,
  type AuthenticateOutcome,
} from "./authenticateClient";
import type { PhoneConfirmation } from "./phoneSignInFlow";
import {
  classifyMfaChallengeError,
  isPendingMfaChallenge,
  MFA_CHALLENGE_CODE_LENGTH,
  MfaChallengeUnavailableError,
  type MfaChallengeErrorCategory,
  type PendingMfaChallenge,
} from "./mfa/mfaSdkChallenge";

export type SignInPanelActions = {
  enabledProviders: ReadonlySet<AuthProviderId>;
  signInWithGoogle: () => Promise<AuthenticateOutcome | PendingMfaChallenge>;
  registerWithEmail: (
    email: string,
    password: string,
  ) => Promise<AuthenticateOutcome | PendingMfaChallenge>;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<AuthenticateOutcome | PendingMfaChallenge>;
  sendPhoneCode: (phoneNumber: string) => Promise<PhoneConfirmation>;
  confirmPhoneCode: (confirmation: PhoneConfirmation, code: string) => Promise<AuthenticateOutcome>;
};

function codeFor(error: unknown): AuthenticateErrorCode {
  if (error instanceof MfaChallengeUnavailableError) return "auth_forbidden";
  return error instanceof AuthenticateError ? error.code : "failed";
}

export function SignInPanel({
  actions,
  onSignedIn,
}: {
  actions: SignInPanelActions;
  onSignedIn?: (outcome: AuthenticateOutcome) => void;
}) {
  const { t } = useTranslation("auth");
  const { t: tmfa } = useTranslation("mfa");
  const phoneInputId = useId();
  const codeInputId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();
  const mismatchErrorId = useId();
  const mfaChallengeCodeInputId = useId();
  const mfaChallengeErrorId = useId();
  const confirmPasswordRef = useRef<HTMLInputElement | null>(null);

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
  // AUTH-MFA-003C: transient, in-memory TOTP challenge state. The resolver and
  // code live only here, cleared on success/cancel/error/unmount — never in web
  // storage, URLs, or any report.
  const [challenge, setChallenge] = useState<PendingMfaChallenge | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [challengeError, setChallengeError] = useState<MfaChallengeErrorCategory | null>(null);

  // A challenge is bound to one pending sign-in; drop the resolver reference
  // when it is replaced or the panel unmounts (never silently reused).
  useEffect(() => {
    return () =>
      setChallenge((current) => {
        current?.clear();
        return null;
      });
  }, []);

  function clearChallenge() {
    setChallenge((current) => {
      current?.clear();
      return null;
    });
    setMfaCode("");
    setChallengeError(null);
    setErrorCode(null);
  }

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

  async function run(
    op: () => Promise<AuthenticateOutcome | PhoneConfirmation | PendingMfaChallenge | void>,
  ) {
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

  // A first-factor flow that raises MFA-required returns a bounded TOTP
  // challenge: hold it transiently and render the second-factor step. Any
  // other result is the resolved outcome as before.
  function handleResult(
    result: AuthenticateOutcome | PhoneConfirmation | PendingMfaChallenge | void,
  ) {
    if (!result) return;
    if (isPendingMfaChallenge(result)) {
      setChallenge(result);
      return;
    }
    // Phone confirmations never reach this path (phone has its own handlers);
    // the guard narrows the union for the outcome branch.
    if ("confirm" in result) return;
    setOutcome(result);
    onSignedIn?.(result);
  }

  async function handleGoogle() {
    handleResult(await run(() => actions.signInWithGoogle()));
  }

  // Register (new) and sign-in (returning) are distinct Firebase operations;
  // password and confirm-password are cleared unconditionally after either so
  // neither lingers in state/DOM (mirrors the OTP-clearing guard). Firebase is
  // the sole credential authority — 11thONUS stores/logs/returns no password.
  async function runEmail(
    op: (email: string, password: string) => Promise<AuthenticateOutcome | PendingMfaChallenge>,
  ) {
    handleResult(await run(() => op(email, password)));
    setPassword("");
    setConfirmPassword("");
  }

  // Create Account: frontend-only confirm-password validation before any Firebase
  // call. On mismatch, fail closed (no Firebase), surface a localized accessible
  // error, and focus the confirm field. Only `email`+`password` reach
  // `registerWithEmail` — the confirm value is never passed on.
  async function handleCreateAccount() {
    // Start a fresh attempt: drop any prior server error so it can never be
    // announced alongside a new client-side mismatch (only `run()` clears it,
    // and the mismatch path below returns before reaching `run()`).
    setErrorCode(null);
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

  async function handleResolveChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge || busy) return;
    setBusy(true);
    setChallengeError(null);
    try {
      const outcome = await challenge.submit(mfaCode);
      clearChallenge();
      setOutcome(outcome);
      onSignedIn?.(outcome);
    } catch (error) {
      // The code is cleared after every submission regardless of outcome so it
      // never lingers in state/DOM.
      setMfaCode("");
      if (classifyMfaChallengeError(error) === "invalid-code") {
        // Rejected code: resolver is retained for an immediate retry with a
        // fresh code; a localized inline error is shown (never a raw message).
        setChallengeError("invalid-code");
      } else {
        // Terminal (session expired / not found / other): drop the resolver and
        // return to the first-factor surface with a generic error.
        clearChallenge();
        setErrorCode(codeFor(error));
      }
    } finally {
      setBusy(false);
    }
  }

  if (!phoneEnabled && !googleEnabled && !emailEnabled) {
    return (
      <section aria-label={t("signIn.ariaLabel")}>
        <p role="status">{t("signIn.unavailable")}</p>
      </section>
    );
  }

  // AUTH-MFA-003C: while a TOTP second-factor challenge is pending, render only
  // the challenge step (no parallel sign-in surface). The resolver lives solely
  // in this component's transient state.
  if (challenge) {
    const digits = mfaCode.replace(/\D/g, "").slice(0, MFA_CHALLENGE_CODE_LENGTH);
    const canResolve = digits.length === MFA_CHALLENGE_CODE_LENGTH && !busy;
    const errorMessage =
      challengeError === "invalid-code"
        ? tmfa("challenge.errorInvalid")
        : tmfa("challenge.errorGeneric");
    return (
      <section aria-label={t("signIn.ariaLabel")} className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold">{tmfa("challenge.title")}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{tmfa("challenge.body")}</p>
        <form className="flex flex-col gap-3" onSubmit={handleResolveChallenge}>
          <div>
            <label htmlFor={mfaChallengeCodeInputId} className="mb-1 block text-sm font-medium">
              {tmfa("challenge.codeLabel")}
            </label>
            <input
              id={mfaChallengeCodeInputId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={digits}
              onChange={(event) => {
                setChallengeError(null);
                setMfaCode(
                  event.target.value.replace(/\D/g, "").slice(0, MFA_CHALLENGE_CODE_LENGTH),
                );
              }}
              aria-invalid={challengeError ? true : undefined}
              aria-describedby={challengeError ? mfaChallengeErrorId : undefined}
              className="min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50"
              disabled={busy}
            />
            {challengeError && (
              <p id={mfaChallengeErrorId} role="alert" className="mt-2 text-sm text-red-600">
                {errorMessage}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={!canResolve} className="min-h-11">
              {busy ? tmfa("challenge.verifying") : tmfa("challenge.confirm")}
            </button>
            <button type="button" onClick={clearChallenge} disabled={busy} className="min-h-11">
              {tmfa("challenge.cancel")}
            </button>
          </div>
        </form>
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
