-- Authoritative commercial Trust Events (PLATFORM-BASELINE-006A; design
-- §§7/16/20/22, FD-PVL-001, CORR-003 cardinality).
--
-- trust_events: authoritative commercial trust history. One row per governed
-- occurrence, written in the SAME PG transaction as the state change.
-- Translates the governed TRD10 §10.13.1 TrustEventDocument semantics into
-- the PG spine without copying provider-specific structure.
-- Insert-only (no 006A updater/deleter).
--
-- Cardinality: A. one CAUSAL purchase-transition event per transition
-- (purchase.recorded / .verified / .rejected / .disputed); B. SUBJECT events
-- where governed (verified_units.issued, loyalty_cycle.allocated,
-- loyalty_cycle.reward_available, reward.available), each naming its
-- explicit subject. Subjects are NOT forced into a purchase aggregate FK:
-- the causal purchase root is always present, and the subject is carried as
-- (subject_type + subject_id) with explicit nullable FK columns per subject
-- type — never an unsafe polymorphic FK.
CREATE TABLE trust_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('purchase.recorded','purchase.verified',
      'purchase.rejected','purchase.disputed','verified_units.issued',
      'loyalty_cycle.allocated','loyalty_cycle.reward_available',
      'reward.available')),
  event_version INTEGER NOT NULL DEFAULT 1,
  source_domain TEXT NOT NULL DEFAULT 'purchase',
  -- Causal root: every event in this spine is caused by a Purchase
  -- lifecycle transition.
  causal_purchase_record_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  -- Authoritative source transition: the purchase_record_events row this
  -- Trust Event was generated from (mirrors the notification_intents
  -- linkage; the causal id above names the Purchase, this names the event).
  source_purchase_record_event_id UUID NOT NULL REFERENCES purchase_record_events (id) ON DELETE RESTRICT,
  -- Explicit subject semantics.
  subject_type TEXT NOT NULL
    CHECK (subject_type IN ('purchase_record','verified_unit','loyalty_cycle','reward')),
  subject_id UUID NOT NULL,
  subject_verified_unit_id UUID NULL REFERENCES verified_units (id) ON DELETE RESTRICT,
  subject_loyalty_cycle_id UUID NULL REFERENCES loyalty_cycles (id) ON DELETE RESTRICT,
  subject_reward_id UUID NULL REFERENCES rewards (id) ON DELETE RESTRICT,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('staff','manager','owner','customer','system')),
  actor_id TEXT NOT NULL,
  actor_role TEXT NULL,
  correlation_id TEXT NOT NULL,
  causation_id UUID NULL REFERENCES trust_events (id) ON DELETE RESTRICT,
  payload JSONB NOT NULL,                           -- immutable reference; ids only, PII minimized
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT trust_events_subject_shape CHECK (
    (subject_type = 'purchase_record'
      AND subject_id = causal_purchase_record_id
      AND subject_verified_unit_id IS NULL
      AND subject_loyalty_cycle_id IS NULL
      AND subject_reward_id IS NULL) OR
    (subject_type = 'verified_unit'
      AND subject_verified_unit_id IS NOT NULL AND subject_id = subject_verified_unit_id
      AND subject_loyalty_cycle_id IS NULL AND subject_reward_id IS NULL) OR
    (subject_type = 'loyalty_cycle'
      AND subject_loyalty_cycle_id IS NOT NULL AND subject_id = subject_loyalty_cycle_id
      AND subject_verified_unit_id IS NULL AND subject_reward_id IS NULL) OR
    (subject_type = 'reward'
      AND subject_reward_id IS NOT NULL AND subject_id = subject_reward_id
      AND subject_verified_unit_id IS NULL AND subject_loyalty_cycle_id IS NULL))
);
-- Deduplication independent of command idempotency, split by cardinality:
-- one-time subject events keep lifetime uniqueness per subject…
CREATE UNIQUE INDEX trust_events_one_time_subject_event
  ON trust_events (subject_type, subject_id, event_type)
  WHERE event_type IN ('verified_units.issued',
    'loyalty_cycle.reward_available', 'reward.available');
-- …while repeatable subject events dedup per CAUSAL SOURCE TRANSITION:
-- two distinct Purchases may each emit loyalty_cycle.allocated against the
-- same Cycle (different source keys coexist); replaying the SAME source
-- transition cannot insert twice. Transitions fire once by state machine;
-- the verify transaction writes each event once.
CREATE UNIQUE INDEX trust_events_repeatable_causal_event
  ON trust_events (source_purchase_record_event_id, subject_type,
    subject_id, event_type)
  WHERE event_type IN ('loyalty_cycle.allocated');
CREATE INDEX trust_events_causal_idx ON trust_events (causal_purchase_record_id, occurred_at);
CREATE INDEX trust_events_customer_idx ON trust_events (customer_identity_id, occurred_at DESC);
CREATE INDEX trust_events_business_idx ON trust_events (business_id, occurred_at DESC);
