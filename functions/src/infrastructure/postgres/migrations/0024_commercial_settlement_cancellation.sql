-- WP-COM-03A — Commercial recorded-settlement cancellation: lifecycle extension
-- (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §10; closes WP-COM-03 deviation D3).
--
-- Adds ONLY the `cancelled` settlement status and its immutable provenance.
-- Lifecycle after this migration:
--   recorded  -> confirmed   (unchanged; grants exactly one paid credit)
--   recorded  -> cancelled   (NEW; the evidence entry was withdrawn BEFORE any credit)
--   confirmed -> voided      (unchanged; the compensating path for granted credit)
-- Every other transition -- cancelled -> anything, confirmed -> cancelled,
-- voided -> cancelled -- is rejected by the database.
--
-- A cancellation has NO ledger effect: it appends no ledger entry, touches no
-- account, price, Loyalty or standing row, and is never a payment refund.
-- Cancellation provenance is stored on the settlement row (like confirm/void),
-- and the Commercial audit row is written by the command.
--
-- ADDITIVE: no table is created or dropped, and no existing column or row is
-- altered. Existing recorded / confirmed / voided rows remain valid. The only
-- object attached outside `commercial_settlements` is one BEFORE INSERT trigger
-- on `commercial_ledger_entries` (see section 3) that makes "a cancelled
-- settlement can never hold credit" a database fact instead of a service rule.
--
-- Deliberately NOT created (later packages): admissions / earmarks /
-- pending_admission, consumption projection, scheduler tables, Operator read
-- models, payment-provider columns.

-- ---------------------------------------------------------------------------
-- 1. Cancellation provenance columns (all NULL unless status = 'cancelled')
-- ---------------------------------------------------------------------------
ALTER TABLE commercial_settlements
  ADD COLUMN cancelled_by TEXT NULL,
  ADD COLUMN cancelled_at TIMESTAMPTZ NULL,
  ADD COLUMN cancel_reason_text TEXT NULL,
  ADD COLUMN cancel_reference TEXT NULL,
  ADD COLUMN cancel_idempotency_key TEXT NULL,
  ADD COLUMN cancel_correlation_id TEXT NULL;

ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_status_check;
ALTER TABLE commercial_settlements ADD CONSTRAINT commercial_settlements_status_check
  CHECK (status IN ('recorded', 'confirmed', 'voided', 'cancelled'));

-- Replaces the 0023 lifecycle CHECK. Every text column is tested IS NOT NULL
-- first: a NULL inside length(btrim(..)) > 0 is UNKNOWN, which a CHECK accepts.
-- A cancelled row needs COMPLETE cancellation provenance and no confirmation,
-- void or ledger data; every other status carries no cancellation data.
ALTER TABLE commercial_settlements DROP CONSTRAINT commercial_settlements_confirmation_consistency;
ALTER TABLE commercial_settlements ADD CONSTRAINT commercial_settlements_confirmation_consistency CHECK (
  -- recorded: nothing finalised, voided or cancelled
  (status = 'recorded'
     AND confirmed_by IS NULL AND confirmed_at IS NULL AND confirmation_note IS NULL
     AND confirm_idempotency_key IS NULL AND confirm_correlation_id IS NULL
     AND ledger_entry_id IS NULL
     AND voided_by IS NULL AND voided_at IS NULL AND void_reason_text IS NULL
     AND void_reference IS NULL AND void_idempotency_key IS NULL
     AND void_correlation_id IS NULL AND void_ledger_entry_id IS NULL
     AND cancelled_by IS NULL AND cancelled_at IS NULL AND cancel_reason_text IS NULL
     AND cancel_reference IS NULL AND cancel_idempotency_key IS NULL
     AND cancel_correlation_id IS NULL)
  OR
  -- confirmed: finalised, not voided, not cancelled
  (status = 'confirmed'
     AND confirmed_by IS NOT NULL AND length(btrim(confirmed_by)) > 0 AND confirmed_at IS NOT NULL
     AND confirmation_note IS NOT NULL AND length(btrim(confirmation_note)) > 0
     AND confirm_idempotency_key IS NOT NULL AND length(btrim(confirm_idempotency_key)) > 0
     AND confirm_correlation_id IS NOT NULL
     AND ledger_entry_id IS NOT NULL
     AND voided_by IS NULL AND voided_at IS NULL AND void_reason_text IS NULL
     AND void_reference IS NULL AND void_idempotency_key IS NULL
     AND void_correlation_id IS NULL AND void_ledger_entry_id IS NULL
     AND cancelled_by IS NULL AND cancelled_at IS NULL AND cancel_reason_text IS NULL
     AND cancel_reference IS NULL AND cancel_idempotency_key IS NULL
     AND cancel_correlation_id IS NULL)
  OR
  -- voided: was confirmed (its confirmation provenance is retained), now voided, never cancelled
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
     AND void_ledger_entry_id IS NOT NULL
     AND cancelled_by IS NULL AND cancelled_at IS NULL AND cancel_reason_text IS NULL
     AND cancel_reference IS NULL AND cancel_idempotency_key IS NULL
     AND cancel_correlation_id IS NULL)
  OR
  -- cancelled: recorded evidence withdrawn before confirmation; never any credit
  (status = 'cancelled'
     AND confirmed_by IS NULL AND confirmed_at IS NULL AND confirmation_note IS NULL
     AND confirm_idempotency_key IS NULL AND confirm_correlation_id IS NULL
     AND ledger_entry_id IS NULL
     AND voided_by IS NULL AND voided_at IS NULL AND void_reason_text IS NULL
     AND void_reference IS NULL AND void_idempotency_key IS NULL
     AND void_correlation_id IS NULL AND void_ledger_entry_id IS NULL
     AND cancelled_by IS NOT NULL AND length(btrim(cancelled_by)) > 0 AND cancelled_at IS NOT NULL
     AND cancel_reason_text IS NOT NULL AND length(btrim(cancel_reason_text)) > 0
     AND cancel_reference IS NOT NULL AND length(btrim(cancel_reference)) > 0
     AND cancel_idempotency_key IS NOT NULL AND length(btrim(cancel_idempotency_key)) > 0
     AND cancel_correlation_id IS NOT NULL)
);

