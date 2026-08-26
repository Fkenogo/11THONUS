# `ENG-P3-002-UI-IMP-D` — Business Terms / Activation (ACT-01) Implementation Report (2026-08-26)

**Status:** Frontend structural implementation, TDD, full validation, draft PR opened. Not
self-merged. `ENG-P3-002` / Capability 3 remain Open — unchanged by this package.

## 1. Entry repository state

- `git fetch origin`: `origin/main` at `ff0390d` (Package C's closure-sync merge, PR #180).
- The session's primary checkout (`docs/eng-p3-002-ui-governance-chain-sync`, HEAD `99f840f`) was
  0 ahead / 19 behind `origin/main`. Per the entry-gate requirement, a fresh linked worktree
  (`/Users/theo/11THONUS-eng-p3-002-ui-imp-d`, branch `feat/eng-p3-002-ui-imp-d`) was created from
  `origin/main` and the primary checkout was not touched.
- No incomplete git operation present.
- The GitHub Actions runner anomaly reported after Package C's docs-only closure sync (PR #180)
  is treated as historical information only per this task's own instruction — not reopened, not
  investigated further, no history rewritten.

## 2. Package A/B/C ancestry and closure state

- `gh pr view 179`/`180`: both `MERGED` (`9d0a5e4`, `ff0390d`), confirmed via `git log --oneline
origin/main`.
- `gh run list --branch main`: PR #179's own post-merge CI run (`32982493234`) — `success`.
- No Package D–H worktree or branch existed anywhere in the repository prior to this task
  (`git worktree list` scanned, zero matches for `imp-d`/`imp-e`/`imp-f`/`imp-g`/`imp-h`).

## 3. Exact Package D scope reconstructed

Re-read `ENG-P3-002-UI-RECON-001` Part XV directly from source, verbatim:

> **Package D — Business Terms (ACT-01).** Objective: relocate Terms into a standalone
> Dashboard-reachable surface. Areas: new container wrapping the existing `TermsStep`
> presentational component. Depends on: Package B. Acceptance criteria: placeholder Terms text
> only, no invented legal content; Submit remains genuinely disabled per real `isReadyToSubmit`;
> "Effective Date" field either added (contingent backend change, its own small PR) or omitted
> from the shipped screen. Backend dependency: contingent, small (only if "Effective Date" is
> kept). Founder authorization boundary: frontend-only unless the Effective-Date field is wanted,
> in which case a separate, small backend PR is needed first.

Cross-referenced against `ENG-P3-002-UI-HANDOFF-001` Part V's ACT-01 brief, which bundles a wider
concept into the same screen (verbatim): *"required actions = Accept Terms (when available),
**Submit for Verification (when ready)**; backend dependency = `acceptBusinessTerms`,
**`submitBusinessForVerification`** (both existing)... blocked = the Submit action itself, disabled
per `isReadyToSubmit`... must remain disabled under the same conditions, not loosened."*
RECON-001's own acceptance criteria ("Submit remains genuinely disabled per real
`isReadyToSubmit`") only makes sense if Submit-for-Verification is part of this screen — confirming
Submit is in scope, not merely Terms acceptance alone.

- **Screen family:** ACT-01 (Activation/Compliance), single screen.
- **Routes:** `/business/:businessId/dashboard/terms` (already reserved by Package B's nav; no
  new route path).
- **Existing components/services reused:** `TermsStep` (presentational, unmodified behavior),
  `TermsStepContainer`'s pattern (an orphaned Package-002B-era container never mounted anywhere —
  superseded by this package's own Dashboard-scoped container, not reused verbatim since it wires
  a wizard `onContinue`, which does not apply here), `termsAvailability.ts`
  (`TERMS_READABLE_CONTENT_AVAILABLE`, unmodified), `completeness.ts`'s `isReadyToSubmit`
  (unmodified), `useAcceptBusinessTermsMutation`/`useSubmitBusinessForVerificationMutation`
  (unmodified), `SubmittedStatusPage`'s copy convention (`submitted.title`/`submitted.body`,
  reused, not the component itself — that page is a separate, non-Dashboard route boundary).
- **New components/routes:** `DashboardTermsPage.tsx` only — no new route path (the `terms` path
  already existed as a `DashboardComingSoon` placeholder).
- **Existing backend callables used, unchanged:** `acceptBusinessTerms`,
  `submitBusinessForVerification`.
- **Backend changes permitted:** none exercised — the Effective-Date field is omitted, per
  RECON-001's own explicit contingency, since no separate backend authorization for it was given
  in this task.
