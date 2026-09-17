-- Makes `reward_program_category_id` optional (`PLATFORM-BASELINE-010B`).
--
-- Founder decision `DEC-LOY-014` / `FD-REWARD-QUALIFICATION-001`
-- (recorded in governance docs, referenced by
-- `docs/00-governance/decisions/decision-register.md` -- not modified by
-- this migration): for Phase 1, a Reward Program does NOT require a
-- Reward Program Category. The Business-selected canonical
-- `standard_product`/`standard_service` qualifying node(s) are the
-- operative qualification definition; Business Type/Commerce Knowledge
-- category relationships may assist discovery only, never a second
-- write-time qualification gate.
--
-- `DROP COLUMN ... NOT NULL` is a pure constraint relaxation: it never
-- inspects or rewrites existing row values, so it is safe against a
-- table with zero, one, or many pre-existing rows -- every existing
-- non-null `reward_program_category_id` value is left byte-for-byte
-- unchanged. New rows may now persist a NULL in this column.
ALTER TABLE reward_programs
  ALTER COLUMN reward_program_category_id DROP NOT NULL;

COMMENT ON COLUMN reward_programs.reward_program_category_id IS
  'Optional as of PLATFORM-BASELINE-010B (Founder decision DEC-LOY-014 / FD-REWARD-QUALIFICATION-001) -- Phase 1 qualification authority is the version''s qualifyingNodes (standard_product/standard_service), never this category. Retained for Businesses/programs that already have one; never required for a new Reward Program.';
