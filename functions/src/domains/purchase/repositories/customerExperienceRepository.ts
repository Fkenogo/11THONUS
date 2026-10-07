import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";

type Queryable = PoolClient | PlatformPostgresPool;

type CircleDbRow = {
  business_id: string;
  reward_program_id: string;
  programme_name: string;
  qualifying_item_name: string | null;
  cycle_id: string;
  cycle_number: number;
  cycle_state: "active" | "reward_available";
  verified_units: number;
  available_reward_id: string | null;
  reward_description: string | null;
};

export type CustomerExperienceCycle = {
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly programmeName: string;
  readonly qualifyingItemName: string | null;
  readonly cycleId: string;
  readonly cycleNumber: number;
  readonly cycleState: "active" | "reward_available";
  readonly verifiedUnits: number;
  readonly rewardAvailable: boolean;
  readonly rewardDescription: string | null;
};

export async function listCustomerExperienceCycles(
  db: Queryable,
  customerIdentityId: string,
): Promise<CustomerExperienceCycle[]> {
  const result = await db.query<CircleDbRow>(
    `SELECT c.business_id, c.reward_program_id, rp.display_name AS programme_name,
            latest.item_label AS qualifying_item_name, c.id AS cycle_id,
            c.sequence_number AS cycle_number, c.state AS cycle_state,
            c.allocated_units AS verified_units,
            available.id AS available_reward_id,
            COALESCE(available.reward_description, version.reward_description) AS reward_description
       FROM loyalty_cycles c
       JOIN reward_programs rp
         ON rp.id = c.reward_program_id AND rp.business_id = c.business_id
       JOIN reward_program_versions version
         ON version.id = c.opened_under_version_id
       LEFT JOIN rewards available
         ON available.loyalty_cycle_id = c.id AND available.state = 'available'
       LEFT JOIN LATERAL (
         SELECT p.item_label
           FROM purchase_records p
          WHERE p.customer_identity_id = c.customer_identity_id
            AND p.business_id = c.business_id
            AND p.reward_program_id = c.reward_program_id
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT 1
       ) latest ON true
      WHERE c.customer_identity_id = $1
        AND c.state IN ('active','reward_available')
      ORDER BY c.updated_at DESC, c.id DESC`,
    [customerIdentityId],
  );
  return result.rows.map((row) => ({
    businessId: row.business_id,
    rewardProgramId: row.reward_program_id,
    programmeName: row.programme_name,
    qualifyingItemName: row.qualifying_item_name,
    cycleId: row.cycle_id,
    cycleNumber: row.cycle_number,
    cycleState: row.cycle_state,
    verifiedUnits: row.verified_units,
    rewardAvailable: row.cycle_state === "reward_available" && row.available_reward_id !== null,
    rewardDescription: row.reward_description,
  }));
}

type PendingDbRow = {
  business_id: string;
  reward_program_id: string;
  programme_name: string;
  qualifying_item_name: string;
  pending_units: number;
};

export type CustomerPendingUnits = {
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly programmeName: string;
  readonly qualifyingItemName: string;
  readonly pendingUnits: number;
};

export async function listCustomerPendingUnits(
  db: Queryable,
  customerIdentityId: string,
): Promise<CustomerPendingUnits[]> {
  const result = await db.query<PendingDbRow>(
    `SELECT p.business_id, p.reward_program_id, rp.display_name AS programme_name,
            COALESCE(MAX(p.item_label), rp.display_name) AS qualifying_item_name,
            SUM(p.quantity)::integer AS pending_units
       FROM purchase_records p
       JOIN reward_programs rp
         ON rp.id = p.reward_program_id AND rp.business_id = p.business_id
      WHERE p.customer_identity_id = $1 AND p.status = 'waiting_for_customer'
      GROUP BY p.business_id, p.reward_program_id, rp.display_name
      ORDER BY rp.display_name, p.business_id`,
    [customerIdentityId],
  );
  return result.rows.map((row) => ({
    businessId: row.business_id,
    rewardProgramId: row.reward_program_id,
    programmeName: row.programme_name,
    qualifyingItemName: row.qualifying_item_name,
    pendingUnits: row.pending_units,
  }));
}

type ActivityDbRow = {
  id: string;
  business_id: string;
  reward_program_id: string;
  programme_name: string;
  item_label: string | null;
  quantity: number | null;
  event_kind: "purchase" | "reward_available" | "reward_redeemed";
  event_status: string;
  reward_description: string | null;
  occurred_at: Date;
};

export type CustomerExperienceActivity = {
  readonly id: string;
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly programmeName: string;
  readonly itemLabel: string | null;
  readonly quantity: number | null;
  readonly eventKind: ActivityDbRow["event_kind"];
  readonly status: string;
  readonly rewardDescription: string | null;
  readonly occurredAt: Date;
};

export async function listCustomerExperienceActivity(
  db: Queryable,
  customerIdentityId: string,
): Promise<CustomerExperienceActivity[]> {
  const result = await db.query<ActivityDbRow>(
    `SELECT activity.* FROM (
       SELECT e.id, p.business_id, p.reward_program_id, rp.display_name AS programme_name,
              p.item_label, p.quantity, 'purchase'::text AS event_kind,
              CASE WHEN e.to_status = 'business_review_required'
                   THEN 'awaiting_business_confirmation' ELSE e.to_status END AS event_status,
              NULL::text AS reward_description,
              e.occurred_at
         FROM purchase_record_events e
         JOIN purchase_records p ON p.id = e.purchase_record_id
         JOIN reward_programs rp ON rp.id = p.reward_program_id
        WHERE p.customer_identity_id = $1
       UNION ALL
       SELECT r.id, r.business_id, r.reward_program_id, rp.display_name,
              NULL::text, NULL::integer, 'reward_available'::text, r.state,
              r.reward_description, r.available_at
         FROM rewards r
         JOIN reward_programs rp ON rp.id = r.reward_program_id
        WHERE r.customer_identity_id = $1 AND r.state = 'available'
       UNION ALL
       SELECT d.id, d.business_id, d.reward_program_id, rp.display_name,
              NULL::text, NULL::integer, 'reward_redeemed'::text, r.state,
              r.reward_description, d.redeemed_at
         FROM redemptions d
         JOIN rewards r ON r.id = d.reward_id
         JOIN reward_programs rp ON rp.id = d.reward_program_id
        WHERE d.customer_identity_id = $1
     ) activity
      ORDER BY activity.occurred_at DESC, activity.id DESC
      LIMIT 50`,
    [customerIdentityId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    businessId: row.business_id,
    rewardProgramId: row.reward_program_id,
    programmeName: row.programme_name,
    itemLabel: row.item_label,
    quantity: row.quantity,
    eventKind: row.event_kind,
    status: row.event_status,
    rewardDescription: row.reward_description,
    occurredAt: row.occurred_at,
  }));
}
