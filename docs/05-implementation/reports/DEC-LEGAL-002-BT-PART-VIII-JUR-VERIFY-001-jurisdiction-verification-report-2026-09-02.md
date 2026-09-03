# DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001 — Narrow Rwanda/Burundi Jurisdiction Verification for D-Classified Part VIII Matters

> **Task:** `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001`, as corrected by `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001` · **Date:** 2–3 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction
> **Scope:** Docs-only, bounded legal/jurisdiction verification of the D-classified Rwanda/Burundi rows in the corrected Part VIII readiness matrix. **No Part VIII clause text drafted. No Terms configuration. No application/source/Firebase/configuration change. No Core Business Terms, Controlled Inputs Register, Drafting Traceability Matrix, or Decision Register modification.**
> **CORR-001 notice:** This report was corrected in place on 3 September 2026 after Founder review found three D→C classifications in the original version exceeded the governed evidence threshold (secondary-sourced conclusions treated as primary-verified). See §13A for the correction record. The original three C classifications were provisionally reverted to D, the underlying primary statutes were then read directly, and classifications were recomputed from that direct read. This version supersedes the original in full; §§9, 10, 13A, 14–29, 30–42 below reflect the corrected findings.

---

## 1. Entry repository / worktree state

Primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`) held substantial unrelated uncommitted `FD-COM-001` commercial-model work at task start (multiple modified tracked `docs/` files; untracked `WORKING_WITH_THE_FOUNDER/`, an FD-COM-001 decision-evidence file, several new governance/report files). This task, and its CORR-001 correction, did not stash, reset, clean, commit, amend, move, or build on top of any of it, and never read its content for reconciliation purposes.

## 2. PR #214 merge verification

At original task start, PR #214 (`docs/dec-legal-002-bt-part-viii-readiness-001-close-001` → `main`) was **OPEN**, not merged (`gh pr view 214 --json state,mergeCommit,mergedAt` → `state: OPEN`, `mergeCommit: null`). Per the entry gate, this was reported and the task paused pending Founder instruction.

The Founder then confirmed the PR was reviewed and approved at head `666ae91bc2afda1bb88fb4fa30d77e2e4b342914`, conditional on exact-head CI passing and no new substantive review finding, and instructed a regular merge commit with expected-head protection.

Verification performed before merging:
- `gh pr view 214 --json headRefOid,mergeable,mergeStateStatus,reviewDecision` → `headRefOid: 666ae91bc2afda1bb88fb4fa30d77e2e4b342914` (exact match to the Founder-specified head), `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- `gh pr checks 214` → `Build, Lint, Test, Emulator Validation` — `pass` (7m29s), exact-head CI green.
- Automated Codex review: one comment, reviewing commit `fe792c2f92` — confirmed by `git merge-base --is-ancestor fe792c2f92 666ae91b...` (`YES ancestor`) and by `git log fe792c2f92..666ae91b` (two subsequent commits: `f3ed3d3` "tighten closure wording to preserve Part VIII drafting boundary" and `666ae91b` "include Rwanda row 11 in next-step verification scope (PR #214 review)") to be an ancestor commit whose finding the two subsequent commits address. No standing/unaddressed Codex finding against the actual head.
- Merged: `gh pr merge 214 --merge --match-head-commit 666ae91bc2afda1bb88fb4fa30d77e2e4b342914` — succeeded (expected-head protection engaged; a differing head would have aborted the merge).
- Confirmed post-merge: `state: MERGED`, `mergeCommit.oid: ae671a73aa9748a2697ba0d8f6b2c1ced7486aee`, `mergedAt: 2026-09-02T15:08:46Z`. Parent inspection (`git log -1 --format='%P' ae671a73...`) → two parents (`0db5727...` prior `main` tip, `666ae91b...` exact reviewed head) — confirms a genuine two-parent merge commit, not a squash or rebase.

## 3. PR #214 post-merge CI verification

`gh run list --commit ae671a73aa9748a2697ba0d8f6b2c1ced7486aee` showed workflow `CI` `in_progress`; watched to completion (`gh run watch 33646651474 --exit-status`). All jobs passed. **Post-merge CI: green.**

## 4. Base SHA

