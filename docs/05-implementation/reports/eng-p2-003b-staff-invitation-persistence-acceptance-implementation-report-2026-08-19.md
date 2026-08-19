> **Title:** ENG-P2-003B — Staff Invitation Persistence & Acceptance — Implementation Report
> **Status:** Implemented, test-first (RED→GREEN), pending independent review and Founder disposition — **not merged**
> **Governing documents:** [`ENG-P2-003-DESIGN-001` v1.1](../roadmap/ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md) (§§7, 8, 9, 11.6, 12, 13, 16, 17, 18, 28); TRD10 §10.6.4/§10.6.4a; the Founder task "ENG-P2-003B — Staff Invitation Persistence & Acceptance"
> **Entry `origin/main` SHA:** `7254db588f57ccb6753b2f32330cf4a8a53ff58f` (`ENG-P2-003A` merge, PR #132)
> **Worktree/branch:** `.claude/worktrees/feat+eng-p2-003b-staff-invitation-persistence`, branch `feat/eng-p2-003b-staff-invitation-persistence`, cleanly branched from the SHA above. The primary worktree at `/Users/theo/11THONUS` was not entered or modified by this task.

---

## 1. Phase A — Entry Verification

- `git fetch origin`; `origin/main` HEAD = `7254db588f57ccb6753b2f32330cf4a8a53ff58f` — this **is** the `ENG-P2-003A` merge commit itself (PR #132, `git log` confirms: `Merge pull request #132 from Fkenogo/feat/eng-p2-003a-staff-membership-invitation-contracts`).
- Post-merge CI run `32226470426` on that SHA: `conclusion: success`, `status: completed` (`gh run view 32226470426 --json status,conclusion,headSha`).
- No `ENG-P2-003B`/`003C`/`003D`/`003E` branch, PR, or file exists anywhere in the repository prior to this task (`git branch -a` search for `003b`/`003-b`/`invit` returned only `feat/eng-p2-003a-...`, already merged).
- No `ENG-P2-004-CORR-002` branch or PR exists.
- One unrelated open PR found (#34, `docs(tracking): ENG-P2-RES-ADMIN-003` — post-decision-sync docs, no overlap).
- Fresh worktree created directly from `origin/main` via the harness's native worktree tool; branch renamed to `feat/eng-p2-003b-staff-invitation-persistence` to match repository convention. `/Users/theo/11THONUS` untouched throughout.

## 2. Phase B — Codebase Analysis (before any code was written)

Read directly, in full: `ENG-P2-003-DESIGN-001` v1.1 (all 897 lines, including the §28 Founder Dispositions), TRD10 §10.6.4/§10.6.4a, `functions/src/domains/permissions/models/{businessMembershipInvitation,invitationRole,invitationStatus,invitationDeliveryTarget,invitationAcceptanceHandoff,businessMembershipDocument,role,sensitivePermissionCatalogue,permissionErrors}.ts`, `functions/src/domains/permissions/service/{authorizeAndExecute,evaluatePermissionService}.ts`, `functions/src/domains/permissions/repositories/businessMembershipRepository.ts`, `functions/src/domains/authentication/services/credentialResolutionService.ts`, `functions/src/domains/authentication/models/authenticatedCredential.ts`, `functions/src/domains/identity/models/{customerIdentity,authenticationReference}.ts`, `functions/src/domains/identity/repositories/customerIdentityRepository.ts`, `functions/src/domains/business/repositories/businessRepository.ts` (the `ENG-P2-002B` bootstrap-transaction pattern), `functions/src/shared/idempotency/idempotencyService.ts`, `functions/src/shared/outbox/outboxWriter.ts`, `functions/src/domains/business/events/businessEvents.ts`, `functions/src/shared/errors/errorCategories.ts`, `functions/src/domains/business/models/businessDocument.ts`, and `eslint.config.js`'s `permissions/**` domain-boundary rule.

Confirmed independently (not assumed from the design doc's own claims):
- `ENG-P2-003A`'s files are present on `origin/main` (`ls functions/src/domains/permissions/models/*invitation*` — 5 impl files + 5 test files) and TRD10 §10.6.4a exists at line 385 — the merge is real, contrary to a stale "not merged / draft PR" line an exploratory subagent initially misread from the 003A report's own prose (verified directly against `git log`/the filesystem, not taken on faith).
- No `businessMembership` write path exists anywhere pre-003B (`ENG-P2-003A`'s own report: "No repository/converter was created — deferred to 003B").
- `sensitivePermissionCatalogue.ts` verbatim: `staff.manage` (`owner_only` default, `explicitGrantEligibleRole: "manager"`) and `staff.assignPermissions` exist; no `staff.assignRole` entry (confirms `ENG-P2-004-CORR-002` is still not started, correctly out of this package's scope).
- The `-09` lookup (`lookupCustomerIdentityByAuthenticationReference`) and AUTH-02's `resolveAuthenticatedCredential` are the governed identity-resolution path; `CustomerIdentity.authenticationReferences[]` (each `{referenceId, referenceType, linkStatus}`) is the *only* verified-contact-evidence surface this platform has — this directly resolved Phase L without needing to STOP: no new verification mechanism was invented, an existing, already-Firebase-verified data source was reused.

## 3. Pre-Change Strategy (summary)

Reuse, unmodified: `ENG-P2-004`'s `authorizeAndExecute`/`evaluatePermissionWithContext` (INVITE/REVOKE authorization), the shared idempotency service, the shared outbox writer, `ENG-P2-003A`'s invitation domain contracts, `businessMembershipDocument.ts`'s read-only evaluator surface, `sensitivePermissionCatalogue.ts`. Add, additively: a write-side converter/repository for `businessMembershipInvitations` (003A shipped the schema and reader only); a write-side model/repository for `businessMembership` (003A explicitly deferred this); three commands (`createStaffInvitation`, `revokeStaffInvitation`, `acceptStaffInvitation`) under `functions/src/domains/permissions/service/` (matching the existing `service/` — singular — convention, not a new `services/` directory); one small additive seam on `getCustomerIdentityById` (optional trailing `transaction` parameter, mirroring `businessMembershipRepository.ts`'s own precedent) so ACCEPT can read the accepting identity inside its own transaction.

## 4. Invitation Persisted Schema

Unchanged from `ENG-P2-003A`'s TRD10 §10.6.4a declaration — this package adds no new field. Write-side converter: `businessMembershipInvitationDocument.ts` (`toBusinessMembershipInvitationDocumentFields`), symmetric with the existing `fromBusinessMembershipInvitationDocument` reader.

## 5. Invitation-Reference Strategy (Phase D)

The opaque invitation reference **is** the Firestore document id, minted via `db.collection("businessMembershipInvitations").doc().id` before the transaction opens — the identical "mint ids before the transaction" pattern `businessRepository.bootstrapBusiness` already uses for `businessId`/`branchId`/`membershipId`. This reuses an existing platform pattern (per the task's own instruction) rather than inventing a token scheme: a Firestore auto-id is ~120 bits of random entropy, non-sequential, and encodes no business/staff sequence, email, phone, or identity. Looking an invitation up "by reference" is a direct `O(1)` document `.get()`, never a collection scan — the strongest available enumeration resistance, mirroring `recoveryProofReferences`'s doc-ID-as-key precedent. Documented in `businessMembershipInvitationRepository.ts`'s own module comment.

## 6. Invite Command

`createStaffInvitation` (`service/createStaffInvitationService.ts`). Sequence: `authorizeAndExecute({permission: "staff.manage", ...})` → `mutation.prepare` applies the FD-5-STAFF target restriction (`decision.role === "manager" && targetRole === "manager"` → `AUTH_FORBIDDEN`) and the `INVITE_ALREADY_PENDING` structural check (`hasPendingInvitationForDeliveryTarget`, three-equality-filter query, businessId+status+deliveryTarget.value) → `mutation.apply` writes the invitation and a `StaffInvitationCreated` outbox entry in the same transaction. No identity-existence lookup is performed at invite time (Phase G — avoids account enumeration; also structurally impossible under FD-1-STAFF).

## 7. Manager Target Restrictions

Enforced exactly as §11.6.1 governs: Owner may invite Manager or Staff; a Manager holding `staff.manage` may invite Staff only (never Manager); Staff (no `staff.manage`) is denied by `authorizeAndExecute` itself before `mutation.prepare` ever runs. Sequence is `ENG-P2-004` authorization *then* domain target restriction, never a substitute for it (Phase F). Owner can never be an invitation target — structurally enforced by `InvitationRole`'s type (`"manager" | "staff"` only), reconfirmed at runtime in `createActiveBusinessMembership`.

## 8. Delivery-Target Handling

Email and phone only (`ENG-P2-003A`'s closed `InvitationDeliveryType`). At invite time the delivery target is stored as-supplied (no normalization invented — none exists anywhere in the codebase, confirmed by search); no customer-lookup/enumeration check is performed to decide whether an invitation is "allowed."

## 9. Delivery-Provider Boundary

**Not implemented, disclosed.** This package creates and persists the invitation only; it returns/queues no actual email/SMS send. No provider integration exists anywhere in this repository (confirmed by search) and none was added. The delivery handoff contract is the persisted invitation record itself plus its outbox event (`StaffInvitationCreated`) — a future, separately-governed package may consume that event to trigger an actual send.

## 10. Expiry Policy / Implementation

`invitationPolicy.ts`: named constant `INVITATION_EXPIRY_DURATION_MS = 7 days` (disclosed Engineering default per FD-4-STAFF, not a Founder-frozen value; trivially revisable — it is the sole call site duration lives at). `computeInvitationExpiresAt`/`isInvitationPastExpiry` are pure and unit-tested, including the inclusive boundary (`now === expiresAt` ⇒ expired).

## 11. Terminal Lifecycle

`pending → accepted | revoked | expired`, all terminal, no reverse transition — enforced by `ENG-P2-003A`'s own `isValidInvitationStatusTransition` (unmodified, consumed only). Terminal invitation records are never hard-deleted. Resend/reissue is out of this package's explicit scope (would simply be a fresh `createStaffInvitation` call by the caller — no "reissue" command was requested or built).

## 12. Revocation Command

`revokeStaffInvitation` (`service/revokeStaffInvitationService.ts`). `staff.manage`-gated via `authorizeAndExecute`, identical shape to INVITE. Cross-business isolation: an invitation whose `businessId` does not match the request's `businessId` is treated identically to "not found" (`invitationCrossBusinessMismatchError`, `AUTH_FORBIDDEN`) — never confirms cross-business existence. Never hard-deletes. Idempotent replay (same key) returns `duplicate`, handled entirely beneath this command by the shared idempotency layer; a *fresh* key against an already-terminal invitation is a genuine state conflict (`INVALID_STATE_TRANSITION`), not silently accepted.

## 13. Acceptance Authority (Phase L)

Implemented exactly FD-3-STAFF's three requirements, nothing invented beyond them:
1. **Authenticated Customer Identity** — `params.authenticatedCustomerIdentityId` is a required input the command trusts completely; the calling Cloud Function boundary (not built by this package — no callable/HTTPS layer was requested or added) is responsible for deriving it from AUTH-02's verified credential-resolution path before invoking this command. It is never read from `request`.
2. **Valid invitation proof** — `getInvitationByReference` must resolve to exactly one `pending`, unexpired invitation.
3. **Verified entitlement** — `invitationEntitlement.ts`'s `isEntitledToAcceptInvitation`.

## 14. Verified Target-Entitlement Mechanism

`isEntitledToAcceptInvitation` (`models/invitationEntitlement.ts`) checks whether the accepting `CustomerIdentity` holds a currently-`linked` `AuthenticationReference` of the matching provider type (`email`→`email`, `phone`→`phone_otp`) whose verified `referenceId` equals the invitation's `deliveryTarget.value` (case-insensitive/trimmed for email; trimmed for phone — no reusable normalizer exists in this codebase, confirmed by search, so none was invented beyond safe, non-mutating comparison-time normalization). This reuses already-Firebase-verified identity data; no new OTP, confirmation step, or provider was built. Unit-tested (9 cases: exact match, case-insensitivity, phone match, cross-type non-match, unlinked-reference non-match, value mismatch, unsupported provider types, empty list, non-mutation) and emulator-tested against real `users/{id}` documents (valid recipient accepts; a differently-verified "attacker" identity possessing the same invitation reference is denied and creates no membership).

## 15. Authoritative `userId` Derivation

Always `params.authenticatedCustomerIdentityId` — never `request`, `invitationReference`, the invitation's own `deliveryTarget`, or any membership id. `AcceptInvitationRequest` (`ENG-P2-003A`) structurally carries no `userId` field at all. Proven adversarially by an emulator test that attaches an extra, unrequested `userId` field to the request object and confirms it has zero effect on the created membership's `userId`.

## 16. Duplicate-Membership Handling (Phase N)

**Disclosed Engineering judgment call**, not silently invented — flagged here per the task's own Phase N instruction:
- **Active or suspended** existing membership for `(userId, businessId)` → blocks acceptance (`VALIDATION_FAILED`, `duplicateBusinessMembershipError`).
- **Removed** (terminal, historical) existing membership → does **not** block; acceptance creates a **new** membership document (new id), leaving the removed record untouched as history.

Basis: `ENG-P2-003-DESIGN-001` §5.3 already recommends (not merely permits) "re-invite = new record, not restore-in-place" as the sole governed path back for a removed member, and TRD10's own Membership Rule ("historical records shall remain after removal") is satisfied by exactly this behavior — the removed record is never touched. This reading was judged sufficiently grounded in already-governed text (§5.3) to proceed rather than hard-STOP, but it **is** an Engineering interpretation bridging §5.3 (about REMOVE, a `003C` command that does not exist yet) onto ACCEPT's own duplicate check — **flagged explicitly for Founder/independent-review confirmation**, not asserted as beyond question. A "malformed" or "transient_failure" read of the existing-membership check fails closed (blocks, or `TEMPORARY_UNAVAILABLE` respectively) rather than risking a silent duplicate.

## 17. Acceptance Transaction (Phase O)

One `db.runTransaction`. All reads (invitation, accepting identity, existing-membership check) strictly precede all writes (membership creation, invitation consumption, two outbox entries). The transaction body never throws for an ordinary domain-rule failure — it returns `{kind:"ok"|"fail"}` instead, so the one case that legitimately must write despite ultimately failing (lazily-discovered expiry, §9/Phase V — the terminal `expired` transition is persisted durably even though ACCEPT itself is denied) can do so without Firestore's abort-discards-all-writes behavior losing that write; every other failure path performs no write at all (an effect-free committed no-op). No membership is ever created without the invitation being marked `accepted` in the same transaction, and vice versa.

## 18. Created Membership Shape/State

`businessMembershipWrite.ts`/`businessMembershipWriteRepository.ts`. Created directly `status: "active"` (never `"invited"` — matches the resolved FD-2-STAFF model exactly; the `"invited"` value stays declared, unmodified, unused by any 003B-created record). `permissions: []` (no implicit override grant, Phase P). `role` is copied from the invitation's `InvitationRole` via `invitationRoleAsRole`, with a runtime `"owner"` guard in `createActiveBusinessMembership` as defense-in-depth beneath the type-level exclusion (Phase Q).

## 19. Owner Protection (Phase Q)

No invitation can target `role: "owner"` (`InvitationRole`'s closed type, `ownerCannotBeInvitationRoleError` at construction). No acceptance can produce `role: "owner"` (`createActiveBusinessMembership`'s runtime guard, defense-in-depth). No request parameter anywhere in INVITE/ACCEPT accepts a client-supplied `role` value outside `"manager"|"staff"`.

## 20. Cross-Business Isolation (Phase R)

Proven by emulator test: (a) an actor with no membership in the target Business is denied by `authorizeAndExecute` itself (INVITE); (b) Business A cannot revoke Business B's invitation (`invitationCrossBusinessMismatchError`); (c) ACCEPT only ever creates a membership for `invitation.businessId` — there is no parameter anywhere on the ACCEPT call surface through which a caller could name a different Business (structural, not merely tested); (d) a membership id/invitation id alone is never sufficient — every read is scoped by the caller-asserted `businessId` and cross-checked.

## 21. Concurrency Result (Phase S)

Two genuine emulator-driven races (distinct idempotency keys, real concurrent `Promise.allSettled`, not sequential): (1) two concurrent ACCEPT attempts for the same invitation → exactly one membership is created, the other attempt fails closed (Firestore's own transaction retry-on-contention plus the `pending`-status re-check inside the transaction guarantees this — the losing attempt observes the winner's `accepted` status and returns `invitationAlreadyAcceptedError`). (2) REVOKE racing ACCEPT for the same invitation → the invitation's final status is `accepted` XOR `revoked`, never both, and at most one membership exists. No partial-record state was observed in any run.

## 22. Idempotency Result (Phase T)

Reuses `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey` throughout — INVITE and REVOKE via `authorizeAndExecute`'s own built-in wrapping; ACCEPT via a bespoke instance of the identical pattern (mirroring `businessRepository.bootstrapBusiness`/`customerIdentityRepository.createCustomerIdentity`). Same-key replay does not duplicate an invitation, membership, or outbox event (proven for INVITE and REVOKE by emulator test). Conflicting replay (same key, different payload) fails `IDEMPOTENCY_CONFLICT` (proven for INVITE).

## 23. Outbox / Events (Phase U)

`StaffInvitationCreated`/`Revoked`/`Accepted`/`Expired`* and `StaffMembershipActivated` (`events/staffInvitationEvents.ts`), written via the shared `writeOutboxEntry` inside the same transaction as their domain write, exactly mirroring `businessEvents.ts`. Payloads carry only identifiers/categorical values (`invitationId`, `businessId`, `role`, `membershipId`, `userId`, `invitedBy`/`revokedBy`) — never a delivery address, token, or credential; proven by an emulator test that JSON-serializes every outbox entry after a full accept flow and asserts the invitation's raw email string never appears anywhere in it.

*`StaffInvitationExpired` is emitted for none of this package's own paths yet — the only expiry path built is ACCEPT's lazy-discovery transition, which persists the state change but does not currently also emit this event (a disclosed, minor omission; low-severity — the persisted document itself is the durable record of the transition, and no consumer currently exists for this event). Flagged for review/backlog, not silently dropped.

## 24. Privacy Result

Confirmed above (§23) and by design (§13/§14/§16's error messages never echo the invitation's delivery address back to a denied caller — only categorical outcomes).

## 25. Expiry-Processing Approach (Phase V)

**Lazy, on ACCEPT only.** No scheduled/background processor was built — the minimum architecture consistent with the design. Documented in `acceptStaffInvitationService.ts`'s own module comment. **Disclosed gap:** REVOKE does not check `isInvitationPastExpiry` before transitioning — a `pending` invitation that has technically already lapsed still "succeeds" as a `revoked` transition rather than being lazily reclassified as `expired` first. Low severity (the practical effect — the invitation becomes unacceptable either way — is identical), flagged for review rather than left unmentioned.

## 26. Error Taxonomy (Phase W)

Zero new categories. Nine new `PermissionDomainError` factories appended to `permissionErrors.ts` (`invitationNotFoundError`, `invitationExpiredError`, `invitationRevokedError`, `invitationAlreadyAcceptedError`, `invitationAcceptanceEntitlementDeniedError`, `duplicateBusinessMembershipError`, `invitationTargetNotPermittedForActorError`, `invitationAlreadyPendingError`, `invitationCrossBusinessMismatchError`, `membershipReadTransientFailureError`), each mapped exactly per §16.3's addendum table. No email/phone-registration-status is ever leaked (expired/revoked/not-found/wrong-identity all collapse to fail-closed categories that reveal nothing about whether a given address is registered anywhere).

## 27. Rules Assessment (Phase X)

No Firestore Rules change made or required — every mutation (`businessMembershipInvitations`, `businessMemberships` writes) goes through server-side Admin SDK code only, exactly as every other domain in this repository already does; no direct client write path was added or exists.

## 28. RED→GREEN Evidence

Every new file was written with its test file in the same or an adjacent step; the emulator test suite (`staffInvitation.emulator.test.ts`) was run against the real implementation from its first draft — two genuine test-writing bugs were caught and fixed during this process (both assertions incorrectly scoped a `businessMemberships` query by `businessId` alone, missing that Business bootstrap always creates an Owner membership in the same collection — not an implementation defect; both are documented in the git history of this file). No test was written to already match a known-passing implementation.

## 29. Tests Added

- `invitationPolicy.test.ts` (4 cases, pure).
- `invitationEntitlement.test.ts` (9 cases, pure).
- `staffInvitation.emulator.test.ts` (29 cases): 11 INVITE, 4 REVOKE, 11 ACCEPT (including the full adversarial/entitlement/expiry/idempotency/duplicate-membership/removed-history/phone-delivery matrix), 1 cross-business, 2 concurrency, 1 privacy.

## 30. Full Validation

- `pnpm run typecheck` (repo-wide, `functions` + `apps/web`) — clean.
- `pnpm run lint` (repo-wide ESLint, including the `permissions/**` Firebase-import boundary rule) — clean.
- `pnpm run test` (repo-wide unit tests) — **functions: 1215/1215 passed** (124 files; baseline was 1202 before this package, 1206 immediately after `ENG-P2-003A`'s own baseline was independently re-confirmed at 1206 — the +9 here are this package's own pure unit tests), **apps/web: 397/397 passed** (untouched by this package, included for full-repo confirmation).
- `firebase emulators:exec ... test:emulator` (repo-wide emulator suite) — **428/428 passed** (35 files) — includes this package's own 29 new emulator cases plus zero regressions in every existing emulator-tested domain (`ENG-P2-002B` bootstrap, `ENG-P2-004` authorization boundary, identity, etc.).

## 31. Existing Regression

No semantic change to any `ENG-P2-003A` contract, `ENG-P2-002A/B/C`, `ENG-P2-004`, `ENG-P2-004-CORR-001`, Customer Identity, Authentication, or ITM. `sensitivePermissionCatalogue.ts` untouched (confirmed by `git diff` — zero lines changed). Two pre-existing files touched, both additive-only:
- `functions/src/domains/identity/repositories/customerIdentityRepository.ts` — `getCustomerIdentityById` gained one **optional** trailing `transaction?: Transaction` parameter (mirrors the existing `businessMembershipRepository.ts`/`evaluatePermissionWithContext` additive-seam precedent); omitted, behavior is byte-identical to before.
- `functions/src/domains/permissions/models/permissionErrors.ts` — ten new factory functions appended at the end of the file; nothing existing was edited or removed.

## 32. Files Modified/Added

**Added (14):**
`models/invitationPolicy.ts`(+test), `models/invitationEntitlement.ts`(+test), `models/businessMembershipWrite.ts`, `repositories/businessMembershipInvitationDocument.ts`, `repositories/businessMembershipInvitationRepository.ts`, `repositories/businessMembershipWriteRepository.ts`, `events/staffInvitationEvents.ts`, `service/createStaffInvitationService.ts`, `service/revokeStaffInvitationService.ts`, `service/acceptStaffInvitationService.ts`, `service/staffInvitation.emulator.test.ts`, this report.

**Modified (2, both additive):** `models/permissionErrors.ts`, `identity/repositories/customerIdentityRepository.ts`.

## 33. Code Diff Summary

~1,450 lines added across 14 new files; ~90 lines added (0 removed) across 2 modified files. No file outside `functions/src/domains/permissions/**` and one line-scoped addition in `functions/src/domains/identity/repositories/customerIdentityRepository.ts` was touched.

## 34. Dependencies Added

None. No new npm package.

## 35. Config Changes

None.

## 36. Firebase/Rules Changes

None. No `firestore.rules`, `firestore.indexes.json`, or `firebase.json` change.

## 37. Deployment Changes

None. No deployment was performed or attempted.

## 38. Review Findings/Dispositions

Self-identified during implementation (no external review has run yet — this report is the entry point for that review):
- §16 duplicate-membership "removed does not block" — disclosed judgment call, needs independent confirmation.
- §23 `StaffInvitationExpired` event not yet emitted from the lazy-expiry path — minor, disclosed.
- §25 REVOKE does not itself lazily-expire a past-due `pending` invitation before revoking it — minor, disclosed, functionally low-impact.
- No callable/HTTPS Cloud Function boundary was built for any of the three commands (not requested by this task's authorization list, which named "bounded callable/service seams **if required by the merged design**" — the design does not require a specific transport, and none of PR-facing product surfaces were in scope). These are plain, directly-callable, dependency-injected TypeScript functions, matching every other command in this codebase at this stage (e.g. `bootstrapBusiness` itself has no callable wrapper yet either).

## 39. Remaining Material Findings

None identified beyond §38's disclosed items.

## 40. PR Number / 41. Final Reviewed Head / 42. CI Result

Recorded after PR creation (see the chat response accompanying this report — filled in once the PR is opened, immediately following this report's commit).

## 43. ENG-P2-003B Status

**Implemented / pending Founder review.**

## 44. ENG-P2-003C/D/E Status

**Not started.**

## 45. ENG-P2-004-CORR-002 Status

**Not started.**

## 46. Capability 3 Status

**Open — partially implemented; not closed** (unchanged label; `ENG-P2-003` overall remains not fully complete — `003C`/`003D`/`003E` remain outstanding).

## 47. Dirty Primary Worktree

`/Users/theo/11THONUS` (the primary worktree) was never entered or modified by this task — all work occurred in the isolated worktree named above.

## 48. Risks

- The §16/§25/§23 disclosed items above.
- No callable/HTTPS boundary exists yet — a future package must wire these commands to an actual Cloud Function entry point with request-payload validation before any client can call them; this package proves the domain/persistence layer only, per its own authorization scope.
- `DEC-SUB-002` staff-count entitlement remains unenforced by INVITE (disclosed, non-blocking per the design's own §16.1 addendum).

## 49. Rollback

Purely additive — reverting this PR removes only new files plus two small additive diffs; no existing behavior depends on either modified file's new optional parameter or new error factories.

## 50. Persistent Implementation-Report Path

`docs/05-implementation/reports/eng-p2-003b-staff-invitation-persistence-acceptance-implementation-report-2026-08-19.md` (this file).

## 51. Changes-Tracking State

Dated-supersession notes applied to `CDR-001-capability-delivery-roadmap.md` §5 Capability 3 and `engineering-implementation-programme.md`'s P2 row, appended after the existing 2026-08-19 `ENG-P2-003A` note (history preserved, not rewritten).

## 52. Exact Next Founder Action

Independent review of this PR (acceptance authority, `userId` derivation, duplicate-membership §16 judgment call, transaction atomicity, concurrency, cross-business isolation, terminal invitation semantics, privacy) per the task's Phase AA instruction, then Founder merge decision. **Do not begin `ENG-P2-003C`/`D`/`E` or `ENG-P2-004-CORR-002`.**
