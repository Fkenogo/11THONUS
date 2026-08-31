# DEC-LEGAL-002-BT-PART-V-READINESS-001 — Core Business Terms Part V (§18 Subscription and Fees) Drafting-Readiness Assessment, with Part VI (§19 Liability, §20 Indemnity) Advance-Readiness Analysis

> **Status: ASSESSMENT ONLY — NO CLAUSE TEXT DRAFTED.** This report is an authority/architecture review, per the governing task scope. It does not draft §18 (Part V), §19, or §20 (Part VI), does not begin Part VI drafting, does not change any `DEC-SUB-*` status, and does not resolve CI-01 or CI-05.
>
> **Controlled Part architecture (verified directly against the instrument, `DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` v4.1, lines 80–85):** **Part V — Commercial Terms** contains **§18 Subscription and Fees only**. **Part VI — Risk Allocation** contains **§19 Liability** and **§20 Indemnity**. §§19–20 are **not** Part V content. This report assesses both Parts because the originating task bundled them under one instruction, but its readiness conclusions are kept separate and its recommendations do not authorize drafting Part VI under a "Part V" label.

**Task:** `DEC-LEGAL-002-BT-PART-V-READINESS-001`
**Date:** 2026-08-31
**Author task type:** docs-only governance assessment
**Founder disposition:** ACCEPTED (`DEC-LEGAL-002-BT-PART-V-READINESS-001-RECORD-001`, 2026-08-31) — recorded as PR #207.
**Correction pass:** `DEC-LEGAL-002-BT-PART-V-READINESS-001-CORR-001` (2026-08-31) — automated review (Codex) on PR #207 and independent Founder review identified two reconciliation issues, both corrected in this pass: (1) the report had collapsed Part V (§18) and Part VI (§§19–20) into a single "Part V" drafting-readiness conclusion, risking a future drafting task treating a Part V authorization as covering Part VI; corrected throughout so Part V and Part VI carry separate, correctly-labeled conclusions. (2) The report had proposed extending FD-5/LEG-FD-05's Reward-Program-change reasonable-notice standard to commercial/subscription changes "by analogy," flagging this as a judgment extension rather than governed authority; on re-inspection, no independent governed authority (FD-7, LEG-FD-05/06, TRD17, any CONFIRMED `DEC-SUB-*` item) extends that standard to commercial/subscription/pricing changes — LEG-FD-05 is titled "Programme-Change Notice" and is scoped to Reward Program changes only, and LEG-FD-06 expressly carves commercial/subscription suspension out to "separately governed commercial/subscription processes (`DEC-SUB-*`, not resolved here)." Corrected so the analogy is withdrawn and the commercial-notice standard is treated as genuinely unresolved. A third finding (Codex) — that three Category C gaps (refunds, auto-renewal default, commercial/pricing-change notice) are not actually mapped to any tracked `DEC-SUB-*` decision, contrary to §23's original blanket claim — is also corrected. **No `DEC-SUB-*`/CI-01/CI-05 status changed by any of these corrections; no clause text drafted; no Terms instrument change.** Earlier pre-recording corrections to §§8, 9, and 13 (universal-fee/subscription phrasing) from the prior pass remain in place and are unaffected by this pass.

---

## 1. Entry Repository State

