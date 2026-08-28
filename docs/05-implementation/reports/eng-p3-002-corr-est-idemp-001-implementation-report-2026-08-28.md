# ENG-P3-002-CORR-EST-IDEMP-001 — Establishment Business-Creation Idempotency Correction

**Status:** Ready for Founder review (draft PR, not merged). Correction-only — does not close ENG-P3-002 and does not mark Capability 3 complete.

## 1. Entry state

- `origin/main` at entry: `b2d7fd1` — "MTAIP-001 11thONUS Alignment Closure (#195)".
- Correction branch `fix/eng-p3-002-corr-est-idemp-001` created directly off `origin/main` (not off the unrelated in-progress `docs/mtaip-001-11thonus-alignment-closure` branch this session started on).

## 2. Package H disposition

**Correction (`ENG-P3-002-CORR-EST-IDEMP-001-REVIEW`):** this section originally misidentified Package H. `ENG-P3-002-UI-IMP-F` (team-management UI, PR [#193](https://github.com/Fkenogo/11THONUS/pull/193)/[#194](https://github.com/Fkenogo/11THONUS/pull/194), merged) is a *different*, unrelated package. **Package H is `ENG-P3-002-UI-IMP-H`** ("integration, E2E QA & closure evidence"), **PR [#196](https://github.com/Fkenogo/11THONUS/pull/196), still OPEN and marked draft** at the time of this correction — not merged to `main`. This is the package whose own report claims new emulator-backed Playwright coverage including `tests/e2e/emulator/establishment.spec.ts` (see the independent review report's Phase I for the full reconciliation). No file either package touched is modified by this correction (Phase K, non-regression) — confirmed zero file overlap between #196 and this PR.

## 3. Existing idempotency architecture (Phase C)

Two independent implementations exist for the same idempotency primitive:

- `functions/src/shared/idempotency/idempotencyService.ts` — the primitive itself: `checkAndReserveIdempotencyKey` atomically reads-and-reserves an `idempotencyRecords/{key}` doc inside one Firestore transaction, returning `"new" | "in_progress" | "duplicate" | "conflict"`. Only one concurrent caller can ever observe `"acquired"`.
- `functions/src/shared/commands/commandDispatcher.ts` — the **governed caller-side contract** for this primitive (TRD11 §11.14): `"in_progress"` and a `"duplicate"` record with no cached response both return a *retryable* `TEMPORARY_UNAVAILABLE` error, never a fail-closed conflict. This is deliberate — the same key + the same request means the caller is waiting on a still-in-flight concurrent execution of *its own* request, not colliding with someone else's.
- `businessRepository.ts`'s `bootstrapBusiness` (the function `createBusiness` calls) reuses the primitive directly — it does **not** go through `dispatchCommand` (a pre-existing, intentional architectural choice documented in `businessBootstrapEndpointService.ts`, mirroring the `authenticate`/AUTH-03 composition style; changing that is out of this correction's scope). It reimplemented the `"in_progress"` branch itself, and did so incorrectly: it threw `BusinessDomainError("IDEMPOTENCY_CONFLICT", …)` — a category mapped to a **non-retryable** client error code.

The client already fully implements the correct half of the contract: `apps/web/src/business/hooks/businessMutations.ts`'s `settleKeyOnError` only clears a held idempotency key for a non-retryable error code (`isRetryableBusinessErrorCode` in `businessCallableClient.ts` treats `unavailable`/`timeout` as retryable). `IDEMPOTENCY_CONFLICT` maps (`index.ts`'s `CATEGORY_TO_HTTPS`) to HTTPS `aborted` → client code `conflict`, which is **not** in the retryable set → the client discards the key.

## 4. Independent reproduction (Phase B)

Reproduced deterministically against the Firebase Emulator Suite, independent of the Package H report: a same-key, same-request call observing an idempotency record already `"processing"` (pre-seeded with the exact production hash function, `stableRequestHash`) received `IDEMPOTENCY_CONFLICT` — before the fix, this is the same error shape a losing concurrent caller receives from real contention. Combined with the client's existing (correct) retry policy, this reproduces the reported chain exactly: error → non-retryable client code → key cleared → next ordinary retry mints a new key → succeeds → second Business.

