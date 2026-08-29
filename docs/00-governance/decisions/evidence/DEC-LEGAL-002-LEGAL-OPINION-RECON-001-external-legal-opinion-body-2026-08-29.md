> **Title:** External Legal Opinion — Comprehensive Legal Opinion & Core Terms Framework (`DEC-LEGAL-002` Handoff) — Verbatim Evidence Record
> **Version:** 1.0 · **Status:** External legal evidence filed against `EXT-LEG-002`/`DEC-LEGAL-002` — filed verbatim, not a governance conclusion
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002`; [External Dependencies Register](../external-dependencies-register.md) `EXT-LEG-002`
> **Provenance:** Received by the Founder from external legal counsel (the Burundi/Rwanda legal adviser engaged as `EXT-LEG-002`'s owner-adviser) as the response to the [`DEC-LEGAL-002-FOUNDER-DISP-001` Legal Counsel Handoff Pack](DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md)'s question set. Supplied to this repository by the Founder as a local file (`docs/Comprehensive Legal Opinion & Core Terms Framework (DEC-LEGAL-002 Handoff).md`, untracked) on 2026-08-29, filed here under task `DEC-LEGAL-002-LEGAL-OPINION-RECON-001` (Legal Opinion Reconciliation).
> **Integrity:** The body below (from the `# 11th ONUS Legal Opinion` heading onward) is filed **verbatim** — no wording, structure, or table content has been edited, corrected, or reordered. This header block is the only addition. Reconciliation, qualification, and correction of specific opinion conclusions against Founder product authority and existing governance are recorded separately in the [Reconciliation Matrix](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md) and the [Founder Legal Architecture Disposition Record](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md) — filing this document does not itself adopt, endorse, or reject any conclusion below.
> **Legal status:** This document is external legal evidence — one input to `DEC-LEGAL-002` — not a legal conclusion of 11thONUS, not a governance decision, and not binding Terms content. Treat every recommendation, proposed clause, and "required"/"mandatory" characterisation below as counsel's professional opinion requiring Founder review, not as adopted 11thONUS policy. See the Reconciliation Matrix for which conclusions are confirmed, qualified, or not adopted.
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md`
> **Date filed:** 2026-08-29 · **Task:** `DEC-LEGAL-002-LEGAL-OPINION-RECON-001`

---

# 11th ONUS Legal Opinion

**SUBJECT:** Comprehensive Legal Opinion & Core Terms Framework (DEC-LEGAL-002 Handoff)

**JURISDICTIONAL SCOPE:** Primary Analysis: Burundi (*Loi n° 1/11 de 2009*, *Loi n° 1/024 de 2018*, Code Civil du Burundi) | Cross-Border/Operational Scope: Rwanda (*Law No 058/2021 on Data Protection*, *Law N° 13/2009 on Commercial Transactions*) | Architecture: Globally Portable Core with Jurisdictional Overlays

## Legal Responses to DEC-LEGAL-002

### 1. Platform–Business Relationship

- **Legal Characterisation:** The legal relationship between 11thONUS and a participating Business is strictly that of an independent Software-as-a-Service (SaaS) and technical infrastructure provider. It does not constitute an agency, partnership, joint venture, franchise, or commercial distribution relationship under Burundian or Rwandan law.
- **Legal Basis:** Under general contract law principles (applicable across OHADA jurisdictions, including Burundi and Rwanda), agency requires the agent to have authority to bind the principal in legal relations with third parties. 11thONUS has no such authority. it does not negotiate, conclude, or perform Business–customer transactions. Marketplace characterisation would imply 11thONUS facilitates direct transactions between Businesses and customers, which is not the case—customers do not pay 11thONUS, and 11thONUS does not handle payments for rewards.
    
    The OHADA Uniform Act on General Commercial Law (2010 revised) recognises the validity of electronic contracts and the freedom of parties to structure their commercial relationships. This service-provider characterisation is consistent with that framework.
    
- **Contractual Drafting Implication:** The Business Terms must contain an explicit "No Agency / Independent Contractor" clause. The terms must specify that 11thONUS provides software tools for identity management, purchase verification, and tracking, but that the Business acts as the sole primary obligor and creator of its Reward Program.

### 2. Platform–Customer Relationship

- **Legal Characterisation:** Although customers do not pay monetary consideration to 11thONUS (**DEC-PROD-004)**, a direct legal relationship exists. It is legally characterized as a Non-Monetary Software License and Data Processing Agreement**.**
- **Legal Basis:** Under Burundi *Loi n° 1/11* (Consumer Protection) and general contract principles, platform usage including account creation, security logging, and data tracking requires a binding agreement. The consideration provided by the customer consists of their agreement to platform usage rules and the licensing of their data for transaction verification.
- **Requirement:** 11thONUS must present a standalone End-User Terms of Service (EUTOS) during customer onboarding. A direct Customer Terms/consent relationship with 11thONUS is required, but its legal basis is platform-access/terms-of-use, not a commercial transaction.

### 3. Enforceability & Form of Electronic Acceptance

- **Rwanda (platform operation):** Law No. 18/2010 provides that electronic signatures are admissible in legal proceedings and shall be accepted as evidence without regard to the fact they are in electronic form. An electronic signature is defined as "an electronic sound, symbol or process attached to or logically associated with an electronic record and executed or adopted by a person with the intent to sign". An explicit affirmative checkbox satisfies this definition.
    
    **Burundi (pilot jurisdiction):** Burundi does not have a dedicated Electronic Signature Law. However, the Burundi Commercial Code (1993) recognises digital signatures as having legal effect. The 2024 Electronic Communications and Postal Code (Loi n° 1/22 du 22 août 2024) provides an updated framework for electronic communications. Burundi's 2026 Personal Data Protection Law also requires demonstrable consent for data processing.
    
- **Requirements for Universal Enforceability:**
    1. The user must be forced to view or scroll through a summary of the terms before checking the box.
    2. The timestamp must be referenced against a secure, immutable server clock (UTC).
    3. The exact text version associated with that schema must be archived and retrievable for evidentiary submission in court.
    
    The **record content**
    
    - Who accepted
    - What they accepted (termsVersion)
    - When they accepted (acceptedAt)
    - In what language (languageCode)

### 4. Required Disclosures

Under Burundi *Loi n° 1/11* (Arts. 6–8), the following disclosures must be provided **p**rior to acceptance:

- **Identity of Platform Operator:** Corporate registration name, tax identification number, physical office address, and contact email.
- **Separation of Roles:** Clear warning that 11thONUS is not the issuer or guarantor of merchant rewards.
- **Nature of Rewards:** Explicit notice that rewards have no monetary/cash value and are non-transferable unless permitted by the merchant.
- **Data Processing Disclosures:** How verification data is collected, stored, and shared with the specific merchant.

### 5. Business Obligation to Honour Rewards & Suspension Redemption

- **Legal Expression:** The obligation must be expressed in both the Business Terms (B2B legal commitment to 11thONUS to maintain platform integrity) and the Business Reward Program Rules (B2C binding offer to customers).
- **Enforceability of Default-Redeemable Model (DEC-LOY-011):** Fully enforceable. A commercial payment dispute between 11thONUS and the Business (e.g., unpaid subscription fees) is *res inter alios acta* (a third-party transaction) relative to the customer. Therefore, suspending a Business’s subscription cannot extinguish accrued customer rights under Burundi contract law (*Code Civil* Art. 33).
- **Definition of "Legally Impossible":** Fulfilment is "legally impossible" only under recognized *force majeure*conditions, statutory bans on the underlying goods/services, corporate insolvency, or court order—not commercial inconvenience or financial distress.
- **Exceptions, Notices, & Remedies:**
    - **Fraud/Security Exceptions:** Redemption may be blocked immediately if specific, logged evidence indicates reward manipulation. 11thONUS must provide written notice to the affected customer within 48 hours.
    - **Consumer Protection Implications:** Withholding validly earned rewards without justifiable cause constitutes an unfair commercial practice under Burundi *Loi n° 1/11* Art. 15, exposing the Business to administrative sanctions by the *Centre National de Protection du Consommateur* (CNCP).

**Proposed Legal Form:**

**A. Business Terms Clause:**

*"The Business agrees that all rewards validly earned by customers under the Business's Reward Program constitute a binding obligation of the Business to the customer. This obligation survives suspension or termination of the Business's participation in the 11thONUS platform, subject only to: (a) the terms of the applicable Reward Program; (b) circumstances where fulfilment is legally impossible; and (c) express exceptions set out in these Terms. 11thONUS is not a guarantor or fulfiller of this obligation."*

**B. Reward Program Requirements (imposed on Businesses):**

*"Each Business's Reward Program must include a provision stating that rewards validly earned remain redeemable during any suspension of the Business's platform participation, except where the specific suspension reason makes continued redemption inappropriate (fraud, security, legal/regulatory, disputed validity)."*

### 6. Treatment of Programme Changes

- **Legal Expression of Prospective Changes (FD-5):** A Business may modify its Reward Program prospectively under the Unilateral Variation Doctrine, provided that:
    1. Customers receive a minimum of 30 days advance notice via the platform for material adverse changes (e.g., increasing redemption thresholds).
    2. Accrued/earned reward points prior to the date of modification retain their original redemption value or are governed by the rule most favorable to the consumer.
- **Retrospective Prohibition:** Retrospective reduction or cancellation of earned rewards is legally void under Burundi law as an unlawful breach of accrued contractual rights.

**Recommended Drafting:**

*"The Business may amend its Reward Program terms from time to time. Any amendment applies only prospectively to rewards earned after the effective date of the amendment. Rewards earned before the effective date remain governed by the terms in effect when earned. The Business will provide at least [30] days' advance notice of any material amendment. Continued participation in the Reward Program after the effective date constitutes acceptance of the amended terms. If a customer does not accept a material adverse amendment, they may [redeem existing rewards and close their account/terminate participation]."*

### 7. Outstanding Rewards on Business Exit or Suspension

- **Legal Expression:** Business exit does not extinguish unredeemed, validly earned rewards (FD-2/FD-3).
- **Operational Framework for Exit:**
    - **Mandatory Run-Off Period:** Upon notice of termination, the Business enters a mandatory 60-day Redemption Run-Off Phase. New reward earning is disabled, but redemption remains active via 11thONUS tools.
    - **Post-Exit Cash Settlement/Alternative:** If the Business closes its physical doors or exits the platform completely, the Business Terms must stipulate that the merchant is legally liable to convert unredeemed valid rewards into direct monetary refunds or equivalents directly to the customer. 11thONUS disclaims all liability for merchant default during this phase.

### 8. Dispute Allocation Architecture

**Proposed Dispute Mechanisms:**

| Dispute Type | Mechanism | Forum |
| --- | --- | --- |
| **Customer vs Business (Reward)** | Escalation: Business complaint → 11thONUS facilitation → Mediation → Arbitration/Court | Business's chosen forum (with customer protections) |
| **Business vs Platform** | Escalation: Internal review → Mediation → Arbitration | Agreed arbitration (Rwanda or neutral) |
| **Customer vs Platform** | Platform complaint process → Mediation (optional) → Court | Customer's jurisdiction (consumer protection) |

**Business-Facing Terms:**

- Arbitration clause (with clear opt-out)
- Choice of Rwanda as seat of arbitration (or neutral OHADA-compliant venue)
- Clear cost allocation
- Time limits for claims

**Customer-Facing Terms:**

- No mandatory arbitration (consumer protection may prohibit)
- Clear complaint process
- Right to take dispute to customer's local court
- Information on consumer protection authorities (CNCP in Burundi)

**Classification:** Jurisdiction-by-jurisdiction – Dispute mechanisms are highly jurisdiction-specific, particularly for consumer disputes.

### 9. Platform Liability Limits

- **Actual Exposure:** 11thONUS faces potential vicarious liability claims regarding defective products sold by Businesses, unfulfilled rewards, system downtime affecting redemption, or data breaches.
- **Liability Cap:** The Core Terms must disclaim all indirect, consequential, punitive, and special damages. Direct liability to a Business must be capped at the total subscription fees paid by that Business to 11thONUS in the 12 months preceding the claim. Direct liability to a customer must be capped at a nominal fixed amount (e.g., $25 USD / BIF equivalent) or fully disclaimed except for gross negligence or willful misconduct.

**Rwanda-specific (platform operation):** Under the new Competition and Consumer Protection Law, online intermediaries are shielded from liability for seller content only if they do not knowingly allow illegal activities and respond to notices of harmful content. This creates a notice-and-takedown obligation.

**Burundi-specific (pilot):** The ARCT E-Commerce Guide (2025) imposes obligations on platforms regarding consumer protection and transaction oversight. 11thONUS must have clear procedures for handling complaints about Business conduct.

### 10. Business Liability & Indemnity

The Business Terms must require the Business to indemnify, defend, and hold harmless 11thONUS, its affiliates, officers, and employees against any claims, losses, liabilities, or regulatory fines arising from:

1. Failure of the Business to fulfill earned rewards.
2. Defective, illegal, or harmful goods/services provided by the Business.
3. False advertising or misrepresentation in the Business's Reward Program.
4. Non-compliance with local tax laws (e.g., VAT collection on rewarded items).

**Required Business Liability Provisions:**

| Area | Provision |
| --- | --- |
| **Reward fulfilment** | Business is solely responsible for fulfilling all rewards; indemnifies 11thONUS for any claims |
| **Reward Program content** | Business is solely responsible for Reward Program terms, accuracy, and compliance |
| **Customer relationship** | Business is solely responsible for all customer communications and relationships |
| **Regulatory compliance** | Business warrants compliance with all applicable laws (consumer protection, data protection, tax, etc.) |
| **Indemnity** | Business indemnifies 11thONUS against all claims arising from Business's Reward Program or conduct |

### 11. Legally Permissible Limitation/Exclusion Provisions

- **Public Policy Limits (Burundi & Rwanda):** Liability cannot be excluded for:
    1. Death or personal injury resulting from negligence.
    2. Intentional fraud, gross negligence (*faute lourde*), or willful misconduct.
    3. Mandatory statutory consumer warranties under Burundi *Loi n° 1/11*.
- **Drafting Standard:** Use standard, severable limitation clauses stating that disclaimers apply "to the maximum extent permitted by applicable law."

**Permissible Limitations (Burundi and Rwanda):**

| Provision | Enforceability |
| --- | --- |
| Limitation of liability to fees paid (Business) | Likely enforceable in B2B context |
| Exclusion of indirect/consequential loss | Likely enforceable in B2B context |
| Disclaimer of guarantees (platform not guarantor) | Enforceable if clearly stated |
| Service availability (no guarantee of uninterrupted service) | Enforceable if reasonable |
| Time limits for claims | Enforceable if reasonable |

**Prohibited Exclusions (Consumer Protection):**

| Provision | Status |
| --- | --- |
| Exclusion of liability for fraud or wilful misconduct | **Prohibited** – cannot be excluded |
| Exclusion of liability for death or personal injury | **Prohibited** |
| Exclusion of statutory consumer rights | **Prohibited** – cannot contract out |
| Exclusion of liability for data protection breaches | **Prohibited** (under data protection laws) |
| Unconscionable limitations | **Prohibited** |

**Burundi-specific:** Under Loi n° 1/11 de 2009 (consumer protection), any clause that deprives the consumer of their legal rights is void.

**Rwanda-specific:** The new Competition and Consumer Protection Law introduces stronger consumer protections; terms that are unfair or unconscionable may be void.

### 12. Governing Law

- **Business Terms (B2B):** **Laws of Rwanda**. Rationale: 11thONUS operates from Rwanda (DEC-LEGAL-006 pack), and commercial contracts between business entities permit freedom of governing law selection.
- **Customer Terms (B2C):** **Laws of Burundi** (for Burundi residents). Rationale: Mandatory consumer protection laws in Burundi (*Loi n° 1/11*) invalidate choice-of-law clauses that deprive consumers of local statutory protections.

| Terms Instrument | Governing Law | Rationale |
| --- | --- | --- |
| **Business Terms (Core)** | Rwanda | Platform operated from Rwanda; established legal framework |
| **Business Terms (Burundi Addendum)** | Burundi | Pilot jurisdiction requirements; consumer protection |
| **Customer Terms (General)** | Rwanda (with local consumer law overlay) | Platform operation; but consumer protection law of customer's jurisdiction may apply |
| **Customer Terms (Burundi)** | Burundi | Mandatory consumer protection applies |

**Legal Basis for Rwanda Law:**

Rwanda has a comprehensive legal framework for electronic transactions:

- Law No. 18/2010 on Electronic Messages, Electronic Signatures and Electronic Transactions
- Law No. 058/2021 on Data Protection and Privacy
- New Competition and Consumer Protection Law (2026)

**Burundi-specific Overlay:**

Burundi has:

- ARCT E-Commerce Guide (2025)
- Personal Data Protection Law (2026)
- Loi n° 1/11 de 2009 (consumer protection)

### 13. Jurisdiction & Forum

- **Business Terms (B2B):** Binding arbitration under the Rules of the Kigali International Arbitration Centre (KIAC), seat in Kigali, Rwanda, conducted in French or English.
- **Customer Terms (B2C):** Exclusive jurisdiction of the competent courts of Bujumbura, Burundi, or administrative resolution via the CNCP.

**Recommended Approach:**

| Terms Instrument | Forum | Rationale |
| --- | --- | --- |
| **Business Terms** | Arbitration (Rwanda seat) | Neutral, enforceable, efficient |
| **Business Terms (Burundi pilot)** | Arbitration (Rwanda) or Burundi courts | Consistent with core; allow Burundi option |
| **Customer Terms** | Customer's local courts | Consumer protection; arbitration may be restricted |
| **Customer Terms (Burundi)** | Burundi courts | Mandatory consumer protection; CNCP complaint mechanism |

**Arbitration Framework:**

- Seat: Kigali, Rwanda (or another OHADA-compliant venue)
- Rules: OHADA Uniform Act on Arbitration (or ICC/LCIA)
- Language: English and/or French
- Enforceability: New York Convention (Rwanda and Burundi are parties)

**Consumer Protection Considerations:**

Under Burundi's consumer protection framework, consumers cannot be forced into arbitration that deprives them of access to courts. Customer Terms should therefore:

- Offer a clear complaint process
- Allow consumers to take disputes to local courts
- Provide information on the CNCP (Independent Competition Commission) complaint mechanism

### 14. Required Languages for Enforceability

- **Statutory Requirement:** Under Burundi Constitution Art. 7 and *Loi n° 1/11* Art. 5, consumer transactions must be understandable by the public. Official languages of Burundi are Kirundi, French, and English.
- **Enforceability Mandate:** For consumer-facing Terms (EUTOS and pre-acceptance modals), French and Kirundi must be made available. In the event of litigation, the French version will serve as the primary legal reference text, with Kirundi validated as an official localized translation. The B2B Terms may be executed exclusively in English or French.

Burundi's official languages are Kirundi, French, and English (Constitution of Burundi).

| Language | Status | Practical Consideration |
| --- | --- | --- |
| **French** | Official; widely used in legal/commercial contexts | Safest choice; courts operate in French |
| **Kirundi** | Official; spoken by majority | May be required for consumer-facing communications in future |
| **English** | Official; growing in business | Acceptable for Business Terms; may not be sufficient for consumers |

**Recommendation:**

| Terms Instrument | Primary Language | Secondary |
| --- | --- | --- |
| **Business Terms** | English (core) + French (Burundi addendum) | Kirundi optional |
| **Customer Terms (Burundi)** | French (mandatory) | Kirundi recommended for accessibility |
| **Customer Terms (General)** | English + local language(s) | As required by jurisdiction |

### 15. Version-Change & Reacceptance Requirements

- **Legal Assessment of Current Scheme:** The implementation that resets superseded terms to a "not accepted" state requiring fresh acceptance is legally sound and superior to implied passive consent.
- **Notice Requirement:** For non-material updates, a 14-day banner notification suffices. For **material updates**(e.g., changes to liability, data usage, or redemption rights), users must be presented with an explicit modal forcing reacceptance before continuing system use.

**Recommended Process:**

1. **Notify** customers of impending Terms change (with summary of changes)
2. **Provide** new Terms (link to full text)
3. **Require** acceptance before continued use (with grace period)
4. **Record** acceptance with version and timestamp
5. **Allow** customers to terminate without penalty if they do not accept (for material adverse changes)

### 16. Mandatory Consumer Protection Provisions (Burundi *Loi n° 1/11*)

Customer Terms and Reward Program disclosures must explicitly state:

1. Clear contact information of the primary merchant fulfilling the reward.
2. Precise rules of earning and redemption without ambiguous terms.
3. Protection against misleading advertising (*Loi n° 1/11* Art. 12).
4. The right of consumers to log regulatory complaints directly with the *Centre National de Protection du Consommateur* (CNCP).

**Burundi-Specific Mandatory Provisions (Loi n° 1/11 de 2009, ARCT Guide):**

| Provision | Requirement |
| --- | --- |
| **Clear pre-purchase information** | Identity of Business, product/service details, price/terms |
| **Fraud/misleading advertising protection** | Prohibition of false or misleading claims |
| **Complaint mechanism** | Clear process; response timelines |
| **Contract terms** | Accessible before acceptance |
| **Withdrawal rights** | As provided by law |
| **Guarantees** | Disclosure of any guarantees |
| **Data protection** | As per Loi n° 1/03/2026 |

**Rwanda-Specific (platform operation – Law No. 058/2021):**

| Provision | Requirement |
| --- | --- |
| **Data processing consent** | Explicit, informed, revocable |
| **Data subject rights** | Access, rectification, erasure, objection |
| **Breach notification** | 48-hour notification requirement |
| **Registration** | Register as data controller with NCSA |

**General Consumer Protection Principles:**

| Principle | Implementation |
| --- | --- |
| **Good faith** | Terms must be fair and not unconscionable |
| **Transparency** | Terms must be clear, plain language |
| **Proportionality** | Remedies must be proportionate |
| **Access to justice** | Consumers must have effective redress |

### 17. Differentiated Terms Architecture

The B2B and B2C instruments must be maintained as distinct documents due to fundamentally different legal standards:

- **Business Terms (B2B):** Commercial contract standard; broad freedom of contract; strict liability caps; international arbitration clause; governed by Rwandan law.
- **Customer Terms (B2C):** Consumer protection standard; mandatory statutory consumer rights; disclaimers restricted by public policy; local court jurisdiction; localized language requirements (French/Kirundi); governed by Burundian law.

**Key Differences:**

| Aspect | Business Terms | Customer Terms |
| --- | --- | --- |
| **Relationship** | B2B service agreement | Platform Terms of Use (non-commercial) |
| **Governing law** | Rwanda (with local addenda) | Customer's local law (consumer protection overlay) |
| **Language** | English (primary) | Local language(s) (French for Burundi) |
| **Dispute resolution** | Arbitration | Local courts (consumer protection) |
| **Limitation of liability** | Broadly enforceable | Restricted (consumer protection) |
| **Notice requirements** | Commercial reasonableness | Enhanced (consumer protection) |
| **Consent standard** | Commercial consent | Explicit, informed consent |
| **Termination** | Mutual rights | Customer rights protected |
| **Data processing** | Commercial processing | Enhanced privacy protections |

**Enforceability Standards:**

| Standard | Business Terms | Customer Terms |
| --- | --- | --- |
| **Formation** | Click-through acceptance | Explicit affirmative checkbox |
| **Interpretation** | Commercial reasonableness | Contra proferentem (against drafter) |
| **Unfair terms** | Unconscionability | Unfair terms legislation (where applicable) |
| **Consumer rights** | N/A | Cannot be contracted away |

### 18. Platform Suspension Grounds & Process

- **Legally Sound Grounds (FD-4):**
    1. Suspected security breaches or system integrity threats.
    2. Credible allegations of fraudulent purchase verification or unit inflation.
    3. Non-payment of subscription fees exceeding a 14-day cure period.
    4. Reputational damage or violation of applicable laws.
- **Procedural Fairness Requirements:**
    - **Immediate Emergency Suspension:** Permitted without prior notice for active security threats or fraud. Written justification must be issued within 24 hours.
    - **Standard Suspension:** Requires 7 days prior written notice specifying the default and necessary cure actions.
    - **Customer Impact:** During merchant suspension, the platform must display a clear status message: *"Merchant account suspended for administrative review. Pre-earned rewards remain valid pursuant to Program Rules."*

**Required Suspension Grounds (to be specified in Terms):**

| Ground | Description |
| --- | --- |
| **Fraud** | Reasonable suspicion of fraudulent activity |
| **Security breach** | Compromise of platform security |
| **Regulatory non-compliance** | Failure to comply with applicable laws |
| **Terms breach** | Material breach of Business Terms |
| **Harm to platform integrity** | Conduct that undermines trust or integrity |
| **Harm to participants** | Conduct that harms customers or other Businesses |
| **Legal requirement** | Court order or regulatory directive |

**Notice and Process Requirements:**

| Element | Requirement |
| --- | --- |
| **Pre-suspension notice** | Generally required (unless immediate action needed) |
| **Suspension notice** | Written notice with grounds and consequences |
| **Right to respond** | Business may challenge suspension |
| **Review process** | Internal review within reasonable time |
| **Reinstatement** | Grounds for reinstatement; process |

**Immediate Suspension (without prior notice):**

Permitted only where:

- Fraud is suspected
- Security/integrity is at immediate risk
- Legal/regulatory requirement demands it
- Continuing participation would cause harm

**Consequences During Suspension:**

| Activity | Status During Suspension |
| --- | --- |
| **New earning** | Suspended (per DEC-LOY-011) |
| **New Reward Programs** | Suspended |
| **Redemption of earned rewards** | Generally permitted (per DEC-LOY-011) |
| **Platform access** | Restricted as needed |

**Treatment of Customer Rights During Suspension:**

- Customers must be able to redeem validly earned rewards (per DEC-LOY-011)
- Customers should be informed of suspension (if it affects them)
- Customers' rights against Business unaffected by suspension

**Reinstatement/Termination:**

| Outcome | Process |
| --- | --- |
| **Reinstatement** | Upon resolution of grounds; Business resumes full participation |
| **Termination** | After fair process; outstanding rewards remain Business obligation |

### 19. Reward Monetary Characterisation

- **Legal Characterisation (FD-6):** Rewards are legal conditional promotional concessions / non-monetary revocable licenses. They are not money, bank deposits, e-money, legal tender, or stored-value instruments.
- **Regulatory Compliance:** This characterisation successfully avoids triggering regulatory licensing under the *Banque de la République du Burundi* (BRB) e-money/payments regulations or the National Bank of Rwanda (BNR) directives.
- **Required Disclosures:** Pre-acceptance disclosures must state: *"Rewards are promotional benefits issued solely by the Business. They carry no cash value, cannot be exchanged for currency, do not earn interest, and do not constitute a bank balance or e-money."*

**Required Disclosures:**

1. **Nature of reward:** "A reward is a benefit offered by the Business under its Reward Program. It is not money, currency, or a stored cash balance."
2. **No cash value:** "Rewards have no cash value and are not redeemable for cash unless expressly stated in the Reward Program."
3. **No withdrawal entitlement:** "Customers have no entitlement to withdraw rewards as cash or transfer them as value."
4. **Business obligation:** "The obligation to provide rewards is the Business's obligation, not 11thONUS's."

**Critical Drafting Points:**

| Point | Correct Expression | Avoid |
| --- | --- | --- |
| **Value** | "Rewards represent a benefit under the Reward Program" | "Rewards are worth [X]" |
| **Redeemability** | "Rewards may be redeemed for goods/services as specified" | "Rewards may be exchanged for cash" |
| **Ownership** | "Rewards are a contractual benefit" | "Rewards are the customer's property" |
| **Platform role** | "11thONUS facilitates record-keeping" | "11thONUS holds rewards" |

**Consistency Across Terms:**

| Terms Instrument | Expression |
| --- | --- |
| **Business Terms** | Business's obligation to honour rewards; rewards are Business's programme benefit |
| **Customer Terms** | Rewards are Business's obligation; no cash value; no platform guarantee |
| **Reward Program** | Specific reward mechanics; redemption rules; no cash value unless stated |

### 20. General Subscription Framework Structure

the structural framework for B2B subscriptions can be established without hardcoding commercial pricing values

**Structural Subscription Provisions (Value-Independent):**

**A. Parties and Services:**

*"11thONUS agrees to provide the Business with access to the 11thONUS platform and services in accordance with these Terms, in consideration of the fees set out in the applicable Subscription Plan."*

**B. Fees and Billing (Structural):**

| Element | Structural Provision |
| --- | --- |
| **Fee obligation** | Business agrees to pay fees as specified |
| **Billing cycle** | Fees billed [monthly/annually] in advance |
| **Payment terms** | Payment due within [X] days of invoice |
| **Payment methods** | As specified on platform |
| **Late payment** | Interest/reasonable charges for late payment |
| **Taxes** | Fees exclusive of taxes; Business responsible |

**C. Subscription Changes (Structural):**

| Element | Structural Provision |
| --- | --- |
| **Upgrade** | Business may upgrade; fees adjusted pro-rata |
| **Downgrade** | Business may downgrade; effective next billing cycle |
| **Plan changes** | 11thONUS may change plans with notice; Business may terminate |
| **Price changes** | Notice required; Business may terminate if not accepted |

**D. Cancellation and Termination (Structural):**

| Element | Structural Provision |
| --- | --- |
| **Cancellation by Business** | Notice period; effective end of billing cycle |
| **Cancellation by 11thONUS** | For cause (breach, non-payment) |
| **Effect of termination** | Access ceases; outstanding rewards remain Business obligation |
| **Data export** | Reasonable period to export data |

**E. Subscription-Specific Clauses (Placeholder for Values):**

*"The Business's Subscription Plan, including the services included, fees, billing interval, and any applicable trial or promotional terms, is set out in the Subscription Plan selected by the Business and confirmed in the Business's account. 11thONUS may update the Subscription Plan offerings from time to time, provided that any changes to the Business's existing plan are subject to the notice provisions in these Terms."*

**What Should NOT Be Drafted Now:**

- Specific plan names
- Specific prices or price ranges
- Specific billing intervals
- Staff/user limits
- Trial structures
- Complimentary/pilot plan terms
- Proration rules
- Grace periods
- Billing ownership rules
- Tiering structure

## Summary of Classification

| Question | Core/Portable | Burundi-Specific | Jurisdiction-by-Jurisdiction |
| --- | --- | --- | --- |
| 1. Platform–Business relationship | ✅ |  |  |
| 2. Platform–Customer relationship | ✅ |  |  |
| 3. Electronic acceptance | ✅ |  |  |
| 4. Required disclosures | ✅ | ✅ |  |
| 5. Honour obligation | ✅ |  |  |
| 6. Programme changes | ✅ |  |  |
| 7. Exit/suspension rewards | ✅ |  |  |
| 8. Dispute allocation |  |  | ✅ |
| 9. Platform liability | ✅ |  | ✅ |
| 10. Business liability | ✅ |  |  |
| 11. Limitation/exclusion | ✅ |  | ✅ |
| 12. Governing law |  |  | ✅ |
| 13. Jurisdiction/dispute resolution |  |  | ✅ |
| 14. Language requirements |  | ✅ |  |
| 15. Version changes | ✅ |  |  |
| 16. Consumer protection |  | ✅ | ✅ |
| 17. Differentiated Terms | ✅ |  |  |
| 18. Suspension | ✅ |  |  |
| 19. Reward characterisation | ✅ |  |  |
| 20. Subscription framework | ✅ |  |  |

---

## Unresolved Founder Decisions Requiring Attention

The following matters require Founder decisions before final Terms drafting:

| Issue | Question Reference | Recommendation |
| --- | --- | --- |
| **Dispute resolution mechanism** | Q8, Q13 | Founder to select: arbitration vs court; seat; rules |
| **Customer complaint handling** | Q8, Q16 | Founder to approve complaint process and timelines |
| **Notice periods** | Q6, Q15 | Founder to set: 30 days? 60 days? |
| **Fulfilment period on exit** | Q7 | Founder to set: 3 months? 6 months? 12 months? |
| **Subscription framework values** | Q20 | DEC-SUB-* decisions (prices, plans, intervals) |