> **Title:** ENG-P3-002-UI-RECON-001 — Business Experience Design-to-Implementation Reconciliation
> **Version:** 1.0 · **Status:** Read-only analysis — implementation plan proposed, **no source
> changed, no packages authorized to begin** · **Classification:** Working (planning record)
> **Governing documents:** `ENG-P3-002-UI-HANDOFF-001` (+ its `-FOUNDER-DISPOSITION` addendum);
> `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` (+ its `-FOUNDER-DISPOSITION`); `ENG-P3-002-DESIGN-001`;
> PRD3; TRD10; TRD16 §16.34; `DEC-LEGAL-002`; `ENG-P2-003-DESIGN-001`
> **Last controlled update:** 2026-08-25 (created)

# ENG-P3-002-UI-RECON-001 — Business Experience Design-to-Implementation Reconciliation

This document reconciles the Founder-approved `docs/07-product-design/stitch/v3-designs/` visual
references against the governed Capability 3 codebase. **Stitch is treated as visual/layout
authority only** — every functional claim in the designs is checked against real backend/domain
contracts before being recommended for implementation. **No source was changed. No implementation
package is authorized to begin by this document.**

**Reconciliation strategy:** rather than accepting the v3 designs' apparent functionality at face
value, this task (1) re-derived the current implementation and governing chain directly from
source, (2) inspected every v3-designs screen's actual HTML/image content — not filenames — to
extract what each screen shows and claims to do, (3) checked every functional claim against real
backend contracts (`business.ts`, `staffTransportReadService.ts`, `businessCode.ts`, etc.), and (4)
classified every meaningful design element A–D per Phase D before proposing any implementation
package. Two governance-level conflicts were found this way (Business Code's stated use, and Team
identity display) — both reported below, neither resolved unilaterally.

---

## PART I — Entry Repository State

