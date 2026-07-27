> **Title:** ENG-P1-003-IMP-01 — Observability Foundation — Implementation Report
> **Status:** Implemented, test-first (TDD). `ENG-P1-003` row moved `Ready → In Progress` — not `Complete`. PR unmerged, pending separate Founder/Technical Lead review. **Corrected 2026-07-26 under `ENG-P1-003-IMP-01-CR1` — see §27 below; this notice and §27 are the only edits to this report, §1–26 are unchanged history.**
> **Date:** 2026-07-26 (corrected same day)
> **Classification:** Target-only addition (new module, not previously existing)

# ENG-P1-003-IMP-01 — Observability Foundation — Implementation Report

## 1. Executive Summary

Executed "TASK — ENG-P1-003-IMP-01: Observability Foundation" — the Founder-authorized first bounded implementation stage of `ENG-P1-003`, per the approved [Operational Observability Blueprint](../prompts/ENG-P1-003-engineering-blueprint-2026-07-26.md). PR #18 was merged, post-merge CI verified green, and all 12 entry conditions verified before any file was written. Implemented a provider-independent observability foundation under `apps/web/src/observability/`: a provider-neutral contract, a no-op provider (the only active provider this stage), a sanitization/redaction boundary, environment-aware configuration, a minimal correlation-context carrier, and an error-boundary integration point — all test-first (TDD), 53 new tests, all 18 required test behaviors covered. No Sentry SDK was installed, no account created, no DSN generated, no external network call exists anywhere in the change, and `functions/` (the backend) was not touched. `ENG-P1-003`'s tracker status moved `Ready → In Progress`, exactly the term the Master Workflow §5 vocabulary permits for this situation — not `Complete`.

## 2. Entry-Condition Verification

1. PR #18 merged — commit `eea58dd013340e666dbe7f41c43b65806fbefbe4`.
2. Exact merge commit identified — as above.
3. Post-merge CI green on that exact commit — confirmed, first attempt (run `30202500418`).
4. `origin/main` current — fresh worktree fetched and hard-reset to `origin/main`.
5. Worktree clean — confirmed via `git status --short` before any edit.
6. `DEC-PROV-005` `CONFIRMED` — confirmed directly from the live Decision Register.
7. `ENG-P1-003` `Ready` — confirmed directly from the Coding-Agent Prompt Register.
8. The approved blueprint exists on `main` — confirmed: `docs/05-implementation/prompts/ENG-P1-003-engineering-blueprint-2026-07-26.md`.
9. No implementation of `ENG-P1-003` already begun — confirmed via repository search (no `observability`/`sentry`/`diagnostic` file existed in `apps/web/src` or `functions/src`).
10. No Sentry SDK or competing diagnostics dependency already installed — confirmed via `grep -ri sentry` and `grep -i diagnostic\|observab` across `package.json`/`apps/web/package.json`/`functions/package.json` — all clean.
11. `ENG-P1-002` error/logging/correlation/metadata contracts reviewed directly from the code — `operationalLog.ts`, `platformError.ts`, `errorCategories.ts`, `correlationId.ts` all read fresh from this worktree, not recalled from memory.
12. Implementation scope consistent with the live Programme and blueprint — `ENG-P1-003`'s Programme row ("Security/Storage Rules deny-by-default + monitoring") and the blueprint's own §5/§6 frontend-diagnostics design match this task's required contract exactly.

No entry condition failed; no stop condition was triggered.

## 3. Pre-Edit Codebase Analysis

`apps/web/src` had no error boundary, no diagnostics code, and no precedent module named `observability`/`sentry`. The only established foundational-module precedent is `infrastructure/firebase/` (a composition-root barrel: one factory function per concern, each with a matching `.test.ts`, a top-level `index.ts` barrel) and `config/env.ts` (a pure function over an explicit `EnvSource` object rather than reading `import.meta.env` directly, plus a lazily-cached accessor, `getAppEnv()`). Both patterns were followed exactly for the new module. The backend's `generateCorrelationId()`/`resolveCorrelationId()` (`functions/src/shared/correlation/correlationId.ts`) cannot run in the browser — it depends on `node:crypto` and lives in a separate pnpm workspace package (`functions/`) `apps/web` does not depend on.

## 4. Implementation Strategy

