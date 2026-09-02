# DEC-LEGAL-002-BT-PART-VIII-READINESS-001 — Core Business Terms Part VIII (Jurisdictional Overlays) Rwanda/Burundi Readiness and Drafting-Authority Assessment

> **Task:** `DEC-LEGAL-002-BT-PART-VIII-READINESS-001` · **Date:** 2 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction
> **Scope:** Docs-only, bounded pre-drafting readiness and jurisdiction-mapping assessment for Part VIII (Jurisdictional Overlays, proposed §§26–27) of the Core Business Terms, for Rwanda and Burundi only. **No Part VIII clause text drafted. No Terms configuration. No application/source/Firebase/configuration change. No Core Business Terms, Controlled Inputs Register, Drafting Traceability Matrix, or Decision Register modification.**

---

## 1. Assessment strategy

Establish the exact, current, undrafted Part VIII architecture directly from the controlled Core Business Terms instrument, then build a per-topic, per-jurisdiction (Rwanda, Burundi) classification against directly inspected repository authority only: the Founder Legal Architecture Disposition Record (LEG-FD-01–16), the Reconciliation Matrix, the Terms Drafting Readiness Note, the Controlled Inputs Register, the Drafting Traceability Matrix, the Decision Register, the Legal Counsel Handoff Pack, the prior Founder Dispositions (FD-1–FD-7), `DEC-LOY-011`, and the External Legal Opinion body (used only as reconciled drafting input, never as freestanding authority, per the Reconciliation Matrix's own classification discipline and per this task's governing instruction not to treat the opinion as authority where a later Founder disposition qualified or rejected it). For every topic, classify Rwanda and Burundi separately as A (Mandatory Overlay), B (Optional/Recommended), C (No Overlay Required), or D (Unresolved), citing the exact authority or stating `UNRESOLVED — repository does not contain sufficient verified authority` where none exists. No clause text is drafted at any point in this assessment, and no general legal knowledge is used to fill a gap the repository does not itself evidence.

## 2. Entry repository state

Primary worktree at task start held unrelated, substantial uncommitted `FD-COM-001` commercial-model work (multiple modified tracked files and numerous untracked files: `WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance` and `docs/05-implementation/reports` files, `docs/06-engineering-governance/`, `docs/30-go-to-market/`, `docs/07-product-design.zip`, etc.), consistent with a concurrent, separate session's in-progress work. This task did not stash, reset, clean, commit, move, amend, or build on top of any of it.

## 3. Isolation/worktree strategy

