# 11thONUS Requirements ID Audit

**Audit date:** 16 July 2026
**Method:** Regex extraction of all `PREFIX-nnn` and `PREFIX-SUB-nnn` identifiers across all 35 markdown files, followed by manual verification of collision contexts.
**Rule:** No source document has been renumbered. Recommendations only.

---

## 1. All Prefixes Found, with Counts and Owners

### Constitution and principle prefixes
| Prefix | Count (unique IDs) | Meaning | Source |
|---|---|---|---|
| CP | 15 | Constitutional Principles (CP-001..015) | Constitution Part IV |
| OP | 13 + ~12 | **COLLISION:** ONUS Principles (PRD0 §11, OP-001..013) AND Operational Rules (TRD20 rules table, OP-001..) | PRD0 / TRD20 |
| PD | 24 | Product Decisions (PD-001..024) | PRD0 §24 |
| AP | 10 | Access Principles (AP-001..010) | PRD1 §2 |
| AP-RP | 5 | Architectural Principles — Reward Programs (AP-RP-001..005) | PRD6 §27 |
| CVLE | 8 | Loyalty Engine principles (CVLE-001..008) | PRD4 §4 |
| PVL | 8 | Purchase Verification principles (PVL-001..008) | PRD5 §4 |
| OI | 7 | Operational Integrity principles (OI-001..007) | PRD8 §5 |
| CKS | 6 | Commerce Knowledge principles (CKS-001..006) | CKS Part II |
| TAP | 10 | Technical Architecture Principles (TAP-001..010) | TRD1-7 Ch 2 |
| DAP | 10 | Data Architecture Principles (DAP-001..010) | TRD10 §10.2 |
| DIP | 7 | Delivery Principles (DIP-001..007) | TRD22 §22.8 |
| SAP | 8 | Search Architecture Principles | TRD14 §14.3 |
| RAP | 8 | Reporting Principles | TRD15 §15.3 |
| AAP | 8 | Administration Principles | TRD18 §18.3 |
| QAP | 8 | Quality Principles | TRD19 §19.3 |
| ORP | 10 | Operational Resilience Principles | TRD20 §20.3 |
| PDP | ~10 | Privacy principles | TRD21 |
| AIR | 6 | Account Identity Rules (AIR-001..006) | TRD12 §12.6 |

### PRD functional requirement prefixes
| Prefix | Count | Meaning | Source |
|---|---|---|---|
| FR-RP | **3 sets** (10 + 12 + 8) | **TRIPLE COLLISION:** authorization (PRD1 §18), Reward Programs (PRD6 §25), RBAC (PRD10 §19) | PRD1 / PRD6 / PRD10 |
| FR-CI | 14 | Customer Identity (PRD2 §26) | PRD2 |
| FR-BO | 15 | Business Onboarding (PRD3 §26) | PRD3 |
| FR-PVL | 12 | Purchase Verification Lifecycle (PRD5 §24) | PRD5 |
| FR-RL | 9 | Reward Lifecycle (PRD7 §19) | PRD7 |
| FR-TM | 8 | Trust Management (PRD8 §20) | PRD8 |
| FR-BI | 8 | Business Intelligence (PRD9 §19) | PRD9 |
| (none) | ~13 | **PRD4 §19 functional requirements are unnumbered prose** | PRD4 |

### PRD business rule prefix
| Prefix | Count | Range | Notes |
|---|---|---|---|
| BR | 98 | BR-001..BR-098, continuous across PRD1→PRD10 | **No duplicates; exemplary continuous numbering.** BR-001..016 (PRD1), 017..026 (PRD2), 027..036 (PRD3), 037..046 (PRD4), 047..058 (PRD5), 059..068 (PRD6), 069..077 (PRD7), 078..085 (PRD8), 086..090 (PRD9), 091..098 (PRD10). |

### TRD functional requirement prefixes (one per chapter — no collisions found)
FR-INT (14, TRD9), FR-DATA (15, TRD10), FR-SRV (15, TRD11), FR-SEC (18, TRD12), FR-COM (18, TRD13), FR-SRCH (17, TRD14), FR-RPT (18, TRD15), FR-FE (25, TRD16), FR-SUB (20, TRD17), FR-ADM (20, TRD18), FR-QA (20, TRD19), FR-OPS (24, TRD20), FR-PRV (28, TRD21), FR-IMP (20, TRD22), FR-TRC (15, TRD23).

### TRD rule-table prefixes (one per chapter)
IR (10, TRD9), DA (15, TRD10), SP (15, TRD11), SR (18, TRD12), CR (15, TRD13), SD (15, TRD14), RR (15, TRD15), FA (18, TRD16), SB (15, TRD17), AR (15, TRD18), QR (15, TRD19), OP (12, TRD20 — **collides with PRD0**), PR (20, TRD21), IM (15, TRD22), TC (12, TRD23).

