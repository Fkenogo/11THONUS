> **Title:** Traceability Maintenance Guide
> **Version:** 1.0 · **Status:** Active controlled procedure · **Classification:** Working (governance process)
> **Governing document:** [Requirements Traceability & Implementation Matrix](requirements-traceability-matrix.md)
> **Source-of-truth path:** `docs/00-governance/traceability-maintenance-guide.md`
> **Last controlled update:** 2026-07-16 (Phase 5 — created)

# Traceability Maintenance Guide

The exact, repeatable procedure for keeping the [Requirements Traceability & Implementation Matrix](requirements-traceability-matrix.md) accurate for the lifetime of the product. The matrix is a permanent governance document, not a phase artifact — it must stay correct through every future documentation change, founder decision, and engineering milestone.

---

## 1. How New Requirements Are Added

1.1 A new requirement is only added to a PRD or TRD document through the normal document-change process (classified per TRD Consolidation Audit §25: Editorial / Normalization / Clarification / Decision Required / Material Change), logged in the [Documentation Changes Log](documentation-changes-log.md).

1.2 The new requirement's ID must use an existing family prefix (e.g. `BR-099` continuing the Business Rules sequence) or, if it genuinely needs a new prefix, that prefix must be added to the [Requirement ID Mapping](requirement-id-mapping.md)'s prefix registry first — never invented ad hoc (this is exactly how the original `FR-RP`/`OP` collisions happened; see the Requirements ID Audit).

1.3 Once the source document is updated, add one new row to this matrix in the matching source-document section, sorted by ID, with:
- `Implementation Status = Not Started`
- `Acceptance Criteria` / `Future Test Reference` = `Not yet defined` unless already known
- `Related Decision IDs` populated if the new requirement was created by a CONFIRMED decision (cite the DEC ID)
- All other columns populated the same way as its neighboring rows (same Domain/Planned Technical Module conventions)

1.4 Update the Requirement Coverage Summary counts at the top of the matrix and log the change in the Documentation Changes Log.

## 2. How Deprecated Requirements Are Handled

2.1 **A requirement ID is never deleted from the matrix.** This mirrors TRD23 §23.28 ("deprecated requirements are marked, not removed") and the ID Mapping's historical-integrity rule.

2.2 To deprecate a requirement: mark its `Implementation Status` as `Deprecated`, add a one-line reason in `Notes` (e.g. "Deprecated 2027-XX-XX — superseded by BR-112, DEC-XXX-001"), and leave every other column as historical record.

2.3 If a deprecated requirement is replaced, the replacement requirement's `Notes` should reference the deprecated ID it replaces, so the chain is traceable in both directions.

## 3. How Implementation Status Changes

3.1 Allowed values: `Not Started` → `Planned` → `In Progress` → `Implemented` → `Tested` → `Verified`. (`Deprecated` and `Blocked` may apply at any point.)

3.2 Status may only advance past `Not Started` once the requirement's `Dependencies` column is empty (`—`) — i.e., no open Decision Register item still blocks it. If a new decision opens against an already-`In Progress` or later requirement, set status to `Blocked` and populate `Dependencies`/`Notes` immediately (do not continue silently).

3.3 Status changes are made by the engineering team (or an authorized coding agent under an explicit work package) directly in this matrix, and are **not** subject to the Decision Update Procedure (that procedure governs decisions, not implementation status) — but any status change must still cite the work package, PR, or commit that justifies it in `Notes`.

3.4 This matrix does not replace project-management tooling. It is the durable, documentation-linked record of *what was planned and whether it's done* — day-to-day task tracking may live elsewhere, but the authoritative status per requirement lives here.

## 4. How Future Test References Are Maintained

4.1 Once the Engineering Standards (Phase 6) define the test strategy and a real test suite exists, `Future Test Reference` is replaced with the actual test identifier(s) (e.g. a test file path, test-case ID, or CI job reference) — never left as `Not yet defined` once a real test exists.

4.2 A requirement should not be marked `Tested` in `Implementation Status` unless `Future Test Reference` (at that point, simply "Test Reference") is populated with a real, checkable reference.

4.3 If a test is later removed or replaced, update the reference — do not leave a stale test ID pointing at a deleted test.

## 5. How Engineering Updates the Matrix

5.1 **Cadence:** the matrix is updated as part of the same change that advances a requirement's implementation — not on a separate schedule. A merged PR that implements `FR-PVL-003` updates that row's status in the same change set (or immediately after, same day).

5.2 **Ownership:** the Engineering Lead owns the accuracy of Domain/Planned Technical Module/Collections/Functions/Screens/API columns once real architecture decisions are made (these may need correction from their Phase 5 planning-level values to actual implementation values — that is expected and is not an error in Phase 5, it is the normal maturing of a plan into a build).

5.3 **Coding-agent contract:** before implementing any requirement, an agent checks this matrix by Requirement ID. If `Dependencies` is not `—`, the agent stops and reports (TRD22 §22.40) — it does not implement around an open decision. If `Implementation Status` is anything other than `Not Started`/`Planned`, the agent checks with the engineering team before assuming the requirement is free to build, to avoid duplicate or conflicting work.

5.4 **Never edit `Requirement ID`, `Requirement Type`, `Source Document`, or `Section` retroactively** except through the same controlled ID-change process used in Phase 4 (published mapping, no silent renumbering). These four columns are the traceability anchor; changing them breaks every existing citation to that row.

5.5 **Every matrix edit is logged** in the [Documentation Changes Log](documentation-changes-log.md), same as any other governed document — this matrix is not exempt from that rule despite updating more frequently than most.

## 6. Relationship to Other Governance Documents

- The matrix **records** planning and status; it never overrides the Constitution, PRD, TRD or Decision Register (same "records, never leads" principle as the Canonical Reference and Decision Register).
- Where the matrix's `Related Decision IDs` or `Dependencies` disagrees with the current Decision Register, **the Decision Register governs** — the matrix is corrected, not the other way around.
- Where a requirement's source text changes, the matrix's `Requirement Title` should be refreshed to match (titles here are working summaries for lookup, not the authoritative wording — the source document's exact text always governs).
