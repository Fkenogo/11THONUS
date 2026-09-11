-- Test-only fixture migration for migrationRunner.postgres.test.ts.
-- Not a real product table; never referenced outside this test suite.
CREATE TABLE platform_baseline_001_migration_fixture_widgets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);
