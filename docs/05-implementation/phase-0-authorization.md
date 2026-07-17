> **Title:** Phase 0 Authorization
> **Version:** 1.0 · **Status:** Active governance record — official authorization · **Classification:** Working (governance record)
> **Governing document:** [Engineering Decision Sprint 2 task brief](../00-governance/documentation-changes-log.md) (2026-07-17); [Decision Register](../00-governance/decisions/decision-register.md); [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md)
> **Source-of-truth path:** `docs/05-implementation/phase-0-authorization.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 2 — created)

# Phase 0 Authorization

## 1. Purpose

This document is the formal, dated authorization to begin TRD22 §22.10 Phase 0 (Repository and Delivery Foundation) — the first engineering implementation phase of the 11thONUS platform. It exists because Engineering Decision Sprint 2 explicitly requires a discrete authorization artifact, separate from the Decision Register edits and governance-document synchronization that made Phase 0 possible: converting decisions to `CONFIRMED` is a register-level act, and issuing an actual coding-agent prompt is a workflow-level act (per the [AI Collaboration Workflow](../06-engineering-governance/ai-collaboration-workflow.md)), but *authorizing the phase to begin* is a distinct governance checkpoint, recorded here.

**This document does not itself create a repository, write code, or issue a coding-agent prompt.** It records that the prerequisites for doing so are satisfied and that repository initialization work (ENG-P0-001) may now proceed through the normal AI Collaboration Workflow.

## 2. Authorization Date

**2026-07-17** — Engineering Decision Sprint 2.

## 3. Engineering Baseline

This authorization rests on the following baseline, each independently verifiable in the live documentation suite:

- **Documentation governance baseline:** Version 1.0 Documentation Declaration (Phase 7, 2026-07-17) — the controlled documentation baseline for engineering implementation.
- **Architecture reference:** [Version 1 Engineering Blueprint](../02-technical/version-1-engineering-blueprint.md) (Engineering Transition Phase 0B) — consolidates TRD8/9/10/11/12/16/20 into one engineering-facing reference.
- **Engineering Standards Pass 1:** [`03-standards/engineering-standards/`](../03-standards/engineering-standards/README.md) (9 documents, Engineering Transition Phase 0B) — repository/folder, naming, TypeScript, linting/formatting, testing, logging, error-handling, documentation, and commit conventions.
- **Implementation programme:** [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md) (47 work packages across TRD22's 17 phases) and [Coding-Agent Prompt Register](change-tracking/coding-agent-prompt-register.md) (Engineering Transition Phase 0A).
- **Decision governance:** [Decision Register](../00-governance/decisions/decision-register.md), [Decision Governance Workflow](../00-governance/decision-governance-workflow.md), [Decision Update Procedure](../00-governance/decision-update-procedure.md).

## 4. Approved Engineering Decisions

The following D1-priority, Engineering-owned decisions were reviewed under Engineering Decision Sprint 2 and are now **CONFIRMED** in the live Decision Register, each via the sanctioned [Decision Update Procedure](../00-governance/decision-update-procedure.md), applied under the explicit Founder-directed instruction constituted by the Sprint 2 task brief:

| Decision | Final Decision (summary) | Decision Date | Approved By |
|---|---|---|---|
| **DEC-TECH-003** — Frontend tooling set | Vite (build tool), React Router (routing), TanStack Query (server state), React Hook Form + Zod (forms/validation), shadcn/ui + Tailwind CSS (components/styling), Lucide (icons), Recharts (charts), TanStack Table (tables), vite-plugin-pwa/Workbox (PWA), Vitest + React Testing Library + Playwright (testing), ESLint + Prettier (lint/format), pnpm (package manager). Full rationale: [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md). | 2026-07-17 | Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2) |
| **DEC-TECH-004** — Repository structure | Monorepo — frontend and Cloud Functions code, including shared types, in a single repository. | 2026-07-17 | Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2) |
| **DEC-TECH-006** — Event delivery mechanism (outbox) | Firestore-transaction + event-outbox + background-processor pattern confirmed at the pattern level (future Pub/Sub migration path preserved). Exact outbox collection schema remains Pass 2 implementation detail, authored alongside ENG-P1-002. | 2026-07-17 | Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2) |
| **DEC-TECH-007** — Idempotency storage approach | Combined, per-operation approach confirmed at the policy level (dedicated collection or deterministic document IDs, chosen per operation). Per-operation schema remains Pass 2 implementation detail, authored alongside ENG-P1-002. | 2026-07-17 | Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2) |

Full text of each confirmed record, including Supporting References and Document Corrections Required, is in the [Decision Register](../00-governance/decisions/decision-register.md).

## 5. Prerequisites Satisfied

- [x] Documentation governance baseline declared (Version 1.0, Phase 7).
- [x] Architecture-level ambiguity for Phase 0 resolved (Version 1 Engineering Blueprint, DEC-TECH-004 §2).
- [x] Engineering Standards Pass 1 authored and covers every Phase 0 concern that does not depend on a still-open decision.
- [x] Both of ENG-P0-001's blocking decisions (DEC-TECH-003, DEC-TECH-004) are CONFIRMED.
- [x] No Founder-owned or Provider-owned decision was required for Phase 0 itself (Phase 0's Decision Dependencies were exclusively Engineering-owned).
- [x] Governance documents referencing these decisions have been synchronized — no remaining document describes DEC-TECH-003/004 as "recommended" or "pending sign-off" (see the [Engineering Decision Sprint 2 Report](reports/eng-decision-sprint-2-report-2026-07-17.md) §6 for the full consistency validation).

## 6. Repository Initialization Authorized

**Repository initialization (ENG-P0-001) is authorized to proceed.** This means:

- ENG-P0-001 is recorded as `Ready` in the [Coding-Agent Prompt Register](change-tracking/coding-agent-prompt-register.md) and the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md).
- The [ENG-P0-001 draft prompt](prompts/ENG-P0-001-draft.md) may be finalized (with the confirmed decisions cited by ID, per its own §4) and issued through the [AI Collaboration Workflow](../06-engineering-governance/ai-collaboration-workflow.md), starting at stage 1 (Founder).
- **This authorization does not itself issue the prompt.** Issuing a detailed coding-agent implementation prompt remains a distinct workflow action for the Founder / ChatGPT Technical Lead to take when ready — this document removes the governance blocker, not the workflow step.

## 7. Phase 0 Scope

Per TRD22 §22.10 and the [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md#phase-0), Phase 0 (Repository and Delivery Foundation) covers:

- **ENG-P0-001** — Repository, tooling and test-framework scaffold: repository initialization per the confirmed monorepo structure; frontend and Cloud Functions workspace scaffolding per the confirmed tooling; TypeScript strict-mode, formatting, and linting configuration; test-framework installation with a placeholder passing test; Firebase Emulator Suite configuration; environment-configuration template (no secrets committed). **Now `Ready`.**
- **ENG-P0-002** — CI pipeline, templates and change-tracking scaffold: automated PR checks; implementation-report and documentation-changes templates; `/docs/changes/` skeleton (TRD22 §22.39). **Remains `Blocked`** — its own decision dependency (DEC-TECH-004) is now CONFIRMED, but it has a sequential precondition (ENG-P0-001 complete) that is not yet satisfied.

Phase 0 exit criteria (TRD22 §22.10, unchanged by this authorization): project builds; tests run; emulator starts; CI passes; no product-domain implementation has begun outside the approved structure.

## 8. Explicit Exclusions

This authorization does **not**:

- Create a repository, initialize Git, install packages, create a Firebase project, generate code, scaffold React or Vite, create Cloud Functions, create CI/CD configuration, generate tests, create `package.json`, or create a pnpm workspace. All such artifacts remain to be produced when ENG-P0-001 is actually issued and executed.
- Authorize any phase beyond Phase 0. Phase 1 remains `Blocked` — see §9 below.
- Resolve, approve, or reword any Founder-owned decision (DEC-LOY-008, DEC-ID-003) or Provider-owned decision (DEC-PROV-004, DEC-PROV-005).
- Alter product requirements, the Platform Constitution, any TRD, or any PRD.
- Introduce any new engineering decision or tooling recommendation beyond what DEC-TECH-003/004/006/007 already state.

## 9. Conditions for Entering Phase 1

Phase 1 (Firebase and Shared Platform Foundation, TRD22 §22.11) remains `Blocked`. Entry requires:

1. **Phase 0 exit criteria met** — ENG-P0-001 and ENG-P0-002 both complete (not yet started).
2. **DEC-TECH-005** (Firebase region) resolved — still genuinely `OPEN_ENGINEERING`: the regional evaluation has not been performed, and the decision also depends on the unresolved **DEC-LEGAL-006** (cross-border hosting legal position, tied to **EXT-LEG-006**). This Engineering Decision Sprint did not close it, correctly — no evaluation exists yet to record, and the legal question is outside Engineering's authority to resolve.
3. **DEC-PROV-005** (error monitoring provider) resolved — still genuinely `OPEN_PROVIDER`: no provider evaluation has been performed.

**DEC-TECH-006 and DEC-TECH-007 no longer block Phase 1 entry** — both are CONFIRMED at the pattern/policy level (§4 above); their remaining schema-level detail is ordinary Phase 1 implementation work (ENG-P1-002), not a standing architectural blocker.

## 10. Relationship to Other Governance Documents

- [Decision Register](../00-governance/decisions/decision-register.md) — the authoritative record of the confirmed decisions this authorization relies on.
- [Engineering Decision Closure Recommendations](../00-governance/decisions/engineering-decision-closure-recommendations.md) and [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md) — the analysis that prepared the closures this authorization confirms were applied.
- [Engineering Transition D1 Agenda](../00-governance/decisions/engineering-transition-d1-agenda.md) — the original engineering-sequenced view of all 11 D1 decisions, now partially resolved.
- [Version 1 Engineering Blueprint](../02-technical/version-1-engineering-blueprint.md) — the architecture reference these decisions complete.
- [Engineering Implementation Programme](change-tracking/engineering-implementation-programme.md) / [Coding-Agent Prompt Register](change-tracking/coding-agent-prompt-register.md) — where ENG-P0-001's `Ready` status is tracked operationally.
- [Engineering Decision Sprint 2 Report](reports/eng-decision-sprint-2-report-2026-07-17.md) — the full completion report for the sprint that produced this authorization.
