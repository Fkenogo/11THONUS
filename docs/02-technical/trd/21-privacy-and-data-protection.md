> **Title:** TRD Chapter 21 — Privacy, Data Protection, Retention and Compliance  
> **Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical  
> **Governing document:** 11thONUS Platform Constitution; PRD  
> **Source-of-truth path:** `docs/02-technical/trd/21-privacy-and-data-protection.md`  
> **Last controlled update:** 2026-08-07 (`DEC-PROD-012` Option D — §21.11 annotated: gender not collected at MVP; section governs only a future gender-collecting governed release). Previously: 2026-07-16 (Phase 2 — relocated and renamed; metadata block added)

**11thONUS**

**Technical Requirements Document**

**PART XIV - Privacy and Compliance**

**Chapter 21: Privacy, Data Protection, Retention and Compliance Architecture**

**Version:** 1.0  
**Status:** Draft for approval  
**Governed by:** 11thONUS Platform Constitution  
**Depends on:** TRD Chapters 1-20

**21.1 Purpose**

This chapter defines how 11thONUS shall collect, use, protect, retain, share and dispose of personal and business data.

It establishes:

- privacy principles;
- data classification;
- lawful and permitted processing;
- purpose limitation;
- data minimization;
- consent;
- progressive customer profiling;
- sensitive personal data;
- customer rights;
- access and correction;
- account closure;
- deletion and anonymization;
- data retention;
- children and family data;
- location data;
- profiling and personalization;
- direct marketing;
- subprocessors;
- cross-border storage and transfer;
- privacy impact assessments;
- breach response;
- country-specific compliance readiness.

This chapter defines technical and operational controls.

It does not replace country-specific legal advice.

Before activating 11thONUS in any country, the platform shall complete a documented legal and regulatory readiness review for that jurisdiction.

**21.2 Privacy Objectives**

The privacy architecture shall ensure that:

- Personal data is collected only for defined purposes.
- Registration remains lightweight.
- Optional profile information is collected progressively.
- Customers understand why information is requested.
- Businesses receive only the customer information required for their relationship.
- Customer activity at one business is not exposed to another.
- Marketing and personalization remain consent-aware.
- Sensitive data receives stronger protection.
- Customer rights can be fulfilled without unsafe manual database edits.
- Account closure does not silently destroy records required for trust, disputes or legal compliance.
- Retention periods are defined and technically enforceable.
- Cross-border storage and processing are reviewed before country launch.
- Privacy incidents can be detected, contained, investigated and reported.
- New features are reviewed for privacy impact before release.

**21.3 Privacy Principles**

**PDP-001 - Purpose Limitation**

Personal data shall be collected and processed only for documented purposes.

A field collected for account recovery shall not automatically be reused for advertising.

**PDP-002 - Data Minimization**

The platform shall collect only the information needed for the relevant purpose.

Optional future value does not by itself justify mandatory collection today.

**PDP-003 - Progressive Profiling**

Additional profile information shall be requested over time when a clear benefit exists.

**PDP-004 - Transparency**

Customers shall receive understandable information about:

- what is collected;
- why it is collected;
- who may access it;
- how long it is retained;
- what choices they have.

**PDP-005 - Customer Control**

Customers shall be able to manage optional profile data, communication preferences and consent choices.

**PDP-006 - Privacy by Default**

The most privacy-protective reasonable setting shall apply until the customer chooses otherwise.

**PDP-007 - Business Data Isolation**

A participating business shall access only customer information necessary for its own relationship with that customer.

**PDP-008 - Security Proportional to Sensitivity**

More sensitive data shall receive stricter access, logging, retention and disclosure controls.

**PDP-009 - Accountability**

11thONUS shall be able to explain:

- what data it holds;
- why it holds it;
- who accessed it;
- which systems received it;
- which rule authorized the processing.

**PDP-010 - No Hidden Expansion of Purpose**

Materially new uses of personal data shall require review, updated notice and consent where required.

**21.4 Data-Protection Roles**

The platform shall identify the applicable role for each processing activity.

Possible roles include:

**Data Controller**

Determines why and how personal data is processed.

11thONUS may act as controller for:

- platform accounts;
- authentication;
- customer identity;
- platform communications;
- security;
- customer verification;
- platform analytics;
- progressive profiling.

**Data Processor**

Processes personal data on behalf of another controller under documented instructions.

This role may apply to selected enterprise or partner arrangements.

**Joint or Independent Controller**

May arise where 11thONUS and a business independently determine parts of the processing.

The applicable relationship shall be documented rather than assumed.

**Subprocessor**

An external provider processing data for 11thONUS.

Examples may include:

- cloud hosting;
- SMS;
- email;
- authentication;
- support tools;
- analytics;
- payment providers.

**21.5 Processing Register**

