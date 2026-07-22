> **Title:** ENG-P1-001 Independent Technical Review — Firebase & Shared Platform Foundation
> **Status:** Final — verdict recorded below
> **Date:** 2026-07-20
> **Reviewer role:** Independent Technical Reviewer (11thONUS Engineering Governance framework)
> **Classification:** Read-only review; no implementation code, test, dependency, or Firebase configuration was modified during this review

# ENG-P1-001 Independent Technical Review

## 1. Executive Summary

ENG-P1-001's code — environment loading, Firebase client SDK initialization, Firebase Admin SDK initialization, and `europe-west1` region enforcement — was independently re-derived from the live repository: every source and test file was re-read in full, every validation command was re-run from a clean shell (not copied from the Implementation Report), and the Firebase Emulator Suite was independently started and confirmed. The implementation is architecturally sound, idempotent, correctly scoped to infrastructure only, and backed by 32 passing tests with no over-mocking of the behavior under test.

Independent review found **no Critical or blocking-High findings**. It found two genuine, disclosed-late or under-disclosed Medium-severity gaps (a duplicate/stale `.env.example`, and environment-agnostic App Check "no site key" handling) and two Low-severity test-quality notes — none of which affect correctness, security, or the approved architecture. Independent testing also **disproved** one of the Implementation Report's own disclosed risks (see §17) — the actual local-dev failure mode is safer than what was reported, not more dangerous.

**Verdict: APPROVED WITH NON-BLOCKING OBSERVATIONS.**

**Live-project provisioning governance question (§18):** the governing documents support **Option B** — the code work package is technically approvable now; dev/staging project provisioning is a distinct, Founder/Engineering-Lead-owned action (Cloud Environment & Deployment Strategy §7) required before ENG-P1-001 reaches **Complete**, not before Technical Approval.

## 2. Review Scope

Reviewed: `apps/web/src/config/env.ts`/`.test.ts`, `apps/web/src/vite-env.d.ts`, `apps/web/src/infrastructure/firebase/{app,auth,firestore,storage,appCheck,index}.ts` and their `.test.ts` files, `functions/src/config/region.ts`/`.test.ts`, `functions/src/infrastructure/firebase/admin.ts`/`.test.ts`, the modified `apps/web/src/main.tsx`, `functions/src/index.ts`, `functions/src/index.test.ts`, `apps/web/package.json`, `pnpm-lock.yaml`, the new root `.env.example`, and the ENG-P1-001 Implementation Report.

**Explicitly out of scope, not reviewed for correctness:** ENG-P1-002, ENG-P1-003, any identity/business/loyalty/reward/UI functionality, and the many other uncommitted governance-document changes present in this working tree from earlier, unrelated tasks this session (decision register, PRDs, TRDs, canonical reference, etc.) — confirmed via `git status --short` to be pre-existing and untouched by this review.

## 3. Governing Documents Reviewed

Version 1.0 Engineering Authorization Record; Version 1.0 Engineering Baseline Declaration; Engineering Implementation Programme (Phase 1 profile and ENG-P1-001 work-package row); ENG-P1-001 Implementation Report; Version 1.0 Engineering Blueprint; Repository and Folder Standards; Naming Conventions; Cloud Environment & Deployment Strategy (§§3–7 read in full); Decision Register — `DEC-TECH-005` and `DEC-LEGAL-006` entries read in full, verbatim; Coding Agent Standard (§5 Stop Conditions, cited TRD22 §22.40); Technical Review Standard; Definition of Done (Work-Package Level); Git Workflow; `firebase.json`; `.gitignore`.

## 4. Repository and Diff State

`git branch --show-current` → `main`. `git status --short` confirms the working tree carries substantial **pre-existing, unrelated uncommitted governance-document changes** from earlier tasks this session, plus ENG-P1-001's own change set. Scoped diff for ENG-P1-001 only:

```
apps/web/package.json       |   1 +
apps/web/src/main.tsx       |   8 +-
functions/src/index.test.ts |  10 +-
functions/src/index.ts      |  24 ++-
pnpm-lock.yaml               | 513 ++++++++++++++
5 files changed, 547 insertions(+), 9 deletions(-)
```

Plus untracked: `.env.example`, `apps/web/src/config/`, `apps/web/src/infrastructure/`, `apps/web/src/vite-env.d.ts`, `functions/src/config/`, `functions/src/infrastructure/`, and `docs/05-implementation/reports/ENG-P1-001-implementation-report-2026-07-20.md`.

Full diff of the four modified application files was read in full (not summarized) — confirmed to match exactly what the Implementation Report §5 claims: `firebase` added as a single new dependency line, `main.tsx`'s composition-root call, `functions/src/index.ts`'s region/Admin wiring, and one new region-assertion test. `git diff --check` on the ENG-P1-001 file set: clean (no whitespace errors).

## 5. Independent Validation Results

