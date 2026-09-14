-- Verified Units (PLATFORM-BASELINE-006A; design §20).
--
-- verified_units: immutable issuance/reversal rows (TRD10 §10.11.1).
-- Cycle linkage lives ONLY in verified_unit_allocations (explicit
-- allocated|pending rows) — no nullable-cycle semantics here.
CREATE TABLE verified_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_record_id UUID NOT NULL,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  reward_program_id UUID NOT NULL,
  reward_program_version_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),  -- always positive; reversals too
  entry_type TEXT NOT NULL CHECK (entry_type IN ('credit','reversal')),
  -- C. copied identifiers must match the originating Purchase:
  CONSTRAINT verified_units_matches_purchase FOREIGN KEY
    (purchase_record_id, business_id, customer_identity_id,
     reward_program_id, reward_program_version_id)
    REFERENCES purchase_records (id, business_id, customer_identity_id,
     reward_program_id, reward_program_version_id) ON DELETE RESTRICT,
  -- Reversal provenance: separate immutable row referencing the
  -- exact original credit; never mutates/deletes the original.
  -- (No 006A reversal writer; the future correction command checks the
  -- remaining reversible quantity transactionally.)
  reverses_verified_unit_id UUID NULL REFERENCES verified_units (id) ON DELETE RESTRICT,
  correction_purchase_record_id UUID NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  reason_code TEXT NOT NULL,                        -- e.g. 'purchase_verified'
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT verified_units_reversal_shape CHECK (
    (entry_type = 'credit' AND reverses_verified_unit_id IS NULL
      AND correction_purchase_record_id IS NULL) OR
    (entry_type = 'reversal' AND reverses_verified_unit_id IS NOT NULL
      AND correction_purchase_record_id IS NOT NULL)),
  CONSTRAINT verified_units_no_self_reverse CHECK (
    reverses_verified_unit_id IS DISTINCT FROM id),
  -- Identity tuple proving the exact credit (business/customer/program/
  -- version scope) for allocation-scope FKs.
  CONSTRAINT verified_units_identity_tuple_unique UNIQUE
    (id, business_id, customer_identity_id, reward_program_id,
     reward_program_version_id)
);
CREATE UNIQUE INDEX verified_units_one_credit_per_purchase
  ON verified_units (purchase_record_id) WHERE entry_type = 'credit';
-- No duplicate/over-reversal for the same correction; remaining-reversible
-- quantity (sum(reversals) <= credit quantity) checked in-transaction by
-- the future correction command (no 006A reversal writer).
CREATE UNIQUE INDEX verified_units_one_reversal_per_credit_per_correction
  ON verified_units (reverses_verified_unit_id, correction_purchase_record_id)
  WHERE entry_type = 'reversal';
CREATE INDEX verified_units_customer_program_idx
  ON verified_units (customer_identity_id, reward_program_id, entry_type);