11thONUS shall maintain a processing-activity register.

Each processing activity shall record:

- activity ID;
- purpose;
- data subjects;
- data categories;
- controller or processor role;
- permitted or lawful basis;
- systems used;
- recipients;
- subprocessors;
- countries involved;
- retention period;
- security controls;
- customer rights;
- responsible owner;
- privacy-impact status;
- review date.

No material production processing activity shall exist without an entry in this register.

**21.6 Personal Data Classification**

Data shall be classified into governed categories.

**Class 1 - Public or Published Data**

Examples:

- published business name;
- business category;
- business address;
- public Reward Programs;
- approved business tags.

**Class 2 - Internal Operational Data**

Examples:

- non-public configuration;
- system status;
- workflow metadata;
- internal support references.

**Class 3 - Personal Data**

Examples:

- name;
- phone number;
- email;
- loyalty number;
- customer activity;
- language;
- notification preferences.

**Class 4 - Sensitive or Higher-Risk Personal Data**

Examples may include:

- precise location;
- authentication recovery evidence;
- identity documents;
- family or children's data;
- financial information;
- biometric information;
- health-related information;
- protected demographic information where applicable.

**Class 5 - Secrets and Security Credentials**

Examples:

- API keys;
- provider secrets;
- tokens;
- signing keys;
- administrator recovery credentials.

Each class shall have defined rules for:

- access;
- encryption;
- logging;
- retention;
- sharing;
- export;
- deletion.

**21.7 Customer Registration Data**

Initial customer registration should collect only:

- first name;
- last name;
- mobile number or approved authentication identifier;
- country;
- preferred language;
- Terms acceptance;
- Privacy Policy acknowledgement or consent where applicable.

Information not required to establish and operate the customer account shall not block registration.

**21.8 Progressive Customer Profile**

Optional profile enrichment may include:

- date of birth;
- ~~gender;~~ gender **[not collected at MVP — `DEC-PROD-012` Option D, 2026-08-07; see §21.11 and TRD10 §10.6.2]**
- city;
- interests;
- preferred categories;
- communication preferences;
- favorite businesses;
- optional profile image.

Each optional field shall have:

- a defined purpose;
- a user-facing explanation;
- an access classification;
- a retention rule;
- a deletion or correction workflow;
- a decision on whether explicit consent is required.

**21.9 Profile Completion**

Profile completion percentages shall not pressure customers into providing unnecessary data.

The platform shall distinguish between:

- required account information;
- recommended information;
- optional information.

A customer with incomplete optional information shall retain access to core loyalty functionality.

**21.10 Birthday Information**

Date of birth may support:

- birthday greetings;
- birthday rewards;
- age-appropriate experiences;
- eligibility checks where legally necessary.

It shall not automatically authorize:

- age-based advertising;
- disclosure of birthday to businesses;
- public birthday display;
- unrelated profiling.

Businesses should normally receive campaign eligibility or governed targeting capability rather than the customer's full birth date.

**21.11 Gender Information**

> **Governance note (`DEC-PROD-012`, Option D — 2026-08-07):** Gender is **not collected at MVP** — the `gender` attribute is removed from the MVP Customer Profile schema (see [TRD10 §10.6.2](10-firestore-data-architecture.md) and the [Decision Register `DEC-PROD-012`](../../00-governance/decisions/decision-register.md)). The requirements in this section therefore govern **only a future governed release** that proposes collecting gender information; such a release requires a separate governed decision and the legal/cultural input covered by `EXT-LEG-001`. The requirements below are retained unchanged for that future scenario.

Gender shall be optional unless a specific lawful and necessary use is approved.

Where collected:

- customers may select an approved value;
- customers may choose not to disclose;
- businesses shall not receive unrestricted gender information;
- profiling or targeting use shall be documented;
- discriminatory use is prohibited.

**21.12 Interest Information**

Customer interests shall map to governed Commerce Knowledge references.

Interest data may support:

- search;
- discovery;
- relevant recommendations;
- optional marketing;
- future personalization.

Interest-based marketing shall respect consent and preference settings.

Interest data shall not be treated as verified facts about the customer's identity.

**21.13 Inferred and Behavioral Data**

Future analytical systems may infer attributes such as:

- frequent visitor;
- coffee enthusiast;
- weekend customer;
- preferred category;
- inactive customer.

Every inferred attribute shall have:

- derivation rule;
- version;
- purpose;
- refresh or expiry policy;
- sensitivity classification;
- visibility policy;
- consent assessment;
- correction or objection process where required.

Behavioral labels shall not be exposed as definitive personal characteristics.

**21.14 Sensitive Profiling Prohibition**

The platform shall not infer or target customers based on sensitive characteristics unless:

- the use is legally permitted;
- the purpose is necessary and documented;
- required consent or authorization exists;
- a privacy impact assessment is approved;
- stronger security controls are in place.

Sensitive profiling shall not be introduced as an ordinary marketing feature.

**21.15 Customer Loyalty Number**

The loyalty number is a public-facing platform identifier.

It shall not contain or reveal:

- phone number;
- date of birth;
- country of registration;
- customer sequence;
- authentication credentials;
- predictable personal information.

Possession of the loyalty number does not authorize account access.

**21.16 QR Privacy**

The customer QR code shall contain only:

- an opaque customer reference; or
- a signed lookup value.

It shall not contain embedded personal profile details.

Businesses scanning the code shall receive only the minimum identity confirmation needed to create or redeem a valid platform record.

**21.17 Business Access to Customer Data**

A business may access only information required to:

- identify the correct loyalty account;
- record a Purchase Record;
- review activity involving that business;
- redeem an available reward;
- resolve a dispute;
- communicate where permitted.

A business shall not access:

- activity with other businesses;
- unrelated interests;
- full date of birth;
- authentication data;
- recovery information;
- other private profile fields without an approved purpose.

**21.18 Minimum Customer Confirmation**

Customer lookup should display a minimized confirmation view.

Example:

- preferred display name;
- customer reference ending;
- optional profile image where permitted;
- partially masked phone number where necessary.

The platform shall avoid exposing complete contact information during ordinary lookup.

**21.19 Staff Access**

Staff access to customer information shall be limited by:

- active business membership;
- permission;
- business context;
- operational purpose;
- session;
- rate limits.

Customer lookup and profile access shall be logged where required for operational integrity or privacy monitoring.

**21.20 Customer Verification Privacy**

A customer's verification, rejection or dispute is visible to the relevant business only to the extent required to resolve the Purchase Record.

The business shall not receive unrelated account activity or behavioral profiles through the verification workflow.

**21.21 Consent Architecture**

Consent shall be granular.

The platform shall distinguish among:

- Terms acceptance;
- Privacy Policy acknowledgement;
- optional marketing consent;
- personalization consent;
- precise-location permission;
- future partner-data sharing;
- future wallet or financial-service consent;
- optional research or analytics consent where needed.

One broad checkbox shall not be used to authorize unrelated purposes.

**21.22 Consent Record**

A consent record shall include:

type ConsentRecord = {

id: string;

userId: string;

consentType: string;

purposeVersion: string;

noticeVersion: string;

status: "granted" | "withdrawn" | "expired";

collectionMethod: string;

languageCode: string;

grantedAt?: Timestamp;

withdrawnAt?: Timestamp;

source: string;

schemaVersion: number;

};

Consent history shall be append-only or historically versioned.

**21.23 Consent Withdrawal**

Customers shall be able to withdraw optional consent as easily as it was granted.

Withdrawal shall:

- take effect within the applicable processing systems;
- stop future optional processing;
- update communication preferences;
- preserve proof of prior consent where required;
- not invalidate processing already lawfully completed;
- generate an audit record.

Core service processing may continue where another valid basis applies.

**21.24 Transactional Communications**

Messages necessary to:

- authenticate;
- secure the account;
- request purchase review;
- confirm reward availability;
- confirm redemption;
- operate subscriptions;
- communicate critical service information;

shall be treated separately from marketing.

Customers shall not be required to accept promotional communication to use core loyalty services.

**21.25 Marketing Consent**

Marketing consent shall be:

- optional;
- clearly described;
- channel-aware where required;
- revocable;
- recorded;
- separated from service acceptance.

The platform shall not interpret ordinary service use as blanket consent to marketing from every participating business.

**21.26 Business Marketing Access**

Businesses shall not receive bulk customer contact lists merely because customers participated in Reward Programs.

Future business campaign tools should normally:

- apply governed audience criteria;
- respect consent;
- send through the platform;
- limit data disclosure;
- record campaign purpose;
- provide opt-out controls.

**21.27 Customer Rights Service**

The platform shall support governed workflows for customer rights requests.

Potential rights may include:

- information about processing;
- access;
- correction;
- deletion;
- restriction;
- objection;
- withdrawal of consent;
- portability;
- complaint;
- review of automated decisions.

The exact rights and response periods shall be configured according to applicable law.

**21.28 Rights Request Record**

type DataRightsRequest = {

id: string;

userId: string;

requestType:

| "access"

| "correction"

| "deletion"

| "restriction"

| "objection"

| "portability"

| "consent_withdrawal"

| "other";

countryCode: string;

status:

| "received"

| "identity_verification"

| "in_review"

| "partially_completed"

| "completed"

| "refused";

submittedAt: Timestamp;

dueAt?: Timestamp;

completedAt?: Timestamp;

refusalReasonCode?: string;

assignedTo?: string;

evidenceReferences?: string\[\];

schemaVersion: number;

};

