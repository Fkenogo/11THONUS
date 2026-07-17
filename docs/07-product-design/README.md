> **Title:** Product Design — Section Index
> **Version:** 1.0 · **Status:** Active · **Classification:** Authoritative Product (design)
> **Governing document:** [Product Experience Principles](../01-product/product-experience-principles.md)
> **Source-of-truth path:** `docs/07-product-design/README.md`
> **Last controlled update:** 2026-07-17 (Phase 8 — created)

# Product Design

This section is the permanent home for 11thONUS's **approved** design direction — the point where the [Product Experience Principles](../01-product/product-experience-principles.md)' philosophy meets an actual, reviewed UX exploration. It exists to guide every future designer and frontend engineer without requiring them to re-derive the reasoning behind the approved direction from scratch.

**This is documentation of what was already reviewed and approved, not a live design workspace.** Changes to the approved direction go through the same disclosed, evidence-based reasoning this section already models (see [Design Decisions Register](design-decisions.md)) — never a silent edit.

## Documents

- **[UX Direction](ux-direction.md)** — overall philosophy, information hierarchy, navigation direction, screen philosophy, interaction philosophy, future evolution.
- **[Navigation Model](navigation-model.md)** — primary/secondary/customer/business navigation, and the disclosed gap in admin navigation.
- **[Interaction Patterns](interaction-patterns.md)** — verification, redemption, waiting-for-you, notifications, progress, business purchase recording (Stitch-validated), plus loading/errors/empty-states/search (governing-document-only, priority gaps for future exploration).
- **[Moments That Matter](moments-that-matter.md)** — the eight major emotional moments in the customer journey, each with purpose, desired emotion, UX objective, and success criteria.
- **[Trust Indicators](trust-indicators.md)** — the recurring trust-language vocabulary (Verified Purchase, Pending Verification, timestamps, merchant identity, and more).
- **[Design Anti-Patterns](design-anti-patterns.md)** — what must never appear, each traced to a specific Constitution value or Experience Pillar it would violate.
- **[Design Decisions Register](design-decisions.md)** — the major UX decisions embedded in the approved exploration, with reasons, alternatives, dependencies, and future review triggers.

## Approved Source Material

- **[`stitch/exploration-v1/`](stitch/exploration-v1/)** — the initial systematic exploration pass (8 concepts).
- **[`stitch/exploration-v2/`](stitch/exploration-v2/)** — the reviewed and approved refinement pass (4 refined concepts + the `premium_verification_system` design-system specification).
- **[`stitch/archive/`](stitch/archive/)** — one unlabeled/orphan asset, preserved rather than guessed into a version.

Moved from its original location (`docs/stitch/`) in Phase 8 — see [Design Decisions Register](design-decisions.md) §DEC-UX-001 for exactly how each Version 1 concept was matched to its Version 2 counterpart.

## What This Section Is Not

- **Not a UI specification, component library, or design system.** It documents approved *direction*; the future Platform Design System (Product Experience Principles §10) will formalize it into tokens, components, and reusable patterns.
- **Not a place for new UX design work.** Redesign happens elsewhere (a future exploration phase) and is documented here only once approved, following the same pattern established by Version 1 → Version 2.
- **Not an override of the Product Experience Principles, PRD, or TRD.** Every document in this section is subordinate to those; where any appear to conflict, the higher document governs and this section is corrected.

## Relationship to Other Documents

- [Product Experience Principles](../01-product/product-experience-principles.md) — the philosophy every document here operationalizes.
- [Platform Constitution](../00-governance/platform-constitution.md) — the ultimate source of the Trust/Simplicity/Transparency/Accountability/Inclusivity values this section's decisions repeatedly cite.
- TRD16 (Frontend and PWA Architecture) — the binding technical requirements several documents here cross-reference (loading, errors, empty states, accessibility, motion).
- [Documentation Manifest v1](../00-governance/documentation-manifest-v1.md) — where this section's documents are now inventoried.
