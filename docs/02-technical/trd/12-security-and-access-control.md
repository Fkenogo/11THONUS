> **Title:** TRD Chapter 12 — Authentication, Authorization and Security Rules  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/12-security-and-access-control.md`  
> **Last controlled update:** 2026-08-01 (`IDENTITY-ALIGN-001` — §12.4.1 reframed: authentication providers are equal, per `DEC-IDENTITY-001`'s Authentication Principle, not a "preferred"-then-"future" hierarchy; the identity/authentication/verification separation §12.3 already established is unaffected and remains correct. See the [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-IDENTITY-001` entry.) Previously: 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Technical Requirements Document

## PART V - Security and Access Control

# Chapter 12: Authentication, Authorization and Security Rules Architecture

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-11

# 12.1 Purpose

This chapter defines how 11thONUS shall authenticate users, authorize actions, isolate data and protect platform resources.

It establishes:

- Firebase Authentication methods;
- customer, business and staff identity handling;
- account linking;
- role contexts;
- custom claims;
- server-side authorization;
- Firestore Security Rules;
- Cloud Storage rules;
- App Check;
- session management;
- privileged reauthentication;
- account recovery;
- service identities;
- security logging;
- abuse controls;
- privacy boundaries;
- emergency access;
- security testing.

The security model shall support the principle of least privilege.

Authentication answers:

Who is this user?

Authorization answers:

What is this user permitted to do in this context?

These questions shall remain technically separate.

# 12.2 Security Objectives

The authentication and authorization architecture shall ensure that:

- Every human user has an individual platform identity.
- Shared staff accounts are prohibited.
- Customers access only their own personal loyalty data.
- Business users access only businesses where they hold active memberships.
- A business cannot view customer activity with other businesses.
- Only the registered customer can verify purchases recorded against their customer account.
- Critical commercial operations execute through trusted server services.
- Privileged actions are attributable and auditable.
- Suspended accounts lose access promptly.
- Provider credentials and secrets never reach client applications.
- Compromised sessions can be revoked.
- Security controls remain understandable and maintainable.

# 12.3 Identity Architecture

Firebase Authentication shall provide the authentication identity.

The Identity Domain shall provide the platform identity and business context.

The two layers are related but distinct.

Firebase Authentication  
↓  
Authenticated UID  
↓  
11thONUS User Record  
↓  
Customer Profile and/or Business Memberships  
↓  
Active Role Context  
↓  
Server-Side Authorization

A successful Firebase sign-in does not automatically grant access to business data.

# 12.4 Supported Authentication Methods

## 12.4.1 Customer Authentication

Per `DEC-IDENTITY-001`'s Authentication Principle, supported customer authentication providers are equal — none is the customer's identity, and none is designated primary or secondary:

- mobile phone number with one-time password;
- email and password, or passwordless email;
- Google and Apple sign-in.

Phone-based authentication remains important for customers who do not regularly use email, but its role is as one supported provider among several, not a default customers are routed through. Whether a given provider's credential has been verified is tracked separately as a progressive-trust signal (Identity Trust Management, internal-only — see `DEC-IDENTITY-001`), used for risk-based feature gating, not for gating registration, identity issuance, or standard platform access.

## 12.4.2 Business Owner and Manager Authentication

Business owners and managers should support:

- verified phone number;
- verified email;
- stronger recovery options;
- privileged reauthentication for sensitive actions.

## 12.4.3 Staff Authentication

Every staff member shall have an individual authenticated identity.

Supported approaches may include:

- phone-number OTP;
- email authentication;
- securely provisioned staff PIN combined with device or business context, subject to final security review.

A shared store-wide PIN shall not be treated as a valid individual identity.

## 12.4.4 Platform Administrator Authentication

Platform administrators shall use stronger controls, including:

- verified email;
- multi-factor authentication;
- approved administrator account;
- privileged reauthentication;
- restricted administrative roles.

# 12.5 Account Linking

A single user may authenticate through multiple providers.

Examples:

- phone number;
- email;
- Google;
- Apple.

All linked providers shall resolve to one Firebase Authentication user and one 11thONUS platform user.

Account linking must prevent accidental creation of duplicate customer identities.

# 12.6 Account Identity Rules

## AIR-001

One Firebase Authentication UID shall map to one active platform user.

## AIR-002

A platform user may hold multiple role contexts.

