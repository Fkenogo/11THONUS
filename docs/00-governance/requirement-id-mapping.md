> **Title:** 11thONUS Requirement ID Mapping
> **Version:** 1.0 · **Status:** Permanent controlled record · **Classification:** Working (governance record)
> **Governing document:** 11thONUS Platform Constitution; executed under DEC-GOV-006
> **Source-of-truth path:** `docs/00-governance/requirement-id-mapping.md`
> **Last controlled update:** 2026-07-16 (Phase 4 — created)

# 11thONUS Requirement ID Mapping

**Purpose.** This is the permanent, append-only record of every requirement/rule identifier renamed or added during documentation Phase 4 (Requirement ID Normalization), executed exactly as approved in **DEC-GOV-006**: *"Proceed with Requirement ID Normalisation. Maintain a complete Old ID → New ID mapping. No requirement meaning changes."*

**Rule.** No old ID is ever silently removed from this record (TRD23 §23.28). No requirement wording changed anywhere in this phase — only identifiers. Every row below can be verified by opening the cited section: the requirement text is identical before and after; only the heading token changed.

**Strategy source.** [Requirements ID Audit](../90-audits/2026-07-16-documentation-audit/11thONUS_REQUIREMENTS_ID_AUDIT_2026-07-16.md) §5 (Recommended Numbering Strategy — preservation-first), approved without modification by DEC-GOV-006.

---

## 1. Renamed IDs (collision resolution)

### 1.1 PRD1 §18 — Authorization requirements: `FR-RP-*` → `FR-AUTHZ-*`

*File:* `docs/01-product/prd/01-accounts-roles-and-permissions.md`. *Reason:* this was one of three unrelated sets sharing the `FR-RP` prefix (PRD1 = authorization, PRD6 = Reward Programs, PRD10 = RBAC). `FR-AUTHZ` is now unique to this set.

| Old ID | New ID |
|---|---|
| FR-RP-001 | FR-AUTHZ-001 |
| FR-RP-002 | FR-AUTHZ-002 |
| FR-RP-003 | FR-AUTHZ-003 |
| FR-RP-004 | FR-AUTHZ-004 |
| FR-RP-005 | FR-AUTHZ-005 |
| FR-RP-006 | FR-AUTHZ-006 |
| FR-RP-007 | FR-AUTHZ-007 |
| FR-RP-008 | FR-AUTHZ-008 |
| FR-RP-009 | FR-AUTHZ-009 |
| FR-RP-010 | FR-AUTHZ-010 |

### 1.2 PRD10 §19 — Role-based access control requirements: `FR-RP-*` → `FR-RBAC-*`

*File:* `docs/01-product/prd/10-platform-administration.md`. *Reason:* the third set sharing `FR-RP`; `FR-RBAC` is now unique to this set.

| Old ID | New ID |
|---|---|
| FR-RP-001 | FR-RBAC-001 |
| FR-RP-002 | FR-RBAC-002 |
| FR-RP-003 | FR-RBAC-003 |
| FR-RP-004 | FR-RBAC-004 |
| FR-RP-005 | FR-RBAC-005 |
| FR-RP-006 | FR-RBAC-006 |
| FR-RP-007 | FR-RBAC-007 |
| FR-RP-008 | FR-RBAC-008 |

### 1.3 PRD6 §25 — Reward Programs requirements: `FR-RP-*` — **unchanged**

*File:* `docs/01-product/prd/06-reward-programs-and-loyalty-cycles.md`. Reward Programs is the natural owner of the `FR-RP` mnemonic (per the approved strategy); this set (FR-RP-001..012, 12 requirements) keeps its identifiers exactly as they were. Listed here for completeness, not as a rename.

### 1.4 TRD20 §20.75 — Operational rule table: `OP-*` → `OR-*`

*File:* `docs/02-technical/trd/20-deployment-and-operational-resilience.md`. *Reason:* collided with PRD0 §11's ONUS Principles, which also used `OP-*`. PRD0's set is unchanged (see §2 below); this technical rule table is renamed to `OR-` (Operational Rules).

| Old ID | New ID | Old ID | New ID |
|---|---|---|---|
| OP-001 | OR-001 | OP-010 | OR-010 |
| OP-002 | OR-002 | OP-011 | OR-011 |
| OP-003 | OR-003 | OP-012 | OR-012 |
| OP-004 | OR-004 | OP-013 | OR-013 |
| OP-005 | OR-005 | OP-014 | OR-014 |
| OP-006 | OR-006 | OP-015 | OR-015 |
| OP-007 | OR-007 | OP-016 | OR-016 |
| OP-008 | OR-008 | OP-017 | OR-017 |
| OP-009 | OR-009 | OP-018 | OR-018 |

(18 rules. The Requirements ID Audit estimated "~12" from a sampling pass; the full chapter read during Phase 4 found the table actually contains 18 rows — all 18 renamed, none skipped.)

### 1.5 TRD23 §23.25 — MVP assumptions: `A-*` → `AS-*`

