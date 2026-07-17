# 11thONUS

# Product Requirements Document

## Stage 1 - Product Foundation

**Document version:** 1.0  
**Product:** 11thONUS  
**Document status:** Draft for review  
**Initial launch market:** Burundi  
**Planned expansion:** Rwanda, Uganda and Kenya

# 1\. Purpose of This Document

This Product Requirements Document defines what 11thONUS must achieve as a product, how its principal users should interact with it, the business rules that govern the platform and the functional requirements that will guide design, technical architecture, implementation and testing.

Stage 1 establishes the foundation on which the rest of the PRD will be built.

It defines:

- the product vision;
- the problem being solved;
- the target market;
- the user groups;
- the product philosophy;
- the core operating principles;
- the commercial model;
- the primary value propositions;
- the product boundaries;
- the key measures of success;
- the strategic assumptions that must guide future decisions.

This stage does not yet define detailed screens, database collections, APIs or technical workflows. Those will be documented in later PRD and Technical Requirements Document stages.

# 2\. Product Name and Brand

## 2.1 Product Name

The product is called:

# 11thONUS

The name should be visually presented so that users naturally interpret it as:

**11th On Us**

The brand combines the loyalty mechanic with the emotional promise of appreciation.

## 2.2 Brand Meaning

11thONUS communicates that after a customer repeatedly chooses a participating business, the business recognizes that loyalty by covering the next eligible product or service.

The name should not be presented as a discount message.

It should communicate:

- appreciation;
- recognition;
- reciprocity;
- loyalty;
- gratitude;
- belonging;
- customer relationships.

## 2.3 Core Brand Promise

**Every 11th. On Us.**

## 2.4 Supporting Brand Lines

Customer-facing language may include:

- This one's on us.
- Thank you for coming back.
- You showed up ten times. We've got the next one.
- Keep coming back. We're counting.
- Your next On Us moment is getting closer.
- We noticed you keep choosing us.

## 2.5 Brand Positioning

11thONUS is not positioned as a coupon platform, discount platform or points platform.

It is positioned as:

**A customer-verified loyalty and appreciation platform for everyday businesses.**

# 3\. Executive Summary

11thONUS is a cloud-based loyalty platform designed for small and medium-sized businesses that want to increase repeat visits and recognize loyal customers without requiring a sophisticated Point-of-Sale system.

Businesses subscribe to the platform and create eligible loyalty products or services. Customers register once and receive a unique loyalty identity that can be used across participating businesses.

Each business operates its own independent loyalty program within the 11thONUS ecosystem.

A customer may therefore accumulate progress toward:

- an 11th haircut at one salon;
- an 11th coffee at one café;
- an 11th car wash at one car wash;
- an 11th pizza at one restaurant.

Progress remains separate by business and by eligible product.

The defining operating rule of 11thONUS is customer verification.

A business owner, manager or authorized staff member records a qualifying purchase. The purchase remains pending until the customer logs into the platform and verifies it.

Only customer-verified purchases formally contribute toward the customer's progress.

This creates a shared record between the business and customer and reduces the risk of staff-created, owner-created or system-created false loyalty entries.

The platform initially launches with a simple standard mechanic:

Pay for 10 qualifying items or services. The 11th eligible item or service is covered by the business.

The product architecture must, however, allow future reward configurations without rebuilding the system.

# 4\. Product Vision

To become Africa's simplest and most trusted customer loyalty platform for everyday businesses.

# 5\. Product Mission

To help businesses retain customers through simple, transparent and meaningful loyalty programs while giving customers one trusted loyalty identity they can use across participating businesses.

# 6\. Long-Term Product Ambition

11thONUS should grow into a regional customer relationship and loyalty infrastructure for businesses that lack advanced POS systems, CRM systems or loyalty technology.

The long-term platform may support:

- configurable loyalty programs;
- multi-branch businesses;
- customer communications;
- promotional campaigns;
- mobile money integrations;
- POS integrations;
- customer discovery;
- digital memberships;
- gift rewards;
- business analytics;
- fraud intelligence;
- partner APIs;
- cross-business promotions.

The MVP, however, must remain focused on the core loyalty cycle.

# 7\. Problem Statement

## 7.1 Business Problem

