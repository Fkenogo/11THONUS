-- Reverse of 0018_purchase_records_qualifying_item.sql.
--
-- Always safe: the column is purely additive and, at rollback time, the
-- application that wrote it is reverted in the same atomic unit
-- (PLATFORM-BASELINE-013C reverts backend + UI together, per PB-012 SS16).
-- Dropping the constraints first, then the column, leaves every legacy row
-- byte-for-byte as it was (the column held no value for rows recorded
-- before this migration).
ALTER TABLE purchase_records DROP CONSTRAINT IF EXISTS purchase_records_item_in_version;
ALTER TABLE purchase_records DROP CONSTRAINT IF EXISTS purchase_records_item_in_business;
DROP INDEX IF EXISTS purchase_records_qualifying_item_idx;
ALTER TABLE purchase_records DROP COLUMN IF EXISTS qualifying_item_id;
