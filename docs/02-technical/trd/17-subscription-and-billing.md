> **Title:** TRD Chapter 17 — Subscription, Billing and Plan Enforcement  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/17-subscription-and-billing.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Technical Requirements Document

## PART X - Commercial Operations

# Chapter 17: Subscription, Billing and Plan Enforcement Architecture

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-16

# 17.1 Purpose

This chapter defines how 11thONUS shall manage business subscriptions, plan limits, billing, payment confirmation and access enforcement.

It establishes:

- subscription plans;
- product and staff limits;
- branch limits;
- trial management;
- upgrades and downgrades;
- country-specific pricing;
- currency handling;
- mobile-money billing;
- invoices and receipts;
- grace periods;
- failed payments;
- suspension;
- reactivation;
- refunds;
- billing audit;
- server-side entitlement enforcement;
- future regional payment-provider expansion.

The subscription architecture shall support simple B2B billing for the MVP while remaining extensible across Burundi, Rwanda, Uganda and Kenya.

# 17.2 Subscription Objectives

The subscription architecture shall ensure that:

- Businesses understand what each plan includes.
- Plan limits are enforced consistently on the server.
- Payment confirmation does not depend on client-side messages.
- Billing rules remain configurable by country and plan.
- Essential trust and security controls are available to all businesses.
- Upgrades are straightforward.
- Downgrades do not silently remove active business data.
- Failed payments follow a clear grace and suspension process.
- Subscription history remains auditable.
- Payment providers can change without altering the Subscription Domain.
- Business access can be restored safely after confirmed payment.
- Future enterprise and multi-branch plans can be added without redesign.

# 17.3 Subscription Philosophy

Businesses pay for platform capacity and enhanced business capabilities.

They do not pay for customer loyalty activity itself.

The platform should not penalize a business for successfully attracting more customers.

The initial subscription model should therefore avoid limits on:

- registered customers;
- verified purchases;
- customer verifications;
- earned rewards;
- On Us Moments.

Plans may limit:

- active Reward Programs;
- staff accounts;
- branches;
- reporting depth;
- exports;
- promotional tools;
- integrations;
- API access;
- support level.

# 17.4 Essential Controls Cannot Be Paywalled

Every active business plan shall include:

- customer verification;
- individual staff identities;
- secure role enforcement;
- purchase history;
- auditability;
- basic review workflows;
- basic redemption controls;
- core privacy and security protections.

Trust and security are platform foundations.

They shall not be removed from lower-priced plans.

# 17.5 Subscription Domain Responsibilities

The Subscription Domain shall own:

- subscription identity;
- plan assignment;
- subscription status;
- billing cycle;
- trial status;
- renewal date;
- plan entitlements;
- plan usage;
- upgrade and downgrade requests;
- grace period;
- suspension eligibility;
- billing history;
- invoice references;
- payment confirmation references.

The Integration Domain shall own provider-specific payment execution.

# 17.6 Plan Configuration

Plan behavior shall be governed through Rules Studio rather than hardcoded plan names.

Each plan shall define:

- plan ID;
- customer-facing name;
- internal version;
- country availability;
- billing intervals;
- Reward Program limit;
- staff limit;
- branch limit;
- reporting level;
- export entitlement;
- integration entitlement;
- API entitlement;
- promotion entitlement;
- support level;
- trial eligibility;
- status.

# 17.7 Initial Plan Direction

The working structure may include three plans.

## Starter

Designed for micro and small businesses.

Possible limits:

- up to 10 active Reward Programs;
- limited staff accounts;
- one branch;
- basic reporting;
- standard support.

## Growth

Designed for growing SMEs.

Possible limits:

- up to 20 active Reward Programs;
- more staff accounts;
- enhanced reporting;
- exports;
- broader permissions.

## Professional

Designed for larger operations.

Possible limits:

- more than 20 active Reward Programs;
- higher staff limits;
- future multi-branch support;
- advanced reporting;
- integrations;
- API access;
- priority support.

Final names, prices and numerical limits shall be set through the commercial plan catalogue.

