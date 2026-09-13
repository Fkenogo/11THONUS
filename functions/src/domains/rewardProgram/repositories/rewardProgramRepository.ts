/**
 * Reward Program PostgreSQL repository (`PLATFORM-BASELINE-005A`).
 *
 * Every function here receives either a `PlatformPostgresTransaction`
 * (write paths, always inside `withPlatformTransaction`) or the
 * `PlatformPostgresPool` (read-only paths) -- never opens its own
 * connection/transaction, matching `postgresTransaction.ts`'s own
 * documented seam. No domain-service file above this layer imports `pg`
 * directly.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  QualifyingNode,
  RewardProgramRow,
  RewardProgramStatus,
  RewardProgramVersionDraftInput,
  RewardProgramVersionRow,
  RewardProgramVersionStatus,
  RewardProgramWithCurrentVersion,
} from "../models/rewardProgram";

type Queryable = PoolClient | PlatformPostgresPool;

type ProgramDbRow = {
  id: string;
  business_id: string;
  display_name: string;
  reward_program_category_id: string;
  shared_loyalty_number_allowed: boolean;
  status: RewardProgramStatus;
  current_version_id: string | null;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  schema_version: number;
};

function mapProgramRow(row: ProgramDbRow): RewardProgramRow {
  return {
    id: row.id,
    businessId: row.business_id,
    displayName: row.display_name,
    rewardProgramCategoryId: row.reward_program_category_id,
    sharedLoyaltyNumberAllowed: row.shared_loyalty_number_allowed,
    status: row.status,
    currentVersionId: row.current_version_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    schemaVersion: row.schema_version,
  };
}

type VersionDbRow = {
  id: string;
  reward_program_id: string;
  version: number;
  required_verified_units: number;
  reward_quantity: number;
  shared_loyalty_number_allowed: boolean;
  reward_description: string;
  standard_reward_node_id: string | null;
  multiple_units_allowed: boolean;
  bulk_review_threshold: number | null;
  effective_from: Date;
  effective_until: Date | null;
  status: RewardProgramVersionStatus;
  created_at: Date;
  created_by: string;
  approved_at: Date | null;
  updated_at: Date;
  row_version: number;
  schema_version: number;
};

function mapVersionRow(
  row: VersionDbRow,
  qualifyingNodes: readonly QualifyingNode[],
): RewardProgramVersionRow {
  return {
    id: row.id,
    rewardProgramId: row.reward_program_id,
    version: row.version,
    requiredVerifiedUnits: row.required_verified_units,
    rewardQuantity: row.reward_quantity,
    sharedLoyaltyNumberAllowed: row.shared_loyalty_number_allowed,
    rewardDescription: row.reward_description,
    standardRewardNodeId: row.standard_reward_node_id,
    multipleUnitsAllowed: row.multiple_units_allowed,
    bulkReviewThreshold: row.bulk_review_threshold,
    effectiveFrom: row.effective_from,
    effectiveUntil: row.effective_until,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
    approvedAt: row.approved_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
    schemaVersion: row.schema_version,
    qualifyingNodes,
  };
}

async function fetchQualifyingNodes(db: Queryable, versionId: string): Promise<QualifyingNode[]> {
  const result = await db.query<{
    knowledge_node_id: string;
    business_display_name: string | null;
  }>(
    `SELECT knowledge_node_id, business_display_name
       FROM reward_program_version_qualifying_nodes
      WHERE reward_program_version_id = $1
      ORDER BY knowledge_node_id`,
    [versionId],
  );
  return result.rows.map((r) => ({
    knowledgeNodeId: r.knowledge_node_id,
    businessDisplayName: r.business_display_name,
  }));
}

async function insertQualifyingNodes(
  tx: PlatformPostgresTransaction,
  versionId: string,
  nodes: readonly QualifyingNode[],
): Promise<void> {
  for (const node of nodes) {
    await tx.query(
      `INSERT INTO reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id, business_display_name)
       VALUES ($1, $2, $3)`,
      [versionId, node.knowledgeNodeId, node.businessDisplayName],
    );
  }
}

export type CreateRewardProgramParams = {
  readonly businessId: string;
  readonly displayName: string;
  readonly rewardProgramCategoryId: string;
  readonly actorId: string;
  readonly draft: RewardProgramVersionDraftInput;
  readonly requiredVerifiedUnits: number;
  readonly rewardQuantity: number;
};

/** Creates the program row and its version-1 draft in one transaction. Does not publish. */
export async function insertRewardProgramWithFirstDraft(
  tx: PlatformPostgresTransaction,
  params: CreateRewardProgramParams,
): Promise<{ program: RewardProgramRow; version: RewardProgramVersionRow }> {
  const programResult = await tx.query<ProgramDbRow>(
    `INSERT INTO reward_programs
       (business_id, display_name, reward_program_category_id, shared_loyalty_number_allowed, status, created_by, updated_by)
     VALUES ($1, $2, $3, $4, 'draft', $5, $5)
     RETURNING *`,
    [
      params.businessId,
      params.displayName,
      params.rewardProgramCategoryId,
      params.draft.sharedLoyaltyNumberAllowed,
      params.actorId,
    ],
  );
  const program = mapProgramRow(programResult.rows[0]);

  const versionResult = await tx.query<VersionDbRow>(
    `INSERT INTO reward_program_versions
       (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed,
        reward_description, standard_reward_node_id, multiple_units_allowed, bulk_review_threshold,
        effective_from, effective_until, status, created_by)
     VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11)
     RETURNING *`,
    [
      program.id,
      params.requiredVerifiedUnits,
      params.rewardQuantity,
      params.draft.sharedLoyaltyNumberAllowed,
      params.draft.rewardDescription,
      params.draft.standardRewardNodeId ?? null,
      params.draft.multipleUnitsAllowed,
      params.draft.bulkReviewThreshold ?? null,
      params.draft.effectiveFrom,
      params.draft.effectiveUntil ?? null,
      params.actorId,
    ],
  );
  await insertQualifyingNodes(tx, versionResult.rows[0].id, params.draft.qualifyingNodes);

  const version = mapVersionRow(versionResult.rows[0], params.draft.qualifyingNodes);
  return { program, version };
}

