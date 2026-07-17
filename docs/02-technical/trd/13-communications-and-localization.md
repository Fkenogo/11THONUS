> **Title:** TRD Chapter 13 — Notifications, Localization and Communication  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/13-communications-and-localization.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Technical Requirements Document

## PART VI - Communications and Localization

# Chapter 13: Notifications, Localization and Communication Architecture

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-12

# 13.1 Purpose

This chapter defines how 11thONUS shall manage customer-facing and business-facing communication across languages and delivery channels.

It establishes:

- supported languages;
- translation standards;
- customer-facing copy rules;
- notification intent and delivery;
- push, SMS, email and future WhatsApp integration;
- reminder schedules;
- quiet hours;
- customer preferences;
- transactional versus marketing communication;
- multilingual business-generated content;
- fallback language rules;
- notification retries;
- delivery tracking;
- accessibility;
- plain-language requirements;
- future campaign and experience management.

The architecture shall keep message meaning separate from delivery providers.

The platform determines **what must be communicated**.

The Integration Domain determines **how it is delivered**.

# 13.2 Communication Objectives

The communication architecture shall ensure that:

- Every important action is communicated clearly.
- Customers are not overwhelmed by unnecessary messages.
- Customer-facing language remains simple and non-technical.
- English and French are supported for launch-critical experiences.
- Kirundi, Swahili and Kinyarwanda can be added without schema or code redesign.
- User preferences are respected.
- Transactional communication remains reliable.
- Marketing communication requires appropriate consent.
- Every delivery attempt is traceable.
- Provider failures do not corrupt platform state.

# 13.3 Canonical Language Hierarchy

11thONUS shall maintain three distinct language layers.

## 13.3.1 Engineering Language

Used in:

- source code;
- APIs;
- events;
- logs;
- internal documentation;
- domain models.

Examples:

- Purchase Record;
- Verified Unit;
- Loyalty Cycle;
- Reward Lifecycle;
- Trust Event;
- notification intent.

Engineering language is English only.

## 13.3.2 Business Interface Language

Used in:

- business dashboards;
- owner and manager interfaces;
- operational reports;
- admin review screens.

Examples:

- Purchase;
- Waiting for Customer Verification;
- Reward Program;
- Reward Available;
- Activity History;
- Review Queue.

## 13.3.3 Customer Interface Language

Used in:

- customer PWA;
- notifications;
- emails;
- SMS;
- future WhatsApp messages.

Examples:

- Waiting for You;
- Progress;
- Your Next One's On Us;
- Your On Us Moments;
- History.

Technical terms such as "engine," "ledger," "token," "lifecycle," "state machine" and "immutable" shall not appear in customer-facing copy.

# 13.4 Launch Language Requirements

## Required at Launch

- English
- French

All launch-critical customer-facing content shall be complete in both languages.

## Architecture-Ready Languages

- Kirundi
- Swahili
- Kinyarwanda

The architecture shall support these languages from the beginning, even if complete translations are delivered after launch.

## Future Languages

The platform may add further languages without changing data contracts or UI architecture.

# 13.5 Translation Key Standard

Customer-facing and business-facing copy shall use translation keys.

Example:

{  
key: "customer.purchase.waiting.title",  
fallback: "You have a purchase waiting for you"  
}

Translation keys shall be:

- stable;
- descriptive;
- version-controlled;
- grouped by domain;
- independent of provider;
- independent of screen component.

Recommended key pattern:

&lt;audience&gt;.&lt;domain&gt;.&lt;context&gt;.&lt;element&gt;

Examples:

- customer.purchase.waiting.title
- customer.reward.available.body
- business.purchase.rejected.title
- business.subscription.expiring.body
- admin.review.assigned.title

# 13.6 Translation File Structure

A recommended structure is:

locales/  
en/  
common.json  
auth.json  
customer.json  
business.json  
notifications.json  
errors.json  
rewards.json  
purchases.json  
<br/>fr/  
common.json  
auth.json  
customer.json  
business.json  
notifications.json  
errors.json  
rewards.json  
purchases.json  
<br/>rn/  
sw/  
rw/

Language codes should use BCP 47-compatible identifiers.

Recommended codes:

- English: en
- French: fr
- Kirundi: rn
- Swahili: sw
- Kinyarwanda: rw

# 13.7 Fallback Language Logic

