> **Title:** TRD Chapter 19 — Testing, QA and Release Validation  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/19-quality-engineering.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Technical Requirements Document

## PART XII - Quality Engineering and Release Governance

# Chapter 19: Testing, Quality Assurance and Release Validation Architecture

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-18

# 19.1 Purpose

This chapter defines how 11thONUS shall verify that the platform is correct, secure, understandable and ready for release.

It establishes:

- testing strategy;
- test ownership;
- automated and manual testing;
- unit, integration, emulator and end-to-end testing;
- security-rule testing;
- concurrency and idempotency testing;
- localization;
- accessibility;
- offline behavior;
- PWA testing;
- payment-provider testing;
- data migration testing;
- test environments;
- test data;
- release gates;
- pilot validation;
- regression testing;
- defect classification;
- production verification;
- rollback criteria.

Quality assurance is not a final step after development.

It is a continuous responsibility across product, engineering, design and operations.

# 19.2 Quality Objectives

The quality architecture shall ensure that:

- Critical business rules are proven through automated tests.
- Customer verification cannot be bypassed.
- Duplicate requests do not create duplicate loyalty outcomes.
- Customers and businesses cannot access unauthorized data.
- Reward eligibility and redemption remain correct under concurrency.
- English and French experiences are complete and understandable.
- Offline activity cannot silently become authoritative.
- Payment callbacks do not activate subscriptions twice.
- Data migrations are repeatable and verifiable.
- Accessibility is tested across complete journeys.
- Every release has documented evidence of readiness.
- Production deployment can be safely rolled back.

# 19.3 Quality Principles

## QAP-001 - Test Business Behavior, Not Only Code

Tests shall verify approved product rules and outcomes.

A technically functioning method is not sufficient if it produces the wrong loyalty behavior.

## QAP-002 - Critical Rules Require Automated Coverage

Any rule affecting:

- customer progress;
- reward availability;
- redemption;
- permissions;
- billing;
- audit history;
- data isolation;

shall have automated tests.

## QAP-003 - Failure Paths Are First-Class

The platform shall test:

- network failures;
- duplicate requests;
- partial processing;
- stale data;
- denied permissions;
- unavailable providers;
- invalid state transitions.

## QAP-004 - Production-Like Validation

Staging shall reflect production architecture closely enough to expose realistic failures.

## QAP-005 - No Release Without Evidence

Release approval shall rely on test results, not confidence or assumption.

## QAP-006 - Regression Protection

Every confirmed defect in a critical workflow should result in a regression test where practical.

## QAP-007 - Quality Includes Language and Accessibility

A functionally correct feature is incomplete if users cannot understand or operate it.

## QAP-008 - Test Data Must Be Controlled

Production customer data shall not be copied into test environments without approved anonymization.

# 19.4 Test Pyramid

11thONUS shall use a layered testing model.

End-to-End Tests  
Integration and Emulator Tests  
Domain Service and Component Tests  
Unit and Contract Tests

The majority of tests should remain fast and focused.

End-to-end tests shall cover the highest-value journeys rather than every minor interface detail.

# 19.5 Testing Categories

The platform shall use the following testing categories.

- Unit testing.
- Domain service testing.
- Component testing.
- Integration testing.
- Firebase Emulator testing.
- Contract testing.
- Security-rule testing.
- End-to-end testing.
- Concurrency testing.
- Idempotency testing.
- Offline and synchronization testing.
- Localization testing.
- Accessibility testing.
- Performance testing.
- Integration-provider testing.
- Migration testing.
- User acceptance testing.
- Pilot validation.
- Production smoke testing.

# 19.6 Unit Testing

Unit tests shall verify isolated logic.

Typical targets include:

- validators;
- value objects;
- status-transition rules;
- metric formulas;
- permission resolution helpers;
- rule precedence;
- translation fallback;
- date and currency formatting;
- search normalization;
- idempotency hashing;
- entitlement checks.

