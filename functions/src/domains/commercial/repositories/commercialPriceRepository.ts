/**
 * Commercial price-schedule repository (`WP-COM-01`; design §13/§14).
 *
 * Append-only, effective-dated local unit price per market. NO rows are
 * seeded by any code or migration: BIF/RWF launch prices are Founder launch
 * inputs. There is no FX lookup anywhere. The governed canonical basis
 * (USD 2 = 200 minor) is validated HERE (command layer), not by a database
 * CHECK, per design §13.
 *
 * Only INSERT and READ exist; the database rejects UPDATE/DELETE/TRUNCATE
 * and out-of-order `effective_from`.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR,
  MARKET_CURRENCY,
  isCommercialMarket,
  type CommercialCurrency,
  type CommercialMarket,
  type CommercialPriceSchedule,
} from "../models/commercialFoundation";
import { commercialValidationError } from "../models/commercialErrors";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

type PriceRow = {
  id: string;
  market: CommercialMarket;
  currency: CommercialCurrency;
  usd_equivalent_minor: string | number;
  local_unit_price_minor: string | number;
  rate_note: string | null;
  effective_from: Date;
  created_by: string;
  reason_text: string;
  created_at: Date;
};

const PRICE_COLUMNS = `id, market, currency, usd_equivalent_minor, local_unit_price_minor,
  rate_note, effective_from, created_by, reason_text, created_at`;

function mapPrice(row: PriceRow): CommercialPriceSchedule {
  return {
    id: row.id,
    market: row.market,
    currency: row.currency,
    usdEquivalentMinor: Number(row.usd_equivalent_minor),
    localUnitPriceMinor: Number(row.local_unit_price_minor),
    rateNote: row.rate_note,
    effectiveFrom: row.effective_from,
    createdBy: row.created_by,
    reasonText: row.reason_text,
    createdAt: row.created_at,
  };
}

export type InsertPriceScheduleParams = {
  readonly market: CommercialMarket;
  /** Whole-integer local price (BIF/RWF have no minor unit). Supplied by the administrator; never defaulted. */
  readonly localUnitPriceMinor: number;
  /** Must equal the governed canonical basis. Optional: defaults to that constant, never to a local price. */
  readonly usdEquivalentMinor?: number;
  readonly effectiveFrom: Date;
  readonly rateNote?: string;
  readonly createdBy: string;
  readonly reasonText: string;
  readonly correlationId: string;
};

/**
 * Appends a new schedule row. Throws a validation error for an unsupported
 * market, a non-canonical USD basis, or a non-positive / non-integer local
 * price; the database independently rejects an unsupported currency, a
 * market/currency mismatch, a duplicate `(market, effective_from)` and any
 * `effective_from` not strictly after the market's latest schedule.
 */
export async function insertPriceSchedule(
  tx: PlatformPostgresTransaction,
  params: InsertPriceScheduleParams,
): Promise<CommercialPriceSchedule> {
  if (!isCommercialMarket(params.market)) {
    throw commercialValidationError(`Unsupported Commercial market "${String(params.market)}".`);
  }
  const usdEquivalentMinor = params.usdEquivalentMinor ?? COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR;
  if (usdEquivalentMinor !== COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR) {
    throw commercialValidationError(
      `The canonical commercial-unit basis is USD ${COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR / 100} (${COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR} minor); received ${usdEquivalentMinor}.`,
    );
  }
  if (!Number.isSafeInteger(params.localUnitPriceMinor) || params.localUnitPriceMinor <= 0) {
    throw commercialValidationError("localUnitPriceMinor must be a positive whole integer.");
  }
  const result = await tx.query<PriceRow>(
    `INSERT INTO commercial_price_schedules
       (market, currency, usd_equivalent_minor, local_unit_price_minor, rate_note,
        effective_from, created_by, reason_text, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING ${PRICE_COLUMNS}`,
    [
      params.market,
      MARKET_CURRENCY[params.market],
      usdEquivalentMinor,
      params.localUnitPriceMinor,
      params.rateNote ?? null,
      params.effectiveFrom,
      params.createdBy,
      params.reasonText,
      params.correlationId,
    ],
  );
  return mapPrice(result.rows[0]);
}

/** The schedule in force at `at`: latest row with `effective_from <= at`, or `null` (no price configured yet). */
export async function getEffectivePriceSchedule(
  db: Queryable,
  market: CommercialMarket,
  at: Date,
): Promise<CommercialPriceSchedule | null> {
  const result = await db.query<PriceRow>(
    `SELECT ${PRICE_COLUMNS} FROM commercial_price_schedules
      WHERE market = $1 AND effective_from <= $2
      ORDER BY effective_from DESC LIMIT 1`,
    [market, at],
  );
  return result.rows.length === 0 ? null : mapPrice(result.rows[0]);
}

export async function listPriceSchedules(
  db: Queryable,
  market: CommercialMarket,
): Promise<CommercialPriceSchedule[]> {
  const result = await db.query<PriceRow>(
    `SELECT ${PRICE_COLUMNS} FROM commercial_price_schedules
      WHERE market = $1 ORDER BY effective_from ASC`,
    [market],
  );
  return result.rows.map(mapPrice);
}
