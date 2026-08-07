> **Title:** CI Infrastructure Exception Record — PR #70 (`ENG-P2-ARCH-CORR-004`)
> **Version:** 1.0 · **Status:** Founder-authorised, PR #70 only · **Classification:** Working (execution-layer exception record)
> **Source-of-truth path:** `docs/05-implementation/reports/ci-infrastructure-exception-record-pr-70-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (created)

# CI Infrastructure Exception Record — PR #70

**Scope: this exception applies to PR #70 only. It does not change the repository's normal CI policy, and does not apply to any other PR, past or future.**

## 1. Purpose

GitHub-hosted CI was repeatedly unable to acquire a runner for PR #70 over an extended period. The failure occurred *before* any repository step executed, so it provides no evidence of a code or test failure. The Founder authorised a one-time, PR-#70-only CI Infrastructure Exception: merge may proceed on the basis of a complete CI-equivalent validation run locally against the exact reviewed head, with this record documenting the evidence.

## 2. Pull Request

- **PR:** [#70](https://github.com/Fkenogo/11THONUS/pull/70)
- **Branch:** `fix/eng-p2-arch-corr-004-remaining-findings-reconciliation`
- **Reviewed head SHA (CI-equivalent validation target):** `e75cfcd056cdf8cdbd8225d5b998a05444c52b36`
- **Base:** `main` at `2b0131e9f38bdcd39e7f28ab45569d4cbb989edf`

## 3. GitHub Actions Infrastructure Failure

- **Failed run ID:** `31124545388` (workflow "CI", event `pull_request`, head `e75cfcd`).
- **Infrastructure failure message (annotation):** *"The job was not acquired by Runner of type hosted even after multiple attempts."*
- **Nature:** pre-execution runner-allocation failure. Job step list was empty (`steps: []`) — no repository step (`build`, `lint`, `typecheck`, tests, emulator) ever started, so the failure is strictly infrastructure, not a code or test failure.
- **Duration / retry history:**
  - Attempt 1: created `2026-08-06T17:55:37Z`, `queued` for ~15 minutes, concluded `failure` at `2026-08-06T18:10:43Z` with the runner-allocation annotation above.
  - Manual re-run triggered (`gh run rerun 31124545388`); re-queued at `2026-08-06T18:12:09Z` and remained `queued` without acquiring a runner across an extended additional observation window.
  - No repository-executed step ever failed at any point.

## 4. Local CI-Equivalent Validation

Run against the exact reviewed head `e75cfcd056cdf8cdbd8225d5b998a05444c52b36` in the isolated worktree, mirroring every step of `.github/workflows/ci.yml`:

| CI step | Command | Result |
|---|---|---|
| Install (frozen lockfile) | `pnpm install --frozen-lockfile` | exit 0 |
| Build | `pnpm build` (both workspaces) | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Format check | `pnpm format:check` | exit 0 (all files Prettier-compliant) |
| Typecheck | `pnpm --filter functions exec tsc --noEmit` | exit 0 |
| Unit / component (functions) | `pnpm --filter functions exec vitest run` | 400/400 (54 files) |
| Unit / component (web) | `pnpm --filter web exec vitest run` | 259/259 (30 files) |
| Playwright browsers | `pnpm exec playwright install chromium` | exit 0 |
| Playwright e2e | `pnpm test:e2e` | 1/1 passed |
| Firebase Emulator Suite | `pnpm emulators:validate` (`firebase emulators:exec ... test:emulator`) | 172/172 (13 files), script exited code 0 |

**Every CI-equivalent check passed.** No repository step failed locally.

## 5. Change-Set Confirmation

- Diff `2b0131e..e75cfcd` is **12 files, comments/docs only** (+333 / −8): 7 source files (comment-only additions, verified — every changed `.ts` line is a `*`/`//` comment or blank) plus 5 documentation files (Architecture Review Report finding statuses, correction report, Master Workflow entry, `IMPLEMENTATION_CHANGES.md`, `documentation-changes-log.md`).
- **No production behaviour change.**
- **No Rules, indexes, Firebase configuration, dependency, workflow, or `.env` change** (targeted path grep returned none).
- **No deployment.**

## 6. Governance-State Confirmations (at exception time)

- F1–F4 remain corrected.
- F5, F7, F8 recorded per the approved documentation corrections.
- F6 and F9a explicitly accepted as-is (not described as code fixes).
- **F9b remains "Requires Founder decision."**
- F10 accepted deferred defense-in-depth risk; F11 deferred with rationale.
- `ENG-P2-001-02` remains outstanding; `DEC-PROD-012` remains `OPEN_FOUNDER`.
- **Customer Profile, Authentication, and ITM remain unauthorised.**

## 7. Founder Exception Authorisation

The Founder issued a "PR #70 CI Infrastructure Exception" authorisation: given the persistent pre-execution runner-allocation failure (no evidence of a code/test failure), and conditional on independent reverification plus a complete local CI-equivalent validation against the exact reviewed head (all recorded above), merge of PR #70 is authorised. The authorisation is explicitly scoped to PR #70 only and does not alter the repository's normal CI policy.

## 8. Post-Merge CI Note

Per the authorisation, post-merge CI on `main` will be attempted/observed, but the merge will **not** be rolled back solely because GitHub again fails to allocate a runner (an infrastructure condition, not a code failure).

## 9. Applicability Statement

**This exception applies to PR #70 only.** It is not a precedent, does not modify `.github/workflows/ci.yml` or any branch-protection/CI policy, and does not apply to any other pull request.
