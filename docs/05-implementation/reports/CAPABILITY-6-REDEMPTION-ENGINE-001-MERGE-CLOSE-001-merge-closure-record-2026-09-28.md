# CAPABILITY-6-REDEMPTION-ENGINE-001-MERGE-CLOSE-001 — Merge & Closure Record

**Date:** 2026-09-28

**Status:** **CAPABILITY-6-REDEMPTION-ENGINE-001 — APPROVED / MERGED / CLOSED**

**Capability boundary:** **CAPABILITY 6 REDEMPTION ENGINE — ACCEPTED. CAPABILITY 6 — NOT YET COMPLETE.**

This record closes the accepted Redemption Engine implementation package only. It does not close Capability 6, authorize Experience Reference or Experience Assembly implementation, or authorize deployment.

## 1. Entry and hygiene gates

- Repository: `Fkenogo/11THONUS`; PR #281.
- Entry `origin/main`: `87c679c63dc79afe9b29cff793b93cee562904fb`.
- Entry PR head: `d26587faa30c6becdc0006e88826a9e562be8cb4`; expected base: `87c679c63dc79afe9b29cff793b93cee562904fb`.
- Entry CI and review state were checked before hygiene. The accepted implementation's base had not advanced.
- Bounded hygiene only: corrected PR #281's body to identify the CORR-003 accepted head and record F-1/N1/N2 resolution, independent disposition, engine acceptance, and Capability 6 boundary; annotated the report's historical 36-test statement with the final 44 redemption + 4 lock-order = 48 focused-test count while retaining history; corrected the misleading “same commercial instant” test comment. No test behavior or production logic changed.
- Hygiene commit: `1c047f12c5aadf74c79885e5896a135341bf9481`. Files changed by hygiene: `functions/src/domains/purchase/services/confirmRedemptionCommand.postgres.test.ts` and `docs/05-implementation/reports/capability-6-redemption-engine-001-implementation-report-2026-09-27.md` (16 insertions, 2 deletions). Exact-head CI run `36446612646`: **SUCCESS**.
- Final PR head: `1c047f12c5aadf74c79885e5896a135341bf9481`; final base: `87c679c63dc79afe9b29cff793b93cee562904fb`. Before merge, PR #281 was OPEN, mergeable, and `CLEAN`; exact-head CI was successful and `origin/main` remained at the expected base.

## 2. Independent review and findings

The independent disposition was **APPROVE — READY FOR FOUNDER MERGE REVIEW**. F-1 deterministic first-allocation order, N1 lock-order/deadlock, and N2 governing version are resolved; no P0/P1/P2 finding remained as an unresolved implementation blocker at the accepted head.

GitHub still reports four historical review threads as technically unresolved: the audit-decision P1 and malformed-UUID P2 threads are non-outdated; the mutation-boundary authorization P1 and tenant-indistinguishability P2 threads are outdated. These threads' metadata remains unresolved; this closure does not dismiss or mark the threads resolved. Separately, the accepted correction sequence was independently reviewed, and the final disposition found no remaining P0/P1/P2 implementation blocker. Thread metadata and substantive finding disposition are distinct; the final PR body records the review disposition and CORR-003 accepted head.

## 3. Merge evidence

- Pre-merge `origin/main`: `87c679c63dc79afe9b29cff793b93cee562904fb`.
- Exact PR head: `1c047f12c5aadf74c79885e5896a135341bf9481`.
- Merge method: repository-standard regular merge commit (not squash or rebase).
- Merge commit: `ea1e00508dc0ef5597efb44015921e081270911d` (parents: pre-merge main and exact PR head).
- Post-merge `origin/main`: `ea1e00508dc0ef5597efb44015921e081270911d`.
- PR #281 lifecycle: **MERGED**, 2026-09-28.
- Exact merged-main CI run `36447960092` on `ea1e00508dc0ef5597efb44015921e081270911d`: **SUCCESS**, including formatting, typecheck, unit/component tests, PostgreSQL integration tests, Playwright E2E and Firebase Emulator validation.
- PR #281 merged 42 files: six documentation/tracking files and 36 application/test/migration files. The exact inventory is available from the PR merge diff; hygiene itself touched only the two files listed in §1.

## 4. Post-merge behavior and safety evidence

Verification was performed against a detached worktree at the exact merged main `ea1e00508dc0ef5597efb44015921e081270911d`, before this documentation-only closure PR.

