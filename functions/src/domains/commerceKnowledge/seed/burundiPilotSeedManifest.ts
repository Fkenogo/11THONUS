/**
 * Burundi-pilot Commerce Knowledge seed manifest v1 (`ENG-P3-001B`,
 * Founder `DEC-CKS-001`, design §10.1/§26).
 *
 * ============================================================
 * SEED CONTENT AUTHORITY — READ BEFORE EDITING (design §L/§M)
 * ============================================================
 *
 * `DEC-CKS-001` (Founder, APPROVED) bounds the initial seed dataset to
 * "the sectors, Business Categories, Business Types, and minimum Standard
 * Product/Service knowledge required for the Burundi pilot" — but does
 * **not** itself supply that content; it authorizes engineering to seed
 * only what is *actually named* in governing sources (PRD3 §7, the
 * Commerce Knowledge Standard Parts III-VIII), never to infer an
 * exhaustive taxonomy from general knowledge of Burundi commerce.
 *
 * Every entry below cites its exact governing source in `sourceRef`. The
 * hierarchy is **deliberately incomplete** below the levels those sources
 * actually name — this is the ENG-P3-001B task's own Phase L/M
 * instruction ("if governing sources define enough structure to create
 * only part of the hierarchy, create only the supported portion and
 * report the missing seed-content decision"), not an oversight:
 *
 * 1. INDUSTRIES (governed: CKS Part IV names 17 example industries) — only
 *    the subset that are the obvious parent of a PRD3 §7 launch category
 *    is included (design §10.1's own "plus their obvious parent
 *    Industries" wording), not all 17.
 *
 * 2. BUSINESS CATEGORIES (governed: PRD3 §7 names exactly 15 examples) —
 *    14 of the 15 are included. **"Other" is intentionally excluded**: it
 *    has no governed parent Industry anywhere in CKS Part IV or PRD3, and
 *    inventing one would be exactly the "manufacture content" this
 *    package must not do. Reported as a missing seed-content decision,
 *    not silently dropped.
 *
 * 3. BUSINESS TYPES (governed: CKS Part VI names types for exactly ONE
 *    business category — Salon — as its own illustrative "Example", not a
 *    closed list for every category). Only Salon's 7 named business types
 *    are seeded. The other 13 seeded Business Categories (Barber, Coffee
 *    Shop, Restaurant, Pizza, Burger, Bakery, Car Wash, Laundry, Spa, Gym,
 *    Vehicle Service, Juice Bar, Retail) have **no governed Business Type
 *    content anywhere in the repository** — none is invented here. This
 *    is the single largest reported gap (see the ENG-P3-001B
 *    implementation report).
 *
 * 4. REWARD PROGRAM CATEGORIES — CKS Part VII names 16 examples, but as a
 *    **flat, uncategorized list** with no stated parent Business Type for
 *    any of them. Since the governed hierarchy requires
 *    `business_type -> reward_program_category`, and only Salon has any
 *    governed Business Type at all, there is no source that states which
 *    of Salon's 7 business types "Haircuts"/"Hair Colour"/"Braiding"
 *    (the only 3 of the 16 that are even topically Salon-adjacent) would
 *    nest under. **None are seeded.** Reported as a missing seed-content
 *    decision requiring either a Founder/Knowledge-Studio-owned mapping,
 *    or a design amendment allowing `reward_program_category` to parent
 *    directly under `business_category` where no Business Type is
 *    governed yet.
 *
 * 5. STANDARD PRODUCTS/SERVICES — CKS Part VIII gives exactly ONE fully
 *    worked example (Haircut, under Beauty & Personal Care), and PRD3 §15
 *    additionally states directly: **"The platform shall not prescribe
 *    products... businesses define their own"** — a strong signal that
 *    platform-prescribed Standard Product/Service content is not intended
 *    to be exhaustive at all, only a minimal governed anchor. **None are
 *    seeded in v1** — even the one worked CKS example has no governed
 *    parent `reward_program_category` node (see item 4), so it cannot be
 *    placed in the hierarchy without inventing that missing link.
 *
 * **Answer to design/task Phase M's own question**: seed v1 is
 * **classification-only**, and even classification is incomplete below
 * Business Category for all but one category (Salon). This is reported,
 * not hidden, in the ENG-P3-001B implementation report.
 *
 * ============================================================
 * TRANSLATION AUTHORITY (design §R)
 * ============================================================
 * No authoritative French translation exists anywhere in this repository
 * for any of these category/industry names (`apps/web/src/i18n/locales/
 * fr.ts` was checked directly — no matching strings). Per the ENG-P3-001B
 * task's own Phase R instruction ("do not fabricate French translations
 * if authoritative translations don't exist in the repo"), **no `fr` key
 * is populated below**. Every node seeds with an EN translation only,
 * `status: "active"` (referential validity, design §9.4, is governed
 * solely by `KnowledgeNode.status`), consistent with §9.4/§11's own
 * explicit allowance for "active node, French translation absent/draft."
 */