- Working directory: `/Volumes/PRODUCTION/Projects/11THONUS`
- Locally checked-out branch at task start: `docs/dec-legal-002-bt-draft-003` (HEAD `d6de663`) — **stale**, predates the PR #205 and PR #206 merges. This branch was **not used** as the assessment source and was **not modified**.
- All inspection in this task was performed read-only against `origin/main` via `git show`/`git ls-tree`/`git grep` (no checkout, no branch creation, no working-tree mutation).
- Pre-existing untracked files in the working tree (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`, `docs/01-product`, `docs/05-implementation/reports`, `docs/06-engineering-governance`, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, `docs/30-go-to-market/`) were present at task start and are **unrelated to this task** — left untouched.

## 2. Base SHA

`origin/main` HEAD at assessment time: **`055c2894b1ee7689619865c3eca83fa05373744a`**

## 3. PR #206 Merge Verification

Confirmed via `git log origin/main`:

```
055c289 Merge pull request #206 from Fkenogo/docs/dec-legal-002-bt-draft-004
3445c45 docs(DEC-LEGAL-002-BT-DRAFT-004-CORR-001): correct §16.2 termination process and §16.4 required run-off
46f061c docs(DEC-LEGAL-002-BT-DRAFT-004): draft Core Business Terms Part IV (Platform Action, Business Exit and Complaints)
b2f798d Merge pull request #205 from Fkenogo/docs/dec-legal-002-bt-draft-003
```

`055c2894b1ee7689619865c3eca83fa05373744a` **is** the current tip of `origin/main` and **is** the PR #206 merge commit. Confirmed merged.

## 4. Current Terms Drafting State

- Core Business Terms draft instrument: `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`, currently **v4.1** (last updated 2026-08-31 by `DEC-LEGAL-002-BT-DRAFT-004-CORR-001`).
- **Parts I–IV (§§1–17) are drafted and Founder-approved as controlled drafting baselines** (Part I §§1–7; Part II §§8–10; Part III §§11–14; Part IV §§15–17).
- **Parts V–VIII (§§18–27) remain headings/placeholders only** — confirmed verbatim in the draft: *"Parts V through VIII above (§§18–27) remain headings and placeholders only, per the governing task scope. No clause text for those Parts has been drafted, and none should be inferred from Part I, Part II, Part III, or Part IV's treatment of adjacent topics."*
- `DEC-LEGAL-002` register status: **`OPEN_LEGAL`** (unchanged — readiness to draft is not itself a closure criterion).
- Terms configuration status: **`NOT CONFIGURED`**.
- Controlled Inputs: **CI-01** (Preamble — operator legal entity name/registration/address) and **CI-05** (§7.4-adjacent — reacceptance-on-Terms-change engineering mechanism) remain the only two open items. Neither concerns §18/§19 subject matter.

## 5. Authorities Inspected

- Decision Register (`docs/00-governance/decisions/decision-register.md`) — all `DEC-SUB-*` entries, `DEC-ID-005`, `DEC-LOY-*` cross-references.
- `DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md` — **FD-7** disposition (Phase F, Subscription-Terms Reconciliation).
- `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` — **LEG-FD-14** (B2B disputes) and **LEG-FD-15** (Liability Architecture).
- `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md` — counsel's original §9 (Platform Liability Limits) and §10 (Business Liability & Indemnity) recommendations.
- `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md` — rows 9, 10, 11, 20 (liability, indemnity, mandatory-law exclusions, subscription framework).
- `DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md` — Terms Content Architecture (Fees/commercial and Liability bullets).
- `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md` — Terms Drafting Readiness Note (§3 readiness table, §4 subscription boundary).
- `docs/02-technical/trd/17-subscription-and-billing.md` (**TRD17** — Subscription, Billing and Plan Enforcement Architecture), §§17.3, 17.4, 17.7, 17.16, 17.19, 17.20, 17.30, 17.31, 17.37, 17.50, 17.51.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v4.1) — Part V/VI heading placeholders, §0.1/§0.2 readiness mapping, §9.6/§17 cross-references to undrafted §19.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v4.1) — CI-01, CI-05.
- `functions/src/domains/business/models/businessStatus.ts` — governed Business lifecycle/status state machine (factual architecture, not contractual authority).
- `docs/01-product/prd/03-business-registration.md` §§8, 11 — Subscription Philosophy / Trial Period (illustrative only, marked unapproved).
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-004-drafting-report-2026-08-31.md` and `-CORR-001-correction-report-2026-08-31.md` — Part IV forward-references to Part V and `DEC-ID-005`.
- Repo-wide `git grep` for subscription/billing implementation code (`functions/src`, `apps/`) — **zero application code found**; no Subscription Domain implemented.

## 6. FD-7 Interpretation

**FD-7** (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`) is a **sequencing disposition**, not a content decision:

> *"`DEC-LEGAL-002` may establish the general contractual framework governing applicable subscriptions, fees, billing, cancellation and changes where relevant to participating Businesses. It must not invent or prematurely settle: plan names; prices; billing intervals; staff limits; trial structure; complimentary/pilot plans; proration; grace periods; billing ownership; tiering; or other commercial values governed by open `DEC-SUB-*` decisions. Specific commercial terms become binding only when separately governed and applicable to the Business."*
>
> *"This disposition does not authorize: Subscription Plan UI; billing implementation; pricing implementation; resolution of any open `DEC-SUB-*` decision."*

**Interpretation for this task:** FD-7 authorizes drafting §18 **now**, but only as a structural framework (parties, the fact that fees may apply, billing-cycle mechanics in the abstract, cancellation rights, change-to-terms mechanics). It is an explicit prohibition against populating §18 with any *currently-unresolved* `DEC-SUB-*` value. **Corrected this pass — this is not a permanent, durable ban that survives resolution.** FD-7's own text is explicit that "specific commercial terms become binding only when separately governed and applicable to the Business" — i.e., once a given `DEC-SUB-*` item is actually resolved (CONFIRMED), that value becomes available to reflect in §18 (or a later revision of it); the prohibition tracks each item's *current* `OPEN_FOUNDER` status, not the section itself in perpetuity. This distinction matters for a future §18 revision task: it should re-check each item's live status rather than treating this report's "not drafting-ready" list as fixed for all time.

## 7. Full `DEC-SUB-*` Inventory and Status (unchanged by this task)

| ID | Subject | Status |
|---|---|---|
| DEC-SUB-001 | Final plan names (Starter/Growth/Professional working labels) | **OPEN_FOUNDER** |
| DEC-SUB-002 | Staff limits per plan | **OPEN_FOUNDER** |
| DEC-SUB-003 | Trial structure (time/volume/whichever-first) | **OPEN_FOUNDER** |
| DEC-SUB-004 | Plan capacity counted in active Reward Programs | **CONFIRMED** |
| DEC-SUB-005 | Single branch at MVP; branch-ready architecture | **CONFIRMED** |
| DEC-SUB-006 | Upgrade immediate; downgrade requires within-limits | **CONFIRMED** |
| DEC-SUB-007 | Essential trust controls never paywalled | **CONFIRMED** |
| DEC-SUB-008 | Plan catalogue: BIF prices, billing intervals, grace values, proration | **OPEN_FOUNDER** (also depends on `EXT-LEG-003`, OPEN_LEGAL) |
| DEC-SUB-009 | Multi-business subscription model (per-business vs. owner-level) | **OPEN_FOUNDER** |
| DEC-SUB-010 | MVP export formats | **OPEN_FOUNDER** |
| DEC-SUB-011 | Bronze/Silver/Gold naming (historical) | **SUPERSEDED** by DEC-SUB-001 |
| DEC-SUB-012 | Plan capacity by product count (historical) | **SUPERSEDED** by DEC-SUB-004 |
| DEC-SUB-013 | Complimentary/free plans policy | **OPEN_FOUNDER** |

No `DEC-SUB-*` status has changed across any Part I–IV drafting/correction task, and none changes in this task. Four are CONFIRMED — **corrected this pass:** DEC-SUB-004 through DEC-SUB-007 specifically (capacity counted by active Reward Programs; single-branch/branch-ready architecture; upgrade/downgrade mechanics; essential controls never paywalled) — the original sentence here substituted the separate `DEC-PROD-004` "paid plans exist" fact for `DEC-SUB-005`'s actual confirmed content, which is corrected. Seven remain OPEN_FOUNDER (all numeric/named commercial values). Two are superseded/historical only.

Adjacent but distinct: **`DEC-ID-005`** (owner-initiated business self-suspension) remains **OPEN_FOUNDER** — not a `DEC-SUB-*` item, but relevant if §18 needs to describe suspension mechanics, since Part IV §15/§16 already carve this boundary out explicitly and §18 must do the same rather than assume it.

## 8. §18 Subject-Matter Classification Matrix

**Corrected this pass — critical caveat on every row citing "External Legal Opinion §20 table / Reconciliation Matrix row 20":** the Terms Drafting Readiness Note §4 is explicit that *"every example the Legal Opinion proposes for these matters (§20, tables B–E) is a non-binding drafting illustration, not an adopted decision"* — and separately lists **"payment periods"** by name among the items it does **not** resolve. Reconciliation Matrix row 20's own "Class A" tag confirms only that FD-7's *general framework* determination is correct (the framework may be drafted structurally now) — it does **not** independently adopt each individual table B–E line item (fee obligation, billing cycle, payment terms, payment methods, late payment, taxes, plan/price-change notice, etc.) as governed content. **Every row below marked "(corrected this pass)" or "(added this pass)" citing this source is therefore reclassified from "governed/Class A" to "permitted non-binding drafting illustration" — available as optional drafting input a future §18 task *may* choose to use (since using it doesn't invent anything the Legal Opinion didn't already suggest, and FD-7 doesn't prohibit consulting non-binding illustrations), but not independently governed, required, or "drafting-ready" in the same sense as this report's true Category A content (§9) or the DEC-LOY-011/TRD17-sourced redemption-during-suspension rule.** This does not change any Category C/D item's status — only the label attached to certain Category B rows.

| Subject matter | Classification | Governing authority |
|---|---|---|
| Existence of paid Business participation | **A** | DEC-PROD-004 (CONFIRMED — businesses pay, customers don't); TRD17 §17.3 |
| Existence of free/complimentary/pilot participation *(that such a category may exist, structurally)* | **B** | DEC-SUB-013 (OPEN, but TRD17 §17.50/17.51 confirm the entitlement mechanism exists) — may be acknowledged structurally, no policy/eligibility stated |
| Payer identity (where fees apply to a Business's participation, they are borne by the Business, never the customer — not a claim that every Business necessarily has an active fee obligation, or that a subscription is universally mandatory) | **A** | FD-7; DEC-PROD-004 |
| Plan names | **C** | DEC-SUB-001 (OPEN_FOUNDER) |
| Pricing / price points | **C** | DEC-SUB-008 (OPEN_FOUNDER); EXT-LEG-003 (OPEN_LEGAL) |
| Currency | **C** | DEC-SUB-008 (OPEN_FOUNDER) |
| Billing interval | **C** | DEC-SUB-008 (OPEN_FOUNDER) |
| Payment method (mechanism-agnostic structural reference, e.g. "as specified on the platform") | **B** — illustrative, optional (corrected from D, then re-corrected re: authority weight) | External Legal Opinion §20 table ("Payment methods — As specified on platform") is a **non-binding drafting illustration** (Terms Drafting Readiness Note §4), not an adopted decision; permitted as optional drafting input, not independently governed |
| Payment method (specific method/provider/rail named or integrated) | **D** | Not a Core Terms matter — operational/payment-provider configuration (DEC-PROV-001-adjacent); excluded by FD-7's "does not authorize... billing implementation" |
| Billing provider | **D** | Operational/vendor selection, not contractual |
| Invoice mechanics (existence of invoices/receipts as a concept) | **B** | TRD17 §17.37 confirms the subscription/billing-period/payment-attempt/invoice/receipt distinction structurally; no format/timing value governed |
| Payment terms — that a payment deadline exists (structural, no day count) | **B** — illustrative, optional | External Legal Opinion §20 table ("Payment terms — Payment due within [X] days of invoice") is a **non-binding drafting illustration** (Terms Drafting Readiness Note §4 lists "payment periods" by name among items it does not resolve); the "[X]" value is Category C regardless |
| Payment terms — the specific day count | **C** | Not covered by any `DEC-SUB-*` item (not listed under DEC-SUB-008's grace/billing values) and explicitly named "payment periods" in the Readiness Note §4 as unresolved; genuinely untracked, not merely unresolved |
| Late payment — that reasonable late-payment charges/interest may apply (structural, no rate) | **B** — illustrative, optional | External Legal Opinion §20 table ("Late payment — Interest/reasonable charges for late payment") is a **non-binding drafting illustration** (Terms Drafting Readiness Note §4); the rate/amount is Category C regardless |
| Late payment — the specific rate/charge mechanic | **C** | Not covered by any `DEC-SUB-*` item; genuinely untracked |
| Tax treatment | **B** — illustrative, optional | External Legal Opinion §20 table ("Taxes — Fees exclusive of taxes; Business responsible") is a **non-binding drafting illustration** (Terms Drafting Readiness Note §4), not an adopted decision; permitted as optional drafting input, not independently governed; no rate/jurisdiction mechanic governed regardless |
| Renewal | **B** | TRD17 confirms subscriptions renew structurally; no term-length value governed |
| Auto-renewal | **C** | No governed default; not addressed by FD-7, TRD17, or any DEC-SUB item as a default rule |
| Cancellation | **B** | TRD17 §17.30 confirms a cancellation right and "clear information about final access date/data retention/reward obligations/possible reactivation" exists structurally; timing preference ("end-of-period where practical") is TRD-level guidance, not a Founder/legal value fit for the contract |
| Upgrades/downgrades | **B** | DEC-SUB-006 (CONFIRMED): upgrade immediate, downgrade requires within-limits — statable without values |
| Plan limits (that they exist, differ by capacity) | **B** | DEC-SUB-007 (CONFIRMED, essential controls never paywalled); DEC-SUB-004 (CONFIRMED, capacity = active Reward Programs) — statable structurally, no numeric limit |
| Trial (that a trial exists in MVP) | **B** | TRD17 §17.16/§17.11 confirm a trial state exists structurally; DEC-SUB-003 (OPEN) governs its structure/length — must not be stated |
| Pilot/complimentary participation | **C** | DEC-SUB-013 (OPEN_FOUNDER) |
| Proration | **C** | DEC-SUB-008 (OPEN_FOUNDER) |
| Refunds | **C** | Not governed by any FD/LEG-FD/DEC-SUB item found; TRD17 does not state a refund policy |
| Failed payments | **B** | TRD17 §17.16 confirms a "Past Due" status exists structurally; no cure-period/consequence value governed |
| Grace periods | **C** | DEC-SUB-008 (OPEN_FOUNDER, grace values explicitly listed) |
| Commercial suspension | **B** | TRD17 §17.19 + Part IV §15 already state suspension exists and is governed by §15's non-exhaustive grounds/process architecture (FD-4/LEG-FD-06); §18 may cross-reference §15 rather than restate it |
| Reactivation | **B** | TRD17 §17.31 confirms reactivation exists structurally (plan selection, payment resolution, confirmed payment status, business-status checks); no mechanic value governed beyond that |
| Price/plan changes — that notice must be given, and the Business may terminate if a change is not accepted (structural existence, no period/standard) | **B** — illustrative, optional | External Legal Opinion §20 table §C ("Plan changes — 11thONUS may change plans with notice; Business may terminate"; "Price changes — Notice required; Business may terminate if not accepted") is a **non-binding drafting illustration** (Terms Drafting Readiness Note §4), not an adopted decision — but this is still *independent* of, and does not rely on, the separately-rejected FD-5/LEG-FD-05 analogy; permitted as optional drafting input |
| Price/plan changes — the specific notice period or standard | **C** | No governed value or notice standard specific to price/plan changes found. `FD-5`/`LEG-FD-05` are expressly scoped to Reward Program changes only (LEG-FD-05 is titled "Programme-Change Notice"; its text refers throughout to "Reward Program changes," never commercial/subscription/pricing terms) — extending that standard by analogy to price changes is **not supported by independent governed authority** and must not be drafted as if it were |
| Notice of commercial changes (generally) — the specific standard/period | **C** | No independent governed authority establishes a reasonable-notice (or any other) *standard* for commercial/subscription/pricing changes. FD-5/LEG-FD-05 govern Reward Program changes only; LEG-FD-06 expressly reserves commercial/subscription matters to "separately governed commercial/subscription processes (`DEC-SUB-*`, not resolved here)" rather than importing the Reward-Program standard. §18 may draft around this gap structurally (e.g., stating that applicable law and separately governed commercial terms govern notice where applicable) without inventing a period or standard, and without borrowing FD-5/LEG-FD-05 by analogy. (The *existence* of a notice requirement is separately Category B — see the price/plan-changes row above, sourced independently from the accepted Legal Opinion §20 table, not from FD-5/LEG-FD-05.) |
| Relationship between commercial suspension and valid earned rewards | **A** | **Fully governed** — TRD17 §17.20 + `DEC-LOY-011` (CONFIRMED) + Part III §13 (already drafted, cross-referenceable): commercial/subscription-status suspension alone does not, by itself, block redemption of otherwise-valid earned rewards; governed exceptions (fraud/security/integrity/legal-regulatory/disputed-validity) apply |

### 9. Governed §18 Content (Category A — drafting-ready as-is)

- Where fees apply to a Business's participation, they are borne by that Business, never the customer (DEC-PROD-004, CONFIRMED) — customers do not pay for basic participation. **This is narrower than a claim that every Business necessarily has an active fee obligation or that maintaining a paid subscription is a universal precondition of participation** (corrected this pass — a separate, unqualified "Businesses are paying subscribers" bullet previously stood alongside this one and has been removed as redundant and capable of reintroducing the universal-fee issue) — whether a $0/complimentary/pilot arrangement exists for some Businesses is a distinct, still-open question (`DEC-SUB-013`, OPEN_FOUNDER), and TRD17 §17.50–17.51 already contemplate such access being modeled through the same entitlement architecture rather than treated as an exception to it. §18 must reflect fees/subscription conditionally ("where/to the extent applicable"), not as a universal Business obligation.
- Commercial/subscription-status suspension, by itself, does not extinguish or block redemption of valid earned rewards (TRD17 §17.20; `DEC-LOY-011`; Part III §13) — this is the single most load-bearing governed fact for §18, and it is fully drafting-ready today by direct cross-reference to §13/§15, exactly as Part IV did for exit.
- Essential trust/security controls are never paywalled (DEC-SUB-007, CONFIRMED) — differentiation between plans is capacity/enhanced-capability only.
- Upgrade is immediate; downgrade requires the Business's configuration to already fit the lower plan (DEC-SUB-006, CONFIRMED).
- Plan capacity, where it exists, is measured by active Reward Programs, not a different unit (DEC-SUB-004, CONFIRMED).

### 10. Non-Numeric §18 Content (Category B — draftable in durable structural language, no invented value)

**Note (corrected this pass):** bullets below citing "External Legal Opinion §20 table / Reconciliation Matrix row 20" are **optional, non-binding drafting illustrations** (Terms Drafting Readiness Note §4), not independently governed/mandated content — see the corrected §8 caveat for the full explanation. They remain permissible Category B content (available, not prohibited), but a future §18 task is free to omit them; they are not on the same governed footing as the DEC-LOY-011/TRD17-sourced items or the confirmed `DEC-SUB-*` facts.

- That applicable fees, where they exist for a Business, are set out in a separately governed/communicated commercial arrangement (plan/pricing document), not enumerated in the Core Terms themselves.
- That a trial, cancellation right, renewal mechanism, and payment-status states (e.g., past-due, grace) exist as structural concepts, without stating their length, trigger detail, or numeric threshold.
- That notice must be given of plan or price changes, and that the Business may terminate if a change is not accepted — the *existence* of a notice-and-termination-right structure only, without asserting a specific notice period or standard (corrected this pass; sourced independently from the accepted External Legal Opinion §20 table/Reconciliation row 20, **not** from FD-5/LEG-FD-05's Reward-Program-change standard, which remains scoped to Reward Programs and is not independently governed for commercial/subscription/pricing changes — see §11 below for the still-open specific standard).
- That commercial suspension is a species of suspension already governed by §15, and reactivation follows the structural pattern TRD17 §17.31 describes (plan selection, resolving payment, confirmed status, restoring access) without inventing new lifecycle states beyond `businessStatus.ts`'s eight governed states.
- That fees are quoted exclusive of taxes and the Business is responsible for applicable taxes, where tax legally applies — a value-independent allocation (corrected this pass from a bare "taxes apply" statement; External Legal Opinion §20's own accepted structural table, Reconciliation Matrix row 20), without asserting a rate, jurisdiction, or collection mechanism.
- That invoices/receipts exist as a structural billing concept (TRD17 §17.37), without format/timing detail.
- That accepted payment methods are as specified by 11thONUS on the platform from time to time — a mechanism-agnostic forward-reference, not naming any specific method/provider/rail (corrected this pass from Category D; External Legal Opinion §20's own accepted structural table, Reconciliation Matrix row 20).
- That fees are due by a payment deadline, and that reasonable charges or interest may apply for late payment — both as structural concepts only, without a specific day count or rate (added this pass; External Legal Opinion §20's own accepted structural table, Reconciliation Matrix row 20; the specific values are Category C — see §11).

### 11. Open §18 Content (Category C — not drafting-ready; would require inventing a value or resolving an open decision)

Plan names; prices; currency; billing intervals; staff limits; trial structure/length; complimentary/pilot plan eligibility and terms; proration; grace-period length; per-business vs. owner-level billing model; export formats; auto-renewal default; refund policy; the notice standard for commercial/subscription/pricing changes; the specific payment-deadline day count; the specific late-payment charge/interest mechanic (the last two added this pass — see §8 above). Most of these map to a specific, already-tracked, `OPEN_FOUNDER` `DEC-SUB-*` item (DEC-SUB-001/002/003/008/009/010/013). **Five do not map to any tracked decision item and must be named as such, not silently folded into the `DEC-SUB-*` count:** refunds; the auto-renewal default; the commercial/subscription/pricing-change notice standard (not covered by FD-5/LEG-FD-05, which are scoped to Reward Program changes only); the specific payment-deadline day count; and the specific late-payment charge/interest mechanic (these last two accepted as *structural concepts* per External Legal Opinion §20/Reconciliation row 20, but their specific values are untracked by any `DEC-SUB-*` item — not the same gap as DEC-SUB-008's grace-period value, which is a distinct, already-tracked item). See the corrected §23 for how these five untracked gaps are handled (the same drafting-time-flag rationale already applied to indemnity procedural mechanics, not a claim that they are already tracked).

### 12. Out-of-Scope §18 Content (Category D — operational/configuration, not a Core Business Terms matter)

**Corrected — payment method requires a narrower split, not a blanket Category D prohibition.** A mechanism-agnostic structural reference to payment methods ("payment methods accepted are as specified by 11thONUS on the platform from time to time") is **Category B**, not Category D: the accepted External Legal Opinion §20 "Structural Subscription Provisions (Value-Independent)" table lists exactly this — `Payment methods — As specified on platform` — as a value-independent structural provision (Reconciliation Matrix row 20, Class A, "confirms FD-7 exactly"), and FD-7 only withholds authorization for *billing implementation* and *pricing implementation*, not for a value-independent forward-reference sentence. **Remains Category D:** the specific payment method(s) actually accepted (e.g., naming a card network, mobile-money provider, or bank-transfer rail); billing/payment provider selection and integration; invoice numbering/format; dunning/retry cadence implementation; Subscription Plan UI; pricing-page copy. These remain product/engineering configuration (FD-7's "does not authorize... billing implementation; pricing implementation") and should never become contractual provisions regardless of `DEC-SUB-*` resolution.

## 13. Recommended §18 Drafting Architecture

§18 can be drafted now as a durable structural clause using concepts limited to the Category A/B content above:

1. State that applicable fees, where they apply to a Business, are set out in separately governed and communicated commercial terms (a plan/pricing arrangement), not enumerated here.
2. State that, to the extent fees apply to a Business's participation under its applicable commercial terms, the Business is responsible for paying them and maintaining its account in good standing — **without asserting that a fee necessarily applies to every Business**, without asserting an amount, and without foreclosing the separate open question of complimentary/free/pilot participation (`DEC-SUB-013`).
3. **Corrected.** Do **not** state that changes to applicable commercial terms follow the FD-5/LEG-FD-05 Reward-Program-change pattern — on re-inspection, that pattern is not independently governed authority for commercial/subscription/pricing changes (FD-5/LEG-FD-05 are scoped to Reward Programs only; see §8/§11). Instead, state that notice must be given of plan or price changes and that the Business may terminate if a change is not accepted (the accepted External Legal Opinion §20/Reconciliation row 20 structure, independent of FD-5/LEG-FD-05), without asserting a specific notice period or standard. The exact commercial-change notice standard remains open (see §11) and is not resolved by this item.
4. State that commercial suspension is governed by §15 (cross-reference, not restatement).
5. State — this is the section's central, fully governed proposition — that commercial suspension does not, by itself, extinguish or automatically block redemption of a Business's already-honoured obligations toward valid earned rewards (cross-reference to §13/§15, consistent with `DEC-LOY-011`/TRD17 §17.20).
6. State that fees are quoted exclusive of taxes and the Business is responsible for applicable taxes, where tax legally applies (corrected this pass; External Legal Opinion §20/Reconciliation row 20), without a rate, jurisdiction, or collection mechanism.
7. Explicitly state, following the Part I–IV precedent (e.g., §13.7, §14.4, §17.3), that plan names, prices, currency, billing intervals, trial structure, complimentary/pilot eligibility, proration, grace periods, billing-ownership model, the specific payment-deadline day count, and the specific late-payment charge/interest mechanic (added this pass) are **not decided by this section** and remain governed by the applicable `DEC-SUB-*` decisions and any separately **governed and** communicated commercial terms (corrected this pass — matching item 1's and FD-7's own "separately governed and applicable" formulation; "communicated" alone would let an unresolved value become binding merely by being announced, without the governance FD-7 requires first).

This is example architecture to assess, not an instruction the Founder is bound to adopt — final structure remains a drafting-task decision, but every element above is independently supported.

## 14. Whether §18 Is Drafting-Ready

**§18 is drafting-ready now, on a purely structural basis (Category A/B content only).** This conclusion is directly supported by FD-7's disposition and the Terms Drafting Readiness Note's "Ready — structural language only" classification. It should **not** be drafted with any Category C content, and Category D content should never enter the Core Business Terms at all.

## 15. LEG-FD-15 Assessment

**LEG-FD-15 — Liability Architecture** (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-CLOSE-001`) resolves Reconciliation Matrix row 9 and is **Approved with jurisdictional/legal qualification** — meaning the architecture is settled at the Founder-disposition level, but final wording is subject to applicable-law/jurisdiction-specific legal drafting judgment, not open commercial choice. It supplies:

- A Business liability cap formula (12-month fees paid).
- An explicit, deliberate non-resolution of the zero-fee-Business case (no invented substitute figure).
- A rejection of counsel's proposed nominal customer cap, replaced with a "maximum extent permitted by applicable law" standard.
- A mandatory-law non-exclusion boundary.

## 16. Business Liability-Cap Architecture (drafting-ready, Category A)

> *"Subject to applicable law and non-excludable liability, the aggregate direct contractual liability of 11thONUS to a Business is capped at the total fees actually paid by that Business to 11thONUS during the 12 months immediately preceding the event giving rise to the claim."*

This exact formula is fully governed and drafting-ready as clause text now.

**Added this pass — the accepted indirect/consequential/punitive/special-damages exclusion (Category A/D, drafting-ready as jurisdictional/drafting input).** The original §16 omitted this element, which a Codex review flagged as a gap: the External Legal Opinion §9 states *"The Core Terms must disclaim all indirect, consequential, punitive, and special damages"* alongside the 12-month-fees Business cap. LEG-FD-15's own reconciliation of Legal Opinion §9 is explicit that this element is **not declined** — only the Legal Opinion's nominal customer cap is declined: *"its indirect/consequential/punitive/special-damages disclaimer structure and its Rwanda/Burundi jurisdiction-specific liability notes (notice-and-takedown, ARCT obligations) remain accepted as drafting/jurisdictional input, unaffected."* Reconciliation Matrix row 11 separately accepts the permissible-limitations structure as jurisdiction-specific drafting guidance (Class C). **Consequence:** a future Part VI drafting task's §19 scope is not limited to the cap formula, mandatory-law carve-out, and customer-cap non-adoption alone — it also includes drafting an indirect/consequential/punitive/special-damages exclusion, subject to the same mandatory-law carve-out (§18 below) and jurisdiction-specific "Prohibited Exclusions" boundary (Reconciliation row 11, Class C) that already bounds every other limitation clause in §19. This is accepted drafting *input*, not a fixed clause text mandate — the exact wording remains a Part VI drafting-task decision, same as every other element in this report.

## 17. Zero-Fee Business Boundary (Category C — not drafting-ready as a resolved value)

LEG-FD-15 is explicit and deliberate: a strict application of the fees-paid formula to a Business that has paid nothing produces a cap of **zero**, and the disposition **does not correct this with an invented substitute figure**. Appropriate treatment is *"left to final legal drafting and/or future commercial governance (potentially engaging `DEC-SUB-013`... not decided or estimated here)."*

**Consequence for Part VI drafting:** §19 may state the 12-month-fees-paid formula as the general rule, but must **not** independently invent a floor, nominal minimum, or alternative treatment for a zero-fee/complimentary/pilot Business. **Corrected this pass — LEG-FD-15 authorizes two paths, not one.** LEG-FD-15's own text authorizes appropriate treatment via *either* "final legal drafting" *or* "future commercial governance (potentially engaging `DEC-SUB-013`)" — it prohibits only an *invented nominal substitute figure*, not every legally-developed treatment. A future Part VI drafting task may therefore (a) escalate this as a bounded, properly-scoped legal-drafting question and resolve it through that legal judgment (not a product/commercial guess), (b) leave it to future `DEC-SUB-013`-adjacent commercial governance, or (c) flag it explicitly as a non-resolution (per the established Part I–IV technique — e.g., §13.7's `DEC-LOY-009` treatment) if neither path is exercised at drafting time. All three preserve FD-7/LEG-FD-15's authority boundary; only inventing a specific substitute number (e.g., defaulting to "no liability" or "cap of the lowest available plan fee") is prohibited.

