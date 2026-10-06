-- Rollback for `0028_business_review_foundation.sql` (EA-BL-001-CORR-002-BR).
--
-- FAILS CLOSED when any Business Review meaning exists. A Purchase in (or decided
-- from) Business Review, a configured per-version threshold, or any Business Review
-- evidence row (Trust Event / Notification Intent / outbox) is governed evidence:
-- restoring the 0026-era status/integrity checks could not hold it, and silently
-- re-labelling, nulling or deleting it would destroy the meaning of a Business
-- decision. Recovery of a populated database requires resolving those Purchases
-- and clearing the threshold first, or restoring a pre-0028 logical backup. The
-- migration touched no Loyalty table other than `purchase_records` (additive columns).
DO $$
DECLARE
  n INTEGER := 0;
  c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM public.purchase_records
    WHERE status = 'business_review_required' OR business_review_decision IS NOT NULL
       OR business_review_reviewer_user_id IS NOT NULL OR business_review_decided_at IS NOT NULL
       OR business_review_reason IS NOT NULL;
  n := n + c;
  SELECT COUNT(*) INTO c FROM public.reward_program_versions
    WHERE business_review_quantity_threshold IS NOT NULL;
  n := n + c;
  SELECT COUNT(*) INTO c FROM public.trust_events
    WHERE event_type IN ('purchase.business_review_required','purchase.business_review_approved',
                         'purchase.business_review_rejected');
  n := n + c;
  SELECT COUNT(*) INTO c FROM public.notification_intents
    WHERE intent_type IN ('purchase_business_review_required_business',
      'purchase_business_review_approved_customer','purchase_business_review_approved_business',
      'purchase_business_review_rejected_customer','purchase_business_review_rejected_business');
  n := n + c;
  SELECT COUNT(*) INTO c FROM public.purchase_outbox
    WHERE event_type IN ('purchase_business_review_required','purchase_business_review_approved',
                         'purchase_business_review_rejected');
  n := n + c;
  IF n > 0 THEN
    RAISE EXCEPTION
      'EA-BL-001-CORR-002-BR / 0028: refusing to roll back -- this database holds % Business Review Purchase / threshold / evidence row(s). Rolling back would irreversibly discard governed Business Review decisions. Resolve them and clear the threshold first, or restore a pre-0028 backup.', n;
  END IF;
END $$;

-- Evidence vocabularies back to their 0020 shapes.
ALTER TABLE purchase_outbox DROP CONSTRAINT purchase_outbox_event_type_check;
ALTER TABLE purchase_outbox ADD CONSTRAINT purchase_outbox_event_type_check
  CHECK (event_type IN ('purchase_recorded','purchase_verified','purchase_rejected',
    'purchase_disputed','verified_units_issued','loyalty_cycle_allocated',
    'loyalty_cycle_reward_available','reward_available'));

ALTER TABLE notification_intents DROP CONSTRAINT notification_intents_source_shape;
ALTER TABLE notification_intents ADD CONSTRAINT notification_intents_source_shape CHECK (
  (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
    'purchase_rejected_business','purchase_disputed_business')
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
ALTER TABLE notification_intents DROP CONSTRAINT notification_intents_intent_type_check;
ALTER TABLE notification_intents ADD CONSTRAINT notification_intents_intent_type_check
  CHECK (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
    'purchase_rejected_business','purchase_disputed_business',
    'reward_available_customer','reward_redeemed_customer','reward_redeemed_business'));

DROP INDEX IF EXISTS trust_events_one_business_review_event;
ALTER TABLE trust_events DROP CONSTRAINT trust_events_causal_shape;
ALTER TABLE trust_events ADD CONSTRAINT trust_events_causal_shape CHECK (
  (event_type IN ('purchase.recorded','purchase.verified',
    'purchase.rejected','purchase.disputed','verified_units.issued',
    'loyalty_cycle.allocated')
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
ALTER TABLE trust_events DROP CONSTRAINT trust_events_event_type_check;
ALTER TABLE trust_events ADD CONSTRAINT trust_events_event_type_check
  CHECK (event_type IN ('purchase.recorded','purchase.verified',
    'purchase.rejected','purchase.disputed','verified_units.issued',
    'loyalty_cycle.allocated','loyalty_cycle.reward_available',
    'reward.available','reward.redeemed','loyalty_cycle.reward_redeemed'));

-- Purchase-side objects.
DROP INDEX IF EXISTS purchase_records_business_review_queue_idx;
DROP TRIGGER IF EXISTS purchase_records_business_review_guard ON purchase_records;
DROP FUNCTION IF EXISTS purchase_records_business_review_guard();

ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_business_review_not_self;
ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_business_review_fields;

ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_verified_fields;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_verified_fields CHECK (
    (status = 'waiting_for_customer'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'pending_admission'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'verified' AND verified_at IS NOT NULL
      AND rejection_reason IS NULL AND dispute_reason IS NULL) OR
    (status = 'rejected' AND rejection_reason IS NOT NULL
      AND dispute_reason IS NULL) OR
    (status = 'under_review' AND dispute_reason IS NOT NULL
      AND rejection_reason IS NULL) OR
    (status IN ('corrected','cancelled','expired','archived')));

ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_status_check;
ALTER TABLE purchase_records
  ADD CONSTRAINT purchase_records_status_check
  CHECK (status IN ('waiting_for_customer','pending_admission','verified','rejected',
                    'under_review','corrected','cancelled','expired','archived'));

ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_business_review_reason_check;
ALTER TABLE purchase_records DROP CONSTRAINT purchase_records_business_review_decision_check;
ALTER TABLE purchase_records
  DROP COLUMN business_review_reason,
  DROP COLUMN business_review_decided_at,
  DROP COLUMN business_review_reviewer_user_id,
  DROP COLUMN business_review_decision;

ALTER TABLE reward_program_versions
  DROP CONSTRAINT reward_program_versions_business_review_threshold_check;
ALTER TABLE reward_program_versions DROP COLUMN business_review_quantity_threshold;
