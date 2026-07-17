> **Title:** TRD Chapter 15 — Reporting, Analytics and Projection Architecture  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/15-reporting-and-analytics.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Technical Requirements Document

## PART VIII - Reporting and Analytics

# Chapter 15: Reporting, Analytics and Projection Architecture

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-14

# 15.1 Purpose

This chapter defines how 11thONUS shall transform operational platform activity into reliable dashboards, reports and business insights.

It establishes:

- authoritative data versus derived reporting data;
- reporting projections;
- customer progress views;
- business dashboards;
- Reward Program performance;
- staff activity;
- purchase verification metrics;
- disputes and corrections;
- outstanding reward liability;
- platform administration analytics;
- exports;
- Firebase Analytics;
- data freshness;
- cost controls;
- reconciliation;
- future data warehouse readiness.

Reporting shall help businesses make decisions.

It shall not simply display large volumes of operational data.

# 15.2 Reporting Objectives

The reporting architecture shall ensure that:

- Every reported metric has a clear definition.
- Every metric is traceable to authoritative records.
- Dashboards do not rely on expensive full-collection scans.
- Operational dashboards update quickly enough to support daily work.
- Historical reports remain reproducible.
- Businesses see only their own data.
- Customers see only their own loyalty information.
- Platform administrators can access approved aggregated platform views.
- Derived projections can be rebuilt after failure or correction.
- Future analytical infrastructure can be introduced without redesigning operational domains.

# 15.3 Reporting Principles

## RAP-001 - Source Records Remain Authoritative

Reports shall derive from authoritative domain records including:

- Purchase Records;
- Verified Units;
- Loyalty Cycles;
- rewards;
- redemptions;
- business memberships;
- subscriptions;
- Trust Events.

A report shall not become the authoritative source for commercial history.

## RAP-002 - Projections Are Rebuildable

Every dashboard aggregate or report projection must be reproducible from source records and events.

## RAP-003 - Metric Definitions Are Centralized

The same metric shall not be calculated differently across separate screens.

## RAP-004 - Operational and Analytical Workloads Are Separated

Customer verification and reward redemption shall not wait for complex reporting calculations.

## RAP-005 - Reporting Must Be Timezone-Aware

Business-day reporting shall use the business timezone.

## RAP-006 - Data Freshness Must Be Visible

Users should understand whether a figure is live, recently updated or awaiting processing.

## RAP-007 - Access Follows Domain Permissions

Reports shall respect business, role and customer boundaries.

## RAP-008 - Insight Before Volume

Dashboards should emphasize what requires attention and what action should follow.

# 15.4 Reporting Layers

The reporting architecture shall contain four layers.

Authoritative Domain Records  
↓  
Domain Events and Trust Events  
↓  
Reporting Projections  
↓  
Dashboards, Reports and Exports

## Layer 1 - Authoritative Records

Owned by operational domains.

Examples:

- purchaseRecords;
- verifiedUnits;
- loyaltyCycles;
- rewards;
- redemptions;
- subscriptions.

## Layer 2 - Events

Events communicate changes that may affect reporting.

Examples:

- Purchase Record created;
- Purchase Record verified;
- Purchase Record rejected;
- reward available;
- reward redeemed;
- staff suspended;
- subscription activated.

## Layer 3 - Reporting Projections

Derived records optimized for known reporting queries.

## Layer 4 - Presentation

Dashboards, charts, summaries, exports and future analytical tools.

# 15.5 Reporting Domains

The Reporting Domain shall support several distinct analytical areas.

## 15.5.1 Customer Reporting

Provides customers with:

- current progress;
- purchases waiting for them;
- verified purchase history;
- available rewards;
- previous On Us Moments;
- activity by business and Reward Program.

## 15.5.2 Business Operational Reporting

Supports daily operation.

Examples:

- Purchase Records created today;
- waiting for customer verification;
- rejected purchases;
- open disputes;
- rewards available;
- rewards redeemed;
- staff activity;
- outstanding reviews.

## 15.5.3 Business Management Reporting

Supports weekly and monthly management.

Examples:

- active customers;
- returning customers;
- Reward Program performance;
- verification rates;
- average verification time;
- cycle completion time;
- reward redemption rate;
- repeat participation after redemption.

