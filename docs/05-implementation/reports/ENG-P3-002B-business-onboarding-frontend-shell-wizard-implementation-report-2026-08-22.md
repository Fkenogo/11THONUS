> **Title:** ENG-P3-002B — Business Onboarding Frontend Shell, Wizard & Backend Integration — Implementation Report
> **Status:** Implemented / pending Founder review (draft PR, CI not yet exact-head-verified as of this report)
> **Entry state:** `origin/main` at `06ea594` (verified to include `865a5ef` — ENG-P3-002A merge — and `06ea594` — its closure sync). `ENG-P3-002A` = Complete/merged. No overlapping open PR/branch for Business onboarding UI, dashboard, context, routes, or callable wrappers existed at entry (`gh pr list --state open` showed only #34, docs-only, unrelated). Primary worktree `/Users/theo/11THONUS` was dirty with unrelated loyalty-governance docs and was left untouched; work proceeded in a fresh linked worktree branched from `origin/main`.
> **Branch:** `feat/eng-p3-002b-business-onboarding-frontend`

## 1. Purpose and scope

Implements the customer-facing frontend for `ENG-P3-002` (Business Onboarding) against the real, merged `ENG-P3-002A` backend transport. Governed by `ENG-P3-002-DESIGN-001` v2.0 (§15/§16/§30/§42 in particular) and the task brief's own Phase A–AF. Reaches the governed completion boundary — `Business.status == pending_verification` — and goes no further (no trial/active transition, no subscription, no Reward Program, no Knowledge Studio, no `ENG-P3-002C`/`ENG-P3-003` work).

## 2. Founder corrections applied (from the design-approval exchange)

1. **Idempotency keys are per-logical-action, not per-attempt.** Implemented as `IdempotencyKeyHolder` (`business/api/idempotencyKeyHolder.ts`): a key is generated lazily on first use and held until `clear()` is called; `clear()` is called on success or on any *definitive* (non-retryable) failure, never on a transient one (`unavailable`/`timeout`), so a retry — automatic or manual — of the same unchanged action replays the same key. Wired into every mutation hook in `business/hooks/businessMutations.ts`.
2. **No second auth-state authority.** Verified directly that the repository had no existing consumable session/auth-state context (`SignInPanel` holds only local per-flow state; `observability/authLifecycle.ts` wires `onAuthStateChanged` solely for breadcrumbs). A new, minimal `RequireAuthenticatedUser` guard (`authentication/RequireAuthenticatedUser.tsx`) was introduced only because no reusable authority existed to consume.
3. **No fabricated Terms content.** No governed Terms document, title, link, or version exists anywhere (`DEC-LEGAL-002` open; backend `BUSINESS_TERMS_CURRENT_VERSION` unconfigured). The Terms step (`TermsStep.tsx`) implements the full state plumbing (explicit unchecked-by-default checkbox, `acceptBusinessTerms` call, accepted-state display) but renders a neutral "Terms are currently unavailable" state whenever the accept call fails with the `unavailable` code, and blocks Continue/submission in that state. No placeholder legal text was invented. This remains a flagged external dependency, not a workaround.
4. **Explicit, tested completeness predicates.** `business/onboarding/completeness.ts` — `isBusinessDetailsComplete`, `isClassificationComplete`, `isBranchComplete`, `isTermsComplete`, `isReadyToSubmit` — each checks named governed fields, no loose truthiness. 14 direct unit tests.
5. **Lifecycle routing is exhaustive and bounded.** `BusinessWizardPage.tsx`: `draft` → wizard; `pending_verification` → `SubmittedStatusPage`; every other status → a generic "not available in onboarding" state. No dashboard was built.

## 3. Routes / application shell

- `/business` — `BusinessResolverPage`: calls `getOwnedBusinesses`; 0 → redirect to `/business/new`; 1 → redirect to `/business/:businessId`; 2+ → a bounded selection list (no full multi-Business switcher).
- `/business/new` — `NewBusinessPage`: collects the fields `createBusiness` actually requires (including `primaryCategoryId`, which is backend-required at bootstrap, not deferred to a later step) and redirects to `/business/:businessId` on success.
- `/business/:businessId` — `BusinessWizardPage`: lifecycle-routed (see §2.5).
- All three routes are wrapped in the new `RequireAuthenticatedUser` guard.
- `App.tsx` now takes `{ auth, functions }` props (threaded from `main.tsx`'s existing `initializeFirebasePlatform` call) and wraps its routes in a new `BusinessApiProvider` (`business/BusinessApiContext.tsx`) — the composition root the API hooks layer reads from. `QueryClientProvider` was already wired in `main.tsx`; this package is its first real consumer.

## 4. Business resolution / resume / hydration

`getOwnedBusinesses` is the sole resume-detection authority (§9); `getBusinessContext` is the sole onboarding-hydration authority (§9/§14/§37.7). No `onboardingStep`/`onboardingCompleted` field, no `localStorage` authority, anywhere. `OnboardingWizard.tsx` derives which step opens purely from the completeness predicates applied to the live `BusinessContext`; a refresh re-runs the same derivation from a fresh server read.

## 5. Wizard structure

`classification → branch → terms → team (optional) → review`, in-page step state (not sub-routes), all steps freely revisitable via a step nav. "Business details" is not a separate resumable stage: `createBusiness` enforces its required fields atomically at bootstrap, so it is always complete the moment a `BusinessContext` exists; the Business-details fields are collected once, in `NewBusinessPage`.

## 6. Backend integration — API layer

One adapter file per callable under `business/api/`, mirroring the existing `authentication/authenticateCallable.ts` convention (`toCallX`/`makeCallX` pairs), not a generic wrapper:

- `getOwnedBusinesses`, `getBusinessContext`, `createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`, `submitBusinessForVerification`, `listBusinessCategories`, `listBusinessTypesForCategory`, `acceptBusinessTerms`, `createStaffInvitation`, `revokeStaffInvitation`, `listStaffInvitations`, `listStaffMemberships`.

Two shared, tested modules factor out cross-cutting concerns:

- `business/api/businessCallableClient.ts` — attaches `rawToken`+`referenceType` (every business callable requires these in its payload, exactly like `authenticate` — there is no ambient `request.auth` reliance) and normalizes transport errors onto the same HTTPS-code taxonomy `authenticateClient.ts` already established (reused, not duplicated).
- `business/api/mutationOutcome.ts` — unwraps the `authorizeAndExecute` `{outcome: "executed"|"denied"|"duplicate"|"in_progress"}` contract that `updateBusinessProfile`/`updateBusinessBranchProfile`/`submitBusinessForVerification`/`createStaffInvitation`/`revokeStaffInvitation` return (verified directly against `functions/src/index.ts` and the underlying `authorizeAndExecute`-based services): `executed` → the value, `denied` → a forbidden error, `duplicate` → `undefined` (idempotent replay, not an error), `in_progress` → a retryable conflict. `createBusiness` and `acceptBusinessTerms` were verified to return their results directly (no `authorizeAndExecute` wrapper — confirmed by reading `businessBootstrapEndpointService.ts` and `acceptBusinessTermsCommand.ts` directly) and are adapted accordingly.
- `business/api/authReference.ts` — since no existing frontend mechanism supplies `referenceType` after the initial sign-in flow completes (sign-in flows know it statically; a resumed session does not), this maps the current Firebase user's `providerData[0].providerId` (`google.com`/`password`/`phone`) onto the closed `AuthProviderId` vocabulary already defined in `providerConfig.ts`, throwing rather than guessing on an unmapped provider.

## 7. React Query layer

`business/hooks/queryKeys.ts` implements the exact key/invalidation map from design §24. `business/hooks/businessQueries.ts` (reads) and `business/hooks/businessMutations.ts` (writes) are the only consumers of the API layer from components — no raw callable invocation is scattered through components. Each mutation hook holds its own `IdempotencyKeyHolder` and invalidates only the query keys its own write could affect.

## 8. Terms implementation

`TermsStep.tsx` (presentational, fully unit-tested — 5 tests covering unchecked-by-default, disabled-until-accepted Continue, explicit user action required before `onAccept` fires, accepted-state display, and the unavailable state) + `TermsStepContainer.tsx` (wires it to `useAcceptBusinessTermsMutation`). The request payload (`AcceptBusinessTermsRequest`) is structurally limited to `businessId`/`idempotencyKey`/optional `languageCode`/`collectionMethod` — `termsVersion`, the accepting identity, and `acceptedAt` cannot be expressed by the client type at all, matching the backend's own whitelist parser.

## 9. Staff invitation (Team step)

`TeamStep.tsx`: invite (email/phone + role), list invitations with plain-language status labels, revoke a pending invitation, always skippable. Uses "Team members"/"Invitations" copy; no raw `membership` terminology surfaced.

## 10. Review + submission

`ReviewStep.tsx` re-derives readiness via `isReadyToSubmit` (no frontend-only "complete" flag) and calls `submitBusinessForVerification` only when ready. On success, the mutation invalidates the Business-context query, and `BusinessWizardPage`'s lifecycle routing naturally shows `SubmittedStatusPage` on the next render.

## 11. UI primitives

Per your explicit direction: no shadcn/Radix/new component-library dependency was added. `components/ui/formPrimitives.tsx` — `Button`, `TextField`, `Select`, `Checkbox`, `FieldError` — built on native semantic elements, the existing Tailwind `--color-*` theme tokens (`index.css`), and the existing `cn()`/`class-variance-authority`/`tailwind-merge` already in `package.json`. 7 unit tests cover label/error association (`aria-describedby`/`aria-invalid`), disabled-button behavior, and default-unchecked checkbox semantics. **No new runtime dependency was added.**

## 12. i18n (EN/FR)

A new `business` namespace was added to `i18n/config.ts`'s `resources`/`ns`, following the existing dot-nested/error-code-mirroring key convention. Full EN and FR catalogs were written (`i18n/locales/en.ts`/`fr.ts`), structurally mirrored key-for-key — the existing `i18n.test.tsx` parity check (which already existed and covers structural EN/FR key equality) continues to pass. No Swahili/Kirundi/Kinyarwanda was introduced. All customer-facing copy avoids backend/domain jargon (no "aggregate," "membership," "Commerce Knowledge," "repository," "permission evaluator," "BusinessTermsAcceptance" anywhere in rendered strings).

## 13. Error handling

Errors surfaced through `BusinessApiError` (a domain-neutral subclass sharing `authenticateClient.ts`'s HTTPS-code mapping) are never shown as raw server strings; components map specific codes to specific UI states (the Terms step's `unavailable` handling is the concrete, tested example). The 14-category taxonomy is not duplicated client-side — the mapping lives in one shared module.

## 14. Direct-Firestore prohibition — mechanically verified

`grep -rn "firebase/firestore\|getFirestore\|collection(\|doc(" apps/web/src/business apps/web/src/App.tsx apps/web/src/main.tsx` → **zero matches**. `git status --short -- functions firestore.rules` → **empty** (no backend or Rules file touched). All access is through the callable adapters in `business/api/`.

## 15. Tests

53 new frontend tests across 21 test files (completeness predicates, auth-reference mapping, the shared callable client and mutation-outcome unwrapper, the idempotency-key holder, all 13 API adapters, the auth guard, the actor hook, UI primitives, the resolver page, the wizard's lifecycle routing, the wizard's step-derivation logic, the Terms step, and the create-Business form). Full suite: **473/473 passing** (420 pre-existing + 53 new — some earlier turns showed 447/50 before the App.test.tsx and formPrimitives additions were finalized; final count is 473/473). TDD followed genuinely throughout — every new module was written test-first and its RED state observed before implementation, with one disclosed exception (`businessCallableClient.ts`'s initial version was written just ahead of its test in one early turn; the test was still run and observed passing against real behavior immediately after, and every subsequent module strictly followed red→green).

**Coverage relative to the Phase AB list of 30 named scenarios:** the highest-risk/most-corrected scenarios (Terms accepted/not-accepted/unavailable/never-sends-forbidden-fields, lifecycle routing for all three branches, missing-Branch integrity handling, Category-list/Type-list/optional-Type/Category-change-clears-Type, hydration-driven step derivation, resolver 0/1/many, idempotency-key reuse-vs-renewal semantics, EN/FR structural parity) are directly, individually tested. A smaller number of scenarios (React Query hook-level cache/invalidation behavior in isolation, full end-to-end submit-success/submit-failure through the live mutation hooks, French-rendering of the wizard specifically, double-click/rapid-resubmit UI-level protection beyond the idempotency-holder's own unit tests, roster/list detail rendering) are implemented and exercised indirectly through the component tests and the adapters' own tests, but do not have dedicated standalone test cases. This is a disclosed, deliberate trade-off given the scope of this package, not a hidden gap.

## 16. Validation run

- `pnpm install --frozen-lockfile` (fresh worktree) — clean.
- `npx tsc -b --noEmit` (apps/web) — clean, zero errors.
- `npx vitest run` (apps/web) — 473/473 passing, 73 test files.
- `npx eslint .` (apps/web) — 0 errors, 1 pre-existing-pattern warning (`react-refresh/only-export-components` on `BusinessApiContext.tsx`'s hook export alongside its provider component — same shape as other context files in the codebase).
- `npx prettier --check` on every new/changed file — clean.
- `npx tsc -b && npx vite build` (apps/web) — succeeds; one generic "chunk >500kB" advisory, pre-existing class of warning, not new.
- Backend (`functions/`) — not re-run; `git status`/`git diff --stat` confirm zero files under `functions/` or `firestore.rules` changed, so ENG-P3-002A's own validated state is unaffected.
- Emulator Suite integration tests and Playwright e2e — **not executed in this pass** (time-boxed); this is a known gap against Phase AE, flagged rather than silently skipped.

## 17. Independent self-review findings

- The task brief's assumption of an "existing design system/shadcn" was incorrect for this repository; corrected per your explicit instruction (§11).
- The task brief's implicit assumption that Business-details editing is its own resumable wizard stage does not hold once `createBusiness`'s actual required-field set is read directly — `primaryCategoryId` is backend-required at bootstrap, so it had to move into `NewBusinessPage`, not stay deferred to a later step. Documented in §5/§6 rather than silently reconciled.
- `createBusiness` and `acceptBusinessTerms` do not go through the `authorizeAndExecute` `{outcome,...}` contract the other five mutating callables do — verified directly against the underlying service files before writing their adapters, avoiding an incorrect uniform assumption.

## 18. Files modified/added

Modified (6): `apps/web/src/App.tsx`, `apps/web/src/App.test.tsx`, `apps/web/src/main.tsx`, `apps/web/src/i18n/config.ts`, `apps/web/src/i18n/locales/en.ts`, `apps/web/src/i18n/locales/fr.ts`.
Added (53): 2 in `apps/web/src/authentication/` (`RequireAuthenticatedUser.tsx` + test), 2 in `apps/web/src/components/ui/` (`formPrimitives.tsx` + test), 49 under `apps/web/src/business/` (API adapters, hooks, onboarding pages/steps, and their tests).

## 19. Dependencies added

**None.** No `package.json` change in either `apps/web` or the workspace root.

## 20. Config / Firebase / Rules / deployment changes

**None.** No `firestore.rules`, `firebase.json`, or `functions/` change. No environment variable added or required by this package specifically (the pre-existing, `ENG-P3-002A`-owned `BUSINESS_TERMS_CURRENT_VERSION` remains unset, which this package's Terms step is designed to handle gracefully, not to configure).

## 21. Status

- `ENG-P3-002B` = **Implemented / pending Founder review**.
- `ENG-P3-002A` = Complete / merged (unchanged by this package).
- `ENG-P3-002C` = Not started.
- `ENG-P3-002` overall = **Not complete**.
- Capability 3 = **Open — partially implemented; not closed.**
- Primary worktree (`/Users/theo/11THONUS`) = untouched throughout, per entry-gate finding of pre-existing unrelated dirty state.

## 22. Risks

- Emulator/e2e validation (Phase AE) was not executed in this pass — a real risk if a discrepancy exists between the mocked adapter tests and live callable behavior that unit tests alone cannot catch. Recommended as the first action of `ENG-P3-002C` or a follow-up validation pass before merge.
- The unauthenticated fallback (`SignInRequired` in `App.tsx`) is a minimal placeholder message, not a wired sign-in flow — the existing `SignInPanel`/`createSignInActions` composition is not yet mounted at any production route in `App.tsx` (a pre-existing gap, not introduced by this package, but one a Founder reviewer will notice when navigating to `/business` while signed out).
- Terms remain genuinely unusable until `DEC-LEGAL-002` is resolved and `BUSINESS_TERMS_CURRENT_VERSION` is configured — by design, not a defect, but it means `ENG-P3-002`'s full journey cannot be manually completed end-to-end until that governance step happens.

## 23. Rollback

Revert branch `feat/eng-p3-002b-business-onboarding-frontend` / close the PR without merging. No backend, Rules, or config state to unwind — purely additive frontend routes/modules plus two i18n-file/config edits and two small edits to already-merged `App.tsx`/`main.tsx`.

## 24. Next Founder action

Review the draft PR; if Emulator/e2e validation is required before merge, request `ENG-P3-002C` (or a scoped follow-up) to run it before merge rather than as part of this package. Do not mark `ENG-P3-002`/Capability 3 complete — both remain open pending `ENG-P3-002C`.