**21.29 Rights Request Verification**

Before disclosing or deleting data, the platform shall verify that the requester is entitled to act for the account.

Verification shall be proportionate to the risk.

The platform shall not disclose personal data merely because a person knows the loyalty number.

**21.30 Customer Data Access Export**

A customer access export may include:

- profile information;
- communication preferences;
- consent history;
- Purchase Records;
- verification decisions;
- Loyalty Cycles;
- rewards;
- On Us Moments;
- support requests;
- approved account-security information.

The export shall exclude:

- security secrets;
- protected internal fraud methods;
- information identifying other persons unnecessarily;
- data prohibited from disclosure.

**21.31 Data Correction**

Customers shall be able to correct appropriate profile information.

Historical commercial records shall not be rewritten merely because profile information changes.

For example:

- changing a customer's name updates the current profile;
- completed Purchase Records retain appropriate historical references or snapshots.

Corrections to commercial records follow the Purchase Verification and Trust governance processes.

**21.32 Account Closure**

Account closure shall:

- authenticate the requester;
- explain the effect;
- stop new account activity;
- revoke active sessions;
- retain data required for disputes, security, accounting or legal obligations;
- delete or anonymize eligible optional data;
- record the closure;
- communicate completion.

Closure is not automatically equivalent to immediate full deletion.

**21.33 Deletion Architecture**

Deletion shall use governed server workflows.

Possible outcomes include:

- hard deletion;
- field deletion;
- anonymization;
- pseudonymization;
- restriction;
- archival;
- retention until an obligation expires.

The appropriate outcome depends on:

- data category;
- legal requirement;
- Trust history;
- dispute status;
- subscription or billing obligations;
- fraud and security needs;
- country policy.

**21.34 Anonymization**

Anonymization shall remove the reasonable ability to reconnect data to an identifiable person.

Replacing a name with a customer ID is not necessarily anonymization.

Approved anonymization may require removal or transformation of:

- direct identifiers;
- contact details;
- device references;
- precise locations;
- free-text notes;
- rare combinations of attributes;
- linkable external references.

**21.35 Pseudonymization**

Pseudonymized data remains personal data where re-identification is possible.

Pseudonymization may be used for:

- analytics;
- testing;
- operational investigations;
- research;
- reporting.

Re-identification keys shall be separately protected.

**21.36 Retention Schedule**

11thONUS shall maintain a formal Data Retention Schedule.

Each data category shall define:

- purpose;
- trigger date;
- retention period;
- archive period;
- disposal action;
- legal hold behavior;
- responsible domain;
- review frequency.

Retention periods shall not exist only in policy text.

They shall be enforceable through scheduled platform processes.

**21.37 Suggested Retention Classes**

**Retention Class A - Commercial and Trust History**

Examples:

- verified Purchase Records;
- Verified Units;
- Loyalty Cycles;
- rewards;
- redemptions;
- Trust Events;
- role and ownership history.

Retention shall reflect dispute, legal, audit and business requirements.

**Retention Class B - Billing and Subscription Records**

Examples:

- invoices;
- receipts;
- confirmed payments;
- refunds;
- plan-change history.

Retention shall follow financial and tax requirements.

**Retention Class C - Security and Access Records**

Examples:

- security logs;
- session history;
- recovery evidence;
- administrator access.

Retention depends on security value and legal constraints.

**Retention Class D - Communications**

Examples:

- notification intents;
- delivery logs;
- marketing consent;
- campaign records.

Retention varies by message type.

**Retention Class E - Optional Profile Data**

Examples:

- interests;
- profile image;
- birthday;
- optional demographic information.

Eligible information should be removed or anonymized when no longer needed.

**Retention Class F - Temporary and Derived Data**

Examples:

- caches;
- export files;
- temporary upload objects;
- expired deep links;
- rebuildable search indexes.

These should have shorter automated retention.

**21.38 Retention Job Architecture**

Scheduled retention jobs shall:

- identify eligible records;
- check legal hold or active dispute;
- apply the approved disposal method;
- record counts and failures;
- preserve audit evidence;
- support dry-run mode;
- support resumability;
- generate a completion report.

Retention processing shall not depend on manual Firebase Console deletion.

**21.39 Legal Hold**

A legal hold or investigation hold shall temporarily suspend normal deletion for relevant records.

A hold shall include:

- scope;
- reason;
- authority;
- start date;
- review date;
- owner;
- release decision.

Legal holds shall be restricted and audited.

**21.40 Children and Minors**

The platform shall define a country-specific minimum age and minor-account policy before launch.

Until that policy is approved:

- the MVP should not deliberately target children as independent account holders;
- date of birth should not be used to build child profiles automatically;
- businesses should not receive children's personal details through family activity;
- parental or guardian requirements shall be determined legally per country.