A real-concurrency version of the same scenario (`Promise.allSettled` on two callers under one key) was also added; it is documented as directional evidence only (Phase H explicitly disallows relying on a "usually passes" timing test as closure evidence) — the deterministic pre-seeded-record test is the actual RED→GREEN evidence.

## 5. Root cause

`bootstrapBusiness` (`functions/src/domains/business/repositories/businessRepository.ts`, `in_progress` branch) reinvented the idempotency reservation's `in_progress` outcome as a fail-closed `IDEMPOTENCY_CONFLICT`, instead of following the contract the codebase's own governed caller (`commandDispatcher.ts`) already establishes for the exact same reservation outcome: retryable `TEMPORARY_UNAVAILABLE`. `IDEMPOTENCY_CONFLICT` is the correct category only for a same-key request whose *content* actually differs (a genuine conflict) — it is not correct for "the same request is still being processed by a concurrent execution of itself."

The Package H race is the client-observable consequence of this single defect, not a separate transaction-contention bug: because the loser's error was misclassified as non-retryable, the client (correctly, per its own existing retry policy) treated it as final and discarded the key.

## 6. Fix strategy

Smallest architecture-consistent change, no new semantics invented (Phase C/E):

- Added `businessCreationInProgressError(idempotencyKey)` to `functions/src/domains/business/models/businessErrors.ts`, using the existing `TEMPORARY_UNAVAILABLE` category (already used elsewhere in this exact domain, e.g. `businessCodeGenerationExhaustedError`) — no new error category, no taxonomy change.
- `bootstrapBusiness`'s `in_progress` branch now throws this instead of `BusinessDomainError("IDEMPOTENCY_CONFLICT", …)`.
- No change to `index.ts`'s `CATEGORY_TO_HTTPS` map, `toHttpsError`, or any client file — `TEMPORARY_UNAVAILABLE` already maps to HTTPS `unavailable` → client code `unavailable`, already in the client's existing retryable set. The client's existing "keep the key alive on a retryable failure" behavior now does the right thing automatically.

## 7. Server-side correction (Phase E)

Confirmed the existing server architecture already had everything needed:

- Recognizing a same-key request has already completed: the `"duplicate"` branch (unchanged) already returns `reservation.record.responseSnapshot` — this already worked correctly and needed no change.
- Recognizing "still in flight, not yet completed": the `"in_progress"` branch — this was the one broken piece, now corrected to be retryable.
- Distinguishing genuine failure from successful concurrent completion: the `try/catch` around the actual bootstrap transaction (which calls `failIdempotencyKey` only when *that specific attempt's own* transaction throws, never when a *different* concurrent attempt is what's in flight) was already correct and is unchanged.

No UI guard, debounce, or button-disable was used or relied upon — the property holds purely from the server's idempotency-record state machine plus the client's pre-existing (and already-correct) retry-on-`unavailable` policy.

## 8. Client changes

None. `apps/web/src/business/hooks/businessMutations.ts`, `apps/web/src/business/api/*` are untouched — the existing retryable/non-retryable classification already does the right thing once the server emits the right category.

## 9–13. Race scenarios — results

| Scenario | Result |
|---|---|
| Single ordinary submission | Unaffected — `bootstrapBusiness — atomic bootstrap` suite passes unchanged. |
| Rapid synchronous double submission (same key) | Covered by `bootstrapBusiness — idempotency > handles concurrent same-key, same-request calls…` — exactly one Business, any rejection is now asserted `TEMPORARY_UNAVAILABLE`. |
| Two overlapping same-key server calls | Same test above; the new deterministic test isolates the exact `in_progress` branch. |
| Same-key retry after a completed success | New test `ENG-P3-002-CORR-EST-IDEMP-001: …` — retry after the record transitions to `completed` returns the winner's exact `responseSnapshot`, creates no Business. |
| Network-style retry | Same mechanism — a retry is indistinguishable from a network retry from `bootstrapBusiness`'s point of view; both are "same key, called again." |

## 14–15. Business/Branch-count evidence

