# 11thONUS

# Product Requirements Document

# Stage 2 - Functional Requirements

## Section 6: Reward Programs, Verified Units and Loyalty Cycle Management

**Version:** 1.0

# 1\. Purpose

This section defines how businesses configure Reward Programs, how Verified Units are accumulated, how Loyalty Cycles progress and how customers become eligible for an On Us Moment.

This section forms the commercial heart of the Customer-Verified Loyalty Engine (CVLE).

It determines **what counts**, **when it counts**, **how it is counted**, and **what happens after the reward has been earned**.

# 2\. Design Philosophy

11thONUS does not reward spending.

It rewards **verified loyalty**.

The platform therefore measures **Verified Units** rather than monetary value.

A Reward Program defines what those Verified Units represent.

Examples include:

- One Premium Haircut
- One Regular Coffee
- One Medium Pizza
- One Sedan Car Wash

The business decides what qualifies.

The platform ensures the rules are applied consistently.

# 3\. Reward Program Definition

A **Reward Program** is a business-defined loyalty programme that specifies:

- which products or services qualify;
- how qualifying units are counted;
- how many Verified Units are required;
- what reward is earned;
- how the reward is redeemed;
- what fraud rules apply.

A Reward Program is the commercial agreement between the business and its customers.

# 4\. Reward Program Structure

Every Reward Program shall include the following sections.

## 4.1 Identity

- Reward Program ID
- Business ID
- Program Name
- Display Name
- Description
- Business Category
- Status
- Version Number

## 4.2 Qualification

Defines what contributes Verified Units.

Fields include:

- Qualifying Products or Services
- Product Category
- Unit Type
- Multiple Units Allowed
- Shared Loyalty Number Allowed
- Maximum Units per Purchase Record (optional)
- Future promotional qualifiers

## 4.3 Reward

Defines what the customer earns.

Fields include:

- Reward Description
- Reward Quantity
- Reward Product or Service
- Redemption Notes
- Internal Cost Estimate (optional)
- Customer Display Message

## 4.4 Cycle Configuration

Defines:

- Verified Units Required
- Current Rule Version
- Future configurable thresholds

For MVP:

Verified Units Required = **10**

Reward = **1 On Us Unit**

The architecture must support future configurable rules without redesign.

## 4.5 Verification

Defines:

- Customer Verification Required (Yes)
- Reminder Policy
- Pending Expiry Policy
- Dispute Handling Policy

## 4.6 Fraud Controls

Defines:

- Shared Loyalty Number Policy
- Bulk Review Threshold
- Quantity Review Threshold
- Future AI review settings

# 5\. Reward Program Lifecycle

Every Reward Program exists in one lifecycle state.

## Draft

Being configured.

Not visible.

## Active

Customers may accumulate Verified Units.

## Paused

Temporarily unavailable.

Customers retain accumulated progress.

No new Purchase Records accepted.

## Retired

No further participation.

Historical Loyalty Cycles remain valid.

Outstanding rewards remain redeemable.

## Archived

Historical reporting only.

# 6\. Program Versioning

Businesses may improve Reward Programs over time.

Examples:

- Description updates
- Product mapping changes
- Display improvements
- Reminder policy updates

Historical Loyalty Cycles must continue referencing the version that governed them.

The system shall never rewrite historical cycle rules.

# 7\. Qualifying Products

A Reward Program may contain:

One product

or

Multiple equivalent products.

Example

Reward Program

Medium Pizza

Qualifying products

- Pepperoni Medium
- Hawaiian Medium
- Vegetarian Medium
- Chicken Medium

Each purchase contributes one Verified Unit.

# 8\. Product Equivalence

The business determines equivalence.

The platform does not evaluate commercial value.

Responsibility rests entirely with the business.

# 9\. Verified Units

Verified Units are the universal measurement used by the Customer-Verified Loyalty Engine.

Everything is calculated from Verified Units.

The engine never counts:

- receipts
- invoices
- transactions
- visits
- money

It counts only Verified Units.