Unit tests shall avoid unnecessary Firebase dependencies.

# 19.7 Domain Service Testing

Domain services shall be tested against approved business rules.

## Purchase Domain

Tests shall cover:

- valid Purchase Record creation;
- inactive business;
- unauthorized staff;
- inactive Reward Program;
- invalid quantity;
- duplicate idempotency key;
- shared loyalty-number policy;
- offline-source validation.

## Loyalty Domain

Tests shall cover:

- Verified Unit issuance;
- unit reversal;
- Loyalty Cycle creation;
- cycle progress;
- reward threshold;
- pending-unit allocation;
- no duplicate active cycle;
- quantity crossing a cycle boundary.

## Reward Domain

Tests shall cover:

- reward creation;
- reward uniqueness;
- valid redemption;
- duplicate redemption;
- reversed redemption;
- next-cycle creation;
- On Us Moment projection.

## Subscription Domain

Tests shall cover:

- entitlement resolution;
- trial activation;
- plan limits;
- upgrade;
- downgrade blocking;
- grace period;
- suspension;
- reactivation.

# 19.8 Component Testing

Frontend components shall be tested for:

- displayed content;
- supported states;
- keyboard behavior;
- screen-reader labels;
- permission-sensitive rendering;
- error handling;
- language switching;
- responsive layout behavior;
- form validation.

Examples include:

- customer progress card;
- Waiting for You card;
- QR display;
- QR scan fallback;
- role-context selector;
- purchase quantity control;
- reward redemption confirmation;
- subscription limit message.

# 19.9 Integration Testing

Integration tests shall verify collaboration among:

- domain service;
- repository;
- Firestore transaction;
- event outbox;
- Trust Event generation;
- notification intent;
- reporting projection.

Example verification workflow:

Purchase verified  
↓  
Verified Units created  
↓  
Loyalty Cycle updated  
↓  
Reward created where threshold reached  
↓  
Trust Events written  
↓  
Notification intent created

Integration tests shall verify the complete outcome, not only the first write.

# 19.10 Firebase Emulator Suite

The Firebase Emulator Suite shall be used for local and automated testing of:

- Firebase Authentication;
- Cloud Firestore;
- Cloud Functions;
- Cloud Storage;
- Security Rules.

The emulator environment shall support repeatable seed and cleanup scripts.

Tests shall not depend on shared mutable developer data.

# 19.11 Security Rules Testing

Firestore and Storage rules shall have automated permit-and-deny tests.

## Customer Cases

- customer reads own profile;
- customer cannot read another profile;
- customer reads own purchases;
- customer cannot read another customer's rewards;
- customer cannot directly write verification state.

## Business Cases

- active staff reads permitted business records;
- staff cannot access another business;
- suspended membership is denied;
- owner accesses billing;
- staff cannot access billing;
- business cannot access customer activity elsewhere.

## Administration Cases

- role-specific access;
- unauthorized administrator denial;
- suspended administrator denial;
- direct write restrictions.

A rule change without updated test coverage shall fail the release pipeline.

# 19.12 Command Contract Testing

Callable and HTTP command contracts shall be tested for:

- required fields;
- version support;
- invalid payloads;
- unknown fields where prohibited;
- error response shape;
- correlation ID;
- idempotency key;
- authentication requirements.

Contract tests protect frontend and server compatibility.

# 19.13 Event Contract Testing

Every published event shall have schema tests.

Tests shall verify:

- event name;
- event version;
- source domain;
- aggregate identity;
- correlation ID;
- actor;
- timestamp;
- required payload fields.

Consumers shall be tested against supported event versions.

Breaking event changes require a new version.

# 19.14 Idempotency Testing

Sensitive workflows shall be tested through repeated identical requests.

Required cases include:

- Purchase Record submission;
- customer verification;
- dispute submission;
- Verified Unit issuance;
- reward creation;
- reward redemption;
- payment confirmation;
- notification scheduling;
- webhook processing.

