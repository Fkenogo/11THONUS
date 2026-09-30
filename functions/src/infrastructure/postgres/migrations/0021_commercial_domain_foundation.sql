-- WP-COM-01 — Commercial Domain Foundation
-- (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §7, §13, §14, §18, §20, §30).
--
-- ENGINE FOUNDATION ONLY. Additive: no existing table, column, constraint or
-- index is altered, and NOTHING here references, or is referenced by, any
-- Loyalty / Purchase / Reward table (design §4.3 rules 1 and 4, §4.4 R9).
-- `business_id` is an opaque TEXT owned by Firestore (design §4.4 R10).
--
-- Deliberately NOT created here (later work packages): trial grants,
-- manual adjustments, settlements (WP-COM-02/03); consumption claims/events,
-- projection failures (WP-COM-04); admissions, admission blocks/earmarks,
-- pending_admission (WP-COM-05a/b); notification intents, signal config
-- (WP-COM-09); read-model views (WP-COM-06). The ledger below is shaped so
-- those can be added purely additively (nullable columns / new tables) and so
-- the INV-CAP-PROV capacity-provenance invariant stays satisfiable later.
--
-- Authority model (design §6/§7, Option D):
--   commercial_ledger_entries  = accounting AUTHORITY (append-only, immutable)
--   commercial_accounts        = materialised, DERIVED operational state,
--                                changed only together with a ledger append.
--
-- No sign CHECK on paid balances (negative credit is governed, no floor/max),
-- no ceiling on any trial value, and no trial default other than zero. The
-- governed "initial grant 3-5" rule belongs to the (later) grant command and
-- is NOT a universal account default (DEC-SUB-014, FD-COM-001).

-- ---------------------------------------------------------------------------
-- Shared immutability guard: any UPDATE or DELETE on a table carrying this
-- trigger raises. Stronger than "absence of an updater" because these rows
-- are money-affecting / audit evidence (design §7 I-3).
-- ---------------------------------------------------------------------------
CREATE FUNCTION commercial_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'WP-COM-01: % on % is not permitted -- this Commercial table is append-only and immutable', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'restrict_violation';
END;
$$;

-- ---------------------------------------------------------------------------
-- commercial_accounts: one materialised row per Business (design §20).
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_accounts (
  business_id TEXT PRIMARY KEY CHECK (length(btrim(business_id)) > 0),
  -- Set at account opening (seeded from Business.countryCode by the future
  -- open command) and then frozen. Scope is Burundi / Rwanda only.
  settlement_market TEXT NOT NULL CHECK (settlement_market IN ('BI', 'RW')),
  -- Rewards made available before this instant are never billed retroactively.
  commercial_effective_from TIMESTAMPTZ NOT NULL,
  -- Materialised counters (derived from the ledger). No default other than 0.
  trial_remaining_units INTEGER NOT NULL DEFAULT 0,
  paid_balance_units INTEGER NOT NULL DEFAULT 0,          -- may be negative: NO sign CHECK
  trial_reserved_units INTEGER NOT NULL DEFAULT 0,
  paid_reserved_units INTEGER NOT NULL DEFAULT 0,
  -- Administrative restriction (admin-set fact; not a Business lifecycle state).
  service_restriction TEXT NOT NULL DEFAULT 'none'
    CHECK (service_restriction IN ('none', 'restricted')),
  paid_service_activated_at TIMESTAMPTZ NULL,             -- set-once (trigger below)
  -- Monotonic account version: +1 per ledger append, unchanged by flag-only updates (trigger below).
  version BIGINT NOT NULL DEFAULT 0 CHECK (version >= 0),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- design §20: trial_remaining >= trial_reserved >= 0; paid_reserved >= 0.
  CONSTRAINT commercial_accounts_trial_bounds
    CHECK (trial_reserved_units >= 0 AND trial_remaining_units >= trial_reserved_units),
  CONSTRAINT commercial_accounts_paid_reserved_nonnegative
    CHECK (paid_reserved_units >= 0)
);

