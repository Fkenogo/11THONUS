> **Title:** DEC-LEGAL-002-BT-DRAFT-004-CORR-001 — Core Business Terms Part IV PR-Review Correction Report (Termination Process and Required Run-off)
> **Version:** 1.0 · **Status:** DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-004-CORR-001-correction-report-2026-08-31.md`
> **Date:** 2026-08-31 · **Task:** `DEC-LEGAL-002-BT-DRAFT-004-CORR-001`

# ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED

This report documents two PR-review corrections to Core Business Terms Part IV (§16.2, §16.4). It does not authorize Terms configuration, does not close `DEC-LEGAL-002`, and does not change Capability 3 status.

---

## 1. Entry state

`git status` at task start showed the working tree on `docs/dec-legal-002-bt-draft-004` with the same pre-existing untracked files as prior tasks, left untouched. No incomplete git operation. `origin/main` confirmed unchanged at `b2f798d20d2ffa0be195d3db33cd822c7396026a` (PR #205 merge).

## 2. Starting PR head

`46f061c1564b4eb0899ba3f12d8b8a90cde52651` — confirmed via `gh pr view 206 --json headRefOid` to match exactly.

## 3. CI result

`Build, Lint, Test, Emulator Validation` — **SUCCESS** (6m40s), confirmed via `gh pr checks 206` before editing.

## 4. Review-thread inventory

Exactly two unresolved review comments on PR #206, both from the automated reviewer, both P2, both on `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`:

- **Comment `3894680148` (line 385, §16.2):** "Do not extend emergency suspension into immediate termination" — the urgent-suspension exception (LEG-FD-06, suspension only) was imported into termination with no governed basis; the reconciled Legal Opinion describes termination as "after fair process."
- **Comment `3894680137` (line 389, §16.4):** "Require the governed run-off when fulfilment needs it" — LEG-FD-07 states a run-off arrangement **must** be provided where necessary; the original "may be appropriate" wording understated that mandatory condition.

`gh api repos/Fkenogo/11THONUS/issues/206/comments` confirmed zero general PR comments; `gh api repos/Fkenogo/11THONUS/pulls/206/reviews` confirmed exactly one review. No additional finding was present.

## 5. Correction strategy

Communicated to the user before editing: correct §16.2 so 11thONUS's immediate-suspension authority under §15 (available for urgent fraud/security/integrity/legal reasons) is expressly distinguished from — and does not by itself authorize — immediate termination; termination instead follows a separately-assessed "fair and appropriate process," adopting the reconciled External Legal Opinion §18 Reinstatement/Termination table's "after fair process" language without inventing a formal appeals/hearing mechanism or a fixed period. Correct §16.4 so a run-off arrangement is mandatory ("must be provided") where genuinely necessary, per LEG-FD-07's own text, while preserving full flexibility over duration/mechanics and the existing no-60-day/no-cash-settlement protections untouched. Both corrections use only authority already reviewed and cited in the original Part IV drafting task — no new authority source was required.

## 6. LEG-FD-06/termination authority assessment

Re-read `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` lines 76–98 directly. LEG-FD-06's "portable rule" (line 82) is scoped explicitly to "suspension": "Immediate suspension may occur where reasonably necessary for fraud, security, integrity, participant protection, legal/regulatory requirements, or comparable urgent circumstances." Nothing in LEG-FD-06 extends that immediate, no-prior-notice authority to permanent termination — LEG-FD-07 (business exit/run-off, the adjacent disposition) does not authorize immediate termination either; it governs the treatment of outstanding rewards on exit, not the termination decision itself. The original §16.2 wording's "subject to the same ordinary/immediate distinction, described in §15... immediate termination may occur without prior notice" was therefore an unsupported extension.

## 7. §16.2 correction

Re-read the reconciled External Legal Opinion body (`DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md` lines 403–408, §18 "Reinstatement/Termination" table): "**Termination** | After fair process; outstanding rewards remain Business obligation." This is the only governed authority on termination process specifically, and it does not describe an emergency/no-notice termination path. §16.2 was rewritten to: (a) state 11thONUS may terminate for "sufficiently serious reasons" of the §15.1 kind, including material/repeated breach; (b) state ordinary termination follows "a fair and appropriate process," with no fixed notice/cure period, no formal appeals/hearing process, and no evidence threshold invented; (c) state that where urgent protection is reasonably necessary, 11thONUS may immediately suspend/restrict under §15 *while it assesses whether termination is warranted* — and that this immediate-suspension authority does **not**, by itself, authorize immediate termination without a fair and appropriate process; (d) retain the existing notice-of-reason-as-soon-as-reasonably-practicable standard and the no-automatic-termination-for-every-breach/no-exhaustive-grounds-catalogue disclaimers.

## 8. Final urgent-suspension vs termination boundary

Confirmed by direct text inspection: §16.2 now states urgent suspension "does not, by itself, authorize immediate termination without a fair and appropriate process" — an explicit, unambiguous boundary statement. §15 (unedited) remains the sole source of immediate, no-prior-notice authority, and that authority is scoped to suspension/restriction of participation, not to ending it.

## 9. LEG-FD-07 authority assessment

Re-read lines 90–98 of the same disposition record. LEG-FD-07's "Portable rule" states: "A reasonable transition/run-off arrangement **must** be provided where necessary to enable fulfilment" — a mandatory condition, with only "the exact duration and mechanics" left open ("Appropriate treatment may depend on the applicable Reward Program, the nature of the reward, previously disclosed validity/expiry terms, Business circumstances, applicable law, and practical fulfilment mechanisms. No universal period is invented by this disposition."). The original §16.4 wording — "a reasonable transition or run-off arrangement **may be appropriate**" — converted this mandatory condition into a discretionary one, understating the governed authority.

## 10. §16.4 correction

§16.4 was rewritten to open with "Where a reasonable transition or run-off arrangement is necessary to enable fulfilment of a reward validly earned before exit or termination, such an arrangement **must be provided**." The same non-exhaustive factor list (Reward Program, reward nature, previously disclosed terms, Business circumstances, applicable law, practical fulfilment mechanisms) is retained verbatim, now framed as shaping "the exact duration and mechanics," which "remain flexible and are governed separately." The existing no-fixed-period/no-universal-60-day-period sentence is retained, and expanded to state explicitly that this section "does not... create a mandatory cash-settlement or refund requirement." A new final sentence cross-references §16.3: "11thONUS does not become the funder or guarantor of that arrangement."

## 11. Final run-off obligation

§16.4 now states the obligation is mandatory where genuinely necessary ("must be provided"), not merely discretionary ("may be appropriate") — matching LEG-FD-07's own text exactly, with the necessity threshold ("necessary to enable fulfilment") doing the work of preventing the obligation from applying to every exit/termination regardless of whether run-off is actually needed.

## 12. Fixed-period treatment

Unchanged and reconfirmed: no fixed transition/run-off period, and specifically no universal 60-day period, is created by §16.4. No fixed notice/cure period is created by the corrected §16.2. `grep` confirmed the sole "60-day" occurrence in Part IV is inside §16.4's own negation clause.

## 13. Cash/refund treatment

Unchanged in substance (§16.5, unedited) and reconfirmed additionally within §16.4's own text: no mandatory cash-settlement or refund requirement is created by the run-off obligation; 11thONUS does not become the funder or guarantor of any run-off arrangement (§16.4's new final sentence, cross-referencing the unedited §16.3).

## 14. §15 integrity

§15.1–§15.7 re-read against FD-4, LEG-FD-06, `DEC-LOY-011`, and `DEC-ID-005` — confirmed byte-for-byte unedited by direct diff. No contradiction was found requiring correction; the non-exhaustive grounds catalogue, the ordinary/immediate distinction, the commercial-suspension carve-out, and the `DEC-ID-005` non-resolution boundary all remain exactly as drafted.

## 15. §16 remaining-clause integrity

§16.1, §16.3, §16.5, §16.6, §16.7, §16.8 re-read against FD-3, LEG-FD-07, LEG-FD-08, `DEC-LOY-005`, and `DEC-ID-005` — confirmed byte-for-byte unedited by direct diff. Only §16.2 and §16.4 were corrected.

## 16. §17 integrity

§17.1–§17.6 re-read against LEG-FD-11, LEG-FD-12, and LEG-FD-14 — confirmed byte-for-byte unedited by direct diff. The complaint-facilitation/non-adjudication boundary and the §21 arbitration cross-reference remain exactly as drafted.

## 17. DEC-ID-005 status

Unchanged: **OPEN_FOUNDER**. Not touched or implicated by either correction.

## 18. DEC-LOY-005 status

Unchanged: **CONFIRMED**. Not touched or implicated by either correction.

## 19. DEC-LOY-011 status

Unchanged: **CONFIRMED**. Not touched or implicated by either correction.

## 20. Controlled Inputs status

CI-01 and CI-05 remain the only two open controlled inputs. No new controlled input created by either correction — both corrections apply already-governed LEG-FD-06/LEG-FD-07 authority the original drafting pass misapplied (§16.2) or understated (§16.4); neither correction required a new Founder or legal position.

## 21. Traceability update

Traceability Matrix rows for §16.2 and §16.4 rewritten to cite the corrected clause purpose, the LEG-FD-06/LEG-FD-07/FD-4 authority basis (with LEG-FD-06 now correctly scoped to suspension only for §16.2), and the reconciled External Legal Opinion §18 table. A new "Part IV PR-review correction pass" paragraph added to the Part IV self-review section, and a new "Part IV PR-review correction pass" section added to the Controlled Inputs Register documenting why neither correction created a new controlled input.

## 22. Review-thread replies/resolutions

After pushing the correcting commit, both threads were replied to quoting the corrected clause text and citing the correcting commit SHA, then verified (by re-reading the live file content, not just the reply) that the underlying issue described in each comment is actually absent from the current text, and then marked resolved via the GitHub API.

## 23. New review findings, if any

None identified during this correction pass beyond the two addressed. A fresh automated-review pass was requested on the correcting commit; see §24 for its result as of this report.

## 24. CI/check result after correction

See the in-chat completion report for the exact post-correction CI result and any new review findings, captured after the correcting commit was pushed.

## 25. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v4.0 → v4.1 — §16.2/§16.4 corrected; header/version metadata updated)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (v4.0 → v4.1 — §16.2/§16.4 rows corrected; correction-pass note added)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v4.0 → v4.1 — correction-pass section added; no register-table change)
- `docs/00-governance/decisions/decision-register.md` (`Last controlled update` field updated — no `Status:` field changed)
- `docs/00-governance/documentation-changes-log.md` (new Entry 132 appended)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-004-CORR-001-correction-report-2026-08-31.md` (new — this report)

