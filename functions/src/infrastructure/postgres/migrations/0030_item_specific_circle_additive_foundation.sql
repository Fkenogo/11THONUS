-- Item-Specific Loyalty Circle Additive Foundation (PLATFORM-BASELINE / Package B).
--
-- Governing decisions:
--   * FD-LOY-ITEM-CIRCLE-001 / DEC-LOY-019 (CONFIRMED)
--   * DEC-LOY-002 as amended (active-Circle uniqueness invariant is item-specific)
--   * DEC-SUB-014 (commercial unit = completed 10-unit earning side of one item Circle)
--
-- PURPOSE:
-- Implements the SAFE ADDITIVE DATABASE FOUNDATION required for item-specific
-- Loyalty Circles without changing live loyalty behavior yet.
--
-- IMPORTANT COHERENCE NOTICE:
-- These columns are transitional and additive in Package B.
-- They are NOT YET loyalty authority.
-- Existing programme-scoped verification, stream locking, cycle resolution,
-- allocation, and reward creation continue to operate unchanged.
-- Final NOT NULL tightening, composite active-Circle uniqueness replacement,
-- item-specific stream primary key replacement, and allocation item equality
-- enforcement occur only after runtime cutover in later packages (Packages C, D, E).
--
-- TABLES AUGMENTED (5 core loyalty tables):
--   1. verified_units.qualifying_item_id (UUID NULL)
--      FK: verified_units_item_in_business -> qualifying_items(id, business_id)
--      FK: verified_units_item_in_version -> reward_program_version_qualifying_items(reward_program_version_id, qualifying_item_id)
--   2. loyalty_cycle_streams.qualifying_item_id (UUID NULL)
--      FK: loyalty_cycle_streams_item_in_business -> qualifying_items(id, business_id)
--   3. loyalty_cycles.qualifying_item_id (UUID NULL)
--      FK: loyalty_cycles_item_in_business -> qualifying_items(id, business_id)
--      FK: loyalty_cycles_item_in_version -> reward_program_version_qualifying_items(opened_under_version_id, qualifying_item_id)
--   4. verified_unit_allocations.qualifying_item_id (UUID NULL)
--      FK: verified_unit_allocations_item_in_business -> qualifying_items(id, business_id)
--      FK: verified_unit_allocations_item_in_version -> reward_program_version_qualifying_items(reward_program_version_id, qualifying_item_id)
--   5. rewards.qualifying_item_id (UUID NULL)
--      FK: rewards_item_in_business -> qualifying_items(id, business_id)
--      FK: rewards_item_in_version -> reward_program_version_qualifying_items(reward_program_version_id, qualifying_item_id)
--
-- All columns are NULLABLE during Package B. Under PostgreSQL MATCH SIMPLE (default),
-- foreign key constraints are not enforced when qualifying_item_id IS NULL,
-- allowing existing runtime writes to proceed unaffected. When non-null,
-- foreign keys strictly guarantee tenant (Business) integrity across all 5 tables
-- and version qualification integrity across the 4 version-scoped tables (verified_units,
-- loyalty_cycles, verified_unit_allocations, rewards; loyalty_cycle_streams spans
-- versions and carries no version column).
--
-- Re-runnable by design: ADD COLUMN IF NOT EXISTS, DROP CONSTRAINT IF EXISTS before
-- ADD CONSTRAINT, and CREATE INDEX IF NOT EXISTS.

-- 1. verified_units: add qualifying_item_id
ALTER TABLE verified_units
  ADD COLUMN IF NOT EXISTS qualifying_item_id UUID NULL;

ALTER TABLE verified_units
  DROP CONSTRAINT IF EXISTS verified_units_item_in_business;

