-- WP-COM-02 — Commercial manual/offline settlements
-- (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §10, §13, §14, §15 #4/#5, §20).
--
-- ADDITIVE: creates exactly one table (`commercial_settlements`) and its guard
-- functions/triggers. No existing table, column, constraint or index is
-- altered, and nothing here references, or is referenced by, any Loyalty /
-- Purchase / Reward table (design §4.4 R8/R9). Every foreign key points to
-- another `commercial_*` table (R11). `business_id` stays an opaque TEXT
-- owned by Firestore (R10).
--
-- A settlement is EVIDENCE that commercial payment was received outside any
-- automated provider integration. It is two-step (design §10.1):
--   recorded  -> evidence exists; NO credit
--   confirmed -> finalised; exactly one `credit_grant` ledger entry references it
-- No status other than these two exists yet (voiding is a later package).
--
-- Deliberately NOT created here (later packages): trial grants, manual
-- adjustments, admissions/earmarks, consumption claims/events, notification
-- intents, read-model views, payment-provider columns. `source` is fixed to
-- 'manual'; a future provider adapter widens it additively.
--
-- The settlement snapshots the price schedule in force at `received_at`
-- (design §13) so history is reconstructable and immune to later price rows.
-- No price value is seeded and no FX rate is consulted.

CREATE TABLE commercial_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL
    REFERENCES commercial_accounts (business_id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'confirmed')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source = 'manual'),
  -- Free-form but shape-checked operator label (e.g. how the money arrived).
  -- No closed vocabulary is invented here.
  method TEXT NOT NULL CHECK (method ~ '^[a-z][a-z0-9_]{0,63}$'),
  -- Operator-supplied evidence reference (receipt / transfer / mobile-money id).
  external_reference TEXT NOT NULL
    CHECK (length(btrim(external_reference)) > 0
       AND external_reference = btrim(external_reference)
       AND length(external_reference) <= 200),
  market TEXT NOT NULL CHECK (market IN ('BI', 'RW')),
  currency TEXT NOT NULL CHECK (currency IN ('BIF', 'RWF')),
  -- Whole local currency units actually received (BIF / RWF have no minor unit).
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  units_purchased INTEGER NOT NULL CHECK (units_purchased > 0),
  received_at TIMESTAMPTZ NOT NULL,

  -- Immutable pricing provenance (design §13): reference + snapshot.
  price_schedule_id UUID NOT NULL
    REFERENCES commercial_price_schedules (id) ON DELETE RESTRICT,
  unit_price_usd_minor BIGINT NOT NULL CHECK (unit_price_usd_minor > 0),
  local_unit_price_minor BIGINT NOT NULL CHECK (local_unit_price_minor > 0),
  price_effective_from TIMESTAMPTZ NOT NULL,
  expected_amount_minor BIGINT NOT NULL,
  -- amount received minus expected; recorded, never blocking (design §10.2).
  variance_minor BIGINT NOT NULL,

  -- Step 1: recorded.
  recorded_by TEXT NOT NULL CHECK (length(btrim(recorded_by)) > 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  record_reason_text TEXT NOT NULL CHECK (length(btrim(record_reason_text)) > 0),
  record_idempotency_key TEXT NOT NULL CHECK (length(btrim(record_idempotency_key)) > 0),
  record_correlation_id TEXT NOT NULL,

  -- Step 2: confirmed (all NULL until confirmation).
  confirmed_by TEXT NULL,
  confirmed_at TIMESTAMPTZ NULL,
  confirmation_note TEXT NULL,
  confirm_idempotency_key TEXT NULL,
  confirm_correlation_id TEXT NULL,
  ledger_entry_id UUID NULL
    REFERENCES commercial_ledger_entries (id) ON DELETE RESTRICT,

  schema_version INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT commercial_settlements_market_currency
    CHECK ((market = 'BI' AND currency = 'BIF') OR (market = 'RW' AND currency = 'RWF')),
  CONSTRAINT commercial_settlements_expected_amount
    CHECK (expected_amount_minor = units_purchased::BIGINT * local_unit_price_minor),
  CONSTRAINT commercial_settlements_variance
    CHECK (variance_minor = amount_minor - expected_amount_minor),
  CONSTRAINT commercial_settlements_price_effective_not_after_receipt
    CHECK (price_effective_from <= received_at),
  CONSTRAINT commercial_settlements_confirmation_consistency CHECK (
    (status = 'recorded'
       AND confirmed_by IS NULL AND confirmed_at IS NULL AND confirmation_note IS NULL
       AND confirm_idempotency_key IS NULL AND confirm_correlation_id IS NULL
       AND ledger_entry_id IS NULL)
    OR
    (status = 'confirmed'
       AND length(btrim(confirmed_by)) > 0 AND confirmed_at IS NOT NULL
       AND length(btrim(confirmation_note)) > 0
       AND length(btrim(confirm_idempotency_key)) > 0 AND confirm_correlation_id IS NOT NULL
       AND ledger_entry_id IS NOT NULL)
  ),
  -- A manual reference can evidence at most one settlement (replay protection).
  CONSTRAINT commercial_settlements_method_reference_unique UNIQUE (method, external_reference),
  CONSTRAINT commercial_settlements_record_key_unique UNIQUE (record_idempotency_key),
  CONSTRAINT commercial_settlements_confirm_key_unique UNIQUE (confirm_idempotency_key),
  -- One ledger credit can finalise at most one settlement.
  CONSTRAINT commercial_settlements_ledger_entry_unique UNIQUE (ledger_entry_id)
);

