# 11thONUS

# Product Requirements Document

## Stage 2 - Functional Requirements

## Section 1: Roles, Permissions and Account Ownership

**Document version:** 1.0  
**Product:** 11thONUS  
**Status:** Draft for review  
**Depends on:** Stage 1 - Product Foundation

# 1\. Purpose

This section defines:

- the user roles within 11thONUS;
- who owns each type of account;
- what each role may view, create, edit, approve, reject, reverse or manage;
- how permissions are assigned;
- how staff and managers are controlled by a business owner;
- how customer identity remains separate from business access;
- how the platform prevents one user from exercising incompatible powers;
- how account suspension, role changes and ownership transfers should work.

These rules apply across all functional modules.

No later feature may grant a user access that conflicts with the permissions established here.

# 2\. Core Access Principles

## AP-001 - Least Privilege

Every user shall receive only the permissions necessary to perform their role.

## AP-002 - Individual Accountability

Every business user shall operate through an individual account.

Shared staff or manager accounts are not permitted.

## AP-003 - Separation of Customer and Business Identity

A customer account and a business account are distinct.

A person may hold both identities, but permissions must remain separate.

Example:

A café owner may also be a customer of another participating business.

Their customer activity must not be accessible through their business role.

## AP-004 - Business Ownership Controls Delegation

The business owner may delegate operational permissions but remains responsible for:

- subscription;
- ownership;
- staff access;
- business settings;
- business closure;
- ownership transfer;
- final account-level control.

## AP-005 - Customer Verification Cannot Be Delegated to the Business

No business owner, manager, staff member or super administrator may verify a purchase on behalf of a customer as part of the normal workflow.

Customer verification must come from the registered customer account owner.

## AP-006 - No Silent Permission Escalation

Role changes and permission grants must be explicitly recorded.

## AP-007 - All Sensitive Actions Are Audited

Role assignment, permission changes, suspension, ownership transfer and staff removal must be recorded in the audit trail.

## AP-008 - Role Names Do Not Automatically Grant Unlimited Power

The platform shall use role-based permissions, but sensitive permissions must be explicitly defined.

For example, a manager may be allowed to view reports but not manage staff.

## AP-009 - Suspended Users Lose Operational Access

A suspended user may not perform business or platform actions until restored.

## AP-010 - Deleted Accounts Must Not Erase History

Deactivation or account deletion must not remove prior commercial or audit records.

# 3\. User Identity Model

## 3.1 One Person, One Platform Identity

Each natural person should have one primary 11thONUS user identity.

That identity may be associated with one or more role contexts.

Possible contexts include:

- customer;
- business owner;
- manager;
- staff member;
- super administrator.

## 3.2 Multiple Role Contexts

A user may hold more than one role.

Examples:

- a business owner may also be a customer;
- a business owner may own two businesses;
- a manager may work for more than one business;
- a staff member may also be a customer;
- a platform administrator may hold a personal customer account.

The interface must clearly indicate which role context is currently active.

## 3.3 Role Switching

Where a user holds multiple roles, the application should provide a controlled role-switching mechanism.

Example:

- Personal account;
- Bella Salon - Owner;
- Joe's Coffee - Manager.

Role switching must not merge data between contexts.

## 3.4 Unique Platform User ID

Every user shall have one immutable internal platform user ID.

This ID must not change when:

- phone number changes;
- email changes;
- the user joins another business;
- the user becomes a manager;
- the user becomes a business owner.

## 3.5 Public Customer Loyalty Number

Customers shall also receive a public loyalty number.

This number:

- is tied to the registered customer's platform identity;
- may be quoted by the customer;
- may be shared with friends or family;
- may be used by a business to record a purchase against that customer;
- must not expose private account information;
- must not be used as a password.

## 3.6 Customer QR Code

The QR code shall represent the customer's loyalty identity.

It must not expose confidential personal data directly.

The QR code should resolve to an internal customer lookup process.

# 4\. Account Types

11thONUS shall support the following account types:

- Customer account.
- Business account.
- Business membership account.
- Platform administration account.

## 4.1 Customer Account

Represents the registered loyalty participant.

## 4.2 Business Account

Represents the legal or commercial entity subscribed to 11thONUS.

## 4.3 Business Membership Account

Represents a person's relationship to a business.

Examples:

- owner;
- manager;
- staff member.

## 4.4 Platform Administration Account

Represents a user authorized to operate the 11thONUS platform.

# 5\. Customer Role

## 5.1 Role Purpose

The Customer role allows a registered user to participate in loyalty programs, review purchases recorded against their loyalty number and manage their own loyalty activity.

