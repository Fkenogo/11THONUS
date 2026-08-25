# ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-FOUNDER-DISPOSITION — Recorded Founder Dispositions & Business Address Reconciliation

**Date:** 2026-08-24
**Task type:** Governance/documentation only. No production source, Functions, Firestore, Rules,
Firebase configuration, or deployment was touched. No lifecycle state was changed. No Stitch work
began.

This document records the Founder's dispositions on the seven open decisions from
`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` §22, and performs the one bounded reconciliation
explicitly requested (Business Address vs. Main Location address) before
`ENG-P3-002-UI-HANDOFF-001` is authorized to begin.

---

## 1. Entry repository state

`origin/main` confirmed at `0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8` (`git fetch origin` + `git
rev-parse`) — unchanged since the reconciliation report and its Founder-disposition-prep pass. No
worktree created (read-only/documentation task, no build/test/deploy step).

## 2. Governing sources inspected

`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001-onboarding-vs-management-reconciliation-2026-08-24.md`
(full re-read); `docs/01-product/prd/03-business-registration.md` (§5, §6, §9-10 re-read for
branch/location terminology); `docs/00-governance/decisions/decision-register.md`
(`DEC-LEGAL-002`); `docs/02-technical/trd/16-frontend-and-pwa-architecture.md` §16.34;
`ENG-P3-002-DESIGN-001-business-onboarding-architecture-delivery-design.md` (§6, §36 `FD-P3-002`);
`docs/05-implementation/reports/ENG-P3-002C-founder-qa-checklist-2026-08-22.md`.

**Source re-verified directly, not trusted from the prior report:**
`apps/web/src/business/onboarding/steps/BranchStep.tsx` (full),
`apps/web/src/business/onboarding/NewBusinessPage.tsx`,
`apps/web/src/business/onboarding/steps/ReviewStep.tsx`,
`apps/web/src/business/api/createBusiness.ts`,
`functions/src/domains/business/models/business.ts`,
`functions/src/domains/business/models/businessBranch.ts`,
`functions/src/domains/business/models/businessBootstrap.ts`,
`functions/src/index.ts` (`createBusiness`/`updateBusinessProfile` parsers).

## 3. Exact Founder dispositions recorded

**FD-1 — Onboarding/Dashboard split: ADOPTED.** Business establishment and ongoing Business
management are separate experiences. Team/Staff is confirmed **not** part of initial Business
establishment.

**FD-2 — Business Address / Subscription Plan:**
- Subscription Plan: **retains its already-approved OUT-OF-SCOPE disposition.** No
  subscription-plan functionality is introduced by this or any related task.
- Business Address: Founder direction states address belongs to the Main Location information
  collected during establishment. **Reconciled against evidence below (§4) before being recorded
  as an implementation requirement**, per the task's explicit instruction not to guess.

**FD-3 — Business Configured status: NOT ADOPTED as a backend concept.** No new `BusinessStatus`
value is introduced. The existing `draft` status is retained unchanged. Wording such as "setup
complete"/"establishment complete"/"ready" may exist as a **UI-only** concept where useful, with no
backend lifecycle-state equivalent created by this disposition.

**FD-4 — Dashboard availability: the Business Dashboard becomes available once initial Business
establishment is completed, WITHOUT requiring `pending_verification`.** A Business may enter its
Dashboard while its persisted `status` remains `draft`. Explicitly recorded: this must not weaken
any existing lifecycle, authorization, completeness, verification, or Terms gate — none of those
mechanisms are touched by this disposition (confirmed unaffected, §8-10 below).

**FD-5 — Future Terms re-acceptance: DEFERRED.** No policy is invented for what happens to an
already-`active` Business if a new Terms version is published later. Recorded as unresolved,
dependent on `DEC-LEGAL-002` and any subsequent Terms architecture work. Current server-enforced
Terms behavior (`assertCurrentBusinessTermsAccepted`, unchanged) remains exactly as implemented.

**FD-6 — Mobile-first: ADOPTED as the governing UI direction for this workstream**, subject to the
repository's normal TRD-freeze governance mechanism (not performed by this task — TRD16 §16.34
remains in its existing `Draft for approval (pre-freeze)` state; this disposition records the
Founder's adoption of its *direction*, not a formal freeze action). Mobile is the primary/default
design target; desktop remains a fully supported, responsive Business Dashboard experience;
"mobile-first" is explicitly not "mobile-only."

**FD-7 — Stitch design commission: AUTHORIZED for `ENG-P3-002-UI-HANDOFF-001` preparation**, to
begin as a **separate, subsequent task** — not performed here. The handoff is authorized to cover
the coherent Business Establishment → Business Dashboard → Activation/Compliance → ongoing Business
Management experience, not a cosmetic redesign of the current five-step wizard alone.