Many small and medium-sized businesses depend heavily on repeat customers but lack reliable tools to identify, recognize and retain them.

These businesses often face several problems:

- customers switch easily to competitors;
- businesses do not know which customers are regulars;
- paper loyalty cards are lost or forged;
- staff may stamp or record fake purchases;
- businesses lack customer data;
- existing loyalty systems may require expensive POS platforms;
- many systems are too complex for small businesses;
- business owners cannot easily measure repeat business;
- businesses lack simple ways to thank customers consistently;
- loyalty activity is difficult to reconcile with real sales.

## 7.2 Customer Problem

Customers may participate in several business loyalty schemes, each with separate cards, codes or apps.

Common problems include:

- lost paper cards;
- forgotten cards;
- unclear reward rules;
- points that are difficult to understand;
- inability to track progress;
- disputed purchases;
- businesses failing to recognize prior purchases;
- rewards that expire without transparency;
- multiple apps for different businesses.

## 7.3 Trust Problem

Traditional loyalty systems often rely entirely on the business or staff member to record activity.

This creates several fraud and trust risks:

- staff may add fake purchases for friends;
- staff may manipulate purchase quantities;
- owners may inflate or alter records;
- customers may falsely claim missing purchases;
- purchases may be entered under the wrong customer;
- transactions may be duplicated;
- businesses may dispute reward eligibility;
- customers may abuse shared codes;
- manual systems may lack an audit trail.

11thONUS addresses this through dual participation:

The business records the purchase.  
The customer verifies the purchase.  
The platform updates loyalty progress.

# 8\. Market Context

## 8.1 Initial Market

The initial launch market is Burundi.

The platform must be suitable for:

- cash-based businesses;
- mobile-money-based businesses;
- businesses without POS systems;
- businesses using basic smartphones;
- users with limited digital literacy;
- intermittent internet connectivity;
- multilingual environments;
- owner-managed SMEs;
- businesses with informal staff structures.

## 8.2 Expansion Markets

Planned expansion markets are:

- Rwanda;
- Uganda;
- Kenya.

The product must therefore support future configuration for:

- different currencies;
- country-specific phone number formats;
- different mobile-money providers;
- different subscription pricing;
- multiple languages;
- different business categories;
- different tax and invoice requirements;
- country-specific payment providers.

## 8.3 Target Business Types

11thONUS should remain open to any business offering a recurring product or service.

Likely early adopters include:

- salons;
- barbers;
- cafés;
- coffee shops;
- bakeries;
- pizza outlets;
- burger restaurants;
- car washes;
- laundries;
- dry cleaners;
- fitness centres;
- beauty spas;
- vehicle service businesses;
- juice bars;
- ice cream shops;
- mobile phone repair shops;
- restaurants;
- pet grooming businesses;
- subscription-like service providers.

The platform must not impose a fixed catalogue of business products.

Each business defines its own eligible items or services.

# 9\. Product Opportunity

11thONUS sits between two existing extremes.

At one extreme are paper punch cards. They are cheap and simple but provide no security, data, analytics or cross-business identity.

At the other extreme are advanced POS-based loyalty platforms. They offer automation but may be expensive, technically complex or tied to a particular payment or POS ecosystem.

11thONUS aims to occupy the middle ground:

- simple enough for a small barber shop;
- secure enough to create trustworthy records;
- flexible enough for different business types;
- independent of a specific POS system;
- mobile-first;
- affordable;
- capable of expanding into a broader business platform.

# 10\. Product Philosophy

## 10.1 Appreciation, Not Discounting

11thONUS should never feel like a constant discount campaign.

The product should frame the 11th item as recognition for repeated loyalty.

Customer-facing language should emphasize:

- gratitude;
- belonging;
- being noticed;
- relationship;
- consistency.

## 10.2 Clarity, Not Points

The product should avoid abstract or confusing points systems in the MVP.

Customers should clearly understand:

- what they bought;
- how many qualifying purchases have been verified;
- how many remain;
- when the next On Us item becomes available;
- what item or category they may redeem.

## 10.3 Trust, Not Blind Acceptance

No purchase should count simply because a business user entered it.

Every qualifying purchase must be customer-verified before contributing to progress.

