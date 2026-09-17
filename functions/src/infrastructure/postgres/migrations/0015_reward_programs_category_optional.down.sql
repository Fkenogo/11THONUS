-- Reverse of 0015_reward_programs_category_optional.sql.
--
-- PRECONDITION: this re-adds NOT NULL, which fails if any row currently
-- has a NULL `reward_program_category_id` (a Reward Program created under
-- PLATFORM-BASELINE-010B's Phase-1 category-optional rule). Do not run
-- this rollback against a database that has accepted any such row unless
-- those rows are first backfilled with a real category id or removed --
-- this migration performs no such backfill itself.
ALTER TABLE reward_programs
  ALTER COLUMN reward_program_category_id SET NOT NULL;
