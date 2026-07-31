> **Title:** Controlled Real-SMS Test Harness — EXT-TECH-001 Delivery-Test Preparation
> **Status:** Bounded harness implementation, complete and validated. **No real SMS was sent by this task.** `EXT-TECH-001` remains `Still Pending`; Capability 2 remains `Blocked`. PR opened, not merged.
> **Task:** `EXT-TECH-001-TEST-HARNESS`
> **Source-of-truth path:** `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-implementation-report-2026-07-31.md`
> **Prepared:** 2026-07-31

---

## 1. Executive Summary

This task merged `PR #49`, verified the resulting `main` state, then built the smallest secure, development-only test harness capable of invoking Firebase Authentication's genuine Phone Sign-In SMS route (`RecaptchaVerifier` + `signInWithPhoneNumber` + `ConfirmationResult.confirm`) — to be operated by the Founder or an authorised tester holding a physical Burundi SIM, not by this coding agent. The harness lives at `apps/web/src/dev/phoneAuthHarness/`, is reachable only at the dev-only route `/dev/phone-auth-harness`, and is verifiably excluded from production builds (confirmed by grepping a real `pnpm build` output). It uses a dedicated, never-emulator-connected Firebase Auth instance so a "real" test can never be silently routed to the emulator; it accepts a phone number and OTP only at runtime, never pre-populates or persists either, masks the number on every subsequent render, never logs or displays the OTP, and surfaces Firebase errors by `.code` only. Nothing in the harness imports or calls into the application's `observability/*` diagnostics pipeline.

Built test-first throughout (30 new tests across 4 unit-level files plus 2 component-level and route-level test additions), with every privacy/security invariant from the Founder's brief independently verified by an automated test, not merely asserted in code comments. **No real SMS was sent, no real phone number entered this session or any tracked file, and no test-phone/emulator shortcut was used to fake success.** `EXT-TECH-001` remains exactly as every prior task in this chain left it: `Still Pending`. This task explicitly does not, and cannot, resolve it — resolution requires the Founder or an authorised tester to actually run the harness against real SIMs, using the accompanying runbook.

## 2. Starting Repository State

`main` at `39458da` (post-`PR #48`); `PR #49` open, `CLEAN`/`MERGEABLE`, CI-green.

## 3. PR #49 Merge Result and SHA

Re-verified `OPEN`/`CLEAN`/`MERGEABLE`/CI-green, no unresolved review threads. Merged via `gh pr merge 49 --merge`. **Merge commit SHA: `597763e7d59c0dd16a46be102b1e37a067aa8047`.**

## 4. Ending Repository State

Local `main` fast-forwarded to `597763e`; `git rev-list --left-right --count origin/main...main` = `0 0`; `git status --short` empty; no `MERGE_HEAD`/`rebase-merge`/`rebase-apply`. Post-merge CI green (run `30646494584`, `conclusion: success`).

## 5. Pre-Edit Codebase Analysis

Performed before any file was created, per Part 2's own requirement:

- **Firebase web SDK configuration:** `apps/web/src/config/env.ts` parses `VITE_FIREBASE_*` into a `FirebaseClientConfig`, falling back to an Emulator Suite demo project (`demo-11thonus`) whenever `useEmulator` is true and real values are absent.
- **Current Firebase Auth infrastructure:** `apps/web/src/infrastructure/firebase/auth.ts`'s `getFirebaseAuth(app, useEmulator)` auto-connects to the Auth Emulator whenever `useEmulator` is true — which defaults to Vite's `DEV` flag, the same flag gating this harness. Reusing the shared instance would have silently routed "real" test sends through the emulator, defeating the harness's purpose. **This was the decisive architectural finding.**
- **Application routing:** `apps/web/src/App.tsx` had a single route (`/`) via `react-router-dom`.
- **Environment-variable conventions:** `.env.example` already documents every `VITE_FIREBASE_*` field as a blank placeholder — no new variable was required.
- **Existing local-development utilities / emulator setup:** `firebase.json` already wires the Auth Emulator on port 9099 for the existing test suite — fully separate from, and unaffected by, live-project SMS Region Policy.
- **Test infrastructure:** `apps/web/vitest.config.ts` (jsdom + Testing Library), existing `App.test.tsx` pattern.
- **CSP and authorised-domain implications:** the live `eleventh-on-us-dev` project's `authorizedDomains` already includes `localhost` (confirmed via the same live Identity Toolkit config query used by `EXT-TECH-001-ENV-READY`) — no domain authorization change needed for local dev testing.
- **Current Phone Authentication configuration:** confirmed still `enabled: true`, `smsRegionConfig` still `{"allowlistOnly": {"allowedRegions": ["BI"]}}`, unchanged since the prior task.
- **reCAPTCHA requirements:** classic Firebase phone sign-in uses Firebase's own hosted reCAPTCHA v2 flow via `RecaptchaVerifier`, requiring no separate GCP API enablement or site-key registration (confirmed: `recaptchaenterprise.googleapis.com` not enabled, and not needed).
- **Production-build exclusion options:** Vite statically replaces `import.meta.env.DEV`; the reliable exclusion mechanism found (after an initial attempt that did *not* achieve real exclusion — see §9) is a `React.lazy()` dynamic import gated directly on the literal `import.meta.env.DEV`, not via an intermediate function call.
- **Repository conventions for internal diagnostic/test pages:** none existed yet — this is the first such page in the repository. No existing convention was overridden.

### Determinations (Part 2's ten required questions)

1. **Existing route cannot safely host the harness** — it must be its own route, dev-gated.
2. **A standalone local-only page is the safer, correct approach** — confirmed.
3. **The harness can be excluded from production builds** — confirmed and empirically verified (§9).
4. **No Firebase configuration was missing** — Phone Auth, billing, and the SMS Region Policy were already correctly configured by the prior `EXT-TECH-001-ENV-READY` task.
5. **`localhost` is an authorised domain** — confirmed directly against the live project config.
6. **The harness cannot reuse the existing shared Firebase Auth instance** — it requires its own, dedicated, never-emulator-connected instance (`phoneAuthHarnessAuth.ts`).
7. **Files that must change:** four new modules plus their tests under `apps/web/src/dev/phoneAuthHarness/`, and a minimal, additive edit to `apps/web/src/App.tsx` (plus one added test in the pre-existing `App.test.tsx`). No other application file needed to change.
8. **Files inspected but requiring no changes:** `main.tsx` (composition root deliberately left untouched — the harness stays outside the main auth/observability pipeline by design), `infrastructure/firebase/*` (reused only for the `FirebaseClientConfig` type), `observability/*` (deliberately not integrated), `vite.config.ts`, `.env.example`, `firebase.json`, `.firebaserc`.
9. **Personal-data avoidance:** component state only (`useState`), never `localStorage`/`sessionStorage`/URL; masking applied before any redisplay; OTP never rendered back and cleared on success/reset; Firebase errors surfaced by `.code` only.
10. **Removal/disablement after testing:** already inert and excluded outside development by construction (§9); full removal (if ever wanted) is deleting one directory and one route registration — no other coupling exists.

## 6. Implementation Strategy

Test-driven throughout: for each of the four new modules (`mask.ts`, `harnessGate.ts`, `phoneAuthHarnessAuth.ts`, `PhoneAuthHarnessPage.tsx`) and the `App.tsx` route wiring, a failing test was written and run first, confirmed to fail for the expected reason (missing module / missing route), then the minimal implementation was added and the test re-run to green. Two genuine defects were caught and fixed this way during development, not merely asserted correct after the fact (§14 details both).

## 7. Files Inspected

Listed in full in §5 above; also re-confirmed via `git status --short`/`git diff --stat` that no file outside the list in §8 was touched.

## 8. Files Created or Modified

**Created:**
- `apps/web/src/dev/phoneAuthHarness/mask.ts` + `mask.test.ts`
- `apps/web/src/dev/phoneAuthHarness/harnessGate.ts` + `harnessGate.test.ts`
- `apps/web/src/dev/phoneAuthHarness/phoneAuthHarnessAuth.ts` + `phoneAuthHarnessAuth.test.ts`
- `apps/web/src/dev/phoneAuthHarness/PhoneAuthHarnessPage.tsx` + `PhoneAuthHarnessPage.test.tsx`
- `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md`
- `docs/05-implementation/reports/EXT-TECH-001-delivery-test-evidence-template-2026-07-31.md`
- This report.