## 15.5.4 Subscription Reporting

Supports business and platform billing operations.

Examples:

- active plan;
- current usage against limits;
- renewal date;
- payment history;
- past-due status;
- upgrade eligibility.

## 15.5.5 Platform Administration Reporting

Provides approved cross-platform aggregates.

Examples:

- active businesses;
- active customers;
- Purchase Records processed;
- rewards earned;
- rewards redeemed;
- subscription revenue;
- activity by country;
- activity by business category;
- operational review volume.

# 15.6 Metric Catalogue

A formal Metric Catalogue shall define every published metric.

Each metric shall include:

- metric ID;
- name;
- description;
- business purpose;
- formula;
- numerator;
- denominator;
- source records;
- filters;
- timezone treatment;
- data freshness;
- supported dimensions;
- owner;
- version.

Example:

type MetricDefinition = {  
metricId: string;  
name: string;  
description: string;  
formulaDescription: string;  
sourceCollections: string\[\];  
dimensions: string\[\];  
timezonePolicy: string;  
freshnessTarget: string;  
version: number;  
ownerDomain: string;  
};

No production dashboard metric shall exist without a Metric Catalogue definition.

# 15.7 Core Purchase Metrics

## Purchase Records Created

Count of Purchase Records created within the selected period.

## Verified Purchase Records

Count of Purchase Records verified by customers.

## Rejected Purchase Records

Count of Purchase Records rejected by customers.

## Disputed Purchase Records

Count of Purchase Records moved into dispute.

## Verification Rate

Recommended formula:

Verified Purchase Records  
÷  
Purchase Records with a final customer response

Pending Purchase Records should not automatically be included in the denominator unless explicitly stated.

## Average Verification Time

Average duration between:

- Purchase Record creation; and
- customer verification.

Rejected or disputed records should be reported separately unless the metric definition states otherwise.

# 15.8 Core Loyalty Metrics

## Verified Units Issued

Total credited Verified Units within a selected period.

Reversal units shall be reported separately or netted only in clearly labelled metrics.

## Active Loyalty Cycles

Number of cycles currently in:

- active; or
- reward available status.

## Loyalty Cycles Completed

Number of cycles closed after successful reward redemption.

## Average Cycle Completion Time

Average elapsed time between:

- cycle start; and
- reward availability or redemption.

The report must clearly state which endpoint is used.

## Customers Near Reward

Customers whose active cycle has reached a configurable progress threshold.

Example:

- 8 of 10;
- 9 of 10.

# 15.9 Core Reward Metrics

## Rewards Available

Number of earned rewards currently awaiting redemption.

## Rewards Redeemed

Number of successful redemptions within the selected period.

## Reward Redemption Rate

Recommended formula:

Rewards Redeemed  
÷  
Rewards That Became Available

The metric must state the cohort and time window to avoid misleading results.

## Outstanding Rewards

Rewards available but not yet redeemed.

## On Us Moments Delivered

Successful completed redemptions presented in customer-facing language.

## Average Time to Redemption

Average duration between:

- reward available; and
- reward redeemed.

# 15.10 Outstanding Reward Liability

11thONUS is not an accounting platform, but businesses need visibility into expected reward obligations.

The platform may report:

- number of outstanding rewards;
- estimated retail value;
- estimated internal business cost where supplied;
- age of outstanding rewards;
- Reward Program distribution.

This report shall be labelled as an estimate.

The business remains responsible for accounting treatment.

# 15.11 Customer Metrics

Businesses may view business-scoped customer insights such as:

- new participating customers;
- active customers;
- returning customers;
- customers with multiple verified Purchase Records;
- customers near reward;
- customers with available rewards;
- customers who completed more than one Loyalty Cycle;
- customers inactive for a defined period.

Businesses shall not see the customer's activity with other businesses.

# 15.12 Returning Customer Definition

The platform shall define returning customers carefully.

A recommended definition is:

A customer with qualifying activity on at least two distinct commercial dates within the selected business and reporting period.

Alternative definitions may be supported but must use distinct metric IDs.

# 15.13 Reward Program Performance

Each Reward Program should report:

- active customers;
- Purchase Records;
- Verified Units;
- verification rate;
- rejection rate;
- dispute rate;
- active Loyalty Cycles;
- rewards available;
- rewards redeemed;
- average cycle completion time;
- repeat-cycle participation;
- outstanding reward estimate.

Historical reports shall retain the applicable Reward Program version.

# 15.14 Staff Activity Reporting

Owners and authorized managers may view:

- Purchase Records created by staff member;
- verified records;
- rejected records;
- disputed records;
- correction rate;
- redemption activity;
- average customer verification time;
- operational review count.

Staff reporting is intended for accountability and coaching.

It shall not produce public rankings or unsupported conclusions about employee performance.

# 15.15 Staff Metric Cautions

Staff metrics may be affected by:

- shift length;
- customer volume;
- assigned service category;
- business role;
- internet connectivity;
- delayed customer verification.

The UI should not present raw comparisons without context.

# 15.16 Operational Health Indicators

The platform may summarize business operations using indicators such as:

- verification rate;
- average verification time;
- unresolved disputes;
- correction rate;
- reward fulfilment rate;
- pending Purchase Record age;
- sync failure rate.

Suggested statuses:

- Excellent;
- Good;
- Needs Attention.

The underlying calculation shall be governed by versioned Rules Studio definitions.

Operational Health shall remain internal to the business and platform administration unless future policy explicitly permits wider use.

# 15.17 Dashboard Architecture

Dashboards shall consume precomputed or incrementally maintained projections.

A business dashboard should not issue numerous large operational queries on every page load.

Recommended projection families include:

/businessDailyMetrics  
/businessMonthlyMetrics  
/rewardProgramDailyMetrics  
/rewardProgramMonthlyMetrics  
/staffDailyMetrics  
/customerProgramProgress  
/platformDailyMetrics  
/subscriptionUsageProjections

The exact naming and partitioning shall follow final query and cost analysis.

# 15.18 Projection Document Example

type BusinessDailyMetricDocument = {  
id: string;  
businessId: string;  
businessDate: string;  
timezone: string;  
purchaseRecordsCreated: number;  
verifiedPurchaseRecords: number;  
rejectedPurchaseRecords: number;  
disputedPurchaseRecords: number;  
verifiedUnitsIssued: number;  
rewardsAvailable: number;  
rewardsRedeemed: number;  
activeCustomers: number;  
updatedAt: Timestamp;  
projectionVersion: number;  
sourceCheckpoint?: string;  
};

Projection documents shall not contain data that cannot be reconstructed.

# 15.19 Event-Driven Projection Updates

Reporting projections should update in response to domain events.

Example:

purchase.verified.v1  
↓  
Update business daily verified count  
↓  
Update Reward Program metrics  
↓  
Update customer progress projection  
↓  
Update platform aggregate

Each projection consumer shall be:

- idempotent;
- retryable;
- versioned;
- independently testable.

# 15.20 Scheduled Reconciliation

Event-driven projection updates may fail or arrive late.

Scheduled reconciliation jobs shall:

- compare projections against authoritative records;
- identify missing updates;
- repair inconsistencies;
- record correction results;
- avoid duplicating already-applied events.

Reconciliation frequency shall depend on business importance and cost.

# 15.21 Projection Checkpoints

Projection workers should maintain checkpoints where appropriate.

A checkpoint may record:

- last processed event;
- last processed timestamp;
- projection version;
- rebuild status;
- error state.

Checkpoints shall not prevent replay from a known earlier point.

# 15.22 Projection Rebuilds

The platform shall support rebuilding:

- one customer progress projection;
- one Reward Program;
- one business date;
- one business month;
- one entire reporting family;
- platform aggregates.

Rebuilds shall run through controlled administrative jobs.

They shall not require manual Firestore editing.

# 15.23 Customer Progress Projection

Customer-facing progress must load quickly.

A derived progress projection may include:

type CustomerProgramProgressDocument = {  
id: string;  
customerId: string;  
businessId: string;  
rewardProgramId: string;  
activeCycleId: string;  
verifiedUnitsApplied: number;  
requiredVerifiedUnits: number;  
pendingVerifiedUnits: number;  
rewardStatus: "not_available" | "available";  
rewardId?: string;  
lastActivityAt?: Timestamp;  
updatedAt: Timestamp;  
projectionVersion: number;  
};