Every command was re-run from a clean shell, independent of the Implementation Report's claims.

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ "Lockfile is up to date, resolution step is skipped" |
| `pnpm -r run typecheck` | ✅ both workspaces, strict mode, clean |
| `pnpm lint` | ✅ zero findings |
| `pnpm format:check` | ✅ clean |
| `pnpm -r run build` | ✅ both workspaces; `apps/web` bundle 779.69 kB / 237.28 kB gzip, same chunk-size warning the report describes — reproduced exactly |
| `pnpm -r run test` (verbose) | ✅ **32/32** — `apps/web`: 8 files / 27 tests; `functions`: 3 files / 5 tests. Every test name individually inspected (not just the summary count) |
| `pnpm emulators:validate` | ✅ Auth/Functions/Firestore/Hosting/Storage/Extensions start against fake project `demo-11thonus`; log line `functions[europe-west1-ping]: http function initialized (http://127.0.0.1:5001/demo-11thonus/europe-west1/ping)` independently observed; clean shutdown; script exit 0 |

No test emitted an unhandled rejection or unexpected `stderr` line beyond the two expected `console.warn` calls from the App-Check-no-site-key path (visible in the verbose run, matching the code's own designed behavior).

## 6. Architecture Review

- Monorepo separation (`apps/web` / `functions`) preserved; no cross-workspace import.
- `config/` vs `infrastructure/` boundary matches the Repository and Folder Standard's own description verbatim in both workspaces.
- **No direct `firebase/*` or `firebase-admin/*` import outside the composition layer** — verified by an independent repository-wide grep (`grep -rn "from \"firebase" apps/web/src | grep -v infrastructure/firebase` → empty; same for `firebase-admin` in `functions/src`).
- **No duplicate initialization path** — exactly one `setGlobalOptions` call (`functions/src/index.ts:19`), exactly one client `initializeApp(` call (`app.ts:24`) and one Admin `initializeApp()` call (`admin.ts:21`) in the entire codebase (excluding test files, which correctly call through the wrappers, not the SDK directly).
- **No circular dependency** — the import graph is strictly linear: `config/env.ts` ← `infrastructure/firebase/{app,auth,firestore,storage,appCheck}.ts` ← `infrastructure/firebase/index.ts` ← `main.tsx`.
- **No hidden coupling that would complicate ENG-P1-002** — `getAdminApp(): App` is the only surface `functions`-side domain services will need to import; it carries no business-logic assumptions. `FirebasePlatform`'s shape (`app`/`auth`/`firestore`/`storage`/`appCheck`) is the minimum needed today, not speculatively extended.
- **No premature shared-domain package** — nothing under `src/domains/` was touched or created.

## 7. Configuration and Environment Review

- Required variables (`VITE_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/STORAGE_BUCKET/MESSAGING_SENDER_ID/APP_ID`) are validated as a set; missing values fail with a single, clearly-named error listing every missing key (`env.test.ts` line 34 test, independently re-run, passing).
- Malformed boolean values fail clearly — **verified as a real, working control, not merely claimed**: `parseBoolean` (`env.ts:38-43`) throws `Invalid VITE_USE_FIREBASE_EMULATOR value: "<value>" (expected "true" or "false")` for any defined value that isn't exactly `"true"`/`"false"`; the corresponding test (`env.test.ts:72-76`) independently re-run and passing.
- Dev/emulator vs. future-live-project modes are distinguishable via `useEmulator`, correctly threaded through every client wrapper.
- **No tracked `.env`/`.env.local`/`.env.production` file** — confirmed via `git ls-files | grep -i env` (only `apps/web/.env.example` and the new root `.env.example`, both intentionally values-free). `.gitignore` correctly excludes `.env`/`.env.*` with an explicit `!.env.example` carve-out.
- **No secret pattern found** in any new or modified file — targeted regex scan for Google API key format (`AIza...`), PEM private key headers, and Stripe-style live/test key prefixes returned zero matches across `apps/web/src`, `functions/src`, and `.env.example`.
- Admin credentials are never exposed to the frontend — `getAdminApp()` lives only in `functions/src`, a separate workspace never bundled into the Vite client build; confirmed no `firebase-admin` import anywhere under `apps/web/`.
- No environment value is hardcoded except the single, correctly-scoped `PLATFORM_REGION` constant and the emulator host/port literals, which are intentional (they must match `firebase.json`'s own pre-existing, unchanged emulator ports — independently cross-checked: Auth 9099, Firestore 8080, Storage 9199, all matching).

**Wrong-region `.env.local` risk — independently tested, not merely assessed on paper.** The repo root's untracked `.env.local` (pre-existing, not touched by ENG-P1-001) targets a Firestore/Storage project outside `europe-west1`. I tested whether the ordinary local command (`pnpm --filter web dev`, which is how `apps/web`'s `dev` script would actually be invoked) can reach it:

1. Confirmed empirically that `pnpm --filter web exec pwd` resolves to `/Users/theo/11THONUS/apps/web` — pnpm's `--filter` sets the script's working directory to the target package, not the monorepo root.
2. `apps/web/vite.config.ts` sets no `envDir`, so Vite's env-loading directory defaults to that same working directory (`apps/web/`).
3. Using Vite's own `loadEnv()` utility (not application code) with `cwd = apps/web/`, zero `VITE_*` keys were found — the root `.env.local` is **not loaded** under the ordinary dev invocation.
4. Sanity-checked the test itself by explicitly pointing `envDir` at the repo root, which correctly returned all 8 keys from `.env.local` — confirming the empty result above is a real "not found," not a broken test.
5. `apps/web/` has no `.env.local` of its own (confirmed via `ls`).

**Conclusion: acceptable disclosed local risk, downgraded further by direct testing.** No ordinary command defined in this repository's own `package.json` scripts loads the wrong-region `.env.local`. The actual failure mode of running `pnpm --filter web dev` today (with no `apps/web/.env.local`) is that `getAppEnv()` throws `"Missing required environment variables: ..."` immediately at boot — a loud, visible failure, not a silent wrong-region connection. This is a safer outcome than the Implementation Report itself disclosed (see §17). Not a blocking defect; no correction required.

## 8. Firebase Client Initialization Review

`app.ts`, `auth.ts`, `firestore.ts`, `storage.ts` were each re-read line by line.

- **Idempotency:** `getFirebaseApp` checks `getApps().find(app => app.name === name)` before calling `initializeApp`, correctly avoiding the SDK's "app already exists" throw. Independently confirmed via `app.test.ts`'s "returns the same app instance on repeated calls" test (re-run, passing) and via direct code inspection.
- **Emulator connectors execute only when intended:** every one of `auth.ts`/`firestore.ts`/`storage.ts` gates its `connect*Emulator` call behind `useEmulator && !connectedApps.has(app)`. Confirmed both branches are actually exercised by tests, not merely declared (`auth.test.ts` explicitly asserts `emulatorConfig` is `null` when `useEmulator=false` and populated with the correct host/port when `true`).
- **`WeakSet<FirebaseApp>` lifecycle assessment:** correct for this use case. A `WeakSet` keyed on the `FirebaseApp` object itself ties the "already connected" flag to the app instance's own lifetime — when an app is garbage-collected (never explicitly deleted in this codebase, but possible in principle), the set entry is automatically reclaimed with it, with no manual cleanup needed and no risk of a stale entry pointing at a name that could be reused by a *different* app object later. Each of the three wrappers maintains its **own** `WeakSet`, which is correct: `auth`/`firestore`/`storage` emulator connections are independent operations against the same `app`, and one connecting must not block another's guard.
- **No initialization repeated through different imports** — `main.tsx` calls `initializeFirebasePlatform` exactly once; no other file calls any `get*`/`initialize*` function directly.
- **Startup order is safe** — `initializeFirebasePlatform` (`index.ts:29-40`) sequences `app` → `auth`/`firestore`/`storage` (all depend only on `app`) → `appCheck` (depends only on `app`); no ordering hazard.
- **Tests do not over-mock the production path** — every test in `app.test.ts`/`auth.test.ts`/`firestore.test.ts`/`storage.test.ts` calls the real Firebase SDK functions (no `vi.mock` of `firebase/app`, `firebase/auth`, `firebase/firestore`, or `firebase/storage` anywhere in the test suite — confirmed by inspection); only `console.warn` is spied on in `appCheck.test.ts`, which is appropriate (asserting a log call, not stubbing SDK behavior).

No defect found in this section.

## 9. App Check Review

`appCheck.ts` correctly: does not commit a real site key (confirmed — `.env.example` and all test files use the literal placeholder string `"test-site-key"`); gates the debug-token global behind `isDev` (test-confirmed both ways); is idempotent by construction (each call either returns `undefined` or a fresh `AppCheck` object bound to the given `app`, with no risk of the SDK's "already initialized" error since `initializeAppCheck` is themselves guarded upstream by the composition root calling it once per platform init).

**Finding AC-1 (Medium, non-blocking) — missing-site-key handling is environment-agnostic.** `initializeFirebaseAppCheck` (`appCheck.ts:25-31`) returns `undefined` with a `console.warn` whenever `siteKey` is falsy, **regardless of `isDev`**. This is correct and intentional for the current stage (no live project, no real key exists) but does not itself encode "warn-and-continue is acceptable in dev, but a production build must fail loudly." A future production build that is misconfigured (deployed without `VITE_APP_CHECK_SITE_KEY` set) would boot with App Check silently inactive, visible only via a browser-console warning. This is the exact class of risk the review brief's App Check checklist names ("does not silently disable production protection"). **Assessment: acceptable for ENG-P1-001's current scope** — there is no production build target, no live project, and no possible real site key today, so the distinction is not yet reachable in practice; the same Founder-only project-creation gate (§18) that defers live-project provisioning also defers this becoming a live risk. **Required follow-up, not a blocker:** before any production `.env` is populated, `initializeFirebaseAppCheck` should be hardened to throw (not warn-and-continue) when `!isDev && !siteKey`, so a misconfigured production deploy fails the build/boot rather than shipping unprotected.

**App Check emulator-testability assessment:** `firebase.json`'s emulator block has no dedicated App Check emulator/debug provider, and `ping` has no `enforceAppCheck` wiring — so a true "does a protected call succeed/fail correctly" smoke test is not currently possible against this repo's emulator configuration, independent of ENG-P1-001. The Implementation Report does not claim such a smoke test was performed, and its own claims (`appCheck.test.ts`, 4/4, unit-level only) were independently reproduced and are accurate as stated — no over-claiming found here.

## 10. Firebase Admin Review

`admin.ts` re-read and independently tested. `getAdminApp()` correctly checks `getApps().length > 0` before calling `initializeApp()`, avoiding the Admin SDK's "already initialized" throw (`initializeApp()` called with no arguments, relying on the Cloud Functions runtime / `FIRESTORE_EMULATOR_HOST` etc. environment variables — confirmed by independent emulator run that `functions/src/index.ts`'s module-load `getAdminApp()` call succeeds silently every time the emulator starts, with no credential material referenced anywhere in the diff). No business logic was introduced — `admin.ts` contains exactly the singleton-reuse logic and nothing else. No service-account file or credential string exists anywhere in the diff (confirmed by the same secret-pattern scan as §7).

**Finding AD-1 (Low, non-blocking) — order-dependent tests within one file.** `admin.test.ts`'s second test ("returns the same app instance on repeated calls") relies on the Admin SDK's app registry already containing the instance the first test created, rather than independently re-proving "first call initializes, second call reuses" from a clean module state. Confirmed this does not cause cross-file pollution — `functions/vitest.config.ts` has no `isolate: false` override, so Vitest's default per-file module isolation applies (independently confirmed: `index.test.ts`, which also calls `getAdminApp()` via `functions/src/index.ts`'s module-load side effect, runs in the same test run without affecting `admin.test.ts`'s own count assertions). This is a common, low-risk pattern for testing a singleton within one file and is not itself incorrect, but it means test 2 does not independently exercise the "returns the same instance" branch from a guaranteed-clean starting state. Non-blocking; a cosmetic improvement, not a correction.

## 11. Region-Enforcement Review

- `functions/src/config/region.ts` is the **sole** authoritative `PLATFORM_REGION` constant. Repository-wide grep for `europe-west1`/`nam5`/`us-east1`/`us-central1`/`europe-west8`/`africa-south1` across `apps/web/src`, `functions/src`, and `firebase.json` found exactly four live occurrences: the constant's own definition, its own test, the `appCheck.ts` doc-comment/warning string (documentation only, not a functional region setting), and `functions/src/index.test.ts`'s region assertion. No contradictory or duplicate region string exists anywhere in application code.
- `functions/src/index.ts:19`'s `setGlobalOptions({ region: PLATFORM_REGION, maxInstances: 10 })` is the only `setGlobalOptions` call in the codebase.
- **The `__endpoint.region` test is testing meaningful deployment metadata, not an irrelevant artifact** — `__endpoint` is the same property the Firebase CLI itself reads at deploy time to resolve a function's target region (confirmed by independently re-verifying, via the emulator's own startup log, that the *actual* deployed/emulated function reports `europe-west1-ping` — i.e., the CLI's own resolution and the test's assertion agree, cross-validated through two independent mechanisms rather than one circular one).
- **Emulator evidence independently reproduced** (§5): `functions[europe-west1-ping]: http function initialized (http://127.0.0.1:5001/demo-11thonus/europe-west1/ping)`.

