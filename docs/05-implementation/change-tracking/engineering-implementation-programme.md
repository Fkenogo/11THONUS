> **Title:** 11thONUS Engineering Implementation Programme
> **Version:** 1.0 · **Status:** Active governance record · **Classification:** Working (governance record)
> **Governing document:** 11thONUS Platform Constitution; TRD Chapter 22
> **Source-of-truth path:** `docs/05-implementation/change-tracking/engineering-implementation-programme.md`
> **Last controlled update:** 2026-07-25 (`ENG-P1-002` implemented — shared command/event/correlation/logging/idempotency/outbox/error contract foundation, TDD, 87/87 unit tests, 14/14 real Firebase Emulator Suite integration tests; status moved `Ready → Under Review`; Programme Overview and Phase 1 Work Packages table updated — see the [ENG-P1-002 Implementation Report](../reports/ENG-P1-002-implementation-report-2026-07-25.md)). Previously: 2026-07-21 (Manual Storage Provisioning Verification — the Founder's five manual steps (Staging Blaze upgrade; Storage initialized for both projects in `europe-west1`; restrictive Rules selected) independently verified, none assumed: **both projects now billing-enabled on the same active account; both Storage buckets confirmed at `EUROPE-WEST1`, empty, correctly owned; live Storage Rules on both projects independently confirmed deny-by-default** via a direct Rules-API query — not the local repository file, which had drifted to an open test-mode template unrelated to the live (secure) state and has been corrected back to the governed baseline. `.firebaserc` also found to have acquired an unauthorized `default` alias and corrected to `dev`/`staging` only. **Infrastructure closure criteria satisfied** — see the [Manual Storage Verification Report](../reports/ENG-P1-001-manual-storage-verification-2026-07-21.md). `ENG-P1-001`'s `Status` remains `Approved` — not `Complete`; `ENG-P1-002` remains `Blocked`, not started. Previously, same day: Billing Verification and Storage Completion — billing independently verified for both environments per the Founder's Blaze-plan report: **Development billing-enabled** (active account, confirmed distinct from `eleventh-on-us`'s own); **Staging billing not enabled** (confirmed twice). Per the asymmetric-billing decision logic, Development Storage bucket creation was attempted and **did not succeed** — blocked not by billing but by a newly-discovered `.firebasestorage.app` domain-provisioning restriction on direct `gcloud` bucket creation, persistent across 5 retries, ruled out as propagation lag. No bucket created for either environment; `firebasestorage.googleapis.com` enabled on Development only. No Rules/Functions/Hosting/App Check resource created. Infrastructure explicitly not marked complete — see the [Billing and Storage Completion Report](../reports/ENG-P1-001-billing-and-storage-completion-2026-07-21.md). `ENG-P1-001`'s `Status` remains `Approved`; `ENG-P1-002` remains `Blocked`, not started. Previously, same day: Firebase Environment Provisioning Retry — **Development (`eleventh-on-us-dev`) and Staging (`eleventh-on-us-staging`) Firebase/GCP projects created**, both independently verified at `europe-west1` for Firestore; Cloud Storage stopped at the billing gate (no billing attached, no bucket created for either project); minimal Auth enabled (zero users); App Check API enabled for Development, full configuration pending manual Web-App/reCAPTCHA steps; safe `.firebaserc` `dev`/`staging` aliases created (no default, no production); Emulator Suite independently re-confirmed still using `demo-11thonus`; `eleventh-on-us` confirmed unchanged. Production not created. `ENG-P1-001`'s `Status` remains `Approved` — not `Complete`; `ENG-P1-002` remains `Blocked`, not started — see the [Provisioning Retry Report](../reports/ENG-P1-001-firebase-environment-provisioning-retry-2026-07-21.md). Previously, same day: Firebase Environment Provisioning attempt — Founder-authorized creation of `11thonus-dev`/`11thonus-staging` (and their `-rw` fallbacks) blocked before any resource was created: all four approved project IDs start with a digit, which Google Cloud's project-ID rule disallows (must start with a lowercase letter) — a platform naming-format constraint, not an availability conflict. No project was created for either environment; `eleventh-on-us` confirmed unchanged; no billing attached. New Founder-approved project IDs are required to retry — see the [ENG-P1-001 Firebase Environment Provisioning Report](../reports/ENG-P1-001-firebase-environment-provisioning-2026-07-21.md). `ENG-P1-001`'s `Status` remains `Approved`; `ENG-P1-002` remains `Blocked` and was not started. Previously: 2026-07-21 (Closure Preflight — the four Independent Technical Review findings (CFG-1, AC-1, AT-1, AD-1) corrected and independently validated (34/34 tests passing); a read-only infrastructure preflight against the authenticated Firebase/GCP account found `eleventh-on-us` confirmed unsuitable for `europe-west1` (immutable `nam5` Firestore / `US-EAST1` Storage locations) and six specific Founder decisions still required before any project can be created — see the [ENG-P1-001 Closure Preflight Report](../reports/ENG-P1-001-review-observations-and-infrastructure-preflight-2026-07-21.md). `ENG-P1-001`'s `Status` remains `Approved` — not `Complete`; `ENG-P1-002` remains `Blocked`; `ENG-P1-002` was not started. Previously: 2026-07-20 (Independent Technical Review — `ENG-P1-001` **Approved with non-blocking observations**; status moved `Under Review → Approved`; live-project provisioning confirmed as a Founder-owned action required before `Complete`, not before Approval — see the [ENG-P1-001 Technical Review](../reports/ENG-P1-001-technical-review-2026-07-20.md). Previously, same day: `ENG-P1-001` implemented — environment loading, Firebase client SDK, Firebase Admin SDK, and the `europe-west1` region constant; status moved `Ready → Under Review`; Phase 1 profile and Work Packages table updated — see the [ENG-P1-001 Implementation Report](../reports/ENG-P1-001-implementation-report-2026-07-20.md). Previously: 2026-07-19, Phase 0E, Engineering Authorization & Governance Closure — `DEC-TECH-005` (region `europe-west1`) and `DEC-LEGAL-006` both `CONFIRMED`; `ENG-P1-001` moved `Blocked → Ready`; Programme Overview table and Phase 0/Phase 1 profiles updated; `ENG-P1-002`/`ENG-P1-003` remain `Blocked`, unaffected — see the [Version 1.0 Engineering Authorization Record](../../00-governance/version-1-engineering-authorization-record.md). Previously, same day: Engineering Sprint 0A — Phase 1 profile updated to reflect `DEC-TECH-005`'s scope expansion.)

# 11thONUS Engineering Implementation Programme

## A. Programme Overview

### A.1 Purpose

This is the permanent high-level implementation tracker that converts TRD Chapter 22's delivery roadmap into a tracked sequence of small, reviewable coding-agent work packages. It shows the complete engineering journey — every TRD22 phase, every work package within it, its requirement and decision dependencies, and its live status — in one place, so the Founder and ChatGPT Technical Lead always have a single view of what is ready, what is blocked, and why.

This document does not replace TRD22. TRD22 remains the authoritative source for phase objectives, deliverables, and exit criteria. This document operationalizes TRD22 into trackable units of work, exactly as the [Engineering Governance & Delivery Standards](../../06-engineering-governance/README.md) operationalize TRD22 §22.38–22.41 into a repeatable process.

**Relationship to the Master Delivery Workflow (added 2026-07-22, Master Workflow activated at v1.0 same day):** this document remains the detailed, complete work-package inventory — every phase, every work package, every requirement/decision dependency. The [11thONUS Version 1.0 Master Delivery Workflow](../11thonus-master-workflow.md) (v1.0, Active) governs current sequencing, the current position, and the next authorized task (**`ENG-P1-001-CLOSE`**), and points back here for full work-package detail rather than duplicating it. The two documents must remain synchronized: any status change recorded here that affects sequencing is reflected in the Master Workflow in the same change set, per that document's own §14 change-control procedure.

### A.2 Governing Documents

- **TRD Chapter 22** (`docs/02-technical/trd/22-mvp-implementation-and-delivery.md`) — the source of truth for phase sequence, objectives, deliverables, and exit criteria (§22.9–22.26, extracted in full in §B below).
- **Decision Register** (`docs/00-governance/decisions/decision-register.md`) — the source of truth for which decisions block which phase.
- **Requirements Traceability & Implementation Matrix** (`docs/00-governance/requirements-traceability-matrix.md`) — the source of truth for which requirement IDs belong to which work package; this programme cites IDs that exist in the matrix and never invents one.
- **Engineering Governance & Delivery Standards** (`docs/06-engineering-governance/`) — the source of truth for *how* each work package is proposed, implemented, reviewed, and shipped (the [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md), [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md), [Technical Review Standard](../../06-engineering-governance/technical-review-standard.md), [Definition of Done](../../06-engineering-governance/definition-of-done.md)).

### A.3 Relationship to TRD22

Every phase in §B below is TRD22's own phase, identified by its exact TRD22 section number and title (§22.10 Phase 0 through §22.26 Phase 16). No phase name, objective, deliverable, or exit criterion was reconstructed from memory — each was extracted directly from the live TRD22 text as part of this document's creation (see the companion [Engineering Transition Phase 0A Report](../reports/engineering-transition-phase-0a-report-2026-07-17.md) §6 for the extraction method). Where this programme adds detail TRD22 does not itself state — the decomposition into work packages — that addition is clearly separated under each phase's "Work Packages" heading.