This projection remains rebuildable from:

- Verified Units;
- Loyalty Cycles;
- rewards.

# 15.24 Data Freshness Classes

Reports shall declare a freshness class.

## Real-Time or Near Real-Time

Target: seconds.

Examples:

- Purchase Record status;
- current customer progress;
- reward availability;
- redemption result.

## Operational Freshness

Target: under 1 minute.

Examples:

- daily dashboard counters;
- review queue counts;
- staff activity summaries.

## Management Freshness

Target: hourly or daily.

Examples:

- monthly trends;
- retention analysis;
- category performance.

## Historical or Strategic

Target: daily or scheduled.

Examples:

- benchmarking;
- cohort analysis;
- future predictive analytics.

# 15.25 Freshness Display

Where material, the UI should display:

- Updated just now;
- Updated 5 minutes ago;
- Last updated today at 14:20;
- Report processing.

The interface shall not imply real-time accuracy where only scheduled aggregation exists.

# 15.26 Date and Time Handling

All source timestamps shall remain in UTC.

Reports shall convert events into business-local dates using:

- the business timezone active at event time;
- or a stored timezone snapshot where necessary.

Historical reporting shall not change because a business later changes timezone.

# 15.27 Reporting Dimensions

Supported analytical dimensions may include:

- business;
- branch;
- Reward Program;
- Reward Program version;
- staff member;
- customer cohort;
- country;
- city;
- business category;
- date;
- language;
- subscription plan;
- Purchase Record source.

Dimensions containing personal or sensitive data shall follow privacy controls.

# 15.28 Customer Cohorts

Future management reporting may group customers by:

- registration month;
- first verified purchase month;
- first reward month;
- Reward Program joined;
- inactivity period;
- completed Loyalty Cycles.

Cohort definitions shall be documented and versioned.

# 15.29 Repeat Loyalty Analysis

The platform should eventually answer:

- How many customers return after their first verified purchase?
- How many complete one Loyalty Cycle?
- How many begin a second cycle?
- How many redeem an On Us Moment and return again?
- Which Reward Programs produce repeat cycles fastest?

These metrics are more strategically useful than simple transaction totals.

# 15.30 Customer Privacy in Reporting

Business reports may contain identifiable customers only where operationally necessary.

Examples:

- customer near reward;
- customer with open dispute;
- customer with available reward.

Aggregated reports should avoid unnecessary customer identifiers.

Platform-wide reporting shall use aggregation or pseudonymized data where appropriate.

# 15.31 Business Privacy

No business shall access:

- another business's reports;
- another business's staff metrics;
- another business's customer behavior;
- unpublished benchmark data.

Future benchmarking shall use anonymized peer groups.

# 15.32 Platform Analytics

Super administrators may view approved aggregates including:

- registered businesses;
- active businesses;
- paying businesses;
- active customers;
- Purchase Records;
- verification rates;
- rewards earned;
- rewards redeemed;
- activity by country;
- activity by category;
- subscription revenue;
- operational incidents.

Access shall be permission-controlled and audited.

# 15.33 Firebase Analytics

Firebase Analytics may measure product interaction such as:

- registration funnel;
- business onboarding steps;
- staff invitation completion;
- Purchase Record submission attempts;
- customer verification screen views;
- reward views;
- redemption journey;
- language selection;
- search usage;
- feature adoption.

Firebase Analytics shall not become the authoritative source for commercial counts.

Commercial metrics come from domain records.

# 15.34 Analytics Event Naming

Product analytics events should use consistent names.

Example pattern:

&lt;domain&gt;\_&lt;action&gt;\_&lt;object&gt;

Examples:

- customer_viewed_pending_purchase;
- customer_verified_purchase;
- business_started_reward_program_setup;
- business_completed_onboarding;
- staff_scanned_customer_qr;
- customer_viewed_available_reward.

Analytics names should describe user interaction, not internal backend processing.

# 15.35 Analytics Privacy

Product analytics shall:

- avoid storing unnecessary personal identifiers;
- respect consent requirements;
- avoid sending sensitive KYC details;
- apply retention controls;
- separate operational analytics from marketing profiling.

# 15.36 Export Architecture

Businesses may export approved report data.

Supported MVP formats may include:

- CSV;
- PDF.

Excel-compatible export may be provided through CSV initially or native XLSX later.

Exports shall:

- respect applied filters;
- include report period;
- include generation timestamp;
- include business timezone;
- state metric definitions where material;
- respect user permissions;
- avoid hidden cross-business data.

# 15.37 Export Processing

Small exports may be generated synchronously.

Large exports shall use background jobs.

Recommended flow:

User requests export  
↓  
Server validates permissions  
↓  
Export job created  
↓  
Background processor generates file  
↓  
File stored securely  
↓  
User notified  
↓  
Time-limited download link issued

Exports shall have retention and expiry rules.

# 15.38 PDF Reporting

PDF reports should prioritize:

- concise summaries;
- key metrics;
- trend explanations;
- action items;
- clear date ranges;
- accessible layouts.

PDF reports shall not attempt to reproduce every dashboard interaction.

# 15.39 Cost Controls

Reporting architecture shall minimize Firestore cost through:

- incremental projections;
- scheduled aggregates;
- bounded queries;
- cached reference data;
- cursor pagination;
- limited real-time listeners;
- export batching;
- avoiding repeated source scans.

The platform shall monitor cost by:

- business dashboard load;
- reporting projection write;
- export job;
- platform analytics job;
- Trust Event processing.

# 15.40 Firestore Aggregation Queries

Firestore aggregation queries may support selected counts and sums where cost-effective.

They shall not replace projections when:

- the query runs frequently;
- the source collection is large;
- multiple dimensions are required;
- historical trend reporting is needed;
- predictable dashboard latency is required.

# 15.41 Future Data Warehouse Readiness

Operational Firestore data may eventually feed an analytical warehouse.

Potential future platforms may include:

- BigQuery;
- another approved cloud warehouse.

The warehouse may support:

- large-scale historical analysis;
- cross-country benchmarking;
- cohort analysis;
- predictive models;
- finance reporting;
- advanced business intelligence.

Operational workflows shall not depend synchronously on the warehouse.

# 15.42 Warehouse Data Export

Future warehouse exports shall use controlled pipelines.

They should:

- preserve event and schema versions;
- minimize personal data;
- support partitioning by date;
- support country and business dimensions;
- remain replayable;
- include data-quality checks.

# 15.43 Business Intelligence Tool Readiness

Future approved BI tools may consume warehouse or reporting data.

They shall not connect directly to unrestricted production Firestore collections.

Access should use:

- curated datasets;
- approved service identities;
- row-level security;
- audited access;
- documented metric definitions.

# 15.44 Reconciliation Reporting

Because 11thONUS does not initially process customer payments, business reconciliation remains operational rather than financial.

The platform may allow businesses to compare:

- external sales total;
- Purchase Record count;
- verified quantity;
- reward redemptions;
- unresolved differences.

Manual reconciliation inputs shall remain clearly distinguished from verified platform records.

# 15.45 Reporting Errors and Corrections

If a source record is reversed or corrected:

- authoritative domain records are updated through approved compensating events;
- affected projections are recalculated;
- prior report values may change;
- the correction remains auditable.

The platform should not silently preserve a known incorrect projection.

# 15.46 Reporting Monitoring

Monitoring shall include:

- projection backlog;
- failed projection updates;
- rebuild duration;
- reconciliation mismatches;
- stale dashboards;
- export failures;
- warehouse pipeline failures;
- metric computation errors;
- unusual cost increases.

# 15.47 Data Quality Checks

Scheduled data-quality checks should identify:

- Verified Units without valid Purchase Records;
- rewards without Loyalty Cycles;
- redemptions without available rewards;
- duplicate active cycles;
- missing Reward Program versions;
- projection totals inconsistent with source records;
- unresolved outbox events;
- orphaned memberships;
- invalid timezone or currency fields.

# 15.48 Reporting Tests

Testing shall include:

## Metric Unit Tests

Validate formulas and denominator rules.

## Projection Integration Tests