## AIR-003

Changing a phone number or email shall not change the platform user ID or customer loyalty number.

## AIR-004

Account provider linking shall preserve all existing loyalty and business history.

## AIR-005

Authentication identifiers shall not be used as public loyalty numbers.

## AIR-006

Public customer loyalty numbers shall never grant account access.

# 12.7 Role Context

A user may simultaneously be:

- a customer;
- owner of one business;
- manager of another;
- staff member of a third.

The application shall require an explicit active context for business operations.

Example:

Personal Account  
<br/>Bella Salon - Owner  
<br/>Joe's Coffee - Manager

Every server command requiring a business role shall include the requested business context.

The server shall independently validate that the user holds the corresponding active membership.

# 12.8 Custom Claims

Firebase custom claims may be used for coarse-grained platform attributes.

Examples:

- platform administrator status;
- support agent status;
- broad account type;
- security version;
- token revocation marker.

Custom claims shall not contain:

- complete business permissions;
- long business membership lists;
- customer loyalty balances;
- sensitive profile data;
- rapidly changing operational state.

Detailed permissions shall be resolved from authoritative server-side membership records.

# 12.9 Why Claims Must Remain Coarse-Grained

Custom claims are included in authentication tokens and may remain cached until token refresh.

They are therefore unsuitable as the only source for frequently changing permissions.

For example, suspending a staff membership must not depend solely on an old custom claim.

The server shall verify the current membership status for sensitive business actions.

# 12.10 Authorization Architecture

Authorization shall operate at several layers.

## Layer 1 - Client Interface

The interface hides actions the user cannot perform.

This improves usability but is not a security control on its own.

## Layer 2 - Firestore Security Rules

Rules restrict direct client reads and any permitted low-risk writes.

## Layer 3 - Cloud Function Authorization

Trusted server services validate:

- user identity;
- account status;
- role context;
- business membership;
- permissions;
- resource ownership;
- current object state;
- applicable business rules.

## Layer 4 - Domain Rules

The domain service validates whether the requested business action is permitted.

## Layer 5 - Audit and Monitoring

Privileged and failed access attempts generate security and audit records.

# 12.11 Permission Resolution

A business user's effective permissions shall be derived from:

- active platform user;
- active business;
- active business membership;
- assigned role;
- assigned custom permission set;
- business status;
- subscription constraints;
- action-specific domain rules.

The permission result should be cacheable briefly but must remain revocable.

# 12.12 Permission Evaluation Contract

A shared authorization service should expose a contract similar to:

type AuthorizationRequest = {  
userId: string;  
businessId?: string;  
membershipId?: string;  
permission: string;  
resourceType?: string;  
resourceId?: string;  
};  
<br/>type AuthorizationDecision = {  
allowed: boolean;  
reasonCode: string;  
role?: string;  
permissionSource?: string;  
evaluatedAt: Timestamp;  
};

Authorization decisions affecting sensitive operations should be included in structured logs.

# 12.13 Customer Authorization

A customer may read:

- their own profile;
- their own Purchase Records;
- their own pending verification items;
- their own Loyalty Cycles;
- their own rewards;
- their own On Us Moments;
- public business and Reward Program information.

A customer may request trusted server actions to:

- update their profile;
- verify their own Purchase Record;
- reject their own Purchase Record;
- dispute their own Purchase Record;
- update communication preferences;
- request account closure.

A customer shall not read another customer's data.

# 12.14 Business User Authorization

A business user may access a business only if:

- the user is active;
- the membership is active;
- the business is operational or permitted read-only access applies;
- the role or permission set authorizes the action.

Business users shall not access:

- a customer's activity with another business;
- unrelated KYC data;
- another business's staff or reports;
- platform-wide administration data.

# 12.15 Owner-Only Actions

The following actions should require owner authority unless a later policy explicitly permits delegation:

- subscription changes;
- billing changes;
- ownership transfer;
- business closure;
- appointment of another owner;
- removal of the final active owner;
- high-risk data export;
- critical business security changes.

These actions should require recent authentication.

# 12.16 Platform Administrator Authorization

Platform administration shall use separate permission groups.

Suggested groups include:

- business support;
- subscription operations;
- fraud and trust review;
- Commerce Knowledge administration;
- Rules Studio administration;
- security administration;
- platform configuration;
- reporting access.