Expected behavior:

- one authoritative outcome;
- original response returned or safe current state;
- no duplicate Trust Events with commercial effect;
- no duplicated projections.

# 19.15 Idempotency Conflict Testing

The platform shall test reuse of one idempotency key with different request payloads.

Expected result:

- request rejected;
- original operation preserved;
- conflict logged;
- no second business action performed.

# 19.16 Concurrency Testing

Concurrency tests shall simulate simultaneous operations.

Required cases include:

## Duplicate Purchase Submission

Two devices submit the same Purchase Record.

## Duplicate Customer Verification

The customer presses Verify twice or retries from two sessions.

## Simultaneous Redemption

Two staff members attempt to redeem the same reward.

## Loyalty Cycle Creation

Multiple Verified Unit processors attempt to create an active cycle.

## Subscription Upgrade

Repeated payment callbacks attempt activation.

## Ownership Change

Two operations attempt to remove or replace the final owner.

The platform shall preserve one correct result.

# 19.17 State Transition Testing

Every controlled state machine shall have positive and negative transition tests.

Example Purchase Record states:

waiting_for_customer → verified  
waiting_for_customer → rejected  
waiting_for_customer → under_review

Invalid examples:

verified → waiting_for_customer  
rejected → verified without approved resolution  
cancelled → verified

Invalid transitions shall produce standardized errors and no partial writes.

# 19.18 Trust Ledger Testing

Tests shall confirm that:

- significant actions produce Trust Events;
- events are append-only;
- actor details are present;
- correlation IDs connect related operations;
- event payloads contain no prohibited sensitive data;
- retries do not create duplicated commercial effects;
- corrections create new events rather than rewriting history.

# 19.19 Reward Boundary Testing

Special attention shall be given to quantities crossing reward thresholds.

Example:

- cycle progress is 8 of 10;
- verified quantity is 5.

Tests shall confirm:

- 2 units complete the cycle;
- one reward is created;
- remaining 3 units are retained;
- no units are lost;
- no second active cycle violates MVP policy;
- pending units are allocated after redemption;
- retries produce the same result.

# 19.20 Offline Testing

Offline tests shall cover:

- staff records a purchase while offline;
- pending item remains local;
- customer cannot see it yet;
- connectivity returns;
- item synchronizes once;
- server validates current membership, program and subscription;
- successful item becomes visible;
- failed item remains reviewable.

Additional cases include:

- membership suspended before synchronization;
- Reward Program paused;
- subscription expired;
- customer code invalid;
- duplicate local retry;
- sign-out with queued records;
- application update with pending queue.

# 19.21 PWA Testing

PWA testing shall include:

- installation eligibility;
- manifest validation;
- icons;
- standalone mode;
- offline application shell;
- service-worker updates;
- cache invalidation;
- safe update prompt;
- recovery after failed update;
- browser-only use;
- installation dismissal behavior.

Testing shall cover supported Android, iOS and desktop browsers where behavior differs.

# 19.22 QR Testing

QR tests shall include:

- QR generation;
- valid scan;
- invalid QR;
- expired or unsupported reference;
- manual code fallback;
- denied camera permission;
- low-light conditions;
- camera unavailable;
- slow device;
- repeated scan;
- public identifier privacy.

A QR code shall never authenticate the customer.

# 19.23 Authentication Testing

Authentication tests shall cover:

- phone OTP success;
- invalid OTP;
- expired OTP;
- repeated OTP requests;
- email authentication;
- linked providers;
- duplicate-account prevention;
- account recovery;
- lost phone number;
- revoked session;
- suspended account;
- role-context retrieval.

Administrator authentication shall include MFA and recent-authentication testing.

# 19.24 Authorization Testing

Authorization tests shall validate:

- every major role;
- custom permission sets;
- owner-only actions;
- manager delegation;
- staff restrictions;
- cross-business denial;
- customer ownership;
- platform administrator scopes;
- emergency access expiry;
- service identity scopes.

