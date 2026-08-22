> **Title:** ENG-P2-004-CORR-003 — Pre-Operational Staff Management Lifecycle Eligibility Correction — Implementation Report
> **Date:** 2026-08-22
> **Status:** Implemented / pending Founder review
> **Task ID:** `ENG-P2-004-CORR-003`

## 1. Entry origin/main SHA

`origin/main` at task start: `289b190a4bf9456793611b7620fbb53cc0348872` ("docs(tracking): ENG-P3-002B — closure sync [ENG-P3-002B] (#155)"). The provided worktree's `HEAD` was confirmed identical to `origin/main` at this SHA (`git rev-parse HEAD` == `git rev-parse origin/main`, `git merge-base HEAD origin/main` also equal) — no reset was required.

## 2. Worktree/branch

Worktree: `/Users/theo/11THONUS/.claude/worktrees/agent-a689a6540413e6a49` (harness-provided, isolated from the primary checkout). Branch: `worktree-agent-a689a6540413e6a49`. The primary checkout at `/Users/theo/11THONUS` was never entered or modified by this task (confirmed — see §37).

## 3. Prerequisites (Phase A verification)

All confirmed before any code was written:

- `functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts` read directly (nine entries: eight design rows plus `ENG-P2-004-CORR-002`'s `staff.assignRole`).
- `functions/src/domains/permissions/evaluator/evaluatePermission.ts` read directly — confirmed the existing global `OPERATIONAL_BUSINESS_STATUSES = {trial, active}` Sensitive gate and `ENG-P2-004-CORR-001`'s existing per-permission ordinary-catalogue precedent.
- `functions/src/domains/permissions/models/ordinaryPermissionCatalogue.ts` read directly — confirmed the exact `eligibleBusinessStatuses?: readonly BusinessLifecycleStatus[]` shape this correction mirrors.
- `ENG-P2-004-CORR-001` confirmed merged: PR #126, merge commit `ce2b026`.
- `ENG-P2-004-CORR-002` confirmed merged: PR #134, merge commit `3153ae6`.
- `createStaffInvitation` (`createStaffInvitationService.ts`) and `revokeStaffInvitation` (`revokeStaffInvitationService.ts`) both confirmed, by direct source inspection, to request exactly `permission: "staff.manage"`. `staffMembershipLifecycleCommand.ts` (suspend/remove) confirmed to use the same `PERMISSION = "staff.manage"` constant.
- No overlapping `ENG-P2-004` correction branch/PR found (`git branch -r` inspected for `eng-p2-004`/`corr-003`).
- PR #156 (`ENG-P3-002C`) confirmed `OPEN`, headRef `feat/eng-p3-002c-onboarding-integration-preview` — not touched by this task.
- `BusinessLifecycleStatus` canonical type located at `functions/src/domains/permissions/evaluator/types.ts` (eight-member union: `draft`, `pending_verification`, `trial`, `active`, `suspended`, `expired`, `closed`, `archived`) — reused, not duplicated.

No prerequisite failure — proceeded per the task's own instruction.

## 4. Existing blocker reproduction (Phase C, RED)

A temporary scratch test file (`evaluatePermission.corr003.red.test.ts`, deleted after use — its permanent replacement is `evaluatePermission.corr003.test.ts`) proved, against the real, unmodified `evaluateAuthorizationDecision` function:

- Owner + active membership + `business.status = "draft"` + `permission = "staff.manage"` → `allowed: false`, `errorCategory: "BUSINESS_INACTIVE"`, `reasonCode: "BUSINESS_NOT_ACTIVE"`.
- Same for `business.status = "pending_verification"`.

Both assertions **passed** against the unmodified baseline (genuine RED — the blocker is real, not assumed). Real vitest output captured, not fabricated:

```
✓ CURRENT BASELINE BUG: ... status=draft ...
✓ CURRENT BASELINE BUG: ... status=pending_verification ...
Test Files  1 passed (1)
     Tests  2 passed (2)
```

## 5. Pre-code strategy

The correction mirrors `ENG-P2-004-CORR-001`'s already-merged, Founder-approved pattern for per-permission lifecycle eligibility (`ordinaryPermissionCatalogue.ts`'s `eligibleBusinessStatuses`), applied to the Sensitive catalogue instead of inventing a new mechanism:

1. Add one optional field, `eligibleBusinessStatuses?: readonly BusinessLifecycleStatus[]`, to `SensitivePermissionCatalogueEntry`. Absent means the legacy `{trial, active}` set — no entry's behavior changes merely by the field existing.
2. Populate it on `staff.manage`'s entry only: `["draft", "pending_verification", "trial", "active"]`.
3. In `evaluatePermission.ts`'s Sensitive classification branch, read the entry's override (if any) and fall back to the (renamed, behavior-identical) legacy constant when absent.
4. Touch nothing else — `staffMembershipLifecycleCommand.ts`, `createStaffInvitationService.ts`, `revokeStaffInvitationService.ts` all request `staff.manage` through the unmodified `authorizeAndExecute` → `evaluatePermissionWithContext` → `evaluateAuthorizationDecision` chain, so the fix reaches invite/suspend/remove uniformly without any command-level or action-specific change (Phase L requirement).

This keeps the diff to two production files (one catalogue, one evaluator) plus tests — no new permission, no new role, no new grant mechanism, no widening of `staff.assignPermissions`.

## 6. Catalogue contract change

`functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts`:

```ts
import type { BusinessLifecycleStatus } from "../evaluator/types";
...
export type SensitivePermissionCatalogueEntry = {
  ...
  readonly eligibleBusinessStatuses?: readonly BusinessLifecycleStatus[];
};
```

Documented as: absence MUST mean the legacy `{trial, active}` eligibility; only `staff.manage` receives an override; every other entry is semantically unchanged.

## 7. staff.manage lifecycle configuration

```ts
{
  id: "staff.manage",
  ...
  eligibleBusinessStatuses: ["draft", "pending_verification", "trial", "active"],
}
```

Exactly the Founder-approved set. `suspended`/`expired`/`closed`/`archived` deliberately excluded (unchanged, still ineligible).

## 8. Evaluator change

`functions/src/domains/permissions/evaluator/evaluatePermission.ts`:

- Renamed `OPERATIONAL_BUSINESS_STATUSES` → `LEGACY_OPERATIONAL_SENSITIVE_STATUSES` (same `{trial, active}` value — a rename with a clarifying role, not a behavior change) to name it as the fallback it now is.
- Sensitive branch of the classification gate:

```ts
if (permissionClass === "sensitive") {
  const sensitiveEntry = getSensitivePermissionEntry(request.permission);
  const eligibleSensitiveStatuses: ReadonlySet<string> = sensitiveEntry.eligibleBusinessStatuses
    ? new Set(sensitiveEntry.eligibleBusinessStatuses)
    : LEGACY_OPERATIONAL_SENSITIVE_STATUSES;
  if (!eligibleSensitiveStatuses.has(business.business.status)) {
    return deny(now, "BUSINESS_NOT_ACTIVE", "BUSINESS_INACTIVE");
  }
}
```

No `permission === "staff.manage"` special case anywhere in the evaluator — the policy lives entirely in the catalogue, per the task's explicit instruction.

## 9. Legacy Sensitive fallback proof (Phase G)

`evaluatePermission.corr003.test.ts`, "Phase G" describe block: for every Sensitive id **other than** `staff.manage` (`staff.assignPermissions`, `staff.assignRole`, `business.transferOwnership`, `business.configureFraudRules`, `transaction.reverse`, `reward.override`, `customer.viewProtectedProfile`, `report.exportFinancial`), an Owner request is asserted to deny `BUSINESS_INACTIVE` for `draft`/`pending_verification`/`suspended`/`expired`/`closed`/`archived`, and to proceed past the lifecycle gate (allow via `OWNER_FLOOR`) for `trial`/`active` — 8 ids × 8 statuses = 64 executable assertions, all real, all passing.

## 10. Full Sensitive non-regression matrix (Phase G/H)

