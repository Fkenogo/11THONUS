> **Title:** Controlled Real-SMS Test Harness — EXT-TECH-001 Delivery-Test Preparation
> **Status:** Bounded harness implementation, complete and validated, corrected under `EXT-TECH-001-TEST-HARNESS-CR1` (§30). **No real SMS was sent by this task.** `EXT-TECH-001` remains `Still Pending`; Capability 2 remains `Blocked`. PR opened, not merged.
> **Task:** `EXT-TECH-001-TEST-HARNESS` (original), `EXT-TECH-001-TEST-HARNESS-CR1` (corrective review cycle)
> **Source-of-truth path:** `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-implementation-report-2026-07-31.md`
> **Prepared:** 2026-07-31. **Updated:** 2026-08-01 (CR1 — see §30; also §14 for the earlier, separate CI race-condition correction).

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

**Post-push CI correction (disclosed transparently):** after this branch was pushed and PR #50 opened, GitHub Actions run `30648447370` **failed** on `PhoneAuthHarnessPage.test.tsx`'s `timing evidence > only marks SMS received when the tester manually confirms it, never automatically` test — CI's Node.js runtime resolved a mocked async promise more slowly than the local environment did, exposing a genuine test race condition that had passed reliably in every local run. Root cause: six occurrences of `await screen.findByText(/request accepted/i);` used an unanchored regex that matches the "Request accepted: **No**" render (which appears synchronously, immediately on Send, per the §9-adjacent fix that moved `setSubmittedPhoneNumber` before the `await`) just as readily as the desired "Request accepted: **Yes**" state — so the assertion could proceed before `signInWithPhoneNumber` had actually resolved. Fix: replaced all six occurrences with `await screen.findByRole("button", { name: /mark.*received/i });`, which waits for a DOM element that only renders once `requestAccepted` is genuinely `true`, eliminating the ambiguity. Re-verified locally after the fix: full `apps/web` suite **220/220 pass**; `pnpm typecheck`, `pnpm lint`, `pnpm format:check` all clean. Only the test file changed — no production source (`App.tsx`, `PhoneAuthHarnessPage.tsx`) was touched by this correction, so the §9 build-exclusion re-verification was not repeated. This was caught by CI itself, not left as a latent flaky test.

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

