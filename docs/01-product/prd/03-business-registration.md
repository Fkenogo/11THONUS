> **Title:** PRD Section 3 — Business Registration, Subscription and Onboarding  
> **Version:** 1.0 · **Status:** Draft for review (pre-freeze) · **Classification:** Authoritative Product  
> **Governing document:** 11thONUS Platform Constitution  
> **Source-of-truth path:** `docs/01-product/prd/03-business-registration.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Product Requirements Document

# Stage 2 - Functional Requirements

## Section 3: Business Registration, Subscription and Onboarding

**Version:** 1.0

# 1\. Purpose

This section defines how businesses join the 11thONUS ecosystem, become verified subscribers, configure their loyalty program and prepare their staff before serving customers.

The onboarding experience must be extremely simple.

A small café, salon or car wash owner should be able to complete onboarding and begin recording purchases within approximately 15 minutes.

The objective is not simply to register a business.

The objective is to get the business successfully operating its first loyalty program.

# 2\. Design Objectives

Business onboarding should:

- minimise friction;
- require only essential information initially;
- progressively collect additional information later;
- clearly explain the value of customer-verified loyalty;
- guide businesses to a successful first transaction;
- avoid overwhelming users with configuration options;
- work comfortably on a smartphone.

# 3\. Business Registration Philosophy

A business does not simply subscribe to software.

A business joins the 11thONUS network.

By joining, the business commits to:

- recognising loyal customers;
- honouring eligible rewards;
- recording purchases honestly;
- respecting customer verification;
- maintaining accurate Reward Programs.

# 4\. Business Lifecycle

Every business shall exist in one lifecycle state.

## Draft

Registration started.

Business profile incomplete.

## Pending Verification

Required registration completed.

Awaiting platform verification where applicable.

## Trial

Business may begin operating under trial rules.

## Active

Subscription valid.

Business fully operational.

## Suspended

Business access restricted.

## Expired

Subscription ended.

Operational features disabled.

## Closed

Business permanently closed.

Commercial history retained.

## Archived

Historical records retained.

No operational activity.

# 5\. Business Registration Flow

## Step 1

Create owner account (or sign in).

## Step 2

Create business.

Business Name

Business Category

Country

City

## Step 3

Business contact information.

## Step 4

Select subscription plan.

## Step 5

Accept Business Terms.

## Step 6

Create first Reward Program.

## Step 7

Invite staff (optional).

## Step 8

Complete onboarding checklist.

## Step 9

Business becomes operational.

# 6\. Required Business Information

Mandatory

Business Name

Business Category

Country

City

Business Phone

Owner

Subscription Plan

Business Address

Terms Acceptance

Optional

Website

Social Media

Logo

Business Description

Operating Hours

Email

Tax Number

Registration Number

These optional fields may become mandatory for selected business categories in future.

# 7\. Business Categories

The platform shall support configurable business categories.

Examples

Salon

Barber

Coffee Shop

Restaurant

Pizza

Burger

Bakery

Car Wash

Laundry

Spa

Gym

Vehicle Service

Juice Bar

Retail

Other

Categories are primarily used for reporting and discovery.

They shall not restrict Reward Programs.

# 8\. Subscription Philosophy

Businesses subscribe to access the customer-verified loyalty platform.

Subscription pricing is based primarily on platform capacity rather than transaction volume.

This makes pricing predictable for SMEs.

# 9\. Subscription Plans

The initial structure should remain simple.

## Starter

Designed for micro and small businesses.

Includes

Up to 10 active Reward Programs

Limited staff accounts

Single branch

Basic reporting

## Growth

Designed for growing SMEs.

Includes

Up to 20 active products

Additional staff

Enhanced reporting

Additional permissions

## Professional

Designed for larger businesses.

Includes

More than 20 products

Future multi-branch support

Advanced reporting

API readiness

Priority support

The exact commercial pricing will be documented separately.

# 10\. Product Limits

Subscription plans shall limit:

- active Reward Programs;
- staff accounts;
- branches;
- advanced reporting;
- exports;
- promotional capabilities;
- integrations.

The platform shall never limit:

- customers;
- purchase recording;
- customer verification.

Businesses should never feel punished for growing customer loyalty.

# 11\. Trial Period

The MVP should support a trial.

Possible example

30 Days

or

100 Verified Purchases

whichever occurs first.

Commercial rules will be finalised separately.

# 12\. Onboarding Checklist

Every business should complete:

✓ Business Profile

✓ Subscription

✓ First Reward Program

✓ Staff Invitation

✓ Business Logo (optional)

✓ First Purchase Recorded

✓ First Customer Verification

The final milestone should be

Congratulations.

Your first customer has verified a purchase.

This reinforces the product's trust philosophy.

# 13\. Business Dashboard

The dashboard should answer:

Who are we?

What needs attention?

How are customers progressing?

How is the business performing?

Initial widgets

Pending Customer Verifications

Pending Disputes

Customers Near Reward

Today's Purchases

Today's Verifications

Today's Rewards

Staff Activity

Subscription Status

# 14\. Reward Program Creation

Every business must create at least one active Reward Program before recording purchases.

A Reward Program contains

Product Name

Description

Category

Normal Price

Reward Rule

Reward Value

Status

Multiple Quantity Allowed

Shared Loyalty Number Allowed

Verification Required (always Yes in MVP)

Fraud Threshold

# 15\. Product Categories

The platform shall not prescribe products.

Instead businesses define

their own.

Examples

Premium Haircut

Children Haircut

SUV Wash

Large Cappuccino

Lunch Buffet

Regular Burger

Medium Pizza

Businesses remain responsible for ensuring reward equivalence.

# 16\. Product Value Philosophy

The platform records qualifying units.

The business defines

what qualifies.

For example

Medium Pizza

may include

Chicken

Vegetarian

Pepperoni

provided the business treats them as equivalent.

The platform should never attempt to determine commercial equivalence.

# 17\. Staff Invitation

Businesses may invite staff during onboarding or later.

Invitation methods may include

Phone Number

Email

QR Invitation

Future support for invitation links.

# 18\. Owner Responsibilities

Business owners remain responsible for

reward fulfilment

staff management

subscription

customer trust

accurate product setup

dispute handling

platform compliance

# 19\. Customer Education

During onboarding every business should understand

Customer verification

Pending purchases

Reward eligibility

Redemption process

Shared loyalty number

Fraud prevention

This education is critical.

# 20\. Business Education

The onboarding should clearly explain

A purchase is not yet loyalty.

It becomes loyalty

only after customer verification.

This message should appear repeatedly.

# 21\. First Customer Journey

The onboarding should encourage businesses to complete

their first successful loyalty cycle.

Recommended sequence

Register Business

↓

Create Product

↓

Invite Staff

↓

Record Purchase

↓

Customer Verifies

↓

Business Sees Verified Progress

This creates confidence.

# 22\. Subscription Upgrades

Businesses may upgrade at any time.

Upgrades should apply immediately.

Downgrades

Should only occur

if business configuration remains within the lower plan limits.

Otherwise

the owner should resolve the excess before downgrade.

# 23\. Business Verification

Future versions may require

Business Registration

Tax Information

Identity Verification

Business Licence

Location Verification

These are not mandatory for MVP.

# 24\. Business Suspension

Reasons may include

Non-payment

Fraud

Platform abuse

Legal request

Business request

Suspension should preserve

history

reports

customers

audit records

# 25\. Business Closure

Closing a business shall

prevent new purchases

prevent new rewards

retain

commercial history

audit history

customer history

Customers continue owning

their loyalty identity.

# 26\. Functional Requirements

## FR-BO-001

The system shall allow businesses to register.

## FR-BO-002

Every business shall have one primary owner.

## FR-BO-003

Businesses shall select a subscription plan.

## FR-BO-004

Businesses shall create at least one active Reward Program before recording purchases.

## FR-BO-005

Businesses shall invite staff.

## FR-BO-006

Businesses shall complete onboarding.

## FR-BO-007

Businesses shall view onboarding progress.

## FR-BO-008

Subscription limits shall prevent exceeding plan capacity.

## FR-BO-009

Businesses shall manage Reward Programs.

## FR-BO-010

Businesses shall configure product-level settings.

## FR-BO-011

Businesses shall understand customer verification before going live.

## FR-BO-012

The platform shall prevent purchase recording without an active Reward Program.

## FR-BO-013

Businesses shall view pending customer verifications.

## FR-BO-014

Businesses shall view customer verification history.

## FR-BO-015

Businesses shall upgrade or downgrade subscriptions.

# 27\. Business Rules

BR-027

Every business requires one active owner.

BR-028

Businesses subscribe to the platform.

Customers do not.

BR-029

At least one Reward Program must exist before purchases can be recorded.

BR-030

Subscription plans limit platform capacity.

Not customer participation.

BR-031

Businesses define eligible Reward Programs.

BR-032

Businesses determine product equivalence.

BR-033

Customer verification is mandatory for every recorded purchase.

BR-034

Closing a business never deletes customer identity.

BR-035

Business history remains auditable after closure.

BR-036

Owners remain responsible for honouring rewards.

# 28\. Open Design Questions

These will influence later commercial and technical design.

### 1\. Multiple Businesses

Should one owner manage several businesses under one subscription account or should every business subscribe independently?

Recommendation (unapproved — open decision, see TRD23/Decision Register):

One owner may manage multiple businesses.

Each business has its own subscription.

This simplifies reporting and future franchising.

### 2\. Franchise Groups

Future support

A franchise owner could manage

20 restaurants

while each restaurant remains an independent loyalty business.

### 3\. Promotional Products

Should inactive products remain visible in reports?

Recommendation

Yes.

Historical products remain reportable.

### 4\. Business Discovery

Will customers eventually browse nearby participating businesses?

Recommendation

Not MVP.

Architecture should allow it later.

# 29\. Acceptance Criteria

Approved when

- Business onboarding is complete.
- Subscription workflow is defined.
- Product limits are clear.
- Product creation is understood.
- Staff invitation process is complete.
- Dashboard objectives are defined.
- Trial philosophy is defined.
- Business lifecycle is complete.
- Commercial responsibilities are documented.
- Functional requirements are approved.

# 30\. Recommendation for the Next Section

The next section should become one of the most important parts of the entire platform:

## Reward Programs and the Loyalty Engine

Rather than simply defining products, it should specify:

- Reward Program lifecycle;
- product configuration;
- reward rules;
- quantity handling;
- shared loyalty-number behaviour;
- verification rules;
- progress calculations;
- reward unlocking;
- reward redemption;
- cycle reset;
- state diagrams;
- edge cases.

This section will effectively define the mathematical heart of 11thONUS and will become the foundation for the future Technical Requirements Document.