# DEC-LEGAL-002-BT-DRAFT-007-CORR-001 — Correction Report: Part VII §25.1/§25.4/§25.5 Boundary Corrections (PR #212 Founder Review)

> **Task:** `DEC-LEGAL-002-BT-DRAFT-007-CORR-001` · **Date:** 2 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction, following Founder review of PR #212
> **Scope:** Docs-only correction of three §25 drafting-boundary findings identified by Founder review of PR #212 (`DEC-LEGAL-002-BT-DRAFT-007`). **No unaffected clause rewritten. No Part VIII drafting. No merge.**

---

## 1. Entry repository state

Branch `docs/dec-legal-002-bt-draft-007` (continuation of the same branch backing PR #212), working tree otherwise clean of tracked changes at task start beyond the pre-existing unrelated untracked files already disclosed in the prior drafting report.

## 2. PR #212 state (entry)

`OPEN`, `MERGEABLE`, 1 commit, confirmed via `gh pr view 212 --json state,headRefOid,mergeable,commits`.

## 3. Entry head SHA

`d361990e13ece4d3edaf475a0c5808aa98bf3df8` — matches exactly, no new unexpected commits since PR #212 was opened.

## 4. CI/review state (entry)

`Build, Lint, Test, Emulator Validation` check pending at task start. One automated review from `chatgpt-codex-connector` (state `COMMENTED`), zero PR comments. Changed-file scope confirmed documentation-only (same five files as the original drafting task): `gh pr diff 212 --name-only`.

## 5. §25.1 defect confirmation

Confirmed genuine. The original §25.1 stated a general Business anti-assignment rule requiring 11thONUS's prior consent, a transfer-of-substantially-all-assets exception with a transferee-assumption condition, and an express 11thONUS assignment right on merger, acquisition, reorganization, or sale. None of these is supported by any authority reviewed for Part VII (LEG-FD-01's fallback standard does not itself supply a specific consent right, an asset-transfer exception, or a merger/acquisition/sale transfer right) — the readiness report's own item 26/27 omission principle required that no §25 provision invent a new substantive Founder/commercial position, and the original wording did exactly that.

## 6. §25.1 corrected approach

Replaced with a narrow reservation: assignment or transfer of these Terms, or of a right or obligation under these Terms, is subject to applicable law and to any separately governed agreement or mechanism that may apply. The section now expressly states it does not itself establish a general assignment/transfer mechanism, a consent requirement, a merger/acquisition/reorganization/sale transfer right, an asset-transfer exception, an affiliate-transfer right, or an automatic successor right.

## 7. Assignment rights removed/reserved

Removed: the general Business anti-assignment rule; the 11thONUS consent right; the asset-transfer exception; the transferee-assumption condition; the express 11thONUS merger/acquisition/reorganization/sale assignment right. All six are now named negatively (not established by this section) rather than affirmatively drafted.

## 8. §25.4 defect confirmation

Confirmed genuine, in part. The original §25.4 correctly protected the earned-reward obligation against extinguishment, but the phrase "does not excuse, reduce, or delay" went beyond the governed earned-reward-survival architecture (FD-2, `DEC-LOY-011`, §§13.1–13.4 and restatements), which requires that a validly earned reward not be extinguished or retrospectively reduced — it does not require, and no authority supports, a universal rule that fulfilment can never be delayed where performance is genuinely impossible or legally prevented. The "delay" prohibition was an invented absolute rule, not itself governed.

## 9. §25.4 corrected wording summary

The general force-majeure principle (first sentence — no liability for failure/delay to the extent genuinely impossible and unavoidable) is unchanged. The earned-reward-protection sentence is corrected from "does not excuse, reduce, or delay" to "does not excuse, or permit the retrospective reduction of," removing the invented no-delay rule. A new sentence is added addressing the genuine-impossibility circumstance directly: the underlying obligation is not extinguished by this section, and this section does not itself create a universal cash-substitute requirement or a universal time extension for that circumstance — treatment is left to applicable law, the applicable Reward Program, and any separately governed remedy or mechanism. The closing non-guarantor sentence is unchanged.

## 10. Earned-reward protection

Preserved and, if anything, restated more precisely: §25.4 continues to state that force majeure does not excuse or retrospectively reduce a reward already validly earned by a customer, cross-referencing §13.1–§13.4/§14.2/§15.4–§15.5/§16.3/§18.5, and continues to exclude financial distress, commercial inconvenience, an ordinary cost increase, ordinary operational difficulty, voluntary cessation of business, an ordinary supply problem, and other broadly defined hardship from the force-majeure concept for this purpose.

