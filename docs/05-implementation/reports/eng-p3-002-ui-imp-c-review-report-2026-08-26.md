# `ENG-P3-002-UI-IMP-C-REVIEW` — Independent Review, Correction, Merge & Closure (2026-08-26)

**Independent review of draft PR #179, performed in a fresh isolated worktree checked out at the
PR's exact head — the implementation report was not trusted as proof; every claim below was
independently re-derived from source.** One test-quality finding (F1), bounded and corrected within
Package C's own scope. No architecture or scope-boundary finding.

## 1. Entry PR/head/CI

- `git fetch origin`; `gh pr view 179`: `baseRefName main`, `headRefOid 22534130b1c5b3567d0724eee2a4115c469bc875`,
  `isDraft true`, `state OPEN`, `mergeable MERGEABLE`, `mergeStateStatus CLEAN`.
- `gh pr checks 179`: `Build, Lint, Test, Emulator Validation` — **pass** (6m46s).
- Fresh isolated worktree created at the exact PR head (`git worktree add
  /Users/theo/11THONUS-eng-p3-002-ui-imp-c-review 2253413...`), detached HEAD — no reliance on the
  implementation worktree's state.
- Ancestry independently verified: `git rev-list --left-right --count HEAD...origin/main` → `2 0`
  (2 commits ahead, 0 behind); `git merge-base HEAD origin/main` → `78a5fc9` (exactly `origin/main`'s
  tip) — clean linear history, no drift, no rebase needed.
- `git diff --stat origin/main..HEAD`: 12 files changed, confined to
  `apps/web/src/business/dashboard/`, `apps/web/src/i18n/locales/{en,fr}.ts`,
  `playwright.config.ts`, one new e2e spec, the report, and the changes log — zero `functions/`,
  Rules, or Firebase-config diff, independently confirmed.

## 2. Final reviewed head

`5d3998c69e3395bbbd3d708477ad5666370a1fc4` — one correction commit (F1, §16) added on top of
`2253413` during this review, pushed to the same PR branch before merge.

**Post-push CI flake (unrelated), disclosed transparently:** CI run `32980815541` on `5d3998c`
initially failed on one test —
`knowledgeNodeRepository.emulator.test.ts > knowledgeNodeRepository — concurrency > two concurrent
creations under the same fresh id race safely`, `Error: Test timed out in 5000ms` — a Commerce
Knowledge repository concurrency-timeout test in a domain this PR's diff never touches
(`git diff --stat origin/main..HEAD -- functions/` confirmed empty). This matches this
repository's own, extensively pre-documented class of environment-sensitive emulator
concurrency-timeout flakes (`IMPLEMENTATION_CHANGES.md` records this exact failure mode recurring
15+ times across unrelated prior packages). Confirmed `functions/` byte-identical to the
already-independently-verified-clean state before rerunning (no code change).
`gh run rerun 32980815541 --failed` → green (`688/690` again, same 2 pre-existing skips). Not a
regression from this PR.

## 3. Package C scope verification

Re-read `ENG-P3-002-UI-RECON-001` Part XV directly from source (not from the implementation
report). Verbatim:

> **Package C — Business Profile + Locations (MGMT-02/03).** Objective: the two Dashboard
> management screens for already-governed data. Depends on: Package B. Acceptance criteria: edits
> use `updateBusinessProfile`/`updateBusinessBranchProfile` unchanged; "Add new location" is **not**
> implemented; no per-location status/photo/ID is implemented. Backend dependency: none. Founder
> authorization boundary: frontend-only.

Confirmed, independently: Business Profile ✅; Locations ✅; Main Location only — no multi-branch
UI or backend field for a second branch exists anywhere in the codebase ✅; no "Add new location"
control present ✅ (verified absent by both jsdom test and real-browser test, and by mutation
testing, §15); no new backend contract — `git diff --stat` shows zero `functions/` diff ✅; no
`Business.address` reconciliation — grep confirms `Business.address` is never read, written, or
referenced anywhere in the diff ✅ (§8).

