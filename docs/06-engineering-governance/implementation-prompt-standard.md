# Implementation Prompt Standard

> **Title:** Implementation Prompt Standard
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/implementation-prompt-standard.md`
> **Last controlled update:** 2026-07-22 (added mandatory Master Delivery Workflow fields to the Project Context requirement — see §2 row 1 and the [11thONUS Version 1.0 Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md); previously: 2026-07-16, Phase 6 — created)

## 1. Purpose

This document formalizes the required shape of an **Implementation Prompt** — the work package the ChatGPT Technical Lead hands to a coding agent (stage 3 of the [AI Collaboration Workflow](ai-collaboration-workflow.md)). It is built directly on TRD22 §22.38's Implementation Work-Package Standard, and formalizes the exact prompt pattern that has already been used, phase after phase, throughout this documentation governance programme itself — this standard is a description of a pattern already proven in practice, not a new invention.

## 2. Required Fields

Every implementation prompt shall contain the following sections, in this order. A prompt missing any field is incomplete; a coding agent receiving an incomplete prompt should request the missing field rather than infer it.

| # | Field | Purpose | Source |
|---|---|---|---|
| 1 | **Project Context** | What programme/phase this belongs to, and what has already been completed. *(Added 2026-07-22)* Must state: the [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) version and date consulted; the current authorized position it records; and explicit confirmation that this prompt is the next authorized task per that document's §8 | Established practice of this programme; [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §15 |
| 2 | **Context** | Relevant Constitution principles, PRD section(s), TRD chapter(s), affected domain(s), current implementation state | TRD22 §22.38 |
| 3 | **Objective** | The single-sentence goal of this work package | Established practice of this programme |
| 4 | **Before Making Changes** (where applicable) | Required upfront analysis the agent must complete and report *before* touching any file — e.g. current state, overlaps, namespace/collision analysis, proposed strategy | Established practice of this programme (Phases 4–6) |
| 5 | **Task** | A precise description of what must be implemented | TRD22 §22.38 |
| 6 | **In Scope** | Exact capabilities, files, or domains permitted | TRD22 §22.38 |
| 7 | **Out of Scope** | Explicitly deferred or unrelated work | TRD22 §22.38 |
| 8 | **Constraints** | Architecture preservation, no unrelated files, no bypassing domain services, no direct authoritative client writes, localization/security preservation, no speculative refactoring — plus any programme-specific constraints (e.g. never edit the Decision Register) | TRD22 §22.38 |
| 9 | **Acceptance Criteria** | Testable outcomes | TRD22 §22.38 |
| 10 | **Required Tests / Validation** | Unit, integration, emulator, security, end-to-end, or (for documentation work) link/consistency/duplication checks, as applicable | TRD22 §22.38 |
| 11 | **Verification Commands** | The exact commands or checks the agent must run | TRD22 §22.38 |
| 12 | **Reporting Requirements** | The exact structure the completion report must follow (see §3) | TRD22 §22.38 |

## 3. Reporting Requirements (what every prompt must ask for)

Every implementation prompt's Reporting Requirements field shall require the agent to report:

- files modified;
- change/diff summary;
- commands executed;
- tests and results;
- dependencies added;
- configuration changes;
- migrations;
- risks;
- rollback instructions;
- unresolved issues;
- a markdown implementation report;
- an update to the persistent changes-tracking file (TRD22 §22.39).

For documentation-only work packages (as used throughout Phases 1–6), the equivalent reporting set is: documents created/modified, sections changed, cross-references updated, validation performed, the Documentation Changes Log entry, and the phase-tracker update.

## 4. Prompt Discipline Rules

1. **A prompt is scoped before it is issued.** The ChatGPT Technical Lead completes the "Before Making Changes" analysis itself, or explicitly delegates that analysis as the agent's first deliverable, before any implementation begins.
2. **A prompt never asks an agent to resolve an open decision.** If a work package depends on an OPEN Decision Register item, the prompt cites the DEC ID and the agent stops per [Coding Agent Standard](coding-agent-standard.md) §5–6.
3. **A prompt never asks an agent to guess.** Ambiguity is resolved in the prompt itself, not left for the agent to interpret; where the Technical Lead cannot resolve it either, the prompt says so and asks the agent to stop and report per TRD22 §22.40.
4. **A prompt states its own boundaries explicitly.** "Do not begin Phase N+1 automatically," "do not modify unrelated files," and similar boundary statements are treated as first-class constraints, not incidental remarks.

## 5. Relationship to Existing Governance

This standard does not replace TRD22 §22.38 — it is the field-by-field expansion of it, annotated with the additional fields (Project Context, Objective, Before Making Changes) that this programme has found necessary in practice for documentation-and-governance-style work packages, alongside pure code work packages. Any future revision of TRD22 §22.38 takes precedence; this document is corrected to match.

## 6. Relationship to Other Engineering Governance Documents

- The agent receiving a prompt built to this standard operates under the [Coding Agent Standard](coding-agent-standard.md).
- The report produced against §3 is checked using the [Technical Review Standard](technical-review-standard.md).
- Work is not closed until the [Definition of Done](definition-of-done.md) is met.
