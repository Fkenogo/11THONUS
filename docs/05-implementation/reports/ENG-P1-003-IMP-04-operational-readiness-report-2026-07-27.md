> **Title:** ENG-P1-003 Operational Observability — Operational Readiness Report
> **Status:** Validation and readiness classification only. No new observability implementation. `ENG-P1-003` remains `In Progress` — this report does not itself close ENG-P1-003; closure is a separate, Founder-authorized decision.
> **Date:** 2026-07-27
> **Classification:** The single authoritative readiness report for `ENG-P1-003`, with linked appendices in place of separate overlapping documents.

# ENG-P1-003 Operational Observability — Operational Readiness Report

## 1. Purpose and Scope

This report classifies the `ENG-P1-003` observability implementation (Stages 1–3, merged) against four **independent** readiness states — Architecture Ready, Integration Ready, Staging Ready, Production Ready — per the `ENG-P1-003-IMP-04` task. These are deliberately not collapsed into a single verdict: a system can be architecturally sound and integration-complete while remaining unauthorized for staging or production, purely on external-decision grounds. Every classification below is evidence-based, verified directly against the merged repository (`origin/main` at commit `310313ea08779bb9c1502cbea31fa1182a5c821c`), not assumed from prior stage reports.

## 2. Readiness Classification Model

Each state below uses exactly one of: `PASS`, `PASS WITH CONDITIONS`, `FAIL`, `NOT YET ASSESSABLE`.

---

## 3. Architecture Ready

**Classification: PASS**

| | |
|---|---|
| **Scope** | Whether the provider-neutral architecture itself is sound, independent of any specific provider integration. |
| **Evidence** | Direct code inspection: `types.ts` (`DiagnosticsProvider` contract, 8 methods, no Sentry-specific concept anywhere in its shape); `observabilityService.ts` (sole caller of any provider, sanitizes every channel, `isActive()` single source of truth); `noopProvider.ts` (fully functional, zero-dependency default); `providerSelection.ts` (deterministic, pure function, unit-tested — 6 tests); `sentryProvider.ts` (a second, interchangeable implementation of the same contract, no parallel API). |
| **Passed controls** | Provider-neutral boundary preserved (verified: zero application/route/hook file imports `@sentry/react` — confirmed by repository-wide grep, and now machine-enforced by an ESLint `no-restricted-imports` rule verified to actually fire on a deliberate test violation). Backend observability (`functions/src/shared/logging`, `errorCategories`, `correlationId`) remains entirely separate — zero references to it from `apps/web/src/observability`, and vice versa; `functions/` untouched by any `ENG-P1-003` frontend stage (confirmed empty `git diff origin/main -- functions/` at every stage). No-op provider remains valid and is the shipped default (`config.ts` defaults `enabled: false`). Provider selection is deterministic (`selectProvider()`, 6/6 branch tests). Observability is non-load-bearing — every provider call wrapped in try/catch inside `observabilityService.ts`'s `guarded()`, and independently again inside `sentryProvider.ts`'s own methods (defense in depth, not reliance on one layer). Automatic SDK behaviour is fully controlled — `integrations: []` disables every one of Sentry's own default integrations by name (`breadcrumbsIntegration`, `globalHandlersIntegration`, `httpContextIntegration`, `linkedErrorsIntegration`, `browserApiErrorsIntegration`, `browserSessionIntegration`, `dedupeIntegration`), confirmed against the installed SDK's own type declarations, not memory. |
| **Failed controls** | None found. |
| **Unmet conditions** | None — this is the one readiness state with no external dependency. |
| **External dependencies** | None. |
| **Risks** | None specific to architecture; the general risk of Sentry's transitive packages (`@sentry/replay`, `@sentry/feedback`) shipping inert code inside the bundle is disclosed (§16) but does not affect architectural soundness. |
| **Action required to advance** | None — this state is already fully proven and does not depend on further work. |

---

## 4. Integration Ready

**Classification: PASS**

