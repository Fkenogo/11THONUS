> **Title:** 11thONUS Canonical Reference  
> **Version:** 1.0 (Phase 1 consolidation) · **Status:** Controlled navigation/reference document · **Classification:** Working (controlled reference — does not override Constitution, PRD or TRD)  
> **Governing document:** 11thONUS Platform Constitution; PRD; TRD  
> **Source-of-truth path:** `docs/00-governance/canonical-reference.md`  
> **Last controlled update:** 2026-07-16 (Phase 4 — §11 updated: requirement-ID renumbering executed per DEC-GOV-006)

# 11thONUS Canonical Reference

**Version:** 1.0 (Phase 1 consolidation)
**Date:** 16 July 2026
**Status:** Controlled navigation and canonical-reference document for the authoritative documentation suite. It consolidates approved content for quick lookup; it does **not** override the Constitution, PRD or TRD
**Rule:** This document contains **only** information already approved elsewhere in the suite. Every entry cites its source. Where a matter is an open decision, it is marked OPEN and is **not** resolved here. If this document ever conflicts with the Constitution, PRD or TRD, those documents govern and this reference must be corrected.

---

## 1. Product Identity

- **11thONUS is a Customer-Verified Loyalty Platform.** (Constitution Article 1; TRD Consolidation Audit §3.1)
- "Cloud-based" / "cloud-hosted" may describe technical delivery only — never the product category. "Verified Commerce™" is the long-term direction, never an MVP deliverable label. (Consolidation Audit §3.1–3.2)
- **Brand promise:** "Every 11th. On Us." Customer-facing voice: appreciation, not discounting — "This one's on us." (PRD0 §2.3–2.5; Constitution Article 2)
- **Mission:** strengthen customer–business relationships through trusted, simple, transparent loyalty. (Constitution Article 3)
- **Three Pillars:** Loyalty, Trust, Simplicity — every feature must strengthen at least one. (Constitution Part III)
- **Initial market:** Burundi; planned expansion: Rwanda, Uganda, Kenya. (PRD0 §8; PD-002/PD-003)
- **Technology direction:** Firebase-first (Authentication, Firestore, Cloud Functions, Storage, Hosting, App Check, Cloud Messaging, Analytics). Firebase implements the architecture; it does not define it. (PD-020; TRD Ch. 8; Consolidation Audit §19.1)
- **Delivery:** mobile-first PWA. (PD-021)

## 2. Core Reward Model

- **Rule:** Ten customer-verified qualifying units complete the earning requirement; the next eligible product or service is provided by the business as the **On Us Moment** (position 11 in the relationship). (PRD0 PD-006, §13.1–13.2; PRD6 §4.4; Consolidation Audit §4)
- **Technical threshold:** `requiredVerifiedUnits = 10` — **fixed platform rule in the MVP, not business-configurable**, stored in versioned configuration. (Consolidation Audit §4.2; TRD10 §10.9.2 Threshold Rule)
- Recommended progress wording: "7 of 10 toward your next one on us." (TRD23 §23.10)
- One Purchase Record may contain multiple qualifying units (e.g., five coffees → five Verified Units after verification). Legitimate multi-item purchases are never auto-rejected; high quantities may trigger review visibility only. (PD-009/PD-022; PRD6 §11; Consolidation Audit §8)
- **Only one active or reward-available Loyalty Cycle** exists per customer per Reward Program in the MVP. (PRD6 BR-063; TRD10 §10.11.2)
- Earned rewards do not auto-expire in the MVP; expiry is architecturally supported. (PRD6 §20; Consolidation Audit §7.8)
- **OPEN:** overflow-unit allocation policy default (hold pending until redemption) awaits formal confirmation — TRD23 OPD-006, now registered as **DEC-LOY-008** in the [Decision Register](decisions/decision-register.md). Redemption is performed by the authorized business user after online validation; it is atomic and once-only. (TRD23 §23.12)

## 3. Trust Principles (non-negotiable)

