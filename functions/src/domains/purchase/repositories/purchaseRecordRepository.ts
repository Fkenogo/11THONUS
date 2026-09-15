/**
 * Purchase Record PostgreSQL repository (`PLATFORM-BASELINE-006A`).
 *
 * Same seam as `rewardProgramRepository.ts`: every function receives either
 * a `PlatformPostgresTransaction` (write paths, always inside
 * `withPlatformTransaction`) or a `Queryable` pool/client (read-only paths)
 * — never opens its own connection/transaction, and no service file above
 * this layer imports `pg` directly.
 *
 * Snapshot columns are insert-only by command-layer convention (TRD10
 * §10.10.1 Immutability Rule); only `status`/verdict columns transition,
 * and only through the conditional-transition helpers below, which encode
 * the 006A command allow-list (`waiting_for_customer` → `verified` |
 * `rejected` | `under_review`) as `UPDATE … WHERE status = …` — the 005A
 * `publishVersion` precedent. Zero affected rows means a concurrent command
 * won the race; callers map that to a stale-state error, never a partial
 * write.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  PresentedArtifactType,
  PurchaseActorType,
  PurchaseDisputeReason,
  PurchaseRecordEventRow,
  PurchaseRecordRow,
  PurchaseRejectReason,
  PurchaseStatus,
  RecorderRole,
} from "../models/purchase";

type Queryable = PoolClient | PlatformPostgresPool;

type PurchaseDbRow = {
  id: string;
  business_id: string;
  customer_identity_id: string;
  presented_artifact_type: PresentedArtifactType;
  presented_artifact_reference: string;
  canonical_loyalty_number_value: string;
  reward_program_id: string;
  reward_program_version_id: string;
  shared_loyalty_number_allowed: boolean;
  multiple_units_allowed: boolean;
  branch_id: string;
  recorded_by_user_id: string;
  recorded_by_role: RecorderRole;
  quantity: number;
  item_label: string;
  knowledge_node_id: string | null;
  unit_value_minor: number | null;
  currency: string | null;
  purchase_date: Date;
  notes: string | null;
  status: PurchaseStatus;
  verified_at: Date | null;
  rejection_reason: PurchaseRejectReason | null;
  dispute_reason: PurchaseDisputeReason | null;
  replaces_purchase_record_id: string | null;
  correlation_id: string;
  created_at: Date;
  updated_at: Date;
  schema_version: number;
};

function mapPurchaseRow(row: PurchaseDbRow): PurchaseRecordRow {
  return {
    id: row.id,
    businessId: row.business_id,
    customerIdentityId: row.customer_identity_id,
    presentedArtifactType: row.presented_artifact_type,
    presentedArtifactReference: row.presented_artifact_reference,
    canonicalLoyaltyNumberValue: row.canonical_loyalty_number_value,
    rewardProgramId: row.reward_program_id,
    rewardProgramVersionId: row.reward_program_version_id,
    sharedLoyaltyNumberAllowed: row.shared_loyalty_number_allowed,
    multipleUnitsAllowed: row.multiple_units_allowed,
    branchId: row.branch_id,
    recordedByUserId: row.recorded_by_user_id,
    recordedByRole: row.recorded_by_role,
    quantity: row.quantity,
    itemLabel: row.item_label,
    knowledgeNodeId: row.knowledge_node_id,
    unitValueMinor: row.unit_value_minor,
    currency: row.currency,
    purchaseDate: row.purchase_date,
    notes: row.notes,
    status: row.status,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason,
    disputeReason: row.dispute_reason,
    replacesPurchaseRecordId: row.replaces_purchase_record_id,
    correlationId: row.correlation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
  };
}

export type InsertPurchaseRecordParams = {
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly presentedArtifactType: PresentedArtifactType;
  readonly presentedArtifactReference: string;
  readonly canonicalLoyaltyNumberValue: string;
  readonly rewardProgramId: string;
  readonly rewardProgramVersionId: string;
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly multipleUnitsAllowed: boolean;
  readonly branchId: string;
  readonly recordedByUserId: string;
  readonly recordedByRole: RecorderRole;
  readonly quantity: number;
  readonly itemLabel: string;
  readonly knowledgeNodeId: string | null;
  readonly unitValueMinor: number | null;
  readonly currency: string | null;
  readonly purchaseDate: Date;
  readonly notes: string | null;
  readonly correlationId: string;
};

/** Inserts the Purchase snapshot directly in `waiting_for_customer` (design §12: no stored draft). */
export async function insertPurchaseRecord(
  tx: PlatformPostgresTransaction,
  params: InsertPurchaseRecordParams,
): Promise<PurchaseRecordRow> {
  const result = await tx.query<PurchaseDbRow>(
    `INSERT INTO purchase_records
       (business_id, customer_identity_id, presented_artifact_type, presented_artifact_reference,
        canonical_loyalty_number_value, reward_program_id, reward_program_version_id,
        shared_loyalty_number_allowed, multiple_units_allowed, branch_id,
        recorded_by_user_id, recorded_by_role, quantity, item_label, knowledge_node_id,
        unit_value_minor, currency, purchase_date, notes, status, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'waiting_for_customer',$20)
     RETURNING *`,
    [
      params.businessId,
      params.customerIdentityId,
      params.presentedArtifactType,
      params.presentedArtifactReference,
      params.canonicalLoyaltyNumberValue,
      params.rewardProgramId,
      params.rewardProgramVersionId,
      params.sharedLoyaltyNumberAllowed,
      params.multipleUnitsAllowed,
      params.branchId,
      params.recordedByUserId,
      params.recordedByRole,
      params.quantity,
      params.itemLabel,
      params.knowledgeNodeId,
      params.unitValueMinor,
      params.currency,
      params.purchaseDate,
      params.notes,
      params.correlationId,
    ],
  );
  return mapPurchaseRow(result.rows[0]);
}

