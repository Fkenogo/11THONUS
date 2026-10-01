-- WP-COM-05a: Purchase `pending_admission` state foundation
-- (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §8.8/§8.9/§8.16).
--
-- Purchase-domain schema ONLY. Adds one governed status to `purchase_records`:
--
--   pending_admission = the Purchase has been received and preserved; it is not
--   invalid; it has NOT been admitted into Loyalty. verified_at stays NULL
--   ("the moment loyalty credit was issued"), no reason field is set, and no
--   Verified Unit, allocation, Cycle position or Reward exists for it.
--
-- Allowed edges (enforced by the guard trigger below AND by the commands'
-- conditional `UPDATE ... WHERE status = <from>` transitions):
--
--   waiting_for_customer -> pending_admission   (future hold; no writer in WP-COM-05a)
--   pending_admission    -> verified            (admission via admitPurchaseToLoyalty)
--
-- Nothing else leaves or enters `pending_admission`: no reject, dispute, cancel
-- or expiry edge is created for it. No column is added -- the hold provenance
-- (the customer's confirmation actor/time) is carried by the existing
-- `purchase_record_events` row (to_status is free text), exactly as designed.
--
-- NOT added (deferred to WP-COM-05b and later): Commercial admission
-- earmarks/events, capacity reservations, gate state, scheduler/retry tables,
-- read-model schema. The Commercial gate stays OFF; no row is written into the
-- new state by any code path in this package.

-- Re-runnable by design (like 0025's index): the Commercial test helpers un-record
-- Commercial migrations and re-apply them over an existing loyalty schema.
--
-- 1. Status vocabulary (add the value; existing rows are unaffected).
ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_status_check;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_status_check
  CHECK (status IN ('waiting_for_customer','pending_admission','verified','rejected',
                    'under_review','corrected','cancelled','expired','archived'))
  NOT VALID;
ALTER TABLE purchase_records VALIDATE CONSTRAINT purchase_records_status_check;

-- 2. State integrity: pending_admission carries no verdict facts and no
--    verified_at (credit has not been issued).
ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_verified_fields;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_verified_fields CHECK (
    (status = 'waiting_for_customer'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'pending_admission'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'verified' AND verified_at IS NOT NULL
      AND rejection_reason IS NULL AND dispute_reason IS NULL) OR
    (status = 'rejected' AND rejection_reason IS NOT NULL
      AND dispute_reason IS NULL) OR
    (status = 'under_review' AND dispute_reason IS NOT NULL
      AND rejection_reason IS NULL) OR
    (status IN ('corrected','cancelled','expired','archived')))
  NOT VALID;
ALTER TABLE purchase_records VALIDATE CONSTRAINT purchase_records_verified_fields;

-- 3. Transition guard for the NEW state only. Existing edges between the other
--    statuses are deliberately not re-governed here (no behaviour change).
CREATE OR REPLACE FUNCTION purchase_records_pending_admission_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending_admission' THEN
      RAISE EXCEPTION 'purchase_records: a Purchase cannot be created in pending_admission'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.status = 'pending_admission' AND NEW.status NOT IN ('pending_admission','verified') THEN
    RAISE EXCEPTION 'purchase_records: pending_admission may only transition to verified (attempted: %)', NEW.status
      USING ERRCODE = '23514';
  END IF;
  IF NEW.status = 'pending_admission' AND OLD.status NOT IN ('waiting_for_customer','pending_admission') THEN
    RAISE EXCEPTION 'purchase_records: pending_admission may only be entered from waiting_for_customer (attempted from: %)', OLD.status
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS purchase_records_pending_admission_guard ON purchase_records;
CREATE TRIGGER purchase_records_pending_admission_guard
  BEFORE INSERT OR UPDATE OF status ON purchase_records
  FOR EACH ROW EXECUTE FUNCTION purchase_records_pending_admission_guard();

-- 4. Partial indexes for the later admission processor / per-stream checks
--    (design §8.16). Empty while the gate is OFF.
CREATE INDEX IF NOT EXISTS purchase_records_pending_admission_fifo_idx
  ON purchase_records (business_id, purchase_date, id)
  WHERE status = 'pending_admission';
CREATE INDEX IF NOT EXISTS purchase_records_pending_admission_customer_idx
  ON purchase_records (customer_identity_id, created_at DESC)
  WHERE status = 'pending_admission';
