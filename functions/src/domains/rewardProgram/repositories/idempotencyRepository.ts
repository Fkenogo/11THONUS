/**
 * Generic PostgreSQL idempotency-key repository (`PLATFORM-BASELINE-005A`).
 *
 * Mirrors the existing Firestore `idempotencyRecords` contract
 * (`shared/idempotency/idempotencyService.ts`: same key + same request ->
 * replay; same key + different request -> conflict; "failed" is
 * retryable) -- but simpler and strictly more atomic, because every
 * caller in this domain reserves, mutates, and completes a key inside ONE
 * `withPlatformTransaction` call (never Firestore's own split "reserve in
 * one transaction, complete in a second, later call" shape, which is
 * exactly the ambiguous-committed-success pattern
 * `PLATFORM-BASELINE-003-CORR-001`/`PLATFORM-BASELINE-004A-CORR-001` found
 * and fixed).
 *
 * A consequence of that single-transaction shape: there is no separate
 * `failIdempotencyKey` call needed. If a command throws after reserving a
 * key but before completing it, the whole PostgreSQL transaction --
 * including the reservation row itself -- rolls back. The next attempt
 * with the same key then observes "no existing record", which
 * `evaluateReservation` already treats identically to a resolved "failed"
 * record: eligible to retry, never permanently stuck.
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";

export type IdempotencyReservationResult =
  | { readonly outcome: "acquired" }
  | { readonly outcome: "in_progress" }
  | { readonly outcome: "duplicate"; readonly responseSnapshot: unknown }
  | { readonly outcome: "conflict" };

export type CheckAndReserveParams = {
  readonly idempotencyKey: string;
  readonly operationType: string;
  readonly actorId: string;
  readonly requestHash: string;
  readonly correlationId: string;
};

type IdempotencyDbRow = {
  request_hash: string;
  status: "processing" | "completed" | "failed";
  response_snapshot: unknown;
};

/**
 * Reserves `params.idempotencyKey` for the caller's domain mutation inside
 * the caller's own transaction, row-locked (`FOR UPDATE`) so two
 * concurrent requests for the same key serialize rather than race.
 */
export async function checkAndReserveIdempotencyKey(
  tx: PlatformPostgresTransaction,
  params: CheckAndReserveParams,
): Promise<IdempotencyReservationResult> {
  const existing = await tx.query<IdempotencyDbRow>(
    `SELECT request_hash, status, response_snapshot FROM idempotency_keys WHERE idempotency_key = $1 FOR UPDATE`,
    [params.idempotencyKey],
  );

  if (existing.rows.length === 0) {
    await tx.query(
      `INSERT INTO idempotency_keys (idempotency_key, operation_type, actor_id, request_hash, status, correlation_id)
       VALUES ($1, $2, $3, $4, 'processing', $5)`,
      [
        params.idempotencyKey,
        params.operationType,
        params.actorId,
        params.requestHash,
        params.correlationId,
      ],
    );
    return { outcome: "acquired" };
  }

  const row = existing.rows[0];
  if (row.request_hash !== params.requestHash) {
    return { outcome: "conflict" };
  }
  if (row.status === "processing") {
    return { outcome: "in_progress" };
  }
  if (row.status === "completed") {
    return { outcome: "duplicate", responseSnapshot: row.response_snapshot };
  }
  // status === "failed": retryable, same key + same request re-enters processing.
  await tx.query(
    `UPDATE idempotency_keys SET status = 'processing', reserved_at = now(), completed_at = NULL WHERE idempotency_key = $1`,
    [params.idempotencyKey],
  );
  return { outcome: "acquired" };
}

export type IdempotencyPeekResult =
  | { readonly outcome: "none" }
  | { readonly outcome: "duplicate"; readonly responseSnapshot: unknown }
  | { readonly outcome: "other" };

/**
 * Read-only, non-reserving peek at an idempotency key, outside any
 * transaction. Lets a command with expensive pre-transaction work (e.g.
 * publish's authoritative Firestore validation, which the design's RF-3
 * contract requires to happen BEFORE the PostgreSQL transaction opens)
 * short-circuit a genuine same-key/same-request replay immediately,
 * without re-running preconditions against state a completed command may
 * have already changed (e.g. a version that is no longer "draft" precisely
 * *because* the first, now-replayed call already published it).
 *
 * Only ever used to decide whether to skip pre-checks -- the real
 * correctness guarantee (conflict/in-progress detection, atomic reserve)
 * still comes from `checkAndReserveIdempotencyKey` inside the transaction
 * every command runs regardless of what this peek returns.
 */
export async function peekIdempotencyKey(
  pool: PlatformPostgresPool,
  idempotencyKey: string,
  requestHash: string,
): Promise<IdempotencyPeekResult> {
  const existing = await pool.query<IdempotencyDbRow>(
    `SELECT request_hash, status, response_snapshot FROM idempotency_keys WHERE idempotency_key = $1`,
    [idempotencyKey],
  );
  if (existing.rows.length === 0) {
    return { outcome: "none" };
  }
  const row = existing.rows[0];
  if (row.request_hash === requestHash && row.status === "completed") {
    return { outcome: "duplicate", responseSnapshot: row.response_snapshot };
  }
  return { outcome: "other" };
}

/** Stages the "completed" write inside the SAME transaction as the caller's domain mutation. */
export async function completeIdempotencyKeyInTransaction(
  tx: PlatformPostgresTransaction,
  idempotencyKey: string,
  resultReference: string | null,
  responseSnapshot: unknown,
): Promise<void> {
  await tx.query(
    `UPDATE idempotency_keys
        SET status = 'completed', completed_at = now(), result_reference = $2, response_snapshot = $3
      WHERE idempotency_key = $1`,
    [
      idempotencyKey,
      resultReference,
      responseSnapshot === undefined ? null : JSON.stringify(responseSnapshot),
    ],
  );
}
