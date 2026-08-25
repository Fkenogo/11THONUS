# ENG-P3-002-UI-IMP-A — Business Establishment Experience (EST-01/02/03) Implementation Report

**Date:** 2026-08-25
**Task type:** Frontend structural implementation, TDD. **No backend, Firebase, Rules, or
deployment change.** PR opened as draft, pending independent review — not self-merged.

## 1. Entry repository state

`origin/main` at task start: `0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8`. **Entry-gate discrepancy
found and resolved before implementation began:** the governing chain
(`ENG-P3-002-UI-RECON-001`, `ENG-P3-002-UI-HANDOFF-001` + its Founder disposition,
`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` + its Founder disposition, the approved
`v3-designs/` Stitch assets) existed only uncommitted/untracked in the primary checkout — never
merged to `origin/main`. A fresh implementation worktree would not have seen any of it. Resolved
by committing the chain, unmodified, as its own bounded docs/assets PR
([#172](https://github.com/Fkenogo/11THONUS/pull/172), merged `26e4c1e321ae5f92cb110dfe4f5a6ef897099dfc`)
before creating the Package A worktree — reported, not silently worked around. This task's actual
implementation worktree was created from that updated `origin/main` (`26e4c1e...`), confirmed clean.

## 2. Reconciliation package confirmed

`ENG-P3-002-UI-RECON-001` §XV/PART XXIX names **Package A — Establishment Restructure
(EST-01/02/03)** as the first implementation package, exactly matching this task's scope. No
discrepancy.

## 3. Exact Package A scope from UI-RECON-001

EST-01 (Business Identity & Category) → EST-02 (Main Location & Operating Details, where
`createBusiness` fires) → EST-03 (Review & Finish Setup) → minimal Dashboard boundary
placeholder. Explicitly excludes Package B's Dashboard shell, Terms UI, Team UI, and Profile/
Locations management screens beyond what EST-03's own editing requires.

## 4. Pre-change architecture analysis

- **Current flow:** `NewBusinessPage.tsx` collected all 7 `createBusiness`-required fields
  (name/category/country/city/phone/currency/timezone) on one dense screen, submitted atomically.
  `/business/:businessId` (`draft`) opened `OnboardingWizard.tsx` — a five-tab, freely-navigable
  shell (Business category / Main location / Terms / Team / Review) with local `step` state,
  resumed via `firstIncompleteStep(context)`.
- **Structurally replaced:** the entire `OnboardingWizard.tsx` five-tab shell (deleted, along with
  its test file — explicitly marked for retirement in `ENG-P3-002-UI-RECON-001` Part IV, not
  reused by any later package).
- **Where creation occurred before:** on `NewBusinessPage`'s single form's Continue.
- **Where it occurs after:** EST-02's Continue — the real, unchanged `createBusiness` call,
  combining EST-01's in-memory values with EST-02's own fields.
- **Pre-create state survival:** ordinary React state lifted to `NewBusinessPage` (the route-level
  component), passed down as `initialValues` to each step — no persistence layer.
- **Post-create authority:** `getBusinessContext`/`BusinessWizardPage`'s existing query, unchanged
  — EST-03 reads this, never a client-only copy.
- **Refresh before/after creation:** before — same as today, form state is lost (no regression);
  after — unchanged, server-authoritative resume via `completeness.ts`, now supplemented by
  `establishmentCompleteness.ts` for the wizard's own retirement (draft is always establishment-
  complete by construction, so `/business/:businessId` always renders EST-03 directly for `draft`).
- **Reused:** `ClassificationStep.tsx`, `BranchStep.tsx` (both unmodified except one stale-comment
  fix in `BranchStep.tsx`), `useCreateBusinessMutation`/`useUpdateBusinessProfileMutation`/
  `useUpdateBusinessBranchProfileMutation` (all unmodified), `formPrimitives.tsx` (unmodified),
  `MutationError.tsx` (unmodified), `LanguageSwitcher` (unmodified).
- **Retired:** `OnboardingWizard.tsx` + test (deleted).
- **Why no backend/data-model change was required:** `createBusiness`'s required-field set is
  unchanged; EST-01/EST-02 simply collect the same fields across two screens instead of one before
  calling it. **One exception discovered and disclosed, not silently worked around — see §35.**

## 5. Fix strategy

Split establishment into three focused screens under a new
`apps/web/src/business/onboarding/establishment/` directory, orchestrated by a rewritten
`NewBusinessPage.tsx` (EST-01↔EST-02) and a new `EstablishmentReviewPage.tsx` (EST-03, mounted by
`BusinessWizardPage.tsx` for `draft`). A minimal `DashboardPlaceholder.tsx` + route wrapper forms
the Package A→B boundary. Reuse existing mutation/query hooks and edit components wherever
possible; introduce no new backend contract, no new lifecycle status, no persisted onboarding-step
model.

## 6. Approved Stitch references inspected

`business onboarding/refined_business_identity_desktop_compact` (EST-01 — independently confirmed
this task's field split, name/category/type/phone, matches exactly), `business location/est_02_main_location_operating_details_mobile`/`_desktop`
(EST-02 — confirmed country/city/location-name/address/currency/timezone matches exactly),
`business setup/est_03_review_finish_setup_mobile`/`_desktop` (EST-03 — confirmed the
Business/Main-location/Operating-details three-section review layout, "Finish setup" action).

## 7. Existing components reused

`ClassificationStep.tsx`, `BranchStep.tsx`, `useCreateBusinessMutation`,
`useUpdateBusinessProfileMutation`, `useUpdateBusinessBranchProfileMutation`,
`useBusinessCategoriesQuery`, `useBusinessTypesQuery`, `useBusinessContextQuery`, `Button`,
`TextField`, `Select`, `MutationError`, `LanguageSwitcher`.

## 8. Components/routes retired

`OnboardingWizard.tsx` + `OnboardingWizard.test.tsx` (deleted). `TermsStepContainer.tsx` and
`TeamStep.tsx` are **not** retired — kept, unmodified, simply no longer imported by the
establishment flow (reserved for Packages D/F).

## 9. New components/routes created

`establishment/establishmentCompleteness.ts`, `establishment/EstablishmentIdentityStep.tsx`
(EST-01), `establishment/EstablishmentLocationStep.tsx` (EST-02),
`establishment/EstablishmentReviewPage.tsx` (EST-03), `dashboard/DashboardPlaceholder.tsx`,
`dashboard/BusinessDashboardBoundaryPage.tsx`. New route: `/business/:businessId/dashboard`
(guarded by the existing `RequireAuthenticatedUser`, same pattern as every other Business route).

## 10. EST-01 implementation

Collects name, category (live Commerce Knowledge selector), optional type (dependent on category,
compact `<select>`, clears on category change per the existing `DEC-CKS-003` rule, governed "No
specific type"/"types unavailable" copy reused verbatim), and contact phone. No backend call.
Continue disabled until name+category+phone present.

## 11. EST-02 implementation

Collects country, city, location/branch display name, optional address, currency, timezone.
Continue disabled until all five required fields present. **Fires the real `createBusiness` call
here, exactly once**, combining EST-01's values with its own — proven by test (§25). Never sends
an `address` key to `createBusiness` (`Business.address` untouched, per the preserved disposition)
— any Branch address is applied after creation via the existing `updateBusinessBranchProfile` path.

## 12. `createBusiness` boundary evidence

`EstablishmentLocationStep.test.tsx`'s "fires createBusiness with every EST-01 + EST-02 value
combined, exactly once" test asserts `mockMutate` called exactly once with the full combined
payload including `supportedLanguages: []`, and a separate test asserts no `address` key is ever
sent. `NewBusinessPage.test.tsx`'s own test independently re-confirms the same boundary at the
orchestrator level, plus that navigation to `/business/:businessId` only happens after the
mutation's `onSuccess` actually fires (not optimistically).

## 13. EST-03 implementation

Renders once mounted by `BusinessWizardPage` for a `draft` Business — reads `context` (the real
`getBusinessContext` result) directly, never client-only state. Two sections: Business (name,
category/type labels resolved from the live Commerce Knowledge lists, contact phone) and Main
Location (branch name, city). Each section's "Edit" toggles the existing, unmodified
`ClassificationStep`/`BranchStep` components in place — same backend calls, no duplicated
semantics. "Finish setup" navigates to `/business/:businessId/dashboard`, making no backend call.

## 14. Post-create source-of-truth evidence

`EstablishmentReviewPage.test.tsx` renders the component directly from a `BusinessContext` prop
(the same shape `getBusinessContext` returns) and asserts the displayed name/category/location
match it exactly — there is no other state source in the component. `BusinessWizardPage.test.tsx`
(updated) confirms `draft` always mounts `EstablishmentReviewPage` fed by the live
`useBusinessContextQuery` result.

## 15. Back/edit behaviour

EST-02→EST-01 Back preserves EST-01's already-entered values (proven:
`NewBusinessPage.test.tsx`'s Back test). EST-03's "Edit" on either section opens the real,
governed edit form (`ClassificationStep`/`BranchStep`) against the persisted Business — not a
return to the pre-creation wizard, since none exists once EST-02 has succeeded (matches
`ENG-P3-002-UI-HANDOFF-001-FOUNDER-DISPOSITION`'s Brief 3 §6 exactly).

## 16. Finish-setup semantics

Confirmed by test and by code inspection: "Finish setup" calls only `navigate(...)` — no mutation
hook is invoked, `Business.status` is untouched, no Terms/Team action occurs.

## 17. Old wizard retirement result

`OnboardingWizard.tsx` and its test deleted. The five-tab
`Business category | Main location | Terms | Team | Review` row no longer exists anywhere in the
establishment or review flow — confirmed by `grep -r "OnboardingWizard"` returning zero import
sites after deletion.

## 18. Terms exclusion result

`EstablishmentReviewPage.test.tsx`'s "never renders Terms or Team content" test passes.
`TermsStepContainer.tsx`/`TermsStep.tsx` are untouched, unmodified, unimported by the
establishment flow — their domain/callable wiring (`acceptBusinessTerms`) is fully intact for
Package D to reuse.

## 19. Team exclusion result

Same test, same result, for Team. `TeamStep.tsx` and every Staff callable
(`createStaffInvitation`/`revokeStaffInvitation`/`listStaffInvitations`/`listStaffMemberships`)
are untouched, unimported by the establishment flow.

## 20. Mobile-first result

Every new screen reuses the same single-column `max-w-lg`/`flex flex-col gap-4` composition and
`formPrimitives.tsx` controls already proven usable at 375×812 across this whole workstream's
prior Founder QA passes (identical container/field classes to `NewBusinessPage`'s previous,
already-verified layout). The old five-tab row is structurally gone, not merely restyled — EST-03
has no peer-tab navigation at all, just two labeled sections and one primary action.
**Disclosed, not fabricated:** live browser/device verification at 375×812 was not performed this
pass (it would require signing in against the real DEV Firebase project, which this frontend-only,
no-deployment package does not touch) — mobile-safety here rests on component/class-level
continuity with already-verified primitives, not a fresh screenshot.

## 21. Desktop-responsive result

No new responsive breakpoint logic was introduced or needed — every new screen is the same
single-column form shape at every width (matching the approved desktop Stitch companions, which
show the identical field set, just more breathing room) — consistent with "mobile + governed
product architecture prevail" where Stitch's mobile/desktop don't structurally differ (they don't,
for EST-01/02/03).

## 22. EN/FR result

All new strings use existing `business.details.*`/`branch.*`/`classification.*`/`review.*`/
`actions.*` keys wherever they already existed (most did); four new keys added symmetrically to
both `en.ts` and `fr.ts`: `actions.edit`, `actions.finishSetup`, `review.businessSectionTitle`,
`review.locationSectionTitle`, `dashboardPlaceholder.title`. `LanguageSwitcher` added to
`EstablishmentReviewPage` and `DashboardPlaceholder` (a gap caught during validation — neither had
one initially, unlike EST-01/EST-02 which inherit `NewBusinessPage`'s wrapper-level switcher) —
now present on every new/restructured screen, including both of `EstablishmentReviewPage`'s edit
sub-views. Proven: `NewBusinessPage.test.tsx`'s EN↔FR test (unchanged assertions, still passing),
plus new switcher-presence tests on `EstablishmentReviewPage`/`DashboardPlaceholder`.

## 23. Stitch-invention reconciliation

No `D`-classified element from `ENG-P3-002-UI-RECON-001` Part IX was implemented: no "Active"
badge, no "merchant account"/"appointments" copy, no multi-branch UI, no Business Type as a
permanently-expanded list (compact `<select>`, exactly as governed), no photography, no invented
Business/location IDs.

## 24. Business Code policy result

Not surfaced anywhere in this package's screens at all (EST-01/02/03 never display it) — the
FD-3 §24-violating "share for integration" copy from the v3 Dashboard-desktop concept was never a
risk here, since Business Code display belongs to Package B/C, not this one.

## 25. RED→GREEN evidence

Every new file was written test-first: `establishmentCompleteness.test.ts` (RED: unresolved
import) → GREEN; `EstablishmentIdentityStep.test.tsx` (RED: unresolved import) → GREEN;
`EstablishmentLocationStep.test.tsx` (RED: unresolved import) → GREEN (one test-isolation fix
needed — `mockMutate` leaking across tests, fixed with `beforeEach(mockMutate.mockClear())`, not a
component bug); `NewBusinessPage.test.tsx` (RED: old single-screen mocks didn't cover
`useBusinessTypesQuery`) → rewritten for the two-step flow → GREEN;
`EstablishmentReviewPage.test.tsx` (RED: unresolved import, then RED again for missing i18n keys)
→ GREEN; `DashboardPlaceholder.test.tsx` (RED: unresolved import) → GREEN;
`BusinessDashboardBoundaryPage.test.tsx` (RED: unresolved import) → GREEN;
`BusinessWizardPage.test.tsx` (updated mock target) → GREEN. Language-switcher gap caught by
adding a failing assertion first (RED) on both `EstablishmentReviewPage` and
`DashboardPlaceholder`, then fixed → GREEN.

## 26. Tests added/changed

New: `establishmentCompleteness.test.ts` (3), `EstablishmentIdentityStep.test.tsx` (4),
`EstablishmentLocationStep.test.tsx` (4), `EstablishmentReviewPage.test.tsx` (5),
`DashboardPlaceholder.test.tsx` (3), `BusinessDashboardBoundaryPage.test.tsx` (2). Rewritten:
`NewBusinessPage.test.tsx` (6, was 4). Updated: `BusinessWizardPage.test.tsx` (mock target only,
4 tests unchanged in substance). Deleted: `OnboardingWizard.test.tsx` (4 tests, component
retired).

## 27. Full validation

Web: **527/527 passed** (84 files, +22 net tests from entry's 505/78). Functions: **1563/1563
passed** (143 files), byte-identical to entry — confirmed zero `functions/` diff. Typecheck: clean
(both packages). Lint: 0 errors, 1 pre-existing unrelated warning. Format: clean. Ordinary build:
clean, PWA artifacts present. `founder-qa-preview` build: clean, Founder-QA markers/site-key
present as expected (build-mode gated, unchanged mechanism), secret scan clean (0 matches).
Playwright (`test:e2e`): 1/1 passed. Firebase Emulator Suite (`emulators:validate`): first run —
**1 failed** (`authorizeAndExecute.emulator.test.ts`'s `19b` concurrent-idempotency-key test,
5000ms timeout, a domain this diff never touches); immediate rerun with zero code change —
**683/683 passed, 2 skipped, 0 failed**, clean — confirmed environmental, the same class of
concurrent-worker timing flake disclosed repeatedly elsewhere in this repository's history
(also independently observed twice more during this session's own governance-chain-sync PR CI,
each time a different, unrelated domain), not a regression from this diff.

## 28. Files modified

**Modified:** `apps/web/src/App.tsx`, `apps/web/src/business/onboarding/BusinessWizardPage.tsx`
(+test), `apps/web/src/business/onboarding/NewBusinessPage.tsx` (+test, rewritten),
`apps/web/src/business/onboarding/steps/BranchStep.tsx` (comment only), `apps/web/src/i18n/locales/en.ts`,
`apps/web/src/i18n/locales/fr.ts`. **Deleted:**
`apps/web/src/business/onboarding/OnboardingWizard.tsx` (+test). **New:**
`apps/web/src/business/onboarding/establishment/` (6 files: 3 components + `establishmentCompleteness.ts`
+ 4 test files — see §9/§26), `apps/web/src/business/dashboard/` (4 files: 2 components + 2 test
files). Plus this report and the `IMPLEMENTATION_CHANGES.md` entry.

## 29. Code diff summary

Confined entirely to `apps/web/src/business/` (+ `apps/web/src/App.tsx`, `apps/web/src/i18n/locales/{en,fr}.ts`
for the new routes/keys) and their tests — confirmed via `git diff --stat -- functions/
firestore.rules storage.rules firebase.json .firebaserc` returning empty.

## 30. Commands executed

`git fetch origin`, entry-gate `git` inspection commands, `git worktree add`,
`pnpm install --frozen-lockfile`, per-file `vitest run` (RED/GREEN cycles throughout),
`pnpm --filter web run test`, `pnpm --filter functions run test`, `pnpm run typecheck`,
`pnpm run lint`, `npx prettier --check`/`--write`, `pnpm --filter web run build`,
`pnpm --filter web run build:founder-qa-preview`, `grep` secret scans,
`npx playwright install chromium --with-deps`, `pnpm run test:e2e`, `pnpm run emulators:validate`
(×2), `git add`/`commit`/`push`, `gh pr create --draft`.

## 31. Dependencies added

None.

## 32. Config changes

None. `.env.founder-qa-preview.local`/`.env.local` were created transiently in the worktree only
(gitignored, confirmed via `git check-ignore -v`, never staged) to run the preview build/attempt a
mobile check, and deleted before commit.

## 33. Firebase/Rules/deployment changes

None. No Firebase CLI/MCP command was issued. No deployment performed.

## 34. Backend changes — confirmed none

Zero `functions/` diff (§29). No Staff DTO, Terms persistence, permissions, Commerce Knowledge
backend, or lifecycle-transition file touched.

## 35. Findings

**Backend contract gap, discovered during Phase B analysis, not fixed (per explicit instruction to
STOP and report rather than absorb it):** `getBusinessContext`'s backend service
(`functions/src/domains/business/services/businessReadService.ts`) does not project
`currencyCode`/`timezone` into the `BusinessContext` DTO at all, even though `createBusiness`
requires and persists both (`Business.currencyCode`/`Business.timezone` are real, governed
fields — `updateBusinessProfile` can even write them). This is not a frontend staleness issue —
traced directly to the backend service's own return statement, which simply omits both fields. As
a direct consequence, **EST-03 cannot display an "Operating details" section from backend truth**
(unlike the approved v3 design, which shows one) — this task deliberately omits that section
rather than fabricate the values or trust stale client-only state, consistent with "do not rely on
a client-only copy as authority." This is a real, scoped gap for a future, separately-authorized
correction (candidate identifier: `ENG-P3-002-CORR-BUSINESSCONTEXT-OPERATINGDETAILS-001`) — not
absorbed into Package A, not a Team-identity-class gap, and not touching any of the explicitly
prohibited domains (Staff DTOs, Terms, permissions, Rules).

**Language-switcher gap on the two net-new screens, caught during this task's own validation and
fixed within scope** (§22) — not a finding requiring separate authorization, since it's the same
established, already-governed `LanguageSwitcher` component, added the same way it already exists
on three other screens.

## 36. Remaining material findings

Only §35's `getBusinessContext` Operating-Details gap. No other material finding.

## 37. Risks

None introduced to existing functionality (functions/backend untouched, 1563/1563 unchanged; web
suite net-additive, no regression in any pre-existing test). The one real risk is exactly §35's
disclosed gap — a future Stitch-faithful implementation of EST-03's Operating Details section
requires that backend correction first; this task does not implement around it.

## 38. Rollback instructions

`git revert` the merge commit once merged — entirely additive/corrective frontend work, no
schema/data impact, no deployed artifact to roll back (no deployment performed).

## 39. Persistent report path

`docs/05-implementation/reports/ENG-P3-002-UI-IMP-A-business-establishment-experience-implementation-report-2026-08-25.md`

## 40. Changes-tracking state

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a corresponding entry (below), plus the
separate governance-chain-sync entry already recorded for PR #172.

## 41. PR number

See final chat response (created after this report, draft, not self-merged).

## 42. Final head SHA

See final chat response.

## 43. CI result

See final chat response.

## 44. `ENG-P3-002` status after this package

**Unchanged: Open — blocked on Founder QA completion and `DEC-LEGAL-002`.** Not advanced,
not closed by this task — this is one UI implementation package, pending Founder review.

## 45. Capability 3 status

**Unchanged: Open — not closed.**

## 46. Exact next Founder action

Review PR (draft) for `ENG-P3-002-UI-IMP-A`. If approved and merged, the next package per
`ENG-P3-002-UI-RECON-001`'s decomposition is **Package B — Business Dashboard Shell + DASH-01**
(the shell this task's `DashboardPlaceholder` boundary anticipates but does not build). Separately,
disposition §35's `getBusinessContext` Operating-Details gap — a small, independently-scoped
backend correction, not required before Package B but eventually needed for EST-03 to show
currency/timezone.

## Final gate

**ENG-P3-002-UI PACKAGE A READY FOR FOUNDER REVIEW — BUSINESS ESTABLISHMENT EXPERIENCE
IMPLEMENTED; DASHBOARD PACKAGE NOT STARTED**
