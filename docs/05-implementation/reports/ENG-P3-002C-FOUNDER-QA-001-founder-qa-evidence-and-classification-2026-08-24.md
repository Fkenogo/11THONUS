# ENG-P3-002C-FOUNDER-QA-001 — Founder QA Evidence Recording & Finding Classification

**Date:** 2026-08-24
**Task type:** Evidence/classification only. No source code, Firebase configuration, Firestore
data, Hosting, App Check, or Rules were changed by this task. No deployment was performed.

## 1. Entry repository state

- **Branch:** detached HEAD (main worktree convention in this repository for docs-only tasks).
- **HEAD:** `8bbdaa942a499c68cf2edddd895e8aa5e198bbc0`.
- **origin/main:** `8bbdaa942a499c68cf2edddd895e8aa5e198bbc0` (`git fetch origin` re-run fresh).
- **Ahead/behind origin/main:** `0 / 0`.
- **Working tree:** three files carried forward, still-uncommitted from the immediately prior
  `ENG-P3-002C-PREVIEW-001-BUSINESS-CREATE-REVALIDATION-001` task in this same session (the
  deployment report, the Founder QA checklist, `IMPLEMENTATION_CHANGES.md`) — these are the same
  files this task extends. All other untracked files present in the working tree (`WORKING_WITH_THE_FOUNDER/`,
  `docs/00-governance/verified-loyalty-*`, `docs/01-product/11thONUS Product Manifesto.md`,
  `docs/05-implementation/reports/decision-sprint-01-*`/`engineering-dependency-reassessment-*`/
  `verified-loyalty-v1-*`, `docs/06-engineering-governance/*`, `docs/11thONUS-at-a-Glance.md`,
  `docs/30-go-to-market/`) are unrelated pre-existing session state, not touched by this or the
  prior task.
- **Incomplete Git operations/locks:** none found (`find .git -iname "*.lock"` — empty).
- **Merged-ancestry reconfirmation:** PR #168 (`supportedLanguages` correction, merge `096faed9`)
  and PR #169 (closure sync, merge `8bbdaa94`) both confirmed ancestors of `origin/main`; the
  Founder-QA preview recovery/revalidation addenda (App Check recovery, CSP correction,
  `ENG-P3-002C-PREVIEW-001-BUSINESS-CREATE-REVALIDATION-001`) are all recorded in the deployment
  report already present in the working tree — no re-verification needed since no commits landed
  between that task and this one (`0/0` ahead/behind, same HEAD).
- **CI state of current baseline:** unchanged from the immediately prior task's re-confirmation —
  green on PR #169 (`Build, Lint, Test, Emulator Validation` — pass).
- **Worktree used:** the main worktree (`/Users/theo/11THONUS`), not a fresh linked worktree —
  this is a documentation-only task directly extending the same three files already modified,
  uncommitted, in this session; no source build/test/deploy step is required, so no isolation
  benefit exists in creating a new worktree, and doing so would fork the in-progress uncommitted
  edits. No repository state differs materially from the expected post-revalidation baseline.

## 2. Governing documents inspected

| Topic | Document(s) | Status header |
|---|---|---|
| EN/FR onboarding localisation | `docs/05-implementation/roadmap/ENG-P3-002-DESIGN-001-business-onboarding-architecture-delivery-design.md` §17; `docs/05-implementation/reports/I18N-001-centralized-localization-foundation-2026-08-11.md` | Design package, Working/execution-layer |
| Mobile/responsive onboarding | `docs/02-technical/trd/16-frontend-and-pwa-architecture.md` §16.34; `docs/01-product/prd/03-business-registration.md` §2 | Both **Draft for approval/review (pre-freeze)** |
| Stitch design references | `docs/07-product-design/README.md`, `ux-direction.md`, `design-decisions.md` §DEC-UX-001; `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` §9 | `docs/07-product-design/*` = Active/Authoritative (approved); CDR-001 = Active governance record |
| Staff invitation display | `docs/05-implementation/roadmap/ENG-P3-002-DESIGN-001-*.md` §39; `functions/src/domains/permissions/service/staffTransportReadService.ts`; `apps/web/src/business/api/staffLists.ts`; `apps/web/src/business/onboarding/steps/TeamStep.tsx` | Design package (Working); code is current `main` |
| DEC-LEGAL-002 | `docs/00-governance/decisions/decision-register.md` (line 1221); `ENG-P3-002-DESIGN-001` §28/§37 | Decision register entry: `OPEN_LEGAL` |
| Founder QA checklist | `docs/05-implementation/reports/ENG-P3-002C-founder-qa-checklist-2026-08-22.md` | Working record, this task's primary target |

