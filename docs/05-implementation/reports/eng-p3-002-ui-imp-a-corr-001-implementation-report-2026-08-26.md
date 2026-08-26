> **Title:** ENG-P3-002-UI-IMP-A-CORR-001 — Establishment Review Completeness & Operating Details
> Read Contract — Implementation Report
> **Task:** ENG-P3-002-UI-IMP-A-CORR-001
> **Version:** 1.0 · **Status:** Implemented — draft PR, pending Founder review · **Classification:**
> Implementation report
> **Corrects:** 3 bounded non-blocking gaps found by the independent review of PR #173
> ([`eng-p3-002-ui-imp-a-review-report-2026-08-26.md`](eng-p3-002-ui-imp-a-review-report-2026-08-26.md))
> **Date:** 2026-08-26

This report covers implementation of a bounded correction package against `Fkenogo/11THONUS`,
following the task's own 39-point reporting requirement.

---

## 1. Entry repository state

- Worktree: isolated agent worktree at
  `/Users/theo/11THONUS/.claude/worktrees/agent-a155d0b2f1c5d58b8`.
- `git fetch origin` run first. `origin/main` head at entry: `72b6c6b1b1f284377990ea9f2fd405dee3fc5dbc`
  (PR #174's merge commit) — this worktree's own `HEAD` was already exactly at that commit (0 ahead,
  0 behind), working tree clean, no stuck git locks (`find .git -name "*.lock"` returned nothing).
