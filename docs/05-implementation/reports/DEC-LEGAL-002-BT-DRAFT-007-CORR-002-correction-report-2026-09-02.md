# DEC-LEGAL-002-BT-DRAFT-007-CORR-002 — Correction Report: §22.3 Non-Material-Change Effective-Date Conflict (PR #212 Automated Review)

> **Task:** `DEC-LEGAL-002-BT-DRAFT-007-CORR-002` · **Date:** 2 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction, following automated (Codex) review of PR #212 after `-CORR-001`
> **Scope:** Docs-only correction of one genuine §22.3 P2 finding on PR #212. **No unaffected clause rewritten. No Part VIII drafting. No merge.**
> **Working environment:** performed in an isolated detached-HEAD git worktree (`/Volumes/PRODUCTION/Projects/11THONUS-pr212-corr002`, `git worktree add --detach` at commit `a404a538e228e2d7d0cc0cbd3ca9b5918ee6fd70`), per Founder direction, because the primary working directory had unrelated uncommitted `FD-COM-001` commercial-model work in progress on the same PR branch. The primary worktree was not read, stashed, committed, reset, cleaned, or otherwise altered by this task.

---

## 1. Entry repository state

The primary working directory (`/Volumes/PRODUCTION/Projects/11THONUS`) had branch `docs/dec-legal-002-bt-draft-007` checked out with substantial unrelated uncommitted changes (an `FD-COM-001` consumption-first commercial-model reconciliation touching 18 tracked files, including `documentation-changes-log.md`, plus several new untracked files). Because Git refuses to check out a branch already checked out elsewhere without `--force`, and destructive/forcing actions on that worktree were explicitly prohibited, a new isolated worktree was created in **detached HEAD** mode at the exact PR #212 head commit, leaving the primary worktree completely untouched. All work for this correction was performed exclusively in that isolated worktree.

## 2. PR #212 state (entry)

`OPEN`, `MERGEABLE`, 2 commits, confirmed via `gh pr view 212 --json state,headRefOid,mergeable,commits`.

## 3. Entry head SHA

`a404a538e228e2d7d0cc0cbd3ca9b5918ee6fd70` — matches exactly (this is the `-CORR-001` commit). No new unexpected commits since `-CORR-001` was pushed.

## 4. CI/review state (entry)

`Build, Lint, Test, Emulator Validation` — **pass** (6m21s) on the exact head, confirmed via `gh pr checks 212`. Automated review from `chatgpt-codex-connector` confirmed present with exactly three P2 review-comment threads, retrieved verbatim via `gh api repos/Fkenogo/11THONUS/pulls/212/comments`:

1. **"Define how non-material versions take effect"** (anchored at `line: 509`, a real, current diff line) — the §22.3 finding. **Current and unresolved.**
2. **"Remove the unsupported assignment rights"** (`line: null`) — the §25.1 finding. `line: null` confirms this comment's original diff line no longer exists in the current diff — **outdated**, superseded in substance by `-CORR-001`, which already rewrote §25.1 to remove the exact invented rights (consent right, asset-transfer exception, merger/acquisition/sale transfer right) the finding objected to.
3. **"Preserve the legally-impossible reward exception"** (`line: null`) — the §25.4 finding. Same `line: null` signature — **outdated**, superseded in substance by `-CORR-001`, which already added explicit genuine-impossibility treatment to §25.4 (obligation not extinguished; no invented cash-substitute/time-extension rule).

## 5. Correction strategy

