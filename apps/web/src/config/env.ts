/**
 * Environment configuration loading (ENG-P1-001).
 *
 * Reads and validates the Firebase client configuration and related
 * runtime flags from Vite's `import.meta.env`. Accepts an explicit
 * source object so it can be tested without depending on Vite's
 * build-time env replacement.
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface AppEnv {
  firebase: FirebaseClientConfig;
  useEmulator: boolean;
  appCheckSiteKey?: string;
  appCheckDebugToken?: string;
}

type EnvSource = Record<string, string | undefined>;

const REQUIRED_FIREBASE_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

// Matches the Firebase Emulator Suite's fake project (`--project demo-11thonus`,
// see the `emulators`/`emulators:validate` scripts) — safe to use as a DEV-only
// fallback because the emulator accepts any well-formed config for a `demo-*`
// project and never talks to a real backend.
const DEMO_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-11thonus.firebaseapp.com",
  projectId: "demo-11thonus",
  storageBucket: "demo-11thonus.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
};

function parseBoolean(name: string, value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Invalid ${name} value: "${value}" (expected "true" or "false")`);
}

export function loadEnv(source: EnvSource, viteFlags: { DEV: boolean } = { DEV: false }): AppEnv {
  const missing = REQUIRED_FIREBASE_VARS.filter((key) => !source[key]);
  const useEmulator =
    parseBoolean("VITE_USE_FIREBASE_EMULATOR", source.VITE_USE_FIREBASE_EMULATOR) ?? viteFlags.DEV;

  if (missing.length > 0) {
    if (!useEmulator) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }

    console.warn(
      `Firebase config missing (${missing.join(", ")}): falling back to the demo emulator ` +
        "project (demo-11thonus) because emulator mode is active. This is expected until " +
        "apps/web/.env.local is populated; the app will only work against the Firebase " +
        "Emulator Suite in this state.",
    );

    return {
      firebase: DEMO_FIREBASE_CONFIG,
      useEmulator: true,
      appCheckSiteKey: source.VITE_APP_CHECK_SITE_KEY,
      appCheckDebugToken: source.VITE_APP_CHECK_DEBUG_TOKEN,
    };
  }

  return {
    firebase: {
      apiKey: source.VITE_FIREBASE_API_KEY!,
      authDomain: source.VITE_FIREBASE_AUTH_DOMAIN!,
      projectId: source.VITE_FIREBASE_PROJECT_ID!,
      storageBucket: source.VITE_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: source.VITE_FIREBASE_MESSAGING_SENDER_ID!,
      appId: source.VITE_FIREBASE_APP_ID!,
      measurementId: source.VITE_FIREBASE_MEASUREMENT_ID,
    },
    useEmulator,
    appCheckSiteKey: source.VITE_APP_CHECK_SITE_KEY,
    appCheckDebugToken: source.VITE_APP_CHECK_DEBUG_TOKEN,
  };
}

let cachedAppEnv: AppEnv | undefined;

/**
 * The application's live environment configuration, loaded lazily and cached
 * on first access — never at module import time, so importing this module
 * (e.g. to reuse `loadEnv` in a test) never triggers real env validation.
 */
export function getAppEnv(): AppEnv {
  if (!cachedAppEnv) {
    cachedAppEnv = loadEnv(import.meta.env, { DEV: import.meta.env.DEV });
  }
  return cachedAppEnv;
}