### A.4 Relationship to the Requirements Traceability Matrix

Every Requirement ID cited in this programme was verified to exist in the [Requirements Traceability & Implementation Matrix](../../00-governance/requirements-traceability-matrix.md) at the time of writing (programmatic cross-check, not manual transcription). Work packages cite a **representative subset** of the requirement IDs relevant to their scope, not an exhaustive enumeration of every one of the 934 matrix rows — where a work package's domain has more related requirements than are individually listed, the work package says so and points to the matrix's own Domain column for the complete set. As engineering proceeds, the matrix's `Implementation Status` column becomes the authoritative record of what has actually shipped; this programme's `Status` column tracks the work package, not the requirement.

### A.5 Relationship to Engineering Governance

This programme is the object that [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md)-conformant prompts are generated *from*: each work package in §B is the seed of exactly one future implementation prompt (see Task 9 / the [first prompt draft](../prompts/) for a worked example). The [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md)'s 16 stages apply to every work package individually — this programme does not skip or shortcut any of them.

### A.6 How This Programme Is Maintained

- A work package's `Status` field is updated at each stage of the [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md) (see the status vocabulary in the companion [Prompt Register](coding-agent-prompt-register.md)).
- Adding, splitting, or re-sequencing a work package is logged in the [Documentation Changes Log](../../00-governance/documentation-changes-log.md), same as any other governance change.
- This document and the [Prompt Register](coding-agent-prompt-register.md) are kept in sync — every work package listed here has exactly one row in the register, and vice versa (see §Validation in the companion report).
- Decision dependencies are cited by ID, never restated — if a cited decision's status changes, this programme's `Decision Dependencies` field is corrected in the same change set as the Decision Register update, per the [Decision Governance Workflow](../../00-governance/decision-governance-workflow.md).

### A.7 Prompt Execution Rule

> **Only one detailed coding-agent implementation prompt is issued at a time, unless the work packages are explicitly independent and parallel work has been approved.**

This rule governs how work packages in §B move from `Ready` to `In Progress`. It exists because:

- **later prompts depend on earlier implementation reports** — a work package's actual scope may narrow or shift once the prior package's report reveals what was really built;
- **architecture discovered during implementation may affect later work** — TRD22 describes intended deliverables, but the concrete shape of, for example, the shared command contract (Phase 1) is only known once Phase 1 is implemented, and that shape constrains every later phase's work packages;
- **validation results may create correction work** — a `Corrections Required` outcome at Technical Review inserts unplanned work ahead of whatever was next in sequence;
- **open decisions may change sequencing** — a D1 or D2 decision resolving differently than its documented recommendation can re-order or reshape downstream work packages;
- **coding agents must not work concurrently on overlapping files or domains** — TRD22 §22.40's stop conditions include "another agent or process is modifying the same codebase"; issuing two prompts against the same domain at once creates exactly that risk.

The master programme (this document) provides the overview of the entire journey. Detailed prompts are generated and reviewed **one by one**, each only after the previous work package reaches `Complete` (or is explicitly deprioritized), unless two work packages are separately confirmed to touch disjoint files/domains and parallel execution is explicitly approved by the Founder and ChatGPT Technical Lead.

---

## B. Full Engineering Phase Roadmap

Source: TRD22 §22.9 (phase list), §22.10–22.26 (per-phase objective/deliverables/exit criteria), §22.27 (dependency map), §22.28 (critical path), §22.29 (recommended vertical slice).

### B.0 Dependency Map and Critical Path (TRD22 §22.27–22.29)

```
Repository Foundation → Shared Firebase Foundation → Identity and Authorization → Commerce Knowledge →
Business Onboarding → Reward Programs → Purchase Recording → Customer Verification →
Verified Units and Loyalty Cycles → Rewards and Redemption → Notifications → Subscriptions →
Reporting and Administration → Pilot Readiness
```

"A downstream phase shall not create temporary substitutes for an unfinished dependency" (TRD22 §22.27).

**Critical product path** (TRD22 §22.28): identity → business onboarding → Reward Program → Purchase Record → customer verification → Verified Unit → Loyalty Cycle → reward availability → redemption → On Us Moment. Reporting, subscriptions and administration are required for launch but must not distract from completing this core path early.

**Recommended vertical slice** (TRD22 §22.29): one customer, one business, one owner, one Reward Program, one Purchase Record, one verification, one Verified Unit, one progress update, one reward, one redemption, one On Us Moment — completed before expanding broadly into multiple staff workflows, advanced onboarding, reporting, billing, or administration.

### B.1 Phase Summary Table

