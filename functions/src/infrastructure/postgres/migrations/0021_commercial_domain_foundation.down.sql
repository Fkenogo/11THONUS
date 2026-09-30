-- Rollback for `0021_commercial_domain_foundation.sql` (WP-COM-01).
--
-- FAILS CLOSED when Commercial evidence exists. The ledger, audit, standing
-- and price tables are immutable, money-affecting / audit evidence; a silent
-- drop of populated tables would irreversibly discard it. The guard below
-- refuses up front, so rollback is only ever attempted against a database
-- holding no Commercial data (fresh / reset / test flows). Recovery of a
-- populated database requires a pre-0021 logical backup; there is
-- deliberately no automated way to discard governed commercial evidence.
-- The migration touched no pre-existing object, so nothing else is restored.
DO $$
DECLARE
  n INTEGER := 0;
  c INTEGER;
BEGIN
  IF to_regclass('public.commercial_accounts') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_accounts; n := n + c;
  END IF;
  IF to_regclass('public.commercial_ledger_entries') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_ledger_entries; n := n + c;
  END IF;
  IF to_regclass('public.commercial_price_schedules') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_price_schedules; n := n + c;
  END IF;
  IF to_regclass('public.commercial_standing_events') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_standing_events; n := n + c;
  END IF;
  IF to_regclass('public.commercial_audit_events') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_audit_events; n := n + c;
  END IF;
  IF n > 0 THEN
    RAISE EXCEPTION
      'WP-COM-01 / 0021: refusing to roll back -- this database holds % Commercial row(s). Rolling back would irreversibly discard governed commercial evidence. Roll back only a database with no Commercial data, or restore a pre-0021 backup.', n;
  END IF;
END $$;

DROP TABLE commercial_audit_events;
DROP TABLE commercial_standing_events;
DROP TABLE commercial_ledger_entries;
DROP TABLE commercial_price_schedules;
DROP TABLE commercial_accounts;
DROP FUNCTION commercial_assert_account_matches_ledger();
DROP FUNCTION commercial_price_schedules_versioning();
DROP FUNCTION commercial_accounts_guard();
DROP FUNCTION commercial_reject_mutation();
