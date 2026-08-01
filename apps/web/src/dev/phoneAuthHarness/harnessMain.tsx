/**
 * CR3: bootstrap for the dedicated hosted test-harness build
 * (`harness.html`). Deliberately does NOT import `main.tsx` or `App.tsx`
 * — this entry renders only `PhoneAuthHarnessPage`, with no
 * `react-router-dom`, no `initializeFirebasePlatform` (the shared
 * composition root, which routes through Firebase App Check and fails
 * closed without a site key this harness is not authorised to
 * provision), no `react-query`, and no `observability/*` pipeline. Every
 * one of those is therefore structurally absent from this bundle's
 * module graph, not merely gated at runtime — verified against real
 * `vite build --mode test-harness` output in the CR3 implementation
 * report.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../index.css";
import { PhoneAuthHarnessPage } from "./PhoneAuthHarnessPage";
import { isTestHarnessBuildEnabled } from "./testHarnessGate";

const testHarnessBuild = isTestHarnessBuildEnabled({
  testHarnessFlag: import.meta.env.VITE_ENABLE_PHONE_AUTH_TEST_HARNESS,
  mode: import.meta.env.MODE,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PhoneAuthHarnessPage dev={import.meta.env.DEV} testHarnessBuild={testHarnessBuild} />
  </StrictMode>,
);
