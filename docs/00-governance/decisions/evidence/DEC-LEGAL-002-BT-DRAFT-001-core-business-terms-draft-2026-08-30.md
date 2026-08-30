> **Title:** Core Business Terms — Draft (Instrument Architecture + Part I + Part II)
> **Version:** 2.2 (2026-08-30 — Part II final Founder wording corrections applied, task `DEC-LEGAL-002-BT-DRAFT-002-CORR-002`) · **Status:** DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this document)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`
> **Date:** 2026-08-30 (v1.0) / 2026-08-30 (v1.1 correction) / 2026-08-30 (v2.0 — Part II) / 2026-08-30 (v2.1 — Part II PR-review correction) / 2026-08-30 (v2.2 — Part II final wording correction) · **Task:** `DEC-LEGAL-002-BT-DRAFT-001` (v1.0); `DEC-LEGAL-002-BT-DRAFT-001-CORR-001` (v1.1 — Founder-directed corrections to Part I; see [Correction Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-CORR-001-correction-report-2026-08-30.md)); `DEC-LEGAL-002-BT-DRAFT-002` (v2.0 — Part II, Business Participation, §§8–10; see [Drafting Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-drafting-report-2026-08-30.md)); `DEC-LEGAL-002-BT-DRAFT-002-CORR-001` (v2.1 — PR #204 review-finding corrections; see [Correction Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-CORR-001-correction-report-2026-08-30.md)); `DEC-LEGAL-002-BT-DRAFT-002-CORR-002` (v2.2 — Founder final wording corrections to Staff definition and §9.3/§9.6; see [Correction Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-CORR-002-correction-report-2026-08-30.md))
> **Authorities drafted from (Part I):** Founder FD-1–FD-7 ([Legal Counsel Handoff Pack](DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md) §3); `DEC-LOY-011` (Decision Register, CONFIRMED); LEG-FD-01–LEG-FD-15 ([Founder Legal Architecture Disposition Record v2.0](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md)); [Reconciliation Matrix](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md); [Terms Instrument Architecture & Drafting Readiness Note v2.0](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md); [Terms Content Architecture](DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md); [Legal Counsel Handoff Pack](DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md).
> **Additional authorities drafted from (Part II):** Founder FD-4 (platform suspension grounds: trust, security, integrity, compliance, participants) and FD-2/FD-3 (earned-reward survival, referenced not redrafted) ([Legal Counsel Handoff Pack](DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md) §3); LEG-FD-01 (fallback interpretive standard: transparency, fairness, proportionality) and LEG-FD-06 (suspension process; non-exhaustive platform-integrity grounds catalogue) ([Founder Legal Architecture Disposition Record v2.0](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md)); `ENG-P2-002-DESIGN-001` (Business Identity Architecture — Owner model, delegation principle); `ENG-P2-003-DESIGN-001` (Staff Membership & Identity Architecture — Owner/Manager/Staff role model, permission model, invitation architecture); `ENG-P2-004-DESIGN-001` (Role-Context & Permission-Resolution Architecture — Sensitive Permission Catalogue, override-resolution rule); `ENG-P3-002-DESIGN-001` (Business Onboarding Architecture — mandatory/optional/out-of-scope onboarding classification; ungoverned verification-mechanism boundary); Part I §1.3, §5, §7.5 of this same instrument (referenced, not redrafted).
> **Companion documents:** [Business Terms Drafting Traceability Matrix](DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md); [Controlled Inputs Register](DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md); [Part I Drafting Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md); [Part II Drafting Report](../../../05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-drafting-report-2026-08-30.md).

---

> # ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED
>
> This document is a **controlled drafting instrument**, not a Terms version. It has not been reviewed or approved by legal counsel beyond the already-filed external Legal Opinion, has not been approved by the Founder as final Terms content, has not been assigned a version identifier, and has not been written to `platformConfig/businessTerms` or any other configuration surface. `DEC-LEGAL-002` remains `OPEN_LEGAL`. Capability 3 remains blocked on governed Terms-content configuration. No Business can accept this document and no acceptance record may reference it. Every `[CONTROLLED INPUT REQUIRED: ...]` marker below is an explicit gap, not an oversight — see the companion Controlled Inputs Register. **Part II (§§8–10, added 2026-08-30) carries exactly the same status. Parts III–VIII remain headings/placeholders only.**

---

# 11thONUS Core Business Terms

## How to read this document

This document has three parts:

- **Part 0 — Complete Proposed Structure.** The full section architecture proposed for the eventual Core Business Terms, covering all subject areas identified as drafting-ready in the Terms Drafting Readiness Note. Sections not yet drafted appear as headings with a placeholder note only — no clause text.
- **Part I — Foundation, Relationship and Acceptance.** Drafted with full clause text in task `DEC-LEGAL-002-BT-DRAFT-001` (corrected `-CORR-001`).
- **Part II — Business Participation (§§8–10).** Drafted with full clause text in task `DEC-LEGAL-002-BT-DRAFT-002`. Parts III–VIII remain headings/placeholders only.

This instrument governs the relationship between 11thONUS and a participating Business only. It does not govern the relationship between 11thONUS and a Business's customers (a separate future Customer Terms/Platform Terms of Use instrument, not drafted here — see §0.0 Instrument Map), and it does not govern the content of any individual Business's own Reward Program (authored and controlled by that Business — see §0.0).

---

## Part 0 — Complete Proposed Structure

### 0.0 Instrument Map (Layer/Instrument Architecture)

Per the Terms Instrument Architecture (Terms Drafting Readiness Note §2, confirming LEG-FD-10), four related instruments exist or are contemplated:

| Instrument | Relationship governed | Status |
|---|---|---|
| **A. Core Business Terms** (this document) | 11thONUS ↔ participating Business | Drafting in progress — Part I (Founder-approved baseline) and Part II (draft, pending Founder review) drafted; Parts III–VIII not drafted |
| **B. Customer Terms / Platform Terms of Use** | 11thONUS ↔ customer, platform access/use | Separate future governed work package — not drafted here |
| **C. Business Reward Program Rules** | Business ↔ its own customers, programme mechanics | Authored per-Business; not a platform-wide instrument |
| **D. Jurisdictional Overlays** | Applied to instrument A, B, or C per jurisdiction | Burundi overlay is the anticipated first overlay; not drafted here |

This Core Business Terms document is **Layer 1** (portable global architecture) per the three-layer jurisdiction model (Readiness Note §1). It is designed to be supplemented, not redefined, by Layer 2 jurisdictional overlays and to leave Layer 3 (each Business's own Reward Program rules) untouched except where Layer 1/2 impose governed minimums.

### 0.1 Complete Proposed Section Architecture

The following is the proposed complete architecture for the Core Business Terms, covering every section identified in the Terms Drafting Readiness Note's section-by-section readiness table. Section numbering below is provisional and may be revised once all Parts are drafted; it is not a legal citation convention adopted for the final instrument.

**Part I — Foundation, Relationship and Acceptance** *(drafted in this task — see Part I below)*
1. Parties and Agreement
2. Definitions (Part I terms only)
3. Purpose and Scope
4. Platform Role
5. Independent Business Relationship (No Agency)
6. Business/Customer Relationship Boundary
7. Acceptance and Formation

**Part II — Business Participation** *(heading only — not drafted)*
8. Business Eligibility, Registration and Onboarding
9. Account Authority (Owners, Staff, Permissions)
10. Prohibited Conduct

**Part III — Programme Operation** *(heading only — not drafted)*
11. Reward Program Responsibility
12. Transaction Recording
13. Reward Obligations (Earning, Fulfilment, Survival of Earned Rewards)
14. Programme Changes

**Part IV — Platform Governance of the Relationship** *(heading only — not drafted)*
15. Suspension and Restriction
16. Business Exit and Termination; Outstanding Rewards
17. Complaints and Dispute Facilitation (Customer-Facing)

**Part V — Commercial Terms** *(heading only — not drafted)*
18. Subscription and Fees (structural framework only; no `DEC-SUB-*` values)

**Part VI — Risk Allocation** *(heading only — not drafted)*
19. Liability
20. Indemnity

**Part VII — Legal Mechanics** *(heading only — not drafted)*
21. Governing Law and Dispute Resolution (Business ↔ 11thONUS)
22. Changes to These Terms; Reacceptance
23. Data and Privacy (cross-reference only)
24. Notices
25. General Provisions (assignment, severability, entire agreement, force majeure, survival, language of the agreement)

**Part VIII — Jurisdictional Overlays** *(architecture only — not drafted)*
26. Jurisdictional Overlay Mechanism
27. [Overlay index — populated as overlays are drafted; Burundi overlay not drafted here]

### 0.2 Readiness Mapping — 17 of 17 Sections

The Terms Drafting Readiness Note (v2.0) states "16 of 16 sections ready to draft" in its §6 narrative conclusion. On independent verification (originally for `DEC-LEGAL-002-BT-DRAFT-001`, re-verified for the Founder correction pass `DEC-LEGAL-002-BT-DRAFT-001-CORR-001`), its own §3 table contains **seventeen** distinct section rows, every one of which is marked **Ready**. This is a counting/labelling error in that note's narrative text, not a substantive gap, not a contradiction between rows, and not a change to any readiness decision — no section was added, no additional Founder or legal position was created, and no row's Ready status changed. Per the Founder's correction disposition, this document (and its companion Traceability Matrix, Controlled Inputs Register, and Drafting Report) accordingly state the readiness conclusion as **17 of 17 sections ready to draft**. The Terms Drafting Readiness Note itself is a historical, dated evidence record and is left unedited, per the instruction not to overwrite historical evidence — its own narrative "16 of 16" wording remains for the Founder to correct at that note's next revision, if any. All seventeen rows are mapped below; none is omitted.

| # | Readiness-table section | Governing authority | Mapped to proposed section(s) | Drafted in this task? |
|---|---|---|---|---|
| 1 | Parties/relationship | LEG-FD-01 | §1 Parties and Agreement | **Yes** |
| 2 | Platform service | Legal Counsel Handoff Pack §2 | §4 Platform Role | **Yes** |
| 3 | Business eligibility | `ENG-P3-002` onboarding architecture | §8 Business Eligibility, Registration and Onboarding | **Yes** |
| 4 | Account authority | `ENG-P2-002`/`003` | §9 Account Authority | **Yes** |
| 5 | Reward Program responsibility | FD-5 | §11 Reward Program Responsibility; §6 Business/Customer Relationship Boundary (foundational statement only) | Foundational statement in §6 **yes**; full clause **no** |
| 6 | Transaction recording | Product-model description | §12 Transaction Recording | No — Part III heading only |
| 7 | Reward obligations | FD-2/FD-3, `DEC-LOY-011`, LEG-FD-04/07/08 | §13 Reward Obligations | No — Part III heading only |
| 8 | Prohibited conduct | Existing platform-integrity principles | §10 Prohibited Conduct | **Yes** |
| 9 | Disputes/corrections | LEG-FD-11, LEG-FD-14 | §17 Complaints and Dispute Facilitation; §21 Governing Law and Dispute Resolution | No — Part IV/VII heading only |
| 10 | Suspension/termination | FD-3/FD-4, `DEC-LOY-011`, LEG-FD-06 | §15 Suspension and Restriction; §16 Business Exit and Termination | No — Part IV heading only |
| 11 | Programme changes | FD-5, LEG-FD-05 | §14 Programme Changes | No — Part III heading only |
| 12 | Data/privacy references | LEG-FD-09 | §23 Data and Privacy (cross-reference only) | No — Part VII heading only |
| 13 | Fees/commercial provisions | FD-7 | §18 Subscription and Fees | No — Part V heading only |
| 14 | Liability | LEG-FD-15 | §19 Liability | No — Part VI heading only |
| 15 | Governing law/disputes | Reconciliation rows 8/12/13, LEG-FD-14 | §21 Governing Law and Dispute Resolution | No — Part VII heading only |
| 16 | Changes to Terms | LEG-FD-13 | §22 Changes to These Terms; Reacceptance | No — Part VII heading only |
| 17 | Electronic acceptance | LEG-FD-03 | §7 Acceptance and Formation | **Yes** |

Independence/no-agency (§5) is not a separate row in the readiness table; it is drafted here as an integral part of the "Parties/relationship" readiness row (LEG-FD-01), consistent with LEG-FD-01's characterisation of the platform–business relationship. The Business/customer relationship boundary (§6) is likewise drafted from the same LEG-FD-01/FD-5 authority as a foundational statement, not as a full "Reward Program responsibility" clause (which remains Part III, not drafted).

---

## Part I — Foundation, Relationship and Acceptance

*(Drafted with full clause text in task `DEC-LEGAL-002-BT-DRAFT-001` (corrected `-CORR-001`) — the Founder-approved drafting baseline. Part II, §§8–10 below, is now also drafted with full clause text (task `DEC-LEGAL-002-BT-DRAFT-002`, corrected `-CORR-001`), and remains draft pending Founder review. Parts III–VIII remain headings/placeholders only.)*

### Preamble

These 11thONUS Core Business Terms ("**Terms**") govern the relationship between [CONTROLLED INPUT REQUIRED: operator's registered legal name, registration/company number, and registered address — not established in any reviewed authority; the operating legal entity for 11thONUS has not been recorded in the governance record reviewed for this task] ("**11thONUS**," "**we**," "**us**") and the business entity or sole proprietor that registers to participate on the 11thONUS platform ("**Business**," "**you**"). These Terms apply to the Business's use of the 11thONUS platform and do not, by themselves, govern the relationship between the Business and its own customers, which the Business establishes through its own Reward Program terms (see §6).

### Section 1 — Parties and Agreement

1.1 These Terms are entered into between 11thONUS and the Business identified in the Business's account registration. Where a Business is an entity rather than an individual, references to "the Business" mean that entity, acting through an individual with authority to bind it (see §1.3).

1.2 These Terms bind only the legal entity or sole proprietor registered as the Business. An affiliate, related company, franchisee or other separate legal person is not automatically a party merely because of its relationship with that Business, unless expressly agreed by 11thONUS under an applicable governed arrangement.

1.3 The individual who completes registration on behalf of a Business represents that they have the authority to bind the Business to these Terms. 11thONUS relies on this representation. Where necessary for verification, security, compliance, dispute resolution, or platform integrity, 11thONUS may request reasonable evidence of that authority; this section does not establish a routine or universal requirement to independently verify corporate authority beyond the Business's own account-authority structure (see Part II §9).

1.4 These Terms take effect for a given Business upon that Business's acceptance in accordance with §7 (Acceptance and Formation), and apply for as long as the Business participates on the platform, subject to §16 (Business Exit and Termination; Outstanding Rewards) (Part IV, not drafted in this task).

### Section 2 — Definitions (Part I terms only)

Only the terms necessary to read Part I are defined here. Additional definitions will be added as later Parts are drafted; no definition here should be read as pre-empting or narrowing a definition that a later Part may require.

- **"11thONUS"** or **"the platform"** means the customer-verified loyalty platform operated by the entity identified in the Preamble, including the infrastructure and functions described in §4 (Platform Role).
- **"Business"** means the participating business entity or sole proprietor described in §1.
- **"Reward Program"** means the customer reward programme that a Business designs, owns, and operates using the platform's shared infrastructure, as described in §6.
- **"Customer"** means an individual who transacts with a Business and participates in that Business's Reward Program through the platform. Customers are not a party to these Terms (see §6.3).
- **"Terms"** means this Core Business Terms document, as it may be amended from time to time in accordance with a future governed Changes-to-Terms clause (Part VII §22, not drafted in this task).
- **"Accepting Individual"** means the individual described in §1.3 who affirmatively accepts these Terms on the Business's behalf, as recorded under §7.

#### Additional definitions (Part II terms)

The following terms are added for Part II and do not alter any Part I definition above.

- **"Business Owner"** means the individual recorded, under the platform's governed account and identity architecture, as the Business's owner — the single individual associated with the Business through the platform's authoritative owner-level account relationship at any given time. Being the Business Owner is a platform account-role fact. It does not by itself establish, and is not established by, legal authority to bind the Business — see "Authorized Representative" below and §9.1.
- **"Authorized Representative"** means the individual described in §1.3 who has authority to bind the Business, including for purposes of accepting or reaccepting these Terms as described in §7.5. A Business's Authorized Representative and its Business Owner may be the same individual, but need not be; each concept exists independently of the other, and holding one status does not by itself confer the other.
- **"Staff"** means an individual the Business authorizes to use particular platform capabilities on the Business's behalf under §9.2, according to the roles and permissions the platform makes available for that purpose. Being Staff does not, by itself, make an individual a Business Owner or an Authorized Representative, and platform Staff permissions do not themselves confer the authority described in §1.3, §7.5, or the Authorized Representative definition above. This does not mean a Staff member can never independently hold that authority: an individual who is Staff may separately have legal authority to bind the Business under the Business's own corporate or legal arrangements, entirely apart from their platform Staff status. That independent authority, where it exists, is not created, negated, or evidenced by this definition, and must not be inferred from Staff status alone.

### Section 3 — Purpose and Scope

3.1 11thONUS is a platform through which participating Businesses operate customer-verified loyalty ("Reward") programmes. The platform provides shared infrastructure for identity, purchase verification, and reward-cycle mechanics; it does not itself operate a shared or unified loyalty programme across Businesses, and it does not sell, market, or fulfil any Business's underlying goods or services.

3.2 These Terms govern the Business's use of the platform and its relationship with 11thONUS. They do not govern: (a) the content, design, or terms of the Business's own Reward Program, which the Business alone controls (§6); (b) the Business's relationship with its own customers generally, except to the extent these Terms expressly impose a governed minimum requirement on that relationship (§6, §13, §14); or (c) 11thONUS's direct relationship with a customer, which is governed by the separate Customer Terms / Platform Terms of Use instrument (§0.0) — an approved separate legal-instrument architecture and a distinct future controlled work package under the differentiated-instrument model (LEG-FD-10) — not this document.

3.3 These Terms are issued as a single portable Core Business Terms text (Layer 1 of the jurisdiction architecture), supplemented — not redefined — by jurisdiction-specific overlays or addenda (Layer 2; §26, Part VIII, not drafted in this task) where mandatory or appropriate local law requires additional or different provisions. 11thONUS may present a consolidated or localized rendering of the applicable Core Terms and overlay to a Business in a given jurisdiction for accessibility, without changing this underlying two-layer architecture.

### Section 4 — Platform Role

4.1 11thONUS provides the Business with access to platform infrastructure that supports the Business's Reward Program, including: (a) identity and account-authority infrastructure for the Business and its authorised staff; (b) a shared reference catalogue of purchasable categories against which the Business's customer transactions are recorded; (c) purchase recording and verification functionality; and (d) reward-cycle mechanics that track a customer's progress toward, and completion of, rewards under the Business's Reward Program.

4.2 11thONUS's role is that of an infrastructure and verification platform. 11thONUS records and verifies platform-level activity (identity, purchase entries, reward-cycle progress, and Terms-acceptance records) but does not itself decide what a Business's Reward Program rewards, at what threshold, or with what value. Those are decisions the Business makes for its own Reward Program (§6).

4.3 11thONUS does not sell, supply, or deliver the underlying goods or services a Business provides to its customers, and is not a party to the transaction between a Business and its customer.

### Section 5 — Independent Business Relationship (No Agency)

5.1 The Business participates on the platform as an independent business. Nothing in these Terms, and nothing in the Business's use of the platform, creates a partnership, joint venture, franchise, agency, or employment relationship between 11thONUS and the Business.

5.2 Neither party has the authority to act on behalf of, bind, or incur any obligation for the other, except where these Terms expressly grant that authority for a specific purpose.

5.3 The Business is solely responsible for its own business operations, including its pricing, the goods or services it sells, its compliance with laws applicable to its own business, its tax obligations, its employment relationships with its own staff, and its relationships with its own customers, except to the extent these Terms expressly impose a governed platform-level requirement (§6, §13, §14).

5.4 11thONUS does not control, and is not responsible for, how a Business designs its Reward Program, prices its goods or services, or otherwise conducts its business, except as these Terms expressly provide.

### Section 6 — Business/Customer Relationship Boundary

6.1 Each Business owns and controls its own Reward Program and its own relationship with its customers. The platform standardises trust and verification infrastructure common to all Businesses; it does not become a shared or unified loyalty programme, and it does not take ownership of any Business's customer relationship.

6.2 The Business is solely responsible for the content, design, communication, and lawful operation of its own Reward Program, including what qualifies as a rewardable purchase, what a completed reward consists of, and how the Business communicates its Reward Program to its customers — subject to the governed minimum requirements this instrument imposes (in later Parts, not drafted in this task) regarding survival of earned rewards and prospective-only programme changes.

6.3 A customer's participation in a Business's Reward Program does not, by itself, make the customer a party to these Terms. 11thONUS's direct relationship with customers for platform access or use is governed by the separate Customer Terms / Platform Terms of Use instrument (§0.0) — a distinct instrument under the approved differentiated-instrument architecture (LEG-FD-10), not this document. That instrument is a separate future controlled work package; its content is not drafted by this task, and this section does not resolve or draft any part of it.

6.4 References in these Terms to a Business's "Reward Program" mean the programme the Business itself has authored and published using the platform's shared infrastructure. Nothing in these Terms should be read as 11thONUS authoring, endorsing, or guaranteeing the content of any Business's Reward Program.

### Section 7 — Acceptance and Formation

7.1 A Business becomes bound by the current version of these Terms only upon affirmative acceptance by the Accepting Individual, recorded in accordance with this section. Acceptance is a precondition to the Business submitting for platform verification. Whether, and under what circumstances, continued participation on the platform requires an ongoing or repeated acceptance — including following a change to these Terms — is not resolved by this section; that matter is reserved to §22 (Changes to These Terms; Reacceptance) (Part VII, not drafted in this task) and the separately governed reacceptance-implementation decision (Controlled Inputs Register).

7.2 An acceptance of these Terms is valid only where it includes, at minimum: (a) an affirmative act of acceptance by the Accepting Individual (not a passive or default action); (b) identification of the Accepting Individual and the Business on whose behalf acceptance is given; (c) an exact reference to the specific version of these Terms being accepted; (d) an authoritative, server-recorded timestamp of the moment of acceptance; and (e) the ability to retrieve the exact accepted version of these Terms after acceptance.

7.3 These Terms do not require a forced-scrolling mechanism, a re-type-to-confirm mechanism, or any additional confirmation step beyond §7.2 as a platform-wide requirement. A jurisdictional overlay (§26, Part VIII, not drafted in this task) may impose an additional confirmation mechanism for a specific jurisdiction where mandatory local law requires it, without this constituting a platform-wide change to this section.

7.4 Where these Terms are later amended and a new version is issued, a Business's prior acceptance of an earlier version does not constitute acceptance of the new version. Continued participation on the platform following the issuance of a new version is subject to the reacceptance mechanism described in a future Changes-to-Terms clause (Part VII §22, not drafted in this task); this section does not itself specify what happens upon a Terms version change.

7.5 Initial acceptance of these Terms may be given by the registering Business Owner or another individual with authority to bind the Business (see §1.3). Ordinary staff or platform permissions do not, by themselves, confer authority to accept or reaccept these Terms on the Business's behalf. Any future capability allowing a delegated staff member to accept or reaccept these Terms on the Business's behalf requires explicit governance/authorization and is not established by this section.

7.6 11thONUS maintains an auditable record of each Business's acceptance, including the information described in §7.2. Retention of that record is subject to applicable law and 11thONUS's governed data-retention policy; this section does not itself establish a retention period or retention standard.

---

## End of Part I

---

## Part II — Business Participation

*(Drafted with full clause text in task `DEC-LEGAL-002-BT-DRAFT-002`. Parts III through VIII remain headings and placeholders only — see "End of Part II" below.)*

### Section 8 — Business Eligibility, Registration and Onboarding

8.1 A Business must be a legally existing business entity, or a sole proprietor, with the legal capacity to enter into these Terms. The individual who registers a Business on its behalf must have the authority described in §1.3.

8.2 The Business must ensure that the information it provides to 11thONUS during registration and onboarding — including its business identity, contact information, and Main Location — is accurate and is not knowingly misleading, and must promptly correct any such information that becomes inaccurate.

8.3 Before platform capabilities that require verification become available to it, a Business must complete the applicable onboarding requirements 11thONUS makes available for that purpose. Onboarding requirements may evolve as the platform's capabilities evolve. Unless and until changed through separate applicable governance or authorization — and not merely by 11thONUS publishing a different onboarding requirement, user interface, or configuration — completing onboarding under this section does not require a Business to: (a) select a subscription plan; (b) invite or maintain Staff; (c) publish a Reward Program; or (d) establish or operate more than one place of business.

8.4 11thONUS may request information reasonably necessary for verification, security, compliance, or platform integrity purposes, whether during onboarding or afterward. The Business must respond in a manner that is accurate and not knowingly misleading.

8.5 As provided in §7 (Acceptance and Formation), a Business must accept the current version of these Terms before it may submit its registration for platform verification.

8.6 Completing registration and onboarding does not itself mean that a Business has been verified, or that all platform capabilities have become available to it. Certain platform capabilities require the Business to satisfy additional, separately governed verification or participation requirements.

8.7 The mechanism by which a Business satisfies those verification or participation requirements, and the resulting effect, if any, on the Business's status or access to platform capabilities, are governed separately from these Terms and are not created, defined, or limited by this section. Nothing in this section establishes a verification timeline or service commitment, an approval or decline outcome, a set of verification criteria, or a fee for verification.

8.8 Completing registration and onboarding does not guarantee that a Business will satisfy, or will continue to satisfy, any separately governed verification or participation requirement.

### Section 9 — Account Authority (Owners, Staff and Permissions)

9.1 The Business has a Business Owner, determined under the platform's governed account and identity architecture. Being the Business Owner is a platform account-role fact; it does not by itself establish legal authority to bind the Business. Separately, the individual described in §1.3 who has authority to bind the Business is the Business's Authorized Representative for purposes of these Terms, with authority to act on behalf of the Business's relationship with 11thONUS under these Terms, including the acceptance authority described in §7. The Business's Business Owner and its Authorized Representative may be the same individual, but need not be, and neither status is automatically conferred by the other.

9.2 The Business may authorize other individuals as Staff to use particular platform capabilities on its behalf, according to the roles and permissions the platform makes available for that purpose. Staff access is a matter of the Business's ongoing management of its account following onboarding; it is not part of registration or onboarding under §8.

9.3 Being granted platform permissions as Staff does not, by itself, give an individual authority to bind the Business, to accept or reaccept these Terms on the Business's behalf (§7.5), or to act beyond the specific capabilities the individual's role and permissions cover. Delegating platform permissions to Staff — whether by the Business Owner or by another individual with platform authority to do so — does not delegate any Authorized Representative's own authority under §1.3. Consistent with §7.5, no provision of these Terms confers Terms-acceptance or Business-binding authority on Staff merely by virtue of their platform permissions; any future capability allowing a delegated Staff member to exercise that authority requires explicit separate governance/authorization and is not established by this section or any other provision of these Terms.

9.4 The platform's role and permission model governs what platform capabilities a person may use. It does not determine, and 11thONUS does not adjudicate, a person's employment relationship, corporate authority, or other legal relationship with the Business outside the platform. The Business is responsible for aligning the platform access it grants with the actual authority it intends that person to have.

9.5 The Business is solely responsible for deciding whom to authorize as Staff, for the roles and permissions it grants them, and for adjusting or removing that access — using the mechanisms the platform makes available for that purpose from time to time — when a person should no longer have it, including when their relationship with the Business ends or their responsibilities change.

9.6 Staff must act only within the permissions the Business has granted them. As between the Business and 11thONUS, the Business is responsible under these Terms for: (a) deciding whom to authorize as Staff; (b) the permissions and access it grants them; and (c) platform activity that Staff undertake within the access and authority the Business granted, without prejudice to any right the Business may separately have against that individual. This section does not make the Business responsible for: unauthorized access to its account; compromise of Staff credentials; activity outside the permissions and access the Business granted; malicious conduct genuinely outside the authority the Business granted; or a failure or compromise attributable solely to 11thONUS's own platform, systems, or security — except, in each case, to the extent the Business contributed to the event through its own breach of §9.5, §9.7, or §9.8. This section addresses account and access responsibility only; it does not establish a general liability regime, which remains a matter for Part VI §19 (not drafted in this task).

9.7 The Business must take reasonable steps to protect the credentials and access it and its Staff use to reach the platform, and must not knowingly permit access contrary to these Terms or the platform's role and permission model.

9.8 Where the Business knows of, or reasonably suspects, unauthorized use of its account or its Staff's access, it must notify 11thONUS without undue delay and cooperate reasonably with 11thONUS's efforts to investigate and address the matter. This section does not make the Business responsible for unauthorized use resulting solely from a failure or compromise of 11thONUS's own platform, systems, or security.

### Section 10 — Prohibited Conduct

10.1 In using the platform, a Business — including Staff acting on its behalf — must not:

(a) engage in fraud or attempted fraud in connection with the platform, a Reward Program, or a customer;

(b) fabricate, or knowingly record false, purchase or loyalty activity;

(c) manipulate, or attempt to manipulate, Reward Program records in a manner inconsistent with the Business's own Reward Program terms;

(d) access or use the platform, or any account, without authorization;

(e) misuse another Business's or a customer's identity, account, or information;

(f) interfere with, disrupt, or attempt to circumvent the operation, security, or integrity of the platform;

(g) knowingly provide materially false or misleading information to 11thONUS, including during registration, onboarding, or verification (see also §8.2, §8.4);

(h) use the platform for an unlawful purpose;

(i) engage in conduct intended to defeat or circumvent the platform's verification or trust controls; or

(j) misuse customer information obtained through the Business's participation on the platform, including using it for a purpose inconsistent with the Business's own Reward Program terms or applicable law.

10.2 This section does not limit a Business's legitimate control over its own customer relationships or its own Reward Program, exercised consistently with these Terms (§6).

10.3 The conduct described in §10.1 illustrates conduct that undermines platform trust, security, integrity, or compliance. It is not an exhaustive statement of all conduct that may result in platform action.

10.4 Conduct described in this section, or other conduct inconsistent with these Terms, may result in platform action against the Business, including suspension or restriction of the Business's participation, subject to Part IV §15 (Suspension and Restriction, not drafted in this task). This section does not itself establish a notice period, a cure period, or a termination mechanism, and does not alter the treatment of a customer's already-earned rewards (Part III, not drafted in this task).

10.5 This section states a contractual prohibition only. It does not establish, and should not be read as establishing, a fraud-detection methodology, a conduct-classification scheme, an adjudication procedure, or an enforcement or remediation policy. Any such operational policy is a separate matter for future governance and is not created by these Terms.

---

## End of Part II

Parts III through VIII above (§§11–27) remain headings and placeholders only, per the governing task scope. No clause text for those Parts has been drafted, and none should be inferred from Part I or Part II's treatment of adjacent topics (for example, §10.4's cross-reference to suspension states only that platform action may follow prohibited conduct; it does not draft any part of §15, and §9's treatment of Staff access does not draft any part of §11's Reward Program Responsibility clause).

---

## Status Reaffirmation

Drafting this Part I and Part II document does not change any of the following, all of which remain exactly as they stood before this task:

- `DEC-LEGAL-002` = **OPEN_LEGAL** (Decision Register)
- Capability 3 = **Open — engineering work packages complete; blocked on governed Terms-content configuration** (`CDR-001` §5)
- Terms configuration (`platformConfig/businessTerms`) = **NOT CONFIGURED**
- `DEC-ID-005` = **OPEN_FOUNDER**
- `DEC-LOY-009` = **OPEN_FOUNDER**
- All unresolved `DEC-SUB-*` decisions = **unresolved**, unchanged

This document is **DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED**.
