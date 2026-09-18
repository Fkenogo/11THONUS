-- Reward Program Version <-> Qualifying Item junction, replacing
-- reward_program_version_qualifying_nodes (PLATFORM-BASELINE-013A.1).
--
-- Design: docs/05-implementation/reports/platform-baseline-012-business-
-- owned-qualifying-item-implementation-readiness-design-2026-09-18.md
-- SS6/SS8/SS13. `reward_program_version_qualifying_nodes` (migration 0003)
-- cannot be adapted in place: `knowledge_node_id` is half of its PRIMARY
-- KEY, and PostgreSQL forbids NULL in a primary-key column, so making the
-- Commerce Knowledge mapping optional requires a new stable identity
-- column regardless (`qualifying_item_id`) -- at which point a full
-- replacement table is the correct shape, not a patch.
--
-- `item_name_at_version` is NOT NULL (unlike the old table's nullable
-- `business_display_name`): under the new model the frozen snapshot name
-- is the only human-readable record of what qualified for a published
-- version, so it can never be absent. `knowledge_node_id_at_version`
-- remains nullable -- it is a frozen copy of the item's OPTIONAL
-- classification at publish time, not qualification authority.
--
-- `qualifying_item_id` uses ON DELETE RESTRICT (not CASCADE, matching the
-- uniform posture of 0009/0010/0012): a published version's qualification
-- definition must never be erasable by deleting an item row. Retirement,
-- not deletion, is the only lifecycle operation this schema exposes
-- (qualifying_items.status), and this package does not add a delete path.
--
-- The old table (reward_program_version_qualifying_nodes) is retained,
-- untouched, and unread by this migration -- dropping it is deferred to a
-- separate, later, environment-gated migration (PB-013E / 0019). Nothing
-- in this package reads or writes either junction table's rows outside
-- this migration's own additive backfill below.
CREATE TABLE reward_program_version_qualifying_items (
  reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions (id) ON DELETE CASCADE,
  qualifying_item_id UUID NOT NULL REFERENCES qualifying_items (id) ON DELETE RESTRICT,
  item_name_at_version TEXT NOT NULL,
  knowledge_node_id_at_version TEXT NULL,
  PRIMARY KEY (reward_program_version_id, qualifying_item_id)
);

CREATE INDEX reward_program_version_qualifying_items_qualifying_item_id_idx
  ON reward_program_version_qualifying_items (qualifying_item_id);

COMMENT ON TABLE reward_program_version_qualifying_items IS
  'Junction: which Business-owned Qualifying Items (PLATFORM-BASELINE-013A.1 / DEC-LOY-016) qualify for a given Reward Program Version. Replaces reward_program_version_qualifying_nodes (retained, unread, dropped only by a later deferred migration).';
COMMENT ON COLUMN reward_program_version_qualifying_items.item_name_at_version IS
  'Frozen Business-authored display-name snapshot at publish time -- NOT NULL, unlike the predecessor column it replaces. Renaming the live qualifying_items.name never alters an already-published version''s snapshot.';
COMMENT ON COLUMN reward_program_version_qualifying_items.knowledge_node_id_at_version IS
  'Frozen copy of the item''s optional Commerce Knowledge classification at publish time. Nullable -- classification is never required. Never re-validated at read time.';

