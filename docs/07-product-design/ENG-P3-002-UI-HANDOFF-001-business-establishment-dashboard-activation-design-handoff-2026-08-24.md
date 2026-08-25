> **Title:** ENG-P3-002-UI-HANDOFF-001 — Business Establishment, Dashboard & Activation Design Handoff
> **Version:** 1.0 · **Status:** Design-handoff package — screen inventory + Stitch briefing prepared; **no Stitch concept generated, no implementation performed** · **Classification:** Working (design-handoff record)
> **Governing documents:** `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001`; `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION`; `ENG-P3-002-DESIGN-001`; PRD3; TRD10; TRD16 §16.34; `DEC-LEGAL-002`; [UX Direction](ux-direction.md); [Navigation Model](navigation-model.md); [Design Anti-Patterns](design-anti-patterns.md); [Design Decisions Register](design-decisions.md); `stitch/exploration-v2/premium_verification_system/DESIGN.md`
> **Last controlled update:** 2026-08-24 (created)

# ENG-P3-002-UI-HANDOFF-001 — Business Establishment, Dashboard & Activation Design Handoff

This document is a **design-handoff package**, not an implementation, not a Stitch output. It
translates the Founder-approved product journey (`FD-1`–`FD-7`, recorded in
`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION`) into a precise, screen-by-screen
specification the Founder can hand to Google Stitch, one prompt at a time, with confidence that the
result represents the governed 11thONUS product rather than an invented one.

---

## PART I — Authority & Scope

**In scope:** the screen/state inventory and Stitch briefing package for Business Establishment
(Phase 1), the Business Dashboard (Phase 2), and Activation/Compliance (Phase 3), per FD-1–FD-7.

**Out of scope (explicitly, per the disposition and this task's own instructions):** production UI
implementation; Firebase changes; backend changes; `BusinessStatus` changes; `Business.address`
retirement/synchronization; Subscription Plan implementation; future Terms-version re-acceptance
policy; `DEC-LEGAL-002` resolution; the invitation-identity DTO correction (noted only as a design
state, not corrected); speculative analytics; loyalty-operation screens (Capability 5/6); Capability
4/5/6 redesign; deployment; Stitch generation itself.

**Handoff strategy:** rather than writing Stitch prompts directly, this document first re-derives
the current implementation from source (Part II), restates the governed target journey with the
Founder's dispositions applied (Part III), builds one authoritative screen/state inventory (Part
V) validated against that journey — not accepted blindly — and only then produces one detailed,
constrained brief per screen family (Part X). Visual direction (Part IX) is extracted from what the
repository's approved Stitch exploration and its written design-system specification actually say,
never invented. Every "must preserve"/"must not introduce" constraint in each brief traces back to
a specific FD, backend behavior, or Design Anti-Pattern already on record — nothing here is a new
product rule.

---

## PART II — Current Experience Audit

Re-inspected directly from source for this task (not reused from memory):

- **Routes today:** `/business` (resolver — 0 Businesses → redirect to `/business/new`; 1 →
  redirect to `/business/:businessId`; >1 → selection list), `/business/new`
  (`NewBusinessPage.tsx`), `/business/:businessId` (`BusinessWizardPage.tsx` →
  `OnboardingWizard.tsx` when `draft`, `SubmittedStatusPage.tsx` when `pending_verification`, a
  generic `lifecycle.notAvailable` message otherwise). **No Dashboard route exists today.**
- **New Business (`NewBusinessPage.tsx`):** one form — Business name, category (live Commerce
  Knowledge selector), country, city, phone, currency, timezone — all required, submitted
  atomically via `createBusiness`. `address`/`legalName`/`contactEmail`/`businessTypeId` are
  supported by the API contract but **not** collected on this screen.
