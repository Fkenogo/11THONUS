/**
 * Commercial admission / earmark repository (`WP-COM-05b`; design §8.5, §8.5.1, §20).
 *
 * SQL against `commercial_admissions` and `commercial_admission_blocks` only
 * (plus read-only joins to Commercial consumption events for reconciliation).
 * Insert-and-read: no update or delete path exists and the database rejects
 * both by trigger. A row here may only be written AFTER the Verified Unit it
 * references exists (immediate foreign keys, parent-before-child).
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { CommercialBucket } from "../models/commercialFoundation";
import type {
  AdmissionDecider,
  CommercialAdmission,
  CommercialAdmissionBlock,
} from "../models/commercialAdmission";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

type AdmissionRow = {
  id: string;
  business_id: string;
  purchase_record_id: string;
  verified_unit_id: string;
  ledger_entry_id: string;
  blocks_reserved: number;
  first_block_index: number;
  stream_ref: string;
  decided_by: AdmissionDecider;
  account_version: string | number;
  available_before: number;
  reserved_before: number;
  admission_scope_key: string;
  correlation_id: string;
  decided_at: Date;
};

type BlockRow = {
  id: string;
  admission_id: string;
  business_id: string;
  stream_ref: string;
  block_index: number;
  funding_bucket: CommercialBucket;
  correlation_id: string;
  earmarked_at: Date;
};

const ADMISSION_COLUMNS = `id, business_id, purchase_record_id, verified_unit_id, ledger_entry_id,
  blocks_reserved, first_block_index, stream_ref, decided_by, account_version, available_before,
  reserved_before, admission_scope_key, correlation_id, decided_at`;
const BLOCK_COLUMNS = `id, admission_id, business_id, stream_ref, block_index, funding_bucket,
  correlation_id, earmarked_at`;

function mapAdmission(row: AdmissionRow): CommercialAdmission {
  return {
    id: row.id,
    businessId: row.business_id,
    purchaseRecordId: row.purchase_record_id,
    verifiedUnitId: row.verified_unit_id,
    ledgerEntryId: row.ledger_entry_id,
    blocksReserved: row.blocks_reserved,
    firstBlockIndex: row.first_block_index,
    streamRef: row.stream_ref,
    decidedBy: row.decided_by,
    accountVersion: Number(row.account_version),
    availableBefore: row.available_before,
    reservedBefore: row.reserved_before,
    admissionScopeKey: row.admission_scope_key,
    correlationId: row.correlation_id,
    decidedAt: row.decided_at,
  };
}

function mapBlock(row: BlockRow): CommercialAdmissionBlock {
  return {
    id: row.id,
    admissionId: row.admission_id,
    businessId: row.business_id,
    streamRef: row.stream_ref,
    blockIndex: row.block_index,
    fundingBucket: row.funding_bucket,
    correlationId: row.correlation_id,
    earmarkedAt: row.earmarked_at,
  };
}

export type InsertAdmissionParams = {
  readonly businessId: string;
  readonly purchaseRecordId: string;
  readonly verifiedUnitId: string;
  readonly ledgerEntryId: string;
  readonly blocksReserved: number;
  readonly firstBlockIndex: number;
  readonly streamRef: string;
  readonly decidedBy: AdmissionDecider;
  readonly accountVersion: number;
  readonly availableBefore: number;
  readonly reservedBefore: number;
  readonly admissionScopeKey: string;
  readonly correlationId: string;
};

/** Throws on any constraint violation (a second admission for a Purchase / Verified Unit is a hard error). */
export async function insertAdmission(
  tx: PlatformPostgresTransaction,
  p: InsertAdmissionParams,
): Promise<CommercialAdmission> {
  const result = await tx.query<AdmissionRow>(
    `INSERT INTO commercial_admissions
       (business_id, purchase_record_id, verified_unit_id, ledger_entry_id, blocks_reserved,
        first_block_index, stream_ref, decided_by, account_version, available_before,
        reserved_before, admission_scope_key, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING ${ADMISSION_COLUMNS}`,
    [
      p.businessId,
      p.purchaseRecordId,
      p.verifiedUnitId,
      p.ledgerEntryId,
      p.blocksReserved,
      p.firstBlockIndex,
      p.streamRef,
      p.decidedBy,
      p.accountVersion,
      p.availableBefore,
      p.reservedBefore,
      p.admissionScopeKey,
      p.correlationId,
    ],
  );
  return mapAdmission(result.rows[0]);
}

export type InsertAdmissionBlockParams = {
  readonly admissionId: string;
  readonly businessId: string;
  readonly streamRef: string;
  readonly blockIndex: number;
  readonly fundingBucket: CommercialBucket;
  readonly correlationId: string;
};