# 10\. Creating Verified Units

Verified Units are created only when:

- Purchase Record exists.
- Customer verifies.
- Purchase Record enters Verified state.

No other workflow may create Verified Units.

# 11\. Quantity Handling

One Purchase Record may create multiple Verified Units.

Examples

Coffee ×5

↓

Five Verified Units

Children Haircut ×3

↓

Three Verified Units

SUV Wash ×2

↓

Two Verified Units

This allows legitimate family, business and group purchases.

# 12\. Loyalty Cycle

Every customer maintains independent Loyalty Cycles.

One customer may therefore have:

Bella Salon

Premium Haircut

Cycle 5

Progress

8 Verified Units

Joe's Coffee

Regular Coffee

Cycle 2

Progress

3 Verified Units

These cycles never interact.

# 13\. Loyalty Cycle Structure

Each Loyalty Cycle contains:

Cycle Number

Reward Program

Customer

Verified Units

Reward Status

Reward Availability Date

Reward Redemption Date

Cycle Status

Cycle Version

Trust Ledger References

# 14\. Loyalty Cycle Status

Current

Reward Available

Reward Redeemed

Closed

Historical

# 15\. Loyalty Progress

Progress equals

Current Verified Units

divided by

Required Verified Units.

Example

Verified Units

7

Required

10

Display

7 / 10

Customers should always understand their position.

# 16\. Reward Availability

Once the required number of Verified Units has been reached:

Reward Status becomes

Reward Available.

The customer has earned the reward.

No additional action is required.

# 17\. On Us Moment

Reward redemption creates an

On Us Moment.

This is the customer celebration event.

Examples

"This coffee's on us."

"Enjoy your On Us Moment."

"Thank you for choosing Bella Salon again."

The customer dashboard should maintain:

## Your On Us Moments

instead of

Reward History.

# 18\. Redemption

A reward may only be redeemed when:

Reward Status = Reward Available.

The redemption process shall:

- validate eligibility;
- record the redemption;
- create Trust Events;
- close the Loyalty Cycle;
- automatically begin the next Loyalty Cycle.

# 19\. Multiple Open Cycles

The MVP shall permit only one active Loyalty Cycle per customer per Reward Program.

Future versions may support:

Reserved rewards

Stacked rewards

Giftable rewards

Wallet conversion

These capabilities must not change the underlying architecture.

# 20\. Unredeemed Rewards

An earned reward remains available until:

- redeemed;
- expired by future policy;
- cancelled through an approved business process.

The MVP should not automatically expire earned rewards.

# 21\. Future Reward States

The architecture shall support future states including:

Reward Reserved

Reward Gifted

Reward Transferred

Reward Wallet Credit

Reward Converted

Reward Expired

These are not MVP features but must not require redesign of the Reward Lifecycle Engine.

# 22\. Verified Commerce Readiness

The Reward Lifecycle Engine shall support future Verified Commerce capabilities.

Examples include:

## Verified Gift Cards

A customer may gift an earned reward to another person.

The recipient redeems using a secure gift reference linked to the original customer's loyalty account.

The Trust Ledger records:

Reward Earned

↓

Gift Created

↓

Gift Accepted

↓

Gift Redeemed

## Verified Wallet

Future versions may allow customers to maintain a prepaid wallet.

A customer may:

- fund the wallet;
- pay for purchases using wallet balance;
- continue earning Verified Units;
- gift wallet-funded purchases;
- combine wallet payments with Reward Programs.

Wallet transactions become additional Trust Events.

## Verified Promotions

Future promotional campaigns may issue additional Verified Units or temporary Reward Programs without changing the Loyalty Engine.

# 23\. Reward Program Reporting

Every Reward Program shall report:

- Active Customers
- Active Loyalty Cycles
- Completed Cycles
- Average Verification Time
- Average Units per Purchase Record
- Rewards Available
- Rewards Redeemed
- Outstanding Rewards
- On Us Moments Delivered
- Rejection Rate
- Dispute Rate

