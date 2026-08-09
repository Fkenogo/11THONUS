# 11thONUS Version 1.0 Master Delivery Workflow

## 1. Document Control

| Field | Value |
|---|---|
| **Title** | 11thONUS Version 1.0 Master Delivery Workflow |
| **Version** | 1.0 |
| **Status** | **Active — governed delivery control record** |
| **Classification** | Active governance coordination record — Engineering Governance group (not a constitutional or product authority document; see §4) |
| **Owner** | ChatGPT Technical Lead (drafts and maintains); Founder (approves and authorizes status changes) |
| **Review authority** | Founder and ChatGPT Technical Lead jointly, per [Roles & Responsibilities](../06-engineering-governance/roles-and-responsibilities.md) |
| **Effective date** | 2026-07-22 |
| **Last controlled update** | 2026-07-26 (`DEC-PROV-005-DEC` — `DEC-PROV-005` status updated to `CONFIRMED` (Option C, native backend observability with dedicated frontend diagnostics) in every explicit decision-status tracking location this document maintains (§6 Master Programme Map, §10 Work-Package Control Table, §11 Phase Gate Register, §12 Decision and Dependency Watchlist, §17 narrative); no other sequencing or approved content rewritten). Previously: 2026-07-25 (EIR administrative closure — §8's `EIR-03` status cell and Terminology note updated to reflect `EIR-ENG-P1-001` reaching `Administratively Closed`, per Founder approval; no other sequencing, status, or approved content rewritten). Previously: 2026-07-24 (`GEL-002` — EIR governance stream table and notes in §8/§17 synchronized to reflect `EIR-02` and `EIR-03` reaching `Complete`; no existing sequencing, status, or approved content beyond those status fields rewritten; version remains 1.0). Previously: 2026-07-24 (`EIR-02` — additive recognition of the EIR governance stream appended to §8 and §17; no existing sequencing, status, or approved content rewritten; version remains 1.0). Previously: 2026-07-22 (v0.1 → v1.0 — corrections applied per Founder/Technical Lead review, approved, and activated; see §19–20) |
| **Source-of-truth path** | `docs/05-implementation/11thonus-master-workflow.md` |
| **Change-control rule** | This document is updated *before* the affected implementation proceeds whenever sequencing changes, work is deferred, a corrective task is inserted, or a new component becomes necessary (§14). Every edit is logged in [`docs/changes/IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md). This document does not itself carry Founder/Technical-Lead decision authority over product, technical, legal, or Decision Register content — see §4. |

## 2. Purpose

This document is the single place the Founder, the ChatGPT Technical Lead, and any coding agent go to answer four questions before a new task begins: **where is the programme right now, what is currently authorized, what is blocked and why, and what is the exact next step?**

It exists because that information currently has to be assembled by hand from three separate sources — the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md) (the detailed 47-work-package inventory), the [Coding-Agent Prompt Register](change-tracking/coding-agent-prompt-register.md) (the flat status tracker), and the growing chain of individual implementation/review/closure reports for whichever work package is currently active. None of those three is wrong, and this document does not replace any of them — but none of them alone answers "what happens next," and reconciling all three by hand before every task invites exactly the kind of drift this session has already found and corrected more than once (a stray `.firebaserc` default alias, a local `storage.rules` file that no longer matched live state, a `docs/README.md` banner still describing a status from three tasks ago).

This document solves that by being the one place sequencing, current position, and the next authorized action are recorded and kept current — explicitly *coordinating* the authoritative sources listed in §4, never overriding or duplicating their content.

## 3. Governing Principle

> **Before a new task is issued, the Founder, Technical Lead, and coding agent shall consult this document to confirm the current position, prerequisites, authorized scope, and completion gate.**

> **When sequencing changes, work is deferred, a corrective task is inserted, or a new component becomes necessary, this document shall be updated before the affected implementation proceeds.**

These two rules are the entire operating idea of this document. Everything else in it exists to make them checkable rather than aspirational.

## 4. Authority and Document Hierarchy

This section states the actual repository hierarchy — it does not invent a new one. Per the [Platform Constitution](../00-governance/platform-constitution.md) Part VII (as amended, `DEC-GOV-001`) and [`docs/README.md`](../README.md) §1:

1. **Platform Constitution** — [`00-governance/platform-constitution.md`](../00-governance/platform-constitution.md)
2. **Product Requirements Document (PRD)** — [`01-product/prd/`](../01-product/prd/README.md)
3. **Technical Requirements Document (TRD)** — [`02-technical/trd/`](../02-technical/trd/README.md)
4. **Commerce Knowledge Standard** — [`03-standards/`](../03-standards/commerce-knowledge-standard.md)
5. Platform Design System (not yet authored), Engineering Standards, Operational Playbooks, API & Integration Guide
6. **Decision Register**, **Implementation Change Log**, **Requirements Traceability & Implementation Matrix**, **Engineering Governance & Delivery Standards** — [`00-governance/decisions/`](../00-governance/decisions/README.md), [`00-governance/documentation-changes-log.md`](../00-governance/documentation-changes-log.md), [`00-governance/requirements-traceability-matrix.md`](../00-governance/requirements-traceability-matrix.md), [`06-engineering-governance/`](../06-engineering-governance/README.md)

Where documents conflict, the higher document governs; the conflict is recorded and the lower document is corrected (Constitution Part VII; TRD23 §23.3).

**This Master Workflow's position in that hierarchy is deliberately narrow.** It is a *working, controlled reference* — the same classification tier as the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md) and [Coding-Agent Prompt Register](change-tracking/coding-agent-prompt-register.md), which it sits alongside, not above.

### The Master Workflow is authoritative for:

- current programme phase and current work package;
- current workflow status of the active work package (as reconciled against evidence, not merely copied from a tracker field);
- approved delivery order and blocking dependencies;
- completion gates and the next authorized task;
- sequencing changes, deferrals, and newly introduced corrective or enabling work;
- a programme-level progress summary.

### The Master Workflow is not authoritative for:

- product behaviour (PRD);
- business rules (PRD, Commerce Knowledge Standard);
- technical architecture (TRD, Version 1 Engineering Blueprint);
- legal conclusions (Decision Register `DEC-LEGAL-*` entries, external counsel);
- security policies (TRD12, Cloud Environment & Deployment Strategy);
- formal decision outcomes (Decision Register — this document never resolves, restates as resolved, or infers the resolution of an open decision);
- detailed requirement definitions (Requirements Traceability & Implementation Matrix).

For all of the above, this document **points to** the authoritative source. It never silently restates a product or technical rule in a way that could drift from the document that actually governs it — where a summary is unavoidable (§6, §7), it is explicitly marked as a summary and links to the source of record.

## 5. Workflow Status Vocabulary

The live statuses below are exactly the [Coding-Agent Prompt Register](change-tracking/coding-agent-prompt-register.md) §3 vocabulary — this document introduces no new or competing status term.

| Status | Meaning | Who may set it |
|---|---|---|
| **Not Yet Scheduled** | Defined in the Programme but not next in sequence | ChatGPT Technical Lead |
| **Blocked** | Cannot start; a specific decision, precondition, or prior work package is outstanding | ChatGPT Technical Lead (sets); Founder (resolves the blocker) |
| **Ready** | All preconditions met; eligible to receive a detailed implementation prompt | ChatGPT Technical Lead |
| **In Progress** | A detailed prompt has been issued and the coding agent is implementing | Coding Agent (updates on start) |
| **Under Review** | Implementation Report submitted; Technical Review in progress | ChatGPT Technical Lead |
| **Corrections Required** | Technical Review returned itemized corrections | ChatGPT Technical Lead |
| **Approved** | Technical Review passed | ChatGPT Technical Lead |
| **Committed** | Change committed locally (pre-push) | Coding Agent |
| **Pushed** | Change pushed to the shared remote | Coding Agent |
| **Deployed** | Founder has pulled, verified, and deployed | Founder |
| **Manually Verified** | Manual QA checklist passed | Founder / future Manual QA role |
| **Complete** | [Definition of Done](../06-engineering-governance/definition-of-done.md) fully satisfied | Founder / ChatGPT Technical Lead jointly |

**Descriptive milestone statements are not official workflow statuses.** A statement such as *"Infrastructure closure criteria satisfied"* (as recorded for `ENG-P1-001` in §7) is **evidence** supporting a future status transition, not itself a status. Only the twelve terms above may appear in the `Status` field of the Programme or the Prompt Register.

## 6. Master Programme Map

Summarized from the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md) §B.1/B.2 (TRD22 §22.9–22.29 is that document's own source — not re-derived here). This table is a navigation aid; the Programme remains the detailed source for every work package.

**Correction (2026-07-22):** the previous version of this table used a single "Exit Gate" column that, for several phases, actually held a decision or provider status rather than TRD22's own behavioral exit criterion — a gate-classification defect, since "the decision is resolved" and "the phase functionally exits" are different gates that can be satisfied independently. The table below separates them into three columns, sourced directly from the Programme's own extraction of TRD22 §22.10–22.26 (§B.2) and its Decision Dependencies fields (§B.1) — no criterion is invented, and no decision status is altered.

| Phase | Name | Purpose | Entry Gate | Decision / Provider / Legal Gate | Exit Gate (TRD22, behavioral) | Current Position | Key Blockers | Next Dependency |
|---|---|---|---|---|---|---|---|---|
| P0 | Repository and Delivery Foundation | Controlled engineering foundation before product features | Version 1.0 documentation baseline declared | `DEC-TECH-003`, `DEC-TECH-004` — both `CONFIRMED` | Project builds; tests run; emulator starts; CI passes; no product-domain implementation (§22.10) | **Complete** | — | — |
| P1 | Firebase and Shared Platform Foundation | Reusable infrastructure every domain depends on | Phase 0 exit met | `DEC-TECH-005` `CONFIRMED`; `DEC-TECH-006`/`007` `CONFIRMED`; `DEC-PROV-005` `CONFIRMED` (2026-07-26, Option C — unblocks `ENG-P1-003`) | Shared command authenticates/validates/logs/responds; outbox idempotent; unauthorized writes denied; emulator tests pass (§22.11) | **`ENG-P1-001` Complete** (2026-07-23) — [PR #2](https://github.com/Fkenogo/11THONUS/pull/2) merged (merge commit `5714543`), pre/post-merge CI passed, Founder personally ran `git pull origin main` (verified fast-forward to the merge commit) and completed Preview Review (Firebase Emulator Suite `Passed`); all Definition of Done criteria satisfied. **`ENG-P1-002` is now `Ready`** *(note: per the Engineering Implementation Programme, `ENG-P1-002` has since reached `Complete`, 2026-07-25 — this table's own last full sync predates that; not corrected here, out of this task's scope)* | `ENG-P1-003` no longer needs `DEC-PROV-005` — now `CONFIRMED`, 2026-07-26; see the [Decision Register](../00-governance/decisions/decision-register.md) | `ENG-P1-002-PREP` — prepare the `ENG-P1-002` implementation prompt (a separate, not-yet-authorized task; `ENG-P1-002` implementation itself has not begun) |
| P2 | Identity, Roles and Business Context | Customer/business/staff identity and RBAC | Phase 1 exit met | `DEC-SEC-001`, `DEC-ID-003`, `DEC-DATA-007`, `DEC-PROV-004` — all `CONFIRMED` (Capability 2 Resolution Sprint, merged to `main` 2026-07-31; see [Decision Register](../00-governance/decisions/decision-register.md)) | Customer registers with a safe loyalty identity; owner can create a business; owner can invite staff; role switching works; security-rule and authorization tests pass (§22.12) | Blocked | The 4 D1 decisions are resolved. **Phase 1 Exit: Approved** (`ENG-P1-EXIT-001`, 2026-07-31 — all four TRD22 §22.11 Exit Criteria verified satisfied; see the [Phase 1 Exit Determination Report](reports/ENG-P1-EXIT-001-phase-1-exit-determination-and-mobilisation-report-2026-07-31.md)). Remaining blockers, per the Resolution Plan's own [Capability Authorisation Gate](roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md#7-capability-authorisation-gate) (§7): `EXT-TECH-001` still `PENDING`, `DEC-PROD-012` still `OPEN_FOUNDER`. `BaseMetadata`/TRD10 §10.5 conformance is now **fully resolved** — documentation contract corrected (`RES-005.2a`, 2026-07-31, see the [BaseMetadata Contract Analysis](reports/RES-005.2a-basemetadata-contract-analysis-2026-07-31.md)), and `functions/src/shared/metadata/baseMetadata.ts` brought into code conformance (`RES-005.2b`, 2026-07-31, see the [Code Conformance Report](reports/RES-005.2b-basemetadata-code-conformance-report-2026-07-31.md)) | Capability Authorisation Gate items 1/6 (§7) only — item 7 satisfied |
| P3 | Commerce Knowledge and Business Onboarding | Seed data, onboarding flow, Knowledge Studio MVP | Phase 2 exit met | None D1; `DEC-TECH-008` (D2, search) | Business completes onboarding without creating uncontrolled categories; Knowledge Studio manages launch taxonomy; EN/FR labels display correctly; missing-option suggestion works (§22.13) | Blocked | Depends on P2 | P2 completion |
| P4 | Reward Program Management | Reward Program CRUD, versioning, plan limits | Phase 3 exit met | `DEC-LOY-009` — `CONFIRMED` 2026-07-18 | Business can activate one valid Reward Program; taxonomy references valid; versioning preserves historical terms; inactive businesses cannot activate; plan limits server-enforced (§22.14) | Blocked | Depends on P3 | P3 completion |
| P5 | Purchase Recording | Purchase recording UI + server idempotency | Phase 4 exit met | None D1 | Staff creates a Purchase Record quickly; customer gains no progress yet; duplicate submission does not duplicate; unauthorized staff cannot record; offline items are clearly non-authoritative (§22.15) | Blocked | Depends on P4 | P4 completion |
| P6 | Customer Verification and Disputes | Verification flow, rejection, disputes | Phase 5 exit met | `DEC-PROD-008` (D2) — open | Only the registered customer can verify; rejected purchases generate no progress; disputes create review records; corrections require replacement/reverification; all transitions audited (§22.16) | Blocked | Depends on P5 | P5 completion |
| P7 | Loyalty Progress and Reward Availability | Verified Unit issuance, cycle progress | Phase 6 exit met | `DEC-LOY-008` — `CONFIRMED` 2026-07-18 | Progress reconstructable from Verified Units; exactly one actively-accumulating cycle per customer/program; no Verified Units lost; retrying verification produces one outcome; reward availability deterministic (§22.17, corrected 2026-07-18) | Blocked | Depends on P6 | P6 completion |
| P8 | Reward Redemption and On Us Moments | Atomic redemption, history | Phase 7 exit met | None D1 | An available reward redeems once; concurrent attempts produce one success; customer sees the completed On Us Moment; redemption doesn't affect other cycles/rewards; history remains available (§22.18, corrected 2026-07-19) | Blocked | Depends on P7 | P7 completion |
| P9 | Notifications | Intent/template resolution, delivery abstraction | Phase 8 substantially complete (may design earlier) | `DEC-PROV-002` (D2, SMS) — open | Every core workflow generates the correct intent; duplicate events don't send repeated messages; EN/FR content passes review; failed delivery doesn't corrupt domain state (§22.19) | Blocked | Depends on P8 | P8 completion |
| P10 | Subscription and Billing | Plan catalogue, payment provider, billing admin | Phase 8/9 substantially complete | `DEC-PROV-001` (D2), `DEC-LEGAL-004` (D2) — both open | Confirmed payment activates/renews once; duplicate callbacks have no duplicate effect; plan limits server-enforced; suspended businesses preserve history; billing failure never erases rewards (§22.20) | Blocked | Depends on P8/P9 | P8/P9 completion |
| P11 | Reporting and Operational Integrity | Business dashboard, reporting foundation | P7–P10 data exists | None D1 | Metrics use governed definitions; projections rebuildable; business cannot see another business; staff metrics contextual; dashboard loading bounded (§22.21) | Blocked | Depends on P7–P10 | P7–P10 completion |
| P12 | Platform Administration | Admin console | P2, P4, P11 substantially complete | None D1 | Routine support doesn't require Firebase Console; administrator permissions separated; privileged changes audited; Knowledge/Rules publication use governed workflows; emergency controls tested (§22.22) | Blocked | Depends on P2, P4, P11 | Those phases' completion |
| P13 | Localization, Accessibility and PWA Hardening | EN/FR, a11y, offline hardening | Core journeys (P2–P8) substantially complete | None D1 | No launch-critical untranslated French keys; no backend terminology in customer copy; core journeys pass accessibility review; PWA usable without installation; offline states clear (§22.23) | Blocked | Depends on P2–P8 | Those phases' completion |
| P14 | Security, Resilience and Compliance Readiness | Security/DR/compliance hardening | P0–P13 substantially complete | `DEC-LEGAL-001`/`003`/`005`/`006` (D2/D3) — `006` `CONFIRMED`, others open | Restore test passes; critical alerts active; privacy/compliance gate approved; no Severity 0/1 security issue remains; operational runbooks available (§22.24) | Blocked | Depends on P0–P13 | P0–P13 substantial completion |
| P15 | End-to-End Validation and Burundi Pilot | Full E2E validation, pilot | Phase 14 exit met | `DEC-LEGAL-002` (D3, pilot) — open | Complete E2E journey works with real participants; no unresolved Severity 0/1 issue; data integrity reconciles; verification behavior understood; support can resolve real cases; pilot findings formally reviewed (§22.25) | Blocked | Depends on P14 | P14 completion |
| P16 | Production Launch | Go-live | Phase 15 exit met | None new | Production smoke test passes; registration/onboarding/verification/progress/redemption/payment/support intake all work; monitoring shows no critical anomaly (§22.26) | Blocked | Depends on P15 | P15 completion |

## 7. Current Programme Position

**This section is grounded in reconciled evidence** — the Programme and Prompt Register status fields, the ENG-P1-001 report chain, and a live Decision Register check performed as part of creating this document (2026-07-22) — not assumed from any single tracker.

### Phase 0 — Complete

`ENG-P0-001` (commit `3a50710`) and `ENG-P0-002` (merged `e316565`, [PR #1](https://github.com/Fkenogo/11THONUS/pull/1), post-merge CI [passed](https://github.com/Fkenogo/11THONUS/actions/runs/29638421819)) are both `Complete`, both Technical-Review-Approved. TRD22 §22.10 exit criteria satisfied with direct CI evidence.

### Phase 1 — Complete

**Corrected 2026-08-07 (`ENG-P2-ARCH-CORR-005`, resolving Review-002 Finding R2-01):** ~~Phase 1 — In Progress~~ **Phase 1 is Complete.** All three Phase 1 work packages are merged and `Complete` — `ENG-P1-001` (Firebase & shared platform foundation), `ENG-P1-002` (shared command/event/idempotency/outbox/error contract), and `ENG-P1-003` (deny-by-default Rules & observability foundation) — and **Phase 1 Exit is formally Approved** (`ENG-P1-EXIT-001`, 2026-07-31; all TRD22 §22.11 exit criteria verified). The subsection below is preserved as the historical `ENG-P1-001` mid-provisioning snapshot (July 2026) for audit continuity; its "not committed / not pushed / official status remains `Approved`, not `Complete`" wording described that work package's state at the time of writing and has since been superseded — see the [ENG-P1-001 Closure Report](reports/ENG-P1-001-closure-report-2026-07-22.md) and §17.

**`ENG-P1-001` — Firebase & Shared Platform Foundation.** Verified facts, reconciled across the full evidence chain ([Implementation Report](reports/ENG-P1-001-implementation-report-2026-07-20.md), [Technical Review](reports/ENG-P1-001-technical-review-2026-07-20.md), [Closure Preflight](reports/ENG-P1-001-review-observations-and-infrastructure-preflight-2026-07-21.md), [Provisioning Attempt](reports/ENG-P1-001-firebase-environment-provisioning-2026-07-21.md), [Provisioning Retry](reports/ENG-P1-001-firebase-environment-provisioning-retry-2026-07-21.md), [Billing and Storage Completion](reports/ENG-P1-001-billing-and-storage-completion-2026-07-21.md), [Manual Storage Verification](reports/ENG-P1-001-manual-storage-verification-2026-07-21.md)):

- implementation completed, test-first, 34/34 tests passing;
- Technical Review returned **Approved with non-blocking observations**;
- all four review findings (CFG-1, AC-1, AT-1, AD-1) corrected and independently validated;
- Development (`eleventh-on-us-dev`) and Staging (`eleventh-on-us-staging`) provisioned;
- both Firestore databases confirmed at `europe-west1`;
- both projects confirmed on active Blaze billing (same billing account, independently verified active);
- both Storage buckets confirmed at `EUROPE-WEST1`, empty, correctly owned;
- live Storage Rules on both projects independently confirmed **deny-by-default** (queried directly via the Firebase Rules API, not the local file);
- **infrastructure closure criteria satisfied** (a milestone statement, §5 — not a workflow status);
- repository validation passes 34/34 tests, clean typecheck/lint/format/build;
- **not committed;**
- **not pushed;**
- **final CI has not yet run against the complete change set** (no PR opened for this work package);
- **Definition of Done reconciliation is pending** (items 7–12 of the [Definition of Done](../06-engineering-governance/definition-of-done.md) §2 are not yet satisfied);
- **official status remains `Approved`, not `Complete`.**

`ENG-P1-002` and `ENG-P1-003` — see §9–10.

### Phase 2 — Blocked

**Updated 2026-08-06 (`ENG-P2-ARCH-CORR-004` — Customer Identity implementation-state reconciliation):** this section had not been updated since `2026-08-02` and did not reflect that nine of the ten `ENG-P2-001` Customer Identity child packages (`-01`, `-03`–`-10`) have since been implemented, TDD-tested, and merged to `main` (`2026-08-02`–`2026-08-06`) — see the [Architecture Review Report](reports/ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md) §2 and the Engineering Implementation Programme's `ENG-P2-001` row, both already current. Findings F1–F4 from that review are corrected and merged; F5–F11 are each formally dispositioned (corrected, accepted as-is, or deferred with rationale — none silently marked resolved) per the [`ENG-P2-ARCH-CORR-004` Correction Report](reports/ENG-P2-ARCH-CORR-004-remaining-architecture-review-findings-reconciliation-2026-08-06.md). This is a documentation-currency correction only: `ENG-P2-001-02` (Customer Profile) remains unimplemented, `DEC-PROD-012` remains `OPEN_FOUNDER`, Phase 2 remains **Blocked**, and Customer Profile, Authentication, and ITM remain unauthorized — no status changed, no child package begun or authorized by this update.

**Updated 2026-08-02 (`ENG-P2-GATE-001` — `DEC-PROD-012` Capability Authorisation Gate scope determined):** the literal-text tension the prior update flagged between `DEC-PROD-012`'s own narrow scope and Gate item 6's blanket wording has been determined and corrected in place — see the [`ENG-P2-GATE-001` Determination](roadmap/ENG-P2-GATE-001-dec-prod-012-scope-determination.md). Gate item 6 now blocks only `ENG-P2-001-02` (Customer Profile)'s `gender` field and `ENG-P2-001-05`'s corresponding schema-freeze; `ENG-P2-001-01`, `-03`, `-04`, `-06`–`-10` are confirmed not blocked by `DEC-PROD-012`. `DEC-PROD-012` itself remains `OPEN_FOUNDER`, not closed or recorded by this determination. Phase 2 remains **Blocked** — this is a governance-interpretation update only; no child package was authorized or begun.

<details>
<summary>Historical status (as of 2026-08-02, superseded above)</summary>

**Updated 2026-08-02 (`ENG-P2-001-PLAN-001` — Customer Identity engineering decomposition):** `ENG-P2-001`'s Customer Identity concern is now proposed to decompose into 10 bounded child work packages (`ENG-P2-001-01`..`-10`) — see the [Decomposition Plan](roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md). Planning only; no child package is authorized to begin. The plan finds most child packages have no `DEC-PROD-012` dependency of their own (only the Customer Profile package's `gender` field does), but flags that the Capability Authorisation Gate's own item 6 text is worded as a blanket precondition for `ENG-P2-001` as a whole — an unresolved literal-text tension, not decided by this update. Phase 2 remains **Blocked**, unaffected in status by this planning-only update.

<details>
<summary>Historical status (as of 2026-08-01, superseded above)</summary>

**Updated 2026-08-01 (`IDENTITY-ALIGN-001` — constitutional realignment per `DEC-IDENTITY-001`):** the Founder decision `DEC-IDENTITY-001` (2026-08-01) separates Customer Identity, Authentication, and Identity Trust Management (ITM, internal-only) into independent architectural concerns within Capability 2 — see the [Decision Register](../00-governance/decisions/decision-register.md) `DEC-IDENTITY-001` entry and the restructured [`CDR-001` Capability 2](roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity). `DEC-PROV-004` and `DEC-SEC-001` remain `CONFIRMED` (amended in place, not superseded — see their own Decision Register Notes fields). `EXT-TECH-001` has been reclassified: it is no longer an unconditional Capability Authorisation Gate blocker for `ENG-P2-001`'s baseline Customer Identity work, since standard participation no longer requires phone verification (`DEC-IDENTITY-001` Standard Participation Principle); it remains required before the phone-OTP authentication provider is activated in production and before ITM's phone-verification trust signal is relied upon — see the [amended Capability Authorisation Gate item 1](roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md#7-capability-authorisation-gate) and the [External Dependencies Register](../00-governance/decisions/external-dependencies-register.md) `EXT-TECH-001` row. Phase 2 remains **Blocked**: `DEC-PROD-012` (`OPEN_FOUNDER`) is still open, and `ENG-P2-001`'s decomposition along the three architectural concerns above is engineering-design work not yet performed (`IDENTITY-ALIGN-001` is a governance/documentation alignment task only — it does not begin implementation). `BaseMetadata`/TRD10 §10.5 conformance (Gate item 7) remains fully resolved, unaffected by this update.

<details>
<summary>Historical status (as of 2026-07-31, superseded above)</summary>

**Updated 2026-07-31 (Capability 2 Resolution Sprint closure):** per the live [Decision Register](../00-governance/decisions/decision-register.md), all four of Phase 2's D1 decision dependencies are now `CONFIRMED` — `DEC-SEC-001`, `DEC-ID-003`, `DEC-DATA-007`, `DEC-PROV-004` (Resolution Sprint PRs #36–#40 merged to `main` 2026-07-31). This resolves condition (1) of the Resolution Sprint's own closure recommendation ([closure report](reports/capability-2-resolution-sprint-closure-report-2026-07-30.md), [closure record](reports/capability-2-resolution-sprint-closure-record-2026-07-31.md)). **Phase 1 Exit: Approved** (`ENG-P1-EXIT-001`, 2026-07-31 — all four TRD22 §22.11 Exit Criteria verified satisfied by direct, live evidence; see the [Phase 1 Exit Determination Report](reports/ENG-P1-EXIT-001-phase-1-exit-determination-and-mobilisation-report-2026-07-31.md)). Phase 2 remains **Blocked**: independent of Phase 1's own exit (now approved), two further items in the Resolution Plan's [Capability Authorisation Gate](roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md#7-capability-authorisation-gate) (§7) remain unsatisfied: `EXT-TECH-001` (`PENDING`), `DEC-PROD-012` (`OPEN_FOUNDER`). `BaseMetadata`/TRD10 §10.5 conformance (Gate item 7) is now **fully resolved** — the documentation half was corrected (`RES-005.2a`, 2026-07-31), and the code half is now also corrected (`RES-005.2b`, 2026-07-31, see the [Code Conformance Report](reports/RES-005.2b-basemetadata-code-conformance-report-2026-07-31.md)). Neither remaining item is a Resolution Sprint governance item and neither is resolved by this update.

<details>
<summary>Historical status (as of 2026-07-22, superseded above)</summary>

Per the live [Decision Register](../00-governance/decisions/decision-register.md) (checked directly, not reconstructed from memory, on 2026-07-22): all four of Phase 2's D1 decision dependencies remain open — `DEC-SEC-001` (`OPEN_ENGINEERING`), `DEC-ID-003` (`OPEN_FOUNDER`), `DEC-DATA-007` (`OPEN_ENGINEERING`), `DEC-PROV-004` (`OPEN_PROVIDER`). Phase 2 additionally cannot begin until Phase 1 exits (TRD22 §22.11 exit criteria fully met, not merely `ENG-P1-001`).

</details>

</details>

</details>

</details>

## 8. Immediate Authorized Sequence

**Superseded — see §17 for the current position (corrected 2026-08-07, `ENG-P2-ARCH-CORR-005`, Review-002 Finding R2-01).** The engineering sequence recorded below (beginning `ENG-P1-001-CLOSE` → `ENG-P1-002` → `ENG-P1-003` → `PHASE-1-CLOSE` → `PHASE-2-GATE`) is a **historical activation snapshot from 2026-07-22 and is fully complete**: Phase 1 is complete and Phase 2's `ENG-P2-001` child packages `-01`,`-03`–`-10` are merged (`-02` gated by `DEC-PROD-012`). This section is preserved for audit continuity; the authoritative current next action is in §17.

**Governance progression to date** (corrected 2026-07-22 — the prior version of this section showed tracker reconciliation as still-future work; it was already complete):

| ID | Task | Type | Status |
|---|---|---|---|
| `MW-001A` | Master Workflow creation (drafting, structure, reconciliation against the Programme/Prompt Register/`ENG-P1-001` evidence chain/Decision Register) | Governance task | **Complete** (2026-07-22) |
| `MW-002` | Tracker and workflow integration — six cross-referenced documents (`docs/README.md`, Programme, Prompt Register, AI Collaboration Workflow, Implementation Prompt Standard, `IMPLEMENTATION_CHANGES.md`) synchronized to reference the Master Workflow | Governance task | **Complete within `MW-001A`** (2026-07-22) |
| `MW-001B` | Master Workflow review, correction, and approval (phase-map gate-classification fix, MW-sequence reconciliation, App Check trigger correction, wording clarifications, Founder/Technical-Lead approval, version 1.0 activation) | Governance task | **Current** (this task, 2026-07-22) |

**Engineering sequence — unchanged from the version this task was asked to approve:**

| ID | Task | Type |
|---|---|---|
| `ENG-P1-001-CLOSE` | Commit, push, CI, and Definition-of-Done closure for `ENG-P1-001` | Closure gate |
| `ENG-P1-002-PREP` | Reconfirm scope and issue the detailed `ENG-P1-002` prompt | Governance task |
| `ENG-P1-002` | Shared command contract implementation | Implementation task |
| `ENG-P1-002-REVIEW` | Technical Review and closure | Review task |
| `DEC-PROV-005` | Resolve the monitoring-provider decision | Decision task |
| `ENG-P1-003` | Rules and monitoring foundation | Implementation task |
| `PHASE-1-CLOSE` | Verify TRD22 Phase 1 exit criteria | Closure gate |
| `PHASE-2-GATE` | Resolve Phase 2 D1/provider decisions | Decision task |

These are workflow-control identifiers, not replacements for Engineering Implementation Programme work-package IDs (`ENG-Pn-nnn`) — they exist only to sequence governance/closure/decision steps that sit between or alongside the Programme's own IDs.

**Immediate authorized sequence after this document's activation begins with `ENG-P1-001-CLOSE`.** This document does not execute it. `ENG-P1-001-CLOSE` is prepared and executed as its own, separately authorized task (§17).

**EIR governance stream (added 2026-07-24, `EIR-02`):** a separate, secondary governance stream, layered on top of the engineering sequence above and governed in full by the [Engineering Implementation Records Standard](../06-engineering-governance/engineering-implementation-records-standard.md):

| ID | Task | Type | Status |
|---|---|---|---|
| `EIR-01` | Author the Engineering Implementation Records Standard | Governance task | **Complete** — merged into `main` at `0e02d05` ([PR #4](https://github.com/Fkenogo/11THONUS/pull/4)), 2026-07-24 |
| `EIR-02` | Integrate the approved standard into the repository (`records/` structure, README, Engineering History Index, templates, navigation cross-references) | Governance task | **Complete** — merged into `main` at `67cec79` ([PR #5](https://github.com/Fkenogo/11THONUS/pull/5)), 2026-07-24 |
| `EIR-03` | Backfill `EIR-ENG-P1-001` for the engineering-complete `ENG-P1-001` work package | Governance task | **Complete** — record drafted and merged into `main` at `f4b77ef` ([PR #8](https://github.com/Fkenogo/11THONUS/pull/8)), 2026-07-24; the record's own lifecycle state is `Administratively Closed`, approved by the Founder on 2026-07-25 (Engineering Implementation Records Standard §9.2) |

Per the Engineering Implementation Records Standard §1/§14, this stream is a secondary, historical, non-authoritative record layer — it does not itself authorize, block, or supersede the engineering sequence above, and it changes no work-package status recorded there. **The Founder-directed sequencing condition recorded here is now satisfied:** the EIR governance stream reached `EIR-03` on 2026-07-24. This does not itself authorize `ENG-P1-002-PREP`/`ENG-P1-002` — per the engineering sequence in this document (§17 below), that remains its own, separately Founder-authorized task, not automatically triggered by this stream reaching `EIR-03`.

**Terminology note:** `ENG-P1-001` reached `Complete` (engineering status, per the Definition of Done — see [ENG-P1-001 Final Closure Recording](../changes/IMPLEMENTATION_CHANGES.md)) on 2026-07-23. This is distinct from, and does not imply, `Administratively Closed` — the Engineering Implementation Records Standard's own record-lifecycle term (`Engineering Complete → Recorded → Administratively Closed`, standard §6), which applies only to a work package's *record*, not its engineering status. The Engineering Implementation Record for `ENG-P1-001` (`EIR-ENG-P1-001`) now exists — drafted and merged into `main` via `EIR-03` (2026-07-24) — and its record-lifecycle state is `Administratively Closed`, approved by the Founder on 2026-07-25 (standard §9.2). This is distinct from `ENG-P1-002-PREP`'s own separate authorization, which is not triggered merely by the EIR reaching `Administratively Closed`.

## 9. Work-Package Gate Template

Every current or future work package shall be recorded (in the Programme and, where active, in §10 below) with these fields:

- Work-package ID
- Title
- Phase
- Current status (§5 vocabulary only)
- Objective
- Authoritative scope source (PRD/TRD/Blueprint section)
- Requirement dependencies (RTM IDs)
- Decision dependencies (Decision Register IDs)
- Provider/legal dependencies
- Sequential dependencies (prior work packages)
- Entry criteria
- Required validation
- Deployment requirement
- Manual QA requirement
- Technical Review requirement
- Completion gate
- Current blocker
- Next authorized action
- Evidence links (implementation report, technical review, closure evidence)
- Commit/PR/CI references
- Risks and deferred items

## 10. Current Work-Package Control Table

**Superseded — see §17 for the current position (corrected 2026-08-07, `ENG-P2-ARCH-CORR-005`, Review-002 Finding R2-01).** The table below is a **historical Phase-1 snapshot (July 2026)**: it predates the completion of `ENG-P1-002`/`ENG-P1-003` (now `Complete`) and the merge of `ENG-P2-001-01`,`-03`–`-10`. Its cells (`ENG-P1-002` = "Ready", `ENG-P1-003` = "Blocked", "next authorized action = `ENG-P1-002-PREP`") are no longer current; the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md) holds the authoritative per-package state and §17 holds the authoritative current next action. Preserved for audit continuity.

Full detail for every other work package remains in the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md); this table covers the five work packages most relevant right now — `ENG-P0-001` and `ENG-P0-002` are shown for immediate context only (both `Complete`, not active or upcoming), and `ENG-P1-001`/`ENG-P1-002`/`ENG-P1-003` are the current and immediately-next work in Phase 1.

| Field | ENG-P0-001 | ENG-P0-002 | ENG-P1-001 | ENG-P1-002 | ENG-P1-003 |
|---|---|---|---|---|---|
| Status | **Complete** | **Complete** | **Complete** (2026-07-23) | **Ready** | **Blocked** |
| Objective | Buildable, lintable, testable repo skeleton | Every PR checked; report/log templates exist | Firebase projects exist, client initializes safely | One authenticate→validate→log→respond command shape | No write succeeds unless authorized |
| Decision dependencies | `DEC-TECH-003`/`004` (CONFIRMED) | `DEC-TECH-004` (CONFIRMED) | `DEC-TECH-005` (CONFIRMED) | `DEC-TECH-006`/`007` (CONFIRMED) | — |
| Sequential dependency | Phase 0 entry | `ENG-P0-001` complete | Phase 0 complete | `ENG-P1-001` **complete** — satisfied 2026-07-23 | `ENG-P1-002` complete |
| Provider/legal dependency | — | — | `DEC-LEGAL-006` (CONFIRMED, via `DEC-TECH-005`) | — | `DEC-PROV-005` (**CONFIRMED**, 2026-07-26 — Option C) |
| Current blocker | — (Complete) | — (Complete) | — (Complete) | — (Ready — awaiting `ENG-P1-002-PREP`) | — (`DEC-PROV-005` resolved; `ENG-P1-003` not yet started) |
| Next authorized action | — | — | — (Complete) | `ENG-P1-002-PREP` (§8) — not executed by this document; `ENG-P1-002` implementation itself remains unauthorized until that prompt exists | `ENG-P1-003` implementation prompt — a separate, not-yet-authorized task |
| Commit/PR/CI | `3a50710` | `e316565` / [PR #1](https://github.com/Fkenogo/11THONUS/pull/1) / [CI run](https://github.com/Fkenogo/11THONUS/actions/runs/29638421819) | Merge commit `5714543` / [PR #2](https://github.com/Fkenogo/11THONUS/pull/2) (merged) / post-merge [CI run](https://github.com/Fkenogo/11THONUS/actions/runs/29984247236) (passed) | — | — |
| Evidence links | [Report](reports/ENG-P0-001-implementation-report-2026-07-17.md) · [Review](reports/ENG-P0-001-technical-review-2026-07-17.md) | [Report](reports/ENG-P0-002-implementation-report-2026-07-17.md) · [Review](reports/ENG-P0-002-technical-review-2026-07-17.md) · [Closure](reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) | Full chain — see §7 and the [Closure Report](reports/ENG-P1-001-closure-report-2026-07-22.md) | — | — |

## 11. Phase Gate Register

### Phase 0

- **Entry gate:** Version 1.0 documentation baseline declared; `DEC-TECH-003`/`004` resolved.
- **Exit gate (TRD22 §22.10):** project builds; tests run; emulator starts; CI passes; no product-domain implementation.
- **Current gate result:** **Passed** — evidenced by CI run [`29638421819`](https://github.com/Fkenogo/11THONUS/actions/runs/29638421819) on `main`.
- **Unresolved blockers:** none.
- **Next gate owner:** N/A (closed).

### Phase 1

- **Entry gate:** Phase 0 exit met; `DEC-TECH-005` resolved.
- **Exit gate (TRD22 §22.11):** shared server command authenticates/validates/logs/responds; outbox event written and processed idempotently; unauthorized direct writes denied; emulator tests pass.
- **Current gate result:** **Not yet reached.** `ENG-P1-001` alone (infrastructure foundation) does not satisfy this exit criterion — the command-contract (`ENG-P1-002`) and deny-by-default Rules (`ENG-P1-003`) work packages are required too.
- **Evidence:** `ENG-P1-001` evidence chain, §7.
- **Unresolved blockers:** `ENG-P1-002`/`ENG-P1-003` implementation itself not yet begun. `DEC-PROV-005` resolved (`CONFIRMED`, 2026-07-26).
- **Next gate owner:** ChatGPT Technical Lead (sequencing).

### Phase 2 (summarized — not yet approaching readiness)

- **Entry gate:** Phase 1 exit met; `DEC-SEC-001`, `DEC-ID-003`, `DEC-DATA-007`, `DEC-PROV-004` resolved.
- **Exit gate (TRD22 §22.12):** customer registers with a safe identity; business/staff creation works; role switching works; authorization tests pass.
- **Current gate result:** Not reached; entry gate itself unmet.
- **Unresolved blockers:** four open D1 decisions (§12) plus Phase 1 not exited.
- **Next gate owner:** Founder (`DEC-ID-003`), Engineering Lead (`DEC-SEC-001`, `DEC-DATA-007`), Founder + Engineering Lead (`DEC-PROV-004`).

### Phases 3–16

Summarized in §6; individually detailed in the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md) §B.2. None are near readiness — each will receive its own Phase Gate Register entry here once its entry gate is within reach.

## 12. Decision and Dependency Watchlist

Sourced live from the [Decision Register](../00-governance/decisions/decision-register.md) on 2026-07-22. This document does not change any decision status — it only tracks what is open and what it blocks.

| Decision | Status | Blocks | Owner |
|---|---|---|---|
| `DEC-PROV-005` (error monitoring provider) | **`CONFIRMED`** (2026-07-26 — Option C; see [Decision Register](../00-governance/decisions/decision-register.md)) | — (resolved) | Engineering Lead, approved by Founder |
| `DEC-SEC-001` (customer auth approach/fallback) | `OPEN_ENGINEERING` | Phase 2 entry | Engineering Lead |
| `DEC-ID-003` (permission inheritance semantics) | `OPEN_FOUNDER` | Phase 2 entry | Founder |
| `DEC-DATA-007` (loyalty number/QR generation) | `OPEN_ENGINEERING` | Phase 2 entry | Engineering Lead |
| `DEC-PROV-004` (phone OTP delivery route) | `OPEN_PROVIDER` | Phase 2 entry | Engineering Lead |

Any other currently open Decision Register item that could change near-term sequencing should be added here as it becomes relevant — this table is not the full register (see the [Decision Register](../00-governance/decisions/decision-register.md) §5 for the complete count), only the items with a live bearing on the next two authorized sequence steps.

## 13. Deferred and Intentionally Incomplete Work

| Deferred item | Reason | Owner | Trigger to resume | Latest point by which resolved | Blocks immediate next work package? |
|---|---|---|---|---|---|
| App Check completion (Web App registration, approved domain, reCAPTCHA/App-Check provider configuration) | A registered Firebase Web App, an approved domain, and reCAPTCHA/App Check provider setup are still absent — all manual/console-dependent steps outside a coding agent's authority | Founder (Web App registration and domain), Engineering Lead (App Check provider configuration) | Preparation of the first live Staging web deployment | **Before the first externally accessible Staging web deployment that initializes against live Firebase, or earlier once the Firebase Web App and approved domain are available — in all cases before Production.** (Corrected 2026-07-22; previously stated only "Before Production (Phase 16)," which understated how soon this actually matters.) | No — does not block `ENG-P1-001-CLOSE` or `ENG-P1-002`. Safety control in the interim: `ENG-P1-001`'s fail-closed App Check behavior means any non-development build still fails to boot without a real site key, rather than silently running unprotected. |
| Production project creation | Cloud Environment & Deployment Strategy §7 — project creation is Founder/Engineering-Lead-only, never a coding agent's autonomous action | Founder | Explicit Founder authorization, naming the project ID | Before Production (Phase 16) | No |
| Production deployment | Same §7 constraint; also gated on Phase 15 exit | Founder | Phase 15 exit + Founder authorization | Phase 16 | No |
| Formal, domain-aware Firestore/Storage Rules | Explicitly `ENG-P1-003`'s scope, not `ENG-P1-001`'s — current live Rules are the correct interim deny-by-default placeholder | Coding agent, under `ENG-P1-003` prompt | `ENG-P1-002` complete + `DEC-PROV-005` resolved | Phase 1 exit | Yes — blocks Phase 1 exit, not `ENG-P1-001-CLOSE` |
| Legal/operational activities required before Production (Rwanda NCSA pathway, Burundi adequacy list/Agency status, Google SCC-to-local-mechanism fit, Burundi's ~10 September 2026 compliance deadline) | `DEC-LEGAL-006`'s CONFIRMED text keeps these mandatory pre-production prerequisites, not discharged by engineering authorization | Founder + external counsel | Founder-directed legal engagement | Before Production (Phase 16) | No |

## 14. Change-Control Procedure

1. A proposed change (to sequencing, scope, or the next authorized task) is identified.
2. Its impact on sequencing, dependencies, and gates is assessed against this document's current content.
3. **This Master Workflow is updated in the same controlled change set, before the affected implementation begins.**
4. The [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md) and [Coding-Agent Prompt Register](change-tracking/coding-agent-prompt-register.md) are synchronized to match.
5. Decision Register or Requirements Traceability Matrix updates are made **only** where their own governance ([Decision Governance Workflow](../00-governance/decision-governance-workflow.md), [Decision Update Procedure](../00-governance/decision-update-procedure.md), [Traceability Maintenance Guide](../00-governance/traceability-maintenance-guide.md)) independently requires them — this procedure never triggers a decision resolution on its own authority.
6. The change is recorded in [`docs/changes/IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md).
7. The next coding-agent implementation prompt cites the updated Master Workflow version/date (see the [Implementation Prompt Standard](../06-engineering-governance/implementation-prompt-standard.md) integration, below).
8. Technical Review verifies that execution actually matched the approved sequence recorded here.

**Emergency-correction exception:** where a security, data-integrity, or repository-safety issue requires immediate containment, the coding agent may stop the unsafe action first. This Master Workflow is then updated before substantive corrective implementation proceeds — the exception covers the *stop*, never the *fix*.

**Who may change what (clarified 2026-07-22):** after activation (§1, §20), the ChatGPT Technical Lead may draft proposed updates to this document at any time, but a sequencing or status change recorded here becomes *effective* only once approved by the Founder and/or Technical Lead per §20's approval model — a draft update is not itself authority to deviate from the currently-effective sequence. **A coding agent may never approve a change to this Master Workflow**, exactly as a coding agent may never approve its own Technical Review (Roles & Responsibilities) or resolve a Decision Register entry on its own authority (§4).

## 15. Mandatory Coding-Agent Entry Check

**This requirement applies prospectively from this document's effective date (§1) onward.** It does not retroactively invalidate `ENG-P0-001`, `ENG-P0-002`, or the `ENG-P1-001` work already completed before this document existed — those remain valid, evidenced work, reconciled into §7/§10 above, not redone.

Every future coding-agent prompt must require the agent to complete, and report on, the following before implementation begins:

- [ ] Read the Master Workflow.
- [ ] Confirm the current phase.
- [ ] Confirm the current work package.
- [ ] Confirm this task is the next authorized action (§8).
- [ ] Confirm entry criteria are met (§9/§11).
- [ ] Confirm blockers are resolved (§10/§12).
- [ ] Confirm no other agent is modifying overlapping files.
- [ ] Confirm the expected completion gate (§16).
- [ ] Report any conflict between the prompt and this document **before** coding, not after.

## 16. Completion and Transition Rules

A task is not complete merely because code exists (TRD22 §22.41; [Definition of Done](../06-engineering-governance/definition-of-done.md) §2). Every work package requires, in order:

1. implementation, matching the approved acceptance criteria exactly;
2. required validation, actually run, not merely claimed;
3. an Implementation Report, per the [Implementation Prompt Standard](../06-engineering-governance/implementation-prompt-standard.md) §3;
4. Technical Review, per the [Technical Review Standard](../06-engineering-governance/technical-review-standard.md);
5. corrections closure, if Technical Review returned any;
6. commit, per the [Git Workflow](../06-engineering-governance/git-workflow.md);
7. push;
8. CI passing on the pushed change;
9. deployment, where the work package requires it;
10. manual QA, where the work package requires it;
11. tracking-document updates (Programme, Prompt Register, `IMPLEMENTATION_CHANGES.md`, and this Master Workflow where sequencing is affected);
12. the formal status transition itself, recorded using only the §5 vocabulary.

## 17. Current Next Action

**Current position and next action — corrected 2026-08-07 (`ENG-P2-ARCH-CORR-005`, resolving Review-002 Finding R2-01), further updated 2026-08-07 (`DEC-PROD-012` closure — Option D; `ENG-P2-001-02` unblocked), further updated 2026-08-07 (`CAP-P2-004` — `ENG-P2-001-02` merged; concern-level completion reporting adopted per `DEC-GOV-008`), further updated 2026-08-07 (`CAP-P2-006` — G1/G2 recorded (`DEC-GOV-009`/`DEC-GOV-010`); Customer Identity's remaining concern-completion items and the next governed action now uniquely determined). This block supersedes the historical narrative below (preserved for audit continuity).**

- **Phase 0:** Complete. **Phase 1:** Complete (`ENG-P1-001`/`-002`/`-003` merged; Phase 1 Exit Approved `ENG-P1-EXIT-001`, 2026-07-31).
- **Phase 2 (Capability 2 — Customer Identity) — concern-level reporting (`DEC-GOV-008`; authoritative statuses owned by [`CDR-001` §5](roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity), not duplicated here):** **Customer Identity concern — `Complete`** (`CAP-P2-008`, 2026-08-07 — all ten `ENG-P2-001` child packages `-01`–`-10` implemented, TDD-tested, merged; the two concern-completion items merged via `CAP-P2-007` [PR #82, `436794f`, post-merge CI green]) ~~`Implemented — Validation/Closure Pending`~~; **Authentication concern — `Not started — Unauthorised`**; **ITM concern — `Not started — Unauthorised`** (internal). **Overall Capability 2 — `Open — partially implemented; not closed`.** Concern Completion does **not** constitute Capability closure; capability closure still requires the existing capability-level criteria (see [`CAP-P2-002`](reports/CAP-P2-002-capability-2-validation-and-closure-review-2026-08-07.md)).
- **Phase 2 (Capability 2 — Customer Identity):** **[SUPERSEDED re `ENG-P2-001-02` by the concern-status bullet above (`CAP-P2-004`, 2026-08-07): `-02` is now merged; the "pending authorization to begin" wording below is historical.]** ~~**Blocked** at the capability level pending `DEC-PROD-012` (`OPEN_FOUNDER`)~~ **[UPDATED 2026-08-07] Partially implemented; `DEC-PROD-012` is now CLOSED (Option D — gender omitted from MVP).** **Nine of ten `ENG-P2-001` child packages (`-01`, `-03`–`-10`) are implemented, TDD-tested, and merged to `main`**; the remaining child `ENG-P2-001-02` (Customer Profile) is **no longer gated by `DEC-PROD-012`** and is **technically authorised to begin, pending a fresh Founder implementation authorization** (the profile schema may be frozen without `gender`). The Capability 2 architecture review ([`ENG-P2-ARCH-REVIEW-001`](reports/ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md)) and its corrections `ENG-P2-ARCH-CORR-001`–`-004`, the F9b error-category Founder decision (`F9B-DEC-001`), the FEF alignment adoption, and the corrected-baseline review ([`ENG-P2-ARCH-REVIEW-002`](reports/ENG-P2-ARCH-REVIEW-002-corrected-baseline-architecture-review-2026-08-07.md), PASS WITH CONDITIONS) are all complete and merged.
- **The stale pointer "Next authorized action: `ENG-P1-002-PREP`" is superseded** — that task completed weeks ago.
- **Next governed action — [UPDATED 2026-08-07, `CAP-P2-006`].** With `DEC-GOV-009`/`DEC-GOV-010` (G1/G2) resolved and `CAP-P2-006`'s reassessment, the Customer Identity **concern** is `Implemented — Validation/Closure Pending` with exactly **two bounded, ownership-defined remaining concern-completion items** (no further Founder policy decision needed): (1) `ENG-P2-001-02` architecture/technical review coverage (G1 — it post-dates Review-002); (2) wiring `-02`'s Customer Profile fields into `ENG-P2-001-05`'s `customerProfiles` persistence converter (persistence owned by `-05`). The **next governed action is therefore uniquely determinable**: a bounded Customer-Identity concern-completion task covering those two items — **awaiting fresh Founder authorization to begin.** Deployment/Preview/Manual QA (G2), Authentication, ITM, and `ENG-P2-004` are Capability-Closure / Release-Readiness, not concern completion; RTM Finding F11 is accepted deferred. **[Historical, superseded:]** the paragraph below described `-02` as "technically authorised to begin, awaiting authorization" before it was implemented. Parallel governed tracks also remain available but none is uniquely mandated: the Identity/Authentication/ITM engineering-design decomposition of `ENG-P2-001` (`IDENTITY-ALIGN-001`, "not yet performed"), the RTM Finding F11 synchronisation (Founder-approved deferred engineering work), or a registered successor package (`OBS-OPS-001` / `ENG-SEC-001` / `ENG-CI-001`). Authentication and ITM remain separately governed and **unauthorised**; the `-02` Customer Profile implementation itself remains unauthorised until the Founder issues a fresh authorization.
- **Next governed action — [UPDATED 2026-08-07, `CAP-P2-007`].** The Founder authorized and this task executed the bounded Customer-Identity concern-completion work: both `CAP-P2-006` items are now **delivered in the `CAP-P2-007` PR (pending merge)** — (1) `ENG-P2-001-02` Architecture/Technical Review recorded (PASS, DoD §2.6/G1); (2) `-02`'s Customer Profile fields wired into `ENG-P2-001-05`'s `customerProfiles` converter (TDD, 427/427 functions tests, full validation green). The Customer Identity concern satisfies every concern-completion criterion as delivered; it **remains `Implemented — Validation/Closure Pending`** until the `CAP-P2-007` PR is merged under fresh Founder authorization and post-merge CI verified — at which point it may be declared `Complete`. Authoritative statuses remain owned by [`CDR-001` §5](roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity). Capability 2 remains `Open — not closed`; Authentication, ITM, `ENG-P2-004`, deployment/Manual QA, and Capability 2 closure remain unauthorised / not concern-completion.
- **Next governed action — [UPDATED 2026-08-07, `CAP-P2-008`, concern closure].** `CAP-P2-007` (PR #82) is now **merged** (`436794f`, post-merge CI success), and the Customer Identity concern is **formally `Complete`** ([`CDR-001` §5](roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity), single source of truth). **Capability 2 remains `Open — partially implemented; not closed`** — Concern Completion ≠ Capability closure. The next engineering decision is **outside Customer Identity** and is a **Founder-authorised choice among the remaining Capability 2 streams** — the Authentication concern, the Identity Trust Management (ITM) concern, or `ENG-P2-004` — each separately governed and currently `Not started — Unauthorised` / unchanged. RTM Finding F11 remains accepted deferred. **No engineering task is authorised to begin without fresh Founder authorization.** See [`CAP-P2-008`](reports/CAP-P2-008-customer-identity-concern-closure-2026-08-07.md).
- **Next governed action — [UPDATED 2026-08-07, `AUTH-P0-001`, Authentication foundations].** The Founder authorised the **Authentication** stream and its foundation decisions are now recorded ([`DEC-AUTH-001`](../00-governance/decisions/decision-register.md), CONFIRMED — D-A1 official `AUTH-*` work-package series distinct from `ENG-P2-002/003/004`; D-A2 MVP providers Phone OTP + Google; D-A3 duplicate-merge a separate governed capability; D-A4 SMS a production-launch concern, build on the Firebase Auth Emulator; D-A5 staff auth separately governed). The Authentication concern is now `Not started — Foundations approved` ([`CDR-001` §5](roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity)). **The next governed action is the first Authentication implementation package — `AUTH-BP` (blueprint) then `AUTH-01` — under the approved architecture** ([`ENG-P2-ARCH-001`](roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7, [`CAP-P2-009`](reports/CAP-P2-009-authentication-architecture-and-delivery-planning-2026-08-07.md)); **it must not begin without a fresh Founder implementation authorization.** Capability 2 remains `Open — partially implemented; not closed`; ITM/`ENG-P2-004` unchanged. See [`AUTH-P0-001`](reports/AUTH-P0-001-authentication-foundation-decisions-2026-08-07.md).
- **Next governed action — [UPDATED 2026-08-08, `AUTH-BP`, Authentication blueprint].** The authoritative Authentication engineering contract for `AUTH-01`–`AUTH-09` is now delivered: the [`AUTH-BP` Authentication Blueprint](roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) (planning only; references the merged `ENG-P2-ARCH-001` §7 architecture, does not redesign it). **The next governed action is `AUTH-01` (Authentication domain & contracts) under the blueprint** — TDD, Firebase Auth Emulator, no live SMS in CI. **It must not begin without a fresh Founder implementation authorization.** Authentication concern remains `Not started — Foundations approved`; Capability 2 remains `Open — partially implemented; not closed`; ITM/`ENG-P2-004` unchanged.
- **Next governed action — [UPDATED 2026-08-08, `AUTH-01`].** `AUTH-01` (Authentication domain contracts) is now **implemented, test-first (TDD), pending Founder-authorized review/merge** — the pure-domain layer (`AuthenticatedCredential`, `AuthResult`, `SessionContext`, auth event contracts, `AuthenticationDomainError` factories, `TokenVerifierPort`) at `functions/src/domains/authentication/{models,ports}`, 20 new unit tests (functions 427→447), no Firebase/orchestration/provider/UI/session/linking/recovery (see the [`AUTH-01` report](reports/AUTH-01-authentication-domain-contracts-2026-08-08.md)). **The next governed action is `AUTH-02` (Firebase ID-token verification + reference resolution) under the blueprint** — it must not begin without a fresh Founder implementation authorization. Capability 2 remains `Open — partially implemented; not closed`.
- **Next governed action — [UPDATED 2026-08-08, `AUTH-02`].** `AUTH-02` (Token Verification & Identity Resolution) is now **implemented, test-first (TDD), pending Founder-authorized review/merge** — the Firebase-Admin `TokenVerifierPort` adapter + credential→identity resolution service at `functions/src/domains/authentication/services/` (consumes the merged `-09` lookup with `purpose: "authentication"`; found → `resolved`, `RESOURCE_NOT_FOUND` → `unregistered`; `referenceId` = Firebase authUid per AUTH-BP §3; closed 14-category error mapping; no raw-token persistence/logging), 20 new unit tests + a real-Firestore-emulator test (functions 447→467), no orchestration/UI/linking/recovery/session/ITM/staff/merge/new-providers (see the [`AUTH-02` report](reports/AUTH-02-token-verification-and-identity-resolution-2026-08-08.md)). A **cross-package finding** is recorded for AUTH-03: `-01` writes an identity's initial reference only to the embedded projection, not the authoritative collection `-09` resolves against, so AUTH-03 registration must link it via `-08` (report §12 — a Founder decision for AUTH-03). **The next governed action is `AUTH-03` (registration/sign-in orchestration) under the blueprint** — it must not begin without a fresh Founder implementation authorization. Capability 2 remains `Open — partially implemented; not closed`.
- **Next governed action — [UPDATED 2026-08-08, `AUTH-CORR-001`].** The AUTH-02 §12 cross-package finding is now reconciled: `AUTH-CORR-001` (a bounded interface/integration correction, **not** AUTH-03) makes `-08` `linkAuthenticationReferenceForIdentity` complete an identity's initial embedded reference by materialising the authoritative `authenticationReferences/{type}:{id}` document (leaving the embedded projection untouched), so the `-01 → -08 → -09` lifecycle round-trips and AUTH-02 resolution consumes it. No `-01` responsibility change, no AUTH-02 change, no new error category; uniqueness/idempotency/concurrency preserved; TDD (lifecycle emulator 7/7; functions 477/477). **Implemented, pending Founder-authorized review/merge.** **The next governed action remains `AUTH-03` (registration/sign-in orchestration) — now unblocked** but it must not begin without a fresh Founder implementation authorization. Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged. See the [`AUTH-CORR-001` report](reports/AUTH-CORR-001-initial-authentication-reference-linking-2026-08-08.md).
- **Next governed action — [UPDATED 2026-08-08, `AUTH-03`].** `AUTH-03` (Registration / Sign-in Orchestration) is now **implemented, test-first (TDD), pending Founder-authorized review/merge** — Founder-authorized as the third Authentication implementation package (fresh authorization recorded per convention). The backend orchestration (`registrationSignInService.ts`) determines new-vs-returning through `-09` resolution (AUTH-02), registers a new customer through `-01` `createCustomerIdentity` + establishes the initial reference through the AUTH-CORR-001 `-08` path (emitting `CustomerIdentityRegistered`/`AuthenticationReferenceLinked`), gates returning-user sign-in on access state (`active` proceeds; `suspended`→`ACCOUNT_SUSPENDED`; else `AUTH_FORBIDDEN`), and issues the session through the existing AUTH-01 `createSessionContext`; a thin `authenticate` `onCall` (`index.ts`) verifies via AUTH-02 then orchestrates. Idempotent (derived create/link keys) on the shared idempotency/outbox; no credential material persisted; closed 14-category taxonomy (no new category); no `-01`/`-08`/`-09`/AUTH-01/AUTH-02/blueprint change. **The `CustomerAuthenticated` trust-signal emission was examined against §5/§6 wording and deferred to `AUTH-08` per the explicit §12 responsibility allocation and the AUTH-01 boundary** (documented in the report). TDD: functions **485/485**, `emulators:validate` **187/187** (incl. 5 new AUTH-03 emulator tests); the single web failure is the pre-existing `ENG-P1-002-CR1`/`EXT-TECH-001` phone-auth-harness latency flake (unrelated; no `apps/` file changed; passes 39/39 in isolation). **The next governed action is `AUTH-04` (Frontend sign-in flows — Phone OTP + Google) under the blueprint** — it must not begin without a fresh Founder implementation authorization. Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged. See the [`AUTH-03` report](reports/AUTH-03-registration-signin-orchestration-2026-08-08.md).
- **Next governed action — [UPDATED 2026-08-09, `AUTH-03` v1.1 correction].** `AUTH-03` is **not yet merged.** The automated PR reviewer raised **four valid defects (2 P1, 2 P2)** on the reviewed head `9c18cea` in the registration idempotency/atomicity path (concurrent-registration orphan; non-resumable registration; same-key retry returning `signed_in` not `registered`; path-bearing idempotency key). Per Founder decision the merge was held and AUTH-03 corrected **in place** on PR #90 (not a separate `AUTH-CORR` task): credential-keyed `-01`/`-08` registration (concurrency serialises, loser fails closed before any write — no orphan; id recovered from the durable create record on resume); a client-key request-replay gate (same-key retry replays the original `registered` outcome); safe idempotency-key validation — all using only the shared idempotency facility, **no `-01`/`-08`/`-09`/idempotency/AUTH-01/AUTH-02 change**. TDD RED→GREEN on the emulator; functions **491/491**, `emulators:validate` **190/190**, web **259/259**. PR #90 head moves off `9c18cea` and therefore **requires fresh Founder review/merge**. **The next governed action remains `AUTH-04`** (Frontend sign-in flows), which requires its own fresh Founder implementation authorization. Capability 2 remains `Open — partially implemented; not closed`. See the [`AUTH-03` report §20](reports/AUTH-03-registration-signin-orchestration-2026-08-08.md).
- **Next governed action — [UPDATED 2026-08-09, `AUTH-03` merge/closure sync].** `AUTH-03` is now **MERGED and closed.** PR #90 merged as commit `98896492075846b7df87b2d0e12fd5139aa1ced5` (merge parents `08aa1bc` + the **corrected** head `f805edb` — so the corrected idempotency/atomicity implementation is the one on `main`, superseding the original `9c18cea`), merged 2026-08-09T09:53:47Z, **post-merge CI green** (run 31307008689). `origin/main` = local `main` = `98896492…`, divergence 0/0. This bullet **supersedes the "not yet merged" wording in the two `AUTH-03` bullets above** (preserved for audit continuity — programme-currency reconciliation only, no code or capability change). **The next governed action is `AUTH-04`** (Frontend sign-in flows), which requires its own fresh Founder implementation authorization. Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged.
- **Next governed action — [UPDATED 2026-08-09, `AUTH-04`].** `AUTH-04` (Frontend sign-in flows — Phone OTP + Google) is now **implemented, test-first (TDD), pending Founder-authorized review/merge** — Founder-authorized as the **fourth** Authentication implementation package (the fresh implementation authorization given in this task, recorded per the AUTH-01/-02/-03 convention). Frontend-only under `apps/web/src/authentication/*`, plus one additive composition-root accessor `apps/web/src/infrastructure/firebase/functions.ts` (region-bound callable client): a closed, **disabled-by-default** provider registry (`providerConfig`); the Phone OTP (reCAPTCHA/App-Check) and Google popup flows building on the merged `infrastructure/firebase/*` and the `phoneAuthHarness` reference; a backend-safe idempotency key **reused across transient retries** so it consumes (never weakens) the corrected AUTH-03 request-level replay guarantee; and a `SignInPanel` tested with a network-safety harness (no live transport). Consumes the merged AUTH-03 `authenticate` callable; **emits no domain events** (`CustomerAuthenticated` stays AUTH-08); no session management (AUTH-07)/linking (AUTH-05)/recovery (AUTH-06); **no `functions/` change** (the `functions/` tree is byte-identical to `origin/main`); no real DSN/keys committed. TDD: web **300/300** (+41 AUTH-04 tests, incl. two v1.1 automated-PR-review corrections — a P1 wrong-identity guard and a P2 `deadline-exceeded` replay fix), functions **491/491** unchanged, `pnpm emulators:validate` 189/190 — the one failure is the inherited `ENG-P1-002-CR1` command-dispatcher/identity-lifecycle concurrency flake in that byte-identical `functions/` tree, not AUTH-04; CI (PR #91) green on re-run; typecheck/lint/format/build clean. **The next governed action is `AUTH-05` (Account linking) under the blueprint** — it must not begin without a fresh Founder implementation authorization. Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged. See the [`AUTH-04` report](reports/AUTH-04-frontend-sign-in-flows-2026-08-09.md).

**Historical narrative (superseded, preserved):**

`MW-001A`/`MW-002` (Master Workflow creation and tracker integration), `MW-001B` (correction-and-approval pass), `ENG-P1-001-CLOSE`, `ENG-P1-001-PR2-PRE-MERGE-CORRECTION`, `ENG-P1-001-PR2-FINAL-MERGE-READINESS-SYNC`, `ENG-P1-001-FOUNDER-MERGE` (merge commit `5714543336...`, merged 2026-07-23T06:10:37Z by Kenogo, post-merge CI [passed](https://github.com/Fkenogo/11THONUS/actions/runs/29984247236)), and the final closure recording (this task) are all complete as of 2026-07-23. The Founder personally completed the two remaining Definition-of-Done gates in a clean review workspace: possession via `git pull origin main` (verified fast-forward `ef1de34→5714543`, evidence file confirms HEAD matches the merge commit exactly, clean worktree, full local validation passing) and Preview Review (Firebase Emulator Suite started cleanly on `demo-11thonus`, all six emulators active, `europe-west1-ping` reachable, Emulator UI reachable — result `Passed`). **All 12 Definition of Done criteria are now satisfied — `ENG-P1-001` is `Complete`.** See the [ENG-P1-001 Closure Report](reports/ENG-P1-001-closure-report-2026-07-22.md) §17–18 for the full final reconciliation.

`ENG-P1-002`'s only blocker — `ENG-P1-001` completion — is resolved; its own decision dependencies (`DEC-TECH-006`/`007`) were already `CONFIRMED`; it has no Provider or Legal dependency. **`ENG-P1-002` moves `Blocked` → `Ready`.** `ENG-P1-003` was, at the time this section was written (2026-07-22), still `Blocked` on the then-open `DEC-PROV-005` — **`DEC-PROV-005` is now `CONFIRMED` (2026-07-26, Option C)**, per the Decision Register; `ENG-P1-003` itself moved `Blocked` → `Ready` in the Engineering Implementation Programme and Coding-Agent Prompt Register.

**Next authorized action: `ENG-P1-002-PREP`** — prepare the `ENG-P1-002` implementation prompt. This is a separate, not-yet-authorized task; `ENG-P1-002` implementation itself has not begun and is not authorized by this document.

**EIR governance stream note (updated 2026-07-24, `GEL-002`):** independent of the sequencing above, `EIR-01` is `Complete` (merged into `main`, [PR #4](https://github.com/Fkenogo/11THONUS/pull/4)); `EIR-02` is `Complete` (merged into `main`, [PR #5](https://github.com/Fkenogo/11THONUS/pull/5)); `EIR-03` is `Complete` — `EIR-ENG-P1-001` was drafted and merged into `main` ([PR #8](https://github.com/Fkenogo/11THONUS/pull/8)) — see §8. The EIR governance stream has therefore reached `EIR-03`, satisfying the Founder-directed sequencing condition recorded there. This does not itself authorize `ENG-P1-002-PREP`; that remains its own, separately Founder-authorized task.

## 18. Known Risks and Control Measures

| Risk | Control measure |
|---|---|
| Drift between local repository files and live Firebase state | Independent live-state verification before every infrastructure-adjacent report (established practice since the ENG-P1-001 provisioning tasks); this document records only reconciled, evidence-based position |
| A default Firebase alias accidentally targeting an old/wrong project | `.firebaserc` carries no `default` key (§13 of the ENG-P1-001 Manual Storage Verification Report); every deployment command must name an explicit alias or project ID |
| Reports and trackers becoming inconsistent | This document's own existence and the §14 change-control procedure; §10's control table is reconciled against the full evidence chain, not copied from a single tracker field |
| Infrastructure state changing outside Git (Console-driven changes) | Every infrastructure-adjacent task independently re-verifies live state rather than trusting the last report; this is now established practice, not merely a recommendation |
| Work-package status being advanced without all gates satisfied | §16's explicit 12-item completion sequence; §5's rule that milestone statements are evidence, not status |
| Open decisions being overlooked | §12's live watchlist, refreshed at each Master Workflow update |
| Deferred work disappearing from view | §13's explicit deferred-work register, with an owner and resume trigger for each item |
| Coding agents relying on stale preparation documents | §15's mandatory entry check requires reading *this* document, not a cached understanding of it |

## 19. Version History

| Version | Date | Change | Status |
|---|---|---|---|
| 0.1 | 2026-07-22 | Initial proposed draft | Proposed — awaiting Founder and Technical Lead approval |
| 1.0 | 2026-07-22 | Founder and Technical Lead approved; corrections applied (phase-map gate classification, §6; MW-001/MW-002 reconciliation, §8/§17; App Check deferral trigger, §13; non-blocking wording clarifications, §10/§14/§15); activated | **Active — governed delivery control record** |
| 1.1 | 2026-08-07 | `ENG-P2-ARCH-CORR-005` — current-position/next-action synchronisation resolving Review-002 Finding R2-01: §7 Phase 1 corrected `In Progress → Complete`; §8/§10 marked superseded historical snapshots; §17 rewritten to state the true current position (Phase 1 complete; Capability 2 `ENG-P2-001` `-01`,`-03`–`-10` merged, `-02` gated by open `DEC-PROD-012`) and record that the next governed action is not uniquely established and requires a Founder decision. Historical text preserved. | **Active — governed delivery control record** |
| 1.2 | 2026-08-07 | `DEC-PROD-012` closure (Option D — gender omitted from MVP): §17 updated — Phase 2 is no longer "Blocked pending `DEC-PROD-012`"; `DEC-PROD-012` is CLOSED and `ENG-P2-001-02` (Customer Profile) is technically authorised to begin, pending a fresh Founder implementation authorization. Authentication/ITM remain unauthorised; RTM F11 remains deferred. Historical text preserved. | **Active — governed delivery control record** |

## 20. Approval Record

| Field | Value |
|---|---|
| Founder approval | Approved — Kenogo |
| Technical Lead approval | Approved — ChatGPT Technical Lead |
| Approval date | 2026-07-22 |
| Resulting version | 1.0 |
| Effective status | Active |

**Scope of this approval.** This approval applies to the Master Workflow governance document only. It does not: mark `ENG-P1-001` `Complete`; authorize `ENG-P1-002` implementation; resolve any Decision Register entry; or deploy anything. Each of those remains its own, separately authorized action.
