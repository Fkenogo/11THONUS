> **Title:** TRD Chapter 11 — Cloud Functions, Domain Services and Event Processing  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/11-cloud-functions-and-domain-services.md`  
> **Last controlled update:** 2026-08-07 (`F9B-DEC-001` — §11.35 error-category governance note added recording the Founder decision on Architecture Review Finding F9b: the governed error taxonomy remains the existing 14 categories, unchanged; non-idempotency identity conflicts continue to map to `VALIDATION_FAILED`, `IDEMPOTENCY_CONFLICT` stays reserved for genuine idempotency conflicts, no general `CONFLICT` category is introduced. Previously: 2026-07-16 (Phase 2 — relocated and renamed; metadata block added))

# 11thONUS

# Technical Requirements Document

## PART IV - Server-Side Processing

# Chapter 11: Cloud Functions, Domain Services and Event Processing

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-10

# 11.1 Purpose

This chapter defines how trusted server-side operations shall execute the business rules of 11thONUS.

It establishes:

- Cloud Functions responsibilities;
- domain service boundaries;
- command handling;
- event publication and consumption;
- authentication and authorization;
- validation;
- idempotency;
- concurrency controls;
- transactional processing;
- retries;
- event ordering;
- error handling;
- scheduled jobs;
- audit generation;
- observability;
- testing requirements.

Cloud Functions shall protect the integrity of the Purchase Verification Lifecycle, Customer-Verified Loyalty Engine, Reward Lifecycle and Trust Ledger.

The frontend shall request actions.

The server shall decide whether those actions are valid and execute them.

# 11.2 Server Authority Principle

Critical commercial state shall be controlled by trusted server processes.

The client may request:

- creation of a Purchase Record;
- verification of a Purchase Record;
- submission of a dispute;
- redemption of a reward;
- staff invitation;
- Reward Program creation;
- subscription changes.

The client shall not directly:

- create Verified Units;
- update Loyalty Cycle progress;
- make rewards available;
- mark rewards as redeemed;
- create Trust Events;
- activate subscriptions;
- assign privileged roles;
- alter authoritative history.

# 11.3 Function Types

The platform shall use several server-side function categories.

## 11.3.1 Callable Functions

Callable Functions support authenticated actions initiated by the web application.

Examples:

- identityUpdateCustomerProfile
- businessCreateBusiness
- businessInviteStaff
- programCreateRewardProgram
- purchaseRecordPurchase
- purchaseVerifyPurchase
- purchaseRejectPurchase
- purchaseRaiseDispute
- rewardRedeemReward
- subscriptionInitiatePayment

Callable Functions are preferred where:

- the requester is an authenticated Firebase user;
- Firebase Authentication context is required;
- the action originates from the PWA;
- a structured application response is expected.

## 11.3.2 HTTP Functions

HTTP Functions support:

- external integrations;
- public or partner APIs;
- provider webhooks;
- administrative tools requiring explicit HTTP contracts.

Examples:

- mobile-money callbacks;
- SMS delivery callbacks;
- POS API requests;
- future public API endpoints.

HTTP endpoints shall not duplicate callable business logic.

They shall invoke the same domain services used by other entry points.

## 11.3.3 Firestore Event Functions

Firestore triggers may react to authoritative document creation or controlled state changes.

They should be used carefully.

Examples:

- notification intent created;
- reporting projection update requested;
- integration request queued.

Critical workflows should not rely on unrestricted client-created documents to activate trusted logic.

## 11.3.4 Pub/Sub or Event Functions

As platform volume grows, cross-domain events may be delivered through Pub/Sub or an equivalent event bus.

Examples:

- purchase.verified.v1
- loyalty.reward_available.v1
- reward.redeemed.v1
- subscription.payment_confirmed.v1

The MVP may implement reliable event delivery through Firestore-backed event outboxes before introducing dedicated Pub/Sub infrastructure.

## 11.3.5 Scheduled Functions

Scheduled Functions support recurring operations.

Examples:

- verification reminders;
- subscription expiry checks;
- notification retries;
- stale review escalation;
- reporting aggregation;
- backup validation;
- birthday prompts;
- Knowledge Studio maintenance.

## 11.3.6 Administrative Functions

Administrative Functions support controlled internal operations.

Examples:

- migrations;
- projection rebuilds;
- taxonomy imports;
- rule publication;
- account recovery;
- data repair;
- operational reconciliation.

Administrative Functions shall require elevated authorization and produce complete audit records.

# 11.4 Domain Service Architecture

Cloud Functions are delivery mechanisms.

Business logic shall reside in reusable domain services.

Example:

Callable Function  
↓  
Authentication and request parsing  
↓  
Purchase Domain Service  
↓  
Repositories and Rules Service  
↓  
Transaction / Event Outbox  
↓  
Structured result

The same Purchase Domain Service may be invoked by:

- a callable function;
- a POS API endpoint;
- an administrative function;
- an offline synchronization handler.

This prevents duplicated business logic.

# 11.5 Recommended Server Project Structure

functions/  
src/  
domains/  
identity/  
commands/  
services/  
repositories/  
validators/  
events/  
functions/  
tests/  
<br/>businesses/  
commerceKnowledge/  
rules/  
rewardPrograms/  
purchases/  
loyalty/  
rewards/  
trust/  
notifications/  
reporting/  
subscriptions/  
integrations/  
administration/  
<br/>shared/  
auth/  
errors/  
events/  
idempotency/  
logging/  
validation/  
time/  
config/  
<br/>infrastructure/  
firestore/  
messaging/  
secrets/  
tasks/  
pubsub/  
<br/>index.ts

Each domain shall expose a deliberate public interface.

Other domains shall not import its internal repositories or implementation details.

# 11.6 Commands and Events

The platform shall distinguish between commands and events.

## Command

A command requests that something happen.

Examples:

- Record Purchase.
- Verify Purchase.
- Redeem Reward.
- Invite Staff.

A command may succeed or fail.

## Event

An event states that something has already happened.

Examples:

- Purchase Recorded.
- Purchase Verified.
- Verified Units Issued.
- Reward Became Available.
- Reward Redeemed.

Events are facts and must not be rewritten.

# 11.7 Command Contract Standard

Every sensitive command shall include:

type CommandEnvelope&lt;T&gt; = {  
commandId: string;  
commandType: string;  
commandVersion: number;  
idempotencyKey: string;  
actor: {  
userId: string;  
authUid: string;  
roleContext?: string;  
businessId?: string;  
membershipId?: string;  
};  
issuedAtClient?: string;  
correlationId: string;  
payload: T;  
};

The server shall populate or verify actor information from trusted authentication context.

Client-supplied actor authority shall never be trusted on its own.

# 11.8 Event Contract Standard

Every domain event shall include:

type DomainEvent&lt;T&gt; = {  
eventId: string;  
eventType: string;  
eventVersion: number;  
sourceDomain: string;  
aggregateType: string;  
aggregateId: string;  
correlationId: string;  
causationId?: string;  
actor: {  
actorType: "user" | "service" | "system";  
actorId: string;  
role?: string;  
};  
occurredAt: string;  
payload: T;  
};

Every event schema shall be versioned.

Consumers shall declare which event versions they support.

# 11.9 Event Naming Standard

Event names shall use:

&lt;domain&gt;.&lt;event_name&gt;.v&lt;version&gt;

Examples:

- purchase.recorded.v1
- purchase.verified.v1
- purchase.rejected.v1
- purchase.disputed.v1
- loyalty.units_issued.v1
- loyalty.reward_available.v1
- reward.redeemed.v1
- subscription.payment_confirmed.v1
- identity.staff_suspended.v1

Names shall describe completed facts rather than instructions.

# 11.10 Function Naming Standard

Cloud Functions shall use predictable names.

Suggested pattern:

&lt;domain&gt;&lt;Action&gt;&lt;Object&gt;

Examples:

- purchaseRecordPurchase
- purchaseVerifyPurchase
- purchaseRejectPurchase
- purchaseRaiseDispute
- rewardRedeemReward
- programCreateRewardProgram
- identityInviteBusinessMember
- subscriptionInitiatePayment

Scheduled functions may use:

- scheduledSendVerificationReminders
- scheduledExpireSubscriptions
- scheduledRebuildDailyReports

Provider callbacks may use:

- webhookLumicashPayment
- webhookSmsDelivery

# 11.11 Authentication

Every protected function shall establish:

- authenticated Firebase user;
- current account status;
- current role context;
- active business membership where required;
- business status;
- relevant permissions.

Authentication proves who the requester is.

It does not prove what they may do.

# 11.12 Authorization

Authorization shall be enforced within trusted server code.

Examples:

## Record Purchase

The actor must:

- have an active business membership;
- have purchase-recording permission;
- belong to the target business;
- use an active Reward Program;
- operate within subscription capacity.

## Verify Purchase

The actor must:

- be the registered customer;
- own the customer account associated with the Purchase Record;
- act on a Purchase Record in a verifiable state.

## Redeem Reward

The actor must:

- have an active membership in the business;
- possess redemption permission;
- redeem an available reward belonging to that business.

Authorization failures shall return consistent, non-sensitive errors.

# 11.13 Validation Layers

Every server command shall pass through several validation layers.

## Layer 1 - Transport Validation

Checks:

- required fields;
- data types;
- payload size;
- supported command version.

## Layer 2 - Identity Validation

Checks:

- authenticated user;
- account status;
- role context.

## Layer 3 - Reference Validation

Checks:

- target business exists;
- customer exists;
- Reward Program exists;
- references belong to the expected domain.

## Layer 4 - Business Rule Validation

Checks:

- valid state transition;
- active subscription;
- permitted quantity;
- correct Reward Program version;
- applicable Rules Studio configuration.

## Layer 5 - Concurrency Validation

Checks:

- stale document version;
- duplicate request;
- already completed action;
- competing state transition.

# 11.14 Idempotency Service

Every sensitive operation shall use a shared idempotency mechanism.

An idempotency record may contain:

type IdempotencyRecord = {  
id: string;  
idempotencyKey: string;  
operationType: string;  
actorId: string;  
businessId?: string;  
requestHash: string;  
status: "processing" | "completed" | "failed";  
resultReference?: string;  
responseSnapshot?: unknown;  
createdAt: Timestamp;  
completedAt?: Timestamp;  
expiresAt?: Timestamp;  
};

## Idempotency Behaviour

If the same key and same request are received again:

- return the original successful response; or
- return the existing processing state.

If the same key is reused with different request content:

- reject the request as a conflict.

# 11.15 Transaction Boundaries

Firestore transactions shall be used for tightly coupled writes that must succeed together.

Examples:

## Purchase Verification

Atomic operations may include:

- validate Purchase Record state;
- transition Purchase Record to verified;
- create idempotency result;
- write event-outbox entry.

The creation of Verified Units may be handled within the same transaction or through a reliable event consumer, depending on final performance and consistency testing.

## Reward Redemption

Atomic operations shall include:

- confirm reward is available;
- create redemption;
- mark reward redeemed;
- update cycle status;
- create event-outbox entry;
- prevent a second redemption.

# 11.16 Consistency Model

The platform shall use a deliberate combination of:

## Strong Consistency

Required for:

- customer verification state;
- Verified Unit issuance uniqueness;
- active Loyalty Cycle uniqueness;
- reward availability;
- redemption;
- role changes;
- subscription activation.

## Eventual Consistency

Acceptable for:

- dashboard aggregates;
- reporting projections;
- notification delivery;
- search indexes;
- operational health indicators;
- analytics.

The UI shall clearly handle short projection delays without implying failure.

# 11.17 Event Outbox Pattern

To prevent a successful domain write from failing to publish its event, critical transactions should use an event outbox.

Example:

Firestore Transaction  
├── Update Purchase Record  
└── Create Outbox Event

A background processor then:

- reads unpublished outbox entries;
- publishes or processes the event;
- marks the outbox entry completed;
- retries failures safely.

The event outbox shall support:

- idempotent processing;
- retry count;
- next retry time;
- status;
- error details;
- dead-letter transition.

# 11.18 Purchase Recording Flow

The server-side Purchase Record flow shall be:

- Authenticate business user.
- Resolve business role and permissions.
- Validate business and subscription status.
- Resolve customer by QR or loyalty number.
- Validate active Reward Program and version.
- Validate quantity and applicable rules.
- Check idempotency key.
- Create Purchase Record.
- Create Trust Event or event-outbox entry.
- Create notification intent.
- Return Purchase Record status.

The initial result shall be:

Waiting for Customer Verification

No Verified Units shall exist at this stage.

# 11.19 Customer Verification Flow

The server-side verification flow shall be:

- Authenticate customer.
- Load Purchase Record.
- Confirm customer ownership.
- Confirm Purchase Record is awaiting response.
- Check idempotency.
- Transition Purchase Record to verified.
- Issue Verified Unit credit linked to Purchase Record.
- Resolve or create active Loyalty Cycle.
- Apply Verified Units.
- Recalculate reward eligibility.
- Create reward if threshold is reached.
- Write Trust Events.
- Create business and customer notifications.
- Update derived reporting projections asynchronously.
- Return updated customer progress.

The workflow must remain safe when retried.

# 11.20 Quantity Crossing Multiple Cycles

A single verified Purchase Record may contain a quantity greater than the units remaining in the active Loyalty Cycle.

Example:

- customer has 8 of 10;
- customer verifies a quantity of 5.

The platform must apply units deterministically.

Potential outcome:

- 2 units complete the current cycle;
- one reward becomes available;
- remaining 3 units require a defined business rule.

For the MVP, the default policy should be explicitly configured.

Recommended MVP rule:

Additional verified units shall not enter a new Loyalty Cycle until the current reward is redeemed.

Those units shall remain recorded as unapplied verified units associated with the customer and Reward Program.

Alternative rules may be introduced later through Rules Studio.

This policy prevents silently losing legitimate units while preserving one open cycle per Reward Program.

# 11.21 Pending Verified Unit Allocation

Where verified units cannot yet be applied because a reward remains available, the Loyalty Domain shall track them as pending allocation.

The system must not:

- discard them;
- merge them into another Reward Program;
- create multiple active cycles in the MVP.

Once the outstanding reward is redeemed:

- close the completed cycle;
- create the next cycle;
- apply pending verified units in order;
- determine whether another reward becomes available.

This processing must be idempotent.

# 11.22 Purchase Rejection Flow

The rejection flow shall:

- authenticate the customer;
- confirm ownership;
- confirm valid state;
- record reason;
- transition Purchase Record to rejected;
- create Trust Event;
- notify the business;
- add item to business review where required.

No Verified Units shall be created.

# 11.23 Purchase Dispute Flow

The dispute flow shall:

- authenticate customer;
- validate Purchase Record;
- create dispute record;
- transition Purchase Record to under review;
- create Trust Event;
- notify authorized business users.

Business resolution may:

- confirm original Purchase Record;
- reject it;
- create a corrected replacement.

The business may not silently alter the original record.

# 11.24 Correction Flow

A correction shall:

- retain original Purchase Record;
- create a correction record;
- create replacement Purchase Record;
- reference original and replacement records;
- require customer verification of the replacement;
- create complete Trust Events.

If the original had already created Verified Units, correction requires reversal entries rather than deletion.

# 11.25 Reward Availability Flow

When a Loyalty Cycle reaches its required threshold:

- confirm a reward does not already exist for the cycle;
- create reward entitlement;
- change cycle status to reward available;
- record availability timestamp;
- create Trust Event;
- notify customer;
- update business reporting asynchronously.

The operation must enforce uniqueness by Loyalty Cycle.

# 11.26 Redemption Flow

The redemption flow shall:

- authenticate business user;
- validate business membership and permission;
- load reward;
- confirm customer and business relationship;
- confirm reward status is available;
- check idempotency;
- create redemption;
- mark reward redeemed;
- close Loyalty Cycle;
- create On Us Moment projection;
- create next Loyalty Cycle;
- allocate pending Verified Units where applicable;
- create Trust Events;
- notify customer and business;
- update reporting projections asynchronously.

The same reward shall never be redeemed twice.

# 11.27 Concurrency Controls

The platform must protect against:

- two staff members submitting the same purchase;
- customer verifying the same Purchase Record twice;
- simultaneous reward redemptions;
- simultaneous creation of multiple active cycles;
- duplicate payment callbacks;
- multiple processors consuming one event.

Controls may include:

- Firestore transactions;
- document preconditions;
- idempotency keys;
- unique deterministic document IDs;
- processing locks;
- outbox event status transitions.

# 11.28 Event Ordering

Events associated with one aggregate must be processed in logical order.

Examples:

A reward cannot be redeemed before it becomes available.

A Purchase Record cannot be corrected before it exists.

Where strict ordering is required, events should include:

- aggregate ID;
- aggregate version;
- expected prior version.

Consumers shall reject or defer events with missing prerequisites.

# 11.29 Retry Policy

Retryable failures include:

- temporary provider outages;
- Firestore contention;
- network failures;
- service rate limits;
- transient notification failures.

Non-retryable failures include:

- invalid permissions;
- unsupported state transition;
- missing required business reference;
- invalid payload;
- already completed non-idempotent conflict.

Retries shall use bounded exponential backoff.

# 11.30 Dead-Letter Processing

Events shall move to dead-letter state when:

- maximum retries are exceeded;
- payload is invalid for a supported event version;
- required source records are missing;
- repeated processing failures indicate corruption.

Dead-letter records shall include:

- event;
- failure classification;
- processing attempts;
- last error;
- affected aggregate;
- recommended action.

No event shall disappear silently.

# 11.31 Scheduled Processing

Initial scheduled jobs may include:

## Verification Reminders

Find Purchase Records awaiting customer verification according to reminder rules.

## Subscription Expiry

Identify trial or paid subscriptions reaching expiry.

## Notification Retry

Retry failed notification deliveries within policy.

## Stale Review Escalation

Escalate unresolved disputes or operational reviews.

## Reporting Aggregation

Build daily or monthly projections.

## Data Health Checks

Detect:

- orphaned references;
- inconsistent cycle totals;
- missing Trust Events;
- stuck outbox records;
- duplicate active cycles.

# 11.32 Rules Service Resolution

Before executing configurable behaviour, domain services shall request effective rules from the Rules Domain.

The Rules Service shall resolve:

- platform defaults;
- country overrides;
- subscription-plan overrides;
- business overrides;
- Reward Program overrides;
- customer-specific rules where allowed.

The result shall include:

- effective value;
- rule version;
- source scope;
- evaluation timestamp.

Important commercial records shall store the rule version that affected the decision.

# 11.33 Knowledge Service Resolution

Reward Program creation and business onboarding shall use the Commerce Knowledge Service.

The service shall provide:

- active knowledge nodes;
- localized labels;
- synonyms;
- permitted parent-child relationships;
- valid tags;
- retired-node replacements.

Business-written display names shall not replace canonical knowledge references.

# 11.34 Error Contract

All callable and HTTP APIs shall return standardized errors.

Suggested structure:

type PlatformErrorResponse = {  
code: string;  
messageKey: string;  
correlationId: string;  
retryable: boolean;  
fieldErrors?: Array<{  
field: string;  
code: string;  
messageKey: string;  
}>;  
};

Customer-facing applications shall translate messageKey.

Raw internal errors shall never be returned to users.

# 11.35 Error Categories

Standard categories include:

- AUTH_REQUIRED
- AUTH_FORBIDDEN
- ACCOUNT_SUSPENDED
- BUSINESS_INACTIVE
- SUBSCRIPTION_LIMIT_REACHED
- INVALID_STATE_TRANSITION
- PURCHASE_ALREADY_RESPONDED
- REWARD_NOT_AVAILABLE
- REWARD_ALREADY_REDEEMED
- IDEMPOTENCY_CONFLICT
- VALIDATION_FAILED
- RESOURCE_NOT_FOUND
- TEMPORARY_UNAVAILABLE
- INTEGRATION_FAILED

**Governed taxonomy — Founder decision (`F9B-DEC-001`, 2026-08-07; resolves Architecture Review Finding F9b, `ENG-P2-ARCH-CORR-004`).** For the current MVP error contract, this is a **closed set of 14 categories**. Identity (and other domain) conflicts that are *not* idempotency-key conflicts — e.g. "record already exists", "reference already linked to a different identity" — shall map to the governed `VALIDATION_FAILED` category while retaining a specific bounded-domain error internally. `IDEMPOTENCY_CONFLICT` remains reserved **exclusively** for genuine idempotency-key conflicts. **No new general `CONFLICT` category is introduced.** A broader conflict category may be reconsidered only through a future *versioned* review of this governed error contract, and only if multiple capabilities demonstrate a recurring cross-domain requirement. This decision preserves the existing 14-category governed taxonomy unchanged and closes F9b.

# 11.36 Logging

Every server operation shall use structured logging.

Required fields include:

- correlation ID;
- command or event ID;
- domain;
- function name;
- actor ID;
- business ID where relevant;
- aggregate ID;
- result;
- duration;
- error category.

Logs shall not contain:

- passwords;
- OTP values;
- access tokens;
- full payment credentials;
- unnecessary private profile data.

# 11.37 Audit Generation

Privileged and commercial operations shall generate audit or Trust records.

Examples:

- role changed;
- business ownership transferred;
- Reward Program activated;
- Purchase Record corrected;
- reward cancelled;
- subscription manually restored;
- rule published;
- Knowledge Studio entry retired.

The Trust Domain shall own audit persistence standards.

# 11.38 Observability

Cloud Functions monitoring shall include:

- invocation count;
- success and failure rate;
- latency percentiles;
- cold-start rate;
- retry volume;
- transaction contention;
- event backlog;
- dead-letter count;
- idempotency conflict count;
- per-domain cost indicators.

Alerts shall be configured for critical workflows.

# 11.39 Performance Targets

Server-side targets under normal load:

- customer lookup: under 1 second;
- Purchase Record creation: under 2 seconds;
- customer verification response: under 2 seconds where synchronous processing completes;
- reward redemption: under 2 seconds;
- notification intent creation: under 1 second;
- reporting updates: eventual, generally under 60 seconds.

Where full processing cannot complete synchronously, the platform shall return a clear accepted or processing state rather than holding the request indefinitely.

# 11.40 Function Region Strategy

Cloud Functions and Firestore shall be deployed in compatible regions to minimize latency and cross-region cost.

Region choice shall consider:

- service availability;
- target-market latency;
- legal and data-residency needs;
- operational cost;
- disaster recovery.

All environments should use the same region strategy unless a documented exception exists.

# 11.41 Secret Management

Secrets shall be managed using approved server-side secret storage.

Secrets include:

- provider API keys;
- webhook signing secrets;
- email credentials;
- SMS credentials;
- administrative service keys.

Secrets shall not be:

- committed to source control;
- placed in frontend environment variables;
- logged;
- stored in Firestore documents.

# 11.42 Testing Requirements

Every domain service shall include:

## Unit Tests

Test:

- business rules;
- state transitions;
- validation;
- rule resolution;
- error mapping.

## Integration Tests

Test:

- Firestore transactions;
- repositories;
- event outbox;
- cross-domain events;
- idempotency.

## Emulator Tests

Use Firebase Emulator Suite for:

- Authentication;
- Firestore;
- Functions;
- Storage;
- Security Rules.

## Concurrency Tests

Test:

- duplicate verification;
- simultaneous redemption;
- competing active-cycle creation;
- repeated webhook delivery.

## Failure Tests

Test:

- partial processing;
- retries;
- outbox backlog;
- dead-letter transition;
- provider failure.

# 11.43 Deployment Requirements

Cloud Functions deployments shall:

- be environment-specific;
- run automated tests first;
- validate configuration;
- validate required secrets;
- support staged rollout where practical;
- preserve backward compatibility during rolling deployments;
- produce deployment reports.

Breaking command or event changes require versioned endpoints or consumers.

# 11.44 Functional Requirements

## FR-SRV-001

Critical business operations shall execute through trusted server services.

## FR-SRV-002

Business logic shall reside in reusable domain services rather than entry-point functions.

## FR-SRV-003

Every sensitive command shall support idempotency.

## FR-SRV-004

Cross-domain workflows shall use versioned events or defined service contracts.

## FR-SRV-005

Critical domain changes shall produce Trust Events.

## FR-SRV-006

Reward redemption shall be concurrency-safe.

## FR-SRV-007

Customer verification shall be traceable through Purchase Records, Verified Units and Loyalty Cycles.

## FR-SRV-008

Event publication shall use a reliable outbox or equivalent pattern.

## FR-SRV-009

Failed event processing shall support retries and dead-letter handling.

## FR-SRV-010

Rules Studio configuration shall be resolved through the Rules Service.

## FR-SRV-011

Commerce taxonomy shall be resolved through the Knowledge Service.

## FR-SRV-012

Server errors shall use standardized, translatable contracts.

## FR-SRV-013

All privileged operations shall be auditable.

## FR-SRV-014

Automated tests shall cover concurrency and duplicate processing.

## FR-SRV-015

Frontend code shall not be the authoritative executor of loyalty calculations.

# 11.45 Server Processing Rules

| Rule ID | Rule                                                                               |
| ------- | ---------------------------------------------------------------------------------- |
| SP-001  | Critical commercial state shall be modified only by trusted server services.       |
| SP-002  | Entry-point functions shall delegate business logic to domain services.            |
| SP-003  | Commands request actions; events describe completed facts.                         |
| SP-004  | Every sensitive command shall include an idempotency key.                          |
| SP-005  | Events shall be versioned and immutable.                                           |
| SP-006  | Cross-domain event publication shall use a reliable delivery mechanism.            |
| SP-007  | Reward redemption shall use atomic concurrency protection.                         |
| SP-008  | No event-processing failure shall disappear silently.                              |
| SP-009  | Configurable behaviour shall resolve through the Rules Service.                    |
| SP-010  | Canonical commercial classification shall resolve through the Knowledge Service.   |
| SP-011  | Technical errors shall not be exposed directly to users.                           |
| SP-012  | Customer-facing errors shall use translation keys.                                 |
| SP-013  | Structured logs shall include correlation identifiers.                             |
| SP-014  | Rule and event versions affecting commercial outcomes shall remain traceable.      |
| SP-015  | Synchronous workflows shall not wait for non-critical reporting or messaging work. |

# 11.46 Acceptance Criteria

This chapter is approved when:

- Trusted server authority is established.
- Function types and domain service boundaries are defined.
- Command and event contracts are standardized.
- Idempotency and concurrency controls are specified.
- Purchase verification, loyalty progression and redemption flows are traceable end to end.
- Event outbox, retries and dead-letter handling are accepted.
- Rules Studio and Knowledge Studio resolution responsibilities are defined.
- Error, logging and audit standards are established.
- Automated test requirements cover duplicate and concurrent operations.
- The architecture supports the MVP while remaining extensible to future Verified Commerce services.

# 11.47 Next Chapter

The next chapter should define:

# Authentication, Authorization and Security Rules Architecture

It will cover:

- Firebase Authentication methods;
- phone OTP and email authentication;
- user-account linking;
- role contexts;
- custom claims;
- Firestore Security Rules;
- Cloud Storage rules;
- App Check;
- session management;
- privileged reauthentication;
- account recovery;
- service identities;
- security logging;
- abuse controls;
- privacy boundaries;
- emergency access;
- security testing.