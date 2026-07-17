# Phase 3 Reconciliation — Raw Items to Final Records

> **Purpose:** Proves that every decision-like item from the audit extraction (`docs/90-audits/2026-07-16-documentation-audit/11thONUS_OPEN_DECISIONS_AND_DEPENDENCIES_2026-07-16.md`) and its upstream sources is represented in the Phase 3 governance records — or documented as a duplicate / not-a-decision. Classifications: DECISION (register record) / DEPENDENCY (external-dependencies register) / ASSUMPTION (assumptions register) / DUPLICATE (merged into named record).

## A. Raw source layers

| Layer | Items | Disposition |
|---|---|---|
| Audit extraction DR-* items | 71 | Individually mapped below |
| TRD23 native OPD (10), OTD (12), LCD (6), provider table (7), A (15) | 50 | Already absorbed 1:1 into the DR-* extraction (extraction cites each); mapped transitively |
| TRD consolidation audit §26 material issues | 14 | All overlap OPD/DR items (threshold, suspension, plan names, staff limits, trial, phone lookup, profile scope, reward quantity, gender, birthday, provider, region, auth fallback, email/SMS) — DUPLICATES of rows below |
| PRD open-question sections (PRD2 §28 ×5, PRD3 §28 ×4, PRD6 §28 ×5) | 14 | Absorbed into DR-PROD-004/008/009/013/014, DR-COMM-006 and DEC-LOY-013/DEC-FUT records — mapped below |
| Phase 1/2 OPEN markers (PRD0 §14.3; canonical reference ×2; Rules Studio; docs index) | 5 | Pointers to DEC-LOY-010, DEC-LOY-008, DEC-GOV-001, DEC-SUB-001/011 |
| **Total raw decision-like mentions** | **≈154** | → 71 unique items → 103 register records (incl. 33 CONFIRMED + 4 SUPERSEDED added from governing documents) + 16 dependencies + 15 assumptions |

## B. Item-by-item mapping (71 extraction items)

### Product decisions (DR-PROD-001..014)
| Raw item | Final record | Classification | Disposition |
|---|---|---|---|
| DR-PROD-001 overflow allocation (OPD-006) | DEC-LOY-008 | DECISION (OPEN_FOUNDER, D1) | Canonical record |
| DR-PROD-002 suspension redemption (OPD-005) | DEC-LOY-011 | DECISION (OPEN_FOUNDER) | Canonical record |
| DR-PROD-003 batch rejection | DEC-LOY-010 | DECISION (OPEN_FOUNDER, D0) | Canonical record |
| DR-PROD-004 partial approval (PRD2 §28) | DEC-PROD-008 | DECISION (OPEN_FOUNDER) | Canonical; PRD2 §28 items on splitting transactions merged here (same workflow question) |
| DR-PROD-005 phone lookup (OPD-007) | DEC-ID-004 | DECISION (OPEN_FOUNDER) | Canonical record |
| DR-PROD-006 public profiles (OPD-008) | DEC-UX-003 | DECISION (OPEN_FOUNDER) | Canonical record |
| DR-PROD-007 reward quantity (OPD-004) | DEC-LOY-009 | DECISION (OPEN_FOUNDER) | Canonical record |
| DR-PROD-008 expiry/reminder defaults | DEC-PROD-009 | DECISION (OPEN_FOUNDER) | Canonical; PRD2 §28 reminder-configurability merged |
| DR-PROD-009 expired recoverability | DEC-PROD-010 | DECISION (OPEN_FOUNDER) | Canonical record |
| DR-PROD-010 verify-vs-approve verb | DEC-UX-002 | DECISION (OPEN_FOUNDER) | Canonical record |
| DR-PROD-011 gender values (OPD-009) | DEC-PROD-012 | DECISION (OPEN_FOUNDER) | Canonical record |
| DR-PROD-012 birthday visibility (OPD-010) | DEC-PROD-013 | DECISION (OPEN_FOUNDER, D4) | Canonical record |
| DR-PROD-013 pause/migration/seasonal (PRD6 §28) | DEC-LOY-013 | DECISION (OPEN_FOUNDER) | Canonical; PRD6 §28 threshold-governance merged into DEC-LOY-001 guard; gifting-conditions merged into DEC-FUT-003 |
| DR-PROD-014 dispute attachments (PRD2 §28) | DEC-PROD-011 | DECISION (DEFERRED) | Canonical record |

