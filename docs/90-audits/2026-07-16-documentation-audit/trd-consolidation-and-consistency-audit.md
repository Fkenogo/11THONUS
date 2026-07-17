**11thONUS**

**Technical Requirements Document**

**Consolidation and Consistency Audit**

**Version:** 1.0  
**Status:** Consolidation Working Document  
**Scope:** TRD Chapters 1-23  
**Governed by:** 11thONUS Platform Constitution  
**Purpose:** Prepare the TRD for Version 1.0 freeze

**1\. Purpose of This Audit**

The Technical Requirements Document was developed progressively across 23 chapters.

That approach allowed the architecture to mature as the product definition became clearer. It also means that some earlier chapters contain terminology, domain boundaries or implementation assumptions that were refined in later chapters.

This audit identifies those inconsistencies and establishes the corrections that must be applied during final consolidation.

The consolidation process shall:

- preserve all approved product decisions;
- remove contradictions;
- standardize terminology;
- clarify authoritative domain ownership;
- separate MVP requirements from future capabilities;
- remove unnecessary repetition;
- reconcile state names;
- reconcile requirement IDs;
- make open decisions visible;
- produce one authoritative TRD Version 1.0.

This audit does not authorize implementation.

Implementation begins only after the final TRD, Decision Register, traceability register and Engineering Standards baseline are approved.

**2\. Consolidation Outcome**

The final consolidated TRD shall consist of:

Front Matter

PART I

Platform Architecture

PART II

Physical and Integration Architecture

PART III

Data Architecture

PART IV

Server-Side Processing

PART V

Security and Access Control

PART VI

Communication and Localization

PART VII

Search and Discovery

PART VIII

Reporting and Analytics

PART IX

Frontend and PWA Architecture

PART X

Subscription and Billing

PART XI

Platform Governance and Administration

PART XII

Quality Engineering

PART XIII

Deployment and Operational Resilience

PART XIV

Privacy and Compliance

PART XV

MVP Implementation and Delivery

PART XVI

Traceability and Completion Review

Appendices

The final document shall preserve chapter numbering unless consolidation reveals a compelling reason to renumber.

**3\. Foundational Terminology Corrections**

**3.1 Platform Definition**

The canonical product definition is:

**11thONUS is a Customer-Verified Loyalty Platform.**

The following wording may appear only in appropriate contexts:

- "Firebase-first platform" - technical implementation;
- "cloud-hosted platform" - infrastructure description;
- "Verified Commerce platform" - long-term vision;
- "loyalty application" - general informal reference.

The following shall not replace the canonical product category:

- cloud-based loyalty platform;
- digital punch-card platform;
- discount platform;
- points platform;
- rewards marketplace.

**3.2 Verified Commerce**

The term **Verified Commerce** refers to the long-term platform direction.

It does not describe the MVP product category.

The final TRD shall distinguish:

MVP Product:

Customer-Verified Loyalty Platform

Long-Term Platform Direction:

Verified Commerce

Verified Commerce features shall not appear as MVP deliverables unless explicitly included in Chapter 22.

**3.3 Reward Program**

The canonical spelling is:

**Reward Program**

This spelling shall be used in:

- technical documents;
- product requirements;
- code-facing descriptions;
- business interfaces;
- administration interfaces.

Country-specific customer-facing translations may use locally appropriate wording.

The document shall not alternate among:

- Reward Programme;
- loyalty product;
- loyalty item;
- product program;
- campaign;

unless one of those terms describes a genuinely different concept.

**3.4 Purchase Record**

The canonical engineering term is:

**Purchase Record**

UI language is:

**Purchase**

A Purchase Record is not necessarily evidence of payment.

It is the business-submitted record of qualifying commercial activity awaiting or having received customer action.

The TRD shall avoid describing every Purchase Record as a financial transaction.

**3.5 Customer Verification**

The canonical rule is:

A Purchase Record does not contribute to loyalty progress until the registered customer verifies it.

This applies regardless of whether the Purchase Record was created by:

- business owner;
- manager;
- staff member;
- POS integration;
- API integration;
- offline synchronization.

No actor is exempt from customer verification in the MVP.

**3.6 Verified Units**

The canonical engineering term is:

**Verified Units**

Verified Units are:

- created only from customer-verified Purchase Records;
- traceable to their originating Purchase Record;
- immutable credits or reversals;
- the authoritative evidence supporting loyalty progress.

Verified Units are not:

- customer-facing points;
- a monetary balance;
- transferable wallet value;
- a mutable counter.

