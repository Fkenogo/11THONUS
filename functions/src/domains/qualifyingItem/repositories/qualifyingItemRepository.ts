/**
 * Qualifying Item PostgreSQL repository (`PLATFORM-BASELINE-013A.2`).
 *
 * Every function here receives either a `PlatformPostgresTransaction`
 * (write paths, always inside `withPlatformTransaction`) or the
 * `PlatformPostgresPool` (read-only paths) -- never opens its own
 * connection/transaction, matching `rewardProgramRepository.ts` and
 * `postgresTransaction.ts`'s documented seam. No domain-service file above
 * this layer imports `pg` directly.
 *
 * BUSINESS OWNERSHIP IS STRUCTURAL. Every statement that addresses an item
 * by id also predicates on `business_id`; there is no repository function
 * that reads or writes an item by id alone. A caller acting for Business B
 * that supplies Business A's item id therefore matches zero rows -- the
 * result is indistinguishable from a fabricated id (`null`), so neither
 * mutation nor existence disclosure is possible across Businesses.
 *
 * LIFECYCLE IS RETIREMENT, NEVER DELETION. `active -> retired` is the only
 * transition; a retired row is terminal (`update`/`retire` require
 * `status = 'active'`). No delete function exists here: the historical
 * identity of an item that a published Reward Program version froze
 * (`reward_program_version_qualifying_items.qualifying_item_id`, `ON DELETE
 * RESTRICT`) must remain resolvable forever.
 *
 * Not implemented here, by design: Reward Program version binding
 * (`PLATFORM-BASELINE-013B`).
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { isWellFormedQualifyingItemId } from "../models/qualifyingItem";
import type { QualifyingItem, QualifyingItemStatus } from "../models/qualifyingItem";

type Queryable = PoolClient | PlatformPostgresPool;

type QualifyingItemDbRow = {
  id: string;
  business_id: string;
  name: string;
  knowledge_node_id: string | null;
  status: QualifyingItemStatus;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  schema_version: number;
};

function mapRow(row: QualifyingItemDbRow): QualifyingItem {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    knowledgeNodeId: row.knowledge_node_id,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    schemaVersion: row.schema_version,
  };
}

export type InsertQualifyingItemParams = {
  readonly businessId: string;
  readonly name: string;
  readonly knowledgeNodeId: string | null;
  readonly actorId: string;
};

/** Creates an `active` item. `name` must already be normalized/validated by the caller. */
export async function insertQualifyingItem(
  tx: PlatformPostgresTransaction,
  params: InsertQualifyingItemParams,
): Promise<QualifyingItem> {
  const result = await tx.query<QualifyingItemDbRow>(
    `INSERT INTO qualifying_items (business_id, name, knowledge_node_id, status, created_by, updated_by)
     VALUES ($1, $2, $3, 'active', $4, $4)
     RETURNING *`,
    [params.businessId, params.name, params.knowledgeNodeId, params.actorId],
  );
  return mapRow(result.rows[0]);
}

/** Reads one item, scoped to `businessId`. `null` for absent, foreign-Business, or malformed ids alike. */
export async function getQualifyingItem(
  db: Queryable,
  businessId: string,
  id: string,
): Promise<QualifyingItem | null> {
  if (!isWellFormedQualifyingItemId(id)) {
    return null;
  }
  const result = await db.query<QualifyingItemDbRow>(
    `SELECT * FROM qualifying_items WHERE id = $1 AND business_id = $2`,
    [id, businessId],
  );
  return result.rows.length === 0 ? null : mapRow(result.rows[0]);
}

export type QualifyingItemStatusFilter = QualifyingItemStatus | "all";

/** Lists a Business's items in a deterministic order (case-insensitive name, then id). */
export async function listQualifyingItems(
  db: Queryable,
  businessId: string,
  statusFilter: QualifyingItemStatusFilter,
): Promise<QualifyingItem[]> {
  const result = await db.query<QualifyingItemDbRow>(
    `SELECT * FROM qualifying_items
      WHERE business_id = $1
        AND ($2 = 'all' OR status = $2)
      ORDER BY lower(name), id`,
    [businessId, statusFilter],
  );
  return result.rows.map(mapRow);
}

export type UpdateQualifyingItemParams = {
  readonly businessId: string;
  readonly id: string;
  readonly actorId: string;
  /** `undefined` leaves the name unchanged. */
  readonly name?: string;
  /** `undefined` leaves the classification unchanged; `null` clears it. */
  readonly knowledgeNodeId?: string | null;
};

/**
 * Renames and/or reclassifies an `active` item owned by `businessId`.
 * Returns `null` when no such active row exists for that Business (absent,
 * foreign, malformed, or retired) -- the caller distinguishes nothing more,
 * by design. Locks the row implicitly for the duration of the caller's
 * transaction.
 */
export async function updateQualifyingItem(
  tx: PlatformPostgresTransaction,
  params: UpdateQualifyingItemParams,
): Promise<QualifyingItem | null> {
  if (!isWellFormedQualifyingItemId(params.id)) {
    return null;
  }
  const setClassification = params.knowledgeNodeId !== undefined;
  const result = await tx.query<QualifyingItemDbRow>(
    `UPDATE qualifying_items
        SET name = COALESCE($3::text, name),
            knowledge_node_id = CASE WHEN $4::boolean THEN $5::text ELSE knowledge_node_id END,
            updated_at = now(),
            updated_by = $6
      WHERE id = $1
        AND business_id = $2
        AND status = 'active'
      RETURNING *`,
    [
      params.id,
      params.businessId,
      params.name ?? null,
      setClassification,
      setClassification ? (params.knowledgeNodeId ?? null) : null,
      params.actorId,
    ],
  );
  return result.rows.length === 0 ? null : mapRow(result.rows[0]);
}

export type RetireQualifyingItemParams = {
  readonly businessId: string;
  readonly id: string;
  readonly actorId: string;
};

/**
 * `active -> retired` for an item owned by `businessId`. The row is
 * preserved (no delete); returns `null` when no such active row exists for
 * that Business (absent, foreign, malformed, or already retired).
 */
export async function retireQualifyingItem(
  tx: PlatformPostgresTransaction,
  params: RetireQualifyingItemParams,
): Promise<QualifyingItem | null> {
  if (!isWellFormedQualifyingItemId(params.id)) {
    return null;
  }
  const result = await tx.query<QualifyingItemDbRow>(
    `UPDATE qualifying_items
        SET status = 'retired',
            updated_at = now(),
            updated_by = $3
      WHERE id = $1
        AND business_id = $2
        AND status = 'active'
      RETURNING *`,
    [params.id, params.businessId, params.actorId],
  );
  return result.rows.length === 0 ? null : mapRow(result.rows[0]);
}
