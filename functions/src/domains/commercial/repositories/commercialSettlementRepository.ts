/**
 * Commercial settlement repository (`WP-COM-02`; design §10, §20).
 *
 * INSERT, READ, and exactly two UPDATEs: `recorded -> confirmed` and
 * `confirmed -> voided` (WP-COM-03). The database independently freezes every evidence/pricing
 * column, rejects any other status change, DELETE and TRUNCATE, and requires
 * the confirming ledger entry to be this Business's paid `credit_grant` for
 * the settlement's units. There is no path that touches the account
 * counters: credit reaches the account only through `postCommercialLedgerEntry`.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { CommercialCurrency, CommercialMarket } from "../models/commercialFoundation";
import type {
  CommercialSettlement,
  CommercialSettlementSource,
  CommercialSettlementStatus,
} from "../models/commercialSettlement";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

type SettlementRow = {
  id: string;
  business_id: string;
  status: CommercialSettlementStatus;
  source: CommercialSettlementSource;
  method: string;
  external_reference: string;
  market: CommercialMarket;
  currency: CommercialCurrency;
  amount_minor: string | number;
  units_purchased: number;
  received_at: Date;
  price_schedule_id: string;
  unit_price_usd_minor: string | number;
  local_unit_price_minor: string | number;
  price_effective_from: Date;
  expected_amount_minor: string | number;
  variance_minor: string | number;
  recorded_by: string;
  recorded_at: Date;
  record_reason_text: string;
  record_idempotency_key: string;
  confirmed_by: string | null;
  confirmed_at: Date | null;
  confirmation_note: string | null;
  confirm_idempotency_key: string | null;
  ledger_entry_id: string | null;
  voided_by: string | null;
  voided_at: Date | null;
  void_reason_text: string | null;
  void_reference: string | null;
  void_idempotency_key: string | null;
  void_ledger_entry_id: string | null;
};

const SETTLEMENT_COLUMNS = `id, business_id, status, source, method, external_reference, market,
  currency, amount_minor, units_purchased, received_at, price_schedule_id, unit_price_usd_minor,
  local_unit_price_minor, price_effective_from, expected_amount_minor, variance_minor, recorded_by,
  recorded_at, record_reason_text, record_idempotency_key, confirmed_by, confirmed_at,
  confirmation_note, confirm_idempotency_key, ledger_entry_id, voided_by, voided_at,
  void_reason_text, void_reference, void_idempotency_key, void_ledger_entry_id`;

function mapSettlement(row: SettlementRow): CommercialSettlement {
  return {
    id: row.id,
    businessId: row.business_id,
    status: row.status,
    source: row.source,
    method: row.method,
    externalReference: row.external_reference,
    market: row.market,
    currency: row.currency,
    amountMinor: Number(row.amount_minor),
    unitsPurchased: row.units_purchased,
    receivedAt: row.received_at,
    priceScheduleId: row.price_schedule_id,
    unitPriceUsdMinor: Number(row.unit_price_usd_minor),
    localUnitPriceMinor: Number(row.local_unit_price_minor),
    priceEffectiveFrom: row.price_effective_from,
    expectedAmountMinor: Number(row.expected_amount_minor),
    varianceMinor: Number(row.variance_minor),
    recordedBy: row.recorded_by,
    recordedAt: row.recorded_at,
    recordReasonText: row.record_reason_text,
    recordIdempotencyKey: row.record_idempotency_key,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    confirmationNote: row.confirmation_note,
    confirmIdempotencyKey: row.confirm_idempotency_key,
    ledgerEntryId: row.ledger_entry_id,
    voidedBy: row.voided_by,
    voidedAt: row.voided_at,
    voidReasonText: row.void_reason_text,
    voidReference: row.void_reference,
    voidIdempotencyKey: row.void_idempotency_key,
    voidLedgerEntryId: row.void_ledger_entry_id,
  };
}

export type InsertSettlementParams = {
  readonly businessId: string;
  readonly method: string;
  readonly externalReference: string;
  readonly market: CommercialMarket;
  readonly currency: CommercialCurrency;
  readonly amountMinor: number;
  readonly unitsPurchased: number;
  readonly receivedAt: Date;
  readonly priceScheduleId: string;
  readonly unitPriceUsdMinor: number;
  readonly localUnitPriceMinor: number;
  readonly priceEffectiveFrom: Date;
  readonly expectedAmountMinor: number;
  readonly varianceMinor: number;
  readonly recordedBy: string;
  readonly recordReasonText: string;
  readonly recordIdempotencyKey: string;
  readonly correlationId: string;
};

/** Inserts a `recorded` settlement. Returns `null` when `(method, external_reference)` already exists. */
export async function insertSettlement(
  tx: PlatformPostgresTransaction,
  p: InsertSettlementParams,
): Promise<CommercialSettlement | null> {
  const result = await tx.query<SettlementRow>(
    `INSERT INTO commercial_settlements
       (business_id, method, external_reference, market, currency, amount_minor, units_purchased,
        received_at, price_schedule_id, unit_price_usd_minor, local_unit_price_minor,
        price_effective_from, expected_amount_minor, variance_minor, recorded_by,
        record_reason_text, record_idempotency_key, record_correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (method, external_reference) DO NOTHING
     RETURNING ${SETTLEMENT_COLUMNS}`,
    [
      p.businessId,
      p.method,
      p.externalReference,
      p.market,
      p.currency,
      p.amountMinor,
      p.unitsPurchased,
      p.receivedAt,
      p.priceScheduleId,
      p.unitPriceUsdMinor,
      p.localUnitPriceMinor,
      p.priceEffectiveFrom,
      p.expectedAmountMinor,
      p.varianceMinor,
      p.recordedBy,
      p.recordReasonText,
      p.recordIdempotencyKey,
      p.correlationId,
    ],
  );
  return result.rows.length === 0 ? null : mapSettlement(result.rows[0]);
}