The platform shall resolve language in this order:

- User-selected language.
- User-profile preferred language.
- Business-supported language where the communication is business-specific.
- Country default language.
- English fallback.

Fallback behavior shall be deterministic.

A missing translation shall:

- fall back safely;
- generate an internal warning;
- never display the translation key directly to the user.

# 13.8 Translation Completeness

The release pipeline shall validate that all required English keys exist.

For launch-critical namespaces, the release pipeline shall also validate French completeness.

Missing required French translations shall block production release for affected customer-facing features.

Kirundi, Swahili and Kinyarwanda may initially allow English fallback until their required coverage level is approved.

# 13.9 Business-Generated Multilingual Content

Businesses may create custom content such as:

- business descriptions;
- Reward Program display names;
- reward descriptions;
- redemption instructions.

The MVP may require the business to provide one primary-language version.

The architecture shall support optional localized versions.

Example:

localizedContent: {  
en: {  
displayName: "Regular Coffee",  
rewardDescription: "Your next coffee is on us."  
},  
fr: {  
displayName: "Café régulier",  
rewardDescription: "Votre prochain café est offert."  
}  
}

Where a localized version is absent, the platform shall use the business's primary version.

The platform shall clearly distinguish between:

- platform-translated system content;
- business-authored custom content.

# 13.10 Translation Governance

Translations shall be governed through approved editorial processes.

Every translation should support:

- language code;
- translation key;
- translated text;
- status;
- reviewer;
- review date;
- source version;
- notes.

Suggested statuses:

- Draft
- Reviewed
- Approved
- Published
- Retired

Machine-assisted translation may support drafts but shall not automatically publish customer-facing content.

# 13.11 Plain-Language Standard

All customer-facing copy shall:

- use short sentences;
- avoid technical jargon;
- explain one action at a time;
- use familiar words;
- avoid legal or administrative language unless required;
- avoid excessive punctuation;
- clearly state what happens next.

Examples:

Instead of:

Purchase verification pending.

Use:

You have a purchase waiting for you.

Instead of:

Reward eligibility achieved.

Use:

Your next coffee is on us.

Instead of:

Transaction rejected.

Use:

You said this purchase was not correct.

# 13.12 Tone Standard

Customer communication should feel:

- warm;
- respectful;
- clear;
- appreciative;
- calm.

It should not feel:

- overly promotional;
- childish;
- technical;
- threatening;
- bureaucratic.

Business communication may be more operational but shall remain clear and non-technical.

# 13.13 Notification Architecture

The Notification Domain shall separate:

- Notification intent.
- Message rendering.
- Channel selection.
- Provider delivery.
- Delivery tracking.

Domain Event  
↓  
Notification Intent  
↓  
Template Resolution  
↓  
Language Resolution  
↓  
Preference and Channel Resolution  
↓  
Integration Domain  
↓  
Provider Delivery  
↓  
Delivery Result

# 13.14 Notification Intent

A notification intent represents the business need to communicate.

Example:

type NotificationIntent = {  
id: string;  
recipientUserId: string;  
businessId?: string;  
notificationType: string;  
templateKey: string;  
languageContext?: string;  
templateData: Record&lt;string, unknown&gt;;  
urgency: "immediate" | "normal" | "low";  
category: "transactional" | "operational" | "marketing";  
scheduledFor?: Timestamp;  
correlationId: string;  
createdAt: Timestamp;  
};

The intent shall not contain provider-specific fields.

# 13.15 Notification Categories

## 13.15.1 Transactional Notifications

Necessary to operate the platform.

Examples:

- OTP;
- Purchase Record waiting for customer review;
- purchase verified;
- dispute opened;
- reward available;
- reward redeemed;
- account security alert;
- subscription payment confirmation.

Transactional notifications do not require marketing consent.

## 13.15.2 Operational Notifications

Support business operations.

Examples:

- staff invitation;
- pending review reminder;
- subscription expiry warning;
- failed integration notice;
- business setup incomplete.

## 13.15.3 Marketing Notifications

Promotional or engagement-focused.

Examples:

- new business offer;
- birthday campaign;
- promotional reward;
- new nearby business;
- partner campaign.

Marketing notifications require appropriate user consent.

# 13.16 Notification Channels

The platform shall support:

## MVP

- in-app notifications;
- push notifications where supported;
- email;
- SMS where required.