import type { CommerceKnowledgeSeedManifest } from "./seedManifest";

const PRD3_7 = "PRD3 §7 (Business Categories)";
const PRD3_15 = "PRD3 §15 (Product Categories — 'platform shall not prescribe products')";
const CKS_IV = "Commerce Knowledge Standard Part IV (Industry Catalogue)";
const CKS_V = "Commerce Knowledge Standard Part V (Business Categories)";
const CKS_VI = "Commerce Knowledge Standard Part VI (Business Types — Salon example)";

export const BURUNDI_PILOT_SEED_MANIFEST: CommerceKnowledgeSeedManifest = {
  manifestVersion: "burundi-pilot-v1",
  nodes: [
    // --- Industries (subset of CKS Part IV, obvious parents only) ---
    {
      id: "ind_food_beverage",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      translations: { en: "Food & Beverage" },
      sourceRef: CKS_IV,
    },
    {
      id: "ind_beauty_personal_care",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Beauty & Personal Care",
      slug: "beauty-personal-care",
      translations: { en: "Beauty & Personal Care" },
      sourceRef: CKS_IV,
    },
    {
      id: "ind_automotive",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Automotive",
      slug: "automotive",
      translations: { en: "Automotive" },
      sourceRef: CKS_IV,
    },
    {
      id: "ind_home_services",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Home Services",
      slug: "home-services",
      translations: { en: "Home Services" },
      sourceRef: CKS_IV,
    },
    {
      id: "ind_health_wellness",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Health & Wellness",
      slug: "health-wellness",
      translations: { en: "Health & Wellness" },
      sourceRef: CKS_IV,
    },
    {
      id: "ind_retail",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Retail",
      slug: "retail",
      translations: { en: "Retail" },
      sourceRef: CKS_IV,
    },

    // --- Business Categories (14 of PRD3 §7's 15 named examples; "Other" excluded, see header) ---
    {
      id: "cat_salon",
      nodeType: "business_category",
      parentId: "ind_beauty_personal_care",
      canonicalName: "Salon",
      slug: "salon",
      translations: { en: "Salon" },
      sourceRef: PRD3_7,
    },
    {
      id: "cat_barber",
      nodeType: "business_category",
      parentId: "ind_beauty_personal_care",
      canonicalName: "Barber",
      slug: "barber",
      translations: { en: "Barber" },
      sourceRef: PRD3_7,
    },
    {
      id: "cat_spa",
      nodeType: "business_category",
      parentId: "ind_beauty_personal_care",
      canonicalName: "Spa",
      slug: "spa",
      translations: { en: "Spa" },
      sourceRef: PRD3_7,
    },
    {
      id: "cat_coffee_shop",
      nodeType: "business_category",
      parentId: "ind_food_beverage",
      canonicalName: "Coffee Shop",
      slug: "coffee-shop",
      translations: { en: "Coffee Shop" },
      sourceRef: `${PRD3_7}; directly named under Food & Beverage in ${CKS_V}`,
    },
    {
      id: "cat_restaurant",
      nodeType: "business_category",
      parentId: "ind_food_beverage",
      canonicalName: "Restaurant",
      slug: "restaurant",
      translations: { en: "Restaurant" },
      sourceRef: `${PRD3_7}; directly named under Food & Beverage in ${CKS_V}`,
    },
    {
      id: "cat_bakery",
      nodeType: "business_category",
      parentId: "ind_food_beverage",
      canonicalName: "Bakery",
      slug: "bakery",
      translations: { en: "Bakery" },
      sourceRef: `${PRD3_7}; directly named under Food & Beverage in ${CKS_V}`,
    },
    {
      id: "cat_pizza",
      nodeType: "business_category",
      parentId: "ind_food_beverage",
      canonicalName: "Pizza",
      slug: "pizza",
      translations: { en: "Pizza" },
      sourceRef: `${PRD3_7}; matches "Pizza Restaurant" named under Food & Beverage in ${CKS_V}`,
    },
    {
      id: "cat_burger",
      nodeType: "business_category",
      parentId: "ind_food_beverage",
      canonicalName: "Burger",
      slug: "burger",
      translations: { en: "Burger" },
      sourceRef: `${PRD3_7}; matches "Burger Restaurant" named under Food & Beverage in ${CKS_V}`,
    },
    {
      id: "cat_juice_bar",
      nodeType: "business_category",
      parentId: "ind_food_beverage",
      canonicalName: "Juice Bar",
      slug: "juice-bar",
      translations: { en: "Juice Bar" },
      sourceRef: `${PRD3_7}; directly named under Food & Beverage in ${CKS_V}`,
    },
    {
      id: "cat_car_wash",
      nodeType: "business_category",
      parentId: "ind_automotive",
      canonicalName: "Car Wash",
      slug: "car-wash",
      translations: { en: "Car Wash" },
      sourceRef: PRD3_7,
    },
    {
      id: "cat_vehicle_service",
      nodeType: "business_category",
      parentId: "ind_automotive",
      canonicalName: "Vehicle Service",
      slug: "vehicle-service",
      translations: { en: "Vehicle Service" },
      sourceRef: PRD3_7,
    },
    {
      id: "cat_laundry",
      nodeType: "business_category",
      parentId: "ind_home_services",
      canonicalName: "Laundry",
      slug: "laundry",
      translations: { en: "Laundry" },
      sourceRef: PRD3_7,
    },
    {
      id: "cat_gym",
      nodeType: "business_category",
      parentId: "ind_health_wellness",
      canonicalName: "Gym",
      slug: "gym",
      translations: { en: "Gym" },
      sourceRef: PRD3_7,
    },
    {
      id: "cat_retail",
      nodeType: "business_category",
      parentId: "ind_retail",
      canonicalName: "Retail",
      slug: "retail",
      translations: { en: "Retail" },
      sourceRef: PRD3_7,
    },
    // "Other" (PRD3 §7's 15th named example) is deliberately NOT seeded —
    // see header item 2. PRD3 §15 (`the platform shall not prescribe
    // products... businesses define their own`) further underscores why
    // an invented catch-all parent is not appropriate here.

    // --- Business Types (Salon only — the sole governed chain, CKS Part VI) ---
    {
      id: "type_luxury_salon",
      nodeType: "business_type",
      parentId: "cat_salon",
      canonicalName: "Luxury Salon",
      slug: "luxury-salon",
      translations: { en: "Luxury Salon" },
      sourceRef: CKS_VI,
    },
    {
      id: "type_family_salon",
      nodeType: "business_type",
      parentId: "cat_salon",
      canonicalName: "Family Salon",
      slug: "family-salon",
      translations: { en: "Family Salon" },
      sourceRef: CKS_VI,
    },
    {
      id: "type_barbershop",
      nodeType: "business_type",
      parentId: "cat_salon",
      canonicalName: "Barbershop",
      slug: "barbershop",
      translations: { en: "Barbershop" },
      // Note (reported, not resolved): CKS Part VI nests "Barbershop" as a
      // *Business Type under Salon*, while PRD3 §7 separately names
      // "Barber" as its own sibling Business Category. This is an
      // unresolved terminology overlap in the governing sources
      // themselves — this manifest reproduces both faithfully rather than
      // silently picking one, and flags it in the implementation report.
      sourceRef: CKS_VI,
    },
    {
      id: "type_childrens_salon",
      nodeType: "business_type",
      parentId: "cat_salon",
      canonicalName: "Children's Salon",
      slug: "childrens-salon",
      translations: { en: "Children's Salon" },
      sourceRef: CKS_VI,
    },
    {
      id: "type_mobile_salon",
      nodeType: "business_type",
      parentId: "cat_salon",
      canonicalName: "Mobile Salon",
      slug: "mobile-salon",
      translations: { en: "Mobile Salon" },
      sourceRef: CKS_VI,
    },
    {
      id: "type_express_salon",
      nodeType: "business_type",
      parentId: "cat_salon",
      canonicalName: "Express Salon",
      slug: "express-salon",
      translations: { en: "Express Salon" },
      sourceRef: CKS_VI,
    },
    {
      id: "type_premium_salon",
      nodeType: "business_type",
      parentId: "cat_salon",
      canonicalName: "Premium Salon",
      slug: "premium-salon",
      translations: { en: "Premium Salon" },
      sourceRef: CKS_VI,
    },
    // Reward Program Categories and Standard Products/Services are
    // deliberately NOT seeded in v1 — see header items 4/5.
  ],
};

export { PRD3_15 as PRD3_PRODUCT_CATEGORIES_NOT_PRESCRIBED_SOURCE_REF };
