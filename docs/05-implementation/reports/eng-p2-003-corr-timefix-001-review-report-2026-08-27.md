# `ENG-P2-003-CORR-TIMEFIX-001-REVIEW` — Independent Review, Merge & Closure (2026-08-27)

**Independent review of draft PR #184, performed in a fresh isolated worktree checked out at the
PR's exact head — the implementation report was not trusted as proof; every claim below was
independently re-derived from source, and the fix was mutation-tested.** Clean. No findings.

## 1. Entry PR/head/CI

- `gh pr view 184`: `baseRefName main`, `headRefOid 01debf1277cb18641c5b31487136b335e1c4abf9`,
  `isDraft true`, `state OPEN`, `mergeable MERGEABLE`, `mergeStateStatus CLEAN`. Last commit in
  `gh pr view --json commits` matches the head exactly — no later unreviewed commit.
- `gh pr checks 184`: **pass** (6m31s, run `33050084119`).
- Fresh isolated worktree created at the exact PR head (`git worktree add
  .../eng-p2-003-corr-timefix-001-review 01debf1...`), detached HEAD.
- Ancestry independently verified: `git rev-list --left-right --count HEAD...origin/main` → `2 0`;
  `git merge-base HEAD origin/main` → `3b02974` (exactly `origin/main`'s tip at review start).
- `git diff --stat origin/main..HEAD`: 3 files (the test file, the implementation report, the
  changes log) — confirmed via `git diff --name-only -- 'functions/src/**'` that exactly one
  `functions/` file changed, and it is a `.emulator.test.ts` file, not production code.

## 2. Final reviewed head

`01debf1277cb18641c5b31487136b335e1c4abf9` — unchanged by this review (no correction was needed).

## 3. Root-cause verification

Independently re-derived from source, not trusted from the report:
- `inviteParams` (line 193): hardcoded `now: new Date("2026-08-20T01:00:00.000Z")`.
- `createStaffInvitationService.ts:126,134`: `const invitedAt = params.now;` ... `expiresAt:
  computeInvitationExpiresAt(invitedAt)` — confirms the invitation's `invitedAt` is literally
  `params.now`, not independently derived.
- `invitationPolicy.ts`: `computeInvitationExpiresAt = invitedAt + INVITATION_EXPIRY_DURATION_MS`
  (`7 * 24 * 60 * 60 * 1000`). **Derived `expiresAt` = `2026-08-27T01:00:00.000Z`** — confirmed
  exactly.
- `revokeStaffInvitationService.ts:112-121`: a `pending` invitation with `isInvitationPastExpiry(
  expiresAt, params.now)` true is reclassified to `expired`, never `revoked` — read in full,
  confirmed correct, intentional, pre-existing (documented as an independent-review correction,
  unrelated to this task).
- The pre-fix Scenario 12 revoke call used live `now: new Date()`. **Confirmed exactly**: this is
  a test-fixture clock inconsistency, not a production defect.

## 4. Fixed-time correctness

The corrected value, `new Date("2026-08-20T02:00:00.000Z")`, is exactly one hour after the
invitation's `2026-08-20T01:00:00.000Z` creation — comfortably inside the 7-day (`604,800,000`ms)
validity window, nowhere near the `2026-08-27T01:00:00.000Z` boundary. It is also identical to
`acceptParams`'s own pre-existing default `now` — the fix adopts an already-established,
already-safe convention rather than inventing a new one. The actual concurrency scenario (two
commands racing via `Promise.allSettled` against the same Firestore document, with Firestore's own
transaction-isolation guaranteeing exactly one commit) is unaffected by which safe, fixed `now`
value is chosen — verified by mutation (§7).

## 5. Production-code diff result

**Zero.** `git diff --name-only origin/main..HEAD -- 'functions/src/**'` returns exactly one file:
`staffMembershipIntegration.emulator.test.ts`. No production Staff Membership code — or any other
domain — was touched.

## 6. Similar-clock-pattern audit

Independently re-found and re-classified all remaining `new Date()` occurrences in the file (grep,
not trusted from the report):

| Line | Call | Independent classification |
|---|---|---|
| 1154 | `revokeStaffInvitation` (SCENARIO 6, first revoke) | **Safe, confirmed.** Re-read `revokeStaffInvitationService.ts:153-154`: `if (result.outcome === "executed") { return { outcome: "revoked", ... } }` — unconditional regardless of the persisted invitation's internal `status` (`"expired"` or `"revoked"`). The test only asserts `revoked.outcome === "revoked"`, never inspects `invitation.status` — genuinely unaffected by the clock. |
| 1182 | `revokeStaffInvitation` (SCENARIO 6, re-revoke of an already-terminal invitation) | **Safe, confirmed.** Re-read `transitionInvitationStatus`: throws `invalidInvitationStatusTransitionError` for any transition from a non-`"pending"` status, uniformly — whether the prior terminal state is `"expired"` or `"revoked"` makes no difference to the thrown `INVALID_STATE_TRANSITION` category. |
| 1469 | `createdAt: new Date()` (linked auth-reference audit field) | **Safe, confirmed.** An audit-trail timestamp on test-only Firestore setup, never read back or compared against any expiry/deadline logic. |

The report's classification is accurate on all three. No additional hazard found; no broader
time-fixture debt found elsewhere in this file.

## 7. Test-quality result

Mutation-tested per this review's own instructions, each fully reverted (`git diff` confirmed
clean afterward):

