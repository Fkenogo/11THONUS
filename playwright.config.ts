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
      testIgnore: /dashboard-shell-harness\.spec\.ts/,
    },
    {
      // `ENG-P3-002-UI-IMP-B-REVIEW`: the Dashboard harness route
      // (`/dev/dashboard-harness`) is gated on the literal `import.meta.env.DEV`
      // check the same way the phone-auth/sign-in-preview harnesses are — Vite's
      // production build (the `chromium` project's server, above) statically
      // excludes it, so real-browser verification of it needs its own dev-mode
      // server/baseURL instead.
      name: "chromium-dashboard-harness",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5183" },
      testMatch: /dashboard-shell-harness\.spec\.ts/,
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
  ],
});
