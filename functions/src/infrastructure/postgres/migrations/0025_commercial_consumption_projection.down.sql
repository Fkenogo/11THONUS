-- Rollback for `0025_commercial_consumption_projection.sql` (WP-COM-04).
--
-- FAILS CLOSED when any consumption evidence exists: a claim, a consumption
-- event or a projection-failure row. Consumption events are immutable,
-- money-affecting evidence (each is tied to a ledger debit that this rollback
-- does NOT reverse), so dropping them would leave debits with no provenance;
-- recovery of a populated database requires a pre-0025 logical backup.
-- The migration touched no account, ledger, price, audit, standing or
-- settlement row and no Loyalty row; the only Loyalty-side object is the
-- performance index dropped below.
DO $$
DECLARE
  n INTEGER := 0;
  c INTEGER;
BEGIN
  IF to_regclass('public.commercial_consumption_claims') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_consumption_claims; n := n + c;
  END IF;
  IF to_regclass('public.commercial_consumption_events') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_consumption_events; n := n + c;
  END IF;
  IF to_regclass('public.commercial_projection_failures') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_projection_failures; n := n + c;
  END IF;
  IF n > 0 THEN
    RAISE EXCEPTION
      'WP-COM-04 / 0025: refusing to roll back -- this database holds % consumption claim / event / projection-failure row(s). Rolling back would irreversibly discard governed commercial evidence. Roll back only a database with none, or restore a pre-0025 backup.', n;
  END IF;
END $$;

DROP INDEX rewards_business_available_at_idx;

DROP TABLE commercial_projection_failures;
DROP TABLE commercial_consumption_events;
DROP TABLE commercial_consumption_claims;

DROP FUNCTION commercial_consumption_claims_require_event();
DROP FUNCTION commercial_consumption_events_ledger_guard();
DROP FUNCTION commercial_consumption_claims_reward_business_guard();
