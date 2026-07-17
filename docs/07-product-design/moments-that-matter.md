> **Title:** Moments That Matter
> **Version:** 1.0 · **Status:** Active — governed design direction (mixed: Stitch-validated and governing-document-only, marked per moment) · **Classification:** Authoritative Product (design)
> **Governing document:** [UX Direction](ux-direction.md); [Product Experience Principles](../01-product/product-experience-principles.md) §7
> **Source-of-truth path:** `docs/07-product-design/moments-that-matter.md`
> **Last controlled update:** 2026-07-17 (Phase 8 — created)

# Moments That Matter

## 0. Purpose

"Moment that Matters" is not an invented label for this document — it appears verbatim as approved UI copy in `stitch/exploration-v2/loyalty_journey_verified_units/code.html`. This document takes that phrase seriously and applies it systematically to every major emotional beat in the customer journey (Product Experience Principles §7's Trust → Confidence → Progress → Achievement → Celebration arc), documenting each with its purpose, desired emotion, UX objective, and success criteria. As in [Interaction Patterns](interaction-patterns.md), each moment is marked **Stitch-validated** or **Governing-document only**.

## 1. Registration — *Governing-document only*

- **Purpose:** get a new customer into the platform with the least possible friction, establishing the first thread of trust.
- **Desired emotion:** ease, not scrutiny — registering should feel like being welcomed, not interrogated.
- **UX objective:** collect only what's required to create the account and prove identity (per TRD16 §16.37 Progressive KYC — account creation, authentication, identity, language, legal consent); everything else is requested later, optionally, framed by its value ("Add your birthday so we can help businesses celebrate with you").
- **Success criteria:** a first-time smartphone user completes registration without help, in one sitting, and understands immediately what they now have access to. No Stitch concept currently validates this screen — a priority for the next exploration pass, since it is the customer's literal first impression of the platform's promise (Product Experience Principles §1.2).

## 2. First Purchase — *Governing-document only*

- **Purpose:** the customer's loyalty record begins.
- **Desired emotion:** anticipation — "this is starting to count."
- **UX objective:** make it unmistakable that this purchase is now part of something (a Reward Program, a progress count) rather than a one-off transaction.
- **Success criteria:** the customer, without being told, understands that a specific business relationship has just begun accumulating value. Not yet Stitch-validated.

## 3. First Verification — *Stitch-validated*

- **Purpose:** the customer's first direct experience of the platform's core mechanic — confirming their own purchase (Product Experience Principles §1.2).
- **Desired emotion:** a small, clear moment of agency — "I confirmed this, and now it counts."
- **UX objective:** shown in `signature_verification_experience`: state plainly what's being verified, why it matters ("Secure End-to-End Verification," "Verified Location Match"), and resolve quickly to a confirmed state ("Purchase Verified!").
- **Success criteria:** the customer understands, from this single interaction, that their confirmation is what makes progress real — not a formality, but the mechanism itself.

## 4. Progress — *Stitch-validated*

- **Purpose:** sustain motivation across the many purchases between "first verification" and "reward earned" (Experience Pillar "Progress Should Motivate").
- **Desired emotion:** steady forward momentum, never stagnation or ambiguity about where things stand.
- **UX objective:** shown in `loyalty_journey_verified_units`: a concrete unit count against a concrete target ("Seventh Unit Verified," "Next Unit"), each with its own verified timestamp, so progress reads as a real accumulating record, not a synthetic score.
- **Success criteria:** a customer can state, without opening the app, roughly how close they are to their next reward — because the last time they checked, it was unambiguous.

## 5. Reward Earned — *Stitch-validated*

- **Purpose:** the threshold moment — the tenth Verified Unit resolves and a reward becomes available (`concept_4_reward_ready`, "Reward Unlocked").
- **Desired emotion:** achievement — a distinct, unmistakable "I did it," separate from ordinary progress updates.
- **UX objective:** mark this moment as visually and emotionally different from every prior progress update it followed — not just a bar reaching 100%, but a clear state change the customer would notice even glancing at their phone.
- **Success criteria:** a customer immediately knows a reward is now available to them, without needing to compare a number against a target themselves.

## 6. Reward Redeemed — *Stitch-validated*

- **Purpose:** the platform delivers on its promise — the earned reward is actually claimed (`the_on_us_moment_reward_redemption`).
- **Desired emotion:** genuine warmth and closure — "this one's on us," meant sincerely (Constitution Article 2).
- **UX objective:** restrained, human language ("Accept This Gift") rather than transactional confirmation copy; the celebration itself is brief and never delays or precedes the server-confirmed result (TRD16 §16.48, §16.65).
- **Success criteria:** the customer's overriding feeling on this screen is gratitude and trust reinforced, not merely "transaction complete."

## 7. Recognition — *Stitch-validated*

- **Purpose:** acknowledge sustained loyalty specifically, beyond the mechanics of any single reward (`the_on_us_moment_reward_redemption`'s "Recognition of Loyalty," "Executive Tier Benefit").
- **Desired emotion:** being known and valued as a specific, real customer — not an anonymous account that hit a threshold.
- **UX objective:** language and framing that acknowledge the *relationship*, not just the transaction — while staying inside the Experience Pillar "Celebrate Without Gimmicks": recognition is warm and specific, never inflated into a loyalty-tier marketing performance (see [Design Anti-Patterns](design-anti-patterns.md) §"Reward Inflation" — this is a point future design work should watch, since premium/exclusive-tier language, while present in the approved Version 2 concept, sits close to that line and should be reviewed against real customer response before broader rollout — see [Design Decisions Register](design-decisions.md) §DEC-UX-004).
- **Success criteria:** a customer feels individually recognized without the platform ever implying a reward was anything other than fairly and transparently earned.

## 8. Customer Appreciation — *Governing-document only*

- **Purpose:** moments outside the core verify-progress-redeem loop where the platform or a business expresses appreciation independent of a specific transaction (e.g. a milestone anniversary, a birthday, a returning-after-absence moment).
- **Desired emotion:** being remembered, not marketed to.
- **UX objective:** per Progressive KYC's value-led prompt model (TRD16 §16.37) and the Notification pattern (Interaction Patterns §4), any appreciation moment is specific and optional to engage with, never a generic promotional push.
- **Success criteria:** not yet defined by an approved screen — this moment has no Stitch concept yet and is future design work.

## 9. Relationship to Other Documents

- [Interaction Patterns](interaction-patterns.md) — the mechanical "how" for Verification (§1) and Redemption (§2) that this document gives emotional purpose to.
- [Trust Indicators](trust-indicators.md) — the specific trust vocabulary used within First Verification and Progress.
- [Product Experience Principles](../01-product/product-experience-principles.md) §7 — the Trust → Confidence → Progress → Achievement → Celebration arc this document maps its eight moments onto.
- [Design Decisions Register](design-decisions.md) §DEC-UX-004 — the disclosed watch-point on premium/exclusive-tier language in the Recognition moment.
