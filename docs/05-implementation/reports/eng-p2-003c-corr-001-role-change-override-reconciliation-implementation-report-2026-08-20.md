# ENG-P2-003C-CORR-001 — Role-Change PermissionOverride Reconciliation

Implementation report — 2026-08-20

## 1. Entry origin/main SHA

`origin/main` @ `4654cf2` — confirmed unchanged from the ENG-P2-003E entry state (`git fetch origin` + `git rev-parse origin/main`).

## 2. PR #138 state verification

Confirmed via `gh pr view 138`: `state: OPEN`, `isDraft: true`, `headRefName: feat/eng-p2-003e-staff-integration-validation`, `mergeable: MERGEABLE`. Not touched by this task.

## 3. Reproduced stale-reactivation evidence

Confirmed directly against PR #138's committed head (`bf0a8c3`) that `staffMembershipIntegration.emulator.test.ts`'s Phase H test still asserts `afterPromote.allowed === true` after the Manager→Staff→Manager round-trip — the finding this correction addresses is genuinely present in the reviewed evidence, not assumed. This correction then independently re-derived and re-proved the same behavior from a clean worktree (`origin/main`, no dependency on PR #138's code) in its own new test (§19).

## 4. Root cause

`staffRoleChangeCommand.ts` wrote only the `role` field on every role change; `permissions[]` was never touched. `evaluatePermission.ts`'s live-role re-check is itself correct (Step 7 must always consult the *current* role) — the defect was that `permissions[]` was allowed to drift from the membership's true current authorization state across a role mutation, so a stale, role-ineligible record could sit inert and become effective again by coincidence on a later role change back, with no fresh authorization action ever occurring.

## 5. Pre-change strategy

Fix the write boundary that owns `permissions[]`'s currency (`ENG-P2-003C`'s role-change command), not the evaluator's live-role semantics (which are already correct and must stay that way for the *retained* case too). Reuse `ENG-P2-004A`'s `createPermissionOverride` — already the authoritative "is this override structurally valid for this target role" constructor — as the sole validity check, so no new validity rule is invented anywhere.

## 6. Reconciliation algorithm

For each stored override, re-run it through `createPermissionOverride({..., targetRole: newRole})` (`staffRoleChangeOverrideReconciliation.ts`). No throw → structurally valid for the new role → retain. Throw → invalid → remove. Applied in the same Firestore transaction as the role mutation, committed as a single `.update()` (role + reconciled `permissions[]` + `updatedAt` together — Firestore rejects a second `.update()` on the same document within one transaction).

## 7. Grant treatment

A grant is role-scoped (`explicitGrantEligibleRole` names exactly one role). Since role change always flips between the only two governed roles (`manager`/`staff`), **every sensitive grant is removed by every role change** — there is no case where a grant survives a Staff↔Manager transition under the current catalogue. Proven both directions (§10/§12).

## 8. Revoke treatment

A revoke has no role dependency anywhere in the existing contract — `createPermissionOverride`'s revoke branch checks only the static catalogue flag `explicitRevocationSupported`, and `evaluatePermission.ts` Step 6 honors a revoke before any role check runs. This falls out of reusing `createPermissionOverride` unmodified; no special-casing was added. Empirically proven retained across both Manager→Staff→Manager and Staff→Manager (§13).

## 9. Manager→Staff result

Proven (`staffRoleChangeOverrideReconciliation.emulator.test.ts`, mandatory round-trip test): Manager-eligible grant → evaluator allows → demote to Staff → grant removed from `permissions[]` (length 0) in the same transaction → evaluator denies.

## 10. Staff→Manager result

Proven in both directions: (a) the mandatory round-trip test's second half — promoting the same membership back to Manager does not resurrect the removed grant; (b) the new symmetric test (§13 of the review, added after independent review flagged the gap) — a Staff-eligible grant (`customer.viewProtectedProfile`) is likewise removed on a Staff→Manager promotion, proving the removal logic isn't demotion-specific.

