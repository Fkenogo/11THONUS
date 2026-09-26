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
-- representation. A legacy row counts as represented when ANY of the
-- following holds (PLATFORM-BASELINE-013E-CORR-001, bounded by
-- PLATFORM-BASELINE-013E-CORR-002):
--
-- (a) EXACT MATCH, using 0017's own transformation semantics: one
--     reward_program_version_qualifying_items row with the same
--     reward_program_version_id, the same knowledge_node_id_at_version,
--     and item_name_at_version = COALESCE(business_display_name,
--     knowledge_node_id) (0017 Step 2 freezes THAT legacy row's own
--     display name per version, not the canonical live item name).
--     This is the ONLY acceptable evidence for an immutable version
--     (status 'active' or 'superseded'): published history must remain
--     equivalently represented, byte-for-byte, forever.
--
-- (b) DRAFT PROVENANCE: the legacy row's version is still a mutable
--     draft (status 'draft'), the version ITSELF predates migration
--     0017 (reward_program_versions.created_at < the recorded
--     schema_migrations.applied_at for '0017'), AND a 0017-synthesized
--     Qualifying Item (qualifying_items.created_by =
--     'platform-baseline-013a1-0017-backfill') exists for the same
--     owning Business and the same knowledge_node_id. That marker row
--     is created by 0017 Step 1 for exactly this legacy reference, and
--     no draft write path ever touches qualifying_items rows (draft
--     edits and publish only DELETE/INSERT junction rows), so its
--     survival proves the backfill processed this reference even after
--     the draft's junction was legitimately replaced wholesale or
--     emptied afterwards.
--
-- (c) DRAFT STRUCTURAL DESCENT: the legacy row's version is still a
--     mutable draft AND the version ITSELF predates migration 0017, and
--     its current junction still binds a 0017-synthesized
--     (marker-created) item owned by the same Business. This covers the
--     deeper evolution where the live item itself was renamed/
--     reclassified through the legitimate item-update path and the
--     draft re-saved with refreshed frozen snapshots: neither the
--     junction nor the live item still carries the legacy (node, name)
--     pair, but the draft's bindings still structurally descend from
--     the backfill.
--
-- CORR-002 provenance bound: the draft escape legs (b)/(c) apply ONLY
-- to versions that predate migration 0017, because a version created
-- after 0017 can never have a legitimate legacy row -- the product has
-- zero runtime writers to reward_program_version_qualifying_nodes, so
-- any legacy row on a post-0017 version is out-of-band/manual SQL and
-- must fail closed. The bound is `rpv.created_at <
-- schema_migrations.applied_at('0017')`; both columns are TIMESTAMPTZ
-- (UTC), and 0017's own up SQL creates no versions, so every
-- legitimately backfilled version predates the recorded application
-- time. (See the PB-013E report §10 for the residual clock-skew /
-- manual-injection analysis.)
--
-- PROVENANCE SEMANTICS: the 0017 marker is Business/node-level, NOT
-- per-version or per-row -- Step 1 synthesizes ONE item per distinct
-- (Business, knowledge_node_id) pair, and that single item is shared
-- by every legacy row (across versions and programs of the same
-- Business) referencing that node. The marker therefore proves "0017
-- backfilled at least one legacy reference for this (Business, node)",
-- not "this specific version's row was backfilled". There is no
-- version-level provenance column in the schema, and CORR-002 does not
-- add one. The residual consequence -- a PRE-0017 draft whose legacy
-- table receives a POST-0017 manual SQL insertion cannot be
-- distinguished from genuinely migrated history -- is accepted and
-- documented in the PB-013E report §10 (bounded: zero runtime writers,
-- requires out-of-band manual mutation, and the fail-closed non-draft
-- gate plus preflight + backup protect the target environment).
--
-- Mutability is read from reward_program_versions.status, the same
-- lifecycle authority the command layer enforces (only 'draft' rows
-- accept updateDraftVersion; 'active'/'superseded' rows are immutable
-- history). A legacy row whose version id resolves to no version at
-- all matches none of (a)/(b)/(c) and fails closed by construction.
--
-- The check is scoped legacy-row -> migrated-evidence. A naive global
-- row-count comparison is WRONG here on purpose: genuine post-PB-013B
-- bindings exist only in the new junction and have no legacy
-- counterpart, so the two tables legitimately differ in size. CK values
-- are compared only for the exact-match leg (a); they are never
-- qualification authority.
--
-- If any legacy row cannot be proven represented, the migration RAISES
-- and the legacy table REMAINS -- a target environment holding
-- un-backfilled legacy evidence must be investigated by hand, never
-- silently dropped.
--
-- PUBLISHED / NON-DRAFT FAIL-CLOSED CASES (intentional refusal, NOT
-- data corruption -- these are ambiguous historical states requiring
-- operator verification): once a version is published ('active' or
-- 'superseded'), only exact representation leg (a) applies. Legitimate
-- pre-0017 draft evolution followed by publication can therefore leave
-- a legacy row without an exact current-junction match, and 0019 will
-- REFUSE to drop. That covers at minimum:
--   * live-item rename between backfill and publication;
--   * classification remap (knowledge_node_id change) before publish;
--   * classification removal (knowledge_node_id -> NULL) before publish;
--   * item rebind / binding removal before publish;
--   * multi-version frozen-name conflicts (0017 Step 1 picks one
--     canonical live name, while publish re-snapshots every version
--     from that same live name).
-- Each of these is fail-closed by design: 0019 raises, the legacy table
-- remains, and the operator follows the preflight/recovery procedure in
-- the PB-013E report §10 rather than bypassing the gate.
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
  applied_0017_at TIMESTAMPTZ;
  unrepresented_count INTEGER;