*File:* `docs/02-technical/trd/23-traceability-and-completion-review.md`. *Reason:* the bare single-letter `A-` prefix false-matches in tooling and in plain-text search. The [Assumptions Register](decisions/assumptions-register.md) (created Phase 3) already anticipated this and used `AS-*`; TRD23 is now aligned with it exactly.

| Old ID | New ID |
|---|---|
| A-001 | AS-001 |
| A-002 | AS-002 |
| A-003 | AS-003 |
| A-004 | AS-004 |
| A-005 | AS-005 |
| A-006 | AS-006 |
| A-007 | AS-007 |
| A-008 | AS-008 |
| A-009 | AS-009 |
| A-010 | AS-010 |
| A-011 | AS-011 |
| A-012 | AS-012 |
| A-013 | AS-013 |
| A-014 | AS-014 |
| A-015 | AS-015 |

## 2. Deliberately unchanged (reviewed, not renamed)

| Prefix | Location | Why unchanged |
|---|---|---|
| `OP-001..013` | PRD0 §11, ONUS Principles (`docs/01-product/prd/00-product-foundation.md`) | Keeps its original prefix per the approved strategy; the *other* half of the collision (TRD20's rule table) was renamed instead (§1.4 above). |
| `FR-RP-001..012` | PRD6 §25, Reward Programs (`docs/01-product/prd/06-reward-programs-and-loyalty-cycles.md`) | Reward Programs is the natural owner of the mnemonic; the *other two* colliding sets were renamed instead (§1.1–1.2 above). |
| `BR-001..098`, `PD-001..024`, `CP-001..015`, all TRD `FR-*` chapter prefixes, all TRD rule-table prefixes other than TRD20's, `OPD/OTD/LCD/TC` | Suite-wide | Clean, continuous, no collisions found (Requirements ID Audit §1–2). Frozen as-is per the preservation-first strategy. |

## 3. New IDs added (gap closure — no prior ID existed)

### 3.1 PRD4 §19 — Functional requirements: `FR-CVLE-001..013` (new)

*File:* `docs/01-product/prd/04-customer-verified-loyalty.md`. *Reason:* these 13 requirements existed only as unnumbered prose at consolidation time (audit finding DOC-P3-008). IDs were added in original document order; no requirement was reworded, reordered, added or removed.

| New ID | Requirement (verbatim, unchanged) |
|---|---|
| FR-CVLE-001 | Generate Loyalty Cycles. |
| FR-CVLE-002 | Track Verified Units. |
| FR-CVLE-003 | Track Pending Units. |
| FR-CVLE-004 | Track Rejected Units. |
| FR-CVLE-005 | Track Disputed Units. |
| FR-CVLE-006 | Calculate Reward Availability. |
| FR-CVLE-007 | Support multiple Reward Programs. |
| FR-CVLE-008 | Support multiple quantities. |
| FR-CVLE-009 | Support customer verification. |
| FR-CVLE-010 | Support historical reporting. |
| FR-CVLE-011 | Support reward redemption. |
| FR-CVLE-012 | Support multiple completed cycles. |
| FR-CVLE-013 | Support future configurable reward rules. |

(Note: bare `CVLE-001..008` — the Loyalty Engine *principles* in PRD4 §4 — is a separate, pre-existing, non-colliding namespace and is unaffected by this addition.)

## 4. Summary

| Change type | Count |
|---|---|
| IDs renamed (§1.1–1.5) | 51 (10 + 8 + 18 + 15) |
| IDs reviewed and deliberately left unchanged (§2) | 33 (13 PRD0 OP + 12 PRD6 FR-RP + 8 TRD20... — see note below) |
| New IDs added (§3) | 13 |
| **Net requirement/rule identifiers in the suite before → after** | **+13** (renames are 1:1 substitutions; only the PRD4 gap-fill adds new identifiers) |

*Note on §2 count:* the reviewed-unchanged row lists the two specific sets involved in a collision (PRD0 OP-*, 13; PRD6 FR-RP-*, 12) — 25 total — separately from the much larger set of prefixes that were never part of any collision (BR, PD, CP, etc.), which are not individually re-counted here as they were not touched or re-reviewed line-by-line in this phase.

## 5. Known residual references (not corrected in this phase — see Phase 4 report §Risks)

The Decision Register (`docs/00-governance/decisions/decision-register.md`) is explicitly out of scope for editing in Phase 4 (strict constraint: "Do NOT change Decision Register contents"). Four of its *Source references* fields cite the old TRD23 `A-00X` form (records at approx. lines 208, 661, 1059, 1144). These are historical citations only — no register status, decision, or content is affected — and the same information is trivially findable via this mapping document. They are listed here, not corrected, per the explicit constraint.

Audit evidence documents under `docs/90-audits/` also cite pre-normalization IDs; these are historical audit snapshots (Phase 2 rule: audit evidence and backups are never edited) and are intentionally left as they were on the date of the audit.