1. **Restored live `new Date()`** in the fixed line → reproduced the exact original failure under
   today's real calendar time: `AssertionError: expected 'expired' to be 'revoked'`. Confirms the
   fix genuinely addresses a real, currently-live defect, not a hypothetical one.
2. **Restored the deterministic `2026-08-20T02:00:00.000Z` value** → passed cleanly again.
3. **Exactly-one-wins invariant:** verified structurally rather than via a production-code
   mutation — `acceptStaffInvitationService.ts` explicitly rejects on `invitation.status ===
  "revoked"`/`"accepted"`/`"expired"` before proceeding, and both accept and revoke run inside real
   Firestore transactions (`db.runTransaction`/`authorizeAndExecute`), whose serializable
   write-conflict detection on the same document is the actual mechanism guaranteeing exactly one
   commit succeeds. Deliberately did not attempt to bypass this shared, already-extensively-tested
   transaction/idempotency infrastructure to force a double-success — doing so would exceed this
   bounded correction's scope and risk destabilizing infrastructure unrelated to the fix. The
   existing `expect(fulfilled.length).toBe(1)` assertion is confirmed load-bearing by inspection:
   it would fail immediately if that structural guarantee were ever violated.

## 8. Focused test result

Isolated `-t 'concurrent accept vs revoke'` run: **1 passed** (re-run fresh in this review,
independent of the implementation's own 5 prior runs).

## 9. Full emulator result

`pnpm run emulators:validate`: **688/690** (2 pre-existing skips, matching precedent), clean, no
flake. Also ran the full `staffMembershipIntegration.emulator.test.ts` file in isolation:
**19/19 passed** — every accept/revoke/expiry/concurrency scenario in the file, unchanged.

## 10. Functions result

`pnpm --filter functions run test`: **1563/1563**, unaffected. `tsc --noEmit`, `eslint .`,
`prettier --check .`: all clean (1 pre-existing, unrelated warning in `BusinessApiContext.tsx`,
confirmed pre-existing).

## 11. Findings/fixes

None. The implementation's root-cause diagnosis, fix, and audit were all independently confirmed
accurate. No correction was needed during this review.

## 12. Remaining findings

None.

## 13–14. Files modified & diff summary (this review's own changes)

None to the source tree — this review made no code correction. This report and the changes-log
entry are the only new content from this review task itself.

## 15. Commands executed

`gh pr view/checks`, `git worktree add` (isolated review copy), `git rev-list`/`git merge-base`/
`git diff --stat`/`--name-only` (ancestry+scope), `grep`/`Read` across the test file and every
production file it exercises (`invitationPolicy.ts`, `createStaffInvitationService.ts`,
`revokeStaffInvitationService.ts`, `acceptStaffInvitationService.ts`,
`businessMembershipInvitation.ts`), `pnpm install`, targeted `sed`/`python3` mutation edits + focused
`firebase emulators:exec ... vitest run -t ...` re-runs (×2) + revert, full-file emulator run, full
`pnpm run emulators:validate`, `pnpm --filter functions run test`, `pnpm run typecheck`/`lint`,
`npx prettier --check .`, `gh pr ready`, `gh pr merge`.

## 16. Dependencies/config/Firebase/Rules changes

None, by this review or by the original PR.

## 17. Merge SHA

`a0fdb42f958d045bd3ab164fd74e962d4502ae9d` — PR #184 merged into `main` via `gh pr merge --merge`
(genuine merge commit, two parents: `3b02974` and `01debf1`, verified via
`git log -1 --format="%P"`; matches this repository's convention, no repeat of the disclosed
PR #177 squash deviation).

## 18. Closure-sync SHA

Recorded once this closure-sync commit is created (this same commit, on branch
`docs/eng-p2-003-corr-timefix-001-review-closure-sync`).

## 19. Post-merge CI

Run `33052683289` on `main` at `a0fdb42` — **success**, registering and completing promptly (no
repeat of the GitHub Actions backlog seen during the Package D closure chain). Notably, the
**immediately prior** merge to `main` (PR #183, unrelated docs-only commit) had its own
push-triggered CI **fail** on this exact pre-existing defect (`33047130065`) — confirming this
fix genuinely restores `main` to a reliably green state, not merely passing by chance.

## 20. Risks

None — test-only change, zero production diff, mutation-tested, full regression suite green,
post-merge CI independently confirmed green where the immediately preceding commit had failed on
this exact defect.

## 21. Rollback

Revert `a0fdb42`. The test will resume its live-wall-clock dependency (passing until some future
recurrence, i.e., never again in practice since `INVITATION_EXPIRY_DURATION_MS` is fixed and real
time only moves forward past `2026-08-27T01:00:00Z`) — not recommended.

## 22. Persistent review-report path

This file.

## 23. Exact next Founder action

None required — this correction is merged and closed. The UI programme (Packages E/F/G/H) may
resume once separately authorized; this task neither authorizes nor starts any of them, and does
not change Package D, `ENG-P3-002`, or Capability 3 status.
