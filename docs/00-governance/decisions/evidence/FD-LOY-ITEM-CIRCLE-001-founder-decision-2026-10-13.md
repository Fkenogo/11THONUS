# FD-LOY-ITEM-CIRCLE-001 — Item-Specific Loyalty Circles, Product Hierarchy & Commercial Alignment

> **Status:** Founder decision recorded 2026-10-13
> **Decision authority:** Founder
> **Associated Decision Register entry:** `DEC-LOY-019` (CONFIRMED)
> **Scope:** Product truth, loyalty identity, and commercial capacity alignment. Documentation and architecture correction only; this record does not authorize runtime implementation.

---

## 1. Product Hierarchy

The authoritative product hierarchy confirmed by the Founder is:

```
BUSINESS
  → REWARD PROGRAMME (offer family / business grouping)
      → ONE OR MORE QUALIFYING ITEMS (specific products/services)
          → ONE INDEPENDENT CUSTOMER LOYALTY CIRCLE PER QUALIFYING ITEM (10+1 progression)
```

The intended model is **NOT**:
- `Reward Programme = Item = Circle`
- and **NOT** one pooled Circle combining all qualifying items in a Programme.

Instead:
- **Reward Programme:** Business-defined grouping / offer family.
- **Qualifying Item:** The specific product/service being accumulated.
- **Loyalty Circle:** One customer's independent 10+1 progression for **ONE** qualifying item inside that Programme.
- **Verified Unit:** Verified quantity of that Circle's specific qualifying item.

---

## 2. Founder Product Truth (Corrected DEC-LOY-019)

1. A Reward Programme is a business-defined grouping of one or more item-specific loyalty offers.
2. A Reward Programme may contain one or more qualifying items (`DEC-LOY-016` retained).
3. Each qualifying item within a Reward Programme defines one independent Loyalty Circle track for each participating Customer.
4. Each Loyalty Circle contains **EXACTLY ONE** qualifying item.
5. A Customer may therefore have multiple simultaneous Circles under one Reward Programme, one per qualifying item.
6. Verified Units from different qualifying items **MUST NEVER** be pooled into the same Circle.
7. A Verified Unit represents verified quantity of one specific qualifying item.
8. The 10+1 relationship is item-specific: ten verified units of qualifying item A → reward available for qualifying item A's Circle.
9. For MVP, the On Us reward corresponds to the qualifying item whose Circle reached the 10-unit threshold:
   - 10 verified Blow-dries → Blow-dry reward
   - 10 verified Hair Washes → Hair Wash reward
   - Mixed Blow-dry + Hair Wash units or cross-item rewards are strictly prohibited.
10. This supersedes any implementation interpretation where multiple qualifying items inside one Reward Programme contribute to one shared Circle.
11. This **DOES NOT** remove multi-item Reward Programme capability.
12. For MVP, do **NOT** introduce a separate `CircleDefinition` entity unless architecture proves one is necessary.

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

- **REWARD PROGRAMME:** A business-defined grouping/container for one or more item-specific loyalty offers.
- **QUALIFYING ITEM:** The specific Business-defined product/service that can generate Verified Units.
- **VERIFIED UNIT:** One verified quantity of one specific qualifying item.
- **LOYALTY CIRCLE:** A Customer's independent earn-and-redeem progression for one qualifying item within one Reward Programme.
- **REWARD:** The On Us entitlement produced when one item-specific Circle reaches its threshold. For MVP, the reward corresponds to the qualifying item of that Circle.

---

## 4. Entity Architecture & Identity Boundaries

### Circle Definition Entity Assessment
An additional persistent `CircleDefinition` entity is **NOT** required for MVP:
- The combination of `(Reward Programme Version, Qualifying Item)` defines the Circle track.
- Customer-specific Circle identity is therefore conceptually:
  `Business + Customer + Reward Programme + Qualifying Item`.
- A separate entity would only be warranted if requirements demanded Circle-specific configuration independent of the item (e.g. independent threshold, independent expiry, item-specific reward multipliers). The fixed 10+1 MVP remains clean without extra entities.

### Reward Binding
For MVP, every Reward produced must retain immutable item identity:
- Bound to `qualifying_item_id` and the version snapshot at cycle completion.
- Cross-item rewards (e.g. 10 Blow-dries → Hair Wash reward) and generic pooled rewards are forbidden.

### Programme Versioning Consequences
- When items are added, retired, or renamed in a new Programme version, historical Circles and Rewards retain their immutable item identity (`qualifying_item_id` + version snapshot).
- Mutable display names are never used as identity authority.

---

## 5. Commercial Model Alignment (DEC-SUB-014 / WP-COM)

The prior statement that commercial impact was "NONE" is corrected. While `DEC-SUB-014` remains unchanged in substance, commercial capacity and admission must follow the corrected Circle boundary:

1. **Commercial Unit vs Loyalty Verified Unit:**
   - **Loyalty Verified Unit:** Verified quantity of one specific qualifying item.
   - **Commercial Unit:** One completed 10-unit earning side of one item-specific Loyalty Circle.
2. **Commercial Capacity Keying:**
   - The current implementation scopes `computeStreamRef` and `sumAdmittedStreamUnits` by `(businessId, customerIdentityId, rewardProgramId)`.
   - When a Customer starts Blow-dry (0 → 1) and Hair Wash (0 → 1), these are **TWO independent Circle starts** that each require commercial capacity.
   - Under target architecture, `stream_ref` must incorporate `qualifyingItemId` (Option A: SHA-256 digest of business + customer + program + item).
   - This avoids collisions on `(business_id, stream_ref, block_index)` in `commercial_admission_blocks` and correctly reserves capacity for both Circle starts.
3. **Active-Circle Grace:**
   - Active-Circle grace is strictly item-specific: if Blow-dry is active (e.g. 5/10) and capacity is 0, Blow-dry may finish under grace; if Hair Wash has not started (0/10), Hair Wash remains blocked from starting.
4. **Commercial Consumption:**
   - Follows completed item-specific Circles: Blow-dry completes → 1 commercial unit consumed; Hair Wash completes → 1 commercial unit consumed.
   - Commercial price ($2 equivalent), trial units (3–5), negative-credit policy, earned Reward preservation, and manual admin remain unchanged per `DEC-SUB-014`.

---

## 6. Environment & Historical Migration Reconciliation

- **Verdict:** **MIGRATION CLEAR — DISPOSABLE DATA ONLY**.
- Audit of the environment proved:
  - No production PostgreSQL instance exists.
  - No staging PostgreSQL instance exists.
  - No real customer loyalty data exists anywhere on the platform.
  - The local preview database (port 28110, 29 migrations) contains 100% synthetic seed data (`founder-slice-1`):
    - 95/95 purchases have `qualifying_item_id IS NOT NULL` (0 legacy NULLs).
    - 92 verified units (110 quantity) are 100% deterministic Class A.
    - 15/15 cycles are single-item; 6/6 rewards are single-item.
  - Therefore, historical loyalty data migration is **CLEAR**.
  - Commercial historical migration is **CLEAR / DISPOSABLE ENVIRONMENT**.
  - Commercial schema/key adaptation is **REQUIRED FOR IMPLEMENTATION**.

---

## 7. Implementation Boundary

This record represents Product Truth and architecture alignment only.
- It does **NOT** authorize runtime application code changes.
- It does **NOT** authorize database migrations or schema alterations.
- It does **NOT** authorize preview fixture changes.
- PR #307 and PR #310 remain untouched.
- B3 UX corrections and ITR remain PAUSED pending Founder implementation authorization.
