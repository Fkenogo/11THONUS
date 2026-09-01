> **Title:** DEC-LEGAL-002-BT-PART-VI-AUTH-001 — Part VI (§19 Liability, §20 Indemnity) Final Drafting-Authority Confirmation
> **Version:** 1.0 · **Status:** ASSESSMENT ONLY — NO CLAUSE TEXT DRAFTED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VI-AUTH-001-assessment-report-2026-09-01.md`
> **Date:** 2026-09-01 · **Task:** `DEC-LEGAL-002-BT-PART-VI-AUTH-001`

> **Status: AUTHORITY-CONFIRMATION ONLY — NO CLAUSE TEXT DRAFTED, NO PART VI DRAFTING BEGUN.** This report re-verifies, against primary sources read directly (not merely re-summarized from the prior Part V readiness assessment), whether §19 (Liability) and §20 (Indemnity) are drafting-ready, and identifies the exact permitted drafting scope and any narrow Founder/legal decision still required. It does not draft §19 or §20, does not modify the Core Business Terms instrument, and does not begin Part VII or Part VIII.

---

## 1. Assessment strategy

This task is a bounded pre-drafting authority confirmation, not a re-derivation. The prior `DEC-LEGAL-002-BT-PART-V-READINESS-001-assessment-report-2026-08-31.md` (as merged/corrected through PR #207) already performed a full advance-readiness analysis of Part VI (its §§15–26). Rather than re-litigating that analysis from scratch, this task (a) re-reads every primary source that analysis relied on — LEG-FD-15, LEG-FD-10, LEG-FD-14, the relevant Reconciliation Matrix rows, and the external Legal Opinion §§9–11 — directly, at first hand, to confirm the prior analysis's conclusions are accurate rather than assuming they still hold; (b) re-verifies every Decision Register status (`DEC-SUB-*`, `DEC-ID-005`) and Controlled Input (CI-01, CI-05) is unchanged since that analysis; (c) checks the current Core Business Terms instrument and Part VIII architecture directly, since a jurisdiction-allocation recommendation depends on whether Part VIII (the overlay mechanism) has itself been drafted yet (it has not); and (d) issues separate readiness classifications for §19 and §20 plus one overall Part VI gate, per the governing task's required output format. No clause text is drafted at any point in this process.

## 2. Entry repository state

Working tree started on `docs/dec-legal-002-bt-draft-005` with the same pre-existing untracked files noted in every prior task in this series (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`/`docs/01-product`/`docs/05-implementation/reports`/`docs/06-engineering-governance`/`docs/30-go-to-market` files, `docs/07-product-design.zip`), left untouched. No incomplete git operation was present.

## 3. Base SHA

