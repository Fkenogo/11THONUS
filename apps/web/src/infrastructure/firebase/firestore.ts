/**
 * Cloud Firestore initialization (ENG-P1-001).
 *
 * Connects to the Firestore emulator when `useEmulator` is true. Idempotent
 * per app instance — `connectFirestoreEmulator` throws if the emulator is
 * already connected, so repeated calls are guarded.
 */

import { connectFirestoreEmulator, type Firestore, getFirestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import { FIREBASE_EMULATOR_PORTS } from "./emulatorPorts";

const FIRESTORE_EMULATOR_HOST = "127.0.0.1";

const connectedApps = new WeakSet<FirebaseApp>();

export function getFirebaseFirestore(app: FirebaseApp, useEmulator: boolean): Firestore {
  const firestore = getFirestore(app);

  if (useEmulator && !connectedApps.has(app)) {
    connectFirestoreEmulator(firestore, FIRESTORE_EMULATOR_HOST, FIREBASE_EMULATOR_PORTS.firestore);
    connectedApps.add(app);
  }

  return firestore;
}