## 4. Business Address reconciliation result

**Finding: (e) genuinely two different fields exist in the current data model, and no governing
document establishes them as equivalent.** Not a guess — traced precisely through source:

- **`Business.address`** — a field on the `Business` aggregate itself
  (`functions/src/domains/business/models/business.ts:46`, TRD10 §10.6.3-governed, per that file's
  own header). It is optional, settable at `createBusiness` time via `request.address`
  (`businessBootstrap.ts:95`) and later via `updateBusinessProfile` (`functions/src/index.ts:503`,
  `545` area — `optionalStringField("address", "address")`). **However, `NewBusinessPage.tsx` never
  collects or sends an `address` value at all** — confirmed by direct inspection: the form's field
  list is name/category/country/city/phone/currency/timezone only, and `handleSubmit`'s payload has
  no `address` key. `Business.address` is therefore **structurally supported but never populated by
  any existing onboarding UI** — it is always `undefined` for every Business created through the
  real product today. It is also never displayed anywhere in `ReviewStep.tsx` (zero matches).

- **`BusinessBranch.address`** — a separate field on the `BusinessBranch` aggregate
  (`functions/src/domains/business/models/businessBranch.ts:26`, "Deliberately has... `address?`").
  **This one is already collected today**, on the existing Main Location step
  (`apps/web/src/business/onboarding/steps/BranchStep.tsx:23,42-46`) — a plain, optional
  `TextField` (`branchAddress`, label `branch.addressLabel`), persisted via
  `updateBusinessBranchProfile`. `businessBootstrap.ts:104-111` confirms the default Branch created
  atomically at `createBusiness` time inherits only `displayName`/`countryCode`/`city` from the
  Business — **`address` is never copied between the two records**; they are independently set,
  independently stored, on two separate Firestore documents.

**Answering the task's five reconciliation questions directly:**
- **(a) Same concept?** Semantically, almost certainly yes (both represent a physical/postal
  address) — but **structurally, no**: they are two unrelated fields on two separate aggregates
  with no sync, no shared source of truth, and no governing document stating they must match.
- **(b) Already collected but optional?** **Partially — this corrects an error in the prior
  reconciliation report.** `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` stated Business Address "is
  neither collected nor required anywhere in the current implementation." That is **true only for
  `Business.address`**. It is **false for the Branch-level field** — an optional address *is*
  already collected today, just on the Main Location/Branch step, not on the initial
  `createBusiness` form. The Founder QA screenshot showing "Address (optional)" reflects this real,
  already-shipped `BranchStep.tsx` field — it was not a QA artifact or a misread screenshot.
- **(c) Persisted?** Yes, whichever field is populated: `Business.address` via `createBusiness`/
  `updateBusinessProfile`; `BusinessBranch.address` via `updateBusinessBranchProfile`. Both are real,
  governed write paths, not placeholders.