**21.41 Family Use of Loyalty Numbers**

Friends or family may quote a registered customer's loyalty number where the Reward Program permits.

This does not create an account or profile for the friend or family member.

The platform shall avoid collecting their personal information unless they register independently or another approved purpose exists.

**21.42 Children's Purchases**

A parent may accumulate eligible units for products or services used by children.

The Purchase Record belongs to the registered customer account.

The platform should not require the children's names, birth dates or identity unless a future approved feature specifically requires them.

**21.43 Future Family Profiles**

A future family-profile feature shall require:

- a defined purpose;
- parental or guardian authority;
- country-specific age rules;
- child-data minimization;
- stronger defaults;
- limited visibility;
- privacy impact assessment;
- consent and deletion processes.

It shall not be enabled merely as an extension of ordinary progressive profiling.

**21.44 Location Data**

The platform shall distinguish among:

- business address;
- business coordinates;
- customer-selected city;
- approximate customer location;
- precise live customer location;
- Purchase Record device location.

Each use requires a documented purpose and access rule.

**21.45 Precise Customer Location**

Precise location shall:

- be requested only when needed;
- require device permission;
- have an alternative where practical;
- not be retained longer than necessary;
- not be exposed to businesses;
- not be reused for marketing without appropriate consent.

Manual location selection shall remain available for discovery where practical.

**21.46 Business Location**

Published business location may support search and discovery.

Businesses shall:

- control their published address details;
- verify location where required;
- understand which location fields become public.

Private owner or billing addresses shall remain separate from published business locations.

**21.47 Device and Technical Data**

The platform may collect limited technical data for:

- security;
- session management;
- performance;
- fraud review;
- synchronization;
- debugging.

Examples:

- application version;
- browser;
- device type;
- approximate network status;
- session ID;
- App Check status.

The platform shall avoid invasive device fingerprinting unless a documented security need justifies it.

**21.48 Analytics and Cookies**

The web application shall maintain a governed inventory of:

- essential storage;
- authentication storage;
- PWA caches;
- analytics tools;
- marketing technologies;
- third-party scripts.

Where consent is required, non-essential analytics or marketing technologies shall not activate before valid consent.

**21.49 Product Analytics**

Product analytics shall:

- collect only defined events;
- avoid unnecessary personal attributes;
- exclude sensitive KYC data;
- apply retention controls;
- respect consent where required;
- remain separate from authoritative commercial reporting.

**21.50 Personalization**

Future personalization may use:

- selected interests;
- language;
- city;
- prior interactions;
- active rewards;
- consented behavioral data.

Personalization shall not:

- modify Verified Units;
- alter reward eligibility;
- secretly disadvantage customers;
- use sensitive data without approval;
- prevent access to ordinary search.

**21.51 Automated Decisions**

Any future automated decision with material customer or business impact shall have:

- documented inputs;
- rule or model version;
- explainable outcome;
- human-review path;
- monitoring;
- bias and error assessment;
- privacy impact assessment.

AI recommendations shall not automatically:

- suspend accounts;
- cancel rewards;
- reject verified progress;
- approve refunds;
- deny service.

**21.52 Data Sharing**

Personal data may be shared only where:

- required to deliver the service;
- authorized by contract;
- permitted by law;
- covered by an approved purpose;
- protected by appropriate safeguards.

Every recurring data-sharing relationship shall be documented in the processing register.

**21.53 Subprocessor Register**

11thONUS shall maintain a subprocessor register containing:

- provider;
- service;
- data categories;
- processing purpose;
- hosting countries;
- contractual status;
- security review;
- transfer mechanism;
- effective date;
- exit process;
- owner.

Subprocessors shall not be added to production casually through developer convenience.

**21.54 Subprocessor Due Diligence**

Before onboarding a material subprocessor, the platform shall assess:

- security;
- privacy terms;
- breach obligations;
- data location;
- retention;
- deletion;
- subcontracting;
- audit rights;
- availability;
- exit and migration options;
- country compatibility.

**21.55 Provider Data Minimization**

An external provider shall receive only what it needs.

Examples:

- SMS provider: phone number and rendered message;
- email provider: email address and message;
- payment provider: billing and payment context;
- search provider: published business discovery data;
- analytics provider: approved event data.

No provider shall receive full customer history by default.

**21.56 Cross-Border Storage and Transfer**

Before storing or processing personal data outside the customer's country, 11thONUS shall determine:

- whether the transfer is permitted;
- whether authorization or registration is required;
- which contractual safeguards apply;
- where backups are stored;
- which subprocessors are involved;
- whether customers must be informed;
- whether a local copy or local representative is required.

Country launch approval shall include documented cross-border analysis.

**21.57 Data-Residency Configuration**