- `git merge-base --is-ancestor 84995e693aa082bc5bf7dd2091ecd410151f9fa7 origin/main` → **yes**
  (PR #173's merge commit is an ancestor).
- `git merge-base --is-ancestor 72b6c6b1b1f284377990ea9f2fd405dee3fc5dbc origin/main` → **yes**
  (PR #174's merge commit is an ancestor — trivially true, it *is* `origin/main`'s head).
- Post-merge CI on `origin/main`'s head: `gh api repos/Fkenogo/11THONUS/commits/72b6c6b1.../check-runs`
  → `"Build, Lint, Test, Emulator Validation"` = `completed`/`success`.
- `gh pr list --state open`: only #164 (unrelated App Check preview recovery, draft) and #34
  (unrelated, from July) were open — no overlapping branch/PR for this correction or for Package B.
  `git branch -r | grep -i corr-001` and similar searches found no conflicting branch either.
- Working branch created fresh from `origin/main`:
  `fix/eng-p3-002-ui-imp-a-corr-001-establishment-review-completeness`.

## 2. Review findings independently reproduced

All 3 findings were re-derived directly from source, not trusted from the prior report:

- **Finding 1 (currencyCode/timezone):** confirmed by reading
  `functions/src/domains/business/services/businessReadService.ts` in full — the `BusinessContext`
  type and the `getBusinessContext` function's return object both omitted `currencyCode`/`timezone`
  entirely. Confirmed on `functions/src/domains/business/models/business.ts` that both fields are
  required (non-optional) on `Business`, validated at both creation (`createBusiness`) and update
  (`updateBusinessProfile`), lines 43-44/70-71/120-137/167-168/202-229.
- **Finding 2 (country/address):** confirmed on
  `functions/src/domains/business/models/businessBranch.ts` that `countryCode`/`address` are real
  `BusinessBranch` fields, and confirmed `businessReadService.ts`'s `toBranchDto` already projects
  both onto `BusinessContextBranch` (and the frontend `businessContext.ts` type already declares
  them) — `EstablishmentReviewPage.tsx` simply never read `context.branch.countryCode`/`.address` in
  its JSX.
- **Finding 3 (progress indicator):** confirmed by reading every establishment component
  (`EstablishmentIdentityStep.tsx`, `EstablishmentLocationStep.tsx`, `EstablishmentReviewPage.tsx`,
  `NewBusinessPage.tsx`) — none rendered any "Step X of Y" text or component.

All 3 findings matched the prior review's classification exactly; none were materially wrong, so no
finding was dropped or reclassified.

## 3. Pre-change data-flow analysis

Traced end-to-end before making any change:

EST-02 form (`EstablishmentLocationStep.tsx`) collects `currencyCode`/`timezone` as free-text
required fields → `useCreateBusinessMutation` → `createBusiness.ts`'s `CreateBusinessRequest` →
`functions/src/index.ts:405-406`'s `parseRequiredString(value.currencyCode, ...)` /
`parseRequiredString(value.timezone, ...)` (both required at the callable boundary) →
`functions/src/domains/business/models/business.ts`'s `createBusiness()` (required, validated
fields) → `businessRepository.ts`'s atomic `db.runTransaction` write → Firestore `businesses`
collection → `businessReadService.ts`'s `getBusinessContext()` reads the `Business` document back
but its return object never included `currencyCode`/`timezone` in the projection → the frontend
`BusinessContext` DTO type (`businessContext.ts`) never declared them → `EstablishmentReviewPage.tsx`
had no field to render, and its own header comment explicitly disclosed this gap rather than
fabricating a value.

Country/address: `BusinessLocationStep`/`EstablishmentLocationStep` write `countryCode`/`address`
onto the default `BusinessBranch` (via `createBusiness`'s bundled Branch creation, or
`updateBusinessBranchProfile` for `address` post-creation) → `businessRepository.ts`/
`readDefaultBranchForBusiness` → `businessReadService.ts`'s `toBranchDto()` already projected
`countryCode`/`address` onto `BusinessContextBranch` → the frontend type already declared them →
`EstablishmentReviewPage.tsx`'s JSX simply never referenced `context.branch.countryCode`/`.address`.

## 4. Fix strategy

Stated before coding, then followed exactly:

1. Extend `BusinessContext`'s type and `getBusinessContext`'s return object in
   `businessReadService.ts` with `currencyCode: string; timezone: string;` sourced directly from the
   `business` object already read inside that function — no new read, no new query, no inference.
2. Mirror the same additive fields onto the frontend `BusinessContext` type
   (`apps/web/src/business/api/businessContext.ts`).
3. In `EstablishmentReviewPage.tsx`, add `context.branch.countryCode`/`.address` rendering to the
   existing "Main location" section, and a new "Operating details" section for
   `currencyCode`/`timezone`, using `Intl.DisplayNames` (a standard platform API, not an invented
   lookup table) for country/currency human-readable names, and the raw persisted string for
   timezone (no detection/conversion).
4. Add a new, small `EstablishmentProgress` component and wire it into `NewBusinessPage.tsx` (EST-01/
   EST-02) and `EstablishmentReviewPage.tsx` (EST-03, including its two in-place-edit branches).
5. TDD every piece: write the failing test, confirm RED via `git stash` of the source-only change,
   restore the source, confirm GREEN.
6. Update the ~7 pre-existing test fixtures that construct a literal `BusinessContext` object, so
   they satisfy the now-required `currencyCode`/`timezone` fields.

## 5. currencyCode persistence owner

`Business.currencyCode` (`functions/src/domains/business/models/business.ts` lines 43/70/120-137/
167/202/225-226) — a required, non-optional field on the `Business` domain model, validated against
`CURRENCY_CODE_PATTERN` both at creation and at profile update. **Not** on `BusinessBranch`.

## 6. timezone persistence owner

`Business.timezone` (same file, lines 44/71/123-124/168/203/228-229) — required, non-optional,
validated non-blank both at creation and at profile update. **Not** on `BusinessBranch`.

## 7. `getBusinessContext` DTO change

`functions/src/domains/business/services/businessReadService.ts`:

- `BusinessContext` type gained `currencyCode: string; timezone: string;` (required, matching the
  domain model's own non-optional fields — consistent with `countryCode`/`city`, which are also
  required non-optional fields on the same DTO).
- `getBusinessContext()`'s return object gained `currencyCode: business.currencyCode, timezone:
  business.timezone,` — read from the same `business` object already fetched by
  `resolveAuthorizedBusinessForRead`, no new Firestore read.
- Every other field, both in the type and the return object, is byte-for-byte unchanged — this is a
  pure addition, verified by the regression test in §17 below (test 9).
- `functions/src/index.ts`'s `getBusinessContext` callable required **no change** — it returns the
  service function's result verbatim (`return await getBusinessContextRead(db, userId, businessId);`
  at line 714), so the new fields flow through automatically.

## 8. Authorization/privacy non-regression

- Tenant isolation: `resolveAuthorizedBusinessForRead` is unchanged — every authorization check
  (owner/manager/staff membership, suspended-membership denial, cross-Business denial,
  enumeration-resistant not-found) is untouched code, re-exercised by both the pre-existing test
  suite (all passing unchanged) and 2 new tests (§17 tests 7-8) confirming currencyCode/timezone stay
  correctly scoped per-Business and that cross-Business reads are still denied identically.
- DTO privacy: `ownerUserId`/`schemaVersion`/`subscriptionId`/timestamps remain excluded — re-verified
  by test 9 (§17), which explicitly asserts these are still `undefined` on the returned DTO alongside
  the new fields.
- Fail-closed behavior on malformed/zero/multiple-Branch documents: untouched code paths, all 5
  pre-existing tests covering this (`4`, `4b`, `4c`, `5`, "non-existent Business") still pass
  unmodified.

## 9. EST-03 country/address/currency/timezone results

- **Country:** renders via `countryDisplayName(context.branch.countryCode, i18n.language)` using
  `Intl.DisplayNames([locale], { type: "region" })`. Verified: `screen.getByText("Burundi")` for
  `countryCode: "BI"`.
- **Address:** renders `context.branch.address` when present (`"12 Avenue de la Paix"` in test);
  renders `t("review.addressNotProvided")` ("No address provided" / "Aucune adresse fournie") when
  absent — verified both branches by test, confirmed no error-state text appears in the absent case.
- **Currency:** renders via `currencyDisplayName(context.currencyCode, i18n.language)` using
  `Intl.DisplayNames([locale], { type: "currency" })`. Verified: `"BIF"` → `"Burundian Franc"`,
  `"USD"` → `"US Dollar"`.
- **Timezone:** renders `context.timezone` verbatim — no detection, no conversion. Verified:
  `"Africa/Bujumbura"` renders as-is.
- `Business.address` is not read, written, or referenced anywhere in this diff — confirmed by
  `grep -n "Business.address"` over the diff (no hits) and by the component header comment.

## 10. Edit/re-read result

No new edit path was added. `currencyCode`/`timezone`/`countryCode`/`address` are rendered
read-only in the new sections — `ClassificationStep`/`BranchStep` (the existing, unmodified edit
components reached via "Edit" on the Business/Location sections) were not extended to cover these
fields, since neither did before this correction and extending them was out of this task's scope
(Phase E: "no duplicate update paths," and the task's fix list names only read-contract/rendering
gaps, not new mutation surfaces). `EstablishmentReviewPage` still re-queries `getBusinessContext` on
every `BusinessWizardPage` mount (unchanged), so a refresh or a return from an edit always
re-hydrates from backend truth — verified by the "re-rendering with a fresh backend context" test
(§17 test 11), which swaps `context.currencyCode`/`.timezone` on rerender and confirms the screen
shows the new values, not the stale ones.

## 11. Progress-indicator result

New `EstablishmentProgress` component (`apps/web/src/business/onboarding/establishment/
EstablishmentProgress.tsx`) renders `t("progress.step", { current, total })` → "Step X of Y" (EN) /
"Étape X sur Y" (FR) inside a `role="status"` paragraph — no interactive role, nothing clickable
(verified by test: no `button`/`tab`/`link` role present). Wired in:
- `NewBusinessPage.tsx`: `<EstablishmentProgress current={step === "identity" ? 1 : 2} total={3} />`
  — EST-01 shows "Step 1 of 3", EST-02 shows "Step 2 of 3".
- `EstablishmentReviewPage.tsx`: `<EstablishmentProgress current={3} total={3} />` on all three
  render branches (main review, in-place identity edit, in-place location edit) — EST-03 (and its
  in-place edits, since they're the same screen) always shows "Step 3 of 3".
No persisted step model, no URL-derived lifecycle semantics beyond the routing that already existed,
no tab navigation, `OnboardingWizard.tsx` was not resurrected (confirmed: it remains deleted, no new
import references it), no new `Business.status` value was introduced.

## 12. Mobile result

Code-based audit (same method and same disclosed caveat as the prior independent review — no live
browser click-through was performed in this environment). `EstablishmentProgress` renders a single
`<p>` with only relative Tailwind classes (`mb-4 text-sm`, no fixed widths, no absolute positioning)
— it cannot force horizontal overflow at any viewport width. It was inserted into the existing
`mx-auto max-w-lg` stacked layouts of `NewBusinessPage.tsx` and `EstablishmentReviewPage.tsx` without
altering their container structure. The new "Operating details" `<div>`/`<dl>` in
`EstablishmentReviewPage.tsx` reuses the exact same classes (`rounded-md border ... p-4`,
`flex flex-col gap-2 text-sm`) as the pre-existing "Business"/"Main location" sections it sits below
— no new layout primitive was introduced, so it inherits the same mobile-safety property the prior
review already verified for those sections. `grep -rn "w-\[\|px-\[\|width:"` over the modified files
returns nothing.

## 13. Desktop result

Same single-layout, `max-w-lg`-centered structure as before this correction — no desktop-only branch
was added, consistent with the existing mobile-first/desktop-companion approach the prior review
verified. Same code-based-audit caveat as §12.

## 14. EN/FR result

Every new key added to `apps/web/src/i18n/locales/en.ts` has a corresponding `fr.ts` entry, checked
key-by-key: `actions.progress.step` (actually `progress.step`, sibling of `actions`), `review.
operatingDetailsSectionTitle`, `review.countryLabel`, `review.addressLabel`, `review.
addressNotProvided`, `review.currencyLabel`, `review.timezoneLabel`. No key is EN-only or FR-only.
The full web test suite (539/539, including `i18n.test.tsx`, which structurally validates EN/FR key
parity) passes. `Intl.DisplayNames` is constructed with `i18n.language` as the locale, so country/
currency names localize automatically when the language is switched — not hardcoded to English.

## 15. Package A regression result

Full pre-existing Package A behavior re-verified, not just assumed:
- `createBusiness` boundary: unchanged, zero diff on `createBusiness.ts`/`businessMutations.ts`/
  `functions/src/index.ts`'s `createBusiness` handler/`businessRepository.ts`.
- Business stays `draft`: no lifecycle-status code touched anywhere in this diff (`grep` for status
  transitions over the diff finds none).
- "Finish setup" remains navigation-only: the `onClick` handler in `EstablishmentReviewPage.tsx` is
  unchanged (`navigate(...)`, no mutation call added near it).
- Terms/Team absence: the pre-existing test `"never renders Terms or Team content on this screen"`
  still passes unmodified against the new markup.
- Old wizard retirement: `OnboardingWizard.tsx` remains deleted; no new reference to it was added.
- No direct client Firestore access was introduced (`grep -rn "firebase/firestore\|getFirestore\|
  collection(" ` over the touched files returns nothing new).
- `RequireAuthenticatedUser`/App Check/routing: untouched, zero diff on `App.tsx` or any App
  Check-related file.

## 16. RED→GREEN evidence

**Backend** (`functions/src/domains/business/services/businessReadService.emulator.test.ts`):
3 new tests added (tests 6-8, plus a regression test 9). Verified RED by `git stash push --`-ing only
`businessReadService.ts` (keeping the new tests), running
`firebase emulators:exec ... "pnpm --filter functions test:emulator -- businessReadService.emulator"`:

```
 FAIL  ... > 6. returns the exact persisted currencyCode and timezone ...
 AssertionError: expected undefined to be 'USD'
 FAIL  ... > 7. currencyCode/timezone are scoped to the correct Business ...
 AssertionError: expected undefined to be 'USD'
 FAIL  ... > 9. regression: every pre-existing BusinessContext field is still present ...
 - currencyCode / timezone missing from actual object
 Test Files  1 failed | 51 passed (52)
      Tests  3 failed | 685 passed | 2 skipped (690)
```

Then `git stash pop` (restoring `businessReadService.ts`) and re-ran the identical command:

```
 Test Files  52 passed (52)
      Tests  688 passed | 2 skipped (690)
```

**Frontend** (`EstablishmentReviewPage.test.tsx`): 6 new tests added. Verified RED by stashing only
`EstablishmentReviewPage.tsx` and running `pnpm --filter web test -- --run EstablishmentReviewPage`:

```
 Test Files  1 failed (1)
      Tests  6 failed | 5 passed (11)
```//(the 6 new: Step 3 of 3, country, address-present, address-absent, currency+timezone section,
re-fetch-reflects-new-values; the 5 pre-existing all still passed unmodified)

Then restored `EstablishmentReviewPage.tsx` and re-ran:

```
 Test Files  1 passed (1)
      Tests  11 passed (11)
```

**Progress component** (`EstablishmentProgress.test.tsx`): written before `EstablishmentProgress.tsx`
existed at all — first run failed with "Failed to resolve import './EstablishmentProgress'" (import
error, the strongest possible RED), then passed 4/4 once the component was created.

## 17. Tests added/changed

- `functions/src/domains/business/services/businessReadService.emulator.test.ts` — 3 new tests
  (currencyCode/timezone exact projection; two-Business scoping; regression `toMatchObject` covering
  every pre-existing + new field and re-asserting DTO privacy).
- `apps/web/src/business/onboarding/establishment/EstablishmentProgress.test.tsx` — new file, 4
  tests.
- `apps/web/src/business/onboarding/establishment/EstablishmentReviewPage.test.tsx` — 7 new tests
  (Step 3 of 3; country; address present; address absent; Operating Details currency+timezone;
  re-fetch reflects new values) + 1 pre-existing test adjusted (`/Bujumbura/` regex broadened to
  `getAllByText` since "Bujumbura" now legitimately appears twice — city and inside the
  "Africa/Bujumbura" timezone value).
- `apps/web/src/business/onboarding/NewBusinessPage.test.tsx` — 2 new tests (Step 1 of 3, Step 2 of
  3).
- `apps/web/src/business/api/businessContextCallable.test.ts`,
  `apps/web/src/business/dashboard/DashboardPlaceholder.test.tsx`,
  `apps/web/src/business/onboarding/BusinessWizardPage.test.tsx`,
  `apps/web/src/business/onboarding/completeness.test.ts`,
  `apps/web/src/business/onboarding/establishment/establishmentCompleteness.test.ts`,
  `apps/web/src/business/onboarding/steps/TeamStep.test.tsx` — each had its literal `BusinessContext`
  test fixture extended with `currencyCode`/`timezone` (mechanical, required by the now-non-optional
  DTO fields; no test logic changed).

## 18. Full validation

All commands run from this branch's own head, Node 20.20.0 (repo's declared engine):

