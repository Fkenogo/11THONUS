# ENG-P3-002-CORR-EST-IDEMP-001-REVIEW — Independent Concurrency/Idempotency Review

**Gate:** `ESTABLISHMENT IDEMPOTENCY REVIEW BLOCKED — PR #196 (Package H, `ENG-P3-002-UI-IMP-H`) is open and draft; PR #197 does not contain it. Per this review's own Phase A/J instruction, this is a STOP-before-merge condition, not a technical merge conflict (zero file overlap, both independently green against the same `main` tip).`

The correction under review is sound and independently re-verified end-to-end (see below). It is **not merged** in this session, pending the Founder's decision on PR #196/#197 sequencing.

## 1. Entry PR/head/CI

- PR [#197](https://github.com/Fkenogo/11THONUS/pull/197), draft, base `main`.
- Entry head (from the prior implementation session): `37baf1e1e9dffdb5bb5e3dc8c9aff24d0f1b1e8d`. CI: pass (6m20s).

## 2. Final reviewed head

`c46e1d847bfb7858f2af926e96ad5fffc703da06` is the last commit changing test/production content (independent client key-retention test + cross-user isolation test + two report corrections on top of the entry head). Two further docs-only commits recording this review's own findings (`0fbf1cf`, `9bf12c8`) bring the actual branch tip to **`9bf12c856a768f088d2aaff1a044fe972bf215d3`** — CI re-ran automatically on each push and passed clean on this true final head too (run `33189188067`, 6m31s), so both the content-bearing commit and the actual tip are independently confirmed green. CI (run `33188177122`, against `c46e1d8`): first attempt **failed** on a single pre-existing, unrelated flaky test (`PhoneAuthHarnessPage.test.tsx > retry / resend flow > increments correctly across multiple retries` — a double-`fireEvent.click` timing race in a file this PR does not touch, last modified by an unrelated commit `607084c`); triggered a rerun of the same commit via `gh run rerun --failed`, which **passed clean** (6m56s). See §22/§24/§25 for full detail — reported per Phase M's instruction to separate environmental/tooling failures from source regressions, not glossed over.

## 3. Package H PR #196 disposition

**Correction to the prior implementation report:** "Package H" is **`ENG-P3-002-UI-IMP-H`** — PR [#196](https://github.com/Fkenogo/11THONUS/pull/196), title "integration, E2E QA & closure evidence" — **not** `ENG-P3-002-UI-IMP-F` (team-management UI, PR #193/#194, merged, unrelated). #196 is confirmed:

- state: `open`, **`draft: true`** (not even marked ready for review by its own author);
- head: `5703053a9fb63016884d039576c5367b97a6dd29`;
- base: `b2d7fd15be3b37c05cebded079375498e4a79506` — the exact same commit #197 branches from (both are sibling branches off the same `main` tip, neither is an ancestor of the other);
- own CI: pass;
- own `mergeable_state`: `clean`.

## 4. #197 ancestry/base result

- #197's base commit: `b2d7fd1` (current `main` tip at entry, confirmed unchanged throughout this review — `origin/main` was not advanced during this session).
- #196's commits are **not** ancestral to #197 (disjoint branches, same parent).
- File-level diff comparison (`gh pr diff --name-only` for both): **zero overlapping files** between #196 (64 files, including `playwright.config.ts` and `tests/e2e/emulator/*`) and #197 (6 files, all under `functions/src/domains/business/**` and `apps/web/src/business/hooks/**`). No merge-conflict risk either order.

## 5. Root-cause result

Independently re-traced the full path (Phase B) from source, not from the prior report's narrative:

`EST-02 submit` → `useCreateBusinessMutation` (`businessMutations.ts`) generates/reuses a held idempotency key via `IdempotencyKeyHolder` → `makeCallCreateBusiness`/`toCallWithActor` (`businessCallableClient.ts`) attaches `rawToken`/`referenceType`, calls the `createBusiness` callable, and on any thrown `FirebaseError` normalizes it to a `BusinessApiError` via `mapCallableErrorCode` (`authenticateClient.ts`) → server `createBusiness` (`index.ts:529`) → `handleCreateBusiness` → `bootstrapBusiness` (`businessRepository.ts`) → `checkAndReserveIdempotencyKey` (`idempotencyService.ts`, one atomic Firestore transaction on `idempotencyRecords/{key}`) → on `"in_progress"`, `bootstrapBusiness` threw `BusinessDomainError("IDEMPOTENCY_CONFLICT", …)` (pre-fix) → `toHttpsError` maps `IDEMPOTENCY_CONFLICT`'s category to HTTPS `aborted` (`index.ts`'s `CATEGORY_TO_HTTPS`) → client `mapCallableErrorCode` maps `functions/aborted` → `"conflict"` → `useCreateBusinessMutation`'s `onError` calls `settleKeyOnError`, which calls `isRetryableBusinessErrorCode("conflict")` → `false` → `holder.clear()`. Confirmed by direct code read, not report narrative.

**Independently confirmed, line by line:**
- `IDEMPOTENCY_CONFLICT` is non-retryable: `CATEGORY_TO_HTTPS.IDEMPOTENCY_CONFLICT = "aborted"` (`index.ts:138`) → client code `"conflict"` (`authenticateClient.ts:100-101`) → `isRetryableBusinessErrorCode` only returns `true` for `"unavailable"`/`"timeout"` (`businessCallableClient.ts:27-29`). ✅
- The client discards the held key for that category: `settleKeyOnError` (`businessMutations.ts`) calls `holder.clear()` whenever `!isRetryableBusinessErrorCode(code)`. ✅ Now also proven by a direct unit test (§11).
- `TEMPORARY_UNAVAILABLE` is retryable: `CATEGORY_TO_HTTPS.TEMPORARY_UNAVAILABLE = "unavailable"` → client code `"unavailable"` → `isRetryableBusinessErrorCode("unavailable") === true`. ✅
- The client retains the same key for that category: same `settleKeyOnError` logic, inverse branch. ✅ Proven by unit test (§11).
- `commandDispatcher.ts` already establishes this exact retryable contract for the analogous "operation still processing" condition: `dispatchCommand`'s `reservation.outcome === "in_progress"` branch returns `createPlatformError("TEMPORARY_UNAVAILABLE", "errors.idempotencyInProgress", correlationId, { retryable: true })` (`commandDispatcher.ts:161-169`), with an explicit existing unit test asserting `error: expect.objectContaining({ code: "TEMPORARY_UNAVAILABLE", retryable: true })` (`commandDispatcher.test.ts:155-171`) for exactly this reservation outcome. ✅ Not a convenient invention — a pre-existing, tested, governed contract `bootstrapBusiness` simply hadn't followed.

## 6. Error-contract result

Confirmed via mutation testing (§21) that the correction changes **only** the `in_progress` branch. The `conflict` branch (a same key, different `requestHash` — genuinely different request content or a different resolved owner) is untouched and still throws the original `reservation.error.code` (`IDEMPOTENCY_CONFLICT` for a hash mismatch), verified both by the pre-existing "materially different request" test and by a new cross-owner test (§16). Genuine transaction failures (code-generation exhaustion, classification-reference rejection) are untouched — confirmed by the full, unmodified `bootstrapBusiness — atomic bootstrap` / `partial failure` test suites still passing unchanged.

## 7. `commandDispatcher` consistency result

Confirmed (§5): the category (`TEMPORARY_UNAVAILABLE`) and the semantic condition it is applied to (reservation outcome `"in_progress"`) are pixel-identical to `commandDispatcher.ts`'s own governed, independently-tested contract. `bootstrapBusiness` does not call `dispatchCommand` itself (a pre-existing, intentional architectural choice — `businessBootstrapEndpointService.ts`'s own docblock states it mirrors the `authenticate`/AUTH-03 composition style instead) — the correction does not change that; it makes the hand-rolled composition consistent with the shared contract it was always supposed to honor, without adopting the dispatcher itself. This is the smallest correction that removes the actual inconsistency (Phase C confirmed: not a redesign).

