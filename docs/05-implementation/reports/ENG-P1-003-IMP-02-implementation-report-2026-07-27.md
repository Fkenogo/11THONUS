> **Title:** ENG-P1-003-IMP-02 — Application Integration — Implementation Report
> **Status:** Implemented, test-first (TDD). `ENG-P1-003` row remains `In Progress` — not `Complete`. PR unmerged, pending separate Founder/Technical Lead review. Stage 3 (`ENG-P1-003-IMP-03`) not begun.
> **Date:** 2026-07-27
> **Classification:** Target-only addition to existing observability module — one modified composition root (`main.tsx`), five new modules, three modified existing modules.

# ENG-P1-003-IMP-02 — Application Integration — Implementation Report

## 1. Executive Summary

Executed Stage 2 of the Founder-authorized "TASK — ENG-P1-003-EXECUTION-LOOP: Stages 2–4" — **Application Integration**. PR #19 (Stage 1 + CR1, the observability foundation) was merged and post-merge CI verified green before any Stage 2 file was written. Connected the previously-dormant `apps/web/src/observability/` foundation to the live React application: a React error boundary wrapping the application root, global `window` `error`/`unhandledrejection` capture, a workflow-scoped correlation-ID lifecycle (`beginWorkflow`/`endWorkflow`, compare-and-clear), a Firebase-Auth-driven correlation/identity clear-on-sign-out hook, connectivity (`online`/`offline`) breadcrumbs, and route-change breadcrumbs — all still backed only by the no-op provider (Stage 3's Sentry adapter is not yet built). 29 new tests were added test-first (TDD, RED confirmed before each GREEN); the full `apps/web` suite grew from 115 to 144 passing tests with zero regression. No Sentry SDK, no backend change, no Firestore Rules change, no dependency added, no production deploy, and no third-party account or credential of any kind. Two pre-edit stop-and-ask conditions were triggered by a materially thinner live application than the task brief assumed (no router beyond one placeholder route, no logout UI, no API/network layer) and resolved via explicit Founder decision before implementation began — recorded in §3 below.

## 2. Entry-Condition Verification

1. PR #19 merged — commit `c0e39545c861a9bc8336f5778508a191c24eb0dd`, Founder-authorized.
2. Post-merge CI verified green on that exact commit before this stage's worktree was created.
3. Fresh worktree created from `origin/main` at the merged commit; `pnpm install --frozen-lockfile` completed cleanly.
4. Worktree clean before any edit — confirmed via `git status --short`.
5. `ENG-P1-003` confirmed `In Progress` (not `Complete`, not `Blocked`) in the live Programme/Prompt Register before starting.
6. The Stage 2 task's own required pre-edit analysis was performed against the live application (not assumed) — see §3.
7. No Stage 2 work had already begun — confirmed by repository search (no `ErrorBoundary`, `globalErrorHandlers`, `authLifecycle`, `connectivityBreadcrumbs`, or `RouteTracker` file existed anywhere in `apps/web/src`).

No entry condition failed; no stop condition was triggered at entry. Two stop-and-ask conditions were triggered during pre-edit analysis itself — resolved via Founder decision, not silently guessed (§3).

## 3. Pre-Edit Analysis and Stop-and-Ask Resolutions

Direct inspection of the live application (`apps/web/src/App.tsx`, `main.tsx`, and a repository-wide search for `httpsCallable`/`fetch(`) found an architecture materially thinner than the task brief's assumptions: exactly one route (`/`, a static placeholder shell — `docs/01-product` contains no approved customer-facing error-fallback UX specification), no authentication/logout UI or flow of any kind, and zero API/network abstraction layer (`apps/web/src` contains no `httpsCallable` wrapper, no `fetch` client, confirmed by direct grep). This triggered two of the task's own explicit stop-and-ask conditions ("stop and ask if an approved error fallback cannot be derived from current UX requirements"; "if the current API layer cannot propagate the existing approved header or field without broader design work, stop and report the missing contract"). Both were surfaced via `AskUserQuestion` rather than guessed. The Founder's answers, recorded verbatim as the binding scope for this stage:

