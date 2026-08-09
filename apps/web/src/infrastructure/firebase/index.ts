/**
 * Firebase platform composition root (ENG-P1-001).
 *
 * The single entry point every future domain service uses to obtain
 * initialized Firebase client instances — never calls `firebase/*` SDK
 * functions directly outside this module.
 */

import type { AppCheck } from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Functions } from "firebase/functions";
import type { FirebaseStorage } from "firebase/storage";
import type { AppEnv } from "../../config/env";
import { getFirebaseApp } from "./app";
import { initializeFirebaseAppCheck } from "./appCheck";
import { getFirebaseAuth } from "./auth";
import { getFirebaseFirestore } from "./firestore";
import { getFirebaseFunctions } from "./functions";
import { getFirebaseStorage } from "./storage";

export interface FirebasePlatform {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  functions: Functions;
  storage: FirebaseStorage;
  appCheck: AppCheck | undefined;
}

export function initializeFirebasePlatform(env: AppEnv, appName?: string): FirebasePlatform {
  const app = getFirebaseApp(env.firebase, appName);
  const auth = getFirebaseAuth(app, env.useEmulator);
  const firestore = getFirebaseFirestore(app, env.useEmulator);
  const functions = getFirebaseFunctions(app, env.useEmulator);
  const storage = getFirebaseStorage(app, env.useEmulator);
  const appCheck = initializeFirebaseAppCheck(app, {
    siteKey: env.appCheckSiteKey,
    debugToken: env.appCheckDebugToken,
    isDev: env.useEmulator,
  });

  return { app, auth, firestore, functions, storage, appCheck };
}