-- Backfill (design SS13, migration 0017): every existing legacy qualifying-
-- node reference gets an exactly-equivalent Qualifying Item + junction
-- row, so no already-published Reward Program Version loses its
-- qualification history. A no-op against a repository/environment with no
-- rows in reward_program_version_qualifying_nodes (this repository ships
-- none -- SS13's disclosed caveat: that does not prove a deployed
-- database is empty, hence this backfill exists at all).
--
-- Step 1: one synthesized qualifying_items row per distinct
-- (owning Business, knowledge_node_id) pair referenced by the legacy
-- table. Synthesized rows are tagged with a fixed created_by marker so
-- the down migration can identify and remove exactly (and only) the rows
-- it created -- never a real Business-authored item. Where multiple
-- versions of the same program (or of different programs owned by the
-- same Business) recorded different business_display_name values for the
-- same node, the earliest (lowest version number) row's name wins,
-- deterministically; the Business may rename the synthesized item
-- afterward with no effect on any already-published version's own frozen
-- item_name_at_version snapshot (SS8). `rpv.version` alone does not fully
-- order ties: two DIFFERENT Reward Programs owned by the same Business
-- each number their own versions from 1, so a Business with two programs
-- both referencing the same legacy node can have two "version 1" rows.
-- `rp.id` (the owning program's own stable id) breaks that tie
-- deterministically; `legacy.reward_program_version_id` is included as a
-- final, always-unique tie-breaker so the winner is never
-- plan-/order-dependent for any input, however constructed.
INSERT INTO qualifying_items (business_id, name, knowledge_node_id, status, created_by, updated_by)
SELECT DISTINCT ON (rp.business_id, legacy.knowledge_node_id)
  rp.business_id,
  COALESCE(legacy.business_display_name, legacy.knowledge_node_id),
  legacy.knowledge_node_id,
  'active',
  'platform-baseline-013a1-0017-backfill',
  'platform-baseline-013a1-0017-backfill'
FROM reward_program_version_qualifying_nodes legacy
JOIN reward_program_versions rpv ON rpv.id = legacy.reward_program_version_id
JOIN reward_programs rp ON rp.id = rpv.reward_program_id
WHERE NOT EXISTS (
  SELECT 1 FROM qualifying_items qi
  WHERE qi.business_id = rp.business_id
    AND qi.knowledge_node_id = legacy.knowledge_node_id
    AND qi.created_by = 'platform-baseline-013a1-0017-backfill'
)
ORDER BY rp.business_id, legacy.knowledge_node_id, rpv.version ASC, rp.id ASC,
  legacy.reward_program_version_id ASC;

-- Step 2: one junction row per legacy qualifying-node reference, pointing
-- at the synthesized item for its (Business, knowledge_node_id) pair,
-- freezing THAT row's own business_display_name (not the winning name
-- picked in step 1) as its item_name_at_version -- each published
-- version's historical snapshot is preserved exactly as it was, even
-- when step 1 had to pick one canonical live name across versions.
-- ON CONFLICT DO NOTHING makes this step safe to re-run.
INSERT INTO reward_program_version_qualifying_items
  (reward_program_version_id, qualifying_item_id, item_name_at_version, knowledge_node_id_at_version)
SELECT
  legacy.reward_program_version_id,
  qi.id,
  COALESCE(legacy.business_display_name, legacy.knowledge_node_id),
  legacy.knowledge_node_id
FROM reward_program_version_qualifying_nodes legacy
JOIN reward_program_versions rpv ON rpv.id = legacy.reward_program_version_id
JOIN reward_programs rp ON rp.id = rpv.reward_program_id
JOIN qualifying_items qi
  ON qi.business_id = rp.business_id
 AND qi.knowledge_node_id = legacy.knowledge_node_id
 AND qi.created_by = 'platform-baseline-013a1-0017-backfill'
ON CONFLICT (reward_program_version_id, qualifying_item_id) DO NOTHING;

-- Operational assumptions, disclosed rather than defended against with
-- new machinery (PLATFORM-BASELINE-013A.1-CORR-001 F5/F7 -- evaluated and
-- deliberately not hardened further, since doing so would either
-- complicate this migration or invent a mechanism beyond PB-012's
-- approved model):
--
-- 1. The fixed marker `'platform-baseline-013a1-0017-backfill'` is this
--    migration's sole means of distinguishing its own synthesized rows
--    from genuine Business-authored ones (both here and in 0017.down's
--    rollback precondition, see that file). `created_by` is populated by
--    application code, never raw end-user input, so a genuine collision
--    with this exact string requires an internal defect in a future
--    package -- not a reachable end-user action. Not defended against
--    further.
-- 2. If a synthesized item's `knowledge_node_id` is later remapped to
--    NULL by a future package's own write path (e.g. an operator
--    "unclassifying" it), 0017.down's marker-scoped DELETE
--    (`WHERE created_by = marker AND knowledge_node_id IS NOT NULL`)
--    would then skip that row, leaving it permanently in `qualifying_
--    items` rather than being cleaned up by a rollback. This is a
--    conservative failure mode -- it never deletes real data, it only
--    ever retains a row a rollback would otherwise have removed -- and is
--    accepted rather than tracked with an additional "was this row ever
--    remapped" column, which SS5 does not otherwise need.
-- 3. Manually re-executing this file's own INSERT statements by hand
--    (outside `migrationRunner.ts`'s one-time-per-version application) is
--    safe even after genuine, non-backfill items exist: both the
--    `WHERE NOT EXISTS (...)` guard in Step 1 and the `JOIN qualifying_
--    items qi ON ... AND qi.created_by = marker` in Step 2 scope
--    themselves to marker-tagged rows only, so re-running never reads,
--    matches, or duplicates a genuine item.