Not every administrator shall receive all platform permissions.

# 12.17 Firestore Security Rules Philosophy

Firestore Security Rules shall be:

- deny-by-default;
- simple enough to audit;
- tested through the Emulator Suite;
- aligned with domain ownership;
- restrictive toward authoritative writes.

Rules shall not duplicate the entire business engine.

Complex state transitions belong in trusted server services.

# 12.18 Direct Client Write Policy

The client may be permitted to write only narrowly scoped, low-risk data.

Potential examples:

- local notification preferences;
- non-sensitive profile draft fields;
- device registration tokens;
- support message drafts.

Authoritative commercial records shall not be directly writable by clients.

Clients shall not directly create or modify:

- Purchase Records;
- customer verification outcomes;
- Verified Units;
- Loyalty Cycles;
- rewards;
- redemptions;
- Trust Events;
- role assignments;
- subscriptions;
- rules;
- taxonomy records.

# 12.19 Example Firestore Read Rules

Conceptually:

customerProfiles/{profileId}  
Read:  
\- profile belongs to authenticated user  
\- or approved admin support permission exists  
<br/>purchaseRecords/{purchaseId}  
Customer read:  
\- purchase.customerId belongs to authenticated customer  
<br/>Business read:  
\- purchase.businessId matches active business membership  
\- user has purchase-view permission  
<br/>rewards/{rewardId}  
Customer read:  
\- reward.customerId belongs to authenticated customer  
<br/>Business read:  
\- reward.businessId matches active membership

The final rules implementation shall use helper functions and shared tests.

# 12.20 Query Security

Firestore evaluates queries against security rules.

Queries must include filters that make the requested result set secure.

For example, a business Purchase Record query must include the target businessId.

The client shall not query a broad collection and rely on hidden filtering afterward.

# 12.21 Security Rule Helper Functions

Reusable rule helpers may include:

- isSignedIn();
- isActiveUser();
- ownsCustomerProfile(customerId);
- hasActiveBusinessMembership(businessId);
- hasPermission(businessId, permission);
- isPlatformAdmin(permission);
- isPublicBusinessRecord();
- isAllowedProfileUpdate().

Helpers shall remain small and deterministic.

# 12.22 Firestore Rules Testing

Rules tests shall cover:

- unauthenticated access;
- customer self-access;
- cross-customer access denial;
- business membership access;
- cross-business denial;
- suspended membership denial;
- removed staff denial;
- administrator scopes;
- direct write prohibition;
- field-level update restrictions;
- collection query behavior.

Every security rule change shall require automated test updates.

# 12.23 Cloud Storage Architecture

Cloud Storage shall hold:

- business logos;
- profile photos;
- future receipt evidence;
- support attachments;
- knowledge icons;
- promotional media.

Files shall be organized by security scope.

Example:

/businesses/{businessId}/branding/  
/customers/{customerId}/profile/  
/support/{supportCaseId}/attachments/  
/knowledge/icons/

# 12.24 Cloud Storage Rules

Storage access shall enforce:

- authenticated identity;
- business or customer ownership;
- permitted file type;
- maximum file size;
- approved storage path;
- active account status.

Uploads should validate metadata server-side where necessary.

Executable files and unsupported content types shall be rejected.

# 12.25 Upload Security

The platform should enforce:

- MIME type allowlists;
- file extension checks;
- file-size limits;
- image dimension limits where practical;
- malware scanning for higher-risk documents in later phases;
- randomized file names;
- no user-controlled executable paths.

Public business images may be served publicly only after validation and publication.

# 12.26 App Check

Firebase App Check shall protect client-accessible Firebase resources.

The platform should use:

- supported web attestation for the PWA;
- separate configuration by environment;
- enforcement for production;
- monitoring before strict enforcement;
- debug tokens only in approved development environments.

App Check does not replace authentication or authorization.

# 12.27 Session Management

The system shall support:

- secure session issuance;
- automatic token refresh;
- manual sign-out;
- device-level sign-out;
- all-device sign-out;
- session revocation after account compromise;
- prompt access removal after suspension.

Sensitive role changes should increment a security or authorization version that forces token or session refresh where practical.

# 12.28 Session Metadata

The platform may record security-relevant session metadata such as:

- session ID;
- user ID;
- device label;
- creation time;
- last active time;
- approximate region;
- client application version;
- revoked status.

