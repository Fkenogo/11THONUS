> **Title:** ENG-P2-004B — Permission Evaluation — Implementation Report
> **Status:** Implemented, test-first, pending Founder-authorized review/merge (do not merge)
> **Governing document:** [ENG-P2-004-DESIGN-001](../roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) v1.1, §14 004B; [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-ID-003` (CONFIRMED)
> **Governing test plan:** [ENG-P2-004B-test-matrix-2026-08-15.md](ENG-P2-004B-test-matrix-2026-08-15.md)
> **Prerequisite:** `ENG-P2-004A` — Complete, merged (PR #106, merge `96e052491baa00c55b9c6db170ba1a4e2c85bb14`, CI green)

# ENG-P2-004B — Permission Evaluation Implementation Report

## 1. Entry `origin/main` SHA

`96e052491baa00c55b9c6db170ba1a4e2c85bb14` — verified against `git rev-parse origin/main` at task start, verified as the exact `ENG-P2-004A` merge commit (PR #106, "Build, Lint, Test, Emulator Validation" CI check `SUCCESS`).

## 2. Clean worktree/branch

`/Users/theo/11THONUS/.claude/worktrees/eng-p2-004b`, branched fresh from `origin/main` via the native `EnterWorktree` tool, renamed to `feat/eng-p2-004b-permission-evaluator`. The primary worktree at `/Users/theo/11THONUS` (containing unrelated inherited dirty work) was never read for content, reset, cleaned, rebased, stashed, or committed.

## 3. `ENG-P2-004A` prerequisite verification

- `origin/main` SHA matched the expected `96e0524` exactly.
- PR #106 confirmed merged, `mergeCommit.oid == 96e0524`, CI check `SUCCESS`.
- `functions/src/domains/permissions/models/*` (Role, PermissionId, SensitivePermissionCatalogue, RoleTemplate, PermissionOverride, PermissionDomainError) present and unmodified on `main`.
- No open PR or remote branch contains `004B`/`004C`/`004D` work or any conflicting permission-evaluator code (`git branch -r` audited in full; only PR #34, an unrelated docs PR, was open).

## 4. Governing 004B requirement

Design §14: "004B — Permission Evaluation. Owns: the deterministic evaluator (§6), the Override-Resolution Rule and decision table (§4), business-context isolation (§5.4–5.7), fail-closed decision semantics (§6.10, INV-1/2/3), authoritative-state reads (direct `businessMemberships`/business reads, never cached — §6.12, AD-2), and the security/unit/emulator proofs for the evaluator itself... Acceptance boundary: given real or fixture `businessMemberships` documents, the evaluator produces the correct `AuthorizationDecision` for every §4.2 decision-table row and every §9 abuse case — provable entirely with fixture data, no dependency on any Capability-3 code."

## 5. Pre-change codebase analysis

See the Phase B analysis delivered in-session before implementation (reproduced in full in the PR description). Key finding: `businessMemberships`/`businesses` exist only as TRD10 §10.6.4/§10.6.3 prose — zero repository code existed anywhere in the repo. This was not a missing-architecture gap: the codebase has an established, unambiguous repository convention (plain async functions taking `db` as first argument, e.g. `customerIdentityRepository.ts`), and design §14 explicitly assigns 004B ownership of these reads. No STOP condition was triggered.

## 6. Implementation strategy

One pure decision function (`evaluator/evaluatePermission.ts::evaluateAuthorizationDecision`) implementing design §6.9's algorithm exactly, kept framework-independent (machine-enforced by an eslint `no-restricted-imports` scope), fed by a thin Firestore orchestrator (`service/evaluatePermissionService.ts::evaluatePermission`) that performs the two authoritative reads via two new read-only repositories (`repositories/businessRepository.ts`, `repositories/businessMembershipRepository.ts`), backed by two new document readers (`models/businessDocument.ts`, `models/businessMembershipDocument.ts`).

## 7. Test matrix

[`ENG-P2-004B-test-matrix-2026-08-15.md`](ENG-P2-004B-test-matrix-2026-08-15.md) — 49 cases across categories A–K (authentication, business context, membership, permission identity, role inheritance, overrides, sensitive permissions, precedence, integrity/failure, cross-business isolation, determinism), written and reviewed before any evaluator code existed.

## 8. Genuine RED evidence

`evaluatePermission.test.ts` was written first, importing `./evaluatePermission` and `./types` — neither existed. Running `npx vitest run src/domains/permissions/evaluator/evaluatePermission.test.ts` produced:

```
FAIL  src/domains/permissions/evaluator/evaluatePermission.test.ts
Error: Cannot find module './evaluatePermission' imported from .../evaluatePermission.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

This is genuine RED: 0 tests collected, failure is a clean module-resolution error confirming the required behavior does not exist — not a broken test-environment issue (a prior, unrelated `vitest/config` resolution failure caused by unindstalled dependencies was fixed first via `pnpm install`, and reproduced/ruled out before this RED evidence was captured). Implementation followed immediately after.

## 9. Files modified/created

**Created:**
- `functions/src/domains/permissions/evaluator/types.ts`
- `functions/src/domains/permissions/evaluator/evaluatePermission.ts`
- `functions/src/domains/permissions/evaluator/evaluatePermission.test.ts`
- `functions/src/domains/permissions/models/businessDocument.ts`
- `functions/src/domains/permissions/models/businessMembershipDocument.ts`
- `functions/src/domains/permissions/repositories/businessRepository.ts`
- `functions/src/domains/permissions/repositories/businessRepository.test.ts`
- `functions/src/domains/permissions/repositories/businessRepository.emulator.test.ts`
- `functions/src/domains/permissions/repositories/businessMembershipRepository.ts`
- `functions/src/domains/permissions/repositories/businessMembershipRepository.test.ts`
- `functions/src/domains/permissions/repositories/businessMembershipRepository.emulator.test.ts`
- `functions/src/domains/permissions/service/evaluatePermissionService.ts`
- `functions/src/domains/permissions/service/evaluatePermissionService.emulator.test.ts`
- `docs/05-implementation/reports/ENG-P2-004B-test-matrix-2026-08-15.md`
- `docs/05-implementation/reports/ENG-P2-004B-permission-evaluation-implementation-report-2026-08-15.md` (this file)

**Modified:**
- `eslint.config.js` — rescoped the permissions-domain `no-restricted-imports` Firebase-SDK restriction from the whole directory to `models/` only (excluding the new `repositories/` and `service/` subfolders), matching the Identity domain's own precedent exactly. `evaluator/` remains restricted — the pure decision function stays machine-enforced framework-independent.

No other file changed. No `functions/src/index.ts`, `firestore.rules`, or `firestore.indexes.json` change.

## 10. Code diff summary

~650 lines added across 13 new source/test files plus one 15-line eslint config change. No existing 004A file was modified.

## 11. Evaluator inputs

`AuthorizationRequest { userId, businessId, permission, resourceType?, resourceId? }` (TRD12 §12.12 contract, unchanged).

## 12. Evaluator outputs

`AuthorizationDecision { allowed, reasonCode, errorCategory?, role?, permissionSource?, evaluatedAt }` — matches TRD12 §12.12, extended only with `permissionSource` (design §6.2) and an internal `reasonCode`/`errorCategory` split (§6.11: `reasonCode` is a closed internal enum for logs/audit; `errorCategory` is the existing closed 14-category taxonomy, present only on deny).

## 13. Evaluation order

Implemented exactly per design §6.9: (1) subject present, (2) business-context validated + business-state gate, (3) membership-state gate + business-context isolation check, (4) permission-identifier shape, (5) Owner floor, (6) explicit revocation, (7) explicit grant, (8) sensitive-permission gate (with the §3.2 rows 7–8 role-default carve-out, see §14 below), (9) non-sensitive role/template default, (10) fail-closed deny. No step was reordered.

## 14. Role/template treatment

`SENSITIVE_PERMISSION_ROLE_TEMPLATES` (004A, unmodified) is consulted at two points: the §3.2-rows-7-8 carve-out inside the sensitive gate (step 8) and the generic non-sensitive default (step 9, currently a documented no-op since no non-sensitive baseline table is governed yet — see §21 below).

**Reconciliation note (flagged for Founder attention):** design §4.1 item 6 states role/template defaults satisfy "non-sensitive permissions only," and the generic §4.2 decision-table row states role-default-only for a sensitive permission denies — yet §3.2 rows 7–8 (`customer.viewProtectedProfile`, `report.exportFinancial`) are explicitly marked `inheritAllowed: true` with "Explicit grant required? No (role-default)" for Owner/Manager, and `ENG-P2-004A`'s already-merged `SENSITIVE_PERMISSION_ROLE_TEMPLATES` encodes exactly that carve-out (Owner and Manager both default to these two entries). This implementation treats the merged 004A contract as authoritative for this narrow point — a sensitive permission may be satisfied by role-default only if the catalogue itself marks it inheritable for that specific role — since it is a direct, reviewed transcription of §3.2, not new policy. Every other sensitive permission (§3.3's never-implicitly-inheritable set, rows 1–6) still strictly requires an explicit grant or the Owner floor. This is not a STOP-worthy architecture gap (it resolves an internal textual ambiguity using an already-Founder-approved artifact), but it is called out explicitly here for Founder awareness and review.

## 15. Sensitive-permission treatment

Never allowed by role default alone except the §3.2 rows 7–8 carve-out above; Owner floor (§3.6) is structural — evaluated before any override lookup, never a target of any override (consistent with 004A's `permissionOverride.ts` refusing overrides on Owner memberships).

## 16. Explicit grant treatment

Checked after revocation, before the sensitive gate (§6.9 step 7) — satisfies sensitivity directly, matching §4.1.5. Only overrides whose `businessId`/`membershipId` match the resolved membership are ever consulted (defence-in-depth, §5.6).

## 17. Explicit revocation treatment

Checked before grant and before the sensitive gate (§6.9 step 6) — wins over any simultaneously-present grant record (adversarial "revoked permission replay" test, §9 abuse #3), matching §4.1.3 exactly.

## 18. Override precedence

Revocation > Owner floor is not applicable (Owner floor is evaluated first and is not an override target) > Grant > Sensitive gate > Role default > fail-closed deny. No "most-permissive-wins" path exists anywhere (verified by a dedicated determinism/no-most-permissive-wins test).

## 19. Business-context isolation

Structural: the evaluator's only membership input is the single record resolved for `(userId, businessId)`; a defence-in-depth check additionally denies if a resolved membership's own `businessId`/`userId` fields don't match the request (should be structurally unreachable given the repository's own scoping, but never trusted regardless). Proven via emulator tests: forged cross-business context, same-user-two-memberships independent resolution, no leakage.

## 20. Membership-state handling

Only `status === "active"` passes; `invited`/`suspended`/`removed` all deny uniformly with `AUTH_FORBIDDEN` (AD-4).

## 21. Server-integrity failure handling

Malformed/unrecognized `role` or `status` on a stored membership document, or more than one membership document matching the same `(userId, businessId)` pair (contradictory stored data) → `"malformed"` read result → fail-closed `AUTH_FORBIDDEN` deny (business malformed → `BUSINESS_INACTIVE`). Internal `reasonCode` distinguishes the exact cause for logs; the client-facing `errorCategory` never does (§9 enumeration-resistance).

**Known, explicitly-scoped limitation:** `ENG-P2-004A`'s `permissionOverride.ts` documents that the override *persistence/serialization* mapping (how grant/revoke direction is encoded into TRD10's flat `businessMemberships.permissions: string[]` field) is undesigned and deferred to `ENG-P2-004D`. This implementation honors that deferral: the membership repository reads only the fully-governed structural fields (`id`, `userId`, `businessId`, `role`, `status`) and always returns `overrides: []`; the pure evaluator's override-precedence logic is fully proven against directly-constructed fixtures in `evaluatePermission.test.ts`, but a real Firestore round-trip of a *persisted* override record is not yet possible until 004D resolves the serialization question. This is flagged for Founder awareness, not silently worked around.

**Post-review hardening (review pass 1, PR #107):** the membership reader was additionally hardened so a document with a **non-empty** `permissions` array (state this reader cannot safely interpret — see the limitation above) is treated as `"malformed"` (fail-closed) rather than silently read as `overrides: []`. Only an absent or empty `permissions` array is safe to read as "no overrides."

## 22. Transient failure handling

A thrown Firestore SDK error (network/timeout) in either repository is caught and mapped to `"transient_failure"` → `TEMPORARY_UNAVAILABLE`, proven both at the pure-function level (pre-built union) and at the repository level (mocked `Firestore` that throws) — never surfaces as an uncaught exception, never resolves to allow.

## 23. Error-taxonomy mapping

Uses only the existing closed 14-category taxonomy (`AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `BUSINESS_INACTIVE`, `VALIDATION_FAILED`, `TEMPORARY_UNAVAILABLE`) exactly per design §11/AD-4. A dedicated test asserts every deny outcome's `errorCategory` is a member of the closed set. No new category introduced.

## 24. No-cache verification

Every call to `evaluatePermission` performs fresh Firestore reads; no module-level cache, no memoization, no shared state between calls. Proven by an emulator test that mutates membership status between two sequential calls and asserts the second call reflects the mutation immediately (AD-2).

## 25. Read-only/purity verification

Emulator tests assert zero net document-count change across `businesses`, `businessMemberships`, and `outboxEntries` after evaluation calls, and assert the `outboxEntries` collection remains empty (audit emission is 004C's responsibility, never the evaluator's). The pure decision function additionally has a dedicated non-mutation test (input snapshot equality before/after).

## 26. TOCTOU/004D handoff analysis

Design §10.8 already resolves this: protected mutating commands must re-verify membership/business state inside their own write transaction rather than trust a prior `AuthorizationDecision` beyond the single invocation that requested it. No version/revision/reference field was added to the `AuthorizationDecision` contract — doing so would invite exactly the "reuse a stale decision" anti-pattern §10.8 forbids. This is purely 004D's implementation responsibility; no 004B contract change was needed or made.

## 27. Unit tests

50 tests in `evaluatePermission.test.ts` (§4.2 decision-table rows verbatim, fail-closed/integrity cases, cross-business isolation defence-in-depth incl. business-record identity check, determinism/purity, closed-taxonomy assertion, adversarial revoked-permission replay, grant role-eligibility revalidation, resolved-context-on-denial) + 5 `businessMembershipDocument.test.ts` reader tests + 2 repository-level transient-failure tests. All pass (`npx vitest run src/domains/permissions/` — 166 tests total across the whole permissions domain, including pre-existing 004A tests).

## 28. Emulator tests

19 new emulator tests across three files (`businessRepository.emulator.test.ts`, `businessMembershipRepository.emulator.test.ts`, `evaluatePermissionService.emulator.test.ts`) against real Firestore documents: correct lookup, not-found, malformed (bad role/status, missing status, non-empty unreadable permissions array, contradictory duplicate documents), cross-business isolation (forged context, independent multi-membership resolution), no-cache (mutation-between-calls), and zero-write/zero-outbox-emission proofs. All pass as part of the full `pnpm emulators:validate` run (248/248 functions emulator tests, whole repo).

## 29. Adversarial/security tests

All design §9 abuse cases with an evaluator-level test: forged `businessContextId`, cross-business membership reuse, cross-business override reuse, sensitive-permission-via-role-inheritance denial, revoked-permission replay, malformed permission identifier, malformed stored config (role/status/duplicate), non-active membership (all three states), unknown permission, failed repository read (mocked throw), same-subject/multiple-businesses independent resolution. Owner-role impersonation is proven structurally (role is read exclusively from the server-verified Firestore document; no code path accepts a client-supplied role) rather than by a single named test.

## 30. Full validation

- `npx tsc --noEmit` (functions): clean.
- `pnpm typecheck` (repo-wide, functions + web): clean.
- `npx eslint .` (repo-wide): clean.
- `pnpm format:check` (repo-wide): clean (after `prettier --write` on new files).
- `pnpm -r run build` (functions + web production builds): both succeed; pre-existing `apps/web` chunk-size warning is unrelated/inherited.
- `pnpm emulators:validate` (full Firebase Emulator Suite + `test:emulator`): 248/248 passing across two independent runs post-fix. One transient failure was observed on the very first run when this command was executed concurrently with `pnpm -r run build` in the same terminal session (port contention); an immediate, isolated rerun passed cleanly — documented here as an environmental flake, not a code defect.
- `pnpm test` (repo-wide unit tests, functions + web): 728 functions tests + 397 web tests. One `apps/web/src/App.test.tsx` timing flake was observed in one full-suite run; confirmed unrelated by an isolated rerun (3/3 passing) — no `apps/web` file is touched by this PR.
- No e2e run required (no UI/protected-command surface exists yet — 004D scope).
- No secret/credential scan finding — no credentials, tokens, or PII appear in any new file (verified by inspection; `permissionAuditRecord`-style fields are 004C scope, not present here).

## 31. Review passes performed

Two completed Codex review passes on PR #107, each with genuine findings that were investigated and fixed TDD-first. A third review was triggered (`@codex review` comment posted after the pass-2 fix commit) but had not returned a result within this session's working window; the PR remains open and the trigger is live — the next reviewer/Founder should confirm pass 3's outcome (or re-trigger it) before merge, per this task's explicit instruction not to consider fewer passes sufficient merely because CI is green.

## 32. Review findings/dispositions by pass

**Pass 1** (head `02744bf`): 3 P1 + 1 P2.
1. P1 "Reject unreadable persisted permission state" — **valid, fixed.** A membership document with a non-empty `permissions` array is now `"malformed"` (fail-closed) rather than silently `overrides: []`.
2. P1 "Validate grant eligibility before allowing overrides" — **valid, fixed.** A grant is now revalidated against the catalogue's `explicitGrantRequired`/`explicitGrantEligibleRole` before being honored.
3. P1 "Supply the non-sensitive role-default templates" — **acknowledged, not applied.** Matches 004A's own disclosed scope boundary (`roleTemplate.ts`: "no governed document mints permission identifiers for that non-sensitive baseline") — inventing one here would be exactly the architecture invention out of scope for this task. Documented in code and flagged for Founder attention (see §14/§52).
4. P2 "Preserve resolved context on denied decisions" — **valid, fixed.** Post-membership-resolution denials now carry `role`/`permissionSource: "n/a-denied"`.

Fixed in commit `2fa2b7f`.

**Pass 2** (head `2fa2b7f`): 1 P1 + 2 P2 (new findings; the pass also re-surfaced pass-1's now-fixed comments as stale thread copies, not new findings).
1. P1 "Reject grants for unrecognized permission identifiers" — **valid, fixed.** A grant is now honored only for a sensitive-catalogue permission with an eligible role; any other well-formed-but-ungoverned identifier no longer bypasses the fail-closed default.
2. P2 "Preserve role context for inactive memberships" — **valid, fixed.** Membership-not-active and membership-business-mismatch denials now also carry `role`/`permissionSource: "n/a-denied"`.
3. P2 "Verify the business result belongs to the request" — **valid, fixed.** Added a `business.id` vs `request.businessId` check mirroring the existing membership-mismatch defence-in-depth check.

Fixed in commit `0b3fffb`.

## 33. Remaining material findings

None confirmed-open at the time of this report beyond the one explicitly-flagged, disposed-not-fixed item (pass 1 finding 3 / this report §14/§52: the non-sensitive role-default baseline-table gap, an upstream data/governance gap 004A already scoped out, not a 004B defect). A third review pass was triggered on the fixed head (commit `0b3fffb`) but had not returned within this session — its outcome is unknown and must be checked before this PR is considered ready, per Phase O's explicit "do not consider one review pass sufficient" instruction extended to this incomplete third pass as well.

## 34. Files changed after review fixes

Pass 1: `evaluatePermission.ts`, `evaluatePermission.test.ts`, `businessMembershipDocument.ts` (+ new `businessMembershipDocument.test.ts`), `businessMembershipRepository.emulator.test.ts`.
Pass 2: `evaluatePermission.ts`, `evaluatePermission.test.ts`, `types.ts` (added `BUSINESS_CONTEXT_MISMATCH` reason code).

## 35. Dependencies added

None. No `package.json` change in `functions/` or the repo root.

## 36. Config changes

`eslint.config.js` only (§9 above) — a lint-rule rescoping within 004B's own newly-added subfolders, not a security/build/deployment config change.

## 37. Firebase/Rules changes

None. `firestore.rules` untouched — Admin-SDK emulator tests intentionally bypass Rules (as all existing domain repository tests in this repo already do); no Rules change was made or found necessary. `firestore.indexes.json` untouched — the one compound query (`businessMemberships` where `userId==` AND `businessId==`, both equality, no orderBy) does not require a composite index.

## 38. Deployment changes

None.

## 39. Boundary audit

**Implemented:** evaluator (pure decision function + orchestrator), deterministic precedence, fail-closed authorization decisions, the two read-only repository/reader pairs the evaluator needs, unit + emulator + adversarial tests.

**NOT implemented (confirmed via `git status`/`git diff --stat` — no other file touched):** 004C outbox/audit emission (no `outboxEntries` write anywhere in new code, verified by a dedicated emulator test), 004D protected-command integration (no `functions/src/index.ts` change, no Cloud Function/HTTP entry point added), Capability-3 functionality (no `businessMemberships` write/mutation code — the new repositories are read-only), dual control, evaluator caching, ITM, UI.

## 40. PR number

[#107](https://github.com/Fkenogo/11THONUS/pull/107) — `feat/eng-p2-004b-permission-evaluator` → `main`.

## 41. Final reviewed head SHA

`0b3fffbce2e2e81f5ce2f65205d8e89547983436` — the head reviewed by Codex pass 2. A third pass was triggered on this same head and had not returned within this session (§31/§33); it should be confirmed before merge.

## 42. CI result

Green — "Build, Lint, Test, Emulator Validation" `SUCCESS` on head `0b3fffb` (run [31878174871](https://github.com/Fkenogo/11THONUS/actions/runs/31878174871)).

## 43–50. Status summary

- **`ENG-P2-004B` status:** Implemented, test-first, all local validation green, two Codex review passes completed with all findings fixed or explicitly dispositioned, a third pass triggered but not yet returned — pending confirmation of pass 3 and Founder review/merge. **NOT MERGED.**
- **`ENG-P2-004C` status:** NOT STARTED.
- **`ENG-P2-004D` status:** NOT STARTED.
- **`ENG-P2-004` overall status:** NOT COMPLETE.
- **Capability 2 status:** Open — partially implemented; unchanged.
- **Capability 3 status:** Not started; unchanged.
- **ITM status:** Not started — Unauthorised; unchanged.
- **AUTH-10 status:** Undefined/unstarted; unchanged; out of scope.

## 51. Dirty primary worktree status

Untouched. `/Users/theo/11THONUS`'s inherited dirty state was never read for content and was not reset, cleaned, rebased, stashed, overwritten, or committed. All work performed exclusively in the clean linked worktree at `/Users/theo/11THONUS/.claude/worktrees/eng-p2-004b`.

## 52. Risks/observations

(a) The role-template carve-out reconciliation (§14) and the override-persistence deferral (§21) are both flagged explicitly for Founder/reviewer attention — neither blocks 004B's own acceptance criteria, but both affect what 004D can assume. (b) Non-sensitive baseline permissions (e.g. a hypothetical `purchase.record`) currently always deny via role default, since no governed non-sensitive baseline table exists yet (004A explicitly deferred it) — this is expected/correct given current governed scope, not a 004B defect, but will need a future governed baseline-table decision before non-sensitive role-default permissions can be exercised in practice. (c) The one observed emulator-suite flake (§30) was an environment/port-contention artifact from concurrent command execution in this session, not a code defect — reproduced clean on immediate rerun.

## 53. Rollback instructions

`git revert` of this branch's commit(s) once merged — all changes are additive (new files) plus one narrowly-scoped `eslint.config.js` rescoping; no schema, data, or deployment state to roll back. Until merged, simply do not merge the PR / delete the branch.

## 54. Persistent implementation-report path

`docs/05-implementation/reports/ENG-P2-004B-permission-evaluation-implementation-report-2026-08-15.md` (this file).

## 55. Changes-tracking update

Appended to `docs/changes/IMPLEMENTATION_CHANGES.md`, `docs/00-governance/documentation-changes-log.md`, and the `ENG-P2-004` row's Notes cell in `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (dated pointer entries, no historical rewrite).

---

## FINAL GATE

**ENG-P2-004B BLOCKED — FOUNDER DECISION REQUIRED** (procedurally, not substantively): implementation, test coverage, and full local validation are complete and green; two Codex review passes ran with genuine P1/P2 findings, all fixed TDD-first or explicitly and defensibly dispositioned (§32); CI is green on the final head (`0b3fffb`). A third review pass was triggered on that head and had not returned within this session's working window. Per this task's own instruction not to consider fewer review passes sufficient merely because CI is green, this PR should not be treated as fully cleared until pass 3's outcome (if it lands) is checked, or the reviewer/Founder makes the call to proceed without it. `ENG-P2-004C`/`004D` remain unauthorized and not started; this package does not self-merge in any case.
