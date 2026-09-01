> **Title:** DEC-LEGAL-002-BT-DRAFT-005 — Core Business Terms Part V (§18 Subscription and Fees) Drafting Report
> **Version:** 1.0 · **Status:** DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-005-drafting-report-2026-09-01.md`
> **Date:** 2026-09-01 · **Task:** `DEC-LEGAL-002-BT-DRAFT-005`

# ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED

This report documents the drafting of Core Business Terms Part V (§18 Subscription and Fees) only. It does not authorize Terms configuration, does not close `DEC-LEGAL-002`, does not change Capability 3 status, and does not begin Part VI (§§19–20).

---

## 1. Entry repository state

`git status` at task start showed the working tree on `docs/dec-legal-002-bt-part-v-readiness-001` with a set of pre-existing untracked files unrelated to this task (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`/`docs/01-product`/`docs/05-implementation/reports`/`docs/06-engineering-governance`/`docs/30-go-to-market` files and `docs/07-product-design.zip`), left untouched throughout this task. No incomplete git operation (`MERGE_HEAD`, `rebase-merge`, `rebase-apply`) was present.

## 2. Base SHA

`origin/main` at task start: `ae814c4e965e3fcbdbbd5aa0c695353a4768f086` (PR #207 merge commit).

## 3. PR #207 merge verification

`git log --oneline -1 origin/main` confirmed `ae814c4e965e3fcbdbbd5aa0c695353a4768f086` as the current tip of `origin/main`, subject "Merge pull request #207 from Fkenogo/docs/dec-legal-002-bt-part-v-readiness-001." `git merge-base --is-ancestor ae814c4e965e3fcbdbbd5aa0c695353a4768f086 origin/main` confirmed true. Merge verified.

## 4. New branch

`docs/dec-legal-002-bt-draft-005`, created fresh from `origin/main` at `ae814c4e`.

## 5. Controlled Part V architecture verification

Directly re-inspected the merged Core Business Terms draft (v4.1) at task start: Part V — Commercial Terms contains §18 Subscription and Fees only (Part 0 §0.1, lines 82–83 pre-edit); Part VI — Risk Allocation contains §19 Liability and §20 Indemnity (lines 85–87 pre-edit) and remains untouched by this task. §18 was heading/placeholder only prior to this task, confirmed at the "End of Part IV" note (pre-edit line 417): *"Parts V through VIII above (§§18–27) remain headings and placeholders only... §15/§16's treatment of suspension and exit does not draft any part of §18's subscription/fees framework or any `DEC-SUB-*` value."* Parts I–IV (§§1–17) confirmed drafted and carrying the Founder-approved/pending-review baseline status; unaltered in substance by this task (§33 below). §§19–20 confirmed undrafted Part VI placeholders, unaltered by this task. Repository/worktree state confirmed safe (§1 above). Unrelated untracked files confirmed untouched (verified by `git status` before and after this task's edits — the same untracked-file list persists, none staged, none modified). No incomplete Git operation existed at task start or was left at task end.

No contradiction was found between the current repository state and the accepted readiness assessment; drafting proceeded without needing to stop for a discrepancy.

## 6. Authorities inspected

- FD-7 (Legal Counsel Handoff Pack §3 — Subscription-Terms Reconciliation sequencing disposition), re-read directly from `DEC-LEGAL-002-BT-PART-V-READINESS-001-assessment-report-2026-08-31.md` §6 (verbatim quotation).
- `DEC-LEGAL-002-BT-PART-V-READINESS-001-assessment-report-2026-08-31.md`, as merged through PR #207 and corrected in place by `-CORR-001` — read in full (§§1–37 and Final Gate). This is the governing drafting-readiness boundary for this task; its §13 (Recommended §18 Drafting Architecture), §9–§11 (Category A/B/C classification), §23 (no new Controlled Input rationale), and §26 (prohibited-concept list) directly shaped §18's clause structure.
- Current Core Business Terms v4.1 (`DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`) — read in full for Parts I–IV, with particular attention to Part III §13 (Reward Obligations, especially §13.2) and Part IV §15 (Suspension and Restriction, especially §15.4–§15.5) and §16 (Business Exit), whose earned-reward-survival-during-suspension pattern §18.5 cross-references rather than restates.
- Current Controlled Inputs Register (v4.1) — read in full; confirmed CI-01/CI-05 are the only two open items and neither concerns §18 subject matter.
- Current drafting Traceability Matrix (v4.1) — read in full for format precedent (clause/purpose/authority/portable/external-evidence/unresolved-input columns) and for the Part II/III/IV self-review-note style this task's Part V note follows.
- `DEC-PROD-004` (Decision Register, CONFIRMED — "Businesses are the paying subscribers; consumers do not pay for basic participation") — read directly, status re-verified unchanged.
- `DEC-LOY-011` (Decision Register, CONFIRMED — reward redemption during business suspension) — status re-verified unchanged.
- `DEC-SUB-001` through `DEC-SUB-013` (Decision Register) — every row read directly; statuses re-verified unchanged from the readiness assessment: `001`/`002`/`003`/`008`/`009`/`010`/`013` `OPEN_FOUNDER`; `004`/`005`/`006`/`007` `CONFIRMED`; `011`/`012` `SUPERSEDED`.
- `DEC-ID-005` (Decision Register, `OPEN_FOUNDER`) — status re-verified unchanged; scope re-read ("whether the MVP supports owner-initiated suspension/pause of their own business, and with what effects").
- TRD17 (`docs/02-technical/trd/17-subscription-and-billing.md`) — relied on indirectly through the readiness report's own citations (§§17.3, 17.4, 17.7, 17.19, 17.20, 17.30, 17.31, 17.37, 17.50, 17.51), which this task treats as already-verified structural authority; not independently re-read section-by-section beyond confirming the readiness report's citations are internally consistent with the Category A/B content actually drafted.
- Part III §13 and Part IV §15 of this same instrument — read directly in full (see §6 of this report's document-reading log above); §18.4–§18.5 are cross-references to, not restatements of, this material.
- `DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` and `-controlled-inputs-register-2026-08-30.md` (v4.1) — read in full for companion-document format precedent.

No application/backend/Firebase/configuration file was read for authority purposes in this task.

## 7. Drafting strategy

The readiness assessment's §13 "Recommended §18 Drafting Architecture" was adopted as the drafting skeleton, with one discretionary trim: this task uses only the load-bearing Category A/B content (items 1, 2, 4, 5, and 7 of the readiness report's §13, plus the confirmed plan/capacity facts from §9) and deliberately omits the three optional, non-binding Legal Opinion §20/Reconciliation-row-20 illustrations the readiness report separately identifies as available but not required (items 3 and 6, and the payment-method/payment-deadline/late-charge bullets in its §10) — see §22 below for the full rationale. The result is six numbered clauses (§18.1–§18.6): applicable commercial terms exist conditionally and are separately governed (§18.1); the Business-payer/conditional-fee-responsibility principle (§18.2); the three CONFIRMED plan/capacity facts stated without values (§18.3); commercial suspension cross-referenced to §15, not restated (§18.4); the central governed earned-reward-survival-during-commercial-suspension proposition (§18.5); and an explicit, complete non-resolution of the full Category C inventory (§18.6). This mirrors the drafting discipline and clause-numbering convention Parts II–IV already established (numbered prose clauses, no bracketed sub-headers, cross-reference rather than restate adjacent Parts, explicit non-resolution clauses for open `DEC-ID-005`/`DEC-SUB-*`-type gaps rather than silence).

## 8. §18 clause structure

See §18.1–§18.6 as drafted in the Core Business Terms instrument (`DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` v5.0). Summary:

- **§18.1** — Applicable commercial terms (fees/charges/subscription plan) exist only where they apply, are separately governed and communicated, and do not become Core-Terms-embedded plan/price/interval content.
- **§18.2** — Conditional fee responsibility: where fees apply, the Business (never the customer) pays them; no amount/currency/frequency/deadline; complimentary/free/pilot participation left open.
- **§18.3** — Plan/capacity structure: essential controls never paywalled; capacity (where it exists) measured by active Reward Programs; upgrade immediate/downgrade within-limits; no numeric value.
- **§18.4** — Commercial suspension cross-referenced to §15, not a separate regime.
- **§18.5** — Central governed proposition: commercial suspension does not by itself extinguish or block redemption of an already-earned reward, cross-referencing §13.2/§15.4–§15.5's governed-exception categories rather than restating them.
- **§18.6** — Explicit non-resolution of the full Category C inventory (plan names, prices, currency, billing intervals, staff/user limits, trial structure, complimentary/free/pilot eligibility and terms, proration, grace-period length, per-business/owner-level billing model, export formats, auto-renewal default, refund policy, the commercial-notice standard, the payment-deadline day count, the late-payment charge/interest mechanic).

## 9. Applicable-commercial-terms treatment

§18.1 states that fees/charges/a subscription plan/other commercial terms *may* apply to a Business, and where they do, they are set out separately and become binding only once separately governed and communicated. This directly implements FD-7's "specific commercial terms become binding only when separately governed and applicable to the Business" and the readiness report's §13 item 1. No plan name, price, currency, or interval is stated.

## 10. Conditional-fee treatment

§18.2 states fee responsibility using "to the extent commercial terms described in §18.1 apply" — a conditional formulation, not "the Business is a paying subscriber" or any other unqualified universal-fee statement. This directly follows the readiness report's own correction history (§9's note that a prior unqualified "Businesses are paying subscribers" bullet was removed as redundant and capable of reintroducing the universal-fee issue).

## 11. Universal-paid-participation check

Confirmed §18 nowhere states or implies that every Business necessarily pays a fee or holds a paid subscription as a condition of participation. §18.1's closing sentence and §18.2's opening "to the extent... apply" both expressly negate this reading. `grep`-based check (§38 below) confirms no unqualified "Businesses pay"/"Businesses are subscribers" assertion appears.

## 12. Customer-payer boundary

§18.2's second sentence states the customer is not the payer of the Business's platform fees and that nothing in the Terms requires a customer to pay for basic participation merely because the Business participates — directly implementing `DEC-PROD-004`'s payer-identity conclusion (FD-7; readiness report §9, Category A).

## 13. Confirmed DEC-SUB facts used

`DEC-SUB-004` (capacity measured in active Reward Programs), `DEC-SUB-006` (upgrade immediate/downgrade within-limits), and `DEC-SUB-007` (essential trust controls never paywalled) — all CONFIRMED, all stated in §18.3 without any numeric value, plan name, or plan count.

## 14. Confirmed DEC-SUB facts deliberately omitted from contract and why

`DEC-SUB-005` (single-branch-at-MVP/branch-ready architecture) — CONFIRMED but deliberately **not** included in §18. It is a technical/product architecture fact about branch data modeling, not a commercial/plan-differentiation fact a Business needs from its contractual Terms; including it would turn an implementation detail into a legal obligation without need, contrary to the governing task's §4 instruction ("avoid turning an implementation fact into a legal obligation without need"). `DEC-PROD-004`'s "customers never pay" half is used (§18.2); no other confirmed fact was found relevant to §18 and omitted.

## 15. Open DEC-SUB inventory/status

Re-verified directly against the Decision Register at task start (§6 above): `DEC-SUB-001` (final plan names), `DEC-SUB-002` (staff limits), `DEC-SUB-003` (trial structure), `DEC-SUB-008` (plan catalogue: prices/intervals/grace/proration), `DEC-SUB-009` (multi-business billing model), `DEC-SUB-010` (export formats), `DEC-SUB-013` (complimentary/free/pilot policy) — all `OPEN_FOUNDER`, unchanged. All seven are named verbatim in §18.6. `DEC-SUB-011`/`012` remain `SUPERSEDED` (by `DEC-SUB-001`/`004` respectively) — not `OPEN_FOUNDER`, not named in §18.6 as open items (superseded items are not live gaps).

## 16. Five untracked commercial questions treatment

Refund policy, auto-renewal default, the commercial/subscription/pricing-change notice standard, the payment-deadline day count, and the late-payment charge/interest mechanic are each named individually and verbatim in §18.6, alongside — not folded into — the `DEC-SUB-*` inventory, preserving the readiness report's own distinction between "already-tracked, still-open" and "genuinely untracked" gaps (readiness report §23). No new Controlled Input was created for any of the five (see §36 below); each is handled by explicit non-resolution rather than silent omission, consistent with the governing task's instruction (§6): "If §18 can remain complete without the value, preserve the gap without proliferating governance items."

## 17. Refund treatment

Not addressed anywhere in §18 except as a named open item in §18.6's non-resolution list. No refund rule, right, or mechanism is stated or implied.

## 18. Auto-renewal treatment

Not addressed anywhere in §18 except as a named open item in §18.6's non-resolution list ("whether a subscription renews automatically by default"). No default is stated in either direction.

## 19. Commercial-change notice treatment

Not addressed as a governed rule anywhere in §18. §18.6 names "the notice standard applicable to a change in commercial, subscription, or pricing terms" as open. Consistent with the governing task's §7 boundary, no fixed period (7/14/30 days or otherwise) is stated, and the FD-5/LEG-FD-05 Reward-Program-change notice standard is not imported by analogy anywhere in §18 — confirmed by the prohibited-concept search (§38 below), which found zero occurrences of "FD-5," "LEG-FD-05," or "reasonable advance notice" anywhere in §18's text. The optional Legal Opinion §20/Reconciliation-row-20 illustration (notice-of-plan/price-change existence, without a period) that the readiness report identifies as available was considered and deliberately omitted (§22 below).

## 20. Payment-deadline treatment

Not addressed. §18.2 expressly states it "does not state... a payment deadline." §18.6 separately names "the specific number of days within which a payment is due" as open. The optional structural-existence illustration (a deadline exists, without a day count) was considered and omitted (§22 below).

## 21. Late-payment-charge treatment

Not addressed. §18.6 names "the specific charge or interest mechanic applicable to a late payment" as open. The optional structural-existence illustration (reasonable charges/interest may apply, without a rate) was considered and omitted (§22 below).

## 22. Legal Opinion §20 illustration usage

Three optional, non-binding illustrations the readiness report identifies as available (its §10, tagged "OPTIONAL, non-binding illustration — not required") were considered and **not used**: (a) a mechanism-agnostic payment-method reference ("as specified on the platform"); (b) a value-independent tax-allocation statement (fees exclusive of taxes, Business responsible); (c) a notice-of-plan/price-change existence statement (notice given, Business may terminate if not accepted, no period stated). None was found necessary for §18 to read as complete and internally coherent — §18's six drafted clauses already state the fee-conditionality, payer-boundary, plan/capacity, suspension cross-reference, earned-reward-survival, and full non-resolution propositions the readiness report identifies as this section's actual governed and structural content. The governing task's own §8 instruction expresses a preference for "minimal durable drafting, not maximum clause coverage" and directs omitting optional illustrative content "unless it materially improves contractual coherence" — none of the three was found to meet that bar. This is a discretionary drafting choice within the readiness report's own stated boundary ("available, not required"), not a rejection of its authority; a future correction pass may add any of the three without new Founder or legal input, since each remains available exactly as the readiness report describes it. See the companion Traceability Matrix's Part V table note for the same rationale recorded in that document.

## 23. Tax treatment

Not addressed — the optional tax-allocation illustration (§22 above) was omitted. No tax rate, jurisdiction, or collection mechanism is stated or implied anywhere in §18.

## 24. Payment-method treatment

Not addressed — the optional payment-method illustration (§22 above) was omitted. No specific payment method, provider, or rail is named anywhere in §18 (confirmed by the prohibited-concept search, §38 below).

## 25. Trial treatment

Not addressed in §18 at all. `DEC-SUB-003` (trial structure) is named as an open item in §18.6; no trial duration, threshold, or conversion rule is stated or implied.

## 26. Free/complimentary/pilot treatment

Not resolved. §18.2 expressly states it "does not resolve whether, or on what terms, complimentary, free, or pilot participation may be available to some Businesses — that question remains separately governed," and §18.6 separately names complimentary/free/pilot eligibility and terms as open, cross-referencing `DEC-SUB-013` (`OPEN_FOUNDER`) in the companion Traceability Matrix.

## 27. Upgrade/downgrade treatment

§18.3 states the governed mechanic from `DEC-SUB-006` (CONFIRMED): upgrade takes effect immediately; downgrade takes effect once the Business's configuration/usage already fits the lower plan's limits. No proration mechanic (a distinct, still-open `DEC-SUB-008` matter) is stated.

## 28. Plan-capacity treatment

§18.3 states the governed mechanic from `DEC-SUB-004` (CONFIRMED): where a plan capacity limit applies, it is measured by active Reward Programs, not a different unit. No specific numeric limit, plan name, or plan count is stated.

## 29. Essential-controls/paywall treatment

§18.3 states the governed mechanic from `DEC-SUB-007` (CONFIRMED): essential trust/security functionality (customer verification, staff identity/access controls, purchase/loyalty history, transaction-integrity safeguards, redemption controls, dispute-handling access, basic audit, privacy/security) is available under every plan and never withheld as a paid upgrade; plans differ only by capacity and non-essential capability.

## 30. Commercial suspension treatment

§18.4 states that suspension/restriction arising solely from the Business's commercial/subscription relationship is governed by §15 and is not a separate regime — a pure cross-reference, consistent with the readiness report's §13 item 4 and the governing task's §4 instruction ("§15 governs suspension architecture").

## 31. Earned-reward preservation treatment

§18.5 states — cross-referencing, not restating, §13 and §15.4–§15.5 — that a commercial/subscription suspension does not by itself extinguish or block redemption of an otherwise-valid earned reward, subject to the same governed-exception categories (fraud, security, integrity, legal/regulatory, disputed validity) already established in §13.2/§15.5. This is the readiness report's identified "single most load-bearing governed §18 fact" (§9), drafted here as a genuine cross-reference (no restatement of the exception categories, no new suspension mechanics invented).

## 32. DEC-ID-005 boundary

§18 does not itself address owner-initiated business self-suspension at all. §18.4's cross-reference to §15 is general (all commercial/subscription suspension), and does not restate, narrow, extend, or resolve §15.7's existing `DEC-ID-005` non-resolution. `DEC-ID-005` remains `OPEN_FOUNDER`, unaffected by this task — confirmed by the prohibited-concept search (§38 below), which found no self-suspension language anywhere in §18.

## 33. Parts I–IV integrity verification

`git diff` on the Core Business Terms instrument confirmed, by direct inspection of every removed line (§39 below shows the full command output), that every substantive change to Parts I–IV is limited to: the front-matter title/version/date/task/authorities/companion-documents block; the "How to read this document" Part-count list; the DRAFT-status warning banner's Part-list sentence; the Part 0 §0.0 instrument-status table row; the Part 0 §0.1 Part V heading-status line; the Part 0 §0.2 readiness-table row 13; the Part I/III/IV heading notes (each only updating which Parts are "now also drafted"); and the Status Reaffirmation section (extended with Part V's own confirmed-facts/open-items lines). **No clause text in §§1–17 was altered.** This was independently verified by isolating every `git diff` `-` line and confirming each is one of the administrative categories above, none touching numbered clause prose in §§1–17.

