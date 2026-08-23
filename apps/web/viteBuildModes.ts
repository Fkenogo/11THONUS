/**
 * Pure build-mode helpers shared by `vite.config.ts` (AUTH-PREVIEW-READINESS-001).
 *
 * Two dedicated `vite build --mode …` builds are structurally isolated from the
 * ordinary app: the EXT-TECH-001 phone `test-harness` build and the multi-
 * provider `sign-in-preview` build. Each swaps in its own single HTML entry
 * (excluding the ordinary `index.html` module graph — every customer/admin
 * route) and omits the PWA service worker (a stray cached SW must never outlive
 * a torn-down temporary preview). Every other build (`vite dev`, ordinary
 * `vite build`) is completely unaffected.
 *
 * Kept as a standalone pure module (no Vite/Node-URL imports) so the isolation
 * guarantees are directly unit-testable without evaluating `vite.config.ts`.
 */

export const TEST_HARNESS_MODE = "test-harness";
export const SIGN_IN_PREVIEW_MODE = "sign-in-preview";
// ENG-P3-002C-PREVIEW-001: unlike the two isolated builds above, this mode
// keeps the ordinary `index.html` entry — the real `/business` onboarding
// routes must stay in the module graph so a Founder can exercise the whole
// flow, not just sign-in. It only adds a preview-only sign-in entry point
// (gated separately in `App.tsx` via `founderQaPreviewGate.ts`).
export const FOUNDER_QA_PREVIEW_MODE = "founder-qa-preview";

/** The dedicated HTML entry for an isolated build, or `undefined` for ordinary builds. */
export function htmlEntryForMode(mode: string): string | undefined {
  if (mode === TEST_HARNESS_MODE) return "harness.html";
  if (mode === SIGN_IN_PREVIEW_MODE) return "sign-in-preview.html";
  return undefined;
}

/** True for either structurally-isolated preview build. */
export function isIsolatedPreviewMode(mode: string): boolean {
  return htmlEntryForMode(mode) !== undefined;
}

/**
 * True for every temporary preview build — the two structurally-isolated
 * ones plus `founder-qa-preview`, which is not isolated (it keeps the
 * ordinary module graph) but is just as temporary: a Hosting preview
 * channel torn down after Founder QA.
 */
export function isTemporaryPreviewMode(mode: string): boolean {
  return isIsolatedPreviewMode(mode) || mode === FOUNDER_QA_PREVIEW_MODE;
}

/**
 * The PWA service worker is included for ordinary builds only. A stray
 * cached SW must never outlive a torn-down temporary preview, so every
 * temporary preview mode omits it — including `founder-qa-preview`.
 */
export function includePwaForMode(mode: string): boolean {
  return !isTemporaryPreviewMode(mode);
}