Client-side hidden controls shall never be considered sufficient evidence.

# 19.25 Localization Testing

All launch-critical workflows shall be tested in:

- English;
- French.

Testing shall cover:

- complete translation-key coverage;
- missing-key fallback;
- longer French copy;
- truncation;
- line wrapping;
- date formatting;
- number formatting;
- currencies;
- pluralization;
- customer and business terminology;
- notifications;
- emails;
- SMS where applicable;
- server error localization.

# 19.26 Future Language Readiness Testing

Kirundi, Swahili and Kinyarwanda readiness shall be tested through placeholder or sample translation packs to confirm:

- no hardcoded English dependencies;
- language switching;
- translation loading;
- search metadata support;
- notification rendering;
- locale formatting.

Complete linguistic review may occur later, but technical readiness shall be proven.

# 19.27 Terminology Testing

QA shall verify that customer-facing interfaces do not expose terms such as:

- engine;
- ledger;
- lifecycle;
- reward token;
- state transition;
- immutable;
- domain event.

Approved everyday-language equivalents shall be used.

# 19.28 Accessibility Testing

Accessibility validation shall include:

- keyboard navigation;
- visible focus;
- screen-reader announcements;
- form label association;
- error summary behavior;
- dialog focus trapping;
- contrast;
- text enlargement;
- touch targets;
- reduced motion;
- color-independent meaning;
- logical reading order.

Automated scanning shall be combined with manual testing.

# 19.29 Grandmother-Test Review

Critical customer journeys shall undergo a plain-language usability review.

Reviewers shall confirm that a first-time smartphone user can understand:

- registration;
- loyalty-number display;
- QR use;
- Waiting for You;
- verification;
- progress;
- reward availability;
- On Us Moment use;
- error recovery.

This is a product-quality gate, not merely a copy review.

# 19.30 Performance Testing

Performance testing shall cover:

- application launch;
- customer dashboard;
- business dashboard;
- customer lookup;
- Purchase Record creation;
- verification;
- reward redemption;
- taxonomy loading;
- search;
- reporting projections;
- notification processing.

Testing should include representative lower-cost smartphones and slower network conditions.

# 19.31 Load Testing

Load testing shall focus on server workflows that may experience concurrency or spikes.

Examples:

- OTP requests;
- business purchase recording;
- customer verification;
- reward redemption;
- notification reminders;
- subscription callbacks;
- reporting projection consumers;
- search indexing.

Load tests shall validate both performance and cost behavior.

# 19.32 Cost Validation

Pre-release testing should estimate:

- Firestore reads per customer dashboard;
- Firestore writes per purchase lifecycle;
- Trust Event writes;
- notification attempts;
- reporting projection writes;
- search index operations;
- function invocations.

A feature that is functionally correct but creates unbounded cost shall not be considered production-ready.

# 19.33 Payment Provider Testing

Each provider adapter shall be tested for:

- payment initiation;
- pending response;
- successful callback;
- failed payment;
- timed-out payment;
- duplicate callback;
- invalid signature;
- callback replay;
- mismatched amount;
- mismatched currency;
- refund;
- reversal;
- provider outage;
- fallback provider where configured.

Provider sandbox testing shall be completed before production enablement.

# 19.34 Subscription Testing

Testing shall validate:

- plan selection;
- pricing resolution;
- trial activation;
- trial expiry;
- active subscription;
- entitlement limits;
- upgrade;
- downgrade restrictions;
- grace period;
- suspension;
- customer-data preservation;
- reactivation;
- cancellation;
- complimentary plan;
- invoice and receipt generation.

# 19.35 Notification Testing

Testing shall cover:

- intent creation;
- template resolution;
- language resolution;
- channel selection;
- preferences;
- marketing consent;
- quiet hours;
- retries;
- duplicate suppression;
- delivery failure;
- deep links;
- obsolete-message suppression.

Messages shall be reviewed in each supported channel, not only as raw text.

