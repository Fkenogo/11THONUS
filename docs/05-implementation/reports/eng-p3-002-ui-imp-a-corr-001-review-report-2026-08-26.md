# ENG-P3-002-UI-IMP-A-CORR-001 — Independent Engineering Review Report

**Date:** 2026-08-26
**Reviewer:** Independent review session (Claude Sonnet 5), task ID `ENG-P3-002-UI-IMP-A-CORR-001-REVIEW`
**Subject:** PR #175 `fix/eng-p3-002-ui-imp-a-corr-001-establishment-review-completeness`
**Method:** Fresh isolated git worktree (`git worktree add`), no trust placed in the implementation report's claims — every claim independently re-derived from source, tests, and command output.

## 1. Entry state

- PR #175, base `main`, head `665aced4612d3b0a87e50655716beca71bdf7009`, state OPEN, draft: true, mergeable: MERGEABLE.
- CI check "Build, Lint, Test, Emulator Validation" = SUCCESS as of 2026-08-26T08:29:47Z.
- Confirmed independently via `gh pr view 175` immediately before starting review — matched exactly.

## 2. Final reviewed head

`665aced4612d3b0a87e50655716beca71bdf7009` (no fix commits were needed — see §11/§12).

## 3. Read-contract review result

Traced `getBusinessContext` end-to-end: `businessBootstrap.ts` (`createBusiness`) persists `currencyCode`/`timezone` on the `Business` document → `businessDocument.ts` parses/validates them on read (fail-closed on malformed values) → `businessReadService.ts`'s `getBusinessContext` now additionally projects `business.currencyCode`/`business.timezone` into the `BusinessContext` DTO → `apps/web/src/business/api/businessContext.ts` mirrors the same two fields in the frontend wire type → `EstablishmentReviewPage.tsx` renders them. The diff to `businessReadService.ts` is 13 lines, entirely additive (2 type fields, JSDoc, 2 return-object lines). `resolveAuthorizedBusinessForRead` (authorization) and `businessDocument.ts` (fail-closed parsing) are byte-for-byte unchanged in this PR — confirmed via `git diff` returning empty for both files.

## 4. currencyCode source result

Confirmed genuine: `functions/src/domains/business/models/business.ts` defines `currencyCode: string` as a required, validated (`CURRENCY_CODE_PATTERN`) field on `Business`, set at `createBusiness` time (`businessBootstrap.ts`) and persisted/parsed by `businessDocument.ts`. Not a Branch field, not inferred from `countryCode`/`city`, not hardcoded. `getBusinessContext` returns `business.currencyCode` verbatim.

## 5. timezone source result

Same finding as §4: `timezone: string` required and validated on `Business`, persisted at creation, returned verbatim as `business.timezone`.

## 6. Authorization/privacy result