Sensitive device fingerprinting should be avoided unless justified and disclosed.

# 12.29 Privileged Reauthentication

Recent authentication shall be required for:

- changing primary phone or email;
- changing authentication methods;
- ownership transfer;
- billing changes;
- account closure;
- administrator permission changes;
- security-sensitive exports;
- viewing highly sensitive recovery information.

The accepted reauthentication age shall be configurable.

# 12.30 Account Recovery

Account recovery shall prioritize continuity without enabling account takeover.

Recovery methods may include:

- phone OTP;
- verified email;
- previously linked provider;
- support-assisted verification;
- business-owner recovery procedure;
- administrator-assisted emergency recovery.

Recovery shall not create a new customer identity when the existing identity can be restored.

# 12.31 Lost Phone Number

Where a customer loses access to the registered phone number:

- attempt recovery through linked email or provider;
- verify identity through approved support process;
- update the authentication phone number;
- retain the same platform user and loyalty number;
- revoke prior sessions;
- record a security event.

# 12.32 Business Ownership Recovery

Ownership recovery may be required where:

- the registered owner is unreachable;
- a business changes legal control;
- the owner loses credentials;
- the owner dies or becomes incapacitated;
- the account is compromised.

The process shall require stronger evidence than ordinary customer recovery.

Every support action shall be fully audited.

# 12.33 Account Suspension

Suspension may apply to:

- user account;
- customer profile;
- business membership;
- business account;
- administrator account;
- service identity.

Suspension shall prevent relevant protected actions immediately.

Historical records remain intact.

# 12.34 Account Closure

Account closure shall:

- disable normal access;
- revoke active sessions;
- stop new commercial activity;
- preserve records required for audit, disputes or legal obligations;
- apply retention and anonymization policies where appropriate.

Closure is not equivalent to deletion.

# 12.35 Service Identities

Automated systems shall use service identities.

Examples:

- POS integration;
- reporting worker;
- notification processor;
- migration job;
- webhook processor.

Each service identity shall have:

- unique identifier;
- environment;
- owning integration or service;
- explicit scopes;
- status;
- credential-rotation record;
- audit trail.

Service identities shall not impersonate human users.

# 12.36 Admin SDK Access

The Firebase Admin SDK bypasses Firestore Security Rules.

Its use shall therefore be restricted to trusted server environments.

Every Admin SDK operation must still enforce domain authorization and validation.

Bypassing Firestore Rules does not mean bypassing platform security.

# 12.37 Secrets and Credential Management

Secrets shall be held in approved secret management.

This includes:

- provider API keys;
- webhook secrets;
- service-account credentials;
- email and SMS credentials;
- signing keys.

Secrets shall be:

- environment-specific;
- rotated;
- access-controlled;
- excluded from source control;
- excluded from logs;
- unavailable to the frontend.

# 12.38 Security Logging

Security logs should capture:

- successful and failed privileged actions;
- authentication failures;
- account recovery attempts;
- permission denials;
- membership suspension;
- ownership transfer;
- administrator access;
- webhook signature failures;
- App Check failures;
- unusual session activity;
- rate-limit violations.

Logs shall include correlation IDs but minimize sensitive data.

# 12.39 Trust Events Versus Security Logs

Trust Events record business and governance facts.

Security logs record technical access and protection events.

Examples:

## Trust Event

Customer verified Purchase Record.

## Security Log

User attempted to access another customer's Purchase Record.

Both are important, but they serve different purposes.

# 12.40 Abuse Controls

The platform shall support controls for:

- OTP request flooding;
- login brute force;
- customer lookup enumeration;
- loyalty-number guessing;
- QR lookup abuse;
- repeated invalid Purchase Record creation;
- API scraping;
- notification abuse;
- account recovery abuse.

Controls may include:

- rate limits;
- cooldowns;
- App Check;
- CAPTCHA or challenge mechanisms;
- account locks;
- operational review;
- temporary provider blocking.

# 12.41 Customer Lookup Privacy

Searching by loyalty number or QR shall return only the minimum information needed to confirm the correct customer.

For example:

- preferred display name;
- partially masked phone number where appropriate;
- profile image if the customer permits it.

The business shall not receive full KYC information.

Phone-number lookup should be restricted and logged.

# 12.42 QR Code Security

The customer QR code shall not contain:

- phone number;
- email;
- authentication credentials;
- full personal profile;
- direct Firestore document path.

The QR code should contain an opaque public reference or signed lookup value.

Future rotating or time-limited QR codes may be introduced if static code abuse becomes material.

# 12.43 Loyalty Number Security

The loyalty number is an identifier, not a secret.

Knowledge of a loyalty number may allow a business to propose a Purchase Record.

It shall not allow a person to:

- access the customer account;
- verify purchases;
- redeem rewards without business validation;
- change profile data;
- view full history.

# 12.44 Data Privacy Boundaries

## Customer Data

Businesses may access only customer data required for the business relationship.

## Business Data

Customers may access only published business and Reward Program information plus their own interaction history.

## Platform Data

Only authorized administrators may access cross-business operational data.

## Analytics Data

Benchmarking and aggregate analysis shall avoid exposing identifiable business or customer information.

# 12.45 Consent and Preferences

The platform shall distinguish between:

- acceptance of Terms;
- acceptance of Privacy Policy;
- transactional communication;
- optional marketing consent;
- future personalization consent;
- future data-sharing consent.

Transactional notifications necessary to operate the service shall not be treated as marketing.

# 12.46 Progressive KYC Security

Optional customer profile information shall be protected according to sensitivity.

Examples:

- birthday;
- gender;
- interests;
- location;
- family details.

This information shall not be broadly visible to businesses.

Businesses may receive aggregated or consented targeting capabilities later without direct access to complete profiles.

# 12.47 Emergency Administrative Access

Emergency access may be required for:

- account takeover response;
- ownership recovery;
- critical incident resolution;
- legal compliance;
- production data repair.

Emergency access shall require:

- authorized administrator role;
- stated reason;
- time-limited elevation where practical;
- complete logging;
- post-action review.

No silent administrative impersonation shall be permitted.

# 12.48 Support Impersonation

The MVP should avoid unrestricted "log in as user" functionality.

Where support needs to reproduce a user experience, preferred approaches include:

- read-only diagnostic views;
- controlled account-state inspection;
- user-provided screenshots;
- support session tokens;
- explicit customer consent.

Any future impersonation capability must be visible, time-limited and audited.

# 12.49 Security Headers and Web Protection

Firebase Hosting or the selected delivery layer shall apply appropriate web security headers, including:

- Content Security Policy;
- Strict-Transport-Security;
- X-Content-Type-Options;
- Referrer-Policy;
- Permissions-Policy;
- frame-ancestor restrictions.

The PWA shall use HTTPS exclusively.

# 12.50 Frontend Security

The frontend shall:

- avoid storing secrets;
- avoid trusting local role values;
- escape or safely render business-generated content;
- protect against cross-site scripting;
- avoid exposing unnecessary personal data in logs;
- clear sensitive local state on sign-out;
- handle token expiration safely;
- use secure dependency management.

# 12.51 Rate Limiting

Cloud Functions and public endpoints shall enforce operation-specific limits.

Examples:

- OTP requests per phone number;
- customer lookups per staff account;
- Purchase Record submissions per minute;
- dispute creation;
- redemption attempts;
- webhook requests;
- public API calls.

Limits shall be configurable through Rules Studio where practical.

# 12.52 Security Monitoring and Alerts

Alerts should cover:

- unusual authentication failure spikes;
- administrator access anomalies;
- repeated cross-business access attempts;
- webhook signature failures;
- excessive account recovery attempts;
- abnormal customer lookup volume;
- App Check rejection spikes;
- repeated denied reward redemptions;
- large-scale permission changes;
- unusual data export behavior.

# 12.53 Security Incident Classification

Incidents should be classified by severity.

## Low

Isolated failed access or configuration issue.

## Medium

Repeated abuse attempt or limited account compromise.

## High

Confirmed unauthorized access, business compromise or material data exposure.

## Critical

Platform-wide compromise, significant data exposure or loss of system integrity.

Incident response procedures will be defined in Operational Playbooks.

# 12.54 Security Testing

Required security testing includes:

## Authentication Tests

- valid sign-in;
- invalid credentials;
- suspended account;
- linked providers;
- revoked sessions;
- account recovery.

## Authorization Tests

- customer self-access;
- cross-customer denial;
- valid business membership;
- cross-business denial;
- removed membership denial;
- owner-only actions;
- administrator scopes.

## Security Rules Tests