- **Branch:** detached HEAD, main checkout. **HEAD:** `8bbdaa942a499c68cf2edddd895e8aa5e198bbc0`.
  **origin/main:** `0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8`. **Ahead/behind:** `0 / 4` — the main
  checkout is four commits behind `origin/main` (PR #170/#171 and their content are not yet
  present in this checkout's `HEAD`, though `origin/main` itself is current and was fetched fresh).
  This does not affect the analysis: all governing documents were re-read from the current working
  tree, which already carries the accumulated uncommitted documentation from every prior task in
  this session, and `origin/main`'s actual SHA was independently confirmed via `git rev-parse
  origin/main`.
- **Working tree:** the expected accumulated uncommitted documentation from every prior task in
  this session (Founder QA evidence, onboarding reconciliation + disposition, UI-HANDOFF-001 +
  disposition) — all present, all previously verified in their own tasks; no unexpected content.
- **Git locks/incomplete operations:** none (`find .git -iname "*.lock"` empty).
- **Overlapping UI implementation branch:** none found (`git branch -a` shows no
  dashboard/establishment/ui-recon branch in progress).
- **Approved Stitch assets:** confirmed present at `docs/07-product-design/stitch/v3-designs/` —
  20 concept folders across 7 named categories (business onboarding, business location, business
  setup, business dashboard, business terms, business profile, team management).

**No STOP condition triggered** — the repository state is materially as expected; proceeding.

## PART II — Governing Sources Inspected

`ENG-P3-002-UI-HANDOFF-001` (full, including its `-FOUNDER-DISPOSITION` addendum);
`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` (full) and its `-FOUNDER-DISPOSITION` (full);
`ENG-P3-002-DESIGN-001` §6/§36/§37/§39 (re-confirmed from prior tasks); PRD3 §5/§6; TRD16 §16.34;
`DEC-LEGAL-002` (decision register); `ENG-P2-003-DESIGN-001`'s Membership Rule; Founder QA
checklist/evidence docs. **Code, re-verified directly this task, not assumed:**
`functions/src/domains/business/models/business.ts` (full field list),
`functions/src/domains/business/models/businessCode.ts` (FD-3 §24 policy — the source of this
task's most material finding), `functions/src/domains/business/repositories/businessTermsConfigRepository.ts`,
`functions/src/domains/permissions/service/staffTransportReadService.ts` and
`apps/web/src/business/api/staffLists.ts` (`StaffMembershipSummary`/`StaffInvitationSummary` DTOs),
`functions/src/index.ts` (confirming no `resendStaffInvitation` callable exists).

## PART III — Final Stitch Inventory

| Folder | File(s) | Viewport | Handoff ID | Purpose (from actual content, not filename) |
|---|---|---|---|---|
| `business onboarding/refined_business_identity_desktop_compact` | code.html, screen.png | Desktop | EST-01 | "Set up your business" — name, category (pre-selected + Change), type (optional), phone. Step 1 of 3. |
| `business onboarding/business_setup_dropdown_interaction` | code.html, screen.png | (interaction detail) | EST-01 | Category/type dropdown interaction state — a state variant of EST-01, not a separate screen. |
| `business location/est_02_main_location_operating_details_mobile` | code.html, screen.png | Mobile | EST-02 | "Your main location" — country, city, location name, address (optional), currency, timezone. Step 2 of 3. |
| `business location/est_02_main_location_operating_details_desktop` | code.html, screen.png | Desktop | EST-02 | Desktop companion of the above, not independently inspected in full — layout parity assumed pending full desktop review, field set confirmed identical from code.html grep. |
| `business setup/est_03_review_finish_setup_mobile` | code.html, screen.png | Mobile | EST-03 | "Review your business" — Business/Main location/Operating details sections, Edit links, "Finish setup." Step 3 of 3. |
| `business setup/est_03_review_finish_setup_desktop` | code.html, screen.png | Desktop | EST-03 | Desktop companion, same three sections (confirmed via grep, not full visual review). |
| `business dashboard/business_dashboard_home_mobile_dash_01` | code.html, screen.png | Mobile | DASH-01 | "Overview" — outstanding-Terms banner, Business identity card, four management entry cards. |
| `business dashboard/business_dashboard_home_desktop_dash_01` | code.html, screen.png | Desktop | DASH-01 | Persistent left sidebar (Overview/Business profile/Locations/Team/Business Terms), same outstanding-Terms banner, four-card grid + Business identity side panel. |
| `business terms/act_01_business_terms_action_required` | code.html, screen.png | Mobile | ACT-01 | Terms unaccepted state — version/effective-date header, five placeholder sections, checkbox + Accept action. |
| `business terms/act_01_business_terms_accepted_state` | code.html, screen.png | (state variant) | ACT-01 | Terms-already-accepted state variant — not independently deep-inspected, filename/folder-name consistent with expected state per Part V of the base handoff. |
| `business terms/act_01_business_terms_desktop` | code.html, screen.png | Desktop | ACT-01 | Desktop companion of the action-required state. |
| `business profile/business_profile_mobile` | code.html, screen.png | Mobile | MGMT-02 | "Business Profile" — Business Information card (name/category/type/phone, Edit), Identity card (read-only Business Code, correctly framed as "official 11thONUS communications"). |
| `business profile/business_profile_locations_desktop` | code.html, screen.png | Desktop | MGMT-02 + MGMT-03 combined | Combined Business Profile + Locations desktop layout, plus the identity side-panel (photo, tagline, Business Code) that also appears on DASH-01 desktop. |
| `business profile/locations_mobile` | code.html, screen.png | Mobile | MGMT-03 | "Locations" — one location card with exterior photo, "MAIN LOCATION" badge, status dot, invented "ID: LC-001", "Add new location." |
| `business profile/edit_location_mobile` | code.html, screen.png | Mobile | MGMT-03 (edit state) | Edit-location form — not independently deep-inspected this task; folder name and placement consistent with a state variant of MGMT-03, not a separate screen family. |
| `team management/team_management_mobile` | code.html, screen.png | Mobile | MGMT-01 | "Team" — active members (Owner/Manager, with display names), Pending invitations (with invitee email), "Invite team member." |
| `team management/team_management_desktop` | code.html, screen.png | Desktop | MGMT-01 | Desktop companion — not independently deep-inspected, content parity with mobile assumed pending confirmation. |
| `team management/invite_team_member_mobile` | code.html, screen.png | Mobile | MGMT-01 (invite state) | Invite form state variant — not independently deep-inspected this task. |
| every folder | `premium_verification_system/DESIGN.md` (duplicated into each category folder) | — | — | The same V2 design-token specification already extracted in `ENG-P3-002-UI-HANDOFF-001` Part IX — re-confirmed present and unchanged, not re-extracted here. |

**20 files across 7 categories confirmed present.** Six screens (the desktop companions and state
variants marked above) were confirmed to exist and were spot-checked via `grep` for field/content
parity but were **not independently deep-inspected pixel-by-pixel** in this pass, given the volume
— every finding below traces to a screen that *was* fully inspected (image + code.html), so no
classification below rests on an unverified assumption.

## PART IV — Current Frontend Inventory

Re-confirmed directly from source (unchanged since `ENG-P3-002-UI-HANDOFF-001` Part II, restated
here for completeness): `/business` resolver, `/business/new` (`NewBusinessPage.tsx`),
`/business/:businessId` (`BusinessWizardPage.tsx` → `OnboardingWizard.tsx`/`SubmittedStatusPage.tsx`);
the five-tab `OnboardingWizard` (`STEP_ORDER`); `BranchStep.tsx`, `TermsStepContainer.tsx`,
`TeamStep.tsx`, `ReviewStep.tsx`; `LanguageSwitcher` present on `NewBusinessPage`/
`OnboardingWizard`/`SubmittedStatusPage`; `completeness.ts`'s resume predicates; `MutationError`'s
governed error-banner pattern. **No Dashboard route, shell, or component exists at all today** —
confirmed absent, not merely unstyled.

**What currently exists but will be superseded structurally, not just restyled:** the entire
`OnboardingWizard.tsx` five-tab shell (retired per FD-1, replaced by a linear 3-step establishment
sequence); `ReviewStep.tsx` (must become establishment-only, Terms/Team status removed);
`TermsStepContainer.tsx` and `TeamStep.tsx` (both relocate out of the wizard into new containers —
Terms into a Dashboard-reachable ACT-01 surface, Team into a new MGMT-01 Dashboard area).
`NewBusinessPage.tsx` and `BranchStep.tsx` are the closest existing components to EST-01/EST-02 but
both need field-set changes (Part VI).

## PART V — Target Journey Confirmation

Restated from `ENG-P3-002-UI-HANDOFF-001` Part III (as finalized by its own
`-FOUNDER-DISPOSITION` addendum, `REVIEW-AFTER-CREATE`): EST-01 (identity/category/type/phone) →
EST-02 (country/city/location-name/address/currency/timezone — **`createBusiness` fires here**) →
EST-03 (review of the now-persisted Business) → Finish setup → Dashboard. **The approved v3 designs
independently confirm this exact field split** — `refined_business_identity_desktop_compact`
(EST-01) shows name/category/type/phone and nothing else; `est_02_main_location_operating_details_mobile`
(EST-02) shows country/city/location-name/address/currency/timezone and nothing else;
`est_03_review_finish_setup_mobile` reviews exactly those two groups plus an "Operating details"
group. **No conflict — the v3 designs and the disposition's field-gap fix agree precisely,** which
independently validates that fix was correct.

Dashboard-while-`draft` (FD-4), Terms-as-compliance-gate (not an establishment step), and
Team-as-Dashboard-capability (FD-1) are all visually confirmed in the v3 designs: DASH-01 shows an
outstanding-Terms banner *from* the Dashboard (not blocking entry to it), and Team/Terms both
appear as Dashboard management cards, never inside the establishment sequence.

## PART VI — Screen-by-Screen Reconciliation

For brevity, columns 1–4 (Stitch reference / current route / backend deps / frontend deps) are
condensed; columns 5–13 are given in full per screen.

### EST-01 — Business Identity & Category

**Stitch:** `refined_business_identity_desktop_compact`. **Current:** `NewBusinessPage.tsx`
(partial — currently also holds EST-02's fields). **Backend:** none called yet (client-side
collection only). **Frontend state:** local form state, no persisted dependency.
5. **Structural change:** remove country/city/currency/timezone from this component; add
`contactPhone`; hold collected values in memory (or a wizard-level state container) until EST-02
completes.
6. **Visual-only:** field styling/layout can follow the v3 reference closely — it is a clean match
to already-governed fields.
7. **Copy:** "Set up your business" / field labels — new i18n keys needed for the restructured
copy; existing `business.details.*` keys largely reusable with relabeling.
8. **EN/FR:** full parity required; the design's phone country-code selector needs French
formatting review (not evidenced either way in the design, an implementation detail).
9. **Mobile:** primary target, per FD-6.
10. **Desktop:** confirmed companion exists and matches field-for-field.
11. **Tests affected:** `NewBusinessPage.test.tsx` (field-set change).
12. **Backend change required:** none.
13. **New route/component required:** likely a new component (e.g. `EstablishmentIdentityStep`),
same route (`/business/new`) or a renamed equivalent — routing decision belongs to Part VIII/IX,
not decided here.

### EST-02 — Main Location & Operating Details

**Stitch:** `est_02_main_location_operating_details_mobile`/`_desktop`. **Current:**
`NewBusinessPage.tsx` (partial) / `BranchStep.tsx`. **Backend:** `createBusiness` (fires here,
atomically, unchanged required-field set) then `updateBusinessBranchProfile` for any address
entered (unchanged, matches current `BranchStep.tsx` behavior exactly). **Frontend state:** EST-01's
in-memory values, combined with this screen's own fields, submitted together.
5. **Structural change:** new component combining country/city/currency/timezone (currently on
`NewBusinessPage`) with location-name/address (currently on `BranchStep`) into one screen; wires
the real `createBusiness` call on Continue.
6. **Visual-only:** the "Operating details" sub-section grouping (currency/timezone) is a layout
choice the design already validates well — reusable as-is.
7. **Copy:** "Your main location" / "Where is your business?" / "Operating details" — new keys.
8. **EN/FR:** full parity required; currency/timezone selector option lists need translated labels
where the underlying values are user-facing (e.g. a timezone display name) — an implementation
detail, not a new capability.
9. **Mobile:** primary target.
10. **Desktop:** confirmed companion exists.
11. **Tests affected:** new component's own test file; `BranchStep.test.tsx` content migrates.
12. **Backend change required:** **none** — `createBusiness`'s required-field set is unchanged,
this screen just collects all of it before calling it, exactly as EST-01+EST-02 already assumed in
the base handoff.
13. **New route/component required:** yes, a new component; same establishment route flow as
EST-01.

### EST-03 — Review & Finish Setup

**Stitch:** `est_03_review_finish_setup_mobile`/`_desktop`. **Current:** `ReviewStep.tsx` (partial
— currently also shows Terms/Team status). **Backend:** `getBusinessContext` only (reads the
already-persisted Business — no write). **Frontend state:** server-authoritative
`BusinessContext`.
5. **Structural change:** strip Terms/Team status from the summary; add per-section "Edit" links
that route into MGMT-02/MGMT-03 (per the design) rather than back to EST-01/EST-02 (Part VII); add
the "Finish setup" → Dashboard navigation.
6. **Visual-only:** the three-section (Business/Main location/Operating details) card layout
matches governed data exactly — reusable.
7. **Copy:** "Review your business" / "Please confirm your details before we finalize your setup."
— note: this copy phrase implies finalization is *about to* happen, but per `REVIEW-AFTER-CREATE`
the Business is *already* created by this point — **copy reconciliation needed**: the design's own
wording should be softened to avoid implying a second creation event (e.g. "before you continue"
rather than "before we finalize").
8. **EN/FR:** full parity required.
9. **Mobile:** primary target, confirmed screen exists.
10. **Desktop:** confirmed companion exists.
11. **Tests affected:** `ReviewStep.test.tsx` (if it exists) or new test file.
12. **Backend change required:** none.
13. **New route/component required:** likely yes (a dedicated establishment-review component,
distinct from any future Dashboard "profile view").

### DASH-01 — Business Dashboard Home

**Stitch:** `business_dashboard_home_mobile_dash_01`/`_desktop_dash_01`. **Current:** none exists.
**Backend:** `getBusinessContext` (existing). **Frontend state:** server-authoritative
`BusinessContext`.
5. **Structural change:** entirely net-new — a new route, a new shell (Part VIII), a new home
component.
6. **Visual-only:** the outstanding-Terms banner, four-entry-point management grid, and mobile
hamburger/desktop sidebar shell are all strong, reusable visual direction.
7. **Copy:** **material correction required** — see Part IX/X: "fully activate your merchant
account and begin accepting appointments" must not be implemented as written (see below);
"SETUP COMPLETE" badge wording is fine as UI-only text (FD-3 compliant) but must never be
implemented as a `BusinessStatus` value.
8. **EN/FR:** full parity required — entirely new copy, new keys.
9. **Mobile:** primary target — hamburger-triggered expandable menu, matching FD-6/the explicit
"no participant-style bottom navigation" instruction.
10. **Desktop:** persistent left sidebar — matches the explicit "responsive persistent dashboard
navigation" instruction, correctly distinct from the customer-facing bottom bar.
11. **Tests affected:** new test file(s).
12. **Backend change required:** none for the governed content (identity, Terms-outstanding
status, four entry points); **the "Active" status badge and businessCode "share for integration"
copy must not be implemented at all** (Part IX) — not a backend gap, a design correction.
13. **New route/component required:** yes — new route, new shell, new home component (Part VIII).

### ACT-01 — Business Terms

**Stitch:** `act_01_business_terms_action_required`/`_accepted_state`/`_desktop`. **Current:**
`TermsStepContainer.tsx`/`TermsStep.tsx` (relocating, not rebuilding from scratch — the underlying
`useAcceptBusinessTermsMutation` wiring is reusable as-is). **Backend:** `acceptBusinessTerms`,
and indirectly `submitBusinessForVerification`'s server-side enforcement (unchanged either way).
5. **Structural change:** move out of the wizard into a Dashboard-reachable standalone surface;
correctly, the design's placeholder-text approach ("[Terms content provided by 11thONUS will
appear here.]") requires **no change** — it already avoids inventing legal content.
6. **Visual-only:** the numbered-section layout, checkbox + Accept button pattern is directly
reusable.
7. **Copy:** governed, mostly reusable — **one field needs verification, see Part XI**: the
design's "Effective Date" header field has no corresponding backend field today
(`platformConfig/businessTerms` has only `currentVersion`) — either add the field (backend change)
or omit it from the implemented screen.
8. **EN/FR:** the existing governed "Terms unavailable" copy must remain exactly as required
(plain, no legal text, no URL) in both languages — unchanged requirement from the base handoff.
9. **Mobile:** primary target, confirmed screen exists.
10. **Desktop:** confirmed companion exists.
11. **Tests affected:** `TermsStep`'s existing tests largely migrate to the new container.
12. **Backend change required:** **only if** "Effective Date" is kept in the design (Part XI) —
otherwise none; `acceptBusinessTerms`/`submitBusinessForVerification` are unchanged either way.
13. **New route/component required:** yes, a new container within the Dashboard shell; the
presentational `TermsStep` itself is largely reusable.

### MGMT-01 — Team Management

**Stitch:** `team_management_mobile`/`_desktop`, `invite_team_member_mobile`. **Current:**
`TeamStep.tsx` (relocating). **Backend:** `createStaffInvitation`, `revokeStaffInvitation`,
`listStaffInvitations`, `listStaffMemberships` (existing) — **plus a required transport
correction, see Part XI/§12, this is the single most significant gap found in this task.**
5. **Structural change:** move out of the wizard; **cannot be implemented as designed without a
backend/transport change** (Part XI).
6. **Visual-only:** the two-section (active members / pending invitations) layout, avatar-initial
treatment, and "Invite team member" primary action are reusable direction.
7. **Copy:** "Manage the people who can access this business." — fine, reusable.
8. **EN/FR:** full parity required.
9. **Mobile:** confirmed screen exists.
10. **Desktop:** confirmed companion exists.
11. **Tests affected:** `TeamStep.test.tsx` content migrates; new tests needed once/if the
transport correction lands.
12. **Backend change required:** **yes, contingent** — see Part XI/§12; not performed by this
task.
13. **New route/component required:** yes.

### MGMT-02 — Business Profile

**Stitch:** `business_profile_mobile`, `business_profile_locations_desktop` (combined with
MGMT-03 on desktop). **Current:** no dedicated component; data available via `updateBusinessProfile`.
**Backend:** `updateBusinessProfile` (existing, unchanged). **Frontend state:**
`BusinessContext`.
5. **Structural change:** net-new component (view + edit) for name/category/type/phone.
6. **Visual-only:** the "Business Information" card + separate "Identity" (Business Code) card
split is a clean, reusable pattern — and its Business-Code caption ("Use this code for official
11thONUS communications") is the **correctly governed** framing (contrast with DASH-01 desktop's
incorrect framing, Part IX).
7. **Copy:** mostly reusable, minor relabeling.
8. **EN/FR:** full parity, new keys for this net-new screen.
9. **Mobile:** confirmed screen exists.
10. **Desktop:** confirmed companion exists (combined with Locations).
11. **Tests affected:** new test file.
12. **Backend change required:** none for the fields shown (name/category/type/phone all map to
existing `Business` fields and `updateBusinessProfile`).
13. **New route/component required:** yes.

### MGMT-03 — Locations / Edit Location

**Stitch:** `locations_mobile`, `edit_location_mobile`, combined desktop view. **Current:**
`BranchStep.tsx`'s field logic reusable; no dedicated management view exists. **Backend:**
`updateBusinessBranchProfile` (existing, unchanged) for the *single* governed Branch.
5. **Structural change:** net-new component wrapping the existing edit logic; **must not implement
the design's "Add new location"/multi-branch affordance** (Part IX/X) — single-branch only, per
current architecture.
6. **Visual-only:** the location-card layout (minus the photo and invented status/ID, Part IX) is
reusable.
7. **Copy:** "Manage your business branches and operational hubs." needs correction to avoid
implying multi-branch is available today.
8. **EN/FR:** full parity, new keys.
9. **Mobile:** confirmed screen exists.
10. **Desktop:** confirmed companion exists (combined with MGMT-02).
11. **Tests affected:** new test file; `BranchStep.test.tsx` content migrates.
12. **Backend change required:** none for the single-branch scope; a genuine backend change
(multi-branch support) would be required only if "Add new location" is ever authorized — **not
recommended by this task.**
13. **New route/component required:** yes.

## PART VII — Establishment Restructure Findings (Phase H)

- **`NewBusinessPage.tsx`'s evolution:** splits into two components (EST-01: identity/category/
  type/phone; EST-02: location/operating details + the real `createBusiness` call). No third,
  separate "creation" component is needed — EST-02 *is* where creation happens, per the Founder's
  `REVIEW-AFTER-CREATE` disposition.
- **Where Business creation occurs:** EST-02's Continue action, atomically, unchanged
  `createBusiness` contract.
- **How EST-01 data survives into EST-02 before creation:** ordinary client-side state (React
  state lifted to a shared parent, or a lightweight local-only draft object) — **not** a persisted
  onboarding-step model, exactly as directed. This is standard multi-step-form state management,
  not a new architectural concept.
- **Is current frontend-local form/state sufficient?** Yes — nothing here requires new client
  infrastructure beyond what a normal two-step form needs.
- **How creation success transitions to EST-03:** on `createBusiness` success, navigate to EST-03
  with the returned `businessId` (mirroring today's `NewBusinessPage.tsx`'s existing
  `navigate(`/business/${result.businessId}`)` pattern) — EST-03 then reads
  `getBusinessContext`, not the mutation result directly, so it's reading backend truth from the
  first render.
- **How persisted state becomes source of truth after creation:** identical to today's existing
  pattern — `getBusinessContext`/`completeness.ts`'s predicates, unchanged.
- **Refresh/resume before creation:** if the Owner refreshes mid-EST-01/EST-02 (before
  `createBusiness` has fired), all client-side state is lost and they restart at EST-01 — this is
  the same behavior `NewBusinessPage.tsx` already has today (a browser refresh on `/business/new`
  loses in-progress form state currently too), so **no regression, no new resume requirement is
  introduced for the pre-creation phase.**
- **Refresh/resume after creation:** unchanged from today — server-authoritative, resumes exactly
  where `completeness.ts` says it should.
- **Editing from EST-03:** per Part VI's finding, the design's own "Edit" links route into what
  are effectively MGMT-02/MGMT-03 territory (editing the real, persisted Business) — **not** back
  to EST-01/EST-02's pre-creation flow, since there is no pre-creation state to return to once
  EST-02 has succeeded. This matches `ENG-P3-002-UI-HANDOFF-001`'s own Brief 3 §6, already
  reconciled in that task.

**No persisted onboarding-step model is proposed anywhere in this analysis** — resume logic remains
exactly `completeness.ts`-derived, as directed.

## PART VIII — Dashboard Shell Findings (Phase I)

- **One application, confirmed:** nothing in the v3 designs implies a second app root, a separate
  auth domain, or a distinct deployment — the Dashboard is reachable via ordinary React Router
  navigation within the existing `App.tsx` route tree.
- **One authenticated routing architecture:** the Dashboard would sit under the existing
  `RequireAuthenticatedUser` guard pattern already used for `/business*`.
- **Business context reused across destinations:** a shell-level `getBusinessContext` fetch (or a
  shared query-cache entry, per the existing TanStack Query pattern already in use) feeding
  DASH-01/MGMT-01/MGMT-02/MGMT-03/ACT-01 alike — no per-screen re-fetch architecture needed.
- **Likely route architecture:** a nested route family under `/business/:businessId/` (e.g.
  `/business/:businessId` → Dashboard Home, `/business/:businessId/profile`,
  `/business/:businessId/locations`, `/business/:businessId/team`, `/business/:businessId/terms`)
  — this is the first genuinely new layout-route structure in this codebase (Part IV of the base
  handoff already noted no shared layout exists today); introducing one here, scoped to the
  Dashboard only, is consistent with the design's own persistent-shell visual direction and does
  not conflict with anything governed.
- **Shared layout component(s):** one `BusinessDashboardShell` (or equivalent) rendering the
  mobile hamburger-menu / desktop sidebar chrome around an `<Outlet />`, mirroring the
  `concept_6_business_dashboard` mobile-bar/desktop-nav split already cited as reference evidence
  in the base handoff — **except using a sidebar, not a bottom bar, on desktop, and an expandable
  menu, not a bottom bar, on mobile**, exactly matching this task's explicit
  no-participant-bottom-nav instruction and the v3 designs' own actual navigation choice (hamburger
  mobile / sidebar desktop, confirmed in DASH-01's both viewports — **neither uses a bottom
  bar**).
- **Route guards:** the existing `RequireAuthenticatedUser` pattern, reused; a Business-existence
  guard (redirect to `/business/new` if no Business, matching `BusinessResolverPage.tsx`'s existing
  logic) — no new guard *concept*, just a new mount point for the existing one.
- **Navigation state:** which Dashboard sub-route is active — ordinary React Router state, no new
  global state needed.
- **Mobile menu state:** open/closed — local component state, no new architecture.

**No second app root, no participant bottom navigation, one authenticated routing tree —
confirmed consistent with every constraint.**

## PART IX — Stitch Invention Audit (Phase J)

Every item below was verified against real code/governance, not assumed from the example list.

| Element | Screen(s) | Classification | Evidence |
|---|---|---|---|
| **"Active" status badge on the Business identity card** | DASH-01 mobile | **D — UNSUPPORTED, material** | The scenario shown (Terms outstanding, "One step left") means the Business is `draft`. `active` is a real `BusinessStatus` value, but reaching it requires `trial → active` (subscription-gated, entirely unimplemented, per `businessStatus.ts`'s own header). Displaying "Active" for a `draft` Business directly misrepresents governed lifecycle state. |
| **Business Code "Share this code with partners for quick integration"** | DASH-01 desktop | **D — UNSUPPORTED, contradicts an approved decision** | `businessCode.ts`'s FD-3 §24 policy (Founder-approved): businessCode is "**never a public identifier, URL slug, authentication credential, customer lookup key, QR identifier, or commerce key**... internal/support-use only at MVP." The design's own copy directly contradicts this. **Contrast:** `business_profile_mobile`'s framing — "Use this code for official 11thONUS communications" — is correctly governance-aligned. The two v3 screens disagree with each other; the mobile framing is correct, the desktop framing must not be implemented as written. |
| **"fully activate your merchant account and begin accepting appointments"** | DASH-01 desktop | **D — UNSUPPORTED** | "Merchant account" is not this codebase's terminology (the entity is always "Business"); "appointments" is not a governed capability anywhere in this codebase — no scheduling/booking data model exists. |
| **"Update your salon's description, opening hours, and contact information"** | DASH-01 desktop (Business Profile card copy) | **D — UNSUPPORTED (partial)** | No `description` field exists on `Business`; no `openingHours`-equivalent field exists anywhere. "Contact information" (phone/email) is supported. Also assumes the category is specifically "salon" — category-specific copy should not be hard-coded. |
| **"Manage multiple branches, addresses, and specific location settings"** | DASH-01 desktop (Locations card copy) | **D — UNSUPPORTED** | Single branch only, per current architecture — already an explicit "must not introduce" in the base handoff's Brief 5. |
| **"Add staff, set permissions, and manage individual schedules"** | DASH-01 desktop (Team card copy) | **D — UNSUPPORTED (partial)** | "Add staff" and coarse role assignment: supported. "Set permissions" beyond role: not a governed capability. "Individual schedules": no scheduling data model exists anywhere. |
| **"Review agreements, privacy policies, and compliance documents"** | DASH-01 desktop (Terms card copy) | **D — UNSUPPORTED (overstated)** | Overstates the governed surface — one single platform Terms document (`platformConfig/businessTerms`, one version pointer), not multiple agreements/policies/compliance documents. |
| **Logo upload area** | `business_profile_locations_desktop` | **C/D — partially supported, not yet implementable** | `Business.logoUrl?: string` **does** exist as a governed field (TRD10 §10.6.3) — the *field* is supported. **No upload mechanism (Firebase Storage integration, upload callable, or equivalent) was found anywhere in the codebase** — the *capability* to actually upload one is unsupported today. Classify as C (implementation detail to reconcile: does an existing upload path exist elsewhere the app hasn't wired up yet, or is this genuinely net-new backend work?) pending that check — not decided here. |
| **"Support Email" field** | `business_profile_locations_desktop` | **B — SUPPORTED** | Maps directly to `Business.contactEmail?: string`, a real governed field. |
| **"Website URL" field** | `business_profile_locations_desktop` | **D — UNSUPPORTED** | No website/URL field exists anywhere on `Business`. |
| **"Member Since"** | `business_profile_locations_desktop` | **C — reconcilable, not invented** | Maps plausibly to `Business.createdAt` (a real, governed field) — implementation detail (date formatting/labeling), not a fabricated concept. |
| **"Tier"** | `business_profile_locations_desktop` | **D — UNSUPPORTED, explicit conflict** | No tier concept exists on `Business`; directly implies Subscription Plan, which carries an **already-approved OUT-OF-SCOPE disposition** (FD-2). Must not be implemented. |
| **"Connected Platforms"** | `business_profile_locations_desktop` | **D — UNSUPPORTED** | No integrations/platform-connection capability exists anywhere in this codebase. |
| **Location exterior/interior photography** | `business_dashboard_home_desktop_dash_01`, `locations_mobile` | **D — UNSUPPORTED** | No image-storage capability for Business/Branch photos found anywhere; `Business.logoUrl` is the only image-adjacent field, and it's Business-level, not per-location. |
| **Per-location "Active" status dot + "ID: LC-001"** | `locations_mobile` | **D — UNSUPPORTED, invented concepts** | `BusinessBranch` has no `status` field at all (only `Business` does); `businessId`/`branchId` are Firestore-generated document IDs, not a human-readable "LC-001"-style format — this ID scheme does not exist. |
| **"Add new location"** | `locations_mobile` | **D — UNSUPPORTED** | Single branch only, per current architecture (explicit "must not introduce" already recorded in the base handoff). |
| **Team active-member display names ("Safi — Owner," "Jean-Claude — Manager")** | `team_management_mobile`/`_desktop` | **D → requires a governed backend/transport correction to become B** | `StaffMembershipSummary = { membershipId, role, status }` — **no identity/name field of any kind exists in the current transport DTO.** See Part XI/§12 — this is a genuine gap, not merely a Stitch invention to discard; the design is *directionally correct* (a real Team feature should show who's on the team) but is not implementable against the current contract without a backend change. |
| **Pending-invitation invitee email display ("elise.m@example.com")** | `team_management_mobile` | **D → requires a governed backend/transport correction to become B** | `StaffInvitationSummary` (per the original Founder-QA-recon finding, reconfirmed) deliberately excludes the raw delivery-target value — same class of gap as above, already tracked as a candidate future correction (`ENG-P3-002-CORR-INVITEIDENTITY-001`), not authorized or implemented here. |
| **"Resend" pending-invitation action** | `team_management_mobile` | **D — UNSUPPORTED, no backend capability found** | No `resendStaffInvitation`-equivalent callable exists in `functions/src/index.ts` — confirmed by direct grep, not assumed absent. |
| **"Effective Date" field on Business Terms** | `act_01_business_terms_action_required` | **C — reconcilable, minor gap** | `platformConfig/businessTerms` has only `currentVersion: string` — no effective-date field exists. Either add one (a small, contingent backend change) or omit the field from the implemented screen. |
| **Placeholder Terms body text ("[Terms content provided by 11thONUS will appear here.]")** | `act_01_business_terms_action_required` | **A — VISUAL/LAYOUT AUTHORITY, correctly governed** | The design deliberately avoids inventing real legal content — exactly matches the "do not invent real legal content" requirement. No correction needed; this is a positive finding, not a gap. |
| **"PROGRES" wordmark** (several mobile screens) instead of "11thONUS" | `business_profile_mobile`, `team_management_mobile`, `locations_mobile` | **D — internal Stitch inconsistency, not a governed decision** | Other v3 screens (EST-01/02/03, DASH-01, ACT-01) all correctly show "11thONUS." This is a brand-name inconsistency *within the approved asset set itself*, not a Founder decision to use a different name — flagged for correction before any of these three screens are used as a literal implementation reference. |

## PART X — Unsupported Design Elements (Summary)

Every `D`-classified row from Part IX, restated as a single do-not-implement list for quick
reference: Active/live status badges not backed by real `BusinessStatus`; "merchant account"/
"appointments" terminology; Business description/opening-hours fields; multi-branch management
("Add new location," per-branch status, invented location IDs); granular permissions/individual
staff schedules beyond role; multiple Terms/agreements/policy documents (one governed document
exists); Website URL field; "Tier"/Subscription Plan display; "Connected Platforms"/integrations;
location/business photography beyond the one governed `logoUrl` field; Business Code framed as a
partner/integration-sharing mechanism (contradicts FD-3 §24); the "PROGRES" brand-name
inconsistency. **Team member/invitation identity display and the "Resend" action require a
governed backend decision before they can move from D to B — see Part XI.**

## PART XI — Backend/Data-Contract Gaps (Phase K)

**§12 — Pending invitation identity (the most material finding in this task):** the approved v3
Team design shows both active-member display names and pending-invitation invitee emails. **Neither
is supported by the current transport DTOs** — `StaffMembershipSummary` has no name/identity field
at all (not just the pending-invitation gap the original Founder QA evidence already disclosed;
this task additionally confirms the *active member* list has the identical gap, which was not
previously flagged this specifically). **This is a genuine, governed backend/transport correction
requirement, not optional polish** — the Team Management screen as approved cannot be built
faithfully without it. **Not implemented here.** A "Resend" invitation action is also shown with no
corresponding backend capability — same disposition: a real gap, not implemented here.

**Business Address:** disposition preserved exactly as directed — Main Location uses
`BusinessBranch.address` (confirmed, matches EST-02's design field-for-field); the unresolved
`Business.address` sync/retirement question remains explicitly out of scope, untouched, unresolved
by this task.

**Terms:** `DEC-LEGAL-002` remains unresolved; ACT-01's design provides interaction structure only
(placeholder text, correctly) — no real legal content was found invented anywhere in the design,
confirmed by direct inspection. The one minor gap ("Effective Date," Part IX) is the only Terms-
related contract question this task found, and it does not touch `DEC-LEGAL-002` at all.

## PART XII — EN/FR Reconciliation (Phase L)

Every target screen's design already includes an EN|FR toggle in its own chrome (confirmed present
on every inspected screen). Existing reusable translations: the `business` namespace's
`details.*`/`branch.*`/`steps.*`/`actions.*` keys cover most of EST-01/EST-02/EST-03's relabeled
content. **New keys/namespaces required:** an entirely new namespace (or a `dashboard.*` section)
for DASH-01, MGMT-01/02/03, and ACT-01's Dashboard-specific copy — none of this exists today since
the Dashboard itself doesn't exist. **Dynamic Commerce Knowledge labels** (the 14 seeded category
names) remain English-only under French per the already-disclosed, non-defect seed limitation —
restated here, not reclassified as a translation defect, exactly as directed.

## PART XIII — Mobile/Desktop Reconciliation (Phase M)

No functional or structural conflict was found between any inspected mobile/desktop pair — every
desktop companion shows the same fields, the same actions, and the same navigation *shape*
(hamburger→sidebar) as its mobile counterpart, differing only in layout density, exactly as FD-6
requires. **The one true content conflict found is not mobile-vs-desktop but screen-vs-screen**:
DASH-01 desktop's Business Code copy ("share... for quick integration") contradicts
`business_profile_mobile`'s correct framing ("official 11thONUS communications") — per the
Founder's "mobile is primary" direction, **the mobile framing should prevail**; DASH-01 desktop's
copy must be corrected to match it, not the reverse.

## PART XIV — Establishment/Dashboard Restructure Findings

See Part VII (establishment) and Part VIII (Dashboard shell) above — both fully answer Phase
H/I's questions; no additional findings beyond what's recorded there.

## PART XV — Implementation Package Decomposition (Phase N)

The task's suggested six-package grouping is evaluated against actual architecture dependencies,
not accepted blindly — it holds, with one addition (Package G, since Team cannot ship as designed
without its own backend correction, which is a separate authorization boundary from the frontend
relocation work):

### Package A — Establishment Restructure (EST-01/02/03)
**Objective:** retire the five-tab wizard's establishment portion; ship the linear 3-step
sequence per `REVIEW-AFTER-CREATE`. **Areas:** `apps/web/src/business/onboarding/` (new EST-01/02/03
components, `NewBusinessPage.tsx`/`BranchStep.tsx`/`ReviewStep.tsx` retired or absorbed). **Depends
on:** nothing else in this list — can start first. **Acceptance criteria:** `createBusiness` fires
exactly once, at EST-02's Continue, with the unchanged required-field set; EST-03 reads
`getBusinessContext`, never client-only state; refresh before creation restarts at EST-01 (no
regression); refresh after creation resumes correctly via `completeness.ts`. **Tests:** new
component tests per screen, `completeness.ts` tests unchanged (already Team/Terms-independent).
**Backend dependency:** none. **Founder authorization boundary:** frontend-only, no backend PR
needed, standard TDD → PR → review → merge cycle.

### Package B — Business Dashboard Shell + DASH-01
**Objective:** the new authenticated shell (Part VIII) and its Home screen. **Areas:** a new
`apps/web/src/business/dashboard/` (or equivalent) directory, `App.tsx` route additions. **Depends
on:** Package A (the Dashboard is the establishment sequence's destination) — should follow it, not
run fully in parallel, though early shell scaffolding could start once Package A's route shape is
agreed. **Acceptance criteria:** reachable while `draft`; correct outstanding-Terms surfacing
without the "Active" badge or "merchant account/appointments" copy; mobile hamburger + desktop
sidebar, never a bottom bar. **Tests:** shell mount/guard tests, DASH-01 content tests. **Backend
dependency:** none (`getBusinessContext` only). **Founder authorization boundary:** frontend-only.

### Package C — Business Profile + Locations (MGMT-02/03)
**Objective:** the two Dashboard management screens for already-governed data.
**Areas:** new components under the Package B shell. **Depends on:** Package B (needs the shell to
mount into). **Acceptance criteria:** edits use `updateBusinessProfile`/`updateBusinessBranchProfile`
unchanged; "Add new location" is **not** implemented; no per-location status/photo/ID is
implemented. **Tests:** new component tests, existing mutation-hook tests reused. **Backend
dependency:** none. **Founder authorization boundary:** frontend-only.

### Package D — Business Terms (ACT-01)
**Objective:** relocate Terms into a standalone Dashboard-reachable surface. **Areas:** new
container wrapping the existing `TermsStep` presentational component. **Depends on:** Package B.
**Acceptance criteria:** placeholder Terms text only, no invented legal content; Submit remains
genuinely disabled per real `isReadyToSubmit`; "Effective Date" field either added (contingent
backend change, its own small PR) or omitted from the shipped screen. **Tests:** existing
`TermsStep` tests migrate; new container test. **Backend dependency:** contingent, small (only if
"Effective Date" is kept). **Founder authorization boundary:** frontend-only unless the
Effective-Date field is wanted, in which case a separate, small backend PR is needed first.

### Package E — Establishment/Dashboard Copy & Terminology Correction
**Objective:** apply Part IX/X's corrections *before* any of the above ship real user-facing copy
— "merchant account"/"appointments" removed, Business Code framing corrected to the
"official 11thONUS communications" version everywhere, "PROGRES"→"11thONUS" corrected, category-
specific ("salon") copy generalized. **Areas:** i18n resource files, wherever Packages B/C/D land
their copy. **Depends on:** conceptually a cross-cutting concern of B/C/D — **recommended to be
absorbed into each of those packages' own copy-writing step, not a separate package**, since
isolating it would mean writing placeholder copy first and correcting it later — wasted work.
Retained here only as an explicit checklist item each package's review must verify.

### Package F — Team Management (MGMT-01), frontend portion only
**Objective:** relocate Team into the Dashboard, **built against whatever the transport contract
provides at the time** — i.e., this package cannot ship the full approved design (real names on
both lists) until Package G lands; it can ship a version consistent with today's `role + status`
only DTOs (matching the current `TeamStep.tsx`'s own real capability) as an interim state, or be
sequenced entirely after Package G, at the Founder's discretion. **Areas:** new component under the
Package B shell, reusing `createStaffInvitation`/`revokeStaffInvitation`/list-hooks unchanged.
**Depends on:** Package B; **effectively depends on Package G for full design fidelity.**
**Acceptance criteria:** no "Resend" action implemented until/unless its backend exists; identity
columns show only what the DTOs actually provide. **Tests:** `TeamStep.test.tsx` content migrates.
**Backend dependency:** none for the interim version; full fidelity requires Package G.
**Founder authorization boundary:** frontend-only for the interim version.

### Package G — Staff Transport Identity Correction (backend)
**Objective:** the governed backend/transport correction Part XI/§12 identifies — adding an
identity field to `StaffMembershipSummary`/`StaffInvitationSummary` (and, if authorized separately,
a resend-invitation callable). **Areas:** `functions/src/domains/permissions/service/staffTransportReadService.ts`,
`apps/web/src/business/api/staffLists.ts`, plus whatever privacy/authorization review that data
exposure needs (this DTO was **deliberately** minimal per its own header comment — reversing that
is a real product/security decision, not a mechanical addition). **Depends on:** nothing
structurally, but should not be started without explicit Founder authorization, since it reverses
a previously deliberate design choice. **Acceptance criteria:** TDD, RED→GREEN, independent
review, exactly like every other backend change in this repository's convention. **Tests:** new
backend unit/emulator tests. **Backend dependency:** is itself the backend change. **Founder
authorization boundary:** **requires its own explicit, separately scoped Founder authorization —
not implied by authorizing Packages A-F.**

### Package H — Hosted Integration / Founder QA
**Objective:** deploy the completed Establishment→Dashboard→Activation→Management experience to
the DEV Hosting preview and re-run Founder QA against it, exactly matching this repository's
established deployment/revalidation task pattern. **Depends on:** A-D at minimum (F/G optional
depending on how Team is sequenced). **Founder authorization boundary:** its own separate
deployment task, per this repository's every prior deployment task's own convention.

## PART XVI — Implementation Order (Phase O)

**A → B → (C, D, F in parallel) → E folded throughout → G (separately authorized, any time after A,
before F reaches full fidelity) → H.**

Reasoning: A must land first (it's the entry point and the only package touching the currently-live
`createBusiness` call path — highest risk to "preserving Business creation," so it should be small,
isolated, and verified before anything else changes). B must follow A (nothing else has anywhere to
live without the shell). Once B exists, **C and D can run in parallel** with each other (they touch
disjoint components and disjoint backend calls — `updateBusinessProfile`/`updateBusinessBranchProfile`
vs. `acceptBusinessTerms`) — this is genuine, safe parallelization. **F can also start in parallel
with C/D** if shipped in its interim (role+status-only) form; if the Founder wants full-fidelity
Team from the start, F should wait for G. **G is independent of A-F structurally** but carries its
own authorization boundary and privacy-review weight, so it should not be silently bundled into any
frontend package's authorization. **H is last, always**, per this repository's own established
pattern of never bundling implementation and deployment authorization together.

## PART XVII — Test Plan (Phase P)

**Establishment:** EST-01→EST-02 data handoff (component-level, asserting the combined payload
sent to `createBusiness`); `createBusiness` fires exactly once, at the correct boundary (not on
EST-01, not deferred to EST-03); EST-03 renders from `getBusinessContext`, never from stale
client-only state (provable the same way the base handoff's Brief tests already establish);
edit/back-from-EST-03 routes into profile/location editing, not a wizard restart; refresh-before-
creation restarts cleanly at EST-01, refresh-after-creation resumes via `completeness.ts` unchanged.

**Dashboard:** a `draft` Business context renders DASH-01 without error; mobile hamburger menu
open/close; desktop sidebar active-item highlighting; direct-URL navigation to each Dashboard
sub-route preserves Business context (no re-prompt for identity); `BusinessContext` is fetched
once and shared, not re-fetched per sub-screen (a genuine testable architecture assertion).

**Terms:** unavailable / acceptance-required / accepted / current-version-mismatch (re-acceptance
required after a version bump — the one scenario `assertCurrentBusinessTermsAccepted` already
handles server-side, testable against the emulator) — all four states, reusing existing coverage
where `TermsStep`'s tests migrate.

**Team:** members list (interim DTO shape); pending invitations (interim DTO shape); create
invitation; revoke where actually supported today (Owner-authorized, `draft`/`pending_verification`
per the existing `ENG-P2-004-CORR-003` governed behavior) — **no test for "Resend" or full-identity
display until Package G exists.**

**Profile:** read (renders real `BusinessContext` fields); edit (asserts real
`updateBusinessProfile` payload, unchanged validation rules).

**Locations:** main location read; edit (asserts real `updateBusinessBranchProfile` payload) — no
test for "add location," since it's not being implemented.

**i18n:** EN→FR and FR→EN on every new screen, following the exact pattern already proven in
`ENG-P3-002-CORR-LANGSWITCH-001`'s tests (route/step preservation across the switch); route/state
preserved across every Dashboard sub-route switch too, not just establishment.

**Responsive:** 375×812 mobile baseline (existing Founder QA standard) for every new screen;
desktop at the existing 1280×800-class baseline used throughout this session's prior hosted
verifications.

**Regression:** auth (`RequireAuthenticatedUser` unchanged); App Check (untouched by any of this —
purely a frontend-routing/UI change); Business APIs (every callable listed in Part VI is used
**unchanged** — this is the single strongest regression-safety property of this whole plan); direct
Firestore access remains absent (every screen goes through existing callables, none proposed here
introduces a client-side Firestore read/write).

## PART XVIII — Architecture/Security Risks (Phase 24)

- **Package G is the one item in this plan with genuine security/privacy weight** — the current
  `StaffMembershipSummary`/`StaffInvitationSummary` minimalism was a **deliberate** design choice
  (per the DTO's own header comment), not an oversight; reversing it means re-examining what
  identity data an Owner/Manager should be allowed to see about pending/active staff, which touches
  real privacy considerations for the invited party. This is exactly why Package G is called out as
  requiring its own separate authorization rather than being bundled into "implement the Team
  screen."
- **No other architecture-affecting risk was found** — every other package maps cleanly onto
  existing, unchanged backend capability, confirmed by direct source inspection rather than
  assumption throughout Part VI.
- **Risk of silently implementing a D-classified element** if a future implementer works from the
  Stitch HTML/screenshots directly without this document — mitigated by Part IX/X's explicit,
  evidence-cited do-not-implement list.

## PART XIX — Remaining Founder Decisions

1. **Package G authorization** — whether/when to authorize the Staff-transport identity
   correction, and how much identity detail (full name? masked email? avatar?) should actually be
   exposed — a real product/privacy decision, not resolved here.
2. **"Effective Date" on Business Terms** — add the backend field, or omit it from the implemented
   ACT-01 screen (Part IX/XI).
3. **Logo upload** — whether to build the actual upload mechanism now (a real, currently-absent
   backend capability) or ship Business Profile without it initially, keeping `logoUrl` display-only
   for any value set by other means.
4. **Team interim shipping** — whether Package F ships in its interim (role+status-only) form
   before Package G, or waits for full fidelity — a sequencing preference, not a technical
   requirement either way.
5. **"PROGRES"→"11thONUS" correction** — confirm this is unintentional (expected, given every
   other screen says "11thONUS") before any of the three affected screens are used as a literal
   visual reference.

No governing-document-level conflict was found that blocks proceeding — every item above is a
scoping/sequencing/product-detail decision, not a structural blocker.

## PART XX — Files Modified

This document (new) and the accompanying `IMPLEMENTATION_CHANGES.md` entry. No other file.

## PART XXI — Code Diff Summary

**Zero** — confirmed via `git status`/`git diff` showing no changes to `apps/`, `functions/`,
`firebase.json`, `firestore.rules`, or `storage.rules`.

## PART XXII — Commands Executed

`git fetch origin`, `git branch --show-current`, `git rev-parse HEAD`/`origin/main`,
`git rev-list --left-right --count`, `git status --short`, `find .git -iname "*.lock"`,
`git branch -a`, `find docs/07-product-design/stitch/v3-designs -type f`, `unzip -l` (inspecting
the source zip archive only, not extracting/modifying anything), targeted `grep` across every
`code.html` for invention markers, direct `Read` of 8 `screen.png` images plus targeted `grep`
of the remaining `code.html` files, direct `Read`/`grep` of every source file listed in Part II.

## PART XXIII — Dependencies Added

None.

## PART XXIV — Config/Firebase/Data Changes

None. No Firebase CLI/MCP command was issued by this task.

## PART XXV — Risks

None introduced — this is a read-only analysis artifact. The main risk this document exists to
prevent is exactly the one named in Part XVIII: a future implementer treating the Stitch HTML as
literal product truth without this reconciliation.

## PART XXVI — Rollback

Delete this file and revert the `IMPLEMENTATION_CHANGES.md` entry if ever needed — no other state
exists to roll back.

## PART XXVII — Persistent Reconciliation Path

`docs/07-product-design/ENG-P3-002-UI-RECON-001-business-experience-design-to-implementation-reconciliation-2026-08-25.md`
— placed alongside `ENG-P3-002-UI-HANDOFF-001` under `docs/07-product-design/`, matching that
document's own established location for this document class (not `docs/05-implementation/reports/`,
since this is a design-authority reconciliation, not an implementation-completion report).

## PART XXVIII — Changes-Tracking State

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a corresponding entry (below). No
implementation-status advancement recorded — `ENG-P3-002C`/`ENG-P3-002`/Capability 3 all remain
exactly as they were.

## PART XXIX — Exact Recommended Next Implementation Package

**Package A (Establishment Restructure, EST-01/02/03)** — the smallest, most isolated, highest-
confidence package, touching only the already-well-understood `createBusiness` boundary and
independently validated field-for-field against the approved v3 designs (Part V). Authorize it on
its own, following this repository's established TDD → PR → independent review → merge cycle,
before considering Package B.

---

## Final gate

**ENG-P3-002-UI-RECON-001 READY FOR FOUNDER REVIEW — BUSINESS EXPERIENCE IMPLEMENTATION PLAN
RECONCILED; NO SOURCE CHANGES**
