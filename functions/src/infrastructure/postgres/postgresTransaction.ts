/**
 * PostgreSQL transaction handle abstraction (PLATFORM-BASELINE-001).
 *
 * The Postgres-side counterpart to how Firestore domains thread a
 * `Transaction` through repository calls (`db.runTransaction(...)`,
 * `shared/outbox/outboxWriter.ts`'s `writeOutboxEntry(transaction, db,
 * event)` convention). Every future Postgres-authoritative domain must
 * receive its transaction handle from `withPlatformTransaction`, never open
 * its own `BEGIN`/`COMMIT` — this is the seam the approved design
 * (`PLATFORM-BASELINE-DESIGN-001-CORR-001` §6, `PlatformDatastorePort`)
 * requires so domain services never import `pg` directly.
 *
 * No loyalty-domain repository is implemented here — this module only
 * proves the transaction primitive itself.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "./postgresPool";

/** The transaction handle every future Postgres-backed repository function receives. */
export type PlatformPostgresTransaction = PoolClient;

/**
 * Runs `fn` inside one PostgreSQL transaction: `BEGIN` before, `COMMIT` on
 * success, `ROLLBACK` on any thrown error — no partial write survives a
 * thrown error — and the client is always released back to the pool
 * (`finally`), whether the transaction committed, rolled back, or the
 * rollback itself failed. This is the single entry point through which
 * every future Postgres-authoritative domain transaction must run.
 */
export async function withPlatformTransaction<T>(
  pool: PlatformPostgresPool,
  fn: (tx: PlatformPostgresTransaction) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {
      // A rollback failure (e.g. the connection already broke) must never
      // mask the original error that triggered it.
    });
    throw error;
  } finally {
    client.release();
  }
}
