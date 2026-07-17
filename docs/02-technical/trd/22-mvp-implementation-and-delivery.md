> **Title:** TRD Chapter 22 — MVP Scope, Implementation Sequencing and Delivery  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/22-mvp-implementation-and-delivery.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

**11thONUS**

**Technical Requirements Document**

**PART XV - Implementation and Delivery**

**Chapter 22: MVP Scope, Implementation Sequencing and Technical Delivery Plan**

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-21

**22.1 Purpose**

This chapter defines how the first production version of 11thONUS shall be implemented and delivered.

It establishes:

- strict MVP boundaries;
- launch-critical capabilities;
- deferred capabilities;
- implementation phases;
- technical dependencies;
- work-package sequencing;
- Firebase setup;
- domain delivery order;
- testing gates;
- pilot preparation;
- Burundi launch readiness;
- post-MVP transition;
- coding-agent execution standards.

The implementation plan shall build only the functionality required for the first viable customer-verified loyalty platform.

Future capability shall be supported through architecture, not prematurely implemented through features.

**22.2 Delivery Objective**

The MVP shall prove that 11thONUS can reliably support this complete commercial journey:

Business registers

↓

Business creates a Reward Program

↓

Business registers authorized staff

↓

Customer registers and receives a loyalty number

↓

Business records a qualifying purchase

↓

Customer reviews and verifies the purchase

↓

Verified progress is updated

↓

Customer earns an On Us reward

↓

Business redeems the reward

↓

Customer sees the completed On Us Moment

↓

Business views simple operational reporting

A production launch is not complete until this journey works securely, consistently and understandably from end to end.

**22.3 MVP Product Definition**

The MVP is a:

**Customer-verified loyalty platform for recurring products and services, where qualifying purchases count only after customer verification and the customer's next eligible item is provided by the business as an On Us Moment.**

The MVP shall serve:

- customers;
- participating businesses;
- business owners;
- managers;
- staff members;
- platform administrators.

The initial operating market is Burundi.

**22.4 MVP Success Conditions**

The MVP succeeds when:

- A small business can register without technical support.
- A business can configure its first Reward Program.
- Staff can record purchases quickly.
- Customers can review and verify purchases.
- Incorrect purchases can be rejected or disputed.
- Verified progress is accurate and explainable.
- Rewards cannot be redeemed twice.
- Businesses can manage staff responsibility.
- Customers can use one loyalty identity across participating businesses.
- Basic billing supports business subscriptions.
- English and French launch-critical experiences are complete.
- The platform can be piloted safely in Burundi.
- Operational support can investigate every major action.
- No critical workflow depends on manual Firestore editing.

**22.5 Strict MVP Scope**

The following capabilities are included in the MVP.

**Customer Identity**

- customer registration;
- phone-based authentication;
- optional email;
- unique loyalty number;
- customer QR code;
- basic customer profile;
- preferred language;
- Terms and Privacy acknowledgement;
- notification preferences;
- limited progressive profile completion.

**Business Identity**

- business registration;
- owner account;
- business profile;
- business category;
- business type;
- business location;
- business language settings;
- subscription status;
- one branch per business for launch.

**Business Staff**

- invite staff;
- owner, manager and staff roles;
- individual staff accounts;
- staff activation;
- suspension;
- removal;
- role-based permissions;
- recorded-action attribution.

**Commerce Knowledge**

- centrally managed industries;
- business categories;
- business types;
- Reward Program categories;
- standard products and services;
- approved business tags;
- English labels;
- French labels for launch-critical knowledge;
- searchable onboarding dropdowns.

**Reward Programs**

- create Reward Program;
- select category;
- map standard products or services;
- define customer-facing display name;
- define qualifying unit;
- define On Us reward;
- fixed 10-unit threshold for the initial MVP;
- allow or disallow shared loyalty-number use;
- activate;
- pause;
- retire;
- view program history.

**Purchase Recording**

- customer lookup by QR;
- customer lookup by loyalty number;
- select Reward Program;
- record quantity;
- identify staff recorder;
- record purchase timestamp;
- show waiting-for-customer status;
- support idempotent submission;
- support limited offline queueing.

**Customer Verification**

- show purchases Waiting for You;
- verify one purchase;
- verify selected purchases;
- verify all visible reviewed purchases;
- reject a purchase;
- raise a dispute;
- provide reason;
- show resolved status;
- generate verified progress only after verification.

**Loyalty Progress**

- Verified Unit creation;
- one active Loyalty Cycle per customer per Reward Program;
- customer progress display;
- business-visible progress where permitted;
- threshold detection;
- reward creation;
- pending Verified Unit handling where a reward remains available;
- next-cycle creation after redemption;
- permanent history.

**Reward Redemption**

- available reward display;
- business reward lookup;
- server-side eligibility validation;
- owner, manager or permitted staff redemption;
- duplicate-redemption prevention;
- On Us Moment creation;
- customer success message;
- redemption history.

**Trust and Operational Integrity**

- Trust Events for major actions;
- Purchase Record timeline;
- rejected-purchase review;
- dispute review;
- correction through replacement records;
- basic operational review queue;
- administrator audit records;
- no silent history editing.