Only §22.3 required a text change. §22.1 permits a non-material, administrative, or clarifying change to be communicated to a Business without affirmative reacceptance, subject to applicable law. §22.3, as drafted through `-CORR-001`, stated unconditionally that "a new or amended version of these Terms takes effect... in accordance with the versioned-acceptance architecture described at §7.2" — but §7.2's validity requirements include an affirmative act of acceptance of the exact version, and §7.4 states that acceptance of a prior version is not acceptance of a new one. Read together, the original §22.3 left no effective-date path at all for the very non-material changes §22.1 expressly permits without reacceptance — a genuine internal conflict identified correctly by the automated reviewer, not a stylistic preference. The correction splits §22.3 into two sentences: one for versions requiring reacceptance under §22.1 (unchanged in substance — §7.2's architecture governs), and one for versions that do not require reacceptance under §22.1 (not accepted under §7; effective date/communication identified and recorded consistently with applicable law and applicable governance, with every invented mechanic — fixed period, deemed acceptance, continued-use acceptance, automatic effective date on publication or notice, grace period, lifecycle/access consequence — expressly named as not established). §22.4 and CI-05 were deliberately left untouched, since the refusal/non-acceptance consequence CI-05 addresses is a different question (what happens when a Business fails a *required* reacceptance) from the question §22.3's new sentence answers (how the effective date of a version that was never subject to a reacceptance requirement is identified).

## 6. Exact §22.3 correction

Before (as it stood through `-CORR-001`):

> 22.3 A new or amended version of these Terms takes effect, and is recorded, in accordance with the versioned-acceptance architecture described at §7.2 (exact version reference; authoritative timestamp; retrievable accepted Terms). This section does not restate or duplicate §7's acceptance standard, and does not introduce a forced-scrolling mechanism, a re-type-to-confirm mechanism, or any additional confirmation step beyond what §7 already states.

After:

> 22.3 A new or amended version of these Terms that requires affirmative reacceptance under §22.1 takes effect for a Business, and is recorded, only in accordance with the versioned-acceptance architecture described at §7.2 (exact version reference; identifiable accepting party; authoritative timestamp; retrievable accepted Terms). This section does not restate or duplicate §7's acceptance standard, and does not introduce a forced-scrolling mechanism, a re-type-to-confirm mechanism, or any additional confirmation step beyond what §7 already states.
>
> A new or amended version of these Terms that does not require affirmative reacceptance under §22.1 is not accepted under §7, and a Business is not treated as having affirmatively accepted that version. This section does not itself establish a fixed or universal effective-date period for such a version, a deemed-acceptance rule, an acceptance-through-continued-use rule, an automatic effective date upon publication, an automatic effective date upon the sending of a notice, or a grace period, and does not itself establish any suspension, termination, or account-restriction consequence in connection with such a version. The effective date of, and the communication concerning, such a version must be identified and recorded consistently with applicable law and applicable governance.

## 7. Why it does not create deemed acceptance

The new second sentence begins by stating directly that a non-reacceptance version "is not accepted under §7, and a Business is not treated as having affirmatively accepted that version" — the opposite of a deemed-acceptance rule. It then affirmatively lists, as things this section does *not* establish, exactly the mechanics that would function as deemed acceptance in substance even without using that label: a deemed-acceptance rule by name, an acceptance-through-continued-use rule, and an automatic effective date on publication or on sending a notice. No sentence anywhere in the corrected §22.3 states or implies that inaction, continued platform use, or the mere passage of time following communication operates as acceptance.

## 8. Why it does not resolve CI-05

CI-05, as stated at §22.4, is "what technically happens when an already-accepted Business faces a new Terms version" — covering both the reacceptance-on-change mechanism and the refusal/non-acceptance consequence for a Business that refuses, fails, or has not yet completed a *required* reacceptance. The corrected §22.3's new sentence applies only to versions that do **not** require reacceptance under §22.1 in the first place — there is no reacceptance requirement in play for CI-05 to attach to. §22.3 does not state, and could not be read to state, any consequence for a Business that fails to reaccept a version that *does* require reacceptance; that question remains entirely within §22.4's existing, unmodified non-resolution. The corrected §22.3 and §22.4 address two disjoint sets of Terms versions (non-reacceptance-requiring vs. reacceptance-requiring), so there is no overlap through which this correction could resolve, narrow, or restate CI-05.

## 9. Status of all three P2 threads