1. **Every Purchase Record remains pending (`waiting_for_customer`) until the registered customer verifies it — regardless of recorder:** owner, manager, staff, POS, API or offline sync. No actor is exempt. (PRD0 §14.1–14.2, PD-013/PD-014; PRD1 AP-005/BR-005/BR-009; PRD5 BR-052/BR-058; Consolidation Audit §3.5, §9.1)
2. Only verified Purchase Records create **Verified Units**; pending, rejected and disputed records never contribute. (PRD4 CVLE-003..006)
3. Verified Units are immutable credits/reversals, always traceable to their originating Purchase Record — never a mutable balance. (TRD10 §10.11.1, DA-002/DA-003; Consolidation Audit §3.6)
4. **Shared loyalty number:** friends or family may quote the registered customer's loyalty number where the Reward Program permits; the Purchase Record attaches to the registered customer, who alone verifies it. Knowing the number never grants account access or authentication. (BR-006/BR-016/BR-021/BR-022; Consolidation Audit §10)
5. Commercial history is immutable; corrections occur through reversal/replacement events, never edits or deletions. (PD-016/PD-017; TAP-007; DAP-004)
6. **Clients never write authoritative records** (Purchase Records, verification outcomes, Verified Units, Loyalty Cycles, rewards, redemptions, subscriptions, roles, rules, taxonomy, Trust Events) — trusted server processes only. (DAP-003; Consolidation Audit §19.2)
7. Every significant action is attributable (individual accounts; shared staff accounts prohibited) and recorded as a **Trust Event**. (BR-001/BR-002; PRD5 PVL-007; TRD10 §10.13)
8. Review before restriction: unusual activity becomes visible for review; it is not automatically punished or blocked. (PRD8 OI-004/OI-005, BR-080)
9. **Rejection is strictly individual:** there is no batch or multi-select rejection; every rejected Purchase Record records its own reason. (DEC-LOY-010, confirmed 16 July 2026; PRD0 §14.3; TRD23 §23.13)
10. **Purchase Record monetary fields are reporting metadata only:** an optional Unit Value + Currency may be recorded, but money never influences Verified Units, Reward Program progression, Loyalty Cycles or reward eligibility, unless a future founder decision explicitly introduces amount-based Reward Programs. (DEC-DATA-003, confirmed 16 July 2026; PRD5 §5; TRD10 §10.10.1)

## 4. Canonical Terminology

| Canonical (engineering/product) | Customer-facing UI | Never use (superseded) |
|---|---|---|
| Customer-Verified Loyalty Platform | — | cloud-based loyalty platform (as category), points/discount platform |
| Reward Program | Reward Program / business display name | loyalty product, loyalty item, listing, campaign, "Programme" spelling |
| Purchase Record | Purchase | transaction (for the record), punch |
| Verified Unit | Progress ("7 of 10") | points, balance |
| Loyalty Cycle | (not exposed) | punch card cycle |
| On Us Moment; reward entitlement/redemption | "Your next one is on us", "Your On Us Moments" | Reward History (as customer heading) |
| Customer | — | shopper, consumer, participant |
| Business | — | vendor, merchant |
| Owner / Manager / Staff Member / Platform Super Administrator | — | shared/generic accounts |
| Loyalty number (+ QR code) | loyalty number | customer code (in normative text), shopper_code |
| Trust Event / Administrative Audit Record / Security Log (three distinct record classes) | History / Activity | interchangeable use of "audit log" |

Backend vocabulary (**engine, ledger, lifecycle, state machine, event, token**) must never appear in customer copy. (TRD23 §23.9; Consolidation Audit §3)
Sources: Consolidation Audit §3; TRD23 §23.9; PRD4 §3 (official vocabulary).

## 5. Domain Model (15 domains — final)

Identity · Commerce Knowledge · Rules · Reward Programs · Purchase · Loyalty · Reward · Trust · Notification · Reporting · Search · Subscription · Integration · Administration · Intelligence (future).
(TRD23 §23.7; Consolidation Audit §5.1; applied to TRD1-7 and TRD10 in Phase 1)

## 6. Ownership Model

| Domain | Authoritative ownership |
|---|---|
| Identity | Users, customers, businesses, branches, memberships, consent identity |
| Commerce Knowledge | Industries, categories, business types, standard products/services, tags, translations |
| Rules | Rule definitions, versions, assignments, effective-rule resolution |
| Reward Programs | Reward Program identity, versions, commercial configuration, shared-number policy, state |
| Purchase | Purchase Records, disputes, corrections, purchase timeline |
| Loyalty | Verified Units, Loyalty Cycles, progress, reward eligibility |
| Reward | Reward entitlement, redemption, On Us Moments |
| Trust | Trust Events, audit records, operational reviews |
| Notification | Notification intent, templates, message state |
| Reporting | Metric definitions, projections, exports, freshness |
| Search | Search projections, indexing, discovery, search analytics |
| Subscription | Plans, entitlements, subscriptions, invoices, billing obligations |
| Integration | Provider adapters, webhooks, external requests, delivery responses |
| Administration | Platform governance, support cases, feature flags, administrator access — **workflows and interfaces only; never the authoritative identity, subscription or commercial records** |
| Intelligence | Future models, recommendations, analytical intelligence |