BEGIN
  -- The recorded application time of the backfill, used to bound the
  -- draft escape legs (b)/(c) to versions that predate 0017. Gate 1 has
  -- already guaranteed this row exists; the explicit IS NOT NULL guards
  -- in (b)/(c) additionally fail closed (leg unavailable) if it were ever
  -- absent.
  SELECT applied_at INTO applied_0017_at FROM schema_migrations WHERE version = '0017';

  SELECT COUNT(*) INTO unrepresented_count
  FROM reward_program_version_qualifying_nodes legacy
  WHERE NOT EXISTS (
    -- (a) exact migrated representation (0017 Step 2 semantics).
    SELECT 1
    FROM reward_program_version_qualifying_items migrated
    WHERE migrated.reward_program_version_id = legacy.reward_program_version_id
      AND migrated.knowledge_node_id_at_version = legacy.knowledge_node_id
      AND migrated.item_name_at_version =
        COALESCE(legacy.business_display_name, legacy.knowledge_node_id)
  )
  AND NOT EXISTS (
    -- (b) draft provenance: still-mutable version, the version itself
    -- predating migration 0017, plus the 0017-synthesized item for this
    -- exact (Business, knowledge_node_id) reference.
    SELECT 1
    FROM reward_program_versions rpv
    JOIN reward_programs rp ON rp.id = rpv.reward_program_id
    JOIN qualifying_items qi
      ON qi.business_id = rp.business_id
     AND qi.knowledge_node_id = legacy.knowledge_node_id
     AND qi.created_by = 'platform-baseline-013a1-0017-backfill'
    WHERE rpv.id = legacy.reward_program_version_id
      AND rpv.status = 'draft'
      AND applied_0017_at IS NOT NULL
      AND rpv.created_at < applied_0017_at
  )
  AND NOT EXISTS (
    -- (c) draft structural descent: still-mutable version, the version
    -- itself predating migration 0017, whose current junction still binds
    -- a 0017-synthesized item of the same Business.
    SELECT 1
    FROM reward_program_versions rpv
    JOIN reward_programs rp ON rp.id = rpv.reward_program_id
    JOIN reward_program_version_qualifying_items current_binding
      ON current_binding.reward_program_version_id = rpv.id
    JOIN qualifying_items qi
      ON qi.id = current_binding.qualifying_item_id
     AND qi.business_id = rp.business_id
     AND qi.created_by = 'platform-baseline-013a1-0017-backfill'
    WHERE rpv.id = legacy.reward_program_version_id
      AND rpv.status = 'draft'
      AND applied_0017_at IS NOT NULL
      AND rpv.created_at < applied_0017_at
  );

  IF unrepresented_count > 0 THEN
    RAISE EXCEPTION
      'PLATFORM-BASELINE-013E / 0019: refusing to drop reward_program_version_qualifying_nodes -- % legacy row(s) have no equivalent reward_program_version_qualifying_items representation (exact version/node/name match, or draft provenance/structural descent for a version that predates migration 0017). Investigate the 0017 backfill on this database before retrying.',
      unrepresented_count;
  END IF;
END $$;

DROP TABLE reward_program_version_qualifying_nodes;
