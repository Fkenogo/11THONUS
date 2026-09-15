-- Purchase Records + lifecycle events (PLATFORM-BASELINE-006A; design §20).
--
-- purchase_records: platform representation of a real-world purchase.
-- Commercial/identity snapshot columns are insert-only by command-layer
-- convention (TRD10 §10.10.1 Immutability Rule). Only status/verdict/linkage
-- columns transition, and only through governed commands.
CREATE TABLE purchase_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,                        -- opaque Firestore ref
  customer_identity_id TEXT NOT NULL,               -- B: resolved, server-authoritative
  -- A: presented artifact — exactly what the Business submitted.
  -- One presentation form only; never a Customer id; never authority.
  presented_artifact_type TEXT NOT NULL
    CHECK (presented_artifact_type IN ('loyalty_number','qr_identity')),
  presented_artifact_reference TEXT NOT NULL,       -- raw submitted value
  -- C: canonical Loyalty Number, server-derived display snapshot.
  -- Exactly one LN per identity is governed (DEC-CUST-ID-ART-001), so the
  -- derivation source is total: NOT NULL is justified. Display/reporting
  -- only — never read as presented input, never read as authority.
  canonical_loyalty_number_value TEXT NOT NULL,
  reward_program_id UUID NOT NULL,
  reward_program_version_id UUID NOT NULL,
  shared_loyalty_number_allowed BOOLEAN NOT NULL,   -- version-flag snapshot
  multiple_units_allowed BOOLEAN NOT NULL,          -- version-flag snapshot
  branch_id TEXT NOT NULL,                          -- default branch, informational
  recorded_by_user_id TEXT NOT NULL,
  recorded_by_role TEXT NOT NULL CHECK (recorded_by_role IN ('staff','manager','owner')),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  item_label TEXT NOT NULL,
  knowledge_node_id TEXT NULL,                      -- optional qualifying ref
  unit_value_minor INTEGER NULL CHECK (unit_value_minor IS NULL OR unit_value_minor >= 0),
  currency TEXT NULL,                               -- reporting-only (DEC-DATA-003)
  purchase_date TIMESTAMPTZ NOT NULL,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'waiting_for_customer'
    CHECK (status IN ('waiting_for_customer','verified','rejected','under_review',
                      'corrected','cancelled','expired','archived')),
  verified_at TIMESTAMPTZ NULL,
  rejection_reason TEXT NULL
    CHECK (rejection_reason IS NULL OR rejection_reason IN
      ('did_not_happen','duplicate','wrong_customer','wrong_program','wholly_invalid')),
  dispute_reason TEXT NULL
    CHECK (dispute_reason IS NULL OR dispute_reason IN
      ('wrong_quantity','wrong_item','partially_inaccurate')),
  replaces_purchase_record_id UUID NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1,
  -- State integrity preserves historical facts: facts required when
  -- their transition occurred are never erased by later transitions; only
  -- incompatible simultaneous verdicts are prevented. waiting_for_customer
  -- carries no verdict facts; corrected/cancelled/expired/archived (no 006A
  -- writer) impose no erasure — append-only events hold full history.
  CONSTRAINT purchase_records_verified_fields CHECK (
    (status = 'waiting_for_customer'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'verified' AND verified_at IS NOT NULL
      AND rejection_reason IS NULL AND dispute_reason IS NULL) OR
    (status = 'rejected' AND rejection_reason IS NOT NULL
      AND dispute_reason IS NULL) OR
    (status = 'under_review' AND dispute_reason IS NOT NULL
      AND rejection_reason IS NULL) OR
    (status IN ('corrected','cancelled','expired','archived'))),
  -- Incompatible simultaneous verdicts are prevented in every state.
  CONSTRAINT purchase_records_single_verdict CHECK (
    NOT (rejection_reason IS NOT NULL AND dispute_reason IS NOT NULL)),
  CONSTRAINT purchase_records_reporting_pair CHECK (
    (unit_value_minor IS NULL) = (currency IS NULL)), -- value+currency together or neither
  -- A-B. version-in-program and program-in-Business, relationally
  -- (backs onto the 0007 additive UNIQUEs — never application prechecks alone).
  CONSTRAINT purchase_records_version_in_program FOREIGN KEY
    (reward_program_id, reward_program_version_id)
    REFERENCES reward_program_versions (reward_program_id, id) ON DELETE RESTRICT,
  CONSTRAINT purchase_records_program_in_business FOREIGN KEY
    (reward_program_id, business_id)
    REFERENCES reward_programs (id, business_id) ON DELETE RESTRICT,
  -- F. correction linkage: ONE authoritative directional FK.
  -- The replacement points at the original; the reverse is a query, never
  -- a second materialized column. Longer circular chains are rejected
  -- transactionally by the future correction command (no 006A writer exists).
  CONSTRAINT purchase_records_no_self_replace CHECK (
    replaces_purchase_record_id IS DISTINCT FROM id),
  -- C/D anchor: copied-identifier tuple other tables pin to.
  CONSTRAINT purchase_records_identity_tuple_unique UNIQUE
    (id, business_id, customer_identity_id, reward_program_id,
     reward_program_version_id)
);
CREATE INDEX purchase_records_business_status_idx ON purchase_records (business_id, status, created_at DESC);
CREATE INDEX purchase_records_customer_status_idx ON purchase_records (customer_identity_id, status, created_at DESC);
CREATE INDEX purchase_records_program_idx ON purchase_records (reward_program_id, reward_program_version_id);
-- F (continued): one replacement claims at most one original.
CREATE UNIQUE INDEX purchase_records_one_original_per_replacement
  ON purchase_records (replaces_purchase_record_id) WHERE replaces_purchase_record_id IS NOT NULL;

-- purchase_record_events: append-only transition history (timeline + Trust source).
CREATE TABLE purchase_record_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_record_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  from_status TEXT NULL,
  to_status TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('staff','manager','owner','customer','system')),
  actor_id TEXT NOT NULL,
  reason TEXT NULL,
  event_payload JSONB NULL,                         -- version-delta notes, etc.
  correlation_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX purchase_record_events_record_idx ON purchase_record_events (purchase_record_id, occurred_at);