- read boundaries;
- direct write denial;
- Storage path access;
- query constraints;
- field restrictions.

## Abuse Tests

- rate limiting;
- repeated OTP;
- enumeration attempts;
- QR guessing;
- duplicate requests;
- webhook replay.

## Security Review

A focused security review shall occur before production launch.

# 12.55 Functional Requirements

## FR-SEC-001

Every human user shall authenticate through an individual account.

## FR-SEC-002

Authentication and authorization shall remain separate.

## FR-SEC-003

Detailed business permissions shall be resolved from authoritative membership data.

## FR-SEC-004

Only the registered customer may verify their Purchase Records.

## FR-SEC-005

Business data shall remain isolated by active membership and permission.

## FR-SEC-006

Firestore and Storage access shall be deny-by-default.

## FR-SEC-007

Critical authoritative writes shall be prohibited from direct client access.

## FR-SEC-008

App Check shall protect production client access.

## FR-SEC-009

Sensitive actions shall require recent authentication where appropriate.

## FR-SEC-010

Session revocation shall be supported.

## FR-SEC-011

Service identities shall use scoped non-human credentials.

## FR-SEC-012

Security-sensitive events shall be logged and monitored.

## FR-SEC-013

Public loyalty numbers and QR codes shall not authenticate users.

## FR-SEC-014

Account recovery shall preserve the existing platform identity where possible.

## FR-SEC-015

Platform administrators shall use least-privilege roles and stronger authentication.

## FR-SEC-016

Customer profile and KYC information shall be exposed only according to purpose and consent.

## FR-SEC-017

Security Rules shall be covered by automated emulator tests.

## FR-SEC-018

Rate limits shall protect authentication, lookup and sensitive operations.

# 12.56 Security Rules

| Rule ID | Rule                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------- |
| SR-001  | All access is denied unless explicitly permitted.                                                 |
| SR-002  | Shared staff authentication is prohibited.                                                        |
| SR-003  | Public customer identifiers are not authentication credentials.                                   |
| SR-004  | Only the registered customer may verify Purchase Records associated with their customer identity. |
| SR-005  | Business users may access only businesses with an active membership.                              |
| SR-006  | Businesses may not access customer activity with other businesses.                                |
| SR-007  | Critical commercial records are server-controlled.                                                |
| SR-008  | Firebase custom claims shall remain coarse-grained.                                               |
| SR-009  | Detailed permissions shall be validated against current server-side data.                         |
| SR-010  | Suspended or removed memberships shall not retain operational access.                             |
| SR-011  | Admin SDK use shall still enforce domain authorization.                                           |
| SR-012  | Secrets shall never be exposed to clients or logs.                                                |
| SR-013  | Privileged actions shall be auditable.                                                            |
| SR-014  | Account closure shall not silently erase required history.                                        |
| SR-015  | Optional KYC data shall be collected and exposed according to purpose and consent.                |
| SR-016  | Rate limiting and abuse controls shall protect lookup and authentication flows.                   |
| SR-017  | Production security rules shall not be changed without automated test coverage.                   |
| SR-018  | Emergency access shall be controlled, justified and reviewed.                                     |

# 12.57 Acceptance Criteria

This chapter is approved when:

- Authentication methods are defined for customers, business users, staff and administrators.
- One user can safely hold multiple role contexts.
- Custom claims are limited to coarse-grained attributes.
- Server-side permission resolution is established.
- Customer and business data-isolation rules are explicit.
- Firestore and Storage Security Rules follow a deny-by-default model.
- Critical direct client writes are prohibited.
- Account recovery, suspension, closure and session revocation are defined.
- QR codes and loyalty numbers remain identifiers rather than secrets.
- App Check, abuse controls and security monitoring are included.
- Progressive KYC information is protected by purpose and consent.
- Automated security testing is required before production.

# 12.58 Next Chapter

The next chapter should define:

# Notifications, Localization and Communication Architecture

It will cover:

- English and French launch requirements;
- Kirundi, Swahili and Kinyarwanda readiness;
- translation keys;
- business-generated multilingual content;
- notification intent and delivery;
- push, SMS, email and future WhatsApp;
- customer preferences;
- transactional versus marketing communication;
- reminder schedules;
- quiet hours;
- templates;
- fallback language logic;
- delivery tracking;
- retries;
- accessibility and plain-language standards.