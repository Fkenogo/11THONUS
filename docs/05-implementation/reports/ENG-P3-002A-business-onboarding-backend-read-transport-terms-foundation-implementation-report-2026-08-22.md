# ENG-P3-002A — Business Onboarding Backend Read, Transport & Terms Foundation

## 1. Entry state

This task resumed from an existing worktree (`/Users/theo/11THONUS/.claude/worktrees/agent-ae0174a9d1df32c05`, branch `eng-p3-002a`, base `8480323` — `origin/main`'s `ENG-P3-002-DESIGN-001` closure-sync SHA) containing substantial uncommitted work from a prior agent attempt interrupted by an infrastructure stream-watchdog stall, not a task failure. Rather than discard that work, it was audited file-by-file against `ENG-P3-002-DESIGN-001` (v2.0, §9/§11/§13/§14/§21/§25/§37/§39/§40) and the task's own requirements, then committed as the foundation once verified.

## 2. Audit method and findings

Every modified/new production file was read directly (not assumed from the file list) and checked against the design document's own governing sections: `businessTermsConfig.ts`, `businessTermsAcceptance.ts`(+test), `businessTermsAcceptanceRepository.ts`, `acceptBusinessTermsCommand.ts`(+emulator test), `businessCallerAuthority.ts`, `businessReadService.ts`(+emulator test), `commerceKnowledgeReadService.ts`(+emulator test), `staffTransportReadService.ts`(+emulator test), the `businessLifecycleCommand.ts`/`businessRepository.ts`/`knowledgeNodeRepository.ts`/`businessMembershipRepository.ts`/`businessMembershipInvitationRepository.ts`/`businessErrors.ts`/`permissionErrors.ts`/`commerceKnowledgeErrors.ts`/`businessEvents.ts`/`index.ts`/`index.test.ts`/`eslint.config.js` diffs, and the `businessProfileLifecycle.emulator.test.ts` regression fixture updates.

**Finding: the foundation was coherent, complete, and correctly scoped — no rewrite was needed.** Specifically verified:
- The Terms-acceptance schema (`id`, `acceptingCustomerIdentityId`, `businessId`, `termsVersion`, `acceptedAt`, `languageCode`, `collectionMethod?`, `createdAt`, `schemaVersion`) matches the design's §37.3 recommended schema field-for-field, including the deliberate omission of `status`/`updatedAt` (write-once, no withdrawal flow at MVP).
- `acceptingCustomerIdentityId` is never a parameter anywhere in the transport chain (`parseAcceptBusinessTermsRequest`'s output type structurally excludes it) — confirmed and regression-tested (`index.test.ts`, "security-critical" mass-assignment test).
- The server-authoritative Terms-version mechanism (`businessTermsConfig.ts`) reads `BUSINESS_TERMS_CURRENT_VERSION` from environment configuration, returns `null` (never a fabricated default) when unset/blank, and every caller (`acceptBusinessTermsCommand`, the `submitBusinessForVerification` precondition) fails closed on `null`.
- The `acceptStaffInvitation` callable was correctly **not** exposed — the design's §40 scope-reconciliation table explicitly assigns that exposure decision to a later package, not `ENG-P3-002A`.
- `apps/web/`, `firestore.rules`, and the permission catalogues (`ordinaryPermissionCatalogue.ts`, `sensitivePermissionCatalogue.ts`) all had zero diff.
- No real/legally-plausible Terms version string (`"v1"`, `"1.0"`, `"2026-08"`, etc.) appears anywhere outside comments explaining why such values must never be hardcoded; every test-only fixture value is unambiguously named (`TEST_ONLY_FIXTURE_v0`, `TEST_ONLY_FIXTURE_v1`).

No genuine defect was found requiring a fix during this audit pass. The foundation was committed as-is (commit `5edc14a`, "ENG-P3-002A: Business onboarding backend read, transport & Terms foundation"), and the task proceeded directly to full validation and independent self-review rather than further implementation, since every task-spec requirement traced to already-implemented, already-tested code.

## 3. Read/query surfaces implemented

| Surface | Function | Notes |
|---|---|---|
| Business list | `getOwnedBusinesses` (`businessReadService.ts`) | Server-derived from `ownerUserId` only; bounded `OwnedBusinessSummary` DTO (`businessId`, `businessCode`, `displayName`, `status`, `primaryCategoryId`, `businessTypeId?`) |
| Business hydration | `getBusinessContext` (`businessReadService.ts`) | Re-derives caller authority via `resolveAuthorizedBusinessForRead` before any other read; bounded `BusinessContext` DTO including default Branch and Terms-acceptance projection |
| Default Branch read | `readDefaultBranchForBusiness` (`businessRepository.ts`) | Fails closed (`VALIDATION_FAILED`) on >1 Branch document; returns `null` (not an error) on zero |
| Commerce Knowledge Categories | `listBusinessCategories` (`commerceKnowledgeReadService.ts`) | `nodeType == business_category`, `status == active` only |
| Commerce Knowledge Types | `listBusinessTypesForCategory` (`commerceKnowledgeReadService.ts`) | Re-validates `categoryId` server-side (exists, is a Category, is active) before querying; empty result is a valid, non-error outcome |
| Staff invitation list | `listStaffInvitationsForBusiness` / repository `listInvitationsByBusiness` | Business-scoped, optional status filter, no pagination |
| Staff membership list | `listStaffMembershipsForBusiness` / repository `listMembershipsByBusiness` | Business-scoped, no pagination |

## 4. Callable transport surfaces (functions/src/index.ts)

`getOwnedBusinesses`, `getBusinessContext`, `listBusinessCategories`, `listBusinessTypesForCategory`, `createStaffInvitation`, `revokeStaffInvitation`, `listStaffInvitations`, `listStaffMemberships`, `acceptBusinessTerms`. Every one follows the pre-existing authenticated-caller → whitelist-parse → domain-service pattern (`resolveAuthenticatedBusinessActor` → a dedicated `parse*Request` function reading only named fields → the domain service). `createStaffInvitation`/`revokeStaffInvitation` are pure transport wrappers around the already-complete, unmodified `ENG-P2-003` domain commands — no domain logic duplicated.

## 5. Repository additions

`listBusinessesByOwner`, `readDefaultBranchForBusiness` (`businessRepository.ts`); `listActiveSelectableNodes` (`knowledgeNodeRepository.ts`); `listInvitationsByBusiness` (`businessMembershipInvitationRepository.ts`); `listMembershipsByBusiness` (`businessMembershipRepository.ts`); the full `businessTermsAcceptanceRepository.ts` (transactional get-or-create, transactional read, non-transactional read). Every list query filters out documents that fail to parse (fail closed) rather than surfacing malformed data.

## 6. DTO boundaries

`OwnedBusinessSummary`, `BusinessContext`/`BusinessContextBranch`/`BusinessContextTermsAcceptance`, `CommerceKnowledgeOptionDto`, `StaffInvitationSummary`, `StaffMembershipSummary` — every one reviewed for privacy: no `ownerUserId`/`schemaVersion`/audit timestamps on Business DTOs, no Commerce Knowledge editorial-state/audit/replacement-internals, no `AuthenticationReference` internals or raw email/phone delivery-target values on Staff DTOs, no raw Customer Identity (`userId`) on the membership roster DTO.

## 7. Terms persistence — schema as built

```ts
type BusinessTermsAcceptance = {
  id: string;                        // businessId_acceptingCustomerIdentityId_termsVersion
  acceptingCustomerIdentityId: string;
  businessId: string;
  termsVersion: string;
  acceptedAt: Date;
  languageCode: LanguageCode;
  collectionMethod?: string;
  createdAt: Date;
  schemaVersion: number;
};
```

Deterministic composite id, write-once by construction (no update function exists anywhere in the model or repository). Matches design §37.3 exactly, including the deliberate exclusion of a `status` field (no Terms-withdrawal flow is governed) and of `Business.termsAccepted: boolean` (Option C, explicitly rejected by the design as unable to express who/which-version/when).

## 8. Terms server-authority model

`getCurrentlyRequiredBusinessTermsVersion()` (`functions/src/config/businessTermsConfig.ts`) reads `process.env.BUSINESS_TERMS_CURRENT_VERSION`, trims it, and returns `null` for unset/empty/whitespace-only. It is a function, not a module-load constant, specifically so tests can vary it per-case. Both consumers — `acceptBusinessTermsCommand` and `submitBusinessForVerificationCommand`'s new precondition — call it fresh, inside their own transaction, and throw a fail-closed error (`businessTermsConfigurationUnavailableError`) rather than skip the check when it returns `null`. `parseAcceptBusinessTermsRequest`'s return type has no `termsVersion` field — a client cannot express one even by supplying an extra key on the request payload (proven by `index.test.ts`'s adversarial mass-assignment test).

## 9. Terms idempotency

`getOrCreateBusinessTermsAcceptanceInTransaction` performs a transactional read of the deterministic-id document; if it exists, the existing record is returned unchanged (`created: false`) — never re-validated, never re-written. `acceptBusinessTermsCommand` surfaces this as `alreadyAccepted: true` in a normal success response, never an error — matching design §37.9's explicit "silent success, resubmitting an already-accepted step should never read as a failure." A later Terms version produces a structurally different deterministic id, so it is always an additional, immutable record; the earlier version's record is never touched. Emulator tests 24/25/33 (`acceptBusinessTermsCommand.emulator.test.ts`) prove: identical repeat acceptance is a deterministic no-op, a version bump creates a distinct record leaving the earlier one intact, and `acceptedAt` on a repeated call never changes.

## 10. TOCTOU handling

`submitBusinessForVerificationCommand`'s new precondition (`assertCurrentBusinessTermsAccepted`, `businessLifecycleCommand.ts`) runs inside `mutation.prepare` — strictly after `authorizeAndExecute`'s own permission evaluation (so an unauthorized caller never learns Terms-acceptance state) and strictly before `mutation.apply`'s write — reading both the current-Terms-version config and the acceptance record via the same `Transaction` object the lifecycle write itself uses. `acceptBusinessTermsCommand` similarly reads the current version and writes the acceptance record inside one `db.runTransaction` call alongside the Owner-authority re-derivation. In both cases, Firestore's snapshot-isolation/optimistic-concurrency semantics mean a concurrent Terms-version change (or a concurrent acceptance/submission) that would invalidate the read set forces a transaction retry, not a stale read leaking through — verified directly against the transaction-phase code, and exercised by emulator test 34 ("concurrent Terms-version change vs. submit cannot allow a stale acceptance to satisfy the new version").

## 11. Legal-content boundary

**No real Terms version or Terms content was invented, chosen, or hardcoded anywhere in this package.** `businessTermsConfig.ts`'s own module comment states this explicitly and names the specific values that must never appear (`"v1"`, `"1.0"`, `"2026-08"`). A manual grep of every production file for terms-version-shaped string literals found none outside test files, and every test-only value is unambiguously prefixed `TEST_ONLY_FIXTURE_`. `DEC-LEGAL-002` (`docs/00-governance/decisions/decision-register.md`) — the Terms *content* decision (reward obligations, dispute language, platform liability) — remains `OPEN_LEGAL` and untouched by this task; this package only builds the acceptance *mechanism*, exactly as design §37.5/§37.9 scoped it.

## 12. Submit precondition

`submitBusinessForVerificationCommand` now additionally requires that the Business's current `ownerUserId` has an acceptance record for the exact currently-configured Terms version — never merely "some acceptance exists" (verified: another Business's acceptance, another identity's acceptance for the same Business, and a stale-version acceptance all fail the precondition; emulator tests 26/27/28b/30/31). Fails closed identically to the acceptance command if Terms config is absent (test 29b). No lifecycle change occurs on Terms acceptance itself (test 32) — the precondition is additive to the existing `business.submitForVerification` state machine, not a replacement for it.

## 13. Privacy/security review

Every new DTO reviewed (§6 above). Every new callable authenticates first via the existing `resolveAuthenticatedBusinessActor`/`firebaseAdminTokenVerifier` path before touching any domain logic. Every whitelist parser (`parseCreateStaffInvitationRequest`, `parseRevokeStaffInvitationRequest`, `parseAcceptBusinessTermsRequest`) reads only named fields, structurally excluding authority-bearing fields (`invitedBy`, `status`, `id`, `acceptingCustomerIdentityId`, `termsVersion`, `acceptedAt`) even when present on the raw payload — each regression-tested in `index.test.ts`. Every read re-derives caller authority server-side from the caller's live membership/ownership record (`businessCallerAuthority.ts`, `staffTransportReadService.ts`'s `assertActiveMembership`) — a client-supplied `businessId` alone never establishes access. Cross-tenant/cross-Business denial is uniformly mapped to the same "not found" response as a genuinely nonexistent resource (enumeration resistance).

## 14. Error taxonomy

Seven new error factories (`businessReadNotAuthorizedError`, `businessTermsConfigurationUnavailableError`, `businessTermsAcceptanceInProgressError`, `currentBusinessTermsNotAcceptedError` on the Business side; `staffReadNotAuthorizedError` on the Permissions side; `businessCategoryNotFoundForTypeListingError` on the Commerce Knowledge side), all mapped onto the pre-existing closed `ErrorCategory` taxonomy (`RESOURCE_NOT_FOUND`, `TEMPORARY_UNAVAILABLE`, `IDEMPOTENCY_CONFLICT`, `VALIDATION_FAILED`). No fifteenth category was introduced.

## 15. Test coverage

New/extended files: `businessTermsConfig.test.ts` (unit), `businessTermsAcceptance.test.ts` (unit), `businessReadService.emulator.test.ts`, `commerceKnowledgeReadService.emulator.test.ts`, `staffTransportReadService.emulator.test.ts`, `acceptBusinessTermsCommand.emulator.test.ts` (676 lines, the largest single test file in this package), plus fixture updates to `businessProfileLifecycle.emulator.test.ts` (seeding a `TEST_ONLY_FIXTURE_v0` Terms configuration/acceptance so the pre-existing owner-submission tests continue to pass against the new precondition — the precondition itself was never weakened) and a mass-assignment regression suite added to `index.test.ts`.

Coverage against the task's required matrix: Business reads (owner lists own Business; cannot list another owner's; bounded summary; default Branch read incl. zero/multiple-Branch fail-closed) — covered. Commerce Knowledge (active-only listing, inactive exclusion, category-scoped types, empty-list validity, FR→EN fallback) — covered. Staff (Business-scoped invitation/membership listing, cross-Business enumeration resistance, bounded DTO privacy) — covered. Terms (all 19 named scenarios: server-derived identity, no client-choosable version, current-version acceptance, idempotent repeat, version-bump creates a new record, Owner-only authority, cross-Business/cross-identity non-satisfaction, missing-config fail-closed, submit precondition in both directions, lifecycle non-alteration, immutable history, TOCTOU) — covered, each individually numbered in the emulator test file matching the task spec's own enumeration.

## 16. Full validation results

- `pnpm --filter functions typecheck`: clean.
- `pnpm --filter functions test` (unit): **1441/1441 passing**, 143 files.
- `pnpm emulators:validate` (full Firebase Emulator Suite): run twice. First run: **665/666 passing** — the one failure (`knowledgeNodeRepository.emulator.test.ts`, a concurrent-creation timing test, file untouched by this task) is the pre-existing, already-registered `ENG-CI-001` full-suite-load timing flake documented in the `ENG-P3-001C` report. Second, immediately repeated run: **666/666 passing**, 49 files — clean. No application code was changed to paper over the flake.
- `pnpm --filter web test`: **397/397 passing**, 51 files — unaffected (confirms zero `apps/web` diff).
- `pnpm run lint`: clean.
- `pnpm run format:check`: clean.
- `pnpm run build` (both workspaces): clean (pre-existing, unrelated `apps/web` chunk-size warning only).
- Manual secret/Terms-version scan of the full diff: clean (see §11).
- `git diff --stat -- apps/web`: empty. `git diff --stat -- firestore.rules`: empty. `git diff --stat -- functions/src/domains/permissions/models/ordinaryPermissionCatalogue.ts functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts`: empty.
- No Firebase deployment performed.

## 17. Independent self-review (Phase AG)

Re-read the full diff cold, checking each item the task named:

1. **Client cannot choose required Terms version** — confirmed: `parseAcceptBusinessTermsRequest`'s return type has no `termsVersion` field; the command reads `getCurrentlyRequiredBusinessTermsVersion()` server-side only.
2. **Accepting Customer Identity cannot be spoofed** — confirmed: `userId` comes exclusively from `resolveAuthenticatedBusinessActor`; no request parser anywhere in this package accepts `acceptingCustomerIdentityId`.
3. **Terms acceptance cannot authorize another Business** — confirmed: the deterministic acceptance id is keyed by `businessId`; `resolveAuthorizedBusinessForOwnerAction` re-derives Owner authority per-`businessId` on every call; emulator test 27 proves another Business's acceptance does not satisfy this Business's precondition.
4. **Stale Terms version cannot satisfy submission** — confirmed: the precondition reads the acceptance keyed by the *current* configured version, not any historical acceptance; emulator test 26.
5. **Submit/Terms-version TOCTOU is coherent** — confirmed against the actual transaction code (§10 above); emulator test 34.
6. **Business reads cannot cross tenants** — confirmed: `resolveAuthorizedBusinessForRead` requires an active membership; tests confirm identical "not found" for both nonexistent and unauthorized Business ids.
7. **Staff list queries cannot cross Businesses** — confirmed: `assertActiveMembership` in `staffTransportReadService.ts`; emulator test 37 (both invitation and membership lists).
8. **Commerce Knowledge transport exposes only active selectable values** — confirmed: `listActiveSelectableNodes` hard-filters `status == "active"`, not caller-suppliable.
9. **No direct Firestore Rules relaxation** — confirmed: `git diff --stat -- firestore.rules` is empty.
10. **No frontend leakage** — confirmed: `git diff --stat -- apps/web` is empty.

No genuine defect was found during this review pass requiring a fix.

## 18. Explicit exclusions confirmed

`apps/web/` — zero diff. `firestore.rules` — zero diff. Permission catalogues (`ordinaryPermissionCatalogue.ts`, `sensitivePermissionCatalogue.ts`) — zero diff. `acceptStaffInvitation` callable exposure — not added, per design §40's explicit non-assignment to `ENG-P3-002A`. No real Terms legal content or production version string. No `pending_verification → trial` transition logic touched. No subscription/billing/Reward Program work. No production deployment performed.

## 19. `ENG-P3-002B` handoff

The frontend package can now build against real, tested callables: `getOwnedBusinesses` (resume-detection), `getBusinessContext` (onboarding-hydration, including the `termsAcceptance` projection for the Terms-acceptance wizard step), `listBusinessCategories`/`listBusinessTypesForCategory` (Category/Type selection with EN/FR fallback), `createStaffInvitation`/`revokeStaffInvitation`/`listStaffInvitations`/`listStaffMemberships` (the Staff-invite step and review screen), and `acceptBusinessTerms` (the Terms-acceptance step, an explicit affirmative-checkbox UI per design §16 — `termsVersion` is never a form field). No new schema or persisted onboarding-progress field exists; §8/§38 resume semantics are fully reconstructible from these reads alone, as designed.

## 20. STOP conditions encountered

None. Every requirement traced to either already-governed design (`ENG-P3-002-DESIGN-001` §9/§11/§13/§14/§21/§25/§37/§39/§40) or the task spec's own explicit fallback guidance (e.g. the pre-existing-test-regression handling in §16 above).
