/**
 * Commercial consumption repository (`WP-COM-04`; design §5, §20).
 *
 * SQL against `commercial_consumption_*` and `commercial_projection_failures`
 * only. Claims and events are insert-and-read: no update or delete path exists
 * and the database rejects both by trigger. The Loyalty Reward is read through
 * `commercialRewardSourceRepository.ts`, never here.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { CommercialBucket } from "../models/commercialFoundation";
import type {
  ConsumptionBucketSource,
  ConsumptionClaim,
  ConsumptionEvent,
} from "../models/commercialConsumption";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

type ClaimRow = {
  id: string;
  business_id: string;
  source_reward_id: string;
  source_loyalty_cycle_id: string;
  correlation_id: string;
  claimed_at: Date;
};

type EventRow = {
  id: string;
  claim_id: string;
  business_id: string;
  reward_program_id: string;
  source_loyalty_cycle_id: string;
  source_fact_at: Date;
  unit_count: number;
  bucket: CommercialBucket;
  earmark_id: string | null;
  bucket_source: ConsumptionBucketSource;
  account_version: string | number;
  price_schedule_id: string | null;
  unit_price_usd_minor: string | number | null;
  local_currency: string | null;
  local_unit_price_minor: string | number | null;
  ledger_entry_id: string;
  correlation_id: string;
  recorded_at: Date;
};

const CLAIM_COLUMNS = `id, business_id, source_reward_id, source_loyalty_cycle_id, correlation_id, claimed_at`;
const EVENT_COLUMNS = `id, claim_id, business_id, reward_program_id, source_loyalty_cycle_id,
  source_fact_at, unit_count, bucket, earmark_id, bucket_source, account_version, price_schedule_id,
  unit_price_usd_minor, local_currency, local_unit_price_minor, ledger_entry_id, correlation_id,
  recorded_at`;

const nullableNumber = (v: string | number | null): number | null =>
  v === null ? null : Number(v);

function mapClaim(row: ClaimRow): ConsumptionClaim {
  return {
    id: row.id,
    businessId: row.business_id,
    sourceRewardId: row.source_reward_id,
    sourceLoyaltyCycleId: row.source_loyalty_cycle_id,
    correlationId: row.correlation_id,
    claimedAt: row.claimed_at,
  };
}

function mapEvent(row: EventRow): ConsumptionEvent {
  return {
    id: row.id,
    claimId: row.claim_id,
    businessId: row.business_id,
    rewardProgramId: row.reward_program_id,
    sourceLoyaltyCycleId: row.source_loyalty_cycle_id,
    sourceFactAt: row.source_fact_at,
    unitCount: 1,
    bucket: row.bucket,
    earmarkId: row.earmark_id,
    bucketSource: row.bucket_source,
    accountVersion: Number(row.account_version),
    priceScheduleId: row.price_schedule_id,
    unitPriceUsdMinor: nullableNumber(row.unit_price_usd_minor),
    localCurrency: row.local_currency,
    localUnitPriceMinor: nullableNumber(row.local_unit_price_minor),
    ledgerEntryId: row.ledger_entry_id,
    correlationId: row.correlation_id,
    recordedAt: row.recorded_at,
  };
}

export type InsertConsumptionClaimParams = {
  readonly businessId: string;
  readonly sourceRewardId: string;
  readonly sourceLoyaltyCycleId: string;
  readonly correlationId: string;
};

/**
 * Design §5.4 step 2. Inserts the unclassified claim (composite FK to the
 * Reward) and returns it, or `null` when a claim for that Cycle/Reward already
 * exists. A concurrent contender WAITS on the first transaction's uncommitted
 * claim, then does nothing (if it committed) or inserts (if it rolled back).
 * Must run BEFORE the Commercial account lock (design §4.4 rule iii).
 */
export async function insertConsumptionClaim(
  tx: PlatformPostgresTransaction,
  params: InsertConsumptionClaimParams,
): Promise<ConsumptionClaim | null> {
  const result = await tx.query<ClaimRow>(
    `INSERT INTO commercial_consumption_claims
       (business_id, source_reward_id, source_loyalty_cycle_id, correlation_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING
     RETURNING ${CLAIM_COLUMNS}`,
    [params.businessId, params.sourceRewardId, params.sourceLoyaltyCycleId, params.correlationId],
  );
  return result.rows.length === 0 ? null : mapClaim(result.rows[0]);
}