/** One earmark. `UNIQUE (business, stream_ref, block_index)`: a position is earmarked exactly once. */
export async function insertAdmissionBlock(
  tx: PlatformPostgresTransaction,
  p: InsertAdmissionBlockParams,
): Promise<CommercialAdmissionBlock> {
  const result = await tx.query<BlockRow>(
    `INSERT INTO commercial_admission_blocks
       (admission_id, business_id, stream_ref, block_index, funding_bucket, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING ${BLOCK_COLUMNS}`,
    [p.admissionId, p.businessId, p.streamRef, p.blockIndex, p.fundingBucket, p.correlationId],
  );
  return mapBlock(result.rows[0]);
}

export async function getAdmissionByPurchase(
  db: Queryable,
  purchaseRecordId: string,
): Promise<CommercialAdmission | null> {
  const result = await db.query<AdmissionRow>(
    `SELECT ${ADMISSION_COLUMNS} FROM commercial_admissions WHERE purchase_record_id = $1`,
    [purchaseRecordId],
  );
  return result.rows.length === 0 ? null : mapAdmission(result.rows[0]);
}

export async function listAdmissionsForBusiness(
  db: Queryable,
  businessId: string,
): Promise<CommercialAdmission[]> {
  const result = await db.query<AdmissionRow>(
    `SELECT ${ADMISSION_COLUMNS} FROM commercial_admissions
      WHERE business_id = $1 ORDER BY decided_at ASC, id ASC`,
    [businessId],
  );
  return result.rows.map(mapAdmission);
}

export async function listBlocksForAdmission(
  db: Queryable,
  admissionId: string,
): Promise<CommercialAdmissionBlock[]> {
  const result = await db.query<BlockRow>(
    `SELECT ${BLOCK_COLUMNS} FROM commercial_admission_blocks
      WHERE admission_id = $1 ORDER BY block_index ASC`,
    [admissionId],
  );
  return result.rows.map(mapBlock);
}

export async function listBlocksForBusiness(
  db: Queryable,
  businessId: string,
): Promise<CommercialAdmissionBlock[]> {
  const result = await db.query<BlockRow>(
    `SELECT ${BLOCK_COLUMNS} FROM commercial_admission_blocks
      WHERE business_id = $1 ORDER BY stream_ref ASC, block_index ASC`,
    [businessId],
  );
  return result.rows.map(mapBlock);
}

/**
 * The earmark of one Circle position (design §8.5.1). A plain read; safe under
 * the account lock because it takes no Loyalty lock and the row is immutable.
 */
export async function findAdmissionEarmark(
  db: Queryable,
  params: { readonly businessId: string; readonly streamRef: string; readonly blockIndex: number },
): Promise<{ readonly earmarkId: string; readonly bucket: CommercialBucket } | null> {
  const result = await db.query<{ id: string; funding_bucket: CommercialBucket }>(
    `SELECT id, funding_bucket FROM commercial_admission_blocks
      WHERE business_id = $1 AND stream_ref = $2 AND block_index = $3`,
    [params.businessId, params.streamRef, params.blockIndex],
  );
  return result.rows.length === 0
    ? null
    : { earmarkId: result.rows[0].id, bucket: result.rows[0].funding_bucket };
}

export type EarmarkReservationTotals = {
  readonly trialEarmarked: number;
  readonly paidEarmarked: number;
  readonly trialConsumed: number;
  readonly paidConsumed: number;
};

/**
 * Reconciliation input (design §5.6 / §8.5.1 test 14): the account's reserved
 * counters must equal earmarks minus consumed earmarks, per bucket.
 */
export async function sumEarmarkReservations(
  db: Queryable,
  businessId: string,
): Promise<EarmarkReservationTotals> {
  const result = await db.query<{
    trial_earmarked: string;
    paid_earmarked: string;
    trial_consumed: string;
    paid_consumed: string;
  }>(
    `SELECT COUNT(*) FILTER (WHERE b.funding_bucket = 'trial') AS trial_earmarked,
            COUNT(*) FILTER (WHERE b.funding_bucket = 'paid') AS paid_earmarked,
            COUNT(e.id) FILTER (WHERE b.funding_bucket = 'trial') AS trial_consumed,
            COUNT(e.id) FILTER (WHERE b.funding_bucket = 'paid') AS paid_consumed
       FROM commercial_admission_blocks b
       LEFT JOIN commercial_consumption_events e ON e.earmark_id = b.id
      WHERE b.business_id = $1`,
    [businessId],
  );
  const row = result.rows[0];
  return {
    trialEarmarked: Number(row.trial_earmarked),
    paidEarmarked: Number(row.paid_earmarked),
    trialConsumed: Number(row.trial_consumed),
    paidConsumed: Number(row.paid_consumed),
  };
}
