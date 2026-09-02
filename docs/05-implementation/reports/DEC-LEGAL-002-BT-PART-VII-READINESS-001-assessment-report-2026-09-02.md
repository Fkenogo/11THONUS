# DEC-LEGAL-002-BT-PART-VII-READINESS-001 — Core Business Terms Part VII (§§21–25) Drafting-Readiness and Authority Assessment

> **Task:** `DEC-LEGAL-002-BT-PART-VII-READINESS-001` · **Date:** 2 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction
> **Scope:** Docs-only, bounded pre-drafting readiness assessment for Part VII (§§21–25) of the Core Business Terms. **No clause text drafted. No Core Business Terms modification. No Controlled Inputs Register, Drafting Traceability Matrix, or Decision Register modification. No application/source/configuration change.**

---

## 1. Assessment strategy

Establish the exact, current, merged Part VII architecture directly from the controlled Core Business Terms instrument (not from this task's own prompt or generic contract convention), then classify each of the five Part VII sections (§§21–25) against directly inspected authority: the Founder Legal Architecture Disposition Record (originally LEG-FD-01 through LEG-FD-15, extended to LEG-FD-16 by this report's own `-CORR-001` correction pass), the Reconciliation Matrix, the Terms Drafting Readiness Note, the current Controlled Inputs Register, the current Drafting Traceability Matrix, and the current Decision Register. For each section, separate (a) what a named authority already governs, (b) what is ordinary bounded legal-drafting judgment requiring no new authority, (c) what is genuinely open but independently omittable/reservable without blocking drafting, and (d) what would require a new narrow Founder or legal decision before drafting could begin. Cross-check every unresolved item against the existing Controlled Inputs Register before concluding a new Controlled Input is warranted — per the governing task instruction, only a genuine drafting blocker should produce one. No clause text is drafted at any point in this assessment.

## 2. Entry repository state