# 17.8 Plan Entitlements

Entitlements shall be represented as capabilities and limits.

Example:

type PlanEntitlements = {  
rewardProgramLimit: number | null;  
staffLimit: number | null;  
branchLimit: number | null;  
reportingTier: "basic" | "enhanced" | "advanced";  
exportEnabled: boolean;  
integrationsEnabled: boolean;  
apiAccessEnabled: boolean;  
promotionsEnabled: boolean;  
prioritySupport: boolean;  
};

null may represent no configured limit.

Core domain code shall evaluate entitlement keys rather than plan names.

# 17.9 Country Pricing Catalogue

Pricing shall support country-specific configuration.

Each price entry shall include:

- plan ID;
- country code;
- currency code;
- billing interval;
- amount;
- tax treatment;
- effective date;
- expiry date;
- promotional eligibility;
- status;
- version.

Example:

type PlanPrice = {  
id: string;  
planId: string;  
countryCode: string;  
currencyCode: string;  
billingInterval: "monthly" | "quarterly" | "annual";  
amountMinor: number;  
taxMode: "inclusive" | "exclusive" | "not_applicable";  
effectiveFrom: Timestamp;  
effectiveUntil?: Timestamp;  
status: "draft" | "active" | "retired";  
version: number;  
};

Pricing shall not be hardcoded in the frontend.

# 17.10 Currency Handling

Initial target currencies include:

- BIF;
- RWF;
- UGX;
- KES.

All billing records shall store:

- currency code;
- integer amount;
- country;
- applied pricing version;
- tax basis where applicable.

The platform shall not recalculate historical invoices using current prices.

# 17.11 Trial Architecture

The platform shall support controlled trials.

A trial may be limited by:

- time;
- verified Purchase Record volume;
- business activation date;
- country;
- campaign;
- plan.

Example:

30 days or 100 verified Purchase Records, whichever occurs first.

The exact rule shall be configurable.

# 17.12 Trial Statuses

A trial subscription may exist in:

- Eligible;
- Pending Activation;
- Active;
- Nearing End;
- Ended;
- Converted;
- Suspended.

The user interface should present simple wording rather than internal statuses.

# 17.13 Trial Activation

A trial should begin only when the configured activation condition occurs.

Potential conditions include:

- business onboarding completed;
- first Reward Program activated;
- first Purchase Record created;
- owner manually starts trial.

The final condition shall be governed through Rules Studio.

# 17.14 Trial Conversion

A business may convert from trial to paid subscription before trial expiry.

Conversion shall:

- preserve all business data;
- preserve Reward Programs;
- preserve staff;
- preserve customer activity;
- apply the selected plan;
- confirm payment server-side;
- record the conversion event;
- update business access.

No business should need to recreate its setup after paying.

# 17.15 Subscription Lifecycle

A subscription may move through:

Draft  
↓  
Trial  
↓  
Active  
↓  
Past Due  
↓  
Grace Period  
↓  
Suspended  
↓  
Reactivated  
<br/>or  
<br/>Cancelled  
↓  
Expired  
↓  
Archived

Every transition shall be governed and auditable.

# 17.16 Subscription Status Definitions

## Draft

Subscription record exists but is not operational.

## Trial

Business is operating under trial rules.

## Active

Payment and entitlement conditions are valid.

## Past Due

Payment was expected but not confirmed.

## Grace Period

Business retains temporary access while resolving payment.

## Suspended

New operational activity is blocked according to policy.

## Cancelled

Business or platform ended the subscription.

## Expired

Subscription period ended without renewal.

## Archived

Historical record only.

# 17.17 Grace Period

A configurable grace period may apply after payment failure or expiry.

During grace period, the platform may allow:

- read access;
- customer verification of previously recorded purchases;
- redemption of already earned rewards;
- report viewing;
- payment retry.

The platform may block:

- new Reward Program creation;
- new staff invitations;
- new Purchase Record creation after a defined point;
- advanced exports;
- promotional tools.

Exact restrictions shall be governed by Rules Studio.

# 17.18 Customer Protection During Billing Failure

