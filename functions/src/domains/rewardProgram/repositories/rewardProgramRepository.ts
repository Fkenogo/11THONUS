/**
 * Reward Program PostgreSQL repository (`PLATFORM-BASELINE-005A`).
 *
 * Every function here receives either a `PlatformPostgresTransaction`
 * (write paths, always inside `withPlatformTransaction`) or the
 * `PlatformPostgresPool` (read-only paths) -- never opens its own
 * connection/transaction, matching `postgresTransaction.ts`'s own
 * documented seam. No domain-service file above this layer imports `pg`
 * directly.
 *
 * Qualification binding (`PLATFORM-BASELINE-013B`, `DEC-LOY-016`): a
 * version's qualification is its rows in
 * `reward_program_version_qualifying_items`, keyed by stable
 * Business-owned `qualifying_item_id` with frozen display snapshots. The
 * superseded `reward_program_version_qualifying_nodes` table is retained
 * but NEVER read or written here -- dropping it is deferred to the
 * environment-gated `PLATFORM-BASELINE-013E` migration. There is exactly
 * one qualification authority, not two.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  QualifyingItemRef,
  RewardProgramRow,
  RewardProgramStatus,
  RewardProgramVersionDraftInput,
  RewardProgramVersionRow,
  RewardProgramVersionStatus,
  RewardProgramWithVersions,
} from "../models/rewardProgram";

type Queryable = PoolClient | PlatformPostgresPool;

type ProgramDbRow = {
  id: string;
  business_id: string;
  display_name: string;
  reward_program_category_id: string | null;
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
  qualifyingItems: readonly QualifyingItemRef[],
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
    qualifyingItems,
  };
}

/**
 * Reads a version's qualification from the authoritative junction
 * (`reward_program_version_qualifying_items`), in a stable order. Returns
 * the FROZEN snapshots -- never the live `qualifying_items` row -- so a
 * published version reproduces verbatim after a rename, remap, or
 * retirement. The legacy `reward_program_version_qualifying_nodes` table
 * is deliberately never consulted.
 */
async function fetchQualifyingItems(
  db: Queryable,
  versionId: string,
): Promise<QualifyingItemRef[]> {
  const result = await db.query<{
    qualifying_item_id: string;
    item_name_at_version: string;
    knowledge_node_id_at_version: string | null;
  }>(
    `SELECT qualifying_item_id, item_name_at_version, knowledge_node_id_at_version
       FROM reward_program_version_qualifying_items
      WHERE reward_program_version_id = $1
      ORDER BY item_name_at_version, qualifying_item_id`,
    [versionId],
  );
  return result.rows.map((r) => ({
    qualifyingItemId: r.qualifying_item_id,
    itemNameAtVersion: r.item_name_at_version,
    knowledgeNodeIdAtVersion: r.knowledge_node_id_at_version,
  }));
}

/**
 * Replaces a version's qualification rows wholesale with already-resolved
 * frozen snapshots (the caller -- always a command -- resolved each id
 * server-side via `resolveQualifyingItemSnapshots`). Simplest correct
 * semantics for a mutable draft: no partial-diff merge logic.
 */
async function insertQualifyingItems(
  tx: PlatformPostgresTransaction,
  versionId: string,
  items: readonly QualifyingItemRef[],
): Promise<void> {
  for (const item of items) {
    await tx.query(
      `INSERT INTO reward_program_version_qualifying_items
         (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
       VALUES ($1, $2, $3, $4)`,
      [versionId, item.qualifyingItemId, item.itemNameAtVersion, item.knowledgeNodeIdAtVersion],
    );
  }
}

export type CreateRewardProgramParams = {
  readonly businessId: string;
  readonly displayName: string;
  readonly rewardProgramCategoryId: string | null;
  readonly actorId: string;
  readonly draft: RewardProgramVersionDraftInput;
  readonly requiredVerifiedUnits: number;
  readonly rewardQuantity: number;
  /**
   * Already-resolved frozen snapshots for `draft.qualifyingItemIds`
   * (`PLATFORM-BASELINE-013B`): the command validated each id and resolved
   * its current name/classification server-side before opening this
   * transaction. The repository stores them verbatim -- it never resolves
   * an id itself.
   */
  readonly qualifyingItems: readonly QualifyingItemRef[];
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
  await insertQualifyingItems(tx, versionResult.rows[0].id, params.qualifyingItems);

  const version = mapVersionRow(versionResult.rows[0], params.qualifyingItems);
  return { program, version };
}

export async function getRewardProgramById(
  db: Queryable,
  programId: string,
): Promise<RewardProgramWithVersions | null> {
  const programResult = await db.query<ProgramDbRow>(
    `SELECT * FROM reward_programs WHERE id = $1`,
    [programId],
  );
  if (programResult.rows.length === 0) {
    return null;
  }
  const program = mapProgramRow(programResult.rows[0]);
  const currentVersion = program.currentVersionId
    ? await getVersionById(db, program.currentVersionId)
    : null;
  const draftVersion = await getEditableDraftVersion(db, program.id);
  return { program, currentVersion, draftVersion };
}

/**
 * The program's ONE editable draft (`PLATFORM-BASELINE-005A-CORR-001`
 * Finding 1): the latest version, but only while it is still a draft --
 * never an arbitrary historical draft. The database additionally enforces
 * at most one draft per program (partial unique index), so a draft here
 * is always the program's single editable one. Returns `null` both when
 * the program has no versions at all and when its latest version is
 * published/superseded.
 */
