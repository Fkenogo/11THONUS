-- Redemption store + redemption evidence widening
-- (`CAPABILITY-6-REDEMPTION-ENGINE-001`, `DEC-LOY-018` /
-- `FD-REDEMPTION-AUTHORITY-001`).
--
-- This is the "separately authorized future implementation package" the
-- migrations README reserves `redemptions` for: the redemption evidence
-- store (redemption facts + `redeemed_at`) with NO speculative
-- cancellation/reversal fields (`DEC-LOY-004` boundary — reversal stays a
-- separate package).
--
-- Four additive, backward-compatible changes in one migration (single
-- deployment unit — the redemption command writes all of them in one
-- transaction, so they must arrive together):
--
-- A. `rewards (id, loyalty_cycle_id)` additive UNIQUE: the composite-FK
--    target that lets `redemptions` prove relationally that the Reward it
--    redeems is the very Reward belonging to the Loyalty Cycle it names
--    (design §20's prove-don't-comment discipline).
-- B. `redemptions`: one row per redeemed Reward. Exactly-once backstops:
--    `UNIQUE(reward_id)` (a Reward redeems at most once) plus that
--    composite FK chain (reward→cycle, cycle scope→Business/Customer/
--    Program, named version IS the cycle's governing version) alongside the
--    command's conditional `available → redeemed` transition and the
--    one-time Trust dedup below.
-- C. `trust_events`: two new governed event types (`reward.redeemed`,
--    `loyalty_cycle.reward_redeemed`) plus a widened causation shape for
--    the existing availability pair. Redemption is caused by a Business
--    confirmation, not by a Purchase lifecycle transition, so the causal
--    Purchase columns become NULLABLE — with a shape CHECK preserving the
--    spine invariant for every purchase-caused type (still NOT NULL there)
--    and requiring NULL for redemption-caused types. The one-time
--    subject-event dedup index covers the two new types (lifetime
--    uniqueness per subject).
-- D. `notification_intents`: two new governed intent types
--    (`reward_redeemed_customer`, `reward_redeemed_business` — PRD07 §18,
--    TRD11 §11.26). Redemption intents are anchored on the redemption, not
--    on a Purchase transition, so the Purchase linkage becomes NULLABLE —
--    again with a shape CHECK keeping every purchase-caused intent fully
--    anchored — plus a `source_redemption_id` FK and a partial unique
--    index giving redemption intents the same one-per-(source, type,
--    recipient) dedup the existing index gives purchase intents (plain
--    NULLs never compare equal, so the existing index cannot cover them).
--
-- Historical migrations are untouched; rollback is `0020_*.down.sql`.
--
-- Not widened here, deliberately: `purchase_outbox`. Every event type and
-- the `aggregate_id` FK of that table are Purchase-Record-scoped, and a
-- Business-confirmed redemption is not a Purchase lifecycle transition
-- (it has no causal Purchase Record) — redemption evidence lives in
-- `redemptions` + `trust_events` + `notification_intents`. Widening the
-- purchase outbox would be inventing a new mechanism, not reusing one.

-- A. Composite-FK target proving reward↔cycle identity.
ALTER TABLE rewards ADD CONSTRAINT rewards_id_cycle_unique UNIQUE (id, loyalty_cycle_id);

-- B. Redemption evidence store.
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL,
  loyalty_cycle_id UUID NOT NULL,
  business_id TEXT NOT NULL,                        -- opaque Firestore ref (tenant anchor, relational below)
  customer_identity_id TEXT NOT NULL,               -- opaque, server-resolved
  reward_program_id UUID NOT NULL,
  reward_program_version_id UUID NOT NULL,          -- the cycle's governing version, never program-current
  -- Individual attribution (DEC-ID-002, DEC-LOY-018 D-2): the actual
  -- authenticated Business member who confirmed — never a generic role.
  confirmed_by_user_id TEXT NOT NULL,
  confirmed_by_membership_id TEXT NOT NULL,         -- opaque Firestore ref
  confirmed_by_role TEXT NOT NULL CHECK (confirmed_by_role IN ('owner','manager','staff')),
  idempotency_key TEXT NOT NULL,                    -- the confirmation's idempotency key (evidence; uniqueness lives in idempotency_keys)
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  -- Exactly one redemption per Reward entitlement.
  CONSTRAINT redemptions_one_per_reward UNIQUE (reward_id),
  -- The redeemed Reward IS the Reward of the Cycle named here (not merely
  -- "some reward" and "some cycle" independently supplied by a caller).
  CONSTRAINT redemptions_reward_in_cycle FOREIGN KEY
    (reward_id, loyalty_cycle_id)
    REFERENCES rewards (id, loyalty_cycle_id) ON DELETE RESTRICT,
  -- Tenant/scope proof: the Cycle carries Business + Customer + Program.
  CONSTRAINT redemptions_match_cycle FOREIGN KEY
    (loyalty_cycle_id, business_id, customer_identity_id, reward_program_id)
    REFERENCES loyalty_cycles (id, business_id, customer_identity_id,
     reward_program_id) ON DELETE RESTRICT,
  -- …and proves the named version IS the cycle's governing version.
  CONSTRAINT redemptions_governing_version FOREIGN KEY
    (loyalty_cycle_id, reward_program_version_id)
    REFERENCES loyalty_cycles (id, opened_under_version_id) ON DELETE RESTRICT
);
CREATE INDEX redemptions_business_idx ON redemptions (business_id, redeemed_at DESC);
CREATE INDEX redemptions_customer_idx ON redemptions (customer_identity_id, redeemed_at DESC);

