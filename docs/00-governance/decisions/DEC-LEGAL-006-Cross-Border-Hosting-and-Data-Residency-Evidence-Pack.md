> **Title:** DEC-LEGAL-006 — Cross-Border Hosting & Data Residency Evidence Pack
> **Version:** 1.0 · **Status:** Research evidence — not legal advice, not approved · **Classification:** Working (governance record — evidence)
> **Governing document:** [Decision Register](decision-register.md) — this pack prepares evidence for `DEC-LEGAL-006`; it does not resolve it, does not modify the register, and does not constitute legal advice
> **Source-of-truth path:** `docs/00-governance/decisions/DEC-LEGAL-006-Cross-Border-Hosting-and-Data-Residency-Evidence-Pack.md`
> **Last controlled update:** 2026-07-19 (Engineering Decision Sprint 0C — created)
> **Builds on, does not duplicate:** [DEC-LEGAL-006 Evidence Pack, 2026-07-18](evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md), its [Source Register](evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md), and [Founder Brief](evidence/DEC-LEGAL-006-DEC-TECH-005-founder-brief-2026-07-18.md) — this document cites and extends that primary-source legal research (Rwanda's Law N° 058/2021 read in full; Burundi's Loi n° 1/03 du 10 mars 2026 read in full, all 55 articles, from rendered page images) rather than re-deriving it, and adds the dimensions this task specifically requires that the prior pack did not cover: Google Cloud's DPA/SCCs/certifications, EAC/COMESA regional frameworks, and South Africa's Malabo Convention ratification status

# DEC-LEGAL-006 — Cross-Border Hosting & Data Residency Evidence Pack

> ⚠️ **This is not legal advice.** This pack was prepared by an AI research process using primarily official public sources, for review by the Founder and qualified Rwanda and Burundi legal counsel. It does not provide legal opinions, does not interpret legislation beyond publicly documented guidance, does not determine legal compliance, does not approve `DEC-LEGAL-006` or `DEC-TECH-005`, does not select a hosting region, and does not modify the [Decision Register](decision-register.md) or any other governance document.

---

## 0. Analysis Performed Before Writing (Required Pre-Work)

**Why `DEC-LEGAL-006` exists:** 11thONUS is operated from Rwanda and pilots in Burundi, but Google Firebase/Cloud has no data center physically located in either country (confirmed in the [Cloud Region Evaluation Evidence Pack](DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md) §2–§3). Any Firebase region choice is therefore necessarily a cross-border hosting arrangement under both Rwanda's and Burundi's data protection statutes. `DEC-LEGAL-006` exists to establish the legal position governing that arrangement — approved hosting-region categories, notice/contractual safeguards, and provider-disclosure obligations — as a precondition to `DEC-TECH-005`'s actual region choice, per the Decision Register's own text: `DEC-LEGAL-006`'s "Blocks: DEC-TECH-005."

**What it blocks:** per the [Decision Register](decision-register.md), `DEC-LEGAL-006` (`OPEN_LEGAL`, `D1`) blocks `DEC-TECH-005` (`OPEN_ENGINEERING`, `D1`, "Cloud Environment & Deployment Strategy"), which in turn blocks Phase 1's `ENG-P1-001` (Firebase project initialization) in the [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md). The [Cloud Region Evaluation Evidence Pack](DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md) (Engineering Decision Sprint 0B, the immediately preceding task) produced full technical evidence for seven candidate regions but explicitly could not resolve legal admissibility for any of them, since that is `DEC-LEGAL-006`'s scope, not `DEC-TECH-005`'s.

**How it relates to `DEC-TECH-005`:** the two decisions are deliberately sequenced, not merged. `DEC-TECH-005`'s Cloud Environment & Deployment Strategy §5 (Region Strategy) states five region-selection criteria in priority order: **legal compliance first**, then service completeness, operational maturity, disaster recovery, latency. This pack supplies evidence for exactly the first, highest-priority criterion. It does not re-perform the technical comparison (service support, latency, cost) — that evidence already exists in the Cloud Region Evaluation Evidence Pack and is cited, not repeated, here.