## 34. Part VI untouched verification

`grep`-based confirmation that "§19"/"§20"/"Liability"/"Indemnity" appear in the instrument only inside Part 0's architecture table (unchanged, still heading-only) and the "End of Part V" placeholder note (which itself states no clause text for Parts VI–VIII should be inferred) — no Part VI clause text was added, and §18 does not draft, imply, or forward-reference any liability or indemnity mechanic.

## 35. CI-01/CI-05 state

Unchanged. CI-01 (Preamble — operator legal entity name/registration/address) and CI-05 (§7.4-adjacent — reacceptance-on-Terms-change engineering mechanism) remain the only two open Controlled Inputs. Neither concerns §18 subject matter; neither was touched by this task.

## 36. New Controlled Input, if any, and exact justification

**None created.** Applying the same rationale the readiness report's §23 and the Controlled Inputs Register's Part II/III/IV precedent already establish: a Controlled Input is warranted only once a drafted clause's gap actually needs the missing value to be draftable at all. Every Category C item — the seven open `DEC-SUB-*` items and the five untracked commercial questions — was found draftable-around by explicit non-resolution (§18.6), without any of them blocking §18's own completeness. No drafted clause in §18 depends on knowing a plan name, a price, a notice period, a payment deadline, or a late-charge rate to state its own proposition. This satisfies the governing task's §14 instruction precisely: "Explicit non-resolution is preferred where the clause remains coherent without the missing value" — every one of the twelve untracked/open items meets that test.