Phase G (above) + Phase H (`staff.manage`'s own matrix): eligible for `draft`/`pending_verification`/`trial`/`active`, deny for `suspended`/`expired`/`closed`/`archived` — all 8 statuses covered, real assertions.

## 11. Owner result (Phase I)

`staff.manage` for Owner + active membership allows in all four newly-eligible statuses via the pre-existing, unmodified `OWNER_FLOOR` reason code and `owner-floor` permission source — no new bypass mechanism introduced; this is the existing Owner-floor evaluation step (`role === "owner" && isSensitivePermission(permission)`) simply no longer blocked earlier by the lifecycle gate.

## 12. Manager result (Phase J)

- Manager **without** an explicit `staff.manage` grant: denies (`AUTH_FORBIDDEN`) in all four newly-eligible statuses — no default, no new pre-operational grant path.
- Manager **with** an already-persisted valid grant override: allows via the pre-existing `EXPLICIT_GRANT` mechanism in all four newly-eligible statuses — this is the same `PermissionOverride` grant mechanism `ENG-P2-004A` already governs; no new grant mechanism was added.

Per the Founder disposition: because `staff.assignPermissions` itself is unchanged (still `{trial, active}`), a Manager cannot be *newly* granted `staff.manage` while the Business is `draft`/`pending_verification` through ordinary product flow — only a Manager who already held a valid grant from when the Business was `trial`/`active` (e.g. after a later re-`draft`, which is not a real lifecycle transition, or via test-only fixture seeding as exercised here) benefits. This is the explicitly accepted MVP consequence — **not** a defect, not "fixed" by this task.

## 13. Staff result (Phase K)

Staff has no role default/template for `staff.manage` (confirmed via `SENSITIVE_PERMISSION_ROLE_TEMPLATES` — `staff.manage` is not among rows 7-8's inheritable entries) and is denied with no override present. A Staff membership carrying a fabricated/attacker-injected grant override for `staff.manage` is still denied — the evaluator's existing grant-eligibility revalidation (`entry.explicitGrantEligibleRole === role`, which names only `"manager"` for `staff.manage`) rejects it regardless of Business status. Both proven across all four newly-eligible statuses.

## 14. invite/suspend/remove result (Phase L)

Not modified at the command level. Because `createStaffInvitationService.ts` (invite), `revokeStaffInvitationService.ts`, and `staffMembershipLifecycleCommand.ts` (suspend/remove) all resolve authorization through the same `authorizeAndExecute` → `evaluatePermissionWithContext` → `evaluateAuthorizationDecision` chain requesting the identical `"staff.manage"` permission id, the single evaluator-branch change benefits all three actions uniformly — confirmed by zero diff in any of those three command files, and by the Phase P integration proof exercising `createStaffInvitation` directly against a real `draft` Business.

## 15. Owner/self/target protection (Phase M)

Not modified. `staffMembershipTargetPolicy.ts` and all Staff-domain command-level protections (Owner-target rejection, self-action prohibition, cross-business isolation, malformed-target handling) are untouched — zero diff. The full pre-existing Staff-domain emulator/unit test suite (target-policy, lifecycle-command, role-change, membership-integration tests) was re-run as part of full validation and passed unchanged (no assertion needed updating in this area).

## 16. Audit result (Phase N)

`staff.manage` remains classified Sensitive (its catalogue entry, and `isSensitivePermission`, are unchanged in every respect except the new optional field). `permissionAuditService.ts`/`authorizeAndExecute.ts`'s mandatory sensitive-decision audit write is untouched (zero diff) — still fires unconditionally for every sensitive-permission decision, allow or deny. The Phase P integration test directly confirms a `permission_decision_recorded` audit event is durably written via the outbox for an allowed `staff.manage` decision on a `draft` Business, with `payload.permission === "staff.manage"` and `payload.result === "allow"`.

## 17. Real draft-Business invitation integration proof (Phase P)

New file: `functions/src/domains/permissions/service/staffInvitation.corr003.emulator.test.ts`, run against the real Firebase Firestore/Auth Emulator Suite (`firebase emulators:exec`), not a mock:

- `bootstrapBusiness` used unmodified — a Business is created at its real default status, `draft` (never forced to `active`, unlike the pre-existing `staffInvitation.emulator.test.ts` helper).
- Owner calls the real `createStaffInvitation` command → `outcome: "created"`.
- Invitation independently re-read from Firestore via `getInvitationByReference` → `kind: "found"` (persistence proven, not merely the in-memory return value).
- Business document independently re-read after the invitation → `status` still `"draft"` (no unauthorized lifecycle side effect).
- Outbox independently queried for a `permission_decision_recorded` audit event → found, `permission: "staff.manage"`, `result: "allow"`.
- A second test repeats the same proof with the Business manually transitioned to `pending_verification`.
- A third test proves a non-scope Sensitive permission (`business.configureFraudRules`) still denies through `authorizeAndExecute` on a `draft` Business, at the integration level (not just the pure-evaluator level).

All three tests passed for real (see §21).

## 18. pending_verification proof

Covered in §17 (integration) and §9–13 (evaluator-level, all Phase G/H/I/J/K matrices include `pending_verification` as one of the four newly-eligible statuses).

## 19. RED→GREEN evidence

- **RED** (§4): genuine failing-would-be-blocker assertions passed against the *unmodified* baseline, proving the blocker (deny where the Founder disposition requires allow).
- **GREEN**: after the catalogue+evaluator fix, the identical two cases (Owner + `draft`/`pending_verification` + `staff.manage`) were re-run and flipped to `allowed: true` — confirmed by direct `vitest` execution, output:

```
✕ CURRENT BASELINE BUG: ... status=draft ... (expected false, received true)
✕ CURRENT BASELINE BUG: ... status=pending_verification ... (expected false, received true)
```

(the scratch RED file's own assertions, written to detect the *old* behavior, now correctly fail — proving the fix — after which the scratch file was deleted and its permanent replacement, `evaluatePermission.corr003.test.ts`, asserts the corrected behavior directly.)

- A second genuine RED→GREEN cycle occurred incidentally: running the full suite after the fix surfaced two **pre-existing** tests that had used `staff.manage` as their generic "a sensitive permission" example for an unrelated non-regression assertion (`evaluatePermission.test.ts` line ~1436, `ordinaryPermissionCorrection.emulator.test.ts` line ~248) — both failed for real (`expected true to be false` / `expected 'executed' to be 'denied'`), confirming they were exercising the exact intentionally-changed behavior. Both were corrected to use `business.configureFraudRules` instead (a permission with no lifecycle override), which preserves each test's original intent (proving the *general* sensitive gate is unchanged) without asserting the now-incorrect claim about `staff.manage` specifically. Both re-run green after the fix.

## 20. Tests added/changed

**Added:**
- `functions/src/domains/permissions/evaluator/evaluatePermission.corr003.test.ts` — Phases G, H, I, J, K, L, O (evaluator-level), 100 new test cases.
- `functions/src/domains/permissions/service/staffInvitation.corr003.emulator.test.ts` — Phase P (real emulator integration), 3 new test cases.
- `sensitivePermissionCatalogue.test.ts` — 2 new test blocks (staff.manage's override value; every other id's absence of the field).

**Changed (pre-existing tests corrected to track the intentional behavior change, not regressions):**
- `evaluatePermission.test.ts` — one test's example permission changed from `staff.manage` to `business.configureFraudRules` (see §19).
- `ordinaryPermissionCorrection.emulator.test.ts` — same correction, same reason.

## 21. Full validation results

All commands run for real in this worktree; no output fabricated.

| Check | Command | Result |
|---|---|---|
| Functions unit tests | `cd functions && npx vitest run` (also via `pnpm run test`) | **1563/1563 passed** (143 files) |
| Functions emulator suite | `firebase emulators:exec --project demo-11thonus "pnpm --filter functions test:emulator"` | **682/682 passed, 2 skipped** (51 files) |
| Web unit tests | `pnpm run test` (workspace, `apps/web`) | **475/475 passed** (73 files) |
| Typecheck | `pnpm run typecheck` (functions + apps/web) | clean |
| Lint | `pnpm run lint` | clean (one pre-existing, unrelated `apps/web` fast-refresh warning, not touched by this task) |
| Format check | `pnpm run format:check` | clean (after `prettier --write` on the touched files) |
| Build | `pnpm run build` (functions `tsc` + apps/web `tsc -b && vite build`) | clean |
| Secret scan | — | **No secret-scan script exists in this repository's `package.json`** (checked root, `functions`, `apps/web` — none configured); not run, none skipped |

Interim finding during the first emulator-suite run: 1 pre-existing test failed (the `staff.manage`-as-example case in `ordinaryPermissionCorrection.emulator.test.ts`, §19); corrected and the full 51-file emulator suite re-run clean.

## 22. Independent review findings (Phase S)

A fresh review pass against the ten-point checklist:

1. Only `staff.manage` receives expanded lifecycle eligibility — confirmed (`sensitivePermissionCatalogue.test.ts`'s new "every other id has no override" test).
2. All other Sensitive permissions retain exact legacy lifecycle behavior — confirmed (Phase G, 64 assertions).
3. Owner can invite in `draft` — confirmed (Phase P integration).
4. Owner can invite in `pending_verification` — confirmed (Phase P integration).
5. No new Manager grant path exists — confirmed (zero diff in `permissionOverride.ts`, `staffPermissionOverrideCommand.ts`; Phase J proves only the pre-existing grant mechanism).
6. Staff remains denied — confirmed (Phase K, including the fabricated-override attack path).
7. Target protections unchanged — confirmed (zero diff `staffMembershipTargetPolicy.ts`; full pre-existing suite unchanged and passing).
8. Audit unchanged — confirmed (zero diff `permissionAuditService.ts`; Phase P integration directly observes the audit event).
9. No ordinary-permission regression — confirmed (zero diff `ordinaryPermissionCatalogue.ts`; full ordinary-permission test suite unchanged and passing except the one intentional-behavior-tracking correction, §19).
10. No command-level bypass — confirmed (zero diff across every Staff-domain command file; the fix is entirely catalogue + one evaluator branch).

The only genuine findings from this review were the two pre-existing tests described in §19 — both were pre-existing tests whose assertions became stale given the Founder-approved behavior change (not defects in the correction itself), and both were corrected with an inline explanation, re-verified green. No other defect found.

## 23. Remaining material findings

None beyond §19's two corrected tests. The accepted MVP consequence (Manager cannot be newly granted `staff.manage` during `draft`/`pending_verification` because `staff.assignPermissions` itself is unchanged) is explicitly not a defect — it is the Founder-authorized disposition, documented in §12.

## 24. Files modified

Production code:
- `functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts`
- `functions/src/domains/permissions/evaluator/evaluatePermission.ts`

Tests (new):
- `functions/src/domains/permissions/evaluator/evaluatePermission.corr003.test.ts`
- `functions/src/domains/permissions/service/staffInvitation.corr003.emulator.test.ts`

Tests (corrected, pre-existing):
- `functions/src/domains/permissions/evaluator/evaluatePermission.test.ts`
- `functions/src/domains/permissions/models/sensitivePermissionCatalogue.test.ts`
- `functions/src/domains/permissions/service/ordinaryPermissionCorrection.emulator.test.ts`

Documentation:
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (changelog entry)
- `docs/05-implementation/reports/ENG-P2-004-CORR-003-staff-manage-pre-operational-lifecycle-eligibility-implementation-report-2026-08-22.md` (this report)

## 25. Code diff summary

Production diff: 2 files, ~57 lines added, 0 removed (purely additive — a new optional field with one populated entry, and a new fallback branch replacing the previous single-set check with an equivalent-when-absent lookup). No existing exported symbol removed; `OPERATIONAL_BUSINESS_STATUSES` renamed to `LEGACY_OPERATIONAL_SENSITIVE_STATUSES` (module-private, never exported, confirmed via `grep` that nothing outside this file referenced it).

## 26. Commands executed

`git fetch origin`; `git rev-parse`/`merge-base`; `git log --oneline --all | grep`; `git branch -r`; `gh pr view 156`; `pnpm install`; `npx vitest run` (functions, repeatedly); `npx prettier --write`; `pnpm run lint`; `pnpm run format:check`; `pnpm run typecheck`; `pnpm run build`; `pnpm run test`; `firebase emulators:exec --project demo-11thonus "pnpm --filter functions test:emulator"` (twice — once surfacing the pre-existing-test finding, once clean after the fix).

## 27. Dependencies/config changes

None. `pnpm install` was run only to materialize the workspace's existing, unmodified lockfile (`node_modules` was absent in the fresh worktree) — `pnpm-lock.yaml` has zero diff.

## 28. Firebase/Rules/deployment changes

None. `firestore.rules`, `storage.rules`, `firebase.json` — zero diff. No `firebase deploy` executed. The Firebase Emulator Suite was used only for local, ephemeral test validation (Phase P), never for deployment.

## 29. PR number

**PR #157** — https://github.com/Fkenogo/11THONUS/pull/157 (draft, branch `feat/eng-p2-004-corr-003-staff-manage-pre-operational-lifecycle` → `main`).

## 30. Final reviewed head SHA

`25401a36b4417cc8e436c3979b816829f4ec4338`.

## 31. CI result

**PASS** — hosted CI (`Build, Lint, Test, Emulator Validation`, run `32577647918`) completed green in 5m50s on the exact final head `25401a36b4417cc8e436c3979b816829f4ec4338`, confirmed via `gh run watch --exit-status` (not merely polled/assumed). All steps green: Build, Lint, Format check, Typecheck, Unit/component tests, Playwright e2e, Firebase Emulator Suite validation. No stall, no rerun needed.

## 32. ENG-P2-004-CORR-003 status

**Implemented / pending Founder review.**

## 33. ENG-P2-004 status

**Complete / correction pending** (unchanged classification — this is an additive governed correction, matching `CORR-001`/`CORR-002`'s own precedent).

## 34. PR #156 status

**Unchanged, not modified by this task.** After `ENG-P2-004-CORR-003` merges, PR #156 (`ENG-P3-002C`) needs no production-code change to invite Staff pre-operationally — the evaluator fix alone unblocks `createStaffInvitation` on a `draft`/`pending_verification` Business once `CORR-003` is on `main` and PR #156 is rebased onto it. PR #156's own test fixtures/assertions should be checked for any that still assume `staff.manage` is denied in `draft`/`pending_verification` (none were found in this repository's current `main`-side code during this task's search, but PR #156's own branch was not inspected in detail — out of this task's authorized scope).

## 35. ENG-P3-002 status

**Open** — blocked on: this Staff lifecycle correction until `CORR-003` merges (now unblocked pending merge); `DEC-LEGAL-002` for real-customer completion; hosted-preview/Founder QA.

## 36. Capability 3 status

**Open — partially implemented; not closed.**

## 37. Dirty primary worktree

Confirmed untouched: this task never `cd`'d into or modified `/Users/theo/11THONUS` (the primary checkout) — all work was performed exclusively inside the harness-provided worktree `/Users/theo/11THONUS/.claude/worktrees/agent-a689a6540413e6a49`.

## 38. Risks

- **Manager pre-operational invitation gap** (accepted, §12): a Manager cannot be freshly granted `staff.manage` during `draft`/`pending_verification` through ordinary product flow, since `staff.assignPermissions` remains `{trial, active}`-gated. This is the Founder-approved MVP disposition, not a risk requiring mitigation by this task — flagged here only for visibility.
- **PR #156 rebase**: PR #156 was not inspected for CORR-003-relevant test assumptions (out of authorized scope) — a future task should confirm no PR #156 test still hardcodes the old draft/pending_verification denial for `staff.manage`.

## 39. Rollback plan

Fully reversible by reverting the two production-code commits (catalogue field + evaluator branch) — both are additive/optional, so reverting drops `staff.manage` back to the legacy `{trial, active}` gate with zero other side effects. No data migration, no Rules change, no deployment to roll back.

## 40. Persistent report path

`docs/05-implementation/reports/ENG-P2-004-CORR-003-staff-manage-pre-operational-lifecycle-eligibility-implementation-report-2026-08-22.md` (this file).

## 41. Changes-tracking state

A dated entry was prepended to `docs/05-implementation/change-tracking/engineering-implementation-programme.md`'s `Last controlled update` changelog (prior entries preserved verbatim, matching that document's established pattern) — see §41's target file for the full entry text.

## 42. Exact next Founder action

Review this report and the draft PR; if satisfied, mark the PR ready for review and merge (this task does not self-merge, per Phase R/Q). After merge, a follow-up task should rebase PR #156 onto corrected `main` and confirm no stale `staff.manage`-denial assumption remains in its own test fixtures.

---

## FINAL GATE

**ENG-P2-004-CORR-003 READY FOR FOUNDER REVIEW/MERGE** — pending the draft PR's hosted CI result (§31, to be recorded once CI completes).
