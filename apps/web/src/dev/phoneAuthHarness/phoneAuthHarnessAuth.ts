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
 *
 * CR1 Correction 1: this module enforces a positive allowlist, not merely
 * a rejection of the Emulator Suite's demo project. `getPhoneAuthHarnessAuth`
 * only returns an Auth instance when the resolved config's `projectId` is
 * exactly `APPROVED_DEV_PROJECT_ID` — it fails closed for the demo project,
 * staging, production, any other real project, and a missing project ID
 * alike. A negative-only check would let a misconfigured `.env.local`
 * pointing at, say, the staging project silently send a real, billable SMS
 * through the wrong environment; the allowlist closes that gap.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import type { FirebaseClientConfig } from "../../config/env";

const HARNESS_APP_NAME = "phone-auth-harness";

// The only Firebase project this harness may ever operate against — see
// `.firebaserc`'s "dev" alias. Deliberately not read from an environment
// variable: the approved project must not be runtime-editable.
const APPROVED_DEV_PROJECT_ID = "eleventh-on-us-dev";

function getHarnessApp(config: FirebaseClientConfig): FirebaseApp {
  const existing = getApps().find((app) => app.name === HARNESS_APP_NAME);
  if (existing) return getApp(HARNESS_APP_NAME);
  return initializeApp(config, HARNESS_APP_NAME);
}

export function getPhoneAuthHarnessAuth(config: FirebaseClientConfig): Auth {
  if (config.projectId !== APPROVED_DEV_PROJECT_ID) {
    const resolvedProjectId = config.projectId ? `"${config.projectId}"` : "(missing)";
    throw new Error(
      `Phone Auth harness refused to activate: the resolved Firebase project is ` +
        `${resolvedProjectId}, which is not the approved development project. This harness ` +
        `may only run against "${APPROVED_DEV_PROJECT_ID}". Populate apps/web/.env.local with ` +
        `the real ${APPROVED_DEV_PROJECT_ID} VITE_FIREBASE_* values before using this harness.`,
    );
  }

  const app = getHarnessApp(config);
  return getAuth(app);
}