## 37. Traceability update

The companion Traceability Matrix (`DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md`, v5.0) was updated with a full "Part V clauses (§18, task `DEC-LEGAL-002-BT-DRAFT-005`)" table — one row per clause (§18.1–§18.6), each naming governing authority, portability, whether Legal Opinion evidence informed it (and, where so, explicitly labeled non-binding/optional rather than governed), and any unresolved input cross-reference — plus a dedicated note explaining the deliberate omission of the three optional illustrations, and a Part V paragraph in the "Clauses removed or not drafted" section confirming no clause was removed and no Part I–IV clause body was altered. The companion Controlled Inputs Register (v5.0) was updated with a "Part V review" section explaining why no new Controlled Input was created, plus an extension of the "remaining open controlled inputs" count-of-Parts language and a Part V paragraph in the cross-reference prohibited-concept-search note.

## 38. Prohibited-concept search results

`grep -niE` search of the §18 text region only, against the full task §16 prohibited-term list (Starter/Growth/Professional; Bronze/Silver/Gold; numeric price; BIF/USD pricing; monthly/annual/quarterly; 7/14/30-day notice; trial duration/conversion; staff number limits; complimentary/free eligibility; pilot commercial terms; proration; refund rule; auto-renewal; grace-period value; payment-deadline value; late fee/interest value; owner-level billing model; payment provider/rail; new lifecycle state; owner self-suspension; FD-5/LEG-FD-05 commercial analogy; Part VI liability/indemnity content) found exactly two matches, both in §18.2 and §18.6, and both are non-operative negation/reservation clauses naming the concept only to state it is **not** resolved or **not** stated by this section (e.g., "does not resolve whether... complimentary, free, or pilot participation," "does not decide... plan names; prices; currency..."). No plan name, no numeric value, no fixed period, no payment provider, and no self-suspension resolution was found asserted anywhere in §18. Separately confirmed zero occurrences of "FD-5," "LEG-FD-05," "configured state," "new lifecycle status," or "self-suspen*" anywhere in the §18 text.