## 5.2 Customer Permissions

A customer may:

- register;
- sign in;
- update their profile;
- view their loyalty number;
- display their QR code;
- share or quote their loyalty number;
- view businesses where activity has been recorded;
- view pending purchases;
- approve one pending purchase;
- approve selected pending purchases;
- approve all visible pending purchases;
- reject purchases;
- dispute purchases;
- provide reasons;
- view verified purchase history;
- view rejected purchase history;
- view disputed purchase history;
- view progress by business and product;
- view unlocked rewards;
- view redeemed rewards;
- view notifications;
- change supported account credentials;
- request account support;
- request account closure subject to retention rules.

## 5.3 Customer Restrictions

A customer may not:

- create or edit business products;
- record purchases;
- verify purchases for another customer;
- edit a business-recorded purchase;
- directly change loyalty progress;
- create reward eligibility;
- process their own redemption;
- modify business fraud settings;
- access another customer's account;
- approve purchases through a quoted loyalty number alone.

## 5.4 Customer Account Ownership

The registered customer owns control of their customer identity.

The loyalty number may be shared, but account access may not.

Only the registered customer may verify purchases recorded against the account.

## 5.5 Friends and Family Contributions

Where a business allows shared loyalty-number use:

- Another person makes an eligible purchase.
- That person quotes the registered customer's loyalty number.
- The business records the purchase against the registered customer's account.
- The registered customer sees the purchase as pending.
- The registered customer approves, rejects or disputes it.
- The purchase contributes only after verification.

The person making the purchase does not gain access to the customer account.

# 6\. Business Owner Role

## 6.1 Role Purpose

The Business Owner role is the highest authority within a business account.

## 6.2 Ownership Rule

Each business must have at least one active owner.

A business may have:

- one primary owner;
- additional co-owners where supported.

The primary owner remains responsible for account continuity and ownership transfer.

## 6.3 Business Owner Permissions

The business owner may:

- create a business account;
- complete business onboarding;
- manage business profile;
- manage business contact details;
- select and change subscription plan;
- view billing status;
- manage payment methods where supported;
- create, edit, activate and deactivate loyalty products;
- define product rules;
- manage staff and managers;
- assign roles and permissions;
- revoke staff access;
- view all business purchase records;
- record purchases;
- view customer verification status;
- review rejected and disputed purchases;
- resolve disputes within allowed rules;
- process redemptions;
- reverse transactions where authorized;
- view reports;
- export reports where plan permits;
- view staff activity;
- configure fraud thresholds;
- configure shared loyalty-number rules;
- manage business notification settings;
- suspend business activity;
- initiate ownership transfer;
- request business closure;
- contact platform support.

## 6.4 Business Owner Restrictions

The owner may not:

- verify a customer purchase on behalf of the customer;
- alter verified purchase history directly;
- delete commercial records;
- access customer accounts beyond business-related data;
- view a customer's activity with other businesses;
- create platform administrator accounts;
- override platform suspension;
- access another business without a valid membership.

## 6.5 Owner-Entered Purchases

Purchases entered by a business owner remain pending customer verification.

Owner status does not bypass the customer-verification requirement.

## 6.6 Owner Responsibility

The owner is responsible for:

- staff access;
- accurate product configuration;
- lawful use of customer data;
- reward fulfillment;
- internal reconciliation;
- subscription compliance;
- dispute handling;
- staff deactivation after departure.

# 7\. Manager Role

## 7.1 Role Purpose

The Manager role supports delegated business operations.

## 7.2 Permission Model

Manager permissions must be configurable.

A manager may receive some or all of the following:

- staff management;
- product viewing;
- product editing;
- purchase recording;
- redemption processing;
- dispute handling;
- report viewing;
- report export;
- fraud review;
- business profile editing.

## 7.3 Manager Default Permissions

A default manager role may:

- view business products;
- record purchases;
- view transactions;
- view pending customer verification;
- process permitted redemptions;
- view operational reports;
- review rejected or disputed purchases;
- manage staff where explicitly granted.

## 7.4 Manager Restrictions

A manager may not, unless specifically granted:

- change subscription;
- transfer ownership;
- close the business account;
- appoint another owner;
- change billing details;
- create super administrators;
- verify purchases for customers;
- delete audit records.

## 7.5 Manager Scope

A manager's permissions may be limited by:

- business;
- branch;
- product;
- function;
- date range;
- report type.

Branch-level restrictions will become active when multi-branch functionality is introduced.

# 8\. Staff Role

## 8.1 Role Purpose

The Staff role supports fast frontline purchase recording and reward redemption.

## 8.2 Staff Permissions

