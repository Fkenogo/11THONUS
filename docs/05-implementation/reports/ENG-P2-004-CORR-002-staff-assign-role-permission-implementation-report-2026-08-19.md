> **Title:** ENG-P2-004-CORR-002 — Add `staff.assignRole` Sensitive Permission (Implementation Report)
> **Status:** Implemented / pending Founder review
> **Classification:** Working (implementation report)
> **Authorization:** Bounded Founder correction task, ENG-P2-004-owned only — does not authorize `ENG-P2-003C`, any staff-lifecycle or role-change command, membership suspend/reactivate/remove, invitation changes, `PermissionOverride` administration, frontend/UI, Firebase deployment, Rules changes, shared-device functionality, subscription enforcement, or ownership-transfer functionality.

## 1. Entry `origin/main` SHA

`123a60ed4eaa01370883850acb1505d811359594` — verified via `git fetch origin && git rev-parse origin/main`, matching the Founder-stated expected baseline exactly.

## 2. Worktree / branch

Fresh linked worktree created from `origin/main` via `EnterWorktree` (branches from `origin/<default-branch>` by default), then renamed to `feat/eng-p2-004-corr-002-staff-assign-role`. Path: `/Users/theo/11THONUS/.claude/worktrees/eng-p2-004-corr-002`. `/Users/theo/11THONUS` (primary checkout) left untouched.

## 3. Prerequisite verification

