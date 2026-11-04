# 11THONUS — Item-Specific Loyalty Circle Architecture Impact Assessment & Commercial Alignment

> **Date:** 2026-10-13
> **Status:** Assessment complete · Governance & architecture aligned
> **Governing Decision:** `FD-LOY-ITEM-CIRCLE-001` / `DEC-LOY-019` (CONFIRMED)
> **Amends:** `DEC-LOY-002` active-Circle uniqueness invariant in place
> **Reconciles:** `DEC-SUB-014` / `WP-COM` commercial capacity & admission stream keying
> **Verdict:** **ITEM-SPECIFIC CIRCLE GOVERNANCE & ARCHITECTURE ALIGNED — READY FOR FOUNDER IMPLEMENTATION AUTHORIZATION**
> **Implementation Authorization:** **NOT YET GRANTED** (Documentation & architecture alignment only; 0 runtime, 0 schema, 0 migration, 0 fixture changes)

---

## 1. Executive Summary & Purpose

This document records the comprehensive architecture impact assessment and alignment plan for Founder Decision `FD-LOY-ITEM-CIRCLE-001` / `DEC-LOY-019`.

It resolves the three review findings from PR #311:
1. **Finding 1 (P1): Commercial stream/capacity identity.** Corrects the prior claim that commercial impact was "NONE". Commercial capacity, stream references (`computeStreamRef`), `sumAdmittedStreamUnits`, admission blocks (`commercial_admission_blocks`), active-circle grace, and consumption projection must follow the item-specific Circle boundary `(Business, Customer, Reward Programme, Qualifying Item)`.
2. **Finding 2 (P1): DEC-LOY-002 active-Circle uniqueness contradiction.** Amends `DEC-LOY-002` in place: the active-Circle uniqueness invariant is strictly `(Business, Customer, Reward Programme, Qualifying Item)`. Concurrent active Circles for different qualifying items within the same Programme are permitted; concurrent active Circles for the same item remain strictly prohibited.
3. **Finding 3 (P2): Decision Register controlled-update header metadata.** Refreshed the Decision Register header metadata to 2026-10-13, moved the prior 2026-10-05 update into the history chain, and aligned total record and confirmed counts (70 CONFIRMED, 122 total).

It reconciles the platform environment against historical data:
- **MIGRATION CLEAR — DISPOSABLE DATA ONLY.** Zero production or staging PostgreSQL instances exist. The local preview database contains 100% synthetic seed data where all 95 purchases already carry `qualifying_item_id`.

---

## 2. Founder Product Truth & Hierarchy

The Founder-confirmed product hierarchy is:

```
BUSINESS
  → REWARD PROGRAMME (offer family / business grouping)
      → ONE OR MORE QUALIFYING ITEMS (specific products/services)
          → ONE INDEPENDENT CUSTOMER LOYALTY CIRCLE PER QUALIFYING ITEM (10+1 progression)
```

The intended model is **NOT**:
- `Reward Programme = Item = Circle`
- and **NOT** one pooled Circle combining all qualifying items in a Programme.

### The 12 Binding Rules of DEC-LOY-019

1. A Reward Programme is a business-defined grouping of one or more item-specific loyalty offers.
2. A Reward Programme may contain one or more qualifying items (`DEC-LOY-016` retained).
3. Each qualifying item within a Reward Programme defines one independent Loyalty Circle track for each participating Customer.
4. Each Loyalty Circle contains **EXACTLY ONE** qualifying item.
5. A Customer may therefore have multiple simultaneous Circles under one Reward Programme, one per qualifying item.
6. Verified Units from different qualifying items **MUST NEVER** be pooled into the same Circle.
7. A Verified Unit represents verified quantity of one specific qualifying item.
8. The 10+1 relationship is item-specific: ten verified units of qualifying item A → reward available for qualifying item A's Circle.
9. For MVP, the On Us reward corresponds to the qualifying item whose Circle reached the 10-unit threshold.
10. This supersedes any implementation interpretation where multiple qualifying items inside one Reward Programme contribute to one shared Circle.
11. This **DOES NOT** remove multi-item Reward Programme capability.
12. For MVP, do **NOT** introduce a separate `CircleDefinition` entity unless the architecture proves one is necessary.

