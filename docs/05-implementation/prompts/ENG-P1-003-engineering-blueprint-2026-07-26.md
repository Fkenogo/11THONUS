> **Title:** ENG-P1-003 — Operational Observability Layer — Engineering Blueprint
> **Version:** 1.0 · **Status:** Design only — not yet implemented · **Classification:** Working (engineering design record)
> **Governing document:** [DEC-PROV-005](../../00-governance/decisions/decision-register.md) (`CONFIRMED`); [TRD20](../../02-technical/trd/20-deployment-and-operational-resilience.md); [TRD22 §22.11](../../02-technical/trd/22-mvp-implementation-and-delivery.md); [Platform Constitution](../../00-governance/platform-constitution.md) CP-013
> **Governing task:** "TASK — ENG-P1-003-BP: Operational Observability Blueprint"
> **Source-of-truth path:** `docs/05-implementation/prompts/ENG-P1-003-engineering-blueprint-2026-07-26.md`
> **Date:** 2026-07-26

# ENG-P1-003 — Operational Observability Layer — Engineering Blueprint

## Before Doing Anything — Analysis

This document is **design only**. It does not implement observability, install a dependency, configure Firebase, configure Sentry, create a provider account, or modify application code. It answers one question in full: *how does 11thONUS know when something is wrong?* — across the browser, the backend, infrastructure, the platform as a whole, and the engineers who operate it.

**Entry conditions verified before this document was written** (full detail in the accompanying implementation report): PR #17 merged (`494dca103b5970e332f64b9f9c9065ac893dc46a`); post-merge CI green on that exact commit; `DEC-PROV-005` `CONFIRMED` (Option C — native backend observability with dedicated frontend diagnostics, initial implementation target Sentry, architecture-only approval); `ENG-P1-003` `Ready`; no existing approved blueprint found for `ENG-P1-003`.

**What this blueprint inherits, unchanged, and does not redesign:**

- **The architecture DEC-PROV-005 already confirmed** — Cloud Logging is the authoritative operational log; Cloud Monitoring is the authoritative backend monitoring platform; frontend diagnostics use a dedicated platform (initial implementation target Sentry); no backend Sentry; no duplicate logging.
- **TRD20 §20.22–20.36's observability architecture** — logs, metrics, traces, health checks, alerts, dashboards, audit records, Trust Events; structured `OperationalLog` shape; correlation-ID discipline; log severities; retention principles.
- **`ENG-P1-002`'s already-built, already-`Complete` contract layer**: the `OperationalLog` type (`functions/src/shared/logging/operationalLog.ts`), the shared `logger.ts` writer (targets Cloud Logging via `firebase-functions/logger`), the 14 closed `ErrorCategory` values (`functions/src/shared/errors/errorCategories.ts`), the shared `PlatformError` contract, and the correlation-ID service (`generateCorrelationId`/`resolveCorrelationId`). This blueprint references these by name and does not redefine them.

**Terminology mapping.** The platform's own vocabulary is `businessId`, not "tenant" — the word "tenant" appears exactly once in the whole repository (TRD8, in an unrelated Firebase Authentication context) and is not part of this platform's data model. Wherever this blueprint's own required section list uses "tenant," it is mapped onto `businessId`, the field `OperationalLog` and `BaseMetadata` already use.

**What this document is not.** It is not an `ENG-P1-002`-style implementation blueprint (no planned file inventory, no repository structure, no code). It is not organizational incident-response policy. It is not a dashboard design, an alert-rule list, or SDK integration guide.

---

## 1. Observability Philosophy

Per Platform Constitution **CP-013 — Observe Everything**: *"Operational behaviour should be measurable. Problems should become visible before they become critical."* This blueprint treats seven distinct concepts as related but not interchangeable — a common failure mode in observability design is collapsing them into one, which produces either noisy alerting or blind spots.

| Concept | Responsibility | Answers |
|---|---|---|
| **Operational visibility** | The general property that a system's internal state is knowable from outside it, without guessing | "Can we tell what's happening right now?" |
| **Diagnostics** | Structured facts captured at the moment something notable happens, sufficient to reconstruct what occurred | "What exactly happened, and in what order?" |
| **Monitoring** | Continuous, aggregate observation of system and business health over time | "Is the platform healthy right now, and how does that compare to normal?" |
| **Alerting** | The escalation layer that turns a monitored signal crossing a threshold into a notification to a responsible person | "Does a human need to act, and who?" |
| **Logging** | The raw, timestamped record of discrete events, written as they occur | "What did the system do, in its own words?" |
| **Tracing / correlation** | The thread that connects every log, event, and metric produced by one logical workflow, across every service it touched | "Which of these thousands of log lines belong to the same customer action?" |
| **Incident investigation** | The human process of using the above five to determine root cause and resolution | "Why did it happen, and how do we stop it happening again?" |