A new `apps/web/src/observability/` module, one file per concern plus a barrel, built test-first through TDD Loops 2–4 exactly as the task specified. Every file was preceded by a failing test, confirmed to fail for the expected reason (import error — module did not yet exist), then implemented to green, per the `superpowers:test-driven-development` skill's Red-Green-Refactor discipline. No file was written before its own test failed first.

## 5. Architecture Implemented

```text
Application code
      ↓
Observability service        (apps/web/src/observability/observabilityService.ts)
      ↓
Provider-neutral interface   (apps/web/src/observability/types.ts)
      ↓
Configured provider          (apps/web/src/observability/config.ts selects "noop" — the only supported value this stage)
      ↓
No-op provider for this stage (apps/web/src/observability/noopProvider.ts)
```

Matches the blueprint's own architecture boundary exactly — no component outside `observability/` imports a provider directly; the service is the only caller of `DiagnosticsProvider` methods.

## 6. Provider-Neutral Contract

`DiagnosticsProvider` (`types.ts`): `captureException`, `captureMessage`, `addBreadcrumb`, `setContext`, `clearContext`, `setUserContext`, `flush`, `isEnabled`. `captureException` returns `void`, deliberately — it never hands back a provider-issued event ID, closing off that exposure by design rather than by convention. No Sentry-specific concept (scope, hub, envelope, DSN) appears anywhere in the type. Verified by a dedicated test asserting the object's own keys never include any of those terms.

## 7. No-Op Provider Behaviour

`createNoopProvider()` (`noopProvider.ts`): every method is a no-op closure; `isEnabled()` returns `false`; `flush()` resolves immediately with no network call. 8 tests confirm it never throws under any input, including a non-`Error` value passed to `captureException`.

## 8. Configuration Model

`loadObservabilityConfig(source, viteEnv)` (`config.ts`), mirroring `env.ts`'s `loadEnv` pattern exactly. Fields: `enabled` (boolean, default `false`), `provider` (`"noop"` — the only supported identifier this stage), `environment` (from Vite's `MODE`), `release` (optional pass-through, undefined unless set — no invented value). An unsupported `VITE_OBSERVABILITY_PROVIDER` value fails safely: forces `enabled: false` and `provider: "noop"` rather than throwing or silently trusting an unrecognized value. No DSN field exists on the type at all. Three new, non-secret, optional `.env.example` placeholders added: `VITE_OBSERVABILITY_ENABLED`, `VITE_OBSERVABILITY_PROVIDER`, `VITE_OBSERVABILITY_RELEASE`.

## 9. Privacy and Redaction Implementation

`sanitize()` (`sanitize.ts`): recursively redacts by key-name substring match (password, token, authorization, cookie, session, apiKey, secret, cardNumber, cvv, cvc, and several personal-data key names — email, phone, address, names, date of birth, national ID, SSN) and by value-shape match (JWT-shaped, long token/credential-shaped strings — independently mirroring `logger.ts`'s own conservative pattern, since this frontend module cannot import the backend's `functions/` package). Bounded to a max depth of 12 and a `WeakSet` cycle guard, so a circular reference or an unusually deep structure returns a redaction marker rather than recursing forever or crashing. Builds a new object/array rather than mutating the caller's input. 10 dedicated tests, plus additional coverage inside `observabilityService.test.ts` proving sanitization is actually applied to context and breadcrumb data before a provider call.

## 10. Correlation Integration

`correlationContext.ts` provides `resolveCorrelationId`/`getCurrentCorrelationId`/`setCorrelationId`/`clearCorrelationId`, mirroring the backend's exact "resolve, never regenerate" semantics for the *frontend's own* browser-originated correlation ID — using the browser's native `crypto.randomUUID()`, since the backend's `generateCorrelationId()` is unreachable here. This is explicitly the minimum context carrier the blueprint's §4/§7 already assigned the frontend, not a second general-purpose ID-generation service, and it never touches `functions/src`. The `observabilityService` attaches the current correlation ID to captured context automatically when available, and handles its absence (no accessor supplied, or an accessor returning `undefined`) without error — both are explicit, separately tested behaviors.

## 11. Error-Boundary Integration Point

