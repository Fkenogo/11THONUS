**11thONUS**

**Technical Requirements Document (TRD)**

**Version 1.0**

**Governed By**

- 11thONUS Platform Constitution
- Product Requirements Document
- Commerce Knowledge Standard
- Platform Standards

**PART I**

**Platform Architecture**

**Chapter 1**

**Technical Philosophy**

The purpose of the Technical Requirements Document is to define how the 11thONUS platform shall be implemented while remaining faithful to the Platform Constitution and Product Requirements Document.

This document defines architecture rather than features.

Features evolve.

Architecture should endure.

The platform shall therefore favour modularity, scalability, configurability and long-term maintainability over short-term implementation convenience.

**Chapter 2**

**Architecture Principles**

These principles govern every engineering decision.

**TAP-001**

Constitution First

Every implementation must comply with the Platform Constitution.

When implementation conflicts with platform principles, implementation shall change.

The Constitution shall not.

**TAP-002**

Domain Before Technology

Business domains shall determine architecture.

Technology shall implement architecture.

Never the reverse.

**TAP-003**

Services Before Screens

User interfaces consume platform services.

Platform services do not depend on screens.

A screen is a presentation layer.

It is never the owner of business logic.

**TAP-004**

Configuration Before Code

Business behaviour should be configurable wherever practical.

Engineering implements reusable capabilities.

Rules Studio governs behaviour.

**TAP-005**

One Source of Truth

Every business concept has one authoritative owner.

Duplicate business logic is prohibited.

**TAP-006**

Event-Driven Processing

Platform behaviour shall be driven through events.

Events shall trigger workflows.

Not manual updates.

**TAP-007**

Immutable Historical Records

Historical operational events shall never be overwritten.

Corrections create additional events.

Never replacements.

**TAP-008**

Progressive Complexity

The platform should appear simple while remaining technically extensible.

Complexity belongs within platform services.

Not within customer experiences.

**TAP-009**

International by Default

Countries

Currencies

Languages

Timezones

Addresses

Phone Numbers

Tax

must never be hardcoded.

**TAP-010**

Human Governance

AI may recommend.

Rules may automate.

People remain responsible.

**Chapter 3**

**Domain-Driven Architecture**

11thONUS shall implement a Domain-Driven Design architecture.

Each domain owns:

- its business rules;
- its data;
- its services;
- its events;
- its APIs.

Domains communicate through well-defined service interfaces.

No domain shall directly manipulate another domain's internal state.

**Chapter 4**

**Platform Domains**

I think this is now one of the most important diagrams in the entire project.

11thONUS Platform

│

┌──────────────────────────────────────┐

│ Identity │

└──────────────────────────────────────┘

│

──────────────────────────────────────────────────────

Commerce Knowledge

Rules

Loyalty

Purchases

Rewards

Trust

Search

Notifications

Reporting

Administration

Intelligence

Each of these becomes an independent platform domain.

**Domain 1**

**Identity Domain**

Purpose

Manage identities.

Owns

Customers

Businesses

Staff

Authentication

Progressive KYC

Languages

Preferences

Consent

Communication

Future Wallet Identity

Identity owns identity.

Nobody else does.

**Domain 2**

**Commerce Knowledge Domain**

Purpose

Provide standard commercial knowledge.

Owns

Industries

Business Categories

Business Types

Reward Program Categories

Products

Services

Tags

Translations

Search Metadata

AI Metadata

Knowledge Studio governs this domain.

**Domain 3**

**Rules Domain**

Purpose

Govern business behaviour.

Owns

Reward Rules

Verification Rules

Country Rules

Subscription Rules

Notification Rules

Operational Rules

Rules Studio governs this domain.

**Domain 4**

**Purchase Domain**

Purpose

Implement the Purchase Verification Lifecycle.

Owns

Purchase Records

Purchase Review

Verification Status

Disputes

Corrections

Purchase Timeline

Pending Verification

Purchase Events

**Domain 5**

**Loyalty Domain**

Purpose

Implement the Customer-Verified Loyalty Engine.

Owns

Verified Units

Loyalty Cycles

Progress

Reward Eligibility

Cycle Completion

Cycle History

**Domain 6**

**Reward Domain**

Purpose

Manage reward delivery.

Owns

Reward Availability

Redemption

On Us Moments

Reward History

Future Gifts

Future Wallet Credits

**Domain 7**

