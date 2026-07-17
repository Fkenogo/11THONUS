> **Title:** PRD Section 7 — Reward Redemption, On Us Moments and Reward Lifecycle  
> **Version:** 1.0 · **Status:** Draft for review (pre-freeze) · **Classification:** Authoritative Product  
> **Governing document:** 11thONUS Platform Constitution  
> **Source-of-truth path:** `docs/01-product/prd/07-reward-redemption.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Product Requirements Document

# Stage 2 - Functional Requirements

## Section 7: Reward Redemption, On Us Moments and Reward Lifecycle

**Version:** 1.0

# 1\. Purpose

This section defines how earned rewards become redeemed rewards.

It specifies:

- reward eligibility;
- redemption validation;
- redemption workflow;
- business responsibilities;
- customer experience;
- reward completion;
- Loyalty Cycle completion;
- historical reward records.

The objective is to ensure that every earned reward is redeemed consistently, transparently and with complete accountability.

# 2\. Design Philosophy

Everything within 11thONUS leads to one customer experience:

**"This one's on us."**

Reward redemption should feel simple, generous and memorable.

Customers should never need to understand how the platform calculated their eligibility.

They should simply know:

- they earned it;
- it is available;
- they can enjoy it.

# 3\. Reward Eligibility

A customer becomes eligible for an On Us Moment when:

- the active Reward Program remains valid;
- the required number of Verified Units has been reached;
- the current Loyalty Cycle is active;
- no previous reward from that Loyalty Cycle has already been redeemed.

Once these conditions are satisfied, the reward becomes available.

# 4\. Customer Experience

Customers should never see technical system states.

Instead, the experience should be conversational.

Examples include:

"You've earned your next coffee."

"Your next haircut is on us."

"Congratulations. You've unlocked your next reward."

"Enjoy your On Us Moment."

The emphasis should always be appreciation rather than promotion.

# 5\. Reward Availability

Once earned, the reward appears immediately within the customer's account.

The customer should clearly see:

- business;
- Reward Program;
- reward description;
- date earned;
- redemption status;
- any business instructions.

The customer should never have to calculate whether they have earned the reward.

# 6\. Redeeming an On Us Moment

The redemption journey should require only a few simple steps.

### Step 1

Customer visits the participating business.

### Step 2

Customer presents:

- loyalty number; or
- QR code.

### Step 3

Business locates the customer.

### Step 4

The platform confirms that a reward is available.

### Step 5

Business provides the eligible product or service.

### Step 6

Business confirms redemption.

### Step 7

The customer immediately sees:

"This one's on us."

### Step 8

The Loyalty Cycle closes and the next Loyalty Cycle begins automatically.

# 7\. Redemption Validation

Before redemption, the platform shall validate:

- business identity;
- Reward Program;
- customer identity;
- reward availability;
- reward status;
- business status;
- Reward Program status.

A reward cannot be redeemed if it is unavailable or has already been used.

# 8\. Business Responsibilities

The business is responsible for:

- honouring earned rewards;
- confirming the correct Reward Program;
- providing the agreed reward;
- completing redemption in the platform;
- resolving any redemption disputes.

# 9\. Customer Responsibilities

The customer is responsible for:

- presenting their loyalty number or QR code;
- identifying the correct Reward Program where necessary;
- redeeming the reward according to the program terms.

# 10\. Reward States

Each reward progresses through one state at a time.

## Available

The reward has been earned.

Waiting to be used.

## Redeemed

The reward has been used successfully.

## Cancelled

The reward has been withdrawn through an authorised administrative process.

## Expired

Architecturally supported; automatic reward expiry is **not** enabled in the MVP (see §20 and TRD Consolidation Audit §7.8).

> **State-model note (Phase 1 consolidation):** The canonical stored Reward states are `available`, `redeemed`, `cancelled`, `expired` (TRD Consolidation Audit §7.8). "Historical" is a reporting/display view of concluded rewards, not a stored state. The Redemption record itself is a separate entity with canonical states `completed` and `reversed` (§7.9). This section previously carried the heading "Redemption States"; it describes the Reward entity.

Future platform versions may introduce additional states without changing the underlying architecture.

# 11\. On Us Moments

Every successful redemption creates an On Us Moment.

An On Us Moment represents:

- appreciation;
- loyalty recognised;
- relationship strengthened.

The customer should always be able to revisit previous On Us Moments.

The history should feel like a story of their loyalty rather than a transaction log.

# 12\. Your On Us Moments

Customers should see a dedicated section titled:

## Your On Us Moments

Example entries:

☕ Joe's Coffee

Regular Coffee

Used on

14 July 2026

✂ Bella Salon

Premium Haircut

Used on

3 June 2026

🍕 Pizza House

Medium Pizza

Used on

18 May 2026

The emphasis is on memories, not accounting.

# 13\. Business Dashboard

Businesses should understand:

- rewards currently available;
- rewards redeemed today;
- rewards redeemed this month;
- customers approaching their next reward;
- outstanding earned rewards;
- Reward Program performance.

Suggested dashboard wording:

Today's On Us Moments

Outstanding Rewards

Customers Close to Their Next Reward

# 14\. Outstanding Rewards

Businesses should know how many customers have earned but not yet redeemed a reward.

This represents future reward liability.

The platform should present this constructively.

Example:

27 customers are waiting for their next On Us Moment.

# 15\. Reward History

Reward history shall remain permanently available.

Historical records shall include:

- Reward Program;
- date earned;
- date redeemed;
- business;
- Loyalty Cycle reference.

Historical records must never be deleted.

# 16\. Future Gift-Ready Architecture

The architecture shall support future gifting without changing the Reward Lifecycle.

Future capability:

A customer may choose to gift an earned reward to another person.

The recipient redeems the reward using a secure gift reference linked to the original customer.

The original Loyalty Cycle remains historically accurate.

# 17\. Future Wallet-Ready Architecture

The architecture shall support future wallet functionality.

Examples include:

- prepaid balances;
- business credit;
- gift credit;
- promotional credit.

Future wallet features shall integrate with the existing reward architecture rather than replacing it.

# 18\. Redemption Notifications

Customers should receive notifications when:

- a reward becomes available;
- a reward has been successfully used;
- a redemption cannot be completed;
- future gifted rewards are received.

Businesses should receive notifications when:

- rewards are redeemed;
- unusual redemption activity is detected;
- reward liability changes significantly.

# 19\. Functional Requirements

### FR-RL-001

The system shall make rewards available immediately after eligibility is achieved.

### FR-RL-002

Customers shall view all available rewards.

### FR-RL-003

Businesses shall validate reward availability before redemption.

### FR-RL-004

Successful redemption shall complete the current Loyalty Cycle.

### FR-RL-005

The next Loyalty Cycle shall begin automatically.

### FR-RL-006

Customers shall retain permanent access to their On Us Moments history.

### FR-RL-007

Businesses shall retain historical redemption records.

### FR-RL-008

Future gifting shall reuse the existing reward architecture.

### FR-RL-009

Future wallet functionality shall integrate with existing reward architecture.

# 20\. Business Rules

| Rule ID | Rule                                                                                |
| ------- | ----------------------------------------------------------------------------------- |
| BR-069  | Rewards become available immediately after the required Verified Units are reached. |
| BR-070  | A reward may be redeemed only once.                                                 |
| BR-071  | Successful redemption closes the active Loyalty Cycle.                              |
| BR-072  | A new Loyalty Cycle begins automatically after redemption.                          |
| BR-073  | Every redemption creates one On Us Moment.                                          |
| BR-074  | On Us Moments remain permanently visible in customer history.                       |
| BR-075  | Businesses remain responsible for honouring earned rewards.                         |
| BR-076  | Future gifting shall extend, not replace, the Reward Lifecycle.                     |
| BR-077  | Future wallet functionality shall integrate with the existing reward architecture.  |

# 21\. Acceptance Criteria

This section is approved when:

- reward eligibility is clearly defined;
- redemption workflow is complete;
- customer and business responsibilities are documented;
- On Us Moments are established as the customer experience;
- reward history is preserved permanently;
- future gifting and wallet capabilities can be added without redesigning the Reward Lifecycle;
- all business rules are accepted.

# 22\. Next Section

The next section will define:

## Fraud Prevention, Trust Management and Operational Controls

This section will cover:

- operational fraud scenarios;
- customer misuse;
- business misuse;
- staff misuse;
- anomaly detection;
- approval workflows;
- operational safeguards;
- reconciliation support;
- audit requirements;
- future AI-assisted fraud analysis.