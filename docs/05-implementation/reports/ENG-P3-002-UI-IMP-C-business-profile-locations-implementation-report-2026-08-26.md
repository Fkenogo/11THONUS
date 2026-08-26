# `ENG-P3-002-UI-IMP-C` — Business Profile + Locations (MGMT-02/03) Implementation Report (2026-08-26)

**Status:** Frontend structural implementation, tests, full validation, draft PR opened. Not
self-merged. `ENG-P3-002` / Capability 3 remain Open — unchanged by this package.

## 1–2. Entry repository state & Package B ancestry/closure

- `git fetch origin`: `origin/main` at `78a5fc9` (merge of PR #178).
- The session's primary checkout (`docs/eng-p3-002-ui-governance-chain-sync`, HEAD `99f840f`) was 0
  ahead / 13 behind `origin/main` and predates all of Package A/A-correction/B. Per the task's own
  entry-gate requirement, a fresh linked worktree was created from `origin/main` and all subsequent
  work happened there — nothing was implemented against the stale checkout.
- Verified via `gh pr view` and `git log`: PR #173/#174 (Package A), #175/#176 (Package A
  correction), #177/#178 (Package B) all merged into `main`, in that order, each as a genuine merge
  commit except #177 (see below). No incomplete git operation (`MERGE_HEAD`/`REBASE_HEAD`/etc.)
  present.
- Package B squash-merge deviation (recorded here as historical information only, not corrected):
  PR #177 was merged via `gh pr merge --squash` in error, collapsing implementation+review-fix
  commits into one, unlike every other PR in this chain. Content was independently confirmed
  zero-drift against the fully-reviewed head at the time; no `main` rewrite was attempted then or
  now.
- Post-merge CI on `main` confirmed green at `78a5fc9` before this package's worktree was created
  from it.
- Confirmed no Package C (or later) implementation existed anywhere in the repository — no
  `BusinessProfilePage`/`LocationsPage`-shaped component, no matching worktree with commits beyond
  `origin/main`.
- Fresh worktree created: `/Users/theo/11THONUS-eng-p3-002-ui-imp-c`, branch
  `feat/eng-p3-002-ui-imp-c`, from `origin/main` (`78a5fc9`).

## 3–5. Package C authority, governing sources, Stitch assets reviewed

Reconstructed from the repository's own governance documents before any source was touched
(**PACKAGE C GOVERNED SCOPE**, quoted from `ENG-P3-002-UI-RECON-001` Part XV, verbatim):

> **Package C — Business Profile + Locations (MGMT-02/03).** Objective: the two Dashboard
> management screens for already-governed data. Areas: new components under the Package B shell.
> Depends on: Package B. Acceptance criteria: edits use `updateBusinessProfile`/
> `updateBusinessBranchProfile` unchanged; "Add new location" is **not** implemented; no
> per-location status/photo/ID is implemented. Backend dependency: none. Founder authorization
> boundary: frontend-only.

