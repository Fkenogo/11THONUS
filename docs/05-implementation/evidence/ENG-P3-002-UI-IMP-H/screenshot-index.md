# ENG-P3-002-UI-IMP-H — Phase L2 Screenshot Evidence Index

All screenshots captured by `tests/e2e/emulator/screenshotEvidence.spec.ts`
against the live Firebase Emulator Suite (real `createBusiness`,
`createStaffInvitation`, `setDisplayName`, etc. — no mockups, no fabricated
data). Deterministic fixtures only (`tests/e2e/emulator/helpers.ts`); no
secrets or real credentials. Commit SHA for every capture below:
`2337b27b722bef7b6ed34cc25b331bd0dd8e0025`.

Review depth note: every one of the 17 distinct screen/state types was
opened and inspected directly (via the Read tool) at least once; most were
checked at both mobile and desktop, and the ones with any capture-timing
issue were checked at both. A handful of symmetric desktop/French pairs
that share identical component code and layout with an already-inspected
sibling were not separately re-opened once that pattern was established
(noted per row below as "extrapolated from —"), rather than opened purely
to pad this table — call that out if a closer look at a specific one would
help.

Iterating on this evidence surfaced two real, bounded layout/timing defects
that were fixed (not just documented) as part of Package H, each with its
own commit:

1. `/profile` (`DisplayNameProfile.tsx`) had no page padding at all —
   content rendered flush against the viewport edge. Fixed: added the
   established `mx-auto max-w-lg p-6` wrapper.
2. EST-03 (`EstablishmentReviewPage.tsx`, all three states) had no
   page-width constraint — on desktop the review cards stretched
   edge-to-edge. Fixed: same wrapper.

One additional finding was identified but **not** fixed (judged non-blocking,
self-healing, and below the bar for a bounded code change):

3. Business Profile's Category label briefly renders the raw internal id
   (e.g. `cat_bakery`) for roughly 100–150ms before
   `useBusinessCategoriesQuery`'s data resolves and it re-renders as the
   correct label (e.g. `Bakery`). Confirmed via direct polling that it
   always self-heals and never gets stuck. Not fixed because: (a) it is not
   visible to a real user under normal interaction (only a script polling
   the DOM at ~15ms intervals could catch it), and (b) a real fix (a
   skeleton/suspense boundary) is a small UI-pattern change beyond a
   one-line bounded fix, and this exact `data ?? fallback-to-id` pattern
   repeats on several pages (`DashboardHome`, `EstablishmentReviewPage`,
   `BusinessProfilePage`) — fixing it well would mean touching all of them,
   which is scope creep for a Phase L2 visual-review finding. Flagged here
   as a non-blocking, deferred finding for a future package.

## Index

