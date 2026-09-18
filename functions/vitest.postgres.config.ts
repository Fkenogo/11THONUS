import { defineConfig } from "vitest/config";

// Runs only `*.postgres.test.ts` files, which require a live PostgreSQL
// instance (PLATFORM_POSTGRES_URL / PLATFORM_ENV=test) to pass. Invoked via
// `pnpm test:postgres` (see root `docker-compose.postgres.yml` for the
// disposable local instance these tests run against). Mirrors
// vitest.emulator.config.ts's structure for the Firestore emulator suite.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["**/*.postgres.test.ts"],
    // These tests share one live PostgreSQL instance and some intentionally
    // reset shared tables (e.g. schema_migrations) between tests — mirrors
    // the emulator suite's own fileParallelism: false rationale.
    fileParallelism: false,
    // The vitest default (5000ms) was already tight for a full `migrateUp`
    // over the real shipped migrations directory on a loaded host; it grows
    // with every migration this repository ever adds (17 as of
    // PLATFORM-BASELINE-013A.1, up from 15). Raised once, file-wide, rather
    // than patched test-by-test as the migration count keeps growing.
    testTimeout: 20000,
  },
});