- **(d) Is PRD3's drift mandatory-vs-optional rather than collected-vs-not-collected?** **Yes, for
  the Branch-level field specifically** — PRD3 §6 lists "Business Address" as **Mandatory**, while
  the actual implemented field (`BranchStep.tsx`'s `address`) is optional (`disabled={!displayName
  || !city}` — address is excluded from the required check). For the Business-level field, the
  drift remains collected-vs-not-collected, exactly as the prior report found, since it's never
  surfaced in any UI at all.
- **(e) Genuinely different concepts?** **Structurally yes, at the data-model level**, per the
  above — even though they likely represent the same real-world concept, the codebase does not
  currently treat them as one.

**PRD3 itself does not disambiguate which of the two "Business Address" refers to.** PRD3 §6 lists
"Business Address" alongside other Business-level fields (Name, Category, Country, City, Phone),
which leans toward the top-level `Business.address` reading — but PRD3 §9-10 independently
establishes "branch" as a real, recognized product concept (subscription-plan-gated: "Single
branch" for Starter, "Future multi-branch support" for Professional), and never states that a
Business's own top-level address and its (single, current-tier) branch's address are meant to be
the same value or the same UI field.

**Per this task's explicit instruction: this narrow question — whether the Founder intends
`BusinessBranch.address` (the field already collected on Main Location, matching the Founder's
stated direction) to be treated going forward as *the* implementation of "Business Address," with
`Business.address` left unused/unpopulated by onboarding UI indefinitely, or whether both fields
should eventually be reconciled/synced — is not resolved here.** The Founder's stated direction
("address belongs to Main Location") is recorded as the *product* answer for FD-2 and is sufficient
to guide `UI-HANDOFF-001`'s screen design (an address field belongs on the Main Location screen,
not a separate top-level field) — but it does not, by itself, resolve the underlying two-field data
model question, which remains **open** pending a narrower future disposition if/when it becomes
practically relevant (e.g., if a future capability needs a top-level Business address independent
of any branch). **This does not block `UI-HANDOFF-001`** — the screen-level answer is already clear
from FD-2 regardless of which backend field eventually backs it.

## 5. PRD impacts

**DOCUMENTATION ONLY**, none performed. If/when PRD3 is revised: §6's "Business Address"
mandatory-field entry should be clarified as belonging to Main Location (per FD-2), and its
mandatory/optional status reconciled with the actually-implemented optional `BranchStep.tsx` field
(§4's finding d). §5's nine-step flow would need restructuring to reflect FD-1's establishment/
Dashboard split (Team relocated out of the numbered onboarding steps). No other PRD3 impact beyond
what the original reconciliation report already identified.

## 6. TRD impacts

**DOCUMENTATION ONLY**, none performed. TRD16 §16.34 remains in its existing pre-freeze draft
state — FD-6 records Founder *adoption of direction*, not a formal freeze, which if pursued would
be its own governance action, not part of this task. No TRD10 change is implied — `Business.address`
already exists there as a governed optional field; nothing about this disposition requires removing
or altering that schema entry, even though it's unused by the current onboarding UI.

## 7. `ENG-P3-002` design impacts

None to the merged `ENG-P3-002A`/`002B`/`002C` implementation itself — FD-1 through FD-7 are
forward-looking dispositions for `UI-HANDOFF-001` and subsequent frontend work, not retroactive
changes to already-shipped, already-Founder-approved architecture. `ENG-P3-002-DESIGN-001`'s own
`FD-P3-002` disposition (already approved, quoted in the original reconciliation report) already
anticipated Team's optionality — FD-1 formalizes the *screen placement* consequence of that
existing approval, it does not reopen or contradict the design.

## 8. Lifecycle impacts

**None.** FD-3 explicitly retains the existing 8-state `BusinessStatus` model unchanged. FD-4
(Dashboard reachable during `draft`) does not require or imply any lifecycle change — Dashboard
availability is a **frontend routing/access concept**, not a backend status; the Business's
persisted `status` stays `draft` throughout, exactly as it does today whenever any onboarding field
is edited. No transition table change, no new status.

## 9. Backend/data-model impacts

**None required by this disposition.** FD-3 forecloses the one data-model change (`businessStatus.ts`)
the original reconciliation had flagged as contingent. FD-4 requires no backend change — every
callable the Dashboard would use (`createStaffInvitation`, `updateBusinessProfile`,
`updateBusinessBranchProfile`, etc.) is already lifecycle-status-independent, confirmed in the
original reconciliation and re-confirmed here. The Business Address question (§4) remains an
**existing** two-field structure — this disposition neither adds nor removes any field; any future
unification of `Business.address`/`BusinessBranch.address` would be its own, separately-authorized,
future data-model change, not decided or performed here.

## 10. Terms / `DEC-LEGAL-002` impacts

**None.** FD-5 explicitly defers the one open Terms question (future re-acceptance policy) rather
than resolving it, and explicitly preserves current server-enforced behavior
(`assertCurrentBusinessTermsAccepted`, unchanged, still enforced inside the same Firestore
transaction as the `draft → pending_verification` write). FD-4's Dashboard-availability change does
not touch the Terms gate at all — Terms remains solely a precondition of *submission*
(`submitBusinessForVerificationCommand`), which is unaffected by whether the Owner can also browse
a Dashboard while still `draft`. `DEC-LEGAL-002` remains `OPEN_LEGAL`, untouched, unbypassed.

## 11. Target journey after disposition

**A. Business Establishment** (unchanged from the original reconciliation's Phase J recommendation,
now Founder-confirmed): Business identity → Category/Type → Main Location (including its address
field, per FD-2) → Review/finish setup. Team excluded (FD-1). Terms not presented as an ordinary
establishment step (per the Founder's stated product boundary) — remains a distinct
activation/compliance gate, reachable/surfaced separately.

**B. Business Dashboard** (newly authorized destination, FD-4): reachable immediately once
establishment is complete, regardless of `draft` status. Houses Team/Staff management (FD-1). Other
management surfaces (profile/settings, location management) are only added to the later
`UI-HANDOFF-001` screen inventory where an existing product requirement already supports them (per
§10 of the original reconciliation's capability table) — no new capability is invented by this
disposition.

**C. Activation/Compliance:** Terms acceptance remains a genuine, server-enforced gate
(`assertCurrentBusinessTermsAccepted`, unchanged) — the Dashboard may surface *that* it's
outstanding, but the redesigned UX must not bypass, weaken, or duplicate the backend check itself.
Submission stays unavailable while Terms (or any other `isReadyToSubmit` condition) is unmet —
unchanged.

## 12. Preliminary UI-HANDOFF screen-family classification

Per FD-7's authorization, for `UI-HANDOFF-001`'s later, separate screen-inventory pass (not
performed here, not Stitch prompts):

- **Business establishment screens** — existing, requiring restructuring: Business identity/create
  form, Category/Type, Main Location (address field placement per §4), Review/finish setup
  (establishment-scoped, Team removed).
- **Establishment review/completion** — existing (`ReviewStep.tsx`), requiring restructuring to
  drop Team/Terms status from its summary.
- **Initial Business Dashboard** — net-new, no prior design anywhere in this repository.
- **Dashboard with outstanding activation requirements** — net-new; a state variant of the
  Dashboard (not a separate screen) surfacing that Terms remains unaccepted/submission unavailable.
- **Business profile/settings** — existing capability (`updateBusinessProfile` already implemented),
  no existing dedicated screen — net-new screen, existing backend.
- **Location management** — existing capability (`updateBusinessBranchProfile`), existing screen
  (`BranchStep.tsx`) requiring restructuring/relocation into the Dashboard context per FD-1/FD-4.
- **Team/Staff management** — existing capability and existing screen content (`TeamStep.tsx`),
  requiring relocation out of the onboarding wizard into the Dashboard (FD-1).
- **Terms/activation states** — existing screen (`TermsStepContainer.tsx`/`TermsStep.tsx`),
  requiring restructuring to present as a compliance surface reachable from the Dashboard rather
  than an ordinary wizard tab, per the Founder's product boundary; underlying `acceptBusinessTerms`
  call unchanged.
- **Empty/loading/error/blocked states** — existing patterns already present throughout
  (`BusinessResolverPage.tsx`'s pending/error states, `OnboardingWizard.tsx`'s integrity-error
  branch, `BusinessWizardPage.tsx`'s `lifecycle.notAvailable`) — the later handoff should catalogue
  these as state variants, not separate screens, consistent with the original reconciliation's §4
  observation.

This classification is preliminary and explicitly for the next task's use — it is not itself the
UI-HANDOFF-001 screen inventory, and no Stitch prompt is produced here.

## 13. Files modified

This document (new) and the accompanying `IMPLEMENTATION_CHANGES.md` entry. No other file.

## 14. Diff summary

**Zero** source diff — confirmed via `git status`/`git diff` showing no changes to `apps/`,
`functions/`, `firebase.json`, `firestore.rules`, or `storage.rules`.

## 15. Commands executed

`git fetch origin`, `git rev-parse origin/main`, `git status --short`, targeted `grep`/`cat`/`Read`
of the source files listed in §2 (`BranchStep.tsx`, `NewBusinessPage.tsx`, `ReviewStep.tsx`,
`createBusiness.ts`, `business.ts`, `businessBranch.ts`, `businessBootstrap.ts`,
`functions/src/index.ts`), and re-reads of the governing documents listed in §2. No writes beyond
this report and the change-tracking entry.

## 16. Dependencies added

None.

## 17. Config changes

None.

## 18. Risks

None introduced — documentation-only. The one residual risk worth naming: if a future capability
ever needs a genuine top-level Business address independent of any branch (e.g., a registered legal
address distinct from an operating location), the unresolved two-field question in §4 will need
explicit resolution then — recorded, not a present risk.

## 19. Rollback instructions

Delete this file and revert the `IMPLEMENTATION_CHANGES.md` entry if ever needed — no other state
exists to roll back.

## 20. Remaining Founder decisions, if any

**One narrow, non-blocking item remains open**, surfaced by this task's own reconciliation, not by
the original seven: whether `Business.address` (the unused top-level field) should eventually be
retired, populated, or reconciled with `BusinessBranch.address` — deferred as not currently
practically relevant and explicitly not blocking `UI-HANDOFF-001` (§4). All seven of the original
`ENG-P3-002-ONBOARDING-JOURNEY-RECON-001` §22 decisions are now dispositioned (FD-1 through FD-7,
§3 above).

## 21. Exact recommended next task

Begin `ENG-P3-002-UI-HANDOFF-001` under the dispositions recorded here (§3, §11-12) — still no
source change authorized by this document itself; that task's own scope (screen inventory, then,
separately, Stitch prompts) governs what comes next.

## Final gate

**ENG-P3-002 ONBOARDING JOURNEY FOUNDER DISPOSITION RECORDED — READY FOR UI-HANDOFF-001**
