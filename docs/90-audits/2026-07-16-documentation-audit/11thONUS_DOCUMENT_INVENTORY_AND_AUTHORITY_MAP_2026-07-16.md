# 11thONUS Document Inventory and Authority Map

**Audit date:** 16 July 2026
**Root folder:** `11THONUS_documentation`
**Files found:** 36 total — 35 markdown documents + 1 system file (`.DS_Store`, skipped)
**Unreadable files:** none
**Classification key:** AUTH = Authoritative candidate · SUPP = Supporting standard · WORK = Working draft/instrument · HIST = Historical reference / superseded · RFD = Requires founder decision

---

## 1. Root-Level Documents

| # | File | Type | Version / Status (as stated) | Purpose | Governing document | Recommended classification | Notes |
|---|------|------|------------------------------|---------|--------------------|---------------------------|-------|
| 1 | `1_11thONUS Platform Constitution.md` | Governance | v1.0, "Foundational Governance Document" | Highest-authority principles (CP-001..CP-015, pillars, values, document hierarchy) | — (self-governing) | **AUTH** | Part VII hierarchy conflicts with TRD23 §23.3 (DOC-P1-008). Requires deliberate amendment, not silent edit. |
| 2 | `11thONUS Product Definition.md` | Early product overview | v1.0, no status label | Pre-PRD product summary: users, loyalty products, fraud controls, plans, roadmap | Constitution (implied) | **HIST — superseded** | Contradicts trust model ("Owner transactions are automatically approved"), uses "loyalty products", Starter/Growth/Professional plans, Crashlytics/Tailwind stack. Superseded by PRD0–PRD10 + TRD. DOC-P0-001. |
| 3 | `2_Commerce Knowledge Standard.md` | Platform standard | v1.0, "Platform Standard", "Volume 4", governed by Constitution | Canonical commerce taxonomy, tags, languages, profiling standards, onboarding standards | Constitution | **SUPP** | Sound content; contains conversational commentary (DOC-P3-001); fixed-hierarchy wording vs TRD10 variable depth (DOC-P2-004); Preferred Language required here vs optional in PRD2 (DOC-P2-003). |
| 4 | `11thONUS Knowledge Studio.md` | Platform service definition | v1.0, "Core Platform Service", governed by Constitution | Editorial governance of the Commerce Knowledge Layer; pipeline, domains, versioning | Constitution / CKS | **SUPP** | Consistent with TRD14/TRD18/TRD22 Knowledge Studio MVP boundaries. |
| 5 | `11thONUS Rules Studio.md` | Platform service definition | v1.0, "Core Platform Service", governed by Constitution | Governed configurable business behavior; rule hierarchy, lifecycle, four-studio model | Constitution | **SUPP** | Bronze/Silver/Gold plan examples with staff limits must be marked illustrative (Consolidation Audit §11.2; DOC-P2-001). "Required Verified Units" listed configurable without MVP-fixed caveat (DOC-P0-003 evidence). |
| 6 | `11THONUS-data-model.md` | Data model spec | "v1", no status label | SQL-style schema for taxonomy/vendor/shopper/punch/redemption model | none stated | **HIST — superseded** | Entirely different product generation; threshold 11 configurable; auto-reject rate limits; "written for a development team to implement directly". DOC-P0-002/003. |

## 2. PRD Folder (`PRD/`) — Product Requirements Document, Stage 1 + Stage 2 Sections 1–10

All PRD files: Version 1.0; PRD0 and PRD1 state "Draft for review"; PRD2–PRD10 carry version only. All are **AUTH candidates** subject to the corrections in the findings register.

