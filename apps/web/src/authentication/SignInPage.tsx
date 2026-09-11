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

import { useEffect, useMemo } from "react";
import { RecaptchaVerifier, type ApplicationVerifier, type Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useTranslation } from "../i18n";
import { createSignInActions, type CreateSignInActionsDeps } from "./createSignInActions";
import { SignInPanel, type SignInPanelActions } from "./SignInPanel";
import type { AuthenticateOutcome } from "./authenticateClient";
import { createManagedRecaptcha } from "./recaptchaLifecycle";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      <h1 className="text-center text-2xl font-semibold">{t("entry.signInTitle")}</h1>
      {resolvedActions ? (
        <SignInPanel actions={resolvedActions} onSignedIn={onSignedIn} />
      ) : (
        <p role="status">{t("entry.loading")}</p>
      )}
      <div id={RECAPTCHA_CONTAINER_ID} />
    </main>
  );
}
