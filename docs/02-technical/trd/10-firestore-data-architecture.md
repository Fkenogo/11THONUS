> **Title:** TRD Chapter 10 — Firestore Data Architecture and Domain Ownership  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/10-firestore-data-architecture.md`  
> **Last controlled update:** 2026-08-07 (`DEC-PROD-012` Option D — §10.6.2 `gender` removed from the MVP `customerProfiles` schema; future-additive governance note added). Previously: 2026-07-16 (Phase 3B — §10.10.1 schema gains optional monetary fields + non-influence rule per DEC-DATA-003)

# 11thONUS

# Technical Requirements Document

## PART III - Data Architecture

# Chapter 10: Firestore Data Architecture and Domain Ownership

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-9

# 10.1 Purpose

This chapter defines how 11thONUS shall structure, own, secure and evolve its operational data within Cloud Firestore.

The purpose is not merely to list collections.

It is to establish:

- authoritative ownership of each business concept;
- domain boundaries;
- document structures;
- immutable historical records;
- permitted denormalization;
- cross-domain references;
- indexing principles;
- data isolation;
- retention;
- archival;
- versioning;
- migration requirements;
- multilingual data structures;
- country and currency readiness.

Firestore shall implement the platform's domain architecture.

It shall not replace it.

# 10.2 Core Data Principles

## DAP-001 - One Authoritative Owner

Every business concept shall have one authoritative domain and one authoritative record.

Examples:

- Identity Domain owns customers and business memberships.
- Purchase Domain owns Purchase Records.
- Loyalty Domain owns Verified Units and Loyalty Cycles.
- Reward Domain owns earned rewards and redemptions.
- Trust Domain owns Trust Events.
- Commerce Knowledge Domain owns standard taxonomy.

No second collection may independently maintain the same authoritative business meaning.

## DAP-002 - Ledger Before Balance

Historical events and verified source records are authoritative.

Displayed balances, counts and dashboard totals are derived or cached projections.

## DAP-003 - No Critical Client Writes

Client applications shall not directly create or modify authoritative records for:

- Purchase Records;
- customer verification;
- Verified Units;
- Loyalty Cycles;
- earned rewards;
- redemption;
- Trust Events;
- subscription status;
- role assignments;
- platform rules.

These operations shall pass through trusted Cloud Functions or approved server processes.

## DAP-004 - Immutable Commercial History

Completed or finalized commercial records shall not be overwritten.

Corrections shall create:

- reversal events;
- replacement records;
- new versions;
- linked resolution records.

## DAP-005 - Denormalize Deliberately

Firestore denormalization is permitted for performance, but every copied value shall identify its authoritative source.

## DAP-006 - Business Isolation

Every business-owned operational record shall contain an explicit businessId.

## DAP-007 - Country-Aware Data

Country, currency, locale and timezone context shall be stored where they materially affect interpretation.

## DAP-008 - Server Time Is Authoritative

Authoritative timestamps shall use trusted server-generated timestamps.

## DAP-009 - Version Every Evolving Contract

Documents representing configurable or evolving structures shall contain schema or rule versions.

## DAP-010 - Archive, Do Not Erase

Data required for trust, audit, dispute resolution or reporting shall be retained through archival states rather than silently deleted.

# 10.3 Firestore Top-Level Structure

The preferred architecture uses domain-owned top-level collections.

/users  
/customerProfiles  
/businesses  
/businessMemberships  
/businessBranches  
<br/>/knowledgeNodes  
/knowledgeTranslations  
/knowledgeTags  
/knowledgeSuggestions  
<br/>/ruleDefinitions  
/ruleVersions  
/ruleAssignments  
<br/>/rewardPrograms  
/rewardProgramVersions  
<br/>/purchaseRecords  
/purchaseDisputes  
/purchaseCorrections  
<br/>/verifiedUnits  
/loyaltyCycles  
<br/>/rewards  
/redemptions  
/onUsMoments  
<br/>/trustEvents  
/operationalReviews  
/auditRecords  
<br/>/subscriptions  
/subscriptionPayments  
<br/>/notifications  
/notificationDeliveries  
<br/>/reportingProjections  
<br/>/integrationRequests  
/integrationWebhooks  
/integrationDeadLetters  
<br/>/platformSettings  
/supportCases

This list is a logical starting point.

The final physical design may combine narrowly related collections where that improves consistency without weakening ownership boundaries.

# 10.4 Collection Ownership Matrix

| Collection             | Owning Domain                | Authoritative Purpose                         |
| ---------------------- | ---------------------------- | --------------------------------------------- |
| users                  | Identity                     | Core platform user identity                   |
| customerProfiles       | Identity                     | Customer-specific profile and progressive KYC |
| businesses             | Identity                     | Business account and operating identity (Administration owns approval/suspension workflows only — TRD23 §23.8) |
| businessMemberships    | Identity                     | User-to-business role relationship            |
| businessBranches       | Identity                     | Business location structure                   |
| knowledgeNodes         | Commerce Knowledge           | Taxonomy hierarchy                            |
| knowledgeTranslations  | Commerce Knowledge           | Localized knowledge labels                    |
| knowledgeTags          | Commerce Knowledge           | Governed tags                                 |
| knowledgeSuggestions   | Commerce Knowledge           | Proposed additions awaiting review            |
| ruleDefinitions        | Rules                        | Stable rule identity                          |
| ruleVersions           | Rules                        | Versioned rule content                        |
| ruleAssignments        | Rules                        | Scope-specific rule activation                |
| rewardPrograms         | Reward Programs              | Current Reward Program identity and state     |
| rewardProgramVersions  | Reward Programs              | Historical commercial configuration           |
| purchaseRecords        | Purchase                     | Authoritative Purchase Record                 |
| purchaseDisputes       | Purchase                     | Customer dispute and resolution               |
| purchaseCorrections    | Purchase                     | Correction and replacement linkage            |
| verifiedUnits          | Loyalty                      | Authoritative verified unit issuance          |
| loyaltyCycles          | Loyalty                      | Customer progress within a Reward Program     |
| rewards                | Reward                       | Earned reward entitlement                     |
| redemptions            | Reward                       | Reward use                                    |
| onUsMoments            | Reward                       | Customer-facing redemption history            |
| trustEvents            | Trust                        | Immutable event history                       |
| operationalReviews     | Trust                        | Flag and review workflow                      |
| auditRecords           | Trust                        | Administrative audit evidence                 |
| subscriptions          | Subscription                 | Business subscription state                   |
| subscriptionPayments   | Subscription                 | Payment attempt and confirmation (provider interaction flows through Integration Domain adapters — TRD Ch. 9) |
| notifications          | Notification                 | Notification intent                           |
| notificationDeliveries | Notification                 | Per-channel delivery attempts (channel providers accessed via Integration Domain adapters) |
| reportingProjections   | Reporting                    | Derived analytics projections                 |
| integrationRequests    | Integration                  | Standardized outbound request                 |
| integrationWebhooks    | Integration                  | Validated inbound callback                    |
| integrationDeadLetters | Integration                  | Failed processing queue                       |
| platformSettings       | Administration               | Platform-level configuration                  |
| supportCases           | Administration               | Support and escalation records                |

# 10.5 Standard Document Metadata

Every authoritative document shall include the relevant standard metadata.

type BaseDocument = {  
id: string;  
schemaVersion: number;  
status: string;  
createdAt: Timestamp;  
createdBy: string | null;  
updatedAt: Timestamp;  
updatedBy: string | null;  
};

Where applicable:

type ScopedDocument = BaseDocument & {  
businessId?: string;  
customerId?: string;  
countryCode?: string;  
currencyCode?: string;  
timezone?: string;  
archivedAt?: Timestamp | null;  
archivedBy?: string | null;  
};

## Required Standards

- IDs shall be opaque and non-sequential.
- Dates shall use Firestore Timestamp.
- Country codes shall use ISO 3166-1 alpha-2.
- Currency codes shall use ISO 4217.
- Language codes shall use BCP 47-compatible identifiers.
- Monetary values shall use integer minor units where the currency supports minor units.
- For currencies without minor units, amounts shall still use integer storage.
- Floating-point storage shall not be used for money.

# 10.6 Identity Domain Collections

## 10.6.1 users

Represents one natural person or service identity.

type UserDocument = {  
id: string;  
authUid: string;  
userType: "human" | "service";  
displayName: string;  
primaryPhone?: string;  
primaryEmail?: string;  
preferredLanguage: string;  
countryCode: string;  
timezone: string;  
status: "registered" | "active" | "dormant" | "locked" | "suspended" | "closed" | "archived";  <!-- [Corrected ENG-P2-001-06, 2026-08-04: was "pending"|"active"|"locked"|"suspended"|"closed"|"archived" — "pending" renamed "registered" and "dormant" added to match the merged `-01`/`-06` `IdentityStatus` enum (`functions/src/domains/identity/models/identityStatus.ts`); `ENG-P2-ARCH-001` §3 itself flagged `dormant` as a "downstream schema/product task must add it" item. Original wording preserved in git history. -->
createdAt: Timestamp;  
createdBy: string | null;  
updatedAt: Timestamp;  
updatedBy: string | null;  
schemaVersion: number;  
};

### Rules

- authUid shall be unique.
- Authentication credentials shall remain in Firebase Authentication.
- Firestore shall not store passwords, OTP secrets or provider tokens.
- Closing a user shall not remove their commercial history.

## 10.6.2 customerProfiles

Contains customer-specific progressive KYC and preferences.

type CustomerProfileDocument = {  
id: string;  
userId: string;  
loyaltyNumber: string;  
qrReference: string;  
firstName: string;  
lastName: string;  
dateOfBirth?: string;  
~~gender?: "female" | "male" | "non_binary" | "prefer_not_to_say" | "other";~~ // [REMOVED FROM MVP — `DEC-PROD-012` Option D, 2026-08-07]  
city?: string;  
profileCompletionPercent: number;  
interests: string\[\];  
preferredCategories: string\[\];  
communicationPreferences: {  
push: boolean;  
sms: boolean;  
email: boolean;  
whatsapp: boolean;  
marketingConsent: boolean;  
};  
consentVersions: {  
termsVersion: string;  
privacyVersion: string;  
acceptedAt: Timestamp;  
};  
status: "active" | "suspended" | "closed" | "archived";  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

> **Governance note (`DEC-PROD-012`, Option D — 2026-08-07):** The `gender` attribute is **removed from the MVP `customerProfiles` schema** — gender is **not collected at MVP**. This is additive-safe: a future governed release may reintroduce an optional `gender` attribute without breaking compatibility, but only under a **separate governed decision** (with the legal/cultural input `EXT-LEG-001` covers, if that release proposes collecting gender). No MVP schema freeze depends on `gender`. See the [Decision Register `DEC-PROD-012`](../../00-governance/decisions/decision-register.md) and the [implementation report](../../05-implementation/reports/DEC-PROD-012-implementation-and-eng-p2-001-02-unblock-2026-08-07.md).

### Progressive KYC Rule

Optional information shall remain absent rather than being populated with false placeholders.

## 10.6.3 businesses

type BusinessDocument = {  
id: string;  
businessCode: string;  
legalName?: string;  
displayName: string;  
ownerUserId: string;  
primaryCategoryId: string;  
businessTypeId?: string;  
countryCode: string;  
currencyCode: string;  
timezone: string;  
city: string;  
address?: string;  
contactPhone: string;  
contactEmail?: string;  
logoUrl?: string;  
supportedLanguages: string\[\];  
status:  
| "draft"  
| "pending_verification"  
| "trial"  
| "active"  
| "suspended"  
| "expired"  
| "closed"  
| "archived";  
subscriptionId?: string;  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

## 10.6.4 businessMemberships

Represents role assignment separately from the user and business.

type BusinessMembershipDocument = {  
id: string;  
userId: string;  
businessId: string;  
role: "owner" | "manager" | "staff";  
permissionSetId?: string;  
permissions: PermissionOverrideRecord\[\];  
status: "invited" | "active" | "suspended" | "removed";  
invitedBy: string;  
invitedAt: Timestamp;  
acceptedAt?: Timestamp;  
endedAt?: Timestamp;  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

type PermissionOverrideRecord = {  
permissionId: string;  
direction: "grant" | "revoke";  
grantedBy: string;  
grantedAt: Timestamp;  
};

**2026-08-15 correction (`ENG-P2-004D`, Founder-approved Option C):** `permissions` was previously declared `string[]` with no encoding — undesigned since authoring. Now resolved as a Firestore array of structured `PermissionOverrideRecord` maps. `businessId`/`membershipId` are intentionally not fields on the record — an override is scoped to the containing membership document structurally, never persisted redundantly. No live data existed under the prior declaration; this is a declaration correction, not a migration. See `ENG-P2-004-DESIGN-001` §18 and the `ENG-P2-004D` implementation report for the full rationale and options considered.

### Membership Rules

- A user may have memberships in multiple businesses.
- A business must retain at least one active owner.
- Historical membership records shall remain after removal.

## 10.6.4a businessMembershipInvitations (additive, `ENG-P2-003A`)

**2026-08-19 addition (`ENG-P2-003A`, Founder-approved FD-1/FD-2/FD-3/FD-4-STAFF via `ENG-P2-003-DESIGN-001` §7/§8/§9, §28).** A new, additive collection — not a `businessMemberships` field — following the same governance precedent `ENG-P2-004D`'s correction above and `ENG-P2-002B`'s `businessCodeReservations` collection already established: an implementing package may define an additive, non-conflicting collection's shape in its own governing design document and deliver the corresponding TRD10 section as part of that same implementation package (`ENG-P2-003-DESIGN-001` §18.1's grounded finding). No prerequisite, standalone schema-correction package precedes this addition.

Represents the pre-acceptance state of a staff invitation — structurally separate from `businessMembershipDocument` above. `businessMembership.userId` remains required/non-nullable, unchanged; no document in this collection ever carries a `userId` field. A `businessMembership` is created for the first time only on successful invitation acceptance (§8a of the design), never before.

    type BusinessMembershipInvitationDocument = {
      id: string;
      businessId: string;
      role: "manager" | "staff";
      deliveryTarget: { type: "email" | "phone"; value: string };
      invitedBy: string;
      status: "pending" | "accepted" | "revoked" | "expired";
      invitedAt: Timestamp;
      expiresAt: Timestamp;
      resolvedAt?: Timestamp;
      acceptedMembershipId?: string;
      createdAt: Timestamp;
      updatedAt: Timestamp;
      schemaVersion: number;
    };

Lifecycle (`ENG-P2-003-DESIGN-001` §7.2a): `pending` is the only non-terminal state; `accepted`/`revoked`/`expired` are all terminal — no reverse transition to `pending`. A resend/reissue creates a **new** invitation record (new `id`), never reactivates a terminal one. Terminal records are retained for operational/audit history, never hard-deleted (mirrors this section's own "historical membership records shall remain" rule, extended to invitations).

`role` is restricted to `"manager"`/`"staff"` — `"owner"` is never a valid invitation intended role (§11.4). `deliveryTarget` is delivery/targeting evidence only — email/phone are never authoritative platform identity (§6.2/§6.3); the authoritative Customer Identity `userId` is bound only on ACCEPT, when the `businessMembership` document is created.

Exact expiry duration, token/reference entropy, encoding, and storage representation for the opaque invitation reference are Engineering-owned implementation details, not frozen by this schema declaration (FD-4-STAFF) — deferred to `ENG-P2-003B`. No Firestore Rules or live-data migration accompany this addition (the collection does not yet exist in any environment). This declaration is contract-only (`functions/src/domains/permissions/models/businessMembershipInvitation.ts`, `ENG-P2-003A`) — no repository, transaction, or write path is implemented by `ENG-P2-003A`; those are `ENG-P2-003B`'s scope.

# 10.7 Commerce Knowledge Domain Collections

## 10.7.1 knowledgeNodes

Uses a self-referencing hierarchy.

type KnowledgeNodeDocument = {  
id: string;  
parentId: string | null;  
nodeType:  
| "industry"  
| "business_category"  
| "business_type"  
| "reward_program_category"  
| "standard_product"  
| "standard_service";  
canonicalName: string;  
slug: string;  
path: string;  
depth: number;  
description?: string;  
iconKey?: string;  
status: "draft" | "pending_review" | "active" | "retired" | "archived";  
version: number;  
replacementNodeId?: string;  
searchTerms: string\[\];  
createdAt: Timestamp;  
createdBy: string;  
updatedAt: Timestamp;  
updatedBy: string;  
schemaVersion: number;  
};

### Hierarchy Rule

The hierarchy shall support variable depth.

The platform shall not hardcode exactly three taxonomy levels.

## 10.7.2 knowledgeTranslations

type KnowledgeTranslationDocument = {  
id: string;  
nodeId: string;  
languageCode: string;  
displayName: string;  
description?: string;  
synonyms: string\[\];  
status: "draft" | "reviewed" | "published";  
reviewedBy?: string;  
reviewedAt?: Timestamp;  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

## 10.7.3 knowledgeTags

Tags shall be governed and reusable.

type KnowledgeTagDocument = {  
id: string;  
tagGroup:  
| "business_attribute"  
| "product_attribute"  
| "customer_interest"  
| "system_behaviour";  
canonicalName: string;  
slug: string;  
status: "draft" | "active" | "retired";  
translations: Record&lt;string, string&gt;;  
searchTerms: string\[\];  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

# 10.8 Rules Domain Collections

## 10.8.1 ruleDefinitions

Stable identity of a configurable rule.

type RuleDefinitionDocument = {  
id: string;  
ruleKey: string;  
category:  
| "platform"  
| "country"  
| "subscription"  
| "business"  
| "reward_program"  
| "purchase"  
| "customer"  
| "notification"  
| "operational_integrity";  
description: string;  
valueType: "boolean" | "number" | "string" | "duration" | "json";  
overridePolicy: "not_allowed" | "allowed_for_scopes" | "fully_configurable";  
status: "active" | "retired";  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

## 10.8.2 ruleVersions

type RuleVersionDocument = {  
id: string;  
ruleDefinitionId: string;  
version: number;  
value: unknown;  
effectiveFrom: Timestamp;  
effectiveUntil?: Timestamp;  
status: "draft" | "approved" | "scheduled" | "active" | "superseded";  
createdBy: string;  
approvedBy?: string;  
createdAt: Timestamp;  
approvedAt?: Timestamp;  
schemaVersion: number;  
};

## 10.8.3 ruleAssignments

Links a rule version to a scope.

type RuleAssignmentDocument = {  
id: string;  
ruleDefinitionId: string;  
ruleVersionId: string;  
scopeType:  
| "platform"  
| "country"  
| "subscription_plan"  
| "business"  
| "reward_program"  
| "customer";  
scopeId: string;  
priority: number;  
activeFrom: Timestamp;  
activeUntil?: Timestamp;  
status: "active" | "inactive";  
createdAt: Timestamp;  
createdBy: string;  
schemaVersion: number;  
};

# 10.9 Reward Program Collections

## 10.9.1 rewardPrograms

Stores stable Reward Program identity and current operational status.

type RewardProgramDocument = {  
id: string;  
businessId: string;  
currentVersionId: string;  
displayName: string;  
rewardProgramCategoryId: string;  
status: "draft" | "active" | "paused" | "retired" | "archived";  
sharedLoyaltyNumberAllowed: boolean;  
createdAt: Timestamp;  
createdBy: string;  
updatedAt: Timestamp;  
updatedBy: string;  
schemaVersion: number;  
};

## 10.9.2 rewardProgramVersions

Stores the complete commercial terms in force.

type RewardProgramVersionDocument = {  
id: string;  
rewardProgramId: string;  
businessId: string;  
version: number;  
qualifyingKnowledgeNodeIds: string\[\];  
businessDisplayProductNames: string\[\];  
requiredVerifiedUnits: number;  
rewardQuantity: number;  
rewardDescription: string;  
standardRewardNodeId?: string;  
multipleUnitsAllowed: boolean;  
sharedLoyaltyNumberAllowed: boolean;  
bulkReviewThreshold?: number;  
effectiveFrom: Timestamp;  
effectiveUntil?: Timestamp;  
status: "draft" | "active" | "superseded";  
createdAt: Timestamp;  
createdBy: string;  
approvedAt?: Timestamp;  
schemaVersion: number;  
};

### Version Integrity Rule

Every Purchase Record and Loyalty Cycle shall reference the applicable Reward Program version.

### Threshold Rule (MVP)

`requiredVerifiedUnits` is stored as a number for architectural consistency, but for the MVP it is **fixed at 10 by platform rule and is not business-configurable** (TRD Consolidation Audit §4; PRD6 §4.4). Alternative thresholds may be introduced only through formal product approval and never retroactively.

# 10.10 Purchase Domain Collections

## 10.10.1 purchaseRecords

The authoritative record of a business-submitted qualifying purchase.

type PurchaseRecordDocument = {  
id: string;  
businessId: string;  
branchId: string;  
customerId: string;  
rewardProgramId: string;  
rewardProgramVersionId: string;  
quantity: number;  
businessProductLabel?: string;  
unitValueMinorUnits?: number;  
currencyCode?: string;  
recordedByUserId: string;  
recordedByMembershipId: string;  
source: "staff" | "manager" | "owner" | "pos" | "api" | "offline_sync";  
purchaseOccurredAt: Timestamp;  
recordedAt: Timestamp;  
status:  
| "waiting_for_customer"  
| "verified"  
| "rejected"  
| "under_review"  
| "corrected"  
| "cancelled"  
| "expired"  
| "archived";  
customerResponse?: {  
action: "verified" | "rejected" | "disputed";  
reasonCode?: string;  
comment?: string;  
respondedAt: Timestamp;  
};  
correctionOfPurchaseRecordId?: string;  
replacedByPurchaseRecordId?: string;  
clientRequestId: string;  
idempotencyKey: string;  
deviceSessionId?: string;  
syncStatus: "synced" | "pending_sync" | "sync_failed";  
createdAt: Timestamp;  
createdBy: string;  
schemaVersion: number;  
};

### Immutability Rule

After creation, commercial facts shall not be edited directly.

Only lifecycle fields may transition through controlled server operations.

### Monetary Metadata Rule (DEC-DATA-003, confirmed 16 July 2026)

`unitValueMinorUnits` and `currencyCode` are optional, non-authoritative reporting metadata.

- Both fields are optional; a Purchase Record with no monetary data is fully valid.
- Where present, `unitValueMinorUnits` shall use integer minor units and `currencyCode` shall use ISO 4217, per §10.5 Required Standards.
- These fields shall **never** be read by Verified Unit issuance, Reward Program progression, Loyalty Cycle calculation or reward eligibility logic.
- This constraint remains in force unless a future founder decision explicitly introduces amount-based Reward Programs.

## 10.10.2 purchaseDisputes

type PurchaseDisputeDocument = {  
id: string;  
purchaseRecordId: string;  
businessId: string;  
customerId: string;  
disputeType:  
| "wrong_quantity"  
| "wrong_item"  
| "not_my_purchase"  
| "duplicate"  
| "wrong_program"  
| "other";  
customerComment?: string;  
status: "open" | "business_review" | "resolved_verified" | "resolved_rejected";  
resolutionComment?: string;  
resolvedBy?: string;  
openedAt: Timestamp;  
resolvedAt?: Timestamp;  
schemaVersion: number;  
};

# 10.11 Loyalty Domain Collections

## 10.11.1 verifiedUnits

Each document records the authoritative issuance or reversal of units.

type VerifiedUnitDocument = {  
id: string;  
customerId: string;  
businessId: string;  
rewardProgramId: string;  
rewardProgramVersionId: string;  
loyaltyCycleId: string;  
purchaseRecordId: string;  
quantity: number;  
entryType: "credit" | "reversal";  
reasonCode: string;  
createdAt: Timestamp;  
createdBy: string;  
schemaVersion: number;  
};

### Unit Rule

A Purchase Record shall never be counted merely through a mutable cycle counter.

The supporting Verified Unit record must exist.

## 10.11.2 loyaltyCycles

type LoyaltyCycleDocument = {  
id: string;  
customerId: string;  
businessId: string;  
rewardProgramId: string;  
rewardProgramVersionId: string;  
cycleNumber: number;  
requiredVerifiedUnits: number;  
projectedVerifiedUnits: number;  
rewardId?: string;  
status: "active" | "reward_available" | "reward_redeemed" | "closed";  
startedAt: Timestamp;  
rewardAvailableAt?: Timestamp;  
closedAt?: Timestamp;  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

### Projection Rule

projectedVerifiedUnits is a cached value for performance.

It is not the sole source of truth.

It must be reconcilable against verifiedUnits.

### Active Cycle Uniqueness

Only one active or reward-available cycle may exist per:

- customer;
- business;
- Reward Program.

This shall be enforced through transactional server logic.

# 10.12 Reward Domain Collections

## 10.12.1 rewards

type RewardDocument = {  
id: string;  
customerId: string;  
businessId: string;  
rewardProgramId: string;  
rewardProgramVersionId: string;  
loyaltyCycleId: string;  
rewardDescription: string;  
rewardQuantity: number;  
status: "available" | "redeemed" | "cancelled" | "expired";  
availableAt: Timestamp;  
redeemedAt?: Timestamp;  
cancelledAt?: Timestamp;  
createdAt: Timestamp;  
schemaVersion: number;  
};

## 10.12.2 redemptions

type RedemptionDocument = {  
id: string;  
rewardId: string;  
customerId: string;  
businessId: string;  
rewardProgramId: string;  
loyaltyCycleId: string;  
processedByUserId: string;  
processedByMembershipId: string;  
branchId: string;  
source: "staff" | "manager" | "owner" | "pos" | "api";  
status: "completed" | "reversed";  
idempotencyKey: string;  
redeemedAt: Timestamp;  
reversedAt?: Timestamp;  
reversalReason?: string;  
schemaVersion: number;  
};

## 10.12.3 onUsMoments

Customer-facing historical projection.

type OnUsMomentDocument = {  
id: string;  
rewardId: string;  
redemptionId: string;  
customerId: string;  
businessId: string;  
rewardProgramId: string;  
title: string;  
description: string;  
occurredAt: Timestamp;  
status: "completed" | "reversed";  
schemaVersion: number;  
};

This collection may be derived from reward and redemption data but provides an optimized customer experience.

# 10.13 Trust Domain Collections

## 10.13.1 trustEvents

Append-only record of significant domain events.

type TrustEventDocument = {  
id: string;  
eventType: string;  
eventVersion: number;  
sourceDomain: string;  
aggregateType: string;  
aggregateId: string;  
businessId?: string;  
customerId?: string;  
actor: {  
actorType: "user" | "service" | "system";  
actorId: string;  
role?: string;  
};  
correlationId: string;  
causationId?: string;  
payload: Record&lt;string, unknown&gt;;  
occurredAt: Timestamp;  
recordedAt: Timestamp;  
schemaVersion: number;  
};

### Trust Event Rules

- Trust Events are append-only.
- Clients cannot write them.
- Events must include correlation identifiers.
- Personally sensitive payloads must be minimized.
- Event schemas must be versioned.

## 10.13.2 operationalReviews

type OperationalReviewDocument = {  
id: string;  
businessId: string;  
subjectType: "purchase" | "redemption" | "staff" | "business" | "integration";  
subjectId: string;  
reasonCode: string;  
severity: "low" | "medium" | "high" | "critical";  
source: "system" | "customer" | "business" | "admin";  
status: "open" | "in_review" | "resolved_valid" | "resolved_actioned";  
assignedTo?: string;  
resolution?: string;  
createdAt: Timestamp;  
resolvedAt?: Timestamp;  
schemaVersion: number;  
};

# 10.14 Subscription and Billing Collections

## 10.14.1 subscriptions

type SubscriptionDocument = {  
id: string;  
businessId: string;  
planId: string;  
countryCode: string;  
currencyCode: string;  
billingInterval: "monthly" | "quarterly" | "annual";  
status: "draft" | "trial" | "active" | "past_due" | "grace_period" | "suspended" | "cancelled" | "expired" | "archived";  
currentPeriodStart: Timestamp;  
currentPeriodEnd: Timestamp;  
trialEndsAt?: Timestamp;  
productLimit: number;  
staffLimit: number;  
branchLimit: number;  
createdAt: Timestamp;  
updatedAt: Timestamp;  
schemaVersion: number;  
};

## 10.14.2 subscriptionPayments

The confirmed payment record must be server-controlled.

# 10.15 Notification Collections

## 10.15.1 notifications

Represents message intent.

type NotificationDocument = {  
id: string;  
recipientUserId: string;  
businessId?: string;  
notificationType: string;  
templateKey: string;  
languageCode: string;  
templateData: Record&lt;string, unknown&gt;;  
preferredChannels: Array&lt;"push" | "sms" | "email" | "whatsapp"&gt;;  
status: "queued" | "processing" | "partially_delivered" | "delivered" | "failed" | "suppressed" | "cancelled";  
scheduledFor?: Timestamp;  
createdAt: Timestamp;  
schemaVersion: number;  
};

## 10.15.2 notificationDeliveries

One document per channel attempt.

# 10.16 Reporting Projections

Reporting shall consume derived projections rather than repeatedly scanning the complete operational ledger.

Examples:

/reportingProjections/businessDaily/{businessId_date}  
/reportingProjections/rewardProgramMonthly/{programId_month}  
/reportingProjections/customerProgress/{customerId_programId}  
/reportingProjections/staffDaily/{membershipId_date}

The exact physical layout shall be confirmed against query patterns and Firestore cost modelling.

## Projection Principles

- Projections are rebuildable.
- Projections are not authoritative commercial history.
- Projection generation must be idempotent.
- Projection corrections shall be possible from source records and Trust Events.

# 10.17 References and Denormalization

Firestore does not provide relational joins.

The platform shall therefore use controlled denormalization.

A Purchase Record may store:

- businessId;
- customerId;
- rewardProgramId;
- rewardProgramVersionId;
- selected display labels.

However:

- canonical Reward Program rules remain in rewardProgramVersions;
- customer identity remains in the Identity Domain;
- taxonomy remains in the Commerce Knowledge Domain.

## Snapshot Fields

Where historical interpretation depends on a label, the record may store a snapshot.

Example:

rewardProgramSnapshot: {  
displayName: string;  
rewardDescription: string;  
};

This prevents historical records from changing visually after later renaming.

# 10.18 Subcollections Versus Top-Level Collections

Top-level collections are preferred for records requiring:

- cross-business administrative queries;
- customer-wide queries;
- platform reporting;
- collection-group complexity avoidance;
- direct indexing.

Subcollections may be used for tightly contained details such as:

/purchaseRecords/{purchaseId}/timeline/{timelineEventId}  
/supportCases/{caseId}/messages/{messageId}

A subcollection shall not hide a platform-critical record that must be queried broadly.

# 10.19 Query Design Principles

Every major user journey shall have an explicit query design before implementation.

Required journeys include:

- customer waiting-for-you list;
- customer progress by Reward Program;
- customer available rewards;
- business waiting-for-customer-verification list;
- staff recent Purchase Records;
- business review queue;
- business active Reward Programs;
- rewards available by business;
- business daily dashboard;
- super-admin suspended businesses;
- expired subscriptions.

Queries shall be designed to avoid:

- unbounded reads;
- client-side filtering of large datasets;
- full collection scans;
- repeated reads of unchanged reference data.

# 10.20 Indexing Strategy

Firestore composite indexes shall be tracked in source control.

Typical indexes may include:

## Purchase Records

businessId + status + recordedAt desc  
customerId + status + recordedAt desc  
businessId + recordedByMembershipId + recordedAt desc  
rewardProgramId + status + recordedAt desc

## Loyalty Cycles

customerId + status + updatedAt desc  
businessId + rewardProgramId + status  
customerId + rewardProgramId + status

## Rewards

customerId + status + availableAt desc  
businessId + status + availableAt desc

## Trust Events

aggregateType + aggregateId + occurredAt asc  
businessId + occurredAt desc  
customerId + occurredAt desc

Indexes shall be created from actual required queries, not speculative combinations.

# 10.21 Pagination

Every potentially large list shall use cursor-based pagination.

The system shall avoid offset pagination.

Required pagination support includes:

- Purchase Records;
- customer activity;
- business customers;
- Trust Events;
- notifications;
- support cases;
- reporting detail tables.

Default and maximum page sizes shall be configured centrally.

# 10.22 Data Isolation

## Customer Access

Customers may read only:

- their profile;
- their own Purchase Records;
- their own Loyalty Cycles;
- their own rewards;
- their own On Us Moments;
- permitted public business and Reward Program data.

## Business Access

Business users may read business-scoped data according to membership and permissions.

They may not read:

- customer activity at other businesses;
- other businesses' reports;
- platform-wide Trust Events;
- private customer profile data unrelated to the business relationship.

## Super Admin Access

Administrative access shall be permission-controlled and audited.

# 10.23 Firestore Security Rule Philosophy

Security Rules provide an enforcement layer but shall not contain complex commercial calculations.

Rules should enforce:

- authenticated access;
- ownership;
- business membership;
- allowed fields;
- read boundaries;
- prohibition of direct authoritative writes.

Critical workflows shall be executed through Cloud Functions using the Admin SDK.

# 10.24 Soft Deletion and Archival

The platform shall distinguish among:

- active;
- inactive;
- suspended;
- retired;
- closed;
- archived.

Hard deletion shall be limited to:

- invalid test data outside production;
- legally required removal where compatible with audit obligations;
- temporary uncommitted drafts;
- data explicitly classified as disposable.

Commercial records shall normally be archived, not deleted.

# 10.25 Retention Policy Categories

Data shall be classified into retention groups.

## Permanent or Long-Term

- Trust Events;
- verified Purchase Records;
- Verified Units;
- Loyalty Cycles;
- rewards;
- redemptions;
- ownership and role history;
- rule versions;
- knowledge versions.

## Policy-Defined

- notifications;
- delivery logs;
- support attachments;
- raw webhook payloads;
- security logs;
- analytics event detail.

## Customer-Controlled Subject to Legal Limits

- optional profile fields;
- marketing preferences;
- profile photo;
- interests.

Exact retention periods shall be defined in the Privacy, Compliance and Operations standards.

# 10.26 Multilingual Data

Customer-facing canonical content shall use translation references wherever practical.

A document may contain:

{  
titleKey: "reward.available.title",  
templateData: {  
businessName: "Joe's Coffee"  
}  
}

For business-generated custom content, the platform may store localized variants:

localizedContent: {  
en: { name: "Regular Coffee" },  
fr: { name: "Café régulier" }  
}

English and French shall be supported for launch-critical customer-facing content.

The architecture shall support Kirundi, Swahili and Kinyarwanda without schema changes.

# 10.27 Timezone Standards

All authoritative timestamps shall be stored in UTC.

Business and customer timezone values shall be stored separately.

Date-based reporting shall use the relevant business timezone unless otherwise specified.

The system must not infer business dates solely from UTC boundaries.

# 10.28 Offline Data Requirements

Offline-created Purchase Records shall include:

- stable client request ID;
- local creation timestamp;
- server receipt timestamp;
- device session ID;
- sync status;
- idempotency key.

The server shall determine whether the request is new or a retry.

An offline record shall not become customer-visible until accepted by the authoritative server workflow.

# 10.29 Atomicity and Transactions

Firestore transactions or equivalent server-side atomic patterns shall be used when:

- verifying a Purchase Record;
- issuing Verified Units;
- updating a Loyalty Cycle projection;
- creating a reward;
- redeeming a reward;
- closing and opening Loyalty Cycles;
- assigning the final active owner;
- changing subscription-controlled capacity.

Large cross-domain workflows should use idempotent event processing rather than oversized Firestore transactions.

# 10.30 Idempotency

Every sensitive write operation shall support idempotency.

Required operations include:

- Purchase Record creation;
- customer verification;
- dispute submission;
- Verified Unit issuance;
- reward creation;
- redemption;
- payment confirmation;
- webhook processing;
- notification scheduling.

Idempotency records may be stored in a dedicated collection or incorporated into authoritative documents, depending on the operation.

# 10.31 Schema Versioning

Every authoritative document shall include schemaVersion.

Schema changes shall be classified as:

- backward-compatible;
- migration-required;
- breaking.

Readers should tolerate older supported versions during rolling migrations.

No production migration shall rely on manual editing through the Firebase console.

# 10.32 Data Migration Standards

Every migration shall provide:

- migration ID;
- purpose;
- source schema;
- target schema;
- dry-run mode;
- affected document estimate;
- batch size;
- resumability;
- verification report;
- rollback or compensating plan;
- audit output.

Migrations shall run through controlled scripts or administrative jobs.

# 10.33 Backup Requirements

Backups shall cover:

- Firestore operational data;
- Commerce Knowledge data;
- Rules data;
- Storage objects;
- configuration;
- index definitions;
- security rules;
- environment configuration references.

Knowledge and Rules exports shall be independently restorable.

# 10.34 Cost Control Requirements

Firestore cost shall be treated as an architectural concern.

The platform shall monitor:

- reads per active customer;
- reads per business dashboard;
- writes per Purchase Record lifecycle;
- Trust Event volume;
- projection rebuild cost;
- listener usage;
- unbounded query attempts.

Real-time listeners shall be used only where user value justifies their cost.

# 10.35 Data Quality Controls

The platform shall validate:

- required references;
- valid status transitions;
- non-negative quantities;
- valid country and currency codes;
- valid language codes;
- active Reward Program version;
- valid business membership;
- valid customer identity;
- duplicate idempotency keys.

Invalid records shall be rejected before authoritative storage.

# 10.36 Functional Requirements

## FR-DATA-001

Every major business concept shall have one authoritative collection and owning domain.

## FR-DATA-002

Critical operational writes shall be server-controlled.

## FR-DATA-003

Trust Events shall be append-only.

## FR-DATA-004

Verified Unit issuance shall be traceable to a verified Purchase Record.

## FR-DATA-005

Every Loyalty Cycle shall reference the applicable Reward Program version.

## FR-DATA-006

Derived progress values shall be reconcilable against authoritative unit records.

## FR-DATA-007

Every significant collection shall support pagination.

## FR-DATA-008

Firestore indexes shall be tracked in source control.

## FR-DATA-009

Data isolation shall be enforced by user, business and role.

## FR-DATA-010

Every authoritative document shall contain a schema version.

## FR-DATA-011

Historical commercial records shall not be silently deleted.

## FR-DATA-012

Customer-facing content shall support multilingual delivery.

## FR-DATA-013

All authoritative timestamps shall use server-generated UTC timestamps.

## FR-DATA-014

Sensitive workflows shall support idempotency.

## FR-DATA-015

Schema migrations shall be controlled, resumable and auditable.

# 10.37 Data Architecture Rules

| Rule ID | Rule                                                                     |
| ------- | ------------------------------------------------------------------------ |
| DA-001  | One domain shall own each authoritative collection.                      |
| DA-002  | No mutable counter shall be the sole evidence of loyalty progress.       |
| DA-003  | Verified Units shall always reference their originating Purchase Record. |
| DA-004  | Historical Reward Program terms shall remain versioned and reproducible. |
| DA-005  | Trust Events shall be append-only and server-generated.                  |
| DA-006  | Critical client-side direct writes are prohibited.                       |
| DA-007  | Denormalized values shall not replace authoritative domain data.         |
| DA-008  | All large collections shall use cursor-based pagination.                 |
| DA-009  | Production schema changes shall use formal migrations.                   |
| DA-010  | Country, currency, language and timezone shall remain configurable.      |
| DA-011  | Customer data shall remain isolated across businesses.                   |
| DA-012  | Archive states shall be preferred over deletion for commercial records.  |
| DA-013  | Derived reporting projections shall remain rebuildable.                  |
| DA-014  | Offline requests shall use stable idempotency identifiers.               |
| DA-015  | Monetary values shall not be stored as floating-point numbers.           |

# 10.38 Acceptance Criteria

This chapter is approved when:

- Every core collection has an identified owning domain.
- Authoritative records are distinguished from derived projections.
- Purchase, loyalty, reward and Trust data models are traceable end to end.
- Customer and business isolation rules are clear.
- Reward Program versioning preserves historical meaning.
- Firestore indexing and pagination principles are established.
- Offline idempotency requirements are documented.
- Multilingual, country, currency and timezone requirements are supported.
- Migration, retention, archival and backup principles are defined.
- The model supports future Verified Commerce modules without combining unrelated domain ownership.

# 10.39 Next Chapter

The next chapter should define:

# Cloud Functions, Domain Services and Event Processing

It will cover:

- callable and HTTP function boundaries;
- domain service responsibilities;
- command and event contracts;
- function naming;
- authentication and authorization;
- idempotency;
- transactional operations;
- retries;
- concurrency;
- event ordering;
- dead-letter handling;
- scheduled jobs;
- audit generation;
- validation;
- error contracts;
- observability;
- testing requirements.