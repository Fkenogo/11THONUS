# ENG-P2-004-CORR-003 — Independent Final Security Review, Merge & Closure Report

> **Date:** 2026-08-22
> **Task type:** Founder-authorized independent final security review, merge, and minimal closure sync of PR #157.
> **Scope:** PR #157 only. Did **not** touch PR #156, did not start preview deployment, did not begin `ENG-P3-003`, did not widen any permission beyond what PR #157 already contained.
> **Posture:** This is an independent re-derivation, not a rubber stamp of the prior implementation report. Every claim below was re-verified from source in a fresh clean worktree.

## 1. Entry gate (Phase A)

- `gh pr view 157` at task start: `state=OPEN`, `isDraft=true`, `headRefOid=26a1e8739c2cf21f87f6a98f77af69254c1fa3f4`.
- CI on that exact head: **PASS** — "Build, Lint, Test, Emulator Validation", run `32577981692`, 6m1s.
- No commits pushed after `26a1e873` were found (head unchanged throughout review).
- PR #156 (`ENG-P3-002C`) re-confirmed `OPEN`, head `bf0bc490e3eb1e7ac431ac4b523429c5e368dc11`, untouched by this task.
- Fresh worktree provided by the harness at `/Users/theo/11THONUS/.claude/worktrees/agent-ac7a49b4c5fdfa93a` (verified: separate `git worktree list` entry, own branch). `/Users/theo/11THONUS` was never `cd`'d into or modified.
- PR #157's branch (`feat/eng-p2-004-corr-003-staff-manage-pre-operational-lifecycle`) fetched into this worktree as `review/eng-p2-004-corr-003` for review; head confirmed `26a1e8739c2cf21f87f6a98f77af69254c1fa3f4`.

## 2. Re-derivation from source (Phase B)

Read directly from source (not from the prior implementation report):

