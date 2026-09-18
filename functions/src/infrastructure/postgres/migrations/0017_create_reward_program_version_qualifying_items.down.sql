-- Reverse of 0017_create_reward_program_version_qualifying_items.sql.
--
-- PRECONDITION (mirrors 0015.down's own documented-precondition
-- convention, but ENFORCED at the database layer here rather than left to
-- operator discipline: `DROP TABLE` is unconditional and irreversible in
-- a way `ALTER COLUMN ... SET NOT NULL` is not, so a comment alone is not
-- an adequate safeguard for this migration): this rollback is safe ONLY
-- while every row in reward_program_version_qualifying_items still
-- belongs to a migration-synthesized qualifying_items row (identified by
-- the fixed backfill created_by marker below). This package ships no
-- writer of its own for either table beyond this migration's own
-- backfill, but a later package (PLATFORM-BASELINE-013B) is expected to
-- bind genuine, Business-created Qualifying Items into this same junction
-- table -- and once that happens, an unconditional `DROP TABLE` would
-- silently destroy that real configuration data. This migration refuses
-- to run in that case, raising an exception and rolling back cleanly
-- (this file's own transaction, per `migrationRunner.ts`), rather than
-- doing so.
DO $$
DECLARE
  genuine_binding_count INTEGER;
BEGIN
  SELECT count(*) INTO genuine_binding_count
  FROM reward_program_version_qualifying_items j
  JOIN qualifying_items qi ON qi.id = j.qualifying_item_id
  WHERE qi.created_by IS DISTINCT FROM 'platform-baseline-013a1-0017-backfill';

  IF genuine_binding_count > 0 THEN
    RAISE EXCEPTION
      'Refusing to roll back migration 0017: % row(s) in reward_program_version_qualifying_items reference a genuine (non-backfill) qualifying_items row. Dropping this table would destroy real Business configuration data. Remove or migrate those bindings through their own proper reverse migration before rolling back 0017.',
      genuine_binding_count;
  END IF;
END $$;

-- Only reached once the precondition above holds: every remaining
-- junction row is migration-synthesized, so dropping the table destroys
-- no genuine data.
DROP TABLE reward_program_version_qualifying_items;

-- Removes only the qualifying_items rows this migration itself
-- synthesized during its backfill -- identified by the same fixed
-- created_by marker checked above. A real Business-authored item always
-- carries a real user id in created_by, never this marker, so this
-- delete can never remove a real Business's own qualifying item, however
-- many it has since created, renamed, or retired -- independently of the
-- precondition above, which additionally guarantees no genuine item was
-- ever bound into the (now-dropped) junction table either.
DELETE FROM qualifying_items
WHERE created_by = 'platform-baseline-013a1-0017-backfill'
  AND knowledge_node_id IS NOT NULL;
