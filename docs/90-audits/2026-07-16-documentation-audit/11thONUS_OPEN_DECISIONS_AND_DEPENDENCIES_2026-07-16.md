# 11thONUS Open Decisions and External Dependencies — Extraction

**Audit date:** 16 July 2026
**Purpose:** Consolidated input for the future formal Decision Register. Sources: TRD23 (OPD/OTD/LCD/A catalogues), TRD Consolidation Audit §26, PRD open-question sections (PRD2 §28, PRD3 §28, PRD6 §28), and new suite-level items surfaced by this audit.
**ID convention (proposed):** DR-PROD (product), DR-COMM (commercial), DR-TECH (technical), DR-PROV (provider), DR-LEGAL (legal dependency), DR-ARCH (architecture exception/governance), DR-ASSUME (assumption to validate).

---

## A. Product Decisions

| ID | Question | Context / options found | Recommended direction (where supported by documents) | Owner | Required by | Blocking effect |
|---|---|---|---|---|---|---|
| DR-PROD-001 | Overflow/pending Verified Unit allocation (= OPD-006) | TRD11 §11.21 + Consolidation Audit §8.3 recommend: complete cycle, one available reward, hold overflow pending, apply after redemption | Adopt documented default | Founder | Phase 7 | Blocks Loyalty Domain implementation |
| DR-PROD-002 | Reward redemption during business suspension (= OPD-005) | TRD17 §17.19–17.20: options — redeemable throughout / grace only / manual review / blocked until reactivation | Documents lean to preservation (customer trust); confirm operational window | Founder | Phase 10 | Blocks suspension implementation |
| DR-PROD-003 | Batch rejection of purchases (DOC-P1-006) | PRD0 §14.3 allows "reject selected"; TRD23 §23.13 requires individual rejection with reason | TRD position better supports trust model | Founder | Phase 6 | Blocks verification UI |
| DR-PROD-004 | Partial approval of multi-quantity Purchase Records (PRD2 §28) | Approve 4 of 5 recorded coffees? Options: partial verify / reject whole / dispute-and-correct | Documents implicitly favor dispute→correction path (PRD5 §16); confirm | Founder | Phase 6 | Verification UX and data model |
| DR-PROD-005 | Customer phone lookup by staff (= OPD-007) | QR/loyalty number normal; TRD12 says phone lookup "restricted and logged" | Restrict to fallback with logging | Founder + privacy | Phase 5 | Purchase-recording UI |
| DR-PROD-006 | Public business profiles at MVP (= OPD-008) | TRD23 §23.15: pages for Reward Program visibility, no marketplace | Minimal profile, no discovery | Founder | Phase 13 (nav freeze) | Customer navigation |
| DR-PROD-007 | Reward quantity default and >1 support (= OPD-004) | TRD10 rewardQuantity: number; default 1 | Default 1; confirm any launch program needs >1 | Founder | Phase 4 (schema freeze) | Reward Program schema |
| DR-PROD-008 | Pending purchase expiry / reminder defaults (DOC-P1-009; PRD2 §28) | "Business Rules Catalogue" (missing) was to define; TRD22 §22.31 relocates to Rules Studio typed rules; no values anywhere | Define seed values in Rules Studio (e.g., reminder at 24h — example in TRD23 §23.18) | Founder | Phase 6/9 | Reminders and expiry jobs |
| DR-PROD-009 | Expired pending purchases recoverable? | PRD0 §14.5 "approval of older records" vs Purchase Record `expired` state | Define whether expiry is terminal | Founder | Phase 6 | State model |
| DR-PROD-010 | Customer action verb in UI: "Verify" vs "Approve" | Both used across PRD2/PRD5 | Single choice + translation keys | Founder | Phase 6 | UI copy freeze |
| DR-PROD-011 | Optional gender values + wording (= OPD-009) | TRD10 enum provisional | Confirm with privacy review | Founder + legal | Phase 2 profile | Progressive profile |
| DR-PROD-012 | Birthday visibility / campaign eligibility (= OPD-010) | TRD21 §21.10: eligibility not disclosure | Adopt eligibility-only | Founder | Post-MVP feature gate | Birthday features |
| DR-PROD-013 | Reward Program pause with outstanding rewards; program migration; seasonal variants (PRD6 §28) | Unresolved PRD questions | Pause preserves rewards (PRD6 §5 implies); others post-MVP | Founder | Phase 4 | Program lifecycle edge cases |
| DR-PROD-014 | Dispute evidence attachments (PRD2 §28) | Undecided | Defer to post-MVP unless pilot demands | Founder | Phase 6 | Dispute UX |

