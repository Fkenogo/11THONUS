> **Title:** TRD Chapter 14 — Search, Discovery and Commerce Knowledge Query  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/14-search-and-discovery.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Technical Requirements Document

## PART VII - Search and Discovery

# Chapter 14: Search, Discovery and Commerce Knowledge Query Architecture

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-13 and the Commerce Knowledge Standard

# 14.1 Purpose

This chapter defines how 11thONUS shall classify, index, search, filter and discover businesses, Reward Programs, standard products, services and commercial attributes.

The search architecture must serve two immediate needs:

- Help businesses complete onboarding quickly using standardized categories, services and tags.
- Prepare the platform for future customer discovery of participating businesses and Reward Programs.

The same Commerce Knowledge Layer shall support:

- business onboarding;
- Reward Program creation;
- reporting;
- search;
- filtering;
- customer interests;
- future personalization;
- future marketplace capabilities;
- future AI recommendations.

Search is not merely a text box.

It is the customer-facing use of the platform's structured commercial knowledge.

# 14.2 Search and Discovery Objectives

The architecture shall ensure that:

- Businesses can classify themselves without creating inconsistent categories.
- Businesses can describe their services using standardized options and controlled custom labels.
- Customers can search using common, informal and multilingual terms.
- Search can identify businesses, Reward Programs, products, services and tags.
- Search results remain isolated to active and published content.
- Location-aware search can be introduced without redesigning the taxonomy.
- Search quality can improve through analytics and editorial governance.
- Firestore limitations do not permanently restrict future discovery.
- Customer interests can later support personalized recommendations.
- Search remains understandable and useful on low-cost mobile devices.

# 14.3 Search Architecture Principles

## SAP-001 - Structured Knowledge Before Free Text

Search shall use standardized taxonomy and tags as its primary foundation.

Free text supplements structured classification.

It does not replace it.

## SAP-002 - One Commerce Knowledge Layer

Onboarding, discovery, reporting and future intelligence shall use the same knowledge references.

## SAP-003 - Multilingual by Design

Search shall support English and French at launch and remain ready for Kirundi, Swahili and Kinyarwanda.

## SAP-004 - Business Branding with Standardized Meaning

A business may use its own display names while retaining canonical classifications underneath.

Example:

Business display name:  
Executive Wash  
<br/>Canonical service:  
Full Car Wash

## SAP-005 - Search Is Explainable

The platform should be able to explain why a result matched:

- category;
- product;
- tag;
- location;
- synonym;
- business name;
- Reward Program.

## SAP-006 - Discovery Must Not Expose Private Data

Search shall use published business and Reward Program information only.

## SAP-007 - Search Quality Is Governed

Search synonyms, category mappings, spelling variants and promoted terms shall be managed through Knowledge Studio.

## SAP-008 - Search Infrastructure May Evolve

The initial MVP may use Firestore-supported search patterns, but the domain architecture shall allow migration to a dedicated search service.

# 14.4 Searchable Entities

The platform shall support search across several entity types.

## 14.4.1 Businesses

Searchable business information may include:

- display name;
- category;
- business type;
- city;
- location;
- business tags;
- published description;
- participating Reward Programs;
- standard services;
- supported languages.

## 14.4.2 Reward Programs

Searchable Reward Program information may include:

- display name;
- Reward Program category;
- qualifying standard product or service;
- business name;
- customer-facing description;
- active tags;
- location.

## 14.4.3 Standard Products and Services

Examples:

- Coffee;
- Cappuccino;
- Pizza;
- Haircut;
- Car Wash;
- Hotel Night;
- Massage;
- Laundry.

These terms may lead customers to matching businesses and Reward Programs.

## 14.4.4 Categories and Business Types

Examples:

- Accommodation;
- Hotels;
- Guesthouses;
- Serviced Apartments;
- Airbnb-style accommodation;
- Restaurants;
- Salons;
- Fitness Centres.

## 14.4.5 Tags

Examples:

- Delivery;
- Family Friendly;
- Parking;
- Mobile Money;
- Wheelchair Accessible;
- Halal;
- Open Late;
- Wi-Fi;
- Outdoor Seating.

# 14.5 Business Onboarding Classification

Business onboarding shall use guided classification rather than unrestricted text entry.

Recommended flow:

Industry  
↓  
Business Category  
↓  
Business Type  
↓  
Business Tags  
↓  
Standard Products and Services  
↓  
Reward Program Categories

Example:

Industry:  
Travel & Accommodation  
<br/>Business Category:  
Accommodation  
<br/>Business Type:  
Serviced Apartment  
<br/>Tags:  
Wi-Fi  
Parking  
Airport Pickup  
Family Friendly  
Mobile Money

This structure prepares the business for future customer discovery without requiring a separate listing exercise.

# 14.6 Reward Program Classification

Every Reward Program shall reference:

- one primary Reward Program category;
- one or more qualifying standard products or services;
- an optional business-defined display name;
- approved descriptive tags.

Example:

Reward Program display name:  
Stay Ten Nights, Your Next Night Is On Us  
<br/>Reward Program category:  
Accommodation Stay  
<br/>Qualifying standard services:  
Single Room Night  
Double Room Night  
<br/>Business display options:  
Standard Room  
Garden Room

The standard classification enables search and analytics while the custom wording preserves business identity.

# 14.7 Cascading Selection Controls

Onboarding and Reward Program forms shall use dependent controls.

Example:

Industry:  
Food & Beverage  
<br/>Business Category:  
Coffee Shop  
<br/>Reward Program Category:  
Coffee  
<br/>Standard Product:  
Cappuccino

A selection at one level shall constrain relevant options at the next level.

The interface shall:

- support searchable dropdowns;
- prioritize commonly used options;
- show localized labels;
- allow clear navigation back to a parent level;
- avoid presenting an overwhelming master list.

# 14.8 Suggested and Recent Options

To reduce onboarding time, forms may show:

- popular options for the selected business category;
- recently used options;
- recommended tags;
- common Reward Programs;
- country-relevant services.

Recommendations remain suggestions.

The business retains control over what applies.

# 14.9 Custom Business Labels

A business may enter a custom display label after selecting a standard reference.

Example:

Canonical product:  
Cappuccino  
<br/>Business display label:  
House Cappuccino

The system shall preserve both values.

The custom label is customer-facing.

The canonical reference powers:

- search;
- reporting;
- analytics;
- translations;
- recommendations.

# 14.10 Missing Category or Service Workflow

A business that cannot find the correct classification shall be able to suggest a new entry.

The suggestion workflow should capture:

- proposed name;
- suggested parent category;
- description;
- country or region;
- business ID;
- language;
- example use;
- optional supporting note.

The suggestion shall enter Knowledge Studio as:

Pending Review

The business may use a temporary custom label where permitted, but the temporary value shall not automatically become a public platform category.

# 14.11 Duplicate Prevention

Knowledge Studio shall prevent taxonomy fragmentation.

Duplicate detection may evaluate:

- normalized names;
- translations;
- synonyms;
- spelling variations;
- parent category;
- semantic similarity;
- singular and plural forms.

Examples that should not create separate canonical entries unnecessarily:

- Coffee Shop;
- Coffeehouse;
- Café;
- Cafe.

They may be separate search terms pointing to one canonical category.

# 14.12 Search Text Normalization

Search indexing shall normalize:

- letter case;
- accents where appropriate;
- punctuation;
- extra spaces;
- common abbreviations;
- singular and plural variants;
- standard local spelling differences.

Original values shall remain preserved for display.

Search normalization shall not alter the canonical knowledge object.

# 14.13 Synonyms and Regional Terms

Every knowledge node may contain search synonyms.

Example:

Canonical:  
Motorcycle Taxi  
<br/>Synonyms:  
Moto  
Boda  
Boda-boda  
Taxi moto

Example:

Canonical:  
Serviced Apartment  
<br/>Synonyms:  
Furnished apartment  
Short-stay apartment  
Apartment hotel  
Airbnb

