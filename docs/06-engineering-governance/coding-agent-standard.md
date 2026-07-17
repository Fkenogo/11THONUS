# Coding Agent Standard

> **Title:** Coding Agent Standard
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/coding-agent-standard.md`
> **Last controlled update:** 2026-07-16 (Phase 6 — created)

## 1. Purpose

This document defines what any coding agent — this documentation programme's own agent, a future implementation-phase agent, or any AI contributor working on the 11thONUS codebase — is, is permitted to do, and must never do. It is the day-to-day operating contract for stage 4–7 of the [AI Collaboration Workflow](ai-collaboration-workflow.md) (Coding Agent → Local Implementation → Local Validation → Implementation Report).

This document does not redefine TRD22's technical delivery rules. It operationalizes them (§4).

## 2. What a Coding Agent Is

A coding agent is any AI system given a scoped implementation prompt and permitted to read, write, or execute within the repository on the Founder's behalf. It always operates against a specific, written work package — never against open-ended verbal intent.

## 3. Operating Boundaries

A coding agent shall:

- work strictly within the **In Scope** section of its implementation prompt;
- never modify files outside its stated scope, including documentation, configuration, or unrelated code;
- never bypass domain service boundaries or write directly to authoritative data from a client context;
- preserve existing architecture, security boundaries, and localization (English/French) unless the prompt explicitly authorizes a change to them;
- run every required test and verification command from the prompt before reporting completion;
- produce the markdown implementation report and update the persistent changes-tracking file for every completed work package;
- never treat "the code compiles" as equivalent to "the work is done" (TRD22 §22.41).

## 4. Relationship to TRD22 §22.38–22.41

TRD Chapter 22 already defines the technical substance of the coding-agent contract. This standard does not restate it — it tells an agent (or a Founder briefing an agent) where to find each rule and how the rules connect:

| TRD22 section | What it defines | How this standard uses it |
|---|---|---|
| **§22.38 Implementation Work-Package Standard** | The required structure of a work package (Context, Task, In Scope, Out of Scope, Constraints, Acceptance Criteria, Required Tests, Verification Commands, Reporting Requirements) | This is the schema the [Implementation Prompt Standard](implementation-prompt-standard.md) is built on. An agent should never begin work against a prompt missing any of these fields — it should stop and request the missing field. |
| **§22.39 Coding-Agent Change Tracking** | The requirement for a persistent, append-only change log distinct from Git history | Every coding agent must append to this file on every completed work package, exactly as TRD22 §22.39 specifies. For the documentation programme, the equivalent role is played by the [Documentation Changes Log](../00-governance/documentation-changes-log.md); for application code, the change file's location and format follow TRD22 §22.39 directly. |
| **§22.40 Coding-Agent Stop Conditions** | The ten conditions under which an agent must stop and report rather than guess | This is **the** authoritative stop-and-report rule for every phase of this programme and will remain so for every future implementation phase. It is never redefined here — only cited. See §5 below. |
| **§22.41 Phase Review Standard** | What a post-implementation review must confirm | This is the technical substance behind the [Technical Review Standard](technical-review-standard.md)'s review checklist. |

## 5. Stop Conditions (cited from TRD22 §22.40)

A coding agent shall stop and report rather than guess when any of the following is true:

1. required business behaviour is ambiguous;
2. current code contradicts the approved architecture;
3. a requested change would affect unrelated domains;
4. security behaviour is unclear;
5. production data migration is required but unspecified;
6. a required provider contract is unavailable;
7. the repository is not in the expected state;
8. another agent or process is modifying the same codebase;
9. tests reveal a wider architectural defect;
10. implementation would require bypassing an approved rule.

When any condition is met, the agent explains the blocking issue and identifies the decision required — it does not proceed on an assumption, and it does not resolve the blocker itself if the blocker is a Founder or Decision Register matter.

## 6. Governance-Specific Constraints

In addition to the TRD22 stop conditions, any agent working on 11thONUS governance or product documentation shall never:

- create, edit, approve, or resolve a Decision Register entry, except when explicitly executing the Decision Governance Workflow under a named founder instruction;
- change a requirement ID outside a formally scoped ID-normalization phase with a published mapping;
- edit the historical body content of an archived (`99-archive/`) or audit-evidence (`90-audits/`) document;
- introduce a new document classification tier or reorder the governance hierarchy without a founder-approved decision.

## 7. Escalation Path

When an agent stops under §5 or §6, it reports to whichever role issued its work package (ChatGPT Technical Lead in the normal workflow, or directly to the Founder). The blocked work package is not marked complete, and the [AI Collaboration Workflow](ai-collaboration-workflow.md) does not advance past the stage where the stop occurred until the blocker is resolved through the appropriate governance channel (Decision Governance Workflow for decision matters; a corrected prompt for scope/ambiguity matters).

## 8. Relationship to Other Engineering Governance Documents

- The prompt an agent receives must conform to the [Implementation Prompt Standard](implementation-prompt-standard.md).
- The report an agent produces is checked against the [Technical Review Standard](technical-review-standard.md).
- A work package is only closed once the [Definition of Done](definition-of-done.md) is satisfied.
- Roles referenced throughout are defined in [Roles & Responsibilities](roles-and-responsibilities.md).