### Concrete Examples

- **Express Styling Programme**
  - *Blow-dry Circle:* item = Blow-dry; progress = Blow-dry units only; reward = Blow-dry
  - *Hair Wash Circle:* item = Hair Wash; progress = Hair Wash units only; reward = Hair Wash
- **Premium Cut Programme**
  - *Haircut Circle:* item = Haircut; progress = Haircut units only; reward = Haircut
  - *Braiding Circle:* item = Braiding; progress = Braiding units only; reward = Braiding
- **Sparkle Wash Programme**
  - *Basic Wash Circle:* item = Basic Wash; progress = Basic Wash units only; reward = Basic Wash
  - *Full Detail Circle:* item = Full Detail; progress = Full Detail units only; reward = Full Detail

---

## 3. Authoritative Terminology

| Term | Definition |
|---|---|
| **REWARD PROGRAMME** | A business-defined grouping/container for one or more item-specific loyalty offers. |
| **QUALIFYING ITEM** | The specific Business-defined product/service that can generate Verified Units. |
| **VERIFIED UNIT** | One verified quantity of one specific qualifying item. |
| **LOYALTY CIRCLE** | A Customer's independent earn-and-redeem progression for one qualifying item within one Reward Programme. |
| **REWARD** | The On Us entitlement produced when one item-specific Circle reaches its 10-unit threshold. For MVP, the reward corresponds directly to the qualifying item of that Circle. |

---

## 4. Entity Architecture & Identity Boundaries

### 4.1 Circle Definition Entity Assessment
An additional persistent `CircleDefinition` entity is **NOT required for MVP**:
- The combination of `(Reward Programme Version, Qualifying Item)` fully specifies the Circle track rules.
- The Customer-specific Circle identity is therefore conceptually:
  `Business + Customer + Reward Programme + Qualifying Item`.
- A separate entity would only be necessary if requirements demanded independent per-Circle configuration (e.g. custom threshold per Circle, independent expiration policies, or variable reward quantities beyond what versioned item structures express). Under the fixed 10+1 MVP, no separate entity is introduced.

### 4.2 Reward Binding
For MVP, every Reward produced retains immutable item identity:
- 10 verified Blow-dries → Blow-dry reward.
- 10 verified Hair Washes → Hair Wash reward.
- Cross-item rewards (e.g. 10 Blow-dries → Hair Wash reward) and generic pooled rewards are strictly prohibited.
- The Reward record must store `qualifying_item_id` and the version snapshot at cycle completion.

### 4.3 Programme Versioning Consequences
- **Item Added:** New qualifying item in a published version immediately opens a new Circle track for participating customers; existing item Circles continue uninterrupted.
- **Item Retired:** Historical Circles for that item remain active to complete or redeem according to platform retirement rules; new purchases are rejected at frontline.
- **Item Renamed:** Historical Circles retain stable `qualifying_item_id` and frozen display snapshot; mutable current names never overwrite historical provenance.
- **Programme Version Published:** Active Circles bind to their first-unit version or adopt the active version per `DEC-LOY-008` rules without cross-item contamination.

---

## 5. Environmental Reconciliation & Historical Data Status

### 5.1 Environment Audit Findings
1. **Production & Staging:**
   - No production PostgreSQL database exists.
   - No staging PostgreSQL database exists.
   - No real customer loyalty data exists anywhere on the platform.