**Trust Domain**

Purpose

Maintain platform integrity.

Owns

Trust Ledger

Operational Integrity

Trust Events

Audit

Reviews

Operational Indicators

Future Fraud Intelligence

**Domain 8**

**Search Domain**

Purpose

Business discovery.

Owns

Business Search

Category Search

Tag Search

Nearby Search

Future Marketplace Search

Search Ranking

Search Suggestions

**Domain 9**

**Notification Domain**

Purpose

Customer communication.

Owns

Push

Email

SMS

Future WhatsApp

Notification Preferences

Reminder Scheduling

Templates

Delivery Tracking

**Domain 10**

**Reporting Domain**

Purpose

Business intelligence.

Owns

Reports

Dashboards

Exports

Operational Health

Executive Analytics

Benchmarking

Future AI Insights

**Domain 11**

**Administration Domain**

Purpose

Platform administration.

Owns

Subscriptions

Business Approval

Support

Feature Flags

Knowledge Studio

Rules Studio

Platform Monitoring

**Domain 12**

**Intelligence Domain**

Purpose

Future intelligence.

Owns

AI Recommendations

Business Optimisation

Search Optimisation

Benchmarks

Behaviour Analysis

Future Predictive Services

**Chapter 5**

**Domain Communication Principles**

Domains communicate through published interfaces.

Never through direct database coupling.

Example

Purchase Domain

↓

publishes

Purchase Verified Event

↓

Loyalty Domain

consumes

↓

Verified Units Created

↓

Reward Domain

consumes

↓

Reward Available

↓

Notification Domain

consumes

↓

Customer Notification

↓

Trust Domain

records

Trust Event

This event-driven model ensures that domains remain independent while working together coherently.

**Chapter 6**

**Service Ownership Matrix**

| **Domain**         | **Owns**                        | **Consumes**                         |
| ------------------ | ------------------------------- | ------------------------------------ |
| Identity           | Users, Businesses, Staff        | Notifications                        |
| Commerce Knowledge | Categories, Products, Tags      | Search, Reporting                    |
| Rules              | Business Rules                  | All operational domains              |
| Purchase           | Purchase Records                | Identity, Rules                      |
| Loyalty            | Verified Units, Loyalty Cycles  | Purchase                             |
| Reward             | Reward Availability, Redemption | Loyalty                              |
| Trust              | Trust Events, Audit             | All domains                          |
| Search             | Discovery                       | Commerce Knowledge                   |
| Notification       | Messaging                       | Reward, Purchase                     |
| Reporting          | Analytics                       | All domains                          |
| Administration     | Platform Governance             | All domains                          |
| Intelligence       | Recommendations                 | Reporting, Trust, Commerce Knowledge |

This matrix becomes the reference for implementation boundaries.

**Chapter 7**

**Architectural Constraints**

To preserve platform integrity:

- Business logic must not reside in UI components.
- Firestore documents must not be updated directly from presentation layers.
- Cloud Functions shall enforce critical business rules.
- Customer-facing behaviour shall consume Rules Studio configuration where appropriate.
- Shared concepts shall be owned by one domain only.
- Cross-domain changes shall occur through events or well-defined service interfaces.
- Historical operational records shall remain immutable.

These constraints are mandatory and apply to every implementation.

**Next Chapter**

The next chapter will move from **logical architecture** to **physical architecture** by defining the Firebase implementation model, including:

- Firebase project structure
- Firestore domain boundaries
- Authentication architecture
- Cloud Functions architecture
- Cloud Storage
- Hosting
- Remote Config
- App Check
- Analytics
- Crash Reporting
- Performance Monitoring
- Environment strategy
- CI/CD foundation

**One final recommendation before we continue**

I think we should make one more architectural commitment that will shape the entire codebase:

**The codebase should mirror the platform domains.**

Instead of organising the project by screens or Firebase services, organise it by business domains.

For example:

src/

domains/

identity/

commerce-knowledge/

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

Each domain would contain its own models, services, hooks, Cloud Functions, validation, tests and documentation. This creates strong ownership boundaries, reduces coupling and makes the codebase much easier for both human developers and AI coding agents to understand. Combined with the Constitution, PRD and Platform Standards, it gives 11thONUS a genuinely enterprise-grade foundation while remaining perfectly suited to a Firebase-first implementation. I believe this will be one of the most valuable architectural decisions we make for the lifetime of the platform.