/**
 * Platform Foundation Readiness contract (PLATFORM-BASELINE-001).
 *
 * Read-only, server-authoritative check for exactly the foundation this
 * package establishes: PostgreSQL connectivity, migration mechanism state,
 * Platform Administrator establishment, and Commerce Knowledge baseline
 * establishment.
 *
 * Deliberately named "Platform Foundation Readiness", not "11thONUS
 * Platform Operational Baseline" — the latter additionally requires
 * Business onboarding/activation, Reward Program, Purchase, verification,
 * Verified Units, Loyalty Cycle, Reward, redemption, and trusted evidence,
 * none of which this package implements or checks
 * (`PLATFORM-BASELINE-DESIGN-001-CORR-001` §8/§14). A `ready: true` result
 * from this function is not a claim that the platform can serve a real
 * Business or a real customer — only that the technical foundation those
 * future packages will build on already exists and is reachable.
 *
 * This function never creates a resource, never seeds anything, never
 * mutates product state, and never activates a Business — every check it
 * performs is a pure read.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "./postgresPool";
import {
  discoverMigrationFiles,
  readAppliedMigrations,
  validateMigrationHistory,
} from "./migrationRunner";

export type PlatformFoundationReadinessCheck = {
  name: string;
  ready: boolean;
  reason?: string;
};

export type PlatformFoundationReadinessResult = {
  ready: boolean;
  checks: PlatformFoundationReadinessCheck[];
};

export type PlatformFoundationReadinessDeps = {
  postgresPool: PlatformPostgresPool;
  migrationsDir: string;
  firestore: Firestore;
  checkPlatformAdministratorEstablished: (db: Firestore) => Promise<boolean>;
  checkCommerceKnowledgeBaselineEstablished: (db: Firestore) => Promise<boolean>;
};

async function checkPostgresConnectivity(
  pool: PlatformPostgresPool,
): Promise<PlatformFoundationReadinessCheck> {
  try {
    await pool.query("SELECT 1");
    return { name: "postgres_connectivity", ready: true };
  } catch (error) {
    return {
      name: "postgres_connectivity",
      ready: false,
      reason: error instanceof Error ? error.message : "unknown error",
    };
  }
}

async function checkMigrationState(
  pool: PlatformPostgresPool,
  migrationsDir: string,
): Promise<PlatformFoundationReadinessCheck> {
  try {
    const files = await discoverMigrationFiles(migrationsDir);
    // Strictly read-only: never creates `schema_migrations`. If the
    // bookkeeping table does not exist the migration foundation has not
    // been established, and this is reported not-ready even when the
    // discovered migration set is empty — a fresh database with no
    // `schema_migrations` is never "ready", because the explicit
    // migration/bootstrap path (`migrateUp`) has not yet run.
    const applied = await readAppliedMigrations(pool);
    if (applied === null) {
      return {
        name: "migration_state",
        ready: false,
        reason: "migration foundation not established (schema_migrations table does not exist)",
      };
    }

    // Verifies integrity, not just version presence: applied migrations
    // must form an exact ordered prefix of the discovered files with
    // matching names and checksums (same shared validation the runner uses).
    const validation = await validateMigrationHistory(files, applied);
    if (!validation.ok) {
      return { name: "migration_state", ready: false, reason: validation.reason };
    }
    if (validation.pending.length > 0) {
      return {
        name: "migration_state",
        ready: false,
        reason:
          `${validation.pending.length} pending migration(s): ` +
          validation.pending.map((f) => f.version).join(", "),
      };
    }
    return { name: "migration_state", ready: true };
  } catch (error) {
    return {
      name: "migration_state",
      ready: false,
      reason: error instanceof Error ? error.message : "unknown error",
    };
  }
}

async function runBooleanCheck(
  name: string,
  fn: () => Promise<boolean>,
): Promise<PlatformFoundationReadinessCheck> {
  try {
    const ready = await fn();
    return { name, ready, reason: ready ? undefined : `${name} not yet established` };
  } catch (error) {
    return { name, ready: false, reason: error instanceof Error ? error.message : "unknown error" };
  }
}

/**
 * Aggregates every foundation readiness check into one result. Every
 * individual check runs independently and is never allowed to throw out of
 * this function — a failing check is reported as `{ ready: false, reason }`
 * so one prerequisite's failure never hides the state of the others.
 */
export async function checkPlatformFoundationReadiness(
  deps: PlatformFoundationReadinessDeps,
): Promise<PlatformFoundationReadinessResult> {
  const checks = await Promise.all([
    checkPostgresConnectivity(deps.postgresPool),
    checkMigrationState(deps.postgresPool, deps.migrationsDir),
    runBooleanCheck("platform_administrator_established", () =>
      deps.checkPlatformAdministratorEstablished(deps.firestore),
    ),
    runBooleanCheck("commerce_knowledge_baseline_established", () =>
      deps.checkCommerceKnowledgeBaselineEstablished(deps.firestore),
    ),
  ]);

  return { ready: checks.every((c) => c.ready), checks };
}
