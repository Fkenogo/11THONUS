-- Reward Program transactionally co-located audit/outbox (PLATFORM-BASELINE-005A).
--
-- Domain-specific (not generic), since an event log's payload is
-- inherently event-type-specific -- mirrors the existing Firestore
-- `outboxEntries` collection's own shape/purpose, adapted to PostgreSQL and
-- scoped to this domain per the approved design (PLATFORM-BASELINE-005
-- Section 26): every row here is written inside the SAME
-- withPlatformTransaction call as its triggering domain mutation, never a
-- follow-up write, so a Reward Program event and the mutation it describes
-- always commit or roll back together.
CREATE TABLE reward_program_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  actor_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reward_program_outbox_aggregate_idx ON reward_program_outbox (aggregate_type, aggregate_id);

COMMENT ON TABLE reward_program_outbox IS
  'Reward Program domain events, transactionally co-located with their triggering PostgreSQL mutation (PLATFORM-BASELINE-005A).';