"Airbnb" may be supported as a search synonym or customer-recognized term, while the canonical classification remains platform-neutral unless the business is formally associated with that brand.

# 14.14 Brand Names in Search

The platform shall distinguish among:

- business names;
- platform categories;
- standard products;
- third-party brand names;
- colloquial search terms.

A third-party brand name may appear as a search synonym only where lawful and operationally useful.

It shall not redefine the platform's canonical category.

# 14.15 Multilingual Search

Search shall operate across published translations and synonyms.

A customer using French should be able to find a business categorized in English.

Example:

Search:  
Hébergement  
<br/>Matches:  
Accommodation  
Hotel  
Guesthouse  
Serviced Apartment

Search indexing should include:

- canonical English term;
- French translation;
- future Kirundi translation;
- future Swahili translation;
- future Kinyarwanda translation;
- approved synonyms in each language.

# 14.16 Mixed-Language Search

Users may mix languages or use borrowed terms.

Examples:

- café Bujumbura;
- car wash près de moi;
- massage Kigali;
- Airbnb avec parking.

The search architecture shall tokenize and match available terms without requiring the query to belong entirely to one language.

# 14.17 Search Query Types

The platform should support several query patterns.

## Business Name Search

Example:

Joe's Coffee

## Category Search

Example:

Salon

## Product or Service Search

Example:

Cappuccino

## Tag Search

Example:

Family friendly

## Location Search

Example:

Hotel in Gitega

## Combined Search

Example:

Car wash with mobile money in Bujumbura

## Reward-Oriented Search

Future example:

Coffee places with 11thONUS

# 14.18 Filters

The future discovery interface should support filters derived from structured knowledge.

Potential filters include:

- industry;
- business category;
- business type;
- Reward Program category;
- product or service;
- city;
- distance;
- tags;
- open now;
- supported payment methods;
- supported languages;
- reward availability;
- business status.

Filters shall use governed values rather than arbitrary free text.

# 14.19 Business Tags

Businesses shall select approved tags during onboarding and profile management.

Recommended tag groups include:

## Access and Facilities

- Parking;
- Wheelchair Accessible;
- Air Conditioning;
- Wi-Fi;
- Outdoor Seating.

## Service Methods

- Delivery;
- Pickup;
- Reservations;
- Home Service;
- Drive Through.

## Audience

- Family Friendly;
- Child Friendly;
- Corporate Friendly;
- Pet Friendly.

## Payments

- Cash;
- Mobile Money;
- Card;
- Bank Transfer.

## Operating Style

- Open Late;
- 24 Hours;
- Appointment Required;
- Walk-ins Welcome.

Only tags relevant to the selected category should be prioritized.

# 14.20 Reward Program Tags

Reward Programs may use approved descriptive tags such as:

- Family;
- Premium;
- Budget;
- Healthy;
- Express;
- Seasonal;
- Popular;
- Group Friendly.

Tags shall not misrepresent the offer.

Businesses may suggest new tags through Knowledge Studio.

# 14.21 Customer Interest Data

Customers may progressively select interests linked to the Commerce Knowledge Layer.

Examples:

- Coffee;
- Dining;
- Fitness;
- Beauty;
- Accommodation;
- Travel;
- Family Activities;
- Car Care.

Customer interests shall support future:

- discovery;
- personalization;
- relevant notifications;
- birthday offers;
- promotions;
- recommendations.

Interest collection shall remain optional and consent-aware.

# 14.22 Behavioral Classification

Future system-generated behavior labels may include:

- Frequent Coffee Customer;
- Weekend Traveller;
- Family Shopper;
- Morning Visitor;
- Fitness Regular.

These classifications shall not be stored as uncontrolled public tags.

They shall be managed as governed analytical attributes with:

- defined derivation;
- versioned rules;
- expiry or refresh policy;
- privacy restrictions;
- customer-consent requirements where applicable.

They shall not be exposed directly to businesses unless permitted by product policy.

# 14.23 Location Data Model