- **§22.3 thread (id `3912396976`):** genuine, current. Corrected as described above. Reply posted describing the fix; **resolved** after the correction was applied and verified.
- **§25.1 thread (id `3912396983`):** genuine when originally raised, but **outdated** — `-CORR-001` (pushed before this task began) already removed the exact invented assignment rights the comment objects to. No further substantive rewriting performed in this task per the governing instruction. Reply posted pointing to the `-CORR-001` commit and the corrected §25.1 text; **resolved** after verification that the current §25.1 no longer contains the objected-to content.
- **§25.4 thread (id `3912396991`):** genuine when originally raised, but **outdated** — `-CORR-001` already added the "legally impossible"/genuine-impossibility treatment the comment requested be preserved (the obligation is not extinguished, and no invented cash-substitute or time-extension rule is stated). No further substantive rewriting performed in this task. Reply posted pointing to the `-CORR-001` commit and the corrected §25.4 text; **resolved** after verification.

## 10. §21 integrity check

Re-read in full; unchanged. Still aligned with LEG-FD-14 (arbitration architecture, §21.3–§21.7) and LEG-FD-16 (Rwanda substantive governing law, §21.1–§21.2). No edit made.

## 11. §22/CI-05 integrity check

§22.1, §22.2, §22.4, and §22.5 re-read in full; unchanged. Only §22.3 was edited, and only as described at §6 above. §22.4's CI-05 non-resolution (reacceptance mechanism and refusal/non-acceptance consequence) is preserved verbatim.

## 12. §23 integrity check

Re-read in full; unchanged. Remains a pure cross-reference to the separately governed privacy/data-processing framework.

## 13. §24 integrity check

Re-read in full; unchanged. Remains electronic-first and flexible, with no fixed deemed-receipt period or mandatory channel.

## 14. §25.1/§25.4/§25.5 integrity check

Re-read in full; each retains exactly the `-CORR-001` wording (the narrow assignment reservation at §25.1; the no-excuse/no-retrospective-reduction plus genuine-impossibility treatment at §25.4; the named-provisions-only survival scope at §25.5). No edit made to any of the three in this task.

## 15. §25.2/§25.3/§25.6 integrity check

Re-read in full; unchanged (severability, entire agreement respecting LEG-FD-10, and the open language-version reservation).

## 16. Parts I–VI substantive-diff verification

`git diff` of this correction confirms the only removed/changed lines in the core instrument file are the document-header version metadata and §22.3 itself. No Part I §§1–7, Part II §§8–10, Part III §§11–14, Part IV §§15–17, Part V §18, or Part VI §§19–20 clause body text was touched.

## 17. Part VIII undrafted verification

Confirmed: no clause text was added or altered under §26/§27 (Part VIII). Not implicated by this correction.

## 18. Controlled Inputs state

CI-01 (operator legal identity) and CI-05 (reacceptance-on-Terms-change engineering implementation decision) remain the only two open Controlled Inputs, unchanged. No new Controlled Input created — see the updated Controlled Inputs Register's "Part VII second PR-review correction pass" section for the item-by-item confirmation.

## 19. DEC-LEGAL-002 / Terms / Capability 3 states

`DEC-LEGAL-002` = `OPEN_LEGAL`, unchanged. Terms configuration (`platformConfig/businessTerms`) = `NOT CONFIGURED`, unchanged. Capability 3 = Open — engineering work packages complete; blocked on governed Terms-content configuration (`CDR-001` §5), unchanged.

## 20. Files modified

1. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` — §22.3 corrected in place (v7.1 → v7.2); no other clause text touched.
2. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` — §22.3 row updated; second Part VII correction-pass note added (v7.1 → v7.2).
3. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` — second Part VII PR-review correction-pass section added (no register change; v7.1 → v7.2).
4. `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-007-CORR-002-correction-report-2026-09-02.md` — this file (new).
5. `docs/00-governance/documentation-changes-log.md` — Entry 142 added (from the clean committed baseline in this worktree; the concurrent `FD-COM-001` session's own uncommitted Entry 142 in the primary worktree was neither read for content nor incorporated, per Founder instruction — that session must reconcile its own numbering against the updated repository when it eventually commits).

No other file touched. No `DEC-LEGAL-002-BT-DRAFT-007-drafting-report-2026-09-02.md` or `DEC-LEGAL-002-BT-DRAFT-007-CORR-001-correction-report-2026-09-02.md` change (left as historical records). No `DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md` change. No Decision Register change. No Founder Legal Architecture Disposition Record change.

## 21. Code/document diff summary

Core instrument file: §22.3 split into two sentences distinguishing reacceptance-requiring and non-reacceptance-requiring versions; document-header/version-metadata updated to v7.2. Traceability Matrix: one row updated; one new correction-pass paragraph added. Controlled Inputs Register: one new "Part VII second PR-review correction pass" section added (no register change). Two new files created (this report; changes-log entry). Total diff across the three companion/instrument files: 3 files changed, 21 insertions(+), 8 deletions(-).

## 22. Commands executed

`git worktree list`; `git worktree add --detach /Volumes/PRODUCTION/Projects/11THONUS-pr212-corr002 a404a538e228e2d7d0cc0cbd3ca9b5918ee6fd70`; `git rev-parse HEAD`; `git status --short`; `git fetch origin`; `git rev-parse origin/docs/dec-legal-002-bt-draft-007`; `gh pr view 212 --json headRefOid,state,mergeable`; `gh pr checks 212`; `gh pr view 212 --json reviews`; `gh api repos/Fkenogo/11THONUS/pulls/212/comments`; direct file edits (`Edit`/`Write`) to the core instrument, the two companion documents, this report, and the changes-log; `git diff`/`git diff --stat` verification of the exact changed-line scope.

## 23. Dependencies added

None.

## 24. Config changes

None. No application/source/Firebase/dependency/config change of any kind.

## 25. Risks

If a future correction reads the new §22.3 second sentence as authorizing an unbounded or indefinite delay in identifying a non-reacceptance version's effective date, it would understate the "must be identified and recorded consistently with applicable law and applicable governance" obligation this sentence states — the point is conservatively reserved, not left wholly open. If a future task incorrectly treats the two now-outdated §25.1/§25.4 review threads as still requiring substantive rewriting beyond what `-CORR-001` already did, it would risk re-litigating already-resolved findings; this report's §9 explicitly records why no further rewriting was performed. The unrelated `FD-COM-001` uncommitted work in the primary worktree remains a live risk for that other session to manage — it was not touched, read for content, inspected beyond `git status --short`/`git diff --stat` file-name-and-stat level, or altered in any way by this task.

## 26. Rollback instructions

Revert this correction's commit; the four files listed at §20 (excluding the two prior reports, which are unmodified) are the only ones touched by this correction, so rollback is a single-commit revert that restores the v7.1 wording. The isolated worktree at `/Volumes/PRODUCTION/Projects/11THONUS-pr212-corr002` may be removed with `git worktree remove` once no longer needed; this does not affect the primary worktree or its uncommitted `FD-COM-001` work.

## 27. Markdown implementation/correction report

This file.

## 28. `.md` changes-log entry

Entry 142, `docs/00-governance/documentation-changes-log.md` (added from the clean committed baseline in this isolated worktree).

## 29. Entry/final PR head SHA

Entry head: `a404a538e228e2d7d0cc0cbd3ca9b5918ee6fd70`. Final head: recorded in the completion message after commit and push.

## 30. Exact-head CI result

Entry-head CI: `Build, Lint, Test, Emulator Validation` — pass. Post-push CI result to be confirmed once the corrected commit is pushed.

## 31. Any new automated findings

To be assessed once the corrected commit is pushed and the automated (Codex) review runs on it.

## 32. Exact Founder next action

Review the corrected §22.3 wording against this report and the updated Traceability Matrix/Controlled Inputs Register; confirm the three P2 thread dispositions at §9 (one genuinely corrected, two confirmed outdated/superseded by `-CORR-001`); allow CI and the automated Codex review to complete on the new commit; if satisfied, approve Part VII (as corrected through `-CORR-002`) as a controlled drafting baseline. Do not merge without Founder approval. Separately, note that the primary working directory still holds unrelated uncommitted `FD-COM-001` work that its own owning session will need to commit or otherwise resolve — not a Part VII matter.

---

## FINAL GATE

`PART VII §§21–25 CORRECTED — ALL PR #212 REVIEW FINDINGS RESOLVED — READY FOR FOUNDER FINAL REVIEW`
