-- Reverse of 0006_reward_program_pointer_integrity.sql.
DROP INDEX IF EXISTS reward_program_versions_one_draft_per_program;

ALTER TABLE reward_programs
  DROP CONSTRAINT IF EXISTS reward_programs_current_version_same_program_fkey;

ALTER TABLE reward_programs
  ADD CONSTRAINT reward_programs_current_version_id_fkey
  FOREIGN KEY (current_version_id) REFERENCES reward_program_versions (id);

ALTER TABLE reward_program_versions
  DROP CONSTRAINT IF EXISTS reward_program_versions_id_program_unique;
