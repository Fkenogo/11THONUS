> **Title:** ENG-P1-001 Implementation Report — Firebase & Shared Platform Foundation
> **Status:** Implemented, locally and emulator-validated — awaiting Technical Review
> **Date:** 2026-07-20
> **Classification:** First application-code work package of the Version 1.0 Engineering Implementation Programme

# ENG-P1-001 Implementation Report

## 1. Executive Summary

This work package implements the shared Firebase platform foundation for Version 1.0: environment-aware configuration loading, Firebase client SDK initialization (App, Auth, Firestore, Storage, App Check) for `apps/web`, and Firebase Admin SDK initialization plus the approved-region constant for `functions`. No business logic, UI, authentication flow, or domain service was implemented — this is infrastructure only, exactly as ENG-P1-001's scope defines.

Every file was built test-first (TDD Red-Green-Refactor), validated against the real Firebase Emulator Suite (not just mocks), and self-reviewed after the initial pass, which found and corrected one real defect (silent mis-coercion of an invalid `VITE_USE_FIREBASE_EMULATOR` value).

**One explicit, disclosed scope boundary:** the Engineering Implementation Programme's ENG-P1-001 row states "Deployment Required: Yes (dev/staging projects, `europe-west1`)". This was **not done**. The Cloud Environment & Deployment Strategy §7 (Infrastructure Governance) states that creating a Firebase/GCP project is never a coding agent's autonomous action — it requires Founder authorization and billing-account access a coding agent does not have. This implementation instead builds and validates everything against the Firebase Emulator Suite (already configured, `demo-11thonus`), and is written so that pointing it at a real `europe-west1` project later requires only populating `.env` values — no code change. This boundary is carried into §10 (Risks) and the tracking-document updates below, not silently absorbed.

## 2. Repository Analysis

### 2.1 Existing State (before this task)

- `apps/web` (Vite + React + TS, from ENG-P0-001) had no Firebase code at all — no `firebase` dependency, no `src/config/`, no `src/infrastructure/`, no `src/vite-env.d.ts`.
- `functions` (Cloud Functions v2, from ENG-P0-001) had `firebase-admin`/`firebase-functions` as dependencies but neither was ever imported — `functions/src/index.ts` only exported a neutral `ping` HTTP function with `setGlobalOptions({ maxInstances: 10 })` (no region set).
- `firebase.json` (from ENG-P0-001) already configured the full Emulator Suite (`auth:9099`, `functions:5001`, `firestore:8080`, `storage:9199`, `hosting:5050`, `ui:4000`, `singleProjectMode: true`, project `demo-11thonus`) — unchanged by this task.
- `.env.local` (untracked, pre-existing, not created by this task) contains real Firebase config for a project whose Firestore/Storage regions do **not** match the approved `europe-west1` (`DEC-TECH-005`). This project was never touched, read into any committed file, or used as a target.
- **Correction (2026-07-21, closure task):** the statement originally here — "No `.env.example` existed" — was inaccurate. A `.env.example` already existed at `apps/web/.env.example` (tracked since ENG-P0-001, `3a50710`). This task's original implementation created a second, overlapping `.env.example` at the repository root instead of updating the existing one, which the Independent Technical Review (2026-07-20) flagged as Finding CFG-1. This has been corrected: the root-level file has been deleted and `apps/web/.env.example` is now the sole, canonical, updated example file — see the [ENG-P1-001 Review Observations and Infrastructure Preflight Report](ENG-P1-001-review-observations-and-infrastructure-preflight-2026-07-21.md) §3.
- The Repository and Folder Standard's target layout (`src/{domains,shared,config,infrastructure,ui}`) was defined but `config/` and `infrastructure/` did not yet exist in `apps/web`; `functions/src/` had no `config/` or `infrastructure/` subfolders either.

### 2.2 Findings

- `DEC-TECH-005` (region `europe-west1`) and `DEC-LEGAL-006` (cross-border hosting) are both `CONFIRMED` — ENG-P1-001's decision dependencies are satisfied (see the [Decision Register](../../00-governance/decisions/decision-register.md)).
- No live `europe-west1` Firebase project exists yet, and creating one is explicitly outside a coding agent's authority (Cloud Environment & Deployment Strategy §7) — this shapes the entire implementation strategy (§2.3).
- `firebase-functions`'s `setGlobalOptions`/no public getter meant region configuration could only be verified indirectly, via the `__endpoint` metadata that `onRequest()`-returned functions expose (used by the Firebase CLI itself for deploy introspection) — a legitimate, stable test target, not an internal implementation detail.

