# DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001 — Restore Evidence Threshold, Complete Located Primary-Source Verification, Preserve Pan-African Portability

> **Task:** `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001` · **Date:** 3 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction
> **Scope:** Correct PR #215 before Founder approval. Primary-law verification and classification correction only. **No Part VIII drafting. No jurisdiction overlay drafting. No Terms configuration. No app/code changes. No self-merge.**

---

## 1. Entry PR #215 state

`gh pr view 215 --json headRefOid,state,mergeable,mergeStateStatus` → `state: OPEN`, `headRefOid: c19b2b726da1b5263970670d6af06850a0d75229`, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.

## 2. Entry head SHA

`c19b2b726da1b5263970670d6af06850a0d75229`.

## 3. Entry CI/review state

`gh pr checks 215` → `Build, Lint, Test, Emulator Validation` — `pass` (6m11s). Automated review: `gh pr view 215 --json comments` returned one Codex comment stating Codex's own code-review usage limit had been reached — **no automated review was actually performed** on this head; this is recorded as "no review available," not "no findings." Confirmed no other reviews or comments existed.

## 4. Correction strategy

1. Re-inspect the three D→C classifications the original report made (row 3 Burundi e-contracting; row 8 Rwanda liability cap; row 9 Rwanda indemnity) against the governed evidence threshold.
2. Provisionally revert all three to D.
3. Directly read the underlying primary statutes already located by the original task (Burundi Law 1/22's substantive electronic-transactions chapter; Rwanda Law 45/2011's liability/public-order/impossibility chapters; Burundi Code Civil Livre III's force-majeure articles).
4. Reclassify strictly from what the direct read supports — not by defaulting back to the prior values.
5. Perform an explicit portability review distinguishing jurisdiction-specific findings from any implied universal rule.
6. Correct the report, evidence pack, and changes log in place; add this correction report.
7. Commit to the existing PR #215 branch, push, and report the new head/CI state — no merge.

## 5. Evidence-threshold defect confirmed

Confirmed on inspection: the original report's own text for row 8/9 Rwanda stated the primary PDF was "located but not read... flagged as primary source located but not directly read — residual verification item," while still recording a C classification based solely on a secondary source (Chambers and Partners). Row 3 Burundi's original C rested on reading only Art. 1–3 (definitions/scope), not the statute's substantive electronic-contracting chapter (Art. 137–146). Both are confirmed defects under the governed standard: "if the report itself says the relevant primary law must still be read before the conclusion can safely be relied upon for drafting, the classification is not yet C."

## 6. Burundi Law 1/22 primary source

`https://arct.gov.bi/wp-content/uploads/2024/09/LOI_COMMUNICATIONS-ELECTRONIQUES.pdf` — official regulator (ARCT) publication of Loi N°1/22 du 22 août 2024 portant Code des Communications Électroniques et Postales. Fetched and read via page-image extraction (the PDF's text layer was not extractable by the automated `WebFetch` text pipeline; direct visual reading of the rendered page images was used instead, as in the original task).

## 7. Exact Burundi articles read

Art. 1–3 (pp. 1–11, previously read); **newly read this correction:** Art. 137–146 (pp. 32–34), comprising Chapitre VII "Des Transactions par Voie Électronique," Sections 1–3.

## 8. Burundi electronic-contracting findings

Art. 137: heightened advanced-signature-plus-qualified-certificate standard applies only where another law formally requires a signature for the act — not a general rule for ordinary consensual contracts. Art. 138: data-message evidentiary admissibility, probative force by reliability/identification — mirrors LEG-FD-03. Art. 139–140: contract/consent validity not deniable for electronic form. Art. 141: receipt-acknowledgment mechanic. Art. 142 and 145–146: expressly consumer-facing ("consommateur"), not B2B. Art. 143: e-commerce conflict-of-laws rule (state of establishment). Art. 144: operator-disclosure duty, consistent with the existing row-11 A classification. No forced-scrolling, retyping, or special B2B consent-wording requirement found.

## 9. Burundi e-contracting final classification

**D → C**, primary-text-verified (see report §14, evidence pack entry 2). Residual: no exhaustive negative search against the Commercial Code (1993) for a signature formality on this instrument type; 2026 Data Protection Law "demonstrable consent" language not cross-checked.

## 10. Rwanda Law 45/2011 primary source

`https://www.minecofin.gov.rw/fileadmin/user_upload/Minecofin/Publications/LAWS/Other_laws/LAW__NO_45.2011_OF_25.11.2011_GOVERNING__CONTRACTS_IN_RWANDA_.pdf` — official trilingual (Kinyarwanda/English/French) Official Gazette n° 04bis of 23/01/2012 publication.

## 11. Exact Rwanda liability provisions read

Art. 58 ("Non-performance of a clause of the contract on the grounds of public order"), Art. 59 (criteria for evaluating the interest in performance), Art. 60 (criteria for evaluating a public-order motive), Art. 61 (bases for a public-order motive), Art. 65 (contracts bind by "effects that equity, practices or law impute" and "shall be performed in good faith"), Art. 91 (factors extinguishing the obligation to pay damages on repudiation).

## 12. Rwanda liability findings

No standalone liability-exclusion-clause-validity article exists. The governing mechanism is Art. 58–61's general public-order unenforceability doctrine — a case-specific balancing test (weight of the relevant law/precedent, severity/deliberateness of misconduct, connection to the clause), not the categorical "fraud/gross-negligence/wilful-misconduct exclusion clauses are void" bright-line rule the original report's secondary source (Chambers and Partners) had asserted. This doctrine's likely direction is consistent with, not contradictory to, LEG-FD-15's existing non-excludable-liability carve-out.

## 13. Rwanda liability final classification

**D → C**, primary-text-verified, **moderate confidence** (report §14, evidence pack entry 3). The zero-fee Business cap remains unresolved as a separate matter, untouched.

## 14. Exact Rwanda indemnity-relevant provisions read

Same Art. 58–61 (Art. 58's text — "a promise or other clause of a contract" — is broad enough to reach indemnity provisions independently of the liability-cap analysis, per the correction task's own instruction not to conflate the two).

## 15. Rwanda indemnity findings

No standalone Rwandan "indemnity" statute or article exists; indemnity-clause enforceability is governed by the same Art. 58–61 general doctrine as any other contract clause. §20's four-subject indemnity architecture is not broadened; this finding only confirms it is not undermined.

## 16. Rwanda indemnity final classification

**D → C**, primary-text-verified, moderate confidence, independently assessed from the liability-cap question per instruction.

## 17. Rwanda Article 92/force-majeure findings

Art. 92: performance-impossibility (including force majeure) extinguishes the obligation "unless circumstances indicate otherwise" — an explicit default, displaceable rule. Art. 93–97 elaborate specific scenarios without mandating notification/mitigation/suspension mechanics. Nothing found compels a result inconsistent with the governed earned-reward-survival architecture (`DEC-LOY-011`, FD-2).

## 18. Rwanda force-majeure final classification

**D → C**, primary-text-verified, higher confidence than rows 8–9 (explicit default rule vs. discretionary balancing test).

## 19. Burundi Code Civil primary source

`http://cejp.bi/sites/default/files/Code%20Civil%20Livre%20III.pdf` — hosted by CEJP (Centre d'Études et de Prospective Juridique), an official/institutional Burundian legal-documentation body. Downloaded and text-extracted directly via `pdftotext` (this PDF's text layer *was* machine-extractable, unlike the two statutes above).

## 20. Exact Burundi force-majeure/impossibility articles read

Art. 45, 46, 47 — confirmed as Burundi's own article numbers via direct text extraction and cross-check against the document's internal index ("Cas fortuit, 46." / "Force majeure, 46."), **not assumed from French Code Civil numbering**.

## 21. Burundi force-majeure findings

Art. 46: "Il n'y a lieu à aucuns dommages-intérêts lorsque, par suite d'une force majeure ou d'un cas fortuit, le débiteur a été empêché de donner ou de faire ce à quoi il était obligé, ou a fait ce qui lui était interdit." A general force-majeure/cas-fortuit exoneration doctrine, independently sourced from Rwanda's Art. 92 (a different statute, read separately) — the two happen to align in substance but are not treated as evidence of a pan-African rule (see §33).

## 22. Burundi force-majeure final classification

**D → C**, primary-text-verified.

## 23. Existing Burundi mandatory-disclosure A verification

Not reopened. Burundi Law 1/22 Art. 144's broader e-commerce operator-disclosure duty (§8 above) is consistent with, not contradictory to, the existing Reconciliation Matrix row 4 / *Loi n° 1/11* Arts. 6–8 basis for the row-11 A classification. Classification unchanged: **A**.

## 24. All classifications before CORR-001

See the jurisdiction-verification report's §15 matrix, "Before CORR-001" column: 5 sub-rows carried a premature or unverified basis (row 3 Burundi C-premature; rows 8–9 Rwanda C-premature; rows 6 Rwanda/Burundi D-with-located-unread-source); 11 sub-rows D genuinely unresolved; row 11 Burundi A (unchanged throughout).

## 25. All classifications after CORR-001

5 sub-rows C (row 3 Burundi; row 6 Rwanda; row 6 Burundi; row 8 Rwanda; row 9 Rwanda), all primary-text-verified. 11 sub-rows D (row 1 Burundi; row 2-residual Burundi; row 4 Rwanda; row 4 Burundi; row 8 Burundi; row 9 Burundi; row 11 Rwanda; row 12 Rwanda; row 12 Burundi; row 13 Rwanda; row 13 Burundi). Row 11 Burundi A (unchanged).

## 26. D→A count

**0.**

## 27. D→B count

**0.**

## 28. D→C count

**5** — all primary-text-verified (a correction and expansion from the original report's 3 secondary/partial-sourced C classifications).

## 29. Remaining D count

**11** of 16 tested sub-rows (corrected total; the original report undercounted at 15 — see report §12).

## 30. Mandatory-law conflicts

**None.** Both newly and re-verified findings (Rwanda Art. 58–61, 92–97; Burundi Art. 45–47) align with, rather than conflict with, LEG-FD-15's carve-out and the earned-reward-survival architecture.

## 31. Founder decisions required

**None.**

## 32. Controlled Inputs required

**None.**

## 33. Portable-core assessment

Performed explicitly (report §23). No C conclusion was promoted into the portable Core Business Terms. Row 3 is Burundi-specific. Rows 8–9 are Rwanda-specific, not extended to Burundi. Row 6's Rwanda and Burundi conclusions are **two independently sourced** findings (different statutes, read separately) that happen to align in substance — explicitly recorded as *not* evidence of a pan-African force-majeure rule.

## 34. Rwanda-specific requirements retained as overlays

None generated — all Rwanda results are C (no additional overlay content needed) or unchanged D.

## 35. Burundi-specific requirements retained as overlays

Row 11 (A, mandatory disclosure) remains the sole established Burundi overlay item, unchanged and undrafted.

## 36. Confirmation no Rwanda/Burundi result was generalized as pan-African law

Confirmed (§33 above; report §13B, §23, §26). No jurisdiction beyond Rwanda and Burundi was researched under this correction, per its explicit scope limit.

## 37. Future-market overlay architecture

Recorded explicitly in the report's new §13B: portable core → jurisdiction assessment → overlay only where required/appropriate, repeated independently for each future market; Rwanda/Burundi validate the process, not the geographic boundary, of the Core Business Terms.

## 38. §26 readiness

Not fully drafting ready — 11 of 16 sub-rows remain D.

## 39. §27 index readiness

Better evidenced than before correction: 5 (not 3) sub-rows can now be indexed as "Core Terms apply, no overlay, primary-text-verified."

## 40. Rwanda substantive-overlay readiness

Not ready — all Rwanda C results mean no additional overlay content is needed for those narrow points, not that overlay content exists to draft.

## 41. Burundi substantive-overlay readiness

Unchanged — row 11 (A) remains the only established substantive-overlay content, still undrafted.

## 42. Overall Part VIII readiness gate

`PART VIII JURISDICTION VERIFICATION COMPLETE — BOUNDED DRAFTING READY WITH 11 EXPLICIT NON-RESOLUTIONS`

## 43. Automated-review findings/dispositions

None available for the pre-correction head (Codex usage-limit reached, no review performed — see §3). To be re-checked on the post-correction head after push.

## 44. Files modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-jurisdiction-verification-report-2026-09-02.md` (corrected in place)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md` (corrected in place)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001-correction-report-2026-09-03.md` (this file, created)
- `docs/00-governance/documentation-changes-log.md` (Entry 147 appended)

No other file modified.

## 45. Diff summary

Two existing files substantially rewritten in place (classification corrections, new direct-read findings, portability/architecture sections); one new correction report added; one new changes-log entry appended.

## 46. Commands executed

`gh pr view 215 --json headRefOid,state,mergeable,mergeStateStatus`; `gh pr checks 215`; `gh pr view 215 --json comments`; `WebSearch` (statute-location queries for Rwanda/Burundi primary sources); `WebFetch` (Burundi Law 1/22 PDF, Rwanda Law 45/2011 PDF — both failed automated text extraction); `Read` (PDF page-image extraction: Burundi Law 1/22 pp. 9–16, 30–38; Rwanda Law 45/2011 pp. 1–20, 40–46, 53–61); `curl` + `pdftotext` (Burundi Code Civil Livre III — successful direct text extraction); `grep` (locating Art. 45–47 in the extracted text).

## 47. External primary sources

Listed in full in the updated evidence pack (all six entries), three now labeled DIRECT PRIMARY-TEXT VERIFIED (entries 1, 2, 3, 5 — four, not three, including the OHADA status fact).

## 48. Secondary sources retained

KTPress (Rwanda 2026 consumer law, entry 4); RwandaLII/secondary summaries (Rwanda Law 22/2018, entry 6, still not primary-verified); Chambers and Partners (downgraded, no longer the basis for any classification); Flowmono (corroboration only).

## 49. Dependencies added

**NONE.**

## 50. Config changes

**NONE.**

## 51. Application/source changes

**NONE.**

## 52. Exact-head CI result

To be recorded after this correction's commit is pushed — see the task completion message for the new head SHA and its CI outcome.

## 53. Risks

- Rows 8–9 Rwanda remain moderate- rather than high-confidence C (discretionary balancing doctrine).
- 11 sub-rows remain D; several were not touched by this correction's narrow scope (notices, subscription/commercial, general provisions, Burundi liability/indemnity) and remain open for any future task.
- The correction's primary-text reads, while direct, were performed via page-image visual extraction for two of the three statutes (Burundi Law 1/22; Rwanda Law 45/2011) rather than machine text extraction (which failed for both) — transcription of French/English legal text from page images carries a small residual risk of misreading; article numbers and key quoted passages were cross-checked against the documents' own tables of contents/indices where available.

## 54. Rollback instructions

Additive/corrective changes only, on the existing isolated branch/worktree, not yet merged. To roll back: revert this correction's commit on the branch, or discard the branch before merge.

## 55. Markdown CORR-001 report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001-correction-report-2026-09-03.md` (this file).

## 56. Updated evidence-pack path

`docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md`.

## 57. Documentation changes-log treatment

Entry 147 appended to `docs/00-governance/documentation-changes-log.md`.

## 58. Commit SHA(s)

Recorded after `git commit` — see PR #215's commit history.

## 59. Final PR #215 head SHA

Recorded after `git push` — see the task completion message.

## 60. PR #215 state

Remains `OPEN`; not self-merged.

## 61. Exact Founder next action

Review the 5 primary-text-verified C classifications and the 11 remaining D sub-rows. No Founder decision or Controlled Input is required. Decide whether to authorize a further narrow follow-up on the remaining D rows using this same direct-primary-text-read standard, or proceed to bounded §26/§27 index-level (not clause-level) drafting for the resolved items while the 11 D rows remain explicitly reserved.

---

**STATUS PRESERVATION CONFIRMED:** `DEC-LEGAL-002 = OPEN_LEGAL`. Terms `NOT CONFIGURED`. Capability 3 `Open`. CI-01 `OPEN`. CI-05 `OPEN`. Parts I–VII unchanged. LEG-FD-01–16 unchanged. Part VIII `UNDRAFTED`. Burundi/Rwanda = initial launch/test jurisdictions only; future jurisdiction expansion = overlay-driven.

**FINAL BOUNDARY CONFIRMED:** No Part VIII drafting. No jurisdiction overlay drafting. No Terms configuration. No app/code changes. No self-merge.

`PR #215 PRIMARY-SOURCE VERIFICATION CORRECTED — PORTABLE CORE / JURISDICTION-OVERLAY ARCHITECTURE PRESERVED — READY FOR FOUNDER REVIEW`
