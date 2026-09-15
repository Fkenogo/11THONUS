-- Loyalty Cycle stream + aggregate foundation (PLATFORM-BASELINE-006A;
-- design §§15-16/20, FD-PVL-002).
--
-- loyalty_cycle_streams: serialization parent per allocation stream.
-- One row per (Business, Customer, Reward Program), created idempotently
-- (INSERT … ON CONFLICT DO NOTHING) and locked FOR UPDATE before any
-- cycle resolution/creation or allocation step. Owns the cycle sequence
-- counter. The conflict path is the designed concurrent-arrival path.
CREATE TABLE loyalty_cycle_streams (
  business_id TEXT NOT NULL,                        -- opaque Firestore ref
  customer_identity_id TEXT NOT NULL,               -- opaque, server-resolved
  reward_program_id UUID NOT NULL REFERENCES reward_programs (id) ON DELETE RESTRICT,
  next_cycle_sequence INTEGER NOT NULL DEFAULT 1 CHECK (next_cycle_sequence >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_cycle_streams_pkey PRIMARY KEY
    (business_id, customer_identity_id, reward_program_id)
);

-- loyalty_cycles: minimum operational Cycle aggregate.
-- Full future Cycle feature set NOT designed here — only what 006A needs
-- to allocate, cross thresholds, and hold pending overflow.
CREATE TABLE loyalty_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,                        -- opaque Firestore ref
  customer_identity_id TEXT NOT NULL,               -- opaque, server-resolved
  reward_program_id UUID NOT NULL,
  opened_under_version_id UUID NOT NULL,
  sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
  state TEXT NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','reward_available','reward_redeemed','closed')),
  allocated_units INTEGER NOT NULL DEFAULT 0
    CHECK (allocated_units >= 0 AND allocated_units <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  -- A. opening version belongs to the program (backs onto the 0007
  -- additive UNIQUE — never application prechecks alone).
  CONSTRAINT loyalty_cycles_version_in_program FOREIGN KEY
    (reward_program_id, opened_under_version_id)
    REFERENCES reward_program_versions (reward_program_id, id) ON DELETE RESTRICT,
  -- B. program belongs to the business.
  CONSTRAINT loyalty_cycles_program_in_business FOREIGN KEY
    (reward_program_id, business_id)
    REFERENCES reward_programs (id, business_id) ON DELETE RESTRICT,
  -- Stream membership: every cycle hangs off its serialization parent.
  CONSTRAINT loyalty_cycles_in_stream FOREIGN KEY
    (business_id, customer_identity_id, reward_program_id)
    REFERENCES loyalty_cycle_streams
    (business_id, customer_identity_id, reward_program_id) ON DELETE RESTRICT,
  -- C. identity tuple anchoring allocation-scope FKs.
  CONSTRAINT loyalty_cycles_identity_tuple_unique UNIQUE
    (id, business_id, customer_identity_id, reward_program_id),
  -- Anchor for the reward-version proof below.
  CONSTRAINT loyalty_cycles_governing_version_unique UNIQUE
    (id, opened_under_version_id),
  -- E. sequence uniqueness scoped per customer+program stream (the stream
  -- counter is the writer; this index is the backstop).
  CONSTRAINT loyalty_cycles_sequence_unique UNIQUE
    (customer_identity_id, reward_program_id, sequence_number)
);
-- DEC-LOY-002/FD-PVL-002 invariant (D): never more than one current
-- active/reward-available cycle per customer+program.
CREATE UNIQUE INDEX loyalty_cycles_one_current_per_customer_program
  ON loyalty_cycles (customer_identity_id, reward_program_id)
  WHERE state IN ('active','reward_available');