Staff may:

- sign in individually;
- search for a customer by supported identifier;
- scan a customer QR code;
- select an eligible loyalty product;
- enter purchase quantity;
- enter optional notes;
- submit a purchase;
- view the status of their recently submitted purchases;
- see whether a purchase is pending, verified, rejected or disputed;
- process a reward redemption where granted;
- view limited customer progress needed to complete the transaction;
- report an error to a manager or owner.

## 8.3 Staff Restrictions

Staff may not:

- create loyalty products;
- change product rules;
- manage subscriptions;
- manage business owners;
- manage platform settings;
- approve customer verification;
- edit verified purchases;
- delete purchases;
- reverse purchases unless explicitly authorized;
- view full business financial reports;
- view customer activity at other businesses;
- export customer lists;
- change fraud thresholds;
- create additional staff accounts unless granted.

## 8.4 Staff Purchase Recording

Every purchase recorded by staff must capture:

- staff user ID;
- business ID;
- branch ID;
- customer ID;
- loyalty product ID;
- quantity;
- timestamp;
- source;
- status;
- device or session reference where permitted.

## 8.5 Shared Staff Accounts

Shared staff accounts are prohibited.

The system should support simple staff authentication without weakening accountability.

# 9\. Super Administrator Role

## 9.1 Role Purpose

The Super Administrator role supports platform-wide operation and governance.

## 9.2 Super Administrator Permissions

A super administrator may:

- view businesses;
- approve or review business onboarding;
- suspend or restore businesses;
- manage subscription plans;
- manage countries;
- manage currencies;
- manage platform configuration;
- view platform metrics;
- review support cases;
- investigate fraud patterns;
- review disputes escalated to platform level;
- manage platform administrators;
- view audit records;
- configure global feature flags;
- manage service notices;
- initiate controlled support actions;
- access diagnostic information.

## 9.3 Super Administrator Restrictions

A super administrator may not normally:

- verify purchases for customers;
- create false loyalty progress;
- directly edit verified commercial history;
- redeem rewards for personal benefit;
- silently alter business ownership;
- access private data without an operational reason.

## 9.4 Controlled Support Actions

Where a super administrator must act on behalf of a user, the action must:

- require elevated authorization;
- record the administrator;
- record the reason;
- record the affected account;
- record the previous state;
- record the resulting state;
- remain visible in the audit trail.

# 10\. Future Platform Roles

The architecture should allow future roles including:

- support agent;
- fraud analyst;
- billing administrator;
- country administrator;
- read-only auditor;
- branch manager;
- accountant;
- marketing user;
- API integration user.

These roles are not required in the first MVP unless operationally necessary.

# 11\. Permissions Matrix

| Capability                     | Customer           | Staff         | Manager       | Owner             | Super Admin             |
| ------------------------------ | ------------------ | ------------- | ------------- | ----------------- | ----------------------- |
| View own customer profile      | Yes                | Own only      | Own only      | Own only          | Support access only     |
| View customer loyalty number   | Yes                | During lookup | During lookup | During lookup     | Support access only     |
| Share customer loyalty number  | Yes                | No            | No            | No                | No                      |
| Record purchases               | No                 | Yes           | Yes           | Yes               | No by default           |
| Verify purchases               | Own only           | No            | No            | No                | No                      |
| Reject purchases               | Own only           | No            | No            | No                | No                      |
| Dispute purchases              | Own only           | No            | No            | No                | Support review          |
| View business products         | Participating only | Yes           | Yes           | Yes               | Yes                     |
| Create products                | No                 | No            | Configurable  | Yes               | No                      |
| Manage staff                   | No                 | No            | Configurable  | Yes               | No                      |
| View all business transactions | No                 | Limited       | Configurable  | Yes               | Support access          |
| Process redemptions            | No                 | Configurable  | Yes           | Yes               | No by default           |
| Reverse transactions           | No                 | No by default | Configurable  | Yes               | Controlled support only |
| Manage subscription            | No                 | No            | No by default | Yes               | Yes                     |
| Configure fraud rules          | No                 | No            | Configurable  | Yes               | Global only             |
| Transfer business ownership    | No                 | No            | No            | Yes               | Controlled support      |
| Suspend business               | No                 | No            | No            | Self-suspend only | Yes                     |
| View platform-wide reports     | No                 | No            | No            | No                | Yes                     |

# 12\. Custom Permissions

## 12.1 Purpose

Custom permissions allow a business owner to delegate specific capabilities without granting full manager access.

## 12.2 Permission Categories

Permissions should be grouped into:

### Customer Interaction