- **Business category/type:** re-visitable inside the wizard's "Business category" tab
  (`ClassificationStep`, not directly inspected this task but confirmed present via
  `OnboardingWizard.tsx`'s `STEP_ORDER`); Type is optional everywhere.
- **Main Location (`BranchStep.tsx`):** edits the auto-created default Branch — display name, city
  required; **`address` is already collected here, optional**, persisted via
  `updateBusinessBranchProfile`.
- **Terms (`TermsStepContainer.tsx`/`TermsStep.tsx`):** accept/unavailable state, wired to
  `acceptBusinessTerms`; currently one tab among five, equal visual weight to Team/Review.
- **Team (`TeamStep.tsx`):** email/phone delivery-type selector, role field (defaults `staff`), a
  flat pending-invitation list showing only role+status (no invitee identity — a known,
  already-disclosed, non-blocking gap), "Skip for now."
- **Review (`ReviewStep.tsx`):** read-only summary of name/category/location, per-step "please
  finish this step" warnings, Submit disabled until `isReadyToSubmit`.
- **Submitted/status (`SubmittedStatusPage.tsx`):** minimal "Submitted — pending verification"
  landing, shows Business name only.
- **Language switching:** `LanguageSwitcher` (EN/FR, autonym-labelled, `i18n.changeLanguage`) now
  present at the top of `NewBusinessPage`, `OnboardingWizard`, and `SubmittedStatusPage`
  (merged `ENG-P3-002-CORR-LANGSWITCH-001`). No language control exists on `BusinessWizardPage`'s
  own loading/error/`lifecycle.notAvailable` states.
- **Responsive/mobile behavior:** the wizard's five-tab step nav (`Business category | Main
  location | Terms | Team | Review`) is a horizontal, wrapping pill row — no overflow at 375px,
  but Founder-rejected as reading like desktop navigation ("Founder QA mobile navigation
  finding," recorded FAIL, unchanged). No other screen in the flow has a distinct mobile layout;
  every screen is a single-column form that already stacks acceptably at narrow widths.

## PART III — Governed Target Journey

Restated with FD-1–FD-7 applied (source: `...-FOUNDER-DISPOSITION-2026-08-24.md` §3, §11):

**A. Business Establishment** — short, focused on establishing the Business only. Business
identity/Category/Type → Main Location (address included, per FD-2's screen-level resolution —
`BusinessBranch.address`, not a separate Business Address screen) → Review of the now-persisted
Business → Finish setup. Team excluded (FD-1). Terms not an ordinary establishment step (Founder
product boundary). No new lifecycle status (FD-3) — the Business stays `draft` throughout.

**Journey timing — Founder-confirmed REVIEW-AFTER-CREATE (`...-UI-HANDOFF-001-FOUNDER-DISPOSITION-2026-08-24.md`):**
a real Business record is created **early** in this sequence — specifically, at the point the
frontend has collected every field `createBusiness` currently requires (name, category, country,
city, contact phone, currency, timezone — see Part V's revised EST-01/EST-02 field split below).
The Business is real, persisted, and `draft` from that moment forward; Category/Type and Main
Location are then persisted **against that real Business** (via `updateBusinessProfile`/
`updateBusinessBranchProfile` for any subsequent refinement); the Review step summarizes
**backend-authoritative, already-persisted** data, never client-only unsaved state; "Finish setup"
is a UX-level confirmation of establishment completion, not a second creation event. Review is
**not** a pre-create staging screen, and no client-only temporary Business object is introduced —
this requires no additional backend or data-model capability.

**B. Business Dashboard** — reachable once establishment is complete, without requiring
`pending_verification` (FD-4); a `draft` Business may enter it. Houses Business identity/profile,
locations, Team/Staff management, and activation/readiness information — only capabilities already
governed elsewhere (§10 of the original reconciliation), nothing invented.

**C. Activation/Compliance** — Terms remains a genuine, server-enforced gate
(`assertCurrentBusinessTermsAccepted`, unchanged); the Dashboard may surface that it's outstanding
without duplicating or weakening the backend check. Future Terms re-acceptance policy stays
deferred (FD-5).

## PART IV — Information Architecture & Navigation

**1. Establishment:** a short, linear sequence (not a freely-jumping tab set like today) —
Identity/Category → Main Location → Review. Forward/back only; no destination is reachable before
its predecessor is satisfied, since the sequence is short enough that free-jumping isn't needed the
way a 5-tab wizard implied it was.

**2. Establishment → Dashboard transition:** on confirming Review ("Finish setup" / "Complete
setup"), the Owner lands in the Dashboard. **No backend state change occurs at this transition** —
the real `createBusiness` call already fired earlier, at the end of the field-collection sequence
(Part III/Part V); "Finish setup" is purely a UX-level navigation confirmation into the Dashboard,
consistent with FD-3 (no new lifecycle status) and the Founder's `REVIEW-AFTER-CREATE` disposition.

**3. Dashboard primary navigation:** a persistent structure the Owner returns to for all ongoing
management — Business identity/profile, Locations, Team, and an Activation/Compliance surface, all
reachable from one home. No governed precedent exists for a *dedicated* business-establishment
navigation model — [Navigation Model](navigation-model.md) §4 explicitly discloses this as an open
gap ("Whether business users... need a genuinely separate navigation structure is not answered by
this exploration and is not decided here"). This handoff does not fill that gap by invention; Part
X's briefs state this explicitly as an area of Stitch design freedom, informed by (not bound to)
the existing customer bottom-bar pattern.

**4. Activation/readiness access:** reachable from the Dashboard home (a visible "what needs
attention" surface), not a separate top-level nav item competing with Locations/Team.

**5. Profile/location management:** Dashboard sub-areas, not onboarding steps.

**6. Team management:** a Dashboard sub-area (relocated per FD-1) — same underlying data/actions as
today's `TeamStep.tsx`, different container.

**7. Mobile navigation:** per Part VI — semantics, not a prescribed component, are specified.

**8. Desktop navigation:** per Part VII.

**Where the current five-button wizard navigation is retired:** entirely, for establishment — Part
III's linear A-sequence replaces it. Its *Terms* and *Team* tabs move to C and B respectively;
its *Review* tab becomes establishment's own terminal step; its *Business category*/*Main location*
tabs become two of the three linear establishment steps.

## PART V — Authoritative Screen/State Inventory

Validated against actual architecture (Part II), not accepted from the Founder's conceptual list
blindly — e.g., Business identity and Category are kept as two focused steps rather than one dense
form, since the current single `NewBusinessPage` form (7 required fields at once) is exactly the
kind of density mobile-first design should avoid, even though the backend still accepts them in one
atomic call.

| ID | Screen | Phase | User goal | Entry condition | Exit condition | Current status | Dedicated Stitch concept? |
|---|---|---|---|---|---|---|---|
| EST-01 | Business Identity & Category | Establishment | Name the business, classify it, give a contact number | Signed in, zero/incomplete Business | Name + category + contact phone valid (type optional) | **Exists, requires structural redesign** (currently one dense screen with several other fields too) | Yes |
| EST-02 | Main Location | Establishment | Give the business a primary address/location and regional settings; **triggers real Business creation on Continue** | EST-01 complete | Country + city + branch display name + currency + timezone all valid (address optional) → real `createBusiness` call fires here | **Exists, requires structural redesign** (already close to correct shape — see Part II) | Yes |
| EST-03 | Establishment Review & Finish Setup | Establishment | Confirm the now-persisted Business details, complete setup | Business already created (EST-02 confirmed) | Owner confirms "Finish setup" → transition to Dashboard (no further backend write) | **Exists but requires redesign** (today's `ReviewStep.tsx` also shows Terms/Team status — must become establishment-only) | Yes |
| DASH-01 | Business Dashboard Home | Dashboard | See what this Business is and what needs attention | Establishment complete (Business may be `draft`) | N/A — persistent home, not a gated step | **Net-new** | Yes |
| DASH-02 | Business Profile / Settings | Dashboard (Management) | Edit identity/category/type after establishment | From Dashboard | N/A — ongoing | **Net-new screen, existing backend** (`updateBusinessProfile`) | Yes (may combine with DASH-01's detail drill-in) |
| DASH-03 | Locations | Dashboard (Management) | Edit the Main Location's details after establishment | From Dashboard | N/A — ongoing | **Exists (`BranchStep.tsx`), requires relocation/redesign** | Folded into DASH-02's brief as a section, not a separate concept |
| DASH-04 | Team / Staff Management | Dashboard (Management) | Invite/view/manage Staff | From Dashboard | N/A — ongoing | **Exists (`TeamStep.tsx`), requires relocation/redesign** | Yes |
| ACT-01 | Activation / Compliance | Activation/Compliance | See and satisfy outstanding activation requirements, submit for verification | From Dashboard, or surfaced automatically when something is outstanding | Either remains outstanding (ongoing) or transitions to `pending_verification` | **Exists (`TermsStepContainer.tsx`/`ReviewStep.tsx`'s submit logic), requires restructuring into a standalone surface** | Yes |
| SYS-* | Loading / Empty / Error / Unavailable / Access-denied state family | Cross-cutting | N/A — supporting states, not destinations | Varies per host screen | Varies per host screen | **Exists** (`BusinessResolverPage.tsx` pending/error, `OnboardingWizard.tsx` integrity-error, `BusinessWizardPage.tsx` `lifecycle.notAvailable`) | **No dedicated concept** — instructions folded into each screen's own "Required States" (Part X §5 of each brief) |

**Eight screen/family rows require design attention (EST-01–03, DASH-01/02/04, ACT-01); one row
(DASH-03) is folded into DASH-02's brief rather than given its own concept; one row (SYS-*) is
explicitly a state-variant family, not a screen.** This is deliberate consolidation, not an
oversight — per this task's own instruction not to turn every technical state into a screen.

**Per-screen detail (columns 4–20 of the required 20-item breakdown), condensed by family:**

- **EST-01/02/03 (Establishment):** required data = EST-01: name, category (type optional),
  contact phone; EST-02: country, city, branch display name, currency, timezone (address
  optional); EST-03: none (read-only review of persisted data). Required actions = Continue
  (disabled until valid) on EST-01/02, "Finish setup" on EST-03; optional actions = Back
  (EST-02/03 only), language switch; backend dependency = **`createBusiness` fires once, on
  EST-02's Continue**, atomically creating the Business + default Branch (unchanged backend
  behavior, unchanged required-field set) — any address entered on EST-02 is then persisted via a
  follow-up `updateBusinessBranchProfile` call, exactly as `BranchStep.tsx` already does today;
  EST-03 makes no backend call of its own, it reads the same `getBusinessContext` data the
  Dashboard will also read; validation = the exact `completeness.ts` predicates, unchanged;
  empty states = N/A (always has fields to fill); loading = the mutation-pending state on
  Continue/Confirm; error = `MutationError`'s existing governed error-banner pattern, unchanged;
  blocked = N/A; EN/FR = full (existing `business` namespace already covers every string used);
  mobile = single-column, one focused task per screen; desktop = the same content, wider
  container, no structural change.
- **DASH-01 (Home):** required data = Business name, category, location summary, activation
  status summary; required actions = navigate to each management area; optional actions = none
  mandated; backend dependency = `getBusinessContext` (existing, unchanged); validation = N/A;
  empty state = N/A (always has a Business by the time Dashboard is reachable); loading =
  existing `resolve.loading`-style pattern; error = existing `integrityError` pattern; blocked =
  N/A; EN/FR = requires new translation keys (net-new screen); mobile = primary target; desktop =
  responsive companion.
- **DASH-02/03 (Profile/Locations):** required data = current Business/Branch field values;
  required actions = Save; backend dependency = `updateBusinessProfile`/
  `updateBusinessBranchProfile` (both existing, unchanged); validation = same governed field
  rules as establishment; error = `MutationError` pattern, unchanged.
- **DASH-04 (Team):** required data = pending/active Staff list (role + status only — the
  invitee-identity gap is a **design-state note**, not a fix, per this task's scope: the design
  should not visually promise an identity column the backend doesn't populate); required actions =
  invite (email/phone + role), revoke; optional actions = none beyond what exists; backend
  dependency = `createStaffInvitation`/`revokeStaffInvitation`/`listStaffInvitations`/
  `listStaffMemberships` (all existing, unchanged); empty state = "no one invited yet" (already
  exists in copy); error = `MutationError` pattern.
- **ACT-01 (Activation):** required data = current Terms status (`unavailable`/
  `acceptance-required`/`accepted`), overall readiness (`isReadyToSubmit`); required actions =
  Accept Terms (when available), Submit for Verification (when ready); optional actions = none;
  backend dependency = `acceptBusinessTerms`, `submitBusinessForVerification` (both existing,
  server-enforced, unchanged); required states = **Terms unavailable**, **Terms available/
  acceptance required**, **Terms accepted/current**, **not ready to submit** (other establishment
  data incomplete), **ready to submit**, **submit in-flight**, **submitted/pending verification**
  — all seven already exist as real, reachable states in the current architecture; blocked = the
  Submit action itself, disabled per `isReadyToSubmit`, exactly as today — **must remain
  disabled under the same conditions, not loosened.**

## PART VI — Mobile-First Behaviour

Per screen, what mobile must provide (semantics, not a prescribed component — per this task's
explicit instruction not to choose the replacement navigation pattern):

- **What users need to understand:** which of the three establishment steps they're on (Identity,
  Location, Review), and — once in the Dashboard — which management area they're currently in.
- **Current step/state:** must be visually unambiguous at a glance, consistent with [Navigation
  Model](navigation-model.md) §6 "Navigation state is always obvious" (already-governed principle,
  applies here by extension).
- **Back, where permitted:** available from EST-02/EST-03 back to the previous establishment step;
  not applicable once past the linear establishment sequence (Dashboard has no "back," only lateral
  navigation between management areas).
- **Resume:** unchanged from today's architecture — resumption is derived from server-authoritative
  `BusinessContext` state (`completeness.ts`'s predicates), never a persisted UI step; a refreshed
  or reopened session must land wherever that state says it should, exactly as today.
- **Mobile interaction requirement:** each establishment screen must be operable one-handed,
  thumb-reachable primary action, no horizontal scrolling ever, per the existing 375×812 Founder QA
  baseline (already-passing standard for the current screens, must not regress).
- **Desktop adaptation:** see Part VII.

**Explicit prohibition, restated from the Founder's own instruction:** the current desktop-style
row of `Business category | Main location | Terms | Team | Review` must **not** be carried into
mobile by shrinking it, and must not reappear even in the redesigned establishment sequence (which
no longer has five peer destinations to show at once — three short linear steps do not need a tab
row at all, which structurally avoids recreating the failed pattern rather than merely restyling
it).

## PART VII — Responsive Desktop Behaviour

Desktop is a **companion**, not the primary design target (per FD-6). Concretely: every mobile
layout in Part VI must have a desktop counterpart that presents the *same* content and the *same*
primary action, using the additional width for breathing room (wider margins, side-by-side field
groups where natural) rather than for new content or a different information architecture. The
existing `concept_6_business_dashboard` evidence (Part IX) shows a real, already-tested pattern for
this exact mobile→desktop relationship (bottom tab bar on narrow viewports, a lightweight top nav
row at `md:` breakpoints) — cited as **existing design evidence Stitch may draw on**, not a
requirement this document imposes.

## PART VIII — Content & Localisation

English is primary; French must be fully usable, not merely present (per the merged
`ENG-P3-002-CORR-LANGSWITCH-001` correction and FD-6's mobile-first-not-mobile-only framing applied
by extension to language). Every screen in Part V, once built, must carry a reachable language
control consistent with the pattern already proven on `NewBusinessPage`/`OnboardingWizard`/
`SubmittedStatusPage` — including the **new** Dashboard screens, which don't have this today only
because they don't exist yet.

**Dynamic Commerce Knowledge / category labels:** the 14 seeded Business Category labels (Bakery,
Barber, Burger, Car Wash, Coffee Shop, Gym, Juice Bar, Laundry, Pizza, Restaurant, Retail, Salon,
Spa, Vehicle Service) remain in **English only** under the French UI today — this is a **seed/data
limitation** (the loader only publishes EN translations currently), **not** an untranslated
application-UI defect. Stitch briefs must not treat this as something to "fix" visually (e.g., by
inventing French category labels) — the design should simply render whatever the category API
returns, in whatever language it returns it.

**Backend identifiers are never customer-facing:** `cat_salon` and equivalents are internal IDs,
never labels — this is already how the existing category selector works (it renders
`displayLabel`, never the raw `id`) and must remain true in every new screen. No screen in this
handoff should expose lifecycle-engine, ledger, completeness-engine, command, `BusinessStatus`
enum, or internal capability-identifier language anywhere — consistent with [Design
Anti-Patterns](design-anti-patterns.md) §4, which already forbids this platform-wide.

## PART IX — Existing Visual Direction

Extracted from `docs/07-product-design/` — not invented. Split per this task's own requirement:

### A. Visually evidenced principles (from the approved exploration + its written specification)

- **Color system** (`premium_verification_system/DESIGN.md`, the Version 2 baseline — Founder+Tech
  Lead approved, per [UX Direction](ux-direction.md) §0): three functional colors, each
  load-bearing, never decorative — **Trust** (`#121212`/near-black — primary text, main action
  buttons, institutional weight), **Progress** (`#FF4F11` International Orange — active states,
  "Next"/continue actions), **Reward** (`#F4B528` Warm Gold — reserved *exclusively* for
  achievement/redemption). Foundation surfaces: `#FFFFFF` (pure white canvas), `#F7F7F8`/`#F2F2F7`
  (off-white/light-gray sectioning).
