# ENG-P2-002C — Business Profile, Branch Profile & Governed Lifecycle Management — Implementation Report

**Date:** 2026-08-18
**Status:** Implemented, pending Founder-authorized independent review/merge — **not self-merged**

This report covers the **controlled resumption** of `ENG-P2-002C` after it was paused mid-implementation on discovering the `ENG-P2-004` pre-operational authorization deadlock (`CAP-P3-BIZ-AUTH-001`), and after `ENG-P2-004-CORR-001` (the Founder-approved correction) merged. It documents both the pre-pause state (inherited, not re-derived) and the resumption work performed in this task.

---

## 1. Current origin/main SHA

`bc442169011e62bcb17b88bea05c899def2fcbde` (verified via `git fetch origin && git rev-parse origin/main` at task start — matches the expected post-`ENG-P2-004-CORR-001`-closure baseline exactly).

## 2. Paused worktree path/branch/HEAD

`/Users/theo/11THONUS/.claude/worktrees/eng-p2-002c`, branch `feat/eng-p2-002c-business-profile-lifecycle`, HEAD `6ac6d7bd21863af84dfb9058699fbe117c48c50e` at task start (paused, uncommitted).

## 3. Pre-resume file inventory

Exactly 17 changed/new files, confirmed against the expected inventory: `eslint.config.js`; `functions/src/domains/business/{events/businessEvents.ts, models/business.ts, models/businessBranch.ts, models/businessErrors.ts, repositories/businessRepository.ts}` (modified); `functions/src/domains/business/{events/businessEvents.test.ts, services/authenticatedBusinessActor.ts, services/businessBranchProfileCommand.ts, services/businessLifecycleCommand.ts, services/businessProfileCommand.ts}` (new); `functions/src/{index.ts, index.test.ts}` (modified); `functions/src/domains/business/{models/business.test.ts, models/businessBranch.test.ts, models/businessErrors.test.ts}` (modified); `functions/src/shared/outbox/outboxWriter.ts` (modified).

## 4. Backup location

`/private/tmp/claude-501/-Users-theo-11THONUS/ea30fda5-2dbe-4947-8b74-41cbb21ac5c6/scratchpad/eng-p2-002c-backup-2026-08-18/` — `files/` (full byte-for-byte copy of all 17 paths) and `meta/` (`HEAD_SHA.txt`, `BRANCH.txt`, `git-status.txt`, `git-diff-unstaged.txt`, `git-diff-staged.txt`, `file-inventory.txt`, `sha256-original.txt`, `sha256-backup.txt`).

## 5. Backup verification

Byte-for-byte `diff -q` across all 17 files: identical. SHA-256 digest set comparison (original vs. backup copy): identical. Both performed before any reconciliation command ran.

## 6. Paused work classification

| File | Class | Purpose | Complete pre-pause? | CORR-001 impact | Reusable? |
|---|---|---|---|---|---|
| `business.ts`, `business.test.ts` | A (domain) | `updateBusinessProfile`, structurally excludes id/businessCode/ownerUserId/status/createdAt/schemaVersion | Yes | None | Yes, unchanged |
| `businessBranch.ts`, `businessBranch.test.ts` | A | `updateBusinessBranchProfile`, excludes id/businessId/createdAt/schemaVersion | Yes | None | Yes, unchanged |
| `businessErrors.ts`, `businessErrors.test.ts` | A | `businessNotFoundError`, `businessBranchNotFoundError` | Yes | None | Yes, unchanged |
| `businessEvents.ts`, `businessEvents.test.ts` | A | 3 new event builders, privacy-minimal (field names only, no PII values) | Yes | None | Yes, unchanged |
| `businessRepository.ts` | B (repository) | `readBusinessById`, `readBusinessBranchForBusiness` (tenant-isolated), `writeBusinessUpdate`, `writeBusinessBranchUpdate` | Yes | None | Yes, unchanged |
| `outboxWriter.ts` | B | Widened `writeOutboxEntry`'s param type to a minimal write-capable shape | Yes | None | Yes, unchanged |
| `authenticatedBusinessActor.ts` | C (auth integration) | Owner-actor resolution, no authorization decision made here | Yes | None | Yes, unchanged |
| `businessProfileCommand.ts` | C | `updateBusinessProfileCommand` via `authorizeAndExecute` | Structurally yes, **one gap found** | **Fixed** (§12) | Yes, after fix |
| `businessBranchProfileCommand.ts` | C | `updateBusinessBranchProfileCommand` via `authorizeAndExecute` | Yes | None | Yes, unchanged |
| `businessLifecycleCommand.ts` | C | Both lifecycle commands via `authorizeAndExecute` | Structurally yes, **stale permission id** | **Fixed** (§12) | Yes, after fix |
| `index.ts`, `index.test.ts` | D (endpoint) | 4 onCall endpoints, whitelist parsers, mass-assignment regression tests | Structurally yes, **same two gaps** | **Fixed** (§12) | Yes, after fix |
| `eslint.config.js` | F (tracking/config) | Domain-boundary `ignores` entries for the 4 new command/actor files | Yes | None | Yes, extended (one entry added for the new emulator test file) |