**Error-fallback UX (Founder decision):** implement a minimal engineering placeholder only — neutral, unbranded, "Something went wrong." plus a single Reload action, no internal error details/stack traces/IDs/technical information, explicitly not approved product UX, documented in code and this report as a temporary Phase 1 engineering placeholder and a carried-forward Product Experience governance gap. No branding, illustrations, customer messaging, or recovery workflows beyond this.

**Correlation propagation scope (Founder decision):** frontend-only for this stage. Implement the frontend correlation lifecycle the current architecture actually supports — workflow-scoped ID, explicit begin/read/clear, isolation between unrelated workflows, clearing on logout, protection against concurrent-workflow clobbering, attachment to frontend diagnostic events, focused tests for each. Do **not** build an API client, `httpsCallable` wrapper, `fetch` abstraction, or speculative request infrastructure this stage. Frontend-to-backend propagation and backend-issued-ID adoption are recorded as **Blocked — awaiting the governed frontend API/network abstraction layer**, a future implementation dependency, not claimed as end-to-end-ready.

A third, related gap — no logout mechanism exists to hook "clear on logout" into — was identified independently during implementation and resolved without a further stop, by hooking into Firebase Auth's own `onAuthStateChanged` listener (an already-existing `ENG-P1-001` primitive, not new invented UI), directly analogous to both Founder decisions above: compose existing primitives, do not invent product surface.

## 4. Implementation Strategy

Test-first (TDD) throughout, one module per concern, following the existing `observability/` module's own established shape (one file, one matching `.test.ts`, exported through the barrel `index.ts`). Every file was preceded by a failing test, confirmed to fail for the expected reason (missing module or missing export), then implemented to green, per the `superpowers:test-driven-development` skill's Red-Green-Refactor discipline. No file was written before its own test failed first.

## 5. Architecture Implemented — Composition-Root Wiring

```text
main.tsx (composition root)
  ├─ initializeFirebasePlatform(env)        → { auth, ... }        (ENG-P1-001, unchanged)
  ├─ getObservability()                     → ObservabilityService  (ENG-P1-003-IMP-01, now actually consumed)
  ├─ beginWorkflow()                                                (new — mints the boot-time workflow ID)
  ├─ registerGlobalErrorHandlers(service)                           (new)
  ├─ registerConnectivityBreadcrumbs(service)                       (new)
  ├─ registerAuthLifecycle(auth, service)                           (new)
  └─ render(
       <BrowserRouter>
         <ObservabilityErrorBoundary service={service}>  (new)
           <RouteTracker service={service} />            (new)
           <App />
         </ObservabilityErrorBoundary>
       </BrowserRouter>
     )
```

`getObservability()` — the Stage 1 lazy singleton accessor, unused until now — is the single instance every piece below shares. No component outside `observability/` imports a provider directly; unchanged from Stage 1's boundary.

## 6. React Error Boundary (`ErrorBoundary.tsx`)

