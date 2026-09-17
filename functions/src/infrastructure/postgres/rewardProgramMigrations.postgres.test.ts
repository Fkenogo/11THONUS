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
import { mkdtemp, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
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
  // PLATFORM-BASELINE-006A tables first (reverse dependency order), then
  // the Reward Program tables they reference.
  await pool.query("DROP TABLE IF EXISTS purchase_outbox CASCADE");
  await pool.query("DROP TABLE IF EXISTS notification_intents CASCADE");
  await pool.query("DROP TABLE IF EXISTS trust_events CASCADE");
  await pool.query("DROP TABLE IF EXISTS rewards CASCADE");
  await pool.query("DROP TABLE IF EXISTS verified_unit_allocation_events CASCADE");
  await pool.query("DROP TABLE IF EXISTS verified_unit_allocations CASCADE");
  await pool.query("DROP TABLE IF EXISTS loyalty_cycles CASCADE");
  await pool.query("DROP TABLE IF EXISTS loyalty_cycle_streams CASCADE");
  await pool.query("DROP TABLE IF EXISTS verified_units CASCADE");
  await pool.query("DROP TABLE IF EXISTS purchase_record_events CASCADE");
  await pool.query("DROP TABLE IF EXISTS purchase_records CASCADE");
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
  it("discovers all fifteen migrations in version order", async () => {
    const files = await discoverMigrationFiles(migrationsDir);
    expect(files.map((f) => f.version)).toEqual([
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009",
      "0010",
      "0011",
      "0012",
      "0013",
      "0014",
      "0015",
    ]);
  });

  it("bootstraps a clean empty database and applies all migrations in order", async () => {
    const result = await migrateUp(pool, migrationsDir);
    expect(result.applied).toEqual([
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009",
      "0010",
      "0011",
      "0012",
      "0013",
      "0014",
      "0015",
    ]);

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
    expect(second.alreadyApplied).toEqual([
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009",
      "0010",
      "0011",
      "0012",
      "0013",
      "0014",
      "0015",
    ]);
  });

  it("rolls back the full migration set and re-applies cleanly", async () => {
    await migrateUp(pool, migrationsDir);
    await migrateDown(pool, migrationsDir, 15);

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
    expect(reapplied.applied).toEqual([
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009",
      "0010",
      "0011",
      "0012",
      "0013",
      "0014",
      "0015",
    ]);
    const applied = await getAppliedMigrations(pool);
    expect(applied.map((a) => a.version)).toEqual([
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009",
      "0010",
      "0011",
      "0012",
      "0013",
      "0014",
      "0015",
    ]);
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

    /**
     * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
     * `FD-REWARD-QUALIFICATION-001`): `reward_program_category_id` is now
     * nullable at the database layer (migration `0015`).
     */
    it("allows a NULL reward_program_category_id on a new row", async () => {
      const result = await pool.query<{ id: string; reward_program_category_id: string | null }>(
        `INSERT INTO reward_programs (business_id, display_name, reward_program_category_id, status, created_by, updated_by)
         VALUES ('biz-1', 'Test Program (no category)', NULL, 'draft', 'user-1', 'user-1')
         RETURNING id, reward_program_category_id`,
      );
      expect(result.rows[0].reward_program_category_id).toBeNull();
    });

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

    it("rejects a current_version_id pointing at another program's version (same-program composite FK, PLATFORM-BASELINE-005A-CORR-001)", async () => {
      const programA = await insertProgram({ businessId: "biz-A" });
      const programB = await insertProgram({ businessId: "biz-B" });
      const versionB = await pool.query<{ id: string }>(
        `INSERT INTO reward_program_versions
           (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
         VALUES ($1, 1, 10, 1, false, 'desc', now(), 'active', 'user-1') RETURNING id`,
        [programB],
      );
      // The old single-column FK accepted this; the composite
      // (current_version_id, id) FK must reject it at the database layer.
      await expect(
        pool.query("UPDATE reward_programs SET current_version_id = $1 WHERE id = $2", [
          versionB.rows[0].id,
          programA,
        ]),
      ).rejects.toThrow(/foreign key/i);

      // The SAME program's own version remains acceptable.
      const versionA = await pool.query<{ id: string }>(
        `INSERT INTO reward_program_versions
           (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
         VALUES ($1, 1, 10, 1, false, 'desc', now(), 'active', 'user-1') RETURNING id`,
        [programA],
      );
      await pool.query("UPDATE reward_programs SET current_version_id = $1 WHERE id = $2", [
        versionA.rows[0].id,
        programA,
      ]);
      const check = await pool.query<{ current_version_id: string }>(
        "SELECT current_version_id FROM reward_programs WHERE id = $1",
        [programA],
      );
      expect(check.rows[0].current_version_id).toBe(versionA.rows[0].id);
    });

    it("enforces at most one editable draft per program (partial unique index, PLATFORM-BASELINE-005A-CORR-001 Finding 1)", async () => {
      const programId = await insertProgram();
      const insertDraft = (version: number) =>
        pool.query(
          `INSERT INTO reward_program_versions
             (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
           VALUES ($1, $2, 10, 1, false, 'desc', now(), 'draft', 'user-1')`,
          [programId, version],
        );
      await insertDraft(1);
      await expect(insertDraft(2)).rejects.toThrow(/duplicate key/i);

      // A published program's superseded history does not collide with the
      // single-draft rule: supersede v1, publish v2, then one new draft is
      // allowed.
      await pool.query("UPDATE reward_program_versions SET status = 'active' WHERE version = 1");
      await insertDraft(2);
      await pool.query(
        "UPDATE reward_program_versions SET status = 'superseded' WHERE version = 1",
      );
      await pool.query("UPDATE reward_program_versions SET status = 'active' WHERE version = 2");
      await insertDraft(3);
      const drafts = await pool.query<{ count: string }>(
        "SELECT count(*) FROM reward_program_versions WHERE reward_program_id = $1 AND status = 'draft'",
        [programId],
      );
      expect(Number(drafts.rows[0].count)).toBe(1);
    });
  });

  /**
   * `PLATFORM-BASELINE-010B` test plan item J: the migration must succeed
   * against a fixture table that already contains pre-existing rows, not
   * just an empty table -- and every such existing row's non-null
   * `reward_program_category_id` value must be left byte-for-byte
   * unchanged (`DROP COLUMN ... NOT NULL` is a pure constraint
   * relaxation, never a value rewrite).
   */
  describe("PLATFORM-BASELINE-010B: migration 0015 against pre-existing rows", () => {
    it("applying 0001-0014 then 0015 against a table with existing non-null-category rows preserves every existing value and allows a new NULL row afterward", async () => {
      // Apply only 0001-0014 first (the pre-010B baseline schema, copied
      // into a scratch directory so `migrateUp` -- which always applies
      // every file it finds -- cannot see 0015 yet), insert real rows
      // under the OLD NOT NULL constraint, THEN point it at the real
      // directory (which also has 0015) -- proving the migration itself
      // (not just the final schema) is safe against a table that already
      // has data, per its own doc comment.
      const allFiles = await discoverMigrationFiles(migrationsDir);
      const preBaselineFiles = allFiles.filter((f) => f.version !== "0015");
      const scratchDir = await mkdtemp(path.join(tmpdir(), "pb010b-baseline-migrations-"));
      try {
        for (const file of preBaselineFiles) {
          await copyFile(file.upPath, path.join(scratchDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(scratchDir, path.basename(file.downPath)));
          }
        }
        await migrateUp(pool, scratchDir);
      } finally {
        await rm(scratchDir, { recursive: true, force: true });
      }

      const seeded = await pool.query<{ id: string }>(
        `INSERT INTO reward_programs (business_id, display_name, reward_program_category_id, status, created_by, updated_by)
         VALUES
           ('biz-pre-1', 'Pre-existing Program 1', 'cat-legacy-1', 'draft', 'user-1', 'user-1'),
           ('biz-pre-2', 'Pre-existing Program 2', 'cat-legacy-2', 'active', 'user-1', 'user-1')
         RETURNING id`,
      );
      expect(seeded.rows).toHaveLength(2);

      const result = await migrateUp(pool, migrationsDir);
      expect(result.applied).toEqual(["0015"]);

      const preserved = await pool.query<{
        business_id: string;
        reward_program_category_id: string | null;
      }>(
        "SELECT business_id, reward_program_category_id FROM reward_programs ORDER BY business_id",
      );
      expect(preserved.rows).toEqual([
        { business_id: "biz-pre-1", reward_program_category_id: "cat-legacy-1" },
        { business_id: "biz-pre-2", reward_program_category_id: "cat-legacy-2" },
      ]);

      // And a brand-new row may now persist NULL, alongside the untouched
      // pre-existing non-null rows.
      const newRow = await pool.query<{ reward_program_category_id: string | null }>(
        `INSERT INTO reward_programs (business_id, display_name, reward_program_category_id, status, created_by, updated_by)
         VALUES ('biz-new', 'New Category-less Program', NULL, 'draft', 'user-1', 'user-1')
         RETURNING reward_program_category_id`,
      );
      expect(newRow.rows[0].reward_program_category_id).toBeNull();

      const total = await pool.query("SELECT count(*) FROM reward_programs");
      expect(Number(total.rows[0].count)).toBe(3);
    });
  });
});