### Commercial decisions (DR-COMM-001..007)
| DR-COMM-001 plan names (OPD-001) | DEC-SUB-001 | DECISION | Canonical; DEC-SUB-011 preserves superseded Bronze/Silver/Gold |
| DR-COMM-002 staff limits (OPD-002) | DEC-SUB-002 | DECISION | Canonical |
| DR-COMM-003 trial rule (OPD-003) | DEC-SUB-003 | DECISION | Canonical |
| DR-COMM-004 plan capacity basis | DEC-SUB-004 | DECISION (CONFIRMED) | Resolved in docs (consolidation audit §11.1, applied Phase 1); DEC-SUB-012 preserves superseded option |
| DR-COMM-005 pricing/intervals | DEC-SUB-008 | DECISION | Canonical (also absorbs quarterly-interval query from traceability report §20) |
| DR-COMM-006 multi-business model (PRD3 §28) | DEC-SUB-009 | DECISION | Canonical; PRD3 §28 franchise item → DEC-FUT-005; inactive-product reporting → not a decision (reporting behavior already in PRD3 recommendation, folded into DEC-LOY-013 notes); discovery → DEC-FUT-001 |
| DR-COMM-007 export formats | DEC-SUB-010 | DECISION | Canonical |

### Technical decisions (DR-TECH-001..014)
| DR-TECH-001 frontend tooling (OTD-001) | DEC-TECH-003 | DECISION (OPEN_ENGINEERING) | Canonical; React+TS approval split out as CONFIRMED DEC-TECH-002 |
| DR-TECH-002 repo structure (OTD-002) | DEC-TECH-004 | DECISION | Canonical |
| DR-TECH-003 Firebase region (OTD-003) | DEC-TECH-005 | DECISION | Canonical + EXT-TECH-002/EXT-LEG-005 dependencies |
| DR-TECH-004 phone-auth feasibility (OTD-004) | DEC-SEC-001 + DEC-PROV-004 | DECISION + DEPENDENCY | Split: auth approach (engineering), delivery route (provider), Burundi proof (EXT-TECH-001) |
| DR-TECH-005 search implementation (OTD-005) | DEC-TECH-008 | DECISION | Canonical |
| DR-TECH-006 event outbox (OTD-006) | DEC-TECH-006 | DECISION | Canonical + EXT-TECH-003 proof |
| DR-TECH-007 idempotency storage (OTD-007) | DEC-TECH-007 | DECISION | Canonical |
| DR-TECH-008 PDF generation (OTD-010) | DEC-TECH-009 | DECISION | Canonical |
| DR-TECH-009 backup method (OTD-011) | DEC-TECH-010 | DECISION | Canonical + EXT-TECH-004 restore proof |
| DR-TECH-010 admin deployment (OTD-012) | DEC-TECH-011 | DECISION | Canonical |
| DR-TECH-011 Purchase Record monetary fields | DEC-DATA-003 | DECISION (OPEN_FOUNDER, D0) | Canonical |
| DR-TECH-012 loyalty number/QR algorithm | DEC-DATA-007 | DECISION (OPEN_ENGINEERING) | Canonical |
| DR-TECH-013 reward_redeemed durability | DEC-DATA-004 | DECISION | Canonical |
| DR-TECH-014 support-case/bulk-job states | DEC-DATA-006 | DECISION | Canonical |

### Provider decisions (DR-PROV-001..007)
| DR-PROV-001 OTP | DEC-PROV-004 + EXT-TECH-001 | DECISION + DEPENDENCY | Split selection vs evidence |
| DR-PROV-002 email | DEC-PROV-003 + EXT-PROV-003 | DECISION + DEPENDENCY | Split |
| DR-PROV-003 SMS | DEC-PROV-002 + EXT-PROV-002 | DECISION + DEPENDENCY | Split |
| DR-PROV-004 payment (OTD-009) | DEC-PROV-001 + EXT-PROV-001 + EXT-COMM-001 | DECISION + DEPENDENCIES | Split selection / capability evidence / agreement |
| DR-PROV-005 monitoring | DEC-PROV-005 + EXT-PROV-004 | DECISION + DEPENDENCY | Split |
| DR-PROV-006 backup | DEC-PROV-006 (+ DEC-TECH-010, EXT-TECH-004) | DECISION + DEPENDENCY | Split |
| DR-PROV-007 domain/DNS | DEC-PROV-007 | DECISION | Canonical |

