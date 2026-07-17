> **Title:** PRD Section 10 — Platform Administration, Roles and Permissions  
> **Version:** 1.0 · **Status:** Draft for review (pre-freeze) · **Classification:** Authoritative Product  
> **Governing document:** 11thONUS Platform Constitution  
> **Source-of-truth path:** `docs/01-product/prd/10-platform-administration.md`  
> **Last controlled update:** 2026-07-16 (Phase 4 — §19 FR-RP-001..008 renamed to FR-RBAC-001..008 per DEC-GOV-006; no wording changed)

# 11thONUS

# Product Requirements Document

# Stage 2 - Functional Requirements

## Section 10: Platform Administration, Roles and Permissions

**Version:** 1.0

# 1\. Purpose

This section defines how responsibilities, permissions and administrative authority are managed across the 11thONUS platform.

The platform must ensure that every user has access only to the information and functions necessary to perform their role.

The permission model shall prioritise:

- simplicity;
- accountability;
- security;
- scalability;
- auditability.

# 2\. Design Philosophy

Permissions are based on **responsibility**, not seniority.

Every action should have:

- one accountable actor;
- one permission source;
- one audit trail.

Users should never receive permissions they do not require.

# 3\. User Types

The MVP recognises five primary user types.

## Platform Super Administrator

Operates the entire platform.

## Business Owner

Owns one or more businesses.

Responsible for commercial decisions.

## Business Manager

Manages daily business operations.

Acts on behalf of the owner where authorised.

## Staff Member

Records purchases and serves customers.

Has limited operational permissions.

## Customer

Participates in Reward Programs.

Owns a single loyalty identity.

# 4\. Platform Super Administrator

The Super Administrator manages the platform itself.

Responsibilities include:

- business approval (where required);
- subscription oversight;
- platform monitoring;
- operational support;
- fraud investigations;
- global reporting;
- system configuration;
- communication management.

The Super Administrator shall never modify customer loyalty progress directly.

Administrative corrections must follow controlled platform processes and remain fully auditable.

# 5\. Business Owner

The Business Owner controls the business account.

Responsibilities include:

- subscription management;
- Reward Program management;
- staff management;
- business profile;
- dispute resolution;
- redemption oversight;
- reporting;
- operational review;
- business reconciliation.

The Business Owner is ultimately responsible for honouring rewards.

# 6\. Business Manager

Managers assist with daily operations.

Typical permissions:

- supervise staff;
- manage Purchase Records;
- review disputes;
- approve corrections;
- view reports;
- redeem rewards;
- manage daily activity.

Managers should not:

- cancel subscriptions;
- transfer ownership;
- access platform administration.

# 7\. Staff Member

Staff Members perform operational tasks.

Typical permissions:

- search customers;
- scan QR codes;
- record Purchase Records;
- redeem available rewards;
- view their own activity;
- receive operational notifications.

Staff Members should not:

- modify Reward Programs;
- access financial information;
- manage subscriptions;
- manage other staff;
- delete historical records.

# 8\. Customer

Customers may:

- manage their profile;
- present their loyalty number or QR code;
- verify purchases;
- reject purchases;
- raise disputes;
- monitor progress;
- redeem available rewards;
- view their On Us Moments;
- update notification preferences.

Customers cannot:

- modify Reward Programs;
- create Purchase Records;
- access business reports;
- access platform administration.

# 9\. Permission Groups

Rather than assigning hundreds of individual permissions, permissions shall be grouped into logical domains.

Examples:

### Business Management

Business Profile

Business Settings

Operating Hours

Brand Assets

### Reward Programs

Create

Edit

Pause

Retire

Archive

### Purchase Verification

Record Purchase

Review Purchase

Correct Purchase

Cancel Purchase

View History

### Reward Management

Redeem Reward

View Outstanding Rewards

View On Us Moments

### Staff Management

Invite

Suspend

Reactivate

Remove

Assign Roles

### Reporting

Operational

Management

Executive

Exports

### Subscription

Billing

Plan Changes

Renewals

Invoices

### Platform Administration

Platform Settings

Business Monitoring

Support

Analytics

Communication

# 10\. Role Matrix