`ObservabilityErrorBoundary`, a class component (`getDerivedStateFromError`/`componentDidCatch`, React's required pattern — no hook-based equivalent exists), routes caught render errors through the existing `createRenderErrorHandler(service)` from Stage 1, then renders the Founder-approved temporary fallback (§3): `role="alert"`, "Something went wrong.", a single Reload button, no internal error detail ever rendered. **Placement:** once, at the application root — the only boundary this stage's single-route, no-features application justifies; a second, route-level or high-risk-feature boundary is future work at the point a second meaningfully independent route or genuinely high-risk feature exists, not built speculatively here. 7 tests cover: service invocation on render failure, sanitized component-stack attached as context, the fallback never leaking the internal exception message, unaffected normal rendering, an end-to-end pass through the real service + no-op provider, resilience when the service itself throws, and the Reload button's accessible presence.

## 7. Global Browser Failure Capture (`globalErrorHandlers.ts`)

`registerGlobalErrorHandlers(service)` attaches `window` listeners for `"error"` and `"unhandledrejection"` — failures a React error boundary structurally cannot see (a stray event-handler throw, an unawaited rejected promise). Each handler wraps its `service.captureException(...)` call in its own try/catch so an observability failure can never propagate into the application (Blueprint §11). A module-level guard makes a second registration call a no-op (idempotency, required test #7). The returned unregister function is used only by tests; `main.tsx` never tears it down (it runs for the application's lifetime). Registered directly in `main.tsx`, not inside a React effect, specifically so registration happens exactly once per boot with no `StrictMode` double-invocation risk. 5 tests cover: uncaught-error capture, unhandled-rejection capture, no-duplicate-registration, stop-after-unregister, and resilience when the service itself throws.

**Test-environment note (disclosed):** the "stops reporting after unregister" test dispatches a synthetic `"error"` event on `window` with no listener left to consume it. jsdom's default action for an unhandled `"error"` event — reporting it as an uncaught exception — fired even though the assertion under test (`captureException` not called) passed correctly; this is an artifact of the browser/jsdom `error`-event spec, not a defect in `globalErrorHandlers.ts`. Fixed by having that one test attach its own unrelated, test-only listener that calls `event.preventDefault()` to suppress jsdom's default reporting, isolated to that test only.

## 8. Correlation Lifecycle Resolution

`correlationContext.ts` gained `beginWorkflow()` (always mints a fresh ID, unlike `resolveCorrelationId()`'s reuse-if-present semantics) and `endWorkflow(id)` (compare-and-clear: a no-op unless `id` is still the active correlation ID). The compare-and-clear semantics specifically close the "unrelated interactions could inherit the same ID" risk CR1 flagged: if workflow A is superseded by workflow B before A's own cleanup runs, A's delayed `endWorkflow(A)` cannot clobber B's still-active ID — proven directly by a dedicated concurrent-workflow test. `main.tsx` calls `beginWorkflow()` once at boot. 5 new tests (12/12 total in the file, including the 7 pre-existing Stage 1 tests): fresh-ID minting, per-workflow uniqueness, basic compare-and-clear, no-op-when-superseded, and the concurrent-workflow non-clobbering case.

`authLifecycle.ts` (new) — `registerAuthLifecycle(auth, service)` — registers a Firebase `onAuthStateChanged(auth, ...)` listener; on a transition to signed-out (`user === null`) it calls `clearCorrelationId()` and `service.setUserContext(undefined)`, clearing both correlation and identity context together. No logout UI exists anywhere in the application, so this only ever fires on a real Firebase sign-out event, never a fabricated one — the Founder-approved "compose an existing primitive, don't invent UI" pattern (§3). 4 tests, using a scoped mock of `firebase/auth`'s `onAuthStateChanged` (the one mock in this stage — of a third-party SDK boundary, not of this codebase's own logic) to drive sign-in/sign-out transitions deterministically: clears correlation on sign-out, clears user context on sign-out, does not clear either on sign-in, returns Firebase's own unsubscribe function unchanged.

## 9. Connectivity Breadcrumbs (`connectivityBreadcrumbs.ts`)

`registerConnectivityBreadcrumbs(service)` mirrors `globalErrorHandlers.ts`'s exact shape (module-level idempotency guard, try/catch-wrapped calls, unregister function) for `window`'s `"online"`/`"offline"` events, adding a `{ category: "connectivity", message: "online" | "offline" }` breadcrumb on each transition — diagnostic context for "was the user offline shortly before this exception," using only the browser's existing native events, no new state or UI. 5 tests: offline breadcrumb, online breadcrumb, no-duplicate-registration, stop-after-unregister, resilience when the service itself throws.

## 10. Route-Change Breadcrumbs (`RouteTracker.tsx`)

`RouteTracker` uses `react-router-dom`'s own `useLocation()` — the app's existing routing primitive, no new navigation-tracking mechanism — to add a `{ category: "navigation", message: pathname, data: { from, to } }` breadcrumb whenever the pathname changes, including the initial route on mount. Renders `null`; mounted once inside `<BrowserRouter>` for its side effect only. A component-local `useRef` guard (not a module-level one, unlike the `window`-listener modules) is sufficient here, since `StrictMode`'s effect double-invocation only needs deduping per component instance, and refs persist across that dev-only double-invoke. 3 tests: initial-route breadcrumb on mount, a new breadcrumb on programmatic navigation, and renders nothing to the DOM.

## 11. Correlation Status — Explicit Distinction (Founder-required)

Per the Founder's explicit instruction not to claim broader correlation readiness than actually built:

| Capability | Status |
|---|---|
| Frontend correlation lifecycle (begin/read/set/clear, workflow-scoped, concurrency-safe) | **Implemented** |
| Frontend diagnostic correlation (active correlation ID attached to captured events via `observabilityService`) | **Implemented** (Stage 1 mechanism, now actually exercised — `beginWorkflow()` called at boot) |
| Correlation/identity clearing on sign-out | **Implemented** (`authLifecycle.ts`, real Firebase Auth event) |
| Frontend-to-backend correlation-ID propagation (attaching the ID to an outgoing request) | **Not implemented — Blocked**, awaiting the governed frontend API/network abstraction layer (no `httpsCallable` wrapper, no `fetch` client exists anywhere in `apps/web/src`) |
| Backend-issued correlation-ID adoption on the frontend (reading an ID back from a response) | **Not implemented — Blocked**, same dependency |
| End-to-end correlation (a single ID traceable frontend → backend → logs) | **Not yet demonstrated** |

## 12. Files Created (10)

- `apps/web/src/observability/ErrorBoundary.tsx` (+ test)
- `apps/web/src/observability/globalErrorHandlers.ts` (+ test)
- `apps/web/src/observability/authLifecycle.ts` (+ test)
- `apps/web/src/observability/connectivityBreadcrumbs.ts` (+ test)
- `apps/web/src/observability/RouteTracker.tsx` (+ test)
- `docs/05-implementation/reports/ENG-P1-003-IMP-02-implementation-report-2026-07-27.md` (this report)

## 13. Files Modified (4)

- `apps/web/src/main.tsx` — composition-root wiring (§5)
- `apps/web/src/observability/correlationContext.ts` — `beginWorkflow`/`endWorkflow` + updated lifecycle doc comment
- `apps/web/src/observability/correlationContext.test.ts` — 5 new tests
- `apps/web/src/observability/index.ts` — barrel exports for all five new modules plus `beginWorkflow`/`endWorkflow`

## 14. Tests Added

29 new tests across 6 files (5 new test files + `correlationContext.test.ts`'s additions): `ErrorBoundary.test.tsx` (7), `globalErrorHandlers.test.ts` (5), `correlationContext.test.ts` (+5, 12 total), `authLifecycle.test.ts` (4), `connectivityBreadcrumbs.test.ts` (5), `RouteTracker.test.tsx` (3). Full `apps/web` suite: **144/144 passing** (was 115/115 at Stage 1/CR1 baseline) — zero regression, zero skipped, zero unhandled errors in any run.

## 15. Commands Executed

Fresh worktree from `origin/main` at the merged Stage 1 commit; `pnpm install --frozen-lockfile`; repeated `pnpm --filter web exec vitest run <file>` (RED then GREEN per TDD cycle); `pnpm --filter web exec vitest run` (full suite, multiple times); `pnpm --filter web exec tsc --noEmit -p tsconfig.app.json`; `pnpm exec eslint apps/web/src/observability apps/web/src/main.tsx`; `pnpm exec prettier --check`/`--write`; `pnpm --filter web run build`; `pnpm --filter functions exec vitest run`; `git diff origin/main --stat`; dependency-diff, `@sentry`-import, credential/DSN, network-call, and Firestore-Rules scans; `git diff --check`; `git status --short`.

## 16. Dependencies Added

None. `git diff origin/main -- apps/web/package.json functions/package.json package.json pnpm-lock.yaml` is empty.

## 17. Configuration Changes

None. No new `.env.example` entry, no DSN, no secret, no Firebase configuration change.

## 18. Validation Results

| Check | Result |
|---|---|
| Focused observability suite | 113/113 passed |
| Full `apps/web` test suite | 144/144 passed (was 115/115 pre-Stage-2) |
| `apps/web` typecheck (`tsc --noEmit`) | Clean |
| `eslint` on changed files | Clean |
| Formatting (`prettier --check`) | Clean after one `--write` pass (line-wrap only, no logic change) |
| `apps/web` build (`tsc -b && vite build`) | Clean (pre-existing generic chunk-size advisory only, not introduced by this stage) |
| `functions` tests | 92/92 passed, unaffected — `functions/` untouched |
| Dependency diff (`package.json`/`pnpm-lock.yaml` vs `origin/main`) | Empty |
| `@sentry` import scan | None found |
| Credential/DSN/secret-pattern scan on new files | Clean |
| External-network-call scan (`fetch(`/`httpsCallable`) in `observability/` | None (only a doc-comment reference to their absence) |
| Firestore Rules diff | Empty |
| `git diff --check` | Clean |
| Repository-status verification | Only the files listed in §12/§13 changed; `functions/`, Decision Register, Master Workflow unaffected |

## 19. Exclusions Compliance

No Sentry SDK installed; no backend Sentry; no Firestore Rules change; no production deploy; no third-party account, API key, or DSN created or referenced; no self-merge (PR not yet opened at time of writing — see §24); `ENG-P1-003` not marked `Complete`; Stage 3/4 (`ENG-P1-003-IMP-03`/`-04`) not begun; Phase 2 not begun.

## 20. Remaining Limitations and Carried-Forward Governance Gaps

- **Error-fallback UX is an engineering placeholder, not approved product UX** — a Product Experience decision on the real customer-facing failure state remains an open governance gap (§3, §6).
- **Frontend-to-backend correlation propagation remains blocked**, not implemented, pending the not-yet-built frontend API/network abstraction layer (§11).
- **Route-level/feature-level error boundaries are deliberately not built** — the application has one route and no features; a second boundary is justified only when a second meaningfully independent route or high-risk feature exists.
- `sanitizeText`'s long-token redaction heuristic (Stage 1/CR1, unchanged) can still false-positive on non-secret long alphanumeric strings — a pre-existing, disclosed, accepted tradeoff, not something Stage 2 introduced or resolved.

## 21. Risks

None introduced beyond what Stage 1 already disclosed. This stage only connects already-reviewed, already-sanitizing code paths to real browser/React/Firebase-Auth events; it adds no new external surface, no new dependency, and no new data leaves the browser (still no-op provider only).

## 22. Rollback Instructions

`git revert` of this stage's own commit(s) on its dedicated branch restores the Stage 1/CR1 state exactly — every change is additive (5 new files) or narrowly scoped (`main.tsx` wiring, `correlationContext.ts`/`index.ts` additions); no existing Stage 1 file's prior behavior was altered.

## 23. Repository State

`main` unaffected — all Stage 2 work happens on a new dedicated branch, not `main`, per the task's PR-per-stage requirement. `origin/main` remains at the Stage 1/CR1 merge commit (`c0e39545c861a9bc8336f5778508a191c24eb0dd`) until a Stage 2 PR is opened, reviewed, and separately Founder-authorized to merge. PR #20 opened on branch `feat/eng-p1-003-imp-02-application-integration`, head commit `7844237aef66fc8ec997d0815c35cd163584a62e`, left unmerged pending Founder/Technical Lead review.

**CI evidence (disclosed):** CI run `30257996074`'s first attempt failed — but the single failing assertion was inside `functions/src/shared/idempotency/idempotencyService.emulator.test.ts` ("re-acquires ownership … for a same-hash key that previously failed"), a real-Firebase-Emulator concurrency test from `ENG-P1-002`, pre-existing and entirely unmodified by this PR (`git diff origin/main --stat -- functions/` is empty — confirmed before concluding this was unrelated, not assumed). This matches the emulator-timing flakiness already disclosed in the `ENG-P1-002` Technical Review record, not a defect introduced by Stage 2. The same run was re-triggered (`gh run rerun 30257996074 --failed`, no code change) and passed cleanly on the identical commit — `gh pr checks 20` now shows `pass`, and `gh pr view 20 --json headRefOid` confirms the passing run is on this PR's actual head commit, not a stale one.

## 24. Gate Outcome and Next Recommendation

**Gate outcome: PASS — Stage 2 implementation complete, correlation status distinguished exactly as required (§11), all exclusions held, all required tests passing.** Per the task's own explicit PR-per-stage instruction, this does **not** authorize proceeding to Stage 3 (`ENG-P1-003-IMP-03`) yet. **Next recommendation:** commit this work to a new dedicated branch, push, open a Stage 2 PR against `main`, verify its CI, and **stop for Founder merge authorization** — Stage 3 begins only after that PR is reviewed, approved, merged, and post-merge CI is separately verified.