export type InsertConsumptionEventParams = {
  readonly claimId: string;
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly sourceLoyaltyCycleId: string;
  readonly sourceFactAt: Date;
  readonly bucket: CommercialBucket;
  readonly earmarkId: string | null;
  readonly bucketSource: ConsumptionBucketSource;
  readonly accountVersion: number;
  readonly price: {
    readonly scheduleId: string;
    readonly usdEquivalentMinor: number;
    readonly currency: string;
    readonly localUnitPriceMinor: number;
  } | null;
  readonly ledgerEntryId: string;
  readonly correlationId: string;
};

/** Design §5.4 step 5. Only after the account lock; no FK to any Loyalty row. */
export async function insertConsumptionEvent(
  tx: PlatformPostgresTransaction,
  params: InsertConsumptionEventParams,
): Promise<ConsumptionEvent> {
  const result = await tx.query<EventRow>(
    `INSERT INTO commercial_consumption_events
       (claim_id, business_id, reward_program_id, source_loyalty_cycle_id, source_fact_at,
        unit_count, bucket, earmark_id, bucket_source, account_version, price_schedule_id,
        unit_price_usd_minor, local_currency, local_unit_price_minor, ledger_entry_id,
        correlation_id)
     VALUES ($1,$2,$3,$4,$5,1,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING ${EVENT_COLUMNS}`,
    [
      params.claimId,
      params.businessId,
      params.rewardProgramId,
      params.sourceLoyaltyCycleId,
      params.sourceFactAt,
      params.bucket,
      params.earmarkId,
      params.bucketSource,
      params.accountVersion,
      params.price?.scheduleId ?? null,
      params.price?.usdEquivalentMinor ?? null,
      params.price?.currency ?? null,
      params.price?.localUnitPriceMinor ?? null,
      params.ledgerEntryId,
      params.correlationId,
    ],
  );
  return mapEvent(result.rows[0]);
}

export async function getConsumptionEventByCycle(
  db: Queryable,
  sourceLoyaltyCycleId: string,
): Promise<ConsumptionEvent | null> {
  const result = await db.query<EventRow>(
    `SELECT ${EVENT_COLUMNS} FROM commercial_consumption_events WHERE source_loyalty_cycle_id = $1`,
    [sourceLoyaltyCycleId],
  );
  return result.rows.length === 0 ? null : mapEvent(result.rows[0]);
}

export async function listConsumptionEventsForBusiness(
  db: Queryable,
  businessId: string,
): Promise<ConsumptionEvent[]> {
  const result = await db.query<EventRow>(
    `SELECT ${EVENT_COLUMNS} FROM commercial_consumption_events
      WHERE business_id = $1 ORDER BY recorded_at ASC, id ASC`,
    [businessId],
  );
  return result.rows.map(mapEvent);
}

export type RecordProjectionFailureParams = {
  readonly businessId: string;
  readonly sourceLoyaltyCycleId: string;
  readonly errorClass: string;
  readonly errorMessage: string | null;
  readonly correlationId: string;
};

/**
 * Append-only failure log (design §5.7). Called on its OWN connection after the
 * projection transaction rolled back, so the failure survives the rollback.
 * `attempt` is the number of prior failures for the Cycle plus one.
 */
export async function insertProjectionFailure(
  db: Queryable,
  params: RecordProjectionFailureParams,
): Promise<void> {
  await db.query(
    `INSERT INTO commercial_projection_failures
       (business_id, source_loyalty_cycle_id, error_class, error_message, attempt, correlation_id)
     VALUES ($1, $2, $3, $4,
       (SELECT COUNT(*) + 1 FROM commercial_projection_failures WHERE source_loyalty_cycle_id = $2),
       $5)`,
    [
      params.businessId,
      params.sourceLoyaltyCycleId,
      params.errorClass,
      params.errorMessage,
      params.correlationId,
    ],
  );
}

export async function countFallbackConsumptions(db: Queryable): Promise<number> {
  const result = await db.query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM commercial_consumption_events
      WHERE bucket_source = 'consumption_time_fallback'`,
  );
  return Number(result.rows[0].n);
}

export async function countProjectionFailures(db: Queryable): Promise<number> {
  const result = await db.query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM commercial_projection_failures`,
  );
  return Number(result.rows[0].n);
}
