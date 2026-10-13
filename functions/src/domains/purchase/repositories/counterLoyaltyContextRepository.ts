/**
 * Transaction-scoped, limited loyalty context for the Staff Counter
 * (`EA-BL-001-CORR-002-B`, Founder Preview Pass 3 — supersedes Slice B D4; PRD01 §8.2 "view limited
 * customer progress needed to complete the transaction").
 *
 * Read-only SELECTs over existing tables; no locks, no writes, no new projection. Every statement is
 * anchored on `business_id = $1` AND the already-resolved Customer AND the one Reward Program, so it
 * can only ever describe THIS Customer's position in THIS Business's Program. It deliberately selects
 * counts and one state flag — never a name, contact detail, history, identity id, review field or
 * threshold.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";

type Queryable = PoolClient | PlatformPostgresPool;

/** The Program facts the read needs; `null` when the Program is not an active one of this Business. */
export type CounterProgramLoyaltyTerms = {
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly requiredVerifiedUnits: number;
};

export async function readActiveProgramLoyaltyTerms(
  db: Queryable,
  params: { readonly businessId: string; readonly rewardProgramId: string },
): Promise<CounterProgramLoyaltyTerms | null> {
  const result = await db.query<{
    shared_loyalty_number_allowed: boolean;
    required_verified_units: number;
  }>(
    `SELECT v.shared_loyalty_number_allowed, v.required_verified_units
       FROM reward_programs p
       JOIN reward_program_versions v
         ON v.id = p.current_version_id AND v.reward_program_id = p.id
      WHERE p.id = $2::uuid AND p.business_id = $1
        AND p.status = 'active' AND v.status = 'active'`,
    [params.businessId, params.rewardProgramId],
  );
  const row = result.rows[0];
  return row
    ? {
        sharedLoyaltyNumberAllowed: row.shared_loyalty_number_allowed,
        requiredVerifiedUnits: row.required_verified_units,
      }
    : null;
}

export type CounterCurrentCycleProgress = {
  readonly verifiedUnits: number;
  readonly requiredVerifiedUnits: number;
  readonly rewardAvailable: boolean;
};

/** The Customer's single current (`active` / `reward_available`) Cycle in this Program, if any. */
export async function readCurrentCycleProgress(
  db: Queryable,
  params: {
    readonly businessId: string;
    readonly customerIdentityId: string;
    readonly rewardProgramId: string;
  },
): Promise<CounterCurrentCycleProgress | null> {
  const result = await db.query<{
    state: string;
    allocated_units: number;
    required_verified_units: number;
    reward_open: boolean;
  }>(
    `SELECT c.state, c.allocated_units, v.required_verified_units,
            EXISTS (
              SELECT 1 FROM rewards r
               WHERE r.loyalty_cycle_id = c.id AND r.business_id = c.business_id
                 AND r.state = 'available'
            ) AS reward_open
       FROM loyalty_cycles c
       JOIN reward_program_versions v ON v.id = c.opened_under_version_id
      WHERE c.business_id = $1
        AND c.customer_identity_id = $2
        AND c.reward_program_id = $3::uuid
        AND c.state IN ('active', 'reward_available')
      LIMIT 1`,
    [params.businessId, params.customerIdentityId, params.rewardProgramId],
  );
  const row = result.rows[0];
  return row
    ? {
        verifiedUnits: row.allocated_units,
        requiredVerifiedUnits: row.required_verified_units,
        rewardAvailable: row.state === "reward_available" && row.reward_open,
      }
    : null;
}

/**
 * Units on the Customer's Purchases that are recorded but still waiting for the Customer's own
 * confirmation. Same definition as the Customer's "Waiting for You". Business-review-held Purchases
 * are NOT counted: they are not customer-verifiable, and counting them would reveal review routing.
 */
export async function sumUnitsAwaitingCustomerConfirmation(
  db: Queryable,
  params: {
    readonly businessId: string;
    readonly customerIdentityId: string;
    readonly rewardProgramId: string;
  },
): Promise<number> {
  const result = await db.query<{ units: number }>(
    `SELECT COALESCE(SUM(quantity), 0)::integer AS units
       FROM purchase_records
      WHERE business_id = $1
        AND customer_identity_id = $2
        AND reward_program_id = $3::uuid
        AND status = 'waiting_for_customer'`,
    [params.businessId, params.customerIdentityId, params.rewardProgramId],
  );
  return result.rows[0]?.units ?? 0;
}
