# PLATFORM-BASELINE-003-CORR-001 — Atomic Activation Idempotency Completion — Correction Report

**Date:** 2026-09-12
**PR:** [#248](https://github.com/Fkenogo/11THONUS/pull/248) (`feat/platform-baseline-003-business-activation`)
**Status:** **IMPLEMENTED / AWAITING INDEPENDENT REVIEW** — no merge performed by this task.

## 1. Entry head

`c978d862e4146959af390fa7beab1f599ba4a7ec` (confirmed via `gh pr view 248 --json headRefOid` immediately before any change, matching the disposition's stated reviewed head).

## 2. Final head

`2475c8031c9198e35cd193aaeed060923221f510`, pushed to the existing PR #248 branch (`feat/platform-baseline-003-business-activation`) — no new branch, no force-push.

## 3. Files modified

- `functions/src/shared/idempotency/idempotencyService.ts`
- `functions/src/shared/idempotency/idempotencyService.emulator.test.ts`
- `functions/src/domains/business/services/businessActivationCommand.ts`
- `functions/src/domains/business/services/businessActivationCommand.emulator.test.ts`

No other file touched. Work was performed in a dedicated worktree at the exact reviewed head; the primary worktree (mid-flight on an unrelated legal-documentation branch) was never disturbed.

## 4. Pre-change analysis

Confirmed by direct inspection before writing any code:

- `businessActivationCommand.ts` reserved the idempotency key via `checkAndReserveIdempotencyKey` (its own transaction), then ran the activation transaction (admin gate → Business existence/status → Terms revalidation → `transitionBusinessStatus` write + lifecycle outbox write), then — **outside and after** that transaction — called `completeIdempotencyKey(db, params.idempotencyKey)` as an independent Firestore write. The `catch` around the whole sequence called `failIdempotencyKey` on any thrown error, with no way to distinguish "the activation transaction itself never committed" from "the activation transaction committed but the subsequent bookkeeping call failed."
- `idempotencyService.ts`'s `evaluateIdempotency` treats a `failed` record as `"new"` (deliberately retryable, per `ENG-P1-002-CR1`'s disclosed design choice for genuine non-commits) — so a same-key retry after a phantom "failed" record would reacquire the key, re-enter the activation transaction, find the Business already `trial`, and throw `INVALID_STATE_TRANSITION` (`businessErrors.ts` / `businessStatus.ts`'s structural transition table) — an ambiguous, incorrect outcome for a client that had, in fact, already succeeded.
- Sibling command patterns (`businessRepository.ts`, `acceptBusinessTermsCommand.ts`, `authorizeAndExecute.ts`, `qrIdentityRepository.ts`, `identityLifecycleRepository.ts`, `loyaltyNumberRepository.ts`, `authenticationReferenceRepository.ts`, `acceptStaffInvitationService.ts`, `commandDispatcher.ts`) all follow the same reserve → domain-transaction → complete-outside/fail-outside shape — none of them stage their own domain writes and idempotency completion inside one transaction today. This confirms the atomicity gap is not unique to this command's own logic, but no other caller needed correcting under this task's scope (`business.activateAfterVerification` is the one under review; broadening to every caller was out of scope and was not required — no shared-helper signature change forced it).
- Existing emulator tests (`businessActivationCommand.emulator.test.ts`) proved reservation, denial, lifecycle-matrix, Terms-precondition, and same-key-replay-after-success behavior, but never exercised a genuine mid-flight abort **after** all writes for a successful activation had been staged — so the atomicity gap itself was untested, not merely unfixed.

## 5. Atomicity correction strategy (stated before editing)

Add a narrowly-scoped, transaction-scoped sibling of `completeIdempotencyKey` to the shared idempotency service — `completeIdempotencyKeyInTransaction(transaction, db, idempotencyKey, resultReference?, responseSnapshot?)` — using `transaction.update` instead of a standalone `.update()` call. Stage it as the last write inside the activation command's own transaction, immediately after the Business-transition write and the lifecycle-outbox write, so a single Firestore transaction now commits (or aborts) all three writes together. The post-transaction code path then only calls the original, non-transactional `completeIdempotencyKey` for the `denied` outcome, which never mutates Business state and therefore carries none of the atomicity concern. This is the "reusable transaction-scoped helper" option the disposition suggested, adopted directly — no duplication of the idempotency collection contract inside the Business domain, no change to `checkAndReserveIdempotencyKey`'s or `failIdempotencyKey`'s signatures, and no migration of any other caller.

## 6. Shared idempotency change

`idempotencyService.ts` gains exactly one new exported function, `completeIdempotencyKeyInTransaction`, plus a `Transaction` type import. `checkAndReserveIdempotencyKey`, `completeIdempotencyKey`, `failIdempotencyKey`, and `evaluateIdempotency` are byte-for-byte unchanged — every other caller listed in §4 is untouched and needed no migration, satisfying the "STOP and report before broadening scope" condition by never triggering it.

## 7. Exact activation transaction after correction

Phase 4 of `activateBusinessAfterVerificationCommand`'s transaction now stages, in order: (1) `writeBusinessUpdate` (the `pending_verification → trial` transition), (2) `writeOutboxEntry` (the `business_lifecycle_changed` event), (3) `completeIdempotencyKeyInTransaction` (the idempotency record → `completed`). A test-only `testOnlyBeforeCommitHook` seam (mirroring the pre-existing `testOnlyAfterTermsVersionReadHook` pattern in the same file) fires immediately after all three are staged and before the transaction callback returns; the transport layer never supplies it. All three writes commit together on a normal return, or none of them commit if the transaction throws for any reason (including a thrown `testOnlyBeforeCommitHook`, or Firestore-level abort).

## 8. Genuine-failure retry behavior

Unchanged: if the activation transaction itself fails to commit (admin-gate short-circuit exceptions aside — see §9 — an actual thrown domain error such as `businessNotFoundError`, `invalidBusinessStatusTransitionError`, a Terms-precondition error, or — new — a forced `testOnlyBeforeCommitHook` abort), the outer `catch` calls `failIdempotencyKey`, leaving the key `failed`/retryable per the existing, unmodified `evaluateIdempotency` contract. Proven by the lifecycle-matrix tests (pre-existing, still passing) and by the new "genuine transaction failure ... leaves the key failed/retryable, and a corrected retry then succeeds" emulator test.

## 9. Committed-success retry behavior

Corrected: because the idempotency completion is now staged inside the same transaction as the Business transition, a committed activation can never again be observed as `failed`. A same-key, same-hash retry after a committed activation now deterministically finds the record `completed` and returns `{ outcome: "duplicate" }` — never `INVALID_STATE_TRANSITION`. Proven by the "same-key retry after a committed success returns duplicate" emulator test, in addition to the pre-existing "same-key replay after success returns duplicate" test (unchanged, still passing).

The `denied` outcome path is deliberately left calling `completeIdempotencyKey` (non-transactional) after the transaction, since denial performs no Business mutation — there is nothing for the idempotency completion to be atomic *with*. This preserves its pre-correction behavior exactly (a denied attempt's key is marked `completed`, matching the disposition's "do not redesign" instruction and avoiding any change to the authorization-matrix contract).

## 10. Tests added

- `functions/src/shared/idempotency/idempotencyService.emulator.test.ts` — new `describe("completeIdempotencyKeyInTransaction — atomic completion (PLATFORM-BASELINE-003-CORR-001)")`: (a) commits the completion when the enclosing transaction commits; (b) stages nothing durable (record stays `processing`, no `completedAt`) when the enclosing transaction aborts after staging the write.
- `functions/src/domains/business/services/businessActivationCommand.emulator.test.ts` — new `describe("activateBusinessAfterVerificationCommand — atomic idempotency completion")`, five tests matching the disposition's five required proofs exactly:
  1. Successful activation commits Business=`trial`, exactly one lifecycle event, and idempotency=`completed` together.
  2. Same-key retry after a committed success returns `duplicate`, never `INVALID_STATE_TRANSITION`, with no second transition or event.
  3. A genuine pre-commit denial leaves Business `pending_verification`, no lifecycle event, and the key `completed` (denial's own unchanged contract — see §9).
  4. A genuine transaction failure (thrown `INVALID_STATE_TRANSITION` before commit) leaves the key `failed`/retryable, and a corrected retry (against a fresh, eligible Business under the same key) then succeeds.
  5. Atomicity: a forced abort via `testOnlyBeforeCommitHook`, fired after all three writes are staged but before commit, leaves neither the Business transition, the lifecycle event, nor the idempotency completion durable — proven against real Firestore Emulator transaction semantics, not a mock of `completeIdempotencyKey`/`completeIdempotencyKeyInTransaction`. A subsequent retry with the hook removed then succeeds normally, confirming the key was genuinely retryable rather than stuck.

## 11. Emulator atomicity evidence

Test 5 above (`"atomicity: aborting the transaction after all writes are staged (before commit) leaves neither the Business transition nor the idempotency completion durable"`) is the material invariant proof: it throws from inside the real `db.runTransaction` callback after `writeBusinessUpdate`, `writeOutboxEntry`, and `completeIdempotencyKeyInTransaction` have all been called on the live `Transaction` object, against the Firebase Firestore Emulator (not a mock). The assertions confirm `businessStatus("biz-1")` is still `"pending_verification"`, `lifecycleChangedEvents()` is empty, and the idempotency record is `failed` — i.e. the emulator's real optimistic-transaction rollback discarded all three staged writes together. Passed in the full `emulators:validate` run (§13).

## 12. Full unit result

`pnpm --filter functions run test`: **158 test files / 1711 tests passed**, 0 failed.

## 13. Full emulator result

`pnpm run emulators:validate` (`firebase emulators:exec ... "pnpm --filter functions test:emulator"`): **64 test files / 830 tests passed, 3 skipped** (the 3 skips are the pre-existing, disclosed `it.skip` TOCTOU-determinism findings already documented in-file for Terms-version races and staff-invitation concurrency — unrelated to this correction, unchanged). 0 failed.

Note: the default emulator ports (8080/9099) were occupied by unrelated, pre-existing long-running processes for a different project on this machine (verified by PID/command inspection before touching anything). Ports were temporarily remapped in a local, uncommitted `firebase.json` edit for this run only and restored byte-for-byte immediately afterward (`git diff --stat firebase.json` confirmed clean before commit) — no port configuration change is part of this correction.

## 14. PostgreSQL regression

`PLATFORM_ENV=test pnpm --filter functions test:postgres` (against `docker compose -f docker-compose.postgres.yml`, started via `pnpm run postgres:up` and torn down via `pnpm run postgres:down` after): **3 test files / 23 tests passed**, 0 failed. This correction touches no PostgreSQL-backed code path; run for completeness per the validation checklist.

## 15. Playwright/build results

- `pnpm run build`: functions `tsc` and `apps/web` (`tsc -b && vite build`) both succeeded.
- `pnpm run test:e2e` (`playwright test --project=chromium --project=chromium-dashboard-harness`): **32 passed**, 0 failed.

## 16. Exact-head CI run/result

GitHub Actions "Build, Lint, Test, Emulator Validation" workflow on head `2475c8031c9198e35cd193aaeed060923221f510`: **SUCCESS** (`https://github.com/Fkenogo/11THONUS/actions/runs/34690253660/job/103544127555`, ~6m29s), confirmed via `gh pr checks 248` against the exact head returned by `gh pr view 248 --json headRefOid` at the time of the check.

## 17. P1 thread disposition

**RESOLVED, no code change.** Re-inspected `businessActivationEndpointService.ts:100` — `assertFreshAuthentication(credential, now(), DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS)` is called after actor resolution and before `activateBusinessAfterVerificationCommand` runs, failing closed with `AUTH_REQUIRED` for a stale `authenticatedAt`. Confirmed covered by `businessActivationEndpointService.test.ts`'s dedicated "rejects a stale authenticatedAt before the command runs (privileged freshness gate)" test (asserts `AUTH_REQUIRED` before the command's own logic runs). The finding pre-dates this fix already being present at the reviewed head; no code was changed for this item. Reply posted and thread formally resolved via the GitHub review-thread API (`PRRT_kwDOTaQe386hu66Z`).

## 18. P2 thread disposition

**RESOLVED, corrected in this task.** The atomicity fix in §5–§9 directly addresses the finding text (`"If the activation transaction commits but this separate completion update throws or times out, the catch path marks the key failed ... Retrying with the same key then reacquires it and fails with INVALID_STATE_TRANSITION"`). Verified via the emulator tests in §10–§11 that the described failure mode can no longer occur. Reply posted (citing the exact fix commit and the specific tests) and thread formally resolved via the GitHub review-thread API (`PRRT_kwDOTaQe386hu66c`).

## 19. Any new review findings

None as of this report. The automated review (`chatgpt-codex-connector[bot]`)'s only prior review run (`2026-09-12T09:27:42Z`) predates this correction's push (`2026-09-12T11:17Z` replies, CI success shortly after); no new automated review run had posted against `2475c8031c9198e35cd193aaeed060923221f510` at the time of this report. `gh api repos/Fkenogo/11THONUS/pulls/248/reviews` and the GraphQL review-threads query were both checked directly; only the two pre-existing threads (now resolved) exist.

## 20. Dependencies

None added, removed, or upgraded.

## 21. Config changes

None. (See §13 for the transient, reverted local `firebase.json` port remap used only to run the emulator suite around an unrelated port conflict on this machine — not part of the shipped diff.)

## 22. Schema/index changes

None. `idempotencyRecords` document shape is unchanged (`completeIdempotencyKeyInTransaction` writes the identical field set `completeIdempotencyKey` always wrote — `status`, `completedAt`, optional `resultReference`/`responseSnapshot` — via `transaction.update` instead of a standalone `.update()` call). No new collection, no new composite index, no `firestore.indexes.json` change.

## 23. Risks

Low. The change is additive at the shared-service level (one new exported function; no existing export's signature or behavior changed) and narrows, rather than widens, the set of states the activation command can leave the system in after a partial failure. The one behavioral difference from before this correction is the one required by the disposition: a same-key retry after a committed activation now returns `duplicate` instead of (nondeterministically, only under the specific bookkeeping-write-fails-after-commit race) throwing `INVALID_STATE_TRANSITION`. No other command's idempotency behavior changed.

## 24. Rollback instructions

Revert commit `2475c8031c9198e35cd193aaeed060923221f510` on `feat/platform-baseline-003-business-activation` (a clean single commit touching only the four files in §3) and push, or force-push the branch back to `c978d862e4146959af390fa7beab1f599ba4a7ec` if a revert commit is undesired. No data migration, no config, and no other branch/PR is affected by either path.

## 25. Markdown correction report/update

This document.

## 26. `.md` tracking record

This document serves as both the correction report and the required `.md` change-tracking record, following the `PLATFORM-BASELINE-001`/`002`/`003` precedent of not filing a numbered `ENG-Pn-nnn` EIR for non-programme-numbered task identifiers (`PLATFORM-BASELINE-003-CORR-001` is not an `ENG-Pn-nnn` work package). No `engineering-implementation-programme.md` or `coding-agent-prompt-register.md` row was added, consistent with that precedent.

---

## Final disposition

**PLATFORM-BASELINE-003-CORR-001 — IMPLEMENTED / AWAITING INDEPENDENT REVIEW.**

No merge was performed by this task.