`errorBoundaryIntegration.ts`'s `createRenderErrorHandler(service)` returns a `(error, info) => void` callback shaped to match what React's `componentDidCatch`/`onCaughtError` supplies (a nullable `componentStack`), without importing a React type — usable by any future error-boundary implementation. No `<ErrorBoundary>` component, no visible customer-facing error screen, and no Sentry-specific React component were built, per the task's explicit exclusion; this stage prepares only the integration point.

## 12. Files Created

- `apps/web/src/observability/types.ts`
- `apps/web/src/observability/noopProvider.ts` (+ `.test.ts`)
- `apps/web/src/observability/sanitize.ts` (+ `.test.ts`)
- `apps/web/src/observability/config.ts` (+ `.test.ts`)
- `apps/web/src/observability/correlationContext.ts` (+ `.test.ts`)
- `apps/web/src/observability/observabilityService.ts` (+ `.test.ts`)
- `apps/web/src/observability/errorBoundaryIntegration.ts` (+ `.test.ts`)
- `apps/web/src/observability/index.ts` — barrel, plus the `getObservability()` lazy singleton accessor (mirrors `getAppEnv()`; the stable integration point future stages import directly)
- `docs/05-implementation/reports/ENG-P1-003-IMP-01-implementation-report-2026-07-26.md` — this report

## 13. Files Modified

