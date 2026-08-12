/**
 * Multi-provider authentication hosted-preview surface
 * (AUTH-PREVIEW-READINESS-001).
 *
 * The bounded, hosted-preview-capable surface that exercises the **real**
 * merged authentication composition — it mounts the production `SignInPanel`
 * driven by `createSignInActions` over the shared Firebase client
 * (`signInPreviewPlatform`), respecting the governed disabled-by-default
 * provider flags (`providerConfig`). No authentication logic is duplicated here;
 * this page only composes and renders existing components.
 *
 * Customer-facing authentication copy is fully localized through I18N-001 (the
 * `SignInPanel` renders from translation keys; a `LanguageSwitcher` toggles
 * en/fr at runtime). The page's own chrome (the test-only banner and heading)
 * is deliberately plain developer-facing text, not customer product copy —
 * matching the established `phoneAuthHarness` precedent for a non-customer
 * preview/test tool.
 *
 * Fail-closed: like the phone harness it renders nothing unless the dev-server
 * gate (`isHarnessEnabled`) or the dedicated preview build (`previewBuild`, set
 * only by the isolated `sign-in-preview` build via `signInPreviewGate`) is
 * active. The reCAPTCHA `ApplicationVerifier` needed only by the optional Phone
 * flow is created at send-time against a fresh child of a page-owned container
 * (`RECAPTCHA_CONTAINER_ID`), so the shared composition stays free of DOM
 * concerns and no React ref is read during render.
 */

import { useEffect, useMemo } from "react";
import { RecaptchaVerifier, type ApplicationVerifier } from "firebase/auth";
import { getAppEnv } from "../../config/env";
import { LanguageSwitcher } from "../../i18n";
import {
  createSignInActions,
  type CreateSignInActionsDeps,
} from "../../authentication/createSignInActions";
import { SignInPanel, type SignInPanelActions } from "../../authentication/SignInPanel";
import type { AuthenticateOutcome } from "../../authentication/authenticateClient";
import { isHarnessEnabled } from "../phoneAuthHarness/harnessGate";
import { getSignInPreviewPlatform } from "./signInPreviewPlatform";
import { createManagedRecaptcha } from "./recaptchaLifecycle";

/** Page-owned container the optional Phone flow renders its reCAPTCHA into. */
const RECAPTCHA_CONTAINER_ID = "sign-in-preview-recaptcha";

export function SignInPreviewPage({
  dev,
  previewBuild = false,
  actions,
  onSignedIn,
}: {
  dev: boolean;
  /**
   * Set only by `signInPreviewMain.tsx`, from the same fail-closed
   * `isSignInPreviewBuildEnabled(...)` check that gates whether the isolated
   * `sign-in-preview.html` bundle renders at all. Re-checked here so a direct
   * navigation to a hosted preview whose build did not satisfy every condition
   * still cannot reach the surface. Defaults to `false` so every other caller
   * (the dev-server route, tests) fails closed unless it opts in.
   */
  previewBuild?: boolean;
  /** Test seam — inject ready-made actions so tests never touch live Firebase. */
  actions?: SignInPanelActions;
  onSignedIn?: (outcome: AuthenticateOutcome) => void;
}) {
  const enabled = isHarnessEnabled(dev) || previewBuild;

  // Hosted previews are reachable over the public internet — emit an explicit
  // no-index signal (belt-and-suspenders alongside the static <meta> in
  // sign-in-preview.html). Never added for the dev-server route.
  useEffect(() => {
    if (!previewBuild) return;
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow, noarchive");
  }, [previewBuild]);

  // Build the real composition lazily: only when the surface is enabled and no
  // test actions were injected — so a disabled page never initializes Firebase.
  // The composition includes a managed reCAPTCHA verifier for the optional Phone
  // flow: each send tears down the prior verifier + its DOM node before creating
  // the next (a fresh child of the page-owned container), so retries never leak
  // widgets or reuse an already-rendered reCAPTCHA element.
  const composition = useMemo(() => {
    if (actions || !enabled) return null;

    const platform = getSignInPreviewPlatform(getAppEnv());
    const recaptcha = createManagedRecaptcha({
      createVerifier: (node) => new RecaptchaVerifier(platform.auth, node, { size: "invisible" }),
      createNode: () => {
        const node = document.createElement("div");
        document.getElementById(RECAPTCHA_CONTAINER_ID)?.appendChild(node);
        return node;
      },
      removeNode: (node) => node.parentNode?.removeChild(node),
    });

    const getRecaptchaVerifier: CreateSignInActionsDeps["getRecaptchaVerifier"] = () =>
      recaptcha.getVerifier() as unknown as ApplicationVerifier;

    const builtActions = createSignInActions(platform, {
      flagSource: import.meta.env,
      getRecaptchaVerifier,
    });
    return { actions: builtActions, recaptcha };
  }, [actions, enabled]);

  // Tear down the current reCAPTCHA verifier + node when the page unmounts.
  useEffect(() => {
    return () => composition?.recaptcha.teardown();
  }, [composition]);

  const resolvedActions = actions ?? composition?.actions ?? null;

  if (!enabled || !resolvedActions) {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <div
        role="alert"
        className="rounded border-2 border-amber-600 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
      >
        MULTI-PROVIDER SIGN-IN PREVIEW — temporary validation surface (AUTH-PREVIEW-READINESS-001).
        Not a production route. Do not index, bookmark, or share this URL; this deployment is torn
        down after testing.
      </div>
      <h1 className="text-xl font-semibold">Sign-in preview</h1>
      <LanguageSwitcher />
      <SignInPanel actions={resolvedActions} onSignedIn={onSignedIn} />
      <div id={RECAPTCHA_CONTAINER_ID} />
    </main>
  );
}