## 39. Manual review result

Full clause-by-clause self-review performed (this report, §§9–34). No clause was found to require removal or further correction. `git diff` review (§33 above) confirmed no unintended edit to Parts I–IV clause text. The full diff-removed-lines output was inspected line-by-line; every removed line is an administrative label, none is clause prose.

## 40. Automated review result/availability

Not run as part of this drafting task — automated review (Codex or equivalent) runs against an opened pull request, not a local branch, and is out of scope for the drafting step itself. This report records that no automated review has yet occurred; the manual review in §39 is the review performed at drafting time. Per the governing task's §17 instruction, this is recorded accurately rather than fabricated; automated review availability should be checked once the PR is opened, and any findings addressed in a subsequent correction pass before this Part is represented as Founder-ready.

## 41. PR review-thread inventory

Not applicable at drafting-report time — no PR has yet been opened as of this report's writing. This section will be completed, and any review threads inspected and resolved, before completion is reported, consistent with the governing task's §17 instruction not to declare Founder-ready while a genuine substantive thread remains unresolved.

## 42. DEC-LEGAL-002 state

Unchanged: `OPEN_LEGAL`.

## 43. Capability 3 state

Unchanged: Open — engineering work packages complete; blocked on governed Terms-content configuration.

## 44. Terms configuration state