- search customer;
- view limited customer progress;
- record purchase;
- process redemption.

### Product Management

- view products;
- create products;
- edit products;
- deactivate products.

### Staff Management

- invite staff;
- deactivate staff;
- assign roles;
- view staff activity.

### Transaction Management

- view transactions;
- review rejections;
- review disputes;
- reverse transactions;
- export records.

### Reporting

- view basic reports;
- view advanced reports;
- export reports.

### Business Administration

- edit profile;
- edit fraud rules;
- manage branches;
- manage subscription;
- manage billing.

## 12.3 Permission Dependencies

Some permissions require others.

Examples:

- process redemption requires customer lookup;
- reverse transaction requires transaction viewing;
- manage staff roles requires staff viewing;
- export reports requires report viewing.

## 12.4 Permission Safety

The system must prevent invalid combinations.

Example:

A user must not be allowed to manage ownership without being an owner.

# 13\. Business Membership Lifecycle

## 13.1 Invitation

An owner or authorized manager may invite a user to join a business.

The invitation should include:

- business name;
- assigned role;
- permissions;
- inviter;
- expiry date;
- acceptance action.

## 13.2 Acceptance

The invited user must accept the invitation before becoming active.

## 13.3 Existing Users

If the phone number or email already belongs to a user, the membership should attach to the existing platform identity.

## 13.4 New Users

If the invitee is not yet registered, they should complete registration before accepting membership.

## 13.5 Activation

A membership becomes active only after:

- invitation acceptance;
- account verification;
- business status validation.

## 13.6 Suspension

An owner may suspend a staff or manager membership.

Suspended users:

- cannot access the business context;
- retain historical attribution;
- remain visible in audit records.

## 13.7 Removal

Removing a user from a business shall deactivate the membership.

It shall not delete:

- purchases recorded;
- redemptions processed;
- approvals granted;
- historical staff activity.

# 14\. Business Ownership

## 14.1 Primary Owner

Each business must have one primary owner.

## 14.2 Co-Owners

The platform may support additional owners.

Co-owners may have most owner permissions, subject to ownership policy.

## 14.3 Ownership Transfer

Ownership transfer must require:

- initiation by the current primary owner;
- identification of the proposed new owner;
- acceptance by the proposed owner;
- confirmation of transfer;
- audit logging;
- platform review where risk rules require it.

## 14.4 Owner Departure

An owner should not be removable if doing so would leave the business without an active owner.

## 14.5 Emergency Recovery

Platform support may assist with ownership recovery where:

- the owner is unreachable;
- the account is compromised;
- the business changes legal control;
- the owner dies or becomes incapacitated;
- the registered phone number is lost.

Such actions must follow a controlled verification process.

# 15\. Customer Account Ownership

## 15.1 Ownership Rule

The registered customer controls:

- account credentials;
- loyalty number;
- pending verification;
- purchase approval;
- purchase rejection;
- disputes;
- profile information.

## 15.2 Shared Loyalty Number

Sharing a loyalty number does not transfer ownership.

## 15.3 Verification Authority

Only the registered customer account may verify purchases.

## 15.4 Phone Number Change

Changing the registered phone number must not create a new loyalty identity or erase progress.

## 15.5 Lost Access

The platform must provide an account recovery process.

## 15.6 Duplicate Customer Accounts

The system should detect or support resolution of duplicate accounts.

Account merging, if introduced, must preserve:

- purchase history;
- pending purchases;
- reward progress;
- redemptions;
- audit records.

# 16\. Role Context and Data Isolation

## 16.1 Business Isolation

A business user may access only data belonging to businesses where they hold an active membership.

## 16.2 Customer Isolation

A customer may access only their own customer account.

## 16.3 Cross-Business Isolation

A business may not see:

- a customer's purchases with another business;
- a customer's progress elsewhere;
- another business's products;
- another business's staff;
- another business's reports.

## 16.4 Platform Administration Access

Administrative access must be limited to authorized operational purposes.

## 16.5 Role Context Display

The interface must clearly display the active context.

Examples:

- Personal;
- Bella Salon - Owner;
- Bella Salon - Staff;
- Joe's Coffee - Manager.

# 17\. Authentication Requirements

## 17.1 Individual Authentication

Every user must authenticate individually.

## 17.2 Supported Methods

The MVP may support:

- phone number authentication;
- email authentication;
- secure PIN or password;
- one-time passcode.

The final method will be specified in the TRD.

## 17.3 Session Management

The system must:

- expire inactive sessions;
- allow secure sign-out;
- revoke sessions after suspension;
- support device-level session revocation;
- prevent access after role removal.

