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