| # | File | Stage/Section | Purpose | Key IDs introduced | Notes |
|---|------|---------------|---------|--------------------|-------|
| 7 | `PRD0_product foundation.md` | Stage 1 | Vision, ONUS Principles, loyalty model, MVP scope/exclusions, decisions PD-001..024 | OP-001..013, PD-001..024 | "loyalty products" terminology; tier names Entry/Mid/Advanced; references missing Business Rules Catalogue. |
| 8 | `PRD1_accounts Roles, Permissions.md` | S2 §1 | Roles, permissions, account ownership, membership lifecycle | AP-001..010, FR-RP-001..010 (authorization), BR-001..016 | FR-RP prefix collides with PRD6/PRD10 (DOC-P1-001). |
| 9 | `PRD2_ Customer Registration andIdentity.md` | S2 §2 | Customer identity, loyalty number, QR, friends & family, account lifecycle | FR-CI-001..014, BR-017..026 | Fragmented formatting (DOC-P3-004); open questions §28 never closed; preferred-language optionality (DOC-P2-003). |
| 10 | `PRD3_ Business Registration.md` | S2 §3 | Business onboarding, lifecycle, subscription philosophy, plans, trial | FR-BO-001..015, BR-027..036 | Presents Starter/Growth/Professional as plan names; trial example; open questions §28. |
| 11 | `PRD4_ Customer-Verified Loyalty Engine.md` | S2 §4 | Official vocabulary (Reward Program, Verified Unit, Loyalty Cycle, On Us Moment), engine principles, Trust Ledger | CVLE-001..008, BR-037..046, AP-RP-001..005 | §19 functional requirements unnumbered (DOC-P3-008). |
| 12 | `PRD5_ Purchase Verification Lifecycle.md` | S2 §5 | Purchase Record definition, states, verification/rejection/dispute workflows | PVL-001..008, FR-PVL-001..012, BR-047..058 | States include Draft/Recorded vs canonical model (DOC-P1-002); Unit Value/Currency fields vs TRD10 (DOC-P1-010). |
| 13 | `PRD6_ Reward Programs and LC management.md` | S2 §6 | Reward Program configuration, Verified Units, Loyalty Cycles, threshold = 10 | FR-RP-001..012 (Reward Programs), BR-059..068 | FR-RP collision; Loyalty Cycle states Current/Historical (DOC-P1-002); open questions §28. |
| 14 | `PRD7_ Reward Redemption.md` | S2 §7 | Redemption workflow, On Us Moments, reward states, gift/wallet readiness | FR-RL-001..009, BR-069..077 | "Redemption States" heading actually lists Reward states incl. "Historical" (DOC-P1-002). |
| 15 | `PRD8_ Trust Management.md` | S2 §8 | Trust boundaries, operational integrity, Trust Event categories, indicators | OI-001..007, FR-TM-001..008, BR-078..085 | Consistent with Trust Domain. |
| 16 | `PRD9_ Reporting and Analytics.md` | S2 §9 | Reporting levels, dashboards, exports, benchmarking (future) | FR-BI-001..008, BR-086..090 | Header anomaly (DOC-P3-009); PDF/CSV/Excel vs TRD CSV-only (DOC-P2-002); closing commentary section. |
| 17 | `PRD10_ Platform Administration.md` | S2 §10 | Roles/permissions restated, role matrix, multi-business, franchise future | FR-RP-001..008 (RBAC), BR-091..098 | Third FR-RP collision; inheritance model conflicts with PRD1 (DOC-P1-007); duplicates PRD1 content (DOC-P3-006). |

## 3. TRD Folder (`TRD/`) — Technical Requirements Document, Chapters 1–23 + Consolidation Audit

