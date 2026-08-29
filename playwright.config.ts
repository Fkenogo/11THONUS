import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/dashboard-.*-harness\.spec\.ts/, /emulator\//],
    },
    {
      // `ENG-P3-002-UI-IMP-B-REVIEW`: the Dashboard harness route
      // (`/dev/dashboard-harness`) is gated on the literal `import.meta.env.DEV`
      // check the same way the phone-auth/sign-in-preview harnesses are — Vite's
      // production build (the `chromium` project's server, above) statically
      // excludes it, so real-browser verification of it needs its own dev-mode
      // server/baseURL instead. `ENG-P3-002-UI-IMP-C` adds its own Profile/
      // Locations harness spec alongside the existing shell one, same pattern.
      name: "chromium-dashboard-harness",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5183" },
      testMatch: /dashboard-.*-harness\.spec\.ts/,
    },
    {
      // ENG-P3-002-UI-IMP-H: real, emulator-backed E2E — the *actual*
      // production routes/components/callables against a live Firebase
      // Emulator Suite (`pnpm emulators`, project `demo-11thonus`), driven
      // through the `/dev/sign-in-preview` dev-server entry point for a real
      // (not mocked) authenticated session. Requires the emulator suite
      // already running and `tests/e2e/emulator/seedCommerceKnowledge.mjs`
      // already run once (see `tests/e2e/emulator/README.md`) — this project
      // is not part of the default `pnpm test:e2e` run for that reason; run
      // it explicitly via `pnpm test:e2e:emulator`.
      name: "chromium-emulator-e2e",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5184" },
      testMatch: /emulator\/.*\.spec\.ts/,
      // Real callables against a live (occasionally cold-starting) Functions
      // emulator are slower than the fixture-backed harness specs above —
      // give assertions more room before treating a slow first request as a
      // real failure.
      expect: { timeout: 20_000 },
      timeout: 60_000,
    },
  ],
  webServer: [
    {
      command: "pnpm --filter web run build && pnpm --filter web run preview -- --port 4173",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      // No Firebase project config exists yet (ENG-P1-001 — dev/staging projects have
      // no registered Web App). Forcing emulator mode lets env.ts fall back to its
      // safe demo config instead of failing to build a config it can't have yet.
      env: { VITE_USE_FIREBASE_EMULATOR: "true" },
    },
    {
      command: "pnpm --filter web run dev --port 5183",
      url: "http://localhost:5183",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { VITE_USE_FIREBASE_EMULATOR: "true" },
    },
    {
      // ENG-P3-002-UI-IMP-H: dev server for the real emulator-backed E2E
      // project above. `VITE_AUTH_ENABLE_EMAIL_PASSWORD=true` turns on the
      // real Email/Password provider (disabled by default everywhere else,
      // AUTH-04) so `/dev/sign-in-preview` can register/sign in a real test
      // user against the Auth emulator. This webServer does NOT start the
      // Firebase Emulator Suite itself — it must already be running
      // (`pnpm emulators`) before this project is invoked.
      command: "pnpm --filter web run dev --port 5184",
      url: "http://localhost:5184",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { VITE_USE_FIREBASE_EMULATOR: "true", VITE_AUTH_ENABLE_EMAIL_PASSWORD: "true" },
    },
  ],
});