(TRD23 §23.7–23.8) Key clarifications: Identity — not Administration — owns the business record; Subscription — not Administration — owns billing records; Integration exclusively owns provider adapters; Trust Events ≠ administrative audit records ≠ security logs. (Consolidation Audit §5)

## 7. Canonical State Models

(Consolidation Audit §7 — canonical state models approved as the suite-wide target. Phase 1 applied the confirmed corrections listed in the Phase 1 implementation report; remaining decision-gated cases stay open.)

- **User:** pending · active · locked · suspended · closed · archived
- **Business:** draft · pending_verification · trial · active · suspended · expired · closed · archived
- **Business membership:** invited · active · suspended · removed
- **Reward Program:** draft · active · paused · retired · archived
- **Purchase Record:** waiting_for_customer · verified · rejected · under_review · corrected · cancelled · expired · archived — UI may say "Pending verification"/"Waiting for You"; the stored state is `waiting_for_customer`
- **Purchase dispute:** open · business_review · resolved_verified · resolved_rejected
- **Loyalty Cycle:** active · reward_available · reward_redeemed · closed ("Current"/"Historical" are display labels only)
- **Reward:** available · redeemed · cancelled · expired (expiry not auto-enabled in MVP)
- **Redemption:** completed · reversed
- **Subscription:** draft · trial · active · past_due · grace_period · suspended · cancelled · expired · archived
- **Payment attempt:** created · submitted · pending_customer_approval · confirmed · failed · timed_out · cancelled · reversed · refunded · requires_review
- **Notification:** queued · processing · partially_delivered · delivered · failed · suppressed · cancelled
- **Knowledge object:** draft · in_review · approved · published · retired · archived
- **Rule version:** draft · approved · scheduled · active · superseded · suspended · retired

## 8. Glossary

- **Customer-Verified Loyalty:** the defining differentiator — the business records, the customer verifies, only then does progress exist. (PRD0 §12)
- **Purchase Record:** business-submitted record of qualifying commercial activity awaiting or having received customer action; not necessarily proof of payment. (Consolidation Audit §3.4)
- **Verified Unit:** immutable credit created only from a customer-verified Purchase Record; the sole calculation unit of the Loyalty Engine. (PRD6 §9; Consolidation Audit §3.6)
- **Loyalty Cycle:** one customer's progress toward one On Us reward within one Reward Program. (Consolidation Audit §3.7)
- **On Us Moment:** the customer-facing redemption experience. (PRD4 §3; Consolidation Audit §3.8)
- **Trust Ledger:** product-level concept for the append-only commercial history; implemented as the `trustEvents` collection. (PRD4 §21; TRD10 §10.13)
- **Knowledge Studio:** editorial governance of the Commerce Knowledge Layer (one taxonomy platform-wide). (Knowledge Studio doc; CP-008)
- **Rules Studio:** governed, typed configuration of business behavior; MVP uses predefined typed rules, not a rule language. (Rules Studio doc; TRD23 §23.16)
- **Progressive KYC:** registration stays lightweight; profile data collected progressively. (CP-007; CKS Part XII)

## 9. Document Hierarchy

Per the Platform Constitution Part VII (the highest governance document, amended 16 July 2026 — version 1.1):

1. 11thONUS Platform Constitution *(governing)* — `docs/00-governance/platform-constitution.md`
2. Product Requirements Document (PRD0–PRD10) — `docs/01-product/prd/`
3. Technical Requirements Document (Chapters 1–23) — `docs/02-technical/trd/`
4. Commerce Knowledge Standard — `docs/03-standards/commerce-knowledge-standard.md`
5. Platform Design System *(not yet authored)*
6. Engineering Standards *(not yet authored)*
7. Operational Playbooks *(not yet authored)*
8. API & Integration Guide *(not yet authored)*
9. Decision Register — `docs/00-governance/decisions/decision-register.md`
10. Implementation Change Log — `docs/00-governance/documentation-changes-log.md`