**Notifications**

- in-app notification center;
- purchase-waiting notification;
- verification outcome notification;
- dispute notification;
- reward-available notification;
- reward-redeemed notification;
- staff invitation;
- subscription notification;
- English and French templates;
- provider abstraction.

**Business Reporting**

- today's purchases;
- Waiting for Customer Verification;
- verified purchases;
- rejected purchases;
- disputes;
- customers close to reward;
- available rewards;
- redeemed rewards;
- On Us Moments;
- basic Reward Program performance;
- basic staff activity;
- subscription usage.

**Subscription and Billing**

- versioned plans;
- plan prices;
- business trial;
- plan limits;
- Reward Program limits;
- staff limits;
- subscription status;
- payment initiation;
- confirmed payment callback;
- receipt;
- renewal date;
- grace period;
- suspension;
- reactivation;
- manual administrator review where necessary.

**Platform Administration**

- administrator authentication;
- business search;
- customer support lookup;
- business status review;
- subscription review;
- Trust review;
- Knowledge Studio basic management;
- Rules Studio basic management;
- audit history;
- feature flags;
- support cases;
- operational health.

**Technical Foundation**

- Firebase Authentication;
- Firestore;
- Cloud Functions;
- Cloud Storage;
- Firebase Hosting;
- App Check;
- Cloud Messaging;
- Analytics;
- Performance Monitoring;
- structured logging;
- environment separation;
- CI/CD;
- backups;
- monitoring;
- emulator-based testing.

**22.6 Explicitly Deferred Features**

The following are not MVP features.

They shall not be implemented unless approved through formal scope change.

**Customer Commerce Features**

- customer wallet;
- wallet funding;
- wallet payments;
- wallet transfers;
- Verified Gift Cards;
- gifting earned rewards;
- reward transfer;
- reward marketplace;
- partner reward exchange;
- paid customer memberships.

**Advanced Loyalty**

- configurable unit thresholds beyond the approved MVP rule;
- points;
- monetary-value loyalty;
- tiered customer status;
- multiple simultaneous active cycles;
- stacked rewards;
- automatic reward expiry;
- cross-business reward pooling;
- coalition loyalty balances.

**Promotions**

- promotional bonus units;
- referral programs;
- birthday rewards;
- seasonal campaigns;
- merchant advertising;
- sponsored discovery;
- customer campaign automation.

**Search and Discovery**

- public business marketplace;
- nearby business search;
- map discovery;
- customer recommendations;
- ranked search;
- sponsored results;
- broad external search provider integration.

The MVP may contain architecture and internal taxonomy that prepares for these features.

**Advanced Reporting**

- AI recommendations;
- anonymous benchmarking;
- predictive retention;
- customer lifetime-value models;
- enterprise BI;
- data warehouse dashboards;
- advanced cohort reporting.

**Advanced Operations**

- franchises;
- regional business hierarchy;
- multi-branch business operation;
- enterprise SSO;
- public API;
- POS integration;
- accounting integration;
- CRM integration;
- automated financial reconciliation.

**Additional Language Completion**

- complete Kirundi translation;
- complete Swahili translation;
- complete Kinyarwanda translation.

The architecture and translation framework must support them.

**Advanced Administration**

- Experience Studio;
- Intelligence Studio;
- unrestricted support impersonation;
- automated AI rule activation;
- AI-published taxonomy;
- advanced bulk business migrations.

**22.7 MVP Scope Protection Rule**

A capability shall not enter the MVP merely because:

- it is architecturally possible;
- it appears useful in future;
- a framework supports it;
- an integration might eventually need it;
- an AI coding agent can implement it quickly.

A new feature enters the MVP only when:

- it is required for the launch customer journey;
- its absence creates unacceptable trust, security or operational risk;
- it is approved as a formal scope change;
- its dependencies and testing impact are understood.

**22.8 Delivery Principles**

**DIP-001 - Vertical Journeys Before Broad Screens**

Implementation shall prioritize complete working journeys rather than many disconnected screens.

**DIP-002 - Foundations Before Features**

Authentication, authorization, events, error handling and domain boundaries shall be established before high-level UI expansion.

**DIP-003 - One Controlled Phase at a Time**

Each phase shall be reviewed and approved before the next phase materially depends on it.

**DIP-004 - Tests Travel with Features**

A feature is not delivered separately from its tests.

**DIP-005 - No Temporary Architecture**

Temporary MVP code shall not bypass approved domain boundaries.

**DIP-006 - Production Readiness Is Incremental**

Security, observability, localization and support shall be added throughout delivery, not at the end.

**DIP-007 - Pilot Feedback Does Not Override Integrity**

Pilot feedback may simplify workflows but shall not remove customer verification, traceability or server authority.

**22.9 Implementation Phase Overview**

Recommended implementation sequence:

Phase 0 - Repository and Delivery Foundation

Phase 1 - Firebase and Shared Platform Foundation

Phase 2 - Identity, Roles and Business Context

Phase 3 - Commerce Knowledge and Business Onboarding

Phase 4 - Reward Program Management