COMMENT ON TABLE commercial_accounts IS
  'WP-COM-01: materialised per-Business commercial state, DERIVED from commercial_ledger_entries (the accounting authority). Changed only together with a ledger append (version +1); never deleted. Not a loyalty table; holds no customer identity.';

CREATE FUNCTION commercial_accounts_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'WP-COM-01: commercial_accounts rows are never deleted'
      USING ERRCODE = 'restrict_violation';
  END IF;
  -- UPDATE
  IF NEW.business_id <> OLD.business_id
     OR NEW.settlement_market <> OLD.settlement_market
     OR NEW.commercial_effective_from <> OLD.commercial_effective_from
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'WP-COM-01: business_id, settlement_market, commercial_effective_from and created_at are immutable on commercial_accounts'
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.paid_service_activated_at IS NOT NULL
     AND NEW.paid_service_activated_at IS DISTINCT FROM OLD.paid_service_activated_at THEN
    RAISE EXCEPTION 'WP-COM-01: paid_service_activated_at is set-once'
      USING ERRCODE = 'restrict_violation';
  END IF;
  -- Counter changes must come with a version advance of exactly 1 (a
  -- corresponding ledger entry is enforced at COMMIT below); administrative
  -- flag-only changes (restriction, paid activation) must NOT move it.
  IF NEW.trial_remaining_units <> OLD.trial_remaining_units
     OR NEW.paid_balance_units <> OLD.paid_balance_units
     OR NEW.trial_reserved_units <> OLD.trial_reserved_units
     OR NEW.paid_reserved_units <> OLD.paid_reserved_units THEN
    IF NEW.version <> OLD.version + 1 THEN
      RAISE EXCEPTION 'WP-COM-01: commercial_accounts.version must advance by exactly 1 when counters change (was %, attempted %) -- stale or lost update',
        OLD.version, NEW.version
        USING ERRCODE = 'serialization_failure';
    END IF;
  ELSIF NEW.version <> OLD.version THEN
    RAISE EXCEPTION 'WP-COM-01: commercial_accounts.version may only change together with the counters (a ledger append)'
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_accounts_guard
  BEFORE UPDATE OR DELETE ON commercial_accounts
  FOR EACH ROW EXECUTE FUNCTION commercial_accounts_guard();

-- ---------------------------------------------------------------------------
-- commercial_price_schedules: append-only, effective-dated pricing
-- (design §13/§14). NO rows are seeded: launch BIF/RWF prices are Founder
-- launch inputs, not decided here. No live FX anywhere.
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_price_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market TEXT NOT NULL CHECK (market IN ('BI', 'RW')),
  currency TEXT NOT NULL CHECK (currency IN ('BIF', 'RWF')),
  -- Canonical commercial-unit basis. The governed value (USD 2 = 200 minor)
  -- is validated by the command layer, deliberately NOT a DB CHECK, so a
  -- future Founder change is a controlled decision rather than a migration.
  usd_equivalent_minor BIGINT NOT NULL CHECK (usd_equivalent_minor > 0),
  -- BIF / RWF have no minor unit: whole integers. Rounding is applied once,
  -- by the administrator, when the price is set.
  local_unit_price_minor BIGINT NOT NULL CHECK (local_unit_price_minor > 0),
  rate_note TEXT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  created_by TEXT NOT NULL CHECK (length(btrim(created_by)) > 0),
  reason_text TEXT NOT NULL CHECK (length(btrim(reason_text)) > 0),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commercial_price_schedules_market_currency
    CHECK ((market = 'BI' AND currency = 'BIF') OR (market = 'RW' AND currency = 'RWF')),
  CONSTRAINT commercial_price_schedules_market_effective_unique
    UNIQUE (market, effective_from)
);

COMMENT ON TABLE commercial_price_schedules IS
  'WP-COM-01: append-only effective-dated local unit price schedule per market. Price in force at t = latest row with effective_from <= t. A correction is a NEW row with a later effective_from; rows are immutable. Intentionally unseeded.';