A business payment problem shall not unfairly remove customer history.

Customer records shall remain visible.

The platform should preserve, subject to policy:

- verified progress;
- earned rewards;
- previous On Us Moments;
- customer purchase history.

Rules for redemption during business suspension are defined in §17.20, per `DEC-LOY-011` (CONFIRMED).

# 17.19 Recommended Suspension Policy

For the MVP, a suspended business should normally:

- stop recording new Purchase Records;
- stop creating new Reward Programs;
- stop inviting staff;
- lose access to advanced reports and paid features;
- retain read-only access to billing and historical data.

Customer verification of already-recorded Purchase Records may remain available for a limited policy window.

Earned rewards should remain visible. Redemption during suspension is governed explicitly by §17.20.

# 17.20 Reward Liability During Suspension

**Traceability:** the requirement below reflects `DEC-LOY-011` — "Reward redemption during business suspension" — recorded **CONFIRMED** in the [Decision Register](../../00-governance/decisions/decision-register.md) (Founder resolution, `DEC-LEGAL-002-FOUNDER-DISP-001`, 2026-08-29: Option (a) as the default, subject to governed exceptions). The Decision Register entry is the authoritative record of the decision itself, including the historical A–D options considered and the Founder's disposition text in full; this section states the resulting technical requirement.

The platform must distinguish between:

- platform access;
- business responsibility to honour earned rewards.

Suspending the software subscription does not automatically erase valid customer rewards.

The business remains responsible for rewards already earned under active Reward Programs, subject to the governing commercial terms.

**Redemption during suspension — default rule.** Valid rewards earned before a Business's suspension remain redeemable during suspension by default. Suspension arising solely from the Business's commercial or subscription relationship with 11thONUS (including subscription/payment status) shall not, by itself, block redemption of otherwise valid earned rewards.

**New activity vs. redemption.** Suspension may restrict new loyalty activity (new Purchase Records, new Reward Programs, and the other capabilities listed in §17.19) per the suspension policy already stated there. Restricting new activity does not, by itself, extend to blocking redemption of rewards already earned before suspension.

**Governed exceptions.** Redemption may nevertheless be restricted, paused, or subject to additional review where the specific reason for suspension makes continued redemption inappropriate or unsafe — including circumstances involving suspected fraud, security or integrity concerns, legal or regulatory requirements, disputed reward validity, or another governed exception. Manual review is not the default treatment. **The exception-handling workflow — how such restriction or review is triggered, evaluated, and resolved — is not designed by this requirement and is a future implementation gap**, to be addressed by a separate, later-governed engineering work package, not inferred here.

**Responsibility.** The participating Business remains responsible for fulfilment of its reward obligations. Continued redemption does not make 11thONUS the guarantor or fulfiller of the reward.

# 17.21 Subscription Usage

The Subscription Domain shall maintain plan-usage projections such as:

- active Reward Programs;
- active staff memberships;
- active branches;
- monthly exports;
- integration usage;
- API usage.

Usage projections shall be:

- server-controlled;
- rebuildable;
- traceable to authoritative records;
- checked before capacity-changing actions.

# 17.22 Server-Side Entitlement Enforcement

The server shall validate entitlements before actions such as:

- activating a Reward Program;
- inviting staff;
- creating a branch;
- exporting a report;
- enabling an integration;
- issuing API credentials.

The frontend may show current limits but is not authoritative.

# 17.23 Reward Program Limit Enforcement

When a business reaches its active Reward Program limit:

- existing active programs remain unchanged;
- new activation is blocked;
- draft creation may remain allowed if policy permits;
- the business receives a clear upgrade message;
- no data is deleted.

The count shall include only statuses defined by the plan rule, normally active and possibly paused programs.

# 17.24 Staff Limit Enforcement

When a business reaches its active staff limit:

- existing memberships remain active;
- new invitation or activation is blocked;
- removed or suspended memberships do not count if policy says so;
- the owner receives a clear explanation;
- no historical staff activity is removed.

# 17.25 Branch Limit Enforcement

The MVP may support one branch while retaining branch-ready data structures.