Phase 5 - Purchase Recording

Phase 6 - Customer Verification and Disputes

Phase 7 - Loyalty Progress and Reward Availability

Phase 8 - Reward Redemption and On Us Moments

Phase 9 - Notifications

Phase 10 - Subscription and Billing

Phase 11 - Reporting and Operational Integrity

Phase 12 - Platform Administration

Phase 13 - Localization, Accessibility and PWA Hardening

Phase 14 - Security, Resilience and Compliance Readiness

Phase 15 - End-to-End Validation and Burundi Pilot

Phase 16 - Production Launch

**22.10 Phase 0 - Repository and Delivery Foundation**

**Objective**

Create a controlled engineering foundation before product features are added.

**Deliverables**

- repository initialized;
- protected primary branch;
- domain-based project structure;
- frontend and Functions workspaces;
- TypeScript strict mode;
- formatting;
- linting;
- test framework;
- Firebase Emulator Suite;
- environment configuration template;
- CI pipeline;
- pull-request template;
- change report template;
- architecture decision register;
- documentation folder;
- deployment runbook skeleton;
- implementation change log.

**Required Files**

Recommended starting documents:

/docs/constitution/

/docs/prd/

/docs/trd/

/docs/standards/

/docs/decisions/

/docs/reports/

/docs/changes/

**Exit Criteria**

- project builds;
- tests run;
- emulator starts;
- CI passes;
- no product-domain implementation has begun outside the approved structure.

**22.11 Phase 1 - Firebase and Shared Platform Foundation**

**Objective**

Establish reusable infrastructure needed by every domain.

**Deliverables**

- Firebase projects for development and staging;
- production project prepared but restricted;
- Firebase client initialization;
- Admin SDK initialization;
- App Check integration;
- shared error contract;
- correlation-ID service;
- structured logging;
- idempotency service;
- event envelope;
- event outbox;
- shared validation;
- server timestamp standards;
- base Firestore metadata;
- Security Rules deny-by-default foundation;
- Storage Rules foundation;
- feature-flag abstraction;
- Rules Service interface;
- Knowledge Service interface;
- monitoring initialization.

**Exit Criteria**

- shared server command can authenticate, validate, log and return a standard response;
- outbox event can be written and processed idempotently;
- unauthorized direct writes are denied;
- emulator tests pass.

**22.12 Phase 2 - Identity, Roles and Business Context**

**Objective**

Implement user identity and secure role-based access.

**Deliverables**

**Customer Identity**

- phone authentication;
- customer user record;
- customer profile;
- loyalty number;
- QR reference;
- preferred language;
- Terms and Privacy versions.

**Business Identity**

- create business;
- assign owner;
- business profile;
- business status;
- one branch;
- active business context.

**Staff Identity**

- invite staff;
- accept invitation;
- owner, manager and staff membership;
- suspend;
- reactivate;
- remove;
- individual attribution.

**Role Context**

- personal context;
- business context;
- multi-business switching;
- current membership validation;
- permission resolution.

**Security Requirements**

- customer cannot access another customer;
- business cannot access another business;
- staff cannot access owner-only functions;
- suspended memberships lose access;
- loyalty number does not authenticate the customer.

**Exit Criteria**

- customer can register and display a safe loyalty identity;
- owner can create a business;
- owner can invite staff;
- role switching works;
- security-rule and authorization tests pass.

**22.13 Phase 3 - Commerce Knowledge and Business Onboarding**

**Objective**

Make business setup fast, consistent and multilingual.

**Deliverables**

**Commerce Knowledge Seed**

- launch industries;
- business categories;
- business types;
- Reward Program categories;
- standard products and services;
- business tags;
- English labels;
- required French labels;
- synonym structure.

**Business Onboarding**

- business basics;
- category selection;
- business type;
- location;
- tags;
- supported languages;
- profile completion;
- onboarding progress.

**Knowledge Studio MVP**

- view knowledge;
- create draft;
- edit draft;
- approve;
- publish;
- retire;
- translation status;
- suggestion review.

**Exit Criteria**

- a business can complete onboarding without creating uncontrolled categories;
- Knowledge Studio can manage launch taxonomy;
- English and French labels display correctly;
- missing-option suggestion works.

**22.14 Phase 4 - Reward Program Management**

**Objective**

Allow a business to define the loyalty offering.

**Deliverables**

- create Reward Program;
- choose category;
- choose qualifying products or services;
- enter business display name;
- define reward description;
- fixed threshold of 10 Verified Units;
- define reward quantity;
- multiple-quantity policy;
- shared loyalty-number policy;
- draft;
- activate;
- pause;
- retire;
- version history;
- plan-limit check;
- customer-facing published view.

**Exit Criteria**

- business can activate one valid Reward Program;
- all applicable taxonomy references are valid;
- versioning preserves historical terms;
- inactive businesses cannot activate a program;
- plan limits are server-enforced.

**22.15 Phase 5 - Purchase Recording**

**Objective**

Allow authorized business users to record qualifying purchases.

**Deliverables**