- `ENG-P2-003A` (PR #132) — **MERGED**.
- `ENG-P2-003B` (PR #133) — **MERGED**; post-merge CI (`Build, Lint, Test, Emulator Validation`) — **PASS** (`gh pr checks 133`).
- `ENG-P2-003C` — no branch, PR, or commit exists anywhere in the repository (`git branch -a`, `gh pr list --state all`) — **not started**, confirmed.
- `ENG-P2-004-CORR-002` — no prior branch/PR for this task or for `assignRole`/`CORR-002` exists — **not previously started**.
- Open PRs — only `#34` (unrelated docs sync) was open; no overlapping permission-catalogue work.

## 4. Codebase analysis (Phase B)

Inspected directly: `ENG-P2-003-DESIGN-001` v1.1, `ENG-P2-004-DESIGN-001`, `ENG-P2-004-CORR-001` report, `sensitivePermissionCatalogue.ts`(+test), `permissionId.ts`, `roleTemplate.ts`(+test), `permissionOverride.ts`(+test), `evaluatePermission.ts`(+test), `evaluatePermissionService.emulator.test.ts`, `permissionAuditService.ts`, `authorizeAndExecute.ts`.

1. **Owning contract.** `sensitivePermissionCatalogue.ts` (`ENG-P2-004A`) is the single closed catalogue of sensitive permissions and the sole place a new sensitive-permission identifier is minted. This correction adds exactly one entry there.
2. **Catalogue-only vs. evaluator change.** The evaluator (`evaluatePermission.ts`) never special-cases a permission id — it dispatches purely off catalogue-derived facts (`isSensitivePermission`, catalogue entry flags, `SENSITIVE_PERMISSION_ROLE_TEMPLATES`). Adding a catalogue row with the correct flags requires **zero evaluator changes**.
3. **How Owner-only/non-delegable is represented today.** The catalogue already has exactly this shape at row 3, `business.transferOwnership`: `inheritAllowed: false`, `explicitGrantRequired: false`, `explicitGrantEligibleRole: null`, `explicitRevocationSupported: false`. No override (grant or revoke) can ever be constructed for such an entry (`permissionOverride.ts`'s `createPermissionOverride` throws `permissionOverrideDirectionNotSupportedError` for both directions when `explicitGrantRequired`/`explicitRevocationSupported` are `false`), and no role template can ever include it (`roleTemplate.ts`'s `createRoleTemplate` throws when `inheritAllowed` is `false`). Only the Owner floor (`evaluatePermission.ts` step 5, `role === "owner" && isSensitivePermission(permission)`) can ever allow it.
4. **Evaluator already supports the required behavior without modification** — confirmed by inspection and then by the RED→GREEN tests below.
5. **Tests proving Manager/Staff authority cannot widen**: unit tests on all four contract layers (catalogue, role template, override, evaluator) plus a real-Firestore emulator proof — see §20–22.

**Conclusion reached before writing any production code:** a catalogue-only correction, modeled identically to `business.transferOwnership` (row 3), satisfies the Founder policy exactly. No evaluator, role-template, or override-contract code changes were required or made.

## 5. Pre-change strategy

Add one entry to `SENSITIVE_PERMISSION_CATALOGUE`, positioned after `staff.assignPermissions` and before `business.transferOwnership` (keeping the `staff.*` domain grouped), with the `business.transferOwnership` row-3 flag shape. Write failing tests first (genuine RED) at every layer the entry touches, then add the entry (GREEN), per `test-driven-development`.

## 6. Exact new permission entry

```ts
{
  id: "staff.assignRole",
  meaning: "Change a Business membership role between Staff and Manager",
  owningDomain: "Business membership",
  defaultState: "owner_only",
  inheritAllowed: false,
  explicitGrantRequired: false,
  explicitGrantEligibleRole: null,
  explicitRevocationSupported: false,
  auditRequirement: "mandatory",
  rationale: ["a"],
}
```

No other permission identifier was added, renamed, or removed.

## 7. Meaning

"Change a Business membership role between Staff and Manager" — verbatim from the Founder-authoritative MVP policy in this task's brief.

## 8. Catalogue flags and rationale

| Flag | Value | Rationale |
|---|---|---|
| `defaultState` | `owner_only` | Founder policy: Owner-only. |
| `inheritAllowed` | `false` | Founder policy: non-delegable — no role template, including Owner's, may ever carry it (Owner's access is structural, via the floor, not inheritance). |
| `explicitGrantRequired` | `false` | Founder policy: "Manager has no role-change authority at MVP"; there is no grant-eligible role to name, so `true` would falsely imply a Manager grant path exists (same reasoning the catalogue's own comment gives for `business.transferOwnership`). |
| `explicitGrantEligibleRole` | `null` | No role is grant-eligible — consistent with `explicitGrantRequired: false`. |
| `explicitRevocationSupported` | `false` | Nothing can be explicitly granted, so there is nothing to explicitly revoke — see §14. |
| `rationale` | `["a"]` | Design §3.1(a): "can change who has authority over a business" — a role change between Staff and Manager is exactly this. |

This is the identical flag shape `business.transferOwnership` (row 3) already uses — not copied blindly, but because independent analysis of the Founder policy (Owner-only, no grant path at all, non-delegable) converges on the same shape for the same structural reason: both permissions have **no** non-Owner grant path, as distinct from rows 1/2/4/5/6 (Manager-eligible-grant) or 7/8 (Owner+Manager-default, Staff-eligible-grant).

## 9. Owner-floor result

**PASS.** `evaluatePermission.ts` step 5 (`role === "owner" && isSensitivePermission(permission) → allow, owner-floor`) applies unconditionally to any catalogue member, including the new entry, with no code change. Proven directly: unit test (`evaluatePermission.test.ts`, "ENG-P2-004-CORR-002: Owner is allowed staff.assignRole via the owner floor") and real-Firestore emulator test (`evaluatePermissionService.emulator.test.ts`).

## 10. Manager non-delegability

**PASS**, proven through every acquisition path:
- **Role default** — `SENSITIVE_PERMISSION_ROLE_TEMPLATES` is derived exclusively from `getInheritableSensitivePermissionEntries()`; `inheritAllowed: false` means it is structurally absent from every role's template, verified by test.
- **Explicit grant** — `createPermissionOverride` throws `permissionOverrideDirectionNotSupportedError` for any grant attempt (`explicitGrantRequired: false`), verified by test.
- **Malformed/fabricated override** — the evaluator revalidates catalogue eligibility independently of `createPermissionOverride` (step 7): a grant-shaped override reaching the evaluator for this entry fails `entry.explicitGrantRequired && entry.explicitGrantEligibleRole === role` (both sides false/`null`) and denies `GRANT_NOT_HONORED`/`AUTH_FORBIDDEN`. Proven with a real persisted Firestore document carrying exactly such a fabricated grant (emulator test).
- **Inherited template** — see role-default above; also directly asserted (`roleTemplate.test.ts`, `createRoleTemplate("manager", ["staff.assignRole"])` throws).

## 11. Staff non-delegability

**PASS** — identical reasoning and identical test coverage to §10, with `role: "staff"` (unit + emulator).

## 12. Role-template result

**PASS.** `SENSITIVE_PERMISSION_ROLE_TEMPLATES` is derived at module-load time from `getInheritableSensitivePermissionEntries()`; since `staff.assignRole.inheritAllowed === false`, it is automatically excluded from Owner's, Manager's, and Staff's templates with no code change to `roleTemplate.ts`. Verified directly (no role's `defaultPermissions` contains `"staff.assignRole"`) and by `createRoleTemplate` construction-time rejection for all three roles.

## 13. Override-contract result

**PASS.**
- Manager grant — rejected (`permissionOverrideDirectionNotSupportedError`).
- Staff grant — rejected (same).
- Owner-target — rejected by the pre-existing general `targetRole === "owner"` invariant, unconditional on the permission id.
- Revoke (any target) — rejected (`explicitRevocationSupported: false`).

All four proven by dedicated unit tests in `permissionOverride.test.ts`.

## 14. Revocation treatment

Not meaningful for an Owner-floor-only permission: nothing can ever be explicitly granted (§6/§8), so there is no granted state an explicit revocation could remove, and the Owner's own floor-level access is structural (§3.6/INV-1), not override-mediated — an Owner-floor permission is never a target of revocation in this architecture (mirroring `business.transferOwnership`'s own precedent exactly). `explicitRevocationSupported: false` represents this correctly; no new revocation model was invented.

