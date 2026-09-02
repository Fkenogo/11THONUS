# DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001 — Narrow Rwanda/Burundi Jurisdiction Verification for D-Classified Part VIII Matters

> **Task:** `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001` · **Date:** 2 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction
> **Scope:** Docs-only, bounded legal/jurisdiction verification of the D-classified Rwanda/Burundi rows in the corrected Part VIII readiness matrix. **No Part VIII clause text drafted. No Terms configuration. No application/source/Firebase/configuration change. No Core Business Terms, Controlled Inputs Register, Drafting Traceability Matrix, or Decision Register modification.**

---

## 1. Entry repository / worktree state

Primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`) held substantial unrelated uncommitted `FD-COM-001` commercial-model work at task start (multiple modified tracked `docs/` files; untracked `WORKING_WITH_THE_FOUNDER/`, an FD-COM-001 decision-evidence file, several new governance/report files). This task did not stash, reset, clean, commit, amend, move, or build on top of any of it, and never read its content for reconciliation purposes.

## 2. PR #214 merge verification

At task start, PR #214 (`docs/dec-legal-002-bt-part-viii-readiness-001-close-001` → `main`) was **OPEN**, not merged (`gh pr view 214 --json state,mergeCommit,mergedAt` → `state: OPEN`, `mergeCommit: null`). Per the entry gate, this was reported and the task paused pending Founder instruction.

The Founder then confirmed the PR was reviewed and approved at head `666ae91bc2afda1bb88fb4fa30d77e2e4b342914`, conditional on exact-head CI passing and no new substantive review finding, and instructed a regular merge commit with expected-head protection.

Verification performed before merging:
- `gh pr view 214 --json headRefOid,mergeable,mergeStateStatus,reviewDecision` → `headRefOid: 666ae91bc2afda1bb88fb4fa30d77e2e4b342914` (exact match to the Founder-specified head), `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- `gh pr checks 214` → `Build, Lint, Test, Emulator Validation` — `pass` (7m29s), exact-head CI green.
- Automated Codex review: one comment, reviewing commit `fe792c2f92` — confirmed by `git merge-base --is-ancestor fe792c2f92 666ae91b...` (`YES ancestor`) and by `git log fe792c2f92..666ae91b` (two subsequent commits: `f3ed3d3` "tighten closure wording to preserve Part VIII drafting boundary" and `666ae91b` "include Rwanda row 11 in next-step verification scope (PR #214 review)") to be an ancestor commit whose finding the two subsequent commits address. No standing/unaddressed Codex finding against the actual head.
- Merged: `gh pr merge 214 --merge --match-head-commit 666ae91bc2afda1bb88fb4fa30d77e2e4b342914` — succeeded (expected-head protection engaged; a differing head would have aborted the merge).
- Confirmed post-merge: `state: MERGED`, `mergeCommit.oid: ae671a73aa9748a2697ba0d8f6b2c1ced7486aee`, `mergedAt: 2026-09-02T15:08:46Z`. Parent inspection (`git log -1 --format='%P' ae671a73...`) → two parents (`0db5727...` prior `main` tip, `666ae91b...` exact reviewed head) — confirms a genuine two-parent merge commit, not a squash or rebase.

## 3. PR #214 post-merge CI verification

`gh run list --commit ae671a73aa9748a2697ba0d8f6b2c1ced7486aee` showed workflow `CI` `in_progress`; watched to completion (`gh run watch 33646651474 --exit-status`). All jobs passed: Set up pnpm/Node, Install dependencies, Build, Lint, Format check, Typecheck, Unit/component tests, Playwright e2e, Firebase Emulator Suite validation, Post-* steps, Complete job. Only non-blocking deprecation annotations (Node 20 EOL notice, `setup-java@v4` deprecation, a Fast-Refresh lint note) — no failures. **Post-merge CI: green.**

## 4. Base SHA

