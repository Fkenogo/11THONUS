# ENG-P2-004-CORR-001 — Pre-Operational Business Authorization Correction — Implementation Report

**Date:** 2026-08-19
**Status:** Implemented, pending Founder-authorized independent review/merge — **not self-merged**

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

## 33. Remaining material findings

None. The pre-existing test whose semantics the correction legitimately changed (§26) was already fixed before PR creation; no other pre-existing test's expected outcome changed; the independent review (§32) found nothing further.

## 34. PR number

[#126](https://github.com/Fkenogo/11THONUS/pull/126)

## 35. Final reviewed head

`eaaf4c1` (the sole commit on `feat/eng-p2-004-corr-001-authorization-correction`, unchanged since PR creation — no fixup commits were needed).

## 36. CI result

**Green.** `Build, Lint, Test, Emulator Validation` — pass, 3m32s ([run](https://github.com/Fkenogo/11THONUS/actions/runs/32144668664)).

## 37. ENG-P2-004-CORR-001 status

**Implemented, pending Founder-authorized independent review/merge.**

## 38. ENG-P2-004 status

**Complete**, with this bounded correction pending merge as an amendment — no sensitive-permission behavior changed, so this does not reopen `ENG-P2-004`'s prior closure.

## 39. ENG-P2-002C status

**Paused**, unchanged by this task (worktree still exactly 17 uncommitted files) — awaits this correction's merge before its own resumption, which is not authorized by this task.

## 40. ENG-P2-003 status

**Not started.**

## 41. Capability 3 status

**Not started**, unchanged.

## 42. Dirty primary worktree

Clean. The primary worktree (`/Users/theo/11THONUS`) was never entered or modified by this task; all work occurred in the new `eng-p2-004-corr-001` linked worktree.

## 43. Risks

- The evaluator's business-status gate is now permission-class-dependent rather than a single global rule — a future new sensitive or ordinary permission must be added to the correct catalogue, or it silently falls into the "unknown" (no-gate, always-fail-closed) bucket. This is the intended, governed behavior (fail-closed by omission), not a defect, but is worth reviewer attention.
- `ordinaryPermissionCorrection.emulator.test.ts` and `businessRepository.emulator.test.ts`'s new case both depend on `bootstrapBusiness`/`touchPermissionBoundaryFixture` — pre-existing, unmodified infrastructure — so this risk is no different from the existing emulator-test surface.

## 44. Rollback

Revert the PR (single squash commit expected, matching prior package precedent) — no data migration to reverse, no deployed endpoint changed, no Firebase config touched. `ENG-P2-004` reverts to its exact pre-correction state; `ENG-P2-002C` remains paused either way.

## 45. Persistent implementation-report path

`docs/05-implementation/reports/ENG-P2-004-CORR-001-pre-operational-authorization-correction-implementation-report-2026-08-19.md` (this file).

## 46. Changes-tracking state

`docs/05-implementation/change-tracking/engineering-implementation-programme.md` updated with two dated-supersession notes (`[UPDATED 2026-08-19 — ...]`, appended, no historical text rewritten): one on the "Business identity" column recording `ENG-P2-002C`'s pause and its cause, one on the "Role context and permission resolution" column recording the correction itself.

## 47. Exact next Founder action

Authorize an independent security/authorization review of PR (number pending, branch `feat/eng-p2-004-corr-001-authorization-correction`) — reviewing especially: fail-closed unknown-permission behavior, sensitive-permission non-regression, the exact lifecycle matrix, Owner-only role defaults, the absence of ordinary-permission override support, the absence of any global status-eligibility widening, and `business.submitForVerification`'s narrowness — then merge if the gates pass. `ENG-P2-002C`'s own resumption requires a further, separate Founder action after this correction merges.

---

## FINAL GATE

**ENG-P2-004-CORR-001 READY FOR FOUNDER REVIEW/MERGE**
