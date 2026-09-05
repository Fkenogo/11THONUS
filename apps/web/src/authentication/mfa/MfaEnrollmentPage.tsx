/**
 * `AUTH-MFA-003B` — the client-side TOTP enrollment experience for Platform
 * Administrators (per `AUTH-MFA-002` §8.1 steps 4a–4g).
 *
 * A self-contained screen, like `DisplayNameProfile`: it takes only the
 * Firebase platform handles, resolves its own session, and derives its own
 * routing through the trusted `discoverPlatformAdministrator` callable
 * (`AUTH-MFA-003A1`) — it never reads the `platformAdministrators` collection,
 * never self-asserts administrator status, and never accepts a target user id.
 * A non-administrator caller is shown a bounded access-restricted state, not
 * a fabricated enrollment surface.
 *
 * Security invariants honoured here:
 * - Enrollment never establishes MFA-authenticated authorization. Nothing on
 *   this page sets or claims `mfaSatisfied`/`mfaVerified`/`isMfaAuthenticated`
 *   in any client-visible or persisted form, and this page calls no authorized
 *   command — discovery is routing-only.
 * - The TOTP secret/QR material is in-memory only: held transiently in
 *   component state while the user is on the setup/verify steps, dropped on
 *   success, cancel, terminal error, or unmount. It is never written to
 *   localStorage/sessionStorage/IndexedDB, URLs, route state, logs, analytics,
 *   or any report.
 * - Verified email is a Firebase prerequisite for enrollment. A caller whose
 *   email is unverified — or whose enrollment attempt is rejected with
 *   `auth/unverified-email` — is shown a bounded blocked state; nothing is
 *   fabricated.
 * - A caller who already has a `totp` factor is shown a bounded
 *   already-enrolled state; this page never re-enrolls, removes, or replaces
 *   factors (removal/replacement is `AUTH-MFA-003D`).
 * - On success the user is signed out (`AUTH-MFA-002` §8.1 step 5): the next
 *   sign-in will be challenged. The actual challenge UI is `AUTH-MFA-003C` and
 *   is deliberately not implemented here.
 *
 * Every start/completion operation goes through `createMfaEnrollmentFlow`,
 * which isolates all Firebase Auth SDK calls behind an injectable seam so the
 * page and flow are testable without the Firebase Auth Emulator (which cannot
 * execute TOTP enrollment).
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { LanguageSwitcher, useTranslation } from "../../i18n";
import { Button, FieldError } from "../../components/ui/formPrimitives";
import { signOutCurrentSession } from "../signOutFlow";
import { useMfaSession } from "./hooks/useMfaSession";
import { usePlatformAdministratorDiscoveryQuery } from "./hooks/usePlatformAdministratorDiscoveryQuery";
import {
  classifyMfaEnrollmentError,
  createMfaEnrollmentFlow,
  type EnrollmentPreview,
  type MfaEnrollmentFlow,
} from "./mfaSdkFlow";
import { TotpQr } from "./TotpQr";

export type MfaEnrollmentPageProps = { auth: Auth; functions: Functions };

type EnrollmentStep = "intro" | "setup" | "verify" | "completion" | "unverified-email";
type VerifyError = "invalid" | "generic" | null;

export function MfaEnrollmentPage({ auth, functions }: MfaEnrollmentPageProps) {
  const { t } = useTranslation("mfa");
  const session = useMfaSession(auth);
  const discovery = usePlatformAdministratorDiscoveryQuery({ auth, functions });
  const flow: MfaEnrollmentFlow = useMemo(() => createMfaEnrollmentFlow(), []);

  const [step, setStep] = useState<EnrollmentStep>("intro");
  const [preview, setPreview] = useState<EnrollmentPreview | null>(null);
  const [otp, setOtp] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [verifyError, setVerifyError] = useState<VerifyError>(null);
  const [startError, setStartError] = useState(false);
  const [signOutError, setSignOutError] = useState(false);

  function cancelEnrollment() {
    setPreview(null);
    setOtp("");
    setVerifyError(null);
    setStartError(false);
    setStep("intro");
  }

  async function beginSetup() {
    if (session.status !== "ready") return;
    setStartError(false);
    try {
      const next = await flow.startEnrollment(session.user);
      setPreview(next);
      setStep("setup");
    } catch {
      setStartError(true);
    }
  }

  async function confirmEnrollment(event: FormEvent) {
    event.preventDefault();
    if (
      session.status !== "ready" ||
      !preview ||
      otp.trim().length !== preview.codeLength ||
      confirming
    ) {
      return;
    }
    setConfirming(true);
    setVerifyError(null);
    try {
      await flow.completeEnrollment(session.user, preview.secret, otp.trim());
      setPreview(null);
      setOtp("");
      setStep("completion");
    } catch (error) {
      switch (classifyMfaEnrollmentError(error)) {
        case "unverified-email":
          setPreview(null);
          setOtp("");
          setStep("unverified-email");
          break;
        case "invalid-code":
          setVerifyError("invalid");
          break;
        case "other":
        default:
          setPreview(null);
          setOtp("");
          setSignOutError(false);
          setStartError(true);
          setStep("intro");
          break;
      }
    } finally {
      setConfirming(false);
    }
  }

  async function handleSignOut() {
    setSignOutError(false);
    try {
      await signOutCurrentSession(auth);
    } catch {
      setSignOutError(true);
    }
  }

  useEffect(() => {
    if (step !== "completion") return;
    let cancelled = false;
    void (async () => {
      setSignOutError(false);
      try {
        await signOutCurrentSession(auth);
      } catch {
        if (!cancelled) setSignOutError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, auth]);

  if (session.status === "loading") {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <p>{t("page.loading")}</p>
      </section>
    );
  }

  if (session.status === "unauthenticated") {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <p>{t("page.signInRequired")}</p>
      </section>
    );
  }

  if (session.status === "error") {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("page.title")}</h1>
        <p role="alert" className="mt-2 text-sm text-red-600">
          {t("page.unresolvedAuthReference")}
        </p>
      </section>
    );
  }

  if (discovery.status === "pending") {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <p>{t("page.loading")}</p>
      </section>
    );
  }

  if (discovery.status === "error") {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("page.title")}</h1>
        <p role="alert" className="mt-2 text-sm text-red-600">
          {t("page.failed")}
        </p>
        <Button type="button" onClick={() => discovery.refetch()} className="mt-3">
          {t("page.retry")}
        </Button>
      </section>
    );
  }

  if (!discovery.data.isPlatformAdministrator) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("access.deniedTitle")}</h1>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          {t("access.deniedBody")}
        </p>
      </section>
    );
  }

  if (step === "completion") {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("completion.title")}</h1>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{t("completion.body")}</p>
        {signOutError && (
          <>
            <p role="alert" className="mt-2 text-sm text-red-600">
              {t("completion.signOutFailed")}
            </p>
            <Button type="button" onClick={handleSignOut} className="min-h-11">
              {t("completion.signOutRetry")}
            </Button>
          </>
        )}
      </section>
    );
  }

  if (step === "unverified-email") {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("access.unverifiedEmailTitle")}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("access.unverifiedEmailBody")}
        </p>
      </section>
    );
  }

  if (!session.user.emailVerified) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("access.unverifiedEmailTitle")}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("access.unverifiedEmailBody")}
        </p>
      </section>
    );
  }

  if (flow.hasEnrolledTotpFactor(session.user)) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("access.alreadyEnrolledTitle")}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {t("access.alreadyEnrolledBody")}
        </p>
      </section>
    );
  }

  if (step === "setup" && preview) {
    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("setup.title")}</h1>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{t("setup.body")}</p>
        <div className="mb-4 rounded-md border border-[var(--color-border)] p-4">
          <TotpQr value={preview.qrCodeUrl} label={t("setup.qrLabel")} />
          <p className="mb-1 mt-4 text-sm font-medium">{t("setup.manualKeyLabel")}</p>
          <code className="break-all rounded bg-[var(--color-muted)] px-2 py-1 text-sm">
            {preview.secretKey}
          </code>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {t("setup.manualKeyHint")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {t("setup.codeLengthLabel")}:{" "}
            {t("setup.codeLengthValue", {
              length: preview.codeLength,
              interval: preview.codeIntervalSeconds,
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={cancelEnrollment} className="min-h-11">
            {t("setup.cancel")}
          </Button>
          <Button type="button" onClick={() => setStep("verify")} className="min-h-11">
            {t("setup.continue")}
          </Button>
        </div>
      </section>
    );
  }

  if (step === "verify" && preview) {
    const codeLength = preview.codeLength;
    const digits = otp.replace(/\D/g, "").slice(0, codeLength);
    const canConfirm = digits.length === codeLength && !confirming;
    const errorId = "mfa-verification-code-error";
    const errorMessage =
      verifyError === "invalid"
        ? t("verify.errorInvalid")
        : verifyError === "generic"
          ? t("verify.errorGeneric")
          : undefined;

    function updateOtp(value: string) {
      setVerifyError(null);
      setOtp(value.replace(/\D/g, "").slice(0, codeLength));
    }

    return (
      <section className="mx-auto max-w-lg p-6">
        <LanguageSwitcher />
        <h1 className="mb-1 text-xl font-semibold">{t("verify.title")}</h1>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{t("verify.body")}</p>
        <form className="flex flex-col gap-3" onSubmit={confirmEnrollment}>
          <div>
            <label htmlFor="verificationCode" className="mb-1 block text-sm font-medium">
              {t("verify.codeLabel")}
            </label>
            <input
              id="verificationCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) => updateOtp(event.target.value)}
              aria-invalid={errorMessage ? true : undefined}
              aria-describedby={errorMessage ? errorId : undefined}
              className="min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50"
              disabled={confirming}
            />
            {errorMessage && <FieldError id={errorId} message={errorMessage} />}
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={!canConfirm} className="min-h-11">
              {confirming ? t("verify.verifying") : t("verify.confirm")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={cancelEnrollment}
              disabled={confirming}
              className="min-h-11"
            >
              {t("verify.cancel")}
            </Button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg p-6">
      <LanguageSwitcher />
      <h1 className="mb-1 text-xl font-semibold">{t("intro.title")}</h1>
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{t("intro.body")}</p>
      {startError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {t("verify.errorGeneric")}
        </p>
      )}
      <Button type="button" onClick={beginSetup} className="min-h-11">
        {t("intro.begin")}
      </Button>
    </section>
  );
}
