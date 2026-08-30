> **Title:** Business Terms Drafting Controlled Inputs Register — Part I
> **Version:** 1.0 · **Status:** Working (governance record — open drafting inputs) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002`
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-001`
> **Governs:** [Core Business Terms — Draft](DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md), Part I only (§§1–7)

# Purpose

Every `[CONTROLLED INPUT REQUIRED: ...]` marker in the Core Business Terms draft (Part I) is catalogued here with a classification of what must happen before the marker can be resolved. This register exists so that no value is ever silently invented — each row states exactly what is missing and who must supply it.

# Register

| ID | Marker location | What is missing | Classification | Who must resolve it |
|---|---|---|---|---|
| CI-01 | Preamble | Operator's registered legal name, registration/company number, and registered address | **Required before Founder approval** and **required before legal approval** | Founder (must confirm the operating legal entity) and legal counsel (must confirm the entity is correctly named/registered for the jurisdiction(s) of operation) |
| CI-02 | §1.2 | Whether these Terms cover only the named registering entity or also its affiliates/related entities (multi-entity/franchise-group Business structures) | **Required before Founder approval** | Founder — no product position exists on multi-entity Business participation |
| CI-03 | §3.3 | Whether a single global Core Terms text is issued with jurisdictional overlays (the assumed model) or jurisdiction-specific Core Terms variants are issued directly | **Required before legal approval** | Legal counsel, once a first overlay (e.g., Burundi) is actually drafted and tested against this architecture |
| CI-04 | §4.4 | Whether platform service tiers or feature differentiation exist or are planned across Businesses | **Future commercial input** | Founder / commercial governance (a `DEC-SUB-*`-adjacent question, not yet raised as its own decision item) |
| CI-05 | §7.4 (cross-reference only; the marker itself lives in the LEG-FD-13 reacceptance-on-change gap, not restated as a literal bracket in the clause text since §7.4 already states the mechanism is not specified here) | The reacceptance-on-Terms-change engineering implementation decision (what technically happens when an already-accepted Business faces a new Terms version) | **Required before Terms configuration** | Engineering + Founder, via a new narrowly-scoped governed decision per LEG-FD-13's own determination — not this task's to create |
| CI-06 | §7.5 | Whether acceptance may be given only by the registering Business owner or also by an authorised staff member with delegated authority | **Required before legal approval** | Legal counsel (enforceability of a non-owner acceptance) and Founder (whether the product should support it) |

# Classification key

- **Required before Founder approval** — the Founder must supply a product/commercial position before this clause can be finalized, independent of legal review.
- **Required before legal approval** — legal counsel must supply an opinion or confirm sufficiency before this clause can be finalized, independent of Founder input.
- **Required before Terms configuration** — the input is not needed to finalize clause wording, but must exist before a Terms version referencing this clause can be assigned/configured in `platformConfig/businessTerms`.
- **Jurisdiction-overlay input** — the input is expected to be supplied differently per jurisdiction, via the overlay mechanism (§26 of the draft), not as a single global value.
- **Future commercial input** — the input depends on an unresolved `DEC-SUB-*` or other commercial decision not yet reached.

# Cross-reference note

No row in this register duplicates a prohibited-concept item from the governing task's §6 boundary list (30-day notice, 60-day run-off, mandatory cash settlement, fixed suspension/cure periods, forced scrolling, Kirundi as a core language, data-as-consideration, arbitrary liability caps, `DEC-SUB-*` values, plan/price/billing mechanics, gift-card rules, `DEC-ID-005`/`DEC-LOY-009` resolution, or multiple-unredeemed-rewards rules) — none of those concepts appear in Part I of the draft at all, drafted or as a placeholder, because Part I does not reach those subject areas (they belong to Parts III, IV, V, and VI, none of which are drafted in this task). See the [Drafting Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md) §14 for the actual text-search confirming this.
