# ENG-P3-002-CORR-LANGSWITCH-001-REVIEW — Independent Review, Merge & Closure Sync

**Date:** 2026-08-24
**Task type:** Independent code review of PR #170, merge, bounded closure sync. No deployment
performed.

## 1. Entry PR/head

PR [#170](https://github.com/Fkenogo/11THONUS/pull/170), reported/confirmed head
`e2df04ea1f938683dfabb661c9005f09d5e9b4ef` — verified independently via `gh pr view 170
--json headRefOid` before any review work began (matched the report's own claim; not trusted on
the report's word alone). Base `main`, mergeable at review time.

## 2. Final reviewed head

`e2df04ea1f938683dfabb661c9005f09d5e9b4ef` — unchanged from entry. **No fix was required**, so no
new commit was pushed to the PR branch before merge.

## 3. Localisation architecture result

Independently reconstructed from source (not from the implementation report): a single,
centrally-initialized `i18next` instance (`apps/web/src/i18n/config.ts`, side-effect import,
synchronous EN/FR resource bundling, `LanguageDetector` for unauthenticated persistence via
localStorage). `LanguageSwitcher.tsx` reads/writes this instance directly through
`i18n.changeLanguage()` and is exported from the public `i18n` barrel — confirmed unmodified by
this PR (`git diff origin/main...e2df04e -- apps/web/src/i18n/` = 0 lines). **Result: CONFIRMED as
described.**

## 4. Placement-coverage result

Confirmed by direct diff inspection (`git diff origin/main...e2df04e`, not the report's prose):

- `NewBusinessPage.tsx` (`/business/new`): `<LanguageSwitcher />` added as the first child of
  `<main>`, before the `<h1>`. **Covers `/business/new`.**
- `OnboardingWizard.tsx`: `<LanguageSwitcher />` added as the first child of `<main>`, before the
  step-navigation `<nav>` and above the `{step === "..." && <Step .../>}` conditional block that
  renders all five steps (classification/branch/terms/team/review) — placed outside that
  conditional, so it renders identically regardless of which step is active. **Covers all five
  in-wizard steps genuinely, verified by reading the full unmodified render tree, not assumed from
  the diff alone.**
- `SubmittedStatusPage.tsx`: `<LanguageSwitcher />` added as the first child of `<main>`, before
  the submitted-status heading. **Covers the submitted/pending status page.**

**One disclosed, non-blocking gap independently found (not previously flagged in the PR):**
`OnboardingWizard.tsx`'s own early-return integrity-error branch (`if (context.branch === null)`)
and `BusinessWizardPage.tsx`'s `pending`/`error`/`lifecycle.notAvailable` states (all pre-existing,
untouched by this PR) do not carry a language switcher. These are degraded/edge states outside the
normal reachable onboarding journey the Founder QA finding actually described (§7's task scope was
explicitly "the Business onboarding journey," not every error branch) — **not required by the
correction's own stated scope, and not a regression**, since these states never had a switcher and
were never claimed to. Recorded as an observation, not a blocking finding.

## 5. EN→FR result

**PASS, independently verified by executing the tests against the actual code** (not by reading
assertions alone): clicking "Français" changes `NewBusinessPage`'s title to "Parlez-nous de votre
entreprise" and the "Business name" field's label to "Nom de l'entreprise"; `OnboardingWizard`'s
"Terms" step button becomes "Conditions"; `SubmittedStatusPage` re-renders with an "English" button
replacing "Français".

## 6. FR→EN result

**PASS**, same method — switching back restores every string exactly, re-verified by test
execution.

## 7. Route preservation result

**PASS, confirmed structurally, not merely observationally.** `LanguageSwitcher`'s only side effect
is `i18n.changeLanguage()` — no `useNavigate`, no route param, no React Router API is touched
anywhere in `LanguageSwitcher.tsx` or `config.ts`. It is architecturally impossible for a language
switch to trigger navigation.

## 8. Wizard-step preservation result

**PASS.** `OnboardingWizard`'s `step` is local `useState`, entirely independent of `i18n.language`.
Test execution confirms `aria-current="step"` stays on the (relabelled) Terms button through both
switch directions. Independently reproduced (§11 below) that this assertion is load-bearing, not
vacuous.

## 9. Business/form-state preservation result

**PASS, confirmed structurally.** `useBusinessContextQuery`'s query key
(`businessQueryKeys.context(businessId)`) is not parameterized by language — a language switch
cannot trigger a refetch or cache-key change for the Business context. (Note: `useBusinessCategoriesQuery(i18n.language)`
*is* language-keyed by design — that's the desired behavior of re-fetching category *labels* in
the new language, unrelated to and not conflicting with Business-context stability.) Form field
state (`NewBusinessPage`'s local `useState`s) is untouched by any `languageChanged` handler
anywhere in this diff — confirmed by test execution: "Acme Salon" survives both switch directions
under both the English and French field labels.

## 10. Sign-in regression result

**PASS.** `apps/web/src/dev/signInPreview/SignInPreviewPage.tsx` — 0 lines changed
(`git diff origin/main...e2df04e -- apps/web/src/dev/signInPreview/`). Full web suite (509/509)
includes the pre-existing sign-in-preview and `i18n.test.tsx` coverage, all passing unmodified.

## 11. Test-quality result

**Independently proven non-vacuous, not assumed.** Reverted all three production changes
(`NewBusinessPage.tsx`, `OnboardingWizard.tsx`, `SubmittedStatusPage.tsx`) to their pre-PR
`origin/main` content in a scratch state, leaving the new tests untouched, and re-ran exactly the
three affected test files:

```
Test Files  3 failed (3)
     Tests  3 failed | 8 passed (11)
```

All three failures were exactly the three new language-accessibility tests (each failing on
`screen.getByRole("button", { name: "Français" })` — element not found); all eight pre-existing
tests in those same files continued to pass, confirming the new tests fail *specifically* on the
removed feature, not on unrelated breakage. Working tree then restored and confirmed
byte-identical to the reviewed commit via `git diff HEAD` (0 lines) before `git reset --hard HEAD`.
This directly satisfies the review's "deliberately remove one placement and confirm the test
fails, then restore exactly" requirement.

## 12. Findings/fixes

None requiring a fix. One non-blocking observation recorded (§4 — edge/error states outside the
onboarding journey's normal reachable path do not carry the switcher; consistent with the
correction's own disclosed scope, not a regression).

## 13. Remaining findings

None blocking. The §4 observation remains open only as a documentation note, not an action item —
if the Founder wants those edge states covered too, that would be its own separately-scoped
follow-up, not implied by this correction's authorization.

## 14. Full validation

Re-run fresh, independently, from the reviewed head (not reused from the implementation report):

- Web unit tests: **509/509 passed** (79 files).
- Functions unit tests: **1563/1563 passed** (143 files) — byte-identical to `origin/main`
  pre-PR, confirming zero backend impact.
- Typecheck (both packages): clean.
- Lint (`eslint .`, repo-wide): 0 errors, 1 pre-existing unrelated warning
  (`BusinessApiContext.tsx` fast-refresh notice, present before this PR).
- Format check (`prettier --check .`): clean.
- Ordinary `pnpm --filter web run build`: clean; Founder-QA-only markers (route, App Check site
  key) confirmed **absent** (0 matches) — the ordinary build has not acquired Founder-QA-only
  behaviour.
- `founder-qa-preview` build: clean; `supportedLanguages` (prior correction) and `Français` string
  both present in the built bundle.
- Secret scan (`BEGIN … PRIVATE KEY`, `service_account`, `siteSecret`) on both build outputs:
  **0 matches** in either.

## 15. Files modified (by PR #170, confirmed via diff, not report prose)

`apps/web/src/business/onboarding/NewBusinessPage.tsx`,
`apps/web/src/business/onboarding/NewBusinessPage.test.tsx`,
`apps/web/src/business/onboarding/OnboardingWizard.tsx`,
`apps/web/src/business/onboarding/OnboardingWizard.test.tsx`,
`apps/web/src/business/onboarding/SubmittedStatusPage.tsx`,
`apps/web/src/business/onboarding/SubmittedStatusPage.test.tsx` (new file),
`docs/05-implementation/reports/ENG-P3-002-CORR-LANGSWITCH-001-business-onboarding-language-accessibility-correction-2026-08-24.md`
(new), `docs/changes/IMPLEMENTATION_CHANGES.md`. This review adds this report and one further
`IMPLEMENTATION_CHANGES.md`/checklist entry — no other file.

## 16. Code diff summary

8 files changed, 467 insertions(+), 5 deletions(-) in PR #170 (confirmed via
`git diff origin/main...e2df04e --stat`). Non-test source diff: three files, 2 lines each (one
import addition, one `<LanguageSwitcher />` JSX addition) — 6 lines total production-code change.
No existing line altered, no signature changed, no component renamed/moved.

## 17. Dependencies/config changes

None.

## 18. Firebase/deployment changes — expected none

**Confirmed none.** `git diff origin/main...e2df04e -- functions/ firebase.json firestore.rules
storage.rules` = 0 lines. No Firebase CLI/MCP command was issued by either the implementation task
or this review task. No deployment performed.

## 19. Merge SHA

`2a2af4a2575e4dec0ab987e0cdd72507f3283543` (PR #170, `gh pr merge 170 --merge --delete-branch`).
Post-merge, the remote head branch `fix/eng-p3-002-corr-langswitch-001` was not auto-deleted by
`gh` (the same recurring local-checkout side effect disclosed in every prior task in this
workstream) — deleted manually via `git push origin --delete`.

## 20. Closure-sync SHA

This document's own commit, on branch `docs/eng-p3-002-corr-langswitch-001-review-closure-sync`
(recorded in the accompanying `IMPLEMENTATION_CHANGES.md` entry and PR).

## 21. Post-merge CI

**Pass** — `Build, Lint, Test, Emulator Validation` on the merge commit `2a2af4a`, run
`32744178514`, completed `success` (5m51s).

## 22. `origin/main` final SHA

`2a2af4a2575e4dec0ab987e0cdd72507f3283543` at the point this closure-sync task began (will advance
by one further merge once this closure-sync PR lands).

## 23. `ENG-P3-002C` status

**Unchanged: hosted engineering/integration validated; Founder QA pending hosted language-switch
revalidation.** Merging this correction does not itself prove the fix works in the real hosted DEV
preview — a separate, fresh-authorized deployment/revalidation task is required before this can
advance further, exactly as both the implementation task and this review's own instructions
specify.

## 24. `ENG-P3-002` status

**Unchanged: Open — blocked on Founder QA completion and `DEC-LEGAL-002`.** Not closed by this
task. The mobile-navigation Founder FAIL finding remains entirely unaddressed and out of this
correction's scope.

## 25. Capability 3 status

**Unchanged: Open — not closed.**

## 26. Risks

None introduced by the merge. The one disclosed observation (§4/§12) is informational, not a risk
to hosted revalidation — the switcher is genuinely reachable on every page a real onboarding
journey would traverse.

## 27. Rollback

`git revert 2a2af4a` on `main` — the merge commit is additive/corrective only (6 lines of
production code across 3 files, plus tests and docs), no schema/data/deployment impact.

## 28. Persistent report path

This document:
`docs/05-implementation/reports/ENG-P3-002-CORR-LANGSWITCH-001-REVIEW-independent-review-merge-closure-2026-08-24.md`

## 29. Exact next Founder action

Authorize a separate, bounded deployment/revalidation task to redeploy the `eng-p3-002c-founder-qa`
Hosting preview from `main` at `2a2af4a` (or later) and confirm, in the real hosted DEV
environment, that the language switcher is reachable and functions correctly from
`/business/new`, every in-wizard step, and the submitted-status page. Only after that hosted
confirmation should Founder QA checklist item 16 (French) be reconsidered for PASS. The
mobile-navigation FAIL finding and the invitation-identity finding remain separate, still-open
items requiring their own future authorization.

## Final gate

**ENG-P3-002-CORR-LANGSWITCH-001 MERGED AND CLOSED — HOSTED LANGUAGE REVALIDATION AWAITS FRESH
AUTHORIZATION**