Business discovery shall support location-aware search.

Business location records should include:

- country;
- province or region;
- city;
- neighborhood or district;
- address;
- latitude;
- longitude;
- location verification status;
- service radius where relevant.

Location data shall be stored separately from the customer's current location permission.

# 14.24 Customer Location Privacy

Customer location shall be used only when:

- the customer grants permission;
- a location-dependent feature requires it;
- use is consistent with the Privacy Policy.

The platform should support manual city selection where customers decline precise location access.

Precise customer location shall not be exposed to businesses through search.

# 14.25 Nearby Search

Future nearby search should support:

- radius;
- distance;
- city fallback;
- category;
- tags;
- Reward Program availability.

Firestore alone may not provide efficient geographic and full-text search at scale.

The architecture shall therefore support a dedicated search index.

# 14.26 Initial MVP Search Approach

For MVP onboarding and administration, Firestore may support:

- exact category retrieval;
- prefix-based curated option lookup;
- known synonym resolution;
- filtered business listing by category and city;
- tag filters.

The MVP should not attempt to build a large-scale general-purpose search engine entirely through Firestore queries.

# 14.27 Dedicated Search Service Readiness

The Search Domain shall abstract search operations behind a stable interface.

Potential future implementations may include:

- Algolia;
- Typesense;
- Meilisearch;
- Elastic or OpenSearch;
- another approved managed search provider.

The final provider shall be selected later based on:

- multilingual search quality;
- geospatial support;
- cost;
- indexing latency;
- analytics;
- operational complexity;
- data residency;
- Firebase integration.

Core platform domains shall not depend directly on one search provider.

# 14.28 Search Service Interface

The Search Domain should expose operations such as:

type BusinessSearchRequest = {  
query?: string;  
languageCode: string;  
countryCode: string;  
city?: string;  
coordinates?: {  
latitude: number;  
longitude: number;  
};  
radiusKm?: number;  
categoryIds?: string\[\];  
businessTypeIds?: string\[\];  
rewardProgramCategoryIds?: string\[\];  
productOrServiceIds?: string\[\];  
tagIds?: string\[\];  
pageSize: number;  
cursor?: string;  
};  
<br/>type SearchResult&lt;T&gt; = {  
results: T\[\];  
nextCursor?: string;  
totalEstimate?: number;  
appliedFilters: Record&lt;string, unknown&gt;;  
};

# 14.29 Search Index Documents

A business search index may contain a denormalized published projection.

Example:

type BusinessSearchDocument = {  
businessId: string;  
displayName: string;  
normalizedName: string;  
countryCode: string;  
city: string;  
coordinates?: {  
latitude: number;  
longitude: number;  
};  
industryId: string;  
categoryId: string;  
businessTypeIds: string\[\];  
tagIds: string\[\];  
rewardProgramCategoryIds: string\[\];  
productOrServiceIds: string\[\];  
supportedLanguages: string\[\];  
localizedNames: Record&lt;string, string&gt;;  
searchableTerms: Record&lt;string, string\[\]&gt;;  
status: "published" | "hidden";  
updatedAt: string;  
};

This is a derived search projection.

It is not the authoritative business record.

# 14.30 Search Index Synchronization

Search indexes shall update when relevant source data changes.

Examples:

- business activated;
- business profile updated;
- category changed;
- tag added;
- Reward Program activated;
- translation published;
- business suspended.

Index updates shall be:

- event-driven;
- idempotent;
- retryable;
- observable;
- rebuildable.

# 14.31 Publication Controls

Only eligible content shall appear in customer discovery.

A business may be searchable only when:

- business status permits publication;
- subscription state permits discovery where applicable;
- required profile fields are complete;
- location is valid where needed;
- at least one active Reward Program exists where that is required;
- no platform suspension applies.

Draft, expired, closed or suspended businesses should not appear as active discovery results.

# 14.32 Reward Program Search Visibility

A Reward Program may be discoverable only when:

- the business is active;
- the Reward Program is active;
- customer-facing content is complete;
- canonical classification exists;
- required translation fallback exists;
- no moderation restriction applies.

