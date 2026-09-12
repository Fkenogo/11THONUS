# PLATFORM-BASELINE-004A-CORR-001 — Recovery Audit and Idempotency Corrections — Correction Report

**Date:** 2026-09-12
**PR:** [#249](https://github.com/Fkenogo/11THONUS/pull/249) (`feat/platform-baseline-004a-workforce-integration`)
**Status:** **IMPLEMENTED / AWAITING INDEPENDENT REVIEW** — no merge performed by this task.
**Task identifier:** `PLATFORM-BASELINE-004A-RECOVERY-001`.

## 1. Why this report exists

The coding-agent session that produced PR #249 (`PLATFORM-BASELINE-004A — Workforce Integration Completion`) ended without a trusted completion handoff to the Founder. A separate recovery task was run to: recover the exact state the interrupted agent left, independently audit it against the original `PLATFORM-BASELINE-004A` requirements, and finish/stabilize the package without redoing valid work or redesigning anything.

## 2. Recovery findings — nothing was actually lost

Contrary to the "interrupted" framing, git-level recovery found **no lost work and no divergence to reconcile**:

- `origin/main`: `6d2446c918f293270bb173a18582bcd80c97d431`.
- PR #249 head (entry): `7c100003155fe204fe3c1fdb0ca2ee5f9ebf4860`.
- Existing isolated worktree `/private/tmp/11thonus-pb004a` (branch `feat/platform-baseline-004a-workforce-integration`): `HEAD` = `7c100003155fe204fe3c1fdb0ca2ee5f9ebf4860`, exactly matching both `origin/<branch>` and the PR head. `git status`: clean, 0 ahead/0 behind, no untracked files, no in-progress merge/rebase/cherry-pick.
- The branch's merge-base with `origin/main` is `6d2446c9...` itself — the branch was already current on `main`; no rebase was needed.
- CI at the exact entry head: `Build, Lint, Test, Emulator Validation` — **SUCCESS**.
- The primary worktree (unrelated `docs/dec-legal-002-bt-draft-007` work) was never touched, inspected for content, or modified by this task.

So the prior agent had, in fact, reached full implementation, validation, documentation, and PR opening. The one genuine gap was **two open, unaddressed automated code-review findings** on PR #249 (both from `chatgpt-codex-connector[bot]`, posted 2026-09-12T13:53Z, no other comments/threads on the PR) that the interruption left unresolved.

## 3. Requirements matrix (original `PLATFORM-BASELINE-004A` requirements → inherited status → action taken → final status)

| Requirement | Inherited status | Action taken | Final status |
|---|---|---|---|
| `acceptStaffInvitation` callable + UI route, invitation-is-authority, no client-supplied identity/role/business | Implemented correctly (verified by direct code read: whitelist parser accepts only `invitationReference`; actor from `resolveAuthenticatedBusinessActor`; role/business from the invitation) | None needed | **COMPLETE** |
| Role-change callable + UI, closed vocabulary, Owner-only non-delegable | Implemented correctly (verified: `fromRole`/`toRole` restricted to `manager`/`staff`, `owner` structurally rejected; delegates to pre-existing `changeStaffMembershipRoleCommand`) | None needed | **COMPLETE** |
| Suspend/reactivate/remove callables + UI, explicit per-action commands | Implemented correctly (verified: three explicit callables, not a generic `manageStaff(action)`; delegate to pre-existing `staffMembershipLifecycleCommand.ts`, which enforces cross-business isolation via `target.businessId !== params.businessId`) | None needed | **COMPLETE** |
| Permission override — expose only if MVP authority requires it | Correctly left unexposed with evidence recorded (report §9) | None needed | **BLOCKED BY AUTHORITY (correctly, by design)** — preserved, not exposed |
| Idempotency audit of every newly exposed mutation | `acceptStaffInvitation` corrected (atomic in-transaction completion, PB003-CORR-001 pattern); `authorizeAndExecute`-wrapped operations classified as Class B and correctly left uncorrected (shared wrapper, out of scope per the task's own stop-rule) | **Found and fixed one narrow gap the prior audit missed**: the `acceptStaffInvitation` *replay* path returned the stored idempotency snapshot's `acceptedAt` as a raw Firestore `Timestamp` (no `.toISOString()`), which the callable transport then called `.toISOString()` on unconditionally — throwing on every retried acceptance after a lost first response. Fixed by normalizing the replayed value with the same `fromTimestampLike` duck-typing pattern `customerProfileDocument.ts` already established for this exact Date↔Timestamp seam (§5). | **COMPLETE** (was PARTIAL — see §4) |
| No parallel/duplicate domain logic | Verified: all five callables import and delegate to pre-existing domain commands (`acceptStaffInvitationService.ts`, `staffRoleChangeCommand.ts`, `staffMembershipLifecycleCommand.ts` — all ENG-P2-003B/003C); no new business-rule logic at the transport/UI layer | None needed | **COMPLETE** |
| Authentication/identity boundary — provider-neutral, no raw UID/client-claim authority | Verified: all five callables use the pre-existing `resolveAuthenticatedBusinessActor` (ENG-P2-002C); no new auth path | None needed | **COMPLETE** |
| UI integration (no duplicate screens, correct query invalidation, confirm gates on destructive actions) | Verified by code read + full Playwright run: inline confirm on suspend/remove, direct reactivate, per-hook `invalidateQueries`, no `window.confirm` | **Found and fixed one narrow gap**: the Team page's single shared lifecycle/role-change hook instance held one idempotency key across every row; a key retained after a retryable failure against one member and then reused against a *different* member would deterministically hit a false `IDEMPOTENCY_CONFLICT` (the server-side request hash binds the key to the target). Fixed by scoping the held key to the request signature and rotating it on change (§6). | **COMPLETE** (was PARTIAL — see §4) |
| EN/FR localisation parity | Verified: automated key-parity check found no orphan keys in either locale file; `i18n.test.tsx`/FR-specific RTL assertions pass | None needed | **COMPLETE** |
| Automated review findings addressed | 2 open Codex findings (P1, P2) | Both investigated against actual code (not dismissed on the strength of passing tests), confirmed **CONFIRMED** valid, fixed narrowly, regression-tested, replied and resolved on the PR | **COMPLETE** |

## 4. Automated review findings — independent verification and disposition

Both findings were traced against the actual code before any fix was written (not accepted or dismissed on their text alone):

- **P1** (`functions/src/index.ts:1226`, "Normalize replayed Firestore timestamps before serializing") — **CONFIRMED.** Verified by reading `acceptStaffInvitationService.ts`'s duplicate-reservation branch (`return reservation.record.responseSnapshot as AcceptInvitationResult;`) and `idempotencyService.ts`'s `checkAndReserveIdempotencyKey`, which stores `responseSnapshot` as a raw Firestore document field — so a `Date`-typed field written once round-trips back as a `Timestamp` (no `.toISOString()`) on every subsequent read. `index.ts`'s callable handler unconditionally calls `result.acceptedAt.toISOString()`, which throws for the replay path specifically — the very case idempotency exists to make safe. The codebase's own `businessActivationCommand.ts` (the pattern this package explicitly modeled its idempotency fix on) sidesteps this entirely by returning a fixed `{ outcome: "duplicate" }` literal on replay rather than the stored snapshot — `acceptStaffInvitation` diverges from that precedent by returning the snapshot's fields directly, which is what exposes the bug.
- **P2** (`apps/web/src/business/hooks/businessMutations.ts:266`, "Rotate the idempotency key when the target changes") — **CONFIRMED.** Verified by reading `TeamManagementPage.tsx` (one `useSuspendStaffMembershipMutation(businessId)` etc. call per page, shared across every rendered row) and `settleKeyOnError`/`isRetryableBusinessErrorCode` (only `"unavailable"`/`"timeout"` retain the key). A key retained after a transient failure against member A, then reused unchanged against member B, carries a request hash server-side that is bound to `targetMembershipId` (and, for role change, the role transition) — a mismatch is a fail-closed `IDEMPOTENCY_CONFLICT`, not a silent corruption, but it is a genuine false-negative UX bug requiring a second manual retry to self-heal.

Both findings were corrected (§5–§6), regression-tested (§7), and the PR review threads were replied to and marked resolved.

## 5. Fix 1 — `acceptStaffInvitation` replay normalization

`functions/src/domains/permissions/service/acceptStaffInvitationService.ts`: added a small local `fromTimestampLike` helper (duck-types `.toDate()`, mirroring the existing seam in `functions/src/domains/identity/repositories/customerProfileDocument.ts`) and applied it to the duplicate-reservation branch:

```ts
if (reservation.outcome === "duplicate") {
  const snapshot = reservation.record.responseSnapshot as AcceptInvitationResult;
  return { ...snapshot, acceptedAt: fromTimestampLike(snapshot.acceptedAt) };
}
```

No change to the command's public contract (`AcceptInvitationResult.acceptedAt` is still typed and now genuinely returned as a `Date`), no change to the transaction/atomicity work already landed in the original PR, no change to any other branch of the function.

## 6. Fix 2 — Team page idempotency-key target rotation

`apps/web/src/business/hooks/businessMutations.ts`: extracted a small, directly-testable pure helper alongside the existing `settleKeyOnError`:

```ts
export function keyForRequest(
  holder: ReturnType<typeof createIdempotencyKeyHolder>,
  lastSignature: { current: string | null },
  signature: string,
): string {
  if (lastSignature.current !== null && lastSignature.current !== signature) {
    holder.clear();
  }
  lastSignature.current = signature;
  return holder.getKey();
}
```

Wired into `useStaffMembershipLifecycleMutation` (signature = `targetMembershipId`) and `useChangeStaffMembershipRoleMutation` (signature = `` `${targetMembershipId}:${fromRole}:${toRole}` ``, since the server-side request hash binds the key to the full role transition, not just the target). `useAcceptStaffInvitationMutation` was not touched — it is never shared across multiple logical targets (self-service, one invitation reference per page). No change to `settleKeyOnError`, to the retryable-error-code list, or to any other mutation hook.

## 7. Tests added

- `functions/src/domains/permissions/service/acceptStaffInvitationIdempotency.emulator.test.ts`: extended the existing "same-key retry ... replays the stored success" emulator test with assertions that the replay's `acceptedAt` is a genuine `Date` and that `.toISOString()` does not throw and matches the original result — proving the exact failure mode P1 described against real Firestore Emulator round-trip data (not a mock).
- `apps/web/src/business/hooks/businessMutations.test.ts`: new `describe("keyForRequest (target-scoped idempotency key rotation)")` with four cases — same-target key reuse, rotation on target change, no spurious rotation on the very first call, and a correctness check across an interleaved A/B/A sequence.

## 8. Full validation (run fresh against the final code state, not reused from the prior agent's claims)

- `pnpm run format:check`: clean.
- `pnpm run lint`: 0 errors (1 pre-existing, unrelated `react-refresh` warning in untouched `BusinessApiContext.tsx`).
- `pnpm --filter functions typecheck`: clean.
- `pnpm --filter web typecheck`: clean.
- `pnpm --filter functions test`: **158 files / 1718 tests, all pass.**
- `pnpm --filter web test`: **109 files / 773 tests, all pass** (verified file-by-file after a heavily-loaded full parallel run produced transient, non-reproducing timeouts on unrelated files — see §9; every file touched by this correction, plus every file in PR #249's original diff, was independently re-run to a clean pass).
- `PLATFORM_ENV=test pnpm --filter functions test:postgres` (against the already-running project Postgres container): **3 files / 23 tests, all pass.**
- `pnpm run emulators:validate` (real Firebase Emulator Suite, Firestore + Auth): **65 files / 833 passed / 3 pre-existing disclosed skips / 0 failed** — includes the extended replay-normalization assertions from §7.
- `pnpm run build`: clean (functions `tsc` + web `tsc -b && vite build`; only the pre-existing chunk-size warning).
- `pnpm run test:e2e` (`chromium` + `chromium-dashboard-harness`): **37/37 pass**, including all 5 new `dashboard-team-admin-harness.spec.ts` specs from the original package.

## 9. A note on local test-environment contention

This machine runs several other agent sessions and worktrees concurrently (visible via `ps`/`docker ps`: an unrelated `tiizi_revamp` Postgres/Firestore stack, other `11THONUS` worktrees). A first full-parallel `pnpm --filter web test` run produced 33 failures spanning files with no relationship to this package (`SignInPanel`, `DisplayNameProfile`, `NewBusinessPage`, `PhoneAuthHarnessPage` timing tests) alongside two files this correction touches. Every one of those files was re-run in isolation and passed cleanly; the six files this correction actually touches or is covered by (`businessMutations.test.ts`, `staffMembershipMutations.test.ts`, `TeamManagementPage.workforce.test.tsx`, `AcceptStaffInvitationPage.test.tsx`, `TeamManagementPage.test.tsx`, `BusinessDashboardRoutes.test.tsx`) were run together and passed (59/59). This is recorded plainly rather than silently re-run-until-green: the full-suite numbers in §8 reflect a clean, low-contention re-run, and the flakiness pattern itself was diagnosed (contended shared CPU/ports), not assumed away.

## 10. Files touched by this correction

- `functions/src/domains/permissions/service/acceptStaffInvitationService.ts` (+7/−1: `fromTimestampLike` helper + duplicate-branch fix)
- `functions/src/domains/permissions/service/acceptStaffInvitationIdempotency.emulator.test.ts` (+8: replay-normalization assertions)
- `apps/web/src/business/hooks/businessMutations.ts` (+34/−16: `keyForRequest` helper + two call sites)
- `apps/web/src/business/hooks/businessMutations.test.ts` (+47: `keyForRequest` test suite)
- `docs/00-governance/documentation-changes-log.md` (new entry for this correction)
- This report.

No other file touched. No domain-model, catalogue, evaluator, rules, migration, config, or dependency change. No file under `DEC-LEGAL-002` scope touched. No Reward Program/Purchase/Verification/Redemption/loyalty-domain work started.

## 11. Dependencies / config / schema

None added, changed, or removed in any category.

## 12. Risks

Low. Both fixes are narrow, additive, and localized to the exact code paths the automated review flagged; neither changes any public contract, error taxonomy, authority model, or shared helper's signature. The `authorizeAndExecute`-wrapped operations' own Class B idempotency limitation (documented in the original report §14/§33/§34) remains deliberately uncorrected, per the task's own stop-rule against broadening scope into the shared wrapper that also serves the already-live `create`/`revoke` commands.

## 13. Known limitations (carried forward, unchanged from the original report)

1. Permission-override administration: backend preserved, intentionally unexposed.
2. `authorizeAndExecute` idempotency (Class B, shared wrapper): reported, not refactored — unchanged by this correction.
3. Manager-viewer Team UI covers lifecycle-on-staff only, by design.

## 14. Rollback instructions

Revert this correction's commit(s) on `feat/platform-baseline-004a-workforce-integration` and push (or reset the branch to entry head `7c100003155fe204fe3c1fdb0ca2ee5f9ebf4860` if a revert commit is undesired). No data migration, no config, and no other branch/PR is affected. The original package's own rollback instructions (revert the whole PR branch merge) are unaffected and still apply if a full rollback is ever needed.

## 15. PR number and final head

PR #249 — branch `feat/platform-baseline-004a-workforce-integration`. Final head SHA and exact-head CI result are recorded once pushed (§16, updated after push).

## 16. Exact-head CI run/result

To be recorded after push, once GitHub Actions reports on the exact final commit.

## 17. `.md` tracking/change record

This document, plus the corresponding entry in `docs/00-governance/documentation-changes-log.md`, following the same non-`ENG-Pn-nnn` convention the original `PLATFORM-BASELINE-004A` report used.

---

## Final disposition

**PLATFORM-BASELINE-004A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW** (recovered, audited, and corrected by `PLATFORM-BASELINE-004A-RECOVERY-001`).

No merge was performed by this task. No self-approval. Reward Program not started.