ALTER TABLE verified_units
  ADD CONSTRAINT verified_units_item_in_business FOREIGN KEY
    (qualifying_item_id, business_id)
    REFERENCES qualifying_items (id, business_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE verified_units VALIDATE CONSTRAINT verified_units_item_in_business;

ALTER TABLE verified_units
  DROP CONSTRAINT IF EXISTS verified_units_item_in_version;

ALTER TABLE verified_units
  ADD CONSTRAINT verified_units_item_in_version FOREIGN KEY
    (reward_program_version_id, qualifying_item_id)
    REFERENCES reward_program_version_qualifying_items
      (reward_program_version_id, qualifying_item_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE verified_units VALIDATE CONSTRAINT verified_units_item_in_version;

CREATE INDEX IF NOT EXISTS verified_units_qualifying_item_idx
  ON verified_units (qualifying_item_id);

COMMENT ON COLUMN verified_units.qualifying_item_id IS
  'Item identity (DEC-LOY-019 / Package B additive foundation). Nullable during Package B transitional baseline; populated from purchase_records in Package C cutover and tightened to NOT NULL after runtime cutover.';

-- 2. loyalty_cycle_streams: add qualifying_item_id
ALTER TABLE loyalty_cycle_streams
  ADD COLUMN IF NOT EXISTS qualifying_item_id UUID NULL;

ALTER TABLE loyalty_cycle_streams
  DROP CONSTRAINT IF EXISTS loyalty_cycle_streams_item_in_business;

ALTER TABLE loyalty_cycle_streams
  ADD CONSTRAINT loyalty_cycle_streams_item_in_business FOREIGN KEY
    (qualifying_item_id, business_id)
    REFERENCES qualifying_items (id, business_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE loyalty_cycle_streams VALIDATE CONSTRAINT loyalty_cycle_streams_item_in_business;

CREATE INDEX IF NOT EXISTS loyalty_cycle_streams_qualifying_item_idx
  ON loyalty_cycle_streams (qualifying_item_id);

COMMENT ON COLUMN loyalty_cycle_streams.qualifying_item_id IS
  'Item identity (DEC-LOY-019 / Package B additive foundation). Nullable during Package B transitional baseline; primary key replacement to (business_id, customer_identity_id, reward_program_id, qualifying_item_id) deferred to Package D cutover.';

-- 3. loyalty_cycles: add qualifying_item_id
ALTER TABLE loyalty_cycles
  ADD COLUMN IF NOT EXISTS qualifying_item_id UUID NULL;

ALTER TABLE loyalty_cycles
  DROP CONSTRAINT IF EXISTS loyalty_cycles_item_in_business;

ALTER TABLE loyalty_cycles
  ADD CONSTRAINT loyalty_cycles_item_in_business FOREIGN KEY
    (qualifying_item_id, business_id)
    REFERENCES qualifying_items (id, business_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE loyalty_cycles VALIDATE CONSTRAINT loyalty_cycles_item_in_business;

ALTER TABLE loyalty_cycles
  DROP CONSTRAINT IF EXISTS loyalty_cycles_item_in_version;

ALTER TABLE loyalty_cycles
  ADD CONSTRAINT loyalty_cycles_item_in_version FOREIGN KEY
    (opened_under_version_id, qualifying_item_id)
    REFERENCES reward_program_version_qualifying_items
      (reward_program_version_id, qualifying_item_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE loyalty_cycles VALIDATE CONSTRAINT loyalty_cycles_item_in_version;

CREATE INDEX IF NOT EXISTS loyalty_cycles_qualifying_item_idx
  ON loyalty_cycles (qualifying_item_id);

COMMENT ON COLUMN loyalty_cycles.qualifying_item_id IS
  'Item identity (DEC-LOY-019 / Package B additive foundation). Nullable during Package B transitional baseline; composite active uniqueness replacement deferred to Package D cutover.';

-- 4. verified_unit_allocations: add qualifying_item_id
ALTER TABLE verified_unit_allocations
  ADD COLUMN IF NOT EXISTS qualifying_item_id UUID NULL;

ALTER TABLE verified_unit_allocations
  DROP CONSTRAINT IF EXISTS verified_unit_allocations_item_in_business;

ALTER TABLE verified_unit_allocations
  ADD CONSTRAINT verified_unit_allocations_item_in_business FOREIGN KEY
    (qualifying_item_id, business_id)
    REFERENCES qualifying_items (id, business_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE verified_unit_allocations VALIDATE CONSTRAINT verified_unit_allocations_item_in_business;

ALTER TABLE verified_unit_allocations
  DROP CONSTRAINT IF EXISTS verified_unit_allocations_item_in_version;

ALTER TABLE verified_unit_allocations
  ADD CONSTRAINT verified_unit_allocations_item_in_version FOREIGN KEY
    (reward_program_version_id, qualifying_item_id)
    REFERENCES reward_program_version_qualifying_items
      (reward_program_version_id, qualifying_item_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE verified_unit_allocations VALIDATE CONSTRAINT verified_unit_allocations_item_in_version;

CREATE INDEX IF NOT EXISTS verified_unit_allocations_qualifying_item_idx
  ON verified_unit_allocations (qualifying_item_id);

COMMENT ON COLUMN verified_unit_allocations.qualifying_item_id IS
  'Item identity (DEC-LOY-019 / Package B additive foundation). Nullable during Package B transitional baseline; item equality foreign keys (unit item = allocation item = cycle item) deferred to Package D cutover.';

-- 5. rewards: add qualifying_item_id
ALTER TABLE rewards
  ADD COLUMN IF NOT EXISTS qualifying_item_id UUID NULL;

ALTER TABLE rewards
  DROP CONSTRAINT IF EXISTS rewards_item_in_business;

ALTER TABLE rewards
  ADD CONSTRAINT rewards_item_in_business FOREIGN KEY
    (qualifying_item_id, business_id)
    REFERENCES qualifying_items (id, business_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE rewards VALIDATE CONSTRAINT rewards_item_in_business;

ALTER TABLE rewards
  DROP CONSTRAINT IF EXISTS rewards_item_in_version;

ALTER TABLE rewards
  ADD CONSTRAINT rewards_item_in_version FOREIGN KEY
    (reward_program_version_id, qualifying_item_id)
    REFERENCES reward_program_version_qualifying_items
      (reward_program_version_id, qualifying_item_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE rewards VALIDATE CONSTRAINT rewards_item_in_version;

CREATE INDEX IF NOT EXISTS rewards_qualifying_item_idx
  ON rewards (qualifying_item_id);

COMMENT ON COLUMN rewards.qualifying_item_id IS
  'Item identity (DEC-LOY-019 / Package B additive foundation). Nullable during Package B transitional baseline; item-bound reward creation and immutable snapshot semantics deferred to Package E cutover.';
