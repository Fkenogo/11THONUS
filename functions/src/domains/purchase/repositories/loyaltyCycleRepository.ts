/**
 * Loyalty Cycle stream + aggregate + allocation + Reward repository
 * (`PLATFORM-BASELINE-006A`, design §§15-16/20, FD-PVL-002).
 *
 * Stream serialization (mechanism B): every verify transaction ensures the
 * `loyalty_cycle_streams` row for (Business, Customer, Program) with
 * `INSERT … ON CONFLICT DO NOTHING` (the conflict path is the designed
 * concurrent-arrival path, never a leaked raw violation) and then locks it
 * `FOR UPDATE` before resolving/creating the current Cycle or allocating.
 * The stream row owns the cycle sequence counter — no `MAX()+1` race.
 *
 * Global lock ordering inside every transaction (deadlock prevention):
 * idempotency key → purchase → stream → cycle → reward → appends.
 *
 * Conservation (constructional): the verify command creates allocation
 * positions summing to the credit quantity (allocated up to Cycle capacity,
 * remainder pending); whole-position movement preserves the sum on the same
 * rows. History rows never count toward current quantity.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  AllocationEventRow,
  AllocationPositionRow,
  LoyaltyCycleRow,
  LoyaltyCycleState,
  LoyaltyCycleStreamRow,
  RewardRow,
  RewardState,
} from "../models/purchase";

type Queryable = PoolClient | PlatformPostgresPool;

/** Threshold: exactly 10 verified units per Cycle (DEC-LOY-001, loyaltyInvariants). */
export const LOYALTY_CYCLE_THRESHOLD = 10;

type StreamDbRow = {
  business_id: string;
  customer_identity_id: string;
  reward_program_id: string;
  next_cycle_sequence: number;
  created_at: Date;
  updated_at: Date;
};

