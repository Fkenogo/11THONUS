> **Title:** ENG-P0-002 Implementation Report — CI Pipeline, Templates and Change-Tracking Scaffold
> **Status:** Implemented, CI-fixed and passing — awaiting Technical Review
> **Date:** 2026-07-17
> **Classification:** Target-only addition (not part of the migrated documentation baseline)

# ENG-P0-002 Implementation Report

## 1. Files Created

- `.github/workflows/ci.yml` — the CI workflow (see §4).
- `.github/PULL_REQUEST_TEMPLATE.md` — pull-request template (summary, related IDs, testing performed, screenshots, rollback plan, checklist).
- `docs/05-implementation/reports/TEMPLATE.md` — implementation-report template, structured to the Implementation Prompt Standard §3's exact reporting list.
- `docs/changes/ENTRY_TEMPLATE.md` — change-tracking entry template, as a **separate file** rather than a template section embedded in the live `docs/changes/IMPLEMENTATION_CHANGES.md`. Chosen because `IMPLEMENTATION_CHANGES.md` is explicitly append-only and purely chronological (per its own header and TRD22 §22.39); embedding a "## Template" heading inside it risks a future entry being appended above or below it incorrectly, or the template itself being mistaken for a real entry when skimming the file. A separate file keeps the live log strictly real-entries-only while remaining exactly as easy to find and copy from.
- `docs/05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md` — this report.

## 2. Files Modified