Branch `docs/dec-legal-002-bt-part-vii-readiness-001`, created fresh from `origin/main`. Working tree otherwise clean of tracked changes at task start; a set of pre-existing untracked files (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance` and `docs/05-implementation/reports` files, `docs/30-go-to-market/`, etc.) predate this task, are unrelated to it, and are left untouched.

## 3. Base SHA

`45637bf336174671726ce2d6b18897d0a8783fad`

## 4. PR #210 merge verification

Confirmed by direct inspection: `git log origin/main` shows `45637bf` as `Merge pull request #210 from Fkenogo/docs/dec-legal-002-bt-draft-006`, with parents `af1db33` (pre-merge `main`) and `be1f1db` (`docs(DEC-LEGAL-002-BT-DRAFT-006): correct stale §9.6 traceability scope label (PR #210 Codex review)`). PR #210 merged.

## 5. Parts I–VI baseline state

**Corrected by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-001` (2026-09-02) — see the Correction Pass at the end of this report.** Parts I–VI are each Founder-approved controlled drafting baselines: Part I (§§1–7, corrected `-CORR-001`), Part II (§§8–10), Part III (§§11–14), Part IV (§§15–17), Part V (§18), and Part VI (§§19–20) — each drafted with full clause text and each carrying Founder-approved controlled-drafting-baseline status. This status is a controlled-drafting-baseline approval only — it does **not** mean the overall Core Business Terms are final, effective, or configured: `DEC-LEGAL-002` remains `OPEN_LEGAL`, Terms configuration (`platformConfig/businessTerms`) remains `NOT CONFIGURED`, and Capability 3 remains `Open — partially implemented; not closed` (this task's own shorthand: "IN PROGRESS"). Parts VII–VIII remain headings/placeholders only, per the instrument's own §0.1 and its "End of Part VI" boundary statement. This correction updates only this assessment report and the changes-log; it does not itself reopen, redraft, or modify any Part I–VI clause text, and the current text of the controlled Core Business Terms instrument's own §0.1/Part-I preamble labels (still reading "pending Founder review" for Parts II–VI as of PR #210) is flagged in the Correction Pass as a separate, narrower administrative-label follow-up for the instrument itself — out of this task's file scope.

## 6. Exact Part VII headings

Quoted verbatim from the controlled instrument's Part 0, §0.1 Complete Proposed Section Architecture:

> **Part VII — Legal Mechanics** *(heading only — not drafted)*
> 21. Governing Law and Dispute Resolution (Business ↔ 11thONUS)
> 22. Changes to These Terms; Reacceptance
> 23. Data and Privacy (cross-reference only)
> 24. Notices
> 25. General Provisions (assignment, severability, entire agreement, force majeure, survival, language of the agreement)

This matches the task prompt's assumed subjects exactly — no divergence found. The instrument's own numbering note applies: "Section numbering below is provisional and may be revised once all Parts are drafted; it is not a legal citation convention adopted for the final instrument." The "End of Part VI" boundary text confirms: "Parts VII and VIII above (§§21–27) remain headings and placeholders only... No clause text for those Parts has been drafted, and none should be inferred from Part I, Part II, Part III, Part IV, Part V, or Part VI's treatment of adjacent topics."

## 7. Exact Part VIII headings

Quoted verbatim, same source:

> **Part VIII — Jurisdictional Overlays** *(architecture only — not drafted)*
> 26. Jurisdictional Overlay Mechanism
> 27. [Overlay index — populated as overlays are drafted; Burundi overlay not drafted here]

## 8. Authorities inspected

Directly inspected, first-hand, verbatim: LEG-FD-01 (Governing Interpretation Principle), LEG-FD-02 (Language Architecture), LEG-FD-03 (Electronic Acceptance), LEG-FD-09 (Customer Data Characterisation), LEG-FD-10 (Customer Terms Architecture), LEG-FD-11 (Dispute Architecture), LEG-FD-13 (Terms Changes/Reacceptance), LEG-FD-14 (B2B Dispute Resolution), and **LEG-FD-16 (Core Business Terms Governing Law, added by this report's own correction pass — see below)** — all read verbatim from `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` (now version 3.0). Reconciliation Matrix rows 3 (electronic acceptance), 12 (governing law), 14 (required languages), 15 (version-change/reacceptance) — read verbatim from `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md`. Terms Drafting Readiness Note — read for its layer architecture (§1) and its "governing law/disputes" readiness row. Current Core Business Terms v6.0 (all of Parts 0, I–VI, and the "End of Part VI"/"Status Reaffirmation" sections). Current Controlled Inputs Register v6.0 (full CI-01/CI-05 history through the Part VI review). Current Drafting Traceability Matrix (rows §7.1, §14.4, §17.3, §19.4, §20.1, §20.2 — the existing forward cross-references into §21/§22). Decision Register (`DEC-LEGAL-002` status line and Capability 3/Terms-configuration state, corroborated against the Core Business Terms' own "Status Reaffirmation" section). LEG-FD-04–08, 12, 15 were reviewed in the same pass for completeness but are not independently load-bearing for §§21–25 and are not cited as primary authority below except where an existing cross-reference already relies on them. Legal Opinion content is used only through its reconciled classification in the Reconciliation Matrix, never as freestanding authority.

## 9. §21 subject

Governing Law and Dispute Resolution (Business ↔ 11thONUS) — the B2B contractual dispute-resolution mechanism and the substantive law governing the Core Business Terms.

## 10. §21 authority

**Revised by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-001` — see the Correction Pass below.** LEG-FD-14 (B2B Dispute Resolution) governs the dispute-resolution sequence and forum architecture directly: good-faith resolution → mediation where appropriate → binding arbitration if unresolved; seat Kigali, Rwanda; institution KIAC; language English or French; scope limited to Business↔11thONUS contractual disputes (does not impose the same architecture on customer disputes, which remain governed by LEG-FD-11); jurisdictional overlays may modify this architecture only where mandatory applicable law requires a different mechanism for a specific jurisdiction's Business Terms addendum. LEG-FD-11 supplies the underlying three-tier dispute-allocation principle LEG-FD-14 resolves. **LEG-FD-16 (Core Business Terms Governing Law, added by this correction) now governs the substantive-governing-law question directly and is now Founder-decided authority, not merely a Classification-C drafting input:** the Core Business Terms are governed by the laws of Rwanda, subject to mandatory applicable law, non-waivable statutory/regulatory requirements, and jurisdiction-specific overlays. LEG-FD-16 is expressly a separate substantive-law decision, not inferred from the Kigali seat or the KIAC institution — LEG-FD-14's arbitration architecture and LEG-FD-16's governing-law decision remain two distinct, independently governed authorities that together supply §21's full content.

## 11. §21 unresolved items

See the full arbitration-mechanics classification in item 33 below. The substantive-governing-law question previously discussed in item 34 (now revised) is resolved by LEG-FD-16 and is no longer an unresolved item.

## 12. §21 classification

`BOUNDED DRAFTING READY` — unchanged in category, strengthened in substance. **Revised by this correction:** before LEG-FD-16, §21's substantive-governing-law element rested only on Reconciliation-row-12 Classification-C drafting input (a reasonable recommendation the drafter applied, not a decided fact); after LEG-FD-16, that element is now directly Founder-governed, the same footing as the dispute-resolution sequence, seat, institution, and language (all LEG-FD-14). §21 is not reclassified to `FULLY DRAFTING READY`, because a defined set of arbitration procedural mechanics (mediation institution/rules, arbitration rules beyond KIAC's own defaults, number/appointment of arbitrators, cost allocation, time limits) remains expressly and correctly left ungoverned by LEG-FD-14 itself — LEG-FD-14's own text lists these as "deliberately not decided here." This is not a drafting blocker (KIAC's own default rules supply defaults unless the drafted clause displaces them), but it is exactly the kind of genuinely-open, independently-omittable content that must be stated as an explicit non-resolution (or left to the named institution's own default rules) in the clause text itself — the same bounded-but-ready pattern already established for §22, §24, and §25, and reserved in this report's own taxonomy for `FULLY DRAFTING READY` only where a section (like §23) carries no unresolved content of any kind, governed or omittable. No item requires a new Founder/legal decision to begin drafting §21.

## 13. §22 subject

Changes to These Terms; Reacceptance — the mechanism by which the Core Business Terms may be changed, and when an already-accepting Business must reaccept.

## 14. §22 authority

LEG-FD-13 (Terms Changes/Reacceptance) governs directly: material changes affecting rights or obligations require affirmative reacceptance where appropriate under applicable law/governance; non-material/administrative changes may be communicated without reacceptance, subject to applicable law; no universal 14-day period; the existing versioned-acceptance/retrievable-evidence architecture (`BusinessTermsAcceptance`) is preserved and confirmed sound. Reconciliation Matrix row 15 confirms the version-reset/reacceptance-required-on-material-change principle and confirms the 14-day figure is not adopted. LEG-FD-13 itself separately determines that a dedicated reacceptance-on-Terms-change engineering implementation (what technically happens to an already-accepted Business when the governed Terms version later changes) has not yet been designed or authorized, and identifies this as requiring its own new, narrowly-scoped governed decision — already recorded as open Controlled Input CI-05, not created by this task. LEG-FD-03 and existing Traceability Matrix row §7.1 already flag this same boundary at §7.1 ("does not predetermine whether continued participation requires ongoing/repeat acceptance (deferred to §22/reacceptance decision)").

## 15. §22 unresolved items

**Revised by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-002` — see the Correction Pass below.** The "material" test itself is expressed directly in LEG-FD-13's own text ("changes affecting rights or obligations" vs. "non-material/administrative") and is usable as bounded drafting language without inventing a new test. Effective-date mechanics and archived-version-access statements are ordinary bounded drafting judgment, each answerable from already-governed material (Part I §7's acceptance architecture; LEG-FD-03's retrievability requirement) without inventing new product behaviour. Advance-notice timing is expressly not governed by any universal figure (LEG-FD-13) and is independently omittable/reservable. **The refusal/non-acceptance consequence is corrected out of "ordinary bounded drafting judgment" and placed inside CI-05, not treated as a separate drafting-judgment item:** CI-05 is defined as "the reacceptance-on-Terms-change engineering implementation decision (what technically happens when an already-accepted Business faces a new Terms version)" — a formulation broad enough to cover not only the mechanism by which reacceptance is technically requested, but also what happens on the wire when a Business refuses, fails, or has not yet completed a required reacceptance (continued access, restriction, suspension, or any other lifecycle/access consequence). Existing Terms §7.1/§7.4 already reserve exactly this boundary ("does not predetermine whether continued participation requires ongoing/repeat acceptance"). Treating the refusal/non-acceptance consequence as ordinary drafting judgment would have permitted a future §22 draft to invent that consequence (e.g., automatic suspension, automatic termination, automatic account blocking, continued full access, grandfathering, restriction to existing activity only, a new-business-only effect, a grace period, or a fixed deadline) before the required Founder/engineering decision — none of that is drafting judgment; all of it is CI-05's own unresolved question. The specific reacceptance-on-change *mechanism*, and the refusal/non-acceptance *consequence*, are therefore both CI-05 — genuinely open, already recorded, not duplicated as a new Controlled Input; §22 can state the LEG-FD-13 principle and cross-reference CI-05's unresolved status explicitly (covering both the mechanism and the refusal/non-acceptance consequence), exactly as §7.4 already does, without resolving either. Emergency/legal-required-amendment treatment and language-version treatment remain ordinary bounded drafting judgment under LEG-FD-01's fallback standard and LEG-FD-02's language architecture respectively — neither was implicated by the review finding.

## 16. §22 classification

`BOUNDED DRAFTING READY`. The principle-level material/non-material distinction, the non-adoption of a universal notice period, and the preservation of the existing versioned-acceptance architecture are all governed and drafting-ready. The genuinely open item — CI-05 — now explicitly covers both the reacceptance-on-change engineering mechanism and the refusal/non-acceptance consequence for an already-accepted Business; it is already recorded and not newly created — §22 can and should state this as an explicit non-resolution, the same technique Parts III–VI already use repeatedly (e.g. §13.7, §14.4, §15.7, §16.8, §18.6, §19.2) for comparable gaps, rather than silently omitting it or, worse, silently resolving it as if it were ordinary drafting judgment.

## 17. §23 subject

Data and Privacy (cross-reference only) — a pointer from the Core Business Terms to the separately governed privacy/data-processing framework, not a substantive privacy clause.

## 18. §23 authority

LEG-FD-09 (Customer Data Characterisation) and LEG-FD-10 (Customer Terms Architecture) govern directly and jointly establish that the complete privacy architecture is not resolved through `DEC-LEGAL-002` and remains governed separately (`DEC-LEGAL-001`, `EXT-LEG-001`) unless a future decision expressly brings it into scope; Terms of Use and privacy/data-processing instruments "perform different legal functions." The instrument's own §0.1 heading ("cross-reference only") already constrains §23's scope to match this authority exactly — no broader treatment is invited or permitted.

## 19. §23 unresolved items

None that block a cross-reference-only clause. §23 does not need to state, invent, or characterise any substantive privacy obligation — doing so would exceed both its own architecture heading and LEG-FD-09/10's scope boundary. The only judgment required is ordinary bounded drafting: pointing to the applicable privacy/data-processing instrument by description (not by inventing a document name/version that does not yet exist).

## 20. §23 classification

`FULLY DRAFTING READY`. Every element §23 needs (the cross-reference-only scope, the differentiated-instrument principle, the explicit exclusion of substantive privacy content) is already governed verbatim by LEG-FD-09/LEG-FD-10, and no unresolved item of any kind stands between current authority and a coherent §23 clause.

## 21. §24 subject

Notices — the mechanism, channel, and timing treatment for notices and communications between 11thONUS and a Business under the Core Business Terms.

## 22. §24 authority

No dedicated LEG-FD item addresses notices directly; §24 is governed only by LEG-FD-01's cross-cutting fallback standard (a reasonable, internationally recognizable digital-platform standard where law is silent — transparency, fairness, proportionality, reasonable notice, auditable records) and, for language, LEG-FD-02 (English/French core; local-language communication permitted where appropriate/required without becoming a general application language; Kirundi does not become a general app language automatically). No Reconciliation Matrix row and no readiness-table row addresses notice channels, deemed receipt, or notice timing as a distinct subject.

## 23. §24 unresolved items

Electronic notice, email, in-platform notice, and account notification are ordinary bounded drafting judgment consistent with the platform's existing electronic-first acceptance architecture — no invented mandatory channel is required to state that notice may be given through platform-available electronic means. Postal notice, deemed-receipt periods, and fixed notice addresses are not governed by any authority and must not be invented (per this task's own instruction and consistent with LEG-FD-06's declination to invent fixed numeric periods elsewhere) — these are independently omittable or statable only in flexible, non-numeric language. The distinction between legal-service notices and ordinary platform communications is ordinary bounded drafting judgment (a more formal channel for legal/termination-type notices vs. routine in-platform communications), not a matter requiring new authority. Language treatment follows LEG-FD-02 directly.

## 24. §24 classification

`BOUNDED DRAFTING READY`. §24 is draftable now using only LEG-FD-01's fallback standard and LEG-FD-02's language architecture, provided no fixed deemed-receipt period or mandatory single channel is invented — consistent with how LEG-FD-06 already declined to invent comparable fixed periods elsewhere in this instrument.

## 25. §25 subject

General Provisions — assignment, severability, entire agreement, force majeure, survival, and language of the agreement.

## 26. §25 authority

**Revised by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-001`, further revised by `-CORR-002` — see the Correction Pass below.** No dedicated LEG-FD item addresses any of these six topics as a distinct subject; §25's drafting basis is **not** "standard contract convention" or "near-universal boilerplate" treated as authority in its own right — that framing risks treating drafting convention as if it were a governed source. The actual drafting basis is: (1) consistency with the already-governed architecture stated elsewhere in this instrument (Parts I–VI, LEG-FD-01–16) — a §25 clause must not contradict or silently narrow any of it; (2) LEG-FD-01's global-standard fallback, which is itself a Founder-approved interpretive principle (not mere convention) for exactly the case where no more specific authority exists; (3) LEG-FD-02, for the language-of-the-agreement point (which governs that English/French are the core languages but does not itself resolve which governs in case of version conflict — a residual bounded drafting choice); (4) applicable mandatory law, which LEG-FD-01 itself preserves regardless of any general-provisions wording; and (5) omission — no §25 provision may be drafted that would create a new substantive Founder or commercial position (for example, an assignment clause must not silently grant or restrict a commercial right no existing authority addresses). Ordinary contract-drafting convention may inform *wording style* once these five sources establish that a provision is safe to draft at all — it does not itself supply the authority to draft one. Entire-agreement language must additionally respect LEG-FD-10's differentiated-instrument architecture (Core Business Terms, Customer Terms, Business Reward Program Rules, and jurisdictional overlays are related but distinct instruments) so that an "entire agreement" clause does not overstate itself as displacing the other three instrument types. **Force majeure carries an additional, sixth constraint not shared by the other five topics: it must remain consistent with the already-governed reward-obligation architecture** — FD-2, `DEC-LOY-011` (CONFIRMED), and Part III §§13.1–13.4 (plus §14.2, §15.4–15.5, §16.3, §18.5, which restate the same principle at suspension/programme-change/exit) establish that a validly earned reward is a Business obligation, that suspension or exit does not by itself extinguish it, and that 11thONUS is not the guarantor or funder of it. A future §25 force-majeure clause must not become a general excuse that lets a Business (or, worse, 11thONUS on a Business's behalf) treat an already-earned reward obligation as excused contrary to those clauses — force majeure is a mechanism for excusing performance made genuinely impossible by an external event, not a broader hardship or convenience exception, and drafting it broadly "because that is standard force-majeure boilerplate" would silently override §§13–16 rather than respect them.

