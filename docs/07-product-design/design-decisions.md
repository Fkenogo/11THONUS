> **Title:** Design Decisions Register
> **Version:** 1.0 · **Status:** Active governance record · **Classification:** Working (governance record — design)
> **Governing document:** [UX Direction](ux-direction.md); [Decision Governance Workflow](../00-governance/decision-governance-workflow.md) (process model reused for design decisions)
> **Source-of-truth path:** `docs/07-product-design/design-decisions.md`
> **Last controlled update:** 2026-07-17 (Phase 8 — created)

# Design Decisions Register

## 0. Purpose and Method

This register records the major UX decisions embedded in the approved Stitch exploration and the reasoning behind each — the design equivalent of the [Decision Register](../00-governance/decisions/decision-register.md), scoped to UX/design rather than product or engineering decisions. Each entry follows the same discipline as that register: description, reason, alternatives actually considered, chosen direction, dependencies, affected screens, and an explicit trigger for when the decision should be revisited. Nothing here overrides the Product Experience Principles, the PRD, or the TRD; where a future design decision would require changing one of those, it goes through that document's own governance process, not this register alone.

---

### DEC-UX-001 — Version 1 → Version 2 Concept Matching Method

- **Description:** How each of the five Version 2 (`exploration-v2/`) concepts was determined to be the refined successor of a specific Version 1 (`exploration-v1/`) concept, since the source material carried no explicit version labels.
- **Reason:** Task 2 requires maintaining version history without overwriting previous concepts — this required a defensible, evidence-based method for matching, not a guess.
- **Alternatives considered:** (a) treat all 13 concepts as one undifferentiated set with no version distinction; (b) match by folder-creation order/timestamp (rejected — all files carried an identical extraction timestamp, providing no signal); (c) match by exact `<title>` tag correspondence plus naming evidence (e.g. "refined_" prefix) and the presence of a richer, accompanying design-system specification.
- **Chosen direction:** (c). Verified matches: `concept_1_customer_home` ↔ `refined_home_trust_first` (identical title "11thONUS | Customer Home"); `concept_2_purchase_verification` ↔ `signature_verification_experience` (identical title "Purchase Verification | 11thONUS"); `concept_3_loyalty_journey` ↔ `loyalty_journey_verified_units` (identical title "11thONUS - Loyalty Journey"); `concept_4_reward_ready` ↔ `the_on_us_moment_reward_redemption` (thematic successor — reward availability to reward redemption, no exact title match but the only redemption-stage concept in Version 2); `premium_verification_system/DESIGN.md` treated as the Version 2 design-system specification underlying all four, not a screen concept itself. `concept_6_business_dashboard`, `concept_8_notification_center`, and `concept_9_navigation_model` have no Version 2 refinement in the source material and remain Version 1 only.
- **Dependencies:** None.
- **Affected screens:** All 13 concepts in the exploration.
- **Future review triggers:** If the Founder/design lead has a different intended v1↔v2 mapping (e.g. from context not present in the file system), this entry should be corrected before any document here is treated as final.

---

### DEC-UX-002 — Navigation Model: Persistent Bottom Bar over Task-First Dashboard

- **Description:** Whether customer navigation uses a simple five-item persistent bottom bar (Home, Scan, Rewards, Activity, Account) or the richer, task-first structure explicitly tested in `concept_9_navigation_model`.
- **Reason:** Navigation depth directly affects cognitive load (Product Experience Principles §3) and how quickly a user reaches the one action that matters (Scan).
- **Alternatives considered:** (a) the five-item persistent bar; (b) the task-first dashboard with a richer item set (My Progress, Rewards Hub, Activity History, Preferences, Nearby Partners) tested in `concept_9_navigation_model`.
- **Chosen direction:** (a). Every Version 2 concept uses the shorter bar; the richer alternative was tested in Version 1 but not carried forward.
- **Dependencies:** DEC-UX-001 (this reasoning depends on `concept_9_navigation_model` being correctly identified as a tested-but-not-adopted alternative rather than an approved direction).
- **Affected screens:** All customer-facing screens.
- **Future review triggers:** If customer research post-launch shows users struggling to find secondary destinations (Preferences, Nearby Partners) that the shorter bar doesn't surface, revisit this decision.

---

### DEC-UX-003 — Visual Language: High-End Minimalism / Trust-Progress-Reward Color System