2. **Local Preview Database (`eleventhonus_platform_local` on port 28110):**
   - 29 migrations applied (up to `0029_purchase_records_recorder_recent_idx`).
   - 95 purchase records exist, and **95/95 (100%) already carry `qualifying_item_id IS NOT NULL`**.
   - Exactly 0 legacy NULL item purchases exist.
   - 92 verified units (110 quantity) are 100% deterministic (Class A).
   - 15/15 loyalty cycles are single-item; 6/6 rewards are single-item.
   - All data originates from synthetic deterministic seeds (`founder-slice-1` via `tests/preview/seed/scenario.mjs`).

### 5.2 Migration Verdict
- **Verdict:** **MIGRATION CLEAR — DISPOSABLE DATA ONLY**.
- **Loyalty Historical Migration:** **CLEAR** (no production backfill or data reconstruction required).
- **Commercial Historical Migration:** **CLEAR / DISPOSABLE ENVIRONMENT**.
- **Commercial Schema/Key Adaptation:** **REQUIRED FOR IMPLEMENTATION** (code and key updates needed prior to feature merge).

---

## 6. Commercial Model Reassessment (Deep Analysis)

### 6.1 Substance of DEC-SUB-014 Unchanged
`DEC-SUB-014` remains fully in force:
- Core commercial unit = one completed 10-unit earning side of a 10+1 Circle.
- Commercial price = USD 2 equivalent per commercial unit.
- Free trial allowance = 3–5 commercial units.
- Commercial capacity governs whether new Circles may start.
- Active-Circle grace permits already-started Circles to finish without capacity.
- Negative credit is recoverable with no hard floor.
- Commercial restriction never cancels earned rewards or destroys loyalty history.

### 6.2 Current Commercial Keying Seams
Currently, the Commercial admission seam scopes streams by:
`Business + Customer + Reward Programme`.

Specifically:
1. `computeStreamRef` in `purchaseAdmissionPort.ts`:
   ```typescript
   export function computeStreamRef(params: {
     readonly businessId: string;
     readonly customerIdentityId: string;
     readonly rewardProgramId: string;
   }): string {
     return createHash("sha256")
       .update(`${params.businessId}${params.customerIdentityId}${params.rewardProgramId}`)
       .digest("hex");
   }
   ```
2. `sumAdmittedStreamUnits` in `loyaltyCycleRepository.ts`:
   ```sql
   SELECT COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN quantity ELSE -quantity END), 0) AS units
     FROM verified_units
    WHERE business_id = $1 AND customer_identity_id = $2 AND reward_program_id = $3
   ```
3. `commercial_admission_blocks` table constraint:
   `CONSTRAINT commercial_admission_blocks_position_unique UNIQUE (business_id, stream_ref, block_index)`

### 6.3 The Collision and Capacity Leak Problem
When Circles become item-specific:
- If a customer buys 1 Blow-dry (0 → 1) and 1 Hair Wash (0 → 1) under Express Styling:
  - These are **TWO independent Circle starts**. Each requires commercial capacity.
  - Under current code, `sumAdmittedStreamUnits` pools them (1 + 1 = 2 units), treating them as the *same* Circle. The second purchase calculates `newBlocks = 0` and reserves **zero capacity**.
  - If capacity was reserved separately without widening `stream_ref`, both would attempt to write `block_index = 1` for the same `stream_ref`, failing on `commercial_admission_blocks_position_unique`.

### 6.4 Target Commercial Stream Identity: Option A vs Option B
Target conceptual identity:
`Business + Customer + Reward Programme + Qualifying Item`.

We evaluated two architectural approaches:
- **Option A (Recommended):** `stream_ref` remains an opaque SHA-256 digest incorporating `qualifyingItemId`:
  `sha256(businessId + '' + customerIdentityId + '' + rewardProgramId + '' + qualifyingItemId)`.
- **Option B:** Add an explicit `qualifying_item_id` column to commercial tables (`commercial_admissions`, `commercial_admission_blocks`).