## 11. Round-trip no-reactivation proof

The mandatory test's core assertion: after Manager→Staff→Manager, `evaluatePermission` still denies (`allowed === false`) and `permissions[]` is empty — the exact scenario PR #138 proved was broken is now proven fixed, from a clean worktree independent of PR #138's own code.

## 12. Fresh-regrant proof

Same test, final step: after the round-trip, an Owner explicitly re-grants the permission through the normal, unmodified `ENG-P2-003D` `administerStaffPermissionOverrideCommand` path → evaluator allows again, `permissionSource: "explicit-grant"`. Fresh authorization restores authority; nothing else does.

## 13. Valid-override retention result

Proven: a revoke override survives Manager→Staff→Manager (§8) and Staff→Manager (§10's symmetric test uses a grant that's correctly removed; the dedicated retention test uses a revoke that's correctly kept). No fabricated permission was needed — `staff.manage`/`staff.assignPermissions`'s existing `explicitRevocationSupported: true` catalogue entries were sufficient.

## 14. Atomicity/TOCTOU

Role + reconciled `permissions[]` + `updatedAt` commit as one `.update()` call inside `authorizeAndExecute`'s existing transaction. The raw-overrides read happens in `prepare` (Firestore's read phase); the combined write happens in `apply` (write phase, which receives only a `TransactionWriter` — no `.get()` available), respecting the existing reads-before-writes contract unmodified. A Firestore transaction retry re-runs `prepare` from a fresh read, so no reconciliation ever computes against stale data. Verified by independent review reading the actual call site, not solely the test suite.

## 15. Concurrency

Six real Firestore-emulator concurrency scenarios (demotion vs grant, demotion vs revoke, promotion vs grant, two simultaneous role changes, role change vs suspension, role change vs removal): no stale privilege resurrection, no lost override administration when the competing command fulfills, no malformed/duplicate `permissions[]` records, and — specifically — no state observed where `role === "staff"` coexists with a Manager-only grant still present.

## 16. Audit/history treatment

The existing `StaffRoleChanged` outbox event gained one additive, optional field: `overridesRemoved?: readonly string[]` — permission ids only, no `grantedBy`/timestamp attribution, omitted entirely (not `[]`) when nothing was removed so the common-case payload shape is unchanged for existing consumers. No second/parallel audit or event system introduced. `ENG-P2-004`'s sensitive-decision audit path (`permissionAuditService.ts`) is untouched.

## 17. Evaluator-change result

Zero changes. Confirmed by `git diff` against `origin/main`: `evaluatePermission.ts`, `sensitivePermissionCatalogue.ts`, `ordinaryPermissionCatalogue.ts`, `permissionOverride.ts`, and role templates all have empty diffs. Independently re-confirmed by review.

## 18. 003D regression

`staffPermissionOverrideCommand.ts` and its 40 existing tests unmodified in production logic; only one of its own emulator tests was updated (§41) because its final assertion described the old, now-corrected stale-record behavior. A fresh eligible grant remains possible through normal 003D administration after reconciliation removes a stale one (§12 proves this explicitly). No hidden role-change-specific override administration was created — reconciliation only ever *removes*, never grants or revokes on 003D's behalf.

## 19. RED→GREEN evidence

The pure reconciliation function (`staffRoleChangeOverrideReconciliation.ts`) was proven with a genuine RED check: the retain/remove branches were temporarily inverted, confirming 6 of 7 unit tests failed as expected, then restored to the correct implementation (7/7 green). The command-level integration is proven empirically (not RED/GREEN in the classic sense, since the underlying bug already existed and was being fixed directly) — the mandatory round-trip test asserts the corrected behavior and passes against the real emulator.

## 20. Tests added