## 11. Genuine-impossibility treatment

Where fulfilment of an earned reward, according to its original terms, becomes genuinely impossible or is prevented by applicable law, §25.4 now states: (a) the underlying obligation is not thereby extinguished by this section; (b) this section does not itself create a universal cash-substitute requirement; (c) this section does not itself create a universal time extension; and (d) treatment of that circumstance is left to applicable law, the applicable Reward Program, and any separately governed remedy or mechanism.

## 12. Cash-substitute/non-extinguishment boundary

No cash-substitute rule, no time-extension rule, and no automatic-extinguishment rule is invented anywhere in the corrected §25.4 — each is named as a matter this section does not itself resolve, consistent with the task's own instruction and with Reconciliation Matrix row 5's Classification-B "legally impossible" concept remaining reconciled drafting input, not independently Founder-decided policy.

## 13. §25.5 defect confirmation

Confirmed genuine. The original §25.5 stated that "this §25" survives the end of a Business's participation, which would have made every General Provision (assignment, severability, entire agreement, force majeure, language of the agreement, and survival itself) survive indefinitely merely because of its location in the instrument — a blanket survival rule no authority supports and one that risks creating an indefinite obligation contrary to the readiness report's own item 26/27 omission principle.

## 14. §25.5 corrected survival scope

Corrected to name only the provisions whose nature genuinely requires post-termination operation: (a) an already-earned reward obligation (§13, §16); (b) liability (§19), to the extent arising from an event or claim occurring before or through the end of participation; and (c) indemnity (§20), to the extent arising from a matter covered by §20 occurring before or through the end of participation. The section now expressly states it does not itself state that every provision of §25, or of these Terms generally, survives merely because it appears in this instrument, and does not create a new or indefinite obligation beyond what a surviving provision already states.

## 15. §21 integrity check

Re-read in full; unchanged. Confirmed still aligned with LEG-FD-14 (arbitration sequence/seat/institution/language, §21.3–§21.7) and LEG-FD-16 (Rwanda substantive governing law, §21.1–§21.2), with §21.5's arbitration-mechanics non-resolution and §21.8's Part VIII forward reference intact. No edit made.

## 16. §22/CI-05 integrity check

Re-read in full; unchanged. §22.4 continues to state CI-05's non-resolution covering both the reacceptance-on-change mechanism and the refusal/non-acceptance consequence, with the full prohibited-inventions list intact (no automatic suspension, termination, account blocking, continued full access, grandfathering, restriction to existing activity only, new-business-only effect, grace period, or fixed deadline). No edit made.

## 17. §23 integrity check

Re-read in full; unchanged. Remains a pure cross-reference to the separately governed privacy/data-processing framework, with no substantive privacy content, no data-as-consideration framing, and no privacy-policy document name/version invented. No edit made.

## 18. §24 integrity check

Re-read in full; unchanged. Remains electronic-first and flexible, with §24.2's explicit non-resolution of any fixed deemed-receipt period or mandatory single channel intact, and §24.3's language treatment unchanged. No edit made.

## 19. §25.2/§25.3/§25.6 integrity check

Re-read in full; unchanged. §25.2 (severability) remains a neutral, standard functional-form clause subject to mandatory law. §25.3 (entire agreement) continues to state expressly that it does not displace the Customer Terms / Platform Terms of Use instrument, a Business's own Reward Program Rules, or an applicable jurisdictional overlay, per LEG-FD-10. §25.6 (language of the agreement) continues to leave the English/French version-conflict question an open reservation, not decided. No edit made to any of the three.

## 20. Parts I–VI substantive-diff verification

`git diff` of this correction confirms the only changed lines in the core instrument file are within §25.1, §25.4, and §25.5. No Part I §§1–7, Part II §§8–10, Part III §§11–14, Part IV §§15–17, Part V §18, or Part VI §§19–20 clause body text was touched — verified by direct diff (`git diff HEAD -- <core instrument file> | grep '^-' | grep -v '^---'` returns exactly three removed lines, corresponding to the three corrected subsections).

## 21. Part VIII undrafted verification

Confirmed: no clause text was added or altered under §26/§27 (Part VIII). The "End of Part VII" boundary text is unchanged by this correction.

## 22. CI-01/CI-05 state

Unchanged. CI-01 (operator legal identity) and CI-05 (reacceptance-on-Terms-change engineering implementation decision) remain the only two open Controlled Inputs. Neither is touched by this correction.