When multi-branch functionality is introduced:

- branch limits shall be enforced server-side;
- archived branches shall not count;
- historical Purchase Records remain linked to their original branch;
- downgrades shall not silently merge branches.

# 17.26 Upgrade Flow

A plan upgrade shall:

- show the current plan;
- show the target plan;
- show pricing and billing impact;
- require owner authority;
- initiate payment if required;
- wait for server-side payment confirmation;
- apply new entitlements;
- record plan and pricing versions;
- notify the owner.

Upgrades may take effect immediately after confirmed payment.

# 17.27 Upgrade Proration

The MVP may avoid complex proration by applying one of these policies:

- upgrade starts a new billing period immediately;
- upgrade applies at the next renewal;
- manually calculated upgrade difference.

The chosen policy shall be defined by country and provider capability.

Complex proration should not be introduced unless commercially necessary.

# 17.28 Downgrade Flow

A downgrade shall first validate whether current usage fits the lower plan.

Examples of blocking conditions:

- too many active Reward Programs;
- too many active staff members;
- too many branches;
- active integrations not supported by the target plan.

The business shall resolve excess usage before the downgrade becomes effective.

No system-driven deletion shall occur.

# 17.29 Scheduled Downgrades

A downgrade may be scheduled for the next renewal date.

The current plan remains active until then.

The platform should show:

- current plan;
- scheduled plan;
- effective date;
- unresolved capacity issues.

# 17.30 Cancellation

Business owners may request cancellation.

Cancellation may apply:

- immediately;
- at end of current billing period;
- after contractual notice.

The MVP should prefer end-of-period cancellation where practical.

The business shall receive clear information about:

- final access date;
- data retention;
- reward obligations;
- possible reactivation.

# 17.31 Reactivation

A suspended or expired business may reactivate by:

- selecting an available plan;
- resolving outstanding payment;
- receiving confirmed payment status;
- passing any required business-status checks;
- restoring eligible access;
- recording the reactivation.

Historical business data shall be preserved.

# 17.32 Payment Initiation

The Subscription Domain shall request payment through the Integration Domain.

A payment request shall include:

- business ID;
- subscription ID;
- plan ID;
- pricing version;
- amount;
- currency;
- country;
- billing interval;
- payer reference;
- idempotency key;
- payment purpose.

The client shall not choose an arbitrary payment amount.

# 17.33 Mobile-Money Payment Flow

A typical flow is:

Owner chooses plan  
↓  
Server calculates amount  
↓  
Integration Domain selects provider  
↓  
Mobile-money request initiated  
↓  
Owner approves on phone  
↓  
Provider sends callback  
↓  
Callback validated  
↓  
Payment marked confirmed  
↓  
Subscription activated or renewed  
↓  
Owner notified

The frontend shall treat the payment as pending until server confirmation.

# 17.34 Payment Statuses

A payment attempt may exist in:

- Created;
- Submitted;
- Pending Customer Approval;
- Confirmed;
- Failed;
- Timed Out;
- Cancelled;
- Reversed;
- Refunded;
- Requires Review.

Provider statuses shall map to standard internal statuses.

# 17.35 Payment Idempotency

The platform shall prevent:

- duplicate payment requests;
- duplicate renewal activation;
- duplicate provider callback processing;
- duplicate invoice issuance.

Every payment attempt shall use an idempotency key and provider reference.

# 17.36 Payment Retry

A failed or timed-out payment may be retried through:

- same provider;
- fallback provider;
- different supported payment method.

A retry shall create a new payment attempt linked to the same billing obligation.

The platform shall not overwrite the failed attempt.

# 17.37 Billing Obligation

The platform should distinguish between:

- subscription;
- billing period;
- payment attempt;
- invoice;
- receipt.

One billing period may have multiple payment attempts but only one successful settlement.

# 17.38 Invoice Architecture

Invoices shall include:

- invoice number;
- business;
- billing address where required;
- country;
- currency;
- plan;
- billing period;
- subtotal;
- tax;
- total;
- pricing version;
- status;
- issue date;
- due date;
- payment reference.