## 10.4 Flexibility, Not Business Dictation

The platform provides the loyalty engine, but businesses define:

- eligible products;
- prices;
- product descriptions;
- staff access;
- quantity rules;
- whether friends or family may contribute;
- fraud thresholds;
- product availability;
- reward terms.

## 10.5 Simplicity, Not Feature Overload

The MVP must focus on:

- registration;
- business setup;
- staff management;
- purchase recording;
- customer verification;
- progress tracking;
- reward eligibility;
- redemption;
- basic reporting;
- auditability;
- subscription management.

Features outside this cycle should be deferred unless they are essential to trust, loyalty or fraud control.

# 11\. The ONUS Principles

## OP-001 - Loyalty Is Recognition

The platform exists to recognize customers who repeatedly choose a business.

The reward should feel like appreciation, not a price promotion.

## OP-002 - Every Reward Must Be Earned

Rewards arise from verified qualifying purchases.

The customer must be able to understand exactly how the reward was earned.

## OP-003 - Trust Comes Before Loyalty

A loyalty balance is only useful if both the business and customer trust it.

The system must preserve evidence, history and accountability.

## OP-004 - Every Purchase Requires Shared Verification

The business records a purchase.

The customer reviews and verifies it.

Only verified purchases count.

## OP-005 - The Customer Owns Their Platform Identity

A customer has one 11thONUS identity across participating businesses.

The customer's participation with one business must not affect or erase their participation with another.

## OP-006 - Businesses Own Their Loyalty Offer

Businesses decide which products or services participate in 11thONUS.

The platform should not prescribe a fixed business product catalogue.

## OP-007 - Nothing Commercial Is Silently Deleted

Purchases, approvals, rejections, reversals and redemptions must remain traceable.

Corrections must occur through recorded state changes.

## OP-008 - Simplicity Wins

The most common workflows must take as few steps as reasonably possible.

## OP-009 - Mobile Is the Primary Experience

The customer, staff and owner experience must work fully on a smartphone.

## OP-010 - Africa Is the Starting Point

The platform must reflect real operating conditions in African markets.

## OP-011 - Fraud Controls Must Not Prevent Legitimate Commerce

The system must not assume that multiple items in one order are fraudulent.

It must support legitimate cases such as:

- a parent paying for several children;
- a customer buying several coffees for friends;
- a company purchasing several meals;
- a customer buying multiple eligible items in one order;
- fleet or group services.

Suspicious activity should be flagged or reviewed rather than blindly blocked.

## OP-012 - The Ledger Is the Source of Truth

Loyalty progress must be supported by verified purchase and redemption records.

A displayed progress total is a calculated representation of the underlying ledger.

## OP-013 - Fraud Protection Applies to Everyone

Customer verification is required regardless of whether a purchase was recorded by:

- staff;
- a manager;
- a business owner;
- an integrated POS system;
- a future API.

No recorder is automatically trusted to update customer progress without customer verification.

# 12\. Core Product Differentiator

The defining product differentiator is:

# Customer-Verified Loyalty

Traditional loyalty platforms commonly treat the merchant record as final.

11thONUS requires customer participation before the record contributes to loyalty progress.

The core lifecycle is:

- The business records a purchase.
- The purchase is saved as pending customer verification.
- The customer is informed that a new purchase is awaiting review.
- The customer approves, rejects or disputes the purchase.
- An approved purchase becomes verified.
- Verified units contribute to progress.
- Rejected purchases do not contribute.
- Disputed purchases enter a resolution workflow.
- All state changes remain auditable.

This trust model must be preserved throughout the product architecture.

# 13\. Core Loyalty Model

## 13.1 MVP Rule

The initial standard rule is:

Ten verified paid qualifying units unlock one eligible On Us unit.

The first ten units are paid.

The next eligible unit is provided by the participating business at no charge, subject to the product's terms.

## 13.2 Reward Timing

The On Us item should be treated as the next eligible item after ten verified paid units.

A paid purchase that becomes the tenth verified unit unlocks the reward.

It is not itself the free reward.

## 13.3 Product-Level Progress

Progress is tracked independently by:

- customer;
- business;
- branch;
- loyalty product;
- loyalty cycle.

Purchases from different products must not automatically combine.