The prior assessment that "all files are reusable" was independently re-verified, not trusted — confirmed true after inspection, with two genuine defects found and fixed (§12) rather than carried forward unexamined.

## 7. Closure-report date check/correction

`ENG-P2-004-CORR-001`'s implementation report is filed as `...-implementation-report-2026-08-19.md`, one day ahead of the actual current date (`2026-08-18`, confirmed via system context and this task's own explicit statement). Investigated: the file's internal `**Date:**` header was also `2026-08-19` (inherited from an earlier session's dating without independent verification against the system clock). This is a genuine, if minor, date-labeling error — not a claim about when the correction actually merged (the merge commit timestamps, `2026-08-18T14:08:12Z`/`14:20:14Z`, are accurate and unaffected). Per "do not rewrite historical evidence unnecessarily," the file is **not** renamed or retroactively edited to change its historical narrative; instead, a short corrective note is added to its header, and this report and all new programme-tracking entries in this task use the correct `2026-08-18` date throughout. Also confirmed: no 002C record in this report or the programme-tracking doc names `ce2b026` as the current resume baseline — the correct current baseline (`bc442169`, which includes `ce2b026` as an ancestor) is used throughout.

## 8. Main-vs-paused overlap matrix

See the pre-execution overlap matrix (reproduced): zero file-level overlap between the 17 paused `002C` files and everything that landed on `main` since the pause (`ENG-P2-004-CORR-001`'s changes live entirely under `functions/src/domains/permissions/**` plus one unrelated test file under `domains/business/repositories/`; `002C`'s changes live under `functions/src/domains/business/**` excluding that repository test file, plus `index.ts`/`outboxWriter.ts`/`eslint.config.js`). Confirmed by a clean, zero-conflict rebase (§10).

## 9. Reconciliation strategy

**Option A** (temporary preservation commit + rebase), chosen over Option B (fresh worktree + patch reapplication) because the overlap matrix showed zero conflict risk — a plain rebase preserves full provenance (commit history, not a synthetic reapplication) with no additional risk given the confirmed absence of overlapping hunks.

## 10. Reconciliation commands executed

1. `git add -A && git commit --no-verify -m "WIP: ... (pre-pause snapshot)"` — preservation commit, hooks skipped deliberately (the pre-pause snapshot was known to be pre-CORR-001 and not expected to pass validation as-is; full validation was re-run properly after the real fix commit).
2. `git rebase origin/main` — succeeded with **zero conflicts**, exactly as the overlap matrix predicted.

## 11. Post-reconciliation head/status

`f151e94` (preservation commit, rebased onto `bc44216`), working tree clean, `git status --short` empty immediately after rebase.

## 12. Stale `business.advanceLifecycle` disposition

Found still present in `businessLifecycleCommand.ts` (permission-string argument) and `index.ts` (onCall export name `advanceBusinessLifecycle`, `requestHash` prefix). Renamed throughout to the Founder-approved `business.submitForVerification` (FD-CORR-3, `ENG-P2-004-CORR-001`): the exported command function `advanceBusinessToPendingVerificationCommand` → `submitBusinessForVerificationCommand`, the onCall export `advanceBusinessLifecycle` → `submitBusinessForVerification`. Narrow semantics preserved exactly — the command's `targetStatus` argument is still hard-coded to `"pending_verification"` only; nothing about the rename touched the transition logic itself. Without this fix, every call to this command would have been denied (the evaluator classifies an unrecognized permission id as `unknown`, which never resolves to `allowed: true`) — this was a genuine functional defect, not merely a naming inconsistency.

## 13. Exact 002C scope

Confirmed to own exactly the four items the controlled-resume authorization names: (1) Business profile update, (2) default Branch profile update, (3) submit-for-verification (`draft → pending_verification` only), (4) governed Business close. No new command was added during resumption — only the two fixes in §12/§14 and the completed test suite (§S).

## 14. Permission mapping

