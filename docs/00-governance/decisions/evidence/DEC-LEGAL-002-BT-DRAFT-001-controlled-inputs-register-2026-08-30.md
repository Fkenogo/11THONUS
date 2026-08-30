> **Title:** Business Terms Drafting Controlled Inputs Register — Part I
> **Version:** 1.1 (2026-08-30 — corrected per Founder disposition, task `DEC-LEGAL-002-BT-DRAFT-001-CORR-001`: CI-02, CI-03, CI-04, and CI-06 resolved and moved below; CI-01 and CI-05 remain open) · **Status:** Working (governance record — open drafting inputs) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002`
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-001` (v1.0); `DEC-LEGAL-002-BT-DRAFT-001-CORR-001` (v1.1 correction)
> **Governs:** [Core Business Terms — Draft](DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md), Part I only (§§1–7)

# Purpose

Every `[CONTROLLED INPUT REQUIRED: ...]` marker in the Core Business Terms draft (Part I) is catalogued here with a classification of what must happen before the marker can be resolved. This register exists so that no value is ever silently invented — each row states exactly what is missing and who must supply it.

# Register — remaining open controlled inputs

Only two controlled inputs remain open in Part I after the correction pass. Both were already open before the correction and are genuinely unresolved matters, not newly created gaps.

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

No row in this register duplicates a prohibited-concept item from the governing task's §6 boundary list (30-day notice, 60-day run-off, mandatory cash settlement, fixed suspension/cure periods, forced scrolling, Kirundi as a core language, data-as-consideration, arbitrary liability caps, `DEC-SUB-*` values, plan/price/billing mechanics, gift-card rules, `DEC-ID-005`/`DEC-LOY-009` resolution, or multiple-unredeemed-rewards rules) — none of those concepts appear in Part I of the draft at all, drafted or as a placeholder, because Part I does not reach those subject areas (they belong to Parts III, IV, V, and VI, none of which are drafted in this task). See the [Drafting Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md) §14 for the actual text-search confirming this.