### 2.3 Implementation Strategy

Build every piece of the shared platform foundation as pure, testable modules validated against the Firebase Emulator Suite, structured so that switching from the emulator to a real `europe-west1` project later is a configuration change only:

- `apps/web/src/config/env.ts` — a pure `loadEnv(source, viteFlags)` function plus a lazily-cached `getAppEnv()` singleton, reading and validating `VITE_FIREBASE_*` variables from `import.meta.env`.
- `apps/web/src/infrastructure/firebase/{app,auth,firestore,storage,appCheck}.ts` — one thin, idempotent wrapper per Firebase client SDK area, each connecting to its emulator when `useEmulator` is true.
- `apps/web/src/infrastructure/firebase/index.ts` — a single composition root (`initializeFirebasePlatform`) wiring all five together; no other file calls `firebase/*` SDK functions directly.
- `functions/src/config/region.ts` — the single `PLATFORM_REGION = "europe-west1"` source of truth (`DEC-TECH-005`).
- `functions/src/infrastructure/firebase/admin.ts` — a single, reused Admin SDK app instance (`getAdminApp()`).
- `functions/src/index.ts` wired to call `setGlobalOptions({ region: PLATFORM_REGION, ... })` and `getAdminApp()`; `apps/web/src/main.tsx` wired to call `initializeFirebasePlatform(getAppEnv())` before rendering.

### 2.4 Files Expected to Change (from the analysis phase, confirmed accurate — see §3/§4)

`apps/web/package.json` (new dependency), `apps/web/src/main.tsx` (composition-root wiring), `functions/src/index.ts` (region + Admin init), `functions/src/index.test.ts` (new region assertion), plus new files under `apps/web/src/{config,infrastructure}/` and `functions/src/{config,infrastructure}/`, and a new root `.env.example`.

### 2.5 Validation Strategy

TDD (Red-Green-Refactor) per file; full workspace `typecheck`/`lint`/`format:check`/`build`/`test`; real Firebase Emulator Suite validation (`pnpm emulators:validate`) to confirm the region wiring and App/Auth/Firestore/Storage initialization work through actual Firebase tooling, not only unit-test assertions.

### 2.6 Risks (identified before implementation, confirmed accurate — see §10)

No live project to deploy to or test App Check against with a real site key; existing `.env.local` targets the wrong region and must not be used as a stand-in.

## 3. Files Modified

- `apps/web/package.json` — added `firebase: ^12.16.0` (the only new dependency this task required; `firebase-admin`/`firebase-functions` in `functions` already existed from ENG-P0-001).
- `apps/web/src/main.tsx` — added `initializeFirebasePlatform(getAppEnv())`, called once before `QueryClient`/render, so the shared platform is ready before anything else runs.
- `functions/src/index.ts` — updated the header comment; added `setGlobalOptions({ region: PLATFORM_REGION, maxInstances: 10 })` (previously no region was set); added `getAdminApp()` call so the Admin SDK singleton is initialized at module load.
- `functions/src/index.test.ts` — added one test asserting `ping`'s deployed region (via `__endpoint.region`) equals `["europe-west1"]`.
- `pnpm-lock.yaml` — updated automatically by `pnpm add firebase`.

## 4. Files Created

**`apps/web` workspace:**

- `src/config/env.ts` / `env.test.ts` — environment loading and validation (8 tests).
- `src/vite-env.d.ts` — `ImportMetaEnv` typing for every `VITE_*` variable this task introduced or relies on (was missing entirely before this task).
- `src/infrastructure/firebase/app.ts` / `app.test.ts` — Firebase App init (2 tests).
- `src/infrastructure/firebase/auth.ts` / `auth.test.ts` — Auth + emulator (4 tests).
- `src/infrastructure/firebase/firestore.ts` / `firestore.test.ts` — Firestore + emulator (3 tests).
- `src/infrastructure/firebase/storage.ts` / `storage.test.ts` — Storage + emulator (2 tests).
- `src/infrastructure/firebase/appCheck.ts` / `appCheck.test.ts` — App Check, site-key-optional (4 tests).
- `src/infrastructure/firebase/index.ts` / `index.test.ts` — composition root (3 tests).

**`functions` workspace:**

