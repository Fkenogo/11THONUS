# ENG-P3-002-ONBOARDING-JOURNEY-RECON-001 — Business Onboarding vs Post-Onboarding Management Reconciliation

**Date:** 2026-08-24
**Task type:** Analysis and documentation only. No application source, Functions, Firestore,
Rules, Firebase configuration, or deployment was touched. No lifecycle state was changed. No UI was
designed. No Stitch prompt was produced.

This document is **decision support for the Founder**, not an approved product decision. Nothing
below is self-authorizing.

---

## 1. Entry repository state

`origin/main` confirmed at `0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8` (`git fetch origin` + `git
rev-parse`), matching the expected post-`ENG-P3-002-CORR-LANGSWITCH-001`/`-REVALIDATION` baseline.
No worktree was created — this is a read-only analysis task with no build/test/deploy step, so no
isolation benefit exists in forking a new worktree.

## 2. Sources inspected

**Product/governance:** `docs/01-product/prd/03-business-registration.md` (full read, §5/§6/§12/§17/§26/§29);
`docs/00-governance/decisions/decision-register.md` (`DEC-LEGAL-002` full entry, line 1221);
`docs/02-technical/trd/16-frontend-and-pwa-architecture.md` §16.34;
`docs/05-implementation/roadmap/ENG-P3-002-DESIGN-001-business-onboarding-architecture-delivery-design.md`
(full read — §6, §7, §11, §12, §36, §37, §39); `docs/05-implementation/roadmap/ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md`
(§Membership Rule); `docs/05-implementation/reports/ENG-P3-002C-founder-qa-checklist-2026-08-22.md`;
`docs/05-implementation/reports/ENG-P3-002C-FOUNDER-QA-001-founder-qa-evidence-and-classification-2026-08-24.md`.

**Code:** `functions/src/domains/business/models/businessStatus.ts`,
`functions/src/domains/business/models/business.ts`,
`functions/src/domains/business/models/businessBootstrap.ts`,
`functions/src/domains/business/models/businessTermsAcceptance.ts`,
`functions/src/domains/business/repositories/businessTermsConfigRepository.ts`,
`functions/src/domains/business/services/acceptBusinessTermsCommand.ts`,
`functions/src/domains/business/services/businessLifecycleCommand.ts`
(`submitBusinessForVerificationCommand`/`assertCurrentBusinessTermsAccepted`),
`functions/src/index.ts` (`createBusiness`, `updateBusinessProfile`,
`updateBusinessBranchProfile`, `submitBusinessForVerification`, `acceptBusinessTerms`,
`createStaffInvitation`), `apps/web/src/business/onboarding/completeness.ts`,
`OnboardingWizard.tsx`, `NewBusinessPage.tsx`, `steps/TermsStepContainer.tsx`,
`steps/BranchStep.tsx`, `steps/TeamStep.tsx`, `steps/ReviewStep.tsx`.

## 3. Current onboarding journey (as implemented today)

1. **Sign in** → `/business` resolver → zero Businesses → `/business/new`.
2. **`/business/new`** (`NewBusinessPage.tsx`) — single form: Business name, category (live
   Commerce Knowledge selector), country, city, phone, currency, timezone. All seven fields
   required by the frontend's `isComplete` check and by the backend's `createBusiness` parser
   (atomically — `createBusiness` either creates a complete Business + default Branch, or nothing).
   `supportedLanguages: []` is also sent (not user-facing). On success: `POST createBusiness` →
   redirect to `/business/:businessId`.
3. **`/business/:businessId`** (`OnboardingWizard.tsx`) — a five-tab, freely-navigable (not
   sequentially gated) wizard: **Business category** (re-visits classification, adds optional
   Business Type), **Main location** (edits the auto-created default Branch), **Terms** (accept/
   view-unavailable), **Team** (optional Staff invitation), **Review** (read-only summary +
   disabled-until-ready Submit).
4. **Submit** → `submitBusinessForVerification` → `draft → pending_verification`.

## 4. Step classification (Phase B)

