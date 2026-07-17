# 11thONUS

# Product Requirements Document

# Stage 2 - Functional Requirements

## Section 4: Customer-Verified Loyalty Engine (CVLE)

**Version:** 1.0

# 1\. Purpose

The Customer-Verified Loyalty Engine (CVLE) is the core operating engine of 11thONUS.

Every reward, every customer journey, every dashboard, every report and every fraud control ultimately depends on this engine.

The engine governs:

- Reward Programs
- Verified Units
- Loyalty Cycles
- Customer Verification
- Reward Eligibility
- On Us Moments
- Reward Redemption
- Loyalty History

No loyalty calculation shall exist outside this engine.

# 2\. Design Philosophy

Traditional loyalty systems ask one question:

Did the merchant record the transaction?

11thONUS asks a different question:

Has the customer verified the qualifying units?

Only after verification does loyalty progress exist.

This principle shall remain unchanged across every future version of the platform.

# 3\. Core Vocabulary

The following terms become official platform terminology.

## Reward Program

A business-defined loyalty programme.

Examples:

Premium Haircut

Medium Pizza

SUV Wash

Regular Coffee

## Verified Unit

A qualifying unit that has been verified by the registered customer.

One verified coffee

\=

One Verified Unit.

Five verified coffees

\=

Five Verified Units.

The engine counts Verified Units.

Not transactions.

Not visits.

Not receipts.

## Loyalty Cycle

A complete earn-and-redeem cycle within one Reward Program.

Example

Cycle 1

10 Verified Units

↓

Reward Available

↓

Reward Redeemed

↓

Cycle 2 begins.

## Reward Available

The state where sufficient Verified Units have been accumulated.

## On Us Moment

The moment when an earned reward is redeemed.

This is the emotional experience presented to customers.

# 4\. Engine Principles

### CVLE-001

Every Reward Program operates independently.

Progress never mixes between Reward Programs.

### CVLE-002

Every customer maintains independent Loyalty Cycles for every Reward Program.

### CVLE-003

Only Verified Units contribute to Loyalty Cycles.

### CVLE-004

Pending Units never contribute.

### CVLE-005

Rejected Units never contribute.

### CVLE-006

Disputed Units never contribute until resolved.

### CVLE-007

Redeeming a reward starts the next Loyalty Cycle.

### CVLE-008

Historical Loyalty Cycles never change.

# 5\. Reward Program Structure

Every Reward Program shall contain:

## Identity

Reward Program ID

Business ID

Program Name

Description

Status

## Qualification Rules

Qualifying Products

Required Verified Units

Multiple Units Allowed

Shared Loyalty Number Allowed

Verification Rules

## Reward Rules

Reward Item

Reward Quantity

Reward Description

Redemption Rules

## Fraud Rules

Bulk Threshold

Review Threshold

Quantity Rules

Customer Verification

## Lifecycle

Draft

↓

Active

↓

Paused

↓

Retired

↓

Archived

# 6\. Loyalty Cycle Structure

Each customer has an independent Loyalty Cycle.

Example

Customer

Mary

Reward Program

Premium Haircut

Current Cycle

Cycle 4

Verified Units

7

Reward Status

Not Yet Available

History

Cycle 1 Completed

Cycle 2 Completed

Cycle 3 Completed

# 7\. Unit Lifecycle

Every qualifying unit follows the same lifecycle.

Recorded

↓

Pending Verification

↓

Verified

↓

Applied to Loyalty Cycle

↓

Reward Eligibility Updated

↓

Historical Record

Rejected

↓

Historical Record

Disputed

↓

Resolution

↓

Verified

or

Rejected

# 8\. Quantity Rules

The engine shall support multiple qualifying units within one recorded purchase.

Example

Coffee ×5

↓

Customer verifies

↓

Five Verified Units

This applies equally to:

- burgers
- pizzas
- coffees
- haircuts
- vehicle washes
- laundry items
- any qualifying unit defined by the business.

# 9\. Shared Loyalty Number Rules

Where enabled:

Another person may quote the registered customer's loyalty number.

The business records the qualifying units.

The registered customer verifies those units.

Only after verification do they become Verified Units.

The person making the purchase never owns the loyalty progress.

# 10\. Reward Calculation

Reward calculation is intentionally simple.

Verified Units

↓

Current Loyalty Cycle

↓

Reward Threshold Reached

↓

Reward Available

No hidden calculations.

No percentage weighting.

No point conversion.

Customers should always understand how progress is determined.

