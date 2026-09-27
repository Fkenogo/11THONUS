/**
 * Business-scoped Reward / Loyalty-Cycle read repository
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`).
 *
 * Read-only: SELECT statements only, no locks, no writes. Tenant isolation
 * is enforced in SQL — every statement is anchored on `business_id = $1`
 * and every join repeats the Business predicate (`reward_programs` joined
 * on `(id, business_id)`), so a row belonging to another Business can never
 * be returned regardless of what the caller passes. The optional program
 * filter narrows within the Business; it never widens it.
 *
 * Customer identification: the most recent `canonical_loyalty_number_value`
 * on THIS Business's own `purchase_records` for the Customer — data the
 * Business already sees through `listPurchasesForBusiness`. Every Cycle and
 * Reward originates from a verified Purchase at this Business, so a value
 * exists in practice; `null` is returned rather than fabricated otherwise.
 *
 * Deterministic ordering: rewards `available_at DESC, id DESC`; cycles
 * `updated_at DESC, id DESC`.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { LoyaltyCycleState, RewardState } from "../models/purchase";
import type {
  BusinessAvailableReward,
  BusinessLoyaltyCycleProgress,
} from "../models/businessLoyaltyVisibility";

type Queryable = PoolClient | PlatformPostgresPool;

const CUSTOMER_LOYALTY_NUMBER_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT pr.canonical_loyalty_number_value
      FROM purchase_records pr
     WHERE pr.business_id = $1
       AND pr.customer_identity_id = %CUSTOMER%
     ORDER BY pr.created_at DESC, pr.id DESC
     LIMIT 1
  ) ln ON true`;

type AvailableRewardDbRow = {
  reward_program_id: string;
  reward_program_name: string;
  customer_loyalty_number: string | null;
  reward_description: string;
  reward_quantity: number;
  state: RewardState;
  available_at: Date;
  cycle_sequence_number: number;
};

export async function listAvailableRewardsForBusinessRows(
  db: Queryable,
  businessId: string,
  options: {
    readonly rewardProgramId: string | null;
    readonly limit: number;
    readonly offset: number;
  },
): Promise<BusinessAvailableReward[]> {
  const result = await db.query<AvailableRewardDbRow>(
    `SELECT r.reward_program_id,
            rp.display_name AS reward_program_name,
            ln.canonical_loyalty_number_value AS customer_loyalty_number,
            r.reward_description,
            r.reward_quantity,
            r.state,
            r.available_at,
            c.sequence_number AS cycle_sequence_number
       FROM rewards r
       JOIN reward_programs rp
         ON rp.id = r.reward_program_id AND rp.business_id = r.business_id
       JOIN loyalty_cycles c
         ON c.id = r.loyalty_cycle_id AND c.business_id = r.business_id
       ${CUSTOMER_LOYALTY_NUMBER_LATERAL.replace("%CUSTOMER%", "r.customer_identity_id")}
      WHERE r.business_id = $1
        AND r.state = 'available'
        AND ($2::text IS NULL OR r.reward_program_id::text = $2::text)
      ORDER BY r.available_at DESC, r.id DESC
      LIMIT $3 OFFSET $4`,
    [businessId, options.rewardProgramId, options.limit, options.offset],
  );
  return result.rows.map((row) => ({
    rewardProgramId: row.reward_program_id,
    rewardProgramName: row.reward_program_name,
    customerLoyaltyNumber: row.customer_loyalty_number,
    rewardDescription: row.reward_description,
    rewardQuantity: row.reward_quantity,
    state: row.state,
    availableAt: row.available_at.toISOString(),
    cycleSequenceNumber: row.cycle_sequence_number,
  }));
}

type CycleProgressDbRow = {
  reward_program_id: string;
  reward_program_name: string;
  customer_loyalty_number: string | null;
  sequence_number: number;
  state: LoyaltyCycleState;
  allocated_units: number;
  threshold: number;
  pending_units: number;
  reward_state: RewardState | null;
  reward_description: string | null;
  reward_available_at: Date | null;
  updated_at: Date;
};

/**
 * Each Customer's CURRENT Cycle (`active` or `reward_available` — the
 * database guarantees at most one per Customer/Program) for this Business's
 * Reward Programs. Closed/redeemed Cycles are history, not progress.
 */
export async function listCurrentCycleProgressForBusinessRows(
  db: Queryable,
  businessId: string,
  options: {
    readonly rewardProgramId: string | null;
    readonly limit: number;
    readonly offset: number;
  },
): Promise<BusinessLoyaltyCycleProgress[]> {
  const result = await db.query<CycleProgressDbRow>(
    `SELECT c.reward_program_id,
            rp.display_name AS reward_program_name,
            ln.canonical_loyalty_number_value AS customer_loyalty_number,
            c.sequence_number,
            c.state,
            c.allocated_units,
            v.required_verified_units AS threshold,
            COALESCE(p.pending_units, 0)::int AS pending_units,
            r.state AS reward_state,
            r.reward_description,
            r.available_at AS reward_available_at,
            c.updated_at
       FROM loyalty_cycles c
       JOIN reward_programs rp
         ON rp.id = c.reward_program_id AND rp.business_id = c.business_id
       JOIN reward_program_versions v
         ON v.id = c.opened_under_version_id AND v.reward_program_id = c.reward_program_id
       LEFT JOIN rewards r
         ON r.loyalty_cycle_id = c.id AND r.business_id = c.business_id
       LEFT JOIN LATERAL (
         SELECT SUM(a.allocated_quantity) AS pending_units
           FROM verified_unit_allocations a
          WHERE a.business_id = c.business_id
            AND a.customer_identity_id = c.customer_identity_id
            AND a.reward_program_id = c.reward_program_id
            AND a.state = 'pending'
       ) p ON true
       ${CUSTOMER_LOYALTY_NUMBER_LATERAL.replace("%CUSTOMER%", "c.customer_identity_id")}
      WHERE c.business_id = $1
        AND c.state IN ('active', 'reward_available')
        AND ($2::text IS NULL OR c.reward_program_id::text = $2::text)
      ORDER BY c.updated_at DESC, c.id DESC
      LIMIT $3 OFFSET $4`,
    [businessId, options.rewardProgramId, options.limit, options.offset],
  );
  return result.rows.map((row) => ({
    rewardProgramId: row.reward_program_id,
    rewardProgramName: row.reward_program_name,
    customerLoyaltyNumber: row.customer_loyalty_number,
    cycleSequenceNumber: row.sequence_number,
    cycleState: row.state,
    allocatedUnits: row.allocated_units,
    threshold: row.threshold,
    unitsToReward: Math.max(row.threshold - row.allocated_units, 0),
    pendingUnits: row.pending_units,
    reward:
      row.reward_state !== null && row.reward_description !== null && row.reward_available_at
        ? {
            state: row.reward_state,
            rewardDescription: row.reward_description,
            availableAt: row.reward_available_at.toISOString(),
          }
        : null,
    updatedAt: row.updated_at.toISOString(),
  }));
}