export async function getSettlement(
  db: Queryable,
  settlementId: string,
): Promise<CommercialSettlement | null> {
  const result = await db.query<SettlementRow>(
    `SELECT ${SETTLEMENT_COLUMNS} FROM commercial_settlements WHERE id = $1`,
    [settlementId],
  );
  return result.rows.length === 0 ? null : mapSettlement(result.rows[0]);
}

/** Row lock that serialises concurrent confirmations of one settlement. */
export async function lockSettlement(
  tx: PlatformPostgresTransaction,
  settlementId: string,
): Promise<CommercialSettlement | null> {
  const result = await tx.query<SettlementRow>(
    `SELECT ${SETTLEMENT_COLUMNS} FROM commercial_settlements WHERE id = $1 FOR UPDATE`,
    [settlementId],
  );
  return result.rows.length === 0 ? null : mapSettlement(result.rows[0]);
}

export async function listSettlementsForBusiness(
  db: Queryable,
  businessId: string,
): Promise<CommercialSettlement[]> {
  const result = await db.query<SettlementRow>(
    `SELECT ${SETTLEMENT_COLUMNS} FROM commercial_settlements
      WHERE business_id = $1 ORDER BY recorded_at, id`,
    [businessId],
  );
  return result.rows.map(mapSettlement);
}

export type ConfirmSettlementParams = {
  readonly settlementId: string;
  readonly confirmedBy: string;
  readonly confirmationNote: string;
  readonly confirmIdempotencyKey: string;
  readonly correlationId: string;
  readonly ledgerEntryId: string;
};

/** The single permitted transition, `recorded -> confirmed`. Returns `null` if the row was not `recorded`. */
export async function markSettlementConfirmed(
  tx: PlatformPostgresTransaction,
  p: ConfirmSettlementParams,
): Promise<CommercialSettlement | null> {
  const result = await tx.query<SettlementRow>(
    `UPDATE commercial_settlements
        SET status = 'confirmed', confirmed_by = $2, confirmed_at = now(),
            confirmation_note = $3, confirm_idempotency_key = $4,
            confirm_correlation_id = $5, ledger_entry_id = $6
      WHERE id = $1 AND status = 'recorded'
      RETURNING ${SETTLEMENT_COLUMNS}`,
    [
      p.settlementId,
      p.confirmedBy,
      p.confirmationNote,
      p.confirmIdempotencyKey,
      p.correlationId,
      p.ledgerEntryId,
    ],
  );
  return result.rows.length === 0 ? null : mapSettlement(result.rows[0]);
}

export type VoidSettlementParams = {
  readonly settlementId: string;
  readonly voidedBy: string;
  readonly voidReasonText: string;
  readonly voidReference: string;
  readonly voidIdempotencyKey: string;
  readonly correlationId: string;
  readonly voidLedgerEntryId: string;
};

/** `confirmed -> voided` (WP-COM-03). Returns `null` if the row was not `confirmed`. */
export async function markSettlementVoided(
  tx: PlatformPostgresTransaction,
  p: VoidSettlementParams,
): Promise<CommercialSettlement | null> {
  const result = await tx.query<SettlementRow>(
    `UPDATE commercial_settlements
        SET status = 'voided', voided_by = $2, voided_at = now(), void_reason_text = $3,
            void_reference = $4, void_idempotency_key = $5, void_correlation_id = $6,
            void_ledger_entry_id = $7
      WHERE id = $1 AND status = 'confirmed'
      RETURNING ${SETTLEMENT_COLUMNS}`,
    [
      p.settlementId,
      p.voidedBy,
      p.voidReasonText,
      p.voidReference,
      p.voidIdempotencyKey,
      p.correlationId,
      p.voidLedgerEntryId,
    ],
  );
  return result.rows.length === 0 ? null : mapSettlement(result.rows[0]);
}

/** Confirmed (not recorded, not voided) settlements of a Business: the paid-activation precondition. */
export async function countConfirmedSettlements(
  db: Queryable,
  businessId: string,
): Promise<number> {
  const result = await db.query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM commercial_settlements WHERE business_id = $1 AND status = 'confirmed'`,
    [businessId],
  );
  return Number(result.rows[0].n);
}