## Future

- WhatsApp Business;
- additional messaging channels;
- regional messaging providers.

Channel availability shall depend on:

- country;
- user contact details;
- provider availability;
- consent;
- message category;
- business plan;
- Rules Studio configuration.

# 13.17 Channel Priority

A recommended default channel order is:

## Transactional

- In-app
- Push
- SMS for urgent messages
- Email

## Operational Business Communication

- In-app
- Email
- Push
- SMS where needed

## Marketing

- In-app
- Push
- Email
- WhatsApp or SMS only where consented

The final order shall be configurable through Rules Studio.

# 13.18 Customer Preferences

Customers shall be able to control:

- preferred language;
- push notifications;
- email notifications;
- SMS notifications where optional;
- future WhatsApp notifications;
- marketing consent;
- personalization consent.

Customers may not disable messages required for:

- security;
- authentication;
- legally required notices;
- critical service operation.

# 13.19 Business Preferences

Businesses may control:

- operational notifications;
- billing reminders;
- staff activity notifications;
- dispute alerts;
- reporting summaries;
- promotion-related messages.

Critical security and subscription notices may remain mandatory.

# 13.20 Quiet Hours

The platform shall support quiet hours.

Quiet hours may depend on:

- user preference;
- country default;
- business timezone;
- notification category;
- urgency.

Security and time-sensitive authentication notifications may bypass quiet hours.

Routine reminders should be delayed until the quiet period ends.

# 13.21 Reminder Architecture

Reminder schedules shall be governed through Rules Studio.

Examples:

- first purchase verification reminder after 24 hours;
- second reminder after 3 days;
- final reminder after 7 days;
- subscription expiry reminder 7 days before expiry;
- reward available reminder after 14 days.

The Notification Domain shall not hardcode timing rules.

# 13.22 Notification Templates

Templates shall define:

- translation key;
- audience;
- category;
- supported channels;
- required variables;
- fallback text;
- character limits;
- accessibility notes;
- active version.

Example:

type NotificationTemplate = {  
id: string;  
templateKey: string;  
audience: "customer" | "business" | "staff" | "admin";  
category: "transactional" | "operational" | "marketing";  
supportedChannels: string\[\];  
requiredVariables: string\[\];  
version: number;  
status: "draft" | "approved" | "active" | "retired";  
};

# 13.23 Template Variables

Templates may include controlled variables such as:

- customer display name;
- business name;
- Reward Program name;
- quantity;
- date;
- reward description;
- expiry date;
- support reference.

User-controlled free text shall not be inserted into messages without safe rendering and length controls.

# 13.24 Notification Examples

## Purchase Waiting for Customer Review

Customer:

You have a purchase waiting for you from Joe's Coffee.

Business:

A purchase is waiting for customer verification.

## Reward Available

Customer:

Your next coffee is on us. Show your code when you visit Joe's Coffee.

## Reward Redeemed

Customer:

This one was on us. Thanks for coming back.

## Purchase Rejected

Business:

A customer said a purchase was not correct. Please review it.

# 13.25 Delivery Tracking

Every notification delivery attempt shall record:

- notification ID;
- channel;
- provider;
- provider reference;
- status;
- attempt number;
- submitted time;
- delivered time;
- failed time;
- failure reason;
- retry eligibility.

Suggested statuses:

- Queued
- Submitted
- Delivered
- Failed
- Retrying
- Suppressed
- Cancelled

# 13.26 Retry Policy

Retry behavior shall depend on channel and failure type.

Retryable examples:

- provider timeout;
- temporary rate limit;
- temporary network failure.

Non-retryable examples:

- invalid phone number;
- unsubscribed email;
- permanently rejected address;
- missing required consent.

Retries shall be bounded and auditable.

# 13.27 Notification Deduplication

The platform shall prevent repeated delivery of the same notification intent.

Deduplication may use:

- notification type;
- recipient;
- aggregate ID;
- template version;
- time window;
- correlation ID.

Example:

A Purchase Record should not generate five identical "waiting for you" messages because the same event was processed repeatedly.

# 13.28 Notification Suppression

A notification may be suppressed where:

- the user has already completed the requested action;
- the message is no longer relevant;
- the user disabled the optional channel;
- the user withdrew marketing consent;
- a newer message replaces it;
- quiet-hour policy delays it;
- provider restrictions apply.