COMMENT ON TABLE commercial_settlements IS
  'WP-COM-02: manual/offline settlement evidence. Two-step: recorded (no credit) -> confirmed (exactly one credit_grant ledger entry). The evidence and pricing snapshot columns are immutable; only the confirmation columns may be set, once. Never deleted. Not a loyalty table.';

CREATE INDEX commercial_settlements_business_time
  ON commercial_settlements (business_id, recorded_at);
CREATE INDEX commercial_settlements_status_time
  ON commercial_settlements (status, recorded_at);

-- ---------------------------------------------------------------------------
-- INSERT guard: a settlement can only be born `recorded`, in its Business's
-- own market, and its price snapshot must equal the schedule that was in
-- force at `received_at` (the latest with effective_from <= received_at).
-- ---------------------------------------------------------------------------
CREATE FUNCTION commercial_settlements_insert_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  acct_market TEXT;
  sched commercial_price_schedules%ROWTYPE;
BEGIN
  IF NEW.status <> 'recorded' THEN
    RAISE EXCEPTION 'WP-COM-02: a settlement must be inserted with status recorded'
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT settlement_market INTO acct_market FROM commercial_accounts WHERE business_id = NEW.business_id;
  IF acct_market IS DISTINCT FROM NEW.market THEN
    RAISE EXCEPTION 'WP-COM-02: settlement market % does not match the Business account market %', NEW.market, acct_market
      USING ERRCODE = 'check_violation';
  END IF;
  -- Serialise with schedule writers (same per-market lock as the 0021 versioning
  -- trigger), so a concurrently inserted, still-uncommitted schedule cannot be
  -- missed by the "in force at received_at" check below.
  PERFORM pg_advisory_xact_lock(hashtext('commercial_price_schedules:' || NEW.market));
  SELECT * INTO sched FROM commercial_price_schedules WHERE id = NEW.price_schedule_id;
  IF NOT FOUND
     OR sched.market <> NEW.market
     OR sched.currency <> NEW.currency
     OR sched.usd_equivalent_minor <> NEW.unit_price_usd_minor
     OR sched.local_unit_price_minor <> NEW.local_unit_price_minor
     OR sched.effective_from <> NEW.price_effective_from THEN
    RAISE EXCEPTION 'WP-COM-02: settlement price snapshot does not equal its price schedule'
      USING ERRCODE = 'check_violation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM commercial_price_schedules
     WHERE market = NEW.market AND effective_from <= NEW.received_at
       AND effective_from > sched.effective_from
  ) THEN
    RAISE EXCEPTION 'WP-COM-02: price schedule % was not the schedule in force at received_at %', NEW.price_schedule_id, NEW.received_at
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_settlements_insert_guard
  BEFORE INSERT ON commercial_settlements
  FOR EACH ROW EXECUTE FUNCTION commercial_settlements_insert_guard();