## 15. Evaluator-change result

**Zero evaluator changes.** `evaluatePermission.ts` is byte-for-byte unchanged. Classification (`isSensitivePermission`), the lifecycle gate, override resolution, the Owner floor, and fail-closed unknown-permission handling all operate purely off the catalogue entry's own flags — no per-permission-id branching exists anywhere in the evaluator to update.

## 16. Lifecycle-gate result

Unchanged. `staff.assignRole` is sensitive, so it is governed by the existing sensitive-catalogue `{trial, active}` `OPERATIONAL_BUSINESS_STATUSES` gate, identically to every other sensitive permission — no broadening of any Business-status eligibility set, no new gate added or removed.

## 17. Target-policy boundary

Not implemented here, by design. `staff.assignRole` answers only "does this actor have authority to perform role assignment at all" — it carries no knowledge of the request's target membership, current role, or requested role. Self-role-change, Owner-as-target, and Staff↔Manager-only target-shape invariants are explicitly `ENG-P2-003C`'s domain-command responsibility, per this task's Phase K boundary, and were not touched.

## 18. Sensitive-audit result

Structural, not implemented as new code. Because `staff.assignRole` is a member of `SENSITIVE_PERMISSION_CATALOGUE`, any future command that resolves it through `authorizeAndExecute.ts`/`evaluatePermissionService.ts` automatically participates in the existing `ENG-P2-004C` mandatory sensitive-decision audit — the audit path is keyed off catalogue membership (`isSensitivePermission`), not a per-id allow-list, so no `permissionAuditService.ts` change was needed or made. No new domain event and no second audit system were created.

## 19. Error-taxonomy result

No new error category. Permission-denied outcomes continue to use the existing `AUTH_FORBIDDEN`/`SENSITIVE_PERMISSION_NOT_GRANTED`/`GRANT_NOT_HONORED`/etc. reason codes already defined by `ENG-P2-004B`. Malformed catalogue lookups continue to fail closed via the existing `unrecognisedSensitivePermissionError`.

## 20. Genuine RED→GREEN evidence

`sensitivePermissionCatalogue.test.ts` was extended first (adding `staff.assignRole` to `EXPECTED_IDS`, the owner-only/non-inheritable list, and four new dedicated assertions) and run against the **unmodified** catalogue:

```
FAIL × 6 — PermissionDomainError: "staff.assignRole" is not a governed Sensitive Permission
           Catalogue entry. / AssertionError: expected false to be true (isSensitivePermission)
Test Files  1 failed (1)
     Tests  6 failed | 41 passed (47)
```

All 6 failed for the expected reason (entry missing), none errored on a typo. The catalogue entry (§6) was then added — minimal change, no other file touched — and the same suite re-run:

```
Test Files  1 passed (1)
     Tests  48 passed (48)
```

## 21. Tests added