## 17.4 Sensitive Actions

Sensitive actions may require recent authentication.

Examples:

- ownership transfer;
- billing changes;
- staff role escalation;
- business closure;
- account recovery.

# 18\. Authorization Requirements

## FR-RP-001

The system shall evaluate permissions on every protected action.

## FR-RP-002

The system shall not rely only on hidden interface controls.

Permissions must also be enforced server-side.

## FR-RP-003

The system shall prevent a user from accessing a business without an active membership.

## FR-RP-004

The system shall prevent a business user from verifying customer purchases.

## FR-RP-005

The system shall prevent a customer from modifying recorded purchase details.

## FR-RP-006

The system shall prevent suspended users from performing protected actions.

## FR-RP-007

The system shall log role and permission changes.

## FR-RP-008

The system shall preserve historical actor attribution after account suspension or removal.

## FR-RP-009

The system shall support users with multiple role contexts.

## FR-RP-010

The system shall prevent one role context from exposing another context's unauthorized data.

# 19\. Edge Cases

## 19.1 Owner Is Also Customer

The user may switch between:

- personal customer context;
- business owner context.

The owner may not verify customer purchases while operating in the business context.

## 19.2 Staff Uses Their Own Customer Number

A staff member may be a legitimate customer.

The system should allow this but may flag self-recorded purchases for review.

Customer verification remains required.

## 19.3 Owner Records a Purchase for Their Own Customer Account

This may be permitted but should be logged and risk-flagged.

The purchase still requires customer verification through the customer context.

## 19.4 Manager Works for Multiple Businesses

The user must switch between business contexts.

Data must remain isolated.

## 19.5 Staff Leaves the Business

The membership is deactivated.

Historical activity remains attributed to that staff member.

## 19.6 Customer Shares Loyalty Number Widely

The customer remains responsible for verifying purchases recorded against their number.

The business may restrict shared-number use at product level.

## 19.7 Owner Loses Phone Access

Account recovery must not create a new owner identity automatically.

## 19.8 Business Has No Active Owner

The system must prevent this state except during controlled support intervention.

## 19.9 Permission Change During Active Session

The new permission state should take effect promptly.

## 19.10 Suspended Business

All business operational actions should be blocked, subject to support and read-only access rules.

# 20\. Acceptance Criteria

This section is accepted when the system design can demonstrate that:

- Every user has an individual platform identity.
- A user may hold multiple roles without data leakage.
- Customer and business contexts remain separate.
- Only the registered customer can verify purchases.
- Sharing a loyalty number does not grant account access.
- Owners can create and manage staff.
- Owners can delegate selected permissions.
- Staff cannot modify business configuration.
- Managers cannot perform owner-only actions unless explicitly permitted.
- Every sensitive permission change is auditable.
- Suspended users lose operational access.
- Historical records remain linked to removed users.
- A business cannot access customer activity from another business.
- A business cannot be left without an active owner.
- Ownership transfer follows a controlled process.
- Server-side authorization enforces all permissions.

# 21\. Business Rules Introduced

| Rule ID | Rule                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| BR-001  | Every user shall have an individual platform identity.                                                      |
| BR-002  | Shared staff accounts are prohibited.                                                                       |
| BR-003  | One user may hold multiple role contexts.                                                                   |
| BR-004  | Customer and business role data shall remain isolated.                                                      |
| BR-005  | Only the registered customer may verify purchases recorded against their loyalty account.                   |
| BR-006  | Sharing a loyalty number does not grant access to the loyalty account.                                      |
| BR-007  | A business shall always have at least one active owner.                                                     |
| BR-008  | Business owners control staff and manager access.                                                           |
| BR-009  | Owner-entered purchases remain subject to customer verification.                                            |
| BR-010  | Staff removal shall not erase historical activity.                                                          |
| BR-011  | Permission changes shall be auditable.                                                                      |
| BR-012  | Suspended users may not perform protected actions.                                                          |
| BR-013  | A business may access only business-related customer information.                                           |
| BR-014  | A business may not access customer activity with other businesses.                                          |
| BR-015  | Ownership transfer requires explicit acceptance and audit logging.                                          |
| BR-016  | A quoted loyalty number identifies the registered customer but does not authenticate the person quoting it. |

# 22\. Next Section

The next section will define:

# Customer Registration, Identity and Account Recovery

It will cover:

- customer onboarding;
- phone and email identity;
- loyalty number generation;
- QR code behavior;
- duplicate accounts;
- account recovery;
- phone number changes;
- profile data;
- consent;
- customer account status;
- customer deletion and retention;
- identity security;
- friends and family use of the loyalty number.