# 11thONUS

# Product Requirements Document

# Stage 2 - Functional Requirements

## Section 5: Purchase Verification Lifecycle (PVL)

**Version:** 1.0

# 1\. Purpose

The Purchase Verification Lifecycle (PVL) defines the complete operational journey of every Purchase Record within 11thONUS.

It governs how Purchase Records are:

- created;
- validated;
- presented to customers;
- verified;
- rejected;
- disputed;
- corrected;
- converted into Verified Units;
- recorded in the Trust Ledger.

Every qualifying purchase within 11thONUS must follow this lifecycle.

No Reward Program may bypass the Purchase Verification Lifecycle.

# 2\. Design Philosophy

11thONUS does not verify payments.

11thONUS verifies trust.

The business confirms that an eligible purchase occurred.

The customer confirms that the business record is accurate.

Only then does the platform recognise the purchase for loyalty purposes.

# 3\. Fundamental Rule

A commercial purchase and a Purchase Record are not the same thing.

The commercial purchase happens in the real world.

The Purchase Record is the platform's digital representation of that purchase.

Only the Purchase Record participates in the Customer-Verified Loyalty Engine.

# 4\. Core Principles

### PVL-001

Every Purchase Record begins in exactly one initial state.

### PVL-002

Every Purchase Record belongs to one customer.

### PVL-003

Every Purchase Record belongs to one business.

### PVL-004

Every Purchase Record belongs to one Reward Program.

### PVL-005

Every Purchase Record records one or more qualifying units.

### PVL-006

Every Purchase Record must eventually reach a final state.

### PVL-007

Every state transition creates a Trust Event.

### PVL-008

Purchase Records are immutable.

Corrections occur through new events.

Not edits.

# 5\. Purchase Record

Every Purchase Record shall contain:

## Identity

Purchase Record ID

Business ID

Reward Program ID

Customer ID

Trust Ledger Reference

## Commercial Information

Business Product or Service

Quantity

Unit Value (optional)

Currency

Purchase Date

Purchase Time

## Operational Information

Recorded By

Role

Branch

Device

Location (future)

Notes

## Verification Information

Status

Customer Response

Response Time

Verification Timestamp

Dispute Reason

Correction Reference

## Audit Information

Created

Modified

State History

Trust Events

# 6\. Purchase Verification Lifecycle

Every Purchase Record follows this lifecycle.

Commercial Purchase  
<br/>↓  
<br/>Purchase Record Created  
<br/>↓  
<br/>Waiting for Customer Verification  
<br/>↓  
<br/>Customer Reviews  
<br/>↓  
<br/>┌────────────────────┬──────────────────────┬────────────────────┐  
│ │ │  
Verify Reject Raise Dispute  
│ │ │  
│ │ │  
Verified Rejected Under Review  
│ │ │  
│ │ │  
Verified Units Closed Business Review  
Created │  
│ │  
│ ┌────────────┴────────────┐  
│ │ │  
│ Correct Record Cancel Record  
│ │ │  
└──────────────────────────────┴─────────────────────────┘

# 7\. Purchase States

Every Purchase Record shall exist in one state only.

## Draft

Temporary state during creation.

## Recorded

Purchase Record successfully created.

Not yet visible to the customer.

Expected duration: a few seconds.

## Waiting for Customer Verification

Visible to both customer and business.

No Verified Units exist.

## Verified

Customer confirms the Purchase Record.

Verified Units are created.

## Rejected

Customer rejects the Purchase Record.

No Verified Units are created.

## Under Review

Business reviewing a rejected or disputed Purchase Record.

## Corrected

Business creates a replacement Purchase Record.

Original record remains historical.

## Cancelled

Business withdraws the Purchase Record.

## Expired

Customer did not respond within the configured policy period.

## Archived

Historical state.

# 8\. Recording a Purchase

Only authorised users may create a Purchase Record.

Supported roles:

- Staff
- Manager
- Business Owner

Future:

- POS Integration
- Mobile Money Integration
- API

Regardless of source, every Purchase Record follows the same lifecycle.

# 9\. Required Information

A Purchase Record cannot be created without:

- Business
- Reward Program
- Customer Loyalty Number or QR
- Quantity
- Recorder
- Timestamp

The platform should automatically populate:

- Purchase Record ID
- Business ID
- Customer ID
- Reward Program ID
- Device Session
- Trust Event ID

# 10\. Customer Lookup

Businesses may locate customers by:

- QR code
- Loyalty Number
- Phone number (subject to permissions)
- Name search (future)

The selected customer is always the registered owner of the loyalty number.

The person presenting the number may be someone else.

# 11\. Shared Loyalty Number

Where the Reward Program allows:

A friend, family member or colleague may quote the registered customer's loyalty number.

The business records the Purchase Record against the registered customer.

The registered customer later verifies whether those qualifying units should count.

This allows family or group purchasing without transferring ownership of the account.

# 12\. Waiting for Customer Verification

Once submitted:

The Purchase Record becomes visible to:

Customer

Business

No Verified Units exist yet.

The customer dashboard presents this section as:

## Waiting for You

The business dashboard presents:

## Waiting for Customer Verification

# 13\. Customer Verification

The registered customer may:

- Verify one Purchase Record
- Verify selected Purchase Records
- Verify all visible Purchase Records
- Reject
- Raise a dispute

Only the registered customer may complete these actions.

# 14\. Verification Screen

Each Purchase Record should display:

Business

Reward Program

Commercial Product or Service

Quantity

Purchase Date

Purchase Time

Recorded By

Branch

Notes

Buttons:

✅ Verify

❌ Reject

⚠ Raise Dispute