**Recommendation: Option A is strongly recommended:**
1. **Privacy & Decoupling:** Commercial domain intentionally stores no customer PII or raw loyalty entity identifiers. The opaque hash preserves clean domain boundaries.
2. **Schema & Migration Safety:** The table `commercial_admission_blocks` already uses `stream_ref TEXT NOT NULL` with `UNIQUE (business_id, stream_ref, block_index)`. Option A requires **zero DDL modifications** to immutable ledger/block tables.
3. **Recomputation Compatibility:** The projection service (`projectCommercialConsumption`) can deterministically recompute the exact `stream_ref` from the completed Cycle/Reward because the Cycle/Reward carries `qualifying_item_id`.
4. **Performance:** Stream reference remains a compact, fixed-size 64-character hex string with optimal index performance.

### 6.5 Commercial Scenario Proof
- **Scenario 1 (Concurrent Starts):**
  - Customer receives 1 Blow-dry unit (0 → 1): Earmarks `stream_ref(Blow-dry)`, `block_index = 1`.
  - Customer receives 1 Hair Wash unit (0 → 1): Earmarks `stream_ref(Hair Wash)`, `block_index = 1`.
  - Result: Two separate blocks reserved, two independent Circle positions tracked. No collision.
- **Scenario 2 (Concurrent Progress):**
  - Customer has 9/10 Blow-dries and 9/10 Hair Washes.
  - Result: Two active Circle positions, not one pooled stream of 18 units.
- **Scenario 3 (Exhausted Capacity & Active-Circle Grace):**
  - Blow-dry Circle is at 5/10 (active).
  - Hair Wash Circle is at 0/10 (not started).
  - Business commercial available capacity reaches 0.
  - Blow-dry purchase arrives: **ADMITTED** under active-Circle grace.
  - Hair Wash purchase arrives: **HELD** because it is a new Circle start and capacity is exhausted.
  - Grace is strictly item-specific.
- **Scenario 4 (Commercial Consumption):**
  - Blow-dry reaches 10/10: 1 commercial unit consumed from Blow-dry's earmark.
  - Hair Wash later reaches 10/10: 1 commercial unit consumed from Hair Wash's earmark.

### 6.6 Loyalty vs Commercial Unit Distinction
- **Loyalty Verified Unit:** Verified quantity of one specific qualifying item.
- **Commercial Unit:** One completed 10-unit earning side of one item-specific Loyalty Circle.

---

## 7. Implementation Impact Matrix

| Domain | Seam / Component | Impact | Details |
|---|---|---|---|
| **Loyalty** | `verified_units` table | **REQUIRED** | Add `qualifying_item_id` column (NOT NULL) and index |
| **Loyalty** | `loyalty_cycles` table | **REQUIRED** | Add `qualifying_item_id` column (NOT NULL); composite unique active index `(business_id, customer_identity_id, reward_program_id, qualifying_item_id)` |
| **Loyalty** | `verified_unit_allocations` | **REQUIRED** | Ensure allocation validates unit item matches cycle item |
| **Loyalty** | `rewards` table | **REQUIRED** | Add `qualifying_item_id` column (NOT NULL) |
| **Loyalty** | Forward allocation & overflow | **REQUIRED** | Item-scope pending allocations and queue processing |
| **Loyalty** | Redemption store | **REQUIRED** | Bind redemption to item-bound Reward |
| **Commercial** | `computeStreamRef` | **REQUIRED** | Add `qualifyingItemId` to SHA-256 digest preimage |
| **Commercial** | `sumAdmittedStreamUnits` | **REQUIRED** | Filter by `qualifying_item_id` in SQL |
| **Commercial** | `admitOrHoldPurchase` | **REQUIRED** | Scope stream and block calculation by item |
| **Commercial** | `commercial_admission_blocks` | **NO CHANGE** | Schema unchanged; consumes item-scoped `stream_ref` |
| **Commercial** | Active-Circle grace | **REQUIRED** | Check active status per item stream |
| **Commercial** | Consumption projection | **REQUIRED** | Recompute `stream_ref` using cycle's `qualifying_item_id` |
| **Commercial** | Held purchase release | **REQUIRED** | Release FIFO queue per item stream |
| **Experience** | Customer Circles view | **REQUIRED** | Render independent Circle card per qualifying item |
| **Experience** | Staff Counter | **REQUIRED** | Display progress and rewards grouped by item |
| **Experience** | Customer Activity view | **LIKELY** | Display item name in transaction and reward history |
| **Experience** | Owner / Manager reads | **LIKELY** | Group metrics and active circles by qualifying item |
| **Experience** | Preview seed fixtures | **REQUIRED** | Update multi-item scenarios to assert distinct Circles |

