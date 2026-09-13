-- Same-program pointer integrity + single-editable-draft invariant
-- (PLATFORM-BASELINE-005A-CORR-001, independent review check + Finding 1).
--
-- 1. reward_programs.current_version_id's original FK
--    (reward_program_versions (id), migration 0002) guaranteed only that
--    the pointer names SOME existing version row -- not that the
--    referenced version belongs to the SAME reward program. A composite
--    FK expresses the same-program invariant purely relationally (no
--    trigger): the referencing column pair (current_version_id, id) must
--    match a UNIQUE (id, reward_program_id) pair on the versions table,
--    so a pointer to another program's version is now a constraint
--    violation at the database layer. The pointer's nullable-until-first-
--    publication semantics are unchanged (FK MATCH SIMPLE skips rows
--    where any referencing column is NULL).
--
-- 2. The read model's `draftVersion` (CORR-001 Finding 1) is defined as
--    "the program's latest version while it is still a draft"; a partial
--    unique index turns "at most one editable draft per program" from a
--    command-layer convention into a database invariant under the current
--    package's draft semantics.
ALTER TABLE reward_program_versions
  ADD CONSTRAINT reward_program_versions_id_program_unique UNIQUE (id, reward_program_id);

ALTER TABLE reward_programs
  DROP CONSTRAINT reward_programs_current_version_id_fkey;

ALTER TABLE reward_programs
  ADD CONSTRAINT reward_programs_current_version_same_program_fkey
  FOREIGN KEY (current_version_id, id)
  REFERENCES reward_program_versions (id, reward_program_id);

CREATE UNIQUE INDEX reward_program_versions_one_draft_per_program
  ON reward_program_versions (reward_program_id)
  WHERE status = 'draft';

COMMENT ON CONSTRAINT reward_programs_current_version_same_program_fkey ON reward_programs IS
  'current_version_id must reference a version of the SAME reward program (composite FK on the (id, reward_program_id) pair) -- PLATFORM-BASELINE-005A-CORR-001.';
COMMENT ON INDEX reward_program_versions_one_draft_per_program IS
  'At most one editable draft per Reward Program (PLATFORM-BASELINE-005A-CORR-001 Finding 1 read-model invariant).';