## 27. §25 unresolved items

Assignment restriction, severability, and survival require no jurisdiction-specific value or new Founder/commercial product position to draft coherently under LEG-FD-01's fallback standard, provided the drafted language does not introduce a new substantive right or obligation not already implicit in the governed architecture (per item 26's omission principle) — each is answerable within that bound, not from convention alone. Entire-agreement language requires only that it be drafted consistently with LEG-FD-10 (not overstating exclusivity against the other three related instruments) — bounded judgment, not a gap. Which language version controls in case of English/French conflict is genuinely open (no authority states it) but is independently omittable or statable as a reserved/flexible point without blocking the rest of §25. **Force majeure is drafting-ready only within the item-26 earned-reward constraint, not as an open topic left to ordinary convention:** the scope of what event qualifies as force majeure at all is bounded by the Reconciliation Matrix row 5 treatment of "legally impossible" (see item 26's governing-source distinction below) — Reconciliation Matrix row 5 classifies the honour-obligation/redemption principle itself as Classification A (confirms `DEC-LOY-011`/FD-2, already Founder-governed) but classifies the Legal Opinion's specific narrow "legally impossible" *definition* as Classification B, expressly "Drafting input only" — **it is reconciled drafting input the drafter may use, not itself an independently Founder-decided global rule.** A future §25 force-majeure clause may therefore draft a narrow, genuinely-impossibility-based force-majeure concept using that reconciled input as guidance, but must not present the "legally impossible" formulation as a settled Founder position, and in no case may it extend force majeure to financial distress, commercial inconvenience, ordinary cost increases, ordinary operational difficulty, voluntary cessation, ordinary supply problems, or other broadly defined hardship as grounds to excuse an already-earned reward obligation.

## 28. §25 classification

`BOUNDED DRAFTING READY`. All six topics are drafting-ready now as ordinary bounded legal-drafting judgment under LEG-FD-01 (and, for the language-conflict point, LEG-FD-02), constrained by consistency with the governed architecture, applicable mandatory law, and the omission of any new substantive Founder/commercial position — not by standard-contract convention treated as a source of authority. Force majeure carries the additional constraint at item 26/27: it must preserve the already-governed reward-obligation architecture (FD-2, `DEC-LOY-011`, §§13.1–13.4 and its restatements) and must not be drafted broadly enough to excuse an already-earned obligation on hardship/inconvenience grounds. None of the six topics requires a new Founder or legal decision; the one open sub-point (which language version controls) is independently reservable, and force majeure's scope is bounded, not open, once the item-26/27 constraint is applied.

## 29. Arbitration-sequence authority

LEG-FD-14, confirmed verbatim: "Business ↔ 11thONUS contractual disputes use: good-faith resolution → mediation where appropriate → binding arbitration if unresolved."

## 30. Arbitration-seat authority

LEG-FD-14, confirmed verbatim: "Seat: Kigali, Rwanda."

## 31. KIAC authority

LEG-FD-14, confirmed verbatim: "Institution/rules: Kigali International Arbitration Centre (KIAC)." LEG-FD-14 further confirms that "KIAC's own default procedural rules will supply defaults unless the drafted clause displaces them" for the mechanics LEG-FD-14 itself does not resolve.

## 32. Arbitration-language authority

LEG-FD-14, confirmed verbatim: "Language: English or French."

## 33. Unresolved arbitration mechanics

**Revised by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-002` — see the Correction Pass below.** Classified individually, per LEG-FD-14's own text ("What is deliberately not decided here...") only. Generic arbitration/contract convention ("standard boilerplate," "ordinary practice") is **not** treated as authority for any row — a row is omittable because no governed source addresses it and a coherent §21 does not need it drafted, not because convention is thought to supply a safe default. Where LEG-FD-14/KIAC's own default rules already produce a procedural result without bespoke Terms language, the recommended drafting treatment is to omit bespoke clause detail and let the applicable KIAC rules/law operate, rather than to draft language purporting to establish the result itself:

| Mechanic | Classification |
|---|---|
| Mediation institution/rules | Omittable unresolved — not addressed by LEG-FD-14; no bespoke clause required; may be left to the parties' good-faith process or KIAC facilitation |
| Whether mediation is mandatory or conditional | Governed as conditional — LEG-FD-14's own text is "mediation **where appropriate**," not a mandatory universal step |
| Arbitration rules (beyond KIAC's own defaults) | Governed by omission — KIAC's own default rules apply unless displaced (LEG-FD-14, explicit); no bespoke rule-set needs drafting |
| Number of arbitrators | Omittable unresolved — LEG-FD-14 expressly declines to decide this; no authority supports drafting a figure; KIAC's own default rule applies by naming KIAC, without further Terms language |
| Arbitrator appointment | Omittable unresolved — same basis; no bespoke appointment mechanism should be drafted |
| Cost allocation | Omittable unresolved — LEG-FD-14 expressly declines ("clear cost allocation" raised by the Legal Opinion §13 but not adopted); no bespoke allocation rule should be drafted |
| Interim/emergency relief | Omittable unresolved — not addressed by any authority; no direct authority supports drafting an emergency-relief right or procedure; where KIAC's own rules provide for this, no bespoke Terms language is needed to invoke them |
| Confidentiality | Omittable unresolved — not addressed by any authority; a confidentiality obligation must not be invented merely because it is common in arbitration practice; if KIAC's own rules address confidentiality, no bespoke Terms clause is needed to invoke that |
| Consolidation/joinder | Omittable unresolved — not addressed; not required for a coherent §21 |
| Class/group proceedings | Omittable unresolved — not addressed by any authority; not invented here |
| Time limits | Omittable unresolved — LEG-FD-14 expressly declines ("time limits for claims" raised by the Legal Opinion §13 but not adopted); no bespoke limitation period should be drafted |
| Court enforcement | Omittable unresolved — enforcement of an arbitral award is a matter of applicable law and the seat (Rwanda/KIAC), not a product or Founder decision; no bespoke enforcement-forum clause should be drafted merely because naming one is common practice |
| Governing procedural law of the arbitration | Omittable unresolved — LEG-FD-14 names the seat and institution (Kigali, KIAC) but does not separately decide the arbitration's procedural law (the *lex arbitri*, distinct from LEG-FD-16's substantive governing law); no bespoke procedural-law clause should be drafted merely because procedural law commonly follows the seat as a matter of convention — if a clause is drafted at all, it must be limited to naming the seat/institution LEG-FD-14 already establishes, not to asserting a procedural-law rule beyond that |

None of these is classified blocking unresolved. Every row above is independently omittable — the correction does not add a blocker, it removes "generic convention" as a stated basis for treating any of them as safe to draft.

## 34. Governing-substantive-law status

**Resolved by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-001` — see the Correction Pass below.** The original assessment correctly concluded that existing authority did not establish that the Kigali arbitration seat automatically fixes Rwanda as the substantive governing law of the Core Business Terms — the two were, and remain, distinct questions, and this assessment does not infer one from the other. It also correctly identified that, at the time of the original assessment, Reconciliation Matrix row 12 recorded the Legal Opinion's recommended split (Business Terms → Rwanda law; Customer Terms for Burundi residents → Burundi law) only as Classification C — "recorded as counsel's recommended split; final governing-law clause selection remains a legal-drafting decision at Terms-drafting time, informed by but not concluded by this reconciliation" — and that Founder review of that Classification-C status does not itself authorize a drafter to select governing law through ordinary drafting judgment. **The Founder has now made that decision directly, recorded as LEG-FD-16 (Core Business Terms Governing Law):** the Core Business Terms are governed by the laws of Rwanda, subject to mandatory applicable law, non-waivable statutory/regulatory requirements, and jurisdiction-specific overlays. LEG-FD-16 is expressly a separate substantive-law decision, not inferred from the Kigali seat or the KIAC institution (both remain governed only by LEG-FD-14), and does not automatically extend Rwanda law to the Customer Terms, Business Reward Program Rules, mandatory consumer claims, or jurisdiction-specific overlay matters (LEG-FD-16's own scope boundary). **Conclusion:** §21's governing-law element is now Founder-governed authority (LEG-FD-16), not merely bounded drafting judgment applying a Classification-C recommendation — see the revised §21 classification at item 12.

## 35. Terms-change authority

LEG-FD-13, confirmed verbatim (see item 14 above and the full quotation in the Founder Legal Architecture Disposition Record).

## 36. Reacceptance authority

LEG-FD-13 plus the existing `BusinessTermsAcceptance`/`assertCurrentBusinessTermsAccepted` architecture (confirmed sound, not weakened); the outstanding reacceptance-on-change *implementation* question is CI-05 (open, not created by this task).

## 37. Material-change test status

Governed at the principle level directly by LEG-FD-13's own text ("changes affecting rights or obligations" vs. "non-material/administrative"). No numeric or exhaustive-catalogue test is governed or required — a coherent §22 can state the qualitative standard without inventing a more granular test.

## 38. Notice architecture

No dedicated authority beyond LEG-FD-01's fallback standard and LEG-FD-02's language architecture (see items 21–24 above). No fixed deemed-receipt period, mandatory channel, or notice-address requirement is governed or may be invented.

## 39. Notice-channel authority

Same as item 38 — LEG-FD-01 fallback only; electronic/in-platform channels are consistent with existing platform architecture and require no invented mandate; postal notice and any single mandatory channel are not governed and are not invented.

## 40. Language treatment

LEG-FD-02 governs directly: core product languages remain English and French; local-language communication (including Kirundi) may be used for customer communication, legal-accessibility material, or where legally required, without becoming a general application language; Kirundi does not become a general app language automatically. Applied to §24/§25: notices and the governing-language-of-the-agreement clause may reference English/French as the operative languages without inventing a Kirundi requirement, consistent with Reconciliation Matrix row 14's own treatment.

## 41. Electronic-contracting overlap

LEG-FD-03's affirmative-acceptance/identifiable-party/exact-version/authoritative-timestamp/retrievable-Terms standard is already fully stated and governed at Part I §7 (Acceptance and Formation) of the current instrument, and Traceability Matrix row §7.1 already anticipates the §22 boundary explicitly. Part VII should cross-reference §7 rather than duplicate its content — no forced-scroll or additional-confirmation requirement should be introduced in Part VII, consistent with LEG-FD-03's own "not a global requirement" determination. This is a non-duplication recommendation for the eventual drafting task, not an unresolved authority question.

## 42. Part VIII deferrals

Jurisdiction-specific mandatory requirements — a Burundi-mandated language requirement beyond LEG-FD-02's core architecture, Rwanda/Burundi-specific notice-service or deemed-receipt rules under local procedural law, and any jurisdiction-specific override of the Kigali/KIAC arbitration architecture under mandatory local law (LEG-FD-14's own overlay proviso) — belong to the not-yet-drafted Part VIII (Jurisdictional Overlays), not to Part VII. Part VII's own content must state only the portable, global (Layer 1) rule plus, where relevant, a general forward reference to the overlay mechanism — following the same pattern §19.4 already establishes for liability. No jurisdiction-specific requirement should be silently absorbed into a Part VII "global" clause.