## 13.4 Product Equivalence

A business may create a loyalty product that represents:

- one exact item;
- one service;
- one product category;
- one price band;
- one business-defined group of equivalent items.

Examples:

- Regular Coffee;
- Standard Haircut;
- Medium Pizza Category;
- Sedan Car Wash;
- Lunch Meal Category.

The business defines what qualifies and what may be redeemed.

## 13.5 Quantity

One purchase record may contain multiple qualifying units.

For example:

- five burgers;
- three haircuts;
- four coffees;
- two car washes.

Each approved unit may contribute separately toward progress.

# 14\. Customer Verification Model

## 14.1 Cardinal Rule

No recorded purchase contributes to customer progress until the customer verifies it.

## 14.2 Applies to All Recorders

Customer verification remains mandatory even when the purchase was entered by:

- the business owner;
- a manager;
- a staff member;
- an administrator acting on behalf of the business;
- a future POS integration;
- a future mobile-money integration.

## 14.3 Verification Options

The customer must be able to:

- approve one pending purchase;
- approve selected purchases;
- approve all visible pending purchases;
- reject one purchase;
- reject selected purchases;
- dispute a purchase;
- provide a rejection or dispute reason.

## 14.4 Pending Purchases

Pending purchases:

- remain visible to the customer;
- remain visible to the business;
- do not count toward progress;
- cannot unlock a reward;
- cannot be redeemed;
- remain auditable.

## 14.5 Customer Inactivity

The platform must not assume that every customer will immediately open the PWA.

The product should therefore support:

- persistent pending records;
- reminders;
- approval of older records;
- configurable expiry or archival policies;
- business visibility into long-outstanding purchases.

The exact expiry rules will be defined in the Business Rules Catalogue.

## 14.6 Approved Purchases

Once approved:

- the purchase becomes verified;
- qualifying units contribute to progress;
- the original purchase details become locked;
- any correction must occur through reversal and replacement;
- the system recalculates reward status.

## 14.7 Rejected Purchases

A rejected purchase:

- does not contribute to progress;
- remains in the audit history;
- records the customer's reason;
- is visible to the business;
- may be reviewed by an authorized business user.

## 14.8 Disputed Purchases

A disputed purchase may require:

- business review;
- customer clarification;
- correction;
- cancellation;
- escalation to platform support.

# 15\. Target Users

## 15.1 Customer

A person who participates in loyalty programs through one platform identity.

The customer may:

- make purchases personally;
- allow friends or family to quote their loyalty code where the business permits;
- review pending purchases;
- verify valid purchases;
- reject invalid purchases;
- track progress;
- redeem available On Us items.

## 15.2 Business Owner

The commercial owner or authorized account owner of a participating business.

The owner controls:

- business setup;
- products;
- staff;
- permissions;
- subscription;
- reporting;
- fraud rules;
- dispute resolution;
- business account status.

## 15.3 Manager

A delegated operational role.

The manager may be permitted to:

- manage staff;
- review purchase activity;
- handle rejected or disputed purchases;
- process redemptions;
- view reports;
- manage daily operations.

## 15.4 Staff Member

An authorized business user who records purchases and processes permitted redemptions.

Every staff member must have an individual identity.

Shared staff accounts should not be permitted.

## 15.5 Super Administrator

A platform operator responsible for:

- business oversight;
- subscription oversight;
- fraud investigation;
- platform configuration;
- country management;
- currency management;
- support;
- disputes;
- reporting;
- suspension and enforcement.

## 15.6 Future Platform Roles

Future roles may include:

- branch manager;
- accountant;
- marketing manager;
- support agent;
- auditor;
- partner administrator;
- API client;
- POS integration user.

# 16\. Primary User Personas

## 16.1 Persona A - Small Business Owner

**Example:** Salon owner, barber, café owner or car wash owner.

**Needs:**

- retain customers;
- identify regular customers;
- create loyalty products quickly;
- control staff activity;
- reduce fake entries;
- see pending customer verifications;
- understand redemptions;
- reconcile loyalty activity with sales;
- avoid complex software.

**Pain points:**

- limited technical experience;
- little time for administration;
- staff may manipulate records;
- no formal POS system;
- no reliable customer database;
- loyalty cards are easily lost.