Invoice numbering shall follow country and legal requirements where applicable.

# 17.39 Invoice Statuses

Suggested statuses:

- Draft;
- Issued;
- Due;
- Paid;
- Partially Paid;
- Void;
- Refunded;
- Written Off.

The MVP may use a simpler subset if local requirements permit.

# 17.40 Receipts

A receipt shall be generated after confirmed payment.

It shall include:

- receipt number;
- invoice reference;
- amount paid;
- currency;
- provider;
- payment reference;
- confirmation date;
- business name;
- 11thONUS legal entity details.

The receipt should be available in the business billing area.

# 17.41 Billing Documents

Billing documents should be:

- downloadable;
- securely stored;
- permission-controlled;
- immutable after issuance except through credit-note or void processes;
- traceable to payment records.

PDF generation may use background jobs.

# 17.42 Tax Configuration

Tax treatment shall be configurable by country.

The architecture shall support:

- tax-inclusive pricing;
- tax-exclusive pricing;
- tax-exempt plans;
- tax registration numbers;
- invoice tax lines;
- future e-invoicing integration.

The MVP implementation shall reflect actual launch-country legal requirements.

# 17.43 Refunds

Refunds may be required for:

- duplicate payment;
- incorrect amount;
- failed activation;
- approved commercial exception.

Refunds shall:

- require privileged authorization;
- pass through the Integration Domain;
- reference the original payment;
- preserve the original payment record;
- create a refund record;
- update billing status;
- generate audit events.

# 17.44 Chargebacks and Reversals

Where supported by providers, payment reversal or chargeback events shall:

- create a new financial event;
- not delete the original payment;
- move the subscription into review where necessary;
- notify billing administrators;
- preserve audit history.

# 17.45 Manual Payment Confirmation

The platform should avoid manual payment confirmation where provider verification is available.

Where manual confirmation is necessary, it shall require:

- elevated permission;
- evidence reference;
- payment amount;
- provider or bank reference;
- reason;
- approver;
- audit record.

Manual confirmation shall not be available to ordinary business owners.

# 17.46 Subscription Notifications

Business owners should receive:

- trial-start confirmation;
- trial-ending reminders;
- payment request;
- payment pending;
- payment success;
- payment failure;
- renewal reminder;
- grace-period warning;
- suspension notice;
- reactivation confirmation;
- downgrade confirmation;
- cancellation confirmation.

These are operational or transactional messages, not marketing.

# 17.47 Billing Quiet-Hour Exception

Critical billing notices may be sent outside normal marketing quiet hours where necessary, but routine reminders should respect business communication preferences.

# 17.48 Plan Change Audit

Every plan change shall record:

- previous plan;
- new plan;
- previous entitlements;
- new entitlements;
- effective date;
- billing impact;
- pricing version;
- actor;
- payment reference;
- reason;
- correlation ID.

# 17.49 Rules Studio Responsibilities

Rules Studio shall govern configurable subscription behavior such as:

- plan limits;
- trial duration;
- trial volume threshold;
- grace period;
- suspension delay;
- reminder timing;
- upgrade policy;
- downgrade policy;
- available billing intervals;
- country-specific provider options.

Rules Studio shall not directly alter settled historical billing records.

# 17.50 Feature Flags and Pilot Plans

The platform may support:

- pilot plans;
- partner plans;
- promotional plans;
- internal test plans;
- enterprise plans.

These shall use the same entitlement architecture.

One-off code branches for individual businesses should be avoided.

# 17.51 Complimentary and Sponsored Plans

The platform may grant temporary or sponsored access.

Such access shall include:

- sponsor or reason;
- effective period;
- entitled plan;
- approving administrator;
- renewal behavior;
- audit trail.

Complimentary access shall not be implemented by falsifying payment records.

# 17.52 Subscription Security

Only authorized users may:

- view detailed billing history;
- initiate plan changes;
- change payer details;
- cancel subscription;
- download invoices;
- request refunds.

Sensitive billing changes should require recent authentication.

# 17.53 Billing Data Privacy

