import { defineConfig } from "vitest/config";

// Runs only `*.emulator.test.ts` files, which require a live Firebase
// Emulator Suite (FIRESTORE_EMULATOR_HOST set) to pass. Invoked via
// `pnpm test:emulator`, wrapped in `firebase emulators:exec` at the root
// (`pnpm emulators:validate`) so the emulator is guaranteed running.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["**/*.emulator.test.ts"],
  },
});
