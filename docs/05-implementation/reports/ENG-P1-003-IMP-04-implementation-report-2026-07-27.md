> **Title:** ENG-P1-003-IMP-04 — Operational Validation and Readiness — Implementation Report
> **Status:** Validation-first stage. Two genuine, previously-undetected defects found and fixed under strict TDD; readiness classified across four independent states. `ENG-P1-003` remains `In Progress` — this report does not declare it complete. PR unmerged, pending separate Founder/Technical Lead closure-review.
> **Date:** 2026-07-27
> **Classification:** Validation, evidence, and readiness classification. Two minimal, disclosed, test-proven corrections to already-merged code (both within `apps/web/src/observability/`); zero new observability infrastructure.

# ENG-P1-003-IMP-04 — Operational Validation and Readiness — Implementation Report

## 1. Executive Summary

Executed Stage 4 of `ENG-P1-003-EXECUTION-LOOP` — **Operational Validation and Readiness**. PR #21 (Stage 3) was approved and merged on explicit Founder authorization; post-merge CI verified green before any Stage 4 work began. Performed validation-first assessment across six required areas (functional, privacy, correlation, resilience, security, regression), cross-referencing every required checklist item against actual test titles in the merged repository rather than assuming coverage. This surfaced **two genuine, previously-undetected defects**, both fixed under strict TDD (RED confirmed before each GREEN): (1) `sanitizeText()` had no pattern for a plain email address or general phone number embedded in free text — only structured, key-named fields were protected, meaning a customer-entered note or exception message containing a raw email/phone could have reached a provider unredacted; (2) `RouteTracker`'s `StrictMode` double-invocation safety was reasoned about but never proven with a real `<StrictMode>` render test. Both are now fixed/proven with 4 new tests; the full `apps/web` suite grew from 186 to 190 passing tests with zero regression. Classified all four readiness states independently: **Architecture Ready — PASS**, **Integration Ready — PASS**, **Staging Ready — PASS WITH CONDITIONS**, **Production Ready — NOT YET ASSESSABLE**. No new observability infrastructure was built; no external account, credential, or production activation occurred.

## 2. Entry-Gate Verification

1. PR #21 approved by explicit Founder decision ("Stage 3 passes its gate. PR #21 merge approved") and merged — merge commit `310313ea08779bb9c1502cbea31fa1182a5c821c`.
2. `origin/main` fetched fresh; HEAD confirmed identical to the merge commit (`56b828b..310313e main -> origin/main`) — zero divergence.
3. Post-merge CI verified green on that exact commit — GitHub Actions run `30277223179`, `conclusion: success`.
4. Fresh worktree created from `origin/main` at the merged commit; `pnpm install --frozen-lockfile` clean; `git status --short` clean before any edit.
5. All 11 required Stage 3 pieces confirmed present **by direct inspection of the merged repository**: Sentry-backed `DiagnosticsProvider` (`sentryProvider.ts`); deterministic provider selection (`providerSelection.ts`); disabled-by-default configuration (`config.ts` defaults, blank `.env.example`); retained no-op provider (`noopProvider.ts`, still the shipped default); provider-specific import boundaries (ESLint `no-restricted-imports` rule, present and verified clean); privacy filtering (`sanitize.ts`/`sanitizeException.ts`); initialization resilience (try/catch around `Sentry.init()` and every adapter method); no real credentials (`.env.example` blank, confirmed by grep); no production activation (config disabled by default, nothing deployed); no backend Sentry (`functions/` byte-identical to `origin/main`, confirmed by empty diff); no source-map upload (empty scan); Stage 1/2 integration still present (`main.tsx` wiring intact — `ObservabilityErrorBoundary`, `RouteTracker`, `registerGlobalErrorHandlers`, `registerConnectivityBreadcrumbs`, `registerAuthLifecycle`, `beginWorkflow`, `getObservability`).

No entry condition failed; no stop condition was triggered.

## 3. PR #21 Merge Commit

`310313ea08779bb9c1502cbea31fa1182a5c821c`

## 4. Post-Merge CI Evidence

GitHub Actions run `30277223179` on commit `310313ea08779bb9c1502cbea31fa1182a5c821c` — `status: completed`, `conclusion: success`.

