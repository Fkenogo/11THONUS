-- Rollback for `0022_commercial_settlements.sql` (WP-COM-02).
--
-- FAILS CLOSED when settlement evidence exists: settlements are immutable,
-- money-affecting evidence, and a silent drop would irreversibly discard it.
-- Rollback is therefore only ever attempted against a database holding no
-- settlement rows (fresh / reset / test flows). Recovery of a populated
-- database requires a pre-0022 logical backup. The migration touched no
-- pre-existing object, so nothing else is restored.
DO $$
DECLARE
  n INTEGER := 0;
BEGIN
  IF to_regclass('public.commercial_settlements') IS NOT NULL THEN
    SELECT COUNT(*) INTO n FROM public.commercial_settlements;
  END IF;
  IF n > 0 THEN
    RAISE EXCEPTION
      'WP-COM-02 / 0022: refusing to roll back -- this database holds % Commercial settlement row(s). Rolling back would irreversibly discard governed commercial evidence. Roll back only a database with no settlements, or restore a pre-0022 backup.', n;
  END IF;
END $$;

DROP TABLE commercial_settlements;
DROP FUNCTION commercial_settlements_update_guard();
DROP FUNCTION commercial_settlements_insert_guard();