Logging is the foundation; correlation makes logging navigable; monitoring aggregates logs and metrics into trends; alerting acts on monitoring; diagnostics is what a human reads during an incident; incident investigation is the discipline that uses all of it. No layer substitutes for another — an alert without a correlation ID to follow is a dead end, and a log without a severity is noise nobody triages.

---

## 2. Architecture

### 2.1 Primary data flow

```
Browser (React app)
   |
   |  user action / render / network call
   v
Frontend Diagnostics Capture  ---->  Dedicated Frontend Diagnostics Platform
   |                                  (initial implementation target: Sentry)
   |  authenticated API call (correlationId attached)
   v
API (Firebase callable / HTTPS Cloud Function entry point)
   |
   v
Cloud Functions (shared command: authenticate -> validate -> log -> respond)
   |
   |  domain read/write, outbox write (same transaction)
   v
Firestore (application state, idempotency records, outbox collection)
   |
   |  every shared-command step and every outbox transition writes a
   |  structured OperationalLog entry via the ENG-P1-002 logger
   v
Cloud Logging  (authoritative operational log — every environment)
   |
   |  log-based metrics, severity aggregation, retention policy
   v
Cloud Monitoring  (authoritative backend monitoring — dashboards, SLIs, alerts)
   |
   v
Engineering  (on-call, incident investigation, postmortem)
```

The Frontend Diagnostics Platform is a **parallel branch**, not a step in the Cloud Logging pipeline — it never writes to Cloud Logging, and Cloud Logging never writes to it. The two streams are joined only at the human/investigation layer (§7), by a shared correlation ID the frontend attaches to its own diagnostic events and to every API call it makes.

### 2.2 Where frontend diagnostics fits

```
                    +-------------------------------+
                    |         Browser Runtime        |
                    |                                |
                    |  React tree   Network layer     |
                    |     |             |             |
                    |     v             v             |
                    |  Frontend Diagnostics Capture    |
                    |  (error boundary, unhandled      |
                    |   rejection hook, network-        |
                    |   failure hook — see §5)          |
                    +----------------+-----------------+
                                     |
                    correlationId either generated here
                    (workflow originates in the browser)
                    or carried in from a prior response
                                     |
                     +---------------+----------------+
                     |                                 |
                     v                                 v
        Dedicated Frontend Diagnostics          Outgoing API call
        Platform (Sentry, initial target)       (correlationId header/field)
                     |                                 |
           independent of backend                      v
           pipeline; never touches                 Cloud Functions -> ... -> Cloud Logging
           Cloud Logging directly                  (see §2.1)
```

### 2.3 Layer responsibilities

