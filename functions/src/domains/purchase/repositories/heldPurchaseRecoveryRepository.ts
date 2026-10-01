/**
 * Read-only queries for held-Purchase recovery and backlog observability (`WP-COM-06a`).
 *
 * Every query is served by the existing partial index
 * `purchase_records_pending_admission_fifo_idx (business_id, purchase_date, id)
 * WHERE status = 'pending_admission'` (migration 0026); no schema change. Nothing here locks or
 * writes: the processor takes its own locks per Purchase.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";

type Queryable = PlatformPostgresPool | PlatformPostgresTransaction;

/**
 * Keyset position in the FIFO order `(purchase_date, id)`. `purchaseDate` is the database's own
 * text rendering of the `timestamptz` (microsecond-exact); it round-trips through `::timestamptz`
 * with no JavaScript `Date` precision loss.
 */
export type PendingScanCursor = { readonly purchaseDate: string; readonly id: string };

export type PendingAdmissionWindowRow = {
  readonly id: string;
  readonly cursor: PendingScanCursor;
};

export type PendingAdmissionWindow = {
  /** At most `limit` rows, oldest first, strictly after `after` when given. */
  readonly rows: readonly PendingAdmissionWindowRow[];
  /** True when at least one more held Purchase exists beyond this window (saturation). */
  readonly hasMore: boolean;
};

/** One bounded FIFO window of a Business's held Purchases, starting strictly after `after`. */
export async function listPendingAdmissionWindow(
  db: Queryable,
  params: {
    readonly businessId: string;
    readonly limit: number;
    readonly after: PendingScanCursor | null;
  },
): Promise<PendingAdmissionWindow> {
  const values: unknown[] = [params.businessId, params.limit + 1];
  let keyset = "";
  if (params.after !== null) {
    values.push(params.after.purchaseDate, params.after.id);
    keyset = "AND (purchase_date, id) > ($3::timestamptz, $4::uuid)";
  }
  const result = await db.query<{ id: string; purchase_date_text: string }>(
    `SELECT id, purchase_date::text AS purchase_date_text
       FROM purchase_records
      WHERE business_id = $1 AND status = 'pending_admission' ${keyset}
      ORDER BY purchase_date ASC, id ASC
      LIMIT $2`,
    values,
  );
  const hasMore = result.rows.length > params.limit;
  const rows = result.rows.slice(0, params.limit).map((r) => ({
    id: r.id,
    cursor: { purchaseDate: r.purchase_date_text, id: r.id },
  }));
  return { rows, hasMore };
}

/**
 * Businesses that hold at least one `pending_admission` Purchase, in a STABLE order
 * (`business_id` ascending), strictly after `after`. A stable keyset order -- not "oldest
 * Purchase first" -- is what lets a persisted cursor walk the whole set across runs so no
 * Business beyond the first batch can be starved.
 */
export async function listBusinessesWithPendingAdmissionAfter(
  db: Queryable,
  params: { readonly after: string | null; readonly limit: number },
): Promise<string[]> {
  const result = await db.query<{ business_id: string }>(
    `SELECT DISTINCT business_id FROM purchase_records
      WHERE status = 'pending_admission' AND ($1::text IS NULL OR business_id > $1)
      ORDER BY business_id ASC
      LIMIT $2`,
    [params.after, params.limit],
  );
  return result.rows.map((r) => r.business_id);
}

export type HeldPurchaseBacklogBusiness = {
  readonly businessId: string;
  readonly pending: number;
  readonly oldestPurchaseDate: Date;
};

export type HeldPurchaseBacklog = {
  readonly totalPending: number;
  readonly businessesWithPending: number;
  /** Oldest held Purchase's `purchase_date` anywhere, or null when nothing is held. */
  readonly oldestPurchaseDate: Date | null;
  /** The `topBusinesses` largest backlogs (pending desc, then business id). */
  readonly topBusinesses: readonly HeldPurchaseBacklogBusiness[];
  /** Businesses whose backlog exceeds `windowLimit` (rows beyond a head window exist). */
  readonly businessesOverWindow: number;
};

/** Snapshot of the held-Purchase backlog (read-only aggregates over the FIFO index). */
export async function getHeldPurchaseBacklog(
  db: Queryable,
  params: { readonly topBusinesses: number; readonly windowLimit: number },
): Promise<HeldPurchaseBacklog> {
  const totals = await db.query<{
    total: string;
    businesses: string;
    oldest: Date | null;
    over_window: string;
  }>(
    `WITH per AS (
       SELECT business_id, COUNT(*) AS pending, MIN(purchase_date) AS oldest
         FROM purchase_records WHERE status = 'pending_admission' GROUP BY business_id)
     SELECT COALESCE(SUM(pending), 0)::text AS total,
            COUNT(*)::text AS businesses,
            MIN(oldest) AS oldest,
            COUNT(*) FILTER (WHERE pending > $1)::text AS over_window
       FROM per`,
    [params.windowLimit],
  );
  const top = await db.query<{ business_id: string; pending: string; oldest: Date }>(
    `SELECT business_id, COUNT(*)::text AS pending, MIN(purchase_date) AS oldest
       FROM purchase_records WHERE status = 'pending_admission'
      GROUP BY business_id
      ORDER BY COUNT(*) DESC, business_id ASC
      LIMIT $1`,
    [params.topBusinesses],
  );
  const t = totals.rows[0];
  return {
    totalPending: Number(t?.total ?? 0),
    businessesWithPending: Number(t?.businesses ?? 0),
    oldestPurchaseDate: t?.oldest ?? null,
    businessesOverWindow: Number(t?.over_window ?? 0),
    topBusinesses: top.rows.map((r) => ({
      businessId: r.business_id,
      pending: Number(r.pending),
      oldestPurchaseDate: r.oldest,
    })),
  };
}

/** Current status of one Purchase (plain read), or `null` when it does not exist. */
export async function readPurchaseStatus(
  db: Queryable,
  purchaseId: string,
): Promise<string | null> {
  const result = await db.query<{ status: string }>(
    "SELECT status FROM purchase_records WHERE id = $1",
    [purchaseId],
  );
  return result.rows[0]?.status ?? null;
}