- QR scanning;
- manual loyalty-number entry;
- customer-minimized confirmation;
- Reward Program selection;
- quantity entry;
- submission review;
- server-side Purchase Record creation;
- idempotency;
- recorder attribution;
- waiting-for-customer state;
- business recent activity;
- Trust Event;
- notification intent;
- offline queue;
- pending-sync display.

**Exit Criteria**

- staff can create a Purchase Record quickly;
- customer does not yet gain progress;
- duplicate submission does not create duplicate records;
- unauthorized staff cannot record;
- offline items are clearly non-authoritative.

**22.16 Phase 6 - Customer Verification and Disputes**

**Objective**

Make customer verification the controlling gate for loyalty progress.

**Deliverables**

- Waiting for You list;
- Purchase Record detail;
- verify;
- verify selected;
- verify visible set;
- reject;
- rejection reasons;
- dispute;
- customer comments;
- business review queue;
- business resolution;
- corrected replacement record;
- original history preserved;
- purchase timeline;
- notification outcomes.

**Exit Criteria**

- only the registered customer can verify;
- rejected purchases generate no progress;
- disputes create review records;
- corrections require replacement and reverification;
- all transitions are audited.

**22.17 Phase 7 - Loyalty Progress and Reward Availability**

**Objective**

Convert customer-verified activity into accurate loyalty progress.

**Deliverables**

- Verified Unit issuance;
- Verified Unit uniqueness;
- active Loyalty Cycle creation;
- cycle progress;
- customer progress card;
- business progress view;
- threshold calculation;
- reward creation;
- reward-available state;
- pending Verified Units;
- quantity crossing cycle boundary;
- reconciliation job;
- projection rebuild;
- Trust Events.

**Exit Criteria**

- progress can be reconstructed from Verified Units;
- one active or reward-available cycle exists per customer and Reward Program;
- no Verified Units are lost;
- retrying verification produces one commercial outcome;
- reward availability is deterministic.

**22.18 Phase 8 - Reward Redemption and On Us Moments**

**Objective**

Complete the core customer promise.

**Deliverables**

- customer available-reward view;
- business reward lookup;
- redemption permission;
- online validation;
- atomic redemption;
- duplicate-redemption prevention;
- cycle closure;
- next-cycle creation;
- pending-unit allocation;
- On Us Moment history;
- customer celebration;
- business redemption history;
- Trust Events.

**Exit Criteria**

- an available reward can be redeemed once;
- concurrent redemption attempts produce one success;
- customer sees the completed On Us Moment;
- next cycle begins correctly;
- all reward history remains available.

**22.19 Phase 9 - Notifications**

**Objective**

Communicate essential platform actions reliably.

**Deliverables**

- notification intent;
- template resolution;
- English templates;
- French templates;
- in-app notification center;
- push notifications;
- email where configured;
- SMS provider abstraction;
- preferences;
- quiet hours;
- deep links;
- delivery tracking;
- retries;
- duplicate suppression.

**Launch-Critical Templates**

- staff invitation;
- Purchase Record waiting;
- Purchase Record verified;
- Purchase Record rejected;
- dispute opened;
- correction submitted;
- reward available;
- reward redeemed;
- subscription payment;
- subscription expiry;
- security notice.

**Exit Criteria**

- every core workflow generates the correct intent;
- duplicate events do not send repeated messages;
- English and French content passes review;
- failed delivery does not corrupt domain state.

**22.20 Phase 10 - Subscription and Billing**

**Objective**

Enable businesses to subscribe and remain operational according to plan rules.

**Deliverables**

- plan catalogue;
- plan versions;
- country pricing;
- BIF launch pricing;
- trial;
- Reward Program limits;
- staff limits;
- entitlement service;
- payment attempt;
- provider adapter;
- webhook validation;
- payment confirmation;
- subscription activation;
- invoice;
- receipt;
- renewal;
- grace period;
- suspension;
- reactivation;
- billing administration.

**Provider Strategy**

The initial Burundi payment provider shall be selected through commercial and technical review.

The Subscription Domain shall remain provider-independent.

**Exit Criteria**

- confirmed payment activates or renews a subscription once;
- duplicate callbacks have no duplicate effect;
- plan limits are server-enforced;
- suspended businesses preserve history;
- customer rewards are not erased by billing failure.

**22.21 Phase 11 - Reporting and Operational Integrity**

**Objective**

Give businesses useful operational visibility.

**Deliverables**

**Business Dashboard**

- today's purchases;
- Waiting for Customer Verification;
- verification rate;
- rejections;
- disputes;
- customers close to reward;
- available rewards;
- On Us Moments;
- staff activity;
- subscription usage.

**Reporting Foundation**

- Metric Catalogue;
- daily business projections;
- Reward Program projections;
- staff projections;
- customer progress projections;
- reconciliation;
- freshness labels;
- CSV export where approved.

**Operational Integrity**

- review queue;
- anomaly rules;
- duplicate detection;
- stale disputes;
- failed sync reviews;
- data-quality checks.

**Exit Criteria**

- metrics use governed definitions;
- projections are rebuildable;
- business cannot see another business;
- staff metrics are contextual;
- dashboard loading remains bounded.

**22.22 Phase 12 - Platform Administration**

