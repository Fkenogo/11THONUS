/**
 * Route wrapper mounting the real sign-in composition for the Founder-QA
 * business-onboarding hosted preview (`ENG-P3-002C-PREVIEW-001`). Reuses
 * `SignInPreviewPage` unmodified — the same real, merged `SignInPanel` +
 * `createSignInActions` composition the multi-provider sign-in preview
 * uses (`AUTH-PREVIEW-READINESS-001`) — since it already fails closed on a
 * `previewBuild` flag and, through `getSignInPreviewPlatform`, resolves to
 * the same singleton Auth/Functions instances the ordinary app boots with
 * (`getFirebaseAuth`/`getFirebaseFunctions` are memoized per `FirebaseApp`).
 * No authentication logic is duplicated here.
 *
 * `previewBuild` is computed once, in `App.tsx`, from the literal
 * `import.meta.env` comparisons that also gate whether this module is even
 * reachable from the bundle (mirroring the `DevPhoneAuthHarnessRoute` /
 * `DevSignInPreviewRoute` precedent) — not re-derived here — so this
 * component stays a thin, directly-testable wrapper with no env-reading of
 * its own. Defaults to `false`: any caller that omits it fails closed.
 *
 * On sign-in, navigates into the real `/business` resolver so the Founder
 * can exercise the onboarding flow end-to-end.
 */

import { useNavigate } from "react-router-dom";
import { SignInPreviewPage } from "../signInPreview/SignInPreviewPage";
import type { SignInPanelActions } from "../../authentication/SignInPanel";

export function FounderQaPreviewSignInRoute({
  previewBuild = false,
  actions,
}: {
  previewBuild?: boolean;
  /** Test seam — inject ready-made actions so tests never touch live Firebase. */
  actions?: SignInPanelActions;
}) {
  const navigate = useNavigate();

  return (
    <SignInPreviewPage
      dev={false}
      previewBuild={previewBuild}
      actions={actions}
      onSignedIn={() => navigate("/business")}
    />
  );
}
