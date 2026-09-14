/**
 * Reward Program transactionally co-located audit/outbox writer
 * (`PLATFORM-BASELINE-005A`).
 *
 * Every call site passes the caller's own transaction -- an event and the
 * domain mutation it describes always commit or roll back together, never
 * a follow-up write (mirrors `shared/outbox/outboxWriter.ts`'s Firestore
 * convention, adapted to PostgreSQL).
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";

export type RewardProgramEventType =
  | "reward_program_created"
  | "reward_program_draft_updated"
  | "reward_program_version_published"
  | "reward_program_version_draft_created";

export type WriteRewardProgramEventParams = {
  readonly eventType: RewardProgramEventType;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
  readonly actorId: string;
  readonly correlationId: string;
  readonly idempotencyKey?: string | null;
};

export async function writeRewardProgramOutboxEntry(
  tx: PlatformPostgresTransaction,
  params: WriteRewardProgramEventParams,
): Promise<void> {
  await tx.query(
    `INSERT INTO reward_program_outbox
       (event_type, aggregate_type, aggregate_id, payload, actor_id, correlation_id, idempotency_key)
     VALUES ($1, 'reward_program', $2, $3, $4, $5, $6)`,
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
