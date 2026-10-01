-- WP-COM-04 — Commercial Consumption Projection
-- (11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002, §4.4 R1/R2/R3, §5, §20, §22).
--
-- One Commercial unit is consumed when a Circle's governed 10-unit earning
-- side completes and its Reward becomes available (FD-B). The authoritative
-- fact is the `rewards` row. Redemption does NOT create consumption.
--
-- ADDITIVE. The only object attached to a Loyalty table is ONE performance
-- index on `rewards` (design §20: "additive loyalty-side performance index");
-- no Loyalty column, constraint, trigger or row is altered. The single
-- Commercial -> Loyalty foreign key is the composite claim FK below (design
-- §4.4 R1), which is safe because the claim is inserted BEFORE the projecting
-- transaction takes the Commercial account lock (rule iii) and carries NO
-- funding classification. `commercial_consumption_events` (which carries the
-- bucket and is written AFTER the account lock) has NO foreign key to any
-- Loyalty row (R2/R3/R8).
--
-- Deliberately NOT created here (later work packages): admissions, admission
-- blocks / earmarks, pending_admission, capacity gate, scheduler, read models.
-- `earmark_id` on the event is therefore a plain nullable UUID today; WP-COM-05
-- adds its foreign key when the earmark table exists.

-- ---------------------------------------------------------------------------
-- commercial_consumption_claims: the FK anchor for ONE Reward. No funding
-- classification, no amounts (CORR-002). UNIQUE per Cycle = the exactly-once
-- source key. Never committed alone: a deferred constraint trigger below
-- refuses to commit a claim that has no event.
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_consumption_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL CHECK (length(btrim(business_id)) > 0),  -- opaque; proven against the Reward by trigger
  source_reward_id UUID NOT NULL,
  source_loyalty_cycle_id UUID NOT NULL,
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- R1: the Reward belongs to that Cycle (uses the existing 0020 UNIQUE).
  CONSTRAINT commercial_consumption_claims_reward_in_cycle
    FOREIGN KEY (source_reward_id, source_loyalty_cycle_id)
    REFERENCES rewards (id, loyalty_cycle_id) ON DELETE RESTRICT,
  CONSTRAINT commercial_consumption_claims_cycle_unique UNIQUE (source_loyalty_cycle_id),
  CONSTRAINT commercial_consumption_claims_reward_unique UNIQUE (source_reward_id),
  CONSTRAINT commercial_consumption_claims_identity_unique
    UNIQUE (id, source_loyalty_cycle_id, business_id)
);

COMMENT ON TABLE commercial_consumption_claims IS
  'WP-COM-04: immutable FK anchor claiming ONE Reward for Commercial consumption. Holds no funding classification and no amounts. UNIQUE(source_loyalty_cycle_id) is the exactly-once source key. Inserted before the Commercial account lock and committed only together with its consumption event.';

-- The claim's Business must be the Reward's Business. A plain (non-locking)
-- read of the parent row: it takes no lock beyond the key-share the FK already
-- takes, so it adds nothing to the lock-order analysis (design §22.2).
CREATE FUNCTION commercial_consumption_claims_reward_business_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  reward_business TEXT;
BEGIN
  SELECT business_id INTO reward_business FROM rewards WHERE id = NEW.source_reward_id;
  IF reward_business IS NULL OR reward_business <> NEW.business_id THEN
    RAISE EXCEPTION 'WP-COM-04: consumption claim Business % does not match the Business of Reward %', NEW.business_id, NEW.source_reward_id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_consumption_claims_reward_business_guard
  BEFORE INSERT ON commercial_consumption_claims
  FOR EACH ROW EXECUTE FUNCTION commercial_consumption_claims_reward_business_guard();

CREATE TRIGGER commercial_consumption_claims_immutable
  BEFORE UPDATE OR DELETE ON commercial_consumption_claims
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_consumption_claims_no_truncate
  BEFORE TRUNCATE ON commercial_consumption_claims
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- commercial_consumption_events: the classified, immutable fact. One per
-- consumed unit. Written only AFTER the account lock. No FK to any Loyalty row.
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_consumption_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL,
  business_id TEXT NOT NULL CHECK (length(btrim(business_id)) > 0),
  -- R3: soft reference, copied from the Reward row (no lock, no coupling).
  reward_program_id UUID NOT NULL,
  source_loyalty_cycle_id UUID NOT NULL,
  -- The Reward's `available_at`: when the unit was consumed (FD-B).
  source_fact_at TIMESTAMPTZ NOT NULL,
  unit_count INTEGER NOT NULL CHECK (unit_count = 1),
  bucket TEXT NOT NULL CHECK (bucket IN ('trial', 'paid')),
  -- Future-compatible earmark reference (INV-CAP-PROV). Plain UUID today; the
  -- FK to the admission earmark table arrives with WP-COM-05. NULL only for
  -- the flagged, observable fallback.
  earmark_id UUID NULL,
  bucket_source TEXT NOT NULL CHECK (bucket_source IN ('earmark', 'consumption_time_fallback')),
  -- The locked account version the funding decision read (before this debit).
  account_version BIGINT NOT NULL CHECK (account_version >= 0),
  -- Pricing provenance (design §13): schedule id + immutable snapshots, all
  -- present or all absent. Absent = no schedule applied; there is NO fallback
  -- price, and a missing price never blocks consumption.
  price_schedule_id UUID NULL REFERENCES commercial_price_schedules (id) ON DELETE RESTRICT,
  unit_price_usd_minor BIGINT NULL,
  local_currency TEXT NULL,
  local_unit_price_minor BIGINT NULL,
  ledger_entry_id UUID NOT NULL REFERENCES commercial_ledger_entries (id) ON DELETE RESTRICT,
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- R2: Commercial-internal, proves the event belongs to that claim/Cycle/Business.
  CONSTRAINT commercial_consumption_events_claim_identity
    FOREIGN KEY (claim_id, source_loyalty_cycle_id, business_id)
    REFERENCES commercial_consumption_claims (id, source_loyalty_cycle_id, business_id)
    ON DELETE RESTRICT,
  CONSTRAINT commercial_consumption_events_claim_unique UNIQUE (claim_id),
  CONSTRAINT commercial_consumption_events_cycle_unique UNIQUE (source_loyalty_cycle_id),
  CONSTRAINT commercial_consumption_events_ledger_entry_unique UNIQUE (ledger_entry_id),
  CONSTRAINT commercial_consumption_events_bucket_source_shape CHECK (
    (bucket_source = 'earmark' AND earmark_id IS NOT NULL) OR
    (bucket_source = 'consumption_time_fallback' AND earmark_id IS NULL)),
  CONSTRAINT commercial_consumption_events_price_shape CHECK (
    (price_schedule_id IS NULL AND unit_price_usd_minor IS NULL
       AND local_currency IS NULL AND local_unit_price_minor IS NULL) OR
    (price_schedule_id IS NOT NULL AND unit_price_usd_minor IS NOT NULL
       AND local_currency IS NOT NULL AND local_unit_price_minor IS NOT NULL))
);