Suppression shall be recorded with a reason.

# 13.29 In-App Notification Center

The customer and business applications should provide an in-app notification center.

Notifications should support:

- read/unread state;
- category;
- deep link;
- date;
- business context;
- action status;
- archival.

The notification center shall not replace the underlying domain state.

For example, approving a purchase should occur through the Purchase Domain, not by modifying the notification.

# 13.30 Deep Links

Notifications should link users directly to the relevant action.

Examples:

- pending Purchase Record;
- available reward;
- open dispute;
- staff invitation;
- expiring subscription.

Deep links must validate authentication and authorization before showing protected content.

# 13.31 Accessibility Requirements

Communication shall support:

- readable text size;
- screen-reader-friendly labels;
- clear button text;
- sufficient contrast;
- text alternatives for icons;
- no meaning conveyed through color alone;
- concise messages;
- predictable navigation.

Push and email content should remain understandable without images.

# 13.32 SMS Standards

SMS messages shall:

- be concise;
- identify 11thONUS or the relevant business;
- avoid technical links where possible;
- use secure, time-limited links for protected actions;
- respect character limits;
- avoid exposing sensitive profile data.

OTP messages shall never include unrelated marketing content.

# 13.33 Email Standards

Emails shall support:

- responsive mobile layouts;
- plain-text fallback;
- accessible HTML;
- clear sender identity;
- localized subject and body;
- secure deep links;
- unsubscribe controls for marketing;
- no unsubscribe requirement for essential transactional messages where legally permitted.

# 13.34 Push Notification Standards

Push notifications shall:

- avoid exposing sensitive information on lock screens;
- use concise titles;
- open the correct application context;
- include a safe fallback if the target resource no longer exists;
- respect user preferences;
- avoid excessive repetition.

# 13.35 Future WhatsApp Standards

Future WhatsApp messaging shall:

- use approved templates where required by the provider;
- maintain language-specific template versions;
- separate transactional and marketing templates;
- comply with customer consent;
- record provider template IDs;
- track delivery and failure status;
- avoid moving core workflows entirely into WhatsApp unless security and identity controls remain intact.

# 13.36 Localization of Knowledge Content

Commerce Knowledge entries shall use the Commerce Knowledge translation model.

The UI shall resolve:

- industry names;
- business categories;
- business types;
- Reward Program categories;
- standard products;
- standard services;
- tags;

according to the user's current language.

Search shall support synonyms and local-language terms.

# 13.37 Localization of Dates, Numbers and Currency

The platform shall localize:

- dates;
- times;
- number separators;
- currency display;
- pluralization;
- phone numbers;
- addresses.

Authoritative values remain stored in normalized formats.

Presentation depends on locale.

# 13.38 Pluralization

Translations shall support proper plural forms.

Example:

- 1 purchase
- 2 purchases

The platform shall not build pluralization through string concatenation.

# 13.39 Right-to-Left Readiness

Although initial languages are left-to-right, the UI architecture should avoid assumptions that permanently block future right-to-left languages.

This is future readiness, not an MVP implementation requirement.

# 13.40 Error Localization

Server errors shall return:

- error code;
- message key;
- field error keys;
- correlation ID.

The client shall render localized copy.

Raw provider messages and stack traces shall not appear in the UI.

# 13.41 Translation Testing

Testing shall include:

- missing translation keys;
- fallback behavior;
- French layout expansion;
- long labels;
- pluralization;
- date and number formatting;
- deep links;
- notification rendering;
- mixed-language content;
- unsupported-language fallback.

French text expansion shall be considered during layout design.

# 13.42 Content Versioning

Notification templates and critical system copy shall be versioned.

A sent notification should remain traceable to:

- template key;
- template version;
- language;
- rendered content where retention policy permits.

This supports support investigations and regulatory review.

# 13.43 Consent Audit

Changes to communication preferences shall record:

- user;
- preference;
- old value;
- new value;
- timestamp;
- source;
- applicable consent version.

Marketing consent history shall remain auditable.

# 13.44 Communication Monitoring

The platform shall monitor:

- notification volume;
- delivery rate;
- failure rate;
- provider latency;
- duplicate suppression;
- unsubscribe rate;
- push token validity;
- SMS failure reasons;
- email bounce rate;
- language fallback rate;
- missing translation warnings.

