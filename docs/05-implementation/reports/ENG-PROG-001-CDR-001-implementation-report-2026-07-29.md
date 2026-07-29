> **Title:** ENG-PROG-001 — Capability Delivery Roadmap (CDR-001) Formalisation — Implementation Report
> **Status:** Complete. New execution-layer document created; no existing approved document modified.
> **Date:** 2026-07-29
> **Classification:** Documentation-only. No application code, no architecture change, no new engineering work package, no requirement or decision created or altered.

# ENG-PROG-001 — Capability Delivery Roadmap (CDR-001) Formalisation — Implementation Report

## 1. Objective

Formalise a Capability Delivery Roadmap (CDR-001) — a new, execution-layer document that bridges the Product Definition and the Engineering Implementation Programme by re-expressing the 47 already-approved engineering work packages as ten sequenced, customer-facing (or platform-facing) capabilities, each traceable to a specific product journey. Per the task brief: not a redesign of the Product Definition or the Engineering Implementation Programme, and no new engineering work package.

## 2. Required Analysis Performed (Before Writing)

1. **Product Definition** — read `docs/01-product/prd/00-product-foundation.md` (1258 lines): Product Vision (§4), ONUS Principles (§11), Core Loyalty Model (§13), Customer Verification Model (§14), and the existing role-based "Capabilities" terminology (§Customer/Business Owner/Manager/Staff/Super Admin Capabilities, ~line 915) — a different concept from this document's capability-delivery-sequence usage, explicitly disambiguated in CDR-001 §1.
2. **Engineering Implementation Programme** — re-read the full 17-phase, 47-work-package structure (`docs/05-implementation/change-tracking/engineering-implementation-programme.md`), already familiar from this session's prior work, cross-verified against the live Coding-Agent Prompt Register's flat `ENG-Pn-xxx` table for exact titles, requirement IDs, and current status.
3. **Approved customer journeys** — `docs/07-product-design/moments-that-matter.md` (8 governed emotional-journey moments, each marked Stitch-validated or governing-document-only) is the repository's actual journey document; `docs/07-product-design/interaction-patterns.md` supplements it for mechanical flow detail.
4. **Google Stitch design references** — `docs/07-product-design/stitch/exploration-v1/` (8 concepts) and `exploration-v2/` (5 refined concepts + `premium_verification_system` design spec), governed by `docs/07-product-design/README.md` and `design-decisions.md`, which are already explicit that this material is implementation *reference*, not specification — CDR-001 §8 restates rather than overrides that framing.
5. **Capability-to-work-package alignment** — cross-referenced every one of the 47 work packages' titles and requirement IDs directly from the live Prompt Register table (verbatim `grep` of all `| ENG-P` rows) before assigning it to a capability, to avoid inventing or misremembering scope.
6. **Decision Dependency verification** — independently re-checked `DEC-SEC-001`, `DEC-DATA-007`, `DEC-PROV-004`, `DEC-ID-003` against the live Decision Register before citing their status in CDR-001 §4 (Capability 2); confirmed all four are open (`OPEN_ENGINEERING` ×2, `OPEN_PROVIDER`, `OPEN_FOUNDER`) rather than assumed.

The proposed structure (capability-to-phase mapping, repository location, and rationale for each) was stated in chat before the document was created, per the task's own Required Analysis step 6.

## 3. Structure and Placement Decision

**Repository location:** `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` — a new subfolder alongside the existing `change-tracking/`, `prompts/`, and `reports/` subfolders already under `docs/05-implementation/` (the section whose own stated role is execution/implementation tracking). This satisfies the "maintain the current repository architecture" constraint (no new top-level numbered section invented) while giving CDR-001 its own distinct home, separate from `change-tracking/` (reserved for the two continuously-updated tracker documents — the Programme and Prompt Register).

**Capability-to-phase mapping (summary; full detail in CDR-001 §4/§7):**

| Capability | Programme Phase(s) | Work Packages |
|---|---|---|
| 0 — Engineering Foundation | Phase 0 | `ENG-P0-001`, `ENG-P0-002` |
| 1 — Platform Foundation | Phase 1 | `ENG-P1-001`, `ENG-P1-002`, `ENG-P1-003` |
| 2 — Customer Identity | Phase 2 (customer slice) | `ENG-P2-001`, `ENG-P2-004` |
| 3 — Business Identity | Phase 2 (business slice) + Phase 3 | `ENG-P2-002`, `ENG-P2-003`, `ENG-P2-004`, `ENG-P3-001..003` |
| 4 — First Verified Purchase | Phase 5 + Phase 6 | `ENG-P5-001..003`, `ENG-P6-001..003` |
| 5 — Progress Tracking | Phase 7 | `ENG-P7-001..003` |
| 6 — First Reward | Phase 8 | `ENG-P8-001`, `ENG-P8-002` |
| 7 — Business Operations | Phase 9 + Phase 10 + Phase 11 | `ENG-P9-001..003`, `ENG-P10-001..003`, `ENG-P11-001..003` |
| 8 — Platform Operations | Phase 12 + Phase 14 | `ENG-P12-001..002`, `ENG-P14-001..003` |
| 9 — Platform Optimisation | Phase 13 | `ENG-P13-001..003` |

