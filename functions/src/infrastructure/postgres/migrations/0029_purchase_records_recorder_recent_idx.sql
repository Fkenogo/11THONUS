-- 0029 (EA-BL-001-CORR-002-B): additive index for the Staff Counter's "my recent submissions" read.
--
-- Query shape (purchaseRecordRepository.listRecentPurchaseRecordsByRecorder):
--   WHERE business_id = $1 AND recorded_by_user_id = $2
--   ORDER BY created_at DESC, id DESC LIMIT n
-- No existing purchase index leads with the recorder (business_status is (business_id, status,
-- created_at); the BR queue index is partial), so without this the LIMIT cannot avoid scanning and
-- sorting a Business's whole history. Additive only: no table, column, constraint or data change.
CREATE INDEX IF NOT EXISTS purchase_records_recorder_recent_idx
  ON purchase_records (business_id, recorded_by_user_id, created_at DESC, id DESC);
