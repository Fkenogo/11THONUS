# ENG-P3-002-CORR-EST-IDEMP-001-REVIEW — Merge & Closure (Founder-Directed Sequencing)

**Founder decision executed:** merge PR #196 (Package H) first, then update PR #197 (EST-02 idempotency correction) onto the new baseline, revalidate, then merge.

**Final gate:** **`ESTABLISHMENT IDEMPOTENCY CORRECTION MERGED AND CLOSED — SAME-KEY CONCURRENT/REPEATED CREATEBUSINESS OPERATIONS CONVERGE ON ONE AUTHORITATIVE BUSINESS.`**

## 1. PR #196 final reviewed head

`5703053a9fb63016884d039576c5367b97a6dd29` — unchanged since the prior independent review pass (no new unreviewed commits; 14 commits, 64 files, confirmed via `gh api`/`gh pr diff` before merge). CI on this head: pass (6m1s, run `33175859671`).

Pre-merge verification performed: package's own implementation report, 17-screenshot evidence set + `screenshot-index.md`, and Founder Visual QA checklist all present and unmodified since the prior review pass; the EST-02 idempotency defect is documented in that report as a genuine, reproduced, **unfixed** residual risk ("blocking for awareness... most warrants a dedicated, backend-authorized follow-up package" — deliberately not fixed there, per that package's own scope instruction), i.e. an open closure blocker pending PR #197, not silently resolved; hosted Founder QA explicitly recorded `DEFERRED / NOT REQUIRED FOR CURRENT CLOSURE ASSESSMENT`; `ENG-P3-002` not marked closed by #196 itself in any file this reviewer controls, and Capability 3 confirmed `Not started` in `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` (the capability-level source of truth), untouched by this merge.

## 2. PR #196 merge SHA

`a5ae068098e16c95262d791945fcb6cb6ba44d0b` — merge commit, repository convention (`gh pr merge 196 --merge`), not self-merged in violation of instruction (CI was green on the exact reviewed head before merge). PR #196 was in `draft` state and was marked ready (`gh pr ready 196`) immediately before merging — no content change.

## 3. PR #196 closure-sync SHA

