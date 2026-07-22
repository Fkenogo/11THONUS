# Engineering Governance & Delivery Standards

**Classification:** Working (governance process) · **Created:** Phase 6, 2026-07-16

This section is the permanent operational handbook for how engineering work is performed on the 11thONUS platform — collaboration between the Founder, the ChatGPT Technical Lead, coding agents, and future engineering contributors. It documents **how engineering work is done, not how the product behaves.** Product behaviour remains governed by the [PRD](../01-product/prd/README.md); technical architecture remains governed by the [TRD](../02-technical/trd/README.md).

Start with the [Engineering Governance Charter](engineering-governance-charter.md) — it explains this section's scope, boundaries, and its relationship to every other governance document, including exactly which TRD sections it consolidates against rather than duplicates.

## Documents

| # | Document | Covers |
|---|---|---|
| 1 | [Engineering Governance Charter](engineering-governance-charter.md) | Purpose, scope, boundaries, relationship to Constitution / Decision Register / Traceability Matrix / Changes Log |
| 2 | [AI Collaboration Workflow](ai-collaboration-workflow.md) | The full Founder → ChatGPT Technical Lead → Implementation Prompt → Coding Agent → ... → Phase Complete sequence |
| 3 | [Coding Agent Standard](coding-agent-standard.md) | What a coding agent may and may not do; TRD22 §22.40 stop conditions |
| 4 | [Implementation Prompt Standard](implementation-prompt-standard.md) | Required structure of a work package / implementation prompt |
| 5 | [Technical Review Standard](technical-review-standard.md) | Who reviews, against what checklist, and the two possible outcomes |
| 6 | [Git Workflow](git-workflow.md) | Coding Agent → Commit → Push → Founder pull → Verify → Deploy; commit conventions; branching |
| 7 | [Deployment Workflow](deployment-workflow.md) | Deployment sequence, Preview Review, rollback trigger point |
| 8 | [Manual Testing Standard](manual-testing-standard.md) | Reusable, feature-agnostic manual QA checklist |
| 9 | [Definition of Done](definition-of-done.md) | Work-package-level completion gate |
| 10 | [Roles & Responsibilities](roles-and-responsibilities.md) | Founder / ChatGPT Technical Lead / Coding Agent / GitHub / Firebase / Manual QA / future team |
| 11 | [Engineering Principles](engineering-principles.md) | Judgment principles for situations no specific rule covers |
| 12 | [Cloud Environment & Deployment Strategy](cloud-environment-and-deployment-strategy.md) | Environment architecture, promotion model, Firebase project strategy, region-selection criteria, infrastructure-access governance, monitoring/DR/cost/security principles — operationalizes `DEC-TECH-005` |

## Relationship to Existing Governance

This section sits at the same working tier as the [Decision Register](../00-governance/decisions/README.md) and the [Requirements Traceability & Implementation Matrix](../00-governance/requirements-traceability-matrix.md) — below the Constitution, PRD and TRD in the governance hierarchy (Constitution Part VII; [Documentation Index](../README.md) §1). It consolidates against, and never duplicates, the engineering-process content already approved in:

- **TRD Chapter 19** (Quality Engineering) — test architecture, feature-level Definition of Done (§19.49), release gates (§19.52), quality ownership (§19.64);
- **TRD Chapter 20** (Deployment and Operational Resilience) — branching, CI, CD, deployment permissions, artifacts, rollback readiness;
- **TRD Chapter 22** (MVP Implementation and Delivery) — Delivery Principles (DIP-001..007), Implementation Work-Package Standard (§22.38), Coding-Agent Change Tracking (§22.39), Coding-Agent Stop Conditions (§22.40), Phase Review Standard (§22.41).

`docs/03-standards/engineering-standards/` remains a separate, not-yet-authored placeholder reserved for **product-implementation technical standards** (repository layout, TypeScript rules, Firestore/Functions conventions, error codes, state-transition/idempotency implementation, migrations) — a different concern from this section's collaboration-process focus. See the [Engineering Governance Charter](engineering-governance-charter.md) §3–5 for the full boundary explanation.

## Rules for Changes to This Section

Same rules as every other governance document ([Documentation Index](../README.md) §6): every edit is logged in the [Documentation Changes Log](../00-governance/documentation-changes-log.md); no edit here may resolve an open Decision Register entry, change a requirement ID, or modify product requirements.
