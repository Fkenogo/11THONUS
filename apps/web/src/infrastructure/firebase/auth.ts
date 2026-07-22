/**
 * Firebase Auth initialization (ENG-P1-001).
 *
 * Connects to the Auth emulator when `useEmulator` is true. Idempotent per
 * app instance — calling more than once never re-invokes
 * `connectAuthEmulator`, which throws if the emulator is already connected.
 */

import { type Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";

const AUTH_EMULATOR_HOST = "127.0.0.1";
const AUTH_EMULATOR_PORT = 9099;

const connectedApps = new WeakSet<FirebaseApp>();

export function getFirebaseAuth(app: FirebaseApp, useEmulator: boolean): Auth {
  const auth = getAuth(app);

  if (useEmulator && !connectedApps.has(app)) {
    connectAuthEmulator(auth, `http://${AUTH_EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, {
      disableWarnings: true,
    });
    connectedApps.add(app);
  }

  return auth;
}
