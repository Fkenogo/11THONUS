/**
 * Deterministic PostgreSQL migration mechanism (PLATFORM-BASELINE-001).
 *
 * Minimal, dependency-free (beyond `pg`, already required for the
 * connection itself) migration runner: plain, ordered `NNNN_name.sql`
 * files, each applied in its own transaction, tracked in a
 * `schema_migrations` bookkeeping table. That table is this module's own
 * required bootstrap step, created directly by `ensureMigrationsTable` —
 * it is migration-system metadata intrinsic to the mechanism itself, not a
 * product/domain table. This package's real, shipped `migrations/`
 * directory is intentionally empty (see `migrations/README.md`); no
 * loyalty-spine table is created by this package.
 *
 * Rollback model: each `NNNN_name.sql` file may have a matching
 * `NNNN_name.down.sql`. `migrateDown` reverses the most recently applied
 * migrations in strict reverse order and fails closed — without rolling
 * back anything — if any migration in the requested range has no matching
 * `.down.sql` file. A migration with no down file is a deliberately
 * irreversible forward-only change; the correct way to undo it is a new
 * forward migration, not a silent skip during rollback.
 */

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { PlatformPostgresPool } from "./postgresPool";

const SCHEMA_MIGRATIONS_TABLE = "schema_migrations";

export type MigrationFile = {
  version: string;
  name: string;
  upPath: string;
  downPath: string | null;
};

export type AppliedMigration = {
  version: string;
  name: string;
  checksum: string;
  appliedAt: Date;
};

async function ensureMigrationsTable(pool: PlatformPostgresPool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${SCHEMA_MIGRATIONS_TABLE} (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

function checksumOf(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

/** Scans `migrationsDir` for `NNNN_name.sql` files (and their optional `NNNN_name.down.sql` counterparts), sorted in version order. Returns an empty list for a missing/empty directory — a package with no migrations of its own is a valid, supported state. */
export async function discoverMigrationFiles(migrationsDir: string): Promise<MigrationFile[]> {
  let entries: string[];
  try {
    entries = await readdir(migrationsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const upFileNames = entries.filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"));
  const files: MigrationFile[] = [];
  for (const fileName of upFileNames) {
    const match = /^(\d+)_(.+)\.sql$/.exec(fileName);
    if (!match) {
      throw new Error(
        `Migration file "${fileName}" does not match the required "NNNN_name.sql" naming convention.`,
      );
    }
    const [, version, name] = match;
    const downFileName = `${version}_${name}.down.sql`;
    const downPath = entries.includes(downFileName) ? path.join(migrationsDir, downFileName) : null;
    files.push({ version, name, upPath: path.join(migrationsDir, fileName), downPath });
  }

  files.sort((a, b) => a.version.localeCompare(b.version));

  const seen = new Set<string>();
  for (const file of files) {
    if (seen.has(file.version)) {
      throw new Error(`Duplicate migration version "${file.version}" in ${migrationsDir}.`);
    }
    seen.add(file.version);
  }

  return files;
}

/** Reads the current migration state from `schema_migrations`, creating that bookkeeping table first if it does not yet exist (a fresh/empty database is a valid starting state, not an error). */
export async function getAppliedMigrations(
  pool: PlatformPostgresPool,
): Promise<AppliedMigration[]> {
  await ensureMigrationsTable(pool);
  const result = await pool.query<{
    version: string;
    name: string;
    checksum: string;
    applied_at: Date;
  }>(
    `SELECT version, name, checksum, applied_at FROM ${SCHEMA_MIGRATIONS_TABLE} ORDER BY version ASC`,
  );
  return result.rows.map((row) => ({
    version: row.version,
    name: row.name,
    checksum: row.checksum,
    appliedAt: row.applied_at,
  }));
}

export type MigrationRunResult = {
  applied: string[];
  alreadyApplied: string[];
};

/**
 * Applies every pending migration in `migrationsDir`, in version order,
 * each in its own transaction. Re-running against an already-migrated
 * database is a safe no-op for every already-applied version — never a
 * destructive reset. A checksum mismatch between an already-applied
 * migration's recorded checksum and its current file content fails closed
 * rather than silently proceeding: migrations must never be edited after
 * being applied.
 */
export async function migrateUp(
  pool: PlatformPostgresPool,
  migrationsDir: string,
): Promise<MigrationRunResult> {
  await ensureMigrationsTable(pool);
  const files = await discoverMigrationFiles(migrationsDir);
  const applied = await getAppliedMigrations(pool);
  const appliedByVersion = new Map(applied.map((a) => [a.version, a]));

  const appliedNow: string[] = [];
  const alreadyApplied: string[] = [];

  for (const file of files) {
    const sql = await readFile(file.upPath, "utf8");
    const checksum = checksumOf(sql);
    const existing = appliedByVersion.get(file.version);

    if (existing) {
      if (existing.checksum !== checksum) {
        throw new Error(
          `Migration ${file.version}_${file.name}.sql has changed since it was applied ` +
            `(checksum mismatch). Migrations must never be edited after being applied; ` +
            `author a new migration instead.`,
        );
      }
      alreadyApplied.push(file.version);
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO ${SCHEMA_MIGRATIONS_TABLE} (version, name, checksum) VALUES ($1, $2, $3)`,
        [file.version, file.name, checksum],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    appliedNow.push(file.version);
  }

  return { applied: appliedNow, alreadyApplied };
}

export type MigrationRollbackResult = { rolledBack: string[] };

/**
 * Rolls back the `count` most recently applied migrations, in strict
 * reverse order, each in its own transaction. Validates that every
 * migration in the requested range has a matching `.down.sql` file
 * *before* rolling back any of them — a partially-completed rollback that
 * stops mid-sequence because a later step turned out to be irreversible is
 * never allowed to happen.
 */
export async function migrateDown(
  pool: PlatformPostgresPool,
  migrationsDir: string,
  count: number,
): Promise<MigrationRollbackResult> {
  if (count <= 0) {
    return { rolledBack: [] };
  }
  await ensureMigrationsTable(pool);
  const files = await discoverMigrationFiles(migrationsDir);
  const filesByVersion = new Map(files.map((f) => [f.version, f]));
  const applied = await getAppliedMigrations(pool);
  const toRollBack = applied.slice(-count).reverse();

  for (const migration of toRollBack) {
    const file = filesByVersion.get(migration.version);
    if (!file || !file.downPath) {
      throw new Error(
        `Cannot roll back migration ${migration.version}_${migration.name}: no matching ` +
          `".down.sql" file exists. Author a new forward migration instead of rolling back ` +
          `an irreversible change.`,
      );
    }
  }

  const rolledBack: string[] = [];
  for (const migration of toRollBack) {
    const file = filesByVersion.get(migration.version)!;
    const sql = await readFile(file.downPath!, "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`DELETE FROM ${SCHEMA_MIGRATIONS_TABLE} WHERE version = $1`, [
        migration.version,
      ]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    rolledBack.push(migration.version);
  }

  return { rolledBack };
}