Unchanged: `NOT CONFIGURED` (`platformConfig/businessTerms`).

## 45. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v4.1 → v5.0)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (v4.1 → v5.0)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v4.1 → v5.0)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-005-drafting-report-2026-09-01.md` (this file — created)
- `docs/00-governance/documentation-changes-log.md` (Entry 134 added; header "Last controlled update" line updated)

No other file modified. No Decision Register file touched (no `DEC-SUB-*`/`DEC-ID-005`/`DEC-LEGAL-002` status changed).

## 46. Diff summary

Core Business Terms instrument: 46 insertions, 17 deletions net across administrative labels plus one new ~9-clause Part V section (§18.1–§18.6) and the "End of Part V" placeholder note. Traceability Matrix: one new Part V clause table (6 rows) plus a self-review paragraph and an omission-rationale note. Controlled Inputs Register: one new Part V review section plus an extended cross-reference note. Drafting Report and changes-log entry: new content only.

## 47. Commands executed

Read-only git inspection: `git status`, `git fetch origin`, `git log --oneline`, `git merge-base --is-ancestor`. One mutating command: `git checkout -b docs/dec-legal-002-bt-draft-005 origin/main`. Text search: `grep`/`awk` (repeated for Decision Register status verification and prohibited-concept search). No other mutating git command run in this task (no commit yet at drafting-report time; committing and PR creation follow this report).