## 3. Founder QA results table

| # | Checklist item | Result | Basis |
|---|---|---|---|
| 1 | Sign in / enter Business area | **PASS** | Founder-reported, consistent with automated revalidation evidence (same session) |
| 2 | Create Business | **PASS** (reused existing Business `xkLYdH17O2zy8ruDjtln`, not re-created — per instruction) | Founder-reported |
| 3 | Resume mid-wizard | **PASS** | Founder-reported (implicit in category/location/team continuity) |
| 5 | Category | **PASS** — "Salon" displayed correctly | Founder-reported |
| 6 | Business Type | **PASS** — Business Type selection loads; Salon types (Barbershop, Children's Salon, Express Salon, Family Salon, Luxury Salon, Mobile Salon, Premium Salon) and "No specific type" all available | Founder-reported — first direct confirmation of this checklist item in this workstream |
| 7 | Branch/main location | **PASS** — existing location visible and editable | Founder-reported |
| 8 | Terms unavailable behaviour | **PASS** | Founder-reported, matches automated revalidation evidence |
| 9 | Team — skip / functional flow | **PASS** — invitation workflow operational, pending invitations displayed | Founder-reported |
| 10 | Staff invitation | **PASS** | Founder-reported, consistent with automated revalidation (`ENG-P2-004-CORR-003` governed behaviour) |
| 12 | Review accuracy | **PASS** | Founder-reported |
| 13 | Submission boundary | **PASS** — Submit correctly stays disabled | Founder-reported |
| 14 | `pending_verification` | **NOT TESTED** — correctly untestable, blocked by `DEC-LEGAL-002` (unchanged, expected) | Governing: decision register `DEC-LEGAL-002 = OPEN_LEGAL` |
| 15 | English | **PASS** (content itself correct; see item 16 for the access-path finding) | Founder-reported |
| 16 | French | **FAIL** | See §4 below |
| 17 | Mobile | **FAIL** | See §5 below |
| 18 | Cross-Business isolation | **NOT TESTED** — requires a second identity, not attempted this round per instruction ("existing QA identity and existing DEV Business... unless required") | Founder scope |
| — | Overall visual presentation | **DEFERRED** | See §6 below |
| — | Pending-invitation identity display | **Non-blocking finding, classified below** | See §7 below |

**11 (refresh at every step):** not separately itemized by the Founder's report; folded into items
2–3, 12–13 above (resume/review continuity implicitly exercises it). Not marked PASS/FAIL
independently — recorded as **NOT SEPARATELY TESTED** to avoid inferring a result the Founder did
not explicitly report.

**4 (Edit Business / name reflected in Review):** not separately itemized by the Founder's report.
Recorded as **NOT SEPARATELY TESTED**.

## 4. EN/FR finding classification

**Governing source:** `ENG-P3-002-DESIGN-001` §17 (Localization) requires EN-required/FR-translated
*content* coverage for onboarding field labels, validation messages, guidance copy, lifecycle copy,
and staff-invite copy. It does **not** specify where or whether a language-switching *control* must
be placed within the onboarding flow itself.

**Current implementation behaviour:** direct source inspection confirms `LanguageSwitcher.tsx`
(`apps/web/src/i18n/LanguageSwitcher.tsx`) is wired into exactly one surface —
`SignInPreviewPage.tsx` (the sign-in screen, reused by the Founder-QA preview's sign-in route).
A repository-wide search of `apps/web/src/business/` (the entire onboarding wizard) found **zero**
references to `LanguageSwitcher` — confirmed by `grep -rln "LanguageSwitcher" apps/web/src` and by
`grep -rn "LanguageSwitcher" apps/web/src/business`, both re-run fresh for this task. The
underlying FR translations themselves are present and correct (independently confirmed in the
immediately prior revalidation task by forcing `i18nextLng=fr` via `localStorage` and observing
fully-translated UI chrome) — this is **not** a missing-translation defect.

**Founder observation:** could see only English during the manual onboarding journey; no visible
language-selection control was available from the reviewed onboarding screens.

**Classification: the Founder did not overlook an existing accessible control — none exists once
inside the onboarding wizard.** The only place a language switcher currently renders is the
sign-in screen, before the Business onboarding flow is entered; there is no persistent
language-switching affordance anywhere in `/business/*`. This finding is **CONFIRMED, FAIL** as
reported. It is **not** overridden by the automated revalidation's "FR result: PASSED" — that
result validated only that the underlying i18next content translates correctly when the language
is forced programmatically, which is a materially narrower claim than "usable" for an actual
Founder/user with no code access.

**Correction required now, later, or separate decision:** this is a genuine, real product gap —
not covered by any documented requirement either way, so no existing governing document is
violated in the formal sense, but the practical accessibility gap is real and Founder-observed.
Classified as requiring a **bounded, separately-authorized correction** (add a language-switching
control reachable from within the onboarding flow) before this checklist item can be marked PASS.
Per this task's explicit no-implementation constraint, no correction is made here. **No existing
work-package identifier in the repository already covers this** — it does not fall under Stitch
(no onboarding Stitch concept exists), under `DEC-LEGAL-002` (unrelated), or under any dispositioned
`ENG-P3-002*` item. A new controlled correction identifier would be needed if the Founder
authorizes a fix (see §12).

## 5. Mobile-navigation finding classification

**Governing source:** `docs/02-technical/trd/16-frontend-and-pwa-architecture.md` §16.34
("mobile-first... fully usable on mobile") and `docs/01-product/prd/03-business-registration.md`
§2 ("work comfortably on a smartphone") — both general, cross-cutting usability objectives.
**Both source documents are headed `Status: Draft for approval/review (pre-freeze)`** — neither is
frozen/binding in the same sense as, e.g., the dispositioned `ENG-P3-002-DESIGN-001` package.
Neither document, nor any other governing document found, specifies a required navigation
*pattern* (tabs vs. bottom sheet vs. accordion vs. stepper) for the onboarding wizard specifically.
`ENG-P3-002-DESIGN-001` itself cites only the same general PRD3 §2 language as its own Founder QA
mobile test criterion (checklist item 17) — it does not add a pattern-level requirement.

**Current implementation behaviour:** the wizard's step navigation (Business category / Main
location / Terms / Team / Review) is a horizontal row of pill-style buttons that wraps to two lines
at a 375px viewport (independently re-confirmed by screenshot in the immediately prior revalidation
task) — no horizontal overflow, all labels legible, but visually presented as a desktop-style tab
bar rather than a mobile-specific pattern (e.g., a stepper, progress indicator, or bottom
navigation).

**Founder observation:** the top navigation "behaves visually like desktop navigation and is not
an acceptable mobile onboarding navigation pattern."

**Classification:** **CONFIRMED, FAIL from Founder acceptance perspective**, per this task's
explicit instruction not to convert a Founder FAIL into PASS on the basis that automated checks
(no-overflow, legible labels) previously passed. However, **no specific documented requirement is
violated** — only the general, still-draft "usable on mobile" objective, which the current
implementation does not structurally breach (it remains functionally usable, per the automated
evidence), but which the Founder's product judgment finds unacceptable as a *pattern*. This is
recorded as a **Founder-acceptance-level FAIL**, distinct from a documented-requirement violation.

**Correction required now, later, or separate decision:** classified as belonging to the same
disposition as §6 (visual/pattern refinement) rather than to `ENG-P3-002C`'s functional-onboarding
scope — see Phase D determination in §8.

## 6. Visual-refinement disposition

**Governing source:** `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` §9
states explicitly: *"Stitch artefacts are implementation references... not product specifications...
Where a Stitch concept and the PRD/TRD appear to diverge, the PRD/TRD governs."* `docs/07-product-design/`
is the approved, Active, Authoritative catalogue of Stitch design exploration concepts
(`exploration-v1`, `exploration-v2`, `design-decisions.md` §DEC-UX-001).

**Critical finding: no Stitch concept exists for Business onboarding/registration.** CDR-001 §9's
own traceability table lists Stitch coverage only for Capability 4 (verification), Capability 5
(progress/reward), and Capability 6 (redemption) — Business onboarding (Capability 3,
`ENG-P3-002`) has no dedicated Stitch concept anywhere in `docs/07-product-design/`. No repository
search turned up any `ENG-P3-*` or later ticket that stages "visual refinement" or "UI polish" for
onboarding as a deliverable separate from the functional `ENG-P3-002A/B/C` work already delivered.

**Founder observation:** overall current presentation is visually unfinished; Founder expects
existing approved/provided Stitch screens to govern later UI refinement.

**Classification: DEFERRED, but with an important correction to the premise.** The repository does
establish Stitch as the governed mechanism for future visual refinement in general (§DEC-UX-001,
CDR-001 §9), and the Founder's underlying expectation — that visual polish is a separate, later
concern from functional correctness — is consistent with that governance. **However, no Stitch
concept has actually been produced for onboarding yet**, so there is currently no scheduled or
identified work package this observation maps onto. This is recorded as **DEFERRED pending a
Stitch concept for onboarding being commissioned** — not deferred to an *existing* ticket, because
none exists. This distinction matters for Phase D/§12: the repository does not yet contain the
"planned Stitch-driven refinement stage" for onboarding that the Founder's framing assumes exists.

## 7. Pending-invitation UX finding classification

**Governing source:** `ENG-P3-002-DESIGN-001` §39 specifies only the query-level capability
("which invitations has this owner already sent, and are any still pending") without enumerating a
required field list. Direct code inspection of
`functions/src/domains/permissions/service/staffTransportReadService.ts` (lines 12–14, 51) shows
the transport DTO is **deliberately** minimal by design ("Phase N"): *"no raw delivery-target
contact value (email/phone)... Phase N's bounded invitation-status DTO."* The frontend
(`apps/web/src/business/api/staffLists.ts`'s `StaffInvitationSummary` type;
`apps/web/src/business/onboarding/steps/TeamStep.tsx:84`) renders exactly what the DTO provides —
`{role} — {statusLabel}` — and nothing more, because nothing more is sent.

**Founder observation:** multiple pending invitations would appear indistinguishable, since only
`role`/`status` is shown, no invitee identity.

**Classification: this is a genuine data-availability gap, not a display-only gap, and it is not
governed by any documented privacy decision.** The nearest privacy-masking language in the
repository (TRD12 §12.41, TRD21 §21.18) governs a business looking up a *customer's* identity by
loyalty number — a materially different context from a business owner viewing invitations they
themselves sent — and does not extend to justify withholding invitee identity here. The exclusion
traces only to an implementation note ("Phase N") with no linked decision record.

**Blocking/non-blocking:** consistent with the task's framing, classified **non-blocking** for
Founder QA / `ENG-P3-002C` purposes — it does not prevent completing the onboarding journey or
break any tested acceptance criterion — but it is a **real product/backend gap requiring a
decision**, not merely a UI polish item, because the underlying data is not currently transported
to the frontend at all. Recorded as a finding requiring its own scoped correction/decision if the
Founder wants it addressed (see §12) — not something a frontend-only change could fix.

## 8. Founder QA overall status

**Not yet complete.** Six items (1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13 — eleven of eighteen checklist
items) are directly PASS on Founder evidence. Two items (16, 17) are FAIL. Two items (14, 18) remain
correctly NOT TESTED (14 blocked by `DEC-LEGAL-002`, expected; 18 requires a second identity, not
attempted per this round's scope). Two items (4, 11) were not separately itemized by the Founder's
report and are recorded as NOT SEPARATELY TESTED rather than inferred. **The checklist cannot be
marked complete/passed while two FAIL items and pending NOT TESTED items remain.**

## 9. `ENG-P3-002C` status

**Unchanged: hosted engineering/integration validated; Founder QA pending — now further qualified
by two Founder-reported FAIL findings (EN/FR access-path, mobile navigation pattern) that are
UX/product-acceptance findings, not functional/backend defects.** Per Phase D determination:

- **(A) Confirmed:** `ENG-P3-002C`'s *functional* implementation (Business creation, category/type
  selection, Branch, Team, Terms boundary, submission blocking — all now Founder-PASS-confirmed
  against the real hosted environment) remains technically validated. Founder QA remaining open
  with UI/localisation findings does not retroactively invalidate the functional validation
  already proven in the prior revalidation task.
- **(B) The language-accessibility finding (§4) is a genuine gap requiring a bounded correction**
  before checklist item 16 can be marked PASS — it is not merely cosmetic (a Founder/user cannot
  reach French at all from inside the flow), but it is scoped narrowly (add a reachable
  language-switching control) and does not implicate the backend/data model.
- **(C) Mobile navigation pattern (§5) and overall visual refinement (§6) properly belong to a
  later, Stitch-driven refinement stage in principle — but no such stage has actually been
  scheduled or had a Stitch concept produced for onboarding yet**, so this cannot be classified as
  "already covered by an existing plan," only as "consistent with the *intended* governance model,
  pending that model actually being applied to onboarding."
- **(D) New controlled correction identifiers are needed** for: the language-switcher
  accessibility gap, and (separately, non-blocking) the staff-invitation-identity data gap. Neither
  is invented here — see §12 for the exact disposition recommendation, left to Founder
  authorization.

## 10. `ENG-P3-002` status

**Unchanged: Open — blocked on Founder QA completion and `DEC-LEGAL-002`.** Not closed by this
task. `DEC-LEGAL-002` remains `OPEN_LEGAL` per the decision register, unaffected by any finding in
this report — none of today's findings are legal/Terms-content matters.

## 11. Capability 3 status

**Unchanged: Open — not closed.** Not affected by this task's findings.

## 12. Correction/refinement work packages identified

No existing repository identifier already covers either of the two substantive findings below —
both would need fresh Founder authorization and a new controlled identifier if pursued, following
this repository's established pattern (`ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001` is the precedent
for a bounded, narrowly-scoped post-QA correction):