# 24\. Reward Program Analytics

Businesses should understand:

Which Reward Programs create the most repeat visits.

Which programmes generate the most On Us Moments.

Which programmes generate the highest customer retention.

Future AI may recommend optimisation.

# 25\. Functional Requirements

### FR-RP-001

The system shall allow businesses to create Reward Programs.

### FR-RP-002

Every Reward Program shall define qualifying products or services.

### FR-RP-003

Every Reward Program shall define reward eligibility.

### FR-RP-004

The system shall create Verified Units only after customer verification.

### FR-RP-005

Verified Units shall update the active Loyalty Cycle.

### FR-RP-006

Reward availability shall be recalculated automatically.

### FR-RP-007

Only one active Loyalty Cycle shall exist per customer per Reward Program in the MVP.

### FR-RP-008

Reward redemption shall close the current Loyalty Cycle and immediately open the next.

### FR-RP-009

Historical Loyalty Cycles shall remain immutable.

### FR-RP-010

Reward Program versions shall preserve historical integrity.

### FR-RP-011

The architecture shall support future Reward Lifecycle states without redesign.

### FR-RP-012

The architecture shall support future Verified Commerce capabilities.

# 26\. Business Rules

| Rule ID | Rule                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------ |
| BR-059  | A Reward Program defines what qualifies and what is earned.                                            |
| BR-060  | Only Verified Units contribute to Loyalty Cycles.                                                      |
| BR-061  | Businesses define qualifying products and product equivalence.                                         |
| BR-062  | One Purchase Record may generate multiple Verified Units.                                              |
| BR-063  | Only one active Loyalty Cycle exists per Reward Program in the MVP.                                    |
| BR-064  | Reaching the required Verified Units makes the reward available immediately.                           |
| BR-065  | Redeeming a reward closes the active Loyalty Cycle and opens the next.                                 |
| BR-066  | Historical Loyalty Cycles remain immutable.                                                            |
| BR-067  | Reward Program version changes shall not alter historical cycles.                                      |
| BR-068  | The architecture shall support future Reward Lifecycle states including gifting and wallet conversion. |

# 27\. Architectural Principles

## AP-RP-001

Reward Programs are commercial configurations.

They are not inventory items.

## AP-RP-002

Verified Units are the only calculation unit used by the Loyalty Engine.

## AP-RP-003

Reward eligibility is always derived.

It is never manually adjusted.

## AP-RP-004

Loyalty Cycles are independent containers of customer progress.

## AP-RP-005

Future Verified Commerce modules must consume the existing Reward Lifecycle Engine rather than creating parallel reward systems.

# 28\. Open Design Questions

These questions will be resolved before the Technical Requirements Document.

- Should businesses be allowed to pause a Reward Program while preserving outstanding rewards?
- Should businesses be able to migrate customers from one Reward Program to another under controlled conditions?
- Should a Reward Program allow seasonal variants while preserving one Loyalty Cycle?
- What governance rules should apply when introducing configurable reward thresholds beyond the MVP?
- When Verified Gift Cards are introduced, should gifting transfer only the reward or also any associated redemption conditions?

# 29\. Acceptance Criteria

This section is approved when:

- Reward Programs are defined as the commercial abstraction.
- Verified Units are established as the universal calculation unit.
- Loyalty Cycle management is complete.
- Reward availability rules are unambiguous.
- On Us Moments are defined as the customer redemption experience.
- Reward Lifecycle extensibility supports Verified Commerce.
- Future gifting and wallet capabilities can be introduced without redesigning the Loyalty Engine.
- All business rules and architectural principles are accepted.

# 30\. Next Section

The next section will define:

## Reward Redemption, On Us Moments and the Reward Lifecycle Engine (RLE)

It will cover:

- reward validation;
- redemption workflows;
- redemption permissions;
- redemption verification;
- On Us Moment experience;
- reward state transitions;
- gift-ready architecture;
- future wallet integration;
- fraud controls around redemption;
- redemption analytics;
- Trust Ledger integration.