| Layer | Owns | Does not own |
|---|---|---|
| Browser / Frontend Diagnostics Platform | Frontend error capture, frontend performance signal, release/environment tagging for the frontend build | Backend logs, business-domain state, security/audit records |
| API / Cloud Functions | Structured logging via the existing `logger.ts`, correlation-ID propagation, error-category classification via `PlatformError` | Frontend rendering errors, browser-only failures |
| Firestore | Application state, idempotency records, outbox entries — the data whose *changes* generate operational logs | Log storage itself (Firestore is not a log store) |
| Cloud Logging | Every structured log entry from every environment, retained per §20.25's retention principles | Frontend-only diagnostic events (those live in the Frontend Diagnostics Platform) |
| Cloud Monitoring | Backend metrics, dashboards, alerting on backend/infrastructure signals (TRD20 §20.27–20.36) | Frontend crash-rate alerting (that is the Frontend Diagnostics Platform's own alerting surface) |

This is the same boundary the `DEC-PROV-005` Evidence Pack §6 already established at the decision level; this blueprint carries it into behavioral design.

---

## 3. Event Taxonomy

Every category below is a *classification of what is logged*, not a new field or a new contract — each maps onto the existing `ErrorCategory` set, `OutboxStatus`/`IdempotencyStatus` values, or the `OperationalLog.severity` scale already defined in `ENG-P1-002`. No new severity level or field is introduced here.

| Category | Destination | Severity (existing scale) | Retention expectation | Operational owner |
|---|---|---|---|---|
| **Application events** (normal, expected operational activity — e.g. a command completed) | Cloud Logging | `info` | Standard (TRD20 §20.25 — cost/operational-need governed, shorter than security logs) | Application domain owner |
| **Warnings** (unexpected but non-fatal condition) | Cloud Logging | `warning` | Standard | Application domain owner |
| **Recoverable errors** (a command failed but the system remains consistent — e.g. `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`) | Cloud Logging | `error` | Standard | Application domain owner |
| **Fatal errors** (unhandled exception; system integrity at risk) | Cloud Logging | `critical` | Extended (security/incident-value retention) | On-call engineer (application area, §8.4) |
| **Infrastructure failures** (Firestore unavailable, Functions cold-start failure, network partition) | Cloud Logging | `critical` | Extended | On-call engineer (infrastructure area) |
| **Validation failures** (`VALIDATION_FAILED`) | Cloud Logging | `warning` (client-caused) or `error` (unexpected shape) | Standard | Application domain owner |
| **Authentication failures** (`AUTH_REQUIRED`) | Cloud Logging | `warning`, escalating to `critical` on a sustained spike (TRD20 §20.35 lists "widespread verification failure" as a critical-alert condition) | Extended (security value) | On-call engineer (security area) |
| **Authorization failures** (`AUTH_FORBIDDEN`, `ACCOUNT_SUSPENDED`, `BUSINESS_INACTIVE`) | Cloud Logging | `warning`, escalating on volume | Extended (security value) | On-call engineer (security area) |
| **External service failures** (`INTEGRATION_FAILED`) | Cloud Logging | `error` | Standard | On-call engineer (integrations area) |
| **Retry exhaustion** (a retryable outbox/idempotency operation exhausts its retry budget) | Cloud Logging | `error`, escalating to `critical` if it reaches `dead_letter` | Standard, extended if `dead_letter` | On-call engineer (application area) |
| **Idempotency conflicts** (`IDEMPOTENCY_CONFLICT`; `IdempotencyStatus: "failed"`) | Cloud Logging | `warning` (expected duplicate-suppression case) or `error` (unexpected failure path) | Standard | Application domain owner |
| **Outbox failures** (`OutboxStatus: "dead_letter"`; `OutboxLastError.classification: "non_retryable"`) | Cloud Logging | `error`, `critical` at `dead_letter` | Extended (dead-letter volume is itself a TRD20 §20.27 technical metric) | On-call engineer (application area) |
| **Business-rule failures** (`INVALID_STATE_TRANSITION`, `PURCHASE_ALREADY_RESPONDED`, `REWARD_NOT_AVAILABLE`, `REWARD_ALREADY_REDEEMED`, `SUBSCRIPTION_LIMIT_REACHED`) | Cloud Logging | `warning` (expected business-flow rejection) | Standard | Application domain owner |

Every row above is backend-originated (Cloud Logging is authoritative regardless of category, per the confirmed architecture). Frontend-originated events (browser crashes, unhandled promise rejections, component rendering failures) are a separate taxonomy, defined behaviorally in §5 — they are captured by the Frontend Diagnostics Platform, not classified into this backend `ErrorCategory` table, because they occur before any authenticated API call exists to carry a `correlationId` backend-side.

---

## 4. Logging Model

This section **references, and does not redefine**, the contracts `ENG-P1-002` already implemented and closed.

- **Mandatory fields, required metadata**: the closed `OperationalLog` shape (`functions/src/shared/logging/operationalLog.ts`) — `timestamp`, `environment`, `severity`, `domain`, `service`, `operation`, `correlationId`, with optional `commandId`, `eventId`, `actorId`, `businessId`, `customerId`, `aggregateType`, `aggregateId`, `result`, `durationMs`, `errorCode`. This blueprint adds no field to that type.
- **Correlation IDs**: `generateCorrelationId()` / `resolveCorrelationId()` (`functions/src/shared/correlation/correlationId.ts`) — one ID per workflow, generated at the entry point, never regenerated mid-workflow, per TRD20 §20.26. The frontend's own responsibility under this model (§5, §7) is to generate a correlation ID at the point a user-initiated workflow begins in the browser (before any API call exists) and pass it as part of the first authenticated request, so the backend's `resolveCorrelationId` receives and keeps it rather than minting a second one.
- **Request IDs / trace IDs**: TRD20 does not define a separate "request ID" distinct from `correlationId` — this blueprint does not invent one. A Frontend Diagnostics Platform's own internal trace/transaction ID (e.g. Sentry's own `trace_id`) is a **second, platform-internal identifier**, not a replacement for `correlationId` — where the frontend platform is used, its trace ID should be attached as a tag alongside the platform's own `correlationId`, never instead of it, so cross-system investigation (§7) still has one common key.
- **Timestamps**: `OperationalLog.timestamp`, as already typed — no change.
- **Environment**: `OperationalLog.environment`, matching TRD20 §20.4/§20.6's Development/Staging/Production environment model (§10 of this blueprint).
- **Business / user (the brief's "tenant" and "user")**: `OperationalLog.businessId` and `OperationalLog.customerId`/`actorId` — already-defined optional fields; this platform has no separate multi-tenancy concept beyond `businessId`, per the terminology mapping stated above.
- **Sensitive-value guard**: `logger.ts`'s existing `assertNoSensitiveContent` already refuses JWT-shaped, long-token-shaped, and OTP-shaped values in the `result`/`errorCode` free-text fields before a write reaches Cloud Logging — this blueprint's own privacy model (§9) builds on this existing guard, it does not replace it.

---

## 5. Frontend Diagnostics

This section describes **behavior only** — no SDK code, no configuration values, no package name beyond the already-decided initial implementation target (Sentry, per `DEC-PROV-005`).

- **Capture boundaries.** Frontend diagnostics capture is scoped to the browser runtime only — it never reaches into Cloud Functions or Firestore directly. A capture boundary exists at each of the following points, each producing one diagnostic event when triggered:
  - **React error boundaries** — wrap the application at a small number of deliberate points (e.g., route-level), so one component's rendering failure degrades that region of the UI rather than crashing the whole application; each boundary trigger is one diagnostic event carrying the component tree location.
  - **Unhandled promise rejections** — a single, application-wide listener captures rejections that no `catch` handled, since these otherwise fail silently in the browser console only.
  - **Network failures** — a failed or unexpectedly-shaped response from an API call is captured as a diagnostic event distinct from an application error, because a network failure (offline, timeout, 5xx) has a different investigation path than a validated business-rule rejection the backend returned deliberately.
  - **Browser crashes** — captured via the platform's own "before unload after error" style signal where the browser environment supports it; this is a best-effort capture, not a guarantee, since a true browser crash may not leave time to report itself.
  - **Component rendering failures** — the specific case of a React error boundary triggering during render, distinguished from a *runtime* JavaScript error outside the render cycle, because the former usually has a directly-actionable component stack.
- **Offline behaviour.** When the browser has no network connectivity, diagnostic capture continues locally (an error boundary still catches; a rejection is still recorded) but transmission to the Frontend Diagnostics Platform is deferred until connectivity returns, consistent with this platform's PWA/offline-first posture (TRD20 §20.4's environment model does not distinguish "offline" as a separate environment — it is a connectivity state within any environment). A capture that never regains connectivity is lost at the frontend layer; this is an accepted, disclosed limitation, not a guarantee of eventual delivery (contrast with the backend's outbox, §6, which does guarantee eventual delivery for backend-originated events).
- **User-session breadcrumbs.** A rolling window of recent user actions (navigation, key interactions) is retained client-side and attached to a diagnostic event when one is captured, so an error report carries the sequence of steps that led to it — not a permanent session recording, a bounded trailing window.
- **PII redaction.** No diagnostic event may carry raw customer PII, authentication tokens, or payment data (§9 states the full, closed list). Redaction is applied **before** transmission leaves the browser, not after ingestion by the Frontend Diagnostics Platform — the platform-side scrubbing feature (where the chosen tool offers one) is a second, defense-in-depth layer, not the primary control.
- **Sampling.** Not every diagnostic event needs full-fidelity capture at every volume level — error events are captured at a high rate (approaching 100%, since errors are inherently rare relative to normal traffic), while high-volume, low-value signals (e.g. routine performance timing) may be sampled at a lower rate. The exact rate is an implementation parameter, not a blueprint decision, but the *principle* — errors are not sampled away, performance/breadcrumb volume can be — is a blueprint-level rule.
- **Rate limiting.** A single failure mode (e.g. a render loop that throws repeatedly) must not be allowed to flood the Frontend Diagnostics Platform or degrade the browser session itself — repeated identical captures within a short window are collapsed to one representative event plus a count, not sent individually.
- **Environment separation.** Frontend diagnostics for Development, Staging, and Production must never share one project/workspace, mirroring the same rule Cloud Environment & Deployment Strategy §8 already states for backend monitoring — each environment's frontend diagnostic stream is independently addressable, so a Staging error never pages anyone and a Production error is never diluted by Development noise.

---

## 6. Backend Observability

- **Cloud Logging** is the single authoritative destination for every backend-originated log, per `DEC-PROV-005`. Nothing in this blueprint routes a backend log anywhere else.
- **Structured logging** is already fully specified — `ENG-P1-002`'s `logger.ts`/`operationalLog.ts` (§4). This blueprint's only addition is the event-taxonomy mapping in §3.
- **Severity mapping** follows the existing five-level `OperationalLog.severity` scale (`debug`/`info`/`warning`/`error`/`critical`, TRD20 §20.24) exactly — §3's taxonomy assigns each event category onto this scale; no new severity is introduced.
- **Retry visibility.** Every retry attempt (idempotency re-check, outbox reclaim) is itself a loggable event, not a silent internal loop — a retry that succeeds on attempt N is distinguishable in Cloud Logging from a first-attempt success, so retry frequency (§12) is observable without special instrumentation.
- **Background jobs, scheduler jobs, queue processing.** These follow the same logging model as any other shared command — a scheduled/background invocation still authenticates its own execution context, still generates or resolves a correlation ID (typically generated fresh, since a scheduled job has no prior browser-originated workflow to inherit one from), and still logs through the same `logger.ts` path. No separate logging contract exists for background work.
- **Future event processing** (e.g. a future Pub/Sub migration, per `DEC-TECH-006`'s own "future Pub/Sub migration path" note) inherits this same model unchanged — the logging contract is transport-independent, since it operates on the `OperationalLog` type regardless of what triggered the write.
- **Cloud Monitoring metrics.** Backend metrics are drawn from Cloud Logging (log-based metrics) and from Cloud Monitoring's native GCP service metrics (Functions invocation counts, Firestore read/write volume, etc.) — see §12 for the specific recommended metric set. This blueprint does not implement any metric or dashboard.
- **Cloud alerts.** Alert *policies* are not created by this blueprint (explicitly excluded). This blueprint states only the *principle* alerts must follow, inherited from TRD20 §20.33–20.35: actionable, assigned, severity-based, deduplicated, rate-limited, linked to runbooks where possible — and that not every logged `error` needs an urgent notification (only `critical`, and sustained/volume-crossing `error` patterns, should page).
- **Error Reporting relationship.** Google Cloud Error Reporting is **not** part of this architecture for frontend visibility (its own documentation has no browser JavaScript SDK, per the `DEC-PROV-005` Evidence Pack §7 row 1) and is not separately adopted for backend visibility either, since Cloud Logging plus the existing `ErrorCategory`/`PlatformError` contract already gives the backend a closed, queryable error-classification system without a second product. Error Reporting is not excluded by policy — it simply has no gap left to fill once Cloud Logging and the `ENG-P1-002` contracts are in place.

---

## 7. Correlation Strategy

This is the description of how an engineer actually investigates an incident, end to end:

```
Browser issue reported (e.g. customer reports "verification failed")
   |
   |  find the correlationId — either from the Frontend Diagnostics
   |  Platform's own captured event (if the frontend generated one),
   |  or from the customer-visible reference the UI showed them
   v
Correlation ID
   |
   |  query Cloud Logging for every entry carrying this correlationId
   v
Backend logs
   |
   |  the shared command's own authenticate -> validate -> log -> respond
   |  sequence is now visible as an ordered set of OperationalLog entries
   v
Firestore operation
   |
   |  the specific document read/write the command performed, identified
   |  by aggregateType/aggregateId in the same log entries
   v
Outbox event
   |
   |  if the command produced a domain event, its outbox entry (status,
   |  retryCount, claimedAt, lastError) is queryable by the same
   |  correlationId or by the event's own eventId, logged alongside it
   v
Final outcome
   (completed / failed / dead_letter — with the OperationalLog "result"
    and "errorCode" fields, and the outbox/idempotency status, giving a
    complete, ordered account of what happened and why)
```

The frontend and backend halves of this chain are joined **only** through the correlation ID — there is no other cross-system key. This is why §4 and §5 both treat correlation-ID propagation as non-negotiable: if the frontend fails to attach a correlation ID to an API call, the chain breaks at exactly that point, and an engineer is left with two disconnected fragments (a Frontend Diagnostics Platform event, and an unrelated set of backend logs) instead of one investigable thread.

---

## 8. Incident Workflow

This is an **engineering workflow**, not organizational policy — it does not assign named individuals, on-call rotations, or paging tools; those are operational decisions outside this blueprint's scope, consistent with TRD20 §20.36's own statement that ownership "may begin with a small team, but responsibilities must remain explicit."

1. **Detection.** A `critical`-severity log entry, a sustained `error`-rate pattern, or a Cloud Monitoring alert condition crossing its threshold (§6) marks the moment an issue becomes known, as distinct from the moment it began.
2. **Classification.** The detecting signal is mapped onto §3's taxonomy (which category, which severity) and onto TRD20 §20.34's alert-severity scale (Informational/Warning/High/Critical) — this determines urgency, not blame.
3. **Investigation.** The correlation strategy (§7) is the primary tool: starting from the correlation ID (or, if none is yet known, from the affected `businessId`/`customerId`/time window), the engineer reconstructs the ordered sequence of `OperationalLog` entries, outbox/idempotency state, and (if the issue has a frontend component) the corresponding Frontend Diagnostics Platform event.
4. **Escalation.** A `Critical` or sustained `High` classification (§8.2) that the investigating engineer cannot resolve within the area they own is escalated to the next owner in TRD20 §20.36's ownership-by-area list (application, infrastructure, security, billing, integrations, data, support) — this blueprint states the escalation *trigger*, not the destination roster.
5. **Resolution.** The incident is resolved when the triggering condition (§1) no longer holds and the correlation chain (§7) shows a `completed` outcome for the affected workflow(s), or an explicit compensating action is recorded.
6. **Postmortem.** For any `Critical` incident, or any incident whose investigation revealed a gap in this blueprint's own taxonomy, logging model, or failure-mode coverage (§11), a postmortem records what was missed and feeds a correction back into this document (or a future engineering task) — this blueprint is itself an artifact subject to revision from real incidents, not a one-time design frozen at first implementation.

---

## 9. Privacy

**Never captured, in any diagnostic event or log entry, at any severity, in any environment:**

- passwords;
- authentication tokens (session tokens, JWTs, API keys);
- payment information (card numbers, mobile-money account identifiers, payment instrument details);
- personal identifiers beyond what the approved `OperationalLog`/`BaseMetadata` contracts already permit (`customerId`, `actorId`, `businessId` — opaque identifiers, not names, phone numbers, or addresses);
- authentication secrets (OTP codes, password-reset tokens);
- session secrets (session identifiers usable to impersonate an active session).

This list is **closed** — it is not "avoid where practical," it is a hard constraint on both the backend logging path (already partially enforced today by `logger.ts`'s `assertNoSensitiveContent` guard, §4) and the frontend diagnostics path (§5's "redaction before transmission" rule).

**PII masking / redaction rules:**
- Any field not on the approved `OperationalLog` field list, or not one of the identifiers explicitly named above, must not appear in a log entry at all — this is a closed-shape guarantee (the `OperationalLog` type itself), not a masking function applied after the fact, on the backend.
- On the frontend, where a third-party diagnostics platform's automatic capture (stack traces, request payload snapshots, breadcrumbs) may incidentally include values from the six categories above, redaction must be applied **before** the event leaves the browser — this is the specific, unresolved question the `DEC-PROV-005` Evidence Pack §8.1/§10 item 1 already flagged as requiring explicit scoping at implementation time; this blueprint restates it as a hard requirement rather than an open question, without itself specifying the redaction mechanism (that is implementation detail).
- Where a value's shape is ambiguous (e.g. a free-text field that might contain a token-shaped string), the existing conservative pattern-match approach (`logger.ts`'s `SENSITIVE_VALUE_PATTERNS`) sets the precedent: refuse to write rather than guess it's safe.

---

## 10. Environment Strategy

| Environment | What differs |
|---|---|
| **Development** | Live Firebase project (`europe-west1`, per `DEC-TECH-005`); Cloud Logging/Monitoring active but with relaxed alerting (per TRD20 §20.33's own allowance for reduced Development/Staging alerting) — never zero visibility. Frontend Diagnostics Platform project/workspace is separate from Staging/Production (§5's environment-separation rule); sampling may be higher (closer to 100%) since volume is low and every signal is useful during active development. |
| **Local Emulator** | Firebase Emulator Suite (`demo-11thonus`) — Cloud Logging/Monitoring are not reachable from the emulator in the same way (the emulator does not proxy to real GCP observability services); structured logs still flow through the same `logger.ts` path and remain inspectable via the emulator's own log output. Frontend diagnostics capture logic still runs (the code path is identical), but transmission to a real Frontend Diagnostics Platform project should be disabled or pointed at a non-production sandbox, since local/emulator activity is not real operational signal. |
| **Testing** (automated CI) | Same as Local Emulator for backend (emulator-based); frontend diagnostics transmission is disabled entirely during automated test runs — a test run is not a real user session and must not pollute any diagnostics platform project with synthetic events. |
| **Staging** | Live Firebase project, same region, full logging/monitoring active, alerting may be reduced relative to Production but never absent (TRD20 §20.33) — Staging is described elsewhere in this platform's governance as the pre-production validation gate, and a Staging issue nobody notices defeats that purpose. Frontend Diagnostics Platform project is separate from Production. |
| **Production** | Full logging, full monitoring, full alerting per TRD20 §20.34–20.36's severity model; extended retention for `critical`/security-relevant logs (§20.25); Frontend Diagnostics Platform project isolated from every other environment, with the tightest sampling/rate-limiting discipline since volume is highest here. |

This table does not introduce a new environment concept — Development/Local/Testing/Staging/Production is the environment model TRD20 §20.4 and the Cloud Environment & Deployment Strategy already define; this blueprint only states what differs *for observability specifically* within that existing model.

---

## 11. Failure Modes

The platform must continue operating whenever possible — observability failing should never become a second incident on top of the first.

| Failure | Required behaviour |
|---|---|
| **Cloud Logging unavailable** | The shared command path (`logger.ts`) must not throw or block the operation it is logging on account of a logging-transport failure — the underlying `firebase-functions/logger` writer already degrades to a local/console fallback in most failure modes; this blueprint's requirement is that **a logging failure never becomes a request failure**. The command's actual business outcome (success/failure) is determined independently of whether its own log write succeeded. |
| **Frontend diagnostics unavailable** (platform unreachable, script blocked, ad-blocker interference) | The browser application must continue functioning normally — diagnostics capture is instrumentation, not a dependency of any user-facing feature. A failed diagnostic transmission is itself, at most, a best-effort retry (bounded, per §5's rate-limiting principle) or silent drop; it is never a blocking condition for the user's workflow. |
| **Network unavailable** (browser offline) | Covered by §5's offline-behaviour rule — capture continues locally, transmission defers, and if connectivity never returns, the capture is lost at the frontend layer without affecting the application. |
| **Provider unavailable** (the Frontend Diagnostics Platform's own backend is down) | Equivalent to "frontend diagnostics unavailable" above — the browser application is not aware of, and does not depend on, the diagnostics provider's own availability. |
| **Logging write fails** (a specific `OperationalLog` write is rejected — e.g. by the `assertNoSensitiveContent` guard refusing a suspicious value) | The refusal is itself worth knowing about, but must not silently swallow the underlying operation either — the existing guard's behavior (throwing on the logging call, per `logger.ts`) means this is a caller-level concern already handled by `ENG-P1-002`'s contract; this blueprint does not change that behavior, only notes that a future implementer must not "fix" a refused write by weakening the guard. |
| **Diagnostic provider unreachable** (same as "provider unavailable," stated for completeness against the brief's own list) | Same behavior as above — no user-facing impact. |

The unifying principle across every row: **observability is additive, never load-bearing** for the customer-facing operation it observes. A purchase, a verification, a redemption must succeed or fail on its own business logic, never on whether the platform successfully told itself about it.

---

## 12. Operational Metrics

This section recommends *what to measure*, not how to build a dashboard (explicitly excluded) or which specific alert threshold to set.

| Area | Recommended metric |
|---|---|
| **Availability** | Core API availability (percentage of authenticated requests receiving a response within the expected time budget) — TRD20 §20.30 already sets an initial internal target (≥99.5% during MVP); this blueprint does not restate or revise that target. |
| **Error rate** | `error`/`critical`-severity `OperationalLog` entries as a proportion of total command invocations, broken out by `ErrorCategory` (§3) — so a spike in `AUTH_REQUIRED` is distinguishable from a spike in `INTEGRATION_FAILED`. |
| **Latency** | Callable-function duration (`OperationalLog.durationMs`, already a defined field) — per-operation, not just a platform-wide average, since a slow redemption and a slow reporting query have different operational implications. |
| **Retry counts** | Outbox `retryCount` distribution and idempotency re-check frequency — a rising retry count is an early warning ahead of an actual `dead_letter`/failure event. |
| **Outbox backlog** | Count of `OutboxStatus: "pending"` and `"processing"` entries older than an expected processing window — directly maps to TRD20 §20.27's "event backlog" and "dead-letter volume" technical metrics. |
| **Idempotency conflicts** | Count of `IDEMPOTENCY_CONFLICT` occurrences over time — a sustained rise can indicate a client retry-storm rather than genuine duplicate submissions, worth distinguishing operationally. |
| **Authentication failures** | Count of `AUTH_REQUIRED`/`AUTH_FORBIDDEN` occurrences, with the volume-based escalation TRD20 §20.35 already flags ("widespread verification failure" as a critical-alert condition). |
| **API failures** | Aggregate `INTEGRATION_FAILED` rate, broken out by which external integration point failed, since different integrations (payment, SMS, email) have different operational owners (TRD20 §20.36). |
| **Frontend crashes** | Error-boundary trigger rate and unhandled-rejection rate from the Frontend Diagnostics Platform, tracked as its own signal, not blended into the backend error-rate metric above — a frontend crash spike after a deploy is a different incident class than a backend error spike. |

---

## 13. Future Extensibility

This architecture is designed so that later domains attach to it without redesigning it — every future capability below produces `OperationalLog` entries through the same `logger.ts` contract, classifies its own errors within the same closed `ErrorCategory` shape (extended by a future TRD change if a genuinely new category is needed, never by informal reuse of an existing one for a different meaning — per `errorCategories.ts`'s own documented rule), and is joined to the rest of the system by the same correlation ID.

| Future capability | How it fits without redesign |
|---|---|
| **Payments** | Payment confirmation processing is already named in TRD20 §20.29's Service-Level Indicators and §20.35's critical-alert list ("payment confirmation corruption") — it is a domain that logs through the existing contract; this blueprint's taxonomy (§3) already has `INTEGRATION_FAILED` and business-rule-failure categories that a payment provider's own failures classify into without a new category. |
| **Rewards** | Already partially covered — `REWARD_NOT_AVAILABLE`/`REWARD_ALREADY_REDEEMED` are existing `ErrorCategory` values; reward-domain events are business-domain operational logs per §3, with the same destination (Cloud Logging) and ownership model. |
| **Notifications** | TRD20 §20.28 already lists "missing Trust Events" and notification-delivery metrics as business workflow metrics this architecture already accounts for; a future notification-provider integration is another `INTEGRATION_FAILED`-classified external service, observed the same way as any other. |
| **Reporting** | Reporting-projection delay is already named in TRD20 §20.27's technical metrics list; a future reporting pipeline's own failures are infrastructure/backend failures per §3, requiring no new taxonomy row. |
| **Mobile Apps** | A future native mobile client is a second "frontend" in this architecture's sense (§2.2/§5) — it would need its own Frontend Diagnostics Platform integration (potentially the same platform, mobile-specific SDK, a future implementation decision outside this blueprint), but the correlation-ID discipline (§7) and the backend-side contract (§4) are unchanged; mobile is not a new backend concern. |
| **Partner APIs** | A partner-facing API surface is another authenticated entry point into the same shared-command path (§2.1) — it logs through the same contract, is classified by the same `ErrorCategory` set (with `AUTH_FORBIDDEN`/`INTEGRATION_FAILED` already covering partner-specific auth/integration failures), and requires no new observability concept, only a new `service`/`operation` value within the existing `OperationalLog` shape. |

---

## 14. Implementation Sequencing

This blueprint does not authorize or begin implementation. If and when `ENG-P1-003` implementation is separately authorized, the natural sequencing this design implies (stated for planning purposes only, not as a commitment):

1. **Security/Storage Rules deny-by-default foundation** — `ENG-P1-003`'s other named scope (Security/Storage Rules), independent of observability, has no sequencing dependency on the items below and may proceed in either order relative to them.
2. **Backend observability alignment** — since Cloud Logging/Monitoring require no new SDK or dependency (they are already the transport `logger.ts` uses), this is the lowest-risk, smallest-diff first step: confirming/documenting the existing `logger.ts` output actually reaches Cloud Logging in a live (not emulator-only) environment, and defining (not yet creating) the specific Cloud Monitoring metrics/alerts from §12/§6 as an implementation task of its own.
3. **Frontend capture-boundary implementation** — React error boundaries, the unhandled-rejection listener, and the network-failure hook (§5), built and tested against a **local/mock** diagnostics sink first, before any real provider is involved — this validates the capture behavior independent of the provider question.
4. **Frontend Diagnostics Platform integration** — the point at which a Sentry account, dependency, and configuration would actually be introduced; this is a separate, explicitly-scoped task requiring its own authorization (per `DEC-PROV-005`'s own stated non-authorization list), including the redaction-before-transmission implementation (§9) as a precondition, not an afterthought.
5. **Correlation-ID bridging** — attaching the frontend-originated correlation ID to the first authenticated API call, and (if the chosen frontend platform has its own trace ID) tagging that platform's events with the shared `correlationId` (§4/§7).
6. **Cross-system validation** — a deliberate test exercising the full chain in §7 (a frontend-triggered error whose correlation ID is then traceable through Cloud Logging), confirming the design in this blueprint actually holds end to end before Phase 1 exit is claimed.

Steps 2–6 are frontend-diagnostics-specific; nothing in them is a precondition for the Rules half of `ENG-P1-003`'s scope, and nothing in this sequencing commits to a specific work-package split — that decision belongs to the separately-authorized implementation task.

---

## Explicit Exclusions (restated)

This blueprint does not, and none of its sections should be read as implicitly authorizing: installing Sentry or any dependency; configuring Firebase; configuring Cloud Monitoring; creating a dashboard; creating an alert; implementing an SDK; changing application code; changing dependencies; changing configuration; changing infrastructure; or beginning implementation. It references `TRD20`, `TRD22 §22.11`, `DEC-PROV-005`, and the `ENG-P1-002` contracts throughout rather than redefining any of them.
