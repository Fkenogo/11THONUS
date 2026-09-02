> **Title:** DEC-LEGAL-002-BT-DRAFT-006 — Core Business Terms Part VI (§19 Liability, §20 Indemnity) Drafting Report
> **Version:** 1.0 · **Status:** DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-006-drafting-report-2026-09-02.md`
> **Date:** 2026-09-02 · **Task:** `DEC-LEGAL-002-BT-DRAFT-006`

---

## 1. Entry repository state

Working tree started on branch `docs/dec-legal-002-bt-part-vi-auth-001`, then moved to a fresh branch `docs/dec-legal-002-bt-draft-006` created from `origin/main`. The same pre-existing untracked files noted in every prior task in this series (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`/`docs/01-product`/`docs/05-implementation/reports`/`docs/06-engineering-governance`/`docs/30-go-to-market` files, `docs/07-product-design.zip`) were present and left untouched. No incomplete git operation existed. `git status` was clean apart from these pre-existing untracked files.

## 2. Base SHA

`origin/main` at task start: `af1db33641154e2caf3ade244aa19fd2cc8b63ba` (PR #209 merge commit).

## 3. PR #209 merge verification

`git rev-parse origin/main` and `git log -1 --format="%H %s" af1db33` both confirmed `af1db33641154e2caf3ade244aa19fd2cc8b63ba` as the current tip of `origin/main`, subject "Merge pull request #209 from Fkenogo/docs/dec-legal-002-bt-part-vi-auth-001." This SHA is contained in current `main` by construction (it *is* the tip).

## 4. New branch

`docs/dec-legal-002-bt-draft-006`, created fresh from `origin/main` at `af1db336`.

## 5. Authorities inspected

- `DEC-LEGAL-002-BT-PART-VI-AUTH-001-assessment-report-2026-09-01.md` (merged, PR #209) — read in full. This is the primary governing authority for this task: it already re-verified LEG-FD-15, LEG-FD-10, LEG-FD-14, Reconciliation Matrix rows 9–11/20, and the external Legal Opinion §§9–11 directly, and its own §41/§42 state the exact permitted drafting scope and exact prohibited content for §19/§20. This task drafts within that scope rather than re-deriving it from primary sources a second time, consistent with the governing task instruction to treat the merged assessment as the controlling authority-confirmation baseline.
- Current Core Business Terms instrument (v5.0, post-Part-V-merge) — Part 0 §§0.0/0.1/0.2, the Part V trailer and Status Reaffirmation block, and §9.6's forward reference to Part VI §19, read directly to confirm Part VI remained undrafted (no `19.x`/`20.x` clause text existed anywhere) before this task began.
- Current Drafting Traceability Matrix and Controlled Inputs Register (v5.0) — confirmed CI-01/CI-05 remain the only two open items and neither concerns §19/§20.
- Current Decision Register — confirmed `DEC-LEGAL-002` `OPEN_LEGAL`, `DEC-ID-005` `OPEN_FOUNDER`, all `DEC-SUB-*` unchanged; none is implicated by §19/§20 subject matter.

No application/backend/Firebase/configuration file was read or modified for this task.

## 6. Drafting strategy

Draft §19 and §20 full clause text strictly within the exact permitted scope the merged `DEC-LEGAL-002-BT-PART-VI-AUTH-001-assessment-report-2026-09-01.md` states at its §41, and strictly avoid every item its §42 lists as prohibited. Both sections are drafted as concise, durable clauses (matching the drafting register's own preference, already established at Part V, for minimal durable drafting over maximum illustrative coverage) — stating the governed core content, applying the two mandatory explicit non-resolutions (§19.2 zero-fee; §20's procedural-mechanics gaps, recorded together at §20.3), and cross-referencing rather than restating adjacent Parts (§11/§13 for reward obligations; §6.3/§0.0 for the customer boundary; §26/Part VIII for jurisdiction-specific mechanics). No primary source beyond the merged assessment report and the existing instrument was re-read to derive new content — the assessment report's own §7 already confirms it re-verified every primary source directly; re-deriving the same conclusions a second time in this task would not change the outcome and risks introducing an inconsistency with the merged authority-confirmation record.

## 7. Exact governing authorities

LEG-FD-15 (Liability Architecture); LEG-FD-10 (Customer Terms Architecture); Reconciliation Matrix rows 9–11 (Platform Liability Limits; Business Liability & Indemnity; Limitation/Exclusion Provisions); `DEC-LEGAL-002-BT-PART-VI-AUTH-001-assessment-report-2026-09-01.md` (merged, PR #209 — controlling authority-confirmation baseline for this task); external Legal Opinion §§9–11, accepted/qualified only through the above reconciled authority. Parts I–V of the Core Business Terms instrument (cross-referenced, not redrafted).

## 8. Explicit non-resolutions identified before drafting

(a) Zero-fee-Business liability cap treatment (§19.1's formula, applied to a Business that paid no fees) — LEG-FD-15 itself authorizes proceeding via explicit non-resolution; not a Founder/legal decision blocker. (b) Rwanda notice-and-takedown and Burundi ARCT liability mechanics — accepted as Class-C drafting input but properly deferred to a not-yet-drafted Part VIII; only the portable general principle and a forward reference are drafted in §19. (c) Six indemnity procedural/scope mechanics (defence control, duty to defend, settlement consent, legal-cost allocation, the negligence/wilful-misconduct carve-out, third-party-claim scope) — each Classification D, independently omittable.

## 9. Prohibited drafting expansions identified before drafting

No `$25`/nominal customer or zero-fee-Business cap; no minimum-subscription-fee or lowest-plan proxy; no damages category beyond indirect/consequential/punitive/special; no exhaustive global non-excludable-liability list; no customer-facing liability principle stated affirmatively in §19; no Rwanda/Burundi procedural mechanics drafted directly into §19 or anywhere else (Part VIII remains undrafted); no indemnity extension to general Terms breach, unlawful conduct generally, or Business-content/data generally; no indemnity procedural mechanic (defence control, duty to defend, settlement consent, cost allocation, negligence/wilful-misconduct carve-out, third-party-claims definition) presented as governed/settled; no `DEC-SUB-*`/`DEC-ID-005` resolution; no Part VII or Part VIII clause text.

## 10. §19 clause structure

Six subsections: §19.1 (cap formula, verbatim); §19.2 (zero-fee explicit non-resolution); §19.3 (four-category damages exclusion); §19.4 (mandatory-law/non-excludable-liability principle plus Part VIII forward reference); §19.5 (Business reward-obligation boundary — cross-referencing §11/§13); §19.6 (narrow negative customer-liability reservation).

## 11. Exact liability-cap treatment

§19.1 reproduces LEG-FD-15's cap-formula sentence exactly, word-for-word, with no substitution of "fees payable," "fees invoiced," "plan price," "annualized fee," "lowest available plan," or "expected fees," and with the aggregate/direct-contractual/by-that-Business/to-11thONUS/12-month-lookback/event-giving-rise-to-the-claim elements all preserved unmodified.

## 12. Zero-fee explicit non-resolution

§19.2 states, without inventing a nominal/minimum/substitute figure, that the treatment of a zero-fee Business under §19.1 is not resolved by this section and is left to final legal drafting and/or future commercial governance — mirroring LEG-FD-15's own two named paths. This is a mandatory Founder direction for the initial draft (governing task §3.2), not a drafting-judgment choice; no CI was created for it (§35 of the merged assessment report already forecloses that, and this task's own Controlled Inputs Register review, §18–19, reaffirms it directly).

## 13. Damages-exclusion treatment

§19.3 states exactly the four governed categories — indirect, consequential, punitive, special — each qualified "to the maximum extent permitted by applicable law." No incidental, exemplary, loss-of-profit, loss-of-revenue, loss-of-goodwill, loss-of-opportunity, business-interruption, data-loss, or reputational-loss category was added.

## 14. Mandatory-law boundary

§19.4 states the single portable governed principle (no exclusion overrides a liability applicable law does not permit the parties to exclude or limit) and forward-references the not-yet-drafted Part VIII jurisdictional-overlay mechanism for jurisdiction-specific mandatory requirements, without drafting Rwanda notice-and-takedown or Burundi ARCT mechanics directly, and without creating an exhaustive global list of non-excludable-liability categories.

## 15. Business reward-obligation boundary

§19.5 cross-references §11 and §13 (Part III) rather than redrafting them, confirming that 11thONUS's own liability under §19 does not convert a Business's reward-fulfilment obligations into 11thONUS obligations, and that nothing in §19 excludes 11thONUS's own non-excludable liability for its own conduct.

## 16. Customer-liability treatment

§19.6 is a narrow negative reservation only — it states that §19 does not address 11thONUS's liability to customers, reserved to the future Customer Terms / Platform Terms of Use instrument — matching the merged assessment report's recommendation (§16) over a fuller affirmative cross-reference or bare silence, and precisely tracking the same technique already used at §17.4/§6.3/§3.2(c). No `$25` figure, no "maximum extent permitted by applicable law" customer-facing principle, and no other customer-facing content was stated.

## 17. Jurisdictional deferral

§19.4's forward reference is the only jurisdiction-specific content in §19; no Rwanda-specific or Burundi-specific mechanics are drafted anywhere in this task. Part VII/VIII remain untouched.

## 18. §20 clause structure

Three subsections: §20.1 (the four-subject indemnity principle, with indemnitee and covered-harm scope stated as conservative drafting judgment); §20.2 (confirms no general-breach/unlawful-conduct/content-data extension); §20.3 (explicit non-resolution of six procedural/scope mechanics).

## 19. Four indemnity subjects

Verified verbatim against Reconciliation row 10 and external Legal Opinion §10 (lines 138–141): (a) failure to fulfil Reward Program/reward obligations; (b) defective, illegal, or harmful goods or services; (c) false advertising or misrepresentation; (d) tax non-compliance. §20.1(a)–(d) state exactly these four, in the same order the merged assessment report uses, with no broadening.

## 20. Prohibited indemnity expansions check

§20.2 expressly states the indemnity does not extend to general Terms breach, unlawful conduct generally, or Business-provided content/data generally, and that the Business's own general compliance responsibility under §5.3/§10/§11 does not itself expand the four-subject indemnity. A `grep` search (§34 below) confirms no such expansion appears anywhere in the drafted text.

## 21. Indemnitee scope chosen

11thONUS alone — the conservative default the governing task's §5 instructs, and Classification B per the merged assessment report's §22 (permitted legal-drafting judgment, not independently governed). Affiliates, shareholders, directors, officers, employees, contractors, licensors, agents, successors, and assigns were considered and deliberately not added: direct source review found no authority requiring their inclusion for §20 to operate coherently, and the four governed subjects (reward-fulfilment failure, defective/illegal/harmful goods, false advertising, tax non-compliance) are all matters where the claim or liability would ordinarily run to 11thONUS directly rather than to a separately identified affiliate/officer/employee class. A future task may add a narrowly defined additional indemnitee without contradicting any authority, but none was found necessary here.

## 22. Covered-harm scope chosen

"Claims, losses, and liabilities" — narrower than the external Legal Opinion's own fuller proposed formulation ("claims, losses, liabilities, or regulatory fines") and far narrower than an unlimited "all losses, liabilities, damages, penalties, fines, costs, expenses and claims of every kind whatsoever" formulation. This three-term formulation was chosen because it is the minimum necessary to make all four governed subjects meaningful: "claims" covers customer-originated exposure (reward-fulfilment failure, defective/illegal/harmful goods, false advertising); "losses" and "liabilities" cover exposure not framed as a third-party claim, including a liability or fine 11thONUS could face directly as a result of a Business's tax non-compliance. "Regulatory fines" and a broader "of every kind whatsoever" catch-all were considered and omitted as unnecessary to the four subjects' coherence and as exceeding the conservative-exercise instruction in the governing task's §6.

## 23. Defence-control treatment

Not addressed. Classification D (merged assessment report §26) — omitted per §20.3, consistent with the governing task's instruction not to assign control of defence.

## 24. Duty-to-defend treatment

Not addressed. Classification D (§27) — omitted per §20.3, consistent with the instruction not to create an affirmative duty to defend.

## 25. Settlement-consent treatment

Not addressed. Classification D (§28) — omitted per §20.3, consistent with the instruction not to specify who may settle or on what consent standard.

## 26. Legal-cost treatment

Not addressed. Classification D (§29, cross-referencing LEG-FD-14's structurally analogous arbitration-cost non-resolution) — omitted per §20.3, consistent with the instruction not to allocate lawyers' fees or costs.

## 27. Negligence/wilful-misconduct treatment

Not addressed. Classification D (§32) — omitted per §20.3, consistent with the instruction not to create a negligence/wilful-misconduct carve-out.

## 28. Third-party-claim treatment

Not addressed. Classification D (§33) — omitted per §20.3, consistent with the instruction not to state that indemnity is exclusively or necessarily limited to third-party claims, or to invent a definition.

## 29. Claim-notice treatment

Classification B (§30) — permitted ordinary drafting judgment, considered and deliberately omitted. §20 is coherent and complete without it; adding a notice-of-claim procedural sentence was not found to materially improve the clause's coherence, consistent with the minimal-durable-drafting preference already established at Part V.

## 30. Cooperation-duty treatment

Classification B (§31) — same treatment and same rationale as claim notice: considered, not required for coherence, deliberately omitted.

## 31. Parts I–V integrity verification

`git diff` of the Core Business Terms draft confirms every edit to Part I (§§1–7), Part II (§§8–10), Part III (§§11–14), Part IV (§§15–17), and Part V (§18) clause bodies is limited to: the document header/version metadata; the DRAFT-status banner's Part list; the "How to read this document" list; Part 0 §§0.0/0.1/0.2 (the Instrument Map status cell, the Part VI architecture-list label, and readiness-table row 14); the Part I/III/IV/V heading notes; §9.6's single-sentence forward-reference correction (from "not drafted in this task" to a direct cross-reference, since Part VI §19 is now drafted); and the Status Reaffirmation section. No substantive clause text in §§1–18 was altered — confirmed by direct review of the diff, which touches only the lines listed above.

## 32. Part VII untouched verification

`grep` for `^21\.`, `^22\.`, `^23\.`, `^24\.`, `^25\.` against numbered clause text (as distinct from the existing Part 0 architecture-list entries and forward-reference mentions, both pre-existing and unchanged in substance) found no new Part VII clause text. The Part VII heading and its architecture-list entries remain exactly as they were before this task.

## 33. Part VIII untouched verification

`grep` for `^26\.`, `^27\.` against numbered clause text found no new Part VIII clause text. The Part VIII heading, its "architecture only — not drafted" status, and its architecture-list entries remain exactly as they were before this task. §19.4's forward reference to Part VIII does not draft any part of §26.

## 34. Prohibited-concept search

A `grep -i` search across the modified Core Business Terms draft for: `$25`; incidental; exemplary; loss of profit; loss of revenue; loss of goodwill; loss of opportunity; business interruption; data loss; reputational; duty to defend; defence control; defense control; settlement consent; wilful misconduct; willful misconduct; third-party claim; KIAC; Rwanda; Burundi; ARCT; notice-and-takedown — found: (a) no hits for `$25`, incidental, exemplary, any "loss of X" category, business interruption, data loss, or reputational; (b) "duty to defend," "wilful misconduct," and "third-party claim" appear only inside §20.3's own negation clause, which expressly states these matters are not addressed; (c) "Rwanda" and "Burundi" appear only in the pre-existing Part 0 Instrument Map/architecture list (unchanged by this task) and in the Status Reaffirmation banner's one-line cross-reference to the Part VIII deferral — not as drafted Part VI clause text; (d) no hits for KIAC, ARCT, or notice-and-takedown. No prohibited concept was found asserted as operative clause text anywhere in §19 or §20.

## 35. Manual review result

Full clause-by-clause self-review performed against the merged assessment report's §41 (permitted scope) and §42 (prohibited content), item by item — see §§10–30 above. Every drafted clause traces to a named governing authority; no clause states a prohibited concept; both mandatory/expected non-resolutions (§19.2, §20.3) are present in the clause text itself rather than left to bare silence, consistent with this instrument's established drafting discipline.

## 36. Automated review result

Not yet run — this report is filed alongside the PR for automated (Codex) review, following the same process Parts II–V used. Findings, if any, will be corrected in place and recorded in a subsequent update to this report and the traceability/register documents, following the established PR-review-correction-pass pattern.

## 37. Review-thread inventory/state

Not applicable at time of this report's initial filing — no PR review has yet occurred. To be updated once review completes.

## 38. DEC-LEGAL-002 state

Unchanged: `OPEN_LEGAL`.

## 39. Terms configuration state

Unchanged: `NOT CONFIGURED`.

## 40. Capability 3 state

Unchanged: Open — engineering work packages complete; blocked on governed Terms-content configuration.

## 41. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v5.0 → v6.0, Part VI/§§19–20 added; administrative scope-label corrections only elsewhere, see §31).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (v5.0 → v6.0, Part VI clause table and self-review note added).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v5.0 → v6.0, Part VI review section added; no register change — CI-01/CI-05 unaffected).
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-006-drafting-report-2026-09-02.md` (this file — created).
- `docs/00-governance/documentation-changes-log.md` (entry to be appended).

No other file modified. Parts I–V of the Core Business Terms instrument, the Decision Register, and all application/source/config files left untouched beyond the administrative scope-label corrections in §31.

## 42. Diff summary

Core Business Terms draft: +68/-25 lines net (header/metadata additions, new Part VI section with six §19 subsections and three §20 subsections, updated status labels). Traceability Matrix: +26/-4 lines net (new Part VI clause table, ten rows, plus a self-review paragraph). Controlled Inputs Register: +23/-4 lines net (new Part VI review section and prohibited-concept-discipline paragraph; no register-table change).

## 43. Commands executed

Read-only git inspection (`git fetch`, `git status`, `git log`, `git rev-parse`, `git diff --stat`), `git checkout -b` (branch creation), `grep`/`sed` (repeated, for direct-source reading, stale-reference location, and the prohibited-concept search). File edits via the editing tool only. No mutating command beyond branch creation and the file edits themselves.

## 44. Dependencies added

None.

## 45. Config changes

None.

## 46. Application/source changes

**NONE.** No file under `functions/`, `apps/`, or any Firebase/Firestore configuration was read or modified.

## 47. CI/check results

Not yet run — PR to be opened following this report; CI status (if any pipeline runs on documentation-only PRs in this repository) to be recorded once observed.

## 48. Risks

- **Zero-fee silent-resolution risk (unchanged from the authority-confirmation report):** a future correction or configuration pass could inadvertently "solve" the §19.2 gap with an invented figure. Must continue to be handled as explicit non-resolution.
- **Indemnity scope-creep risk (unchanged):** a future task could inadvertently broaden §20.1's indemnitee or covered-harm scope, or §20.2's four-subject boundary, on a mistaken reading of Reconciliation row 10. This report and the traceability matrix both state the boundary explicitly to guard against that.
- **Part VIII sequencing risk (unchanged from the authority-confirmation report):** §19.4's forward reference depends on a future task actually drafting Part VIII; if that never happens, the accepted Rwanda/Burundi material remains permanently deferred rather than merely deferred in the interim.

## 49. Rollback instructions

If this draft needs to be withdrawn: revert the four modified/created files to their pre-task state (`git checkout af1db336 -- <path>` for the three evidence-register files, or `git rm` for the newly created drafting report), and revert the corresponding changes-log entry. No `DEC-SUB-*`, `DEC-ID-005`, CI-01, or CI-05 status was changed, so no Decision Register or Controlled Inputs Register rollback is required beyond the file reverts themselves.

## 50. Drafting report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-006-drafting-report-2026-09-02.md` (this file).

## 51. Documentation changes-log entry

To be appended as the next entry in `docs/00-governance/documentation-changes-log.md`.

## 52. Commit SHA

Recorded once the commit is created (following this report).

## 53. PR number/state

Recorded once the PR is opened (following this report). Not self-merged.

## 54. Exact Founder next action

Review the drafted §19 (Liability) and §20 (Indemnity) clause text on the PR for `DEC-LEGAL-002-BT-DRAFT-006`. This task does not itself constitute Founder approval. If approved, the next drafting task in sequence would be Part VII (§§21–25, Legal Mechanics) or Part VIII (§§26–27, Jurisdictional Overlays) — either sequencing remains workable and this report does not recommend one over the other, consistent with the merged authority-confirmation report's own §52.

---

## FINAL GATE

**`CORE BUSINESS TERMS PART VI §§19–20 DRAFTED — LIABILITY/INDEMNITY BOUNDARIES PRESERVED — AWAITING FOUNDER REVIEW`**

Not merged. Part VII and Part VIII not begun.
