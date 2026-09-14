-- Generic PostgreSQL idempotency-key infrastructure (PLATFORM-BASELINE-005A).
--
-- Deliberately generic (not reward-program-prefixed) so a future
-- PostgreSQL-authoritative domain can reuse this same table rather than
-- each domain minting its own -- mirrors the existing Firestore
-- `idempotencyRecords` collection's own cross-domain shape
-- (checkAndReserveIdempotencyKey / completeIdempotencyKey /
-- failIdempotencyKey), adapted to PostgreSQL.
--
-- Unlike the Firestore version corrected by PLATFORM-BASELINE-003-CORR-001
-- and PLATFORM-BASELINE-004A-CORR-001 (a post-commit, second-transaction
-- completion write that could fail independently of the domain mutation),
-- every PostgreSQL-authoritative command in this codebase must reserve,
-- mutate, and complete a key inside ONE withPlatformTransaction call --
-- see reward_programs.repository.ts's command functions. This table's
-- shape supports that: `status` only ever transitions from 'processing'
-- to 'completed'/'failed' inside the same transaction as the domain write
-- it guards.
CREATE TABLE idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  operation_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  result_reference TEXT NULL,
  response_snapshot JSONB NULL,
  correlation_id TEXT NOT NULL,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL
);

COMMENT ON TABLE idempotency_keys IS
  'Generic PostgreSQL idempotency-key infrastructure, reusable by any future PostgreSQL-authoritative domain (PLATFORM-BASELINE-005A introduces it for Reward Program).';
