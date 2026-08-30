> **Title:** Business Terms Drafting Controlled Inputs Register — Parts I–II
> **Version:** 2.1 (2026-08-30 — Part II PR-review corrections applied; no new controlled input identified, task `DEC-LEGAL-002-BT-DRAFT-002-CORR-001`) · **Status:** Working (governance record — open drafting inputs) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002`
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-001` (v1.0); `DEC-LEGAL-002-BT-DRAFT-001-CORR-001` (v1.1 correction, Part I only); `DEC-LEGAL-002-BT-DRAFT-002` (v2.0 — Part II, no register change); `DEC-LEGAL-002-BT-DRAFT-002-CORR-001` (v2.1 — PR #204 review-finding corrections, no register change)
> **Governs:** [Core Business Terms — Draft](DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md), Part I (§§1–7) and Part II (§§8–10)

# Purpose

Every `[CONTROLLED INPUT REQUIRED: ...]` marker in the Core Business Terms draft (Part I) is catalogued here with a classification of what must happen before the marker can be resolved. This register exists so that no value is ever silently invented — each row states exactly what is missing and who must supply it.

# Part II review (task `DEC-LEGAL-002-BT-DRAFT-002`)

Part II (§§8–10) was drafted entirely on principle-based language already supported by existing authority (`ENG-P2-002`/`003`/`004`-DESIGN-001, `ENG-P3-002`-DESIGN-001, FD-4, LEG-FD-01, LEG-FD-06, and Part I §1.3/§5/§7.5 of this same instrument, cross-referenced not redrafted). No `[CONTROLLED INPUT REQUIRED: ...]` marker was needed in Part II, and no new controlled input is added to this register by this task. In particular:

- The Business-verification discretion clause (§8.7) is drafted from LEG-FD-01's general fallback interpretive standard (transparency, fairness, proportionality) precisely because no more specific verification SLA, criterion set, or automatic-approval rule exists in any reviewed authority — this is treated as a case where the general standard is sufficient to draft a discretion clause, not as a gap requiring a new controlled input, consistent with the Terms Drafting Readiness Note's own "Ready" classification for this readiness-table row (`ENG-P3-002` onboarding architecture).
- The Prohibited Conduct catalogue (§10.1) is drafted from FD-4's suspension-grounds language and LEG-FD-06's non-exhaustive platform-integrity descriptive list, consistent with the readiness table's own basis for rating this row **Ready** ("Existing platform-integrity principles; no new item raised") — not a new Founder product position on fraud/abuse policy. This is a narrower use of that authority than a freestanding fraud/abuse policy would be, and is not read as resolving the separate, still-open question (noted in the Legal Counsel Handoff Pack) of a dedicated fraud/abuse product policy — that question remains unresolved and is not created or closed as a controlled input by this task, because Part II's §10 does not purport to be that policy; it is a Terms-level prohibited-conduct clause only.
- The Staff-access-management clause (§9.5) deliberately uses durable, mechanism-agnostic language ("using the mechanisms the platform makes available for that purpose from time to time") rather than asserting that role-change, member-removal, or invitation-resend functionality is currently available, because current UI/callable implementation (per the ENG-P3-002-UI-IMP-F Team Management UI report) is narrower than the full architecture `ENG-P2-003`-DESIGN-001 designed. This drafting choice avoids creating a controlled input, since the clause does not depend on which specific staff-management features are live at any given time.

# Part II PR-review correction pass (task `DEC-LEGAL-002-BT-DRAFT-002-CORR-001`)

Four PR #204 review findings (Codex, all P2) were corrected in place — see the Part II Correction Report for the full disposition of each. None of the four corrections created a new controlled input:

- **Verification-outcome finding:** the corrected §8.6–§8.8 removes the invented approve/decline/restrict outcome architecture entirely, stating only that verification/participation requirements are separately governed and not created by this instrument (per `ENG-P3-002-DESIGN-001`'s explicit "must not be invented" finding on the `pending_verification → trial` mechanism). Part II remains completely draftable without resolving that mechanism — no controlled input was needed, and none is added.
- **Business Owner/Authorized Representative finding:** resolved by adding a new "Authorized Representative" definition and correcting §9.1/§9.3/§2 to keep the two concepts distinct, using existing `ENG-P2-002-DESIGN-001` §7 architecture and Part I §1.3/§7.5 (both already governed). No new Founder or legal position was required.
- **Onboarding-exclusion finding:** resolved by removing the self-defeating "onboarding requirements... expressly provide otherwise" exception from §8.3 and requiring separate governance/authorization to change the four exclusions. This is a drafting-discipline correction, not a new open question.
- **Stale-scope-label finding:** an administrative consistency correction only (three statements corrected); no controlled input is implicated.

# Register — remaining open controlled inputs

Only two controlled inputs remain open across Parts I–II after the correction pass, the Part II review, and the Part II PR-review correction pass. Both were already open before Part II and are genuinely unresolved matters, not newly created gaps.

| ID | Marker location | What is missing | Classification | Who must resolve it |
|---|---|---|---|---|
| CI-01 | Preamble | Operator's registered legal name, registration/company number, and registered address | **Required before Founder approval** and **required before legal approval** | Founder (must confirm the operating legal entity) and legal counsel (must confirm the entity is correctly named/registered for the jurisdiction(s) of operation) |
| CI-05 | §7.4 (cross-reference only; the marker itself lives in the LEG-FD-13 reacceptance-on-change gap, not restated as a literal bracket in the clause text since §7.4 already states the mechanism is not specified here) | The reacceptance-on-Terms-change engineering implementation decision (what technically happens when an already-accepted Business faces a new Terms version) | **Required before Terms configuration** | Engineering + Founder, via a new narrowly-scoped governed decision per LEG-FD-13's own determination — not this task's to create |

# Resolved this correction pass (`DEC-LEGAL-002-BT-DRAFT-001-CORR-001`)

The following four inputs were resolved by Founder disposition during the correction pass. Each resolution is conservative (does not invent a new product capability) and is now reflected directly in the draft's clause text rather than as a bracketed marker.

| Former ID | Former marker location | How resolved | Governing disposition |
|---|---|---|---|
| CI-02 | §1.2 | These Terms bind only the legal entity or sole proprietor registered as the Business; an affiliate, related company, franchisee, or other separate legal person is not automatically a party absent express 11thONUS agreement under a governed arrangement. No multi-entity/franchise-group participation feature is created. | Founder correction disposition, `DEC-LEGAL-002-BT-DRAFT-001-CORR-001` |
| CI-03 | §3.3 | The jurisdiction architecture is confirmed: a single portable Core Business Terms text (Layer 1), supplemented — not redefined — by jurisdictional overlays/addenda (Layer 2). 11thONUS may present a consolidated/localized rendering for accessibility without changing the underlying architecture. | LEG-FD-01/LEG-FD-10; Terms Drafting Readiness Note §1 (three-layer model); Founder correction disposition |
| CI-04 | §4.4 | Removed from Part I entirely — no service-tier differentiation is currently governed. The Core Terms govern participation generally; any future commercial/service differentiation belongs to §18 (Subscription and Fees) and relevant `DEC-SUB-*` governance, not invented here. | Founder correction disposition, `DEC-LEGAL-002-BT-DRAFT-001-CORR-001` |
| CI-06 | §7.5 | Resolved conservatively: initial acceptance may be made by the registering Business Owner or another individual with authority to bind the Business (§1.3); ordinary staff/platform permissions do not themselves confer Terms-acceptance authority; any future delegated-acceptance capability requires explicit governance/authorization. | Founder correction disposition, `DEC-LEGAL-002-BT-DRAFT-001-CORR-001`, reconciled with §1.3/§7 |

None of these four resolutions invents a `DEC-SUB-*` value, a multi-entity product feature, a service tier, or a delegated-acceptance capability — each states a conservative default or an architecture already established by existing authority (LEG-FD-01/LEG-FD-10/the three-layer jurisdiction model). See the [Correction Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-CORR-001-correction-report-2026-08-30.md) for the full disposition record.

# Classification key

- **Required before Founder approval** — the Founder must supply a product/commercial position before this clause can be finalized, independent of legal review.
- **Required before legal approval** — legal counsel must supply an opinion or confirm sufficiency before this clause can be finalized, independent of Founder input.
- **Required before Terms configuration** — the input is not needed to finalize clause wording, but must exist before a Terms version referencing this clause can be assigned/configured in `platformConfig/businessTerms`.
- **Jurisdiction-overlay input** — the input is expected to be supplied differently per jurisdiction, via the overlay mechanism (§26 of the draft), not as a single global value.
- **Future commercial input** — the input depends on an unresolved `DEC-SUB-*` or other commercial decision not yet reached.

# Cross-reference note

No row in this register duplicates a prohibited-concept item from the governing task's §6 boundary list (30-day notice, 60-day run-off, mandatory cash settlement, fixed suspension/cure periods, forced scrolling, Kirundi as a core language, data-as-consideration, arbitrary liability caps, `DEC-SUB-*` values, plan/price/billing mechanics, gift-card rules, `DEC-ID-005`/`DEC-LOY-009` resolution, or multiple-unredeemed-rewards rules) — none of those concepts appear in Part I of the draft at all, drafted or as a placeholder, because Part I does not reach those subject areas (they belong to Parts III, IV, V, and VI, none of which are drafted in this task). See the [Part I Drafting Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md) §14 for the actual text-search confirming this.

Part II carries the same discipline for its own governing task's boundary list (Team during establishment; Subscription Plan as onboarding requirement; Business Code as public/commercial identifier; unsupported multi-branch assumptions; invented KYC/KYB requirements; unsupported roles; staff Terms-acceptance authority; automatic verification approval; reward rules belonging to Part III; suspension mechanics belonging to Part IV; fixed notice/cure periods; `DEC-SUB-*`/`DEC-ID-005`/`DEC-LOY-009` resolution) — a direct `grep`-based search confirms none of these concepts appear in Part II. Business Code specifically was deliberately kept out of the contractual text entirely (not genuinely necessary to §8's eligibility/onboarding clauses), consistent with its governed internal/support-use-only status (`ENG-P2-002-DESIGN-001` §24). See the [Part II Drafting Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-drafting-report-2026-08-30.md) for the full search log.
