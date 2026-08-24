# ENG-P3-002-CORR-LANGSWITCH-001 — Business Onboarding Language Accessibility Correction

**Date:** 2026-08-24
**Task type:** Bounded source correction (TDD). No deployment performed by this task.

## 1. Entry repository state

- **Branch (at entry):** detached HEAD. **HEAD:** `8bbdaa942a499c68cf2edddd895e8aa5e198bbc0`.
  **origin/main:** `8bbdaa942a499c68cf2edddd895e8aa5e198bbc0`. **Ahead/behind:** `0/0`.
- **Worktree:** fresh linked worktree created from `origin/main`
  (`/private/tmp/claude-501/-Users-theo-11THONUS/d7d0a4fc-3331-4893-a70a-6b83d9d18b88/scratchpad/eng-p3-002-corr-langswitch-001`),
  confirmed clean at entry.
- **Incomplete Git operations/locks:** none (`find .git -iname "*.lock"` empty).
- **Founder QA evidence-recording work present on baseline:** confirmed — the
  `ENG-P3-002C-FOUNDER-QA-001` evidence/classification report and checklist update exist as
  uncommitted working-tree state in the main checkout at this same HEAD (that task's own commit
  step was left to the Founder; this correction's baseline is the same `origin/main` those
  findings were recorded against).
- **`supportedLanguages` correction ancestry:** confirmed present (PR #168/#169, part of
  `origin/main`).
- **CI state:** green — `gh run list --branch main` shows the three most recent runs on `main`
  (`8bbdaa9`, `096faed`, and the preceding merge) all `completed`/`success`.

## 2. Governing sources inspected

- `docs/05-implementation/reports/ENG-P3-002C-FOUNDER-QA-001-founder-qa-evidence-and-classification-2026-08-24.md`
  §4 — the confirmed finding this task corrects, and its exact scope boundary (language
  accessibility only; explicitly not mobile navigation, not visual refinement, not the
  invitation-identity gap).
- `apps/web/src/i18n/config.ts`, `LanguageSwitcher.tsx`, `index.ts`, `preferredLanguage.ts`,
  `i18n.test.tsx` — the existing centralized localisation architecture (I18N-001).
- `apps/web/src/App.tsx` — Business onboarding route structure.
- `apps/web/src/business/onboarding/NewBusinessPage.tsx`, `OnboardingWizard.tsx`,
  `BusinessWizardPage.tsx`, `SubmittedStatusPage.tsx`, `BusinessResolverPage.tsx` — the full set of
  Business onboarding page-level components.
- `apps/web/src/i18n/locales/en.ts` / `fr.ts` — translation resource parity (already 1:1 per
  existing `i18n.test.tsx` coverage, unmodified by this task).

## 3. Existing localisation architecture

A single, centralized `i18next` instance (`apps/web/src/i18n/config.ts`) is initialized once via a
module side-effect import, with EN/FR resources bundled synchronously (no lazy fetch, no
Suspense). Persistence for unauthenticated users is the standard `i18next-browser-languagedetector`
(localStorage-cached, `navigator` fallback); authenticated-user `preferredLanguage` is applied
separately through `applyPreferredLanguage`. `LanguageSwitcher.tsx` is a self-contained, prop-less
component — it reads/writes the global `i18n` instance directly via `i18n.changeLanguage()`, owns
no route, auth, or business state, and is already exported from the public `i18n` barrel
(`export { LanguageSwitcher } from "./LanguageSwitcher"`), confirming it was designed to be reused
anywhere, not built as a sign-in-only component. Its only existing consumer prior to this task was
`SignInPreviewPage.tsx`.

## 4. Root cause reconfirmation

