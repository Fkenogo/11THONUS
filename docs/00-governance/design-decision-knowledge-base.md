> **Title:** 11thONUS Design Decision Knowledge Base
> **Version:** 1.0 · **Status:** Controlled reference · **Classification:** Working (governance record)
> **Governing document:** 11thONUS Platform Constitution
> **Source-of-truth path:** `docs/00-governance/design-decision-knowledge-base.md`
> **Last controlled update:** 2026-07-17 (Phase 7 — created)

# 11thONUS Design Decision Knowledge Base

## 1. Purpose

The [Decision Register](decisions/decision-register.md) records **what** was decided. This Knowledge Base records **why** — the reasoning, alternatives, and long-term implications behind the platform's most important, long-lived design decisions. It exists so that a future founder, engineer, or coding agent can understand the intent behind a rule, not just the rule itself, without having to re-derive it or guess.

This is not a new decision-making authority. Every entry below is sourced from content already approved in the Constitution, PRD, TRD, or Decision Register. Where documented rationale exists, it is cited and, where necessary, lightly synthesized from multiple approved sources — never invented. Where no rationale is documented anywhere in the suite, this is stated explicitly as a **documented gap**, not filled in.

## 2. How to Read an Entry

Each entry states: the Decision ID(s) it draws from (if any exist in the Decision Register), the topic, the context that made a decision necessary, the alternatives considered where documented, the final rationale in the founder's or governing document's own terms, the long-term implications of that choice, and the related documents where the decision is expressed operationally.

## 3. Entries

---

### 3.1 Verified Units

**Decision ID(s):** No dedicated DEC-ID; expressed as approved product foundation (PRD0 §12–13, Product Decision Register PD-006/PD-009).

**Topic:** Why loyalty progress is measured in discrete "Verified Units" rather than points, currency spend, or visit counts.

**Context:** Traditional loyalty platforms commonly use points systems, which the product philosophy (PRD0 §10.2, "Clarity, Not Points") identifies as abstract and confusing for the target market. The platform needed a progress unit simple enough for low-digital-literacy users to understand at a glance.

**Alternatives considered (where documented):** PRD0 does not document a formal point-system alternative being evaluated and rejected; the "Clarity, Not Points" principle states the chosen direction directly rather than recording a comparison.

**Final rationale:** Customers should clearly understand what they bought, how many qualifying purchases have been verified, how many remain, and when the next On Us item becomes available (PRD0 §10.2). A Verified Unit is one customer-verified qualifying purchase (or one qualifying item within a purchase, PRD0 §13.5) — a concrete, countable thing rather than an abstract balance. The MVP rule is ten verified paid units unlock one eligible On Us unit (PRD0 §13.1, PD-006).

**Long-term implications:** Every future Reward Program configuration (variable thresholds, tiered rewards, amount-based programs) must still resolve to something a customer can count and understand; OP-012 ("The Ledger Is the Source of Truth") means a displayed progress total is always a calculated representation of underlying verified records, never a manually adjustable balance.

**Related documents:** PRD0 §10.2, §12, §13; PRD4 (Customer-Verified Loyalty Engine); TRD10 (Firestore Data Architecture); [Requirements Traceability Matrix](requirements-traceability-matrix.md) (CVLE/FR-CVLE rows).

---

### 3.2 Universal Verification (Customer-Verified Loyalty)

**Decision ID(s):** No dedicated DEC-ID; this is the Constitution's Pillar Two and the PRD's Core Product Differentiator — treated as foundational, not a register decision.

**Topic:** Why every qualifying purchase, regardless of who records it, must be verified by the customer before it counts.

**Context:** PRD0 §7.3 (Trust Problem) documents the fraud and trust risks of merchant-recorded loyalty: staff may add fake purchases, owners may inflate records, customers may falsely claim missing purchases, and manual systems lack an audit trail.

**Alternatives considered (where documented):** None formally weighed in the documentation; the trust problem is presented and the dual-participation model is presented as the solution rather than one option among several.

