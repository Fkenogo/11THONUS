/**
 * Commercial's READ-ONLY view of the Loyalty Reward fact (`WP-COM-04`;
 * design §4.2, §4.4, §5.3).
 *
 * This is the ONLY Commercial file that names a Loyalty table, and it issues
 * plain `SELECT`s only: no `FOR UPDATE` / `FOR SHARE`, no write, no import of
 * any Loyalty/Purchase repository. Commercial reads the Reward as the
 * authoritative "Circle earning side completed" fact and never changes it.
 * A non-locking read cannot deadlock with, or block, any Loyalty transaction.
 *
 * Detection is a stateless pull over the durable fact -- no watermark or
 * cursor that could skip a row (design §5.3). The predicate:
 *   Reward state in (available, redeemed)         -- redemption does not matter
 *   AND Business has a Commercial account
 *   AND Reward.available_at >= account.commercial_effective_from
 *   AND no consumption claim exists for its Cycle
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { RewardSourceFact } from "../models/commercialConsumption";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

type SourceRow = {
  id: string;
  loyalty_cycle_id: string;
  business_id: string;
  reward_program_id: string;
  state: string;
  available_at: Date;
};

const SOURCE_COLUMNS =
  "r.id, r.loyalty_cycle_id, r.business_id, r.reward_program_id, r.state, r.available_at";

function mapSource(row: SourceRow): RewardSourceFact {
  return {
    rewardId: row.id,
    loyaltyCycleId: row.loyalty_cycle_id,
    businessId: row.business_id,
    rewardProgramId: row.reward_program_id,
    state: row.state,
    availableAt: row.available_at,
  };
}

/** Rewards in these states count as consumed units (a Reward redeemed before projection still counts). */
export const COUNTABLE_REWARD_STATES = ["available", "redeemed"] as const;

/** Non-locking read of one Reward's source facts. */
export async function getRewardSource(
  db: Queryable,
  rewardId: string,
): Promise<RewardSourceFact | null> {
  const result = await db.query<SourceRow>(
    `SELECT ${SOURCE_COLUMNS} FROM rewards r WHERE r.id = $1`,
    [rewardId],
  );
  return result.rows.length === 0 ? null : mapSource(result.rows[0]);
}

export type ListUnprojectedRewardsParams = {
  readonly limit: number;
  readonly businessId?: string;
};

/**
 * Up to `limit` unprojected Rewards, deterministic order: fewest prior
 * projection failures first (so a persistently failing Reward cannot starve
 * the rest of a bounded pass), then oldest `available_at`, then id.
 */
export async function listUnprojectedRewardSources(
  db: Queryable,
  params: ListUnprojectedRewardsParams,
): Promise<RewardSourceFact[]> {
  const result = await db.query<SourceRow>(
    `SELECT ${SOURCE_COLUMNS}
       FROM rewards r
       JOIN commercial_accounts a
         ON a.business_id = r.business_id AND r.available_at >= a.commercial_effective_from
       LEFT JOIN commercial_consumption_claims c ON c.source_loyalty_cycle_id = r.loyalty_cycle_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS failures FROM commercial_projection_failures f
          WHERE f.source_loyalty_cycle_id = r.loyalty_cycle_id
       ) pf ON TRUE
      WHERE c.id IS NULL
        AND r.state = ANY($1::text[])
        AND ($2::text IS NULL OR r.business_id = $2)
      ORDER BY pf.failures ASC, r.available_at ASC, r.id ASC
      LIMIT $3`,
    [COUNTABLE_REWARD_STATES, params.businessId ?? null, params.limit],
  );
  return result.rows.map(mapSource);
}

export type UnprojectedRewardStats = {
  readonly count: number;
  readonly oldestAvailableAt: Date | null;
};

/** Lag inputs (design §5.7): how many Rewards are unprojected and how old the oldest is. */
export async function getUnprojectedRewardStats(db: Queryable): Promise<UnprojectedRewardStats> {
  const result = await db.query<{ n: string; oldest: Date | null }>(
    `SELECT COUNT(*) AS n, MIN(r.available_at) AS oldest
       FROM rewards r
       JOIN commercial_accounts a
         ON a.business_id = r.business_id AND r.available_at >= a.commercial_effective_from
       LEFT JOIN commercial_consumption_claims c ON c.source_loyalty_cycle_id = r.loyalty_cycle_id
      WHERE c.id IS NULL AND r.state = ANY($1::text[])`,
    [COUNTABLE_REWARD_STATES],
  );
  return { count: Number(result.rows[0].n), oldestAvailableAt: result.rows[0].oldest };
}
