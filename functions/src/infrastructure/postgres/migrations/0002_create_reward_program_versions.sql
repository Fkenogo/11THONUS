-- Reward Program Version -- the historical commercial authority (PLATFORM-BASELINE-005A).
--
-- Every field a historical Purchase/Loyalty Cycle would need to correctly
-- interpret this version is snapshotted here, immutably, once published.
-- `required_verified_units`/`reward_quantity` are fixed MVP platform rules
-- (DEC-LOY-001, DEC-LOY-009) enforced by CHECK constraint at the database
-- layer, not merely in application code (defense-in-depth alongside
-- functions/src/config/loyaltyInvariants.ts's code constants).
--
-- `shared_loyalty_number_allowed` is authoritative HERE (not on
-- reward_programs) -- TRD10 Section 10.9.2 places this field on
-- RewardProgramVersionDocument; PLATFORM-BASELINE-005-REVIEW-FINDINGS-001
-- (RF-2) corrected the design to snapshot it per version.
--
-- Immutability (post-publish, i.e. once status != 'draft'): every column
-- except `status` itself (the active -> superseded transition) and
-- `approved_at` (set exactly once, at publish) is enforced not-mutable by
-- the command layer -- the same convention this codebase already uses for
-- Purchase Record's own "Immutability Rule" (no BEFORE UPDATE trigger; the
-- application transaction boundary is the enforcement point).
CREATE TABLE reward_program_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_program_id UUID NOT NULL REFERENCES reward_programs (id) ON DELETE RESTRICT,
  version INTEGER NOT NULL,
  required_verified_units INTEGER NOT NULL CHECK (required_verified_units = 10),
  reward_quantity INTEGER NOT NULL CHECK (reward_quantity = 1),
  shared_loyalty_number_allowed BOOLEAN NOT NULL,
  reward_description TEXT NOT NULL,
  standard_reward_node_id TEXT NULL,
  multiple_units_allowed BOOLEAN NOT NULL DEFAULT true,
  bulk_review_threshold INTEGER NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'superseded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  approved_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Optimistic-concurrency field for draft edits (PLATFORM-BASELINE-005A
  -- Section 19): the smallest safe mechanism given no version/etag column
  -- was otherwise proposed. An integer counter, not `updated_at` itself --
  -- a TIMESTAMPTZ round-tripped through a JS `Date` (millisecond
  -- precision) loses the microsecond precision PostgreSQL's `now()`
  -- actually stores, so comparing a caller-supplied `updated_at` back
  -- against the stored value in a `WHERE` clause can spuriously fail even
  -- with zero real concurrency. An update statement conditions on
  -- `row_version` matching the value the caller last read and increments
  -- it; zero rows affected means a concurrent edit landed first, and the
  -- command layer reports a stale-draft conflict rather than silently
  -- overwriting it.
  row_version INTEGER NOT NULL DEFAULT 1,
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT reward_program_versions_program_version_unique UNIQUE (reward_program_id, version)
);

-- At most one 'active' (current/effective) version per program at any
-- instant -- the database-enforced expression of the design's single-
-- active-version invariant (structurally entailed by reward_programs'
-- singular current_version_id plus the 'superseded' status meaning,
-- CORR-001.4 -- not a DEC-LOY-013 dependency).
CREATE UNIQUE INDEX reward_program_versions_one_active_per_program
  ON reward_program_versions (reward_program_id)
  WHERE status = 'active';

CREATE INDEX reward_program_versions_reward_program_id_idx ON reward_program_versions (reward_program_id);

-- Deferred from migration 0001: reward_program_versions must exist before
-- reward_programs.current_version_id can reference it.
ALTER TABLE reward_programs
  ADD CONSTRAINT reward_programs_current_version_id_fkey
  FOREIGN KEY (current_version_id) REFERENCES reward_program_versions (id);

COMMENT ON TABLE reward_program_versions IS
  'Reward Program Version -- immutable historical commercial authority once published (PLATFORM-BASELINE-005A).';
COMMENT ON COLUMN reward_program_versions.shared_loyalty_number_allowed IS
  'Authoritative, immutable per-version snapshot (PLATFORM-BASELINE-005-REVIEW-FINDINGS-001 RF-2) -- matches TRD10 Section 10.9.2.';