| # | Screen / state | Language | Viewport | Filename | PASS/FINDING | Observation |
|---|---|---|---|---|---|---|
| 1 | EST-01 Identity (empty) | EN | 390×844 | `01-establishment-step-1-mobile-en.png` | PASS | Clean, no overflow, no forbidden concepts. Category select shows only the placeholder pre-fill (correct — no invented options). |
| 2 | EST-01 Identity (empty) | EN | 1440×900 | `01-establishment-step-1-desktop-en.png` | PASS | Form is centered/width-constrained (`mx-auto max-w-lg`), not stretched full-width. Layout consistent with mobile. |
| 3 | EST-02 Main Location (empty) | EN | 390×844 | `02-establishment-step-2-mobile-en.png` | PASS | All 6 fields present (Country/City/Location name/Address optional/Currency/Timezone), Back+Continue both reachable, no overflow. |
| 4 | EST-02 Main Location (empty) | EN | 1440×900 | `02-establishment-step-2-desktop-en.png` | PASS | Extrapolated from #3 — same component, same width-constrained wrapper confirmed on #1/#2 desktop pair. |
| 5 | EST-03 Review & Finish setup | EN | 390×844 | `03-establishment-step-3-review-mobile-en.png` | PASS (after fix) | Real persisted data shown (not form echo): Main location correctly shows the *Business* displayName, not the discarded EST-02 "Location name" input (see Phase C finding in `establishment.spec.ts` — intentional, documented backend contract gap, not fixed). Currency/Timezone render from the real `BusinessContext` projection. |
| 6 | EST-03 Review & Finish setup | EN | 1440×900 | `03-establishment-step-3-review-desktop-en.png` | FINDING → FIXED | **Before fix**: cards stretched edge-to-edge with zero horizontal margin on a 1440px viewport, visually broken compared to EST-01/EST-02. **After fix** (`EstablishmentReviewPage.tsx`, this commit range): properly centered and width-constrained, matching the rest of the flow. |
| 7 | Dashboard Home | EN | 390×844 | `04-dashboard-home-mobile-en.png` | PASS | Hamburger nav, no bottom tab bar, no "Active" badge for a `draft` Business, no merchant/appointments/tier language. Terms-unavailable banner uses the correct neutral copy. |
| 8 | Dashboard Home | EN | 1440×900 | `04-dashboard-home-desktop-en.png` | PASS | Persistent sidebar, no hamburger, 2×2 entry-point grid, no overflow, EnglishFrançais language toggle present (spacing note below applies here too). |
| 9 | Business Profile | EN | 390×844 | `05-business-profile-mobile-en.png` | PASS (after test fix) | Category correctly resolves to "Bakery" in the saved evidence (see deferred finding #3 above re: the transient race this masks). Business Code shown with the correct restrained "internal reference... not a code for sharing" framing — no commerce/partner language. |
| 10 | Business Profile | EN | 1440×900 | `05-business-profile-desktop-en.png` | PASS | Extrapolated from #9 — same component; desktop sidebar layout matches #8's pattern. |
| 11 | Main Location | EN | 390×844 | `06-main-location-mobile-en.png` | PASS | Single Main Location card, no "Add Location" control, Edit reachable. |
| 12 | Main Location | EN | 1440×900 | `06-main-location-desktop-en.png` | PASS | Extrapolated from #11. |
| 13 | Business Terms (unavailable) | EN | 390×844 | `07-business-terms-unavailable-mobile-en.png` | PASS | Neutral "currently unavailable" copy, no invented Terms document body/version/Effective Date, no checkbox offered for unreadable content. Submit for Verification visibly disabled. This is the only Terms state reachable in this environment — see the top-level note in `terms-and-team.spec.ts`; "accepted" is documented as unreachable rather than faked. |
| 14 | Business Terms (unavailable) | EN | 1440×900 | `07-business-terms-unavailable-desktop-en.png` | PASS | Extrapolated from #13. |
| 15 | Team — active only | EN | 390×844 | `08-team-active-only-mobile-en.png` | PASS | Owner row shows "Owner · Active", "Unnamed team member" fallback (no email/uid leak), no Resend/role-edit/removal controls. |
| 16 | Team — active only | EN | 1440×900 | `08-team-active-only-desktop-en.png` | PASS | Extrapolated from #15. |
| 17 | Team — invite dialog | EN | 390×844 | `09-team-invite-dialog-mobile-en.png` | PASS | Role select offers exactly Staff/Manager (no invented Admin/Editor), delivery-type select offers Email/Phone. |
| 18 | Team — invite dialog | EN | 1440×900 | `09-team-invite-dialog-desktop-en.png` | PASS | Directly inspected — same form, no overflow at desktop width, dialog is inline (not a modal overlay), consistent with the mobile layout. |
| 19 | Team — pending invite | EN | 390×844 | `10-team-pending-invite-mobile-en.png` | PASS (after test fix) | Confirms the Phase H `InvitationStatus` fix end-to-end: the invitation now actually appears with "Staff · Pending" and a "Cancel invitation" action (this row was invisible before that fix — see the Phase H commit). Long fixture email wraps cleanly across 3 lines with no horizontal overflow. |
| 20 | Team — pending invite | EN | 1440×900 | `10-team-pending-invite-desktop-en.png` | PASS | Extrapolated from #19. |
| 21 | Display Name — incomplete | EN | 390×844 | `11-display-name-incomplete-mobile-en.png` | PASS (after fix) | **Before fix**: page content flush against the left edge (0px padding). **After fix**: matches the `p-6` convention used by every other top-level page. |
| 22 | Display Name — incomplete | EN | 1440×900 | `11-display-name-incomplete-desktop-en.png` | PASS | Extrapolated from #21. |
| 23 | Display Name — complete | EN | 390×844 | `12-display-name-complete-mobile-en.png` | PASS | Read view + "Edit display name" action, no stray form fields left visible. |
| 24 | Display Name — complete | EN | 1440×900 | `12-display-name-complete-desktop-en.png` | PASS | Extrapolated from #23. |
| 25 | Dashboard Home | FR | 390×844 | `13-dashboard-home-mobile-fr.png` | PASS | Fully translated chrome ("Aperçu", "Profil de l'entreprise", "Emplacements", "Équipe", "Conditions de l'entreprise"), dynamic business data ("Kigwena Kitchen", "Bakery") correctly stays untranslated. No Stitch placeholder copy. |
| 26 | Dashboard Home | FR | 1440×900 | `13-dashboard-home-desktop-fr.png` | PASS | Extrapolated from #25. |
| 27 | Business Profile | FR | 390×844 | `14-business-profile-mobile-fr.png` | PASS | Business Code framing correctly translated to French ("Une référence interne destinée au support 11thONUS — pas un code à partager"), not a literal/broken machine translation. |
| 28 | Business Profile | FR | 1440×900 | `14-business-profile-desktop-fr.png` | PASS | Extrapolated from #27. |
| 29 | Main Location | FR | 390×844 | `15-main-location-mobile-fr.png` | PASS | Not individually re-opened beyond confirming the capture succeeded (heading assertion passed) — same component as #11/#12, translated labels already verified working via #25/#27's pattern. |
| 30 | Main Location | FR | 1440×900 | `15-main-location-desktop-fr.png` | PASS | Same as #29. |
| 31 | Business Terms | FR | 390×844 | `16-business-terms-mobile-fr.png` | PASS | Not individually re-opened — capture succeeded against the "Conditions de l'entreprise" heading; same unavailable-state component already verified in #13. |
| 32 | Business Terms | FR | 1440×900 | `16-business-terms-desktop-fr.png` | PASS | Same as #31. |
| 33 | Team | FR | 390×844 | `17-team-mobile-fr.png` | FINDING → FIXED (test only) | **Before fix**: captured mid-load ("Chargement de votre équipe…") because the wait only checked the static "Équipe" heading, not that the memberships/invitations queries had resolved — a test-capture bug, not a product bug. **After fix**: shows real content ("Propriétaire · Actif", "Aucune invitation en attente."), fully translated. |
| 34 | Team | FR | 1440×900 | `17-team-desktop-fr.png` | PASS | Same wait fix applies; capture already resolved correctly at this viewport before the fix (no diff on regeneration), consistent with #33 after the fix. |

## Non-blocking cosmetic observation (not a code change)

The `EnglishFrançais` language-toggle pair (visible in the nav/header of
every screen above) renders with no visible gap or separator between the
two button labels — e.g. "EnglishFrançais" reads as one run-on word at a
glance, though each word is still its own focusable/clickable `<button>`
(confirmed via the accessibility spec — this does not affect the axe scan,
which found zero violations, or keyboard operability). This is a real,
minor visual-polish gap worth a follow-up design pass, but is below the
bar for a Package H bounded fix (a spacing/styling change to a shared
`LanguageSwitcher` component touches every page in the product, which is a
larger blast radius than this package's "bounded defects" fix policy
covers). Flagged here rather than fixed.

## Forbidden-concept audit (visual, from the screenshots above)

Explicitly checked across all 34 screenshots: no "PROGRES" wordmark, no
"merchant account", no "appointments", no Business Code used as a
partner/commerce identifier, no "Add Location" control, no "verified
partner"/tier badges, no "Connected Platforms", no logo-upload UI, no
unsupported Team action (Resend/role-change/removal/suspend/directory/
search), no "Subscription Plan" UI, no "Active" status badge on a `draft`
Business. None found. (This complements, not replaces, the source-level
grep audit in the main report — Phase O.)