- **Data-contract dependencies:** `BusinessContext.termsAcceptance`, `BusinessContext.status`
  (unmodified read contract).
- **Explicit exclusions:** Terms document body/content, version/Effective-Date metadata, a "View
  Business Terms" link, Add-Location/Team/Profile content, any status/tier/verification badge
  beyond the real `BusinessStatus` values.
- **Stitch inventions ignored:** see §16.
- **Test obligations:** route integration, Dashboard-shell integration, all seven ACT-01 states
  RECON-001/HANDOFF-001 name (unavailable, acceptance-required, accepted, not-ready, ready,
  in-flight, submitted), EN/FR, responsive, accessibility, no direct Firestore, no Continue-button
  leak into the standalone context.
- **Dependencies on later packages:** none identified. Package D does not depend on Package
  E (copy correction — already satisfied, no "PROGRES"/merchant-account language introduced),
  F (Team), or G (Staff transport correction).

## 4. Dependency graph result

Package D's only stated dependency (Package B) was already `Complete`/merged. No unresolved
architecture or product ambiguity blocked implementation — proceeded.

## 5. Governing sources reviewed

`ENG-P3-002-UI-RECON-001` (Parts XV/XVI/XVII); `ENG-P3-002-UI-HANDOFF-001` Part V (ACT-01 brief)
and its embedded Founder-disposition addendum; `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` +
Founder-disposition file; Package A/A-correction/B/C implementation and review reports;
`termsAvailability.ts`'s own header (the `DEC-LEGAL-002`/content-authority rationale);
`completeness.ts`; `IMPLEMENTATION_CHANGES.md`.

## 6. Stitch assets inspected

`docs/07-product-design/stitch/v3-designs/business terms/` — `act_01_business_terms_action_required/code.html`,
`act_01_business_terms_accepted_state/code.html`, `act_01_business_terms_desktop/code.html` (full
HTML content read, not just filenames/screenshots).

## 7. Pre-change architecture analysis

Traced: `BusinessContext.termsAcceptance`/`.status` → `TermsStep` (presentational, already
correctly gates on `TERMS_READABLE_CONTENT_AVAILABLE`) → `useAcceptBusinessTermsMutation` →
`acceptBusinessTerms` callable (unmodified) → cache invalidation → re-fetch. Separately:
`completeness.ts`'s `isReadyToSubmit` → `useSubmitBusinessForVerificationMutation` →
`submitBusinessForVerification` callable (unmodified, `draft → pending_verification`) → cache
invalidation → re-fetch. Also read `BusinessWizardPage.tsx`/`BusinessDashboardBoundaryPage.tsx` to
confirm the Dashboard is never status-gated (FD-4) — `pending_verification` Businesses can reach
`/dashboard/terms` directly, so that state must be handled inside this screen, not only by the
separate pre-Dashboard `SubmittedStatusPage` boundary.

## 8. Implementation strategy

One new component (`DashboardTermsPage.tsx`) wrapping the existing, otherwise-unmodified
`TermsStep` for the acceptance flow, plus a Submit-for-Verification section gated on
`isReadyToSubmit`, plus a `pending_verification` branch replacing both with the existing submitted
copy. One small, additive, backward-compatible change to `TermsStep.tsx` itself: an optional
`hideContinue` prop (default `false`) so the wizard-only "Continue" footer can be omitted in this
standalone context — every existing caller/test omits the new prop and is therefore unaffected.

## 9. Existing components/contracts reused

`TermsStep`, `useAcceptBusinessTermsMutation`, `useSubmitBusinessForVerificationMutation`,
`isReadyToSubmit`, `TERMS_READABLE_CONTENT_AVAILABLE`, `MutationError`, `Button`,
`BusinessDashboardShell`/`BusinessDashboardRoutes` (unmodified except the one route wiring line),
`submitted.title`/`submitted.body`/`terms.*`/`actions.submit` i18n keys (all pre-existing, zero new
keys added).

## 10. New components/routes

`DashboardTermsPage.tsx` only. No new route path — `terms` already existed in the route table as a
placeholder.

## 11. Dashboard-shell integration

Mounted as a child route of the existing, unmodified `BusinessDashboardShell`/
`BusinessDashboardRoutes`, replacing the `DashboardComingSoon` placeholder at `terms`. No second
shell, no duplicated nav, no new Business context store, no new auth path.

## 12. Package D functional result

Renders the neutral Terms-unavailable state today (real governed state, `DEC-LEGAL-002` open);
renders the accepted state and a gated Submit-for-Verification action once/if Terms become
acceptable; renders the submitted/pending-verification state once `context.status` transitions,
replacing the Terms/Submit UI entirely.

