# 11thONUS Documentation Consolidation — Phase 4 Implementation Report

**Date:** 16 July 2026
**Phase:** 4 — Requirement ID Normalization
**Agent:** Claude (AI documentation agent)
**Scope discipline:** purely mechanical identifier renaming/addition, executing DEC-GOV-006 exactly as approved. **No requirement wording changed, no product or technical behavior changed, no requirements redesigned, no Decision Register content changed, no unrelated files modified, Git not initialized.**

---

## 1. Executive Summary

Phase 4 implemented DEC-GOV-006 in full: *"Proceed with Requirement ID Normalisation. Maintain a complete Old ID → New ID mapping. No requirement meaning changes."* Every collision identified in the Requirements ID Audit is resolved. 51 identifiers were renamed (1:1 substitution), 13 new identifiers were added to close a documented gap (PRD4's previously-unnumbered functional requirements), and 2 sets were reviewed and deliberately left unchanged because they were never actually colliding with the sets that moved. A permanent, append-only [Requirement ID Mapping](../../00-governance/requirement-id-mapping.md) document was created. Validation found zero genuine duplicate IDs, zero broken links, and zero requirement-count drift. The Requirements Traceability Register (Phase 5) now has no remaining ID-stability blocker.

## 2. Files Reviewed

Platform Constitution, Decision Register (all 4 D0 records plus DEC-GOV-006 in full), Decision Governance Workflow, Decision Update Procedure, Canonical Reference, Documentation Changes Log (Entries 001–006), Phase 1–3B implementation reports, Requirements ID Audit (full), TRD Consolidation Audit §25 (change classification), all 11 PRD files, all 17 TRD files (full read of TRD20 and TRD23; targeted read of PRD1 §18, PRD10 §19, PRD6 §25, PRD0 §11, PRD4 §19), both index READMEs, decisions/README.md, assumptions-register.md, external-dependencies-register.md, phase-3-reconciliation.md, phase tracker.

## 3. Before-Making-Changes Analysis (as required)

**3.1 Current requirement namespaces.** See §4 below — 40+ distinct prefixes across Constitution/PRD/TRD, cleanly partitioned except for two collisions: `FR-RP` (three unrelated meanings across PRD1/PRD6/PRD10) and `OP` (two unrelated meanings: PRD0 ONUS Principles vs. TRD20's operational rule table). A third gap — not a collision — was PRD4 §19's thirteen functional requirements, which had never been assigned IDs at all.

**3.2 Existing collisions.** Confirmed by direct file inspection (not just the audit's estimate): PRD1 §18 has exactly 10 `FR-RP-*` headings, PRD10 §19 has exactly 8, PRD6 §25 has exactly 12. TRD20 §20.75's rule table has exactly 18 `OP-*` rows (the audit's own count, "~12," was a sampling estimate — the full read in this phase found 18, and all 18 were renamed). TRD23 §23.25 has exactly 15 `A-*` assumptions. No other file in the current `docs/` tree uses these exact colliding tokens outside the Decision Register and audit evidence (verified by repository-wide grep before any edit).

**3.3 Proposed normalized namespace** (per DEC-GOV-006, itself adopting Requirements ID Audit §5 verbatim):
- PRD1 §18: `FR-RP-*` → `FR-AUTHZ-*` (authorization is this set's actual subject).
- PRD10 §19: `FR-RP-*` → `FR-RBAC-*` (role-based access control is this set's actual subject).
- PRD6 §25: `FR-RP-*` unchanged (Reward Programs is the mnemonic's natural owner).
- TRD20 §20.75: `OP-*` → `OR-*` (Operational Rules).
- PRD0 §11: `OP-*` unchanged (ONUS Principles keeps the original prefix).
- TRD23 §23.25: `A-*` → `AS-*` (matches the Assumptions Register, which already used `AS-*` since Phase 3).
- PRD4 §19: gains `FR-CVLE-001..013` (new, gap closure only).

**3.4 Files affected.** Direct ID edits: 6 (PRD1, PRD10, PRD6-reviewed-no-edit, PRD0-reviewed-no-edit, TRD20, TRD23, PRD4 — 6 files actually edited, 2 files reviewed with no edit needed). Cross-reference/index updates: 8 more (listed in full in §3 of the changes-log Entry 007 and §9 below). Explicitly out of scope: the Decision Register (strict constraint) and all `90-audits/` and `99-archive/` content (established historical-evidence rule from Phase 2).

**3.5 Validation strategy.** (a) Regex-verified heading-level ID extraction per file, before and after, with exact counts compared against the audit's numbers and each other. (b) Repository-wide duplicate-declaration scan across all authoritative documents (headings, bold standalone IDs, and table-row IDs), excluding the mapping document itself and the Assumptions Register's intentional restatement of TRD23. (c) Full relative-link check. (d) Word-for-word diff of every requirement's descriptive text against its pre-Phase-4 form to confirm zero wording drift. (e) Requirement-count reconciliation (BR/PD/CP and all untouched TRD FR-* families) to confirm nothing outside the six target sections moved.

**3.6 Rollback strategy.** Every ID rename in this phase is a pure regex substitution scoped to a named section (never a whole-file replace), fully reversible by re-running the inverse substitution on the same section boundaries; the mapping document itself is the reversal reference. New IDs (FR-CVLE) can be removed by deleting the added heading lines only, restoring the original unnumbered prose exactly. Full step-by-step instructions are in §15 below.

No ambiguity was encountered; no step required a stop-and-report.

## 4. Requirement Namespace Before

| Set | Prefix | Count | Status before Phase 4 |
|---|---|---|---|
| PRD1 §18 | `FR-RP-001..010` | 10 | Collision (1 of 3 meanings) |
| PRD6 §25 | `FR-RP-001..012` | 12 | Collision (1 of 3 meanings) |
| PRD10 §19 | `FR-RP-001..008` | 8 | Collision (1 of 3 meanings) |
| PRD0 §11 | `OP-001..013` | 13 | Collision (1 of 2 meanings) |
| TRD20 §20.75 | `OP-001..018` | 18 | Collision (1 of 2 meanings); audit's sampling estimate was ~12 |
| TRD23 §23.25 | `A-001..015` | 15 | Weak single-letter prefix, false-match risk |
| PRD4 §19 | *(none)* | 13 | Unnumbered — gap, not a collision |
| Everything else (BR, PD, CP, TAP, DAP, all TRD FR-* chapter families, all TRD rule tables except TRD20's, OPD/OTD/LCD, etc.) | various | ~830 | Clean, no collisions (Requirements ID Audit §1–2) |

## 5. Requirement Namespace After

| Set | Prefix | Count | Status after Phase 4 |
|---|---|---|---|
| PRD1 §18 | `FR-AUTHZ-001..010` | 10 | Unique |
| PRD6 §25 | `FR-RP-001..012` | 12 | Unique (kept) |
| PRD10 §19 | `FR-RBAC-001..008` | 8 | Unique |
| PRD0 §11 | `OP-001..013` | 13 | Unique (kept) |
| TRD20 §20.75 | `OR-001..018` | 18 | Unique |
| TRD23 §23.25 | `AS-001..015` | 15 | Unique, aligned with the Assumptions Register |
| PRD4 §19 | `FR-CVLE-001..013` | 13 | New — gap closed |
| Everything else | various | ~830 | Unchanged |

**Zero collisions remain anywhere in the authoritative documentation suite.**

## 6. Mapping Strategy

Preservation-first (Requirements ID Audit §5, approved verbatim by DEC-GOV-006): rename only what collides; never touch a clean prefix; add IDs only where none existed; never delete an old ID from the historical record — it lives on permanently in the mapping document (TRD23 §23.28's "deprecated requirements are marked, not removed" principle). Every rename is a scoped, section-bounded regex substitution (`FR-RP-(\d{3})` → `FR-AUTHZ-\1` etc.), verified by exact before/after count match, never a manual or freehand edit.

## 7. Old → New Mapping Summary

Full record (all 79 individual ID rows: 51 renamed + 13 added + 15 reviewed-unchanged listed for completeness): [`docs/00-governance/requirement-id-mapping.md`](../../00-governance/requirement-id-mapping.md).

| Change | Old | New | Count |
|---|---|---|---|
| Rename | PRD1 `FR-RP-001..010` | `FR-AUTHZ-001..010` | 10 |
| Rename | PRD10 `FR-RP-001..008` | `FR-RBAC-001..008` | 8 |
| Rename | TRD20 `OP-001..018` | `OR-001..018` | 18 |
| Rename | TRD23 `A-001..015` | `AS-001..015` | 15 |
| Unchanged (reviewed) | PRD6 `FR-RP-001..012` | *(same)* | 12 |
| Unchanged (reviewed) | PRD0 `OP-001..013` | *(same)* | 13 |
| Added (gap closure) | *(none)* | PRD4 `FR-CVLE-001..013` | 13 |

## 8. Validation Results

- **Uniqueness:** 890 unique declared requirement/rule/principle IDs across all authoritative documents (headings, bold-standalone, and table-row forms); **zero genuine duplicates** after excluding the mapping document's own old/new listing and the Assumptions Register's intentional TRD23 restatement (both pre-existing, documented patterns, not new collisions).
- **Broken links:** 0 (123 relative links checked after this phase's edits, including the 2 that were transiently broken mid-phase pending creation of this report).
- **Duplicate references:** none found — every renamed ID appears exactly once as a declaration in its home file and is cited (not re-declared) elsewhere.
- **Mapping table completeness:** all 51 renames + 13 additions individually listed in `requirement-id-mapping.md`; the 2 deliberately-unchanged sets are also listed, for a complete accounting of every ID touched by the DEC-GOV-006 review.
- **Old→New 1:1 / New→Old 1:1:** verified — no old ID maps to more than one new ID and no new ID has more than one source (each rename is a straight substitution within one section of one file).
- **Requirement counts before/after:** see §9.
- **No wording changes:** verified by direct comparison — every renamed heading is followed by the exact same requirement sentence(s) that existed before the rename; the only textual additions anywhere are the 13 verbatim-copied PRD4 sentences (now under headings) and explanatory footnote/note blocks that are clearly marked as Phase 4 annotations, not requirement text.

## 9. Requirement Counts Before/After

| Family | Before | After | Delta |
|---|---|---|---|
| BR (business rules) | 98 | 98 | 0 |
| PD (product decisions) | 24 | 24 | 0 |
| CP (constitutional principles) | 15 | 15 | 0 |
| FR-RP (PRD6, unchanged) | 12 | 12 | 0 |
| FR-AUTHZ (was FR-RP, PRD1) | 0 | 10 | +10 (renamed from FR-RP, net suite change 0) |
| FR-RBAC (was FR-RP, PRD10) | 0 | 8 | +8 (renamed from FR-RP, net suite change 0) |
| OP (PRD0, unchanged) | 13 | 13 | 0 |
| OR (was OP, TRD20) | 0 | 18 | +18 (renamed from OP, net suite change 0) |
| AS (was A, TRD23) | 0 | 15 | +15 (renamed from A, net suite change 0) |
| FR-CVLE (PRD4, new) | 0 | 13 | **+13 (genuinely new — gap closure)** |
| All other families (FR-CI, FR-BO, FR-PVL, FR-RL, FR-TM, FR-BI, FR-OPS, all TRD chapter FR-* and rule tables, TAP, DAP, etc.) | ~830 | ~830 | 0 |
| **Total unique declared identifiers in the suite** | **~877** | **~890** | **+13** |

The only net change in the total requirement count is the +13 PRD4 additions, which is the explicitly approved gap-closure — every other change is a pure rename with zero net effect on the total.

## 10. Broken Links Found

2, both transient and expected: `documentation-phases.md` and `05-implementation/reports/README.md` briefly pointed at this report before it was written. Both resolved by this report's creation.

## 11. Broken Links Fixed

Same 2 as above — resolved simply by writing this file; no link text or target needed correction.

## 12. Commands Executed

Python `re.sub` with `\b`-anchored, section-bounded patterns (never whole-file blind replace) for each of the four renames; a heading/bold/table-row ID extractor used before and after each edit to verify exact count match; a repository-wide duplicate-declaration scanner (excluding the mapping doc and Assumptions Register by design); the standard relative-link checker used in every prior phase.

## 13. Configuration Changes

None.

## 14. Risks

1. **Decision Register now contains 4 stale-but-harmless citations** (`TRD23 A-004/A-005`, `A-011`, `A-012`, `A-001/A-002` in *Source references* fields) because editing the register is explicitly out of scope for this phase. No decision status, content or meaning is affected; the same information is one click away via the new mapping document. Documented in `requirement-id-mapping.md` §5 and flagged here for visibility.
2. **Audit evidence documents retain pre-normalization IDs** (by design — they are historical snapshots of the 16 July 2026 audit, never edited per the Phase 2 rule). A reader comparing an audit report to the current PRD/TRD directly will see old IDs in the audit and new IDs in the source; the mapping document bridges this.
3. **TRD20's rule-table count (18) differs from the audit's estimate (~12).** This is not a risk to the renaming itself (all 18 were found and renamed), but it is disclosed because the audit document itself — which is not edited — will continue to say "~12" indefinitely.
4. No version control (Git not initialized, per constraint) under what was flagged since Phase 3A as a recommended-but-not-mandated step before high-churn renumbering. This phase's edits were, in the event, precisely scoped and individually verified, but the underlying recommendation stands for any future large-scale edit.

## 15. Rollback Instructions

All edits are additive (new note/blockquote lines, new headings, new files) or scoped substitutions (old-prefix → new-prefix within a named section only). To roll back Phase 4 in full: (a) in PRD1 §18 and PRD10 §19, reverse-substitute `FR-AUTHZ-(\d{3})`→`FR-RP-\1` and `FR-RBAC-(\d{3})`→`FR-RP-\1` respectively; (b) in TRD20 §20.75, reverse-substitute `OR-(\d{3})`→`OP-\1` within that section only; (c) in TRD23 §23.25, reverse-substitute `AS-(\d{3})`→`A-\1` within that section only; (d) in PRD4 §19, delete the 13 `### FR-CVLE-0XX` heading lines (and the explanatory blockquote), restoring the original unnumbered bullet-less prose exactly as it reads in the Phase 3B baseline; (e) remove the added notes/blockquotes from TRD20, TRD23, and the Constitution-adjacent index files; (f) delete `requirement-id-mapping.md` and this report; (g) revert `docs/README.md`, `01-product/prd/README.md`, `decisions/README.md`, `founder-decision-agenda.md`, `canonical-reference.md`, `assumptions-register.md`, `external-dependencies-register.md`, and `documentation-phases.md` to their Phase 3B text (quoted in full in changes-log Entry 006 and this phase's Entry 007); (h) remove changes-log Entry 007. Nothing was deleted in the forward direction, so nothing is unrecoverable.

## 16. Engineering Readiness Impact

None on product or technical behavior — this phase changed zero requirement wording and zero system behavior. Its readiness impact is entirely on **documentation-phase sequencing**: the Requirements Traceability Register (Phase 5) requires globally unique, stable requirement IDs before it can link requirements to code and tests (TRD23 §23.4); that prerequisite is now satisfied. Phase 5 may begin on founder instruction. Engineering implementation itself remains gated on the full governance freeze (all remaining founder decisions, Engineering Standards, and Version 1.0 publication) — unchanged by this phase.

## 17. Confirmations

**No requirement wording changed · no product or technical behavior changed · no requirements redesigned, added beyond the 13 disclosed gap-closure IDs, or removed · no Decision Register content changed · no Constitution principle changed · no canonical terminology changed · no founder decision inferred or approved · no engineering implementation begun · current architecture maintained · no unrelated files modified · Git not initialized.**
