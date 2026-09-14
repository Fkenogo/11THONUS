/**
 * Locked Reward Program / Version reads for `recordPurchase`
 * (`PLATFORM-BASELINE-006A`, design §§12/18).
 *
 * Program/version eligibility that CAN be authoritative inside PostgreSQL
 * EXECUTES inside the creation transaction: the program row and its current
 * version row are locked (`SELECT … FOR UPDATE`) and proven (same Business
 * via the composite-FK backstop, program `active`, locked version id ==
 * program `current_version_id`, version `active`) before any quantity,
 * shared-policy, or insert step. A PostgreSQL read→commit race is never
 * accepted as if it were a cross-store race.
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";

export type LockedRewardProgram = {
  readonly id: string;
  readonly businessId: string;
  readonly status: string;
  readonly currentVersionId: string | null;
};

export async function lockRewardProgramById(
  tx: PlatformPostgresTransaction,
  programId: string,
): Promise<LockedRewardProgram | null> {
  const result = await tx.query<{
    id: string;
    business_id: string;
    status: string;
    current_version_id: string | null;
  }>(
    `SELECT id, business_id, status, current_version_id FROM reward_programs WHERE id = $1 FOR UPDATE`,
    [programId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row.id,
    businessId: row.business_id,
    status: row.status,
    currentVersionId: row.current_version_id,
  };
}

export type LockedRewardProgramVersion = {
  readonly id: string;
  readonly rewardProgramId: string;
  readonly status: string;
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly multipleUnitsAllowed: boolean;
  readonly rewardDescription: string;
  readonly requiredVerifiedUnits: number;
  readonly rewardQuantity: number;
};

export async function lockRewardProgramVersionById(
  tx: PlatformPostgresTransaction,
  versionId: string,
): Promise<LockedRewardProgramVersion | null> {
  const result = await tx.query<{
    id: string;
    reward_program_id: string;
    status: string;
    shared_loyalty_number_allowed: boolean;
    multiple_units_allowed: boolean;
    reward_description: string;
    required_verified_units: number;
    reward_quantity: number;
  }>(
    `SELECT id, reward_program_id, status, shared_loyalty_number_allowed,
            multiple_units_allowed, reward_description, required_verified_units, reward_quantity
       FROM reward_program_versions WHERE id = $1 FOR UPDATE`,
    [versionId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row.id,
    rewardProgramId: row.reward_program_id,
    status: row.status,
    sharedLoyaltyNumberAllowed: row.shared_loyalty_number_allowed,
    multipleUnitsAllowed: row.multiple_units_allowed,
    rewardDescription: row.reward_description,
    requiredVerifiedUnits: row.required_verified_units,
    rewardQuantity: row.reward_quantity,
  };
}

/**
 * Non-locking read of a version's reward terms for Reward creation and
 * version-delta logging. Published versions are immutable (005A: only
 * drafts are editable, publication only flips status), so no lock is
 * needed — and taking one would violate the verify transaction's global
 * lock ordering (idempotency → purchase → stream → cycle → reward).
 */
export async function readVersionRewardTerms(
  tx: PlatformPostgresTransaction,
  versionId: string,
): Promise<{ readonly rewardDescription: string } | null> {
  const result = await tx.query<{ reward_description: string }>(
    `SELECT reward_description FROM reward_program_versions WHERE id = $1`,
    [versionId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return { rewardDescription: result.rows[0].reward_description };
}

/** Non-locking read of the program's current version pointer (version-delta traceability note only). */
export async function readProgramCurrentVersionId(
  tx: PlatformPostgresTransaction,
  programId: string,
): Promise<string | null> {
  const result = await tx.query<{ current_version_id: string | null }>(
    `SELECT current_version_id FROM reward_programs WHERE id = $1`,
    [programId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0].current_version_id;
}