## 43. New CI assessment

No new Controlled Input is warranted. Every genuinely open Part VII item reviewed above is either (a) independently omittable (arbitration procedural mechanics LEG-FD-14 itself declines to resolve; notice deemed-receipt/channel specifics; which language version controls); (b) ordinary bounded legal-drafting judgment requiring no product or legal position (severability, force majeure, assignment, survival, entire-agreement language, effective-date mechanics, notice formality distinctions); or (c) already covered by the existing CI-05 (the reacceptance-on-change engineering mechanism), which this assessment does not duplicate. **The one item that previously sat closest to a Controlled Input — the substantive governing-law question — is not converted into one; it is instead resolved directly by Founder disposition (LEG-FD-16), which is the correct governance instrument for a Founder-level product/legal-architecture position, consistent with how LEG-FD-14/15 resolved the comparable dispute-forum and liability-cap questions rather than being routed through the Controlled Inputs Register.** None of the remaining open items requires inventing a value or resolving a new open Founder/legal question to make a coherent Part VII clause set draftable.

## 44. CI-01/CI-05 state

Unchanged and preserved. CI-01 (operator's registered legal name, registration/company number, registered address — required before Founder approval and before legal approval) and CI-05 (the reacceptance-on-Terms-change engineering implementation decision — required before Terms configuration) remain the only two open Controlled Inputs across the entire Core Business Terms instrument, confirmed by direct inspection of the current Controlled Inputs Register (v6.0). This assessment adds none.

## 45. DEC-LEGAL-002 state

`OPEN_LEGAL`, unchanged — confirmed by direct inspection of the Decision Register's most recent controlled-update entry and corroborated by the Core Business Terms' own "Status Reaffirmation" section.

## 46. Terms configuration state

`NOT CONFIGURED` (`platformConfig/businessTerms`), unchanged — confirmed the same way.

## 47. Capability 3 state

Open — engineering work packages complete; blocked on governed Terms-content configuration (`CDR-001` §5), unchanged — confirmed the same way.

## 48. Overall Part VII gate

`PART VII DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS — RWANDA GOVERNING LAW FOUNDER-GOVERNED — REVIEW FINDINGS RESOLVED`. **Revised by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-001` and `-CORR-002`.** `-CORR-001`: the gate category was unchanged (still qualified by explicit non-resolutions, principally the arbitration procedural mechanics and CI-05), but the substantive-governing-law question that previously sat at the boundary of "drafting input, not decided fact" became Founder-decided (LEG-FD-16). `-CORR-002`: the gate category remains unchanged again — no new blocker was found — but the two outstanding P2 review findings (the §22 refusal/non-acceptance consequence wrongly bucketed as drafting judgment instead of CI-05; the §25 force-majeure scope not yet expressly bounded by the earned-reward architecture) are now resolved, and the arbitration-mechanics table no longer cites generic convention as authority for any row. The label records that these review findings are resolved, not that any new content became drafting-ready.

## 49. Exact drafting-ready scope

**Revised by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-002`.** A future Part VII drafting task may draft: (§21) the full good-faith→mediation-where-appropriate→binding-arbitration sequence with Kigali/KIAC/English-or-French exactly as LEG-FD-14 states, the substantive governing-law clause naming Rwanda law exactly as LEG-FD-16 states (subject to the mandatory-law/non-waivable-requirements/jurisdictional-overlay carve-out LEG-FD-16 itself states, and without extending it to the Customer Terms, Business Reward Program Rules, or mandatory consumer claims), and a general jurisdictional-overlay forward reference (not specific overlay mechanics) — with no bespoke clause for any item 33 lists as omittable (mediation rules, arbitrator number/appointment, cost allocation, time limits, interim/emergency relief, confidentiality, court enforcement, procedural law) beyond naming the seat/institution LEG-FD-14 already establishes; (§22) the material/non-material reacceptance principle exactly as LEG-FD-13 states, cross-referencing Part I §7's existing acceptance architecture and stating CI-05's non-resolution explicitly in the clause text — covering **both** the reacceptance-on-change mechanism **and** the refusal/non-acceptance consequence — using the same non-resolution technique already established at §7.4/§13.7/§14.4/§15.7/§16.8/§18.6/§19.2; (§23) a cross-reference-only pointer to the separately governed privacy/data-processing framework, with no substantive privacy content; (§24) a notice-mechanism clause using only electronic/in-platform channels and LEG-FD-02's language architecture, with no fixed deemed-receipt period or mandatory single channel; (§25) standard assignment, severability, entire-agreement (respecting LEG-FD-10's differentiated-instrument architecture), and survival provisions, plus a language-of-the-agreement clause naming English/French as the operative languages, plus a force-majeure provision that is expressly constrained not to excuse or extinguish an already-validly-earned reward obligation contrary to §§13.1–13.4/§14.2/§15.4–15.5/§16.3/§18.5 (FD-2, `DEC-LOY-011`) and that does not treat financial distress, commercial inconvenience, ordinary cost increases, ordinary operational difficulty, voluntary cessation, ordinary supply problems, or other broadly defined hardship as force majeure for that purpose — all drafted per item 26's authority basis (governed architecture consistency, LEG-FD-01/02, mandatory law, and omission of any new substantive position) rather than from contract convention alone.

