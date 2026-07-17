> **Title:** Trust Indicators
> **Version:** 1.0 · **Status:** Active — governed design direction (mixed: Stitch-validated and governing-document-only, marked per indicator) · **Classification:** Authoritative Product (design)
> **Governing document:** [UX Direction](ux-direction.md); [Product Experience Principles](../01-product/product-experience-principles.md) §6
> **Source-of-truth path:** `docs/07-product-design/trust-indicators.md`
> **Last controlled update:** 2026-07-17 (Phase 8 — created)

# Trust Indicators

## 0. Purpose

Trust language is the platform's most important recurring vocabulary — it is the visible proof of Constitution Pillar Two ("customer verification shall remain the foundation of loyalty progression") on every screen that uses it. This document catalogs the trust-indicator patterns and marks each **Stitch-validated** (approved copy actually appears in the exploration) or **Governing-document only** (specified in principle but not yet shown in an approved screen), so future design work knows exactly which indicators have real, tested wording to build from.

## 1. Verified Purchase — *Stitch-validated*

Appears as "Verified Purchase" (`signature_verification_experience`) and "Purchase Verified" / "Purchase Verified!" (`concept_2_purchase_verification`, `refined_home_trust_first`). Used at the moment a purchase transitions from awaiting the customer's confirmation to confirmed — always paired with a timestamp (§7) and, in Version 2, a supporting reason ("Verified Location Match").

## 2. Verified Customer — *Stitch-validated*

Appears as "Customer Verified" (`refined_home_trust_first`). Used as a persistent trust badge on the customer's own home screen — signaling to the customer themselves (not just to the business) that their identity and activity are part of a verified, accountable record, not an anonymous account.

## 3. Business Verified — *Governing-document only*

Does not appear as approved copy in either exploration version — no screen currently shows a business-facing "verified" badge equivalent to the customer-side indicators above. The Constitution's Trust value applies equally to businesses (Article 5: "businesses should trust that operational history is accountable"), so this indicator is expected, but it has not yet been designed. Future exploration should test how a business's own verification/standing is communicated, if at all, to customers.

## 4. Reward Guaranteed — *Governing-document only*

Does not appear as approved copy. The closest validated concept is "Reward Unlocked" (`concept_4_reward_ready`) — availability, not a forward-looking guarantee. Given the Design Anti-Patterns register's caution against "Reward Inflation" (see [Design Anti-Patterns](design-anti-patterns.md)), language implying a *guarantee* ahead of an actual earned threshold should be treated carefully in any future exploration — a reward is never promised before it is earned (Product Experience Principles §1.2's "the platform never fabricates progress").

## 5. Pending Verification — *Stitch-validated*

Appears verbatim as "Pending Verification" (`signature_verification_experience`, `concept_8_notification_center`). Used for a purchase that has been recorded by a business but not yet confirmed by the customer — the platform's honest "not yet real" state, always distinct in treatment from a confirmed "Verified Purchase" (§1).

## 6. Verification Complete — *Governing-document only*

Not present verbatim in either exploration version. The closest validated equivalent is the exclamation-marked confirmation "Purchase Verified!" (§1), which functions the same way. A future design pass may choose to standardize on one phrasing; this document does not decide which — see [Design Decisions Register](design-decisions.md) for how such a choice, once made, is recorded.

## 7. Timestamp — *Stitch-validated*

Every verification and activity entry in the approved exploration carries a visible timestamp — relative where recent ("Yesterday," "Today, Oct 24"), absolute where historical ("Verified on Oct 12, 2023," "Oct 08"). A trust claim without a timestamp does not appear anywhere in the approved concepts — this is a consistent, load-bearing pattern, not incidental detail. It is the concrete expression of Constitution value "Accountability": every important action remains historically visible.

## 8. Merchant Identity — *Stitch-validated*

Every purchase- and verification-related screen names the specific business plainly ("Blue Bottle Coffee," "Urban Grind Coffee," "Green Table Bistro"), and `signature_verification_experience` additionally shows the merchant's physical location ("San Francisco, CA 94103"). Trust is never abstract in the approved direction — the customer always knows exactly which business relationship a given piece of progress or history belongs to.

## 9. Customer Confirmation — *Stitch-validated*

The verification action itself (§1, Interaction Patterns §1) is the platform's customer-confirmation mechanism, and the approved direction makes the act of confirming visually and linguistically distinct from a passive "view" action — verification requires a deliberate tap, never an automatic or ambient state change, consistent with Constitution Pillar Two.

## 10. Summary Table

| Indicator | Status | Approved copy (if any) |
|---|---|---|
| Verified Purchase | Stitch-validated | "Verified Purchase," "Purchase Verified" |
| Verified Customer | Stitch-validated | "Customer Verified" |
| Business Verified | Governing-document only | — |
| Reward Guaranteed | Governing-document only | — (treat cautiously — see Design Anti-Patterns) |
| Pending Verification | Stitch-validated | "Pending Verification" |
| Verification Complete | Governing-document only | closest equivalent: "Purchase Verified!" |
| Timestamp | Stitch-validated | relative + absolute, always present |
| Merchant Identity | Stitch-validated | business name + location |
| Customer Confirmation | Stitch-validated | the verification action itself |

## 11. Relationship to Other Documents

- [Interaction Patterns](interaction-patterns.md) §1 — the Verification interaction these indicators appear within.
- [Design Anti-Patterns](design-anti-patterns.md) — why "Reward Guaranteed"-style language must be handled carefully.
- [Product Experience Principles](../01-product/product-experience-principles.md) §6 — the Language Principles this vocabulary must stay consistent with.
