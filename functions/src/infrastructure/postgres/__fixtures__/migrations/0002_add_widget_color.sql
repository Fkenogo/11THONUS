-- Test-only fixture migration for migrationRunner.postgres.test.ts.
ALTER TABLE platform_baseline_001_migration_fixture_widgets ADD COLUMN color TEXT;