- **Description:** The overall visual direction and color-role system (Trust = near-black, Progress = orange, Reward = gold) specified in `premium_verification_system/DESIGN.md` and reflected across all Version 2 concepts.
- **Reason:** The visual system needs to communicate meaning (which state/action a color represents) without relying on decoration, consistent with Accessibility Principles §8 and Experience Pillar "Simple Beats Clever."
- **Alternatives considered:** No alternative color/visual system is documented in the source material — Version 1 concepts used a less formalized visual language; Version 2 introduced this specific, named system as a refinement, not as a choice among competing options.
- **Chosen direction:** Adopt the Trust/Progress/Reward color-role system and "High-End Minimalism" aesthetic as the approved Version 2 direction.
- **Dependencies:** Feeds directly into the future Platform Design System (Product Experience Principles §10).
- **Affected screens:** All Version 2 screens; intended to extend to all future screens.
- **Future review triggers:** Should be formally reviewed and ratified (not just inherited) at the point the Platform Design System is authored — this specification is a strong starting input, not a finished, independently-approved design system in its own right.

---

### DEC-UX-004 — Recognition Moment: Premium/Exclusive-Tier Language (Watch Point)

- **Description:** `the_on_us_moment_reward_redemption` uses language such as "Executive Tier Benefit" and "Lifetime Status" to frame recognition of sustained loyalty.
- **Reason:** Recognition needs to feel specific and earned (Moments That Matter §7), but exclusive/tier language risks drifting toward the "Reward Inflation" anti-pattern (Design Anti-Patterns §8) if applied inconsistently or promoted beyond what was genuinely earned.
- **Alternatives considered:** (a) adopt the premium/exclusive-tier language as shown; (b) use plainer, non-tiered recognition language throughout.
- **Chosen direction:** (a), approved as part of Version 2, but explicitly flagged rather than treated as risk-free.
- **Dependencies:** None.
- **Affected screens:** `the_on_us_moment_reward_redemption` and any future screen extending its recognition language.
- **Future review triggers:** Review against real customer response once this flow is implemented and observed in the pilot; if tier language is perceived as gatekeeping or exclusionary rather than warm, revisit toward plainer language per Design Anti-Patterns §8.

---

### DEC-UX-005 — Progress Representation: Concrete Verified-Unit Counts, Not Abstract Bars

- **Description:** Progress toward a reward is shown as a specific count against a specific target with per-unit timestamps ("Seventh Unit Verified," "Verified on Oct 12, 2023"), not an unlabeled percentage bar.
- **Reason:** Reinforces that progress is a ledger of real, verified events (Product Experience Principles §1.2), not an abstract score — directly supporting the "Clarity, Not Points" product decision (Design Decision Knowledge Base §3.1).
- **Alternatives considered:** (a) concrete counts with timestamps (chosen); (b) an abstract progress bar/percentage with no per-unit detail (present in simpler form in some Version 1 screens, superseded by (a) in Version 2).
- **Chosen direction:** (a).
- **Dependencies:** DEC-UX-001.
- **Affected screens:** `concept_3_loyalty_journey`, `loyalty_journey_verified_units`, customer home screens.
- **Future review triggers:** None currently identified — this decision aligns tightly with an already-CONFIRMED product decision (Verified Units) and is not expected to require revisiting absent a change to that underlying product decision itself.

---

### DEC-UX-006 — Business Navigation Reuses Customer Shell (Interim)

- **Description:** `concept_6_business_dashboard` reuses the same bottom-navigation shape as the customer surface rather than introducing a business-specific navigation model.
- **Reason:** No business-specific navigation need was identified or tested in the current exploration; reusing the customer shell avoids inventing structure the exploration doesn't support.
- **Alternatives considered:** (a) reuse the customer navigation shell (chosen, by default — no alternative was actually tested); (b) a dedicated business navigation model (not explored).
- **Chosen direction:** (a), explicitly interim.
- **Dependencies:** None.
- **Affected screens:** `concept_6_business_dashboard`.
- **Future review triggers:** Revisit once Owner/multi-branch business scenarios (PRD1 §8) are explored in a future design pass — the current single-branch dashboard concept may not generalize.

## 1. Relationship to Other Documents

- [UX Direction](ux-direction.md), [Navigation Model](navigation-model.md), [Moments That Matter](moments-that-matter.md), [Design Anti-Patterns](design-anti-patterns.md) — each references specific entries above.
- [Decision Governance Workflow](../00-governance/decision-governance-workflow.md) — the process model this register's discipline (never silently resolve, always disclose alternatives and triggers) is adapted from.
- `stitch/exploration-v1/`, `stitch/exploration-v2/` — the source evidence for every entry above.
