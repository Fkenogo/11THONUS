/**
 * Commercial account repository (`WP-COM-01`; design §7, §20).
 *
 * SQL only, against `commercial_*` tables only. The account row is the
 * materialised, DERIVED operational state; the ledger is the authority. Its
 * counters are changed only through `postCommercialLedgerEntry`
 * (`../services/postCommercialLedgerEntry.ts`), which calls
 * `updateAccountCounters` under `lockCommercialAccount`. The database
 * additionally refuses (at COMMIT) any account whose counters/version differ
 * from its latest ledger entry, so this repository cannot drift the account
 * away from the ledger even by mistake.
 *
 * Touches no Loyalty / Purchase table and imports none of their repositories.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  CommercialAccount,
  CommercialMarket,
  CommercialServiceRestriction,
} from "../models/commercialFoundation";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

type AccountRow = {
  business_id: string;
  settlement_market: CommercialMarket;
  commercial_effective_from: Date;
  trial_remaining_units: number;
  paid_balance_units: number;
  trial_reserved_units: number;
  paid_reserved_units: number;
  service_restriction: CommercialServiceRestriction;
  paid_service_activated_at: Date | null;
  version: string | number;
  correlation_id: string;
  created_at: Date;
  updated_at: Date;
};

const ACCOUNT_COLUMNS = `business_id, settlement_market, commercial_effective_from,
  trial_remaining_units, paid_balance_units, trial_reserved_units, paid_reserved_units,
  service_restriction, paid_service_activated_at, version, correlation_id, created_at, updated_at`;

function mapAccount(row: AccountRow): CommercialAccount {
  return {
    businessId: row.business_id,
    settlementMarket: row.settlement_market,
    commercialEffectiveFrom: row.commercial_effective_from,
    trialRemainingUnits: row.trial_remaining_units,
    paidBalanceUnits: row.paid_balance_units,
    trialReservedUnits: row.trial_reserved_units,
    paidReservedUnits: row.paid_reserved_units,
    serviceRestriction: row.service_restriction,
    paidServiceActivatedAt: row.paid_service_activated_at,
    version: Number(row.version),
    correlationId: row.correlation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type InsertCommercialAccountParams = {
  readonly businessId: string;
  readonly settlementMarket: CommercialMarket;
  readonly commercialEffectiveFrom: Date;
  readonly correlationId: string;
};

/**
 * Inserts the zero-state account (version 0, no ledger entries). Returns
 * `null` when an account already exists for the Business (`business_id` is
 * the primary key), never overwriting it. There is deliberately NO trial
 * amount parameter: an account never starts with a default trial allowance.
 */
export async function insertCommercialAccount(
  tx: PlatformPostgresTransaction,
  params: InsertCommercialAccountParams,
): Promise<CommercialAccount | null> {
  const result = await tx.query<AccountRow>(
    `INSERT INTO commercial_accounts (business_id, settlement_market, commercial_effective_from, correlation_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (business_id) DO NOTHING
     RETURNING ${ACCOUNT_COLUMNS}`,
    [
      params.businessId,
      params.settlementMarket,
      params.commercialEffectiveFrom,
      params.correlationId,
    ],
  );
  return result.rows.length === 0 ? null : mapAccount(result.rows[0]);
}

/** Non-locking read. */
export async function getCommercialAccount(
  db: Queryable,
  businessId: string,
): Promise<CommercialAccount | null> {
  const result = await db.query<AccountRow>(
    `SELECT ${ACCOUNT_COLUMNS} FROM commercial_accounts WHERE business_id = $1`,
    [businessId],
  );
  return result.rows.length === 0 ? null : mapAccount(result.rows[0]);
}

/** The per-Business account lock (design §22.1): `FOR UPDATE` on the account row. */
export async function lockCommercialAccount(
  tx: PlatformPostgresTransaction,
  businessId: string,
): Promise<CommercialAccount | null> {
  const result = await tx.query<AccountRow>(
    `SELECT ${ACCOUNT_COLUMNS} FROM commercial_accounts WHERE business_id = $1 FOR UPDATE`,
    [businessId],
  );
  return result.rows.length === 0 ? null : mapAccount(result.rows[0]);
}

export type AccountCounters = {
  readonly trialRemainingUnits: number;
  readonly paidBalanceUnits: number;
  readonly trialReservedUnits: number;
  readonly paidReservedUnits: number;
};

/**
 * Compare-and-set counter update: succeeds only when the stored version is
 * still `expectedVersion`, advancing it by exactly one. Returns `null` when
 * the row is stale (the caller's lock discipline makes this unreachable in
 * correct use; it is the optimistic backstop, and the database trigger is
 * the final one). Must be paired, in the same transaction, with the ledger
 * entry that produced these counters.
 */
export async function updateAccountCounters(
  tx: PlatformPostgresTransaction,
  businessId: string,
  expectedVersion: number,
  counters: AccountCounters,
): Promise<CommercialAccount | null> {
  const result = await tx.query<AccountRow>(
    `UPDATE commercial_accounts
        SET trial_remaining_units = $3, paid_balance_units = $4,
            trial_reserved_units = $5, paid_reserved_units = $6,
            version = version + 1, updated_at = now()
      WHERE business_id = $1 AND version = $2
      RETURNING ${ACCOUNT_COLUMNS}`,
    [
      businessId,
      expectedVersion,
      counters.trialRemainingUnits,
      counters.paidBalanceUnits,
      counters.trialReservedUnits,
      counters.paidReservedUnits,
    ],
  );
  return result.rows.length === 0 ? null : mapAccount(result.rows[0]);
}

export type AccountAdministrativeState = {
  readonly serviceRestriction?: CommercialServiceRestriction;
  readonly paidServiceActivatedAt?: Date;
};

/**
 * Storage primitive for the two administrative facts (restriction and the
 * set-once paid-activation timestamp). Flag-only: it does not move the
 * version or any counter. The COMMANDS that drive it (restrict / restore /
 * activate, with authority, audit and idempotency) are a later work package.
 */
export async function updateAccountAdministrativeState(
  tx: PlatformPostgresTransaction,
  businessId: string,
  state: AccountAdministrativeState,
): Promise<CommercialAccount | null> {
  const result = await tx.query<AccountRow>(
    `UPDATE commercial_accounts
        SET service_restriction = COALESCE($2, service_restriction),
            paid_service_activated_at = COALESCE($3, paid_service_activated_at),
            updated_at = now()
      WHERE business_id = $1
      RETURNING ${ACCOUNT_COLUMNS}`,
    [businessId, state.serviceRestriction ?? null, state.paidServiceActivatedAt ?? null],
  );
  return result.rows.length === 0 ? null : mapAccount(result.rows[0]);
}
