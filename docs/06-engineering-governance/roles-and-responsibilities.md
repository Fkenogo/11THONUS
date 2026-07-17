# Roles & Responsibilities

> **Title:** Roles & Responsibilities
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/roles-and-responsibilities.md`
> **Last controlled update:** 2026-07-16 (Phase 6 — created)

## 1. Purpose

This document names who (or what) is accountable for each part of the [AI Collaboration Workflow](ai-collaboration-workflow.md), consolidating the role references scattered across the other Engineering Governance documents into one place. It extends, without contradicting, the roles already defined for documentation governance in the [Decision Governance Workflow](../00-governance/decision-governance-workflow.md) §2.

## 2. Roles

### Founder

- states engineering intent and priorities (workflow stage 1);
- is the sole approver of Founder-level decisions in the Decision Register (unchanged from the Decision Governance Workflow);
- performs final verification before deploy (Git Workflow §3, §5);
- executes or authorizes deployment ([Deployment Workflow](deployment-workflow.md));
- performs Manual QA in the current solo-Founder model ([Manual Testing Standard](manual-testing-standard.md));
- decides when a phase is genuinely complete ([Definition of Done](definition-of-done.md)).

### ChatGPT Technical Lead

- translates Founder intent into a scoped, technically grounded plan (workflow stage 2);
- writes implementation prompts to the [Implementation Prompt Standard](implementation-prompt-standard.md) (workflow stage 3);
- performs first-pass Technical Review against the [Technical Review Standard](technical-review-standard.md) (workflow stage 8–9);
- cites requirement IDs, decision IDs, and TRD sections accurately when scoping work, drawing on the [Requirements Traceability & Implementation Matrix](../00-governance/requirements-traceability-matrix.md);
- never approves a Founder-level decision, and never authors a prompt that asks a coding agent to do so.

### Coding Agent

- implements strictly within an approved work package's scope ([Coding Agent Standard](coding-agent-standard.md));
- runs Local Implementation and Local Validation (workflow stages 5–6);
- produces the Implementation Report and updates the change-tracking file (workflow stage 7);
- commits and pushes only after Technical Review approval ([Git Workflow](git-workflow.md));
- stops and reports rather than guesses, per TRD22 §22.40, whenever a stop condition is met;
- never deploys to production, never approves its own work, never edits the Decision Register except when explicitly executing the Decision Governance Workflow under a named founder instruction.

### GitHub (or equivalent Git host)

- holds the shared remote and commit history (workflow stages 10–12);
- enforces branch protection and CI status checks per TRD20 §20.10–20.13, once configured;
- is a system of record, not a decision-maker — it never substitutes for Technical Review.

### Firebase (or equivalent hosting/backend platform)

- hosts the deployed environments (preview/staging and production);
- provides the CI/CD, Security Rules, Functions, Firestore, and monitoring infrastructure referenced throughout TRD20;
- is the execution target of [Deployment Workflow](deployment-workflow.md), not a reviewing party.

### Manual QA (Founder today; a dedicated role in future)

- runs the [Manual Testing Standard](manual-testing-standard.md) checklist against every deployed, Preview-Reviewed change;
- reports failures back through the Technical Review Standard's Corrections Required path, not directly to deployment.

### Future Engineering Team

- as the team grows beyond a solo Founder and coding agents, additional named individuals may take on the ChatGPT Technical Lead, Technical Review, or Manual QA roles above without any change to this document's structure — only to who is named against each role;
- any new role introduced (e.g. a dedicated Security Reviewer) is added to this table via the same governance process used for every other Engineering Governance change (logged in the Documentation Changes Log, classified per the standard taxonomy).

## 3. Responsibility Matrix (by Workflow Stage)

| Workflow stage | Primary responsibility |
|---|---|
| Founder | Founder |
| ChatGPT Technical Lead | ChatGPT Technical Lead |
| Implementation Prompt | ChatGPT Technical Lead |
| Coding Agent | Coding Agent |
| Local Implementation | Coding Agent |
| Local Validation | Coding Agent |
| Implementation Report | Coding Agent |
| Technical Review | ChatGPT Technical Lead |
| Approval / Corrections | ChatGPT Technical Lead |
| Git Commit | Coding Agent |
| Git Push | Coding Agent |
| Founder Pull | Founder |
| Deployment | Founder (Firebase as execution target) |
| Preview Review | Founder |
| Manual QA | Founder (future: Manual QA role) |
| Phase Complete | Founder / ChatGPT Technical Lead jointly, against [Definition of Done](definition-of-done.md) |

## 4. Relationship to Existing Governance

This table extends the Decision Governance Workflow's role table (Founder, Engineering Lead, Legal adviser(s), Providers, Documentation maintainer/AI agent) into the engineering-execution context. It does not change who approves Decision Register entries — that remains governed exclusively by the [Decision Governance Workflow](../00-governance/decision-governance-workflow.md).

## 5. Relationship to Other Engineering Governance Documents

Every role above is exercised through the specific standard governing its stage: [Coding Agent Standard](coding-agent-standard.md), [Implementation Prompt Standard](implementation-prompt-standard.md), [Technical Review Standard](technical-review-standard.md), [Git Workflow](git-workflow.md), [Deployment Workflow](deployment-workflow.md), [Manual Testing Standard](manual-testing-standard.md).
