# DEC-LEGAL-002-BT-PART-V-READINESS-001 — Core Business Terms Part V (§18 Subscription and Fees, §19 Liability and Indemnity) Drafting-Readiness Assessment

> **Status: ASSESSMENT ONLY — NO CLAUSE TEXT DRAFTED.** This report is an authority/architecture review, per the governing task scope. It does not draft §§18–19, does not begin Part VI, does not change any `DEC-SUB-*` status, and does not resolve CI-01 or CI-05.

**Task:** `DEC-LEGAL-002-BT-PART-V-READINESS-001`
**Date:** 2026-08-31
**Author task type:** docs-only governance assessment
**Founder disposition:** ACCEPTED (`DEC-LEGAL-002-BT-PART-V-READINESS-001-RECORD-001`, 2026-08-31) — final gate `PART V DRAFTING READY — STRUCTURAL COMMERCIAL BOUNDARY CONFIRMED` confirmed. Prior to recording, §§8, 9, and 13 below were re-verified against governing authority and corrected in place: the original phrasing ("subscription/applicable-fee relationship is a precondition of certain platform capabilities"; "Business must maintain applicable subscription"; "the Business's responsibility to pay applicable fees") read as asserting a universal per-Business fee/subscription obligation. `DEC-PROD-004` (CONFIRMED) establishes only that *where* fees apply to a Business, they are borne by the Business and never the customer — it does not establish that every Business necessarily has an active fee obligation, and `DEC-SUB-013` (complimentary/free/pilot plans policy) remains `OPEN_FOUNDER`. The three passages are corrected below to the narrower, governed formulation ("where/to the extent fees apply"), consistent with LEG-FD-15's own express contemplation of a zero-fee Business. No other content changed; no conclusion (§18/§19 readiness, the final gate) changed as a result — the correction is a precision fix to wording that could otherwise be read as inventing universal paid participation, not a change to the assessment's substance.

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

**Interpretation for this task:** FD-7 authorizes drafting §18 **now**, but only as a structural framework (parties, the fact that fees may apply, billing-cycle mechanics in the abstract, cancellation rights, change-to-terms mechanics). It is an explicit, standing prohibition against populating §18 with any `DEC-SUB-*` value — this is a durable constraint on drafting, not a one-time caveat that expires once some other decision is made.

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

No `DEC-SUB-*` status has changed across any Part I–IV drafting/correction task, and none changes in this task. Four are CONFIRMED (structural facts already safe to reflect: paid plans exist, capacity counted by active Reward Programs, upgrade/downgrade mechanics, essential controls never paywalled). Seven remain OPEN_FOUNDER (all numeric/named commercial values). Two are superseded/historical only.

Adjacent but distinct: **`DEC-ID-005`** (owner-initiated business self-suspension) remains **OPEN_FOUNDER** — not a `DEC-SUB-*` item, but relevant if §18 needs to describe suspension mechanics, since Part IV §15/§16 already carve this boundary out explicitly and §18 must do the same rather than assume it.

## 8. §18 Subject-Matter Classification Matrix