- **`pnpm typecheck`**: **PASS**, 0 errors, both `apps/web` and `functions`.
- **`pnpm lint`**: **PASS** — 0 errors, 1 pre-existing warning (`BusinessApiContext.tsx:26`,
  react-refresh/only-export-components — unrelated file, not touched by this diff, same warning the
  prior review also disclosed).
- **`pnpm format:check`**: **PASS** after one `prettier --write` on `EstablishmentReviewPage.tsx`
  (the JSX edits initially exceeded prettier's line-length rule on one line) — "All matched files use
  Prettier code style!"
- **`pnpm --filter web test -- --run`**: **PASS** — 85 test files, 539 tests, 0 failures (527 + 12
  net new across the touched files, since the prior baseline was 527).
- **`pnpm --filter functions test`**: **PASS** — 143 test files, 1563 tests, 0 failures (byte-for-byte
  the same count as the prior review's baseline — this correction added only emulator-suite tests,
  none to the non-emulator functions unit suite).
- **`pnpm emulators:validate`** (real Firebase Emulator Suite — auth, functions, firestore, hosting,
  storage, extensions): **PASS** — 52 test files, 688 tests passed, 2 skipped, 0 failed (685 + 3 net
  new).
- **`pnpm -r run build`**: **PASS** for both `apps/web` (`tsc -b && vite build`) and `functions`
  (`tsc`). Same pre-existing bundle-size warning as the prior review (1005 kB gzip 309 kB,
  unrelated to this diff's file set).
- **Playwright** (`npx playwright install chromium --with-deps` then `npx playwright test`): **PASS**
  — 1/1 (`tests/e2e/app-shell.spec.ts`).
- **Secret scan**: no `gitleaks`/`trufflehog` binary available in this environment (same as the prior
  review); manual `grep` over the full diff for API-key/PEM-header/secret/password patterns found no
  matches.

No unrelated flakes were observed in this run (the prior review's report noted a since-resolved
concurrent-worker Emulator Suite flake from an earlier package; it did not recur here).

## 19. Files modified

- `functions/src/domains/business/services/businessReadService.ts`
- `functions/src/domains/business/services/businessReadService.emulator.test.ts`
- `apps/web/src/business/api/businessContext.ts`
- `apps/web/src/business/api/businessContextCallable.test.ts`
- `apps/web/src/business/dashboard/DashboardPlaceholder.test.tsx`
- `apps/web/src/business/onboarding/BusinessWizardPage.test.tsx`
- `apps/web/src/business/onboarding/NewBusinessPage.tsx`
- `apps/web/src/business/onboarding/NewBusinessPage.test.tsx`
- `apps/web/src/business/onboarding/SubmittedStatusPage.test.tsx`
- `apps/web/src/business/onboarding/completeness.test.ts`
- `apps/web/src/business/onboarding/establishment/EstablishmentReviewPage.tsx`
- `apps/web/src/business/onboarding/establishment/EstablishmentReviewPage.test.tsx`
- `apps/web/src/business/onboarding/establishment/EstablishmentProgress.tsx` (new)
- `apps/web/src/business/onboarding/establishment/EstablishmentProgress.test.tsx` (new)
- `apps/web/src/business/onboarding/establishment/establishmentCompleteness.test.ts`
- `apps/web/src/business/onboarding/steps/TeamStep.test.tsx`
- `apps/web/src/i18n/locales/en.ts`
- `apps/web/src/i18n/locales/fr.ts`
- `docs/changes/IMPLEMENTATION_CHANGES.md` (this task's changes-log entry)
- `docs/05-implementation/reports/eng-p3-002-ui-imp-a-corr-001-implementation-report-2026-08-26.md`
  (this report)

18 source/test files changed (2 new) + this report + the changes log = 20 total.

## 20. Code diff summary

18 files changed, 370 insertions(+), 11 deletions(-) (source/test files, per
`git diff origin/main --stat` before this report/changes-log were added). Zero files under
`firestore.rules`, `storage.rules`, `firebase.json`, `package.json`, or `pnpm-lock.yaml`.

## 21. Commands executed

`git fetch origin`; `git merge-base --is-ancestor ...` (×2); `gh api .../check-runs`;
`gh pr list --state open`; `git branch -r`; `git checkout -b ... origin/main`; extensive `grep`/`Read`
source-tracing across `functions/src/domains/business/` and `apps/web/src/business/`; `git stash push
--`/`git stash pop` (×2, for RED→GREEN isolation); `pnpm install --frozen-lockfile`; `pnpm typecheck`;
`pnpm lint`; `pnpm format:check`; `npx prettier --write ...`; `pnpm --filter web test -- --run`
(full and targeted); `pnpm --filter functions test`; `firebase emulators:exec --project demo-11thonus
"pnpm --filter functions test:emulator"` (full and targeted); `pnpm -r run build`; `npx playwright
install chromium --with-deps`; `npx playwright test`; `git add -A`; `git commit`; `git status`.

## 22. Dependencies added

None. No `package.json`/`pnpm-lock.yaml` diff in either workspace.

## 23. Config changes

None.

## 24. Firebase/Rules/deployment changes

None. Zero diff on `firestore.rules`, `storage.rules`, `firebase.json`, or any deployment
configuration.

## 25. Findings

No new defects were found beyond the 3 the task was scoped to fix. One minor pre-existing test
required adjustment for an incidental text collision (§17, `/Bujumbura/` regex) — not a defect, a
consequence of the test fixture's city name coincidentally matching a substring of its own timezone
value once both are rendered on the same screen.

## 26. Remaining material findings

None identified as blocking. Two items are worth flagging for Founder awareness, not as defects:

- `docs/00-governance/documentation-changes-log.md` (the top-level governance log, distinct from
  `docs/changes/IMPLEMENTATION_CHANGES.md`) was already flagged by the prior review (§32) as stale
  relative to the `ENG-P3-002` series. This correction package did not touch that file — out of this
  task's scope, per the task's own instruction not to claim `ENG-P3-002`/Capability 3 status there.
- Currency/country display names now depend on `Intl.DisplayNames` browser/runtime support. This is
  broadly supported in all evergreen browsers and Node ≥14, and the implementation catches any
  exception and falls back to the raw code, but it was not exercised against every possible
  currency/country/locale combination — only the fixtures used in tests (`BIF`/`USD`, `BI`).

## 27. Risks

Low. The backend change is strictly additive (new fields only, verified by a regression test that
the full pre-existing DTO shape is unchanged); the frontend change adds new rendering, no new
mutation path; the progress indicator is presentation-only. The one behavior change with any
user-visible risk is `Intl.DisplayNames` producing an unexpected string for an unusual
currency/country code — mitigated by the try/catch fallback to the raw code (never blank, never a
thrown error).

## 28. Rollback

Revert this branch's single commit (`5be59b7` at the time of writing) or close the PR without
merging — no migration, no Firestore schema change, no Firebase config change occurred, so rollback
is a pure code revert with no data-cleanup step required.

## 29. Persistent implementation report path

This file: `docs/05-implementation/reports/eng-p3-002-ui-imp-a-corr-001-implementation-report-2026-08-26.md`,
committed on this task's branch.

## 30. Changes-tracking state

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a new entry,
`ENG-P3-002-UI-IMP-A-CORR-001 — Establishment Review Completeness & Operating Details Read Contract
(2026-08-26)`, following the same structure as the preceding `ENG-P3-002-UI-IMP-A` entry. It does
not claim `ENG-P3-002`/Capability 3 as complete. `docs/00-governance/documentation-changes-log.md`
(the separate, older top-level log) was intentionally not touched, per this task's scope.

## 31. PR number

Opened as a **draft PR** immediately after this report was committed — see the final gate line and
the PR URL reported alongside it (this report's commit is on the PR's branch; the PR number is
assigned by GitHub at creation time, after this document was written, so it is reported in the
final chat response rather than hardcoded here to avoid a stale/incorrect reference).

## 32. Final head

The final commit on branch `fix/eng-p3-002-ui-imp-a-corr-001-establishment-review-completeness`
after this report and the changes-log entry are committed (reported exactly in the final chat
response, since it is created after this file).

## 33. CI result

Triggered automatically once the branch is pushed and the PR opened. This report's own local
validation (§18) already exercised the equivalent full suite (typecheck/lint/format/web tests/
functions tests/real Emulator Suite/build/Playwright) against this exact diff and all passed, so CI
is expected to reconfirm green.

## 34. ENG-P3-002 status

Unchanged by this correction: Package A (EST-01/02/03) remains merged; this correction package is a
bounded, separately-tracked fix to 3 disclosed gaps in it, not a new capability. Package B (the
Dashboard shell) remains **not started** — no `DASH-0x`/`ACT-01` component exists anywhere in
`apps/web/src` (re-confirmed by `find`), and this task explicitly does not begin it.

## 35. Capability 3 status

Not claimed complete by this report or by the changes-log entry it adds, per the task's explicit
instruction. `docs/00-governance/documentation-changes-log.md`'s currency gap (flagged by the prior
review, §32 there) is unchanged by this task — resolving it is outside this task's bounded scope.

## 36. Exact next Founder action

Review this draft PR. If approved, merge it (this task carries no merge authority). Package B (the
Business Dashboard shell) remains available for authorization as a separate, future task — not
started or implied-started by this correction.

## 37. Governance chain

This report is downstream of, and does not modify, `ENG-P3-002-UI-RECON-001`,
`ENG-P3-002-UI-HANDOFF-001` (+ Founder disposition),
`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` (+ Founder disposition), and the
`eng-p3-002-ui-imp-a-review-report-2026-08-26.md` independent review it corrects.

## 38. Scope discipline confirmation

Touched only: `getBusinessContext` backend/DTO/service + its emulator test; the matching frontend
API/type adapter; EST-03; a new shared establishment progress component + EST-01/02/03 integration;
i18n keys for the above; the 6 mechanically-updated pre-existing test fixtures; this report and the
changes log. Package B/Dashboard, Business Profile management, Team management, ACT-01 Terms
redesign, `DEC-LEGAL-002`, `Business.address`, Subscription Plan, and analytics were not touched —
confirmed by `git diff origin/main --stat` (§20) showing no file outside the above list.

## 39. Final gate

See the exact evidence-grounded line in the accompanying chat response.