async function getEditableDraftVersion(
  db: Queryable,
  programId: string,
): Promise<RewardProgramVersionRow | null> {
  const latest = await getLatestVersionForProgram(db, programId);
  return latest !== null && latest.status === "draft" ? latest : null;
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
  const qualifyingItems = await fetchQualifyingItems(db, versionId);
  return mapVersionRow(result.rows[0], qualifyingItems);
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
  const qualifyingItems = await fetchQualifyingItems(tx, versionId);
  return mapVersionRow(result.rows[0], qualifyingItems);
}

export type UpdateDraftParams = {
  readonly versionId: string;
  readonly expectedRowVersion: number;
  readonly draft: RewardProgramVersionDraftInput;
  /** Already-resolved frozen snapshots for `draft.qualifyingItemIds` -- stored verbatim. */
  readonly qualifyingItems: readonly QualifyingItemRef[];
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
  // Qualification rows are replaced wholesale on every draft edit
  // (simplest correct semantics for a mutable draft -- no partial-diff
  // merge logic).
  await tx.query(
    `DELETE FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1`,
    [params.versionId],
  );
  await insertQualifyingItems(tx, params.versionId, params.qualifyingItems);
  const qualifyingItems = await fetchQualifyingItems(tx, params.versionId);
  return mapVersionRow(result.rows[0], qualifyingItems);
}

/** Publishes a draft version: draft -> active, supersedes the prior active version, updates the program's current-version pointer. All in the caller's transaction. */
export async function publishVersion(
  tx: PlatformPostgresTransaction,
  params: {
    readonly programId: string;
    readonly versionId: string;
    readonly actorUpdatedBy: string;
    /**
     * Freshly re-resolved frozen snapshots for the draft's CURRENT bindings
     * (`PLATFORM-BASELINE-013B`): the publish command re-validated every
     * bound item immediately before this transaction (RF-3 step 2), so the
     * published snapshot is taken at publish time, not at the earlier
     * draft-write time. Same membership, refreshed evidence.
     */
    readonly qualifyingItems: readonly QualifyingItemRef[];
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
  // Refresh the frozen qualification evidence at publish time: the
  // snapshot records what qualified AT PUBLICATION, so a rename/remap of
  // the live item between the last draft edit and publication is captured
  // here. Membership cannot change on this path (the publish command
  // re-validated exactly the draft's current bindings). Already-published
  // versions are never touched by this statement.
  await tx.query(
    `DELETE FROM reward_program_version_qualifying_items WHERE reward_program_version_id = $1`,
    [params.versionId],
  );
  await insertQualifyingItems(tx, params.versionId, params.qualifyingItems);
  // The program-level `shared_loyalty_number_allowed` column is the
  // approved current-value convenience projection (RF-2) -- it must track
  // the newly published version's authoritative snapshot in the SAME
  // transaction (`PLATFORM-BASELINE-005A-CORR-001` Finding 5), otherwise
  // the program row and its current version contradict each other after a
  // value-changing publication. Historical authority stays on the version
  // row; this write only refreshes the projection.
  await tx.query(
    `UPDATE reward_programs
        SET current_version_id = $1,
            status = 'active',
            shared_loyalty_number_allowed = $2,
            updated_at = now(),
            updated_by = $3
      WHERE id = $4`,
    [
      params.versionId,
      publishResult.rows[0].shared_loyalty_number_allowed,
      params.actorUpdatedBy,
      params.programId,
    ],
  );
  const qualifyingItems = await fetchQualifyingItems(tx, params.versionId);
  return mapVersionRow(publishResult.rows[0], qualifyingItems);
}

/** Creates version N+1 as a new draft, seeded from the current version's snapshot. Does not mutate the current version. */
export async function insertNextDraftVersion(
  tx: PlatformPostgresTransaction,
  params: {
    readonly programId: string;
    readonly baseVersion: RewardProgramVersionRow;
    readonly actorId: string;
    readonly draft: RewardProgramVersionDraftInput;
    /** Already-resolved frozen snapshots for `draft.qualifyingItemIds` -- stored verbatim. */
    readonly qualifyingItems: readonly QualifyingItemRef[];
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
  await insertQualifyingItems(tx, versionResult.rows[0].id, params.qualifyingItems);
  return mapVersionRow(versionResult.rows[0], params.qualifyingItems);
}

export async function listRewardProgramsForBusiness(
  db: Queryable,
  businessId: string,
): Promise<RewardProgramWithVersions[]> {
  const result = await db.query<ProgramDbRow>(
    `SELECT * FROM reward_programs WHERE business_id = $1 ORDER BY created_at DESC`,
    [businessId],
  );
  const programs = result.rows.map(mapProgramRow);
  const withVersions: RewardProgramWithVersions[] = [];
  for (const program of programs) {
    const currentVersion = program.currentVersionId
      ? await getVersionById(db, program.currentVersionId)
      : null;
    const draftVersion = await getEditableDraftVersion(db, program.id);
    withVersions.push({ program, currentVersion, draftVersion });
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
  const qualifyingItems = await fetchQualifyingItems(db, result.rows[0].id);
  return mapVersionRow(result.rows[0], qualifyingItems);
}
