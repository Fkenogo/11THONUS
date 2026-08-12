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

/** The PWA service worker is included for ordinary builds only. */
export function includePwaForMode(mode: string): boolean {
  return !isIsolatedPreviewMode(mode);
}