**Objective**

Enable safe platform operation without unrestricted database editing.

**Deliverables**

- administrator roles;
- administrator MFA;
- business management;
- customer support lookup;
- subscription review;
- support cases;
- Trust reviews;
- audit search;
- Knowledge Studio launch functions;
- Rules Studio launch functions;
- feature flags;
- bulk-job framework;
- maintenance mode;
- session revocation;
- operational dashboard.

**Exit Criteria**

- routine support does not require Firebase Console;
- administrator permissions are separated;
- privileged changes are audited;
- Knowledge and Rules publication use governed workflows;
- emergency controls are tested.

**22.23 Phase 13 - Localization, Accessibility and PWA Hardening**

**Objective**

Prepare the customer and business experience for real-world use.

**Deliverables**

- complete English copy;
- complete French launch-critical copy;
- translation completeness checks;
- language switching;
- localized dates and currency;
- French layout testing;
- accessibility review;
- keyboard support;
- screen-reader support;
- touch-target review;
- PWA manifest;
- install experience;
- offline application shell;
- update handling;
- supported-browser matrix;
- lower-cost-device testing.

**Exit Criteria**

- no launch-critical untranslated French keys;
- no backend terminology in customer copy;
- core customer and staff journeys pass accessibility review;
- PWA is usable without installation;
- offline states are clear.

**22.24 Phase 14 - Security, Resilience and Compliance Readiness**

**Objective**

Complete the controls required for a safe pilot.

**Deliverables**

**Security**

- Security Rules review;
- Storage Rules review;
- App Check enforcement;
- rate limiting;
- QR abuse controls;
- loyalty-number enumeration controls;
- administrator security review;
- session revocation;
- dependency review;
- security logging.

**Resilience**

- monitoring dashboards;
- alerts;
- backup jobs;
- restore test;
- rollback test;
- dead-letter review;
- event backlog monitoring;
- cost alerts;
- incident runbooks;
- maintenance-mode test.

**Privacy and Compliance**

- processing register;
- data inventory;
- retention schedule;
- consent records;
- rights-request workflow;
- Privacy Policy;
- Terms;
- business agreement;
- subprocessor register;
- Burundi legal review;
- breach-response contacts;
- country compliance approval.

**Exit Criteria**

- restore test passes;
- critical alerts are active;
- privacy and compliance gate is approved;
- no Severity 0 or Severity 1 security issue remains;
- operational runbooks are available.

**22.25 Phase 15 - End-to-End Validation and Burundi Pilot**

**Objective**

Validate the product with controlled real-world participation.

**Pilot Scope**

Recommended pilot:

- limited number of businesses;
- selected categories;
- selected owners and staff;
- controlled customer cohort;
- Bujumbura-first operation;
- English and French support;
- formal pilot period;
- defined support process.

**Pilot Business Categories**

A balanced cohort may include:

- salon or barbershop;
- coffee shop or café;
- restaurant;
- car wash;
- bakery;
- other recurring-service business.

The final pilot categories shall prioritize businesses able to train staff and honor rewards reliably.

**Pilot Validation Areas**

- onboarding time;
- staff ease of use;
- Purchase Record speed;
- customer verification;
- shared loyalty-number use;
- quantity handling;
- dispute rate;
- reward understanding;
- redemption;
- offline sync;
- French comprehension;
- support requirements;
- notification effectiveness;
- business reporting usefulness;
- plan willingness to pay.

**Exit Criteria**

- complete end-to-end journey works with real participants;
- no unresolved Severity 0 or Severity 1 issue;
- data integrity reconciles;
- customer verification behavior is understood;
- operational support can resolve real cases;
- pilot findings are formally reviewed.

**22.26 Phase 16 - Production Launch**

**Objective**

Move from controlled pilot to public Burundi availability.

**Launch Requirements**

- production release candidate approved;
- Firebase production project secured;
- production provider credentials active;
- data backup active;
- restore test current;
- monitoring active;
- incident contacts active;
- Terms and Privacy published;
- business agreements approved;
- English complete;
- French complete for launch-critical journeys;
- support team ready;
- launch businesses approved;
- plan pricing active;
- app domain configured;
- PWA install assets complete;
- status communication ready;
- rollback plan approved.

**Launch Exit Criteria**

- production smoke test passes;
- customer registration works;
- business onboarding works;
- purchase verification works;
- progress works;
- redemption works;
- payment works;
- support intake works;
- monitoring shows no critical anomaly.

**22.27 Dependency Map**

The major dependencies are:

Repository Foundation

↓

Shared Firebase Foundation

↓

Identity and Authorization

↓

Commerce Knowledge

↓

Business Onboarding

↓

Reward Programs

↓

Purchase Recording

↓

Customer Verification

↓

Verified Units and Loyalty Cycles

↓

Rewards and Redemption

↓

Notifications

↓

Subscriptions

↓

Reporting and Administration

↓

Pilot Readiness

A downstream phase shall not create temporary substitutes for an unfinished dependency.

**22.28 Critical Path**

The critical product path is:

- identity;
- business onboarding;
- Reward Program;
- Purchase Record;
- customer verification;
- Verified Unit;
- Loyalty Cycle;
- reward availability;
- redemption;
- On Us Moment.

Reporting, subscriptions and administration are required for launch but must not distract from completing this core path early.

**22.29 Recommended Vertical Slice**

The first complete vertical slice should include:

One Customer

One Business

One Owner

One Reward Program

One Purchase Record

One Verification

One Verified Unit

One Progress Update

One Reward

One Redemption

One On Us Moment

This slice should be completed before expanding broadly into:

- multiple staff workflows;
- advanced onboarding;
- reporting;
- billing;
- administration.

The slice proves the architecture and reveals integration problems early.

**22.30 Data Seed Strategy**

Initial seed data shall include:

- countries;
- currencies;
- languages;
- launch business categories;
- launch business types;
- Reward Program categories;
- standard products and services;
- tags;
- plan catalogue;
- BIF prices;
- default platform rules;
- default Burundi rules;
- launch notification templates;
- administrator roles;
- test users.

Seed data shall be:

- version-controlled;
- repeatable;
- environment-aware;
- idempotent;
- reviewable.

**22.31 Rules Studio MVP Boundary**

Rules Studio MVP shall manage only rules required for launch.

Recommended initial rule groups:

- fixed loyalty threshold;
- purchase quantity review threshold;
- shared loyalty-number default;
- verification reminder timing;
- dispute escalation timing;
- plan limits;
- trial duration;
- grace period;
- subscription suspension behavior;
- notification quiet hours;
- feature flags;
- offline submission limits.

A general-purpose rule language is not required for the MVP.

Rules may use typed, predefined configurations.

**22.32 Knowledge Studio MVP Boundary**

Knowledge Studio MVP shall support:

- taxonomy CRUD through governed workflow;
- parent-child hierarchy;
- English content;
- French content;
- synonyms;
- tags;
- business suggestions;
- approval;
- publication;
- retirement;
- replacement.

AI categorization and advanced taxonomy intelligence are deferred.

**22.33 Offline MVP Boundary**

Offline support shall be limited to:

- cached app shell;
- cached essential reference data;
- customer QR display where safe;
- queued Purchase Record creation;
- sync when online;
- visible queue status.

Offline support shall not include:

- customer verification;
- reward redemption;
- subscription payment;
- administrator actions;
- complete offline business operation.

**22.34 Reporting MVP Boundary**

MVP reporting shall prioritize:

- operational counts;
- actionable review items;
- customer progress;
- Reward Program performance;
- staff activity;
- outstanding rewards;
- subscription usage.

The MVP shall not include:

- complex BI;
- predictive analysis;
- AI recommendations;
- benchmarking;
- large multidimensional analytics.

**22.35 Customer KYC MVP Boundary**

Required:

- name;
- phone;
- country;
- language;
- Terms;
- Privacy.

Optional early profile fields:

- date of birth;
- gender;
- city;
- interests;
- notification preferences.

The MVP shall not include:

- identity-document verification;
- household profiles;
- children's profiles;
- occupation;
- income;
- vehicle ownership;
- sensitive profiling.

**22.36 Search MVP Boundary**

Search in the MVP shall primarily support:

- business onboarding;
- taxonomy selection;
- Reward Program setup;
- administrator knowledge management;
- internal business and customer lookup.

Public customer discovery may be deferred until the business catalogue is sufficiently populated and governed.

**22.37 Integration MVP Boundary**

Required integrations:

- Firebase Authentication;
- push notification;
- selected email or SMS delivery;
- one Burundi subscription payment provider;
- production monitoring.

Deferred:

- POS;
- CRM;
- accounting;
- WhatsApp;
- public API;
- multiple payment providers unless required for resilience.

**22.38 Implementation Work-Package Standard**

Each coding-agent work package shall include:

**Context**

- relevant Constitution principles;
- PRD section;
- TRD chapter;
- affected domain;
- current implementation state.

**Task**

A precise description of what must be implemented.

**In Scope**

Exact capabilities and files or domains permitted.

**Out of Scope**

Explicitly deferred or unrelated work.

**Constraints**

- maintain current architecture;
- do not modify unrelated files;
- do not bypass domain services;
- no direct authoritative client writes;
- preserve localization;
- preserve security boundaries;
- avoid speculative refactoring.

**Acceptance Criteria**

Testable outcomes.

**Required Tests**

- unit;
- integration;
- emulator;
- security;
- end-to-end where applicable.

**Verification Commands**

Commands the agent must run.

**Reporting Requirements**

The agent shall report:

- files modified;
- code diff summary;
- commands executed;
- tests and results;
- dependencies added;
- configuration changes;
- migrations;
- risks;
- rollback instructions;
- unresolved issues;
- markdown implementation report;
- update to the persistent changes-tracking markdown file.

**22.39 Coding-Agent Change Tracking**

The repository shall maintain a persistent change log.

Recommended location:

/docs/changes/IMPLEMENTATION_CHANGES.md

Each completed work package shall append:

- date;
- phase;
- task;
- status;
- files changed;
- tests;
- configuration;
- migrations;
- risks;
- rollback;
- report link.

