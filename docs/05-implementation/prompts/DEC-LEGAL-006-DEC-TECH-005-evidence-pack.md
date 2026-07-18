> **Title:** DEC-LEGAL-006 / DEC-TECH-005 Evidence-Gathering Prompt (Not an Implementation Prompt)
> **Version:** 1.0 · **Status:** Ready to issue — not yet issued · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) — this prompt gathers evidence for DEC-LEGAL-006 and DEC-TECH-005; it does not resolve either
> **Source-of-truth path:** `docs/05-implementation/prompts/DEC-LEGAL-006-DEC-TECH-005-evidence-pack.md`
> **Last controlled update:** 2026-07-18 (Jurisdiction and Language Baseline Correction — created)

# DEC-LEGAL-006 / DEC-TECH-005 Evidence-Gathering Prompt

> **This is a decision-research prompt, not an implementation prompt.** It instructs a future research-capable agent to *gather and organize evidence* for two open decisions — it does not resolve DEC-LEGAL-006 or DEC-TECH-005, does not select a region, does not create a Firebase project, and does not implement Phase 1. Its own output is an evidence pack for Founder/Engineering Lead review, per the [DEC-TECH-005 Founder Decision Brief](../../00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md) §7's recommended next step.

---

## 0. Jurisdiction Baseline (Founder Clarification, 2026-07-18 — carried forward, not re-derived)

- **11thONUS is operated and managed from Kigali, Rwanda.** Rwanda is the operating jurisdiction.
- **Burundi is the pilot and first launch market**, not the operator's base.
- Future East African expansion is a later concern; do not presume any additional country shares Rwanda's or Burundi's legal or latency profile.
- **Supported product languages: English and French only.** This evidence pack does not add Swahili, Kinyarwanda, or Kirundi to any requirement, evaluation criterion, or architecture assumption.

## 1. Project Context

This prompt exists because [ENG-P0-002 Closure and Phase 0 Completion](../reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) found no Phase 1 work package Ready: `ENG-P1-001` is blocked on `DEC-TECH-005` (Firebase region), which itself depends on `DEC-LEGAL-006` (cross-border hosting position). Both decisions remain genuinely open in the live [Decision Register](../../00-governance/decisions/decision-register.md). This prompt is the evidence-gathering step recommended by the [DEC-TECH-005 Founder Decision Brief](../../00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md) §7 — it does not skip ahead to resolving either decision.

## 2. Objective

Produce two evidence packs — one legal, one technical — that give the Founder, legal adviser, and Engineering Lead everything needed to actually resolve DEC-LEGAL-006 and then DEC-TECH-005 through the normal [Decision Governance Workflow](../../00-governance/decision-governance-workflow.md) and [Decision Update Procedure](../../00-governance/decision-update-procedure.md). This prompt's own output is the evidence, not the decision.

## 3. Part A — DEC-LEGAL-006 Legal Evidence Pack

Prepare evidence distinguishing:

1. **Rwanda-based company/operator obligations** — what Rwandan law requires of a company operating and managing a digital platform from Kigali (data protection, business/commercial registration implications for data handling, sector-specific rules if any apply to loyalty/commerce platforms).
2. **Rwanda data-protection and cross-border-transfer requirements** — Rwanda's own data protection law and any conditions it places on transferring data it governs outside Rwanda.
3. **Burundi obligations applicable to pilot users and operations** — what Burundian law requires regarding data belonging to Burundi-resident pilot users, independent of where the operator is based.
4. **Cross-border processing involving all three of:** Rwanda (operator), Burundi (pilot users), and the candidate cloud-hosting jurisdiction (not yet selected — evaluate the legal *framework* for cross-border transfer generally, not tied to one specific region yet).
5. **Customer notice, consent, contractual and provider-disclosure requirements** — what must be disclosed to Burundi pilot users (and, if applicable, future Rwanda users) about where their data is processed and by whom. **This must include an explicit check of whether applicable Rwandan or Burundian law requires such notices, consent wording, contracts, privacy disclosures, or other regulated customer communication to be provided in a specific language** (e.g. a national or official language requirement for consumer-facing legal text) — do not assume English/French satisfies this without checking; do not presume any answer either way.
6. **Data-localization or sector-specific restrictions**, checked specifically against each of: identity information, verified-commerce/purchase records, loyalty data, purchase verification records, reward/redemption records, business-account records.
7. **Matters requiring qualified Rwanda and Burundi legal counsel** — flag explicitly anything this evidence pack cannot responsibly conclude without a licensed lawyer in the relevant jurisdiction; do not guess at a legal conclusion in place of counsel.
8. **Mandatory-language legal findings, reported separately and precisely.** If research surfaces that Rwandan or Burundian law (or sector regulation) requires any regulated communication — notices, consent, contracts, privacy disclosures — to be provided in a language not currently in the approved product scope (English/French), report this finding as its own labeled item: *"Legal compliance constraint — mandatory communication language."* Cite the specific legal source. This finding is a compliance fact to be reviewed by the Founder and qualified legal adviser — **it is not, by itself, approval to expand the product's interface language scope**, which remains governed separately by [DEC-L10N-001](../../00-governance/decisions/decision-register.md) and requires its own future governed decision (§5 below).

**Sourcing requirement:** use current primary and official sources wherever possible (national data-protection authority publications, official gazettes, government legal-framework portals) — not summarized secondary commentary alone. Every claim carries a citation.

**Explicit disclaimer requirement:** this evidence pack **must not be presented as, or substitute for, formal legal advice**. It is preparation for the Founder and legal adviser's own decision, per DEC-LEGAL-006's stated ownership (Founder + legal adviser).

## 4. Part B — DEC-TECH-005 Technical Evidence Pack

Once Part A establishes which jurisdictions/regions are legally admissible (even provisionally), compare the admissible Firebase/GCP candidate locations using **current official Google Cloud/Firebase documentation**. Evaluate, for each admissible candidate:

- Latency from **Kigali** (operating base) — not Bujumbura alone.
- Latency from **Bujumbura** (pilot market).
- Firebase Authentication regional availability.
- Firestore location and mode support (single-region vs. multi-region, and which multi-region options exist).
- Cloud Functions / Cloud Run regional availability.
- Cloud Storage location support.
- App Check compatibility in the candidate region.
- Scheduled/background function (Cloud Scheduler/Cloud Tasks) regional support.
- Backup and recovery implications of the candidate region.
- Data-transfer paths (how data moves between the region and end users in Rwanda/Burundi).
- Pricing and egress cost differences across candidates.
- Multi-region vs. single-region trade-offs for this platform's scale.
- Operational support characteristics (e.g., status-page history, known regional incidents).
- Fit for future East African growth beyond Rwanda/Burundi — without presuming a specific expansion country's legal profile (§0).
- Migration difficulty if the region ever needs to change after project creation.
- Whether **all** required services (Auth, Firestore, Functions, Storage, App Check, Scheduler) can share one compatible regional design, or whether a mixed-region design would be required.

**Output requirements:**

- An evidence table (one row per candidate region, one column per evaluation factor above).
- Every factual claim cited to its official source.
- Assumptions clearly and separately labeled from facts — never blended together.
- A shortlist of candidates produced **only after** legal admissibility (Part A) is known — a technically attractive region that is legally inadmissible is not shortlisted.
- A recommendation with explicit trade-offs stated (not a single answer presented as obvious).
- A proposed Decision Register update (drafted text for DEC-LEGAL-006 and DEC-TECH-005) — proposed only, not applied.

## 5. Part C — Language Constraint (Carried Forward, Not Re-Opened)

This evidence-gathering work must **not**, on its own authority, change the approved product-interface language scope:

> Approved product-interface languages: English and French only (Swahili, Kinyarwanda, Kirundi not currently in scope — per the existing, `CONFIRMED` [DEC-L10N-001](../../00-governance/decisions/decision-register.md)).

This constraint governs the **product's user-facing interface** (screens, in-app copy, notifications) — it does **not** mean the legal research in Part A §5/§8 should skip, presume, or avoid checking whether Rwandan or Burundian law separately *requires* a specific language for regulated legal communications (notices, consent, contracts, privacy disclosures). Those are two different questions:

1. **Product-interface language scope** (this section) — fixed at English/French per DEC-L10N-001; this prompt does not reopen it, and Part B's regional/technical evaluation must not add Swahili, Kinyarwanda, or Kirundi to any architecture consideration or evaluation criterion.
2. **Mandatory legal communication language** (Part A §5/§8) — an open legal-research question this prompt *requires* the agent to actually investigate and report on, precisely because it might require something the product-interface scope doesn't currently cover. A "yes, Rwandan/Burundian law requires X language for consumer notices" finding is a **legal compliance constraint to escalate to the Founder and legal adviser** — it does not itself authorize adding that language to the product, and it does not get suppressed, minimized, or pre-answered by this prompt.

Do not add Swahili, Kinyarwanda, or Kirundi (or any other language) to Phase 1 architecture, regional evaluation criteria, or any technical deliverable in this evidence pack. Any mandatory-language legal finding from Part A is reported as evidence for Founder/counsel review, not acted upon by this prompt.

## 6. Explicit Out of Scope

- No Firebase/GCP project creation.
- No deployment of any kind.
- No live Firebase project access.
- No change to the Decision Register — draft proposals only, applied by no one but the Founder/Engineering Lead through the normal Decision Update Procedure.
- No region selection or recommendation treated as final — this prompt produces evidence and a recommendation *for review*, not a resolution.
- No Phase 1 implementation work of any kind.
- No language beyond English/French introduced anywhere in the output.

## 7. Acceptance Criteria

- Part A evidence pack exists, cites primary/official sources, explicitly separates fact from inference, and carries the "not formal legal advice" disclaimer.
- Part A explicitly reports whether Rwandan or Burundian law requires any regulated communication (notices, consent, contracts, privacy disclosures) to be provided in a specific language — this question was actually investigated, not skipped, presumed, or answered by default. If such a requirement is found, it is reported as a labeled "Legal compliance constraint — mandatory communication language" finding, with its source cited, explicitly flagged for Founder and legal-adviser review, and explicitly **not** treated as authorization to change product-interface language scope.
- Part B evidence pack exists, covers every factor in §4, is presented as an evidence table, cites official Google Cloud/Firebase documentation, and separates assumptions from facts.
- No region is presented as selected or final.
- No Decision Register entry is modified — only a proposed update text is drafted.
- The product-interface language scope (English/French, per DEC-L10N-001) is not changed, expanded, or presented as reopened by this evidence pack, in either Part A or Part B. (This does not prohibit Part A from reporting a mandatory-legal-communication-language finding per the criterion above — that is a required legal-compliance finding, not a product-scope change.)
- Rwanda is correctly identified as the operating base and Burundi as the pilot/launch market throughout.

## 8. Required Tests / Validation

- Every citation resolves to a real, currently-live, official source (spot-checked, not assumed).
- A reviewer (Founder or Engineering Lead) can locate, for every factual claim, exactly which source supports it.
- The documentation relative-link checker passes if this pack is added under `docs/`.

## 9. Reporting Requirements

The evidence-gathering agent's report must include: the two evidence packs themselves (or their file locations if produced as separate documents); every source cited; explicit fact/assumption separation; an explicit yes/no/uncertain statement on whether Rwandan or Burundian law requires a specific language for regulated customer communications (per §3 item 5/8), with any "yes" or "uncertain" clearly labeled a legal compliance constraint for Founder/counsel review, not a product-scope change; the proposed (not applied) Decision Register update text for both DEC-LEGAL-006 and DEC-TECH-005; and a clear statement that neither decision has been resolved and no region has been selected.

---

## Status

This is a finalized, non-draft evidence-gathering prompt, prepared during the Jurisdiction and Language Baseline Correction (2026-07-18). It has **not been issued** to a research-capable agent — issuing it, and subsequently reviewing its output to actually resolve DEC-LEGAL-006 and DEC-TECH-005, remain distinct, not-yet-taken Founder/Engineering Lead actions.