# 15\. Rejection

When rejecting, customers select a reason.

Suggested reasons:

- Wrong quantity
- Wrong item
- I did not make this purchase
- Duplicate
- Wrong Reward Program
- Other

Rejections never create Verified Units.

# 16\. Disputes

A dispute indicates that the Purchase Record is partially or conditionally incorrect.

Examples:

"I bought four coffees, not five."

"I purchased a Premium Haircut, not Hair Treatment."

The Purchase Record moves to:

Under Review.

# 17\. Business Review

Authorised business users may:

Review

Respond

Correct

Cancel

Replacement records are created where necessary.

The original Purchase Record remains in history.

# 18\. Verified Units

Once the customer verifies:

The Customer-Verified Loyalty Engine creates Verified Units.

Those Verified Units immediately update:

Current Loyalty Cycle

Reward Eligibility

Business Dashboard

Customer Dashboard

Trust Ledger

# 19\. Notifications

Every state transition generates notifications.

Examples:

Purchase Record Created

→ Customer

Purchase Verified

→ Business

Purchase Rejected

→ Business Owner / Manager

Dispute Raised

→ Business

Correction Submitted

→ Customer

Reward Available

→ Customer

Reward Redeemed

→ Customer and Business

Notification preferences will be configurable in later releases.

# 20\. Purchase Timeline

Every Purchase Record shall have a complete chronological timeline.

Example:

09:12 Purchase Record created

09:12 Customer notified

14:47 Customer opened Purchase Record

14:48 Customer verified

14:48 Verified Units created

14:48 Loyalty Cycle updated

14:48 Reward eligibility recalculated

14:48 Trust Ledger updated

This timeline is available for audit, support and fraud investigation.

# 21\. Purchase Confidence (Future)

The architecture shall support an internal Purchase Confidence score.

Factors may include:

- Recorder history
- Business Trust Score
- Customer verification behaviour
- Quantity
- Time of day
- Duplicate patterns
- Device history
- Future AI analysis

This score is internal only and is not part of the MVP.

# 22\. Verification Performance

The platform should measure:

- Average verification time
- Pending Purchase Records
- Verification rate
- Rejection rate
- Dispute rate
- Correction rate

These metrics help businesses improve operational quality.

# 23\. Edge Cases

The lifecycle must support:

- Parent paying for three children's haircuts
- Customer buying ten coffees in one order
- Family using one loyalty number
- Staff accidentally recording the wrong quantity
- Duplicate submission
- Customer verifies weeks later
- Business closes while Purchase Record is pending
- Reward Program retired while Purchase Record is pending
- Staff member leaves before verification
- Customer changes phone number before verification

No edge case should require manual database editing.

# 24\. Functional Requirements

### FR-PVL-001

Every qualifying purchase shall create a Purchase Record.

### FR-PVL-002

Every Purchase Record shall follow the Purchase Verification Lifecycle.

### FR-PVL-003

Every Purchase Record shall belong to one Reward Program.

### FR-PVL-004

Every Purchase Record shall belong to one customer.

### FR-PVL-005

Every Purchase Record shall belong to one business.

### FR-PVL-006

Every Purchase Record shall generate Trust Events.

### FR-PVL-007

Only the registered customer may verify a Purchase Record.

### FR-PVL-008

Verified Purchase Records shall generate Verified Units.

### FR-PVL-009

Rejected Purchase Records shall never generate Verified Units.

### FR-PVL-010

Corrections shall create replacement records rather than modifying history.

### FR-PVL-011

Every Purchase Record shall maintain a complete timeline.

### FR-PVL-012

Every state transition shall be auditable.

# 25\. Business Rules

| Rule ID | Rule                                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-047  | Every commercial purchase recognised by the platform shall create one Purchase Record.                                                                                  |
| BR-048  | Purchase Records are immutable after creation.                                                                                                                          |
| BR-049  | Every Purchase Record belongs to exactly one Reward Program.                                                                                                            |
| BR-050  | Every Purchase Record belongs to exactly one customer.                                                                                                                  |
| BR-051  | Every Purchase Record belongs to exactly one business.                                                                                                                  |
| BR-052  | Only the registered customer may verify a Purchase Record.                                                                                                              |
| BR-053  | Verification creates Verified Units.                                                                                                                                    |
| BR-054  | Rejection creates no Verified Units.                                                                                                                                    |
| BR-055  | Every state transition creates one or more Trust Events.                                                                                                                |
| BR-056  | Corrections occur through replacement records, never by editing historical Purchase Records.                                                                            |
| BR-057  | Every Purchase Record shall maintain a complete timeline.                                                                                                               |
| BR-058  | The Purchase Verification Lifecycle applies equally regardless of whether the Purchase Record was created by staff, a manager, an owner or a future system integration. |

# 26\. Acceptance Criteria

This section is approved when:

- The Purchase Verification Lifecycle is fully defined.
- Purchase Record ownership is unambiguous.
- Customer verification responsibilities are clear.
- State transitions are documented.
- Business review and correction workflows are defined.
- Notifications are identified.
- Purchase timelines are supported.
- Trust Events are generated at every state transition.
- All business rules are accepted.
- The lifecycle is implementation-ready for the Technical Requirements Document.

# 27\. Next Section

The next section will define:

## Reward Programs, Verified Units and Loyalty Cycle Management

This section will specify:

- Reward Program configuration.
- Program versioning.
- Qualifying product mapping.
- Verified Unit calculations.
- Loyalty Cycle progression.
- Reward availability.
- On Us Moments.
- Reward redemption.
- Cycle reset.
- Multi-cycle history.
- Future extensibility for Verified Commerce.