Unchanged. `resolveAuthorizedBusinessForRead` (the sole authorization gate for `getBusinessContext`) has zero diff in this PR. New emulator tests (#7, #8, and the pre-existing "cannot read another owner's Business" / suspended-membership / malformed-document tests, all still present and passing) independently re-verify: cross-Business currencyCode/timezone never cross-contaminate (test 7); a non-owner is denied identically to before (test 8, `RESOURCE_NOT_FOUND`); the DTO still never leaks `ownerUserId`/`schemaVersion`/`subscriptionId` (test 9). No new field beyond `currencyCode`/`timezone` was added to the DTO — confirmed by diffing `BusinessContext`'s field list before/after.

## 7. EST-03 completeness result

`EstablishmentReviewPage.tsx` renders: business name, category/type, contact phone (Business section); Main Location name, city, country (via `Intl.DisplayNames`, only rendered `if (context.branch?.countryCode)`), address (or a restrained "No address provided" — never an error state) (Location section); currency (via `Intl.DisplayNames`) and timezone (rendered exactly as persisted, no conversion) (new Operating Details section). All values come from the `BusinessContext` prop passed down from the server read — no pre-create form state is used as review authority (the component takes `context: BusinessContext` as its only data input; `editing` state only toggles between review/edit sub-views, both of which also read from the same `context` prop). Refresh produces the same values because the data source is the server-authoritative read, not client state.

## 8. EN/FR result

`en.ts`/`fr.ts` diffs are fully parallel — every new key (`progress.step`, `review.operatingDetailsSectionTitle`, `review.countryLabel`, `review.addressLabel`, `review.addressNotProvided`, `review.currencyLabel`, `review.timezoneLabel`) exists in both locales, no orphaned keys. Verified `Intl.DisplayNames` is deterministic and correctly localized in this Node runtime for both locales directly:
- EN currency BIF → "Burundian Franc"; FR currency BIF → "franc burundais"
- EN region BI → "Burundi"; FR region BI → "Burundi"

One observation (not a blocking finding, see §11 F1): `EstablishmentReviewPage.test.tsx` does not include a French-locale-specific test asserting the FR translation strings render; it only asserts the language switcher is present (consistent with the prior `ENG-P3-002-CORR-LANGSWITCH-001` correction). Given `fr.ts`/`en.ts` are structurally parallel and `Intl.DisplayNames` works correctly for `fr` (verified above), this is a minor test-coverage gap, not a functional defect.

## 9. Progress-component result

`EstablishmentProgress.tsx` is presentation-only: takes `current`/`total` as plain props, renders a single `<p role="status">` with a translated "Step X of Y" string. No persisted step model, no localStorage, no URL/query-param-driven lifecycle semantics, no resurrection of the retired wizard. Wiring confirmed by `grep`: `NewBusinessPage.tsx` passes `current={step === "identity" ? 1 : 2}` (driven by its own pre-existing local `step` state, not new persisted state) for EST-01/EST-02; `EstablishmentReviewPage.tsx` passes `current={3}` in all three of its render branches for EST-03. Terms/Team remain absent from the establishment nav (confirmed no new nav entries added; header comment in `EstablishmentReviewPage.tsx` explicitly documents their exclusion, unchanged from the original Package A implementation). Mobile/desktop rendering reviewed by code inspection only — the component is a single `<p>` with Tailwind utility classes and no responsive-breakpoint-specific logic, so no separate mobile/desktop code paths exist to diverge; a live emulator session with a signed-in user was not run for this specific visual check (all other validation, including the real Firebase Emulator Suite, functions/web unit suites, and Playwright, was run live — see §13).

## 10. Test-quality result (mutation-testing evidence)

All 5 required mutations were performed in the isolated worktree, confirmed RED, then reverted via `git checkout --` with `git status --short`/`git diff <PR-head> --stat` confirming a byte-for-byte clean tree after each revert and at the end of the full sequence.

**Mutation 1 — omit `currencyCode` from the DTO** (`businessReadService.ts`): typecheck failed (`TS2741: Property 'currencyCode' is missing`); running the emulator test file directly against a local Firestore emulator also failed 3 tests (#6, #7, #9) with `AssertionError: expected undefined to be 'USD'` etc. Reverted; `git status --short` empty.

**Mutation 2 — omit `timezone` from the DTO**: ran directly against a local Firestore emulator (`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 pnpm vitest run --config vitest.emulator.config.ts src/domains/business/services/businessReadService.emulator.test.ts`) — 3 tests failed (#6, #7, #9) with `expected undefined to be 'America/Los_Angeles'`. Reverted; clean.

**Mutation 3 — remove country/address rendering** (`EstablishmentReviewPage.tsx`): 3 tests failed ("renders the country...", "renders the branch address...", "handles a missing address gracefully..."). Reverted; clean.

**Mutation 4 — remove `EstablishmentProgress` wiring from `NewBusinessPage.tsx`**: 2 tests failed ("shows a Step 1 of 3...", "shows a Step 2 of 3..."). Reverted; clean.

**Mutation 5 — wrong step number on EST-03** (changed the default-view `<EstablishmentProgress current={3} .../>` to `current={2}`): 1 test failed ("shows a Step 3 of 3 progress indicator"). Note: an initial attempt using a `replace_all` edit only matched the two indented occurrences inside the `editing==="identity"`/`editing==="location"` branches (different leading-whitespace than the default-view line) and did not mutate the actual default-view line, producing a false green; this was caught by inspecting the file after the edit, corrected to target the exact line, and re-run to confirm true RED. Reverted; clean.

All reverts independently confirmed via `git diff 665aced4612d3b0a87e50655716beca71bdf7009 --stat` returning empty at the end of the mutation-testing phase.

Additionally reviewed the new `businessReadService.emulator.test.ts` tests (#6-#9) for non-vacuousness beyond the required mutations: test #7 seeds two distinct Businesses with different currency/timezone values and asserts no cross-contamination; test #8 asserts a non-owner is denied with `RESOURCE_NOT_FOUND` (enumeration resistance preserved); test #9 uses `toMatchObject` to assert every pre-existing field is still present alongside the two new ones. These are genuine regression/authorization tests, not placeholders.

## 11. Findings and fixes

No F1/F2/F3/F4 findings required a code fix. One minor F1 (editorial/test-coverage) observation, not fixed (does not rise to "clearly owned, evidence-driven, bounded" — it would mean adding a new French-locale-rendering test, a scope decision better left to a future pass, not something to silently expand into during a review):

- **F1-obs-1:** `EstablishmentReviewPage.test.tsx` has no test asserting FR-locale strings render for the new Operating Details/country/address sections (only an English-locale render is tested, plus a separate "language switcher is present" test). Independently verified `Intl.DisplayNames` works correctly for `fr` and that `fr.ts`/`en.ts` are structurally parallel, so this is a coverage gap, not a functional defect. Not blocking.

No F2 (implementation quality), F3 (architecture/governance), or F4 (security/integrity) findings.

## 12. Remaining material findings

None. Nothing blocks merge.

## 13. Full validation (fresh, live)

All commands run fresh in the isolated worktree on the exact reviewed head (`665aced4612d3b0a87e50655716beca71bdf7009`):

| Check | Result |
|---|---|
| Focused correction tests (`EstablishmentReviewPage.test.tsx`, `EstablishmentProgress.test.tsx`, `businessContextCallable.test.ts`) | 16/16 pass |
| `functions` unit tests (`pnpm --filter functions test`) | 1563/1563 pass (143 files) |
| `web` unit tests (`pnpm --filter web test`) | 539/539 pass (85 files) |
| Firebase Emulator Suite (`pnpm run emulators:validate`, real `firebase emulators:exec`) | Final run, on confirmed-clean tree: 688/690 pass, 2 pre-existing skips (52/52 files). See flake note below for an earlier run's transient unrelated failure. |
| Playwright (`pnpm run test:e2e`) | 1/1 pass |
| Typecheck (`pnpm -r run typecheck`) | Clean, both workspaces |
| Lint (`pnpm run lint`) | 0 errors; 1 pre-existing warning in `BusinessApiContext.tsx` (react-refresh/only-export-components), last touched in PR #154, zero diff in this PR — unrelated |
| Format check (`pnpm run format:check`) | Clean |
| Production build (`pnpm run build`) | Clean (both `functions` and `apps/web`; pre-existing bundle-size informational warning, unrelated to this diff) |
| Secret scan | No dedicated tool in this environment; manual `grep -iE` over the full diff for API-key/PEM/secret/password/token patterns — no matches outside the implementation report's own prose describing its scan |

**Flake note:** the first fresh full-suite `emulators:validate` run (after mutation-testing was complete and the tree confirmed clean) showed 1 failure: `knowledgeTranslationRepository.emulator.test.ts` > "two concurrent creates for the same (entityType, entityId, languageCode) tuple: exactly one succeeds, the other fails closed" — a timing-sensitive concurrency test in the unrelated `commerceKnowledge` domain, last touched in PR #146, zero diff in this PR. Re-ran the full suite a second time on the identical clean tree: 688/690 passed, 52/52 files, confirming the failure was a transient timing flake under this environment's load, not a regression introduced by this correction.

## 14. Files modified during review

None persisted — all mutation-testing edits were reverted via `git checkout --` before proceeding, confirmed via `git status --short` (empty) and `git diff 665aced4612d3b0a87e50655716beca71bdf7009 --stat` (empty) at the end of the review. This report file itself and the `IMPLEMENTATION_CHANGES.md` closure-sync entry are the only new/modified files, added in the closure-sync PR per repo convention (see §19).

## 15. Code diff summary (PR #175, `72b6c6b`..`665aced4`)

20 files changed, 917 insertions(+), 11 deletions(-):
- `functions/src/domains/business/services/businessReadService.ts` (+11/-1, additive DTO fields) + new `.emulator.test.ts` (+127, 4 new tests: #6/#7/#8-style/#9)
- `apps/web/src/business/api/businessContext.ts` (+2, mirrored type fields)
- `apps/web/src/business/onboarding/establishment/EstablishmentReviewPage.tsx` (+74/-11 net, country/address/Operating-Details rendering) + `.test.tsx` (+69, 6 new tests)
- `apps/web/src/business/onboarding/establishment/EstablishmentProgress.tsx` (new, +22) + `.test.tsx` (new, +27, 4 tests)
- `apps/web/src/business/onboarding/NewBusinessPage.tsx` (+2, wiring) + `.test.tsx` (+13, 2 tests)
- `apps/web/src/i18n/locales/{en,fr}.ts` (+9 each, fully parallel)
- 6 pre-existing test fixture files updated for the additive `BusinessContext` type (+2 lines each: `businessContextCallable.test.ts`, `DashboardPlaceholder.test.tsx`, `BusinessWizardPage.test.tsx`, `SubmittedStatusPage.test.tsx`, `completeness.test.ts`, `TeamStep.test.tsx`)
- Implementation report (+493) and `IMPLEMENTATION_CHANGES.md` entry (+54)

No scope creep beyond the 3 stated correction items. No dependency, lockfile, `firestore.rules`, `storage.rules`, or `firebase.json` changes (confirmed via `git diff` returning empty for all of these).

## 16. Commands executed (representative)

```
git fetch origin; gh pr view 175 --json ...
git worktree add <scratchpad>/pr175-review 665aced4612d3b0a87e50655716beca71bdf7009
git merge-base --is-ancestor 84995e6... HEAD ; git merge-base --is-ancestor 72b6c6b... HEAD
git diff 72b6c6b 665aced4612d3b0a87e50655716beca71bdf7009 [--stat] -- <various paths>
pnpm install --frozen-lockfile
pnpm vitest run <focused test files>
pnpm --filter functions test
pnpm --filter web test
pnpm -r run typecheck
pnpm run lint
pnpm run format:check
pnpm run build
pnpm run emulators:validate   (real firebase emulators:exec, run twice)
firebase emulators:start --only firestore   (for fast per-mutation emulator test runs)
pnpm run test:e2e   (Playwright)
[5x] Edit <file> ; pnpm vitest run <test> ; confirm RED ; git checkout -- <file> ; git status --short
node -e '... Intl.DisplayNames checks ...'
grep -rln "DASH-0" / "ACT-01" (Package B check)
gh pr ready 175 ; gh pr merge 175 --merge
gh run view <post-merge CI run>
```

## 17. Dependencies/config/Firebase/Rules changes

None. `firestore.rules`, `storage.rules`, `firebase.json`, `package.json` (all workspaces), and `pnpm-lock.yaml` all have zero diff between the PR base and head.

## 18. Merge SHA

`cb7606edb14cfdc205d7745bc4e9ff7307db6d48` (standard `--merge` commit, per repo convention — see PR #173/#174 precedent).

## 19. Closure-sync SHA

See the closure-sync PR opened immediately after this report was written (this report and the `IMPLEMENTATION_CHANGES.md` update ship together in that PR, per the PR #171/#174 convention). SHA recorded once merged.

## 20. Post-merge CI

Verified `origin/main` fast-forwarded to `cb7606edb14cfdc205d7745bc4e9ff7307db6d48` after merge; post-merge CI run triggered on that SHA (see the live check via `gh run view`).

## 21. origin/main final SHA

`cb7606edb14cfdc205d7745bc4e9ff7307db6d48` at the time of PR #175's merge (before the closure-sync PR).

## 22. Package A status

Complete/corrected. This correction closes the 3 bounded gaps found by the prior independent review of Package A (PR #173).

## 23. Package B status

Not started. Confirmed via `grep` for `DASH-0`/`ACT-01` markers across `apps/` and `docs/05-implementation` — no hits outside the historical review report's own reference text. No Dashboard component directories beyond the pre-existing `DashboardPlaceholder`/`BusinessDashboardBoundaryPage` (both predate this PR, unchanged).

## 24. ENG-P3-002 status

Remains Open.

## 25. Capability 3 status

Remains Open.

## 26. Risks

Low. This is a narrowly-scoped, purely additive read-contract extension plus presentation-only UI changes, fully covered by new tests whose failure-mode was independently confirmed via mutation testing. The only residual item is the minor FR-locale test-coverage gap noted in §11, which is cosmetic and does not affect correctness (verified functionally via direct `Intl.DisplayNames` checks).

## 27. Rollback

Standard `git revert cb7606edb14cfdc205d7745bc4e9ff7307db6d48` on `main` would cleanly back out this correction — it touches no schema, no Firestore rules, no config, and is purely additive at the DTO level, so a revert carries no data-migration risk.

## 28. Persistent review-report path

`docs/05-implementation/reports/eng-p3-002-ui-imp-a-corr-001-review-report-2026-08-26.md` (this file), committed via the closure-sync PR.

## 29. Exact next Founder action

None required to unblock further engineering work — Package A (including this correction) is complete and merged. The next Founder action is a deliberate go/no-go decision on **starting Package B (Dashboard)**, which requires fresh Founder authorization per the standing scope boundary; no engineering work on Package B has been started or should be inferred as approved by this correction's merge.

---

**ENG-P3-002-UI PACKAGE A CORRECTION MERGED AND CLOSED — PACKAGE B AWAITS FRESH FOUNDER AUTHORIZATION**