| Step | Purpose | Required data | Backend dependency | Blocks progression? | Blocks creation? | Blocks submission? | Mutable later? | Classification |
|---|---|---|---|---|---|---|---|---|
| Business identity (name/country/city/phone/currency/timezone) | Establish the Business record | All 6 fields | `createBusiness` (atomic, required) | N/A — this *is* creation | **Yes** — Business cannot exist without it | N/A (already satisfied at creation) | **Yes** — `updateBusinessProfile` exists | **A. ESTABLISHMENT** |
| Category | Classify the Business | `primaryCategoryId` | `createBusiness` (required); revisit via `updateBusinessProfile` | No (wizard tabs are freely navigable) | **Yes** — required at creation | Yes (`isReadyToSubmit` checks `isClassificationComplete`) | **Yes** | **A. ESTABLISHMENT** |
| Type | Refine classification | `businessTypeId` (optional) | `updateBusinessProfile` | No | No | No (`isClassificationComplete` only checks category) | **Yes** | **A. ESTABLISHMENT** (optional refinement) |
| Main location / Branch | Establish default operating location | `displayName`, `countryCode`, `city` on the default Branch | Auto-created at `createBusiness`; edited via `updateBusinessBranchProfile` | No | **Yes** — a `null` branch is a modelled integrity failure, not a normal incomplete state | Yes (`isReadyToSubmit` checks `isBranchComplete`) | **Yes** | **A. ESTABLISHMENT** |
| Terms | Platform legal-acceptance gate | Acceptance of the current `platformConfig/businessTerms` version | `acceptBusinessTerms`; **server-enforced** at `submitBusinessForVerificationCommand` via `assertCurrentBusinessTermsAccepted` (fails closed) | No (tab freely revisitable) | No | **Yes — enforced in the same Firestore transaction as the lifecycle write, not merely a frontend check** | N/A — acceptance is write-once per version, a new version requires a new acceptance | **B. ACTIVATION / COMPLIANCE GATE** |
| Team / Staff invitation | Optional collaborator invitation | None required | `createStaffInvitation`, fully independent of Business completeness | No | No | **No** — absent from `isReadyToSubmit` entirely, at both frontend and backend | Yes — invitations can be sent/revoked at any time, including post-submission | **C. POST-ONBOARDING MANAGEMENT** |
| Review | Confirm entered data before submitting | None (read-only) | None (client-side aggregation of already-fetched context) | N/A | No | No (a UX checkpoint, not a data requirement) | N/A | Supporting step for whichever stage precedes Submit — not independently classifiable |

**No step in the current implementation falls into "D. UNCLEAR — FOUNDER DECISION REQUIRED."**
Every step's technical role is unambiguous from source; the *product* question is whether Team
should be relocated, not whether its current technical behavior is unclear.

## 5. Terms semantic analysis (Phase C)

**What "Business Terms" means, precisely:** a single, **platform-authored**, versioned legal
document that a Business's Owner must accept once per version as a condition of reaching
`pending_verification`. It is **not** a business-configurable, customer-facing programme/reward
terms feature — there is no authoring workflow, no per-business customization, and no concept of a
business writing its own terms anywhere in governing docs or code.

