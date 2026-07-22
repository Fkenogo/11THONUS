# AI Collaboration Workflow

> **Title:** AI Collaboration Workflow
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/ai-collaboration-workflow.md`
> **Last controlled update:** 2026-07-22 (added a Master Workflow Consultation pre-stage (§2, §3 stage table) — see the [11thONUS Version 1.0 Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md); previously: 2026-07-16, Phase 6 — created)

## 1. Purpose

This is the single, authoritative sequence every unit of engineering work follows, from Founder intent to a phase being declared complete. It is generic enough to apply to any future engineering phase, while reflecting the specific 11thONUS collaboration model: one Founder, one ChatGPT Technical Lead, one or more coding agents, and (eventually) future engineering contributors.

## 2. The Workflow

```
Master Workflow Consultation
   ↓
Founder
   ↓
ChatGPT Technical Lead
   ↓
Implementation Prompt
   ↓
Coding Agent
   ↓
Local Implementation
   ↓
Local Validation
   ↓
Implementation Report
   ↓
Technical Review
   ↓
Approval / Corrections
   ↓
Git Commit
   ↓
Git Push
   ↓
Founder Pull
   ↓
Deployment
   ↓
Preview Review
   ↓
Manual QA
   ↓
Phase Complete
```

## 3. Stage-by-Stage Definition

| # | Stage | What happens | Who is responsible | Governing document |
|---|---|---|---|---|
| 0 | **Master Workflow Consultation** *(added 2026-07-22)* | Before task definition, the current phase, current work package, blockers, and next authorized action are confirmed against the [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md). | Founder, ChatGPT Technical Lead, Coding Agent (each at their own stage) | [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §3, §15 |
| 1 | **Founder** | States intent: a goal, a problem, or a phase to begin, in plain language. | Founder | [Roles & Responsibilities](roles-and-responsibilities.md) |
| 2 | **ChatGPT Technical Lead** | Translates intent into a scoped, technically grounded plan: which documents apply, which requirement IDs are in play, what decisions (if any) are already CONFIRMED, what is out of scope. | ChatGPT Technical Lead | [Roles & Responsibilities](roles-and-responsibilities.md) |
| 3 | **Implementation Prompt** | The plan is written as a structured work package (Context, Task, In Scope, Out of Scope, Constraints, Acceptance Criteria, Required Tests, Verification Commands, Reporting Requirements). | ChatGPT Technical Lead | [Implementation Prompt Standard](implementation-prompt-standard.md); grounded in TRD22 §22.38 |
| 4 | **Coding Agent** | Receives the prompt and begins work strictly within its stated scope and constraints. | Coding Agent | [Coding Agent Standard](coding-agent-standard.md) |
| 5 | **Local Implementation** | The agent implements the change in a local/sandboxed environment — never directly against production. | Coding Agent | [Coding Agent Standard](coding-agent-standard.md); TRD20 §20.10–20.13 |
| 6 | **Local Validation** | The agent runs the required tests and verification commands from the prompt before reporting anything as done. | Coding Agent | [Coding Agent Standard](coding-agent-standard.md); TRD19 test architecture |
| 7 | **Implementation Report** | The agent produces the markdown report required by the prompt standard and appends the persistent changes-tracking file (TRD22 §22.39). | Coding Agent | [Implementation Prompt Standard](implementation-prompt-standard.md) §5 |
| 8 | **Technical Review** | The ChatGPT Technical Lead (or a future human reviewer) checks the report and the diff against the Phase Review Standard. | ChatGPT Technical Lead | [Technical Review Standard](technical-review-standard.md); grounded in TRD22 §22.41 |
| 9 | **Approval / Corrections** | The reviewer either approves the work package or sends it back with specific, itemized corrections — never a vague "fix it." | ChatGPT Technical Lead | [Technical Review Standard](technical-review-standard.md) |
| 10 | **Git Commit** | Once approved, the agent commits the change with a conventional, traceable commit message. | Coding Agent | [Git Workflow](git-workflow.md) |
| 11 | **Git Push** | The agent pushes the commit to the shared remote. | Coding Agent | [Git Workflow](git-workflow.md) |
| 12 | **Founder Pull** | The Founder pulls the change to their own environment (`git pull origin main`) before anything is deployed. | Founder | [Git Workflow](git-workflow.md) |
| 13 | **Deployment** | The Founder (or a CI/CD pipeline once one exists) deploys the pulled change to the target environment. | Founder | [Deployment Workflow](deployment-workflow.md); TRD20 §20.11–20.13 |
| 14 | **Preview Review** | The deployed change is checked in a preview/staging context before being treated as final. | Founder | [Deployment Workflow](deployment-workflow.md) |
| 15 | **Manual QA** | The reusable manual test checklist is run against the deployed change. | Founder / future Manual QA role | [Manual Testing Standard](manual-testing-standard.md) |
| 16 | **Phase Complete** | The work package is marked done only once the [Definition of Done](definition-of-done.md) is met — not merely because code exists (TRD22 §22.41). | Founder / ChatGPT Technical Lead | [Definition of Done](definition-of-done.md) |

## 4. Non-Negotiable Rules

1. **No stage may be skipped.** A change that has not passed Technical Review is not pushed; a change that has not been pulled and deployed is not manually QA'd; a phase is not "complete" because the code compiles.
2. **The Coding Agent never deploys to production and never merges its own work package without review** (§9). This mirrors TRD20's deployment-permissions model applied to a solo-Founder context.
3. **A stop condition (TRD22 §22.40) may interrupt this workflow at any stage.** When it does, the agent stops at whatever stage it is in, reports the blocking issue, and the workflow does not resume at that stage until the Founder or ChatGPT Technical Lead resolves the blocker.
4. **This workflow governs process, not product.** It never authorizes a change to product requirements, requirement IDs, or the Decision Register — those follow their own governance (Decision Governance Workflow, Decision Update Procedure).

## 5. Relationship to Existing Governance

This is the process-level counterpart to TRD22's technical delivery sequencing (§22.1 Delivery Objective and Journey, the 17 implementation phases, the dependency map and critical path). TRD22 defines *what gets built in what order*; this document defines *how each individual unit of that work moves from intent to verified, deployed completion*. Where TRD22 already specifies a required artifact (the work package, the change-tracking file, the stop conditions, the phase review), this workflow points to the exact TRD22 section rather than restating it.

## 6. Future Extension

When engineering moves from solo-Founder + coding agents to a broader team, this workflow extends without structural change: "Founder" and "ChatGPT Technical Lead" stages may be performed by different named individuals, "Technical Review" may involve more than one reviewer, and CI/CD may automate stages 10–14. The stage sequence and its non-negotiable rules (§4) do not change.
