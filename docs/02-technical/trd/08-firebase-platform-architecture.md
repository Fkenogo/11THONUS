> **Title:** TRD Chapter 8 — Firebase Platform Architecture  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/08-firebase-platform-architecture.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

**11thONUS**

**Technical Requirements Document (TRD)**

**PART II**

**Physical Architecture**

**Chapter 8**

**Firebase Platform Architecture**

**8.1 Purpose**

This chapter defines how the logical platform architecture is implemented using Google's Firebase ecosystem.

Firebase is selected because it aligns with the principles established in the Platform Constitution:

- Serverless
- Event-driven
- Scalable
- Secure
- Mobile-first
- Cloud-native

Firebase is an implementation platform.

It is not the business architecture.

**8.2 Firebase Service Responsibilities**

Every Firebase service has a clearly defined responsibility.

| **Firebase Service**    | **Responsibility**                      |
| ----------------------- | --------------------------------------- |
| Firebase Authentication | Identity management                     |
| Cloud Firestore         | Operational data storage                |
| Cloud Functions         | Business logic and workflows            |
| Cloud Storage           | Images, documents and media             |
| Firebase Hosting        | PWA hosting                             |
| App Check               | Client integrity                        |
| Remote Config           | Runtime configuration and feature flags |
| Firebase Analytics      | Product analytics                       |
| Crashlytics             | Error reporting                         |
| Performance Monitoring  | Performance metrics                     |
| Cloud Messaging         | Push notifications                      |
| Cloud Scheduler         | Scheduled jobs (future)                 |
| Cloud Tasks             | Background task queues (future)         |
| Pub/Sub                 | Event distribution (future evolution)   |

No Firebase service should assume responsibilities belonging to another service.

**8.3 Environment Strategy**

The platform shall maintain isolated environments.

Development

↓

Testing

↓

Staging

↓

Production

Each environment shall have:

- Separate Firebase project
- Separate Firestore database
- Separate Storage bucket
- Separate Authentication tenant
- Separate Remote Config
- Separate Analytics configuration

Production data shall never be used for development or automated testing.

**8.4 Project Structure**

Engineering should mirror platform domains.

src/

domains/

identity/

commerceKnowledge/

rules/

purchases/

loyalty/

rewards/

trust/

notifications/

reporting/

search/

administration/

intelligence/

shared/

config/

infrastructure/

ui/

tests/

Every domain owns:

- models
- services
- repositories
- validation
- Cloud Functions
- events
- tests
- documentation

**8.5 Cloud Functions Architecture**

Cloud Functions implement business behaviour.

Cloud Functions shall:

- validate requests;
- enforce business rules;
- publish events;
- update owned domain data;
- write Trust Events;
- return deterministic results.

Cloud Functions shall not:

- contain UI logic;
- duplicate validation unnecessarily;
- update unrelated domains directly;
- bypass Rules Studio.

**Function Categories**

**Callable Functions**

Authenticated client actions.

Examples:

- Create Reward Program
- Record Purchase
- Verify Purchase
- Redeem Reward

**Event Functions**

React to Firestore events.

Examples:

Purchase Verified

↓

Create Verified Units

↓

Check Reward Eligibility

↓

Generate Reward

↓

Notify Customer

**Scheduled Functions**

Examples:

Reminder processing

Subscription renewals

Outstanding verification reminders

Birthday campaigns

Knowledge maintenance

**Administrative Functions**

Platform maintenance.

Migration.

Reporting.

Bulk processing.

Knowledge imports.

**8.6 Firestore Strategy**

Firestore shall be organised around domains rather than screens.

Every domain owns its collections.

No collection should have multiple owners.

Cross-domain access shall occur through services or events.

**Example**

Identity Domain

customers

businesses

staff

users

Commerce Knowledge Domain

industries

categories

businessTypes

rewardProgramCategories

products

services

tags

translations

Purchase Domain

purchaseRecords

purchaseReviews

purchaseDisputes

Loyalty Domain

loyaltyCycles

verifiedUnits

Reward Domain

rewards

rewardHistory

Trust Domain

trustEvents

auditLog

operationalReviews

Notification Domain

notifications

templates

deliveryLog

Administration Domain

subscriptions

featureFlags

platformSettings

supportTickets

Knowledge Studio

knowledgeSuggestions

knowledgeVersions

knowledgeApprovals

Rules Studio

ruleSets

ruleVersions

ruleHistory

**8.7 Firestore Document Standards**

Every document should contain standard metadata.

id

createdAt

createdBy

updatedAt

updatedBy

status

version

