/**
 * Commercial domain foundation vocabulary (`WP-COM-01`;
 * `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + CORR-002 §7, §13, §14, §18, §20).
 *
 * Closed vocabularies and the governed canonical price basis only. Nothing
 * here decides a launch price, a trial default, a negative-credit limit or a
 * subscription tier -- none of those exist in the foundation:
 *
 * - there is NO local BIF/RWF price constant (launch inputs, Founder-supplied);
 * - there is NO trial default or trial cap (the governed "initial grant
 *   3-5" belongs to the future grant command, not the account);
 * - there is NO paid-balance floor or maximum;
 * - there is NO tier/plan concept (`DEC-SUB-014`: subscription tiers deferred).
 */

/** Launch markets and their settlement currency (design §14: Burundi / Rwanda only). */
export const COMMERCIAL_MARKETS = ["BI", "RW"] as const;
export type CommercialMarket = (typeof COMMERCIAL_MARKETS)[number];

export const COMMERCIAL_CURRENCIES = ["BIF", "RWF"] as const;
export type CommercialCurrency = (typeof COMMERCIAL_CURRENCIES)[number];

export const MARKET_CURRENCY: Readonly<Record<CommercialMarket, CommercialCurrency>> = {
  BI: "BIF",
  RW: "RWF",
};

export function isCommercialMarket(value: unknown): value is CommercialMarket {
  return typeof value === "string" && (COMMERCIAL_MARKETS as readonly string[]).includes(value);
}

/**
 * The governed canonical commercial-unit basis: USD 2 per unit
 * (`DEC-SUB-014`), expressed in USD minor units (cents). Validated by the
 * command layer on every price-schedule write -- deliberately NOT a database
 * CHECK (design §13), so a future Founder change is a controlled decision.
 */
export const COMMERCIAL_UNIT_USD_EQUIVALENT_MINOR = 200;

/** Funding buckets (design §7). Negative credit lives only on `paid`. */
export const COMMERCIAL_BUCKETS = ["trial", "paid"] as const;
export type CommercialBucket = (typeof COMMERCIAL_BUCKETS)[number];

/** Ledger entry categories (design §7). Command handlers for most are later WPs. */
export const COMMERCIAL_LEDGER_ENTRY_TYPES = [
  "trial_grant",
  "trial_adjustment",
  "credit_grant",
  "credit_adjustment",
  "capacity_reserved",
  "capacity_released",
  "consumption",
  "consumption_reversal",
  "settlement_void_reversal",
] as const;
export type CommercialLedgerEntryType = (typeof COMMERCIAL_LEDGER_ENTRY_TYPES)[number];

export const COMMERCIAL_SERVICE_RESTRICTIONS = ["none", "restricted"] as const;
export type CommercialServiceRestriction = (typeof COMMERCIAL_SERVICE_RESTRICTIONS)[number];

export const COMMERCIAL_STANDING_EVENT_TYPES = [
  "account_opened",
  "service_restricted",
  "service_restored",
  "paid_service_activated",
] as const;
export type CommercialStandingEventType = (typeof COMMERCIAL_STANDING_EVENT_TYPES)[number];

/** Audit vocabulary (design §15/§18). Enforced here; the table only checks the shape. */
export const COMMERCIAL_AUDIT_ACTION_TYPES = [
  "account_opened",
  "trial_granted",
  "trial_adjusted",
  "settlement_recorded",
  "settlement_confirmed",
  "settlement_voided",
  "settlement_cancelled",
  "credit_adjusted",
  "paid_service_activated",
  "service_restricted",
  "service_restored",
  "price_schedule_set",
  "admissions_reevaluated",
  "history_inspected",
] as const;
export type CommercialAuditActionType = (typeof COMMERCIAL_AUDIT_ACTION_TYPES)[number];

export const COMMERCIAL_AUDIT_RESULTS = ["succeeded", "denied", "no_change"] as const;
export type CommercialAuditResult = (typeof COMMERCIAL_AUDIT_RESULTS)[number];

/** Audit actor: the sole launch Platform Administrator, or a named system actor. */
export type CommercialActor =
  | { readonly type: "platform_administrator"; readonly id: string }
  | { readonly type: "system"; readonly id: `system:${string}` };

export type CommercialAccount = {
  readonly businessId: string;
  readonly settlementMarket: CommercialMarket;
  readonly commercialEffectiveFrom: Date;
  readonly trialRemainingUnits: number;
  readonly paidBalanceUnits: number;
  readonly trialReservedUnits: number;
  readonly paidReservedUnits: number;
  readonly serviceRestriction: CommercialServiceRestriction;
  readonly paidServiceActivatedAt: Date | null;
  readonly version: number;
  readonly correlationId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

/** Accounting balance (design §7): may be negative; no floor, no maximum. */
export function accountingBalance(account: CommercialAccount): number {
  return account.trialRemainingUnits + account.paidBalanceUnits;
}

/** Reserved capacity: capacity already promised to Circle positions (never negative). */
export function reservedUnits(account: CommercialAccount): number {
  return account.trialReservedUnits + account.paidReservedUnits;
}

/** Available capacity (design §7): accounting balance minus reserved. Read-only derivation; no gate is implemented. */
export function availableCapacity(account: CommercialAccount): number {
  return accountingBalance(account) - reservedUnits(account);
}

export type CommercialLedgerEntry = {
  readonly id: string;
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
  readonly sourceReferenceType: string | null;
  readonly sourceReferenceId: string | null;
  readonly reasonCode: string | null;
  readonly reasonText: string | null;
  readonly idempotencyScopeKey: string;
  readonly createdBy: string;
  readonly correlationId: string;
  readonly occurredAt: Date;
};

export type CommercialPriceSchedule = {
  readonly id: string;
  readonly market: CommercialMarket;
  readonly currency: CommercialCurrency;
  readonly usdEquivalentMinor: number;
  readonly localUnitPriceMinor: number;
  readonly rateNote: string | null;
  readonly effectiveFrom: Date;
  readonly createdBy: string;
  readonly reasonText: string;
  readonly createdAt: Date;
};
