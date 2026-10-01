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
    // Emulator-suite default per-test timeout: 15 s (Vitest's default is 5 s).
    //
    // Why: roughly forty tests here deliberately race two Firestore transactions on the same
    // document. The Firestore Node SDK aborts the loser and retries it with exponential backoff
    // (first retry ~1 s), so such a race takes ~2.5-4.3 s on an idle machine (measured with a bare
    // two-transaction probe, no repository code: min 2.5 s, p50 3.2 s, max 4.3 s over 60 rounds),
    // i.e. most of Vitest's 5 s budget. On a slower or busier CI runner the tail crosses 5 s and
    // the test dies with "Test timed out in 5000ms" -- a different victim each run
    // (`knowledgeTagRepository`, then `identityLifecycleRepository`), never an assertion failure.
    //
    // 15 s is the value this repository already gives its slowest concurrency emulator tests
    // individually (e.g. `staffRoleChangeCommand`, `staffPermissionOverrideCommand`); a genuine
    // hang still fails, only after 15 s. Scope: this emulator-suite config only -- the fast unit
    // suite (`vitest.config.ts`) and the PostgreSQL suite keep their own timeouts. No assertion,
    // retry or concurrency change.
    testTimeout: 15000,
  },
});