Used the native `EnterWorktree` tool (not manual `git worktree add`) to create an isolated linked worktree at `.claude/worktrees/docs+dec-legal-002-bt-part-viii-readiness-001`, branched fresh from `origin/main` (the tool's default `fresh` base-ref policy), then renamed the branch to `docs/dec-legal-002-bt-part-viii-readiness-001`. `git status --short` in the new worktree reported no uncommitted changes at entry — a clean baseline independent of the primary worktree's `FD-COM-001` state.

## 4. Base SHA

`f94daa7a2e444909ad80742c3dd978914c98683a`

## 5. PR #212 merge verification

Confirmed by direct `gh pr view 212 --json` inspection: `state: MERGED`, `mergeCommit.oid: f94daa7a2e444909ad80742c3dd978914c98683a`, `baseRefName: main`, `headRefName: docs/dec-legal-002-bt-draft-007`, `mergedAt: 2026-09-02T12:56:07Z`. Matches the task's expected merge commit exactly.

## 6. Post-merge CI verification

`gh run list --branch main` shows the `CI` workflow run at `headSha f94daa7a2e444909ad80742c3dd978914c98683a` (`databaseId 33632745026`, created `2026-09-02T12:56:11Z`) with `status: completed`, `conclusion: success`. Post-merge CI is green.

## 7. Parts I–VII baseline verification

The current Core Business Terms instrument (`docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`, version 7.2 per its own header, "Part VII §22.3 corrected per PR #212 automated review, task `DEC-LEGAL-002-BT-DRAFT-007-CORR-002`") contains full drafted clause text for Part I (§§1–7), Part II (§§8–10), Part III (§§11–14), Part IV (§§15–17), Part V (§18), Part VI (§§19–20), and Part VII (§§21–25), each recorded elsewhere in the Decision Register and the prior readiness/drafting reports as a Founder-approved controlled drafting baseline. This is a controlled-drafting-baseline status only — it does not mean the Terms are final, effective, or configured.

## 8. Part VIII exact headings

Quoted verbatim from the controlled instrument's Part 0, §0.1 Complete Proposed Section Architecture (this is the **only** place Part VIII exists in the document — there is no standalone `## Part VIII` section in the document body):

> **Part VIII — Jurisdictional Overlays** *(architecture only — not drafted)*
> 26. Jurisdictional Overlay Mechanism
> 27. [Overlay index — populated as overlays are drafted; Burundi overlay not drafted here]

Immediately after "End of Part VII," the instrument states verbatim: "Part VIII above (§§26–27) remains headings and placeholders only, per the governing task scope. No clause text for that Part has been drafted, and none should be inferred from Part I, Part II, Part III, Part IV, Part V, Part VI, or Part VII's treatment of adjacent topics (for example, §21.8's and §23.1's forward references to a jurisdictional overlay and a separate privacy framework do not draft any part of §26)."

## 9. Part VIII current state

No sub-structure exists beyond the two line items above — no placeholder clause text, no "Reserved"/"TBD" boilerplate, and critically **no design for the overlay mechanism itself**: how an overlay attaches to, supplements, or overrides a Layer 1 (portable) clause; where in the instrument an overlay is triggered; how a Business or counterparty determines which overlay applies to them; and how §27's "overlay index" is structured are all entirely undesigned. The only narrative description of the intended three-layer model (Layer 1 portable core / Layer 2 jurisdictional overlay / Layer 3 not otherwise named) appears in the Terms Drafting Readiness Note §1 (see §11 below) — a governance note, not an instrument design. No standalone "jurisdiction overlay architecture" document exists anywhere in the repository (`find docs -iname "*jurisdiction*overlay*" -o -iname "*overlay*"` returns zero results). The current Part VIII structure is **not** sufficient, on its own, to begin drafting §26's mechanism — the mechanism's own design (not just its jurisdiction-specific content) needs at minimum the governance basis this assessment supplies at §36 below before clause text is attempted; this is a bounded, non-blocking gap, not a structural divergence requiring a stop-and-report escalation, because the Terms Drafting Readiness Note's Layer 1/Layer 2 description already supplies a portable, Founder-consistent design basis (LEG-FD-01's fallback-standard reasoning applies equally to instrument-architecture design as to clause content).

## 10. Rwanda legal-source inventory

No dedicated Rwanda-specific evidence file exists in the repository. The available Rwanda-specific material is entirely contained within governance instruments already reconciled through `DEC-LEGAL-002`:
- **LEG-FD-14** (B2B Dispute Resolution): Kigali seat, KIAC institution, English/French language — Founder-approved, not merely opinion input.
- **LEG-FD-16** (Core Business Terms Governing Law): laws of Rwanda govern the Business Terms, subject to mandatory law/non-waivable requirements/jurisdictional overlays — Founder-approved.
- **LEG-FD-02** (Language Architecture): English/French core, applies to Rwanda by default (Rwanda is the Business Terms' home jurisdiction under LEG-FD-16).
- **External Legal Opinion body** §12 (Rwanda Law No 058/2021 Data Protection; Rwanda Law N° 13/2009 on Commercial Transactions), §11 (Rwanda Competition and Consumer Protection Law — unfair/unconscionable terms may be void), §16 (Rwanda data-processing table: consent, data subject rights, 48-hour breach notification, NCSA registration), L37 (Rwanda Law No. 18/2010, explicit e-signature recognition), L130 (Rwanda Competition/Consumer Protection Law notice-and-takedown obligation for online intermediaries) — all Classification-B/C reconciled drafting input per the Reconciliation Matrix, not independently Founder-adopted beyond what LEG-FD-14/15/16 already state.
This is the complete Rwanda-specific evidentiary inventory found; no additional primary Rwandan statute is cited anywhere else in the repository.

## 11. Burundi legal-source inventory

Likewise no dedicated Burundi-specific evidence file exists. The available Burundi-specific material:
- **External Legal Opinion body**: primary-analysis jurisdiction is Burundi (*Loi n° 1/11 de 2009*, *Loi n° 1/024 de 2018*, Code Civil du Burundi); §12 Governing Law table proposes a "Business Terms (Burundi Addendum)" row addressing "pilot jurisdiction requirements; consumer protection"; §13 proposes Burundi courts/CNCP as an *option* alongside Rwanda arbitration for the Business Terms Burundi pilot ("Consistent with core; allow Burundi option"); §14 states Burundi's official languages are Kirundi/French/English, recommends a French Business Terms addendum with Kirundi optional; §11 cites Burundi *Loi n° 1/11* Arts. 6–8 (mandatory pre-acceptance disclosure) and Art. 15 (withholding earned rewards as unfair commercial practice, CNCP exposure); confirms `DEC-LOY-011` enforceability under Burundi Code Civil Art. 33 (*res inter alios acta*); §16 Burundi-specific mandatory consumer disclosures (contact info, earn/redeem rules, anti-misleading-advertising, CNCP complaint right); L37–39 notes Burundi has no dedicated e-signature statute (relies on the 1993 Commercial Code and the 2024 Electronic Communications and Postal Code) and that Burundi's 2026 Personal Data Protection Law requires demonstrable consent; L413 notes the reward characterisation avoids BRB (Burundi) e-money/payments licensing.
- **LEG-FD-02**: Kirundi may be used in customer communication/accessibility materials without becoming a general application language — explicitly **does not adopt** the Opinion's "Kirundi must be made available" recommendation for consumer-facing Terms as a global-architecture change.
- **Terms Drafting Readiness Note §1**: "Burundi is the first launch/pilot jurisdiction and its overlay... is the first to be drafted."
- **Reconciliation Matrix** rows 11 (limitation/exclusion, Class C, jurisdiction-by-jurisdiction), 12 (governing law, Class C), 14 (required languages, Class B, Burundi-specific, explicitly "left to the Burundi jurisdictional overlay, not decided here"), 16 (mandatory consumer protection, Class C, Burundi-specific/jurisdiction-by-jurisdiction).
This is the complete Burundi-specific evidentiary inventory found. All of it is either External-Legal-Opinion-level (recommendation, not Founder-decided) or explicitly deferred by the Reconciliation Matrix's own text to "the Burundi jurisdictional overlay, not decided here."

## 12. Mandatory-vs-recommended methodology

A topic is classified **A (Mandatory Overlay)** only where a named LEG-FD item or Founder disposition itself states that jurisdiction-specific law requires a Business-Terms modification (none found for either jurisdiction — see §36). A topic is classified **B (Optional/Recommended)** where the External Legal Opinion or Reconciliation Matrix recommends jurisdiction-specific content but no Founder disposition has adopted it as mandatory, and adopting it would not contradict any Founder disposition. A topic is classified **C (No Overlay Required)** only where a named authority (a LEG-FD item, `DEC-LOY-011`, or the Legal Opinion's own analysis reconciled without contradiction) affirmatively shows the portable Core Terms already satisfy the point for that jurisdiction — mere silence is not treated as C. A topic is classified **D (Unresolved)** wherever the repository contains no authority, conflicting authority, or an explicit statement that the point is deferred/not decided; this includes every point where the only available material is an Opinion recommendation not yet reconciled to a Founder decision addressing the Business Terms specifically (as opposed to the Customer Terms, which are out of `DEC-LEGAL-002`'s scope per LEG-FD-10).

## 12A. Rwanda/Burundi jurisdiction overlay matrix

| Topic | Core Terms section | Rwanda classification | Rwanda authority | Burundi classification | Burundi authority | Drafting implication |
|---|---|---|---|---|---|---|
| Governing law / dispute resolution | §21 | **C** | LEG-FD-14, LEG-FD-16 (Rwanda is the default Layer 1 jurisdiction) | **D** | LEG-FD-14 proviso; External Legal Opinion §13 (recommendation, not adopted); `UNRESOLVED — repository does not contain sufficient verified authority` that Burundi mandatory law requires a different forum | No Rwanda overlay content; Burundi entry states explicit non-resolution |
| Language | §25.6, §21.6, §24.3 | **C** | LEG-FD-02 (EN/FR core, Rwanda default) | **B** (narrow, existing text already matches) / **D** (residual) | LEG-FD-02; Reconciliation Matrix row 14; External Legal Opinion §14 table | No Rwanda overlay; Burundi entry may note existing §25.6 text already satisfies the Opinion's Business Terms recommendation, with any further requirement reserved |
| Electronic contracting / acceptance | §7, §21 (cross-ref) | **C** | LEG-FD-03; Opinion L37 (Rwanda Law No. 18/2010) | **D** | LEG-FD-03; Opinion L37–39 (no dedicated Burundi e-signature statute; 2026 Personal Data Protection Law demonstrable-consent point unverified) | No overlay content invented for either; Burundi reserved pending counsel verification |
| Notices | §24 | **D** | `UNRESOLVED — repository does not contain sufficient verified authority` | **D** | `UNRESOLVED — repository does not contain sufficient verified authority` | Both jurisdictions reserved; no fixed period/channel invented |
| Suspension / termination / exit / earned rewards | §§13–17, §25.4 | **C** | FD-2/3/4, LEG-FD-06/07/08, `DEC-LOY-011` | **C** | Same, reinforced by External Legal Opinion §11 (Burundi Art. 15/Code Civil Art. 33 analysis finds no conflict) | No overlay content for either; Business-Terms scope only, not Customer-facing remedies |
| Liability | §19 | **C** (general principle) / **D** (B2B-cap enforceability) | LEG-FD-15; Opinion §11 (Rwanda unfair-terms doctrine unverified against B2B cap) | **C** (general principle) / **D** (residual) | LEG-FD-15; Opinion §11 (Burundi *Loi n° 1/11*, consumer-scoped) | General principle already portable; cap-enforceability point reserved for both |
| Indemnity | §20 | **D** | `UNRESOLVED — repository does not contain sufficient verified authority` | **D** | `UNRESOLVED — repository does not contain sufficient verified authority` | Both jurisdictions reserved |
| Data / privacy | §23 | **C** | LEG-FD-09, LEG-FD-10 (cross-reference only, sufficient) | **C** | Same | No substantive privacy content in Part VIII for either jurisdiction |
| Operator/business disclosures (CI-01) | Preamble | **D** (beyond CI-01 itself) | CI-01 (global gap, does not block drafting); Opinion L413 (avoidance, not a disclosure duty) | **D** (beyond CI-01 itself) | Same | CI-01 unaffected by Part VIII; no jurisdiction-specific disclosure overlay content invented |
| Commercial / subscription | §18 | **D** | `UNRESOLVED — repository does not contain sufficient verified authority`; independent of open `DEC-SUB-*` | **D** | Same | Both jurisdictions reserved; no commercial value invented |
| General provisions (assignment, severability, entire agreement, survival) | §25.1–25.3, §25.5 | **C** | No jurisdiction-specific authority found; existing text sufficient | **C** | Same | No overlay content for either |

## 13. Governing-law/dispute-resolution assessment

**Rwanda — C (No Overlay Required).** Authority: LEG-FD-14 (Kigali seat, KIAC institution, English/French — already the default Layer 1 architecture) and LEG-FD-16 (Rwanda substantive governing law — already the default Layer 1 architecture). Rwanda is the Business Terms' home/default jurisdiction; there is nothing for a "Rwanda overlay" to add to an instrument whose default rule already is the Rwanda rule. No repository authority suggests a Rwanda-specific court-access carve-out, local mandatory-forum override, or additional Rwanda enforcement mechanic beyond what §21 (already drafted, Founder-approved) states.

**Burundi — D (Unresolved).** Authority reviewed: LEG-FD-14's own proviso ("jurisdictional overlays may modify this architecture only where mandatory applicable law requires a different mechanism for a specific jurisdiction's Business Terms addendum") and the External Legal Opinion §13 recommendation ("Business Terms (Burundi pilot) | Arbitration (Rwanda) or Burundi courts | Consistent with core; allow Burundi option"). No repository authority establishes that Burundi mandatory law *requires* (as opposed to the Opinion's discretionary recommendation to *allow*) a different B2B forum for the Core Business Terms; the Reconciliation Matrix's own governing-law/forum rows (12, 13) address only the Customer Terms (B2C) split to Burundi courts/CNCP, not a Business Terms override. `UNRESOLVED — repository does not contain sufficient verified authority` that Burundi mandatory law compels any Business Terms dispute-forum or governing-law modification; this is a primary-source legal-counsel verification question, not a Founder product-policy question, and per the task's own instruction Rwanda governing law for the Core Business Terms is not reopened here.

## 14. Language assessment

**Rwanda — C (No Overlay Required).** Authority: LEG-FD-02 (English/French core languages). No repository evidence of a Rwanda-specific Business Terms language mandate beyond what §25.6 (already drafted) states.

**Burundi — D (Unresolved), with a narrower B (Optional/Recommended) sub-element.** Authority reviewed: LEG-FD-02 (Kirundi permitted for customer communication/accessibility, explicitly **not** a general application-language mandate, and explicitly **not adopting** the Opinion's "Kirundi must be made available for consumer-facing Terms" recommendation); Reconciliation Matrix row 14 ("whether Burundi law in fact mandates Kirundi... for the specific Customer Terms instrument is left to the Burundi jurisdictional overlay, not decided here" — note this sentence is scoped to the *Customer Terms* instrument, not the Business Terms); External Legal Opinion §14 table ("Business Terms | English (core) + French (Burundi addendum) | Kirundi optional"). The Business Terms already state English and French as the operative languages (§25.6, §21.6, §24.3, Founder-approved), which on its face already satisfies the Opinion's own Business-Terms recommendation (French addendum; Kirundi merely optional) — this narrow point could reasonably be classified **B**, since adopting it changes nothing already governed. However, whether Burundi mandatory law imposes any *additional* Business-Terms-specific language requirement (e.g., a French-as-controlling-text rule for a Business Terms addendum, distinct from the Customer Terms L14 "French version will serve as the primary legal reference text" statement, which the Opinion applies to consumer-facing documents) is not addressed by any Founder disposition or reconciliation row for the Business Terms specifically. `UNRESOLVED — repository does not contain sufficient verified authority` on whether a Burundi Business Terms overlay must state a controlling-language rule beyond §25.6's existing English/French treatment; do not treat this as a Business Terms application-language mandate under any circumstance (LEG-FD-02 forecloses that).

## 15. Electronic-contracting/acceptance assessment

**Rwanda — C (No Overlay Required).** Authority: LEG-FD-03 (portable acceptance standard — affirmative acceptance, identifiable party, exact version, authoritative timestamp, retrievable Terms — already implemented via `BusinessTermsAcceptance`; forced scrolling/re-type confirmation explicitly **not** a global requirement, "may be" an overlay only where evidenced necessary). External Legal Opinion L37 confirms Rwanda Law No. 18/2010 gives explicit statutory recognition to electronic signatures, consistent with (not contradicting) the existing portable standard. No repository evidence that Rwanda law requires anything beyond what LEG-FD-03 already supplies.

**Burundi — D (Unresolved).** External Legal Opinion L37–39 notes Burundi has no dedicated e-signature statute (relying instead on the 1993 Commercial Code's digital-signature recognition and the 2024 Electronic Communications and Postal Code) and that Burundi's 2026 Personal Data Protection Law requires "demonstrable consent." No Founder disposition or reconciliation row has assessed whether the existing LEG-FD-03 acceptance standard already satisfies Burundi's demonstrable-consent requirement. `UNRESOLVED — repository does not contain sufficient verified authority`; this is a legal-counsel primary-source verification question. Per the task's own instruction, forced scrolling or re-type confirmation must not be invented for Burundi absent a repository-backed mandatory requirement — none currently exists.

## 16. Notices assessment

**Rwanda — D (Unresolved).** **Burundi — D (Unresolved).** Authority reviewed: no dedicated LEG-FD item addresses notices for either jurisdiction; §24 (already drafted) is governed only by LEG-FD-01's cross-cutting fallback standard and LEG-FD-02's language architecture. No Reconciliation Matrix row, no Legal Opinion excerpt located by this assessment's research, and no readiness-table row addresses formal notice channels, legal-service requirements, deemed receipt, registered-address requirements, electronic-notice enforceability, or regulatory-notice mechanics under Rwandan or Burundian procedural law specifically. `UNRESOLVED — repository does not contain sufficient verified authority` for both jurisdictions; per the task's own instruction, no fixed period or channel may be invented to fill this gap, and the absence of evidence is not itself treated as proof that no jurisdiction-specific notice requirement exists.

## 17. Suspension/termination/exit/earned-rewards assessment

**Rwanda — C (No Overlay Required).** **Burundi — C (No Overlay Required).** Authority: FD-2/FD-3/FD-4, LEG-FD-06/07/08, `DEC-LOY-011` (CONFIRMED — reward redemption during suspension defaults to redeemable, subject to governed exceptions), Part III §§13.1–13.4 and restatements at §§14.2/15.4–15.5/16.3/18.5/25.4 — a Founder-approved, portable global architecture already in force (no universal fixed run-off period, no mandatory cash settlement, earned rewards survive suspension/exit by default). The External Legal Opinion's Burundi-specific analysis (*Loi n° 1/11* Arts. 6–8 pre-acceptance disclosure; Art. 15, withholding earned rewards as an unfair commercial practice exposing the platform to CNCP action; `DEC-LOY-011` enforceability confirmed under Burundi Code Civil Art. 33) does not identify any conflict with the existing portable architecture — to the contrary, it confirms the existing default (rewards remain redeemable, not withheld on suspension) is *consistent with*, not contradicted by, Burundi mandatory consumer law. No Rwanda-specific mandatory-law divergence is evidenced anywhere in the repository. This topic is Business-Terms (11thONUS↔Business) scope; any Business↔Customer consumer remedy specific to Burundi (e.g., the Art. 15 CNCP exposure runs to the Business's conduct toward its customers) is a Customer Terms/Business Reward Program Rules matter, out of `DEC-LEGAL-002`'s Business Terms scope per LEG-FD-10 — not conflated with this topic's C classification.

## 18. Liability assessment

**Rwanda — C (No Overlay Required) for the general non-excludable-liability principle; D (Unresolved) for B2B-cap enforceability.** Authority: LEG-FD-15 already states liability may never be excluded for fraud, wilful misconduct, gross negligence, death/personal injury, or non-excludable consumer warranty — a portable principle that already captures the substance of the External Legal Opinion §11's Rwanda-specific note (Rwanda Competition and Consumer Protection Law: unfair/unconscionable terms may be void). No repository authority, however, assesses whether Rwanda's unfair-terms doctrine could apply to void or narrow the Business-facing 12-month-fees liability cap as between 11thONUS and a commercial Business counterparty (as opposed to a consumer). `UNRESOLVED — repository does not contain sufficient verified authority` on that narrower B2B-cap-enforceability point; this is a legal-counsel verification matter, not a Founder policy question, and this assessment does not resolve the zero-fee-Business cap (which remains `DEC-SUB-013`, a Founder/commercial matter unrelated to jurisdiction).

**Burundi — C (No Overlay Required) for the general non-excludable-liability principle; D (Unresolved) for any Business-Terms-specific point beyond it.** Authority: LEG-FD-15's non-excludable-liability carve-out already captures the substance of External Legal Opinion §11's Burundi-specific note (*Loi n° 1/11*: any clause depriving the consumer of legal rights is void). That Opinion note is itself framed around consumer protection (Customer Terms scope), not the B2B Business Terms; no repository authority identifies any Burundi mandatory-law point specific to the Business↔11thONUS liability cap. `UNRESOLVED — repository does not contain sufficient verified authority` beyond the already-portable non-excludable-liability principle. No nominal customer cap is invented, consistent with LEG-FD-15's own express non-adoption of the Opinion's $25 recommendation.

## 19. Indemnity assessment

**Rwanda — D (Unresolved). Burundi — D (Unresolved).** No LEG-FD item, Reconciliation Matrix row, or Legal Opinion excerpt located by this assessment addresses indemnity-clause enforceability under Rwandan or Burundian law specifically. `UNRESOLVED — repository does not contain sufficient verified authority` for both jurisdictions; a legal-counsel primary-source verification question, not a Founder policy question.

## 20. Privacy/data assessment

**Rwanda — C (No Overlay Required). Burundi — C (No Overlay Required).** Authority: LEG-FD-09 (personal-data processing governed under a separate lawful basis/privacy framework, not resolved through `DEC-LEGAL-002`) and LEG-FD-10 (Customer Terms/privacy instruments perform a different legal function from the Business Terms; the differentiated-instrument model expressly places Jurisdictional Overlays as a fourth, distinct instrument category applied per-instrument, not collapsed into the Business Terms). §23 (already drafted, Founder-approved) is a pure cross-reference and already fully satisfies what LEG-FD-09/10 require of the Business Terms for both jurisdictions. The External Legal Opinion's Rwanda (Law 058/2021, 48-hour breach notice, NCSA registration) and Burundi (2026 Personal Data Protection Law) data-processing content is real and substantive, but belongs to the separately governed privacy/data-processing track (`DEC-LEGAL-001`/`EXT-LEG-001`), not to Part VIII of the Business Terms. No jurisdiction-overlay cross-reference beyond §23's existing pointer is evidenced as necessary.

## 21. Operator-disclosure assessment (CI-01 impact)

**Rwanda — D (Unresolved). Burundi — D (Unresolved), for any jurisdiction-specific disclosure beyond CI-01's own global gap.** CI-01 (operator's registered legal name, registration/company number, registered address — Preamble marker, "required before Founder approval" and "required before legal approval") is a **global, instrument-wide gap, not itself a jurisdiction-specific overlay item** — it is the same missing fact regardless of which jurisdiction's overlay is being assessed. **CI-01 does not block Part VIII drafting.** Precedent: CI-01 remained open throughout the drafting of Parts I–VII (each completed and Founder-approved as a controlled drafting baseline with CI-01 still open), so it does not block drafting of Part VIII's architecture or content either. CI-01's own classification does state it is required before **final Founder approval** and **final legal approval** of the Terms, and (per the Controlled Inputs Register's own scope) before Terms configuration — i.e., it blocks finalization/configuration, not drafting. Separately, whether Rwanda or Burundi impose any *additional*, jurisdiction-specific operator/regulatory disclosure obligation (e.g., a BNR- or BRB-related regulatory-status disclosure) is not established by any repository authority; the External Legal Opinion's L413 regulatory-avoidance note (reward characterisation avoids BRB e-money/payments licensing and BNR directive licensing) describes why licensing is *avoided*, not an affirmative disclosure duty that would exist regardless. `UNRESOLVED — repository does not contain sufficient verified authority` for any jurisdiction-specific operator-disclosure overlay content beyond CI-01 itself, for both jurisdictions.

## 22. Commercial/subscription assessment

**Rwanda — D (Unresolved). Burundi — D (Unresolved).** Authority: FD-7 and §18 (already drafted) establish only that a general contractual framework may be stated structurally, with no invented plan names, prices, billing intervals, grace periods, payment deadlines, auto-renewal, refund mechanics, late fees, or plan names — all of `DEC-SUB-001/002/003/008/009/010/013` remain `OPEN_FOUNDER`, a commercial/Founder-policy blocker independent of jurisdiction. No repository authority (LEG-FD item, Reconciliation Matrix row, or Legal Opinion excerpt located) addresses whether Rwandan or Burundian law imposes any subscription/billing-specific overlay requirement (e.g., mandatory billing disclosures, currency requirements, or consumer-credit-style protections) on the B2B commercial relationship. `UNRESOLVED — repository does not contain sufficient verified authority` for both jurisdictions; independent of, and not to be conflated with, the separate open `DEC-SUB-*` commercial-value blockers.

## 23. General-provisions assessment

**Rwanda — C (No Overlay Required). Burundi — C (No Overlay Required),** for assignment (§25.1), severability (§25.2), entire agreement (§25.3), and survival (§25.5). No LEG-FD item, Reconciliation Matrix row, or Legal Opinion excerpt addresses any jurisdiction-specific variation for these four topics; the already-drafted, Founder-approved §25 text (informed only by LEG-FD-01's fallback standard, LEG-FD-10's differentiated-instrument architecture, and applicable mandatory law generally) already adequately covers the point for both jurisdictions, and generic contract-drafting convention is not treated as authority for inventing an overlay where none is evidenced. Force majeure (§25.4) is addressed under §17 above (suspension/exit/earned-rewards) — C for both jurisdictions on the same earned-reward-architecture basis. Language of the agreement (§25.6) is addressed under §14 above.

## 24. Rwanda overlay matrix summary

Of the ten topics assessed for Rwanda: **6 classified C** (governing law/dispute, electronic contracting, suspension/exit/earned-rewards, privacy/data, general provisions [assignment/severability/entire-agreement/survival/force-majeure], and — as the no-overlay-needed default component of language) plus the general-non-excludable-liability-principle component of liability; **1 classified C/D split** (liability — C for the general principle, D for B2B-cap enforceability); **2 classified D** (notices; indemnity); **2 classified D** (operator-disclosure overlay beyond CI-01; commercial/subscription overlay). No Rwanda topic was classified A or B — Rwanda is the Business Terms' default/home jurisdiction, and no repository authority identifies any point where Rwanda law requires the Business Terms to diverge from their own existing default treatment.

## 25. Burundi overlay matrix summary

Of the ten topics assessed for Burundi: **4 classified C** (suspension/exit/earned-rewards; privacy/data; general provisions [assignment/severability/entire-agreement/survival]; the non-excludable-liability-principle component of liability); **1 classified with a narrow B component nested inside an otherwise D topic** (language — the existing English/French treatment already matches the Opinion's own Business Terms recommendation, but whether Burundi mandatory law requires anything further remains D); **5 classified D** (governing law/dispute resolution; electronic contracting; notices; indemnity; operator-disclosure overlay beyond CI-01; commercial/subscription overlay — six D topics if language's D component is counted separately from its nested B). No Burundi topic was classified A — no repository authority establishes that any Business Terms provision *must* be modified for Burundi as a matter of mandatory law (as distinct from the Opinion's *recommendations*, several of which are already satisfied by the existing portable text without a bespoke overlay).

## 26. Mandatory overlay count

**0** (across both jurisdictions, all topics assessed).

## 27. Optional/recommended overlay count

**1** (Burundi language — the narrow point that the existing §25.6 English/French treatment already matches the Opinion's Business Terms recommendation of an English-core/French-Burundi-addendum treatment with Kirundi optional; nested within an otherwise D-classified topic because whether anything *further* is required remains unresolved).

## 28. No-overlay-required count

**Rwanda: 6 of 10 topics (plus the shared liability-principle component). Burundi: 4 of 10 topics (plus the shared liability-principle component).**

## 29. Unresolved count

**Rwanda: 4 topics carry a D component (liability B2B-cap enforceability; notices; indemnity; operator-disclosure-beyond-CI-01; commercial/subscription — 5 if each counted singly). Burundi: 6 topics carry a D component (governing law/dispute; electronic contracting; language's residual point; notices; indemnity; operator-disclosure-beyond-CI-01; commercial/subscription — 7 if each counted singly).** Every D classification above states the exact `UNRESOLVED — repository does not contain sufficient verified authority` basis and the specific narrower question left open.

## 30. Founder-input blockers

**None identified that block Part VIII drafting itself.** The `DEC-SUB-*` commercial-value gaps (§22 above) are pre-existing, jurisdiction-independent Founder-policy blockers on §18/Commercial Terms content generally, not new Part VIII blockers created by this assessment, and Part VIII may state the same structural non-resolution §18 already states rather than requiring new Founder input to begin. No topic assessed above requires a new Founder product-policy decision before Part VIII's overlay-mechanism architecture (§26) or its C-classified content can be drafted.

## 31. Legal/primary-source verification blockers

The following require legal counsel / primary-source verification before jurisdiction-specific overlay *content* (not the overlay mechanism itself) can be drafted: (Rwanda) whether Rwanda's unfair/unconscionable-terms doctrine affects B2B liability-cap enforceability; (Burundi) whether Burundi mandatory law actually *requires* (not merely permits) a different B2B dispute forum; whether Burundi's 2026 Personal Data Protection Law's demonstrable-consent requirement is already satisfied by the existing LEG-FD-03 acceptance standard; whether a Business-Terms-specific Burundi language-of-controlling-text rule exists beyond §25.6's current treatment; (both jurisdictions) formal notice/deemed-receipt/legal-service requirements under local procedural law; indemnity-clause enforceability under local law; any jurisdiction-specific operator/regulatory-disclosure obligation beyond CI-01; any jurisdiction-specific subscription/billing overlay requirement. None of these is treated as a drafting blocker for the overlay mechanism or for the C-classified content — each is independently reservable as an explicit non-resolution within the relevant overlay entry, following the same technique already used throughout Parts I–VII (e.g., §21.5, §22.4, §24.2, §25.4).

## 32. Controlled Input assessment

No new Controlled Input is warranted by this assessment. Every genuinely open item identified above is either (a) a legal-counsel/primary-source verification question independently reservable within Part VIII's own content (not a drafting blocker requiring a governed value before any drafting may proceed), or (b) already covered by an existing, unrelated Controlled Input (CI-01, a global Preamble gap) or Founder-policy blocker (`DEC-SUB-*`, unrelated to jurisdiction). The Controlled Inputs Register's own classification key already anticipates this: it defines a "Jurisdiction-overlay input — the input is expected to be supplied differently per jurisdiction, via the overlay mechanism (§26 of the draft), not as a single global value" category, currently unused by any row, precisely for future Part VIII drafting-stage use once a specific overlay clause is drafted and a specific value (not this assessment's classification work) is found missing. This assessment does not populate that category, consistent with the governing task instruction not to create Controlled Inputs casually.

## 33. CI-01/CI-05 state

Unchanged and preserved. CI-01 (operator's registered legal name, registration/company number, registered address — required before Founder approval and before legal approval) and CI-05 (the reacceptance-on-Terms-change engineering implementation decision, covering both the mechanism and the refusal/non-acceptance consequence — required before Terms configuration) remain the only two open Controlled Inputs across the entire Core Business Terms instrument, confirmed by direct inspection of the current Controlled Inputs Register (v7.2). This assessment adds none.

## 34. Part VIII readiness classification

**BOUNDED DRAFTING READY WITH EXPLICIT JURISDICTION NON-RESOLUTIONS**, on the following precise basis:
- The **overlay mechanism itself (§26)** may be drafted now, using the Terms Drafting Readiness Note's Layer 1/Layer 2 description (portable core + jurisdictional overlay, not a redefinition of Layer 1) as its governance basis, consistent with LEG-FD-01's fallback-standard reasoning and LEG-FD-10's differentiated-instrument architecture, and consistent with every existing forward reference already drafted into Parts VI–VII (§19.4, §21.8, §25.6) that anticipates exactly this mechanism.
- The **Rwanda overlay entry** may be drafted now stating that no overlay content is required for the topics classified C at §§13–23 above, because Rwanda is the Business Terms' default/home jurisdiction under LEG-FD-14/16, with the D-classified topics (§18's B2B-cap point, notices, indemnity, operator-disclosure, commercial/subscription) stated as explicit reservations, not resolved.
- The **Burundi overlay entry (§27)** may be drafted now only as a **partial, heavily-reserved** entry: stating the C-classified topics require no overlay content, stating the one B-classified language point (already satisfied by existing §25.6 text) without overstating it as a settled additional Founder position, and stating every D-classified topic as an explicit non-resolution pending legal-counsel verification — it may **not** be drafted as a complete Burundi overlay, because a majority of its substantive content (governing law/dispute-forum override, electronic-contracting sufficiency, notices, indemnity, operator-disclosure, commercial/subscription) remains genuinely unresolved for want of repository-backed authority.

## 35. Exact future drafting scope

For §26 (Jurisdictional Overlay Mechanism): a description of the three-layer model (portable Core Terms as Layer 1; jurisdiction-specific overlays as Layer 2, applied per-jurisdiction without redefining Layer 1); a statement that an overlay may only modify, supplement, or displace a Layer 1 provision where the overlay itself states so and where mandatory applicable law requires it (mirroring LEG-FD-14's own proviso); a cross-reference to LEG-FD-10's differentiated-instrument architecture confirming overlays are a distinct instrument category from the Business Terms, Customer Terms, and Business Reward Program Rules; and an explicit statement that §27's index is populated only as individual jurisdiction overlays are separately drafted and separately authorized. For §27 (Overlay index): a Rwanda entry stating no overlay content is currently required, with the D-classified topics listed as explicit reservations (not silently omitted); a Burundi entry limited strictly to the C- and B-classified content identified at §§17, 20, 23, and the language point at §14, with every D-classified topic (§§13, 15, 16, 18 [B2B-cap component], 19, 21, 22) stated as an explicit non-resolution requiring legal-counsel verification or a future Founder decision before it can be drafted, exactly as CI-05 is currently stated within §22.4 rather than silently resolved.

## 36. Exact prohibited drafting content

Must not be drafted in Part VIII: any Rwanda-specific governing-law or arbitration-forum modification (Rwanda is already the default; there is nothing to overlay); any Burundi Business-Terms dispute-forum override presented as a decided fact (only the Opinion's discretionary recommendation exists, not a Founder decision or an established mandatory-law requirement); any Kirundi general-application-language requirement (LEG-FD-02 forecloses this even for Burundi); any forced-scrolling/re-type-acceptance requirement for either jurisdiction (no repository-backed mandatory requirement exists for either); any fixed notice period, deemed-receipt period, or mandatory notice channel for either jurisdiction (no authority establishes any); any resolution of the zero-fee-Business liability cap (`DEC-SUB-013`, unrelated to jurisdiction); any nominal customer liability cap (LEG-FD-15 expressly declines the Opinion's $25 recommendation); any invented `DEC-SUB-*` commercial value (prices, billing cycles, grace periods, payment deadlines, auto-renewal, refund mechanics, late fees, plan names) presented as jurisdiction-specific content; any universal 60-day run-off period or universal cash-settlement rule reintroduced under the label of a "jurisdiction overlay" (LEG-FD-07/08 already foreclose this as a global rule, and no repository authority establishes it as a Rwanda- or Burundi-specific mandatory requirement either); any resolution of CI-05 or CI-01 presented as if Part VIII drafting resolves them (it does not; both remain open, unrelated Controlled Inputs); any substantive privacy/data-processing obligation drafted into §27 rather than left to the separate privacy/data-processing instrument track (LEG-FD-09/10).

## 37. Parts I–VII integrity verification

No file under `docs/00-governance/decisions/evidence/` was edited by this assessment. `git status --short` after the research and drafting phases confirms only two new files created (this report and the changes-log entry, added below) and no modification to the Core Business Terms instrument, the Controlled Inputs Register, the Drafting Traceability Matrix, or the Decision Register. Parts I–VII clause text is unaffected.

## 38. DEC-LEGAL-002 state

`OPEN_LEGAL`, unchanged — confirmed by direct inspection of the Decision Register's current entry.

## 39. Terms configuration state

`NOT CONFIGURED` (`platformConfig/businessTerms`), unchanged — confirmed the same way.

## 40. Capability 3 state

`Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002)` (`CDR-001` §5), unchanged — confirmed by direct inspection of the Capability Delivery Roadmap.

## 41. Files modified

`DEC-LEGAL-002-BT-PART-VIII-READINESS-001-assessment-report-2026-09-02.md` (this file, created); `documentation-changes-log.md` (Entry 143 added).

## 42. Diff summary

Two new files added; zero existing files modified. No Core Business Terms, Controlled Inputs Register, Drafting Traceability Matrix, or Decision Register change.

## 43. Commands executed

`git rev-parse --git-dir`/`--git-common-dir`; `git branch --show-current`; `git status --short`; `git worktree list`; `gh --version`; `gh auth status`; `gh pr view 212 --json ...`; `gh run list --branch main --limit 5 --json ...`; `EnterWorktree` (native tool); `git branch -m` (rename); `find`/`grep` across `docs/` for source-document discovery and fact verification; a `general-purpose` research subagent performing read-only `Read`/`grep`/`find` fact extraction across the identified evidence files (no file modification); direct `Read` of the prior Part VII readiness assessment report and targeted `grep` of the Capability Delivery Roadmap and Decision Register for exact status strings; `Write` of this report; subsequent `git add`/`git commit`/`git push`/`gh pr create` (recorded below once executed).

## 44. Dependencies/config changes

None.

## 45. Application/source changes

**NONE.**

## 46. Checks/CI

To be triggered by the PR opened from this branch; no local build/test run required for a docs-only change, consistent with prior readiness-assessment task precedent.

## 47. Automated review findings

None yet — to be recorded after Codex/automated PR review runs, per the same review-and-correction pattern the Part VII readiness assessment (`-CORR-001`, `-CORR-002`) and Part VII draft (`-CORR-001`, `-CORR-002`) both followed.

## 48. Risks

If a future Part VIII drafting task treats any D-classified topic in this assessment as if it were already resolved (particularly the Burundi dispute-forum point, which the Legal Opinion discusses at length and which could be mistaken for settled authority), it would draft jurisdiction-specific content on a foundation this assessment explicitly found unverified — any such content must first be confirmed with legal counsel or elevated to a narrow Founder decision. If a future task assumes the §26 overlay-mechanism design implied by the Terms Drafting Readiness Note's Layer 1/Layer 2 narrative is itself an approved instrument-architecture decision (rather than a governance-note description this assessment treats as a reasonable, LEG-FD-01-consistent basis, not itself a separately Founder-ratified architecture), it should flag that distinction rather than treat this assessment as having created new Founder authority. No jurisdiction overlay should be finalized or configured while CI-01/CI-05 remain open, since Terms configuration itself remains blocked regardless of Part VIII's own readiness.

## 49. Rollback instructions

Revert this commit / close the PR opened from this branch without merging; only the two files at §41 are touched, so rollback is a single-commit revert.

## 50. Changes-log entry

Entry 143, added to `docs/00-governance/documentation-changes-log.md`.

## 51. Assessment report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-READINESS-001-assessment-report-2026-09-02.md`

## 52. Commit SHA

Recorded in the completion message after commit.

## 53. PR number/state

To be recorded after `gh pr create`. Not self-merged.

## 54. Exact Founder next action

Review this assessment and, if satisfied: (1) authorize drafting of §26's overlay-mechanism architecture and the Rwanda entry of §27 (both `BOUNDED DRAFTING READY`) within the exact scope at §35 and avoiding every item at §36; (2) decide whether to commission legal-counsel primary-source verification on the specific Burundi (and narrower Rwanda) D-classified questions at §31 before authorizing any further Burundi overlay content beyond the partial entry described at §34; (3) note that CI-01 and CI-05 remain open and unaffected by Part VIII drafting, and that Terms configuration/Capability 3 closure remains gated on their resolution regardless of Part VIII's own progress.

---

## 55. FINAL GATE

`PART VIII JURISDICTION OVERLAY ASSESSMENT COMPLETE — BOUNDED DRAFTING READY WITH EXPLICIT JURISDICTION NON-RESOLUTIONS`
