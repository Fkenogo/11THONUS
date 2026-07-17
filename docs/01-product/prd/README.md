# Product Requirements Document (PRD) — Index

**Classification:** Authoritative Product · **Status:** Version 1.0, pre-freeze
Eleven files: Stage 1 (foundation) + Stage 2 Sections 1–10. Do not merge chapters. Implementation phases refer to TRD Chapter 22 (Phases 0–16).

**Companion document:** [Product Experience Principles](../product-experience-principles.md) — the product philosophy of *how 11thONUS should feel*, read before any wireframe, mockup, component, design system, or frontend implementation begins. Not a PRD chapter; sits alongside this folder at `01-product/`.

| # | File | Title | Purpose | Main domain(s) | Phases affected | Status |
|---|---|---|---|---|---|---|
| 0 | [00-product-foundation.md](00-product-foundation.md) | Product Foundation | Vision, ONUS Principles, loyalty model, MVP scope/exclusions, product decisions PD-001..024 | All | All | Draft for review |
| 1 | [01-accounts-roles-and-permissions.md](01-accounts-roles-and-permissions.md) | Roles, Permissions and Account Ownership | Access principles, role contexts, membership lifecycle, ownership (FR-AUTHZ-001..010, BR-001..016) | Identity | 2 | Draft for review |
| 2 | [02-customer-registration-and-identity.md](02-customer-registration-and-identity.md) | Customer Registration and Identity | Loyalty number, QR, friends & family, account lifecycle (FR-CI, BR-017..026) | Identity | 2 | Draft for review |
| 3 | [03-business-registration.md](03-business-registration.md) | Business Registration, Subscription and Onboarding | Business lifecycle, onboarding, plans/trial philosophy (FR-BO, BR-027..036) | Identity, Subscription | 3, 10 | Draft for review |
| 4 | [04-customer-verified-loyalty.md](04-customer-verified-loyalty.md) | Customer-Verified Loyalty Engine | Official vocabulary, engine principles CVLE-001..008, functional requirements FR-CVLE-001..013, Trust Ledger concept (BR-037..046) | Loyalty | 7 | Draft for review |
| 5 | [05-purchase-verification.md](05-purchase-verification.md) | Purchase Verification Lifecycle | Purchase Record model, verification/rejection/dispute workflows (FR-PVL, BR-047..058) | Purchase | 5, 6 | Draft for review |
| 6 | [06-reward-programs-and-loyalty-cycles.md](06-reward-programs-and-loyalty-cycles.md) | Reward Programs, Verified Units and Loyalty Cycles | Program configuration, threshold = 10, cycles (FR-RP-001..012, BR-059..068) | Reward Programs, Loyalty | 4, 7 | Draft for review |
| 7 | [07-reward-redemption.md](07-reward-redemption.md) | Reward Redemption and On Us Moments | Redemption workflow, reward states, gift/wallet readiness (FR-RL, BR-069..077) | Reward | 8 | Draft for review |
| 8 | [08-trust-management.md](08-trust-management.md) | Trust Management and Operational Integrity | Trust boundaries, OI principles, Trust Event categories (FR-TM, BR-078..085) | Trust | 5–8, 11 | Draft for review |
| 9 | [09-reporting-and-analytics.md](09-reporting-and-analytics.md) | Reporting, Analytics and Business Intelligence | Reporting levels, dashboards, exports (FR-BI, BR-086..090) | Reporting | 11 | Draft for review |
| 10 | [10-platform-administration.md](10-platform-administration.md) | Platform Administration, Roles and Permissions | Role matrix, multi-business, franchise future (FR-RBAC-001..008, BR-091..098) | Administration, Identity | 2, 12 | Draft for review |

**Resolved (Phase 4, 16 July 2026 — DEC-GOV-006):** the `FR-RP` prefix previously collided across files 1, 6 and 10, and `OP` collided between PRD 0 and TRD 20. File 1's set is now `FR-AUTHZ-*`, file 10's is now `FR-RBAC-*`; file 6 keeps `FR-RP-*` (its natural owner). PRD 0's `OP-*` (ONUS Principles) is unchanged; TRD 20's rule table is now `OR-*`. Full record: [Requirement ID Mapping](../../00-governance/requirement-id-mapping.md). Original findings: [Requirements ID Audit](../../90-audits/2026-07-16-documentation-audit/11thONUS_REQUIREMENTS_ID_AUDIT_2026-07-16.md).