export async function getPurchaseRecordById(
  db: Queryable,
  purchaseId: string,
): Promise<PurchaseRecordRow | null> {
  const result = await db.query<PurchaseDbRow>(`SELECT * FROM purchase_records WHERE id = $1`, [
    purchaseId,
  ]);
  if (result.rows.length === 0) {
    return null;
  }
  return mapPurchaseRow(result.rows[0]);
}

/** Row lock for the verify/reject/dispute commands (global lock ordering: after idempotency, before stream). */
export async function lockPurchaseRecordById(
  tx: PlatformPostgresTransaction,
  purchaseId: string,
): Promise<PurchaseRecordRow | null> {
  const result = await tx.query<PurchaseDbRow>(
    `SELECT * FROM purchase_records WHERE id = $1 FOR UPDATE`,
    [purchaseId],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapPurchaseRow(result.rows[0]);
}

/** `waiting_for_customer` → `verified`. Returns null when the row is not in the expected source state (race loser). */
export async function transitionPurchaseToVerified(
  tx: PlatformPostgresTransaction,
  params: { readonly purchaseId: string; readonly verifiedAt: Date },
): Promise<PurchaseRecordRow | null> {
  const result = await tx.query<PurchaseDbRow>(
    `UPDATE purchase_records
        SET status = 'verified', verified_at = $2, updated_at = now()
      WHERE id = $1 AND status = 'waiting_for_customer'
      RETURNING *`,
    [params.purchaseId, params.verifiedAt],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapPurchaseRow(result.rows[0]);
}

/** `waiting_for_customer` → `rejected` with a mandatory bounded reason. */
export async function transitionPurchaseToRejected(
  tx: PlatformPostgresTransaction,
  params: { readonly purchaseId: string; readonly reason: PurchaseRejectReason },
): Promise<PurchaseRecordRow | null> {
  const result = await tx.query<PurchaseDbRow>(
    `UPDATE purchase_records
        SET status = 'rejected', rejection_reason = $2, updated_at = now()
      WHERE id = $1 AND status = 'waiting_for_customer'
      RETURNING *`,
    [params.purchaseId, params.reason],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapPurchaseRow(result.rows[0]);
}

/** `waiting_for_customer` → `under_review` with a mandatory dispute reason. */
export async function transitionPurchaseToUnderReview(
  tx: PlatformPostgresTransaction,
  params: { readonly purchaseId: string; readonly reason: PurchaseDisputeReason },
): Promise<PurchaseRecordRow | null> {
  const result = await tx.query<PurchaseDbRow>(
    `UPDATE purchase_records
        SET status = 'under_review', dispute_reason = $2, updated_at = now()
      WHERE id = $1 AND status = 'waiting_for_customer'
      RETURNING *`,
    [params.purchaseId, params.reason],
  );
  if (result.rows.length === 0) {
    return null;
  }
  return mapPurchaseRow(result.rows[0]);
}

export type AppendPurchaseRecordEventParams = {
  readonly purchaseRecordId: string;
  readonly fromStatus: PurchaseStatus | null;
  readonly toStatus: PurchaseStatus;
  readonly actorType: PurchaseActorType;
  readonly actorId: string;
  readonly reason: string | null;
  readonly eventPayload: Record<string, unknown> | null;
  readonly correlationId: string;
};

type PurchaseEventDbRow = {
  id: string;
  purchase_record_id: string;
  from_status: PurchaseStatus | null;
  to_status: PurchaseStatus;
  actor_type: PurchaseActorType;
  actor_id: string;
  reason: string | null;
  event_payload: Record<string, unknown> | null;
  correlation_id: string;
  occurred_at: Date;
  schema_version: number;
};

function mapEventRow(row: PurchaseEventDbRow): PurchaseRecordEventRow {
  return {
    id: row.id,
    purchaseRecordId: row.purchase_record_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorType: row.actor_type,
    actorId: row.actor_id,
    reason: row.reason,
    eventPayload:
      typeof row.event_payload === "string"
        ? (JSON.parse(row.event_payload) as Record<string, unknown>)
        : row.event_payload,
    correlationId: row.correlation_id,
    occurredAt: row.occurred_at,
    schemaVersion: row.schema_version,
  };
}

/** Appends one lifecycle-transition row; the authoritative source transition Trust Events and Notification Intents name. */
export async function appendPurchaseRecordEvent(
  tx: PlatformPostgresTransaction,
  params: AppendPurchaseRecordEventParams,
): Promise<PurchaseRecordEventRow> {
  const result = await tx.query<PurchaseEventDbRow>(
    `INSERT INTO purchase_record_events
       (purchase_record_id, from_status, to_status, actor_type, actor_id, reason, event_payload, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      params.purchaseRecordId,
      params.fromStatus,
      params.toStatus,
      params.actorType,
      params.actorId,
      params.reason,
      params.eventPayload ? JSON.stringify(params.eventPayload) : null,
      params.correlationId,
    ],
  );
  return mapEventRow(result.rows[0]);
}

export async function listPurchaseRecordEvents(
  db: Queryable,
  purchaseRecordId: string,
): Promise<PurchaseRecordEventRow[]> {
  const result = await db.query<PurchaseEventDbRow>(
    `SELECT * FROM purchase_record_events WHERE purchase_record_id = $1 ORDER BY occurred_at ASC, id ASC`,
    [purchaseRecordId],
  );
  return result.rows.map(mapEventRow);
}

export type ListPurchasesParams = {
  readonly status?: PurchaseStatus | null;
  readonly limit: number;
  readonly offset: number;
};

/**
 * Business-scoped list, newest-first with a stable `(created_at DESC, id
 * DESC)` tiebreak. Reads never create or repair records. Callers enforce
 * membership/ownership before calling.
 */
export async function listPurchaseRecordsForBusiness(
  db: Queryable,
  businessId: string,
  params: ListPurchasesParams,
): Promise<PurchaseRecordRow[]> {
  const result = await db.query<PurchaseDbRow>(
    `SELECT * FROM purchase_records
      WHERE business_id = $1 AND ($2::text IS NULL OR status = $2::text)
      ORDER BY created_at DESC, id DESC
      LIMIT $3 OFFSET $4`,
    [businessId, params.status ?? null, params.limit, params.offset],
  );
  return result.rows.map(mapPurchaseRow);
}

/** Customer-scoped "Waiting for You" list, newest-first, same stable ordering. */
export async function listWaitingPurchasesForCustomer(
  db: Queryable,
  customerIdentityId: string,
  params: { readonly limit: number; readonly offset: number },
): Promise<PurchaseRecordRow[]> {
  const result = await db.query<PurchaseDbRow>(
    `SELECT * FROM purchase_records
      WHERE customer_identity_id = $1 AND status = 'waiting_for_customer'
      ORDER BY created_at DESC, id DESC
      LIMIT $2 OFFSET $3`,
    [customerIdentityId, params.limit, params.offset],
  );
  return result.rows.map(mapPurchaseRow);
}
