> **Title:** PRD Section 2 — Customer Registration, Identity and Account Lifecycle  
> **Version:** 1.0 · **Status:** Draft for review (pre-freeze) · **Classification:** Authoritative Product  
> **Governing document:** 11thONUS Platform Constitution  
> **Source-of-truth path:** `docs/01-product/prd/02-customer-registration-and-identity.md`  
> **Last controlled update:** 2026-08-07 (`DEC-PROD-012` Option D — §5 optional registration list: gender removed from MVP). Previously: 2026-08-01 (`IDENTITY-ALIGN-001` — §5 Steps 2–4 and §7 Customer Account Status corrected to remove the "phone verification gates account creation/Active status" wording contradicted by `DEC-IDENTITY-001` (2026-08-01): standard participation no longer requires phone verification; a customer's identity and `Active` status are established at registration, independent of whether any authentication provider's verification step is later completed. See the [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-IDENTITY-001` entry. Previously: 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Product Requirements Document

# Stage 2 - Functional Requirements

## Section 2: Customer Registration, Identity and Account Lifecycle

**Version:** 1.0

# 1\. Purpose

This section defines how customers become members of the 11thONUS ecosystem, how their identity is established, protected and recovered, and how that identity persists throughout the lifetime of the platform.

The customer identity is one of the most important assets within 11thONUS.

Unlike traditional loyalty cards that belong to individual businesses, the customer's loyalty identity belongs to the customer and is portable across every participating business.

# 2\. Design Objectives

The customer registration experience must be:

- simple
- mobile-first
- secure
- fast
- recoverable
- unique
- scalable
- privacy-conscious

A new customer should be able to register in less than two minutes.

# 3\. Customer Identity Philosophy

The customer does not register with a business.

The customer registers with **11thONUS**.

Businesses participate within the customer's loyalty ecosystem.

This distinction is fundamental.

The customer owns one platform identity that can interact with thousands of businesses.

# 4\. Customer Identity Components

Every customer account shall contain five core identities.

## Identity 1

Internal Platform User ID

Characteristics:

- immutable
- globally unique
- never exposed publicly
- primary database identifier

## Identity 2

Customer Loyalty Number

Example

ONU-48372619

Characteristics

- public
- unique
- may be quoted verbally
- may be printed
- may be shared
- linked to one customer only

This becomes the customer's loyalty identity.

## Identity 3

QR Code

The QR represents the customer's loyalty number.

Businesses scan the QR instead of typing the loyalty number.

The QR shall never expose confidential customer information.

## Identity 4

Authentication Identity

Examples

- phone number
- email
- future authentication providers

Used only for account access.

Never used publicly.

## Identity 5

Customer Profile

Contains

- name
- preferred display name
- profile photo (optional)
- country
- preferred language
- notification preferences

# 5\. Registration Journey

The MVP registration flow should be intentionally simple.

## Step 1

Welcome

Explain

One loyalty account.

Unlimited participating businesses.

## Step 2

Choose a sign-in method — mobile number (OTP) or another supported authentication provider — and authenticate.

## Step 3

Confirm authentication (enter the code sent, or complete the chosen provider's flow).

## Step 4

Account and permanent loyalty identity created immediately. Authentication proves a returning credential; per `DEC-IDENTITY-001`, it does not gate or define identity — the customer does not wait on a separate verification step to have an account.

## Step 5

Complete profile.

Only minimum information required.

## Step 6

System generates

- loyalty number
- QR code

## Step 7

Customer enters dashboard.

Registration complete.

# 6\. Minimum Registration Information

Mandatory

- First name
- Last name
- Mobile number
- Country
- Preferred language
- Acceptance of Terms
- Acceptance of Privacy Policy

Optional

- Email
- Profile photo
- Date of birth
- ~~Gender~~ **[Removed from MVP — `DEC-PROD-012` Option D, 2026-08-07: gender is not collected at MVP. May be reintroduced additively in a future governed release under a separate decision. See the [Decision Register](../../00-governance/decisions/decision-register.md) and [TRD10 §10.6.2](../../02-technical/trd/10-firestore-data-architecture.md).]**

> **Editorial note (Phase 1 consolidation):** Preferred language moved from Optional to Mandatory to align with the position already established in the Commerce Knowledge Standard Part XII, TRD Chapter 22 §22.35 and the TRD Consolidation Audit §17 (audit finding DOC-P2-003). A sensible default (device or country language) may satisfy this requirement without adding registration friction.

The MVP should minimise registration friction.

# 7\. Customer Account Status

Each account shall always exist in one status.

> **Note (`DEC-IDENTITY-001`, 2026-08-01):** account status is no longer gated by phone or other verification. A `Pending Verification` status previously existed here, blocking `Active` until identity was "verified" — that model is superseded; standard participation does not require verification (Standard Participation Principle). Progressive trust level (whether an authentication provider has been verified) is tracked as a separate, internal signal used only for risk-based feature gating (large redemptions, account recovery) — it is not an account status and is never customer-facing as such.

## Registering

Registration in progress — the customer has started but not yet completed the steps in §5.

## Active

Customer has completed registration and may fully use standard platform participation, from the moment their identity is created (§5 Step 4) — not contingent on completing phone or any other verification.

## Suspended

Platform access temporarily restricted.

## Locked

Security action.

Requires recovery.

## Closed

Customer requested closure.

Subject to retention policy.

## Archived

Historical records retained.

Account inactive.

# 8\. Loyalty Number Generation

The loyalty number shall:

- be unique
- never be reused
- remain permanent
- survive phone changes
- survive email changes
- survive profile updates

The loyalty number should not reveal:

- registration date
- country
- sequential customer count

Generation algorithm will be defined within the Technical Requirements Document.

# 9\. QR Code Requirements

The QR shall represent only the customer loyalty identity.

The QR should:

- scan quickly
- work offline where practical
- regenerate if required
- support secure lookup

The QR must never expose

- phone number
- email
- address
- authentication credentials

# 10\. Customer Profile

The customer may manage

Personal Information

Communication

Privacy

Security

Preferences

The profile should not become overly complicated.

# 11\. Customer Dashboard

The dashboard should immediately answer four questions.

## Question 1

Who am I?

Display

- name
- loyalty number
- QR

## Question 2

What needs my attention?

Pending Purchases

Pending Disputes

Available Rewards

## Question 3

How close am I?

Progress across businesses.

## Question 4

What have I already earned?

Reward history.

# 12\. Friends and Family Model

This section replaces traditional referral thinking.

The loyalty number belongs to one registered customer.

The customer may choose to share that loyalty number.

Example

Mary registers.

Mary receives

ONU-938462

Mary tells her husband

"Use my number."

He buys

3 coffees.

Business records

Customer

ONU-938462

Quantity

3

Status

Pending Customer Verification

Mary later opens 11thONUS.

She sees

Coffee House

3 Regular Coffees

Pending

She approves.

Three qualifying purchases are added.

Her husband never accesses her account.

He never verifies.

He simply quotes her loyalty number.

# 13\. Customer Verification Philosophy

Verification belongs exclusively to the registered customer.

Verification is not delegated.

Not even to:

- spouse
- child
- business owner
- manager
- staff
- platform administrator

The registered customer remains responsible for deciding whether a recorded purchase should contribute toward loyalty.

# 14\. Pending Purchase Lifecycle

Every purchase follows the same lifecycle.

Purchase Recorded → Pending Customer Verification → Customer Reviews → Verified → Progress Updated → Reward Eligibility Recalculated

("Pending Customer Verification" is the customer-facing label; the canonical stored state is `waiting_for_customer` — see TRD Consolidation Audit §7.5.)

Rejected

↓

Business Review

↓

Correction

or

Closure

# 15\. Purchase Verification Screen

The customer should see

Business

Product

Quantity

Date

Time

Recorded By

Branch

Notes (if any)

Buttons

Approve

Reject

Dispute

Approve Selected

Approve All

# 16\. Rejecting Purchases

The customer may reject.

Reasons include

- Wrong quantity
- Wrong product
- Never purchased
- Duplicate
- Other

Rejected purchases remain visible.

Nothing disappears.

# 17\. Disputes

Disputes differ from rejection.

Example

Customer says

"I bought five coffees.

Business recorded four."

This becomes

Disputed

Business reviews.

Owner decides.

Platform may assist.

# 18\. Purchase Expiry

Pending purchases should not remain forever.

The platform should support

Reminder

Grace Period

Expiry

Archive

The exact timing will become configurable.

Defaults will be defined through governed Rules Studio configuration (see TRD Chapter 22, §22.31); default values remain an open decision.

# 19\. Notifications

Customers should receive notifications for

New Pending Purchase

Purchase Approved

Purchase Rejected by Business Review

Reward Available

Reward Redeemed

Account Security

Subscription-related messages should never be sent to customers.

# 20\. Customer Privacy

Businesses may only view customer information necessary to complete loyalty transactions.

Businesses shall never see

- customer password
- customer authentication data
- purchases with other businesses
- rewards earned elsewhere

The customer identity remains private.

# 21\. Phone Number Changes

Customers may change their phone number.

Changing a phone number shall never

- create a new account
- create a new loyalty number
- erase history
- reset progress

The account remains the same.

# 22\. Email Changes

Same principles.

Email is simply another authentication method.

Not identity.

# 23\. Duplicate Accounts

Platform should detect

possible duplicates.

Possible merge workflow

Support Review

↓

Customer Verification

↓

Merge

↓

Historical Records Preserved

The loyalty number of the surviving account remains.

# 24\. Account Recovery

Recovery options should include

Phone Verification

Email Verification

Support Verification

Future identity verification methods may be introduced.

# 25\. Customer Account Closure

Customers may request closure.

Closure should not immediately delete

Purchases

Rewards

Audit Records

Commercial History

Data retention shall follow platform policy and legal requirements.

# 26\. Functional Requirements

## FR-CI-001

The system shall generate one permanent loyalty number for every registered customer.

## FR-CI-002

The system shall generate one QR code linked to the loyalty number.

## FR-CI-003

The loyalty number shall remain unchanged for the lifetime of the customer account.

## FR-CI-004

Changing phone number shall not affect loyalty identity.

## FR-CI-005

Customers shall approve, reject or dispute pending purchases.

## FR-CI-006

Only verified purchases shall contribute toward loyalty progress.

## FR-CI-007

Friends or family may quote the customer's loyalty number where the business permits.

## FR-CI-008

Quoting a loyalty number shall never authenticate the person quoting it.

## FR-CI-009

Businesses shall record purchases against the loyalty number.

## FR-CI-010

The registered customer shall remain the only person able to verify those purchases.

## FR-CI-011

The system shall preserve all verification decisions.

## FR-CI-012

Rejected purchases shall remain visible in history.

## FR-CI-013

Disputed purchases shall enter the dispute workflow.

## FR-CI-014

Customer dashboards shall clearly distinguish:

Pending

Verified

Rejected

Disputed

Redeemed

# 27\. Business Rules

BR-017

Each customer owns one permanent loyalty identity.

BR-018

Loyalty identity survives authentication changes.

BR-019

Every recorded purchase remains pending until customer verification.

BR-020

Customer verification is mandatory regardless of who recorded the purchase.

BR-021

Friends or family may quote the customer's loyalty number only where permitted by the business.

BR-022

Sharing a loyalty number never grants account access.

BR-023

Only the registered customer may verify purchases.

BR-024

Rejected purchases never contribute to loyalty.

BR-025

Verified purchases immediately recalculate reward eligibility.

BR-026

Historical purchase decisions remain permanently auditable.

# 28\. Open Design Questions

These will be resolved before the TRD.

- Should customers be able to partially approve a multi-quantity purchase?

Example

Five coffees recorded.

Customer agrees only four were purchased.

Approve 4?

Reject 1?

Or reject entire purchase?

- Should businesses be allowed to split one transaction into several purchases?
- How long should pending purchases remain active before archival?
- Should reminder frequency be configurable by businesses?
- Should the customer be able to attach comments or evidence when disputing?

# 29\. Acceptance Criteria

This section is approved when:

- Every customer has one permanent loyalty identity.
- Loyalty numbers are independent of authentication.
- Friends and family use of loyalty numbers is clearly defined.
- Customer verification is mandatory before loyalty progress updates.
- Purchase lifecycle is complete.
- Duplicate account strategy is defined.
- Recovery strategy is defined.
- Privacy boundaries are clear.
- Dashboard requirements are understood.
- Functional requirements are complete.

# 30\. Next Section

The next section will define:

## Business Registration, Subscription and Onboarding

This will include:

- business creation
- subscription workflow
- onboarding wizard
- product limits
- subscription plans
- trial model
- branch setup
- business verification
- owner activation
- business lifecycle
- billing foundation