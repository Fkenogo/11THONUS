> **Title:** TRD Chapter 20 — Deployment, Observability, Backup and Resilience  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/20-deployment-and-operational-resilience.md`  
> **Last controlled update:** 2026-07-16 (Phase 4 — §20.75 rule table OP-001..018 renamed to OR-001..018 per DEC-GOV-006; no wording changed)

# 11thONUS

# Technical Requirements Document

## PART XIII - Deployment and Operational Resilience

# Chapter 20: Deployment, Observability, Backup and Operational Resilience Architecture

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-19

# 20.1 Purpose

This chapter defines how 11thONUS shall be deployed, monitored, supported, backed up and recovered.

It establishes:

- Firebase project environments;
- deployment architecture;
- CI/CD;
- deployment permissions;
- configuration management;
- secret management;
- staged releases;
- observability;
- logs, metrics and traces;
- alerting;
- uptime objectives;
- incident management;
- maintenance mode;
- backup;
- disaster recovery;
- recovery objectives;
- production support;
- cost monitoring;
- capacity planning;
- regional expansion readiness.

Operational resilience means the platform can:

- detect problems;
- limit their impact;
- continue essential operations where safe;
- recover predictably;
- explain what happened;
- prevent recurrence.

# 20.2 Operational Objectives

The operational architecture shall ensure that:

- Development, staging and production remain isolated.
- Production deployments are controlled and auditable.
- Infrastructure and configuration changes are versioned.
- Secrets never enter source control or frontend bundles.
- Critical workflows are observable end to end.
- Operational failures generate actionable alerts.
- Customer progress and rewards remain recoverable.
- Knowledge Studio and Rules Studio data receive dedicated protection.
- Backups are tested through restoration.
- Incidents follow documented response procedures.
- Releases can be rolled back or safely corrected.
- Platform growth across countries does not require unmanaged infrastructure forks.
- Cost and capacity are monitored before they become operational problems.

# 20.3 Operational Principles

## ORP-001 - Production Is Controlled

Production changes shall occur only through approved deployment and administrative workflows.

## ORP-002 - Detect Before Customers Report

The platform should identify critical failures through monitoring and alerts before they become widespread customer complaints.

## ORP-003 - Every Failure Must Be Explainable

Logs, correlation IDs, events and audit records shall allow the platform to reconstruct important failures.

## ORP-004 - Backups Must Be Restorable

A backup that has never been restored successfully is not considered proven.

## ORP-005 - Automate Repeatable Operations

Deployments, backups, health checks, migrations and recovery verification should be automated wherever practical.

## ORP-006 - Configuration Is Production State

Rules, feature flags, translations, taxonomy, secrets and environment variables require the same discipline as source code.

## ORP-007 - Fail Safely

Where uncertainty exists, the platform should protect data integrity and trust rather than pretend success.

## ORP-008 - Recovery Is Designed in Advance

Recovery procedures shall be documented and tested before a serious incident occurs.

## ORP-009 - Cost Is an Operational Metric

Uncontrolled cloud cost is an operational failure.

## ORP-010 - Regional Expansion Uses Shared Standards

New countries shall extend approved platform configuration and infrastructure patterns rather than create unmanaged code or environment forks.

# 20.4 Environment Architecture

11thONUS shall maintain at least four isolated environments.

Local  
↓  
Development  
↓  
Staging  
↓  
Production

## Local

Used for individual development with Firebase Emulator Suite.

## Development

Used for shared engineering integration and early testing.

## Staging

Used for release candidates, user acceptance testing, provider sandboxes and production-like validation.

## Production

Used for live businesses and customers.

Production shall not be used as a general testing environment.

# 20.5 Firebase Project Isolation

Each shared environment shall use a separate Firebase or Google Cloud project.

Each project shall maintain separate:

- Authentication users;
- Firestore database;
- Cloud Storage bucket;
- Cloud Functions;
- Hosting;
- App Check configuration;
- Remote Config;
- Analytics configuration;
- Cloud Messaging configuration;
- secrets;
- service accounts;
- logs;
- billing monitoring.

Environment separation shall not depend only on naming conventions inside one database.

# 20.6 Environment Naming

Environment identifiers shall be consistent.

Recommended identifiers:

- local
- dev
- staging
- prod

Resource naming should include:

- platform;
- environment;
- region;
- service where appropriate.

Example:

11thonus-prod-africa-functions  
11thonus-staging-firestore

The final naming convention shall be documented in the Engineering Standards.

# 20.7 Environment Configuration

Environment-specific configuration may include:

- Firebase project identifiers;
- public frontend configuration;
- API base URLs;
- App Check keys;
- supported countries;
- enabled languages;
- provider sandbox or production mode;
- monitoring settings;
- feature defaults.

Configuration shall be validated during build and deployment.

Missing required production configuration shall block deployment.

# 20.8 Configuration Classification

Configuration shall be classified as:

## Public Client Configuration

Safe for frontend delivery.

Examples:

- Firebase web app configuration;
- supported languages;
- public environment identifier.

## Server Configuration

Accessible only to trusted server processes.

Examples:

- provider routing;
- system limits;
- internal service endpoints.

## Secrets

Sensitive credentials.

Examples:

- provider API keys;
- webhook signing secrets;
- email credentials;
- service-account keys.

## Governed Runtime Configuration

Managed through Rules Studio or approved feature-flag systems.

Examples:

- verification reminders;
- plan limits;
- country activation;
- pilot cohorts.

These categories shall not be mixed.

# 20.9 Source Control

Source control shall contain:

- application code;
- Cloud Functions;
- Firestore Security Rules;
- Storage Rules;
- Firestore index definitions;
- deployment configuration templates;
- migration scripts;
- test seeds;
- infrastructure definitions;
- documentation;
- translation source files where applicable.

Source control shall not contain:

- production secrets;
- private provider credentials;
- downloaded production data;
- uncontrolled environment files;
- personal administrator credentials.

# 20.10 Branching and Change Control

The engineering team shall use a documented branching and review strategy.

At minimum:

- production-bound changes require reviewed pull requests;
- direct commits to the protected production branch are prohibited;
- required tests must pass;
- material architecture changes require explicit review;
- release branches or immutable release tags shall identify production versions.

The exact Git workflow may evolve without changing these controls.

# 20.11 Continuous Integration

The CI pipeline shall validate:

- dependency installation;
- formatting;
- static analysis;
- TypeScript compilation;
- unit tests;
- component tests;
- domain service tests;
- Firestore and Storage Rules tests;
- Firebase emulator integration tests;
- event and API contracts;
- translation completeness;
- production build;
- dependency and security checks;
- infrastructure validation;
- migration validation where relevant.

Mandatory failures shall block merging or release.

# 20.12 Continuous Delivery

The deployment pipeline should support:

Approved Code  
↓  
Automated Validation  
↓  
Development Deployment  
↓  
Staging Deployment  
↓  
Release Validation  
↓  
Production Approval  
↓  
Production Deployment  
↓  
Post-Deployment Verification

Production deployment shall require an explicit approval step.

The MVP should not use uncontrolled automatic production deployment after every merge.

# 20.13 Deployment Permissions

Deployment permissions shall follow least privilege.

Suggested separation:

- developers may deploy to development;
- designated release engineers may deploy to staging;
- production deployment requires approved production role;
- security-rule deployment requires additional review;
- secret management requires restricted permissions;
- billing and IAM changes require platform administrators.

Personal owner accounts should not be used for automated deployment.

# 20.14 Service Accounts

CI/CD shall use dedicated service identities.

Each deployment service account shall have:

- environment scope;
- minimum required permissions;
- credential-rotation policy;
- audit logging;
- named owner;
- suspension process.

A staging deployment identity shall not deploy to production.

# 20.15 Infrastructure as Code

Infrastructure configuration should be represented as code wherever supported.

This includes:

- Firebase project linkage;
- Functions configuration;
- Hosting targets;
- Security Rules;
- Firestore indexes;
- scheduled jobs;
- Pub/Sub topics where introduced;
- Cloud Tasks queues;
- service accounts and IAM where practical;
- monitoring alerts;
- backup schedules.

Manual console configuration shall be minimized and documented where unavoidable.

# 20.16 Deployment Artifacts

Each production release shall identify:

- release version;
- source commit;
- frontend build;
- Cloud Function versions;
- Firestore Rules version;
- Storage Rules version;
- index configuration;
- migration set;
- translation bundle;
- active feature flags;
- active rule versions where material;
- deployment time;
- deployer;
- approval;
- rollback reference.

This record forms the production release manifest.

# 20.17 Staged Deployment

Where supported, changes should be rolled out progressively.

Potential strategies include:

- internal users first;
- pilot businesses;
- one country;
- percentage-based feature flag;
- selected business cohort;
- selected application shell;
- function traffic splitting where supported.

Staged rollout shall not create inconsistent commercial rules for users who share the same required policy unless explicitly designed.

# 20.18 Feature Flags in Deployment

Feature flags may control the visibility or availability of new features.

They shall not replace:

- database migrations;
- security controls;
- authorization;
- permanent entitlements;
- business-rule versioning.

A disabled feature shall leave stored data in a valid state.

# 20.19 Backward Compatibility

Rolling deployments may temporarily run old and new clients or server versions together.

Changes shall therefore consider compatibility across:

- command versions;
- event versions;
- document schema versions;
- frontend clients;
- Cloud Functions;
- reporting consumers;
- search indexes.

Breaking changes require a controlled migration or versioned interface.

# 20.20 Database Migration Deployment

A migration deployment shall separate:

- code capable of reading old and new data;
- data migration;
- verification;
- removal of legacy behavior.

Where possible, migrations should use an expand-and-contract approach.

The platform shall not deploy code that assumes migration completion before the migration has been verified.

# 20.21 Rollback Readiness

Before production deployment, the team shall know:

- how to roll back the frontend;
- how to roll back Functions;
- how to restore Security Rules;
- how to disable the feature;
- whether data changes are backward-compatible;
- what compensating repair is required;
- what customer communication may be necessary.

Rollback shall not be improvised during an incident.

# 20.22 Observability Architecture

Observability shall combine:

- logs;
- metrics;
- traces or correlation paths;
- health checks;
- alerts;
- dashboards;
- audit records;
- Trust Events.

The objective is to understand both:

- technical system health; and
- business workflow health.

# 20.23 Structured Logging

All trusted server services shall use structured logs.

Standard log fields should include:

type OperationalLog = {  
timestamp: string;  
environment: string;  
severity: "debug" | "info" | "warning" | "error" | "critical";  
domain: string;  
service: string;  
operation: string;  
correlationId: string;  
commandId?: string;  
eventId?: string;  
actorId?: string;  
businessId?: string;  
customerId?: string;  
aggregateType?: string;  
aggregateId?: string;  
result?: string;  
durationMs?: number;  
errorCode?: string;  
};

Sensitive information shall be excluded or masked.

# 20.24 Log Severity

## Debug

Detailed development information.

Disabled or tightly limited in production.

## Info

Normal operational activity.

## Warning

Unexpected condition that did not cause immediate failure.

## Error

Operation failed or requires intervention.

## Critical

Severe security, integrity or availability event.

Severity standards shall remain consistent across domains.

# 20.25 Log Retention

Log retention shall depend on:

- security value;
- operational need;
- cost;
- regulatory obligations;
- privacy.

High-volume diagnostic logs may have shorter retention than:

- security logs;
- administrator audit records;
- critical incident records.

Retention shall be governed and documented.

# 20.26 Correlation IDs

Every significant workflow shall use a correlation ID.

Example:

Purchase verification request  
↓  
Verified Unit issuance  
↓  
Loyalty Cycle update  
↓  
Reward creation  
↓  
Notification  
↓  
Reporting projection

All related logs and events should share the same correlation ID.

This enables end-to-end troubleshooting.

# 20.27 Technical Metrics

The platform shall monitor:

- frontend error rate;
- page-load performance;
- callable-function latency;
- function success and failure rates;
- Firestore read and write volume;
- Firestore contention;
- Storage upload failures;
- authentication failures;
- App Check rejection rate;
- notification-delivery success;
- provider latency;
- event backlog;
- dead-letter volume;
- scheduled-job failures;
- search-index delay;
- reporting-projection delay;
- backup status.

# 20.28 Business Workflow Metrics

Operational monitoring shall also include:

- Purchase Records created;
- customer verification processing failures;
- Verified Unit issuance failures;
- duplicate active-cycle detection;
- reward-creation failures;
- redemption failures;
- payment confirmation failures;
- subscription activation delay;
- missing Trust Events;
- stuck offline synchronization;
- unresolved high-severity reviews.

These metrics indicate platform integrity, not business performance.

# 20.29 Service-Level Indicators

The platform shall define Service-Level Indicators for critical journeys.

Examples:

## Purchase Recording Success Rate

Percentage of valid requests successfully accepted.

## Verification Processing Success Rate

Percentage of valid customer verification commands completed successfully.

## Reward Redemption Success Rate

Percentage of valid redemption attempts completed without technical failure.

## Payment Confirmation Processing Time

Duration from valid callback receipt to subscription update.

## Notification Processing Delay

Duration from notification intent to provider submission.

# 20.30 Service-Level Objectives

Initial internal targets may include:

- core API availability of at least 99.5% during the MVP;
- successful valid Purchase Record processing above 99%;
- successful valid verification processing above 99%;
- reward availability processing generally within 3 seconds;
- critical notification intent creation within 1 minute;
- payment callback processing generally within 1 minute.

Targets should be reviewed after pilot data becomes available.

Internal objectives are not automatically public contractual guarantees.

# 20.31 Health Checks

Each critical domain or service should expose measurable health.

Potential health states:

- Healthy;
- Degraded;
- Unavailable;
- Unknown.

Health checks may cover:

- Firestore connectivity;
- Functions availability;
- notification provider;
- payment provider;
- search provider;
- event backlog;
- Rules Service;
- Knowledge Service.

A health check shall not perform destructive or expensive work.

# 20.32 Monitoring Dashboards

Operational dashboards should include:

## Platform Overview

- availability;
- error rate;
- latency;
- active incidents;
- release version.

## Core Loyalty Workflows

- Purchase Record failures;
- verification failures;
- reward creation;
- redemption failures;
- event backlog.

## Integrations

- payment providers;
- SMS;
- email;
- push;
- webhook health.

## Data Integrity

- duplicate cycles;
- missing events;
- projection mismatches;
- failed migrations.

## Cost

- Firestore reads and writes;
- Function invocations;
- Storage;
- notifications;
- search service;
- country-level usage.

# 20.33 Alerting Principles

Alerts shall be:

- actionable;
- assigned;
- severity-based;
- deduplicated;
- rate-limited;
- linked to runbooks where possible.

The platform should avoid alert fatigue.

Not every logged error requires an urgent notification.

# 20.34 Alert Severity

## Informational

No immediate action required.

## Warning

Requires review during normal operations.

## High

Material service degradation or business workflow risk.

Requires prompt response.

## Critical

Security, data-integrity or major availability incident.

Requires immediate response.

# 20.35 Critical Alerts

Critical alerts should include:

- unauthorized data-access evidence;
- customer progress corruption;
- duplicate reward redemption;
- widespread verification failure;
- payment confirmation corruption;
- missing Trust Event generation for critical actions;
- production database unavailability;
- administrator-account compromise;
- failed backup beyond tolerated window;
- uncontrolled cost spike;
- production secret exposure.

# 20.36 On-Call and Ownership

Every production alert shall have an accountable owner.

At minimum, ownership should be assigned by area:

- application;
- infrastructure;
- security;
- billing;
- integrations;
- data;
- support.

The operational model may begin with a small team, but responsibilities must remain explicit.

# 20.37 Incident Management

An incident is an unplanned event that materially affects:

- availability;
- security;
- data integrity;
- customer trust;
- business operations;
- billing;
- regulatory compliance.

Incidents shall follow a documented lifecycle.

Detected  
↓  
Acknowledged  
↓  
Assessed  
↓  
Contained  
↓  
Resolved  
↓  
Recovered  
↓  
Reviewed

# 20.38 Incident Roles

During a material incident, assign:

## Incident Lead

Coordinates response and decisions.

## Technical Lead

Investigates and restores systems.

## Communications Lead

Coordinates business and customer communication.

## Recorder

Maintains timeline, actions and evidence.

One person may hold multiple roles in a small team, but responsibilities shall remain clear.

# 20.39 Incident Priorities

Incident severity should align with Chapter 19 defect severity.

## Critical Incident

Examples:

- data exposure;
- corrupted loyalty progress;
- duplicate redemptions at scale;
- platform-wide outage;
- administrator compromise.

## High Incident

Examples:

- country-wide service degradation;
- payment processing failure;
- major notification outage;
- search unavailability affecting onboarding.

## Moderate Incident

Examples:

- isolated integration failure;
- delayed reports;
- partial language failure.

# 20.40 Incident Containment

Containment actions may include:

- disabling a feature flag;
- suspending a rule;
- pausing an integration;
- switching to fallback provider;
- enabling maintenance mode;
- revoking sessions;
- blocking a compromised account;
- pausing background jobs;
- stopping a migration.

Containment should preserve evidence.

# 20.41 Incident Communication

Communication shall be proportionate to impact.

Potential audiences:

- affected customers;
- affected businesses;
- all businesses;
- internal team;
- payment or messaging provider;
- regulators or legal advisers where required.

Messages should state:

- what is affected;
- what users should do;
- what is being protected;
- when the next update will be provided;
- where support is available.

Technical speculation shall not be presented as confirmed fact.

# 20.42 Status Communication

The platform should be ready to support:

- in-app service notices;
- business-dashboard banners;
- customer notices;
- email or SMS for serious incidents;
- future public status page.

Operational incidents should not rely only on social media communication.

# 20.43 Post-Incident Review

Material incidents shall receive a written review containing:

- incident summary;
- impact;
- detection;
- timeline;
- root cause;
- contributing factors;
- containment;
- recovery;
- customer and business communication;
- what worked;
- what failed;
- corrective actions;
- owners and deadlines;
- regression tests or monitoring added.

The objective is learning, not blame.

# 20.44 Maintenance Mode

Maintenance mode shall be configurable by scope.

Potential scopes:

- entire platform;
- country;
- customer application;
- business application;
- administration application;
- specific domain;
- specific integration;
- specific business cohort.

# 20.45 Maintenance Modes

## Informational Maintenance

Platform remains operational but displays a notice.

## Read-Only Maintenance

Reads permitted; selected writes blocked.

## Restricted Maintenance

Only essential actions permitted.

## Full Maintenance

Most user activity blocked except approved administrative recovery.

The selected mode shall define allowed actions explicitly.

# 20.46 Essential Actions During Maintenance

Depending on the incident, essential actions may include:

- sign-in;
- viewing customer code;
- viewing existing progress;
- viewing billing instructions;
- platform administration;
- support access.

Actions that could worsen integrity problems may be blocked.

The system shall not show false success for blocked operations.

# 20.47 Backup Architecture

Backups shall cover:

- Firestore;
- Cloud Storage;
- Knowledge Studio data;
- Rules Studio data;
- translations and Experience content;
- configuration;
- Security Rules;
- indexes;
- infrastructure definitions;
- billing documents;
- audit records;
- critical provider configuration references.

# 20.48 Firestore Backups

The platform shall support scheduled Firestore exports.

Backup frequency shall reflect:

- transaction volume;
- recovery objectives;
- cost;
- provider capability.

A reasonable starting point may include:

- daily full or managed backups;
- more frequent protection for critical configuration where supported;
- retained restore points according to policy.

Final frequency shall be validated before production.

# 20.49 Strategic Configuration Backups

Commerce Knowledge, Rules Studio and feature configuration are strategic platform assets.

They should support independent export in human-readable and machine-restorable formats.

Examples:

- JSON;
- CSV where appropriate;
- versioned configuration packages.

This provides recovery beyond general database backup.

# 20.50 Cloud Storage Backups

Storage backup policy shall cover:

- business logos;
- customer profile images;
- support attachments;
- billing documents;
- knowledge imagery;
- future evidence files.

Not all cached or regenerable media requires the same retention.

# 20.51 Backup Encryption and Access

Backups shall:

- use encrypted storage;
- be access-controlled;
- use separate service identities;
- avoid public exposure;
- record creation and deletion;
- follow environment separation;
- be protected from accidental production-user deletion where practical.

# 20.52 Backup Retention

Backup retention shall be tiered.

Potential categories:

## Short-Term Recovery

Recent restore points for operational mistakes.

## Medium-Term Recovery

Weekly or monthly restore points.

## Long-Term Archive

Selected records required for legal, audit or strategic purposes.

Retention periods shall align with privacy and legal requirements.

# 20.53 Restore Testing

Restore testing shall occur:

- before production launch;
- after major backup architecture changes;
- periodically during operation;
- after material schema changes where practical.

Testing shall verify:

- records restored;
- references remain valid;
- permissions remain correct;
- indexes are recreated;
- Functions can operate;
- Knowledge and Rules versions remain consistent;
- reporting projections can rebuild.

# 20.54 Disaster Recovery

A disaster is a severe event that causes major loss of availability, infrastructure or data integrity.

Potential scenarios include:

- Firebase project compromise;
- widespread accidental deletion;
- severe deployment failure;
- region-level service disruption;
- provider-account lockout;
- destructive migration;
- credential compromise;
- significant corrupted data.

The platform shall maintain a disaster-recovery plan.

# 20.55 Recovery Objectives

The platform shall define:

## Recovery Time Objective

Maximum targeted time to restore acceptable operation.

## Recovery Point Objective

Maximum targeted amount of data that may be lost.

Initial internal targets should be realistic for the MVP and reviewed as transaction volume grows.

Suggested starting targets:

- critical configuration RPO: no more than 24 hours, with stronger version history where available;
- operational Firestore RPO: no more than 24 hours initially;
- critical platform recovery target: within one business day for severe disaster;
- narrower incidents: significantly faster through rollback or forward fix.

These are initial internal goals, not final contractual commitments.

# 20.56 Recovery Priority

Recovery order should prioritize:

- security and administrator control;
- authentication;
- customer identity;
- business identity and membership;
- Purchase Records and Trust history;
- customer verification;
- loyalty progress;
- rewards and redemption;
- subscriptions and billing;
- notifications;
- reporting;
- search and secondary services.

The exact order may vary by incident.

# 20.57 Recovery Validation

Recovery is not complete until the platform verifies:

- authentication works;
- permissions are correct;
- authoritative data is consistent;
- no duplicate active cycles exist;
- rewards remain valid;
- event processing resumes safely;
- notifications do not duplicate;
- payment callbacks are idempotent;
- monitoring is active;
- customer and business applications load.

# 20.58 Data Reconstruction

Where projections are lost or corrupted, the platform should rebuild them from:

- authoritative domain records;
- Trust Events;
- event outboxes;
- versioned rules;
- Reward Program versions.

Derived reporting and search indexes should be reconstructable without manually recreating commercial history.

# 20.59 Production Support Model

Production support shall provide:

- issue intake;
- triage;
- investigation;
- escalation;
- resolution;
- customer or business communication;
- closure;
- trend analysis.

Support shall use the support-case architecture defined in Chapter 18.

# 20.60 Support Channels

Initial support channels may include:

- in-app support request;
- email;
- business support phone or WhatsApp where operationally appropriate;
- administrative case creation.

All significant cases should enter the governed support-case system.

# 20.61 Support Prioritization

Support priority shall consider:

- security;
- customer progress;
- reward redemption;
- payment;
- business operation;
- user count affected;
- workarounds;
- regulatory impact.

A cosmetic issue should not outrank a loyalty-integrity issue.

# 20.62 Support Diagnostics

Support staff should have controlled access to:

- account status;
- recent commands;
- correlation IDs;
- notification delivery;
- integration status;
- relevant audit history;
- support-safe timeline.

Support shall not require unrestricted production database access.

# 20.63 Cost Monitoring

The platform shall monitor costs across:

- Firestore reads;
- Firestore writes;
- storage;
- bandwidth;
- Cloud Functions;
- notification channels;
- search provider;
- analytics warehouse;
- backups;
- logging;
- provider fees.

Costs should be attributable where practical by:

- environment;
- country;
- business;
- domain;
- feature;
- provider.

# 20.64 Cost Alerts

Alerts should be configured for:

- unexpected daily increase;
- rapid Firestore-read growth;
- runaway function invocations;
- repeated retries;
- notification spikes;
- search-index surge;
- logging-volume growth;
- backup-cost anomalies;
- provider overbilling risk.

Cost alerts shall not automatically stop critical customer operations without a governed policy.

# 20.65 Cost Efficiency Reviews

Before and after launch, the team should review:

- reads per customer dashboard;
- writes per Purchase Record lifecycle;
- Trust Event volume;
- reporting-projection volume;
- notification-channel mix;
- cache effectiveness;
- search-index update frequency;
- log retention.

Optimization shall preserve correctness and auditability.

# 20.66 Capacity Planning

Capacity planning shall consider:

- businesses;
- customers;
- staff accounts;
- Purchase Records per day;
- verification rate;
- Verified Units;
- reward redemptions;
- notifications;
- search queries;
- reports;
- countries;
- provider limits.

Planning shall use measured usage rather than unsupported assumptions once pilot data exists.

# 20.67 Growth Thresholds

The platform should define thresholds that trigger architectural review.

Examples:

- Firestore contention on hot documents;
- event backlog beyond target;
- reporting projection delay;
- provider rate limit;
- search cost;
- notification volume;
- query latency;
- per-business high-volume usage.

Reaching a threshold should trigger evaluation, not emergency redesign.

# 20.68 Hotspot Prevention

Firestore design shall avoid hot documents.

Examples of unsafe patterns:

- one global mutable counter;
- one platform-wide daily document updated for every Purchase Record;
- one business counter receiving extreme concurrent writes.

Use:

- sharded counters where necessary;
- event-driven projections;
- partitioning;
- time-bucketed aggregates;
- asynchronous rollups.

# 20.69 Regional Expansion Readiness

Expansion to Rwanda, Uganda and Kenya shall use:

- shared codebase;
- shared domain models;
- country configuration;
- country pricing;
- provider adapters;
- localized taxonomy;
- language packs;
- regional feature flags;
- country-level monitoring.

The platform shall not create separate permanent code forks by country.

# 20.70 Regional Provider Isolation

A failure in one country-specific provider should not unnecessarily affect other countries.

Examples:

- Burundi mobile-money outage;
- Rwanda SMS provider failure;
- Kenya payment-provider callback delay.

Integration health, retries and failover shall be scoped by provider and country.

# 20.71 Data Residency and Region Review

Before activating a new country, the platform shall review:

- service availability;
- Firebase region;
- latency;
- data-residency obligations;
- payment regulation;
- privacy requirements;
- notification-provider requirements;
- backup location;
- disaster-recovery implications.

The platform shall not assume one regional decision is legally suitable everywhere.

# 20.72 Country Launch Checklist

Each country launch should confirm:

- country configuration;
- currency;
- timezone;
- phone format;
- supported languages;
- subscription prices;
- payment providers;
- tax and invoicing requirements;
- notification providers;
- taxonomy translations;
- support process;
- feature flags;
- monitoring filters;
- legal documentation;
- pilot cohort;
- rollback plan.

# 20.73 Operational Documentation

The platform shall maintain operational documents including:

- deployment runbook;
- rollback runbook;
- incident-response plan;
- backup and restore runbook;
- provider-outage runbook;
- payment-reconciliation runbook;
- security-incident runbook;
- migration runbook;
- maintenance-mode guide;
- country-launch checklist;
- administrator-access procedure.

These will be expanded in the Operational Playbooks volume.

# 20.74 Functional Requirements

## FR-OPS-001

Development, staging and production shall use isolated projects and data.

## FR-OPS-002

Production deployment shall use reviewed and auditable CI/CD workflows.

## FR-OPS-003

Secrets shall remain outside source control and frontend applications.

## FR-OPS-004

Security Rules, indexes and deployment configuration shall be version-controlled.

## FR-OPS-005

Every release shall have an immutable release manifest.

## FR-OPS-006

Production deployment shall require explicit approval.

## FR-OPS-007

The platform shall support staged rollout and feature-controlled release.

## FR-OPS-008

Critical workflows shall emit structured logs and correlation IDs.

## FR-OPS-009

Technical and business-workflow health metrics shall be monitored.

## FR-OPS-010

Critical failures shall generate actionable alerts.

## FR-OPS-011

Incidents shall follow documented detection, containment, recovery and review processes.

## FR-OPS-012

Maintenance mode shall support controlled scope and allowed actions.

## FR-OPS-013

Firestore, Storage and strategic configuration shall be backed up.

## FR-OPS-014

Backups shall be tested through restoration.

## FR-OPS-015

The platform shall maintain disaster-recovery procedures and recovery objectives.

## FR-OPS-016

Reporting projections and search indexes shall be rebuildable from authoritative data.

## FR-OPS-017

Production support shall use governed support cases and controlled diagnostics.

## FR-OPS-018

Cloud and provider costs shall be monitored and alerted.

## FR-OPS-019

Capacity thresholds shall trigger planned architectural review.

## FR-OPS-020

Country expansion shall use shared architecture and governed configuration rather than code forks.

## FR-OPS-021

Provider failures shall be isolated by provider and country where practical.

## FR-OPS-022

Every country launch shall complete a formal operational-readiness checklist.

## FR-OPS-023

High-risk operational changes shall preserve audit history.

## FR-OPS-024

Rollback planning shall include data, configuration, rules and infrastructure compatibility.

# 20.75 Operational Rules

> **ID normalization (Phase 4, 16 July 2026 — DEC-GOV-006):** this table's rule IDs were renamed from `OP-001..018` to `OR-001..018` to resolve a collision with PRD0 §11's ONUS Principles (which keep the `OP-` prefix unchanged). No rule wording changed. See the [ID Mapping](../../00-governance/requirement-id-mapping.md) for the complete old→new record.

| Rule ID | Rule                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------- |
| OR-001  | Production changes shall not be made through uncontrolled manual processes.                       |
| OR-002  | Production secrets shall never enter source control or client bundles.                            |
| OR-003  | Staging shall use production-like architecture with non-production data and credentials.          |
| OR-004  | A release is incomplete until post-deployment verification passes.                                |
| OR-005  | Every critical workflow shall be traceable through correlation identifiers.                       |
| OR-006  | Alerts shall be actionable and assigned.                                                          |
| OR-007  | Incident containment shall preserve evidence.                                                     |
| OR-008  | Material incidents shall receive a written post-incident review.                                  |
| OR-009  | A backup is not proven until restoration succeeds.                                                |
| OR-010  | Strategic Knowledge and Rules data shall have independent export and recovery capability.         |
| OR-011  | Maintenance mode shall not display false success for blocked actions.                             |
| OR-012  | Cost growth shall be monitored as an operational-risk indicator.                                  |
| OR-013  | Derived projections and indexes shall be rebuildable.                                             |
| OR-014  | Country expansion shall not create unmanaged permanent code forks.                                |
| OR-015  | Infrastructure changes shall be versioned and reviewable where practical.                         |
| OR-016  | Rollback shall consider code, data, configuration and rule compatibility.                         |
| OR-017  | Production support shall not require unrestricted database access.                                |
| OR-018  | Recovery shall prioritize security, identity and commercial integrity before secondary analytics. |

# 20.76 Acceptance Criteria

This chapter is approved when:

- Environment and Firebase project isolation are defined.
- CI/CD, deployment permissions and release manifests are established.
- Configuration and secret classifications are clear.
- Infrastructure and Security Rules are version-controlled.
- Structured logging, metrics, correlation and alerting are defined.
- Incident, maintenance and status-communication processes are documented.
- Firestore, Storage, Knowledge and Rules backup requirements are established.
- Restore testing and disaster-recovery validation are mandatory.
- Support diagnostics do not require unrestricted production access.
- Cost monitoring and capacity-planning requirements are defined.
- Country expansion uses shared architecture, configuration and provider isolation.
- Operational runbooks and country-launch readiness are required.

# 20.77 Next Chapter

The next chapter should define:

# Privacy, Data Protection, Retention and Compliance Architecture

It will cover:

- privacy principles;
- customer and business data classification;
- personal data;
- sensitive KYC data;
- consent;
- purpose limitation;
- data minimization;
- customer rights;
- access and correction;
- account closure;
- deletion and anonymization;
- retention periods;
- cross-border processing;
- subprocessors;
- marketing consent;
- children and family data;
- location data;
- profiling and recommendations;
- breach response;
- country-specific compliance readiness.