## 23. New CI assessment

None warranted. All three corrections are narrowing corrections — they remove invented content or add explicit non-resolution language — not new open questions requiring Founder or legal action. See the updated Controlled Inputs Register's "Part VII PR-review correction pass" section for the item-by-item confirmation.

## 24. DEC-LEGAL-002 state

`OPEN_LEGAL`, unchanged.

## 25. Terms configuration state

`NOT CONFIGURED` (`platformConfig/businessTerms`), unchanged.

## 26. Capability 3 state

Open — engineering work packages complete; blocked on governed Terms-content configuration (`CDR-001` §5), unchanged.

## 27. Files modified

1. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` — §25.1, §25.4, §25.5 corrected in place (v7.0 → v7.1); no other clause text touched.
2. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` — §25.1/§25.4/§25.5 rows updated; Part VII correction-pass note added (v7.0 → v7.1).
3. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` — Part VII PR-review correction-pass section added (no register change; v7.0 → v7.1).
4. `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-007-CORR-001-correction-report-2026-09-02.md` — this file (new).
5. `docs/00-governance/documentation-changes-log.md` — Entry 141 added.

No other file touched. No `DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md` change (historical evidence, left unedited). No Decision Register change. No Founder Legal Architecture Disposition Record change. No `DEC-LEGAL-002-BT-DRAFT-007-drafting-report-2026-09-02.md` change (left as the historical record of the original v7.0 drafting pass).

## 28. Diff summary

Core instrument file: three subsections corrected in place (§25.1, §25.4, §25.5); document-header/version-metadata updated to v7.1. Traceability Matrix: three rows updated; one new correction-pass paragraph added. Controlled Inputs Register: one new "Part VII PR-review correction pass" section added (no register change). Two new files created (this report; changes-log entry).

## 29. Commands executed

`git fetch origin`; `gh pr view 212 --json state,headRefOid,mergeable,commits`; `gh pr checks 212`; `gh pr view 212 --json reviews,comments`; `gh pr diff 212 --name-only`; `git status`; `git log -1`; direct file edits (`Edit`) to the core instrument and the two companion documents; `git diff` verification of the exact changed-line scope.

## 30. Dependencies/config changes

None.

## 31. Application/source changes

NONE.

## 32. CI result

Pending at time of this report — to be confirmed once the corrected commit is pushed and CI completes.

## 33. Automated review findings

To be assessed once the corrected commit is pushed and the automated (Codex) review runs on it. Any finding will be evaluated against governed authority (LEG-FD-01–16, FD-2, `DEC-LOY-011`, the readiness report) before being applied; a suggestion that conflicts with governed authority will not be applied automatically.

## 34. Risks

If a future correction treats §25.1's narrow reservation as itself creating an assignment right (rather than reserving the point), it would reintroduce the original defect. If a future correction re-reads §25.4's genuine-impossibility treatment as authorizing an indefinite delay without any eventual remedy, it would understate the earned-reward-obligation protection this section preserves — the obligation itself is never extinguished by this section, only its timing/mechanics are left open for the genuinely-impossible case. If a future correction extends §25.5's survival list beyond earned-reward obligations, liability for pre-termination matters, and indemnity for covered pre-termination matters, without a specific authority basis, it would reintroduce a blanket-survival risk.

## 35. Rollback instructions

Revert this correction's commit; the four files listed at §27 (excluding the drafting report, which is unmodified) are the only ones touched by this correction, so rollback is a single-commit revert that restores the v7.0 wording.

## 36. Changes-log update

Entry 141, `docs/00-governance/documentation-changes-log.md`.

## 37. Commit SHA

Recorded in the completion message after commit.

## 38. PR #212 state (exit)

Remains `OPEN`; this correction is pushed as a new commit onto the same branch/PR. Not self-merged.

## 39. Exact Founder next action

Review the corrected §25.1/§25.4/§25.5 wording against this report and the updated Traceability Matrix/Controlled Inputs Register; confirm §21/§22/§23/§24/§25.2/§25.3/§25.6 remain unaffected (verifiable via the §15–19 integrity checks above and direct diff); allow the automated Codex review to complete on the corrected commit; if satisfied, approve Part VII (as corrected) as a controlled drafting baseline. Do not merge without Founder approval.

---

## FINAL GATE

`PART VII §§21–25 CORRECTED WITHIN APPROVED AUTHORITY — READY FOR FOUNDER REVIEW`
