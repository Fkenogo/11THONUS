# Git Workflow

> **Title:** Git Workflow
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/git-workflow.md`
> **Last controlled update:** 2026-07-16 (Phase 6 — created)

## 1. Purpose

This document defines the human/agent Git sequence between an approved implementation report (stage 9 of the [AI Collaboration Workflow](ai-collaboration-workflow.md)) and deployment (stage 13). TRD20 §20.10 (Branching and Change Control) defines the underlying branch and change-control *architecture*; this document defines the concrete, repeatable *sequence of Git actions* a coding agent and the Founder follow within that architecture.

## 2. The Flow

```
Coding Agent
      ↓
   Commit
      ↓
   Push
      ↓
Founder — git pull origin main
      ↓
   Verify
      ↓
   Deploy
```

## 3. Stage-by-Stage Definition

| Stage | Action | Who | Notes |
|---|---|---|---|
| **Commit** | The coding agent commits only the files within its approved work package's In Scope, using the commit message convention (§4). | Coding Agent | Never commits before Technical Review approval (stage 9 of the workflow). |
| **Push** | The agent pushes the commit(s) to the shared remote, to the branch specified in the work package (main, or a feature branch per TRD20 §20.10). | Coding Agent | Never force-pushes; never rewrites shared history. |
| **Founder — `git pull origin main`** | The Founder pulls the pushed change into their own local/deployment environment. | Founder | This is the single point at which the Founder takes possession of the change — deployment never happens directly from the agent's environment. |
| **Verify** | The Founder confirms the pulled change matches the approved Implementation Report (right files, right commit, no surprises) before deploying. | Founder | A quick diff/log check against the report, not a full re-review — full review already happened at stage 8–9 of the workflow. |
| **Deploy** | The Founder (or, later, an automated pipeline) deploys the verified change. | Founder | See [Deployment Workflow](deployment-workflow.md) for what happens next. |

## 4. Commit Message Convention

Every commit references the work package it implements:

```
<type>(<domain>): <short description> [<requirement/decision IDs>]
```

- `<type>` — one of `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, matching conventional-commit practice;
- `<domain>` — the affected 11thONUS domain (e.g. `loyalty`, `purchase`, `identity`) or `governance` for documentation-programme work;
- `<short description>` — imperative, present tense;
- `[<requirement/decision IDs>]` — the requirement ID(s) from the [Traceability Matrix](../00-governance/requirements-traceability-matrix.md) and/or Decision ID(s) the commit implements, where applicable.

Example: `feat(loyalty): implement individual purchase rejection [FR-CVLE-008, DEC-LOY-010]`

## 5. Verification Before Deploy

Before running Deploy, the Founder confirms:

- the pulled commit hash matches the hash cited in the approved Implementation Report;
- the branch is the expected branch (per TRD20 §20.10's change-control model);
- no local uncommitted changes are about to be mixed into the deploy;
- CI (TRD20 §20.11), where configured, is green on the pulled commit.

## 6. Release Tagging

Once a deploy corresponds to a completed phase or a release candidate (TRD19 §19.51), the Founder tags the commit (e.g. `v0.<phase>.0`) so the release candidate's artifacts (TRD19 §19.51: version identifier, commit reference, environment configuration, migration set, function versions, Security Rules, indexes, translation bundle, feature flags, test report, known issues, rollback plan) are traceable to an exact commit.

## 7. Branch Strategy

The default branch strategy is a single `main` branch for the current solo-Founder, low-concurrency phase, protected per TRD20 §20.13 (Deployment Permissions) so that only the Founder deploys from it. Feature branches are used when a work package is large, long-running, or explicitly flagged as higher-risk in its implementation prompt. This document does not introduce a new branching model beyond what TRD20 §20.10 already specifies — it only fixes the day-to-day sequence of commands used within it.

## 8. Relationship to Existing Governance

TRD20 §20.10–20.13 remain authoritative for branch protection, CI, CD, and deployment-permission architecture. This document is the operational script a coding agent and Founder actually run, stage by stage, inside that architecture.

## 9. Relationship to Other Engineering Governance Documents

- Commits only happen after [Technical Review Standard](technical-review-standard.md) approval.
- What happens after Deploy is defined in [Deployment Workflow](deployment-workflow.md).
- Roles are defined in [Roles & Responsibilities](roles-and-responsibilities.md).