## 16.2 Persona B - Frontline Staff Member

**Example:** Cashier, waiter, barber, receptionist or service attendant.

**Needs:**

- find a customer quickly;
- scan a QR code;
- record a product and quantity;
- understand whether the record was submitted;
- process an eligible reward;
- avoid complex menus.

**Pain points:**

- busy service environment;
- limited device access;
- mistakes under pressure;
- unclear permissions;
- unreliable connectivity.

## 16.3 Persona C - Regular Customer

**Example:** A person who regularly buys coffee, gets haircuts or uses a car wash.

**Needs:**

- one loyalty identity;
- easy progress tracking;
- visibility into pending purchases;
- clear reward status;
- confidence that records are accurate;
- no paper card;
- simple redemption.

**Pain points:**

- forgetting physical cards;
- unclear balances;
- lost progress;
- disputes with businesses;
- too many separate loyalty systems.

## 16.4 Persona D - Shared Loyalty Account User

A customer who allows friends, family or colleagues to quote their loyalty code.

**Needs:**

- understand which purchases were recorded under their account;
- verify legitimate third-party purchases;
- reject suspicious use;
- maintain control of their loyalty progress.

## 16.5 Persona E - Platform Administrator

**Needs:**

- onboard and monitor businesses;
- manage subscriptions;
- identify fraud patterns;
- resolve support cases;
- manage countries and currencies;
- enforce platform rules;
- understand platform performance.

# 17\. Value Proposition

## 17.1 Customer Value Proposition

11thONUS gives customers:

- one loyalty identity across participating businesses;
- transparent progress;
- control over what counts;
- protection against incorrect entries;
- a clear and understandable reward;
- a mobile experience without physical cards;
- the ability to benefit from purchases made using their code where permitted.

## 17.2 Business Value Proposition

11thONUS gives businesses:

- a simple loyalty program without a complex POS;
- a structured way to recognize regular customers;
- visibility into repeat customer behavior;
- individual staff accountability;
- customer-verified purchase records;
- basic fraud and dispute controls;
- product-level performance reporting;
- an affordable subscription model;
- future access to promotional tools.

## 17.3 Staff Value Proposition

The platform gives staff:

- a simple transaction workflow;
- clear permissions;
- traceable records;
- reduced manual paperwork;
- less ambiguity at redemption.

## 17.4 Platform Operator Value Proposition

The platform creates:

- recurring B2B subscription revenue;
- a growing network of businesses;
- regional customer identity infrastructure;
- loyalty and commerce data;
- future opportunities for payments, marketing and integrations.

# 18\. Business Model

## 18.1 Paying User

The primary paying customer is the participating business.

Consumers should not pay a subscription to join the basic loyalty ecosystem.

## 18.2 Subscription Basis

Subscription plans should initially be differentiated primarily by:

- number of active loyalty products;
- number of staff accounts;
- number of branches;
- reporting depth;
- promotion features;
- exports;
- API access;
- support level.

## 18.3 Initial Tier Direction

The working tier structure is:

### Entry Tier

Up to 10 active loyalty products.

Designed for launch and small businesses.

### Mid Tier

Between 11 and 20 active loyalty products.

Designed for growing businesses.

### Advanced Tier

More than 20 active loyalty products.

Designed for broader operations and future multi-branch businesses.

Final names, prices and feature limits will be defined in the commercial requirements section.

## 18.4 Possible Future Revenue Streams

Future revenue may include:

- premium subscriptions;
- promotional placements;
- customer messaging packages;
- campaign tools;
- API access;
- POS integration fees;
- data and analytics packages;
- enterprise contracts;
- mobile-money transaction fees;
- white-label licensing.

# 19\. Product Scope

## 19.1 MVP Scope

The MVP must include:

### Customer Capabilities

- registration;
- authentication;
- profile;
- unique customer code;
- QR code;
- pending purchase list;
- purchase verification;
- rejection and dispute;
- progress tracking;
- available rewards;
- redemption history;
- purchase history.

### Business Owner Capabilities

- business registration;
- business profile;
- subscription selection;
- product creation;
- product activation and deactivation;
- staff creation or invitation;
- staff role management;
- purchase recording;
- quantity entry;
- pending verification monitoring;
- dispute review;
- redemption processing;
- basic reports;
- audit visibility.