## 8. Processing-state result

Deterministic test (`businessRepository.emulator.test.ts`, "a same-key call observing a concurrent 'processing' reservation…") pre-seeds an `idempotencyRecords/{key}` doc with `status: "processing"` and the exact production hash (`stableRequestHash`, exported test-only) — re-run independently on the final head: **pass**. Confirms `bootstrapBusiness` throws `businessCreationInProgressError` (category `TEMPORARY_UNAVAILABLE`) and creates zero Business documents.

## 9. Completed-state result

Same test, second half: after the record transitions to `status: "completed"` with a `responseSnapshot`, a same-key retry returns that exact snapshot (`toEqual`) and creates zero *new* Business documents. Re-run independently: **pass**.

## 10. Genuine-conflict result

Pre-existing test "rejects a same-key, materially different request as IDEMPOTENCY_CONFLICT" — re-run independently: **pass**, unchanged assertion (`category: "IDEMPOTENCY_CONFLICT"`). New cross-owner test (§16) — **pass**. Mutation test explicitly confirmed this branch cannot be silently widened without a test catching it (§21, mutation 5).

## 11. Client key-retention result

Independent unit test added this review (`apps/web/src/business/hooks/businessMutations.test.ts`), asserting directly against a spied `holder.clear()` (not inferred from `getKey()`'s returned value — see §21 for why that distinction matters): `"unavailable"`/`"timeout"` → `clear()` **not called**; `"conflict"`/`"validation_failed"`/no-code → `clear()` **called exactly once**. 5/5 pass on the final head. `settleKeyOnError` exported test-only for this purpose — no behavior change.

## 12. Deterministic processing test

Confirmed valuable and non-flaky as instructed — kept unmodified from the prior session, re-verified independently (§8/§9), re-run 1x clean on this review's own final head.

## 13. Real concurrent-path result

The pre-existing `"handles concurrent same-key, same-request calls without creating duplicate side effects"` test issues two genuinely concurrent `bootstrapBusiness` calls (`Promise.allSettled`, real Firestore transactions, no pre-seeding) under one key. Strengthened this review's assertions confirm: exactly one Business is created, exactly one membership is created, and **any** rejected outcome carries `category: "TEMPORARY_UNAVAILABLE"` (not just "some rejection occurred," which was the prior test's only assertion). Re-run 3x independently in isolation (`-t "concurrent"`): passed all 3 runs consistently. Traced the code (§5): given a matching request hash (same request body, same resolved owner — guaranteed here), the only two branches a losing concurrent call can take are `"duplicate"` (already-completed, returns cached result, no error) or `"in_progress"` (the corrected retryable-error branch) — there is no third path, so this real-concurrency test necessarily exercises the exact corrected branch whenever a genuine race is observed, not a synthetic stand-in for it. This satisfies the instruction not to claim full concurrency proof solely from the pre-seeded record.