| | |
|---|---|
| **Scope** | Whether the Sentry adapter is correctly wired to the provider-neutral service and whether the full frontend event-capture path (errors, rejections, breadcrumbs, identity, correlation) actually works end to end, still using the no-op provider in the shipped default state. |
| **Evidence** | 190 passing frontend tests (Stage 4 validation added 4 to the Stage 3 total of 186), spanning unit, integration, and end-to-end-through-the-real-service test styles. Full checklist cross-referenced against actual test titles, not assumed — see §7 (Functional Validation Results) in the companion implementation report. |
| **Passed controls** | Adapter correctly maps all 8 provider-neutral methods (`sentryProvider.test.ts`, 18 tests). Root React failures flow through the service (`ErrorBoundary.test.tsx`, 7 tests, plus a dedicated Stage 3 end-to-end test through the real Sentry adapter — `sentryIntegrationBoundaries.test.ts`). Browser errors/rejections flow through the service (`globalErrorHandlers.test.ts`, 5 tests). Breadcrumbs flow through the service (`connectivityBreadcrumbs.test.ts` 5, `RouteTracker.test.tsx` 4 including a genuine `<StrictMode>` render test added this stage). Approved identity context flows correctly, restricted to `actorId`/`businessId`/`customerId` (`observabilityService.test.ts` CR1 tests, `sentryPrivacy.test.ts`). Sign-out clears identity and correlation state (`authLifecycle.test.ts`, 4 tests, using a real Firebase `onAuthStateChanged` event, never a fabricated one). Correlation IDs survive sanitization — the Stage 3-disclosed defect (a UUID-shaped id could be silently redacted) is fixed and proven (`observabilityService.test.ts`). Initialization happens once (`sentryProvider.test.ts` "StrictMode-safe" test, plus this stage's genuine `<StrictMode>` render test for `RouteTracker`). Duplicate capture is controlled (module-level guards in `globalErrorHandlers.ts`/`connectivityBreadcrumbs.ts`/`sentryProvider.ts`, all tested). Provider failures do not break application operation (every method independently try/catch-wrapped, tested at both the service and adapter layers). No-op operation remains fully functional (unchanged, 190/190 tests pass with the no-op provider as the actual runtime default). |
| **Failed controls** | None found after this stage's corrections. |
| **Unmet conditions** | Frontend-to-backend correlation propagation is **not implemented** — no API/network layer exists in `apps/web/src` (confirmed by repository-wide grep for `httpsCallable`/`fetch(`, zero matches outside a doc comment noting the absence). This is a documented, Founder-approved scope boundary from Stage 2, not a defect, and does not block Integration Ready for the frontend-only scope Stages 1–3 were authorized to build. |
| **External dependencies** | None for the frontend-only integration this state covers. |
| **Risks** | None introduced. The one genuine defect found during this stage's own validation (free-text email/phone redaction gap, §16) has been fixed and tested before this classification was finalized. |
| **Action required to advance** | None to remain at PASS for frontend-only integration. Advancing correlation to true end-to-end would require the separately-scoped frontend API/network abstraction layer — out of `ENG-P1-003`'s scope entirely. |

---

## 5. Staging Ready

**Classification: PASS WITH CONDITIONS**

| | |
|---|---|
| **Scope** | Whether the *codebase and documentation* are ready for a separately authorized staging integration — this classification does not itself authorize staging activation. |
| **Evidence** | `config.ts`/`providerSelection.ts` accept a `VITE_OBSERVABILITY_DSN` and activate deterministically when a real, valid staging DSN is supplied; nothing else in the code needs to change to point at a real staging Sentry project. |
| **Passed controls** | The code path from "DSN configured" to "Sentry receives sanitized diagnostic data" is fully implemented, tested (97 Sentry-specific tests), and does not require any further engineering work to function once a real DSN exists. |
| **Failed controls** | None. |
| **Unmet conditions (all external, not code defects — per the task's own framing, "the absence of a real account or DSN should normally be treated as an unmet external condition, not a code defect")** | A Sentry organisation; a Sentry project; acceptance of Sentry's terms of service; a real staging DSN; controlled staging environment configuration (a `.env` value only the Founder/ops sets, never committed); a privacy/legal review of what a staging environment may transmit; a decision on who has staging Sentry access; a data-retention decision; alert-recipient configuration; a release/environment naming convention (e.g. `staging`, matching `VITE_OBSERVABILITY_RELEASE`); an explicit decision on source-maps (not implemented in code at all — deliberately out of scope, §Appendix C); execution of the Manual Validation Plan (Appendix F) in the real staging environment once the above exist; any staging-specific network/CSP configuration Sentry's ingest endpoint requires; a named incident-response owner for staging alerts. |
| **External dependencies** | All of the above — none can be resolved by further coding. |
| **Risks** | Low, contingent on the unmet conditions above being resolved deliberately rather than defaulted. The architecture itself (disabled-by-default, privacy-filtered, non-load-bearing) minimizes risk even during a staging rollout. |
| **Action required to advance** | Founder/Technical Lead completes the external actions in Appendix D (Provider Onboarding Action List), then executes the Manual Validation Plan (Appendix F) against the resulting real staging DSN. |

---

## 6. Production Ready

**Classification: NOT YET ASSESSABLE**

| | |
|---|---|
| **Scope** | Whether the implementation is genuinely ready for production activation — not merely whether the adapter compiles and tests pass. |
| **Evidence** | Same code-level evidence as Integration/Staging Ready. No staging evidence exists yet (Staging Ready is itself `PASS WITH CONDITIONS`, not yet executed against a real environment) — production readiness cannot be meaningfully assessed ahead of that. |
| **Passed controls** | The code-level controls that would also apply in production (privacy filtering, disabled-by-default, resilience, no-op fallback) are already proven — the same evidence as Architecture/Integration Ready. |
| **Failed controls** | Not applicable — no production-specific control has been attempted or failed; this is a readiness gap, not a defect. |
| **Unmet conditions** | Everything listed under Staging Ready, **plus**: production privacy approval (distinct from staging); a production Sentry project and DSN, separate from staging; a secret-management approach for the production DSN (even though a DSN is a public identifier, not a secret, its distribution and rotation should still follow a controlled process); environment separation verified in practice, not only in principle; data-retention controls approved for production volumes; production access control (who can view production error data, which may include customer-adjacent context even after sanitization); a named incident owner and alert-routing decision; a release-naming convention for production; a deployment and rollback procedure specific to enabling/disabling diagnostics in production (Appendix E covers the code-level rollback; a production activation/deactivation runbook is a separate, not-yet-written operational document); an operational runbook; consent/privacy-notice implications reviewed by whoever owns the platform's privacy notice; a source-map decision for production (currently: no source-map upload exists at all — stack traces would be minified/unreadable in Sentry until this is explicitly decided and implemented as a separate, later task); **staging evidence itself**, which does not yet exist; a production smoke-test plan; monitoring/on-call response responsibilities. |
| **External dependencies** | All of the above. |
| **Risks** | Activating production diagnostics before staging validation and the above decisions would be premature — this is exactly why the classification is `NOT YET ASSESSABLE` rather than a numeric pass/fail: there is no evidence yet to grade. |
| **Action required to advance** | Complete Staging Ready's conditions and execute the Manual Validation Plan in staging first. Only after real staging evidence exists does a Production Ready re-assessment become meaningful — attempting it now would require manufacturing evidence, which this report does not do. |

---

## Appendix A — Staging Activation Checklist

Founder/Technical-Lead-owned, in recommended order:

1. Decide Sentry organisation ownership and billing.
2. Accept Sentry's terms of service.
3. Select a plan level appropriate for staging volume.
4. Create the Sentry project for `11thONUS` (or confirm naming convention).
5. Choose hosting/data-region options if Sentry offers them for this plan.
6. Generate a staging DSN.
7. Set `VITE_OBSERVABILITY_ENABLED=true`, `VITE_OBSERVABILITY_PROVIDER=sentry`, `VITE_OBSERVABILITY_DSN=<staging DSN>` in the staging environment's own configuration (never committed to `.env.example`).
8. Set `VITE_OBSERVABILITY_RELEASE` to a real release identifier for traceability.
9. Complete a privacy/legal review of what staging may transmit (should mirror this report's Appendix B).
10. Decide staging Sentry access (who can view captured events).
11. Decide staging data retention.
12. Decide alert recipients for staging (if any — staging alerting is often intentionally muted).
13. Confirm the ingest endpoint is reachable from the staging network (no CSP/firewall block).
14. Execute the Manual Validation Plan (Appendix F) against the real staging DSN.
15. Record the outcome and re-run this report's Staging Ready classification with real evidence.

## Appendix B — Production Activation Checklist

Everything in Appendix A, plus:

1. A separate production Sentry project and DSN (never reuse the staging DSN).
2. Production privacy approval, distinct from staging.
3. A documented secret-management/rotation approach for the production DSN.
4. Production access control decision.
5. Production data-retention decision.
6. Named incident owner and alert-routing configuration.
7. A production release-naming convention.
8. A production activation/deactivation runbook (separate from the code-level rollback in Appendix E).
9. Consent/privacy-notice review by whoever owns the platform's customer-facing privacy disclosures.
10. An explicit source-map decision — currently unimplemented; if approved later, it is new, separately scoped work, not a flip of an existing flag.
11. A production smoke-test plan (see Appendix F's structure as a starting template).
12. Monitoring/on-call ownership for production alerts.
13. Staging evidence from Appendix A, items 14–15, completed and reviewed first.

## Appendix C — Provider Onboarding Action List (External Founder Actions)

Every action below requires Founder or otherwise-authorized human control. None were performed by this or any prior `ENG-P1-003` stage.

**Mandatory before any real activation:**
- Select/approve the Sentry organisation.
- Accept Sentry's terms.
- Decide account ownership.
- Select plan level.
- Create the project (staging, then separately production).
- Generate the relevant DSN(s).
- Configure the relevant secrets/environment values.
- Approve staging (then production) data transmission.
- Approve privacy disclosures.
- Approve user access.
- Set retention.
- Decide alert recipients.
- Authorize production activation specifically (a separate decision from staging).

**Optional enhancements (not required for any of the above, and explicitly out of this stage's scope):**
- Source-map upload (currently unimplemented).
- Session replay, tracing, or profiling (currently disabled by design — enabling any of these is a new, separately scoped decision, not a configuration toggle).
- A feedback widget (transitively available in the SDK, never wired in).

## Appendix D — Rollback Procedure

**Code-level rollback** (if a defect were found post-merge): `git revert` of the relevant stage's commit(s) — every `ENG-P1-003` stage's changes are additive or narrowly scoped; no existing file's prior behavior was altered except the two disclosed, tested fixes (Stage 3's correlation-sanitization-order fix; this stage's free-text email/phone pattern addition), both of which are themselves safe to keep even under a partial revert.

**Runtime rollback** (if Sentry needed to be disabled after a real activation): set `VITE_OBSERVABILITY_ENABLED=false` (or unset `VITE_OBSERVABILITY_DSN`) in the relevant environment and redeploy — `selectProvider()` falls back to the no-op provider immediately, with no code change required. This is the fastest, lowest-risk rollback path and should be the default choice over a code revert for any activation-related incident.

## Appendix E — Privacy Verification Checklist

Each item below is proven by an automated test, not merely asserted — see the companion implementation report §15 for the exact test names.

- [x] Phone numbers — structured field (key-based) and free-text (pattern-based, fixed this stage) both redacted.
- [x] Email addresses — structured field and free-text (fixed this stage) both redacted.
- [x] Loyalty numbers — structured field redacted (closed-list extension, Stage 3).
- [x] Authentication tokens/authorization headers — free-text pattern redacted.
- [x] Query-string-embedded tokens — redacted (no query-string *parsing* exists at all; `RouteTracker` never even reads `location.search`).
- [x] Customer-entered text — email/phone shapes now covered; not a general-purpose PII-content scanner (disclosed limitation, §16 of the implementation report).
- [x] Exception custom properties — sanitized structurally.
- [x] Nested exception causes — walked to a bounded depth, each level sanitized.
- [x] Breadcrumb messages and metadata — both sanitized.
- [x] Raw route query parameters — never captured at all (stronger than redaction).
- [x] User identity fields — allow-listed to `actorId`/`businessId`/`customerId` only, enforced at runtime, not only by type.
- [x] Local-storage/session-storage values — never read by any observability code path (no code path exists).
- [x] Request/response payloads — never captured (no API/network layer exists).
- [x] Component props — never captured (only `componentStack`, which contains component names/positions, not values).
- [x] Component stacks — sanitized as text before reaching a provider.
- [x] `integrations: []` confirmed intentional and effective (Sentry's own default integrations verified disabled by name against the installed SDK's type declarations).

## Appendix F — Manual Validation Plan (Bounded, Deferred to a Real Staging Environment)

**Purpose:** a bounded set of manual checks to execute once a real staging DSN exists (Appendix A). None require a real DSN to *plan*; none should be executed *before* one exists.

| # | Check | Expected result |
|---|---|---|
| 1 | Load the app with diagnostics disabled (shipped default) | No network call to any diagnostics endpoint; app functions normally |
| 2 | Load the app with a real staging DSN configured | Sentry SDK initializes once; no console errors |
| 3 | Trigger a React render error | Fallback UI shows the neutral placeholder; event appears in Sentry with sanitized `componentStack` |
| 4 | Trigger a global browser error (e.g. `throw` in a `setTimeout`) | Event appears in Sentry; no duplicate capture |
| 5 | Trigger an unhandled promise rejection | Event appears in Sentry with the rejection reason, sanitized |
| 6 | Navigate between routes | Navigation breadcrumbs appear attached to the next captured event |
| 7 | Go offline, then perform an action | An "offline" breadcrumb appears; app continues functioning |
| 8 | Come back online | An "online" breadcrumb appears |
| 9 | Sign in, then trigger an event | Approved identity fields (`actorId`/`businessId`/`customerId`) appear on the event; nothing else does |
| 10 | Sign out, then trigger another event | No identity fields appear; correlation id differs from the signed-in session's |
| 11 | Begin a workflow, trigger an event, end the workflow | Correlation id present on the event, matches the active workflow |
| 12 | Simulate a blocked/unreachable Sentry endpoint (e.g. via browser devtools network blocking) | Application continues operating normally; no user-visible failure |
| 13 | Inspect 3–5 real captured events in the Sentry dashboard | No phone number, email, loyalty number, auth token, or other item from Appendix E's checklist appears anywhere in the event, including `extra`/breadcrumb data |

**Completed this stage (automated + local, no real DSN):** all of the above except items 2–3's *real Sentry dashboard* observation and item 12's *real* network-blocking scenario — those specific sub-parts require a real DSN and are deferred. Every other behavior above has direct automated-test evidence (see the companion implementation report).

**Deferred to staging:** confirming real events actually arrive in a real Sentry project's dashboard and visually inspecting their content (items 2, 3's dashboard-visible half, 12's real-network-block half, 13 in full).

**Deferred to production:** nothing beyond what Appendix B already lists as production-specific — the manual checks themselves are environment-agnostic and would be re-run in production using the same table.

## Appendix G — Known Limitations and Deferred Capabilities

- Frontend-to-backend correlation propagation: not implemented, blocked on the not-yet-built frontend API/network abstraction layer (Stage 2 disclosure, unchanged).
- End-to-end correlation: not demonstrated, and must not be claimed until the above exists.
- `sanitizeText()`'s free-text redaction (including this stage's new email/phone patterns) is pattern-based and conservative by design — it is not a general-purpose PII-content scanner and cannot guarantee every possible shape of sensitive free text is caught; it is scoped to the closed list of shapes explicitly named across Stages 1–4.
- No source-map upload exists — production stack traces in Sentry would be minified/unreadable until this is separately decided and implemented.
- No session replay, tracing, or profiling — deliberately disabled; enabling any of these is new, separately scoped work requiring its own privacy/security review, not a configuration flip.
- Route-level/feature-level error boundaries beyond the single root boundary: not built, since the application still has one route and no built features (Stage 2 disclosure, unchanged).
