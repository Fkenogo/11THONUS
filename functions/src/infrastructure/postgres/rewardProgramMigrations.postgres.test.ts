/**
 * Real PostgreSQL migration tests for the Reward Program schema
 * (`PLATFORM-BASELINE-005A`).
 *
 * Unlike `migrationRunner.postgres.test.ts` (which proves the migration
 * *mechanism* against a throwaway fixture), this file runs the package's
 * real, shipped `migrations/` directory — the first time it has ever
 * contained real product migrations (`PLATFORM-BASELINE-001` shipped it
 * empty). Requires a live PostgreSQL instance.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./postgresConfig";
import { createPostgresPool, closePostgresPool, type PlatformPostgresPool } from "./postgresPool";
import {
  discoverMigrationFiles,
  getAppliedMigrations,
  migrateDown,
  migrateUp,
} from "./migrationRunner";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "migrations");

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

async function dropAll() {
  await pool.query("DROP TABLE IF EXISTS reward_program_version_qualifying_nodes CASCADE");
  await pool.query("DROP TABLE IF EXISTS reward_program_outbox CASCADE");
  await pool.query("DROP TABLE IF EXISTS idempotency_keys CASCADE");
  await pool.query(
    "ALTER TABLE IF EXISTS reward_programs DROP CONSTRAINT IF EXISTS reward_programs_current_version_id_fkey",
  );
  await pool.query("DROP TABLE IF EXISTS reward_program_versions CASCADE");
  await pool.query("DROP TABLE IF EXISTS reward_programs CASCADE");
  await pool.query("DROP TABLE IF EXISTS schema_migrations");
}

afterEach(async () => {
  await dropAll();
});

afterAll(async () => {
  await closePostgresPool(pool);
});

describe("Reward Program migrations against a real PostgreSQL instance", () => {
  it("discovers all five migrations in version order", async () => {
    const files = await discoverMigrationFiles(migrationsDir);
    expect(files.map((f) => f.version)).toEqual(["0001", "0002", "0003", "0004", "0005"]);
  });

  it("bootstraps a clean empty database and applies all migrations in order", async () => {
    const result = await migrateUp(pool, migrationsDir);
    expect(result.applied).toEqual(["0001", "0002", "0003", "0004", "0005"]);

    for (const table of [
      "reward_programs",
      "reward_program_versions",
      "reward_program_version_qualifying_nodes",
      "idempotency_keys",
      "reward_program_outbox",
    ]) {
      const check = await pool.query("SELECT to_regclass($1) AS reg", [table]);
      expect(check.rows[0].reg, `expected table "${table}" to exist`).not.toBeNull();
    }
  });

  it("re-running migrateUp against an already-migrated database is a safe no-op", async () => {
    await migrateUp(pool, migrationsDir);
    const second = await migrateUp(pool, migrationsDir);
    expect(second.applied).toEqual([]);
    expect(second.alreadyApplied).toEqual(["0001", "0002", "0003", "0004", "0005"]);
  });

  it("rolls back the full migration set and re-applies cleanly", async () => {
    await migrateUp(pool, migrationsDir);
    await migrateDown(pool, migrationsDir, 5);

    for (const table of [
      "reward_programs",
      "reward_program_versions",
      "idempotency_keys",
      "reward_program_outbox",
    ]) {
      const check = await pool.query("SELECT to_regclass($1) AS reg", [table]);
      expect(check.rows[0].reg, `expected table "${table}" to be dropped`).toBeNull();
    }

    const reapplied = await migrateUp(pool, migrationsDir);
    expect(reapplied.applied).toEqual(["0001", "0002", "0003", "0004", "0005"]);
    const applied = await getAppliedMigrations(pool);
    expect(applied.map((a) => a.version)).toEqual(["0001", "0002", "0003", "0004", "0005"]);
  });

  describe("schema constraints", () => {
    // The outer top-level `afterEach` (`dropAll`) runs after every test in
    // this nested block too (innermost-first: this block's own hooks run,
    // then the outer one drops every table) — so migrations must be
    // re-applied before EACH test here, not once via `beforeAll`.
    beforeEach(async () => {
      await migrateUp(pool, migrationsDir);
    });

    async function insertProgram(overrides: Partial<{ id: string; businessId: string }> = {}) {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO reward_programs (business_id, display_name, reward_program_category_id, status, created_by, updated_by)
         VALUES ($1, 'Test Program', 'cat-1', 'draft', 'user-1', 'user-1') RETURNING id`,
        [overrides.businessId ?? "biz-1"],
      );
      return result.rows[0].id;
    }

    it("rejects required_verified_units != 10", async () => {
      const programId = await insertProgram();
      await expect(
        pool.query(
          `INSERT INTO reward_program_versions
             (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
           VALUES ($1, 1, 11, 1, false, 'desc', now(), 'draft', 'user-1')`,
          [programId],
        ),
      ).rejects.toThrow(/check constraint/i);
    });

    it("rejects reward_quantity != 1", async () => {
      const programId = await insertProgram();
      await expect(
        pool.query(
          `INSERT INTO reward_program_versions
             (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
           VALUES ($1, 1, 10, 2, false, 'desc', now(), 'draft', 'user-1')`,
          [programId],
        ),
      ).rejects.toThrow(/check constraint/i);
    });

    it("rejects a duplicate version number for the same program", async () => {
      const programId = await insertProgram();
      const insertVersion = () =>
        pool.query(
          `INSERT INTO reward_program_versions
             (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
           VALUES ($1, 1, 10, 1, false, 'desc', now(), 'draft', 'user-1')`,
          [programId],
        );
      await insertVersion();
      await expect(insertVersion()).rejects.toThrow(/duplicate key/i);
    });

    it("rejects a second 'active' version for the same program (partial unique index)", async () => {
      const programId = await insertProgram();
      const insertActive = (version: number) =>
        pool.query(
          `INSERT INTO reward_program_versions
             (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
           VALUES ($1, $2, 10, 1, false, 'desc', now(), 'active', 'user-1')`,
          [programId, version],
        );
      await insertActive(1);
      await expect(insertActive(2)).rejects.toThrow(/duplicate key/i);
    });

    it("allows one active and any number of superseded versions for the same program", async () => {
      const programId = await insertProgram();
      await pool.query(
        `INSERT INTO reward_program_versions
           (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
         VALUES ($1, 1, 10, 1, false, 'desc', now(), 'superseded', 'user-1')`,
        [programId],
      );
      await pool.query(
        `INSERT INTO reward_program_versions
           (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
         VALUES ($1, 2, 10, 1, false, 'desc', now(), 'active', 'user-1')`,
        [programId],
      );
      const count = await pool.query(
        "SELECT count(*) FROM reward_program_versions WHERE reward_program_id = $1",
        [programId],
      );
      expect(Number(count.rows[0].count)).toBe(2);
    });

    it("rejects a qualifying-node row referencing a non-existent version", async () => {
      await expect(
        pool.query(
          `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id)
           VALUES ($1, 'node-1')`,
          ["00000000-0000-0000-0000-000000000000"],
        ),
      ).rejects.toThrow(/foreign key/i);
    });

    it("rejects a duplicate qualifying-node reference within the same version", async () => {
      const programId = await insertProgram();
      const versionResult = await pool.query<{ id: string }>(
        `INSERT INTO reward_program_versions
           (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
         VALUES ($1, 1, 10, 1, false, 'desc', now(), 'draft', 'user-1') RETURNING id`,
        [programId],
      );
      const versionId = versionResult.rows[0].id;
      const insertNode = () =>
        pool.query(
          `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id)
           VALUES ($1, 'node-1')`,
          [versionId],
        );
      await insertNode();
      await expect(insertNode()).rejects.toThrow(/duplicate key/i);
    });
  });
});
