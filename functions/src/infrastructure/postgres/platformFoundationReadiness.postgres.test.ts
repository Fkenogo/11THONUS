/**
 * Real PostgreSQL Platform Foundation Readiness tests (PLATFORM-BASELINE-001).
 *
 * Requires a live PostgreSQL instance (`PLATFORM_POSTGRES_URL`, see
 * `docker-compose.postgres.yml`). Proves the migration-state portion of the
 * readiness contract against a real database — that readiness is strictly
 * read-only (never creates `schema_migrations`) and that it verifies
 * migration integrity (checksum + identity) rather than only comparing
 * versions. Firestore-dependent checks are stubbed; they are covered
 * separately by the emulator suite.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Firestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./postgresConfig";
import { createPostgresPool, closePostgresPool, type PlatformPostgresPool } from "./postgresPool";
import { migrateUp } from "./migrationRunner";
import { checkPlatformFoundationReadiness } from "./platformFoundationReadiness";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "__fixtures__", "migrations");
// The package's actual shipped migrations directory (intentionally empty of
// `.sql` files — see migrations/README.md). Used to prove the empty-shipped-
// set behaviour, not just the throwaway fixture directory.
const shippedMigrationsDir = path.join(__dirname, "migrations");

const firestoreStub = {} as Firestore;

let pool: PlatformPostgresPool;

beforeAll(() => {
  if (!process.env.PLATFORM_POSTGRES_URL && process.env.PLATFORM_ENV !== "test") {
    throw new Error(
      "This test requires a live PostgreSQL instance. Set PLATFORM_ENV=test (and optionally " +
        "PLATFORM_POSTGRES_URL) and run `docker compose -f docker-compose.postgres.yml up -d` first.",
    );
  }
  pool = createPostgresPool(loadPostgresConfig());
});

afterEach(async () => {
  await pool.query("DROP TABLE IF EXISTS platform_baseline_001_migration_fixture_widgets");
  await pool.query("DROP TABLE IF EXISTS schema_migrations");
});

afterAll(async () => {
  await closePostgresPool(pool);
});

function readinessDeps() {
  return {
    postgresPool: pool,
    migrationsDir: fixturesDir,
    firestore: firestoreStub,
    checkPlatformAdministratorEstablished: async () => true,
    checkCommerceKnowledgeBaselineEstablished: async () => true,
  };
}

describe("checkPlatformFoundationReadiness — migration state against a real PostgreSQL instance", () => {
  it("reports migration foundation not established on a fresh database and does not create schema_migrations", async () => {
    const result = await checkPlatformFoundationReadiness(readinessDeps());

    expect(result.ready).toBe(false);
    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(false);
    expect(migration?.reason).toMatch(/not established/);

    const probe = await pool.query("SELECT to_regclass('schema_migrations') AS t");
    expect(probe.rows[0].t).toBeNull();
  });

  it("reports ready once all migrations are applied and intact", async () => {
    await migrateUp(pool, fixturesDir);

    const result = await checkPlatformFoundationReadiness(readinessDeps());

    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(true);
  });

  it("reports not-ready when an applied migration's checksum no longer matches its file", async () => {
    await migrateUp(pool, fixturesDir);
    await pool.query("UPDATE schema_migrations SET checksum = $1 WHERE version = $2", [
      "deadbeef",
      "0001",
    ]);

    const result = await checkPlatformFoundationReadiness(readinessDeps());

    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(false);
    expect(migration?.reason).toMatch(/checksum mismatch/);
  });

  it("reports not-ready when an applied migration's identity no longer matches its file", async () => {
    await migrateUp(pool, fixturesDir);
    await pool.query("UPDATE schema_migrations SET name = $1 WHERE version = $2", [
      "renamed",
      "0001",
    ]);

    const result = await checkPlatformFoundationReadiness(readinessDeps());

    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(false);
    expect(migration?.reason).toMatch(/does not match/);
  });

  it("reports not-ready when a migration is pending", async () => {
    await migrateUp(pool, fixturesDir);
    await pool.query("DELETE FROM schema_migrations WHERE version = $1", ["0002"]);

    const result = await checkPlatformFoundationReadiness(readinessDeps());

    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(false);
    expect(migration?.reason).toMatch(/pending migration/);
  });
});

describe("checkPlatformFoundationReadiness — actual shipped (empty) migrations directory", () => {
  function shippedReadinessDeps() {
    return {
      postgresPool: pool,
      migrationsDir: shippedMigrationsDir,
      firestore: firestoreStub,
      checkPlatformAdministratorEstablished: async () => true,
      checkCommerceKnowledgeBaselineEstablished: async () => true,
    };
  }

  it("Case A: a fresh database with an empty shipped migration set is NOT ready (schema_migrations absent) and stays read-only", async () => {
    const result = await checkPlatformFoundationReadiness(shippedReadinessDeps());

    expect(result.ready).toBe(false);
    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(false);
    expect(migration?.reason).toMatch(/not established/);

    const probe = await pool.query("SELECT to_regclass('schema_migrations') AS t");
    expect(probe.rows[0].t).toBeNull();
  });

  it("Case B: after the explicit bootstrap path creates schema_migrations, an empty migration set reports ready", async () => {
    const bootstrapped = await migrateUp(pool, shippedMigrationsDir);
    expect(bootstrapped.applied).toEqual([]);

    const result = await checkPlatformFoundationReadiness(shippedReadinessDeps());

    const migration = result.checks.find((c) => c.name === "migration_state");
    expect(migration?.ready).toBe(true);
  });
});
