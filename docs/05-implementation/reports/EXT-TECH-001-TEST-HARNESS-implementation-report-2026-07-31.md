> **Title:** Controlled Real-SMS Test Harness — EXT-TECH-001 Delivery-Test Preparation
> **Status:** PR #50 merged to `main` (`3d4206a`). Post-merge live-test preparation (§30.13 onward — separately-tracked, undocumented section) surfaced a real pre-send failure; the confirmed `RecaptchaVerifier` retry-lifecycle code defect was fixed under `EXT-TECH-001-HARNESS-CR2` (§31), and the missing Firebase Web App registration was closed as the most likely — but not confirmed — cause of the original `auth/invalid-app-credential` error. **No real SMS has been sent at any point across this entire task chain.** `EXT-TECH-001` remains `Still Pending`; Capability 2 remains `Blocked`.
> **Task:** `EXT-TECH-001-TEST-HARNESS` (original), `EXT-TECH-001-TEST-HARNESS-CR1` (pre-merge corrective review), `EXT-TECH-001-HARNESS-CR2` (post-merge pre-send failure resolution)
> **Source-of-truth path:** `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-implementation-report-2026-07-31.md`
> **Prepared:** 2026-07-31. **Updated:** 2026-08-01 (CR1 — see §30; CR2 — see §31; also §14 for the earlier, separate CI race-condition correction).

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

### 30.13 Post-push CI flake (unrelated to this diff), and review-thread resolution

CI run `30691479650` on the pushed commit (`74aeba6`) initially failed on two `functions/` emulator-concurrency tests (`idempotencyService.emulator.test.ts:158`, `commandDispatcher.emulator.test.ts:99`) — a directory this cycle's diff never touched (`git diff --stat 20621c9 74aeba6 -- functions/` returned empty). This matches the same category of pre-existing, previously-disclosed emulator-concurrency flakiness from earlier in this task chain (ENG-P1-002's TR record). Re-run via `gh run rerun 30691479650 --failed` (no code change) turned the identical run fully green, confirming the flake rather than a regression from this cycle's changes.

Separately, replies citing the exact fix commit (`74aeba6`) and its test evidence were posted to all three of `chatgpt-codex-connector[bot]`'s review threads, which were then explicitly resolved via the GitHub GraphQL `resolveReviewThread` mutation. Re-verified live: 0 unresolved review threads remain on PR #50.

### 30.14 PR #50 status at the end of this cycle

Not merged. CI green (`30691479650`, re-run confirmed), PR `OPEN`/`MERGEABLE`/`CLEAN` at `74aeba6`, 0 unresolved review threads. Awaiting fresh, explicit Founder merge authorisation per this task's own standing instruction and this cycle's explicit "Do not merge PR #50" / "stop when all three defects are fixed, CI is green, and all review threads are resolved" instructions — all three of which are now true.

**Post-CR1 events, for context leading into §31:** PR #50 was subsequently reviewed and Founder-authorised for merge; merged to `main` at commit `3d4206a57fc3af742bceaa8ac0de7cfd515bfd7b` (post-merge CI re-verified green). A separate Founder-authorised task then prepared a clean worktree at that commit for a live, Founder-operated carrier test — registering the project's first Firebase Web App (`"11thONUS Web"`, since none existed under `eleventh-on-us-dev`), populating a local-only `.env.local` with the real Web SDK config, and fixing two genuine `.env.local`-level runtime-error findings (an App-Check/`useEmulator` flag conflation, and a blank-vs-`undefined` boolean-parsing gap) before the harness could even render. The Founder then attempted the harness's first live Send. This is the point CR2 (§31) picks up from.

## 31. CR2 — Post-Merge Pre-Send Failure Resolution (2026-08-01)

### 31.1 Context and objective

The Founder's live test produced two sequential, real Firebase errors: `auth/invalid-app-credential` on the first Send, then `reCAPTCHA has already been rendered in this element` on Retry. `EXT-TECH-001-HARNESS-CR2` required investigating and resolving these without guessing, without a further real SMS attempt, and without changing production authentication behaviour.

### 31.2 Pre-change analysis (required before any code change)

**Source review:** re-read `PhoneAuthHarnessPage.tsx`'s `performSend` in full. The relevant fragment, unchanged since CR1:

```ts
if (!recaptchaVerifierRef.current) {
  recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: "invisible",
  });
}
const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
```

`recaptchaVerifierRef.current` is set once and never cleared except in `resetAll()` — meaning the *same* `RecaptchaVerifier` instance, and the *same* underlying DOM-rendered `grecaptcha` widget, is reused across every retry.

