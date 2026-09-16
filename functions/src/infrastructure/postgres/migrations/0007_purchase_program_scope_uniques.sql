-- Additive composite UNIQUEs backing the Purchase-domain relational scope
-- proofs (PLATFORM-BASELINE-006A; design §20 A/B).
--
-- `purchase_records`, `loyalty_cycles`, and `rewards` prove
-- version-in-program and program-in-Business purely relationally via
-- composite FOREIGN KEYs. Those FKs need UNIQUEs on the exact referenced
-- column pairs of the pre-existing Reward Program tables:
--
-- - (reward_program_id, id) on reward_program_versions
--   (backs purchase_records_version_in_program,
--   loyalty_cycles_version_in_program)
-- - (id, business_id) on reward_programs
--   (backs purchase_records_program_in_business,
--   loyalty_cycles_program_in_business)
--
-- New forward-only migration: migrations 0001-0006 are never hand-edited.
ALTER TABLE reward_program_versions
  ADD CONSTRAINT reward_program_versions_program_id_id_unique
  UNIQUE (reward_program_id, id);

ALTER TABLE reward_programs
  ADD CONSTRAINT reward_programs_id_business_unique
  UNIQUE (id, business_id);

COMMENT ON CONSTRAINT reward_program_versions_program_id_id_unique ON reward_program_versions IS
  'Backs Purchase-domain composite FKs proving version-in-program (PLATFORM-BASELINE-006A).';
COMMENT ON CONSTRAINT reward_programs_id_business_unique ON reward_programs IS
  'Backs Purchase-domain composite FKs proving program-in-Business (PLATFORM-BASELINE-006A).';
