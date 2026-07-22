/**
 * App Check initialization (ENG-P1-001).
 *
 * App Check is Security Layer 2 (TRD8 §8.10). No `europe-west1` project
 * exists yet to issue a real reCAPTCHA site key (Cloud Environment &
 * Deployment Strategy §7 — project creation is a Founder-authorized action,
 * never a coding agent's), so a missing site key is tolerated in development
 * (warned, not silent) but refused outside development — a misconfigured
 * non-development build must fail closed, not boot unprotected.
 */

import { type AppCheck, initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";

export interface AppCheckOptions {
  siteKey: string | undefined;
  debugToken?: string;
  isDev: boolean;
}

export function initializeFirebaseAppCheck(
  app: FirebaseApp,
  options: AppCheckOptions,
): AppCheck | undefined {
  if (!options.siteKey) {
    if (!options.isDev) {
      throw new Error(
        "App Check site key is required outside development (VITE_APP_CHECK_SITE_KEY is not set). " +
          "Refusing to initialize without App Check protection in a non-development environment.",
      );
    }

    console.warn(
      "App Check not initialized: no site key configured (VITE_APP_CHECK_SITE_KEY). " +
        "This is expected in development until a europe-west1 Firebase project provides one.",
    );
    return undefined;
  }

  if (options.isDev && options.debugToken) {
    (
      globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = options.debugToken;
  }

  return initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(options.siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
