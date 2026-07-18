# Implementation Changes

> Persistent, append-only engineering change log per TRD22 §22.39 (Coding-Agent Change Tracking).
> This file does not replace Git history — it exists to provide a Founder-readable implementation trail.
> This file itself is a **target-only** addition, created by ENG-P0-001; it did not exist in the
> governed documentation source and is not part of the migrated documentation baseline.

---

## 2026-07-17 — ENG-P0-001 — Repository, Tooling, Documentation Migration and Test-Framework Scaffold

- **Date:** 2026-07-17
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation
- **Task:** ENG-P0-001 (first work package of the engineering implementation programme)
- **Status:** Implemented — awaiting Technical Review (not marked complete by the implementing agent)
- **Files changed:** see the Implementation Report for this work package (full created/modified/removed lists)
- **Tests:** Vitest unit/component tests (`apps/web`, `functions`), Playwright e2e smoke test, Firebase Emulator Suite startup/shutdown smoke validation — results recorded in the Implementation Report
- **Configuration:** pnpm workspace (`apps/web`, `functions`); root ESLint flat config, Prettier, TypeScript strict mode across every workspace; Firebase Emulator Suite configured for the `demo-11thonus` fake project (no live project, no `.firebaserc`); Husky pre-commit hook running `lint-staged`/Prettier
- **Migrations:** none (no product-domain code or Firestore schema exists yet)
- **Risks:** see the Implementation Report's Risks and Unresolved Issues section
- **Rollback:** repository has zero prior commits, so nothing needs to be reverted. Do not use `git clean -fdx` — it deletes every ignored file, including the retired-but-retained `.env.local` at the repo root. Instead, remove only the paths ENG-P0-001 introduced or intentionally replaced: `apps/ functions/ tests/ docs/ node_modules/ package.json pnpm-workspace.yaml pnpm-lock.yaml eslint.config.js .prettierrc .prettierignore .husky/ playwright.config.ts README.md firebase.json firestore.rules firestore.indexes.json storage.rules .gitignore` (see the Implementation Report §17 for the exact command). `.git/` and `.env.local` are never touched.
- **Report link:** [`docs/05-implementation/reports/ENG-P0-001-implementation-report-2026-07-17.md`](../05-implementation/reports/ENG-P0-001-implementation-report-2026-07-17.md) — exists in the working tree as of this entry; not yet committed to the repository (no commit has been made at all, per the repository's zero-commit state).

---

## 2026-07-17 — ENG-P0-001 — Technical Review

- **Date:** 2026-07-17
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation
- **Task:** ENG-P0-001 Technical Review (independent verification, per the Coding Agent Standard and TRD22 §22.41)
- **Status:** Review complete — **outcome APPROVED FOR FIRST COMMIT**. ENG-P0-001 itself remains not marked Complete by this review; that workflow status change belongs to the Founder/Technical Lead.
- **Files changed:** `docs/changes/IMPLEMENTATION_CHANGES.md` (two corrections — unsafe rollback command replaced; stale report-location reference corrected); new file `docs/05-implementation/reports/ENG-P0-001-technical-review-2026-07-17.md`.
- **Tests:** full validation suite re-executed independently (build, lint, format:check, typecheck, unit/component tests, Playwright e2e, Firebase Emulator Suite smoke validation, documentation link check) — all passed on re-run; results detailed in the Technical Review report.
- **Configuration:** no configuration was changed as part of this review; all inspected configuration (`firebase.json`, ESLint, Prettier, TypeScript, pnpm workspace) was verified consistent with the Implementation Report and the governing standards.
- **Migrations:** none.
- **Risks:** unchanged from the Implementation Report — no new risk was discovered during this review. See the Technical Review report §14.
- **Rollback:** unchanged in substance; the corrected rollback guidance above and in the Technical Review report §16 both avoid `git clean -fdx`.
- **Report link:** [`docs/05-implementation/reports/ENG-P0-001-technical-review-2026-07-17.md`](../05-implementation/reports/ENG-P0-001-technical-review-2026-07-17.md) — exists in the working tree; not yet committed.

---

## 2026-07-17 — ENG-P0-001 — Closure Tracking and ENG-P0-002 Readiness

- **Date:** 2026-07-17
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation
- **Task:** ENG-P0-001 Closure Tracking and ENG-P0-002 Readiness Preparation (governance/tracking task — no application code, test code, or dependency changed)
- **Status:** ENG-P0-001 workflow status moved **Approved → Committed → Pushed → Complete**. Evidence for each stage:
  - **Technical Review:** Approved, both itemized corrections closed within the review (no open corrections) — [Technical Review report](../05-implementation/reports/ENG-P0-001-technical-review-2026-07-17.md).
  - **Commit:** `3a50710`, message `chore: establish 11thONUS phase 0 engineering foundation`, 205 files changed / 75819 insertions.
  - **Push:** `origin/main` confirmed at the same commit (`git branch -vv` → `main 3a50710 [origin/main]`); working tree clean.
  - **Definition of Done (work-package level, §2):** evaluated criterion-by-criterion against the actual repository and governing documents (not assumed):
    1. Acceptance criteria met verbatim — ✅, re-verified at Technical Review.
    2. Required tests passed — ✅.
    3. Local Validation actually run — ✅, run independently twice (implementation + review).
    4. Implementation Report produced in full — ✅.
    5. Persistent changes-tracking file updated — ✅ (this file).
    6. Technical Review Approved, no open corrections — ✅.
    7. Committed and pushed per Git Workflow — ✅ (see commit evidence above). *Minor process note, not blocking:* the commit message omits the `[<requirement/decision IDs>]` suffix specified in Git Workflow §4; the commit is already pushed and shared history is never rewritten to fix this retroactively — flagged for the next commit's habit, not corrected here.
    8. Founder deployed the change — **N/A**, not skipped: the [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md)'s Phase 0 profile states explicitly *"Expected Deployment State: none — Phase 0 has no deployment target"* and ENG-P0-001's own work-package row states *"Deployment Required: No."*
    9. Preview Review passed — **N/A** for the same reason (§2.8) — Preview Review presupposes a deployed environment, which does not exist at Phase 0 (Phase 1's Firebase project initialization, ENG-P1-001, remains `Blocked`).
    10. Manual Testing Standard's checklist passed — **N/A** — the Programme's Phase 0 profile states *"Manual QA Requirement: No"* and ENG-P0-001's own row states *"Manual QA Required: No"*; the Manual Testing Standard itself (§2) scopes its checklist to "every change that reaches Preview Review," which criterion 9 establishes did not occur here.
    11. No unrelated files modified — ✅, confirmed at Technical Review.
    12. Risk/rollback note remains accurate — ✅ **as of this entry** (see the corrected rollback note below; the original Implementation Report's rollback note, written when the repository had zero commits, is now superseded by the git-aware note below rather than left inaccurate).
  - **Conclusion: all applicable Definition of Done criteria are satisfied. ENG-P0-001 is marked `Complete`.**
- **Files changed:** `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` (ENG-P0-001 → Complete with evidence; ENG-P0-002 → Ready; distribution counts updated), `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (ENG-P0-001 work-package row → Complete; ENG-P0-002 → Ready, blocking reason cleared; Phase 0 status → In Progress in both the profile and the Phase Summary Table), `docs/README.md` (banner status line updated to match), `docs/changes/IMPLEMENTATION_CHANGES.md` (this entry).
- **Files created:** `docs/05-implementation/prompts/ENG-P0-002.md` (finalized, non-draft prompt — not yet issued), `docs/05-implementation/reports/ENG-P0-001-closure-and-eng-p0-002-readiness-report-2026-07-17.md`.
- **Tests:** none re-run in this task (no application/tooling file was touched); validated instead via `git diff --check`, `git status --short`, `git diff --stat`, `git diff --name-only`, and a full documentation relative-link check — see the closure report for exact results.
- **Migrations:** none.
- **ENG-P0-002 readiness:** moved **Blocked → Ready**. Its only blocking reason (sequential precondition "ENG-P0-001 complete") is now satisfied; its own decision dependency (DEC-TECH-004) was already CONFIRMED. A finalized, execution-ready prompt exists at [`docs/05-implementation/prompts/ENG-P0-002.md`](../05-implementation/prompts/ENG-P0-002.md), grounded in the actual repository ENG-P0-001 produced (not the original planning assumptions). **Issuing that prompt to a coding agent remains a distinct, not-yet-taken Founder/ChatGPT Technical Lead action** — this task does not issue it or begin implementing it.
- **Phase 0 status:** remains **In Progress** — ENG-P0-001 is Complete, but Phase 0 as a whole (TRD22 §22.10) is not complete until ENG-P0-002 also reaches Complete.
- **Risks:** unchanged substantively from the Implementation Report and Technical Review; the one new, minor item is the commit-message convention note under criterion 7 above (non-blocking, already pushed, not retroactively fixed).
- **Rollback (supersedes the note in the first ENG-P0-001 entry above, which was written before any commit existed and is now historically-accurate-as-written but outdated for the current state):** the repository now has one commit (`3a50710`), pushed to the shared `origin/main`. Per [Git Workflow](../06-engineering-governance/git-workflow.md) ("never force-pushes; never rewrites shared history"), rollback of a pushed commit is a **revert, not a reset**:
  ```bash
  git revert 3a50710
  git push origin main
  ```
  This creates a new commit that undoes ENG-P0-001's changes while preserving history — it does not touch `.git/` structure, `.env.local`, or force-rewrite `origin/main`. A local-only, pre-push rollback (not applicable now, since the commit is already pushed) would instead have been `git reset --hard` to the parent of `3a50710`; that option no longer applies once a commit is shared with the remote.
- **Report link:** [`docs/05-implementation/reports/ENG-P0-001-closure-and-eng-p0-002-readiness-report-2026-07-17.md`](../05-implementation/reports/ENG-P0-001-closure-and-eng-p0-002-readiness-report-2026-07-17.md) — exists in the working tree; not yet committed (per this task's explicit instruction not to commit or push).

---

## 2026-07-17 — ENG-P0-002 — CI Pipeline, Templates and Change-Tracking Scaffold

- **Date:** 2026-07-17
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation
- **Task:** ENG-P0-002 (second work package of the engineering implementation programme, issued against the finalized prompt at `docs/05-implementation/prompts/ENG-P0-002.md`)
- **Status:** Implemented and locally validated on branch `feat/eng-p0-002-ci-foundation`; awaiting the branch's own CI run and Technical Review (not marked complete by the implementing agent)
- **Files changed:** see the [Implementation Report](../05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md) for the full created/modified list — summary: new CI workflow (`.github/workflows/ci.yml`), new PR template, new implementation-report template, new change-entry template (kept separate from this live log), plus this entry and the Prompt Register/Programme tracking updates
- **Tests:** every §11 verification command from the prompt run locally and passed (install/build/lint/format:check/typecheck/test/Playwright e2e/emulator validation); workflow YAML validated with `actionlint` (zero findings); the actual CI run triggered by this work package's own pull request is the primary acceptance evidence — see the Implementation Report's addendum for the observed result
- **Configuration:** one new GitHub Actions workflow (`.github/workflows/ci.yml`) — pnpm 9.15.9 and Node 20 pinned explicitly (matching the repository's own pinned versions), pnpm store cached via `actions/setup-node`'s built-in `cache: pnpm` mode, failure artifacts (`playwright-report/`, `test-results/`, both emulator debug logs) uploaded on any step failure, zero secrets used anywhere in the pipeline. No existing configuration file was modified.
- **Migrations:** none.
- **Risks:** see the Implementation Report §11; primarily whether the Firestore Emulator runs reliably in CI without further setup — answered empirically by the actual CI run rather than assumed.
- **Rollback:** see the Implementation Report §13 for the full file-by-file list (workflow file, PR template, report template, entry template, this work package's own report, and the tracking-document edits below) — do not describe rollback as merely "delete the workflow and templates."
- **Report link:** [`docs/05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md`](../05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md) — exists in the working tree as of this entry; committed to `feat/eng-p0-002-ci-foundation`, not yet merged to `main`.

---

## 2026-07-17 — ENG-P0-002 — CI Failure Investigation and Fix

- **Date:** 2026-07-17
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation
- **Task:** ENG-P0-002 CI failure investigation and correction, against the actual pull request (`#1`) and its real Actions run — not a hypothetical
- **Status:** Fixed and verified — the branch's CI now passes. Not marked complete; PR #1 was not merged (explicitly out of scope for this task)
- **Files changed:** `.github/workflows/ci.yml` (one step added: `Set up Java (JDK 21+ required by the Firestore Emulator)`, via `actions/setup-java@v4`, immediately before the existing Java-verification step); `docs/05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md` §14 addendum
- **Tests:** original run [`29608691029`](https://github.com/Fkenogo/11THONUS/actions/runs/29608691029) failed at the `Firebase Emulator Suite validation` step (`firebase-tools no longer supports Java version before 21`, runner default is Temurin 17); rerun [`29609566311`](https://github.com/Fkenogo/11THONUS/actions/runs/29609566311) after the fix — all steps pass, `gh pr checks 1` reports `pass`
- **Configuration:** one new CI step (JDK 21 setup via `actions/setup-java@v4`); no application, tooling, or dependency file changed
- **Migrations:** none
- **Risks:** none new; the fix directly addresses a real, evidenced CI-environment difference (this machine's local Java is version 25, so the same failure could not have been caught by local validation alone)
- **Rollback:** revert commit `4f625b1` (single-file change to `.github/workflows/ci.yml`) — `git revert 4f625b1 && git push origin feat/eng-p0-002-ci-foundation`
- **Report link:** see the addendum in [`docs/05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md`](../05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md) §14

---

## 2026-07-17 — ENG-P0-002 — Technical Review

- **Date:** 2026-07-17
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation
- **Task:** ENG-P0-002 Technical Review (independent verification, per the Coding Agent Standard, Technical Review Standard, and TRD22 §22.41), against the actual `feat/eng-p0-002-ci-foundation` branch, PR #1, and its real GitHub Actions evidence
- **Status:** Review complete — **outcome APPROVED FOR MERGE**. PR #1 was **not** merged by this review; that decision belongs to the Founder. ENG-P0-002 status moved `In Progress` → `Under Review` in the tracking documents.
- **Files changed:** `docs/05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md` (three stale passages corrected to final-state wording — §8, §11, §12; §14's historical failure evidence untouched); `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` and `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (ENG-P0-002 rows reconciled with real commit/PR/CI evidence — no other row touched); new file `docs/05-implementation/reports/ENG-P0-002-technical-review-2026-07-17.md`.
- **Tests:** full local validation suite re-executed independently on `HEAD` (`852b104`) — build, lint, format:check, typecheck, unit/component tests, Playwright e2e, Firebase Emulator Suite validation, `actionlint` — all passed; GitHub evidence independently verified via `gh pr checks 1` and a full per-step breakdown of run [`29609818932`](https://github.com/Fkenogo/11THONUS/actions/runs/29609818932) (`gh run view --job=...`), confirming a genuine complete pass, not a partial or skipped run.
- **Configuration:** no configuration was changed as part of this review — the workflow, templates, and every other ENG-P0-002 artifact were verified as already correct.
- **Migrations:** none.
- **Risks:** no new risk found; see the Technical Review report §13.
- **Rollback:** unchanged — see the Technical Review report §15 (close PR #1 without merging; no revert against `main` needed since `main` was never touched).
- **Report link:** [`docs/05-implementation/reports/ENG-P0-002-technical-review-2026-07-17.md`](../05-implementation/reports/ENG-P0-002-technical-review-2026-07-17.md) — exists in the working tree; committed to `feat/eng-p0-002-ci-foundation`, not yet merged to `main`.

---

## 2026-07-18 — ENG-P0-002 — Closure and Phase 0 Completion

- **Date:** 2026-07-18
- **Phase:** TRD22 §22.10 — Phase 0, Repository and Delivery Foundation (closing)
- **Task:** ENG-P0-002 Closure Tracking, Phase 0 Completion, and Phase 1 Readiness Assessment (governance task — no application, test, CI, or dependency file changed)
- **Status:** **ENG-P0-002 → `Complete`. Phase 0 → `Complete`. No Phase 1 work package → `Ready`.**
- **Files changed:** see the [Closure Report](../05-implementation/reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) for the full list — summary: `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` and `engineering-implementation-programme.md` (ENG-P0-002 rows → Complete with merge/CI evidence; Phase 0 status → Complete; Phase 1 status line accuracy touch-up only), `docs/README.md` (banner), this entry, plus new files: this closure report and the [DEC-TECH-005 Founder Decision Brief](../00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md)
- **Tests:** no application test run in this task (no application file changed); merge and CI evidence independently re-verified: PR [#1](https://github.com/Fkenogo/11THONUS/pull/1) merged `e316565` (2026-07-18T09:00:18Z), post-merge CI on `main` [`29638421819`](https://github.com/Fkenogo/11THONUS/actions/runs/29638421819) — all 15 steps passed, confirmed via full per-step breakdown (`gh run view --job=`), not the collapsed summary
- **Configuration:** none — no application, tooling, CI, or dependency file was touched
- **Migrations:** none
- **Definition of Done result (ENG-P0-002, work-package level, §2):** all 9 directly-applicable criteria satisfied (acceptance criteria met verbatim; required tests passed, evidenced by real CI not local claims; Local Validation actually run, multiple times independently; Implementation Report produced in full and corrected to final-state wording at Technical Review; persistent changes-tracking file updated across 4 entries; Technical Review returned Approved with zero open corrections; committed and pushed per Git Workflow, then merged; no unrelated files modified, confirmed repeatedly via zero-diff checks; risk/rollback note now accurate — see below). 3 criteria recorded `N/A`, grounded directly in the Engineering Implementation Programme's own Phase 0 profile text ("Expected Deployment State: none — Phase 0 has no deployment target"; "Manual QA Requirement: No"), not assumed: Founder deployment, Preview Review, Manual QA. Full per-criterion evidence in the Closure Report §3.
- **Phase 0 exit-criteria result (TRD22 §22.10):** project builds ✅, tests run ✅, emulator starts ✅, CI passes ✅ (all four confirmed via post-merge CI run `29638421819` on `main`, not merely local claims), no product-domain implementation ✅ (confirmed via repeated zero-diff checks against `apps/`, `functions/` across every ENG-P0-001/ENG-P0-002 task). All satisfied — **Phase 0 → `Complete`**.
- **Phase 1 readiness result:** **no work package Ready.** ENG-P1-001 — `Blocked`, DEC-TECH-005 (Firebase region) confirmed `OPEN_ENGINEERING` in the live Decision Register. ENG-P1-002 — `Blocked`, sequential precondition (ENG-P1-001 complete) not met. ENG-P1-003 — `Blocked`, sequential precondition not met, additionally blocked on DEC-PROV-005 (error monitoring provider), confirmed `OPEN_PROVIDER`. No Phase 1 row was changed — none is legitimately unblocked. A [Founder Decision Brief for DEC-TECH-005](../00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md) was prepared instead of an implementation prompt — it does not propose a region, perform the regional evaluation, or resolve any Decision Register entry.
- **Risks:** none new. See the Closure Report §16.
- **Rollback (supersedes the ENG-P0-002 Technical Review entry's rollback note above, which described the pre-merge, open-PR state and is now outdated for the current merged state):** PR #1 is merged into `main` at `e316565`. Per [Git Workflow](../06-engineering-governance/git-workflow.md) ("never force-pushes; never rewrites shared history"), rollback of the merged change is a revert of the merge commit, preserving history: `git revert -m 1 e316565 && git push origin main`. This tracking task's own edits (this entry, the two tracking-document updates, the README banner update, and the new Decision Brief and Closure Report files) are, as of this entry, **uncommitted** in the working tree — see the Closure Report §18 for their own separate, simpler rollback (discard/delete, nothing to revert).
- **Report link:** [`docs/05-implementation/reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md`](../05-implementation/reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) — exists in the working tree; not yet committed (per this task's explicit instruction not to commit or push).

---

## 2026-07-18 — Jurisdiction and Language Baseline Correction

- **Date:** 2026-07-18
- **Phase:** TRD22 §22.10/§22.11 — Phase 0 closure (complete) and Phase 1 decision preparation (not started)
- **Task:** Correct the Phase 0 closure package's jurisdiction framing before Phase 1 decision work begins, per an authoritative Founder clarification (governance task — no application, test, CI, or dependency file changed)
- **Status:** Correction applied. Does not reopen or invalidate Phase 0 (still `Complete`); does not resolve DEC-LEGAL-006 or DEC-TECH-005 (both remain open); does not select a Firebase/GCP region.
- **Note on this file's own preceding entry:** the immediately preceding entry ("ENG-P0-002 — Closure and Phase 0 Completion") states its own files were "not yet committed" — that was accurate when written, but the entire Phase 0 closure package (including that entry) was committed and pushed as `c8f0bb6` on `main` before this correction task began. That statement is now superseded by this entry, per this file's own append-only rule (earlier entries are never rewritten, only superseded by a later one).
- **Founder clarification carried forward:** 11thONUS is operated and managed from **Kigali, Rwanda** (the operating jurisdiction); **Burundi is the pilot and first launch market**, not the operator's base; future East African expansion is a later concern; **supported product languages remain English and French only** (Swahili, Kinyarwanda, Kirundi not currently in scope; unchanged from the existing `CONFIRMED` decision **DEC-L10N-001**).
- **Files changed:** `docs/00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md` (jurisdiction framing corrected — Rwanda-operator/Burundi-pilot-market distinction added throughout; verbatim Decision Register quotes left unaltered, with an added reading note explaining they predate this clarification; "ENG-P1-000-style task" phrase replaced with "a separately authorized engineering decision-preparation task"); `docs/05-implementation/reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md` (§8 given the same jurisdiction clarification; §11 given an addendum documenting this correction; §20 updated to reference the new evidence-pack prompt) — both edited in place as ordinary governance-document corrections (not the append-only changes log, which instead receives this new entry).
- **Files created:** `docs/05-implementation/prompts/DEC-LEGAL-006-DEC-TECH-005-evidence-pack.md` — a decision-*research* prompt (not an implementation prompt) for a future agent to gather legal (DEC-LEGAL-006) and technical (DEC-TECH-005) evidence under the corrected Rwanda-operator/Burundi-pilot-market framing and the English/French-only language constraint. **Not issued. Does not resolve either decision.**
- **Tests:** none — no application file was touched. Validated via `git diff --check`, `git status --short`, `git diff --stat`, `git diff --name-only`, and a full documentation relative-link check.
- **Configuration:** none.
- **Migrations:** none.
- **Language-governance result:** an authoritative, `CONFIRMED` decision already exists — **DEC-L10N-001** ("Launch languages EN + FR; three languages architecture-ready") — and its content already matches the Founder's restated direction exactly. No new language decision brief was created; DEC-L10N-001 was **not** modified (modifying a CONFIRMED Decision Register entry outside the formal Decision Update Procedure is out of scope, and was unnecessary since no inconsistency was found).
- **Tracking-document review result:** `coding-agent-prompt-register.md`, `engineering-implementation-programme.md`, and `docs/README.md` were reviewed for Burundi-as-home-jurisdiction, Burundi-only-hosting, or unsupported-language claims. **None found** — existing Burundi references in these documents correctly describe Burundi as the pilot/launch market (e.g. "Burundi Pilot," "Burundi electronic billing requirements"), consistent with the Founder's clarification. **None of the three was edited.**
- **Risks:** none new. See the Closure Report §11a for full detail.
- **Rollback:** this correction was applied as edits to two already-committed files (`dec-tech-005-firebase-region-decision-brief.md`, the closure report) plus one new file (the evidence-pack prompt) plus this changes-log entry — none of it committed yet at the time of this entry. Discard: `git checkout -- docs/00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md docs/05-implementation/reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md docs/changes/IMPLEMENTATION_CHANGES.md && rm docs/05-implementation/prompts/DEC-LEGAL-006-DEC-TECH-005-evidence-pack.md`. This does not touch `c8f0bb6` or the Phase 0 merge (`e316565`) — both remain untouched, already-shared history.
- **Report link:** this entry itself is the primary record of this correction; see also the addendum in [`docs/05-implementation/reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md`](../05-implementation/reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) §11a.
- **Follow-up correction (same day, applied to this still-uncommitted entry's own files before their first commit):** two narrow fixes applied on top of the above. (1) The closure report's chronology was corrected — it previously implied this jurisdiction correction was applied *before* the original closure package's first commit; it now correctly states the original closure package was committed and pushed as `c8f0bb6`, and this jurisdiction correction is a *subsequent* governance correction applied on top of it, pending its own review and commit. (2) The evidence-pack prompt (`DEC-LEGAL-006-DEC-TECH-005-evidence-pack.md`) was revised so its legal-research instructions (Part A, Part C, Acceptance Criteria) require the future agent to actually investigate whether Rwandan or Burundian law mandates a specific language for regulated customer communications (notices, consent, contracts, privacy disclosures) — the prompt previously pre-answered this as "English/French only," which risked suppressing a real compliance finding. Any such finding is now required to be reported as a labeled legal-compliance constraint for Founder/counsel review, explicitly distinct from and not authorizing any change to the approved product-interface language scope (still English/French only, per `DEC-L10N-001`, unchanged).

---

## 2026-07-18 — DEC-LEGAL-006 / DEC-TECH-005 — Evidence Gathering (Decision Research Only)

- **Date:** 2026-07-18
- **Phase:** Phase 1 decision preparation (Phase 1 itself remains `Blocked`; this is evidence-gathering, not implementation)
- **Task:** Execution of the [DEC-LEGAL-006 / DEC-TECH-005 evidence-gathering prompt](../05-implementation/prompts/DEC-LEGAL-006-DEC-TECH-005-evidence-pack.md), committed at `fcd89d4` — real internet research producing citation-backed evidence packs for Founder and legal-counsel review
- **Status:** **This is decision evidence only.** Neither DEC-LEGAL-006 nor DEC-TECH-005 is resolved by this work; no Firebase/GCP region has been selected; Phase 1 is not Ready; no Firebase project was created; nothing was deployed. Both decisions remain exactly as open as before this research — `OPEN_LEGAL` and `OPEN_ENGINEERING` respectively — in the (untouched) Decision Register.
- **Files changed:** none — this task only created new files.
- **Files created:** [Legal Evidence Pack](../00-governance/decisions/evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md); [Technical Evidence Pack](../00-governance/decisions/evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md); [Proposed (Unapplied) Decision Updates](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-proposed-updates-2026-07-18.md); [Founder Brief](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-founder-brief-2026-07-18.md); [Source Register](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md); [Evidence-Gathering Report](../05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md).
- **Tests:** documentation relative-link check only (no application file touched — see the Evidence-Gathering Report for the exact result).
- **Configuration:** none.
- **Migrations:** none.
- **Key legal finding:** Rwanda's Law N° 058/2021 requires data storage inside Rwanda by default (Article 50), with NCSA authorization or a documented alternative ground (Article 48) plus a written transfer contract (Article 49) required for any offshore hosting — this applies to any Firebase/GCP region, since none is located in Rwanda. Burundi adopted its first comprehensive data protection law only in March 2026 (Loi n° 1/03 du 10 mars 2026); its specific cross-border transfer provisions could not be confirmed from public sources in this research pass (the primary text could not be directly retrieved) and are the single largest open item before DEC-LEGAL-006 can be resolved.
- **Key technical finding:** `africa-south1` (Johannesburg) is Google's only African region and the likely lowest-latency candidate for Kigali/Bujumbura (estimated, not measured), but does not support Cloud Scheduler; `europe-west1` (Belgium) offers full confirmed service coverage with no such gap. Neither is recommended as final — both require legal confirmation and an actual latency measurement first.
- **Risks:** see the Evidence-Gathering Report §16 — primarily the Burundi-law confirmation gap and the reliance on latency/pricing estimates rather than measurements.
- **Rollback:** all six files created by this task are new and untracked; discard by deleting them (exact list in the Evidence-Gathering Report §17). Nothing else was touched.
- **Report link:** [`docs/05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md`](../05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md) — exists in the working tree; not yet committed (per this task's explicit instruction not to commit or push).

---

## 2026-07-18 — DEC-LEGAL-006 / DEC-TECH-005 — Evidence Pack Source Correction and Completion

- **Date:** 2026-07-18
- **Phase:** Phase 1 decision preparation (Phase 1 itself remains `Blocked`; this is a correction to evidence-gathering, not implementation)
- **Task:** Source-quality and completeness correction of the DEC-LEGAL-006/DEC-TECH-005 evidence package produced by the immediately preceding entry — same day, before any part of that package was committed
- **Status:** **Correction applied. This is still decision evidence only.** Neither DEC-LEGAL-006 nor DEC-TECH-005 is resolved; no Firebase/GCP region has been selected; Phase 1 is not Ready; no Firebase project was created; nothing was deployed; the Decision Register was not modified (both decisions remain `OPEN_LEGAL` / `OPEN_ENGINEERING`).
- **Files changed (all five evidence-package files from the preceding entry, edited in place, plus this changes log and the report itself):**
  - [Legal Evidence Pack](../00-governance/decisions/evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md) — Rwanda's official-language count corrected (four: Kinyarwanda, English, French, Kiswahili, not three); §3 Burundi section rewritten with confirmed primary-text findings (territorial scope, definitions, lawful bases, cross-border transfer mechanism, data subject rights, major-controller threshold, the data protection authority's name, security obligations, breach notification, sanctions, transitional deadlines); §5, §6, §7, §8 updated to match.
  - [Technical Evidence Pack](../00-governance/decisions/evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md) — service matrix (§2) completed for Cloud Storage, Cloud Run, Cloud Tasks (a new confirmed gap for `africa-south1`), App Check, Pub/Sub, Secret Manager, and Firestore backup/export; Firebase Authentication wording corrected to match what the documentation actually states; recommendation language (§7, §9) softened to avoid overstating "full" service coverage.
  - [Proposed Decision Updates](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-proposed-updates-2026-07-18.md) — updated to reflect the confirmed Burundi mechanism and the Cloud Tasks gap; both proposed statuses remain `OPEN_LEGAL`/`OPEN_ENGINEERING`, unchanged.
  - [Founder Brief](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-founder-brief-2026-07-18.md) — plain-language sections rewritten to explain both corrections and the narrower remaining open items.
  - [Source Register](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md) — 8 sources added, 4 downgraded (superseded by primary sources), 1 upgraded from "identified, not read" to "directly read, primary"; totals recomputed from 25 sources/60% primary to **33 sources/61% primary**.
  - [Evidence-Gathering Report](../05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md) — updated throughout to match the corrected findings and source counts.
- **Files created:** none.
- **Tests:** documentation relative-link check re-run after the correction (two broken relative links found in the Proposed Decision Updates file from the original pass — `../decision-governance-workflow.md` and `../decision-update-procedure.md` used the wrong `../` depth — fixed to `../../`; zero broken links on re-check).
- **Configuration:** none.
- **Migrations:** none.
- **What changed and why:** the original evidence pack (immediately preceding entry) understated Rwanda's official-language count and could not retrieve Burundi's primary statutory text (a network/certificate error blocked the fetch), so it reported Burundi's cross-border mechanism, registration thresholds, and breach-notification rules as "unconfirmed." This correction pass **successfully downloaded Burundi's law directly** (a 32-page, image-only PDF with no text layer; no OCR tool was available, so all 55 articles were reviewed visually from rendered page images) and found it to use an **adequacy-based cross-border transfer mechanism** (Articles 15–16), not a Rwanda-style localization default — closing the largest gap in the original pass, though two narrower Burundi-specific gaps remain (the Ministerial adequacy list's contents; the new Agency's operational status). The technical service matrix was also completed — most notably, **Cloud Tasks, not just Cloud Scheduler, is confirmed unsupported in `africa-south1`**, a materially larger technical caveat for that candidate than the original pass identified.
- **Risks:** the Burundi law review was manual (visual page-by-page reading, not OCR or machine-verified) — a second reviewer or OCR-based cross-check remains prudent before final legal reliance, even though all 55 articles were covered. See the Evidence-Gathering Report §16 for the full, corrected risk list.
- **Rollback:** all six edited files are still uncommitted (same as the preceding entry) — discard by reverting to the state before this correction pass, e.g. `git diff` against the immediately preceding entry's own (also uncommitted) content, or simply re-editing; no commit exists yet for either the original pack or this correction to revert against.
- **Report link:** [`docs/05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md`](../05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md) (updated in place) — exists in the working tree; not yet committed (per this task's explicit instruction not to commit or push).

---

## 2026-07-18 — DEC-LEGAL-006 / DEC-TECH-005 — Final Consistency Review (Narrow Correction)

- **Date:** 2026-07-18
- **Phase:** Phase 1 decision preparation (Phase 1 itself remains `Blocked`; this is a further narrow correction to evidence-gathering, not implementation)
- **Task:** Final narrow consistency correction of the DEC-LEGAL-006/DEC-TECH-005 evidence package — a follow-up to the two immediately preceding entries, addressing three claims that remained stronger than their supporting evidence even after the first correction pass
- **Status:** **Correction applied. This is still decision evidence only.** Neither DEC-LEGAL-006 nor DEC-TECH-005 is resolved; no Firebase/GCP region has been selected; Phase 1 is not Ready; no Firebase project was created; nothing was deployed; the Decision Register was not modified (both decisions remain `OPEN_LEGAL` / `OPEN_ENGINEERING`).
- **Files changed (all five evidence-package files, edited in place, plus this changes log and the report itself):**
  - **Firebase Authentication residency wording narrowed** across the [Legal Evidence Pack](../00-governance/decisions/evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md), [Technical Evidence Pack](../00-governance/decisions/evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md), [Proposed Decision Updates](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-proposed-updates-2026-07-18.md), [Founder Brief](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-founder-brief-2026-07-18.md), [Source Register](../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md) (T6, S11), and the [Evidence-Gathering Report](../05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md) — the controlled statement is now "Firebase Authentication does not expose a project-level location-selection control comparable to Firestore or Cloud Storage," with an explicit added limitation that the officially reviewed documentation does not establish Authentication's precise data residency, and that confirmation must come from Google's service terms, data-processing documentation, or the provider directly. The Proposed Decision Update now requests provider confirmation rather than asserting a residency fact.
  - **Cloud Scheduler separated from Cloud Tasks as two distinct findings**, not one problem with one fix, across the same six files. Cloud Scheduler retains its documented/strongly-supported cross-region HTTP-target pattern. Cloud Tasks is now explicitly stated as an unresolved architecture question for `africa-south1`, with its own list of open sub-questions (cross-region invocation security, authentication method, retry/dead-letter behavior, regional-failure behavior, latency/egress, and data-residency implications for task payloads) added to the Technical Evidence Pack §9 and the Evidence-Gathering Report.
  - **Service-matrix completeness wording softened further** — "the service matrix is complete"/"fully verified" language replaced with "materially expanded; primary-candidate checks completed for the services prioritized in this pass; some residency-specific, secondary-service, pricing, and operational questions remain open." The confirmed comparison (europe-west1 has the more complete confirmed service profile; africa-south1 requires additional architecture decisions) is preserved, and the confirmed Scheduler/Tasks findings themselves were not downgraded.
  - **Founder Brief §4 rewritten** to explain, in plain language: Belgium offers the simpler single-region path among checked candidates; Johannesburg's latency advantage is estimated, not measured; Johannesburg lacks both Scheduler and Tasks; Scheduler has a workable cross-region design; Tasks needs a separate answer; and Firebase Authentication's exact data-location position requires provider confirmation. The "small workaround" framing was removed throughout.
  - **Source register re-audited (T6, T8, T15, T17, T18, plus S11)** per explicit instruction — T6/S11's claim scope was narrowed to match the corrected Authentication wording; T17's classification label was cleaned up from a confusing "primary claim, secondary-quality citation" to a clear "Secondary" (it was already counted as secondary in the totals, so **no total changed**); T8, T15, and T18 were reviewed and found already correctly classified.
- **Files created:** none.
- **Tests:** documentation relative-link check re-run after the correction; `pnpm format:check` re-run — both results recorded in the Evidence-Gathering Report §10/§17.
- **Configuration:** none.
- **Migrations:** none.
- **Revised source totals:** unchanged — still 33 sources (15 legal, 18 technical), 61% primary (20/33). This re-audit changed claim scope and one classification label, not any source's primary/secondary tally.
- **Risks:** none new beyond those already recorded in the two preceding entries; this pass reduces risk by removing overstatements rather than introducing new ones.
- **Rollback:** all six edited files remain uncommitted (same as the two preceding entries) — discard by reverting to the state before this correction pass or simply re-editing; no commit exists yet for the original pack or either correction to revert against.
- **Report link:** [`docs/05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md`](../05-implementation/reports/DEC-LEGAL-006-DEC-TECH-005-evidence-gathering-report-2026-07-18.md) (updated in place) — exists in the working tree; not yet committed (per this task's explicit instruction not to commit or push).
- **Follow-up (same day, applied to this still-uncommitted entry's own files before their first commit):** five residual, narrower wording issues found on a final consistency pass, each fixed in place — (1) the Evidence-Gathering Report §8 still said the service matrix was "now complete rather than partial"; corrected to "materially expanded... not an exhaustive service, residency, pricing, or operational audit." (2) The Report §9 recommendation still referenced a combined "Cloud Scheduler/Tasks pattern" as though one fix covered both; corrected to state the Scheduler cross-region pattern and Cloud Tasks's unresolved status separately. (3) The Report §16 risk line still read "identity data isn't confined to the chosen Firestore/Storage region"; replaced with the controlled Authentication statement plus the residency-confirmation requirement. (4) The Technical Evidence Pack §8 evidence table's "Key advantage" row still used "Full service coverage" language for `europe-west1`/`europe-west3`/`europe-west4`/`europe-west9`; replaced with evidence-scoped wording ("most complete confirmed profile among checked services," "Scheduler-supported among checked services," "Tier 1 Functions and `eur3` participation," "core checked services supported; Scheduler absent"). (5) The Technical Evidence Pack §2 App Check row still described it as "a global/non-regional attestation service"; replaced with "no project-level location-selection control was identified... precise service-processing location was not established in this pass." A targeted grep confirmed no other live occurrence of any of these five phrases remained in the evidence-package files, the report, or this changes log after the fix (only this historical note and the earlier correction-notice text, both of which describe the removed wording rather than assert it).
