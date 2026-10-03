/**
 * Cloud Storage initialization (ENG-P1-001).
 *
 * Connects to the Storage emulator when `useEmulator` is true. Idempotent
 * per app instance — `connectStorageEmulator` throws if the emulator is
 * already connected, so repeated calls are guarded.
 */

import { connectStorageEmulator, type FirebaseStorage, getStorage } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";
import { FIREBASE_EMULATOR_PORTS } from "./emulatorPorts";

const STORAGE_EMULATOR_HOST = "127.0.0.1";

const connectedApps = new WeakSet<FirebaseApp>();

export function getFirebaseStorage(app: FirebaseApp, useEmulator: boolean): FirebaseStorage {
  const storage = getStorage(app);

  if (useEmulator && !connectedApps.has(app)) {
    connectStorageEmulator(storage, STORAGE_EMULATOR_HOST, FIREBASE_EMULATOR_PORTS.storage);
    connectedApps.add(app);
  }

  return storage;
}