-- ---------------------------------------------------------------------------
-- UPDATE guard: the ONLY permitted change is recorded -> confirmed, setting
-- the confirmation columns; every evidence / pricing column is frozen, and a
-- confirmed settlement can never change again. The confirming ledger entry
-- must be this Business's paid `credit_grant` for exactly `units_purchased`,
-- referencing this settlement.
-- ---------------------------------------------------------------------------
CREATE FUNCTION commercial_settlements_update_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  entry commercial_ledger_entries%ROWTYPE;
BEGIN
  IF OLD.status <> 'recorded' OR NEW.status <> 'confirmed' THEN
    RAISE EXCEPTION 'WP-COM-02: settlement status may only change recorded -> confirmed (was %, attempted %)', OLD.status, NEW.status
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF (NEW.id, NEW.business_id, NEW.source, NEW.method, NEW.external_reference, NEW.market,
      NEW.currency, NEW.amount_minor, NEW.units_purchased, NEW.received_at,
      NEW.price_schedule_id, NEW.unit_price_usd_minor, NEW.local_unit_price_minor,
      NEW.price_effective_from, NEW.expected_amount_minor, NEW.variance_minor,
      NEW.recorded_by, NEW.recorded_at, NEW.record_reason_text,
      NEW.record_idempotency_key, NEW.record_correlation_id, NEW.schema_version)
     IS DISTINCT FROM
     (OLD.id, OLD.business_id, OLD.source, OLD.method, OLD.external_reference, OLD.market,
      OLD.currency, OLD.amount_minor, OLD.units_purchased, OLD.received_at,
      OLD.price_schedule_id, OLD.unit_price_usd_minor, OLD.local_unit_price_minor,
      OLD.price_effective_from, OLD.expected_amount_minor, OLD.variance_minor,
      OLD.recorded_by, OLD.recorded_at, OLD.record_reason_text,
      OLD.record_idempotency_key, OLD.record_correlation_id, OLD.schema_version) THEN
    RAISE EXCEPTION 'WP-COM-02: settlement evidence and pricing provenance columns are immutable'
      USING ERRCODE = 'restrict_violation';
  END IF;
  SELECT * INTO entry FROM commercial_ledger_entries WHERE id = NEW.ledger_entry_id;
  IF NOT FOUND
     OR entry.business_id <> NEW.business_id
     OR entry.entry_type <> 'credit_grant'
     OR entry.bucket <> 'paid'
     OR entry.units_delta <> NEW.units_purchased
     OR entry.source_reference_type IS DISTINCT FROM 'settlement'
     OR entry.source_reference_id IS DISTINCT FROM NEW.id::text THEN
    RAISE EXCEPTION 'WP-COM-02: settlement % must be confirmed by a paid credit_grant for its own units in the same Business referencing it', NEW.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_settlements_update_guard
  BEFORE UPDATE ON commercial_settlements
  FOR EACH ROW EXECUTE FUNCTION commercial_settlements_update_guard();

CREATE TRIGGER commercial_settlements_no_delete
  BEFORE DELETE ON commercial_settlements
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();

CREATE TRIGGER commercial_settlements_no_truncate
  BEFORE TRUNCATE ON commercial_settlements
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- Exactly-once settlement credit at the LEDGER level: at most one
-- `credit_grant` may reference a given settlement, whatever its idempotency
-- scope key. (A plain index on the existing ledger table -- the table itself
-- is not altered.) Together with the settlement's own UNIQUE(ledger_entry_id)
-- and the update guard, a settlement can never be credited twice.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX commercial_ledger_one_credit_per_settlement
  ON commercial_ledger_entries (source_reference_id)
  WHERE entry_type = 'credit_grant' AND source_reference_type = 'settlement';
