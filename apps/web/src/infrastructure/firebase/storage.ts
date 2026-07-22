/**
 * Cloud Storage initialization (ENG-P1-001).
 *
 * Connects to the Storage emulator when `useEmulator` is true. Idempotent
 * per app instance — `connectStorageEmulator` throws if the emulator is
 * already connected, so repeated calls are guarded.
 */

import { connectStorageEmulator, type FirebaseStorage, getStorage } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";

const STORAGE_EMULATOR_HOST = "127.0.0.1";
const STORAGE_EMULATOR_PORT = 9199;

const connectedApps = new WeakSet<FirebaseApp>();

export function getFirebaseStorage(app: FirebaseApp, useEmulator: boolean): FirebaseStorage {
  const storage = getStorage(app);

  if (useEmulator && !connectedApps.has(app)) {
    connectStorageEmulator(storage, STORAGE_EMULATOR_HOST, STORAGE_EMULATOR_PORT);
    connectedApps.add(app);
  }

  return storage;
}
