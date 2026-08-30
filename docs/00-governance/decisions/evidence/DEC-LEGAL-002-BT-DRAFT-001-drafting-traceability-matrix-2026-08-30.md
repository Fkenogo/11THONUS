> **Title:** Business Terms Drafting Traceability Matrix — Part I
> **Version:** 1.0 · **Status:** Working (governance record — drafting traceability) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002`
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-001`
> **Governs:** [Core Business Terms — Draft](DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md), Part I only (§§1–7)

# Purpose

Every substantive clause in Part I of the Core Business Terms draft must be traceable to a governing authority. This matrix records that traceability at clause level. Per repository convention (confirmed by inspection: the Core Business Terms draft text itself does not embed internal decision-ID citations — LEG-FD-xx, FD-x, DEC-xxx-xxx strings do not appear inside the drafted clause text of comparable prior instruments), decision IDs are kept out of the contractual text itself and recorded here instead.

Legend — **Portable/Jurisdiction-dependent:** whether the clause is intended as portable Layer-1 language or is expected to vary by jurisdictional overlay. **External evidence:** whether the external Legal Opinion informed the clause (as accepted, qualified, or declined per the Reconciliation Matrix). **Unresolved input:** cross-reference to the Controlled Inputs Register where applicable.

| Clause | Purpose | Governing decision/document | Portable / Jurisdiction-dependent | External legal evidence informed clause? | Unresolved input (see Controlled Inputs Register) |
|---|---|---|---|---|---|
| Preamble | Identifies the two parties to the instrument; states scope boundary (does not govern Business↔customer relationship) | LEG-FD-10 (differentiated instrument architecture); Legal Counsel Handoff Pack §2 | Portable | Yes — opinion §2 informed the differentiated-relationship conclusion, qualified by LEG-FD-09 | CI-01 (operator legal identity) |
| §1.1 | Establishes contracting parties; Business acts through the registering entity | LEG-FD-01 (No-Agency characterisation) | Portable | Indirect (opinion's relationship characterisation reconciled by LEG-FD-01) | — |
| §1.2 | Flags unresolved multi-entity/affiliate scope question | No governing authority found — genuinely open | N/A | No | CI-02 (multi-entity/affiliate scope) |
| §1.3 | Accepting-individual authority representation | Legal Counsel Handoff Pack §2 (onboarding flow: owner completes registration); existing `ENG-P3-002` architecture (Business/Staff domain, referenced not re-litigated) | Portable | No | — |
| §1.4 | Effective date and duration tied to acceptance and (future) exit clause | LEG-FD-03 (acceptance); FD-3 (exit does not extinguish obligations, informing forward cross-reference only) | Portable | No | — |
| §2 (all definitions) | Minimum defined terms needed to read Part I | Terms Content Architecture (Phase J headings); Legal Counsel Handoff Pack §2 (factual product model) | Portable | No | — |
| §2 "Reward Program" | Defines Business-owned programme, not platform-owned | LEG-FD-10; FD-5; Legal Counsel Handoff Pack §2 governing principle ("platform standardises trust, not how businesses build customer relationships") | Portable | No | — |
| §2 "Customer" | Confirms customer is not a party to this instrument | LEG-FD-09 (data-as-consideration declined; platform-access relationship, if any, is separate); LEG-FD-10 | Portable | Yes — opinion §2's direct-relationship conclusion reconciled/qualified | — |
| §3.1 | Purpose statement — customer-verified loyalty platform, not generic SaaS, not a unified loyalty programme | Legal Counsel Handoff Pack §2 governing principle; LEG-FD-10 | Portable | No | — |
| §3.2 | Scope exclusions: Reward Program content, general Business/customer relationship, direct customer relationship | LEG-FD-10; §6 of this draft (cross-reference) | Portable | No | — |
| §3.3 | Flags unresolved question of single global Terms text vs. jurisdiction-issued Core Terms variants | Terms Drafting Readiness Note §1 (three-layer model assumes single portable Core Terms + overlays) — assumption, not tested | N/A | No | CI-03 (single-text-vs-variant assumption) |
| §4.1 | Describes platform infrastructure role (identity, catalogue, verification, reward-cycle mechanics) | Legal Counsel Handoff Pack §2 (factual product/relationship model) | Portable | No | — |
| §4.2 | Platform verifies but does not design Reward Program content | Legal Counsel Handoff Pack §2; LEG-FD-10; FD-5 | Portable | No | — |
| §4.3 | Platform not a party to Business↔customer transaction; does not supply underlying goods/services | Legal Counsel Handoff Pack §2; LEG-FD-01 (No-Agency) | Portable | No | — |
| §4.4 | Flags unresolved service-tier differentiation | No governing authority found | N/A | No | CI-04 (service-tier differentiation) |
| §5.1 | No partnership/joint venture/franchise/agency/employment | LEG-FD-01 (Governing Interpretation Principle, applied to relationship characterisation); Reconciliation Matrix row 1 | Portable | Yes — opinion's own relationship characterisation (§1 of opinion, reconciled) informed this clause | — |
| §5.2 | No authority to bind the other party absent express grant | LEG-FD-01 | Portable | No | — |
| §5.3 | Business responsible for its own operations, compliance, pricing, staff, tax | LEG-FD-01; Legal Counsel Handoff Pack §2 (what the platform does not control) | Portable | No | — |
| §5.4 | Platform does not control Business's commercial/programme decisions | LEG-FD-10; FD-5 | Portable | No | — |
| §6.1 | Business owns Reward Program and customer relationship; platform does not become shared programme | Legal Counsel Handoff Pack §2 governing principle (verbatim-sourced concept); LEG-FD-10 | Portable | No | — |
| §6.2 | Business responsible for Reward Program content/communication, subject to governed minimums (forward reference to un-drafted Parts) | FD-5 (prospective-only changes; no retrospective reduction — referenced, not drafted here); LEG-FD-05 | Portable | Yes (indirectly, via LEG-FD-05's reconciliation of opinion §6) | — |
| §6.3 | Customer not a party to this instrument; Customer Terms is a separate, undecided-in-scope instrument | LEG-FD-09; LEG-FD-10 | Portable | Yes — opinion §2, qualified per LEG-FD-09 | — |
| §6.4 | Platform does not author/endorse/guarantee Business's Reward Program content | Legal Counsel Handoff Pack §2; FD-2/FD-3 ("11thONUS is not the guarantor or fulfiller," referenced conceptually, full clause reserved for Part III) | Portable | No | — |
| §7.1 | Acceptance is a precondition to verification/participation | LEG-FD-03; existing `assertCurrentBusinessTermsAccepted` architecture (factual, per Terms Content Architecture Phase G — referenced, not re-implemented) | Portable | No | — |
| §7.2(a)–(e) | Portable acceptance standard: affirmative act, identifiable party, exact version, authoritative timestamp, retrievable Terms | LEG-FD-03 (verbatim five-element standard) | Portable | Yes — opinion §3's timestamp/record requirements confirmed already satisfied (Reconciliation Matrix, classified A) | — |
| §7.3 | No forced-scrolling/re-type-confirm as a platform-wide requirement; overlay may add one | LEG-FD-03 (forced scrolling classified B — jurisdiction-conditional option, not global) | Jurisdiction-dependent (the exception, not the rule) | Yes — opinion §3 item 1 declined as a global rule, reconciled | — |
| §7.4 | Prior acceptance does not carry over to a new Terms version; reacceptance mechanism is a forward reference, not drafted here | LEG-FD-13 (principle-level); Terms Content Architecture Phase G (existing version-reset-forces-reacceptance architecture, factual) | Portable | Yes — opinion's version-reset assessment confirmed (Reconciliation Matrix, classified A) | CI-05 (reacceptance-on-change engineering decision, separately gated per LEG-FD-13) |
| §7.5 | Flags unresolved question of whether delegated staff (not only the registering owner) may accept | No governing authority found — existing acceptance mechanism scoped to business-owner flow per Terms Content Architecture Phase G, but legal sufficiency of a staff-delegate acceptance not governed | N/A | No | CI-06 (delegated-staff acceptance authority) |
| §7.6 | 11thONUS retains acceptance records | LEG-FD-03; existing `BusinessTermsAcceptance` schema (factual, referenced not re-implemented) | Portable | No | — |
| Status Reaffirmation block | Confirms unchanged status of `DEC-LEGAL-002`, Capability 3, Terms configuration, `DEC-ID-005`, `DEC-LOY-009`, `DEC-SUB-*` | Task governing instructions §11; Decision Register; `CDR-001` §5 | N/A (governance banner, not contractual text) | No | — |

## Clauses removed or not drafted after traceability review

None of the drafted clauses (§§1–7) were removed during self-review — each traces to at least one governing authority or is explicitly marked as a controlled input where no authority exists. See the [Drafting Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md) §14 for the full clause-by-clause self-review and the prohibited-concept search results.

## Discrepancy note

§0.2 of the Core Business Terms draft records an observed discrepancy between the Terms Drafting Readiness Note's narrative "16 of 16 sections" conclusion and its own §3 table, which lists seventeen rows. This traceability matrix maps clauses against the authorities the readiness table cites for each row; it does not attempt to force the row count to sixteen, and does not treat the discrepancy as a contradiction of substance (every row is marked Ready).