- `apps/web/.env.example` — 3 new optional, non-secret placeholder lines.
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — `ENG-P1-003` row (`Ready → In Progress`), Programme Overview row, Phase 1 narrative, header.
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` — `ENG-P1-003` row (`Ready → In Progress`), §5 distribution, update narrative, header.
- `docs/00-governance/documentation-changes-log.md` — new append-only entry.
- `docs/changes/IMPLEMENTATION_CHANGES.md` — new append-only dated entry.

No other file was touched. `main.tsx`/`App.tsx` were deliberately **not** modified — nothing consumes the observability service yet (no error boundary exists this stage, that is explicitly excluded), so eager wiring would be speculative; `getObservability()` is itself the stable integration point a future stage imports.

## 14. Code Diff Summary

8 new source files + 8 matching test files (one module, `index.ts`, has no separate test file, matching the precedent that `infrastructure/firebase/index.ts`'s own lazy-accessor equivalent, `getAppEnv()`, is untested directly — only the underlying pure functions are). Zero lines changed in any existing `apps/web/src` file. Zero lines changed anywhere in `functions/`.

## 15. Tests Added

53 new tests across 6 test files — `noopProvider.test.ts` (8), `sanitize.test.ts` (10), `config.test.ts` (11), `correlationContext.test.ts` (7), `observabilityService.test.ts` (14), `errorBoundaryIntegration.test.ts` (3). All 18 of this task's required test behaviors are covered (mapped explicitly in §20 below).

## 16. Commands Executed

`gh pr merge 18`, CI verification (`gh run watch`), worktree creation/fast-forward, `pnpm install --frozen-lockfile`, repeated `pnpm --filter web exec vitest run <file>` (RED then GREEN per TDD cycle), `pnpm --filter web typecheck`, `pnpm -w run lint`, `pnpm exec prettier --check`/`--write`, `pnpm --filter web test` (full suite), `pnpm --filter web build`, `pnpm --filter functions test`, `git diff --stat`, targeted `grep` scans (dependency, provider-import, secret-pattern, network-call), `git commit`/`push`, `gh pr create`, `gh pr checks`.

## 17. Dependencies Added

None. `git diff origin/main -- package.json pnpm-lock.yaml apps/web/package.json functions/package.json` is empty.

## 18. Configuration Changes

Three new optional `.env.example` entries (§8) — no production credential, no DSN, no secret.

## 19. Validation Results

| Check | Result |
|---|---|
| New module tests (`apps/web/src/observability`) | 53/53 passed |
| Full `apps/web` test suite | 84/84 passed (53 new + 31 existing, zero regression) |
| `apps/web` typecheck (`tsc -b --noEmit`) | Clean |
| Repository-wide lint (`eslint .`) | Clean |
| Formatting (`prettier --check`) | Clean after `--write` |
| `apps/web` build (`tsc -b && vite build`) | Clean — `dist/` produced, PWA precache generated |
| `functions` unit tests | 92/92 passed, unaffected (`functions/` byte-identical to `origin/main`) |
| Dependency-diff check | Empty — no dependency added anywhere |
| Provider-specific import scan | No `import` of `@sentry/*` or any provider SDK anywhere; all "Sentry" text hits are documentation comments or a test string proving the config *rejects* that value |
| Secret-pattern / DSN scan | Clean |
| External network call scan (`observability/`) | Clean — no `fetch`/`XMLHttpRequest`/`axios`/`http.` |
| `git diff --check` | Clean |
| Repository-status verification | `functions/`, all files outside `apps/web/.env.example` and `apps/web/src/observability/`, and all governance trackers outside the 4 explicitly listed, confirmed unchanged |

## 20. Evidence That No Sentry SDK, DSN, Secret, or External Call Exists

- **No Sentry SDK**: `package.json`/`apps/web/package.json`/`pnpm-lock.yaml` diff against `origin/main` is empty; no `@sentry/*` import exists anywhere in `apps/web/src`.
- **No DSN**: `ObservabilityConfig` (`config.ts`) has no `dsn` field; `.env.example`'s 3 new lines are `ENABLED`/`PROVIDER`/`RELEASE` only, all blank placeholders.
- **No secret**: secret-pattern scan (API-key/token/private-key shapes) across the new module and `.env.example` returned clean.
- **No external call**: `noopProvider.ts`'s `flush()` resolves immediately with no I/O; no `fetch`/`XMLHttpRequest`/`axios`/raw `http` call exists anywhere in `observability/`.
- **18-test required behavior mapping**: (1) no-op never throws → `noopProvider.test.ts`; (2) service never propagates provider failures → `observabilityService.test.ts`; (3) disabled config makes no provider call → same; (4) enabled config delegates correctly → same; (5) exception capture preserves non-sensitive data → same; (6) sensitive keys redacted → `sanitize.test.ts`; (7) nested sensitive fields redacted → same; (8) arrays/nested objects handled → same; (9) circular/deep inputs don't crash → same; (10) original payload not mutated → same; (11) correlation context attached when available → `observabilityService.test.ts`; (12) missing correlation context handled safely → same; (13) context set/cleared → same; (14) breadcrumbs sanitized → same; (15) no Sentry-specific fields → `noopProvider.test.ts`; (16) config defaults to no-op/disabled → `config.test.ts`; (17) unsupported provider fails safely → same; (18) observability failure doesn't alter operation result → `observabilityService.test.ts`.

## 21. Deviations From Blueprint

None identified. One judgment call, disclosed rather than silently made: the frontend correlation-context carrier (§10 above) generates a UUID via `crypto.randomUUID()` rather than importing the backend's generator — a physical necessity (separate workspace, `node:crypto`), explicitly grounded in the blueprint's own §4/§7 text assigning the frontend this exact responsibility, stated to the user in chat before writing any code.

## 22. Risks and Deferred Work

**Risks**: none introduced — the no-op provider performs no I/O, and the service never throws into calling code. **Deferred, explicitly not begun this stage**: `ENG-P1-003`'s Security/Storage Rules deny-by-default scope (unrelated to this observability sub-scope); a real React `<ErrorBoundary>` component; a Sentry adapter implementing `DiagnosticsProvider`; wiring `getObservability()`/the render-error handler into `main.tsx`/`App.tsx`; Sentry account creation, DSN issuance, dependency installation, and production integration (all explicitly excluded by this task's authorization).

## 23. Rollback Instructions

`git revert` of this task's own commit. All new files are additive (a new directory plus 3 new `.env.example` lines); the tracker/log edits are narrow, identifiable, `ENG-P1-003`-specific diffs. No existing application file was modified; no dependency, configuration, or infrastructure change to undo.

## 24. Repository State

`main` unchanged by this task; a dedicated PR is opened and left **unmerged**, pending separate Founder and Technical Lead review, per this task's explicit instruction.

## 25. Pull Request

See the accompanying chat report for the PR number, branch, and head commit — recorded there once the PR is opened (this report is written and committed together with the PR-opening commit).

## 26. Exact Next Recommendation

Not determined by this task. Per the task's own framing, `ENG-P1-003`'s Security/Storage Rules scope and any further observability stage (error boundary, Sentry adapter) each require their own, separately Founder-authorized task — this stage does not trigger either automatically.

---

## 27. Correction — `ENG-P1-003-IMP-01-CR1`: Provider-Boundary Privacy Correction (2026-07-26)

**Status:** Correction complete, applied directly to PR #19's branch (no new branch, no merge). `ENG-P1-003` remains `In Progress`, not `Complete`.

### 27.1 Finding

PR review found a provider-boundary privacy gap: the Stage 1 `observabilityService` sanitized the caller-supplied structured `context` argument, but passed several other diagnostic channels to the provider **unsanitized**: the raw exception/thrown value passed to `captureException`, the raw string passed to `captureMessage`, the raw `breadcrumb.message`/`breadcrumb.category` strings, and the caller's `ObservabilityUserContext` object passed through to `setUserContext` with no runtime allow-list enforcement. A separate configuration-semantics inconsistency was also found: the internal `guarded()` gate checked only `config.enabled`, while `isEnabled()` reported `config.enabled && provider.isEnabled()` — the two could disagree.

### 27.2 Root Cause

The original design sanitized the one channel most obviously "structured" (the `context` object) but did not apply the same discipline to free-text channels (message strings, stack traces, breadcrumb text) or to the exception object itself, and did not enforce `ObservabilityUserContext`'s three-field allow-list at runtime — TypeScript's structural typing strips excess fields only at an object-literal call site, not from a variable, so a caller could smuggle extra fields through at runtime despite the type.

### 27.3 Correction Strategy

Established and applied one invariant across every channel: **no uncontrolled application diagnostic value crosses into a provider without sanitization or an explicit approved allow-list rule.** Implemented via three mechanisms: (a) the existing structured `sanitize()` (key-based + whole-value pattern redaction, unchanged), (b) a new `sanitizeText()` (substring-scanning redaction for free text), and (c) explicit allow-listing for `ObservabilityUserContext`. Unified the configuration-semantics gate so `guarded()`/`flush()` and `isEnabled()` all consult the same `isActive()` predicate.

### 27.4 Files Modified

- `apps/web/src/observability/sanitize.ts` — added `sanitizeText()` (substring-scanning redaction: JWT-shaped, authorization/bearer-prefixed, cookie-prefixed, payment-card-length digit runs, long token/API-key-shaped substrings), documented the distinction from `sanitize()`.
- `apps/web/src/observability/observabilityService.ts` — rewritten to route every channel through sanitization or allow-listing; unified `isActive()`/`guarded()`/`isEnabled()`/`flush()` semantics; added the provider-boundary invariant as a doc comment.
- `apps/web/src/observability/types.ts` — added a contract-clarification JSDoc comment on `DiagnosticsProvider.captureException`.
- `apps/web/src/observability/correlationContext.ts` — added an explicit lifecycle-disposition doc comment (no runtime behavior change).
- `apps/web/src/observability/index.ts` — barrel updated to export `sanitizeText`, `sanitizeException`, `SanitizedException`.
- `apps/web/src/observability/sanitize.test.ts`, `observabilityService.test.ts` — extended with CR1 tests.

### 27.5 Files Created

- `apps/web/src/observability/sanitizeException.ts` (+ `.test.ts`) — new module.

No other file was touched. No dependency added. No Sentry SDK, DSN, or account. `main.tsx`/`App.tsx`, `functions/`, Firestore Rules, and the Decision Register/Master Workflow remain untouched.

### 27.6 Contract Changes

`DiagnosticsProvider.captureException`'s TypeScript signature is unchanged (`error: unknown`) — kept loose deliberately so the interface stays provider-agnostic — but its **documented meaning changed**: the service now always passes a `SanitizedException` (a plain object: `kind`, `name`, `message`, `stack`, `properties`, `cause`), never the raw thrown value. A future provider adapter must expect this shape. This is disclosed explicitly rather than left implicit, per the task's own "Contract changes" reporting requirement.

### 27.7 Exception Sanitization Behaviour

`sanitizeException(error)` (new): for `Error` instances, extracts `name`/`message`/`stack` through `sanitizeText()`, custom own properties (via `Object.getOwnPropertyNames`, catching non-enumerable properties `Object.entries`/spread would miss) through `sanitize()`, and walks `cause` recursively to a depth of 3 (bounded — sufficient to guarantee termination without needing cycle detection on the cause chain specifically, since `sanitize()`'s own `WeakSet` guard already protects any circular custom property). Non-`Error` thrown values are wrapped as `{ kind: "thrown-value", properties: { value: sanitize(thrown) } }`. Nothing is stringified — structure survives; only free text and flagged values are redacted.

### 27.8 Text Sanitization Behaviour

`sanitizeText(text)` (new, in `sanitize.ts`): substring-scanning (not whole-value matching, unlike `sanitize()`), five ordered pattern groups (JWT-shaped, checked first so a JWT redacts as one unit rather than three overlapping fragments; authorization/bearer-prefixed; cookie-prefixed; payment-card-length digit runs; long token/API-key-shaped runs, checked last). **Disclosed limitation:** the long-token pattern can false-positive on non-secret long alphanumeric runs — e.g. a build-hash chunk filename inside a stack trace — an accepted, deliberate tradeoff (redact-first) rather than a defect to narrow away, since narrowing risks under-redacting a real secret of the same shape.

### 27.9 Identity-Context Handling

`setUserContext` now extracts only `actorId`/`businessId`/`customerId` as validated strings into a fresh object via `allowListUserContext()`, never forwarding the caller's object. Approach chosen: strict allow-listing (not field removal), since these three fields are the blueprint-approved, needed identifiers, per repository authority (Blueprint §4, `ObservabilityUserContext`'s own type). A non-string value smuggled under an approved field name (e.g. `actorId: { nested: "object" }`) is dropped, not passed through.

### 27.10 Breadcrumb Handling

`addBreadcrumb` now constructs a fresh breadcrumb object: `message` and `category` through `sanitizeText()`, `data` through `sanitize()` (unchanged), `timestamp` passed through (a system-set value, not free text). No field of the caller's breadcrumb reaches the provider unsanitized.

### 27.11 Correlation-Lifecycle Disposition

Documented, not newly implemented: `correlationContext.ts` gained an explicit doc comment covering what begins a workflow (first `resolveCorrelationId()` call, or explicit `setCorrelationId()`), what ends one (nothing automatic — only explicit `clearCorrelationId()`), that unrelated interactions could in principle inherit the same ID (a single module-global value with no per-workflow scoping), that a full page reload clears it implicitly (in-memory, no persistence) while client-side route navigation does not, and that logout triggers nothing today. **Disposition: dormant, not active** — `getObservability()` is not called from `main.tsx`/`App.tsx`, so no real workflow-boundary gap can currently manifest. This module supplies the mechanism (`clearCorrelationId`); wiring the trigger (route-change/logout hook) is future application-integration work, deliberately not built speculatively here.

### 27.12 Configuration-Semantics Clarification

`isActive()` (new, private) is now the single predicate both the internal `guarded()`/`flush()` gate and the public `isEnabled()` consult: `config.enabled && provider.isEnabled()`. Previously `guarded()` checked only `config.enabled`, so a `true` config with the (always-not-ready) no-op provider would still have called through to provider methods — harmless only because those calls were themselves inert, not because the gate was correct. "Requested enabled" (`config.enabled`) and "effectively active" (`isEnabled()`/the gate) are now unambiguous and cannot disagree.

### 27.13 Tests Added or Changed

31 new/changed tests: 9 in `sanitize.test.ts` (`sanitizeText`), 11 in the new `sanitizeException.test.ts`, 11 in `observabilityService.test.ts` (CR1-labeled). Full observability suite: 84/84 passing (was 53 before CR1). Every one of the 15 required CR1 test behaviors is covered:

1. Raw `Error.message` sanitized → `observabilityService.test.ts` ("redacts a sensitive value embedded in the raw exception message").
2. Stack text sanitized → `sanitizeException.test.ts` ("redacts a sensitive value embedded in the stack text").
3. Non-Error thrown values sanitized → both files.
4. Custom error properties sanitized → both files.
5. Diagnostic messages sanitized → `observabilityService.test.ts` ("redacts a sensitive value embedded in a captureMessage string").
6. Breadcrumb message sanitized → `observabilityService.test.ts` ("sanitizes the breadcrumb message and category").
7. Breadcrumb structured data remains sanitized → pre-existing test, re-verified green.
8. Approved identifier fields remain usable → "passes through all three approved identifier fields when present".
9. Unapproved identity fields cannot cross the boundary → "strips any field not on the approved allow-list" / "drops a non-string value smuggled under an approved field name".
10. Provider failures remain swallowed → pre-existing test, re-verified green.
11. Sanitization does not mutate caller-owned values → "does not mutate the caller's original Error or context object".
12. Circular/deeply nested exception values do not crash → both files.
13. Useful non-sensitive name/message/stack remains available → `sanitizeException.test.ts` first test.
14. Configuration semantics clear and deterministic → "makes no provider call when configuration is requested enabled but the provider itself is not ready".
15. Correlation lifecycle explicitly documented as deferred → §27.11 above and the doc comment in `correlationContext.ts`.

### 27.14 Commands Executed

Worktree checkout of the existing PR branch (`feat/eng-p1-003-imp-01-observability-foundation`, not a new branch), `pnpm install --frozen-lockfile`, repeated `pnpm --filter web exec vitest run <file>` (RED then GREEN per TDD cycle), `pnpm --filter web typecheck`, `pnpm -w run lint`, `pnpm exec prettier --check`/`--write`, `pnpm --filter web test` (full suite), `pnpm --filter web build`, `pnpm --filter functions test`, dependency/import/DSN/secret/network-call scans, doc-link validation, `git diff --check`, `git status`, `git commit`/`push` (to the existing branch), `gh pr checks`.

### 27.15 Dependencies Added

None.

### 27.16 Configuration Changes

None beyond the CR1 code itself — no new `.env.example` entries, no DSN, no secret.

### 27.17 Validation Results

| Check | Result |
|---|---|
| Focused observability tests | 84/84 passed (was 53 pre-CR1) |
| Full `apps/web` test suite | 115/115 passed (zero regression) |
| `apps/web` typecheck | Clean |
| Repository-wide lint | Clean |
| Formatting | Clean after `--write` |
| `apps/web` build | Clean |
| `functions` tests | 92/92 passed, unaffected (`functions/` byte-identical to `origin/main`) |
| Documentation-link validation | 0 broken links across 214 files, 1832 links checked |
| Dependency diff | Empty |
| Provider-import scan | No `@sentry` import anywhere |
| DSN/secret scan | Clean |
| External-network-call scan | Clean |
| `git diff --check` | Clean |
| Repository-status verification | `functions/`, `main.tsx`/`App.tsx`, Decision Register, Master Workflow, `records/` all confirmed unchanged |

**Capturing-provider inspection (explicit values received):** using the test suite's `createSpyProvider()`, direct inspection of `provider.captureException.mock.calls[0]` confirmed the first argument is a `SanitizedException` object (`kind: "error"`, redacted `message`) rather than the original `Error`; `provider.captureMessage.mock.calls[0][0]` confirmed the redacted string; `provider.addBreadcrumb.mock.calls[0][0]` confirmed both `message` and `category` redacted; `provider.setUserContext.mock.calls[0][0]` confirmed extra fields (`name`, `email`) absent from the object actually delegated.

### 27.18 Remaining Limitations

- `sanitizeText`'s long-token pattern can false-positive on non-secret long alphanumeric runs (e.g. build-hash filenames in a stack trace) — disclosed in §27.8, an accepted tradeoff.
- Neither `sanitize()` nor `sanitizeText()` can perfectly classify arbitrary prose — both are conservative by design (favour redaction), not a claim of perfect detection.
- Correlation-lifecycle automatic clearing (route-change/logout) remains unimplemented, by design — see §27.11; this is a documented constraint, not an oversight.

### 27.19 Risks

None introduced. The correction only narrows what reaches the (still no-op-only) provider; no new capability, dependency, or external surface was added.

### 27.20 Rollback Instructions

`git revert` of this correction's own commit on the PR branch — restores the pre-CR1 Stage 1 state exactly; no other file is affected.

### 27.21 Repository State

`main` unchanged. PR #19 remains open and unmerged on branch `feat/eng-p1-003-imp-01-observability-foundation`, now updated with the correction commit — see the accompanying chat report for the exact new head commit.

### 27.22 Next Recommendation

Not determined by this correction. Per the governing task, PR #19 requires a fresh Founder/Technical Lead merge decision after this correction — this report does not itself authorize a merge.
