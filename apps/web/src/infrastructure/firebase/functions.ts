/**
 * Cloud Functions client initialization (AUTH-04).
 *
 * The composition-root accessor for the callable client the frontend
 * authentication flows use to reach the AUTH-03 `authenticate` function — added
 * here, alongside `auth.ts`/`firestore.ts`, because the composition root is the
 * single place allowed to call `firebase/*` SDK functions directly. Bound to the
 * platform region (`europe-west1`, DEC-TECH-005) so callables resolve to the
 * deployed function, and idempotent per app instance —
 * `connectFunctionsEmulator` throws if the emulator is already connected, so
 * repeated calls are guarded.
 */

import { connectFunctionsEmulator, type Functions, getFunctions } from "firebase/functions";
import type { FirebaseApp } from "firebase/app";
import { FIREBASE_EMULATOR_PORTS } from "./emulatorPorts";
import {
  FIREBASE_PREVIEW_ORIGIN,
  PREVIEW_FUNCTIONS_PATH,
  resolvePreviewOrigin,
} from "./previewOrigin";

/** The Version 1 Cloud Functions region (mirrors `functions/src/config/region.ts`). */
export const FUNCTIONS_REGION = "europe-west1";

const FUNCTIONS_EMULATOR_HOST = "127.0.0.1";

const connectedApps = new WeakSet<FirebaseApp>();

export function getFirebaseFunctions(
  app: FirebaseApp,
  useEmulator: boolean,
  previewOrigin: string | undefined = FIREBASE_PREVIEW_ORIGIN,
): Functions {
  const origin = resolvePreviewOrigin(useEmulator, previewOrigin);
  if (origin !== undefined) {
    // Phone preview: the SDK's own custom-domain overload targets `<origin>/__fn/<name>` over HTTPS;
    // token attach, callable envelopes and error mapping stay SDK-native. No emulator connection.
    return getFunctions(app, `${origin}${PREVIEW_FUNCTIONS_PATH}`);
  }

  const functions = getFunctions(app, FUNCTIONS_REGION);

  if (useEmulator && !connectedApps.has(app)) {
    connectFunctionsEmulator(functions, FUNCTIONS_EMULATOR_HOST, FIREBASE_EMULATOR_PORTS.functions);
    connectedApps.add(app);
  }

  return functions;
}
