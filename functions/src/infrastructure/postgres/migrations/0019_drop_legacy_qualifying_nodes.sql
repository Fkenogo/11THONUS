-- Drop the superseded legacy Reward Program qualification junction
-- reward_program_version_qualifying_nodes (PLATFORM-BASELINE-013E).
--
-- Design: docs/05-implementation/reports/platform-baseline-012-business-
-- owned-qualifying-item-implementation-readiness-design-2026-09-18.md
-- SS13 ("0019 drop_legacy_qualifying_nodes, deferred, separate, later").
-- Business-owned Qualifying Items (DEC-LOY-016 / FD-REWARD-QUALIFYING-
-- ITEM-001) are qualification authority; the 0017 backfill already copied
-- every legacy reference into qualifying_items +
-- reward_program_version_qualifying_items by copy, never by mutation.
--
-- Fail-closed validation runs BEFORE the DROP, in this same file (the
-- migration runner applies each file in its own transaction, so a
-- RAISE EXCEPTION below aborts the whole migration with no schema
-- change):
--
-- Gate 1 proves migration 0017 was applied on this database. The runner
-- itself only ever applies 0019 after 0001-0018, but this guard also
-- protects manual application of this file outside the runner.
--
-- Gate 2 proves every legacy row has its expected migrated
-- representation, using 0017's own transformation semantics: one
-- reward_program_version_qualifying_items row with the same
-- reward_program_version_id, the same knowledge_node_id_at_version, and
-- item_name_at_version = COALESCE(business_display_name,
-- knowledge_node_id) (0017 Step 2 freezes THAT legacy row's own display
-- name per version, not the canonical live item name).
--
-- The check is scoped legacy-row -> expected-migrated-row. A naive
-- global row-count comparison is WRONG here on purpose: genuine
-- post-PB-013B bindings exist only in the new junction and have no
-- legacy counterpart, so the two tables legitimately differ in size.
--
-- If any legacy row cannot be proven represented, the migration RAISES
-- and the legacy table REMAINS -- a target environment holding
-- un-backfilled legacy evidence must be investigated by hand, never
-- silently dropped.
--
-- The DROP uses default RESTRICT semantics (no CASCADE clause).
-- CASCADE is intentionally prohibited: it would silently drop any
-- unexpected future dependent object. RESTRICT fails loudly instead,
-- which is the desired tripwire -- this migration drops exactly one
-- table and nothing else.
--
-- SCOPE: this migration drops ONLY reward_program_version_qualifying_nodes
-- (with its primary key, its outbound foreign key to
-- reward_program_versions, its knowledge_node_id index, and its table
-- comment, all of which belong to the dropped table). It does NOT touch
-- purchase_records.qualifying_item_id nullability or
-- purchase_records.knowledge_node_id -- historical purchase rows
-- legitimately carry NULL there, and changing that characteristic
-- requires a separate explicit data-policy and migration decision
-- (PB-013E Founder disposition, Decision 2).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0017') THEN
    RAISE EXCEPTION
      'PLATFORM-BASELINE-013E / 0019: refusing to drop reward_program_version_qualifying_nodes -- migration 0017 is not recorded as applied on this database, so the legacy-to-Qualifying-Item backfill cannot be assumed to have run.';
  END IF;
END $$;

DO $$
DECLARE
  unrepresented_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unrepresented_count
  FROM reward_program_version_qualifying_nodes legacy
  WHERE NOT EXISTS (
    SELECT 1
    FROM reward_program_version_qualifying_items migrated
    WHERE migrated.reward_program_version_id = legacy.reward_program_version_id
      AND migrated.knowledge_node_id_at_version = legacy.knowledge_node_id
      AND migrated.item_name_at_version =
        COALESCE(legacy.business_display_name, legacy.knowledge_node_id)
  );

  IF unrepresented_count > 0 THEN
    RAISE EXCEPTION
      'PLATFORM-BASELINE-013E / 0019: refusing to drop reward_program_version_qualifying_nodes -- % legacy row(s) have no equivalent reward_program_version_qualifying_items representation (version id + classification id + frozen name). Investigate the 0017 backfill on this database before retrying.',
      unrepresented_count;
  END IF;
END $$;

DROP TABLE reward_program_version_qualifying_nodes;
