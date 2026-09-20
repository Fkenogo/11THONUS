-- Purchase Record -> Business-owned Qualifying Item structural binding
-- (PLATFORM-BASELINE-013C).
--
-- Design: docs/05-implementation/reports/platform-baseline-012-business-
-- owned-qualifying-item-implementation-readiness-design-2026-09-18.md
-- SS7/SS10/SS13. `qualifyingItemId` becomes the structural purchase-item
-- identity, referring to `qualifying_items.id` (the Business-owned entity
-- `PLATFORM-BASELINE-013A.1` created and `PLATFORM-BASELINE-013B` bound to
-- Reward Program versions). `item_label` is retained unchanged (TEXT NOT
-- NULL) as the server-derived, frozen human-readable transaction-time
-- snapshot; it is no longer client-supplied. `knowledge_node_id` is
-- retained untouched on the table (no ALTER) but is removed from the write
-- path by the application change that ships with this migration -- it is
-- never promoted to QualifyingItem authority (PB-012 SS17A CF-1).
--
-- Purely additive at the schema level: `ADD COLUMN ... NULL` never rewrites
-- existing rows in modern PostgreSQL, so every pre-existing Purchase Record
-- keeps `qualifying_item_id = NULL`. The two composite foreign keys are
-- added NOT VALID and then VALIDATEd (PostgreSQL's standard two-step), so
-- the initial add does not hold a long ACCESS EXCLUSIVE lock over an
-- existing table; a NULL `qualifying_item_id` is exempt from both
-- constraints (MATCH SIMPLE default), which is why VALIDATE succeeds
-- against legacy NULL rows.
--
-- Two relational guarantees, defence in depth behind the application's
-- in-transaction membership check (PB-012 SS7 Q10; the same composite-FK
-- posture 0007/0008 established):
--   1. purchase_records_item_in_business -- the item must belong to the
--      Purchase's Business. Backs onto
--      `qualifying_items_identity_tuple_unique UNIQUE (id, business_id)`
--      (migration 0016). Makes a cross-Business or fabricated id
--      structurally impossible even if every application check were
--      bypassed.
--   2. purchase_records_item_in_version -- the item must be on THIS
--      Purchase's own (immutable) Reward Program version. Backs onto the
--      junction table's PRIMARY KEY
--      `(reward_program_version_id, qualifying_item_id)` (migration 0017).
--      This closes the pre-existing gap where a recorded item was never
--      checked against the applicable version's configured qualification
--      set.
--
-- ON DELETE RESTRICT on both (matching 0009/0010/0012 and 0017): a recorded
-- Purchase's item identity must never be erasable by deleting an item or a
-- published version's binding. Retirement, not deletion, is the lifecycle
-- operation.
--
-- The column deliberately stays NULLABLE in this migration (PB-012 SS13:
-- "Column stays NULL in this migration"). Tightening it to NOT NULL is the
-- deferred, environment-gated PB-013E / 0019 job, once no legacy NULL rows
-- remain.
ALTER TABLE purchase_records
  ADD COLUMN qualifying_item_id UUID NULL;

ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_item_in_business FOREIGN KEY
    (qualifying_item_id, business_id)
    REFERENCES qualifying_items (id, business_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_item_in_version FOREIGN KEY
    (reward_program_version_id, qualifying_item_id)
    REFERENCES reward_program_version_qualifying_items
      (reward_program_version_id, qualifying_item_id) ON DELETE RESTRICT
    NOT VALID;

ALTER TABLE purchase_records VALIDATE CONSTRAINT purchase_records_item_in_business;
ALTER TABLE purchase_records VALIDATE CONSTRAINT purchase_records_item_in_version;

CREATE INDEX purchase_records_qualifying_item_idx
  ON purchase_records (qualifying_item_id);

COMMENT ON COLUMN purchase_records.qualifying_item_id IS
  'Structural Business-owned Qualifying Item identity (PLATFORM-BASELINE-013C / DEC-LOY-016). NULL only for legacy rows recorded before this migration; every new Purchase supplies it. `item_label` remains the frozen human-readable snapshot, `knowledge_node_id` remains an unused retained column -- neither is qualification authority.';