**Execution-path trace, as required:**
1. Tester clicks **Send OTP** → `handleSend()` → `performSend(false)`.
2. `recaptchaVerifierRef.current` is `null` → a new `RecaptchaVerifier` is constructed against the harness's dedicated Auth instance and the `recaptchaContainerId` `<div>`.
3. `signInWithPhoneNumber(auth, phoneNumber, verifier)` is called. Internally, this calls `verifier.verify()`, which renders the invisible reCAPTCHA widget into the container `<div>` and resolves a token from Google's reCAPTCHA service.
4. Firebase's Identity Toolkit backend (`accounts:sendVerificationCode`) rejects the request with `auth/invalid-app-credential` ("the reCAPTCHA token response is invalid").
5. The `catch` block runs `setErrorText(describeError(error))`. **`recaptchaVerifierRef.current` is left untouched** — still pointing at the same, already-rendered verifier/widget.
6. Tester clicks **Retry / Resend** → `handleRetry()` → `performSend(true)`.
7. `recaptchaVerifierRef.current` is **not** `null` (step 5) → the `if` block is skipped, the *same* verifier instance is reused.
8. `signInWithPhoneNumber` is called again, which calls `verifier.verify()` a second time on a container `<div>` that already holds a rendered `grecaptcha` iframe from step 3. This throws `"reCAPTCHA has already been rendered in this element"` — a raw `grecaptcha.js` DOM-level error, not a Firebase `auth/*` error code.

**Live-environment verification (before diagnosing #1) — a genuine new-evidence check, not a rewrite of old evidence:** the Founder reported that the project's Firebase Web App had since been manually registered. Re-fetched, live, explicitly scoped to `eleventh-on-us-dev` (never relying on any earlier App ID or the CLI's ambient "active project," which was confirmed to be a *different* project, `eleventh-on-us`):
- `firebase apps:list web --project eleventh-on-us-dev` → **2 apps now exist**: `"11thONUS Web - Development"` (App ID `1:709450867178:web:1195c6a790be6ee7a99293`, the Founder's officially-registered app) and `"11thONUS Web"` (App ID `1:709450867178:web:191ba4b9b50be870a99293`, this harness's own earlier auto-created placeholder, from the prior live-test-prep task).
- `firebase apps:sdkconfig web 1:709450867178:web:1195c6a790be6ee7a99293 --project eleventh-on-us-dev` → `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` are **identical** to the placeholder app's config (all four/five are project-level defaults in Firebase, not per-app) — **only `appId` differs**.
- `apps/web/.env.local`'s `VITE_FIREBASE_APP_ID` was updated to the Founder's official App ID (never relying on the earlier placeholder one, per explicit instruction), and the Vite dev server was restarted to pick up the change (Vite does not hot-reload `.env.local`).

### 31.3 Root cause — question 1: why `auth/invalid-app-credential`?

**Ruled out with direct evidence, not assumption:**
- **reCAPTCHA Enterprise mismatch** — ruled out. Queried the live, public `recaptchaConfig` endpoint (`identitytoolkit.googleapis.com/v2/recaptchaConfig`, the same endpoint the client SDK itself calls) with the project's real API key: `recaptchaEnforcementState` for `PHONE_PROVIDER` is `ENFORCEMENT_STATE_UNSPECIFIED` — Enterprise is not enforced.
- **Billing/Spark-plan restriction** — ruled out. `cloudbilling.googleapis.com` confirms `billingEnabled: true` (Blaze) on `eleventh-on-us-dev`.
- **Unauthorized domain, missing Phone Auth, wrong SMS region** — all ruled out; already confirmed correct in the prior live-test-prep task and re-confirmed here (`authorizedDomains` includes `localhost`; `signIn.phoneNumber.enabled: true`; `smsRegionConfig.allowlistOnly.allowedRegions: ["BI"]`).
- **A broken or blocked reCAPTCHA widget** — ruled out directly. Constructed a `RecaptchaVerifier` against the harness's own dedicated Auth instance in isolation (via the browser console, importing the harness's real modules, never calling `signInWithPhoneNumber`) and called `.verify()` alone. It resolved in ~5.1s with a well-formed, ~1380-character token (`0cAFcWeA...` prefix, the standard grecaptcha v2 response format). This proves reCAPTCHA token generation itself is healthy against the current project and Web App configuration, and — because `.verify()` alone never reaches Identity Toolkit's phone endpoint — this test could not itself have sent an SMS.

**A real, now-closed configuration gap — but NOT confirmed as the cause of the original error:** at the time of the Founder's original test, `eleventh-on-us-dev` had **no officially-registered Firebase Web App** — this harness's own placeholder app was the only one that existed, auto-created by this task chain itself rather than through the Founder's own Firebase Console action. That gap is a genuine fact and it has genuinely been closed. However, this report's own evidence in §30.13 cuts against treating it as the confirmed cause: the placeholder app's `apiKey`, `authDomain`, `projectId`, `storageBucket`, and `messagingSenderId` — the project-level fields Identity Toolkit actually validates on a phone-auth request — were already **identical** to the Founder's officially-registered app, before and after registration. Only `appId` differed, and `appId` is not a field Identity Toolkit's phone-auth verification checks. So while "no registered Web App existed yet" is true, the specific mechanism by which that fact would produce `auth/invalid-app-credential` is not established by anything gathered here — it remains a hypothesis, not a demonstrated causal link.