## 14. Full convergence result

Proven end-to-end by the deterministic test (§8/§9), covering the complete numbered lifecycle in Phase D of the review task: key reserved → processing observed by a second caller → retryable result returned → (real client-side retention proven separately, §11) → record transitions to completed → same-key retry → cached result returned → zero new Business/Branch created. All steps have direct, independent, re-run evidence; none of this is only the prior implementation session's own claim.

## 15. Business-count evidence

- Processing-state test: `businesses` where `ownerUserId == "cust_in_progress"` = **0** immediately after the retryable rejection.
- Completed-state retry: same filter = **0** after the retry (the retry returns a cached snapshot without invoking the transaction — no Business document is ever written for this owner in this test, by design, since the "winner" is simulated).
- Real-concurrency test: `businesses` (unfiltered, isolated by unique `ownerUserId`/`idempotencyKey` per test) = **exactly 1**.
- Atomic-bootstrap suite (unchanged): exactly 1 Business per single ordinary submission, unaffected by this correction.

## 16. Branch-count evidence

- Real-concurrency test: `businessMemberships` = **exactly 1** (Branch count is 1:1 with Business under this domain's single-Branch bootstrap invariant, enforced elsewhere by `readDefaultBranchForBusiness`'s own fail-closed check — untouched by this correction).
- Cross-user isolation test (new, §17): `businesses` filtered by the legitimate owner (`cust_owner_a`) = **exactly 1**, matching the returned `businessId`; `businesses` filtered by the rejected owner (`cust_owner_b`) = **0**. No orphan Branch: the atomic-bootstrap suite's own unchanged assertions (Business + Branch + Membership + reservation + outbox all commit together in one transaction) are re-verified green on the final head.

## 17. Cross-user result

