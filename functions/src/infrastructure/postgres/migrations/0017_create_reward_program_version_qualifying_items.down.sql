-- Reverse of 0017_create_reward_program_version_qualifying_items.sql.
--
-- Drops the new junction table first (nothing else in this package
-- references it), then removes only the qualifying_items rows this
-- migration itself synthesized during its backfill -- identified by the
-- migration's own fixed created_by marker. A real Business-authored item
-- always carries a real user id in created_by, never this marker, so this
-- delete can never remove a real Business's own qualifying item, however
-- many it has since created, renamed, or retired.
DROP TABLE reward_program_version_qualifying_items;

DELETE FROM qualifying_items
WHERE created_by = 'platform-baseline-013a1-0017-backfill'
  AND knowledge_node_id IS NOT NULL;