New test asserts `businesses` (filtered by the test's `ownerUserId`) is `0` immediately after the `in_progress` rejection, and still `0` after the same-key retry (the retry returns a cached snapshot without invoking the transaction at all — no second Business, no orphan Branch). The pre-existing `handles concurrent same-key…` test asserts `businesses.size === 1` and `businessMemberships.size === 1` after real concurrent contention. The full atomic-bootstrap suite (`commits Business + Branch + Owner membership + businessCode reservation + outbox entry together`) is unchanged and still green, confirming no partial establishment was introduced.

## 16. Cross-user isolation

Unchanged: `requestHash` binds `ownerUserId` (server-resolved, never client-supplied), so a caller cannot affect another user's key — a same key under a different resolved owner is still the pre-existing, untouched `"conflict"` branch (`IDEMPOTENCY_CONFLICT`, hash mismatch). This correction only touches the `in_progress` branch, which is reached solely for a matching hash (same owner, same request).

## 17. Transaction-contention behavior (Phase I)

`checkAndReserveIdempotencyKey`'s own reservation transaction relies on Firestore's automatic optimistic-concurrency retry: the losing side's transaction callback is retried in-process by the SDK and observes the winner's committed record, resolving deterministically to `in_progress`/`duplicate` without ever surfacing an exception to `bootstrapBusiness`. This is exercised by the existing `two concurrent bootstraps racing for the exact same first-choice candidate…` test (unchanged, still green) for the code-uniqueness reservation, and is the same mechanism the idempotency reservation itself uses. A genuine SDK-level `ABORTED` surfacing after retries are exhausted is not specially reconciled with an already-completed operation beyond what already existed (the outer `try/catch` marks that specific attempt `"failed"`, which is safe — the record is `"failed"`, not `"completed"`, so nothing was actually written); this matches `commandDispatcher.ts`'s own precedent, which does not special-case this either, and inventing new handling for it here would exceed this correction's scope (Phase C).

## 18. Error contract (Phase J)

- Genuine creation failures (e.g. `businessCodeGenerationExhaustedError`, classification-reference rejection) are unchanged and remain non-retryable/appropriately-categorized errors.
- The `"in_progress"` case is no longer misrepresented as a permanent conflict.
- No raw Firestore error is newly exposed — `toHttpsError`'s message mapping (`business_creation_failed`) is unchanged; only the `category`/HTTPS-code selection changed for this one branch.

## 19. RED → GREEN evidence

- RED (unit): `businessErrors.test.ts`'s new `businessCreationInProgressError` case fails with `TypeError: businessCreationInProgressError is not a function` against the pre-fix tree (confirmed by reverting only the implementation files and rerunning).
- RED (emulator): the new deterministic `businessRepository.emulator.test.ts` test fails (`stableRequestHash is not a function`, then — once the export exists but the branch doesn't — would assert `category: "TEMPORARY_UNAVAILABLE"` against an actual `IDEMPOTENCY_CONFLICT`) against the pre-fix tree.
- GREEN: both pass after the fix; full suites below are green.

## 20. Emulator evidence

- `businessRepository.emulator.test.ts`: 13/13 passed (was 12/13 + 1 RED before the fix).
- Full `src/domains/business/` emulator suite: 126 passed, 2 skipped (pre-existing, unrelated skips).
- Full functions emulator suite (`vitest run --config vitest.emulator.config.ts`, no path filter): **723 passed, 2 skipped**, 0 failed, run against a freshly-cleared Firebase Emulator Suite (`demo-11thonus` project, Firestore + Auth).

## 21. Package H E2E regression

**Correction (`ENG-P3-002-CORR-EST-IDEMP-001-REVIEW`):** this statement was accurate only about this PR's own ancestry (branched from `main`, which does not include Package H) and was incomplete without saying so. An establishment Playwright spec **does** exist — `tests/e2e/emulator/establishment.spec.ts` — authored in Package H's own PR [#196](https://github.com/Fkenogo/11THONUS/pull/196) (`feat/eng-p3-002-ui-imp-h`), which is not yet merged to `main` and therefore not present in this PR's base or diff. It is run via a separate, non-CI-wired script (`pnpm test:e2e:emulator`, added by #196), not the default `pnpm test:e2e` GitHub Actions step. See the independent review report's Phase I for the full reconciliation.

## 22. Full validation

| Check | Result |
|---|---|
| Focused idempotency/concurrency tests | Pass (see §20) |
| `functions` emulator suite | 723 passed, 2 skipped, 0 failed |
| `functions` unit suite (`vitest run`) | 1584 passed |
| `functions` typecheck (`tsc --noEmit`) | Clean |
| `web` unit suite (`vitest run`) | 652 passed |
| `web` typecheck (`tsc -b --noEmit`) | Clean |
| `web` production build (`tsc -b && vite build`) | Succeeds |
| `functions` lint | Pre-existing, unrelated failure: repo's `eslint.config` references a `no-unassigned-vars` rule ESLint 8.57.1 cannot resolve — reproduced identically on unmodified `main`, not introduced by this change |
| root `pnpm lint` | Attempted; ran for 9+ minutes scanning the full monorepo (including numerous stale `.claude/worktrees/*` copies unrelated to this change) without producing output, and was terminated — see Risks |
| Prettier (changed files) | Clean |
| Playwright | No applicable spec exists (§21) |
| Secret scan | No dedicated tool configured in this repo; manual diff review found nothing sensitive (only domain-error/idempotency-branch code and prose changed) |
| Hosted deployment | Not performed (per instruction) |

## 23. Files modified

- `functions/src/domains/business/models/businessErrors.ts` — added `businessCreationInProgressError`.
- `functions/src/domains/business/models/businessErrors.test.ts` — unit coverage for the new constructor.
- `functions/src/domains/business/repositories/businessRepository.ts` — `in_progress` branch now throws the new retryable error; exported `stableRequestHash` (test-only, documented) for deterministic test seeding; doc-comment updates.
- `functions/src/domains/business/repositories/businessRepository.emulator.test.ts` — strengthened the existing concurrent-same-key test's assertions; added one new deterministic regression test.

No other file touched. No client file changed.

## 24. Diff summary

+~120 / −~9 lines across the four files above; the runtime behavior change is exactly one `throw` statement (one error category swapped for another, already-existing category).

## 25. Commands executed

`pnpm emulators:validate` (blocked by a pre-existing leftover local emulator on the standard ports); ran the emulator suite directly against that already-running instance instead via `FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 npx vitest run --config vitest.emulator.config.ts` (full, and path-filtered); `npx vitest run` (functions unit); `npx tsc --noEmit` (functions); `pnpm --filter web run typecheck`; `pnpm --filter web test`; `pnpm --filter web run build`; `npx eslint .` (functions, reproduced pre-existing failure on unmodified `main` too); `npx prettier --check` on changed files; `git diff`/manual grep for secret scan.

## 26. Dependencies added

None.

## 27. Config changes

None.

## 28. Firebase/Rules changes

None. No `firestore.rules`, `firebase.json`, or index changes.

## 29. Risks

- Root `pnpm lint` did not complete within this session (long-running across the full monorepo); the `functions`-package lint failure it would likely also surface is confirmed pre-existing on `main`, not caused by this change, but the root-level run itself was not observed to a clean finish.
- No dedicated Playwright coverage exists for the establishment/`createBusiness` flow at all (pre-existing gap, not introduced here) — flagged for a separate test-coverage follow-up, not this correction's scope.
- The `"duplicate"` branch's `reservation.record.responseSnapshot as CreateBusinessResult` still has no defensive handling for an anomalous `"completed"` record with an undefined snapshot (the pattern `commandDispatcher.ts` explicitly guards against) — never observed in practice here since `completeIdempotencyKey` always supplies a snapshot on this path, but noted as a latent edge case out of this correction's scope (Phase C: do not invent additional semantics beyond the reported defect).

## 30. Rollback

Revert the four files listed in §23 (a single, self-contained diff) — no data migration, no config, no dependency to unwind.

## 31. Implementation report path

`docs/05-implementation/reports/eng-p3-002-corr-est-idemp-001-implementation-report-2026-08-28.md` (this file).

## 32. `.md` changes-tracking update

This report is the changes-tracking update for this correction; no other governance `.md` file references `createBusiness` idempotency behavior that requires updating.

## 33–35. PR / SHA / CI

- PR: [#197](https://github.com/Fkenogo/11THONUS/pull/197) (draft, open, not merged, not self-merged).
- Head SHA: `c96a97ebc9c39f6126c8dd68ff86a9c5bc049cbf`.
- CI: pending at time of writing — see PR checks.

## 36. ENG-P3-002 status

Unchanged — not closed by this correction.

## 37. Capability 3 status

Unchanged — not marked complete by this correction.

## 38. Exact Founder next action

Review draft PR `fix/eng-p3-002-corr-est-idemp-001`, confirm the `TEMPORARY_UNAVAILABLE`-for-`in_progress` reclassification is acceptable, then merge (this session does not self-merge).
