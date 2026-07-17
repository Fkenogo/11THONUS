> **Title:** TRD Chapter 23 — Traceability, Open Decisions and Completion Review  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/23-traceability-and-completion-review.md`  
> **Last controlled update:** 2026-07-16 (Phase 4 — §23.25 assumptions A-001..015 renamed to AS-001..015 per DEC-GOV-006; §23.28 note added; no wording changed)

**11thONUS**

**Technical Requirements Document**

**PART XVI - Traceability and Completion Review**

**Chapter 23: Technical Requirements Traceability, Open Decisions and TRD Completion Review**

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-22

**23.1 Purpose**

This chapter closes the Technical Requirements Document by confirming that:

- approved product requirements have technical coverage;
- every major concept has a clear owning domain;
- MVP and future-platform boundaries remain distinct;
- unresolved decisions are visible;
- assumptions are documented;
- terminology is consistent;
- implementation risks are understood;
- architecture exceptions require formal approval;
- the TRD is ready to guide implementation.

This chapter does not introduce major new product capabilities.

Its purpose is to reconcile, validate and freeze the technical direction before implementation begins.

**23.2 Completion Objectives**

The TRD completion review shall ensure that:

- Every launch-critical PRD requirement has an implementation path.
- No critical capability has multiple authoritative owners.
- No future feature has silently entered the MVP.
- Customer-facing language remains separate from engineering language.
- Firestore, Cloud Functions and frontend responsibilities are clear.
- Security and privacy controls are integrated into the architecture.
- English and French requirements are implementation-ready.
- Country and provider dependencies are identified.
- Technical assumptions are documented and testable.
- Open decisions have owners and deadlines.
- Coding agents can implement work packages without inventing architecture.
- The document suite can be frozen as Version 1.0 after final reconciliation.

**23.3 Governing Document Hierarchy**

> **Register note (Phase 3B, 16 July 2026):** DEC-GOV-001 is CONFIRMED — the Constitution (Part VII) has been formally amended to adopt this hierarchy. No Vision & Product Strategy document will be authored. This chapter's list is now also the Constitution's list; see `docs/00-governance/platform-constitution.md` Part VII, Amendment Record #1.

The approved document hierarchy shall be:

- **11thONUS Platform Constitution**
- **Product Requirements Document**
- **Technical Requirements Document**
- **Commerce Knowledge Standard**
- **Platform Design System**
- **Engineering Standards**
- **Operational Playbooks**
- **API and Integration Guide**
- **Decision Register**
- **Implementation Change Log**

Where two documents conflict:

- the higher-level document governs;
- the conflict shall be recorded;
- the lower-level document shall be corrected;
- implementation shall not proceed based on an unresolved contradiction.

**23.4 Traceability Model**

Requirements shall be traceable through the following chain:

Platform Constitution Principle

↓

Product Requirement

↓

Technical Requirement

↓

Implementation Work Package

↓

Code Change

↓

Automated and Manual Tests

↓

Release Evidence

This traceability allows the platform to answer:

- Why was this built?
- Which requirement does it satisfy?
- Which code implements it?
- Which tests prove it?
- Which release introduced it?

**23.5 Requirement Traceability Record**

A formal traceability record should include:

type RequirementTraceabilityRecord = {

id: string;

constitutionalPrincipleIds: string\[\];

productRequirementIds: string\[\];

technicalRequirementIds: string\[\];

domain: string;

implementationPhase: string;

workPackageIds: string\[\];

testReferences: string\[\];

releaseReference?: string;

status:

| "not_started"

| "planned"

| "in_progress"

| "implemented"

| "verified"

| "deferred";

notes?: string;

};

The traceability register may initially be maintained in Markdown or a structured spreadsheet before later moving into a project-management system.

**23.6 Core Product-to-Technical Traceability**

**Customer Registration and Loyalty Identity**

**Product Intent**

A customer registers once and receives one loyalty identity usable across participating businesses.

**Technical Coverage**

- Identity Domain;
- Firebase Authentication;
- users;
- customerProfiles;
- unique loyalty-number generation;
- opaque QR reference;
- account-linking rules;
- role-context architecture;
- customer data isolation.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 12;
- Chapter 16;
- Chapter 22.

**Business Registration and Staff Accountability**

**Product Intent**

A business creates its account and registers individual staff authorized to record purchases.

**Technical Coverage**

- business identity;
- business memberships;
- owner, manager and staff roles;
- role-based authorization;
- individual authentication;
- audit attribution;
- active business context.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 12;
- Chapter 16;
- Chapter 18;
- Chapter 22.

**Commerce Classification**

**Product Intent**

Businesses select categories, business types, services, products and tags through standardized onboarding controls.

**Technical Coverage**

- Commerce Knowledge Domain;
- Knowledge Studio;
- multilingual knowledge nodes;
- translations;
- canonical classification;
- custom business labels;
- searchable cascading controls;
- suggestion workflow.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 14;
- Chapter 18;
- Chapter 22.

**Reward Program Creation**

**Product Intent**

Businesses create Reward Programs for recurring products and services.

**Technical Coverage**

- versioned Reward Programs;
- standard product and service references;
- business display names;
- fixed MVP threshold;
- shared loyalty-number policy;
- activation and retirement;
- subscription entitlement checks.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 11;
- Chapter 17;
- Chapter 22.

**Purchase Recording**

**Product Intent**

Authorized staff records a qualifying purchase against the registered customer's loyalty number.

**Technical Coverage**

- Purchase Domain;
- server-controlled command;
- customer lookup;
- business and membership authorization;
- Reward Program version validation;
- idempotency;
- offline queue;
- waiting-for-customer status;
- Trust Event.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 11;
- Chapter 12;
- Chapter 16;
- Chapter 22.

**Customer Verification**

**Product Intent**

Every Purchase Record remains pending until the registered customer verifies it.

**Technical Coverage**

- customer ownership validation;
- controlled Purchase Record state transition;
- verify, reject and dispute commands;
- batch verification constraints;
- dispute and correction records;
- no Verified Units before verification;
- audit and Trust Events.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 11;
- Chapter 12;
- Chapter 16;
- Chapter 22.

**Verified Progress**

**Product Intent**

Only customer-verified purchases count toward the next On Us Moment.

**Technical Coverage**

- immutable Verified Unit credits;
- Loyalty Cycle;
- active-cycle uniqueness;
- progress projection;
- reward threshold calculation;
- reversal records;
- reconciliation;
- no client-controlled balance.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 11;
- Chapter 15;
- Chapter 22.

**Reward Availability and Redemption**

**Product Intent**

When the required verified progress is reached, the customer receives an available reward that can be redeemed only once.

**Technical Coverage**

- reward entitlement;
- reward uniqueness by cycle;
- atomic redemption;
- permission validation;
- online confirmation;
- duplicate-redemption protection;
- On Us Moment;
- next-cycle creation;
- permanent history.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 11;
- Chapter 12;
- Chapter 16;
- Chapter 22.

**Shared Loyalty Number Use**

**Product Intent**

Friends or family may quote the registered customer's loyalty number where the business permits it.

**Technical Coverage**

- Reward Program policy;
- Purchase Record linked to registered customer;
- customer verification remains mandatory;
- no account creation for the friend or family member;
- no transfer of authentication authority;
- privacy minimization.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 11;
- Chapter 12;
- Chapter 21;
- Chapter 22.

**High-Quantity Purchases**

**Product Intent**

Legitimate multiple-item purchases must not be blocked automatically.

**Technical Coverage**

- configurable review threshold;
- visibility rather than automatic rejection;
- owner and staff attribution;
- customer verification;
- units crossing Loyalty Cycle boundaries;
- pending Verified Unit allocation;
- operational review.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 11;
- Chapter 18;
- Chapter 22.

**Business Subscriptions**

**Product Intent**

Businesses subscribe according to product and staff limits, with regional payment support.

**Technical Coverage**

- versioned plans;
- entitlements;
- country prices;
- currency;
- payment adapters;
- webhook validation;
- invoices and receipts;
- grace period;
- suspension;
- customer-history protection.

**Primary TRD Chapters**

- Chapter 9;
- Chapter 10;
- Chapter 17;
- Chapter 20;
- Chapter 22.

**Multilingual Experience**

**Product Intent**

English is primary, French is required for launch, and Kirundi, Swahili and Kinyarwanda are architecturally supported.

**Technical Coverage**

- translation-key architecture;
- English and French release gate;
- Commerce Knowledge translations;
- localized messages;
- business-authored content fallback;
- locale-aware formats;
- future-language namespaces.

**Primary TRD Chapters**

- Chapter 13;
- Chapter 14;
- Chapter 16;
- Chapter 19;
- Chapter 22.

**Progressive Customer Profiling**

**Product Intent**

Registration remains simple while optional profile information is collected progressively.

**Technical Coverage**

- minimum customer registration fields;
- optional profile fields;
- profile completion;
- purpose-based prompts;
- consent;
- data classification;
- privacy access;
- no restriction of core loyalty access.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 12;
- Chapter 16;
- Chapter 21;
- Chapter 22.

**Reporting and Operational Integrity**

**Product Intent**

Businesses receive useful reporting and tools for reviewing mistakes, disputes and unusual activity.

**Technical Coverage**

- Metric Catalogue;
- reporting projections;
- business isolation;
- review queue;
- Trust Events;
- staff attribution;
- projection reconciliation;
- operational-health rules.

**Primary TRD Chapters**

- Chapter 10;
- Chapter 11;
- Chapter 15;
- Chapter 18;
- Chapter 22.

**23.7 Domain Ownership Verification**

The final domain ownership model shall be:

| **Domain**         | **Authoritative Ownership**                                                    |
| ------------------ | ------------------------------------------------------------------------------ |
| Identity           | Users, customers, businesses, branches, memberships, consent identity          |
| Commerce Knowledge | Industries, categories, business types, products, services, tags, translations |
| Rules              | Rule definitions, versions, assignments and effective-rule resolution          |
| Reward Programs    | Reward Program identity, versions, commercial configuration and state          |
| Purchase           | Purchase Records, disputes, corrections and Purchase Record timeline           |
| Loyalty            | Verified Units, Loyalty Cycles, progress and reward eligibility                |
| Reward             | Reward entitlement, redemption and On Us Moments                               |
| Trust              | Trust Events, audit records and operational reviews                            |
| Notification       | Notification intent, templates and message state                               |
| Reporting          | Metric definitions, projections, exports and report freshness                  |
| Search             | Search projections, indexing, discovery and search analytics                   |
| Subscription       | Plans, entitlements, subscriptions, invoices and billing obligations           |
| Integration        | Provider adapters, webhooks, external requests and delivery responses          |
| Administration     | Platform governance, support cases, feature flags and administrator access     |
| Intelligence       | Future models, recommendations and analytical intelligence                     |

**23.8 Domain Naming Reconciliation**

During drafting, some responsibilities were grouped differently in different chapters.

The following naming decisions shall now apply consistently.

**Reward Programs Domain**

Reward Program configuration shall be treated as its own domain or bounded subdomain.

It shall not be ambiguously owned by both Loyalty and Commerce Knowledge.

Commerce Knowledge owns the standard classifications.

Reward Programs owns the business-specific program configuration.

**Subscription Domain**

Subscription and billing are a dedicated domain.

They shall not be described as merely part of Administration.

Administration provides operational interfaces.

Subscription owns the records and commercial rules.

**Integration Domain**

The Integration Domain is the exclusive boundary for external providers.

Notification, Subscription and future Wallet services consume Integration interfaces but do not own provider adapters.

**Trust Versus Audit**

Trust Events record significant commercial and governance facts.

Administrative audit records record privileged administrative actions.

Security logs record technical access and abuse events.

These records may be correlated but shall not be treated as interchangeable.

**23.9 Terminology Consistency Review**

The following terminology is frozen for technical and product documentation.

**Product Category**

Use:

**Customer-Verified Loyalty Platform**

Do not interchange it with "cloud-based loyalty platform" in market positioning.

"Cloud-based" may describe technical delivery only.

**Customer Purchase Activity**

Engineering:

Purchase Record

Customer and business UI:

Purchase

**Loyalty Progress**

Engineering:

Verified Units

Customer UI:

Progress

Business UI:

Verified Progress, where explanation is needed

**Reward Experience**

Engineering:

Reward Entitlement and Redemption

Customer UI:

Your Next One's On Us  
Use My On Us Moment  
Your On Us Moments

**Historical Records**

Engineering:

Trust Events, Audit Records and domain history

Customer UI:

History or Activity

**Technical Components**

Terms such as:

- engine;
- ledger;
- lifecycle;
- token;
- event;
- state machine;

shall remain internal unless shown in technical administration diagnostics.

**23.10 Reward Threshold Reconciliation**

The concept began as "the 11th is on us."

The technical representation shall remain:

- ten verified qualifying units complete the earning requirement;
- the next eligible product or service is the On Us reward.

Therefore:

Verified Progress Required: 10

Reward Position in Relationship: 11th

The UI shall not confuse customers by showing an unexplained 10-versus-11 distinction.

Recommended customer progress wording:

7 of 10 toward your next one on us.

When complete:

Your next one is on us.

The Reward Program terms shall clearly define the qualifying and reward items.

**23.11 Quantity and Cycle Policy Reconciliation**

One open architectural policy concerns verified quantities that cross a Loyalty Cycle threshold.

The TRD currently recommends:

- complete the active cycle;
- create one available reward;
- retain remaining verified units as pending;
- do not open another active cycle until the outstanding reward is redeemed;
- apply pending units after redemption.

This policy supports one outstanding reward and one active earning journey at a time.

It shall be treated as the MVP default unless the product owner approves another policy before implementation of the Loyalty Domain.

**23.12 Reward Redemption Actor Reconciliation**

The customer presents their:

- loyalty number; or
- QR code.

The authorized business user performs the technical redemption.

The customer does not independently mark a reward as used.

For the MVP:

- business authorization is required;
- reward status is validated online;
- redemption is atomic;
- the customer receives immediate confirmation.

Future gifting shall not change the original customer's historical earning record.

**23.13 Customer Verification Batch Policy**

The customer may:

- verify one Purchase Record;
- verify selected visible records;
- verify all records in a clearly reviewed visible set.

The platform shall not approve hidden or newly loaded records without explicit customer review.

Rejections and disputes remain individual because they require record-specific reasons.

**23.14 Business Branch Scope**

The data architecture is branch-ready.

The Burundi MVP shall support:

- one operational branch per business;
- one branch record created automatically or during onboarding.

Multi-branch operation, branch switching and consolidated branch reporting are deferred.

The single launch branch shall still be referenced by Purchase Records and redemptions to preserve future compatibility.

**23.15 Public Search Scope**

The Search Domain and Commerce Knowledge architecture support future customer discovery.

However, the strict MVP shall prioritize:

- onboarding taxonomy search;
- Reward Program setup;
- internal customer lookup;
- administrator search.

Public customer search and discovery shall remain deferred unless formally added after pilot review.

Public business pages may exist where required for Reward Program visibility, but they shall not expand into a full marketplace during the MVP.

**23.16 Rules Studio Scope Reconciliation**

Rules Studio is a governed configuration service.

For the MVP it shall not become:

- a scripting language;
- a visual workflow builder;
- a no-code logic engine;
- an unrestricted expression evaluator.

It shall support typed, predefined rules with:

- known value types;
- allowed scopes;
- deterministic precedence;
- validation;
- versioning;
- approval;
- activation.

This protects security and implementation simplicity.

**23.17 Knowledge Studio Scope Reconciliation**

Knowledge Studio governs canonical commercial knowledge.

It shall not initially attempt to:

- catalogue every product in every industry;
- generate categories automatically;
- become a public business directory;
- manage merchant inventory;
- maintain real-time price catalogues.

The launch catalogue shall focus on categories relevant to the pilot and early Burundi growth, while preserving a governed suggestion and expansion process.

**23.18 Rules Versus Feature Flags**

Rules define business behavior.

Feature flags control controlled availability or rollout.

Examples:

**Rule**

Purchase verification reminder is sent after 24 hours.

**Feature Flag**

Enable the redesigned verification screen for pilot businesses.

Feature flags shall not replace:

- plan entitlements;
- security;
- customer verification;
- historical rule versions;
- country compliance.

**23.19 Offline Policy Reconciliation**

The approved MVP offline policy is:

**Permitted**

- cached application shell;
- safe cached QR display;
- cached knowledge options;
- local Purchase Record queue;
- sync retry.

**Not Permitted as Completed Offline Actions**

- customer verification;
- rejection;
- dispute submission;
- reward redemption;
- payment;
- administrator actions.

Unsynchronized Purchase Records remain local and non-authoritative.

**23.20 Firebase Product Assumptions**

The TRD currently assumes:

- Firebase Authentication;
- Cloud Firestore;
- Cloud Functions;
- Cloud Storage;
- Firebase Hosting;
- App Check;
- Cloud Messaging;
- Analytics;
- Performance Monitoring;
- Google Cloud supporting services where required.

Implementation shall verify:

- regional service availability;
- cost;
- phone-authentication support;
- SMS delivery practicality;
- Cloud Functions runtime support;
- backup options;
- required legal and data-residency position.

No implementation shall assume every Firebase feature is equally available or suitable in every target country.

**23.21 Open Product Decisions**

> **Register note (Phase 3, 16 July 2026):** The formal Decision Register now exists at `docs/00-governance/decisions/decision-register.md`. Every OPD, OTD, LCD and assumption below is registered there under a DEC-*/AS-* identifier with current status; the register is the operational record, while this chapter remains the historical source. No item below has been resolved by the register's creation.

The following product decisions remain open and should be resolved before their implementation phase.

**OPD-001 - Final Subscription Plan Names**

Working names include:

- Starter;
- Growth;
- Professional.

Earlier product discussion also considered bronze, silver and gold-style tiers.

The final naming should remain simple and commercially clear.

**Required before:** Subscription UI and pricing publication.

**OPD-002 - Final Staff Limits**

Exact staff limits per plan remain undecided.

**Required before:** Subscription entitlement implementation.

**OPD-003 - Trial Rule**

Options include:

- time only;
- verified-purchase volume only;
- time or volume, whichever occurs first.

**Required before:** Trial implementation.

**OPD-004 - Reward Quantity Default**

The default may normally be one eligible product or service.

The platform must confirm whether any launch program may reward a quantity greater than one.

**Required before:** Reward Program schema freeze.

**OPD-005 - Reward Use During Business Suspension**

The product must define whether already-earned rewards remain redeemable:

- throughout suspension;
- during grace only;
- subject to manual review;
- unavailable until reactivation.

Customer trust strongly favors preservation, but operational handling requires a clear rule.

**Required before:** Subscription suspension implementation.

**OPD-006 - Pending Unit Allocation Policy**

The MVP recommendation is to hold overflow units until redemption.

This requires formal confirmation.

**Required before:** Loyalty Domain implementation.

**OPD-007 - Customer Phone Lookup**

The product must decide whether staff may search directly by full phone number or whether QR and loyalty number remain the normal methods.

**Required before:** Purchase-recording UI completion.

**OPD-008 - Public Business Profiles at MVP**

The product must confirm whether customers can browse a basic public business profile or only access business information through their own activity.

**Required before:** Customer navigation freeze.

**OPD-009 - Optional Customer Gender Values**

The approved values and localized wording require product and privacy confirmation.

**Required before:** Progressive profile implementation.

**OPD-010 - Birthday Visibility and Campaign Use**

The product must confirm that businesses receive campaign eligibility rather than direct birthday disclosure.

**Required before:** Birthday-profile feature activation.

**23.22 Open Technical Decisions**

**OTD-001 - Frontend Framework Tooling**

React and TypeScript are approved.

The team still needs to choose and document:

- build tool;
- router;
- query and server-state library;
- form library;
- component foundation;
- PWA tooling;
- testing libraries.

**Decision owner:** Engineering Lead.  
**Required before:** Phase 0 completion.

**OTD-002 - Repository Structure**

Options include:

- one monorepo for frontend and Functions;
- separate repositories.

The TRD recommends a shared repository or monorepo for strong type and contract reuse unless operational reasons justify separation.

**Required before:** Repository initialization.

**OTD-003 - Firebase Region**

The project must select a compatible region based on:

- target-market latency;
- Firestore and Functions compatibility;
- service availability;
- legal review;
- cost.

**Required before:** Firebase project creation.

**OTD-004 - Phone Authentication Delivery**

The team must validate:

- Firebase phone authentication support;
- Burundi number delivery;
- cost;
- abuse controls;
- fallback authentication;
- test-phone strategy.

**Required before:** Customer authentication implementation.

**OTD-005 - Search Implementation**

The MVP may use Firestore-backed taxonomy search and internal filtering.

A dedicated search provider is deferred unless required.

The interface abstraction must still be created.

**Required before:** Search Domain implementation.

**OTD-006 - Event Delivery Mechanism**

The MVP recommendation is:

- Firestore transaction;
- event outbox;
- background processor;
- future Pub/Sub migration.

The final outbox collection and processing approach require engineering validation.

**Required before:** Phase 1 completion.

**OTD-007 - Idempotency Storage**

The team must choose between:

- dedicated idempotency collection;
- deterministic authoritative document IDs;
- operation-specific combined approach.

The architecture permits a combined approach.

**Required before:** Core command implementation.

**OTD-008 - Notification Providers**

Providers for:

- email;
- SMS;
- push;

must be selected.

Push should use Firebase Cloud Messaging.

SMS and email remain provider decisions.

**Required before:** Notification implementation.

**OTD-009 - Burundi Subscription Payment Provider**

The initial provider must be selected based on:

- API availability;
- callback reliability;
- settlement;
- fees;
- documentation;
- sandbox;
- commercial agreement.

**Required before:** Subscription payment implementation.

**OTD-010 - PDF and Export Generation**

The team must select a safe server-side method for:

- receipts;
- invoices;
- report PDFs.

**Required before:** Billing document implementation.

**OTD-011 - Backup Method**

The team must confirm:

- Firestore backup service;
- schedule;
- retention;
- restore procedure;
- Storage backup approach.

**Required before:** Pilot-readiness gate.

**OTD-012 - Frontend Administration Deployment**

The administration shell may be:

- a separate deployment;
- a separately loaded protected shell.

Separate deployment is preferred for stronger isolation.

**Required before:** Administration implementation.

**23.23 Open Provider Decisions**

The following external-provider choices remain outstanding:

| **Provider Area**       | **Required Capability**                  | **Decision Deadline** |
| ----------------------- | ---------------------------------------- | --------------------- |
| Customer Authentication | Reliable Burundi phone OTP               | Phase 2               |
| Email                   | Transactional delivery and status        | Phase 9               |
| SMS                     | Burundi transactional messaging          | Phase 9               |
| Subscription Payment    | BIF mobile-money collection and callback | Phase 10              |
| Error Monitoring        | Frontend and server error visibility     | Phase 1               |
| Backup                  | Firestore and Storage recovery           | Phase 14              |
| Domain and DNS          | Production PWA and email authentication  | Phase 16              |

Each selection shall produce an integration decision record.

**23.24 Open Legal and Compliance Dependencies**

**LCD-001 - Burundi Privacy Review**

Confirm:

- applicable privacy framework;
- customer rights;
- marketing rules;
- cross-border hosting;
- retention;
- breach obligations.

**LCD-002 - Burundi Consumer and Loyalty Terms**

Confirm:

- Reward Program terms;
- business obligation to honor rewards;
- customer dispute language;
- platform liability;
- subscription terms.

**LCD-003 - Burundi Electronic Billing**

Confirm:

- invoice requirements;
- receipt requirements;
- tax display;
- electronic record retention;
- possible e-invoicing obligations.

**LCD-004 - Mobile-Money Agreement**

Confirm:

- merchant integration;
- settlement;
- refunds;
- callback evidence;
- customer support responsibilities.

**LCD-005 - Customer Age Policy**

Confirm:

- minimum independent account age;
- guardian requirements;
- treatment of children's purchases.

**LCD-006 - Cross-Border Firebase Hosting**

Confirm:

- approved regions;
- notice requirements;
- contractual safeguards;
- provider disclosures.

These dependencies are launch blockers where relevant.

**23.25 MVP Assumptions**

> **ID normalization (Phase 4, 16 July 2026 — DEC-GOV-006):** these assumption IDs were renamed from the bare-letter `A-001..015` to `AS-001..015` (the single-letter prefix false-matched in tooling; audit finding, §5 recommendation). No assumption wording changed. The [Assumptions Register](../../00-governance/decisions/assumptions-register.md) already used the `AS-` prefix and is now aligned exactly with this section.

The TRD currently relies on the following assumptions.

**AS-001**

The first pilot will operate primarily in Bujumbura, Burundi.

**AS-002**

The initial businesses will be SMEs with recurring products or services.

**AS-003**

Businesses will use phones, tablets or desktop browsers rather than specialized hardware.

**AS-004**

The platform will not process customer purchase payments in the MVP.

**AS-005**

Business subscription payments will be processed through an external provider.

**AS-006**

Customer verification can occur later rather than at the point of sale.

**AS-007**

The customer is responsible for approving activity recorded against their loyalty number.

**AS-008**

One customer may accumulate qualifying units through purchases made by friends or family where the business permits it.

**AS-009**

The initial Reward Program threshold is ten verified qualifying units.

**AS-010**

The business provides the next eligible item or service as the On Us reward.

**AS-011**

One operational branch per business is sufficient for the first launch.

**AS-012**

English and French are sufficient for the first production release, with future-language readiness.

**AS-013**

A controlled launch taxonomy is sufficient; a complete regional commerce catalogue is not required.

**AS-014**

Public customer discovery is not required to prove the core loyalty model.

**AS-015**

The pilot can operate with one subscription payment provider.

Every assumption shall be validated during pilot planning.

**23.26 Architecture Exceptions**

An architecture exception is required when implementation proposes to:

- place business logic in a frontend component;
- permit direct client writes to authoritative records;
- allow one domain to manipulate another domain's records directly;
- hardcode country, currency, language or provider behavior;
- bypass customer verification;
- use mutable counters as sole loyalty evidence;
- alter historical records without compensating events;
- bypass Rules Studio for governed behavior;
- bypass Knowledge Studio for canonical taxonomy;
- create unrestricted administrator access;
- introduce a country-specific code fork;
- omit tests for a critical workflow.

**23.27 Architecture Exception Record**

Every approved exception shall include:

type ArchitectureException = {

id: string;

title: string;

affectedPrinciples: string\[\];

affectedDomains: string\[\];

reason: string;

alternativesConsidered: string\[\];

risk: string;

compensatingControls: string\[\];

owner: string;

approvedBy: string;

effectiveFrom: string;

expiryOrReviewDate: string;

status: "proposed" | "approved" | "expired" | "rejected";

};

Exceptions shall be rare, time-bound where practical and reviewed.

**23.28 Requirements Numbering Review**

The documents use prefixes including:

- FR-;
- BR-;
- CP-;
- TAP-;
- DAP-;
- domain-specific technical rule IDs.

The final documentation freeze shall ensure:

- no duplicate requirement ID;
- no conflicting requirement text;
- every requirement uses the correct prefix;
- every requirement appears in the traceability register;
- deprecated requirements are marked rather than silently removed.

A requirement-numbering audit shall be completed before Version 1.0 is published.

> **Register note (Phase 4, 16 July 2026):** the requirement-numbering audit referenced above is complete — see the [Requirements ID Audit](../../90-audits/2026-07-16-documentation-audit/11thONUS_REQUIREMENTS_ID_AUDIT_2026-07-16.md) (findings) and the [ID Mapping](../../00-governance/requirement-id-mapping.md) (execution record, DEC-GOV-006). No duplicate requirement ID remains; deprecated old IDs are marked, not removed, in the mapping document.

**23.29 Document Consistency Review**

The final review shall check:

- product category wording;
- capitalization of 11thONUS;
- spelling of Reward Program;
- terminology for customer verification;
- Verified Units;
- Loyalty Cycle;
- On Us Moment;
- domain names;
- role names;
- state names;
- country and language codes;
- plan terminology;
- MVP and deferred scope;
- requirement numbering;
- chapter references.

**23.30 State Model Review**

Every stateful entity shall have one canonical state model.

Entities requiring final state tables include:

- user;
- business;
- membership;
- Reward Program;
- Purchase Record;
- dispute;
- Loyalty Cycle;
- reward;
- redemption;
- notification;
- subscription;
- payment;
- knowledge object;
- rule version;
- support case;
- operational review;
- bulk job.

The Engineering Standards should later publish the approved transition tables.

**23.31 Data Contract Review**

Before implementation, the team shall review:

- document naming;
- required and optional fields;
- server-generated fields;
- immutable fields;
- snapshot fields;
- schema version;
- status enums;
- indexes;
- retention class;
- owner domain;
- client read policy;
- client write policy.

The example TypeScript structures in the TRD are implementation guides.

They shall be converted into final validated contracts during domain implementation.

**23.32 Security Completion Review**

The security review shall confirm:

- deny-by-default Firestore Rules;
- prohibited direct writes;
- App Check;
- administrator MFA;
- session revocation;
- role and membership validation;
- customer ownership;
- loyalty-number privacy;
- QR privacy;
- rate limiting;
- logging;
- secret management;
- service identities;
- Security Rules tests;
- abuse monitoring.

No critical security control shall remain described only as a future intention before pilot launch.

**23.33 Privacy Completion Review**

The privacy review shall confirm:

- data inventory;
- processing register;
- required and optional profile fields;
- consent model;
- Privacy Policy versions;
- rights-request workflow;
- retention schedule;
- subprocessor register;
- cross-border assessment;
- breach response;
- country launch approval;
- support data minimization;
- children's policy;
- location policy.

**23.34 Localization Completion Review**

Before launch, the platform shall confirm:

- all customer-facing strings use translation keys;
- launch-critical English coverage is complete;
- launch-critical French coverage is complete;
- error messages are localized;
- notification templates are localized;
- knowledge labels are localized;
- legal notices are available in approved languages;
- French layouts are tested;
- no engineering terms appear in customer UI;
- fallback behavior is tested.

**23.35 Operational Completion Review**

Operational readiness shall confirm:

- development, staging and production isolation;
- CI/CD;
- deployment permissions;
- release manifest;
- monitoring;
- alerts;
- correlation IDs;
- backup;
- restore test;
- incident runbooks;
- rollback;
- maintenance mode;
- provider health;
- support workflow;
- cost monitoring;
- country launch checklist.

**23.36 Implementation Readiness Checklist**

The TRD is ready for implementation when:

**Governance**

- Constitution approved;
- PRD approved;
- TRD Chapters 1-23 approved;
- terminology frozen;
- Decision Register created.

**Scope**

- MVP scope approved;
- deferred scope approved;
- pilot scope defined;
- no unresolved scope contradiction.

**Architecture**

- domains approved;
- ownership matrix approved;
- event strategy approved;
- client and server boundaries approved;
- offline policy approved.

**Technology**

- frontend stack selected;
- repository strategy selected;
- Firebase region selected;
- authentication feasibility confirmed;
- provider decision process active.

**Data**

- initial schemas reviewed;
- status models defined;
- indexes planned;
- seed strategy approved;
- migration framework planned.

**Security**

- authentication approach approved;
- authorization architecture approved;
- Security Rules strategy approved;
- administrator security approved.

**Operations**

- environment strategy approved;
- CI/CD strategy approved;
- backup plan identified;
- monitoring plan identified.

**Delivery**

- implementation phases approved;
- first coding-agent work package prepared;
- report template prepared;
- persistent change log created.

**23.37 TRD Freeze Conditions**

The TRD may be frozen as Version 1.0 when:

- all chapters are approved;
- terminology is reconciled;
- duplicate requirement IDs are removed;
- domain ownership is unambiguous;
- MVP and deferred scope are consistent;
- open decisions are transferred to the Decision Register;
- assumptions are recorded;
- architecture exceptions process exists;
- traceability register is initialized;
- implementation-readiness checklist passes.

Freezing does not mean the TRD can never change.

It means implementation shall use a stable approved baseline.

**23.38 TRD Change Control**

After freeze, changes shall be classified as:

**Clarification**

Improves wording without changing behavior.

**Minor Change**

Adds implementation detail without changing approved product scope or architecture.

**Major Change**

Changes:

- product behavior;
- domain ownership;
- data model;
- security;
- MVP scope;
- provider architecture;
- customer rights;
- country compliance;
- critical non-functional requirements.

Major changes require formal review and version increment.

**23.39 Versioning**

Recommended document versioning:

- 1.0 - approved implementation baseline;
- 1.1 - compatible clarifications and additions;
- 2.0 - material platform or architectural change.

Every version shall include:

- date;
- author;
- approver;
- change summary;
- affected chapters;
- implementation impact;
- migration impact.

**23.40 Implementation Baseline**

Once approved, TRD Version 1.0 shall become the implementation baseline for:

- architecture;
- domain boundaries;
- Firebase responsibilities;
- data ownership;
- security;
- localization;
- offline behavior;
- billing;
- administration;
- quality;
- operations;
- privacy;
- MVP sequencing.

Coding agents and developers shall not rely on earlier brainstorming text where the final TRD provides a resolved direction.

**23.41 Functional Requirements**

**FR-TRC-001**

Every launch-critical Product Requirement shall map to one or more Technical Requirements.

**FR-TRC-002**

Every Technical Requirement shall identify an owning domain or cross-platform responsibility.

**FR-TRC-003**

The platform shall maintain a requirement traceability register.

**FR-TRC-004**

Domain ownership conflicts shall be resolved before implementation.

**FR-TRC-005**

Terminology shall remain consistent across the Constitution, PRD, TRD and UI standards.

**FR-TRC-006**

Open product, technical, provider and legal decisions shall be recorded with owners and deadlines.

**FR-TRC-007**

MVP assumptions shall be documented and validated through implementation or pilot evidence.

**FR-TRC-008**

Architecture exceptions shall require formal documented approval.

**FR-TRC-009**

Requirement IDs shall be unique and audited before document freeze.

**FR-TRC-010**

Every stateful entity shall have one approved state-transition model.

**FR-TRC-011**

The final data contracts shall identify owner, mutability, access and retention.

**FR-TRC-012**

Security, privacy, localization and operational readiness shall be reviewed before pilot launch.

**FR-TRC-013**

The TRD shall not be frozen until the implementation-readiness checklist passes.

**FR-TRC-014**

Post-freeze TRD changes shall be versioned and classified.

**FR-TRC-015**

The approved TRD Version 1.0 shall become the authoritative implementation baseline.

**23.42 Traceability and Completion Rules**

| **Rule ID** | **Rule**                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| TC-001      | Product intent shall remain traceable through implementation and testing.                                         |
| TC-002      | One authoritative owner shall exist for every core business concept.                                              |
| TC-003      | Earlier brainstorming shall not override the final approved TRD.                                                  |
| TC-004      | Open decisions shall not be hidden inside implementation assumptions.                                             |
| TC-005      | Architecture exceptions shall be explicit, justified and approved.                                                |
| TC-006      | Duplicate requirement identifiers are prohibited.                                                                 |
| TC-007      | MVP and future-platform scope shall remain visibly separate.                                                      |
| TC-008      | Customer-facing language shall remain distinct from internal engineering vocabulary.                              |
| TC-009      | A document freeze establishes a stable baseline, not permanent immutability.                                      |
| TC-010      | Major post-freeze changes require formal version control and impact review.                                       |
| TC-011      | Coding agents shall implement against approved final documents rather than partial conversation history.          |
| TC-012      | Implementation readiness requires governance, architecture, security, operations and delivery readiness together. |

**23.43 Acceptance Criteria**

This chapter is approved when:

- Core PRD requirements are mapped to technical coverage.
- Domain ownership conflicts are resolved.
- terminology is reconciled.
- MVP quantity, verification, redemption, offline and branch policies are consistent.
- Open product, technical, provider and legal decisions are documented.
- MVP assumptions are visible.
- Architecture exceptions have a formal process.
- Requirement numbering and document consistency audits are required.
- Security, privacy, localization and operational completion reviews are defined.
- The implementation-readiness and TRD freeze conditions are accepted.
- TRD Version 1.0 can become the stable baseline for coding-agent implementation.

**23.44 TRD Completion**

With approval of this chapter, the conceptual drafting of the **11thONUS Technical Requirements Document Version 1.0** is complete.

The next work should not begin with feature coding immediately.

The documentation should first undergo a final consolidation pass to:

- combine all approved TRD chapters into one authoritative document;
- reconcile requirement numbering;
- remove duplicated explanatory passages;
- standardize domain names and state names;
- transfer open decisions into a Decision Register;
- create the initial requirements traceability register;
- create the Engineering Standards document;
- prepare the Phase 0 coding-agent implementation prompt.

After those steps, implementation can begin from a stable, governed technical baseline