Lower-level documents may not contradict higher-level documents; where they conflict, the higher document governs, the conflict is recorded, and the lower document is corrected. (Constitution Part VII; TRD23 §23.3)

> **CONFIRMED (DEC-GOV-001, 16 July 2026):** The Constitution was formally amended (Part VII, Amendment Record #1) to adopt this hierarchy. No Vision & Product Strategy document will be authored; it has been formally dropped. This reference previously flagged the two lists as conflicting (audit DOC-P1-008) — the conflict is now resolved.

**Superseded documents (historical only):** `docs/99-archive/superseded/product-definition-superseded-v1.md`, `docs/99-archive/superseded/legacy-data-model-superseded-v1.md` — marked with status banners in Phase 1 and archived in Phase 2.

## 10. MVP Boundaries (summary of TRD22)

**In scope (Strict MVP, TRD22 §22.5):** customer identity (phone auth, loyalty number, QR); business identity with one branch; individual staff accounts and roles; governed launch taxonomy; Reward Programs with fixed 10-unit threshold; purchase recording (QR/loyalty-number lookup, quantity, idempotent, limited offline queue); customer verification (verify one/selected/visible set, reject, dispute); Verified Units and Loyalty Cycles; reward redemption with duplicate prevention and On Us Moments; Trust Events and review queue; in-app/push notifications in English and French; basic business reporting; versioned subscription plans with trial, grace, suspension; platform administration without console editing; full Firebase technical foundation.

**Explicitly deferred (TRD22 §22.6):** wallet, gift cards, reward gifting/transfer, marketplace, nearby search and map discovery, AI recommendations, configurable thresholds, points/tiers, stacked rewards, auto-expiry, promotions/referrals/birthday rewards, benchmarking, predictive analytics, franchises, multi-branch operation, public API, POS/CRM/accounting integrations, complete Kirundi/Swahili/Kinyarwanda translation (architecture-ready only), Experience Studio, Intelligence Studio.

**Offline MVP boundary (TRD22 §22.33; TRD23 §23.19):** offline permits only cached app shell, safe cached QR, cached reference data, queued Purchase Record creation with visible sync status. Customer verification, rejection, disputes, redemption, payment and administration always require online confirmation. Unsynchronized records are non-authoritative.

**Localization (TRD23 §23.34):** English and French complete for all launch-critical journeys; Kirundi, Swahili, Kinyarwanda architecture-ready; all customer-facing strings use translation keys; no backend terminology in customer copy.

**Scope protection (TRD22 §22.7):** a capability enters the MVP only if the launch journey requires it, its absence creates unacceptable risk, and it is approved as a formal scope change.

## 11. What This Reference Does Not Decide

Open items remain open — authoritative status now in the **[Decision Register](decisions/decision-register.md)** (`docs/00-governance/decisions/`, created Phase 3; audit extraction remains historical input): plan names and staff limits, trial rule, overflow-unit policy confirmation, reward-during-suspension policy, phone lookup, public profiles, gender values, birthday visibility, permission-inheritance semantics, all provider selections, all legal dependencies.

**Resolved 16 July 2026 (Phase 3B — Batch A, all four D0 freeze blockers):** document hierarchy / Vision & Product Strategy disposition (DEC-GOV-001), requirement-ID renumbering approval (DEC-GOV-006), batch-rejection conflict (DEC-LOY-010), Purchase Record monetary fields (DEC-DATA-003). See §3 items 9–10 above and the Decision Register for full text.

**Also resolved 16 July 2026 (Phase 4 — mechanical execution of DEC-GOV-006):** the requirement-ID renumbering itself is now complete. `FR-RP` (PRD1 §18) → `FR-AUTHZ-001..010`; `FR-RP` (PRD10 §19) → `FR-RBAC-001..008`; PRD6 §25 keeps `FR-RP-001..012`; TRD20 §20.75 rule table `OP-*` → `OR-001..018` (PRD0 §11's `OP-*` ONUS Principles are unchanged); TRD23 §23.25 assumptions `A-*` → `AS-001..015`; PRD4 §19 gained `FR-CVLE-001..013`. Full record: [Requirement ID Mapping](requirement-id-mapping.md).
