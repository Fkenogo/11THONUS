# ENG-P3-002-UI-IMP-B — Business Dashboard Shell & Dashboard Home Implementation Report

**Date:** 2026-08-26
**Task type:** Frontend structural implementation, TDD. **No backend, Firebase, Rules, or
deployment change.** PR opened as draft, pending independent review — not self-merged.

## 1. Entry repository state

Primary checkout (`docs/eng-p3-002-ui-governance-chain-sync`) was 10 commits **behind**
`origin/main` at task start — stale relative to `2c947359d4f629e375a89e174c0dc4aa5a84030b`.
Confirmed via `git rev-list --left-right --count HEAD...origin/main` = `0	10`. No lock files, no
in-progress merge/rebase. `git status` showed only pre-existing untracked governance/product docs
unrelated to this task (not touched).

Verified `origin/main` includes both required merges: PR #175
(`cb7606edb14cfdc205d7745bc4e9ff7307db6d48`) and PR #176
(`2c947359d4f629e375a89e174c0dc4aa5a84030b`), via `git merge-base --is-ancestor` — both present.
Post-merge CI (`gh run list --branch main`) green for both (`success`, 6m10s / 5m24s).

**A fresh clean linked worktree was created from `origin/main`** at
`/Users/theo/11THONUS-eng-p3-002-ui-imp-b`, branch
`feat/eng-p3-002-ui-imp-b-business-dashboard-shell-home`, HEAD `2c94735`. All research and
implementation in this task were performed there, not in the stale primary checkout. An initial
Explore-agent pass against the stale checkout wrongly concluded Package A code did not exist; this
was caught and corrected before any implementation began by re-running the codebase research
against the fresh worktree, where Package A's real implementation (`ccf2b35`, PR #173) was found
present and complete.