The architecture shall support country-level settings for:

- approved hosting region;
- permitted processing countries;
- prohibited providers;
- transfer approval status;
- required contractual safeguards;
- breach-reporting authority;
- retention rules.

These settings shall guide deployment and provider routing.

**21.58 Cross-Border Change Control**

A change in:

- Firebase region;
- provider location;
- backup region;
- analytics destination;
- support-tool hosting;
- messaging provider;

shall trigger privacy and compliance review before production activation.

**21.59 Privacy Impact Assessment**

A Privacy Impact Assessment shall be required for features involving:

- sensitive personal data;
- precise location;
- children;
- large-scale profiling;
- automated decisions;
- new cross-border processing;
- new identity verification;
- biometric data;
- wallet or financial services;
- partner data sharing;
- public customer discovery;
- high-risk AI.

**21.60 Privacy Impact Assessment Record**

A privacy assessment shall include:

- feature and purpose;
- personal data involved;
- users affected;
- permitted basis;
- necessity;
- alternatives considered;
- risks;
- mitigations;
- retention;
- access;
- processors;
- transfers;
- customer notice;
- consent;
- residual risk;
- approval.

No high-risk feature shall proceed without documented approval.

**21.61 Privacy Review in Development**

Every material implementation task shall assess:

- new data fields;
- changed purposes;
- new access;
- new providers;
- retention impact;
- export impact;
- logging impact;
- localization of notices;
- consent impact.

Privacy review shall be part of pull-request and release documentation where relevant.

**21.62 Privacy Notices**

The platform shall maintain:

- customer Privacy Policy;
- business Privacy Notice;
- cookie or tracking notice;
- marketing consent notice;
- optional feature notices;
- country-specific supplements where required.

Notices shall be:

- versioned;
- dated;
- available in required languages;
- written clearly;
- linked to consent or acknowledgement records.

**21.63 Notice Versioning**

User records shall retain the applicable notice versions accepted or acknowledged.

A material notice change may require:

- renewed acknowledgement;
- renewed consent;
- prominent communication;
- country-specific action.

Minor editorial changes need not automatically trigger new consent.

**21.64 Privacy Contact and Complaints**

The platform shall provide an accessible channel for:

- privacy questions;
- rights requests;
- complaints;
- consent withdrawal;
- breach concerns.

Complaints shall create governed support or privacy cases with response tracking.

**21.65 Data Protection Responsibility**

11thONUS shall assign formal responsibility for privacy governance.

Responsibilities include:

- processing register;
- rights requests;
- privacy assessments;
- subprocessor review;
- breach response;
- training;
- country compliance;
- retention review;
- policy updates.

A formal Data Protection Officer or local representative shall be appointed where legally required or operationally appropriate.

**21.66 Privacy Training**

Personnel with access to personal data shall receive training appropriate to their role.

Training areas include:

- data minimization;
- support access;
- customer rights;
- breach reporting;
- social engineering;
- administrator access;
- exports;
- children's data;
- marketing consent.

Training completion shall be recorded where required.

**21.67 Personal Data Breach**

A personal data breach may involve:

- unauthorized access;
- unauthorized disclosure;
- loss;
- alteration;
- destruction;
- ransomware;
- compromised credentials;
- misdirected export;
- exposed backup;
- insecure provider;
- accidental public access.

Suspected breaches shall enter the incident process immediately.

**21.68 Breach Response Workflow**

Detected or Reported

↓

Contain

↓

Preserve Evidence

↓

Assess Data and People Affected

↓

Assess Risk

↓

Notify Internal Privacy and Security Owners

↓

Notify Authority Where Required

↓

Notify Affected People Where Required

↓

Remediate

↓

Document and Review

Notification periods shall be governed by applicable country law.

**21.69 Breach Record**

Every confirmed or suspected breach shall record:

- incident ID;
- detection time;
- data involved;
- users affected;
- countries;
- cause;
- containment;
- risk assessment;
- authority-notification decision;
- user-notification decision;
- notification timestamps;
- remediation;
- post-incident actions.

The breach register shall be access-controlled.

**21.70 Breach Notification Readiness**

Before country launch, the platform shall document:

- competent authority;
- reporting channel;
- reporting deadline;
- required content;
- affected-person notification rules;
- local representative;
- internal approval path.

These details shall not be guessed during an incident.

**21.71 Law-Enforcement and Government Requests**

Requests for personal data shall be:

- received through an approved channel;
- verified for authority and scope;
- reviewed legally where appropriate;
- limited to required data;
- documented;
- fulfilled securely;
- retained in a request register.

The platform shall not provide unrestricted database access.

**21.72 Confidentiality Requests**

Where legally permitted, 11thONUS should seek to notify affected users of government requests unless prohibited.

