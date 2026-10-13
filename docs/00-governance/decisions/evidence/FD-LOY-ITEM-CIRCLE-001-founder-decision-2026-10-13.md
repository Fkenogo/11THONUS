# FD-LOY-ITEM-CIRCLE-001 — Item-Specific Loyalty Circles

> **Status:** Founder decision recorded 2026-10-13  
> **Decision authority:** Founder  
> **Scope:** Product truth and loyalty identity; this record does not authorize implementation.

## Decision

1. A Verified Unit represents the verified quantity of one specific qualifying item.
2. A Reward Programme may contain one or more qualifying items.
3. Each qualifying item in a Reward Programme has its own independent customer Loyalty Circle and reward progression.
4. Verified Units from different qualifying items must never be pooled in one Loyalty Circle.
5. The 10+1 relationship is item-specific: ten verified units of one qualifying item make a reward available for that item and Circle.
6. The Reward Programme remains the business-defined grouping/container. A Loyalty Circle is the customer's earn-and-redeem progression for one qualifying item within that Programme.
7. One Programme may therefore contain multiple Circles for one customer.
8. Existing permission, verification, redemption, and trust principles remain unchanged unless architecture proves a required structural consequence.
9. This decision supersedes implementation interpretations that combine all qualifying items in a Programme into one customer Circle. It does not revoke the rule that a Programme may contain multiple qualifying items.

Examples include Express Styling (Blow-dry Circle; Hair Wash Circle), Premium Cut (Braiding Circle; Haircut Circle), and Sparkle Wash (Basic Wash Circle; Full Detail Circle).

## Authority relationship

This is a new Founder decision clarifying the identity boundary of the Loyalty Cycle/Circle. `FD-REWARD-QUALIFYING-ITEM-001` / `DEC-LOY-016` continues to authorize Business-defined qualifying items and multiple items per Programme. `DEC-LOY-017` continues to govern who manages those items. Neither decision approves pooling. Programme-level pooling in the current engine is an implementation consequence of its key structure, not an explicit Founder Product Truth decision.

## Implementation boundary

This record does not authorize runtime code, database schema or migrations, preview fixtures, PR #307 or PR #310 changes, ITR, or Slices C/D/E. B3 UX corrections and Founder unified regression remain paused pending architecture review and separate implementation authorization.
