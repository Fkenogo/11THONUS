-- Reverse of 0030_item_specific_circle_additive_foundation.sql.
-- Purely additive rollback in reverse dependency order:
-- Drops indexes, constraints, and nullable columns across the 5 tables.

-- rewards
DROP INDEX IF EXISTS rewards_qualifying_item_idx;
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_item_in_version;
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_item_in_business;
ALTER TABLE rewards DROP COLUMN IF EXISTS qualifying_item_id;

-- verified_unit_allocations
DROP INDEX IF EXISTS verified_unit_allocations_qualifying_item_idx;
ALTER TABLE verified_unit_allocations DROP CONSTRAINT IF EXISTS verified_unit_allocations_item_in_version;
ALTER TABLE verified_unit_allocations DROP CONSTRAINT IF EXISTS verified_unit_allocations_item_in_business;
ALTER TABLE verified_unit_allocations DROP COLUMN IF EXISTS qualifying_item_id;

-- loyalty_cycles
DROP INDEX IF EXISTS loyalty_cycles_qualifying_item_idx;
ALTER TABLE loyalty_cycles DROP CONSTRAINT IF EXISTS loyalty_cycles_item_in_version;
ALTER TABLE loyalty_cycles DROP CONSTRAINT IF EXISTS loyalty_cycles_item_in_business;
ALTER TABLE loyalty_cycles DROP COLUMN IF EXISTS qualifying_item_id;

-- loyalty_cycle_streams
DROP INDEX IF EXISTS loyalty_cycle_streams_qualifying_item_idx;
ALTER TABLE loyalty_cycle_streams DROP CONSTRAINT IF EXISTS loyalty_cycle_streams_item_in_business;
ALTER TABLE loyalty_cycle_streams DROP COLUMN IF EXISTS qualifying_item_id;

-- verified_units
DROP INDEX IF EXISTS verified_units_qualifying_item_idx;
ALTER TABLE verified_units DROP CONSTRAINT IF EXISTS verified_units_item_in_version;
ALTER TABLE verified_units DROP CONSTRAINT IF EXISTS verified_units_item_in_business;
ALTER TABLE verified_units DROP COLUMN IF EXISTS qualifying_item_id;
