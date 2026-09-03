> **Title:** Core Business Terms Part VIII (§§26–27) — Merge and Founder-Approval Closure Report
> **Version:** 1.0 (2026-09-03) · **Status:** Working (governance record — controlled drafting closure report) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged)
> **Task:** `DEC-LEGAL-002-BT-DRAFT-008-CLOSE-001`
> **Governs:** [Core Business Terms — Draft](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md) Part VIII status labels

# Closure strategy (stated before editing)

Merge PR #217 with a regular merge commit, head-pinned to the exact reviewed and CI-verified head, then record the Founder's approval of Part VIII as a controlled drafting baseline using this repository's established convention — a bounded documentation-only follow-up (matching the `DEC-LEGAL-002-BT-PART-VIII-READINESS-001-CLOSE-001` precedent, PR #214), not a direct push to `main`. The Decision Register's `DEC-LEGAL-002` narrative paragraph was inspected and found to have stopped being updated per-task after Part IV (`DEC-LEGAL-002-BT-DRAFT-004`) — Parts V, VI, VII, and VIII's own drafting/correction tasks never touched it, and neither did the READINESS-001-CLOSE-001 precedent. Editing it now would be inconsistent with actual repository practice, so it was left untouched; the authoritative closure record is `documentation-changes-log.md` plus this report, exactly as precedent establishes.

# 1. Entry repository/PR state

- Primary worktree: on branch `docs/dec-legal-002-bt-draft-007`, still holding unrelated uncommitted `FD-COM-001` work — read only via `git status --short` (no destructive command run against it), never touched.
- PR #217: `state: OPEN`, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN` (verified before merge).

# 2. Approved head verified

`headRefOid: 2de734b879b098acd2c83f93ebb28b65f70b9124` — matches the task's stated approved head exactly.

# 3. Review-thread state

Both Codex threads confirmed `isResolved: true` via GraphQL (`PRRT_kwDOTaQe386e2995`, `PRRT_kwDOTaQe386e29-A`). Only four PR review comments exist in total (the two original findings plus the two reply-confirmations already posted during CORR-001) — no new finding since the last verification.

# 4. Pre-merge CI evidence

`gh pr checks 217` → `Build, Lint, Test, Emulator Validation` **pass**, 6m45s, at head `2de734b`.

# 5. Merge method

Regular merge commit via `gh pr merge 217 --merge --match-head-commit 2de734b879b098acd2c83f93ebb28b65f70b9124`. No squash, rebase, force-push, or history rewrite. `--match-head-commit` would have aborted the merge had the head moved since verification; it did not.

# 6. Merge commit SHA

`9a8df6fafa341e665bd867b39ebf5cd68a1330d9`

# 7. Files modified (including post-merge governance recording)

Post-merge, in a second fresh isolated worktree (`docs/dec-legal-002-bt-draft-008-close-001`, based on `origin/main` at the merge commit):

- `docs/00-governance/documentation-changes-log.md` — Entry 151 added.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` — two precise status-label edits (Instrument Map §0.0 row A; Part I heading note), header version 8.1 → 8.2. No clause text changed.
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-008-CLOSE-001-closure-report-2026-09-03.md` — this file, created.

No Drafting Traceability Matrix or Controlled Inputs Register change (neither's content is affected by a Founder-approval status label). No Decision Register change (established convention, see closure strategy above). No application, Firebase, test, or dependency file touched.

# 8. Code/document diff summary

Docs-only. The PR #217 merge itself: 4 files changed across the DRAFT-008/CORR-001 commits (Core Business Terms draft, Drafting Traceability Matrix, documentation-changes-log, plus two new reports), as already detailed in the DRAFT-008 and CORR-001 reports. This closure task's own diff: 2 files changed (Core Business Terms draft status labels; documentation-changes-log), 1 file created (this report).

# 9. Commands executed

`gh pr view 217 --json state,mergeable,headRefOid,baseRefName,mergeStateStatus`; `gh pr checks 217`; `gh api graphql` (review-thread state); `git fetch origin`; `git log origin/main`; `git status --short` (primary worktree, read-only); `gh pr merge 217 --merge --match-head-commit ...`; `gh pr view 217 --json state,mergeCommit,mergedAt`; `git worktree add ... origin/main`; `gh run list --branch main`; file edits via the editing toolchain; `git add`/`git commit`/`git push`; `gh pr create`.

# 10. Dependencies added

None.

# 11. Configuration changes

None. No Terms configuration, no Firebase configuration, no application configuration.

# 12. Post-merge CI result

Green at merge commit `9a8df6fafa341e665bd867b39ebf5cd68a1330d9` (workflow run `33745394674`, `Build, Lint, Test, Emulator Validation`).

# 13. Final `origin/main` state

`git log origin/main --oneline -1` → `9a8df6f docs(DEC-LEGAL-002-BT-DRAFT-008): merge Core Business Terms Part VIII (§§26-27), Founder-approved controlled drafting baseline` — confirmed present on `origin/main`.

# 14. Status of Parts I–VIII

Parts I–VI and Part VIII = Founder-approved controlled drafting baselines. Part VII = draft, pending separate Founder review — **unchanged by this task**; this task's Founder authorization covers Part VIII only. Part VII was never closed by its own dedicated Founder-approval task; this is a pre-existing state, not something this task was authorized to resolve. Flagged here for the Founder's awareness.

# 15. Status of DEC-LEGAL-002, CI-01, CI-05, Terms configuration and Capability 3

All unchanged: `DEC-LEGAL-002 = OPEN_LEGAL`; `CI-01 = OPEN`; `CI-05 = OPEN`; Terms configuration = `NOT CONFIGURED`; Capability 3 = Open, blocked on governed Terms-content configuration.

# 16. Risks

Low. A governance-status recording task with no clause-text or application change. The one open item is the Part VII/Part VIII approval-status asymmetry (§14 above) — not a risk this task creates, but worth the Founder's attention before any future whole-instrument reconciliation.

# 17. Rollback instructions

To revert the PR #217 merge on `main`: revert merge commit `9a8df6fafa341e665bd867b39ebf5cd68a1330d9` (a normal `git revert -m 1`). To revert this closure task's status-label/log changes alone: revert its own commit on `main` once merged, or edit the two status-label sentences back to their prior wording. No application state, database, or configuration was touched by either.

# 18. Markdown implementation/closure report

This file: `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-008-CLOSE-001-closure-report-2026-09-03.md`.

# 19. Persistent `.md` changes-log entry

`docs/00-governance/documentation-changes-log.md`, Entry 151.

# 20. Confirmation — FD-COM-001 primary worktree untouched

Confirmed. The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`) was only read via `git status --short` at the start of this task to confirm its unrelated uncommitted state — never stashed, reset, cleaned, checked out over, amended, committed, or moved. All edits in this task were made in a second, fresh isolated worktree (`docs/dec-legal-002-bt-draft-008-close-001`), separate from both the primary worktree and the (now-merged, still-present) `docs/dec-legal-002-bt-draft-008` worktree.

---

**Gate:** `PR #217 MERGED — CORE BUSINESS TERMS PART VIII §§26–27 APPROVED AS CONTROLLED DRAFTING BASELINE — PARTS I–VIII SECTIONAL DRAFTING COMPLETE — NOT FINAL / NOT EFFECTIVE / NOT CONFIGURED`