Confidentiality restrictions shall be documented.

**21.73 Country Compliance Register**

The platform shall maintain one compliance profile per operating country.

Each profile shall include:

- applicable privacy laws;
- regulator;
- controller or processor registration;
- local representative requirement;
- data-residency rules;
- cross-border transfer requirements;
- rights and response periods;
- breach deadlines;
- children's age rules;
- marketing rules;
- cookie rules;
- financial-data requirements;
- retention obligations;
- effective date;
- legal reviewer;
- last review date.

**21.74 Burundi Launch Review**

Before launch in Burundi, the platform shall complete a formal legal review covering:

- applicable general and sector-specific privacy rules;
- electronic communications requirements;
- consumer-protection obligations;
- mobile-money and billing records;
- cross-border Firebase hosting;
- marketing consent;
- breach response;
- customer rights;
- retention.

Where the legal framework does not prescribe a specific control, 11thONUS shall still apply the Constitution's privacy and trust principles.

**21.75 Rwanda Launch Review**

Before activation in Rwanda, the platform shall verify current requirements concerning:

- controller and processor registration;
- storage outside Rwanda;
- transfers outside Rwanda;
- data-protection responsibility;
- breach reporting;
- customer rights;
- processor contracts;
- cross-border safeguards.

Country approval shall not rely on the Burundi configuration.

**21.76 Uganda Launch Review**

Before activation in Uganda, the platform shall verify current requirements concerning:

- controller or processor registration;
- applicable lawful processing conditions;
- data-subject rights;
- cross-border processing;
- security safeguards;
- direct marketing;
- breach obligations;
- children's information.

**21.77 Kenya Launch Review**

Before activation in Kenya, the platform shall verify current requirements concerning:

- registration obligations;
- data-controller and processor responsibilities;
- data-protection impact assessments;
- customer rights;
- direct marketing;
- children's data;
- cross-border transfers;
- breach reporting;
- appointment of privacy responsibility.

**21.78 Country Activation Gate**

A country shall not move from technical readiness to public launch until:

- compliance profile is complete;
- legal review is approved;
- required registrations are complete;
- data-transfer position is approved;
- privacy notices are localized;
- consent flows are configured;
- retention rules are active;
- rights-request process is operational;
- breach contacts are documented;
- subprocessors are approved;
- support staff are trained;
- launch approval is recorded.

**21.79 Compliance Configuration**

Country-specific compliance rules may be represented through governed configuration.

Examples:

- minimum account age;
- mandatory notice version;
- marketing default;
- rights-request deadline;
- breach deadline;
- approved hosting region;
- permitted subprocessors;
- retention periods;
- DPO contact;
- regulator contact.

Legal obligations shall not be reduced to configuration without human legal governance.

**21.80 Compliance Evidence**

The platform shall retain evidence including:

- registration certificates;
- processor agreements;
- privacy assessments;
- transfer approvals;
- subprocessor contracts;
- security reviews;
- training records;
- rights-request logs;
- breach records;
- retention reports;
- country launch approvals.

Evidence shall be securely stored and access-controlled.

**21.81 Privacy Monitoring**

The platform shall monitor:

- unusual personal-data access;
- bulk exports;
- failed authorization;
- customer lookup spikes;
- rights-request backlog;
- deletion-job failures;
- consent-processing failures;
- missing notice versions;
- unapproved subprocessors;
- cross-border configuration changes;
- sensitive-data logging;
- breach indicators.

**21.82 Privacy Audit**

Periodic privacy audits should review:

- data inventory;
- processing register;
- retention;
- consent;
- rights fulfillment;
- support access;
- administrator access;
- subprocessors;
- transfers;
- logging;
- training;
- country compliance.

Findings shall have owners and remediation dates.

**21.83 Privacy Testing**

Testing shall include:

**Data Access Tests**

- cross-customer denial;
- cross-business denial;
- support minimization;
- administrator scopes.

**Consent Tests**

- consent capture;
- withdrawal;
- marketing suppression;
- notice versioning.

**Rights Tests**

- access export;
- correction;
- closure;
- deletion or anonymization;
- identity verification.

**Retention Tests**

- dry run;
- legal hold;
- eligible disposal;
- failure recovery.

**Localization Tests**

- privacy notices;
- consent copy;
- rights forms;
- breach communications.

**Provider Tests**

- minimized payloads;
- deletion capability;
- location and transfer settings.

**21.84 Privacy Functional Requirements**

**FR-PRV-001**

Every personal-data processing activity shall have a documented purpose.

**FR-PRV-002**

The platform shall maintain a processing-activity register.

**FR-PRV-003**

Customer registration shall collect only required information.

**FR-PRV-004**

Optional profile information shall use progressive profiling.

**FR-PRV-005**

Businesses shall access only customer data necessary for their own relationship.

