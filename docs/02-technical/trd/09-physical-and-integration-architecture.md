> **Title:** TRD Chapter 9 — Integration Domain and External Systems Architecture  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/09-physical-and-integration-architecture.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

**11thONUS**

**Technical Requirements Document**

**PART II - Physical Architecture**

**Chapter 9: Integration Domain and External Systems Architecture**

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-8

**9.1 Purpose**

The Integration Domain provides the controlled boundary between the 11thONUS platform and all external systems.

It exists to prevent payment providers, messaging providers, POS platforms, accounting systems and third-party APIs from becoming tightly coupled to the core platform.

The core 11thONUS domains shall not integrate directly with external providers.

Instead, they shall communicate through standard interfaces owned by the Integration Domain.

This design allows external providers to be replaced, expanded or temporarily disabled without changing the core loyalty, purchase, reward or trust architecture.

**9.2 Core Principle**

External providers may change. The 11thONUS business architecture must remain stable.

A provider-specific implementation shall never become the platform's primary business model.

For example:

- the Subscription Domain should request payment collection;
- it should not contain Lumicash-specific logic;
- the Integration Domain selects the appropriate provider adapter;
- the provider response is translated into a standard 11thONUS result.

**9.3 Integration Domain Responsibilities**

The Integration Domain shall own:

- payment provider connections;
- mobile-money provider connections;
- SMS gateways;
- email providers;
- WhatsApp Business integrations;
- POS integrations;
- accounting integrations;
- CRM integrations;
- external identity-verification providers;
- public and partner APIs;
- inbound webhook processing;
- outbound integration events;
- provider credential management;
- retries and failure handling;
- integration health monitoring;
- provider-specific audit records;
- payload transformation;
- idempotency control;
- integration rate limiting.

**9.4 Integration Categories**

The platform shall distinguish between the following integration categories.

**9.4.1 Subscription Payment Integrations**

Used for business subscription billing.

Potential providers include:

- Lumicash;
- EcoCash;
- Airtel Money;
- MTN Mobile Money;
- M-Pesa;
- Pesapal;
- Flutterwave;
- bank-card processors;
- direct bank collection.

Subscription payment integrations shall remain separate from future customer wallet or purchase-payment capabilities.

**9.4.2 Messaging Integrations**

Used for:

- OTP delivery;
- purchase verification reminders;
- reward notifications;
- staff invitations;
- account recovery;
- business billing notices.

Potential channels include:

- SMS;
- email;
- push notifications;
- WhatsApp Business;
- future messaging channels.

**9.4.3 POS Integrations**

Future POS integrations may:

- submit Purchase Records;
- retrieve customer loyalty status;
- validate reward availability;
- record redemptions;
- reconcile commercial activity.

POS integrations shall use the same Purchase Verification Lifecycle as manually recorded purchases.

A POS-generated Purchase Record shall still require customer verification.

**9.4.4 Accounting and Reconciliation Integrations**

Future accounting or payment integrations may supply:

- daily sales totals;
- payment references;
- invoice references;
- transaction summaries;
- reconciliation results.

These integrations shall support operational comparison but shall not directly modify customer progress.

**9.4.5 CRM and Marketing Integrations**

Future CRM integrations may consume permitted business and customer engagement data.

Access shall be governed by:

- customer consent;
- business permissions;
- privacy policies;
- API scopes;
- country regulations.

**9.4.6 Identity and KYC Integrations**

Future identity services may support:

- phone-number verification;
- business verification;
- identity document validation;
- address verification;
- fraud investigation.

External verification results shall be recorded as governed evidence, not as unrestricted authority to alter platform identity.

**9.4.7 Public and Partner APIs**

Future APIs may support:

- POS providers;
- franchise systems;
- approved business partners;
- third-party applications;
- enterprise customers;
- regional integrations.

Public APIs shall never expose unrestricted Firestore access.

**9.5 Adapter Architecture**

Every external provider shall be implemented through a provider adapter.

The adapter converts between:

- the standard 11thONUS integration contract; and
- the provider-specific API.

Example:

Subscription Service

↓

Payment Gateway Interface

↓

Country and Provider Resolution

↓

Provider Adapter

↓

Lumicash / EcoCash / M-Pesa / Other

Core domains shall depend on the standard interface, not the provider adapter.

**9.6 Standard Integration Interfaces**

The Integration Domain should expose stable internal interfaces.

**Payment Gateway Interface**

Typical operations:

- initiate payment;
- check payment status;
- cancel payment where supported;
- issue refund where supported;
- validate provider callback;
- retrieve transaction;
- reconcile payment.

**Messaging Gateway Interface**

Typical operations:

- send OTP;
- send transactional notification;
- send reminder;
- retrieve delivery status;
- process delivery callback.

**POS Gateway Interface**

Typical operations:

- register integration;
- authenticate integration;
- submit Purchase Record;
- validate customer;
- retrieve Reward Program;
- check reward availability;
- submit redemption;
- retrieve status.

**KYC Gateway Interface**

Typical operations:

- submit verification request;
- retrieve verification status;
- process verification callback;
- store verification evidence reference.

**9.7 Provider Configuration**

Provider selection shall be governed through configuration rather than application code.

Configuration may vary by:

- country;
- currency;
- transaction type;
- channel;
- subscription plan;
- availability;
- provider priority;
- fallback order.

Example:

Country: Burundi

Subscription payment priority:

1\. Lumicash

2\. EcoCash

3\. Card provider

The Rules Domain shall determine which provider configurations are available.

The Integration Domain shall execute the selected configuration.

**9.8 Country and Currency Routing**

The Integration Domain shall route requests using explicit country and currency information.

Required context may include:

- country code;
- currency code;
- customer or business phone country;
- provider availability;
- transaction purpose;
- amount;
- applicable fees;
- tax context where required.

Country routing shall never rely only on device location.

**9.9 Webhook Architecture**

External providers commonly send asynchronous callbacks.

All inbound callbacks shall pass through a controlled webhook gateway.

The webhook gateway shall:

- identify the provider;
- validate the signature;
- validate the event structure;
- reject replayed events;
- store the raw callback securely where permitted;
- assign an internal event ID;
- convert the callback into a standard internal event;
- publish it to the appropriate domain;
- return the expected provider response.

Provider callbacks shall never update loyalty progress directly.

**9.10 Idempotency**

Every integration operation that may be retried shall support idempotency.

Examples include:

- subscription payments;
- Purchase Record imports;
- reward redemptions;
- webhook processing;
- notification delivery requests.

The platform shall prevent:

- duplicate charges;
- duplicate Purchase Records;
- duplicate redemptions;
- duplicate internal events.

Each request should include or receive an idempotency key.

**9.11 Retry Policy**

Transient failures should be retried according to a controlled policy.

Retry behaviour shall include:

- maximum attempt count;
- increasing delay between attempts;
- retryable error classification;
- non-retryable error classification;
- final failure state;
- operational alerting.

The platform shall not retry indefinitely.

**9.12 Dead-Letter Handling**

Events that cannot be processed after the permitted retries shall enter a dead-letter workflow.

The dead-letter workflow shall record:

- original request;
- provider;
- failure reason;
- retry count;
- last attempt;
- affected business or customer;
- required intervention.

Dead-letter events shall be reviewable by authorized administrators.

**9.13 Integration Status Model**

Each integration request shall have a clear state.

Suggested states include:

- Created;
- Submitted;
- Pending;
- Confirmed;
- Failed;
- Cancelled;
- Reversed;
- Timed Out;
- Requires Review.

Provider-specific states shall be mapped to these internal states.

**9.14 Subscription Payment Flow**

The initial payment use case is B2B subscription collection.

A typical subscription payment flow is:

Business chooses plan

↓

Subscription Domain calculates amount

↓

Integration Domain selects provider

↓

Provider payment request initiated

↓

