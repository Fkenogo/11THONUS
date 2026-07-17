> **Title:** TRD Chapter 16 — PWA, Frontend Architecture and Offline Experience  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/16-frontend-and-pwa-architecture.md`  
> **Last controlled update:** 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

# 11thONUS

# Technical Requirements Document

## PART IX - Frontend and User Experience Architecture

# Chapter 16: Progressive Web Application, Frontend Architecture and Offline Experience

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-15

# 16.1 Purpose

This chapter defines how the 11thONUS frontend applications shall be structured, delivered and experienced across customer, business and platform-administration users.

It establishes:

- React and TypeScript architecture;
- domain-based frontend organization;
- customer, business and administration application shells;
- role-context switching;
- navigation;
- Firebase client boundaries;
- server-state and local-state management;
- Progressive Web Application behavior;
- installation;
- offline support;
- pending synchronization;
- QR display and scanning;
- responsive layouts;
- accessibility;
- localization;
- secure local storage;
- error handling;
- performance;
- testing;
- frontend observability.

The frontend shall remain a presentation and interaction layer.

It shall not become the authoritative owner of loyalty calculations, permissions, Purchase Record states, Reward Program rules or reward eligibility.

# 16.2 Frontend Objectives

The frontend architecture shall ensure that:

- Customers can use 11thONUS comfortably without installing a native application.
- Business staff can record purchases quickly on a mobile phone.
- Owners and managers can operate the platform on both mobile and desktop.
- One user can safely switch between personal and business contexts.
- Customer-facing language remains simple and non-technical.
- Critical business logic remains on trusted server services.
- Temporary connectivity loss does not automatically stop frontline purchase recording.
- Unsynchronized activity remains visible and controlled.
- English and French are fully supported for launch-critical journeys.
- Kirundi, Swahili and Kinyarwanda can be added without restructuring the frontend.
- Accessibility is built into components and workflows.
- The application remains performant on lower-cost smartphones and slower networks.

# 16.3 Frontend Technology Direction

The MVP frontend shall use:

- React;
- TypeScript;
- a mobile-first responsive component system;
- Firebase Web SDK;
- a supported routing library;
- an internationalization framework;
- PWA service-worker support;
- accessible form and interaction components.

Tailwind CSS may be used for styling, provided that:

- design tokens remain centralized;
- accessibility is not sacrificed;
- class usage does not replace reusable components;
- customer and business experiences remain visually consistent.

The final component library and build tooling shall be selected during implementation planning without changing the architecture defined here.

# 16.4 Application Surfaces

11thONUS shall expose three principal application surfaces.

## 16.4.1 Customer Application

Used by registered customers to:

- register;
- sign in;
- view their loyalty number;
- display their QR code;
- review purchases waiting for them;
- verify, reject or dispute purchases;
- track progress;
- view available rewards;
- view On Us Moments;
- manage profile and language;
- manage notification preferences.

## 16.4.2 Business Application

Used by:

- business owners;
- managers;
- staff members.

It shall support role-appropriate access to:

- customer lookup;
- QR scanning;
- Purchase Record creation;
- reward redemption;
- Reward Program management;
- staff management;
- review queues;
- reporting;
- subscription management;
- business settings.

## 16.4.3 Platform Administration Application

Used by authorized platform administrators for:

- business oversight;
- subscription operations;
- support;
- Trust and operational review;
- Knowledge Studio;
- Rules Studio;
- platform reporting;
- security administration;
- configuration.

The administration application shall have stricter security and access requirements than customer and business applications.

# 16.5 Application Shell Strategy

The three surfaces may be delivered from one frontend codebase with separate application shells, or as separately deployed applications sharing common packages.

Recommended logical structure:

Customer Shell  
Business Shell  
Administration Shell  
Shared Platform Packages

The final deployment choice shall consider:

- security boundaries;
- bundle size;
- development complexity;
- independent release cadence;
- shared component reuse;
- administration exposure.

The customer and business shells may share a deployment for the MVP if role isolation remains clear.

The administration shell should be capable of separate deployment.

# 16.6 Domain-Based Frontend Structure

The frontend codebase shall mirror the platform's business domains.

Recommended structure:

src/  
app/  
routing/  
providers/  
shells/  
bootstrap/  
<br/>domains/  
identity/  
businesses/  
commerceKnowledge/  
rules/  
rewardPrograms/  
purchases/  
loyalty/  
rewards/  
trust/  
notifications/  
reporting/  
search/  
subscriptions/  
administration/  
<br/>shared/  
components/  
forms/  
layout/  
hooks/  
i18n/  
errors/  
accessibility/  
storage/  
network/  
analytics/  
testing/  
<br/>infrastructure/  
firebase/  
api/  
pwa/  
monitoring/

A domain may contain:

components/  
pages/  
hooks/  
queries/  
commands/  
schemas/  
mappers/  
types/  
tests/

Critical domain logic shall not be duplicated across pages.

# 16.7 Separation of Concerns

The frontend shall distinguish among:

## Presentation Components

Responsible for:

- layout;
- labels;
- icons;
- visual states;
- accessible interaction.

## Feature Components

Responsible for:

- combining presentation components;
- coordinating one user workflow;
- consuming domain hooks.

## Domain Hooks and Services

Responsible for:

- calling server APIs;
- transforming responses;
- managing server-state behavior;
- exposing safe frontend contracts.

## Infrastructure Clients

Responsible for:

- Firebase Authentication;
- callable function invocation;
- Firestore permitted reads;
- Storage uploads;
- Analytics;
- App Check;
- PWA and network utilities.

UI components shall not call Firebase services directly unless they are explicit infrastructure-bound components.

# 16.8 Firebase Client Boundary

The Firebase client layer shall be centralized.

Recommended responsibilities include:

- SDK initialization;
- environment configuration;
- Authentication provider;
- App Check;
- callable functions client;
- permitted Firestore read repositories;
- Storage upload client;
- Analytics;
- Performance Monitoring;
- Cloud Messaging.

The frontend shall not scatter Firebase initialization or raw SDK access throughout the application.

# 16.9 Server Commands

Sensitive user actions shall be performed through typed command wrappers.

Examples:

- recordPurchase;
- verifyPurchase;
- rejectPurchase;
- raisePurchaseDispute;
- redeemReward;
- createRewardProgram;
- inviteBusinessMember;
- changeSubscriptionPlan.

Each wrapper shall:

- validate the client payload;
- attach an idempotency key;
- attach correlation metadata;
- call the trusted server endpoint;
- translate platform errors;
- invalidate or refresh affected queries;
- expose stable loading and outcome states.

# 16.10 Direct Firestore Reads

The frontend may use direct Firestore reads only for data explicitly approved for client access.

Examples may include:

- the authenticated customer's own profile;
- the customer's own Purchase Records;
- customer progress projections;
- published businesses;
- published Reward Programs;
- permitted business operational projections;
- in-app notifications.

Direct reads shall:

- follow security rules;
- use bounded queries;
- include required ownership filters;
- use cursor pagination;
- avoid broad collection scans.

Authoritative writes remain server-controlled.

# 16.11 State Management Categories

Frontend state shall be separated into three categories.

## 16.11.1 Server State

Examples:

- Purchase Records;
- Reward Programs;
- customer progress;
- available rewards;
- business reports;
- notifications.

Server state should use a dedicated query and cache layer supporting:

- request deduplication;
- retries;
- invalidation;
- pagination;
- loading states;
- stale-state handling;
- offline cache where appropriate.

## 16.11.2 Application State

Examples:

- current role context;
- active business;
- navigation preferences;
- current language;
- temporary feature flags;
- connectivity state.

## 16.11.3 Form and Interaction State

Examples:

- selected product;
- entered quantity;
- onboarding step;
- dispute reason;
- draft description.

These categories shall not be stored in one global mutable state container without a clear need.

# 16.12 Role-Context Switching

Users with multiple contexts shall be able to switch explicitly.

Example:

Personal  
<br/>Bella Salon - Owner  
<br/>Joe's Coffee - Manager

The role-context switcher shall:

- display only active contexts;
- show the active context clearly;
- clear business-specific cached data when changing businesses;
- re-evaluate navigation permissions;
- validate context against the server;
- prevent stale role access after suspension;
- preserve the user's personal customer identity separately.

The frontend shall not treat role switching as authentication switching.

# 16.13 Context-Aware Navigation

Navigation shall change according to the active context.

## Customer Navigation

Suggested primary destinations:

- Home;
- Waiting for You;
- Progress;
- On Us;
- Profile.

## Staff Navigation

Suggested primary destinations:

- Record Purchase;
- Scan;
- Recent Activity;
- Rewards;
- Account.

## Manager and Owner Navigation

Suggested primary destinations:

- Dashboard;
- Purchases;
- Reward Programs;
- Customers;
- Team;
- Reports;
- Business Settings.

## Administration Navigation

Suggested areas:

- Platform Overview;
- Businesses;
- Customers;
- Trust Reviews;
- Subscriptions;
- Knowledge Studio;
- Rules Studio;
- Support;
- Configuration.

The interface shall not show inaccessible navigation options as disabled clutter unless the unavailable state provides useful upgrade or permission context.

# 16.14 Customer Home Experience

The customer home screen shall answer:

- What needs my attention?
- How close am I to my next On Us moment?
- What rewards are ready?
- What happened recently?

Recommended order:

- Waiting for You;
- available rewards;
- active progress cards;
- recent On Us Moments;
- recent activity.

Backend terminology shall not appear.

# 16.15 Business Home Experience

The business home screen shall answer:

- What requires attention?
- What happened today?
- Which customers are close to a reward?
- Are there operational problems?
- What is the subscription status?

Recommended cards include:

- Waiting for Customer Verification;
- Open Reviews;
- Today's Purchases;
- Today's On Us Moments;
- Customers Close to Reward;
- Outstanding Rewards;
- Staff Activity;
- Subscription Status.

# 16.16 Frontline Purchase Recording Workflow

Purchase recording shall be optimized for speed.

Recommended flow:

- Select or scan customer.
- Confirm customer identity.
- Select Reward Program.
- Enter quantity.
- Review.
- Submit.
- Show clear result.

The normal flow should require minimal typing.

The system should prioritize:

- recent Reward Programs;
- frequently used Reward Programs;
- category-based selection;
- large touch targets;
- numeric quantity controls;
- quick correction before submission.

# 16.17 Customer Lookup

Supported lookup methods may include:

- QR scan;
- loyalty number;
- phone lookup where permitted.

Customer confirmation shall show only minimum identifying information.

Example:

Mary K.  
Customer ending in 42

The interface shall not expose full KYC information.

A failed lookup shall not reveal whether sensitive account details exist.

# 16.18 QR Display

The customer shall be able to display a QR code prominently.

The QR view should include:

- customer display name;
- loyalty number;
- QR code;
- brightness-friendly display;
- optional copy button;
- clear statement that the code identifies the account.

The QR screen shall not include unrelated account details.

# 16.19 QR Scanning

The business application shall support camera-based scanning.

Requirements include:

- permission explanation;
- clear scan target;
- flashlight support where available;
- manual code fallback;
- error recovery;
- inaccessible-camera fallback;
- fast confirmation.

Camera permissions shall be requested only when scanning begins.

# 16.20 Progressive Web Application Requirements

The customer and business applications shall be installable as PWAs where supported.

PWA requirements include:

- valid web app manifest;
- application icons;
- standalone display mode;
- install prompt strategy;
- service worker;
- offline shell;
- secure HTTPS delivery;
- theme and background colors;
- update management.

Installation shall remain optional.

Users must be able to use the platform fully through the browser.

# 16.21 PWA Installation Experience

The platform shall not aggressively force installation.

Installation prompts should appear only when:

- the browser supports installation;
- the user has demonstrated repeat use;
- installation provides clear value;
- the prompt has not been recently dismissed.

Suggested customer copy:

Add 11thONUS to your phone for quicker access.

Suggested business copy:

Add 11thONUS to your home screen for faster purchase recording.

# 16.22 Service Worker Responsibilities

The service worker may manage:

- application shell caching;
- static assets;
- language files;
- selected public knowledge data;
- safe previously viewed content;
- update detection;
- background synchronization where supported.

The service worker shall not independently calculate loyalty progress or authorize commercial actions.

# 16.23 Offline Experience Principles

Offline support shall prioritize business continuity without weakening trust.

The platform shall distinguish clearly among:

- Online;
- Offline;
- Pending Sync;
- Sync Failed;
- Synced.

Users shall never be led to believe that unsynchronized activity has become authoritative.

# 16.24 Offline Business Capabilities

The business application may support offline:

- access to previously loaded Reward Programs;
- access to cached staff context;
- entry of a new Purchase Record draft;
- queueing of a Purchase Record for synchronization;
- viewing recently cached activity.

Offline purchase submission shall create a local pending item.

It shall not:

- become visible to the customer;
- create Verified Units;
- affect loyalty progress;
- unlock a reward;
- be treated as a completed server action.

# 16.25 Offline Customer Capabilities

Customers may access previously cached:

- loyalty number;
- QR code where safe;
- recent progress;
- recent On Us Moments;
- selected business information.

The customer shall not verify, reject or dispute a purchase while offline in the MVP.

The customer may prepare an action locally only if the UI clearly requires final online submission before completion.

# 16.26 Redemption Connectivity Rule

Reward redemption shall require an authoritative online validation in the MVP.

This protects against:

- duplicate redemption;
- stale availability;
- suspended businesses;
- reversed rewards;
- concurrent use.

A business without connectivity shall not be shown a false successful redemption.

The UI should provide a clear explanation and retry path.

# 16.27 Local Offline Queue

The offline queue shall store only the minimum information necessary to retry a command.

An offline Purchase Record draft may include:

- client request ID;
- idempotency key;
- business context;
- customer public reference;
- Reward Program ID and cached version;
- quantity;
- local timestamp;
- device session reference;
- retry count;
- current sync state.

The queue shall not store sensitive customer profile information unnecessarily.

# 16.28 Secure Local Storage

Local storage mechanisms may include:

- IndexedDB;
- browser storage;
- service-worker cache.

Sensitive tokens shall be managed by the Firebase SDK or secure supported mechanisms.

The application shall not store:

- passwords;
- OTP values;
- provider secrets;
- full KYC records;
- unrestricted administrative data;
- raw Trust Ledger payloads.

Business context caches shall be cleared on sign-out.

# 16.29 Synchronization Workflow

When connectivity returns:

- detect online state;
- validate active session;
- validate active business context;
- process queued items in creation order;
- submit each item with its original idempotency key;
- record server result;
- remove or archive successful queue items;
- mark failed items with a clear reason;
- notify the user of the outcome.

A failed item shall not block all later items unless ordering requires it.

# 16.30 Synchronization Conflicts

A queued Purchase Record may fail because:

- staff membership was suspended;
- business subscription expired;
- Reward Program was paused;
- customer reference became invalid;
- cached Reward Program version is no longer accepted;
- quantity violates a new rule;
- the request was already synchronized.

The UI shall present a simple operational message and preserve enough information for review.

# 16.31 Pending Sync Interface

Business users shall have a visible pending-sync area.

It should show:

- number of queued items;
- successful sync count;
- failed items;
- retry action;
- reason for failure;
- time first recorded.

The interface shall avoid technical terms such as "event outbox" or "idempotency conflict."

# 16.32 Connectivity Indicator

The business application should display a small, non-disruptive connectivity indicator.

Suggested states:

- Online;
- Offline;
- Syncing;
- Needs Attention.

The indicator shall not dominate the primary workflow.

# 16.33 PWA Update Management

When a new frontend version is available, the application shall:

- detect the update;
- avoid interrupting active forms;
- prompt the user at a safe moment;
- preserve unsaved or queued work where possible;
- reload cleanly after confirmation.

Critical security updates may require a forced update after a controlled grace period.

# 16.34 Responsive Design

The frontend shall be mobile-first.

Supported layout ranges shall include:

- small mobile;
- standard mobile;
- large mobile;
- tablet;
- desktop.

The customer and staff experiences shall remain fully usable on mobile.

Owner reporting and administration may use enhanced desktop layouts without making desktop mandatory for essential operations.

# 16.35 Touch and Input Standards

Interactive elements shall support:

- minimum accessible touch targets;
- adequate spacing;
- visible focus states;
- keyboard use;
- numeric keyboards for quantity and phone entry;
- autofill where appropriate;
- clear labels;
- inline validation.

Critical actions shall not depend on hover.

# 16.36 Form Standards

Forms shall:

- request only necessary information;
- support progressive disclosure;
- preserve safe drafts;
- validate close to the field;
- use clear error copy;
- avoid resetting after recoverable errors;
- indicate required versus optional fields;
- show progress for multi-step onboarding;
- support keyboard and screen readers.

# 16.37 Progressive KYC Experience

Customer registration shall remain lightweight.

Initial required information should be limited to what is necessary for:

- account creation;
- authentication;
- customer identity;
- language;
- legal consent.

Additional profile fields shall be requested later through value-led prompts.

Examples:

Add your birthday so we can help businesses celebrate with you.

Choose your interests to find rewards that matter to you.

Users shall be able to skip optional profile enrichment.

# 16.38 Business Onboarding Experience

Business onboarding shall use guided, progressive steps.

Recommended sequence:

- Business basics.
- Business category and type.
- Location.
- Subscription plan.
- First Reward Program.
- Team invitation.
- First Purchase Record.
- First customer verification.

The interface shall use searchable dropdowns and tags from the Commerce Knowledge Layer.

# 16.39 Searchable Classification Controls

Category controls shall support:

- localized labels;
- search;
- popular options;
- parent-child filtering;
- selection review;
- missing-option suggestion;
- accessible keyboard navigation;
- mobile-friendly selection.

The interface shall not present the entire taxonomy as one long dropdown.

# 16.40 Localization Architecture

The frontend shall use one centralized internationalization framework.

Requirements include:

- translation-key lookup;
- namespace loading;
- language switching;
- fallback handling;
- pluralization;
- localized dates;
- localized currency;
- localized number formatting;
- layout testing for longer French copy;
- lazy loading where appropriate.

Language choice shall persist across sessions.

# 16.41 Dynamic Business Content

Business-authored content may not be translated automatically at launch.

The UI shall:

- display the best available localized version;
- fall back to the business's primary content;
- avoid presenting mixed-language system copy where possible;
- distinguish platform text from business-authored text.

# 16.42 Customer-Facing Copy Rules

The frontend shall hide internal architecture terminology.

Customers shall not see:

- Purchase Verification Lifecycle;
- Customer-Verified Loyalty Engine;
- Reward Lifecycle Engine;
- Trust Ledger;
- Reward Token;
- state transition;
- event;
- immutable record.

Customers should see:

- Purchase;
- Waiting for You;
- Progress;
- Your Next One's On Us;
- Your On Us Moments;
- History.

# 16.43 Business-Facing Copy Rules

Business users may see operational terms such as:

- Reward Program;
- Purchase;
- Waiting for Customer Verification;
- Review;
- Reward Available;
- Redemption;
- Activity History.

Engineering terms remain hidden unless displayed in diagnostic administration tools.

# 16.44 Loading States

Every asynchronous interaction shall define:

- initial loading;
- background refresh;
- empty state;
- error state;
- retry state;
- success state.

The UI should use skeletons or inline progress where appropriate.

It shall not show indefinite spinners without explanation.

# 16.45 Empty States

Empty states shall explain:

- what the section is for;
- why it is empty;
- what the user can do next.

Example:

Nothing is waiting for you right now.

Example:

Create your first Reward Program to begin recording purchases.

# 16.46 Error Handling

Frontend errors shall use standardized platform error codes and localized message keys.

The interface shall distinguish among:

- field validation errors;
- permission errors;
- offline errors;
- retryable service errors;
- expired session;
- conflicting state;
- unexpected failure.

Raw stack traces or provider errors shall never appear.

# 16.47 Correlation and Support References

Unexpected server errors shall include a customer-safe support reference derived from the correlation ID.

Example:

Something went wrong. Please try again. Reference: 4H7K2.

This helps support investigate without exposing technical details.

# 16.48 Optimistic UI Policy

Optimistic updates may be used only where failure does not create misleading commercial state.

Suitable examples:

- marking an in-app notification as read;
- changing a low-risk preference;
- updating a local draft.

Optimistic updates shall not be used to falsely imply successful:

- customer verification;
- Reward Program activation;
- reward redemption;
- Purchase Record synchronization;
- subscription payment.

# 16.49 Accessibility Standard

The frontend shall target WCAG 2.1 AA or the current approved equivalent.

Requirements include:

- semantic HTML;
- keyboard navigation;
- visible focus;
- screen-reader labels;
- text alternatives;
- sufficient contrast;
- scalable text;
- no color-only meaning;
- accessible dialogs;
- proper error association;
- reduced-motion support;
- logical reading order.

# 16.50 Grandmother Test

Every customer journey shall be reviewed against the platform's Grandmother Test:

Can a first-time smartphone user understand what to do without training?

This review shall apply to:

- registration;
- customer code display;
- Purchase Record review;
- reward use;
- language selection;
- error recovery.

# 16.51 Performance Budget

The frontend shall define and enforce performance budgets.

Targets should include:

- small initial JavaScript bundle;
- lazy loading of business and administration modules;
- optimized images;
- cached translation files;
- limited third-party scripts;
- controlled real-time listeners;
- fast interaction readiness.

Suggested user targets:

- meaningful first view within 2 seconds on a typical 4G connection;
- usable core action within 3 seconds;
- Purchase Record submission response within 2 seconds under normal conditions;
- QR screen available quickly after authentication.

Targets shall be measured on representative lower-cost devices.

# 16.52 Code Splitting

Code shall be split by:

- application shell;
- role area;
- major domain;
- heavy reporting tools;
- administration modules;
- optional scanning or export libraries.

Customers shall not download administration code.

Staff shall not download advanced reporting code unless required.

# 16.53 Image and Media Optimization

Business logos and media shall use:

- responsive sizes;
- optimized formats;
- lazy loading;
- placeholders;
- upload compression where appropriate;
- storage access rules;
- fallback imagery.

The platform shall not require large images for core workflows.

# 16.54 Frontend Observability

The frontend shall report:

- uncaught errors;
- failed commands;
- route failures;
- sync failures;
- PWA installation events;
- service-worker update failures;
- slow interactions;
- QR permission failures;
- translation fallback warnings;
- authentication failures.

Logs shall avoid unnecessary personal data.

# 16.55 Analytics Events

Frontend analytics may track:

- registration start and completion;
- onboarding step completion;
- QR displayed;
- QR scan initiated;
- Purchase Record form started;
- Purchase Record submitted;
- pending purchase viewed;
- purchase verified;
- reward viewed;
- reward redemption screen opened;
- PWA installed;
- language changed.

Analytics does not replace authoritative domain data.

# 16.56 Feature Flags

Frontend feature availability may use governed feature flags.

Flags may control:

- pilot access;
- country rollout;
- language rollout;
- new navigation;
- experimental onboarding;
- future search;
- reporting modules.

Feature flags shall not be used to bypass server authorization.

# 16.57 Browser Support

The platform shall define a supported browser matrix based on target-market usage.

At minimum, the MVP should support current maintained versions of:

- Chrome on Android;
- Safari on iOS;
- Chrome on desktop;
- Safari on macOS;
- Edge.

Unsupported browsers shall receive a clear message rather than a broken experience.

# 16.58 Device and Camera Constraints

The QR workflow shall account for:

- low-resolution cameras;
- denied permissions;
- browsers without scanner support;
- poor lighting;
- older devices;
- slow focus;
- camera already in use.

Manual loyalty-number entry shall always remain available.

# 16.59 Secure Sign-Out

Sign-out shall:

- revoke or end the active frontend session;
- clear business-sensitive caches;
- clear queued data according to safe policy;
- preserve only non-sensitive public assets;
- return the user to a safe entry point.

On shared business devices, sign-out should be easy and prominent.

# 16.60 Shared Device Considerations

Some businesses may use one shared phone or tablet.

The platform shall support:

- individual staff sign-in;
- fast role handover;
- visible active staff identity;
- inactivity timeout;
- secure sign-out;
- no shared permanent staff account.

Future secure quick-switching may be evaluated without weakening attribution.

# 16.61 Session Timeout Experience

When a session expires:

- unsaved safe form data should be preserved temporarily;
- the user should be prompted to sign in again;
- the original action should resume only after authorization is revalidated;
- sensitive content should be hidden.

# 16.62 Customer Verification Batch Actions

The customer interface may support:

- Verify selected;
- Verify all visible;
- Reject individually;
- Dispute individually.

Batch verification shall clearly show:

- business;
- Reward Program;
- quantity;
- date.

The user shall not approve hidden items outside the visible reviewed set without an explicit rule and clear summary.

# 16.63 Partial Quantity Dispute Readiness

The MVP may initially require full verification or dispute of a multi-unit Purchase Record.

The frontend architecture shall support future partial quantity correction through the dispute workflow.

It shall not directly split authoritative records client-side.

# 16.64 Reward Redemption Experience

The customer-facing reward screen should show:

- business;
- reward description;
- Reward Program;
- clear availability;
- QR or loyalty number;
- simple instructions.

Customer-facing action wording may include:

Use My On Us Moment

The business interface may use:

Redeem Reward

The final server-confirmed success shall trigger the customer celebration.

# 16.65 Celebration Design

On Us Moment celebrations should be:

- brief;
- warm;
- accessible;
- not disruptive;
- motion-sensitive;
- shareable only in future if explicitly designed.

Celebration shall never delay the authoritative redemption response.

# 16.66 Frontend Testing Strategy

The frontend shall include:

## Unit Tests

For:

- formatters;
- mappers;
- validators;
- state reducers;
- localization helpers;
- offline queue logic.

## Component Tests

For:

- forms;
- role-context switcher;
- progress cards;
- pending-purchase cards;
- permission-sensitive controls;
- error states;
- language switching.

## Integration Tests

For:

- Firebase emulator interactions;
- authentication;
- command wrappers;
- server-error mapping;
- query invalidation;
- offline synchronization.

## End-to-End Tests

For:

- customer registration;
- business onboarding;
- staff invitation;
- Purchase Record creation;
- customer verification;
- reward availability;
- redemption;
- role switching;
- language switching;
- session expiry;
- offline queue and synchronization.

# 16.67 Accessibility Testing

Testing shall include:

- keyboard-only navigation;
- screen readers;
- focus order;
- form errors;
- dialog behavior;
- contrast;
- text zoom;
- reduced motion;
- mobile touch targets.

Automated tools shall supplement, not replace, manual accessibility review.

# 16.68 Localization Testing

Every critical user journey shall be tested in:

- English;
- French.

Tests shall cover:

- longer French labels;
- line wrapping;
- date formatting;
- currency formatting;
- plural forms;
- missing-key fallback;
- mixed business-authored content.

# 16.69 Offline Testing

Offline tests shall cover:

- application shell loading;
- cached QR access;
- offline Purchase Record queue;
- connection restoration;
- duplicate retries;
- suspended membership during offline period;
- paused Reward Program;
- failed synchronization;
- queued-item visibility;
- secure sign-out with pending data.

# 16.70 Frontend Security Testing

Tests shall cover:

- hidden controls not being treated as authorization;
- cross-business route access;
- stale role context;
- malicious deep links;
- unsafe business-generated text;
- local cache clearing;
- token expiration;
- direct Firestore write denial;
- QR and loyalty-number enumeration controls.

# 16.71 Frontend Functional Requirements

## FR-FE-001

The platform shall provide distinct customer, business and administration application shells.

## FR-FE-002

The frontend codebase shall follow domain-based organization.

## FR-FE-003

Critical business logic shall remain outside UI components.

## FR-FE-004

The Firebase client boundary shall be centralized.

## FR-FE-005

Sensitive actions shall use typed server-command wrappers.

## FR-FE-006

Users with multiple roles shall switch through explicit role contexts.

## FR-FE-007

The customer and staff experiences shall be fully usable on mobile devices.

## FR-FE-008

The customer and business applications shall support PWA installation where available.

## FR-FE-009

Browser use shall remain fully supported without installation.

## FR-FE-010

The business application shall support offline Purchase Record queueing.

## FR-FE-011

Unsynchronized Purchase Records shall not affect authoritative loyalty state.

## FR-FE-012

Customer verification and reward redemption shall require authoritative online confirmation in the MVP.

## FR-FE-013

Offline synchronization shall use stable idempotency keys.

## FR-FE-014

English and French shall be supported for all launch-critical frontend journeys.

## FR-FE-015

The frontend shall support future Kirundi, Swahili and Kinyarwanda translations without restructuring.

## FR-FE-016

Customer-facing copy shall use everyday language and hide backend terminology.

## FR-FE-017

The frontend shall target WCAG 2.1 AA or the current approved equivalent.

## FR-FE-018

All major asynchronous workflows shall provide loading, empty, success, error and retry states.

## FR-FE-019

The frontend shall support QR display and scanning with manual-code fallback.

## FR-FE-020

Frontend analytics shall remain separate from authoritative commercial reporting.

## FR-FE-021

Business-sensitive local data shall be cleared on secure sign-out.

## FR-FE-022

Code splitting shall prevent unnecessary role-specific bundles from loading.

## FR-FE-023

The frontend shall expose clear connectivity and pending-sync states.

## FR-FE-024

Feature flags shall not bypass server authorization.

## FR-FE-025

Critical customer and business workflows shall have end-to-end automated tests.

# 16.72 Frontend Architecture Rules

| Rule ID | Rule                                                                                    |
| ------- | --------------------------------------------------------------------------------------- |
| FA-001  | Screens are presentation surfaces, not owners of business logic.                        |
| FA-002  | Critical commercial actions require trusted server confirmation.                        |
| FA-003  | Hidden UI controls are not authorization controls.                                      |
| FA-004  | Customer, business and administration contexts shall remain clearly separated.          |
| FA-005  | Role-context changes shall invalidate unauthorized cached data.                         |
| FA-006  | PWA installation shall remain optional.                                                 |
| FA-007  | Offline activity shall never appear authoritative before synchronization.               |
| FA-008  | Reward redemption requires online validation in the MVP.                                |
| FA-009  | Customer-facing copy shall not expose engineering terminology.                          |
| FA-010  | English and French translations shall be complete for launch-critical journeys.         |
| FA-011  | Manual customer-code entry shall remain available when QR scanning fails.               |
| FA-012  | Local storage shall contain only the minimum data needed for the user experience.       |
| FA-013  | Optimistic UI shall not imply successful commercial actions before server confirmation. |
| FA-014  | Accessibility requirements apply to shared components and complete journeys.            |
| FA-015  | Frontend applications shall consume governed Commerce Knowledge and Rules services.     |
| FA-016  | Large or role-specific features shall load only when required.                          |
| FA-017  | Shared-device use shall retain individual staff accountability.                         |
| FA-018  | Offline queue processing shall be idempotent and visible to the user.                   |

# 16.73 Acceptance Criteria

This chapter is approved when:

- Customer, business and administration application boundaries are clear.
- The frontend codebase mirrors business domains.
- Server state, application state and form state are separated.
- Role-context switching preserves data isolation.
- Purchase recording is optimized for mobile frontline use.
- PWA installation and browser-based use are both supported.
- Offline purchase queueing preserves trust and does not update authoritative progress.
- Customer verification and redemption require online server confirmation in the MVP.
- QR scanning includes manual fallback.
- English and French localization requirements are explicit.
- Accessibility, performance, security and testing standards are defined.
- The frontend remains ready for future Verified Commerce experiences without embedding duplicate business logic.

# 16.74 Next Chapter

The next chapter should define:

# Subscription, Billing and Plan Enforcement Architecture

It will cover:

- business subscription plans;
- Reward Program limits;
- staff limits;
- branch limits;
- trial management;
- plan upgrades and downgrades;
- mobile-money billing;
- invoices and receipts;
- grace periods;
- past-due and suspension states;
- server-side entitlement checks;
- Rules Studio plan configuration;
- country and currency pricing;
- billing audit;
- retries;
- refunds;
- future regional payment expansion.