## B. Commercial Decisions

| ID | Question | Context | Recommended direction | Owner | Required by | Blocking |
|---|---|---|---|---|---|---|
| DR-COMM-001 | Final plan names (= OPD-001; DOC-P2-001) | Entry/Mid/Advanced (PRD0), Starter/Growth/Professional (PRD3/TRD17), Bronze/Silver/Gold (Rules Studio, not approved) | Starter/Growth/Professional as working set | Founder | Phase 10 | Pricing publication |
| DR-COMM-002 | Staff limits per plan (= OPD-002) | Rules Studio examples (5/20/unlimited) not approved | Decide with plan catalogue | Founder | Phase 10 | Entitlement service |
| DR-COMM-003 | Trial rule (= OPD-003) | Time / volume / whichever-first (PRD3 example: 30 days or 100 verified purchases) | Whichever-first, values TBD | Founder | Phase 10 | Trial implementation |
| DR-COMM-004 | Plan capacity basis (DOC-P1-005) | products vs Reward Programs | Active Reward Program limit (Consolidation Audit §11.1) | Founder | Phase 10 | Plan enforcement + PRD wording |
| DR-COMM-005 | BIF pricing and billing intervals | TRD10 offers monthly/quarterly/annual; no PRD basis for quarterly | Confirm intervals + launch prices | Founder | Phase 10 | Plan catalogue seed |
| DR-COMM-006 | Multi-business subscription model (PRD3 §28) | Recommendation in-doc: one subscription per business | Adopt per-business subscriptions | Founder | Phase 10 | Billing model |
| DR-COMM-007 | Export formats at MVP (DOC-P2-002) | PRD9: PDF/CSV/Excel; TRD22: CSV | CSV launch; PDF receipts only | Founder | Phase 11 | Reporting exports |

## C. Technical Decisions (from TRD23 §23.22 + audit)

| ID | Question | Owner | Required by |
|---|---|---|---|
| DR-TECH-001 | Frontend tooling: build tool, router, server-state, forms, components, PWA, testing (= OTD-001; Tailwind unconfirmed — DOC-P2-007) | Engineering Lead | Phase 0 |
| DR-TECH-002 | Repository structure: monorepo recommended (= OTD-002) | Engineering Lead | Phase 0 |
| DR-TECH-003 | Firebase region (= OTD-003; legal interplay LCD-006) | Engineering Lead + legal | Phase 1 |
| DR-TECH-004 | Phone-auth delivery in Burundi + fallback (= OTD-004) | Engineering Lead | Phase 2 |
| DR-TECH-005 | Search implementation: Firestore-backed MVP, provider deferred (= OTD-005) | Engineering Lead | Phase 3 |
| DR-TECH-006 | Event delivery: transaction + outbox + processor (= OTD-006) | Engineering Lead | Phase 1 |
| DR-TECH-007 | Idempotency storage approach (= OTD-007) | Engineering Lead | Phase 1 |
| DR-TECH-008 | PDF/export generation tooling (= OTD-010) | Engineering Lead | Phase 10/11 |
| DR-TECH-009 | Backup method + restore procedure (= OTD-011) | Engineering Lead | Phase 14 |
| DR-TECH-010 | Admin deployment isolation (= OTD-012; separate deployment preferred) | Engineering Lead | Phase 12 |
| DR-TECH-011 | Purchase Record monetary fields (DOC-P1-010) | Engineering Lead + Founder | Phase 5 |
| DR-TECH-012 | Loyalty number / QR reference generation algorithm (gap noted in traceability report §1) | Engineering Lead | Phase 2 |
| DR-TECH-013 | reward_redeemed durable state vs transition (Consolidation Audit §7.7) | Engineering Lead | Phase 7 |
| DR-TECH-014 | Support case + bulk job state models (terminology audit C.17/C.19) | Engineering Lead | Phase 12 |

