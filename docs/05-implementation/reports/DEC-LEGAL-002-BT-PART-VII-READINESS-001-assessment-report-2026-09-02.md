# DEC-LEGAL-002-BT-PART-VII-READINESS-001 — Core Business Terms Part VII (§§21–25) Drafting-Readiness and Authority Assessment

> **Task:** `DEC-LEGAL-002-BT-PART-VII-READINESS-001` · **Date:** 2 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction
> **Scope:** Docs-only, bounded pre-drafting readiness assessment for Part VII (§§21–25) of the Core Business Terms. **No clause text drafted. No Core Business Terms modification. No Controlled Inputs Register, Drafting Traceability Matrix, or Decision Register modification. No application/source/configuration change.**

---

## 1. Assessment strategy

Establish the exact, current, merged Part VII architecture directly from the controlled Core Business Terms instrument (not from this task's own prompt or generic contract convention), then classify each of the five Part VII sections (§§21–25) against directly inspected authority: the Founder Legal Architecture Disposition Record (LEG-FD-01 through LEG-FD-15), the Reconciliation Matrix, the Terms Drafting Readiness Note, the current Controlled Inputs Register, the current Drafting Traceability Matrix, and the current Decision Register. For each section, separate (a) what a named authority already governs, (b) what is ordinary bounded legal-drafting judgment requiring no new authority, (c) what is genuinely open but independently omittable/reservable without blocking drafting, and (d) what would require a new narrow Founder or legal decision before drafting could begin. Cross-check every unresolved item against the existing Controlled Inputs Register before concluding a new Controlled Input is warranted — per the governing task instruction, only a genuine drafting blocker should produce one. No clause text is drafted at any point in this assessment.

## 2. Entry repository state

Branch `docs/dec-legal-002-bt-part-vii-readiness-001`, created fresh from `origin/main`. Working tree otherwise clean of tracked changes at task start; a set of pre-existing untracked files (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance` and `docs/05-implementation/reports` files, `docs/30-go-to-market/`, etc.) predate this task, are unrelated to it, and are left untouched.

## 3. Base SHA

`45637bf336174671726ce2d6b18897d0a8783fad`

## 4. PR #210 merge verification

Confirmed by direct inspection: `git log origin/main` shows `45637bf` as `Merge pull request #210 from Fkenogo/docs/dec-legal-002-bt-draft-006`, with parents `af1db33` (pre-merge `main`) and `be1f1db` (`docs(DEC-LEGAL-002-BT-DRAFT-006): correct stale §9.6 traceability scope label (PR #210 Codex review)`). PR #210 merged.

## 5. Parts I–VI baseline state

Confirmed by direct inspection of the current Core Business Terms instrument (`docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`, now at v6.0 content through Part VI): Part I (§§1–7) is the Founder-approved baseline (corrected `-CORR-001`); Part II (§§8–10), Part III (§§11–14), Part IV (§§15–17), Part V (§18), and Part VI (§§19–20) are each drafted with full clause text and remain draft pending Founder review (none is yet Founder-approved beyond Part I). Parts VII–VIII remain headings/placeholders only, per the instrument's own §0.1 and its "End of Part VI" boundary statement.

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

Directly inspected, first-hand, verbatim: LEG-FD-01 (Governing Interpretation Principle), LEG-FD-02 (Language Architecture), LEG-FD-03 (Electronic Acceptance), LEG-FD-09 (Customer Data Characterisation), LEG-FD-10 (Customer Terms Architecture), LEG-FD-11 (Dispute Architecture), LEG-FD-13 (Terms Changes/Reacceptance), LEG-FD-14 (B2B Dispute Resolution) — all read verbatim from `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md`. Reconciliation Matrix rows 3 (electronic acceptance), 12 (governing law), 14 (required languages), 15 (version-change/reacceptance) — read verbatim from `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md`. Terms Drafting Readiness Note — read for its layer architecture (§1) and its "governing law/disputes" readiness row. Current Core Business Terms v6.0 (all of Parts 0, I–VI, and the "End of Part VI"/"Status Reaffirmation" sections). Current Controlled Inputs Register v6.0 (full CI-01/CI-05 history through the Part VI review). Current Drafting Traceability Matrix (rows §7.1, §14.4, §17.3, §19.4, §20.1, §20.2 — the existing forward cross-references into §21/§22). Decision Register (`DEC-LEGAL-002` status line and Capability 3/Terms-configuration state, corroborated against the Core Business Terms' own "Status Reaffirmation" section). LEG-FD-04–08, 12, 15 were reviewed in the same pass for completeness but are not independently load-bearing for §§21–25 and are not cited as primary authority below except where an existing cross-reference already relies on them. Legal Opinion content is used only through its reconciled classification in the Reconciliation Matrix, never as freestanding authority.

## 9. §21 subject

Governing Law and Dispute Resolution (Business ↔ 11thONUS) — the B2B contractual dispute-resolution mechanism and the substantive law governing the Core Business Terms.

## 10. §21 authority

LEG-FD-14 (B2B Dispute Resolution) governs the dispute-resolution sequence and forum architecture directly: good-faith resolution → mediation where appropriate → binding arbitration if unresolved; seat Kigali, Rwanda; institution KIAC; language English or French; scope limited to Business↔11thONUS contractual disputes (does not impose the same architecture on customer disputes, which remain governed by LEG-FD-11); jurisdictional overlays may modify this architecture only where mandatory applicable law requires a different mechanism for a specific jurisdiction's Business Terms addendum. LEG-FD-11 supplies the underlying three-tier dispute-allocation principle this specific disposition resolves. Reconciliation Matrix row 12 and the Terms Drafting Readiness Note govern the separate substantive-governing-law question (see item 34 below) — this is **not** the same authority as the arbitration seat.

## 11. §21 unresolved items

See the full arbitration-mechanics classification in item 33 and the governing-law treatment in item 34 below.

## 12. §21 classification

`BOUNDED DRAFTING READY`. The dispute-resolution sequence, arbitration seat, institution, and language are fully governed and may be drafted verbatim from LEG-FD-14. The substantive governing-law clause is drafting-ready as ordinary bounded legal-drafting judgment (Rwanda law as a reasonable, reconciled drafting input per Reconciliation row 12, not a Founder-mandated global rule, and expressly not to be conflated with the arbitration seat). A defined set of procedural arbitration mechanics (mediation institution/rules, arbitration rules beyond KIAC's own defaults, number/appointment of arbitrators, cost allocation, time limits) is expressly and correctly left ungoverned by LEG-FD-14 itself, and is independently omittable — KIAC's own default rules supply defaults unless displaced, per LEG-FD-14's own text. No item requires a new Founder/legal decision to begin drafting §21.

## 13. §22 subject

Changes to These Terms; Reacceptance — the mechanism by which the Core Business Terms may be changed, and when an already-accepting Business must reaccept.

## 14. §22 authority

LEG-FD-13 (Terms Changes/Reacceptance) governs directly: material changes affecting rights or obligations require affirmative reacceptance where appropriate under applicable law/governance; non-material/administrative changes may be communicated without reacceptance, subject to applicable law; no universal 14-day period; the existing versioned-acceptance/retrievable-evidence architecture (`BusinessTermsAcceptance`) is preserved and confirmed sound. Reconciliation Matrix row 15 confirms the version-reset/reacceptance-required-on-material-change principle and confirms the 14-day figure is not adopted. LEG-FD-13 itself separately determines that a dedicated reacceptance-on-Terms-change engineering implementation (what technically happens to an already-accepted Business when the governed Terms version later changes) has not yet been designed or authorized, and identifies this as requiring its own new, narrowly-scoped governed decision — already recorded as open Controlled Input CI-05, not created by this task. LEG-FD-03 and existing Traceability Matrix row §7.1 already flag this same boundary at §7.1 ("does not predetermine whether continued participation requires ongoing/repeat acceptance (deferred to §22/reacceptance decision)").

## 15. §22 unresolved items

The "material" test itself is expressed directly in LEG-FD-13's own text ("changes affecting rights or obligations" vs. "non-material/administrative") and is usable as bounded drafting language without inventing a new test. Effective-date mechanics, the refusal/non-acceptance consequence, and archived-version-access statements are ordinary bounded drafting judgment, each answerable from already-governed material (Part I §7's acceptance architecture; LEG-FD-03's retrievability requirement) without inventing new product behaviour. Advance-notice timing is expressly not governed by any universal figure (LEG-FD-13) and is independently omittable/reservable. The specific reacceptance-on-change *mechanism* for already-accepted Businesses is CI-05 — genuinely open, already recorded, not to be duplicated as a new Controlled Input; §22 can state the LEG-FD-13 principle and cross-reference CI-05's unresolved status explicitly, exactly as §7.4 already does, without resolving it. Emergency/legal-required-amendment treatment and language-version treatment are ordinary bounded drafting judgment under LEG-FD-01's fallback standard and LEG-FD-02's language architecture respectively.

## 16. §22 classification

`BOUNDED DRAFTING READY`. The principle-level material/non-material distinction, the non-adoption of a universal notice period, and the preservation of the existing versioned-acceptance architecture are all governed and drafting-ready. The one genuinely open item (the reacceptance-on-change engineering mechanism) is CI-05, already recorded and not newly created — §22 can and should state this as an explicit non-resolution, the same technique Parts III–VI already use repeatedly (e.g. §13.7, §14.4, §15.7, §16.8, §18.6, §19.2) for comparable gaps, rather than silently omitting it.

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

No dedicated LEG-FD item addresses any of these six topics; all fall to LEG-FD-01's general fallback (ordinary, internationally recognizable contract-drafting convention) with one partial exception: language-of-the-agreement content is informed by LEG-FD-02 (which establishes English/French as the core languages but does not itself resolve which governs in case of conflict between language versions — a residual bounded drafting choice). Entire-agreement language must additionally respect LEG-FD-10's differentiated-instrument architecture (Core Business Terms, Customer Terms, Business Reward Program Rules, and jurisdictional overlays are related but distinct instruments) so that an "entire agreement" clause does not overstate itself as displacing the other three instrument types.

## 27. §25 unresolved items

Assignment restriction, severability, force majeure, and survival are standard, near-universal contract mechanics requiring no jurisdiction-specific value or Founder product position to draft coherently — each is answerable from ordinary legal-drafting convention under LEG-FD-01's fallback standard. Entire-agreement language requires only that it be drafted consistently with LEG-FD-10 (not overstating exclusivity against the other three related instruments) — bounded judgment, not a gap. Which language version controls in case of English/French conflict is genuinely open (no authority states it) but is independently omittable or statable as a reserved/flexible point without blocking the rest of §25.

## 28. §25 classification

`BOUNDED DRAFTING READY`. All six topics are drafting-ready now as ordinary bounded legal-drafting judgment under LEG-FD-01 (and, for the language-conflict point, LEG-FD-02); none requires a new Founder or legal decision, and the one open sub-point (which language version controls) is independently reservable.

## 29. Arbitration-sequence authority

LEG-FD-14, confirmed verbatim: "Business ↔ 11thONUS contractual disputes use: good-faith resolution → mediation where appropriate → binding arbitration if unresolved."

## 30. Arbitration-seat authority

LEG-FD-14, confirmed verbatim: "Seat: Kigali, Rwanda."

## 31. KIAC authority

LEG-FD-14, confirmed verbatim: "Institution/rules: Kigali International Arbitration Centre (KIAC)." LEG-FD-14 further confirms that "KIAC's own default procedural rules will supply defaults unless the drafted clause displaces them" for the mechanics LEG-FD-14 itself does not resolve.

## 32. Arbitration-language authority

LEG-FD-14, confirmed verbatim: "Language: English or French."

## 33. Unresolved arbitration mechanics

Classified individually, per LEG-FD-14's own text ("What is deliberately not decided here...") and ordinary drafting principle:

| Mechanic | Classification |
|---|---|
| Mediation institution/rules | Omittable unresolved — not addressed by LEG-FD-14; may be left to the parties' good-faith process or KIAC facilitation without invented detail |
| Whether mediation is mandatory or conditional | Governed as conditional — LEG-FD-14's own text is "mediation **where appropriate**," not a mandatory universal step |
| Arbitration rules (beyond KIAC's own defaults) | Governed by omission — KIAC's own default rules apply unless displaced (LEG-FD-14, explicit) |
| Number of arbitrators | Omittable unresolved — LEG-FD-14 expressly declines to decide this; KIAC default applies absent a drafted figure |
| Arbitrator appointment | Omittable unresolved — same basis |
| Cost allocation | Omittable unresolved — LEG-FD-14 expressly declines ("clear cost allocation" raised by the Legal Opinion §13 but not adopted) |
| Interim/emergency relief | Omittable unresolved — not addressed by any authority; ordinary drafting judgment or KIAC rules may supply this without a Founder decision |
| Confidentiality | Drafting judgment — standard arbitration-confidentiality boilerplate, no governed content needed |
| Consolidation/joinder | Omittable unresolved — not addressed; not required for a coherent §21 |
| Class/group proceedings | Omittable unresolved — not addressed by any authority; not invented here |
| Time limits | Omittable unresolved — LEG-FD-14 expressly declines ("time limits for claims" raised by the Legal Opinion §13 but not adopted) |
| Court enforcement | Drafting judgment — standard boilerplate recognizing enforcement of an arbitral award, no governed content needed |
| Governing procedural law of the arbitration | Drafting judgment — ordinarily follows the seat (Kigali/Rwanda/KIAC rules) as a matter of arbitration convention, not a separate open product question |

None of these is classified blocking unresolved.

## 34. Governing-substantive-law status

Existing authority does **not** establish that the Kigali arbitration seat automatically fixes Rwanda as the substantive governing law of the Core Business Terms — the two are distinct questions and this assessment does not infer one from the other. Reconciliation Matrix row 12 records the Legal Opinion's recommended split (Business Terms → Rwanda law; Customer Terms for Burundi residents → Burundi law) as Classification C: "recorded as counsel's recommended split; final governing-law clause selection remains a legal-drafting decision at Terms-drafting time, informed by but not concluded by this reconciliation." The Terms Drafting Readiness Note's own "governing law/disputes" row independently classifies this as **Ready** — "governing-law clause direction (Rwanda for Business Terms) is a reasonable drafting input; forum is now resolved per LEG-FD-14." No mandatory-local-law override is foreclosed — LEG-FD-01's fallback principle preserves compliance with any applicable mandatory law regardless of the stated governing-law clause. **Conclusion:** §21's governing-law element can be drafted now as ordinary bounded legal-drafting judgment (Rwanda law, per the reconciled recommendation, subject to the mandatory-law carve-out already used elsewhere in this instrument) — it does not require a new Founder decision, but it is not a Founder-mandated global rule either; it is Classification C drafting input the drafter applies, not a governed fact the drafter restates.

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

No new Controlled Input is warranted. Every genuinely open Part VII item reviewed above is either (a) independently omittable (arbitration procedural mechanics LEG-FD-14 itself declines to resolve; notice deemed-receipt/channel specifics; which language version controls); (b) ordinary bounded legal-drafting judgment requiring no product or legal position (severability, force majeure, assignment, survival, entire-agreement language, effective-date mechanics, notice formality distinctions); or (c) already covered by the existing CI-05 (the reacceptance-on-change engineering mechanism), which this assessment does not duplicate. None requires inventing a value or resolving a new open Founder/legal question to make a coherent Part VII clause set draftable.

## 44. CI-01/CI-05 state

Unchanged and preserved. CI-01 (operator's registered legal name, registration/company number, registered address — required before Founder approval and before legal approval) and CI-05 (the reacceptance-on-Terms-change engineering implementation decision — required before Terms configuration) remain the only two open Controlled Inputs across the entire Core Business Terms instrument, confirmed by direct inspection of the current Controlled Inputs Register (v6.0). This assessment adds none.

## 45. DEC-LEGAL-002 state

`OPEN_LEGAL`, unchanged — confirmed by direct inspection of the Decision Register's most recent controlled-update entry and corroborated by the Core Business Terms' own "Status Reaffirmation" section.

## 46. Terms configuration state

`NOT CONFIGURED` (`platformConfig/businessTerms`), unchanged — confirmed the same way.

## 47. Capability 3 state

Open — engineering work packages complete; blocked on governed Terms-content configuration (`CDR-001` §5), unchanged — confirmed the same way.

## 48. Overall Part VII gate

`PART VII DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS`

## 49. Exact drafting-ready scope

A future Part VII drafting task may draft: (§21) the full good-faith→mediation-where-appropriate→binding-arbitration sequence with Kigali/KIAC/English-or-French exactly as LEG-FD-14 states, a governing-substantive-law clause using Rwanda law as the reconciled drafting input subject to the mandatory-law carve-out, and a general jurisdictional-overlay forward reference (not specific overlay mechanics); (§22) the material/non-material reacceptance principle exactly as LEG-FD-13 states, cross-referencing Part I §7's existing acceptance architecture and stating CI-05's non-resolution explicitly in the clause text, using the same non-resolution technique already established at §7.4/§13.7/§14.4/§15.7/§16.8/§18.6/§19.2; (§23) a cross-reference-only pointer to the separately governed privacy/data-processing framework, with no substantive privacy content; (§24) a notice-mechanism clause using only electronic/in-platform channels and LEG-FD-02's language architecture, with no fixed deemed-receipt period or mandatory single channel; (§25) standard assignment, severability, force majeure, survival, and entire-agreement (respecting LEG-FD-10's differentiated-instrument architecture) provisions, plus a language-of-the-agreement clause naming English/French as the operative languages.

## 50. Exact prohibited/unresolved content

Must not be invented in Part VII: any specific number of arbitrators, arbitrator-appointment mechanism, cost-allocation formula, or claim time-limit for arbitration (LEG-FD-14 expressly declines each); any fixed advance-notice period for Terms changes (LEG-FD-13 expressly declines a universal figure, expressly rejects the 14-day figure); any fixed deemed-receipt period or single mandatory notice channel (no authority establishes either); any substantive privacy/data-processing obligation in §23 (reserved to the separate privacy governance track per LEG-FD-09/10); any Rwanda- or Burundi-specific mandatory-law mechanics in Part VII itself (reserved to the undrafted Part VIII); any resolution of CI-05's reacceptance-on-change engineering mechanism (remains open, resolved separately); any restatement or alteration of LEG-FD-03's acceptance standard as a stricter Part VII requirement (e.g., forced scrolling) not itself governed for Part VII.

## 51. Founder decisions required, if any

None. No item identified above requires a new narrow Founder or legal decision before Part VII drafting may begin. This differs from Part VI's own pre-drafting history (which required a dedicated authority-confirmation task, `DEC-LEGAL-002-BT-PART-VI-AUTH-001`, to resolve indemnity-scope classification questions) only in that Part VII's authorities were already sufficiently resolved by LEG-FD-13/14 (both added specifically to close out Terms-drafting readiness, per `DEC-LEGAL-002-FOUNDER-CLOSE-001`) that no comparable additional authority-confirmation task is needed — this assessment itself performs that confirmation function for Part VII.

## 52. Files modified

`DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md` (created); `documentation-changes-log.md` (entry added).

## 53. Diff summary

One new report file (this document). One new changes-log entry. No other file touched.

## 54. Commands executed

`git fetch origin`; `git log`/`git show` inspection of `origin/main` and PR #210's merge commit; `find`/`grep` inspection of the Core Business Terms instrument, the Founder Legal Architecture Disposition Record, the Reconciliation Matrix, the Terms Drafting Readiness Note, the Controlled Inputs Register, the Drafting Traceability Matrix, and the Decision Register; `git checkout -b docs/dec-legal-002-bt-part-vii-readiness-001 origin/main`.

## 55. Dependencies/config changes

None.

## 56. Application/source changes

NONE.

## 57. Risks

If a future drafting task states the §21 governing-law clause as a settled Founder fact rather than as Classification C drafting input, it would overstate this assessment's own conclusion — the drafting task should preserve the distinction this report draws in item 34. If a future drafting task invents a deemed-receipt period or mandatory notice channel for §24 "for completeness," it would silently create governance content this assessment expressly found ungoverned — any such addition must be flagged as a new explicit non-resolution or, if genuinely needed, escalated as a narrow Founder/legal question rather than invented.

## 58. Rollback instructions

Revert this commit / close this PR without merging; no other file is touched, so rollback is a single-commit revert.

## 59. Report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md`

## 60. Changes-log entry

Added as the next sequential entry in `docs/00-governance/documentation-changes-log.md`.

## 61. Commit SHA

Recorded in the completion message after commit.

## 62. PR number/state

Recorded in the completion message after the PR is opened. Not self-merged.

## 63. Exact Founder next action

Review this assessment and, if satisfied, authorize a future `DEC-LEGAL-002-BT-DRAFT-007` (or equivalent) task to draft Part VII (§§21–25) clause text strictly within the drafting-ready scope at item 49, preserving every explicit non-resolution at item 50 and not resolving CI-05 or any Part VIII jurisdictional-overlay mechanic within Part VII.

---

## FINAL GATE

`PART VII DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS`