**3.7 Loyalty Cycle**

The canonical engineering term is:

**Loyalty Cycle**

A Loyalty Cycle represents one customer's progress toward one On Us reward within one Reward Program.

For the MVP:

- one active or reward-available cycle may exist per customer and Reward Program;
- completed cycles remain historical;
- overflow Verified Units may remain pending until the outstanding reward is redeemed.

**3.8 On Us Moment**

The canonical customer-facing reward experience is:

**On Us Moment**

The engineering model may use:

- reward entitlement;
- available reward;
- redemption;
- reward history.

The customer interface shall use simple language such as:

- Your next one is on us.
- Use My On Us Moment.
- This one was on us.
- Your On Us Moments.

**4\. Reward Threshold Reconciliation**

**4.1 Approved MVP Rule**

The MVP rule is:

Ten verified qualifying units

earn

one next eligible item or service on us.

The relationship sequence is:

Qualifying units 1-10:

Customer pays or otherwise completes qualifying activity.

Position 11:

Business provides the approved On Us reward.

The technical threshold is therefore:

requiredVerifiedUnits = 10

The customer promise remains:

Every 11th, on us.

**4.2 Required Consolidation Correction**

Earlier TRD language sometimes describes requiredVerifiedUnits as broadly configurable.

The final TRD shall distinguish between:

**MVP**

- fixed platform threshold of 10 Verified Units;
- not editable by participating businesses;
- stored in versioned configuration for architectural consistency;
- controlled through a typed platform rule.

**Future**

- alternative threshold configurations may be introduced only through formal product approval;
- existing Reward Program versions remain historically valid;
- no threshold change applies retroactively.

The architecture may support configuration without exposing configurability in the MVP user interface.

**5\. Domain Ownership Corrections**

**5.1 Final Domain List**

The authoritative domain model is:

- Identity
- Commerce Knowledge
- Rules
- Reward Programs
- Purchase
- Loyalty
- Reward
- Trust
- Notification
- Reporting
- Search
- Subscription
- Integration
- Administration
- Intelligence - future

**5.2 Reward Programs Domain**

Earlier chapters sometimes place Reward Programs inside the Loyalty Domain.

The final ownership shall be:

**Reward Programs Domain Owns**

- Reward Program identity;
- Reward Program versions;
- qualifying product or service mappings;
- business display names;
- shared-code policy;
- activation;
- pause;
- retirement;
- commercial terms.

**Loyalty Domain Owns**

- Verified Units;
- Loyalty Cycles;
- progress;
- threshold evaluation;
- pending unit allocation;
- reward eligibility.

**Commerce Knowledge Domain Owns**

- canonical product and service classifications;
- Reward Program categories;
- standard tags;
- translations;
- synonyms.

**5.3 Business Identity Ownership**

Earlier chapter tables refer to businesses as jointly owned by Identity and Administration.

The final position shall be:

**Identity Domain Owns**

- business identity;
- business record;
- business branch identity;
- ownership membership;
- user-to-business relationships.

**Administration Domain Owns**

- business approval workflow;
- support interfaces;
- suspension commands;
- administrative review;
- feature flags;
- administrative oversight.

Administration does not own the authoritative business identity record.

**5.4 Subscription Ownership**

Subscription shall be a dedicated domain.

**Subscription Domain Owns**

- plan identity;
- plan versions;
- plan prices;
- entitlements;
- subscription periods;
- invoices;
- billing obligations;
- subscription status.

**Integration Domain Owns**

- payment-provider adapters;
- provider callbacks;
- payment submission;
- provider references;
- external payment status mapping.

**Administration Domain Owns**

- billing support interface;
- manual-review workflow;
- authorized operational interventions.

**5.5 Trust, Audit and Security Logging**

The final document shall distinguish:

**Trust Event**

Records an important commercial or governance fact.

Examples:

- Purchase Record verified;
- reward created;
- reward redeemed;
- Reward Program activated.

**Administrative Audit Record**

Records a privileged administrative action.

Examples:

- business suspended;
- rule approved;
- taxonomy entry retired;
- manual billing decision.

**Security Log**

Records technical access and security activity.

Examples:

- denied cross-business access;
- repeated authentication failure;
- invalid webhook signature;
- administrator session revocation.

These records may share correlation IDs but remain distinct.

**6\. Data Ownership Corrections**

**6.1 Authoritative Records**

The following records shall be explicitly marked authoritative:

- users;
- customer profiles;
- businesses;
- memberships;
- Reward Programs;
- Reward Program versions;
- Purchase Records;
- Purchase disputes;
- Verified Units;
- Loyalty Cycles;
- rewards;
- redemptions;
- subscriptions;
- invoices;
- payments or payment attempts;
- rule versions;
- knowledge versions;
- Trust Events.

**6.2 Derived Records**

The following shall be marked as derived or rebuildable:

- customer progress projections;
- business dashboard projections;
- search indexes;
- On Us Moment display projections;
- notification delivery summaries;
- operational-health indicators;
- report aggregates;
- subscription-usage projections.

A derived record shall not become the sole evidence of a commercial outcome.

**6.3 Mutable Counters**

Any chapter language implying that a mutable progress counter is authoritative shall be corrected.

For example:

loyaltyCycle.projectedVerifiedUnits

is a performance projection.

The authoritative progress is reconstructed from:

- Verified Units;
- reversals;
- the applicable Loyalty Cycle;
- Reward Program version.

**7\. State Model Normalization**

The final consolidated TRD shall use canonical state names.

**7.1 User**

pending

active

locked

suspended

closed

archived

**7.2 Business**

draft

pending_verification

trial

active

suspended

expired

closed

archived

**7.3 Business Membership**

invited

active

suspended

removed

**7.4 Reward Program**

draft

active

paused

retired

archived

**7.5 Purchase Record**

waiting_for_customer

verified

rejected

under_review

corrected

cancelled

expired

archived

The phrase "pending verification" may appear in UI copy, but the canonical stored state shall be waiting_for_customer.

**7.6 Purchase Dispute**

open

business_review

resolved_verified

resolved_rejected

A future state may be added for customer review of a replacement, but the original dispute remains resolved once a corrected Purchase Record is created.

**7.7 Loyalty Cycle**

active

reward_available

reward_redeemed

closed

The consolidated Engineering Standards shall later determine whether reward_redeemed is a separate durable state or a transition immediately followed by closed.

**7.8 Reward**

available

redeemed

cancelled

expired

Reward expiry is architecturally supported but not automatically enabled in the MVP.

**7.9 Redemption**

completed

reversed

**7.10 Subscription**

draft

trial

active

past_due

grace_period

suspended

cancelled

expired

archived

**7.11 Payment Attempt**

created

submitted

pending_customer_approval

confirmed

failed

timed_out

cancelled

reversed

refunded

requires_review

**7.12 Notification**

queued

processing

partially_delivered

delivered

failed

suppressed

cancelled

**7.13 Knowledge Object**

draft

in_review

approved

published

retired

archived

**7.14 Rule Version**

draft

approved

scheduled

active

superseded

suspended

retired

**8\. Purchase Quantity and Overflow Reconciliation**

**8.1 Approved Quantity Principle**

Multiple quantities are permitted.

The platform shall not assume that:

- one visit equals one unit;
- one transaction equals one product;
- multiple items are automatically fraudulent.

Examples include:

- a parent purchasing haircuts for three children;
- a customer buying several coffees for friends;
- a customer purchasing multiple qualifying meals;
- a customer ordering several eligible items at once.

**8.2 High-Quantity Review**

A high quantity may:

- trigger an operational indicator;
- enter a review queue;
- require business attention;
- require customer verification.

It shall not automatically be rejected solely because of quantity.

Customer verification remains mandatory.

**8.3 Overflow Policy**

The consolidation shall retain the recommended MVP policy:

- Apply Verified Units to the active Loyalty Cycle.
- When the threshold is reached, create one available reward.
- Store remaining units as pending allocation.
- Do not create a second active Loyalty Cycle while the reward remains available.
- After redemption, create the next Loyalty Cycle.
- Apply pending units in chronological order.
- Create another reward if the pending units complete the new cycle.
- Preserve all units and source references.

This remains an open product decision until formally entered and approved in the Decision Register.

**9\. Customer Verification Reconciliation**

**9.1 Universal Verification**

All Purchase Records begin as:

waiting_for_customer

This applies even when recorded by:

- business owner;
- manager;
- staff;
- integration;
- POS;
- API.

The owner's authority does not replace the customer's verification.

**9.2 Batch Verification**

The final TRD shall permit:

- verify one;
- verify selected visible records;
- verify all records in an explicitly reviewed visible set.

The system shall not:

- verify records hidden by pagination;
- verify newly loaded records silently;
- apply blanket verification to an unreviewed backlog.

**9.3 Rejection and Dispute**

Rejection and dispute remain individual actions.

Each requires:

- a specific Purchase Record;
- an appropriate reason;
- optional customer comment;
- a permanent state transition;
- relevant business notification.

**10\. Shared Loyalty Number Reconciliation**

The customer's loyalty number may be quoted by friends or family when the Reward Program allows shared use.

The Purchase Record remains attached to the registered customer.

The registered customer:

- sees the Purchase Record;
- verifies or rejects it;
- receives the resulting Verified Units;
- retains accountability for activity against their code.

Friends or family:

- do not gain access to the account;
- do not become authenticated users automatically;
- do not verify the Purchase Record;
- do not receive the customer's private information.

The shared loyalty number policy belongs to the Reward Program version.

**11\. Subscription Tier Reconciliation**

**11.1 Capacity Terminology**

Earlier product discussion referred to the number of participating products.

The final technical model uses:

**Active Reward Program limit**

This is clearer because:

- one Reward Program may include multiple mapped products in the same qualifying category;
- businesses create loyalty offerings, not platform catalogue products;
- plan enforcement should count operational Reward Programs.

**11.2 Plan Names**

Plan names remain open.

Working labels may be:

- Starter;
- Growth;
- Professional.

Earlier Bronze, Silver and Gold terminology shall not be treated as approved.

The technical architecture shall use plan IDs and entitlements rather than plan-name checks.

**11.3 Core Features Across Plans**

The following shall not be removed from lower plans:

- customer verification;
- individual staff identities;
- secure roles;
- Purchase Record history;
- Verified Unit integrity;
- reward redemption controls;
- customer dispute handling;
- basic auditability;
- privacy and security.

Plans may differ through capacity and enhanced capabilities.

**12\. Offline Scope Reconciliation**

The MVP offline scope is strictly limited.

**Supported Offline**

- application shell;
- safe cached customer QR;
- cached taxonomy values;
- cached Reward Program values;
- local Purchase Record queue;
- synchronization status.

**Requires Online Confirmation**

- customer verification;
- rejection;
- dispute submission;
- reward redemption;
- subscription payment;
- administrator action;
- role modification;
- Reward Program activation.

An offline Purchase Record is not an authoritative Purchase Record until accepted by the server.

**13\. Search Scope Reconciliation**

Earlier search chapters describe a substantial future discovery capability.

The final document shall distinguish:

**MVP Search**

- taxonomy search during onboarding;
- Reward Program category and product selection;
- business lookup for administrators;
- customer lookup using authorized identifiers;
- internal filtering;
- knowledge suggestion workflow.

**Deferred Discovery**

- nearby business search;
- map search;
- general customer marketplace;
- sponsored results;
- public category discovery;
- recommendations;
- ranked search provider.

The Search Domain abstraction remains part of the architecture.

A dedicated search provider is not an MVP dependency unless validated as necessary during implementation.

**14\. Knowledge Studio Scope Reconciliation**

Knowledge Studio is included in the MVP only to the level required to govern launch taxonomy.

**MVP Capabilities**

- draft;
- review;
- approval;
- publication;
- retirement;
- replacement;
- English;
- French;
- synonyms;
- tags;
- business suggestions;
- controlled seed import.

**Deferred Capabilities**

- AI publication;
- automatic taxonomy generation;
- advanced semantic matching;
- large brand catalogue;
- real-time product inventory;
- public Knowledge API;
- extensive regional catalogue.

**15\. Rules Studio Scope Reconciliation**

Rules Studio shall use typed configurations.

**MVP Rule Types**

- fixed loyalty threshold;
- quantity review threshold;
- shared-code default;
- verification reminder timing;
- dispute escalation;
- subscription limits;
- trial;
- grace period;
- notification quiet hours;
- feature availability;
- offline queue limits.

**Deferred**

- visual workflow builder;
- unrestricted expression language;
- custom business scripting;
- AI-activated rules;
- dynamic executable code.

**16\. Localization Reconciliation**

**Required at Burundi Launch**

- English;
- French.

This requirement covers:

- customer journeys;
- business journeys;
- launch administration workflows;
- errors;
- notifications;
- emails;
- SMS;
- Commerce Knowledge labels;
- Terms and Privacy documents;
- support-critical content.

**Architecture-Ready**

- Kirundi;
- Swahili;
- Kinyarwanda.

Architecture-ready means:

- supported language codes;
- translation file structure;
- fallback;
- locale handling;
- test packs;
- no hardcoded English dependency.

It does not mean complete launch translation.

**17\. Privacy and Profiling Reconciliation**