| Phase | Name | Primary Domain(s) | Decision Dependencies (D1 shown bold) | Current Status |
|---|---|---|---|---|
| P0 | Repository and Delivery Foundation | Cross-cutting (infrastructure) | **DEC-TECH-003**, **DEC-TECH-004** (both CONFIRMED, Sprint 2) | **Complete** — ENG-P0-001 Complete; ENG-P0-002 Complete; exit criteria satisfied |
| P1 | Firebase and Shared Platform Foundation | Cross-cutting (server) | **DEC-TECH-005** (CONFIRMED, Phase 0E — `europe-west1`), **DEC-TECH-006**/**DEC-TECH-007** (CONFIRMED, Sprint 2), **DEC-PROV-005** (open) | **ENG-P1-001 Complete** (2026-07-23 — Founder pull and Preview Review both confirmed; see report) — **ENG-P1-002 Under Review** (implemented 2026-07-25, awaiting Technical Review — see report); `ENG-P1-003` remains `Blocked` on `DEC-PROV-005` |
| P2 | Identity, Roles and Business Context | Identity | **DEC-SEC-001**, **DEC-ID-003**, **DEC-DATA-007**, **DEC-PROV-004** | Blocked (depends on P1 + 4 D1 decisions) |
| P3 | Commerce Knowledge and Business Onboarding | Commerce Knowledge | None D1; DEC-TECH-008 (D2, search) | Blocked (depends on P2) |
| P4 | Reward Program Management | Reward Programs | DEC-LOY-009 (D2) | Blocked (depends on P3) |
| P5 | Purchase Recording | Purchase | None D1 | Blocked (depends on P4) |
| P6 | Customer Verification and Disputes | Purchase, Trust | DEC-PROD-008 (D2) | Blocked (depends on P5) |
| P7 | Loyalty Progress and Reward Availability | Loyalty | **DEC-LOY-008** | Blocked (depends on P6 + 1 D1 decision — highest-priority founder decision per the agenda) |
| P8 | Reward Redemption and On Us Moments | Reward | None D1 | Blocked (depends on P7) |
| P9 | Notifications | Notification | DEC-PROV-002 (D2, SMS) | Blocked (depends on P8; may begin design earlier) |
| P10 | Subscription and Billing | Subscription | DEC-PROV-001 (D2), DEC-LEGAL-004 (D2) | Blocked (depends on P8/P9) |
| P11 | Reporting and Operational Integrity | Reporting | None D1 | Blocked (depends on P7–P10 data existing) |
| P12 | Platform Administration | Administration | None D1 | Blocked (depends on P2, P4, P11) |
| P13 | Localization, Accessibility and PWA Hardening | Frontend (cross-cutting) | None D1 | Blocked (depends on core journeys existing, P2–P8) |
| P14 | Security, Resilience and Compliance Readiness | Trust, cross-cutting | DEC-LEGAL-001/003/005/006 (D2/D3) | Blocked (depends on P0–P13 substantially complete) |
| P15 | End-to-End Validation and Burundi Pilot | Cross-cutting | DEC-LEGAL-002 (D3, pilot) | Blocked (depends on P14) |
| P16 | Production Launch | Cross-cutting | None new | Blocked (depends on P15) |

### B.2 Detailed Phase Profiles

Each profile below follows the same structure: Phase ID, Name, Purpose, Primary Domains, Entry Criteria, Exit Criteria (TRD22's own words), Requirement Families, Decision/Provider/Legal Dependencies, Expected Tests, Expected Deployment State, Manual QA Requirement, Current Status — followed by its Work Packages.

---

#### Phase 0 — Repository and Delivery Foundation (TRD22 §22.10)

- **Purpose:** Create a controlled engineering foundation before product features are added.
- **Primary Domains:** None (infrastructure only) — TRD22 exit criteria explicitly require "no product-domain implementation has begun outside the approved structure."
- **Entry Criteria:** Version 1.0 documentation baseline declared (satisfied — see [Version 1.0 Documentation Declaration](../../00-governance/version-1-documentation-declaration.md)); DEC-TECH-003 and DEC-TECH-004 resolved (**satisfied — both CONFIRMED, Engineering Decision Sprint 2, 2026-07-17**).
- **Exit Criteria (TRD22 §22.10):** project builds; tests run; emulator starts; CI passes; no product-domain implementation has begun outside the approved structure.
- **Requirement Families:** `IM-001..015` (Implementation Rules, cross-cutting governance of how *every* phase is built); `FR-OPS-001..006` (isolated environments, CI/CD, secrets, version-controlled config, release manifest, deployment approval).
- **Decision Dependencies:** **DEC-TECH-003** (frontend tooling set, D1, **CONFIRMED**, no longer blocks Phase 0); **DEC-TECH-004** (repository structure/monorepo, D1, **CONFIRMED**, no longer blocks repository initialization).
- **Provider Dependencies:** None direct to Phase 0 itself (DEC-PROV-005, error monitoring, is required by Phase 1, not Phase 0).
- **Legal Dependencies:** None.
- **Expected Tests:** build passes; lint passes; unit test framework runs a placeholder suite; emulator suite starts cleanly.
- **Expected Deployment State:** none — Phase 0 has no deployment target; CI runs against the repository only.
- **Manual QA Requirement:** No.
- **Current Status:** **Complete.** Both work packages are `Complete`: **ENG-P0-001** (implemented, Technical Review Approved, committed `3a50710`, pushed to `origin/main` — see its [Implementation Report](../reports/ENG-P0-001-implementation-report-2026-07-17.md) and [Technical Review](../reports/ENG-P0-001-technical-review-2026-07-17.md)) and **ENG-P0-002** (implemented, Technical Review Approved, merged via [PR #1](https://github.com/Fkenogo/11THONUS/pull/1) at `e316565` on 2026-07-18T09:00:18Z, post-merge CI [passed](https://github.com/Fkenogo/11THONUS/actions/runs/29638421819) — see its [Implementation Report](../reports/ENG-P0-002-implementation-report-2026-07-17.md), [Technical Review](../reports/ENG-P0-002-technical-review-2026-07-17.md), and [Closure Report](../reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md)). TRD22 §22.10's exit criteria (project builds; tests run; emulator starts; CI passes; no product-domain implementation) are all satisfied with direct evidence from CI run `29638421819` on `main`. See the [Phase 0 Authorization](../phase-0-authorization.md) record and the [Engineering Transition D1 Agenda](../../00-governance/decisions/engineering-transition-d1-agenda.md) for the original decision analysis. **`ENG-P1-001` is `Ready`** (2026-07-19, Phase 0E) — see its own profile below and the [Version 1.0 Engineering Authorization Record](../../00-governance/version-1-engineering-authorization-record.md); `ENG-P1-002`/`ENG-P1-003` remain `Blocked`.

**Work Packages**

| Field | ENG-P0-001 | ENG-P0-002 |
|---|---|---|
| Work-Package Title | Repository, tooling and test-framework scaffold | CI pipeline, templates and change-tracking scaffold |
| Objective | A buildable, lintable, testable repository skeleton exists, matching the resolved DEC-TECH-003/004 direction | Every PR is automatically checked, and every future work package has a report/change-log template to fill in |
| Requirement IDs | IM-006, IM-007, FR-OPS-004 | FR-OPS-002, FR-OPS-005, FR-OPS-006, IM-013 |
| Decision Dependencies | **DEC-TECH-003**, **DEC-TECH-004** (both CONFIRMED) | **DEC-TECH-004** (CONFIRMED) |
| Provider Dependencies | — | — |
| Legal Dependencies | — | — |
| Preconditions | DEC-TECH-003/004 resolved (satisfied) | ENG-P0-001 complete |
| Expected Files/Areas | Repository root, package manifests, TS config, lint/format config, test runner config (planning-level — no concrete paths invented ahead of DEC-TECH-004) | `.github/` or equivalent CI config, `/docs/reports/` templates, `/docs/changes/` skeleton (TRD22 §22.39) |
| Required Validation | build, lint, typecheck, unit-test-runner smoke test, emulator start | CI pipeline dry run |
| Deployment Required | No | No |
| Manual QA Required | No | No |
| Status | **Complete** | **Complete** |
| Blocking Reason | — (none; complete) | — (none; complete) |
| Implementation Report | [ENG-P0-001 Implementation Report](../reports/ENG-P0-001-implementation-report-2026-07-17.md) · [Technical Review (Approved)](../reports/ENG-P0-001-technical-review-2026-07-17.md) | [ENG-P0-002 Implementation Report](../reports/ENG-P0-002-implementation-report-2026-07-17.md) · [Technical Review (Approved)](../reports/ENG-P0-002-technical-review-2026-07-17.md) · [Closure Report](../reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) |
| Commit Hash | `3a50710` | `e316565` (merge commit on `main`) |
| Deployment Reference | N/A — Phase 0 has no deployment target (see profile above) | N/A — Phase 0 has no deployment target (see profile above) |
| Notes | Per TRD22 §22.10 exit criteria, no product-domain code may be introduced here. Deployment/Preview Review/Manual QA recorded N/A per the Programme's own Phase 0 profile ("Expected Deployment State: none"; "Manual QA Requirement: No"), not skipped. | Establishes the IM-013 "founder-readable implementation report" habit from the very first phase. Finalized prompt: [`ENG-P0-002.md`](../prompts/ENG-P0-002.md) (issued and implemented). Pull request: [#1](https://github.com/Fkenogo/11THONUS/pull/1) — merged 2026-07-18T09:00:18Z, branch `feat/eng-p0-002-ci-foundation` deleted. Post-merge CI on `main`: [`29638421819`](https://github.com/Fkenogo/11THONUS/actions/runs/29638421819) — passed. |

---

#### Phase 1 — Firebase and Shared Platform Foundation (TRD22 §22.11)

- **Purpose:** Establish reusable infrastructure needed by every domain.
- **Primary Domains:** Cross-cutting (server foundation) — no single product domain.
- **Entry Criteria:** Phase 0 exit criteria met (satisfied); DEC-TECH-005 and DEC-PROV-005 resolved (**DEC-TECH-005 now `CONFIRMED`, Phase 0E, 2026-07-19 — `europe-west1` selected; `DEC-PROV-005` remains `OPEN_PROVIDER`, so this phase-level entry criterion is only partially satisfied — see Current Status below for which specific work packages this actually unblocks**; DEC-TECH-006/007 CONFIRMED, Engineering Decision Sprint 2 — no longer an entry-criteria blocker).
- **Exit Criteria (TRD22 §22.11):** shared server command can authenticate, validate, log and return a standard response; outbox event can be written and processed idempotently; unauthorized direct writes are denied; emulator tests pass.
- **Requirement Families:** `FR-OPS-003, FR-OPS-004, FR-OPS-008` (secrets, version-controlled config, structured logging); `DA-001, DA-005, DA-006, DA-014` (collection ownership, append-only Trust Events, no critical client writes, offline idempotency keys); `FR-SEC-006` (deny-by-default rules).
- **Decision Dependencies:** **DEC-TECH-005** (Cloud Environment & Deployment Strategy — **CONFIRMED, Phase 0E, 2026-07-19; region `europe-west1`**, see the [Cloud Environment & Deployment Strategy](../../06-engineering-governance/cloud-environment-and-deployment-strategy.md) and the [Version 1.0 Engineering Authorization Record](../../00-governance/version-1-engineering-authorization-record.md)); **DEC-TECH-006** (event delivery/outbox mechanism, D1, **CONFIRMED at the pattern level**, Engineering Decision Sprint 2 — exact schema remains Pass 2 detail authored alongside ENG-P1-002); **DEC-TECH-007** (idempotency storage approach, D1, **CONFIRMED at the policy level**, Engineering Decision Sprint 2 — per-operation schema remains Pass 2 detail authored alongside ENG-P1-002).
- **Provider Dependencies:** **DEC-PROV-005** (error monitoring provider, D1, `OPEN_PROVIDER`, blocks observability foundation — specifically `ENG-P1-003`, not `ENG-P1-001`).
- **Legal Dependencies:** DEC-TECH-005's region selection depended on EXT-LEG-006 (cross-border Firebase hosting position, tied to DEC-LEGAL-006) — **DEC-LEGAL-006 is now CONFIRMED (Phase 0E, 2026-07-19)**: engineering implementation is authorized; production deployment remains conditioned on completing legal validation, contractual documentation, and regulatory notifications per the applicable laws of the operating jurisdiction(s) — see the Decision Register and the Version 1.0 Engineering Authorization Record §9 (Remaining Operational Activities).
- **Expected Tests:** emulator-based integration tests for the shared command contract; Security Rules tests for deny-by-default; idempotent outbox processing test.
- **Expected Deployment State:** development and staging Firebase projects provisioned (target region `europe-west1`); production project created but access-restricted.
- **Manual QA Requirement:** No (automated/emulator validation only at this stage).
- **Current Status:** **Partially Ready.** Phase 0 is `Complete` (2026-07-18). `DEC-TECH-005` and `DEC-LEGAL-006` are both `CONFIRMED` (Phase 0E, 2026-07-19). **`ENG-P1-001` is `Complete`** (2026-07-23) — implemented, Technical Review Approved, all corrections closed, infrastructure closure criteria satisfied, committed and pushed, PR [#2](https://github.com/Fkenogo/11THONUS/pull/2) merged (merge commit `5714543`), pre- and post-merge CI both passed, and the Founder personally completed possession (`git pull origin main`, verified) and Preview Review (Firebase Emulator Suite, `Passed`) — see the [Closure Report](../reports/ENG-P1-001-closure-report-2026-07-22.md) for the full Definition-of-Done reconciliation. `ENG-P1-002`'s own sequencing/decision preconditions (`ENG-P1-001` completion; `DEC-TECH-006`/`007` CONFIRMED) were satisfied, the EIR governance stream reached `EIR-03`, and `ENG-P1-002` was implemented 2026-07-25 (TDD, 87/87 unit tests, 14/14 real Firestore emulator integration tests) — **`ENG-P1-002` is `Under Review`**, awaiting Technical Review before `Complete`. `DEC-PROV-005` remains `OPEN_PROVIDER`, so `ENG-P1-003` remains `Blocked`. The phase is therefore progressing on `ENG-P1-002` but not yet fully unblocked end-to-end (`ENG-P1-003` still pending `DEC-PROV-005`).

**Work Packages**

| Field | ENG-P1-001 | ENG-P1-002 | ENG-P1-003 |
|---|---|---|---|
| Work-Package Title | Firebase project init, App Check, client/admin SDK | Shared command contract (error, correlation-ID, logging, idempotency, event outbox) | Security/Storage Rules deny-by-default foundation + monitoring init |
| Objective | Firebase projects exist and a client can initialize against them safely | Every domain service can reuse one authenticate→validate→log→respond command shape | No write succeeds unless explicitly authorized, and failures are visible |
| Requirement IDs | FR-OPS-001, FR-OPS-003 | DA-005, DA-006, DA-014, FR-SEC-012 | FR-SEC-006, FR-OPS-009, FR-OPS-010 |
| Decision Dependencies | **DEC-TECH-005** — **CONFIRMED (Phase 0E, 2026-07-19); region `europe-west1`** | **DEC-TECH-006**, **DEC-TECH-007** (both CONFIRMED) | — |
| Provider Dependencies | — | — | **DEC-PROV-005** |
| Legal Dependencies | (via DEC-TECH-005) DEC-LEGAL-006 — **CONFIRMED (Phase 0E, 2026-07-19)**: engineering authorized; production compliance remains mandatory | — | — |
| Preconditions | Phase 0 complete (satisfied); DEC-TECH-005 resolved (satisfied) | ENG-P1-001 complete (DEC-TECH-006/007 resolved — CONFIRMED, Engineering Decision Sprint 2) **— satisfied**; per the [Master Workflow](../11thonus-master-workflow.md) §8 EIR governance stream, the sequencing condition is also satisfied (stream reached `EIR-03` on 2026-07-24) — `ENG-P1-002-PREP`/implementation remain their own, separately Founder-authorized task | ENG-P1-002 complete |
| Expected Files/Areas | Firebase project configuration (region `europe-west1`), client/admin SDK bootstrap (planning-level) | Shared server "command" module, outbox collection design | Firestore/Storage Rules files, monitoring/alerting config |
| Required Validation | emulator start, App Check smoke test | emulator integration test (command round-trip), idempotent outbox replay test | Security Rules test suite (allow/deny cases) |
| Deployment Required | Yes (dev/staging projects, `europe-west1`) | No | No (Rules deployed to emulator only at this stage) |
| Manual QA Required | No | No | No |
| Status | **Complete** *(2026-07-23)* | **Under Review** *(implemented 2026-07-25)* | Blocked |
| Blocking Reason | — *(Complete: Technical Review Approved, infrastructure closure satisfied, PR #2 merged — commit `5714543` — pre/post-merge CI passed, Founder pull and Preview Review both confirmed; see the [Closure Report](../reports/ENG-P1-001-closure-report-2026-07-22.md))* | Implemented test-first (TDD) against the [Engineering Blueprint](../prompts/ENG-P1-002-engineering-blueprint-2026-07-25.md); locally validated (typecheck/lint/format/build/test all pass, 87/87 unit tests) and validated against the real Firebase Emulator Suite (`pnpm emulators:validate`, 14/14 emulator-backed Firestore integration tests). Awaiting Technical Review — not yet `Complete`, which requires an Approved Technical Review per the Definition of Done | DEC-PROV-005 OPEN_PROVIDER — unaffected by `ENG-P1-001`'s status change |
| Implementation Report | [ENG-P1-001 Implementation Report](../reports/ENG-P1-001-implementation-report-2026-07-20.md) · [Technical Review (Approved with non-blocking observations)](../reports/ENG-P1-001-technical-review-2026-07-20.md) · [Closure Report](../reports/ENG-P1-001-closure-report-2026-07-22.md) | [ENG-P1-002 Implementation Report](../reports/ENG-P1-002-implementation-report-2026-07-25.md) | *(future link)* |
| Commit Hash | Merge commit `5714543336...` on `main` (from `chore/eng-p1-001-closure`, 6 commits, [PR #2](https://github.com/Fkenogo/11THONUS/pull/2)) | `ffaa49245ecca9a7e5b8986e70e0d2b889e5d7cf` on `chore/eng-p1-002-shared-foundation` ([PR #12](https://github.com/Fkenogo/11THONUS/pull/12)), CI [passed](https://github.com/Fkenogo/11THONUS/actions/runs/30161789044) — not yet merged | *(future placeholder)* |
| Deployment Reference | Firebase Emulator Suite (`demo-11thonus`) — both live `eleventh-on-us-dev`/`eleventh-on-us-staging` projects independently verified provisioned at `europe-west1` (Cloud Environment & Deployment Strategy §7); no application code deployed to either, consistent with this work package's scope | N/A | N/A |
| Notes | Production project "prepared but restricted" per TRD22 §22.11. First authorized Phase 1 work package — see the [Version 1.0 Engineering Authorization Record](../../00-governance/version-1-engineering-authorization-record.md) §10. Implemented 2026-07-20: environment loading, Firebase client SDK (App/Auth/Firestore/Storage/App Check), Firebase Admin SDK, and the `europe-west1` region constant — see the [Implementation Report](../reports/ENG-P1-001-implementation-report-2026-07-20.md). Review findings corrected 2026-07-21 (CFG-1/AC-1/AT-1/AD-1); read-only infrastructure preflight found `eleventh-on-us` unsuitable for `europe-west1` and six Founder decisions outstanding before project creation — see the [Closure Preflight Report](../reports/ENG-P1-001-review-observations-and-infrastructure-preflight-2026-07-21.md). | This is the foundation every later domain service depends on — highest architectural-discovery risk in the whole programme | — |

---

#### Phase 2 — Identity, Roles and Business Context (TRD22 §22.12)

- **Purpose:** Implement user identity and secure role-based access.
- **Primary Domains:** Identity.
- **Entry Criteria:** Phase 1 exit criteria met; DEC-SEC-001, DEC-ID-003, DEC-DATA-007, DEC-PROV-004 resolved.
- **Exit Criteria (TRD22 §22.12):** customer can register and display a safe loyalty identity; owner can create a business; owner can invite staff; role switching works; security-rule and authorization tests pass.
- **Requirement Families:** `AP-003, AP-004, AP-005, AP-006, AP-008, AP-009` (Accounts/Permissions principles); `BR-002..BR-012` (identity/role business rules); `FR-AUTHZ-001..010`; `FR-RBAC-001..008`; `PR-001..020` (privacy rules, customer data collection).
- **Decision Dependencies:** **DEC-SEC-001** (customer authentication approach and fallback, D1, blocks customer registration); **DEC-ID-003** (permission inheritance semantics, D1, blocks authorization implementation); **DEC-DATA-007** (loyalty number/QR generation, D1, blocks customer identity issuance — see Task 7 brief).
- **Provider Dependencies:** **DEC-PROV-004** (phone OTP delivery route, D1, blocks customer authentication).
- **Legal Dependencies:** None direct (DEC-LEGAL-005, children/family data, is D3/pilot-tier, not a Phase 2 blocker).
- **Expected Tests:** security-rule tests (customer/business/staff isolation); authorization tests (role switching, permission resolution); OTP flow integration test (emulator or sandboxed provider).
- **Expected Deployment State:** staging deployment with real (test) phone auth flow.
- **Manual QA Requirement:** Yes — first customer-facing flow (registration, business creation, staff invitation).
- **Current Status:** Blocked — depends on Phase 1 and 4 D1 decisions (the largest concentration of D1 blockers of any phase).

**Work Packages**

| Field | ENG-P2-001 | ENG-P2-002 | ENG-P2-003 | ENG-P2-004 |
|---|---|---|---|---|
| Work-Package Title | Customer identity (auth, profile, loyalty number, QR) | Business identity (create, owner, profile, branch) | Staff identity (invite, membership, suspend/reactivate/remove) | Role context and permission resolution |
| Objective | A customer can register and receive a safe, permanent public loyalty identity | An owner can create and manage a business record | An owner can invite and manage staff with individual accounts | A user can hold and switch between multiple role contexts safely |
| Requirement IDs | AP-005, BR-005, BR-006, PR-005 | AP-003, AP-004, BR-007, BR-008 | AP-009, BR-002, BR-010, BR-012, FR-AUTHZ-003 | AP-006, AP-008, BR-003, BR-011, FR-AUTHZ-001 |
| Decision Dependencies | **DEC-SEC-001**, **DEC-DATA-007** | — | — | **DEC-ID-003** |
| Provider Dependencies | **DEC-PROV-004** | — | — | — |
| Legal Dependencies | — | — | — | — |
| Preconditions | Phase 1 complete; DEC-SEC-001/DATA-007 resolved; DEC-PROV-004 resolved | ENG-P2-001 complete | ENG-P2-002 complete | ENG-P2-001..003 complete; DEC-ID-003 resolved |
| Expected Files/Areas | Identity domain service, customer profile schema (planning-level) | Identity domain service, business/branch schema | Identity domain service, membership schema | Authorization/permission-resolver module |
| Required Validation | emulator auth flow test, uniqueness/collision test for loyalty code | security-rule test (business isolation) | security-rule test (suspended-user denial) | authorization test matrix (owner/manager/staff × action) |
| Deployment Required | Yes (staging) | Yes (staging) | Yes (staging) | No (logic-level; deployed with the others) |
| Manual QA Required | Yes | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked | Blocked |
| Blocking Reason | DEC-SEC-001, DEC-DATA-007 OPEN; DEC-PROV-004 OPEN_PROVIDER | Depends on ENG-P2-001 | Depends on ENG-P2-002 | DEC-ID-003 OPEN_FOUNDER |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | Loyalty-code format depends on the DEC-DATA-007 decision brief (Task 7 companion) | Business "always has at least one active owner" (BR-007) must be enforced from creation | — | Security requirement: "loyalty number does not authenticate the customer" (TRD22 §22.12) |

---

#### Phase 3 — Commerce Knowledge and Business Onboarding (TRD22 §22.13)

- **Purpose:** Make business setup fast, consistent and multilingual.
- **Primary Domains:** Commerce Knowledge.
- **Entry Criteria:** Phase 2 exit criteria met.
- **Exit Criteria (TRD22 §22.13):** a business can complete onboarding without creating uncontrolled categories; Knowledge Studio can manage launch taxonomy; English and French labels display correctly; missing-option suggestion works.
- **Requirement Families:** `FR-SRCH-001, FR-SRCH-003, FR-SRCH-004, FR-SRCH-010..012`; `SD-002, SD-004, SD-005`.
- **Decision Dependencies:** None D1. DEC-TECH-008 (search implementation, D2) affects Knowledge Studio search but does not block onboarding itself.
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** taxonomy governance test (no uncontrolled category creation); EN/FR label completeness check.
- **Expected Deployment State:** staging, with seeded launch taxonomy.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 2.

**Work Packages**

| Field | ENG-P3-001 | ENG-P3-002 | ENG-P3-003 |
|---|---|---|---|
| Work-Package Title | Commerce Knowledge seed data | Business onboarding flow | Knowledge Studio MVP |
| Objective | Launch taxonomy (industries, categories, types, tags, EN/FR labels) exists and is queryable | A business can complete setup using only governed taxonomy | Taxonomy can be authored/approved/published without code changes |
| Requirement IDs | FR-SRCH-004, FR-SRCH-011 | FR-SRCH-001, SD-002 | FR-SRCH-011, FR-SRCH-012, SD-004 |
| Decision Dependencies | — | — | — |
| Provider Dependencies | — | — | — |
| Legal Dependencies | — | — | — |
| Preconditions | Phase 2 complete | ENG-P3-001 complete | ENG-P3-001 complete |
| Expected Files/Areas | Commerce Knowledge domain service, seed scripts | Business onboarding screens/flow | Knowledge Studio admin screens |
| Required Validation | seed-data integrity check, EN/FR completeness check | governed-taxonomy-only test (no free-text category creation) | draft→approve→publish workflow test |
| Deployment Required | Yes (staging) | Yes (staging) | Yes (staging) |
| Manual QA Required | No | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 2 completion | Depends on ENG-P3-001 | Depends on ENG-P3-001 |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | CP-008 "One Commerce Knowledge Layer" — reused by every future module | — | — |

---

#### Phase 4 — Reward Program Management (TRD22 §22.14)

- **Purpose:** Allow a business to define the loyalty offering.
- **Primary Domains:** Reward Programs.
- **Entry Criteria:** Phase 3 exit criteria met; DEC-LOY-009 resolved (schema freeze requirement).
- **Exit Criteria (TRD22 §22.14):** business can activate one valid Reward Program; all applicable taxonomy references are valid; versioning preserves historical terms; inactive businesses cannot activate a program; plan limits are server-enforced.
- **Requirement Families:** `FR-RP-001, FR-RP-004, FR-RP-010`; `BR-067`.
- **Decision Dependencies:** DEC-LOY-009 (reward quantity default and >1 support, D2, required by Phase 4 for schema freeze — not D1, but explicitly phase-blocking per its own register entry).
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** taxonomy-reference validation test; version-history preservation test; plan-limit server-enforcement test.
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 3 and DEC-LOY-009.

**Work Packages**

| Field | ENG-P4-001 | ENG-P4-002 |
|---|---|---|
| Work-Package Title | Reward Program CRUD and lifecycle | Versioning and plan-limit enforcement |
| Objective | A business can create, activate, pause and retire a Reward Program | Historical terms are preserved and plan limits are enforced server-side |
| Requirement IDs | FR-RP-001, FR-RP-004 | BR-067, FR-RP-010 |
| Decision Dependencies | DEC-LOY-009 | — |
| Provider Dependencies | — | — |
| Legal Dependencies | — | — |
| Preconditions | Phase 3 complete; DEC-LOY-009 resolved | ENG-P4-001 complete |
| Expected Files/Areas | Reward Programs domain service | Same domain service, versioning layer |
| Required Validation | lifecycle state-machine test (draft/active/paused/retired) | version-immutability test, plan-limit server-side test |
| Deployment Required | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes |
| Status | Blocked | Blocked |
| Blocking Reason | DEC-LOY-009 OPEN_FOUNDER | Depends on ENG-P4-001 |
| Implementation Report | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* |
| Notes | Fixed threshold of 10 Verified Units (PD-006) applies regardless of DEC-LOY-009's outcome | — |

---

#### Phase 5 — Purchase Recording (TRD22 §22.15)

- **Purpose:** Allow authorized business users to record qualifying purchases.
- **Primary Domains:** Purchase.
- **Entry Criteria:** Phase 4 exit criteria met.
- **Exit Criteria (TRD22 §22.15):** staff can create a Purchase Record quickly; customer does not yet gain progress; duplicate submission does not create duplicate records; unauthorized staff cannot record; offline items are clearly non-authoritative.
- **Requirement Families:** `BR-047..BR-055`; `FR-PVL-006`; `PVL-007`; `DA-014` (offline idempotency).
- **Decision Dependencies:** None D1.
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** idempotent-submission test; authorization test (unauthorized staff denial); offline-queue non-authoritative-state test.
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 4.

**Work Packages**

| Field | ENG-P5-001 | ENG-P5-002 | ENG-P5-003 |
|---|---|---|---|
| Work-Package Title | Purchase recording UI flow (QR/manual entry) | Server-side Purchase Record creation and idempotency | Offline queue and pending-sync display |
| Objective | Staff can quickly record a qualifying purchase | Every recorded purchase is a correctly attributed, idempotent Purchase Record | Offline-recorded purchases are visibly non-authoritative until synced |
| Requirement IDs | BR-050, BR-051 | BR-047, BR-048, BR-049, FR-PVL-006, PVL-007 | DA-014, FR-FE-010 (planned in Phase 13 frontend family, cited here for the offline behaviour it constrains) |
| Decision Dependencies | — | — | — |
| Provider Dependencies | — | — | — |
| Legal Dependencies | — | — | — |
| Preconditions | Phase 4 complete | ENG-P5-001 complete | ENG-P5-002 complete |
| Expected Files/Areas | Purchase recording screens | Purchase domain service | Offline queue/local-state layer |
| Required Validation | UI flow test | idempotency test (duplicate submission), authorization test | offline/online state-transition test |
| Deployment Required | Yes (staging) | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 4 completion | Depends on ENG-P5-001 | Depends on ENG-P5-002 |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | "Customer does not yet gain progress" (TRD22 exit criterion) — progress is Phase 7 | — | Full offline/PWA hardening is Phase 13; this WP is the minimum queueing needed for Phase 5 itself |

---

#### Phase 6 — Customer Verification and Disputes (TRD22 §22.16)

- **Purpose:** Make customer verification the controlling gate for loyalty progress.
- **Primary Domains:** Purchase, Trust.
- **Entry Criteria:** Phase 5 exit criteria met.
- **Exit Criteria (TRD22 §22.16):** only the registered customer can verify; rejected purchases generate no progress; disputes create review records; corrections require replacement and reverification; all transitions are audited.
- **Requirement Families:** `BR-052..BR-056`; `FR-PVL-002, FR-PVL-007, FR-PVL-009, FR-PVL-010`.
- **Decision Dependencies:** DEC-PROD-008 (fixing a wrongly recorded purchase, D2, Batch B item — affects the dispute/correction work package specifically).
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** verification-authority test (only registered customer); rejection test (no Verified Units created, per DEC-LOY-010); dispute/correction replacement-record test; audit-trail completeness test.
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes — this is the core trust mechanic (Constitution Pillar Two).
- **Current Status:** Blocked — depends on Phase 5.

**Work Packages**

| Field | ENG-P6-001 | ENG-P6-002 | ENG-P6-003 |
|---|---|---|---|
| Work-Package Title | Verification flow (Waiting for You, verify/verify selected) | Individual rejection with reason | Dispute and business resolution workflow |
| Objective | Only the registered customer can verify a purchase | A customer can reject a purchase individually, always with a reason (DEC-LOY-010) | A disputed purchase reaches a resolved, re-verifiable state without editing history |
| Requirement IDs | BR-052, BR-053, FR-PVL-002, FR-PVL-007 | BR-054, FR-PVL-009 | BR-056, FR-PVL-010 |
| Decision Dependencies | — | — | DEC-PROD-008 |
| Provider Dependencies | — | — | — |
| Legal Dependencies | — | — | — |
| Preconditions | Phase 5 complete | ENG-P6-001 complete | ENG-P6-001 complete; DEC-PROD-008 resolved |
| Expected Files/Areas | Customer verification screens, Purchase domain service | Same domain service, rejection-reason field | Dispute/Trust domain services |
| Required Validation | authorization test (verification), state-transition test | rejection test (per-record reason enforced, DEC-LOY-010) | replacement-record test, audit-trail test |
| Deployment Required | Yes (staging) | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 5 completion | Depends on ENG-P6-001 | DEC-PROD-008 OPEN_FOUNDER |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | Implements DEC-LOY-010 (CONFIRMED, D0) — individual rejection is already settled, this is pure implementation | Batch rejection is explicitly prohibited (DEC-LOY-010) | — |

---

#### Phase 7 — Loyalty Progress and Reward Availability (TRD22 §22.17)

- **Purpose:** Convert customer-verified activity into accurate loyalty progress.
- **Primary Domains:** Loyalty.
- **Entry Criteria:** Phase 6 exit criteria met; **DEC-LOY-008 resolved.**
- **Exit Criteria (TRD22 §22.17):** progress can be reconstructed from Verified Units; one active or reward-available cycle exists per customer and Reward Program; no Verified Units are lost; retrying verification produces one commercial outcome; reward availability is deterministic.
- **Requirement Families:** `BR-037..BR-045`; `CVLE-001..003`; `FR-CVLE-002`; `AP-RP-002`.
- **Decision Dependencies:** **DEC-LOY-008** (overflow Verified Unit allocation policy, D1, blocks Loyalty Domain implementation — flagged in the Founder Decision Agenda as "the most important product decision" remaining).
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** progress-reconstruction test (from Verified Units alone); overflow-allocation test (once DEC-LOY-008 resolved); idempotent-verification-retry test; deterministic reward-availability test.
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 6 and the single highest-priority remaining D1 founder decision.

**Work Packages**

| Field | ENG-P7-001 | ENG-P7-002 | ENG-P7-003 |
|---|---|---|---|
| Work-Package Title | Verified Unit issuance and uniqueness | Loyalty Cycle progress and threshold calculation | Reward creation, reward-available state, reconciliation job |
| Objective | Every verification produces exactly the right number of Verified Units, never duplicated | Progress accumulates correctly per customer/Reward Program, including the overflow case | A completed cycle deterministically produces one available reward |
| Requirement IDs | BR-037, BR-041, BR-045, CVLE-003, FR-CVLE-002 | BR-038, BR-040, BR-042, BR-043, CVLE-002 | BR-040, BR-044, CVLE-001 |
| Decision Dependencies | — | **DEC-LOY-008** | **DEC-LOY-008** |
| Provider Dependencies | — | — | — |
| Legal Dependencies | — | — | — |
| Preconditions | Phase 6 complete | ENG-P7-001 complete; DEC-LOY-008 resolved | ENG-P7-002 complete |
| Expected Files/Areas | Loyalty domain service | Same domain service, cycle/threshold logic | Same domain service, reconciliation job |
| Required Validation | uniqueness test (no duplicate Verified Units) | overflow-allocation test per the resolved DEC-LOY-008 option | deterministic-availability test, reconciliation job test |
| Deployment Required | Yes (staging) | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 6 completion | **DEC-LOY-008 OPEN_FOUNDER** | **DEC-LOY-008 OPEN_FOUNDER** |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | Can begin design once Phase 6 is complete even before DEC-LOY-008 resolves, but cannot be implemented against a concrete overflow rule until it does | The single most consequential open decision on the entire critical path | — |

---

#### Phase 8 — Reward Redemption and On Us Moments (TRD22 §22.18)

- **Purpose:** Complete the core customer promise.
- **Primary Domains:** Reward.
- **Entry Criteria:** Phase 7 exit criteria met.
- **Exit Criteria (TRD22 §22.18):** an available reward can be redeemed once; concurrent redemption attempts produce one success; customer sees the completed On Us Moment; next cycle begins correctly; all reward history remains available.
- **Requirement Families:** `BR-065, BR-070..BR-074`; `FR-RP-008`; `FR-RL-006`.
- **Decision Dependencies:** None D1 (DEC-LOY-008's resolution flows through from Phase 7 but is not a separate Phase 8 blocker).
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** atomic-redemption test (concurrency); duplicate-redemption-prevention test; cycle-closure/next-cycle test.
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes — this is the brand's core promise ("Every 11th, on us").
- **Current Status:** Blocked — depends on Phase 7.

**Work Packages**

| Field | ENG-P8-001 | ENG-P8-002 |
|---|---|---|
| Work-Package Title | Redemption flow (permission, validation, atomic redemption) | Cycle closure, next-cycle creation, On Us Moment history |
| Objective | An available reward can be redeemed exactly once, even under concurrent attempts | Redemption correctly closes the cycle, opens the next, and is permanently visible in history |
| Requirement IDs | BR-070, FR-RP-008 | BR-071, BR-072, BR-073, BR-074, FR-RL-006 |
| Decision Dependencies | — | — |
| Provider Dependencies | — | — |
| Legal Dependencies | — | — |
| Preconditions | Phase 7 complete | ENG-P8-001 complete |
| Expected Files/Areas | Reward domain service | Same domain service, cycle-closure logic |
| Required Validation | concurrency test (single success under simultaneous attempts) | cycle-closure test, history-visibility test |
| Deployment Required | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes |
| Status | Blocked | Blocked |
| Blocking Reason | Depends on Phase 7 completion | Depends on ENG-P8-001 |
| Implementation Report | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* |
| Notes | "A reward may be redeemed only once" (BR-070) is the single most safety-critical rule in this phase | — |

---

#### Phase 9 — Notifications (TRD22 §22.19)

- **Purpose:** Communicate essential platform actions reliably.
- **Primary Domains:** Notification.
- **Entry Criteria:** Phase 8 substantially complete (notification intents exist from Phase 5 onward, but delivery implementation follows the core loop).
- **Exit Criteria (TRD22 §22.19):** every core workflow generates the correct intent; duplicate events do not send repeated messages; English and French content passes review; failed delivery does not corrupt domain state.
- **Requirement Families:** `CR-005, CR-007, CR-009, CR-010`; `FR-COM-005, FR-COM-007, FR-COM-009, FR-COM-011, FR-COM-017`.
- **Decision Dependencies:** None D1.
- **Provider Dependencies:** DEC-PROV-002 (SMS provider, D2, required by Phase 9, blocks SMS notifications — push uses FCM, already confirmed).
- **Legal Dependencies:** None direct (marketing-consent requirements, CR-007, apply once marketing messaging is built, not launch-critical templates).
- **Expected Tests:** duplicate-suppression test; EN/FR content review; delivery-failure isolation test (domain state not corrupted).
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes (EN/FR content review is inherently manual).
- **Current Status:** Blocked — depends on Phase 8; design may begin earlier since intents are generated from Phase 5 onward.

**Work Packages**

| Field | ENG-P9-001 | ENG-P9-002 | ENG-P9-003 |
|---|---|---|---|
| Work-Package Title | Notification intent and template resolution (EN/FR, in-app) | Delivery abstraction (push/email/SMS, preferences, retries) | Launch-critical template set |
| Objective | Every domain event produces the correct notification intent | Delivery happens reliably, without duplicates, respecting preferences | All 11 launch-critical templates (TRD22 §22.19) exist in EN/FR |
| Requirement IDs | CR-005, FR-COM-005 | CR-009, CR-010, FR-COM-009, FR-COM-011 | FA-010 (EN/FR completeness, cited from the localization family) |
| Decision Dependencies | — | — | — |
| Provider Dependencies | — | DEC-PROV-002 | — |
| Legal Dependencies | — | — | — |
| Preconditions | Phase 8 substantially complete | ENG-P9-001 complete | ENG-P9-001 complete |
| Expected Files/Areas | Notification domain service | Delivery adapter layer | Template content files |
| Required Validation | intent-generation test per workflow | duplicate-suppression test, preference-respect test | EN/FR content review, template-resolution test |
| Deployment Required | Yes (staging) | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 8 substantially complete | DEC-PROV-002 OPEN_PROVIDER (SMS only; push/in-app can proceed) | Depends on ENG-P9-001 |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | — | Push (FCM) can proceed without DEC-PROV-002; SMS specifically is blocked | — |

---

#### Phase 10 — Subscription and Billing (TRD22 §22.20)

- **Purpose:** Enable businesses to subscribe and remain operational according to plan rules.
- **Primary Domains:** Subscription.
- **Entry Criteria:** Phase 8/9 substantially complete; DEC-PROV-001 resolved for payment activation.
- **Exit Criteria (TRD22 §22.20):** confirmed payment activates or renews a subscription once; duplicate callbacks have no duplicate effect; plan limits are server-enforced; suspended businesses preserve history; customer rewards are not erased by billing failure.
- **Requirement Families:** `FR-SUB-001..020`; `SB-005, SB-006, SB-009, SB-014`; `BR-030`.
- **Decision Dependencies:** None D1.
- **Provider Dependencies:** DEC-PROV-001 (Burundi subscription payment provider, D2, blocks subscription payments).
- **Legal Dependencies:** DEC-LEGAL-004 (mobile-money merchant agreement, D2, blocks payment provider go-live); DEC-LEGAL-003 (Burundi electronic billing requirements, D2, affects invoice/receipt content).
- **Expected Tests:** idempotent-webhook test (duplicate callback has no duplicate effect); plan-limit server-enforcement test; billing-failure-does-not-erase-rewards test.
- **Expected Deployment State:** staging, with sandbox payment provider credentials.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 8/9 and DEC-PROV-001/DEC-LEGAL-004.

**Work Packages**

| Field | ENG-P10-001 | ENG-P10-002 | ENG-P10-003 |
|---|---|---|---|
| Work-Package Title | Plan catalogue, pricing, trial, entitlement | Payment provider adapter, webhook validation, activation | Grace period, suspension, reactivation, billing admin |
| Objective | Plans and pricing exist and entitlements are computable | A confirmed payment activates a subscription exactly once | A lapsed subscription degrades gracefully without erasing history |
| Requirement IDs | FR-SUB-001, FR-SUB-002, FR-SUB-003, BR-030 | FR-SUB-006, FR-SUB-013, SB-005, SB-006 | FR-SUB-011, FR-SUB-012, SB-009 |
| Decision Dependencies | — | — | — |
| Provider Dependencies | — | DEC-PROV-001 | DEC-PROV-001 (indirect) |
| Legal Dependencies | — | DEC-LEGAL-004 | DEC-LEGAL-003 |
| Preconditions | Phase 8/9 substantially complete | ENG-P10-001 complete; DEC-PROV-001/DEC-LEGAL-004 resolved | ENG-P10-002 complete |
| Expected Files/Areas | Subscription domain service | Payment adapter (Integration domain) | Same domain service, billing-lifecycle logic |
| Required Validation | entitlement calculation test | webhook idempotency test, sandbox payment test | grace-period/suspension state-machine test |
| Deployment Required | Yes (staging) | Yes (staging, sandbox provider) | Yes (staging) |
| Manual QA Required | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 8/9 | DEC-PROV-001 OPEN_PROVIDER; DEC-LEGAL-004 OPEN_LEGAL | Depends on ENG-P10-002 |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | Subscription Domain stays provider-independent via Integration adapters (already CONFIRMED) | — | "Customer rewards are not erased by billing failure" is a hard exit criterion |

---

#### Phase 11 — Reporting and Operational Integrity (TRD22 §22.21)

- **Purpose:** Give businesses useful operational visibility.
- **Primary Domains:** Reporting.
- **Entry Criteria:** Phase 7–10 data exists (progress, redemption, subscription).
- **Exit Criteria (TRD22 §22.21):** metrics use governed definitions; projections are rebuildable; business cannot see another business; staff metrics are contextual; dashboard loading remains bounded.
- **Requirement Families:** `RR-001..015`; `FR-RPT-001..018`.
- **Decision Dependencies:** None D1.
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** cross-business-isolation test; projection-rebuild test; bounded-query performance test.
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 7–10 producing real data to report on.

**Work Packages**

| Field | ENG-P11-001 | ENG-P11-002 | ENG-P11-003 |
|---|---|---|---|
| Work-Package Title | Business dashboard | Reporting foundation (metric catalogue, projections) | Operational integrity (review queue, anomaly rules) |
| Objective | An owner sees today's activity and verification status at a glance | Every published metric has one governed definition and is rebuildable | Data-quality problems surface for review rather than silently persisting |
| Requirement IDs | FR-RPT-004, RR-001 | FR-RPT-001, FR-RPT-002, FR-RPT-003, FR-RPT-005 | RR-003, RR-008, RR-011 |
| Decision Dependencies | — | — | — |
| Provider Dependencies | — | — | — |
| Legal Dependencies | — | — | — |
| Preconditions | Phase 7–10 data exists | ENG-P11-001 complete | ENG-P11-002 complete |
| Expected Files/Areas | Reporting domain service, dashboard screens | Same domain service, projection jobs | Same domain service, review-queue logic |
| Required Validation | bounded-query test, isolation test | rebuild-from-source test | anomaly-detection test |
| Deployment Required | Yes (staging) | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 7–10 data | Depends on ENG-P11-001 | Depends on ENG-P11-002 |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | "Firebase Analytics shall not be the authoritative source for commercial metrics" (FR-RPT-012) | — | — |

---

#### Phase 12 — Platform Administration (TRD22 §22.22)

- **Purpose:** Enable safe platform operation without unrestricted database editing.
- **Primary Domains:** Administration.
- **Entry Criteria:** Phase 2 (identity), Phase 4 (Reward Programs), Phase 11 (reporting) substantially complete.
- **Exit Criteria (TRD22 §22.22):** routine support does not require Firebase Console; administrator permissions are separated; privileged changes are audited; Knowledge and Rules publication use governed workflows; emergency controls are tested.
- **Requirement Families:** `BR-098`; `FR-RBAC-001, FR-RBAC-005`; `AAP-002, AAP-006`; `AR-004, AR-008, AR-011, AR-014`; `FR-ADM-011, FR-ADM-012, FR-ADM-015`.
- **Decision Dependencies:** None D1.
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** administrator-permission-separation test; audit-log completeness test; emergency-control (maintenance mode) test.
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 2/4/11.

**Work Packages**

| Field | ENG-P12-001 | ENG-P12-002 |
|---|---|---|
| Work-Package Title | Administrator roles, MFA, support tooling | Knowledge/Rules Studio launch functions, feature flags, bulk-job framework |
| Objective | Support staff can help customers/businesses without raw database access | Publication workflows and emergency controls are governed and tested |
| Requirement IDs | BR-098, FR-RBAC-001, AAP-002, AR-004, AR-014 | AAP-006, AR-008, AR-011, FR-ADM-011, FR-ADM-012, FR-ADM-015 |
| Decision Dependencies | — | — |
| Provider Dependencies | — | — |
| Legal Dependencies | — | — |
| Preconditions | Phase 2/4/11 substantially complete | ENG-P12-001 complete |
| Expected Files/Areas | Administration domain service, admin screens | Same domain service, bulk-job/feature-flag modules |
| Required Validation | permission-separation test, audit test | dry-run bulk-operation test, maintenance-mode test |
| Deployment Required | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes |
| Status | Blocked | Blocked |
| Blocking Reason | Depends on Phase 2/4/11 | Depends on ENG-P12-001 |
| Implementation Report | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* |
| Notes | "No Universal Administrator" (AAP-002) — even platform admins are permission-scoped | — |

---

#### Phase 13 — Localization, Accessibility and PWA Hardening (TRD22 §22.23)

- **Purpose:** Prepare the customer and business experience for real-world use.
- **Primary Domains:** Frontend (cross-cutting).
- **Entry Criteria:** Core journeys (Phase 2–8) substantially complete.
- **Exit Criteria (TRD22 §22.23):** no launch-critical untranslated French keys; no backend terminology in customer copy; core customer and staff journeys pass accessibility review; PWA is usable without installation; offline states are clear.
- **Requirement Families:** `FA-006, FA-007, FA-010, FA-014, FA-018`; `FR-FE-008, FR-FE-009, FR-FE-010, FR-FE-014, FR-FE-015`.
- **Decision Dependencies:** None D1.
- **Provider Dependencies:** None.
- **Legal Dependencies:** None.
- **Expected Tests:** French-completeness CI check (TRD13 §13.15); accessibility review (keyboard, screen reader, touch target); PWA install/offline-shell test; lower-cost-device test.
- **Expected Deployment State:** staging.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on core journeys existing.

**Work Packages**

| Field | ENG-P13-001 | ENG-P13-002 | ENG-P13-003 |
|---|---|---|---|
| Work-Package Title | Complete EN/FR launch-critical copy | Accessibility review and remediation | PWA hardening (manifest, offline shell, browser matrix) |
| Objective | No launch-critical French key is missing | Core journeys pass accessibility review | The app is installable and usable offline at a basic level |
| Requirement IDs | FA-010, FR-FE-014, FR-FE-015 | FA-014 | FA-006, FA-007, FA-018, FR-FE-008, FR-FE-009, FR-FE-010 |
| Decision Dependencies | — | — | — |
| Provider Dependencies | — | — | — |
| Legal Dependencies | — | — | — |
| Preconditions | Core journeys (Phase 2–8) substantially complete | ENG-P13-001 complete | ENG-P13-001 complete |
| Expected Files/Areas | Translation bundles | Frontend components | PWA manifest, service worker/offline shell |
| Required Validation | CI French-completeness gate (TRD13 §13.15) | accessibility audit | install test, offline-shell test, browser matrix test |
| Deployment Required | Yes (staging) | Yes (staging) | Yes (staging) |
| Manual QA Required | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on core journeys existing | Depends on ENG-P13-001 | Depends on ENG-P13-001 |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Notes | "Missing required French translations shall block production release" (TRD13 §13.15) | — | — |

---

#### Phase 14 — Security, Resilience and Compliance Readiness (TRD22 §22.24)

- **Purpose:** Complete the controls required for a safe pilot.
- **Primary Domains:** Trust, cross-cutting.
- **Entry Criteria:** Phase 0–13 substantially complete.
- **Exit Criteria (TRD22 §22.24):** restore test passes; critical alerts are active; privacy and compliance gate is approved; no Severity 0 or Severity 1 security issue remains; operational runbooks are available.
- **Requirement Families:** `FR-SEC-006, FR-SEC-012, FR-SEC-016`; `FR-OPS-009..015`; `PR-001..020` (privacy/compliance).
- **Decision Dependencies:** None D1.
- **Provider Dependencies:** None new.
- **Legal Dependencies:** DEC-LEGAL-001 (Burundi privacy framework, D2/D3); DEC-LEGAL-003 (electronic billing, D2, carried from Phase 10); DEC-LEGAL-005 (minimum account age/children's data, D2); DEC-LEGAL-006 (cross-border Firebase hosting, carried from Phase 1's DEC-TECH-005).
- **Expected Tests:** restore-from-backup test; rollback test; Severity 0/1 security scan; privacy/compliance gate checklist.
- **Expected Deployment State:** staging, pilot-ready.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 0–13 substantially complete and legal review.

**Work Packages**

| Field | ENG-P14-001 | ENG-P14-002 | ENG-P14-003 |
|---|---|---|---|
| Work-Package Title | Security hardening (rules review, App Check, rate limiting, abuse controls) | Resilience (monitoring, alerts, backup/restore, rollback test) | Privacy and compliance readiness |
| Objective | No Severity 0/1 security issue remains open | A restore test and rollback test both pass | Privacy/compliance gate is approved before pilot |
| Requirement IDs | FR-SEC-006, FR-SEC-012, FR-SEC-016 | FR-OPS-009, FR-OPS-010, FR-OPS-013, FR-OPS-014, FR-OPS-015 | PR-009, PR-010, PR-016, PR-017, PR-018, PR-020 |
| Decision Dependencies | — | — | — |
| Provider Dependencies | — | — | — |
| Legal Dependencies | — | — | DEC-LEGAL-001, DEC-LEGAL-005, DEC-LEGAL-006 |
| Preconditions | Phase 0–13 substantially complete | ENG-P14-001 complete | ENG-P14-001/002 complete |
| Expected Files/Areas | Security Rules, rate-limit config | Monitoring/alerting config, backup jobs | Privacy policy, processing register, consent records |
| Required Validation | security scan, penetration-style rule tests | restore test, rollback test | compliance-gate checklist review |
| Deployment Required | Yes (staging) | Yes (staging) | No (documentation/legal artifact, not code) |
| Manual QA Required | Yes | Yes | Yes (legal/compliance review) |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 0–13 | Depends on ENG-P14-001 | DEC-LEGAL-001/005/006 OPEN_LEGAL |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | *(future placeholder)* | *(future placeholder)* | *(future placeholder)* |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | N/A |
| Notes | — | — | Legal conclusions are never reached by a coding agent — Founder + legal adviser only |

---

#### Phase 15 — End-to-End Validation and Burundi Pilot (TRD22 §22.25)

- **Purpose:** Validate the product with controlled real-world participation.
- **Primary Domains:** Cross-cutting (whole product).
- **Entry Criteria:** Phase 14 exit criteria met.
- **Exit Criteria (TRD22 §22.25):** complete end-to-end journey works with real participants; no unresolved Severity 0 or Severity 1 issue; data integrity reconciles; customer verification behavior is understood; operational support can resolve real cases; pilot findings are formally reviewed.
- **Requirement Families:** Cross-cutting — draws on every domain's requirements simultaneously; no new family introduced.
- **Decision Dependencies:** None new (all prior D1/D2 decisions should already be resolved by this point).
- **Provider Dependencies:** None new.
- **Legal Dependencies:** DEC-LEGAL-002 (consumer/loyalty terms and business reward obligations, D3, required by Phase 14/pilot).
- **Expected Tests:** full end-to-end journey test with real participants; data-integrity reconciliation.
- **Expected Deployment State:** production (pilot-scoped), per TRD22 §22.25's pilot scope (limited businesses, Bujumbura-first).
- **Manual QA Requirement:** Yes — this phase *is* manual/real-world validation.
- **Current Status:** Blocked — depends on Phase 14.

**Work Packages**

| Field | ENG-P15-001 | ENG-P15-002 | ENG-P15-003 |
|---|---|---|---|
| Work-Package Title | Pilot cohort setup and onboarding | Pilot execution and validation-area monitoring | Pilot findings review and exit-gate decision |
| Objective | A balanced pilot cohort is onboarded per TRD22 §22.25's scope | The 15 pilot validation areas (TRD22 §22.25) are actively monitored | Pilot findings are formally reviewed against the exit criteria |
| Requirement IDs | Cross-cutting — no single new ID family | Cross-cutting | Cross-cutting |
| Decision Dependencies | — | — | — |
| Provider Dependencies | — | — | — |
| Legal Dependencies | — | — | DEC-LEGAL-002 |
| Preconditions | Phase 14 complete | ENG-P15-001 complete | ENG-P15-002 complete |
| Expected Files/Areas | N/A (operational activity, not code) | N/A | N/A |
| Required Validation | cohort-selection checklist | live monitoring against §22.25's 15 validation areas | formal pilot review report |
| Deployment Required | Yes (production, pilot-scoped) | N/A (already deployed) | N/A |
| Manual QA Required | Yes | Yes | Yes |
| Status | Blocked | Blocked | Blocked |
| Blocking Reason | Depends on Phase 14 completion | Depends on ENG-P15-001 | Depends on ENG-P15-002; DEC-LEGAL-002 OPEN_LEGAL |
| Implementation Report | *(future link)* | *(future link)* | *(future link)* |
| Commit Hash | N/A | N/A | N/A |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* | N/A |
| Notes | This is the first phase with real production data and real customers | — | — |

---

#### Phase 16 — Production Launch (TRD22 §22.26)

- **Purpose:** Move from controlled pilot to public Burundi availability.
- **Primary Domains:** Cross-cutting.
- **Entry Criteria:** Phase 15 exit criteria met (pilot findings formally reviewed and accepted).
- **Exit Criteria (TRD22 §22.26):** production smoke test passes; customer registration works; business onboarding works; purchase verification works; progress works; redemption works; payment works; support intake works; monitoring shows no critical anomaly.
- **Requirement Families:** Cross-cutting — no new family introduced.
- **Decision Dependencies:** None new.
- **Provider Dependencies:** None new (all providers selected and live from earlier phases).
- **Legal Dependencies:** None new (Terms/Privacy publication and business agreements are TRD22 §22.26 launch requirements, dependent on DEC-LEGAL-001/002/004 already being resolved by this point).
- **Expected Tests:** full production smoke test (registration, onboarding, verification, progress, redemption, payment, support intake).
- **Expected Deployment State:** production, public Burundi availability.
- **Manual QA Requirement:** Yes.
- **Current Status:** Blocked — depends on Phase 15.

**Work Packages**

| Field | ENG-P16-001 | ENG-P16-002 |
|---|---|---|
| Work-Package Title | Launch readiness checklist execution | Production smoke test and go-live |
| Objective | Every TRD22 §22.26 launch requirement is confirmed complete | The platform is publicly available in Burundi with a passing smoke test |
| Requirement IDs | Cross-cutting — no single new ID family | Cross-cutting |
| Decision Dependencies | — | — |
| Provider Dependencies | — | — |
| Legal Dependencies | — | — |
| Preconditions | Phase 15 complete | ENG-P16-001 complete |
| Expected Files/Areas | N/A (checklist/operational activity) | N/A |
| Required Validation | launch-readiness checklist (TRD22 §22.26, 18 items) | production smoke test (9 items, TRD22 §22.26) |
| Deployment Required | Yes (production) | Yes (production, public) |
| Manual QA Required | Yes | Yes |
| Status | Blocked | Blocked |
| Blocking Reason | Depends on Phase 15 completion | Depends on ENG-P16-001 |
| Implementation Report | *(future link)* | *(future link)* |
| Commit Hash | N/A | N/A |
| Deployment Reference | *(future placeholder)* | *(future placeholder)* |
| Notes | — | The programme's terminal work package |

---

## C. Programme-Level Notes

- **Total phases:** 17 (Phase 0–16), matching TRD22 §22.9's phase list exactly.
- **Total work packages defined:** 47 (see the [Prompt Register](coding-agent-prompt-register.md) for the flat summary table).
- **Requirement IDs cited:** every ID above was verified to exist in the [Requirements Traceability & Implementation Matrix](../../00-governance/requirements-traceability-matrix.md) at creation time (see the companion report's validation section).
- **Decision IDs cited:** every ID above was verified to exist in the live [Decision Register](../../00-governance/decisions/decision-register.md) at creation time, with its actual current status, priority, and "Required by phase" field — not reconstructed from summary counts.
- This programme does not mark any phase or work package as started. All statuses reflect the documentation-only state as of Engineering Transition Phase 0A.
