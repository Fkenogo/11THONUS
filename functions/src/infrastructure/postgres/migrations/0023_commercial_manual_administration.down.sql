-- Rollback for `0023_commercial_manual_administration.sql` (WP-COM-03).
--
-- FAILS CLOSED when governed evidence exists: any trial grant, manual
-- adjustment, or voided settlement. Those rows are immutable, money-affecting
-- evidence and a silent drop would discard it irreversibly; recovery of a
-- populated database requires a pre-0023 logical backup. The migration
-- touched no account, ledger, price, audit or standing table.
DO $$
DECLARE
  n INTEGER := 0;
  c INTEGER;
BEGIN
  IF to_regclass('public.commercial_trial_grants') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_trial_grants; n := n + c;
  END IF;
  IF to_regclass('public.commercial_manual_adjustments') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_manual_adjustments; n := n + c;
  END IF;
  IF to_regclass('public.commercial_settlements') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_settlements WHERE status = 'voided'; n := n + c;
  END IF;
  IF n > 0 THEN
    RAISE EXCEPTION
      'WP-COM-03 / 0023: refusing to roll back -- this database holds % trial grant / manual adjustment / voided settlement row(s). Rolling back would irreversibly discard governed commercial evidence. Roll back only a database with none, or restore a pre-0023 backup.', n;
  END IF;
END $$;

DROP INDEX commercial_ledger_one_void_reversal_per_settlement;

-- Restore the 0022 settlement shape and guard.
ALTER TABLE commercial_settlements
  DROP CONSTRAINT commercial_settlements_void_key_unique,
  DROP CONSTRAINT commercial_settlements_void_ledger_entry_unique;
ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_confirmation_consistency;
ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_status_check;
ALTER TABLE commercial_settlements
  DROP COLUMN voided_by,
  DROP COLUMN voided_at,
  DROP COLUMN void_reason_text,
  DROP COLUMN void_reference,
  DROP COLUMN void_idempotency_key,
  DROP COLUMN void_correlation_id,
  DROP COLUMN void_ledger_entry_id;
ALTER TABLE commercial_settlements ADD CONSTRAINT commercial_settlements_status_check
  CHECK (status IN ('recorded', 'confirmed'));
ALTER TABLE commercial_settlements ADD CONSTRAINT commercial_settlements_confirmation_consistency CHECK (
  (status = 'recorded'
     AND confirmed_by IS NULL AND confirmed_at IS NULL AND confirmation_note IS NULL
     AND confirm_idempotency_key IS NULL AND confirm_correlation_id IS NULL
     AND ledger_entry_id IS NULL)
  OR
  (status = 'confirmed'
     AND length(btrim(confirmed_by)) > 0 AND confirmed_at IS NOT NULL
     AND length(btrim(confirmation_note)) > 0
     AND length(btrim(confirm_idempotency_key)) > 0 AND confirm_correlation_id IS NOT NULL
     AND ledger_entry_id IS NOT NULL)
);

CREATE OR REPLACE FUNCTION commercial_settlements_update_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  entry commercial_ledger_entries%ROWTYPE;
BEGIN
  IF OLD.status <> 'recorded' OR NEW.status <> 'confirmed' THEN
    RAISE EXCEPTION 'WP-COM-02: settlement status may only change recorded -> confirmed (was %, attempted %)', OLD.status, NEW.status
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
  RETURN NEW;
END;
$$;

DROP TABLE commercial_manual_adjustments;
DROP TABLE commercial_trial_grants;
DROP FUNCTION commercial_manual_adjustments_guard();
DROP FUNCTION commercial_trial_grants_guard();