**Required Customer Fields**

- first name;
- last name;
- mobile number or approved authentication identifier;
- country;
- preferred language;
- legal acceptance.

**Optional Profile Fields**

- date of birth;
- gender;
- city;
- interests;
- profile image;
- communication preferences.

Optional fields shall not block core loyalty participation.

Businesses shall not receive unrestricted access to:

- full birthday;
- gender;
- interests;
- activity with other businesses.

Future targeting should normally provide governed audience eligibility rather than raw profile disclosure.

**18\. Administration Reconciliation**

Platform Administration shall not be implemented as unrestricted Firestore editing.

All material administrative actions shall use:

- typed commands;
- permission checks;
- recent authentication where required;
- audit records;
- reason codes;
- controlled state transitions.

Firebase Console access shall be limited to authorized technical operations and shall not be the normal support workflow.

**19\. Firebase Architecture Reconciliation**

**19.1 Firebase as Infrastructure**

Firebase implements the 11thONUS architecture.

Firebase does not define the business architecture.

The final TRD shall retain:

- domain ownership;
- domain services;
- repositories;
- command contracts;
- event contracts;
- server authority.

**19.2 Critical Writes**

Clients shall not directly write:

- Purchase Records;
- customer verification outcomes;
- Verified Units;
- Loyalty Cycles;
- rewards;
- redemptions;
- subscriptions;
- role assignments;
- rule versions;
- taxonomy publication;
- Trust Events.

These operations use trusted server services.

**19.3 Cloud Functions**

The consolidated TRD shall refer generically to trusted Cloud Functions or approved server processes.

The final Engineering Standards shall specify:

- Cloud Functions generation;
- runtime;
- region;
- deployment model;
- naming;
- retry behavior;
- callable versus HTTP rules.

**20\. Requirement Numbering Audit**

**20.1 Existing Prefixes**

The TRD currently uses:

- FR-INT;
- FR-DATA;
- FR-SRV;
- FR-SEC;
- FR-COM;
- FR-SRCH;
- FR-RPT;
- FR-FE;
- FR-SUB;
- FR-ADM;
- FR-QA;
- FR-OPS;
- FR-PRV;
- FR-IMP;
- FR-TRC.

It also uses rule prefixes such as:

- IR;
- DA;
- SP;
- SR;
- CR;
- SD;
- RR;
- FA;
- SB;
- AR;
- QR;
- OP;
- PR;
- IM;
- TC.

**20.2 Numbering Decision**

The final TRD shall preserve domain-specific prefixes.

Each prefix shall be unique.

The final audit shall create a requirement inventory containing:

- requirement ID;
- title;
- chapter;
- domain;
- requirement text;
- MVP or future classification;
- implementation phase;
- status.

**20.3 Duplicate Detection**

Before freeze, the consolidation process shall verify:

- no duplicate ID;
- no skipped number caused by accidental omission where continuity matters;
- no conflicting requirements;
- no requirement repeated under different IDs without reason;
- no future requirement presented as launch mandatory;
- no rule contradicting a functional requirement.

**21\. Repetition Reduction**

The progressive drafting process repeats several foundational principles across chapters.

The consolidated document shall retain the principles but reduce unnecessary duplication.

**Retain Full Definition In**

- Platform Architecture;
- Data Architecture;
- Security;
- MVP Delivery.

**Use Cross-References Elsewhere**

Examples:

Instead of redefining idempotency in every chapter:

This operation shall comply with the idempotency requirements defined in Chapter 11.

Instead of redefining customer isolation:

Access shall comply with the authorization and data-isolation rules defined in Chapter 12.

Instead of redefining localization:

Customer-facing content shall comply with Chapter 13.

This will make the final TRD shorter, clearer and easier to maintain.

**22\. Open Decisions Transfer**

All open decisions in Chapter 23 shall be moved into a standalone:

**11thONUS Decision Register**

The Decision Register shall contain:

- open decisions;
- approved decisions;
- superseded decisions;
- deferred decisions;
- technical decisions;
- product decisions;
- provider decisions;
- legal dependencies;
- architecture exceptions.

Chapter 23 shall retain a summary and reference the register.

**23\. Traceability Register Creation**

A first traceability register shall be created after the requirement-numbering audit.

The initial register shall cover at minimum:

- customer registration;
- business registration;
- staff invitation;
- Reward Program creation;
- Purchase Record creation;
- customer verification;
- rejection and dispute;
- Verified Unit creation;
- Loyalty Cycle progress;
- reward availability;
- reward redemption;
- On Us Moment;
- subscription activation;
- role authorization;
- English and French;
- offline queue;
- reporting;
- administration;
- privacy;
- operational readiness.

