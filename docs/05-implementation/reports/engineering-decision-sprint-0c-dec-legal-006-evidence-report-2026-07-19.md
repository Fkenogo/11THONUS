> **Title:** Engineering Decision Sprint 0C — DEC-LEGAL-006 Cross-Border Hosting & Data Residency Evidence Pack — Implementation Report
> **Date:** 2026-07-19
> **Classification:** Governance/Documentation Implementation Report — Not Legal Advice
> **Produces:** [DEC-LEGAL-006 Cross-Border Hosting and Data Residency Evidence Pack](../../00-governance/decisions/DEC-LEGAL-006-Cross-Border-Hosting-and-Data-Residency-Evidence-Pack.md)

---

## 1. Analysis performed

Before drafting, the documentation chain named by the task was reviewed: Platform Constitution, TRD (via its Engineering Blueprint consolidation), Engineering Blueprint, Cloud Environment & Deployment Strategy, DEC-TECH-005 Decision Brief, Cloud Region Evaluation Evidence Pack, Decision Register (`DEC-LEGAL-006` and `DEC-TECH-005` entries), and the Requirements Traceability Matrix. Findings are recorded in the evidence pack's own required §0 rather than duplicated here — summary: `DEC-LEGAL-006` exists because no Firebase/GCP region is physically inside Rwanda or Burundi, making every hosting candidate a cross-border transfer under both countries' statutes; it blocks `DEC-TECH-005` (and transitively Phase 1's `ENG-P1-001`) per the Decision Register's own text; it relates to `DEC-TECH-005` as the first (highest-priority) of the five region-selection criteria the Cloud Environment & Deployment Strategy §5 already establishes; and this task does not resolve legal compliance because that requires qualified counsel's professional judgment and direct regulator/provider confirmation this research process cannot substitute for.

This review also surfaced a substantial, already-existing, primary-source-grounded legal evidence chain from 2026-07-18 (evidence pack, 33-source register, founder brief, proposed updates) — including a full, direct, page-by-page review of Burundi's 55-article statute from rendered PDF images (no OCR available; the statute is a scanned document with no text layer). Per the task's implicit expectation of not re-deriving established governance and the explicit instruction to prioritize authoritative sources, the new pack cites and extends this prior work rather than re-researching Rwanda's and Burundi's domestic law from scratch.

## 2. Jurisdictions researched

- **Rwanda** (operator jurisdiction) — carried forward from the prior pack, not re-derived; no new Rwanda-specific research performed in this pass since nothing in this task's new research scope was found to bear on Rwanda's domestic-law position.
- **Burundi** (pilot market) — carried forward, with one new cross-check: a discrepancy between a 2025 secondary EAC source (describing Burundi as still "drafting its cyberlaws") and the already-primary-source-confirmed March 2026 statute, disclosed rather than resolved.
- **South Africa** — new in this pass, specifically for Malabo Convention ratification status (relevant to the `africa-south1` candidate).
- **Regional (African Union, EAC, COMESA)** — Malabo re-confirmed and extended (South Africa's status); EAC's developing cross-border framework newly researched; COMESA checked and found not applicable (absence-of-regulation finding, not an assumption).

## 3. Sources reviewed

**New in this pass (2026-07-19):**
- Google Cloud, Data Processing Addendum — `cloud.google.com/terms/data-processing-addendum` (official, fetched directly)
- Google Cloud, Standard Contractual Clauses / EU SCC pages — `cloud.google.com/terms/sccs`, `cloud.google.com/security/compliance/eu-scc` (official, via search synthesis)
- Google Cloud, Compliance offerings / certifications list — `cloud.google.com/security/compliance/offerings` (official, via search synthesis)
- Search results on South Africa's Malabo Convention ratification status (secondary reporting synthesizing the AU's own treaty-status page, not directly fetched from `au.int` in this pass — flagged as a re-verification recommendation)
- Search results on the EAC's Data Governance Policy Framework / cross-border data-flow mechanism, including EAC's own press releases (`eac.int`)
- Search results on COMESA data protection relevance (negative/absence finding)

**Cited by reference, not re-fetched** (primary sources the 2026-07-18 pack already directly reviewed, not expected to have changed): Rwanda's Law N° 058/2021 [S1]; Burundi's Loi n° 1/03 du 10 mars 2026 [S6], read in full from rendered page images; the AU Malabo Convention ratification record for Rwanda [S13]; Burundi's Loi n° 1/11 de 2009 [S10].

## 4. Key evidence

- Rwanda's Article 48/49/50 (authorization-or-alternative-ground plus written contract) and Burundi's Article 15/16 (adequacy-list-or-approved-safeguards) mechanisms apply **identically regardless of candidate region** — neither favors Europe over South Africa.
- **New finding:** Google Cloud's public SCC framework is built specifically around EU/UK/Swiss transfer law and does not reference Rwanda's or Burundi's own mechanisms — a material, previously-undisclosed gap now flagged for counsel.
- **New finding:** South Africa has signed but not ratified the Malabo Convention — closes an item the prior pack explicitly left open.
- **New finding:** the EAC is developing, but has not adopted, a regional cross-border data-flow framework — relevant context, but not an operative instrument, and would not cover transfers to either candidate region in any case since both are outside the EAC.
- **New finding:** no COMESA-specific data protection instrument relevant to Rwanda/Burundi was found.

## 5. Files created

- [`docs/00-governance/decisions/DEC-LEGAL-006-Cross-Border-Hosting-and-Data-Residency-Evidence-Pack.md`](../../00-governance/decisions/DEC-LEGAL-006-Cross-Border-Hosting-and-Data-Residency-Evidence-Pack.md) — the evidence pack.
- This report.

## 6. Files modified

None. No Decision Register entry, governance document, or hierarchy was touched — confirmed via `git status --short`; every previously-modified file in the working tree predates this task.

## 7. Commands executed

```
git branch --show-current / git rev-parse --short HEAD / git rev-parse --short origin/main
grep -n "^\*\*DEC-LEGAL-006" -A 15 docs/00-governance/decisions/decision-register.md
WebFetch: cloud.google.com/terms/data-processing-addendum
WebSearch: Google Cloud Standard Contractual Clauses international data transfers
WebSearch: Google Cloud data residency commitments / ISO 27001 / SOC 2 certifications
WebSearch: South Africa ratified African Union Malabo Convention
WebSearch: East African Community EAC data protection cross-border framework Rwanda Burundi
WebSearch: COMESA data protection framework Rwanda Burundi
python3 <scratchpad>/linkcheck.py
git diff --check
git status --short
grep -n "DEC-LEGAL-006.*CONFIRMED\|CONFIRMED.*DEC-LEGAL-006\|DEC-TECH-005.*CONFIRMED" <new file>
```

## 8. Dependencies added

None.

## 9. Configuration changes

**None.** No Firebase/GCP configuration touched, no region selected, no Decision Register status changed, no legal advice rendered, no legal conclusion drawn — explicitly verified via direct grep that no "CONFIRMED" or approval language attaches to either `DEC-LEGAL-006` or `DEC-TECH-005` anywhere in the new document.

## 10. Risks

- The EAC framework and the Malabo Convention ratification status are both time-sensitive facts that could change; the pack discloses its own currency limits (§6 of the pack) rather than presenting them as permanently settled.
- The South Africa/Malabo finding and the EAC framework findings rest on search-synthesized secondary reporting, not a directly-fetched primary AU/EAC document in every case — flagged in the pack itself (§3) as a re-verification recommendation, not silently treated as certain.
- A discrepancy between a secondary EAC source and the already-primary-source-confirmed Burundi statute was found and disclosed (§2 of the pack) rather than silently resolved in either direction.

## 11. Rollback instructions

The change is additive only — one new document plus this report. To roll back: delete `docs/00-governance/decisions/DEC-LEGAL-006-Cross-Border-Hosting-and-Data-Residency-Evidence-Pack.md` and this report, and remove the corresponding entry from `docs/changes/IMPLEMENTATION_CHANGES.md`. No existing file requires reverting.

## 12. Validation performed

- **Evidence sources:** every new claim traced to a specific fetched or searched source, cited by URL or by reference to the prior pack's own citation IDs (e.g., [S1], [S6], [S13]).
- **Document consistency:** the new pack's §0 pre-work analysis, §8 Engineering Implications, and §9 Founder Decision Summary were cross-checked for consistency with each other and with the Cloud Region Evaluation Evidence Pack's own findings — no contradiction found (e.g., the new pack does not claim either candidate region is legally cleared, consistent with the prior technical pack's "requires legal advice" framing).
- **No contradiction with governance:** the pack's §0 explicitly states it does not modify, approve, or supersede any Decision Register entry, and the Engineering Implications section (§8) confirms it does not alter the Engineering Implementation Programme's existing Phase 1 blocking structure.
- **Links:** full relative-link check — **1,455 relative links across 174 markdown files, 0 broken.**
- **Citations:** every carried-forward citation ID ([S1]–[S16], [T1]–[T18]) matches the prior pack's own Source Register; no new citation ID was invented without a corresponding source description in this report §3.

## 13. Final status

Evidence gathered. No legal advice given. No legal compliance determined. `DEC-LEGAL-006` remains `OPEN_LEGAL`; `DEC-TECH-005` remains `OPEN_ENGINEERING`. No hosting region selected. Ready for Founder review and referral to qualified Rwanda and Burundi legal counsel.