# 19.36 Search Testing

Search testing shall include:

- exact business name;
- categories;
- products;
- services;
- tags;
- English and French synonyms;
- misspellings;
- regional terminology;
- mixed-language queries;
- zero-result queries;
- filters;
- published-status enforcement;
- location;
- rate limiting;
- index update and rebuild.

# 19.37 Knowledge Studio Testing

Knowledge Studio tests shall cover:

- draft creation;
- duplicate detection;
- parent-child validation;
- translation workflow;
- approval;
- publication;
- replacement;
- retirement;
- search-index synchronization;
- bulk import;
- partial failure;
- historical-reference preservation.

# 19.38 Rules Studio Testing

Rules Studio tests shall cover:

- valid and invalid rule values;
- scope permissions;
- precedence;
- prohibited overrides;
- simulation;
- impact analysis;
- approval;
- scheduling;
- activation;
- cache invalidation;
- suspension;
- rollback;
- historical version references.

# 19.39 Reporting Testing

Reports shall be tested for:

- metric formulas;
- denominators;
- timezones;
- dimensions;
- data freshness;
- idempotent projection updates;
- reconciliation;
- rebuild;
- cross-business isolation;
- exports;
- estimated-liability labeling;
- duplicate-event protection.

No dashboard metric shall be approved without a Metric Catalogue reference.

# 19.40 Migration Testing

Every schema or data migration shall be tested using:

- representative data;
- dry-run mode;
- invalid records;
- partial completion;
- resume behavior;
- duplicate execution;
- verification report;
- rollback or compensating process.

Migration tests shall confirm that:

- historical references remain valid;
- IDs remain stable where required;
- no commercial history is lost;
- Trust Events remain interpretable.

# 19.41 Backup and Restore Testing

Backups are not considered reliable until restoration is proven.

Testing shall include:

- Firestore restore;
- Commerce Knowledge restore;
- Rules Studio restore;
- Storage restore;
- configuration restore;
- partial resource recovery;
- permissions after restore;
- data-integrity verification.

A restore exercise shall occur before launch and periodically thereafter.

# 19.42 Environment Strategy

Testing shall occur across isolated environments.

## Local

Used for rapid development with Firebase emulators.

## Development

Used for shared engineering integration.

## Staging

Used for release-candidate testing and user acceptance.

## Production

Used only for controlled production verification.

Each environment shall have:

- separate Firebase resources;
- separate provider credentials;
- separate data;
- separate feature-flag configuration;
- separate analytics.

# 19.43 Staging Requirements

Staging shall mirror production in:

- Firebase services;
- regions where practical;
- authentication structure;
- Security Rules;
- Functions;
- indexes;
- Storage rules;
- PWA configuration;
- integration adapters using sandbox providers;
- release process.

Staging may use smaller capacity but shall not use a fundamentally different architecture.

# 19.44 Test Data Strategy

Test data shall support:

- customers;
- businesses;
- owners;
- managers;
- staff;
- suspended users;
- multiple countries;
- multiple languages;
- Reward Programs;
- Purchase Records in every state;
- Loyalty Cycles near boundaries;
- rewards in each state;
- subscription states;
- disputes;
- Trust reviews;
- knowledge entries;
- rule versions.

Seed data shall be deterministic and version-controlled.

# 19.45 Test Accounts

Standard test accounts should exist for:

- customer only;
- owner;
- manager;
- staff;
- multi-business user;
- suspended staff;
- platform administrator;
- Knowledge Editor;
- Rules Author;
- Support Agent.

Credentials shall be environment-specific and securely managed.

# 19.46 Production Data Restriction

Production data shall not be copied into development or staging without:

- explicit authorization;
- data minimization;
- anonymization;
- removal of authentication credentials;
- documented purpose;
- controlled retention.

Synthetic or generated data is preferred.

# 19.47 Automated Test Pipeline

The continuous-integration pipeline shall run relevant tests such as:

- formatting and static analysis;
- TypeScript compilation;
- unit tests;
- component tests;
- domain service tests;
- security-rule tests;
- emulator integration tests;
- event and API contract tests;
- build validation;
- translation completeness;
- selected end-to-end smoke tests.

A failing mandatory test shall block merge or release.

# 19.48 Pull Request Quality Gate

Every code change shall provide:

- task or requirement reference;
- affected domain;
- code summary;
- tests added or updated;
- migration impact;
- security impact;
- localization impact;
- screenshots where UI changes;
- rollback notes where material.

Reviewers shall verify that unrelated files were not modified unnecessarily.

# 19.49 Definition of Done

A feature is complete only when:

- requirements are implemented;
- code follows domain architecture;
- automated tests pass;
- error states exist;
- loading and empty states exist;
- permissions are enforced;
- English and French copy is complete where required;
- accessibility is reviewed;
- analytics are defined where needed;
- documentation is updated;
- migrations are provided where needed;
- release notes are prepared.

Passing compilation alone does not mean completion.

# 19.50 Defect Severity

Defects shall be classified consistently.

## Severity 0 - Critical Incident

Examples:

- unauthorized data exposure;
- duplicate reward redemption;
- incorrect reward creation at scale;
- production data corruption;
- confirmed account takeover;
- platform outage.

Requires immediate response.

## Severity 1 - Release Blocker

Examples:

- customer verification broken;
- Purchase Record creation unavailable;
- incorrect progress;
- payment activation failure;
- French launch-critical flow missing;
- security-rule bypass.

Blocks release.

## Severity 2 - Major

Examples:

- important workflow degraded;
- incorrect report;
- offline sync failure with workaround;
- role-context error without data exposure.

Normally fixed before release unless formally accepted.

## Severity 3 - Moderate

Examples:

- non-critical usability issue;
- isolated layout defect;
- minor reporting delay.

May be scheduled after release.

## Severity 4 - Minor

Examples:

- cosmetic defect;
- wording refinement;
- low-impact inconsistency.

Does not normally block release.

# 19.51 Release Candidate

A release candidate shall include:

- version identifier;
- commit reference;
- environment configuration;
- migration set;
- function versions;
- Security Rules;
- indexes;
- translation bundle;
- feature flags;
- test report;
- known issues;
- rollback plan.

Release candidates shall be immutable.

Any code change creates a new candidate.

# 19.52 Release Gates

Production release shall require successful completion of applicable gates.

## Gate 1 - Code Quality

- compilation;
- linting;
- tests;
- dependency checks.

## Gate 2 - Architecture

- domain boundaries;
- no unauthorized direct writes;
- no duplicated business logic;
- review of significant architecture changes.

## Gate 3 - Security

- security-rule tests;
- authorization tests;
- secret validation;
- App Check readiness;
- security review for high-risk features.

## Gate 4 - User Experience

- responsive behavior;
- accessibility;
- English and French;
- errors;
- loading;
- empty states.

## Gate 5 - Operations

- monitoring;
- alerts;
- rollback;
- migration;
- support notes;
- runbooks.

## Gate 6 - Business Validation

- acceptance criteria;
- UAT;
- pilot feedback where applicable;
- product-owner approval.

# 19.53 User Acceptance Testing

UAT shall use realistic role-based scenarios.

Participants may include:

- business owners;
- frontline staff;
- customers;
- platform operations;
- support staff.

UAT shall evaluate:

- correctness;
- clarity;
- speed;
- language;
- trust;
- ease of use;
- operational practicality.

Feedback shall be classified as:

- defect;
- usability improvement;
- scope change;
- training need;
- future feature.

# 19.54 Pilot Validation

The Burundi pilot shall test both technology and product assumptions.

Pilot metrics should include:

- registration completion;
- business onboarding time;
- Purchase Record creation time;
- customer verification rate;
- average verification delay;
- rejection and dispute rate;
- offline sync success;
- reward understanding;
- reward redemption;
- support volume;
- French-language comprehension;
- staff workflow acceptance.