**24\. Engineering Standards Dependencies**

The consolidated TRD defines architectural requirements.

The Engineering Standards shall define implementation rules including:

- repository layout;
- TypeScript rules;
- naming conventions;
- package boundaries;
- Firestore naming;
- document schemas;
- status enums;
- command patterns;
- event patterns;
- error codes;
- idempotency implementation;
- transaction policy;
- test structure;
- migration scripts;
- logging;
- pull requests;
- coding-agent rules.

The Engineering Standards must not change product behavior defined by the TRD.

**25\. Consolidation Change Categories**

Every consolidation edit shall be classified.

**Editorial**

- grammar;
- formatting;
- repeated explanation;
- cross-reference;
- capitalization.

**Normalization**

- domain name;
- state name;
- terminology;
- requirement prefix;
- ownership clarification.

**Clarification**

- makes approved behavior more explicit;
- does not change product scope.

**Decision Required**

- cannot be resolved from approved material;
- must be entered in the Decision Register.

**Material Change**

- changes approved product behavior;
- requires user approval before application.

**26\. Material Issues Requiring Decision**

The following items shall not be silently resolved during editorial consolidation:

- Pending Verified Unit allocation policy.
- Reward redemption during business suspension.
- Final plan names.
- Staff limits per plan.
- Trial structure.
- Customer phone-number lookup.
- Public business profile scope.
- Reward quantity greater than one.
- Optional gender values.
- Birthday targeting and visibility.
- Initial payment provider.
- Firebase region.
- Authentication fallback.
- Email and SMS providers.

These will be handled through the Decision Register.

**27\. Consolidation Execution Sequence**

The final consolidation shall proceed in this order:

**Step 1 - Create Canonical Glossary**

Freeze:

- product terms;
- domain names;
- actor names;
- state names;
- UI vocabulary.

**Step 2 - Create Requirement Inventory**

Extract:

- all functional requirements;
- all technical rules;
- all architecture principles;
- all acceptance criteria.

**Step 3 - Reconcile Ownership**

Apply the final domain ownership matrix.

**Step 4 - Reconcile MVP Scope**

Label each requirement:

- MVP;
- post-MVP;
- architecture readiness;
- open decision.

**Step 5 - Reconcile State Models**

Replace inconsistent states with canonical states.

**Step 6 - Remove Duplication**

Retain definitions once and cross-reference them elsewhere.

**Step 7 - Transfer Open Decisions**

Move them into the Decision Register.

**Step 8 - Build Traceability Register**

Map product intent to technical requirements and phases.

**Step 9 - Final Document Review**

Review:

- consistency;
- numbering;
- scope;
- cross-references;
- formatting;
- completeness.

**Step 10 - Freeze Candidate**

Publish:

11thONUS Technical Requirements Document Version 1.0 - Freeze Candidate

**28\. Consolidation Acceptance Criteria**

The consolidation audit is complete when:

- The canonical terminology is approved.
- The final domain list is approved.
- Reward Program ownership is separated from Loyalty and Commerce Knowledge.
- Business identity ownership is separated from Administration.
- Subscription ownership is separated from Integration.
- Trust, audit and security logging are distinguished.
- The fixed MVP threshold is reconciled with configurable architecture.
- State models are normalized.
- The quantity and overflow policy is visible as an open decision.
- Shared loyalty-number use is consistently defined.
- Subscription limits are defined around Reward Programs rather than raw products.
- Offline and search MVP boundaries are clear.
- Knowledge Studio and Rules Studio MVP limits are clear.
- English and French requirements are consistent.
- Direct client-write prohibitions are consistent.
- Requirement-numbering and duplicate audits are scheduled.
- Open decisions are ready for transfer.
- The traceability register can be initialized.
- No material product decision has been changed silently.
- The consolidated TRD can be prepared without relying on unresolved conversation history.

**29\. Consolidation Decision**

Subject to approval of this audit, the consolidation process shall apply the normalization decisions in this document to the final TRD.

Any issue classified as **Material Change** or **Decision Required** shall remain unchanged until resolved through the Decision Register.

The next document shall be:

**11thONUS Decision Register - Version 1.0**

It will convert every approved, open, deferred and dependent decision into a governed record with:

- decision ID;
- context;
- available options;
- recommended direction;
- owner;
- deadline;
- implementation dependency;
- status;
- final resolution.