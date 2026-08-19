> **Title:** ENG-P2-003A — Staff Membership & Invitation Domain Contracts — Implementation Report
> **Status:** Implemented / pending independent review and Founder disposition. Draft PR open, not merged.
> **Governing documents:** [`ENG-P2-003-DESIGN-001`](../roadmap/ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md) v1.1 (§7/§8/§9/§11/§16/§18.1/§22/§28); TRD10 §10.6.4/§10.6.4a; `sensitivePermissionCatalogue.ts`; `permissionOverride.ts`; `businessMembershipDocument.ts`.

# ENG-P2-003A Implementation Report

## 1. Entry `origin/main` SHA
`e4b47a1571eefac5dc40159374385f7c321c34f9` (PR #130 merge `7e2fd6b`, PR #131 merge `e4b47a1`, both merged, CI green — verified before starting).

## 2. Worktree/branch
`/Users/theo/11THONUS/.claude/worktrees/eng-p2-003a`, branch `feat/eng-p2-003a-staff-membership-invitation-contracts`, tracking `origin/main`. The primary worktree `/Users/theo/11THONUS` was **not** entered or modified.

## 3. Prerequisite verification
Confirmed pre-work per the task briefing: no open PR/branch overlaps Staff Membership runtime work; `ENG-P2-004-CORR-002` not started; entry SHA matches `origin/main`.

## 4. Codebase analysis
Read directly (not from memory): `ENG-P2-003-DESIGN-001` v1.1 in full (897 lines, all sections including §28 Founder Dispositions FD-1…FD-7-STAFF); TRD10 §10.6.4/`businessMembershipDocument.ts`/`role.ts`/`permissionOverride.ts`/`permissionErrors.ts`/`errorCategories.ts`/`sensitivePermissionCatalogue.ts`; `business.ts`/`businessStatus.ts` (contract-pattern precedent); `eslint.config.js` (domain-boundary rule precedent, confirmed `permissions/**` already has a `no-restricted-imports` block covering `firebase-admin`/`firebase-functions`).

## 5. Pre-change strategy (written before editing code)
Mirror the `businessStatus.ts`/`business.ts`/`permissionOverride.ts` contract pattern already established for `ENG-P2-002A`/`004A`: closed-union `models/` files, a domain-error module extending the existing `PermissionDomainError` class (never a new taxonomy), a fail-closed Firestore-document *reader* (duck-typed `Timestamp`, `null` on malformed input, no throw), and framework independence enforced by the existing `permissions/**` ESLint boundary rule (no new ESLint block needed — confirmed the existing one already covers the new files' path). Files placed under `functions/src/domains/permissions/models/` (the invitation is a permissions/membership-adjacent concept, not a new domain) rather than a new top-level domain, matching where `businessMembershipDocument.ts`/`role.ts`/`permissionOverride.ts` already live.

## 6. Staff Membership boundary
No `StaffIdentity` aggregate created. No second identity type. No shared-account model. Staff membership contracts consumed the existing `Role` union (`role.ts`) rather than inventing a new one (`invitationRole.ts` restricts it to `manager`/`staff`).

## 7. Invitation contract
Implemented in `functions/src/domains/permissions/models/businessMembershipInvitation.ts`: `BusinessMembershipInvitation` type with `id`, `businessId`, `role` (`InvitationRole`), `deliveryTarget`, `invitedBy`, `status`, `invitedAt`, `expiresAt`, `resolvedAt?`, `acceptedMembershipId?`, `createdAt`, `updatedAt`, `schemaVersion` — exactly the fields §7.1a's conceptual-data table names, no speculative fields added, no `userId` field. `createBusinessMembershipInvitation()` validates and constructs; `transitionInvitationStatus()` performs only the structural lifecycle transition (mirrors `transitionBusinessStatus`).

## 8. Invitation persisted-contract result
`fromBusinessMembershipInvitationDocument(id, raw)` — a fail-closed reader mirroring `fromBusinessMembershipDocument`'s pattern exactly (duck-typed `Timestamp`, returns `null` never throws, on any malformed field). No repository, no Firestore write path, no converter — persistence/writing is `ENG-P2-003B`'s scope.

## 9. Delivery-target contract
`invitationDeliveryTarget.ts`: closed `InvitationDeliveryType = "email" | "phone"`. No loyalty-number/username/social/QR delivery type. No format-specific normalization invented (no governed reusable email/phone validator found anywhere in the codebase to reuse — verified by repository-wide search) — only structural non-blank-string validation.

## 10. Invitation lifecycle
`invitationStatus.ts`: `pending → accepted | revoked | expired`, all three terminal, no reverse transition, mirrors `businessStatus.ts`'s `PERMITTED_TRANSITIONS` table pattern exactly. `isTerminalInvitationStatus` provided.

## 11. Intended-role contract
`invitationRole.ts`: `InvitationRole = "manager" | "staff"`, derived from (not duplicating) `Role`. `createInvitationRole("owner")` throws a dedicated `ownerCannotBeInvitationRoleError`.

## 12. Existing invited-membership-status compatibility
**No change made to `businessMembershipDocument.ts`, `role.ts`, or TRD10 §10.6.4's `BusinessMembershipDocument` declaration.** The `invited` value remains in `MEMBERSHIP_STATUSES` exactly as before. `businessMembership.userId` remains required/non-nullable — verified unchanged by inspection after all edits (see §13/§23 below). No mismatch was found requiring the reader to be touched; nothing was stopped/blocked on this point.

## 13. Acceptance handoff contract
`invitationAcceptanceHandoff.ts`: `AcceptInvitationRequest = { invitationReference: string }` (the only client input) and `AcceptInvitationResult` (server-produced output, carries `userId`). No token validation, no Firebase principal resolution, no Customer Identity query, no membership creation — all deferred to `ENG-P2-003B`.

## 14. Identity-authority boundary
Proven structurally and at compile time: `AcceptInvitationRequest` has no `userId` key (`invitationAcceptanceHandoff.test.ts`'s `AssertNoUserId` mapped-type assertion, verified both by `vitest` and by `tsc --noEmit`). `BusinessMembershipInvitation` itself has no `userId` field anywhere (verified by a runtime test: `"userId" in invitation === false`). `businessMembership.userId` remains mandatory, unchanged.

## 15. Expiry/revocation contract
`expiresAt: Date`, required, validated `> invitedAt` at construction (`invitationExpiryNotAfterIssuedError`). No numeric duration hardcoded anywhere. Revocation modeled as the `pending → revoked` lifecycle transition; single-use enforced structurally (terminal states have no outgoing transitions, so a consumed/terminal invitation reference cannot be transitioned again).

## 16. Owner protection
`createInvitationRole`/`fromBusinessMembershipInvitationDocument` both reject `role: "owner"` (constructor throws; reader fails closed to `null`). `staffMembershipTargetPolicy.ts`'s `isPermittedRoleChangeTarget`/`isPermittedStaffManagementTarget` both hard-reject `targetRole === "owner"` unconditionally. Tested explicitly (`rejects owner as the intended role`, `fails closed on owner intended role`, `Owner may never target Owner`, etc.).

## 17. Membership-target contract result
`staffMembershipTargetPolicy.ts` implements the §11.6.1 (`staff.manage`) and §11.6.2 (`staff.assignRole`) matrices as two pure predicate functions (`isPermittedStaffManagementTarget`, `isPermittedRoleChangeTarget`) — no permission evaluation, no authorization runtime, no duplication of `ENG-P2-004`'s evaluator. They answer only "given the actor already holds the relevant permission, is this target structurally permitted," matching Phase L's explicit boundary.

## 18. Role-change contract result
`staffRoleChangeRequest.ts`: `StaffRoleChangeRequest`/`createStaffRoleChangeRequest()` — Staff↔Manager only, `fromRole !== toRole` enforced, no self-role-change field/check baked in beyond structural role validation (self/actor-authority check is `ENG-P2-003C`'s runtime concern, per the design). **`sensitivePermissionCatalogue.ts` was not modified** — `staff.assignRole` is not added to the catalogue by this package (that is `ENG-P2-004-CORR-002`'s scope, confirmed not started and not begun here).

## 19. Roster DTO disposition
**Not implemented.** Per Phase N and design §12.4 (FD-5-STAFF), the design explicitly defers the exact roster DTO field list to a later implementation/frontend package rather than freezing it prematurely. `ENG-P2-003A` does not define a roster read contract.

## 20. PermissionOverride compatibility
`permissionOverride.ts`, `sensitivePermissionCatalogue.ts`, and `businessMembershipDocument.ts`'s `permissions: PermissionOverrideRecord[]` handling are all **unmodified**. `staff.assignRole` is never modeled as a `PermissionOverrideRecord` — role change is its own distinct contract (`staffRoleChangeRequest.ts`), matching the design's explicit instruction (§14 addendum).

## 21. TRD10/schema impact
Added `docs/02-technical/trd/10-firestore-data-architecture.md` §10.6.4a (`businessMembershipInvitations`, additive, non-conflicting) — following the repository's own governed precedent the design's §18.1 investigated and confirmed (four prior additive collections shipped by their implementing packages with no prerequisite standalone schema-amendment package: `trustRecords`/`recoveryProofReferences`, `businessCodeReservations`, and TRD10's own `ENG-P2-004D` `permissions`-field correction). §10.6.4 (`BusinessMembershipDocument`) itself is **byte-for-byte unchanged**. No Firestore Rules change. No migration (the collection does not exist in any environment).

## 22. Validation/error taxonomy
All new errors added to `permissionErrors.ts` (extending the existing `PermissionDomainError` class) use only existing categories: `VALIDATION_FAILED` (most construction-time failures) and `INVALID_STATE_TRANSITION` (invalid lifecycle transition) — both already in the closed 14-category `errorCategories.ts`. No 15th category introduced. Validation fails closed on: blank ids/businessId/invitedBy/requestedBy/membershipId; malformed role (including a dedicated owner-rejection path); unknown invitation status; malformed timestamps; invalid schemaVersion (non-integer or `< 1`); malformed delivery type; blank delivery target value; expiry not strictly after issued time; no-op role-change request. No product-level email/phone format restriction invented (none governed/reusable found).

## 23. Framework-independence result
Verified: no `firebase-admin`/`firebase-functions` import in any new file (manual inspection + the mechanical ESLint proof below). Firestore `Timestamp` recognised structurally (`.toDate()` duck typing), matching `businessMembershipDocument.ts`'s own precedent.

## 24. ESLint boundary proof
The existing `functions/src/domains/permissions/**/*.ts` `no-restricted-imports` block (added for `ENG-P2-004A`) already covers the new files' path — no new ESLint block was needed. **Mechanically verified**: created a scratch file `functions/src/domains/permissions/models/__scratch_eslint_boundary_check.ts` importing `firebase-admin`, ran `npx eslint` against it — **failed** with the expected boundary error (`'firebase-admin' import is restricted ...`), then deleted the scratch file. Re-ran `npx eslint functions/` afterward — clean.

## 25. RED→GREEN evidence
Genuine TDD for the four substantive contract modules with meaningful logic:
- `businessMembershipInvitation.ts`: test file written first: 26 tests, all failed with `Cannot find module './businessMembershipInvitation'` (RED, captured via `npx vitest run`). Implemented; reran — 26/26 GREEN.
- `invitationAcceptanceHandoff.ts`: RED captured (`Cannot find module`), then GREEN (4/4 tests).
- `staffMembershipTargetPolicy.ts`: RED captured (`Cannot find module`), then GREEN (13/13 tests).
- `staffRoleChangeRequest.ts`: RED captured (`Cannot find module`), then GREEN (9/9 tests).

**Disclosed process deviation:** the three smallest foundational enum-style modules — `invitationRole.ts`, `invitationDeliveryTarget.ts`, `invitationStatus.ts` — were implemented directly (mirroring `role.ts`/`businessStatus.ts`'s existing, already-reviewed pattern almost verbatim) before their test files were written, rather than test-first. Tests were then added and all pass (6, 5, and 9 tests respectively), but a literal RED cycle was not captured for these three specific files. This is disclosed rather than fabricated; it does not affect the four substantive files above, which do have real, captured RED evidence.

## 26. Tests added
16 test files, 231 tests, all passing, under `functions/src/domains/permissions/models/`: `businessMembershipInvitation.test.ts` (26), `invitationAcceptanceHandoff.test.ts` (4), `invitationDeliveryTarget.test.ts` (5), `invitationRole.test.ts` (6), `invitationStatus.test.ts` (9), `staffMembershipTargetPolicy.test.ts` (13), `staffRoleChangeRequest.test.ts` (9) — new files; the remainder are pre-existing passing tests in the same directory (unaffected). Coverage includes every REQUIRED test area the task specified: invitation exact shape, email/phone delivery targets, unsupported delivery type rejection, missing businessId rejection, owner/manager/staff intended-role handling; lifecycle pending/terminal/unknown-state/reverse-transition rejection; identity-boundary (no userId anywhere, compile-time-proven on the request type); security (no token/credential/password/OTP/session field, delivery evidence != identity); Owner exclusion on every surface (invitation role, staff-management target, role-change target).

## 27. Existing regression result
Full `functions` unit suite: **1202/1202 passing** (122 test files), including all pre-existing `ENG-P2-002A/B/C`, `ENG-P2-004A-D`/`CORR-001`, Customer Identity, Authentication, ITM, and `businessMembershipDocument.ts` tests — zero semantic change, zero regression. `tsc --noEmit` clean. `businessMembershipDocument.test.ts` (the existing membership-reader regression suite) passes unmodified.

## 28. 003B handoff
Owns: invitation persistence (Firestore repository/converter for the TRD10 §10.6.4a shape), INVITE/REVOKE/EXPIRE commands, token/reference generation (opaque, unguessable — entropy/encoding Engineering-owned per FD-4-STAFF), the ACCEPT transaction implementing §8a's 8-step consistency boundary (consumes `AcceptInvitationRequest`/produces `AcceptInvitationResult` from `invitationAcceptanceHandoff.ts`), and the future `DEC-SUB-002` entitlement-check integration hook on INVITE (non-blocking placeholder only).

## 29. 003C handoff
Owns: SUSPEND/REACTIVATE/REMOVE commands and the role-change command, both consuming `staffMembershipTargetPolicy.ts`'s pure predicates plus `ENG-P2-004`'s evaluator for actual authorization (never re-implementing it), and `staffRoleChangeRequest.ts` for the role-change request shape. The role-change command specifically requires `ENG-P2-004-CORR-002` (the `staff.assignRole` catalogue entry) to exist first — not authorized or performed by this package.

## 30. 003D handoff
Owns: permission-override grant/revoke write commands consuming `permissionOverride.ts`'s existing `createPermissionOverride` validation and `sensitivePermissionCatalogue.ts` unmodified — no dependency on anything new in `ENG-P2-003A`.

## 31. CORR-002 handoff
Owns: adding the single `staff.assignRole` entry to `sensitivePermissionCatalogue.ts` (Owner-only, non-delegable, per §11.6.2). **Not started. Not touched by this package** — `sensitivePermissionCatalogue.ts` is byte-for-byte unmodified (verified).

## 32. 003E handoff
Owns: cross-package integration, event wiring (`StaffInvitationCreated`/`Accepted`/`Revoked`/`Expired`, `StaffMembershipActivated`/`Suspended`/`Reactivated`/`Removed`, `StaffRoleChanged`, `PermissionOverrideChanged` — all still candidate/Engineering-owned names per design §17, not implemented by this package), full regression, closure reporting. Blocked on `003A`-`003D` all reaching Complete.

## 33. Full validation
- Focused ENG-P2-003A tests: 231/231 passing (7 new files + 9 pre-existing files in the same `models/` directory, all green).
- Full `functions` unit suite: **1202/1202 passing**, 122 test files, zero failures.
- Typecheck (`tsc --noEmit`, `functions/`): clean.
- Lint (`npx eslint functions/`): clean.
- Format (`npx prettier --check`/`--write` on touched files): clean after one auto-format pass (line-wrapping only, no logic change).
- Build (`pnpm --filter functions run build`): clean, exit 0.
- **Emulator tests: skipped, by design judgment.** This package implements pure contracts only — no repository, no Firestore read/write path, no Cloud Function. No additive persisted converter/repository was implemented (only a pure in-memory reader function operating on caller-supplied `raw` data, exactly mirroring `businessMembershipDocument.ts`'s own precedent, which also has no emulator test suite). Repository convention (per the task's own Phase W guidance) does not require emulator coverage for contracts with no repository.
- **`apps/web` build/tests: not run.** No file under `apps/web/` was touched; this package is backend-only pure domain contracts.

## 34. Files modified
- `functions/src/domains/permissions/models/permissionErrors.ts` (extended — new error functions appended, nothing removed/changed).
- `docs/02-technical/trd/10-firestore-data-architecture.md` (additive §10.6.4a; §10.6.4 unchanged).
- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` (dated-supersession note appended).
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (dated-supersession note appended).

## 35. Code diff summary
14 new files under `functions/src/domains/permissions/models/`: 7 implementation files (`businessMembershipInvitation.ts`, `invitationStatus.ts`, `invitationRole.ts`, `invitationDeliveryTarget.ts`, `invitationAcceptanceHandoff.ts`, `staffMembershipTargetPolicy.ts`, `staffRoleChangeRequest.ts`) + 7 matching test files. 1 file extended (`permissionErrors.ts`, +~85 lines, additive only). No file deleted. No existing exported symbol's signature changed.

## 36. Dependencies added
None. No new `package.json` dependency in `functions/` or root. (A local `npm install` was run once in `functions/` during initial tooling verification, which produced a stray `functions/package-lock.json`; this was deleted before committing since the repository uses `pnpm` workspaces exclusively — confirmed not committed.)

## 37. Config changes
None. `eslint.config.js` was not modified — the existing `permissions/**` boundary block already covers the new files (verified mechanically, §24).

## 38. Firebase/Rules changes
None. No `firestore.rules`, `firebase.json`, or index config touched.

## 39. Deployment changes
None. No deploy performed or configured.

## 40. Review findings/dispositions
Independent self-review performed (see §41 disclosure). Findings: (1) the three foundational enum modules lacked captured RED evidence — disclosed in §25 rather than corrected retroactively (correcting it now would itself be dishonest, since the implementation already exists); no functional issue found. (2) Confirmed no accidental `userId` leakage anywhere in the invitation type graph. (3) Confirmed `sensitivePermissionCatalogue.ts` and `businessMembershipDocument.ts` are byte-for-byte unmodified via `git diff` against `origin/main`. No other findings.

## 41. Remaining material findings
None identified as blockers. No `code-review` skill/tool was available in this session's context for an automated review pass — the review in §40 was a manual self-review of the full diff against the eight structural invariants the task's Phase X names (invitation != membership; userId non-nullable; delivery evidence != identity; Owner exclusion; no runtime persistence leakage; no `staff.assignRole` catalogue mutation; no shared-device/subscription leakage; framework independence) — all eight checked and confirmed by direct inspection.

## 42. PR number
See the PR opened immediately after this report (draft, base `main`) — number recorded in the final chat response once `gh pr create` returns it.

## 43. Final reviewed head
The commit at the tip of `feat/eng-p2-003a-staff-membership-invitation-contracts` at the time this report was written (recorded in the final chat response's commit SHA).

## 44. CI result
Pending — recorded in the final chat response once the PR's CI run completes/is checked.

## 45. ENG-P2-003A status
**Implemented / pending Founder review.** Not merged.

## 46. ENG-P2-003B/C/D/E status
All four: **Not started.**

## 47. ENG-P2-004-CORR-002 status
**Not started.** Not touched by this package.

## 48. Capability 3 status
Unchanged: **`Open — partially implemented; not closed`** (per `ENG-P2-003-DESIGN-001` §1/§24, reconfirmed by the dated-supersession notes this package appended — §21/§34 above). `ENG-P2-003` as a whole remains not started (only `003A` has code now).

## 49. Dirty primary worktree
Confirmed: `/Users/theo/11THONUS` (the primary worktree, on branch `chore/eng-p1-001-closure`) was **not** entered, read, or modified by this task. All work occurred exclusively in `/Users/theo/11THONUS/.claude/worktrees/eng-p2-003a`.

## 50. Risks
- The three foundational modules' TDD-process deviation (§25) — low risk, disclosed, no functional defect found on review.
- `ENG-P2-003A`'s contracts are unconsumed until `003B` exists — no runtime risk today (dead code from the platform's perspective until wired in), by design.
- Delivery-target validation is intentionally loose (non-blank string only) — acceptable per Phase Q's explicit instruction not to invent unGoverned format rules, but a future package choosing to reuse these types for user-facing form validation should not assume they reject malformed emails/phones.

## 51. Rollback
Trivial: revert the single feature branch/PR. No schema migration, no Firestore Rules, no deployed surface, no dependency change — purely additive TypeScript source plus three docs edits, all cleanly revertible with `git revert`.

## 52. Persistent implementation-report path
`docs/05-implementation/reports/eng-p2-003a-staff-membership-invitation-contracts-implementation-report-2026-08-19.md` (this file).

## 53. Changes-tracking state
`CDR-001-capability-delivery-roadmap.md` and `engineering-implementation-programme.md` both updated via dated-supersession notes (§21/§34); `decision-register.md` **not** modified (no decision content changed); TRD10 additively updated (§21).

## 54. Exact next Founder action
Review the draft PR (`feat/eng-p2-003a-staff-membership-invitation-contracts` → `main`), confirm the invitation/membership boundary and Owner-exclusion invariants hold, and either approve for merge or return findings. No further `ENG-P2-003B`/`C`/`D`/`E`/`CORR-002` work should begin until this package merges and its own Founder disposition is recorded.