- `staffRoleChangeOverrideReconciliation.test.ts` (new, 7 unit tests, pure function, RED→GREEN verified).
- `staffRoleChangeOverrideReconciliation.emulator.test.ts` (new, 13 emulator tests: mandatory round-trip, revoke treatment, valid-override retention both directions, transaction-failure isolation, Owner protection, cross-business target, 6 concurrency scenarios).
- `staffRoleChangeCommand.emulator.test.ts` (1 existing test updated to assert corrected behavior).
- `staffPermissionOverrideCommand.emulator.test.ts` (1 existing test updated to assert corrected behavior).

## 21. Full validation

- New reconciliation unit tests: 7/7 (independently RED-verified).
- New correction emulator suite: 13/13 (verified against the real Firestore emulator).
- Full functions unit suite: 1247/1247.
- Full functions emulator suite: 532/532 (39 files).
- Full web unit suite: 397/397 (untouched, confirms no unintended cross-boundary effect).
- Typecheck (`tsc --noEmit`): clean.
- Lint (`eslint`): clean.
- Format (`prettier --check`): clean.
- Build (`pnpm -r run build`): clean, both `functions` and `apps/web`.
- Secret scan of the diff: clean.

## 22. Files modified

- `functions/src/domains/permissions/models/staffRoleChangeOverrideReconciliation.ts` (new)
- `functions/src/domains/permissions/models/staffRoleChangeOverrideReconciliation.test.ts` (new)
- `functions/src/domains/permissions/service/staffRoleChangeOverrideReconciliation.emulator.test.ts` (new)
- `functions/src/domains/permissions/service/staffRoleChangeCommand.ts` (modified)
- `functions/src/domains/permissions/repositories/businessMembershipWriteRepository.ts` (modified)
- `functions/src/domains/permissions/events/staffMembershipLifecycleEvents.ts` (modified)
- `functions/src/domains/permissions/service/staffRoleChangeCommand.emulator.test.ts` (modified)
- `functions/src/domains/permissions/service/staffPermissionOverrideCommand.emulator.test.ts` (modified)
- This report and the programme tracking file.

## 23. Code diff summary

+1057/-29 across 8 source/test files (final commit, post-review-fix). Zero lines changed in the evaluator, catalogues, or `permissionOverride.ts`.

## 24. Dependencies/config changes

None.

## 25. Firebase/Rules/deployment changes

None. No Firebase deployment performed under this authorization; Rules untouched.

## 26. Review findings/dispositions

Independent security-focused review (`pr-review-toolkit:code-reviewer`) found 3 issues, 2 fixed, 1 informational:

1. **Wrong error constructor on the malformed-target read branch** — `overrideAdminMalformedExistingOverrideStateError()` (a different condition's message) was used instead of `targetMembershipConfigMalformedError()`, the constructor `staffPermissionOverrideCommand.ts` already uses for the identical read shape. **Fixed.** Disclosed side effect: this branch's error *category* also changed from `RESOURCE_NOT_FOUND` (when malformed was previously bucketed with not-found) to `AUTH_FORBIDDEN` (matching the design's own documented distinction and 003D's sibling command) — a rare, non-user-triggerable edge case (corrupted stored data), not a new architecture decision, but disclosed here rather than silently absorbed.
2. **Dead code with an inverted-invariant docblock** — the old role-only `writeMembershipRoleChange` had zero remaining callers after this correction, and its comment asserted the exact "role change must not rewrite permissions[]" claim this correction reverses — a footgun for a future caller reaching for the obvious-looking function. **Fixed**: removed; the combined function is now the only role-change write path.
3. **Coverage gap** — no test proved the symmetric promotion-direction removal (a Staff-eligible grant removed on Staff→Manager, not only a Manager-eligible grant removed on Manager→Staff). Logic was already correct (verified by reading `createPermissionOverride` directly), but unasserted. **Fixed**: added.

Independent review confirmed CLEAN on all 9 priority areas requested (stale-grant removal, no-resurrection, no blanket deletion, revoke treatment, atomicity, 003D concurrency, zero evaluator/catalogue changes, privacy-minimal additive event, general regression) — including specifically verifying the reconciliation call site passes `request.toRole` (the NEW role), not the old role, ruling out a silent inversion.

## 27. Remaining material findings

None outstanding. Two minor, pre-existing, unrelated observations noted by review (not fixed, out of this correction's scope): `grantedAt` Timestamp→Date→Timestamp round-tripping truncates sub-millisecond precision (pre-existing 003D behavior, unrelated to this correction); reconciliation does not deduplicate a pre-existing duplicate-permissionId array if one somehow existed (not a state reachable through any governed command).

## 28. Correction PR number

[#139](https://github.com/Fkenogo/11THONUS/pull/139), opened as **draft** against `main` from `fix/eng-p2-003c-corr-001-role-change-override-reconciliation`. Left in draft, unmerged.

## 29. Final reviewed head

`94a1c72` on `fix/eng-p2-003c-corr-001-role-change-override-reconciliation`, pushed and matching PR #139's head at CI-run time.

## 30. CI result

**PASS.** Hosted CI run [`32365867570`](https://github.com/Fkenogo/11THONUS/actions/runs/32365867570) ("Build, Lint, Test, Emulator Validation") on the pushed head, **4m48s**, confirmed via `gh pr checks 139` polled to completion.

## 31. ENG-P2-003C-CORR-001 status

**Implemented, pending Founder review.**

## 32. ENG-P2-003E/PR #138 status

Unchanged by this task. PR #138 remains OPEN/DRAFT/UNMERGED. ENG-P2-003E's integration-validation status is unchanged; its Phase H finding is what this correction resolves at the production-code level, but PR #138 itself was neither modified nor merged.

## 33. ENG-P2-003 concern status

**Not complete.** This correction resolves the specific blocker ENG-P2-003E identified, but concern-level closure still requires: (a) Founder review/merge of this correction, (b) Founder review/merge of PR #138 (or its re-validation against the corrected behavior), and (c) a final concern-closure determination — none of which this task performs.

## 34. Capability 3 status

**Open — partially implemented; not closed.** Unchanged.

## 35. Dirty primary worktree

None. `/Users/theo/11THONUS` was never touched; all work occurred in `/Users/theo/11THONUS-eng-p2-003c-corr-001`.

## 36. Risks

Minimal — this is a narrowly-scoped, TDD-verified, additive-event correction with zero evaluator/catalogue changes and a passing full regression. The one behavior change beyond the core fix (the malformed-target error category, §26 item 1) is disclosed rather than silent. The correction does not itself resolve PR #138's overall closure status — that remains a separate Founder action.

## 37. Rollback

Trivial — unmerged branch (`fix/eng-p2-003c-corr-001-role-change-override-reconciliation`), no production deployment. Reverting is simply not merging.

## 38. Persistent report path

`docs/05-implementation/reports/eng-p2-003c-corr-001-role-change-override-reconciliation-implementation-report-2026-08-20.md` (this file).

## 39. Changes-tracking state

Programme tracking updated with dated supersession (see the engineering-implementation-programme.md entry) recording:
`ENG-P2-003C = Complete, correction pending`; `ENG-P2-003C-CORR-001 = Implemented / pending Founder review`; `ENG-P2-003D = Complete`; `ENG-P2-003E = Integration validation performed / closure blocked by CORR-001 until resolved`; `ENG-P2-003 concern = Not complete`; `Capability 3 = Open — partially implemented; not closed`.

## 40. Exact next Founder action

Review this correction's PR (§28, to be filled once opened) and PR #138 together: confirm the reconciliation policy (grant removed on any role change, revoke always retained) matches intent, then decide whether to merge this correction, and separately whether/how PR #138's ENG-P2-003E integration suite should be updated to reflect the now-corrected Phase H behavior (its existing assertion of automatic reactivation will need re-validation once this correction lands, since the underlying behavior it documented has changed).

---

## FINAL GATE

**ENG-P2-003C-CORR-001 READY FOR FOUNDER REVIEW/MERGE — ENG-P2-003E REMAINS OPEN**