- **Typography:** Hanken Grotesk for headlines (tight letter-spacing, "bolted"/authoritative,
  700-weight at XL/LG scale), Inter for body copy; uppercase, tracked-out labels for secondary
  metadata (`label-md`: 12px, 600 weight, 0.05em tracking); numeric/progress data set in the
  headline font for a "bold, data-driven" look.
- **Surfaces/cards:** white cards, 1px subtle border (`#E5E5E7`), 8px (`0.5rem`) default corner
  radius, a single very soft diffused shadow (`0px 4px 20px rgba(0,0,0,0.04)`) — "avoids heavy
  shadows," uses "Surface-on-Surface" depth instead. Large containers/hero sections may use
  `rounded-xl` (1.5rem).
- **Spacing:** 8px base unit; 20px minimum mobile margins, 40px+ on desktop; `stack-md` (24px)
  between related elements, `stack-lg` (48px) between distinct functional groups.
- **Buttons:** high-contrast black-on-white for "Trust" actions (Sign In, Verify-class); Orange for
  "Progress" actions (Scan/Continue-class). Never two equal-weight actions on one screen (Design
  Anti-Patterns §3).
- **Inputs:** minimalist, 1px border darkening on focus, static labels above the field (never
  floating labels).
- **Icons:** Material Symbols Outlined, medium-weight paths, never thin lines.
- **Navigation character:** a persistent five-item bottom bar (Home/Scan/Rewards/Activity/Account)
  for the customer surface; `concept_6_business_dashboard` (the only business-facing concept,
  **Version 1 only — not carried into the Version 2 refinement**, per Design Decisions §DEC-UX-005
  area) reuses the same bottom-bar shape plus a lightweight desktop top-nav row, rather than a
  dedicated business navigation model.
