/**
 * Firebase composition accessor for the multi-provider sign-in hosted preview
 * (AUTH-PREVIEW-READINESS-001).
 *
 * Reuses the **shared** Firebase composition modules (`getFirebaseApp`,
 * `getFirebaseAuth`, `getFirebaseFunctions`) — the same building blocks the
 * production composition root (`infrastructure/firebase/index.ts`) uses — so the
 * preview exercises the real authentication client, never a re-implementation.
 *
 * It deliberately does NOT call `initializeFirebasePlatform`: that entry point
 * additionally initializes Firebase App Check, which fails closed outside
 * emulator mode when no reCAPTCHA site key is provisioned (see
 * `infrastructure/firebase/appCheck.ts`). No `europe-west1` App Check site key
 * exists yet, and the `authenticate` callable does not enforce App Check, so the
 * preview composes auth + functions directly — mirroring the `phoneAuthHarness`
 * precedent, which likewise avoids the App-Check-gated shared root.
 *
 * Defense-in-depth: a positive project-ID allowlist (the approved dev project
 * and the emulator demo project only) fails closed for staging/production/any
 * other/missing project, so a misconfigured environment can never point this
 * preview at the wrong Firebase project. The refusal message never echoes secret
 * config values.
 */

import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import type { AppEnv } from "../../config/env";
import { getFirebaseApp } from "../../infrastructure/firebase/app";
import { getFirebaseAuth } from "../../infrastructure/firebase/auth";
import { getFirebaseFunctions } from "../../infrastructure/firebase/functions";

export interface SignInPreviewPlatform {
  auth: Auth;
  functions: Functions;
}

/**
 * The only Firebase projects this preview may operate against: the approved
 * development project (hosted preview) and the emulator demo project (local
 * dev-server / emulator preview). Any other project fails closed.
 */
const APPROVED_PREVIEW_PROJECT_IDS: ReadonlySet<string> = new Set([
  "eleventh-on-us-dev",
  "demo-11thonus",
]);

export function getSignInPreviewPlatform(env: AppEnv): SignInPreviewPlatform {
  const { projectId } = env.firebase;
  if (!APPROVED_PREVIEW_PROJECT_IDS.has(projectId)) {
    const resolved = projectId ? `"${projectId}"` : "(missing)";
    throw new Error(
      `Sign-in preview refused to activate: the resolved Firebase project is ${resolved}, ` +
        `which is not an approved preview project. This preview may only run against the ` +
        `approved development project or the emulator demo project.`,
    );
  }

  const app = getFirebaseApp(env.firebase);
  const auth = getFirebaseAuth(app, env.useEmulator);
  const functions = getFirebaseFunctions(app, env.useEmulator);
  return { auth, functions };
}