`ae671a73aa9748a2697ba0d8f6b2c1ced7486aee` (`origin/main` HEAD immediately after PR #214's merge).

## 5. Isolation strategy

Created a fresh linked worktree with `git worktree add /Volumes/PRODUCTION/Projects/_worktrees/11THONUS/temporary/jur-verify-001 -b docs/dec-legal-002-bt-part-viii-jur-verify-001 origin/main`. Confirmed `git log -1` in the new worktree resolves to `ae671a73...` exactly, and `git status --short` reported clean at entry. The primary worktree's `FD-COM-001` state was never entered or touched by this operation.

## 6. Governing-source inventory

Directly inspected (via a dedicated research sub-task, all citations file-verified, not recalled from memory):
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-READINESS-001-assessment-report-2026-09-02.md` (corrected 13-row matrix, §12A)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-READINESS-001-CLOSE-001-closure-report-2026-09-02.md` (Founder disposition; next-step scope naming "Rwanda row 11")
- `docs/00-governance/documentation-changes-log.md` Entries 143, 144, 145
- `docs/00-governance/decisions/decision-register.md` — `DEC-LEGAL-002` (`OPEN_LEGAL`), `DEC-LOY-011` (CONFIRMED)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` (LEG-FD-01–16, v3.0)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md` (v2.0)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md` (§§4, 11–14, 16, and lines 37–39, 413)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (CI-01, CI-05, both OPEN)
- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` (Capability 3 status)
- `docs/00-governance/decisions/DEC-LEGAL-006-Cross-Border-Hosting-and-Data-Residency-Evidence-Pack.md` (independent full-text primary-statute review, data-hosting scope)

**Correction to task instruction:** `docs/03-standards/rules-studio.md` does **not** contain a §3.3 two-layer overlay architecture — that document is an unrelated product-feature spec (Knowledge/Rules/Experience/Intelligence Studio). The governed two-layer (Layer 1 portable core / Layer 2 jurisdiction overlay) architecture actually lives at §3.3 of `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`, the Core Business Terms instrument itself. This report cites the correct source.

## 7. Existing Rwanda primary-source inventory (already in repository)

Via the External Legal Opinion body (secondary-sourced legal-opinion citations, not independently verified against gazette text by this task except where noted in §9): Rwanda Law No. 18/2010 (electronic messages/signatures/transactions); Rwanda Law No. 058/2021 (data protection/privacy); Rwanda "new Competition and Consumer Protection Law" (2026, unnamed in the opinion). Via `DEC-LEGAL-006`: Rwanda Law N° 058/2021 read in full by that independent task (data-hosting scope, not B2B contract scope).

## 8. Existing Burundi primary-source inventory (already in repository)

Via the External Legal Opinion body: Burundi *Loi n° 1/11 de 2009* (consumer protection, Arts. 6–8, 12, 15); Burundi Code Civil Art. 33; Burundi Commercial Code (1993); Burundi Electronic Communications and Postal Code (*Loi n° 1/22 du 22 août 2024*, cited only by title, not read); Burundi 2026 Personal Data Protection Law (cited inconsistently as both "2026 Personal Data Protection Law" and "*Loi n° 1/03/2026*"); Burundi ARCT E-Commerce Guide (2025). Via `DEC-LEGAL-006`: *Loi n° 1/03 du 10 mars 2026 portant protection des données à caractère personnel*, read in full (55 articles) by that independent task (data-hosting scope).

## 9. New external primary sources verified (this task)

All obtained via `WebSearch`/`WebFetch` against official or institutional sources, this task, 2 September 2026:

1. **OHADA membership status.** `ohada.org` search results confirm Burundi is **not** an OHADA member state as of 2026 (17 current members listed; Burundi absent, engagement/symposium activity only, ratification incomplete). **Primary/institutional source** (ohada.org, the treaty organization's own site). Resolves: whether an OHADA Uniform Act (e.g., the Uniform Act on Arbitration or on General Commercial Law) automatically overrides Burundi domestic law on the Business↔11thONUS relationship. **Answer: no** — no OHADA uniform act applies to Burundi at this time.
2. **Burundi Law No. 1/22 of 22 August 2024** (Code des Communications Électroniques et Postales) — fetched directly from `arct.gov.bi` (Burundi's telecom/postal regulator, the law's official publishing custodian) as a text-extractable PDF; read pages 1–8 directly (Titre I, Chapitres I–II: object/scope/definitions). **Primary source**, this task's own direct read, not a secondary restatement. Article 1 confirms scope covers "l'ensemble des transactions par voie électronique incluant notamment le commerce par voie électronique." Definitions in Art. 3 include `authentification`, `certificat`, `certificat qualifié`, `non-répudiation` — an electronic-signature/authentication regime exists in Burundi law as of August 2024, contradicting the External Legal Opinion's (dated 29 August 2026, but apparently relying on stale research) statement at line 39 that "Burundi does not have a dedicated Electronic Signature Law." The specific e-contract-formation/consent-mechanics articles (likely later in this ~100+ article omnibus code) were not reached within this task's page budget — see residual note in §14 below.
3. **Secondary confirmation of Law 1/22's e-signature provisions** — Flowmono legal-industry blog, cross-checked against the primary text's Art. 3 definitions (consistent: qualified certificates, presumed authenticity for qualified signatures, non-repudiation). Confirms electronic signatures have legal equivalence to handwritten signatures for commercial contracts in Burundi, subject to standard exclusions (notarial acts, family law, specific mandated-handwritten instruments) — none of which touch a B2B loyalty-platform Business Terms instrument. **Secondary source**, used only as corroboration of the primary text already read, not as a freestanding authority.
4. **Rwanda Law N° 45/2011 of 25/11/2011 governing contracts** — official PDF located at `minecofin.gov.rw` (Rwanda Ministry of Finance and Economic Planning, an official government publisher); not fetched/read as text within this task's budget, but its Article 92 (force majeure/impossibility — obligation extinguished "unless circumstances indicate otherwise") and its general voiding of exclusion clauses for fraud/gross negligence/wilful misconduct are corroborated by an institutional secondary source (§10, item 1 below) rather than independently read in full. Flagged as **primary source located but not directly read** — residual verification item.
5. **Burundi Code Civil, Livre III (Des Contrats ou des Obligations Conventionnelles)** — located at `cejp.bi` (Burundi's Centre d'Études et de Prospective Juridique, an official/institutional legal-documentation body), confirming Burundi's civil code follows the French Code Civil force-majeure/cas-fortuit exoneration tradition (Art. 1148-equivalent: no damages owed where performance was prevented by force majeure/fortuitous event). **Primary source located**, not read in full within this task's budget — residual verification item (see §14).
6. **Rwanda Law No 22/2018 of 29/04/2018 relating to civil, commercial, labour and administrative procedure** — identified via institutional secondary sources (RwandaLII listing, a Studocu civil-procedure summary) as the governing statute for court service-of-process/formal notice in litigation. Confirms mandatory pre-filing amicable-settlement attempts and Intent-to-Sue Letter practice exist as **litigation** procedure, distinct from ordinary contractual-notice-clause requirements. Not itself fetched as primary text within this task's budget.

## 10. Secondary sources used (supporting context only, never as freestanding authority)

1. Chambers and Partners, *Commercial Contracts 2025 — Rwanda* (Global Practice Guide) — institutional legal-directory source, cross-referenced against Law N° 45/2011 for the fraud/gross-negligence/wilful-misconduct non-excludability principle and Article 92 force-majeure summary.
2. Flowmono legal blog — Burundi e-signature summary (used only to corroborate the primary Law 1/22 text already read directly).
3. KTPress (Kigali) news article — existence and citation (Law n° 011/2026 of 26/02/2026) of Rwanda's new Competition and Consumer Protection Law, and its B2C (not B2B) primary focus.
4. General web-search synthesis on OHADA membership status (aggregated from ohada.org and OHADA.com pages).

No blog-post or generic-summary source was relied on where primary law was reasonably obtainable; where only secondary corroboration was available within this task's research budget (Rwanda Law 45/2011's specific articles, Burundi Code Civil's specific articles), this is disclosed as a residual verification gap in §14 and the relevant rows are **not** elevated past the confidence the evidence actually supports.

## 11. Verification methodology

For each D row, the corrected 13-row matrix's exact question (§2 of the background research) was tested against: (a) the existing repository evidence chain (LEG-FD-01–16, Reconciliation Matrix, External Legal Opinion body), (b) any newly verified primary or institutional-secondary external source, and (c) the A/B/C/D standard in the task instruction — including the express rule that absence of evidence is not C, and that a Founder-position/mandatory-law conflict must be escalated, not silently resolved either direction. Classification changed **only** where a specific external authority was found and read (in whole or in the specific relevant article/summary) addressing that row's precise legal question for the Business↔11thONUS B2B relationship — never by generalizing from consumer-protection law to the B2B instrument, and never by treating counsel's recommendation as mandatory law.

## 12. Exact D-classified scope reviewed

All ten items named in the Founder-approved next-step scope (closure report §9, quoted in §3 of the background research): row 1 (Burundi B2B forum), row 2 residual (Burundi language), row 3 (Burundi e-contracting), row 4 (Rwanda + Burundi notices), row 6 (Rwanda + Burundi force majeure), row 8 (Rwanda + Burundi liability cap), row 9 (Rwanda + Burundi indemnity), row 11 Rwanda component (operator disclosure beyond CI-01), row 12 (Rwanda + Burundi commercial/subscription), row 13 (Rwanda + Burundi general provisions). No row outside this scope was reopened; row 11's Burundi component (already A) and rows 5, 7, 10 (already C) were verified for internal consistency only, not reclassified or redrafted.

## 13. Per-topic results

### 13. Burundi B2B dispute/forum result (row 1)
**Classification: D — UNRESOLVED (unchanged).** New finding: Burundi is confirmed not an OHADA member (§9.1), so no OHADA Uniform Act on Arbitration displaces Kigali/KIAC arbitration for Burundi-domiciled Businesses — this removes one theoretical mandatory-overlay risk, but is not itself an affirmative finding that Burundi domestic law imposes no forum restriction. No primary Burundi statute was located within this task's budget establishing or ruling out a mandatory local-forum/local-court requirement for B2B commercial arbitration clauses. The External Legal Opinion's §13 "allow Burundi option" remains counsel's discretionary recommendation, not a cited mandatory provision — consistent with the existing D classification and with LEG-FD-14's own scope boundary. **LEG-FD-14/LEG-FD-16 preserved unchanged.**

### 14. Burundi electronic-contracting result (row 3)
**Classification: D → C (Mandatory-Overlay question), with a residual verification note.** Burundi Law 1/22 (2024) is confirmed as a dedicated electronic-communications code establishing legal equivalence for electronic signatures/authentication in commercial contracts (§9.2–9.3), directly contradicting the stale "no dedicated e-signature law" premise that kept this row D. This supports: the portable LEG-FD-03 acceptance standard (affirmative acceptance + identifiable party + exact version + timestamp + retrievable record) is **not** contradicted by Burundi law, and no additional Business-Terms-specific overlay is established as mandatory. **Residual issue (kept honest, not silently resolved to full confidence):** this task did not reach the specific e-contract-formation/consent-mechanics articles inside the ~100+ article Law 1/22 text (only pages 1–8 of the definitions/scope chapters were read), nor did it reconcile the 2026 Personal Data Protection Law's "demonstrable consent" language cited by the External Legal Opinion (line 39) against Law 1/22's later chapters. Reclassifying fully to C is **appropriate for the narrow question tested** (does Burundi require additional acceptance mechanics beyond LEG-FD-03 — no evidence found that it does, and an on-point primary source exists and was read for the relevant scope/definitions chapter), but the "demonstrable consent" cross-check remains a named follow-up (§17).

### 15. Burundi Business Terms language result (row 2 residual)
**Classification: D — UNRESOLVED (unchanged).** No new primary source was located or read on whether Burundi mandatory law imposes a controlling-language or bilingual-execution requirement specific to a B2B Business Terms instrument (as opposed to consumer-facing Customer Terms, where the Reconciliation Matrix already treats this as B/deferred-to-overlay). The Burundi Constitution Art. 7 / *Loi n° 1/11* Art. 5 citations in the External Legal Opinion §14 were not independently re-verified against primary text within this task's budget. **LEG-FD-02 preserved unchanged.**

### 16. Rwanda notice result (row 4, Rwanda component)
**Classification: D — UNRESOLVED (unchanged).** Rwanda Law No 22/2018 (civil, commercial, labour and administrative procedure) governs **litigation** service of process and pre-filing amicable-settlement/Intent-to-Sue-Letter practice (§9.6) — this is litigation/service-of-process law, correctly kept separate from ordinary contractual-notice-clause requirements per the task's own instruction. No mandatory requirement was found (or searched to exhaustion) governing a Business Terms contractual notice clause itself (channel, deemed receipt, registered-address service). No period was invented.

### 17. Burundi notice result (row 4, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** No Burundi-specific primary or institutional-secondary source was located within this task's budget on contractual notice-clause requirements (as distinct from litigation service, which was not separately researched for Burundi this task).

### 18. Rwanda force-majeure result (row 6, Rwanda component)
**Classification: D — UNRESOLVED (unchanged), with corroborating context.** Rwanda Law N° 45/2011 Art. 92 (force majeure/impossibility extinguishes the obligation "unless circumstances indicate otherwise") is corroborated by an institutional secondary source (§10.1) but was not independently read in full text by this task (§9.4). This confirms a general civil-law force-majeure doctrine exists under Rwandan mandatory law (consistent with, not contradicting, the governed earned-reward architecture — nothing found suggests retrospective erasure of earned obligations is compelled), but the assessment's specific D question — whether the *Business Terms' own* force-majeure clause requires jurisdiction-specific drafting treatment (definition, notification, mitigation, suspension, termination consequences) to remain consistent with Art. 92 — was not resolved, because that requires comparing Art. 92's exact text against the (undrafted, out-of-scope-to-review-in-detail-here) §25.4 clause language, which this task does not draft or amend. **DEC-LOY-011 and the earned-reward architecture preserved unchanged; no force-majeure mechanism invented.**

### 19. Burundi force-majeure result (row 6, Burundi component)
**Classification: D — UNRESOLVED (unchanged), with corroborating context.** Burundi Code Civil Livre III was located (§9.5, French Code Civil-derived force-majeure/cas-fortuit tradition) but not read in full text within this task's budget. Same residual reasoning as row 6 Rwanda: a general civil-law doctrine's existence does not by itself resolve whether the drafted clause needs jurisdiction-specific treatment.

### 20. Rwanda B2B liability-cap result (row 8, Rwanda component)
**Classification: D → C.** Institutional secondary source (Chambers and Partners, §10.1) confirms Rwanda Law N° 45/2011 voids any clause excluding liability for fraud, gross negligence, or wilful misconduct, and treats liability limitations as enforceable "if reasonable and negotiated transparently," with courts/arbitral tribunals assessing proportionality. This is **already fully preserved** by LEG-FD-15's existing "mandatory non-excludable liability" carve-out (fraud, wilful misconduct, gross negligence, death/personal injury, non-excludable statutory warranty) and the 12-month-fees Business cap architecture, which this task does **not** reopen. No unfair-contract-term doctrine specific to B2B (as opposed to the 2026 Consumer Protection Law's B2C focus, confirmed by KTPress §10.3) was found imposing anything beyond what LEG-FD-15 already carves out. **Residual note:** this classification rests on an institutional secondary source, not this task's own read of Law 45/2011's text — a lower-confidence C than row 3's. **The zero-fee Business cap remains unresolved as a separate commercial/governance matter, not touched by this task.**

### 21. Burundi B2B liability result (row 8, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** No new Burundi-specific primary source on B2B unfair/unconscionable-terms doctrine (as distinct from the already-classified-C general non-excludable-liability principle at row 7, sourced to *Loi n° 1/11*) was located or read within this task's budget. Not derived from the consumer-protection statute's B2C provisions, per the task's explicit prohibition.

### 22. Rwanda indemnity result (row 9, Rwanda component)
**Classification: D → C.** The same Law N° 45/2011 fraud/gross-negligence/wilful-misconduct non-excludability principle (§20 above) applies equally to indemnity-clause enforceability as to liability-cap enforceability — an indemnity provision cannot, under Rwandan mandatory law, be used to shift liability for these categories. §20's existing narrow four-subject indemnity architecture is not broadened; this finding only confirms it is not undermined by Rwandan mandatory law. Same lower-confidence caveat (secondary-sourced) as row 8 Rwanda.

### 23. Burundi indemnity result (row 9, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** No Burundi-specific primary source on indemnity-clause enforceability/public-policy limitations (beyond the already-C-classified general non-excludable-liability principle at row 7) was located within this task's budget.

### 24. Rwanda operator-disclosure result (row 11, Rwanda component)
**Classification: D — UNRESOLVED (unchanged).** No Rwanda-specific statutory pre-contract/operator-disclosure regime (company-registration, regulatory status, platform-role disclosure) beyond the global CI-01 identity values was located. CI-01 itself is explicitly not resolved by this task (per instruction §7.I). This is the Rwanda component the task instruction flagged as "must not be omitted" — it is not omitted, and remains genuinely D for lack of located authority, not by default.

### 25. Rwanda subscription/commercial result (row 12, Rwanda component)
**Classification: D — UNRESOLVED (unchanged), narrowed.** Rwanda's 2026 Competition and Consumer Protection Law (Law n° 011/2026, confirmed via KTPress §10.3) is confirmed **B2C-focused**, not B2B — this narrows the row (removes one candidate mandatory-overlay source) but does not itself establish that no Rwanda-specific B2B billing/invoicing/tax-disclosure requirement exists independent of `DEC-SUB-*`. No such independent requirement was located. All open `DEC-SUB-*` items (prices, plan names, billing cycles, auto-renewal, refunds) preserved untouched.

### 26. Burundi subscription/commercial result (row 12, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** No Burundi-specific B2B invoicing/tax/billing-disclosure mandatory requirement independent of open `DEC-SUB-*` items was located within this task's budget.

### 27. Rwanda general-provisions result (row 13, Rwanda component)
**Classification: D — UNRESOLVED (unchanged).** No Rwanda-specific mandatory-law requirement on assignment, severability, entire-agreement, or survival clauses (beyond ordinary civil-law default rules, not independently researched at this granularity within this task's budget) was located. The prior C classification's flaw (resting on silence, not affirmative authority, per Entry 144's correction) is not repeated — this task does not assume generic drafting convention establishes C.

### 28. Burundi general-provisions result (row 13, Burundi component)
**Classification: D — UNRESOLVED (unchanged).** Same reasoning as row 13 Rwanda; no Burundi-specific authority located.

### 29. Existing Burundi mandatory-disclosure verification (row 11, Burundi component — already A, verify only)
**Verified, classification unchanged (A).** Re-inspected the Reconciliation Matrix row 4 and External Legal Opinion §4 citation of Burundi *Loi n° 1/11* Arts. 6–8 (operator identity, role separation, nature-of-rewards, data-processing disclosure) — internally consistent with Entry 144's correction record and with the closure report. This task did not independently re-fetch *Loi n° 1/11 de 2009*'s primary text (out of this task's research budget, and not required — the task instruction directs verification of the source *chain*, not a re-litigation of an already-reconciled A classification absent a specific contradiction, none of which was found). No additional detail beyond what is already recorded is identified as required for future drafting at this time; CI-01's own operator values remain unresolved and untouched, as instructed.

## 30. Prior→new classification matrix

| Row | Topic | Jurisdiction | Prior | Verified authority (this task) | Primary/secondary | Result | Drafting implication | Residual issue |
|---|---|---|---|---|---|---|---|---|
| 1 | B2B dispute/forum | Burundi | D | OHADA non-membership confirmed (ohada.org, primary/institutional) | Primary | **D** | None — no overlay authorized | No Burundi domestic-forum-mandate source located |
| 2 (residual) | Language | Burundi | D (nested in B) | None new | — | **D** | None | No B2B-specific language-mandate source located |
| 3 | E-contracting | Burundi | D | Burundi Law 1/22 (2024) read directly, Arts. 1–3 (arct.gov.bi) | Primary | **C** | Confirms LEG-FD-03 standard not contradicted | Consent-mechanics articles beyond p.8 and 2026 Data Protection Law "demonstrable consent" not cross-checked |
| 4 | Notices | Rwanda | D | Law No 22/2018 (litigation service only, secondary-sourced) | Secondary | **D** | None | No contractual-notice-clause authority located |
| 4 | Notices | Burundi | D | None new | — | **D** | None | No authority located |
| 6 | Force majeure | Rwanda | D | Law 45/2011 Art. 92 (secondary-sourced; primary PDF located, not read) | Secondary | **D** | None | Clause-text comparison against Art. 92 not performed (out of scope) |
| 6 | Force majeure | Burundi | D | Code Civil Livre III located (cejp.bi), not read | Located, unread | **D** | None | Same as above |
| 8 | Liability cap | Rwanda | D | Law 45/2011 non-excludability principle (secondary-sourced) | Secondary | **C** | Confirms LEG-FD-15 already compliant | Not independently read in primary text |
| 8 | Liability cap | Burundi | D | None new beyond row 7's existing C | — | **D** | None | No B2B unfair-terms doctrine source located |
| 9 | Indemnity | Rwanda | D | Same Law 45/2011 principle as row 8 | Secondary | **C** | Confirms §20 not undermined | Same as row 8 Rwanda |
| 9 | Indemnity | Burundi | D | None new | — | **D** | None | No authority located |
| 11 | Operator disclosure | Rwanda | D | None new | — | **D** | None | No Rwanda-specific regime located |
| 11 | Operator disclosure | Burundi | A | Re-verified, unchanged | Existing chain | **A** | Unchanged | None (source-chain verified) |
| 12 | Subscription/commercial | Rwanda | D | 2026 Consumer Protection Law confirmed B2C-focused (KTPress) | Secondary | **D** (narrowed) | None | No independent B2B billing-disclosure source located |
| 12 | Subscription/commercial | Burundi | D | None new | — | **D** | None | No authority located |
| 13 | General provisions | Rwanda | D | None new | — | **D** | None | No authority located |
| 13 | General provisions | Burundi | D | None new | — | **D** | None | No authority located |

## 31. Count D→A

**0.**

## 32. Count D→B

**0.**

## 33. Count D→C

**3** (row 3 Burundi e-contracting; row 8 Rwanda liability cap; row 9 Rwanda indemnity).

## 34. Remaining D count

**12** of the 15 D-bearing sub-rows tested (row 1 Burundi; row 2 residual Burundi; row 4 Rwanda; row 4 Burundi; row 6 Rwanda; row 6 Burundi; row 8 Burundi; row 9 Burundi; row 11 Rwanda; row 12 Rwanda; row 12 Burundi; row 13 Rwanda; row 13 Burundi — that is 13, see note). **Note on count:** the scope list in the closure report names 10 items, several of which (rows 4, 6, 8, 9, 12, 13) have both a Rwanda and a Burundi component, yielding 15 testable sub-rows in total (rows 1 and 11-Rwanda and 2-residual are single-jurisdiction). Of these 15, 3 moved to C (§33) and **12 remain D**.

## 35. Mandatory-law conflicts

**None identified.** No verified mandatory Rwandan or Burundian law was found to conflict with any settled Founder position (LEG-FD-01–16, `DEC-LOY-011`, FD-2/3/4, or any other listed protected decision). The OHADA non-membership finding (§13, row 1) is consistent with, not in tension with, LEG-FD-14/16. The Law 45/2011 non-excludability findings (rows 8–9 Rwanda) confirm, rather than conflict with, LEG-FD-15's existing carve-outs.

## 36. Founder decisions required

**None newly required by this task.** All D rows remain either genuinely unresolved for lack of located authority, or (row 1) resolved partially without requiring a new Founder decision. No mandatory-law conflict requiring escalation was found (§35).

## 37. Controlled Inputs required

**None.** No row's remaining D-status stems from a missing *value* rather than missing *legal verification* — per the task's own instruction, a Controlled Input is not proposed merely because legal verification remains incomplete.

## 38. §26 readiness

**Not fully drafting ready.** 12 of 15 tested sub-rows remain D; §26 substantive content for those topics cannot yet be drafted for either jurisdiction.

## 39. §27 index readiness

**Substantially ready at index/architecture level**, unchanged from the Part VIII readiness closure's own assessment — the three-way index structure (governed/default treatment; established overlay provisions [row 11 Burundi]; matters awaiting verification [all remaining D rows]) remains valid and is, if anything, better evidenced now (row 3 Burundi and rows 8–9 Rwanda can be indexed as "Core Terms apply, no overlay" rather than "awaiting verification").

## 40. Rwanda substantive-overlay readiness

**Not ready.** Only two Rwanda sub-rows (8, 9) moved to C this task, meaning "no Rwanda overlay needed" for those two narrow points — this is not "substantive Rwanda overlay content," since C means no overlay text is drafted at all for those rows. No Rwanda row reached A or B. Rwanda substantive overlay drafting readiness is unchanged from the prior assessment: no Rwanda mandatory or optional overlay content is ready to draft.

## 41. Burundi substantive-overlay readiness

**Row 11 (mandatory disclosure) remains the only established substantive-overlay content**, re-verified but not newly drafted (drafting was and remains out of this task's scope). Row 3 (e-contracting) moved to C — no overlay text needed. All remaining Burundi D rows are not ready.

## 42. Part VIII overall readiness gate

`PART VIII JURISDICTION VERIFICATION COMPLETE — BOUNDED DRAFTING READY WITH 12 EXPLICIT NON-RESOLUTIONS`

(12 remaining D sub-rows, itemized in §34 and the matrix at §30; 3 sub-rows resolved D→C, itemized in §33; 0 resolved to A or B; row 11 Burundi's existing A classification re-verified unchanged; no mandatory-law conflict; no new Founder decision or Controlled Input required.)

## 43. Files modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-jurisdiction-verification-report-2026-09-02.md` (created — this report)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md` (created — bounded evidence pack)
- `docs/00-governance/documentation-changes-log.md` (Entry 146 appended)

No other file modified. No Core Business Terms clause text, Part VIII placeholder, Decision Register entry, Controlled Inputs Register entry, or Drafting Traceability Matrix entry touched.

## 44. Diff summary

Two new files added (this report and the evidence pack); one existing file (`documentation-changes-log.md`) received one new entry appended at the top of its entries list, no other lines altered.

## 45. Commands executed

`git fetch`, `gh pr view 214`, `gh pr checks 214`, `gh pr view 214 --json comments/reviews`, `gh api .../pulls/214/reviews`, `git log`/`git merge-base --is-ancestor` (ancestor check), `gh pr merge 214 --merge --match-head-commit ...`, `gh pr view 214 --json state,mergedAt,mergeCommit`, `git fetch origin main`, `git log origin/main -1`, `git log -1 --format=%P <merge-commit>`, `gh run list --commit ...`, `gh run watch ... --exit-status`, `git status --short`, `git worktree list`, `git worktree add ... -b ... origin/main`, `git log -1` (baseline confirmation), file `find`/`grep` inventory of governing sources, `WebSearch` (7 queries), `WebFetch` (2 queries, one PDF), `Read` (PDF page extraction, pp.1–8 of Burundi Law 1/22).

## 46. External research sources

Listed in full in §9–10 above and in the evidence pack (`DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md`).

## 47. Dependencies added

**NONE.**

## 48. Config changes

**NONE.**

## 49. Application/source changes

**NONE.**

## 50. CI/check results

PR #214 merge-commit CI: green (§3). This task's own PR CI results to be confirmed after opening (§15 of task instruction; recorded by amendment or by the PR's own check history — not predicted here).

## 51. Automated-review findings/dispositions

To be recorded after Codex automated review runs on this task's PR (not yet available at time of writing this report).

## 52. Risks

- Three D→C reclassifications (§33) rest partly or wholly on secondary/institutional sources (Chambers and Partners; Flowmono) rather than this task's own full primary-text read — flagged at reduced confidence in §14/§20/§22, not asserted as high-confidence primary-verified findings.
- Two located-but-unread primary sources (Rwanda Law 45/2011 full text; Burundi Code Civil Livre III full text) remain a residual research gap for force-majeure clause-drafting (§18–19) — recommend a follow-up task read these in full before §25.4 force-majeure clause text is ever drafted.
- Burundi Law 1/22's e-contracting articles beyond pp.1–8 (definitions/scope only) were not reached — recommend a follow-up read of the law's substantive e-commerce/e-signature chapters before relying further on the row 3 C classification for actual clause drafting.
- 12 of 15 tested sub-rows remain genuinely D — Part VIII substantive drafting for Rwanda and most of Burundi remains blocked pending further verification, consistent with §42's gate.

## 53. Rollback instructions

This task's changes are additive-only (two new files, one appended log entry) on branch `docs/dec-legal-002-bt-part-viii-jur-verify-001`, isolated in worktree `/Volumes/PRODUCTION/Projects/_worktrees/11THONUS/temporary/jur-verify-001`, not yet merged to `main`. To roll back before merge: do not merge the PR, or `git worktree remove` the isolated worktree and delete the branch. PR #214's merge (§2) is a separate, already-completed, Founder-instructed action on `main` — rolling it back would require a separate Founder-authorized revert and is not recommended by this report (it was correctly merged per Founder instruction with verified head/CI).

## 54. Markdown report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-jurisdiction-verification-report-2026-09-02.md` (this file).

## 55. Legal-source evidence-pack path

`docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md`.

## 56. Documentation changes-log entry

Entry 146, `docs/00-governance/documentation-changes-log.md`.

## 57. Commit SHA

Recorded in the PR description / final commit after `git commit` (see PR).

## 58. PR number/state

Recorded after `gh pr create` (see task completion message).

## 59. Exact Founder next action

Review this report's 12 remaining D sub-rows (§34) and the two residual primary-source-read gaps (§52). No Founder decision is required by this task's findings (§36) — the two realistic next steps are: (a) authorize a follow-up task to read Rwanda Law 45/2011 and Burundi Code Civil Livre III in full text (resolving the force-majeure/liability/indemnity residual-confidence flags), and (b) decide whether to proceed to bounded §26/§27 drafting for the now-fully-resolved items (row 11 Burundi A; rows 3, 8, 9 partial-C) while leaving the remaining 12 D sub-rows reserved, or to wait for further verification across the board before any Part VIII drafting begins. This report recommends (a) before (b), given the reduced-confidence basis of the three C reclassifications, but does not decide this — that is a Founder call.

---

**STATUS PRESERVATION CONFIRMED:** `DEC-LEGAL-002 = OPEN_LEGAL` (unchanged). Terms configuration `NOT CONFIGURED` (unchanged). Capability 3 `Open` (unchanged). CI-01 `OPEN` (unchanged). CI-05 `OPEN` (unchanged). Parts I–VII unchanged. LEG-FD-01–16 unchanged. Part VIII clause state `UNDRAFTED` (unchanged). No status updated to FINAL/EFFECTIVE.

**FINAL BOUNDARY CONFIRMED:** No Part VIII clause text drafted. No Terms configuration performed. No application/source/Firebase/config change. No self-merge (PR to be reviewed and merged by the Founder or an authorized reviewer).

`PART VIII JURISDICTION VERIFICATION COMPLETE — BOUNDED DRAFTING READY WITH 12 EXPLICIT NON-RESOLUTIONS`