- `sensitivePermissionCatalogue.test.ts` — 9-entry exact set, owner-only/non-inheritable membership, no-grant-path assertions, no-eligible-role assertion, meaning assertion (7 new/modified assertions).
- `roleTemplate.test.ts` — non-inheritance-for-any-role assertion, construction-time rejection for owner/manager/staff (2 new tests).
- `permissionOverride.test.ts` — Manager-grant-rejected, Staff-grant-rejected, revoke-rejected, Owner-target-rejected (4 new tests).
- `evaluatePermission.test.ts` — Owner allow (owner-floor), Manager deny, Staff deny, malformed/fabricated-grant-override deny (4 new tests), plus a no-grant-path regression test alongside the existing `business.transferOwnership` one.
- `evaluatePermissionService.emulator.test.ts` — real-Firestore Owner-allow, Manager-fabricated-override-deny, Staff-deny (3 new tests, new `describe` block).

## 22. Emulator/integration result

**PASS**, bounded proof added (no new production command) exercising exactly the three states the task specified: Owner membership + valid Business lifecycle → allow (owner-floor); Manager membership with a fabricated persisted grant-looking override document → deny/fail-closed; Staff membership → deny. Run via `firebase emulators:exec ... "pnpm --filter functions test:emulator"`: **434/434 passed**.

## 23. Existing sensitive-permission regression

**Zero regressions.** Full catalogue/role-template/override/evaluator/audit suites re-run unmodified in behavior for all eight pre-existing entries — see §24 combined counts. `business.transferOwnership`'s own dedicated tests (no-grant-path, no-eligible-role) are untouched and still pass.

## 24. `CORR-001` ordinary-permission regression

**Zero regressions.** `ordinaryPermissionCatalogue.ts`/`.test.ts` untouched; the evaluator's ordinary-permission branch (step 5a) and its four Founder-approved ids/eligibility sets are byte-for-byte unchanged (confirmed by full-suite pass — see below).

Full local validation (this worktree, this change):
- `pnpm run typecheck` — clean (both workspaces).
- `pnpm run lint` — clean.
- `pnpm run format:check` — clean.
- `pnpm run build` — clean (functions + web).
- `pnpm run test` — **functions 1233/1233, web 397/397** — all pass.
- `pnpm run emulators:validate` — **434/434** — all pass.

## 25. Scope audit

`git status --short` / `git diff --stat` against `origin/main` shows exactly six files changed, all under `functions/src/domains/permissions/`:

```
M functions/src/domains/permissions/evaluator/evaluatePermission.test.ts
M functions/src/domains/permissions/models/permissionOverride.test.ts
M functions/src/domains/permissions/models/roleTemplate.test.ts
M functions/src/domains/permissions/models/sensitivePermissionCatalogue.test.ts
M functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts
M functions/src/domains/permissions/service/evaluatePermissionService.emulator.test.ts
```

Zero changes under any staff-lifecycle command, `ENG-P2-003C`, frontend/`apps/web`, Firebase config, or `firestore.rules`/`storage.rules`. `ENG-P2-003C` was not begun.

## 26. Files modified

See §25. One production file (`sensitivePermissionCatalogue.ts`, +17/-0 lines: one new catalogue entry); five test files (all additive).

## 27. Code diff summary

`sensitivePermissionCatalogue.ts`: one new `SensitivePermissionCatalogueEntry` object inserted into `SENSITIVE_PERMISSION_CATALOGUE`, between `staff.assignPermissions` and `business.transferOwnership`. No other line changed. Test-file diffs are all additive (new `it`/`it.each` cases, one expanded list literal, one filtered `it.each` predicate) — no existing assertion was weakened or removed.

## 28. Dependencies added

None.

## 29. Config changes

None.

## 30. Firebase/Rules changes

None. Not required — the catalogue-only correction needs no Rules change, and none was made or is proposed.

## 31. Deployment changes

None.

## 32. Documentation/tracking changes

This report (new file) plus a dated-supersession entry in `docs/05-implementation/change-tracking/engineering-implementation-programme.md`'s `Last controlled update` changelog (prior entries preserved verbatim, per that document's own established pattern).

## 33. Review findings/dispositions

