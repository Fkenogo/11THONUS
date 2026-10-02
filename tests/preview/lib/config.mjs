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

/**
 * Emulator ports are the repository's own (`firebase.json` is what the Firebase CLI reads, and
 * `guards.test.mjs` fails if the two drift); the web port is Vite's default.
 *
 * `emulatorUi` is 4001, not Firebase's default 4000: 4000 is a very common local dev port, and the
 * preview must coexist with other local projects without ever touching their processes (EA-002-CORR-001).
 */
export const ports = Object.freeze({
  web: 5173,
  auth: 9099,
  functions: 5001,
  firestore: 8080,
  storage: 9199,
  hosting: 5050,
  emulatorUi: 4001,
  postgres: 54329,
});

/** The ports `firebase emulators:start --only auth,functions,firestore,ui` must bind, checked before launch. */
export const emulatorLaunchPorts = Object.freeze(["auth", "functions", "firestore", "emulatorUi"]);

export const urls = Object.freeze({
  web: `http://localhost:${ports.web}`,
  auth: `http://${LOOPBACK}:${ports.auth}`,
  functions: `http://${LOOPBACK}:${ports.functions}/${PROJECT_ID}/${FUNCTIONS_REGION}`,
  firestore: `http://${LOOPBACK}:${ports.firestore}`,
  emulatorUi: `http://localhost:${ports.emulatorUi}`,
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