- `docs/changes/IMPLEMENTATION_CHANGES.md` — one new entry appended (§13), plus a CI-failure-and-fix addendum (§14).
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` — ENG-P0-002 row status updated to reflect this work package's actual progress (see §13).
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — ENG-P0-002 work-package row updated with Implementation Report link (see §13).
- `.github/workflows/ci.yml` — one step added (`Set up Java`) after the original commit, to fix the real CI failure observed on run `29608691029` — see §14.

## 3. Files Removed

None.

## 4. Diff Summary

One new CI workflow (`.github/workflows/ci.yml`, single job, 3 triggers: `push` to `main`, `pull_request` targeting `main`, `workflow_dispatch`), wrapping the exact existing root scripts ENG-P0-001 already established (`pnpm build`/`lint`/`format:check`/`typecheck`/`test`/`test:e2e`/`emulators:validate`) without modifying any of them. Two new reusable templates (PR template, implementation-report template) plus one new reusable change-entry template kept separate from the live change log. Two governance-tracking documents updated to record this work package's own progress, matching the pattern ENG-P0-001's closure task established. No application code, test code, dependency, or existing tooling configuration file was touched.

## 5. Commands Executed

```
git branch --show-current
git status --short
git log --oneline -3
git branch -vv
git remote -v
brew install gh
brew install actionlint
actionlint .github/workflows/ci.yml
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
pnpm emulators:validate
```

## 6. Dependencies Added

None. No `package.json` in any workspace was touched. (`gh` and `actionlint` were installed as local developer/CI-authoring tools via Homebrew — not repository dependencies, not referenced by any script, and not committed anywhere in the repository.)

## 7. Configuration Changes

- New: `.github/workflows/ci.yml` (CI pipeline configuration — see §8 for full step-by-step rationale).
- No existing configuration file (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `eslint.config.js`, `.prettierrc`, `firebase.json`, `.husky/pre-commit`, `playwright.config.ts`) was modified.

## 8. Workflow Design Rationale

- **Single job, sequential steps** (not multiple parallel jobs) — keeps the pnpm store cache, `node_modules`, and build output (`apps/web/dist`, `functions/lib`) available to every later step without needing inter-job artifact passing, and keeps individual step failures independently attributable in the Actions UI (per the prompt's explicit requirement).
- **pnpm before Node:** `pnpm/action-setup@v4` (pinned `9.15.9`, matching the root `package.json` `packageManager` field exactly) runs before `actions/setup-node@v4` so that Node's built-in `cache: pnpm` option can detect pnpm on `PATH`. This built-in cache mode *is* "restore/save a pnpm store cache keyed on the hash of `pnpm-lock.yaml`" — it is the standard, current way to achieve exactly that requirement, used instead of a hand-rolled `actions/cache` step for less workflow-file surface area to maintain.
- **Node pinned to `20`**, matching root `engines.node: ">=20"` and `functions/package.json`'s `engines.node: "20"` exactly.
- **Explicit `java -version` step** before the emulator step, per prompt §4.4 — verifies the Firestore Emulator's JRE dependency in the CI log itself rather than assuming GitHub's `ubuntu-latest` image includes one. No `actions/setup-java` step was added speculatively; one will be added only if this verification step, or the emulator step immediately after it, is observed to fail in the actual CI run (see §14 for that observed outcome).
- **Failure-artifact upload is a single final step**, `if: failure()`, uploading `playwright-report/`, `test-results/`, and both emulator debug logs with `if-no-files-found: ignore` (since not every failure mode produces every file).
- **`workflow_dispatch` added** alongside `push`/`pull_request`, per the optional consistency improvement from ENG-P0-001's closure-correction task — a manual rerun path requiring no secret, explicitly documented as a convenience and not a substitute for the PR route.
- **Zero secrets required anywhere in the pipeline** — confirmed by inspection: no step references `secrets.*`, `GITHUB_TOKEN` beyond the implicit checkout token GitHub provides automatically, or any credential. The Firebase Emulator Suite runs exclusively against the `demo-11thonus` fake project ID.
- **Workflow YAML validated with `actionlint`** (installed locally via Homebrew for this purpose) — zero findings.

## 9. Tests and Results

All commands from the prompt's §11 Verification Commands, run locally before commit:

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ "Lockfile is up to date, resolution step is skipped" |
| `pnpm build` | ✅ both workspaces build |
| `pnpm lint` | ✅ zero errors, zero warnings |
| `pnpm format:check` | ✅ "All matched files use Prettier code style!" |
| `pnpm typecheck` | ✅ both workspaces, strict mode |
| `pnpm test` | ✅ 2 files / 2 tests passed |
| `pnpm exec playwright install --with-deps chromium` | ✅ (browser already present from a prior session; command is idempotent) |
| `pnpm test:e2e` | ✅ 1 passed |
| `pnpm emulators:validate` | ✅ Auth/Functions/Firestore/Hosting/Storage all started against `demo-11thonus`; `ping` loaded; smoke script exited 0; clean shutdown |
| `actionlint .github/workflows/ci.yml` | ✅ zero findings |

**The actual CI run triggered by this work package's own pull request is the primary acceptance evidence for the workflow itself** (per prompt §10/§11) — its real, observed per-job result is recorded in §14 below, not assumed from the local dry-run above.

## 10. Migrations

None.

## 11. Risks

- The Firestore Emulator's CI reliability (prompt §4.4) was investigated by adding an explicit `java -version` verification step rather than speculatively pre-installing a JDK — the real answer comes from the actual CI run (§14), not a guess.
- `gh` (GitHub CLI) was installed on this machine specifically to open the pull request for this work package; it is a local tool, not part of the repository, and requires the operator's own GitHub authentication to function — see §14 for how this was handled.
- No new risk to the application/tooling surface — nothing in `apps/`, `functions/`, or the existing root config was touched.

## 12. Unresolved Issues

- Whether the Firebase Emulator Suite step is reliable in CI without further changes is answered empirically by the actual CI run — see §14 for the observed result. If it proves unreliable, a follow-up correction (not performed in this work package) would be needed, per the prompt's own §6.11 guidance.

## 13. Rollback Instructions

Every file this work package created or modified, individually:

- **Delete** `.github/workflows/ci.yml`.
- **Delete** `.github/PULL_REQUEST_TEMPLATE.md`.
- **Delete** `docs/05-implementation/reports/TEMPLATE.md`.
- **Delete** `docs/changes/ENTRY_TEMPLATE.md`.
- **Delete** `docs/05-implementation/reports/ENG-P0-002-implementation-report-2026-07-17.md` (this file).
- **Revert** the new entry appended to `docs/changes/IMPLEMENTATION_CHANGES.md` (remove only the ENG-P0-002 section added at the bottom; do not touch any entry above it).
- **Revert** the ENG-P0-002 row/status edits made to `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` and `docs/05-implementation/change-tracking/engineering-implementation-programme.md` back to their prior `Ready` state (no Implementation Report link, no commit hash).

If the commit implementing this work package has already been pushed and merged, rollback is a `git revert <commit-hash>` (never a rewrite of shared history), which reverses exactly the file set above in one new commit.

## 14. CI Run Result and Persistent Engineering Changes-Log Update

**Pull request:** [`#1`](https://github.com/Fkenogo/11THONUS/pull/1) (`feat/eng-p0-002-ci-foundation` → `main`), opened by the Founder once `gh` was authenticated on this machine.

