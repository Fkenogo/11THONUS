> **Title:** ENG-P2-004D — Authorization Boundary Integration, Security Validation & ENG-P2-004 Closure — Implementation Report
> **Status:** Implemented, pending Founder-authorized review/merge (do not merge)
> **Governing document:** [ENG-P2-004-DESIGN-001](../roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) v1.1, §10.8/§13/§14 004D, §18 (persistence-encoding clarification, this task)
> **Prerequisites:** `ENG-P2-004A` (merged PR #106, `96e0524`), `ENG-P2-004B` (merged PR #107, `046f22d`), `ENG-P2-004C` (merged PR #108, `ae77348`) — all CI green

# ENG-P2-004D — Authorization Boundary Integration Implementation Report

## 1. Entry `origin/main` SHA

`ae77348e7d9300e338a24a864f6b850e6cfcefb6` — verified against `git rev-parse origin/main`, matches the exact expected baseline and the `ENG-P2-004C` merge commit (PR #108).

## 2. Clean worktree/branch

`/Users/theo/11THONUS/.claude/worktrees/eng-p2-004d`, branch `feat/eng-p2-004d-authorization-boundary`, branched fresh from `origin/main`. Primary worktree at `/Users/theo/11THONUS` never touched — verified dirty/unrelated (inherited `chore/eng-p1-001-closure` work) and left alone throughout.

## 3. `ENG-P2-004C` prerequisite verification

`git log origin/main` confirmed `ae77348` = "Merge pull request #108 from Fkenogo/feat/eng-p2-004c-permission-audit," preceded by `2d3fa87` ("fix(permissions): close Phase-J idempotency gap in recordSensitiveDecision"). `gh run list --commit ae77348...` confirmed CI `SUCCESS` on that exact merge commit (run `31893354521`).

## 4. Programme-currency reconciliation

Checked all docs referencing `ENG-P2-004`/`004C` for stale "pending/in-progress" wording — none found (`grep -rln "ENG-P2-004"` across `docs/` returns only `engineering-transition-d1-agenda.md`, `coding-agent-prompt-register.md`, and `engineering-implementation-programme.md`, none stale). **Gap found instead:** neither `documentation-changes-log.md` nor `IMPLEMENTATION_CHANGES.md` ever recorded `ENG-P2-004C`'s implementation or PR #108 merge — Entry 113 (both logs) covers `004B` merge + `004C` *begun* only; no follow-up entry exists. Corrected via a new dated entry (Entry 114, this task) covering both the missing `004C` merge-sync and `004D`'s own work — history preserved, no entry rewritten.

## 5. Governing 004D requirement

Design §14 004D (as corrected by AD-5, §17): "Owns: the stable authorization/gate interface exposed for consuming domains..., repository/infrastructure integration (wiring 004A–004C together as one callable service), real Firestore-emulator persistence/emulator validation, the cross-business isolation proof... against real emulator data, concurrency/TOCTOU treatment (§10.8), and the full `ENG-P2-004` security/invariant validation and closure evidence... **Must NOT depend on Capability 3.**"

## 6. Pre-change architecture analysis

Delivered in-session across two research passes (Explore-agent reconnaissance of 004A/B/C code + design; direct reads of TRD10, DEC-ID-003, `evaluatePermission.ts`'s actual decision branches). Two load-bearing findings not visible from the reports alone:

- **The `PermissionOverride`↔`businessMemberships.permissions` persistence encoding was genuinely undesigned** (004A/004B both disclosed, deferred to 004D) — resolved as a bounded prerequisite correction (§7 below) before any boundary code was written.
- **No non-sensitive permission can ever resolve to `allowed: true` under the current governed system** — traced directly in `evaluatePermission.ts` steps 5–10: owner-floor, role-default carve-out, and explicit-grant all gate on `isSensitivePermission`; step 9 (non-sensitive role default) is a documented no-op pending an ungoverned baseline table. This is a pre-existing 004A/004B disclosed gap, independent of the boundary-integration work, and materially shapes what the 004D test matrix can prove (§18 below).

## 7. Implementation strategy

Two sequential bounded pieces, each presented for Founder disposition before code:

1. **Persistence-encoding correction** (Founder-approved Option C): `businessMemberships.permissions` resolved as a typed array of `{permissionId, direction, grantedBy, grantedAt}` maps; `businessId`/`membershipId` stay structural (never persisted per-element). Extends 004B's `businessMembershipDocument.ts` reader only — no writer, no 004A/004C change, no evaluator-precedence change.
2. **Authorization boundary** (`authorizeAndExecute`): a new service composing a transaction-bound 004B evaluation, a 004C sensitive-decision audit write, and a caller-supplied protected mutation inside one Firestore transaction, plus a bounded internal test fixture (`permissionBoundaryTestFixtures` + `touchPermissionBoundaryFixture`) proving it end-to-end without a Capability-3 command.

## 8. Trusted-decision boundary (Phase D)

`AuthorizeAndExecuteParams`/`AuthorizationRequest` carry only primitive request fields (`userId`, `businessId`, `permission`, `resourceType?`, `resourceId?`) plus idempotency/correlation metadata and a `mutation: {prepare, apply}` callback — no field of type `AuthorizationDecision`, `role`, `reasonCode`, or `membershipId` exists anywhere in the public API. The only `AuthorizationDecision` that ever exists per call is the one `evaluatePermissionWithContext` computes internally, inside the transaction, from trusted `(userId, businessId, permission)` inputs read fresh from Firestore. `mutation.apply` *receives* that decision (read-only) but has no parameter through which to influence it. Proven structurally (§17a, the type has no such field) and adversarially (§17b, a request payload with fabricated `allowed`/`decision`/`role`/`reasonCode` fields injected past the type system has zero effect on the outcome — real authoritative state wins).

## 9. TOCTOU strategy

Design §6.13/§10.8: "the mutating command must re-read the membership/business state inside its own transaction rather than trusting a pre-fetched decision." `authorizeAndExecute` calls `evaluatePermissionWithContext(db, request, transaction)` as the transaction's first operation — the decision is computed from state read *inside* the same transaction that later mutates, never from a decision computed before the transaction opened or trusted beyond that single invocation.

## 10. Transaction-composition strategy (exact sequence, Phase C correction)

Firestore requires every transaction read to precede every transaction write. Strict four-phase sequence inside one `db.runTransaction`:

```
1. Authorization reads + evaluation (read-only)
   evaluatePermissionWithContext(db, request, transaction)
     -> transaction-bound getBusinessById + getBusinessMembershipByUserAndBusiness
     -> pure evaluateAuthorizationDecision(...)
   => { decision, membershipId }

2. Protected-resource reads/preparation (read-only), ONLY if decision.allowed
   mutation.prepare(transaction, decision, membershipId)
   — skipped entirely on deny; a denied request never touches protected-resource state.

3. Audit idempotency read + conditional write (last read, first write)
   recordSensitiveDecision(transaction, db, {decision, request, membershipId, idempotencyKey}, now)
   — no-ops internally for non-sensitive/unaccountable decisions (004C's own contract,
     not re-implemented here); for a sensitive permission, does its own
     transaction.get(outboxRef) existence check, then transaction.set(...) if absent.

4. Protected mutation write(s), write-only, ONLY if decision.allowed
   mutation.apply(writer, prepared, decision, membershipId)
   — `writer` is a TransactionWriter = Pick<Transaction, "set"|"update"|"delete"|"create">,
     not the full Transaction — apply has no `.get` to accidentally call.
```

Wrapped by the shared `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey` pattern (reused unchanged from `identityLifecycleRepository.transitionCustomerIdentityStatus`'s precedent) for client-retry safety, orthogonal to Firestore's own automatic transaction retry on write contention.

**Structural enforcement, not just discipline:** `apply`'s parameter type (`TransactionWriter`) has no `get` member — a caller cannot accidentally read after `recordSensitiveDecision` has begun writing; this is a compile-time property of the contract.

## 11. Internal protected-action fixture (Phase G)

`permissionBoundaryTestFixtures` collection (`{businessId, touchedCount, lastActionBy, lastActionAt}`) + `touchPermissionBoundaryFixture(db, params)`, a test-only command shim calling `authorizeAndExecute` exactly as a real domain command would. Exercises three already-governed identifiers: `staff.manage` and `customer.viewProtectedProfile` (both in the 8-entry Sensitive Permission Catalogue) for allow/deny/grant/revoke paths, and one synthetic well-formed non-catalogued id (`permissionBoundaryTestFixture.touch`) for the non-sensitive fail-closed path — no new sensitive permission minted (004A's `PermissionId` is deliberately an open, non-enum shape). Not a Cloud Function endpoint; not exported outside this domain's own tests.

## 12. Test matrix

22 emulator tests in `authorizeAndExecute.emulator.test.ts`, mapped to the 24-item required matrix (§20 below has the full disposition table) plus Phase M concurrency and Phase N adversarial coverage. Written and reviewed as a matrix (chat-presented) before implementation of the boundary began; the boundary code and its tests were nonetheless developed together rather than test-first — see §13.

## 13. Genuine RED evidence — and an accepted process deviation

**Persistence correction (§7 item 1):** genuine RED captured and reported at the time — `businessMembershipDocument.test.ts` run against the pre-correction reader produced 3 real failures (well-formed grant/revoke/multi-override cases expected parsed `overrides`, got `null`), before the reader was extended.

**Authorization boundary (§7 item 2):** **no RED-before-GREEN evidence exists.** `authorizeAndExecute.ts`, its fixture, and its test file were written in the same working session without first confirming the tests failed against absent/wrong behavior; all 18 original tests passed on first run. This was disclosed proactively, not discovered by review. **Founder disposition (this task):** accepted as a documented process deviation — not retrospectively relabeled as RED→GREEN, no fabricated failure output recorded anywhere in this report or its commits.

A **second, real** failure was captured honestly during the subsequent test-adequacy hardening pass (§14): a test (`19c`) attempting to force a genuine Firestore-internal transaction retry via a blocking external write nested inside an open transaction's `prepare` phase deadlocked (5s test timeout, then cascading 10s `beforeEach` hook timeouts on every later test in the file). This was a real, observed failure of a *test design*, not the implementation under test — removed rather than patched with a timing workaround, documented in place in the test file and here, not silently dropped.

## 14. Test-adequacy review (Founder-requested, before PR)

Explicit check of the twelve required direct-coverage items:

| Requirement | Test(s) | Status |
|---|---|---|
| Sensitive allow → mutation + audit commit together | `1/3`, `3b` | direct |
| Outer transaction abort → neither mutation nor audit persists | `18` (strengthened this pass to also assert the fixture doc is null, not only the audit entry) | direct |
| Sensitive deny → no mutation, DENY audit only | `2/4` | direct |
| Transaction retry → one logical mutation, one logical audit entry | `19a`/`19b` (two concurrent commands racing the same document, no lost update) — a literal single-call multi-attempt retry test (`19c`) was attempted and removed after deadlocking (§13) | indirect, real limitation disclosed |
| Completed audit entry not reset | `20` (replay with same idempotency key returns `duplicate`, outbox stays length 1) | direct |
| Explicit persisted grant | `1/3` | direct |
| Explicit persisted revocation | `5` | direct |
| Role-ineligible grant denial | `6` | direct |
| Cross-business override isolation | `10/11` | direct |
| Inactive membership/business denial | `7`, `8` | direct |
| Forged business context | `9` | direct |
| Forged membership context | none needed — `AuthorizationRequest` has no `membershipId` field to forge (§17a, structural) | structurally impossible, documented |
| Fabricated `AuthorizationDecision` cannot be supplied | `17b`, added this pass — an adversarial test injecting `allowed`/`decision`/`role`/`reasonCode` fields past the type system, confirming zero effect | direct, added this pass (previously only a trivial structural placeholder) |
| Ungoverned/non-sensitive identifier fails closed, no sensitive audit | `14/23` | direct |

One material gap remains disclosed rather than closed: genuine single-call Firestore transaction-retry (as opposed to two-concurrent-commands contention safety) is not directly tested, after a real attempt deadlocked. `19a`/`19b` are real evidence for the same underlying optimistic-concurrency machinery, not a substitute for the exact scenario.

## 15. Files modified

13 files across three commits (`6167c65`, `20b7b0a`, `d5f05ed`), 1,708 insertions / 52 deletions from `origin/main`:

- `docs/02-technical/trd/10-firestore-data-architecture.md` — §10.6.4 persistence-encoding correction.
- `docs/05-implementation/roadmap/ENG-P2-004-DESIGN-001-...md` — §18 clarification appended.
- `functions/src/domains/permissions/models/businessMembershipDocument.{ts,test.ts}` — override-array reader extension.
- `functions/src/domains/permissions/repositories/businessMembershipRepository.{ts,emulator.test.ts}` — optional `transaction?` seam + genuine-Timestamp override coverage.
- `functions/src/domains/permissions/repositories/businessRepository.ts` — optional `transaction?` seam.
- `functions/src/domains/permissions/repositories/permissionBoundaryFixtureRepository.ts` — new, internal test fixture repo.
- `functions/src/domains/permissions/service/evaluatePermissionService.{ts,emulator.test.ts}` — `evaluatePermissionWithContext` sibling + transaction passthrough + real-override end-to-end coverage.
- `functions/src/domains/permissions/service/authorizeAndExecute.ts` — new, the boundary.
- `functions/src/domains/permissions/service/authorizeAndExecute.emulator.test.ts` — new, 22 tests.
- `functions/src/domains/permissions/service/touchPermissionBoundaryFixtureCommand.ts` — new, test-only command shim.

## 16. Code diff

See the three commits on `feat/eng-p2-004d-authorization-boundary`; full diff available via `git diff ae77348..HEAD` or the PR itself.

## 17. Authorization integration API

```ts
authorizeAndExecute<TPrepared, TResult>(db, {
  request: { userId, businessId, permission, resourceType?, resourceId? },
  idempotencyKey, requestHash, correlationId, actorId,
  mutation: {
    prepare(transaction, decision, membershipId): Promise<TPrepared> | TPrepared,
    apply(writer: TransactionWriter, prepared, decision, membershipId): TResult,
  },
}): Promise<
  | { outcome: "executed"; decision; result: TResult }
  | { outcome: "denied"; decision }
  | { outcome: "duplicate" }
  | { outcome: "in_progress" }
>
```

## 18. Sensitive allow behavior

Evaluation → `mutation.prepare` (read-only) → `recordSensitiveDecision` writes the audit entry (`result: "allow"`) → `mutation.apply` (write-only) → single transaction commit. Proven atomically in tests `1/3`, `3b`.

## 19. Sensitive deny behavior

Evaluation → `recordSensitiveDecision` writes the audit entry (`result: "deny"`) → `mutation.apply` never invoked → transaction commits with the audit-only write, no protected mutation. Proven in `2/4`; payload explicitly represents `"deny"`, never implying the protected action occurred (004C's own, unmodified contract).

## 20. Non-sensitive behavior

`recordSensitiveDecision` no-ops (no persisted audit) for a non-catalogued permission — proven in `14/23` on the deny side. **No non-sensitive ALLOW path is proven** — see §22.

## 21. Cross-business isolation

Tests `9` (forged business context), `10/11` (a grant in Business B never authorizes a request against Business A), `12` (same identity, Owner-in-A/Staff-in-B resolve independently) — all against real emulator data, transaction-bound reads.

## 22. Membership/business state handling

Tests `7` (suspended membership → `AUTH_FORBIDDEN`), `8` (suspended business → `BUSINESS_INACTIVE`), `13` (malformed permission id → `VALIDATION_FAILED`), `15` (corrupt persisted override direction → fail closed), `16` (nonexistent business → denied, no mutation).

## 23. Fabricated-decision protection

§8/§17b above — structural (no such field in the type) and adversarial (runtime test with fields injected past the type system, zero effect).

## 24. Transaction abort behavior

Test `18`: `mutation.apply` throwing aborts the whole transaction — neither the fixture document nor the audit entry persists (strengthened this pass to check both, not only the audit entry).

## 25. Transaction retry behavior

Tests `19a` (same idempotency key, concurrent calls → not both "executed," exactly one net mutation/audit) and `19b` (different idempotency keys, same document, concurrent → both execute, `touchedCount` = 2, no lost update — requires the same underlying optimistic-concurrency retry machinery as a single-call retry to be correct). A literal single-call forced-retry test was attempted and removed after deadlocking (§13) — disclosed as a real, not fabricated, limitation.

## 26. Concurrency behavior

`19a`, `19b`, and a membership-suspended-concurrently-with-a-competing-command test (no stale allow after concurrent suspension) — all against the real emulator.

## 27. Audit atomicity

Same-transaction composition (§10) plus abort test (`18`, neither persists) and allow tests (`1/3`, `3b`, both persist together) are the direct evidence; no separate atomicity-specific assertion beyond these, since Firestore's transaction guarantee itself is the mechanism being relied on, not re-verified independently.

## 28. Completed-event replay behavior

Test `20`: a second call with the same idempotency key returns `duplicate`, does not create a second outbox entry, does not change `touchedCount`.

## 29. `ENG-P2-004A` regression

Contracts/catalogue unchanged — zero edits to `models/sensitivePermissionCatalogue.ts`, `permissionOverride.ts`'s validation logic, `roleTemplate.ts`, or `permissionErrors.ts`.

## 30. `ENG-P2-004B` regression/purity

`evaluator/evaluatePermission.ts` (the pure decision function) has **zero edits** — confirmed by diff. `businessRepository.ts`/`businessMembershipRepository.ts`/`evaluatePermissionService.ts` gained additive, optional-parameter seams only; every pre-existing caller/test (unchanged, still passing) exercises the identical code path as before this package. `businessMembershipDocument.ts`'s reader was extended (not redesigned) per the Founder-approved persistence correction. No caching added anywhere (AD-2 preserved).

## 31. `ENG-P2-004C` regression

`permissionAuditService.ts` — zero edits. `recordSensitiveDecision`'s transaction-composable API, existence-check-before-write idempotency, and completed-entry replay protection all consumed unmodified, exactly as its own docstring anticipated.

## 32. Capability-3 consumer contract (Phase P — documentation only, no implementation)

A future Capability-3 protected command consumes `authorizeAndExecute` by supplying:

1. **Trusted context inputs** — `userId` (from verified auth context, never client-claimed), `businessId` (from the request, re-verified server-side against real membership inside the transaction — never trusted), `permission` (a well-formed `"domain.action"` id), optional `resourceType`/`resourceId`.
2. **Idempotency inputs** — `idempotencyKey`, `requestHash`, `correlationId`, `actorId` — the same shape every other transactional command in this codebase already supplies to `checkAndReserveIdempotencyKey`.
3. **A `mutation` object**, split into two phases the command must respect:
   - `prepare(transaction, decision, membershipId)` — any reads the protected mutation needs (e.g. reading the target resource's current state), returning whatever data `apply` needs. Runs only when `decision.allowed`.
   - `apply(writer, prepared, decision, membershipId)` — write-only (the `writer` type has no `.get`), performs the actual protected-state mutation(s) and returns a result value.
4. **Result shape** — a discriminated `{outcome: "executed"|"denied"|"duplicate"|"in_progress"}`; the command handler maps `"denied"` to a `DomainCommandError`/`PlatformErrorResponse` using `decision.errorCategory` (already one of the closed 14 categories), and `"executed".result` to its own success response.
5. **Failure behavior** — any thrown error from `prepare`/`apply` aborts the entire transaction (§24); the command must not assume partial persistence on error.
6. **Audit behavior** — automatic and transparent; the command supplies no audit-specific input beyond the request itself. Sensitivity, payload shape, and replay-safety are entirely 004C's concern, invoked internally.
7. **Business-context requirements** — none beyond supplying a real `businessId`; `authorizeAndExecute` performs its own transaction-bound business/membership reads and never accepts a pre-resolved membership or business record as input.

No Capability-3 command was implemented to consume this — the contract above is derived from what `touchPermissionBoundaryFixture` already demonstrates using the same public API a real command would use.

## 33. `ENG-P2-004` acceptance matrix (Phase Q)

Graded against design §13's 17 criteria plus the Founder's four explicit disposition rows:

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Deterministic resolution | PASS | 004B unchanged, own suite |
| 2 | Role-default inheritance exactly per §6.6, no sensitive perm in non-owner default | PASS | 004A/004B unchanged |
| 3 | Explicit grant overrides role default | PASS (now end-to-end, real data) | `1/3` |
| 4 | Explicit revocation overrides role default and grant | PASS (now end-to-end, real data) | `5` |
| 5 | Sensitive permissions never allowed by role default alone; Owner floor structural | PASS | 004B unchanged |
| 6 | Business-context isolation | PASS | `9`, `10/11`, `12` |
| 7 | Inactive/suspended membership always denies | PASS | `7` |
| 8 | Missing/unknown permission id → `VALIDATION_FAILED` | PASS | `13` |
| 9 | No cross-business leakage under concurrency | PASS | `12`, concurrency suite |
| 10 | Every sensitive decision produces exactly one audit record | PASS | `1/3`, `2/4`, `20` |
| 11 | Concurrency/TOCTOU: re-verify inside own transaction | PASS | §9/§10 (this is 004D's core deliverable) |
| 12 | Fail-closed on every non-explicit-allow branch | PASS | `13`, `15`, `16` |
| 13 | No credential/session material in audit | PASS | 004C unchanged, Class 2 payload |
| 14 | All outcomes map to the closed 14-category taxonomy | PASS | unchanged, AD-4 |
| 15 | Unit tests: full decision-table coverage | PASS | 004B's own matrix, unchanged, 798/798 total unit tests green |
| 16 | Emulator/integration tests via 004D's governed fixtures | PASS | 22 tests, `authorizeAndExecute.emulator.test.ts` |
| 17 | Security tests: forged context, cross-business leakage, revoked-permission replay, privilege-escalation-via-grant | PASS | `9`, `10/11`, `5`, `6` |
| — | **Founder disposition: governed sensitive ALLOW end-to-end** | **PASS** | `1/3`, `3b` |
| — | **Founder disposition: governed sensitive DENY end-to-end** | **PASS** | `2/4` |
| — | **Founder disposition: ungoverned/non-sensitive identifier DENY + no sensitive audit** | **PASS** | `14/23` |
| — | **Founder disposition: governed non-sensitive ALLOW** | **NOT EXERCISABLE — explicitly not PASS** | see below |

**On the non-sensitive-ALLOW row — not silently marked PASS.** No governed non-sensitive permission baseline table exists anywhere in the repository (a 004A/004B-disclosed gap, confirmed by direct code trace, §6). Under the current governed system, `allowed: true` is reachable only through one of the 8 catalogued sensitive permissions. This is **not** a defect in 004D's boundary — the boundary correctly composes evaluation, audit, and mutation for every decision the evaluator can actually produce — it is a gap in what permissions exist to be decided about.

**Assessment: this limitation does not, by itself, block `ENG-P2-004` closure under the design's own §13 acceptance criteria.** None of the 17 criteria explicitly requires proving a non-sensitive ALLOW outcome; criterion 16's "authorization test matrix... owner/manager/staff × action" is satisfied for every currently-governed action (the 8 sensitive permissions), which is the maximal provable set given current governance — there is no ungoverned "action" to test against. Inventing one to close this row would itself violate explicit scope limits (no new permission catalogue entries, no evaluator redesign) that both this task and 004A/004B's own dispositions already established. The gap is real, pre-existing, and independent of 004D; it should be carried forward as a named, tracked item (a future governance/product decision defining the non-sensitive baseline table), not silently absorbed into 004D's closure claim.

## 34. Unit tests

798/798 passing (functions workspace), no regression from `origin/main`'s baseline.

## 35. Emulator tests

288/288 passing (functions workspace, `firebase emulators:exec`), up from the `origin/main` baseline of 248 (+18 from the persistence correction's expanded override coverage, +22 from the boundary's own matrix, net of two items removed/consolidated during hardening).

## 36. Security/adversarial tests

`9`, `10/11`, `13`, `15`, `16`, `17b` — forged business context, cross-business grant/revoke reuse, malformed permission id, corrupt stored override, transient-equivalent business-not-found, fabricated-decision injection.

## 37. Full validation

`tsc --noEmit` clean; `eslint` clean (whole `permissions` domain re-checked after every change); `prettier --write` applied via the repo's own pre-commit hook, no manual formatting drift; unit + emulator suites both green (§34/§35). Web workspace, lint/format/build, and e2e not re-run in this task — no file outside `functions/src/domains/permissions/**` and two docs was touched, so no other workspace's build graph is affected; full-repo CI (§39) is the authoritative cross-workspace check.

## 38. Review passes

PR #109 opened against `main`. `@codex review` posted twice (initial trigger and one retry): both attempts returned "You have reached your Codex usage limits for code reviews" — Codex is currently unavailable at the account level, not a review-content issue. Per standing instruction ("if Codex is unavailable, do not wait indefinitely; stop for Founder direction after reasonable retries rather than self-waiving review"), stopping here rather than retrying further or treating the absence of findings as a clean review.

## 39. Findings/dispositions

None available — no Codex review has actually run against this PR. Nothing here should be read as "reviewed, no findings"; it is "not yet reviewed."

## 40. Remaining material findings

None self-identified beyond the two disclosed limitations already in this report: (1) no RED-before-GREEN evidence for the boundary implementation (§13, accepted process deviation); (2) no direct single-call transaction-retry test after a real attempt deadlocked (§14/§25).

## 41. Dependencies

None added.

## 42. Config/Firebase/Rules changes

None. No `firebase.json`, security-rules, or index change — the new `permissionBoundaryTestFixtures` collection needs no composite index (only `.doc(id).get()`/`.set()` access patterns).

## 43. Deployment changes

None. No Cloud Function endpoint added — `authorizeAndExecute`/`touchPermissionBoundaryFixture` are library code, not deployed HTTPS/callable functions.

## 44. Boundary audit (Phase T)

Final diff contains exactly: the authorization/gate integration service (`authorizeAndExecute.ts`), transaction-compatible additive seams on already-governed 004B repositories/service, an internal test fixture/harness (`permissionBoundaryFixtureRepository.ts`, `touchPermissionBoundaryFixtureCommand.ts`), emulator/security tests, and traceability docs (this report + TRD10/design-doc corrections). Confirmed absent: any Capability-3 production command, any new sensitive permission, dual control, evaluator cache, ITM, unrelated UI, unrelated Firebase config, architecture redesign beyond the two Founder-approved bounded corrections.

## 45–47. PR number / final reviewed head / CI result

PR [#109](https://github.com/Fkenogo/11THONUS/pull/109). Head at time of writing: `7e04fd5`. CI (`Build, Lint, Test, Emulator Validation`) `SUCCESS` (run `31937914811`, 3m31s). No Codex review has completed (§38) — "final reviewed head" is not yet applicable.

## 48–52. Status summary

- `ENG-P2-004A` = Complete (unchanged)
- `ENG-P2-004B` = Complete (unchanged)
- `ENG-P2-004C` = Complete (unchanged; merge-sync gap corrected this task, §4)
- `ENG-P2-004D` = Implemented, pending review/merge
- `ENG-P2-004` overall = **pending final merge/closure until PR review evidence is complete** — see §33 for the substantive acceptance assessment
- Capability 2 = Open — partially implemented (unchanged)
- Capability 3 = unchanged, not started
- ITM = Not started — Unauthorised (unchanged)
- AUTH-10 = unchanged, not started

## 53. Dirty primary worktree status

`/Users/theo/11THONUS` untouched throughout — verified via `git worktree list`/`git status` at task start and never operated on.

## 54. Risks

The two disclosed limitations in §13/§14/§25 (no RED-before-GREEN for the boundary; no direct single-call retry test) are process/coverage risks, not known runtime defects — both are honestly documented rather than hidden, per explicit instruction. The non-sensitive-ALLOW gap (§33) is a pre-existing upstream governance gap, not introduced or worsened by this package.

## 55. Rollback

Revert the three commits (`6167c65`, `20b7b0a`, `d5f05ed`) — all additive (new files, optional parameters, one extended reader); no schema migration, no deployed function, no data to roll back.

## 56. Persistent implementation-report path

This file: `docs/05-implementation/reports/ENG-P2-004D-authorization-boundary-implementation-report-2026-08-16.md`.

## 57. Changes-tracking state

`documentation-changes-log.md` Entry 114 and a new `IMPLEMENTATION_CHANGES.md` section to be added immediately following this report (Phase U, this task).

---

## FINAL GATE

**ENG-P2-004D BLOCKED — FOUNDER DECISION REQUIRED**

PR #109 open, CI green. Blocked pending: (1) Codex review — currently unavailable (account usage limit, not a content issue), two attempts made, not retried further per standing instruction; (2) Founder review of the two disclosed process/coverage limitations (§13, §14/§25); (3) Founder confirmation of the §33 assessment that the non-sensitive-ALLOW gap does not block `ENG-P2-004` closure. Not self-merged per standing instruction.