- **Who authors it:** the platform (Founder + legal adviser, per `DEC-LEGAL-002`'s `Owner` field) —
  never the Business.
- **Who accepts it:** the Business's Owner, via `acceptBusinessTerms`, authorized as the Business's
  actual `ownerUserId`.
- **When acceptance is required:** enforced **server-side**, inside the same Firestore transaction
  as the `draft → pending_verification` write (`businessLifecycleCommand.ts:78-120`) — this is not
  a frontend-only convenience check; a client that skipped the Terms UI step entirely would still
  be rejected by the backend.
- **Is it versioned:** yes — every acceptance is bound to a specific `termsVersion` string,
  server-resolved from `platformConfig/businessTerms.currentVersion`, never client-supplied.
- **Can content change:** yes, by design — a version bump on `platformConfig/businessTerms` (an
  out-of-band, server-side/ops action; no client write path exists) immediately invalidates prior
  acceptances for any *future* submission check, since `assertCurrentBusinessTermsAccepted` always
  re-reads the *current* version and looks for a matching acceptance record.
- **What happens after a Terms change:** the acceptance model is append-only —
  `BusinessTermsAcceptance` documents are never mutated; a new version requires a wholly new
  acceptance record. There is no design or code addressing what happens to an *already-verified*
  Business if Terms change post-verification (out of this task's evidence — a real open question,
  see §22).
- **Relationship to `DEC-LEGAL-002`:** `DEC-LEGAL-002` (`OPEN_LEGAL`) governs the Terms **content**
  — "Reward Program terms, business obligation to honour rewards, dispute language, platform
  liability, subscription terms" — not the acceptance **mechanism**, which is fully built and
  server-enforced already. Today, `platformConfig/businessTerms` has no content in any environment
  (confirmed by DEV: the document doesn't exist), so the gate is a real, currently-unsatisfiable
  block on every real submission — by design, not a bug.
- **Are configuration and acceptance separate concepts:** yes, structurally — `platformConfig/businessTerms`
  (one platform-wide version pointer) and `businessTermsAcceptances` (one record per
  Business-owner-version) are two entirely separate collections with no client write path to the
  former at all.

**Unresolved question explicitly identified, not invented an answer for:** no governing document
addresses what happens to a Business already past `pending_verification`/`active` if the required
Terms version changes later (re-acceptance required to remain active? grandfathered? blocked from
further action until re-accepted?). **FOUNDER DECISION REQUIRED** if/when this becomes practically
relevant — out of this task's evidence base.

## 6. Team dependency analysis (Phase D)

**No technical, security, or product requirement was found anywhere that requires Staff invitation
during Business establishment.** The only structural membership invariant in the codebase is "a
Business must retain at least one active owner" (`ENG-P2-003-DESIGN-001`'s Membership Rule),
enforced entirely through `Business.ownerUserId` (set once, immutable, at `createBusiness`) — this
has nothing to do with Staff. `createBusiness`/`businessBootstrap.ts` creates no implicit
membership record beyond the Owner relationship carried directly on the `Business` document; there
is no separate Owner-membership row that Staff-invitation logic depends on or interacts with.

At the frontend, `isReadyToSubmit` (`completeness.ts:44-50`) does not reference Team/Staff at all.
At the backend, `assertCurrentBusinessTermsAccepted` and the rest of
`submitBusinessForVerificationCommand` never query staff/invitation state. `createStaffInvitation`
is a fully independent callable with no dependency on Business completeness or lifecycle status
beyond ordinary authorization (Owner, or a Manager once `active`/`trial`, per existing permission
rules already governed elsewhere).

**PRD3 §5 Step 7 itself labels staff invitation "(optional)"**, and `ENG-P3-002-DESIGN-001` §11-12
records the placement rationale explicitly as a PRD-sequencing/UX choice, not a technical
necessity: *"the owner's onboarding does not wait for the invitee to accept... a dependency no
governing source imposes."* §36's Founder disposition (`FD-P3-002`, already approved) states
directly: *"A Business may complete onboarding with only its Owner membership... no invitation is
required to submit the Business."*

**Conclusion: Team can safely become a Business Dashboard management capability after
establishment with zero technical dependency broken.** No Owner is ever blocked from completing
onboarding by the absence of Staff, today or under the proposed relocation.

## 7. Minimum Business-establishment requirements (Phase E)

Grounded strictly in what `createBusiness` actually requires atomically (frontend `isComplete` +
backend parser, both already enforce the same set): **displayName, primaryCategoryId, countryCode,
city, contactPhone, currencyCode, timezone.** `businessTypeId` is confirmed optional at every
layer (`isClassificationComplete` checks only `primaryCategoryId`).

**Assessment of the Founder's candidate sequence** (Create Business → Category/Type → Main
Location → Review/Complete):

- **Create Business + Category:** matches exactly — both are collected together on the single
  `createBusiness` call today (the current `NewBusinessPage` form already bundles name, category,
  and location-adjacent fields into one atomic step; there is no existing separate "create, then
  categorize" sequence to preserve or break).
- **Type:** correctly optional, as proposed.
- **Main Location:** the default Branch already exists atomically from `createBusiness` — the
  Founder's model implicitly separates "create Business" from "set main location" as two steps,
  but the current backend creates both atomically in one call. This is not a contradiction — it
  just means the *current* atomic-creation architecture would need to either (a) stay atomic and
  present the UI as one combined "establishment" step regardless of screen count, or (b) be
  restructured to create a bare Business first and attach the Branch in a second call. **This is a
  backend architecture question, not resolved by this analysis — flagged for Phase I impact, not
  decided here.**
  - **A real gap vs. PRD3, found and disclosed here, not previously flagged:** PRD3 §6 lists
    **"Business Address"** and **"Subscription Plan"** as *mandatory* fields, and PRD3 §5 Step 4
    is "Select subscription plan" — neither is collected or required anywhere in the current
    implementation (`ENG-P3-002-DESIGN-001`'s own classification table already marks Subscription
    Plan "OUT OF SCOPE," a disclosed and Founder-approved deferral, not a new finding — but the
    "Business Address" field being PRD-mandatory yet absent from both the form and the backend
    parser is a genuine, undisclosed-until-now PRD/implementation drift). **FOUNDER DECISION
    REQUIRED / DOCUMENTATION-ONLY RECONCILIATION** — see §14.
- **Review/Complete establishment:** matches the existing Review step's role, though today Review
  also surfaces Terms/Team status — under the proposed split, an establishment-only Review would
  show only establishment data.

**Nothing beyond the seven fields above is technically or product-governance required to establish
a usable draft Business.** Currency and timezone are backend-required today but are not named
anywhere in PRD3's mandatory list either — the same class of drift as Business Address, in the
opposite direction (implementation requires more than PRD names). Recorded, not resolved.

## 8. Current Business lifecycle (Phase B/F context)

`draft → pending_verification → trial → active → suspended/expired → closed → archived`
(`businessStatus.ts:32-54`), exactly as re-confirmed at source. Only `draft → pending_verification`
is implemented today (`submitBusinessForVerificationCommand`). Every transition beyond that is
explicitly, deliberately ungoverned/unimplemented in this codebase (verification mechanism,
subscription-lapse detection, and owner-self-suspend are all named-but-undesigned in the model's
own header comment) — not a gap introduced or discoverable by this task, a pre-existing, disclosed
boundary.

## 9. Recommended activation/compliance gates (Phase F)

Using only what is already true today (no new mechanism proposed):

- **BUSINESS CREATED** = `draft`, immediately after `createBusiness` (establishment fields only).
- **BUSINESS CONFIGURED** = not a distinct modelled state today — `draft` already permits every
  field to be edited freely (category, type, branch) with no separate "configured" checkpoint. If
  adopted, this would need to remain a UI-level concept only (a Review/complete-establishment
  screen), not a new backend status, unless the Founder wants a genuinely new lifecycle state
  (**data-model change**, flagged in §18).
- **BUSINESS READY FOR SUBMISSION** = today's `isReadyToSubmit` (details + classification + branch
  + Terms) — already exists as a frontend predicate, not a backend status.
- **BUSINESS SUBMITTED FOR VERIFICATION** = `pending_verification`, exactly as today, unchanged.
- **BUSINESS VERIFIED / ACTIVE** = `trial`/`active`, exactly as today (mechanism ungoverned,
  unchanged by this analysis).

**Where legal/platform Terms acceptance should logically occur:** it is already, correctly, a
server-enforced precondition of `draft → pending_verification` — **this should not move**. Relocating
Terms acceptance itself out of the establishment-adjacent flow would not change *when* it's
enforced (the backend gate is independent of frontend screen placement) but would change *where the
Owner is asked* — this analysis finds no reason to change either the enforcement point or the
general timing (must-accept-before-submission), only, potentially, which screen presents it.
**Business/programme Terms configuration** does not exist as a concept anywhere in this codebase
today (see §5) — there is nothing to relocate, because there is nothing there to move.
**Staff invitation** — per §6, has zero dependency on submission timing and can move to
post-`pending_verification` (or post-`active`) Dashboard management without breaking anything.
**Verification submission** — unchanged, remains the terminal onboarding action.

## 10. Post-onboarding Dashboard candidates (Phase G)

| Capability | Currently onboarding-only? | Already independently mutable via existing callable? | Recommended disposition |
|---|---|---|---|
| Business profile (name/currency/timezone/contact) | No — `updateBusinessProfile` already exists | Yes | Dashboard-appropriate; also remains editable during establishment |
| Business category/type | No — same `updateBusinessProfile` | Yes | Dashboard-appropriate; also remains editable during establishment |
| Locations/branches | No — `updateBusinessBranchProfile` already exists; today only the single default Branch is exposed in the wizard | Yes | Dashboard-appropriate for ongoing branch management (adding *additional* branches beyond the default is not evidenced anywhere as implemented — out of this analysis's evidence, flag only) |
| Terms | Acceptance is a one-time-per-version gate, not an ongoing management surface — there is no "Terms configuration" capability to place in a Dashboard at all (see §5) | N/A (write-once acceptance, no config surface exists) | **Not a Dashboard capability today** — remains a compliance gate; nothing to relocate |
| Team/Staff | Currently onboarding-embedded (optional) | Yes — `createStaffInvitation`/`revokeStaffInvitation`/`listStaffInvitations`/`listStaffMemberships` all already exist as standalone, lifecycle-independent callables | **Strong Dashboard candidate** — this is architecture classification only, not a redesign; the underlying capability moves screen, not backend shape |

## 11. Mobile-first requirement compatibility (Phase H)

**No conflict found with any existing approved requirement.** `docs/02-technical/trd/16-frontend-and-pwa-architecture.md`
§16.34 already states: *"The frontend shall be mobile-first. Supported layout ranges shall include:
small mobile; standard mobile; large mobile; tablet; desktop. The customer and staff experiences
shall remain fully usable on mobile."* This TRD chapter's own header marks it **`Status: Draft for
approval (pre-freeze)`** — not yet frozen, but already directionally aligned with the Founder's
proposed principle, not contradicting it. PRD3 §2's "work comfortably on a smartphone" objective
(also pre-freeze) is likewise aligned. **No governing document asserts desktop-first or
desktop-only design anywhere found.** Recording the proposed principle verbatim for Founder
disposition does not conflict with anything currently approved — it would, if adopted, most
naturally be captured as a formal-freeze update to TRD16 §16.34 rather than a new requirement,
since the substance already exists there in draft form.

## 12. Current mobile-nav finding disposition (Phase H)

Unchanged from `ENG-P3-002C-FOUNDER-QA-001`: the current five-tab horizontal step navigation failed
Founder mobile acceptance (recorded FAIL, not a documented-requirement violation, since no
governing source mandates a specific pattern — only the general "usable on mobile" objective,
which the current implementation does not structurally breach but which the Founder rejects as a
pattern). **This analysis does not choose a replacement pattern**, per explicit scope. It records,
for Stitch's benefit, that whatever pattern replaces it must preserve the same *semantics* the
current tabs provide: five freely-navigable destinations, one visibly "current," each independently
reachable at any completeness state (not sequentially gated) — a stepper, bottom nav, drawer, or
accordion could each satisfy this; the choice is explicitly reserved to the Stitch/design process.

## 13. PRD impacts (Phase I)

**DOCUMENTATION ONLY.** If the Founder's split is adopted: PRD3 §5's nine-step flow would need
restructuring into an explicit two-phase document (establishment steps vs. Dashboard-deferred
steps); §6's mandatory-field list should be reconciled against the Business-Address/Subscription-Plan
drift found in §7 above (a pre-existing gap, not created by this task); §17 ("Businesses may invite
staff during onboarding or later") already accommodates the split without contradiction — no change
needed there; §26 FR-BO-005 ("Businesses shall invite staff") should be clarified as
Dashboard-fulfillable, not onboarding-specific, if adopted.

## 14. TRD impacts (Phase I)

**DOCUMENTATION ONLY** for TRD16 §16.34 (formalizing mobile-first from draft to approved, if the
Founder adopts the principle in §11). **No TRD currently defines a Business Terms schema** (see
§5) — if the split clarifies Terms as purely a compliance gate (no config surface), no TRD change
is needed; TRD10 remains accurate as-is (it defines Customer consent, not Business Terms, already
correctly). No other TRD impact identified.

## 15. Frontend impacts (Phase I)

**FRONTEND CHANGE**, not performed by this task: relocating the Team step out of
`OnboardingWizard.tsx` into a new (unbuilt) Dashboard route; restructuring `OnboardingWizard.tsx`'s
`STEP_ORDER` to drop `"team"`; the eventual mobile-first navigation replacement (already tracked as
its own, separately-scoped future correction, not new to this task). No Terms-related frontend
change is implied by this analysis, since Terms remains a compliance gate.

## 16. Backend impacts (Phase I)

**Likely none required**, based on current evidence: `createStaffInvitation` and related callables
are already lifecycle-status-independent (invocable regardless of `draft`/`pending_verification`/
`trial`/`active`, subject to existing authorization rules) — moving the *frontend screen* that
calls them does not require any backend change. **Possible BACKEND CHANGE, contingent on a Founder
decision not made here:** if "BUSINESS CONFIGURED" (§9) is wanted as a genuine new lifecycle
state rather than a UI-only checkpoint, that would require a `businessStatus.ts` model change —
explicitly flagged as contingent, not recommended.

## 17. Data-model impacts (Phase I)

**Likely none required** for the Team relocation (no schema change — same collections, same
documents, same fields). **Possible DATA-MODEL CHANGE, contingent:** only if a new lifecycle state
is introduced (§16) or if "Business Address" is added to reconcile the PRD gap found in §7
(a straightforward additive field, not evidenced as blocking anything today).

## 18. Test impacts (Phase I)

**TEST CHANGE**, not performed: `OnboardingWizard.test.tsx`'s `STEP_ORDER`-dependent tests (five
steps → four); the `TeamStep`-in-wizard tests would need to move to wherever the Dashboard Team
surface lives; `completeness.ts`/`isReadyToSubmit` tests are already Team-independent today and
would need no change. Backend tests for `createStaffInvitation` etc. are already
lifecycle-independent and would need no change.

## 19. `DEC-LEGAL-002` implications (Phase I / explicit check)

**None — `DEC-LEGAL-002` is not touched, bypassed, or affected by this proposed split in any way.**
Terms remains exactly where it is today: a server-enforced precondition of `draft →
pending_verification`, still blocked in practice by the still-open, still-unresolved
`DEC-LEGAL-002` content decision. The proposed split does not relocate, weaken, remove, or
reinterpret the Terms gate — it only reclassifies Team/Staff, which was never connected to
`DEC-LEGAL-002` in the first place.

## 20. Recommended target journey (Phase J) — evidence-grounded, not implemented

**1. Business establishment/onboarding:**
- **User objective:** get a usable draft Business into the system with the minimum data the
  backend actually requires.
- **Required information:** displayName, primaryCategoryId (Type optional), countryCode, city,
  contactPhone, currencyCode, timezone, default Branch (already bundled atomically today).
- **Completion condition:** `isBusinessDetailsComplete && isClassificationComplete &&
  isBranchComplete` (all three already exist, unchanged).
- **Next destination:** the activation/compliance gate (Terms), then Review/Submit.

**2. Activation/compliance gates:**
- **User objective:** satisfy the legally-required precondition to request verification.
- **Required information:** acceptance of the current platform Terms version.
- **Completion condition:** `isTermsComplete` (unchanged) — currently unsatisfiable in any
  environment because `platformConfig/businessTerms` has no content; **FOUNDER DECISION
  REQUIRED / EXTERNALLY BLOCKED**, not this task's to resolve (`DEC-LEGAL-002`).
- **Next destination:** Submit → `pending_verification`.

**3. Post-onboarding Business management (Dashboard):**
- **User objective:** ongoing administration — invite/manage Staff at any point in the Business's
  life, independent of verification status.
- **Required information:** none required to *reach* this area — Team is purely additive.
- **Completion condition:** N/A — this is an ongoing area, not a gated step.
- **Next destination:** N/A — a persistent Dashboard surface, not a linear flow.

**FOUNDER DECISION REQUIRED, explicitly, on:** (a) whether "Business Address"/"Subscription Plan"
PRD-mandatory fields should be added to establishment, deferred formally, or have the PRD corrected
to match implementation; (b) whether a genuine new "configured" lifecycle state is wanted, or
whether establishment stays a single `draft` state as today; (c) whether the Dashboard's Team
surface should be reachable pre-`pending_verification` (e.g., from within the still-in-progress
onboarding record) or only post-submission — evidence shows no technical barrier either way, this
is purely a Founder UX-sequencing choice.

## 21. UI-HANDOFF-001 impact (Phase K)

Screens should be pre-classified for the handoff, before Stitch prompt generation, as:

- **Onboarding screens:** Business creation form (`/business/new`), Category/Type selection, Main
  location/Branch, Review-and-submit (establishment-scoped version, Team status removed from its
  summary if the split is adopted).
- **Activation/compliance screens:** the Terms acceptance screen (unchanged in role; still gates
  Submit) and the Terms-unavailable state (unchanged).
- **Business Dashboard screens:** a **new** screen family, not yet designed or evidenced anywhere
  in this repository — the handoff should treat this as net-new scope, not a relocation of an
  existing design.
- **Team management screens:** relocate the existing Team step's content into the new Dashboard
  family — its underlying data/actions (invite, list pending, revoke) are unchanged, only its
  container and entry point move.
- **Terms management screens:** **none exist and none should be created** — per §5/§10, there is
  no Business-side Terms *configuration* concept in this system at all; only the one-time
  acceptance screen exists, and it stays classified as an activation/compliance screen, not a
  Dashboard screen.

No Stitch prompts are produced by this task.

## 22. Open Founder decisions (consolidated)

1. Adopt, modify, or reject the onboarding/Dashboard split itself.
2. Business Address / Subscription Plan: add to establishment, formally defer, or correct the PRD.
3. Whether "BUSINESS CONFIGURED" needs to be a real new lifecycle status or stays UI-only.
4. Whether the Dashboard is reachable during `draft` (pre-submission) or only after
   `pending_verification`.
5. What should happen to an already-`active` Business if the required Terms version changes later
   (re-acceptance policy) — unaddressed by any governing document found.
6. Whether/when to commission the mobile-first TRD16 §16.34 freeze update.
7. Whether to commission a Stitch concept for the new Dashboard screen family (net-new, not
   previously scoped anywhere).

## 23. Files modified

This document (new) and the accompanying `IMPLEMENTATION_CHANGES.md` entry. No other file.

## 24. Code diff summary

**Zero** — confirmed via `git status`/`git diff` showing no changes to `apps/`, `functions/`,
`firebase.json`, `firestore.rules`, or `storage.rules`.

## 25. Commands executed

`git fetch origin`, `git rev-parse origin/main`, `git status --short`, targeted `grep`/`sed`/`cat`
reads of the source and documentation files listed in §2, one read-only research agent dispatch for
broad governing-document cross-referencing (no writes).

## 26. Dependencies added

None.

## 27. Config changes

None.

## 28. Firebase/deployment/data changes

None. No Firebase CLI/MCP command was issued by this task.

## 29. Risks

None introduced — this is an analysis document with no executable effect. The primary risk is
misreading it as authorization to implement; it explicitly is not.

## 30. Rollback instructions

Delete this file and revert the `IMPLEMENTATION_CHANGES.md` entry if ever needed — no other state
exists to roll back.

## 31. Persistent report path

This document:
`docs/05-implementation/reports/ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-onboarding-vs-management-reconciliation-2026-08-24.md`

## 32. Changes-tracking state

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a corresponding entry (see below).

## 33. Exact recommended next Founder action

Review §22's seven open decisions and disposition each explicitly. If the split is adopted in
principle, the natural next bounded task is a **design-only** amendment to
`ENG-P3-002-UI-HANDOFF-001`'s screen classification (per §21) — still no source change — followed
by separately authorized frontend-only work to relocate the Team step once the Dashboard
destination itself has been designed (it does not exist yet). No backend work is anticipated unless
decision (3) in §22 introduces a new lifecycle state.

## Final gate

**ENG-P3-002-ONBOARDING-JOURNEY-RECON-001 READY FOR FOUNDER DISPOSITION — ONBOARDING / ACTIVATION /
MANAGEMENT BOUNDARIES RECONCILED**
