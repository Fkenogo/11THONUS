// Founder Preview (EA-002) — production-safety guards.
//
// Every destructive or data-writing preview command calls `assertLocalPreviewTarget`
// first. The pattern deliberately copies the fail-loud posture of
// `tests/e2e/emulator/seedTestOnlyTermsFixture.mjs`: no `??`/`||` fallback inside a
// check — a missing, empty or wrong value ALWAYS refuses, it never silently
// substitutes a safe-looking default.
//
// The functions here are pure (they take the env/URL as arguments and return or
// throw) so they are unit-tested without any service running.
import { FORBIDDEN_DATABASES, PREVIEW_DATABASE, PROJECT_ID } from "./config.mjs";

export class PreviewGuardError extends Error {
  constructor(message) {
    super(`Founder Preview refused to run — ${message}`);
    this.name = "PreviewGuardError";
  }
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function isLoopbackHost(host) {
  return typeof host === "string" && LOOPBACK_HOSTS.has(host.toLowerCase());
}

function hostOfHostPort(value) {
  // "127.0.0.1:8080" | "localhost:8080" | "[::1]:8080"
  if (value.startsWith("[")) return value.slice(0, value.indexOf("]") + 1);
  return value.split(":")[0];
}

/** Parses a PostgreSQL URL and returns { host, port, database }, or throws a guard error. */
export function parsePostgresTarget(connectionString) {
  if (typeof connectionString !== "string" || connectionString.trim().length === 0) {
    throw new PreviewGuardError("no PostgreSQL connection string was supplied.");
  }
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new PreviewGuardError("the PostgreSQL connection string is not a valid URL.");
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new PreviewGuardError("the PostgreSQL connection string must use postgres://.");
  }
  return {
    host: url.hostname,
    port: url.port,
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  };
}

export function assertLocalPostgres(connectionString) {
  const { host, database } = parsePostgresTarget(connectionString);
  if (!isLoopbackHost(host)) {
    throw new PreviewGuardError(
      `PostgreSQL host "${host}" is not a loopback address. The preview only ever uses a local database.`,
    );
  }
  if (FORBIDDEN_DATABASES.includes(database)) {
    throw new PreviewGuardError(
      `database "${database}" belongs to the integration-test suites and is never used by the preview.`,
    );
  }
  if (database !== PREVIEW_DATABASE) {
    throw new PreviewGuardError(
      `database "${database}" is not the preview database "${PREVIEW_DATABASE}".`,
    );
  }
}

/**
 * The full local-target check. `env` is the environment the preview tooling (and
 * the Functions emulator it launches) will run with.
 */
export function assertLocalPreviewTarget(env, { postgresUrl } = {}) {
  if (env.PLATFORM_ENV !== "local") {
    throw new PreviewGuardError(
      `PLATFORM_ENV must be exactly "local" (found ${JSON.stringify(env.PLATFORM_ENV ?? null)}).`,
    );
  }

  const project = env.GCLOUD_PROJECT;
  if (project !== PROJECT_ID) {
    throw new PreviewGuardError(
      `the Firebase project must be exactly "${PROJECT_ID}" (found ${JSON.stringify(project ?? null)}).`,
    );
  }

  for (const name of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST"]) {
    const value = env[name];
    if (typeof value !== "string" || value.length === 0) {
      throw new PreviewGuardError(`${name} is not set — the emulators are not the target.`);
    }
    if (!isLoopbackHost(hostOfHostPort(value))) {
      throw new PreviewGuardError(`${name} ("${value}") is not a loopback address.`);
    }
  }

  const gate = env.PURCHASE_ADMISSION_GATE_MODE;
  if (gate !== undefined && gate !== "" && gate !== "off") {
    throw new PreviewGuardError(
      `PURCHASE_ADMISSION_GATE_MODE is "${gate}". The Commercial admission gate must stay off for the preview.`,
    );
  }

  // Credentials that could point the Admin SDK at a real project must not be present.
  for (const name of ["GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_TOKEN"]) {
    if (typeof env[name] === "string" && env[name].length > 0) {
      throw new PreviewGuardError(
        `${name} is set. Unset it — the preview must never hold real Google credentials.`,
      );
    }
  }

  if (postgresUrl !== undefined) assertLocalPostgres(postgresUrl);
}

/**
 * The environment every preview child process (emulators, seed) runs with, with the
 * guard-relevant values forced to their only permitted settings.
 */
export function buildPreviewEnv(baseEnv, { postgresUrl, ports }) {
  const env = { ...baseEnv };
  env.PLATFORM_ENV = "local";
  env.PLATFORM_POSTGRES_URL = postgresUrl;
  env.GCLOUD_PROJECT = PROJECT_ID;
  env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${ports.firestore}`;
  env.FIREBASE_AUTH_EMULATOR_HOST = `127.0.0.1:${ports.auth}`;
  // The gate is never inherited from the caller's shell.
  delete env.PURCHASE_ADMISSION_GATE_MODE;
  delete env.HELD_PURCHASE_PROCESSOR_MODE;
  delete env.GOOGLE_APPLICATION_CREDENTIALS;
  delete env.FIREBASE_TOKEN;
  env.NO_PROXY = appendNoProxy(env.NO_PROXY);
  env.no_proxy = env.NO_PROXY;
  return env;
}

function appendNoProxy(existing) {
  const required = ["localhost", "127.0.0.1", "::1"];
  const present = new Set((existing ?? "").split(",").map((s) => s.trim()).filter(Boolean));
  for (const host of required) present.add(host);
  return [...present].join(",");
}