**Final rationale:** "The business records the purchase. The customer verifies the purchase. The platform updates loyalty progress." (PRD0 §7.3). This is elevated to Constitution Pillar Two ("Customer verification shall remain the foundation of loyalty progression. The platform exists to create confidence, not merely to record purchases.") and to ONUS Principles OP-004 and OP-013: verification is required "regardless of whether a purchase was recorded by staff, a manager, a business owner, an integrated POS system, or a future API. No recorder is automatically trusted."

**Long-term implications:** Any future integration (POS, API, automated systems) inherits the same verification requirement — this is a structural constraint on all future data-entry paths, not a UI convenience that can be dropped for convenience or speed. It is the platform's primary trust differentiator against points-based or merchant-only competitors (PRD0 §12).

**Related documents:** Constitution Pillar Two; PRD0 §7.3, §11 (OP-004, OP-012, OP-013), §12; PRD5 (Purchase Verification); TRD12 (Security and Access Control).

---

### 3.3 Verified Commerce™ Positioning

**Decision ID(s):** No dedicated DEC-ID; Constitution Articles 1 and 4.

**Topic:** Why 11thONUS is positioned as the first product in a broader "Verified Commerce™" ecosystem rather than a standalone loyalty app.

**Context:** The Constitution frames 11thONUS's identity not merely as a loyalty tool but as the foundation of a longer-term commerce trust platform.

**Alternatives considered (where documented):** Not documented — no rejected alternative positioning is recorded.

**Final rationale:** "11thONUS is a Customer-Verified Loyalty Platform... The platform is designed to evolve into the broader Verified Commerce™ ecosystem while preserving its foundational principles" (Constitution Article 1). The vision: "To become Africa's most trusted platform for verified customer relationships by expanding from Verified Loyalty into the broader Verified Commerce™ ecosystem" (Constitution Article 4). This positioning is also the fourth Constitutional Question every feature must answer: "Does it align with the long-term Verified Commerce™ architecture?" (Constitution Part V).

