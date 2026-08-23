/**
 * Access gate for the Founder-QA business-onboarding hosted preview
 * (`ENG-P3-002C-PREVIEW-001`), the onboarding-flow analogue of
 * `signInPreview/signInPreviewGate.ts`.
 *
 * Unlike the isolated `sign-in-preview` build (which structurally excludes
 * every customer/business route), this preview mounts the ordinary app — the
 * real `/business` routes stay in the module graph — only the sign-in entry
 * point differs. All three conditions are required together, every
 * comparison an exact string match: the explicit build flag, the dedicated
 * Vite mode (`founder-qa-preview`, set only by
 * `vite build --mode founder-qa-preview`, which alone loads
 * `.env.founder-qa-preview.local` — never present in an ordinary build or in
 * CI), and the approved project ID. A missing, empty, malformed, or
 * `"false"` flag — or any project ID other than the approved one — fails
 * closed.
 */

export interface FounderQaPreviewGateInput {
  previewFlag: string | undefined;
  mode: string | undefined;
  projectId: string | undefined;
}

const APPROVED_PREVIEW_PROJECT_ID = "eleventh-on-us-dev";
const APPROVED_PREVIEW_MODE = "founder-qa-preview";

export function isFounderQaPreviewBuildEnabled(input: FounderQaPreviewGateInput): boolean {
  return (
    input.previewFlag === "true" &&
    input.mode === APPROVED_PREVIEW_MODE &&
    input.projectId === APPROVED_PREVIEW_PROJECT_ID
  );
}