`gh pr view 49`, `gh pr checks 49`, `gh pr merge 49 --merge`, `gh pr view 49 --json state,mergeCommit,mergedAt`, `git fetch origin`, `git checkout main`, `git pull origin main --ff-only`, `git rev-list --left-right --count origin/main...main`, `git status --short`, `gh run list --branch main`, `gh run watch <id> --exit-status`; `gcloud auth print-access-token`; `curl` re-verification of the live Firebase Identity Toolkit config; repeated `pnpm vitest run` scoped to the new test files during TDD, then the full `pnpm --filter web test` and root `pnpm test`; `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `npx prettier --write`; `pnpm build` (twice — once before, once after the `React.lazy` exclusion fix); `grep -rl` against `dist/` for harness markers (before and after the fix); `pnpm emulators:validate`; post-push: `gh run view 30648447370 --json status,conclusion`, `gh run view 30648447370 --log-failed`, `sed -i` to correct the six race-prone assertions, re-run of `pnpm --filter web test`/`pnpm typecheck`/`pnpm lint`/`pnpm format:check`, `git add`/`git commit`/`git push` for the correction commit, and re-verification of the corrected PR #50 run.

## 22. Dependencies Added

None. No new npm package was installed — `firebase/auth`, `react`, and `react-router-dom` were all already dependencies of `apps/web`.

## 23. Configuration Changes

None. No `.env.example`, `firebase.json`, `.firebaserc`, or live Firebase project configuration was changed by this task (the live project's Phone Auth/billing/SMS-region state was only re-read, not modified).

## 24. Risks

None introduced beyond the inherent, disclosed nature of the tool: it is capable of sending a real, billable SMS once a Founder/tester populates real credentials and clicks Send — this is its entire purpose, not a defect, and it is gated by (a) requiring manual local `.env.local` population with real secrets never committed to the repository, (b) requiring a manual click with no auto-trigger, and (c) being unreachable in any deployed/production build. Two genuine defects were introduced by this task and both were corrected before final delivery: the initial, incomplete production-exclusion mechanism (§9), caught by this task's own build-verification step, and a test race condition (§14) caught by CI itself after the branch was pushed. Neither was left as a latent defect.

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

## 30. CR1 — Corrective Review Cycle (2026-08-01)

### 30.1 Context

After CI turned green on the race-condition fix (§14), the Founder reviewed PR #50, accepted a live merge-readiness check that surfaced 3 unresolved automated-review threads on the harness's own source (posted by `chatgpt-codex-connector[bot]`), and — after independent verification of each finding against the actual committed source — declined to merge. The Founder's `EXT-TECH-001-TEST-HARNESS-CR1` task accepted all three findings as genuine defects and required them fixed before the PR could return for merge authorisation. No merge occurred at any point in this cycle.

### 30.2 Findings, root causes, and corrections

**Finding 1 (P1) — environment safety.** `phoneAuthHarnessAuth.ts` rejected only the Emulator Suite's demo project (`config.projectId === "demo-11thonus"`). Any other real Firebase project — staging, a hypothetical production project, or any typo/unknown value — passed the guard silently, so a misconfigured `apps/web/.env.local` could send a real, billable SMS through the wrong environment. **Correction:** replaced the negative-only check with a positive allowlist against a new, unexported `APPROVED_DEV_PROJECT_ID = "eleventh-on-us-dev"` constant (mirroring the existing `PLATFORM_REGION` single-source-of-truth pattern in `functions/src/config/region.ts`) — not read from any environment variable, so it cannot be overridden at runtime. `getPhoneAuthHarnessAuth` now fails closed for the demo project, staging, production, any unknown project, and a missing project ID alike, with an error message that names only the (non-secret) resolved project ID, never the full config.

**Finding 2 (P1) — evidence accuracy.** The displayed "Delivery latency" line computed `elapsedMs(timing.requestAcceptedAt, timing.smsReceivedMarkedAt)` — from the moment Firebase accepted the request, not from the Send click. `requestStartedAt` was captured but never read. This systematically excluded reCAPTCHA and Firebase network time from the reported metric, corrupting the harness's core deliverable. **Correction:** the primary "Delivery latency (Send click → tester-confirmed receipt)" line now uses `elapsedMs(timing.requestStartedAt, timing.smsReceivedMarkedAt)`. `requestAcceptedAt` is preserved and displayed on a second, explicitly-labelled "Firebase acceptance latency (internal diagnostic; Send click → Firebase accepted)" line for internal diagnostic value, per the Founder's own instruction to preserve it "if useful."

**Finding 3 (P2) — retry validation.** The Send button existed only in the pre-submission view; once a request was sent, the UI switched to a results view with no way back to a sendable state short of `resetAll()`, which zeroes `retryCount`. The dead `if (submittedPhoneNumber !== null) setRetryCount((n) => n + 1)` branch was therefore unreachable — "Retry count" could never display anything but 0. **Correction:** extracted the send logic into a shared `performSend(isRetry)` used by both the original Send and a new, always-visible-after-a-request **Retry / Resend** button. A retry resends to the same masked identity/carrier (neither is touched), clears the OTP field and any prior error/result state, records fresh `timing` (dropping the prior attempt's `requestAcceptedAt`/`smsReceivedMarkedAt`/`otpVerifiedAt` so a stale result is never shown alongside a new one), and increments `retryCount`. Bounded to `MAX_RETRY_COUNT = 3` (4 total attempts per session) — the button disables and reads "Retry limit reached (3/3)" once reached. A new `isSending` flag disables the control mid-flight to prevent overlapping sends.

### 30.3 Tests added or changed

- `phoneAuthHarnessAuth.test.ts`: 5 → 11 tests. Replaced the single demo-project refusal test with a parametrised `it.each` covering the demo project, staging, a hypothetical production project, an unrelated/unknown project, and a missing project ID — all asserting `toThrow(/approved development project/i)` and that `initializeApp`/`getAuth` are never called. Added one explicit "activates for the exact approved development project" positive case and one test asserting the refusal message never contains the API key or app ID.
- `PhoneAuthHarnessPage.test.tsx`: 16 → 27 tests. Updated the mocked `getPhoneAuthHarnessAuth` (which intentionally mirrors the real module's guard, documented inline) to the new allowlist logic; added a component-level refusal test for a non-demo, non-approved project (staging). Added two timing-evidence tests using a real, artificial delay inside the mocked `signInWithPhoneNumber` and a numeric-threshold assertion on the parsed millisecond value — proving the displayed latency reflects the Send-click start, not Firebase's acceptance, without relying on `Date.now()` mocking (see §30.4). Added an 8-test "retry / resend flow" block covering: reachability without `resetAll()`, first-retry increment to 1, correct multi-retry increments, disablement at the bound, OTP clearing on retry, fresh per-retry timing (via a real elapsed-time gap and a threshold assertion), reset returning the count to 0, and no phone number/OTP persistence across a retry.

### 30.4 A test-design correction found and fixed during this cycle (disclosed transparently)

The first draft of the two new timing tests used `vi.spyOn(Date, "now").mockReturnValueOnce(...)` chains to control the exact millisecond values read by the component. Both failed on the first run — not because the corrected component logic was wrong, but because Testing Library's own `findByRole`/`waitFor` polling internally calls `Date.now()` for its own timeout bookkeeping, silently consuming values from the same mocked sequence and desynchronising it from the component's own calls. **Fix:** rewrote both tests to use real timers with a real, deliberate delay (`setTimeout`) inside the mocked async call or between actions, and a numeric-threshold assertion on the parsed displayed value, rather than mocking the global clock — a more robust pattern that cannot collide with a testing library's own internal timing use. This was caught by watching the tests fail for an unexpected reason (per TDD's "verify RED for the expected reason" discipline) before accepting them as valid RED evidence, and corrected before implementation began.

### 30.5 Local worktree anomaly disclosure

Before this cycle's edits began, the worktree's `.git` link file (the pointer a `git worktree` uses back to the main checkout's `.git/worktrees/<name>` metadata) was found missing, and `git status`/`git log` failed with "not a git repository." Investigation via `git worktree list` (run from the primary checkout, read-only) and direct inspection of `/Users/theo/11THONUS/.git/worktrees/eng-p1-003-imp-05/` confirmed the worktree's registration and admin metadata (`gitdir`, `HEAD`, `index`, `logs/`, `refs/`) were fully intact — only the worktree-side pointer file itself was gone. This was restored by writing the standard, single-line `gitdir: /Users/theo/11THONUS/.git/worktrees/eng-p1-003-imp-05` content back to the worktree's `.git` file — the exact content `git worktree add` itself would have written, not a reconstruction of any kind. `git status` then showed several hundred tracked files as locally deleted (matching HEAD exactly — `git diff --stat HEAD` showed pure deletions, zero insertions, confirming no content divergence), which `git checkout -- .` restored verbatim from the object database. **No source file content was ever reconstructed from memory, guesswork, or re-typing at any point** — every restored byte came from git's own object database, the authoritative store, which was never affected by whatever removed the working-tree copies. Separately, `apps/web/node_modules`'s pnpm symlinks were also broken by the same event; `pnpm install` relinked them from the still-intact `.pnpm` store (`reused 1377, downloaded 0`), again reconstructing nothing. Throughout, `git log --oneline` continuously showed the same two commits (`597763e` merge, `e8b7da5` original harness, `20621c9` CI-fix) at `HEAD`, and the corrected commit's CI run (`30649125849`, `SUCCESS`) and PR #50's `OPEN`/`MERGEABLE`/`CLEAN` state on GitHub were independently re-verified via `gh` both before and after this anomaly — **the PR's history, commits, and CI evidence were never at any point affected by this local anomaly.** The root cause of the `.git` file's disappearance was not identified (this worktree sits in a session-scoped scratchpad directory subject to external lifecycle/cleanup processes outside this task's control) and is not overstated here as anything more than a local, fully-recovered, non-data-loss environment anomaly.

### 30.6 Validation performed

- `pnpm --filter web test`: **237/237 pass** (191 pre-existing + 46 harness tests, up from 29 pre-CR1). `functions` suite unaffected (untouched by this cycle).
- `pnpm typecheck` (both workspaces): clean.
- `pnpm lint`: clean.
- `pnpm format:check`: clean (one Prettier reformatting pass applied to the test file via `npx prettier --write`, then re-verified).
- `pnpm build`: clean. Re-verified production-exclusion via `grep -rl "phone-auth-harness|EXT-TECH-001 Phone Auth|Mark SMS Received|phoneAuthHarnessAuth|Retry / Resend" apps/web/dist/` — zero matches (exit code 1) against a fresh build, confirming the new Retry/Resend control and all CR1 source changes remain fully excluded from the production bundle.
- Secret/PII scan: `git diff` for the 4 changed source files, checked against phone-number and API-key patterns — clean.
- `git diff --stat`: confirmed only the 4 intended files changed (`phoneAuthHarnessAuth.ts`, `phoneAuthHarnessAuth.test.ts`, `PhoneAuthHarnessPage.tsx`, `PhoneAuthHarnessPage.test.tsx`) plus the runbook, evidence template, this report, and `IMPLEMENTATION_CHANGES.md`.
- Confirmed live: (1) only `eleventh-on-us-dev` can activate the harness — proven by the 5-case `it.each` allowlist test; (2) latency is measured from Send click — proven by the real-delay timing test; (3) retry count can exceed zero and increments correctly — proven by the retry-flow tests; (4) the retry flow is bounded and disables at 3 — proven directly; (5) no real phone number or OTP appears anywhere in the diff — confirmed by the secret scan and the existing storage/URL/logging tests, unaffected by this cycle; (6) no real SMS was sent — every test uses `vi.mock("firebase/auth", ...)`, no real Firebase call was made; (7) Google Sign-In and every other auth provider remain unchanged — not referenced anywhere in this diff; (8) `EXT-TECH-001` remains `Still Pending` — unchanged by this cycle, not touched; (9) Capability 2 remains `Blocked` — unchanged, dependent on `EXT-TECH-001`/`DEC-PROD-012`, neither touched.

### 30.7 Commands executed (CR1-specific, in addition to §21)

`git worktree list` (from `/Users/theo/11THONUS`, read-only); direct `ls`/`cat` inspection of `.git/worktrees/eng-p1-003-imp-05/`; a `Write` of the worktree's `.git` pointer file; `git status --short`, `git diff --stat HEAD`, `git checkout -- .`; `pnpm install` (relinking `node_modules`); repeated `pnpm --filter web test -- <pattern>` scoped runs during TDD; full `pnpm --filter web test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `npx prettier --write`, `pnpm build`; `grep -rl` against `dist/`; `git diff --stat`/`git diff` secret scan.

### 30.8 Dependencies added

None.

### 30.9 Configuration changes

None. No `.env.example`, `firebase.json`, `.firebaserc`, or live Firebase project configuration was changed.

### 30.10 Risks

None introduced beyond the harness's already-disclosed, intentional capability. The `MAX_RETRY_COUNT = 3` bound is a deliberate, conservative choice for a manually-operated test tool, not a production retry policy, and is explicitly documented as such in both the code comment and the runbook (§8) to prevent future confusion.

### 30.11 Rollback instructions

`git revert` of this cycle's commit restores the pre-CR1 harness (with its three now-disclosed defects) without affecting the original harness commit or the CI-fix commit. Full harness removal remains as stated in §25 (delete `apps/web/src/dev/phoneAuthHarness/` and its `App.tsx` route registration) — unaffected by this cycle.

### 30.12 PR #50 status at the end of this cycle

Not merged. Awaiting fresh, explicit Founder merge authorisation per this task's own standing instruction and this cycle's explicit "Do not merge PR #50" / "stop when all three defects are fixed, CI is green, and all review threads are resolved" instructions.
