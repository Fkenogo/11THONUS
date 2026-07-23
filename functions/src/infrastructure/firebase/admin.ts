/**
 * Firebase Admin SDK initialization (ENG-P1-001).
 *
 * A single Admin app instance for the whole Cloud Functions codebase.
 * `initializeApp()` throws if called more than once, so this reuses an
 * existing instance rather than re-initializing. No explicit credentials
 * or emulator host are passed — the Cloud Functions runtime and the
 * Firebase Emulator Suite both configure these via environment variables
 * the Admin SDK reads automatically (`FIRESTORE_EMULATOR_HOST`,
 * `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`).
 */

import { type App, getApps, initializeApp } from "firebase-admin/app";

export function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0]!;
  }

  return initializeApp();
}
