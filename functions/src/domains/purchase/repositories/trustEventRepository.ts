/**
 * Authoritative Trust Event repository (`PLATFORM-BASELINE-006A`, design
 * §22, CORR-003 cardinality).
 *
 * Exactly one trust ledger (`trust_events`). Every Purchase lifecycle
 * transition writes its authoritative Trust Event row(s) inside the SAME
 * PostgreSQL transaction as the state change. Writes are plain INSERTs:
 * command idempotency guarantees each transition fires once, so a UNIQUE
 * violation here would be a loud bug signal, never an expected replay
 * path (replays return the stored idempotent result before any write).
 *
 * Dedup split by cardinality (DB backstops):
 * - one-time subject events (`verified_units.issued`,
 *   `loyalty_cycle.reward_available`, `reward.available`): lifetime
 *   uniqueness per subject.
 * - repeatable subject events (`loyalty_cycle.allocated`): dedup per
 *   causal source transition (`source_purchase_record_event_id`) — two
 *   distinct Purchases allocating into the same Cycle coexist (different
 *   source keys); replaying the same source transition cannot duplicate.
 */

import type { PoolClient } from "pg";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type {
  PurchaseActorType,
  TrustEventRow,
  TrustEventType,
  TrustSubjectType,
} from "../models/purchase";

type Queryable = PoolClient | PlatformPostgresPool;

type TrustEventDbRow = {
  id: string;
  event_type: TrustEventType;
  event_version: number;
  source_domain: string;
  causal_purchase_record_id: string;
  source_purchase_record_event_id: string;
  subject_type: TrustSubjectType;
  subject_id: string;
  subject_verified_unit_id: string | null;
  subject_loyalty_cycle_id: string | null;
  subject_reward_id: string | null;
  business_id: string;
  customer_identity_id: string;
  actor_type: PurchaseActorType;
  actor_id: string;
  actor_role: string | null;
  correlation_id: string;
  causation_id: string | null;
  payload: Record<string, unknown>;
  occurred_at: Date;
  recorded_at: Date;
  schema_version: number;
};

function mapTrustEventRow(row: TrustEventDbRow): TrustEventRow {
  return {
    id: row.id,
    eventType: row.event_type,
    eventVersion: row.event_version,
    sourceDomain: row.source_domain,
    causalPurchaseRecordId: row.causal_purchase_record_id,
    sourcePurchaseRecordEventId: row.source_purchase_record_event_id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    subjectVerifiedUnitId: row.subject_verified_unit_id,
    subjectLoyaltyCycleId: row.subject_loyalty_cycle_id,
    subjectRewardId: row.subject_reward_id,
    businessId: row.business_id,
    customerIdentityId: row.customer_identity_id,
    actorType: row.actor_type,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    correlationId: row.correlation_id,
    causationId: row.causation_id,
    payload:
      typeof row.payload === "string"
        ? (JSON.parse(row.payload) as Record<string, unknown>)
        : row.payload,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
    schemaVersion: row.schema_version,
  };
}

export type InsertTrustEventParams = {
  readonly eventType: TrustEventType;
  readonly causalPurchaseRecordId: string;
  readonly sourcePurchaseRecordEventId: string;
  readonly subjectType: TrustSubjectType;
  readonly subjectId: string;
  readonly subjectVerifiedUnitId?: string | null;
  readonly subjectLoyaltyCycleId?: string | null;
  readonly subjectRewardId?: string | null;
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly actorType: PurchaseActorType;
  readonly actorId: string;
  readonly actorRole?: string | null;
  readonly correlationId: string;
  readonly causationId?: string | null;
  readonly payload: Record<string, unknown>;
};

export async function insertTrustEvent(
  tx: PlatformPostgresTransaction,
  params: InsertTrustEventParams,
): Promise<TrustEventRow> {
  const result = await tx.query<TrustEventDbRow>(
    `INSERT INTO trust_events
       (event_type, causal_purchase_record_id, source_purchase_record_event_id,
        subject_type, subject_id, subject_verified_unit_id, subject_loyalty_cycle_id, subject_reward_id,
        business_id, customer_identity_id, actor_type, actor_id, actor_role,
        correlation_id, causation_id, payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      params.eventType,
      params.causalPurchaseRecordId,
      params.sourcePurchaseRecordEventId,
      params.subjectType,
      params.subjectId,
      params.subjectVerifiedUnitId ?? null,
      params.subjectLoyaltyCycleId ?? null,
      params.subjectRewardId ?? null,
      params.businessId,
      params.customerIdentityId,
      params.actorType,
      params.actorId,
      params.actorRole ?? null,
      params.correlationId,
      params.causationId ?? null,
      JSON.stringify(params.payload),
    ],
  );
  return mapTrustEventRow(result.rows[0]);
}

export async function listTrustEventsForPurchase(
  db: Queryable,
  purchaseRecordId: string,
): Promise<TrustEventRow[]> {
  const result = await db.query<TrustEventDbRow>(
    `SELECT * FROM trust_events WHERE causal_purchase_record_id = $1 ORDER BY occurred_at ASC, id ASC`,
    [purchaseRecordId],
  );
  return result.rows.map(mapTrustEventRow);
}