Phase 4 (Reward Program Management) is noted in CDR-001 §7 as a business-authoring precondition for Capability 5 rather than re-tabled under any single capability, to avoid double-counting against Phase 3's own parallel sequencing. Phase 15 (Pilot) and Phase 16 (Production Launch) are treated as milestone-level, not capability-level, and appear only in CDR-001 §6.

`ENG-P2-004` (role context and permission resolution) is shared between Capability 2 and Capability 3, since it underlies both customer and business role resolution — disclosed as a shared dependency in both capability entries rather than assigned exclusively to one.

## 4. Deliverable Summary

Created `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` — 286 lines, 11 sections (the 10 required by the task brief plus an added §11 disclosing this task's own constraint set, for transparency): Purpose; Relationship to Existing Documents (with ASCII traceability diagram); Guiding Principles; Capability Delivery Model (all 10 capabilities, each with objective/customer outcome/journey/work packages/dependencies/validation outcome/milestone contribution); Capability Timeline (ASCII progression diagram); Milestone Structure (Milestone A fully specified; three future milestones named but explicitly left unspecified); Engineering Work Package Mapping table; Stitch Usage Guidance; Definition of Capability Completion; Future Engineering Prompt Standard.

## 5. Validation Results

| Check | Result |
|---|---|
| Prettier formatting | Clean |
| Internal markdown links (26 total) | All resolve — verified programmatically against the actual filesystem, files and directories both checked |
| §7 mapping table column consistency | Consistent (5 columns throughout) |
| §2 relationship table column consistency | Consistent (4 columns throughout) |
| Decision Dependency statuses cited (§4, Capability 2) | Independently re-verified against the live Decision Register, not assumed |
| Work-package titles/requirement IDs cited (§4, §7) | Sourced verbatim from the live Coding-Agent Prompt Register table, not recalled from memory |
| No engineering work package invented | Confirmed — every `ENG-Pn-xxx` ID in CDR-001 already exists in the Programme/Prompt Register |
| Product Definition unmodified | Confirmed — `git status` shows no changes under `docs/01-product/` |
| Engineering Implementation Programme unmodified | Confirmed — `git status` shows no changes under `docs/05-implementation/change-tracking/engineering-implementation-programme.md` for this task |
| No duplicated authority | Confirmed — CDR-001 cites rather than restates requirement IDs, decision statuses, and work-package definitions everywhere they already exist elsewhere |

## 6. Files Created

- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` — the roadmap itself.
- `docs/05-implementation/reports/ENG-PROG-001-CDR-001-implementation-report-2026-07-29.md` — this report.

## 7. Files Modified

- `docs/changes/IMPLEMENTATION_CHANGES.md` — closing entry appended (see accompanying commit).

No other file was modified. No file under `docs/01-product/`, `docs/02-technical/`, or `docs/05-implementation/change-tracking/` was touched.

## 8. Assumptions Made

- Where a capability has no dedicated Moments That Matter entry (Capabilities 3, 7, 8, 9), the document states this explicitly rather than inventing a journey — these are disclosed gaps, not filled in.
- The capability-to-phase groupings in §3 above (e.g., "Capability 7 = Phases 9+10+11") are this document's own proposed grouping, not a pre-existing Founder-approved mapping — they were derived from reading each phase's own stated objective and matching it to the capability names the task brief specified, and are disclosed as this task's own analysis rather than presented as already-approved.
- `ENG-P2-004`'s shared placement across Capabilities 2 and 3 is this document's own judgment call, disclosed in §3 above.

## 9. Risks Identified

- **None to existing systems** — this is a new, additive documentation file; no code, configuration, or existing document was touched.
- **Staleness risk (disclosed, not mitigated by this task):** CDR-001 §7's status column will drift out of date as work packages move from `Blocked` toward `Complete`, unless a future process keeps it synchronized with the Programme and Prompt Register. This document does not itself establish that synchronization process — flagged here as a known limitation, not fixed, since doing so was outside this task's scope.

## 10. Rollback Instructions

`git revert` of this task's own commit(s) on its dedicated branch — the change is a single new file plus one changes-log append; reverting removes both cleanly with no effect on any other document.

## 11. Commands Executed

`find`/`grep`/`ls` (repository survey of `docs/01-product/`, `docs/07-product-design/`, `docs/stitch/`, `docs/04-traceability/`); direct file reads (`moments-that-matter.md`, `07-product-design/README.md`, `stitch/README.md`, `04-traceability/README.md`, `00-product-foundation.md` headers, `04-customer-verified-loyalty.md` journey mentions); `grep` of the live Coding-Agent Prompt Register's full `ENG-Pn-xxx` table and the Decision Register's `DEC-SEC-001`/`DEC-DATA-007`/`DEC-PROV-004`/`DEC-ID-003` entries; `pnpm exec prettier --check`; a Python link-resolution script validating every relative markdown link against the actual filesystem; `git status`/`git diff --stat` (scope confirmation).

## 12. Dependencies Added

None.

## 13. Configuration Changes

None.
