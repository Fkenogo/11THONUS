-- Rollback for `0027_commercial_admissions_and_earmarks.sql` (WP-COM-05b).
--
-- FAILS CLOSED when any admission or earmark exists: they are immutable,
-- money-affecting provenance (each reservation ledger entry and any consumption
-- bound to an earmark would lose its provenance). Recovery of a populated
-- database requires a pre-0027 logical backup. Nothing else was altered.
DO $$
DECLARE
  n INTEGER := 0;
  c INTEGER;
BEGIN
  IF to_regclass('public.commercial_admissions') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_admissions; n := n + c;
  END IF;
  IF to_regclass('public.commercial_admission_blocks') IS NOT NULL THEN
    SELECT COUNT(*) INTO c FROM public.commercial_admission_blocks; n := n + c;
  END IF;
  IF n > 0 THEN
    RAISE EXCEPTION
      'WP-COM-05b / 0027: refusing to roll back -- this database holds % admission / earmark row(s). Rolling back would irreversibly discard governed commercial provenance. Roll back only a database with none, or restore a pre-0027 backup.', n;
  END IF;
END $$;

DROP TRIGGER commercial_consumption_events_earmark_guard ON commercial_consumption_events;
DROP FUNCTION commercial_consumption_events_earmark_guard();
ALTER TABLE commercial_consumption_events DROP CONSTRAINT commercial_consumption_events_earmark_fk;

DROP TABLE commercial_admission_blocks;
DROP TABLE commercial_admissions;
DROP FUNCTION commercial_admission_assert_consistent();