- **Information density:** business-facing screens "carry more information density than customer
  screens by necessity" ([UX Direction](ux-direction.md) §4) but must still keep one clear lead
  item and flag urgency explicitly (Design Anti-Patterns §7's "Overloaded Dashboards" — even
  `concept_6` keeps Today's Total as the lead, flags **URGENT** items explicitly).

### B. Product requirements (governance, not visual, but binding on any Stitch output)

- One primary action per screen, always (Design Anti-Patterns §3).
- Current state first, before anything promotional (Design Anti-Patterns §1, by extension).
- No backend terminology anywhere customer/business-user-visible (Design Anti-Patterns §4).
- No unnecessary confirmations on safe/reversible actions (Design Anti-Patterns §6).
- No generic gamification — not directly applicable to establishment/Dashboard screens, but the
  same "no invented mechanics" discipline extends: nothing on these screens should imply
  streaks/badges/points that don't exist in this capability.

### C. Recommendations for Stitch (explicitly non-binding, offered as guidance only)

- Since **"Reward" gold is reserved exclusively for achievement/redemption**, establishment and
  Dashboard/activation screens should draw primarily from **Trust** (black) and **Progress**
  (orange) — gold should not appear here; this is a recommendation drawn from the color system's
  own stated exclusivity rule, not a new rule invented by this document.
- The mobile-bottom-bar / desktop-top-nav split already tested in `concept_6_business_dashboard`
  is offered as a **starting reference**, not a mandate — Part IV/VI already establish that no
  governed business-navigation model exists, so Stitch retains real freedom here, informed by this
  precedent rather than bound to it.

## PART X — Stitch Screen Briefs / Prompts

Eight briefs, one per screen/family requiring a dedicated concept (Part V). No Stitch concept is
generated by this task — these are the prompts to use *when* that work is authorized.

---

### BRIEF 1 — EST-01: Business Identity & Category

**1. Design context:** 11thONUS, a Business user (the Owner) creating their Business for the first
time. This is the very first screen of Business establishment, reached immediately after sign-in
for a new Owner.
**2. User goal:** name the business, tell 11thONUS what kind of business it is, and give a contact
number.
**3. Required content:** Business name field; Business category selector (populated from a live,
governed list — do not hard-code categories in the design, show a representative selector pattern
instead); an optional Business Type field, clearly marked optional, shown only after a category is
chosen or always visible but non-blocking; a contact phone field (required).
**4. Required actions:** Continue (primary, disabled until name + category + contact phone are
present).
**5. Required states:** empty (initial); validation-incomplete (Continue disabled); Continue
in-flight; validation error (if a name/phone is invalid).
**6. Navigation context:** first of three establishment steps; a way to see this is step 1 of 3
(step indicator, not the retired five-tab row).
**7. Mobile-first requirements:** one-handed operation, thumb-reachable Continue, no more than
these three-to-four fields visible without scrolling.
**8. Responsive desktop requirements:** same fields, more breathing room; do not add unrelated
content just because there's space.
**9. EN/FR requirements:** all copy in this brief must exist in both languages; category *labels*
come from a live API and may legitimately appear in English only regardless of UI language (Part
VIII) — do not design as if category labels are always translated.
**10. Existing visual-direction requirements:** Trust/Progress palette (Part IX-A); Hanken Grotesk
headline, Inter body/inputs; static labels above fields, no floating labels; 8px card radius if a
card container is used; 20px minimum mobile margin.
**11. Must preserve:** exactly one primary action; the existing field validation semantics
(required: name, category, contact phone; optional: type). No Business record is created by this
screen alone — it holds this data client-side until EST-02 is also complete (Part III).
**12. Must not introduce:** Team/Staff anything; Terms anything; a Subscription Plan selector; a
Business Address, country, city, currency, or timezone field on this specific screen (all belong to
EST-02); Reward-gold color use.
**13. Design freedom:** exact field layout, category-selector visual treatment (dropdown, chip
grid, searchable list — any pattern consistent with Part IX), whether Type is inline or a
progressive disclosure.
**14. Output request:** primary mobile concept; responsive desktop companion; the
validation-incomplete and Continue-in-flight state variants.

---

### BRIEF 2 — EST-02: Main Location

**1. Design context:** 11thONUS, the Owner, second and final data-collection establishment step,
immediately following EST-01. **Completing this screen creates the real Business record** — this
is the moment `createBusiness` actually fires, atomically, with everything collected across EST-01
and this screen.
**2. User goal:** tell 11thONUS where the business is primarily located and confirm its regional
settings, then bring the Business into existence.
**3. Required content:** country, city, and a location/branch display name (all required); currency
and timezone (both required — present as sensible selectors, e.g. derived from the chosen country,
not raw free-text codes); street address (optional — this is the existing `BusinessBranch.address`
field; do **not** frame it as "Business Address" as a separate concept, per FD-2's screen-level
resolution).
**4. Required actions:** Continue (primary, disabled until country + city + display name + currency
+ timezone are all present) — this action is the real `createBusiness` call.
**5. Required states:** same shape as EST-01 (empty, incomplete, in-flight, validation error) — the
in-flight state here specifically represents the real Business-creation network call, not a purely
client-side transition; a creation-failure error state (network/server error) distinct from a
plain field-validation error, using the existing `MutationError` pattern; plus Back to EST-01.
**6. Navigation context:** step 2 of 3; Back available (still safe — no Business exists yet while
on this screen, so Back genuinely discards nothing persisted).
**7. Mobile-first requirements:** same as EST-01.
**8. Responsive desktop requirements:** same as EST-01.
**9. EN/FR requirements:** full, both languages.
**10. Existing visual-direction requirements:** same palette/typography/spacing system as EST-01 —
these three establishment screens should read as one coherent sequence, not three unrelated
designs.
**11. Must preserve:** address stays optional; country/city/display name/currency/timezone stay
required; exactly one primary action; the real, atomic `createBusiness` call fires here and only
here — this screen must not present as if the Business already existed before it, and must not
defer creation to EST-03.
**12. Must not introduce:** a second, separate "Business Address" field or screen; multi-branch
management (single branch only, per current architecture — do not design as if adding branches is
possible here); Subscription-Plan-gated messaging about branch limits.
**13. Design freedom:** exact field order/grouping, whether address is a single line or expandable
detail.
**14. Output request:** primary mobile concept; responsive desktop companion; the same state
variants as EST-01, plus the Back-navigation affordance shown.

---

### BRIEF 3 — EST-03: Establishment Review & Finish Setup

**1. Design context:** 11thONUS, the Owner, final establishment step — reached immediately after
EST-02's real `createBusiness` call succeeds; the Business already exists, `draft`, persisted, by
the time this screen renders.
**2. User goal:** confirm what was actually saved is correct, then complete setup.
**3. Required content:** a read-only summary of Business name, category (+type if set), and Main
Location (including address if set) — **sourced from the same backend-authoritative
`getBusinessContext` data the Dashboard will also read, never from unsaved client state** —
establishment data only; no Terms status, no Team status (both retired from this screen per
FD-1/the Founder's product boundary).
**4. Required actions:** "Complete setup" / "Finish setup" (primary) — a UX-level confirmation that
navigates into the Dashboard; makes no backend write of its own.
**5. Required states:** normal (all establishment data valid — always true by construction, since
EST-01/02 already gated on their own required fields, and this screen only renders once creation
has already succeeded); Complete-setup in-flight (navigation only, not a mutation); a brief
first-time-Dashboard transition/confirmation moment (a state variant, not a fourth screen).
**6. Navigation context:** step 3 of 3. A "Back"/"Edit" affordance here **edits the already-created
Business** (via the same `updateBusinessProfile`/`updateBusinessBranchProfile` calls the Dashboard
uses) rather than returning to a pre-creation state — there is no pre-creation state to return to
once EST-02 has succeeded.
**7. Mobile-first requirements:** the summary must be scannable at a glance, no dense table.
**8. Responsive desktop requirements:** same content, wider layout.
**9. EN/FR requirements:** full, both languages.
**10. Existing visual-direction requirements:** same system as EST-01/02; this screen may use
slightly more `stack-lg` separation between the three summarized sections (Identity/Category/
Location), per the design system's own "distinct functional groups" spacing rule (Part IX-A).
**11. Must preserve:** exactly one primary action ("Complete setup"); establishment-only content.
**12. Must not introduce:** Terms acceptance UI; Team/Staff UI; a "Submit for Verification" action
(that belongs to ACT-01, not here — establishment completing is not the same event as verification
submission); any suggestion that completing this screen means the Business is "live" or "verified."
**13. Design freedom:** how the transition into the Dashboard is visually handled (a brief success
state, a direct navigation, etc.) — provided it doesn't imply verification/activation has occurred.
**14. Output request:** primary mobile concept; responsive desktop companion; the transition-moment
state variant.

---

### BRIEF 4 — DASH-01: Business Dashboard Home

**1. Design context:** 11thONUS, the Owner, entering the Business Dashboard for the first time
(net-new — no prior design exists for this screen anywhere in the repository).
**2. User goal:** understand, at a glance, what Business they're managing, what still needs
attention, and where to go next.
**3. Required content:** Business identity (name, category); a visible summary of outstanding
activation/readiness status (e.g., "Terms not yet accepted," surfaced from real `isReadyToSubmit`/
Terms state — do not invent a generic "% complete" metric not backed by real data); entry points
into Profile/Settings, Locations, Team, and Activation/Compliance.
**4. Required actions:** navigate to each management area; if something is outstanding, a clear
path to resolve it (e.g., straight into ACT-01).
**5. Required states:** everything-in-order (nothing outstanding, e.g., already
`pending_verification`); something-outstanding (e.g., Terms not yet accepted); loading; error
(context failed to load — reuse the existing `integrityError` copy pattern).
**6. Navigation context:** this is the Owner's persistent home for the Business going forward —
not a step in a sequence.
**7. Mobile-first requirements:** the single most important thing (what needs attention, if
anything) must lead, consistent with Part IX-A's "current state first" / Design Anti-Patterns §7
"Overloaded Dashboards" discipline — this must not become a wall of cards.
**8. Responsive desktop requirements:** the same lead-item-first hierarchy, with room for the
management-area entry points to be more visually distinct (e.g., a grid rather than a stack).
**9. EN/FR requirements:** full, both languages — this is entirely net-new copy, so there is no
existing translation to reuse; new keys will be needed (a **frontend/i18n-resource change**, not
performed by this task).
**10. Existing visual-direction requirements:** Part IX-A in full — this is the screen where the
"more information density than customer screens, but still one clear lead item" principle
(UX Direction §4, quoting the exact `concept_6_business_dashboard` precedent) applies most
directly.
**11. Must preserve:** the Business's real, current state — no fabricated metrics, no analytics
that don't exist in this capability.
**12. Must not introduce:** revenue/transaction figures, loyalty-program metrics, customer counts,
or any Capability 5/6 content (Reward Status, Recent Transactions, etc. — those are real elements
of `concept_6_business_dashboard` but belong to a *different, unbuilt* capability; do not carry
them into this Capability-3-scoped Dashboard); a progress bar toward "verification" implying a
knowable percentage when the actual gate is a binary Terms-acceptance check; Reward-gold color use.
**13. Design freedom:** full visual layout of the "what needs attention" summary and the
management-area entry points — this is the one screen in this handoff with the most genuine design
freedom, since no prior concept for it exists.
**14. Output request:** primary mobile concept; responsive desktop companion; the
everything-in-order and something-outstanding state variants.

---

### BRIEF 5 — DASH-02: Business Profile & Locations

**1. Design context:** 11thONUS, the Owner, managing their Business's core details after
establishment — reached from the Dashboard.
**2. User goal:** review and edit Business identity/category/type and the Main Location's details,
after establishment, at any time.
**3. Required content:** the same fields as EST-01 (identity/category/type) and EST-02 (location/
address), now presented as editable, persistent settings rather than a one-time sequence.
**4. Required actions:** Save (per section) — this may be one combined screen with two sections
(Profile, Location) or two screens reachable from one entry point; either is acceptable design
freedom.
**5. Required states:** viewing (current values shown); editing; save in-flight; save error
(`MutationError` pattern); save success.
**6. Navigation context:** a Dashboard management area, not a linear step — freely revisitable,
with a clear way back to Dashboard Home.
**7. Mobile-first requirements:** same field-density discipline as EST-01/02 — editing on mobile
should not feel like a form dump.
**8. Responsive desktop requirements:** may show Profile and Location side-by-side or in adjacent
panels, given the extra width.
**9. EN/FR requirements:** full, both languages — largely reuses EST-01/02's existing translation
keys, since the underlying data/labels are the same.
**10. Existing visual-direction requirements:** Part IX-A, consistent with EST-01/02's established
input/label treatment (this is literally the same data, later in the lifecycle).
**11. Must preserve:** the exact same validation rules as establishment (name/city required,
type/address optional); no new required fields invented.
**12. Must not introduce:** a way to add additional locations/branches (single-branch only, per
current architecture — this is Locations *management* of the one existing Branch, not a
multi-branch feature); Subscription Plan UI.
**13. Design freedom:** whether Profile and Location are one screen or two; exact settings-page
layout conventions.
**14. Output request:** primary mobile concept; responsive desktop companion; the editing and
save-error state variants.

---

### BRIEF 6 — DASH-04: Team / Staff Management

**1. Design context:** 11thONUS, the Owner, managing who has access to help run the Business —
reached from the Dashboard, at any point in the Business's life (not gated by establishment
completion or verification status).
**2. User goal:** invite collaborators, see who's been invited or already has access, and revoke
access if needed.
**3. Required content:** an invite form (delivery method — email or phone — plus role); a list of
pending invitations and active memberships.
**4. Required actions:** send invitation; revoke (pending invitation or active membership, per
existing authorization rules — not redesigned here).
**5. Required states:** empty ("no one invited yet" — existing copy pattern); populated list;
invite in-flight; invite error (`MutationError` pattern, including the existing closed-enum role
validation — do not design a free-text role field without guidance, since an invalid value is
rejected server-side); revoke confirmation (this is a genuinely consequential, not-easily-reversed
action, so a confirmation step here is consistent with Design Anti-Patterns §6, which reserves
confirmations for exactly this class of action).
**6. Navigation context:** a Dashboard management area, freely revisitable.
**7. Mobile-first requirements:** the invite form and the list must both work in a single column
without feeling cramped; the list is the kind of content Part IX-A's "recent history, secondary"
principle applies to — the invite action should lead, the list follows.
**8. Responsive desktop requirements:** the list may become a proper table at wider widths.
**9. EN/FR requirements:** full, both languages — largely reuses `TeamStep.tsx`'s existing
translation keys.
**10. Existing visual-direction requirements:** Part IX-A; list rows may use the "Chips/Badges"
pattern (Part IX-A, low-saturation background, high-contrast text) for status (pending/active).
**11. Must preserve:** the existing closed-enum role vocabulary at the transport boundary (the
design should present a bounded choice — e.g., a select, not free text — for role, consistent with
what the backend actually accepts, even though this document does not change the backend); revoke
as a real, authorized action, not a cosmetic one.
**12. Must not introduce:** an invitee-identity display the backend doesn't provide — **design-state
note, not a fix**: the list should show exactly what data exists today (role + status), not a
fabricated name/email column implying data that isn't there. If richer identity display is wanted,
that requires the separately-tracked, not-yet-authorized backend correction — flag it as a future
dependency, don't design around an assumption it exists.
**13. Design freedom:** list vs. card presentation, exact invite-form layout.
**14. Output request:** primary mobile concept; responsive desktop companion; the empty, populated,
and revoke-confirmation state variants.

---

### BRIEF 7 — ACT-01: Activation / Compliance

**1. Design context:** 11thONUS, the Owner, addressing what stands between "established" and
"submitted for verification" — reached from the Dashboard (surfaced proactively when something is
outstanding, and always reachable directly).
**2. User goal:** understand exactly what's still required before the Business can be submitted for
verification, and complete it.
**3. Required content:** current Terms status (unavailable / acceptance required / accepted, with
version context where accepted); an overall readiness summary (what's satisfied, what isn't — but
only among *real* `isReadyToSubmit` conditions: establishment fields + Terms, nothing invented).
**4. Required actions:** Accept Terms (only when available); Submit for Verification (only when
`isReadyToSubmit` is genuinely true).
**5. Required states — all seven must be designable, not collapsed into fewer:** Terms unavailable;
Terms available/acceptance required; Terms accepted/current; not ready to submit (some other
establishment condition unmet — should link back to the relevant Dashboard management area, not
just say "incomplete"); ready to submit; submit in-flight; submitted/pending verification.
**6. Navigation context:** a Dashboard-reachable surface; once `pending_verification`, this becomes
the Business's status display rather than an action screen (a state variant of the same surface,
not a new one).
**7. Mobile-first requirements:** each state must be unambiguous — a user must never wonder whether
they're allowed to submit; the disabled/blocked reason must be visible, not just an inert button.
**8. Responsive desktop requirements:** same states, more room to show the readiness checklist
clearly (e.g., a real checklist layout rather than a single paragraph).
**9. EN/FR requirements:** full, both languages — the "Terms unavailable" copy in particular must
remain exactly as governed today (plain, no legal text, no URL, nothing resembling real Terms
content, per the existing Founder QA checklist requirement) in **both** languages.
**10. Existing visual-direction requirements:** Trust-black for the Submit action once truly
available (a "Trust"-class action, per Part IX-A's action-color mapping — it is a serious,
consequential action, not a routine "Progress"-class continue); Progress-orange may be used for the
Accept-Terms action if treated as an active-task accent.
**11. Must preserve — this is the section this whole handoff exists to protect:** Submit must
remain genuinely disabled whenever `isReadyToSubmit` is false, exactly as enforced server-side
today — the design must never present a way to bypass, hide, or visually override that gate.
`platformConfig/businessTerms` having no content (today's real state in every environment) must
render as a real, honest "unavailable" state — never faked, never worked around with placeholder
Terms text.
**12. Must not introduce:** any actual Terms content (no invented legal text — `DEC-LEGAL-002` is
unresolved); a way to submit while something is outstanding; a Terms *authoring*/configuration UI
(no such capability exists — Terms is platform-authored, not business-configurable, per the
original reconciliation's §5); a re-acceptance-policy UI for future Terms versions (FD-5, deferred);
Reward-gold color use (this is a compliance surface, not an achievement moment).
**13. Design freedom:** the exact readiness-checklist visual treatment; how prominently the
Dashboard surfaces "something outstanding" before the Owner even opens this screen.
**14. Output request:** primary mobile concept; responsive desktop companion; all seven state
variants listed in §5, not a subset.

---

## PART XI — Implementation Traceability

| Screen/family | Existing route/component | Governing requirement | Existing backend capability | Implementation classification |
|---|---|---|---|---|
| EST-01 | `NewBusinessPage.tsx` (partial — currently combined with EST-02's fields) | FD-1, PRD3 §5/§6 | none — client-side collection only, no call | Frontend structural change |
| EST-02 | `NewBusinessPage.tsx` (partial) / `BranchStep.tsx` | FD-2, `REVIEW-AFTER-CREATE` disposition | `createBusiness` (fires here, atomically, unchanged required-field set) / `updateBusinessBranchProfile` (for address) | Frontend structural change |
| EST-03 | `ReviewStep.tsx` (partial — currently shows Terms/Team too) | FD-1, FD-3, `REVIEW-AFTER-CREATE` disposition | `getBusinessContext` (reads the already-persisted Business) | Frontend structural change |
| DASH-01 | none | FD-4 | `getBusinessContext` (existing) | Frontend net-new screen |
| DASH-02 | none (data exists via `updateBusinessProfile`) | §10 of the original reconciliation | `updateBusinessProfile` (existing) | Frontend net-new screen |
| DASH-03 (folded into DASH-02) | `BranchStep.tsx` | FD-4 | `updateBusinessBranchProfile` (existing) | Frontend structural change |
| DASH-04 | `TeamStep.tsx` | FD-1 | `createStaffInvitation` et al. (existing) | Frontend structural change |
| ACT-01 | `TermsStepContainer.tsx` + `ReviewStep.tsx`'s submit logic | Founder product boundary (Terms as compliance gate) | `acceptBusinessTerms`, `submitBusinessForVerification` (existing, unchanged) | Frontend structural change |

**Resolved — `REVIEW-AFTER-CREATE`, Founder-confirmed
(`ENG-P3-002-UI-HANDOFF-001-FOUNDER-DISPOSITION-2026-08-24.md`):** the architecture question this
Part previously flagged as open is now settled. `createBusiness` fires once, atomically, at the end
of EST-02 — exactly the "conservative" reading this document already assumed throughout Part V/X —
requiring **no backend change**, no new lifecycle status, and no client-only temporary Business
object. EST-03 reviews the real, already-persisted Business. This also surfaced and closed a real
gap in the original screen split: EST-01/EST-02's field lists as first drafted omitted
`countryCode`, `contactPhone`, `currencyCode`, and `timezone` — all backend-required at
`createBusiness` time — leaving no screen where they'd actually be collected. That gap is now fixed
(Part V/Brief 1/Brief 2, above): `contactPhone` moved to EST-01; `countryCode`/`currencyCode`/
`timezone` assigned to EST-02 alongside the location fields it already collected.

No backend capability is assumed to exist that doesn't (per §12 of every brief above); every "must
not introduce" line traces to a real absence confirmed in Part II/original reconciliation.

## PART XII — Deferred Items / Open Dependencies

Restated from the task's own out-of-scope list, all genuinely untouched by this handoff: production
UI implementation; Firebase changes; backend changes; `BusinessStatus` changes;
`Business.address`/`BusinessBranch.address` retirement or synchronization; Subscription Plan
implementation; future Terms re-acceptance policy; `DEC-LEGAL-002` resolution; the
invitation-identity backend correction (noted as a design-state constraint only, in Brief 6 §12);
speculative analytics; Capability 5/6 screens; Capability 4/5/6 redesign; deployment. The
establishment creation-timing question (Part XI) is **resolved** — `REVIEW-AFTER-CREATE`,
Founder-confirmed — and is no longer an open item.

## PART XIII — Design Acceptance Criteria

A Stitch concept produced from this handoff **fails review** if it does any of the following (per
this task's own instruction, restated as the concrete checklist the Founder can apply):

- [ ] Puts Team back into establishment (violates FD-1 / Brief 1-3 §12)
- [ ] Puts Terms back into the ordinary establishment wizard as a peer tab (violates the Founder
  product boundary / Brief 3 §12, Brief 7 §2)
- [ ] Requires reaching `pending_verification` before the Dashboard is reachable (violates FD-4)
- [ ] Invents a new Business lifecycle state or status label presented as backend truth (violates
  FD-3)
- [ ] Removes, hides, or visually bypasses existing backend Terms enforcement (violates Brief 7
  §11 — Submit must stay genuinely disabled per real `isReadyToSubmit`)
- [ ] Treats desktop as the primary design and mobile as an afterthought/adaptation (violates FD-6)
- [ ] Reproduces the current five-item desktop-style navigation row on a narrow mobile screen
  (violates the Founder's explicit prohibition, Part VI)
- [ ] Removes or degrades French accessibility/reachability (violates Part VIII)
- [ ] Exposes internal/backend terminology anywhere (violates Design Anti-Patterns §4)
- [ ] Invents unsupported Business functionality — multi-branch, analytics, loyalty metrics not in
  this capability, etc. (violates every brief's §12)
- [ ] Introduces Subscription Plan UI in any form (violates the already-approved OUT-OF-SCOPE
  disposition, FD-2)
- [ ] Silently resolves the `Business.address`/`BusinessBranch.address` question as if it were
  settled (violates FD-2/Part XI — the screen-level answer is settled, the data-model question is
  not, and no concept should imply a merged/synced field exists)
- [ ] Visually departs from the established 11thONUS direction (Part IX) without stated
  justification — e.g., introducing Reward-gold on a compliance/establishment screen, heavy
  shadows, floating labels, or gamified visual tropes

---

## Report

**1. Entry repository state:** `origin/main` confirmed at `0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8`
(`git fetch origin` + `git rev-parse`), unchanged since the prior disposition task.

**2. Governing sources inspected:** `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` (full),
`...-FOUNDER-DISPOSITION-2026-08-24.md` (full), `ENG-P3-002-DESIGN-001` (§6/§36/§37, re-confirmed
from prior tasks), PRD3 (§5/§6, re-confirmed), TRD16 §16.34, `DEC-LEGAL-002`,
`ENG-P2-003-DESIGN-001`'s Membership Rule, Founder QA checklist/evidence,
[UX Direction](ux-direction.md), [Navigation Model](navigation-model.md), [Design
Anti-Patterns](design-anti-patterns.md), [Design Decisions Register](design-decisions.md) (§DEC-UX-002
and the business-navigation entry), `stitch/exploration-v2/premium_verification_system/DESIGN.md`
(full token specification), `stitch/exploration-v1/concept_6_business_dashboard/` (screen.png +
code.html, the only business-facing exploration concept).

**3. Existing implementation inspected:** `NewBusinessPage.tsx`, `OnboardingWizard.tsx`,
`BranchStep.tsx`, `TermsStepContainer.tsx`, `TeamStep.tsx`, `ReviewStep.tsx`,
`SubmittedStatusPage.tsx`, `BusinessResolverPage.tsx`, `BusinessWizardPage.tsx`, `App.tsx`'s route
table, `completeness.ts`, `businessBootstrap.ts`, `business.ts`, `businessBranch.ts` — all
re-verified directly this task, not assumed from memory of prior tasks.

**4. Existing design evidence inspected:** all six `docs/07-product-design/*.md` documents plus the
full `premium_verification_system/DESIGN.md` specification and `concept_6_business_dashboard`'s
`code.html`/`screen.png` — the only prior Business-facing design artifact in the repository.

**5. Current UX findings:** establishment today is one dense 7-field form followed by a
freely-navigable five-tab wizard that bundles establishment, activation (Terms), and ongoing
management (Team) as equal-weight peers — exactly the structure FD-1 directs be separated. The
existing Main Location step already collects an optional address field, confirming FD-2's
screen-level resolution requires no new field, only correct placement/framing.

**6. Target journey confirmed:** Part III, as governed by FD-1–FD-7.

**7. Screen-family count:** 8 requiring a dedicated Stitch concept (EST-01/02/03, DASH-01/02/04,
ACT-01) + 1 consolidated cross-cutting state family (SYS-*, no dedicated concept) = 9 total rows in
the inventory.

**8. Total screen/state inventory:** Part V's table, with per-family state breakdowns condensed
beneath it (full 20-attribute treatment per family, not per individual micro-state, per this task's
own consolidation instruction).

**9. Screens that already exist (requiring restructuring, not net-new build):** EST-01, EST-02,
EST-03, DASH-03 (folded), DASH-04, ACT-01 — six of eight.

**10. Screens requiring structural redesign specifically:** all six above — none can simply be
"restyled" in place, since each currently carries content or navigation that must move or be
removed (Terms/Team off Review; Team off the wizard entirely; the five-tab row retired).

**11. Net-new screens:** DASH-01 (Dashboard Home), DASH-02 (Profile/Settings) — two of eight.

**12. Mobile-navigation recommendation:** none prescribed, per explicit instruction — Part IV/VI
specify only the required semantics (step/state clarity, back/resume, one-handed operability) and
explicitly forbid recreating the five-item row at any width; `concept_6_business_dashboard`'s
mobile-bottom-bar/desktop-top-nav split is offered as existing, non-binding evidence Stitch may
draw on.

**13. Desktop-navigation recommendation:** same — a responsive companion to whatever mobile pattern
Stitch proposes, not a separately invented desktop-first structure (Part VII).

**14. EN/FR treatment:** full parity required on all application UI copy across every screen,
including the two net-new Dashboard screens (which will need new translation keys — a
frontend/i18n-resource change, not performed by this task); Commerce Knowledge category labels are
explicitly exempted as a known, disclosed, non-UI data limitation (Part VIII).

**15. Visual-direction findings:** a complete, already-approved token specification exists
(`premium_verification_system/DESIGN.md`) and was extracted in full (Part IX) — colors, typography,
spacing, shape, elevation, and component character are all evidenced, not invented; the one
business-facing precedent (`concept_6_business_dashboard`) is Version-1-only and not part of the
approved Version 2 visual refinement, so its layout/navigation pattern is cited as reference
evidence while its exact V1 styling should defer to the V2 token system for actual visual
treatment.

**16. Stitch prompts produced:** 7 full briefs (Part X) — one per screen requiring a dedicated
concept, with DASH-03/Locations folded into Brief 5 (DASH-02) per Part V's consolidation, so 7
briefs cover the 8 inventory rows needing a concept.

**17. Implementation traceability findings:** Part XI — six frontend structural changes, two
frontend net-new screens, zero backend changes required for any screen as specified. **Superseded
by the `-FOUNDER-DISPOSITION` addendum below:** the creation-timing question this section
originally left open is now resolved (`REVIEW-AFTER-CREATE`).

**18. Architecture-affecting design risks:** **superseded** — see the `-FOUNDER-DISPOSITION`
addendum below; the one risk this section originally named is now resolved, not outstanding.

**19. Deferred items:** Part XII, restated from the task's own out-of-scope list — nothing new
added.

**20. Files modified:** this document (new) and the accompanying `IMPLEMENTATION_CHANGES.md`
entry. No other file.

**21. Diff summary:** zero source diff — confirmed via `git status`/`git diff` showing no changes
to `apps/`, `functions/`, `firebase.json`, `firestore.rules`, or `storage.rules`.

**22. Commands executed:** `git fetch origin`, `git rev-parse origin/main`, `git status --short`,
`find docs/07-product-design -type f`, direct `Read`/`grep`/`cat` of every source and governing
document listed in §2-4 above.

**23. Dependencies added:** none.

**24. Config changes:** none.

**25. Risks:** none introduced — this is a documentation/design-handoff artifact with no executable
effect. **Superseded:** the risk originally named here is resolved — see the
`-FOUNDER-DISPOSITION` addendum below.

**26. Rollback instructions:** delete this file and revert the `IMPLEMENTATION_CHANGES.md` entry if
ever needed — no other state exists to roll back.

**27. Persistent handoff document path:**
`docs/07-product-design/ENG-P3-002-UI-HANDOFF-001-business-establishment-dashboard-activation-design-handoff-2026-08-24.md`

**28. Exact recommended next Founder action:** review Part X's seven briefs and Part XIII's
acceptance criteria; disposition the one flagged architecture question (Part XI — conservative vs.
literal "Review → Finish setup" timing) if a preference exists, though the conservative reading is
usable as-is without further decision; then authorize Stitch generation itself (still a separate,
not-yet-performed step) using these briefs verbatim or as edited by the Founder.

Neither `ENG-P3-002` nor Capability 3 is marked complete by this task.

## Final gate

**ENG-P3-002-UI-HANDOFF-001 READY FOR FOUNDER DESIGN REVIEW — STITCH BRIEFING PACKAGE PREPARED; NO
IMPLEMENTATION PERFORMED**

---

## Addendum — 2026-08-24 (`ENG-P3-002-UI-HANDOFF-001-FOUNDER-DISPOSITION`): Journey Timing Resolved, Package Finalized

**Founder decision recorded: `REVIEW-AFTER-CREATE`.** A real Business record is created early in
establishment (at the end of EST-02, once every currently-backend-required field is collected);
the Business stays `draft`; Category/Type and Main Location are persisted against that real
Business; Review (EST-03) summarizes backend-authoritative, already-persisted data, never
client-only unsaved state; "Finish setup" is a UX-level confirmation, not a second creation event.
No new lifecycle status, no client-only temporary Business object, no additional backend/data-model
requirement — all preserved exactly as specified.

**Reconciliation performed (in-place, throughout the document above — this addendum records what
changed and why, it does not restate the corrected content):** Part III's target journey, Part IV
item 2, Part V's EST-01/02/03 table rows and per-family detail, Briefs 1–3 (all 14 sections each,
where affected), and Part XI's traceability table and risk paragraph were all updated to state the
creation timing definitively rather than leaving it as an open question. The original Report
section's §17/§18/§25 are marked superseded rather than silently rewritten, preserving the
document's own history per repository convention.

**One real gap found and closed during this reconciliation, not merely a wording fix:** pinning
down exactly *when* `createBusiness` fires required verifying exactly *what* it requires — direct
re-inspection of `businessBootstrap.ts`/`NewBusinessPage.tsx`'s `isComplete` check confirmed the
atomic call needs `displayName`, `primaryCategoryId`, `countryCode`, `city`, `contactPhone`,
`currencyCode`, `timezone` — seven fields. The original EST-01/EST-02 split (Business Identity &
Category = name/category/type; Main Location = display name/city/address) accounted for only four
of these; `countryCode`, `contactPhone`, `currencyCode`, `timezone` had no assigned screen at all.
This is now corrected: `contactPhone` moved to EST-01 (alongside identity, since it's contact
information); `countryCode`/`currencyCode`/`timezone` assigned to EST-02 (alongside the location
fields it already collected, since regional settings are naturally location-derived). No other
gap of this kind was found in Parts X/XIII — the seven other Design-Acceptance-Criteria items
(Team, Terms, verification-gating, lifecycle status, Terms enforcement, desktop-primacy, the
5-tab nav, French, backend terminology, unsupported functionality, Subscription Plan,
`Business.address`, visual direction) were all independently re-checked against every brief this
addendum did not otherwise touch and found already consistent — confirmed by direct grep count
(21/21 Mobile-first/Desktop/EN-FR sections present, one per brief × three) rather than assumed.

**Dashboard scope re-confirmed, no unsupported capability found:** Brief 4 (DASH-01) already
excluded revenue/transaction/loyalty/customer analytics explicitly in its own §12, and already
scoped its required content to exactly the eight items this task's Phase C asked to confirm
(identity/header, readiness status, outstanding requirements, next action, and entry points into
Profile/Settings, Locations, Team, Terms/activation). No correction was needed there.

**Final ordered Stitch-generation batches** (evaluated against the evidence, not assumed):
the task's suggested four-batch grouping holds, since it matches Part III's phase boundaries
exactly and each batch is independently generatable without a cross-batch dependency blocking it:

- **BATCH 1 — Business Establishment:** Brief 1 (EST-01), Brief 2 (EST-02), Brief 3 (EST-03) — in
  this exact order, since each screen's brief references the one before it.
- **BATCH 2 — Business Dashboard:** Brief 4 (DASH-01) — generate first in this batch, since
  Briefs 5/6 both link back to it as their entry point.
- **BATCH 3 — Activation / Terms:** Brief 7 (ACT-01) — independently generatable once Batch 1
  exists (it needs the same `isReadyToSubmit`/Terms-state vocabulary Batch 1 establishes), no
  dependency on Batch 2.
- **BATCH 4 — Business Management:** Brief 5 (DASH-02, includes DASH-03/Locations), Brief 6
  (DASH-04, Team) — both depend on DASH-01 (Batch 2) existing as their navigation entry point, so
  should follow it, but are independent of each other and of Batch 3.

Eight inventory rows, seven Stitch briefs (DASH-03 folded into Brief 5, unchanged from the base
document), zero net-new screens or briefs added by this disposition — only the timing/field-split
correction above.

**No implementation, no Stitch call, no Firebase change, no deployment, no `DEC-LEGAL-002` action
performed by this task** — confirmed via `git status`/`git diff` showing zero changes outside this
document and `IMPLEMENTATION_CHANGES.md`.

**Remaining design questions:** none identified as blocking. The document is now internally
consistent and ready for Stitch generation to begin, batch by batch, per the sequence above.

### Final gate (`ENG-P3-002-UI-HANDOFF-001-FOUNDER-DISPOSITION`)

**ENG-P3-002-UI-HANDOFF-001 FINALIZED — STITCH SCREEN GENERATION MAY BEGIN**