Pilot findings shall inform controlled changes before wider rollout.

# 19.55 Pilot Cohort Controls

Pilot access should use feature flags or approved business cohorts.

The platform shall record:

- pilot businesses;
- pilot customers;
- enabled features;
- active configuration;
- pilot period;
- known limitations.

Pilot-only logic shall not be hardcoded into permanent domain services.

# 19.56 Regression Suite

A permanent regression suite shall cover the core customer-verified loyalty journey.

Minimum required flow:

- customer registration;
- business registration;
- Reward Program activation;
- staff invitation;
- Purchase Record creation;
- customer verification;
- Verified Unit issuance;
- Loyalty Cycle update;
- reward availability;
- reward redemption;
- On Us Moment history;
- next Loyalty Cycle creation.

This suite shall run before every production release.

# 19.57 Production Smoke Testing

After deployment, a controlled smoke test shall confirm:

- application loads;
- authentication works;
- customer and business shells load;
- functions respond;
- Firestore rules operate;
- Purchase Record test flow works in approved non-commercial test data;
- notification pipeline works;
- monitoring is receiving data;
- no critical error spike appears.

Production smoke testing shall not create misleading real customer loyalty records.

# 19.58 Post-Deployment Monitoring

The release team shall monitor:

- error rate;
- function latency;
- Firestore failures;
- authentication failures;
- sync failures;
- event backlog;
- dead-letter queue;
- payment callback errors;
- notification failures;
- customer support reports;
- unusual cost changes.

A release shall not be considered complete until post-deployment validation passes.

# 19.59 Rollback Criteria

Rollback should be initiated or considered when:

- critical security failure exists;
- customer progress becomes incorrect;
- duplicate rewards or redemptions occur;
- Purchase Record processing is materially broken;
- payment activation is unreliable;
- migration corrupts or strands data;
- error rate exceeds approved threshold;
- release cannot be safely corrected through a narrow forward fix.

Rollback thresholds shall be documented per release.

# 19.60 Rollback Strategy

Rollback may involve:

- frontend version rollback;
- Cloud Function rollback;
- Security Rules rollback;
- feature-flag disablement;
- rule suspension;
- integration pause;
- migration rollback or compensating repair.

Data writes performed under the new version must be assessed before code rollback.

Rollback shall not blindly restore code while leaving incompatible data behind.

# 19.61 Forward Fix Versus Rollback

A forward fix may be preferable when:

- data schema is already migrated;
- the defect is isolated;
- rollback would create greater risk;
- the fix is small and testable.

The decision shall consider:

- customer impact;
- data integrity;
- security;
- time to restore;
- reversibility.

# 19.62 Known-Issue Governance

A release may contain known non-blocking issues only when:

- severity is assessed;
- workaround exists where needed;
- owner is assigned;
- target resolution is documented;
- customer impact is understood;
- release approver accepts the risk.

Severity 0 and Severity 1 issues shall not be accepted for release.

# 19.63 Quality Reporting

Every release shall produce a quality report containing:

- release candidate;
- test summary;
- tests passed and failed;
- manual validation completed;
- security review;
- localization coverage;
- accessibility status;
- performance results;
- migration status;
- known issues;
- risks;
- rollback plan;
- approvals.

# 19.64 Quality Ownership

Quality is shared.

## Engineers

Own:

- code correctness;
- automated tests;
- technical documentation;
- observability.

## Product

Owns:

- acceptance criteria;
- business-rule validation;
- scope decisions;
- UAT.

## Design

Owns:

- usability;
- accessibility;
- language consistency;
- interaction quality.

## Operations

Owns:

- support readiness;
- monitoring;
- incident and rollback preparedness.

## Platform Governance

Owns:

- standards compliance;
- Knowledge and Rules publication controls;
- high-risk approval.

# 19.65 Functional Requirements

## FR-QA-001

