-- WP-COM-03 — Commercial manual administration commands: provenance schema
-- (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §9, §10.3, §10.4, §15, §20).
--
-- Adds ONLY what the manual commands need, and touches nothing outside
-- `commercial_*`:
--   1. commercial_trial_grants        -- every trial grant (units 3..5 CHECK)
--   2. commercial_manual_adjustments  -- every trial / paid-credit adjustment
--   3. commercial_settlements         -- widened: `voided` status + void columns
--      (the transition guard is replaced; confirm behaviour is unchanged)
--   4. one unique index: at most one void reversal per settlement
--
-- No account, ledger, price, audit or standing table is altered. The
-- `commercial_settlements` changes widen a table created by 0022 in this same
-- programme; no data exists in any deployed database.
--
-- Deliberately NOT created (later packages): admissions / earmarks /
-- pending_admission, consumption claims and events, notification intents,
-- scheduler tables, read-model views, payment-provider columns.
--
-- Product Truth encoded / NOT encoded:
--   * the governed 3..5 range is a CHECK on ONE grant only. It is NOT a
--     lifetime cap: there is no UNIQUE(business_id), and no aggregate limit.
--   * NO trial default, NO ceiling on adjustments, NO paid-balance floor or
--     maximum. Absence of a ceiling is not an authorisation of unlimited
--     adjustment; each row is an individually attributable, reasoned act.
--   * NO complimentary / pilot / partner / promotional reason code
--     (DEC-SUB-013 stays open).