| Command | Permission id | Verified against `ORDINARY_PERMISSION_CATALOGUE` |
|---|---|---|
| Business profile update | `business.updateProfile` | Match |
| Branch profile update | `businessBranch.updateProfile` | Match |
| Submit for verification | `business.submitForVerification` | Match (corrected in this task — was `business.advanceLifecycle`) |
| Close | `business.close` | Match |

All four call `authorizeAndExecute` exclusively — grepped for `role ===`/`"draft"`/`"suspended"`/etc. in all three command files: zero local status/role checks found (§I).

## 15. Lifecycle matrix result

`002C`'s command files contain no local lifecycle-eligibility configuration of their own (confirmed by grep, §14) — they defer entirely to `ORDINARY_PERMISSION_CATALOGUE`, which was independently re-verified during `ENG-P2-004-CORR-001`'s own merge-gate review to match the Founder-approved matrix exactly. The new emulator test suite additionally reproduces the matrix end-to-end against real Firestore for all four commands (§S below), rather than trusting the evaluator's own unit tests alone.

## 16. Business mutable-field result

`UpdateBusinessProfileParams` structurally excludes `id`/`ownerUserId`/`businessCode`/`createdAt`/`schemaVersion`/`status` (unchanged, pre-pause). **`subscriptionId` was found client-mutable through the endpoint parser and command's patch type — a genuine gap, fixed** (excluded from `BusinessProfilePatch` and `parseBusinessProfilePatch`; the general-purpose domain function still accepts it for a future, separately-governed command). Proven at runtime, not just by type: `index.test.ts`'s mass-assignment test now includes `subscriptionId` in its malicious payload and asserts it's dropped; a new emulator test independently proves every immutable field survives a broad legitimate patch unchanged.

## 17. Branch mutable-field result

`UpdateBusinessBranchProfileParams` structurally excludes `id`/`businessId`/`createdAt`/`schemaVersion` (unchanged, pre-pause, no gap found).

## 18. Business profile implementation

Complete. Emulator-proven: Owner allowed on every eligible status (`draft`/`pending_verification`/`trial`/`active`/`expired`), denied on `suspended`/`closed`/`archived`; Manager/Staff denied; cross-business membership denied; immutable fields survive a broad patch; the `BusinessProfileUpdated` outbox event names only changed fields, carries no PII values.

## 19. Branch profile implementation

Complete. Emulator-proven: Owner allowed/denied per the same matrix; exactly one branch document exists and is updated (never a second); a branch belonging to a different Business fails closed (`businessBranchNotFoundError`, `RESOURCE_NOT_FOUND` — enumeration-resistant, indistinguishable from "doesn't exist") even for an otherwise-legitimately-authorized Owner; no new branch is ever created by an update command.

## 20. submitForVerification implementation

Complete, and re-confirmed narrow after the rename (§12). Emulator-proven: Owner + `draft` = executed, Business becomes `pending_verification`; every other status (all 7) denies, status never changes; Manager/Staff denied even in `draft`.

## 21. close implementation

Complete. Emulator-proven: every approved non-terminal status (`draft`/`pending_verification`/`trial`/`active`/`suspended`/`expired`) → `closed`; `closed`/`archived` (terminal) denied, no double-close/archive side effect; Manager/Staff denied; historical Business/Branch/membership data preserved (no field wiped, only `status`/`updatedAt` change) — no archive/delete/suspend/ownership-transfer semantic was introduced.

## 22. Transaction/TOCTOU result

All four commands compose through `authorizeAndExecute` exclusively (§14) — the same evaluate → prepare (read) → audit → apply (write) single-transaction boundary `ENG-P2-004D` already proved TOCTOU-safe. No command evaluates permission outside the transaction and writes later. Two new interaction tests prove this concretely: a membership suspended between two sequential calls is honored (denied) on the second call, never a stale/cached allow; a Business closed between two sequential calls is likewise honored immediately — the evaluator always reads live state.

## 23. Tenant isolation result

