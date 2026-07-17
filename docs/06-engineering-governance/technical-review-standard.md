# Technical Review Standard

> **Title:** Technical Review Standard
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/technical-review-standard.md`
> **Last controlled update:** 2026-07-16 (Phase 6 — created)

## 1. Purpose

This document defines what happens at stage 8–9 of the [AI Collaboration Workflow](ai-collaboration-workflow.md) — Technical Review and Approval/Corrections — between a coding agent's Implementation Report and a Git commit. It answers: who reviews, against what checklist, and what "approved" versus "needs correction" means in practice.

## 2. Who Reviews

In the current solo-Founder operating model, the **ChatGPT Technical Lead** performs the first-pass technical review of every implementation report. The **Founder** performs the final review before a change is pulled and deployed (this is also where Manual QA, §15 of the workflow, applies). As the engineering team grows, additional named reviewers may be added without changing this standard's checklist.

## 3. Review Checklist

Grounded directly in TRD22 §22.41 (Phase Review Standard), every technical review shall confirm:

1. scope completed — the work matches the prompt's Task and In Scope fields, nothing more and nothing less;
2. acceptance criteria met;
3. required tests passed (per TRD19's applicable test categories, or the documentation-equivalent validation for governance work);
4. no unrelated changes — files outside the prompt's In Scope were not touched (TRD22 §22.38 Constraints; TRD19 §19.48 Pull Request Quality Gate);
5. architecture preserved;
6. security preserved;
7. localization preserved (English/French, where applicable);
8. documentation updated — including the persistent changes-tracking file (TRD22 §22.39) and, for documentation-programme work, the Documentation Changes Log;
9. risks understood — the report's risk and rollback sections are complete and plausible, not boilerplate;
10. next-phase dependencies are actually ready — a phase is not started merely because a prior phase's code exists (TRD22 §22.41).

## 4. Outcome of a Review

A review produces exactly one of two outcomes:

- **Approved** — the work package proceeds to Git Commit (stage 10). The reviewer records what was approved and against which prompt/report.
- **Corrections Required** — the work package returns to the agent with an itemized list of what specifically must change, mapped to which checklist item failed. A correction is never a vague "this doesn't look right"; it names the file, the expectation, and the gap.

There is no third outcome. A review does not partially approve a work package — if any checklist item fails materially, the whole work package returns for correction.

## 5. Escalation During Review

If review reveals that the implementation report itself surfaced (or should have surfaced) a TRD22 §22.40 stop condition that the agent did not report, the reviewer treats this as a **coding-agent standard violation**, not merely a defect — the work package is corrected and the agent's next work package is scoped more precisely to prevent recurrence.

If review reveals a defect, it is classified using TRD19 §19.50's severity scale (Severity 0–4) so that release-blocking issues are distinguished from cosmetic ones.

## 6. Relationship to Existing Governance

TRD22 §22.41 already defines *what* a phase review confirms; this document defines *who* performs it, in what sequence relative to Git and deployment, and what the two possible outcomes are. TRD19 §19.48 (Pull Request Quality Gate) and §19.52 (Release Gates) remain the authoritative technical detail for what a full code-quality and release review inspects at the product-engineering level once implementation begins in earnest; this standard is the process wrapper around that technical detail for the specific Founder/ChatGPT Technical Lead/coding-agent loop.

## 7. Relationship to Other Engineering Governance Documents

- Review inputs are produced by a coding agent operating under the [Coding Agent Standard](coding-agent-standard.md), against a prompt built to the [Implementation Prompt Standard](implementation-prompt-standard.md).
- An approved review is a precondition of the [Definition of Done](definition-of-done.md).
- Once approved, work proceeds per [Git Workflow](git-workflow.md) and [Deployment Workflow](deployment-workflow.md).
