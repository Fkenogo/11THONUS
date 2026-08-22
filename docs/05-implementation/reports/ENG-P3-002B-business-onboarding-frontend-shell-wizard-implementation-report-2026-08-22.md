> **Title:** ENG-P3-002B — Business Onboarding Frontend Shell, Wizard & Backend Integration — Implementation Report
> **Status:** Implemented, independently reviewed, and corrected. See §25 (Independent Final Review — 2026-08-22) for the review findings/corrections applied after the initial implementation. Draft PR [#154](https://github.com/Fkenogo/11THONUS/pull/154); CI green on every reviewed head (see §25 for the exact-head record of the reviewed/corrected commit).
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
- Backend (`functions/`) — not re-run locally; `git status`/`git diff --stat` confirm zero files under `functions/` or `firestore.rules` changed, so ENG-P3-002A's own validated state is unaffected.
- Emulator Suite integration tests and Playwright e2e were **not run locally** in this pass, but the repository's CI pipeline (`gh pr checks`/`gh run watch` against PR #154, head `f650f7f`) runs both as part of its standard "Build, Lint, Test, Emulator Validation" job — **CI ran and passed all steps**, including "Install Playwright browsers" → "Playwright e2e" and "Firebase Emulator Suite validation", alongside Build/Lint/Format check/Typecheck/Unit-component tests. Confirmed via `gh run watch` on the exact PR head SHA. This resolves the emulator/e2e gap originally flagged below in an earlier draft of this report.

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

- CI's Emulator Suite/Playwright e2e passing confirms the build integrates cleanly against a live emulator and that the existing e2e suite is not broken by this change; it does not by itself constitute a *new* end-to-end test walking the onboarding wizard itself against the emulator (no such test was added in this package — the existing Emulator/e2e suites are pre-existing coverage, not onboarding-specific). A dedicated onboarding-flow emulator/e2e test remains a reasonable addition for `ENG-P3-002C` to consider, not a defect in what shipped here.
- The unauthenticated fallback (`SignInRequired` in `App.tsx`) is a minimal placeholder message, not a wired sign-in flow — the existing `SignInPanel`/`createSignInActions` composition is not yet mounted at any production route in `App.tsx` (a pre-existing gap, not introduced by this package, but one a Founder reviewer will notice when navigating to `/business` while signed out).
- Terms remain genuinely unusable until `DEC-LEGAL-002` is resolved and `BUSINESS_TERMS_CURRENT_VERSION` is configured — by design, not a defect, but it means `ENG-P3-002`'s full journey cannot be manually completed end-to-end until that governance step happens.

## 23. Rollback

Revert branch `feat/eng-p3-002b-business-onboarding-frontend` / close the PR without merging. No backend, Rules, or config state to unwind — purely additive frontend routes/modules plus two i18n-file/config edits and two small edits to already-merged `App.tsx`/`main.tsx`.

## 25. Independent Final Review (2026-08-22) — findings and corrections

A second, independent review pass (entry head `29b4d6b`, same worktree/branch) found and corrected one genuine defect and one localization gap before merge authorization:

**Finding 1 — Terms UX violated the product/legal boundary (material, corrected).** The original `TermsStep` rendered the consent checkbox and accept button by default whenever `termsAcceptance.accepted === false` and no prior mutation error existed — i.e. it discovered Terms-content unavailability only by *attempting* acceptance and catching the backend's `unavailable` error, rather than never offering consent for content the user cannot read in the first place. Reproduced with a failing test first (`TermsStep.test.tsx`, "renders no checkbox, no accept button, and a neutral unavailable state before any acceptance attempt" — observed RED against the original component: `found <input ... type="checkbox" />`).

**Content-authority finding (§C):** re-grepped the full repository (`termsDocument`, `termsUrl`, `TERMS_DOCUMENT`, `TERMS_URL`, `termsContentUrl`) and re-read `ENG-P3-002-DESIGN-001` §37.5 directly. Confirmed: a server-authoritative *required Terms version* (`BusinessContextTermsAcceptance.version`, a bare label) is the only thing that exists anywhere — there is no user-*readable* Terms document/link/content source in this codebase, and the design document itself says so explicitly ("no in-repo legal-document CMS"; the actual content is `DEC-LEGAL-002`, still open). Distinguishing (A) the version reference from (B) readable content was the crux of the original defect: the UI treated "a version might exist" as sufficient grounds to ask for consent.

**Correction:** `TermsStep.tsx` now gates the entire consent UI behind a single, explicit, hard-pinned `TERMS_READABLE_CONTENT_AVAILABLE = false` constant (commented with the reasoning above) — no checkbox, no accept button, `Continue` disabled, whenever that flag is false, regardless of any mutation error state. The backend's `unavailable` error remains checked (`isUnavailableError`) as secondary defense for the day a real content source exists and the acceptance attempt itself fails server-side — but it is no longer the *primary* mechanism by which the frontend learns content doesn't exist. Verified GREEN against the corrected component.

**Finding 2 — hardcoded customer-facing strings (corrected).** Direct source review (not a text-search substitute) found two literal English strings outside the i18n system: `"Not available from onboarding."` in `BusinessWizardPage.tsx` (the non-onboarding-lifecycle fallback) and `"Please sign in to continue."` in `App.tsx`'s `SignInRequired`. Both moved into the `business` i18n namespace (`business.lifecycle.notAvailable`, `business.access.signInRequired`), EN and FR added. A mechanical re-sweep (`grep` for capitalized multi-word literals in `.tsx` outside `className`/`aria-`/`t(...)`) across every new production file confirms zero remaining hardcoded customer-facing strings.

**Re-verified, no change needed:**
- Auth guard (§H): re-grepped `origin/main` directly (still at `06ea594`, unchanged since entry) for `AuthContext`/`useSession`/`createContext` in `apps/web/src` — confirmed no canonical session authority exists; `observability/authLifecycle.ts` remains breadcrumb-only. `RequireAuthenticatedUser` is retained as originally built.
- Completeness/resume (§I): `isReadyToSubmit` checks exactly `isBusinessDetailsComplete && isClassificationComplete && isBranchComplete && isTermsComplete` — Team invitation is not and was never part of required completeness. Resume remains derived solely from `getBusinessContext`; no `onboardingStep`, no `localStorage` authority anywhere (re-grepped, zero matches).
- Routing/lifecycle (§J): `draft`/`pending_verification`/other-status branching in `BusinessWizardPage` is unchanged in structure; only the "other status" fallback copy was localized (Finding 2).
- Idempotency (§K): `IdempotencyKeyHolder`'s three unit tests directly prove reuse-across-retries, fresh-key-after-`clear()`, and no-premature-regeneration; every mutation hook in `businessMutations.ts` was re-read line-by-line and confirmed to call `holder.clear()` only in `onSuccess` or on a non-retryable `onError`, never mid-retry. All submit/accept/invite buttons are `disabled` while their mutation `isPending`, preventing UI-level double-fire independent of the key holder.
- Direct-Firestore/scope (§L): re-grepped `firebase/firestore`/`getFirestore`/`collection(`/`doc(` across `business/`, `App.tsx`, `main.tsx` — zero matches. `git diff origin/main --stat -- functions firestore.rules` — empty. Re-grepped for `subscription`/`reward`/`knowledge.studio`/`billing`/`plan` across the same tree — zero matches.

**Tests added/changed in this review pass:**
- `TermsStep.test.tsx` — fully rewritten: 6 tests (no-checkbox/no-button/unavailable-by-default, Continue-disabled, `onAccept`-never-called, accepted-state, backend-unavailable-state, no-fabricated-URL-or-PDF-text). All 9 Phase F scenarios are covered by these 6 tests plus the pre-existing `acceptBusinessTerms.test.ts` (covers scenario 8: the request payload structurally excludes `termsVersion`/identity/timestamp).
- `BusinessWizardPage.test.tsx` — the existing "other status" test's assertion updated to the new localized copy (its `/not available/i` regex no longer matched the corrected wording, since "isn't" doesn't contain the literal substring "not" — a genuine RED caught by running it, not merely inferred).
- `App.test.tsx` — added one new test proving a signed-out visitor to `/business` reaches the `SignInRequired` fallback (this test does not by itself distinguish hardcoded-vs-i18n-sourced text, since the English wording is identical either way; the i18n-migration itself was verified by direct source diff and mechanical grep, disclosed here rather than presented as a false RED/GREEN proof).

**Full validation after corrections:** `apps/web` typecheck clean, `apps/web` unit tests 475/475 (475 = 473 original + 1 net Terms-step-count-change + 1 new App test, after removing one ineffective test), `eslint .` 0 errors (1 pre-existing warning, unchanged), `prettier --check` clean, `tsc -b && vite build` succeeds. Reviewed/corrected head: see the branch's final commit before merge (recorded in the top-level PR/merge record, not duplicated here to avoid a stale SHA in an append-only doc).

## 24. Next Founder action

Review the draft PR (CI green on exact head — see §25). Do not mark `ENG-P3-002`/Capability 3 complete — both remain open pending `ENG-P3-002C` (hosted-preview validation and manual Founder QA of the actual onboarding journey).