## 26. Diff summary

Two clauses (§16.2, §16.4) corrected in place, plus header/version metadata; one traceability matrix gains two corrected rows plus a self-review paragraph; one controlled-inputs register gains a correction-pass section with zero rows added to its open-inputs table; one decision-register entry gains a header narrative, zero `Status:` field changed; one changes-log gains one new dated entry; one new correction-report file created. No Part I, Part II, Part III, or Part IV clause other than §16.2/§16.4 changed.

## 27. Commands executed

Read-only: `gh pr view 206`, `gh pr checks 206`, `git fetch origin`, `git log`, `git status`, `gh api repos/.../pulls/206/comments`, `gh api repos/.../issues/206/comments`, `gh api repos/.../pulls/206/reviews`, `Read` of the founder-legal-architecture-dispositions and external-legal-opinion-body evidence files. Mutating: file edits via the Edit tool listed in §25; `grep`-based verification passes. See the in-chat completion report for the commit/push/reply/resolve commands executed after this report was drafted.

## 28. Dependencies/config changes

None.

## 29. Application/source changes

**NONE.**

## 30. Risks

- The corrected §16.2 "fair and appropriate process" standard is deliberately non-numeric, per LEG-FD-01/LEG-FD-06's fallback-standard architecture; a future jurisdictional overlay may need to specify a concrete process for a given jurisdiction's mandatory law — not addressed by this correction, consistent with the governing task's do-not-invent-fixed-periods instruction.
- As with the original Part IV drafting task, this correction should be expected to receive its own review pass; if a new finding appears, Founder-ready status should not be declared until it is resolved (per the governing task's §6 instruction).

## 31. Rollback instructions

Both corrections are additive, in-place documentation edits on the existing `docs/dec-legal-002-bt-draft-004` branch, not yet merged. Rollback: `git checkout <previous-commit> -- <path>` for each file in §25, or revert the correcting commit.

## 32. Correction report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-004-CORR-001-correction-report-2026-08-31.md` (this report).

## 33. Documentation changes-log entry

Appended to `docs/00-governance/documentation-changes-log.md`, Entry 132, dated 2026-08-31, task `DEC-LEGAL-002-BT-DRAFT-004-CORR-001`.

## 34. Commit SHA

See the in-chat completion report for the exact correcting-commit SHA.

## 35. PR #206 final head/state

See the in-chat completion report for the exact final head SHA and PR state after this correction pass.

## 36. Exact Founder next action

Re-review the corrected §16.2 (termination process, immediate-suspension/termination boundary) and §16.4 (mandatory run-off condition) in the [Core Business Terms Draft v4.1](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md). No merge action is required or authorized by this report.

---

## FINAL GATE

**`CORE BUSINESS TERMS PART IV REVIEW FINDINGS CORRECTED — PR #206 AWAITS FOUNDER RE-REVIEW`**