Critical business rules shall have automated test coverage.

## FR-QA-002

Customer verification, Verified Unit issuance and reward redemption shall be tested end to end.

## FR-QA-003

Security Rules shall have automated allow-and-deny tests.

## FR-QA-004

Sensitive workflows shall have idempotency and concurrency tests.

## FR-QA-005

All launch-critical journeys shall be tested in English and French.

## FR-QA-006

Accessibility testing shall include automated and manual review.

## FR-QA-007

Offline Purchase Record queueing and synchronization shall be tested under failure conditions.

## FR-QA-008

Each external provider adapter shall pass sandbox and failure-path testing.

## FR-QA-009

Every migration shall support dry-run and verification.

## FR-QA-010

Backups shall be validated through restoration testing.

## FR-QA-011

Test environments shall remain isolated from production.

## FR-QA-012

Production data shall not be used in tests without approved anonymization.

## FR-QA-013

Every confirmed critical defect shall receive a regression test where practical.

## FR-QA-014

Production releases shall pass defined release gates.

## FR-QA-015

Every production release shall have a rollback or compensating plan.

## FR-QA-016

Release candidates shall be immutable and uniquely identified.

## FR-QA-017

Production smoke and post-deployment monitoring shall be completed.

## FR-QA-018

Known release issues shall be classified, assigned and approved.

## FR-QA-019

A release quality report shall be retained.

## FR-QA-020

Quality acceptance shall cover functionality, security, language, accessibility, performance and operations.

# 19.66 Quality Rules

| Rule ID | Rule                                                                                    |
| ------- | --------------------------------------------------------------------------------------- |
| QR-001  | Compilation success alone does not prove feature completion.                            |
| QR-002  | Critical commercial rules require automated tests.                                      |
| QR-003  | Failure paths shall be tested, not assumed.                                             |
| QR-004  | Security-rule changes require matching automated tests.                                 |
| QR-005  | Duplicate command and event delivery shall not duplicate commercial outcomes.           |
| QR-006  | English and French are mandatory quality dimensions for launch-critical features.       |
| QR-007  | Accessibility defects may block release where they prevent core use.                    |
| QR-008  | Production data shall not be casually reused in non-production environments.            |
| QR-009  | Migrations shall be dry-run, resumable and verifiable.                                  |
| QR-010  | Backup success is not proven until restore succeeds.                                    |
| QR-011  | Every production release requires documented evidence.                                  |
| QR-012  | Severity 0 and Severity 1 defects block release.                                        |
| QR-013  | Pilot-only behavior shall use governed configuration rather than permanent code forks.  |
| QR-014  | Rollback decisions shall consider both code and data compatibility.                     |
| QR-015  | Confirmed critical regressions shall be permanently protected by tests where practical. |

# 19.67 Acceptance Criteria

This chapter is approved when:

- A complete testing hierarchy is established.
- Critical domain, security, event and state-transition tests are required.
- Idempotency and concurrency testing covers duplicate commercial actions.
- English, French, accessibility and plain-language testing are included.
- Offline, PWA, QR and synchronization tests are defined.
- Provider, subscription, search, reporting, Knowledge Studio and Rules Studio testing are covered.
- Test environments, seed data and production-data restrictions are clear.
- Release gates and defect severity levels are established.
- Pilot, regression and production-validation requirements are documented.
- Rollback criteria include code, data, configuration and rules.
- Every release requires a retained quality report.

# 19.68 Next Chapter

The next chapter should define:

# Deployment, Observability, Backup and Operational Resilience Architecture

It will cover:

- Firebase project environments;
- CI/CD;
- deployment permissions;
- staged releases;
- configuration management;
- secret management;
- infrastructure as code;
- logging;
- metrics;
- tracing;
- alerts;
- uptime;
- incident response;
- maintenance mode;
- backups;
- disaster recovery;
- recovery targets;
- production support;
- cost monitoring;
- capacity planning;
- regional expansion readiness.