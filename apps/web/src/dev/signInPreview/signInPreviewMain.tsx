/**
 * Bootstrap for the isolated multi-provider sign-in hosted-preview build
 * (`sign-in-preview.html`) — AUTH-PREVIEW-READINESS-001.
 *
 * Deliberately does NOT import `main.tsx` or `App.tsx`: this entry renders only
 * `SignInPreviewPage`, with no `react-router-dom`, no `react-query`, and no
 * `observability/*` pipeline — so every customer/admin route and the whole
 * observability stack are structurally absent from this bundle's module graph,
 * not merely gated at runtime (mirrors the CR3 `harnessMain.tsx` precedent).
 *
 * It initializes I18N-001 (so the customer-facing `SignInPanel` copy and the
 * language switcher resolve) but not Firebase App Check — `SignInPreviewPage`
 * composes auth + functions through `signInPreviewPlatform`, which reuses the
 * shared Firebase modules without the App-Check-gated shared root (no
 * `europe-west1` App Check site key exists yet, and the callable does not
 * enforce App Check).
 *
 * The interactive surface is gated by `isSignInPreviewBuildEnabled` — the same
 * fail-closed flag+mode+project check that governs this build — passed as
 * `previewBuild`, which `SignInPreviewPage` re-checks.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../index.css";
import "../../i18n/config";
import { SignInPreviewPage } from "./SignInPreviewPage";
import { isSignInPreviewBuildEnabled } from "./signInPreviewGate";

const previewBuild = isSignInPreviewBuildEnabled({
  previewFlag: import.meta.env.VITE_ENABLE_SIGN_IN_PREVIEW,
  mode: import.meta.env.MODE,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SignInPreviewPage dev={import.meta.env.DEV} previewBuild={previewBuild} />
  </StrictMode>,
);