**Modified:**
- `apps/web/src/App.tsx` — one new, `import.meta.env.DEV`-gated, lazily-loaded route.
- `apps/web/src/App.test.tsx` — one new test proving the route renders the harness (async, `React.lazy`-aware).
- `docs/changes/IMPLEMENTATION_CHANGES.md`, `docs/00-governance/documentation-changes-log.md` (Entry 049) — append-only.

**Not modified:** every other file in the repository, including `main.tsx`, `infrastructure/firebase/*`, `observability/*`, `.env.example`, `firebase.json`, `.firebaserc`, and the External Dependencies Register (per this task's own explicit instruction not to declare `EXT-TECH-001` resolved).

## 9. Code Diff Summary

`git diff --stat` for the two modified application files: `App.test.tsx` +16/-1, `App.tsx` +27/-0. Eight new files under `apps/web/src/dev/phoneAuthHarness/` (four implementation modules, four test files).

**Development-only access control (initial attempt corrected during this task, disclosed transparently):** the first implementation guarded the route with `{isHarnessEnabled(import.meta.env.DEV) && <Route .../>}`, a simple statically-imported conditional. A real `pnpm build` followed by `grep -rl "phone-auth-harness\|EXT-TECH-001 Phone Auth\|Mark SMS Received\|phoneAuthHarnessAuth" dist/` found the harness **was** present in the production bundle — Vite/esbuild's minifier did not eliminate the unreachable JSX branch. This was caught by this task's own build-verification step, not left undisclosed. The fix: gate a `React.lazy()` dynamic import directly on the literal `import.meta.env.DEV` (not through an intermediate function), so Vite's static replacement of that literal to `false` in a production build makes the entire ternary branch — including the `import()` call itself — unreachable and eligible for removal before code-splitting analysis runs. Re-verified after the fix: `grep -rl "phone-auth-harness\|EXT-TECH-001 Phone Auth\|Mark SMS Received\|phoneAuthHarnessAuth" dist/` returned **zero matches** (exit code 1) against a fresh `pnpm build`. A residual match for `signInWithPhoneNumber`/`RecaptchaVerifier` strings was investigated and traced to Firebase Auth SDK's own internal REST-endpoint table and reCAPTCHA-loader error string — pre-existing, unrelated to this harness, and present because the main app already imports `firebase/auth` for `getAuth`/`onAuthStateChanged` (`observability/authLifecycle.ts`, from `ENG-P1-003-IMP-02`).

## 10. Firebase Phone Auth Integration

`phoneAuthHarnessAuth.ts` initializes a distinctly-named secondary Firebase app (`"phone-auth-harness"`) and returns `getAuth()` on that app — never calling `connectAuthEmulator`, verified by a dedicated unit test (`phoneAuthHarnessAuth.test.ts`, 5/5 passing, including an explicit assertion that `connectAuthEmulator` is never invoked). It refuses to activate (throws a static, non-user-data-bearing error) if the resolved config is the Emulator Suite's demo fallback project, confirmed by a dedicated test. `PhoneAuthHarnessPage.tsx` uses this dedicated instance — never the shared app-wide `Auth` instance — for `RecaptchaVerifier` and `signInWithPhoneNumber`.

## 11. Privacy Controls

Each control below is enforced by the implementation and independently verified by an automated test in `PhoneAuthHarnessPage.test.tsx`:
- No pre-populated phone number (test: `has no pre-populated phone number`).
- Runtime-only number handling — component state only, never a prop default.
- Masking after submission — the raw number is never rendered again once Send is clicked (test: `displays only a masked form of the number after submission, never the raw value again`).
- No `localStorage`/`sessionStorage` writes at any point in a full send→verify flow (test: `never writes the phone number or OTP to localStorage or sessionStorage`).
- No number/OTP in the URL (test: `never places the phone number or OTP in the URL`).
- OTP never logged to the console (test: `never logs the OTP value to the console` — spies on `console.log`/`error`/`warn`).
- OTP and phone number cleared on reset and on successful verification (tests: `clears the OTP field immediately after successful verification`; `clears phone number, carrier, OTP, results, and errors on reset`, which also asserts `RecaptchaVerifier.clear()` is called).
- Error sanitisation — only `error.code` is ever displayed for a Firebase SDK error; the harness-internal demo-project-refusal error is the sole exception, and it is a static string that never embeds user input (test: `displays only the Firebase error code, never the raw error message`, which explicitly asserts the raw number and a crafted `.message` string are both absent from the rendered output).
- "SMS received" is set only by the tester's own manual click, never automatically (test: `only marks SMS received when the tester manually confirms it, never automatically`).

## 12. Diagnostics and Logging Controls

The harness imports nothing from `apps/web/src/observability/*` and calls no `observability` function. Its dedicated Firebase Auth instance is never passed to `registerAuthLifecycle` (which only observes the instance `main.tsx` explicitly wires in), so no auth-state-change breadcrumb from the harness's own phone-sign-in flow reaches the diagnostics pipeline. `registerGlobalErrorHandlers`' `window.onerror`/`unhandledrejection` listeners remain globally active (unchanged, pre-existing app behaviour), which is why every Firebase call in the harness is wrapped in `try`/`catch` — nothing is allowed to become an unhandled error that could otherwise reach the global handler with an unsanitised message.

## 13. Automated Test Evidence

- `mask.test.ts`: 4/4 pass.
- `harnessGate.test.ts`: 3/3 pass.
- `phoneAuthHarnessAuth.test.ts`: 5/5 pass (Firebase fully mocked; no real `firebase/app`/`firebase/auth` call).
- `PhoneAuthHarnessPage.test.tsx`: 16/16 pass (Firebase fully mocked via `vi.mock`; `signInWithPhoneNumber`/`RecaptchaVerifier`/`getPhoneAuthHarnessAuth`/`getAppEnv` all mocked — **no automated test ever calls real Firebase or sends a real SMS**).
- `App.test.tsx`: 2/2 pass (existing test unchanged; one new test added for the lazy-loaded dev route).
- Full `apps/web` suite: **220/220 pass** (191 pre-existing + 29 new).
- Full `functions` suite: **94/94 pass**, unaffected (`functions/` untouched by this task).

## 14. Build and CI Evidence

- `pnpm typecheck` (root, both workspaces): clean, 0 errors. Two rounds of TypeScript spread-argument errors (`TS2556`) in the mock setup were caught by this exact command and fixed by switching to `vi.hoisted()` for mock declarations — genuine defects caught by real tool output, not asserted away.
- `pnpm lint`: clean, 0 errors. One `@typescript-eslint/no-unused-vars` finding (an unused mock constructor parameter) was caught and fixed.
- `pnpm test` (root): functions 94/94, apps/web 220/220.
- `pnpm format:check` / `npx prettier --write`: two formatting passes applied (Prettier's own reformatting of the new files), clean after.
- `pnpm build` (root): clean. Production bundle re-verified for harness exclusion (§9) after the `React.lazy` fix.
- `pnpm emulators:validate` (real Firebase Emulator Suite): **23/23 pass**, 3/3 test files, no flake observed on this run.

## 15. Manual Runbook Location

[`docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md`](EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md) — 13 numbered steps, including the explicit instruction never to paste a real phone number or OTP into any coding-agent conversation, repository file, issue, pull request, or committed screenshot.

## 16. Evidence-Template Location

[`docs/05-implementation/reports/EXT-TECH-001-delivery-test-evidence-template-2026-07-31.md`](EXT-TECH-001-delivery-test-evidence-template-2026-07-31.md) — blank, masked-fields-only results table, per-carrier summary, and overall-determination checklist, plus explicit, separately-labelled technical-proof and launch-reliability thresholds (both stated as engineering recommendations, since no governing document defines either).

## 17. Confirmation: No Real Number Stored or Committed

Confirmed by direct inspection of every file in this diff and by the automated storage/URL/logging tests in §11 — no phone number, real or fabricated-but-realistic, appears in any tracked file, commit message, test fixture, or configuration. Test files use the fictitious placeholder `+25779123456`, structurally valid but not associated with any real subscriber, exactly as every prior task in this chain has done for illustrative Burundi numbers.

## 18. Confirmation: No SMS Was Sent

Confirmed. Every Firebase call in every automated test is mocked (`vi.mock("firebase/auth", ...)` in both `phoneAuthHarnessAuth.test.ts` and `PhoneAuthHarnessPage.test.tsx`); this task never ran the harness against a real browser session, never populated `apps/web/.env.local` with real credentials, and never invoked `pnpm dev` to interactively operate the page. The harness exists in a ready, validated, but unexecuted state, exactly as authorised.

## 19. `EXT-TECH-001` Status

**Unchanged: Still Pending.** This task explicitly does not, and is not authorised to, resolve it. The harness's existence does not itself constitute delivery evidence — building the tool is preparation, not the test.

## 20. Capability 2 Status

**Unchanged: `Blocked`**, on exactly `EXT-TECH-001` (`Still Pending`) and `DEC-PROD-012` (`OPEN_FOUNDER`, untouched by this task). `DEC-PROV-004`/`DEC-SEC-001` were not touched. Google Sign-In and every other authentication provider remain disabled — confirmed unchanged both in the live Firebase project (not queried again by this task, since no configuration change was made) and in the harness itself (no other provider is imported or referenced anywhere in `apps/web/src/dev/phoneAuthHarness/`).

## 21. Commands Executed

`gh pr view 49`, `gh pr checks 49`, `gh pr merge 49 --merge`, `gh pr view 49 --json state,mergeCommit,mergedAt`, `git fetch origin`, `git checkout main`, `git pull origin main --ff-only`, `git rev-list --left-right --count origin/main...main`, `git status --short`, `gh run list --branch main`, `gh run watch <id> --exit-status`; `gcloud auth print-access-token`; `curl` re-verification of the live Firebase Identity Toolkit config; repeated `pnpm vitest run` scoped to the new test files during TDD, then the full `pnpm --filter web test` and root `pnpm test`; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `npx prettier --write`; `pnpm build` (twice — once before, once after the `React.lazy` exclusion fix); `grep -rl` against `dist/` for harness markers (before and after the fix); `pnpm emulators:validate`.

## 22. Dependencies Added

None. No new npm package was installed — `firebase/auth`, `react`, and `react-router-dom` were all already dependencies of `apps/web`.

## 23. Configuration Changes

None. No `.env.example`, `firebase.json`, `.firebaserc`, or live Firebase project configuration was changed by this task (the live project's Phone Auth/billing/SMS-region state was only re-read, not modified).

## 24. Risks

None introduced beyond the inherent, disclosed nature of the tool: it is capable of sending a real, billable SMS once a Founder/tester populates real credentials and clicks Send — this is its entire purpose, not a defect, and it is gated by (a) requiring manual local `.env.local` population with real secrets never committed to the repository, (b) requiring a manual click with no auto-trigger, and (c) being unreachable in any deployed/production build. The one genuine risk this task itself introduced and then corrected before completion was the initial, incomplete production-exclusion mechanism (§9) — caught by this task's own build-verification step before merge, not left as a latent defect.

## 25. Rollback and Harness-Removal Instructions

**Code rollback:** `git revert` of this task's own commit — removes all eight new harness files, the `App.tsx`/`App.test.tsx` edits, and the three new documentation files in one action. **Harness-specific removal without a full revert:** delete `apps/web/src/dev/phoneAuthHarness/` and remove the `DevPhoneAuthHarnessRoute`-related code from `apps/web/src/App.tsx`; no other file depends on either. **PR #49's merge** is independently reversible per its own disclosed rollback instructions, requiring fresh Founder authorization, out of scope here.

## 26. Markdown Implementation Report

This document.

## 27. `IMPLEMENTATION_CHANGES.md` Update

See the accompanying commit — an entry for `EXT-TECH-001-TEST-HARNESS` following this chain's established format.

## 28. Documentation Changes Log Update

`docs/00-governance/documentation-changes-log.md` Entry 049, per the accompanying commit.

## 29. Persistent `.md` Changes Record

This report, at its stated source-of-truth path, is the persistent `.md` changes record for `EXT-TECH-001-TEST-HARNESS`.