Business completes mobile-money approval

↓

Provider sends callback

↓

Integration Domain validates callback

↓

Payment confirmed

↓

Subscription Domain activates or renews plan

↓

Trust and audit events recorded

↓

Business notified

Subscription activation shall depend on a confirmed internal payment state, not a client-side success message.

**9.15 Payment Data Requirements**

A payment record should include:

- internal payment ID;
- business ID;
- subscription ID;
- country;
- currency;
- amount;
- provider;
- provider reference;
- payer reference;
- payment purpose;
- status;
- initiated timestamp;
- confirmed timestamp;
- failure reason;
- idempotency key;
- webhook references;
- audit metadata.

Sensitive payment credentials must not be stored in Firestore.

**9.16 Messaging Architecture**

The Notification Domain owns what must be communicated.

The Integration Domain owns how the message is delivered.

Example:

Notification Domain:

"Send purchase verification reminder"

↓

Integration Domain:

Select push, SMS, email or WhatsApp provider

↓

Provider Adapter:

Deliver message and return status

This separation prevents notification business logic from becoming dependent on one provider.

**9.17 Language-Aware Messaging**

Every outbound customer-facing message shall include a language context.

The system shall attempt delivery in this order:

- customer-selected language;
- business-supported language where relevant;
- country default language;
- English fallback.

Message templates shall be managed outside provider adapters.

Providers receive the final rendered content.

**9.18 Integration Credentials**

Provider credentials shall:

- be stored in secure secret management;
- never be committed to source control;
- never be stored in client applications;
- be separated by environment;
- be rotated periodically;
- be accessible only to authorized server processes.

Production credentials shall never be used in development or testing.

**9.19 Security Requirements**

All integrations shall use:

- encrypted transport;
- provider authentication;
- webhook signature validation;
- request validation;
- rate limiting;
- replay protection;
- audit logging;
- least-privilege credentials.

Integration failures shall not expose internal stack traces or secret values.

**9.20 Privacy Requirements**

External providers shall receive only the minimum information required to perform the requested service.

Examples:

- an SMS provider receives the phone number and message;
- it does not receive the customer's full loyalty history;
- a payment provider receives payment context;
- it does not receive unrelated profile interests;
- a POS receives authorized loyalty data;
- it does not receive activity from other businesses.

**9.21 Integration Monitoring**

The platform shall monitor:

- request volume;
- provider success rate;
- latency;
- webhook delays;
- retry rates;
- dead-letter volume;
- authentication failures;
- payment confirmation time;
- messaging delivery rate;
- provider availability.

Monitoring should support filtering by:

- provider;
- country;
- environment;
- integration type;
- error category.

**9.22 Provider Health and Failover**

The platform shall maintain internal provider health indicators.

Where more than one provider supports the same capability, the Rules Domain may define fallback behaviour.

Example:

Primary SMS provider unavailable

↓

Retry according to policy

↓

Fallback provider selected

↓

Message resent using same internal notification ID

Failover must preserve idempotency and auditability.

**9.23 Integration Testing**

Each provider adapter shall include:

- unit tests;
- contract tests;
- sandbox tests;
- webhook validation tests;
- failure-path tests;
- retry tests;
- idempotency tests.

Production activation shall require successful testing against the provider's sandbox or certification process where available.

**9.24 Integration Versioning**

Provider APIs change.

Each adapter shall therefore declare:

- provider;
- adapter version;
- supported provider API version;
- activation date;
- deprecation date;
- migration status.

Provider upgrades shall not require changes to core domain interfaces unless the platform capability itself changes.

**9.25 Public API Standards**

Future public APIs shall use:

- explicit versioning;
- scoped authentication;
- rate limits;
- request IDs;
- idempotency keys;
- standardized error responses;
- audit logging;
- data minimization.

Example:

/api/v1/purchases

/api/v1/rewards

/api/v1/customers/lookup

The specific API design will be defined in the API and Integration Guide.

**9.26 Service Accounts**

