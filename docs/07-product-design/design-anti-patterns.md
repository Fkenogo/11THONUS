> **Title:** Design Anti-Patterns
> **Version:** 1.0 · **Status:** Active — binding constraint for all future design and frontend work · **Classification:** Authoritative Product (design)
> **Governing document:** [Product Experience Principles](../01-product/product-experience-principles.md); Platform Constitution
> **Source-of-truth path:** `docs/07-product-design/design-anti-patterns.md`
> **Last controlled update:** 2026-07-17 (Phase 8 — created)

# Design Anti-Patterns

## 0. Purpose

This document lists what must never appear in 11thONUS, regardless of how a future designer or frontend engineer arrives at it. Every item traces to a specific Constitution value, Experience Pillar, or Design Principle it would violate — this is not a list of aesthetic dislikes, it is the negative space the [Product Experience Principles](../01-product/product-experience-principles.md) imply. A screen that contains any item below fails review regardless of how polished it otherwise looks.

## 1. Hidden Progress

**Never:** burying a customer's Verified Unit progress behind a tap, a tab switch, or a collapsed section on the screen they land on most.
**Why it's forbidden:** violates "Progress Should Motivate" (Product Experience Principles §2) and the Information Hierarchy rule that current state comes first (§4). Every approved home-screen concept in both Stitch versions leads with progress — hiding it would be a direct reversal of validated, approved direction.

## 2. Reward Before Trust

**Never:** showing a reward as available, close, or likely before the underlying verified record actually supports it.
**Why it's forbidden:** violates the platform's foundational structural rule (Product Experience Principles §1.2): nothing counts until the customer verifies it. A UI that implies otherwise — even optimistically, even briefly — breaks the one promise the entire product is built on. This is why TRD16 §16.48's Optimistic UI Policy explicitly forbids optimistic updates for customer verification, reward availability, and redemption.

## 3. Multiple Competing Actions

**Never:** two or more actions on one screen with equal visual weight, forcing the user to figure out which one the screen actually wants them to take.
**Why it's forbidden:** violates Design Principle "every screen has a primary action" (§3) and Experience Pillar "One Clear Next Action" (§2). Every approved Stitch concept — customer and business alike — resolves to one dominant action ("Scan to Earn," "Verify," "Accept This Gift," "Record Purchase"); this is tested, approved direction, not an aspiration.

## 4. Backend Terminology

**Never:** "Purchase Verification Lifecycle," "Customer-Verified Loyalty Engine," "Trust Ledger," "Reward Token," "state transition," "event," "immutable record," or any other internal architecture term, anywhere a customer or ordinary business user can see it.
**Why it's forbidden:** explicitly forbidden by TRD16 §16.42, restated in Product Experience Principles §6. Confirmed clean in every approved Stitch screen reviewed for this phase — zero instances of these terms were found in the exploration's copy.

## 5. Complex Workflows

**Never:** a flow that requires a customer to hold more than one new idea in their head at once, or a business flow with steps that don't map to a real operational need.
**Why it's forbidden:** violates "Reduce cognitive load" (Design Principles §3) and the Grandmother Test (Product Experience Principles §8.1) — if a first-time user needs training, the feature is wrong, not under-explained. The approved business purchase-recording flow (`concept_5_record_purchase`) is the model: scan, confirm amount, done — no unnecessary intermediate steps.

## 6. Unnecessary Confirmations

**Never:** a confirmation dialog on a routine, safe, or reversible action.
**Why it's forbidden:** violates "avoid unnecessary choices" (Design Principles §3) and Interaction Principles §5.1 — confirmations are reserved for genuinely costly, hard-to-undo actions (e.g. redemption), not sprinkled onto every tap out of caution.

## 7. Overloaded Dashboards

**Never:** a single screen (particularly business- or admin-facing) presenting more information than its Information Hierarchy (§4 of the Product Experience Principles) can support without burying the primary action or the day's most urgent item.
**Why it's forbidden:** even `concept_6_business_dashboard`, the exploration's most information-dense approved screen, keeps a clear lead item (Today's Total) and flags urgency explicitly (**URGENT** on pending verifications) rather than presenting an undifferentiated wall of data. A dashboard that makes the user hunt for what matters today has failed this pattern even if every individual number on it is accurate.

## 8. Reward Inflation

**Never:** language, badges, or visual weight that overstates what a reward actually is, or that implies exclusivity/status beyond what was genuinely earned.
**Why it's forbidden:** violates Experience Pillar "Celebrate Without Gimmicks" (§2) and the Constitution's Trust value ("trust is earned through transparency... every significant feature should increase trust"). **Watch point, disclosed rather than ignored:** the approved Version 2 redemption concept (`the_on_us_moment_reward_redemption`) uses premium/exclusive-tier language ("Executive Tier Benefit," "Lifetime Status") that sits close to this line. It was approved as part of Version 2, but future design work should monitor real customer response to this framing rather than assume it is risk-free — see [Design Decisions Register](design-decisions.md) §DEC-UX-004 for the explicit review trigger recorded against this.

## 9. Generic Gamification

**Never:** points, badges, streaks, leaderboards, or game-like mechanics borrowed from unrelated product categories with no connection to a real, verified customer relationship.
**Why it's forbidden:** the platform explicitly measures progress in Verified Units, not points, specifically to avoid the abstraction and manipulation associated with generic points systems (Design Decision Knowledge Base §3.1, "Clarity, Not Points"). The approved visual direction (`premium_verification_system/DESIGN.md`) states this outright: "avoiding any 'gamified' or childish visual tropes in favor of a sophisticated, editorial-grade interface." A future feature that introduces streaks, badges-for-badges'-sake, or leaderboard-style competitive display would contradict this approved direction directly.

## 10. How This List Is Used

Every new screen, component, or interaction proposal is checked against this list before it is approved — not as a formality, but the same way it was implicitly checked, and passed, across the approved Stitch exploration. An addition to this list follows the same governance path as any other Product Design document: proposed, reasoned, and recorded via the [Design Decisions Register](design-decisions.md), never silently added.

## 11. Relationship to Other Documents

- [Product Experience Principles](../01-product/product-experience-principles.md) — every anti-pattern above is that document's principles stated in the negative.
- [Design Decisions Register](design-decisions.md) §DEC-UX-004 — the specific, disclosed watch-point on Reward Inflation risk in the approved Recognition moment.
- [Moments That Matter](moments-that-matter.md) §7 — where the Reward Inflation watch-point is discussed in emotional-journey context.