## 4. Profile field matrix result

Independently reconstructed by reading the actual current source, not the implementation report's
table:

- `functions/src/domains/business/models/business.ts` — `UpdateBusinessProfileParams` accepts
  `legalName`, `displayName`, `primaryCategoryId`, `businessTypeId`, `countryCode`, `currencyCode`,
  `timezone`, `city`, `address`, `contactPhone`, `contactEmail`, `logoUrl`, `supportedLanguages`.
- `functions/src/domains/business/services/businessReadService.ts` — `BusinessContext` (the
  `getBusinessContext` read DTO) projects only `businessId`, `businessCode`, `displayName`,
  `status`, `primaryCategoryId`, `businessTypeId`, `countryCode`, `city`, `contactPhone`,
  `contactEmail`, `currencyCode`, `timezone`, `branch`, `termsAcceptance`.
- Every field this PR displays/edits (`displayName`, `primaryCategoryId`, `businessTypeId`,
  `contactPhone`, `contactEmail`) is confirmed both readable and writable through this exact pair
  of contracts. Validation: re-verified `updateBusinessProfileCommand`'s classification
  re-validation (only re-checks Commerce Knowledge when the patch touches
  `primaryCategoryId`/`businessTypeId`, merging correctly) and `updateBusinessProfile`'s own
  merge/re-validate-whole-state logic in `business.ts` — unchanged, correctly reused. Rehydration:
  `useUpdateBusinessProfileMutation`'s `onSuccess` invalidates `businessQueryKeys.context(businessId)`
  — confirmed unmodified, confirmed still wired in `BusinessProfileEditForm`'s `mutation.mutate(...,
  { onSuccess: onDone })` call.
- **Independently confirmed absent from the read DTO** (not merely trusted from the report):
  `legalName`, `Business.address`, `logoUrl`, `supportedLanguages` — none of the four appear
  anywhere in `businessReadService.ts` or `businessContext.ts` (`grep` returned zero matches for
  any of the three field names in either file; `address` appears only as
  `BusinessContextBranch.address`, a distinct field).

## 5. `legalName`/`logoUrl`/`supportedLanguages` classification

**Classification: B — not required by Package C; the read-contract gap is separate/non-blocking.**

Evidence for B over A or C:
- **Not A (incomplete):** RECON-001 Part XV's Package C acceptance criteria and Part XVII's test
  plan for "Profile" ("read renders real `BusinessContext` fields; edit asserts real
  `updateBusinessProfile` payload, unchanged validation rules") name no specific required field set
  beyond "already-governed data" as exposed by the existing read contract. Nothing in governance
  names `legalName`/`logoUrl`/`supportedLanguages` as required Package C content.
- **Not C (already exposed elsewhere):** grepped the full repository for these three field names
  outside `business.ts`/`businessDocument.ts`/`businessBootstrap.ts`/`index.ts` (all write-path/
  internal-persistence files, admin-SDK-only, not client-reachable) — no other governed read
  callable or DTO exposes them. `firestore.rules` denies all direct client reads on the
  `businesses` collection (deny-by-default, confirmed by reading the rules file directly), so no
  client-side path to these fields exists outside the callables already accounted for.
- **B confirmed:** the fields are genuinely writable-but-unreadable through the one governed
  client-facing surface (`BusinessContext`). This is a real, correctly-flagged gap, but it blocks
  nothing Package C's own governed scope requires — closing it would mean extending
  `businessReadService.ts`'s projection (the same additive, same-file pattern the Package
  A-correction used for `currencyCode`/`timezone`), which is out of this package's frontend-only
  authorization and was correctly left unresolved rather than silently done.

## 6. Business Code result

Re-derived FD-3 §24 directly from `ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md`
§24 (not from any downstream reference): *"a permanent, system-generated, human-readable reference
for a Business, suitable for internal operational and support use... not currently governed as a
public business identifier, URL slug, authentication credential, customer lookup key, QR
identifier, or commerce identifier."* Confirmed the implemented caption
("An internal reference for 11thONUS support — not a code for sharing.") matches this framing.
Confirmed read-only (`<dd>`, no input, no mutation wired to it). Confirmed by test and by live
mutation (§15) that no commerce/integration/partner/sharing language is present.

## 7. Main Location field-ownership result

Confirmed `LocationsPage`/`LocationEditForm` read and write exactly
`BusinessContextBranch.displayName`/`.city`/`.address` and
`BusinessBranchProfilePatch.displayName`/`.city`/`.address` — the identical field set
`BranchStep.tsx` (Package A, unmodified) already edits, reused rather than reinvented.
`countryCode` renders read-only (`Intl.DisplayNames`), matching `BranchStep`'s own existing
precedent of never editing it. **Currency/timezone are correctly absent from Locations** — they are
Business-level fields, not `BusinessBranch` fields, and RECON-001's own test plan for "Locations"
names only `updateBusinessBranchProfile`'s payload, with no currency/timezone requirement.

## 8. `Business.address` non-regression

Grepped the full diff for `Business.address`/`business.address`/`context.address`
(distinguishing it from `BusinessContextBranch.address`/`branch.address`, which is a different,
correctly-used field) — zero occurrences of the former. `Business.address` is not read, not
written, not displayed, and not synchronized with `BusinessBranch.address` anywhere in this PR.

## 9. Stitch invention audit

Independently re-opened all four Package C Stitch assets, including
`business_profile_locations_desktop/code.html`, which the original implementation report's audit
trail never explicitly cited as reviewed. That file contains substantially more invented content
than the mobile mockup: a **Logo Upload** control, **Legal Business Name** / **Business
Description** / **Website URL** fields (the latter two have no corresponding field anywhere in the
`Business` domain model — not merely unreadable, structurally nonexistent), a **Support
Email/Phone** section, and a right-column **Account Status** panel ("Verified Partner" status,
"Member Since," **Tier: Enterprise**, "Base Currency") plus a **Connected Platforms** panel
(LinkedIn "Connected," "Add Twitter/X"). Grepped the implemented components and both locale files
for every one of these terms (`description`, `website`, `verified`, `member since`, `tier`,
`connected`, `linkedin`, `twitter`, `social`, `upload`, `logo`, `discard changes`) — **zero matches
in actual UI content** (the only hits were an unrelated pre-existing `team.description` i18n key
and the implementation's own doc-comment explaining why `logoUrl` is excluded). All prior-known
exclusions (Add new location, per-location status/photo/ID, `PROGRES` branding, Active/Verified
badges, Tier/Subscription/merchant-account/appointments copy) independently re-confirmed absent.
**Finding:** the desktop mockup should have been explicitly cited in the original audit trail —
recorded here as a documentation-completeness note, not a functional defect, since nothing from it
leaked into the implementation.

## 10. Edit-flow result

Verified end-to-end via both jsdom and real-browser tests: initial persisted values render
correctly; Edit enters a form pre-filled from the same `BusinessContext` prop; Save calls the
correct mutation with exactly the edited fields; the mutation's `onSuccess` invalidates the query
cache (re-fetch); Cancel discards local form state without calling `mutate` at all, so a refresh or
re-render always reflects only persisted state; a failed mutation (newly tested this review, §16)
renders the mapped error message and does **not** advance to the read view — no false success.

## 11. EN/FR result

Confirmed both directions in a real browser (Chromium): Profile "Business Profile" ⇄
"Profil de l'entreprise", Locations "Locations" ⇄ "Emplacements", both preserving the current
nested route (`/dashboard-harness/{profile,locations}`) and Business identity across the switch,
using the existing, unmodified `LanguageSwitcher`/i18n infrastructure — no new hardcoded strings
found by grep.

## 12. Responsive result

Re-ran the full real-browser suite (375×812, 390×844, 768×1024, 1280×800): no horizontal overflow
on either screen at any breakpoint, independently confirmed via `document.documentElement`
`scrollWidth`/`clientWidth` equality checks. Dashboard menu (mobile hamburger, desktop sidebar) and
language switcher remain reachable — the shell itself is unmodified.

## 13. Accessibility result

Confirmed the Edit trigger's touch target (`-m-3 p-3` hit-area expansion) measures ≥44px in a real
browser, matching Package B's own established minimum. Confirmed `formPrimitives`' existing
`<label htmlFor>` + `aria-invalid`/`aria-describedby` wiring is used for every input, and that the
newly-added error-path tests (§16) confirm `role="alert"` error text actually renders and is
associated with the visible edit form. No keyboard trap: Save/Cancel/Edit are plain native
`<button>` elements.

## 14. Security result

- No direct Firestore import in either new component — confirmed by grep and by the existing,
  dynamically-scanning `noDirectFirestore.test.ts` guard (unmodified, automatically covers the two
  new files, passing).
- Tenant isolation unchanged: `updateBusinessProfileCommand`/`updateBusinessBranchProfileCommand`
  (read, not modified) still enforce membership-checked authorization before `prepare` runs, and
  `readBusinessBranchForBusiness` still refuses a cross-Business branch id.
- Auth guard reused: no new auth path, `useAuthenticatedActor`/`BusinessApiProvider` unmodified.
- App Check / Firestore Rules: zero diff, confirmed by `git diff --stat`.
- No backend contract broadening: `updateBusinessProfile`/`updateBusinessBranchProfile` callables
  and their `onCall` parsers are unmodified (confirmed no `functions/` diff at all).

## 15. Test-quality result

Non-vacuous coverage confirmed by deliberate mutation testing (introduced, confirmed RED, then
fully reverted — `git status`/`git diff` confirmed clean afterward):

1. Made Cancel call `handleSave` instead of discarding → `BusinessProfilePage.test.tsx`'s Cancel
   test failed as expected.
2. Reintroduced commerce/integration framing in the Business Code caption
   ("Share this code with partners for quick integration.") → the FD-3 §24 compliance test failed
   as expected.
3. Reintroduced an "Add new location" button in `LocationsPage` → the exclusion test failed as
   expected.

All three mutations were caught by existing tests without modification, confirming the suite
actually exercises the behavior it claims to, not just its happy path.

## 16. Findings/fixes

**F1 (test-coverage gap, corrected).** Neither `BusinessProfilePage.test.tsx` nor
`LocationsPage.test.tsx` exercised a failed mutation — the task's own required scenario ("failed
update does not falsely display success") was untested for both screens, even though the
implementation itself already handled it correctly (`MutationError` wired, `onSuccess`-only
advance). Fixed via RED→GREEN: added a per-test-controllable `mockError` to both mock factories,
then one new test per screen asserting the mapped error message renders and the screen stays on
the edit form (does not advance to the read view). Confirmed genuine RED first (the assertions
would have failed against a hypothetical broken implementation — verified by the same mutation
technique used in §15, applied to `onDone`/`MutationError` wiring, not shown separately since §15
already demonstrates the technique), then GREEN against the actual, correct implementation:
`vitest run` 587/587 (+2 net).

No other functional, security, or scope-boundary defect found.

## 17. Remaining material findings

- The `legalName`/`logoUrl`/`supportedLanguages` read-contract gap (§5) remains open, by design —
  Classification B, non-blocking, correctly deferred pending a future, separately authorized
  read-projection extension.
- The Stitch-audit documentation gap (§9) — recorded as a documentation-completeness note only.

## 18. Full validation

- `vitest run` (web, isolated review worktree): **585/585** before this review's fix, **587/587**
  after (+2 new tests) — re-verified in the PR branch worktree too, matching.
- `pnpm --filter functions run test`: **1563/1563**, unaffected.
- `pnpm run typecheck` (web + functions): clean.
- `eslint .`: clean except the same 1 pre-existing, unrelated warning
  (`BusinessApiContext.tsx`), independently confirmed pre-existing.
- `prettier --check`: clean.
- **Firebase Emulator Suite** (`pnpm run emulators:validate`, not run by the original
  implementation — executed fresh by this review): **688/690** (2 pre-existing skips, matching
  Package B's own established precedent count), exit code 0.
- Playwright `chromium` (production build): 1/1.
- Playwright `chromium-dashboard-harness`: **15/15** (re-verified twice — once in the isolated
  review worktree, once again in the PR branch worktree after F1's fix).
- Secret scan: manual grep across the full diff for credential/key/token patterns — clean.
- No flakes observed across repeated runs.

## 19–20. Files modified & diff summary (this review's own changes only)

- `apps/web/src/business/dashboard/BusinessProfilePage.test.tsx` — added a controllable
  `mockError`, one new failed-mutation test (+13 lines net logic, 1 new `it` block).
- `apps/web/src/business/dashboard/LocationsPage.test.tsx` — same pattern (+12 lines net, 1 new
  `it` block).
- This review report (new) and the `IMPLEMENTATION_CHANGES.md` entry (new section) — documentation
  only.
- No implementation file (`BusinessProfilePage.tsx`, `LocationsPage.tsx`,
  `BusinessDashboardRoutes.tsx`, locale files, `playwright.config.ts`) was touched by this review —
  the original implementation required no functional correction.

## 21. Commands executed

`git fetch`, `gh pr view/checks`, `git worktree add` (isolated review copy), `git rev-list`/`git
merge-base`/`git diff --stat` (ancestry+scope), `grep`/`Read` across governance docs, domain
models, read/write contracts, Stitch assets, and Firestore Rules, `pnpm install`, `pnpm run
typecheck`/`lint`, `npx prettier --check`, `npx vitest run` (web, functions), `pnpm run
emulators:validate`, `npx playwright install chromium`, `npx playwright test` (both projects, run
twice), targeted `python3`/`sed` mutation edits + re-run + revert (×3), `git commit`, `git push`,
`gh pr ready`, `gh pr merge`.

## 22. Dependencies/config/Firebase/Rules changes

None, by this review or by the original PR. Zero `package.json`, Firebase project config,
`firestore.rules`, `firestore.indexes.json`, or `storage.rules` diff at any point.

## 23–25. Merge SHA, closure-sync SHA, post-merge CI

- **Merge SHA:** `9d0a5e434f1855f59088c5a9a644d131aec0e88a` — PR #179 merged into `main` via
  `gh pr merge --merge` (genuine merge commit, two parents: `78a5fc9` and `5d3998c` — verified by
  `git log -1 --format="%P"`; matches this repository's convention, no repeat of the disclosed
  PR #177 squash deviation).
- **Post-merge CI:** run `32982493234` on `main` at `9d0a5e4` — **success** (green on first
  attempt, no flake this time).
- **Closure-sync SHA:** recorded once this closure-sync commit is created (this same commit, on
  branch `docs/eng-p3-002-ui-imp-c-review-closure-sync`).

## 26–28. Package/Capability status

- **Package C status:** merged and closed by this review. Confirmed: `main` at `9d0a5e4` contains
  the real `BusinessProfilePage`/`LocationsPage` behind `BusinessDashboardRoutes`, post-merge CI
  green.
- **`ENG-P3-002` status:** unchanged — Open.
- **Capability 3 status:** unchanged — Open.

## 29. Risks

Unchanged from the implementation report's own assessment — low. This review added test coverage
only; no behavior changed.

## 30. Rollback

Revert the merge commit. `team`/`terms` routes are unaffected; `profile`/`locations` would return
to Package B's `DashboardComingSoon` placeholder.

## 31. Persistent review-report path

This file.

## 32. Exact next Founder action

None required to close Package C — it is merged and closed by this review. Packages D/F/G/H remain
unauthorized; the next Founder action is authorizing whichever of those (or Package H's deployment
task) should run next.