Independent-review reconstruction performed by the implementer (no separate reviewer agent invoked in this pass — disclosed; see §34/§45 for the residual risk this carries and the recommended mitigation). Reconstructed from first principles, without reading the implementation, and cross-checked against the actual diff:
- Catalogue fields: re-derived the `business.transferOwnership`-shape reasoning independently from the Founder policy text alone (Owner-only + no grant path ⇒ `inheritAllowed:false, explicitGrantRequired:false, explicitGrantEligibleRole:null, explicitRevocationSupported:false`) — matched.
- Owner behavior: re-derived that step 5's Owner floor is unconditional on permission id — matched, and confirmed by both unit and emulator evidence.
- Manager/Staff non-delegability: re-derived all four acquisition paths (default, grant, malformed/fabricated, template) independently and confirmed each is closed by pre-existing generic contract-layer code, not new special-casing — matched.
- Override behavior: re-derived that `createPermissionOverride`'s `explicitGrantRequired`/`explicitRevocationSupported` checks are unconditional on which entry sets them `false` — matched.
- Sensitive audit: re-derived that audit participation is catalogue-membership-keyed, not id-keyed — matched, no `permissionAuditService.ts` change needed.
- Ordinary-permission non-regression: re-derived that `evaluatePermission.ts` step 5a returns for any `isOrdinaryPermission` id before ever reaching sensitive-catalogue logic, structurally unaffected by a sensitive-catalogue addition — matched.

No material finding. No fix applied (none needed).

## 34. Remaining material findings

None identified. One process disclosure: no second/automated reviewer (e.g. Codex) was available in this environment for this pass — the independent-reconstruction review in §33 was performed by the implementer, which this report discloses rather than silently omits, consistent with this codebase's established disclosure precedent for the same circumstance in prior merged packages (e.g. `ENG-P2-004C`/`CAP-P2-ITM-B`/`-C` reports).

## 35. PR number

Not yet opened as of this report — see §45 (next Founder action). Will be opened as a **draft** PR from `feat/eng-p2-004-corr-002-staff-assign-role` against `main`, not self-merged.

## 36. Final reviewed head

Local worktree head at time of this report: pending commit of the changes described in §25–27 (to be recorded once committed).

## 37. CI result

Not yet run (pending PR open) — all-local validation in §24 is a superset of what CI runs for this repository (typecheck, lint, format, build, functions unit, web unit, emulator validation), all clean.

## 38. `ENG-P2-004-CORR-002` status

**Implemented / pending Founder review** — not merged.

## 39. `ENG-P2-004` status

**Complete**, with `CORR-002` pending merge as an additive governed correction (adds one sensitive-permission catalogue entry; does not reopen or alter any prior `ENG-P2-004A/B/C/D` acceptance criterion).

## 40. `ENG-P2-003A`/`B` status

Both **Complete** (unchanged by this task — verified, not re-asserted from memory; see §3).

## 41. `ENG-P2-003C` status

**Not started.** Not begun, not implied started, by this task.

## 42. Capability 3 status

**Open — partially implemented; not closed** (unchanged).

## 43. Dirty primary worktree

`/Users/theo/11THONUS` (primary checkout) was not entered or modified by this task; its pre-existing untracked governance/docs files (visible in the session's git-status snapshot, unrelated to this task) are outside this task's scope and were left exactly as found.

## 44. Risks

- **Low.** The change is additive, catalogue-only, and every non-obvious claim in this report (§9–§19) is backed by a passing test, including a real-Firestore emulator proof for the three MVP-critical actor states. The only residual risk is the single-reviewer disclosure in §34 — mitigated by the independent-reconstruction pass in §33 and by the Founder's own PR review before merge.

## 45. Rollback

Trivial — revert the single commit (or the PR, once merged); the change touches no persisted data, no migration, no Rules, and no deployed surface. Reverting restores the exact prior eight-entry catalogue with no other side effect.

## 46. Persistent implementation-report path

`docs/05-implementation/reports/ENG-P2-004-CORR-002-staff-assign-role-permission-implementation-report-2026-08-19.md` (this file).

## 47. Changes-tracking state

`engineering-implementation-programme.md`'s `Last controlled update` line updated with a new dated-supersession entry (2026-08-19) recording this task, preserving all prior entries verbatim.

## 48. Exact next Founder action

Review and, if satisfied, merge the draft PR from `feat/eng-p2-004-corr-002-staff-assign-role` into `main`. `ENG-P2-003C` remains a **separate**, still-unauthorized future task.

---

## FINAL GATE

**ENG-P2-004-CORR-002 READY FOR FOUNDER REVIEW/MERGE**
