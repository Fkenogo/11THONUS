> ---
> ## ⚠️ DOCUMENT STATUS: SUPERSEDED — HISTORICAL BRAINSTORMING ONLY. DO NOT IMPLEMENT.
>
> **Marked during Phase 1 documentation consolidation, 16 July 2026 (audit findings DOC-P0-002, DOC-P0-003).**
>
> This early data-model sketch describes a **superseded product generation** and must not be used for implementation, despite its original instruction that it was "written for a development team to implement directly." It is retained for historical context only.
>
> It conflicts with the approved platform in every major respect:
>
> - **Terminology:** vendor/shopper/punch/listing are superseded by business/customer/Purchase Record/Reward Program.
> - **Reward threshold:** `redemption_threshold` default 11, configurable per listing, is **incorrect**. The approved MVP rule is a fixed platform threshold of **10 Verified Units** ("Every 11th, on us") — PRD6 §4.4, TRD Consolidation Audit §4.
> - **Verification:** the boolean `shopper_confirmed` flag is superseded by the Purchase Verification Lifecycle (PRD5, TRD Chapters 10–11).
> - **Auto-rejection:** the rate-limit rule that can automatically reject purchases contradicts the approved principle that legitimate activity is reviewed, never auto-blocked (PRD0 OP-011, TRD Consolidation Audit §8.2).
> - **Data architecture:** the relational/SQL schema and DECIMAL money fields are superseded by the Firestore architecture with integer minor-unit money (TRD Chapter 10).
>
> **Authoritative sources:** TRD Chapter 10 (data architecture), PRD4–PRD7 (loyalty model), and `docs/00-governance/canonical-reference.md`.
> ---

# The 11th — Data Model Specification (v1)

Scope: taxonomy structure (category/subcategory/tag) and the core loyalty entities it connects to (vendor, listing, shopper, punch, redemption). Written for a development team to implement directly.

---

## 1. Key design decision: use a self-referencing taxonomy tree, not fixed tables

Rather than three separate hardcoded tables (`categories`, `subcategories`, `subcategories_2`), use **one table with a self-referencing parent**. This is the standard pattern for variable-depth hierarchies and gives you the flexibility you asked for — "one or two subcategories, leave room to expand" — without a schema change later if a 4th level is ever needed.