# 13.45 Cost Controls

Communication costs shall be monitored by:

- country;
- channel;
- provider;
- notification type;
- business;
- campaign;
- subscription plan.

The platform should avoid using paid channels when an effective lower-cost channel is available and appropriate.

# 13.46 Experience Studio Readiness

The architecture shall support a future Experience Studio responsible for:

- notification templates;
- onboarding copy;
- email templates;
- empty states;
- help content;
- campaign copy;
- multilingual review;
- scheduled publication;
- versioning.

Experience Studio shall govern presentation and communication without changing core business rules.

# 13.47 Functional Requirements

## FR-COM-001

All customer-facing and business-facing copy shall use translation keys.

## FR-COM-002

English and French shall be supported for launch-critical customer experiences.

## FR-COM-003

The architecture shall support Kirundi, Swahili and Kinyarwanda without schema redesign.

## FR-COM-004

Customer-facing copy shall avoid technical platform terminology.

## FR-COM-005

Notification intent shall remain separate from provider delivery.

## FR-COM-006

Transactional, operational and marketing messages shall be categorized separately.

## FR-COM-007

Marketing communication shall respect customer consent.

## FR-COM-008

Notification timing shall resolve through Rules Studio where configurable.

## FR-COM-009

Every delivery attempt shall be traceable.

## FR-COM-010

Notification retries shall be bounded and idempotent.

## FR-COM-011

The platform shall support user language preferences and deterministic fallback.

## FR-COM-012

Business-generated content shall support optional localized variants.

## FR-COM-013

Errors shall be rendered through localized message keys.

## FR-COM-014

The platform shall support quiet hours and channel preferences.

## FR-COM-015

Notifications shall deep-link to the relevant authorized application action.

## FR-COM-016

The release process shall validate translation completeness.

## FR-COM-017

Communication preferences and consent changes shall be auditable.

## FR-COM-018

The architecture shall support future Experience Studio governance.

# 13.48 Communication Rules

| Rule ID | Rule                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------ |
| CR-001  | Customer-facing copy shall use simple everyday language.                                               |
| CR-002  | Engineering terminology shall not appear in customer UI or customer notifications.                     |
| CR-003  | English and French are required launch languages.                                                      |
| CR-004  | Translation keys shall be stable and version-controlled.                                               |
| CR-005  | Notification intent and delivery shall remain separate responsibilities.                               |
| CR-006  | Transactional communication shall not be treated as marketing.                                         |
| CR-007  | Marketing messages require appropriate consent.                                                        |
| CR-008  | Missing translations shall fall back safely and generate an internal warning.                          |
| CR-009  | Delivery retries shall not create duplicate user messages.                                             |
| CR-010  | User preferences shall be respected unless the message is essential for security or service operation. |
| CR-011  | Provider-specific message logic shall remain outside the Notification Domain.                          |
| CR-012  | Language selection shall be deterministic and auditable.                                               |
| CR-013  | Business-authored custom content shall remain distinguishable from platform-translated content.        |
| CR-014  | Notifications shall never expose unnecessary sensitive information.                                    |
| CR-015  | Critical translation gaps shall block production release.                                              |

# 13.49 Acceptance Criteria

This chapter is approved when:

- English and French launch requirements are explicit.
- Kirundi, Swahili and Kinyarwanda readiness is preserved.
- Engineering, business and customer vocabularies remain separated.
- Translation keys and file structures are standardized.
- Notification intent, rendering and provider delivery responsibilities are separated.
- Transactional, operational and marketing categories are defined.
- Consent, preferences, quiet hours and channel selection are documented.
- Delivery tracking, retries, suppression and deduplication are defined.
- Business-generated multilingual content is supported.
- Localization testing and release validation are required.
- Experience Studio can be introduced later without redesigning communication architecture.

# 13.50 Next Chapter

The next chapter should define:

# Search, Discovery and Commerce Knowledge Query Architecture

It will cover:

- business onboarding category selection;
- Reward Program classification;
- taxonomy traversal;
- multilingual search;
- synonyms;
- business tags;
- service and product filters;
- customer-interest matching;
- location-aware discovery;
- Firestore search limitations;
- external search service readiness;
- indexing;
- search ranking;
- moderation;
- search analytics;
- future marketplace and AI recommendation support.