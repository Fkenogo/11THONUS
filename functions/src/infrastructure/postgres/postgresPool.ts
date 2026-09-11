/**
 * PostgreSQL connection pool boundary (PLATFORM-BASELINE-001).
 *
 * Wraps `pg.Pool` behind this repository's own type so calling code never
 * imports the `pg` package directly — mirroring the existing `db:
 * Firestore` threading convention, where domain services depend on a
 * repository-owned type rather than a third-party client library.
 *
 * Pool sizing note: this Functions runtime (`firebase-functions@7`, Cloud
 * Run under the hood) may serve more than one concurrent invocation per
 * warm instance. `PLATFORM_POSTGRES_POOL_MAX` (default `3`, see
 * `postgresConfig.ts`) is deliberately small — large enough to avoid
 * serializing unrelated requests on a single connection, small enough that
 * many concurrent warm instances do not collectively exhaust the
 * database's connection limit. This is a documented starting point, not a
 * value this package tunes for production load (no production Cloud SQL
 * instance is provisioned by this package).
 */

import { Pool, type PoolClient } from "pg";
import type { PostgresConfig } from "./postgresConfig";

export type PlatformPostgresPool = Pool;

export function createPostgresPool(config: PostgresConfig): PlatformPostgresPool {
  return new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
    max: config.poolMax,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: config.connectionTimeoutMillis,
  });
}

/** Clean shutdown for tests and controlled process exit — never called on a hot request path. */
export async function closePostgresPool(pool: PlatformPostgresPool): Promise<void> {
  await pool.end();
}

export type { PoolClient };