**Why this task does not resolve legal compliance:** per this task's explicit instruction and the Platform Constitution's own governance discipline (no document asserts authority it does not hold), determining actual legal compliance requires: (a) qualified Rwanda and Burundi legal counsel's professional judgment, which this research process cannot substitute for; (b) direct confirmation from regulatory bodies (Rwanda's NCSA, Burundi's Agence de protection des données à caractère personnel) on operational specifics no public document answers (e.g., the contents of Burundi's Ministerial adequacy list); and (c) direct confirmation from Google on facts its public documentation does not fully settle (e.g., Firebase Authentication's precise data-residency position). This pack gathers evidence and identifies the open questions those parties must answer — it does not, and cannot, answer them itself.

**Documents reviewed before drafting:** [Platform Constitution](../platform-constitution.md) (no region/provider-specific claim; CP-012 "Security by Default" is the constitutional principle this evidence must remain consistent with); TRD Chapters referenced by the Decision Register for `DEC-LEGAL-006`/`DEC-TECH-005` (TRD8, TRD20); [Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) §1.3/§6.4; [Cloud Environment & Deployment Strategy](../../06-engineering-governance/cloud-environment-and-deployment-strategy.md) §5; [DEC-TECH-005 Decision Brief](dec-tech-005-firebase-region-decision-brief.md); [Cloud Region Evaluation Evidence Pack](DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md); [Decision Register](decision-register.md) `DEC-LEGAL-006` and `DEC-TECH-005` entries; [Requirements Traceability Matrix](../requirements-traceability-matrix.md) (no direct `DEC-LEGAL-006` traceability row was found — its effect flows through `DEC-TECH-005`'s `OTD-003` row, not a row of its own); and the full 2026-07-18 legal evidence chain (evidence pack, source register, founder brief, proposed updates).

---

## 1. Rwanda

**Carried forward, re-confirmed, not re-derived** (full detail and article-level citations in the [prior evidence pack](evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md) §2, sourced from Rwanda's Law N° 058/2021 of 13/10/2021, read via [S1]):

- **Personal data protection framework:** Law N° 058/2021, in force since 15 October 2021.
- **Regulatory authority:** the National Cyber Security Authority (NCSA), through its Data Protection Office (launched 31 March 2022).
- **Data controller obligations:** registration with the NCSA before processing (Art. 29–31, ~30-working-day certificate turnaround); privacy notices enabling data-subject understanding (Art. 42); data subject rights with 30/60-day response windows (Art. 18–24); breach notification to the NCSA within 48 hours, full report within 72 hours, and subject notification for "high risk" breaches (Art. 43–45); retention limited to processing purpose with defined extensions (Art. 52).
- **Cross-border transfer provisions — the central finding:** **Article 50 requires storage in Rwanda by default**; storage outside Rwanda requires **NCSA authorization**. **Article 48** permits transfer outside Rwanda via NCSA authorization plus adequate safeguards, data-subject consent, or a specific listed ground (contract performance, vital interests, legal claims, public interest, legitimate interests). **Article 49** requires a **written contract** governing any transfer, and preserves the NCSA's authority to prohibit or suspend a transfer.
- **Cloud hosting implications:** because no Firebase/GCP region is physically located in Rwanda (confirmed in the Cloud Region Evaluation Evidence Pack), **any** hosting choice is a cross-border transfer requiring either NCSA authorization or an Article 48 alternative ground, documented per Article 49.
- **Public guidance:** the NCSA's Registration Guide for Data Controllers and Processors [S3] documents the registration process and a 15-working-day notification requirement for changes such as commencing a new cross-border transfer.

**No new Rwanda-specific research was performed in this pass** — the prior pack's direct review of the primary statutory text (Law N° 058/2021, read via RwandaLII [S1]) remains the evidentiary basis, and nothing in this task's additional research scope (Google Cloud terms, EAC/COMESA frameworks) was found to alter Rwanda's domestic-law position. **Established law**, not draft law.

---

## 2. Burundi

**Carried forward, re-confirmed, not re-derived** (full detail and article-level citations in the [prior evidence pack](evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md) §3, sourced from a direct, full 55-article review of Burundi's primary statutory text [S6]):

- **Existing privacy legislation — established law, not draft:** **Loi n° 1/03 du 10 mars 2026 portant protection des données à caractère personnel**, promulgated 10 March 2026, in force from that date (Art. 55). This is Burundi's first comprehensive personal data protection statute — prior to this law, **no comparable comprehensive data-protection regime existed** (absence of regulation was the prior state; this is now established law).
- **Personal data provisions:** GDPR-influenced structure — six lawful-processing grounds (Art. 8), sensitive-data restrictions (Art. 9–10), processor-contract requirements (Art. 11–13), a full data-subject-rights chapter (Art. 17–33), and heavier obligations for "major controllers" (200+ employees, public authorities, or specific high-risk-data entities — 11thONUS does not plausibly meet this threshold at pilot scale, per the prior pack's inference, not a confirmed conclusion).
- **Cross-border hosting considerations — the central finding, an adequacy-based mechanism, not Rwanda-style localization:** Art. 15 permits transfer to a foreign State/organization only where it ensures a "sufficient level of protection," established either via a **Ministerial Order adequacy list** (Art. 15 ¶3, **contents not located in either research pass**) or **safeguards approved by Burundi's data protection authority** (Art. 15 ¶4, operational status of that authority **not confirmed** in either pass). Adequacy is assessed (Art. 16) against rule-of-law/human-rights record, presence of an independent DPA in the destination, and its international data-protection commitments.
- **Consumer protection implications:** a separate, pre-existing statute, Loi n° 1/11 de 2009, provides general consumer protection extended to e-commerce (clear pre-purchase information, fraud/misleading-advertising protection), enforced by the National Consumer Protection Commission (CNCP) — not re-reviewed in this pass; its "clear information" standard's practical implications (e.g., language) remain an open counsel question carried forward from the prior pack.
- **Regulatory environment:** the law establishes the **"Agence de protection des données à caractère personnel,"** but leaves its missions/composition/operating procedures to a separate implementing decree **not located in either research pass** — whether the Agency is currently operational (accepting registrations, declarations, or safeguard approvals) remains unconfirmed.
- **Compliance timing — a real, running clock:** Art. 53 requires private-sector compliance within 6 months of the law's entry into force, i.e., approximately **10 September 2026** — a deadline independent of when `DEC-LEGAL-006`/`DEC-TECH-005` are resolved.

**Distinguishing established law / draft law / absence of regulation, as this task explicitly requires:**

| Status | Applies to |
|---|---|
| **Established law** | Loi n° 1/03 du 10 mars 2026 (data protection, in force since promulgation); Loi n° 1/11 de 2009 (general consumer protection, pre-existing) |
| **Draft/developmental, not yet in force** | The EAC's regional Data Governance Policy Framework and cross-border data-flow mechanism (§3 below) — Burundi's own national law is separately already in force and does not depend on the EAC framework's completion |
| **Absence of regulation (implementing detail, not the law itself)** | The Art. 15 ¶3 Ministerial adequacy list (not confirmed to exist yet); the Agency's implementing decree (not located) — these are gaps in *implementing* material under an already-enacted law, not an absence of the underlying law itself |

**One new finding from this pass's broader research (§3 below), disclosed as a caveat rather than resolved:** a 2025-dated secondary source (EAC press material) describes Burundi as "currently drafting its cyberlaws in conformity with the agreed [EAC] Framework" — worded as though Burundi's data-protection law were still in preparation. **This is inconsistent with the prior pack's direct, page-by-page primary-source review of Burundi's already-promulgated 10 March 2026 statute.** Where a secondary, general-regional source conflicts with a directly-reviewed primary national statute, this pack treats the primary source (the statute itself, read in full) as controlling — the secondary source is most plausibly describing separate, broader "cyberlaws" (e.g., cybercrime, cybersecurity infrastructure legislation) distinct from the data-protection law already confirmed in force, or reflects information that predates the March 2026 promulgation. **This discrepancy is disclosed for counsel's awareness, not resolved by this pack.**

---

## 3. Regional Frameworks

**African Union Convention (Malabo Convention):** carried forward from the prior pack — Rwanda ratified the Malabo Convention on 21 November 2019 [S13]. **New in this pass:** South Africa (the jurisdiction of the `africa-south1` candidate region) has **signed but not ratified** the Malabo Convention, reportedly due to concerns about compatibility with South Africa's own comprehensive data-protection statute, the Protection of Personal Information Act (POPIA) (source: search-engine synthesis of secondary reporting — not a primary AU treaty-status document directly fetched in this pass; the AU's own treaty-ratification page, `au.int/en/treaties/african-union-convention-cyber-security-and-personal-data-protection`, remains the authoritative source and should be directly re-checked before reliance). This closes an open item the prior pack explicitly flagged ("Malabo Convention ratification by the destination country... was not independently checked"). Burundi's own ratification status was reported by the prior pack as "signed, ratification status not confirmed" [S13] — **not independently re-verified in this pass.**

**EAC (East African Community) instruments — new research this pass, applicable but developmental:** the EAC (comprising Rwanda, Burundi, Kenya, Uganda, Tanzania, South Sudan, Somalia, and the DRC) is actively developing a **regional Data Governance Policy Framework and a "Mechanism for Cross-border Data Flows,"** with a Technical Working Group meeting held September 2025 in Dar es Salaam. This mechanism is explicitly designed to draw on the AU Malabo Convention, OECD Privacy Framework, Convention 108+, the APEC Privacy Framework, and the EU GDPR as reference points, and is intended to provide a channel for lawful data flows "even in the absence of harmonized regulations" among member states. **As of the sources reviewed in this pass, this EAC framework is still in development — a draft/developmental regional instrument, not yet a binding, adopted cross-border data-transfer mechanism.** As of the same sources, only 5 of 8 EAC Partner States (Kenya, Rwanda, Somalia, Uganda, Tanzania) have established dedicated data protection authorities. **Engineering/governance-relevant implication, not a legal conclusion:** an EAC-wide mechanism, if and when adopted, could eventually provide an alternative or complementary basis for Rwanda–Burundi data flows specifically (as distinct from flows to a third-country cloud region) — but it does not currently exist as an operative legal instrument this pack can rely on, and it does **not** address the Rwanda/Burundi-to-cloud-provider transfer question (to Europe or South Africa) that `DEC-LEGAL-006` is actually about, since both candidate hosting regions are outside the EAC.

**COMESA (Common Market for Eastern and Southern Africa) instruments — checked, not found applicable:** **no COMESA-specific data protection or cross-border data-transfer instrument was identified in this research pass as relevant to Rwanda or Burundi.** Regional data-governance activity affecting both countries is occurring through the EAC, not COMESA, per the sources reviewed. This is an **absence-of-regulation finding** (nothing found), not a claim that COMESA membership is irrelevant to 11thONUS for other (non-data-protection) purposes, which this pack does not assess.

**Other regional frameworks:** none beyond Malabo and the EAC framework were identified as directly relevant to Rwanda/Burundi data protection in this pass's research scope.

---

## 4. Google Cloud (New Research This Pass — Not Covered by the Prior Legal Pack)

**Data Processing Addendum (DPA):** Google Cloud's DPA (`cloud.google.com/terms/data-processing-addendum`) governs how Google processes "Customer Data" and "Customer Personal Data" across Google Cloud services, applying for the service term and until data deletion. **Fact:** it defines a shared-responsibility model (§ below) and references data-location commitments "under the Service Specific Terms" and transfer commitments "under Appendix 3 (Specific Privacy Laws)" — **the fetched content did not return the full text of Appendix 3 or Appendix 4 in this pass**; this is a stated tool/retrieval limitation, not a finding that those appendices don't exist or don't apply.

**Standard Contractual Clauses (SCCs):** **Fact, directly relevant to this pack's scope:** Google Cloud's published SCC framework (`cloud.google.com/terms/sccs`, `cloud.google.com/security/compliance/eu-scc`) is built around **EU/UK/Swiss data-transfer law specifically** — the 2021 European Commission SCCs, plus the EU-U.S., UK, and Swiss-U.S. Data Privacy Framework as alternative transfer solutions (adopted September 2023–2024). **Google Cloud's public SCC documentation, as reviewed in this pass, does not reference Rwanda's Article 48/49/50 authorization-and-contract mechanism or Burundi's Article 15/16 adequacy mechanism by name.** This is a **material gap disclosed to counsel, not resolved by this pack**: it is not established, from the sources reviewed, whether Google's standard EU-oriented SCCs would themselves satisfy Rwanda's Article 49 "written contract" requirement or Burundi's Article 15 ¶4 "approved safeguards" requirement, or whether a Rwanda/Burundi-specific contractual instrument would need to be separately negotiated. **This is an outstanding question for legal counsel (§7), not an assumption this pack makes either way.**

**Data residency documentation:** **Fact:** Google Cloud publishes a "Data regions" capability allowing customers to select a storage/processing region and, for supported services, restrict data access-for-support to a chosen region — consistent with, and not contradicting, the region-by-region service findings already established in the Cloud Region Evaluation Evidence Pack. **This is a technical capability description, not a legal residency guarantee** — Google's own terms (per the DPA summary above) reserve the ability to update data locations, and "data regions" is a product feature, not itself a compliance certification.

**Security certifications:** **Fact, directly verified:** Google Cloud holds ISO/IEC 27001, ISO/IEC 27017, ISO/IEC 27018, ISO/IEC 27701, ISO/IEC 27701, SOC 1/2/3 reports, PCI DSS, and multiple other certifications (`cloud.google.com/security/compliance/offerings`), available on demand via Google's Compliance Reports Manager. **None of these certifications is Rwanda- or Burundi-specific** — they are general international information-security management standards, useful as general evidence of "appropriate technical and organizational measures" (a phrase both Rwanda's and Burundi's statutes use, per §1–§2) but **not, by themselves, a legal finding that either country's specific statutory requirements are satisfied** — that determination remains counsel's, not this pack's.

**Regional commitments:** no Rwanda- or Burundi-specific regional commitment from Google was identified — consistent with the underlying technical fact (no Firebase/GCP region physically located in either country) already established.

**Customer responsibilities / shared responsibility model:** **Fact, per the DPA:** Google is responsible for implementing and maintaining security measures, encrypting customer data, restricting its own employee/contractor access, notifying customers of incidents, and (per instruction) deleting data within a stated window. **The customer (11thONUS) is responsible for**: using the service and any additional security controls appropriately, securing its own authentication credentials, backing up data outside Google's systems, responding to data-subject rights requests directly (Google forwards but does not resolve them), and — where 11thONUS itself acts as a processor for a third-party controller (a scenario the prior legal pack flagged as a genuine open question for the participating-business relationship, §1 of that pack) — warranting that controller's authorization for the transfer and any sub-processor engagement. **Engineering-governance relevance:** this shared-responsibility split means Rwanda's Article 49 written-contract requirement and Burundi's Art. 11–13 processor-contract requirement are **11thONUS's own obligations to satisfy** (via its agreement with Google and/or its own privacy documentation), not something Google's standard terms automatically discharge on 11thONUS's behalf.

---

## 5. Cross-Border Hosting — Technical Implications Only

**No legal conclusions in this section**, per the task's explicit instruction — implications only, building on §1–§4 above and the Cloud Region Evaluation Evidence Pack's technical findings:

- **Hosting customer data outside Rwanda:** technically unavoidable for any Firebase/GCP candidate (confirmed — no candidate is inside Rwanda). This means Rwanda's Article 48/49/50 mechanism is triggered **regardless of which candidate is chosen** — it is not a differentiator between Europe and South Africa, only a universal precondition.
- **Hosting Burundi customer data outside Burundi:** equally unavoidable for any candidate; triggers Burundi's Article 15/16 adequacy mechanism universally, for the same reason.
- **Hosting in Europe (e.g., `europe-west1`, `eur3`):** technical implication — Google's SCC/DPF framework (§4) is most directly applicable here, since it was built for EU-oriented transfers; whether that maps onto Rwanda's/Burundi's own mechanisms is the open question already flagged (§4). Operational implication: this is the most service-complete, lowest-operational-complexity candidate per the Cloud Region Evaluation Evidence Pack §3/§10.
- **Hosting in South Africa (`africa-south1`):** technical implication — South Africa's non-ratification of Malabo (§3, new finding) means the "same continent, Malabo-ratifying" argument the prior pack tentatively raised does not apply as cleanly as it might have; South Africa's own domestic law (POPIA, not independently reviewed in this pass) governs data processing that occurs there, a separate technical/legal layer neither this pack nor the prior pack has assessed. Operational implication: per the Cloud Region Evaluation Evidence Pack §3, this candidate carries the Cloud Scheduler/Cloud Tasks service gap independent of any legal consideration.
- **Disclosure implications (technical, not legal):** whichever candidate is chosen, 11thONUS's privacy/terms documentation would need to accurately name the actual hosting jurisdiction and describe the transfer mechanism relied upon (Rwanda's NCSA-authorization-or-alternative-ground, and Burundi's adequacy-or-approved-safeguards) — a factual accuracy requirement independent of what that documentation's specific legal content must say, which remains counsel's determination.

---

## 6. Risks

**Technical risks:**
- Firebase Authentication's precise data-residency position remains unconfirmed by any source reviewed across both research passes (Fact: this is a stated gap, not an assumption of a specific answer).
- Google's SCC framework's applicability to Rwanda/Burundi's specific statutory mechanisms is unconfirmed (§4) — a technical/contractual integration risk, not purely a legal one.

**Governance risks:**
- `DEC-LEGAL-006` remaining open indefinitely continues to block `DEC-TECH-005` and, transitively, all of Phase 1 — a real delivery-schedule risk already disclosed in the Cloud Region Evaluation Evidence Pack and the Engineering Baseline Declaration.
- The EAC regional framework (§3) is actively evolving; a governance risk exists that this pack's snapshot becomes outdated if the EAC framework or Burundi's implementing decree is adopted before `DEC-LEGAL-006` is resolved — **Assumption, not fact:** this pack assumes no such adoption has occurred as of 2026-07-19, based on the most recent sources found (September 2025), but does not claim to have checked for anything more recent.

**Compliance risks:**
- Burundi's private-sector compliance deadline (~10 September 2026, Art. 53) is a running clock independent of when `DEC-LEGAL-006` is resolved — a genuine compliance-timing risk already flagged in the prior pack and repeated here because it remains unresolved.
- The Ministerial adequacy list's contents and the Burundi Agency's operational status remain unknown (Fact: not located in either research pass) — meaning Burundi-side transfer admissibility cannot currently be assessed for **any** candidate region, European or South African alike.

**Operational risks:**
- If Google's standard SCCs do not, on counsel's review, satisfy Rwanda's Article 49 or Burundi's Article 15 ¶4 requirements, a bespoke contractual addendum may need to be negotiated with Google — a timeline and commercial-leverage risk this pack cannot assess (11thONUS's negotiating position with Google as a small platform is a commercial question outside this pack's scope).

---

## 7. Outstanding Legal Questions (Checklist for Counsel — Not Answered Here)

**Rwanda:**
- [ ] Does Article 3's extraterritorial scope reach Burundi-resident data subjects' data processed by the Rwanda-based controller?
- [ ] Is NCSA "authorization for offshore storage" (Art. 50) part of ordinary controller/processor registration, or a separate application — and what is the realistic timeline/cost?
- [ ] Could Article 48's "legitimate interests" ground be relied upon with a documented assessment, or does NCSA require full Article 48(a) authorization for a platform at 11thONUS's scale?
- [ ] Does Article 7's "understandable" consent-language standard require Kinyarwanda in practice for a mass-market consumer product, or is English/French defensible?
- [ ] What specific technical/security-measure standard applies under Rwanda's general security obligation?
- [ ] Would Google Cloud's standard SCC/DPA framework satisfy Article 49's "written contract" requirement, or is a Rwanda-specific contractual instrument needed?

**Burundi:**
- [ ] Has the Art. 15 ¶3 Ministerial adequacy list been issued, and what does it contain?
- [ ] Is the Agence de protection des données à caractère personnel operationally accepting registrations/safeguard-approval requests?
- [ ] Does 11thONUS's actual Burundi-pilot technical architecture use "processing means located on Burundian territory" (Art. 2), triggering a local-representative requirement?
- [ ] Does 11thONUS's scale and purpose confirm it falls outside the Art. 4(12°) "major controller" threshold?
- [ ] Does Loi n° 1/11 de 2009's "clear information" consumer-protection standard require Kirundi for consumer-facing notices?
- [ ] What is the realistic minimum compliance posture before the ~10 September 2026 deadline (Art. 53), independent of `DEC-LEGAL-006`'s resolution timing?
- [ ] Would Google Cloud's standard SCC/DPA framework satisfy Art. 15 ¶4's "approved safeguards," or does Burundi's Agency need to separately approve them?

**Cross-cutting / general:**
- [ ] Is customer consent required (in addition to, or instead of, a regulator-authorization or adequacy pathway) for either jurisdiction?
- [ ] Are Google's standard contractual clauses sufficient for both Rwanda's and Burundi's mechanisms, or is a bespoke addendum required?
- [ ] Are regulator notifications required before go-live (as opposed to only upon breach), and on what timeline, for each jurisdiction?
- [ ] Are privacy-policy updates required to name the specific hosting jurisdiction, and with what level of technical detail?
- [ ] Are Google's processor/DPA terms sufficient to discharge 11thONUS's own processor-oversight obligations under both statutes, or does 11thONUS need additional documentation?
- [ ] Does South Africa's non-ratification of the Malabo Convention (§3) materially affect the legal analysis for the `africa-south1` candidate, beyond what Rwanda's/Burundi's own domestic statutes already require?
- [ ] Does the EAC's developing cross-border data-flow framework (§3) create any near-term obligation or opportunity relevant to this decision, or is it safely treated as not-yet-applicable?

**This checklist is not answered by this pack. It is the deliverable this pack was asked to produce for counsel.**

---

## 8. Engineering Implications

**Based on all evidence gathered — no legal conclusions:**

- **No candidate region is technically ruled out by this pack's findings.** Neither Europe nor South Africa was found, in either research pass, to be affirmatively legally prohibited — every classification in the prior pack's admissibility table (§8 of that pack, carried forward unchanged) remains "potentially admissible, pending confirmation," for both jurisdiction categories.
- **Additional documentation is likely required regardless of which candidate is chosen:** at minimum, a written transfer contract satisfying Rwanda's Article 49 and Burundi's Article 15 ¶4 (§4's open question about whether Google's standard SCCs suffice), and privacy/terms documentation accurately disclosing the hosting jurisdiction (§5). This is true for **every** candidate — it does not favor Europe over South Africa or vice versa.
- **Engineering cannot proceed on `ENG-P1-001` (Firebase project initialization) until `DEC-LEGAL-006` and `DEC-TECH-005` are both resolved** — this is the Engineering Implementation Programme's existing, unchanged blocking structure; this pack does not alter it.
- **Engineering CAN already proceed, independent of `DEC-LEGAL-006`'s resolution, on:** everything already unblocked by Engineering Sprint 0A's Cloud Environment & Deployment Strategy — environment architecture, promotion-model tooling, and infrastructure-access governance are not gated by this decision at all (per that document's own scope boundary with `DEC-TECH-005`); and any Phase 0 or pre-Phase-1 work that does not require a live Firebase project (already completed, per the Engineering Baseline Declaration's status table).
- **No architecture change is implied or recommended by this pack.** The evidence gathered does not suggest the Version 1 Engineering Blueprint's architecture needs to change regardless of which jurisdiction is eventually cleared.

---

## 9. Founder Decision Summary (One-Page Executive Summary)

**What we know:**
- Rwanda requires either regulator authorization or a specific alternative legal ground, plus a written contract, before data can be stored outside Rwanda — this applies to every hosting candidate equally, since none is inside Rwanda.
- Burundi requires the destination to be on an approved list or to have regulator-approved safeguards — same universal applicability.
- Burundi's data protection law is real, in force since 10 March 2026, and carries a private-sector compliance deadline of roughly 10 September 2026 — a clock already running.
- Google Cloud's standard contractual safeguards (SCCs) are built around EU/UK/Swiss transfer law specifically — they were not found, in this pass, to explicitly address Rwanda's or Burundi's own transfer mechanisms.
- South Africa (home of the `africa-south1` candidate) has signed but **not ratified** the African Union's Malabo Convention.
- The East African Community is developing — but has not yet adopted — a regional cross-border data-flow framework; it does not yet exist as something we can rely on, and would not by itself cover transfers to Europe or South Africa in any case, since both are outside the EAC.
- No COMESA-specific data protection instrument relevant to us was found.

**What remains uncertain:**
- The actual contents of Burundi's approved-country list (if one exists) and whether its new data protection agency is operationally accepting approvals.
- Whether Google's standard SCCs would satisfy Rwanda's or Burundi's specific contractual/safeguard requirements, or whether a custom contract needs to be negotiated.
- Where Firebase Authentication's underlying data actually resides — Google's documentation doesn't say.
- Whether our Burundi pilot technical setup (e.g., any local payment/SMS integration) triggers Burundi's local-representative requirement.

**What legal counsel should confirm** (see §7's full checklist): the realistic Rwanda NCSA authorization pathway and timeline; Burundi's adequacy-list contents and Agency operational status; whether Google's standard contracts are sufficient for either jurisdiction or a bespoke agreement is needed; and the minimum compliance posture needed before Burundi's September 2026 deadline, independent of when this decision is finalized.

**What engineering can already proceed with, independent of this decision:** everything the Cloud Environment & Deployment Strategy (Engineering Sprint 0A) already unblocked — environment architecture, deployment-promotion tooling, and infrastructure-access governance. What remains blocked is specifically Firebase project creation and everything sequentially downstream of it.

**Nothing found in this research says this cannot be done.** Both jurisdictions provide a documented legal pathway for cross-border hosting — the open items are about *which specific pathway, with what paperwork, and on what timeline*, not about whether a pathway exists at all.

---

**This evidence pack is research support and is not formal legal advice. `DEC-LEGAL-006` remains `OPEN_LEGAL`. No hosting jurisdiction is approved, and no region is selected, by this document.**