### Decision/assumption prefixes
OPD (10, TRD23 open product decisions), OTD (12, TRD23 open technical decisions), LCD (6, TRD23 legal dependencies), A (15, TRD23 assumptions — bare letter prefix, weak for tooling).

## 2. Duplicate and Conflicting IDs

| Conflict | Details | Severity |
|---|---|---|
| **FR-RP-001..008 defined three times** | PRD1 §18 (authorization), PRD6 §25 (Reward Programs), PRD10 §19 (RBAC); FR-RP-009/010 twice (PRD1, PRD6); FR-RP-011/012 unique to PRD6 | **P1 — traceability breaking** (DOC-P1-001) |
| **OP-001.. defined twice** | PRD0 ONUS Principles vs TRD20 operational rules | **P1** |
| AP vs AP-RP | Distinct prefixes, but "AP" ambiguity risk between Access Principles and Architectural Principles | P3 — acceptable if glossaried |
| QR prefix | TRD19 rule prefix "QR" collides conceptually with "QR code" in prose search | P3 — cosmetic |
| A-xxx assumptions | Single-letter prefix will false-match in tooling | P3 — recommend AS-xxx |

## 3. Gaps and Orphans

- **PRD4 §19:** ~13 functional requirements with no IDs (DOC-P3-008). Recommend FR-CVLE-001.. .
- **PRD9 line 1** header anomaly suggests a copy/paste generation artifact; no missing IDs detected in its body.
- **No numbering gaps** detected inside any continuous ID range (BR-001..098 complete; CP-001..015 complete; PD-001..024 complete).
- **Requirements without implementation phase:** all PRD FRs (phases live only in TRD22); acceptable if the traceability register joins them — but the register does not exist yet.
- **Requirements without explicit test coverage links:** all (TRD19 defines test classes, not per-requirement mapping). Expected at this stage; the register must close this.
- **Requirements without an owner domain:** PRD FRs do not name owning domains (TRD23 §23.6 supplies mapping at capability level). Acceptable with register.
- **Future requirements marked as MVP:** none found in PRD/TRD FR sets (scope discipline is good). The risk sits entirely in the two superseded root documents (DOC-P0-001/002) and Rules Studio plan examples (DOC-P2-001).

## 4. Same Requirement Under Several IDs (sampling)

- Shared staff accounts prohibited: AP-002 (PRD1), BR-002 (PRD1), BR-095 (PRD10), Product Definition prose. Multiple IDs, same rule.
- Only registered customer verifies: AP-005, BR-005 (PRD1), BR-020/023 (PRD2), FR-PVL-007, BR-052 (PRD5), BR-094 (PRD10), OP-004/PD-013/PD-014 (PRD0), FR-CI-010 (PRD2). At least **ten** identifiers assert the cardinal rule.
- Owner-entered purchases still verified: BR-009 (PRD1), PD-014 (PRD0), §6.5 PRD1 prose, BR-058 (PRD5).
- Historical records never deleted: OP-007, BR-010, BR-026, BR-081, FR-TM-008, DA-012, DAP-010.
- **Impact:** not contradictory, but the traceability register must pick one *primary* ID per rule and mark the others as restatements, or the register will bloat and drift.

## 5. Recommended Numbering Strategy (preservation-first)

1. **Preserve everything preservable.** BR-001..098, PD, CP, TAP, DAP, all TRD FR-* chapter prefixes and rule tables are clean — freeze as-is.
2. **Renumber only the collisions:**
   - PRD1 §18 FR-RP-* → **FR-AUTHZ-001..010**
   - PRD10 §19 FR-RP-* → **FR-RBAC-001..008**
   - PRD6 §25 keeps **FR-RP-*** (Reward Programs is the natural owner of the mnemonic)
   - TRD20 rule table OP-* → **OR-001..** (Operational Rules); PRD0 keeps OP-* (ONUS Principles)
   - TRD23 assumptions A-* → **AS-001..015**
3. **Add missing IDs:** PRD4 §19 → FR-CVLE-001.. .
4. **Publish an ID mapping table** (old → new → source section) as an appendix of the consolidated suite; never delete an old ID silently (TRD23 §23.28: deprecated requirements are marked, not removed).
5. **Declare primary vs restatement.** In the traceability register, each rule gets one primary ID; restatements reference it (e.g., BR-094 → restates BR-005).
6. **Reserve prefix registry.** Maintain a one-page prefix registry in the Engineering Standards so future documents cannot reuse a prefix (this is how FR-RP collided: three authors, no registry).