`ae671a73aa9748a2697ba0d8f6b2c1ced7486aee` (`origin/main` HEAD immediately after PR #214's merge).

## 5. Isolation strategy

Created a fresh linked worktree with `git worktree add /Volumes/PRODUCTION/Projects/_worktrees/11THONUS/temporary/jur-verify-001 -b docs/dec-legal-002-bt-part-viii-jur-verify-001 origin/main`. CORR-001 continued using this same isolated worktree (no new worktree created; primary worktree's `FD-COM-001` state again never entered or touched).

## 6. Governing-source inventory

Unchanged from the original task — see §6 of the underlying research inventory (LEG-FD-01–16, Reconciliation Matrix, External Legal Opinion body, Terms Drafting Readiness Note, Controlled Inputs Register, Capability 3 status, `DEC-LEGAL-006`). **Correction to task instruction (preserved from original):** `docs/03-standards/rules-studio.md` does **not** contain the two-layer overlay architecture — that lives at §3.3 of `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`, the Core Business Terms instrument itself.

## 7. Existing Rwanda primary-source inventory (already in repository)

Unchanged from the original task's §7.

## 8. Existing Burundi primary-source inventory (already in repository)

Unchanged from the original task's §8.

## 9. External primary sources verified (corrected — direct reads recorded)

All obtained via `WebSearch`/`WebFetch`/`Read` (PDF page-image extraction) against official or institutional sources:

1. **OHADA membership status.** `ohada.org` — Burundi is **not** an OHADA member state as of September 2026 (17 current members listed; Burundi absent, engagement/symposium activity only, ratification incomplete). **Primary/institutional source.** Unchanged from original task. Resolves: no OHADA Uniform Act overrides Burundi domestic law for the Business↔11thONUS relationship at this time.

2. **Burundi Law No. 1/22 of 22 August 2024 (Code des Communications Électroniques et Postales) — DIRECT PRIMARY-TEXT VERIFIED, expanded.** Fetched from `arct.gov.bi`; read directly via page-image extraction across Titre I (Art. 1–3, object/scope/definitions, pp. 1–11) and — newly, under CORR-001 — **Chapitre VII: Des Transactions par Voie Électronique (Art. 137–146, pp. 32–34)**, the law's actual substantive electronic-contracting chapter:
   - **Art. 137** (Section 1, reconnaissance de la valeur juridique des messages de données): "Lorsque la loi exige la signature d'une personne, ou prévoit des conséquences en l'absence de signature, cette exigence est satisfaite dans le cas où une signature électronique avancée basée sur un certificat qualifié est utilisée. Sans préjudice des dispositions prévues à l'alinéa 1 du présent article, une signature électronique ne peut pas se voir refuser une valeur juridique au seul motif qu'elle se présente sous une forme électronique." — A heightened advanced-signature-plus-qualified-certificate standard applies **only** where some other law makes a signature a formal requirement for the act in question; ordinary electronic signatures otherwise cannot be denied legal value merely for being electronic.
   - **Art. 138**: a data message is admissible as evidence on equal footing with paper writing; its probative force depends on the reliability of its creation/conservation/communication method and how the sender was identified — closely mirrors LEG-FD-03's own evidentiary standard (identifiable party, reliable record).
   - **Art. 139**: "La validité ou la force exécutoire d'une communication ou d'un contrat ne peut être contestée au seul motif que cette communication ou ce contrat est sous forme électronique."
   - **Art. 140**: legal effect/validity/enforceability of a manifestation de volonté (act of will/consent) in data-message form is not denied solely for taking that form.
   - **Art. 141**: acknowledgement of receipt may be handled by party agreement (automated or any sufficient act) or, absent agreement, must be expressly acknowledged — a receipt-acknowledgement mechanic, not a contract-formation requirement.
   - **Art. 142** (consumer-specific): anyone offering goods/services **to a consumer** ("à un consommateur") electronically must make contract terms available for conservation/reproduction — worded to consumers, not the B2B Business↔11thONUS relationship.
   - **Art. 143–146** (Section 3, commerce par voie électronique): Art. 143 is a conflict-of-laws rule (e-commerce activity governed by the law of the state where the person exercising it is established, subject to the parties' common intent as to destination); Art. 144 imposes operator-identity/registration/VAT/regulatory-authorization disclosures on "toute personne qui exerce une activité de commerce par voie électronique" (broader than consumer-only, consistent with — not adding to — the already-established Burundi row-11 disclosure finding); Art. 145–146 are pre-contract information duties expressly addressed "aux consommateurs" (consumer-facing).
   
   **This is a genuine, substantive DIRECT PRIMARY-TEXT VERIFIED read** — not merely the definitions/scope chapter read in the original task.

3. **Rwanda Law N° 45/2011 of 25/11/2011 Governing Contracts — DIRECT PRIMARY-TEXT VERIFIED.** Official trilingual (Kinyarwanda/English/French) Official Gazette PDF located at `minecofin.gov.rw`; read directly via page-image extraction (table of contents pp. 2–17; body text pp. 18, 40–46, 53–61):
   - **Art. 58** (Chapter III, Section 4, "Non-performance of the contract on grounds of public order"): "A promise or other clause of a contract is unenforceable on the grounds of public order if the Law provides that it cannot be performed or depending on the circumstances, the public order prevails over the interest in the performance of a contract."
   - **Art. 59**: criteria for evaluating the *interest* in performance (parties' expectations; prejudice from non-performance; public interest in enforcement).
   - **Art. 60**: criteria for evaluating a *public order motive* (the weight of the public-order rule "as manifested by Laws or court decisions"; "the seriousness of any misconduct involved and how it was deliberate"; the connection between the misconduct and the contract's provisions).
   - **Art. 61**: bases on which a public-order motive can obstruct performance of a promise/clause — a relevant Law, or the need to protect public welfare (restrictions on free trade; family destabilization; conflict with other protected interests).
   - **Art. 65**: contracts bind "not only [their] subject matter but also the effects that equity, practices or law impute to the obligations" and "shall be performed in good faith."
   - **Art. 91**: "Factors that extinguish the obligation to pay damages" — narrowly about damages following **repudiation** of obligations, extinguished if the repudiated obligations would themselves have been extinguished by impossibility of performance or of purpose. **This is not a general liability-exclusion-clause validity provision** — a correction to the original task's (and the secondary source's) framing.
   - **Art. 92** (Section 2, "Impossibility of performance of the contract"): "Where a party's performance is made impossible for reasons beyond her/his control including the absence of the object matter of the contract or another case of force majeure, his/her obligation of performance shall be extinguished, **unless circumstances indicate otherwise**."
   - **Art. 93–97**: elaborate impossibility scenarios (death/incapacity of a necessary person; non-existence/deterioration of a necessary thing; compliance with a new regulation; partial impossibility; effects where the contract's object disappears) — general default rules, no notification/mitigation/suspension mechanics specified, no distinction for already-accrued/vested entitlements.
   
   **No standalone "indemnity" or bright-line "liability-exclusion clause is void for fraud/gross negligence" article was found anywhere in the Table of Contents (Articles 1–165) or the sections read.** The governing mechanism for both liability-limitation and indemnity-clause enforceability is the **general public-order doctrine of Art. 58–61** — a case-specific balancing test (weight of the relevant law/precedent, severity/deliberateness of misconduct, connection to the clause), **not** a categorical per se voiding rule for specific misconduct categories as an earlier secondary source had characterized it.

4. **Burundi Code Civil, Livre III (Des Contrats ou des Obligations Conventionnelles) — DIRECT PRIMARY-TEXT VERIFIED.** Located at `cejp.bi`; downloaded and text-extracted directly (`pdftotext`, confirmed against the source's own internal index references "Cas fortuit, 46." / "Force majeure, 46."):
   - **Art. 45**: the debtor is liable in damages for non-performance or delay unless the debtor shows the failure results from an external cause not attributable to the debtor, even absent bad faith (French Code Civil Art. 1147 equivalent).
   - **Art. 46**: "Il n'y a lieu à aucuns dommages-intérêts lorsque, par suite d'une force majeure ou d'un cas fortuit, le débiteur a été empêché de donner ou de faire ce à quoi il était obligé, ou a fait ce qui lui était interdit." (No damages are owed where, due to force majeure or a fortuitous event, the debtor was prevented from giving or doing what he was obliged to do, or did what was forbidden to him.) — French Code Civil Art. 1148 equivalent, **Burundi's own article number confirmed as Art. 46, not assumed from French numbering.**
   - **Art. 47**: damages owed to a creditor are, generally, the loss suffered plus the gain of which the creditor was deprived, "sauf les exceptions et modifications ci-après" (subject to the exceptions/modifications that follow) — general damages-measure rule.
   
   Article 46 is the general force-majeure/cas-fortuit exoneration doctrine; no notification, mitigation, or suspension-mechanics requirement is specified in Art. 45–47 themselves.

5. **Rwanda Law No 22/2018 of 29/04/2018 (civil, commercial, labour and administrative procedure)** — unchanged from original task; still identified only via institutional secondary sources (RwandaLII listing, a civil-procedure course summary), not itself fetched as primary text. Confirms litigation service-of-process/pre-filing amicable-settlement practice, distinct from contractual notice clauses.

## 10. Secondary sources retained (supporting context only, never as freestanding authority)

1. Chambers and Partners, *Commercial Contracts 2025 — Rwanda* — **downgraded** from its original-task role. Its characterization ("any clause excluding liability for fraud/gross negligence/wilful misconduct is void") is **not** confirmed verbatim by the direct Art. 58–61 read (§9.3) — the actual statute establishes a general, case-specific public-order balancing doctrine, not a categorical per se rule. Retained only as the initial pointer that led to the correct primary chapter; **no longer cited as the basis for any classification** in this corrected report.
2. Flowmono legal blog — Burundi e-signature summary, retained as corroboration only, now secondary to the direct Art. 137–146 read.
3. KTPress (Kigali) news article — Rwanda's 2026 Competition and Consumer Protection Law's B2C focus, unchanged role.
4. General web-search synthesis on OHADA membership, unchanged role.

## 11. Verification methodology

Unchanged in principle from the original task, with the CORR-001 evidence-threshold restored: a classification is not C merely because no contrary law was identified, and secondary commentary alone does not establish C where the relevant primary legislation is reasonably obtainable and can be inspected — it must actually be inspected. Where this task's own primary-text read diverged from a secondary source's characterization (§9.3 vs. §10.1), the primary text controls and the secondary source's claim is corrected, not silently adopted.

## 12. Exact D-classified scope reviewed

Unchanged: the ten items named in the closure report's next-step scope. No row outside this scope was reopened. **Confirmed count correction:** the original report stated "15 tested D sub-rows"; the actual count of distinct jurisdiction/topic sub-rows is **16** (row 1 Burundi; row 2-residual Burundi; row 3 Burundi; row 4 Rwanda; row 4 Burundi; row 6 Rwanda; row 6 Burundi; row 8 Rwanda; row 8 Burundi; row 9 Rwanda; row 9 Burundi; row 11 Rwanda; row 12 Rwanda; row 12 Burundi; row 13 Rwanda; row 13 Burundi). This CORR-001 report uses the corrected count of 16 throughout.

## 13A. Evidence-threshold correction record

Founder review of PR #215 found the original report's three D→C classifications (row 3 Burundi e-contracting; row 8 Rwanda liability cap; row 9 Rwanda indemnity) exceeded the governed evidence threshold:
- Row 3 Burundi rested on a read of only Burundi Law 1/22's Art. 1–3 (definitions/scope), not its substantive electronic-contracting chapter.
- Rows 8–9 Rwanda rested entirely on a secondary source (Chambers and Partners), with the primary statute (Rwanda Law 45/2011) explicitly flagged in the original report itself as "located but not read" — a self-identified insufficiency that, per the governed standard, means the classification "is not yet C."

Per Founder instruction, all three were provisionally reverted to D, and the underlying primary statutes were then read directly (§9.2–9.3 above; Burundi Code Civil was also read directly for the force-majeure rows, which had carried the same "located but not read" flag). Classifications below are recomputed from that direct read — not restored to their prior values by default. Two additional sub-rows (row 6 Rwanda and row 6 Burundi, force majeure) were resolved as a consequence of reading the same statutes for the liability/e-contracting questions; this is a genuine finding, not an expansion of scope, since both statutes were already within CORR-001's named research targets (§6–7 of the correction task instruction).

## 13B. Portable-core / jurisdiction-overlay architecture statement

11thONUS is designed as a multi-jurisdiction platform. Burundi and Rwanda are initial launch/test jurisdictions, not the geographical definition of the product or the Core Business Terms. The Core Business Terms are intended to remain portable across future East African and wider African markets. Mandatory or appropriate jurisdiction-specific legal requirements are handled through jurisdiction overlays rather than being embedded into the portable core solely because they apply in an initial market. Each future jurisdiction requires its own legal assessment before launch; similarity between Burundi and Rwanda findings in this report must not be treated as proof of a pan-African legal rule. This report's C classifications (§14–29) are recorded as **jurisdiction-specific legal conclusions** about what Rwandan or Burundian mandatory law does or does not require **in addition to** the already-portable Core Terms architecture — they are not proposals to rewrite any portable core provision, and none of them is generalized beyond the jurisdiction it was verified for. No research into any jurisdiction beyond Rwanda and Burundi was performed under this task.

## 14. Per-topic results (corrected)

### Burundi B2B dispute/forum result (row 1)
**Classification: D — UNRESOLVED (unchanged).** No new source located under CORR-001's narrow scope (Burundi Law 1/22 and the Burundi Code Civil do not address B2B arbitration forum selection). OHADA non-membership (§9.1) still removes one theoretical risk without resolving the row.

### Burundi electronic-contracting result (row 3)
**Classification: D → C, primary-text-verified.** Direct read of Burundi Law 1/22 Chapitre VII (Art. 137–146, §9.2) confirms: (a) contract/communication validity is not deniable solely for electronic form (Art. 139–140); (b) a data message is admissible evidence with probative force assessed by reliability of creation/conservation/identification (Art. 138) — matching LEG-FD-03's own standard; (c) the heightened advanced-signature-plus-qualified-certificate standard (Art. 137) applies only where another law imposes a signature *formality* on the specific act — ordinary B2B commercial framework agreements are not, on the evidence reviewed, subject to such a formality requirement under Burundian general contract/commercial law (consistent with the standard civil-law non-formalism for ordinary consensual contracts, and with the exclusions secondary sources report for Law 1/22 — notarial acts, family law); (d) no forced-scrolling, retyping, or special B2B consent-wording requirement is stated anywhere in Art. 137–146; (e) Art. 142's retrievability duty and Art. 145–146's pre-contract information duties are expressly addressed to consumers ("consommateur"), not the B2B Business↔11thONUS relationship. **Residual issue:** this task did not exhaustively confirm, article-by-article, that no other Burundian statute (e.g., the Commercial Code of 1993) imposes a signature formality on this specific instrument type — the conclusion rests on the general non-formalism principle for ordinary commercial contracts, not an exhaustive negative search. The 2026 Personal Data Protection Law's "demonstrable consent" language remains uncross-checked against Law 1/22.

### Burundi Business Terms language result (row 2 residual)
**Classification: D — UNRESOLVED (unchanged).** Outside CORR-001's two named statutes; no new research performed (per the correction task's explicit prohibition on expanding scope).

### Rwanda notice result (row 4, Rwanda component)
**Classification: D — UNRESOLVED (unchanged).** Outside CORR-001's two named statutes.

### Burundi notice result (row 4, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** Burundi Code Civil Livre III (§9.4) was read only for Art. 45–47 (force majeure/damages); it was not searched for notice/service provisions, which is outside this correction's narrow scope.

### Rwanda force-majeure result (row 6, Rwanda component)
**Classification: D → C, primary-text-verified.** Direct read of Art. 92–97 (§9.3) confirms Art. 92 is a **default, displaceable rule** ("unless circumstances indicate otherwise") extinguishing the obligation of performance where performance becomes impossible for reasons beyond the party's control, including force majeure. Articles 93–97 elaborate specific impossibility scenarios without imposing notification, mitigation, or suspension mechanics as mandatory additions. Because Art. 92 is expressly displaceable by "circumstances" (including the parties' own contract terms) and speaks to the *performance obligation* generally rather than to already-accrued/vested entitlements specifically, nothing in Art. 92–97 is found to compel a result inconsistent with the governed earned-reward-survival architecture (`DEC-LOY-011`, FD-2, §§13–16), and no additional Business-Terms-specific overlay mechanism is established as mandatory. **Residual issue:** this finding is about whether Rwandan law *mandates* additional treatment — it does not certify that the actual (undrafted, out-of-scope) §25.4 clause text, whatever it ultimately says, will be consistent with Art. 92; that comparison is a drafting-time task, not a legal-mandate question, and remains appropriately reserved.

### Burundi force-majeure result (row 6, Burundi component)
**Classification: D → C, primary-text-verified.** Direct read of Burundi Code Civil Art. 45–47 (§9.4) confirms the same general force-majeure/cas-fortuit exoneration doctrine as Rwanda's (independently verified from a wholly separate primary source, not inferred from the Rwanda finding — see §13B's portability caveat: this is not a promoted "pan-African rule," it is two separately verified, independently-sourced jurisdiction-specific conclusions that happen to align). No notification/mitigation/suspension mechanic is mandated by Art. 45–47 themselves. Same residual caveat as the Rwanda component: this does not certify the undrafted §25.4 clause text's specific wording.

### Rwanda B2B liability-cap result (row 8, Rwanda component)
**Classification: D → C, primary-text-verified, moderate confidence (corrected basis).** Direct read of Art. 58–61 (§9.3) establishes a **general public-order unenforceability doctrine** for any contract clause — not the bright-line "fraud/gross-negligence/wilful-misconduct exclusion clauses are void" rule the original (now-superseded) secondary-sourced classification asserted. The doctrine is a **case-specific balancing test**: the weight of the relevant public-order rule (as reflected in law or court decisions), the severity and deliberateness of any misconduct, and its connection to the specific contract clause (Art. 60). LEG-FD-15's existing carve-out (fraud, wilful misconduct, gross negligence, death/personal injury, non-excludable statutory warranty preserved as non-excludable from any Business liability cap) is, in substance, already structured toward the same misconduct categories that Art. 58–61's balancing test would most readily find outweigh a contract's enforcement interest. On the **narrow question tested** — does Rwanda mandate *additional or different* overlay content beyond what §19 already provides — the answer, on this direct primary-text read, is **no**. This is genuinely a moderate- rather than high-confidence C: Art. 58–61 leaves case-specific discretion to a court, so this finding cannot and does not certify that the specific, not-yet-independently-reviewed §19 clause text will withstand every future public-order challenge — it certifies only that no *additional* mandatory statutory requirement beyond the existing non-excludable-liability architecture was located. **The zero-fee Business cap remains unresolved as a separate commercial/governance matter, not touched by this task.**

### Burundi B2B liability result (row 8, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** Outside CORR-001's two named statutes (the Burundi Code Civil was read only for Art. 45–47; a broader search of its liability/public-order provisions was not performed, consistent with the correction task's narrow scope).

### Rwanda indemnity result (row 9, Rwanda component)
**Classification: D → C, primary-text-verified, moderate confidence (corrected basis), independently assessed.** Art. 58's own text applies to "a promise **or other clause** of a contract" — broad enough to reach an indemnity provision independently of the liability-cap analysis, consistent with the correction task's instruction not to assume a liability-exclusion rule automatically resolves indemnity enforceability. The same Art. 58–61 balancing doctrine applies: an indemnity clause that purported to shift liability for fraud, wilful misconduct, or gross negligence would be the kind of clause Art. 60's severity/deliberateness factor is most likely to find unenforceable on public-order grounds — which is exactly what §20's governed four-subject indemnity architecture does not purport to do (it is not broadened or redrafted by this task). No standalone Rwandan "indemnity" statute or article was found (§9.3) — indemnity enforceability is governed by the same general contract-validity/public-order framework as any other clause, not a distinct doctrine. Same moderate-confidence caveat as row 8 Rwanda.

### Burundi indemnity result (row 9, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** Outside CORR-001's two named statutes' portions actually read.

### Rwanda operator-disclosure result (row 11, Rwanda component)
**Classification: D — UNRESOLVED (unchanged).** Outside CORR-001's two named statutes; CI-01 remains untouched.

### Rwanda subscription/commercial result (row 12, Rwanda component)
**Classification: D — UNRESOLVED (unchanged).** Outside CORR-001's two named statutes.

### Burundi subscription/commercial result (row 12, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** Outside CORR-001's two named statutes.

### Rwanda general-provisions result (row 13, Rwanda component)
**Classification: D — UNRESOLVED (unchanged).** Assignment/severability/entire-agreement/survival provisions were not located in the Art. 58–61/91–97 chapters read; a full search of the assignment chapter (Art. 120–134, per the Table of Contents at §9.3) was not performed, consistent with the correction task's narrow scope (force majeure, liability, and e-contracting only).

### Burundi general-provisions result (row 13, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** Same reasoning.

### Existing Burundi mandatory-disclosure verification (row 11, Burundi component — already A, verify only)
**Verified, classification unchanged (A).** Not reopened by CORR-001; Burundi Law 1/22 Art. 144's broader e-commerce operator-disclosure duty (§9.2) is consistent with, not contradictory to, the existing Reconciliation Matrix row 4 / *Loi n° 1/11* Arts. 6–8 basis for this A classification.

## 15. Prior→new classification matrix (corrected)

| Row | Topic | Jurisdiction | Before CORR-001 | Verified authority (CORR-001) | Primary/secondary | Final result | Residual issue |
|---|---|---|---|---|---|---|---|
| 1 | B2B dispute/forum | Burundi | D | OHADA non-membership (unchanged) | Primary | **D** | No Burundi domestic-forum-mandate source located |
| 2 (residual) | Language | Burundi | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 3 | E-contracting | Burundi | D→C (premature) → D (reverted) | Law 1/22 Art. 137–146, direct read | **Primary (direct)** | **C** | Signature-formality-elsewhere and 2026 consent-law cross-check not exhaustive |
| 4 | Notices | Rwanda | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 4 | Notices | Burundi | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 6 | Force majeure | Rwanda | D | Law 45/2011 Art. 92–97, direct read | **Primary (direct)** | **C** | Does not certify undrafted §25.4 clause wording |
| 6 | Force majeure | Burundi | D | Code Civil Art. 45–47, direct read | **Primary (direct)** | **C** | Same |
| 8 | Liability cap | Rwanda | D→C (premature) → D (reverted) | Law 45/2011 Art. 58–61, direct read | **Primary (direct)** | **C** (moderate confidence) | General balancing test, not a bright-line rule; case-specific discretion remains |
| 8 | Liability cap | Burundi | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 9 | Indemnity | Rwanda | D→C (premature) → D (reverted) | Same Art. 58–61, independently applied | **Primary (direct)** | **C** (moderate confidence) | Same |
| 9 | Indemnity | Burundi | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 11 | Operator disclosure | Rwanda | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 11 | Operator disclosure | Burundi | A | Re-verified, unchanged; Law 1/22 Art. 144 consistent | Existing chain + primary | **A** | None |
| 12 | Subscription/commercial | Rwanda | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 12 | Subscription/commercial | Burundi | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 13 | General provisions | Rwanda | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |
| 13 | General provisions | Burundi | D | None (out of CORR-001 scope) | — | **D** | Not researched under this correction |

## 16. Count D→A

**0.**

## 17. Count D→B

**0.**

## 18. Count D→C

**5** (row 3 Burundi e-contracting; row 6 Rwanda force majeure; row 6 Burundi force majeure; row 8 Rwanda liability cap; row 9 Rwanda indemnity) — **all five now primary-text-verified**, correcting the original report's 3 secondary/partial-sourced C classifications.

## 19. Remaining D count

**11** of 16 tested sub-rows (row 1 Burundi; row 2-residual Burundi; row 4 Rwanda; row 4 Burundi; row 8 Burundi; row 9 Burundi; row 11 Rwanda; row 12 Rwanda; row 12 Burundi; row 13 Rwanda; row 13 Burundi). 5 + 11 = 16, matching the corrected total (§12).

## 20. Mandatory-law conflicts

**None identified.** Rwanda Art. 58–61's public-order doctrine and Burundi Art. 45–47's force-majeure doctrine both align with, rather than conflict with, LEG-FD-15's non-excludable-liability carve-out and the governed earned-reward-survival architecture. OHADA non-membership is consistent with LEG-FD-14/16.

## 21. Founder decisions required

**None.** No mandatory-law conflict was found (§20).

## 22. Controlled Inputs required

**None.** No remaining D row stems from a missing value rather than missing legal verification.

## 23. Portability test (per task §9)

For each C conclusion in this correction:
- **Row 3 (Burundi e-contracting):** jurisdiction-specific — verified from Burundi's own Law 1/22 only. Not promoted into the portable core; the portable core's LEG-FD-03 acceptance standard is unchanged, this only confirms Burundi does not require more than it.
- **Row 6 (Rwanda and Burundi force majeure):** two **independently sourced** jurisdiction-specific conclusions (Rwanda's Art. 92 vs. Burundi's Art. 46 are different statutes, read separately) that happen to align in substance (both are default, civil-law-tradition force-majeure exonerations). Per §13B, this alignment across the two current launch jurisdictions is **not treated as evidence of a pan-African rule** — it says nothing about how a third jurisdiction's law would treat force majeure, and no change to the portable core's own force-majeure policy is implied or made by this finding.
- **Row 8–9 (Rwanda liability/indemnity):** jurisdiction-specific to Rwanda only (Art. 58–61); not extended to Burundi (rows 8–9 Burundi remain D, no Burundi source was researched for this question under CORR-001's narrow scope).

No universal 11thONUS rule was derived from any Rwanda or Burundi finding in this report. The Core Business Terms' own portable content is unchanged by this task.

## 24. Rwanda-specific requirements retained as overlays

None of this task's Rwanda findings produced overlay *content* (all Rwanda results are C or unchanged D — C means no additional overlay text is needed, not that overlay text was drafted). No Rwanda-specific requirement was embedded into the portable core.

## 25. Burundi-specific requirements retained as overlays

Row 11 Burundi (mandatory pre-acceptance disclosure, A) remains the only established Burundi overlay-content item, unchanged and undrafted by this task, per §14's "Existing Burundi mandatory-disclosure verification."

## 26. Confirmation no Rwanda/Burundi result was generalized as pan-African law

Confirmed — see §13B and §23. No research was performed into Kenya, Uganda, Tanzania, DRC, Zambia, South Africa, Nigeria, Ghana, or any other future market under this task, consistent with the correction task's explicit prohibition.

## 27. Future-market overlay architecture

Recorded explicitly at §13B: each future jurisdiction requires its own legal assessment (portable core → jurisdiction assessment → overlay only where required/appropriate) before launch; Rwanda and Burundi validate the *process*, not the geographic scope, of the Core Business Terms.

## 28. §26 readiness

**Not fully drafting ready.** 11 of 16 tested sub-rows remain D.

## 29. §27 readiness

**Substantially ready at index/architecture level**, and better evidenced than the original (now-corrected) report: 5 sub-rows (up from 3) can be indexed as "Core Terms apply, no overlay, primary-text-verified" rather than "awaiting verification," and the one established Burundi overlay item (row 11) remains available for index-level (not clause-level) identification.

## 30. Rwanda substantive-overlay readiness

**Not ready.** All Rwanda C results (rows 6, 8, 9) mean "no additional Rwanda overlay content needed" for those narrow points — not overlay content ready to draft. No Rwanda row reached A or B.

## 31. Burundi substantive-overlay readiness

**Unchanged from the original task:** row 11 (mandatory disclosure, A) remains the only established substantive-overlay content, not drafted by this task. Row 3 (e-contracting) and row 6 (force majeure) now confirm no additional overlay text is needed for those two points, at higher confidence than the original report.

## 32. Overall Part VIII readiness gate

`PART VIII JURISDICTION VERIFICATION COMPLETE — BOUNDED DRAFTING READY WITH 11 EXPLICIT NON-RESOLUTIONS`

(11 remaining D sub-rows, itemized in §19 and the matrix at §15; 5 sub-rows resolved D→C, all primary-text-verified, itemized in §18; 0 resolved to A or B; row 11 Burundi's existing A classification re-verified unchanged; no mandatory-law conflict; no new Founder decision or Controlled Input required; portable core / jurisdiction-overlay architecture explicitly preserved per §13B.)

## 33. Files modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-jurisdiction-verification-report-2026-09-02.md` (this report, corrected in place)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md` (updated with direct-read entries)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001-correction-report-2026-09-03.md` (created — this correction's own record)
- `docs/00-governance/documentation-changes-log.md` (Entry 147 appended)

No other file modified. No Core Business Terms clause text, Part VIII placeholder, Decision Register entry, Controlled Inputs Register entry, or Drafting Traceability Matrix entry touched.

## 34. Diff summary

One report substantially rewritten in place (classification corrections, new primary-source findings, portability/architecture sections added); one evidence pack updated; one new correction report added; one new changes-log entry appended.

## 35. Commands executed (CORR-001, in addition to the original task's commands)

`gh pr view 215 --json headRefOid,state,mergeable,mergeStateStatus`, `gh pr checks 215`, `gh pr view 215 --json comments`, `WebSearch` (OHADA/Rwanda/Burundi statute-location queries), `WebFetch` (Burundi Law 1/22 and Rwanda Law 45/2011 PDFs — both failed text extraction via WebFetch's own pipeline), `Read` (PDF page-image extraction: Burundi Law 1/22 pp. 9–16, 30–38; Rwanda Law 45/2011 pp. 1–20, 40–46, 53–61), `curl`/`pdftotext` (Burundi Code Civil Livre III — direct text extraction succeeded), `grep` (locating Art. 45–47 in the extracted Burundi Code Civil text).

## 36. External primary sources

Listed in full in §9 above and the updated evidence pack.

## 37. Secondary sources retained

Listed in §10 above, with their reduced/corrected role explicitly stated.

## 38. Dependencies added

**NONE.**

## 39. Config changes

**NONE.**

## 40. Application/source changes

**NONE.**

## 41. Exact-head CI result

PR #215 pre-correction head (`c19b2b726da1b5263970670d6af06850a0d75229`): CI green, no Codex findings (Codex hit its usage-limit quota — no automated review was actually performed on the pre-correction head, recorded accurately as "no review available," not "no findings"). Post-correction head CI result recorded after this correction's commit is pushed — see the task completion message for the exact new head and its CI outcome.

## 42. Risks

- Rows 8–9 Rwanda remain **moderate**, not high, confidence C: Art. 58–61 is a case-specific balancing doctrine, not a bright-line rule, so this finding does not certify every possible application of §19/§20's specific clause wording — only that no *additional* mandatory statutory requirement was located.
- Row 3 Burundi's C classification rests on a reasonable (but not exhaustively verified) inference that no other Burundi statute imposes a signature formality on this specific B2B instrument type.
- 11 of 16 tested sub-rows remain genuinely D — Part VIII substantive drafting for most rows in both jurisdictions remains blocked.
- This correction did not expand research beyond Burundi Law 1/22 and Rwanda Law 45/2011 (plus the already-in-scope Burundi Code Civil) — several D rows (notices, subscription/commercial, general provisions, most of Burundi's liability/indemnity) were not touched, per the correction task's explicit scope limit, and remain open research items for any future task.

## 43. Rollback instructions

Unchanged in principle from the original report — additive/corrective changes only, on the same isolated branch/worktree, not yet merged to `main`. PR #214's merge (§2) remains a separate, already-completed action.

## 44. Markdown report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-jurisdiction-verification-report-2026-09-02.md` (this file, corrected in place).

## 45. Legal-source evidence-pack path

`docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md`.

## 46. Documentation changes-log entry

Entry 147, `docs/00-governance/documentation-changes-log.md`.

## 47. Commit SHA(s)

Recorded in the PR description / commit history after `git commit` (see PR #215).

## 48. Final PR #215 head SHA / state

Recorded after this correction's commit is pushed to the existing branch (see task completion message). PR #215 remains open; not self-merged.

## 49. Exact Founder next action

Review the 5 primary-text-verified C classifications (§18) and the 11 remaining D sub-rows (§19). No Founder decision or Controlled Input is required by this correction's findings. The realistic next steps remain: (a) decide whether to authorize a further, still-narrow follow-up covering the 11 remaining D rows using the same direct-primary-text-read standard now established, or (b) proceed to bounded §26/§27 index-level drafting (not clause-level) for the now-higher-confidence resolved items while leaving the 11 D rows explicitly reserved. This report does not decide between (a) and (b) — that is a Founder call.

---

**STATUS PRESERVATION CONFIRMED:** `DEC-LEGAL-002 = OPEN_LEGAL` (unchanged). Terms configuration `NOT CONFIGURED` (unchanged). Capability 3 `Open` (unchanged). CI-01 `OPEN` (unchanged). CI-05 `OPEN` (unchanged). Parts I–VII unchanged. LEG-FD-01–16 unchanged. Part VIII clause state `UNDRAFTED` (unchanged). Burundi/Rwanda confirmed as initial launch/test jurisdictions only, not the geographic definition of the product; future jurisdiction expansion remains overlay-driven (§13B). No status updated to FINAL/EFFECTIVE.

**FINAL BOUNDARY CONFIRMED:** No Part VIII clause text drafted. No jurisdiction overlay clause text drafted. No Terms configuration performed. No application/source/Firebase/config change. No self-merge.

`PR #215 PRIMARY-SOURCE VERIFICATION CORRECTED — PORTABLE CORE / JURISDICTION-OVERLAY ARCHITECTURE PRESERVED — READY FOR FOUNDER REVIEW`

`PART VIII JURISDICTION VERIFICATION COMPLETE — BOUNDED DRAFTING READY WITH 11 EXPLICIT NON-RESOLUTIONS`
