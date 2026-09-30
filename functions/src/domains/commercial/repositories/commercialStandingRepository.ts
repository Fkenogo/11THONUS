/**
 * Commercial standing-event repository (`WP-COM-01`; design §20).
 *
 * Immutable timeline of administrative standing changes. Insert and read
 * only; the commands that record them are a later work package.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { CommercialStandingEventType } from "../models/commercialFoundation";

type Queryable = Pick<PlatformPostgresPool, "query"> | PlatformPostgresTransaction;

export type CommercialStandingEvent = {
  readonly id: string;
  readonly businessId: string;
  readonly eventType: CommercialStandingEventType;
  readonly actorId: string;
  readonly reasonText: string;
  readonly idempotencyScopeKey: string;
  readonly correlationId: string;
  readonly occurredAt: Date;
};

type StandingRow = {
  id: string;
  business_id: string;
  event_type: CommercialStandingEventType;
  actor_id: string;
  reason_text: string;
  idempotency_scope_key: string;
  correlation_id: string;
  occurred_at: Date;
};

const STANDING_COLUMNS = `id, business_id, event_type, actor_id, reason_text, idempotency_scope_key, correlation_id, occurred_at`;

function mapStanding(row: StandingRow): CommercialStandingEvent {
  return {
    id: row.id,
    businessId: row.business_id,
    eventType: row.event_type,
    actorId: row.actor_id,
    reasonText: row.reason_text,
    idempotencyScopeKey: row.idempotency_scope_key,
    correlationId: row.correlation_id,
    occurredAt: row.occurred_at,
  };
}

export type InsertStandingEventParams = {
  readonly businessId: string;
  readonly eventType: CommercialStandingEventType;
  readonly actorId: string;
  readonly reasonText: string;
  readonly idempotencyScopeKey: string;
  readonly correlationId: string;
};

/** Returns `null` on an idempotent replay of the same scope key. */
export async function insertStandingEvent(
  tx: PlatformPostgresTransaction,
  params: InsertStandingEventParams,
): Promise<CommercialStandingEvent | null> {
  const result = await tx.query<StandingRow>(
    `INSERT INTO commercial_standing_events
       (business_id, event_type, actor_id, reason_text, idempotency_scope_key, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (idempotency_scope_key) DO NOTHING
     RETURNING ${STANDING_COLUMNS}`,
    [
      params.businessId,
      params.eventType,
      params.actorId,
      params.reasonText,
      params.idempotencyScopeKey,
      params.correlationId,
    ],
  );
  return result.rows.length === 0 ? null : mapStanding(result.rows[0]);
}

export async function listStandingEvents(
  db: Queryable,
  businessId: string,
): Promise<CommercialStandingEvent[]> {
  const result = await db.query<StandingRow>(
    `SELECT ${STANDING_COLUMNS} FROM commercial_standing_events
      WHERE business_id = $1 ORDER BY occurred_at ASC, id`,
    [businessId],
  );
  return result.rows.map(mapStanding);
}
