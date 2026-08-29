> **Title:** Founder Legal Architecture Disposition Record — LEG-FD-01 through LEG-FD-15
> **Version:** 2.0 (2026-08-29 — adds LEG-FD-14/15, task `DEC-LEGAL-002-FOUNDER-CLOSE-001`) · **Status:** Founder-approved product/legal-architecture positions · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002` — this record informs `DEC-LEGAL-002`; it does not itself close it
> **Task:** `DEC-LEGAL-002-LEGAL-OPINION-RECON-001` (LEG-FD-01–13, v1.0); `DEC-LEGAL-002-FOUNDER-CLOSE-001` (LEG-FD-14–15, v2.0 — continuation, not a restart)
> **Inputs reconciled:** [External Legal Opinion (verbatim)](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md); Founder FD-1–FD-7 ([Legal Counsel Handoff Pack](DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md) §3); `DEC-LOY-011` (CONFIRMED); existing governed architecture (TRD suite, Decision Register, CDR-001).
> **Relationship to FD-1–FD-7:** LEG-FD-01–15 are a distinct, later Founder disposition set. They do not reopen, contradict, or supersede FD-1–FD-7 or `DEC-LOY-011` — where a topic overlaps (reward monetary character, suspension, exit, programme changes), the earlier disposition is preserved and LEG-FD-04–08 below add the *legal-form* qualification counsel's opinion prompted, cross-referenced rather than restated.

# Purpose

This record captures fifteen Founder positions on how 11thONUS reconciles the external Legal Opinion (`DEC-LEGAL-002-LEGAL-OPINION-RECON-001`'s reconciled evidence) against existing Founder product authority, confirmed decisions, and governed architecture. These are **governance-architecture and product-policy positions**, not final Terms language and not, by themselves, a legal conclusion. They set the boundaries within which Core Business Terms may later be drafted. LEG-FD-14/15 (added 2026-08-29, `DEC-LEGAL-002-FOUNDER-CLOSE-001`) resolve the two items LEG-FD-11 and the Reconciliation Matrix's row 9 had left open — see the "16/16" readiness conclusion in the [Terms Drafting Readiness Note](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md).

---

## LEG-FD-01 — Governing Interpretation Principle (Global-Standard Fallback)

**Disposition: APPROVED — adopted as a durable, cross-cutting interpretive principle.**

Where applicable law establishes a clear mandatory requirement, 11thONUS complies with that requirement for the relevant jurisdiction. Where applicable law is silent, developing, ambiguous, or permits reasonable contractual discretion, 11thONUS adopts a reasonable, internationally recognizable digital-platform standard consistent with: transparency; informed acceptance; fairness; data protection; security; proportionality; reasonable notice; auditable records; and effective complaint/redress mechanisms.

Jurisdiction-specific requirements are implemented, wherever practical, as jurisdictional overlays (Layer 2, see LEG-FD architecture in the [Terms Drafting Readiness Note](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md)) rather than by redefining the global/core product architecture (Layer 1). This principle does not authorize ignoring mandatory local law, and it does not itself resolve any specific numeric requirement (notice period, cure period, run-off length, etc.) — those remain governed individually per LEG-FD-05–08 below.

**Effect on the Legal Opinion:** governs how every specific numeric or jurisdiction-flavored recommendation in the opinion (30/60/14/7/24/48-day/hour figures, KIAC/Kigali forum specifics, Rwanda/Burundi governing-law split) is treated below — as a *candidate jurisdictional-overlay or drafting input*, not an automatically-adopted global rule.

---

## LEG-FD-02 — Language Architecture

**Disposition: APPROVED.**

Core 11thONUS product languages remain English and French. A local language does not automatically become a general application language merely because 11thONUS operates in that jurisdiction. Local-language communication (including a jurisdiction's official language) may be provided where appropriate or legally required for consumer education, important legal notices, Reward Program communication, accessibility, regulatory communication, or other customer-facing communication — without that local language becoming a general 11thONUS application language.

**Burundi:** Kirundi may be used in customer communication and legal-accessibility materials (e.g., a Kirundi-language notice or plain-language explainer accompanying the French Customer Terms) without making Kirundi a general 11thONUS application language. This does not authorize Kirundi product localization (UI strings, in-app copy) through this task or this decision.

**Where a jurisdiction clearly mandates a particular language for a specific legal instrument or interface** (e.g., a consumer-protection statute requiring the local official language for a specific consumer-facing disclosure), that requirement is handled through the jurisdictional overlay for that instrument, not by changing the global language architecture.

**Reconciliation with the Legal Opinion §14:** the opinion's recommendation that Kirundi "must be made available" for consumer-facing Terms is **not adopted as a global-architecture change** by this disposition (see Reconciliation Matrix row 14, classified B — legally qualified). Existing TRD13 architecture already correctly distinguishes "launch-critical" languages (English/French) from "architecture-ready" languages (Kirundi, Swahili, Kinyarwanda) — this disposition is consistent with, and does not require correcting, that existing architecture. Whether Burundi consumer-protection law in fact *mandates* Kirundi for the specific EUTOS/Customer Terms instrument (as opposed to permitting French to serve as the operative legal text with Kirundi accessibility material) is a jurisdictional-overlay drafting question for the Burundi Customer Terms addendum, not resolved here.

---

## LEG-FD-03 — Electronic Acceptance

**Disposition: APPROVED WITH QUALIFICATION.**

The portable acceptance standard is: affirmative acceptance + identifiable accepting party + exact Terms version + authoritative timestamp + retrievable accepted Terms. This is already the shape of the existing `BusinessTermsAcceptance` mechanism (`ENG-P3-002A`, `assertCurrentBusinessTermsAccepted`) — this disposition confirms that existing fail-closed, versioned acceptance architecture remains valid and is not weakened.

Forced scrolling (or another additional confirmation mechanism, such as a re-type-to-confirm field) is **not established as a global requirement** merely because the Legal Opinion (§3, "Requirements for Universal Enforceability," item 1) recommends it. It may be introduced where a specific jurisdiction's law requires it, or where future governance determines it materially improves enforceability for a specific instrument or audience — as a jurisdictional or instrument-specific overlay, not a platform-wide mechanism change.

**Reconciliation with the Legal Opinion §3:** the opinion's server-clock/UTC-timestamp and full-record (who/what-version/when/language) requirements are **already satisfied** by the existing acceptance architecture and are classified A (confirms existing position) in the Reconciliation Matrix. The forced-scrolling requirement is classified B (qualified — accepted as a jurisdiction-conditional option, not adopted globally).

---

## LEG-FD-04 — Reward Value Characterisation

**Disposition: APPROVED WITH CORRECTION TO THE LEGAL OPINION.**

Founder FD-6 (Legal Counsel Handoff Pack §3) is preserved without modification. Ordinary 11thONUS rewards: are benefits offered under the applicable Business Reward Program; are not money held by 11thONUS; are not bank deposits held by 11thONUS; are not e-money issued by 11thONUS; are not stored cash balances maintained by 11thONUS; and do not create a general cash-withdrawal entitlement from 11thONUS.

11thONUS does **not** adopt a blanket proposition that rewards have "no monetary value" or "no economic value." A reward may provide economic value. Unless the applicable governed Reward Program expressly provides otherwise, an ordinary reward is not redeemable for cash. Any future gift card, stored-value, cash-equivalent, or separately regulated instrument remains outside this decision and requires separate governance/legal assessment.

**Reconciliation with the Legal Opinion §4 and §19:** the opinion's required disclosure language in multiple places asserts rewards "have no monetary/cash value" (§4) and recommends the disclosure "Rewards have no cash value" (§19, disclosure 2) — this specific phrasing is **not adopted** (classified E in the Reconciliation Matrix — conflicts with FD-6/this disposition, expressly reconciled). The correct, adopted phrasing follows FD-6: rewards are not cash/bank deposits/e-money/stored value and are not redeemable for cash unless the Reward Program expressly states otherwise; a reward may still have economic value. The opinion's underlying regulatory-avoidance conclusion (this characterisation avoids triggering BRB/BNR e-money or payments licensing) is **retained** as useful legal input (classified A/B — the *conclusion* that this characterization avoids financial-instrument licensing is accepted; the *"no economic value"* framing used to reach it is corrected).

---

## LEG-FD-05 — Programme-Change Notice

**Disposition: APPROVED — reasonable-notice standard, not a universal fixed period.**

Counsel's proposed 30-day period (Legal Opinion §6) is **not established as a universal platform rule.** Businesses must provide reasonable advance notice of material adverse prospective Reward Program changes where notice is applicable. The exact timing may derive from: (1) mandatory applicable law; (2) applicable Reward Program terms; or (3) a future governed 11thONUS minimum standard (not yet set).

Founder FD-5 (already governed) is unaffected and reaffirmed: already-earned rewards cannot be retrospectively removed or materially reduced through a later programme change; a change applies only prospectively.

**Reconciliation:** classified B — the opinion's *retrospective-prohibition* conclusion (§6) is confirmed (matches FD-5 exactly); the opinion's specific *30-day* figure is not adopted as a global rule (classified D — a candidate future minimum-standard recommendation, not decided here).

---

## LEG-FD-06 — Suspension Process

**Disposition: APPROVED — principle, not universal fixed periods.**

11thONUS does **not** globally adopt the Legal Opinion's proposed fixed periods: 7-day standard-suspension notice, 24-hour emergency-suspension written-justification deadline, 48-hour customer notice, or 14-day payment-cure period (Legal Opinion §5, §18) — unless separately established by mandatory law or future governance.

**Portable rule:** ordinary suspension should receive reasonable notice and an opportunity to remedy where appropriate. Immediate suspension may occur where reasonably necessary for fraud, security, integrity, participant protection, legal/regulatory requirements, or comparable urgent circumstances. The Business should receive notice of the reason and the applicable review/remediation process as soon as reasonably practicable, subject to legal/security restrictions. Commercial/subscription suspension remains subject to separately governed commercial/subscription processes (`DEC-SUB-*`, not resolved here).

Founder FD-4 and `DEC-LOY-011` (both already CONFIRMED/governed) are preserved exactly as recorded — this disposition adds no new suspension ground and does not reopen either.

**Reconciliation:** classified B for the suspension-grounds catalogue (fraud, security, regulatory non-compliance, Terms breach, harm to platform integrity/participants, legal requirement — Legal Opinion §18 table — these read as consistent illustrations of FD-4's "trust/security/integrity/compliance" language and are accepted as a non-exhaustive descriptive list, not a new exhaustive ground catalogue); classified D/not-adopted for the specific numeric periods (7/24/48/14 days-or-hours).

---

## LEG-FD-07 — Business Exit / Run-Off

**Disposition: APPROVED WITH QUALIFICATION — no universal mandatory 60-day run-off period.**

**Portable rule:** a Business exiting 11thONUS remains responsible for validly earned outstanding rewards. A reasonable transition/run-off arrangement must be provided where necessary to enable fulfilment. Appropriate treatment may depend on the applicable Reward Program, the nature of the reward, previously disclosed validity/expiry terms, Business circumstances, applicable law, and practical fulfilment mechanisms. No universal period is invented by this disposition.

Founder FD-3 (already governed) is unaffected and reaffirmed: exit does not automatically extinguish earned customer rewards; the Business remains responsible; 11thONUS is not the guarantor or fulfiller.

**Reconciliation:** classified B — the opinion's "exit does not extinguish earned rewards" conclusion (§7) is confirmed (matches FD-3); the "mandatory 60-day Redemption Run-Off Phase" specific mechanism is **not adopted** as a universal rule (classified D — a candidate operational mechanism for future governance to consider, not decided here).

---

## LEG-FD-08 — Cash Settlement on Exit

**Disposition: LEGAL OPINION RECOMMENDATION NOT ADOPTED AS A GLOBAL RULE.**

11thONUS does not establish mandatory cash conversion merely because a Business exits the platform or ceases operating. **Portable rule:** Business exit does not extinguish validly earned obligations. Fulfilment occurs according to the applicable Reward Program and applicable law. Where original fulfilment becomes impossible, an appropriate alternative remedy may be required by applicable law or agreed with the customer — cash compensation may therefore be a possible remedy in some circumstances, but it is not a universal 11thONUS requirement. **11thONUS does not become responsible for funding that remedy.**

**Reconciliation:** classified E — the Legal Opinion §7's "the merchant is legally liable to convert unredeemed valid rewards into direct monetary refunds" recommendation is a plausible remedy in some circumstances but is **expressly not adopted as a universal mandatory rule**, and the opinion's own disclaimer that "11thONUS disclaims all liability for merchant default during this phase" is retained/confirmed (classified A) — 11thONUS is not the funder of any exit remedy.

---

## LEG-FD-09 — Customer Data Characterisation

**Disposition: LEGAL OPINION QUALIFIED.**

11thONUS does **not** adopt the proposition that customers provide personal data to 11thONUS as contractual consideration, or that customers generally "license their data" in exchange for platform access. **Controlled position:** 11thONUS processes personal data under the applicable lawful basis and privacy framework required to provide, secure, and operate the platform. Terms of Use and privacy/data-processing instruments may interact but perform different legal functions — one governs platform usage rules, the other governs data processing. The complete privacy architecture is **not** resolved through `DEC-LEGAL-002` by this disposition; it remains governed separately (`DEC-LEGAL-001`, `EXT-LEG-001`), unless a future decision expressly brings it into scope.

**Reconciliation with the Legal Opinion §2:** the opinion characterizes the Platform–Customer relationship as a "Non-Monetary Software License and Data Processing Agreement" where "the consideration provided by the customer consists of their agreement to platform usage rules and the licensing of their data for transaction verification." The *data-as-consideration* framing is classified E (conflicts with the controlled position, expressly reconciled — not adopted). The opinion's separate conclusion that a direct Customer Terms/consent relationship with 11thONUS is required on a platform-access/terms-of-use basis (not a commercial-transaction basis) is classified A/B (confirms/qualifies — accepted, consistent with `DEC-PROD-004` and the existing Customer Terms architecture question raised in LEG-FD-10).

---

## LEG-FD-10 — Customer Terms Architecture

**Disposition: APPROVED IN PRINCIPLE.**

The differentiated legal-instrument architecture is recorded:

- **A. Core Business Terms** — the relationship between 11thONUS and a participating Business.
- **B. Customer Terms / Platform Terms of Use** — the direct relationship between 11thONUS and the customer for platform access/use.
- **C. Business Reward Program Rules** — Business-specific earning, reward, and redemption proposition/obligations, authored and controlled by each Business.
- **D. Jurisdictional Overlays** — mandatory or appropriate jurisdiction-specific additions/deviations applied to the relevant instrument (not a fifth freestanding document).

Final Customer Terms are **not drafted** by this task.

**Determination (per task instruction, this task's own call, not deferred):** Customer Terms constitute a **separate future governed work package**, distinct from the Business Terms component currently reprioritised by FD-1. This is consistent with the Legal Counsel Handoff Pack's own instrument model (§6, item 2, "conditional on counsel's answer to whether a direct relationship is legally required" — now answered affirmatively by the opinion §2, subject to LEG-FD-09's qualification of the *basis* of that relationship) and with `ENG-P3-002-DESIGN-001`'s own architecture, which already scoped Terms acceptance to the *Business* Terms only.

**Determination on Capability 3 blocking:** Customer Terms are **not** a Capability 3 blocker. Direct inspection of `CDR-001` §5 (Capability 3 entry) and `businessLifecycleCommand.ts`'s `assertCurrentBusinessTermsAccepted` confirms the actual, current, code-enforced Capability 3 blocker is the absence of a governed **Business** Terms version — no code path in the current business-onboarding flow gates on a Customer Terms acceptance. Existing authority does not require Customer Terms to block Capability 3, and this disposition does not manufacture such a requirement.

---

## LEG-FD-11 — Dispute Architecture

**Disposition: APPROVED AT PRINCIPLE LEVEL.**

- **Business ↔ 11thONUS:** contractual escalation → good-faith resolution/mediation where useful → an agreed arbitration/court mechanism established in the applicable Business Terms.
- **Customer ↔ Business:** primarily the Business's responsibility for Reward Program obligations. 11thONUS may facilitate/escalate platform-related reward disputes without becoming the underlying reward obligor.
- **Customer ↔ 11thONUS:** platform complaint mechanism → applicable external/legal remedies. Mandatory customer rights to local courts/regulators remain unaffected.

**Not decided by this disposition:** the final arbitration seat, rules, or forum (Legal Opinion §8/§13 proposes Kigali/KIAC/OHADA/ICC — these are candidate inputs, not adopted). Exact forum mechanics are legal-drafting/jurisdictional-implementation detail requiring separate Founder/legal-drafting authority at the time the disputes clause is actually drafted — see the [Terms Drafting Readiness Note](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md) and the Resolution Assessment for why this remains the single concrete Founder decision gating full Terms drafting.

**Reconciliation:** classified A for the three-tier relationship architecture (matches the opinion's own dispute-allocation table in substance); classified F for the specific forum/seat/rules selection (belongs to a future, narrower Founder decision, not this reconciliation).

---

## LEG-FD-12 — Complaint Handling

**Disposition: APPROVED.**

11thONUS must maintain an accessible complaint/escalation mechanism for platform-related issues. For Business Reward Program disputes, the Business remains the primary responsible party. 11thONUS may receive a complaint, preserve relevant platform evidence, route/escalate it, facilitate resolution, and take appropriate platform-governance action. This does not make 11thONUS the merchant, the reward fulfiller, the reward guarantor, or the universal adjudicator of Business/customer disputes.

No fixed response SLAs are adopted unless mandatory law or separate governance establishes them.

**Reconciliation:** classified B — the opinion's complaint-mechanism recommendations (§8, §16) are accepted at the principle level; no specific timeline (e.g., "response timelines" in the opinion's §16 table) is adopted without a source.

---

## LEG-FD-13 — Terms Changes / Reacceptance

**Disposition: APPROVED AT PRINCIPLE LEVEL.**

Material changes affecting rights or obligations require affirmative reacceptance where appropriate under applicable law/governance. Non-material/administrative changes may be communicated without necessarily requiring affirmative reacceptance, subject to applicable law. Counsel's 14-day period (Legal Opinion §15) is **not adopted as a universal rule.** Versioned acceptance and retrievable acceptance evidence (the existing `BusinessTermsAcceptance`/reset-to-not-accepted architecture) is preserved and confirmed sound.

**Determination:** the existing architecture already implements version-reset-forces-reacceptance (per `ENG-P3-002-DESIGN-001` §37 and `ENG-P3-002A`'s implementation) for the *initial* acceptance; a dedicated **reacceptance-on-Terms-change** implementation (what happens to an already-accepted Business when the governed Terms version later changes) has not yet been designed or authorized as an engineering package. This disposition determines that a **new, narrowly-scoped governed implementation decision** (not a reopening of `ENG-P3-002A`) is needed before that reacceptance behavior is engineered — this task does not create that decision item or authorize any implementation; it flags the need in the Resolution Assessment.

**Reconciliation:** classified A for the version-reset architecture assessment (opinion confirms it as "legally sound and superior to implied passive consent"); classified D for the specific 14-day banner-notice mechanism (a candidate future minimum standard, not decided here).

---

## LEG-FD-14 — B2B Dispute Resolution

**Disposition: APPROVED** (`DEC-LEGAL-002-FOUNDER-CLOSE-001`, 2026-08-29 — resolves the item LEG-FD-11 explicitly left open).

Business ↔ 11thONUS contractual disputes use: good-faith resolution → mediation where appropriate → binding arbitration if unresolved.

**Core Business Terms arbitration architecture:**

- **Seat:** Kigali, Rwanda.
- **Institution/rules:** Kigali International Arbitration Centre (KIAC).
- **Language:** English or French.

Jurisdictional overlays may modify this architecture where mandatory applicable law requires a different mechanism for a specific jurisdiction's Business Terms addendum — this is the Layer 2 overlay mechanism already described in the Terms Drafting Readiness Note §1, not an exception invented here.

**Scope boundary:** this disposition applies only to Business ↔ 11thONUS contractual disputes. It does **not** impose the same arbitration architecture on customer disputes — Customer ↔ 11thONUS and Customer ↔ Business dispute treatment remains governed by LEG-FD-11's existing principle-level architecture (platform complaint mechanism → applicable external/legal remedies; mandatory customer rights to local courts/regulators unaffected). No mandatory consumer arbitration is introduced by this disposition.

**What is deliberately not decided here:** additional procedural periods (e.g., a time limit for bringing a claim), cost-allocation mechanics, the number of arbitrators, or other arbitration procedural detail beyond seat/institution/language. The Legal Opinion (§13) raises these as possible drafting elements ("clear cost allocation," "time limits for claims"), but none is already supported by governed authority at a specific value, so none is invented here — they are left to the controlled Terms-drafting stage, where KIAC's own default procedural rules will supply defaults unless the drafted clause displaces them.

**Reconciliation with the Legal Opinion §8/§13:** Reconciliation Matrix rows 8 and 13 (previously classified F — deferred) are now resolved and reclassified. The opinion's own recommendation (Kigali/KIAC seat, English/French, arbitration for B2B) is adopted; the opinion's further proposal of an explicit "clear opt-out" for the arbitration clause, and its Customer-Terms-side "no mandatory arbitration" position, are both already consistent with this disposition's scope boundary and require no separate action.

---

## LEG-FD-15 — Liability Architecture

**Disposition: APPROVED WITH JURISDICTIONAL/LEGAL QUALIFICATION** (`DEC-LEGAL-002-FOUNDER-CLOSE-001`, 2026-08-29 — resolves the Liability item Reconciliation Matrix row 9 had left open).

**Business claims.** Subject to applicable law and non-excludable liability, the aggregate direct contractual liability of 11thONUS to a Business is capped at the total fees actually paid by that Business to 11thONUS during the 12 months immediately preceding the event giving rise to the claim.

**Zero-fee Businesses.** No nominal or arbitrary monetary cap is invented for a free, complimentary, or pilot Business that has paid no fees during that period (a strict application of the fees-paid formula would produce a cap of zero, which this disposition does not attempt to correct with an invented substitute figure). Appropriate treatment for a zero-fee arrangement is left to final legal drafting and/or future commercial governance (potentially engaging `DEC-SUB-013`, Complimentary/free plans policy, itself unresolved and untouched by this disposition) — not decided or estimated here.

**Customer claims.** Counsel's suggested nominal "$25 USD / BIF equivalent" global cap (Legal Opinion §9) is **not adopted**. Portable principle: 11thONUS liability to customers is limited to the maximum extent permitted by applicable law, subject to mandatory consumer rights and jurisdiction-specific requirements — no invented fixed-currency figure is substituted for that legal-drafting judgment.

**Separation of liability preserved.** Liability attributable to 11thONUS (platform operation, its own conduct) remains distinct from Business Reward Program/fulfilment liability, which belongs to the Business — consistent with FD-2/FD-3/FD-6 and LEG-FD-04's existing "11thONUS is not the guarantor or fulfiller" position. This disposition does not merge the two.

**Mandatory-law boundary.** No limitation or exclusion of liability adopted under this disposition purports to override a liability that applicable law does not permit the parties to exclude or limit (e.g., liability for fraud, wilful misconduct, gross negligence, death or personal injury, or a non-excludable statutory consumer warranty — Legal Opinion §11's own "Prohibited Exclusions" table is accepted as jurisdiction-specific legal input on this exact point, Reconciliation Matrix row 11, classification C, unaffected by this disposition). The standard qualifying phrase "to the maximum extent permitted by applicable law" is preserved as the intended drafting pattern for every limitation/exclusion clause — this disposition does not authorize turning counsel's recommendations into broader exclusions than applicable law permits.

**Reconciliation with the Legal Opinion §9:** Reconciliation Matrix row 9 (previously classified D — open) is now resolved and reclassified. The opinion's 12-month-fees Business cap structure is adopted; its nominal fixed-amount customer cap is **not** adopted (reclassified in part to E — conflicts with the portable "maximum extent permitted by applicable law" principle, expressly reconciled); its indirect/consequential/punitive/special-damages disclaimer structure and its Rwanda/Burundi jurisdiction-specific liability notes (notice-and-takedown, ARCT obligations) remain accepted as drafting/jurisdictional input, unaffected.

---

## Cross-Cutting Notes

- No LEG-FD item above authorizes any Terms configuration, Terms drafting, application/source change, or Firebase/configuration change. All are docs-only governance positions.
- No LEG-FD item reopens FD-1–FD-7 or `DEC-LOY-011`. Where overlap exists, the earlier disposition is the controlling substantive rule; the LEG-FD item adds only the legal-form qualification prompted by the opinion.
- Subscription boundary (Legal Opinion §20) is addressed separately — see the Reconciliation Matrix row 20 and the Terms Drafting Readiness Note §"Subscription Boundary." No `DEC-SUB-*` status is changed by this record.
- LEG-FD-14/15 (v2.0, `DEC-LEGAL-002-FOUNDER-CLOSE-001`) resolve the two items this record's v1.0 left open (dispute forum/seat/rules; liability caps), bringing Core Business Terms drafting readiness to 16/16 sections at the architecture/decision level — see the Terms Drafting Readiness Note. This does not itself draft, approve, configure, or make effective any Terms content or version, and does not close `DEC-LEGAL-002`.
- No LEG-FD item invents an arbitrary customer liability cap, a universal 60-day run-off, a universal cash-settlement rule, or a Kirundi application-language requirement — each was considered and expressly declined (LEG-FD-15, LEG-FD-07, LEG-FD-08, LEG-FD-02 respectively).