Confirmed: Package A complete/corrected/merged (PRs #173/#174/#175/#176); Package B not
previously started (no `apps/web/src/business/dashboard/BusinessDashboardShell.tsx` or equivalent
existed); `CDR-001` still lists Capability 3 as `Open — partially implemented; not closed`
(unchanged by this task).

## 2. Governing sources reviewed

`ENG-P3-002-UI-RECON-001` (Parts I–XXIX, especially VI/DASH-01, VIII/Dashboard-shell findings,
IX/X/Stitch-invention-audit, XV/Package-B-scope); `ENG-P3-002-UI-HANDOFF-001` + its Founder
reconciliation/addenda (Brief 4/DASH-01, FD-4); `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` +
`-FOUNDER-DISPOSITION` (FD-1/FD-3/FD-4/FD-6); Package A's implementation and correction reports;
`CDR-001` Capability 3 section; current `apps/web/src/App.tsx`, `businessContext.ts`,
`businessQueries.ts`, `RequireAuthenticatedUser.tsx`, `i18n/config.ts`, `LanguageSwitcher.tsx`,
`formPrimitives.tsx`, `components.json`, `package.json` (UI-primitive inventory).

## 3. Approved Stitch assets inspected

`docs/07-product-design/stitch/v3-designs/business dashboard/
business_dashboard_home_{mobile,desktop}_dash_01/code.html` (+ `screen.png`), cross-referenced
against `business profile/business_profile_mobile/code.html` for the Business Code caption
conflict. Both `code.html` sources were grepped directly (not trusted from the reconciliation
report's summary alone) to confirm exact copy: desktop dash-01's Business Code caption ("Share
this code with partners for quick integration.") contradicts the governed Business Code policy;
mobile dash-01 shows Business Code inline with no caption; `business_profile_mobile`'s caption
("Use this code for official 11thONUS communications.") is the governance-correct framing.

## 4. Pre-change architecture analysis

- Package A had already created the Dashboard **route and boundary/query wiring**
  (`/business/:businessId/dashboard` → `BusinessDashboardBoundaryPage` →
  `useBusinessContextQuery` → `DashboardPlaceholder`), explicitly documented in
  `DashboardPlaceholder.tsx`'s own header as a deliberate minimum placeholder for Package B to
  replace at the same route — not a gap this task needed to create from scratch.
- No shared shell/layout/header component existed anywhere in the codebase — every establishment
  screen renders its own inline `LanguageSwitcher`. This is genuinely the first shared
  layout-route structure in the app.
- No React Context/Provider wraps `BusinessContext` — only `useBusinessContextQuery`, a TanStack
  Query hook keyed by `businessId`. Reused as-is; no new data-fetching primitive introduced.
- `components.json` is a pre-configured-but-unused shadcn scaffold; no Radix/shadcn/vaul/cmdk
  dependency is actually installed. `formPrimitives.tsx`'s own header documents a prior Founder
  direction against adding a design-system dependency. Decision: hand-roll the mobile menu with
  existing primitives (Tailwind + `cn()` + local component state), matching that precedent —
  **zero new dependencies added.**
- `BusinessContext` type already carries every field DASH-01 needs (`displayName`,
  `primaryCategoryId`, `status`, `termsAcceptance.accepted`) — no backend change required,
  confirmed against `ENG-P3-002-UI-RECON-001` Part VI/DASH-01 ("Backend change required: none").

## 5. Implementation strategy

Convert the Package A placeholder route into a nested route family under
`/business/:businessId/dashboard/*`, with one shared `BusinessDashboardShell` (mobile
hamburger-menu / desktop persistent-sidebar chrome around `<Outlet />`) wrapping five destinations:
index (`DashboardHome`, DASH-01 — real content) and `profile`/`locations`/`team`/`terms`
(`DashboardComingSoon` — restrained not-yet-available placeholders, since Packages C/D/F are not
authorized here). `BusinessDashboardBoundaryPage` keeps its existing loading/error dispatch
unchanged and now renders `BusinessDashboardRoutes` (a nested `<Routes>`) instead of
`DashboardPlaceholder`, which is retired. No new dependency, no new Context/Provider, no backend
change.

## 6. Single-app boundary result

No second app root, deployment target, or PWA was created. The Dashboard is ordinary nested React
Router state inside the existing `App.tsx` tree, under the existing `RequireAuthenticatedUser`
guard. Confirmed no participant/customer-facing app exists anywhere in this repository to
duplicate against.

## 7. Dashboard routing result

`App.tsx`'s single route `path="/business/:businessId/dashboard"` was changed to
`path="/business/:businessId/dashboard/*"` (one-line change) so `BusinessDashboardBoundaryPage`
can mount its own nested `<Routes>` for the five destinations. No new top-level route added.

## 8. Finish-Setup → Dashboard result

Unchanged — this was Package A's contract (`EstablishmentReviewPage.tsx`'s "Finish setup" already
navigates to `/business/:businessId/dashboard` with no backend call). Confirmed by the existing,
unmodified `EstablishmentReviewPage.test.tsx` test: *"Finish setup navigates to the Dashboard
boundary without submitting for verification or altering lifecycle status."* Not re-implemented or
touched by this task.

## 9. Dashboard shell architecture

`BusinessDashboardShell.tsx` — one component, mounted once per Dashboard visit, rendering
`<Outlet />` for whichever nested route matched. `BusinessDashboardRoutes.tsx` defines the nested
route table (index + `profile`/`locations`/`team`/`terms`) inside it, so Packages C/D/F add a
`<Route>` there without touching the shell. Business-existence/ownership guarding is unchanged
(server-side `getBusinessContext` permission-denied → existing `integrityError` treatment at the
boundary page, above the shell).

## 10. Mobile navigation implementation

A hand-rolled expandable menu (no bottom bar): a header with Business name + hamburger button
(`aria-expanded`, `aria-controls`, translated `aria-label` toggling "Open navigation"/"Close
navigation"), toggling a shared `<nav>`'s Tailwind `hidden`/`block` class. Opening moves focus to
the first nav link; Escape closes the menu and returns focus to the trigger; selecting a
destination closes the menu. No new dependency (Radix/shadcn/vaul) was added — consistent with
`formPrimitives.tsx`'s established "no new design-system dependency" precedent.

## 11. Desktop navigation implementation

The same `<nav>` element is always visible at `md:` breakpoint and up (persistent sidebar), via
Tailwind responsive classes only — not a second navigation system.

## 12. Mobile/desktop semantic parity

One `<nav aria-label="Business Dashboard navigation">` element serves both viewports; the same
five links, hrefs, and active-state (`aria-current="page"` via `NavLink`) exist regardless of the
mobile menu's open/closed state — verified directly by test (`exposes all navigation destinations
regardless of mobile menu open state`).

## 13. Dashboard Home governed-content inventory (extracted before coding)

From `ENG-P3-002-UI-RECON-001` Part VI/DASH-01 and the HANDOFF Brief 4: (1) Business identity
(name, category); (2) a readiness/activation-status summary sourced from real
`termsAcceptance.accepted` — never a fabricated "% complete"; (3) four management entry points
(Profile, Locations, Team, Terms); (4) required states — everything-in-order, something-
outstanding (loading/error already handled one layer up at the boundary page, unchanged).
Implemented exactly this list and nothing beyond it.

## 14. Dashboard Home implementation result

`DashboardHome.tsx` (DASH-01): identity line (`displayName · categoryLabel`, category resolved via
the existing `useBusinessCategoriesQuery`, same pattern as `EstablishmentReviewPage`); a
conditional banner — "One step left" + "Review Business Terms" link when
`termsAcceptance.accepted === false`, or a neutral "set up" message when `true` — and a
four-entry-point grid linking to the nested routes.

## 15. Unsupported Stitch content excluded

Excluded entirely, per Part IX/X's D-classified list: the "Active" status badge (no lifecycle
badge of any kind is rendered — readiness comes only from `termsAcceptance`, never from `status`);
"merchant account"/"appointments" copy; revenue/sales/transaction/customer/loyalty/redemption/
conversion metrics or charts; Tier/Subscription display; "Connected Platforms"/integrations;
multi-branch/"Add new location" affordances (out of scope for Home entirely); category-specific
("salon") copy. All verified absent by explicit negative-assertion tests in
`DashboardHome.test.tsx`.

## 16. Business Code policy result

**Business Code is not shown anywhere in Package B.** The governed DASH-01 minimum (§13 above)
does not list it, and the three Stitch mockups disagree with each other on its framing (no
caption on mobile, an FD-3-§24-violating "share for integration" caption on desktop, a correct
"official 11thONUS communications" caption on the Profile mockup) — rather than pick one
inconsistent treatment for Home, it is omitted here per Phase H's own instruction ("If the
governed Dashboard minimum does not require it, do not add it merely because Stitch displays
it"). Its correct governed treatment belongs to Business Profile (Package C, not this task).
Verified by test: `DashboardHome` never renders "Business Code" or the code value.

## 17. Business lifecycle/status result

No `BusinessStatus` value or lifecycle badge is rendered anywhere in Package B. A `draft` Business
with `termsAcceptance.accepted === false` shows the outstanding-Terms banner, never "Active" or
any other status word. Verified by test (`never presents a draft Business as Active`).

## 18. Business-context result

Reused `useBusinessContextQuery` unchanged; no new Context/Provider, no parallel Dashboard store.
`BusinessDashboardBoundaryPage`'s existing loading/pending/error dispatch is unchanged; only its
success branch now renders `BusinessDashboardRoutes` instead of `DashboardPlaceholder`.

## 19. Authorization/tenant-isolation result

Unchanged. `RequireAuthenticatedUser` still gates the whole route; ownership/tenant isolation is
still enforced server-side by `getBusinessContext` (permission-denied → the existing
`integrityError` UI, verified by test: *"denies access with the existing integrity-error treatment
for a wrong/non-owned Business"*). No direct Firestore access was introduced anywhere in
`business/dashboard/` — verified by a dedicated static-scan test
(`noDirectFirestore.test.ts`) that greps every new/changed source file for `firebase/firestore`
imports (excluding test files) and asserts none exist.

## 20–22. EN / FR / language-persistence results

New `business.dashboard.*` namespace added to both `en.ts` and `fr.ts` (nav labels, Home copy,
entry-point labels, coming-soon copy); the retired `dashboardPlaceholder.*` key was removed from
both (its only consumer, `DashboardPlaceholder.tsx`, was deleted). `LanguageSwitcher` is now
mounted once in the shell (reachable on every Dashboard screen) rather than needing to be added
per-page. Verified by test: switching EN→FR and FR→EN preserves the current nested route
(`/business/:id/dashboard/profile` stays put) and the rendered Business identity/content
(`Acme Salon`, `profile content`) throughout the switch.

## 23–25. Mobile / tablet-intermediate / desktop results

Verified structurally via Tailwind breakpoint classes (`md:` gates the sidebar-vs-hamburger
split) and by component tests asserting both states' DOM content are equivalent (§12). No
horizontal-overflow-prone fixed widths were introduced; the nav is `md:w-64` and the content
column is `flex-1`. A full pixel-level responsive browser pass (375×812 / tablet / desktop
viewports) was not performed in a live browser in this task — noted as a remaining verification
step below (§37).

## 26. Accessibility result

Landmark: `<nav aria-label="Business Dashboard navigation">`. Menu trigger:
`aria-expanded`/`aria-controls`/translated `aria-label`. Current section: `NavLink`'s built-in
`aria-current="page"`. Focus management: opening the mobile menu focuses the first link; Escape
closes it and returns focus to the trigger; selecting a link closes the menu. All verified by
test, using Testing Library's accessible-role queries throughout (not snapshot/markup tests).

## 27. RED→GREEN evidence

All four new components (`BusinessDashboardShell`, `DashboardHome`, `DashboardComingSoon`,
`BusinessDashboardRoutes`) and their tests were written before any implementation existed;
`vitest run src/business/dashboard` was run first and failed with genuine
`Failed to resolve import` errors for all four modules (confirmed RED — 4 files failed, 3
pre-existing files passed). Implementation was then written and the same command re-run: all 8
test files / 27 tests passed (confirmed GREEN, after one test-harness fix — see below).

One test-authoring bug surfaced during RED→GREEN and was fixed, not the implementation: the
`BusinessDashboardShell.test.tsx` harness initially nested `<Route>` children under a pathless
parent `<Route element={...}>` with no `path`, which never matches a real location — corrected to
`path="/business/:businessId/dashboard/*"`, matching the pattern the (already-passing)
`BusinessDashboardRoutes.test.tsx` used.

## 28. Tests added/changed

New: `BusinessDashboardShell.{tsx,test.tsx}`, `DashboardHome.{tsx,test.tsx}`,
`DashboardComingSoon.{tsx,test.tsx}`, `BusinessDashboardRoutes.{tsx,test.tsx}`,
`noDirectFirestore.test.ts` (static-scan, item 19). Updated:
`BusinessDashboardBoundaryPage.{tsx,test.tsx}` (renders `BusinessDashboardRoutes`; added a
direct-nested-navigation test and an explicit non-owned-Business test). Removed:
`DashboardPlaceholder.{tsx,test.tsx}` (superseded, per its own header comment). Items 1/2/5 from
Phase M's required list were already covered by Package A's existing, unmodified
`EstablishmentReviewPage.test.tsx`/`BusinessDashboardBoundaryPage.test.tsx` tests and were not
duplicated.

## 29. Full validation

- Focused: `vitest run src/business/dashboard` — 8 files / 27 tests passed.
- Web unit: `vitest run` (apps/web) — **89 files / 561 tests passed** (up from 87/539 pre-change).
- Functions unit: `vitest run` (functions) — **143 files / 1563 tests passed**, unaffected (no
  backend files touched).
- Typecheck: `tsc -b --noEmit` — clean.
- Lint: `eslint` on all changed/added files — clean.
- Format: `prettier --check` — 2 files needed `--write` (whitespace only, in
  `BusinessDashboardRoutes.test.tsx` and `locales/fr.ts`); re-checked clean after.
- Build: `tsc -b && vite build` — succeeds (pre-existing >500kB single-chunk warning, unrelated to
  this change, not addressed — out of scope).
- Playwright: `playwright test` — 1/1 passed (`app-shell.spec.ts`, unaffected by this change; no
  new Playwright spec was added for the Dashboard in this task — see §37).
- Firebase Emulator Suite / hosted Founder-QA preview: **not executed in this task.** Per this
  repository's established precedent (e.g. the AUTH-09 package), the hosted-preview/Founder-QA
  step is Founder-executed, not part of a frontend-only implementation task, and Package B has no
  backend dependency to validate against the emulator. Flagged as a remaining step, not silently
  skipped.
- Secret scan: manual `git diff | grep` for API-key/secret/password/private-key patterns — clean.
  No dedicated secret-scanning tool is configured in this repository (same method noted in the
  prior IMP-A-CORR-001 report).

## 30. Files modified

`apps/web/src/App.tsx` (1-line route path change); `apps/web/src/business/dashboard/
BusinessDashboardBoundaryPage.{tsx,test.tsx}` (modified); `apps/web/src/business/dashboard/
{BusinessDashboardShell,BusinessDashboardRoutes,DashboardHome,DashboardComingSoon}.{tsx,test.tsx}`
(new); `apps/web/src/business/dashboard/noDirectFirestore.test.ts` (new); `apps/web/src/business/
dashboard/DashboardPlaceholder.{tsx,test.tsx}` (deleted); `apps/web/src/i18n/locales/{en,fr}.ts`
(new `dashboard.*` namespace added, `dashboardPlaceholder.*` removed); this report; the
changes-tracking entry.

## 31. Code diff summary

`git diff --stat origin/main` (tracked-file portion): 7 files changed, 95 insertions(+), 79
deletions(-), plus 9 new untracked files now staged (4 components + 4 tests + 1 static-scan test).
Net: one new shared shell/layout, one new Dashboard Home screen, four restrained placeholder
screens, one nested route table, zero backend/Firebase/dependency changes.

## 32. Commands executed

`git fetch origin`; `git rev-parse`/`git rev-list`/`git merge-base --is-ancestor`; `gh run list`;
`git worktree add`; `pnpm install --frozen-lockfile`; `npx vitest run` (web, focused and full;
functions, full); `npx tsc -b --noEmit`; `npx eslint`; `npx prettier --check`/`--write`;
`npx tsc -b && npx vite build`; `npx playwright install chromium --with-deps`;
`npx playwright test`; `git diff`/`git status`/`git add`.

## 33. Dependencies added

**None.** `package.json`/`pnpm-lock.yaml` untouched — verified by `git diff --stat` showing no
change to either file.

## 34. Config changes

None.

## 35. Firebase/Rules/deployment changes

None. No `firestore.rules`, `storage.rules`, `firebase.json`, Cloud Functions, or hosting/CI config
file was touched.

## 36. Findings

No new backend/data-contract gaps were found beyond those already recorded in
`ENG-P3-002-UI-RECON-001` Part XI (pending-invitation identity, Team transport gap — both
out of scope for Package B). The Business Code caption inconsistency across the three v3 Stitch
mockups (§3/§16 above) is resolved for Package B by omission, not by picking one of the three
conflicting captions — flagged explicitly for whoever implements Package C's Business Profile
screen (the correct caption belongs there, per Part IX/XIII).

## 37. Remaining material findings

- Full live-browser responsive verification (375×812 mobile / tablet / desktop) was not performed
  in this task — only Tailwind-breakpoint-level structural checks and jsdom-based component tests.
- No new Playwright end-to-end spec was added for the Dashboard shell/navigation; only the
  pre-existing, unrelated `app-shell.spec.ts` was re-run for regression sanity.
- Firebase Emulator Suite and hosted Founder-QA preview were not executed (§29) — flagged as the
  Founder-executed step per established precedent, not a gap this task could close unilaterally.

## 38. Risks

Low. Frontend-only, additive at the route level (one existing route path widened to a wildcard),
no dependency/config/backend change, full existing test suite (web + functions) green, build
green. The main residual risk is unverified live-browser responsive behavior (§37).

## 39. Rollback instructions

Revert the PR's merge commit (or, pre-merge, delete the branch
`feat/eng-p3-002-ui-imp-b-business-dashboard-shell-home` and its worktree). No data migration, no
backend/Firebase state, no dependency changes to unwind.

## 40. Persistent implementation report path

This file:
`docs/05-implementation/reports/ENG-P3-002-UI-IMP-B-business-dashboard-shell-home-implementation-report-2026-08-26.md`.

## 41. Changes-tracking state

New entry appended to `docs/changes/IMPLEMENTATION_CHANGES.md` (see diff in this PR).

## 42. PR number

See PR opened by this task (draft) — linked in the changes-tracking entry once created.

## 43. Final head SHA

Recorded in the PR description at open time (this branch's HEAD after the commit accompanying this
report).

## 44. CI result

Pending — PR opened as draft; CI will run on push per repository convention. Not self-merged.

## 45. Package B status

**Implemented, pending independent review.** Not closed by this task — per the task's own
governance requirement, only the Founder/reviewer can close a package.

## 46. ENG-P3-002 status

Unchanged — still not marked complete by this task.

## 47. Capability 3 status

Unchanged — still `Open — partially implemented; not closed` in `CDR-001` (not edited by this
task; that log is updated by the Founder/review process per its own established convention, not by
the implementing task itself, matching Package A's precedent).

## 48. Exact next Founder action

Review this draft PR (Business Dashboard shell + DASH-01 Home). Package C (Business Profile +
Locations), Package D (Business Terms), and Package F (Team Management) are explicitly **not**
started and depend on this shell being reviewed/merged first, per
`ENG-P3-002-UI-RECON-001` Part XV/XVI's implementation order.

## Final gate

**ENG-P3-002-UI PACKAGE B READY FOR FOUNDER REVIEW — BUSINESS DASHBOARD SHELL AND DASHBOARD HOME
IMPLEMENTED; LATER MANAGEMENT PACKAGES NOT STARTED.**
