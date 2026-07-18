> **Title:** ENG-P0-002 Technical Review — CI Pipeline, Templates and Change-Tracking Scaffold
> **Status:** Review complete. **Outcome: APPROVED FOR MERGE.** PR #1 was not merged by this review.
> **Date:** 2026-07-17
> **Reviewer role:** independent Technical Review, per the Coding Agent Standard, Technical Review Standard, and TRD22 §22.41
> **Classification:** Target-only addition (did not exist in the migrated documentation source)

# ENG-P0-002 Technical Review

## 1. Outcome

**APPROVED FOR MERGE.**

Every workflow, template, and tracking artifact ENG-P0-002 produced was inspected directly and matches the governed prompt. The one real defect found during implementation (Java version mismatch on the GitHub runner) was already identified, fixed, and verified by two independent passing CI runs before this review began; this review found no additional defect. Three stale passages in the Implementation Report (written before the fix/rerun evidence existed) are corrected below. **PR #1 was not merged** — that decision remains the Founder's.

## 2. Branch and PR Evidence

```
Branch: feat/eng-p0-002-ci-foundation
HEAD:   852b104 (tracks origin/feat/eng-p0-002-ci-foundation, in sync)
Working tree: clean

PR #1: https://github.com/Fkenogo/11THONUS/pull/1
  base:      main
  head:      feat/eng-p0-002-ci-foundation @ 852b104 (headRefOid matches local HEAD exactly)
  state:     OPEN
  mergeable: MERGEABLE
  mergedAt:  null

Latest PR check: Build, Lint, Test, Emulator Validation — pass (run 29609818932, 1m38s)
```

`main`/`origin/main` remain at `eb9b0d4` throughout this review — confirmed unchanged.

## 3. Files Inspected

`.github/workflows/ci.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/05-implementation/reports/TEMPLATE.md`, `docs/changes/ENTRY_TEMPLATE.md`, `docs/05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md`, `docs/changes/IMPLEMENTATION_CHANGES.md`, `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`, `docs/05-implementation/change-tracking/engineering-implementation-programme.md`, `package.json`, `firebase.json`, `playwright.config.ts` — plus a full diff of `playwright.config.ts`, `package.json`, `firebase.json`, `apps/`, and `functions/` between `eb9b0d4` (ENG-P0-001 closure) and the current `HEAD`, which returned **zero changes**, confirming ENG-P0-002 touched none of them.

## 4. Workflow Review

