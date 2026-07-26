> **Title:** Evidence Pack — DEC-PROV-005 (Error Monitoring and Operational Observability Provider)
> **Version:** 1.0 · **Status:** Evidence record — decision preparation only, no conclusion adopted · **Classification:** Working (governance record — evidence)
> **Governing document:** [Decision Register](../decision-register.md) — this document does not modify the register
> **Governing task:** "TASK — DEC-PROV-005-PREP: Error Monitoring Provider Decision Evidence and Founder Brief"
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md`
> **Date:** 2026-07-26

# DEC-PROV-005 Evidence Pack

## 1. Purpose and boundary

This pack gathers evidence to support the Founder in choosing the approved error-monitoring and operational-observability provider or approach for Version 1. **It does not select a provider, does not change `DEC-PROV-005`'s status, and does not authorize `ENG-P1-003`.** All external facts are dated to their access date (2026-07-26); no traffic forecast is invented.

## 2. Exact decision question (live wording, Decision Register)

> **DEC-PROV-005 — Error monitoring provider** — Status: **OPEN_PROVIDER** · Priority: **D1** · Question: frontend + server error visibility tooling. Owner: Engineering Lead · Required by: Phase 1 · Blocks: observability foundation · Sources: TRD23 §23.23 · Dependencies: — · Final decision/date/approved: — · Notes: —

TRD23 §23.23 states the same requirement plainly: *"Error Monitoring — Frontend and server error visibility — Decision Deadline: Phase 1."* This decision question is not redefined here.

## 3. Existing architecture and monitoring baseline

### 3.1 What TRD20 already requires, independent of provider choice

TRD20 §20.22 (Observability Architecture) requires observability to combine logs, metrics, traces/correlation paths, health checks, alerts, dashboards, audit records, and Trust Events — covering both technical system health and business workflow health. This is a **closed architectural shape**, not a specific tool. Provider selection fills in *how* these categories are implemented; it does not add or remove a category.

Directly relevant sub-sections, verbatim scope (not restated in full — see the source file):
- **§20.23 Structured Logging** — a closed `OperationalLog` type (`timestamp`, `environment`, `severity`, `domain`, `service`, `operation`, `correlationId`, `commandId?`, `eventId?`, `actorId?`, `businessId?`, `customerId?`, `aggregateType?`, `aggregateId?`, `result?`, `durationMs?`, `errorCode?`) with the instruction: *"Sensitive information shall be excluded or masked."*
- **§20.26 Correlation IDs** — one correlation ID generated at a workflow's entry point, propagated unchanged through every downstream call, event, and log entry.
- **§20.27–20.28 Technical and Business Workflow Metrics** — an explicit list including frontend error rate, callable-function latency, function success/failure rates, notification-delivery success, event backlog, and multiple loyalty-domain-specific failure counters.
- **§20.31 Health Checks** — Healthy/Degraded/Unavailable/Unknown states for Firestore, Functions, and each external provider.
- **§20.33–20.36 Alerting** — severity-based, deduplicated, rate-limited, runbook-linked, with explicit on-call ownership by area (application, infrastructure, security, billing, integrations, data, support).

### 3.2 What is already built (`ENG-P1-002`, `Complete`, `Administratively Closed`)

The shared command foundation already implements the *logging and error* half of this architecture, independent of any external provider:

| File | What it does | Provider-relevance |
|---|---|---|
| `functions/src/shared/logging/logger.ts` | The single supported way to write an `OperationalLog` entry; transport is `firebase-functions/logger` (Cloud Functions' own structured-logging writer → Cloud Logging); refuses to write JWT-shaped, long-token-shaped, or OTP-shaped values in the two free-text fields (`result`, `errorCode`) | Any provider selected sits *downstream* of this writer (log-based ingestion) or *beside* it (a second, parallel SDK call) — it does not replace it |
| `functions/src/shared/logging/operationalLog.ts` | Defines the closed `OperationalLog` type matching TRD20 §20.23 exactly | Defines the shape any log-based provider integration would ingest |
| `functions/src/shared/errors/errorCategories.ts` | 14 closed `ErrorCategory` values (`AUTH_REQUIRED` … `INTEGRATION_FAILED`) per TRD11 §11.35 | A provider's issue-grouping/fingerprinting should be evaluated against whether it can key off this existing category set, not invent its own |
| `functions/src/shared/errors/platformError.ts` | The shared error contract every domain service throws | The object a provider's Node SDK would need to `captureException()` |
| `functions/src/shared/correlation/correlationId.ts` | `generateCorrelationId()` / `resolveCorrelationId()` — one ID per workflow, never regenerated mid-workflow | Any provider's own trace/transaction ID is a **second, provider-specific ID**; TRD20 §20.26's correlation ID remains the cross-system join key regardless of provider choice |

### 3.3 What does not exist yet

- **No frontend error handling of any kind.** `apps/web/src` contains only `config/`, `lib/`, `infrastructure/firebase/`, and `test/` — no `ErrorBoundary`, no `window.onerror`/`window.onunhandledrejection` hook, no client-side logging call. This is a genuine gap `ENG-P1-003` is scoped to close, not a partially-built feature.
- **No metrics, health checks, dashboards, or alerting implementation** — TRD20 §20.27–20.36 is fully unimplemented; only the logging/correlation/error-contract substrate exists.
- **No monitoring-provider SDK, dependency, or account of any kind** — confirmed by repository search; this pack adds none.

### 3.4 Frontend/backend stack facts (from the live repository)

- `apps/web`: React `^19.2.7`, Vite `^8.1.1`, TypeScript `~6.0.2` (`apps/web/package.json`).
- `functions`: Node.js engine `20` (`functions/package.json`), Firebase Cloud Functions (2nd gen, per `ENG-P1-001`), region `europe-west1` (`DEC-TECH-005`, `CONFIRMED`).
- Deployment targets: Development, Staging, Production Firebase projects, each isolated (TRD20 §20.5); Development and Staging are live-provisioned in `europe-west1` (per `EIR-ENG-P1-001`), Production is created but access-restricted.

## 4. Options evaluated

Per this task's own instruction not to add speculative vendors, exactly three options are evaluated — the only ones either the Decision Register, TRD23 §23.23, or the Cloud Environment & Deployment Strategy names or clearly permits:

- **Option A — Firebase/Google Cloud native**: Cloud Error Reporting + Cloud Logging + Cloud Monitoring + Cloud Trace, all already reachable from the existing GCP projects with no new vendor relationship.
- **Option B — Sentry**: a third-party, dedicated error/performance-monitoring SaaS product, explicitly named in TRD23 §23.23's category ("Error Monitoring") as the category-defining product this decision exists to evaluate against native tooling.
- **Option C — Bounded hybrid**: Sentry (or an equivalent frontend-capable third-party tool) scoped narrowly to *frontend error capture and release tracking*, with all backend/infrastructure observability (logs, metrics, traces, health, alerting, dashboards) remaining on Cloud Logging/Monitoring/Trace as already architected in TRD20. This is not a fourth vendor — it is Options A and B combined along the architecture boundary in §6, and is explicitly permitted by Cloud Environment & Deployment Strategy §8's own statement that the document *"does not select a monitoring or error-tracking provider"* and only constrains how whichever provider is chosen must be configured per-environment.

No fourth option (e.g., Datadog, New Relic, Rollbar, Bugsnag) is evaluated — none is named anywhere in the Decision Register, TRD23, or the Cloud Environment & Deployment Strategy, and introducing one would violate this task's explicit "no speculative vendors" instruction.

## 5. Evaluation methodology

Each option is scored against the 18 required criteria using three evidence tiers, stated per finding:
- **Verified fact** — confirmed directly from official current vendor/provider documentation or pricing pages (dated 2026-07-26), or from direct reading of this repository's own code/docs.
- **Reasoned inference** — a conclusion drawn from verified facts plus ordinary technical reasoning, not itself independently confirmed.
- **Provisional assumption** — a working assumption stated as such, flagged for confirmation before being relied upon.

Web research was conducted 2026-07-26 against official Sentry and Google Cloud documentation/pricing pages, with search-engine synthesis used only where a direct page fetch was blocked (truncated or redirected) — every such case is marked in the Source Register (§ below) with its specific limitation, following the same disclosure standard `DEC-LEGAL-006`/`DEC-TECH-005`'s evidence packs used.

## 6. Architecture boundary — what a provider replaces vs. what stays native

Per this task's explicit instruction, no option is assumed to replace every native platform capability. The seven categories:

| Category | Scope | Where it lives under Option A | Where it lives under Option B | Where it lives under Option C |
|---|---|---|---|---|
| **Application error reporting** | Uncaught exceptions, handled `PlatformError` captures, stack traces, issue grouping | Cloud Error Reporting (backend only — see §7.3 finding) | Sentry (frontend + backend) | Sentry (frontend), Cloud Error Reporting or log-based errors (backend) |
| **Infrastructure logs** | Cloud Functions runtime logs, Firestore/Storage operation logs, platform-level logs | Cloud Logging (native, unavoidable — Google writes these regardless of provider choice) | Cloud Logging (unavoidable) + optional Sentry log forwarding | Cloud Logging (native) |
| **Frontend performance monitoring** | Page-load, route-change, Core Web Vitals-style timing | Not covered — GCP has no first-party browser RUM product in this stack | Sentry `browserTracingIntegration` | Sentry `browserTracingIntegration` |
| **Backend function monitoring** | Callable-function latency, invocation counts, cold starts | Cloud Monitoring (native GCP metrics, free) | Sentry performance tracing (opt-in `tracesSampleRate`) or Cloud Monitoring | Cloud Monitoring (native) — cost-free path preferred here |
| **Business-domain operational logs** | Purchase Record failures, verification failures, reward/redemption failures (TRD20 §20.28) | `OperationalLog` via existing `logger.ts` → Cloud Logging (unaffected by provider choice — this is application code, not a vendor feature) | Same — `logger.ts` is unaffected regardless of provider choice | Same |
| **Security monitoring** | Auth failures, App Check rejections, admin-account activity | Cloud Logging + Cloud Audit Logs (native, closest fit to existing GCP IAM boundary) | Would require duplicating security-relevant log data into a third-party system — not recommended by this pack under any option | Stays on Cloud Logging/Audit Logs regardless of provider choice |
| **Audit records** | Immutable action records for compliance | Cloud Logging with a `_Required`/dedicated audit bucket, or an application-level audit collection (TRD-defined, not provider-defined) | Same as Option A — audit records are an application/architecture concern TRD20 already assigns to Firestore/Cloud Logging, not a third-party product's job | Same as Option A |

**Reasoned inference:** regardless of which option the Founder selects, infrastructure logs, business-domain operational logs, security monitoring, and audit records remain on Cloud Logging/Firestore — this is not a Sentry-vs-GCP choice at all, it follows directly from TRD20's existing architecture and this task's own instruction not to assume one provider replaces every native capability. The genuine decision is narrower than "pick a monitoring vendor": it is specifically **application error reporting** and **frontend performance monitoring**, the two categories where Option A has a confirmed capability gap (§7.3).

## 7. Comparative findings against the 18 evaluation criteria

| # | Criterion | Option A (GCP native) | Option B (Sentry) | Option C (Hybrid) |
|---|---|---|---|---|
| 1 | React/Vite frontend support | **Gap (verified fact).** Cloud Error Reporting's own documentation lists setup guides for Go, Java, Node.js, PHP, Python, Ruby, .NET — no browser-JavaScript SDK; for client apps it directs to **Firebase Crashlytics**, which is Android/iOS-only (verified fact — Crashlytics has no web/PWA product) | **Strong (verified fact).** Dedicated React SDK: `ErrorBoundary` component, React 19 `reactErrorHandler` on `createRoot`, `browserTracingIntegration()`; Vite explicitly supported via the Sentry Vite plugin, configured through `npx @sentry/wizard -i sourcemaps` | Same as B for the frontend slice |
| 2 | Firebase Functions/Node.js backend support | **Strong (verified fact).** Error Reporting natively supports Node.js; Cloud Functions logs flow into Cloud Logging automatically with zero SDK integration | **Strong (verified fact).** `@sentry/node` (Sentry's own dedicated Firebase Functions guide) or `@sentry/google-cloud-serverless` with `wrapHttpFunction`/`wrapEventFunction` helpers | Either A or B, per §6 — this pack does not recommend duplicating backend error capture across both |
| 3 | Cloud Logging integration | **Native (verified fact)** — it *is* Cloud Logging | **Partial (reasoned inference).** Sentry can ingest logs directly (5 GB included, pay-as-you-go beyond) but this is a **separate, parallel log store**, not an integration with the project's own Cloud Logging | Cloud Logging remains authoritative; Sentry used only for its own issue data, per §6 |
| 4 | Error capture and stack traces | **Backend only (verified fact, per row 1)** | **Both tiers (verified fact)** — automatic capture of "errors, uncaught exceptions, and unhandled rejections" | Both tiers, split per §6 |
| 5 | Source-map support | **Not applicable** — no frontend SDK to need one | **Strong (verified fact).** Multi-bundler support (Vite/Webpack/Rollup/esbuild) via the Sentry CLI/wizard upload workflow | Same as B for the frontend slice |
| 6 | Release and environment separation | **Reasoned inference.** Achievable via GCP project-per-environment (already the platform's own isolation model, TRD20 §20.5) plus log labels — no first-party "release" concept in Error Reporting itself | **Strong (verified fact).** Sentry has first-party `release`/`environment` tagging as a core primitive across all SDKs | Sentry's release tagging used for whichever slice(s) it covers |
| 7 | Alerting | **Verified fact, with a disclosed near-term cost change.** Cloud Monitoring alerting is currently free; Google has announced alerting will begin charging **no sooner than 2026-09-01**, at $0.35/metric-reference/month plus $0.50 per 1M query-condition points | **Verified fact.** Alerting is a core Sentry feature at every paid tier (issue alerts, metric alerts); the free Developer tier has more limited alerting | Alerting for the Sentry-covered slice via Sentry; for GCP-native metrics, aware of the pending Cloud Monitoring alerting charge |
| 8 | Performance monitoring and tracing | **Partial (verified fact).** Cloud Trace exists as a separate product for backend spans; no first-party frontend RUM | **Strong (verified fact).** `tracesSampleRate`, `startSpan()`, distributed tracing across frontend↔backend in one product | Sentry for frontend RUM + optional backend tracing; Cloud Trace as the native fallback |
| 9 | Correlation-ID support | **Full (verified fact, from this repo's own code).** `correlationId.ts` already implements TRD20 §20.26 independent of any provider; correlation IDs flow into `OperationalLog` regardless of monitoring choice | **Reasoned inference.** Sentry has its own `trace_id`, distinct from and not a replacement for the platform's `correlationId`; the two IDs would need to be attached to each other (e.g., correlationId as a Sentry tag) for cross-system joins to work — not automatic | Same as B — requires explicit tagging discipline if Sentry is used for any slice |
| 10 | Sensitive-data filtering and redaction | **Verified fact, from this repo's own code.** `logger.ts` already refuses JWT-shaped, long-token-shaped, and OTP-shaped values before they reach Cloud Logging | **Verified fact, provider-side.** Sentry supports configurable server-side/client-side scrubbing (`beforeSend` hooks, data-scrubbing rules) — but this is a **second, separately-configured** filter, not inherited from `logger.ts`'s existing guard | Both filters would need independent configuration and verification if Sentry is added for any slice — a genuine implementation cost, not automatic |
| 11 | Role-based access | **Reasoned inference.** Inherits existing GCP IAM roles/project structure — no new access model | **Verified fact.** Sentry has its own org/team/project role model, entirely separate from Firebase/GCP IAM | Introduces a second access-control system to administer if Sentry is used for any slice |
| 12 | Data residency and cross-border implications | **Verified fact.** Cloud Logging/Monitoring data location follows the configured region; `europe-west1` is an EU region (Belgium) — Google's own terms state EU-region data is processed within the EU (not necessarily the same country) — aligning with the already-`CONFIRMED` `DEC-TECH-005`/`DEC-LEGAL-006` region choice with no new cross-border question | **Verified fact.** Sentry offers an EU data-residency region (primary site Frankfurt, Germany), available on **all** plans including the free Developer tier, via a self-serve Data Processing Addendum (relying on the EU–US Data Privacy Framework plus Standard Contractual Clauses for any residual transfer) | Adds a second data controller/processor relationship and a second residency choice to make and document, alongside the platform's existing GCP residency position |
| 13 | Cost and free-tier suitability | See §9 (Cost Assessment) | See §9 | See §9 |
| 14 | Operational complexity | **Lower (reasoned inference).** No new account, no new SDK for the backend slice, no new access model; the disclosed frontend gap (row 1) is the tradeoff | **Higher (reasoned inference).** New account, new SDK on both frontend and backend, new scrubbing rules, new access model, new correlation-ID tagging discipline | **Highest single-integration cost, most complete coverage.** Two systems to operate, but each doing only what it is actually good at per §6 |
| 15 | Vendor lock-in | **Lower (reasoned inference).** Already fully committed to GCP for Firestore/Functions/Storage/Auth — Error Reporting/Logging/Monitoring add no *new* vendor relationship | **New, bounded (reasoned inference).** Sentry's own data model (issues, releases) is not GCP-portable, but the SDK integration surface (`captureException`, `ErrorBoundary`) is small and swappable if it must be replaced later | Same bounded new lock-in as B, scoped to only the frontend/perf slice |
| 16 | Integration effort | **Lowest for backend (reasoned inference)** — largely configuration, not new code, since Cloud Functions already writes to Cloud Logging automatically. **No integration exists for frontend** (row 1) | **Moderate, both tiers (reasoned inference)** — SDK install + `ErrorBoundary` wrap + Vite plugin (frontend); SDK install + function-wrap helpers (backend) | **Moderate** — Sentry frontend integration only; backend stays at Option A's near-zero effort |
| 17 | Suitability for Development, Staging, Production | **Verified fact, from this repo's own architecture.** TRD20 §20.5/§20.7 already mandates per-environment GCP project isolation, which Cloud Logging/Monitoring inherit automatically | **Reasoned inference.** Sentry supports environment tagging natively (criterion 6) but per-environment *project* separation (as opposed to environment *tags* within one Sentry org) is a configuration choice the team must make deliberately, per Cloud Environment & Deployment Strategy §8's own instruction that monitoring must never share one project/workspace/alert channel across environments | Same consideration as B for the Sentry-covered slice; Option A's native per-environment isolation covers the rest automatically |
| 18 | Alignment with the ENG-P1-002 logging/error foundation | **Strong (verified fact).** `logger.ts`'s transport already targets Cloud Logging directly — zero adaptation required | **Requires adaptation (reasoned inference).** `logger.ts` and `platformError.ts` would need a second call site (or a Cloud-Logging-to-Sentry forwarding pipeline) to reach Sentry at all; the 14-value `ErrorCategory` set and closed `OperationalLog` shape are not natively understood by Sentry's own data model and would need to be mapped (e.g., as tags) deliberately | Same adaptation cost as B, but scoped only to whichever slice uses Sentry |

## 8. Security and privacy assessment

### 8.1 Could customer/business/auth/payment data enter error payloads?

**Verified fact, from this repo's own code and TRD11/TRD20:** the platform's error contract (`platformError.ts`) and the 14 `ErrorCategory` values are structural (e.g., `PURCHASE_ALREADY_RESPONDED`, `REWARD_ALREADY_REDEEMED`) — they do not, by design, carry raw customer PII or payment data in the category itself. However:
- **Provisional assumption, flagged for confirmation before implementation:** stack traces captured by *any* error-monitoring tool (native or third-party) can incidentally include local variable values, request payloads, or function arguments at the point of failure — this is a generic risk of automatic error capture, not specific to either option, and is not yet mitigated by any monitoring-layer scrubbing rule (only `logger.ts`'s narrow JWT/token/OTP pattern guard exists today, and it only covers two specific `OperationalLog` fields, not arbitrary stack-trace content).
- This is an **unresolved question requiring explicit scoping in `ENG-P1-003`'s own implementation**, regardless of which provider is chosen — not something this evidence pack can close.

### 8.2 Default data collection and configurable scrubbing

- **Option A (verified fact):** Cloud Logging/Error Reporting collect exactly what the application writes — no default collection beyond what `logger.ts` and Cloud Functions' own runtime logs already produce.
- **Option B (verified fact):** Sentry's SDKs, by default, capture request data, breadcrumbs, and (if session replay is enabled) UI interaction recordings; `beforeSend` hooks and server-side scrubbing rules are available but are an **opt-in configuration the team must write**, not a default-safe posture.

### 8.3 EU/regional hosting options

Covered in criterion 12 (§7). Both options can be configured to keep data within the EU: Option A via the already-`CONFIRMED` `europe-west1` region; Option B via Sentry's EU data region (Frankfurt).

### 8.4 Subprocessors, retention, access, deletion/export

- **Option A:** Subprocessor and DPA terms are governed by the same Google Cloud Platform agreement already in force for Firestore/Storage/Auth (evaluated in depth for `DEC-LEGAL-006`'s Cross-Border Hosting Evidence Pack). **Reasoned inference, not independently re-verified in this pass:** Cloud Logging/Monitoring/Error Reporting are ordinary GCP services and should fall under the same organization-wide Google Cloud DPA and subprocessor list as the services `DEC-LEGAL-006` already evaluated — this should be explicitly confirmed (not assumed) before final reliance, since this pack did not re-fetch the DPA specifically naming these three services.
- **Option B:** Sentry publishes a Data Processing Addendum (version 5.1.0 dated 2024-05-29, per the DPA changelog found 2026-07-26) with a stated subprocessor list and notification obligations for subprocessor changes; retention is plan-dependent (30-day lookback on the free tier, up to 90 days on paid tiers); access control is Sentry's own org/team role model (criterion 11); deletion/export capabilities were **not independently verified in this pass** (flagged as an unresolved question, §10).

### 8.5 Rwanda/Burundi operating and pilot context

**This is technical/operational evidence, not legal advice**, per this task's own instruction. Relevant, already-`CONFIRMED` context:
- `DEC-LEGAL-006` (`CONFIRMED`, Phase 0E) already establishes the platform's cross-border hosting position for GCP services generally — Option A introduces no *new* cross-border question beyond what is already resolved.
- **Any Sentry usage (Option B/C) would be a new, additional cross-border data flow not yet evaluated under `DEC-LEGAL-006`'s existing analysis**, which was scoped to Firebase/GCP specifically. Whether Sentry's EU-region hosting and DPF+SCC transfer mechanism satisfies the same Rwanda Law N° 058/2021 Articles 48–50 / Burundi Loi n° 1/03 Articles 15–16 analysis `DEC-LEGAL-006`'s evidence pack performed for Google Cloud is an **open legal question this pack does not answer** — marked here for Founder/counsel review, not resolved.

## 9. Cost assessment

No precise Version 1 traffic forecast is invented; three usage bands are used, per this task's explicit instruction.

### 9.1 Low-volume development and pilot

- **Option A:** $0 (verified fact) — Cloud Logging's 50 GiB/month free tier and Cloud Monitoring's free-for-all-GCP-metrics tier comfortably cover a pilot's expected log/metric volume; Error Reporting itself carries no separate charge beyond the Logging/Monitoring data it reads.
- **Option B:** $0 (verified fact) — Sentry's free Developer tier (5,000 errors/month, 5M spans, 50 replays, 5 GB logs, 30-day retention) is very likely sufficient for a pilot's error volume, with the caveat that it is "limited to one user," which may not suit a multi-person engineering team.
- **Option C:** $0 — sum of the above; both free tiers apply independently.

### 9.2 Early operational use

- **Option A:** Low, usage-based (**reasoned inference**, no specific figure committed) — $0.50/GiB beyond the 50 GiB free Logging tier, $0.01/GiB/month for retention beyond 30 days; Monitoring remains free unless non-GCP custom metrics exceed 150 MiB/month; the pending alerting charge (§7 row 7) becomes relevant here if alert-policy count grows.
- **Option B:** Likely requires the **Team plan, $26/month** (billed annually) once error volume or team size exceeds the free tier's "one user" limit — Team and Business share the same base quota (50,000 errors, 5M spans); the difference is compliance/retention features, not volume.
- **Option C:** Option A's usage-based backend cost plus Option B's ~$26/month frontend-tier cost, if the free tier's team-size limit is exceeded.

### 9.3 Growth-stage considerations

- **Option A (reasoned inference):** costs scale linearly and gradually with actual log/metric volume — no plan "cliff," but also no volume discount structure evaluated in this pass.
- **Option B (verified fact, with reasoned extrapolation):** published cost-band references (third-party analysis, not Sentry's own pricing page, so treated as lower-confidence directional context only) suggest small teams (10–50K events/month) commonly pay $300–$1,200/year, and mid-sized organizations (500K–2M events/month) commonly see $6,000–$24,000/year on Sentry's consumption-based model — **this is third-party-sourced directional data, not a Sentry-published commitment, and should not be relied upon for budgeting without direct confirmation against Sentry's own current usage-based pricing calculator at decision time.**
- **Option C:** Sentry's growth-stage cost applies only to the frontend/error slice, not the full observability surface — likely lower total third-party spend than full Option B at the same scale, at the cost of operating two systems.

**No paid plan is committed to by this pack or any deliverable in it.**

## 10. Unresolved questions (not answered by this pack)

1. Whether stack-trace-level payloads captured by *any* monitoring provider could incidentally carry customer/payment data at the point of a specific failure (§8.1) — requires explicit scoping during `ENG-P1-003` implementation regardless of provider.
2. Whether Sentry's EU-region hosting and DPF+SCC transfer mechanism satisfies the existing Rwanda/Burundi cross-border legal analysis `DEC-LEGAL-006` performed for Google Cloud specifically (§8.5) — an open legal question, not a technical one.
3. Whether Cloud Logging/Monitoring/Error Reporting fall under the exact same Google Cloud DPA and subprocessor list `DEC-LEGAL-006`'s evidence pack evaluated for Firestore/Storage/Auth, or require separate confirmation (§8.4).
4. Sentry's data deletion/export capabilities were not independently verified in this pass (§8.4).
5. The pending Cloud Monitoring alerting charge (no sooner than 2026-09-01) has not been priced against this platform's expected alert-policy count (§7 row 7, §9.2).
6. No direct, verbatim-quoted figure for Cloud Logging/Monitoring pricing was obtained from a single successful full-page fetch in this pass — the $0.50/GiB, $0.01/GiB/month, and 150 MiB free-tier figures are corroborated across multiple independent search results and a partial Sentry-pricing-page fetch, but a direct fetch of `cloud.google.com/stackdriver/pricing` itself returned truncated content each attempt (see Source Register) — recommended for direct re-verification before any budget commitment.

## 11. Recommendation (Technical Lead perspective) — not a decision

**Recommended for discussion: Option C (bounded hybrid)** — Sentry scoped to frontend error capture, source maps, and frontend performance monitoring only; Cloud Logging/Monitoring/Trace retained for everything else, per the architecture boundary in §6.

**Basis, with evidence tiers made explicit:**
- **Verified fact:** Option A has a confirmed, structural gap for frontend/browser error visibility — Cloud Error Reporting's own documentation does not offer a browser JavaScript SDK, and Firebase Crashlytics (its suggested client-side alternative) is mobile-only. Since `DEC-PROV-005`'s own decision question is explicitly "**frontend + server** error visibility," Option A alone does not fully answer the question it was written to resolve.
- **Verified fact:** everything Option A already does well — backend error capture, structured logging, correlation IDs, business-domain operational logs, security/audit logs — requires zero new integration work, because `ENG-P1-002` already targets Cloud Logging directly.
- **Reasoned inference:** the narrowest change that closes the confirmed gap (frontend errors) without discarding the zero-cost, zero-new-vendor backend foundation already built is to add a frontend-only third-party tool, not to replace the backend foundation with one.

**What choosing this option would authorize:** scoping `ENG-P1-003`'s "monitoring init" sub-scope to include a frontend-only Sentry SDK integration (React `ErrorBoundary` + Vite source-map upload), with an explicit, separately-scoped data-scrubbing configuration task before any production traffic reaches it, and confirmation of open question #2 (§10) before Production use.

**What it would not authorize:** any backend Sentry integration, any change to `logger.ts`/`platformError.ts`'s existing transport, any dependency installation, any Sentry account creation, or `ENG-P1-003` implementation itself — all remain out of this task's scope and require their own separate authorization.

**Distinguishing this from the alternatives, honestly:** Option A alone is the lowest-cost, lowest-complexity, zero-new-vendor choice and would be a legitimate Founder decision if the frontend-visibility gap is judged acceptable to defer or fill with a smaller/cheaper tool than Sentry later. Option B alone (full Sentry) is the most complete single-vendor coverage but duplicates observability surface `ENG-P1-002` already built for free and introduces the most new lock-in, access-model, and cross-border surface. This pack recommends C over A only because the decision question is explicitly "frontend **and** server," not because A is deficient for anything within its own stated scope.
