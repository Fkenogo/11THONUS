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
| **Last controlled update** | 2026-07-24 (`EIR-02` — additive recognition of the EIR governance stream appended to §8 and §17; no existing sequencing, status, or approved content rewritten; version remains 1.0). Previously: 2026-07-22 (v0.1 → v1.0 — corrections applied per Founder/Technical Lead review, approved, and activated; see §19–20) |
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
| P1 | Firebase and Shared Platform Foundation | Reusable infrastructure every domain depends on | Phase 0 exit met | `DEC-TECH-005` `CONFIRMED`; `DEC-TECH-006`/`007` `CONFIRMED`; `DEC-PROV-005` `OPEN_PROVIDER` (blocks `ENG-P1-003` only) | Shared command authenticates/validates/logs/responds; outbox idempotent; unauthorized writes denied; emulator tests pass (§22.11) | **`ENG-P1-001` Complete** (2026-07-23) — [PR #2](https://github.com/Fkenogo/11THONUS/pull/2) merged (merge commit `5714543`), pre/post-merge CI passed, Founder personally ran `git pull origin main` (verified fast-forward to the merge commit) and completed Preview Review (Firebase Emulator Suite `Passed`); all Definition of Done criteria satisfied. **`ENG-P1-002` is now `Ready`** | `ENG-P1-003` still needs `DEC-PROV-005` (`OPEN_PROVIDER`, unaffected by `ENG-P1-001`/`002`) | `ENG-P1-002-PREP` — prepare the `ENG-P1-002` implementation prompt (a separate, not-yet-authorized task; `ENG-P1-002` implementation itself has not begun) |
| P2 | Identity, Roles and Business Context | Customer/business/staff identity and RBAC | Phase 1 exit met | `DEC-SEC-001`, `DEC-ID-003`, `DEC-DATA-007`, `DEC-PROV-004` — all open | Customer registers with a safe loyalty identity; owner can create a business; owner can invite staff; role switching works; security-rule and authorization tests pass (§22.12) | Blocked | 4 open D1 decisions (§12) + Phase 1 not exited | Phase 1 exit + the 4 decisions |
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

### Phase 1 — In Progress

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

Per the live [Decision Register](../00-governance/decisions/decision-register.md) (checked directly, not reconstructed from memory, on 2026-07-22): all four of Phase 2's D1 decision dependencies remain open — `DEC-SEC-001` (`OPEN_ENGINEERING`), `DEC-ID-003` (`OPEN_FOUNDER`), `DEC-DATA-007` (`OPEN_ENGINEERING`), `DEC-PROV-004` (`OPEN_PROVIDER`). Phase 2 additionally cannot begin until Phase 1 exits (TRD22 §22.11 exit criteria fully met, not merely `ENG-P1-001`).

## 8. Immediate Authorized Sequence

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
| `EIR-02` | Integrate the approved standard into the repository (`records/` structure, README, Engineering History Index, templates, navigation cross-references) | Governance task | **Current** (this task, 2026-07-24) |
| `EIR-03` | Backfill `EIR-ENG-P1-001` from the closed `ENG-P1-001` work package | Governance task | Not yet authorized |

Per the Engineering Implementation Records Standard §1/§14, this stream is a secondary, historical, non-authoritative record layer — it does not itself authorize, block, or supersede the engineering sequence above, and it changes no work-package status recorded there. **However, as a distinct, Founder-directed sequencing choice recorded here** (not a consequence the EIR standard itself imposes): `ENG-P1-002-PREP`/`ENG-P1-002` additionally remain **not authorized to begin** until this EIR governance stream reaches at least `EIR-03`, or the Founder explicitly changes this sequencing.

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

Full detail for every other work package remains in the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md); this table covers the five work packages most relevant right now — `ENG-P0-001` and `ENG-P0-002` are shown for immediate context only (both `Complete`, not active or upcoming), and `ENG-P1-001`/`ENG-P1-002`/`ENG-P1-003` are the current and immediately-next work in Phase 1.