- **Triggers:** `push` → `branches: [main]`; `pull_request` → `branches: [main]`; `workflow_dispatch: {}` — all three present, exactly as specified.
- **Versions:** pnpm pinned `9.15.9` (`pnpm/action-setup@v4`, matches root `package.json`'s `packageManager` field exactly); Node pinned `"20"` (matches `engines.node: ">=20"` and `functions/package.json`'s `"20"`); Java — `actions/setup-java@v4`, `distribution: temurin`, `java-version: "21"`, installed before the emulator step (added in commit `4f625b1` after run `29608691029` proved the runner's default Java, 17, was insufficient).
- **Existing root scripts called directly, not duplicated:** every `run:` step is a bare `pnpm <script>` invocation (`build`, `lint`, `format:check`, `typecheck`, `test`, `test:e2e`, `emulators:validate`) — no inline shell logic re-implements what those scripts already do.
- **Secret-free, confirmed by inspection:** `grep -n "secrets\." .github/workflows/ci.yml` returns no matches. No `.firebaserc` exists in the tree. `grep -rn "firebase deploy"` across `.github/`, `package.json`, `firebase.json` returns no matches. No live Firebase project or credential is referenced anywhere.
- **Distinct steps:** 15 real steps (Checkout, pnpm/Node setup, install, build, lint, format:check, typecheck, test, Playwright install, Playwright e2e, Java setup, Java verify, emulator validation), each independently attributable — confirmed against the actual run's step list (§10 below), not assumed from the workflow source alone.
- **Failure-artifact upload:** single step, `if: failure()`, `actions/upload-artifact@v4`, `if-no-files-found: ignore`, uploading `playwright-report/`, `test-results/`, and both emulator debug logs. Confirmed correctly **skipped** (not failed, not run) on the passing run — the `if: failure()` guard behaves as intended.

## 5. Version and Dependency Review

No dependency was added to any workspace `package.json` (confirmed via the zero-diff check in §3). `gh` and `actionlint`, installed locally via Homebrew during implementation, are developer/CI-authoring tools, not repository dependencies — neither is referenced anywhere in the committed tree.

## 6. Firebase Isolation Review

No `.firebaserc`. No Firebase project ID, region, or live-resource reference anywhere in `.github/workflows/ci.yml` or any file this work package touched. The emulator step runs `pnpm emulators:validate`, which is unchanged from ENG-P0-001 and targets only the fake `demo-11thonus` project. No deployment step exists in the workflow.

## 7. Secret-Safety Review

Zero `secrets.*` references in the workflow. The implicit `GITHUB_TOKEN` GitHub provides automatically to every Actions run for checkout is not explicitly referenced or elevated in scope anywhere. No credential, API key, or service-account reference exists in any file this work package created or modified.

## 8. Template Review

- `.github/PULL_REQUEST_TEMPLATE.md` — covers summary, related work-package/requirement/decision IDs, testing performed (with the exact §11 verification commands as checkboxes), screenshots, rollback plan, and a checklist matching the governed prompt's §6 field list exactly.
- `docs/05-implementation/reports/TEMPLATE.md` — fill-in-the-blanks skeleton matching the Implementation Prompt Standard §3's exact reporting list (files created/modified/removed, diff summary, commands, dependencies, configuration, tests, migrations, risks, rollback, unresolved issues) — no prose placeholders left unmarked.
- `docs/changes/ENTRY_TEMPLATE.md` — a deliberately separate file (not embedded in the live, append-only `IMPLEMENTATION_CHANGES.md`), matching TRD22 §22.39's field list (date, phase, task, status, files changed, tests, configuration, migrations, risks, rollback, report link) and ENG-P0-001's own entry pattern. The stated rationale for the separate-file choice (avoiding a "## Template" heading being mistaken for a real entry in an append-only log) is sound and was not second-guessed.

## 9. Local Validation Results

Re-run independently in this review, on the current `HEAD` (`852b104`):

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ "Lockfile is up to date" |
| `pnpm build` | ✅ both workspaces |
| `pnpm lint` | ✅ zero errors, zero warnings |
| `pnpm format:check` | ✅ "All matched files use Prettier code style!" |
| `pnpm typecheck` | ✅ both workspaces, strict mode |
| `pnpm test` | ✅ 2 files / 2 tests passed |
| `pnpm test:e2e` | ✅ 1 passed |
| `pnpm emulators:validate` | ✅ Auth/Functions/Firestore/Hosting/Storage started against `demo-11thonus`; `ping` loaded; clean shutdown |
| `actionlint .github/workflows/ci.yml` | ✅ zero findings |

Note: this machine's local Java is version 25, so local `emulators:validate` could never have reproduced the Java-17 CI failure — that gap is real and specific to CI's runner image, not something local re-validation can substitute for. This is stated plainly, not glossed over.

## 10. Actual GitHub Actions Evidence

Verified with `gh pr checks 1` and `gh run view 29609818932 --job=87981599300` (full per-step breakdown, not the collapsed summary):

```
✓ Set up job
✓ Checkout
✓ Set up pnpm
✓ Set up Node
✓ Install dependencies (frozen lockfile)
✓ Build
✓ Lint
✓ Format check
✓ Typecheck
✓ Unit / component tests
✓ Install Playwright browsers
✓ Playwright e2e
✓ Set up Java (JDK 21+ required by the Firestore Emulator)
✓ Verify Java runtime (required by the Firestore Emulator)
✓ Firebase Emulator Suite validation
- Upload failure diagnostics   (correctly skipped — if: failure() evaluated false)
✓ Complete job
```

This confirms the passing run is a genuine, complete pass of every required step — not a partial or manually-skipped result. The prior failing run ([`29608691029`](https://github.com/Fkenogo/11THONUS/actions/runs/29608691029)) is preserved as historical evidence and was not re-run or erased.

## 11. Corrections Made

Three stale passages in `docs/05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md`, written before the fix/rerun evidence existed, corrected to final-state wording:

- **§8 (Workflow Design Rationale):** removed the claim that "no `actions/setup-java` step was added speculatively; one will be added only if... observed to fail" (true when written, stale now) — replaced with final-state wording naming the actual failure, the fix, and the verification-step's now-correct behavior.
- **§11 (Risks):** removed "the real answer comes from the actual CI run, not a guess" phrasing that treated the Java risk as still open — replaced with wording stating the risk is now controlled by the explicit JDK 21 setup, evidenced by two passing runs. The informational Node.js-24-runner-deprecation note was retained as accurate and non-blocking.
- **§12 (Unresolved Issues):** removed "whether the Firebase Emulator Suite step is reliable in CI... is answered empirically... if it proves unreliable, a follow-up correction... would be needed" — replaced with a direct statement that there is no unresolved emulator issue for ENG-P0-002, citing the failed run, the fix, and both subsequent passing runs.
- §14's historical failure evidence (the original error text, root cause, and fix description) was **not** rewritten — it remains the authoritative record of what actually happened, per this task's own instruction.

## 12. Tracking Reconciliation

Updated only the ENG-P0-002 rows in the two named tracking documents:

- **Coding-Agent Prompt Register:** Status `In Progress` → `Under Review`; Report column now links both the Implementation Report and this Technical Review; Commit column replaced the stale "pending commit on branch" placeholder with the real commit (`852b104`), branch name, PR #1 link (open, not merged), and the latest passing CI run link.
- **Engineering Implementation Programme:** ENG-P0-002 work-package row — Status `In Progress` → `Under Review`; Blocking Reason updated to reflect the CI-corrected, passing state awaiting the Founder's merge decision; Implementation Report column now links this Technical Review too; Commit Hash filled in (`852b104`); Notes extended with the PR link, latest passing run link, and an explicit statement that Complete/Phase-0-closure are **not** set by this reconciliation.
- **Not touched:** any other work-package row, any phase-level status beyond what already read `In Progress` for Phase 0 (unchanged — still correctly `In Progress`, not `Complete`), and no `Approved`/`Merged`/`Complete` status was set anywhere, per the task's explicit restriction.

## 13. Remaining Risks

- None new. The only items carried forward are informational and already disclosed: the Node.js-24-runner-deprecation annotation (unrelated to this repo's own Node 20 target) and the general fact that CI-only environment differences (like the Java version gap this review is closing out) can exist and are only caught by an actual CI run — already demonstrated once and now mitigated by pinning JDK 21 explicitly rather than assuming a default.

## 14. Merge Recommendation

**Recommended: PR #1 is ready to merge**, subject to the Founder's own review and merge decision (this Technical Review does not itself authorize or perform the merge — see the Coding Agent Standard's "never merges its own work package" rule, and this task's own explicit instruction not to merge).

## 15. Rollback Instructions

Unchanged in substance from the Implementation Report's §13 (full file-by-file list: workflow file, PR template, report template, entry template, the Implementation Report itself, the changes-log entries, and the tracking-document edits). Since every relevant commit (`0cac74a`, `4f625b1`, `852b104`, and this review's own tracking-reconciliation commit) is on the feature branch and not yet merged to `main`, the simplest rollback is to close PR #1 without merging and delete the branch — no revert is needed against `main` because `main` was never touched. If any of these commits were already merged, the appropriate rollback is `git revert <commit>` for the specific commit(s) in question, never a rewrite of shared history.

## 16. Final Git Status

```
$ git branch --show-current
feat/eng-p0-002-ci-foundation

$ git status --short
(reported clean prior to this review's own tracking/report edits — see the commit this review makes, below)

$ git log --oneline -6
852b104 docs: record ENG-P0-002 CI failure, root cause and fix [ENG-P0-002]
4f625b1 fix: correct ENG-P0-002 CI failure [ENG-P0-002, DEC-TECH-004]
0cac74a chore: add CI pipeline, PR and report templates [ENG-P0-002]
eb9b0d4 docs: close ENG-P0-001 and ready ENG-P0-002 [ENG-P0-001, ENG-P0-002]
3a50710 chore: establish 11thONUS phase 0 engineering foundation
```

---

## Status

**Outcome: APPROVED FOR MERGE.** This determination is recorded for the Founder's own merge decision — this review does not merge PR #1, does not modify `main`, and does not mark ENG-P0-002 or Phase 0 `Complete`.
