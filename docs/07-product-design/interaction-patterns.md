> **Title:** Interaction Patterns
> **Version:** 1.0 · **Status:** Active — governed design direction (mixed: Stitch-validated and governing-document-only, marked per pattern) · **Classification:** Authoritative Product (design)
> **Governing document:** [UX Direction](ux-direction.md); [Product Experience Principles](../01-product/product-experience-principles.md); TRD16
> **Source-of-truth path:** `docs/07-product-design/interaction-patterns.md`
> **Last controlled update:** 2026-07-17 (Phase 8 — created)

# Interaction Patterns

## 0. How to Read This Document

Each pattern below is marked **Stitch-validated** (an approved screen in `stitch/exploration-v1/` or `stitch/exploration-v2/` demonstrates it) or **Governing-document only** (specified in the Product Experience Principles / TRD16 but not yet shown in an approved Stitch screen — real, binding, but not yet visually explored). This distinction is preserved deliberately rather than presenting both as equally proven — a future design pass should prioritize exploring the governing-document-only patterns.

## 1. Verification — *Stitch-validated*

The platform's defining interaction (Product Experience Principles §1.2). The approved direction (`concept_2_purchase_verification` → refined in `signature_verification_experience`) shows: the merchant and amount, a plain statement of what's being asked ("Verify this purchase to earn progress"), and — in Version 2 specifically — an explicit trust explanation ("Why this matters:", "Verified Location Match," "Secure End-to-End Verification") placed directly beside the action, not hidden behind a help link. Verification is framed as quick and purposeful, never as an apologetic extra step (Experience Pillar "Verification Builds Trust").

## 2. Reward Redemption — *Stitch-validated*

`concept_4_reward_ready` → refined in `the_on_us_moment_reward_redemption`. The approved direction treats redemption as the platform's largest emotional beat (Emotional Design §7's "Achievement → Celebration"): warm, restrained language ("Accept This Gift," "Recognition of Loyalty") rather than transactional copy, delivered only once the redemption is server-confirmed (TRD16 §16.48 Optimistic UI Policy — redemption is never shown as successful before the authoritative result returns).

## 3. Waiting for You (Progress State) — *Stitch-validated*

The approved customer-facing state name for "a purchase needs your verification" (Product Experience Principles §6, TRD16 §16.42's approved vocabulary), shown in the exploration as **"Verification Required"** on the customer home (`concept_1_customer_home`, `refined_home_trust_first`). The pattern: the state is visible on the home screen itself, not buried in a notification the user might miss, and it is unambiguous — a customer never has to guess whether something needs their attention.

## 4. Notifications — *Stitch-validated*

`concept_8_notification_center`. Notifications are categorized by urgency ("Action Required" separated from informational items), each is actionable on its own ("Verify Now," "View Invitation" — never a bare headline with no next step), and the surface supports bulk dismissal ("Clear All") so it never becomes an unmanageable backlog. This matches Interaction Principles §5.5: a notification a user can't act on or understand on its own is a design defect.

## 5. Progress — *Stitch-validated*

`concept_3_loyalty_journey` → refined in `loyalty_journey_verified_units`. Progress is always shown as a concrete count against a concrete target — "Seventh Unit Verified," "STAMP 8 OF 10" — never an abstract percentage or unlabeled bar. Version 2 adds explicit per-unit timestamps ("Verified on Oct 12, 2023") and a named next reward, reinforcing that progress is a ledger of real, verified events (Product Experience Principles §1.2), not a synthetic score.

## 6. Business Purchase Recording — *Stitch-validated*

`concept_5_record_purchase`. Two customer-lookup paths are shown side by side: aligning the customer's QR code in a scan frame, or entering their code manually as a fallback ("Enter Code Manually") — consistent with Design Principle §3's "prefer recognition over recall" (scanning is the default; typing is the fallback, not the primary path). The flow ends with an explicit confirmation state ("Purchase Recorded") before returning the business user to their next transaction.

## 7. Customer Lookup — *Stitch-validated (as part of Business Purchase Recording, §6)*

The exploration does not test customer lookup as an independent screen — it appears exclusively inside the purchase-recording flow (§6 above): scan-first, manual-code fallback. No separate "search for a customer" interaction (e.g. by name or phone number) is shown in either exploration version; if that capability is needed, it is future design work, not something this document can document as approved.

## 8. Loading — *Governing-document only*

Not shown in either Stitch exploration version. TRD16 §16.44 remains the binding requirement: every asynchronous interaction defines initial loading, background refresh, empty, error, retry, and success states; skeletons or inline progress are preferred over indefinite spinners. Product Experience Principles §5.3 adds the philosophy: loading should never feel like uncertainty. A future Stitch pass should validate this concretely against real screens.

## 9. Errors — *Governing-document only*

Not shown in either Stitch exploration version. TRD16 §16.46–16.47 remain binding: standardized error codes and localized message keys, no raw stack traces, a customer-safe support reference derived from the correlation ID for unexpected failures. Product Experience Principles §5.2 adds the philosophy: an error states what happened, whose responsibility it is, and what to do next. This is a priority gap for the next design exploration pass, since error states are among the most trust-sensitive moments in the product.

## 10. Empty States — *Governing-document only*

Not shown in either Stitch exploration version. TRD16 §16.45 and Product Experience Principles §5.4 remain binding: an empty state explains what the section is for, why it's empty, and what to do next — never a blank screen with no words.

## 11. Search — *Governing-document only*

Not shown in either Stitch exploration version (the Search domain, per the [Version 1 Engineering Blueprint](../02-technical/version-1-engineering-blueprint.md) §3.1, has no dedicated concept). No search interaction pattern is approved yet; this is future design work.

## 12. Priority for Future Exploration

Of the patterns marked *Governing-document only*, **Errors** and **Empty States** should be prioritized in the next Stitch pass — both are moments where the platform's trust promise (Product Experience Principles §1.2) is most at risk if handled poorly, and neither has been visually validated yet.

## 13. Relationship to Other Documents

- [UX Direction](ux-direction.md) §5 — the interaction philosophy these patterns implement.
- [Trust Indicators](trust-indicators.md) — the specific trust-language vocabulary used within the Verification and Progress patterns above.
- [Moments That Matter](moments-that-matter.md) — the emotional-journey documentation for Verification and Redemption specifically as major moments, not just interaction mechanics.
- TRD16 (Frontend and PWA Architecture) §16.44–16.48 — the binding technical requirements for the governing-document-only patterns.