Automated integrations shall use service identities rather than human accounts.

Each service identity shall have:

- unique ID;
- owning partner;
- permitted scopes;
- environment;
- status;
- credential rotation history;
- audit trail.

Service accounts shall not inherit business-owner permissions.

**9.27 Future Verified Wallet Boundary**

The future Verified Wallet shall use the Integration Domain for external money movement but shall remain a distinct financial domain.

The Integration Domain may connect to:

- banks;
- mobile-money providers;
- card networks;
- payment processors.

It shall not own:

- customer wallet balances;
- wallet accounting;
- customer payment authorization;
- internal financial ledger rules.

Those responsibilities will belong to a future Wallet Domain.

**9.28 Future Gift Architecture**

Verified Gift Cards and gifted On Us Moments may use the Integration Domain for:

- recipient notifications;
- external delivery channels;
- optional payment collection;
- partner redemption systems.

The underlying gift and reward ownership remain within the Reward Domain.

**9.29 Functional Requirements**

**FR-INT-001**

The system shall isolate all external providers behind Integration Domain interfaces.

**FR-INT-002**

Core domains shall not contain provider-specific implementation logic.

**FR-INT-003**

Every provider shall be implemented through a versioned adapter.

**FR-INT-004**

All inbound webhooks shall be authenticated and validated.

**FR-INT-005**

Retryable integration operations shall support idempotency.

**FR-INT-006**

Failed events shall enter a controlled retry or dead-letter workflow.

**FR-INT-007**

Provider credentials shall remain server-side and securely stored.

**FR-INT-008**

The platform shall support country-based provider routing.

**FR-INT-009**

External providers shall receive only the minimum required data.

**FR-INT-010**

Integration requests and responses shall remain auditable.

**FR-INT-011**

Subscription activation shall rely on confirmed server-side payment status.

**FR-INT-012**

Future POS Purchase Records shall follow the same customer-verification rules as manual records.

**FR-INT-013**

Public APIs shall use scoped access and explicit versioning.

**FR-INT-014**

The architecture shall support multiple providers for the same capability.

**9.30 Integration Business Rules**

| **Rule ID** | **Rule**                                                                             |
| ----------- | ------------------------------------------------------------------------------------ |
| IR-001      | External provider logic shall remain outside core business domains.                  |
| IR-002      | Provider callbacks shall never directly alter loyalty progress.                      |
| IR-003      | Every asynchronous integration event shall be idempotent.                            |
| IR-004      | Provider-specific status values shall be mapped to standard internal statuses.       |
| IR-005      | Production credentials shall never be exposed to client applications.                |
| IR-006      | A client-side payment message shall not be treated as proof of payment.              |
| IR-007      | All external Purchase Records remain subject to customer verification.               |
| IR-008      | External integration failures shall not corrupt core platform state.                 |
| IR-009      | Every integration action shall retain an internal correlation ID.                    |
| IR-010      | Personal data shared externally shall be limited to what is operationally necessary. |

**9.31 Acceptance Criteria**

This chapter is approved when:

- The Integration Domain is recognized as the exclusive external-system boundary.
- Provider adapters are accepted as the standard implementation pattern.
- Subscription payment routing is defined.
- Webhook validation and idempotency requirements are clear.
- Retry and dead-letter handling are established.
- Messaging-provider responsibilities are separated from notification logic.
- Future POS, CRM, accounting, KYC and public API boundaries are defined.
- Security, privacy and credential standards are accepted.
- Future Wallet and Gift capabilities can extend the architecture without placing financial ownership inside the Integration Domain.

**9.32 Next Chapter**

The next chapter should define:

**Firestore Data Architecture and Domain Ownership**

It will establish:

- authoritative collections;
- document structures;
- references and denormalization;
- immutable event records;
- collection ownership;
- customer and business isolation;
- indexing strategy;
- pagination;
- soft deletion;
- data retention;
- timestamp standards;
- multilingual data structures;
- country and currency fields;
- future migration and versioning requirements.