This is a governed **refinement** of the task title ("Business Profile Management") — Locations is
explicitly, deliberately included, not an out-of-scope expansion I introduced — so the task's own
Phase K contingency ("if Locations is explicitly inside Package C, implement only the approved
bounded scope") applies directly; this was confirmed with the Founder/user before implementation
began and is not a silent reinterpretation.

- **Included screens:** Business Profile; Locations (Main Location only).
- **Included functionality:** read governed profile fields; edit via `updateBusinessProfile`; read
  Main Location; edit via `updateBusinessBranchProfile`; correct Business Code caption (deferred to
  this package by the Package B review, per FD-3 §24).
- **Excluded:** "Add new location," per-location status/photo/ID, multi-branch management, any new
  backend contract.
- **Backend contracts:** unchanged — no `functions/` diff.
- **Dependencies:** Package B's Dashboard shell (merged, `78a5fc9`).
- **Deferred:** `Business.address` vs `BusinessBranch.address` reconciliation — untouched, per
  `ENG-P3-002-UI-RECON-001` Part XI and `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION`.

**Governing sources reviewed:** `ENG-P3-002-UI-RECON-001` (package decomposition, Parts X/XI/XV/XVI/XVII);
`ENG-P3-002-UI-HANDOFF-001` + its embedded Founder-disposition addendum; `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001`
+ its Founder-disposition file (FD-1–FD-7); `ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md`
§24 (FD-3, the actual source text of the Business Code governance cited elsewhere only as "FD-3 §24");
Package A/A-correction/B implementation and review reports; `IMPLEMENTATION_CHANGES.md`.

**Stitch assets inspected:** `docs/07-product-design/stitch/v3-designs/business profile/` —
`business_profile_mobile/code.html`, `business_profile_locations_desktop/code.html`,
`locations_mobile/code.html`, `edit_location_mobile/code.html` (HTML + rendered screenshots for
each). Used to confirm real design intent for field grouping, not treated as an authority over the
backend contract or over governance exclusions (see §16 below).

## 6. Pre-change architecture analysis

Traced the full existing chain before writing UI: `BusinessContext` (frontend `businessContext.ts`
/ backend `businessReadService.ts`) → `useBusinessContextQuery`/`useBusinessCategoriesQuery`/
`useBusinessTypesQuery` (`businessQueries.ts`) → `useUpdateBusinessProfileMutation`/
`useUpdateBusinessBranchProfileMutation` (`businessMutations.ts`) → `businessProfile.ts` API
adapters → `updateBusinessProfile`/`updateBusinessBranchProfile` callables (`functions/src/index.ts`)
→ `updateBusinessProfileCommand`/`updateBusinessBranchProfileCommand` → `business.ts`/
`businessBranch.ts` domain merge functions → Firestore. Confirmed every hook/adapter/callable this
package needed already existed, unmodified, from Packages A/B/`ENG-P2-002C` — zero backend diff was
required or made. Also read `ClassificationStep.tsx`, `BranchStep.tsx`, `EstablishmentReviewPage.tsx`,
and `formPrimitives.tsx` to reuse this repository's existing UI conventions rather than inventing
new ones (dl/dt/dd read layout, `Select`/`TextField`/`Button`/`MutationError` primitives, Category-
change-clears-Type behavior, edit-toggle-via-local-state pattern).

## 7. Field-by-field Business Profile contract matrix

| Field | Readable? (`BusinessContext`) | Writable? (`*ProfilePatch`) | Required? | Owner | Current UI (pre-Package C) | Stitch? | Governed disposition (this package) |
|---|---|---|---|---|---|---|---|
| `displayName` | Yes | Yes | Yes | Business | Establishment/Review only | Yes ("Name") | **Shown + editable** on Profile |
| `primaryCategoryId` | Yes | Yes | Yes | Business | Establishment/Review only | Yes ("Category") | **Shown + editable** on Profile |
| `businessTypeId` | Yes | Yes | No | Business | Establishment/Review only | Yes ("Type") | **Shown + editable** on Profile, category→type relationship preserved, "No specific type" preserved |
| `contactPhone` | Yes | Yes | Yes | Business | Establishment/Review only | Yes ("Phone") | **Shown + editable** on Profile |
| `contactEmail` | Yes | Yes | No | Business | Establishment only | No | **Shown + editable** on Profile (governed-readable/writable pair; restrained "not provided" state) |
| `businessCode` | Yes | No (immutable) | — | Business | Nowhere (deliberately excluded from DASH-01) | Yes, inconsistently | **Shown read-only** on Profile, FD-3 §24 caption |
| `countryCode`/`currencyCode`/`timezone`/`city` (Business-level) | Yes | Yes | Yes | Business | Establishment Review (read-only "Operating details") | No (not depicted as Profile fields) | **Not shown/editable on Profile** — no Stitch or governance basis to add operating-details editing here; avoids inventing scope |
| `legalName` | **No** | Yes | No | Business | Nowhere | No | **Excluded.** Writable but never projected onto `BusinessContext` — an edit control could never load a persisted value (violates Phase O test 5). Extending the read DTO is a backend read-contract change outside this package's frontend-only authorization. **Flagged as a finding**, not resolved here. |
| `Business.address` | **No** | Yes | No | Business | Nowhere | No | **Excluded** — same read-contract gap as `legalName`, *and* separately, explicitly deferred by Founder disposition (`RECON-001` Part XI). Untouched by this package either way. |
| `logoUrl` | **No** | Yes | No | Business | Nowhere | No | **Excluded** — same read-contract gap; also RECON-001's own "Remaining Founder Decision #3" (logo upload mechanism) was still open as of that document. |
| `supportedLanguages` | **No** | Yes | Yes (array) | Business | Nowhere | No | **Excluded** — same read-contract gap. |
| `BusinessContextBranch.displayName`/`city`/`address` | Yes | Yes | name/city yes, address optional | BusinessBranch | Establishment `BranchStep`/Review | Yes | **Shown + editable** on Locations (reusing `BranchStep`'s exact field set) |
| `BusinessContextBranch.countryCode` | Yes | Yes | Yes | BusinessBranch | Establishment Review (read-only) | Yes (as an editable text input in Stitch) | **Shown read-only** on Locations — matches `BranchStep`'s own existing precedent of never editing `countryCode`; no new mutability invented for this package despite Stitch depicting it as editable |

## 8–10. Implementation strategy & Dashboard-shell integration

Two new components under `apps/web/src/business/dashboard/` — `BusinessProfilePage.tsx`,
`LocationsPage.tsx` — mounted directly into Package B's existing `BusinessDashboardRoutes.tsx` in
place of the `DashboardComingSoon` placeholders at `profile`/`locations`, inside the unmodified
`BusinessDashboardShell` (`<Outlet />`). No second shell, no duplicated nav, no new Business context
store, no new auth mechanism — the shell's existing nav links to these routes already worked
unchanged. `team`/`terms` remain `DashboardComingSoon` (Packages D/F, not started).

## 11. Profile read result

Renders `displayName`, category label (via `useBusinessCategoriesQuery`, never hardcoded),
type label or "No specific type", `contactPhone`, `contactEmail` (or a restrained "no email
provided" state), and `businessCode` — all sourced directly from the backend-authoritative
`BusinessContext` prop, no client-only derivation.

## 12. Profile edit result

Edit mode pre-fills persisted values into `TextField`/`Select` primitives; Save calls
`useUpdateBusinessProfileMutation` with exactly the governed-editable fields (§7); on success the
query cache is invalidated (existing hook behavior) so the screen re-renders from re-fetched
backend truth; Cancel discards local form state entirely (never lifted to the parent), so the read
view always reflects only what was actually persisted — proven by test (`Cancel discards unsaved
edits...`).

## 13. Category/type result

Reuses `ClassificationStep`'s exact pattern: categories/types both come from
`useBusinessCategoriesQuery`/`useBusinessTypesQuery` (never hardcoded); a Category change clears
`businessTypeId` (`DEC-CKS-003`); "No specific type" is preserved; the type control is a plain
`<select>` (`Select` primitive) — no expanded type list was introduced.

## 14. `Business.address` disposition

Untouched. Not read, not written, not displayed, not reconciled with `BusinessBranch.address`. The
Locations screen's own address field is `BusinessContextBranch.address` only.

## 15. Business Code disposition

Displayed read-only in a dedicated "Identity" section with the caption "An internal reference for
11thONUS support — not a code for sharing," directly reflecting FD-3 §24's actual governed text
("a permanent, system-generated, human-readable reference... suitable for internal operational and
support use... not currently governed as a public business identifier... or commerce identifier").
No copy button, no primary-CTA styling, no integration/partner/sharing language — verified absent
by both jsdom and real-browser tests.

## 16. Locations boundary result

Confirmed via RECON-001 (§3 above) that Locations is explicitly inside Package C, bounded to the
Main Location only. Implemented exactly that bound: no "Add new location" control, no per-location
status badge, no location photo, no location ID, no multi-branch UI — all present in the v3 Stitch
mockup (`locations_mobile/code.html`) but excluded here per governance, verified absent by tests.

## 17. Unsupported Stitch-content audit

Excluded, and verified absent by tests: "Active"/status badge on the Main Location card; location
ID badge; location photography; "Add new location"; the `PROGRES` brand label (Stitch mockups use
it throughout; this package's screens render inside the existing shell's own header/branding,
unchanged, so `PROGRES` never appears); Tier/Subscription/merchant-account/appointments content on
either screen.

## 18. Business lifecycle/status result

Neither screen displays or infers a lifecycle/status badge; a `draft` Business is never presented as
"Active" (verified by explicit negative-assertion tests on both screens).

## 19–20. EN / FR and language/state persistence

No new hardcoded strings — both screens' full copy lives in `apps/web/src/i18n/locales/{en,fr}.ts`
under new `business.profile.*`/`business.locations.*` namespaces (plus `actions.save`/
`actions.cancel`, newly shared). The Dashboard shell's existing `LanguageSwitcher` (unchanged)
governs both screens. Real-browser Playwright coverage (see §27) proves EN → FR → EN preserves the
current route and Business identity on both screens, matching Package B's own established pattern.

## 21–23. Mobile / tablet / desktop result

Verified in a real browser (Playwright, Chromium) at 375×812, 390×844, 768×1024, and 1280×800: no
horizontal overflow at any breakpoint on either screen; the Dashboard shell's mobile menu and
language switcher remain reachable (shell unchanged); the Edit trigger's rendered touch target was
initially found to be 20–36px — corrected (`-m-3 p-3` hit-area expansion, no visual size change) to
meet the same ≥44px minimum Package B's own review established, then re-verified.

## 24. Accessibility result

Both screens use semantic `<section>`/`<h1>`/`<h2>`/`<dl>`/`<dt>`/`<dd>` structure; every input uses
`formPrimitives`' existing `<label htmlFor>` + `aria-invalid`/`aria-describedby` wiring; mutation
errors render via the existing `role="alert"` `MutationError` component; Save/Cancel are ordinary
focusable `<button>` elements with clear, distinct labels; the corrected Edit touch target now meets
the 44px minimum. No new focus-trap/keyboard-navigation surface was introduced (edit mode is a plain
in-place section swap, not a modal), so no new keyboard-handling code was needed.

## 25–26. Authorization/tenant-isolation & direct-Firestore result

Unchanged — no backend file touched, no new client-side Firestore access. Both mutations go through
the existing `authorizeAndExecute` boundary and structural tenant-isolation checks in
`businessProfileCommand.ts`/`businessBranchProfileCommand.ts` (read, not modified). The existing
`noDirectFirestore.test.ts` architecture guard in `apps/web/src/business/dashboard/` continues to
pass unmodified.

## 27–28. RED→GREEN evidence & tests added/changed

New: `BusinessProfilePage.test.tsx` (11 tests), `LocationsPage.test.tsx` (9 tests) — written
alongside the implementation and confirmed to fail against a stub-only component before the real
logic was filled in (import/render failures), then pass after. `BusinessDashboardRoutes.test.tsx`
updated: the old "renders the not-yet-implemented treatment for Profile/Locations" assertion was
replaced with two new tests proving the real screens now render at those routes, and the Terms-only
placeholder assertion was kept. New real-browser suite:
`tests/e2e/dashboard-profile-locations-harness.spec.ts` (8 tests) against the existing dev-only
`/dev/dashboard-harness` route (no Firebase/Auth dependency, same harness Package B already built);
one genuine RED found and fixed live during this pass (the Edit touch-target size, §21–23).
`playwright.config.ts`'s harness project `testMatch`/`testIgnore` regex widened from one literal
filename to a `dashboard-.*-harness` pattern so both harness specs run together.

## 29. Full validation

- `vitest run` (web): **585/585 passed** (9 new tests files/lines net across the touched files: +20
  Profile/Locations tests, +2 updated route tests).
- `tsc --noEmit` (web) and `tsc --noEmit` (functions): clean.
- `eslint .` (whole repo): clean except 1 pre-existing, unrelated warning
  (`BusinessApiContext.tsx`, `react-refresh/only-export-components`) — confirmed pre-existing, not
  introduced by this package.
- `prettier --check` (whole touched surface): clean after one `--write` fix
  (`LocationsPage.tsx`, whitespace-only).
- Playwright `chromium` (production build) project: 1/1 passed, unaffected.
- Playwright `chromium-dashboard-harness` project: **15/15 passed** (7 pre-existing Package B +
  8 new Package C).
- `functions` `typecheck`: clean (no backend files touched).
- Firebase Emulator Suite and hosted Founder-QA preview build: **not executed** — Founder-executed
  step per this repository's established precedent for prior UI packages (A/B); flagged, not
  skipped silently.
- Secret scan: manual grep across the full diff for credential/key/token patterns — clean.
- No flakes observed across repeated runs of the new suites.

## 30–33. Files modified, diff summary, commands, dependencies

**Files:**
- New: `apps/web/src/business/dashboard/BusinessProfilePage.tsx`,
  `BusinessProfilePage.test.tsx`, `LocationsPage.tsx`, `LocationsPage.test.tsx`,
  `tests/e2e/dashboard-profile-locations-harness.spec.ts`.
- Modified: `apps/web/src/business/dashboard/BusinessDashboardRoutes.tsx` (wire the two real
  screens in place of two `DashboardComingSoon` placeholders),
  `apps/web/src/business/dashboard/BusinessDashboardRoutes.test.tsx` (updated assertions),
  `apps/web/src/i18n/locales/en.ts`/`fr.ts` (new `profile`/`locations` namespaces,
  `actions.save`/`actions.cancel`), `playwright.config.ts` (harness `testMatch` regex widened).
- Zero `functions/`, Firestore Rules, or Firebase config diff.
- **Dependencies added:** none. **Config changes:** the one `playwright.config.ts` regex edit
  above; no environment/build config changed.

## 34–35. Dependencies added, Firebase/Rules/deployment changes

None. No new package installed; no Firebase project, Rules, index, or deployment configuration
touched.

## 36–37. Findings & remaining material findings

1. **(Architecture, not resolved by this package)** `updateBusinessProfile`'s patch type accepts
   `legalName`, `address` (`Business.address`), `logoUrl`, and `supportedLanguages`, but
   `getBusinessContext`'s `BusinessContext` DTO never projects any of the four back. This package
   deliberately does not surface edit controls for them (§7) rather than extend the read contract
   without separate authorization. A future package extending that read projection (an additive,
   same-file change, same shape as the Package A-correction's `currencyCode`/`timezone` addition)
   would be the natural way to close this gap if the Founder wants these fields manageable from
   Profile.
2. **(Deferred, unchanged)** `Business.address` vs `BusinessBranch.address` reconciliation remains
   explicitly out of scope, carried forward unmodified.
3. **(Open, pre-existing)** RECON-001's "Remaining Founder Decision #3" (logo upload mechanism) is
   still open; `logoUrl` is not part of this package for that reason in addition to the read-gap
   above.

No other material findings.

## 38–39. Risks & rollback

**Risk:** low — additive frontend-only change behind an existing, unmodified route table and shell;
zero backend/Rules/config diff. **Rollback:** revert the single commit/PR; `team`/`terms` routes are
unaffected and `profile`/`locations` would simply return to Package B's `DashboardComingSoon`
placeholder, matching the pre-package state exactly.

## 40–44. Report path, changes-tracking, PR, head SHA, CI

- **Persistent report path:** this file.
- **Changes-tracking:** a matching entry was added to `docs/changes/IMPLEMENTATION_CHANGES.md`
  under `## ENG-P3-002-UI-IMP-C`.
- **PR:** [#179](https://github.com/Fkenogo/11THONUS/pull/179) — draft, from
  `feat/eng-p3-002-ui-imp-c` against `main`. Not self-merged.
- **Final head SHA:** `c6aa8f912c49f8079eb6bb3e45f544157f05bf1c`.
- **CI:** pending at the time of this report — see the PR's own Checks tab for current status.

## 45–47. Package/Capability status

- **Package C status:** implementation complete, tested, validated; pending Founder review. Not
  merged.
- **`ENG-P3-002` status:** unchanged — Open.
- **Capability 3 status:** unchanged — Open.

## 48. Exact next Founder action

Review this draft PR (Business Profile + Locations, Package C of `ENG-P3-002-UI-RECON-001`); if
approved, merge as a genuine merge commit (matching every prior PR in this chain except the
disclosed #177 deviation); Packages D/F/G/H remain unauthorized and not started.

---

## FINAL GATE

**ENG-P3-002-UI PACKAGE C READY FOR FOUNDER REVIEW — BUSINESS PROFILE + LOCATIONS (MGMT-02/03,
MAIN LOCATION ONLY) IMPLEMENTED; LATER PACKAGES NOT STARTED.**
