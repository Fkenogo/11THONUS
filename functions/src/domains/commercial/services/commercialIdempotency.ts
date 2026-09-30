/**
 * Commercial idempotency adapter (`WP-COM-01`; design §23).
 *
 * Adds NO idempotency framework. It wraps the repository's existing generic
 * `idempotency_keys` primitives (`checkAndReserveIdempotencyKey`,
 * `completeIdempotencyKeyInTransaction`) in the repository's single-
 * transaction convention, so future Commercial commands cannot get the
 * ordering wrong:
 *
 *   BEGIN -> reserve key -> run the mutation -> complete key -> COMMIT
 *
 * Because reservation and completion are inside the SAME transaction as the
 * mutation, a thrown error rolls the reservation back with everything else:
 * a failed attempt never leaves a `processing` (or `completed`) row behind
 * and the key stays reusable. The key is completed only after the mutation
 * callback returns, i.e. never on a failed path. A hold/no-op that a future
 * command decides to make simply must not call this runner (design §23: no
 * key is ever reserved for a no-op).
 */

import { createHash } from "node:crypto";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
} from "../../rewardProgram/repositories/idempotencyRepository";

/** Prefix every Commercial operation type so keys are attributable in the shared table. */
export const COMMERCIAL_OPERATION_PREFIX = "commercial.";

export type RunCommercialCommandParams = {
  /** Client-supplied key (never generated server-side for a client command). */
  readonly idempotencyKey: string;
  /** Command name, e.g. `grantTrial`; stored as `commercial.<commandType>`. */
  readonly commandType: string;
  readonly actorId: string;
  /** Stable hash of the request payload; same key + different hash => `conflict`. */
  readonly requestHash: string;
  readonly correlationId: string;
};

export type CommercialCommandOutcome<T> =
  | { readonly outcome: "executed"; readonly result: T }
  | { readonly outcome: "duplicate"; readonly responseSnapshot: unknown }
  | { readonly outcome: "in_progress" }
  | { readonly outcome: "conflict" };

export type CommercialCommandBody<T> = (
  tx: PlatformPostgresTransaction,
) => Promise<{ readonly result: T; readonly resultReference?: string }>;

/**
 * The shared repository compares only `request_hash` for an existing key (it
 * stores `operation_type` and `actor_id` but never checks them), so the command
 * type and actor are folded into the hash here: the same key reused for a
 * different Commercial command or administrator is a `conflict`, never a
 * `duplicate` that replays another command's result.
 */
function bindRequestHash(params: RunCommercialCommandParams): string {
  return createHash("sha256")
    .update(JSON.stringify([params.commandType, params.actorId, params.requestHash]))
    .digest("hex");
}

export async function runCommercialCommand<T>(
  pool: PlatformPostgresPool,
  params: RunCommercialCommandParams,
  body: CommercialCommandBody<T>,
): Promise<CommercialCommandOutcome<T>> {
  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: `${COMMERCIAL_OPERATION_PREFIX}${params.commandType}`,
      actorId: params.actorId,
      requestHash: bindRequestHash(params),
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return { outcome: "duplicate", responseSnapshot: reservation.responseSnapshot } as const;
    }
    if (reservation.outcome === "in_progress") return { outcome: "in_progress" } as const;
    if (reservation.outcome === "conflict") return { outcome: "conflict" } as const;

    // Any throw below aborts the whole transaction, including the reservation.
    const { result, resultReference } = await body(tx);
    await completeIdempotencyKeyInTransaction(
      tx,
      params.idempotencyKey,
      resultReference ?? null,
      result,
    );
    return { outcome: "executed", result } as const;
  });
}