Payment records shall store only the minimum required provider and payer references.

The platform shall not store:

- mobile-money PINs;
- full card data;
- OTP values;
- provider access credentials.

# 17.54 Billing Monitoring

The platform shall monitor:

- payment success rate;
- payment confirmation time;
- callback failures;
- duplicate callbacks;
- renewal rate;
- past-due businesses;
- grace-period businesses;
- suspension rate;
- reactivation rate;
- provider availability;
- revenue by country and plan;
- billing-support cases.

# 17.55 Financial Reporting Boundary

The Subscription Domain shall provide subscription and payment records.

It shall not become a full accounting system.

Future finance integrations may export:

- invoices;
- receipts;
- payment summaries;
- refund records;
- revenue reports.

Accounting classification remains outside the core MVP unless specifically required.

# 17.56 Data Model Extensions

Recommended additional collections include:

/subscriptionPlans  
/planVersions  
/planPrices  
/subscriptions  
/subscriptionPeriods  
/paymentAttempts  
/invoices  
/receipts  
/refunds  
/entitlementUsage

The exact schema shall follow the data architecture standards defined in Chapter 10.

# 17.57 Plan Versioning

Plans shall be versioned.

A plan version shall preserve:

- limits;
- features;
- support level;
- effective period;
- country availability.

Existing subscriptions should remain traceable to the plan version active at the time.

# 17.58 Price Versioning

Price changes shall create new price versions.

Historical invoices shall reference the applied price version.

The platform shall not rewrite old invoices when prices change.

# 17.59 Entitlement Resolution

A shared Subscription Entitlement Service shall return effective entitlements.

Example:

type EntitlementResolution = {  
subscriptionId: string;  
planId: string;  
planVersionId: string;  
status: string;  
entitlements: Record&lt;string, boolean | number | string | null&gt;;  
validUntil?: Timestamp;  
evaluatedAt: Timestamp;  
};

Operational domains shall consume this service rather than reading plan documents directly.

# 17.60 Entitlement Caching

Entitlement results may be cached briefly for performance.

Sensitive capacity-changing operations shall validate against current authoritative subscription state.

A stale cache shall not allow a business to exceed plan limits.

# 17.61 Subscription Enforcement by Domain

## Reward Program Domain

Checks active Reward Program limit before activation.

## Identity Domain

Checks active staff and branch limits.

## Reporting Domain

Checks report and export entitlements.

## Integration Domain

Checks integration and API access.

## Search and Promotion Domains

Check future discovery and promotion entitlements where applicable.

# 17.62 Downgrade Protection

A downgrade shall never:

- delete Reward Programs;
- remove staff history;
- merge branches;
- erase reports;
- cancel customer progress;
- invalidate earned rewards.

The system may require selected items to be paused or deactivated before the downgrade.

# 17.63 Subscription Suspension and Offline Queue

If a staff device was offline before suspension, queued Purchase Records shall be revalidated during synchronization.

They may fail if:

- the business is suspended;
- the grace policy no longer permits new records;
- the Reward Program is inactive;
- the staff membership was removed.

The frontend shall present clear failure reasons.

# 17.64 Subscription Testing

Testing shall include:

## Plan Tests

- Reward Program limits;
- staff limits;
- branch limits;
- feature entitlements.

## Trial Tests

- activation;
- expiry;
- conversion;
- volume threshold.

## Payment Tests

- pending;
- confirmed;
- failed;
- duplicate callback;
- retry;
- refund.

## Lifecycle Tests

- active to past due;
- grace period;
- suspension;
- reactivation;
- cancellation.

## Concurrency Tests

- simultaneous plan upgrades;
- repeated callbacks;
- duplicate invoice generation;
- competing Reward Program activation.

## Country Tests

- pricing;
- currency;
- provider routing;
- tax display.

# 17.65 Functional Requirements

## FR-SUB-001

Businesses shall subscribe through versioned plan and pricing configurations.

## FR-SUB-002

Plan limits shall be enforced server-side.

## FR-SUB-003

Core trust and security controls shall be included in all active plans.