**Long-term implications:** Every architectural and product decision is meant to be evaluated not only against MVP fit but against whether it forecloses or supports later expansion into broader verified-commerce capabilities (deferred features catalogued in TRD22 §22.6 and the Decision Register's DEC-FUT-* series are explicitly kept architecture-compatible with this future, e.g. DEC-FUT-002 customer wallet, DEC-FUT-003 gift cards).

**Related documents:** Constitution Articles 1, 4, Part V; TRD22 §22.6 (Deferred Features); Decision Register DEC-FUT-001..008.

---

### 3.4 Shared Loyalty Number

**Decision ID(s):** DEC-LOY-007 (CONFIRMED).

**Topic:** Why a registered customer's loyalty number may be quoted by friends or family, and why this does not create a shared account.

**Context:** PRD0 §7.2 identifies "multiple apps for different businesses" and fragmented loyalty identities as a customer problem; §11 (OP-005) establishes that a customer owns one platform identity. Real-world purchasing behaviour (a parent paying for children, a group ordering together) also required a documented fraud-control boundary (OP-011).

**Alternatives considered (where documented):** Not formally listed as competing options in the register entry; the confirmed position is stated directly, consistent with pre-existing PRD/TRD content (DEC-LOY-007's Founder decision required = No, meaning it was already settled in approved documents).

**Final rationale:** "Friends/family may quote the registered customer's loyalty number where the Reward Program permits (policy on program version); the Purchase Record attaches to the registered customer, who alone verifies; quoting never grants account access or authentication; no auto-account for the quoting person" (DEC-LOY-007). TRD23 §23.4 additionally documents the guardrails: the Reward Program's own policy controls whether this is allowed, customer verification remains mandatory regardless, no account is created for the friend or family member, and privacy is minimized.

**Long-term implications:** This is the documented boundary between "sharing a loyalty number" and "sharing an account" — any future feature (group rewards, family plans, gifting) must preserve the rule that quoting a number never transfers authentication authority or ownership (PRD1 §15.2).

**Related documents:** Decision Register DEC-LOY-007; PRD1 §15.2–15.3; PRD5 §11; TRD21 §21.41; TRD23 (Shared Loyalty Number Use).

---

### 3.5 Individual Purchase Rejection

**Decision ID(s):** DEC-LOY-010 (CONFIRMED, D0 freeze blocker).

**Topic:** Why customers reject purchases individually, one at a time with a specific reason, rather than in a single batch action.

**Context:** PRD0 §14.3 originally suggested customers could "reject selected purchases" (implying batch rejection), while TRD23 §23.13 required individual rejection with a record-specific reason — a direct PRD-vs-TRD contradiction that blocked the documentation freeze.

**Alternatives considered (documented in the register):** (a) individual-only rejection with a reason per record (the TRD position); (b) batch rejection with one shared reason; (c) batch rejection requiring per-record reasons (a hybrid).

**Final rationale:** "Customers reject purchases individually — never in batch. Every rejected purchase records its own reason. Rationale given: different purchases may have different rejection reasons." (DEC-LOY-010, approved by Founder, 16 July 2026). The recommendation basis cited in the register: "rejections need record-specific reasons; trust model favors deliberate rejection" (TRD23 §23.13).

**Long-term implications:** The verification UI and any future bulk-purchase-handling feature must always surface one rejection reason per record; a customer cannot dismiss multiple pending purchases with one undifferentiated action, which preserves the auditability principle (OP-007, "Nothing Commercial Is Silently Deleted") for every individual rejection.

**Related documents:** Decision Register DEC-LOY-010; PRD0 §14.3 (corrected Phase 3B); PRD1 §5.2 (corrected Phase 3B); TRD23 §23.13.

---

### 3.6 Purchase Amount as Reporting Metadata

**Decision ID(s):** DEC-DATA-003 (CONFIRMED, D0 freeze blocker).

**Topic:** Why Purchase Records carry optional monetary fields (Unit Value + Currency), and why those fields are explicitly barred from influencing loyalty mechanics.

**Context:** PRD5 §5 mandated optional Unit Value and Currency fields on Purchase Records; the TRD10 Firestore schema, as originally implemented, carried no monetary fields at all — a PRD-vs-TRD data-contract conflict. The register also notes that money-on-records raises a data-integrity rule (DA-015, integer minor-unit values) and privacy/minimization questions, and that purchase value is never used for loyalty math under either option.

**Alternatives considered (documented in the register):** (a) optional integer-minor-unit value + currency, explicitly non-authoritative and reporting-only; (b) no monetary fields in the MVP (correcting PRD5 §5 instead); (c) mandatory value fields.

**Final rationale:** "Purchase Records include optional monetary fields (Unit Value + Currency). These fields are reporting metadata only: money shall never influence Verified Units, Reward Program progression, Loyalty Cycles or reward eligibility, unless a future founder decision explicitly introduces amount-based Reward Programs. This rule is to be reflected consistently across affected documentation." (DEC-DATA-003, approved by Founder, 16 July 2026).

**Long-term implications:** This creates a deliberate, documented boundary: monetary data may power future reporting and analytics (TRD15) without ever becoming an authoritative input to the loyalty engine, unless a distinct, explicit future founder decision reopens that question. Any implementation that lets purchase amount silently affect Verified Unit counting or reward eligibility would violate this decision and require its own new register entry, not a quiet code change.

**Related documents:** Decision Register DEC-DATA-003; PRD5 §5; TRD10 §10.10.1 (Monetary Metadata Rule); TRD15 (Reporting and Analytics).

---

### 3.7 Firebase-First

**Decision ID(s):** PD-020 (Product Decision Register, PRD0 §24); operationalized without a dedicated DEC-ID.

**Topic:** Why the platform's initial technology direction is the Firebase ecosystem rather than a custom backend or another cloud platform.

**Context:** The platform needed a technology base capable of supporting a small/solo engineering team building for markets with intermittent connectivity and predominantly mobile usage.

**Alternatives considered (where documented):** Not formally recorded as a compared shortlist; TRD8 states the selection criteria that were applied rather than naming rejected platforms.

**Final rationale:** "Firebase is selected because it aligns with the principles established in the Platform Constitution: Serverless, Event-driven, Scalable, Secure, Mobile-first, Cloud-native." (TRD8 §8.1). This directly operationalizes Constitution CP-009 (Event-Driven by Design) and CP-012 (Security by Default), and PD-021 (mobile-first PWA).

**Long-term implications:** Every Firebase service is assigned a single clear responsibility (TRD8 §8.2) and the platform's whole data, security, and function architecture (TRD10–12) is built on Firebase primitives; moving off Firebase in the future would be a major architectural change requiring its own governance process, not an incremental substitution.

**Related documents:** PRD0 §24 (PD-020, PD-021); TRD8 (Firebase Platform Architecture); TRD9–12.

---

### 3.8 Burundi-First

**Decision ID(s):** PD-002, PD-003 (Product Decision Register, PRD0 §24).

**Topic:** Why Burundi is the initial launch market, with Rwanda, Uganda and Kenya as planned expansion markets.

**Context:** PRD0 §8.1 documents the operating conditions the platform must be designed for: cash-based businesses, mobile-money-based businesses, businesses without POS systems, basic smartphones, limited digital literacy, intermittent connectivity, multilingual environments, owner-managed SMEs, and informal staff structures.

**Alternatives considered (where documented):** Not recorded as a compared shortlist of candidate launch markets; Burundi is stated as the chosen starting point directly.

**Final rationale:** No single explanatory sentence beyond the market-context section is documented; PRD0 §8.1–8.2 establishes the market's operating constraints and the expansion sequence (Rwanda, Uganda, Kenya) that the architecture must remain configurable for (currencies, phone formats, mobile-money providers, subscription pricing, languages, business categories, tax/invoice requirements, payment providers). Constitution OP-010 ("Africa Is the Starting Point") states the broader strategic framing: "The platform must reflect real operating conditions in African markets."

**Long-term implications:** CP-010 (International by Design) exists specifically so that expansion beyond Burundi does not require redesign — every country-specific value (currency, tax rule, language, payment provider) must be configuration, not hardcoded assumption.

**Related documents:** PRD0 §8.1–8.2, §24 (PD-002, PD-003); Constitution OP-010, CP-010.

**Documented gap:** The specific commercial or strategic reasoning for choosing Burundi over another African market (e.g. market research, founder's local market access, competitive landscape) is not recorded anywhere in the documentation suite. This entry states the operating-conditions context that shaped the *product requirements*, not the market-selection rationale itself.

---

### 3.9 English/French MVP

**Decision ID(s):** No dedicated DEC-ID; expressed as an approved requirement (TRD13 CR-003).

**Topic:** Why English and French are the required launch languages, with Kirundi, Swahili and Kinyarwanda supported as fallback/extensible rather than launch-required.

**Context:** Burundi's market context (PRD0 §8.1, §8.2) requires multilingual support, and Constitution CP-010 (International by Design) requires languages to be configurable rather than hardcoded.

**Alternatives considered (where documented):** Not recorded as a compared list; TRD13 §13.2 states the chosen requirement directly: "English and French are supported for launch-critical experiences. Kirundi, Swahili and Kinyarwanda can be added without schema or code redesign."

**Final rationale:** "English and French shall be supported for launch-critical customer experiences" (TRD13 CR-003, §13.2, §13.15). The release pipeline validates required English keys for all launch-critical namespaces and required French completeness; missing required French translations block production release for affected customer-facing features (TRD13 §13.15). Local languages (Kirundi, Swahili, Kinyarwanda) may initially use English fallback until their required coverage level is separately approved.

**Long-term implications:** The localization architecture (three-layer language model — engineering language always English, customer-facing languages configurable) means adding a fully-required local language later is a coverage-level decision, not an architecture change.

**Related documents:** TRD13 §13.2, §13.3, §13.15; CR-003.

**Documented gap:** The specific reasoning for choosing English and French as the two launch-required languages (rather than, for example, Kirundi and French, which are Burundi's official languages) is not separately documented. The most plausible inference — French for the local/official market and English for the regional expansion markets (Rwanda, Uganda, Kenya) — is not stated explicitly anywhere in the suite and is disclosed here as inference, not as documented rationale.

---

### 3.10 Documentation-First Development

**Decision ID(s):** No dedicated DEC-ID; expressed through the structure and content of TRD22, TRD23, and the Decision Governance Workflow, and through the actual conduct of this documentation programme (Phases 1–7).

**Topic:** Why the platform's entire specification, governance, decision, and traceability apparatus was built and stabilized before any application code was written.

**Context:** Constitution CP-002 ("Architecture Before Features") establishes that platform architecture shall guide features, not the reverse. TRD22 requires a Requirements Traceability Matrix (§23.4) and a complete Engineering Standards document as pre-implementation deliverables (§22.10 references, `03-standards/engineering-standards/README.md`), and TRD22's Delivery Principles (DIP-002, "Foundations Before Features") require authentication, authorization, events, error handling and domain boundaries to be established before high-level UI expansion.

**Alternatives considered (where documented):** Not recorded as a compared list; the phased documentation programme itself (Phases 1 through 7, each gated on the completion and validation of the previous phase, per the [phase tracker](../05-implementation/change-tracking/documentation-phases.md)) is the applied instance of this principle, not a separately argued position.

**Final rationale:** The governance hierarchy (Constitution → PRD → TRD → Commerce Knowledge Standard → ... → Decision Register → Implementation Change Log, confirmed under DEC-GOV-001) and the requirement that coding agents "implement only against approved documents" (Decision Register §1, citing TC-011) together establish that implementation authority flows from completed, consistent documentation — never the reverse. TRD22 §22.41 (Phase Review Standard) states directly: "the next phase shall not begin merely because code exists" — the inverse of this principle applies equally before code exists: a documentation phase is not skipped merely because building would be faster without it.

**Long-term implications:** Every future engineering phase inherits this same discipline via the [Engineering Governance & Delivery Standards](../06-engineering-governance/README.md) suite (Phase 6): a coding agent's work package always cites a requirement ID, decision ID, or explicit founder instruction (Engineering Principles §4.1, "Cite, don't guess") rather than inventing scope.

**Related documents:** Constitution CP-002; TRD22 §22.8 (DIP-002), §22.41; Decision Register §1; [phase tracker](../05-implementation/change-tracking/documentation-phases.md); [Engineering Governance Charter](../06-engineering-governance/engineering-governance-charter.md).

---

### 3.11 AI-Assisted Engineering Governance

**Decision ID(s):** No dedicated DEC-ID; expressed through TRD22 §22.38–22.41 and the entire [Engineering Governance & Delivery Standards](../06-engineering-governance/README.md) suite (Phase 6), and through the actual conduct of this documentation programme, which was itself performed by an AI agent under founder instruction across Phases 1–7.

**Topic:** Why the platform's engineering process is explicitly designed around AI coding agents as first-class implementers, with governance (stop conditions, work-package standards, change tracking, phase review) built specifically for that collaboration model rather than assumed to be unnecessary or added later.

**Context:** TRD22 §22.38–22.41 defines an Implementation Work-Package Standard, Coding-Agent Change Tracking, Coding-Agent Stop Conditions, and a Phase Review Standard as core technical delivery requirements — not as an afterthought bolted onto a human-only process. The MVP Scope Protection Rule (TRD22 §22.7) explicitly warns against letting ease of AI implementation drive scope: "A capability shall not enter the MVP merely because... an AI coding agent can implement it quickly."

**Alternatives considered (where documented):** Not recorded as a compared list; the governance suite is written assuming AI-assisted delivery as the operating model from the outset, consistent with how this documentation programme itself was executed (an AI agent, under a named Founder's explicit phase-by-phase instructions, producing every artifact from the Phase 1 audit through this Phase 7 baseline).

**Final rationale:** The stop-and-report rule (TRD22 §22.40) exists precisely because an AI agent must have an explicit, non-negotiable mechanism for halting on ambiguity rather than guessing — "A coding agent shall stop and report rather than guess when required business behavior is ambiguous..." This is paired with strict scope discipline (§22.7, DIP-005 "No Temporary Architecture") so that agent implementation speed never substitutes for founder-approved scope. The [Engineering Governance Charter](../06-engineering-governance/engineering-governance-charter.md) formalizes this into a permanent operational handbook precisely because the collaboration model (Founder + ChatGPT Technical Lead + coding agents) is the platform's actual, ongoing engineering process, not a temporary bootstrap phase.

**Long-term implications:** Every future engineering phase — not just the documentation programme — is expected to run through the same AI-collaboration workflow (Founder → ChatGPT Technical Lead → Implementation Prompt → Coding Agent → ... → Phase Complete), meaning the stop-condition and review discipline is a permanent feature of how 11thONUS is built, not a constraint specific to the documentation phases.

**Related documents:** TRD22 §22.7, §22.38–22.41; [Engineering Governance & Delivery Standards](../06-engineering-governance/README.md) (all 11 documents); [phase tracker](../05-implementation/change-tracking/documentation-phases.md) (the record of this principle in practice, Phases 1–7).

---

## 4. Summary Table

| # | Topic | Primary Decision ID(s) | Rationale fully documented? |
|---|---|---|---|
| 3.1 | Verified Units | — (PD-006/009) | Yes |
| 3.2 | Universal Verification | — (Constitution Pillar Two) | Yes |
| 3.3 | Verified Commerce™ Positioning | — (Constitution Art. 1/4) | Yes |
| 3.4 | Shared Loyalty Number | DEC-LOY-007 | Yes |
| 3.5 | Individual Purchase Rejection | DEC-LOY-010 | Yes |
| 3.6 | Purchase Amount as Reporting Metadata | DEC-DATA-003 | Yes |
| 3.7 | Firebase-First | PD-020 | Yes |
| 3.8 | Burundi-First | PD-002/003 | Partial — operating-conditions context documented; market-selection rationale is a **documented gap** |
| 3.9 | English/French MVP | — (CR-003) | Partial — launch-language requirement documented; choice-of-these-two-languages rationale is a **documented gap** (inference disclosed, not asserted as fact) |
| 3.10 | Documentation-First Development | — (CP-002, TRD22 DIP-002) | Yes (via principle + demonstrated practice) |
| 3.11 | AI-Assisted Engineering Governance | — (TRD22 §22.38–22.41) | Yes (via principle + demonstrated practice) |

Two documented gaps are disclosed above (§3.8, §3.9) rather than filled with invented reasoning, per this document's founding instruction.

## 5. Maintenance

This Knowledge Base is a Working governance document, maintained the same way as every other: an addition or correction is logged in the [Documentation Changes Log](documentation-changes-log.md) and never used to resolve an open Decision Register entry as a side effect. New entries are added when a future decision reaches the same long-term, foundational significance as those above — not for every routine Decision Register entry.

## 6. Relationship to Other Governance Documents

- The [Decision Register](decisions/decision-register.md) remains the sole record of *what* was decided and its approval status.
- The [Requirements Traceability & Implementation Matrix](requirements-traceability-matrix.md) remains the sole record of *where* a requirement is implemented.
- This Knowledge Base sits alongside both as the record of *why*, for the small set of decisions with lasting architectural or strategic weight.