-- B. Trust Events: governed redemption disclosure.
--
-- Redemption is caused by a Business confirmation, not by a Purchase
-- lifecycle transition, so it has no causal Purchase Record. The causal
-- Purchase columns therefore become NULLABLE for the redemption-caused
-- types, and the shape CHECK below keeps them strictly NOT NULL for every
-- type that really is Purchase-caused.
--
-- `reward.available` and `loyalty_cycle.reward_available` are caused by a
-- Purchase ONLY when the threshold is crossed by a fresh verification. They
-- are ALSO legitimately caused by a redemption, because a forward
-- allocation of pending Verified Units into the newly opened Cycle can
-- carry that Cycle straight to the 10-unit threshold and make the next
-- Reward available at that moment (BR-064/FR-RL-001). Those two types
-- therefore accept NULL causation; the Purchase-lifecycle types still may
-- not. The one-time subject-event dedup index continues to cover them all
-- (lifetime uniqueness per subject).
ALTER TABLE trust_events DROP CONSTRAINT trust_events_event_type_check;
ALTER TABLE trust_events ADD CONSTRAINT trust_events_event_type_check
  CHECK (event_type IN ('purchase.recorded','purchase.verified',
    'purchase.rejected','purchase.disputed','verified_units.issued',
    'loyalty_cycle.allocated','loyalty_cycle.reward_available',
    'reward.available','reward.redeemed','loyalty_cycle.reward_redeemed'));
ALTER TABLE trust_events ALTER COLUMN causal_purchase_record_id DROP NOT NULL;
ALTER TABLE trust_events ALTER COLUMN source_purchase_record_event_id DROP NOT NULL;
ALTER TABLE trust_events ADD CONSTRAINT trust_events_causal_shape CHECK (
  (event_type IN ('purchase.recorded','purchase.verified',
    'purchase.rejected','purchase.disputed','verified_units.issued',
    'loyalty_cycle.allocated')
    AND causal_purchase_record_id IS NOT NULL
    AND source_purchase_record_event_id IS NOT NULL) OR
  -- The availability pair is caused either way round, but exactly one way:
  -- a fresh verification anchors it on its Purchase Record, and a redemption
  -- forward-allocation anchors it on the Redemption (it has no single causal
  -- Purchase Record, because the units came from several).
  (event_type IN ('reward.available','loyalty_cycle.reward_available')
    AND ((causal_purchase_record_id IS NOT NULL
        AND source_purchase_record_event_id IS NOT NULL)
      OR (causal_purchase_record_id IS NULL
        AND source_purchase_record_event_id IS NULL))) OR
  (event_type IN ('reward.redeemed','loyalty_cycle.reward_redeemed')
    AND causal_purchase_record_id IS NULL
    AND source_purchase_record_event_id IS NULL));
DROP INDEX trust_events_one_time_subject_event;
CREATE UNIQUE INDEX trust_events_one_time_subject_event
  ON trust_events (subject_type, subject_id, event_type)
  WHERE event_type IN ('verified_units.issued',
    'loyalty_cycle.reward_available', 'reward.available',
    'reward.redeemed', 'loyalty_cycle.reward_redeemed');

-- C. Notification Intents: governed redemption disclosure.
ALTER TABLE notification_intents DROP CONSTRAINT notification_intents_intent_type_check;
ALTER TABLE notification_intents ADD CONSTRAINT notification_intents_intent_type_check
  CHECK (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
    'purchase_rejected_business','purchase_disputed_business',
    'reward_available_customer','reward_redeemed_customer','reward_redeemed_business'));
ALTER TABLE notification_intents ALTER COLUMN purchase_record_id DROP NOT NULL;
ALTER TABLE notification_intents ALTER COLUMN source_purchase_record_event_id DROP NOT NULL;
ALTER TABLE notification_intents ADD COLUMN source_redemption_id UUID NULL REFERENCES redemptions (id) ON DELETE RESTRICT;
ALTER TABLE notification_intents ADD CONSTRAINT notification_intents_source_shape CHECK (
  (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
    'purchase_rejected_business','purchase_disputed_business')
    AND purchase_record_id IS NOT NULL
    AND source_purchase_record_event_id IS NOT NULL
    AND source_redemption_id IS NULL) OR
  -- `reward_available_customer` is governed (PRD07 §18) whenever a Reward
  -- becomes available. That is normally a Purchase-driven threshold
  -- crossing, but a redemption can also cause it when forward-allocating
  -- pending Verified Units into the new Cycle reaches 10 — and that one has
  -- no single causal Purchase Record (the units came from several), so it is
  -- anchored on the redemption instead.
  (intent_type = 'reward_available_customer'
    AND (
      (purchase_record_id IS NOT NULL AND source_purchase_record_event_id IS NOT NULL
        AND source_redemption_id IS NULL)
      OR (purchase_record_id IS NULL AND source_purchase_record_event_id IS NULL
        AND source_redemption_id IS NOT NULL))) OR
  (intent_type IN ('reward_redeemed_customer','reward_redeemed_business')
    AND purchase_record_id IS NULL
    AND source_purchase_record_event_id IS NULL
    AND source_redemption_id IS NOT NULL));
CREATE UNIQUE INDEX notification_intents_one_per_redemption_recipient
  ON notification_intents (source_redemption_id, intent_type,
    recipient_type, recipient_id)
  WHERE source_redemption_id IS NOT NULL;
