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
import { mkdtemp, copyFile, rm, readFile } from "node:fs/promises";
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
  // Defense-in-depth: the CORR-001 composite-FK probe test drops this
  // itself in `finally`, but a crashed run could leave it behind.
  await pool.query("DROP TABLE IF EXISTS purchase_binding_probe CASCADE");
  // PLATFORM-BASELINE-013A.1 tables first (they reference the Reward
  // Program tables and, for the junction, qualifying_items), then
  // PLATFORM-BASELINE-006A tables, then the Reward Program tables they
  // all reference.
  await pool.query("DROP TABLE IF EXISTS reward_program_version_qualifying_items CASCADE");
  await pool.query("DROP TABLE IF EXISTS qualifying_items CASCADE");
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
  // `PLATFORM-BASELINE-013E`: `IF EXISTS` -- post-0019 this table is
  // normally gone, but the fail-closed gate test below intentionally
  // leaves a surviving legacy table behind, and teardown must not leak
  // it into the next test's bootstrap.
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
  it("discovers all nineteen migrations in version order", async () => {
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
      "0016",
      "0017",
      "0018",
      "0019",
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
      "0016",
      "0017",
      "0018",
      "0019",
    ]);

    for (const table of [
      "reward_programs",
      "reward_program_versions",
      "idempotency_keys",
      "reward_program_outbox",
      "qualifying_items",
      "reward_program_version_qualifying_items",
    ]) {
      const check = await pool.query("SELECT to_regclass($1) AS reg", [table]);
      expect(check.rows[0].reg, `expected table "${table}" to exist`).not.toBeNull();
    }
    // `PLATFORM-BASELINE-013E`: migration 0019 drops the superseded
    // legacy junction -- it must NOT exist after a full migrateUp.
    const legacyGone = await pool.query("SELECT to_regclass($1) AS reg", [
      "reward_program_version_qualifying_nodes",
    ]);
    expect(
      legacyGone.rows[0].reg,
      'expected "reward_program_version_qualifying_nodes" to be dropped',
    ).toBeNull();
    // Timeout rationale (PLATFORM-BASELINE-013A.1-CORR-001 F3): a single
    // full `migrateUp` over all 17 migrations measured 1.9-3.8s across
    // repeated clean runs on this host (which persistently runs several
    // unrelated concurrent PostgreSQL containers) and 7.8s under one
    // observed spike of unusually heavy contention -- comfortably inside
    // vitest's 5000ms default most of the time, but not with reliable
    // margin. 15000ms gives ~2x headroom over the single worst measured
    // spike without masking a genuine regression (a real hang would still
    // fail). Applied only to this and the handful of other tests below
    // that perform a full `migrateUp`/`migrateDown` over the real
    // migrations directory -- every other test in this file keeps
    // vitest's plain defaults.
  }, 15000);

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
      "0016",
      "0017",
      "0018",
      "0019",
    ]);
  }, 15000);

  it("rolls back the full migration set and re-applies cleanly", async () => {
    await migrateUp(pool, migrationsDir);
    await migrateDown(pool, migrationsDir, 19);

    for (const table of [
      "reward_programs",
      "reward_program_versions",
      "idempotency_keys",
      "reward_program_outbox",
      "qualifying_items",
      "reward_program_version_qualifying_items",
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
      "0016",
      "0017",
      "0018",
      "0019",
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
      "0016",
      "0017",
      "0018",
      "0019",
    ]);
  }, 15000);

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
      //
      // Filters to a strict PREFIX ending before "0015" (not merely
      // "everything except 0015") -- PLATFORM-BASELINE-013A.1 added 0016
      // and 0017 AFTER 0015, so excluding only "0015" by itself would
      // leave a non-contiguous 0001-0014+0016+0017 set, which
      // `validateMigrationHistory` correctly rejects as a gap.
      const allFiles = await discoverMigrationFiles(migrationsDir);
      const preBaselineFiles = allFiles.filter((f) => f.version < "0015");
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
      // 0016/0017 (PLATFORM-BASELINE-013A.1) are also pending at this point
      // -- they were excluded from the scratch pre-baseline along with
      // 0015 -- and apply cleanly here too, as do 0018
      // (PLATFORM-BASELINE-013C) and 0019 (PLATFORM-BASELINE-013E, whose
      // equivalence gate passes on this fixture: the legacy table is
      // empty); none touches
      // reward_programs.reward_program_category_id, so they do not affect
      // this test's own assertions below.
      expect(result.applied).toEqual(["0015", "0016", "0017", "0018", "0019"]);

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
    }, 15000);
  });

  /**
   * `PLATFORM-BASELINE-013A.1` — the additive Business-owned Qualifying
   * Item persistence foundation (migrations `0016`/`0017`). Design:
   * `docs/05-implementation/reports/platform-baseline-012-business-owned-
   * qualifying-item-implementation-readiness-design-2026-09-18.md` §5/§6/
   * §8/§13. This package is persistence only — no application code reads
   * or writes either new table yet, so these tests prove the schema's own
   * invariants directly against raw SQL, not through any command layer.
   */
  describe("PLATFORM-BASELINE-013A.1: qualifying_items persistence foundation", () => {
    // No blanket `beforeEach` at this level: the backfill/rollback tests
    // below (Case K and its neighbours) must control migration
    // application precisely -- applying 0001-0016 first, inserting legacy
    // fixture rows, THEN applying 0017 so its backfill actually sees
    // them. A blanket full-`migrateUp` here would run 0017's backfill
    // against an empty legacy table before any test fixture exists. The
    // nested "schema constraints" describe below opts back into a full
    // `migrateUp` for the tests that just need the finished schema.
    async function insertProgram(overrides: Partial<{ businessId: string }> = {}) {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO reward_programs (business_id, display_name, reward_program_category_id, status, created_by, updated_by)
         VALUES ($1, 'Test Program', 'cat-1', 'draft', 'user-1', 'user-1') RETURNING id`,
        [overrides.businessId ?? "biz-1"],
      );
      return result.rows[0].id;
    }

    async function insertVersion(programId: string, version = 1) {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO reward_program_versions
           (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
         VALUES ($1, $2, 10, 1, false, 'desc', now(), 'draft', 'user-1') RETURNING id`,
        [programId, version],
      );
      return result.rows[0].id;
    }

    async function insertItem(
      overrides: Partial<{
        businessId: string;
        name: string;
        knowledgeNodeId: string | null;
        status: string;
        createdBy: string;
      }> = {},
    ) {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO qualifying_items (business_id, name, knowledge_node_id, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
        [
          overrides.businessId ?? "biz-1",
          overrides.name ?? "Black Coffee",
          overrides.knowledgeNodeId ?? null,
          overrides.status ?? "active",
          overrides.createdBy ?? "user-1",
        ],
      );
      return result.rows[0].id;
    }

    describe("schema constraints (finished 0001-0017 schema)", () => {
      beforeEach(async () => {
        await migrateUp(pool, migrationsDir);
      });

      it("creates a Business-owned qualifying item with no Commerce Knowledge mapping (Case A: optional mapping is genuinely optional)", async () => {
        const result = await pool.query<{
          id: string;
          business_id: string;
          name: string;
          knowledge_node_id: string | null;
          status: string;
          schema_version: number;
        }>(
          `INSERT INTO qualifying_items (business_id, name, knowledge_node_id, created_by, updated_by)
         VALUES ('biz-1', 'Black Coffee', NULL, 'user-1', 'user-1')
         RETURNING id, business_id, name, knowledge_node_id, status, schema_version`,
        );
        expect(result.rows[0]).toMatchObject({
          business_id: "biz-1",
          name: "Black Coffee",
          knowledge_node_id: null,
          status: "active",
          schema_version: 1,
        });
      });

      it("creates a Business-owned qualifying item WITH a Commerce Knowledge mapping (Case B)", async () => {
        const id = await insertItem({ name: "Medium Pizza", knowledgeNodeId: "node-pizza-1" });
        const result = await pool.query<{ knowledge_node_id: string | null }>(
          "SELECT knowledge_node_id FROM qualifying_items WHERE id = $1",
          [id],
        );
        expect(result.rows[0].knowledge_node_id).toBe("node-pizza-1");
      });

      it("two items for one Business coexist with distinct ids and neither affects the other (Case C)", async () => {
        const coffeeId = await insertItem({ name: "Black Coffee" });
        const pizzaId = await insertItem({ name: "Medium Pizza", knowledgeNodeId: "node-pizza-1" });
        expect(coffeeId).not.toBe(pizzaId);

        const rows = await pool.query<{ name: string }>(
          "SELECT name FROM qualifying_items WHERE business_id = 'biz-1' ORDER BY name",
        );
        expect(rows.rows.map((r) => r.name)).toEqual(["Black Coffee", "Medium Pizza"]);
      });

      it("rejects a NULL qualifying-item name (required field)", async () => {
        await expect(
          pool.query(
            `INSERT INTO qualifying_items (business_id, name, created_by, updated_by)
           VALUES ('biz-1', NULL, 'user-1', 'user-1')`,
          ),
        ).rejects.toThrow(/null value|not-null constraint/i);
      });

      it("rejects a NULL business_id (Business ownership is required)", async () => {
        await expect(
          pool.query(
            `INSERT INTO qualifying_items (business_id, name, created_by, updated_by)
           VALUES (NULL, 'Black Coffee', 'user-1', 'user-1')`,
          ),
        ).rejects.toThrow(/null value|not-null constraint/i);
      });

      it("defaults status to 'active' and rejects a status outside active/retired (lifecycle constraint)", async () => {
        const activeId = await pool.query<{ status: string }>(
          `INSERT INTO qualifying_items (business_id, name, created_by, updated_by)
         VALUES ('biz-1', 'Black Coffee', 'user-1', 'user-1') RETURNING status`,
        );
        expect(activeId.rows[0].status).toBe("active");

        await expect(
          pool.query(
            `INSERT INTO qualifying_items (business_id, name, status, created_by, updated_by)
           VALUES ('biz-1', 'Cappuccino', 'deleted', 'user-1', 'user-1')`,
          ),
        ).rejects.toThrow(/check constraint/i);

        const retired = await pool.query<{ status: string }>(
          `INSERT INTO qualifying_items (business_id, name, status, created_by, updated_by)
         VALUES ('biz-1', 'Seasonal Special', 'retired', 'user-1', 'user-1') RETURNING status`,
        );
        expect(retired.rows[0].status).toBe("retired");
      });

      it("rejects a junction row referencing a non-existent qualifying_item_id", async () => {
        const programId = await insertProgram();
        const versionId = await insertVersion(programId);
        await expect(
          pool.query(
            `INSERT INTO reward_program_version_qualifying_items
             (reward_program_version_id, qualifying_item_id, item_name_at_version)
           VALUES ($1, $2, 'Black Coffee')`,
            [versionId, "00000000-0000-0000-0000-000000000000"],
          ),
        ).rejects.toThrow(/foreign key/i);
      });

      it("rejects a junction row referencing a non-existent reward_program_version_id", async () => {
        const itemId = await insertItem();
        await expect(
          pool.query(
            `INSERT INTO reward_program_version_qualifying_items
             (reward_program_version_id, qualifying_item_id, item_name_at_version)
           VALUES ($1, $2, 'Black Coffee')`,
            ["00000000-0000-0000-0000-000000000000", itemId],
          ),
        ).rejects.toThrow(/foreign key/i);
      });

      it("rejects a duplicate qualifying-item reference within the same version (junction primary key)", async () => {
        const programId = await insertProgram();
        const versionId = await insertVersion(programId);
        const itemId = await insertItem();
        const insertJunction = () =>
          pool.query(
            `INSERT INTO reward_program_version_qualifying_items
             (reward_program_version_id, qualifying_item_id, item_name_at_version)
           VALUES ($1, $2, 'Black Coffee')`,
            [versionId, itemId],
          );
        await insertJunction();
        await expect(insertJunction()).rejects.toThrow(/duplicate key/i);
      });

      it("rejects a NULL item_name_at_version but allows a NULL knowledge_node_id_at_version (frozen name required, classification snapshot optional)", async () => {
        const programId = await insertProgram();
        const versionId = await insertVersion(programId);
        const itemId = await insertItem();

        await expect(
          pool.query(
            `INSERT INTO reward_program_version_qualifying_items
             (reward_program_version_id, qualifying_item_id, item_name_at_version)
           VALUES ($1, $2, NULL)`,
            [versionId, itemId],
          ),
        ).rejects.toThrow(/null value|not-null constraint/i);

        const ok = await pool.query<{ knowledge_node_id_at_version: string | null }>(
          `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
         VALUES ($1, $2, 'Black Coffee', NULL)
         RETURNING knowledge_node_id_at_version`,
          [versionId, itemId],
        );
        expect(ok.rows[0].knowledge_node_id_at_version).toBeNull();
      });

      it("preserves a rename's frozen historical snapshot: renaming the live item never alters an already-recorded junction row (Case I, schema level)", async () => {
        const programId = await insertProgram();
        const versionId = await insertVersion(programId);
        const itemId = await insertItem({ name: "Black Coffee" });
        await pool.query(
          `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version)
         VALUES ($1, $2, 'Black Coffee')`,
          [versionId, itemId],
        );

        await pool.query("UPDATE qualifying_items SET name = 'Espresso' WHERE id = $1", [itemId]);

        const frozen = await pool.query<{ item_name_at_version: string }>(
          `SELECT item_name_at_version FROM reward_program_version_qualifying_items
         WHERE reward_program_version_id = $1 AND qualifying_item_id = $2`,
          [versionId, itemId],
        );
        expect(frozen.rows[0].item_name_at_version).toBe("Black Coffee");

        const live = await pool.query<{ name: string }>(
          "SELECT name FROM qualifying_items WHERE id = $1",
          [itemId],
        );
        expect(live.rows[0].name).toBe("Espresso");
      });

      // (`PLATFORM-BASELINE-013E`: the legacy
      // `reward_program_version_qualifying_nodes` constraint/retention
      // tests were removed with the table dropped by migration 0019.
      // Backfill-equivalence coverage lives in Case K below and now in
      // the 0019 suite above, which must keep passing.)

      /**
       * PLATFORM-BASELINE-013A.1-CORR-001 F8 item 3 — the junction's two
       * FK delete behaviors, per design SS6: `qualifying_item_id` is
       * `ON DELETE RESTRICT` (a version's qualification definition must
       * never be erasable by deleting an item row); `reward_program_
       * version_id` is `ON DELETE CASCADE` (deleting a version legitimately
       * removes its own qualification rows).
       */
      it("qualifying_item_id is ON DELETE RESTRICT and reward_program_version_id is ON DELETE CASCADE", async () => {
        const programId = await insertProgram();
        const versionId = await insertVersion(programId);
        const itemId = await insertItem();
        await pool.query(
          `INSERT INTO reward_program_version_qualifying_items
             (reward_program_version_id, qualifying_item_id, item_name_at_version)
           VALUES ($1, $2, 'Black Coffee')`,
          [versionId, itemId],
        );

        await expect(
          pool.query("DELETE FROM qualifying_items WHERE id = $1", [itemId]),
        ).rejects.toThrow(/foreign key/i);

        await pool.query("DELETE FROM reward_program_versions WHERE id = $1", [versionId]);
        const remaining = await pool.query(
          "SELECT count(*) FROM reward_program_version_qualifying_items WHERE qualifying_item_id = $1",
          [itemId],
        );
        expect(Number(remaining.rows[0].count)).toBe(0);

        // The item itself (RESTRICT's subject) is untouched by the
        // version's CASCADE-triggered junction-row removal.
        const itemStillExists = await pool.query(
          "SELECT count(*) FROM qualifying_items WHERE id = $1",
          [itemId],
        );
        expect(Number(itemStillExists.rows[0].count)).toBe(1);
      });

      /**
       * PLATFORM-BASELINE-013A.1-CORR-001 F8 item 4 — the additive
       * `qualifying_items_identity_tuple_unique UNIQUE (id, business_id)`
       * exists and behaves as intended: usable as a composite foreign-key
       * target, the exact shape a future purchase-binding FK (design SS7)
       * requires to reject a cross-Business `qualifying_item_id`
       * relationally rather than by application precheck alone.
       */
      it("UNIQUE (id, business_id) on qualifying_items is usable as a composite foreign-key target and rejects a cross-Business tuple", async () => {
        // A real (non-temp) table: PostgreSQL forbids a TEMP table's FK
        // from referencing a non-temp table, so this can't be TEMP -- drop
        // it explicitly in `finally`, since it isn't created by a
        // migration and the outer `dropAll()` doesn't know about it.
        await pool.query(
          `CREATE TABLE purchase_binding_probe (
             qualifying_item_id UUID NOT NULL,
             business_id TEXT NOT NULL,
             FOREIGN KEY (qualifying_item_id, business_id)
               REFERENCES qualifying_items (id, business_id) ON DELETE RESTRICT
           )`,
        );
        try {
          const itemId = await insertItem({ businessId: "biz-probe" });

          await pool.query(
            "INSERT INTO purchase_binding_probe (qualifying_item_id, business_id) VALUES ($1, 'biz-probe')",
            [itemId],
          );

          await expect(
            pool.query(
              "INSERT INTO purchase_binding_probe (qualifying_item_id, business_id) VALUES ($1, 'biz-WRONG')",
              [itemId],
            ),
          ).rejects.toThrow(/foreign key/i);
        } finally {
          await pool.query("DROP TABLE purchase_binding_probe");
        }
      });
    });

    /**
     * Case K — the `0017` backfill. Re-applies migrations 0001-0016 in a
     * scratch directory (so `migrateUp` cannot see the backfilling `0017`
     * yet), seeds a legacy `reward_program_version_qualifying_nodes` row
     * exactly as a pre-existing deployed database might already have,
     * THEN points at the real directory (which includes `0017`) — proving
     * the backfill migration itself, not just the final schema, is safe
     * against a table that already has data.
     */
    it("the 0017 backfill synthesizes exactly one qualifying item and one equivalent junction row per legacy reference, and existing rows survive byte-for-byte", async () => {
      const allFiles = await discoverMigrationFiles(migrationsDir);
      const preBackfillFiles = allFiles.filter((f) => f.version < "0017");
      const scratchDir = await mkdtemp(path.join(tmpdir(), "pb013a1-pre-backfill-migrations-"));
      try {
        for (const file of preBackfillFiles) {
          await copyFile(file.upPath, path.join(scratchDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(scratchDir, path.basename(file.downPath)));
          }
        }
        await migrateUp(pool, scratchDir);
      } finally {
        await rm(scratchDir, { recursive: true, force: true });
      }

      const programId = await insertProgram({ businessId: "biz-legacy" });
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      // Apply 0017+0018 from a second scratch directory carrying the
      // full pre-0019 prefix (0001-0018: `validateMigrationHistory`
      // requires applied rows to be an exact ordered prefix of the
      // discovered set). The real directory would now also apply 0019
      // and drop the legacy table this test asserts on below. 0019's
      // own suite proves the drop; this test proves the backfill.
      const postBackfillFiles = allFiles.filter((f) => f.version < "0019");
      const postDir = await mkdtemp(path.join(tmpdir(), "pb013a1-post-backfill-migrations-"));
      try {
        for (const file of postBackfillFiles) {
          await copyFile(file.upPath, path.join(postDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(postDir, path.basename(file.downPath)));
          }
        }
        const result = await migrateUp(pool, postDir);
        expect(result.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(postDir, { recursive: true, force: true });
      }

      const synthesized = await pool.query<{
        id: string;
        business_id: string;
        name: string;
        knowledge_node_id: string;
      }>(
        `SELECT id, business_id, name, knowledge_node_id FROM qualifying_items
         WHERE created_by = 'platform-baseline-013a1-0017-backfill'`,
      );
      expect(synthesized.rows).toEqual([
        {
          id: synthesized.rows[0].id,
          business_id: "biz-legacy",
          name: "Legacy Espresso",
          knowledge_node_id: "node-legacy-1",
        },
      ]);

      const junction = await pool.query<{
        reward_program_version_id: string;
        qualifying_item_id: string;
        item_name_at_version: string;
        knowledge_node_id_at_version: string;
      }>("SELECT * FROM reward_program_version_qualifying_items");
      expect(junction.rows).toEqual([
        {
          reward_program_version_id: versionId,
          qualifying_item_id: synthesized.rows[0].id,
          item_name_at_version: "Legacy Espresso",
          knowledge_node_id_at_version: "node-legacy-1",
        },
      ]);

      // The legacy source row itself is untouched.
      const legacyStillThere = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_nodes WHERE reward_program_version_id = $1",
        [versionId],
      );
      expect(Number(legacyStillThere.rows[0].count)).toBe(1);
    }, 15000);

    it("the 0017 backfill SQL is idempotent: re-executing it against an already-backfilled database adds nothing", async () => {
      const preBackfillFiles = (await discoverMigrationFiles(migrationsDir)).filter(
        (f) => f.version < "0017",
      );
      const scratchDir = await mkdtemp(path.join(tmpdir(), "pb013a1-idempotent-backfill-"));
      try {
        for (const file of preBackfillFiles) {
          await copyFile(file.upPath, path.join(scratchDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(scratchDir, path.basename(file.downPath)));
          }
        }
        await migrateUp(pool, scratchDir);
      } finally {
        await rm(scratchDir, { recursive: true, force: true });
      }

      // Only NOW (0001-0016 applied, reward_programs/reward_program_versions
      // exist) can the legacy fixture be created.
      const programId = await insertProgram({ businessId: "biz-legacy" });
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      const backfillSql = await readFile(
        path.join(migrationsDir, "0017_create_reward_program_version_qualifying_items.sql"),
        "utf8",
      );
      // Run the FULL 0017 file (CREATE TABLE + backfill) once via the
      // runner against a scratch directory carrying the full pre-0019
      // prefix (0001-0018: exact-prefix rule, and the real directory
      // would now also apply 0019 and drop the legacy table the manual
      // re-execution below reads), then re-execute the backfill a second
      // time by hand, directly against the pool -- the SQL itself, not
      // merely the runner's own "already applied" bookkeeping, must be
      // idempotent.
      const postFiles = (await discoverMigrationFiles(migrationsDir)).filter(
        (f) => f.version < "0019",
      );
      const postDir = await mkdtemp(path.join(tmpdir(), "pb013a1-idempotent-post-"));
      try {
        for (const file of postFiles) {
          await copyFile(file.upPath, path.join(postDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(postDir, path.basename(file.downPath)));
          }
        }
        const appliedBackfill = await migrateUp(pool, postDir);
        expect(appliedBackfill.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(postDir, { recursive: true, force: true });
      }

      const backfillOnly = backfillSql.slice(backfillSql.indexOf("INSERT INTO qualifying_items"));
      await pool.query(backfillOnly);
      await pool.query(backfillOnly);

      const items = await pool.query(
        "SELECT count(*) FROM qualifying_items WHERE created_by = 'platform-baseline-013a1-0017-backfill'",
      );
      expect(Number(items.rows[0].count)).toBe(1);

      const junctionRows = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_items",
      );
      expect(Number(junctionRows.rows[0].count)).toBe(1);
    }, 15000);

    it("0017.down removes only the migration's own synthesized items and never a real Business-created item", async () => {
      const preBackfillFiles = (await discoverMigrationFiles(migrationsDir)).filter(
        (f) => f.version < "0017",
      );
      const scratchDir = await mkdtemp(path.join(tmpdir(), "pb013a1-down-precondition-"));
      try {
        for (const file of preBackfillFiles) {
          await copyFile(file.upPath, path.join(scratchDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(scratchDir, path.basename(file.downPath)));
          }
        }
        await migrateUp(pool, scratchDir);
      } finally {
        await rm(scratchDir, { recursive: true, force: true });
      }

      const programId = await insertProgram({ businessId: "biz-legacy" });
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );
      // Apply 0017+0018 from a scratch directory carrying the full
      // pre-0019 prefix (0001-0018: exact-prefix rule).
      // (`PLATFORM-BASELINE-013E`): the rollback below targets exactly
      // 0018+0017, and the real directory would now also apply 0019.
      const postFiles = (await discoverMigrationFiles(migrationsDir)).filter(
        (f) => f.version < "0019",
      );
      const postDir = await mkdtemp(path.join(tmpdir(), "pb013a1-down-post-"));
      try {
        for (const file of postFiles) {
          await copyFile(file.upPath, path.join(postDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(postDir, path.basename(file.downPath)));
          }
        }
        await migrateUp(pool, postDir);
      } finally {
        await rm(postDir, { recursive: true, force: true });
      }

      const synthesizedBefore = await pool.query(
        "SELECT count(*) FROM qualifying_items WHERE created_by = 'platform-baseline-013a1-0017-backfill'",
      );
      expect(Number(synthesizedBefore.rows[0].count)).toBe(1);

      // A real Business, using the new schema directly (no command layer
      // exists yet in this package), creates its own item -- one that
      // must never be touched by a rollback of the backfill migration.
      const realItemId = await insertItem({
        businessId: "biz-real",
        name: "Real Business Item",
        createdBy: "user-real-owner",
      });

      // Roll back ONLY 0017 (the junction table + its backfill), not 0016.
      await migrateDown(pool, migrationsDir, 2);

      const junctionTable = await pool.query(
        "SELECT to_regclass('reward_program_version_qualifying_items') AS reg",
      );
      expect(junctionTable.rows[0].reg).toBeNull();

      const itemsTable = await pool.query("SELECT to_regclass('qualifying_items') AS reg");
      expect(itemsTable.rows[0].reg).not.toBeNull();

      const remaining = await pool.query<{ id: string; created_by: string }>(
        "SELECT id, created_by FROM qualifying_items",
      );
      expect(remaining.rows).toEqual([{ id: realItemId, created_by: "user-real-owner" }]);

      // 0016.down then drops the now-real-item-containing table -- proving
      // it is an unconditional DROP TABLE (irreversible past this point,
      // by design: a package that merged atomically reverts atomically,
      // and a full PB-013A.1 rollback is only safe when no real Business
      // has created its own item yet, per the design's own precondition).
      await migrateDown(pool, migrationsDir, 2);
      const itemsTableAfter = await pool.query("SELECT to_regclass('qualifying_items') AS reg");
      expect(itemsTableAfter.rows[0].reg).toBeNull();
    }, 15000);

    /**
     * PLATFORM-BASELINE-013A.1-CORR-001 F4 — the principal correction.
     * `0017.down` must refuse (not silently destroy) once a genuine,
     * non-backfill Qualifying Item is bound into the junction table --
     * distinct from the retained test above, where a genuine item exists
     * but is never bound into `reward_program_version_qualifying_items`.
     */
    it("0017.down refuses to run when a genuine (non-backfill) Qualifying Item is bound into the junction table, and the genuine item plus its binding survive the refused rollback", async () => {
      // Scratch directory capped before 0019
      // (`PLATFORM-BASELINE-013E`): the refused rollback below must
      // target 0018+0017, and the real directory would now also apply
      // 0019.
      const cappedFiles = (await discoverMigrationFiles(migrationsDir)).filter(
        (f) => f.version < "0019",
      );
      const cappedDir = await mkdtemp(path.join(tmpdir(), "pb013a1-down-refuse-"));
      try {
        for (const file of cappedFiles) {
          await copyFile(file.upPath, path.join(cappedDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(cappedDir, path.basename(file.downPath)));
          }
        }
        await migrateUp(pool, cappedDir);
      } finally {
        await rm(cappedDir, { recursive: true, force: true });
      }

      const programId = await insertProgram({ businessId: "biz-real" });
      const versionId = await insertVersion(programId);
      const genuineItemId = await insertItem({
        businessId: "biz-real",
        name: "Real Espresso",
        createdBy: "user-real-owner",
      });
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
             (reward_program_version_id, qualifying_item_id, item_name_at_version)
           VALUES ($1, $2, 'Real Espresso')`,
        [versionId, genuineItemId],
      );

      await expect(migrateDown(pool, migrationsDir, 2)).rejects.toThrow(
        /Refusing to roll back migration 0017/,
      );

      // migrateDown wraps each file in its own transaction (BEGIN before
      // running the .down.sql, ROLLBACK on error) -- the RAISE EXCEPTION
      // fires before DROP TABLE is ever reached, so nothing this refused
      // attempt touched is left in an intermediate state.
      const junctionTable = await pool.query(
        "SELECT to_regclass('reward_program_version_qualifying_items') AS reg",
      );
      expect(junctionTable.rows[0].reg).not.toBeNull();

      const item = await pool.query<{ id: string; created_by: string }>(
        "SELECT id, created_by FROM qualifying_items WHERE id = $1",
        [genuineItemId],
      );
      expect(item.rows).toEqual([{ id: genuineItemId, created_by: "user-real-owner" }]);

      const binding = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_items WHERE qualifying_item_id = $1",
        [genuineItemId],
      );
      expect(Number(binding.rows[0].count)).toBe(1);

      // schema_migrations still records 0017 as applied -- the rollback
      // never completed, matching the DELETE FROM schema_migrations
      // never being reached.
      const applied = await getAppliedMigrations(pool);
      expect(applied.map((a) => a.version)).toContain("0017");
    }, 15000);

    /**
     * PLATFORM-BASELINE-013A.1-CORR-001 F8 item 1 — multi-Business
     * isolation: two different Businesses each recording the SAME
     * canonical legacy `knowledge_node_id` must synthesize two
     * independent Qualifying Items, never one shared row.
     */
    it("two Businesses referencing the same canonical legacy node produce two independent, correctly-scoped Business-owned Qualifying Items", async () => {
      const preBackfillFiles = (await discoverMigrationFiles(migrationsDir)).filter(
        (f) => f.version < "0017",
      );
      const scratchDir = await mkdtemp(path.join(tmpdir(), "pb013a1-multi-business-"));
      try {
        for (const file of preBackfillFiles) {
          await copyFile(file.upPath, path.join(scratchDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(scratchDir, path.basename(file.downPath)));
          }
        }
        await migrateUp(pool, scratchDir);
      } finally {
        await rm(scratchDir, { recursive: true, force: true });
      }

      const programA = await insertProgram({ businessId: "biz-multi-A" });
      const versionA = await insertVersion(programA);
      const programB = await insertProgram({ businessId: "biz-multi-B" });
      const versionB = await insertVersion(programB);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
           VALUES ($1, 'node-shared-1', 'Shared Product (A''s name)'),
                  ($2, 'node-shared-1', 'Shared Product (B''s name)')`,
        [versionA, versionB],
      );

      await migrateUp(pool, migrationsDir);

      const items = await pool.query<{ business_id: string; name: string; id: string }>(
        "SELECT id, business_id, name FROM qualifying_items WHERE knowledge_node_id = 'node-shared-1' ORDER BY business_id",
      );
      expect(items.rows).toHaveLength(2);
      expect(items.rows[0].business_id).toBe("biz-multi-A");
      expect(items.rows[0].name).toBe("Shared Product (A's name)");
      expect(items.rows[1].business_id).toBe("biz-multi-B");
      expect(items.rows[1].name).toBe("Shared Product (B's name)");
      expect(items.rows[0].id).not.toBe(items.rows[1].id);

      // Each junction row points at ITS OWN Business's synthesized item,
      // never the other Business's.
      const junctionA = await pool.query<{ qualifying_item_id: string }>(
        "SELECT qualifying_item_id FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionA],
      );
      expect(junctionA.rows[0].qualifying_item_id).toBe(items.rows[0].id);
    }, 15000);

    /**
     * PLATFORM-BASELINE-013A.1-CORR-001 F8 item 2 — a legacy row with no
     * recorded `business_display_name` must fall back to the raw
     * `knowledge_node_id` (SS13's disclosed, cosmetic risk 2), not fail or
     * synthesize a NULL/empty name.
     */
    it("a legacy row with NULL business_display_name falls back to knowledge_node_id as the synthesized item's name", async () => {
      const preBackfillFiles = (await discoverMigrationFiles(migrationsDir)).filter(
        (f) => f.version < "0017",
      );
      const scratchDir = await mkdtemp(path.join(tmpdir(), "pb013a1-null-fallback-"));
      try {
        for (const file of preBackfillFiles) {
          await copyFile(file.upPath, path.join(scratchDir, path.basename(file.upPath)));
          if (file.downPath) {
            await copyFile(file.downPath, path.join(scratchDir, path.basename(file.downPath)));
          }
        }
        await migrateUp(pool, scratchDir);
      } finally {
        await rm(scratchDir, { recursive: true, force: true });
      }

      const programId = await insertProgram({ businessId: "biz-null-display" });
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
           VALUES ($1, 'node-noname-1', NULL)`,
        [versionId],
      );

      await migrateUp(pool, migrationsDir);

      const item = await pool.query<{ name: string }>(
        "SELECT name FROM qualifying_items WHERE business_id = 'biz-null-display' AND knowledge_node_id = 'node-noname-1'",
      );
      expect(item.rows[0].name).toBe("node-noname-1");

      const junction = await pool.query<{ item_name_at_version: string }>(
        "SELECT item_name_at_version FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionId],
      );
      expect(junction.rows[0].item_name_at_version).toBe("node-noname-1");
    }, 15000);
  });

  /**
   * `PLATFORM-BASELINE-013E` (+ `PLATFORM-BASELINE-013E-CORR-001`, bounded
   * by `PLATFORM-BASELINE-013E-CORR-002`) — migration `0019` drops the
   * superseded legacy `reward_program_version_qualifying_nodes` table
   * after a fail-closed gate. The gate requires an exact migrated
   * representation for every legacy row on an immutable
   * (published/superseded) version, while a legacy row on a still-mutable
   * draft is also satisfied by 0017 backfill provenance (marker item for
   * the same Business/node) or by structural descent (the draft still
   * binds a backfill-synthesized item) — but only when the draft version
   * ITSELF predates migration 0017 (`reward_program_versions.created_at <
   * schema_migrations.applied_at` for `0017`). No blanket `beforeEach`
   * here: tests must control migration application precisely (pre-0017
   * scratch directory, legacy seeding, then 0017/0018 with or without
   * 0019), mirroring the Case K technique above.
   */
  describe("PLATFORM-BASELINE-013E: drop legacy qualifying-nodes table (0019)", () => {
    async function copyMigrationsBefore(scratchDir: string, version: string): Promise<void> {
      const files = (await discoverMigrationFiles(migrationsDir)).filter(
        (f) => f.version < version,
      );
      for (const file of files) {
        await copyFile(file.upPath, path.join(scratchDir, path.basename(file.upPath)));
        if (file.downPath) {
          await copyFile(file.downPath, path.join(scratchDir, path.basename(file.downPath)));
        }
      }
    }

    async function tableExists(table: string): Promise<boolean> {
      const check = await pool.query<{ reg: string | null }>("SELECT to_regclass($1) AS reg", [
        table,
      ]);
      return check.rows[0].reg !== null;
    }

    async function insertProgram(businessId: string): Promise<string> {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO reward_programs (business_id, display_name, reward_program_category_id, status, created_by, updated_by)
         VALUES ($1, 'Test Program', 'cat-1', 'draft', 'user-1', 'user-1') RETURNING id`,
        [businessId],
      );
      return result.rows[0].id;
    }

    async function insertVersion(programId: string): Promise<string> {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO reward_program_versions
           (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
         VALUES ($1, 1, 10, 1, false, 'desc', now(), 'draft', 'user-1') RETURNING id`,
        [programId],
      );
      return result.rows[0].id;
    }

    it("A. applies 0019 on an empty database: the legacy table is dropped and current structures remain intact", async () => {
      const result = await migrateUp(pool, migrationsDir);
      expect(result.applied).toContain("0019");

      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);
      for (const table of [
        "reward_programs",
        "reward_program_versions",
        "qualifying_items",
        "reward_program_version_qualifying_items",
      ]) {
        expect(await tableExists(table), `expected table "${table}" to exist`).toBe(true);
      }
    }, 15000);

    it("A. unchanged backfilled legacy row: seeded legacy data migrated by 0017 survives 0019 in the new authoritative structures", async () => {
      const scratchDir = await mkdtemp(path.join(tmpdir(), "pb013e-pre-0019-migrations-"));
      try {
        await copyMigrationsBefore(scratchDir, "0017");
        await migrateUp(pool, scratchDir);
      } finally {
        await rm(scratchDir, { recursive: true, force: true });
      }

      const programId = await insertProgram("biz-legacy-0019");
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      const result = await migrateUp(pool, migrationsDir);
      expect(result.applied).toEqual(["0017", "0018", "0019"]);

      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);

      const items = await pool.query<{
        business_id: string;
        name: string;
        knowledge_node_id: string;
      }>(
        `SELECT business_id, name, knowledge_node_id FROM qualifying_items
          WHERE created_by = 'platform-baseline-013a1-0017-backfill'`,
      );
      expect(items.rows).toEqual([
        {
          business_id: "biz-legacy-0019",
          name: "Legacy Espresso",
          knowledge_node_id: "node-legacy-1",
        },
      ]);

      const junction = await pool.query<{
        reward_program_version_id: string;
        item_name_at_version: string;
        knowledge_node_id_at_version: string;
      }>(
        `SELECT j.reward_program_version_id, j.item_name_at_version, j.knowledge_node_id_at_version
           FROM reward_program_version_qualifying_items j
           JOIN qualifying_items qi ON qi.id = j.qualifying_item_id`,
      );
      expect(junction.rows).toEqual([
        {
          reward_program_version_id: versionId,
          item_name_at_version: "Legacy Espresso",
          knowledge_node_id_at_version: "node-legacy-1",
        },
      ]);
    }, 15000);

    /**
     * PLATFORM-BASELINE-013E-CORR-001 TEST B (core P1 regression) — a
     * draft legitimately edited AFTER the 0017 backfill must not block
     * 0019. The draft edit mirrors `updateDraftVersion`'s wholesale
     * replacement semantics exactly (DELETE all of the version's junction
     * rows, then INSERT the new bindings); the legacy table is
     * intentionally never updated. The 0017-synthesized marker item
     * survives (junction writes never touch `qualifying_items`), proving
     * the backfill processed this exact legacy reference.
     */
    it("B. (P1 regression) a draft rebound after the 0017 backfill still lets 0019 drop the legacy table", async () => {
      const preDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr001-b-pre-"));
      try {
        await copyMigrationsBefore(preDir, "0017");
        await migrateUp(pool, preDir);
      } finally {
        await rm(preDir, { recursive: true, force: true });
      }

      const businessId = "biz-013e-corr001-evolved";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      const midDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr001-b-mid-"));
      try {
        await copyMigrationsBefore(midDir, "0019");
        const mid = await migrateUp(pool, midDir);
        expect(mid.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(midDir, { recursive: true, force: true });
      }

      // Legitimate post-backfill draft edit: wholesale junction
      // replacement binding a genuine, Business-owned item with a
      // different name and classification. The legacy row is untouched.
      const genuine = await pool.query<{ id: string }>(
        `INSERT INTO qualifying_items (business_id, name, knowledge_node_id, status, created_by, updated_by)
         VALUES ($1, 'Cold Brew', 'node-new-9', 'active', 'user-1', 'user-1') RETURNING id`,
        [businessId],
      );
      await pool.query(
        "DELETE FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionId],
      );
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
         VALUES ($1, $2, 'Cold Brew', 'node-new-9')`,
        [versionId, genuine.rows[0].id],
      );

      const result = await migrateUp(pool, migrationsDir);
      expect(result.applied).toEqual(["0019"]);
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);

      // The backfill's own evidence survives the drop: the marker item
      // for the legacy reference still exists, and the draft's current
      // (evolved) binding is intact.
      const marker = await pool.query(
        `SELECT count(*) FROM qualifying_items
          WHERE business_id = $1 AND knowledge_node_id = 'node-legacy-1'
            AND created_by = 'platform-baseline-013a1-0017-backfill'`,
        [businessId],
      );
      expect(Number(marker.rows[0].count)).toBe(1);
      const junction = await pool.query(
        `SELECT count(*) FROM reward_program_version_qualifying_items
          WHERE reward_program_version_id = $1 AND qualifying_item_id = $2`,
        [versionId, genuine.rows[0].id],
      );
      expect(Number(junction.rows[0].count)).toBe(1);
    }, 15000);

    /**
     * PLATFORM-BASELINE-013E-CORR-001 TEST C — a draft whose
     * legacy-derived binding was later removed entirely (a state the
     * wholesale-replacement draft semantics allow) must not block 0019.
     */
    it("C. a draft with its legacy-derived binding removed after the 0017 backfill still lets 0019 drop the legacy table", async () => {
      const preDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr001-c-pre-"));
      try {
        await copyMigrationsBefore(preDir, "0017");
        await migrateUp(pool, preDir);
      } finally {
        await rm(preDir, { recursive: true, force: true });
      }

      const businessId = "biz-013e-corr001-removed";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      const midDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr001-c-mid-"));
      try {
        await copyMigrationsBefore(midDir, "0019");
        const mid = await migrateUp(pool, midDir);
        expect(mid.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(midDir, { recursive: true, force: true });
      }

      // Legitimate post-backfill draft edit: the binding is removed
      // (empty junction for this draft version). The legacy row and the
      // backfill-synthesized item are untouched.
      await pool.query(
        "DELETE FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionId],
      );

      const result = await migrateUp(pool, migrationsDir);
      expect(result.applied).toEqual(["0019"]);
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);

      const marker = await pool.query(
        `SELECT count(*) FROM qualifying_items
          WHERE business_id = $1 AND knowledge_node_id = 'node-legacy-1'
            AND created_by = 'platform-baseline-013a1-0017-backfill'`,
        [businessId],
      );
      expect(Number(marker.rows[0].count)).toBe(1);
    }, 15000);

    /**
     * PLATFORM-BASELINE-013E-CORR-001 TEST D — a draft whose live item
     * was renamed (D1) or reclassified (D2) through the legitimate
     * item-update path, with the draft then re-saved so its frozen
     * snapshots refresh (exactly what `updateQualifyingItem` followed by
     * `updateDraftVersion` produces), must not block 0019. D2 is the
     * deeper case: the marker item itself no longer carries the legacy
     * classification, so only the draft's structural descent from the
     * backfill (it still binds the synthesized item) proves migration.
     */
    it("D1. a draft re-saved after its backfilled item was renamed still lets 0019 drop the legacy table", async () => {
      const preDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr001-d1-pre-"));
      try {
        await copyMigrationsBefore(preDir, "0017");
        await migrateUp(pool, preDir);
      } finally {
        await rm(preDir, { recursive: true, force: true });
      }

      const businessId = "biz-013e-corr001-renamed";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      const midDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr001-d1-mid-"));
      try {
        await copyMigrationsBefore(midDir, "0019");
        const mid = await migrateUp(pool, midDir);
        expect(mid.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(midDir, { recursive: true, force: true });
      }

      // Legitimate product path: rename the live item, then re-save the
      // draft so its frozen snapshot refreshes to the new name.
      const marker = await pool.query<{ id: string }>(
        `SELECT id FROM qualifying_items
          WHERE business_id = $1 AND knowledge_node_id = 'node-legacy-1'
            AND created_by = 'platform-baseline-013a1-0017-backfill'`,
        [businessId],
      );
      expect(marker.rows).toHaveLength(1);
      const markerId = marker.rows[0].id;
      await pool.query(
        "UPDATE qualifying_items SET name = 'Legacy Espresso Renamed' WHERE id = $1",
        [markerId],
      );
      await pool.query(
        "DELETE FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionId],
      );
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
         VALUES ($1, $2, 'Legacy Espresso Renamed', 'node-legacy-1')`,
        [versionId, markerId],
      );

      const result = await migrateUp(pool, migrationsDir);
      expect(result.applied).toEqual(["0019"]);
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);
    }, 15000);

    it("D2. a draft re-saved after its backfilled item was reclassified still lets 0019 drop the legacy table", async () => {
      const preDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr001-d2-pre-"));
      try {
        await copyMigrationsBefore(preDir, "0017");
        await migrateUp(pool, preDir);
      } finally {
        await rm(preDir, { recursive: true, force: true });
      }

      const businessId = "biz-013e-corr001-remapped";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      const midDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr001-d2-mid-"));
      try {
        await copyMigrationsBefore(midDir, "0019");
        const mid = await migrateUp(pool, midDir);
        expect(mid.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(midDir, { recursive: true, force: true });
      }

      // Legitimate product path: reclassify the live item to another
      // optional CK node, then re-save the draft so its frozen snapshots
      // refresh. Neither the junction nor the live item still carries
      // the legacy (node, name) pair -- only the draft's structural
      // binding of the backfill-synthesized item proves migration.
      const marker = await pool.query<{ id: string }>(
        `SELECT id FROM qualifying_items
          WHERE business_id = $1 AND knowledge_node_id = 'node-legacy-1'
            AND created_by = 'platform-baseline-013a1-0017-backfill'`,
        [businessId],
      );
      expect(marker.rows).toHaveLength(1);
      const markerId = marker.rows[0].id;
      await pool.query(
        "UPDATE qualifying_items SET name = 'Remapped Blend', knowledge_node_id = 'node-remapped-7' WHERE id = $1",
        [markerId],
      );
      await pool.query(
        "DELETE FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionId],
      );
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
         VALUES ($1, $2, 'Remapped Blend', 'node-remapped-7')`,
        [versionId, markerId],
      );

      const result = await migrateUp(pool, migrationsDir);
      expect(result.applied).toEqual(["0019"]);
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);
    }, 15000);

    /**
     * PLATFORM-BASELINE-013E-CORR-002 TEST A — a POST-0017 draft version
     * with a manually inserted legacy row sharing an already-backfilled
     * (Business, node) pair MUST fail closed. Under CORR-001's leg (b)
     * (no timestamp bound) this row would have passed via the shared
     * marker item; the CORR-002 timestamp bound must now block it.
     */
    it("CORR-002 A. a post-0017 draft with a manually inserted legacy row sharing the backfilled (Business, node) fails closed", async () => {
      const preDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr002-a-pre-"));
      try {
        await copyMigrationsBefore(preDir, "0017");
        await migrateUp(pool, preDir);
      } finally {
        await rm(preDir, { recursive: true, force: true });
      }

      const businessId = "biz-013e-corr002-post17-a";
      const programId = await insertProgram(businessId);
      const v1 = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [v1],
      );

      // Apply 0017+0018 (backfill records 0017.applied_at).
      const midDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr002-a-mid-"));
      try {
        await copyMigrationsBefore(midDir, "0019");
        const mid = await migrateUp(pool, midDir);
        expect(mid.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(midDir, { recursive: true, force: true });
      }

      // A NEW draft version created AFTER 0017 (a new program of the same
      // Business), with a manually injected legacy row for the SAME node
      // whose marker item already exists from v1's backfill.
      const program2 = await insertProgram(businessId);
      const v2 = await insertVersion(program2);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Injected Espresso')`,
        [v2],
      );

      // 0019 MUST fail: v2's legacy row has no exact junction match, and
      // legs (b)/(c) are blocked because v2 does not predate 0017.
      await expect(migrateUp(pool, migrationsDir)).rejects.toThrow(
        /refusing to drop reward_program_version_qualifying_nodes/,
      );

      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(true);
      const legacy = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_nodes WHERE reward_program_version_id = $1",
        [v2],
      );
      expect(Number(legacy.rows[0].count)).toBe(1);
      const applied = await getAppliedMigrations(pool);
      expect(applied.map((a) => a.version)).not.toContain("0019");
      expect(await tableExists("reward_program_version_qualifying_items")).toBe(true);
      expect(await tableExists("qualifying_items")).toBe(true);
    }, 15000);

    /**
     * PLATFORM-BASELINE-013E-CORR-002 TEST B — a POST-0017 draft version
     * with a manually inserted legacy row (for a node never backfilled)
     * whose current junction binds a same-Business backfill marker item
     * MUST fail closed. Under CORR-001's leg (c) (node-unconstrained) this
     * row would have passed via the marker binding; the CORR-002 timestamp
     * bound must now block it.
     */
    it("CORR-002 B. a post-0017 draft with a manually inserted legacy row and a junction bound to a same-Business marker item fails closed", async () => {
      const preDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr002-b-pre-"));
      try {
        await copyMigrationsBefore(preDir, "0017");
        await migrateUp(pool, preDir);
      } finally {
        await rm(preDir, { recursive: true, force: true });
      }

      const businessId = "biz-013e-corr002-post17-b";
      const programId = await insertProgram(businessId);
      const v1 = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [v1],
      );

      const midDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr002-b-mid-"));
      try {
        await copyMigrationsBefore(midDir, "0019");
        const mid = await migrateUp(pool, midDir);
        expect(mid.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(midDir, { recursive: true, force: true });
      }

      const marker = await pool.query<{ id: string }>(
        `SELECT id FROM qualifying_items
          WHERE business_id = $1 AND knowledge_node_id = 'node-legacy-1'
            AND created_by = 'platform-baseline-013a1-0017-backfill'`,
        [businessId],
      );
      expect(marker.rows).toHaveLength(1);

      // A NEW draft version created AFTER 0017, with a manually injected
      // legacy row for a node that was NEVER backfilled, and its junction
      // bound to the backfill marker item (a DIFFERENT node) — the exact
      // node-unconstrained shape CORR-001's leg (c) would have admitted.
      const program2 = await insertProgram(businessId);
      const v2 = await insertVersion(program2);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-injected-9', 'Injected Product')`,
        [v2],
      );
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
         VALUES ($1, $2, 'Legacy Espresso', 'node-legacy-1')`,
        [v2, marker.rows[0].id],
      );

      await expect(migrateUp(pool, migrationsDir)).rejects.toThrow(
        /refusing to drop reward_program_version_qualifying_nodes/,
      );

      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(true);
      const legacy = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_nodes WHERE reward_program_version_id = $1",
        [v2],
      );
      expect(Number(legacy.rows[0].count)).toBe(1);
      const applied = await getAppliedMigrations(pool);
      expect(applied.map((a) => a.version)).not.toContain("0019");
      expect(await tableExists("reward_program_version_qualifying_items")).toBe(true);
      expect(await tableExists("qualifying_items")).toBe(true);
    }, 15000);

    /**
     * PLATFORM-BASELINE-013E-CORR-001 TESTS E (fail-closed on
     * historical evidence) + F (failure atomicity) — the same
     * evidence destruction as TEST C, but against a PUBLISHED
     * (immutable) version, MUST abort 0019. Draft provenance legs
     * (b)/(c) are unavailable to non-draft versions by construction, so
     * a published row with no exact migrated representation blocks the
     * drop. The aborted run must leave everything untouched: legacy
     * table + rows remain, 0019 is not recorded, and no destructive
     * schema change occurs.
     */
    it("E./F. fails closed on unmigrated historical (published) evidence: 0019 aborts atomically and the legacy table and rows remain", async () => {
      const preDir = await mkdtemp(path.join(tmpdir(), "pb013e-pre-0019-seed-"));
      try {
        await copyMigrationsBefore(preDir, "0017");
        await migrateUp(pool, preDir);
      } finally {
        await rm(preDir, { recursive: true, force: true });
      }

      const programId = await insertProgram("biz-legacy-broken");
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      // Apply 0017+0018 only (scratch copy without 0019), publish the
      // version (draft -> active: immutable history from here on), then
      // destroy the migrated evidence so the published legacy row is
      // unrepresented.
      const midDir = await mkdtemp(path.join(tmpdir(), "pb013e-mid-0019-seed-"));
      try {
        await copyMigrationsBefore(midDir, "0019");
        const mid = await migrateUp(pool, midDir);
        expect(mid.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(midDir, { recursive: true, force: true });
      }
      await pool.query("UPDATE reward_program_versions SET status = 'active' WHERE id = $1", [
        versionId,
      ]);
      await pool.query(
        "DELETE FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionId],
      );

      await expect(migrateUp(pool, migrationsDir)).rejects.toThrow(
        /refusing to drop reward_program_version_qualifying_nodes/,
      );

      // Fail-closed + atomicity proof: the table and its evidence row
      // survive, 0019 is NOT recorded as applied, and the new
      // authoritative structures are untouched by the aborted run.
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(true);
      const legacy = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_nodes WHERE reward_program_version_id = $1",
        [versionId],
      );
      expect(Number(legacy.rows[0].count)).toBe(1);
      const applied = await getAppliedMigrations(pool);
      expect(applied.map((a) => a.version)).not.toContain("0019");
      expect(await tableExists("reward_program_version_qualifying_items")).toBe(true);
      expect(await tableExists("qualifying_items")).toBe(true);
      const versions = await pool.query(
        "SELECT status FROM reward_program_versions WHERE id = $1",
        [versionId],
      );
      expect(versions.rows).toEqual([{ status: "active" }]);
    }, 15000);

    /**
     * PLATFORM-BASELINE-013E-CORR-002 draft→published — a PRE-0017 draft
     * that is legitimately rebound to a genuine Business-owned item and
     * then PUBLISHED must fail closed. Once non-draft, only exact
     * representation leg (a) applies, and the published junction reflects
     * the evolved binding, not the legacy node. This is intentional
     * ambiguity requiring operator verification, not data corruption.
     */
    it("CORR-002 draft→published: a pre-0017 draft rebound to a genuine item and then published fails closed (exact representation required for non-draft versions)", async () => {
      const preDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr002-pub-pre-"));
      try {
        await copyMigrationsBefore(preDir, "0017");
        await migrateUp(pool, preDir);
      } finally {
        await rm(preDir, { recursive: true, force: true });
      }

      const businessId = "biz-013e-corr002-published";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
         VALUES ($1, 'node-legacy-1', 'Legacy Espresso')`,
        [versionId],
      );

      const midDir = await mkdtemp(path.join(tmpdir(), "pb013e-corr002-pub-mid-"));
      try {
        await copyMigrationsBefore(midDir, "0019");
        const mid = await migrateUp(pool, midDir);
        expect(mid.applied).toEqual(["0017", "0018"]);
      } finally {
        await rm(midDir, { recursive: true, force: true });
      }

      // Legitimate post-backfill evolution: wholesale junction replacement
      // binding a genuine, Business-owned item with a different name and
      // classification (what updateDraftVersion produces).
      const genuine = await pool.query<{ id: string }>(
        `INSERT INTO qualifying_items (business_id, name, knowledge_node_id, status, created_by, updated_by)
         VALUES ($1, 'Cold Brew', 'node-new-9', 'active', 'user-1', 'user-1') RETURNING id`,
        [businessId],
      );
      await pool.query(
        "DELETE FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionId],
      );
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
         VALUES ($1, $2, 'Cold Brew', 'node-new-9')`,
        [versionId, genuine.rows[0].id],
      );

      // Publish (draft -> active): the published junction reflects the
      // evolved binding, so the legacy row no longer has an exact
      // representation.
      await pool.query("UPDATE reward_program_versions SET status = 'active' WHERE id = $1", [
        versionId,
      ]);

      await expect(migrateUp(pool, migrationsDir)).rejects.toThrow(
        /refusing to drop reward_program_version_qualifying_nodes/,
      );

      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(true);
      const legacy = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_nodes WHERE reward_program_version_id = $1",
        [versionId],
      );
      expect(Number(legacy.rows[0].count)).toBe(1);
      const applied = await getAppliedMigrations(pool);
      expect(applied.map((a) => a.version)).not.toContain("0019");
      expect(await tableExists("reward_program_version_qualifying_items")).toBe(true);
      expect(await tableExists("qualifying_items")).toBe(true);
      const versions = await pool.query(
        "SELECT status FROM reward_program_versions WHERE id = $1",
        [versionId],
      );
      expect(versions.rows).toEqual([{ status: "active" }]);
    }, 15000);

    it("G. post-0019 product smoke: bind, publish-shape, and hydrate qualification evidence from the new structures only", async () => {
      await migrateUp(pool, migrationsDir);
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);

      const businessId = "biz-0019-smoke";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      const item = await pool.query<{ id: string }>(
        `INSERT INTO qualifying_items (business_id, name, knowledge_node_id, status, created_by, updated_by)
         VALUES ($1, 'Smoke Blend', 'node-smoke-1', 'active', 'user-1', 'user-1') RETURNING id`,
        [businessId],
      );
      const itemId = item.rows[0].id;
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
         VALUES ($1, $2, 'Smoke Blend', 'node-smoke-1')`,
        [versionId, itemId],
      );
      await pool.query("UPDATE reward_program_versions SET status = 'active' WHERE id = $1", [
        versionId,
      ]);

      const hydrated = await pool.query<{
        qualifying_item_id: string;
        item_name_at_version: string;
        knowledge_node_id_at_version: string;
      }>(
        `SELECT j.qualifying_item_id, j.item_name_at_version, j.knowledge_node_id_at_version
           FROM reward_program_version_qualifying_items j
           JOIN reward_program_versions v ON v.id = j.reward_program_version_id
          WHERE v.id = $1 AND v.status = 'active'`,
        [versionId],
      );
      expect(hydrated.rows).toEqual([
        {
          qualifying_item_id: itemId,
          item_name_at_version: "Smoke Blend",
          knowledge_node_id_at_version: "node-smoke-1",
        },
      ]);
    }, 15000);

    it("down-migration: 0019.down recreates the historical table structure only, with no fabricated rows, and 0019 re-applies", async () => {
      await migrateUp(pool, migrationsDir);
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);

      const businessId = "biz-0019-down";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      const item = await pool.query<{ id: string }>(
        `INSERT INTO qualifying_items (business_id, name, knowledge_node_id, status, created_by, updated_by)
         VALUES ($1, 'Down Blend', NULL, 'active', 'user-1', 'user-1') RETURNING id`,
        [businessId],
      );
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
         VALUES ($1, $2, 'Down Blend', NULL)`,
        [versionId, item.rows[0].id],
      );

      await migrateDown(pool, migrationsDir, 1);

      // Structural shell only: table exists, is empty, keeps the 0003
      // shape -- history is NOT reconstructed.
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(true);
      const shellRows = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_nodes",
      );
      expect(Number(shellRows.rows[0].count)).toBe(0);
      const columns = await pool.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'reward_program_version_qualifying_nodes' ORDER BY ordinal_position`,
      );
      expect(columns.rows.map((r) => r.column_name)).toEqual([
        "reward_program_version_id",
        "knowledge_node_id",
        "business_display_name",
      ]);

      // The new authoritative structures are untouched by the rollback.
      const junction = await pool.query(
        "SELECT count(*) FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1",
        [versionId],
      );
      expect(Number(junction.rows[0].count)).toBe(1);

      // Re-applying 0019 over the empty shell drops it again.
      const reapplied = await migrateUp(pool, migrationsDir);
      expect(reapplied.applied).toEqual(["0019"]);
      expect(await tableExists("reward_program_version_qualifying_nodes")).toBe(false);
    }, 15000);
  });

  /**
   * `PLATFORM-BASELINE-013C` — the additive purchase-binding column and its
   * two composite foreign keys. Design: PB-012 §7/§10/§13. These prove the
   * relational guarantees directly against raw SQL (the second layer behind
   * the application's in-transaction membership check): a cross-Business or
   * non-qualifying item is structurally impossible, a legacy NULL is exempt,
   * and a recorded item can never be deleted away.
   */
  describe("PLATFORM-BASELINE-013C: purchase_records qualifying-item binding", () => {
    beforeEach(async () => {
      await migrateUp(pool, migrationsDir);
    });

    async function insertProgram(businessId: string): Promise<string> {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO reward_programs (business_id, display_name, reward_program_category_id, status, created_by, updated_by)
         VALUES ($1, 'Test Program', 'cat-1', 'draft', 'user-1', 'user-1') RETURNING id`,
        [businessId],
      );
      return result.rows[0].id;
    }

    async function insertVersion(programId: string): Promise<string> {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO reward_program_versions
           (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
         VALUES ($1, 1, 10, 1, false, 'desc', now(), 'draft', 'user-1') RETURNING id`,
        [programId],
      );
      return result.rows[0].id;
    }

    async function insertItem(businessId: string, name: string): Promise<string> {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO qualifying_items (business_id, name, knowledge_node_id, status, created_by, updated_by)
         VALUES ($1, $2, NULL, 'active', 'user-1', 'user-1') RETURNING id`,
        [businessId, name],
      );
      return result.rows[0].id;
    }

    async function bindItem(versionId: string, itemId: string): Promise<void> {
      await pool.query(
        `INSERT INTO reward_program_version_qualifying_items
           (reward_program_version_id, qualifying_item_id, item_name_at_version)
         VALUES ($1, $2, 'Bound Item')`,
        [versionId, itemId],
      );
    }

    async function insertPurchase(params: {
      businessId: string;
      programId: string;
      versionId: string;
      qualifyingItemId: string | null;
    }): Promise<void> {
      await pool.query(
        `INSERT INTO purchase_records
           (business_id, customer_identity_id, presented_artifact_type, presented_artifact_reference,
            canonical_loyalty_number_value, reward_program_id, reward_program_version_id,
            shared_loyalty_number_allowed, multiple_units_allowed, branch_id,
            recorded_by_user_id, recorded_by_role, quantity, qualifying_item_id, item_label,
            purchase_date, correlation_id)
         VALUES ($1, 'cust-1', 'loyalty_number', 'ABC234',
                 'ABC234', $2, $3,
                 false, true, 'branch-1',
                 'user-1', 'staff', 1, $4, 'Snapshot',
                 now(), 'corr-1')`,
        [params.businessId, params.programId, params.versionId, params.qualifyingItemId],
      );
    }

    it("allows a legacy NULL qualifying_item_id and accepts a same-Business, version-bound item", async () => {
      const businessId = "biz-013c-ok";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      const itemId = await insertItem(businessId, "Black Coffee");
      await bindItem(versionId, itemId);

      await insertPurchase({ businessId, programId, versionId, qualifyingItemId: null });
      await insertPurchase({ businessId, programId, versionId, qualifyingItemId: itemId });

      const rows = await pool.query<{ qualifying_item_id: string | null }>(
        `SELECT qualifying_item_id FROM purchase_records ORDER BY created_at, id`,
      );
      expect(rows.rows.map((r) => r.qualifying_item_id)).toEqual([null, itemId]);
    });

    it("rejects a purchase item that belongs to another Business (purchase_records_item_in_business)", async () => {
      const businessId = "biz-013c-A";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      const ownItem = await insertItem(businessId, "A Item");
      await bindItem(versionId, ownItem);
      const foreignItem = await insertItem("biz-013c-B", "B Item");

      await expect(
        insertPurchase({ businessId, programId, versionId, qualifyingItemId: foreignItem }),
      ).rejects.toThrow(/purchase_records_item_in_business/);
    });

    it("rejects a same-Business item that is not on the purchase's version (purchase_records_item_in_version)", async () => {
      const businessId = "biz-013c-unbound";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      const boundItem = await insertItem(businessId, "Bound");
      await bindItem(versionId, boundItem);
      const unboundItem = await insertItem(businessId, "Unbound");

      await expect(
        insertPurchase({ businessId, programId, versionId, qualifyingItemId: unboundItem }),
      ).rejects.toThrow(/purchase_records_item_in_version/);
    });

    it("pins a recorded purchase's item and its version binding with ON DELETE RESTRICT", async () => {
      const businessId = "biz-013c-restrict";
      const programId = await insertProgram(businessId);
      const versionId = await insertVersion(programId);
      const itemId = await insertItem(businessId, "Restricted Item");
      await bindItem(versionId, itemId);
      await insertPurchase({ businessId, programId, versionId, qualifyingItemId: itemId });

      // The version binding cannot be removed while a purchase references it
      // (purchase_records_item_in_version, RESTRICT)...
      await expect(
        pool.query(
          `DELETE FROM reward_program_version_qualifying_items WHERE qualifying_item_id = $1`,
          [itemId],
        ),
      ).rejects.toThrow(/purchase_records_item_in_version/);
      // ...and the item itself cannot be removed while either the binding or
      // the recorded purchase references it.
      await expect(
        pool.query(`DELETE FROM qualifying_items WHERE id = $1`, [itemId]),
      ).rejects.toThrow();
    });
  });
});