Reconfirmed by direct inspection (matching `ENG-P3-002C-FOUNDER-QA-001`'s finding exactly): zero
references to `LanguageSwitcher` existed anywhere under `apps/web/src/business/` before this task.
`apps/web/src/App.tsx` mounts `/business`, `/business/new`, and `/business/:businessId` as three
independent leaf routes with **no shared layout/shell** — no `Route`/`Outlet` nesting exists at
all in this router. This rules out the "preferred" placement (a single shared shell) as
inapplicable, not merely undesirable: there is nothing to place the switcher into without first
inventing new routing architecture, which is out of this task's scope ("maintain the current
architecture," "do not redesign Business onboarding").

## 5. Fix strategy

Reuse `LanguageSwitcher` unmodified. Since no shared shell exists, place it at the smallest set of
existing entry points that together cover the entire reachable onboarding journey, rather than
inventing a new layout:

1. **`NewBusinessPage.tsx`** (`/business/new`) — the zero-Business entry point.
2. **`OnboardingWizard.tsx`** — already the single wrapper for all five in-wizard steps
   (Classification/Branch/Terms/Team/Review) once a Business exists; adding it here once covers
   the entire step-navigation journey without duplicating it per-step.
3. **`SubmittedStatusPage.tsx`** — the post-submission landing state, same page family, included
   for completeness so no reachable onboarding-journey page is left without the control.

`BusinessResolverPage.tsx` (`/business`) was deliberately **not** touched — it is a transient
resolver that auto-navigates away in the 0/1-Business case (the only case reachable in this
codebase's current state) and never itself renders sustained onboarding content a user would need
to read in a chosen language.

No backend contract change was required or made — this is a purely frontend-composition
correction; `functions/` is untouched (confirmed unchanged in §15 validation: functions suite
1563/1563, byte-identical to the pre-correction baseline).

## 6. Exact `LanguageSwitcher` placement and rationale

- `NewBusinessPage.tsx`: rendered as the first child of the page's `<main>`, immediately before the
  `<h1>` title — visible before any form interaction, consistent with its placement on
  `SignInPreviewPage.tsx` (first child, above the heading).
- `OnboardingWizard.tsx`: rendered as the first child of the wizard's `<main>`, immediately before
  the step-navigation `<nav>` — reachable regardless of which step is currently open, since it sits
  outside the per-step conditional rendering.
- `SubmittedStatusPage.tsx`: rendered as the first child of the page's `<main>`, before the
  submitted-status heading.

In all three cases the switcher is a top-level, always-rendered sibling — never conditionally
rendered, never nested inside a step or form field, so it cannot be hidden by any onboarding state.

## 7. RED evidence

Three tests were written first and confirmed failing for the correct reason (missing control, not
a typo/setup error) before any production code changed:

- `NewBusinessPage.test.tsx` — `await user.click(screen.getByRole("button", { name: "Français" }))`
  threw `TestingLibraryElementError: Unable to find an accessible element with the role "button"
  and name "Français"` — the DOM dump in the failure confirms the rendered page contained the form
  fields and Continue button, but no language control.
- `OnboardingWizard.test.tsx` — identical failure shape, same missing-element cause, DOM dump shows
  the step nav and terms-step content rendering correctly with no switcher present.
- `SubmittedStatusPage.test.tsx` — same failure shape (this was also this file's first-ever test
  file, so the baseline "shows the submitted title" test was written and confirmed passing first,
  isolating the RED failure to the new language-accessibility test specifically).

## 8. GREEN evidence

After adding the two-line change (import + `<LanguageSwitcher />`) to each of the three
components:

```
NewBusinessPage.test.tsx:      4 passed (4)
OnboardingWizard.test.tsx:     5 passed (5)
SubmittedStatusPage.test.tsx:  2 passed (2)
```

No test assertion was weakened to reach GREEN — the same assertions written during RED passed
unmodified.

## 9. EN → FR result

**PASS.** In each of the three components, clicking the "Français" button switches the visible
onboarding copy to French: `NewBusinessPage`'s title changes from "Tell us about your business" to
"Parlez-nous de votre entreprise" (and the "Business name" field's accessible label becomes "Nom de
l'entreprise"); `OnboardingWizard`'s "Terms" step-nav button becomes "Conditions" (still marked
`aria-current="step"`); `SubmittedStatusPage`'s switcher itself re-renders with an "English" button
replacing "Français" (autonym labels are stable regardless of active language, per
`LanguageSwitcher`'s own design — the button that changes is which one carries `aria-pressed`).

## 10. FR → EN result

**PASS.** Clicking "English" after switching to French restores every English string exactly
(re-verified in all three tests) — `NewBusinessPage`'s title/label revert, `OnboardingWizard`'s
step-nav button reverts to "Terms" with `aria-current="step"` preserved.

## 11. Route preservation result

**PASS.** No test asserted or observed any route/navigation change caused by the language switch —
`OnboardingWizard`'s test explicitly renders with the wizard already opened on the "terms" step
(`primaryCategoryId: "cat-1"` forces `firstIncompleteStep` to resolve to `"terms"`) and confirms
`aria-current="step"` remains on the (now-relabelled) Terms button throughout both switches — the
step never changed. This is structurally guaranteed, not merely observed: `i18n.changeLanguage()`
touches only the global i18next instance, never React Router state or the wizard's local `step`
`useState`.

## 12. Business/onboarding context preservation result

**PASS.** `NewBusinessPage`'s test types "Acme Salon" into the Business name field, switches to
French, and asserts the French-labelled field (`Nom de l'entreprise`) still holds the value "Acme
Salon" — then switches back to English and re-confirms it under the English label. Entered form
state (React local `useState`) is untouched by a language switch, by construction — no component
in this diff resets or re-keys any state on `i18n`'s `languageChanged` event.

## 13. Locale persistence result

**Not independently re-tested in this task** — already covered by the existing, unmodified
`i18n.test.tsx` ("persists the chosen language to localStorage") and structurally unaffected by
this change, since it exercises the same `i18n.changeLanguage()` call path the pre-existing
`LanguageSwitcher` always used. No new persistence mechanism was introduced.

## 14. Sign-in localisation regression result

**PASS — no regression.** `SignInPreviewPage.tsx` was not modified by this task (confirmed by
`git diff --stat`, absent from the file list). The full web suite (509/509, including the
pre-existing `i18n.test.tsx` and any sign-in-preview-specific tests) passed with zero failures.

## 15. Full validation results

- Web unit tests: **509/509 passed** (79 files — up from 505/78 at entry; the four net-new tests
  are the ones added by this task).
- Functions unit tests: **1563/1563 passed** (143 files, byte-identical to entry — `functions/` is
  untouched).
- Typecheck (both packages): clean.
- Lint (repo-wide `eslint .`): 0 errors, 1 pre-existing unrelated warning
  (`BusinessApiContext.tsx` fast-refresh notice — present before this task, unrelated to this diff).
- Format check (`prettier --check .`): clean (one formatting issue in the new
  `OnboardingWizard.test.tsx` content was caught and fixed with `prettier --write` before this
  final run).
- Ordinary `pnpm --filter web run build`: clean — PWA artifacts (`sw.js`, `workbox-*.js`,
  `registerSW.js`, `manifest.webmanifest`) present as expected; the Founder-QA-only App Check site
  key and the `FounderQaPreviewSignInRoute`/`founder-qa-sign-in` markers are both **absent** (0
  matches) — the ordinary build has not acquired any Founder-QA-only behaviour from this change.
- `founder-qa-preview` build (`pnpm --filter web run build:founder-qa-preview`): clean —
  `supportedLanguages` (prior correction) and the language-switcher strings (`Français`) both
  present in the built bundle; secret scan (`BEGIN … PRIVATE KEY`, `service_account`,
  `siteSecret`) — 0 matches in either build.
- No Firebase/deployment command was issued by this task (Phase F compliance) — the
  `.env.founder-qa-preview.local` file used to run the build-content check was created and deleted
  within the disposable worktree only (gitignored throughout, confirmed via
  `git check-ignore -v`), never staged, never part of the commit.

## 16. Files modified

- `apps/web/src/business/onboarding/NewBusinessPage.tsx` (+2 lines: import, `<LanguageSwitcher />`)
- `apps/web/src/business/onboarding/NewBusinessPage.test.tsx` (+1 new test)
- `apps/web/src/business/onboarding/OnboardingWizard.tsx` (+2 lines: import, `<LanguageSwitcher />`)
- `apps/web/src/business/onboarding/OnboardingWizard.test.tsx` (+1 new test)
- `apps/web/src/business/onboarding/SubmittedStatusPage.tsx` (+2 lines: import, `<LanguageSwitcher />`)
- `apps/web/src/business/onboarding/SubmittedStatusPage.test.tsx` (new file, 2 tests — this
  component previously had no test file at all)
- This report and the `IMPLEMENTATION_CHANGES.md` entry (documentation only, committed alongside)

No file outside `apps/web/src/business/onboarding/` was touched. No file in `functions/`,
`firebase.json`, `firestore.rules`, `storage.rules`, or any Firebase-config path was touched.

## 17. Code diff summary

6 files changed, 66 insertions(+), 5 deletions(-) (test + source combined). The three non-test
source files each carry an identical, minimal two-line change: one import addition, one JSX line
addition (`<LanguageSwitcher />`) as the first child of the existing top-level `<main>`. No
existing line was otherwise modified, no prop signature changed, no component renamed or moved.

## 18. Commands executed

`git fetch origin`, `git rev-parse HEAD`/`origin/main`, `git rev-list --left-right --count`,
`git status --short`, `find .git -iname "*.lock"`, `gh run list --branch main`,
`git worktree add`, `pnpm install --frozen-lockfile`, targeted `vitest run` per file (RED and
GREEN passes), `pnpm --filter web run test`, `pnpm --filter functions run test`,
`pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `npx prettier --write` (one file),
`pnpm --filter web run build`, `pnpm --filter web run build:founder-qa-preview`, `grep`-based
build-content/secret scans, `git checkout -b`, `git add`, `git commit`, `git push`,
`gh pr create`.

## 19. Dependencies added

None.

## 20. Config changes

None. `apps/web/.env.founder-qa-preview.local` was created transiently in the worktree only, to
verify the `founder-qa-preview` build's content (§15) — gitignored, never staged, deleted before
commit.

## 21. Firebase/deployment/data changes

None. No Firebase CLI/MCP command was issued. No deployment performed, per this task's explicit
Phase F prohibition.

## 22. Out-of-scope findings confirmed untouched

- **Mobile onboarding navigation/layout:** `OnboardingWizard.tsx`'s step-nav `<nav>` markup/classes
  are unchanged except for the sibling `<LanguageSwitcher />` addition above it — no navigation
  redesign.
- **Overall visual refinement / Stitch:** no styling, layout, or design-system change anywhere in
  this diff.
- **Pending-invitation identity / transport DTO:** `TeamStep.tsx`, `staffLists.ts`, and
  `staffTransportReadService.ts` are untouched (absent from `git diff --stat`).
- **`ENG-HOSTING-CSP-COVERAGE-001`:** `firebase.json` untouched.
- **`DEC-LEGAL-002`:** no Terms-related file touched.
- **Unrelated Capability 3 work:** no file outside `apps/web/src/business/onboarding/` touched.

## 23. Risks

None introduced. The change is additive (a new always-visible control on three existing pages);
existing tests for those pages continue to pass unmodified, confirming no behavioural regression
to the form/wizard/status logic itself. The switcher's own correctness (persistence, autonym
labelling, region-code resolution, English-fallback) is inherited, unmodified, from the
already-tested `LanguageSwitcher`/`config.ts` — this task did not touch either file.

## 24. Rollback instructions

Trivial — `git revert` the merge commit once merged (three two-line diffs plus additive tests, no
schema/data/deployment impact), or simply do not merge.

## 25. `ENG-P3-002C` status

**Unchanged by this task alone: hosted engineering/integration validated; Founder QA pending.**
This correction addresses one of the two Founder QA FAIL findings but has **not yet been deployed
or re-validated in the hosted DEV environment** — per this task's explicit Phase F scope, no
deployment was performed. `ENG-P3-002C`'s status cannot be advanced past "Founder QA pending" until
a separately authorized deployment/revalidation task confirms this fix works in the real hosted
preview, exactly as this task's own instructions anticipate ("a separately authorized
deployment/revalidation task will follow after merge").

## 26. `ENG-P3-002` status

**Unchanged: Open — blocked on Founder QA completion and `DEC-LEGAL-002`.** Not closed by this
task. The mobile-navigation Founder FAIL finding remains entirely unaddressed (out of scope here).

## 27. Capability 3 status

**Unchanged: Open — not closed.**

## 28. PR number and exact head SHA

See the commit/PR created immediately after this report — recorded in the accompanying
`IMPLEMENTATION_CHANGES.md` entry and this task's final chat response (PR not yet opened at the
time this file was written in-worktree, filled in post-push).

## 29. CI result on exact head

Pending — to be confirmed after push, recorded in the final task response.

## 30. Exact next Founder action

Review and merge the PR (or request changes). After merge, authorize a separate, bounded
deployment/revalidation task to redeploy the `eng-p3-002c-founder-qa` Hosting preview from the
merged head and confirm, in the real hosted DEV environment, that: (a) the language switcher is
now visibly reachable from `/business/new`, the in-wizard steps, and the submitted-status page; and
(b) switching language there behaves as this task's tests prove locally. Only after that
hosted re-confirmation should checklist item 16 (French) be reconsidered for PASS. The
mobile-navigation FAIL finding and the invitation-identity finding remain open, separate items
requiring their own future authorization.

## 31. Markdown implementation report path

This document:
`docs/05-implementation/reports/ENG-P3-002-CORR-LANGSWITCH-001-business-onboarding-language-accessibility-correction-2026-08-24.md`

## Final gate

**ENG-P3-002-CORR-LANGSWITCH-001 IMPLEMENTED, TDD-VERIFIED, VALIDATION CLEAN — READY FOR FOUNDER
REVIEW; NOT DEPLOYED; ENG-P3-002C/ENG-P3-002/CAPABILITY 3 STATUS UNCHANGED, NOT CLOSED**