`origin/main` at task start: `0ce7894a9731451c8f96901b18209c8269f33326` (PR #208 merge commit).

## 4. PR #208 merge verification

`git log --oneline -3 origin/main` confirmed `0ce7894a9731451c8f96901b18209c8269f33326` as the current tip of `origin/main`, subject "Merge pull request #208 from Fkenogo/docs/dec-legal-002-bt-draft-005." `git merge-base --is-ancestor 0ce7894a9731451c8f96901b18209c8269f33326 origin/main` confirmed true.

## 5. New branch

`docs/dec-legal-002-bt-part-vi-auth-001`, created fresh from `origin/main` at `0ce7894a`.

## 6. Part VI placeholder verification

Directly re-inspected the merged Core Business Terms instrument: no `## Part VI` heading exists yet in the drafted body (only Part 0's proposed-architecture list, lines 85–87, states "**Part VI — Risk Allocation** *(heading only — not drafted)*" naming §19/§20). A `grep` for `^19\.` and `^20\.` found only the two Part 0 architecture-list entries ("19. Liability", "20. Indemnity") — no numbered clause text (`19.1`, `20.1`, etc.) exists anywhere in the instrument. Part V §18 confirmed present as full clause text (Founder-approved per the prior task's disposition). `DEC-LEGAL-002` confirmed `OPEN_LEGAL`; Terms configuration confirmed `NOT CONFIGURED`; CI-01/CI-05 confirmed the only two open Controlled Inputs; repository/worktree state confirmed safe.

## 7. Authorities inspected (direct, first-hand)

- `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` — **LEG-FD-15** (Liability Architecture, lines 201–216) and **LEG-FD-10** (Customer Terms Architecture, lines 122–137) read verbatim in full. **LEG-FD-14** (B2B Dispute Resolution, lines 179–197) read for the dispute/liability boundary intersection the governing task names.
- `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md` — rows 9 (Platform Liability Limits), 10 (Business Liability & Indemnity), 11 (Limitation/Exclusion Provisions), and 20 (Subscription Framework Structure, for cross-reference to the already-settled FD-7 boundary) read verbatim.
- `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md` §§9–11 read verbatim, as reconciled input only — treated as authority solely to the extent LEG-FD-15/Reconciliation rows 9–11 adopted it, not as independent authority in itself, per the governing task's instruction.
- `DEC-LEGAL-002-BT-PART-V-READINESS-001-assessment-report-2026-08-31.md` (as merged/corrected through PR #207) §§15–26 — the existing Part VI advance-readiness material — read in full and cross-checked against the primary sources above rather than relied on alone.
- Current Core Business Terms instrument (v5.0, post-Part-V-merge) — Part 0 §§0.0/0.1, the jurisdictional-overlay cross-references (§3.3, §7.3), and the "End of Part V" placeholder note.
- Current Controlled Inputs Register and Drafting Traceability Matrix (v5.0) — confirmed CI-01/CI-05 remain the only open items and neither concerns §19/§20.
- Current Decision Register — `DEC-SUB-001`–`013`, `DEC-ID-005`, `DEC-LEGAL-002` — every status directly re-read; confirmed unchanged since the prior Part V readiness assessment (`git log` on `decision-register.md` shows no commits between `d6de663` and the current `origin/main` HEAD affecting this file).
- Burundi/Rwanda jurisdiction-overlay architecture — confirmed Part VIII (§26 Jurisdictional Overlay Mechanism) is itself undrafted architecture-only (Core Business Terms Part 0 §0.1, line 96); no overlay document exists yet to receive jurisdiction-specific content.

No application/backend/Firebase/configuration file was read for authority purposes in this task.

## 8. §19 cap-formula authority

Confirmed verbatim in LEG-FD-15 (line 205): *"Subject to applicable law and non-excludable liability, the aggregate direct contractual liability of 11thONUS to a Business is capped at the total fees actually paid by that Business to 11thONUS during the 12 months immediately preceding the event giving rise to the claim."* This is a Founder-approved disposition (`DEC-LEGAL-002-FOUNDER-CLOSE-001`, 2026-08-29, "APPROVED WITH JURISDICTIONAL/LEGAL QUALIFICATION"), reconciling and adopting the external Legal Opinion §9's Business-cap structure (Reconciliation row 9).

## 9. §19 cap wording readiness

The formula is drafting-ready **exactly as stated** — no drafting qualification is required beyond what the formula itself already carries ("subject to applicable law and non-excludable liability"). The governing task instructs not to change the formula; none is proposed. The only qualification a future drafting task must still apply is the standard "to the maximum extent permitted by applicable law" phrasing LEG-FD-15 itself names as "the intended drafting pattern for every limitation/exclusion clause" (line 213) — this is drafting execution, not a missing authority element.

## 10. Zero-fee treatment — exact permitted paths

LEG-FD-15 (line 207) is explicit and deliberate: a strict application of the fees-paid formula to a Business that paid nothing produces a cap of zero, and the disposition "does not attempt to correct this with an invented substitute figure." It names two non-exclusive paths: *"Appropriate treatment for a zero-fee arrangement is left to final legal drafting and/or future commercial governance (potentially engaging `DEC-SUB-013`... not decided or estimated here)."* Re-confirming the prior readiness report's analysis (its §17, corrected pass) directly against this primary text: the disposition authorizes (1) applying the formula literally where a Business has paid fees, (2) leaving the zero-fee case explicitly unresolved via a non-resolution statement (the same technique §13.7/§14.4/§15.7/§16.8/§18.6 already use), (3) resolving it through bounded legal-drafting judgment at drafting time, or (4) deferring it to future commercial governance (potentially `DEC-SUB-013`). Any combination of (2)–(4) is permitted; what is **not** permitted under any path is inventing a nominal dollar/BIF figure, a minimum-plan-fee proxy, a lowest-available-plan proxy, or any other arbitrary floor — LEG-FD-15's own text forecloses exactly that substitution, not the underlying question itself.

## 11. Whether zero-fee treatment requires Founder/legal decision

**No narrow Founder/legal decision is required before §19 can be drafted.** The disposition itself already authorizes proceeding via explicit non-resolution (path 2 above) — the same drafting-discipline technique every prior Part of this instrument already uses for a comparably unresolved gap (`DEC-LOY-009`, `DEC-ID-005`, the five untracked §18 commercial questions). A future §19 drafting task may choose path (3) (bounded legal-drafting judgment) instead if it wishes to resolve the gap rather than flag it, but that is a drafting-task discretion, not a precondition — §19 is coherent and complete with the cap formula stated and the zero-fee case handled by non-resolution.

## 12. Damages-exclusion authority

Confirmed directly: LEG-FD-15's own §"Reconciliation with the Legal Opinion §9" (line 215) states *"its indirect/consequential/punitive/special-damages disclaimer structure and its Rwanda/Burundi jurisdiction-specific liability notes (notice-and-takedown, ARCT obligations) remain accepted as drafting/jurisdictional input, unaffected"* — i.e., **not declined**, only the nominal customer cap was declined. The underlying external Legal Opinion §9 (read directly, line 128) states the disclaimer scope: *"The Core Terms must disclaim all indirect, consequential, punitive, and special damages."* This is the exact and complete list; LEG-FD-15 does not narrow or expand it.

## 13. Damages categories drafting-ready

Four categories, and only these four, are drafting-ready: **indirect loss, consequential loss, punitive damages, special damages.** Each carries the same qualifying condition LEG-FD-15 attaches to every limitation clause: subject to applicable law and the non-excludable-liability boundary (§14 below). No other damages category (e.g., "loss of profits," "loss of business," "loss of goodwill" as separate named categories) is independently supported by reconciled authority — the governing task's instruction not to expand the list merely because such exclusions are common legal drafting practice is observed: this report does not add categories beyond the four the Legal Opinion states and LEG-FD-15 leaves unaffected.

## 14. Mandatory-law/non-excludable boundary

Confirmed directly in LEG-FD-15 (line 213): *"No limitation or exclusion of liability adopted under this disposition purports to override a liability that applicable law does not permit the parties to exclude or limit."* This is the **governed global principle** — portable, applies regardless of jurisdiction. LEG-FD-15 names, as illustrative examples of matters mandatory law typically protects, "fraud, wilful misconduct, gross negligence, death or personal injury, or a non-excludable statutory consumer warranty," expressly citing the external Legal Opinion §11's "Prohibited Exclusions" table (Reconciliation row 11, classification C) as "jurisdiction-specific legal input on this exact point." Reading Reconciliation row 11 and the Legal Opinion §11 directly (§21 below): the opinion's own table (lines 155–158, 171–183) is explicitly labeled "Public Policy Limits (Burundi & Rwanda)" and "Prohibited Exclusions (Consumer Protection)" — i.e., **jurisdiction-specific counsel illustration**, classified C ("accepted as jurisdiction-specific drafting guidance; no product-policy decision required"), not an independently governed universal exhaustive list. **Distinguishing the three tiers precisely, as the governing task requires:** (a) the *governed global principle* is the single portable sentence above — no exclusion may override non-excludable liability; (b) the *jurisdiction-specific mandatory-law examples* (fraud, wilful misconduct, gross negligence, death/personal injury, non-excludable statutory consumer warranties) are drafting input, accepted at Class C, not independently product-positioned; (c) nothing in this material should be turned into a universal exhaustive list purporting to enumerate every category applicable law might protect in every jurisdiction — the governed principle itself is deliberately open-ended ("a liability that applicable law does not permit the parties to exclude or limit"), and the named examples illustrate rather than close that set.

## 15. Customer-liability boundary

Confirmed directly in LEG-FD-10 (line 128): *"A. Core Business Terms — the relationship between 11thONUS and a participating Business. B. Customer Terms / Platform Terms of Use — the direct relationship between 11thONUS and the customer."* §19 is Business Terms content; the customer is not a party to this instrument (LEG-FD-10, lines 133–137: Customer Terms are "not drafted by this task," "a separate future governed work package"). LEG-FD-15's customer-liability principle (line 209 — "11thONUS liability to customers is limited to the maximum extent permitted by applicable law, subject to mandatory consumer rights and jurisdiction-specific requirements") is a *substantive* customer-facing principle; stating it inside §19 would draft Customer Terms content inside the Business Terms instrument, contrary to LEG-FD-10's differentiated-instrument architecture. **Re-confirming the prior readiness report's already-corrected conclusion (its §19, as corrected) against LEG-FD-10 directly:** §19 must not state the customer-liability principle as operative text, and must not import the rejected $25 USD/BIF nominal figure in any form — that figure is expressly "not adopted" (LEG-FD-15, line 209) and, independently, customer-facing content of any kind belongs to the future Customer Terms work package.

## 16. Customer-Terms cross-reference recommendation

**Recommended: §19 should say nothing substantive about customer liability, limited to a narrow negative boundary statement (that this section does not address 11thONUS's liability to customers, which is reserved to the future Customer Terms instrument) — not an affirmative statement of the "maximum extent permitted by applicable law" principle.** This mirrors the precedent already established at Part IV §17.4 (customer complaints reserved to Customer Terms, stated as a reservation, not a restatement) and Part I §6.3/§3.2(c). A bare silence (saying nothing at all) would also be legally sound but risks a reader inferring §19's Business-cap formula applies platform-wide including to customers; the narrow reservation sentence forecloses that misreading without drafting any Customer Terms content. This is the narrower of the two options the governing task asks this report to choose between, and is recommended over a fuller cross-reference.

## 17. Rwanda liability material

Confirmed directly, external Legal Opinion §9 (lines 130): *"Under the new Competition and Consumer Protection Law, online intermediaries are shielded from liability for seller content only if they do not knowingly allow illegal activities and respond to notices of harmful content. This creates a notice-and-takedown obligation."* LEG-FD-15's own reconciliation (line 215) expressly preserves this as "accepted as drafting/jurisdictional input, unaffected." Reconciliation row 9 confirms the same, tagging it "jurisdiction-by-jurisdiction (notice-and-takedown/ARCT specifics)" as distinct from the "Core/Portable" cap-structure element of the same row.

## 18. Burundi liability material

Confirmed directly, external Legal Opinion §9 (line 132): *"The ARCT E-Commerce Guide (2025) imposes obligations on platforms regarding consumer protection and transaction oversight. 11thONUS must have clear procedures for handling complaints about Business conduct."* Same LEG-FD-15/Reconciliation-row-9 preservation as the Rwanda material above.

## 19. Recommended jurisdiction allocation

**Option C — partly in §19 as a general principle, with jurisdiction-specific mechanics deferred to Part VIII once that Part is drafted.** Directly confirmed: Part VIII (§26 Jurisdictional Overlay Mechanism) is itself undrafted — Core Business Terms Part 0 §0.1 states it as "architecture only — not drafted" (line 96), and no overlay document exists anywhere in the repository to receive Rwanda/Burundi-specific content today. This forecloses Option A alone (drafting the specific notice-and-takedown/ARCT mechanics directly and permanently inside §19, which would embed jurisdiction-specific mechanics in Layer 1 portable text, contrary to the instrument's own two-layer architecture, LEG-FD-01/LEG-FD-10, Terms Drafting Readiness Note §1) and Option B alone (deferring entirely to Part VIII, which does not yet exist to receive the content, risking the accepted material being silently dropped in the interim). The correct current-state allocation is: (i) state the **general, portable mandatory-law/non-excludable-liability principle** (§14 above) directly in §19, since this is Core/Portable content per Reconciliation row 9's own tag; (ii) include a **forward cross-reference** in §19 noting that jurisdiction-specific mandatory requirements (including the accepted Rwanda notice-and-takedown and Burundi ARCT material) are addressed through the Part VIII overlay mechanism once drafted — using exactly the same forward-reference technique Part I §3.3/§7.3 already use for other jurisdiction-specific matters ("§26, Part VIII, not drafted in this task"); (iii) the actual Rwanda notice-and-takedown and Burundi ARCT clause text itself is **not drafted anywhere yet** — neither in §19 nor in a not-yet-existing Part VIII — until a future task drafts Part VIII. This allocation decision does not itself draft Part VIII and is not authority to begin it; it only determines where the material eventually belongs once drafting proceeds.

## 20. §19 final readiness classification

**BOUNDED DRAFTING READY.** The cap formula, the damages-exclusion category list, the mandatory-law/non-excludable boundary, and the customer-liability negative-boundary treatment are all governed and drafting-ready as stated above. The zero-fee gap and the jurisdiction-specific mechanics gap are both bounded — each has an explicit, authority-supported non-resolution/deferral path that does not require inventing content, and neither blocks coherent §19 drafting. No item requires escalation as a Founder/legal decision before drafting may proceed.

## 21. §20 indemnity governing authority

Confirmed directly, Reconciliation Matrix row 10: *"Business indemnifies platform for reward-fulfilment failure, defective goods, false advertising, tax non-compliance"* — classification **A**, basis: *"(consistent with existing 'Business bears responsibility' architecture; no LEG-FD item needed)"* — *"Accepted as the indemnity-clause content direction for future Business Terms drafting."* No dedicated LEG-FD item exists for indemnity; row 10's own classification is the authority. Cross-checked against the external Legal Opinion §10 directly (lines 134–151): the opinion proposes the Business indemnify, defend, and hold harmless 11thONUS against claims arising from the same four subjects, plus a "Required Business Liability Provisions" table with five broader rows (reward fulfilment, Reward Program content, customer relationship, regulatory compliance, and a catch-all "Business indemnifies 11thONUS against all claims arising from Business's Reward Program or conduct").

## 22. Four governed indemnity subjects verification

Confirmed verbatim, Reconciliation row 10 and Legal Opinion §10 (lines 138–141): **(1)** failure of the Business to fulfil earned rewards; **(2)** defective, illegal, or harmful goods/services provided by the Business; **(3)** false advertising or misrepresentation in the Business's Reward Program; **(4)** non-compliance with local tax laws. These four, and only these four, are the accepted **triggering-subject** matter of the indemnity.

**Indemnitee scope and covered-harm scope (added on PR #209 Codex review — a genuine gap in the original pass).** Two further dimensions of the Legal Opinion's proposed clause (line 136) were not separately classified in the original version of this report: (a) **who is protected** — the opinion proposes indemnifying "11thONUS, its affiliates, officers, and employees," not 11thONUS alone; (b) **what kind of harm is covered** — the opinion proposes covering "any claims, losses, liabilities, or regulatory fines," not merely "claims." Reconciliation row 10's own summary text names only "platform" as indemnitee and only "claims arising from" the four subjects, without separately addressing affiliates/officers/employees or the losses/liabilities/regulatory-fines breadth. Applying this report's own §23 principle (row 10's Class-A acceptance is scoped to what it actually says, not to every element of the opinion's fuller proposed clause), both dimensions are classified as follows: **indemnitee scope beyond 11thONUS itself (affiliates, officers, employees) — Classification B, permitted legal-drafting judgment, not independently governed.** No FD/LEG-FD/Reconciliation item extends or restricts indemnitee identity; extending protection to affiliates/officers/employees is standard indemnity-drafting practice that does not invent a commercial value or new product policy, so it may be included as ordinary drafting judgment, but it is not itself "governed" the way the four trigger subjects are — a future §20 task may also omit it (indemnifying 11thONUS alone) without contradicting any authority. **Covered-harm-type scope ("claims, losses, liabilities, regulatory fines" vs. "claims" alone) — Classification B, same reasoning.** Row 10's own phrasing ("Business indemnifies platform for [subject]") does not itself narrow the type of harm covered; the broader "claims, losses, liabilities, or regulatory fines" framing is ordinary indemnity-drafting breadth, not an independently governed element, and is available as legal-drafting judgment — a future task may narrow it to "claims" alone or use the fuller list, either being coherent and non-inventive. Neither dimension is drafting-blocking; both are available, not required, and a future §20 drafting task must decide them at drafting time as legal-drafting judgment (Classification B), not treat either as pre-settled by row 10's Class-A acceptance of the four trigger subjects.

## 23. General-breach indemnity status

**NOT governed.** Row 10's classification A accepts indemnity for the four enumerated subjects, not a general "Business indemnifies for any Terms breach" provision. The Legal Opinion's own "Required Business Liability Provisions" table (line 151) proposes a broader catch-all — "Business indemnifies 11thONUS against all claims arising from Business's Reward Program or conduct" — but Reconciliation row 10's classification and basis text scope acceptance to the four numbered items only, not to this broader table row; no separate Founder/legal disposition extends acceptance to it. Parts II–IV's existing "Business bears responsibility" architecture (FD-2/FD-3/FD-5/FD-6, Business Obligation Matrix) establishes *responsibility* for compliance generally — it does not, by itself, convert every such responsibility into an *indemnity* obligation running to 11thONUS. Responsibility and indemnity remain distinct concepts (as the prior readiness assessment's §20 already concluded, and this direct re-inspection of row 10 and the Legal Opinion table confirms rather than merely repeats).

## 24. General unlawful-conduct indemnity status

**NOT governed**, for the same reason as §23 above — Part II §10's prohibited-conduct catalogue establishes what conduct is prohibited (a responsibility/compliance matter), not that every instance is indemnifiable toward 11thONUS. No authority extends indemnity to unlawful conduct generally, only to the four named subjects (two of which — defective/illegal/harmful goods and tax non-compliance — happen to be species of unlawful conduct, but narrowly, not as a general category).

## 25. Business-content/data indemnity status

**NOT governed**, for the same reason. §11/§12's content/data responsibility allocation (already drafted, Parts II–III) is a responsibility allocation, not an indemnity clause, and is not converted into one by row 10's acceptance of the four narrower subjects.

## 26. Defence-control status

**Classification D — unresolved and drafting-blocking if included, but omittable.** No FD/LEG-FD/Reconciliation item addresses who controls the defence of an indemnified claim. Not addressed anywhere in governed authority; the external Legal Opinion's own proposed clause language (§10) does not itself specify defence-control mechanics either. If a future §20 drafting task wishes to state a defence-control mechanic, that would require new legal-drafting judgment or a Founder disposition; if it simply omits the mechanic (leaving it to a future revision or applicable-law default), §20 remains coherent without it — so this item does not block Part VI drafting, it only blocks drafting *this specific mechanic* until resolved or explicitly flagged non-resolved.

## 27. Duty-to-defend status

**Classification D on the same terms as §26** — a "duty to defend" (as distinct from mere indemnification of loss) is a materially broader, procedurally distinct obligation with its own case law/drafting conventions; no authority establishes it exists here. Omittable without blocking §20; not governed if included without further authority.

## 28. Settlement-consent status

**Classification D on the same terms as §26–27.** No authority addresses whether 11thONUS's consent is required to settle an indemnified claim. Omittable; not governed if included.

## 29. Legal-cost allocation status

**Classification D, cross-referencing LEG-FD-14's own explicit non-resolution.** LEG-FD-14 (line 195, read directly) states: *"cost-allocation mechanics... [are] left to the controlled Terms-drafting stage, where KIAC's own default procedural rules will supply defaults unless the drafted clause displaces them"* — this is the *arbitration* cost-allocation gap, distinct from but structurally identical to the *indemnity-specific* legal-cost-allocation gap (who pays legal fees incurred defending/pursuing an indemnified claim, as opposed to arbitration costs generally). Neither gap is resolved by any authority; the indemnity-specific gap is genuinely unaddressed anywhere, not merely deferred like the arbitration-cost gap. Omittable without blocking §20.

## 30. Claim-notice status

**Classification B — permitted legal drafting judgment, not independently governed but not blocking either.** No authority states a specific notice mechanism or timeline for an indemnity claim. This is standard, low-risk indemnity-clause drafting practice (a notice-of-claim procedural clause) that does not itself require inventing a commercial value, numeric period, or product policy — unlike, e.g., a numeric grace period or notice-period value, a bare "the indemnified party will give reasonably prompt notice" formulation would not conflict with any governed authority or invent a `DEC-SUB-*`-adjacent value. This is available as ordinary legal-drafting judgment at drafting time, not a gap requiring Founder/legal escalation, but is not itself "governed" in the sense the four subject-matter categories are.

## 31. Cooperation-duty status

**Classification B, same reasoning as §30** — a general "reasonable cooperation" duty is standard indemnity-drafting practice, available as legal-drafting judgment, not independently governed, not blocking.

## 32. Negligence/wilful-misconduct treatment

**Classification D.** No FD/LEG-FD item addresses whether or how the indemnity is reduced or excluded to the extent a claim arises from 11thONUS's own negligence or wilful misconduct. This is standard indemnity-drafting practice but has not been through Founder/legal disposition here — it is not simply an omittable procedural nicety like §30–31; omitting a negligence carve-out where an indemnity clause is otherwise broadly drafted could materially expand the Business's exposure beyond what the four accepted subjects intend to cover, so if a future §20 task chooses to include a broadly-worded indemnity, this carve-out becomes practically important — but the *item itself* remains omittable (the clause can simply not address the point, deferring to applicable law and future revision) without blocking §20's core drafting.

## 33. Third-party-claim scope

**Classification D.** No definition or scope for "third-party claims" exists in any governed authority; the Legal Opinion's own proposed text does not define the term either. Omittable — a future §20 task can use ordinary language (e.g., "claims by a person who is not a party to these Terms") without inventing a defined term, or can flag the absence of a formal definition explicitly.

## 34. §20 final readiness classification

**BOUNDED DRAFTING READY.** The indemnity *principle*, scoped to exactly the four Reconciliation-row-10 subject-matter categories, is governed and drafting-ready. Every procedural mechanic (defence control, duty to defend, settlement consent, cost allocation, negligence/wilful-misconduct carve-out, third-party-claims scope) is Classification D (unresolved) but each is independently omittable — §20 remains coherent, complete, and non-inventive if it states the four-subject indemnity principle and expressly does not address the procedural mechanics (the same explicit-non-resolution technique used throughout this instrument), rather than silently adopting the Legal Opinion's fuller proposed clause language. Claim-notice and cooperation-duty (Classification B) are available as ordinary legal-drafting judgment if a future task wants a more complete clause, but are not required. No item requires escalation as a Founder/legal decision before §20 may be drafted on the bounded basis described.

## 35. New Controlled Input assessment

**None warranted.** Applying the same rationale this instrument's Controlled Inputs Register already establishes for every prior Part (a CI is created only once a drafted clause's gap genuinely cannot be handled by omission or explicit non-resolution): (a) the zero-fee liability gap is not a drafting blocker — LEG-FD-15 itself already authorizes proceeding via explicit non-resolution, and a CI here would duplicate an already-recorded LEG-FD-15 non-resolution rather than identify a new gap; (b) the jurisdiction-allocation question is not a drafting blocker — the general mandatory-law principle is drafting-ready now, and the jurisdiction-specific mechanics are properly deferred to a future Part VIII drafting task (which will need its own authorization regardless, independent of any CI); (c) the indemnity procedural-mechanics gaps are not drafting blockers — each is independently omittable, and the established technique (a `[CONTROLLED INPUT REQUIRED: ...]` marker or explicit non-resolution sentence placed at actual drafting time, per the prior readiness report's §23 rationale, adopted here directly) applies once §20 clause text is actually written, not in advance of it. No item meets the bar the governing task's §8 sets ("a new CI is warranted only where the missing answer is required for coherent clause text and cannot be omitted or handled through explicit non-resolution") — every item here can be omitted or handled through explicit non-resolution.

## 36. CI-01/CI-05 state

Unchanged. Both remain the only two open Controlled Inputs; neither concerns §19/§20 subject matter; neither is touched by this assessment.

## 37. DEC-LEGAL-002 state

Unchanged: `OPEN_LEGAL`.

## 38. Terms configuration state

Unchanged: `NOT CONFIGURED`.

## 39. Capability 3 state

Unchanged: Open — engineering work packages complete; blocked on governed Terms-content configuration. (Not "IN PROGRESS" as a distinct status value — the Decision Register/CDR-001 convention records this status verbatim as "Open — engineering work packages complete; blocked on governed Terms-content configuration," which this report preserves exactly rather than substituting different wording.)

## 40. Overall Part VI gate

**`PART VI DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS`.** Both §19 and §20 are individually `BOUNDED DRAFTING READY` (§20 and §34 above) — meaning each has governed, drafting-ready core content, plus specific, named gaps that a future drafting task must handle by explicit non-resolution (not by inventing values) rather than by escalating a Founder/legal decision first. No item in either section rises to `FOUNDER/LEGAL DECISION REQUIRED`.

## 41. Exact permitted drafting scope (for a future Part VI drafting task)

- §19: the exact 12-month-fees Business liability cap formula (§8–9 above), stated without modification; the four-category damages exclusion (indirect/consequential/punitive/special), each qualified "to the maximum extent permitted by applicable law"; the general portable mandatory-law/non-excludable-liability principle; a forward cross-reference to jurisdiction-specific mandatory requirements addressed through the Part VIII overlay mechanism (not yet drafted); a narrow negative reservation that §19 does not address 11thONUS's liability to customers (reserved to the future Customer Terms work package); explicit non-resolution of the zero-fee-Business cap treatment.
- §20: the indemnity principle scoped to exactly the four Reconciliation-row-10 subjects (reward-fulfilment failure; defective/illegal/harmful goods or services; false advertising/misrepresentation; tax non-compliance); as a matter of ordinary legal-drafting judgment (Classification B, not independently governed — §22 above), whether the indemnitee is 11thONUS alone or also its affiliates, officers, and employees, whether covered harm is "claims" alone or also "losses, liabilities, or regulatory fines," and ordinary claim-notice and cooperation-duty language; explicit non-resolution of defence control, duty to defend, settlement consent, legal-cost allocation, the negligence/wilful-misconduct carve-out, and the scope/definition of "third-party claims."

## 42. Exact prohibited content

- Any invented nominal/fixed zero-fee-Business liability substitute figure (a floor, a minimum-plan-fee proxy, a lowest-plan proxy, or "no liability").
- Any affirmative statement of a customer-facing liability cap or principle inside §19, including the "maximum extent permitted by applicable law" customer principle itself (reserved entirely to future Customer Terms) and, independently, any revival of the rejected $25 USD/BIF nominal figure.
- Any damages-exclusion category beyond indirect/consequential/punitive/special.
- Any exclusion/limitation clause omitting the "to the maximum extent permitted by applicable law" qualifier, or purporting to override a non-excludable liability.
- Any Rwanda notice-and-takedown or Burundi ARCT clause text drafted directly into §19 as permanent portable Layer-1 content (belongs to a future Part VIII overlay, or a §19 forward-reference only) — and, equally, silently dropping this accepted material from scope entirely.
- Any indemnity obligation extending beyond the four accepted subjects to general Terms breach, unlawful conduct generally, or Business-content/data issues generally, on the theory that existing "responsibility" language already covers it.
- Any indemnity procedural mechanic (defence control, duty to defend, settlement consent, cost allocation, negligence/wilful-misconduct carve-out, third-party-claims definition) presented as governed/settled rather than either omitted or explicitly non-resolved.
- Any new Business lifecycle state, `DEC-ID-005` resolution, or `DEC-SUB-*` value — none of these is implicated by §19/§20 subject matter, and none should be introduced incidentally.
- Any Part VII or Part VIII clause text.

## 43. Files modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VI-AUTH-001-assessment-report-2026-09-01.md` (this file — created).
- `docs/00-governance/documentation-changes-log.md` (entry to be appended — see §49).

No other file modified. Core Business Terms, Traceability Matrix, Controlled Inputs Register, Decision Register, and all application/source/config files left untouched.

## 44. Commands executed

Read-only git inspection only: `git status`, `git fetch origin`, `git log --oneline`, `git merge-base --is-ancestor`, `git checkout -b` (branch creation), `grep`/`sed` (repeated for direct-source reading and Part VI placeholder/clause-text search). No mutating command beyond branch creation and this file's own creation.

## 45. Dependencies/config changes

None.

## 46. Application/source changes

**NONE.** No file under `functions/`, `apps/`, or any Firebase/Firestore configuration was read or modified.

## 47. Risks

- **Jurisdiction-allocation follow-through risk:** the recommended Option C allocation (§19 general principle + forward reference; Rwanda/Burundi mechanics deferred to a not-yet-drafted Part VIII) depends on a future task actually drafting Part VIII in due course — if that never happens, the accepted Rwanda/Burundi material would remain permanently unimplemented rather than merely deferred. Not a defect of this assessment, but worth flagging for future sequencing.
- **Indemnity scope-creep risk (unchanged from the prior readiness report):** a future §20 drafting task could inadvertently adopt the Legal Opinion's broader "all claims arising from Business's Reward Program or conduct" catch-all on the mistaken assumption that Reconciliation row 10's Class-A acceptance covers it. This report re-confirms, directly against row 10's own text, that it does not.
- **Zero-fee silent-resolution risk (unchanged):** a future §19 drafting task could inadvertently "solve" the zero-fee gap with an invented figure. Must be handled as explicit non-resolution per LEG-FD-15's own text.

## 48. Rollback instructions

If this assessment report needs to be withdrawn: delete `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VI-AUTH-001-assessment-report-2026-09-01.md` and revert the corresponding changes-log entry. No `DEC-SUB-*`, `DEC-ID-005`, CI-01, or CI-05 status was changed, so no register rollback is required.

## 49. Documentation changes-log entry

To be appended as the next entry in `docs/00-governance/documentation-changes-log.md`.

## 50. Commit SHA

Recorded once the commit is created (following this report).

## 51. PR number/state

Recorded once the PR is opened (following this report). Not self-merged.

## 52. Exact Founder next action

No narrow Founder/legal decision is required to proceed to Part VI drafting on the bounded basis this report describes. The Founder's next action, if desired, is a separate authorization to begin drafting §19/§20 clause text on the exact permitted scope in §41 (this report does not itself constitute that authorization) — or, alternatively, to authorize a future Part VIII drafting task first, so the Rwanda/Burundi jurisdiction-specific material has a home to be allocated to when Part VI is eventually drafted. Either sequencing is workable; this report does not recommend one over the other.

---

## FINAL GATE

**§19 Liability: `BOUNDED DRAFTING READY`**

**§20 Indemnity: `BOUNDED DRAFTING READY`**

**Overall: `PART VI DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS`**

No clause text drafted. Part VII and Part VIII not begun.