The change file shall not replace Git history.

It exists to provide a founder-readable implementation trail.

**22.40 Coding-Agent Stop Conditions**

A coding agent shall stop and report rather than guess when:

- required business behavior is ambiguous;
- current code contradicts the approved architecture;
- a requested change would affect unrelated domains;
- security behavior is unclear;
- production data migration is required but unspecified;
- a required provider contract is unavailable;
- the repository is not in the expected state;
- another agent or process is modifying the same codebase;
- tests reveal a wider architectural defect;
- implementation would require bypassing an approved rule.

The agent shall explain the blocking issue and identify the decision required.

**22.41 Phase Review Standard**

After every implementation phase, review shall confirm:

- scope completed;
- acceptance criteria met;
- tests passed;
- no unrelated changes;
- architecture preserved;
- security preserved;
- localization preserved;
- documentation updated;
- risks understood;
- next phase dependencies ready.

The next phase shall not begin merely because code exists.

**22.42 MVP Data Migration Policy**

Before pilot launch:

- seed migrations are permitted;
- test-data reset is permitted outside production;
- production schema migrations require formal scripts;
- no production migration shall use manual console edits;
- every migration shall support dry run and verification;
- rollout and rollback impact shall be documented.

**22.43 Pilot Change Control**

During the pilot:

- critical defects may receive expedited fixes;
- product changes remain documented;
- business-rule changes use Rules Studio or versioned configuration;
- pilot-only changes use feature flags;
- schema changes require migration review;
- pilot data shall not be reset casually;
- customer progress shall not be manually corrected without governed records.

**22.44 Launch-Critical Non-Functional Requirements**

The MVP shall meet the following launch-critical conditions.

**Security**

- deny-by-default access;
- server-controlled commercial writes;
- role isolation;
- App Check;
- audit records;
- protected secrets;
- rate limits.

**Reliability**

- idempotent critical operations;
- retry handling;
- dead-letter visibility;
- backup;
- restore;
- rollback.

**Performance**

- acceptable mobile load;
- fast purchase recording;
- fast customer verification;
- fast reward redemption;
- bounded dashboard queries.

**Accessibility**

- keyboard support;
- screen-reader support;
- touch targets;
- contrast;
- clear errors.

**Localization**

- English;
- French;
- localized formats;
- no untranslated launch-critical keys.

**Privacy**

- data minimization;
- consent;
- customer rights;
- retention;
- country approval.

**22.45 MVP Exit Gate**

The MVP is technically complete only when all of the following pass:

- core vertical journey;
- role and permission tests;
- security-rule tests;
- idempotency tests;
- concurrency tests;
- English and French validation;
- accessibility review;
- offline queue validation;
- payment-provider sandbox validation;
- backup restore;
- monitoring and alerting;
- privacy and compliance gate;
- UAT;
- pilot readiness;
- rollback rehearsal.

**22.46 Post-MVP Priority Order**

After a stable Burundi launch, recommended priority order is:

**Priority 1 - Operational Stabilization**

- defect reduction;
- support improvements;
- performance;
- reporting accuracy;
- onboarding improvements;
- notification tuning;
- plan optimization.

**Priority 2 - Burundi Growth**

- more business categories;
- broader taxonomy;
- customer discovery;
- business promotion tools;
- improved reporting;
- more payment options.

**Priority 3 - Regional Readiness**

- Rwanda compliance;
- RWF pricing;
- Kinyarwanda;
- Rwanda payment providers;
- regional taxonomy;
- country configuration.

**Priority 4 - Verified Business**

- multi-branch;
- POS reconciliation;
- advanced analytics;
- benchmarking;
- integrations.

**Priority 5 - Verified Commerce**

- gifted On Us Moments;
- Verified Gift Cards;
- wallet;
- promotions;
- memberships;
- referrals.

**Priority 6 - Verified Intelligence**

- AI-assisted business insights;
- anomaly analysis;
- recommendation systems;
- search optimization;
- reward optimization.

**22.47 Post-MVP Feature Entry Rule**

Every future feature shall:

- identify the owning domain;
- identify existing services it extends;
- avoid creating duplicate ledgers, taxonomies or reward systems;
- include privacy review;
- include security review;
- define migration impact;
- define reporting impact;
- define localization impact;
- define rollback;
- answer the Constitution's four questions.

**22.48 Technical Delivery Risks**

Key implementation risks include:

**Overengineering**

Attempting to build all future platform capabilities in the MVP.

**Control:** strict deferred-feature list.

**Underengineering Trust**

Allowing frontend calculations, direct writes or mutable balances.

**Control:** server authority, event traceability and domain tests.

**Firebase Cost Growth**

Using unbounded listeners or repeated scans.

**Control:** projections, pagination, cost monitoring.

**Offline Complexity**

Attempting broad offline behavior.

**Control:** limit offline to queued Purchase Records.

**Localization Delay**

Adding French after feature completion.

**Control:** translation keys and French coverage within every phase.

**Provider Dependency**

Hardcoding the first payment or messaging provider.

**Control:** Integration Domain adapters.

**Taxonomy Overexpansion**

