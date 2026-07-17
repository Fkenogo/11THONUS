> **Title:** Engineering Transition D1 Decision Agenda
> **Version:** 1.0 · **Status:** Active governance record · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](decision-register.md); [Founder Decision Agenda](founder-decision-agenda.md)
> **Source-of-truth path:** `docs/00-governance/decisions/engineering-transition-d1-agenda.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 2 — DEC-TECH-003/004/006/007 confirmed; created Engineering Transition Phase 0A)

# Engineering Transition D1 Decision Agenda

## 1. Purpose and Scope

This is a **transition-focused companion agenda** to the [Founder Decision Agenda](founder-decision-agenda.md), covering only the 11 D1-priority decisions that affect TRD22 Phases 0–2 — the earliest engineering phases. It exists because these 11 decisions are scattered across the main agenda's Batches B–E alongside 13 lower-priority decisions; this document pulls them together in one place, in engineering-phase order, so the Founder, Engineering Lead, and providers can resolve exactly what blocks the start of engineering without reading the entire register.

**This document does not replace the Founder Decision Agenda** — it is a filtered, engineering-sequenced view of a subset of it. The Decision Register remains the sole authoritative record; where this agenda's wording and the register ever differ, the register governs. **No decision is approved by this document.**

## 2. How to Use This Agenda

Decisions are grouped by which engineering phase they block (Phase 0, 1, or 2), in the order engineering will actually reach them. For each: the plain-language question, why it matters now, the documented options and their consequences, any existing recommendation and its basis, who must provide input, which engineering phase and requirement IDs are affected, and — critically — what may proceed before the decision is made versus what must not.

## 3. Founder Decisions

### DEC-LOY-008 — Overflow Verified Unit allocation policy

- **Plain-language question:** When a customer's verified purchase pushes them past the 10-unit threshold in one go (e.g. they're at 8/10 and verify a purchase of 4), what happens to the 2 "extra" units — do they wait safely until the earned reward is redeemed, then apply to the next cycle?
- **Why it matters now:** This is flagged in the Founder Decision Agenda as **"the most important product decision" remaining** — it blocks all of TRD22 Phase 7 (Loyalty Progress and Reward Availability), the heart of the platform's core mechanic.
- **Current documented options:**
  - (a) **Documented default:** hold the 2 extra units as *pending allocation* until the reward is redeemed, then apply them chronologically to the next cycle.
  - (b) Immediately open the next cycle and apply the overflow — permits multiple stacked rewards (conflicts with DEC-LOY-002, already confirmed).
  - (c) Forfeit the overflow units — listed for completeness; conflicts with the trust principles OP-002/CP-001 and BR-046 (transparency).
- **Consequences:** (a) is simplest to explain to a customer and matches the "nothing you earned disappears" promise; (b) is more generous but risks businesses facing multiple simultaneous reward obligations; (c) breaks trust and is not seriously proposed.
- **Existing recommendation:** (a), the documented default. Basis: TRD11 §11.20–11.21; TRD23 §23.11; consolidation audit §8.3.
- **Founder input required:** Yes — sole decision owner.
- **Engineering proof required:** No — this is a product-policy choice, not a technical feasibility question.
- **Provider input required:** No.
- **Affected engineering phase:** Phase 7 (Loyalty Progress and Reward Availability) — blocks ENG-P7-002 and ENG-P7-003.
- **Affected requirement IDs:** BR-038, BR-040, BR-042, BR-043, CVLE-001, CVLE-002.
- **What may proceed before the decision:** Phases 0–6 in full (repository, Firebase foundation, identity, commerce knowledge, Reward Programs, purchase recording, verification) — none of these depend on the overflow rule. ENG-P7-001 (Verified Unit issuance and uniqueness) may also proceed, since it does not depend on the allocation policy.
- **What must not proceed before the decision:** Any implementation of Loyalty Cycle threshold-crossing logic, pending-unit representation, or the reconciliation job (ENG-P7-002, ENG-P7-003).

### DEC-ID-003 — Permission inheritance semantics

- **Plain-language question:** Two approved documents describe permission inheritance differently — PRD10 says "Owner inherits all Manager permissions; Manager inherits all Staff," while PRD1 describes explicit, configurable grants per membership. How do these combine into one algorithm an engineer can actually build?
- **Why it matters now:** Blocks all authorization implementation in TRD22 Phase 2 — without one resolved algorithm, every future permission check risks being built inconsistently.
- **Current documented options:**
  - (a) **Audit-recommended reconciliation:** inheritance defines the *default template*; explicit per-membership grants/revocations override it; sensitive permissions are never granted implicitly.
  - (b) Strict inheritance only (no per-membership override).
  - (c) No inheritance — explicit grants only for every membership.
- **Consequences:** (a) reconciles both PRD sections and matches TRD12 §12.11's permission-resolution model already written; (b) is simpler but contradicts PRD1's explicit-grant language; (c) is the most flexible but the most setup-heavy for every business.
- **Existing recommendation:** (a). Basis: reconciles both source texts; aligns with TRD12 §12.11.
- **Founder input required:** Yes, with Engineering — joint decision owner.
- **Engineering proof required:** Light — confirming (a) is implementable as described in TRD12 §12.11.
- **Provider input required:** No.
- **Affected engineering phase:** Phase 2 (Identity, Roles and Business Context) — blocks ENG-P2-004.
- **Affected requirement IDs:** AP-006, AP-008, BR-003, BR-011, FR-AUTHZ-001.
- **What may proceed before the decision:** ENG-P2-001/002/003 (customer, business, and staff identity records themselves) — creating the identity records does not require the permission-resolution algorithm to be settled.
- **What must not proceed before the decision:** ENG-P2-004 (role context and permission resolution) — and, transitively, nothing in Phase 3 onward that depends on authorization checks.

## 4. Engineering Decisions

### DEC-SEC-001 — Customer authentication approach and fallback

- **Plain-language question:** Firebase phone OTP is already approved as the primary way customers log in. What happens if OTP delivery to a Burundi number proves unreliable or too costly — what is the fallback (email link, password + recovery, assisted registration)?
- **Why it matters now:** Blocks customer registration in Phase 2 — without a defined fallback, registration has no answer for the case OTP delivery fails.
- **Current documented options:** (a) Firebase phone OTP + email fallback; (b) OTP via external SMS provider + custom auth; (c) password-based with phone verification.
- **Consequences:** (a) keeps Firebase-native simplicity with a lightweight fallback; (b) adds provider dependency and cost but may improve Burundi deliverability; (c) is the most complex to build and furthest from the approved phone-primary direction.
- **Existing recommendation:** (a), pending proof. Basis: PRD10 §15; TRD12 §12.4.
- **Founder input required:** Countersign only — Engineering Lead is the decision owner.
- **Engineering proof required:** Yes — Burundi OTP delivery feasibility, cost, and abuse-control proof (tracked as EXT-TECH-001 in the External Dependencies Register).
- **Provider input required:** Yes — tied to DEC-PROV-004 (phone OTP delivery route).
- **Affected engineering phase:** Phase 2 (Identity, Roles and Business Context) — blocks ENG-P2-001.
- **Affected requirement IDs:** AP-005, BR-005, BR-006, PR-005.
- **What may proceed before the decision:** Phase 0 and Phase 1 in full; Phase 2 business/staff identity work packages that do not depend on the customer authentication route (ENG-P2-002/003 can be designed, though customer-flow-dependent testing will wait).
- **What must not proceed before the decision:** ENG-P2-001 (customer identity, which is the authentication entry point itself).

### DEC-TECH-003 — Frontend tooling set

- **Plain-language question:** React + TypeScript is already approved (DEC-TECH-002, confirmed). What specific build tool, router, server-state library, form library, component foundation, PWA tooling, and test libraries will be used on top of that?
- **Why it matters now:** Blocks Phase 0 completion — the repository scaffold cannot be built without knowing what to scaffold.
- **Current documented options:** Proposed by engineering (per OTD-001) and confirmed — see below.
- **Existing recommendation:** **Update (Engineering Decision Sprint 2, 2026-07-17): CONFIRMED** — see the [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](dec-tech-003-engineering-stack-recommendation.md) (Vite, React Router, TanStack Query, React Hook Form + Zod, shadcn/ui + Tailwind, and the full supporting toolchain). This decision is resolved in the live Decision Register; it no longer blocks Phase 0.
- **Founder input required:** No — informed only; Engineering Lead is the decision owner.
- **Engineering proof required:** Yes — this is fundamentally a technical selection.
- **Provider input required:** No.
- **Affected engineering phase:** Phase 0 (Repository and Delivery Foundation) — blocks ENG-P0-001.
- **Affected requirement IDs:** IM-006, IM-007, FR-OPS-004 (indirectly, via the resulting Engineering Standards).
- **What may proceed before the decision:** Nothing engineering-side — this is the first technical decision in the entire sequence, required by Phase 0 itself.
- **What must not proceed before the decision:** Repository scaffolding, any frontend code.

### DEC-TECH-004 — Repository structure (monorepo recommended)

- **Plain-language question:** Should frontend and Cloud Functions code (with shared types) live in one repository (monorepo) or separate repositories?
- **Why it matters now:** Blocks repository initialization itself — this is literally the first structural choice of Phase 0.
- **Current documented options:** (a) monorepo (TRD-recommended); (b) separate repositories.
- **Existing recommendation:** (a). Basis: OTD-002 — "recommends a shared repository or monorepo for strong type and contract reuse." **Update (Engineering Decision Sprint 2, 2026-07-17): CONFIRMED.** This decision is resolved in the live Decision Register; it no longer blocks Phase 0.
- **Founder input required:** No — Engineering Lead is the decision owner.
- **Engineering proof required:** Light — confirming tooling supports the chosen structure.
- **Provider input required:** No.
- **Affected engineering phase:** Phase 0 (Repository and Delivery Foundation) — blocks both ENG-P0-001 and ENG-P0-002.
- **Affected requirement IDs:** IM-007 (via TRD22 Phase 0 and future Engineering Standards).
- **What may proceed before the decision:** Nothing — repository initialization cannot begin without this.
- **What must not proceed before the decision:** Repository creation.

### DEC-TECH-005 — Firebase region

- **Plain-language question:** Which Firebase/GCP region should host the platform, balancing Burundi latency, service availability, cost, and the cross-border legal position?
- **Why it matters now:** Blocks Firebase project creation in Phase 1 — the project cannot be created without a region.
- **Current documented options:** Candidate regions to be evaluated (e.g. europe-west vs. africa-south) — the evaluation itself has not yet been performed.
- **Existing recommendation:** None — only that region must be selected before project creation (OTD-003).
- **Founder input required:** Countersign — Engineering Lead + legal adviser are joint decision owners.
- **Engineering proof required:** Yes — latency/availability/cost evaluation across candidate regions.
- **Provider input required:** No (this is a Google Cloud region choice, not an external provider selection).
- **Affected engineering phase:** Phase 1 (Firebase and Shared Platform Foundation) — blocks ENG-P1-001, and transitively everything after it.
- **Affected requirement IDs:** FR-OPS-001, FR-OPS-003.
- **What may proceed before the decision:** Phase 0 in full.
- **What must not proceed before the decision:** Any Firebase project creation (ENG-P1-001) and everything downstream of it.
- **Dependency note:** this decision itself depends on **EXT-LEG-006** (cross-border hosting legal position, tied to DEC-LEGAL-006) — a legal input feeding an engineering decision, tracked in the External Dependencies Register.

### DEC-TECH-006 — Event delivery mechanism (outbox)

- **Plain-language question:** Should the platform use the recommended Firestore-transaction + event-outbox + background-processor pattern (with a future Pub/Sub migration path), and if so, how should the outbox collection itself be designed?
- **Why it matters now:** Blocks the shared platform foundation in Phase 1 — every domain service depends on one event-delivery mechanism.
- **Current documented options:** (a) the recommended outbox pattern; (b) direct Pub/Sub from the start.
- **Existing recommendation:** (a). Basis: OTD-006; TRD11 §11.17. **Update (Engineering Decision Sprint 2, 2026-07-17): CONFIRMED at the pattern level** (exact outbox collection schema remains Pass 2 implementation detail, tracked against ENG-P1-002). This decision no longer blocks Phase 1 at the architectural level; ENG-P1-002 remains sequentially gated on ENG-P1-001 completion.
- **Founder input required:** No — Engineering Lead is the decision owner.
- **Engineering proof required:** Yes — outbox collection design and background-processor validation.
- **Provider input required:** No.
- **Affected engineering phase:** Phase 1 (Firebase and Shared Platform Foundation) — blocks ENG-P1-002.
- **Affected requirement IDs:** DA-005, DA-006, DA-014.
- **What may proceed before the decision:** ENG-P1-001 (Firebase project init).
- **What must not proceed before the decision:** ENG-P1-002 (shared command contract, which the event envelope/outbox is part of) and everything downstream.

### DEC-TECH-007 — Idempotency storage approach

- **Plain-language question:** Should idempotency for sensitive writes use a dedicated collection, deterministic document IDs, or a combined per-operation approach?
- **Why it matters now:** Blocks core commands in Phase 1 — idempotency is already mandatory (confirmed, TRD10 §10.30); only the storage mechanism is open.
- **Current documented options:** Per OTD-007, three options; a combined approach is explicitly permitted.
- **Existing recommendation:** Combined approach permitted. Basis: OTD-007. **Update (Engineering Decision Sprint 2, 2026-07-17): CONFIRMED at the policy level** (per-operation schema choice remains Pass 2 implementation detail, tracked against ENG-P1-002). This decision no longer blocks Phase 1 at the architectural level; ENG-P1-002 remains sequentially gated on ENG-P1-001 completion.
- **Founder input required:** No — Engineering Lead is the decision owner.
- **Engineering proof required:** Light — confirming the combined approach's storage cost/complexity.
- **Provider input required:** No.
- **Affected engineering phase:** Phase 1 (Firebase and Shared Platform Foundation) — blocks ENG-P1-002, tied to DEC-TECH-006.
- **Affected requirement IDs:** DA-005, DA-006, DA-014.
- **What may proceed before the decision:** ENG-P1-001.
- **What must not proceed before the decision:** ENG-P1-002 and everything downstream.

### DEC-DATA-007 — Loyalty number and QR reference generation

- **Plain-language question:** What is the exact loyalty-number format/generation algorithm (opaque, non-sequential, non-revealing) and the QR opaque/signed reference scheme?
- **Why it matters now:** Blocks customer identity issuance in Phase 2 — a customer cannot be issued a loyalty identity without a defined generation algorithm.
- **Current documented options:** To be proposed (random alphanumeric + checksum; signed QR token) — no TRD section currently specifies the algorithm (audit traceability gap §1); only constraints exist (no registration date/country/sequence disclosure; QR contains no personal data).
- **Existing recommendation:** None recorded in the suite prior to this agenda. **See the [Loyalty Code Decision Brief](loyalty-code-decision-brief.md) — a full founder-facing decision brief prepared for this specific decision.**
- **Founder input required:** No per the register's current field (Engineering Lead is decision owner) — but given the customer-facing, permanent, brand-relevant nature of this identifier, the Founder is strongly encouraged to review the brief in §5 before Engineering proceeds.
- **Engineering proof required:** Yes — capacity/collision analysis, generation performance.
- **Provider input required:** No.
- **Affected engineering phase:** Phase 2 (Identity, Roles and Business Context) — blocks ENG-P2-001.
- **Affected requirement IDs:** AP-005, BR-005, BR-006, PR-005.
- **What may proceed before the decision:** Phase 0, Phase 1, and Phase 2 work packages not dependent on the customer identifier (ENG-P2-002/003 design).
- **What must not proceed before the decision:** ENG-P2-001 (customer identity issuance).

## 5. Provider Decisions

### DEC-PROV-004 — Phone OTP delivery route

- **Plain-language question:** Should customer phone verification use Firebase-native OTP delivery, or an external SMS route, for Burundi numbers specifically?
- **Why it matters now:** Blocks customer authentication in Phase 2, tied directly to DEC-SEC-001.
- **Current documented options:** Not enumerated as a fixed shortlist in the register; resolved jointly with DEC-SEC-001's options.
- **Existing recommendation:** None separately recorded — see DEC-SEC-001 (a), which assumes Firebase-native with an email fallback pending proof.
- **Founder input required:** No — Engineering Lead is decision owner.
- **Engineering proof required:** Yes — tied to EXT-TECH-001 (Burundi OTP delivery proof).
- **Provider input required:** Yes — this is fundamentally a provider-route choice.
- **Affected engineering phase:** Phase 2 — blocks ENG-P2-001, same as DEC-SEC-001.
- **Affected requirement IDs:** Same as DEC-SEC-001 (AP-005, BR-005, BR-006, PR-005).
- **What may proceed before the decision:** Same as DEC-SEC-001.
- **What must not proceed before the decision:** Same as DEC-SEC-001 — these two decisions should be resolved together, not separately.

### DEC-PROV-005 — Error monitoring provider

- **Plain-language question:** Which frontend + server error-visibility tooling will the platform use?
- **Why it matters now:** Blocks the observability foundation in Phase 1 — TRD22 Phase 1's deliverables explicitly include "monitoring initialization."
- **Current documented options:** Not enumerated in the register; a provider evaluation has not yet been performed.
- **Existing recommendation:** None recorded.
- **Founder input required:** No — Engineering Lead is decision owner.
- **Engineering proof required:** Light — confirming the chosen tool integrates with the Firebase/Functions stack.
- **Provider input required:** Yes.
- **Affected engineering phase:** Phase 1 (Firebase and Shared Platform Foundation) — blocks ENG-P1-003.
- **Affected requirement IDs:** FR-SEC-006, FR-OPS-009, FR-OPS-010.
- **What may proceed before the decision:** ENG-P1-001, ENG-P1-002.
- **What must not proceed before the decision:** ENG-P1-003 (monitoring initialization specifically) — the Security/Storage Rules portion of ENG-P1-003 does not strictly depend on this provider choice and may proceed in parallel if explicitly split.

## 6. Summary Table

| Decision ID | Category | Owner | Affected Phase | Status |
|---|---|---|---|---|
| DEC-LOY-008 | Founder | Founder | Phase 7 | OPEN_FOUNDER |
| DEC-ID-003 | Founder | Founder + Engineering | Phase 2 | OPEN_FOUNDER |
| DEC-SEC-001 | Engineering | Engineering Lead (Founder countersigns) | Phase 2 | OPEN_ENGINEERING |
| DEC-TECH-003 | Engineering | Engineering Lead | Phase 0 | **CONFIRMED** (Sprint 2, 2026-07-17) |
| DEC-TECH-004 | Engineering | Engineering Lead | Phase 0 | **CONFIRMED** (Sprint 2, 2026-07-17) |
| DEC-TECH-005 | Engineering | Engineering Lead + legal adviser (Founder countersigns) | Phase 1 | OPEN_ENGINEERING |
| DEC-TECH-006 | Engineering | Engineering Lead | Phase 1 | **CONFIRMED** (Sprint 2, 2026-07-17; pattern level) |
| DEC-TECH-007 | Engineering | Engineering Lead | Phase 1 | **CONFIRMED** (Sprint 2, 2026-07-17; policy level) |
| DEC-DATA-007 | Engineering | Engineering Lead | Phase 2 | OPEN_ENGINEERING |
| DEC-PROV-004 | Provider | Engineering Lead | Phase 2 | OPEN_PROVIDER |
| DEC-PROV-005 | Provider | Engineering Lead | Phase 1 | OPEN_PROVIDER |

All 11 D1-priority decisions from the Version 1.0 Engineering Readiness Report §6–7 appear above. None were approved by this document; DEC-TECH-003, DEC-TECH-004, DEC-TECH-006, and DEC-TECH-007 were subsequently confirmed by Engineering Decision Sprint 2 (2026-07-17) via the [Decision Update Procedure](../decision-update-procedure.md) — see the live [Decision Register](decision-register.md) and the [Phase 0 Authorization](../../05-implementation/phase-0-authorization.md) record.

## 7. What This Agenda Does Not Do

- It does not approve, resolve, or reword any Decision Register entry — that occurred later, under explicit Founder-directed instruction, in Engineering Decision Sprint 2.
- It does not replace the [Founder Decision Agenda](founder-decision-agenda.md), which remains the complete record of all 24 remaining OPEN_FOUNDER items across Batches B–E.
- It does not select a Firebase region — DEC-TECH-005 remains open, pending the input described above. The event-delivery mechanism (DEC-TECH-006), idempotency storage approach (DEC-TECH-007), and frontend tooling set (DEC-TECH-003) were subsequently confirmed by Engineering Decision Sprint 2 — see the [Decision Register](decision-register.md).
- It does not authorize Phase 0 (or any phase) to begin — see the [Phase 0 Authorization](../../05-implementation/phase-0-authorization.md) record for that authorization, issued separately under Engineering Decision Sprint 2.

## 8. Relationship to Other Governance Documents

- [Decision Register](decision-register.md) — the authoritative record each entry above is drawn from verbatim.
- [Founder Decision Agenda](founder-decision-agenda.md) — the complete decision agenda this is a transition-focused subset of.
- [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md) — where each decision's blocking effect on a specific work package is tracked.
- [Loyalty Code Decision Brief](loyalty-code-decision-brief.md) — the companion founder-facing brief prepared for DEC-DATA-007 specifically (§5 above).
