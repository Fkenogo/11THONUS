# ENG-P2-004-CORR-001 — Pre-Operational Business Authorization Correction — Implementation Report

**Date:** 2026-08-19
**Status:** **Complete / merged** (PR #126, merge `ce2b026`) — **[UPDATED 2026-08-19 — merge-gate closure]**

> **Date-label correction (recorded 2026-08-18, `ENG-P2-002C` controlled-resume task, Phase C).** This report's filename and header date (`2026-08-19`) were labeled one day ahead of the actual date on which the work was performed and merged — the merge commit timestamps (`ce2b026` at `2026-08-18T14:08:12Z`, `bc44216` at `2026-08-18T14:20:14Z`) are the accurate historical record. Per this repository's "do not rewrite historical evidence unnecessarily" convention, the filename and body are left as originally written rather than retroactively edited; this note exists only so a reader cross-referencing merge timestamps against the label isn't misled.

---

## 1. Entry origin/main SHA

`6ac6d7bd21863af84dfb9058699fbe117c48c50e` (verified via `git fetch origin && git rev-parse origin/main` at task start).

## 2. Worktree/branch

New linked worktree `/Users/theo/11THONUS/.claude/worktrees/eng-p2-004-corr-001`, branch `feat/eng-p2-004-corr-001-authorization-correction`, created fresh from `origin/main` at the SHA above. The primary worktree (`/Users/theo/11THONUS`) was never touched.

## 3. Prerequisite verification

- `ENG-P2-004` confirmed `Complete` on `main` (programme tracking, PR #109 merge record).
- `ENG-P2-002A`/`ENG-P2-002B` confirmed `Complete`/merged on `main` (PR #122, PR #124).
- `ENG-P2-002C` confirmed `Paused`/unmerged: its dedicated worktree (`.claude/worktrees/eng-p2-002c`) still carries exactly 17 uncommitted changed files, unchanged throughout this task.
- No `ENG-P2-004-CORR-001` runtime implementation existed prior to this task (`find functions/src/domains/permissions -iname "*corr*"` returned nothing in a clean worktree at `origin/main`).

All four checks passed — no material state divergence; proceeded per Phase A.

## 4. Codebase analysis

Read directly before any code change: `ENG-P2-004-DESIGN-001` (via prior CORR-001 research, re-confirmed against source), `evaluatePermission.ts` (the 10-step decision algorithm), `evaluatePermission.test.ts` (all 84 pre-existing cases), `types.ts`, `sensitivePermissionCatalogue.ts` (8-entry closed catalogue), `roleTemplate.ts`, `permissionId.ts`, `role.ts`, `permissionOverride.ts`, `permissionErrors.ts`, `authorizeAndExecute.ts` and `evaluatePermissionService.ts` (the 004D trusted boundary), and the paused `ENG-P2-002C` command contracts (`businessProfileCommand.ts`, `businessLifecycleCommand.ts`) for their exact permission-id usage. `businessStatus.ts`'s structural `PERMITTED_TRANSITIONS` table was re-checked to confirm `business.close`'s eligible-status set matches the "any non-terminal → closed" structural row exactly.

## 5. Pre-change correction strategy

Stated in-session before writing code: add a structurally-separate `ordinaryPermissionCatalogue.ts` (mirroring `sensitivePermissionCatalogue.ts`'s shape, independently defined) holding the four approved `PermissionId`s with `roleDefaults` and `eligibleBusinessStatuses`. Restructure `evaluatePermission.ts` to classify the requested permission (sensitive/ordinary/unknown) immediately after the Business record resolves, apply that class's own lifecycle-eligibility gate at that point (sensitive keeps its existing `{trial, active}` gate untouched; ordinary uses its own per-permission set; unknown skips the gate, preserving prior "ungoverned permission" behavior), then continue unchanged into membership resolution. Ordinary permissions resolve through a dedicated role-default check inserted immediately after the existing Owner-floor step, returning before the override-resolution steps run at all — this keeps `PermissionOverride` behavior byte-for-byte unchanged for sensitive permissions while giving ordinary permissions zero override surface, by construction rather than by an added restriction check.

## 6. Ordinary permission configuration design

`functions/src/domains/permissions/models/ordinaryPermissionCatalogue.ts` — closed array of 4 entries:

```ts
type OrdinaryPermissionCatalogueEntry = {
  readonly id: PermissionId;
  readonly roleDefaults: Readonly<Record<Role, boolean>>;
  readonly eligibleBusinessStatuses: readonly BusinessLifecycleStatus[];
};
```

No description field, no UI label, no audit classification, no numeric risk value, no grant/revoke metadata beyond what's needed, no speculative permission. A module-load-time invariant check (`for (const id of ORDINARY_PERMISSION_IDS) { if (isSensitivePermission(id)) throw ... }`) enforces structural disjointness from `SENSITIVE_PERMISSION_CATALOGUE` — the two tables can never silently collide.

## 7. Exact PermissionIds

`business.updateProfile`, `businessBranch.updateProfile`, `business.submitForVerification`, `business.close` — exactly FD-CORR-3's four. `business.advanceLifecycle` does not appear anywhere in the new catalogue (test-enforced: `ordinaryPermissionCatalogue.test.ts`, "does not contain business.advanceLifecycle").

## 8. Role-default implementation

All four entries: `{ owner: true, manager: false, staff: false }` (FD-CORR-4), via a single shared `OWNER_ONLY_DEFAULT` constant. No grant/revoke path exists for any of the four — the evaluator never consults `PermissionOverride` state for an ordinary permission at all (see §15).

## 9. Lifecycle-eligibility implementation

Per FD-CORR-5/7's approved matrix, expressed as two named constants reused across entries:

- `business.updateProfile` / `businessBranch.updateProfile`: `[draft, pending_verification, trial, active, expired]` (not `suspended`, `closed`, `archived`).
- `business.submitForVerification`: `[draft]` only.
- `business.close`: `[draft, pending_verification, trial, active, suspended, expired]` (not `closed`, `archived`) — matches `businessStatus.ts`'s structural "any non-terminal → closed" table exactly.

## 10. Evaluator sequence before/after

**Before:** subject → business-context format → business read/status (single global `{trial,active}` gate for every permission) → membership read/status → permission format → Owner floor (sensitive) → override revoke → override grant → sensitive role-default → dead non-sensitive role-default → fail-closed.

**After:** subject → business-context format → business read → **permission classification (sensitive/ordinary/unknown) + per-class lifecycle gate** → membership read/status → permission format → Owner floor (sensitive) → **ordinary role-default (returns here for any ordinary permission, before override resolution)** → override revoke → override grant → sensitive role-default → dead non-sensitive role-default (unchanged, still unreachable) → fail-closed.

## 11. Unknown permission behavior

An unconfigured permission id (neither sensitive-catalogue nor ordinary-catalogue) receives no lifecycle gate and proceeds through membership resolution exactly as before this correction, ultimately denying at the pre-existing fail-closed step (`NO_APPLICABLE_GRANT`/`AUTH_FORBIDDEN`). Test-proven (`evaluatePermission.test.ts`, "unknown ordinary permission" describe block) and proven against real Firestore (`businessRepository.emulator.test.ts`, `business.viewSettings` case, updated — see §26).

## 12. Sensitive permission non-regression

All 8 sensitive permissions keep `OPERATIONAL_BUSINESS_STATUSES = {trial, active}` untouched, verbatim. Every pre-existing evaluator test (84 cases) passes unmodified. Two new explicit non-regression cases added: `staff.manage` + `draft` → still `BUSINESS_INACTIVE`; `customer.viewProtectedProfile` + `pending_verification` → still `BUSINESS_INACTIVE`. `authorizeAndExecute.emulator.test.ts` (the full 004D sensitive-audit matrix) passes unmodified, 0 changes.

## 13. submitForVerification narrowness

Eligible only in `draft`. Explicitly tested against every other status (`pending_verification`, `trial`, `active`, `suspended`, `expired`, `closed`, `archived`) for the Owner — every one denies `BUSINESS_INACTIVE`. Proven against real Firestore too: Owner on a `pending_verification` Business denies through the full `authorizeAndExecute` boundary. No generic "advance lifecycle" permission was created — the id itself only ever authorizes the one governed action its eligibility set names.

## 14. close permission result

Matches the exact approved matrix and the pre-existing structural transition table (`businessStatus.ts`) exactly — no broadening of closure semantics, no archive/delete semantics added.

## 15. Ordinary override result

Ordinary permissions never reach the override-resolution steps (verified: a grant override does not bypass a Manager's deny; a revoke override does not block the Owner's default-allow; a malformed-direction override has no effect either way — all three proven as explicit tests). Sensitive override behavior is byte-for-byte unchanged (same code path, untouched).

## 16. Audit treatment

No change to `permissionAuditService.ts`/`recordSensitiveDecision` — it already no-ops for non-sensitive decisions internally (pre-existing 004C contract), so ordinary permissions were never routed through sensitive audit before this correction and are not now either. No new event system introduced.

## 17. Migration/data impact

Code/config only. No Firestore schema change, no Business/membership/override migration, no bootstrap record rewrite. `git diff --stat` against `origin/main` touches only `functions/src/domains/permissions/**` and `functions/src/domains/business/repositories/businessRepository.emulator.test.ts` (a pre-existing test's assertion updated to match corrected semantics — see §26) plus this report and the programme-tracking doc.

## 18–21. 004A/004B/004C/004D regression

- **004A** (`sensitivePermissionCatalogue.ts`, `roleTemplate.ts`, `permissionId.ts`, `role.ts`, `permissionOverride.ts`): zero files touched; all pre-existing tests pass unmodified.
- **004B** (`evaluatePermission.ts`): restructured (additive), all 84 pre-existing tests pass unmodified; `evaluatePermissionService.ts`/`evaluatePermissionService.test.ts`/`.emulator.test.ts` untouched, pass unmodified.
- **004C** (`permissionAuditService.ts`, `permissionAuditEventFactory.ts`): zero files touched; all pre-existing tests pass unmodified.
- **004D** (`authorizeAndExecute.ts`): zero files touched; `authorizeAndExecute.emulator.test.ts`'s full sensitive-audit matrix passes unmodified.

## 22. 002C compatibility proof

New file `functions/src/domains/permissions/service/ordinaryPermissionCorrection.emulator.test.ts` — reuses the existing `touchPermissionBoundaryFixture` test-only 004D shim (the same one `authorizeAndExecute.emulator.test.ts` already used) to exercise the exact `authorizeAndExecute` boundary the paused 002C commands call, against real Firestore. Proves, for each of the four permissions: an eligible case executes, an ineligible-status case denies, a Manager/non-Owner case denies, and (for `business.updateProfile`) the specific freshly-bootstrapped-`draft`-Business scenario `CAP-P3-BIZ-AUTH-001` identified as the deadlock now resolves to `executed`. 9 new emulator tests, all passing. The paused `ENG-P2-002C` worktree was never read from by this file (no import), never written to.

## 23. RED→GREEN evidence

- `ordinaryPermissionCatalogue.test.ts` run before `ordinaryPermissionCatalogue.ts` existed: genuine `Cannot find module` failure (RED), then 23/23 passing after implementation (GREEN).
- `evaluatePermission.test.ts`'s 17 new ordinary-permission cases run before the evaluator restructuring: 17 genuine failures (RED, `expected false to be true` / wrong reason code), 84 pre-existing cases unaffected — then 101/101 passing after the evaluator change (GREEN).

## 24. Tests added

- `ordinaryPermissionCatalogue.test.ts`: 23 tests (catalogue shape, FD-CORR-3 exact ids, FD-CORR-4 role defaults, FD-CORR-5/7 exact eligibility sets, unknown-id handling).
- `evaluatePermission.test.ts`: 17 new tests (per-permission decision tables for all 4 ordinary permissions across all 8 statuses where relevant, submitForVerification narrowness across every non-draft status, unknown-permission fail-closed, ordinary+override non-effect ×3, ordinary interaction cases ×5, sensitive non-regression ×2).
- `businessRepository.emulator.test.ts`: 1 pre-existing test updated (§26), 1 new test added (Owner + `business.updateProfile` on a freshly-bootstrapped draft Business → allowed, real Firestore).
- `ordinaryPermissionCorrection.emulator.test.ts`: 9 new tests (002C compatibility proof, §22).

Total: 50 new/updated tests.

## 25. Full validation

- `functions` unit (excluding emulator): **1109/1109** passed, 114 test files.
- `functions/src/domains/permissions` isolated: **295/295** passed, 15 files.
- `emulators:validate` (real Firestore): **359/359** passed, 33 files.
- `apps/web` unit: **397/397** passed, 51 files.
- `pnpm typecheck` (both workspaces): clean.
- `pnpm lint`: clean.
- `pnpm format:check`: clean.
- `pnpm build` (both workspaces): clean.
- Secret scan (`git diff origin/main` grepped for key/secret/credential patterns): no matches.

## 26. Files modified

Modified (5): `functions/src/domains/business/repositories/businessRepository.emulator.test.ts`, `functions/src/domains/permissions/evaluator/evaluatePermission.test.ts`, `functions/src/domains/permissions/evaluator/evaluatePermission.ts`, `functions/src/domains/permissions/evaluator/types.ts`, `functions/src/domains/permissions/models/permissionErrors.ts`.

New (3): `functions/src/domains/permissions/models/ordinaryPermissionCatalogue.ts`, `functions/src/domains/permissions/models/ordinaryPermissionCatalogue.test.ts`, `functions/src/domains/permissions/service/ordinaryPermissionCorrection.emulator.test.ts`.

Plus this report and `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (dated-supersession notes only).

**One pre-existing test's assertion was updated**, not merely extended: `businessRepository.emulator.test.ts`'s "the initial Owner membership is readable and well-formed for the existing evaluator" test asserted `business.viewSettings` (an unconfigured, non-catalogue permission) denies with `BUSINESS_NOT_ACTIVE`/`BUSINESS_INACTIVE` on a freshly-bootstrapped `draft` Business. That assertion documented the exact pre-correction blanket-gate behavior `CAP-P3-BIZ-AUTH-001` identified as the deadlock. Post-correction, an *unconfigured* permission (this one is not among the four approved ordinary ids) receives no lifecycle gate at all and denies via the unknown-permission fail-closed path instead — still denied, just `NO_APPLICABLE_GRANT`/`AUTH_FORBIDDEN` rather than `BUSINESS_NOT_ACTIVE`/`BUSINESS_INACTIVE`. The test and its comment were updated to state this explicitly, and a companion test proving `business.updateProfile` (a governed ordinary permission) is now genuinely `allowed: true` in the identical scenario was added immediately after it.

## 27. Code diff summary

+617 lines across the 5 modified `functions` files (mostly new test cases and the module-header/inline correction commentary); 3 new files (~250 lines combined: catalogue + its unit tests + the compatibility-proof emulator tests). No line of any sensitive-permission-only code path was altered — only inserted around (the new classification/gate/ordinary-role-default blocks sit alongside the unchanged sensitive logic, never inside it).

## 28. Dependencies added

None.

## 29. Config changes

None (`eslint.config.js`'s existing `functions/src/domains/permissions/**` Firebase-import-ban rule already covers the new `models/`-scoped file with no edit needed — verified by inspection, not assumed).

## 30. Firebase/Rules changes

None. `firestore.rules`/`storage.rules` untouched.

## 31. Deployment changes

None. No Cloud Function signature changed, no new endpoint added.

## 32. Review findings/dispositions

Independent manual review performed (no automated Codex/review-bot tooling was available in this non-interactive session — disclosed; GitHub also blocks a same-account formal "Approve" review on one's own PR, so the review was posted as a PR comment, findings/disposition unaffected). Full text: [PR #126 review comment](https://github.com/Fkenogo/11THONUS/pull/126#issuecomment-5329187500). Areas re-verified independently against the diff and full test evidence: fail-closed unknown-permission behavior (traced to confirm it can never resolve to `allowed: true`), sensitive-permission non-regression (confirmed the sensitive code path is untouched line-for-line, only wrapped), the exact lifecycle matrix (cross-checked against both FD-CORR-5/7 and `businessStatus.ts`'s independent structural transition table), Owner-only role defaults (test-enforced per entry), absence of ordinary-permission override support (confirmed structurally unreachable, not merely untested), absence of global status widening (the sensitive gate's own constant is unmodified), and `submitForVerification` narrowness (tested against all seven non-draft statuses). **Disposition: no defects found. Recommend merge.**

**[UPDATED 2026-08-19 — `ENG-P2-004-CORR-001` merge-gate review]** A second, independent-final-review pass was performed under a fresh Founder authorization scoped specifically to review/merge/closure, in a fresh clean worktree from `origin/main`, re-deriving every claim from source rather than trusting this report or the first review. It independently re-confirmed all of the above (catalogue exactness, disjointness, evaluator classification order, sensitive non-regression, ordinary role defaults, ordinary override isolation, unknown-permission fail-closed, the lifecycle matrix reproduced from actual runtime configuration, `submitForVerification` narrowness, `business.close` scope, membership/role security, malformed/unknown-Business-status handling — confirmed rejected upstream at `businessDocument.ts`'s `isBusinessStatus` type guard, unchanged by this correction — the audit boundary, and a structural grep for hidden authority paths, none found) by independently re-running the full validation suite fresh (not merely re-reading prior results). It found two minor, non-functional gaps and fixed both directly on the PR: (1) Step 9's comment in `evaluatePermission.ts` still said "no governed non-sensitive baseline table exists yet," which `ordinaryPermissionCatalogue.ts` now partially contradicts — corrected to explain precisely why that step remains provably unreachable for every permission id this evaluator currently classifies (sensitive-catalogue ids are exhausted by Step 8; ordinary-catalogue ids never reach Step 9 at all, always returning earlier at Step 5a); (2) the override-isolation test suite covered a Manager-role grant-looking-override case but not the equivalent Staff-role case — added. Both are comment/test-only; zero behavior change. No other finding of any kind.

## 33. Remaining material findings

None, after two independent review passes. The pre-existing test whose semantics the correction legitimately changed (§26) was fixed before PR creation; the two review-time gaps above were fixed on the PR itself and both are documentation/test-coverage only, not defects in the correction's actual authorization behavior.

## 34. PR number

[#126](https://github.com/Fkenogo/11THONUS/pull/126) — **Merged.**

## 35. Final reviewed head

`256ddc7` (the head at merge time, on `feat/eng-p2-004-corr-001-authorization-correction`; three commits total: `eaaf4c1` implementation, `0882e22` review/CI-evidence docs, `256ddc7` the merge-gate review's comment fix + Staff-override test).

## 36. CI result

**Green** at every commit. Final pre-merge run: `Build, Lint, Test, Emulator Validation` — pass, 4m23s ([run](https://github.com/Fkenogo/11THONUS/actions/runs/32145991853)). **Post-merge, on `origin/main`:** also green ([run](https://github.com/Fkenogo/11THONUS/actions/runs/32146494898), 3m42s).

## 37. ENG-P2-004-CORR-001 status

**Complete / merged.** PR #126 squash-merged as `ce2b02627faa1af2f6f224d75bb907bfb2a25ca8`, post-merge CI green.

## 38. ENG-P2-004 status

**Complete**, corrected for ordinary Business permissions. PR #126 merged as `ce2b02627faa1af2f6f224d75bb907bfb2a25ca8` — no sensitive-permission behavior changed, so this does not reopen `ENG-P2-004`'s prior closure; it amends it with the bounded, Founder-approved correction.

## 39. ENG-P2-002C status

**Paused — now technically unblocked, awaiting controlled resume.** The dedicated worktree still carries exactly its 17 pre-existing uncommitted files, untouched by this task or its merge-gate review. Resuming it (rebasing onto `origin/main` at or after `ce2b026`, completing its interrupted emulator test suite, writing its own implementation report, opening its own PR) requires a separate, fresh Founder authorization — not granted or exercised by this task.

## 40. ENG-P2-003 status

**Not started.**

## 41. Capability 3 status

**Not started**, unchanged.

## 42. Dirty primary worktree

Clean. The primary worktree (`/Users/theo/11THONUS`) was never entered or modified by this task or its merge-gate review; all work occurred in dedicated linked worktrees (`eng-p2-004-corr-001`, `eng-p2-004-corr-001-review`, `eng-p2-004-corr-001-closure`).

## 43. Risks

- The evaluator's business-status gate is now permission-class-dependent rather than a single global rule — a future new sensitive or ordinary permission must be added to the correct catalogue, or it silently falls into the "unknown" (no-gate, always-fail-closed) bucket. This is the intended, governed behavior (fail-closed by omission), not a defect, but is worth continued reviewer attention on any future permission addition.
- `ordinaryPermissionCorrection.emulator.test.ts` and `businessRepository.emulator.test.ts`'s new case both depend on `bootstrapBusiness`/`touchPermissionBoundaryFixture` — pre-existing, unmodified infrastructure — so this risk is no different from the existing emulator-test surface.
- `ENG-P2-002C`'s paused worktree has not been rebased onto this merge — its own resumption task will need to reconcile against `main` at `ce2b026` (a straightforward rebase; no conflicting file was touched by this correction, since 002C's changes live entirely under `functions/src/domains/business/` while this correction lives under `functions/src/domains/permissions/`, with the sole exception of the one already-merged `businessRepository.emulator.test.ts` edit under `domains/business/repositories/`, which 002C's own worktree does not otherwise touch).

## 44. Rollback

Revert `ce2b02627faa1af2f6f224d75bb907bfb2a25ca8` on `main` — no data migration to reverse, no deployed endpoint changed, no Firebase config touched. `ENG-P2-004` reverts to its exact pre-correction state; `ENG-P2-002C` remains paused either way, and its eventual resumption would simply rebase onto whatever `main` looks like post-revert instead.

## 45. Persistent implementation-report path

`docs/05-implementation/reports/ENG-P2-004-CORR-001-pre-operational-authorization-correction-implementation-report-2026-08-19.md` (this file).

## 46. Changes-tracking state

`docs/05-implementation/change-tracking/engineering-implementation-programme.md` updated with three dated-supersession notes (`[UPDATED 2026-08-19 — ...]`, appended, no historical text rewritten): one on the "Business identity" column recording `ENG-P2-002C`'s pause and its cause (added during implementation), one on the "Role context and permission resolution" column recording the correction itself (added during implementation), and a closure note on the latter recording the merge (added by this closure task).

## 47. Exact next Founder action

Authorize `ENG-P2-002C`'s controlled resumption: rebase its preserved worktree onto `origin/main` at (or after) `ce2b026`, complete its interrupted emulator test suite (Task 25 was interrupted mid-work when the `CAP-P3-BIZ-AUTH-001` blocker was discovered), write its own implementation report, and proceed through its own independent review/merge cycle — none of which this task performs.

---

## FINAL GATE

**ENG-P2-004-CORR-001 MERGED AND CLOSED — ENG-P2-002C MAY RESUME UNDER CONTROLLED REBASE**