- `src/config/region.ts` / `region.test.ts` — `PLATFORM_REGION` constant (1 test).
- `src/infrastructure/firebase/admin.ts` / `admin.test.ts` — Admin SDK init (2 tests).

**Repository root:**

- `.env.example` — documents every `VITE_*` variable (required and optional) with comments; no real values. `.gitignore` already had `!.env.example` anticipating this file.

Each file was created because ENG-P1-001's scope names it directly (Firebase client/Admin initialization, environment-aware config, App Check foundation, emulator compatibility, common initialization utilities) — no file was added speculatively.

## 5. Code Diff Summary

```
 apps/web/package.json       |   1 +
 apps/web/src/main.tsx       |   8 +-
 functions/src/index.test.ts |  10 +-
 functions/src/index.ts      |  24 ++-
 pnpm-lock.yaml              | 513 ++++++++++++++++++++++++++++++-
 5 files changed, 547 insertions(+), 9 deletions(-)
```

New files (line counts): `env.ts` 82, `env.test.ts` 77, `vite-env.d.ts` 19, `app.ts` 36 / `app.test.ts` 38, `auth.ts` 28 / `auth.test.ts` 50, `firestore.ts` 26 / `firestore.test.ts` 44, `storage.ts` 26 / `storage.test.ts` 32, `appCheck.ts` 43 / `appCheck.test.ts` 67, `index.ts` 41 / `index.test.ts` 40, `region.ts` 10 / `region.test.ts` 8, `admin.ts` 22 / `admin.test.ts` 18, `.env.example` 23.

`git status --short` confirms the touched-file set contains only the above, plus this report and the tracking-document updates in §14 — no unrelated file was modified (`IM-006`).

## 6. Commands Executed

```
pnpm add firebase --filter apps/web
pnpm vitest run src/config/env.test.ts                     # per-file TDD loop, apps/web
pnpm vitest run src/infrastructure/firebase/app.test.ts
pnpm vitest run src/infrastructure/firebase/auth.test.ts
pnpm vitest run src/infrastructure/firebase/firestore.test.ts
pnpm vitest run src/infrastructure/firebase/storage.test.ts
pnpm vitest run src/infrastructure/firebase/appCheck.test.ts
pnpm vitest run src/infrastructure/firebase/index.test.ts
pnpm vitest run src/config/region.test.ts                  # per-file TDD loop, functions
pnpm vitest run src/infrastructure/firebase/admin.test.ts
pnpm vitest run src/index.test.ts
pnpm -r run typecheck
pnpm lint
pnpm format:check   # → 1 failure (env.ts/env.test.ts) → pnpm format → re-run clean
pnpm -r run build
pnpm -r run test
pnpm emulators:validate
git status --short
```

## 7. Tests Executed

| Command | Result |
|---|---|
| `pnpm -r run typecheck` | ✅ both workspaces, strict mode, zero errors |
| `pnpm lint` | ✅ zero errors, zero warnings |
| `pnpm format:check` | ✅ clean (after one `pnpm format` auto-fix during validation — see §11) |
| `pnpm -r run build` | ✅ both workspaces build; `apps/web` bundle 779.69 kB / 237.28 kB gzip (chunk-size warning only, pre-existing category — see §10) |
| `pnpm -r run test` | ✅ **32/32 tests pass** — `apps/web`: 8 test files, 27 tests; `functions`: 3 test files, 5 tests |
| `pnpm emulators:validate` | ✅ Auth/Functions/Firestore/Hosting/Storage all start against `demo-11thonus`; log confirms `functions[europe-west1-ping]: http function initialized` (real, tool-observed region evidence, not just a unit-test assertion); smoke script exits 0; clean shutdown |

Per-module test breakdown (all TDD Red→Green, confirmed failing for the right reason before each fix): `env.ts` 8, `app.ts` 2, `auth.ts` 4, `firestore.ts` 3, `storage.ts` 2, `appCheck.ts` 4, `infrastructure/firebase/index.ts` 3, `region.ts` 1, `admin.ts` 2, `functions/index.ts` (region assertion added to the existing suite) 1 new — total 27 web + 5 functions = 32.

## 8. Acceptance Criteria Verification

Verified individually against the Engineering Implementation Programme's ENG-P1-001 row and TRD22 §22.11's phase-level exit criteria that apply to this work package's scope:

1. **"Firebase projects exist and a client can initialize against them safely" (ENG-P1-001 Objective).** Partially satisfied by design: no live `europe-west1` *project* was created (§1, explicit scope boundary — project creation is a Founder action per Cloud Environment & Deployment Strategy §7). What **is** verified: `getFirebaseApp()` initializes a client safely and idempotently against the configured project ID (`app.test.ts`, 2/2 passing), and the same code initializes correctly against the real Emulator Suite (`pnpm emulators:validate` — Auth/Firestore/Storage/Functions/Hosting all start; the `ping` function's `__endpoint.region` is observably `["europe-west1"]`). The client is written to work identically once a real `europe-west1` project's config is populated in `.env` — no code change required.
2. **Requirement `FR-OPS-001`** ("Development, staging and production shall use isolated projects and data") — satisfied at the code level: `getFirebaseApp`/`getAdminApp` never hardcode a project ID; both read it from injected config (`.env`/`import.meta.env` for the client, environment for Admin), so distinct projects per environment are a configuration concern, not a code change. Full satisfaction (three actually-isolated live projects) remains a deployment-stage item outside this work package's Emulator-only scope, consistent with §1.
3. **Requirement `FR-OPS-003`** ("Secrets shall remain outside source control and frontend applications") — satisfied: `.env.example` documents variable names only, no values; `.env`/`.env.local` remain gitignored (pre-existing, unchanged); `loadEnv` reads only from the injected `source` object, never reads process/file secrets directly; the Admin SDK reads credentials via `initializeApp()`'s implicit environment-based resolution (no key material in any committed file).
4. **"Environment-aware initialization"** — `loadEnv`'s `useEmulator` defaults to Vite's `DEV` flag and can be explicitly overridden via `VITE_USE_FIREBASE_EMULATOR`; every client wrapper (`auth`/`firestore`/`storage`) branches on this flag to connect to its emulator or not. Verified by `env.test.ts` (`"defaults useEmulator to the Vite DEV flag..."`, `"honours an explicit ... override..."`).
5. **"App Check foundation"** — `initializeFirebaseAppCheck` initializes real App Check when a site key is configured, and returns `undefined` with a clear, actionable `console.warn` (not a silent no-op, not an error) when none is — because no `europe-west1` project exists yet to issue one. Verified by `appCheck.test.ts` (4/4), including both branches.
6. **"Emulator compatibility"** — verified two ways: unit tests assert each SDK wrapper calls the correct `connect*Emulator` with `firebase.json`'s exact pre-existing ports (Auth `9099`, Firestore `8080`, Storage `9199`); `pnpm emulators:validate` proves it end-to-end through real Firebase tooling, not just mocked assertions.
7. **"Environment separation"** — the same `getFirebaseApp(config, name?)` signature supports named secondary app instances (used internally by every test to avoid cross-test Firebase app-registry collisions), and nothing in the client or Admin code path assumes a single fixed environment.
8. **"Secure configuration loading"** — `loadEnv` throws a clear, named-variable error (`"Missing required environment variables: ..."`) rather than initializing with `undefined` values; the self-review-found defect (silent coercion of an invalid `VITE_USE_FIREBASE_EMULATOR` value to `false`) was corrected to throw instead (§11) — configuration is validated, not guessed.
9. **"Common initialization utilities"** — `apps/web/src/infrastructure/firebase/index.ts`'s `initializeFirebasePlatform()` is the single composition root every future domain service reuses; `functions/src/infrastructure/firebase/admin.ts`'s `getAdminApp()` is the equivalent for Cloud Functions. Both are idempotent (safe to call multiple times, reuse the existing instance).
10. **TRD22 §22.11 phase-level "emulator tests pass"** (the sub-slice of this criterion that ENG-P1-001 itself owns, distinct from the command-contract/outbox/deny-by-default criteria owned by `ENG-P1-002`/`ENG-P1-003`) — satisfied: `pnpm emulators:validate` passes cleanly end-to-end.

## 9. Engineering Standards Compliance

- **Engineering Blueprint / Repository and Folder Standard §3** — new code lands exactly in the standard's named `config/` and `infrastructure/` folders in both workspaces; `infrastructure/firebase/` matches the standard's own description ("Firebase client/Admin SDK init, adapters") verbatim.
- **Decision Register** — `DEC-TECH-005` (`europe-west1`) is the single value in `functions/src/config/region.ts`, cited by its exact ID in the file's own doc comment; no other region string appears anywhere in the new code.
- **Naming Conventions** — folders kebab-case (`infrastructure/firebase`), non-component TypeScript files camelCase (`appCheck.ts`, `env.ts`), test files mirror their subject (`auth.ts` ↔ `auth.test.ts`).
- **Coding Agent Standard / TDD** — every file was written test-first; no test was added after its implementation; the one defect found in self-review was corrected via a new failing test, not a direct edit (§11).
- **Quality expectations (deterministic, testable, fully typed, documented)** — `apps/web/tsconfig.app.json`'s `strict`/`verbatimModuleSyntax`/`noUnusedLocals`/`noUnusedParameters` and `functions/tsconfig.json`'s `strict` both pass with zero suppressions or `any`; every exported function has a one-paragraph doc comment stating *why*, not restating its signature.
- **"Avoid shortcuts / speculative abstractions"** — no configuration option, parameter, or file exists that ENG-P1-001's scope or an actual test does not require; `getFirebaseApp`'s optional `name` parameter exists only because the test suite itself needs named app instances to avoid cross-test collisions, not as future-proofing.
- **Cloud Environment & Deployment Strategy §7 (Infrastructure Governance)** — no Firebase/GCP project was created, no `firebase deploy` or `firebase projects:create` was run; all validation used the pre-existing, already-configured Emulator Suite.

## 10. Risks

- **No live `europe-west1` project exists** — App Check cannot be validated against a real reCAPTCHA site key, and the "isolated projects and data" requirement (`FR-OPS-001`) is only satisfied at the code level, not yet operationally. This is a disclosed, expected gap (§1), not a defect — closing it requires a Founder-authorized project-creation step outside this work package's and this agent's authority.
- **Existing `.env.local`** targets a project in `nam5`/`us-east1`, not `europe-west1`. **Correction (2026-07-21, closure task):** the claim originally here — that running `pnpm dev` without `VITE_USE_FIREBASE_EMULATOR=true` would connect to the wrong-region project — was overstated and not independently verified at the time it was written. The Independent Technical Review (2026-07-20, §7) tested this directly: `pnpm --filter web dev` runs with cwd set to `apps/web/`, and Vite's env-loading directory defaults to that same cwd (no `envDir` override exists) — the root-level `.env.local` is not loaded at all under the ordinary invocation path (empirically confirmed via Vite's own `loadEnv()` utility, and consistent with the ENG-P0-001 Technical Review's own prior finding that "Vite's env loading is scoped to `apps/web/`... the root-level `.env.local` is outside that search path entirely"). The actual failure mode is a loud, immediate `loadEnv()` throw ("Missing required environment variables...") when `apps/web/.env.local` is absent, not a silent wrong-region connection — safer than originally disclosed. This is an existing, pre-`.env.local` condition this task did not create; no code change was required to correct it, only this report's own claim.
- **Bundle size warning** (`apps/web` build: 779.69 kB / 237.28 kB gzip, over the 500 kB default Vite warning threshold) — caused by adding the `firebase` package; a non-blocking, informational build warning, not a failure. Left as-is: code-splitting the Firebase SDK is a legitimate future optimization but is out of ENG-P1-001's minimal-infrastructure scope and was not requested.
- **Repository and Folder Standard §3 itself remains stale** (still describes a pre-ENG-P0-001 placeholder framing, not the actual `apps/web`+`functions` workspace split) — a pre-existing documentation gap, not introduced or worsened by this task, and explicitly out of scope to fix here.
- **No technical debt was knowingly introduced.** The one item deferred (live project/deployment) is a governance boundary, not a shortcut.

## 11. Rollback

Every file this work package created or modified, individually:

- **Delete** `apps/web/src/config/env.ts`, `env.test.ts`, `apps/web/src/vite-env.d.ts`.
- **Delete** the entire `apps/web/src/infrastructure/` directory (`app.ts`/`.test.ts`, `auth.ts`/`.test.ts`, `firestore.ts`/`.test.ts`, `storage.ts`/`.test.ts`, `appCheck.ts`/`.test.ts`, `index.ts`/`.test.ts`).
- **Delete** the entire `functions/src/config/` directory (`region.ts`, `region.test.ts`) and `functions/src/infrastructure/` directory (`admin.ts`, `admin.test.ts`).
- **Delete** `.env.example`.
- **Revert** `apps/web/src/main.tsx` — remove the `getAppEnv`/`initializeFirebasePlatform` imports and the `initializeFirebasePlatform(getAppEnv());` call.
- **Revert** `functions/src/index.ts` — remove the `PLATFORM_REGION`/`getAdminApp` imports and the `getAdminApp();` call; change `setGlobalOptions({ region: PLATFORM_REGION, maxInstances: 10 })` back to `setGlobalOptions({ maxInstances: 10 })`; restore the original header comment.
- **Revert** `functions/src/index.test.ts` — remove the `FunctionWithEndpoint` interface and the region-assertion test.
- **Revert** `apps/web/package.json` — remove the `firebase` dependency; run `pnpm install` to regenerate `pnpm-lock.yaml` back to its prior state.
- **Delete** this report (`docs/05-implementation/reports/ENG-P1-001-implementation-report-2026-07-20.md`).
- **Revert** the tracking-document edits in §14 below.

Nothing in this work package has been committed or pushed (per this session's standing rule — no commit was instructed for this task), so rollback today is simply discarding the working-tree changes above; there is no shared-history revert to perform.

## 12. Technical Review Checklist (Self-Review)

- **Architecture compliance** — matches the Repository and Folder Standard's `config`/`infrastructure` split exactly; no alternative pattern introduced; single composition root per workspace (`initializeFirebasePlatform`, `getAdminApp`). ✅
- **Code quality** — strict TypeScript throughout, zero `any`, zero suppressions, zero unused locals/params (enforced by `tsconfig` flags, not just convention). ✅
- **Consistency** — the three emulator-connecting client wrappers (`auth`/`firestore`/`storage`) share the exact same idempotency pattern (`WeakSet<FirebaseApp>` guard) rather than three different approaches. ✅
- **Unnecessary complexity** — no abstraction exists beyond what a test requires; `getFirebaseApp`'s `name` parameter is the only "extra" surface and is test-driven, not speculative. ✅
- **Naming** — kebab-case folders, camelCase files, `get*`/`initialize*` verb prefixes used consistently by return-type semantics (`get*` reuses/retrieves, `initialize*` performs first-time setup with side effects). ✅
- **Security** — no secret value in any committed file; `.env.example` is names-only; Admin SDK credential resolution is fully implicit (Cloud Functions runtime / emulator env vars), never hardcoded. ✅
- **Configuration** — one defect found and fixed (§11 above / this section's own finding, see the defect note below): `parseBoolean` originally silently coerced any non-`"true"` value (e.g. a typo like `"yes"`) to `false` instead of erroring. **Corrected** via TDD: added a failing test (`"throws on an invalid VITE_USE_FIREBASE_EMULATOR value..."`), confirmed RED, then changed `parseBoolean` to throw `Invalid VITE_USE_FIREBASE_EMULATOR value: "<value>" (expected "true" or "false")` for any defined value that isn't exactly `"true"` or `"false"`; confirmed GREEN (8/8 `env.test.ts` tests passing); re-ran the full suite (32/32) and `pnpm format`/`format:check` (prettier auto-reformatted the two touched files; re-verified behavior unchanged) — no regression.
- **Documentation** — every new file carries a doc comment stating why (not what); this report itself is the required permanent record.
- **Acceptance criteria** — verified individually in §8 above, not asserted in bulk.

No further defects were found across the full second read-through of every file in this work package (`env.ts`, `app.ts`, `auth.ts`, `firestore.ts`, `storage.ts`, `appCheck.ts`, both `infrastructure/firebase/index.ts` composition roots, `functions/src/index.ts`, `region.ts`, `admin.ts`, `main.tsx`, `.env.example`).

## 13. Status

**Implemented, locally and emulator-validated. Not committed, not pushed** (no commit was instructed for this task — consistent with this session's standing rule). **Not marked Complete** — per the [Definition of Done](../../06-engineering-governance/definition-of-done.md) §2, items 6–10 (Technical Review Approved, committed and pushed, Founder pulled/verified/deployed, Preview Review, Manual Testing) are Founder/Technical-Lead-owned steps this report cannot self-certify. This report submits the work for Technical Review.

## 14. Tracking Documents Updated

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — `ENG-P1-001` row: `Status` → **Under Review**; `Implementation Report` column links to this report; `Blocking Reason` cleared to reflect submission; Phase 1 `Current Status` narrative updated.
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — `ENG-P1-001` row: `Status` → **Under Review**; Implementation Report link added; §5 distribution counts updated (Ready 0, Under Review 1); §5 narrative note extended.
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — new entry appended (see below).
