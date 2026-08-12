/**
 * Access gate for the isolated multi-provider sign-in hosted-preview build
 * (`sign-in-preview.html` / `signInPreviewMain.tsx`), the AUTH-PREVIEW-
 * READINESS-001 analogue of `phoneAuthHarness/testHarnessGate.ts`.
 *
 * A hosted preview is always a `vite build` (never `import.meta.env.DEV`), so
 * it needs its own explicit, fail-closed gate rather than reusing the dev-only
 * `harnessGate.ts`. All three conditions are required together: the explicit
 * build flag, the dedicated Vite mode (`sign-in-preview`, set only by
 * `vite build --mode sign-in-preview`, which alone loads
 * `.env.sign-in-preview.local` — never present in an ordinary build or in CI),
 * and the approved project ID. Every comparison is an exact string match;
 * nothing coerces truthiness, so a missing, empty, malformed, or `"false"`
 * flag — or any project ID other than the approved one — fails closed.
 */

export interface SignInPreviewGateInput {
  previewFlag: string | undefined;
  mode: string | undefined;
  projectId: string | undefined;
}

const APPROVED_PREVIEW_PROJECT_ID = "eleventh-on-us-dev";
const APPROVED_PREVIEW_MODE = "sign-in-preview";

export function isSignInPreviewBuildEnabled(input: SignInPreviewGateInput): boolean {
  return (
    input.previewFlag === "true" &&
    input.mode === APPROVED_PREVIEW_MODE &&
    input.projectId === APPROVED_PREVIEW_PROJECT_ID
  );
}