-- ---------------------------------------------------------------------------
-- 1. Trial grants
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_trial_grants (
  id UUID PRIMARY KEY,
  business_id TEXT NOT NULL
    REFERENCES commercial_accounts (business_id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('initial')),
  -- Governed initial-grant range, per grant. Not a lifetime cap.
  units INTEGER NOT NULL CHECK (units BETWEEN 3 AND 5),
  granted_by TEXT NOT NULL CHECK (length(btrim(granted_by)) > 0),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason_code TEXT NULL,
  reason_text TEXT NOT NULL CHECK (length(btrim(reason_text)) > 0),
  reference TEXT NOT NULL CHECK (length(btrim(reference)) > 0),
  ledger_entry_id UUID NOT NULL
    REFERENCES commercial_ledger_entries (id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL CHECK (length(btrim(idempotency_key)) > 0),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT commercial_trial_grants_ledger_entry_unique UNIQUE (ledger_entry_id),
  CONSTRAINT commercial_trial_grants_idempotency_key_unique UNIQUE (idempotency_key)
);

COMMENT ON TABLE commercial_trial_grants IS
  'WP-COM-03: immutable record of every trial grant. units 3..5 per single grant; NOT a lifetime cap (a Business may hold several grants); no default value.';

CREATE INDEX commercial_trial_grants_business_time
  ON commercial_trial_grants (business_id, granted_at);

CREATE FUNCTION commercial_trial_grants_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  entry commercial_ledger_entries%ROWTYPE;
BEGIN
  SELECT * INTO entry FROM commercial_ledger_entries WHERE id = NEW.ledger_entry_id;
  IF NOT FOUND
     OR entry.business_id <> NEW.business_id
     OR entry.entry_type <> 'trial_grant'
     OR entry.bucket <> 'trial'
     OR entry.units_delta <> NEW.units
     OR entry.source_reference_type IS DISTINCT FROM 'trial_grant'
     OR entry.source_reference_id IS DISTINCT FROM NEW.id::text THEN
    RAISE EXCEPTION 'WP-COM-03: trial grant % must be backed by this Business''s trial_grant ledger entry for exactly its units referencing it', NEW.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_trial_grants_guard
  BEFORE INSERT ON commercial_trial_grants
  FOR EACH ROW EXECUTE FUNCTION commercial_trial_grants_guard();
CREATE TRIGGER commercial_trial_grants_immutable
  BEFORE UPDATE OR DELETE ON commercial_trial_grants
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_trial_grants_no_truncate
  BEFORE TRUNCATE ON commercial_trial_grants
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- 2. Manual adjustments (trial and paid credit)
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_manual_adjustments (
  id UUID PRIMARY KEY,
  business_id TEXT NOT NULL
    REFERENCES commercial_accounts (business_id) ON DELETE RESTRICT,
  bucket TEXT NOT NULL CHECK (bucket IN ('trial', 'paid')),
  -- Signed, never zero. No magnitude limit is encoded (no ceiling, no floor).
  units_delta INTEGER NOT NULL CHECK (units_delta <> 0),
  -- Paid-credit adjustments use the closed operational vocabulary (design
  -- §10.3). There is deliberately NO complimentary/pilot/partner/promotional
  -- code: that is the open DEC-SUB-013 question.
  reason_code TEXT NULL,
  reason_text TEXT NOT NULL CHECK (length(btrim(reason_text)) > 0),
  reference TEXT NOT NULL CHECK (length(btrim(reference)) > 0),
  created_by TEXT NOT NULL CHECK (length(btrim(created_by)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ledger_entry_id UUID NOT NULL
    REFERENCES commercial_ledger_entries (id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL CHECK (length(btrim(idempotency_key)) > 0),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT commercial_manual_adjustments_paid_reason_code CHECK (
    bucket <> 'paid'
    OR reason_code IN ('correction', 'settlement_reconciliation', 'dispute_resolution', 'error_reversal')
  ),
  CONSTRAINT commercial_manual_adjustments_ledger_entry_unique UNIQUE (ledger_entry_id),
  CONSTRAINT commercial_manual_adjustments_idempotency_key_unique UNIQUE (idempotency_key)
);

COMMENT ON TABLE commercial_manual_adjustments IS
  'WP-COM-03: immutable record of every manual trial / paid-credit adjustment. No aggregate or lifetime ceiling and no negative floor is governed or encoded; absence of a ceiling is not an authorisation of unlimited adjustment.';

CREATE INDEX commercial_manual_adjustments_business_time
  ON commercial_manual_adjustments (business_id, created_at);

CREATE FUNCTION commercial_manual_adjustments_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  entry commercial_ledger_entries%ROWTYPE;
  expected_type TEXT;
BEGIN
  -- Computed outside the IF: plpgsql ends an IF condition at the first THEN token.
  IF NEW.bucket = 'trial' THEN expected_type := 'trial_adjustment'; ELSE expected_type := 'credit_adjustment'; END IF;
  SELECT * INTO entry FROM commercial_ledger_entries WHERE id = NEW.ledger_entry_id;
  IF NOT FOUND
     OR entry.business_id <> NEW.business_id
     OR entry.bucket <> NEW.bucket
     OR entry.entry_type <> expected_type
     OR entry.units_delta <> NEW.units_delta
     OR entry.source_reference_type IS DISTINCT FROM 'manual_adjustment'
     OR entry.source_reference_id IS DISTINCT FROM NEW.id::text THEN
    RAISE EXCEPTION 'WP-COM-03: manual adjustment % must be backed by this Business''s matching adjustment ledger entry referencing it', NEW.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_manual_adjustments_guard
  BEFORE INSERT ON commercial_manual_adjustments
  FOR EACH ROW EXECUTE FUNCTION commercial_manual_adjustments_guard();
CREATE TRIGGER commercial_manual_adjustments_immutable
  BEFORE UPDATE OR DELETE ON commercial_manual_adjustments
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_manual_adjustments_no_truncate
  BEFORE TRUNCATE ON commercial_manual_adjustments
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- 3. Settlement void: `voided` status, void provenance, replaced guard.
--    A void NEVER touches the original credit: it appends a compensating
--    `settlement_void_reversal` ledger entry (design §10.4).
-- ---------------------------------------------------------------------------
ALTER TABLE commercial_settlements
  ADD COLUMN voided_by TEXT NULL,
  ADD COLUMN voided_at TIMESTAMPTZ NULL,
  ADD COLUMN void_reason_text TEXT NULL,
  ADD COLUMN void_reference TEXT NULL,
  ADD COLUMN void_idempotency_key TEXT NULL,
  ADD COLUMN void_correlation_id TEXT NULL,
  ADD COLUMN void_ledger_entry_id UUID NULL
    REFERENCES commercial_ledger_entries (id) ON DELETE RESTRICT;

ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_status_check;
ALTER TABLE commercial_settlements ADD CONSTRAINT commercial_settlements_status_check
  CHECK (status IN ('recorded', 'confirmed', 'voided'));

ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_confirmation_consistency;
ALTER TABLE commercial_settlements ADD CONSTRAINT commercial_settlements_confirmation_consistency CHECK (
  -- recorded: nothing finalised, nothing voided
  (status = 'recorded'
     AND confirmed_by IS NULL AND confirmed_at IS NULL AND confirmation_note IS NULL
     AND confirm_idempotency_key IS NULL AND confirm_correlation_id IS NULL
     AND ledger_entry_id IS NULL
     AND voided_by IS NULL AND voided_at IS NULL AND void_reason_text IS NULL
     AND void_reference IS NULL AND void_idempotency_key IS NULL
     AND void_correlation_id IS NULL AND void_ledger_entry_id IS NULL)
  OR
  -- confirmed: finalised, not voided
  (status = 'confirmed'
     AND length(btrim(confirmed_by)) > 0 AND confirmed_at IS NOT NULL
     AND length(btrim(confirmation_note)) > 0
     AND length(btrim(confirm_idempotency_key)) > 0 AND confirm_correlation_id IS NOT NULL
     AND ledger_entry_id IS NOT NULL
     AND voided_by IS NULL AND voided_at IS NULL AND void_reason_text IS NULL
     AND void_reference IS NULL AND void_idempotency_key IS NULL
     AND void_correlation_id IS NULL AND void_ledger_entry_id IS NULL)
  OR
  -- voided: was confirmed (its confirmation provenance is retained) and is now voided
  (status = 'voided'
     AND length(btrim(confirmed_by)) > 0 AND confirmed_at IS NOT NULL
     AND length(btrim(confirmation_note)) > 0
     AND length(btrim(confirm_idempotency_key)) > 0 AND confirm_correlation_id IS NOT NULL
     AND ledger_entry_id IS NOT NULL
     AND length(btrim(voided_by)) > 0 AND voided_at IS NOT NULL
     AND length(btrim(void_reason_text)) > 0 AND length(btrim(void_reference)) > 0
     AND length(btrim(void_idempotency_key)) > 0 AND void_correlation_id IS NOT NULL
     AND void_ledger_entry_id IS NOT NULL)
);

ALTER TABLE commercial_settlements
  ADD CONSTRAINT commercial_settlements_void_key_unique UNIQUE (void_idempotency_key),
  ADD CONSTRAINT commercial_settlements_void_ledger_entry_unique UNIQUE (void_ledger_entry_id);

-- At most one void reversal may reference a given settlement, whatever its scope key.
CREATE UNIQUE INDEX commercial_ledger_one_void_reversal_per_settlement
  ON commercial_ledger_entries (source_reference_id)
  WHERE entry_type = 'settlement_void_reversal' AND source_reference_type = 'settlement';

-- Replaces the 0022 guard. Permitted transitions:
--   recorded  -> confirmed  (unchanged from 0022)
--   confirmed -> voided     (new)
-- Every evidence / pricing / confirmation column is frozen on every transition,
-- and the backing ledger entry is verified.
CREATE OR REPLACE FUNCTION commercial_settlements_update_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  entry commercial_ledger_entries%ROWTYPE;
BEGIN
  IF NOT ((OLD.status = 'recorded' AND NEW.status = 'confirmed')
       OR (OLD.status = 'confirmed' AND NEW.status = 'voided')) THEN
    RAISE EXCEPTION 'WP-COM-02/03: settlement status may only change recorded -> confirmed or confirmed -> voided (was %, attempted %)', OLD.status, NEW.status
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW.id, NEW.business_id, NEW.source, NEW.method, NEW.external_reference, NEW.market,
      NEW.currency, NEW.amount_minor, NEW.units_purchased, NEW.received_at,
      NEW.price_schedule_id, NEW.unit_price_usd_minor, NEW.local_unit_price_minor,
      NEW.price_effective_from, NEW.expected_amount_minor, NEW.variance_minor,
      NEW.recorded_by, NEW.recorded_at, NEW.record_reason_text,
      NEW.record_idempotency_key, NEW.record_correlation_id, NEW.schema_version)
     IS DISTINCT FROM
     (OLD.id, OLD.business_id, OLD.source, OLD.method, OLD.external_reference, OLD.market,
      OLD.currency, OLD.amount_minor, OLD.units_purchased, OLD.received_at,
      OLD.price_schedule_id, OLD.unit_price_usd_minor, OLD.local_unit_price_minor,
      OLD.price_effective_from, OLD.expected_amount_minor, OLD.variance_minor,
      OLD.recorded_by, OLD.recorded_at, OLD.record_reason_text,
      OLD.record_idempotency_key, OLD.record_correlation_id, OLD.schema_version) THEN
    RAISE EXCEPTION 'WP-COM-02: settlement evidence and pricing provenance columns are immutable'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF NEW.status = 'confirmed' THEN
    SELECT * INTO entry FROM commercial_ledger_entries WHERE id = NEW.ledger_entry_id;
    IF NOT FOUND
       OR entry.business_id <> NEW.business_id
       OR entry.entry_type <> 'credit_grant'
       OR entry.bucket <> 'paid'
       OR entry.units_delta <> NEW.units_purchased
       OR entry.source_reference_type IS DISTINCT FROM 'settlement'
       OR entry.source_reference_id IS DISTINCT FROM NEW.id::text THEN
      RAISE EXCEPTION 'WP-COM-02: settlement % must be confirmed by a paid credit_grant for its own units in the same Business referencing it', NEW.id
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  ELSE
    -- confirmed -> voided: the confirmation (and its original credit) is retained verbatim...
    IF (NEW.confirmed_by, NEW.confirmed_at, NEW.confirmation_note, NEW.confirm_idempotency_key,
        NEW.confirm_correlation_id, NEW.ledger_entry_id)
       IS DISTINCT FROM
       (OLD.confirmed_by, OLD.confirmed_at, OLD.confirmation_note, OLD.confirm_idempotency_key,
        OLD.confirm_correlation_id, OLD.ledger_entry_id) THEN
      RAISE EXCEPTION 'WP-COM-03: a settlement void must not alter the settlement''s confirmation or original credit reference'
        USING ERRCODE = 'restrict_violation';
    END IF;
    -- ...and is compensated by exactly this Business's paid reversal of its units.
    SELECT * INTO entry FROM commercial_ledger_entries WHERE id = NEW.void_ledger_entry_id;
    IF NOT FOUND
       OR entry.business_id <> NEW.business_id
       OR entry.entry_type <> 'settlement_void_reversal'
       OR entry.bucket <> 'paid'
       OR entry.units_delta <> -NEW.units_purchased
       OR entry.source_reference_type IS DISTINCT FROM 'settlement'
       OR entry.source_reference_id IS DISTINCT FROM NEW.id::text THEN
      RAISE EXCEPTION 'WP-COM-03: settlement % must be voided by a paid settlement_void_reversal of exactly its units in the same Business referencing it', NEW.id
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