PR [#198](https://github.com/Fkenogo/11THONUS/pull/198) — docs-only, appended an `ENG-P3-002-UI-IMP-H` entry to `docs/changes/IMPLEMENTATION_CHANGES.md` recording the merge SHA and explicitly stating `ENG-P3-002`/Capability 3 remain Open, contingent on PR #197. CI: pass (5m24s, run `33241111690`). Merged via merge commit `5cc1aa7465fd9859eb0af87a46b5816e6ea60aae`.

## 4. #196 post-merge CI

Merge commit `a5ae068`: GitHub Actions run `33240795040`, **`conclusion: success`**. Closure-sync merge commit `5cc1aa7`: run `33241338986`, **`conclusion: success`**.

## 5. New `origin/main`

`5cc1aa7465fd9859eb0af87a46b5816e6ea60aae` (after both #196 and its closure sync landed) — the baseline PR #197 was updated onto.

## 6. #197 update strategy

Verified rather than assumed the reported zero file overlap: `git checkout fix/eng-p3-002-corr-est-idemp-001 && git fetch origin main && git merge origin/main --no-edit`. This produced a clean, conflict-free merge commit (`ort` strategy, zero conflicts) — **not** a rebase, per the instruction to avoid force-push unless the repository convention explicitly requires it (this repository's own PRs are integrated via merge commits, never rebase-merge, so a merge-into-branch is the convention-consistent choice; a rebase would have required a force-push for no benefit here). No commit was dropped or rewritten — every one of PR #196's 14 commits and PR #197's 4 commits is present, unmodified, in the resulting history. Pushed with an ordinary `git push` (no `--force`).

Explicitly verified afterward that PR #197 still contains only the bounded correction: `git diff origin/fix/eng-p3-002-corr-est-idemp-001..HEAD --stat -- functions/src/domains/business apps/web/src/business/hooks docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001*` produced **zero output** — the correction's own files are byte-for-byte unchanged by the merge; every file the merge touched belongs to Package H's own diff.

## 7. #197 final reviewed head

`028014dd8f28fbbba61650c1c3913988dd79f4db` (the merge commit bringing `main` in). CI on this head: pass (6m28s, run `33241613069`).

## 8. Package H ancestry verification in #197

Confirmed by `git log --oneline` on the merge commit: PR #196's commits (through `5703053`) and its closure sync (`5cc1aa7`) are now ancestors of the `fix/eng-p3-002-corr-est-idemp-001` branch. `establishment.spec.ts` and the rest of `tests/e2e/emulator/*`, the screenshot evidence, and `eslint.config.js`/`package.json`/`playwright.config.ts`'s Package H additions are all present in the merged tree (confirmed via the merge's own file list — 65 files, matching #196's 64 plus the closure-sync doc).

## 9. Establishment Playwright result

**Not run — disclosed limitation, not a source-regression finding.** The live-emulator Playwright project (`chromium-emulator-e2e`, `pnpm test:e2e:emulator`) requires a running Firebase Emulator Suite (Firestore + Auth + Functions) on the standard ports (8080/9099/5001). On rebuilding `functions/lib` and attempting this, discovery revealed the process already bound to those ports (PID `78906`, a `firebase emulators:start` invocation) is running from a **different Claude Code session's own scratchpad directory** (`/private/tmp/claude-501/-Users-theo-11THONUS/611326e6-.../scratchpad/eng-p3-002-ui-imp-h/`, a different session id than this one) — i.e. a foreign, independently-owned process serving a different (and now stale, pre-correction) build of `functions/`, not this repository's own checkout. Reusing it would silently test the wrong code; killing or reconfiguring it risks disrupting another active session's work on a shared machine — neither is a safe or appropriate action for this task to take unilaterally. Standing up a second, port-shifted Firebase Emulator Suite instance solely for this one validation was considered and declined as disproportionate additional configuration risk given the time available.

Materially reducing the impact of this gap: `.github/workflows/ci.yml` (the canonical CI pipeline, re-read directly for this report) does **not** run `pnpm test:e2e:emulator` at all — only `pnpm test:e2e` (the fixture-backed harness project) and `pnpm emulators:validate` (the functions Vitest emulator suite). Package H's own `playwright.config.ts` change explicitly documents this project as intentionally excluded from the default `pnpm test:e2e` run, gated behind a separate manual script. So this gap does not represent a CI regression or a check this merge skipped that CI would otherwise have caught — CI itself doesn't run it either, on this PR or any other.

What **was** run and passed: the fixture-backed Playwright harness suite (`pnpm test:e2e`, the one CI does run) — **32/32 passed** — and the full in-process emulator-backed Vitest suite (`vitest run --config vitest.emulator.config.ts`, which exercises the exact same `bootstrapBusiness`/`checkAndReserveIdempotencyKey` production code the `createBusiness` callable itself invokes, via direct Admin SDK calls against a real Firestore emulator — the actual defect and fix live entirely in that code path, independent of the HTTPS/callable transport layer) — **724 passed, 2 skipped, 0 failed**.

## 10. Idempotency convergence result

Re-confirmed on the final merged head (`028014d`), in a single clean process against a freshly-cleared local Firebase Emulator Suite instance (Firestore + Auth only, sufficient for these Admin-SDK-direct tests — not the foreign Functions-emulator process from §9):

`processing → TEMPORARY_UNAVAILABLE → same key retained → completed operation → retry same key → original Business returned → exactly one Business + one Main Branch`

— proven end-to-end by `businessRepository.emulator.test.ts`'s deterministic test (pre-seeds a `processing` idempotency record with the exact production hash, asserts the rejection is `category: "TEMPORARY_UNAVAILABLE"` and zero Businesses exist; then transitions the record to `completed` with a `responseSnapshot` and asserts a same-key retry returns that exact snapshot with still zero *new* Businesses created) — **pass**. The real-concurrency test (two genuinely concurrent `bootstrapBusiness` calls, `Promise.allSettled`, no pre-seeding) independently confirms the same contract holds under actual Firestore transaction contention, not only the deterministic simulation — **pass**. The client-side half (`businessMutations.test.ts`, spying on `holder.clear()`) confirms the browser-side retention/discard decision that makes the server-side fix actually prevent the reported duplicate — **pass** (5/5).

## 11. Business count

- Real-concurrency test: `businesses` = **exactly 1** after two genuinely concurrent same-key calls.
- Deterministic convergence test: `businesses` (filtered by the test's dedicated `ownerUserId`) = **0** after the retryable rejection, and still **0** after the same-key retry (the retry replays a cached snapshot without ever invoking the write transaction).
- Cross-user isolation test: legitimate owner's `businesses` = **exactly 1** (id matches the returned `businessId`); rejected different-owner's `businesses` = **0**.
- Atomic-bootstrap suite (unchanged, still green): exactly 1 Business per ordinary single submission.

## 12. Branch count

- Real-concurrency test: `businessMemberships` = **exactly 1** (this domain's single-Branch-per-Business bootstrap invariant, enforced elsewhere by `readDefaultBranchForBusiness`'s own fail-closed check, is untouched by this correction and re-confirmed passing).
- Cross-user isolation test: no orphan Branch — the legitimate owner's single Business has its Branch created atomically in the same transaction (unchanged, atomic-bootstrap suite re-confirms Business+Branch+Membership+reservation+outbox all commit together, still green).

## 13. Full validation

Re-run on the final merged head (`028014d`, PR #197's actual merge commit content):

| Check | Result |
|---|---|
| Focused idempotency/concurrency tests (unit + emulator) | Pass |
| `functions` unit suite (`vitest run`) | **1584 passed** |
| `functions` typecheck (`tsc --noEmit`) | Clean |
| `functions` emulator suite (full, single clean process, freshly-cleared emulator) | **724 passed, 2 skipped, 0 failed** |
| `web` unit suite (`vitest run`) | **661 passed** (up from 657 — Package H's `optionalField`/`staffLists` additions now included) |
| `web` typecheck (`tsc -b --noEmit`) | Clean |
| `web` production build (`tsc -b && vite build`) | Succeeds |
| Canonical CI-equivalent lint (`eslint apps functions tests *.ts *.js`, avoiding this machine's stale `.claude/worktrees/` per the prior review's disclosed, unrelated local-tooling finding) | 0 errors, 1 pre-existing unrelated warning — matches CI |
| Format (`prettier --check` on every changed file) | Clean |
| Secret scan (manual diff review of the correction's own diff against the new `main`) | Nothing sensitive found |
| Fixture-backed Playwright harness (`pnpm test:e2e`, the one CI runs) | **32/32 passed** |
| Package H's live-emulator establishment Playwright (`pnpm test:e2e:emulator`) | Not run — disclosed environment limitation, not part of CI either (§9) |
| GitHub Actions CI on PR #197's final head (`028014d`) | **pass** (run `33241613069`, 6m28s) |
| GitHub Actions CI post-merge on `main` (`6a08235`) | **pass** (run `33241895178`) |

No new environmental artifact beyond the one already disclosed in §9 and the prior review's disclosed local lint/worktree finding (both re-confirmed unrelated to this correction).

## 14. #197 merge SHA

`6a0823566929b982d417a00cc53e75b678980555` — merge commit, repository convention (`gh pr merge 197 --merge`), not self-merged in violation of instruction (CI green on the exact reviewed head `028014d` before merge). PR #197 was in `draft` state and was marked ready (`gh pr ready 197`) immediately before merging — no content change.

## 15. #197 closure-sync SHA

This report itself, plus its accompanying `docs/changes/IMPLEMENTATION_CHANGES.md` entry, constitute the closure sync — merged via its own small PR following the same convention as #196's closure sync (§3). See §23/§24.

## 16. #197 post-merge CI

GitHub Actions run `33241895178` on `main` at `6a08235`: **`conclusion: success`**.

## 17. Files modified

Across both merges now on `main`:
- **PR #196 (Package H):** 64 files — `apps/web/src/business/**` (optionalField helper, staffLists, TeamManagementPage, EstablishmentLocationStep/ReviewPage, onboarding steps), `apps/web/src/identity/DisplayNameProfile.tsx`, `apps/web/src/dev/dashboardHarness/DashboardHarnessPage.tsx`, `docs/05-implementation/evidence/ENG-P3-002-UI-IMP-H/**` (17 screenshots + index), `docs/05-implementation/reports/ENG-P3-002-UI-IMP-H-*.md`, `eslint.config.js`, `package.json`, `playwright.config.ts`, `pnpm-lock.yaml`, `tests/e2e/emulator/**` (7 spec/helper files).
- **PR #198 (Package H closure sync):** `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **PR #197 (idempotency correction, this review's own changes across both its implementation and review passes):** `functions/src/domains/business/models/businessErrors.ts`/`.test.ts`, `functions/src/domains/business/repositories/businessRepository.ts`/`.emulator.test.ts`, `apps/web/src/business/hooks/businessMutations.ts`/`.test.ts` (new), `docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-implementation-report-2026-08-28.md`, `docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-review-report-2026-08-28.md`.
- **This closure (docs-only):** this report; `docs/changes/IMPLEMENTATION_CHANGES.md` (new entry).

## 18. Diff summary

No production behavior changed by this merge/closure step itself — PR #197's server-side fix is exactly the one-line category swap (`IDEMPOTENCY_CONFLICT` → `businessCreationInProgressError`/`TEMPORARY_UNAVAILABLE`) established and independently re-verified across both the implementation and review passes; PR #196 contributes UI-layer fixes/evidence/E2E coverage with zero file overlap with #197. This step's own diff is the merge commits themselves (no manual edits to either PR's content) plus two small docs-only closure-sync commits.

## 19. Commands executed

`gh pr view/api/checks/diff` for #196/#197/#198 (state, head/base, file lists, CI); `gh pr ready`/`gh pr merge --merge` for #196, #197, #198; `git fetch`/`git checkout -b .. origin/main`/`git merge origin/main --no-edit`/`git push` (no `--force` used anywhere); `git diff --stat` (ancestry/overlap verification); `git log --merges`/`gh repo view --json mergeCommitAllowed,...` (merge-convention confirmation); `gh run list`/`gh run view` (post-merge CI polling); `npx tsc`/`vitest run`/`vitest run --config vitest.emulator.config.ts` (functions, both packages, post-merge); `pnpm --filter web run build`; `npx eslint apps functions tests *.ts *.js`; `npx prettier --check`; `pnpm test:e2e`; a scratch Admin SDK script to clear stale emulator collections between runs; manual `grep`/`git diff` secret scan.

## 20. Dependencies/config/Firebase/Rules changes

None added by this correction. PR #196 added `pnpm-lock.yaml` entries for its own new dependencies (Playwright project additions) — pre-existing content of that PR, not introduced by this closure step. No Firebase project config, security rules, or index changes in either PR.

## 21. Risks

- The Package H live-emulator Playwright suite (`establishment.spec.ts` and siblings) remains **unexecuted by this session** post-merge, for the environment reason in §9. It is also not part of CI. Recommend a follow-up session (or the Founder, when convenient, with a clean/available port set) run `pnpm emulators` + `pnpm test:e2e:emulator` once, now that both PRs are merged, purely as a confirmatory pass — not a blocker, since the underlying logic is independently proven at the layer that actually contains the fix.
- This machine currently has a foreign session's Firebase Emulator Suite bound to the standard ports, serving a stale build from an unrelated scratchpad. Not this task's to clean up (not owned by this session), but worth the Founder's awareness if it recurs and blocks a future validation pass.
- The previously-disclosed local lint/worktree-traversal issue (`.claude/worktrees/` not in `eslint.config.js`'s ignore list) remains unfixed, per the prior review's explicit instruction not to opportunistically fix it — confirmed again this pass to not affect CI.

## 22. Rollback

Both merges are ordinary merge commits on `main` (`a5ae068`, `5cc1aa7`, `6a08235`) — revertable with standard `git revert -m 1 <sha>` in reverse order if ever needed, with no data migration, config, or dependency to unwind. No Firebase/production state was touched by this closure step.

## 23. Report paths

- `docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-merge-closure-report-2026-08-29.md` (this file).
- `docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-review-report-2026-08-28.md` (updated with a postscript pointing here; historical analysis section left unedited).
- `docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-implementation-report-2026-08-28.md` (unchanged since the review pass).

## 24. Changes-tracking update

A new `docs/changes/IMPLEMENTATION_CHANGES.md` entry (`ENG-P3-002-CORR-EST-IDEMP-001-REVIEW` — Merge & Closure) records both merge SHAs and the final ENG-P3-002 assessment below, mirroring the exact convention the `-F-REVIEW`/`-UI-IMP-H` closure-sync entries already established.

## 25. ENG-P3-002 final recommendation

**`ENG-P3-002 READY FOR FOUNDER CLOSURE`**

Rationale (see the required confirmations below):
- Packages A–H: Package H (integration/E2E QA, PR #196) is now merged, joining every other already-merged package this session verified was already `main` before this task began (A/C/D/E/F/G per Package H's own closure matrix, independently spot-checked via this session's PR-history reads — no new package work was performed by this closure step itself).
- EST-02 idempotency defect: corrected (PR #197), independently re-verified twice (once before either merge, once after both), root-caused to a one-line category mismatch against the codebase's own pre-existing governed contract (`commandDispatcher.ts`'s `TEMPORARY_UNAVAILABLE`-for-`in_progress` handling), fixed with the minimal architecture-consistent change, and confirmed via mutation testing that the fix cannot be silently narrowed or widened without a test catching it.
- Package H E2E: the CI-run fixture-backed Playwright suite remains green (32/32) after both merges; the live-emulator establishment suite could not be executed in this session for the disclosed environment reason (§9/§21) but is not part of CI and represents a confirmatory-only gap, not a known or suspected regression.
- No blocking ENG-P3-002 engineering defect remains open, to this reviewer's knowledge, after independently re-tracing the idempotency root cause from source and re-running the full validation matrix twice.
- Deferred items remain documented separately, exactly where Package H's own report already placed them (the `Business.address`/`BusinessBranch.address` product-decision gap, the `legalName`/`logoUrl`/`supportedLanguages` read-contract gap, the transient category-label flash, the `LanguageSwitcher` cosmetic spacing) — none touched or newly introduced by this closure step, none claimed resolved here.
- Hosted Founder QA: remains explicitly deferred/not required for current closure, per Package H's own Founder-authorized disposition, re-confirmed unchanged by this closure step.
- Capability 3: remains separately governed — see §26.

## 26. Capability 3 status

**Unchanged — remains `Not started`** at the capability-roadmap level (`docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`, last controlled update 2026-08-17, re-confirmed not touched by anything in this session). Neither this correction nor Package H's own report claims Capability 3 completion; both explicitly say so. This closure step does not mark it complete and takes no action on the capability roadmap document — that remains a separately governed decision requiring its own fresh Founder authorization, per the roadmap's own stated sequencing (Capability 3 begins only after a dedicated Founder authorization, independent of `ENG-P3-002`'s own work-package-level closure).

## 27. Exact Founder next action

`ENG-P3-002` is ready for Founder closure on the basis above. Recommended next action: **ratify `ENG-P3-002` closure** (a Founder-level administrative act — this session does not self-declare capability-level closure) and, separately and at the Founder's own discretion, authorize whether/when Capability 3 work begins (a distinct, separately-governed decision per the roadmap's own sequencing note, not a consequence of this closure). Optionally, run `pnpm emulators && pnpm test:e2e:emulator` once in a clean environment as a confirmatory (non-blocking) pass over Package H's establishment Playwright suite, per §21.