-- One consumption per earmark, once earmarks exist (partial: fallback rows carry NULL).
CREATE UNIQUE INDEX commercial_consumption_events_earmark_unique
  ON commercial_consumption_events (earmark_id) WHERE earmark_id IS NOT NULL;
CREATE INDEX commercial_consumption_events_business_time
  ON commercial_consumption_events (business_id, recorded_at);
-- Fallback observability (count of fallback consumptions).
CREATE INDEX commercial_consumption_events_fallback
  ON commercial_consumption_events (business_id) WHERE bucket_source = 'consumption_time_fallback';

COMMENT ON TABLE commercial_consumption_events IS
  'WP-COM-04: immutable classified consumption fact, one per Reward/Circle. bucket is decided under the Commercial account lock (or is the immutable earmark) and is never re-derived. No FK to any Loyalty row.';

-- The event must describe exactly the ledger debit it links to: a
-- `consumption` entry of one unit, in the same bucket and Business, under the
-- scope key `consume:<cycle>`. The ledger row already exists (FK parent-first).
CREATE FUNCTION commercial_consumption_events_ledger_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  entry commercial_ledger_entries%ROWTYPE;
BEGIN
  SELECT * INTO entry FROM commercial_ledger_entries WHERE id = NEW.ledger_entry_id;
  IF NOT FOUND
     OR entry.entry_type <> 'consumption'
     OR entry.units_delta <> -1
     OR entry.bucket <> NEW.bucket
     OR entry.business_id <> NEW.business_id
     OR entry.idempotency_scope_key <> 'consume:' || NEW.source_loyalty_cycle_id::text THEN
    RAISE EXCEPTION 'WP-COM-04: consumption event does not match its ledger debit (type, one unit, bucket, Business and scope key consume:<cycle>)'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commercial_consumption_events_ledger_guard
  BEFORE INSERT ON commercial_consumption_events
  FOR EACH ROW EXECUTE FUNCTION commercial_consumption_events_ledger_guard();

CREATE TRIGGER commercial_consumption_events_immutable
  BEFORE UPDATE OR DELETE ON commercial_consumption_events
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_consumption_events_no_truncate
  BEFORE TRUNCATE ON commercial_consumption_events
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();

-- A claim can never be committed without its event ("never committed alone",
-- design §5.2): no half-state can survive COMMIT, whatever the caller does.
CREATE FUNCTION commercial_consumption_claims_require_event() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM commercial_consumption_events WHERE claim_id = NEW.id) THEN
    RAISE EXCEPTION 'WP-COM-04: consumption claim % has no consumption event at commit (a claim is never committed alone)', NEW.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER commercial_consumption_claims_require_event
  AFTER INSERT ON commercial_consumption_claims
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION commercial_consumption_claims_require_event();

-- ---------------------------------------------------------------------------
-- commercial_projection_failures: append-only observability (design §5.7).
-- Written by a SEPARATE transaction after a projection attempt rolled back.
-- Soft cycle reference (no FK to any Loyalty row). Not a lock and not state:
-- nothing reads it to decide whether a Reward is eligible.
-- ---------------------------------------------------------------------------
CREATE TABLE commercial_projection_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL CHECK (length(btrim(business_id)) > 0),
  source_loyalty_cycle_id UUID NOT NULL,           -- soft reference
  error_class TEXT NOT NULL CHECK (length(btrim(error_class)) > 0),
  error_message TEXT NULL,
  attempt INTEGER NOT NULL CHECK (attempt >= 1),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX commercial_projection_failures_cycle
  ON commercial_projection_failures (source_loyalty_cycle_id, occurred_at);

CREATE TRIGGER commercial_projection_failures_immutable
  BEFORE UPDATE OR DELETE ON commercial_projection_failures
  FOR EACH ROW EXECUTE FUNCTION commercial_reject_mutation();
CREATE TRIGGER commercial_projection_failures_no_truncate
  BEFORE TRUNCATE ON commercial_projection_failures
  FOR EACH STATEMENT EXECUTE FUNCTION commercial_reject_mutation();

-- ---------------------------------------------------------------------------
-- Performance only (design §5.3 / §20): supports the anti-join detection
-- `rewards JOIN commercial_accounts ... available_at >= commercial_effective_from`.
-- The sole object this migration attaches to a Loyalty table.
-- ---------------------------------------------------------------------------
CREATE INDEX rewards_business_available_at_idx ON rewards (business_id, available_at);
