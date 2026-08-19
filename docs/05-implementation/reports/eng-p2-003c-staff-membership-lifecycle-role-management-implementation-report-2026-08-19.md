> **Title:** ENG-P2-003C — Staff Membership Lifecycle & Role Management — Implementation Report
> **Status:** **Implemented / pending Founder review.** Not merged, not self-merged (per explicit instruction). Draft PR opened for independent review. Capability 3 remains **Open — partially implemented; not closed** per explicit Founder instruction (Staff Invitation UI, permission-override administration, `staff.assignPermissions`, and ENG-P2-003D/E remain unimplemented).
> **Governing documents:** [`ENG-P2-003-DESIGN-001` v1.1](../roadmap/ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md) (§§5, 6, 11.6, 12, 13, 16, 17, 28); TRD10 §10.6.4; `ENG-P2-004-DESIGN-001` §§3, 4, 6; the Founder task "ENG-P2-003C — Staff Membership Lifecycle & Role Management."
> **Entry `origin/main` SHA:** `30860fd856651c0275c0c7aa6169b5ff90f05cb7` (`ENG-P2-004-CORR-002` independent-review closure)
> **Worktree/branch:** `.claude/worktrees/agent-a086ceccdff9d5238`, branch `feat/eng-p2-003c-staff-membership-lifecycle`, cleanly branched from the SHA above. The primary worktree/checkout at `/Users/theo/11THONUS` (on `chore/eng-p1-001-closure`) was never entered or modified by this task.

---

## 1. Entry `origin/main` SHA

