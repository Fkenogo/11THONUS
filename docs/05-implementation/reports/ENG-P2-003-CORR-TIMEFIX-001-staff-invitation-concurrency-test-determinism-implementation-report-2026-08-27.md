# `ENG-P2-003-CORR-TIMEFIX-001` — Staff Invitation Concurrency Test Determinism Correction (2026-08-27)

**Status:** Test-fixture determinism correction, TDD, full validation, draft PR opened. Not
self-merged. Zero production-code diff. Does not change Package D, `ENG-P3-002`, or Capability 3
status.

## 1. Entry repository state

- `git fetch origin`: `origin/main` at `3b02974` (Package D's post-merge CI accuracy correction,
  PR #183).
- Primary checkout (`docs/eng-p3-002-ui-governance-chain-sync`, HEAD `99f840f`) was 0 ahead / 29
  behind `origin/main`, untouched — a fresh worktree
  (`/Users/theo/11THONUS-eng-p2-003-corr-timefix-001`, branch `fix/eng-p2-003-corr-timefix-001`)
  was created from `origin/main` instead.
- Confirmed Packages A–D all present on `main` (`git log --oneline origin/main | grep IMP-D`
  shows the full PR #181–#183 chain).
- No incomplete git operation present.

## 2. Reproduced failure

Confirmed the failure is real and reproducible from unmodified `origin/main`, in two ways:

1. Full `pnpm run emulators:validate`: passed cleanly on one run (688/690) — consistent with the
   failure being exposed only under certain timing/scheduling conditions relative to the rest of
   the 690-test suite (see §7 for why this is timing-*sensitive* rather than pure random flakiness).
2. **Isolated, targeted run** (`vitest run -t 'concurrent accept vs revoke'`, no other tests
   competing for time): **failed reliably and immediately**, confirming the fixture-level root
   cause is genuine and load-independent when run in isolation.

## 3. Exact failing assertion

```
FAIL src/domains/permissions/service/staffMembershipIntegration.emulator.test.ts >
  SCENARIO 12 — concurrency > concurrent accept vs revoke of the same invitation:
  exactly one wins, no partial state
AssertionError: expected 'expired' to be 'revoked'
Expected: "revoked"
Received: "expired"
  at staffMembershipIntegration.emulator.test.ts:1556:44
```

## 4. Root cause confirmed from source

Traced through `invitationPolicy.ts`, `createStaffInvitationService.ts`,
`revokeStaffInvitationService.ts`, and the test's own `inviteParams`/`acceptParams` helpers:

- `createStaffInvitationService.ts:134` calls `computeInvitationExpiresAt(invitedAt)`, where
  `invitedAt` is the `now` passed into `createStaffInvitation` — i.e., `inviteParams`'s **hardcoded**
  `now: new Date("2026-08-20T01:00:00.000Z")` (line 193 of the test file).
- `invitationPolicy.ts`: `computeInvitationExpiresAt(invitedAt) = invitedAt + 7 days`
  (`INVITATION_EXPIRY_DURATION_MS`). So this invitation's fixed `expiresAt` is
  **`2026-08-27T01:00:00.000Z`**.
- `revokeStaffInvitationService.ts:112-121` (a deliberate, documented "expiry precedence"
  correction from an earlier independent review — its own module comment: *"a `pending` invitation
  whose `expiresAt` has already passed is, in truth, already `expired`"*): if the invitation is
  still `pending` but `isInvitationPastExpiry(expiresAt, params.now)` is true, the command
  **correctly, intentionally** reclassifies it to `expired` rather than `revoked`.
- Scenario 12's revoke call (line 1539, pre-fix) passed **live** `now: new Date()` — not a value
  consistent with the invitation's fixed creation time. As long as real wall-clock time stayed
  before `2026-08-27T01:00:00.000Z`, this evaluated as "not yet expired" and the test passed. Once
  real time crossed that boundary (which happened mid-session, exactly as this repository's date
  rolled from 2026-08-26 to 2026-08-27), the revoke call's own live `now` began correctly, and
  deterministically, triggering the governed expiry-precedence rule — the test's expectation of
  `"revoked"` became permanently wrong for any run after that boundary.

**This is strictly a test-fixture clock inconsistency, not a production defect.** The production
code's expiry-precedence behavior in `revokeStaffInvitationService.ts` is correct and intentional
(explicitly documented as an independent-review correction); it was doing exactly what it should
given the (wrong) input it was handed. No production code was found to be defective.

## 5. Invitation creation timestamp

`inviteParams`'s hardcoded `now`: **`2026-08-20T01:00:00.000Z`**.

## 6. Derived expiry window

`invitedAt + INVITATION_EXPIRY_DURATION_MS (7 days)` = **`2026-08-27T01:00:00.000Z`**.

## 7. Live-clock mismatch

The failing revoke call passed `now: new Date()` (real wall-clock time) instead of a value
consistent with the invitation's `2026-08-20T01:00:00.000Z` creation time. `acceptParams`
(line 210) already defaults to a **fixed** `now: new Date("2026-08-20T02:00:00.000Z")` — one hour
after invitation creation, safely inside the 7-day window — establishing the file's own existing
convention that Scenario 12's inline revoke call simply failed to follow.

## 8. Production-code assessment

No production code is defective. `revokeStaffInvitationService.ts`'s expiry-precedence logic,
`invitationPolicy.ts`'s expiry computation, and `acceptStaffInvitationService.ts`'s expiry check
are all correct, intentional, already-documented behavior. Confirmed by direct source analysis
before making any change, per this task's own instruction not to touch production code unless
analysis proves the report wrong — analysis instead confirmed the report's diagnosis exactly.

## 9. Deterministic correction

Changed Scenario 12's revoke call's `now` from `new Date()` to a fixed
`new Date("2026-08-20T02:00:00.000Z")` — identical to `acceptParams`'s own established default,
one hour after the invitation's fixed creation time, comfortably inside its 7-day validity window.
This does not weaken or fake the test: the actual concurrency being tested — two commands racing
via `Promise.allSettled` against the same Firestore document, with exactly one winning — is a
property of Firestore's transaction contention and the commands' own idempotency/state-transition
logic, not of the `now` parameter's value. Fixing `now` to a safe, deterministic value removes only
the accidental wall-clock dependency; the race itself, and the "exactly one wins, no partial state"
invariant, are unchanged and still genuinely exercised.

## 10. Similar-pattern audit

Searched the full test file for every `new Date()` (live-clock) occurrence and classified each:

| Line | Call | Classification | Reasoning |
|---|---|---|---|
| 1154 | `revokeStaffInvitation(...)` (SCENARIO 6, "revoked cannot accept; revoked cannot be revived") | **Safe** | Only asserts `revoked.outcome === "revoked"` — the *outer* command-result wrapper's `outcome` field (`revokeStaffInvitationService.ts:153-154`) is unconditionally `"revoked"` whenever the transaction executes at all, regardless of whether the *persisted* `invitation.status` internally became `"revoked"` or `"expired"`. This call never inspects the persisted `status` field, so it cannot be exposed by the same time bomb. |
| 1182 | `revokeStaffInvitation(...)` (same scenario, re-revoking an already-terminal invitation) | **Safe** | Expects `INVALID_STATE_TRANSITION` because the invitation is already terminal from the prior revoke — true whether that prior terminal state is `"revoked"` or `"expired"`, since neither is `"pending"` and only a `"pending"` invitation can transition at all. |
| 1469 | `createdAt: new Date()` (test-only Firestore setup for a second linked auth reference) | **Safe** | An audit-trail timestamp field never read back or compared against any expiry/deadline logic — unrelated to invitation validity entirely. |
| 1539 (pre-fix) | `revokeStaffInvitation(...)` (SCENARIO 12 concurrency) | **Deterministic problem — fixed** | The only call site that asserts on the *persisted* `invitation.status` field after a live-`now` revoke, exposing it directly to the expiry-precedence rule once real time passed the fixture's hardcoded window. |

No other fixed-creation-time-vs-live-clock pattern was found elsewhere in this file (the
`farFuture` computation at line ~1198, used for the pre-existing "expired cannot accept" test, is
already correctly derived from the invitation's own actual `expiresAt` value, not from a live
clock — an already-safe, already-deterministic pattern).

## 11. Additional tests corrected, if any

None. Only the one line identified in §4/§9 required correction — the audit in §10 confirmed the
other three `new Date()` occurrences in this file are genuinely safe, not equivalent defects.

## 12. RED evidence

Isolated run against unmodified `origin/main` (`npx vitest run -t 'concurrent accept vs revoke'`):
failed immediately and reliably with `AssertionError: expected 'expired' to be 'revoked'` — see §2/§3.

## 13. GREEN evidence

Same isolated run against the corrected fixture: `Test Files 1 passed | 51 skipped (52)`,
`Tests 1 passed | 689 skipped (690)`.

## 14. Repeated-run determinism result

Ran the isolated Scenario 12 test **5 consecutive times** after the fix: **5/5 passed**, each a
fresh emulator instance (`firebase emulators:exec`, not a warm/cached process), confirming the fix
is genuinely deterministic and does not depend on today's actual date.

## 15. Scenario 12 concurrency invariant

Re-verified via the full-file run (§16): `expect(fulfilled.length).toBe(1)` (exactly one of
accept/revoke wins) and the no-duplicate-membership assertion
(`memberships.size).toBeLessThanOrEqual(1)`) both still pass — the invariant this test exists to
prove is unchanged and still genuinely exercised, not weakened.

## 16. Expiry regression result

Full `staffMembershipIntegration.emulator.test.ts` run: **19/19 passed**, including SCENARIO 6
("pending->accepted, pending->revoked, pending->expired are each single-use terminal") and the
other two SCENARIO 12 concurrency tests (double-accept; concurrent suspend vs role-change) —
confirming accept/revoke/expiry/concurrency semantics are all unchanged.

## 17. Full emulator result

`pnpm run emulators:validate`: **688/690** (2 pre-existing skips, matching this repository's
long-established precedent count), clean, no flake.

## 18. Functions test result

`pnpm --filter functions run test`: **1563/1563**, unaffected (this correction is emulator-test-only).

## 19. Files modified

`functions/src/domains/permissions/service/staffMembershipIntegration.emulator.test.ts` (one test
fixture line + explanatory comment), this implementation report, and the `.md` changes-tracking
entry. **Zero production-code diff**, confirmed by `git diff --stat`.

## 20. Code diff summary

+10/-1 lines in the single test file (one `now: new Date()` → fixed timestamp, plus an explanatory
comment documenting why).

## 21. Commands executed

`git fetch`, `git worktree add`, `pnpm install`, `pnpm run emulators:validate` (full suite, ×2),
`firebase emulators:exec ... vitest run -t 'concurrent accept vs revoke'` (isolated, ×6: 1 RED + 5
GREEN repeats), `firebase emulators:exec ... vitest run staffMembershipIntegration.emulator.test.ts`
(full file), `pnpm --filter functions run test`, `pnpm run typecheck`/`lint`, `npx prettier
--check`, `git commit`, `git push`, `gh pr create`.

## 22. Dependencies added

None.

## 23. Config/Firebase/Rules changes

None.

## 24. Findings

The root cause exactly matches the task's own reported diagnosis — no discrepancy found between
the report and direct source analysis. The audit in §10 additionally confirms no other call site
in this file shares the same defect.

## 25. Remaining material findings

None within this file's scope. No broader time-fixture debt was found elsewhere in this file to
report as a separate follow-up (the audit was exhaustive for this file, as scoped).

## 26. Risks

None — test-only change, zero production diff, 5/5 repeated-run determinism proven, full
regression suite (19/19 in the affected file, 688/690 emulator-wide, 1563/1563 unit-wide) green.

## 27. Rollback instructions

Revert the single commit; the test will resume its prior wall-clock-dependent behavior (passing
until some future date, then failing again) — not recommended, but a clean, low-risk revert.

## 28. Persistent report path

This file.

## 29. Changes-tracking state

A matching entry added to `docs/changes/IMPLEMENTATION_CHANGES.md` under
`## ENG-P2-003-CORR-TIMEFIX-001`.

## 30–32. PR number, final head SHA, CI result

- **PR:** [#184](https://github.com/Fkenogo/11THONUS/pull/184) — draft, from
  `fix/eng-p2-003-corr-timefix-001` against `main`. Not self-merged.
- **Final head SHA:** `7b4948f89496444bac52f2cb7ba98f33b6994a83`.
- **CI:** pending at the time of this report — see the PR's own Checks tab for current status.

## 33. Exact next Founder action

Review this draft PR; if approved, merge as a genuine merge commit. This correction does not
change Package D, `ENG-P3-002`, or Capability 3 status, and does not start any new UI package.