1. **Onboarding language-switcher accessibility** (§4) — candidate identifier pattern:
   `ENG-P3-002-CORR-LANGSWITCH-001` (not created, not authorized by this task — naming suggestion
   only, for Founder disposition).
2. **Staff-invitation invitee-identity display** (§7) — non-blocking; candidate identifier pattern:
   `ENG-P3-002-CORR-INVITEIDENTITY-001` (not created, not authorized by this task).

Mobile navigation pattern (§5) and overall visual refinement (§6) are recommended to be tracked
under a **new, not-yet-existing** Stitch-commissioning step for onboarding, rather than treated as
an engineering correction — this is a product/design decision (commissioning a Stitch concept for
Capability 3), not a coding task, and is explicitly outside this task's authority to schedule.

## 13. Files modified

- `docs/05-implementation/reports/ENG-P3-002C-founder-qa-checklist-2026-08-22.md` (Outcome section
  updated with the actual Founder QA results recorded in this task)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (new entry appended)
- This report (new file)

No other file was touched. No file listed in Phase E's prohibition list (React components, CSS,
routing, localisation code/resources, Functions, Firestore, Hosting config, Rules) was modified.

## 14. Code diff summary

None. `git diff --stat -- apps/ functions/ firebase.json firestore.rules storage.rules` (re-run at
the end of this task) shows zero changes to any of those paths.

