# Deployment Workflow

> **Title:** Deployment Workflow
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/deployment-workflow.md`
> **Last controlled update:** 2026-07-16 (Phase 6 — created)

## 1. Purpose

This document defines stages 13–14 of the [AI Collaboration Workflow](ai-collaboration-workflow.md) — Deployment and Preview Review — the sequence between a verified Git pull ([Git Workflow](git-workflow.md) §3) and Manual QA. It is the process wrapper around TRD20's deployment architecture (§20.11 Continuous Integration, §20.12 Continuous Delivery, §20.13 Deployment Permissions, §20.16 Deployment Artifacts, §20.21 Rollback Readiness).

## 2. Deployment Sequence

1. **Verified pull** — the Founder has completed [Git Workflow](git-workflow.md) §5 verification.
2. **Environment selection** — the Founder confirms the target environment (preview/staging first, always; production only after Preview Review and, where applicable, Manual QA pass).
3. **Deploy artifact assembly** — configuration, migrations, function versions, Security Rules, indexes, and translation bundle are assembled per TRD19 §19.51's release-candidate definition and TRD20 §20.16's deployment-artifact requirements.
4. **Deploy execution** — the Founder runs the deployment (manually today; via CI/CD pipeline once TRD20 §20.12's continuous-delivery infrastructure exists).
5. **Preview Review** — the Founder reviews the deployed change in the preview/staging environment against the Implementation Report's stated acceptance criteria, before it is treated as ready for Manual QA or production promotion.
6. **Promotion or rollback** — if Preview Review passes, the change is promoted (or, for a direct-to-target deploy, left in place) and moves to Manual QA. If it fails, the Founder invokes rollback per TRD20 §20.21 (Rollback Readiness) and the work package returns to Corrections Required per the [Technical Review Standard](technical-review-standard.md).

## 3. Preview Review Checklist

Preview Review confirms, at minimum:

- the deployed change matches what was approved in Technical Review (no drift between reviewed diff and deployed artifact);
- the environment configuration matches the release candidate's stated configuration (TRD19 §19.51);
- no unexpected errors appear in logs/monitoring immediately after deploy;
- the feature or fix is reachable and behaves as described in the acceptance criteria, at a smoke-test level (deeper checks belong to [Manual Testing Standard](manual-testing-standard.md)).

## 4. Rollback

Rollback follows TRD20 §20.21 (Rollback Readiness) and TRD19 §19.51/§19.55's rollback-criteria and rollback-strategy content. This document does not redefine rollback mechanics — it fixes the point in the sequence (§2.6) at which a Founder decides to invoke it, and requires that every deploy is only executed once a rollback plan already exists for it (carried from the Implementation Report's Reporting Requirements — see [Implementation Prompt Standard](implementation-prompt-standard.md) §3).

## 5. Production Deployment Gate

A change is only deployed to production once:

- Preview Review (§3) has passed;
- Manual QA ([Manual Testing Standard](manual-testing-standard.md)) has passed for anything touching a launch-critical flow;
- the applicable TRD19 §19.52 Release Gates (Code Quality, Architecture, Security, User Experience, Operations, and — where relevant — Business Validation) are satisfied.

This document does not restate the Release Gates' technical content; it fixes where in the deployment sequence they are checked.

## 6. Relationship to Existing Governance

TRD20 remains authoritative for the deployment *architecture* (CI, CD, permissions, artifacts, rollback). TRD19 §19.51–19.55 remain authoritative for release-candidate and rollback technical detail. This document is the day-to-day sequence a Founder actually runs between a Git pull and a change being handed to Manual QA.

## 7. Relationship to Other Engineering Governance Documents

- Precondition: [Git Workflow](git-workflow.md) verification is complete.
- Next stage: [Manual Testing Standard](manual-testing-standard.md).
- Completion gate: [Definition of Done](definition-of-done.md).
