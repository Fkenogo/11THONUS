/**
 * PostgreSQL application configuration boundary (PLATFORM-BASELINE-001).
 *
 * Single source of truth for how this Functions runtime locates and
 * connects to the platform's future PostgreSQL-authoritative loyalty-spine
 * datastore (`DEC-DATA-008`). This module owns environment-variable
 * validation only — it holds no connection, no pool, and performs no I/O.
 *
 * Fail-closed by design: a `production` `PLATFORM_ENV` with a missing
 * `PLATFORM_POSTGRES_URL` throws immediately rather than silently falling
 * back to any default connection target. There is no built-in default
 * host/credential that could ever resolve to a real, shared, or production
 * database — the only defaults this module supplies are scoped to
 * `PLATFORM_ENV=local` and `PLATFORM_ENV=test`, and are documented as such
 * below. `PLATFORM_ENV` itself has no default; it must always be set
 * explicitly, so a misconfigured deployment fails loudly rather than
 * silently behaving as "local".
 *
 * Carries no provider-specific hosting assumption and does not provision
 * Cloud SQL — `PLATFORM_POSTGRES_URL` may point at any standard
 * PostgreSQL-wire-compatible endpoint (a local Docker container, Cloud SQL
 * via the Cloud SQL Auth Proxy, or any other host); this module only reads
 * the value.
 */

export type PlatformEnvironment = "local" | "test" | "production";

/** Local-only default — a disposable Docker Postgres for interactive development (`docker-compose.postgres.yml`). Never used when `PLATFORM_ENV=production`. */
const LOCAL_DEFAULT_URL =
  "postgres://postgres:postgres@localhost:54329/eleventhonus_platform_local";

/** Test-only default — the same disposable local Postgres, a separate database name to keep test and interactive-dev state apart. Never used when `PLATFORM_ENV=production`. */
const TEST_DEFAULT_URL = "postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test";

export type PostgresConfig = {
  readonly connectionString: string;
  readonly environment: PlatformEnvironment;
  readonly ssl: boolean;
  readonly poolMax: number;
  readonly idleTimeoutMillis: number;
  readonly connectionTimeoutMillis: number;
};

function resolvePlatformEnvironment(env: NodeJS.ProcessEnv): PlatformEnvironment {
  const raw = env.PLATFORM_ENV;
  if (raw === "local" || raw === "test" || raw === "production") {
    return raw;
  }
  if (raw === undefined || raw.trim().length === 0) {
    throw new Error(
      'PLATFORM_ENV is required (one of "local", "test", "production") and was not set. ' +
        "This is a fail-closed guard: no PostgreSQL connection target is ever assumed by default.",
    );
  }
  throw new Error(`PLATFORM_ENV must be one of "local", "test", "production"; received "${raw}".`);
}

function resolveConnectionString(env: NodeJS.ProcessEnv, environment: PlatformEnvironment): string {
  const explicit = env.PLATFORM_POSTGRES_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit;
  }
  if (environment === "production") {
    throw new Error(
      'PLATFORM_POSTGRES_URL is required when PLATFORM_ENV="production" and was not set. ' +
        "This module never falls back to a local/shared default outside local/test environments.",
    );
  }
  return environment === "test" ? TEST_DEFAULT_URL : LOCAL_DEFAULT_URL;
}

/**
 * A positive base-10 integer with no leading zeros, sign, decimal point,
 * or any other character. An explicitly set value must match this in full
 * (after trimming surrounding whitespace) — `Number.parseInt`'s partial
 * parsing of strings like `3workers`, `1000ms`, or `1.5` is deliberately
 * not used, so malformed explicit configuration fails closed instead of
 * silently normalising to a different value.
 */
const POSITIVE_INT_PATTERN = /^[1-9][0-9]*$/;

function resolvePositiveInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined) {
    return fallback;
  }
  const trimmed = raw.trim();
  if (!POSITIVE_INT_PATTERN.test(trimmed)) {
    throw new Error(`${key} must be a positive base-10 integer; received "${raw}".`);
  }
  return Number.parseInt(trimmed, 10);
}

function resolveSsl(env: NodeJS.ProcessEnv, environment: PlatformEnvironment): boolean {
  const raw = env.PLATFORM_POSTGRES_SSL;
  // Absent or empty/whitespace-only: use the governed environment default
  // (production requires SSL; local/test default to none).
  if (raw === undefined || raw.trim().length === 0) {
    return environment === "production";
  }
  // An explicitly supplied value must be exactly the documented lowercase
  // "true" or "false" — any other value (including casing variants such as
  // "TRUE" or a typo like "treu") is a malformed explicit setting and
  // fails closed rather than silently selecting the environment default.
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new Error(
    `PLATFORM_POSTGRES_SSL must be "true" or "false" (lowercase); received "${raw}".`,
  );
}

/**
 * Reads and validates PostgreSQL configuration from `process.env` (or an
 * injected env map, for tests). Throws synchronously on any invalid or
 * unsafely-missing value. Performs no I/O and opens no connection — it
 * only decides whether one may safely be attempted.
 */
export function loadPostgresConfig(env: NodeJS.ProcessEnv = process.env): PostgresConfig {
  const environment = resolvePlatformEnvironment(env);
  const connectionString = resolveConnectionString(env, environment);
  const ssl = resolveSsl(env, environment);
  const poolMax = resolvePositiveInt(env, "PLATFORM_POSTGRES_POOL_MAX", 3);
  const idleTimeoutMillis = resolvePositiveInt(env, "PLATFORM_POSTGRES_IDLE_TIMEOUT_MS", 10_000);
  const connectionTimeoutMillis = resolvePositiveInt(
    env,
    "PLATFORM_POSTGRES_CONNECTION_TIMEOUT_MS",
    5_000,
  );

  return {
    connectionString,
    environment,
    ssl,
    poolMax,
    idleTimeoutMillis,
    connectionTimeoutMillis,
  };
}
