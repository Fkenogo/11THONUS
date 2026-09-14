/**
 * Notification Intent + Purchase-domain outbox repositories
 * (`PLATFORM-BASELINE-006A`, design §§16/23, 005A outbox pattern).
 *
 * Intent vs delivery split (TRD13): this package creates durable,
 * source-linked intent rows transactionally; no delivery worker reads them
 * in 006A (`status` stays `pending` by CHECK-enforced design). Structural
 * dedup `UNIQUE(source, intent_type, recipient)` backstops command
 * idempotency. Outbox payloads carry ids only, never secrets.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  NotificationIntentRow,
  NotificationIntentType,
  PurchaseOutboxEventType,
} from "../models/purchase";

type Queryable = PoolClient | PlatformPostgresPool;

type NotificationIntentDbRow = {
  id: string;
  intent_type: NotificationIntentType;
  purchase_record_id: string;
  source_purchase_record_event_id: string;
  recipient_type: "customer" | "business";
  recipient_id: string;
  payload: Record<string, unknown>;
  status: "pending";
  correlation_id: string;
  created_at: Date;
  schema_version: number;
};

function mapIntentRow(row: NotificationIntentDbRow): NotificationIntentRow {
  return {
    id: row.id,
    intentType: row.intent_type,
    purchaseRecordId: row.purchase_record_id,
    sourcePurchaseRecordEventId: row.source_purchase_record_event_id,
    recipientType: row.recipient_type,
    recipientId: row.recipient_id,
    payload:
      typeof row.payload === "string"
        ? (JSON.parse(row.payload) as Record<string, unknown>)
        : row.payload,
    status: row.status,
    correlationId: row.correlation_id,
    createdAt: row.created_at,
    schemaVersion: row.schema_version,
  };
}

export type InsertNotificationIntentParams = {
  readonly intentType: NotificationIntentType;
  readonly purchaseRecordId: string;
  readonly sourcePurchaseRecordEventId: string;
  readonly recipientType: "customer" | "business";
  readonly recipientId: string;
  readonly payload: Record<string, unknown>;
  readonly correlationId: string;
};

export async function insertNotificationIntent(
  tx: PlatformPostgresTransaction,
  params: InsertNotificationIntentParams,
): Promise<NotificationIntentRow> {
  const result = await tx.query<NotificationIntentDbRow>(
    `INSERT INTO notification_intents
       (intent_type, purchase_record_id, source_purchase_record_event_id,
        recipient_type, recipient_id, payload, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      params.intentType,
      params.purchaseRecordId,
      params.sourcePurchaseRecordEventId,
      params.recipientType,
      params.recipientId,
      JSON.stringify(params.payload),
      params.correlationId,
    ],
  );
  return mapIntentRow(result.rows[0]);
}

export async function listNotificationIntentsForPurchase(
  db: Queryable,
  purchaseRecordId: string,
): Promise<NotificationIntentRow[]> {
  const result = await db.query<NotificationIntentDbRow>(
    `SELECT * FROM notification_intents WHERE purchase_record_id = $1 ORDER BY created_at ASC, id ASC`,
    [purchaseRecordId],
  );
  return result.rows.map(mapIntentRow);
}

export type WritePurchaseOutboxEventParams = {
  readonly eventType: PurchaseOutboxEventType;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
  readonly actorId: string;
  readonly correlationId: string;
  readonly idempotencyKey?: string | null;
};

/** Same-transaction domain outbox write (005A `writeRewardProgramOutboxEntry` pattern). */
export async function writePurchaseOutboxEntry(
  tx: PlatformPostgresTransaction,
  params: WritePurchaseOutboxEventParams,
): Promise<void> {
  await tx.query(
    `INSERT INTO purchase_outbox
       (event_type, aggregate_type, aggregate_id, payload, actor_id, correlation_id, idempotency_key)
     VALUES ($1, 'purchase_record', $2, $3, $4, $5, $6)`,
    [
      params.eventType,
      params.aggregateId,
      JSON.stringify(params.payload),
      params.actorId,
      params.correlationId,
      params.idempotencyKey ?? null,
    ],
  );
}
