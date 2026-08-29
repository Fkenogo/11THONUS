> **Title:** Terms Instrument Architecture & Core Business Terms Drafting Readiness Note
> **Version:** 1.0 · **Status:** Assessment record, 2026-08-29 · **Classification:** Working (governance record) — does not itself draft, approve, or configure any Terms content or version
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002`
> **Task:** `DEC-LEGAL-002-LEGAL-OPINION-RECON-001`
> **Companion documents:** [Reconciliation Matrix](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md); [Founder Legal Architecture Disposition Record](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md); [Post-Legal-Review Resolution Assessment](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-resolution-assessment-2026-08-29.md)

## 1. Jurisdiction architecture

Three layers, confirmed consistent with existing authority (Platform Constitution, `DEC-LEGAL-006`, TRD13):

- **Layer 1 — Global/Core 11thONUS legal architecture.** Portable product relationships and contractual principles (platform–business service-provider characterisation, reward-obligation survival, monetary characterisation, differentiated-instrument model, LEG-FD-01's fallback interpretive standard). Applies everywhere 11thONUS operates unless overridden by Layer 2.
- **Layer 2 — Jurisdictional overlay.** Mandatory or appropriate local provisions layered onto Layer 1 instruments, not a redefinition of them. Burundi is the first launch/pilot jurisdiction and its overlay (governing law, forum, language accessibility, specific consumer-protection disclosures) is the first to be drafted — but Burundi is **not** the permanent legal perimeter of 11thONUS; the architecture is designed to admit additional country overlays (e.g., a future Rwanda customer-facing overlay, if 11thONUS ever serves Rwandan consumers directly) without redesigning Layer 1.
- **Layer 3 — Business Reward Program Rules.** Business-specific programme mechanics and obligations, authored and controlled by each participating Business, not the platform — constrained by Layer 1/2 only insofar as Layer 1/2 impose minimum requirements (e.g., FD-5's no-retrospective-reduction rule) that a Business's own Reward Program terms cannot contract around.

This three-layer model is consistent with, and does not require correcting, the existing Legal Counsel Handoff Pack §6 instrument model. No unsupported jurisdictional requirement is invented by this note — every specific Burundi/Rwanda-specific item referenced below traces to either the external Legal Opinion or an already-governed decision (`DEC-LEGAL-006`).

## 2. Terms instrument architecture (confirms LEG-FD-10)

| Instrument | Relationship governed | Status |
|---|---|---|
| **A. Core Business Terms** | 11thONUS ↔ participating Business | In scope for this reconciliation; see §3 readiness table |
| **B. Customer Terms / Platform Terms of Use** | 11thONUS ↔ customer, platform access/use | Separate future governed work package (LEG-FD-10) — not drafted here |
| **C. Business Reward Program Rules** | Business ↔ its own customers, programme mechanics | Authored per-Business; platform imposes only the Layer 1/2 minimums above |
| **D. Jurisdictional Overlays** | Applied to the relevant instrument (A, B, or C) per jurisdiction | Burundi overlay is the first to be drafted, alongside Instrument A |

## 3. Core Business Terms — section-by-section drafting readiness

| Business Terms section (per Legal Counsel Handoff Pack §6 heading list) | Governing position | Readiness |
|---|---|---|
| Parties/relationship | LEG-FD-01 (No-Agency characterisation), Reconciliation row 1 | **Ready** |
| Platform service | Existing product-model description (Legal Counsel Handoff Pack §2) | **Ready** |
| Business eligibility | Existing onboarding architecture (`ENG-P3-002`) | **Ready** |
| Account authority | Existing Business/Staff domain architecture (`ENG-P2-002`/`003`) | **Ready** |
| Reward Program responsibility | FD-5, Reconciliation row 6 | **Ready** |
| Transaction recording | Existing product-model description | **Ready** |
| Reward obligations | FD-2/FD-3, `DEC-LOY-011`, LEG-FD-04/07/08, Reconciliation rows 5/7/19 | **Ready** |
| Prohibited conduct | Existing platform-integrity principles; no new item raised | **Ready** |
| Disputes/corrections | LEG-FD-11, Reconciliation rows 8/13 | **Not ready — forum/seat/rules Founder decision required first** |
| Suspension/termination | FD-3/FD-4, `DEC-LOY-011`, LEG-FD-06, Reconciliation row 18 | **Ready** (principle-based; no numeric period fixed, none required to draft) |
| Programme changes | FD-5, LEG-FD-05, Reconciliation row 6 | **Ready** (principle-based) |
| Data/privacy references (cross-referenced) | LEG-FD-09 (not duplicated into Business Terms) | **Ready** — cross-reference only, no content drafted here |
| Fees/commercial provisions | FD-7, LEG-FD (subscription boundary, §20), Reconciliation row 20 | **Ready — structural language only**, no `DEC-SUB-*` value |
| Liability | Reconciliation row 9 (open) | **Not ready — liability cap figures are a genuinely open Founder/legal decision**, per the Legal Counsel Handoff Pack's own §5 disclosure that this remains "fully open" |
| Governing law/disputes | Reconciliation row 12 (governing-law split) + rows 8/13 (forum) | **Partially ready** — governing-law clause direction (Rwanda for Business Terms) is a reasonable drafting input; final selection is a legal-drafting decision, not blocked the way disputes-forum is |
| Changes to Terms | LEG-FD-13, Reconciliation row 15 | **Ready** (principle-based; reacceptance-on-change engineering decision is separate and does not block drafting the Terms clause itself) |
| Electronic acceptance | LEG-FD-03, Reconciliation row 3 | **Ready** — already implemented and confirmed sound |

**Net readiness: 14 of 16 sections ready to draft on principle-based language now; 2 sections (Disputes/corrections and Liability) require a Founder decision before they can be drafted with confidence.** This supports the Resolution Assessment's Gate B conclusion (see below) rather than a full, unqualified Gate A.

## 4. Subscription boundary (confirms FD-7; addresses Legal Opinion §20)

`DEC-LEGAL-002` may establish the general contractual framework governing applicable subscriptions, fees, billing, cancellation, and changes, expressed structurally (as the Legal Opinion's own §20 "Structural Subscription Provisions" illustrates). It does **not** resolve: plan names; prices; price ranges; billing intervals; payment periods; staff/user limits; trials; complimentary/pilot plans; proration; grace periods; upgrade/downgrade mechanics; billing ownership; tiering; or any other open `DEC-SUB-*` value. Every example the Legal Opinion proposes for these matters (§20, tables B–E) is a non-binding drafting illustration, not an adopted decision. No `DEC-SUB-*` status is changed by this note.

## 5. What this note does not do

- Does not draft any Terms clause text.
- Does not select a dispute-resolution forum, seat, or rules.
- Does not set any liability cap figure.
- Does not configure a Terms version or authorize `acceptBusinessTerms`/`platformConfig/businessTerms` configuration.
- Does not resolve any `DEC-SUB-*` item.
- Does not close `DEC-LEGAL-002` or Capability 3.

## 6. Terms Drafting Gate

Per the section-by-section readiness table (§3), Core Business Terms are **not yet fully ready for unqualified controlled drafting** — 14 of 16 sections are ready on principle-based language; the Disputes/corrections section requires a Founder forum/seat/rules decision, and the Liability section requires a Founder/legal cap-figure decision, both explicitly flagged as open by existing authority (the Legal Counsel Handoff Pack's own §5 and §7 unresolved-items table) and not resolved by this reconciliation. See the [Post-Legal-Review Resolution Assessment](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-resolution-assessment-2026-08-29.md) §7 for the corresponding gate conclusion.