## 50. Exact prohibited/unresolved content

**Revised by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-002`.** Must not be invented in Part VII: any specific number of arbitrators, arbitrator-appointment mechanism, cost-allocation formula, claim time-limit, confidentiality obligation, court-enforcement forum, or procedural-law rule for arbitration beyond naming the LEG-FD-14 seat/institution (LEG-FD-14 either expressly declines each or does not address it, and none may be drafted merely because it is common arbitration/contract practice); any fixed advance-notice period for Terms changes (LEG-FD-13 expressly declines a universal figure, expressly rejects the 14-day figure); any fixed deemed-receipt period or single mandatory notice channel (no authority establishes either); any substantive privacy/data-processing obligation in §23 (reserved to the separate privacy governance track per LEG-FD-09/10); any Rwanda- or Burundi-specific mandatory-law mechanics in Part VII itself (reserved to the undrafted Part VIII); **any resolution of CI-05's reacceptance-on-change engineering mechanism *or* CI-05's refusal/non-acceptance consequence** — specifically, no automatic suspension, automatic termination, automatic account blocking, continued full access, grandfathering, restriction to existing activity only, a new-business-only effect, a grace period, a fixed deadline, or any other lifecycle/access consequence may be drafted for a Business that refuses, fails, or has not yet completed a required reacceptance (all remain open, resolved only via CI-05); any restatement or alteration of LEG-FD-03's acceptance standard as a stricter Part VII requirement (e.g., forced scrolling) not itself governed for Part VII; any §25 force-majeure treatment of financial distress, commercial inconvenience, ordinary cost increases, ordinary operational difficulty, voluntary cessation, ordinary supply problems, or other broadly defined hardship as an excuse for an already-validly-earned reward obligation, contrary to §§13.1–13.4/§14.2/§15.4–15.5/§16.3/§18.5.

## 51. Founder decisions required, if any

None. No item identified above requires a new narrow Founder or legal decision before Part VII drafting may begin. This differs from Part VI's own pre-drafting history (which required a dedicated authority-confirmation task, `DEC-LEGAL-002-BT-PART-VI-AUTH-001`, to resolve indemnity-scope classification questions) only in that Part VII's authorities were already sufficiently resolved by LEG-FD-13/14 (both added specifically to close out Terms-drafting readiness, per `DEC-LEGAL-002-FOUNDER-CLOSE-001`) that no comparable additional authority-confirmation task is needed — this assessment itself performs that confirmation function for Part VII.

## 52. Files modified

`DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md` (this file, corrected in place by `-CORR-001` and `-CORR-002`); `documentation-changes-log.md` (Entry 137 corrected/Entry 138 `-CORR-001`/Entry 139 `-CORR-002` correction entries added). `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` was modified by `-CORR-001` (LEG-FD-16 added, version 2.0 → 3.0) and is **not** modified by `-CORR-002` — LEG-FD-16 is re-verified, unchanged in substance, no administrative correction to it was genuinely required.

## 53. Diff summary

`-CORR-002` corrects this report in place (items 15–16 §22, 26–28 §25, 33 arbitration mechanics, 48–50, plus a new Correction Pass subsection) and adds one changes-log entry (Entry 139). No Core Business Terms, Controlled Inputs Register, Drafting Traceability Matrix, or Decision Register file touched. No Founder Legal Architecture Disposition Record change in this pass. No application/source/configuration file touched.

## 54. Commands executed

`git fetch origin`; `gh pr view 211`/`gh pr diff 211 --name-only` (entry-gate verification); `gh api repos/Fkenogo/11THONUS/pulls/211/reviews` and `.../pulls/211/comments` (review-thread inventory); `git status`; direct file edits to the report and changes-log; `git add`/`git commit`/`git push` on the existing branch `docs/dec-legal-002-bt-part-vii-readiness-001`; `gh api ... -X PATCH .../pulls/211` (PR body update, informational, no repository content change); `gh api ... -X POST .../pulls/comments/{id}/replies` (review-thread replies) and `gh api ... -X PATCH` (thread resolution, via GraphQL `resolveReviewThread`).

## 55. Dependencies/config changes

None.

## 56. Application/source changes

NONE.

## 57. Risks

If a future drafting task treats LEG-FD-16 as extending Rwanda governing law to the Customer Terms, Business Reward Program Rules, or mandatory consumer claims, it would exceed LEG-FD-16's own scope boundary — the drafting task should preserve that boundary exactly as stated. If a future drafting task invents a deemed-receipt period or mandatory notice channel for §24, or a new substantive right/obligation in §25 "for completeness," it would silently create governance content this assessment expressly found ungoverned — any such addition must be flagged as a new explicit non-resolution or, if genuinely needed, escalated as a narrow Founder/legal question rather than invented. The controlled Core Business Terms instrument's own §0.1/Part-I-preamble text still labels Parts II–VI as "draft, pending Founder review" as of PR #210 — this correction records the Founder-approved-baseline status in this report and the changes-log only; the instrument's own labels are flagged, not corrected, here (see the Correction Pass), and remain a narrow follow-up risk of internal-corpus inconsistency until a future task updates them.

## 58. Rollback instructions

Revert this commit / close PR #211 without merging; the same three files are the only ones touched, so rollback is a single-commit revert.

## 59. Report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md`