## D. Provider Decisions (from TRD23 §23.23; all = DR-PROV-00x)

| ID | Area | Required capability | Deadline |
|---|---|---|---|
| DR-PROV-001 | Phone OTP | Reliable Burundi delivery | Phase 2 |
| DR-PROV-002 | Email | Transactional + status | Phase 9 |
| DR-PROV-003 | SMS | Burundi transactional | Phase 9 |
| DR-PROV-004 | Subscription payment | BIF mobile-money collection + callback (= OTD-009) | Phase 10 |
| DR-PROV-005 | Error monitoring | Frontend + server | Phase 1 |
| DR-PROV-006 | Backup | Firestore + Storage recovery | Phase 14 |
| DR-PROV-007 | Domain/DNS | Production PWA + email auth | Phase 16 |

## E. Legal and Compliance Dependencies (no legal conclusions made — classification only)

| ID | Dependency | Source | Blocking |
|---|---|---|---|
| DR-LEGAL-001 | Burundi privacy framework review (rights, marketing, cross-border, retention, breach) | LCD-001 | Launch blocker |
| DR-LEGAL-002 | Consumer/loyalty terms (program terms, reward-honouring obligation, liability) | LCD-002 | Launch blocker |
| DR-LEGAL-003 | Electronic billing/invoice/tax requirements | LCD-003 | Phase 10 |
| DR-LEGAL-004 | Mobile-money merchant agreement | LCD-004 | Phase 10 |
| DR-LEGAL-005 | Customer minimum-age / guardian policy (interacts with family use TRD21 §21.40–21.42) | LCD-005 | Phase 2/14 |
| DR-LEGAL-006 | Cross-border Firebase hosting position (interacts with region choice) | LCD-006 | Phase 1/14 |

## F. Architecture / Governance Exceptions and Decisions

| ID | Question | Context | Owner | Required by |
|---|---|---|---|---|
| DR-ARCH-001 | Formal supersession of `11thONUS Product Definition.md` and `11THONUS-data-model.md` | DOC-P0-001/002 | Founder | Immediately (pre-freeze) |
| DR-ARCH-002 | Governance hierarchy reconciliation + Vision & Product Strategy existence | DOC-P1-008 (Constitution Part VII vs TRD23 §23.3) | Founder | Pre-freeze |
| DR-ARCH-003 | Adoption of 15-domain model into TRD1-7/TRD10 text | DOC-P0-004 (decision exists in TRD23; application approval needed) | Founder | Pre-freeze |
| DR-ARCH-004 | Requirement-ID renumbering mapping approval | DOC-P1-001; ID audit §5 | Founder | Pre-freeze |
| DR-ARCH-005 | Permission inheritance semantics | DOC-P1-007 | Founder | Phase 2 |
| DR-ARCH-006 | Canonical state tables adoption suite-wide | DOC-P1-002/003 | Founder | Pre-freeze |
| DR-ARCH-007 | Knowledge object state vocabulary unification | Terminology audit C.15 | Founder + Engineering | Phase 3 |
| DR-ARCH-008 | MVP administrator role subset (TRD18's 11 roles vs PRD10's one) | Traceability report §20 | Founder | Phase 12 |

## G. Assumptions Requiring Validation (TRD23 §23.25 A-001..A-015 → DR-ASSUME-001..015)

Bujumbura-first pilot; SME recurring-service businesses; standard devices; no customer-payment processing in MVP; external subscription payments; delayed verification acceptable; customer responsibility for shared-number activity; 10-unit threshold; business provides reward; one branch; EN+FR sufficiency; controlled launch taxonomy; no public discovery needed; single payment provider. **Each must be validated during pilot planning; none may silently become a product rule without register entry.**

---

## Totals

| Group | Count |
|---|---|
| Product decisions | 14 |
| Commercial decisions | 7 |
| Technical decisions | 14 |
| Provider decisions | 7 |
| Legal dependencies | 6 |
| Architecture/governance | 8 |
| Assumptions to validate | 15 |
| **Total register candidates** | **71** |
