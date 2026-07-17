> **Title:** Navigation Model
> **Version:** 1.0 · **Status:** Active — governed design direction (approved, with one disclosed gap) · **Classification:** Authoritative Product (design)
> **Governing document:** [UX Direction](ux-direction.md); [Product Experience Principles](../01-product/product-experience-principles.md)
> **Source-of-truth path:** `docs/07-product-design/navigation-model.md`
> **Last controlled update:** 2026-07-17 (Phase 8 — created)

# Navigation Model

## 0. Status and Method

This document records the navigation structure actually present in the approved Stitch exploration ([`stitch/exploration-v1/`](stitch/exploration-v1/), [`stitch/exploration-v2/`](stitch/exploration-v2/)), not an invented ideal. Where the exploration does not cover a surface (administration navigation), this document says so explicitly rather than filling the gap with an unapproved guess.

## 1. Primary Navigation (Customer)

A persistent bottom navigation bar, present on every customer-facing concept in both exploration versions:

**Home · Scan · Rewards · Activity · Account**

This structure was directly tested as an explicit alternative in `concept_9_navigation_model` ("Task-First Dashboard," offering a richer set — My Progress, Rewards Hub, Activity History, Preferences, Nearby Partners) and the simpler five-item bar was the direction carried forward into Version 2 (`refined_home_trust_first` and its siblings all use the shorter bar) — see [Design Decisions Register](design-decisions.md) §DEC-UX-002 for the reasoning.

- **Home** — the customer's current state: progress toward their next reward, recent activity, next milestone. The default landing surface.
- **Scan** — the single most important action in the app (verifying or initiating a purchase); placed centrally and persistently rather than buried in a menu, consistent with Product Experience Principles §2 "One Clear Next Action."
- **Rewards** — available and past rewards; where an On Us Moment is claimed.
- **Activity** — purchase and verification history.
- **Account** — profile, preferences, and settings; the least frequently needed item, placed last.

## 2. Secondary Navigation (Customer)

Within each primary section, secondary navigation is contextual rather than a second persistent bar — e.g. "View All" from a truncated Recent Activity list (`concept_1_customer_home`, `refined_home_trust_first`), or drilling from a Rewards list into a specific reward's detail (`concept_4_reward_ready`, `the_on_us_moment_reward_redemption`). No concept in either version introduces a second persistent navigation layer — this keeps navigation shallow, consistent with the UX Direction §3 principle of favoring one clear action over exposing every destination at once.

## 3. Customer Navigation — Summary

| Level | Items | Source |
|---|---|---|
| Primary (persistent) | Home, Scan, Rewards, Activity, Account | All customer concepts, both versions |
| Secondary (contextual) | View All / history drill-in, reward detail drill-in | `concept_1_customer_home`, `refined_home_trust_first`, `concept_4_reward_ready` |
| Rejected alternative | Task-first dashboard with 5+ persistent items (My Progress, Rewards Hub, Activity History, Preferences, Nearby Partners) | `concept_9_navigation_model` — tested, not carried forward to Version 2 |

## 4. Business Navigation

`concept_6_business_dashboard` is the only business-facing concept in the exploration. It reuses the same bottom-navigation shape as the customer surface (Home, Activity, Rewards, Scan) rather than introducing a distinct business-specific tab structure, plus a lightweight top-level nav (`<nav class="flex gap-6">`) for desktop/wider viewports. The dashboard itself — Today's Total, Pending Verifications (flagged **URGENT** where applicable), New Customers, Recent Transactions, Merchant Snapshot — is reached from Home, not from a separate business-only navigation layer.

**Gap, disclosed rather than filled:** the exploration does not test a business surface distinct enough to justify its own navigation model beyond reusing the customer shell with different Home content. Whether business users (particularly Owners managing multiple branches, per PRD1 §8) need a genuinely separate navigation structure is not answered by this exploration and is not decided here — it is future design work, not an oversight in this document.

## 5. Admin Navigation — Not Explored (Disclosed Gap)

**No administration concept exists in either Stitch exploration version.** Neither `exploration-v1/` nor `exploration-v2/` contains a screen representing the Administration domain (platform governance, support cases, feature flags — per the [Version 1 Engineering Blueprint](../02-technical/version-1-engineering-blueprint.md) §3.1). This document does not invent one. Administration navigation remains open design work, to be explored in a future pass and documented here once approved — consistent with this whole document's rule of recording only what was actually approved.

## 6. Navigation Principles

- **Shallow over deep.** No customer or business flow in the approved direction requires more than two navigation levels (primary bar → contextual drill-in) to reach any screen tested.
- **The primary action is always reachable.** "Scan" is present on every customer and business screen's navigation bar — never a destination the user has to hunt for.
- **Navigation never competes with the screen's primary action.** The bottom bar is persistent chrome, visually subordinate to whatever the current screen's one primary action is (Product Experience Principles §3).
- **Icon plus label, not icon alone.** Every navigation item in the approved concepts pairs an icon with a text label — consistent with Accessibility Principles §8's "color is never the only indicator" applied to iconography generally: meaning is never carried by a symbol alone.
- **Navigation state is always obvious.** The active tab is visually distinct in every concept reviewed — a user is never left wondering which section they're currently in.

## 7. Relationship to Other Documents

- [UX Direction](ux-direction.md) §3 — the philosophy this structure implements.
- [Design Decisions Register](design-decisions.md) §DEC-UX-002 — the specific decision to carry forward the five-item bar over the task-first alternative.
- [Product Experience Principles](../01-product/product-experience-principles.md) §3–4 — the design and information-hierarchy principles this navigation model expresses.