# 11\. Multiple Reward Programs

Example

Mary

Bella Salon

Premium Haircut

Cycle 3

6 Verified Units

Children's Haircut

Cycle 2

2 Verified Units

Joe's Coffee

Regular Coffee

Cycle 7

9 Verified Units

Each programme progresses independently.

# 12\. Reward Availability

Once the required Verified Units are reached:

Reward Status

becomes

Reward Available.

The reward remains available until redeemed.

Businesses may define future expiry policies.

The MVP should not automatically expire earned rewards.

# 13\. Redemption

When a customer redeems:

The reward is consumed.

The Loyalty Cycle closes.

A new Loyalty Cycle begins.

Historical information remains unchanged.

# 14\. On Us Moments

The customer experience should celebrate redemption.

Examples

"Today's coffee is on us."

"Enjoy your On Us Moment."

"Thanks for coming back."

The dashboard should present:

Your On Us Moments

rather than

Reward History.

# 15\. Reward Program Status

Each Reward Program exists in one state.

Draft

Being configured.

Active

Available to customers.

Paused

Temporarily unavailable.

Progress remains.

Retired

No new activity.

Historical reporting remains.

Archived

Historical only.

No operational use.

# 16\. Reward Program Versioning

Businesses may improve a Reward Program.

Examples

Name change

Description change

Fraud threshold changes

Notification wording

Such changes should create a new version while preserving historical Loyalty Cycles.

Customers should always understand which version governed a completed cycle.

# 17\. Cycle Completion

A Loyalty Cycle is complete only after:

Required Verified Units achieved

↓

Reward Available

↓

Reward Redeemed

↓

Cycle Closed

A reward that is available but never redeemed remains an open cycle.

# 18\. Engine Integrity

The engine shall never:

Allow negative Verified Units.

Delete completed Loyalty Cycles.

Merge Reward Programs.

Move progress between businesses.

Mix Verified Units across Reward Programs.

Automatically verify customer activity.

# 19\. Functional Requirements

The system shall:

Generate Loyalty Cycles.

Track Verified Units.

Track Pending Units.

Track Rejected Units.

Track Disputed Units.

Calculate Reward Availability.

Support multiple Reward Programs.

Support multiple quantities.

Support customer verification.

Support historical reporting.

Support reward redemption.

Support multiple completed cycles.

Support future configurable reward rules.

# 20\. Business Rules

BR-037

Only Verified Units contribute to Loyalty Cycles.

BR-038

Pending Units never contribute.

BR-039

Rejected Units never contribute.

BR-040

Every Reward Program maintains independent Loyalty Cycles.

BR-041

Verified Units never move between Reward Programs.

BR-042

Redeeming a reward begins the next Loyalty Cycle.

BR-043

Completed Loyalty Cycles remain immutable.

BR-044

Reward Program history remains reportable after retirement.

BR-045

One purchase may generate multiple Verified Units.

BR-046

The engine shall remain transparent to customers.

# 21\. A New Concept: Trust Ledger

The Customer-Verified Loyalty Engine should maintain an immutable Trust Ledger.

Unlike a traditional accounting ledger that records money, the Trust Ledger records every event that contributes to customer trust.

Examples include:

- Purchase recorded
- Customer verified
- Customer rejected
- Purchase disputed
- Dispute resolved
- Reward unlocked
- Reward redeemed
- Loyalty Cycle completed
- Reward Program retired

Every event is written to the Trust Ledger and never deleted.

The Trust Ledger becomes the authoritative history of the relationship between the customer and the business.

All dashboards, reports, fraud analysis and audits derive from this ledger rather than from editable balances.

This architecture ensures that the platform can always explain **why** a customer has a given number of Verified Units, why a reward became available and how every Loyalty Cycle was completed.

# 22\. Acceptance Criteria

This section is approved when:

- Reward Programs are fully defined.
- Verified Units replace transaction counting.
- Loyalty Cycles are defined.
- Reward availability rules are clear.
- On Us Moments become the standard customer experience.
- The Trust Ledger is accepted as the source of truth.
- Reward Program lifecycle is defined.
- Business Rules BR-037 to BR-046 are accepted.
- Future extensibility is preserved without changing the engine.

# 23\. Next Section

The next section will define:

## Purchase Recording, Customer Verification and Dispute Resolution

This section will describe the operational workflow from the moment a business records qualifying units until those units become Verified Units or are rejected, including notifications, reminders, approval states, dispute handling, reversal rules and every possible state transition.