function mapStreamRow(row: StreamDbRow): LoyaltyCycleStreamRow {
  return {
    businessId: row.business_id,
    customerIdentityId: row.customer_identity_id,
    rewardProgramId: row.reward_program_id,
    nextCycleSequence: row.next_cycle_sequence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Idempotently ensures the stream row exists, then locks it. Returns the
 * locked stream (with its current sequence counter).
 */
export async function ensureAndLockCycleStream(
  tx: PlatformPostgresTransaction,
  params: {
    readonly businessId: string;
    readonly customerIdentityId: string;
    readonly rewardProgramId: string;
  },
): Promise<LoyaltyCycleStreamRow> {
  await tx.query(
    `INSERT INTO loyalty_cycle_streams (business_id, customer_identity_id, reward_program_id)
     VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING`,
    [params.businessId, params.customerIdentityId, params.rewardProgramId],
  );
  const locked = await tx.query<StreamDbRow>(
    `SELECT * FROM loyalty_cycle_streams
      WHERE business_id = $1 AND customer_identity_id = $2 AND reward_program_id = $3
      FOR UPDATE`,
    [params.businessId, params.customerIdentityId, params.rewardProgramId],
  );
  return mapStreamRow(locked.rows[0]);
}

type CycleDbRow = {
  id: string;
  business_id: string;
  customer_identity_id: string;
  reward_program_id: string;
  opened_under_version_id: string;
  sequence_number: number;
  state: LoyaltyCycleState;
  allocated_units: number;
  created_at: Date;
  updated_at: Date;
  correlation_id: string;
  schema_version: number;
};

function mapCycleRow(row: CycleDbRow): LoyaltyCycleRow {
  return {
    id: row.id,
    businessId: row.business_id,
    customerIdentityId: row.customer_identity_id,
    rewardProgramId: row.reward_program_id,
    openedUnderVersionId: row.opened_under_version_id,
    sequenceNumber: row.sequence_number,
    state: row.state,
    allocatedUnits: row.allocated_units,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    correlationId: row.correlation_id,
    schemaVersion: row.schema_version,
  };
}

/** The single current (`active`/`reward_available`) Cycle, locked. Null when none exists yet. */
export async function lockCurrentCycle(
  tx: PlatformPostgresTransaction,
  params: { readonly customerIdentityId: string; readonly rewardProgramId: string },
): Promise<LoyaltyCycleRow | null> {
  const result = await tx.query<CycleDbRow>(
    `SELECT * FROM loyalty_cycles
      WHERE customer_identity_id = $1 AND reward_program_id = $2
        AND state IN ('active','reward_available')
      FOR UPDATE`,
    [params.customerIdentityId, params.rewardProgramId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapCycleRow(result.rows[0]);
}

/**
 * Opens a new Cycle under the already-locked stream, drawing its sequence
 * number from the stream counter (which is incremented in the same step).
 * The caller must hold the stream lock.
 */
export async function openCycleUnderStreamLock(
  tx: PlatformPostgresTransaction,
  params: {
    readonly businessId: string;
    readonly customerIdentityId: string;
    readonly rewardProgramId: string;
    readonly openedUnderVersionId: string;
    readonly correlationId: string;
  },
): Promise<LoyaltyCycleRow> {
  const stream = await tx.query<StreamDbRow>(
    `UPDATE loyalty_cycle_streams
        SET next_cycle_sequence = next_cycle_sequence + 1, updated_at = now()
      WHERE business_id = $1 AND customer_identity_id = $2 AND reward_program_id = $3
      RETURNING *`,
    [params.businessId, params.customerIdentityId, params.rewardProgramId],
  );
  const sequenceNumber = stream.rows[0].next_cycle_sequence - 1;
  const cycle = await tx.query<CycleDbRow>(
    `INSERT INTO loyalty_cycles
       (business_id, customer_identity_id, reward_program_id, opened_under_version_id,
        sequence_number, state, allocated_units, correlation_id)
     VALUES ($1,$2,$3,$4,$5,'active',0,$6)
     RETURNING *`,
    [
      params.businessId,
      params.customerIdentityId,
      params.rewardProgramId,
      params.openedUnderVersionId,
      sequenceNumber,
      params.correlationId,
    ],
  );
  return mapCycleRow(cycle.rows[0]);
}

/** Adds allocated units to the locked Cycle; the 0–10 CHECK backstops overfill. */
export async function addAllocatedUnitsToCycle(
  tx: PlatformPostgresTransaction,
  params: { readonly cycleId: string; readonly units: number },
): Promise<LoyaltyCycleRow> {
  const result = await tx.query<CycleDbRow>(
    `UPDATE loyalty_cycles SET allocated_units = allocated_units + $2, updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [params.cycleId, params.units],
  );
  return mapCycleRow(result.rows[0]);
}

/** Flips the locked Cycle to `reward_available` at exactly the threshold. */
export async function markCycleRewardAvailable(
  tx: PlatformPostgresTransaction,
  cycleId: string,
): Promise<LoyaltyCycleRow> {
  const result = await tx.query<CycleDbRow>(
    `UPDATE loyalty_cycles SET state = 'reward_available', updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [cycleId],
  );
  return mapCycleRow(result.rows[0]);
}

export async function getCycleById(
  db: Queryable,
  cycleId: string,
): Promise<LoyaltyCycleRow | null> {
  const result = await db.query<CycleDbRow>(`SELECT * FROM loyalty_cycles WHERE id = $1`, [
    cycleId,
  ]);
  if (result.rows.length === 0) {
    return null;
  }
  return mapCycleRow(result.rows[0]);
}

export async function listCyclesForCustomerProgram(
  db: Queryable,
  params: { readonly customerIdentityId: string; readonly rewardProgramId: string },
): Promise<LoyaltyCycleRow[]> {
  const result = await db.query<CycleDbRow>(
    `SELECT * FROM loyalty_cycles
      WHERE customer_identity_id = $1 AND reward_program_id = $2
      ORDER BY sequence_number DESC`,
    [params.customerIdentityId, params.rewardProgramId],
  );
  return result.rows.map(mapCycleRow);
}

type PositionDbRow = {
  id: string;
  verified_unit_id: string;
  loyalty_cycle_id: string | null;
  business_id: string;
  customer_identity_id: string;
  reward_program_id: string;
  reward_program_version_id: string;
  allocated_quantity: number;
  allocation_order: number;
  state: "allocated" | "pending";
  created_at: Date;
  updated_at: Date;
};

function mapPositionRow(row: PositionDbRow): AllocationPositionRow {
  return {
    id: row.id,
    verifiedUnitId: row.verified_unit_id,
    loyaltyCycleId: row.loyalty_cycle_id,
    businessId: row.business_id,
    customerIdentityId: row.customer_identity_id,
    rewardProgramId: row.reward_program_id,
    rewardProgramVersionId: row.reward_program_version_id,
    allocatedQuantity: row.allocated_quantity,
    allocationOrder: row.allocation_order,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type InsertAllocationPositionParams = {
  readonly verifiedUnitId: string;
  readonly loyaltyCycleId: string | null;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly allocatedQuantity: number;
  readonly allocationOrder: number;
  readonly state: "allocated" | "pending";
};

export async function insertAllocationPosition(
  tx: PlatformPostgresTransaction,
  params: InsertAllocationPositionParams,
): Promise<AllocationPositionRow> {
  const result = await tx.query<PositionDbRow>(
    `INSERT INTO verified_unit_allocations
       (verified_unit_id, loyalty_cycle_id, business_id, customer_identity_id,
        reward_program_id, reward_program_version_id, allocated_quantity, allocation_order, state)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      params.verifiedUnitId,
      params.loyaltyCycleId,
      params.businessId,
      params.customerIdentityId,
      params.rewardProgramId,
      params.rewardProgramVersionId,
      params.allocatedQuantity,
      params.allocationOrder,
      params.state,
    ],
  );
  return mapPositionRow(result.rows[0]);
}

export async function listAllocationPositionsForUnit(
  db: Queryable,
  verifiedUnitId: string,
): Promise<AllocationPositionRow[]> {
  const result = await db.query<PositionDbRow>(
    `SELECT * FROM verified_unit_allocations WHERE verified_unit_id = $1 ORDER BY allocation_order ASC`,
    [verifiedUnitId],
  );
  return result.rows.map(mapPositionRow);
}

export async function sumAllocatedPositionsForCycle(
  db: Queryable,
  cycleId: string,
): Promise<number> {
  const result = await db.query<{ total: string }>(
    `SELECT COALESCE(SUM(allocated_quantity), 0) AS total
       FROM verified_unit_allocations
      WHERE loyalty_cycle_id = $1 AND state = 'allocated'`,
    [cycleId],
  );
  return Number(result.rows[0].total);
}

type AllocationEventDbRow = {
  id: string;
  allocation_position_id: string;
  verified_unit_id: string;
  from_state: "none" | "pending" | "allocated";
  to_state: "pending" | "allocated" | "reversed";
  from_cycle_id: string | null;
  to_cycle_id: string | null;
  quantity: number;
  reason: "initial_placement" | "pending_to_allocated" | "correction_adjustment";
  correlation_id: string;
  occurred_at: Date;
  schema_version: number;
};

function mapAllocationEventRow(row: AllocationEventDbRow): AllocationEventRow {
  return {
    id: row.id,
    allocationPositionId: row.allocation_position_id,
    verifiedUnitId: row.verified_unit_id,
    fromState: row.from_state,
    toState: row.to_state,
    fromCycleId: row.from_cycle_id,
    toCycleId: row.to_cycle_id,
    quantity: row.quantity,
    reason: row.reason,
    correlationId: row.correlation_id,
    occurredAt: row.occurred_at,
    schemaVersion: row.schema_version,
  };
}

export async function appendAllocationEvent(
  tx: PlatformPostgresTransaction,
  params: {
    readonly allocationPositionId: string;
    readonly verifiedUnitId: string;
    readonly fromState: "none" | "pending" | "allocated";
    readonly toState: "pending" | "allocated" | "reversed";
    readonly fromCycleId: string | null;
    readonly toCycleId: string | null;
    readonly quantity: number;
    readonly reason: "initial_placement" | "pending_to_allocated" | "correction_adjustment";
    readonly correlationId: string;
  },
): Promise<AllocationEventRow> {
  const result = await tx.query<AllocationEventDbRow>(
    `INSERT INTO verified_unit_allocation_events
       (allocation_position_id, verified_unit_id, from_state, to_state,
        from_cycle_id, to_cycle_id, quantity, reason, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      params.allocationPositionId,
      params.verifiedUnitId,
      params.fromState,
      params.toState,
      params.fromCycleId,
      params.toCycleId,
      params.quantity,
      params.reason,
      params.correlationId,
    ],
  );
  return mapAllocationEventRow(result.rows[0]);
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
 * Creates the minimum Reward entitlement exactly once per qualifying Cycle
 * (`UNIQUE(loyalty_cycle_id)` backstop). Terms come from the Cycle's
 * governing version (`opened_under_version_id`), never program-current.
 */
export async function insertRewardForCycle(
  tx: PlatformPostgresTransaction,
  params: {
    readonly loyaltyCycleId: string;
    readonly businessId: string;
    readonly customerIdentityId: string;
    readonly rewardProgramId: string;
    readonly rewardProgramVersionId: string;
    readonly rewardDescription: string;
    readonly correlationId: string;
  },
): Promise<RewardRow> {
  const result = await tx.query<RewardDbRow>(
    `INSERT INTO rewards
       (loyalty_cycle_id, business_id, customer_identity_id, reward_program_id,
        reward_program_version_id, reward_description, reward_quantity, state, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,1,'available',$7)
     RETURNING *`,
    [
      params.loyaltyCycleId,
      params.businessId,
      params.customerIdentityId,
      params.rewardProgramId,
      params.rewardProgramVersionId,
      params.rewardDescription,
      params.correlationId,
    ],
  );
  return mapRewardRow(result.rows[0]);
}

export async function listAvailableRewardsForCustomer(
  db: Queryable,
  customerIdentityId: string,
): Promise<RewardRow[]> {
  const result = await db.query<RewardDbRow>(
    `SELECT * FROM rewards
      WHERE customer_identity_id = $1 AND state = 'available'
      ORDER BY available_at DESC, id DESC`,
    [customerIdentityId],
  );
  return result.rows.map(mapRewardRow);
}
