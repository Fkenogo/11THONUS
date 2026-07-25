import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    // Emulator-dependent integration tests (real Firestore round trips) are
    // excluded from the default fast unit-test run and covered separately
    // by `test:emulator` (see vitest.emulator.config.ts), which requires a
    // running Firebase Emulator Suite.
    exclude: ["**/node_modules/**", "**/*.emulator.test.ts"],
  },
});