-- Versioning: a new schedule row must take effect strictly AFTER the latest
-- existing one for its market, so history is a single non-overlapping,
-- monotonic timeline. Serialised per market so two concurrent inserts cannot
-- both pass the check against a stale view.
CREATE FUNCTION commercial_price_schedules_versioning() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  latest TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('commercial_price_schedules:' || NEW.market));
  SELECT max(effective_from) INTO latest
    FROM commercial_price_schedules WHERE market = NEW.market;
  IF latest IS NOT NULL AND NEW.effective_from <= latest THEN
    RAISE EXCEPTION 'WP-COM-01: price schedule effective_from % is not after the latest existing schedule (%) for market % -- corrections are new rows with a later effective_from',
      NEW.effective_from, latest, NEW.market
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_price_schedules_versioning
  BEFORE INSERT ON commercial_price_schedules
  FOR EACH ROW EXECUTE FUNCTION commercial_price_schedules_versioning();

CREATE TRIGGER commercial_price_schedules_immutable
  BEFORE UPDATE OR DELETE ON commercial_price_schedules
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- commercial_ledger_entries: append-only ACCOUNTING AUTHORITY (design §7).
-- Two buckets (trial / paid). units_delta moves `bucket`'s balance; the
-- reserved deltas move the two reserved counters. Reservation *behaviour*
-- (admission, earmarks) is a later WP; the columns only make it representable.
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL
    REFERENCES commercial_accounts (business_id) ON DELETE RESTRICT,   -- Commercial-internal FK (R11)
  -- Deterministic per-Business ordering: equals the account version this
  -- entry produced. 1, 2, 3, ... with no gaps or duplicates.
  account_version BIGINT NOT NULL CHECK (account_version >= 1),
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'trial_grant', 'trial_adjustment',
    'credit_grant', 'credit_adjustment',
    'capacity_reserved', 'capacity_released',
    'consumption', 'consumption_reversal',
    'settlement_void_reversal')),
  bucket TEXT NOT NULL CHECK (bucket IN ('trial', 'paid')),
  units_delta INTEGER NOT NULL DEFAULT 0,
  trial_reserved_delta INTEGER NOT NULL DEFAULT 0,
  paid_reserved_delta INTEGER NOT NULL DEFAULT 0,
  -- Point-in-time counters after this entry (no replay needed).
  trial_after INTEGER NOT NULL,
  paid_after INTEGER NOT NULL,                       -- may be negative: NO sign CHECK
  trial_reserved_after INTEGER NOT NULL,
  paid_reserved_after INTEGER NOT NULL,
  -- Soft, opaque provenance reference (no FK to any Loyalty row, R8/R9).
  source_reference_type TEXT NULL,
  source_reference_id TEXT NULL,
  reason_code TEXT NULL,
  reason_text TEXT NULL,
  -- Idempotent scope/reference, e.g. 'consume:<cycle>', 'cmd:<key>:<n>'.
  idempotency_scope_key TEXT NOT NULL CHECK (length(btrim(idempotency_scope_key)) > 0),
  created_by TEXT NOT NULL CHECK (length(btrim(created_by)) > 0),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commercial_ledger_entries_idempotency_scope_unique UNIQUE (idempotency_scope_key),
  CONSTRAINT commercial_ledger_entries_business_version_unique UNIQUE (business_id, account_version),
  CONSTRAINT commercial_ledger_entries_source_reference_pair
    CHECK ((source_reference_type IS NULL) = (source_reference_id IS NULL)),
  -- The account-level bounds hold at every point in time (no ceiling, no
  -- negative-credit floor; paid_after unconstrained).
  CONSTRAINT commercial_ledger_entries_after_bounds
    CHECK (trial_reserved_after >= 0 AND trial_after >= trial_reserved_after AND paid_reserved_after >= 0),
  -- Bucket/type compatibility and delta sign semantics (design §7).
  CONSTRAINT commercial_ledger_entries_type_shape CHECK (
    (entry_type = 'trial_grant'
       AND bucket = 'trial' AND units_delta > 0
       AND trial_reserved_delta = 0 AND paid_reserved_delta = 0) OR
    (entry_type = 'trial_adjustment'
       AND bucket = 'trial' AND units_delta <> 0
       AND trial_reserved_delta = 0 AND paid_reserved_delta = 0) OR
    (entry_type = 'credit_grant'
       AND bucket = 'paid' AND units_delta > 0
       AND trial_reserved_delta = 0 AND paid_reserved_delta = 0) OR
    (entry_type = 'credit_adjustment'
       AND bucket = 'paid' AND units_delta <> 0
       AND trial_reserved_delta = 0 AND paid_reserved_delta = 0) OR
    (entry_type = 'settlement_void_reversal'
       AND bucket = 'paid' AND units_delta < 0
       AND trial_reserved_delta = 0 AND paid_reserved_delta = 0) OR
    (entry_type = 'capacity_reserved'
       AND units_delta = 0
       AND trial_reserved_delta >= 0 AND paid_reserved_delta >= 0
       AND trial_reserved_delta + paid_reserved_delta > 0) OR
    (entry_type = 'capacity_released'
       AND units_delta = 0
       AND trial_reserved_delta <= 0 AND paid_reserved_delta <= 0
       AND trial_reserved_delta + paid_reserved_delta < 0) OR
    (entry_type = 'consumption'
       AND units_delta = -1
       AND ((bucket = 'trial' AND trial_reserved_delta IN (-1, 0) AND paid_reserved_delta = 0)
         OR (bucket = 'paid' AND paid_reserved_delta IN (-1, 0) AND trial_reserved_delta = 0))) OR
    (entry_type = 'consumption_reversal'
       AND units_delta = 1
       AND trial_reserved_delta = 0 AND paid_reserved_delta = 0)
  )
);

