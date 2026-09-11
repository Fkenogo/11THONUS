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

/** Read-only existence probe for `schema_migrations` — never creates the table (unlike `ensureMigrationsTable`). */
async function migrationsTableExists(pool: PlatformPostgresPool): Promise<boolean> {
  const result = await pool.query<{ t: string | null }>(
    `SELECT to_regclass('${SCHEMA_MIGRATIONS_TABLE}') AS t`,
  );
  return result.rows[0]?.t != null;
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

async function readMigrationsTableRows(pool: PlatformPostgresPool): Promise<AppliedMigration[]> {
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

/**
 * Reads the current migration state from `schema_migrations`, creating
 * that bookkeeping table first if it does not yet exist (a fresh/empty
 * database is a valid starting state, not an error). This is the
 * mutation-capable inspection used by the migration runner itself — the
 * read-only readiness probe must use `readAppliedMigrations` instead.
 */
export async function getAppliedMigrations(
  pool: PlatformPostgresPool,
): Promise<AppliedMigration[]> {
  await ensureMigrationsTable(pool);
  return readMigrationsTableRows(pool);
}

/**
 * Strictly read-only migration-state inspection. Never creates
 * `schema_migrations` and never mutates the database. Returns `null` when
 * the bookkeeping table does not exist (a fresh database whose migration
 * foundation has not been established), and the applied rows otherwise.
 */
export async function readAppliedMigrations(
  pool: PlatformPostgresPool,
): Promise<AppliedMigration[] | null> {
  if (!(await migrationsTableExists(pool))) {
    return null;
  }
  return readMigrationsTableRows(pool);
}

export type MigrationHistoryValidation =
  | { ok: true; pending: MigrationFile[]; applied: AppliedMigration[] }
  | { ok: false; reason: string };

/**
 * Shared migration-integrity validation used by both the migration runner
 * (before it executes any SQL) and the read-only readiness probe. The
 * persisted applied migrations must form an **exact ordered prefix** of
 * the deterministically-sorted discovered files, with every applied row's
 * `name` and `checksum` matching the corresponding checked-in file:
 *
 * - no gap (a later migration applied while an earlier one is missing);
 * - no unknown applied version (a row with no matching discovered file);
 * - no version/name inconsistency;
 * - no checksum mismatch (an applied file edited after application).
 *
 * Returns `{ ok: false, reason }` on the first violation without mutating
 * anything — callers fail closed and make no schema change.
 */
export async function validateMigrationHistory(
  files: MigrationFile[],
  applied: AppliedMigration[],
): Promise<MigrationHistoryValidation> {
  const sortedFiles = [...files].sort((a, b) => a.version.localeCompare(b.version));
  const sortedApplied = [...applied].sort((a, b) => a.version.localeCompare(b.version));
  const filesByVersion = new Map(sortedFiles.map((f) => [f.version, f] as const));

  for (let i = 0; i < sortedApplied.length; i++) {
    const row = sortedApplied[i];
    const file = filesByVersion.get(row.version);
    if (!file) {
      return {
        ok: false,
        reason: `Unknown applied migration "${row.version}_${row.name}" — it is not present in the discovered migration files.`,
      };
    }
    const expectedAtPosition = sortedFiles[i];
    if (!expectedAtPosition || expectedAtPosition.version !== row.version) {
      return {
        ok: false,
        reason:
          `Migration history is not an exact ordered prefix: version "${row.version}" is applied ` +
          `while the earlier migration "${expectedAtPosition?.version ?? "unknown"}" is missing.`,
      };
    }
    if (file.name !== row.name) {
      return {
        ok: false,
        reason:
          `Applied migration "${row.version}" records name "${row.name}" but the ` +
          `discovered file is named "${file.name}" — the migration identity does not match.`,
      };
    }
    const sql = await readFile(file.upPath, "utf8");
    const checksum = checksumOf(sql);
    if (row.checksum !== checksum) {
      return {
        ok: false,
        reason:
          `Migration ${file.version}_${file.name}.sql has changed since it was applied ` +
          `(checksum mismatch). Migrations must never be edited after being applied; ` +
          `author a new migration instead.`,
      };
    }
  }

  const appliedVersions = new Set(sortedApplied.map((a) => a.version));
  const pending = sortedFiles.filter((f) => !appliedVersions.has(f.version));

  return { ok: true, pending, applied: sortedApplied };
}

export type MigrationRunResult = {
  applied: string[];
  alreadyApplied: string[];
};

/**
 * Applies every pending migration in `migrationsDir`, in version order,
 * each in its own transaction. Re-running against an already-migrated
 * database is a safe no-op for every already-applied version — never a
 * destructive reset.
 *
 * Before executing any SQL, the persisted applied migrations are validated
 * as an exact ordered prefix of the discovered sequence (via
 * `validateMigrationHistory`) — no gap, no unknown version, no
 * version/name inconsistency, no checksum mismatch — and the run fails
 * closed, making no schema change, if that validation does not hold. A
 * checksum mismatch (an applied migration edited after application) is
 * likewise rejected rather than silently proceeding: migrations must never
 * be edited after being applied.
 */
export async function migrateUp(
  pool: PlatformPostgresPool,
  migrationsDir: string,
): Promise<MigrationRunResult> {
  await ensureMigrationsTable(pool);
  const files = await discoverMigrationFiles(migrationsDir);
  const applied = await getAppliedMigrations(pool);

  const validation = await validateMigrationHistory(files, applied);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const appliedNow: string[] = [];

  for (const file of validation.pending) {
    const sql = await readFile(file.upPath, "utf8");
    const checksum = checksumOf(sql);
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

  return { applied: appliedNow, alreadyApplied: validation.applied.map((a) => a.version) };
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