| Field | ENG-P0-001 | ENG-P0-002 | ENG-P1-001 | ENG-P1-002 | ENG-P1-003 |
|---|---|---|---|---|---|
| Status | **Complete** | **Complete** | **Complete** (2026-07-23) | **Ready** | **Blocked** |
| Objective | Buildable, lintable, testable repo skeleton | Every PR checked; report/log templates exist | Firebase projects exist, client initializes safely | One authenticate→validate→log→respond command shape | No write succeeds unless authorized |
| Decision dependencies | `DEC-TECH-003`/`004` (CONFIRMED) | `DEC-TECH-004` (CONFIRMED) | `DEC-TECH-005` (CONFIRMED) | `DEC-TECH-006`/`007` (CONFIRMED) | — |
| Sequential dependency | Phase 0 entry | `ENG-P0-001` complete | Phase 0 complete | `ENG-P1-001` **complete** — satisfied 2026-07-23 | `ENG-P1-002` complete |
| Provider/legal dependency | — | — | `DEC-LEGAL-006` (CONFIRMED, via `DEC-TECH-005`) | — | `DEC-PROV-005` (`OPEN_PROVIDER`) |
| Current blocker | — (Complete) | — (Complete) | — (Complete) | — (Ready — awaiting `ENG-P1-002-PREP`) | `ENG-P1-002` not complete; `DEC-PROV-005` open |
| Next authorized action | — | — | — (Complete) | `ENG-P1-002-PREP` (§8) — not executed by this document; `ENG-P1-002` implementation itself remains unauthorized until that prompt exists | `DEC-PROV-005` resolution (§8) |
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
- **Unresolved blockers:** `ENG-P1-001` formal closure; `ENG-P1-002` not started; `DEC-PROV-005` open, blocking `ENG-P1-003`.
- **Next gate owner:** ChatGPT Technical Lead (sequencing), Founder (`DEC-PROV-005`, commit/push/deploy authorizations).

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
| `DEC-PROV-005` (error monitoring provider) | `OPEN_PROVIDER` | `ENG-P1-003`; Phase 1 exit | Engineering Lead |
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

`MW-001A`/`MW-002` (Master Workflow creation and tracker integration), `MW-001B` (correction-and-approval pass), `ENG-P1-001-CLOSE`, `ENG-P1-001-PR2-PRE-MERGE-CORRECTION`, `ENG-P1-001-PR2-FINAL-MERGE-READINESS-SYNC`, `ENG-P1-001-FOUNDER-MERGE` (merge commit `5714543336...`, merged 2026-07-23T06:10:37Z by Kenogo, post-merge CI [passed](https://github.com/Fkenogo/11THONUS/actions/runs/29984247236)), and the final closure recording (this task) are all complete as of 2026-07-23. The Founder personally completed the two remaining Definition-of-Done gates in a clean review workspace: possession via `git pull origin main` (verified fast-forward `ef1de34→5714543`, evidence file confirms HEAD matches the merge commit exactly, clean worktree, full local validation passing) and Preview Review (Firebase Emulator Suite started cleanly on `demo-11thonus`, all six emulators active, `europe-west1-ping` reachable, Emulator UI reachable — result `Passed`). **All 12 Definition of Done criteria are now satisfied — `ENG-P1-001` is `Complete`.** See the [ENG-P1-001 Closure Report](reports/ENG-P1-001-closure-report-2026-07-22.md) §17–18 for the full final reconciliation.

`ENG-P1-002`'s only blocker — `ENG-P1-001` completion — is resolved; its own decision dependencies (`DEC-TECH-006`/`007`) were already `CONFIRMED`; it has no Provider or Legal dependency. **`ENG-P1-002` moves `Blocked` → `Ready`.** `ENG-P1-003` remains `Blocked` on the separate, still-open `DEC-PROV-005`.

**Next authorized action: `ENG-P1-002-PREP`** — prepare the `ENG-P1-002` implementation prompt. This is a separate, not-yet-authorized task; `ENG-P1-002` implementation itself has not begun and is not authorized by this document.

**EIR governance stream note (added 2026-07-24, `EIR-02`):** independent of the sequencing above, `EIR-01` is `Complete` (merged into `main`, [PR #4](https://github.com/Fkenogo/11THONUS/pull/4)); this document's own repository-integration task, `EIR-02`, is the current EIR-stream task; `EIR-03` (backfilling `EIR-ENG-P1-001`) is next, once separately authorized — see §8. Per the Founder-directed sequencing recorded there, `ENG-P1-002-PREP` additionally remains unauthorized until that stream reaches `EIR-03` or the Founder explicitly changes the sequence.

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

## 20. Approval Record

| Field | Value |
|---|---|
| Founder approval | Approved — Kenogo |
| Technical Lead approval | Approved — ChatGPT Technical Lead |
| Approval date | 2026-07-22 |
| Resulting version | 1.0 |
| Effective status | Active |

**Scope of this approval.** This approval applies to the Master Workflow governance document only. It does not: mark `ENG-P1-001` `Complete`; authorize `ENG-P1-002` implementation; resolve any Decision Register entry; or deploy anything. Each of those remains its own, separately authorized action.
