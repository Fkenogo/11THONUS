/**
 * Production sign-in entry point (`PRODUCT-ALIGN-002`, root-route resolver).
 *
 * Composes the existing, already-governed `SignInPanel` + `createSignInActions`
 * composition over the real `Auth`/`Functions` instances the app boots with —
 * no new authentication logic is added here. This is the customer-facing
 * counterpart to the dev/hosted-preview `SignInPreviewPage` composition
 * (`AUTH-PREVIEW-READINESS-001`): that surface exists to validate the
 * composition pre-launch; this one mounts the same real composition as the
 * actual `/` unauthenticated entry point.
 *
 * The reCAPTCHA `ApplicationVerifier` needed only by the optional Phone flow
 * is created at send-time against a fresh child of a page-owned container, so
 * the shared composition stays free of DOM concerns (same discipline as
 * `SignInPreviewPage`).
 */

import { useEffect, useMemo, useState } from "react";
import { RecaptchaVerifier, type ApplicationVerifier, type Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useTranslation } from "../i18n";
import { createSignInActions, type CreateSignInActionsDeps } from "./createSignInActions";
import { SignInPanel, type SignInPanelActions } from "./SignInPanel";
import type { AuthenticateOutcome } from "./authenticateClient";
import { createManagedRecaptcha } from "./recaptchaLifecycle";
import { ExperienceBrand } from "../experience/ExperienceBrand";

const RECAPTCHA_CONTAINER_ID = "sign-in-recaptcha";

export function SignInPage({
  auth,
  functions,
  actions,
  onSignedIn,
}: {
  auth: Auth;
  functions: Functions;
  /** Test seam — inject ready-made actions so tests never touch live Firebase. */
  actions?: SignInPanelActions;
  onSignedIn?: (outcome: AuthenticateOutcome) => void;
}) {
  const { t } = useTranslation("customer");
  const [entryMode, setEntryMode] = useState<"signin" | "register">("signin");
  const registering = entryMode === "register";
  const entryTitle = registering ? t("entry.createAccountTitle") : t("entry.signInTitle");
  const entryDescription = registering
    ? t("entry.createAccountDescription")
    : t("entry.description");

  // Build the real composition lazily: only when no test actions were
  // injected, so a test that supplies `actions` never initializes Firebase's
  // RecaptchaVerifier or touches the DOM.
  const composition = useMemo(() => {
    if (actions) return null;

    const recaptcha = createManagedRecaptcha({
      createVerifier: (node) => new RecaptchaVerifier(auth, node, { size: "invisible" }),
      createNode: () => {
        const node = document.createElement("div");
        document.getElementById(RECAPTCHA_CONTAINER_ID)?.appendChild(node);
        return node;
      },
      removeNode: (node) => node.parentNode?.removeChild(node),
    });

    const getRecaptchaVerifier: CreateSignInActionsDeps["getRecaptchaVerifier"] = () =>
      recaptcha.getVerifier() as unknown as ApplicationVerifier;

    const builtActions = createSignInActions(
      { auth, functions },
      { flagSource: import.meta.env, getRecaptchaVerifier },
    );
    return { actions: builtActions, recaptcha };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `auth`/`functions` are stable singletons for the app's lifetime.
  }, [actions]);

  useEffect(() => {
    return () => composition?.recaptcha.teardown();
  }, [composition]);

  const resolvedActions = actions ?? composition?.actions ?? null;

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-6 text-slate-900 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl flex-col">
        <header className="mb-8 flex items-center justify-between">
          <ExperienceBrand />
        </header>
        <div className="grid flex-1 items-center gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] md:gap-14">
          <section className="hidden md:block">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-amber-800">
              {t("entry.eyebrow")}
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-950 lg:text-5xl">
              {t("entry.headline")}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              {entryDescription}
            </p>
          </section>
          <section
            aria-labelledby="entry-title"
            className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_48px_-32px_rgba(15,23,42,0.38)] sm:p-8"
          >
            <p className="mb-2 text-sm font-semibold text-amber-800 md:hidden">
              {t("entry.eyebrow")}
            </p>
            <h2 id="entry-title" className="mb-2 text-2xl font-bold tracking-tight text-slate-950">
              {entryTitle}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">{entryDescription}</p>
            {resolvedActions ? (
              <SignInPanel
                actions={resolvedActions}
                onSignedIn={onSignedIn}
                onModeChange={setEntryMode}
              />
            ) : (
              <p role="status" className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                {t("entry.loading")}
              </p>
            )}
          </section>
        </div>
        <div id={RECAPTCHA_CONTAINER_ID} />
      </div>
    </main>
  );
}
