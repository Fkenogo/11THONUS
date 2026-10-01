-- WP-COM-05b — Commercial admission gate: admissions, reservation provenance and
-- earmarks (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §8.4, §8.5, §8.5.1, §20, §22).
--
-- ADDITIVE. Two new Commercial tables, one new foreign key on the WP-COM-04
-- consumption event (the `earmark_id` column 0025 left as a plain UUID), and
-- guard triggers. No existing column is changed, no data is seeded, and no
-- Loyalty / Purchase table is altered (their ONLY new relationship is that the
-- immutable admission row REFERENCES a Purchase and a Verified Unit -- design
-- §4.4 R4/R5: both parents are never locked FOR UPDATE by another commercial
-- transaction type, and the child is written by the transaction that already
-- holds the Purchase lock and has ALREADY inserted the Verified Unit row).
--
-- Deliberately NOT created here: payment-provider schema, scheduler tables,
-- Operator read models, notification intents (later work packages).
--
-- Parent-before-child (CORR-002): the foreign keys below are IMMEDIATE (no
-- DEFERRABLE on any foreign key). A transaction must insert the Verified Unit
-- BEFORE the admission row that references it; a violation fails at the
-- statement, not at COMMIT.

-- ---------------------------------------------------------------------------
-- commercial_admissions: one immutable row per Purchase that STARTED new Circle
-- position(s) through the gate. A Purchase that continues an already-admitted
-- position takes no Commercial lock and writes no admission (active-Circle
-- grace, design §8.3/§8.7).
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL
    REFERENCES commercial_accounts (business_id) ON DELETE RESTRICT,   -- Commercial-internal (R11)
  -- R5: the admitting transaction already holds this Purchase FOR UPDATE.
  purchase_record_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  -- R4: the Verified Unit row was inserted BEFORE this row in the same transaction.
  verified_unit_id UUID NOT NULL REFERENCES verified_units (id) ON DELETE RESTRICT,
  -- The `capacity_reserved` ledger entry that made the reservation (parent-first).
  ledger_entry_id UUID NOT NULL REFERENCES commercial_ledger_entries (id) ON DELETE RESTRICT,
  blocks_reserved INTEGER NOT NULL CHECK (blocks_reserved >= 1),
  -- The Circle positions this admission began: block indexes first .. first+blocks-1
  -- (block_index = Circle sequence_number, design §8.5.1).
  first_block_index INTEGER NOT NULL CHECK (first_block_index >= 1),
  -- Opaque stream digest (no raw customer identity in Commercial).
  stream_ref TEXT NOT NULL CHECK (length(btrim(stream_ref)) > 0),
  decided_by TEXT NOT NULL CHECK (decided_by IN ('customer_verify', 'admission_processor')),
  -- Reservation basis read under the account lock: the decision is reproducible.
  account_version BIGINT NOT NULL CHECK (account_version >= 0),
  available_before INTEGER NOT NULL,                 -- may be any sign in principle; admission needs >= blocks
  reserved_before INTEGER NOT NULL CHECK (reserved_before >= 0),
  -- Admission idempotency scope: `admit:<purchase_id>` (reserved only after a locked ADMIT).
  admission_scope_key TEXT NOT NULL CHECK (length(btrim(admission_scope_key)) > 0),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commercial_admissions_purchase_unique UNIQUE (purchase_record_id),
  CONSTRAINT commercial_admissions_verified_unit_unique UNIQUE (verified_unit_id),
  CONSTRAINT commercial_admissions_ledger_entry_unique UNIQUE (ledger_entry_id),
  CONSTRAINT commercial_admissions_scope_unique UNIQUE (admission_scope_key),
  -- Lets blocks prove they belong to this admission and Business.
  CONSTRAINT commercial_admissions_identity_unique UNIQUE (id, business_id)
);

COMMENT ON TABLE commercial_admissions IS
  'WP-COM-05b: immutable record that a Purchase was commercially ADMITTED and began new Circle position(s). Written only after the Verified Unit row exists, under the Commercial account lock. Never written for a HOLD.';

CREATE INDEX commercial_admissions_business_time ON commercial_admissions (business_id, decided_at);

-- ---------------------------------------------------------------------------
-- commercial_admission_blocks: the EARMARK. One immutable row per Circle
-- position, fixing the funding bucket at ADMIT time (INV-CAP-PROV). The bucket
-- is never re-derived from balances afterwards.
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_admission_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id UUID NOT NULL,
  business_id TEXT NOT NULL CHECK (length(btrim(business_id)) > 0),
  stream_ref TEXT NOT NULL CHECK (length(btrim(stream_ref)) > 0),
  block_index INTEGER NOT NULL CHECK (block_index >= 1),
  funding_bucket TEXT NOT NULL CHECK (funding_bucket IN ('trial', 'paid')),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  earmarked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Commercial-internal: proves the block belongs to that admission and Business.
  CONSTRAINT commercial_admission_blocks_admission_fk
    FOREIGN KEY (admission_id, business_id)
    REFERENCES commercial_admissions (id, business_id) ON DELETE RESTRICT,
  -- A Circle position of a stream is earmarked exactly once.
  CONSTRAINT commercial_admission_blocks_position_unique
    UNIQUE (business_id, stream_ref, block_index)
);