| Subject matter | Classification | Governing authority |
|---|---|---|
| Existence of paid Business participation | **A** | DEC-PROD-004 (CONFIRMED — businesses pay, customers don't); TRD17 §17.3 |
| Existence of free/complimentary/pilot participation *(that such a category may exist, structurally)* | **B** | DEC-SUB-013 (OPEN, but TRD17 §17.50/17.51 confirm the entitlement mechanism exists) — may be acknowledged structurally, no policy/eligibility stated |
| Payer identity (where fees apply to a Business's participation, they are borne by the Business, never the customer — not a claim that every Business necessarily has an active fee obligation, or that a subscription is universally mandatory) | **A** | FD-7; DEC-PROD-004 |
| Plan names | **C** | DEC-SUB-001 (OPEN_FOUNDER) |
| Pricing / price points | **C** | DEC-SUB-008 (OPEN_FOUNDER); EXT-LEG-003 (OPEN_LEGAL) |
| Currency | **C** | DEC-SUB-008 (OPEN_FOUNDER) |
| Billing interval | **C** | DEC-SUB-008 (OPEN_FOUNDER) |
| Payment method | **D** | Not a Core Terms matter — operational/payment-provider configuration (DEC-PROV-001-adjacent) |
| Billing provider | **D** | Operational/vendor selection, not contractual |
| Invoice mechanics (existence of invoices/receipts as a concept) | **B** | TRD17 §17.37 confirms the subscription/billing-period/payment-attempt/invoice/receipt distinction structurally; no format/timing value governed |
| Tax treatment | **B** | Non-numeric: "taxes where legally applicable" is a durable structural statement; no rate/jurisdiction mechanic governed |
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
| Price changes | **C** | No governed value or notice standard specific to price found; general programme-change reasonable-notice pattern (FD-5/LEG-FD-05, Part III §14) may be structurally analogous but has not been extended to commercial pricing by any Founder disposition |
| Notice of commercial changes | **B** | Reasonable-notice (not fixed-period) pattern is already the governed default elsewhere (FD-5/LEG-FD-05); extending the *same non-numeric standard* to commercial/subscription changes is consistent with existing authority, not an invented new rule |
| Relationship between commercial suspension and valid earned rewards | **A** | **Fully governed** — TRD17 §17.20 + `DEC-LOY-011` (CONFIRMED) + Part III §13 (already drafted, cross-referenceable): commercial/subscription-status suspension alone does not, by itself, block redemption of otherwise-valid earned rewards; governed exceptions (fraud/security/integrity/legal-regulatory/disputed-validity) apply |

### 9. Governed §18 Content (Category A — drafting-ready as-is)

- Businesses are paying subscribers; customers are not (DEC-PROD-004, CONFIRMED).
- Where fees apply to a Business's participation, they are borne by that Business, never the customer (DEC-PROD-004, CONFIRMED). **This is narrower than a claim that every Business necessarily has an active fee obligation or that maintaining a paid subscription is a universal precondition of participation** — whether a $0/complimentary/pilot arrangement exists for some Businesses is a distinct, still-open question (`DEC-SUB-013`, OPEN_FOUNDER), and TRD17 §17.50–17.51 already contemplate such access being modeled through the same entitlement architecture rather than treated as an exception to it. §18 must reflect fees/subscription conditionally ("where/to the extent applicable"), not as a universal Business obligation.
- Commercial/subscription-status suspension, by itself, does not extinguish or block redemption of valid earned rewards (TRD17 §17.20; `DEC-LOY-011`; Part III §13) — this is the single most load-bearing governed fact for §18, and it is fully drafting-ready today by direct cross-reference to §13/§15, exactly as Part IV did for exit.
- Essential trust/security controls are never paywalled (DEC-SUB-007, CONFIRMED) — differentiation between plans is capacity/enhanced-capability only.
- Upgrade is immediate; downgrade requires the Business's configuration to already fit the lower plan (DEC-SUB-006, CONFIRMED).
- Plan capacity, where it exists, is measured by active Reward Programs, not a different unit (DEC-SUB-004, CONFIRMED).

### 10. Non-Numeric §18 Content (Category B — draftable in durable structural language, no invented value)

- That applicable fees, where they exist for a Business, are set out in a separately governed/communicated commercial arrangement (plan/pricing document), not enumerated in the Core Terms themselves.
- That a trial, cancellation right, renewal mechanism, and payment-status states (e.g., past-due, grace) exist as structural concepts, without stating their length, trigger detail, or numeric threshold.
- That commercial/subscription changes are subject to a reasonable-notice standard consistent with the existing FD-5/LEG-FD-05 pattern, without fixing a period.
- That commercial suspension is a species of suspension already governed by §15, and reactivation follows the structural pattern TRD17 §17.31 describes (plan selection, resolving payment, confirmed status, restoring access) without inventing new lifecycle states beyond `businessStatus.ts`'s eight governed states.
- That taxes apply where legally applicable, without asserting a rate, jurisdiction, or collection mechanism.
- That invoices/receipts exist as a structural billing concept (TRD17 §17.37), without format/timing detail.

### 11. Open §18 Content (Category C — not drafting-ready; would require inventing a value or resolving an open decision)

Plan names; prices; currency; billing intervals; staff limits; trial structure/length; complimentary/pilot plan eligibility and terms; proration; grace-period length; per-business vs. owner-level billing model; export formats; auto-renewal default; refund policy; price-change notice period. All of these map to an OPEN_FOUNDER `DEC-SUB-*` item, an unaddressed gap (refunds, auto-renewal default, price-change notice), or both.

### 12. Out-of-Scope §18 Content (Category D — operational/configuration, not a Core Business Terms matter)

Specific payment method(s) accepted; billing/payment provider selection and integration; invoice numbering/format; dunning/retry cadence implementation; Subscription Plan UI; pricing-page copy. These belong to product/engineering configuration (explicitly excluded by FD-7's "does not authorize... billing implementation; pricing implementation") — they should never become contractual provisions regardless of `DEC-SUB-*` resolution.

## 13. Recommended §18 Drafting Architecture

§18 can be drafted now as a durable structural clause using concepts limited to the Category A/B content above:

1. State that applicable fees, where they apply to a Business, are set out in separately governed and communicated commercial terms (a plan/pricing arrangement), not enumerated here.
2. State that, to the extent fees apply to a Business's participation under its applicable commercial terms, the Business is responsible for paying them and maintaining its account in good standing — **without asserting that a fee necessarily applies to every Business**, without asserting an amount, and without foreclosing the separate open question of complimentary/free/pilot participation (`DEC-SUB-013`).
3. State that changes to applicable commercial terms follow the same reasonable-notice, non-retrospective pattern already governed for Reward Program changes (cross-reference, not restatement, of FD-5/LEG-FD-05's existing principle) — this is a **judgment extension** of an existing pattern to a new context, not an invented new rule, and should be flagged as such in the drafting report the way Part III flagged similar extensions.
4. State that commercial suspension is governed by §15 (cross-reference, not restatement).
5. State — this is the section's central, fully governed proposition — that commercial suspension does not, by itself, extinguish or automatically block redemption of a Business's already-honoured obligations toward valid earned rewards (cross-reference to §13/§15, consistent with `DEC-LOY-011`/TRD17 §17.20).
6. State that taxes apply where legally applicable, without a rate or mechanism.
7. Explicitly state, following the Part I–IV precedent (e.g., §13.7, §14.4, §17.3), that plan names, prices, currency, billing intervals, trial structure, complimentary/pilot eligibility, proration, grace periods, and billing-ownership model are **not decided by this section** and remain governed by the applicable `DEC-SUB-*` decisions and any separately communicated commercial terms.

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

## 17. Zero-Fee Business Boundary (Category C — not drafting-ready as a resolved value)

LEG-FD-15 is explicit and deliberate: a strict application of the fees-paid formula to a Business that has paid nothing produces a cap of **zero**, and the disposition **does not correct this with an invented substitute figure**. Appropriate treatment is *"left to final legal drafting and/or future commercial governance (potentially engaging `DEC-SUB-013`... not decided or estimated here)."*

**Consequence for Part V drafting:** §19 may state the 12-month-fees-paid formula as the general rule, but must **not** independently invent a floor, nominal minimum, or alternative treatment for a zero-fee/complimentary/pilot Business. If the drafting task judges that silence on this point creates an unacceptable drafting gap (i.e., the formula literally producing a $0 cap reads as absurd or unintended), the correct response is to **flag** it explicitly as a non-resolution (per the established Part I–IV technique — e.g., §13.7's `DEC-LOY-009` treatment) rather than to resolve it. This is not new legal policy waiting to be invented in Part V — it is a known, named, deliberately-left-open gap, and treating it that way preserves FD-7/LEG-FD-15's authority boundary exactly.

## 18. Mandatory-Law Carve-Out (Category A, drafting-ready)

Every limitation/exclusion clause in §19 must carry the qualifying phrase *"to the maximum extent permitted by applicable law"* and must not purport to override liability applicable law does not permit the parties to exclude (fraud, wilful misconduct, gross negligence, death/personal injury, non-excludable statutory consumer warranties — Legal Opinion §11's "Prohibited Exclusions" table, Reconciliation row 11, Class C, accepted as jurisdiction-specific legal input). This is a governed, drafting-ready constraint, not an open question.

## 19. Customer-Liability Boundary (Category A, drafting-ready — as a negative/non-adoption statement)

Counsel's proposed nominal fixed cap ($25 USD/BIF equivalent — Legal Opinion §9) is **expressly not adopted** (LEG-FD-15, Reconciliation row 9). The governed portable principle is: *"11thONUS liability to customers is limited to the maximum extent permitted by applicable law, subject to mandatory consumer rights and jurisdiction-specific requirements — no invented fixed-currency figure is substituted."* Note the Core Business Terms instrument governs the Business relationship; the customer-liability boundary is drafting-relevant to §19 only insofar as §19 must not accidentally state or imply a customer-facing cap value that belongs, if anywhere, in the separate Customer Terms instrument (LEG-FD-10's instrument split). §19 should state the principle (no nominal figure) and expressly reserve customer-facing liability wording to the Customer Terms/Platform Terms instrument, consistent with Part IV §17's existing "Customer↔11thONUS complaints reserved to the separate Customer Terms/Platform Terms instrument" treatment.

## 20. Indemnity Authority Assessment

The external Legal Opinion (§10) proposes fairly complete indemnity clause language: Business indemnifies, defends, and holds harmless 11thONUS against claims arising from (1) reward-fulfilment failure, (2) defective/illegal/harmful goods or services, (3) false advertising/misrepresentation, (4) tax non-compliance. Reconciliation Matrix row 10 classifies this as **Class A** ("consistent with existing 'Business bears responsibility' architecture; no LEG-FD item needed") and accepts it as *"the indemnity-clause content direction for future Business Terms drafting."*

**This is authority for the principle, not a blank check to adopt the opinion's full clause verbatim.** Per the task's own instruction not to assume the opinion's indemnity language is automatically approved in every detail, the following distinctions matter:

| Element | Governed? | Basis |
|---|---|---|
| General principle: Business is responsible for its own Reward Program, conduct, content, and compliance | **Governed (A)** | FD-2/FD-3/FD-5/FD-6; Business Obligation Matrix; already expressed in Parts II–IV (§9, §11, §12) |
| Claims arising from the Business's Reward Program | **Governed (A)** | Reconciliation row 10; consistent with §11 (already drafted) |
| Claims arising from Business breach of the Terms | **Governed (A)** | Standard indemnity-for-breach is consistent with existing responsibility architecture; not a new policy |
| Claims arising from unlawful conduct by the Business | **Governed (A)** | Same as above; consistent with Part II §10 prohibited-conduct catalogue |
| Claims arising from Business-provided content/data | **Governed (A)** | Consistent with §11/§12's existing content/data responsibility allocation |
| Claims arising from reward fulfilment | **Governed (A)** | Directly stated in Reconciliation row 10 and consistent with §13 |
| Negligence / wilful misconduct carve-out (i.e., whether the indemnity is reduced or excluded to the extent the claim arises from 11thONUS's own negligence or misconduct) | **NOT governed** | No FD/LEG-FD item addresses this qualification; it is standard indemnity drafting practice but has not been through Founder/legal disposition here |
| Defence-control mechanics (who controls the defence of an indemnified claim) | **NOT governed** | Absent from all FD/LEG-FD/Reconciliation material; this is genuine open legal-drafting territory |
| Settlement-consent mechanics (whether 11thONUS's consent is required to settle) | **NOT governed** | Same as above |
| Legal-costs allocation within the indemnity (as distinct from the LEG-FD-14 arbitration cost-allocation question, which is also explicitly left open) | **NOT governed** | LEG-FD-14 itself states cost-allocation mechanics are deliberately not decided; the same gap exists for indemnity-specific costs |
| Scope/mechanics of "third-party claims" as a defined term | **NOT governed** | No definition exists in governed authority; would need to be introduced |

**Conclusion:** The *fact* of Business indemnification of 11thONUS, and its four subject-matter categories (fulfilment failure, unlawful/defective conduct, misrepresentation, tax non-compliance) plus breach/unlawful-conduct/content extensions consistent with existing Parts II–IV architecture, are drafting-ready. The **procedural mechanics** of the indemnity — defence control, settlement consent, negligence/wilful-misconduct carve-outs, and cost allocation — are **not governed by any Founder or legal disposition** and would constitute new legal policy if invented in Part V drafting. These must either be omitted (with an explicit non-resolution statement, per the established §13.7/§14.4/LEG-FD-14-cost-allocation precedent) or escalated as a distinct legal-drafting question before Part V finalizes — they should not be silently adopted from the Legal Opinion's own proposed language just because the general indemnity principle is approved.

## 21. §19 Drafting-Readiness Conclusion

§19 (as **Liability**, and the adjacent **Indemnity** content originally slated as §20 per the v4.1 draft's Part VI architecture — the task brief's "§19 Liability and Indemnity" combines what the current draft's own architecture treats as two headings, §19 Liability and §20 Indemnity, both under Part VI "Risk Allocation") is **drafting-ready on the following bounded basis**:

- The Business liability-cap formula, mandatory-law carve-out, and customer-cap non-adoption principle (§§16, 18, 19 above) are fully governed and may be drafted as clause text now.
- The zero-fee-Business gap must be handled by an explicit, deliberate non-resolution statement — not invented, not silently omitted.
- The indemnity *principle* and its four core subject-matter categories are governed and drafting-ready; its *procedural mechanics* (defence control, settlement consent, negligence carve-out, cost allocation) are not governed and must not be invented — they require either omission-with-flag or a separate legal-drafting/Founder pass.

## 22. Existing Controlled Inputs

- **CI-01** — Preamble: operator's registered legal name, registration/company number, registered address. Required before Founder approval and before legal approval. **Unaffected by Part V; unchanged.**
- **CI-05** — §7.4-adjacent: reacceptance-on-Terms-change engineering mechanism. Required before Terms configuration. **Unaffected by Part V; unchanged.**

Neither CI-01 nor CI-05 is resolved, touched, or restated as a Part V matter by this assessment.

## 23. Proposed New Controlled Input

**None is proposed.** Every gap identified in this assessment (§8 Category C content, the zero-fee-Business liability treatment, indemnity procedural mechanics) already maps to an existing governance mechanism:

- All Category C §18 items map to specific, already-tracked, already-OPEN `DEC-SUB-*` decisions (DEC-SUB-001/002/003/008/009/010/013) — no new decision item is needed to describe them; they are simply not yet resolved.
- The zero-fee-Business liability gap is an explicit, already-recorded deliberate non-resolution under LEG-FD-15 itself, which names its own likely future path (`DEC-SUB-013` or "future commercial governance") — creating a new Controlled Input here would duplicate an already-tracked gap.
- The indemnity procedural-mechanics gap (defence control, settlement consent, cost allocation) does not have a named tracking item, but it is not yet a **drafting blocker** either — because no clause text creating that gap has been written. Per the Controlled Inputs Register's own stated purpose ("a CI row is only created for a drafted clause's gap"), the correct governance action is to flag this gap *at drafting time*, when §19/§20 clause text is actually written and the specific `[CONTROLLED INPUT REQUIRED: ...]` marker (or an explicit non-resolution sentence, if the drafting task judges a marker unnecessary because the clause can simply omit the mechanic) is placed in context — not to pre-create a Controlled Input against a section that does not yet exist. This mirrors exactly how CI-05 was created only once §7.4 needed it, not speculatively in advance.

## 24. Risks of Drafting Part V Now

- **Value leakage risk:** the single largest risk is a drafting pass unconsciously importing a `DEC-SUB-*` numeric/named value (e.g., a specific grace period, trial length, or plan name) while expressing "structural" language that reads more concretely than intended. Mitigated by the same `grep`-based prohibited-concept search technique Parts II–IV each used.
- **Indemnity over-adoption risk:** treating the Legal Opinion §10's proposed clause language as pre-approved in full, rather than only its Class-A principle, would introduce unauthorized defence-control/settlement-consent/cost-allocation policy. Identified and bounded in §20 above.
- **Zero-fee silent-resolution risk:** a drafting pass could inadvertently "solve" the zero-fee cap gap by, e.g., defaulting to "no liability" or "cap of the lowest available plan fee" — either would be an invented substitute figure LEG-FD-15 explicitly declined to supply. Must be handled as an explicit non-resolution.
- **Combined-heading risk:** the task brief frames "§19 Liability and Indemnity" as one section, while the current v4.1 draft's own Part VI architecture lists them as two separate headings (§19 Liability, §20 Indemnity). A Part V drafting task should resolve this naming/numbering question deliberately (and record which convention it follows) rather than silently deviating from the existing Part VI heading structure already published in the draft instrument.
- **`DEC-ID-005` adjacency risk:** if §18's suspension cross-reference or §19's liability-for-suspension-consequences drafting brushes up against owner-initiated self-suspension, it must preserve the same non-resolution `DEC-ID-005` already receives in §15.7/§16.8, not extend or narrow it.

## 25. Recommended Part V Scope

Draft §18 (Subscription and Fees) and §19/§20 (Liability / Indemnity) now, using **only** Category A and Category B content identified in §§9–10 and §§16–20 of this report. Explicitly state, using the established non-resolution technique, that Category C content (§11) remains governed by open `DEC-SUB-*` decisions and is not decided by these Terms. Treat indemnity procedural mechanics as a distinct open question requiring either an explicit non-resolution statement or a follow-up controlled decision, not as pre-approved clause content.

## 26. Exact Clauses/Content That Must Remain Prohibited Until Further Governance

- Any specific plan name, price, currency, billing interval, staff/user limit, trial length or structure, proration mechanic, grace-period length, or per-business/owner-level billing model (DEC-SUB-001/002/003/008/009 — all OPEN_FOUNDER).
- Any complimentary/pilot/free-plan eligibility rule or terms (DEC-SUB-013, OPEN_FOUNDER).
- Any export-format commitment (DEC-SUB-010, OPEN_FOUNDER — reporting-adjacent, unlikely to belong in §18 anyway, flagged for completeness).
- Any invented zero-fee/complimentary-Business liability cap figure (LEG-FD-15, deliberately left open).
- Any nominal fixed-currency customer liability cap (LEG-FD-15 — the "$25 USD/BIF equivalent" figure is expressly rejected).
- Any indemnity defence-control, settlement-consent, or legal-cost-allocation mechanic not already stated in governed authority.
- Any refund policy, auto-renewal default, or price-change notice period not already governed.
- Any payment method, billing provider, or invoicing/UI implementation detail (explicitly excluded by FD-7 as outside Core Terms scope entirely, regardless of `DEC-SUB-*` resolution).
- Any resolution, implication, or narrowing of `DEC-ID-005` (owner-initiated self-suspension) beyond its existing non-resolution treatment in §15.7/§16.8.

## 27. Files Modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-V-READINESS-001-assessment-report-2026-08-31.md` (this file, new).
- `docs/00-governance/documentation-changes-log.md` (new entry appended — see §36).

No other file modified.

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

Confirm whether the Founder wants Part V drafted on the bounded Category A/B basis described in §§13, 21, and 25 above (structural §18, bounded §19/§20 with explicit zero-fee and indemnity-mechanics non-resolution statements) — matching the exact drafting discipline Parts I–IV already followed — or wants any of the currently-open `DEC-SUB-*` items (particularly DEC-SUB-013, complimentary/free plans, given its direct bearing on the zero-fee liability gap) resolved first. No other Founder input is required to begin drafting on the bounded basis; this assessment identifies no authority conflict and no ambiguity requiring a stop.

---

## FINAL GATE

**`PART V DRAFTING READY — STRUCTURAL COMMERCIAL BOUNDARY CONFIRMED`**

**Reason:** FD-7 and LEG-FD-15 together supply the exact Founder/legal architecture needed to draft §18 and §19/§20 on the same "structural principle, no invented value" discipline Parts I–IV already used successfully. No open Controlled Input (CI-01/CI-05) blocks Part V. All Category C gaps (§11) map to already-tracked, already-open `DEC-SUB-*` decisions or an already-recorded deliberate LEG-FD-15 non-resolution (zero-fee cap) — none requires inventing a new Controlled Input or stopping for Founder clarification before drafting can begin. The one genuine drafting-discipline risk identified — indemnity procedural mechanics (defence control, settlement consent, cost allocation) lacking governed authority — is bounded and manageable via the same explicit non-resolution technique already established in §13.7/§14.4/LEG-FD-14, not a blocker to starting Part V.
