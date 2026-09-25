-- Reverse of 0019_drop_legacy_qualifying_nodes.sql
-- (PLATFORM-BASELINE-013E).
--
-- LOSSY BY CONSTRUCTION -- READ THIS BEFORE ROLLING BACK. This down
-- migration recreates the historical TABLE STRUCTURE ONLY. It cannot
-- reconstruct the dropped source rows, and it does not try: re-deriving
-- legacy rows from reward_program_version_qualifying_items would
-- FABRICATE evidence, not restore it, because the 0017 backfill was
-- lossy in exactly the ways a reverse mapping cannot undo --
-- COALESCE(business_display_name, knowledge_node_id) collapses "NULL
-- display name" and "display name identical to the node id" into one
-- indistinguishable frozen snapshot; multi-version display-name
-- conflicts were collapsed to one canonical live item name; a later
-- remap-to-NULL breaks the lineage the reverse join would need; and
-- rows belonging to since-deleted versions are gone on both sides.
-- Any process that needs the original rows must restore them from a
-- pre-0019 logical backup taken under the same change window, never
-- from this file.
--
-- What this rollback IS good for: returning the schema to a shape in
-- which migration 0003's object exists again (empty), e.g. so a
-- subsequent forward investigation can re-seed and re-verify. The
-- recreated table is byte-identical in structure to what 0003 created:
-- same columns, same composite primary key, same outbound foreign key
-- to reward_program_versions (ON DELETE CASCADE), same
-- knowledge_node_id index, and a table comment that records this file
-- as its origin (deliberately NOT restoring 0003's original comment,
-- so a future reader can tell a rolled-back shell apart from a
-- never-dropped original).
CREATE TABLE reward_program_version_qualifying_nodes (
  reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions (id) ON DELETE CASCADE,
  knowledge_node_id TEXT NOT NULL,
  business_display_name TEXT NULL,
  PRIMARY KEY (reward_program_version_id, knowledge_node_id)
);

CREATE INDEX reward_program_version_qualifying_nodes_knowledge_node_id_idx
  ON reward_program_version_qualifying_nodes (knowledge_node_id);

COMMENT ON TABLE reward_program_version_qualifying_nodes IS
  'Structural shell recreated by the 0019 down migration (PLATFORM-BASELINE-013E rollback). The historical source rows dropped by 0019 are NOT restored by this file -- see its header. Do not mistake this table for the original pre-0019 evidence.';