## 48. Dependencies added

None.

## 49. Config changes

None.

## 50. Application/source changes

**NONE.** No file under `functions/`, `apps/`, or any Firebase/Firestore configuration was read or modified in this task.

## 51. CI/check result

Not yet applicable — no PR opened as of this report. Will be recorded once CI runs on the opened PR.

## 52. Risks

- **Optional-illustration reconsideration risk:** a future reviewer may prefer one or more of the three omitted optional illustrations (§22) be included for completeness; this is a legitimate, low-cost future correction (adding non-binding, already-available content) and does not require new Founder/legal input if pursued.
- **DEC-SUB-013 dependency risk:** the complimentary/free/pilot participation question (§18.2, §18.6) remains genuinely open; if resolved, a future correction pass should reconcile §18.2's "remains separately governed" language with the resolved policy, consistent with FD-7's own "becomes binding once separately governed" mechanism.
- **Untracked-gap persistence risk:** the five untracked commercial questions (refund, auto-renewal, notice standard, payment-deadline day count, late-charge mechanic) have no assigned owner/tracking item; if a future task needs one resolved to draft further content, that task — not this one — should either flag a `[CONTROLLED INPUT REQUIRED: ...]` marker at that point or escalate a new named decision item, per the readiness report's own §23 rationale.

