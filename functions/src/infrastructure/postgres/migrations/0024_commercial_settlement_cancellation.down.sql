-- Rollback for `0024_commercial_settlement_cancellation.sql` (WP-COM-03A).
--
-- FAILS CLOSED when governed evidence exists: any cancelled settlement. Those
-- rows are immutable cancellation evidence and a silent drop would discard it
-- irreversibly (and the restored 0023 status CHECK could not hold them);
-- recovery of a populated database requires a pre-0024 logical backup. The
-- migration touched no account, ledger, price, audit or standing row.
DO $$
DECLARE
  n INTEGER := 0;
BEGIN
  IF to_regclass('public.commercial_settlements') IS NOT NULL THEN
    SELECT COUNT(*) INTO n FROM public.commercial_settlements WHERE status = 'cancelled';
  END IF;
  IF n > 0 THEN
    RAISE EXCEPTION
      'WP-COM-03A / 0024: refusing to roll back -- this database holds % cancelled settlement row(s). Rolling back would irreversibly discard governed cancellation evidence. Roll back only a database with none, or restore a pre-0024 backup.', n;
  END IF;
END $$;

DROP TRIGGER commercial_ledger_reject_cancelled_settlement_reference ON commercial_ledger_entries;
DROP FUNCTION commercial_ledger_reject_cancelled_settlement_reference();

-- Restore the 0023 settlement shape and guard.
ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_cancel_key_unique;
ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_confirmation_consistency;
ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_status_check;
ALTER TABLE commercial_settlements
  DROP COLUMN cancelled_by,
  DROP COLUMN cancelled_at,
  DROP COLUMN cancel_reason_text,
  DROP COLUMN cancel_reference,
  DROP COLUMN cancel_idempotency_key,
  DROP COLUMN cancel_correlation_id;
ALTER TABLE commercial_settlements ADD CONSTRAINT commercial_settlements_status_check
  CHECK (status IN ('recorded', 'confirmed', 'voided'));
ALTER TABLE commercial_settlements ADD CONSTRAINT commercial_settlements_confirmation_consistency CHECK (
  (status = 'recorded'
     AND confirmed_by IS NULL AND confirmed_at IS NULL AND confirmation_note IS NULL
     AND confirm_idempotency_key IS NULL AND confirm_correlation_id IS NULL
     AND ledger_entry_id IS NULL
     AND voided_by IS NULL AND voided_at IS NULL AND void_reason_text IS NULL
     AND void_reference IS NULL AND void_idempotency_key IS NULL
     AND void_correlation_id IS NULL AND void_ledger_entry_id IS NULL)
  OR
  (status = 'confirmed'
     AND confirmed_by IS NOT NULL AND length(btrim(confirmed_by)) > 0 AND confirmed_at IS NOT NULL
     AND confirmation_note IS NOT NULL AND length(btrim(confirmation_note)) > 0
     AND confirm_idempotency_key IS NOT NULL AND length(btrim(confirm_idempotency_key)) > 0
     AND confirm_correlation_id IS NOT NULL
     AND ledger_entry_id IS NOT NULL
     AND voided_by IS NULL AND voided_at IS NULL AND void_reason_text IS NULL
     AND void_reference IS NULL AND void_idempotency_key IS NULL
     AND void_correlation_id IS NULL AND void_ledger_entry_id IS NULL)
  OR
  (status = 'voided'
     AND confirmed_by IS NOT NULL AND length(btrim(confirmed_by)) > 0 AND confirmed_at IS NOT NULL
     AND confirmation_note IS NOT NULL AND length(btrim(confirmation_note)) > 0
     AND confirm_idempotency_key IS NOT NULL AND length(btrim(confirm_idempotency_key)) > 0
     AND confirm_correlation_id IS NOT NULL
     AND ledger_entry_id IS NOT NULL
     AND voided_by IS NOT NULL AND length(btrim(voided_by)) > 0 AND voided_at IS NOT NULL
     AND void_reason_text IS NOT NULL AND length(btrim(void_reason_text)) > 0
     AND void_reference IS NOT NULL AND length(btrim(void_reference)) > 0
     AND void_idempotency_key IS NOT NULL AND length(btrim(void_idempotency_key)) > 0
     AND void_correlation_id IS NOT NULL
     AND void_ledger_entry_id IS NOT NULL)
);

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
    IF (NEW.confirmed_by, NEW.confirmed_at, NEW.confirmation_note, NEW.confirm_idempotency_key,
        NEW.confirm_correlation_id, NEW.ledger_entry_id)
       IS DISTINCT FROM
       (OLD.confirmed_by, OLD.confirmed_at, OLD.confirmation_note, OLD.confirm_idempotency_key,
        OLD.confirm_correlation_id, OLD.ledger_entry_id) THEN
      RAISE EXCEPTION 'WP-COM-03: a settlement void must not alter the settlement''s confirmation or original credit reference'
        USING ERRCODE = 'restrict_violation';
    END IF;
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
