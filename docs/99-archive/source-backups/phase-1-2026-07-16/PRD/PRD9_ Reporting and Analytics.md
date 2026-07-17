# 11thONUS Product Requirements Document-2.9

---

# 11thONUS

# Product Requirements Document

## Stage 2 – Functional Requirements

# Section 9: Reporting, Analytics and Business Intelligence

**Version:** 1.0

---

# 1. Purpose

This section defines how 11thONUS transforms operational activity into actionable business intelligence.

Reporting is not intended to display data.

Its purpose is to help businesses make better decisions.

Every report should answer at least one meaningful business question.

---

# 2. Design Philosophy

The reporting framework shall focus on:

- clarity;
- actionability;
- simplicity;
- trust;
- operational insight.

Businesses should spend less time interpreting reports and more time improving customer loyalty.

---

# 3. Reporting Levels

The platform provides reporting at three levels.

## Operational

Supports day-to-day management.

Examples:

- purchases waiting for verification;
- today's On Us Moments;
- outstanding rewards;
- staff activity.

---

## Management

Supports weekly and monthly decision-making.

Examples:

- repeat customer growth;
- Reward Program performance;
- customer retention;
- verification behaviour.

---

## Executive

Supports strategic planning.

Examples:

- subscription value;
- customer lifetime trends;
- programme effectiveness;
- business growth.

---

# 4. Dashboard Principles

Every dashboard must answer:

What happened?

Why did it happen?

What requires attention?

What should I do next?

If a dashboard cannot answer those four questions, it should be redesigned.

---

# 5. Business Dashboard

Suggested homepage cards:

Today's Purchases

Waiting for Customer Verification

Customers Near Their Next Reward

Today's On Us Moments

Outstanding Rewards

Active Reward Programs

Staff Active Today

Subscription Status

---

# 6. Customer Dashboard

Customers should see only information relevant to them.

Suggested sections:

Waiting for You

Progress

Your Rewards

Your On Us Moments

Recent Activity

Businesses Visited

The customer dashboard should never expose operational or financial analytics.

---

# 7. Reward Program Analytics

Every Reward Program should report:

- Active customers
- Active Loyalty Cycles
- Completed Loyalty Cycles
- Verification rate
- Average time to complete a cycle
- Average Verified Units per Purchase
- Outstanding rewards
- On Us Moments delivered
- Customer retention trend

These metrics help businesses understand which programmes genuinely encourage repeat visits.

---

# 8. Customer Insights

Businesses should be able to identify:

Most loyal customers

Customers closest to their next reward

Customers who have not returned recently

Customers with outstanding rewards

Customers with repeated disputes

This enables better engagement without overwhelming the business owner.

---

# 9. Staff Performance

Each staff member should have access only to their permitted data, while managers and owners receive broader summaries.

Suggested operational metrics:

- Purchase Records created
- Verification rate
- Correction rate
- Rejection rate
- Disputes raised
- Average verification time

These metrics support coaching and accountability rather than employee ranking.

---

# 10. Operational Health

The platform should provide a concise Operational Health summary.

Suggested indicators include:

- Purchase Verification Rate
- Customer Participation Rate
- Outstanding Purchase Reviews
- Average Verification Time
- Reward Fulfilment Rate
- Operational Health Status

This provides business owners with a quick understanding of how effectively their programme is operating.

---

# 11. Loyalty Intelligence

Businesses should understand:

How frequently customers return.

Which Reward Programs generate the strongest loyalty.

How long customers take to complete a Loyalty Cycle.

How many customers return after experiencing an On Us Moment.

These insights help businesses improve retention rather than simply monitor activity.

---

# 12. Growth Metrics

Examples include:

New customers this month

Returning customers

Completed Loyalty Cycles

On Us Moments delivered

Average loyalty completion time

Repeat purchase frequency

Business participation trend

The emphasis should be on sustainable customer relationships.

---

# 13. Financial Awareness (Non-Accounting)

Although 11thONUS is not an accounting platform, businesses benefit from understanding the commercial implications of their loyalty programme.

Examples:

Estimated reward liability

Estimated rewards delivered

Average reward frequency

Estimated programme participation

These figures are indicative and do not replace financial accounting.

---

# 14. Comparative Trends

Businesses should view trends over time rather than isolated numbers.

Examples:

Last 7 days

Last 30 days

Last 90 days

Year-to-date

Trend analysis should be prioritised over large data tables.

---

# 15. Notifications and Recommendations

Reports should not simply present information.

They should highlight actions.

Examples:

"Five customers are one purchase away from their next On Us Moment."

"Three Purchase Records require review."

"Verification times increased this week."

Future AI capabilities may recommend operational improvements while leaving all decisions to the business owner.

---

# 16. Exports

Businesses should be able to export reports in common formats.

Initial support should include:

- PDF
- CSV
- Excel

Exports should reflect the same filters applied within the dashboard.

---

# 17. Super Admin Analytics

The platform operator should monitor:

Business growth

Subscription status

Active customers

Reward Program adoption

Platform usage

Operational reliability

Regional trends

Business category performance

No business should be able to view another business's data.

---

# 18. Future Benchmarking

The architecture should support anonymous benchmarking in future releases.

Examples:

"Your verification rate is above average for coffee shops in Burundi."

"Your reward completion time is faster than similar businesses."

Benchmarking must use aggregated, anonymised data and must never expose individual business information.

---

# 19. Functional Requirements

### FR-BI-001

The platform shall provide operational, management and executive reporting.

### FR-BI-002

Businesses shall view Reward Program performance.

### FR-BI-003

Businesses shall monitor customer loyalty progression.

### FR-BI-004

Businesses shall monitor staff operational activity.

### FR-BI-005

The platform shall support trend reporting over configurable time periods.

### FR-BI-006

Businesses shall export reports.

### FR-BI-007

The platform shall provide operational recommendations without automatically changing business data.

### FR-BI-008

Super administrators shall access platform-wide aggregated analytics.

---

# 20. Business Rules

| Rule ID | Rule |
| --- | --- |
| BR-086 | Reports shall prioritise actionable insight over raw data. |
| BR-087 | Businesses shall access only their own operational data. |
| BR-088 | Customers shall access only their own loyalty information. |
| BR-089 | Comparative benchmarking shall use anonymised aggregated data only. |
| BR-090 | AI recommendations shall remain advisory unless explicitly approved by the user. |

---

# 21. Acceptance Criteria

This section is approved when:

- Reporting supports operational, management and executive decision-making.
- Reward Program performance reporting is complete.
- Customer and staff insights are defined.
- Operational Health reporting is established.
- Export requirements are documented.
- Future benchmarking is architecturally supported.
- Business rules are accepted.

---

# 22. Next Section

The next section will define:

## Platform Administration, Roles and Permissions

This section will establish:

- Super Admin capabilities
- Business Owner permissions
- Manager permissions
- Staff permissions
- Customer permissions
- Multi-business support
- Future franchise support
- Role inheritance
- Security boundaries
- Administrative governance

---

## One recommendation before we continue

I think we should start thinking about **11thONUS as a platform that grows in layers**, not features.

Instead of a roadmap that says:

- Gift Cards
- Wallet
- AI
- Promotions

I'd define platform evolution like this:

### Layer 1 — Verified Loyalty (MVP)

- Customer verification
- Reward Programs
- On Us Moments
- Reporting

### Layer 2 — Verified Business

- Advanced analytics
- Benchmarking
- POS reconciliation
- Multi-branch
- Franchises

### Layer 3 — Verified Commerce

- Gift rewards
- Wallet
- Promotions
- Memberships
- Referrals
- Marketplace integrations

### Layer 4 — Verified Intelligence

- AI business advisor
- Predictive loyalty analytics
- Fraud pattern detection
- Reward optimisation
- Customer lifetime insights

This layered approach keeps the MVP disciplined while giving investors, partners and developers a clear long-term vision. It also aligns perfectly with the philosophy we've established: **build a simple product today, but build it on an architecture that doesn't need to be rebuilt tomorrow.**