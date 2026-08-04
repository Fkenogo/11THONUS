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
    // Emulator test files share one live Firestore instance and several
    // files intentionally reset shared collections (`idempotencyRecords`,
    // `outboxEntries`) in their own `beforeEach` (ENG-P2-001-05). Running
    // files in parallel lets one file's cleanup delete records another
    // file's in-flight test still depends on. Within a single file, tests
    // still run sequentially by default — only cross-file parallelism is
    // disabled.
    fileParallelism: false,
  },
});
