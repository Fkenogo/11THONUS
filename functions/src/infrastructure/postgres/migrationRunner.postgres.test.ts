/**
 * Real PostgreSQL migration-mechanism tests (PLATFORM-BASELINE-001).
 *
 * Requires a live PostgreSQL instance (`PLATFORM_POSTGRES_URL`, see
 * `docker-compose.postgres.yml`). Runs against a throwaway fixture
 * migrations directory (`__fixtures__/migrations`) — never the package's
 * real, intentionally-empty `migrations/` directory — so this test proves
 * the mechanism itself without depending on, or risking, any future
 * domain's real migration set.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./postgresConfig";
import { createPostgresPool, closePostgresPool, type PlatformPostgresPool } from "./postgresPool";
import {
  discoverMigrationFiles,
  getAppliedMigrations,
  migrateDown,
  migrateUp,
} from "./migrationRunner";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "__fixtures__", "migrations");

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
  // Reset to a clean-empty-database state for the next test: drop the
  // fixture's own tables and every recorded migration row.
  await pool.query("DROP TABLE IF EXISTS platform_baseline_001_migration_fixture_widgets");
  await pool.query("DROP TABLE IF EXISTS schema_migrations");
});

afterAll(async () => {
  await closePostgresPool(pool);
});

describe("migrateUp / migrateDown against a real PostgreSQL instance", () => {
  it("discovers the fixture migrations in version order", async () => {
    const files = await discoverMigrationFiles(fixturesDir);
    expect(files.map((f) => f.version)).toEqual(["0001", "0002"]);
  });

  it("bootstraps a clean empty database and applies migrations in order", async () => {
    const result = await migrateUp(pool, fixturesDir);
    expect(result.applied).toEqual(["0001", "0002"]);
    expect(result.alreadyApplied).toEqual([]);

    const table = await pool.query(
      "SELECT to_regclass('platform_baseline_001_migration_fixture_widgets') AS reg",
    );
    expect(table.rows[0].reg).not.toBeNull();
  });

  it("persists migration state so current-version detection survives a fresh pool", async () => {
    await migrateUp(pool, fixturesDir);

    const otherPool = createPostgresPool(loadPostgresConfig());
    try {
      const applied = await getAppliedMigrations(otherPool);
      expect(applied.map((a) => a.version)).toEqual(["0001", "0002"]);
    } finally {
      await closePostgresPool(otherPool);
    }
  });

  it("re-running migrateUp against an already-migrated database is a safe no-op (no destructive reset)", async () => {
    await migrateUp(pool, fixturesDir);
    const before = await pool.query(
      "SELECT count(*)::int AS count FROM platform_baseline_001_migration_fixture_widgets",
    );

    const second = await migrateUp(pool, fixturesDir);
    expect(second.applied).toEqual([]);
    expect(second.alreadyApplied).toEqual(["0001", "0002"]);

    const after = await pool.query(
      "SELECT count(*)::int AS count FROM platform_baseline_001_migration_fixture_widgets",
    );
    expect(after.rows[0].count).toBe(before.rows[0].count);
  });

  it("rolls back the most recent migration via its .down.sql file", async () => {
    await migrateUp(pool, fixturesDir);

    const rollback = await migrateDown(pool, fixturesDir, 1);
    expect(rollback.rolledBack).toEqual(["0002"]);

    const applied = await getAppliedMigrations(pool);
    expect(applied.map((a) => a.version)).toEqual(["0001"]);

    const table = await pool.query(
      "SELECT to_regclass('platform_baseline_001_migration_fixture_widgets') AS reg",
    );
    expect(table.rows[0].reg).not.toBeNull(); // 0001's table remains; only 0002's column rollback applied
  });

  it("re-applying after a rollback re-runs the rolled-back migration", async () => {
    await migrateUp(pool, fixturesDir);
    await migrateDown(pool, fixturesDir, 1);

    const reapplied = await migrateUp(pool, fixturesDir);
    expect(reapplied.applied).toEqual(["0002"]);

    const applied = await getAppliedMigrations(pool);
    expect(applied.map((a) => a.version)).toEqual(["0001", "0002"]);
  });

  it("fails closed when an earlier migration is missing from history (gap — never applies the missing one out of order)", async () => {
    await migrateUp(pool, fixturesDir);
    await pool.query("DELETE FROM schema_migrations WHERE version = $1", ["0001"]);

    await expect(migrateUp(pool, fixturesDir)).rejects.toThrow(/exact ordered prefix/);

    const applied = await getAppliedMigrations(pool);
    expect(applied.map((a) => a.version)).toEqual(["0002"]);
  });

  it("fails closed on an unknown applied migration", async () => {
    await migrateUp(pool, fixturesDir);
    await pool.query(
      "INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)",
      ["9999", "ghost", "deadbeef"],
    );

    await expect(migrateUp(pool, fixturesDir)).rejects.toThrow(/Unknown applied migration/);
  });

  it("fails closed on a checksum mismatch (an applied migration edited after application)", async () => {
    await migrateUp(pool, fixturesDir);
    await pool.query("UPDATE schema_migrations SET checksum = $1 WHERE version = $2", [
      "deadbeef",
      "0001",
    ]);

    await expect(migrateUp(pool, fixturesDir)).rejects.toThrow(/checksum mismatch/);
  });

  it("fails closed on a migration identity/name mismatch", async () => {
    await migrateUp(pool, fixturesDir);
    await pool.query("UPDATE schema_migrations SET name = $1 WHERE version = $2", [
      "renamed",
      "0001",
    ]);

    await expect(migrateUp(pool, fixturesDir)).rejects.toThrow(/does not match/);
  });
});