## 60. Changes-log entry

Entry 137 (original) and Entry 138 (`-CORR-001`) left in place with pointers; a new Entry 139 added in `docs/00-governance/documentation-changes-log.md` documenting `DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-002`.

## 61. Commit SHA

Recorded in the completion message after commit.

## 62. PR number/state

PR #211, updated in place with this correction commit and its PR-body/review-thread metadata. Not self-merged.

## 63. Exact Founder next action

Review this correction (§22 refusal/non-acceptance now explicitly inside CI-05; §25 force-majeure now expressly bounded by the earned-reward architecture; arbitration-mechanics table no longer citing generic convention as authority) and, if satisfied, authorize a future `DEC-LEGAL-002-BT-DRAFT-007` (or equivalent) task to draft Part VII (§§21–25) clause text strictly within the drafting-ready scope at item 49, preserving every explicit non-resolution at item 50, LEG-FD-16's own scope boundary, and not resolving CI-05 (either its reacceptance-mechanism or its refusal/non-acceptance-consequence question) or any Part VIII jurisdictional-overlay mechanic within Part VII. Separately, consider authorizing a narrow administrative-label follow-up to update the Core Business Terms instrument's own §0.1/Part-I-preamble baseline-status labels for Parts II–VI to match the `-CORR-001` correction (flagged, not performed, by this task's file scope).

---

## Correction Pass (`DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-002`, 2026-09-02)

Following further Founder/Codex review of PR #211 (two open P2 threads, `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md` comment ids `3911591298` and `3911591302`), both findings were independently confirmed genuine and corrected in place; LEG-FD-16 was re-verified and preserved unchanged:

**P2-A — §22 refusal/non-acceptance consequence.** The prior text (item 15) classified the refusal/non-acceptance consequence — what happens when an already-accepted Business refuses, fails, or has not yet completed a required reacceptance — as ordinary bounded drafting judgment answerable from Part I §7's acceptance architecture. This was incorrect: CI-05 is defined broadly enough ("what technically happens when an already-accepted Business faces a new Terms version") to cover this exact question, and existing §7.1/§7.4 already reserve it. Corrected: the refusal/non-acceptance consequence is now stated as part of CI-05, not ordinary drafting judgment, at items 15, 16, 49, and 50. A future §22 draft must not invent any lifecycle or access consequence for this scenario — automatic suspension, automatic termination, automatic account blocking, continued full access, grandfathering, restriction to existing activity only, a new-business-only effect, a grace period, or a fixed deadline are all listed at item 50 as prohibited inventions, not drafting judgment. No new Controlled Input was created — this remains CI-05.

**P2-B — §25 force majeure / earned-reward boundary.** The prior text (items 26–28) classified force majeure as an ordinary §25 topic requiring no jurisdiction-specific value, without expressly constraining it against the already-governed reward-obligation architecture (FD-2, `DEC-LOY-011`, Part III §§13.1–13.4 and its restatements at §14.2/§15.4–15.5/§16.3/§18.5). Corrected: item 26 now states the sixth, force-majeure-specific constraint directly — a future force-majeure clause must not become a general excuse letting an already-earned reward obligation be treated as excused contrary to §§13–16, and must not extend to financial distress, commercial inconvenience, ordinary cost increases, ordinary operational difficulty, voluntary cessation, ordinary supply problems, or other broadly defined hardship. Item 27 re-checked the Reconciliation Matrix's row-5 "legally impossible" input the reviewer identified and classifies it precisely: the underlying honour-obligation/redemption principle is Classification A (confirms `DEC-LOY-011`/FD-2, already Founder-governed), but the Legal Opinion's specific narrow "legally impossible" *definition* is Classification B, expressly "Drafting input only" in the Reconciliation Matrix's own text — reconciled drafting input the drafter may use as guidance, not itself an independently Founder-decided global rule. This is not overstated as Founder-governed policy. §25's classification (`BOUNDED DRAFTING READY`) is unchanged; its scope is now bounded, not open, on this point.

**Arbitration procedural-mechanics wording (item 33).** Re-reviewed per the task's own instruction (not itself a Codex-flagged P2, but corrected for internal consistency with the two P2 corrections' underlying principle — authority, not convention, is the basis for treating any drafting choice as safe). Confidentiality, court enforcement, and governing procedural law were reclassified from "Drafting judgment — standard boilerplate/ordinary convention" to "Omittable unresolved" — no direct authority supports drafting bespoke language for any of the three, and none is needed for a coherent §21 (KIAC's own rules and applicable law operate without it). Interim/emergency relief's existing "Omittable unresolved" classification is preserved but its stated basis is corrected to remove "ordinary drafting judgment" as a stated source. This correction does not reopen LEG-FD-14 — every row remains independently omittable, not blocking; only the stated basis for treating each as safe is corrected.

**LEG-FD-16 integrity.** Re-verified directly against the Founder Legal Architecture Disposition Record (version 3.0): Rwanda substantive governing law, subject to mandatory applicable law/non-waivable requirements/jurisdiction-specific overlays; explicitly distinct from the Kigali seat and KIAC institution (LEG-FD-14, unaltered); explicitly not extended to the Customer Terms, Business Reward Program Rules, mandatory consumer claims, or jurisdiction-specific overlay matters. Unchanged in substance; no administrative correction was genuinely required, so the disposition record file is not touched by this correction pass.

**Parts I–VI baseline status.** Re-verified unchanged from `-CORR-001`: each Founder-approved controlled drafting baseline; `DEC-LEGAL-002`/Terms configuration/Capability 3 all unchanged.

**CI-01/CI-05 state.** Unaffected by this correction — still the only two open Controlled Inputs; CI-05's scope is clarified (both the reacceptance mechanism and the refusal/non-acceptance consequence), not expanded into a new item.

**Overall gate.** `PART VII DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS — RWANDA GOVERNING LAW FOUNDER-GOVERNED — REVIEW FINDINGS RESOLVED`.

---

## Correction Pass (`DEC-LEGAL-002-BT-PART-VII-READINESS-001-CORR-001`, 2026-09-02)

Following Founder review of PR #211, two corrections were applied to this report, in place, plus one new Founder legal-architecture disposition was recorded:

**Correction A — Parts I–VI baseline status.** The original report (item 5) stated Part I alone was the Founder-approved baseline and Parts II–VI remained "draft pending Founder review." Per Founder direction, this is corrected: Parts I–VI (§§1–20) are each Founder-approved controlled drafting baselines. This status change does **not** alter `DEC-LEGAL-002` (`OPEN_LEGAL`, unchanged), Terms configuration (`NOT CONFIGURED`, unchanged), or Capability 3 (`Open — partially implemented; not closed`, unchanged — this task's own shorthand: "IN PROGRESS") — a controlled-drafting-baseline approval is not final/effective/configured Terms content. This correction does not reopen, redraft, or modify any Part I–VI clause text. Note: the controlled Core Business Terms instrument's own §0.1/Part-I-preamble labels (as merged through PR #210) still read "pending Founder review" for Parts II–VI; this is flagged as a separate, narrower administrative-label follow-up for that instrument itself, outside this task's file scope (report + changes-log + the Founder Legal Architecture Disposition Record only).

**Correction B — LEG-FD-16, Core Business Terms Governing Law.** The original report correctly distinguished the arbitration seat/institution (LEG-FD-14) from the substantive governing-law question (previously Reconciliation-row-12 Classification C — a drafting input, not a decided fact) and correctly declined to infer one from the other. Per Founder direction, Founder review of PR #211 does not itself authorize a drafter to select governing law through ordinary drafting judgment — the Founder has instead made that decision directly, recorded as **LEG-FD-16** in the Founder Legal Architecture Disposition Record (version 3.0): the Core Business Terms are governed by the laws of Rwanda, subject to mandatory applicable law, non-waivable statutory/regulatory requirements, and jurisdiction-specific overlays; expressly not inferred from the Kigali seat or KIAC institution; expressly not extended to the Customer Terms, Business Reward Program Rules, mandatory consumer claims, or jurisdiction-specific overlay matters. §21's authority (item 10) and classification (item 12) are updated accordingly; §21 remains `BOUNDED DRAFTING READY` (not reclassified to `FULLY DRAFTING READY`) because a defined, LEG-FD-14-acknowledged set of arbitration procedural mechanics remains open and independently omittable — the governing-law element alone moving from bounded-judgment to Founder-governed authority does not clear every open item in the section. No new Controlled Input was created for the governing-law question — LEG-FD-16 resolves it directly, the same governance instrument LEG-FD-14/15 already used for the comparable dispute-forum and liability-cap questions.

**§25 caution applied.** Item 26 (§25 authority) is corrected to remove language that treated "near-universal boilerplate"/"standard contract convention" as if it were itself a source of drafting authority. §25's actual authority basis is restated as: consistency with the already-governed architecture; LEG-FD-01's global-standard fallback; LEG-FD-02 where language is relevant; applicable mandatory law; and omission of any provision that would create a new substantive Founder/commercial position. §25's classification (`BOUNDED DRAFTING READY`) is unchanged; only its stated basis is corrected.

**§22, §23, §24 re-verified, not rewritten.** Each was re-read against LEG-FD-13, LEG-FD-09/10, and LEG-FD-01/02 respectively; no defect was found in any of the three; their classifications (`BOUNDED DRAFTING READY`, `FULLY DRAFTING READY`, `BOUNDED DRAFTING READY`) and content are unchanged. CI-05 is preserved exactly as the existing engineering reacceptance-on-change gap for §22; no new Controlled Input was created for §22, §23, or §24.

**CI-01/CI-05 state.** Unaffected by either correction — still the only two open Controlled Inputs.

**Overall gate.** `PART VII DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS — RWANDA GOVERNING LAW FOUNDER-GOVERNED`.

---

## FINAL GATE

`PART VII DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS — RWANDA GOVERNING LAW FOUNDER-GOVERNED — REVIEW FINDINGS RESOLVED`
