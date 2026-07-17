# 11thONUS Rules Studio

**Version:** 1.0

**Status:** Core Platform Service

**Governed By:** 11thONUS Platform Constitution

---

# Mission

Rules Studio is the governance platform responsible for managing configurable business behaviour across 11thONUS.

Its purpose is to separate **business policy** from **application code**, allowing the platform to evolve safely without frequent engineering changes.

Knowledge Studio manages **what the platform knows**.

Rules Studio manages **how the platform behaves**.

---

# Design Philosophy

Rules should be configured.

Not hardcoded.

Every configurable business rule reduces technical debt and improves operational agility.

Engineering builds reusable engines.

Product administrators configure platform behaviour.

---

# Platform Architecture

```
                 11thONUS Platform

                    Constitution
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
 Knowledge Studio                    Rules Studio
        │                                   │
 Commerce Knowledge                Business Behaviour
        │                                   │
        └──────────────┬────────────────────┘
                       │
             Customer-Verified
              Loyalty Platform
```

---

# Rule Hierarchy

Rules are evaluated from the most general to the most specific.

```
Platform Rules

↓

Country Rules

↓

Subscription Plan Rules

↓

Business Rules

↓

Reward Program Rules

↓

Purchase Rules

↓

Customer Rules

↓

Runtime Evaluation
```

This allows global consistency while supporting regional flexibility.

---

# Rule Categories

## Platform Rules

These apply to every business.

Examples:

- Supported languages
- Maximum upload size
- Authentication policies
- Notification defaults
- Password policies
- Platform maintenance behaviour

---

## Country Rules

Designed for expansion across Africa.

Examples:

- Currency
- Phone formats
- Public holidays
- Time zone
- Regulatory requirements
- Mobile money providers
- Tax display preferences

This avoids country-specific code forks.

---

## Subscription Plan Rules

Subscription plans should not merely unlock features.

They should configure platform capabilities.

Example:

### Bronze

- Up to 10 Reward Programs
- 5 staff accounts
- Basic analytics
- Standard support

### Silver

- Up to 20 Reward Programs
- 20 staff accounts
- Advanced analytics
- Export capability
- Multi-branch ready

### Gold

- Unlimited Reward Programs
- Unlimited staff
- Benchmarking
- API access
- AI recommendations (future)

The platform evaluates plan rules rather than checking hardcoded plan names.

---

# Reward Program Rules

Each Reward Program may define:

- Required Verified Units
- Reward quantity
- Shared loyalty number policy
- Quantity review threshold
- Verification reminder schedule
- Redemption instructions
- Redemption expiry (future)
- Gift eligibility (future)

---

# Purchase Verification Rules

Examples:

- Customer verification required
- Verification reminder after X days
- Reminder frequency
- Verification expiry
- Automatic escalation
- Manual review thresholds

All configurable.

---

# Notification Rules

Rules determine:

- When notifications are sent
- Which channels are used
- Quiet hours
- Language
- Reminder frequency
- Customer preferences
- Business preferences

Customers remain in control of their notification preferences.

---

# Operational Integrity Rules

Examples:

- Duplicate Purchase Record threshold
- High quantity review threshold
- Repeat rejection alerts
- Staff review thresholds
- Business review queue priorities

Rules create visibility rather than automatic punishment.

---

# Reward Rules

Configurable examples:

- One active reward per Loyalty Cycle
- Outstanding reward reminders
- Reward availability notifications
- Future reward gifting eligibility
- Future wallet conversion eligibility

---

# Customer Rules

Future configurable behaviour:

- Progressive KYC milestones
- Profile completion reminders
- Birthday campaigns
- Preferred language
- Communication preferences
- Marketing consent

---

# Business Rules

Future configuration examples:

- Branch approval workflow
- Staff invitation limits
- Manager permissions
- Default Reward Program settings
- Operational dashboard preferences

---

# Rule Versioning

Every rule has:

- Rule ID
- Name
- Version
- Effective Date
- Status
- Scope
- Created By
- Approved By
- Change History

Historical events always reference the rule version that was active at the time.

---

# Rule Lifecycle

```
Draft

↓

Review

↓

Approved

↓

Scheduled

↓

Active

↓

Superseded

↓

Archived
```

No rule becomes active without governance.

---

# Rule Evaluation Engine

Rules Studio should evaluate rules in a predictable order.

Principles:

- Deterministic
- Explainable
- Auditable
- Versioned

The platform should always be able to explain why a decision was made and which rule produced that outcome.

---

# Rule Conflict Resolution

Where multiple rules apply, precedence follows:

1. Platform
2. Country
3. Subscription Plan
4. Business
5. Reward Program
6. Purchase
7. Customer

More specific rules may override broader rules only where explicitly permitted.

---

# Rule Testing

Every rule should support simulation before publication.

Administrators should be able to answer:

"If this rule changes, what will be affected?"

Rule simulation reduces operational risk.

---

# Rule Audit

Every rule change records:

- who changed it;
- why it changed;
- previous value;
- new value;
- approval history;
- activation date.

This protects the platform from undocumented behavioural changes.

---

# Future AI Governance

AI may recommend:

- better thresholds;
- reminder timing;
- operational improvements;
- fraud review adjustments;
- subscription optimisations.

AI never activates rules automatically.

Human approval remains mandatory.

---

# Relationship to Other Platform Services

Rules Studio provides behavioural governance for:

- Purchase Verification Lifecycle
- Customer-Verified Loyalty Engine
- Reward Lifecycle
- Trust Management
- Reporting
- Notifications
- Progressive KYC
- Commerce Knowledge Layer
- Future Verified Commerce modules

Every platform capability should consume governed rules rather than embedding business logic directly.

---

# Architectural Principles

### Behaviour Without Code

Business behaviour should be modified through governed rules whenever practical.

---

### Explain Every Decision

Every automated outcome should identify the rule that produced it.

---

### One Rule, Many Consumers

A single approved rule should be reusable across all relevant platform services.

---

### Safe Evolution

Rules evolve through versioning rather than replacement.

Historical decisions remain reproducible.

---

### Human Governance

People approve policy.

Software executes policy.

---

# The Four Studio Model

I think we've now identified the four operational "studios" that will eventually power the entire platform.

## 1. Knowledge Studio

**Purpose:** Governs what the platform knows.

Examples:

- Industries
- Categories
- Products
- Services
- Tags
- Translations

---

## 2. Rules Studio

**Purpose:** Governs how the platform behaves.

Examples:

- Reward rules
- Verification rules
- Notification rules
- Subscription rules
- Country rules

---

## 3. Experience Studio *(Future)*

**Purpose:** Governs what users experience.

Examples:

- UI copy
- Notification templates
- Campaigns
- Onboarding journeys
- Empty states
- Help content
- Promotions

This ensures customer experiences can evolve without code changes.

---

## 4. Intelligence Studio *(Future)*

**Purpose:** Governs what the platform learns and recommends.

Examples:

- AI recommendation models
- Business insights
- Benchmarking
- Predictive loyalty
- Operational optimisation
- Search relevance tuning

---