- `functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts`
- `functions/src/domains/permissions/models/ordinaryPermissionCatalogue.ts`
- `functions/src/domains/permissions/evaluator/evaluatePermission.ts`
- `functions/src/domains/permissions/evaluator/types.ts` (`BusinessLifecycleStatus` definition)
- `git diff 289b190..26a1e87` (PR #157's complete diff, `origin/main`'s tip prior to this PR vs. the PR head)

`gh pr diff 157` was cross-checked against the direct `git diff` on the fetched branch — identical file set.

## 3. Module dependency check (Phase C)

`sensitivePermissionCatalogue.ts` imports `BusinessLifecycleStatus` via `import type { BusinessLifecycleStatus } from "../evaluator/types"`.

Checked precedent: `ordinaryPermissionCatalogue.ts` (pre-existing, `ENG-P2-004-CORR-001`) uses the **identical** import — `import type { BusinessLifecycleStatus } from "../evaluator/types"`. This is not a new pattern introduced by CORR-003.

Checked for circularity: `evaluator/types.ts` imports only from `../models/permissionId`, `../models/role`, `../models/permissionOverride` (all `import type`) and `../../../shared/errors/errorCategories`. It does **not** import `sensitivePermissionCatalogue.ts` or `ordinaryPermissionCatalogue.ts` back. No cycle exists.

Both catalogue-side imports are `import type` only — erased entirely at compile time by TypeScript, so there is no runtime circular-import or initialization-order risk regardless of the layering question.

**Result: no defect. No fix applied.** The dependency is safe and consistent with the codebase's own existing precedent; moving `BusinessLifecycleStatus` to a different layer was correctly judged unnecessary and was not done.

## 4. Catalogue contract (Phase D)

`SensitivePermissionCatalogueEntry` gained exactly one new field: `readonly eligibleBusinessStatuses?: readonly BusinessLifecycleStatus[]`.

Of the catalogue's 8 entries, only `staff.manage` sets it, to exactly `["draft", "pending_verification", "trial", "active"]`. Verified by reading the full catalogue array in `sensitivePermissionCatalogue.ts` and independently by the existing `it.each` test loop over the other 7 ids in `sensitivePermissionCatalogue.test.ts`, which asserts `eligibleBusinessStatuses` is `undefined` for every one of them.

## 5. Legacy fallback (Phase E) and staff.manage matrix (Phase F)

`evaluatePermission.ts`'s Sensitive branch:

```ts
const sensitiveEntry = getSensitivePermissionEntry(request.permission);
const eligibleSensitiveStatuses: ReadonlySet<string> = sensitiveEntry.eligibleBusinessStatuses
  ? new Set(sensitiveEntry.eligibleBusinessStatuses)
  : LEGACY_OPERATIONAL_SENSITIVE_STATUSES;
if (!eligibleSensitiveStatuses.has(business.business.status)) {
  return deny(now, "BUSINESS_NOT_ACTIVE", "BUSINESS_INACTIVE");
}
```

`LEGACY_OPERATIONAL_SENSITIVE_STATUSES` is the renamed, behavior-identical former `OPERATIONAL_BUSINESS_STATUSES = {trial, active}`.

Executable matrix evidence re-run (not accepted on the `??`-fallback claim alone): `evaluatePermission.corr003.test.ts`'s Phase G suite exercises all 8 non-`staff.manage` Sensitive ids across all 8 Business statuses (deny on draft/pending_verification/suspended/expired/closed/archived, allow-via-`OWNER_FLOOR` on trial/active) — 8 × 8 = 64 assertions, all passing. Phase H exercises `staff.manage` itself across all 8 statuses (eligible: draft/pending_verification/trial/active; ineligible: suspended/expired/closed/archived).

## 6–9. Owner, Manager, Staff (Phases G/H/I)

- **Owner**: `evaluatePermission.ts` line ~279, `if (role === "owner" && isSensitivePermission(permission))` returns `OWNER_FLOOR` — unchanged code path, evaluated after the lifecycle gate. Re-run: Owner + active membership + `staff.manage` allows in all 4 newly-eligible statuses via `OWNER_FLOOR`/`owner-floor` (Phase I test suite).
- **Manager**: without an explicit grant, denied in all 4 newly-eligible statuses (no role default exists for `staff.manage`). With a valid persisted grant override, allowed via `EXPLICIT_GRANT` in all 4 statuses. `staff.assignPermissions` (the permission that would let anyone grant `staff.manage`) is unchanged/untouched in this diff — confirmed no ordinary pre-operational grant path was added. This is the accepted Founder consequence, not a defect.
- **Staff**: no role default/template exists for `staff.manage` (only rows 7–8, `customer.viewProtectedProfile`/`report.exportFinancial`, are inheritable). A fabricated grant override on a Staff membership is still denied — `evaluatePermission.ts` line ~379 revalidates `entry.explicitGrantEligibleRole === role` ("manager" for `staff.manage`), so a Staff-held grant record does not reach an allow. Verified in both draft and pending_verification.

## 10. Other Sensitive permissions (Phase J)

`evaluatePermission.corr003.test.ts`'s Phase O suite directly tests all 8 non-scope Sensitive ids (`staff.assignPermissions`, `staff.assignRole`, `business.transferOwnership`, `business.configureFraudRules`, `transaction.reverse`, `reward.override`, `customer.viewProtectedProfile`, `report.exportFinancial`) in both `draft` and `pending_verification` — 16 assertions, all deny `BUSINESS_INACTIVE`. No sampling.

## 11. Command integration (Phase K)

`staffInvitation.corr003.emulator.test.ts` — real Firestore Emulator round trip (not mocked): bootstraps a real `draft` Business, Owner calls the real `createStaffInvitation` command, asserts the invitation persists, the Business record remains `draft`, and the mandatory Sensitive-permission audit event is recorded via the outbox. Re-run against a live `firebase emulators:exec` (`auth`+`firestore`) session as part of the full emulator suite — passing.

## 12–13. Suspend/remove, target/self/Owner protection (Phases L/M)

No action-specific lifecycle gate was added — `staff.manage` governs invite/suspend/remove uniformly through the single evaluator branch above; `staffMembershipLifecycleCommand.ts` was confirmed unchanged (zero diff). Existing target/self/Owner-protection tests (`staffMembershipTargetPolicy.test.ts`, `staffMembershipIntegration.emulator.test.ts` scenarios 9–11) all pass unchanged in the full suite run (below) — no diff touches those files.

## 14. Audit (Phase N)

`staff.manage` remains classified Sensitive (still present in `SENSITIVE_PERMISSION_CATALOGUE`, `auditRequirement: "mandatory"`, unchanged). The evaluator still returns through the same decision object the mandatory sensitive-audit integration already consumes — no second audit mechanism was introduced (`permissionAuditService.ts`, `permissionAuditEventFactory.ts` both confirmed unchanged in the diff).

## 15. Ordinary permission non-regression (Phase O)

`ordinaryPermissionCatalogue.ts` has a **zero-line diff** against `origin/main` (`git diff 289b190..26a1e87` produces no output for this file) — confirmed no changed ordinary-permission lifecycle entry, no override leakage.

## 16. Test-quality review (Phase P)

Reviewed `evaluatePermission.corr003.test.ts` and `staffInvitation.corr003.emulator.test.ts` line by line:

- Parameterized `it.each` loops genuinely iterate every id/status combination named in the phase docstring — no loop body short-circuits before its assertion.
- The Manager-grant test constructs a real applicable `PermissionOverride` (`permissionId: "staff.manage"`, `direction: "grant"`, matching `businessId`/`membershipId`) that the evaluator's own override-matching filter (`applicableOverrides`) would accept — not a fixture the evaluator ignores.
- The Staff fabricated-grant test uses the same real override shape on a Staff membership, and genuinely reaches the evaluator's `entry.explicitGrantEligibleRole === role` revalidation (line ~379) before being denied — it does not fail earlier for an unrelated reason (verified by reading the evaluator's control flow, not just the test's expectation).
- The emulator integration test asserts persisted Firestore state (`getInvitationByReference`, a fresh `getKnowledgeNodeById`-style repository read) and the Business record's own `status` field, not merely the command's return value.

**No test weakness found; no fix was required.**

## 17. Existing-test adjustment review (Phase Q)

Two pre-existing tests were changed from `staff.manage` to `business.configureFraudRules` as their generic "a sensitive permission" example:

- `evaluatePermission.test.ts` — "sensitive permission + draft → still denies BUSINESS_INACTIVE" (non-regression case).
- `ordinaryPermissionCorrection.emulator.test.ts` — CORR-001's sensitive-permission-through-`authorizeAndExecute` non-regression case.

Diffed both via `git diff 289b190..26a1e87` on the exact test files: both changes swap only the permission id and add an inline comment explaining why (`staff.manage` is no longer a valid example of "the general Sensitive gate is unchanged" now that it has its own override). The assertions themselves (`allowed === false`, `errorCategory === "BUSINESS_INACTIVE"`) are unchanged. **Original test intent preserved — no regression expectation was weakened to make the suite green.**

## 18–19. Findings

No F1–F4 finding was identified during this independent pass. Specifically:

- Phase C (module dependency): no issue, precedent-consistent, type-only.
- Phase P (test quality): no weak test found.
- Phase Q (existing-test adjustments): both preserve original intent.
- Phase R (scope audit): diff contains exactly the 9 files listed below — no frontend, no Rules, no deployment config, no Staff command semantic change, no new permission id, no new grant mechanism, no `ENG-P3-002C` change, no PR #156 change.

**No fix commits were required. The reviewed head (`26a1e8739c2cf21f87f6a98f77af69254c1fa3f4`) is the exact head that was merged.**

## 20. Full validation (Phase T)

All re-run fresh in this clean worktree after a fresh `pnpm install --frozen-lockfile`:

| Check | Result |
|---|---|
| `pnpm run typecheck` (`functions` + `apps/web`) | Clean |
| `pnpm run build` (`functions` + `apps/web`) | Clean |
| `pnpm run lint` | 0 errors, 1 pre-existing unrelated warning (`apps/web/src/business/BusinessApiContext.tsx`, not touched by this PR) |
| `pnpm run format:check` | Clean |
| `functions` unit suite (`pnpm --filter functions test`) | **1563/1563 passed** (143 files) |
| `functions` emulator suite (`pnpm run emulators:validate`, real `firebase emulators:exec` with `auth`+`firestore`) | **682/682 passed, 2 skipped** (51 files) |
| `apps/web` unit suite | **475/475 passed** (73 files) |
| Secret scan | No dedicated script exists in this repo (`package.json` checked); none run |

The 2 skipped emulator tests are in `businessTermsConfigRepository.emulator.test.ts` / `acceptBusinessTermsCommand.emulator.test.ts` — pre-existing, unrelated `business/terms` domain, not touched by this PR.

All numbers independently reproduced the prior implementation report's own figures exactly.

CI on the exact reviewed head (`26a1e873`) was independently re-confirmed **PASS** (run `32577981692`, 6m1s) before merge.

## 21. Files modified by PR #157

```
docs/05-implementation/change-tracking/engineering-implementation-programme.md
docs/05-implementation/reports/ENG-P2-004-CORR-003-staff-manage-pre-operational-lifecycle-eligibility-implementation-report-2026-08-22.md
functions/src/domains/permissions/evaluator/evaluatePermission.corr003.test.ts   (new)
functions/src/domains/permissions/evaluator/evaluatePermission.test.ts
functions/src/domains/permissions/evaluator/evaluatePermission.ts
functions/src/domains/permissions/models/sensitivePermissionCatalogue.test.ts
functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts
functions/src/domains/permissions/service/ordinaryPermissionCorrection.emulator.test.ts
functions/src/domains/permissions/service/staffInvitation.corr003.emulator.test.ts   (new)
```

No files were changed by this independent review pass itself, beyond this report and the minimal closure-sync entry in the engineering-implementation-programme tracker (Phase V).

## 22. Code diff summary

- `sensitivePermissionCatalogue.ts`: +1 optional field on the entry type; `staff.manage`'s entry populated with the Founder-approved 4-status list; the other 7 entries unchanged.
- `evaluatePermission.ts`: `OPERATIONAL_BUSINESS_STATUSES` renamed to `LEGACY_OPERATIONAL_SENSITIVE_STATUSES` (behavior-identical); the Sensitive-permission lifecycle-gate branch now reads a per-entry override when present, else falls back to the same legacy set. No `permission === "staff.manage"` special case — policy lives entirely in catalogue configuration.
- Test files: new dedicated `evaluatePermission.corr003.test.ts` and `staffInvitation.corr003.emulator.test.ts`; targeted additions to `sensitivePermissionCatalogue.test.ts`; two pre-existing tests swapped their example permission id (reviewed above, Phase Q).

## 23. Commands executed (representative)

`gh pr view 157`, `gh pr checks 157`, `gh pr diff 157`, `git fetch`, `git diff 289b190..26a1e87 --stat`/`--name-only`, `pnpm install --frozen-lockfile`, `pnpm run typecheck`, `pnpm run build`, `pnpm run lint`, `pnpm run format:check`, `pnpm --filter functions test`, `pnpm --filter web test`, `pnpm run emulators:validate` (via `firebase emulators:exec --project demo-11thonus`), `gh pr ready 157`, `gh pr merge 157 --merge`, `git fetch origin main`, `git merge-base --is-ancestor …`, `gh run list` / `gh run watch` on `origin/main`'s post-merge CI run.

## 24–25. Dependencies/config, Firebase/Rules/deployment changes

None. `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `package.json` (any package), and `pnpm-lock.yaml` are all untouched by this PR's diff.

## 26–28. Merge

- **Merge SHA:** `5285e053e50e1112b5d04443a991ed5951ff2d8b` (standard merge commit, consistent with this repo's recent merge history — `git log --merges` shows exclusively "Merge pull request #N" commits, no squash/rebase convention).
- **Post-merge origin/main:** `git fetch origin main` confirms `origin/main` moved `289b190..5285e05`; `git merge-base --is-ancestor 5285e053e50e1112b5d04443a991ed5951ff2d8b origin/main` and the same check for the reviewed head `26a1e8739c2cf21f87f6a98f77af69254c1fa3f4` both succeed.
- **Post-merge CI on main:** triggered automatically on the merge commit (run `32579724738`); see the closure-sync tracker entry for the confirmed result at the time of this report's finalization.

## 29–33. Status

- **`ENG-P2-004-CORR-003`** = Complete / merged.
- **`ENG-P2-004`** = Complete / corrected.
- **PR #156 (`ENG-P3-002C`)** = Open, untouched by this task — reconciliation pending (no code change required to invite Staff pre-operationally now that CORR-003 is merged; PR #156 should update any of its own fixtures/assertions that still assume `staff.manage` is denied in `draft`/`pending_verification`, if any exist).
- **`ENG-P3-002`** = Open — blocked on: PR #156 reconciliation; hosted-preview/Founder QA; `DEC-LEGAL-002`.
- **Capability 3** = Open — partially implemented; not closed.

## 34. Primary worktree status

`/Users/theo/11THONUS` was never entered or modified by this task.

## 35. Risks

- `staff.manage` is now eligible pre-operationally (`draft`/`pending_verification`), which is an intentional, narrowly-scoped widening of a Sensitive permission's lifecycle — Founder-approved and fully test-covered, but worth flagging as the one production-behavior change this correction makes.
- Manager access to `staff.manage` pre-operationally still requires a pre-existing explicit grant; there is no ordinary product path to create that grant during onboarding (since `staff.assignPermissions` was correctly left untouched) — this is the accepted Founder consequence recorded in Phase H of the implementation report, not a defect, but downstream product/UX work (e.g. PR #156) should not assume Managers can self-serve this.
- PR #156 has not been reconciled against this merge; until it is, its own test fixtures may still assert the pre-correction denial behavior for `staff.manage` in `draft`/`pending_verification`.

## 36. Rollback

A revert of merge commit `5285e053e50e1112b5d04443a991ed5951ff2d8b` on `main` cleanly restores `LEGACY`/`OPERATIONAL_BUSINESS_STATUSES` behavior for `staff.manage` (global `{trial, active}` gate) with no other production-code dependency on the new field, since `eligibleBusinessStatuses` is optional and only `staff.manage` used it.

## 37. Persistent report path

`docs/05-implementation/reports/ENG-P2-004-CORR-003-independent-review-merge-closure-report-2026-08-22.md` (this file).

## 38. Changes-tracking state

`docs/05-implementation/change-tracking/engineering-implementation-programme.md`'s `Last controlled update` header updated with a new, minimal closure entry (this task) ahead of the prior implementation entry (now folded into the `Previously:` chain) — no other tracker files created or touched.

## 39. Exact next Founder action

Reconcile PR #156 (`ENG-P3-002C`) against the now-merged `staff.manage` pre-operational eligibility: confirm its own fixtures/tests do not still assume the pre-correction denial in `draft`/`pending_verification`, then proceed with `ENG-P3-002C`'s own integration/hosted-preview/Founder-QA closure path (unaffected by, and not authorized by, this task).

---

## Final Gate

**ENG-P2-004-CORR-003 MERGED AND CLOSED — PR #156 RECONCILIATION REQUIRED**
