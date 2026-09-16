-- Reverse of 0007_purchase_program_scope_uniques.sql.
ALTER TABLE reward_programs
  DROP CONSTRAINT IF EXISTS reward_programs_id_business_unique;

ALTER TABLE reward_program_versions
  DROP CONSTRAINT IF EXISTS reward_program_versions_program_id_id_unique;