New deterministic test added this review: same idempotency key, identical request body, but two different server-resolved `ownerUserId`s. Confirmed: the second (different-owner) call is rejected `IDEMPOTENCY_CONFLICT` (the hash-mismatch branch, untouched by this correction, since `stableRequestHash` binds `ownerUserId`), the rejected owner has zero Businesses, and the original owner's single Business is unaffected and matches the id returned by their own original call. A caller cannot supply another user's idempotency ownership — `ownerUserId` is never client-input at any layer (`CreateBusinessRequest`'s own type has no such field; `bootstrapBusiness`'s `ownerUserId` param comes only from `handleCreateBusiness`'s server-verified credential resolution).

## 18. Error-boundary result

All four boundary conditions Phase G asked for are now independently, separately tested and passing on the final head:
1. **Processing** → retryable `TEMPORARY_UNAVAILABLE` (§8).
2. **Completed** → cached result (§9).
3. **Genuine conflict** (different hash: different request content, or — newly proven — a different resolved owner) → unchanged permanent `IDEMPOTENCY_CONFLICT` (§10, §17).
4. **Genuine infrastructure/domain failure** (e.g. businessCode generation exhaustion) → unchanged `TEMPORARY_UNAVAILABLE`-but-genuinely-failed behavior, verified by the pre-existing, unmodified "commits nothing when the transaction callback throws after all reads settle" test still passing.

The one-line correction was not broadened beyond its intended branch — confirmed by mutation testing (§21) that touching any other branch is independently caught.

## 19. Package H Playwright reconciliation

Resolved definitively (Phase I):

- **Establishment Playwright exists**: `tests/e2e/emulator/establishment.spec.ts`, along with `display-name-team.spec.ts`, `terms-and-team.spec.ts`, `cross-package-cache.spec.ts`, `accessibility.spec.ts`, `screenshotEvidence.spec.ts`, `helpers.ts`, `seedCommerceKnowledge.mjs`, and a `playwright.config.ts` update adding a dedicated `chromium-emulator-e2e` project.
- **Which branch/PR**: authored in `feat/eng-p3-002-ui-imp-h`, PR **#196** (Package H itself) — not this correction, not any other PR.
- **On `main`?** No — #196 is open/draft, unmerged.
- **In #197?** No — #197 branches from `main` before #196 merges; zero file overlap confirms nothing from #196 leaked in or was needed.
- **Was the prior report's statement inaccurate?** Technically accurate about #197's own ancestry, but **materially incomplete/misleading** without disclosing #196's pending, unmerged coverage — corrected in the implementation report (commit `c46e1d8`, §21/§2 there).
- **No duplicate coverage was created** — the existing `establishment.spec.ts` in #196 is left as the sole source of that coverage; this review added only unit/emulator-level tests scoped to the idempotency defect itself (Phase B/D/F/H/L), which is a different layer entirely.

Additionally discovered and worth noting: even once #196 merges, `establishment.spec.ts` and its siblings are **not** wired into the CI-run `pnpm test:e2e` step — #196 adds a separate `pnpm test:e2e:emulator` script (`playwright test --project=chromium-emulator-e2e`), explicitly documented in #196's own `playwright.config.ts` comment as "not part of the default `pnpm test:e2e` run… run it explicitly," and `.github/workflows/ci.yml` was not modified by #196 to add that step. This is a fact about the *target* repository state, not something this review's scope authorizes fixing.

## 20. Establishment E2E result

Not run — not present in #197's final baseline (confirmed §19), and Phase I explicitly instructs "If Package H establishment E2E is available in #197's final baseline, run it" / "Do not create duplicate Playwright coverage." Since it is not in this PR's baseline, running it here would not validate this PR and is out of scope until #196 merges.

## 21. Mutation-testing result

All five required mutations applied to a scratch copy of the affected files, confirmed **caught** by the existing/added test suite, then fully reverted (confirmed via `git diff` showing zero residual diff on `businessRepository.ts`):

| # | Mutation | Caught by |
|---|---|---|
| 1 | `in_progress` branch reverted to permanent `IDEMPOTENCY_CONFLICT` | `businessRepository.emulator.test.ts`'s deterministic processing-state test (category mismatch) |
| 2 | Client `settleKeyOnError` clears the key unconditionally (discards on `TEMPORARY_UNAVAILABLE`-mapped `"unavailable"`/`"timeout"` too) | New `businessMutations.test.ts` — 2 of 5 assertions fail |
| 3 | `duplicate` branch bypassed (re-runs the bootstrap transaction instead of returning the cached snapshot) | 3 tests fail: the atomic-bootstrap Business-count assertion, the deterministic convergence test's exact-snapshot assertion, and the real-concurrency test's Business-count assertion — this single mutation covers "completed same-key retry creates a second Business" **and** "Branch duplication occurs" (Branch count tracks Business count 1:1 in this bootstrap) |
| 4 | (covered by #3 above — Branch duplication is a direct consequence of the same bypass, not an independently reachable mutation) | see #3 |
| 5 | `conflict` branch mutated to also throw the retryable `businessCreationInProgressError` | Pre-existing "materially different request" test (category mismatch, now `TEMPORARY_UNAVAILABLE` instead of `IDEMPOTENCY_CONFLICT`) |

**A genuine test-suite gap was found and fixed during this process** (not a source defect): an early draft of the new client test asserted key retention by comparing `getKey()`'s returned value against a **constant-string** key factory — mutation #2, applied in its "always clear" form, passed undetected against that draft, because a cleared-then-regenerated constant key is indistinguishable by value from a never-cleared one. Rewritten to spy directly on `holder.clear()` (no such blind spot); re-run against the same mutation — caught. This is itself evidence the mutation-testing step was performed for real, not pro forma.

## 22. Canonical lint result

Canonical CI command identified from `.github/workflows/ci.yml`: `pnpm lint` → `eslint .`, no other lint step in the pipeline. Ran the equivalent scope explicitly (`npx eslint apps functions tests *.ts *.js`, excluding only this machine's local, non-repository `.claude/worktrees/` artifacts — see §23) on the final reviewed head: **0 errors, 1 pre-existing unrelated warning** (`react-refresh/only-export-components` in `BusinessApiContext.tsx`, present before this correction, not touched by it). This exactly matches CI's own lint step output on this same PR (`✖ 1 problem (0 errors, 1 warning)`, confirmed by reading the actual GitHub Actions log, not just the checks summary).

## 23. Root-lint/worktree issue classification

**Confirmed local-environment tooling hygiene, unrelated to source or CI — not fixed, per instruction not to opportunistically fix it.** Root cause traced: `eslint.config.js`'s top-level `ignores` array excludes `node_modules`, `dist`, `build`, `lib`, `dev-dist`, `coverage`, `playwright-report`, `test-results`, `.firebase`, and `docs/`, but **not** `.claude/worktrees/`. `.claude/worktrees/` is excluded only via this machine's local `.git/info/exclude` (confirmed: 0 files tracked by git there) — a per-machine, non-committed ignore file, invisible to a fresh CI checkout. This machine's `.claude/worktrees/` directory contains dozens of full historical repo checkouts (this repo's own prior work-package worktrees, never cleaned up), each independently `node_modules`-heavy; a bare `eslint .` run from this shell therefore traverses all of them. CI, which always starts from a clean clone with no such directory, is unaffected — confirmed by reading its actual lint-step log (§22: ~8 seconds, clean). This is machine/session hygiene, not a repository defect, and does not contaminate the assessment of #197 in any way (§22's scoped-equivalent run gives the authoritative, CI-matching answer).

## 24. Full validation

Re-run independently on the final reviewed head (`c46e1d847bfb7858f2af926e96ad5fffc703da06`):

| Check | Result |
|---|---|
| Focused idempotency/concurrency tests | Pass — see §8–17 |
| `functions` unit suite (`vitest run`) | **1584 passed** |
| `functions` typecheck (`tsc --noEmit`) | Clean |
| `functions` emulator suite (`vitest run --config vitest.emulator.config.ts`, full, single clean process against a freshly-cleared emulator) | **724 passed, 2 skipped, 0 failed** (up from 723 in the prior session — the new cross-owner test) |
| `web` unit suite (`vitest run`) | **657 passed** |
| `web` typecheck (`tsc -b --noEmit`) | Clean |
| `web` production build (`tsc -b && vite build`) | Succeeds |
| Canonical lint (repo-scope equivalent of `pnpm lint`) | 0 errors, 1 pre-existing unrelated warning — matches CI exactly |
| Format (`prettier --check` on every changed file) | Clean |
| Secret scan (manual diff review across the full review diff) | Nothing sensitive found |
| Establishment/Package H Playwright | Not applicable to this PR's baseline (§19/§20) |
| GitHub Actions CI on the final head | **pass** (`Build, Lint, Test, Emulator Validation`, run `33188177122`) |

Two environmental artifacts encountered and separated from source regressions, per Phase M's instruction:

1. Running two heavy `vitest --config vitest.emulator.config.ts` processes concurrently against the same single local Firebase Emulator Suite instance produced transient gRPC transport failures (`grpc-js` `onReceiveStatus`) in one of them — resolved by not running concurrent emulator-test processes against one emulator instance (matches how CI runs them: one process at a time), then re-running clean. Not a code defect.
2. GitHub Actions CI's first attempt on the final head (run `33188177122`) failed a single web unit test, `PhoneAuthHarnessPage.test.tsx > retry / resend flow (CR1 Correction 3) > increments correctly across multiple retries` — a `TestingLibraryElementError` waiting on `/retry count.*2/i` after two rapid, un-awaited `fireEvent.click` calls. This file is untouched by this PR (last modified by unrelated commit `607084c`, part of the phone-auth delivery-test harness, nothing to do with `createBusiness`/idempotency), and the same test passed cleanly both in an isolated local run and inside a full local 657/657 pass of the entire web suite performed earlier in this review. Triggered `gh run rerun 33188177122 --failed` on the exact same commit — it passed clean (6m56s), confirming a CI-runner-load-sensitive pre-existing flake, not a regression introduced by this correction. Not fixed here (out of this correction's scope) — worth a separate stabilization pass on that test's double-click sequencing.

## 25. Findings

1. **[Confirmed root cause, fixed correctly]** `bootstrapBusiness`'s `in_progress` branch threw a non-retryable `IDEMPOTENCY_CONFLICT` instead of the codebase's own governed, tested `TEMPORARY_UNAVAILABLE` contract for the same reservation outcome (`commandDispatcher.ts`). The fix is exactly the minimal, architecture-consistent correction.
2. **[Documentation defect, corrected]** The prior implementation report misidentified "Package H" (conflated `ENG-P3-002-UI-IMP-F`, merged/unrelated, with the actual `ENG-P3-002-UI-IMP-H`, PR #196, open/draft) and stated establishment Playwright coverage "does not exist at all" without disclosing it exists, pending, in #196. Both corrected in-place in the implementation report.
3. **[Test-suite gap, fixed during review]** An early draft of the new client-side key-retention test used a value-equality assertion against a constant-string key factory, which a real mutation passed undetected. Rewritten to spy on the `clear()` call directly.
4. **[Process/orchestration blocker, not a code defect]** PR #196 (Package H) is open and draft; #197 does not contain its work. Per this review's own explicit instruction, this is a STOP-before-merge condition — reported as the gate, not resolved unilaterally (see §26 rationale).
5. **[Local tooling hygiene, out of scope]** `.claude/worktrees/` is not in `eslint.config.js`'s ignore list, causing an ad-hoc local `eslint .` run to traverse this machine's accumulated stale worktrees. Confirmed to not affect CI or this PR's correctness. Not fixed per instruction.

## 26. Corrections

- Fixed the test-suite gap in Finding 3 (rewrote the client key-retention test to spy on `holder.clear()`).
- Corrected the two documentation inaccuracies in Finding 2, in-place in the original implementation report.
- Added one new deterministic test (cross-owner isolation, §17) closing a genuine gap Phase F/16 called for that the prior session's test suite did not yet cover explicitly.
- **Did not** merge PR #196 or PR #197: merging #196 is outside this review's scope (a separate, larger, unreviewed-by-this-session package, itself still in draft — not this session's call to make ready or merge), and Phase J's explicit instruction is to STOP and report the safe strategy rather than self-resolve the sequencing.

## 27. Files modified (this review, on top of the prior implementation session's 4 files)

- `apps/web/src/business/hooks/businessMutations.ts` — exported `settleKeyOnError` (test-only, documented; no behavior change).
- `apps/web/src/business/hooks/businessMutations.test.ts` — new, 5 tests.
- `functions/src/domains/business/repositories/businessRepository.emulator.test.ts` — added 1 new test (cross-owner isolation).
- `docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-implementation-report-2026-08-28.md` — corrected §2 and §21.
- `docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-review-report-2026-08-28.md` — this file (new).

No production server-side line changed in this review — the correction under review (`in_progress` → `businessCreationInProgressError`) is exactly as the prior session left it, byte-for-byte, confirmed via mutation-revert `git diff` showing zero residual diff.

## 28. Diff summary

This review: +~125 / −~4 lines across 3 code/test files plus 2 report edits, entirely test/documentation — zero production behavior change beyond what PR #197 already contained at entry to this review.

## 29. Commands executed

`gh pr view/diff/checks/api` for #196 and #197 (state, base/head, file lists, CI logs); `git log`/`git diff` for ancestry and mutation-revert verification; `FIRESTORE_EMULATOR_HOST=… FIREBASE_AUTH_EMULATOR_HOST=… npx vitest run --config vitest.emulator.config.ts` (full and path-filtered, against the already-running local Firebase Emulator Suite, cleared between runs via a scratch Admin SDK script); `npx vitest run` (functions and web); `npx tsc --noEmit` / `npx tsc -b --noEmit`; `pnpm --filter web run build`; `npx eslint apps functions tests *.ts *.js` (CI-equivalent scope); `npx prettier --check`; manual mutation-and-revert cycles via scratch Python string-replace + `cp`/restore, each followed by a targeted test run and a `git diff` confirming full reversion; `git commit`/`git push` (3 commits on `fix/eng-p3-002-corr-est-idemp-001`).

## 30. Dependencies added

None.

## 31. Config/Firebase/Rules changes

None.

## 32. Merge SHA

**Not merged.** See gate at top of report and §26.

## 33. Closure-sync SHA

Not applicable — no merge occurred.

## 34. Post-merge CI

Not applicable — no merge occurred. Pre-merge CI on the final reviewed head: **pass** (`33188177122`).

## 35. Risks

- Same lint-hang risk as the prior implementation report if the canonical `pnpm lint` is ever run locally on a machine with a similarly large stale `.claude/worktrees/` — mitigated by the CI-equivalent scoped invocation used here and documented in §22/§23; does not affect CI.
- No dedicated Playwright coverage for establishment exists in *this PR's own baseline* yet — will be automatically resolved once #196 merges and #197 is rebased, since neither branch's content changes.
- PR #196 being in `draft` state (not just `open`) suggests its own author does not yet consider it review-ready; this review makes no claim about #196's own correctness or readiness — that is a separate review's responsibility.

## 36. Rollback

Revert the 3 files listed in §27 plus the prior session's 4 files (§23 of the implementation report) — one self-contained branch, no data migration, no config, no dependency to unwind. Since nothing was merged, "rollback" here means simply closing/abandoning the PR — no production or `main` state to revert.

## 37. Review-report path

`docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-review-report-2026-08-28.md` (this file).

## 38. Changes-tracking update

This review report, plus the two in-place corrections to the implementation report (§2, §21 there), constitute the changes-tracking update for this review.

## 39. ENG-P3-002 status

Unchanged — not closed. Explicitly should not be closed until both Package H (#196) and this correction (#197) are safely merged, per this review task's own instruction.

## 40. Capability 3 status

Unchanged — not marked complete.

## 41. Exact Founder next action

Decide the PR #196/#197 sequencing:
1. Bring PR #196 (Package H) to ready-for-review and merge it first through its own review process (this review makes no claim about #196's own content — that is out of this review's scope);
2. Rebase (or simply re-target, since there is zero file overlap) PR #197 onto the resulting `main`, re-confirm CI green (expected trivial, given no conflicting files);
3. Then merge PR #197 (this idempotency correction) through the repository's normal convention (this session does not self-merge either PR);
4. Only then consider ENG-P3-002 closure / Capability 3 completion, contingent on both packages' own final states.

If the Founder instead wants #197 merged first (equally safe given zero file overlap), that is also viable — but the review task's explicit Phase J instruction was to stop and present this choice rather than pick one unilaterally.