**Original run — failed:** [`29608691029`](https://github.com/Fkenogo/11THONUS/actions/runs/29608691029) (triggered by commit `0cac74a`).

- Every step through `Playwright e2e` and `Verify Java runtime (required by the Firestore Emulator)` passed. The `Verify Java runtime` step itself only printed the version present (`openjdk 17.0.19`, Temurin) — it did not assert a minimum, so it passed even though the version was insufficient for the next step.
- **Failed step:** `Firebase Emulator Suite validation`.
- **Actual error** (from `gh run view 29608691029 --log-failed`, not the summary page): `Error: firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above to get a compatible runtime.`
- **Root cause:** GitHub's `ubuntu-latest` runner's default `java` on `PATH` resolves to Temurin 17. `firebase-tools`' bundled Firestore Emulator now requires Java 21+. This is a genuine CI-only environment difference — this machine's local Java is version 25, so the same command never failed locally, and no amount of local re-validation would have caught it.

**Correction:** added one step, `Set up Java (JDK 21+ required by the Firestore Emulator)` (`actions/setup-java@v4`, `distribution: temurin`, `java-version: "21"`), immediately before the existing `Verify Java runtime` step in `.github/workflows/ci.yml`, so that step now verifies the corrected version rather than the runner's stale default. No other step, script, or file was touched.

**Correction commit:** [`4f625b1`](https://github.com/Fkenogo/11THONUS/commit/4f625b1) — `fix: correct ENG-P0-002 CI failure [ENG-P0-002, DEC-TECH-004]`, 1 file changed (`.github/workflows/ci.yml`, +11/-5).

**Rerun — passed:** [`29609566311`](https://github.com/Fkenogo/11THONUS/actions/runs/29609566311), triggered automatically by the push to the existing PR branch (no new PR was created). Final per-step result, all ✅:

| Step | Result |
|---|---|
| Set up job | ✅ |
| Checkout | ✅ |
| Set up pnpm | ✅ |
| Set up Node | ✅ |
| Install dependencies (frozen lockfile) | ✅ |
| Build | ✅ |
| Lint | ✅ |
| Format check | ✅ |
| Typecheck | ✅ |
| Unit / component tests | ✅ |
| Install Playwright browsers | ✅ |
| Playwright e2e | ✅ |
| Set up Java (JDK 21+ required by the Firestore Emulator) | ✅ (new step) |
| Verify Java runtime (required by the Firestore Emulator) | ✅ — now correctly reports 21 |
| Firebase Emulator Suite validation | ✅ |
| Upload failure diagnostics | — skipped (`if: failure()`, correctly did not run) |
| Complete job | ✅ |

Total run time 1m40s. `gh pr checks 1` confirms: `Build, Lint, Test, Emulator Validation — pass`.

**Minor, non-blocking annotation observed on both runs** (informational, not a failure): GitHub's own log notes several actions (`actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`, and now `actions/setup-java@v4`) target Node.js 20 internally but are "being forced to run on Node.js 24" by the runner — this is about the JavaScript runtime the *actions themselves* execute in, unrelated to this repository's own `node-version: "20"` application target, which remains correct and unaffected. Tracked as a future action-version-bump item, not an ENG-P0-002 defect.

**Persistent Engineering Changes-Log Update:** see the CI-failure-and-fix addendum appended to the ENG-P0-002 entry in [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md).

---

## Status

Implemented, locally validated, and now confirmed by a real, passing CI run on its own pull request ([`#1`](https://github.com/Fkenogo/11THONUS/pull/1), run [`29609566311`](https://github.com/Fkenogo/11THONUS/actions/runs/29609566311)) — satisfying TRD22 §22.10's "CI passes" exit criterion with actual evidence, not a local-only claim. **Not marked complete** — Technical Review and the pull request's merge decision remain distinct, not-yet-taken actions; this report does not merge PR #1.
