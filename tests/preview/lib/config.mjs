// Founder Preview (EA-002) — the single source of truth for ports, paths and
// well-known local values. Every value here is local-only: loopback hosts, the
// fake `demo-11thonus` Firebase project, and the disposable local PostgreSQL
// from `docker-compose.postgres.yml`. Nothing here can name a real environment.
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const functionsDir = path.join(repoRoot, "functions");
export const migrationsDir = path.join(
  functionsDir,
  "src/infrastructure/postgres/migrations",
);
export const previewStateDir = path.join(repoRoot, ".preview");

export const PROJECT_ID = "demo-11thonus";
export const FUNCTIONS_REGION = "europe-west1";
export const LOOPBACK = "127.0.0.1";

/** Dedicated Founder Preview block. The map is asserted against firebase.json and client defaults. */
export const ports = Object.freeze({
  auth: 28101,
  functions: 28102,
  firestore: 28103,
  storage: 28104,
  hosting: 28105,
  emulatorUi: 28106,
  hub: 28107,
  logging: 28108,
  web: 28109,
  postgres: 28110,
});

/** Ports the Firebase CLI binds, including its hub and logging service, checked before launch. */
export const emulatorLaunchPorts = Object.freeze([
  "auth",
  "functions",
  "firestore",
  "emulatorUi",
  "hub",
  "logging",
]);

export const urls = Object.freeze({
  web: `http://localhost:${ports.web}`,
  auth: `http://${LOOPBACK}:${ports.auth}`,
  functions: `http://${LOOPBACK}:${ports.functions}/${PROJECT_ID}/${FUNCTIONS_REGION}`,
  firestore: `http://${LOOPBACK}:${ports.firestore}`,
  emulatorUi: `http://localhost:${ports.emulatorUi}`,
});

export const FIREBASE_WEB_EMULATOR_ENV = Object.freeze({
  VITE_FIREBASE_AUTH_EMULATOR_PORT: String(ports.auth),
  VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT: String(ports.functions),
  VITE_FIREBASE_FIRESTORE_EMULATOR_PORT: String(ports.firestore),
  VITE_FIREBASE_STORAGE_EMULATOR_PORT: String(ports.storage),
});

/**
 * The disposable local database from `docker-compose.postgres.yml`
 * (`POSTGRES_MULTIPLE_DATABASES: eleventhonus_platform_local, …_test`). The preview
 * only ever uses the `_local` database — never `_test`, which the Postgres
 * integration suites own.
 */
export const PREVIEW_DATABASE = "eleventhonus_platform_local";
export const FORBIDDEN_DATABASES = Object.freeze(["eleventhonus_platform_test"]);
export const DEFAULT_POSTGRES_URL = `postgres://postgres:postgres@localhost:${ports.postgres}/${PREVIEW_DATABASE}`;

/** Env var that points the preview at an already-running local PostgreSQL instead of Docker. */
export const POSTGRES_URL_ENV = "PREVIEW_POSTGRES_URL";

export const composeFile = path.join(repoRoot, "docker-compose.postgres.yml");
