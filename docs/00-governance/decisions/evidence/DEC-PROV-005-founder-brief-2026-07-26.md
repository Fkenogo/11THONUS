> **Title:** Founder Decision Brief — DEC-PROV-005 (Error Monitoring Provider)
> **Version:** 1.0 · **Status:** Brief for Founder review — no option marked approved · **Classification:** Working (governance record — evidence)
> **Governing document:** [Decision Register](../decision-register.md)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-PROV-005-founder-brief-2026-07-26.md`
> **Date:** 2026-07-26
> **Full evidence:** [DEC-PROV-005 Evidence Pack](DEC-PROV-005-error-monitoring-evidence-2026-07-26.md) · [Source Register](DEC-PROV-005-source-register-2026-07-26.md)

# Founder Decision Brief — DEC-PROV-005

## The decision question

*"Frontend + server error visibility tooling"* — the Decision Register's own wording. This blocks `ENG-P1-003` (Security/Storage Rules deny-by-default foundation + monitoring init) and, through it, Phase 1's exit.

## The three qualified options

No option outside these three is evaluated — none other is named anywhere in the Decision Register, TRD23, or the Cloud Environment & Deployment Strategy.

### Option A — Firebase/Google Cloud native (Cloud Error Reporting + Logging + Monitoring + Trace)

**Strengths**
- $0 at pilot volume; usage-based and gradual beyond that — no new vendor, no new account, no new access model.
- Backend integration is already essentially done — `ENG-P1-002`'s `logger.ts` already writes to Cloud Logging directly.
- Data residency is already solved — `europe-west1` is already `CONFIRMED` (`DEC-TECH-005`) and already legally cleared for engineering use (`DEC-LEGAL-006`); this option adds no new cross-border question.
- Correlation IDs, structured logs, and the 14-value error-category set already flow into it with zero adaptation.

**Weaknesses**
- **Confirmed gap:** Cloud Error Reporting has no browser JavaScript SDK; Google's own documentation points client apps to Firebase Crashlytics, which covers Android/iOS only, not a web/PWA frontend. This option does not fully answer a decision question that explicitly says "frontend **and** server."
- No first-party frontend performance monitoring (Core Web Vitals-style RUM).
- Cloud Monitoring alerting is currently free but Google has announced a charge beginning no sooner than 2026-09-01 — a small, disclosed future cost, not a blocker.

**Implementation consequences:** `ENG-P1-003` would need to build a small amount of custom frontend error-capture code (a `window.onerror`/`window.onunhandledrejection` handler posting to a Cloud Function, or similar) to close the frontend gap without a third-party tool — this is engineering effort this pack does not scope or estimate.

**Operational burden:** lowest of the three options — no second system to administer.

**Privacy implications:** narrowest — no new data controller/processor relationship; the existing GCP/Firestore privacy posture already covers it.

---

### Option B — Sentry (full: frontend + backend)

**Strengths**
- Purpose-built for exactly this decision's stated scope — dedicated React SDK (`ErrorBoundary`, source maps, session replay, performance tracing) and a dedicated Node/Firebase Functions integration, both from the same vendor with one shared data model.
- Free tier (5,000 errors/month) is very likely sufficient for pilot volume; EU data residency (Frankfurt) is available on every plan including free, via a self-serve DPA.
- First-party release/environment tagging, alerting, and role-based access out of the box.

**Weaknesses**
- Duplicates observability surface `ENG-P1-002` already built for free on the backend side — the platform would operate two logging/error systems in parallel there.
- New vendor relationship, new access-control model, new cross-border data flow not yet evaluated under `DEC-LEGAL-006`'s existing (Google-Cloud-specific) legal analysis.
- Sentry's own correlation/trace ID is separate from the platform's `correlationId` — cross-system log/issue correlation requires deliberate tagging discipline, not automatic.
- Free tier is "limited to one user" — a small team will likely need the $26/month Team plan.

**Implementation consequences:** `ENG-P1-003` would need SDK integration on both frontend and backend, a data-scrubbing configuration pass (Sentry does not inherit `logger.ts`'s existing sensitive-value guard), and a decision on whether/how to duplicate or replace backend logging.

**Operational burden:** highest — a full second system, fully adopted.

**Privacy implications:** broadest — a full third-party data flow for both frontend and backend, requiring its own legal review before Production use (§10 item 2 of the Evidence Pack).

---

### Option C — Bounded hybrid (Sentry for frontend only; GCP native for everything else)

**Strengths**
- Closes Option A's one confirmed gap (frontend visibility) without discarding the backend foundation `ENG-P1-002` already built for free.
- Smallest third-party data-flow surface of any option that actually covers frontend errors — only frontend error/performance data leaves the Google Cloud boundary, not backend/business-domain logs.
- Matches the Cloud Environment & Deployment Strategy's own architecture stance (§8): that document explicitly declines to select a provider and only requires per-environment isolation, which this option satisfies on both halves.

**Weaknesses**
- Still introduces a new vendor relationship and a new (if narrower) cross-border question for the frontend slice.
- Two systems to operate, even if each is doing only what it's good at — a real, if smaller, operational-complexity cost versus Option A alone.
- Requires deliberate architectural discipline to keep the boundary in place over time (i.e., resisting the temptation to "just also send backend errors to Sentry since it's already there").

**Implementation consequences:** `ENG-P1-003` scope would include a frontend-only Sentry SDK integration (React `ErrorBoundary` + Vite source maps) and its own scrubbing-configuration task; backend stays exactly as `ENG-P1-002` already built it.

**Operational burden:** moderate — between A and B.

**Privacy implications:** moderate — a real but scoped new data flow (frontend errors only), not the full observability surface.

---

## Technical Lead recommendation

**Option C**, because it is the narrowest change that actually answers the decision question as written ("frontend **and** server"), and because Option A alone leaves the frontend half of that question genuinely unanswered rather than merely under-optimized. This is a recommendation, not a decision — see the Evidence Pack §11 for the full fact/inference/assumption breakdown behind it.

## What each option would authorize if chosen (and what it would not)

Choosing any option **only** updates `DEC-PROV-005`'s status via the normal Decision Governance Workflow — see the [Proposed (Unapplied) Decision Register Update](DEC-PROV-005-proposed-updates-2026-07-26.md). No option, by itself:
- installs any dependency,
- creates any provider account,
- writes any application code,
- begins `ENG-P1-003`, or
- resolves the two flagged unresolved legal/privacy questions (Evidence Pack §10, items 2 and 3) — those require separate, explicit resolution regardless of which option is chosen, before Production use.

`ENG-P1-003`'s own implementation blueprint remains a separate, not-yet-authorized task, per the Founder's own stated sequence (see below).

## Exact Founder decision required

Select one of:
1. **Option A** — Firebase/Google Cloud native only, with a custom (not-yet-scoped) frontend error handler.
2. **Option B** — Sentry, full frontend + backend adoption.
3. **Option C** — Sentry for frontend only; Google Cloud native for backend/infrastructure/business/security/audit, per the Evidence Pack §6 boundary.
4. **Defer** — request further evidence (e.g., direct re-verification of the GCP pricing pages that returned truncated content, or an explicit legal review of Sentry's cross-border position) before deciding.

No option is marked approved by this brief.