COMMENT ON TABLE commercial_ledger_entries IS
  'WP-COM-01: append-only, immutable Commercial ACCOUNTING AUTHORITY. Never updated or deleted (trigger). Corrections are compensating entries. commercial_accounts is derived from this table.';

CREATE INDEX commercial_ledger_entries_business_order
  ON commercial_ledger_entries (business_id, account_version);

CREATE TRIGGER commercial_ledger_entries_immutable
  BEFORE UPDATE OR DELETE ON commercial_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- Account <-> ledger derivation guard (design §7 I-1): at COMMIT, an
-- account's counters and version must equal its latest ledger entry (or be
-- the zero opening state when it has none). Makes it impossible to commit a
-- hand-edited account row, or a ledger append without the matching account
-- update, or the reverse. Deferred so a single transaction may perform
-- "append entry" then "update account" in either order.
-- ---------------------------------------------------------------------------
CREATE FUNCTION commercial_assert_account_matches_ledger() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  acct commercial_accounts%ROWTYPE;
  last_entry commercial_ledger_entries%ROWTYPE;
  target_business TEXT;
BEGIN
  target_business := NEW.business_id;
  SELECT * INTO acct FROM commercial_accounts WHERE business_id = target_business;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT * INTO last_entry FROM commercial_ledger_entries
    WHERE business_id = target_business ORDER BY account_version DESC LIMIT 1;
  IF NOT FOUND THEN
    IF acct.version <> 0 OR acct.trial_remaining_units <> 0 OR acct.paid_balance_units <> 0
       OR acct.trial_reserved_units <> 0 OR acct.paid_reserved_units <> 0 THEN
      RAISE EXCEPTION 'WP-COM-01: account % has non-zero state or version but no ledger entries', target_business
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN NULL;
  END IF;
  IF acct.version <> last_entry.account_version
     OR acct.trial_remaining_units <> last_entry.trial_after
     OR acct.paid_balance_units <> last_entry.paid_after
     OR acct.trial_reserved_units <> last_entry.trial_reserved_after
     OR acct.paid_reserved_units <> last_entry.paid_reserved_after THEN
    RAISE EXCEPTION 'WP-COM-01: account % counters/version do not equal its latest ledger entry (ledger is the authority)', target_business
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER commercial_accounts_match_ledger
  AFTER INSERT OR UPDATE ON commercial_accounts
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION commercial_assert_account_matches_ledger();

CREATE CONSTRAINT TRIGGER commercial_ledger_matches_account
  AFTER INSERT ON commercial_ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION commercial_assert_account_matches_ledger();