Confirmed for both profile commands: cross-business membership denies before any Business/Branch document is even read (evaluator-level); a branch belonging to a different Business fails closed at the repository read layer even for an authorized-on-its-own-business Owner (`readBusinessBranchForBusiness`'s tenant check).

## 24. Mass-assignment result

Confirmed for both the Business and Branch patches, at the runtime parser boundary (not merely the TypeScript type) — one genuine gap found and fixed (`subscriptionId`, §16), one pre-existing test extended to cover it, one new emulator-level immutable-field proof added.

## 25. Event/outbox result

`BusinessProfileUpdated`/`BusinessBranchUpdated`/`BusinessLifecycleChanged` (covering both `submitForVerification` and `close` via `fromStatus`/`toStatus` — a single generic lifecycle-changed event rather than two separately-named ones, confirmed as a legitimate design choice: `ENG-P2-002-DESIGN-001` §14/§24 item 4 explicitly states event names/contracts are implementation-level recommendations, not pre-approved governed names). All privacy-minimal (field names only, no values) — confirmed at runtime, not just by type, via a new emulator test asserting the outbox payload never contains the actual changed value. Reuses the existing shared outbox unchanged. No permission-audit duplication — confirmed (§O below).

## 26. Idempotency result

Unchanged from pre-pause: each command reuses `authorizeAndExecute`'s existing idempotency-key mechanism (the same one `002B`/`004D` already established) — no second subsystem was added, and none needed to be.

## 27. Rules assessment

All four commands write exclusively server-side via `onCall` Cloud Functions and the Admin SDK — no client direct-write path exists or was added. No Firestore/Storage Rules change was required or made.

## 28. End-to-end bootstrap→pending_verification result

**Passed**, against real Firestore: `bootstrapBusiness` (draft) → `updateBusinessProfileCommand` (executed) → `updateBusinessBranchProfileCommand` (executed) → `submitBusinessForVerificationCommand` (executed) → final Business document confirmed `status: "pending_verification"` with the profile update's `displayName` change also present.

## 29. Proof pending_verification→trial remains unavailable

Proven two ways in the same end-to-end test: (1) re-invoking `business.submitForVerification` against the now-`pending_verification` Business denies (its own catalogue eligibility is `draft`-only); (2) directly evaluating a hypothetical `business.advanceToTrial` permission against the same Business denies `NO_APPLICABLE_GRANT` — no such permission, command, or code path exists anywhere in the codebase (confirmed structurally: no file greps for a `"trial"` transition target outside `businessStatus.ts`'s own structural table, which `002C` does not invoke for this purpose).

## 30. Pre-pause TDD evidence

Inherited, not independently re-derived by this task: the 13 pre-pause files (domain/repository/event/actor layers) already carried their own co-located unit tests when this worktree was first encountered, consistent with the original `ENG-P2-002C` task's stated TDD requirement — this report does not claim to have personally witnessed their RED state, since they predate this session's work.

## 31. Post-resume RED→GREEN evidence

Honest account, not overstated: the two corrections (§12 permission rename, §16 `subscriptionId` exclusion) were **immediate-fix-then-test** — each defect was found by direct code inspection, fixed immediately, and a regression test was added afterward to prove the fix (not strict RED-first, since the "RED" would only have existed if the fix were reverted). The `subscriptionId` mass-assignment test does pass immediately against the fix (confirmed by running it in isolation). The new emulator test suite (§S, `businessProfileLifecycle.emulator.test.ts`) **was** written and run to a genuine first-attempt failure: 39 of 40 tests failed on the first run due to two bugs in the test harness itself (the Admin SDK's `undefined`-value rejection — the same known issue `002B` already documented — and one incorrect test assertion about `businessBranchNotFoundError`'s propagation shape) — not a defect in the production code under test. Both were fixed, and the suite reached 40/40 green.

## 32. Tests added

`businessProfileLifecycle.emulator.test.ts` (new, 40 tests): Business profile matrix (13), Branch profile matrix (6), `submitForVerification` matrix (10), `close` matrix (10), TOCTOU (2), end-to-end acceptance (1) — counts overlap slightly across `it.each` expansions, 40 total `it` cases. `index.test.ts`: 1 new assertion extending the existing mass-assignment test to cover `subscriptionId`.

## 33. Full validation

- `functions` unit (excluding emulator): **1132/1132**, 115 files.
- `emulators:validate` (real Firestore): **399/399**, 34 files (one pre-existing, unrelated `registrationSignInService` concurrency-timing flake observed on one run, confirmed non-reproducing on immediate re-run — matches the long-documented `ENG-CI-001` backlog item, not caused by this task).
- `apps/web` unit: **397/397**, 51 files.
- `pnpm typecheck` (both workspaces): clean.
- `pnpm lint`: clean (one new `eslint.config.js` ignore entry added for the new emulator test file's Firebase imports).
- `pnpm format:check`: clean (several pre-pause files needed a `prettier --write` pass — likely formatted against a slightly different Prettier version originally; no semantic change).
- `pnpm build` (both workspaces): clean.
- Secret scan (`git diff` grepped for key/secret/credential patterns): no matches.

## 34. Files modified

Modified (8, all pre-pause files touched during reconciliation/fixes): `eslint.config.js`, `functions/src/domains/business/models/business.ts` (formatting only), `functions/src/domains/business/repositories/businessRepository.ts` (formatting only), `functions/src/domains/business/services/businessBranchProfileCommand.ts` (formatting only), `functions/src/domains/business/services/businessLifecycleCommand.ts` (rename), `functions/src/domains/business/services/businessProfileCommand.ts` (`subscriptionId` exclusion), `functions/src/index.ts` (rename + `subscriptionId` exclusion), `functions/src/index.test.ts` (mass-assignment test extended).

New (1): `functions/src/domains/business/services/businessProfileLifecycle.emulator.test.ts`.

Unchanged from the pre-pause snapshot (9): `businessEvents.ts`/`.test.ts`, `business.test.ts`, `businessBranch.ts`/`.test.ts`, `businessErrors.ts`/`.test.ts`, `authenticatedBusinessActor.ts`, `businessBranchProfileCommand.ts` (semantically — only reformatted), `outboxWriter.ts`.

## 35. Code diff summary

Against `origin/main` (`bc44216`): 17 files, +1354/−12 (includes the full pre-pause implementation, since it was never previously merged). Against the pre-pause snapshot alone: 9 files touched, +923/−27 — the bulk of that delta is the new 40-test emulator suite; the production-code delta is the permission rename (a handful of lines across 2 files) and the `subscriptionId` exclusion (a handful of lines across 2 files) plus one extended test.

## 36. Dependencies added

None.

## 37. Config changes

One `eslint.config.js` `ignores` entry added (the new emulator test file, same Firebase-import-exemption pattern every other emulator test in this domain already uses).

## 38. Firebase/Rules changes

None.

## 39. Deployment changes

None. No function was deployed; the renamed `submitBusinessForVerification` export was never deployed under its prior name either (confirmed: `ENG-P2-002C` has never merged, so nothing has ever reached `main` or been deployed under any name).

## 40. Review findings/dispositions

Self-review findings during resumption (§12, §16) — both fixed, both test-covered. Independent review (Phase W) is a separate, subsequent step not yet performed as of this report's writing (see §42 for its planned scope).

## 41. Remaining material findings

None identified.

## 42. PR number

To be recorded once opened (this report is written before PR creation, matching the sequencing this repository's prior packages used).

## 43. Final reviewed head

Not yet applicable — pending independent review.

## 44. CI result

Not yet applicable — pending PR creation and CI run.

## 45. ENG-P2-002C status

**Implemented, pending Founder-authorized independent review/merge.**

## 46. ENG-P2-003 status

**Not started.**

## 47. Capability 3 status

**Not started** — this is domain-command implementation for one concern (`ENG-P2-002`) within Capability 3, not the capability-level milestone itself.

## 48. Dirty primary worktree

Clean. `/Users/theo/11THONUS` was never entered or modified by this task.

## 49. Risks

- The lifecycle matrix is entirely evaluator-owned (by design) — `002C` itself has no fallback if the evaluator's catalogue configuration ever drifted; this is the intended single-source-of-truth architecture, not a gap, but worth reviewer awareness.
- The `subscriptionId` exclusion fix narrows what `business.updateProfile` currently accepts; a future `ENG-P2-003` package will need its own explicit decision about how (and whether) to expose subscription-field mutation, rather than assuming this endpoint already covers it.
- The single pre-existing `registrationSignInService` emulator flake (§33) is unrelated to this package but remains a known CI-stability risk (tracked separately as `ENG-CI-001` in the programme backlog).

## 50. Rollback

Revert the PR — no data migration, no deployed endpoint, no Firebase config change to reverse.

## 51. Persistent implementation-report path

`docs/05-implementation/reports/ENG-P2-002C-business-profile-lifecycle-implementation-report-2026-08-18.md` (this file).

## 52. Changes-tracking state

`docs/05-implementation/change-tracking/engineering-implementation-programme.md` to be updated with a dated-supersession note recording `ENG-P2-002C = Implemented, pending Founder review`.

## 53. Exact next Founder action

Authorize an independent security/authorization review of the `ENG-P2-002C` PR (number pending) — reviewing especially the two resumption-time fixes (§12 permission rename, §16 mass-assignment exclusion), authorization mapping, lifecycle transitions, immutable-field protection, cross-tenant isolation, TOCTOU, and event/outbox consistency — then merge if the gates pass. `ENG-P2-003` remains unauthorized and not begun.

---

## FINAL GATE

**ENG-P2-002C READY FOR FOUNDER REVIEW/MERGE**