- **Reward lifecycle:** PostgreSQL integration coverage verifies conditional `available → redeemed`, rejects repeat/non-redeemable transitions, and preserves failure atomicity.
- **Cycle lifecycle:** tests verify `reward_available → reward_redeemed`, creation of the next current Cycle, and forward allocation of pending Verified Units, including threshold-splitting and conservation.
- **Continued earning A → B → C:** the CORR-003 repeating-cycle regression exercises the real purchase/verification/redemption spine and verifies continued earning through Reward A, Reward B, and the following Cycle without deleting state.
- **Deterministic allocation and governing version:** regression tests establish `purchase_date → verified_unit_id → allocation_order`; opposite-scheduling cases distinguish commercial chronology from insertion time; the first allocated Verified Unit governs Cycle version/Reward terms. Database scheduling does not determine Reward terms. F-1 and N2 are resolved.
- **Locking/deadlock:** the dedicated lock-order PostgreSQL suite passed **4/4**, including canonical lock order and the controlled old-order `40P01` reproduction. N1 is resolved.
- **Authorization/security:** the 44-test redemption suite includes Owner floor, Manager default/revoke/re-grant, Staff explicit grant/revoke, Customer and Platform Administrator denial, suspension revalidation, individual confirmer attribution, no unrelated authority from Staff grant, tenant isolation/enumeration resistance, and shared-account prohibition.
- **Idempotency/concurrency:** tests cover repeat/replay, key conflict, simultaneous confirmations and single-effect behavior, with conditional state transition and uniqueness protections.
- **Trust Events and notification intents:** transaction tests verify the governed redemption/cycle Trust Event pair and Customer/Business notification intents; transaction failure coverage verifies they roll back atomically with the redemption.
- **Focused local PostgreSQL result:** `confirmRedemptionCommand.postgres.test.ts` **44/44** and `confirmRedemptionLockOrder.postgres.test.ts` **4/4** passed on merged main. A broader local PostgreSQL run was **307/308**: one unrelated `platformFoundationReadiness.postgres.test.ts` expectation failed because migration-identity validation returned a different specific error; no Capability 6 test failed. The authoritative merged-main CI PostgreSQL step passed.
- **Migration/schema:** no new migration/schema change in the bounded hygiene correction; PR #281 includes migration `0020_redemption_store.sql` and its down migration as part of the accepted implementation. Migrations were exercised only in local/CI test databases; migration `0019` was not executed against a deployed environment, nor was `0020` applied to a deployed database.
- **Scope:** no production redemption UI; prototype untouched; no deployment; no live database migration. PB-013B P3-3 remains **OPEN / UNRESOLVED**, separate and not crossed. Remaining P3 observations are non-blocking and were not expanded into correction work.

## 5. Capability and programme boundary

- **CAPABILITY-6-REDEMPTION-ENGINE-001 — APPROVED / MERGED / CLOSED.**
- **CAPABILITY 6 REDEMPTION ENGINE — ACCEPTED.**
- **CAPABILITY 6 — NOT YET COMPLETE.** Experience Reference refinement and production Experience Assembly remain outstanding. No production redemption UI or deployment is authorized by this closure.
- **PB-013B P3-3 — OPEN / UNRESOLVED.**
- The next programme step is a separate task: **11thONUS Experience Reference — Redemption Refinement**. No Experience Reference work was started here.
- Corrections retained in package history: CORR-001 resolved the redemption lifecycle defect; CORR-002 resolved canonical lock ordering and established first-allocation version authority; CORR-003 resolved deterministic commercial chronology. The final independent review found no P0/P1/P2 findings; remaining P3 observations are non-blocking.
- The Master Workflow receives a dated factual currency note, preserving its prior notes as history. No historical report was rewritten.

## 6. Change inventory, commands, and rollback

Closure PR changes only these documentation/governance records (the fourth file is required by `docs/README.md` §6 Rule 1):

1. This closure record.
2. `docs/05-implementation/11thonus-master-workflow.md` — dated currency note.
3. `docs/changes/IMPLEMENTATION_CHANGES.md` — append-only changes-tracking entry.
4. `docs/00-governance/documentation-changes-log.md` — required append-only documentation-change audit entry.

Commands/evidence used included: `git fetch origin --prune`; `git rev-parse`; `git status`; `git diff --check`; PR/run/API queries via `gh pr view`, `gh api`, and `gh run view`; merge ancestry/file inventory via `git rev-list` and `git diff-tree`; exact-merged-SHA detached worktree; Firebase Emulator + PostgreSQL test execution (`pnpm exec firebase emulators:exec --only firestore --project demo-11thonus ... pnpm --filter functions test:postgres`); focused log/result inspection. Hygiene validation ran formatting, typecheck, ESLint, focused redemption/lock-order tests, and exact-head CI, as recorded in the implementation report and CI run.

- Dependencies added: **none**.
- Configuration changes: **none**.
- Deployment/database actions: **none**; tests only, with no deployed migrations.
- Risks: the broader local PostgreSQL run had the unrelated single `platformFoundationReadiness` assertion failure noted in §4; merged-main CI passed. Historical GitHub review threads remain technically unresolved as described in §2; this record does not mutate their status.
- Rollback: revert the documentation-only closure PR/merge if required. Reverting this record, workflow note, and tracker entry does not revert or alter PR #281's separately merged implementation. Any rollback of the implementation must be a separately authorized code change.
- `.md` changes tracking: maintained by the append-only entry in `docs/changes/IMPLEMENTATION_CHANGES.md`.
- Closure PR: this is a separate documentation-only PR, intentionally **not self-merged**; Founder review/merge remains required.

---

`CAPABILITY-6-REDEMPTION-ENGINE-001 — APPROVED / MERGED / CLOSED`

`CAPABILITY 6 REDEMPTION ENGINE — ACCEPTED`

`F-1 DETERMINISTIC FIRST-ALLOCATION ORDER — RESOLVED`

`N1 LOCK-ORDER / DEADLOCK — RESOLVED`

`N2 GOVERNING VERSION — RESOLVED`

`PB-013B P3-3 — OPEN / UNRESOLVED`

`CAPABILITY 6 — NOT YET COMPLETE`

`NEXT — EXPERIENCE REFERENCE REDEMPTION REFINEMENT`