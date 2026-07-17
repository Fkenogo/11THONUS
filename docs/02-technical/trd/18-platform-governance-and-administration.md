> **Title:** TRD Chapter 18 — Platform Administration, Knowledge Studio and Rules Studio  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/18-platform-governance-and-administration.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Technical Requirements Document

## PART XI - Platform Governance and Administration

# Chapter 18: Platform Administration, Knowledge Studio and Rules Studio Technical Architecture

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-17

# 18.1 Purpose

This chapter defines the technical architecture for operating and governing the 11thONUS platform.

It establishes:

- platform-administrator roles and permissions;
- administrative security boundaries;
- business and customer support workflows;
- Knowledge Studio architecture;
- Commerce Knowledge moderation;
- multilingual translation governance;
- Rules Studio architecture;
- rule authoring, testing and approval;
- scheduled rule activation;
- feature-flag governance;
- bulk operations;
- emergency administrative controls;
- administrative auditing;
- future Experience Studio and Intelligence Studio readiness.

Platform Administration shall not be a collection of unrestricted database screens.

It shall be a governed operational application built on the same domain services, authorization controls and audit principles as the rest of 11thONUS.

# 18.2 Administrative Objectives

The administration architecture shall ensure that:

- Administrators receive only the permissions required for their responsibilities.
- No administrator has unrestricted authority by default.
- Administrative changes pass through trusted server services.
- Business and customer history cannot be silently altered.
- Knowledge Studio remains the sole governance interface for canonical commercial knowledge.
- Rules Studio remains the sole governance interface for configurable platform behavior.
- Every important administrative action is attributable and auditable.
- High-risk actions require stronger approval.
- Bulk actions are previewable, resumable and reversible where practical.
- Emergency controls remain narrow, time-limited and reviewed.
- Future Studios can extend the same governance architecture.

# 18.3 Administration Architecture Principles

## AAP-001 - Administration Uses Domain Services

The administration application shall not modify authoritative Firestore collections directly.

Administrative actions shall invoke approved domain commands.

## AAP-002 - No Universal Administrator

Administrative access shall be divided into functional roles.

## AAP-003 - Separate View, Edit, Approve and Publish

The ability to view a resource does not automatically grant permission to modify, approve or publish it.

## AAP-004 - High-Risk Actions Require Additional Control

Sensitive actions may require:

- recent authentication;
- a second approver;
- stated reason;
- preview;
- delayed activation;
- post-action review.

## AAP-005 - Every Administrative Change Is Versioned

Knowledge, rules, configuration and governance changes shall preserve prior versions.

## AAP-006 - Bulk Operations Are Controlled Jobs

Large changes shall use governed background jobs rather than browser-side loops.

## AAP-007 - Emergency Access Is Exceptional

Emergency access shall never become the normal support workflow.

## AAP-008 - Administrative UI Uses Clear Operational Language

Engineering details may appear in diagnostics, but normal administrators should not need to understand internal implementation terminology.

# 18.4 Administrative Surfaces

The administration application shall contain several governed workspaces.

Platform Administration  
<br/>├── Platform Overview  
├── Businesses  
├── Customers  
├── Team and Permissions  
├── Trust and Operational Reviews  
├── Subscriptions and Billing  
├── Knowledge Studio  
├── Rules Studio  
├── Notifications and Templates  
├── Support  
├── Integrations  
├── Reporting  
├── Feature Flags  
├── System Health  
└── Security and Audit

Visibility depends on the administrator's assigned permissions.

# 18.5 Administrator Roles

The platform should support narrowly defined administrative roles.

## 18.5.1 Platform Super Administrator

Reserved for a very small number of trusted platform operators.

May manage:

- administrator roles;
- critical platform configuration;
- emergency controls;
- high-risk approvals;
- security incidents.

This role should not be used for routine support.

## 18.5.2 Business Operations Administrator

May:

- review businesses;
- assist with onboarding;
- suspend or restore businesses where permitted;
- review business status;
- manage support cases.

## 18.5.3 Subscription Administrator

May:

- view subscriptions;
- review payment status;
- resolve billing cases;
- approve governed manual billing actions;
- generate billing documents where permitted.

## 18.5.4 Trust and Review Administrator

May:

- investigate disputes;
- review unusual activity;
- assign operational reviews;
- record resolutions;
- escalate serious cases.