Validate event-to-projection updates.

## Idempotency Tests

Ensure duplicate event delivery does not inflate totals.

## Rebuild Tests

Ensure projections can be recreated from source records.

## Timezone Tests

Validate business-day boundaries.

## Authorization Tests

Ensure users see only permitted reports.

## Export Tests

Validate filters, labels and file contents.

# 15.49 Functional Requirements

## FR-RPT-001

Every published metric shall have a centralized definition.

## FR-RPT-002

Reports shall derive from authoritative domain records or rebuildable projections.

## FR-RPT-003

Customer progress projections shall remain traceable to Verified Units and Loyalty Cycles.

## FR-RPT-004

Operational dashboards shall use bounded and cost-efficient queries.

## FR-RPT-005

Reporting projections shall be idempotent and rebuildable.

## FR-RPT-006

Businesses shall access only their own reporting data.

## FR-RPT-007

Customers shall access only their own loyalty information.

## FR-RPT-008

Platform-wide analytics shall require approved administrative permissions.

## FR-RPT-009

Reporting shall use business-local timezone rules.

## FR-RPT-010

Data freshness shall be defined and visible where material.

## FR-RPT-011

Exports shall respect current filters and permissions.

## FR-RPT-012

Firebase Analytics shall not be the authoritative source for commercial metrics.

## FR-RPT-013

Scheduled reconciliation shall identify and repair projection inconsistencies.

## FR-RPT-014

The architecture shall support future warehouse and BI integration.

## FR-RPT-015

Outstanding reward reporting shall be clearly labelled as operational or estimated liability.

## FR-RPT-016

Metric definitions and projection schemas shall be versioned.

## FR-RPT-017

Duplicate event processing shall not inflate reported totals.

## FR-RPT-018

Reporting failures shall be monitored and recoverable.

# 15.50 Reporting Rules

| Rule ID | Rule                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| RR-001  | Authoritative commercial records shall take precedence over dashboard projections.                         |
| RR-002  | Every published metric shall have one governed definition.                                                 |
| RR-003  | Pending Purchase Records shall not be treated as verified loyalty activity.                                |
| RR-004  | Reporting denominators shall be explicitly defined.                                                        |
| RR-005  | Projections shall be rebuildable and idempotent.                                                           |
| RR-006  | Business-day reporting shall use the applicable business timezone.                                         |
| RR-007  | Firebase Analytics shall measure product usage, not authoritative commerce totals.                         |
| RR-008  | Reports shall not expose cross-business customer activity.                                                 |
| RR-009  | Platform benchmarking shall use anonymized, governed peer groups.                                          |
| RR-010  | Large exports shall use secure background processing.                                                      |
| RR-011  | Reporting corrections shall follow authoritative source corrections.                                       |
| RR-012  | Estimated financial figures shall be clearly identified as estimates.                                      |
| RR-013  | Staff activity metrics shall be presented with operational context.                                        |
| RR-014  | Real-time claims shall not be made for scheduled or delayed projections.                                   |
| RR-015  | Future BI tools shall consume curated analytical datasets rather than unrestricted production collections. |

# 15.51 Acceptance Criteria

This chapter is approved when:

- Authoritative records and reporting projections are clearly separated.
- A centralized Metric Catalogue is required.
- Purchase, loyalty, reward, customer and staff metrics are defined.
- Outstanding reward reporting is established.
- Event-driven projections and scheduled reconciliation are specified.
- Customer and business privacy boundaries are clear.
- Firebase Analytics responsibilities are separated from commercial reporting.
- Exports, freshness, timezone and cost controls are documented.
- Projection rebuilds and data-quality checks are required.
- Future warehouse and BI readiness is preserved.

# 15.52 Next Chapter

The next chapter should define:

# Progressive Web Application, Frontend Architecture and Offline Experience

It will cover:

- React and TypeScript architecture;
- domain-based frontend structure;
- customer, business and administration shells;
- role-context switching;
- state management;
- data fetching;
- Firebase client boundaries;
- PWA installation;
- offline caching;
- pending sync;
- QR scanning;
- responsive behavior;
- accessibility;
- localization;
- error handling;
- performance;
- secure local storage;
- frontend testing.