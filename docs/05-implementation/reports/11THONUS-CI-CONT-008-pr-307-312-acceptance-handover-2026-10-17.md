# PR #307 / PR #312 — engineering acceptance handover (CI-CONT-008)

**Purpose:** give reviewers one place for the stacked-PR relationship, the accepted temporary CircleCI evidence, what is *not* established, and the merge-authority boundary. **This document changes neither PR.** Facts below were read from GitHub and CircleCI on 2026-10-17.

## 1. Stacked relationship
| | PR #307 | PR #312 |
|---|---|---|
| Title | feat(ea-bl-001-corr-002-b): Staff Counter (implementation — Founder Preview pending) | feat(loyalty): item-specific circle additive schema foundation (Package B) |
| Head | `feat/ea-bl-001-corr-002-b-staff-counter` @ `023bf3ef599d27fcd998043c0bca6926aa82356e` | `feat/loy-item-circle-pkg-b-schema` @ `73575800df6dfada8980fef5d9c83b43d2af7464` |
| Base | `main` | `feat/ea-bl-001-corr-002-b-staff-counter` (i.e. **#307's head branch**) |
| State | OPEN, not draft, MERGEABLE/CLEAN | OPEN, not draft, MERGEABLE/CLEAN |
| Size | +13,819 / −346, 107 files | +729 / −45, 17 files |
Consequence: #312 contains #307's work; #312 can only be reviewed and merged meaningfully after (or together with a re-target following) #307. Re-targeting or rebasing either PR is a separate decision and was not done.

## 2. Evidence
**PR #307:** the GitHub Actions check "Build, Lint, Test, Emulator Validation" has a recorded **success** on head `023bf3e…` (completed 2026-10-13T16:56:41Z, run `38432391357`). That predates the billing interruption and is a real GitHub Actions result for #307 only.
**PR #312:** **no GitHub Actions run exists for head `73575800…`** ("no checks reported"). The only automated evidence for #312 is the temporary, independent CircleCI verification below. It is **not** a GitHub Actions pass and must not be recorded as one.

Accepted CircleCI evidence for #312 (CI-CONT-007L): pipeline #8 `a4bc1c42-74d0-4cb6-9845-7ef0f732e037` (https://app.circleci.com/pipelines/github/Fkenogo/11THONUS/8), workflow `a0e76b85-0457-4b71-b41e-ad9d43705604`, job `1f27a693-adad-439c-bc88-c3f69c0159c7`, config `49c08c28092c404f70b565948c53c0335c0762f6`, tested application `73575800df6dfada8980fef5d9c83b43d2af7464` (expected = live PR head = fetched = checked out; the stacked #307 content is included in the tested tree). Results: build/lint/format/typecheck pass; unit Functions 2034 and web 1155 pass; PostgreSQL integration 813 pass; Playwright e2e 149 pass; preview tooling 43 pass + 1 skip; **preview acceptance 56 passed, 0 flaky, 0 retries, 0 not run, on 2 workers**; `pnpm emulators:validate` 877 passed + 3 skipped; 13/13 isolation gates; shims absent before emulator validation.

## 3. Open review items and acceptance conditions
- **#307:** four automated inline review comments (Codex) on `BusinessDashboardBoundaryPage.tsx:45`, `queryKeys.ts:74`, `purchaseRecordRepository.ts:534`, `CounterPage.tsx:348`. The author's replies record fixes (`f1d013d`, `529fc88`, including migration `0029` for the recorder-scoped index) — *GitHub thread "resolved" flags and the final code were not independently re-verified by CI-CONT.* No human approving review is recorded (`reviewDecision` empty).
- **#312:** no review; the only comment is a Codex notice that its usage limit was reached (no automated code review has run).
- **Founder Preview:** #307's title states "Founder Preview pending"; that acceptance is outside CI-CONT.
- **Conditions for engineering acceptance (proposed, for Founder decision):** (a) #307 reviewed and accepted first; (b) a GitHub Actions run on #312's head once billing allows, or an explicit Founder decision to accept the CircleCI evidence in its place; (c) conscious acceptance or scheduling of the three disclosed skips; (d) triage of follow-up issues A and B (they concern the preview harness, not #312's functionality, but they affect how much weight green/red preview results carry).

## 4. Disclosed skipped tests
Emulator validation: 3 pre-existing `it.skip("DISCLOSED FINDING (not proven here) …")` Firestore-transaction-retry tests (`acceptBusinessTermsCommand`, `businessActivationCommand`, `businessTermsConfigRepository` emulator tests). Preview tooling: 1 IPv6 skip (executor limitation). Details in [follow-up B](11THONUS-CI-CONT-008-followup-B-preview-e2e-robustness-2026-10-17.md).

## 5. Pilot completion versus merge authority
The CircleCI pilot is **technically complete and accepted by the Founder as temporary independent verification**. That acceptance does **not** merge, approve, re-target or clear either PR, does not restore GitHub Actions as the authority, and does not adjudicate merge readiness. Merge of #307 and #312 remains a separate Founder/engineering decision. The CircleCI configuration (`.circleci/config.yml`) exists only on branch `docs/ci-cont-001-circleci-assessment` and is not on `main`; whether it is retained, merged or removed is also a separate decision.
