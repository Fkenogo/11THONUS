> **Title:** ENG-P1-003-IMP-03 — Frontend Diagnostics Provider Adapter — Implementation Report
> **Status:** Implemented, test-first (TDD). `ENG-P1-003` row remains `In Progress` — not `Complete`. PR unmerged, pending separate Founder/Technical Lead review. Stage 4 (`ENG-P1-003-IMP-04`) not begun.
> **Date:** 2026-07-27
> **Classification:** Target-only addition to existing observability module — one new provider adapter, one new provider-selection module, one minimum-necessary correction to already-merged Stage 1/CR1 code (a disclosed defect this stage's own end-to-end testing surfaced).

# ENG-P1-003-IMP-03 — Frontend Diagnostics Provider Adapter — Implementation Report

## 1. Executive Summary

Executed Stage 3 of "TASK — ENG-P1-003-EXECUTION-LOOP: Stages 2–4" — **Frontend Diagnostics Provider Adapter**. PR #20 (Stage 2) was merged on explicit Founder authorization and post-merge CI verified green before any Stage 3 file was written. Implemented a Sentry-backed `DiagnosticsProvider` adapter (`sentryProvider.ts`) behind the existing provider-neutral contract, added the single minimum official SDK dependency (`@sentry/react@10.68.0`), and wired deterministic, disabled-by-default provider selection (`providerSelection.ts`) into the composition root. Every one of Sentry's own default automatic integrations is explicitly disabled (`integrations: []`) — no console/DOM/XHR/fetch/history breadcrumbs, no automatic `window.onerror`/`unhandledrejection` capture (which would otherwise duplicate Stage 2's own handlers), no session tracking, no tracing, no replay, no profiling, no feedback widget — Sentry receives only what the already-sanitizing `observabilityService` explicitly forwards. 42 new tests, all test-first (TDD, RED confirmed before each GREEN); the full `apps/web` suite grew from 144 to 186 passing tests with zero regression. No Sentry account, organization, or project was created; no real DSN or credential exists anywhere in the change; the application runs correctly with the no-op provider and zero environment configuration, exactly as before. **One disclosed finding:** this stage's own end-to-end privacy/correlation testing surfaced a real, previously-undetected defect in already-merged Stage 1/CR1 code — a `crypto.randomUUID()`-shaped correlation ID could be silently redacted by the generic sanitizer, contradicting that code's own documented guarantee — fixed under this stage with a minimal, disclosed, test-first correction (§8, §16, §27).

## 2. Entry-Condition Verification

1. PR #20 approved by explicit Founder decision ("Founder decision — Approve PR #20") and merged — merge commit `56b828bdffdf5de5d98c46c1a2c4bb5f3ea757d0`.
2. `origin/main` fetched; HEAD confirmed to equal the merge commit exactly (`c0e3954..56b828b main -> origin/main`).
3. Post-merge CI verified green on that exact commit — GitHub Actions run `30259380736`, `conclusion: success`.
4. Fresh worktree created from `origin/main` at the merged commit (detached HEAD `56b828b`); `pnpm install --frozen-lockfile` completed cleanly; `git status --short` confirmed clean before any edit.
5. Stage 2 pieces confirmed present **by direct inspection of the merged repository**, not the earlier report: `apps/web/src/observability/` contains `ErrorBoundary.tsx`, `globalErrorHandlers.ts`, `authLifecycle.ts`, `connectivityBreadcrumbs.ts`, `RouteTracker.tsx`, `correlationContext.ts` (with `beginWorkflow`/`endWorkflow`); `main.tsx` wires all of them plus `getObservability()`/`ObservabilityErrorBoundary`/`RouteTracker` into the render tree exactly as Stage 2 described.
6. Full `apps/web` suite run against the merged commit before any Stage 3 edit: 144/144 passing (matches the Stage 2 report's own final count).

No entry condition failed; no stop condition was triggered.

## 3. PR #20 Merge Commit and Post-Merge CI Evidence

- **Merge commit:** `56b828bdffdf5de5d98c46c1a2c4bb5f3ea757d0`
- **`origin/main` HEAD (fetched fresh):** `56b828bdffdf5de5d98c46c1a2c4bb5f3ea757d0` — identical, zero divergence.
- **Post-merge CI:** GitHub Actions run `30259380736` on that exact SHA — `status: completed`, `conclusion: success`.
- **Local worktree:** created from `origin/main` at this commit; `git status --short` clean before the first edit.

## 4. Starting Repository State

`apps/web/src/observability/` (22 files) — the full Stage 1/CR1/Stage 2 foundation: provider-neutral contract (`types.ts`), sanitization boundary (`sanitize.ts`, `sanitizeException.ts`), configuration (`config.ts`, `"noop"`-only), no-op provider, the application-facing service, correlation lifecycle, error-boundary integration, global/connectivity/route handlers, and the `index.ts` composition-root barrel. `main.tsx` already consumed all of it via `getObservability()`, still backed unconditionally by `createNoopProvider()`. No `@sentry/*` dependency existed; `apps/web/package.json`/`pnpm-lock.yaml` contained no Sentry reference.

## 5. Pre-Edit Codebase Analysis

Performed and stated in full in chat before any file was written — reproduced here for the record. Reviewed directly from the live, merged repository (not assumed from this task's own prompt text):

1. **`DiagnosticsProvider` interface** (`types.ts`) — 8 methods: `captureException`, `captureMessage`, `addBreadcrumb`, `setContext`, `clearContext`, `setUserContext`, `flush`, `isEnabled`. `error` is documented as always a `SanitizedException`, never a raw thrown value.
2. **`observabilityService.ts`** — the sole caller of any provider method; sanitizes every channel before delegating; `isActive() = config.enabled && provider.isEnabled()` gates every call; every provider call wrapped in try/catch.
3. **Sanitization boundary** (`sanitize.ts`, `sanitizeException.ts`) — closed-list key/value redaction, recursive, depth/cycle-bounded, plus free-text substring scanning. The authoritative privacy layer — never to be duplicated or weakened by the adapter, only defended-in-depth on top of.
4. **Activation/configuration** (`config.ts`) — pure function over an explicit `EnvSource`; `ObservabilityProviderId` was `"noop"`-only; unrecognized identifiers fail safe to disabled+noop.
5. **No-op provider** (`noopProvider.ts`) — every method a no-op; `isEnabled()` always `false`; untouched by this stage, remains the default.
6. **Composition root / provider selection point** (`index.ts`'s `getObservability()`) — the one place needing a real code change: constructed `createNoopProvider()` unconditionally.
7. **Env-var conventions** (`.env.example`, `config/env.ts`) — `VITE_<DOMAIN>_<FIELD>` uppercase-snake; `VITE_OBSERVABILITY_*` prefix already established for this concern.
8. **Test/mocking pattern** — `authLifecycle.test.ts`'s `vi.mock("firebase/auth", () => ({...}))` set the precedent for mocking a third-party SDK boundary; the same pattern was used for `@sentry/react`.
9. **Build/deploy config** (`vite.config.ts`) — standard Vite + `@vitejs/plugin-react`; no source-map-upload plugin present.
10. **Provider-import restriction** — convention/doc-comment only ("nothing outside `observability/` may import a provider SDK directly" — `types.ts`), not machine-enforced before this stage.

No conflict was found between the live repository and the approved architecture; implementation proceeded as analyzed.

## 6. Implementation Strategy

New `sentryProvider.ts` (the adapter) and `providerSelection.ts` (deterministic, unit-testable provider selection, kept separate from the `import.meta.env`-reading singleton so activation logic is testable without touching Vite's build-time env substitution). `config.ts` extended minimally (`"sentry"` provider identifier, optional `dsn` field). `index.ts`'s `getObservability()` updated to call `selectProvider(config)` instead of hardcoding the no-op provider. Test-first throughout — every behavior preceded by a failing test, confirmed to fail for the expected reason, then implemented to green.

## 7. SDK/Package Selection Rationale

**Selected:** `@sentry/react@10.68.0` (published, verified via `npm view`). **React/Vite versions confirmed first:** React `^19.2.7`, Vite `^8.1.1`. `@sentry/react`'s own `peerDependencies` declare `react: '^16.14.0 || 17.x || 18.x || 19.x'` — compatible. Its own `dependencies` are `@sentry/core`, `@sentry/browser`, `@sentry/conventions` — **all browser-only**, nothing Node/backend-focused, confirmed by `npm view @sentry/react dependencies` and by a repository-wide lockfile scan for `node|nextjs|profiling|cli|wizard` Sentry packages (empty result). This single package is sufficient: it is the official React SDK, includes browser support transitively (no separate `@sentry/browser` direct dependency needed), and requires no backend/Node Sentry package for a frontend-only integration. `functions/package.json` was not touched — confirmed by an empty `git diff origin/main -- functions/package.json`.

**Disclosed transitive-package note:** `@sentry/react` also pulls in `@sentry/replay`, `@sentry/replay-canvas`, and `@sentry/feedback` as transitive dependencies of `@sentry/browser` — this is unavoidable, since that is how Sentry has packaged the official SDK since v8 (replay/feedback code ships inside the package whether or not an application uses it). None of that code is ever invoked: no `replayIntegration()`, `feedbackIntegration()`, or any tracing/profiling integration is added anywhere in `sentryProvider.ts` (verified by direct code review and by the `integrations: []` configuration itself, which admits no integration at all).

## 8. Files Created (7)

- `apps/web/src/observability/sentryProvider.ts` (+ test) — the adapter.
- `apps/web/src/observability/providerSelection.ts` (+ test) — deterministic activation gate.
- `apps/web/src/observability/sentryPrivacy.test.ts` — end-to-end privacy verification through the real service.
- `apps/web/src/observability/sentryNetworkSafety.test.ts` — explicit no-real-network-call guard.
- `apps/web/src/observability/sentryIntegrationBoundaries.test.ts` — cross-stage composition (correlation lifecycle, `ObservabilityErrorBoundary`) with the Sentry adapter.
- `docs/05-implementation/reports/ENG-P1-003-IMP-03-implementation-report-2026-07-27.md` (this report).

## 9. Files Modified (9, plus the lockfile)

- `apps/web/package.json` — one new dependency line (`@sentry/react`).
- `pnpm-lock.yaml` — the resulting dependency tree.
- `apps/web/src/observability/config.ts` — `ObservabilityProviderId` extended to `"noop" | "sentry"`; optional `dsn` field added; `KNOWN_PROVIDERS` extended.
- `apps/web/src/observability/config.test.ts` — 3 new tests; 2 existing tests' example values updated (§27, disclosed).
- `apps/web/src/observability/index.ts` — `getObservability()` now calls `selectProvider(config)`; barrel export added.
- `apps/web/src/observability/sanitize.ts` — closed key-substring list extended with `loyalty`, `qrcode`, `customername` (§27).
- `apps/web/src/observability/sanitize.test.ts` — 1 new test for the above.
- `apps/web/src/observability/observabilityService.ts` — **defect fix**: `sanitizedContext()` reordered to sanitize the caller's context before merging in the correlation id, not after (§27 — the disclosed finding).
- `apps/web/src/observability/observabilityService.test.ts` — 1 new test proving the fix.
- `apps/web/.env.example` — `VITE_OBSERVABILITY_DSN` placeholder added; provider comment updated.
- `eslint.config.js` — `no-restricted-imports` rule scoping `@sentry/react` to `sentryProvider.ts` and its own tests only.

## 10. Code-Diff Summary

`git diff origin/main --stat`: 11 files changed (excluding the 7 new files, which `git diff --stat` does not list for untracked paths), 249 insertions, 29 deletions, plus the 7 new files. Net effect: one new provider adapter, one new selection module, minimal targeted extensions to `config.ts`/`sanitize.ts`, one correctness fix to `observabilityService.ts`, one new ESLint rule, one new dependency, zero application-feature files touched, zero backend files touched, zero Firestore Rules changes (`git diff origin/main --stat -- '**/firestore.rules' '**/*.rules'` is empty).

## 11. Provider-Contract Mapping

| `DiagnosticsProvider` method | Sentry mapping |
|---|---|
| `captureException(error, context)` | Reconstructs a plain `Error` from the already-sanitized `SanitizedException` (`name`/`message`/`stack`) — never the original thrown value, which this file never sees — and calls `Sentry.captureException(reportable, { extra: context })`. Defensively falls back to `new Error(String(error))` if `error` doesn't structurally match `SanitizedException` (never throws). |
| `captureMessage(message, context)` | `Sentry.captureMessage(message, { extra: context })` |
| `addBreadcrumb(breadcrumb)` | `Sentry.addBreadcrumb({ message, category, data, timestamp })`, converting an ISO timestamp string to Sentry's expected Unix-seconds number |
| `setContext(key, context)` | `Sentry.setContext(key, context)` |
| `clearContext(key)` | `Sentry.setContext(key, null)` |
| `setUserContext(context)` | `Sentry.setUser({ id: context.actorId, ...context })`, or `Sentry.setUser(null)` when `context` is `undefined` |
| `flush()` | `await Sentry.flush(2000)` |
| `isEnabled()` | Reflects whether `Sentry.init()` actually succeeded (module-level `initialized` flag), not merely whether it was attempted |

Every method wraps its Sentry call in try/catch — a provider failure can never propagate into the application (Blueprint §11).

## 12. Provider-Selection Logic

`providerSelection.ts`'s `selectProvider(config)`:

```text
!config.enabled || config.provider !== "sentry" || !config.dsn
    → createNoopProvider()

config.enabled && config.provider === "sentry" && config.dsn (non-empty)
    → createSentryProvider({ dsn, environment, release })
        (wrapped in try/catch — construction failure also falls back to createNoopProvider())
```

Kept as its own pure function, separate from `getObservability()`'s `import.meta.env`-reading singleton, specifically so this exact decision table is unit-testable (6 tests) without touching Vite's build-time env substitution.

## 13. Activation/Configuration Behaviour

Requires **all three**, simultaneously: `VITE_OBSERVABILITY_ENABLED=true`, `VITE_OBSERVABILITY_PROVIDER=sentry`, and a non-empty `VITE_OBSERVABILITY_DSN`. Missing any one silently and safely falls back to the no-op provider — never a thrown error, never a partially-active Sentry instance. With no environment variables set at all (the shipped default, and every existing `.env.local`), the application behaves exactly as before this stage: no-op provider, zero network activity, zero Sentry code path exercised beyond module import.

## 14. Automatic SDK Integrations Enabled

**None.** `Sentry.init()` is called with `integrations: []` — an explicit empty array, not an omitted option (which would fall back to Sentry's own defaults).

## 15. Automatic SDK Integrations Disabled

Every one of Sentry's own default browser integrations, confirmed by name via direct inspection of the installed `@sentry/browser@10.68.0` package's own type declarations (`exports.d.ts`), not from memory: `breadcrumbsIntegration` (automatic console/DOM click/XHR/fetch/history breadcrumbs), `globalHandlersIntegration` (automatic `window.onerror`/`onunhandledrejection` capture — would otherwise duplicate Stage 2's own `globalErrorHandlers.ts`), `httpContextIntegration`, `linkedErrorsIntegration`, `browserApiErrorsIntegration`, `browserSessionIntegration` (automatic session tracking), and `dedupeIntegration`. No tracing integration is added and no `tracesSampleRate` is set (no performance monitoring). No replay integration (`replayIntegration`) is added despite `@sentry/replay` being present as a transitive package dependency (§7). No profiling integration is added. No feedback integration is added. `sendDefaultPii: false` is set explicitly. `beforeSend`/`beforeBreadcrumb` are wired as a pass-through defense-in-depth hook, not a substitute for the application's own sanitization boundary.

## 16. Privacy Assessment

The Stage 1 invariant — "no uncontrolled application diagnostic value crosses into a provider without sanitization or an explicit approved allow-list rule" — is unmodified and still authoritative; the adapter adds no new bypass. Verified with 8 dedicated end-to-end tests (`sentryPrivacy.test.ts`) exercising the *real* `observabilityService` + *real* `createSentryProvider` (only the `@sentry/react` module mocked): a raw phone number, a raw email address, a raw loyalty number, an authorization-token-bearing query string, a raw exception custom property containing a session cookie, and a disallowed identity field (`customerName`) are each confirmed absent from what the SDK mock actually receives — not merely absent from an intermediate sanitized object. Two prohibited-category keys the task explicitly names — `loyalty` and `qrcode` (plus `customername`) — were **not** previously covered by the closed key-substring list and have been added (§27, a minimal, disclosed, demonstrably-necessary extension of Stage 1/CR1's own closed list, not a redesign). Screenshots, DOM recordings, and session replay data are structurally impossible to capture — no replay integration exists in the adapter at all. Local-storage/session-storage content, raw component props, and raw Redux/global state are never read by anything in `observability/` — there is no code path through which they could reach a provider.

## 17. Security Assessment

No credential of any kind exists in the change — confirmed by a dedicated scan (§18/§19 in Validation Results, and §25 below). The provider-neutral architecture boundary is now machine-enforced (§10 pre-edit analysis finding, closed this stage): a new ESLint `no-restricted-imports` rule confines `@sentry/react` imports to `sentryProvider.ts` and its own test files, verified both by a clean repo-wide `eslint` run and by a deliberate violation check (a scratch file importing `@sentry/react` elsewhere correctly triggered the rule, then was deleted). Sentry initialization failure is contained (try/catch around `Sentry.init()`; `isEnabled()` correctly reflects the failure) and never blocks application startup. Every adapter method independently wraps its own Sentry call in try/catch — a provider failure is contained at the adapter itself, not only relying on the outer service-layer guard.

## 18. Network-Safety Assessment

Every test that exercises `createSentryProvider` mocks the entire `@sentry/react` module (`vi.mock("@sentry/react", ...)`) — the real SDK, and therefore its real transport, is never loaded during any test run. This is not merely assumed: a dedicated guard (`sentryNetworkSafety.test.ts`, 2 tests) spies on `globalThis.fetch` across the adapter's full method surface (`init` through `flush`, including a realistic-looking DSN) and asserts it is never called. No test uses a real DSN. No Sentry account was created, requested, or referenced with real credentials anywhere.

## 19. Tests Added or Changed

**42 new tests** across 8 files: `sentryProvider.test.ts` (18 — SDK init options, StrictMode-safe single-init, all 7 method mappings, resilience), `providerSelection.test.ts` (6 — every branch of the activation decision table), `sentryPrivacy.test.ts` (8 — end-to-end PII exclusion), `sentryNetworkSafety.test.ts` (2), `sentryIntegrationBoundaries.test.ts` (3 — correlation-ID mapping, correlation clearing, Stage 2 `ObservabilityErrorBoundary` composition), `config.test.ts` (+3), `sanitize.test.ts` (+1), `observabilityService.test.ts` (+1, the defect-fix proof). Full `apps/web` suite: **186/186 passing** (was 144/144 at Stage 2 baseline) — zero regression, zero skipped.

## 20. RED/GREEN Evidence

Every new behavior was preceded by a failing test, confirmed to fail for the expected reason (missing module, wrong value, or — for the disclosed defect — the actual bug reproduced with a real assertion failure showing `'[REDACTED]'` where a UUID was expected), then implemented to green:

- `sentryProvider.ts`: RED — `Failed to resolve import "./sentryProvider"`; GREEN — 18/18 on first implementation attempt.
- `config.ts` extension: RED — `expected 'noop' to be 'sentry'` / `expected undefined to be 'https://...'`; GREEN — 14/14.
- `providerSelection.ts`: RED — `Failed to resolve import "./providerSelection"`; GREEN — 6/6.
- `sanitize.ts` closed-list extension: RED — `expected '1234567890123456' to be '[REDACTED]'`; GREEN — 20/20.
- **The disclosed `observabilityService.ts` fix**: RED — `expected '[REDACTED]' to be '31199c39-3024-4062-9340-c787edb83bf5'` (a real bug, reproduced deterministically); GREEN — 26/26, zero regression on the other 25 tests in that file.

## 21. Commands Executed

Merged PR #20 (`gh pr merge 20 --merge`), fetched `origin/main`, removed the stale Stage 2 worktree and created a fresh one at the merge commit, `pnpm install --frozen-lockfile`; `npm view @sentry/react version/peerDependencies/dependencies` (SDK research); `pnpm --filter web add @sentry/react@^10.68.0`; direct inspection of the installed package's own `.d.ts` files for the real `BrowserOptions`/export surface (not assumed from memory); repeated `pnpm --filter web exec vitest run <file>` (RED then GREEN per TDD cycle); `pnpm --filter web exec vitest run` (full suite, multiple times); `pnpm --filter web exec tsc --noEmit -p tsconfig.app.json`; `pnpm exec eslint .`; `pnpm exec prettier --check`/`--write`; `pnpm --filter web run build`; `pnpm --filter functions exec vitest run`; dependency-diff, DSN/token/credential, provider-import-boundary, network-call, and Firestore-Rules scans; a deliberate ESLint-rule violation check; `git diff --check`; `git status`.

## 22. Validation Results

| Check | Result |
|---|---|
| Focused Sentry/observability tests | 97/97 passed (8 files: sentryProvider, providerSelection, sentryPrivacy, sentryNetworkSafety, sentryIntegrationBoundaries, config, sanitize, observabilityService) |
| Full `apps/web` test suite | 186/186 passed (was 144/144 pre-Stage-3) |
| `apps/web` typecheck (`tsc --noEmit`) | Clean — including against the real installed `@sentry/react`/`@sentry/browser` type declarations |
| Repository-wide `eslint` | Clean |
| Formatting (`prettier --check`) | Clean after one `--write` pass (line-wrap only) |
| `apps/web` build (`tsc -b && vite build`) | Clean (bundle grew ~87KB gzipped from the new dependency — expected, generic chunk-size advisory only) |
| `functions` tests | 92/92 passed, unaffected |
| Dependency diff (`package.json`/`pnpm-lock.yaml` vs `origin/main`) | Exactly one new direct dependency (`@sentry/react`); its own transitive deps confirmed browser-only |
| No real DSN committed | Confirmed — scan found only test/placeholder DSN strings |
| No Sentry auth token committed | Confirmed — empty scan |
| No Sentry configuration in backend code | Confirmed — `functions/` byte-identical to `origin/main` |
| No application feature component imports `@sentry/react` outside the adapter | Confirmed — both by manual grep and by the new ESLint rule (verified to actually fire on a deliberate violation) |
| No source-map-upload integration | Confirmed — empty scan for `sentry-cli`/`@sentry/vite-plugin`/`@sentry/webpack-plugin` |
| Firestore Rules diff | Empty |
| `git diff --check` | Clean |
| Repository-status verification | Exactly the files listed in §8/§9 changed; `functions/`, Decision Register, Master Workflow unaffected |

## 23. Dependencies Added

One: `@sentry/react@^10.68.0` (direct, `apps/web/package.json`). Transitively resolves `@sentry/core`, `@sentry/browser`, `@sentry/browser-utils`, `@sentry/conventions`, `@sentry/feedback`, `@sentry/replay`, `@sentry/replay-canvas` — all browser-only packages, none invoked (§7, §15).

## 24. Configuration Changes

`apps/web/.env.example`: one new placeholder line, `VITE_OBSERVABILITY_DSN=` (blank), plus updated comments documenting the three-condition activation gate. No new secret, no real DSN, no auth token. Default behavior unchanged with the file left exactly as committed.

## 25. Credential and Secret Inspection

No credential, API key, auth token, or real DSN exists anywhere in the diff. The one DSN-shaped string in the entire change is `https://example.test/1` (and one syntactically-DSN-shaped-but-fake test value), used only inside test files against a fully mocked SDK. `apps/web/.env.example` ships with `VITE_OBSERVABILITY_DSN=` blank, per the task's explicit instruction not to include a real DSN.

## 26. Provider-Import Boundary Inspection

Repository-wide `grep -rln "@sentry" apps/web/src` returns exactly two categories of file: `sentryProvider.ts` itself, and its own test files (`sentryProvider.test.ts`, `providerSelection.test.ts`, `sentryPrivacy.test.ts`, `sentryNetworkSafety.test.ts`, `sentryIntegrationBoundaries.test.ts` — each of which mocks the module rather than using it live). No route, component, hook, or business-logic file imports `@sentry/react`. This is now enforced by ESLint, not only by convention (§10, §17).

## 27. Deviations from the Approved Plan

**One disclosed deviation, a defect fix, not a redesign.** While writing the correlation-ID end-to-end integration test (§19, `sentryIntegrationBoundaries.test.ts`), a real `crypto.randomUUID()`-shaped value was used (matching how `beginWorkflow()` actually generates correlation IDs in production) rather than a short placeholder string. This exposed a genuine, previously-undetected defect in already-merged Stage 1/CR1 code: `observabilityService.ts`'s `sanitizedContext()` merged the correlation id into the context object *before* calling `sanitize()`, and `sanitize()`'s generic long-token value-pattern (`/^[A-Za-z0-9+/=_-]{20,}$/`, intentionally broad to favor over-redaction) matches any 36-character UUID — silently redacting the correlation id on every real capture, directly contradicting that same file's own documented guarantee ("`correlationId` is... treated as an approved identifier rather than arbitrary content requiring redaction"). This went undetected through Stage 1, CR1, and Stage 2 because every prior test used a short placeholder id (e.g. `"corr-123"`, 8 characters, well under the pattern's 20-character threshold) and the no-op provider discarded whatever it received regardless. **Root cause:** merge-then-sanitize order. **Fix:** reordered to sanitize-then-merge — the caller's `context` is sanitized first, then the trusted correlation id is merged in afterward, never itself subjected to the generic pattern check. This is a minimal, backward-compatible correction (no signature change, no new field, no behavior change for any non-UUID-shaped correlation id) to a shared module Stage 3 does not otherwise own, made because it is demonstrably necessary for this stage's own explicit correlation-mapping requirement to be true rather than merely appear true. TDD discipline was followed exactly: RED reproduced with a real assertion failure before any fix code was written (§20).

No other deviation from the approved plan.

## 28. Risks

None introduced beyond what Stage 1/CR1/Stage 2 already disclosed. The disclosed correlation-id fix (§27) reduces risk (a documented guarantee that was silently false is now actually true) rather than introducing any. The Sentry adapter itself adds no risk while disabled by default (the shipped state): zero network activity, zero new attack surface exercised, `functions/` and all backend systems entirely untouched.

## 29. Deferred Work

Everything outside this stage's explicit scope, unchanged from the governing task: backend/Cloud Logging/Cloud Monitoring observability architecture; Firestore Rules; business features, loyalty workflows, product UX; analytics, session replay, performance monitoring, distributed tracing; frontend-to-backend correlation propagation (still blocked on the not-yet-built API/network layer, per Stage 2's own disclosure — unchanged by this stage); source-map upload; production deployment; Stage 4 readiness conclusions; the known `BaseMetadata`/TRD10 §10.5 conflict (untouched).

## 30. Required External Founder Actions

None performed by this stage, and none required for it to be reviewed: creating a Sentry organization; creating a Sentry project; inviting users to Sentry; accepting Sentry's terms; selecting a paid plan; generating or copying a real DSN; adding a real DSN to any environment (including `.env.local` — still gitignored, still empty by default); adding a Sentry auth token; configuring source-map upload; transmitting any real project data to Sentry; enabling production diagnostics; changing production privacy disclosures; deploying to production. All of these remain exactly as deferred as before this stage — this stage's entire scope is code-level adapter implementation, disabled by default.

## 31. Rollback Instructions

`git revert` of this stage's own commit(s) on its dedicated branch restores the Stage 2 state exactly for every file except `observabilityService.ts`, whose fix (§27) is independently correct and would be worth keeping even if the rest of the stage were reverted — but a full revert is safe and complete: every other change is additive (new files) or narrowly scoped (`config.ts`/`index.ts`/`sanitize.ts` extensions, one ESLint rule, one dependency), and no existing Stage 1/Stage 2 file's prior *behavior* (for any input already exercised by a pre-existing test) was altered except the one disclosed fix.

## 32. Final Repository State

`main` unaffected — all Stage 3 work happens on a new dedicated branch, not `main`, per the task's PR-per-stage requirement. `origin/main` remains at the Stage 2 merge commit (`56b828bdffdf5de5d98c46c1a2c4bb5f3ea757d0`) until a Stage 3 PR is opened, reviewed, and separately Founder-authorized to merge.

## 33. Branch Name

`feat/eng-p1-003-imp-03-sentry-adapter`

## 34. Starting Commit

`56b828bdffdf5de5d98c46c1a2c4bb5f3ea757d0` (the Stage 2 merge commit, `origin/main` HEAD at the time this stage's worktree was created)

## 35. Ending Commit

Recorded in the accompanying chat report at push time (this report is written and committed as part of that same commit sequence — see the PR itself for the exact final SHA).

## 36. PR Number and URL

Recorded in the accompanying chat report immediately after this report is committed and the PR is opened (§38 below covers the CI-verification step that follows).

## 37. PR Head Commit

Recorded in the accompanying chat report — the commit that includes this report and all Stage 3 code.

## 38. CI Status on That Exact Head Commit

Recorded in the accompanying chat report after the PR is opened and its CI run completes — verified against the PR's own `headRefOid`, not an earlier commit, matching this session's established discipline (Stage 2's PR #20 required exactly this same re-verification after a follow-up push).

## 39. Gate Outcome

**PASS — Stage 3 ready for Founder/Technical review.** All required implementation, tests, privacy/security/network-safety verification, documentation, and validation are complete. The one disclosed defect fix (§27) was found, reproduced, fixed, and re-verified under this stage's own TDD discipline before this report was written.

## 40. Exact Next Recommendation

Commit this report and all Stage 3 code to the dedicated branch (§33), push, open a Stage 3 PR against `main`, verify CI on the exact PR head commit, and **stop for Founder/Technical Lead review** — this report does not authorize a merge, and per the governing task, Stage 4 (`ENG-P1-003-IMP-04`, Operational Validation and Readiness) may not begin until this PR is reviewed, approved, merged, and post-merge CI is separately verified.

---

## Explicit Answers (as required by the governing task)

- **Is the adapter implemented?** Yes — `sentryProvider.ts`, all 8 `DiagnosticsProvider` methods, 18 dedicated tests.
- **Is Sentry disabled by default?** Yes — requires `VITE_OBSERVABILITY_ENABLED=true` *and* `VITE_OBSERVABILITY_PROVIDER=sentry` *and* a non-empty `VITE_OBSERVABILITY_DSN`, all three simultaneously; missing any one falls back to the no-op provider.
- **Can the application run entirely with the no-op provider?** Yes — exactly as before this stage, with zero environment configuration.
- **Does any real credential exist?** No.
- **Can any automated test send data externally?** No — every Sentry-adjacent test mocks `@sentry/react` entirely; a dedicated `fetch`-spy guard (`sentryNetworkSafety.test.ts`) confirms zero real network calls across the adapter's full method surface.
- **Does any non-adapter application module import Sentry?** No — confirmed by manual grep and by a new ESLint rule verified to actually fire on a deliberate test violation.
- **Was backend Sentry introduced?** No — `functions/` is byte-identical to `origin/main`.
- **Was source-map upload introduced?** No.
- **Is production activation authorized?** No — this stage authorizes code-level implementation only; every external Founder action (DSN issuance, account creation, production activation) remains explicitly deferred.
- **Has Stage 4 started?** No.
- **Is `ENG-P1-003` still `In Progress`?** Yes — not marked `Complete`.