| Capability             | Super Admin | Owner | Manager     | Staff        | Customer           |
| ---------------------- | ----------- | ----- | ----------- | ------------ | ------------------ |
| Manage Platform        | ✓           | -     | -           | -            | -                  |
| Manage Business        | -           | ✓     | Limited     | -            | -                  |
| Manage Reward Programs | -           | ✓     | Optional    | -            | -                  |
| Record Purchases       | -           | ✓     | ✓           | ✓            | -                  |
| Review Purchases       | -           | ✓     | ✓           | Limited      | -                  |
| Verify Purchases       | -           | -     | -           | -            | ✓                  |
| Redeem Rewards         | -           | ✓     | ✓           | ✓            | ✓ (present reward) |
| View Reports           | Platform    | ✓     | Operational | Own Activity | Own Activity       |
| Manage Staff           | -           | ✓     | Limited     | -            | -                  |
| Manage Subscription    | -           | ✓     | -           | -            | -                  |

This matrix will expand as the platform evolves but should remain understandable.

# 11\. Multi-Business Ownership

A single Business Owner may own multiple businesses.

Each business:

- maintains independent Reward Programs;
- has independent staff;
- has independent reporting;
- has its own subscription.

The owner may switch between businesses without creating additional accounts.

# 12\. Future Franchise Support

The architecture shall support franchise organisations.

Future hierarchy:

Franchise Owner

↓

Regional Manager

↓

Branch Manager

↓

Staff

↓

Customer

The MVP shall not implement franchise-specific functionality but shall not prevent future expansion.

# 13\. Role Inheritance

Permissions should inherit logically.

Example:

Business Owner

inherits all Manager permissions.

Manager

inherits all Staff permissions.

Staff

does not inherit Manager permissions.

This minimises duplication and simplifies maintenance.

# 14\. Temporary Permissions

Future versions may support:

- temporary manager access;
- holiday cover;
- delegated administration;
- temporary support access.

Every temporary permission shall include:

- start date;
- end date;
- audit history.

# 15\. Authentication

The MVP shall use Firebase Authentication.

Supported methods:

- Mobile Number (primary)
- Email (optional)

Future support:

- Google
- Apple
- Microsoft
- Business SSO

Authentication identifies the user.

Permissions determine what the user can do.

These concepts remain separate.

# 16\. Audit Requirements

Every privileged action shall record:

- authenticated user;
- role;
- business;
- timestamp;
- action;
- affected resource.

Administrative actions must always be attributable.

# 17\. Security Principles

The platform shall follow the principle of **least privilege**.

Users receive the minimum permissions necessary to perform their responsibilities.

Sensitive operations should require elevated permissions.

No role may bypass the Trust Management framework.

# 18\. Future Permission Expansion

The architecture shall support additional roles without redesign.

Examples:

- Regional Administrator
- Auditor
- Customer Support
- Marketing Manager
- Finance Officer
- API Client
- POS Integration Service Account

These future roles should reuse the existing permission framework.

# 19\. Functional Requirements

### FR-RBAC-001

The platform shall support role-based access control (RBAC).

### FR-RBAC-002

Each authenticated user shall have one or more assigned roles.

### FR-RBAC-003

Permissions shall be grouped by operational domain.

### FR-RBAC-004

Business Owners may manage multiple businesses.

### FR-RBAC-005

The platform shall support future franchise hierarchies.

### FR-RBAC-006

Every privileged action shall be auditable.

### FR-RBAC-007

The platform shall enforce least-privilege access.

### FR-RBAC-008

Authentication and authorisation shall remain separate concerns.

# 20\. Business Rules

| Rule ID | Rule                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| BR-091  | Permissions are assigned according to responsibility rather than organisational seniority.                        |
| BR-092  | Every privileged action shall be attributable to an authenticated user.                                           |
| BR-093  | Business Owners remain responsible for business operations regardless of delegated permissions.                   |
| BR-094  | Customers remain the only users authorised to verify their own purchases.                                         |
| BR-095  | Shared staff accounts are prohibited.                                                                             |
| BR-096  | Role inheritance shall minimise duplication while preserving least-privilege access.                              |
| BR-097  | Businesses remain isolated from one another even where owned by the same individual.                              |
| BR-098  | Platform administrators shall not directly alter customer loyalty progress outside approved governance processes. |

# 21\. Acceptance Criteria

This section is approved when:

- All platform roles are defined.
- Permission boundaries are clear.
- Multi-business ownership is supported.
- Franchise growth is architecturally supported.
- Authentication and authorisation responsibilities are separated.
- Audit requirements are documented.
- Security principles are established.
- Business rules are accepted.

# 22\. Next Section

The next section will define:

## Platform Architecture, Technical Principles and Firebase Implementation Foundation

This will bridge the Product Requirements Document (PRD) to the Technical Requirements Document (TRD) by defining:

- architectural principles;
- Firebase service responsibilities;
- event-driven processing;
- data ownership;
- collection boundaries;
- Cloud Functions responsibilities;
- scalability principles;
- offline strategy;
- security model;
- implementation constraints for engineering.