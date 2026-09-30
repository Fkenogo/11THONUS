/**
 * Commercial ledger repository (`WP-COM-01`; design §7).
 *
 * The ledger is the ACCOUNTING AUTHORITY: this repository can only INSERT
 * and READ. No update or delete function exists, and the database rejects
 * UPDATE / DELETE / TRUNCATE by trigger regardless. Append through
 * `postCommercialLedgerEntry`, never directly, so the account is updated
 * under its lock in the same transaction.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  CommercialBucket,
  CommercialLedgerEntry,
  CommercialLedgerEntryType,
} from "../models/commercialFoundation";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

type LedgerRow = {
  id: string;
  business_id: string;
  account_version: string | number;
  entry_type: CommercialLedgerEntryType;
  bucket: CommercialBucket;
  units_delta: number;
  trial_reserved_delta: number;
  paid_reserved_delta: number;
  trial_after: number;
  paid_after: number;
  trial_reserved_after: number;
  paid_reserved_after: number;
  source_reference_type: string | null;
  source_reference_id: string | null;
  reason_code: string | null;
  reason_text: string | null;
  idempotency_scope_key: string;
  created_by: string;
  correlation_id: string;
  occurred_at: Date;
};

const LEDGER_COLUMNS = `id, business_id, account_version, entry_type, bucket, units_delta,
  trial_reserved_delta, paid_reserved_delta, trial_after, paid_after, trial_reserved_after,
  paid_reserved_after, source_reference_type, source_reference_id, reason_code, reason_text,
  idempotency_scope_key, created_by, correlation_id, occurred_at`;

function mapEntry(row: LedgerRow): CommercialLedgerEntry {
  return {
    id: row.id,
    businessId: row.business_id,
    accountVersion: Number(row.account_version),
    entryType: row.entry_type,
    bucket: row.bucket,
    unitsDelta: row.units_delta,
    trialReservedDelta: row.trial_reserved_delta,
    paidReservedDelta: row.paid_reserved_delta,
    trialAfter: row.trial_after,
    paidAfter: row.paid_after,
    trialReservedAfter: row.trial_reserved_after,
    paidReservedAfter: row.paid_reserved_after,
    sourceReferenceType: row.source_reference_type,
    sourceReferenceId: row.source_reference_id,
    reasonCode: row.reason_code,
    reasonText: row.reason_text,
    idempotencyScopeKey: row.idempotency_scope_key,
    createdBy: row.created_by,
    correlationId: row.correlation_id,
    occurredAt: row.occurred_at,
  };
}

export type InsertLedgerEntryParams = {
  readonly businessId: string;
  readonly accountVersion: number;
  readonly entryType: CommercialLedgerEntryType;
  readonly bucket: CommercialBucket;
  readonly unitsDelta: number;
  readonly trialReservedDelta: number;
  readonly paidReservedDelta: number;
  readonly trialAfter: number;
  readonly paidAfter: number;
  readonly trialReservedAfter: number;
  readonly paidReservedAfter: number;
  readonly sourceReference?: { readonly type: string; readonly id: string };
  readonly reasonCode?: string;
  readonly reasonText?: string;
  readonly idempotencyScopeKey: string;
  readonly createdBy: string;
  readonly correlationId: string;
};

/**
 * Appends one immutable entry. Returns `null` when `idempotency_scope_key`
 * already exists (an idempotent replay of the same accounting act: nothing
 * is written). Any other constraint violation (Business without an account,
 * malformed type/bucket/delta shape, duplicate version) throws.
 */
export async function insertLedgerEntry(
  tx: PlatformPostgresTransaction,
  params: InsertLedgerEntryParams,
): Promise<CommercialLedgerEntry | null> {
  const result = await tx.query<LedgerRow>(
    `INSERT INTO commercial_ledger_entries
       (business_id, account_version, entry_type, bucket, units_delta,
        trial_reserved_delta, paid_reserved_delta, trial_after, paid_after,
        trial_reserved_after, paid_reserved_after, source_reference_type, source_reference_id,
        reason_code, reason_text, idempotency_scope_key, created_by, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (idempotency_scope_key) DO NOTHING
     RETURNING ${LEDGER_COLUMNS}`,
    [
      params.businessId,
      params.accountVersion,
      params.entryType,
      params.bucket,
      params.unitsDelta,
      params.trialReservedDelta,
      params.paidReservedDelta,
      params.trialAfter,
      params.paidAfter,
      params.trialReservedAfter,
      params.paidReservedAfter,
      params.sourceReference?.type ?? null,
      params.sourceReference?.id ?? null,
      params.reasonCode ?? null,
      params.reasonText ?? null,
      params.idempotencyScopeKey,
      params.createdBy,
      params.correlationId,
    ],
  );
  return result.rows.length === 0 ? null : mapEntry(result.rows[0]);
}

export async function getLedgerEntryByScopeKey(
  db: Queryable,
  idempotencyScopeKey: string,
): Promise<CommercialLedgerEntry | null> {
  const result = await db.query<LedgerRow>(
    `SELECT ${LEDGER_COLUMNS} FROM commercial_ledger_entries WHERE idempotency_scope_key = $1`,
    [idempotencyScopeKey],
  );
  return result.rows.length === 0 ? null : mapEntry(result.rows[0]);
}

/** Deterministic order: ascending account version (1, 2, 3, ...). */
export async function listLedgerEntries(
  db: Queryable,
  businessId: string,
): Promise<CommercialLedgerEntry[]> {
  const result = await db.query<LedgerRow>(
    `SELECT ${LEDGER_COLUMNS} FROM commercial_ledger_entries
      WHERE business_id = $1 ORDER BY account_version ASC`,
    [businessId],
  );
  return result.rows.map(mapEntry);
}

export type LedgerTotals = {
  readonly trialRemainingUnits: number;
  readonly paidBalanceUnits: number;
  readonly trialReservedUnits: number;
  readonly paidReservedUnits: number;
  readonly entryCount: number;
  readonly latestVersion: number;
};

/** Sum of ledger deltas per counter (design §7 invariant I-1 reconciliation input). */
export async function sumLedger(db: Queryable, businessId: string): Promise<LedgerTotals> {
  const result = await db.query<{
    trial: string;
    paid: string;
    trial_reserved: string;
    paid_reserved: string;
    entry_count: string;
    latest_version: string;
  }>(
    `SELECT COALESCE(SUM(CASE WHEN bucket = 'trial' THEN units_delta ELSE 0 END), 0) AS trial,
            COALESCE(SUM(CASE WHEN bucket = 'paid' THEN units_delta ELSE 0 END), 0) AS paid,
            COALESCE(SUM(trial_reserved_delta), 0) AS trial_reserved,
            COALESCE(SUM(paid_reserved_delta), 0) AS paid_reserved,
            COUNT(*) AS entry_count,
            COALESCE(MAX(account_version), 0) AS latest_version
       FROM commercial_ledger_entries WHERE business_id = $1`,
    [businessId],
  );
  const row = result.rows[0];
  return {
    trialRemainingUnits: Number(row.trial),
    paidBalanceUnits: Number(row.paid),
    trialReservedUnits: Number(row.trial_reserved),
    paidReservedUnits: Number(row.paid_reserved),
    entryCount: Number(row.entry_count),
    latestVersion: Number(row.latest_version),
  };
}