Trying to catalogue every business type before launch.

**Control:** launch taxonomy plus suggestion workflow.

**Administrative Overreach**

Building unrestricted admin tools.

**Control:** domain commands, permissions and audit.

**Pilot Scope Creep**

Adding features based on isolated requests.

**Control:** pilot change-control process.

**22.49 Technical Delivery Decision Register**

The implementation shall maintain approved decisions including:

- architecture;
- frameworks;
- Firebase regions;
- search approach;
- provider selection;
- plan structure;
- offline policy;
- retention;
- languages;
- pilot scope;
- rule defaults.

Every decision shall include:

- ID;
- date;
- context;
- decision;
- reason;
- alternatives;
- consequences;
- status.

**22.50 Functional Requirements**

**FR-IMP-001**

The MVP shall deliver the complete customer-verified loyalty journey.

**FR-IMP-002**

Deferred features shall not enter implementation without formal scope approval.

**FR-IMP-003**

Implementation shall follow the approved phase sequence unless a documented dependency review approves a change.

**FR-IMP-004**

The first product milestone shall be one complete vertical loyalty slice.

**FR-IMP-005**

Every phase shall include tests, documentation and operational controls.

**FR-IMP-006**

Critical server and security foundations shall precede broad UI expansion.

**FR-IMP-007**

English and French shall be implemented throughout development rather than added after feature completion.

**FR-IMP-008**

Offline MVP capability shall remain limited to controlled Purchase Record queueing and safe cached access.

**FR-IMP-009**

Rules Studio shall use typed launch rules rather than an unrestricted general-purpose rule language.

**FR-IMP-010**

Knowledge Studio shall support governed launch taxonomy without requiring advanced AI capability.

**FR-IMP-011**

Business and customer reporting shall use governed metrics and rebuildable projections.

**FR-IMP-012**

Every coding-agent task shall define scope, constraints, acceptance criteria, tests and reporting.

**FR-IMP-013**

Coding agents shall not modify unrelated files or change architecture without approval.

**FR-IMP-014**

Every completed implementation task shall update the persistent markdown change log.

**FR-IMP-015**

Ambiguous or unsafe implementation conditions shall trigger an agent stop report rather than guessing.

**FR-IMP-016**

No production launch shall occur before the MVP exit gate passes.

**FR-IMP-017**

The Burundi pilot shall use controlled cohorts and governed feature flags.

**FR-IMP-018**

Pilot findings shall inform stabilization before wider rollout.

**FR-IMP-019**

Future Verified Commerce capabilities shall extend existing domains rather than create parallel systems.

**FR-IMP-020**

The implementation roadmap shall remain versioned and auditable.

**22.51 Implementation Rules**

| **Rule ID** | **Rule**                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| IM-001      | Build only Horizon 1 features in the MVP.                                                                         |
| IM-002      | Validate every MVP design against future horizons without implementing future features.                           |
| IM-003      | Complete one end-to-end vertical slice before broad expansion.                                                    |
| IM-004      | Customer verification shall never be deferred from the core slice.                                                |
| IM-005      | Tests and documentation are part of implementation, not follow-up work.                                           |
| IM-006      | No coding agent may modify unrelated files.                                                                       |
| IM-007      | Existing architecture shall be maintained unless a formal change is approved.                                     |
| IM-008      | No direct authoritative client writes shall be introduced for delivery speed.                                     |
| IM-009      | Pilot-only behavior shall use governed configuration or feature flags.                                            |
| IM-010      | A feature is not complete until its failure states are implemented.                                               |
| IM-011      | French launch-critical copy shall be completed alongside English implementation.                                  |
| IM-012      | Production repair shall not depend on manual Firestore editing.                                                   |
| IM-013      | Every phase shall produce a founder-readable implementation report.                                               |
| IM-014      | Deferred capability shall remain visible in architecture documentation but absent from MVP screens and workflows. |
| IM-015      | Launch readiness requires technical, operational, security, language and compliance approval.                     |

**22.52 Acceptance Criteria**

This chapter is approved when:

- The MVP scope is explicit.
- Deferred features are clearly separated.
- The complete customer-verified loyalty journey is the primary delivery objective.
- Implementation phases and dependencies are defined.
- The initial vertical slice is established.
- Offline, KYC, search, reporting, Rules Studio and Knowledge Studio MVP boundaries are clear.
- Pilot and production launch gates are documented.
- Coding-agent task, report and stop-condition standards are established.
- The persistent implementation change log is required.
- Post-MVP priorities follow Verified Loyalty, Verified Business, Verified Commerce and Verified Intelligence layers.
- Future capabilities must extend the approved architecture rather than create parallel systems.

**22.53 Next Chapter**

The next chapter should define:

**Technical Requirements Traceability, Open Decisions and TRD Completion Review**

It will cover:

- PRD-to-TRD traceability;
- domain ownership verification;
- unresolved technical decisions;
- unresolved product decisions;
- provider-selection decisions;
- legal dependencies;
- MVP assumptions;
- architecture exceptions;
- document consistency;
- requirement numbering conflicts;
- final TRD approval;
- implementation-readiness checklist.