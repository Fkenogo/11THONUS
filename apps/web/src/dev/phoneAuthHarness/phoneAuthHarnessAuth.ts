/**
 * A dedicated, always-real Firebase Auth instance for the EXT-TECH-001
 * delivery-test harness.
 *
 * The shared composition root (`infrastructure/firebase/auth.ts`) auto-
 * connects to the Auth Emulator whenever `useEmulator` is true, which
 * defaults to Vite's `DEV` flag — the same flag that gates this harness
 * into existence at all. Reusing that shared instance would silently
 * route every "real" SMS send through the emulator, defeating the
 * harness's entire purpose. Instead, this module initializes its own,
 * distinctly-named secondary Firebase app and never calls
 * `connectAuthEmulator` on it — guaranteeing the genuine SMS route
 * regardless of the rest of the app's emulator configuration. It is also
 * never passed to `registerAuthLifecycle`/observability, so no auth-state
 * breadcrumb or event from this instance reaches any diagnostics provider.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import type { FirebaseClientConfig } from "../../config/env";

const HARNESS_APP_NAME = "phone-auth-harness";
const EMULATOR_DEMO_PROJECT_ID = "demo-11thonus";

function getHarnessApp(config: FirebaseClientConfig): FirebaseApp {
  const existing = getApps().find((app) => app.name === HARNESS_APP_NAME);
  if (existing) return getApp(HARNESS_APP_NAME);
  return initializeApp(config, HARNESS_APP_NAME);
}

export function getPhoneAuthHarnessAuth(config: FirebaseClientConfig): Auth {
  if (config.projectId === EMULATOR_DEMO_PROJECT_ID) {
    throw new Error(
      "Phone Auth harness refused to activate: the resolved Firebase config is the " +
        "Emulator Suite's demo fallback project, not a real Firebase project. Populate " +
        "apps/web/.env.local with the real eleventh-on-us-dev VITE_FIREBASE_* values " +
        "before using this harness.",
    );
  }

  const app = getHarnessApp(config);
  return getAuth(app);
}