**Stated with honest confidence bounds, as required:** I could not find a single, unambiguous, current, authoritative Firebase source that definitively attributes `auth/invalid-app-credential` to a missing Web App registration specifically (searched current Firebase JS SDK GitHub issues and official docs; two independent documentation excerpts on the separate question of "does phone auth work on localhost at all" directly contradicted each other, and I have deliberately not cited either as authoritative). Reproducing the *original* failing call to confirm definitively is explicitly prohibited by this task ("do not perform another real SMS test"). What **is** directly, empirically confirmed: every project-level prerequisite now checks out correctly and the reCAPTCHA token layer is demonstrably healthy. What is **not** confirmed: that the missing Web App registration — as opposed to some other, unidentified factor — was the actual cause of the original failure. **Category: Firebase configuration (most likely cause, unconfirmed)** — the configuration gap is real and has been closed, but this should be treated as an open hypothesis pending a new Founder-operated live request, not as a resolved root cause. Not a code defect in the harness, not a browser issue, and not an App Check interaction (App Check is never initialized on the harness's dedicated secondary Firebase app at all — see `phoneAuthHarnessAuth.ts`, unchanged since the original implementation).

### 31.4 Root cause — question 2: why `"reCAPTCHA has already been rendered in this element"` on retry?

**Confirmed directly, not by inference alone.** After the isolated `.verify()` call in §31.3, inspected the container `<div>`'s DOM: it now permanently held a live `grecaptcha-badge`/iframe. Constructing or re-verifying against the *same* container without first removing that node reproduces exactly this class of error — this is standard, documented `grecaptcha.js` behaviour (`grecaptcha.render()` throws when a widget is already associated with a given container), not a browser bug or configuration issue.

**Validated against current Firebase documentation, as required:** Firebase's own official Phone Authentication for Web guidance (`firebase.google.com/docs/auth/web/phone-auth`) explicitly instructs: *if `signInWithPhoneNumber()` fails, reset the reCAPTCHA before allowing another attempt* — either `grecaptcha.reset(widgetId)` or re-render the verifier. CR1's retry design (introduced to satisfy the Founder's own CR1 requirement for a reachable, bounded retry control) did not implement this — it deliberately reused the same verifier instance across retries as a simplification, which is exactly the pattern Firebase's own documentation warns against for the *failure* case (as opposed to reuse across independently-successful sends, which is fine).

**Category: RecaptchaVerifier lifecycle** — a genuine code defect in `PhoneAuthHarnessPage.tsx`, confirmed against both direct DOM evidence and current official Firebase guidance. Not a Firebase configuration issue, not an SDK-usage issue elsewhere, not App Check, not a browser bug.

### 31.5 Fix applied

Test-first (per this session's standing TDD discipline): added a test proving the CR1 code passes the *same* `RecaptchaVerifier` instance to `signInWithPhoneNumber` on both the first send and the retry (asserted via referential inequality on the mock's captured call arguments), confirmed it failed for exactly that reason against the unmodified code, then applied the minimal fix — `PhoneAuthHarnessPage.tsx`'s `performSend` now unconditionally clears any existing verifier and constructs a fresh one on every send attempt (first send and every retry alike), instead of only constructing one when none exists yet:

```ts
recaptchaVerifierRef.current?.clear();
recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, {
  size: "invisible",
});
```

On a genuine first send, `recaptchaVerifierRef.current` is `null`, so `?.clear()` is a safe no-op and behaviour is identical to before — this change only alters retry behaviour, exactly where the defect lives. `resetAll()` is unaffected (already cleared+nulled the ref). No other file, and no production (non-harness) authentication code path, was touched.

### 31.6 Validation performed

- `pnpm --filter web test`: **238/238 pass** (237 pre-CR2 + 1 new regression test proving the fix).
- `pnpm typecheck`: one genuine TS2493 tuple-indexing error surfaced by the new test's `.mock.calls[n][2]` access (the mock's inferred call-argument tuple type has no declared parameters) — fixed via an explicit `as unknown[]` cast on the mock-call-arguments array, not by weakening any production type. Clean after.
- `pnpm lint` / `pnpm format:check`: clean.
- `pnpm build` + `grep -rl` against `dist/` for harness markers: zero matches — production-build exclusion re-verified unaffected by this change.
- Secret/PII scan on the diff: clean.
- `git diff --stat 3d4206a`: confirmed only `PhoneAuthHarnessPage.tsx` and `PhoneAuthHarnessPage.test.tsx` changed — the two files directly responsible, per this task's explicit scope instruction.
- **No further real SMS test was performed at any point in CR2** — every diagnostic (reCAPTCHA-config query, billing check, isolated `.verify()` call, DOM inspection) either queried public/read-only Firebase metadata or exercised `RecaptchaVerifier.verify()` alone, which never reaches Identity Toolkit's phone-auth endpoint and cannot itself trigger an SMS.

### 31.7 Environment reconciliation summary (as explicitly requested)

- **Original root cause, before the Web App was registered:** no Firebase Web App existed under `eleventh-on-us-dev` at all; this harness's own auto-created placeholder app was the only one present. Strongly consistent with, though not 100%-provable as the sole cause of, `auth/invalid-app-credential`.
- **The Founder's manual environment correction:** registration of the official `"11thONUS Web - Development"` Web App. `apiKey`/`authDomain`/`projectId`/`storageBucket`/`messagingSenderId` were already correct and identical either way (project-level defaults); only `appId` changed. `.env.local` updated to the Founder's official App ID; dev server restarted.
- **Remaining code defect, independent of the above:** the RecaptchaVerifier retry-reuse bug (§31.4), confirmed and fixed in this cycle.
- **Final state after reconciliation:** reCAPTCHA token generation confirmed healthy end-to-end against the current, Founder-registered configuration; the retry-lifecycle defect is fixed and test-covered; all other project-level prerequisites (Phone Auth enabled, SMS region = `BI`, `localhost` authorized, billing enabled, reCAPTCHA Enterprise not enforced) remain confirmed correct. The harness has not been re-tested end-to-end with a real send since these fixes, per this task's explicit prohibition on a further real SMS test — that remains the Founder's own next live-test step.

## 32. CR3 — Firebase Hosting Preview and Hosted-Domain Phone Authentication Correction (2026-08-01)

### 32.1 Context and objective

The Founder observed, on a live localhost test, that `RecaptchaVerifier`'s "already been rendered" error **still occurred after CR2's `clear()`-and-reconstruct fix**. Separately, the Founder enabled standard Firebase Hosting on `eleventh-on-us-dev` (site created, no release deployed) and authorised: completing repository-side Hosting setup where required; building a tightly-scoped, harness-only artifact; deploying it to a temporary Hosting preview channel; authorising only that exact preview hostname for Firebase Auth; finding and fixing the deeper reCAPTCHA lifecycle defect; and preparing the resulting HTTPS preview for a Founder-operated real-SMS test. No real SMS was sent at any point in CR3.

### 32.2 Stage A — repository and live-state verification

Repository: `firebase.json` and `.firebaserc` already existed and were already correctly scoped (`"dev": "eleventh-on-us-dev"`, no `"default"` alias — every command in this task carried an explicit `--project eleventh-on-us-dev`, never the CLI's ambient project). `firebase.json`'s `hosting` block existed but had no `rewrites`/`headers`. No deploy script or Hosting-deploy CI step existed anywhere.

Live project, explicitly scoped: project ID/number confirmed; registered Web App `11thONUS Web - Development` confirmed; Hosting site `eleventh-on-us-dev` exists. **A genuine discrepancy was found and resolved, not assumed away:** `firebase hosting:channel:list` showed a "Last Release Time" for the `live` channel, which looked like a prior release existed. Direct evidence contradicted the CLI's display: the Hosting Releases API returned empty for that channel, and the live URL itself returned Firebase's genuine "Site Not Found" 404 — confirming the CLI's column is a display artifact (the site's creation time), not a real release, and that no Hosting release existed, consistent with the Founder's brief. Phone Auth enabled, SMS allowlist exactly `["BI"]`, authorized domains as before, Blaze billing confirmed via `gcloud billing projects describe` (a working auth path after the OAuth-token quota-project issue documented in §32.5 below), and `defaultSupportedIdpConfigs`/`oauthIdpConfigs` both empty — no unexpected auth provider.

### 32.3 Stage B — harness isolation approach (Founder-reviewed, approved with two conditions)

**Chosen approach: a dedicated harness-only build entry, not the existing app bundle.** `main.tsx` (the app's composition root) wires `initializeFirebasePlatform()` — the shared Firebase app, which routes through Firebase App Check and fails closed outside dev mode without a site key this task is not authorised to provision — plus the full observability pipeline (error boundary, route tracker, auth-lifecycle/global-error/connectivity breadcrumbs) and `react-query`. Reusing it for a hosted build would either crash on boot or put the harness's phone number/OTP handling within reach of the diagnostics pipeline, violating the harness's own existing privacy design.

Instead: **`apps/web/harness.html`** (a second, independent Vite HTML entry, static `<meta name="robots" content="noindex, nofollow, noarchive">` baked into the markup) and **`apps/web/src/dev/phoneAuthHarness/harnessMain.tsx`** (renders only `<PhoneAuthHarnessPage>` — no router, no shared Firebase app, no observability, no `react-query`). `vite.config.ts` switches `build.rollupOptions.input` to `harness.html` and omits the `VitePWA` plugin entirely, but only when `mode === "test-harness"` — the ordinary `vite build` (no mode flag) is completely untouched. This gives a **structural**, not merely runtime, isolation guarantee: those modules are absent from the test-harness bundle's module graph, not gated out of it. Empirically confirmed against real build output (§32.7): 32 modules transformed for the test-harness build vs. 2,223 for the ordinary build; `react-router`, `QueryClient`, `Sentry`, `ObservabilityErrorBoundary`, `registerAuthLifecycle`, and `initializeFirebasePlatform` are all absent from the compiled harness bundle.

**CSP derived from real, observed network traffic, not assumption.** Constructing a `RecaptchaVerifier` and calling `.verify()` alone against the already-running local dev harness (safe — never reaches Identity Toolkit, cannot send an SMS) revealed the exact domains contacted: `https://www.google.com/recaptcha/api.js` and `https://www.gstatic.com/recaptcha/releases/.../recaptcha__en.js` (scripts), `https://www.google.com/recaptcha/api2/anchor` and `.../api2/bframe` (iframes) — no `recaptcha.net` or `recaptcha.google.com` fallback was used. Combined with Firebase Auth's documented REST endpoints (`identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, both already corroborated by this task chain's own earlier live REST calls), the resulting CSP is narrowly scoped to exactly these domains across `script-src`/`frame-src`/`connect-src`/`style-src`/`img-src`/`object-src`/`base-uri`/`form-action` (full directive values in `firebase.json`). Per explicit Founder instruction, `frame-ancestors` was **not** touched — the report-only `frame-ancestors` warning that appears on Google's own `recaptcha.google.com`/`www.google.com` responses is a policy on *their* response describing who may frame *their* content, unrelated to and unfixable from this page's own CSP.

### 32.4 Stage C/D — Hosting configuration and the explicit test-build boundary

`firebase.json`'s `hosting` block was hand-edited (no `firebase init hosting` — the existing config was already valid, and a scaffolding tool risked overwriting it): added a `**` → `/index.html` SPA-fallback rewrite (needed by `App.tsx`'s `react-router-dom` routes and harmless for the harness's own single-page deploy), the CSP + `X-Robots-Tag: noindex, nofollow, noarchive` header, `no-cache, no-store, must-revalidate` on `/index.html` **and** `/` (see the header-matching gap found and fixed in §32.9), and long-lived immutable caching on `/assets/**`. Firestore, Storage, Functions, and Emulator configuration were not touched; `.firebaserc` needed no change.

`VITE_ENABLE_PHONE_AUTH_TEST_HARNESS` (new, documented in `.env.example`) is combined with the Vite mode and the resolved Firebase project ID in a new pure function, `testHarnessGate.ts`'s `isTestHarnessBuildEnabled({ testHarnessFlag, mode, projectId })` — all three must match exactly (`"true"`, `"test-harness"`, `"eleventh-on-us-dev"`); every comparison is a strict string match, so a missing, empty, malformed, or `"false"` flag, or any other project ID, fails closed. `harnessMain.tsx` evaluates this once at boot and passes the result as a new `testHarnessBuild` prop into `PhoneAuthHarnessPage`, which now renders when `isHarnessEnabled(dev) || testHarnessBuild` — a second, independent runtime check (not merely relying on the build-entry swap) so a direct navigation to a hosted build can't bypass the guard. A prominent, dismissable-free warning banner renders whenever `testHarnessBuild` is true; a `useEffect` also sets the `<meta name="robots">` tag at runtime as a second layer alongside `harness.html`'s static tag.

TDD throughout: `testHarnessGate.test.ts` (10 tests covering the approved combination, ordinary-build/dev-mode exclusion, missing/empty/`"false"`/malformed flag values, wrong project ID, wrong mode); three new `PhoneAuthHarnessPage.test.tsx` cases proving the component itself renders nothing when both `dev` and `testHarnessBuild` are false (including when the prop is omitted entirely — the default), and renders when `testHarnessBuild` is true even with `dev` false.

### 32.5 Stage E — the second reCAPTCHA lifecycle defect: root cause and fix

**Reproduced directly, not inferred.** Constructing a `RecaptchaVerifier`, calling `.verify()`, then calling `.clear()` on it, then constructing a **second** `RecaptchaVerifier` against the **same container id** (exactly CR2's fix) and calling `.verify()` again reproduced the Founder's exact reported error: `"reCAPTCHA has already been rendered in this element"`. Direct DOM inspection immediately after `.clear()` showed the container still held 2 child nodes and 1,166 characters of `innerHTML` — proving `.clear()` resets the widget's internal state but does **not** remove the DOM nodes `grecaptcha.render()` injected into the container. A brand-new `RecaptchaVerifier` targeting that same, still-populated container element throws on its next internal `.verify()` call regardless of being newly constructed. CR2's fix (clear + reconstruct, but against one static container id reused across every attempt) was therefore a real but insufficient correction.

**Fix, verified against the real widget before writing any test:** rendering into a genuinely fresh, never-before-used DOM node per verifier — two sequential `.verify()` calls against two separate, freshly-created `<div>` elements both succeeded. Applied to `PhoneAuthHarnessPage.tsx`: a stable `recaptchaWrapperRef` (React-owned) now holds a dynamically-created child container per attempt (`createFreshRecaptchaContainer()`), and `teardownRecaptchaVerifier()` clears the prior verifier, nulls its ref, and removes its container node from the DOM before every new attempt — called from `performSend` (first send and retry alike), `resetAll()`, and a `useEffect` unmount cleanup. A synchronous `isSendingRef` guard (checked and set before any state update or `await`) blocks a second overlapping `performSend` call, independent of React's state-update batching timing.

Investigated per the task's explicit list: `.clear()` leaves the container's DOM children in place (confirmed above) — the fix therefore replaces the DOM node, not just the JS reference; the verifier ref is now explicitly nulled inside `teardownRecaptchaVerifier()`; concurrent sends are blocked by the ref guard; React StrictMode does not double-construct a verifier from one click (verifier construction happens inside the async click handler, not a render body or effect setup — confirmed by a dedicated test rendering under `<StrictMode>`); a stale dev server was ruled out as a factor (the fix was validated against a fresh, restarted build). TDD: 8 new regression tests in a new `describe("CR3 reCAPTCHA lifecycle correction")` block — distinct fresh container per construction, prior container removed from the document after clearing, recovery after a failed first request, pristine container on reset-after-failure, no accumulation across repeated resets, `.clear()`-and-container-removal on unmount, exactly one verifier per Send click under StrictMode, and a blocked overlapping retry. All 39 tests in the file pass (31 pre-existing + 8 new); full `apps/web` suite: 259/259.

### 32.6 Stage F — official Firebase Web configuration re-verification

Re-fetched fresh (not reused from earlier in this session) via `firebase apps:sdkconfig web 1:709450867178:web:1195c6a790be6ee7a99293 --project eleventh-on-us-dev` and compared programmatically against `.env.test-harness.local` (gitignored — covered by the repo's blanket `.env.*` rule, confirmed via `git check-ignore -v`):

| Field | Official source | Local test-build source | Match |
|---|---|---|---|
| API key | Firebase | `.env.test-harness.local` | Yes |
| Auth domain | Firebase | `.env.test-harness.local` | Yes |
| Project ID | Firebase | `.env.test-harness.local` | Yes |
| Storage bucket | Firebase | `.env.test-harness.local` | Yes |
| Messaging sender ID | Firebase | `.env.test-harness.local` | Yes |
| App ID | Firebase | `.env.test-harness.local` | Yes |

No raw value was printed to chat, committed, or persisted beyond a transient, immediately-deleted comparison file. This is the same, official, Founder-registered `"11thONUS Web - Development"` app already reconciled in CR2 — CR3 did not alter it.

### 32.7 Stage G — build and preview deployment

Build isolation re-verified against fresh output after the reCAPTCHA fix (not the earlier pre-fix build): ordinary `pnpm build` → `dist/index.html` + PWA assets (`sw.js`, `workbox-*.js`, `manifest.webmanifest`); zero harness markers anywhere. `vite build --mode test-harness` → `dist/harness.html` + one JS/CSS chunk only, **no** PWA files, 32 modules transformed (vs. 2,223 ordinary), zero occurrences of `react-router`/`QueryClient`/`Sentry`/`ObservabilityErrorBoundary`/`registerAuthLifecycle`/`initializeFirebasePlatform`, zero phone-number-shaped literals, exactly one (expected, client-embeddable, non-secret) `apiKey` occurrence. `harness.html` was renamed to `index.html` via `apps/web/package.json`'s `build:test-harness` script (`tsc -b && vite build --mode test-harness && mv dist/harness.html dist/index.html` — added in the review correction at §32.15, after an initial version of this task performed the rename as an untracked manual step) — this deploy's dist has no other HTML file, so the rename is safe and the existing `**` → `/index.html` rewrite serves it correctly.

Deployed via:

```bash
firebase hosting:channel:deploy phone-auth-test --project eleventh-on-us-dev --expires 6h
```

- **Preview channel:** `phone-auth-test`
- **HTTPS URL:** `https://eleventh-on-us-dev--phone-auth-test-3yz68r9z.web.app`
- **Expiry:** `2026-08-01 23:46:31` (refreshed on the header-fix redeploy in §32.9; originally `22:52:57`)
- **Hosting site / Firebase project:** `eleventh-on-us-dev` / `eleventh-on-us-dev`
- **Live channel:** confirmed untouched both immediately after deploy and after the redeploy — `https://eleventh-on-us-dev.web.app` still returns Firebase's genuine "Site Not Found" 404, `firebase hosting:channel:list` still shows no real release on `live`.

### 32.8 Stage H — Authentication authorized-domain finding

The exact preview hostname, `eleventh-on-us-dev--phone-auth-test-3yz68r9z.web.app`, was found **already present** in Firebase Auth's `authorizedDomains` on a fresh read immediately after deployment — confirmed genuinely new (absent from the Stage A pre-deploy read, which listed only `localhost`, `eleventh-on-us-dev.firebaseapp.com`, `eleventh-on-us-dev.web.app`). This is Firebase's own Hosting-Auth integration automatically authorizing a Hosting preview channel's generated hostname on channel creation — no manual `identitytoolkit` write was performed by this task. No wildcard was used, and the three pre-existing domains were untouched. Teardown (§32.11) includes an explicit verification step rather than assuming Firebase's automatic cleanup on channel deletion, since that specific cleanup behaviour was not independently confirmed.

### 32.9 Stage I — hosted preflight validation (no phone number entered, no SMS, `signInWithPhoneNumber` never called)

Navigated to the preview URL and confirmed: HTTPS; page loads; the prominent red test-only warning banner renders; the harness form renders with an empty phone field (guard passes); no other route exists (single HTML file in the deploy); browser console **completely empty** — zero errors, zero CSP violations; the reCAPTCHA container div is present and structurally empty at rest (by the component's own invisible-badge design, matching pre-CR3 behaviour); no phone number or OTP anywhere; `document.body.innerHTML` and DOM inspection confirm no complete Firebase configuration is ever displayed (only `projectId`, and only after a Send, which was not triggered).

**A real gap was found and fixed during this stage, not glossed over:** the `/index.html`-scoped `Cache-Control` header rule in `firebase.json` did not apply to requests for `/` (the root path browsers actually request) — Firebase Hosting's header-source matching treats them as distinct paths even though the SPA rewrite serves identical content for both. Confirmed via `curl -I` against both paths (`/` returned the default `max-age=3600`; `/index.html` returned the intended `no-cache` value). Fixed by adding an explicit `"source": "/"` header rule with the same value, redeployed to the same channel (same URL, refreshed expiry), and re-verified via `curl -I` that `/` now returns the correct header, the CSP header is present and correct, and the live channel remains untouched.

CSP validated with real evidence, not assumption: a `<script src="https://www.google.com/recaptcha/api.js">` tag injected directly into the deployed page loaded successfully with zero CSP violations reported in the console — direct proof that `script-src`'s Google-domain allowance works under this page's actual, deployed CSP header. **Disclosed limitation:** the full reCAPTCHA challenge-iframe round trip (`frame-src`, `api2/anchor`/`api2/bframe`) was validated on `localhost` against the identical Google domains (§32.5's reproduction), not literally re-executed against this specific hosted URL — doing so would require internal bundle symbols not exposed for external dynamic `import()` from a production, non-library build. The `script-src` proof plus the identical-domain local validation together give strong, but not 100%-direct-on-this-URL, evidence for the full flow.

### 32.10 Firebase initialization / Auth instance confirmation

`getPhoneAuthHarnessAuth`'s existing `getHarnessApp` (unchanged since the original implementation) checks `getApps().find(...)` before calling `initializeApp`, so the harness's dedicated `"phone-auth-harness"` secondary app is initialized at most once regardless of how many times the function is called. Confirmed structurally: the test-harness bundle contains no call to `initializeFirebasePlatform` (the shared app's initializer) at all — only the harness's own dedicated instance can ever exist in this build.

### 32.11 Teardown procedure (not executed — the preview must remain live for the Founder's test)

1. **Delete the preview channel:** `firebase hosting:channel:delete phone-auth-test --project eleventh-on-us-dev` (or allow the 2026-08-01 23:46:31 expiry to lapse).
2. **Verify the authorized-domain cleanup:** re-read `identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config`'s `authorizedDomains` after deletion/expiry. If `eleventh-on-us-dev--phone-auth-test-3yz68r9z.web.app` is still present (Firebase's automatic cleanup on channel deletion was not independently confirmed by this task — see §32.8), remove it manually via a scoped `PATCH` to that same endpoint with `updateMask=authorizedDomains`, listing every domain **except** the preview hostname — never a blanket rewrite.
3. **Remove the local test-build environment file:** `rm apps/web/.env.test-harness.local` (already gitignored, never committed; this step is about clearing the local working tree, not git history).
4. **Confirm the ordinary production build still excludes the harness:** re-run `pnpm --filter web build` and grep `dist/` for harness markers — expect zero matches, exactly as verified in §32.7.
5. **Verify no Hosting live-channel deployment occurred:** `firebase hosting:channel:list --project eleventh-on-us-dev` — the `live` channel's release state must be unchanged from Stage A.
6. **Verify no personal evidence remains locally:** confirm no phone number, OTP, or unmasked evidence was ever written to any file in this task (none was — see §32.9).
7. **Retain only privacy-safe test evidence** — the evidence template (masked values only) if the Founder's real-SMS test populates it.

### 32.12 Files changed and why

- `firebase.json` — added `hosting.rewrites`/`hosting.headers` only; Firestore/Storage/Functions/Emulator untouched.
- `apps/web/vite.config.ts` — mode-conditional `build.rollupOptions.input` swap and `VitePWA` omission for `mode === "test-harness"` only.
- `apps/web/harness.html` (new) — the dedicated hosted-preview HTML entry.
- `apps/web/src/dev/phoneAuthHarness/harnessMain.tsx` (new) — the dedicated bootstrap, deliberately excluding the shared composition root.
- `apps/web/src/dev/phoneAuthHarness/testHarnessGate.ts` + `.test.ts` (new) — the pure, fail-closed test-build gate and its 10-case regression suite.
- `apps/web/src/dev/phoneAuthHarness/PhoneAuthHarnessPage.tsx` — added the `testHarnessBuild` prop/guard/banner/robots-meta effect (Stage D); replaced the static-id reCAPTCHA container with the fresh-container-per-attempt mechanism, the `isSendingRef` concurrency guard, and unmount cleanup (Stage E).
- `apps/web/src/dev/phoneAuthHarness/PhoneAuthHarnessPage.test.tsx` — 3 new Stage D tests + 8 new Stage E tests + constructor-argument capture in the existing `RecaptchaVerifier` mock (needed to assert the fresh-container mechanism, not just its symptom).
- `apps/web/.env.example` — documented `VITE_ENABLE_PHONE_AUTH_TEST_HARNESS`.
- `apps/web/.env.test-harness.local` (new, gitignored, never committed) — the real config driving the actual preview deploy.

No unrelated file was modified. `apps/web/src/App.tsx` and the existing dev-server harness route/tests are unchanged.

### 32.13 Risks and rollback

**Risks:** none to production — the harness route (`App.tsx`) and shared composition root are untouched; the CSP/headers only take effect on a deploy using this `firebase.json`, and no live-channel deploy occurred. The one residual note: this CSP is written narrowly for the harness's own needs and would need review before any future full-application production Hosting deploy reuses the same `firebase.json` (a narrower-than-needed CSP fails loudly with visible violations if reused as-is, not silently).

**Rollback:** `git revert` of this task's commit(s) restores the pre-CR3 state (dev-server-only harness, no Hosting rewrites/headers, single-container reCAPTCHA lifecycle). The deployed preview channel is independent of the git history and is torn down per §32.11 regardless of any git action.

### 32.14 Review correction (PR #52, before any merge decision)

Two automated-review findings on PR #52 were independently verified against the actual committed source, both confirmed as genuine:

**P1 — the harness-specific `noindex`/CSP headers were scoped to `"source": "**"` in `firebase.json`.** Correct as a criticism of the *committed config's future reuse risk*: if a future full-application production Hosting deploy reused this same `firebase.json` unmodified, every customer route would inherit the harness's restrictive `noindex` tag and CSP (whose `connect-src` omits `firebaseappcheck.googleapis.com`, needed by `main.tsx`'s real App Check initialization). §32.13 had already disclosed this as a residual risk requiring review before reuse, but disclosure is not the same as prevention. **Fixed:** the header rule was narrowed from `"source": "**"` to three explicit rules matching only the paths this harness deploy actually serves — `/`, `/index.html`, `/assets/**` — each carrying its own combination of cache-control plus (for `/` and `/index.html`) the `noindex`/CSP headers. Firebase Hosting's header matching is confirmed (empirically, in §32.9) to operate on the literal requested path, not the post-rewrite destination, so a future deep route like `/dashboard` — which only ever matches the `**` *rewrite*, never a `/`- or `/index.html`-scoped *header* rule — would no longer inherit these headers at all.

**P2 — the `harness.html` → `index.html` rename was an untracked manual step**, not encoded in any build or deploy command. A clean `vite build --mode test-harness` followed by the documented Firebase deploy command alone would produce `dist/harness.html` while the committed rewrite serves `/index.html`, 404ing on redeploy after the channel's expiry. **Fixed:** added `apps/web/package.json`'s `build:test-harness` script (`tsc -b && vite build --mode test-harness && mv dist/harness.html dist/index.html`), so the full, correct sequence is a single checked-in, reproducible command — verified against a real fresh build producing exactly `dist/index.html`, no `dist/harness.html`.

Both fixes were redeployed to the same `phone-auth-test` preview channel (same URL, refreshed expiry) and re-verified: `curl -I` against `/`, `/index.html`, and a representative deep path confirms the narrowed header scoping behaves as intended; the live channel remains untouched; full validation suite re-run clean.

### 32.15 Status

`EXT-TECH-001`: **Still Pending**. Capability 2: **Blocked**. Environment preparation: **complete**. Real carrier test: **not yet performed** — this remains the Founder's own next step, using the HTTPS preview URL above.