**FR-PRV-006**

Customer activity shall remain isolated across businesses.

**FR-PRV-007**

Consent shall be granular, versioned and withdrawable.

**FR-PRV-008**

Marketing consent shall remain separate from core service access.

**FR-PRV-009**

Customer rights requests shall use governed workflows.

**FR-PRV-010**

Account closure shall distinguish access termination from deletion.

**FR-PRV-011**

Deletion, anonymization and retention shall be applied according to data category.

**FR-PRV-012**

The platform shall maintain and technically enforce a Data Retention Schedule.

**FR-PRV-013**

Legal holds shall suspend relevant deletion.

**FR-PRV-014**

Children's or family-profile functionality shall require separate approval and privacy assessment.

**FR-PRV-015**

Precise location shall require purpose, permission and limited retention.

**FR-PRV-016**

Sensitive profiling shall not be introduced without formal approval.

**FR-PRV-017**

Subprocessors shall receive only the minimum data necessary.

**FR-PRV-018**

The platform shall maintain a subprocessor register.

**FR-PRV-019**

Cross-border storage and transfer shall be reviewed before country launch.

**FR-PRV-020**

High-risk features shall require a Privacy Impact Assessment.

**FR-PRV-021**

Privacy notices and consent records shall be versioned.

**FR-PRV-022**

The platform shall maintain a personal-data-breach workflow and register.

**FR-PRV-023**

Country-specific breach requirements shall be documented before launch.

**FR-PRV-024**

Every operating country shall have an approved compliance profile.

**FR-PRV-025**

Production activation in a country shall require completion of the compliance gate.

**FR-PRV-026**

Privacy-sensitive administrator and support access shall be logged.

**FR-PRV-027**

Automated decisions with material impact shall remain explainable and reviewable.

**FR-PRV-028**

Privacy and retention controls shall have automated and operational tests.

**21.85 Privacy Rules**

| **Rule ID** | **Rule**                                                                             |
| ----------- | ------------------------------------------------------------------------------------ |
| PR-001      | Personal data shall be collected for a defined purpose.                              |
| PR-002      | Optional future value does not justify mandatory collection today.                   |
| PR-003      | Core loyalty access shall not depend on optional progressive-profile fields.         |
| PR-004      | Businesses shall not receive customer activity from other businesses.                |
| PR-005      | Public customer identifiers shall reveal no sensitive information.                   |
| PR-006      | One consent shall not authorize unrelated purposes.                                  |
| PR-007      | Marketing consent shall be optional and revocable.                                   |
| PR-008      | Customer data exports shall exclude secrets and unrelated third-party data.          |
| PR-009      | Historical commercial integrity shall be preserved during account closure.           |
| PR-010      | Retention shall be governed by data category rather than indefinite default storage. |
| PR-011      | Pseudonymized data shall not be treated as anonymous automatically.                  |
| PR-012      | Children's data shall not be collected merely for future marketing possibilities.    |
| PR-013      | Precise location shall not be exposed to participating businesses.                   |
| PR-014      | AI and profiling shall not silently alter loyalty rights.                            |
| PR-015      | Providers shall receive only the data required for their service.                    |
| PR-016      | Cross-border processing shall not be activated without country review.               |
| PR-017      | High-risk processing requires a documented privacy assessment.                       |
| PR-018      | Breach response obligations shall be prepared before launch.                         |
| PR-019      | Legal and government requests shall not receive unrestricted platform access.        |
| PR-020      | Every country launch requires an approved compliance profile.                        |

**21.86 Acceptance Criteria**

This chapter is approved when:

- Privacy principles and data classifications are established.
- Registration and Progressive KYC are aligned with data minimization.
- Business access to customer information is narrowly defined.
- Consent, marketing and transactional processing are separated.
- Customer rights workflows are technically supported.
- Closure, deletion, anonymization, retention and legal holds are distinguished.
- Children, family, location, profiling and automated decisions receive stronger governance.
- Subprocessor and cross-border requirements are documented.
- Privacy assessments are required for high-risk features.
- Breach detection, investigation and notification readiness are established.
- Burundi, Rwanda, Uganda and Kenya each require a separate compliance profile.
- No country may launch without completing the legal and operational compliance gate.

**21.87 Next Chapter**

The next chapter should define:

**MVP Scope, Implementation Sequencing and Technical Delivery Plan**

It will cover:

- strict MVP boundaries;
- launch and deferred capabilities;
- implementation phases;
- technical dependencies;
- Firebase project setup;
- architecture foundations;
- customer and business journeys;
- Purchase Verification Lifecycle;
- loyalty and reward delivery;
- subscriptions;
- administration;
- testing;
- Burundi pilot;
- launch gates;
- post-MVP roadmap;
- coding-agent work packages.