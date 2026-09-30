/**
 * Commercial audit repository (`WP-COM-01`; design §18, TRD18 §18.49).
 *
 * Commercial owns its own append-only audit table because audit must be
 * atomic with the ledger mutation (a Firestore write cannot share a
 * PostgreSQL transaction). Customer Trust Events are deliberately NOT used
 * for internal commercial administration. Insert and read only; the
 * database rejects UPDATE/DELETE/TRUNCATE.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  COMMERCIAL_AUDIT_ACTION_TYPES,
  COMMERCIAL_AUDIT_RESULTS,
  type CommercialActor,
  type CommercialAuditActionType,
  type CommercialAuditResult,
} from "../models/commercialFoundation";
import { commercialValidationError } from "../models/commercialErrors";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

export type CommercialAuditEvent = {
  readonly id: string;
  readonly actorType: CommercialActor["type"];
  readonly actorId: string;
  readonly actionType: CommercialAuditActionType;
  readonly targetType: string;
  readonly targetId: string;
  readonly businessId: string;
  readonly reasonCode: string | null;
  readonly reasonText: string;
  readonly reference: string | null;
  readonly correlationId: string;
  readonly idempotencyKey: string | null;
  readonly result: CommercialAuditResult;
  readonly beforeSnapshot: unknown;
  readonly afterSnapshot: unknown;
  readonly ledgerEntryId: string | null;
  readonly priceScheduleId: string | null;
  readonly occurredAt: Date;
};

type AuditRow = {
  id: string;
  actor_type: CommercialActor["type"];
  actor_id: string;
  action_type: CommercialAuditActionType;
  target_type: string;
  target_id: string;
  business_id: string;
  reason_code: string | null;
  reason_text: string;
  reference: string | null;
  correlation_id: string;
  idempotency_key: string | null;
  result: CommercialAuditResult;
  before_snapshot: unknown;
  after_snapshot: unknown;
  ledger_entry_id: string | null;
  price_schedule_id: string | null;
  occurred_at: Date;
};

const AUDIT_COLUMNS = `id, actor_type, actor_id, action_type, target_type, target_id, business_id,
  reason_code, reason_text, reference, correlation_id, idempotency_key, result, before_snapshot,
  after_snapshot, ledger_entry_id, price_schedule_id, occurred_at`;

function mapAudit(row: AuditRow): CommercialAuditEvent {
  return {
    id: row.id,
    actorType: row.actor_type,
    actorId: row.actor_id,
    actionType: row.action_type,
    targetType: row.target_type,
    targetId: row.target_id,
    businessId: row.business_id,
    reasonCode: row.reason_code,
    reasonText: row.reason_text,
    reference: row.reference,
    correlationId: row.correlation_id,
    idempotencyKey: row.idempotency_key,
    result: row.result,
    beforeSnapshot: row.before_snapshot,
    afterSnapshot: row.after_snapshot,
    ledgerEntryId: row.ledger_entry_id,
    priceScheduleId: row.price_schedule_id,
    occurredAt: row.occurred_at,
  };
}

export type AppendCommercialAuditEventParams = {
  readonly actor: CommercialActor;
  readonly actionType: CommercialAuditActionType;
  readonly targetType: string;
  readonly targetId: string;
  readonly businessId: string;
  readonly reasonCode?: string;
  readonly reasonText: string;
  readonly reference?: string;
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly result: CommercialAuditResult;
  readonly beforeSnapshot?: unknown;
  readonly afterSnapshot?: unknown;
  readonly ledgerEntryId?: string;
  readonly priceScheduleId?: string;
};

/**
 * Appends one audit row inside the caller's transaction (the same one that
 * carries the mutation it describes). Returns `null` when the
 * `(idempotency_key, action_type)` pair was already audited (a replay).
 */
export async function appendCommercialAuditEvent(
  tx: PlatformPostgresTransaction,
  params: AppendCommercialAuditEventParams,
): Promise<CommercialAuditEvent | null> {
  if (!(COMMERCIAL_AUDIT_ACTION_TYPES as readonly string[]).includes(params.actionType)) {
    throw commercialValidationError(`Unknown Commercial audit action "${params.actionType}".`);
  }
  if (!(COMMERCIAL_AUDIT_RESULTS as readonly string[]).includes(params.result)) {
    throw commercialValidationError(`Unknown Commercial audit result "${params.result}".`);
  }
  const result = await tx.query<AuditRow>(
    `INSERT INTO commercial_audit_events
       (actor_type, actor_id, action_type, target_type, target_id, business_id, reason_code,
        reason_text, reference, correlation_id, idempotency_key, result, before_snapshot,
        after_snapshot, ledger_entry_id, price_schedule_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (idempotency_key, action_type) WHERE idempotency_key IS NOT NULL DO NOTHING
     RETURNING ${AUDIT_COLUMNS}`,
    [
      params.actor.type,
      params.actor.id,
      params.actionType,
      params.targetType,
      params.targetId,
      params.businessId,
      params.reasonCode ?? null,
      params.reasonText,
      params.reference ?? null,
      params.correlationId,
      params.idempotencyKey ?? null,
      params.result,
      params.beforeSnapshot === undefined ? null : JSON.stringify(params.beforeSnapshot),
      params.afterSnapshot === undefined ? null : JSON.stringify(params.afterSnapshot),
      params.ledgerEntryId ?? null,
      params.priceScheduleId ?? null,
    ],
  );
  return result.rows.length === 0 ? null : mapAudit(result.rows[0]);
}

/** TRD18 §18.50 search: by Business, newest first. */
export async function listCommercialAuditEventsForBusiness(
  db: Queryable,
  businessId: string,
): Promise<CommercialAuditEvent[]> {
  const result = await db.query<AuditRow>(
    `SELECT ${AUDIT_COLUMNS} FROM commercial_audit_events
      WHERE business_id = $1 ORDER BY occurred_at DESC, id`,
    [businessId],
  );
  return result.rows.map(mapAudit);
}
