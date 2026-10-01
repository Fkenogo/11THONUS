-- Rollback for `0026_purchase_pending_admission.sql` (WP-COM-05a).
--
-- FAILS CLOSED when any Purchase is `pending_admission`: such a row is a valid,
-- preserved customer purchase that has not been admitted; restoring the 0008
-- status CHECK could not hold it, and silently re-labelling or deleting it
-- would lose governed purchase evidence. Recovery of a populated database
-- requires admitting/resolving those purchases first or restoring a pre-0026
-- logical backup. The migration touched no other row and no Loyalty table
-- other than `purchase_records`.
DO $$
DECLARE
  n INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO n FROM public.purchase_records WHERE status = 'pending_admission';
  IF n > 0 THEN
    RAISE EXCEPTION
      'WP-COM-05a / 0026: refusing to roll back -- this database holds % pending_admission Purchase Record(s). Rolling back would orphan valid preserved purchases. Admit them first, or restore a pre-0026 backup.', n;
  END IF;
END $$;

DROP INDEX IF EXISTS purchase_records_pending_admission_customer_idx;
DROP INDEX IF EXISTS purchase_records_pending_admission_fifo_idx;
DROP TRIGGER IF EXISTS purchase_records_pending_admission_guard ON purchase_records;
DROP FUNCTION IF EXISTS purchase_records_pending_admission_guard();

ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_verified_fields;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_verified_fields CHECK (
    (status = 'waiting_for_customer'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'verified' AND verified_at IS NOT NULL
      AND rejection_reason IS NULL AND dispute_reason IS NULL) OR
    (status = 'rejected' AND rejection_reason IS NOT NULL
      AND dispute_reason IS NULL) OR
    (status = 'under_review' AND dispute_reason IS NOT NULL
      AND rejection_reason IS NULL) OR
    (status IN ('corrected','cancelled','expired','archived')));

ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_status_check;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_status_check
  CHECK (status IN ('waiting_for_customer','verified','rejected','under_review',
                    'corrected','cancelled','expired','archived'));