## 18.5.5 Knowledge Editor

May:

- create draft knowledge entries;
- edit draft taxonomy;
- propose translations;
- manage synonyms;
- review business suggestions.

May not publish without approval unless separately authorized.

## 18.5.6 Knowledge Approver

May:

- review knowledge changes;
- approve or reject entries;
- publish approved versions;
- retire or replace existing nodes.

## 18.5.7 Rules Author

May:

- draft rules;
- create test scenarios;
- propose assignments;
- view simulations.

May not activate rules without approval.

## 18.5.8 Rules Approver

May:

- review rules;
- approve publication;
- schedule activation;
- reject or return drafts;
- suspend unsafe rules where authorized.

## 18.5.9 Support Agent

May:

- view limited account information;
- manage support cases;
- provide guided recovery;
- escalate issues.

Support access shall exclude unnecessary commercial or KYC information.

## 18.5.10 Reporting Administrator

May access approved cross-platform reporting and export tools.

## 18.5.11 Security Administrator

May:

- review security events;
- manage administrator security;
- revoke compromised sessions;
- support incident response;
- approve emergency access.

# 18.6 Administrative Permission Domains

Permissions shall be grouped by domain.

Examples:

## Business Operations

- business.view
- business.review
- business.suspend
- business.restore
- business.close

## Customer Support

- customer.view_limited
- customer.recovery_assist
- customer.suspend
- customer.close
- customer.merge_review

## Trust Reviews

- review.view
- review.assign
- review.resolve
- review.escalate

## Knowledge Studio

- knowledge.view
- knowledge.create_draft
- knowledge.edit_draft
- knowledge.approve
- knowledge.publish
- knowledge.retire
- knowledge.bulk_import

## Rules Studio

- rules.view
- rules.create_draft
- rules.simulate
- rules.approve
- rules.schedule
- rules.activate
- rules.suspend

## Billing

- billing.view
- billing.review_payment
- billing.manual_confirm
- billing.refund
- billing.plan_override

## Security

- security.view_events
- security.revoke_sessions
- security.manage_admins
- security.emergency_access

Permissions shall be evaluated server-side.

# 18.7 Separation of Duties

High-risk workflows shall separate responsibilities where practical.

Examples:

- A Knowledge Editor drafts; a Knowledge Approver publishes.
- A Rules Author drafts; a Rules Approver activates.
- A Billing Administrator proposes a manual payment confirmation; a second authorized administrator approves it.
- An administrator cannot approve their own privileged role escalation.
- An emergency data-repair job should require review before production execution.

For the MVP, where staffing is limited, one person may hold multiple roles, but the system shall still record which responsibility was exercised.

# 18.8 Administrative Authentication

Platform administrators shall use stronger authentication controls.

Requirements include:

- verified email;
- multi-factor authentication;
- recent reauthentication for sensitive actions;
- approved administrator user record;
- restricted session lifetime;
- device and session visibility;
- rapid session revocation.

Phone-only authentication shall not be sufficient for high-privilege administration.

# 18.9 Administrative Session Controls

Administrative sessions should support:

- shorter inactivity timeout;
- recent-authentication checks;
- all-device revocation;
- suspicious-session alerts;
- visible active sessions;
- automatic logout on high-risk permission removal.

Administrative pages shall not remain accessible through stale cached content after sign-out.

# 18.10 Administrator Membership Model

Platform administration roles shall be separate from business memberships.

Recommended collection:

type PlatformAdministratorDocument = {  
id: string;  
userId: string;  
roles: string\[\];  
permissions: string\[\];  
status: "invited" | "active" | "suspended" | "removed";  
mfaRequired: boolean;  
invitedBy: string;  
approvedBy?: string;  
activatedAt?: Timestamp;  
suspendedAt?: Timestamp;  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

Business-owner status shall not grant platform-administration access.

# 18.11 Business Administration Workspace

Authorized administrators shall be able to:

- search businesses;
- view lifecycle status;
- view subscription status;
- review ownership;
- view active Reward Program count;
- view operational health;
- view open support and Trust reviews;
- inspect recent administrative actions;
- suspend or restore through governed workflows.

Administrators shall not directly edit business commercial history.

# 18.12 Business Suspension Workflow

A platform suspension shall require:

- target business;
- reason code;
- evidence or case reference;
- proposed suspension scope;
- effective time;
- customer-impact summary;
- administrator authorization;
- audit record;
- notification plan.

The suspension may affect:

- new Purchase Records;
- staff access;
- Reward Program activation;
- subscription operations;
- public discovery.

Earned customer rewards and prior history shall follow the governing suspension policy.

# 18.13 Customer Administration Workspace

Customer administration shall support narrowly scoped operations such as:

- account-status review;
- account recovery;
- phone or email recovery process;
- duplicate-account review;
- consent-history review;
- session revocation;
- suspension;
- closure request support.

Administrators shall not verify Purchase Records for customers.

# 18.14 Customer Account Merge

Duplicate-account merging is a high-risk future capability.

A merge workflow shall require:

- evidence that both accounts belong to the same person;
- conflict analysis;
- surviving account selection;
- loyalty-number decision;
- Purchase Record reconciliation;
- reward reconciliation;
- consent;
- dry-run report;
- audit trail.

No merge shall be completed through direct Firestore edits.

# 18.15 Support Case Architecture

Support cases shall be formal records.

type SupportCaseDocument = {  
id: string;  
caseType: string;  
subjectType: "customer" | "business" | "purchase" | "reward" | "billing" | "security";  
subjectId: string;  
requesterUserId?: string;  
businessId?: string;  
priority: "low" | "normal" | "high" | "urgent";  
status: "open" | "assigned" | "waiting_for_user" | "resolved" | "closed";  
assignedTo?: string;  
summary: string;  
resolution?: string;  
createdAt: Timestamp;  
updatedAt: Timestamp;  
closedAt?: Timestamp;  
schemaVersion: number;  
};

Support messages and attachments may use controlled subcollections.

# 18.16 Support Data Minimization

Support agents shall see only information needed to resolve the case.

For example:

- a billing case does not require customer interests;
- a Purchase Record dispute does not require activity at other businesses;
- account recovery does not require full Trust Event history unless escalated.

Access to sensitive data shall be logged.

# 18.17 Diagnostic Views

Administrators may need diagnostic views showing:

- resource status;
- latest server action;
- correlation ID;
- failed jobs;
- event-processing state;
- notification status;
- integration status.

Diagnostic views should avoid requiring administrators to inspect raw Firestore documents.

# 18.18 Knowledge Studio Purpose

Knowledge Studio is the authoritative administrative interface for the Commerce Knowledge Domain.

It governs:

- industries;
- business categories;
- business types;
- Reward Program categories;
- standard products;
- standard services;
- tags;
- synonyms;
- translations;
- search metadata;
- replacement and retirement.

# 18.19 Knowledge Object Lifecycle

Every canonical knowledge object shall move through:

Draft  
↓  
In Review  
↓  
Approved  
↓  
Published  
↓  
Retired  
↓  
Archived

Rejected drafts remain historically traceable.

# 18.20 Knowledge Draft Model

A draft shall be separate from the current published version.

Recommended structure:

type KnowledgeDraftDocument = {  
id: string;  
knowledgeNodeId?: string;  
proposedNodeType: string;  
proposedParentId?: string;  
proposedCanonicalName: string;  
proposedDescription?: string;  
proposedSearchTerms: string\[\];  
proposedTranslations: Record&lt;string, unknown&gt;;  
source: "admin" | "business_suggestion" | "search_analysis" | "import" | "ai_assisted";  
sourceReference?: string;  
status: "draft" | "in_review" | "approved" | "rejected" | "published";  
createdBy: string;  
reviewedBy?: string;  
createdAt: Timestamp;  
reviewedAt?: Timestamp;  
schemaVersion: number;  
};

# 18.21 Knowledge Suggestion Workflow

Businesses may suggest missing knowledge entries.

The workflow shall:

- capture the proposal;
- normalize the proposed term;
- search for similar existing nodes;
- show possible matches to the editor;
- allow linking to an existing node;
- allow creation of a new draft;
- route for translation and approval;
- publish through versioned server commands.

A suggestion does not become public merely because multiple businesses use it.

# 18.22 Duplicate Detection

Knowledge Studio should assist editors with:

- exact-name matching;
- normalized matching;
- synonym matching;
- translation matching;
- parent-category comparison;
- fuzzy similarity;
- future semantic similarity.

AI may recommend possible duplicates.

A human editor remains responsible for the final decision.

# 18.23 Knowledge Translation Workflow

Each published knowledge object shall have language coverage status.

Suggested states by language:

- Missing;
- Draft;
- Reviewed;
- Approved;
- Published.

English is the canonical source language.

French is required for launch-critical knowledge.

Kirundi, Swahili and Kinyarwanda may be progressively completed.

# 18.24 Translation Review Controls

Translation publication shall support:

- original source text;
- translated text;
- translator;
- reviewer;
- glossary terms;
- review notes;
- publication date;
- version.

Machine-generated translations shall be visibly marked until human-reviewed.

# 18.25 Knowledge Replacement

When a knowledge node is replaced:

- existing historical references remain valid;
- the retired node records its replacement;
- new onboarding selections use the replacement;
- search may redirect retired synonyms;
- reporting can map old and new nodes where appropriate.

Historical Reward Programs shall not be silently rewritten.

# 18.26 Knowledge Bulk Import

Bulk imports may be required for initial seed data or large catalogue updates.

A bulk-import process shall include:

- import file;
- schema validation;
- duplicate analysis;
- parent-reference validation;
- translation validation;
- dry-run preview;
- error report;
- batch execution;
- resumability;
- publication choice;
- rollback or compensating plan.

A bulk import shall not publish directly without review unless explicitly approved.

# 18.27 Knowledge Publication Events

Publishing a knowledge version shall create events such as:

- knowledge.node_published.v1
- knowledge.translation_published.v1
- knowledge.node_retired.v1

Consumers may update:

- search indexes;
- onboarding caches;
- reporting mappings;
- recommendation metadata.

# 18.28 Knowledge Studio Analytics

Knowledge Studio should report:

- most-used nodes;
- unused nodes;
- missing translations;
- pending suggestions;
- frequent duplicate proposals;
- zero-result search terms;
- retired-node usage;
- taxonomy-depth distribution;
- category adoption by country.

These reports help maintain data quality.

# 18.29 Rules Studio Purpose

Rules Studio is the authoritative administrative interface for configurable platform behavior.

It governs:

- rule definitions;
- rule versions;
- scope assignments;
- effective dates;
- overrides;
- approval;
- simulation;
- activation;
- suspension;
- retirement.

# 18.30 Rule Definition Versus Rule Version

A Rule Definition identifies the meaning of a rule.

Example:

purchase.verificationReminderHours

A Rule Version stores a value and effective period.

Example:

Version 3 = 24 hours  
Effective from 1 August 2026

A Rule Assignment connects the version to a scope.

Example:

Country = Burundi

# 18.31 Rule Authoring Workflow

Rule authoring shall follow:

Draft Rule Version  
↓  
Validate  
↓  
Create Test Scenarios  
↓  
Simulate  
↓  
Submit for Review  
↓  
Approve  
↓  
Schedule  
↓  
Activate  
↓  
Monitor  
↓  
Supersede or Retire

No draft rule shall affect production behavior.

# 18.32 Rule Validation

Before review, the system shall validate:

- rule definition exists;
- value type is correct;
- scope is allowed;
- override policy permits assignment;
- effective dates are valid;
- referenced plan, country, business or Reward Program exists;
- no prohibited conflict exists;
- required approval level is known.

# 18.33 Rule Simulation

Rules Studio shall support simulation before activation.

A simulation request may include:

- proposed rule version;
- scope;
- sample business;
- sample customer;
- sample Reward Program;
- sample Purchase Record;
- effective date.

The result should show:

- effective rule value;
- source scope;
- overridden rules;
- expected business behavior;
- affected entities where estimable;
- warnings.

# 18.34 Rule Impact Analysis

Before publishing a significant rule, Rules Studio should estimate:

- businesses affected;
- Reward Programs affected;
- customers potentially affected;
- queued operations affected;
- subscription plans affected;
- expected notification changes;
- incompatible existing configuration.

Impact analysis is advisory but should be stored with the approval record.

# 18.35 Rule Approval

Rule approval shall record:

- author;
- approver;
- rule version;
- scope;
- reason;
- simulation reference;
- impact-analysis reference;
- activation time;
- rollback plan where required.

High-impact rules may require two approvers.

# 18.36 Scheduled Rule Activation

Approved rules may be scheduled.

The activation service shall:

- confirm approval remains valid;
- confirm effective time;
- activate the rule version;
- supersede prior assignment where applicable;
- create an audit record;
- publish a rule-activation event;
- invalidate relevant caches;
- monitor for errors.

# 18.37 Rule Cache Invalidation

Domain services may cache resolved rules briefly.

Rule activation shall trigger cache invalidation using:

- rule definition;
- scope;
- affected domain;
- version.

Sensitive operations may bypass stale caches and read the authoritative active assignment.

# 18.38 Rule Suspension

A harmful rule may require urgent suspension.

Suspension shall:

- require authorized permission;
- state the reason;
- identify the replacement or fallback;
- create an audit record;
- invalidate caches;
- publish an event;
- trigger review.

Suspension shall not erase historical outcomes made under that rule.

# 18.39 Rule Rollback

Rollback means activating a previous approved rule version or a defined safe fallback.

It shall not delete the newer version.

The system shall preserve:

- failed version;
- rollback reason;
- rollback actor;
- effective time;
- impact notes.

# 18.40 Rule Conflict Resolution

Rules Studio shall visualize rule precedence.

Example:

Platform Default: 48 hours  
Country Override: Burundi = 24 hours  
Business Override: Joe's Coffee = 12 hours

The interface shall show the final effective value and why it applies.

Conflicts outside permitted override policies shall block publication.

# 18.41 Feature Flags

Feature flags are a specialized configuration type.

They may control:

- pilot features;
- country rollout;
- business cohorts;
- staff cohorts;
- UI experiments;
- language rollout;
- search rollout;
- administrative modules.

Feature flags shall not:

- bypass authorization;
- alter historical commercial facts;
- silently remove earned rewards;
- replace permanent plan entitlement logic.

# 18.42 Feature Flag Model

A feature flag should include:

type FeatureFlagDocument = {  
id: string;  
flagKey: string;  
description: string;  
status: "draft" | "active" | "paused" | "retired";  
defaultValue: boolean;  
targetingRules: Array&lt;Record<string, unknown&gt;>;  
rolloutPercent?: number;  
activeFrom?: Timestamp;  
activeUntil?: Timestamp;  
createdBy: string;  
approvedBy?: string;  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

Targeting shall use governed attributes.

# 18.43 Bulk Administrative Jobs

Bulk jobs may include:

- taxonomy import;
- translation update;
- rule assignment;
- business notification;
- reporting rebuild;
- account migration;
- plan migration;
- data repair.

Every bulk job shall have:

- job ID;
- job type;
- requested by;
- approved by where required;
- dry-run result;
- target scope;
- estimated count;
- processed count;
- success count;
- failure count;
- status;
- start and end times;
- error report;
- rollback or compensating plan.

# 18.44 Bulk Job Lifecycle

Draft  
↓  
Validated  
↓  
Dry Run Completed  
↓  
Approved  
↓  
Scheduled  
↓  
Running  
↓  
Completed / Partially Completed / Failed  
↓  
Reviewed

Administrators shall be able to pause or cancel where technically safe.

# 18.45 Data Repair Architecture

Data repair shall use explicit repair commands.

A repair command must:

- identify affected records;
- state expected correction;
- preserve original evidence;
- produce compensating events;
- support dry-run mode;
- generate verification output.

Direct Firebase Console edits shall not be an approved production repair process.

# 18.46 Emergency Controls

Emergency controls may include:

- suspend a compromised business;
- revoke administrator sessions;
- pause a failing integration;
- disable a dangerous feature flag;
- suspend a rule;
- stop notification delivery;
- pause bulk processing;
- switch platform to maintenance mode.

Each control shall be narrow and reversible where practical.

# 18.47 Maintenance Mode

The platform shall support governed maintenance modes.

Potential scopes:

- entire platform;
- country;
- customer application;
- business application;
- administration application;
- specific domain;
- specific integration.

Maintenance mode shall define:

- allowed reads;
- blocked writes;
- customer message;
- business message;
- start and expected end;
- administrator responsible.

# 18.48 Emergency Access Workflow

Emergency access shall require:

- eligible security administrator;
- reason;
- affected system or account;
- requested permission;
- expiry;
- approval where practical;
- automatic revocation;
- complete audit trail;
- post-incident review.

Emergency permission shall not become permanent automatically.

# 18.49 Administrative Audit Record

Every privileged action shall create an audit record.

type AdministrativeAuditRecord = {  
id: string;  
actionType: string;  
actorUserId: string;  
actorRole: string;  
targetType: string;  
targetId: string;  
businessId?: string;  
reasonCode?: string;  
reasonText?: string;  
beforeSnapshot?: Record&lt;string, unknown&gt;;  
afterSnapshot?: Record&lt;string, unknown&gt;;  
correlationId: string;  
occurredAt: Timestamp;  
schemaVersion: number;  
};

Snapshots shall exclude unnecessary secrets and sensitive data.

# 18.50 Audit Search

Authorized administrators shall be able to search audit history by:

- actor;
- action;
- target;
- business;
- date range;
- correlation ID;
- severity;
- domain.

Audit records shall be append-only.

# 18.51 Administrative Notifications

Administrators may receive alerts for:

- high-severity Trust reviews;
- rule activation failure;
- knowledge publication failure;
- bulk-job failure;
- integration outage;
- payment callback anomaly;
- security incident;
- backup failure;
- administrator-role change.

Alerts shall follow permission and escalation rules.

# 18.52 Administrative Reporting

Administration dashboards may include:

- active businesses;
- pending business reviews;
- subscription status;
- open Trust reviews;
- Knowledge Studio backlog;
- missing translations;
- Rules Studio scheduled changes;
- failed jobs;
- integration health;
- security events;
- support-case backlog.

Metrics shall use the Reporting Domain.

# 18.53 Administration Search

The administration application shall support safe search across:

- businesses;
- customers;
- Purchase Records;
- rewards;
- subscriptions;
- support cases;
- knowledge nodes;
- rules;
- audit records.

Search results shall respect administrator permissions and data minimization.

# 18.54 Future Experience Studio Readiness

A future Experience Studio may govern:

- notification templates;
- onboarding copy;
- help content;
- empty states;
- email templates;
- campaign content;
- multilingual publishing.

It should reuse:

- administrator roles;
- draft-review-publish workflow;
- translation governance;
- scheduling;
- versioning;
- audit.

# 18.55 Future Intelligence Studio Readiness

A future Intelligence Studio may govern:

- recommendation models;
- search-ranking models;
- benchmarking definitions;
- analytical rules;
- model versions;
- evaluation;
- approval;
- deployment;
- rollback.

AI-assisted decisions shall remain governed and auditable.

# 18.56 AI Assistance Within Studios

AI may assist with:

- duplicate taxonomy detection;
- translation drafts;
- synonym suggestions;
- rule-impact summaries;
- anomaly explanations;
- search-quality recommendations;
- data-quality findings.

AI shall not independently:

- publish knowledge;
- activate rules;
- suspend businesses;
- alter customer progress;
- approve refunds;
- grant administrator access.

# 18.57 Administrative API Boundaries

The administration frontend shall call typed administrative commands.

Examples:

- adminSuspendBusiness
- adminRestoreBusiness
- knowledgeCreateDraft
- knowledgeApproveDraft
- knowledgePublishVersion
- rulesCreateVersion
- rulesSimulateVersion
- rulesApproveVersion
- rulesScheduleActivation
- adminRunBulkJob

The frontend shall not receive general-purpose write access to domain collections.

# 18.58 Administrative Error Handling

Administrative errors shall provide:

- error code;
- correlation ID;
- affected resource;
- retryability;
- safe operational guidance.

Diagnostics may include more detail than customer-facing errors, but shall not expose secrets or raw credentials.

# 18.59 Administrative Observability

Monitoring shall cover:

- failed admin commands;
- failed publication jobs;
- rule-resolution failures;
- stale drafts;
- bulk-job backlog;
- support-case backlog;
- permission denials;
- emergency-access use;
- audit-generation failures;
- maintenance-mode changes.

Audit-generation failure shall be treated as a high-severity condition for privileged actions.

# 18.60 Administrative Testing

Testing shall include:

## Role Tests

- each administrator role;
- denied cross-role access;
- suspended administrator;
- permission changes;
- recent-authentication requirements.

## Knowledge Studio Tests

- draft creation;
- duplicate suggestion;
- translation review;
- approval;
- publication;
- retirement;
- replacement;
- index update.

## Rules Studio Tests

- valid draft;
- invalid value;
- override conflict;
- simulation;
- approval;
- scheduled activation;
- rollback;
- cache invalidation.

## Bulk Job Tests

- dry run;
- resumability;
- partial failure;
- cancellation;
- duplicate execution;
- reporting.

## Emergency Tests

- session revocation;
- maintenance mode;
- feature pause;
- expired elevation;
- audit creation.

# 18.61 Functional Requirements

## FR-ADM-001

Platform administration shall use separated roles and permissions.

## FR-ADM-002

No administrator shall receive unrestricted access by default.

## FR-ADM-003

Administrative changes shall execute through trusted server commands.

## FR-ADM-004

Privileged actions shall create append-only audit records.

## FR-ADM-005

Knowledge Studio shall be the authoritative interface for Commerce Knowledge governance.

## FR-ADM-006

Knowledge publication shall use draft, review, approval and publication stages.

## FR-ADM-007

Knowledge versions shall preserve historical references.

## FR-ADM-008

Rules Studio shall be the authoritative interface for configurable platform behavior.

## FR-ADM-009

Rules shall support validation, simulation, approval, scheduling and rollback.

## FR-ADM-010

Rule activation shall invalidate affected caches and publish governed events.

## FR-ADM-011

Feature flags shall not bypass authorization or replace permanent entitlement logic.

## FR-ADM-012

Bulk operations shall support dry-run, progress tracking and failure reporting.

## FR-ADM-013

Production data repair shall use governed repair commands rather than direct console editing.

## FR-ADM-014

Emergency access shall be time-limited, justified and audited.

## FR-ADM-015

Maintenance mode shall support scoped platform controls.

## FR-ADM-016

Support access shall follow data-minimization principles.

## FR-ADM-017

Administrative search shall respect permission boundaries.

## FR-ADM-018

AI assistance shall remain advisory and human-governed.

## FR-ADM-019

The architecture shall support future Experience Studio and Intelligence Studio capabilities.

## FR-ADM-020

Administrative security shall require stronger authentication and session controls.

# 18.62 Administration Rules

| Rule ID | Rule                                                                                          |
| ------- | --------------------------------------------------------------------------------------------- |
| AR-001  | Platform administration shall not rely on unrestricted database access.                       |
| AR-002  | Administrative permissions shall be separated by responsibility.                              |
| AR-003  | View, edit, approve and publish permissions shall remain distinct.                            |
| AR-004  | Administrators shall not verify purchases on behalf of customers.                             |
| AR-005  | Knowledge changes shall be versioned and governed.                                            |
| AR-006  | Rules shall not affect production until approved and activated.                               |
| AR-007  | Authors shall not approve their own high-risk changes where separation of duties is required. |
| AR-008  | Bulk changes shall require a dry run where practical.                                         |
| AR-009  | Production repair shall preserve original evidence and audit history.                         |
| AR-010  | Emergency elevation shall expire automatically.                                               |
| AR-011  | Feature flags shall not override security authorization.                                      |
| AR-012  | AI shall not publish, activate or suspend without human approval.                             |
| AR-013  | Audit failure shall block or escalate high-risk administrative actions.                       |
| AR-014  | Support agents shall receive only the data required for the active case.                      |
| AR-015  | Historical knowledge and rule versions shall remain reproducible.                             |

# 18.63 Acceptance Criteria

This chapter is approved when:

- Platform-administrator roles and permission boundaries are explicit.
- Administrative access is separate from business ownership.
- Business, customer, billing and support workflows use governed commands.
- Knowledge Studio manages the complete taxonomy and translation lifecycle.
- Rules Studio supports authoring, simulation, approval, activation and rollback.
- Separation of duties is supported for high-risk changes.
- Feature flags, bulk jobs and data-repair workflows are governed.
- Emergency access and maintenance modes are controlled and auditable.
- Administrative search and diagnostics respect data minimization.
- Future Experience Studio and Intelligence Studio can reuse the same governance model.
- AI remains advisory and cannot independently change production behavior.
- Administrative testing covers permissions, publication, rule changes and emergencies.

# 18.64 Next Chapter

The next chapter should define:

# Testing, Quality Assurance and Release Validation Architecture

It will cover:

- test strategy across all domains;
- unit, integration, emulator and end-to-end testing;
- security-rule testing;
- concurrency and idempotency testing;
- localization and accessibility testing;
- offline and PWA testing;
- payment-provider testing;
- data migration testing;
- test environments;
- seed data;
- test accounts;
- release gates;
- pilot validation;
- regression testing;
- defect severity;
- production verification;
- rollback criteria.