Where applicable:

businessId

customerId

countryCode

languageCode

deletedAt

deletedBy

These standards simplify auditing and debugging.

**8.8 Event Architecture**

Events are first-class citizens.

Examples:

Purchase Recorded

↓

Purchase Verified

↓

Verified Units Created

↓

Reward Available

↓

Reward Redeemed

↓

On Us Moment Completed

Every important event shall:

- have an Event ID;
- include a timestamp;
- identify the originating domain;
- identify the initiating actor;
- be written to the Trust Ledger.

This supports auditability and future event replay if required.

**8.9 Identity Architecture**

Authentication is implemented using Firebase Authentication.

Primary methods:

- Mobile Number (OTP)
- Email (optional)

Future methods:

- Google
- Apple
- Microsoft
- Enterprise Identity Providers

Authentication proves identity.

Authorisation is governed by the Identity Domain and Role-Based Access Control.

**8.10 Security Architecture**

Security operates in multiple layers.

**Layer 1**

Firebase Authentication

**Layer 2**

App Check

**Layer 3**

Firestore Security Rules

**Layer 4**

Cloud Function validation

**Layer 5**

Role-Based Access Control

**Layer 6**

Trust Ledger auditing

No single layer should be relied upon in isolation.

**8.11 Offline Strategy**

The MVP shall support resilient operation during temporary connectivity loss.

**Businesses**

May continue recording Purchase Records locally.

These records remain marked as:

**Pending Sync**

Until successfully synchronised.

**Customers**

May continue browsing previously synchronised information.

Purchase verification and reward redemption require successful synchronisation to preserve trust.

**Synchronisation Principles**

- Preserve order of events.
- Prevent duplicate submissions.
- Maintain idempotency.
- Clearly communicate sync status.

**8.12 Performance Targets**

The platform should target:

- App launch: <2 seconds on typical 4G connections
- Dashboard load: <3 seconds
- Purchase recording: <2 seconds under normal conditions
- Customer verification confirmation: <2 seconds
- Reward availability update: <3 seconds after verification
- Search results: <1 second for cached queries; <2 seconds for online queries

Performance monitoring should be continuous and measured in production.

**8.13 Observability**

Every domain should emit operational telemetry.

Metrics include:

- function execution time;
- Firestore read/write usage;
- authentication failures;
- notification delivery success;
- synchronisation failures;
- search performance;
- Trust Event generation;
- error rates.

Observability supports operational excellence rather than customer-facing functionality.

**8.14 Backup & Recovery**

Although Firebase provides durability, 11thONUS should implement additional operational safeguards.

The platform should support:

- scheduled Firestore exports;
- Storage backups;
- configuration exports (Knowledge Studio and Rules Studio);
- disaster recovery testing;
- documented restoration procedures.

Knowledge assets and platform rules are strategic assets and should be backed up independently of transactional data.

**8.15 Deployment Principles**

Deployments should follow a controlled pipeline.

Developer

↓

Pull Request

↓

Automated Tests

↓

Code Review

↓

Staging Deployment

↓

User Acceptance Testing

↓

Production Deployment

↓

Monitoring

↓

Rollback (if required)

Every deployment should be traceable, reversible and observable.

**8.16 Technical Constraints**

To preserve architectural integrity:

- UI components shall never contain critical business rules.
- Cloud Functions remain the authoritative execution layer for sensitive operations.
- Firestore collections must have a single owning domain.
- Rules Studio governs configurable behaviour.
- Knowledge Studio governs platform taxonomy.
- Trust Ledger records significant operational events.
- Event-driven communication is preferred over direct cross-domain updates.

These constraints are mandatory unless a documented architectural exception is approved.

**Recommendation: Introduce an Integration Gateway**

As we prepare for future phases, I recommend adding a **13th platform domain**:

**Integration Domain**

Its purpose is to isolate all external systems from the core business domains.

It would own:

- Mobile money integrations (Lumicash, EcoCash, Airtel Money, MTN MoMo, M-Pesa)
- POS integrations
- Accounting software integrations
- CRM integrations
- Email providers
- SMS gateways
- WhatsApp Business API
- Future banking APIs
- Public developer APIs

No core domain should communicate directly with external providers. Instead, they publish events or call well-defined interfaces exposed by the Integration Domain.

This keeps the core platform stable even if providers change, and it fits perfectly with the Domain-Driven architecture we've established. Given your long-term roadmap across Burundi, Rwanda, Uganda and Kenya-with different payment providers and business ecosystems-I believe this separation will save significant engineering effort and make the platform much easier to evolve.