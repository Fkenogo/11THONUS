> **Title:** 11thONUS Documentation Manifest — Version 1.0
> **Version:** 1.0 · **Status:** Controlled reference · **Classification:** Working (governance record)
> **Governing document:** 11thONUS Platform Constitution
> **Source-of-truth path:** `docs/00-governance/documentation-manifest-v1.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 2 — status references for DEC-TECH-003/004/006/007 updated to CONFIRMED; created Phase 7)

# 11thONUS Documentation Manifest — Version 1.0

## 1. Purpose

This is the master inventory of every authoritative document in the 11thONUS documentation suite as of the Version 1.0 baseline (Phase 7). For each document it records: purpose, authority level, owner, version, status, and relationship to other documents. Where the [Documentation Index](../README.md) tells a reader *how the suite is organized*, this manifest tells a reader *exactly what exists, at what authority, and who is accountable for it* — the master checklist a future engineer or auditor works from.

**Authority levels used below** (defined in the [Documentation Index](../README.md) §2): Governing · Authoritative Product · Authoritative Technical · Supporting Standard · Working/Controlled reference · Audit evidence · Archived/Superseded.

## 2. Governing (1)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [Platform Constitution](platform-constitution.md) | Enduring principles governing platform design, development and evolution | Governing (highest) | Founder | 1.1 | Active | Every other document conforms to this; amended only via Part VI |

## 3. Authoritative Product — PRD (12)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [PRD index](../01-product/prd/README.md) | Navigation and domain-mapping index for all PRD stages | Authoritative Product | Founder | 1.0 | Active | Indexes the 11 files below |
| [00 — Product Foundation](../01-product/prd/00-product-foundation.md) | Vision, mission, philosophy, ONUS Principles, core loyalty model, Product Decision Register | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution; corrected Phase 3B per DEC-LOY-010 |
| [01 — Accounts, Roles & Permissions](../01-product/prd/01-accounts-roles-and-permissions.md) | Identity, role, and permission model | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution; requirement IDs normalized Phase 4 (FR-AUTHZ) |
| [02 — Customer Registration and Identity](../01-product/prd/02-customer-registration-and-identity.md) | Customer onboarding and identity requirements | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution |
| [03 — Business Registration](../01-product/prd/03-business-registration.md) | Business onboarding requirements | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution |
| [04 — Customer-Verified Loyalty](../01-product/prd/04-customer-verified-loyalty.md) | Core Verified Unit / verification loyalty engine requirements | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution; gained FR-CVLE-001..013 IDs Phase 4 |
| [05 — Purchase Verification](../01-product/prd/05-purchase-verification.md) | Purchase recording and verification lifecycle | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution; corrected Phase 3B per DEC-DATA-003 |
| [06 — Reward Programs and Loyalty Cycles](../01-product/prd/06-reward-programs-and-loyalty-cycles.md) | Reward Program configuration and cycle requirements | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution |
| [07 — Reward Redemption](../01-product/prd/07-reward-redemption.md) | Redemption lifecycle requirements | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution |
| [08 — Trust Management](../01-product/prd/08-trust-management.md) | Trust and fraud-control requirements | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution |
| [09 — Reporting and Analytics](../01-product/prd/09-reporting-and-analytics.md) | Reporting requirements | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution |
| [10 — Platform Administration](../01-product/prd/10-platform-administration.md) | Administration requirements | Authoritative Product | Founder | 1.0 | Active | Governed by Constitution; requirement IDs normalized Phase 4 (FR-RBAC) |

## 4. Authoritative Technical — TRD (18)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [TRD index](../02-technical/trd/README.md) | Navigation and domain-mapping index for all TRD chapters | Authoritative Technical | Founder / Engineering Lead | 1.0 | Active | Indexes the 17 chapter files below |
| [01–07 — Platform Architecture](../02-technical/trd/01-07-platform-architecture.md) | Logical architecture, domains, event model | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [08 — Firebase Platform Architecture](../02-technical/trd/08-firebase-platform-architecture.md) | Firebase service responsibilities and environment strategy | Authoritative Technical | Engineering Lead | 1.0 | Active | Operationalizes PD-020/PD-021 |
| [09 — Physical and Integration Architecture](../02-technical/trd/09-physical-and-integration-architecture.md) | Physical/integration topology | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [10 — Firestore Data Architecture](../02-technical/trd/10-firestore-data-architecture.md) | Data model, Collection Ownership Matrix | Authoritative Technical | Engineering Lead | 1.0 | Active | Corrected Phase 3B per DEC-DATA-003; source of domain/collection data for the Traceability Matrix |
| [11 — Cloud Functions and Domain Services](../02-technical/trd/11-cloud-functions-and-domain-services.md) | Backend service architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [12 — Security and Access Control](../02-technical/trd/12-security-and-access-control.md) | Security architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [13 — Communications and Localization](../02-technical/trd/13-communications-and-localization.md) | Notification and language architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Source of English/French launch-language requirement (CR-003) |
| [14 — Search and Discovery](../02-technical/trd/14-search-and-discovery.md) | Search architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [15 — Reporting and Analytics](../02-technical/trd/15-reporting-and-analytics.md) | Reporting/analytics architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [16 — Frontend and PWA Architecture](../02-technical/trd/16-frontend-and-pwa-architecture.md) | Frontend/PWA architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [17 — Subscription and Billing](../02-technical/trd/17-subscription-and-billing.md) | Subscription/billing architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [18 — Platform Governance and Administration](../02-technical/trd/18-platform-governance-and-administration.md) | Admin/governance tooling architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [19 — Quality Engineering](../02-technical/trd/19-quality-engineering.md) | Test architecture, feature-level DoD, release gates, quality ownership | Authoritative Technical | Engineering Lead | 1.0 | Active | Cited (not duplicated) by Engineering Governance §6/§9 (Manual Testing Standard, Definition of Done) |
| [20 — Deployment and Operational Resilience](../02-technical/trd/20-deployment-and-operational-resilience.md) | Branching, CI/CD, deployment permissions, rollback | Authoritative Technical | Engineering Lead | 1.0 | Active | Cited (not duplicated) by Engineering Governance (Git Workflow, Deployment Workflow); OP→OR IDs normalized Phase 4 |
| [21 — Privacy and Data Protection](../02-technical/trd/21-privacy-and-data-protection.md) | Privacy/data-protection architecture | Authoritative Technical | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [22 — MVP Implementation and Delivery](../02-technical/trd/22-mvp-implementation-and-delivery.md) | MVP scope, phase sequencing, Delivery Principles, coding-agent work-package/stop-condition/review standards | Authoritative Technical | Engineering Lead | 1.0 | Active | Cited (not duplicated) by Engineering Governance (§22.38–41 → Coding Agent Standard, Prompt Standard, Review Standard) |
| [23 — Traceability and Completion Review](../02-technical/trd/23-traceability-and-completion-review.md) | Traceability model, governance hierarchy source (§23.3), assumptions | Authoritative Technical | Engineering Lead | 1.0 | Active | Source of the confirmed governance hierarchy (DEC-GOV-001); A→AS IDs normalized Phase 4 |

## 5. Supporting Standard (4)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [Commerce Knowledge Standard](../03-standards/commerce-knowledge-standard.md) | Shared multilingual taxonomy standard (CP-008) | Supporting Standard | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [Knowledge Studio](../03-standards/knowledge-studio.md) | Knowledge-layer authoring tool standard | Supporting Standard | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [Rules Studio](../03-standards/rules-studio.md) | Typed business-rule authoring tool standard | Supporting Standard | Engineering Lead | 1.0 | Active | Governed by Constitution and PRD |
| [Engineering Standards](../03-standards/engineering-standards/README.md) | **Placeholder** — future product-implementation technical standards (repo layout, TypeScript, Firestore/Functions conventions, error codes, migrations) | Supporting Standard (not yet authored) | Engineering Lead | — | Placeholder | Scope boundary vs. Engineering Governance clarified Phase 6 |

## 6. Governance Records — Working (16)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [Canonical Reference](canonical-reference.md) | Controlled navigation/consolidation summary | Working (controlled reference) | Documentation maintainer | current | Active | Mirrors Constitution/PRD/TRD; never leads |
| [Decision Governance Workflow](decision-governance-workflow.md) | The decision lifecycle process | Working (governance process) | Founder | 1.0 | Active | Governs how the Decision Register is updated |
| [Decision Update Procedure](decision-update-procedure.md) | The 8-step editing procedure implementing the workflow | Working (governance process) | Founder / Documentation maintainer | 1.0 | Active | Implements the Decision Governance Workflow |
| [Decisions index](../00-governance/decisions/README.md) | Index of decision-related records | Working | Founder | current | Active | Indexes the 5 files below |
| [Decision Register](../00-governance/decisions/decision-register.md) | The single record of what was decided (103 records) | Working (governance record) | Founder | current | Active | Below Constitution/PRD/TRD; records, never overrides |
| [Founder Decision Agenda](../00-governance/decisions/founder-decision-agenda.md) | Batched OPEN_FOUNDER items awaiting founder review | Working | Founder | current | Active | Derived from the Decision Register |
| [Assumptions Register](../00-governance/decisions/assumptions-register.md) | Documented MVP assumptions | Working | Founder / Engineering Lead | current | Active | Cross-referenced from the Decision Register |
| [External Dependencies Register](../00-governance/decisions/external-dependencies-register.md) | Documented external/provider dependencies | Working | Founder / Engineering Lead | current | Active | Cross-referenced from the Decision Register |
| [Phase 3 Reconciliation](../00-governance/decisions/phase-3-reconciliation.md) | Historical reconciliation record from Decision Register creation | Working (historical) | Documentation maintainer | current | Historical | Superseded in practice by the live register |
| [Design Decision Knowledge Base](design-decision-knowledge-base.md) | The rationale behind the platform's major long-term decisions | Working (governance record) | Founder | 1.0 | Active *(created Phase 7)* | Companion to the Decision Register (what) — records why |
| [Documentation Manifest v1](documentation-manifest-v1.md) | This document — master inventory of every authoritative document | Working (governance record) | Documentation maintainer | 1.0 | Active *(created Phase 7, this file)* | References every document in this list |
| [Documentation Changes Log](documentation-changes-log.md) | Append-only running log of every controlled documentation change | Working (governance record) | Documentation maintainer | running | Active | Every phase appends an entry |
| [Requirement ID Mapping](requirement-id-mapping.md) | Permanent Old ID → New ID mapping from Phase 4 | Working (governance record) | Documentation maintainer | 1.0 | Active | Referenced whenever an old requirement ID is encountered |
| [Requirements Traceability & Implementation Matrix](requirements-traceability-matrix.md) | Row-per-requirement map from documentation to planned implementation (934 records) | Working (governance record) | Founder / Engineering Lead | 1.0 | Active (permanent) | Below Constitution/PRD/TRD/Decision Register; records, never leads |
| [Traceability Maintenance Guide](traceability-maintenance-guide.md) | How the matrix stays accurate over the product's life | Working (governance process) | Documentation maintainer | 1.0 | Active | Companion to the Traceability Matrix |
| [Version 1.0 Documentation Declaration](version-1-documentation-declaration.md) | Declares the suite Version 1.0 and the engineering baseline | Working (governance record) | Founder | 1.0 | Active *(created Phase 7)* | Formal output of this phase; see §8 |

## 7. Engineering Governance & Delivery Standards (12)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [Section index](../06-engineering-governance/README.md) | Navigation index for the section | Working (governance process) | Founder | 1.0 | Active | Indexes the 11 files below |
| [Engineering Governance Charter](../06-engineering-governance/engineering-governance-charter.md) | Scope, boundaries, consolidation rule against TRD19/20/22 | Working (governance process) | Founder | 1.0 | Active | Governs the rest of this section |
| [AI Collaboration Workflow](../06-engineering-governance/ai-collaboration-workflow.md) | The 16-stage Founder→...→Phase Complete workflow | Working (governance process) | Founder | 1.0 | Active | Central process document; all others reference its stages |
| [Coding Agent Standard](../06-engineering-governance/coding-agent-standard.md) | Coding-agent operating boundaries and stop conditions | Working (governance process) | Founder | 1.0 | Active | Operationalizes TRD22 §22.38–22.41 |
| [Implementation Prompt Standard](../06-engineering-governance/implementation-prompt-standard.md) | Required work-package/prompt structure | Working (governance process) | Founder | 1.0 | Active | Built on TRD22 §22.38 |
| [Technical Review Standard](../06-engineering-governance/technical-review-standard.md) | Review checklist and outcomes | Working (governance process) | Founder | 1.0 | Active | Grounded in TRD22 §22.41 |
| [Git Workflow](../06-engineering-governance/git-workflow.md) | Commit→Push→Pull→Verify→Deploy sequence | Working (governance process) | Founder | 1.0 | Active | Operationalizes TRD20 §20.10–20.13 |
| [Deployment Workflow](../06-engineering-governance/deployment-workflow.md) | Deployment sequence and Preview Review | Working (governance process) | Founder | 1.0 | Active | Operationalizes TRD20 §20.11–20.21 |
| [Manual Testing Standard](../06-engineering-governance/manual-testing-standard.md) | Reusable, feature-agnostic manual QA checklist | Working (governance process) | Founder | 1.0 | Active | Distinct from, cites, TRD19's test architecture |
| [Definition of Done](../06-engineering-governance/definition-of-done.md) | Work-package-level completion gate | Working (governance process) | Founder | 1.0 | Active | Distinct from TRD19 §19.49 (feature) and TRD22 exit gate (phase) |
| [Roles & Responsibilities](../06-engineering-governance/roles-and-responsibilities.md) | Named roles across the workflow | Working (governance process) | Founder | 1.0 | Active | Referenced by every other document in this section |
| [Engineering Principles](../06-engineering-governance/engineering-principles.md) | Judgment principles for uncovered situations | Working (governance process) | Founder | 1.0 | Active | Grounded in Constitution Part V and TRD22 DIP-001..007 |

## 8. Traceability Section Index (1)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [`04-traceability/README.md`](../04-traceability/README.md) | Redirect to the governance-tier traceability files (§6 above) | Working (index) | Documentation maintainer | current | Active (redirect) | Points to `00-governance/requirements-traceability-matrix.md` etc. |

## 9. Implementation Tracking (11)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [Phase Tracker](../05-implementation/change-tracking/documentation-phases.md) | Running record of every documentation phase's status | Working (governance record) | Documentation maintainer | running | Active | Updated at the end of every phase |
| [Reports index](../05-implementation/reports/README.md) | Index of every phase implementation report | Working (index) | Documentation maintainer | current | Active | Indexes the 7 reports below plus the Phase 7 report |
| [Phase 2 report](../05-implementation/reports/phase-2-implementation-report-2026-07-16.md) | Repository restructuring report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Phase 3 report](../05-implementation/reports/phase-3-decision-register-report-2026-07-16.md) | Decision Register creation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Phase 3A report](../05-implementation/reports/phase-3a-governance-report-2026-07-16.md) | Governance freeze-preparation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Phase 3B report](../05-implementation/reports/phase-3b-batch-a-decisions-report-2026-07-16.md) | Batch A decisions report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Phase 4 report](../05-implementation/reports/phase-4-requirement-id-normalization-report-2026-07-16.md) | Requirement ID normalization report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Phase 5 report](../05-implementation/reports/phase-5-traceability-matrix-report-2026-07-16.md) | Traceability matrix creation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Phase 6 report](../05-implementation/reports/phase-6-engineering-governance-report-2026-07-16.md) | Engineering Governance creation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Version 1.0 Engineering Readiness Report](../05-implementation/reports/version-1-engineering-readiness.md) | Phase 7 engineering-readiness assessment | Working (governance record) | Founder | 1.0 | Active *(created Phase 7)* | Basis for the Version 1.0 Declaration |
| [Phase 7 report](../05-implementation/reports/phase-7-documentation-finalization-report-2026-07-17.md) | Documentation Finalization & Version 1.0 Engineering Readiness implementation report | Working (historical record) | Documentation maintainer | final | Active *(created Phase 7)* | Referenced by the phase tracker; this manifest's own source record |

## 10. Product Experience Principles (1)

*(Added — created after the Version 1.0 baseline, 17 July 2026.)*

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [Product Experience Principles](../01-product/product-experience-principles.md) | Product philosophy for design/frontend work — how the platform should feel, not how it should be implemented | Authoritative Product | Founder | 1.0 | Active | Companion to the PRD; governs the Product Design section (§13 below) |

## 11. Engineering Transition Programme (Phases 0A–0B) (18)

*(Added — created after the Version 1.0 baseline, 17 July 2026. These are planning/preparation documents, not TRD22 Phase 0 itself — see each report's own status statement.)*

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md) | All 17 TRD22 phases broken into 47 tracked work packages | Working (governance record) | ChatGPT Technical Lead | 1.0 | Active | Governs the Prompt Register below |
| [Coding-Agent Prompt Register](../05-implementation/change-tracking/coding-agent-prompt-register.md) | Founder-readable status of all 47 work packages | Working (governance record) | ChatGPT Technical Lead | 1.0 | Active | Flat summary of the Programme above |
| [ENG-P0-001 draft](../05-implementation/prompts/ENG-P0-001-draft.md) | First implementation-prompt draft; Ready, not yet issued | Working (draft; `Ready` in Prompt Register) | ChatGPT Technical Lead | draft 1.0 | Ready | DEC-TECH-003 and DEC-TECH-004 both CONFIRMED (Engineering Decision Sprint 2) |
| [Engineering Transition D1 Agenda](../00-governance/decisions/engineering-transition-d1-agenda.md) | The 11 D1-priority decisions blocking TRD22 Phases 0–2, engineering-sequenced | Working (governance record) | Founder / Engineering Lead | 1.0 | Active | Filtered view of the Decision Register |
| [Loyalty Code Decision Brief](../00-governance/decisions/loyalty-code-decision-brief.md) | Founder-facing proposal for DEC-DATA-007 | Working (governance record, proposal) | ChatGPT Technical Lead | 1.0 | Active — awaiting review | Prepares, does not resolve, DEC-DATA-007 |
| [Engineering Decision Closure Recommendations](../00-governance/decisions/engineering-decision-closure-recommendations.md) | Sourced closure recommendations for 3 of 7 Engineering-owned D1 decisions | Working (governance record) | ChatGPT Technical Lead | 1.0 | Active — all 3 applied (Engineering Decision Sprint 2) | Register updated per the Decision Update Procedure |
| [Version 1 Engineering Blueprint](../02-technical/version-1-engineering-blueprint.md) | Consolidated technical architecture reference (TRD8/9/10/11/12/16/20) | Authoritative Technical (consolidation) | Engineering Lead | 1.0 | Active | Governs the Engineering Standards below |
| [Engineering Standards — index](../03-standards/engineering-standards/README.md) | Pass 1/Pass 2 index | Supporting Standard | Engineering Lead | 1.0 | Active | Indexes the 9 documents below |
| [Repository and Folder Standards](../03-standards/engineering-standards/repository-and-folder-standards.md) | Repo/folder structure standard | Supporting Standard | Engineering Lead | 1.0 | Active | Implements DEC-TECH-004 |
| [Naming Conventions](../03-standards/engineering-standards/naming-conventions.md) | File/identifier naming standard | Supporting Standard | Engineering Lead | 1.0 | Active | — |
| [TypeScript Conventions](../03-standards/engineering-standards/typescript-conventions.md) | Strict-mode/type discipline standard | Supporting Standard | Engineering Lead | 1.0 | Active | — |
| [Linting and Formatting Conventions](../03-standards/engineering-standards/linting-and-formatting-conventions.md) | Lint/format policy | Supporting Standard | Engineering Lead | 1.0 | Active | Tool names (ESLint/Prettier) CONFIRMED via DEC-TECH-003 |
| [Testing Conventions](../03-standards/engineering-standards/testing-conventions.md) | Test location/naming, TRD19 mapping | Supporting Standard | Engineering Lead | 1.0 | Active | — |
| [Logging Conventions](../03-standards/engineering-standards/logging-conventions.md) | Operationalizes TRD20 §20.23–26 | Supporting Standard | Engineering Lead | 1.0 | Active | — |
| [Error Handling Conventions](../03-standards/engineering-standards/error-handling-conventions.md) | Operationalizes TRD11 §11.34–35 | Supporting Standard | Engineering Lead | 1.0 | Active | — |
| [Documentation Conventions](../03-standards/engineering-standards/documentation-conventions.md) | Code-level documentation standard | Supporting Standard | Engineering Lead | 1.0 | Active | — |
| [Commit Conventions](../03-standards/engineering-standards/commit-conventions.md) | Pointer to Git Workflow §4 + 2 additions | Supporting Standard | Engineering Lead | 1.0 | Active | — |
| [Engineering Transition Phase 0A Report](../05-implementation/reports/engineering-transition-phase-0a-report-2026-07-17.md) | Phase 0A implementation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Engineering Transition Phase 0B Report](../05-implementation/reports/engineering-transition-phase-0b-report-2026-07-17.md) | Phase 0B implementation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |

## 12. Documentation Manifest Catch-Up Note

This manifest's §10–§11 above were added retroactively as part of Phase 8 (17 July 2026) to close a gap: the manifest's own maintenance rule (§17) calls for regeneration whenever a new authoritative document is created, but it was not updated during Engineering Transition Phases 0A/0B or the Product Experience Principles task. Every document created in those phases is now captured above; no document was silently omitted. Phase 8's own additions are in §13 below.

## 13. Product Design (Phase 8) (11 markdown files; 2 rows below describe non-markdown asset folders, not counted as separate documents)

*(Added — created 17 July 2026, Phase 8: Product Design Documentation & UX Governance.)*

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [Product Design — section index](../07-product-design/README.md) | Section index | Authoritative Product (design) | Founder / Design Lead | 1.0 | Active | Indexes the 7 documents below |
| [UX Direction](../07-product-design/ux-direction.md) | Overall philosophy, hierarchy, navigation/screen/interaction philosophy, future evolution | Authoritative Product (design) | Founder / Design Lead | 1.0 | Active | Governed by Product Experience Principles |
| [Navigation Model](../07-product-design/navigation-model.md) | Primary/secondary/customer/business navigation; admin gap disclosed | Authoritative Product (design) | Founder / Design Lead | 1.0 | Active | — |
| [Interaction Patterns](../07-product-design/interaction-patterns.md) | Recurring interactions, Stitch-validated vs. governing-document-only | Authoritative Product (design) | Founder / Design Lead | 1.0 | Active | Cites TRD16 §16.44–16.48 |
| [Moments That Matter](../07-product-design/moments-that-matter.md) | 8 major emotional moments — purpose/emotion/objective/success criteria | Authoritative Product (design) | Founder / Design Lead | 1.0 | Active | Maps to Product Experience Principles §7 |
| [Trust Indicators](../07-product-design/trust-indicators.md) | Recurring trust-language vocabulary | Authoritative Product (design) | Founder / Design Lead | 1.0 | Active | — |
| [Design Anti-Patterns](../07-product-design/design-anti-patterns.md) | What must never appear, each traced to a Constitution value/Pillar | Authoritative Product (design) | Founder / Design Lead | 1.0 | Active | — |
| [Design Decisions Register](../07-product-design/design-decisions.md) | Major UX decisions: reason, alternatives, dependencies, review triggers | Working (governance record — design) | Founder / Design Lead | 1.0 | Active | 6 entries (DEC-UX-001..006) |
| [`stitch/README.md`](../stitch/README.md) | Redirect from the original Stitch location | Working (index, redirect) | Documentation maintainer | current | Active (redirect) | Points to `07-product-design/stitch/` |
| [`stitch/exploration-v1/`](../07-product-design/stitch/exploration-v1/) (8 concepts) | Initial systematic Stitch exploration | Working (approved design asset) | Founder / Design Lead | v1 | Active | Superseded in part by v2 — see DEC-UX-001 |
| [`stitch/exploration-v2/`](../07-product-design/stitch/exploration-v2/) (4 concepts + 1 design-system spec) | Reviewed and approved refinement pass | Working (approved design asset) | Founder / Design Lead | v2 | Active — approved | Basis for UX Direction, Design Decisions §DEC-UX-003 |
| [`stitch/archive/`](../07-product-design/stitch/archive/) (1 orphan asset) | Unlabeled asset, preserved rather than guessed into a version | Working (archive) | Documentation maintainer | — | Archived | — |
| [Phase 8 Report](../05-implementation/reports/phase-8-product-design-documentation-report-2026-07-17.md) | Phase 8 implementation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |

## 13A. Documentation Manifest Catch-Up Note (Engineering Decision Sprints 1–2)

This manifest's §11 above (Engineering Transition Programme, Phases 0A–0B) predates Engineering Decision Sprint 1 (DEC-TECH-003 evaluation) and Engineering Decision Sprint 2 (decision confirmation and Phase 0 authorization), both of which produced documents not yet catalogued in this manifest. §13B below closes that gap, consistent with the maintenance rule in §17.

## 13B. Engineering Decision Sprints 1–2 (4)

*(Added — created 17 July 2026: Engineering Decision Sprint 1 produced the first 2 rows; Engineering Decision Sprint 2 produced the last 2.)*

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md) | Full Version 1 frontend stack evaluation and recommendation | Working (governance record) | ChatGPT Technical Lead | 1.0 | Active — recommendation applied (Sprint 2) | Basis for the CONFIRMED DEC-TECH-003 record |
| [Engineering Decision Sprint 1 Report](../05-implementation/reports/eng-decision-sprint-1-dec-tech-003-report-2026-07-17.md) | Sprint 1 implementation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |
| [Phase 0 Authorization](../05-implementation/phase-0-authorization.md) | Official authorization to begin engineering — baseline, approved decisions, prerequisites, Phase 0 scope, exclusions, Phase 1 entry conditions | Working (governance record — authorization) | Founder / Engineering Lead | 1.0 | Active | Relies on the CONFIRMED decisions in the Decision Register |
| [Engineering Decision Sprint 2 Report](../05-implementation/reports/eng-decision-sprint-2-report-2026-07-17.md) | Sprint 2 implementation report | Working (historical record) | Documentation maintainer | final | Historical | Referenced by the phase tracker |

## 14. Root Index (1)

| Document | Purpose | Authority | Owner | Version | Status | Relationship |
|---|---|---|---|---|---|---|
| [`docs/README.md`](../README.md) | Documentation Index — hierarchy, classifications, document groups, current status | Working (index) | Documentation maintainer | current | Active | The entry point referencing every document above |

## 15. Audit Evidence and Archive (non-authoritative, historical — 29 files)

These are preserved for audit trail and history. They are **never implemented against** and are excluded from the "authoritative document" counts elsewhere in this manifest and in the Version 1.0 Engineering Readiness Report.

| Group | Location | File count | Status |
|---|---|---|---|
| 2026-07-16 documentation audit (9 reports, findings register, TRD consolidation audit, Phase 1 report, file-location mapping) | `90-audits/2026-07-16-documentation-audit/` | 12 | Audit evidence — frozen |
| Superseded documents | `99-archive/superseded/` | 2 | Archived — never implement |
| Phase 1 source backups | `99-archive/source-backups/phase-1-2026-07-16/` | 15 | Archived — never implement |

## 16. Manifest Totals

| Category | Count |
|---|---|
| Governing | 1 |
| Authoritative Product (PRD, incl. index) | 12 |
| Authoritative Technical (TRD, incl. index) | 18 |
| Supporting Standard | 4 |
| Governance Records — Working | 16 |
| Engineering Governance & Delivery Standards | 12 |
| Traceability section index | 1 |
| Implementation Tracking | 11 |
| Product Experience Principles | 1 |
| Engineering Transition Programme (Phases 0A–0B) | 18 |
| Product Design (Phase 8) — markdown files only | 11 |
| Engineering Decision Sprints 1–2 | 4 |
| Root Index | 1 |
| **Total authoritative/working markdown documents** | **110** |
| Audit evidence and archive (non-authoritative) | 29 |
| **Grand total markdown files in suite** | **139** |
| *(memo, not added to totals)* Non-markdown approved design assets (`stitch/exploration-v1/` — 8 concepts, `.html`+`.png`; `stitch/exploration-v2/` — 4 concepts, `.html`+`.png`; `stitch/archive/` — 1 orphan `.png`) | — |

*(Note: this manifest itself is counted in §6 above. Totals now reflect the suite state immediately after Engineering Decision Sprint 2 completes — Version 1.0 (Phase 7) plus Engineering Transition Phases 0A–0B, the Product Experience Principles, Phase 8's Product Design section, and Engineering Decision Sprints 1–2 (§13B). The DESIGN.md file inside `stitch/exploration-v2/premium_verification_system/` is one of the 11 markdown files counted in §13; the exploration-v1/v2/archive rows in §13 describe non-markdown HTML/PNG design assets and are listed for completeness but excluded from the markdown totals above. Figures for §13B verified by direct count of the 4 newly-catalogued files against the prior 135-file baseline (135 + 4 = 139; 106 + 4 = 110).)*

## 17. Maintenance

This manifest is regenerated in full whenever a new authoritative document is created or an existing one is retired, as part of that change's normal governance process (logged in the [Documentation Changes Log](documentation-changes-log.md)). It is not updated for routine content edits within an already-listed document — only for additions, removals, or authority/status changes.
