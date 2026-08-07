> **Title:** Commerce Knowledge Standard  
> **Version:** 1.0 · **Status:** Platform Standard · **Classification:** Supporting Standard  
> **Governing document:** 11thONUS Platform Constitution  
> **Source-of-truth path:** `docs/03-standards/commerce-knowledge-standard.md`  
> **Last controlled update:** 2026-08-07 (`DEC-PROD-012` Option D — Early Profile Completion list: gender deferred from MVP). Previously: 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# Commerce Knowledge Standard

# 11thONUS Documentation Suite

## Volume 4

**Version 1.0**

**Status:** Platform Standard

**Governed By:** 11thONUS Platform Constitution

---

# PREAMBLE

The Commerce Knowledge Standard establishes the common commercial language used throughout the 11thONUS platform.

It defines how businesses, products, services, Reward Programs and related metadata are classified, described and discovered.

Every module of the platform—including onboarding, search, analytics, reporting, AI recommendations and future Verified Commerce capabilities—shall use this standard.

There shall be one Commerce Knowledge Layer across the platform.

---

# PART I — Purpose

The Commerce Knowledge Layer exists to:

- simplify business onboarding;
- standardise business information;
- improve customer search and discovery;
- improve analytics;
- enable multilingual support;
- enable AI recommendations;
- reduce duplicate or inconsistent data;
- support future commerce services.

---

# PART II — Guiding Principles

## CKS-001

One taxonomy for the entire platform.

---

## CKS-002

Businesses select from predefined knowledge rather than creating inconsistent labels.

---

## CKS-003

Businesses may add custom names while the underlying classification remains standardised.

Example:

Business displays

**Joe's Signature Coffee**

Underlying standard product

**Regular Coffee**

This is important.

The customer sees branding.

The platform understands standard products.

---

## CKS-004

Every taxonomy entry supports multiple languages.

---

## CKS-005

Every taxonomy entry supports search synonyms.

---

## CKS-006

Every taxonomy entry supports future AI metadata.

---

# PART III — Commerce Hierarchy

This hierarchy shall remain fixed.

```
Industry

↓

Business Category

↓

Business Type

↓

Reward Program Category

↓

Standard Product / Service

↓

Business Display Name

↓

Tags

↓

Search Metadata

↓

AI Metadata
```

Businesses never create the first six levels.

They only choose them.

This guarantees consistency.

---

# PART IV — Industry Catalogue

Examples

Food & Beverage

Health & Wellness

Beauty & Personal Care

Accommodation

Retail

Automotive

Professional Services

Education

Entertainment

Travel & Tourism

Financial Services

Home Services

Technology

Sports & Recreation

Agriculture

Government Services

Community & Non-Profit

This list will expand but should remain centrally managed.

---

# PART V — Business Categories

Example

Food & Beverage

↓

Restaurant

Coffee Shop

Bakery

Pizza Restaurant

Burger Restaurant

Fast Food

Ice Cream

Juice Bar

Hotel Restaurant

Café

Each category has:

- multilingual labels;
- search keywords;
- icons;
- future AI attributes.

---

# PART VI — Business Types

Example

Salon

↓

Luxury Salon

Family Salon

Barbershop

Children's Salon

Mobile Salon

Express Salon

Premium Salon

Now analytics become much richer.

---

# PART VII — Reward Program Categories

These describe what customers earn loyalty against.

Examples:

Haircuts

Hair Colour

Braiding

Massage

Coffee

Tea

Pizza

Burger

Car Wash

Oil Change

Laundry

Gym Visit

Hotel Night

Room Booking

Breakfast

Spa Treatment

The list is curated by the platform and grows over time.

---

# PART VIII — Standard Products & Services

Each Reward Program maps to one or more standard products or services.

Example:

Reward Program

Premium Haircut

↓

Standard Product

Haircut

↓

Attributes

Adult

Premium

45–60 min

Category

Beauty & Personal Care

Businesses can still market it as:

"The Executive Cut"

But the platform understands it as a Haircut.

---

# PART IX — Tags

Four classes of tags are defined.

## Business Tags

Examples:

Parking

Wi-Fi

Wheelchair Accessible

Family Friendly

Outdoor Seating

Pet Friendly

Reservations

Delivery

Pickup

Mobile Money

Visa

Mastercard

Corporate Friendly

Air Conditioning

---

## Product & Service Tags

Examples:

Organic

Vegetarian

Halal

Kids

Premium

Budget

Luxury

Express

Healthy

Popular

Seasonal

---

## Customer Interest Tags

Examples:

Coffee

Fitness

Beauty

Travel

Family

Technology

Dining

Adventure

Health

Education

Entertainment

These power personalisation and future recommendations.

---

## Behaviour Tags (System Generated)

Examples:

Morning Customer

Weekend Customer

Coffee Lover

Frequent Visitor

Birthday Month

High Verifier

Family Shopper

Early Adopter

These are never manually assigned.

They are inferred by the platform.

---

# PART X — Search Standards

Every taxonomy entry supports:

Primary Name

Alternative Names

Common Spellings

Abbreviations

Local Language Names

Future AI Keywords

Search should return relevant results even when users search with informal language or local terminology.

---

# PART XI — Multilingual Standards

Every standard entry shall support:

- English (required)
- French (required)
- Kirundi (planned)
- Swahili (planned)
- Kinyarwanda (planned)

Future languages may be added without changing the taxonomy.

---

# PART XII — Customer Profiling Standards

Customer profiling follows the principle of **Progressive KYC**.

### Registration (Required)

- First Name
- Last Name
- Mobile Number
- Country
- Preferred Language

### Early Profile Completion

- ~~Gender~~ **[deferred from MVP — `DEC-PROD-012` Option D, 2026-08-07: gender is not collected at MVP; may be reintroduced additively in a future governed release]**
- Date of Birth
- City
- Communication Preferences

### Loyalty Enrichment

- Favourite Categories
- Interests
- Preferred Businesses
- Notification Preferences

### Future Enrichment

- Family Profile (optional)
- Anniversary (optional)
- Occupation (optional)
- Vehicle Ownership (optional)
- Travel Interests (optional)

Profile completion should be encouraged gradually through value-driven prompts rather than mandatory forms.

---

# PART XIII — Business Onboarding Standards

To minimise setup time while maintaining data quality, businesses should primarily **select** rather than **type** information.

Examples:

- Industry → dropdown
- Business Category → dropdown
- Business Type → dropdown
- Reward Program Category → dropdown
- Standard Product/Service → searchable catalogue
- Tags → multi-select

Free-text fields should be limited to:

- Business name
- Reward Program display name
- Business description
- Internal notes

This balances flexibility with standardisation.

---

# PART XIV — Governance

The Commerce Knowledge Layer is centrally governed.

Businesses cannot create new industries or categories.

They may suggest additions through a controlled review process.

New taxonomy entries should be:

- reviewed;
- translated;
- assigned metadata;
- tested for duplicates;
- versioned.

---

# PART XV — Future Readiness

The Commerce Knowledge Layer is designed to support:

- Verified Loyalty
- Verified Gift Cards
- Verified Wallet
- Verified Promotions
- Verified Memberships
- Verified Referrals
- Marketplace
- Business Discovery
- AI Recommendations
- Advertising
- Benchmarking

No future module should maintain a separate commercial taxonomy.

---