## FR-SUB-004

Plans shall limit capacity and premium capabilities rather than customer loyalty activity.

## FR-SUB-005

The platform shall support country-specific pricing and currencies.

## FR-SUB-006

Subscription activation shall require confirmed server-side payment status.

## FR-SUB-007

Trials shall support configurable time and usage limits.

## FR-SUB-008

Upgrades shall preserve existing business data and apply new entitlements after confirmation.

## FR-SUB-009

Downgrades shall be blocked while usage exceeds the target plan.

## FR-SUB-010

Downgrades shall not delete business or customer data.

## FR-SUB-011

The platform shall support grace periods and controlled suspension.

## FR-SUB-012

Customer history and earned rewards shall not be silently erased after billing failure.

## FR-SUB-013

Payment attempts shall be idempotent and auditable.

## FR-SUB-014

Invoices and receipts shall reference the applied plan and price versions.

## FR-SUB-015

Refunds and reversals shall preserve original payment records.

## FR-SUB-016

Entitlements shall be resolved through a shared server-side service.

## FR-SUB-017

Rules Studio shall govern configurable trial, grace and enforcement policies.

## FR-SUB-018

Production billing credentials shall remain within the Integration Domain and secure secret storage.

## FR-SUB-019

Billing documents shall be permission-controlled and securely retained.

## FR-SUB-020

Offline queued actions shall be revalidated against current subscription status.

# 17.66 Subscription and Billing Rules

| Rule ID | Rule                                                                                   |
| ------- | -------------------------------------------------------------------------------------- |
| SB-001  | Businesses are the paying subscribers; customers do not pay for basic participation.   |
| SB-002  | Plans shall not limit customer verification or earned loyalty activity.                |
| SB-003  | Essential trust and security controls shall not be paywalled.                          |
| SB-004  | Plan names shall not be used as hardcoded entitlement logic.                           |
| SB-005  | Payment is confirmed only through trusted server-side provider evidence.               |
| SB-006  | Client-side success messages are not proof of payment.                                 |
| SB-007  | Price and plan versions shall remain historically traceable.                           |
| SB-008  | Downgrades shall not silently delete or rewrite active business data.                  |
| SB-009  | Billing failure shall not erase customer progress or prior On Us Moments.              |
| SB-010  | Provider-specific logic shall remain within the Integration Domain.                    |
| SB-011  | Refunds and reversals shall create compensating records rather than deleting payments. |
| SB-012  | Capacity-changing actions shall validate current entitlements.                         |
| SB-013  | Complimentary access shall be explicitly governed and audited.                         |
| SB-014  | Suspended offline actions shall be revalidated before acceptance.                      |
| SB-015  | Historical invoices shall not change when pricing changes.                             |

# 17.67 Acceptance Criteria

This chapter is approved when:

- Subscription plans are represented as versioned entitlements rather than hardcoded names.
- Reward Program, staff and branch limits are defined as server-enforced capacities.
- Essential trust and security features remain available across all plans.
- Trial, upgrade, downgrade, grace, suspension and reactivation flows are documented.
- Country, currency and pricing versioning are supported.
- Mobile-money billing relies on confirmed server-side callbacks.
- Payment attempts, invoices, receipts and refunds remain distinct and auditable.
- Downgrades preserve business and customer history.
- Customer rewards and progress remain protected during billing failure.
- Rules Studio governs configurable subscription policy.
- Offline actions are revalidated against current subscription status.
- The architecture supports future enterprise, multi-branch and regional plans without redesign.

# 17.68 Next Chapter

The next chapter should define:

# Platform Administration, Knowledge Studio and Rules Studio Technical Architecture

It will cover:

- administrator roles;
- separated administrative permissions;
- business oversight;
- support workflows;
- Knowledge Studio data management;
- taxonomy moderation;
- translation governance;
- Rules Studio authoring;
- rule simulation;
- rule approval;
- scheduled activation;
- feature flags;
- audit requirements;
- emergency controls;
- bulk operations;
- administrative security;
- future Experience Studio and Intelligence Studio readiness.