### Manager Capabilities

- permissions delegated by owner;
- operational reporting;
- staff oversight;
- purchase recording;
- redemption;
- dispute handling where permitted.

### Staff Capabilities

- individual login;
- customer search;
- QR scan;
- product selection;
- quantity entry;
- purchase submission;
- limited transaction history;
- reward redemption where permitted.

### Super Admin Capabilities

- business management;
- customer management;
- subscription oversight;
- country configuration;
- currency configuration;
- platform reporting;
- fraud and dispute review;
- suspension;
- support.

## 19.2 Explicit MVP Exclusions

The MVP should exclude:

- general points programs;
- cashback;
- customer-to-customer transfers;
- cryptocurrency;
- gift cards;
- AI fraud scoring;
- POS integrations;
- marketplace discovery;
- automated WhatsApp bots;
- birthday rewards;
- cross-business reward pooling;
- custom buy-N rules;
- multi-branch management;
- public ratings and reviews;
- advanced CRM;
- referral commissions;
- customer cash rewards.

The architecture may allow future addition of these features.

# 20\. Product Success Measures

## 20.1 Business Adoption Metrics

- businesses registered;
- businesses activated;
- paying businesses;
- trial-to-paid conversion rate;
- business retention rate;
- active products per business;
- active staff per business.

## 20.2 Customer Adoption Metrics

- customers registered;
- monthly active customers;
- customers with at least one verified purchase;
- customers participating with multiple businesses;
- customer return frequency.

## 20.3 Loyalty Activity Metrics

- purchases recorded;
- purchases verified;
- purchases rejected;
- purchases disputed;
- average verification time;
- verified units;
- rewards unlocked;
- rewards redeemed;
- reward redemption rate;
- repeat loyalty cycles completed.

## 20.4 Trust Metrics

- approval rate;
- rejection rate;
- dispute rate;
- reversal rate;
- duplicate-entry rate;
- average age of pending purchases;
- percentage of pending purchases older than defined thresholds;
- business-level rejection patterns;
- staff-level rejection patterns.

## 20.5 Commercial Metrics

- monthly recurring revenue;
- average revenue per business;
- payment success rate;
- subscription churn;
- upgrade rate;
- acquisition cost;
- lifetime value.

## 20.6 Operational Metrics

- time required to record a purchase;
- time required to verify a purchase;
- time required to redeem a reward;
- support cases per 1,000 transactions;
- failed transaction submissions;
- system uptime;
- crash-free user sessions.

# 21\. High-Level Product Risks

## 21.1 Customer Verification Friction

Mandatory verification may cause purchases to remain pending for long periods.

Mitigation may include:

- simple approval flows;
- approve-all;
- reminders;
- direct notification links;
- clear pending counts;
- SMS or WhatsApp notifications later.

## 21.2 Low Customer Digital Engagement

Some customers may not regularly visit the PWA.

The system must remain useful while supporting delayed verification.

## 21.3 Staff Workflow Resistance

Staff may view purchase recording as extra work.

The workflow must therefore be fast and require minimal typing.

## 21.4 Business Reconciliation Challenges

Because 11thONUS does not initially process payments, businesses remain responsible for reconciling loyalty records with actual payments.

The platform should provide reports by:

- date;
- product;
- quantity;
- staff member;
- customer;
- verification status.

## 21.5 Shared Code Abuse

Customers may intentionally share their code more widely than a business expects.

Each business must be able to decide whether shared use is allowed.

## 21.6 Product Value Mismatch

Customers may buy low-value variants and attempt to redeem higher-value variants.

Businesses must define eligible products or price categories clearly.

## 21.7 Fraud by Business Owners

Owner-entered purchases remain subject to customer verification.

This prevents owner authority from bypassing the trust model.

## 21.8 Reward Liability

Businesses may underestimate the cost of rewards.

Business onboarding and reporting should clearly explain:

- the reward rule;
- expected effective cost;
- estimated outstanding rewards;
- unlocked but unredeemed rewards.

## 21.9 Connectivity

Intermittent connectivity may affect purchase recording or verification.