## 18. Mandatory-Law Carve-Out (Category A, drafting-ready)

Every limitation/exclusion clause in §19 must carry the qualifying phrase *"to the maximum extent permitted by applicable law"* and must not purport to override liability applicable law does not permit the parties to exclude (fraud, wilful misconduct, gross negligence, death/personal injury, non-excludable statutory consumer warranties — Legal Opinion §11's "Prohibited Exclusions" table, Reconciliation row 11, Class C, accepted as jurisdiction-specific legal input). This is a governed, drafting-ready constraint, not an open question.

## 19. Customer-Liability Boundary (Category A, drafting-ready — as a negative/non-adoption statement)

Counsel's proposed nominal fixed cap ($25 USD/BIF equivalent — Legal Opinion §9) is **expressly not adopted** (LEG-FD-15, Reconciliation row 9). The governed portable principle is: *"11thONUS liability to customers is limited to the maximum extent permitted by applicable law, subject to mandatory consumer rights and jurisdiction-specific requirements — no invented fixed-currency figure is substituted."*

**Corrected — this principle belongs to Customer Terms, not §19.** The Core Business Terms instrument governs only the 11thONUS↔Business relationship (LEG-FD-10: Core Business Terms = "the relationship between 11thONUS and a participating Business"; Customer Terms/Platform Terms of Use = "the direct relationship between 11thONUS and the customer" — a **separate future governed work package**, not this instrument). 11thONUS's liability *to customers* is therefore not a §19 subject at all — the customer is not a party to the Business Terms. §19's only obligation regarding this boundary is negative: **do not invent or imply any customer-facing liability figure or standard**, whether nominal or otherwise. The full customer-liability rule (the "maximum extent permitted by applicable law" principle quoted above) is reserved entirely to the future Customer Terms work package — it should not be stated, even descriptively, in §19, consistent with Part IV §17's existing "Customer↔11thONUS complaints reserved to the separate Customer Terms/Platform Terms instrument" treatment (a reservation, not a restatement).

## 20. Indemnity Authority Assessment

The external Legal Opinion (§10) proposes fairly complete indemnity clause language: Business indemnifies, defends, and holds harmless 11thONUS against claims arising from (1) reward-fulfilment failure, (2) defective/illegal/harmful goods or services, (3) false advertising/misrepresentation, (4) tax non-compliance. Reconciliation Matrix row 10 classifies this as **Class A** ("consistent with existing 'Business bears responsibility' architecture; no LEG-FD item needed") and accepts it as *"the indemnity-clause content direction for future Business Terms drafting."*

**This is authority for the principle, not a blank check to adopt the opinion's full clause verbatim.** Per the task's own instruction not to assume the opinion's indemnity language is automatically approved in every detail, the following distinctions matter:

| Element | Governed? | Basis |
|---|---|---|
| General principle: Business is responsible for its own Reward Program, conduct, content, and compliance | **Governed (A)** | FD-2/FD-3/FD-5/FD-6; Business Obligation Matrix; already expressed in Parts II–IV (§9, §11, §12) — this is a *responsibility* allocation, distinct from an *indemnity* obligation (see below) |
| Indemnity for the four Reconciliation-row-10 subjects specifically: reward-fulfilment failure; defective/illegal/harmful goods or services; false advertising/misrepresentation; tax non-compliance | **Governed (A)** | Reconciliation Matrix row 10, Class A — these four, and only these four, are the accepted indemnity-clause content direction |
| Indemnity for Business breach of the Terms generally (beyond the four row-10 subjects) | **Corrected — NOT governed** | Reconciliation row 10 accepts indemnity for four enumerated subjects only; neither it nor Parts II–IV converts every Terms breach into an indemnity obligation. That a Business is *responsible* for compliance (Parts II–IV) does not establish that 11thONUS is *indemnified* for every breach — responsibility and indemnity are distinct concepts. Treating general breach as indemnifiable would impose materially broader liability without a Founder/legal disposition |
| Indemnity for unlawful conduct by the Business generally (beyond the four row-10 subjects) | **Corrected — NOT governed** | Same reasoning; Part II §10's prohibited-conduct catalogue establishes what conduct is prohibited, not that every instance of it is indemnifiable by the Business toward 11thONUS |
| Indemnity for Business-provided content/data generally (beyond the four row-10 subjects) | **Corrected — NOT governed** | Same reasoning; §11/§12's content/data responsibility allocation is not an indemnity clause |
| Negligence / wilful misconduct carve-out (i.e., whether the indemnity is reduced or excluded to the extent the claim arises from 11thONUS's own negligence or misconduct) | **NOT governed** | No FD/LEG-FD item addresses this qualification; it is standard indemnity drafting practice but has not been through Founder/legal disposition here |
| Defence-control mechanics (who controls the defence of an indemnified claim) | **NOT governed** | Absent from all FD/LEG-FD/Reconciliation material; this is genuine open legal-drafting territory |
| Settlement-consent mechanics (whether 11thONUS's consent is required to settle) | **NOT governed** | Same as above |
| Legal-costs allocation within the indemnity (as distinct from the LEG-FD-14 arbitration cost-allocation question, which is also explicitly left open) | **NOT governed** | LEG-FD-14 itself states cost-allocation mechanics are deliberately not decided; the same gap exists for indemnity-specific costs |
| Scope/mechanics of "third-party claims" as a defined term | **NOT governed** | No definition exists in governed authority; would need to be introduced |

**Conclusion (corrected):** The *fact* of Business indemnification of 11thONUS, scoped to exactly the **four** Reconciliation-row-10 subject-matter categories (reward-fulfilment failure, defective/illegal/harmful goods or services, false advertising/misrepresentation, tax non-compliance), is drafting-ready. **Extending indemnity to cover Terms breach, unlawful conduct, or content/data issues generally — beyond those four subjects — is NOT governed** and must not be drafted as if it were; the Business's separately-governed *responsibility* for its own conduct (Parts II–IV) does not itself establish an *indemnity* obligation to 11thONUS for every such matter. If Part VI drafting wants to extend indemnity beyond the four accepted subjects, that is a distinct open question requiring its own Founder/legal disposition, not an inference from existing responsibility language. The **procedural mechanics** of the indemnity — defence control, settlement consent, negligence/wilful-misconduct carve-outs, and cost allocation — are similarly **not governed by any Founder or legal disposition** and would constitute new legal policy if invented in Part VI drafting. These must either be omitted (with an explicit non-resolution statement, per the established §13.7/§14.4/LEG-FD-14-cost-allocation precedent) or escalated as a distinct legal-drafting question before Part VI finalizes — they should not be silently adopted from the Legal Opinion's own proposed language just because the general indemnity principle is approved.

## 21. §§19–20 Part VI Advance-Readiness Conclusion (not Part V scope)

**Correction:** §19 (Liability) and §20 (Indemnity) are **Part VI — Risk Allocation** content, confirmed directly against the controlled instrument's own architecture (`DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` v4.1, lines 83–85). They are **not** Part V. The originating task's phrase "§19 Liability and Indemnity" bundled two separate, correctly-numbered Part VI headings under a Part V-flavored instruction; this report treats that as an instruction to *also analyze* Part VI's readiness in advance, not as authority to draft or label §§19–20 as Part V. A future drafting task must draft §18 under a Part V authorization and §§19–20 (if and when authorized) under a **separate** Part VI authorization — the two must not be collapsed into one task or one "Part V" label.

§§19–20 are **drafting-ready on the following bounded basis** (this is Part VI advance-readiness analysis, performed now for efficiency, not a Part V drafting authorization):

- The Business liability-cap formula, mandatory-law carve-out, and the accepted indirect/consequential/punitive/special-damages exclusion (§§16, 18 above; damages exclusion added this pass) are fully governed and may be drafted as clause text now. The customer-liability non-adoption point (§19, corrected this pass) is a **negative constraint on §19** — do not invent or imply a customer-facing cap — not affirmative Business Terms content; the substantive customer-liability principle itself belongs entirely to the separate, not-yet-drafted Customer Terms work package (LEG-FD-10).
- The zero-fee-Business gap (corrected this pass) may be resolved via legal drafting, deferred to future commercial governance, or handled by an explicit non-resolution statement (§17's three paths) — but must not be resolved by inventing a nominal substitute figure.
- The indemnity *principle* and its four core subject-matter categories are governed and drafting-ready; its *procedural mechanics* (defence control, settlement consent, negligence carve-out, cost allocation) are not governed and must not be invented — they require either omission-with-flag or a separate legal-drafting/Founder pass.

## 22. Existing Controlled Inputs

- **CI-01** — Preamble: operator's registered legal name, registration/company number, registered address. Required before Founder approval and before legal approval. **Unaffected by Part V or Part VI; unchanged.**
- **CI-05** — §7.4-adjacent: reacceptance-on-Terms-change engineering mechanism. Required before Terms configuration. **Unaffected by Part V or Part VI; unchanged.**

Neither CI-01 nor CI-05 is resolved, touched, or restated as a Part V or Part VI matter by this assessment.

## 23. Proposed New Controlled Input

**None is proposed.** But the original version of this section overstated how many gaps are already tracked — a Codex review finding, verified as genuine and corrected below.

- **Most** Category C §18 items map to specific, already-tracked, already-OPEN `DEC-SUB-*` decisions (DEC-SUB-001/002/003/008/009/010/013) — no new decision item is needed to describe them; they are simply not yet resolved.
- **Corrected — five Category C items do NOT map to any tracked `DEC-SUB-*` decision or other named governance item:** refunds; the auto-renewal default; the commercial/subscription/pricing-change notice standard (this item is the same underlying gap §8/§11 generalized this pass from "price-change notice period" to the broader standard — one item, not separate ones); and, added this pass, the specific payment-deadline day count and the specific late-payment charge/interest mechanic (both accepted as *structural concepts* per External Legal Opinion §20/Reconciliation row 20, but their specific values are untracked). The original §23 incorrectly implied every Category C gap was already tracked; it was not. These five items are genuinely untracked gaps, not merely "not yet resolved" instances of an existing tracked decision.
- **Why no new Controlled Input is still proposed for these five items:** applying the same rationale already used for indemnity procedural mechanics — a Controlled Input is only warranted once a drafted clause actually needs the missing value (the Controlled Inputs Register's own stated purpose: "a CI row is only created for a drafted clause's gap"). None of refunds, auto-renewal default, commercial-notice standard, payment-deadline day count, or late-payment charge mechanic is a drafting blocker *today*, because §18 has not been drafted yet and can be drafted around each gap structurally (omission, or an explicit non-resolution statement, exactly as §13 item 3 above now does for commercial-change notice, and as §10's added bullet does for payment deadline/late charges). If and when a future §18 drafting task finds one of these gaps cannot be structurally avoided, that task — not this assessment — should either flag it with a `[CONTROLLED INPUT REQUIRED: ...]` marker in context or escalate it as a new named decision item at that time.
- The zero-fee-Business liability gap is an explicit, already-recorded deliberate non-resolution under LEG-FD-15 itself, which names its own likely future path (`DEC-SUB-013` or "future commercial governance") — creating a new Controlled Input here would duplicate an already-tracked gap.
- The indemnity procedural-mechanics gap (defence control, settlement consent, cost allocation) does not have a named tracking item, but it is not yet a **drafting blocker** either — because no clause text creating that gap has been written. Per the Controlled Inputs Register's own stated purpose, the correct governance action is to flag this gap *at drafting time*, when §19/§20 clause text is actually written (Part VI, not Part V) and the specific `[CONTROLLED INPUT REQUIRED: ...]` marker (or an explicit non-resolution sentence, if the drafting task judges a marker unnecessary because the clause can simply omit the mechanic) is placed in context — not to pre-create a Controlled Input against a section that does not yet exist. This mirrors exactly how CI-05 was created only once §7.4 needed it, not speculatively in advance.

## 24. Risks of Drafting §18 (Part V) and §§19–20 (Part VI) Now

- **Value leakage risk:** the single largest risk is a drafting pass unconsciously importing a `DEC-SUB-*` numeric/named value (e.g., a specific grace period, trial length, or plan name) while expressing "structural" language that reads more concretely than intended. Mitigated by the same `grep`-based prohibited-concept search technique Parts II–IV each used.
- **Commercial-notice-by-analogy risk (corrected this pass):** a drafting pass could invent a commercial/subscription-change notice standard by borrowing FD-5/LEG-FD-05's Reward-Program-change reasonable-notice pattern "by analogy." That pattern is not independently governed for commercial/subscription/pricing changes (see §8/§11/§13). §18 must draft around the gap structurally (applicable law / separately governed commercial terms), not import the Reward-Program standard.
- **Indemnity over-adoption risk:** treating the Legal Opinion §10's proposed clause language as pre-approved in full, rather than only its Class-A principle, would introduce unauthorized defence-control/settlement-consent/cost-allocation policy in a future Part VI drafting task. Identified and bounded in §20 above.
- **Zero-fee silent-resolution risk:** a future Part VI drafting task could inadvertently "solve" the zero-fee cap gap by, e.g., defaulting to "no liability" or "cap of the lowest available plan fee" — either would be an invented substitute figure LEG-FD-15 explicitly declined to supply. Must be handled as an explicit non-resolution.
- **Part-boundary risk (corrected this pass):** the originating task's phrase "§19 Liability and Indemnity" risked being read as Part V scope, when the controlled instrument places §19/§20 in Part VI (verified directly, §21 above). A future task must not draft or authorize §§19–20 under a "Part V" label; §18 (Part V) and §§19–20 (Part VI) require separate drafting authorizations.
- **Untracked-gap risk (corrected this pass):** five Category C §18 items (refunds, auto-renewal default, commercial/subscription-change notice standard, the payment-deadline day count, the late-payment charge/interest mechanic) were originally, incorrectly, implied to be tracked `DEC-SUB-*` items (the last two were simply omitted from earlier passes entirely). They are not tracked anywhere. A future §18 drafting task must treat them as genuinely open, not as instances of an existing decision awaiting resolution (see corrected §23).
- **`DEC-ID-005` adjacency risk:** if §18's suspension cross-reference or a future §19's liability-for-suspension-consequences drafting brushes up against owner-initiated self-suspension, it must preserve the same non-resolution `DEC-ID-005` already receives in §15.7/§16.8, not extend or narrow it.

## 25. Recommended Part V Scope and Recommended Part VI Advance-Readiness Scope

**These are two separate recommendations for two separate drafting tasks — they must not be collapsed into one "Part V" authorization.**

**Recommended Part V scope (§18 only):** draft §18 (Subscription and Fees) now, using **only** Category A and Category B content identified in §§9–10 of this report. Explicitly state, using the established non-resolution technique, that Category C content (§11) — including the commercial/subscription-change notice standard, corrected this pass to Category C — remains open (governed by open `DEC-SUB-*` decisions where tracked, or genuinely untracked where not, per corrected §23) and is not decided by these Terms.

**Recommended Part VI advance-readiness scope (§§19–20, when separately authorized):** a future Part VI drafting task may proceed on the bounded basis in §§16–21 above (Business liability-cap formula, mandatory-law carve-out, the accepted indirect/consequential/punitive/special-damages exclusion, governed indemnity principle scoped to its four accepted subject-matter categories only). **Added this pass:** the scope also includes the accepted Rwanda notice-and-takedown and Burundi ARCT jurisdictional liability notes (LEG-FD-15's own reconciliation of Legal Opinion §9 preserves these "unaffected," quoted in full in §16) — a future task must allocate them either within §19 itself (as a jurisdiction-qualified limitation) or to a **Part VIII** jurisdictional overlay entry (§26 Jurisdictional Overlay Mechanism / §27 Overlay index — the instrument's own architecture for exactly this kind of jurisdiction-specific content); this report does not decide which, since no governed authority mandates one placement over the other, but the material itself must not be silently dropped from scope regardless of where it lands. §19 must **not** state, draft, or imply any customer-facing liability rule — that principle is reserved entirely to the separate future Customer Terms work package (LEG-FD-10); §19's only obligation regarding customers is not to invent or imply a cap. Treat the zero-fee-Business gap and indemnity procedural mechanics as distinct open questions requiring either an explicit non-resolution statement or a follow-up controlled decision, not as pre-approved clause content. This recommendation is advance-readiness analysis only — it does not itself authorize Part VI drafting, which requires its own separate Founder authorization distinct from any Part V authorization.

## 26. Exact Clauses/Content That Must Remain Prohibited Until Further Governance

- Any specific plan name, price, currency, billing interval, staff/user limit, trial length or structure, proration mechanic, grace-period length, or per-business/owner-level billing model (DEC-SUB-001/002/003/008/009 — all OPEN_FOUNDER).
- Any complimentary/pilot/free-plan eligibility rule or terms (DEC-SUB-013, OPEN_FOUNDER).
- Any export-format commitment (DEC-SUB-010, OPEN_FOUNDER — reporting-adjacent, unlikely to belong in §18 anyway, flagged for completeness).
- Any invented zero-fee/complimentary-Business liability cap figure (LEG-FD-15, deliberately left open).
- Any customer-facing liability content in §19 at all — nominal, "maximum extent permitted by applicable law," or otherwise. LEG-FD-15 rejects the "$25 USD/BIF equivalent" figure specifically, and separately, LEG-FD-10 reserves the entire 11thONUS↔customer relationship to a future Customer Terms work package — §19 governs the Business relationship only and must not state, draft, or imply any customer-liability rule (corrected this pass).
- Any indemnity defence-control, settlement-consent, or legal-cost-allocation mechanic not already stated in governed authority; any negligence/wilful-misconduct carve-out to the indemnity; any definition or scope for "third-party claims" — none of these five elements is governed (see corrected §20's table in full; this list mirrors it and must not be treated as more permissive than that table).
- Any extension of indemnity to general Terms breach, unlawful conduct, or Business-provided content/data beyond the four Reconciliation-row-10 subjects (reward-fulfilment failure, defective/illegal/harmful goods or services, misrepresentation, tax non-compliance) — corrected this pass; the Business's separately-governed responsibility for those matters is not itself an indemnity obligation.
- Any refund policy, auto-renewal default, or commercial/subscription/pricing-change notice period or standard not already governed — including any notice standard borrowed by analogy from FD-5/LEG-FD-05 (those govern Reward Program changes only, not commercial/subscription changes).
- Any specific payment-deadline day count or specific late-payment interest rate/charge amount (added this pass) — the *structural concepts* (a payment deadline exists; reasonable late-payment charges may apply) are accepted per External Legal Opinion §20/Reconciliation row 20, but the specific values are untracked and must not be invented.
- Any *specific* payment method, billing provider, or invoicing/UI implementation detail (explicitly excluded by FD-7 as outside Core Terms scope entirely, regardless of `DEC-SUB-*` resolution). A mechanism-agnostic structural reference ("payment methods as specified on the platform") is permitted — see corrected §10/§12.
- Any resolution, implication, or narrowing of `DEC-ID-005` (owner-initiated self-suspension) beyond its existing non-resolution treatment in §15.7/§16.8.

## 27. Files Modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-V-READINESS-001-assessment-report-2026-08-31.md` (this file — created in the original assessment task; edited in place by `DEC-LEGAL-002-BT-PART-V-READINESS-001-CORR-001` to correct the Part V/Part VI boundary and withdraw the unsupported FD-5/LEG-FD-05 commercial-notice analogy, plus the §23 tracking-claim correction).
- `docs/00-governance/documentation-changes-log.md` (Entry 133 appended in the original task — see §36; updated by this correction pass to record `CORR-001`).

No other file modified. No Terms instrument, Decision Register, or Controlled Inputs Register file touched.

## 28. Code Diff Summary

None. Docs-only.

## 29. Commands Executed

Read-only git inspection only: `git status`, `git branch -a`, `git log`, `git fetch origin`, `git show origin/main:<path>` (repeated for each authority document), `git ls-tree -r --name-only origin/main`, `git grep` (repeated for FD-7/LEG-FD-15/DEC-SUB-*/DEC-ID-005/indemnity searches). No mutating git command was run.

## 30. Dependencies Added

None.

## 31. Config Changes

None.

## 32. Application/Source Changes

**NONE**, as expected. No file under `functions/`, `apps/`, or any Firebase/Firestore configuration was read for authority purposes beyond the single factual read of `functions/src/domains/business/models/businessStatus.ts` (inspected only as factual lifecycle architecture, explicitly not treated as contractual authority, per the governing instruction).

## 33. Risks

See §24 above (assessment-specific risks). General task risk: none — this is a read-only assessment with a single new markdown file and one changes-log entry.

## 34. Rollback Instructions

If this assessment report needs to be withdrawn: delete `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-V-READINESS-001-assessment-report-2026-08-31.md` and revert the corresponding entry in `docs/00-governance/documentation-changes-log.md`. No other repository state is affected; no `DEC-SUB-*`, CI-01, or CI-05 status was changed, so no register rollback is required.

## 35. Markdown Assessment-Report Path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-V-READINESS-001-assessment-report-2026-08-31.md`

## 36. Persistent `.md` Changes-Tracking Update

See appended entry in `docs/00-governance/documentation-changes-log.md`.

## 37. Exact Recommended Next Founder Action

Two separate confirmations, not one:

1. **Part V:** confirm whether the Founder wants §18 drafted now on the bounded Category A/B basis described in §13 above (structural framework; fees where applicable, borne by the Business; commercial suspension cross-referenced to §15; commercial suspension does not extinguish earned rewards; no `DEC-SUB-*` value; no invented commercial-notice standard) — matching the exact drafting discipline Parts I–IV already followed.
2. **Part VI (separate, advance-readiness only — not authorized by this report):** confirm, independently and only if/when the Founder wants to proceed to Part VI, whether §§19–20 should be drafted on the bounded basis in §§16–21 (Business liability cap, mandatory-law carve-out, the accepted damages exclusion, the accepted Rwanda/Burundi jurisdictional liability notes — allocation to §19 vs. Part VIII to be decided by that task — and the governed indemnity principle scoped to its four accepted subjects) — with §19 stating **no** customer-facing liability content of any kind (that principle is reserved to the future Customer Terms work package; §19's only obligation regarding customers is not inventing or implying a cap) and explicit zero-fee and indemnity-mechanics non-resolution statements — or whether any currently-open `DEC-SUB-*` item (particularly DEC-SUB-013, given its bearing on the zero-fee liability gap) should be resolved first.

No other Founder input is required to begin Part V drafting on the bounded basis; this assessment identifies no authority conflict and no ambiguity requiring a stop for §18. Part VI drafting requires its own separate go-ahead and is not authorized merely by accepting this report.

---

## FINAL GATE

**Corrected to two separate, Part-specific conclusions (per `DEC-LEGAL-002-BT-PART-V-READINESS-001-CORR-001`) — the two Parts are not collapsed into one gate:**

**Part V:** **`§18 SUBSCRIPTION AND FEES — STRUCTURAL DRAFTING READY`**

**Reason:** FD-7 supplies the exact Founder architecture needed to draft §18 on a "structural principle, no invented value" basis, matching the discipline Parts I–IV already used. No open Controlled Input (CI-01/CI-05) blocks Part V. Most Category C gaps (§11) map to already-tracked, already-open `DEC-SUB-*` decisions; the five that do not (refunds, auto-renewal default, commercial-notice standard, payment-deadline day count, late-payment charge mechanic) are genuinely open but do not block structural drafting — §18 can draft around each by omission or explicit non-resolution, without borrowing FD-5/LEG-FD-05's Reward-Program-change standard by analogy (that standard is not independently governed for commercial/subscription changes).

**Part VI:** **`§§19–20 RISK ALLOCATION — BOUNDED DRAFTING READY, SUBJECT TO RECORDED NON-RESOLUTIONS`**

**Reason:** LEG-FD-15 supplies the Business liability-cap formula, the mandatory-law carve-out, and the accepted indirect/consequential/punitive/special-damages exclusion (Legal Opinion §9, expressly preserved by LEG-FD-15's own reconciliation of that section) as governed, drafting-ready §19 content, plus the accepted Rwanda/Burundi jurisdictional liability notes (allocation to §19 or Part VIII to be decided by the drafting task); Reconciliation Matrix row 10 supplies the governed indemnity principle scoped to exactly its four enumerated subject-matter categories (reward-fulfilment failure, defective/illegal/harmful goods or services, misrepresentation, tax non-compliance — no wider extension). **Corrected this pass:** the customer-liability "maximum extent permitted by applicable law" principle is **not** §19 content at all — LEG-FD-10 reserves the entire 11thONUS↔customer relationship to a separate future Customer Terms work package; §19's only obligation regarding customers is a negative one (do not invent or imply a cap), not an affirmative statement of the principle. Matters that remain deliberately unresolved and must not be invented if Part VI is drafted (non-exhaustive list — see the full corrected §20 table and §26 for the complete boundary): the zero-fee-Business cap treatment (LEG-FD-15's own explicit non-resolution); any indemnity extension beyond the four accepted subjects (general Terms breach, unlawful conduct, or content/data issues); and indemnity procedural mechanics — defence control, settlement consent, cost allocation, the negligence/wilful-misconduct carve-out, and the scope/definition of "third-party claims" — none of which is addressed by any Founder/legal disposition. This is **advance-readiness analysis**, not a Part V drafting authorization and not itself an authorization to begin Part VI — Part VI requires its own separate Founder go-ahead.

**Overall:** readiness is positive for both Parts, but the two are not one drafting task. A future task drafting §18 does not thereby acquire authority to draft §§19–20, and vice versa.
