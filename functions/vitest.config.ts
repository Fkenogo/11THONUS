import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // Emulator-dependent integration tests (real Firestore round trips) are
    // excluded from the default fast unit-test run and covered separately
    // by `test:emulator` (see vitest.emulator.config.ts), which requires a
    // running Firebase Emulator Suite. PostgreSQL-dependent integration
    // tests (real transaction/migration round trips, PLATFORM-BASELINE-001)
    // are likewise excluded and covered by `test:postgres` (see
    // vitest.postgres.config.ts), which requires a running PostgreSQL
    // instance (`docker-compose.postgres.yml`).
    exclude: ["**/node_modules/**", "**/*.emulator.test.ts", "**/*.postgres.test.ts"],
  },
});