## 13. Data-authority result

All state sourced from backend-authoritative `BusinessContext` — no frontend-owned substitute for
missing data. `isReadyToSubmit` recomputed from real context fields, never hardcoded.

## 14. Mutation/action result

`Accept` (only actionable once content is available, not reachable today — no regression, matches
`TermsStep`'s own already-tested behavior) and `Submit for Verification` (gated correctly, calls
the real unmodified callable, cache-invalidates on success, shows the mapped error on failure
without falsely advancing to the submitted state — proven by test).

## 15. Known cross-package finding treatment

- `Business.address` vs `BusinessBranch.address`: untouched, not referenced anywhere in this
  package's diff.
- `legalName`/`logoUrl`/`supportedLanguages` read-contract gap: untouched, unrelated to Terms.
- Business Code (FD-3 §24): not displayed on this screen at all — out of scope, no regression.
- Subscription Plan: absent from this screen, as required.
- `DEC-LEGAL-002`: still open; this package's entire behavior is correctly gated on it remaining
  open (`TERMS_READABLE_CONTENT_AVAILABLE = false`, unmodified).
- Staff/Team identity transport gap: unrelated, untouched.
- No dependency on any unresolved cross-package item was required to implement Package D — the
  Effective-Date omission is the one contingency RECON-001 itself anticipated, and it was resolved
  by omission (no backend PR authorized or attempted), not by absorbing a correction.

## 16. Stitch-invention audit

