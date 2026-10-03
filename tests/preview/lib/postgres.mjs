// Founder Preview (EA-002) — local PostgreSQL integration, reusing the repository's own
// mechanisms: `docker-compose.postgres.yml` for the container, the compiled
// `functions` migration runner (`migrateUp`) for the schema, and the existing
// `loadPostgresConfig` / `createPostgresPool` for the connection. No new database
// layer is introduced.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import {
  DEFAULT_POSTGRES_URL,
  POSTGRES_URL_ENV,
  composeFile,
  functionsDir,
  migrationsDir,
  ports,
  repoRoot,
} from "./config.mjs";
import { assertLocalPostgres } from "./guards.mjs";

const requireFromFunctions = createRequire(path.join(functionsDir, "package.json"));

export function resolvePostgresUrl(env = process.env) {
  const explicit = env[POSTGRES_URL_ENV];
  const url = typeof explicit === "string" && explicit.trim().length > 0 ? explicit : DEFAULT_POSTGRES_URL;
  assertLocalPostgres(url);
  return url;
}

/** True when the URL is the project's own Docker-compose default (so `docker compose` owns it). */
export function usesComposeDatabase(env = process.env) {
  const explicit = env[POSTGRES_URL_ENV];
  return !(typeof explicit === "string" && explicit.trim().length > 0);
}

export function startComposePostgres() {
  const result = spawnSync("docker", ["compose", "-f", composeFile, "up", "-d", "--wait"], {
    cwd: repoRoot,
    env: { ...process.env, PREVIEW_POSTGRES_PORT: String(ports.postgres) },
    stdio: "inherit",
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      "Could not start the local PostgreSQL container (`docker compose … up -d --wait`). " +
        `Start Docker, or point ${POSTGRES_URL_ENV} at an already-running local PostgreSQL ` +
        "(database eleventhonus_platform_local).",
    );
  }
}

function newPgClient(connectionString) {
  const { Client } = requireFromFunctions("pg");
  return new Client({ connectionString });
}

export async function waitForPostgres(url, { timeoutMs = 60_000 } = {}) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    const client = newPgClient(url);
    try {
      await client.connect();
      await client.query("select 1");
      await client.end();
      return;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`PostgreSQL did not become reachable at the preview URL: ${lastError?.message}`);
}

export async function withClient(url, fn) {
  assertLocalPostgres(url);
  const client = newPgClient(url);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Drops and recreates the `public` schema of the preview database (guarded). */
export async function resetPostgresSchema(url) {
  assertLocalPostgres(url);
  await withClient(url, async (client) => {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
  });
}

/** Applies every pending canonical migration using the repository's own runner. */
export async function migratePostgres(url) {
  assertLocalPostgres(url);
  const { migrateUp } = requireFromFunctions("./lib/infrastructure/postgres/migrationRunner.js");
  const { createPostgresPool, closePostgresPool } = requireFromFunctions(
    "./lib/infrastructure/postgres/postgresPool.js",
  );
  const { loadPostgresConfig } = requireFromFunctions(
    "./lib/infrastructure/postgres/postgresConfig.js",
  );
  const pool = createPostgresPool(
    loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_URL: url }),
  );
  try {
    return await migrateUp(pool, migrationsDir);
  } finally {
    await closePostgresPool(pool);
  }
}

/** A pool for in-process seed services (same pool factory the Functions use). */
export function createSeedPool(url) {
  assertLocalPostgres(url);
  const { createPostgresPool } = requireFromFunctions("./lib/infrastructure/postgres/postgresPool.js");
  const { loadPostgresConfig } = requireFromFunctions(
    "./lib/infrastructure/postgres/postgresConfig.js",
  );
  return createPostgresPool(loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_URL: url }));
}