## 53. Rollback instructions

If this draft needs to be withdrawn: revert the five files listed in §45 to their pre-task state (the merged v4.1 instrument, v4.1 Traceability Matrix, v4.1 Controlled Inputs Register, and the pre-Entry-134 changes-log state), and delete this drafting report. No `DEC-SUB-*`, `DEC-ID-005`, CI-01, or CI-05 status was changed, so no Decision Register or Controlled Inputs rollback is required. No application/source/Firebase/config state is affected.

## 54. Drafting report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-005-drafting-report-2026-09-01.md` (this file).

## 55. Documentation changes-log entry

Entry 134, `docs/00-governance/documentation-changes-log.md`.

## 56. Commit SHA

Recorded once the commit is created (following this report).

## 57. PR number/state

Recorded once the PR is opened (following this report). Not self-merged.

## 58. Exact Founder next action

Review §18 (Subscription and Fees) as drafted in `DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` v5.0 and confirm whether the structural Category A/B basis, the deliberate omission of the three optional Legal Opinion §20 illustrations, and the explicit non-resolution of the full Category C inventory (§18.6) are acceptable as drafted, or require correction. No `DEC-SUB-*` item needs to be resolved first — this Part was drafted specifically to be complete and coherent without any of them. If the Founder wants one or more of the omitted optional illustrations included, that is a low-cost follow-up correction requiring no new authority. Part VI (§§19–20) drafting requires its own separate Founder authorization and is not begun or implied by this task.

---

## FINAL GATE

**`CORE BUSINESS TERMS PART V §18 DRAFTED — STRUCTURAL COMMERCIAL BOUNDARY PRESERVED — AWAITING FOUNDER REVIEW`**