No defect found in this section. Region enforcement is genuine, not merely asserted.

## 12. Emulator Validation Review

Independently run (§5), not copied from the report. All five expected services (auth, functions, firestore, hosting, storage) plus extensions started; `demo-11thonus` fake project ID used throughout (confirmed by the CLI's own "Detected demo project ID" log line); no live Firebase project was contacted (the only network-adjacent warning present — "Application Default Credentials detected" — is a pre-existing local-machine condition unrelated to any code in this diff, and applies only to the *possibility* of non-emulated services being reachable, not to anything this codebase actually calls); shutdown was clean (every emulator logged its own "Stopping" line); the validation script exited 0.

## 13. Test-Quality Review

Every test file was read in full (§ system reminder above shows full source). Assessment against the review's specific checklist:

- **Proves behavior, not implementation details** — yes throughout; e.g. `auth.test.ts` asserts `emulatorConfig.host`/`.port` (observable SDK state), not that `connectAuthEmulator` was *called* with certain arguments via a mock.
- **Negative-path coverage** — present: missing-vars (env.test.ts), malformed-boolean (env.test.ts, the self-review-added test), no-site-key App Check (appCheck.test.ts).
- **Emulator on/off coverage** — present for `auth`/`firestore`/`storage` (both branches independently tested, not just the "on" branch).
- **Idempotent initialization / duplicate-app handling** — present and independently re-run (`app.test.ts`, `auth.test.ts`, `firestore.test.ts`, `storage.test.ts`, `admin.test.ts` all have an explicit idempotency test).
- **Admin app reuse** — present (`admin.test.ts`).
- **Region enforcement** — present (§11).
- **Composition-root wiring** — present (`infrastructure/firebase/index.test.ts` asserts `auth`/`firestore`/`storage` all bind to the same `app` instance, and both App-Check branches propagate correctly through the composition root).
- **Weak assertions / false positives** — none found; every assertion targets a specific, meaningful piece of state.
- **Over-mocking** — none found (§8).
- **Test pollution from Firebase global registries** — actively guarded against via per-test randomized app names (`Math.random()` suffixes) in every client-side test file; confirmed this pattern is used consistently, not just in some files.
- **Order-dependent tests** — one minor instance found (AD-1, §10), non-blocking.
- **`app.test.ts`'s `afterEach` hook** — see Finding AT-1 below.

**Finding AT-1 (Low, non-blocking) — misleading dead code in a test helper.** `app.test.ts:15-20`'s `afterEach` hook is commented `"Firebase keeps a module-level app registry; each test starts clean"` but its body only sets `app.automaticDataCollectionEnabled = false` for every registered app — it never calls `deleteApp()` and has no actual bearing on test isolation. The real isolation mechanism is the per-test randomized app name (confirmed: no test in this file, or any sibling file, would collide even if this hook were deleted entirely). This is not a correctness defect — no test depends on this hook's side effect — but the comment overstates what the code does, which could mislead a future contributor into believing app cleanup is handled here when it is not. Non-blocking; recommend removing the hook or replacing it with an accurate comment (or an actual `deleteApp` loop) in a future pass.

## 14. Dependency and Build Review

`apps/web/package.json` — exactly one line added, `firebase: ^12.16.0`, independently confirmed via `git diff`. `functions/package.json` — confirmed **untouched** (`firebase-admin ^13.6.0`/`firebase-functions ^7.0.0` were already present from ENG-P0-001, independently confirmed via `git diff --stat` showing zero changes to that file). `pnpm-lock.yaml` resolves `firebase@12.16.0`, `firebase-admin@13.10.0`, `firebase-functions@7.3.0` — versions independently spot-checked in the lockfile, all current, no downgrade. `pnpm install --frozen-lockfile` succeeded, confirming the lockfile is internally consistent with the manifests (a lockfile tampered with or out of sync would fail this exact command). Import style is standard ES-module named imports from `firebase/*` submodules throughout — consistent with tree-shaking-friendly modular SDK usage; no `import * as firebase` blanket import found anywhere.

**Bundle-size warning assessment:** 779.69 kB / 237.28 kB gzip, independently reproduced. **Classification: acceptable observation for ENG-P1-001, tracked future optimization — not a correction required now.** The warning is Vite's generic 500 kB chunk-size heuristic, not an error; it is a direct, expected consequence of adding the full Firebase modular SDK (App + Auth + Firestore + Storage + App Check) to a bundle that previously had none; code-splitting (dynamic `import()`, manual chunks) is a legitimate later optimization that would itself be premature to build before any route actually needs code-splitting — doing so now would be exactly the kind of speculative complexity the task brief and the "avoid shortcuts / speculative abstractions" quality principle warn against. Per the review's explicit instruction, no code splitting was introduced during this review.

## 15. Security Review

- No committed secret — confirmed via targeted regex scan (§7) for Google API key format, PEM private-key headers, and Stripe-style key prefixes; zero matches.
- No accidentally-tracked environment file — confirmed via `git ls-files | grep -i env` (only the two intentional `.env.example` files).
- No unsafe App Check bypass — the debug-token path is correctly gated behind `isDev` (§9); no unconditional bypass exists.
- No frontend exposure of Admin configuration — `firebase-admin` is never imported outside `functions/src` (§10).
- No credentials in tests — every test file uses the literal string `"test-api-key"`/`"test-site-key"`/etc., never a real-looking value.
- No logging of sensitive values — the only `console.warn` call logs a static, non-parameterized message (no interpolated secret or config value).
- No accidental live-project access — `pnpm emulators:validate` independently confirmed to use the fake `demo-11thonus` project ID only (§12); `.env.local`'s wrong-region project is unreachable under the ordinary dev path (§7).
- No insecure emulator assumption leaking into production — every `connect*Emulator` call is gated behind the caller-supplied `useEmulator` boolean, which is never hardcoded `true`.
- No configuration fallback silently choosing insecure behavior — the one place a fallback exists (`useEmulator` defaulting to Vite's `DEV` flag when unset) defaults to `false` in a production build (`import.meta.env.DEV` is `false` when built with `vite build`, confirmed by Vite's own documented behavior and by this session's independent `pnpm -r run build` producing a production bundle), which is the safe direction — an unconfigured production build defaults to *not* connecting to an emulator, not the reverse.

No Critical or High security finding.

## 16. Scope-Compliance Review

Every changed and untracked file was individually enumerated (§4) and matches ENG-P1-001's approved scope exactly: environment configuration, Firebase client/Admin SDK initialization, region enforcement, App Check foundation. **No product-domain logic, customer registration, business workflow, loyalty logic, reward logic, business service, speculative abstraction, or premature shared-domain package was found anywhere in the diff** — confirmed by having read every line of every new/modified application file (§ system reminder full source dump), not merely the file list. `src/domains/` remains untouched in both workspaces.

## 17. Implementation-Report Accuracy Review

Every material claim in the ENG-P1-001 Implementation Report was checked against the live repository, independently, not accepted on the report's own authority.

| Report claim | Independent verification | Result |
|---|---|---|
| "8 test files, 27 tests" (`apps/web`) | Re-ran verbose suite, counted test names individually | ✅ Accurate |
| "3 test files, 5 tests" (`functions`) | Re-ran verbose suite, counted test names individually | ✅ Accurate |
| Bundle 779.69 kB / 237.28 kB gzip | Independently rebuilt | ✅ Accurate, reproduced exactly |
| `functions[europe-west1-ping]` emulator evidence | Independently ran `pnpm emulators:validate` | ✅ Accurate, reproduced exactly |
| "one new dependency" (`firebase`) | `git diff` on both `package.json` files | ✅ Accurate |
| ".env.example (repo root, new — had never existed)" | `git ls-files \| grep -i env` | ❌ **Inaccurate** — see Finding CFG-1 below |
| §10 Risk: "a developer running `pnpm dev` today without `VITE_USE_FIREBASE_EMULATOR=true` would connect to the wrong-region project" | Independently tested via `pnpm --filter web exec pwd` + Vite's own `loadEnv()` utility from the real invocation cwd | ❌ **Inaccurate / overstated** — the root `.env.local` is not loaded at all under the ordinary invocation path; the actual failure mode is a loud, immediate `loadEnv()` throw, not a silent wrong-region connection. See §7. |
| No unrelated file touched | `git status --short` scoped diff | ✅ Accurate |
| Rollback instructions | Cross-checked file-by-file against the actual new/modified file list | ✅ Accurate and complete |
| Self-review defect (`parseBoolean`) fix | Re-read `env.ts`, re-ran the specific test | ✅ Accurate — the fix is real and the test genuinely exercises it |

**Finding CFG-1 (Medium, non-blocking) — duplicate/stale `.env.example`, and an inaccurate "had never existed" claim.** A `.env.example` **already existed** at `apps/web/.env.example` (tracked, committed at `3a50710`, ENG-P0-001) before this task. ENG-P1-001 created a **second**, overlapping `.env.example` at the repository root instead of updating the existing one. The two files now disagree: `apps/web/.env.example` lists 7 variable names (missing the 3 new optional vars this task introduced: `VITE_USE_FIREBASE_EMULATOR`, `VITE_APP_CHECK_SITE_KEY`, `VITE_APP_CHECK_DEBUG_TOKEN`), and its own header comment is now stale (*"actual Firebase project wiring is Phase 1 work (ENG-P1-xxx) once DEC-TECH-005 (region) is resolved"* — DEC-TECH-005 is now `CONFIRMED` and Phase 1 wiring now exists). Neither file cross-references the other. This creates genuine onboarding ambiguity (which file does a new contributor copy from?) and the Implementation Report's claim that no `.env.example` previously existed is factually wrong — it existed, just not at the path this task used. **Impact:** documentation/configuration only; no runtime behavior is affected (neither file is read by any script — both are developer-facing templates only). **Required correction (non-blocking for this Approval, should be corrected in a fast follow-up, not indefinitely deferred):** reconcile into one canonical `.env.example`, either by deleting `apps/web/.env.example` in favor of the root file (recommended, since Vite's env loading for `apps/web` actually reads from `apps/web/` per §7's finding, making an `apps/web/.env.local`-adjacent example arguably *more* correct in principle, but the root file is where a monorepo-wide contributor would look first) or by updating `apps/web/.env.example` to match and adding a one-line cross-reference in both. This finding does not block Approval because it has zero runtime/security impact and does not touch any file in ENG-P1-001's actual code path.

No other material discrepancy was found. The report's engineering-standards-compliance and acceptance-criteria claims (§8–9 of the report) were independently re-verified against the actual code and found accurate, with the two refinements captured in Findings AC-1 and CFG-1 above.

## 18. Live-Project Provisioning Governance Assessment

This is the review's central governance question, evaluated against the exact cited passages, not the Implementation Report's own conclusion.

**Cited passages:**

- Cloud Environment & Deployment Strategy §7: *"Create a new Firebase/GCP project"* → *"Founder or Engineering Lead, under explicit Founder authorization... never a coding agent acting autonomously."* And: *"Where a work package appears to require any of these, the correct response is the same as any other blocked precondition — stop and report... not to act and report afterward."*
- Decision Register, `DEC-TECH-005`, "Implementation consequences": *"`ENG-P1-001` (Firebase project initialization) may target `europe-west1` directly"* — this phrasing presumes ENG-P1-001 includes actual project initialization, not code alone.
- Decision Register, `DEC-LEGAL-006`, Final decision: *"Engineering implementation is authorized... Engineering implementation is therefore not blocked by future legal execution activities."* — confirms project creation is **legally** authorized today; the only remaining constraint is the **organizational-authority** one in §7, not an open legal or technical decision.
- Engineering Implementation Programme, ENG-P1-001 row: *"Deployment Required: Yes (dev/staging projects, `europe-west1`)."*
- Definition of Done §2: item 1 (acceptance criteria met) through item 6 (**Technical Review Approved**) precede item 7 (commit/push) and item 8 (**Founder pulled, verified, and deployed**) — Approval is explicitly ordered *before* deployment in this document's own numbered sequence.

**Analysis.** Two distinct gates are in play, and they answer different questions. Legally and technically, nothing blocks live-project creation today (`DEC-TECH-005` and `DEC-LEGAL-006` are both `CONFIRMED`). Organizationally, §7 reserves the *act* of creating that project to the Founder/Engineering Lead — never a coding agent. The coding agent that implemented ENG-P1-001 did not attempt project creation, did not enable any API/billing, and did not deploy to production; it built and validated everything reachable within its own authority (code + Emulator Suite) and disclosed the remaining gap prominently, in the Implementation Report's own Executive Summary, before any other conclusion — not silently, and not as an after-the-fact surprise. This is compliant with §7's letter (no unauthorized infrastructure action was taken). It is a slightly stricter reading of §7's *"stop and report... not act and report afterward"* spirit that a coding agent encountering a Founder-only precondition mid-work-package might have paused *before* writing any code, to have the Founder explicitly confirm Emulator-only validation was an acceptable substitute for the Programme's stated "Deployment Required: Yes," rather than the agent resolving that scope question unilaterally. Given the outcome was disclosed transparently and no irreversible action occurred, I do not treat this as a blocking defect — but I record it as a **process observation** worth the Founder's attention for future work packages that similarly straddle a Founder-only precondition.

**Conclusion: Option B is the best-supported reading, refining rather than contradicting Option A.** The code foundation is technically approvable now — Technical Review Approval (Definition of Done item 6) is explicitly sequenced *before* commit/push/deploy (items 7–8) in the governing document itself, so Approval does not require a live project to exist. However, ENG-P1-001's own Programme row explicitly requires dev/staging projects in `europe-west1` ("Deployment Required: Yes"), and the Definition of Done's items 7–8 (commit/push, Founder deploy) cannot be satisfied without them — so **ENG-P1-001 cannot reach `Complete` until the Founder-authorized live-project step is performed.** Option A alone understates this by not naming the completion gate explicitly; Option C is not supported — no additional *code or configuration* work is required before Approval, only a Founder-owned infrastructure action that is definitionally outside what "corrections" to a coding agent's implementation can produce.

**Explicit answer to the required sub-question — when must dev/staging projects be provisioned:**

- **Before Technical Approval:** No — not required, and not required by this review.
- **Before this work package (`ENG-P1-001`) reaching `Complete`:** **Yes** — this is the work package's own stated deployment requirement (Programme row) and the Definition of Done's own item-8 gate.
- **Before Phase 1 completion:** Yes, necessarily — Phase 1 completion requires `ENG-P1-001` to be `Complete` among its exit criteria, so this inherits the same requirement.
- **Deferred to a later, separate deployment stage:** No — this is not a future work package's concern being pushed downstream; it is explicitly *this* work package's own unmet deployment requirement, not deferred to `ENG-P1-002`/`ENG-P1-003` or any later phase.

## 19. Acceptance Criteria, Verified Individually

Re-verified independently against the Programme's ENG-P1-001 row and TRD22 §22.11's applicable exit-criteria slice — not accepted from the Implementation Report's own §8.

1. **"Firebase projects exist and a client can initialize against them safely."** Partially met, as disclosed: no live project exists (§18); client initialization is independently confirmed safe and idempotent against both a test config and the real Emulator Suite (§8, §12). **Not fully met** in the "projects exist" sense — this is the live-project gate (§18), not a code defect.
2. **`FR-OPS-001`** (isolated projects/data per environment) — met at the code level: no project ID is hardcoded anywhere in `apps/web/src` or `functions/src` (independently grepped); isolation is a pure configuration concern once real projects exist.
3. **`FR-OPS-003`** (secrets outside source control/frontend) — met, independently verified (§7, §15).
4. **Environment-aware initialization** — met, independently re-run (`env.test.ts`'s DEV-flag-default and explicit-override tests).
5. **App Check foundation** — met for ENG-P1-001's stated scope, with the environment-agnostic gap noted as Finding AC-1 (non-blocking, future-hardening item).
6. **Emulator compatibility** — met, independently reproduced end-to-end (§12).
7. **Environment separation** — met (named secondary app-instance support, independently confirmed via `app.test.ts`).
8. **Secure configuration loading** — met, including the self-review-fixed malformed-boolean case, independently re-run and confirmed passing.
9. **Common initialization utilities** — met (`initializeFirebasePlatform`, `getAdminApp` are the sole composition roots, independently confirmed via the import-graph check in §6).
10. **TRD22 §22.11's "emulator tests pass" (ENG-P1-001's owned slice)** — met, independently reproduced.

No acceptance criterion was found unmet in a way that constitutes a code or test defect; the one partial item (#1) is the disclosed, Founder-gated live-project boundary (§18), not a shortfall in what the coding agent controls.

## 20. Findings Table

| ID | Severity | File:Line | Evidence | Impact | Required Correction | Blocks Approval? |
|---|---|---|---|---|---|---|
| CFG-1 | Medium | `apps/web/.env.example` (pre-existing) vs. new `.env.example` (root) | Two overlapping, now-inconsistent `.env.example` files; pre-existing file's comment is stale; Implementation Report's "had never existed" claim is factually inaccurate | Onboarding ambiguity; no runtime/security impact | Reconcile into one canonical file (delete or update+cross-reference `apps/web/.env.example`) | No |
| AC-1 | Medium | `apps/web/src/infrastructure/firebase/appCheck.ts:25-31` | Missing-site-key handling is identical in dev and (future) production — warn-and-continue in both | A misconfigured future production build would boot with App Check silently inactive | Before any production `.env` exists, throw (not warn) when `!isDev && !siteKey` | No — not reachable today (no production build target/live project exists) |
| AT-1 | Low | `apps/web/src/infrastructure/firebase/app.test.ts:15-20` | `afterEach` comment claims cleanup that the code does not perform (`deleteApp` never called) | Misleading to future readers; no functional effect (isolation is via randomized names) | Remove the hook or correct the comment/implement real cleanup | No |
| AD-1 | Low | `functions/src/infrastructure/firebase/admin.test.ts` | Test 2 relies on test 1's already-initialized state rather than proving reuse from a clean start | Minor test-design coupling; no cross-file pollution (confirmed) | Optional: make test 2 self-contained | No |

**No Critical or High-severity finding was identified.**

## 21. Risks and Non-Blocking Observations

- App Check cannot be end-to-end smoke-tested (no App Check emulator configured in `firebase.json`, no enforcement wired to `ping`) until a live project and real site key exist — same Founder-gated boundary as §18, not a new risk.
- The bundle-size warning (§14) will grow as more Firebase-dependent code is added in ENG-P1-002/003; worth a code-splitting pass once real routes exist, not now.
- Process observation (§18): future work packages that discover a Founder-only precondition mid-implementation should consider an explicit stop-and-report to the Founder before proceeding with an alternative validation strategy, even when that alternative is ultimately judged compliant and is disclosed transparently.
- The pre-existing untracked `.env.local`'s wrong-region values remain a latent footgun for any *non-standard* invocation (e.g., running `vite` directly from the repository root rather than through the package's own scripts) — low likelihood given no such invocation exists in any committed script, not a correction required now.

## 22. Required Corrections

None are required before Approval. The two Medium findings (CFG-1, AC-1) are recommended for a near-term follow-up task but do not themselves invalidate ENG-P1-001's Approval, per the severity reasoning in §20.

## 23. Final Verdict

**APPROVED WITH NON-BLOCKING OBSERVATIONS.**

Basis: zero Critical or blocking-High findings after full independent re-derivation of every claim; all validation commands independently reproduced with identical results; architecture, security, region enforcement, and scope compliance all confirmed directly against source, not accepted from the Implementation Report. The four findings recorded (§20) are Medium/Low, non-blocking, and mapped to specific files with concrete, narrow corrections recommended for a future task — not required to re-open this one.

`ENG-P1-001` is **not** marked `Complete`. Per §18, live dev/staging project provisioning (a Founder/Engineering-Lead-owned action) remains required before this work package can reach `Complete`; this review does not perform, and cannot self-certify, that step.

## 24. Tracking-Document Changes

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — `ENG-P1-001` row: `Status` → **Approved**; Technical Review link added; `ENG-P1-002` row left `Blocked` (precondition remains `ENG-P1-001` **complete**, not `Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — `ENG-P1-001` row: `Status` → **Approved**; Technical Review link added; §5 distribution updated.
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry recording this review's verdict and findings.

## 25. Files Created

- `docs/05-implementation/reports/ENG-P1-001-technical-review-2026-07-20.md` (this report).

## 26. Files Modified

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — `ENG-P1-001` row and status narrative only.
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — `ENG-P1-001` row and §5 distribution only.
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one appended entry.

No implementation code, test, package manifest, lockfile, or Firebase configuration file was modified during this review.

## 27. Commands Executed

```
git branch --show-current
git status --short
git diff --stat
git diff --name-only
git diff --check -- <ENG-P1-001 file set>
git diff -- apps/web/package.json apps/web/src/main.tsx functions/src/index.ts functions/src/index.test.ts
git ls-files | grep -i env
git check-ignore -v .env.local
grep -rn "europe-west1|nam5|us-east1|us-central1|europe-west8|africa-south1" apps/web/src functions/src firebase.json apps/web/package.json functions/package.json
grep -rEn "AIza[0-9A-Za-z_-]{35}|-----BEGIN (RSA )?PRIVATE KEY-----|sk_live_|sk_test_" apps/web/src functions/src .env.example
grep -rn "from \"firebase" apps/web/src | grep -v infrastructure/firebase
grep -rn "from \"firebase-admin" functions/src | grep -v infrastructure/firebase
grep -rn "setGlobalOptions" functions/src
grep -rn "initializeApp(" apps/web/src functions/src
pnpm install --frozen-lockfile
pnpm -r run typecheck
pnpm lint
pnpm format:check
pnpm -r run build
pnpm vitest run --reporter=verbose   (apps/web)
pnpm vitest run --reporter=verbose   (functions)
pnpm emulators:validate
pnpm --filter web exec pwd
node -e "import('vite').then(v => console.log(Object.keys(v.loadEnv('development', process.cwd(), 'VITE_'))))"   (from apps/web/, and again with explicit root envDir as a sanity check)
```

## 28. Dependencies Added

None. This review added zero dependencies, zero devDependencies, and made zero changes to any `package.json` or `pnpm-lock.yaml`.

## 29. Configuration Changes

None. No `.env`, `.env.example`, `firebase.json`, `vite.config.ts`, `tsconfig.json`, or emulator configuration file was modified during this review.

## 30. Rollback Instructions

This review is documentation-only. To fully revert:

- **Delete** `docs/05-implementation/reports/ENG-P1-001-technical-review-2026-07-20.md` (this file).
- **Revert** the `ENG-P1-001` row/status edits in [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) back to `Under Review` (no Technical Review link).
- **Revert** the `ENG-P1-001` row/status edits and §5 distribution in [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) back to `Under Review`.
- **Revert** the single appended entry in [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) (remove only this review's section; do not touch any entry above it).

Nothing from this review was committed or pushed; rollback today is discarding the working-tree changes above.
