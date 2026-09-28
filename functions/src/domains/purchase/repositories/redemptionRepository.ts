/**
 * Redemption store repository (`CAPABILITY-6-REDEMPTION-ENGINE-001`,
 * `DEC-LOY-018` / `FD-REDEMPTION-AUTHORITY-001`).
 *
 * Capability 6: the server-authoritative `available → redeemed` transition
 * plus its one-row evidence store (migration `0020_redemption_store.sql`).
 * Deliberately NO reversal/cancellation writes (`DEC-LOY-004` boundary —
 * reversal is a separate package, never retrofitted here).
 *
 * Concurrency: the command locks the Reward row `FOR UPDATE` and then
 * performs a CONDITIONAL `UPDATE … WHERE state = 'available'`. The lock
 * serialises two Business members confirming the same Reward on two
 * devices; the conditional update is the belt-and-braces backstop (a lost
 * race returns zero rows and the command fails closed). The relational
 * backstops live in the schema: `redemptions_one_per_reward`
 * (`UNIQUE (reward_id)`) makes a second redemption row impossible even if
 * the application check were bypassed.
 *
 * Cycle lifecycle (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-001`, TRD11
 * §11.26): `reward_available` is a CURRENT cycle state — the partial unique
 * index `loyalty_cycles_one_current_per_customer_program` and
 * `lockCurrentCycle` both count `active`/`reward_available` as current — so
 * the governing Cycle is closed `reward_available → reward_redeemed` by the
 * redemption command in the same transaction, the next Cycle is opened, and
 * pending Verified Units forward-allocate into it. Only `reward_redeemed`
 * releases the single-current-Cycle slot (DEC-LOY-002).
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { RedemptionRow, RewardRow, RewardState } from "../models/purchase";

type Queryable = PoolClient | PlatformPostgresPool;

type RedemptionDbRow = {
  id: string;
  reward_id: string;
  loyalty_cycle_id: string;
  business_id: string;
  customer_identity_id: string;
  reward_program_id: string;
  reward_program_version_id: string;
  confirmed_by_user_id: string;
  confirmed_by_membership_id: string;
  confirmed_by_role: string;
  idempotency_key: string;
  redeemed_at: Date;
  correlation_id: string;
  schema_version: number;
};

function mapRedemptionRow(row: RedemptionDbRow): RedemptionRow {
  return {
    id: row.id,
    rewardId: row.reward_id,
    loyaltyCycleId: row.loyalty_cycle_id,
    businessId: row.business_id,
    customerIdentityId: row.customer_identity_id,
    rewardProgramId: row.reward_program_id,
    rewardProgramVersionId: row.reward_program_version_id,
    confirmedByUserId: row.confirmed_by_user_id,
    confirmedByMembershipId: row.confirmed_by_membership_id,
    confirmedByRole: row.confirmed_by_role,
    idempotencyKey: row.idempotency_key,
    redeemedAt: row.redeemed_at,
    correlationId: row.correlation_id,
    schemaVersion: row.schema_version,
  };
}

type RewardDbRow = {
  id: string;
  loyalty_cycle_id: string;
  business_id: string;
  customer_identity_id: string;
  reward_program_id: string;
  reward_program_version_id: string;
  reward_description: string;
  reward_quantity: number;
  state: RewardState;
  available_at: Date;
  created_at: Date;
  correlation_id: string;
  schema_version: number;
};

function mapRewardRow(row: RewardDbRow): RewardRow {
  return {
    id: row.id,
    loyaltyCycleId: row.loyalty_cycle_id,
    businessId: row.business_id,
    customerIdentityId: row.customer_identity_id,
    rewardProgramId: row.reward_program_id,
    rewardProgramVersionId: row.reward_program_version_id,
    rewardDescription: row.reward_description,
    rewardQuantity: row.reward_quantity,
    state: row.state,
    availableAt: row.available_at,
    createdAt: row.created_at,
    correlationId: row.correlation_id,
    schemaVersion: row.schema_version,
  };
}

/**
 * Locks the persisted Reward row for the current transaction. The lock is
 * what serialises concurrent confirmations; the caller re-reads `state`
 * from the LOCKED row (never from client input) before transitioning.
 */
export async function lockRewardById(
  tx: PlatformPostgresTransaction,
  rewardId: string,
): Promise<RewardRow | null> {
  const result = await tx.query<RewardDbRow>(`SELECT * FROM rewards WHERE id = $1 FOR UPDATE`, [
    rewardId,
  ]);
  if (result.rows.length === 0) {
    return null;
  }
  return mapRewardRow(result.rows[0]);
}

/**
 * The governed transition: `available → redeemed`, conditional. Returns
 * `null` when the Reward is no longer `available` (already redeemed, or
 * otherwise ineligible), so the command fails closed rather than
 * double-redeeming.
 */
export async function transitionRewardToRedeemed(
  tx: PlatformPostgresTransaction,
  params: { readonly rewardId: string; readonly redeemedAt: Date },
): Promise<RewardRow | null> {
  const result = await tx.query<RewardDbRow>(
    `UPDATE rewards SET state = 'redeemed'
      WHERE id = $1 AND state = 'available'
      RETURNING *`,
    [params.rewardId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapRewardRow(result.rows[0]);
}

export type InsertRedemptionParams = {
  readonly rewardId: string;
  readonly loyaltyCycleId: string;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly confirmedByUserId: string;
  readonly confirmedByMembershipId: string;
  readonly confirmedByRole: "owner" | "manager" | "staff";
  readonly idempotencyKey: string;
  readonly correlationId: string;
};

/**
 * Writes the one-row redemption evidence for the transition just made.
 * The composite FK chain in `0020` proves every scope column is the
 * Reward's real scope rather than a caller-supplied claim.
 */
export async function insertRedemption(
  tx: PlatformPostgresTransaction,
  params: InsertRedemptionParams,
): Promise<RedemptionRow> {
  const result = await tx.query<RedemptionDbRow>(
    `INSERT INTO redemptions
       (reward_id, loyalty_cycle_id, business_id, customer_identity_id,
        reward_program_id, reward_program_version_id,
        confirmed_by_user_id, confirmed_by_membership_id, confirmed_by_role,
        idempotency_key, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      params.rewardId,
      params.loyaltyCycleId,
      params.businessId,
      params.customerIdentityId,
      params.rewardProgramId,
      params.rewardProgramVersionId,
      params.confirmedByUserId,
      params.confirmedByMembershipId,
      params.confirmedByRole,
      params.idempotencyKey,
      params.correlationId,
    ],
  );
  return mapRedemptionRow(result.rows[0]);
}

export async function getRedemptionByRewardId(
  db: Queryable,
  rewardId: string,
): Promise<RedemptionRow | null> {
  const result = await db.query<RedemptionDbRow>(`SELECT * FROM redemptions WHERE reward_id = $1`, [
    rewardId,
  ]);
  if (result.rows.length === 0) {
    return null;
  }
  return mapRedemptionRow(result.rows[0]);
}