### Legal dependencies (DR-LEGAL-001..006)
| DR-LEGAL-001 privacy framework | DEC-LEGAL-001 + EXT-LEG-001 | DECISION (OPEN_LEGAL) + DEPENDENCY | Retention values and marketing consent folded in |
| DR-LEGAL-002 consumer/loyalty terms | DEC-LEGAL-002 + EXT-LEG-002 | DECISION + DEPENDENCY | Canonical |
| DR-LEGAL-003 e-billing | DEC-LEGAL-003 + EXT-LEG-003 | DECISION + DEPENDENCY | Canonical |
| DR-LEGAL-004 mobile-money agreement | DEC-LEGAL-004 + EXT-COMM-001 | DECISION + DEPENDENCY | Canonical |
| DR-LEGAL-005 age/children policy | DEC-LEGAL-005 + EXT-LEG-004 | DECISION + DEPENDENCY | Canonical |
| DR-LEGAL-006 cross-border hosting | DEC-LEGAL-006 + EXT-LEG-005 | DECISION + DEPENDENCY | Canonical |

### Governance items (DR-ARCH-001..008)
| DR-ARCH-001 supersession of legacy docs | Closed in Phase 1 (banners) — recorded as DEC-PROD-007 + DEC-LOY-012 SUPERSEDED records | DECISION (closed) | Historical preservation |
| DR-ARCH-002 hierarchy + Vision doc | DEC-GOV-001 | DECISION (OPEN_FOUNDER, D0) | Canonical |
| DR-ARCH-003 15-domain adoption | Applied in Phase 1/2 per TRD23 §23.7 — no separate register record; covered by CONFIRMED architecture baseline (see canonical reference §5) | NOT A DECISION (executed normalization) | Documented here |
| DR-ARCH-004 ID renumbering approval | DEC-GOV-006 | DECISION (OPEN_FOUNDER, D0) | Canonical |
| DR-ARCH-005 permission inheritance | DEC-ID-003 | DECISION (OPEN_FOUNDER) | Canonical |
| DR-ARCH-006 canonical state adoption | Adopted as suite-wide target (Phase 1 applied confirmed cases); remaining specifics split into DEC-DATA-004/005/006 + DEC-PROD-010 | DECISION (split) | Mapped |
| DR-ARCH-007 knowledge state vocabulary | DEC-DATA-005 | DECISION (OPEN_ENGINEERING) | Canonical |
| DR-ARCH-008 admin role subset | DEC-GOV-007 | DECISION (OPEN_FOUNDER) | Canonical |

### Assumptions (DR-ASSUME-001..015 = TRD23 A-001..015)
All 15 → **AS-001..AS-015** in the [Assumptions Register](assumptions-register.md) (classification: ASSUMPTION), grouped for pilot validation under EXT-PILOT-001. None are decisions.

## C. Items identified as "not actually a decision"

| Raw item | Why | Where handled |
|---|---|---|
| DR-ARCH-003 (domain adoption) | Normalization already decided in TRD23 and executed in Phases 1–2 | Canonical reference §5–6 |
| PRD3 §28 "inactive products remain in reports" | Reporting behavior recommendation, no open choice affecting MVP build | Note under DEC-LOY-013 |
| Consolidation audit §26 items (all 14) | Each duplicates an OPD/DR item | DUPLICATE rows above |
| TRD23 §23.23 provider table rows | Duplicate of OTD/DR provider items | DEC-PROV-001..007 |

## D. Completeness check

- 71/71 extraction items mapped (66 → decision records, 15 → assumptions, 12 → dependencies with decision splits, 2 → executed/not-a-decision, remainder duplicates as noted; several items intentionally map to both a decision and a dependency).
- 0 unmapped items · 0 unresolved classification issues · 0 items resolved by guessing.
