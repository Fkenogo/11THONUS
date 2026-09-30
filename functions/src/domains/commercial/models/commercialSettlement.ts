/**
 * Commercial settlement vocabulary (`WP-COM-02`;
 * `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + CORR-002 §10, §13, §20).
 *
 * A settlement is EVIDENCE of commercial payment received outside any
 * automated provider integration. It is not a loyalty concept and confers no
 * loyalty state. Two steps: `recorded` (no credit) then `confirmed`
 * (exactly one paid `credit_grant`). `confirmed -> voided` (WP-COM-03) is
 * compensated by one `settlement_void_reversal`; the original credit is
 * never altered or deleted. `recorded -> cancelled` (WP-COM-03A) withdraws a
 * mistaken evidence entry before any credit was granted: it has no ledger
 * effect and is terminal.
 */

import type { CommercialCurrency, CommercialMarket } from "./commercialFoundation";

export const COMMERCIAL_SETTLEMENT_STATUSES = [
  "recorded",
  "confirmed",
  "voided",
  "cancelled",
] as const;
export type CommercialSettlementStatus = (typeof COMMERCIAL_SETTLEMENT_STATUSES)[number];

/** Launch settlements are manual/offline only. A provider adapter widens this additively later. */
export const COMMERCIAL_SETTLEMENT_SOURCES = ["manual"] as const;
export type CommercialSettlementSource = (typeof COMMERCIAL_SETTLEMENT_SOURCES)[number];

/** Operator label for how the money arrived. Shape-checked only; no closed vocabulary is invented. */
export const COMMERCIAL_SETTLEMENT_METHOD_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
export const COMMERCIAL_SETTLEMENT_REFERENCE_MAX_LENGTH = 200;
/** PostgreSQL INTEGER upper bound for `units_purchased`. */
export const COMMERCIAL_MAX_SETTLEMENT_UNITS = 2_147_483_647;

export type CommercialSettlement = {
  readonly id: string;
  readonly businessId: string;
  readonly status: CommercialSettlementStatus;
  readonly source: CommercialSettlementSource;
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
  readonly recordedAt: Date;
  readonly recordReasonText: string;
  readonly recordIdempotencyKey: string;
  readonly confirmedBy: string | null;
  readonly confirmedAt: Date | null;
  readonly confirmationNote: string | null;
  readonly confirmIdempotencyKey: string | null;
  readonly ledgerEntryId: string | null;
  readonly voidedBy: string | null;
  readonly voidedAt: Date | null;
  readonly voidReasonText: string | null;
  readonly voidReference: string | null;
  readonly voidIdempotencyKey: string | null;
  readonly voidLedgerEntryId: string | null;
  readonly cancelledBy: string | null;
  readonly cancelledAt: Date | null;
  readonly cancelReasonText: string | null;
  readonly cancelReference: string | null;
  readonly cancelIdempotencyKey: string | null;
};

/** Ledger scope key: one settlement can produce at most one credit, by construction. */
export function settlementCreditScopeKey(settlementId: string): string {
  return `settlement:${settlementId}:credit_grant`;
}

/**
 * Audit `business_id` is NOT NULL and a price schedule belongs to a market,
 * not a Business. The audit row carries this platform-scope marker instead,
 * so no Business is impersonated and no existing table is altered.
 */
export function platformMarketAuditScope(market: CommercialMarket): string {
  return `platform:market:${market}`;
}

/** Ledger scope key for the compensating entry: one settlement can be reversed at most once, by construction. */
export function settlementVoidReversalScopeKey(settlementId: string): string {
  return `settlement:${settlementId}:void_reversal`;
}