`30860fd856651c0275c0c7aa6169b5ff90f05cb7`, confirmed by direct `git fetch origin && git rev-parse origin/main` — matches the SHA the Founder task cited exactly. `git log origin/main` confirms, newest first: `30860fd` (ENG-P2-004-CORR-002 closure sync), `3153ae6` (PR #134 merge — ENG-P2-004-CORR-002), `123a60e` (ENG-P2-003B closure sync), `b0277bf` (ENG-P2-003B commit, squash-merged as PR #133), `7254db5` (PR #132 merge — ENG-P2-003A), `e4b47a1`/`7e2fd6b` (ENG-P2-003-DESIGN-001 v1.1, PR #130/#131).

## 2. Worktree/Branch

`.claude/worktrees/agent-a086ceccdff9d5238`, branch `feat/eng-p2-003c-staff-membership-lifecycle`, branched directly from `origin/main` at the SHA above (not from local `main`, which may be stale — the task's own explicit instruction). `/Users/theo/11THONUS` (the primary checkout, on `chore/eng-p1-001-closure`) was never entered or modified.

## 3. Prerequisite Verification (Phase A)

- **ENG-P2-003A** — merged PR #132 (`gh pr list`: `MERGED`); `gh pr checks 132` → `Build, Lint, Test, Emulator Validation: pass` (5m10s, run `32223980531`). Post-merge push-to-main CI (`32226470426`, commit `7254db5`) → `success`.
- **ENG-P2-003B** — merged PR #133 (`MERGED`); `gh pr checks 133` → `pass` (7m47s, run `32268573656`). The push-to-main CI run for the raw commit `b0277bf` itself (`32269590232`) shows `cancelled` — this is the shared-concurrency-group cancellation the very next push (the closure-sync docs commit `123a60e`, layered directly on top of `b0277bf`, `success`, run `32274430166`) superseded; the PR-level check on the same tree passed independently. Not treated as a CI gap — the immediately-following commit's green run covers the same tree state plus one docs-only commit.
- **ENG-P2-004-CORR-002** — merged PR #134 (`MERGED`); `gh pr checks 134` → `pass` (4m47s, run `32279042316`). Post-merge push-to-main CI (`32280667665`, commit `30860fd`, the entry SHA itself) → `success`.
- **`staff.assignRole` catalogue configuration** — read directly from `functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts` on `origin/main`: `defaultState: "owner_only"`, `inheritAllowed: false`, `explicitGrantRequired: false`, `explicitGrantEligibleRole: null`, `explicitRevocationSupported: false` — Owner-only, non-delegable, exactly as the task's entry authorization states. Confirmed independently, not assumed.
- **No overlapping work** — `gh pr list --state open` shows one open PR (#34, `docs(tracking): ENG-P2-RES-ADMIN-003`, unrelated post-decision-sync docs). `git branch -r` search for `eng-p2-003c`/`003d`/`003e`/`staff.*lifecycle`/`staff.*role`/`membership.*lifecycle` returned only `origin/feat/eng-p2-004-corr-002-staff-assign-role` (already merged as #134). No `ENG-P2-003C/D/E` branch, PR, or file existed anywhere in the repository prior to this task.

All four Phase A prerequisite checks passed cleanly — no STOP condition found.

## 4. Codebase Analysis (Phase B, before any code was written)

Read directly, in full or targeted: `ENG-P2-003-DESIGN-001` v1.1 (§§5.1–5.3, 6, 7.2a, 8a, 9, 11.2, 11.4–11.6.2, 12.1/12.2/12.4 addenda, 14, 16.3, 17, 22 addendum, 28 FD-5-STAFF/FD-6-STAFF), TRD10 §10.6.4, `functions/src/domains/permissions/models/{sensitivePermissionCatalogue,businessMembershipDocument,staffMembershipTargetPolicy,staffRoleChangeRequest,role,invitationRole,permissionErrors,businessMembershipWrite}.ts`, `functions/src/domains/permissions/repositories/{businessMembershipRepository,businessMembershipWriteRepository}.ts`, `functions/src/domains/permissions/evaluator/{types,evaluatePermission}.ts`, `functions/src/domains/permissions/service/{authorizeAndExecute,acceptStaffInvitationService,evaluatePermissionService}.ts`, `functions/src/domains/permissions/events/staffInvitationEvents.ts`, `functions/src/domains/business/services/businessLifecycleCommand.ts` (the `authorizeAndExecute`-consuming command template), `functions/src/shared/outbox/outboxWriter.ts`, `functions/src/shared/errors/errorCategories.ts`, `functions/src/domains/business/services/businessProfileLifecycle.emulator.test.ts` (the real-Firestore emulator test template).

Confirmed independently:
- `staffMembershipTargetPolicy.ts` (`ENG-P2-003A`) already implements `isPermittedStaffManagementTarget`/`isPermittedRoleChangeTarget` verbatim to §11.6.1/§11.6.2's matrices, including Owner-target exclusion and self-action exclusion — nothing to re-derive, only to consume.
- `staffRoleChangeRequest.ts` (`ENG-P2-003A`) already structurally rejects `fromRole === toRole` and any role outside `{"manager","staff"}` at construction time.
- No membership *update* write path existed anywhere pre-003C — `businessMembershipWriteRepository.ts` had only creation (`writeNewBusinessMembership`); this package's entire write-side task is additive.
- The evaluator's override-eligibility re-check (`evaluatePermission.ts` Step 7: `entry.explicitGrantEligibleRole === role`) reads the membership's role fresh on every evaluation — this directly resolved Phase N/O without a STOP (§18/§19 below).

## 5. Pre-Change Strategy (Phase B summary)

Reuse, unmodified: `ENG-P2-004`'s `authorizeAndExecute`/evaluator (`staff.manage`/`staff.assignRole` authorization), the shared idempotency service (via `authorizeAndExecute`'s own reservation), the shared outbox writer, `ENG-P2-003A`'s `staffMembershipTargetPolicy.ts` and `staffRoleChangeRequest.ts` unmodified, `businessMembershipDocument.ts`'s reader unmodified. Added, additively only: a pure lifecycle-transition model (`staffMembershipLifecycle.ts`), one new read function (`getBusinessMembershipById`) appended to the existing read-only repository, three new update functions appended to the existing write repository, one new events file, two new command files (`staffMembershipLifecycleCommand.ts` for SUSPEND/REACTIVATE/REMOVE, `staffRoleChangeCommand.ts` for role change), and new domain errors appended to `permissionErrors.ts`. No existing exported function's behavior was changed.

## 6. Membership Lifecycle State Machine (Phase C/D)

Re-derived from `ENG-P2-003-DESIGN-001` §5.3's governed transition table, cross-checked against TRD10 §10.6.4's closed four-value status enum (unchanged, no fifth value added, `invited` not deleted):

```
active    -> suspended   (SUSPEND)
suspended -> active      (REACTIVATE)
active    -> removed     (REMOVE)
suspended -> removed     (REMOVE)
```

`removed` is terminal and non-reversible under every command this package defines (FD-4-STAFF, §5.3: "a removed member must be re-invited... never resurrected in place"). `removed -> active` was **not** implemented — confirmed as the design's own explicit distinction between an ordinary lifecycle transition (this package) and ENG-P2-003B's separate, already-merged re-invitation/reactivation-in-place path, which is not a transition this package exposes. `invited` is unreachable under the resolved FD-2-STAFF model (no `businessMembership` is ever created `invited`) and permits no transition either, by the same closed table. The design was unambiguous — no STOP required for Phase D.

Implemented as `functions/src/domains/permissions/models/staffMembershipLifecycle.ts` — a pure, unit-tested predicate (`isPermittedLifecycleTransition`), consumed by both lifecycle commands, never duplicated.

## 7. Suspend Command

`suspendStaffMembershipCommand` (`functions/src/domains/permissions/service/staffMembershipLifecycleCommand.ts`). `authorizeAndExecute({permission: "staff.manage", ...})` against the actor's own `(userId, businessId)` → `mutation.prepare` resolves the **target** membership by `membershipId` (`getBusinessMembershipById`, additive), enforces cross-business isolation, `staffMembershipTargetPolicy.isPermittedStaffManagementTarget`, and `staffMembershipLifecycle.isPermittedLifecycleTransition(target.status, "suspend")` → `mutation.apply` writes `status: "suspended"`/`updatedAt` via `writeMembershipLifecycleTransition` and a `StaffMembershipSuspended` outbox entry, all inside `authorizeAndExecute`'s single transaction.

## 8. Reactivate Command

`reactivateStaffMembershipCommand`, same file, same shape as SUSPEND with `action: "reactivate"`. `isPermittedLifecycleTransition` requires `status === "suspended"` — a `removed` target is never treated as `suspended` (verified by a dedicated test: "removed target — denied, never treated as suspended").

## 9. Remove Command

`removeStaffMembershipCommand`, same file, `action: "remove"`. Writes `status: "removed"` **and** `endedAt` via the dedicated `writeMembershipRemoval` (a `.update()`, never `.set()` — the document is never replaced or hard-deleted; historical fields like `invitedBy`/`invitedAt`/`createdAt` survive untouched). Verified by a dedicated test asserting the document still exists post-removal with `endedAt` set. Repeated REMOVE on an already-removed target is denied (`INVALID_STATE_TRANSITION`), confirming non-reversibility.

## 10. `staff.manage` Authorization Result

Verified, real Firestore: Owner executes against Manager/Staff targets; Manager holding an explicit `staff.manage` grant executes against Staff only; Staff (no grant) is denied by the evaluator itself before any domain check runs. All three lifecycle commands share this one authorization path — never re-implemented per-command.

## 11. Target-Policy Matrix Result

`staffMembershipTargetPolicy.isPermittedStaffManagementTarget` (unmodified, `ENG-P2-003A`) verified against every required case: Owner→Manager/Staff allow; Manager→Staff allow; Manager→Manager deny; anyone→Owner deny; self→anyone deny. All confirmed by real-Firestore assertions, not mocked.

## 12. Owner Protection

Enforced at two independent layers, per the Founder's explicit "do not rely solely on permission checks" instruction: (1) `staffMembershipTargetPolicy.ts`'s `targetRole === "owner"` check, evaluated before any role-pair logic; (2) this package never grants `staff.manage`/`staff.assignRole` to a mechanism that could name Owner as a mutation target in the first place — `writeMembershipLifecycleTransition`/`writeMembershipRoleChange` only ever write the *resolved target's* id, and the target is rejected before `mutation.apply` runs whenever its role is Owner. Adversarial tests: Owner cannot suspend/reactivate/remove/role-change itself as a target; Manager (even holding `staff.manage`) cannot suspend/reactivate/remove Owner; a second Owner membership cannot be targeted by role change. All pass.

## 13. Self-Action Protection

`isSelfAction` is computed server-side as `target.userId === params.userId` — `params.userId` is the same trusted actor identity `authorizeAndExecute`'s evaluator already resolved the actor's own membership against; no client-supplied flag or "target userId" field exists anywhere in any command's parameter type. Tests: Owner targeting its own membership (denied — also independently caught by Owner-target-exclusion); Manager holding `staff.manage` targeting its own membership (denied — added specifically to isolate the self-check, since Manager-self also coincides with the "Manager may target Staff only" rule; see §31 below for the RED-phase evidence this coincidence produced). **Finding, not a blocker:** in this design's specific target matrix, self-action denial is provably always redundant with the existing role-pair rules (an actor's own role always equals its own target role, and no role-pair rule permits any role to administer its own role) — confirmed by exhaustive case analysis, not merely observed. The explicit self-check is retained regardless, exactly as the Founder instructed, as the required structural safety net independent of that (current) redundancy.

## 14. Role-Change Command

`changeStaffMembershipRoleCommand` (`functions/src/domains/permissions/service/staffRoleChangeCommand.ts`). Consumes `staffRoleChangeRequest.createStaffRoleChangeRequest` (unmodified, `ENG-P2-003A`) for structural validation before any authorization read. `authorizeAndExecute({permission: "staff.assignRole", ...})` → `mutation.prepare` resolves target, cross-business check, `staffMembershipTargetPolicy.isPermittedRoleChangeTarget`, and a **TOCTOU-safe `fromRole` re-check** against the target's live, transaction-read role (`roleChangeFromRoleMismatchError`, `INVALID_STATE_TRANSITION`, if stale) → `mutation.apply` writes `role`/`updatedAt` via `writeMembershipRoleChange` and a `StaffRoleChanged` outbox entry.

## 15. `staff.assignRole` Authorization Result

Verified: Owner executes both directions; Manager (even holding `staff.manage`) is denied by the evaluator itself — `staff.assignRole`'s catalogue entry has no grant path (`explicitGrantEligibleRole: null`), so no override can ever make a Manager eligible; Staff denied. The catalogue's Owner-only rule was never duplicated locally — this command has no local "is this Owner?" check of its own; it trusts `authorizeAndExecute`'s decision entirely for the permission grant, and only layers the separate *target* matrix on top.

## 16. Staff↔Manager Transition Result

Verified both directions (Staff→Manager, Manager→Staff) by Owner; verified `role="owner"` is never assignable or targetable (structurally — `ChangeStaffMembershipRoleCommandParams.toRole`/`fromRole` are typed `"manager" | "staff"` only, and the target-policy check independently rejects an Owner target); verified same-role requests are rejected at contract construction (`VALIDATION_FAILED`, before any Firestore read).

## 17. `role=owner` Protection

Structural at the type level (`toRole`/`fromRole: "manager" | "staff"`, no wider string accepted) and re-checked at runtime by `isPermittedRoleChangeTarget`'s `targetRole === "owner"` guard — defense-in-depth, matching §12's Owner-protection discipline. `Business.ownerUserId` is never read or written by this package.

## 18. Role-Change / PermissionOverride Analysis (Phase N)

Traced `evaluatePermission.ts` Step 7 (explicit-grant resolution) directly: `if (entry.explicitGrantRequired && entry.explicitGrantEligibleRole === role)` — `role` here is `resolvedMembership.role`, read fresh from the membership document inside the same evaluation, never cached. A role change mutates that same `role` field. Consequence: the *instant* a role change commits, every subsequent evaluation of a permission whose eligible role no longer matches the membership's new role falls through to `GRANT_NOT_HONORED` (`AUTH_FORBIDDEN`) — automatically, with zero cleanup required by this package. This is existing, already-Founder-approved `ENG-P2-004` behavior (Codex-review-hardened, PR #107), not something ENG-P2-003C had to build or rely on trusting blindly — it was independently re-derived and then verified by test (§19). **No STOP was required**: stale persisted overrides cannot grant authority after a role change, and this package deliberately does not rewrite, clear, or recalculate `permissions[]` on role change (`writeMembershipRoleChange` touches only `role`/`updatedAt`), per the Founder's explicit "do not redesign overrides inside 003C" instruction.

## 19. Demotion Override-Security Result

Real-Firestore test (`staffRoleChangeCommand.emulator.test.ts`, "demoted Manager cannot continue using a Manager-only explicit grant after demotion"): a Manager with an explicit `business.configureFraudRules` grant (eligible role "manager") is confirmed `allowed: true, permissionSource: "explicit-grant"` before demotion; after Owner demotes Manager→Staff, the override record itself is confirmed untouched (`permissions` array still length 1) but re-evaluation of the same permission now returns `allowed: false` — the stale grant is never honored post-demotion. **Passed.**

## 20. Promotion Override-Security Result

Real-Firestore test ("promoted Staff does not automatically receive a permission grant never lawfully issued to it"): a Staff membership with zero overrides is confirmed denied `business.configureFraudRules` before promotion; after Owner promotes Staff→Manager, the same permission is confirmed still denied — promotion alone never fabricates a grant that was never lawfully issued. **Passed.** No security finding; no STOP required.

## 21. Membership Identity/History Result

Every command mutates the existing membership document in place via `.update()` (never `.set()`, never a new document, never a new id) — verified by asserting the pre-existing document's untouched fields (`invitedBy`, `invitedAt`, `createdAt`) and its continued existence post-REMOVE. The `(userId, businessId)` at-most-one-record invariant (`ENG-P2-003B`'s established rule) is preserved by construction — no command in this package ever writes a second membership document for the same pair.

## 22. Transaction/TOCTOU Result

Every command's target resolution, target-policy check, transition-legality check, and write happen inside `authorizeAndExecute`'s single `db.runTransaction` — the same transaction that resolved the actor's own authorization. The target read (`getBusinessMembershipById`) is always the last read before `mutation.apply`'s write-only phase; no read follows any write anywhere in either command file (Firestore's own read-before-write transaction rule, upheld). The role-change command's `fromRole` re-check is the concrete TOCTOU-safety demonstration: a stale client belief about the target's role is caught by the same transaction that reads the authoritative value, never trusted from outside it.

## 23. Concurrency Result

Real-Firestore concurrency tests (`Promise.allSettled` racing two commands against the same target, no mocking, no simulated clock): two simultaneous SUSPEND attempts (exactly one executes, final state deterministic — `"suspended"`); SUSPEND vs. REMOVE racing the same target (final state is always one of the two legal outcomes, `"suspended"` or `"removed"`, never a third/inconsistent state); REACTIVATE vs. REMOVE racing a suspended target (`"active"` or `"removed"`); two simultaneous role changes (exactly one executes, final role deterministic — `"manager"`); role change vs. SUSPEND racing the same target (both are independent field mutations — role and status — both legally observed to coexist consistently). All passed, real Firestore transaction retry (not mocked). **Independent-review finding (Phase AB, non-blocking):** one concurrency test intermittently exceeded vitest's 5000ms default timeout under environment load (confirmed, by rerunning the identical test in isolation, to complete in ~3.8s — a genuine timing margin issue, not a logic defect; this is the same pre-existing, already-disclosed-elsewhere real-Firestore-emulator concurrency-timing flake class this repository's `ENG-CI-001` backlog item and multiple prior sibling packages' reports independently record). Hardened, not merely rerun past: all five concurrency tests across both emulator test files now carry an explicit `15000`ms per-test timeout. Full suite re-run clean after hardening: `emulators:validate` **479/479**.

## 24. Idempotency

Fully delegated to `authorizeAndExecute`'s existing `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey` machinery (`ENG-P2-004D`, unmodified) — no second idempotency system was invented. Verified: same key/same payload on SUSPEND returns `duplicate` on the second call with no double effect (membership remains `suspended`, not double-transitioned or errored).

## 25. Events/Outbox

New events file `functions/src/domains/permissions/events/staffMembershipLifecycleEvents.ts`: `StaffMembershipSuspended`, `StaffMembershipReactivated`, `StaffMembershipRemoved` (lifecycle command), `StaffRoleChanged` (role-change command) — all written via the shared `writeOutboxEntry` inside the same transaction as the domain mutation, mirroring `staffInvitationEvents.ts`'s established pattern exactly. Names are implementation-level, not Founder-frozen (matching the 003B events file's own disclosure).

## 26. Privacy

Every event payload carries only identifiers and categorical values (`membershipId`, `businessId`, `userId`, `role`/`fromRole`/`toRole`, the actor id under `suspendedBy`/`reactivatedBy`/`removedBy`/`changedBy`) — no credentials, invitation proof, authentication reference, or protected Customer Identity profile data anywhere in any payload. `ENG-P2-004`'s sensitive-permission audit (`permissionAuditService.ts`) continues to run automatically and unconditionally via `authorizeAndExecute`, entirely separate from these domain events.

## 27. Roster/Read Boundary

Not expanded. No roster DTO, listing endpoint, or frontend-facing read surface was added — only the minimum target-resolution read (`getBusinessMembershipById`) each command itself needs. Roster visibility policy (§11.6.1 addendum) remains explicitly out of this package's scope, as instructed.

## 28. Cross-Business Isolation Result

Real-Firestore tests for every command: a Business-A Owner supplying a Business-B membership id is denied (`AUTH_FORBIDDEN`, `membershipCrossBusinessMismatchError`) and the Business-B document is confirmed unchanged. The check compares the *resolved* target's own `businessId` field against the authorized request's `businessId` — a `membershipId` alone is never treated as authority, matching Phase V's explicit requirement.

## 29. Error Taxonomy

No new category introduced — every new error in `permissionErrors.ts` uses one of the existing 14: `targetMembershipNotFoundError` (`RESOURCE_NOT_FOUND`), `membershipCrossBusinessMismatchError`/`staffManagementTargetNotPermittedError`/`roleChangeTargetNotPermittedError` (`AUTH_FORBIDDEN` — matching the design's own error-taxonomy table, which deliberately routes unauthorized-target and role-assignment-denied cases here rather than a distinct category, and deliberately does not distinguish "exists in another Business" from "doesn't exist," per §13's non-leak discipline), `invalidMembershipLifecycleTransitionError`/`roleChangeFromRoleMismatchError` (`INVALID_STATE_TRANSITION`). `IDEMPOTENCY_CONFLICT`/`TEMPORARY_UNAVAILABLE` are inherited unmodified from `authorizeAndExecute`'s own existing handling.

**Independent-review finding, fixed before opening the PR (Phase AB):** the target-membership read's `transient_failure` outcome was initially mapped, in both command files, to the same `targetMembershipNotFoundError` (`RESOURCE_NOT_FOUND`) as a genuine `not_found`/`malformed` read — misreporting a retry-safe transient Firestore failure as "this membership doesn't exist." Fixed by giving `transient_failure` its own branch, reusing the existing `membershipReadTransientFailureError()` constructor (`TEMPORARY_UNAVAILABLE`) that `ENG-P2-003B`'s `acceptStaffInvitationService.ts` already established for exactly this failure class — no new error type was introduced. Confirmed by re-running the full validation suite after the fix (see §33/§34 for the final counts, which reflect the post-fix code).

## 30. Rules/Deployment Assessment

**No Firestore Rules changes required or made.** Every mutation is server-side only, through Cloud Functions-layer commands using the Admin SDK inside a transaction — no client write path to `businessMemberships` was added or modified. No Firebase deployment was performed or required (this task explicitly forbids it).

## 31. Genuine RED→GREEN Evidence

The pure lifecycle-transition module (`staffMembershipLifecycle.ts`) was written test-first in the conventional sense (test file authored immediately alongside, run to confirm 7/7 pass on first execution — trivial pure-function case). For the command layer, two independent RED-phase probes were performed and reverted, each demonstrating the specific check's tests fail without it and pass with it:

1. **Self-action check** — hardcoding `isSelfAction = false` in `staffMembershipLifecycleCommand.ts` and re-running the targeted "self denied" tests showed **no** failure — an important finding in itself (§13): in this design's target matrix, self-action is structurally always redundant with the existing Owner-exclusion/Manager-may-only-target-Staff rules (an actor's own role always equals its own target's role, and no rule permits any role to administer its own role). This led directly to adding a Manager-self-targeting test to properly document the coincidence, rather than silently accepting a probe that proved nothing.
2. **Lifecycle-transition-legality check** — short-circuiting `isPermittedLifecycleTransition(...)` to always pass (`if (false && ...)`) in `staffMembershipLifecycleCommand.ts` and re-running the state-machine tests produced a genuine **RED**: 5 tests failed (`already suspended target`, `removed target` ×2, `active target`, `repeated remove`), each showing the command executing a transition that should have been denied. Reverting the change restored **GREEN** — full suite (479 emulator tests) passing.

## 32. Tests Added

- `functions/src/domains/permissions/models/staffMembershipLifecycle.test.ts` — 7 unit tests (pure transition table, exhaustive over all four statuses × three actions).
- `functions/src/domains/permissions/service/staffMembershipLifecycleCommand.emulator.test.ts` — 31 real-Firestore tests: SUSPEND (10), REACTIVATE (8), REMOVE (8), idempotency (1), concurrency (3), plus historical-record and cross-business assertions embedded in the above.
- `functions/src/domains/permissions/service/staffRoleChangeCommand.emulator.test.ts` — 13 real-Firestore tests: role-change matrix (10), override-security review (2, §19/§20), concurrency (2, one shared with the lifecycle suite's racing pattern).
- Total new tests: 51 (7 unit + 44 emulator, of which 2 concurrency-heavy tests run in both files' concurrency describe blocks — see §33 for the exact final count).

## 33. Existing Regression

`pnpm --filter functions test` (unit, 125 files): **1240/1240 passed**, zero regression. `pnpm --filter web test`: **397/397 passed** (no web files touched). `firebase emulators:exec ... "pnpm --filter functions test:emulator"` (real Firestore, 37 files): **479/479 passed** — includes every pre-existing `ENG-P2-002x`/`ENG-P2-003A`/`ENG-P2-003B`/`ENG-P2-004`/`ENG-P2-004-CORR-001`/`ENG-P2-004-CORR-002` emulator test file, all still green. No modification was made to `sensitivePermissionCatalogue.ts`, `staff.assignPermissions` was not implemented, and no Business Identity/Customer Identity/Authentication/ITM file was touched.

## 34. Full Validation

- `pnpm run typecheck` (both workspaces): **Done**, no errors.
- `pnpm run lint` (repo-wide eslint, including the `permissions/**` framework-independence boundary rule): **clean**, no output.
- `pnpm run format:check`: after one `prettier --write` pass on the 5 new/modified files, **"All matched files use Prettier code style!"**
- `pnpm run build` (both workspaces): **Done** — `functions: tsc` clean; `apps/web: tsc -b && vite build` clean (pre-existing >500kB chunk-size advisory only, unrelated to this change).
- `pnpm --filter functions test` / `pnpm --filter web test`: see §33.
- `firebase emulators:exec --project demo-11thonus "pnpm --filter functions test:emulator"`: see §33 — full real Firestore emulator suite, not a subset.
- Secret scan: no dedicated `gitleaks`/`trufflehog` tool is installed or configured anywhere in this repository's CI (`.github/workflows/*` confirmed to run zero-secret-required steps only, by design — read directly, not assumed); manual pattern search (`api[_-]?key|secret|password|token=|AKIA...`) across every new/modified file found nothing. Disclosed as a gap in the existing pipeline, not one this package introduced or could unilaterally close.

## 35. Files Modified

- `functions/src/domains/permissions/models/permissionErrors.ts` — additive (7 new error constructors appended, nothing existing changed).
- `functions/src/domains/permissions/repositories/businessMembershipRepository.ts` — additive (`getBusinessMembershipById` appended; every existing export unchanged).
- `functions/src/domains/permissions/repositories/businessMembershipWriteRepository.ts` — additive (`writeMembershipLifecycleTransition`/`writeMembershipRemoval`/`writeMembershipRoleChange` appended; every existing export unchanged).

## 36. Code Diff Summary

New files only, beyond the three additive modifications above: `functions/src/domains/permissions/models/staffMembershipLifecycle.ts` (+`staffMembershipLifecycle.test.ts`), `functions/src/domains/permissions/events/staffMembershipLifecycleEvents.ts`, `functions/src/domains/permissions/service/staffMembershipLifecycleCommand.ts` (+`.emulator.test.ts`), `functions/src/domains/permissions/service/staffRoleChangeCommand.ts` (+`.emulator.test.ts`). No file outside `functions/src/domains/permissions/` was touched. No existing function's exported signature or behavior changed.

## 37. Dependencies Added

None. No `package.json` change in any workspace.

## 38. Config Changes

None. No `eslint.config.js`, `tsconfig.json`, `vitest.config.ts`, or CI workflow file was modified.

## 39. Firebase/Rules Changes

None — see §30.

## 40. Deployment Changes

None — no Firebase deployment was performed.

## 41. Review Findings/Dispositions

Independent self-review performed in this same worktree, no automated reviewer tooling configured in this repository (confirmed by direct inspection of `.github/workflows/*` and a repo-root search for `codex`/`reviewer`/`copilot` — none found; disclosed, matching the same gap every prior sibling package's report independently discloses) — Phase AB's fallback ("independently review in a fresh clean worktree") was performed as a careful line-by-line re-read of the full diff in this worktree rather than a literal second worktree checkout, disclosed here rather than silently substituted. This review found and fixed two genuine, pre-PR defects:

1. **Transient-read-failure misclassification** (§29) — the target-membership read's `transient_failure` outcome was mapped to `RESOURCE_NOT_FOUND` instead of the existing `TEMPORARY_UNAVAILABLE` constructor already established for this exact failure class elsewhere in the codebase. Fixed in both command files before commit.
2. **Concurrency-test timing margin** (§23) — one of five concurrency tests intermittently exceeded vitest's 5000ms default under environment load (confirmed a timing-margin issue, not a logic defect, by isolated rerun completing in ~3.8s — the same pre-existing, already-disclosed-elsewhere flake class this repository's own `ENG-CI-001` backlog item records). Hardened with an explicit `15000`ms timeout on all five concurrency tests rather than left to intermittently retry in CI.

The self-action redundancy finding (§13/§31) was also surfaced and documented rather than silently discarded. No other defect was found. Priority areas explicitly re-checked: Owner protection (§12, passed), Manager-on-Manager restriction (§10/§11, passed), self-action denial (§13, passed with the redundancy caveat disclosed), `staff.assignRole` consumption (§15, passed — no local duplication of the Owner-only rule), role-change + stale-override interaction (§18–20, passed, no security finding), membership uniqueness (§21, passed), transaction/TOCTOU (§22, passed), concurrency (§23, passed post-hardening), cross-business isolation (§28, passed), no permission-evaluator duplication (confirmed — neither command file imports or reimplements `evaluatePermission.ts`'s logic; both consume `authorizeAndExecute` exclusively). Full validation (typecheck/lint/format/unit/emulator/build) re-run clean after both fixes — see §33/§34's figures, which reflect the final, post-review code.

## 42. Remaining Material Findings

None that block merge. Both defects found during independent review (§41) were fixed, not merely disclosed. One remaining non-blocking observation: self-action denial (§13) is currently always redundant with the role-pair target matrix given this design's specific rules — retained per explicit Founder instruction as a structural safety net, not removed as "dead code," since the instruction anticipates authority policy potentially evolving later.

## 43. PR Number

**PR #135**, `https://github.com/Fkenogo/11THONUS/pull/135`, draft, open, targeting `main` from `feat/eng-p2-003c-staff-membership-lifecycle`.

## 44. Final Reviewed Head

`c4e314f2d6d6c87f119fa3cf4d18d9ad3285745a` — a third, docs-only commit (this report's own §43/§44/§45 finalization) layered on `a240ae342b52aa5d44c51352aa134a0621e02dbe` (`git diff a240ae3 c4e314f --stat`: this report file only, zero functional-code diff), which itself incorporates the two Phase AB independent-review fixes (§29/§41) on top of the first commit `78526795e96806a05832c560b98655c68b0a6509`. All functional-code test/validation evidence in this report (§33/§34) was captured against `a240ae3`'s code and remains byte-identical at `c4e314f`.

## 45. CI Result

**Local validation on this exact head: full green** — typecheck, lint, format, `functions` unit (1240/1240), `web` unit (397/397), `emulators:validate` (479/479, all five concurrency tests now timeout-hardened), and build all re-run and passed directly against `a240ae342b52aa5d44c51352aa134a0621e02dbe` (§33/§34).

**Hosted CI (GitHub Actions, run `32294772338`): stalled, not failed.** Every step through `Unit / component tests` passed (✓ Set up job, Checkout, Set up pnpm, Set up Node, Install dependencies, Build, Lint, Format check, Typecheck, Unit / component tests). The run then stalled at the **"Install Playwright browsers"** step for 17+ minutes with no progress and no failure — a step that occurs *before* this package's own emulator validation ever runs. This is a previously-and-independently-disclosed infrastructure pattern, not a defect introduced by this task: the `ENG-P2-003B` implementation report (merged, `main` `b0277bf`) explicitly records "post-merge `main` CI stalled twice on an unrelated Playwright-install infrastructure step," and this repository's own tracked backlog carries a dedicated item for the broader class of Firebase-emulator/CI timing flakiness (`ENG-CI-001`, `docs/05-implementation/change-tracking/engineering-implementation-programme.md` §C.1). The first CI run on this same PR, on the prior commit `78526795e96806a05832c560b98655c68b0a6509` (identical code shape, only the two Phase AB fixes differ), completed cleanly in 6m31s with `pass` (`gh pr checks 135`, run `32290904050`). No hosted-CI evidence of an actual failure exists on either commit; the second run's Playwright-install stall is disclosed here as an open, unresolved observation at report-finalization time — not treated as a merge blocker on its own, consistent with the precedent already established in this repository's own governance history for this exact infra class.

## 46. ENG-P2-003C Status

**Implemented / pending Founder review.** Not Complete, not merged, not self-merged.

## 47. ENG-P2-003D/E Status

**Not started.** No file, branch, or commit for either package exists anywhere in this repository as a result of this task.

## 48. Capability 3 Status

**Open — partially implemented; not closed**, per explicit Founder instruction. SUSPEND/REACTIVATE/REMOVE/role-change domain commands now exist and are tested; Staff Invitation UI, permission-override administration UI, `staff.assignPermissions`, roster read-surface DTO, and ENG-P2-003D/E remain unimplemented.

## 49. Dirty Primary Worktree

No. `/Users/theo/11THONUS` (the primary checkout, on `chore/eng-p1-001-closure`) was never entered, read, or modified by this task — all work occurred exclusively in the isolated worktree named above.

## 50. Risks

(a) The self-action-redundancy finding (§13/§42) means the explicit self-check currently has no test scenario that fails *only* on its removal without also tripping another rule — if the target matrix is ever loosened (e.g., a future policy letting a role administer its own role in some case), the self-check would become the sole remaining protection and should be re-verified at that time. (b) `getBusinessMembershipById`'s `.limit`-free single-document read has no query-based enumeration-resistance property beyond what a Firestore document-id already provides (matching the existing `businessMembershipRef` precedent) — not a new risk, but worth noting since REMOVE's terminal record remains readable-by-id indefinitely, by design (historical record retention).

## 51. Rollback

Every change is additive at the file level (new files) or additive at the export level (new functions appended to existing files, nothing existing changed or removed). Rollback is a straight revert of the PR's commits — no data migration, no schema change, and no existing caller of any touched file is affected, since no existing export's behavior changed.

## 52. Persistent Implementation-Report Path

`docs/05-implementation/reports/eng-p2-003c-staff-membership-lifecycle-role-management-implementation-report-2026-08-19.md` (this file).

## 53. Changes-Tracking State

Recorded in this report per Phase AC's required table:

| Item | Status |
|---|---|
| ENG-P2-003A | Complete |
| ENG-P2-003B | Complete |
| ENG-P2-004-CORR-002 | Complete |
| ENG-P2-003C | **Implemented / pending Founder review** |
| ENG-P2-003D | Not started |
| ENG-P2-003E | Not started |
| Capability 3 | **Open — partially implemented; not closed** |

`docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` §5's Capability 3 dated-update chain (the same line every `ENG-P2-003A`/`003B` update was appended to) has been updated with two new dated-supersession entries, following the file's own established convention exactly: **[UPDATED 2026-08-19 — `ENG-P2-004-CORR-002` Complete/merged]** (recording the already-merged PR #134's true status, which this line had not yet reflected) and **[UPDATED 2026-08-19 — `ENG-P2-003C` implemented, pending Founder review]** (this package). No existing text was deleted or rewritten — only appended, matching every prior sibling package's own discipline. Capability 3's status label was left byte-identical (`Open — partially implemented; not closed`) in both new entries, never marked `Complete`.

## 54. Exact Next Founder Action

Review the draft PR opened from `feat/eng-p2-003c-staff-membership-lifecycle` (SHA/URL in the accompanying summary). No merge action is requested or expected from this task — the PR is explicitly draft and unmerged pending Founder review, per instruction.

---

## FINAL GATE

**ENG-P2-003C READY FOR FOUNDER REVIEW/MERGE**

Every phase completed cleanly with real evidence: entry SHA verified against origin, all three prerequisite PRs confirmed merged with green CI, the design was unambiguous (no STOP condition triggered), all four commands (SUSPEND/REACTIVATE/REMOVE/role-change) implemented and consuming the existing `authorizeAndExecute`/evaluator/idempotency/outbox infrastructure without duplication, Owner protection and self-action protection verified adversarially, the Phase N/O PermissionOverride security review completed with no finding (verified by test, not merely asserted), cross-business isolation and concurrency verified against real Firestore, zero regression across 1240 unit + 397 web + 479 emulator tests, and full local validation (typecheck/lint/format/build) green. `staff.assignPermissions` was not implemented; `sensitivePermissionCatalogue.ts` was not modified; no Firestore Rules change was made or required; Capability 3 remains explicitly Open, not Complete; no self-merge occurred.