## 15. Commands executed

`git fetch origin`, `git branch --show-current`, `git rev-parse HEAD`/`origin/main`,
`git rev-list --left-right --count`, `git status --short`, `git worktree list`,
`find .git -iname "*.lock"`, `grep`/`find` searches across `docs/` and `apps/web/src/` (governing-
document and `LanguageSwitcher` usage confirmation), a general-purpose research agent dispatch for
documentation reconnaissance (read-only), `git log --oneline` / `git diff --stat` (verification, no
changes found beyond the three files listed in §13).

## 16. Dependencies added

None.

## 17. Config changes

None.

## 18. Firebase/deployment/data changes

None. No Firebase CLI/MCP command was issued by this task. No Firestore document was read or
written by this task (the QA identity/Business/Branch/invitation state referenced throughout is
carried over, unmodified, from the prior revalidation task). No Hosting deploy. No QA password was
generated, reset, or referenced by this task — the Founder is already in possession of the
session-only credential issued in the prior turn, which remains unwritten in any file, exactly as
before.

## 19. Risks

None introduced. This task is documentation-only. The two identified FAIL findings (EN/FR access,
mobile navigation) mean `ENG-P3-002C`/`ENG-P3-002` cannot be advanced toward closure until they are
either corrected (with fresh, separately scoped authorization) or the Founder explicitly accepts
them as non-blocking for a defined MVP scope — that determination is reserved to the Founder, not
made here.