COMMENT ON TABLE commercial_admission_blocks IS
  'WP-COM-05b: immutable earmark (INV-CAP-PROV). One row per Circle position: funding bucket chosen at ADMIT time under the account lock; consumed at most once by a consumption event; never reclassified.';

CREATE INDEX commercial_admission_blocks_admission ON commercial_admission_blocks (admission_id);

-- Immutability (insert-and-read only), like every money-affecting Commercial row.
CREATE TRIGGER commercial_admissions_immutable
  BEFORE UPDATE OR DELETE ON commercial_admissions
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_admissions_no_truncate
  BEFORE TRUNCATE ON commercial_admissions
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_admission_blocks_immutable
  BEFORE UPDATE OR DELETE ON commercial_admission_blocks
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_admission_blocks_no_truncate
  BEFORE TRUNCATE ON commercial_admission_blocks
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- An admission must be exactly what its reservation ledger entry says: a
-- `capacity_reserved` entry of the same Business whose reserved deltas equal
-- the number of trial / paid earmarks. Checked at COMMIT (deferred) so the
-- ledger entry, admission and blocks may be inserted in design order. A
-- reservation can therefore never be committed without its earmarks, nor
-- earmarks without the matching reservation ("no hidden capacity creation").
-- ---------------------------------------------------------------------------
CREATE FUNCTION commercial_admission_assert_consistent() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  adm commercial_admissions%ROWTYPE;
  led commercial_ledger_entries%ROWTYPE;
  n_total INTEGER;
  n_trial INTEGER;
  n_paid INTEGER;
  adm_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'commercial_admissions' THEN
    adm_id := NEW.id;
  ELSE
    adm_id := NEW.admission_id;
  END IF;
  SELECT * INTO adm FROM commercial_admissions WHERE id = adm_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT * INTO led FROM commercial_ledger_entries WHERE id = adm.ledger_entry_id;
  IF NOT FOUND OR led.entry_type <> 'capacity_reserved' OR led.business_id <> adm.business_id
     OR led.idempotency_scope_key <> 'reserve:' || adm.verified_unit_id::text THEN
    RAISE EXCEPTION 'WP-COM-05b: admission % must reference its own capacity_reserved ledger entry (scope reserve:<verified unit>) of the same Business', adm.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  SELECT COUNT(*), COUNT(*) FILTER (WHERE funding_bucket = 'trial'),
         COUNT(*) FILTER (WHERE funding_bucket = 'paid')
    INTO n_total, n_trial, n_paid
    FROM commercial_admission_blocks WHERE admission_id = adm.id;
  IF n_total <> adm.blocks_reserved
     OR n_trial <> led.trial_reserved_delta OR n_paid <> led.paid_reserved_delta THEN
    RAISE EXCEPTION 'WP-COM-05b: admission % earmarks (total %, trial %, paid %) do not equal its reservation (blocks %, trial delta %, paid delta %)',
      adm.id, n_total, n_trial, n_paid, adm.blocks_reserved, led.trial_reserved_delta, led.paid_reserved_delta
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER commercial_admissions_consistent
  AFTER INSERT ON commercial_admissions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION commercial_admission_assert_consistent();
CREATE CONSTRAINT TRIGGER commercial_admission_blocks_consistent
  AFTER INSERT ON commercial_admission_blocks
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION commercial_admission_assert_consistent();

-- ---------------------------------------------------------------------------
-- WP-COM-04 integration: the consumption event's earmark_id now references the
-- earmark, and a consumption must debit exactly the earmarked bucket of the
-- same Business (INV-CAP-PROV: the bucket is never re-derived). The parent is
-- immutable and never locked FOR UPDATE, so the key-share cannot wait.
-- ---------------------------------------------------------------------------
ALTER TABLE commercial_consumption_events
  ADD CONSTRAINT commercial_consumption_events_earmark_fk
  FOREIGN KEY (earmark_id) REFERENCES commercial_admission_blocks (id) ON DELETE RESTRICT
  NOT VALID;
ALTER TABLE commercial_consumption_events VALIDATE CONSTRAINT commercial_consumption_events_earmark_fk;

CREATE FUNCTION commercial_consumption_events_earmark_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  blk commercial_admission_blocks%ROWTYPE;
BEGIN
  IF NEW.earmark_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT * INTO blk FROM commercial_admission_blocks WHERE id = NEW.earmark_id;
  IF NOT FOUND OR blk.business_id <> NEW.business_id OR blk.funding_bucket <> NEW.bucket THEN
    RAISE EXCEPTION 'WP-COM-05b: consumption event must debit the bucket (%) and Business of its earmark %', NEW.bucket, NEW.earmark_id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_consumption_events_earmark_guard
  BEFORE INSERT ON commercial_consumption_events
  FOR EACH ROW EXECUTE FUNCTION commercial_consumption_events_earmark_guard();
