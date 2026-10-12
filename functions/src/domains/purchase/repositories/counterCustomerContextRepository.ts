/**
 * Minimal Staff Counter projection of one positively resolved Customer's
 * participation at one Business. It is not a directory read: every query is
 * anchored to the server-resolved customer id and current Business.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";

type Queryable = PoolClient | PlatformPostgresPool;

export type CounterCustomerProgrammeContext = {
  readonly rewardProgramId: string;
  readonly programmeName: string;
  readonly verifiedUnits: number;
  readonly requiredVerifiedUnits: number;
  readonly awaitingCustomerConfirmationUnits: number;
  readonly rewardStatus: "none" | "available";
};

/** Pre-resolver policy gate: a Loyalty Number is accepted only where a current active programme permits it. */
export async function hasActiveLoyaltyNumberProgramme(
  db: Queryable,
  businessId: string,
): Promise<boolean> {
  const result = await db.query<{ allowed: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM reward_programs p
         JOIN reward_program_versions v
           ON v.id = p.current_version_id AND v.reward_program_id = p.id
        WHERE p.business_id = $1
          AND p.status = 'active'
          AND v.status = 'active'
          AND v.shared_loyalty_number_allowed = true
     ) AS allowed`,
    [businessId],
  );
  return result.rows[0]?.allowed ?? false;
}

type DbRow = {
  reward_program_id: string;
  programme_name: string;
  verified_units: number | null;
  required_verified_units: number;
  awaiting_units: number;
  reward_available: boolean;
};

/**
 * A programme is relevant while the Customer has a current Circle or a
 * customer-confirmable purchase there. Business-review-held and unrelated
 * purchase rows are intentionally not used to establish participation.
 */
export async function listCounterCustomerProgrammes(
  db: Queryable,
  params: {
    readonly businessId: string;
    readonly customerIdentityId: string;
    readonly presentedVia: "loyalty_number" | "qr_identity";
  },
): Promise<CounterCustomerProgrammeContext[]> {
  const result = await db.query<DbRow>(
    `SELECT p.id AS reward_program_id,
            p.display_name AS programme_name,
            c.allocated_units AS verified_units,
            COALESCE(c.required_verified_units, current_version.required_verified_units) AS required_verified_units,
            COALESCE(waiting.awaiting_units, 0)::int AS awaiting_units,
            COALESCE(c.reward_available AND c.reward_open, false) AS reward_available
       FROM reward_programs p
       JOIN reward_program_versions current_version
         ON current_version.id = p.current_version_id
        AND current_version.reward_program_id = p.id
       LEFT JOIN LATERAL (
         SELECT cycle.allocated_units,
                cycle.state = 'reward_available' AS reward_available,
                version.required_verified_units,
                EXISTS (
                  SELECT 1 FROM rewards reward
                   WHERE reward.business_id = cycle.business_id
                     AND reward.loyalty_cycle_id = cycle.id
                     AND reward.state = 'available'
                ) AS reward_open
           FROM loyalty_cycles cycle
           JOIN reward_program_versions version
             ON version.id = cycle.opened_under_version_id
            AND version.reward_program_id = cycle.reward_program_id
          WHERE cycle.business_id = p.business_id
            AND cycle.customer_identity_id = $2
            AND cycle.reward_program_id = p.id
            AND cycle.state IN ('active', 'reward_available')
          ORDER BY cycle.updated_at DESC, cycle.id DESC
          LIMIT 1
       ) c ON true
       LEFT JOIN LATERAL (
         SELECT SUM(purchase.quantity)::int AS awaiting_units
           FROM purchase_records purchase
          WHERE purchase.business_id = p.business_id
            AND purchase.customer_identity_id = $2
            AND purchase.reward_program_id = p.id
            AND purchase.status = 'waiting_for_customer'
       ) waiting ON true
      WHERE p.business_id = $1
        AND ($3::boolean = false OR current_version.shared_loyalty_number_allowed = true)
        AND (c.allocated_units IS NOT NULL OR COALESCE(waiting.awaiting_units, 0) > 0)
      ORDER BY p.display_name ASC, p.id ASC`,
    [params.businessId, params.customerIdentityId, params.presentedVia === "loyalty_number"],
  );

  return result.rows.map((row) => ({
    rewardProgramId: row.reward_program_id,
    programmeName: row.programme_name,
    verifiedUnits: row.verified_units ?? 0,
    requiredVerifiedUnits: row.required_verified_units,
    awaitingCustomerConfirmationUnits: row.awaiting_units,
    rewardStatus: row.reward_available ? "available" : "none",
  }));
}
