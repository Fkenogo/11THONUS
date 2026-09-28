-- Rollback for `0020_redemption_store.sql`
-- (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-001`).
--
-- FAILS CLOSED when redemption evidence exists. Rolling back drops the
-- `redemptions` relation and restores NOT NULL on the causal Purchase
-- columns, so any surviving redemption-caused Trust Event or Notification
-- Intent row would make the rollback fail part-way through — and a silent
-- partial rollback would be worse than refusing outright. The guard below
-- detects that state up front and refuses with an explicit error, so
-- rollback is only ever attempted against a database holding no redemption
-- data (fresh / reset / test flows). Recovery of a populated database
-- requires a pre-0020 logical backup; there is deliberately no automated way
-- to discard governed redemption evidence.
DO $$
DECLARE
  redemption_rows INTEGER;
BEGIN
  IF to_regclass('public.redemptions') IS NOT NULL THEN
    SELECT COUNT(*) INTO redemption_rows FROM public.redemptions;
    IF redemption_rows > 0 THEN
      RAISE EXCEPTION
        'CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-001 / 0020: refusing to roll back -- this database holds % redemption evidence row(s). Rolling back would irreversibly discard governed redemption evidence. Roll back only a database with no redemption data, or restore a pre-0020 backup.', redemption_rows;
    END IF;
  END IF;
END $$;

DROP INDEX notification_intents_one_per_redemption_recipient;
ALTER TABLE notification_intents DROP CONSTRAINT notification_intents_source_shape;
ALTER TABLE notification_intents DROP COLUMN source_redemption_id;
ALTER TABLE notification_intents ALTER COLUMN source_purchase_record_event_id SET NOT NULL;
ALTER TABLE notification_intents ALTER COLUMN purchase_record_id SET NOT NULL;
ALTER TABLE notification_intents DROP CONSTRAINT notification_intents_intent_type_check;
ALTER TABLE notification_intents ADD CONSTRAINT notification_intents_intent_type_check
  CHECK (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
    'purchase_rejected_business','purchase_disputed_business',
    'reward_available_customer'));

DROP INDEX trust_events_one_time_subject_event;
CREATE UNIQUE INDEX trust_events_one_time_subject_event
  ON trust_events (subject_type, subject_id, event_type)
  WHERE event_type IN ('verified_units.issued',
    'loyalty_cycle.reward_available', 'reward.available');
ALTER TABLE trust_events DROP CONSTRAINT trust_events_causal_shape;
ALTER TABLE trust_events ALTER COLUMN source_purchase_record_event_id SET NOT NULL;
ALTER TABLE trust_events ALTER COLUMN causal_purchase_record_id SET NOT NULL;
ALTER TABLE trust_events DROP CONSTRAINT trust_events_event_type_check;
ALTER TABLE trust_events ADD CONSTRAINT trust_events_event_type_check
  CHECK (event_type IN ('purchase.recorded','purchase.verified',
    'purchase.rejected','purchase.disputed','verified_units.issued',
    'loyalty_cycle.allocated','loyalty_cycle.reward_available',
    'reward.available'));

DROP TABLE redemptions;
ALTER TABLE rewards DROP CONSTRAINT rewards_id_cycle_unique;