```
taxonomy_node
------------------------------------------------
id                  UUID (PK)
parent_id           UUID (FK -> taxonomy_node.id, nullable)
name                VARCHAR(100)
slug                VARCHAR(120)   -- URL-safe, unique per parent
level               INT            -- 0 = Category, 1 = Sub-category, 2 = Item type
description         TEXT (nullable)
icon_url            VARCHAR(255) (nullable)
sort_order          INT default 0
status              ENUM('active','inactive','pending_review') default 'active'
owner_type          ENUM('admin','vendor') default 'admin'
created_by_vendor_id UUID (FK -> vendor.id, nullable)  -- set only if owner_type = 'vendor'
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

**How the hierarchy behaves:**
- `level 0` (Category) — e.g. "Cafés & Beverages." Admin-created only. Rare additions.
- `level 1` (Sub-category) — e.g. "Coffee." Admin-created, occasionally vendor-suggested (see moderation below).
- `level 2` (Item type) — e.g. "Cappuccino." Vendor-created freely under an approved level-1 parent; auto-published, but flagged for admin review if it looks like a near-duplicate of an existing node (fuzzy name match).

A node's full path is derived by walking `parent_id` up to root — no need to store it, but for query performance at scale, add a denormalized `path` string (e.g. `cafes/coffee/cappuccino`) maintained on write.

**Moderation rule:** `owner_type = 'vendor'` nodes at level 1 or 2 default to `status = 'pending_review'` if they're brand-new (no similar existing node); if they closely match an existing node they're just linked, not duplicated. This is what lets the taxonomy grow organically without turning into chaos.

---

## 2. Tags

Tags are flat (no hierarchy) and many-to-many against listings — not against taxonomy nodes directly, since tags describe attributes ("vegan," "24hr," "delivery available") that cut across categories.

```
tag
------------------------------------------------
id                  UUID (PK)
name                VARCHAR(50)
slug                VARCHAR(60) unique
status              ENUM('pending','approved') default 'pending'
usage_count         INT default 0   -- incremented on each listing_tag insert
created_by_type     ENUM('admin','vendor','shopper')
created_by_id       UUID (nullable)
created_at          TIMESTAMP
```

```
listing_tag   (junction table)
------------------------------------------------
listing_id          UUID (FK -> vendor_listing.id)
tag_id              UUID (FK -> tag.id)
PRIMARY KEY (listing_id, tag_id)
```

**Promotion rule:** a `pending` tag flips to `approved` automatically once `usage_count` crosses a threshold (e.g. 5 vendors use it), or manually by admin. Approved tags surface in the shopper-facing filter UI; pending tags don't (keeps the filter list clean while still letting vendors tag freely).

---

## 3. Vendor & Vendor Listing

```
vendor
------------------------------------------------
id                  UUID (PK)
vendor_code         VARCHAR(20) unique   -- the code shoppers quote
business_name       VARCHAR(150)
country             VARCHAR(2)   -- ISO code: BI, RW, UG, KE
city                VARCHAR(100)
primary_category_id UUID (FK -> taxonomy_node.id, level 0)
subscription_tier   ENUM('trial','basic','pro')
subscription_status ENUM('active','past_due','suspended')
currency             VARCHAR(3)  -- BIF, RWF, UGX, KES
status               ENUM('pending','active','suspended')
trust_score          DECIMAL(3,2) default 1.00   -- see Section 5
created_at            TIMESTAMP
```

```
vendor_listing
------------------------------------------------
id                  UUID (PK)
vendor_id           UUID (FK -> vendor.id)
taxonomy_node_id    UUID (FK -> taxonomy_node.id, level 2)  -- the specific item type
custom_name         VARCHAR(150) (nullable)  -- vendor's own label, e.g. "Signature Cappuccino"
match_type          ENUM('exact_item','category_average')  -- see note below
price_tier_min       DECIMAL
price_tier_max       DECIMAL
redemption_threshold INT default 11
is_active            BOOLEAN default true
created_at            TIMESTAMP
```

**On `match_type`:** this is the field that resolves the issue flagged earlier — some categories (haircut, cappuccino) have a clean identical-item repeat; others (general restaurant meals) don't. `exact_item` means all 11 punches must be against this specific listing. `category_average` means punches can be logged against any listing under the vendor within the same level-1 sub-category, as long as it falls within `price_tier_min/max` — this is how you handle "any meal in our mid-tier range" without forcing identical dishes.

---

## 4. Shopper, Punch, and Redemption

```
shopper
------------------------------------------------
id                  UUID (PK)
shopper_code        VARCHAR(20) unique
name                VARCHAR(150)
phone               VARCHAR(20)
country             VARCHAR(2)
status              ENUM('active','suspended')
created_at           TIMESTAMP
```

```
punch_record
------------------------------------------------
id                  UUID (PK)
shopper_id          UUID (FK -> shopper.id)
listing_id          UUID (FK -> vendor_listing.id)
vendor_id           UUID (FK -> vendor.id)          -- denormalized for query speed
staff_id            UUID (FK -> vendor_staff.id, nullable)
punch_number        INT           -- 1 through 10 (11th triggers redemption instead)
shopper_confirmed   BOOLEAN default false
shopper_confirmed_at TIMESTAMP (nullable)
status              ENUM('pending_confirmation','confirmed','flagged','disputed','void')
created_at            TIMESTAMP
```

```
redemption
------------------------------------------------
id                  UUID (PK)
shopper_id          UUID (FK -> shopper.id)
listing_id          UUID (FK -> vendor_listing.id)
vendor_id           UUID (FK -> vendor.id)
covering_punch_ids  UUID[]        -- the 10 punch_record ids that led here
redeemed_at         TIMESTAMP
status              ENUM('completed','reversed')
flagged             BOOLEAN default false
```

```
vendor_staff
------------------------------------------------
id                  UUID (PK)
vendor_id           UUID (FK -> vendor.id)
staff_code          VARCHAR(20)
name                VARCHAR(150)
status              ENUM('active','inactive')
```

---

## 5. Fraud & reconciliation layer

```
reconciliation_flag
------------------------------------------------
id                  UUID (PK)
vendor_id           UUID (FK -> vendor.id)
punch_record_id     UUID (FK -> punch_record.id, nullable)
redemption_id       UUID (FK -> redemption.id, nullable)
flag_reason         ENUM('no_matching_payment','rate_limit_exceeded','shopper_disputed','manual_admin_review')
raised_by_type      ENUM('vendor','shopper','system','admin')
status              ENUM('open','resolved_valid','resolved_reversed')
notes               TEXT (nullable)
created_at            TIMESTAMP
resolved_at           TIMESTAMP (nullable)
```

`vendor.trust_score` is a rolling calculated field (not directly editable) — decremented by resolved `resolved_reversed` flags relative to total punch volume, used to surface high-risk vendors to admin without manually auditing every account.

**System-enforced rate limit** (applied at `punch_record` insert time, before it's even saved): reject or flag if a `(shopper_id, vendor_id)` pair already has a punch within the configured minimum interval for that taxonomy node (e.g. `cafes/coffee` = 4 hours, `salons/haircut` = 7 days). Store these intervals on `taxonomy_node` as an optional `min_interval_hours` field — add it to Section 1's table if the dev team wants it configurable per node rather than hardcoded.

---

## 6. Entity relationship summary

```
taxonomy_node (self-referencing, 3 levels)
   └── vendor_listing (level-2 node + vendor)
          ├── listing_tag ── tag
          ├── punch_record ── shopper
          │         └── vendor_staff (who logged it)
          └── redemption ── shopper
                   └── covering_punch_ids[]

vendor ── vendor_staff
vendor ── vendor_listing
punch_record / redemption ── reconciliation_flag
```

---

## 7. Open decisions for the dev team to confirm before build

1. Should `min_interval_hours` live on `taxonomy_node` (category-wide default) or `vendor_listing` (per-vendor override)? Recommend node-level default with optional listing-level override.
2. Redemption threshold is modeled as configurable per listing (`redemption_threshold`, default 11) rather than hardcoded — confirm this is wanted, since it affects whether "11" stays a fixed brand promise or becomes a variable business setting.
3. `match_type = 'category_average'` needs a UI decision: does the shopper see progress as "8/11 meals" without knowing which 8 dishes counted, or do you show the list? Affects the punch_record → shopper-facing view logic.
