# Definition of Done (Work Package Level)

> **Title:** Definition of Done (Work Package Level)
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/definition-of-done.md`
> **Last controlled update:** 2026-08-07 (`CAP-P2-006` — added a §2 application note clarifying how the criteria apply to concern-level completion per `DEC-GOV-009`/`DEC-GOV-010`; **no §2 criterion changed**). Previously: 2026-07-16 (Phase 6 — created)

## 1. Purpose

This document defines when a single **work package** — one pass through the [AI Collaboration Workflow](ai-collaboration-workflow.md), from Implementation Prompt to Phase Complete — is actually done. It operates at a narrower level than TRD19 §19.49's Definition of Done, which governs when a **product feature** is done, and TRD22's MVP Exit Gate, which governs when an entire **MVP phase** is done. All three operate together: a feature is not done until every work package implementing it is done (this document); an MVP phase is not done until every feature in it is done (TRD19 §19.49, TRD22 exit gate).

## 2. Work-Package Definition of Done

A work package is done only when **all** of the following are true:

1. the Implementation Prompt's Acceptance Criteria are met, verbatim, with no unstated exceptions;
2. all Required Tests from the prompt passed (§10, [Implementation Prompt Standard](implementation-prompt-standard.md));
3. Local Validation (stage 6 of the workflow) was actually run, not merely claimed;
4. the Implementation Report was produced in full, per §3 of the [Implementation Prompt Standard](implementation-prompt-standard.md);
5. the persistent changes-tracking file was updated (TRD22 §22.39) — or, for documentation-programme work, the [Documentation Changes Log](../00-governance/documentation-changes-log.md) entry was appended;
6. [Technical Review](technical-review-standard.md) returned **Approved**, with no open corrections;
7. the change was committed and pushed per [Git Workflow](git-workflow.md);
8. the Founder pulled, verified, and deployed the change per [Git Workflow](git-workflow.md) §3 and [Deployment Workflow](deployment-workflow.md);
9. Preview Review passed;
10. [Manual Testing Standard](manual-testing-standard.md)'s general checklist passed, and any launch-critical-flow-specific checks passed;
11. no unrelated files were modified (confirmed at Technical Review, §4 of that standard);
12. any risk or rollback note from the Implementation Report remains accurate at the point of deployment.

**Passing compilation, or the code existing in the repository, is never sufficient on its own** (TRD22 §22.41).

> **Application note — concern-level completion (`DEC-GOV-009`/`DEC-GOV-010`, 2026-08-07):** these clarify how §2 **applies** when assessing whether an architectural *concern* (a set of work packages) is complete — they do **not** change any §2 criterion. Per `DEC-GOV-009` (G1): the capability-level Architecture Review may satisfy §2.6 (Technical Review) for packages within its baseline; a package implemented after that baseline needs its own review coverage. Per `DEC-GOV-010` (G2): §2.8–2.10 (deployment, Preview Review, Manual QA) are **not** concern-completion criteria for a domain-layer concern that delivers no deployable customer-facing surface — they are classified to later Capability Closure / Release / Production Readiness (see [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity)). Both decisions are recorded in the [Decision Register](../00-governance/decisions/decision-register.md).

## 3. What This Does Not Cover

This work-package-level gate does not replace:

- **TRD19 §19.49** (feature-level Definition of Done) — requirements implemented, error/loading/empty states, permissions, EN/FR copy, accessibility, analytics, documentation, migrations, release notes, assessed at the whole-feature level once all its work packages are done;
- **TRD19 §19.52** (Release Gates) — the six gates (Code Quality, Architecture, Security, User Experience, Operations, Business Validation) assessed before a production release;
- **TRD22's MVP Exit Gate** — the whole-MVP-scope completion criteria.

A work package can satisfy this document's Definition of Done and still leave its parent feature incomplete if other work packages for that feature remain open — that is expected and normal.

## 4. Recording Completion

Once §2 is fully satisfied, the work package's status is updated wherever it is tracked: the relevant row(s) in the [Requirements Traceability & Implementation Matrix](../00-governance/requirements-traceability-matrix.md) (Implementation Status column) move from "Not Started" toward "In Progress" or "Complete" as appropriate, and the phase tracker (for documentation-programme work) or an equivalent implementation-phase tracker (for application work) is updated.

## 5. Relationship to Existing Governance

TRD19 §19.49 and TRD22's MVP Exit Gate remain authoritative for feature- and phase-level completion. This document exists because neither of those addresses the smaller, more frequent unit of work — a single coding-agent work package — that this collaboration model actually operates in. It draws its criteria directly from documents already defined in this section rather than inventing new ones.

## 6. Relationship to Other Engineering Governance Documents

Every criterion in §2 references a specific stage of the [AI Collaboration Workflow](ai-collaboration-workflow.md) and the document governing that stage: [Coding Agent Standard](coding-agent-standard.md), [Implementation Prompt Standard](implementation-prompt-standard.md), [Technical Review Standard](technical-review-standard.md), [Git Workflow](git-workflow.md), [Deployment Workflow](deployment-workflow.md), [Manual Testing Standard](manual-testing-standard.md).