All three Business Terms v3 Stitch mockups were read in full. Ignored, not reproduced: a
multi-section placeholder legal document body ("[Terms content provided by 11thONUS will appear
here.]" ×5 sections); fabricated "Version 1.0" / "Effective 25 August 2026" metadata (no such field
exists on `Business`, and RECON-001 makes Effective Date contingent on a backend PR not authorized
here); a "View Business Terms" link (implies real readable content, contradicting the hard-pinned
`TERMS_READABLE_CONTENT_AVAILABLE = false`); "PROGRES" branding (this screen renders inside the
existing shell's own unmodified header, so it never appears); a real per-mockup avatar/logo image.
Verified absent from the implementation by grep and by test (`document.body.innerHTML` assertions
for URLs, "effective date", "version 1.0").

## 17–18. EN and FR result

No new i18n keys — 100% reuse of existing `terms.*`/`actions.submit`/`submitted.*` keys, already
translated in both `en.ts`/`fr.ts` from prior packages. Real-browser Playwright confirms EN → FR →
FR → EN preserves the current route (`/dashboard-harness/terms`) and Business identity.

## 19–21. Mobile, tablet, desktop result

Verified in a real browser (Chromium) at 375×812, 768×1024, and 1280×800: no horizontal overflow
at any breakpoint; Submit button visible with a real touch target measured in-browser; the shared
Dashboard shell (mobile menu / desktop sidebar) renders correctly around this screen, unmodified.

## 22. Accessibility result

`TermsStep`'s existing `role="status"`/`role="alert"` semantics and `Checkbox`/`Button` primitives
are reused unmodified. The new Submit section uses a plain, focusable native `<button>` with the
existing `MutationError` (`role="alert"`) pattern for failure feedback. No new keyboard-trap
surface introduced (no modal, no focus management beyond what the existing shell/primitives
already provide).

## 23–24. Authorization/tenant-isolation and direct-Firestore result

Unchanged — no backend file touched, both callables' authorization/tenant-isolation logic
untouched. `noDirectFirestore.test.ts` (the existing, dynamically-scanning Dashboard-directory
guard) automatically covers the new file and passes.

## 25. RED→GREEN evidence

`DashboardTermsPage.test.tsx` (8 tests) and the `TermsStep`/`BusinessDashboardRoutes` test updates
were written alongside the implementation; confirmed failing against a stub-only render before the
real logic was filled in (import/render failures and a genuine duplicate-heading failure caught
and fixed — see §26), then passing after.

## 26. Tests added/changed

- New: `DashboardTermsPage.test.tsx` (8 tests), `tests/e2e/dashboard-terms-harness.spec.ts` (6
  real-browser tests).
- Modified: `BusinessDashboardRoutes.test.tsx` (mocked the two new mutation hooks; replaced the
  "not-yet-implemented" Terms assertion with a real one), `TermsStep.test.tsx` unmodified (0 diff
  — the `hideContinue` prop is additive and defaults to today's exact behavior).
- **Genuine defect caught during TDD, not asserted away:** the first draft rendered a page-level
  `<h1>` duplicating `TermsStep`'s own "Business Terms" `<h2>`, producing an ambiguous
  multi-element query failure. Fixed by removing the redundant heading rather than loosening the
  test.

## 27. Full validation

- `vitest run` (web): **595/595** passed (+8 net).
- `pnpm --filter functions run test`: **1563/1563**, unaffected (zero `functions/` diff).
- `tsc --noEmit` (web + functions): clean.
- `eslint .` (whole repo): clean except the same 1 pre-existing, unrelated warning
  (`BusinessApiContext.tsx`).
- `prettier --check`: clean after one `--write` fix (test file, whitespace-only).
- Playwright `chromium` (production build): 1/1.
- Playwright `chromium-dashboard-harness`: **21/21** (15 pre-existing Package B/C + 6 new Package
  D).
- Firebase Emulator Suite (`pnpm run emulators:validate`): **688/690** (2 pre-existing skips,
  matching precedent), clean first run, no flake this time.
- Secret scan: manual grep across the full diff — clean.

## 28–29. Files modified & diff summary

- New: `apps/web/src/business/dashboard/DashboardTermsPage.tsx`,
  `DashboardTermsPage.test.tsx`, `tests/e2e/dashboard-terms-harness.spec.ts`.
- Modified: `apps/web/src/business/dashboard/BusinessDashboardRoutes.tsx` (wire the real screen in
  place of one `DashboardComingSoon` placeholder), `BusinessDashboardRoutes.test.tsx` (mocks +
  updated assertion), `apps/web/src/business/onboarding/steps/TermsStep.tsx` (additive optional
  `hideContinue` prop, +20/-5 lines).
- Zero `functions/`, Firestore Rules, Firebase config, or i18n-locale diff.
- 3 files changed net-new plus 3 modified; total diff 30 insertions / 15 deletions across the
  modified files (`git diff --stat origin/main..HEAD`).

## 30. Commands executed

`git fetch`/`worktree add`, `gh pr view`/`run list`, `grep`/`Read` across governance docs, domain
contracts, Stitch assets, and existing onboarding components, `pnpm install`, `pnpm run
typecheck`/`lint`, `npx prettier --check`/`--write`, `npx vitest run` (web, functions), `pnpm run
emulators:validate`, `npx playwright install chromium`, `npx playwright test` (both projects),
`git commit`, `git push`, `gh pr create`.

## 31. Dependencies added

None.

## 32. Config changes

None (no `playwright.config.ts` change needed — the harness project's `testMatch` regex was
already generalized during Package C's review to match any `dashboard-*-harness.spec.ts` file).

## 33. Firebase/Rules/deployment changes

None.

## 34–35. Findings & remaining material findings

No functional, security, or scope-boundary defect found. The one TDD-caught issue (duplicate
heading) was fixed during implementation, not left as a finding. No remaining material findings —
Package D is bounded, complete, and does not carry forward an unresolved item the way Package C's
read-contract gap did.

## 36. Risks

Low — additive frontend-only change behind an existing, unmodified route table and shell; zero
backend/Rules/config diff; the one shared file touched (`TermsStep.tsx`) received a purely additive,
default-preserving change with zero diff to its own test file.

## 37. Rollback

Revert the single commit/PR; `terms` route returns to Package B's `DashboardComingSoon` placeholder,
matching the pre-package state exactly; `TermsStep.tsx`'s `hideContinue` prop reverts cleanly since
no other caller uses it yet.

## 38. Persistent implementation report path

This file.

## 39. Changes-tracking state

A matching entry added to `docs/changes/IMPLEMENTATION_CHANGES.md` under `## ENG-P3-002-UI-IMP-D`.

## 40–42. PR number, final head SHA, CI result

- **PR:** [#181](https://github.com/Fkenogo/11THONUS/pull/181) — draft, from
  `feat/eng-p3-002-ui-imp-d` against `main`. Not self-merged.
- **Final head SHA:** `bb18c93ce2b9a7264a711de6a11494f704587bdb`.
- **CI:** pending at the time of this report — see the PR's own Checks tab for current status.

## 43–46. Package/Capability status

- **Package D status:** implementation complete, tested, validated; pending Founder review. Not
  merged.
- **Packages E/F/G/H status:** not started; no overlapping work exists in this diff.
- **`ENG-P3-002` status:** unchanged — Open.
- **Capability 3 status:** unchanged — Open.

## 47. Exact next Founder action

Review this draft PR (Business Terms/Activation, Package D of `ENG-P3-002-UI-RECON-001`); if
approved, merge as a genuine merge commit. Packages E/F/G/H remain unauthorized and not started.