export async function getRewardProgramById(
  db: Queryable,
  programId: string,
): Promise<RewardProgramWithCurrentVersion | null> {
  const programResult = await db.query<ProgramDbRow>(
    `SELECT * FROM reward_programs WHERE id = $1`,
    [programId],
  );
  if (programResult.rows.length === 0) {
    return null;
  }
  const program = mapProgramRow(programResult.rows[0]);
  if (!program.currentVersionId) {
    return { program, currentVersion: null };
  }
  const currentVersion = await getVersionById(db, program.currentVersionId);
  return { program, currentVersion };
}

export async function getVersionById(
  db: Queryable,
  versionId: string,
): Promise<RewardProgramVersionRow | null> {
  const result = await db.query<VersionDbRow>(
    `SELECT * FROM reward_program_versions WHERE id = $1`,
    [versionId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  const qualifyingNodes = await fetchQualifyingNodes(db, versionId);
  return mapVersionRow(result.rows[0], qualifyingNodes);
}

/** For update commands: locks the draft row (`SELECT ... FOR UPDATE`) inside the caller's transaction. */
export async function getDraftVersionForUpdate(
  tx: PlatformPostgresTransaction,
  versionId: string,
): Promise<RewardProgramVersionRow | null> {
  const result = await tx.query<VersionDbRow>(
    `SELECT * FROM reward_program_versions WHERE id = $1 FOR UPDATE`,
    [versionId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  const qualifyingNodes = await fetchQualifyingNodes(tx, versionId);
  return mapVersionRow(result.rows[0], qualifyingNodes);
}

export type UpdateDraftParams = {
  readonly versionId: string;
  readonly expectedRowVersion: number;
  readonly draft: RewardProgramVersionDraftInput;
};

/**
 * Updates a draft version's editable fields. Conditions the `UPDATE` on
 * `row_version` matching the caller's last-read value (Section 19
 * optimistic concurrency, an integer counter -- not a timestamp, which
 * would lose precision round-tripping through a JS `Date`) -- zero
 * affected rows means a concurrent edit landed first; the caller maps
 * that to a stale-draft conflict.
 */
export async function updateDraftVersion(
  tx: PlatformPostgresTransaction,
  params: UpdateDraftParams,
): Promise<RewardProgramVersionRow | null> {
  const result = await tx.query<VersionDbRow>(
    `UPDATE reward_program_versions
        SET reward_description = $1,
            standard_reward_node_id = $2,
            multiple_units_allowed = $3,
            shared_loyalty_number_allowed = $4,
            bulk_review_threshold = $5,
            effective_from = $6,
            effective_until = $7,
            updated_at = now(),
            row_version = row_version + 1
      WHERE id = $8
        AND status = 'draft'
        AND row_version = $9
      RETURNING *`,
    [
      params.draft.rewardDescription,
      params.draft.standardRewardNodeId ?? null,
      params.draft.multipleUnitsAllowed,
      params.draft.sharedLoyaltyNumberAllowed,
      params.draft.bulkReviewThreshold ?? null,
      params.draft.effectiveFrom,
      params.draft.effectiveUntil ?? null,
      params.versionId,
      params.expectedRowVersion,
    ],
  );
  if (result.rows.length === 0) {
    return null;
  }
  // Qualifying nodes are replaced wholesale on every draft edit (simplest
  // correct semantics for a mutable draft -- no partial-diff merge logic).
  await tx.query(
    `DELETE FROM reward_program_version_qualifying_nodes WHERE reward_program_version_id = $1`,
    [params.versionId],
  );
  await insertQualifyingNodes(tx, params.versionId, params.draft.qualifyingNodes);
  const qualifyingNodes = await fetchQualifyingNodes(tx, params.versionId);
  return mapVersionRow(result.rows[0], qualifyingNodes);
}

/** Publishes a draft version: draft -> active, supersedes the prior active version, updates the program's current-version pointer. All in the caller's transaction. */
export async function publishVersion(
  tx: PlatformPostgresTransaction,
  params: {
    readonly programId: string;
    readonly versionId: string;
    readonly actorUpdatedBy: string;
  },
): Promise<RewardProgramVersionRow> {
  await tx.query(
    `UPDATE reward_program_versions SET status = 'superseded' WHERE reward_program_id = $1 AND status = 'active'`,
    [params.programId],
  );
  const publishResult = await tx.query<VersionDbRow>(
    `UPDATE reward_program_versions
        SET status = 'active', approved_at = now(), updated_at = now()
      WHERE id = $1 AND status = 'draft'
      RETURNING *`,
    [params.versionId],
  );
  if (publishResult.rows.length === 0) {
    throw new Error(
      "publishVersion: draft version not found or already published (caller must pre-check).",
    );
  }
  await tx.query(
    `UPDATE reward_programs SET current_version_id = $1, status = 'active', updated_at = now(), updated_by = $2 WHERE id = $3`,
    [params.versionId, params.actorUpdatedBy, params.programId],
  );
  const qualifyingNodes = await fetchQualifyingNodes(tx, params.versionId);
  return mapVersionRow(publishResult.rows[0], qualifyingNodes);
}

/** Creates version N+1 as a new draft, seeded from the current version's snapshot. Does not mutate the current version. */
export async function insertNextDraftVersion(
  tx: PlatformPostgresTransaction,
  params: {
    readonly programId: string;
    readonly baseVersion: RewardProgramVersionRow;
    readonly actorId: string;
    readonly draft: RewardProgramVersionDraftInput;
  },
): Promise<RewardProgramVersionRow> {
  const nextVersionNumber = params.baseVersion.version + 1;
  const versionResult = await tx.query<VersionDbRow>(
    `INSERT INTO reward_program_versions
       (reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed,
        reward_description, standard_reward_node_id, multiple_units_allowed, bulk_review_threshold,
        effective_from, effective_until, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12)
     RETURNING *`,
    [
      params.programId,
      nextVersionNumber,
      params.baseVersion.requiredVerifiedUnits,
      params.baseVersion.rewardQuantity,
      params.draft.sharedLoyaltyNumberAllowed,
      params.draft.rewardDescription,
      params.draft.standardRewardNodeId ?? null,
      params.draft.multipleUnitsAllowed,
      params.draft.bulkReviewThreshold ?? null,
      params.draft.effectiveFrom,
      params.draft.effectiveUntil ?? null,
      params.actorId,
    ],
  );
  await insertQualifyingNodes(tx, versionResult.rows[0].id, params.draft.qualifyingNodes);
  return mapVersionRow(versionResult.rows[0], params.draft.qualifyingNodes);
}

export async function listRewardProgramsForBusiness(
  db: Queryable,
  businessId: string,
): Promise<RewardProgramWithCurrentVersion[]> {
  const result = await db.query<ProgramDbRow>(
    `SELECT * FROM reward_programs WHERE business_id = $1 ORDER BY created_at DESC`,
    [businessId],
  );
  const programs = result.rows.map(mapProgramRow);
  const withVersions: RewardProgramWithCurrentVersion[] = [];
  for (const program of programs) {
    const currentVersion = program.currentVersionId
      ? await getVersionById(db, program.currentVersionId)
      : null;
    withVersions.push({ program, currentVersion });
  }
  return withVersions;
}

/** Does this version belong to a draft that has no other draft siblings ahead of it (i.e. it is the program's latest version)? Used to reject creating a second simultaneous next-version draft. */
export async function getLatestVersionForProgram(
  db: Queryable,
  programId: string,
): Promise<RewardProgramVersionRow | null> {
  const result = await db.query<VersionDbRow>(
    `SELECT * FROM reward_program_versions WHERE reward_program_id = $1 ORDER BY version DESC LIMIT 1`,
    [programId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  const qualifyingNodes = await fetchQualifyingNodes(db, result.rows[0].id);
  return mapVersionRow(result.rows[0], qualifyingNodes);
}
