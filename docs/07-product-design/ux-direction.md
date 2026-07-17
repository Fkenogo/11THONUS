> **Title:** UX Direction
> **Version:** 1.0 · **Status:** Active — governed design direction (approved) · **Classification:** Authoritative Product (design)
> **Governing document:** [Product Experience Principles](../01-product/product-experience-principles.md); Platform Constitution
> **Source-of-truth path:** `docs/07-product-design/ux-direction.md`
> **Last controlled update:** 2026-07-17 (Phase 8 — created)

# UX Direction

## 0. Status

This document captures the UX direction the Founder and ChatGPT Technical Lead approved in Version 2 of the Stitch exploration ([`stitch/exploration-v2/`](stitch/exploration-v2/)). It is documentation of an **approved** direction, not a proposal — the design work itself is complete for this exploration; what follows is the permanent record of what was approved and why, so future designers and engineers inherit the reasoning, not just the pixels. Nothing here overrides the [Product Experience Principles](../01-product/product-experience-principles.md) — every statement below is that document's philosophy applied to what the Stitch exploration actually tested and validated.

## 1. Overall Philosophy

The exploration confirms, in concrete screens, what the Product Experience Principles state in the abstract: **11thONUS earns trust before it offers reward.** Version 1 of the exploration tested the platform's core screens functionally — could a customer see their progress, verify a purchase, get a reward, navigate the app. Version 2 took the same screens and asked a sharper question: *does this feel earned, and does it feel true?*

The visual language that emerged and was approved (`stitch/exploration-v2/premium_verification_system/DESIGN.md`) organizes the entire interface around three functional colors, each tied to a stage of the Emotional Design arc in the Product Experience Principles (§7): **Trust (near-black)** for institutional reliability and core navigation, **Progress (orange)** for active tasks and accumulation, **Reward (gold)** reserved exclusively for achievement and redemption. A color is never decorative in this system — it is load-bearing information, consistent with Accessibility Principle §8's "color is never the only indicator" (the system pairs each color with text/iconography, never color alone).

The approved aesthetic is described in its own words as **"High-End Minimalism"** — restrained, editorial, avoiding "gamified or childish visual tropes." This is the visual expression of "Simple Beats Clever" and "Celebrate Without Gimmicks" (Product Experience Principles §2): confidence communicated through restraint, not through decoration.

## 2. Information Hierarchy

Version 2's screens consistently confirm the Product Experience Principles §4 hierarchy in practice:

1. **Current state first.** `refined_home_trust_first`'s customer home leads with the user's Verified Units progress and next milestone before anything else — not a hero banner, not a promotional module.
2. **The one primary action, immediately reachable.** "Scan to Earn" appears as the dominant action across the customer home, purchase verification, and record-purchase concepts — never competing with a secondary action of equal visual weight.
3. **Context that explains the state.** `signature_verification_experience` shows *why* a purchase is trustworthy ("Verified Location Match," "Secure End-to-End Verification") directly beside the verification action, not buried in a help screen.
4. **Recent history, secondary.** "Recent Activity," with real timestamps ("Oct 08," "Yesterday"), sits below the primary progress module on the customer home — present, but never competing with it.
5. **Nothing engineering-facing appears anywhere.** No screen in either exploration version exposes a state name, an event, or an internal identifier — confirming Language Principles §6 held throughout the exploration, not just in written guidance.

## 3. Navigation Direction

See [Navigation Model](navigation-model.md) for the full documented structure. At the philosophy level: navigation stays shallow and task-first. `concept_9_navigation_model` explicitly tested a "Task-First Dashboard" alternative to a conventional tab bar, and the approved direction (visible in the Version 2 concepts) kept a simple, persistent bottom structure — Home, Scan, Rewards, Activity, Account — rather than the deeper, list-heavy alternative. This favors "one clear next action" (Product Experience Principles §2) over exposing every possible destination at once.

## 4. Screen Philosophy

Every approved screen in Version 2 follows the same shape: a state at the top, one primary action, supporting context, and a clear path back to history or navigation. No screen in the approved exploration presents two visually-equal calls to action, confirming Design Principle §3's "every screen has a primary action" was tested, not just stated. Business-facing screens (`concept_6_business_dashboard`) carry more information density than customer screens by necessity (a live operations view), but even there, the hierarchy holds: today's totals and pending/urgent items lead, historical transaction detail follows.

## 5. Interaction Philosophy

Interaction in the approved direction is quiet and consequential rather than showy. Verification interactions state plainly what's being checked and why it matters ("Why this matters:", `signature_verification_experience`); progress interactions show a concrete count against a concrete target ("Seventh Unit Verified," "STAMP 8 OF 10") rather than an abstract bar with no number; and the platform's single largest emotional interaction — reward redemption — is treated with restraint (`the_on_us_moment_reward_redemption`'s "Accept This Gift," "Recognition of Loyalty") rather than a burst of celebratory noise. See [Interaction Patterns](interaction-patterns.md) for the full pattern-by-pattern documentation.

## 6. Future Evolution

This UX direction is approved as the Version 2 baseline, not a permanent, unchangeable artifact. Three things are explicitly expected to evolve it further, none of which are decided here:

- **Admin navigation and screens were not explored in either Stitch version.** No admin concept exists in the source material; this is a disclosed gap (see [Navigation Model](navigation-model.md) §5), not an oversight to be silently filled in later.
- **The future Platform Design System** (Product Experience Principles §10) will take this direction's visual language (color roles, typography, spacing, shape) and formalize it into reusable design tokens and components — the `premium_verification_system/DESIGN.md` specification is the natural starting input for that work, not a finished design system itself.
- **New moments and flows** (e.g. dispute handling, subscription management, multi-branch business views) will need their own exploration passes as they're scoped; this document's principles apply to them by extension, but no screen for them has been approved yet.

## 7. Relationship to Other Documents

- [Product Experience Principles](../01-product/product-experience-principles.md) — the philosophy this direction is a concrete expression of; where they ever appear to differ, the Principles govern.
- [Navigation Model](navigation-model.md), [Interaction Patterns](interaction-patterns.md), [Moments That Matter](moments-that-matter.md), [Trust Indicators](trust-indicators.md), [Design Anti-Patterns](design-anti-patterns.md) — the detailed documents this overview summarizes.
- [Design Decisions Register](design-decisions.md) — the specific approved choices (including how Version 1 and Version 2 concepts were matched) with reasons, alternatives, and review triggers.
- [`stitch/exploration-v1/`](stitch/exploration-v1/), [`stitch/exploration-v2/`](stitch/exploration-v2/) — the approved source assets this document describes.