All TRD files: Version 1.0, "Draft for approval" (TRD1-7 carries version only; TRD# audit is a "Consolidation Working Document"). All chapter files are **AUTH candidates** subject to consolidation corrections.

| # | File | Chapters / Part | Purpose | Key IDs | Notes |
|---|------|-----------------|---------|---------|-------|
| 18 | `TRD1-7_Plartform Architecture.md` | Ch 1–7, Part I | Technical philosophy, TAP principles, 12-domain model, ownership matrix, constraints | TAP-001..010 | 12-domain model superseded by TRD23 15-domain model (DOC-P0-004); filename typo; conversational commentary. |
| 19 | `TRD8_Firebase Platform Architecture.md` | Ch 8, Part II | Firebase services, environments, functions, offline strategy, performance | — | Offline policy consistent with TRD16/22/23. |
| 20 | `TRD9_Physical Architecture-Integration domain.md` | Ch 9, Part II | Integration Domain: adapters, webhooks, idempotency, payment/messaging flows | FR-INT-xxx, IR-xxx | Establishes the Integration Domain later confirmed in TRD23. |
| 21 | `TRD10_Firestore Data Architecture.md` | Ch 10, Part III | Collections, ownership matrix, schemas, isolation, retention, migrations | DAP-001..010, FR-DATA-001..015, DA-001..015 | Ownership matrix pre-dates final domain model (DOC-P0-004); subscription enum incomplete (DOC-P1-003); gender enum provisional (DOC-P2-005). |
| 22 | `TRD11_Cloud Functions & Domain Services.md` | Ch 11, Part IV | Commands/events, validation layers, idempotency, transactions, core workflows, outbox, DLQ | FR-SRV-xxx, SP-xxx | Covers all eight critical workflows incl. overflow allocation (§11.20–11.21). |
| 23 | `TRD12_Security and Access Control.md` | Ch 12, Part V | AuthN/AuthZ, custom claims, security rules, App Check, sessions, recovery | AIR-001..006, FR-SEC-xxx, SR-xxx | Strong; consistent with DAP-003 no-client-writes. |
| 24 | `TRD13_Communications and Localization.md` | Ch 13, Part VI | Language hierarchy, translation keys, fallback, notification architecture | FR-COM-xxx, CR-xxx | EN+FR launch; Kirundi/Swahili/Kinyarwanda ready. |
| 25 | `TRD14_Search and Discovery Architecture.md` | Ch 14, Part VII | Taxonomy search, onboarding classification, multilingual search, MVP boundary | SAP-001..008, FR-SRCH-xxx, SD-xxx | MVP = onboarding/internal search; discovery deferred. |
| 26 | `TRD15_Reporting and Analytics.md` | Ch 15, Part VIII | Projection architecture, Metric Catalogue, freshness, isolation | RAP-001..008, FR-RPT-xxx, RR-xxx | Projections rebuildable; consistent with DAP-002. |
| 27 | `TRD16_Frontend and User Experience Architecture.md` | Ch 16, Part IX | PWA architecture, surfaces, state management, offline UX, QR | FR-FE-xxx, FA-xxx | Offline boundaries match TRD22/23. |
| 28 | `TRD17_Subscriptions and billing.md` | Ch 17, Part X | Plans, entitlements, trial, lifecycle, grace, suspension, enforcement | FR-SUB-xxx, SB-xxx | Canonical 10-state subscription lifecycle; plan names/limits open. |
| 29 | `TRD18_Platform Governance and Administration.md` | Ch 18, Part XI | Admin roles (11), separation of duties, Knowledge/Rules Studio tech, bulk jobs | AAP-001..008, FR-ADM-xxx, AR-xxx | No universal administrator; typed commands. |
| 30 | `TRD19_Quality Engineering.md` | Ch 19, Part XII | Test pyramid, emulator/security-rule/idempotency/concurrency testing, release gates | QAP-001..008, FR-QA-xxx, QR-xxx | Covers all critical-workflow test classes. |
| 31 | `TRD20_ Deployment and Operational Resilience.md` | Ch 20, Part XIII | Environments, CI/CD, IaC, backup/restore, incident, cost | ORP-001..010, FR-OPS-xxx, OP-001..? | OP- prefix collides with PRD0 ONUS Principles (DOC-P1-001). |
| 32 | `TRD21_Privacy and Data Protection.md` | Ch 21, Part XIV | Processing register, consent, rights, retention, minors, cross-border | PDP/PR-xxx, FR-PRV-001..028 | Legal review dependencies LCD-001..006 remain external. |
| 33 | `TRD22_MVP Scope Implementation and Delivery.md` | Ch 22, Part XV | Strict MVP scope, deferred list, Phases 0–16, boundaries, exit gates, agent standards | DIP-001..007, FR-IMP-001..020, IM-001..015 | The scope backbone of the suite. |
| 34 | `TRD23_Traceability and Completion Review.md` | Ch 23, Part XVI | Traceability model, final domain ownership, terminology freeze, OPD/OTD/LCD/A catalogues, freeze conditions | FR-TRC-001..015, TC-001..012, OPD-001..010, OTD-001..012, LCD-001..006, A-001..015 | The authoritative reconciliation chapter. |
| 35 | `TRD#_Consolidation and Consistency Audit.md` | — | TRD-internal consolidation audit: canonical terminology, states, domain corrections, numbering plan, execution sequence | — | **WORK** — consolidation instrument, not part of the frozen suite. Its corrections are approved-direction but unapplied (DOC-P0-004 etc.). |

## 4. Other Files

| # | File | Classification | Note |
|---|------|----------------|------|
| 36 | `.DS_Store` | Skip | macOS system file; not a document. |

Uploaded to the session (not in folder): `11thONUS Documentation Audit.md` — the audit brief for this engagement (instructions, not project content).

## 5. Duplicates and Superseded Candidates

- **No exact duplicate files** were found (no two files cover the same section in the same generation).
- **Superseded candidates:** `11thONUS Product Definition.md` and `11THONUS-data-model.md` (earlier product generations; see DOC-P0-001/002).
- **Overlapping content requiring consolidation (not duplication):** PRD1 vs PRD10 (roles/permissions defined twice — DOC-P3-006/DOC-P1-007); TRD1-7 Chapter 4/6 vs TRD23 §23.7 (domain model defined twice — DOC-P0-004); plan tiers defined in five places (DOC-P2-001).

## 6. Mapping to the Intended Governance Hierarchy

| Intended document | Present? | Actual file(s) |
|---|---|---|
| 1. Platform Constitution | Yes | `1_11thONUS Platform Constitution.md` |
| 2. Product Requirements Document | Yes (11 files) | `PRD/PRD0`–`PRD/PRD10` |
| 3. Technical Requirements Document | Yes (18 files) | `TRD/TRD1-7`–`TRD/TRD23`, plus consolidation audit |
| 4. Commerce Knowledge Standard | Yes | `2_Commerce Knowledge Standard.md` (+ Knowledge Studio service doc) |
| 5. Platform Standards Manual | **Missing** | Referenced as "Platform Standards" in TRD front matter |
| 6. Platform Design System | **Missing** | Referenced in Constitution Part VII |
| 7. Engineering Standards | **Missing** | Required by TRD §22/§23 before implementation |
| 8. Operational Playbooks | **Missing** | Referenced in Constitution Part VII |
| 9. API and Integration Guide | **Missing** | TRD9 covers architecture; guide itself absent |
| 10. Decision Register | **Missing** | Required before freeze (TRD23 §23.37) |
| 11. Requirements Traceability Register | **Missing** | Required before implementation (FR-TRC-003) |
| 12. Implementation plans / change logs | Partially | TRD22 contains the plan; change log to be created at Phase 0 |
| 13. Earlier brainstorming / superseded docs | Yes (unlabelled) | Product Definition, data-model — must be labelled |
| — Vision & Product Strategy (Constitution Part VII item 2) | **Missing** | Existence decision required (DOC-P1-008) |
