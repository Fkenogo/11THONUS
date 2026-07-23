/**
 * Firebase App initialization (ENG-P1-001).
 *
 * A thin, testable wrapper around `firebase/app`'s `initializeApp`, reusing
 * an existing app instance of the same name instead of throwing on repeated
 * calls (the Firebase SDK throws `initializeApp` a second time for the same
 * name unless the caller retrieves the existing instance first).
 */

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import type { FirebaseClientConfig } from "../../config/env";

const DEFAULT_APP_NAME = "[DEFAULT]";

export function getFirebaseApp(
  config: FirebaseClientConfig,
  name: string = DEFAULT_APP_NAME,
): FirebaseApp {
  const existing = getApps().find((app) => app.name === name);
  if (existing) {
    return existing;
  }

  return initializeApp(
    {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId,
    },
    name,
  );
}