Offline and retry behavior will require clear technical requirements.

# 22\. Strategic Product Assumptions

The initial product is based on the following assumptions:

- businesses value repeat customers;
- customers understand the "buy ten, next one on us" model;
- businesses are willing to record purchases manually;
- customers are willing to verify purchases;
- customers have access to a mobile phone;
- businesses can subscribe through supported payment methods;
- product-level loyalty is easier to understand than points;
- staff accountability will reduce abuse;
- customer verification will increase trust;
- mobile-first delivery is more appropriate than native apps for launch.

These assumptions must be tested during pilot deployment.

# 23\. Product Validation Questions

The pilot must help answer:

- How often do customers verify pending purchases?
- How long does verification take?
- Do customers understand the difference between pending and verified?
- Is approve-all used safely?
- How many purchases are rejected?
- Why are purchases rejected?
- How often do staff enter incorrect quantities?
- Does mandatory verification discourage business use?
- Do businesses reconcile loyalty records with payments?
- Do businesses understand outstanding reward liability?
- Do customers share their loyalty codes?
- Which business categories adopt most quickly?
- How many active loyalty products does a typical business need?
- How often are unlocked rewards redeemed?
- Does the program measurably increase repeat visits?

# 24\. Product Decision Register

The following decisions are approved for the current product direction:

| ID     | Decision                                                                              |
| ------ | ------------------------------------------------------------------------------------- |
| PD-001 | The customer-facing brand is 11thONUS.                                                |
| PD-002 | The initial launch market is Burundi.                                                 |
| PD-003 | Rwanda, Uganda and Kenya are the first planned expansion markets.                     |
| PD-004 | Businesses are the paying subscribers.                                                |
| PD-005 | Consumers do not pay for basic participation.                                         |
| PD-006 | The launch mechanic is ten verified paid units followed by one eligible On Us unit.   |
| PD-007 | Businesses define their own eligible products and services.                           |
| PD-008 | Loyalty progress remains separate by business and product.                            |
| PD-009 | Multiple units may be recorded in one purchase.                                       |
| PD-010 | Friends and family may contribute only where the business allows it.                  |
| PD-011 | Every staff member must have an individual account.                                   |
| PD-012 | Shared staff accounts are not permitted.                                              |
| PD-013 | Every purchase remains pending until verified by the customer.                        |
| PD-014 | Customer verification is required even for owner-entered purchases.                   |
| PD-015 | Pending purchases do not contribute to loyalty progress.                              |
| PD-016 | Approved purchases become locked and auditable.                                       |
| PD-017 | Corrections occur through reversal and replacement, not deletion.                     |
| PD-018 | The loyalty ledger is the source of truth.                                            |
| PD-019 | Subscription tiers are initially differentiated largely by active product limits.     |
| PD-020 | The initial technology direction is the Firebase ecosystem.                           |
| PD-021 | The product will launch as a mobile-first PWA.                                        |
| PD-022 | Fraud controls must flag unusual activity without blocking legitimate bulk purchases. |
| PD-023 | The MVP will support one branch while preserving future multi-branch architecture.    |
| PD-024 | AI fraud detection is not part of the MVP.                                            |

# 25\. Foundation Acceptance Criteria

Stage 1 is considered approved when:

- the product vision is accepted;
- the customer-verification rule is accepted;
- the target users are accepted;
- the initial business model is accepted;
- the MVP boundaries are accepted;
- the ONUS Principles are accepted;
- the approved decisions are confirmed;
- unresolved strategic questions are identified for later stages.

# 26\. Next Stage

Stage 2 will define the functional product requirements.

It will cover:

- User roles and permissions.
- Customer registration and identity.
- Business registration and onboarding.
- Staff creation and access control.
- Loyalty product configuration.
- Purchase recording.
- Customer verification.
- Purchase rejection and dispute.
- Loyalty calculation.
- Reward eligibility.
- Reward redemption.
- Reporting.
- Subscription management.
- Fraud controls.
- Audit trail.
- Super-admin operations.

Each module will include:

- purpose;
- actors;
- user stories;
- functional requirements;
- business rules;
- state transitions;
- validations;
- permissions;
- edge cases;
- acceptance criteria;
- MVP and future scope.