---

## 8. Implementation Package Sequence

To ensure the repository remains coherent and clean at every step, implementation should proceed in 11 sequential packages:

- **Package A: Governance & Documentation Alignment (PR #311)**
  - Align PRD04, PRD06, TRD10, TRD11, Decision Register (`DEC-LOY-002`, `DEC-LOY-019`), and Canonical Reference.
- **Package B: Core Schema Identity**
  - Add `qualifying_item_id` to `verified_units`, `loyalty_cycles`, and `rewards` tables with appropriate constraints.
- **Package C: Verified Unit Item Attribution**
  - Propagate `qualifying_item_id` from Purchase Record into `verified_units` credit rows.
- **Package D: Item-Scoped Cycle Stream + Allocation**
  - Implement item-scoped stream locking, allocation, forward-allocation queue, and composite active uniqueness invariant.
- **Package E: Item-Bound Reward Creation**
  - Ensure cycle completion produces Reward with immutable `qualifying_item_id` and version snapshot.
- **Package F: Commercial Admission & Capacity Item Scoping**
  - Update `computeStreamRef` and `sumAdmittedStreamUnits` to include `qualifyingItemId`; enforce item-specific grace and consumption.
- **Package G: Redemption Item Binding**
  - Verify atomic redemption binds to item-specific Reward; attribute confirmer.
- **Package H: Read Model Contracts**
  - Update DTOs and query functions for Customer, Staff Counter, and Owner/Manager interfaces.
- **Package I: Experience Assembly Corrections & Fixtures**
  - Update UI cards, localization (EN/FR), and canonical preview fixtures.
- **Package J: Deterministic Preview Reset, E2E & Regression**
  - Re-seed preview environment; run full test suite (PG, unit, emulator, Playwright).
- **Package K: Independent Technical Review (ITR)**
  - Final independent verification and merge authorization.

---

## 9. Risk Classification

| Priority | Risk | Mitigation |
|---|---|---|
| **P0** | Commercial block collision on concurrent item starts | Option A incorporates `qualifyingItemId` into `stream_ref`, ensuring distinct block sequences per item. |
| **P0** | Cross-item progress or reward contamination | DB-level foreign keys and composite unique constraints prevent cross-item allocations. |
| **P1** | Capacity leak under active-circle grace | Active-circle grace evaluator explicitly scoped to `(businessId, customerId, programId, itemId)`. |
| **P1** | Race conditions during concurrent item verification | Row-level locking on stream key `(business_id, customer_identity_id, reward_program_id, qualifying_item_id)`. |
| **P2** | Increased UI card density for multi-item programs | Experience design groups Circles cleanly by Reward Programme with clear item typography. |

---

## 10. Gate Status

- **B3 UX Corrections:** **PAUSED** (awaiting implementation authorization).
- **ITR:** **PAUSED** (awaiting implementation completion).
- **PR #307 Head:** `42211cfb9bfcc4483a4251c43c46f34f69860ae7` (UNTOUCHED).
- **PR #310 Head:** `190b3a6ece9af04a4210f34569260425b681f5f0` (UNTOUCHED).
- **PR #311:** Docs-only PR addressing review findings.

---

## 11. Final Verdict

**ITEM-SPECIFIC CIRCLE GOVERNANCE & ARCHITECTURE ALIGNED — READY FOR FOUNDER IMPLEMENTATION AUTHORIZATION**