Paused Reward Programs may remain visible as temporarily unavailable if product policy permits.

# 14.33 Search Ranking Principles

Ranking should consider:

- text relevance;
- exact business-name match;
- category relevance;
- product or service relevance;
- location proximity;
- active Reward Program relevance;
- profile completeness;
- search-language match;
- operational availability.

Ranking shall not initially depend on paid placement without clear disclosure.

# 14.34 Sponsored Results

Future paid promotion may influence discovery.

Sponsored results shall:

- be clearly marked;
- not replace all organic relevance;
- comply with platform advertising policy;
- use active and verified businesses only;
- remain distinct from operational trust indicators.

A business shall not be able to purchase a public trust rating.

# 14.35 Search Suggestions

Search suggestions may include:

- categories;
- standard products and services;
- business names;
- popular tags;
- recent searches;
- location suggestions.

Suggestions shall be language-aware and filtered by country where appropriate.

# 14.36 Empty Search Results

Where no direct result exists, the interface should provide useful alternatives.

Examples:

- nearby categories;
- related services;
- broader location;
- corrected spelling;
- suggest a business or category;
- remove one restrictive filter.

The UI should not display a blank page without guidance.

# 14.37 Search Moderation

Knowledge Studio administrators shall manage:

- inappropriate category suggestions;
- misleading tags;
- duplicate entries;
- prohibited content;
- brand misuse;
- false business classifications;
- unsupported claims.

Moderation actions shall remain auditable.

# 14.38 Search Analytics

The platform should measure:

- search terms;
- language;
- country;
- filters used;
- result count;
- clicked results;
- zero-result searches;
- conversion to business profile;
- conversion to Reward Program view;
- category popularity;
- failed or abandoned searches.

Search analytics shall minimize unnecessary personal data.

# 14.39 Zero-Result Intelligence

Zero-result searches are important knowledge signals.

Knowledge Studio should receive reports showing:

- repeated unknown terms;
- missing categories;
- missing translations;
- regional terminology;
- common misspellings;
- customer demand with no participating businesses.

These insights help improve the Commerce Knowledge Layer.

# 14.40 Search Privacy

Search history shall be handled according to privacy and retention policy.

The platform shall distinguish:

- anonymous aggregate search analytics;
- user-specific recent searches;
- personalization history.

User-specific search behavior shall not automatically become marketing data without appropriate consent.

# 14.41 Search Security

Search endpoints shall enforce:

- rate limits;
- App Check where applicable;
- query-length limits;
- filter allowlists;
- safe pagination;
- public-field projection;
- no unrestricted Firestore queries;
- no private business or customer data.

Search results shall contain only published fields.

# 14.42 Search Performance Targets

Target performance under normal conditions:

- autocomplete suggestions: under 500 ms;
- filtered taxonomy selection: under 500 ms;
- business search: under 1.5 seconds;
- nearby search: under 2 seconds;
- search-index update after source change: generally under 60 seconds.

The interface shall show loading and retry states clearly.

# 14.43 Offline Search

The PWA may cache:

- recently used categories;
- common onboarding options;
- recent business search results;
- selected knowledge labels.

Offline cached results shall be clearly understood as previously loaded information.

Live discovery, current business status and availability require connectivity.

# 14.44 Future Recommendation Architecture

Search provides explicit customer intent.

Recommendations infer likely relevance.

The two shall remain separate services.

Future recommendations may use:

- customer interests;
- prior business interactions;
- location;
- Reward Program categories;
- seasonality;
- birthday information;
- consented behavior.

Recommendations shall not alter search results invisibly without explainable ranking policy.

# 14.45 Future Marketplace Readiness

The same Search Domain should support future:

- business directory;
- Reward Program marketplace;
- Verified Gift Card catalogue;
- promotions;
- memberships;
- wallet-supported offers;
- partner listings.

New commercial modules shall publish compatible search projections rather than building independent discovery systems.

# 14.46 Functional Requirements

## FR-SRCH-001

