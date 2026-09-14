-- Notification Intents + Purchase-domain outbox (PLATFORM-BASELINE-006A;
-- design §§16/20/23, 005A outbox pattern).
--
-- notification_intents: durable business intent per transition.
-- Intent (authoritative, durable, transactional) vs delivery (deferred
-- provider infrastructure). No delivery worker reads this in 006A;
-- status stays pending by design (CHECK-enforced until a governed delivery
-- package widens it).
CREATE TABLE notification_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_type TEXT NOT NULL
    CHECK (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
      'purchase_rejected_business','purchase_disputed_business',
      'reward_available_customer')),
  purchase_record_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  -- Authoritative source transition: the purchase_record_events row this
  -- intent was generated from. Structural dedup key below.
  source_purchase_record_event_id UUID NOT NULL REFERENCES purchase_record_events (id) ON DELETE RESTRICT,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer','business')),
  recipient_id TEXT NOT NULL,
  payload JSONB NOT NULL,                           -- template keys + ids; copy resolved at delivery time
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status = 'pending'),
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX notification_intents_purchase_idx
  ON notification_intents (purchase_record_id, created_at);
-- Structural deduplication independent of command idempotency: one intent
-- per (source transition, type, recipient). A retried command replays from
-- its idempotency record instead of inserting; this index backstops it.
CREATE UNIQUE INDEX notification_intents_one_per_source_recipient
  ON notification_intents (source_purchase_record_event_id, intent_type,
    recipient_type, recipient_id);

-- purchase_outbox: domain-scoped transactional outbox (005A pattern).
-- Payloads carry ids only, never secrets.
CREATE TABLE purchase_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('purchase_recorded','purchase_verified','purchase_rejected',
      'purchase_disputed','verified_units_issued','loyalty_cycle_allocated',
      'loyalty_cycle_reward_available','reward_available')),
  aggregate_type TEXT NOT NULL DEFAULT 'purchase_record',
  aggregate_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  payload JSONB NOT NULL,
  actor_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX purchase_outbox_aggregate_idx ON purchase_outbox (aggregate_id, occurred_at);
