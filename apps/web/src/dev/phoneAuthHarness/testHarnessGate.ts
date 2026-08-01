/**
 * Access gate for the CR3 hosted test-harness build (`harness.html` /
 * `harnessMain.tsx`), distinct from `harnessGate.ts`'s dev-server-only
 * `isHarnessEnabled`. A hosted preview is always a `vite build` (never
 * `import.meta.env.DEV`), so it needs its own explicit, fail-closed gate
 * rather than reusing the dev-only one.
 *
 * All three conditions are required together: the explicit build flag, a
 * dedicated Vite mode (`test-harness`, set only by `vite build --mode
 * test-harness`, which alone loads `.env.test-harness.local` — never
 * present in an ordinary build or in CI), and the approved project ID.
 * Every comparison is an exact string match; nothing here coerces
 * truthiness, so a missing, empty, malformed, or `"false"` flag — or any
 * project ID other than the approved one — fails closed.
 */

export interface TestHarnessGateInput {
  testHarnessFlag: string | undefined;
  mode: string | undefined;
  projectId: string | undefined;
}

const APPROVED_TEST_HARNESS_PROJECT_ID = "eleventh-on-us-dev";
const APPROVED_TEST_HARNESS_MODE = "test-harness";

export function isTestHarnessBuildEnabled(input: TestHarnessGateInput): boolean {
  return (
    input.testHarnessFlag === "true" &&
    input.mode === APPROVED_TEST_HARNESS_MODE &&
    input.projectId === APPROVED_TEST_HARNESS_PROJECT_ID
  );
}