ALTER TABLE commercial_settlements
  ADD CONSTRAINT commercial_settlements_cancel_key_unique UNIQUE (cancel_idempotency_key);

-- ---------------------------------------------------------------------------
-- 2. Replaced transition guard. Permitted transitions:
--      recorded  -> confirmed  (unchanged from 0022/0023)
--      confirmed -> voided     (unchanged from 0023)
--      recorded  -> cancelled  (new)
--    Every evidence / pricing column is frozen on every transition.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION commercial_settlements_update_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  entry commercial_ledger_entries%ROWTYPE;
BEGIN
  IF NOT ((OLD.status = 'recorded' AND NEW.status IN ('confirmed', 'cancelled'))
       OR (OLD.status = 'confirmed' AND NEW.status = 'voided')) THEN
    RAISE EXCEPTION 'WP-COM-02/03/03A: settlement status may only change recorded -> confirmed, recorded -> cancelled or confirmed -> voided (was %, attempted %)', OLD.status, NEW.status
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
  ELSIF NEW.status = 'cancelled' THEN
    -- recorded -> cancelled: the settlement never granted credit, so NO ledger entry of any
    -- type may reference it (the CHECK already forces every confirm/void column to NULL).
    IF EXISTS (
      SELECT 1 FROM commercial_ledger_entries
       WHERE business_id = NEW.business_id
         AND source_reference_type = 'settlement'
         AND source_reference_id = NEW.id::text
    ) THEN
      RAISE EXCEPTION 'WP-COM-03A: settlement % cannot be cancelled: a ledger entry already references it', NEW.id
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

-- ---------------------------------------------------------------------------
-- 3. A cancelled settlement can never hold credit. The settlement guard above
--    stops a cancel once any ledger entry references the settlement; this
--    trigger stops any ledger entry from referencing a settlement that is
--    already cancelled. FOR SHARE takes a row lock that conflicts with the
--    cancelling UPDATE, so the two orders serialise: whichever commits first
--    makes the other fail (READ COMMITTED re-evaluates after the lock wait).
--    It only reads `commercial_settlements` and never modifies or deletes any
--    ledger row (the ledger's own immutability triggers are untouched).
-- ---------------------------------------------------------------------------
CREATE FUNCTION commercial_ledger_reject_cancelled_settlement_reference() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  settlement_status TEXT;
BEGIN
  IF NEW.source_reference_type = 'settlement'
     AND NEW.source_reference_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT status INTO settlement_status
      FROM commercial_settlements
     WHERE id = NEW.source_reference_id::uuid
       FOR SHARE;
    IF settlement_status = 'cancelled' THEN
      RAISE EXCEPTION 'WP-COM-03A: settlement % is cancelled and can never hold a ledger entry', NEW.source_reference_id
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_ledger_reject_cancelled_settlement_reference
  BEFORE INSERT ON commercial_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION commercial_ledger_reject_cancelled_settlement_reference();