Business onboarding shall use governed, searchable category and tag selections.

## FR-SRCH-002

Businesses shall retain custom display names while mapping to canonical knowledge entries.

## FR-SRCH-003

Reward Programs shall reference standardized categories and qualifying products or services.

## FR-SRCH-004

Search shall support multilingual names and synonyms.

## FR-SRCH-005

English and French search metadata shall be supported for launch-critical knowledge.

## FR-SRCH-006

The architecture shall support Kirundi, Swahili and Kinyarwanda search metadata.

## FR-SRCH-007

Search results shall include published business and Reward Program data only.

## FR-SRCH-008

The Search Domain shall abstract the underlying search provider.

## FR-SRCH-009

Search indexes shall be derived, rebuildable and event-synchronized.

## FR-SRCH-010

The platform shall support category, tag, product, service and location filters.

## FR-SRCH-011

Knowledge Studio shall manage synonyms, translations and taxonomy suggestions.

## FR-SRCH-012

Business-submitted new categories shall require governed review.

## FR-SRCH-013

Customer interests shall reuse Commerce Knowledge references.

## FR-SRCH-014

Search analytics shall identify zero-result and low-quality queries.

## FR-SRCH-015

Customer search and location data shall comply with consent and privacy rules.

## FR-SRCH-016

Search endpoints shall apply rate limiting and public-data projections.

## FR-SRCH-017

Future Verified Commerce modules shall reuse the Search Domain and Commerce Knowledge Layer.

# 14.47 Search and Discovery Rules

| Rule ID | Rule                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------- |
| SD-001  | Structured classifications shall take precedence over uncontrolled free text.                   |
| SD-002  | One Commerce Knowledge Layer shall support onboarding, search, reporting and recommendations.   |
| SD-003  | Business custom labels shall not replace canonical classifications.                             |
| SD-004  | Search synonyms shall be governed through Knowledge Studio.                                     |
| SD-005  | Only active and publishable businesses and Reward Programs may appear in customer discovery.    |
| SD-006  | Search indexes are derived projections, not authoritative source records.                       |
| SD-007  | Search infrastructure shall remain provider-independent at the domain boundary.                 |
| SD-008  | Customer location use requires permission or a manually selected location.                      |
| SD-009  | Search shall not expose private customer or business operational data.                          |
| SD-010  | Sponsored results shall be clearly disclosed.                                                   |
| SD-011  | Search behavior shall not become personalized marketing data without appropriate consent.       |
| SD-012  | New taxonomy entries require review before platform-wide publication.                           |
| SD-013  | Search indexes shall be rebuildable from authoritative data.                                    |
| SD-014  | Future marketplace modules shall reuse existing search and taxonomy services.                   |
| SD-015  | Third-party brand terms may support search but shall not replace canonical platform categories. |

# 14.48 Acceptance Criteria

This chapter is approved when:

- Business onboarding classification uses standardized searchable controls.
- Reward Programs map to governed categories, products and services.
- Custom business labels coexist with canonical classifications.
- English and French multilingual search requirements are explicit.
- Kirundi, Swahili and Kinyarwanda readiness is preserved.
- Tags, synonyms, regional terms and missing-category workflows are defined.
- Firestore MVP limitations and dedicated search-service readiness are documented.
- Search indexing, synchronization, publication and moderation are specified.
- Location-aware search and privacy requirements are established.
- Search analytics and zero-result learning support Knowledge Studio.
- Future marketplace and recommendation capabilities can reuse the same domain.

# 14.49 Next Chapter

The next chapter should define:

# Reporting, Analytics and Projection Architecture

It will cover:

- authoritative records versus analytics projections;
- business dashboards;
- customer progress projections;
- daily and monthly aggregates;
- staff activity;
- Reward Program performance;
- verification and dispute metrics;
- outstanding reward liability;
- super-admin analytics;
- Firebase Analytics;
- Firestore aggregation;
- scheduled reporting;
- exports;
- data freshness;
- cost controls;
- future warehouse and business intelligence readiness.