## 5. Starting Repository State

`apps/web/src/observability/` (27 files) — the complete Stage 1/CR1/Stage 2/Stage 3 foundation, unchanged since PR #21's merge. Full `apps/web` suite: 186/186 passing against the merged commit, confirmed before any Stage 4 edit. `functions`: untouched throughout `ENG-P1-003`'s entire history, confirmed again this stage.

## 6. Pre-Validation Codebase Analysis

Performed and stated in full in chat before any file was written — the required 13-point review (complete observability flow, provider selection, sanitization boundary, correlation lifecycle and its documented limitation, error-boundary behavior, global handlers, breadcrumbs, identity/sign-out clearing, adapter resilience, testing/mocking strategy, environment configuration, outstanding external Founder actions, and the one already-disclosed blueprint/implementation gap — frontend-to-backend correlation propagation, blocked on the absent API layer). No conflict found between the live repository and the approved architecture; two coverage gaps were found during the *validation* itself (§12), not during this initial analysis.

## 7. Validation Strategy

Cross-reference every required checklist item (functional §6.1, privacy §6.2, correlation §6.3, resilience §6.4, security §6.5 of the governing task) against actual test titles in the repository — not assumption, not prior-report authority. Any genuine gap found gets the test-first correction workflow (RED → minimal fix → GREEN → regression re-run → disclosure); anything requiring an architecture/privacy-policy/security/external decision would stop for a Founder decision instead. Two gaps were found; both qualified as minimal, bounded, in-scope defects (extending an already-existing, already-designed extensible mechanism — the same class as Stage 3's own loyalty/QR/customerName closed-list extension), not architecture changes, so both were fixed rather than escalated.

## 8. Files Created (2)

- `docs/05-implementation/reports/ENG-P1-003-IMP-04-operational-readiness-report-2026-07-27.md` — the authoritative readiness report (§1–6 plus Appendices A–G: staging/production checklists, provider onboarding action list, rollback procedure, privacy verification checklist, manual validation plan, known limitations).
- `docs/05-implementation/reports/ENG-P1-003-IMP-04-implementation-report-2026-07-27.md` (this report).

## 9. Files Modified (4)

- `apps/web/src/observability/sanitize.ts` — added two new `TEXT_SCAN_PATTERNS` entries (email-address shape, phone-number shape) to close the free-text PII gap (§12, Defect 1).
- `apps/web/src/observability/sanitize.test.ts` — 2 new tests proving the fix.
- `apps/web/src/observability/correlationContext.test.ts` — 1 new test proving `setCorrelationId`/`resolveCorrelationId` handle an unusual/unsafe-looking value safely (no code change needed — this closed a required proof point with evidence, not a defect).
- `apps/web/src/observability/RouteTracker.test.tsx` — 1 new test rendering `RouteTracker` inside a real `<StrictMode>` wrapper, proving its `useRef` double-invocation guard (§12, Defect 2 — a missing-proof gap, not a code defect; the guard was already correct).

## 10. Code-Diff Summary

`git diff origin/main --stat`: 4 files changed, 70 insertions, 1 deletion. One production-code change (`sanitize.ts`, 22 lines — two new regex patterns and their doc comments); three test-only additions. No dependency added (`git diff origin/main --stat -- apps/web/package.json functions/package.json package.json pnpm-lock.yaml` is empty). No application-feature file touched. No backend file touched. No Firestore Rules change.

## 11. Commands Executed

Merged PR #21 (`gh pr merge 21 --merge`), fetched `origin/main`, removed the stale Stage 3 worktree, created a fresh one at the merge commit, `pnpm install --frozen-lockfile`; a standalone Node script verifying the exact regex behavior before treating the free-text gap as a genuine defect (not assumed); repeated `pnpm --filter web exec vitest run <file>` (RED then GREEN per TDD cycle); `pnpm --filter web exec vitest run` (full suite, multiple times); `pnpm --filter web exec tsc --noEmit -p tsconfig.app.json`; `pnpm exec eslint .`; `pnpm exec prettier --check`; `pnpm --filter web run build`; `pnpm --filter functions exec vitest run`; dependency-diff, credential/secret, backend-Sentry, source-map, provider-import-boundary, telemetry, and tracing/profiling/replay scans; `git diff --check`; `git status`.

## 12. Tests Added or Changed (4, plus 2 genuine defects found)

**Defect 1 (fixed): free-text email/phone redaction gap.** Validation of the required privacy checklist's "customer-entered text" item found that `sanitizeText()` — used for exception messages, `captureMessage` strings, and breadcrumb messages/categories — had no pattern for a plain email address or a general phone-number shape; only a *structured, key-named* field (e.g. `{ email: "..." }`) was protected via `sanitize()`'s key-substring check. Verified with a standalone script before treating it as real: `sanitizeText("Please contact me at person@example.com...")` returned the email completely unredacted; a 9-digit local phone number likewise passed through untouched (only country-code-length digit runs happened to overlap with the existing payment-card pattern). RED reproduced with two real failing tests; fixed by adding an email-address pattern and a broader phone-number-shaped pattern (7+ digits with separators) to `TEXT_SCAN_PATTERNS`, placed before the long-token pattern per that pattern's own "checked last" ordering invariant. GREEN: 22/22 in `sanitize.test.ts`, 190/190 across the full suite (zero regression — stack-trace/short-identifier preservation tests still pass unchanged).

**Defect 2 (proof gap, not a code defect, closed with evidence): `RouteTracker`'s StrictMode safety was reasoned, not proven.** The required resilience checklist item "React Strict Mode behaviour where applicable" had no test literally rendering `RouteTracker` inside `<StrictMode>` — only a doc-comment argument that its `useRef` guard would survive double-invocation. Added a test wrapping the component in a real `<StrictMode>` and asserting exactly one breadcrumb fires for the initial route. This passed on first execution (GREEN, no production code change), confirming the existing reasoning was correct rather than assumed.

**Additional proof-only test (correlation validation, §6.3 item 8):** "invalid or unsafe IDs are handled safely" had no direct test. Added one confirming `setCorrelationId`/`resolveCorrelationId` never throw for an unusual value and correctly treat an empty string as "no id supplied" (matching the existing, documented, never-sanitized-by-design correlation-id channel). Passed immediately — no defect, evidence closed.

Total: 4 new tests (2 for a real fix, 2 proof-only for already-correct behavior). Full `apps/web` suite: **190/190 passing** (was 186/186 at Stage 3 baseline).

## 13. RED/GREEN Evidence

- Email/phone free-text redaction: RED — `expected 'Please contact me at person@example.c…' not to contain 'person@example.com'` and `expected '...790000000...' not to contain '790000000'`; GREEN — 22/22 in `sanitize.test.ts` after adding the two patterns.
- `RouteTracker` StrictMode: no RED (proof-only, immediate GREEN, disclosed as such — no production code changed).
- Correlation-id safety: no RED (proof-only, immediate GREEN, disclosed as such).

## 14. Functional Validation Results (§6.1)

All 18 required items have direct, named test coverage in the merged + Stage-4-corrected repository: provider selection (`providerSelection.test.ts`, 6 tests covering every branch); no-op selection with zero configuration (`config.test.ts`); disabled configuration; structurally invalid configuration (both the fail-loud boolean case and the fail-safe unknown-provider case); valid mocked configuration; adapter initialization (`sentryProvider.test.ts`); exception/message/breadcrumb capture; identity setting/clearing; correlation setting/clearing; logout behaviour (`authLifecycle.test.ts`); route breadcrumbs (`RouteTracker.test.tsx`); connectivity breadcrumbs (`connectivityBreadcrumbs.test.ts`); root error-boundary capture (`ErrorBoundary.test.tsx`); global error/rejection capture (`globalErrorHandlers.test.ts`). No gap found.

## 15. Privacy Validation Results (§6.2)

All 16 required categories now have direct evidence — see the readiness report's Appendix E for the full checklist mapped to exact test names. One genuine gap found and fixed (§12, Defect 1). Two categories (raw route query parameters, request/response payloads, component props) are structurally impossible to leak rather than merely redacted — confirmed by direct code reading: `RouteTracker.tsx` reads only `location.pathname`, never `.search`; `errorBoundaryIntegration.ts`'s `CapturedRenderInfo` carries only `componentStack` (component names/positions), never prop values; and no code anywhere in `apps/web/src` reads `localStorage`/`sessionStorage` into observability or has any API/network layer to intercept payloads from.

## 16. Correlation Validation Results (§6.3)

All 9 required proof points now have direct test evidence, including one previously-unproven item closed this stage (§12). **Explicit status, as required:**
- Frontend lifecycle status: **Implemented.**
- Frontend diagnostic correlation status: **Implemented** (and correctly non-redacted, per the Stage 3 fix, re-verified this stage).
- Frontend-to-backend propagation status: **Not implemented — blocked**, no API/network layer exists.
- Backend-issued-ID adoption status: **Not implemented for real use** — the `resolveCorrelationId(existing)` mechanism exists and is tested for the future case, but is never exercised against an actual backend response.
- End-to-end correlation status: **Not demonstrated.** Not claimed.

## 17. Resilience Validation Results (§6.4)

All 13 required items covered, including a genuine `<StrictMode>` render test added this stage (previously reasoned-only). SDK init failure, adapter method failure, offline operation, absent/malformed environment configuration, provider-disabled fallback, repeated-initialization protection, listener teardown, duplicate-listener/capture prevention, and application startup under observability failure are all directly tested. No gap remains.

## 18. Security Validation Results (§6.5)

Clean across every required scan: no committed DSN, auth token, or secret; no backend SDK introduction; no source-map upload tooling; no unauthorized network endpoint; no provider import outside the enforced boundary; no unapproved telemetry (analytics/GA/Mixpanel/Segment/Amplitude — all absent); no unsafe environment-variable exposure (only `VITE_OBSERVABILITY_*`-prefixed vars are read, and Vite itself only exposes `VITE_*`-prefixed vars to client bundles by design); no request/response interception; session replay, tracing, and profiling integrations confirmed never invoked (`integrations: []`); `sendDefaultPii: false` confirmed explicit.

## 19. Regression Validation Results (§6.6)

| Check | Result |
|---|---|
| Focused Stage 4 tests (3 changed files) | 39/39 passed |
| Full `apps/web` test suite | 190/190 passed (was 186/186 pre-Stage-4) |
| `apps/web` typecheck | Clean |
| Repository-wide `eslint` | Clean |
| Formatting (`prettier --check`) | Clean |
| `apps/web` build | Clean (generic chunk-size advisory only, pre-existing) |
| `functions` tests | 92/92 passed, unaffected |
| Dependency diff | Empty — no dependency added |
| `git diff --check` | Clean |
| Repository-status verification | Exactly 4 files changed (§9); everything else untouched |

## 20. Dependency Inspection

No dependency added or changed. `git diff origin/main --stat -- apps/web/package.json functions/package.json package.json pnpm-lock.yaml` is empty.

## 21. Credential and Secret Inspection

No credential, DSN, auth token, or secret exists anywhere in this stage's changes — the diff touches only `sanitize.ts` (regex patterns) and three test files, none of which reference any credential.

## 22. Provider-Import Boundary Inspection

Repository-wide `grep -rln "@sentry" apps/web/src` still returns exactly `sentryProvider.ts` and its own test files — unchanged from Stage 3, reconfirmed this stage. The ESLint `no-restricted-imports` rule remains clean across the full repository.

## 23. Network-Safety Assessment

Unchanged from Stage 3 — every Sentry-adjacent test still mocks `@sentry/react` entirely, and the dedicated `fetch`-spy guard (`sentryNetworkSafety.test.ts`) is unaffected by this stage's changes (none of which touch `sentryProvider.ts` itself).

## 24. Automatic SDK Integrations Review

Unchanged from Stage 3, reconfirmed this stage by direct inspection: `integrations: []` remains the only configuration, disabling every one of Sentry's default browser integrations by name. No tracing, replay, profiling, or feedback integration is added anywhere.

## 25. Manual Validation Completed

See the readiness report's Appendix F for the full table. Completed this stage (automated + code-level, no real DSN): disabled-startup behavior, error-boundary capture, global error/rejection capture, breadcrumb capture (connectivity and route), sign-in/sign-out identity and correlation behavior, workflow correlation, application continuation under simulated provider failure, and privacy non-leakage — all via automated tests, which is a stronger form of evidence than a one-time manual click-through.

## 26. Manual Validation Deferred

Deferred to a real staging environment (Appendix F): confirming real events actually arrive in and display correctly within a real Sentry project's dashboard, and a live network-blocking scenario against a real ingest endpoint. Both require a real DSN and cannot be executed without one.

## 27. Architecture Ready Classification

**PASS.** Full detail in the readiness report §3.

## 28. Integration Ready Classification

**PASS.** Full detail in the readiness report §4.

## 29. Staging Ready Classification

**PASS WITH CONDITIONS.** Full detail and the complete unmet-conditions list in the readiness report §5 and Appendix A.

## 30. Production Ready Classification

**NOT YET ASSESSABLE.** Full detail in the readiness report §6 and Appendix B. Not manufactured — no staging evidence exists yet to ground a production assessment.

## 31. Evidence Supporting Each Classification

See the readiness report §3–6 for evidence tables; every claim there traces to either a named automated test, a direct grep/scan result recorded in this report, or an explicit "no code path exists" finding from direct code reading.

## 32. Conditions Attached to Each Classification

Architecture/Integration Ready: none. Staging Ready: the full external-action list in readiness report Appendix A. Production Ready: everything in Staging Ready plus the additional items in Appendix B, including staging evidence itself.

## 33. External Founder Actions

Full list in the readiness report Appendix C, split into mandatory (account/project/DSN/terms/access/retention/alerts) and optional-enhancement (source-maps, replay/tracing/profiling, feedback widget) categories. None performed by this or any prior stage.

## 34. Risks

None introduced. The two corrections this stage made (§12) each reduce risk — closing a real privacy gap and converting an assumption into proven behavior — rather than introducing any new risk.

## 35. Known Limitations

Full list in the readiness report Appendix G: frontend-to-backend correlation propagation blocked; end-to-end correlation not demonstrated; `sanitizeText()` remains a closed-list, pattern-based mechanism, not a general PII-content scanner; no source-map upload; no session replay/tracing/profiling; no route-level/feature-level error boundaries beyond the single root boundary.

## 36. Deferred Work

Everything in Appendices A–C of the readiness report (staging/production activation, all external Founder actions), plus Stage 4 itself does not authorize Stage 5 or any further `ENG-P1-003` work beyond closure review.

## 37. CI Flakiness Observations

No CI run was required for this stage's local validation work (validation happens against the local worktree; CI runs when the Stage 4 PR is opened, §44–47). The three prior documented occurrences of Firebase Functions emulator timing/concurrency flakiness (once during Stage 2's PR #20 review, twice during Stage 3's PR #21 review, across three different specific tests in `functions/src/shared/{commands,idempotency}/*.emulator.test.ts`) remain accurately recorded in those stages' own reports and are not re-investigated or fixed here, per this task's explicit instruction not to modify unrelated backend tests as part of `ENG-P1-003`.

## 38. ENG-CI-001 Recommendation

**Recommended, not implemented in this task:** `ENG-CI-001 — Firebase Emulator CI Flakiness Investigation and Stabilisation`. Rationale: three occurrences across two consecutive stage PRs, affecting three different specific tests within the same real-Firestore-emulator concurrency suite (`functions/src/shared/commands/commandDispatcher.emulator.test.ts`, `functions/src/shared/idempotency/idempotencyService.emulator.test.ts`), with every deterministic CI step (build/lint/typecheck/unit/e2e) passing consistently in every instance — strong evidence of emulator-timing-specific flakiness warranting dedicated investigation, independent of and not blocking any `ENG-P1-003` stage's own merge readiness.

## 39. Rollback Instructions

`git revert` of this stage's own commit(s) on its dedicated branch — both changes are safe to keep independently: the `sanitize.ts` fix closes a real privacy gap (reverting would reopen it), and the `RouteTracker`/`correlationContext` test additions are pure evidence with no production-code dependency.

## 40. Documentation and Change-Log Updates

`docs/00-governance/documentation-changes-log.md` (new entry), `docs/changes/IMPLEMENTATION_CHANGES.md` (new entry) — both recorded before this report was finalized (§ below). The Engineering Implementation Programme is not modified this stage: `ENG-P1-003`'s tracker status remains `In Progress`, unchanged — Stage 4 validation work does not itself move that status, and closure is explicitly reserved for a separate, later, Founder-authorized decision per the governing task's own instruction.

## 41. Final Repository State

`main` unaffected — all Stage 4 work happens on a new dedicated branch. `origin/main` remains at the Stage 3 merge commit (`310313ea08779bb9c1502cbea31fa1182a5c821c`) until a Stage 4 PR is opened, reviewed, and separately authorized to merge.

## 42. Branch

`docs/eng-p1-003-imp-04-operational-readiness`

## 43. Starting Commit

`310313ea08779bb9c1502cbea31fa1182a5c821c` (the Stage 3 merge commit, `origin/main` HEAD at the time this stage's worktree was created)

## 44. Ending Commit

Recorded after commit, in the accompanying chat report (this report is committed as part of that same sequence).

## 45. PR Number and URL

Recorded in the accompanying chat report immediately after this report is committed and the PR is opened.

## 46. PR Head Commit

Recorded in the accompanying chat report — the commit that includes this report and all Stage 4 corrections.

## 47. CI Status on That Exact Head Commit

Recorded in the accompanying chat report after the PR is opened and its CI run completes, verified against the PR's own `headRefOid`.

## 48. Gate Outcome

**PASS — Stage 4 evidence ready for closure review.** All required validation areas are complete; two genuine gaps found during validation were fixed/proven under strict TDD before this report was finalized; all four readiness states are classified with full evidence, none manufactured.

## 49. Exact Closure Recommendation

Commit this report and the two corrections to the dedicated branch, push, open a Stage 4 PR against `main`, verify CI on the exact PR head commit, and **stop at the closure-review gate** — this report does not itself declare `ENG-P1-003` complete. That decision is explicitly reserved for the Founder/Technical Lead, informed by this report's four independent readiness classifications (particularly that Production Ready is `NOT YET ASSESSABLE` pending staging evidence that does not yet exist).

---

## Explicit Answers (as required by the governing task)

- **Is the architecture ready?** Yes — PASS.
- **Is the integration ready?** Yes — PASS.
- **Is staging activation currently authorised?** No — this report does not authorize it; Staging Ready is `PASS WITH CONDITIONS`, listing every unmet external condition.
- **Is staging technically ready without external actions?** The code is; the external actions (account, project, DSN, terms, privacy review, etc.) are not yet resolved — see readiness report Appendix A.
- **Is production activation currently authorised?** No.
- **Is the system production ready?** `NOT YET ASSESSABLE` — no staging evidence exists yet to ground that assessment.
- **Does a real Sentry account exist?** No.
- **Does a real DSN exist?** No — only test/placeholder DSN strings inside fully-mocked test files.
- **Is any external diagnostic transmission active?** No.
- **Is source-map upload configured?** No.
- **Is session replay enabled?** No.
- **Is tracing enabled?** No.
- **Is profiling enabled?** No.
- **Is backend Sentry present?** No.
- **Is correlation frontend-only?** Yes.
- **Has end-to-end correlation been demonstrated?** No, and it is not claimed.
- **Can the application run fully with the no-op provider?** Yes — this remains the shipped default with zero environment configuration.
- **Are any implementation defects still open?** No — the two genuine gaps found this stage (free-text email/phone redaction; unproven `StrictMode` safety) are both fixed/proven.
- **Are any privacy or security blockers open?** No blockers found; the one gap found was fixed within this stage.
- **Is `ENG-P1-003` ready for administrative closure?** Not yet — Production Ready is `NOT YET ASSESSABLE`, and staging activation (an external, Founder-owned action) has not occurred. Architecture and Integration readiness support closure of the *engineering* work; full programme closure should wait for at least a Staging Ready re-assessment with real evidence, per the Founder's own judgment on how much readiness is required before `ENG-P1-003` is declared complete.
- **If not, what exact conditions remain?** Everything listed in the readiness report's Appendix A (Staging) and Appendix B (Production) — all external, Founder-owned actions, none of which further engineering work can resolve.
