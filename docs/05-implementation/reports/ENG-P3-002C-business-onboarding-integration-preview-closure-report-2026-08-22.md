> **Title:** ENG-P3-002C — Business Onboarding Integration, Hosted Preview & Founder QA Closure — Report
> **Entry state:** `origin/main` at `289b190a4bf9456793611b7620fbb53cc0348872`. Verified: `849a942` (ENG-P3-002B) and `289b190` (its closure sync) both ancestors; post-merge CI `success` on both. No `ENG-P3-002C`/`ENG-P3-003` branch or open PR existed at entry (`gh pr list --state open` showed only #34, docs-only, unrelated).
> **Worktree/branch:** fresh linked worktree at `.../scratchpad/eng-p3-002c`, branch `feat/eng-p3-002c-onboarding-integration-preview`, from `origin/main`. Primary worktree `/Users/theo/11THONUS` untouched throughout (verified identical commit/untracked-file state before and after).

---

## RECONCILIATION ADDENDUM (2026-08-23) — `ENG-P2-004-CORR-003` reconciliation of PR #156

**Arc:** this report's original body (below, unchanged except for inline `[RECONCILED]` markers at the specific superseded claims) recorded a genuine finding on 2026-08-22: `staff.manage` was gated to the single global `OPERATIONAL_BUSINESS_STATUSES = {trial, active}` set, making Owner Staff invitation during `draft`/`pending_verification` onboarding architecturally impossible. That finding was correct at the time and is preserved below as historical evidence — it is what motivated the Founder-approved `ENG-P2-004-CORR-003` correction, which merged to `main` via PR #157 (merge `5285e053e50e1112b5d04443a991ed5951ff2d8b`) and its closure-sync PR #158 (merge `f38dc041bc32f7a7e2dfe0fe0c16bf01b1c122e4`) — **after** this report and PR #156 were opened, and independently of them.

**What CORR-003 actually established** (verified directly from `functions/src/domains/permissions/models/sensitivePermissionCatalogue.ts` and `functions/src/domains/permissions/evaluator/evaluatePermission.ts` during this reconciliation, not assumed): the Sensitive-permission catalogue now supports an optional per-entry `eligibleBusinessStatuses` override. Only `staff.manage`'s entry carries one — `["draft", "pending_verification", "trial", "active"]`. Every other Sensitive permission (`staff.assignPermissions`, `staff.assignRole`, `business.transferOwnership`, and the rest) has no override and still falls back to the legacy `{trial, active}` set, byte-for-byte unchanged.

**This reconciliation (PR #156, this branch):**
1. Rebased PR #156 cleanly onto current `origin/main` (`f38dc041b...`) — zero conflicts.
2. Re-ran `businessOnboardingJourney.emulator.test.ts` unmodified first: it failed for the **correct** reason (RED) — the `staff.manage` invite call, now authorized, reached real mutation logic for the first time and hit a real test-code gap (`params.now` was never supplied, because the old test never expected `prepare()` to run at all).
3. Fixed the test — supplied `now`, changed the expected outcome from `denied` to `created`, added persistence/list assertions, and added a second invitation while `pending_verification` (Phase F proof point) — then re-ran to GREEN.
4. Full validation re-run on the rebased branch (§ "Reconciliation full validation" below).

**Corrected classification:** `ENG-P3-002` is **NOT** "Complete with explicit deferrals." See the corrected §32-35 below. The Staff-invitation-during-draft gap recorded in §6/§12/§25/§27/§31/§46 below is **resolved**, not merely disclosed. The Terms/`DEC-LEGAL-002` blocker, the missing production sign-in route, and the never-deployed backend are **unaffected by CORR-003** and remain exactly as this report originally found them — re-verified, not re-argued, during this reconciliation.

**Accepted CORR-003 consequence, recorded here per the reconciliation task's Phase G (no further Founder decision needed for MVP on this specific point):** during `draft`/`pending_verification`, the Owner can exercise `staff.manage` (invite/list/revoke Staff). A Manager cannot be newly granted `staff.manage` through the normal product flow during those statuses, because `staff.assignPermissions` (the permission that would grant it) carries no eligibility override and still requires `trial`/`active`. This reconciliation does not widen `staff.assignPermissions` and does not add any alternate Manager-delegation mechanism — both are explicitly out of this reconciliation's scope.

### Reconciliation full validation (2026-08-23, on the rebased branch)

- `pnpm emulators:validate` (Firebase Emulator Suite, all functions emulator tests): **52 files, 683 passed, 2 pre-existing skips** — clean, no regressions.
- `pnpm --filter functions test` (unit): **143 files, 1563 passed.**
- `pnpm --filter web test` (unit): **75 files, 482 passed.**
- `pnpm -r typecheck`: clean, both packages.
- `pnpm lint` (root `eslint .`): 0 errors, 1 pre-existing warning (`BusinessApiContext.tsx`, unrelated to this task).
- `prettier --check .`: clean (one file — the reconciled test — needed `prettier --write`, applied).
- `pnpm -r build`: succeeds, both packages.
- `pnpm test:e2e` (Playwright, `tests/e2e/app-shell.spec.ts`): **1 passed.**
- No secret-scan script exists in this repository (checked `package.json` at every level) — not skipped, genuinely absent.

### Corrected acceptance-matrix row (supersedes §27 row 9 below)

| # | Requirement | Status |
|---|---|---|
| 9 | Staff invitation creation during onboarding (Owner, `draft`/`pending_verification`) | **PASS** — `ENG-P2-004-CORR-003` resolved the lifecycle gate; proven directly against a live emulator in both statuses, through the unmodified `createStaffInvitation` command (§ addendum above). |

### Corrected closure classification (supersedes §32-35 below)

- **`ENG-P3-002C`** (this integration-validation package): **Integration validation ready / not closed.** The Staff-invitation gap is resolved and proven; the remaining items (Terms real content, production sign-in route, hosted preview, Founder QA) are unchanged from the original report and still block closure.
- **`ENG-P3-002`** (the parent onboarding capability): **Open** — NOT Complete, with or without deferrals. Backend engineering: complete. Frontend engineering: complete. Integration engineering: substantially complete/validated (this reconciliation). Real customer onboarding journey: **blocked** — no governed, readable Terms content exists, so a real customer cannot complete Terms acceptance or reach `pending_verification` through the actual product. Legal launch readiness: **blocked on `DEC-LEGAL-002`.** Terms is a legal-content blocker, never "deferred by design" — the design correctly refuses to fabricate consent for unread content, but that refusal is itself evidence the capability isn't done, not a closed deferral.
- **Capability 3**: remains **Open — partially implemented; not closed.** This reconciliation does not close it.
- **Preview status**: **NOT CREATED.** Unaffected by this reconciliation — no deployment was performed, per this task's hard scope limits.
- **Founder QA status**: **PENDING / NOT EXECUTED.** Unaffected by this reconciliation. The companion checklist (`ENG-P3-002C-founder-qa-checklist-2026-08-22.md`) has been updated to expect "Owner can invite Staff during draft onboarding" as a passing step rather than a known-denied one — no other step changed.

---

## Original report body (2026-08-22) — preserved; superseded claims marked inline `[RECONCILED 2026-08-23]`

## 1. Sources inspected

`ENG-P3-002-DESIGN-001` v2.0 (already fully read in prior sessions); `ENG-P3-002A`/`ENG-P3-002B` implementation and closure reports; `functions/src/index.ts` (current callable exports, unchanged since 002A); `apps/web/src/business/**` (current routes/API/hooks, unchanged since 002B's correction); `firebase.json`/`.firebaserc` (Hosting/emulator/preview configuration); `playwright.config.ts` and `.github/workflows/ci.yml` (e2e/emulator sequencing); `DEC-LEGAL-002` (Decision Register); `CDR-001`/`engineering-implementation-programme.md` Capability-3 entries; `ENG-P2-004-CORR-001`'s implementation report (directly relevant — see §6); live `firebase functions:list --project eleventh-on-us-dev` and `firebase projects:list`.

## 2. Integration strategy

**Finding (Phase B):** `.github/workflows/ci.yml` runs `pnpm test:e2e` (Playwright, against a built-but-unbacked frontend — `webServer` only runs `vite build && vite preview`, no live Firebase emulators) as a step *before* `pnpm emulators:validate` (the Firebase Emulator Suite step). No live backend is ever available during Playwright e2e today, and no test anywhere in the repository invokes an `onCall` handler through a real HTTPS/client boundary against a live emulator — this is a pre-existing gap across the *entire* callable surface, not specific to onboarding. Standing up that wiring is real new CI infrastructure, out of this task's authorized scope ("maintain current architecture").

**Decision:** the realistic "real backend surfaces… as far as the current test stack permits" (Phase C's own qualifier) is a domain-service-level chained integration test against a live Firestore emulator — the same discipline every existing `*.emulator.test.ts` file in this repository already uses, and exactly the functions `functions/src/index.ts`'s `onCall` handlers call. Built as `functions/src/domains/business/services/businessOnboardingJourney.emulator.test.ts`.

## 3. End-to-end journey result

**PASS**, against a live Firebase emulator (`firebase emulators:exec`). One continuous test, one Business, proves: zero-Business resolve → `createBusiness` (draft + Branch atomically) → one-Business resolve → hydration (Branch never null) → profile update → real seeded-Commerce-Knowledge Category list contains the seeded category → Type list is parent-scoped (exactly one Type) → Branch update → **Staff invitation is `denied`, proven and explained (see §6 — a genuine finding, not a test bug)** → submission before Terms acceptance throws a Terms-precondition validation error (not a bare `denied` outcome — a real, previously-unexercised distinction) → Terms accepted via the real `acceptBusinessTermsCommand` (`TEST_ONLY_FIXTURE_journey_v0`) → hydration reflects acceptance → submission now succeeds → final hydration confirms `pending_verification` and the edited display name. Items 1-9, 11-13, 17-19 of Phase C's list are directly proven; item 10 (empty-Business-Type-list validity) is proven separately by existing coverage (`ClassificationStep`'s conditional rendering, already unit-tested in 002B); item 14-15 (Staff invitation creation/listing) surfaced the §6 finding instead of the originally-expected happy path.

## 4. Terms legal-content finding (Phase D) — priority

Distinguishing the four levels explicitly, as instructed:
- **(A) Engineering implementation completeness:** YES — the full mechanism (schema, server-authoritative versioning, write-once idempotent acceptance, submission precondition, frontend state plumbing) is built, tested, and proven end-to-end (§5 below).
- **(B) Preview/demo completeness:** achievable only with a `TEST_ONLY_FIXTURE_*` version configured in a non-production environment — never customer-facing, never a real "preview" a Founder could click through to a real submission (§7).
- **(C) Real onboarding completion:** **NOT achievable today.** No governed, user-readable Terms document/link exists anywhere in the repository (confirmed again this pass — no new source found). A real customer cannot complete onboarding through submission, because the Terms step correctly refuses to ever offer consent for unread content (`TERMS_READABLE_CONTENT_AVAILABLE = false`, `ENG-P3-002B`'s own correction).
- **(D) Production/legal launch readiness:** **Blocked on `DEC-LEGAL-002`**, still `OPEN_LEGAL` in the Decision Register — unchanged by this task, not something engineering can resolve.

**Answer to the three named questions:** Yes, the wizard is technically complete while Terms acceptance is intentionally unavailable — that unavailability is the *correct*, designed, tested behavior, not a bug. Yes, `ENG-P3-002` can be classified **"Complete with explicit legal-content deferral"** — engineering did not stop short of what's buildable; it correctly refuses to fabricate what isn't governed. This does **not** require a fresh Founder/legal disposition to avoid falsely closing the *engineering* concern, because the deferral was already made explicitly, by the Founder-approved design (`ENG-P3-002-DESIGN-001` §37), not invented here. What **does** require a Founder/legal disposition — separately, already tracked as `DEC-LEGAL-002`, not newly discovered by this task — is when real Terms content will exist, which is what would let a real customer ever reach `pending_verification` through the actual product.

## 5. Terms backend integration result (Phase E/F)

**PASS — pre-existing, comprehensive, verified directly, not re-duplicated.** `acceptBusinessTermsCommand.emulator.test.ts` (24 test cases, `ENG-P3-002A`) already proves all 8 Phase F items: required-version-configured/fails-closed (#23/#29/#29c), acceptance written/current version accepted (#23), submission succeeds only with acceptance (#31), old/stale version fails (#26), a version bump requires reacceptance (#34), no cross-Business/cross-identity acceptance satisfies the requirement (#27/#28b). `businessOnboardingJourney.emulator.test.ts` (new, this task) additionally proves item 5 (the full `draft → pending_verification` transition gated correctly by this exact mechanism) in the same continuous journey as every other onboarding step, closing the one real gap (no prior test chained Terms-acceptance together with resolve/hydrate/classify/branch/submit in one Business's lifecycle).

## 6. Terms frontend result / priority integration defect found (Phase G, Phase Y)

**PASS**, unchanged from `ENG-P3-002B`'s own correction (`TermsStep.test.tsx`, 6 tests): no checkbox, no accept button, Continue disabled, neutral unavailable copy, whenever `TERMS_READABLE_CONTENT_AVAILABLE` is false — never discovered by attempting acceptance. No `TEST_ONLY` content was ever injected into any customer-facing component.

**Genuine integration defect found and reported (not silently patched) — `[RECONCILED 2026-08-23: resolved by `ENG-P2-004-CORR-003`, see the addendum at the top of this report. Preserved below as the original, accurate-at-the-time finding.]`:** the real onboarding journey test (§3) proved that `staff.manage` (Sensitive permission, `createStaffInvitation`'s gate) is denied for **any** Business in `draft` status — `evaluatePermission.ts`'s `OPERATIONAL_BUSINESS_STATUSES = {"active", "trial"}` applies uniformly to all 8 Sensitive permissions, and a Business never reaches `trial`/`active` during onboarding (only `draft → pending_verification`). This is not new architecture and not a regression from `ENG-P3-002A`/`B` — `ENG-P2-004-CORR-001`'s own implementation report (2026-08-19, two days *before* `ENG-P3-002-DESIGN-001` v2.0 was authored) explicitly records `staff.manage + draft → still BUSINESS_INACTIVE` as a deliberate, tested non-regression case. `ENG-P3-002-DESIGN-001` §11-§12 designed "owner invites staff during onboarding, while still draft" without reconciling this already-known, already-tested gate. **Consequence: the "optional Staff invitation" feature inside the onboarding wizard cannot function for any real user today** — every invite attempt during onboarding is denied. Team remains legitimately skippable (onboarding completion never depends on it), so this does not block `ENG-P3-002`'s core completion boundary, but it is a real, customer-visible defect in the shipped feature. **Not fixed here** — widening the Sensitive-permission lifecycle gate is a security-relevant change affecting all 8 Sensitive permissions platform-wide, a Founder/architecture disposition, not a coding-agent unilateral correction (the same reasoning `ENG-P3-002B`'s own Terms-content finding used).

**Second defect found and fixed:** every mutation step *except* Terms silently swallowed failures — `createMutation.error`/`mutation.error` was read nowhere in `ClassificationStep`/`BranchStep`/`TeamStep`/`NewBusinessPage`/`ReviewStep`. A real user hitting the Staff-invite denial above (or any validation/network failure anywhere else in the wizard) saw the button simply stop spinning, with zero explanation. Fixed with a new shared `MutationError` component (`business/onboarding/MutationError.tsx`, 4 tests, TDD) mapping `BusinessApiError.code` onto the existing `business.errors.*` i18n catalog — never a raw server message — wired into all five previously-silent mutation sites, each verified against the existing/updated test suite (`TeamStep.test.tsx` — new, 3 tests, TDD, proves the denied-invite error now surfaces and Skip still works regardless).

## 7. Authentication-entry result (Phase H)

Re-verified against current `origin/main`/`apps/web`: **no production sign-in route exists anywhere in `App.tsx`** — `SignInPanel`/`createSignInActions` (the real, tested multi-provider sign-in composition) is still mounted only in the dev-only `/dev/sign-in-preview` harness route, never at a route a real signed-out visitor reaches. This is unchanged since `ENG-P3-002B`'s own disclosure and is **not** something this task builds (per the task's own instruction: only fix it if "the missing wiring is a small integration defect and existing sign-in implementation already exists" — it does exist, but wiring a production auth entry route is a genuine new product surface/routing decision (where does it live — `/sign-in`? `/`? does `/` change?), not a small defect fix, and touches `App.tsx`'s top-level shell beyond onboarding). **Reported as a real integration blocker for hosted-preview usability, not fixed.** Impact: the onboarding journey is fully reachable and correct *once authenticated*, but nothing in the shipped product currently gets a real visitor from signed-out to signed-in through a real route.

## 8. Routing/deep-link result (Phase I)

Re-verified: `/business`, `/business/new`, `/business/:businessId` all resolve purely from server reads (`getOwnedBusinesses`/`getBusinessContext`) on every render, including direct navigation/refresh (`useOwnedBusinessesQuery`/`useBusinessContextQuery` re-fetch on mount, no cached client authority). No `localStorage`/`onboardingStep` reference anywhere (re-grepped, zero matches). Draft resumes into the wizard at the first incomplete stage; `pending_verification` resumes into `SubmittedStatusPage`; any other status renders the localized bounded fallback (`BusinessWizardPage.test.tsx`, 5 tests, unchanged + already covers this). Browser back/forward is native `react-router` behavior, not custom-handled — no defect found.

## 9. Multi-Business result (Phase J)

Re-verified (`BusinessResolverPage.test.tsx`, 4 tests, unchanged): 0 → `/business/new`; 1 → auto-redirect; 2+ → a bounded list, rendered only from the authenticated caller's own `getOwnedBusinesses` result (server-derived from `ownerUserId`/membership — never a client-supplied filter), so no other identity's Business can appear. No defect found.

## 10. Category/Type result (Phase K)

Proven directly against real emulator-seeded fixtures in §3's journey test: only the seeded `active` category appears in `listBusinessCategories`; Type list is parent-scoped (`parentId` matches); an empty Type list is a valid, already-tested UI state (`ClassificationStep` conditional). EN/FR fallback logic lives server-side only (`commerceKnowledgeReadService.ts`, unchanged since `ENG-P3-002A`) — not re-tested here since it was already comprehensively proven in that package and nothing in this task touches it. Category-change-clears-Type: unchanged, already unit-tested in `ClassificationStep`. No hardcoded taxonomy values found (re-grepped `apps/web/src/business`).

## 11. Branch result (Phase L)

Re-verified: `context.branch === null` renders the generic integrity-error state (`OnboardingWizard.test.tsx`, unchanged), never a "create branch" flow. "Multiple Branches" is structurally impossible under the current data model (`getBusinessContext` returns a single `branch` field, not a list — `ENG-P2-002B`'s bootstrap creates exactly one Branch atomically, no code path creates a second) — not independently re-tested as a new scenario since there is no mechanism to reach it.

## 12. Staff result (Phase M)

`[RECONCILED 2026-08-23: the create-invitation denial below was resolved by `ENG-P2-004-CORR-003` — see the addendum at the top of this report. Preserved as the original, accurate-at-the-time finding.]` See §6 — the create-invitation path is denied during onboarding (a real, reported defect, not fixed). List/revoke/skip are otherwise correctly wired (existing 002B tests unchanged) and never expose `membership`/permission-override/`AuthenticationReference`/protected-identity fields in the DTOs or UI copy (re-verified: `StaffInvitationSummary`/`StaffMembershipSummary` carry only `invitationId`/`role`/`status`/`deliveryType`/timestamps or `membershipId`/`role`/`status` — no raw identity field).

## 13. Idempotency result (Phase N)

Unchanged from `ENG-P3-002B`'s own review (`idempotencyKeyHolder.test.ts`, 3 tests): key generated lazily, reused until `clear()`, cleared only on success or a definitive (non-retryable) failure. Re-confirmed by direct re-read of `businessMutations.ts` — no regression introduced by this task's `MutationError` wiring (purely additive rendering, no change to any `mutate`/`onSuccess`/`onError` logic).

## 14. Error-state result (Phase O)

Improved by §6's second fix — every mutation now reaches a safe, localized frontend state instead of silence. No raw Firebase/internal message is ever rendered (`MutationError` only renders for a recognized `BusinessApiError`, returns `null` otherwise — verified by test).

## 15. Responsive / 16. Accessibility results (Phase P/Q)

**Not independently re-verified with a live browser pass in this task** (time-boxed; no hosted preview exists to test against — see §17). Static review: all form primitives use native semantic elements with associated `<label>`/`aria-describedby`/`aria-invalid` (verified in `formPrimitives.test.tsx`, unchanged), Tailwind layout is single-column/`max-w-lg`/`flex flex-col gap-*` throughout every step (no fixed-width or multi-column layout that would overflow on mobile). This is a disclosed gap, not a claimed pass.

## 17. EN / 18. FR results (Phase R)

Re-verified structurally: the existing EN/FR parity check (`i18n.test.tsx`) still passes; the 2 new/changed customer-facing keys used by `MutationError` (`errors.*`) already existed in both locales from `ENG-P3-002B`. No new hardcoded string introduced by this task (re-grepped). **Not manually walked through in a live browser** — same disclosed gap as §15/16.

## 19. Preview strategy (Phase S)

**Mechanism exists** (Firebase Hosting preview channels — `firebase.json`'s `hosting` config, `.firebaserc`'s `dev`/`staging` projects, precedent from the prior `auth-preview-002` channel). **Not exercised in this task.** Direct check (`firebase functions:list --project eleventh-on-us-dev`) shows **only `authenticate` is deployed** to the dev project — none of `createBusiness`/`getOwnedBusinesses`/`getBusinessContext`/`listBusinessCategories`/`listBusinessTypesForCategory`/`createStaffInvitation`/`revokeStaffInvitation`/`listStaffInvitations`/`listStaffMemberships`/`acceptBusinessTerms`/`submitBusinessForVerification` has ever been deployed anywhere. A Hosting-only preview would present a visibly broken app (every onboarding action failing with "function not found") the moment a visitor reached `/business`. Deploying the entire onboarding backend to a live GCP project for the first time is a materially larger, distinct, higher-consequence action than "use the existing preview mechanism" — genuinely new infrastructure exposure this task was not authorized to invent. **STOP and report, per Phase S's own instruction**, rather than deploy a broken or (worse) a first-ever backend deployment unreviewed.

## 20-22. Preview URL/identifier/SHA

None created — see §19.

## 23. Founder QA checklist (Phase U)

See `docs/05-implementation/reports/ENG-P3-002C-founder-qa-checklist-2026-08-22.md` (companion file, this task). Cannot be executed against a hosted preview today (§19); usable once §7/§19 are resolved, or against a local dev-server + emulator run in the interim.

## 24. Founder QA status

**Not performed. Cannot be marked passed by this task** (explicit instruction). Pending Founder review, and pending either a production sign-in route (§7) or a genuine backend-deployed preview (§19).

## 25. Defects found / 26. Defects fixed

`[RECONCILED 2026-08-23: item (1) is now fixed — see the addendum at the top of this report.]` Found: (1) `staff.manage` denied for any `draft` Business — real, reported, **not fixed** (architecture/Founder disposition, §6) — **now resolved by `ENG-P2-004-CORR-003`, proven in this reconciliation.** (2) Every mutation except Terms silently swallowed errors — **fixed** (§6, `MutationError`, TDD). (3) No production sign-in route exists — real, reported, **not fixed** (§7, out of this task's scope as a "small integration defect") — re-verified still accurate as of this reconciliation. (4) No backend ever deployed to any live environment — real, reported, **not fixed** (§19, infrastructure decision beyond this task's authorization) — unaffected by this reconciliation.

## 27. Acceptance matrix (Phase V)

`[RECONCILED 2026-08-23: row 9 below is superseded — see the corrected acceptance-matrix table in the addendum at the top of this report.]`

| # | Requirement | Status |
|---|---|---|
| 1 | Business resolution (0/1/N) | PASS |
| 2 | Business creation | PASS |
| 3 | Business hydration | PASS |
| 4 | Business profile edit | PASS |
| 5 | Commerce Knowledge Category list | PASS |
| 6 | Commerce Knowledge Type list (scoped, optional) | PASS |
| 7 | Default Branch hydration/edit | PASS |
| 8 | Branch integrity failure handling | PASS |
| 9 | Staff invitation creation during onboarding | **FAIL** — denied for every `draft` Business (§6) |
| 10 | Staff invitation list/revoke/skip | PASS (skip); list/revoke correct where an invitation could exist |
| 11 | Terms state plumbing (backend) | PASS |
| 12 | Terms state plumbing (frontend, no consent w/o content) | PASS |
| 13 | Real Terms content for customer consent | **BLOCKED-BY-LEGAL** — `DEC-LEGAL-002` open |
| 14 | Review screen reflects backend state | PASS |
| 15 | Submission precondition/boundary | PASS |
| 16 | `pending_verification` end state | PASS |
| 17 | Resume/refresh, no client-authoritative progress | PASS |
| 18 | Lifecycle routing (draft/pending_verification/other) | PASS |
| 19 | Idempotency (create/terms/invite/revoke/submit) | PASS |
| 20 | Error-state safety (no raw errors) | PASS (after §6 fix) |
| 21 | Production sign-in entry | **FAIL** — no route exists (§7) |
| 22 | EN/FR structural parity | PASS |
| 23 | EN/FR manual walkthrough | FOUNDER-QA-PENDING |
| 24 | Responsive/accessibility live verification | FOUNDER-QA-PENDING |
| 25 | Hosted preview | **BLOCKED** — backend never deployed (§19) |
| 26 | Direct-Firestore prohibition | PASS |
| 27 | Scope boundary (no subscription/reward/studio/002C-in-002B) | PASS |

## 28. RED→GREEN evidence

`MutationError.test.tsx`: RED — "Failed to resolve import" (module absent) → GREEN after implementation, 4/4. `TeamStep.test.tsx`: RED — `getByRole("alert")` threw (no error element rendered) → GREEN after wiring `MutationError` into `TeamStep`, 3/3. `businessOnboardingJourney.emulator.test.ts`: iteratively driven to green against a live emulator (business-code format, missing `now`/`idempotencyKey` params, the Staff-invite/submit-precondition assertions corrected to match real proven behavior rather than an assumed happy path) — final run: 1/1 passing.

## 29. Tests added/changed

New: `functions/src/domains/business/services/businessOnboardingJourney.emulator.test.ts` (1 test, chained journey). `apps/web/src/business/onboarding/MutationError.tsx` + `.test.tsx` (4 tests). `apps/web/src/business/onboarding/steps/TeamStep.test.tsx` (3 tests, new — none existed before). Changed (wiring only, no logic change): `ClassificationStep.tsx`, `BranchStep.tsx`, `ReviewStep.tsx`, `NewBusinessPage.tsx`, `TeamStep.tsx`. Config: `eslint.config.js` (added the new emulator test file to the pre-existing, precedent-established Firebase-import allow-list for this domain).

## 30. Full validation

`apps/web`: typecheck clean, **482/482** unit tests (475 prior + 7 new), `eslint .` 0 errors (1 pre-existing warning, unchanged), `prettier --check` clean, `tsc -b && vite build` succeeds. `functions`: typecheck clean, `eslint .` 0 errors, **1442/1442** unit tests, the new emulator test **1/1** passing against a live Firebase Emulator Suite (`firebase emulators:exec`). Full `pnpm emulators:validate` (all functions emulator tests) and Playwright e2e were **not re-run locally in this pass** — relying on CI (which runs both, on the exact PR head) for that confirmation, matching the same approach used for `ENG-P3-002B`. Secret scan: manual `git diff` review shows no credential-shaped strings introduced.

## 31. Remaining blockers

`[RECONCILED 2026-08-23: item (2) below is resolved — see the addendum at the top of this report. (1), (3), (4) are unaffected and remain accurate.]`

(1) `DEC-LEGAL-002` (Terms content) — real onboarding completion (level C) blocked, engineering (level A) is not. (2) ~~Staff invitation during onboarding is denied by an existing, deliberate, but unreconciled permission gate — Founder/architecture disposition needed on whether to widen `OPERATIONAL_BUSINESS_STATUSES` for `staff.manage`, scope Team invitation to post-submission instead, or accept it as a known limitation.~~ **Resolved by `ENG-P2-004-CORR-003`** (Founder-approved correction, merged to `main` after this report was written): the Sensitive-permission catalogue now carries a per-entry `eligibleBusinessStatuses` override, populated for `staff.manage` only, permitting Owner Staff invitation during `draft`/`pending_verification`. (3) No production sign-in route exists — a real routing/product decision needed before any real visitor reaches onboarding. (4) No onboarding backend has ever been deployed to any live environment — a deployment decision, not an engineering defect.

## 32. Closure classification (Phase W)

`[RECONCILED 2026-08-23 — see the corrected classification in the addendum at the top of this report. Preserved below as the original, now-superseded classification.]`

**B — COMPLETE WITH EXPLICIT DEFERRALS**, for the *engineering implementation* scope this task can assess (level A in §4's framework) — with two newly-identified, explicitly-reported, non-blocking-to-core-completion defects (§6, #1 and #3/#4 above) that a Founder should weigh before treating the feature as ready for real users, even though they do not prevent `Business.status` from reaching `pending_verification` through the code paths that do work. Founder QA (levels B/C/D) remains genuinely pending — not performed, not claimed passed, consistent with programme precedent (no prior `ENG-P*` package in this programme has self-certified manual QA).

## 33-35. Status

`[RECONCILED 2026-08-23 — superseded. `ENG-P3-002` is Open, not Complete. See the corrected classification in the addendum at the top of this report.]`

`ENG-P3-002` overall: ~~**Complete with explicit deferrals** (Terms content, the staff-invite-during-draft gap, and no production auth entry — all disclosed, none silently hidden).~~ **Open — blocked on `DEC-LEGAL-002` for real customer completion, plus preview/Founder QA still pending.** `ENG-P3-003`: unaffected, **Not started**. Capability 3: **Open — partially implemented; not closed** — this task does not close it, consistent with every prior `ENG-P3-*` closure in this programme.

## 36. Files modified

New (4): `businessOnboardingJourney.emulator.test.ts`, `MutationError.tsx`, `MutationError.test.tsx`, `TeamStep.test.tsx`, plus this report and the companion QA checklist (6 new files total). Changed (6): `ClassificationStep.tsx`, `BranchStep.tsx`, `ReviewStep.tsx`, `NewBusinessPage.tsx`, `TeamStep.tsx`, `eslint.config.js`.

## 37. Code diff summary

Additive only: one new backend integration test, one new shared frontend component + its test, one new frontend test file, five one-line wiring insertions (`<MutationError error={...} />`), one ESLint allow-list entry. No production logic changed in `functions/src/domains/business` beyond the new test file; no callable/Rules/schema change.

## 38. Commands executed

`git fetch`, `git worktree add`, `pnpm install --frozen-lockfile`, `firebase login:list`/`projects:list`/`functions:list`, `tsc --noEmit` (both packages), `firebase emulators:exec ... vitest run --config vitest.emulator.config.ts` (iterative), `vitest run` (both packages), `eslint .` (both packages), `prettier --check`/`--write`, `vite build`.

## 39. Dependencies/config changes

None to `package.json`. `eslint.config.js`: one file added to an existing allow-list pattern (no new rule, no new exception category).

## 40. Firebase/Rules changes

None. `firestore.rules` untouched (re-confirmed via `git diff origin/main --stat -- functions firestore.rules` — only the new emulator test file under `functions/` changed, no production `functions/src` file).

## 41. Deployment/preview changes

None — see §19.

## 42-45. PR/head/CI/primary worktree

PR to be opened as draft against this branch (see final report to user for number/head/CI once created). Primary worktree confirmed untouched (§ entry state).

## 46. Risks

`[RECONCILED 2026-08-23: the Staff-invite dead-end below is resolved — see the addendum at the top of this report.]` ~~Shipping the current wizard to real users today would let them reach the Team step, attempt an invite, and receive a denial — now at least with a visible error (§6 fix) rather than silence, but still a dead-end feature.~~ Staff invitation during onboarding now succeeds for the Owner (`ENG-P2-004-CORR-003`). The remaining risk: no live preview exists, so this cannot be demonstrated to the Founder without either a local emulator run or a genuine (separately-authorized) backend deployment — unchanged.

## 47. Rollback

Revert this branch; no backend/Rules/config state to unwind; the `eslint.config.js` change is a single additive line, trivially revertible.

## 48. Persistent report path

This file, plus `docs/05-implementation/reports/ENG-P3-002C-founder-qa-checklist-2026-08-22.md`.

## 49. Changes-tracking state

Programme/CDR-001 tracking update deferred to a minimal closure-sync commit after Founder review of this draft PR, matching the `ENG-P3-002A`/`B` precedent (implementation PR, then a separate docs-only closure-sync PR after merge) — not performed in this same PR since this PR is not being merged by this task.

## 50. Exact next Founder action

`[RECONCILED 2026-08-23: item (a) below is resolved — CORR-003 already made that decision and it's implemented and proven. Superseded by the corrected next-action list below.]`

~~Review the draft PR. Decide: (a) whether to widen the Sensitive-permission lifecycle gate for `staff.manage` during onboarding, defer Team invitation to post-submission, or accept the current limitation; (b) when/how a production sign-in route gets built; (c) whether to authorize a first-ever backend deployment (and to which environment) so a real hosted preview and Founder QA become possible; (d) `DEC-LEGAL-002` remains a separate, already-tracked, unaffected decision.~~

**Corrected next Founder action (2026-08-23):** Review the reconciled draft PR #156. Decide: (a) when/how a production sign-in route gets built; (b) whether to authorize a first-ever backend deployment (and to which environment) so a real hosted preview and Founder QA become possible; (c) `DEC-LEGAL-002` (Terms content) remains a separate, already-tracked, unaffected decision — real customer onboarding completion stays blocked until it resolves. No decision is needed on Staff invitation during onboarding — `ENG-P2-004-CORR-003` already resolved it, and this reconciliation proved the resolution end-to-end.
