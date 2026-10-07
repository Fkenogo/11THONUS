-- EA-BL-001-CORR-002-BR: Business Review Domain Foundation (DEC-PROD-015).
--
-- Purchase-domain schema ONLY. Adds the Business Review gate that sits BEFORE
-- Customer verification:
--
--   ∅                       -> waiting_for_customer         (below threshold / disabled; unchanged)
--   ∅                       -> business_review_required     (quantity >= the locked version's threshold)
--   business_review_required -> waiting_for_customer        (Owner/authorised-Manager APPROVE)
--   business_review_required -> rejected                    (Owner/authorised-Manager REJECT)
--
-- Business approval NEVER mints Verified Units, Cycle progress or a Reward: it
-- only makes the Purchase customer-verifiable. Customer verification stays
-- mandatory, and every pre-existing edge is untouched. This migration adds no
-- table, drops no column, and changes no existing semantic:
--
--   * `under_review`          stays the customer-dispute state.
--   * the commercial hold state keeps its own guard trigger (migration 0026).
--   * `rejection_reason`      stays CUSTOMER rejection only; Business Review
--                              rejection carries the distinct `business_review_reason`.
--   * `bulk_review_threshold` stays visibility-only metadata (untouched).
--
-- Re-runnable by design (like 0026): DROP/ADD constraint pairs, IF NOT EXISTS
-- columns/indexes, CREATE OR REPLACE function, DROP TRIGGER IF EXISTS.

-- 1. Per-version routing threshold (NULL = Business Review disabled). Routing only:
--    never a cap, never a rejection rule, never loyalty math.
ALTER TABLE reward_program_versions
  ADD COLUMN IF NOT EXISTS business_review_quantity_threshold INTEGER NULL;
ALTER TABLE reward_program_versions
  DROP CONSTRAINT IF EXISTS reward_program_versions_business_review_threshold_check;
ALTER TABLE reward_program_versions
  ADD CONSTRAINT reward_program_versions_business_review_threshold_check
  CHECK (business_review_quantity_threshold IS NULL OR business_review_quantity_threshold >= 1);

-- 2. Business Review attribution on the Purchase (verdict-column precedent:
--    set atomically with the decision transition, NULL otherwise).
ALTER TABLE purchase_records
  ADD COLUMN IF NOT EXISTS business_review_decision TEXT NULL,
  ADD COLUMN IF NOT EXISTS business_review_reviewer_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS business_review_decided_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS business_review_reason TEXT NULL;
ALTER TABLE purchase_records
  DROP CONSTRAINT IF EXISTS purchase_records_business_review_decision_check;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_business_review_decision_check
  CHECK (business_review_decision IS NULL OR business_review_decision IN ('approved','rejected'));
ALTER TABLE purchase_records
  DROP CONSTRAINT IF EXISTS purchase_records_business_review_reason_check;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_business_review_reason_check
  CHECK (business_review_reason IS NULL OR business_review_reason IN
    ('quantity_not_confirmed','transaction_not_confirmed','other'));

-- 3. Status vocabulary (add the value; existing rows are unaffected).
ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_status_check;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_status_check
  CHECK (status IN ('waiting_for_customer','business_review_required','pending_admission',
                    'verified','rejected','under_review','corrected','cancelled','expired','archived'))
  NOT VALID;
ALTER TABLE purchase_records VALIDATE CONSTRAINT purchase_records_status_check;

-- 4. State integrity. `business_review_required` carries no verdict facts (like
--    `waiting_for_customer`). `rejected` now has exactly two disjoint provenances:
--    CUSTOMER rejection (customer reason, no Business Review reason) or BUSINESS
--    REVIEW rejection (Business Review reason, no customer reason).
ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_verified_fields;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_verified_fields CHECK (
    (status = 'waiting_for_customer'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'business_review_required'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'pending_admission'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'verified' AND verified_at IS NOT NULL
      AND rejection_reason IS NULL AND dispute_reason IS NULL) OR
    (status = 'rejected' AND dispute_reason IS NULL
      AND ((rejection_reason IS NOT NULL AND business_review_reason IS NULL) OR
           (rejection_reason IS NULL AND business_review_reason IS NOT NULL))) OR
    (status = 'under_review' AND dispute_reason IS NOT NULL
      AND rejection_reason IS NULL) OR
    (status IN ('corrected','cancelled','expired','archived')))
  NOT VALID;
ALTER TABLE purchase_records VALIDATE CONSTRAINT purchase_records_verified_fields;

-- 5. Review attribution integrity: all four columns move together. An APPROVED
--    decision names a reviewer and time and never a reason, and can only exist once the
--    Purchase has left review. A REJECTED decision names reviewer, time and reason and
--    is only ever the terminal `rejected` state.
ALTER TABLE purchase_records
  DROP CONSTRAINT IF EXISTS purchase_records_business_review_fields;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_business_review_fields CHECK (
    (business_review_decision IS NULL AND business_review_reviewer_user_id IS NULL
      AND business_review_decided_at IS NULL AND business_review_reason IS NULL) OR
    (business_review_decision = 'approved' AND business_review_reviewer_user_id IS NOT NULL
      AND business_review_decided_at IS NOT NULL AND business_review_reason IS NULL
      AND status <> 'business_review_required') OR
    (business_review_decision = 'rejected' AND business_review_reviewer_user_id IS NOT NULL
      AND business_review_decided_at IS NOT NULL AND business_review_reason IS NOT NULL
      AND status = 'rejected'))
  NOT VALID;
ALTER TABLE purchase_records VALIDATE CONSTRAINT purchase_records_business_review_fields;

-- 6. No self-review, as a database backstop to the in-transaction rule.
ALTER TABLE purchase_records
  DROP CONSTRAINT IF EXISTS purchase_records_business_review_not_self;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_business_review_not_self CHECK (
    business_review_reviewer_user_id IS NULL
    OR business_review_reviewer_user_id <> recorded_by_user_id)
  NOT VALID;
ALTER TABLE purchase_records VALIDATE CONSTRAINT purchase_records_business_review_not_self;

-- 7. Transition guard for the Business Review state only. Existing edges between the
--    other statuses are deliberately not re-governed here (no behaviour change).
--      * business_review_required may be entered ONLY at creation (INSERT);
--      * it may leave ONLY to waiting_for_customer (with an 'approved' decision) or
--        to rejected (with a 'rejected' decision) -- never to verified, under_review,
--        or any other state;
--      * a review decision is set only by the leaving transition and is immutable after.
CREATE OR REPLACE FUNCTION purchase_records_business_review_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.business_review_decision IS NOT NULL THEN
      RAISE EXCEPTION 'purchase_records: a Purchase cannot be created with a Business Review decision'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.business_review_decision IS NOT NULL AND (
       NEW.business_review_decision IS DISTINCT FROM OLD.business_review_decision OR
       NEW.business_review_reviewer_user_id IS DISTINCT FROM OLD.business_review_reviewer_user_id OR
       NEW.business_review_decided_at IS DISTINCT FROM OLD.business_review_decided_at OR
       NEW.business_review_reason IS DISTINCT FROM OLD.business_review_reason) THEN
    RAISE EXCEPTION 'purchase_records: a Business Review decision is immutable once recorded'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'business_review_required' AND OLD.status <> 'business_review_required' THEN
    RAISE EXCEPTION 'purchase_records: business_review_required may only be set when the Purchase is created (attempted from: %)', OLD.status
      USING ERRCODE = '23514';
  END IF;

  IF OLD.status = 'business_review_required' THEN
    IF NEW.status NOT IN ('business_review_required','waiting_for_customer','rejected') THEN
      RAISE EXCEPTION 'purchase_records: business_review_required may only transition to waiting_for_customer or rejected (attempted: %)', NEW.status
        USING ERRCODE = '23514';
    END IF;
    IF NEW.status = 'waiting_for_customer' AND NEW.business_review_decision IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'purchase_records: leaving business_review_required for waiting_for_customer requires an approved decision'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.status = 'rejected' AND NEW.business_review_decision IS DISTINCT FROM 'rejected' THEN
      RAISE EXCEPTION 'purchase_records: leaving business_review_required for rejected requires a rejected decision'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.status = 'business_review_required' AND NEW.business_review_decision IS NOT NULL THEN
      RAISE EXCEPTION 'purchase_records: a Purchase still awaiting review cannot carry a decision'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.business_review_decision IS DISTINCT FROM OLD.business_review_decision THEN
    RAISE EXCEPTION 'purchase_records: a Business Review decision can only be recorded when the Purchase leaves business_review_required'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS purchase_records_business_review_guard ON purchase_records;
CREATE TRIGGER purchase_records_business_review_guard
  BEFORE INSERT OR UPDATE OF status, business_review_decision, business_review_reviewer_user_id,
    business_review_decided_at, business_review_reason ON purchase_records
  FOR EACH ROW EXECUTE FUNCTION purchase_records_business_review_guard();

-- 8. Review-queue index (bounded: only rows awaiting review; empty while no threshold is set).
CREATE INDEX IF NOT EXISTS purchase_records_business_review_queue_idx
  ON purchase_records (business_id, created_at, id)
  WHERE status = 'business_review_required';

-- 9. Evidence vocabularies (single trust ledger / intents / outbox -- no parallel audit system).
ALTER TABLE trust_events DROP CONSTRAINT trust_events_event_type_check;
ALTER TABLE trust_events ADD CONSTRAINT trust_events_event_type_check
  CHECK (event_type IN ('purchase.recorded','purchase.verified',
    'purchase.rejected','purchase.disputed','verified_units.issued',
    'loyalty_cycle.allocated','loyalty_cycle.reward_available',
    'reward.available','reward.redeemed','loyalty_cycle.reward_redeemed',
    'purchase.business_review_required','purchase.business_review_approved',
    'purchase.business_review_rejected'));
ALTER TABLE trust_events DROP CONSTRAINT trust_events_causal_shape;
ALTER TABLE trust_events ADD CONSTRAINT trust_events_causal_shape CHECK (
  (event_type IN ('purchase.recorded','purchase.verified',
    'purchase.rejected','purchase.disputed','verified_units.issued',
    'loyalty_cycle.allocated',
    'purchase.business_review_required','purchase.business_review_approved',
    'purchase.business_review_rejected')
    AND causal_purchase_record_id IS NOT NULL
    AND source_purchase_record_event_id IS NOT NULL) OR
  (event_type IN ('reward.available','loyalty_cycle.reward_available')
    AND ((causal_purchase_record_id IS NOT NULL
        AND source_purchase_record_event_id IS NOT NULL)
      OR (causal_purchase_record_id IS NULL
        AND source_purchase_record_event_id IS NULL))) OR
  (event_type IN ('reward.redeemed','loyalty_cycle.reward_redeemed')
    AND causal_purchase_record_id IS NULL
    AND source_purchase_record_event_id IS NULL));
-- A Purchase is reviewed at most once: lifetime uniqueness per subject for each review event.
CREATE UNIQUE INDEX IF NOT EXISTS trust_events_one_business_review_event
  ON trust_events (subject_type, subject_id, event_type)
  WHERE event_type IN ('purchase.business_review_required',
    'purchase.business_review_approved', 'purchase.business_review_rejected');

ALTER TABLE notification_intents DROP CONSTRAINT notification_intents_intent_type_check;
ALTER TABLE notification_intents ADD CONSTRAINT notification_intents_intent_type_check
  CHECK (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
    'purchase_rejected_business','purchase_disputed_business',
    'reward_available_customer','reward_redeemed_customer','reward_redeemed_business',
    'purchase_business_review_required_business',
    'purchase_business_review_approved_customer','purchase_business_review_approved_business',
    'purchase_business_review_rejected_customer','purchase_business_review_rejected_business'));
ALTER TABLE notification_intents DROP CONSTRAINT notification_intents_source_shape;
ALTER TABLE notification_intents ADD CONSTRAINT notification_intents_source_shape CHECK (
  (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
    'purchase_rejected_business','purchase_disputed_business',
    'purchase_business_review_required_business',
    'purchase_business_review_approved_customer','purchase_business_review_approved_business',
    'purchase_business_review_rejected_customer','purchase_business_review_rejected_business')
    AND purchase_record_id IS NOT NULL
    AND source_purchase_record_event_id IS NOT NULL
    AND source_redemption_id IS NULL) OR
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

ALTER TABLE purchase_outbox DROP CONSTRAINT purchase_outbox_event_type_check;
ALTER TABLE purchase_outbox ADD CONSTRAINT purchase_outbox_event_type_check
  CHECK (event_type IN ('purchase_recorded','purchase_verified','purchase_rejected',
    'purchase_disputed','verified_units_issued','loyalty_cycle_allocated',
    'loyalty_cycle_reward_available','reward_available',
    'purchase_business_review_required','purchase_business_review_approved',
    'purchase_business_review_rejected'));
