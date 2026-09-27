-- Rollback for `0020_redemption_store.sql`
-- (`CAPABILITY-6-REDEMPTION-ENGINE-001`).
--
-- Structural-only and lossy (same standing as `0019`'s down file):
-- rolling back discards `redemptions` rows, redemption-caused Trust
-- Events/intents are removed with the widened shapes, and the causal
-- columns return to NOT NULL — which fails if any NULL-causal row still
-- exists. Rollback is therefore only valid on a database holding no
-- redemption data (test/reset flows); historical data recovery otherwise
-- requires a pre-0020 logical backup.

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
