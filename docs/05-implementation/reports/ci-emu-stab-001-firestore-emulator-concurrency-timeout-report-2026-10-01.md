# CI-EMU-STAB-001 — Firestore Emulator Concurrency Test Timeout — Report

> **Date:** 2026-10-01 · **Status:** Implemented — pending review · **Classification:** Working (CI/test-stability record)
> **Base `origin/main`:** `94fa71e6516ab5376fa355eaf9f771db6fa01aa9` · **Branch:** `claude/ci-emulator-stability`

**In one paragraph.** Two CI attempts of PR #291 failed only in Firebase Emulator Suite validation, each with `Test timed out in 5000ms`, in two different, unrelated tests. The cause is not those tests: about 38 emulator tests race two Firestore transactions on one document, the Firestore Node SDK aborts and retries the loser with backoff, and the race therefore takes 2.5–4.3 s even on an idle machine — most of Vitest's 5 s default. The fix is one setting in the emulator-suite Vitest config: `testTimeout: 15000`. No assertion, retry, concurrency or product code changed.

## 1. Evidence (measured before editing)

| Question | Finding |
|---|---|
| Which operation was waiting? | Two concurrent `runTransaction` calls on the same document (`Promise.allSettled([attempt, attempt])`) in both failing tests |
| Missing await / cleanup collision? | No: both tests `await` correctly; the suite already runs files serially (`fileParallelism: false`) |
| Bare-SDK probe (no repository code), 60 rounds of two contending transactions | min **2.54 s**, p50 **3.16 s**, p95 3.52 s, max **4.26 s**; each loser executes its transaction body **twice** (SDK abort + retry with backoff) |
| Full emulator suite durations (CI-equivalent run) | 44 tests ≥ 1 s; the slowest ~3.7 s; 39 tests ≥ 2 s, all concurrency races; 38 of them with the default timeout |
| Two failing tests, locally ×12 together | 2.6–3.6 s each — already ~70 % of the budget on an idle machine |
| Why it flakes | Backoff + emulator lock wait is a ~2.5 s floor with a random tail; any slower CI runner pushes some test over 5 s. The victim moves because every such test has the same exposure |
| Is the repository precedent consistent? | Yes: the slowest concurrency emulator tests already carry explicit 15 s–30 s per-test timeouts (`staffRoleChangeCommand`, `staffPermissionOverrideCommand`, `staffInvitation`, …) |

**Not PR #291.** PR #291 changes no file under `commerceKnowledge`, `identity`, or any emulator test or config; both failing files are Firestore-emulator only (no PostgreSQL). Its PostgreSQL, web and other 65 emulator files passed in both CI attempts.

## 2. Change

`functions/vitest.emulator.config.ts`: `testTimeout: 15000`, with the measurement above recorded in a comment.

- **Timeout changed:** yes, emulator-suite default 5 s → 15 s. Chosen because 15 s is the value this repository already uses for its slowest concurrency emulator tests, ≈3.5× the worst measured idle time. A real hang still fails (after 15 s).
- **Why config-level, not two per-test edits:** 38 tests share the exposure; editing only the two that happened to fail would leave CI failing on the next victim (already two different victims in two runs).
- **Scope limit:** only the emulator config. `vitest.config.ts` (unit) and `vitest.postgres.config.ts` are untouched.
- **Retries changed:** no. **Emulator startup/readiness changed:** no (readiness was not the cause). **Test concurrency changed:** no. **Assertions:** none touched. **Dependencies:** none. **CI workflow:** none.

## 3. Validation

All local, against the Firestore/Auth emulators; no shared or production Firebase project touched; nothing deployed.

| Check | Result |
|---|---|
| Config effective (canary 6 s test) | before: `Test timed out in 5000ms`; after: passes |
| Targeted `knowledgeTagRepository` ×10, `identityLifecycleRepository` ×10, both together ×12, **with 4 CPU-burning processes on a 4-core machine** | 32/32 runs pass |
| Full emulator suite, exact CI command (`pnpm emulators:validate`) ×2 | 66 files, 867 passed, 3 skipped — both runs |
| Build, lint, format, typecheck, unit, PostgreSQL, Playwright | see §4 |

Honesty note: I could not reproduce the 5 s failure locally even under CPU load (max 3.6 s), so the claim is "the default leaves ~1.5 s of headroom at the median and CI is demonstrably slower", supported by the bare-SDK distribution and two real CI failures — not a reproduced failure.

## 4. Full validation

Run in the isolated worktree on this branch against a disposable PostgreSQL 16 and the Firebase emulators:

| Check | Result |
|---|---|
| `pnpm build` | pass |
| `pnpm lint` | 0 errors; 1 pre-existing `apps/web` warning |
| `pnpm format:check` | pass |
| `pnpm typecheck` | pass |
| `pnpm test` (unit/component) | functions 1935/1935, apps/web 919/919 |
| PostgreSQL suite (fresh DB, under the Firestore Emulator) | 17 files, 565/565 |
| Playwright (`chromium` + `chromium-dashboard-harness`) | 41/41. The preinstalled Chromium is build 1194 while the repo's Playwright wants 1228, so it was run through an **untracked** local config pointing at the installed binary; nothing about this was committed |
| `pnpm emulators:validate` ×2 | 66 files, 867 passed, 3 skipped (both) |

## 5. Risks and rollback

- **Risk:** a hanging emulator test now takes 15 s rather than 5 s to fail. Accepted; the suite already uses 15–30 s for its slowest tests.
- **Risk:** the fix removes a flake class but not the underlying SDK backoff; a future very slow runner could still exceed 15 s (≈3.5× margin).
- **Rollback:** `git revert` the commit.

## 6. Unblocking PR #291

Merge this PR (or cherry-pick the one-line config change), update PR #291's branch onto the corrected `main`, and run one clean CI pass.
