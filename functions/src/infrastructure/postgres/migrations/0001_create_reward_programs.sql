-- Reward Program stable identity + current-state projection (PLATFORM-BASELINE-005A).
--
-- Table/column names PROPOSED BY PLATFORM-BASELINE-005 (design report,
-- CORR-001.2) -- not inherited or reserved by any prior package. This is
-- the first real product schema this codebase's PostgreSQL migration
-- mechanism applies (PLATFORM-BASELINE-001 shipped it empty).
--
-- `business_id`/`reward_program_category_id`/`created_by`/`updated_by` are
-- opaque Firestore-owned references (Business, Commerce Knowledge,
-- Customer Identity) -- never PostgreSQL foreign keys, since Firestore is
-- a different store and no cross-store FK is possible. Existence/status
-- validation for these happens server-side at write time, not via a
-- database constraint (PLATFORM-BASELINE-005 design report SS9).
--
-- `current_version_id` has no FK constraint here because
-- reward_program_versions does not exist yet at this point in the
-- migration sequence (a program row must exist before its first version
-- can reference it). The FK is added in migration 0002, once
-- reward_program_versions exists.
--
-- `shared_loyalty_number_allowed` on this table is a current-value
-- convenience projection ONLY -- never historical authority. The
-- authoritative, immutable per-version value lives on
-- reward_program_versions (migration 0002), per the
-- PLATFORM-BASELINE-005-REVIEW-FINDINGS-001 correction (RF-2).
CREATE TABLE reward_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  reward_program_category_id TEXT NOT NULL,
  shared_loyalty_number_allowed BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'retired', 'archived')),
  current_version_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX reward_programs_business_id_idx ON reward_programs (business_id);
CREATE INDEX reward_programs_business_id_status_idx ON reward_programs (business_id, status);

COMMENT ON TABLE reward_programs IS
  'Reward Program stable identity and current-state projection (PLATFORM-BASELINE-005A). Historical commercial authority lives on reward_program_versions, not here.';
COMMENT ON COLUMN reward_programs.shared_loyalty_number_allowed IS
  'Current-value convenience projection only -- NOT historical authority. See reward_program_versions.shared_loyalty_number_allowed.';
