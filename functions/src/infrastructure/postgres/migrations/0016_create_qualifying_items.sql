-- Qualifying Item stable identity (PLATFORM-BASELINE-013A.1).
--
-- Table/column shape specified by the approved delivery design
-- (`docs/05-implementation/reports/platform-baseline-012-business-owned-
-- qualifying-item-implementation-readiness-design-2026-09-18.md` SS5),
-- itself grounded in Founder decisions `DEC-LOY-016` /
-- `FD-REWARD-QUALIFYING-ITEM-001`. A Business-owned, PostgreSQL-
-- authoritative entity: the stable identity behind whatever a Business
-- actually sells ("Black Coffee", "Medium Pizza"), independent of any
-- Commerce Knowledge classification.
--
-- `business_id` is an opaque Firestore-owned reference -- never a
-- PostgreSQL foreign key, matching every other PG-owned entity table in
-- this schema (0001's header comment; existence/status validation for it
-- happens server-side at write time, not via a database constraint).
--
-- `knowledge_node_id` is likewise an opaque, OPTIONAL Firestore-owned
-- Commerce Knowledge reference -- zero-or-one classification, never
-- qualification authority. `DEC-LOY-016` makes Commerce Knowledge mapping
-- optional; presence/type/active-status validation of a non-null value
-- happens server-side against Firestore at write time (mirroring
-- `validateOptionalCategoryReference`'s established shape), never a
-- database constraint, since Commerce Knowledge is Firestore-authoritative
-- and is never copied into PostgreSQL.
--
-- This migration is purely additive: it creates a new table that nothing
-- yet reads or writes. No existing table, column, or row is touched.
CREATE TABLE qualifying_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  knowledge_node_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  -- Backs the future purchase-binding composite FK
  -- (purchase_records_item_in_business, PB-013C) proving an item belongs
  -- to the Business a purchase claims it for -- the same additive-UNIQUE-
  -- then-composite-FK idiom `0007` established for the Reward Program
  -- tables. Not consumed by anything in this package.
  CONSTRAINT qualifying_items_identity_tuple_unique UNIQUE (id, business_id)
);

CREATE INDEX qualifying_items_business_id_idx ON qualifying_items (business_id);
CREATE INDEX qualifying_items_business_id_status_idx ON qualifying_items (business_id, status);

COMMENT ON TABLE qualifying_items IS
  'Business-owned Qualifying Item stable identity (PLATFORM-BASELINE-013A.1 / DEC-LOY-016). Not yet read or written by any product code path.';
COMMENT ON COLUMN qualifying_items.knowledge_node_id IS
  'Optional Commerce Knowledge classification -- opaque Firestore reference, zero-or-one, never qualification authority. Validated server-side only when non-null.';