-- ---------------------------------------------------------------------------
-- commercial_standing_events: immutable timeline of administrative standing
-- changes (account opened, restriction, restoration, paid activation).
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_standing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL
    REFERENCES commercial_accounts (business_id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'account_opened', 'service_restricted', 'service_restored', 'paid_service_activated')),
  actor_id TEXT NOT NULL CHECK (length(btrim(actor_id)) > 0),
  reason_text TEXT NOT NULL CHECK (length(btrim(reason_text)) > 0),
  idempotency_scope_key TEXT NOT NULL CHECK (length(btrim(idempotency_scope_key)) > 0),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commercial_standing_events_scope_unique UNIQUE (idempotency_scope_key)
);

CREATE INDEX commercial_standing_events_business_time
  ON commercial_standing_events (business_id, occurred_at);

CREATE TRIGGER commercial_standing_events_immutable
  BEFORE UPDATE OR DELETE ON commercial_standing_events
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- commercial_audit_events: immutable administrative audit (design §18,
-- TRD18 §18.49). WHO did WHAT to WHICH BUSINESS, WHEN, WHY, under WHICH
-- REFERENCE, with WHAT RESULT. Owned by Commercial: audit must be atomic
-- with the ledger mutation, which a Firestore write cannot be; Trust Events
-- are customer-facing and are deliberately NOT used.
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- WHO
  actor_type TEXT NOT NULL CHECK (actor_type IN ('platform_administrator', 'system')),
  actor_id TEXT NOT NULL CHECK (length(btrim(actor_id)) > 0),
  -- WHAT
  action_type TEXT NOT NULL CHECK (action_type ~ '^[a-z][a-z0-9_]*$'),
  target_type TEXT NOT NULL CHECK (length(btrim(target_type)) > 0),
  target_id TEXT NOT NULL CHECK (length(btrim(target_id)) > 0),
  -- WHICH BUSINESS (soft, opaque: audit must outlive and never lock other rows)
  business_id TEXT NOT NULL CHECK (length(btrim(business_id)) > 0),
  -- WHY
  reason_code TEXT NULL,
  reason_text TEXT NOT NULL CHECK (length(btrim(reason_text)) > 0),
  -- WHICH REFERENCE
  reference TEXT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NULL,
  -- WHAT RESULT
  result TEXT NOT NULL CHECK (result IN ('succeeded', 'denied', 'no_change')),
  before_snapshot JSONB NULL,
  after_snapshot JSONB NULL,
  -- Commercial-internal related ids (R11).
  ledger_entry_id UUID NULL REFERENCES commercial_ledger_entries (id) ON DELETE RESTRICT,
  price_schedule_id UUID NULL REFERENCES commercial_price_schedules (id) ON DELETE RESTRICT,
  -- WHEN
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1
);

-- One audit row per (idempotency key, action): a replayed command cannot
-- double-audit. Rows without a key (system events) are exempt.
CREATE UNIQUE INDEX commercial_audit_events_key_action_unique
  ON commercial_audit_events (idempotency_key, action_type)
  WHERE idempotency_key IS NOT NULL;
-- TRD18 §18.50 search fields.
CREATE INDEX commercial_audit_events_business_time
  ON commercial_audit_events (business_id, occurred_at);
CREATE INDEX commercial_audit_events_actor_time
  ON commercial_audit_events (actor_id, occurred_at);
CREATE INDEX commercial_audit_events_action_time
  ON commercial_audit_events (action_type, occurred_at);

CREATE TRIGGER commercial_audit_events_immutable
  BEFORE UPDATE OR DELETE ON commercial_audit_events
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();

-- TRUNCATE bypasses row-level triggers, so it is blocked explicitly on every
-- immutable table (and on the account table, which is never emptied).
CREATE TRIGGER commercial_price_schedules_no_truncate
  BEFORE TRUNCATE ON commercial_price_schedules
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_ledger_entries_no_truncate
  BEFORE TRUNCATE ON commercial_ledger_entries
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_standing_events_no_truncate
  BEFORE TRUNCATE ON commercial_standing_events
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_audit_events_no_truncate
  BEFORE TRUNCATE ON commercial_audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_accounts_no_truncate
  BEFORE TRUNCATE ON commercial_accounts
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();
