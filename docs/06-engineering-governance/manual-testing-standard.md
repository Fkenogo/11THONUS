# Manual Testing Standard

> **Title:** Manual Testing Standard
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/manual-testing-standard.md`
> **Last controlled update:** 2026-07-16 (Phase 6 — created)

## 1. Purpose

This document defines the **reusable, feature-agnostic** manual QA checklist run at stage 15 of the [AI Collaboration Workflow](ai-collaboration-workflow.md), after a change has passed Preview Review. It is not a substitute for TRD19's exhaustive technical test architecture (19 testing categories spanning unit, domain, component, integration, emulator, security-rule, contract, event, idempotency, concurrency, state-transition, offline, PWA, QR, auth, localization, accessibility, performance, payment, subscription, notification, search, migration and backup testing) — that remains the authoritative technical testing standard. This document is the smaller, human-executable checklist a Founder (or future Manual QA role) runs against *any* deployed change, regardless of which feature it touches.

## 2. When This Applies

Every change that reaches Preview Review is manually checked using §3's general checklist. Changes touching a launch-critical flow (per TRD22's MVP scope) additionally require the relevant TRD19 technical test categories to have passed *before* reaching this stage — manual testing is the last human check, not the only check.

## 3. General Checklist (every change)

1. **Functional** — does the change do what the Implementation Report's acceptance criteria describe, using the actual UI/flow rather than only the underlying data?
2. **Error states** — does an invalid or failing action show a clear, correct error rather than a silent failure or a raw technical message?
3. **Loading and empty states** — does the screen behave sensibly while data is loading, and when there is no data yet?
4. **Permissions** — can a user only do what their role permits (TRD1 accounts/roles model), and is an unauthorized action correctly blocked?
5. **Localization** — is English/French copy present, correct, and free of placeholder text where required?
6. **Accessibility** — is the change usable with basic accessibility checks (contrast, focus order, screen-reader labels) at a spot-check level?
7. **Regression spot-check** — do the two or three most closely related existing flows still work as before?
8. **Data integrity** — does the change leave Firestore records in the expected shape (spot-checked in the console or emulator UI), with no unexpected fields, missing fields, or duplicate documents?
9. **Notifications** (where applicable) — are triggered notifications useful, correctly timed, and not duplicated (Constitution CP-014, Respect Customer Attention)?
10. **Rollback sanity** — if this change had to be rolled back right now, is that plan (from the Implementation Report) still accurate?

## 4. Feature-Specific Checklists

Feature-specific manual test detail (e.g. the exact steps to verify a Verified Unit increments correctly, or a specific Reward Program's redemption flow) is **not** duplicated here. It is derived, per feature, from that feature's row(s) in the [Requirements Traceability & Implementation Matrix](../00-governance/requirements-traceability-matrix.md) (Acceptance Criteria and Future Test Reference columns) and from TRD19's relevant technical test category. This standard only fixes the general checklist that applies regardless of feature.

## 5. Recording Results

Manual QA results are recorded in the Implementation Report's validation section (or, once a dedicated QA log exists, in that log) and referenced by requirement/decision ID, consistent with the [Git Workflow](git-workflow.md) commit-message convention. A failed manual QA check returns the change to Corrections Required per the [Technical Review Standard](technical-review-standard.md); it does not silently proceed to Phase Complete.

## 6. Relationship to Existing Governance

TRD19 remains authoritative for the full technical test architecture, the Pull Request Quality Gate (§19.48), defect severity (§19.50), and release gates (§19.52). This document is the narrower, repeatable, human-executed layer that runs after those technical gates and before a change is declared done.

## 7. Relationship to Other Engineering Governance Documents

- Precondition: [Deployment Workflow](deployment-workflow.md) Preview Review has passed.
- Outcome feeds: [Definition of Done](definition-of-done.md).
- Future owner: the Manual QA role in [Roles & Responsibilities](roles-and-responsibilities.md).