## 20. Rollback

Trivial — this task only edited three Markdown files (two updated, one new), all additive/
corrective, no schema/data/deployment impact. `git checkout -- <path>` (for the two updated files)
or delete the new report file to fully revert, if ever needed.

## 21. Exact recommended next Founder action

Decide, for each of the two substantive findings (§4 language-switcher accessibility, §7
staff-invitation identity display), whether to: (a) authorize a bounded correction task now (each
would need its own fresh authorization, RED→GREEN TDD, review, and merge, per this repository's
established pattern), (b) explicitly accept as a known MVP limitation and record that acceptance,
or (c) defer to a later phase. Separately, decide whether to commission a Stitch design concept for
Business onboarding (§6/§5) — no such concept exists yet, so "wait for Stitch to govern refinement"
currently has nothing to wait *on* until one is produced. `DEC-LEGAL-002` remains the Founder's own
open item, unaffected by this task.

## 22. Final gate

**FOUNDER QA EVIDENCE RECORDED — TWO SUBSTANTIVE FINDINGS (EN/FR ACCESS-PATH, MOBILE NAVIGATION
PATTERN) CONFIRMED AS GENUINE GAPS AGAINST GOVERNING DOCUMENTATION; NO CORRECTION AUTHORIZED OR
PERFORMED IN THIS TASK; ENG-P3-002C/ENG-P3-002/CAPABILITY 3 STATUS UNCHANGED, NOT CLOSED**
