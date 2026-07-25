> **Title:** ENG-P1-002-CR1 — Concurrency Safety Correction Report
> **Version:** 1.0 · **Status:** Final · **Classification:** Working (historical record)
> **Governing task:** "TASK — ENG-P1-002-CR1: Concurrency Safety Correction"
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P1-002-CR1-concurrency-safety-correction-report-2026-07-25.md`
> **Date:** 2026-07-25

## Executive Summary

This is a bounded correction to `ENG-P1-002` (branch `chore/eng-p1-002-shared-foundation`, PR [#12](https://github.com/Fkenogo/11THONUS/pull/12), not merged), fixing two concurrency-safety defects the Foundation Architecture Review's evidence-gathering surfaced: (A) the idempotency service's lookup-then-reserve was two independent Firestore calls with no exclusion between them, and its duplicate-handling was status-blind (could return `responseSnapshot: undefined` as a fabricated success for a still-`"processing"` or `"failed"` record); (B) the outbox processor claimed no ownership before invoking a handler, so two concurrent workers could both process the same entry.

Both are now fixed: idempotency reservation is a single atomic Firestore transaction; the outbox processor claims exclusive ownership before invoking a handler and rejects a stale worker's later write. Mid-implementation, the originally-planned mechanism for outbox ownership (Firestore's own `updateTime` document metadata, chosen specifically to avoid a schema change) was empirically proven insufficient by its own failing tests — not a hypothetical risk, a real 3-test failure against the live Firebase Emulator Suite. Per this task's own instruction to stop and report a genuine decision gap rather than force a broken guarantee or invent schema silently, execution paused; the Founder authorized a minimal new field (`OutboxEntry.claimedAt`), which was then implemented and now passes all required scenarios.

`ENG-P1-002` remains `Under Review` — not `Complete`. PR #12 was not merged. No domain implementation was begun. No file outside the two corrections and their tests was touched.

## Entry Verification (performed before any change)

- Worktree: `chore/eng-p1-002-shared-foundation`, HEAD `cbcdb31` at task start, working tree clean (`git status --short` empty).
- `ENG-P1-002` confirmed `Under Review` on the Engineering Implementation Programme (not `Complete`), consistent with PR #12 being open, mergeable, CI green, unmerged.
- The defects being corrected were identified during `FAR-001` (Foundation Architecture Review Package, read-only evidence gathering, immediately prior task) — that task made no code changes; this one implements the fix.

## Pre-Change Analysis (required before any correction — reproduced from the point-in-time analysis delivered to the Founder before Correction A began)

**1. How the current non-transactional idempotency reservation permits concurrent duplicate execution.** `dispatchCommand` called `checkIdempotency()` (a plain `.get()`) and, if `"new"`, `reserveIdempotencyKey()` (a plain `.set()`) as two independent Firestore operations with no exclusion window between them. Two concurrent same-key requests could both observe "no existing record" before either wrote anything, and both proceed to reserve and invoke the handler.

**2. How status-blind duplicate handling could return an undefined response.** `evaluateIdempotency` returned `{ outcome: "duplicate", record }` whenever `requestHash` matched, regardless of `status`. `responseSnapshot` is only populated on completion, so a same-hash record still `"processing"` (genuine in-flight duplicate) or `"failed"` (a prior attempt that never completed) would produce `{ outcome: "success", result: undefined, fromCache: true }` — a fabricated success.

**3. How the outbox processor permitted multiple workers to process the same entry.** `processOutboxEntries` queried `status == "pending"` and, per document, invoked the handler and later called `doc.ref.update(...)` — no claim step existed between the read and the handler invocation. Two concurrent `processOutboxEntries` runs could both include the same entry in their query snapshot and both invoke the handler for it.

**4. Whether the approved schemas already contained enough fields to correct these defects.** For idempotency: yes — `status: "processing" | "completed" | "failed"` (TRD11 §11.14) was already sufficient; the fix was purely behavioral (wrap lookup + hash-compare + status-interpretation + reservation in one `db.runTransaction`). For the outbox: **initially assessed as yes** — reasoning that `OutboxStatus`'s already-declared but previously-unused `"processing"` value, combined with Firestore's own document-level `updateTime` metadata (not a persisted application field) as an ownership token, would be sufficient without a schema change. **This initial assessment was wrong** — see "Mid-Implementation Stop" below.

## Mid-Implementation Stop — Decision Gap Found and Resolved

While writing the required emulator concurrency tests for Correction B (TDD, RED confirmed against the real Firebase Emulator Suite, not assumed), 3 of 23 tests failed: "recovers an expired claim," "a stale worker cannot complete an entry," and "...cannot retry-transition an entry." Investigation (an isolated probe script against the real emulator, reproduced below) proved the root cause: **a Firestore write that sets a field to the value it already holds does not advance the document's `updateTime`** — confirmed with and without a `FieldValue.increment(0)` transform. This is exactly what a reclaim of an already-`"processing"` entry does (writes `status: "processing"` again), so two distinct claims of the same entry could not always be told apart using `updateTime` alone.

```
t1 2026-07-25T16:30:43.547Z
t2 (same-value write) 2026-07-25T16:30:43.547Z
changed: false

t1 2026-07-25T16:31:46.872Z
t2 (increment 0)       2026-07-25T16:31:46.872Z   changed: false
t3 (different value)   2026-07-25T16:31:47.257Z   changed: true
```

No already-approved `OutboxEntry` field could substitute without corrupting its documented meaning (`nextRetryAt` and `lastError.occurredAt` are both defined for other purposes and would be misleading if repurposed during a plain claim). Per this task's own instruction ("If the approved documents do not define the required status or lease semantics, stop and report the exact decision gap before changing architecture"), execution stopped and the finding was reported to the Founder with four options. **The Founder authorized the recommended option: add a minimal new field, `OutboxEntry.claimedAt?: Timestamp`**, written fresh (client-generated `Timestamp.now()`, not a server-sentinel, so no follow-up read is needed to learn the exact value written) on every claim/reclaim, used both for claim-age (expiry) computation and as the exact ownership-match token a later transition must still satisfy. This is the one field this correction adds beyond `ENG-P1-002`'s original schema.

## Required Correction A — Idempotency

`functions/src/shared/idempotency/idempotencyService.ts`:

- `evaluateIdempotency` is now status-aware: no existing record → `"new"`; hash mismatch (any status) → `"conflict"`; hash match + `"processing"` → `"in_progress"` (new outcome — never folded into `"duplicate"`); hash match + `"failed"` → `"new"` (a failed attempt is treated as retryable — TRD11 §11.14 does not define this case explicitly; this is this correction's own disclosed choice, made because the only alternative is a permanently stuck key); hash match + `"completed"` → `"duplicate"`.
- New `checkAndReserveIdempotencyKey(db, params)` combines lookup, hash comparison, status interpretation, and reservation inside a single `db.runTransaction`. Firestore's transaction protocol guarantees only one concurrent caller ever reaches the "new" branch and reserves the key; the losing side is automatically retried by the SDK and observes the winner's write.
- `reserveIdempotencyKey`/`ReserveIdempotencyKeyParams` (the unsafe non-atomic half of the original defect) removed — it had exactly one caller (`commandDispatcher.ts`, updated below) and no legitimate standalone use once the atomic function exists.
- `checkIdempotency` (read-only, non-claiming peek) retained, now routed through the same status-aware `evaluateIdempotency`.

`functions/src/shared/commands/commandDispatcher.ts`:

- Uses `checkAndReserveIdempotencyKey` in place of the old `checkIdempotency` + `reserveIdempotencyKey` pair — one call, one outcome.
- `"in_progress"` and a `"duplicate"` record whose `responseSnapshot` is `undefined` (an anomalous state under this dispatcher's own write path, which always supplies one on completion) both return a retryable `PlatformErrorResponse` with `code: "TEMPORARY_UNAVAILABLE", retryable: true` — never a fabricated success. `TEMPORARY_UNAVAILABLE` is one of TRD11 §11.35's existing 14 categories; no new category was added.

## Required Correction B — Outbox Claiming

`functions/src/shared/outbox/outboxEntry.ts`:

- Added `claimedAt?: Timestamp` (see "Mid-Implementation Stop" above for the authorization and reasoning).

`functions/src/shared/outbox/outboxProcessor.ts`:

- New `claimOutboxEntry(db, entryId, claimTimeoutMs = CLAIM_TIMEOUT_MS)` — inside one transaction, verifies the entry is either a due `"pending"` entry or a `"processing"` entry whose `claimedAt` is older than `claimTimeoutMs` (default `CLAIM_TIMEOUT_MS = 5 * 60_000`, a disclosed numeric choice in the same spirit as the existing backoff constants — TRD11 §11.17/§11.29 do not specify a lease duration), then writes `status: "processing", claimedAt: <fresh Timestamp>`. Returns `undefined` if not eligible.
- New `applyOwnedTransition(db, entryId, claimedAt, mutation)` (exported specifically so the stale-worker guarantee can be exercised directly in tests) — applies a mutation only if the entry's current `claimedAt` still equals the value the caller captured at claim time; otherwise returns `false` without throwing, and the caller simply drops the transition.
- `processOutboxEntries` rewritten: gathers candidate IDs via one query (`where("status", "in", ["pending", "processing"]).limit(limit)`), then per candidate: `claimOutboxEntry` → skip if not claimed → invoke handler inside try/catch → `applyOwnedTransition` to `"completed"`, retry-`"pending"`, or `"dead_letter"` per `decideNextOutboxState` (unchanged, still pure).
- `decideNextOutboxState`, `RetryableProcessingError`/`NonRetryableProcessingError`, and the backoff constants are unchanged.

## Files Modified (9 — exactly the two corrections and their tests; no other file touched)

| File | Change |
|---|---|
| `functions/src/shared/idempotency/idempotencyService.ts` | Correction A implementation |
| `functions/src/shared/idempotency/idempotencyService.test.ts` | Unit tests for status-aware `evaluateIdempotency` |
| `functions/src/shared/idempotency/idempotencyService.emulator.test.ts` | Real-emulator tests for `checkAndReserveIdempotencyKey`, incl. the required 2-simultaneous-callers race test |
| `functions/src/shared/commands/commandDispatcher.ts` | Uses the atomic reservation; never fabricates a success |
| `functions/src/shared/commands/commandDispatcher.test.ts` | Mocked unit tests updated to the new `checkAndReserveIdempotencyKey` contract |
| `functions/src/shared/commands/commandDispatcher.emulator.test.ts` | Added the required "two simultaneous commands, same key, handler exactly once" test |
| `functions/src/shared/outbox/outboxEntry.ts` | Added `claimedAt?: Timestamp` (Founder-authorized) |
| `functions/src/shared/outbox/outboxProcessor.ts` | Correction B implementation |
| `functions/src/shared/outbox/outboxProcessor.emulator.test.ts` | Added the required 5 outbox concurrency tests + 1 end-to-end concurrent-workers test |

## Code Diff Summary

```
 9 files changed, 682 insertions(+), 141 deletions(-)
```

No file outside `functions/src/shared/{idempotency,commands,outbox}` was touched. No Firestore Security Rules, no new Cloud Function, no domain code.

## Commands Executed

```
npx vitest run <scoped path>        (RED, then GREEN, per change — TDD throughout)
npx tsc --noEmit
npx eslint .
npx prettier --check .
pnpm typecheck / pnpm lint / pnpm format:check / pnpm build
pnpm test                            (full unit suite, both workspaces)
pnpm test:e2e                        (Playwright — unaffected surface, run for completeness)
pnpm emulators:validate              (real Firebase Emulator Suite — run twice: once to
                                       confirm the genuine 3-test RED before the claimedAt
                                       fix, once to confirm full GREEN after)
```

Also run, as a standalone empirical probe (not part of the permanent test suite — a one-off diagnostic against the real emulator, deleted after use): a script writing the same field value twice and a differing value once, to directly observe `updateTime` behavior. Output reproduced in "Mid-Implementation Stop" above.

## Dependencies Added

None. `node:crypto`, `firebase-admin/firestore` were already in use; `Timestamp.now()`/`Timestamp.isEqual` are existing Admin SDK API.

## Configuration Changes

None. No `package.json`, Vitest config, or Firebase config file was touched.

## Test Results

**Unit tests** (`pnpm test`, no emulator): **92/92 passing** in `functions` (20 test files, up from 87/87 — 5 new/changed idempotency and dispatcher assertions), **31/31 passing** in `apps/web` (unaffected, unchanged). `pnpm test:e2e`: 1/1 passing (unaffected surface).

**Emulator integration tests** (`pnpm emulators:validate`, real Firestore/Functions emulator): **23/23 passing** across 3 files (up from 14/14) —

- `idempotencyService.emulator.test.ts` (10 tests): `checkIdempotency` peek; `checkAndReserveIdempotencyKey` acquire/`in_progress`/`conflict`/`duplicate`-with-response/failed-is-retryable; **2 simultaneous callers with the same key — exactly one acquires ownership** (required scenario 1).
- `outboxProcessor.emulator.test.ts` (11 tests): the original 5 (success/retry/dead-letter/no-replay-of-completed/not-yet-due) plus 6 new — **two workers racing to claim the same entry: exactly one wins** (required scenario 5); does not claim a live (unexpired) claim; **an expired claim can be recovered** (required scenario 6); **a stale worker cannot complete an entry after reclaim** (required scenario 7); a stale worker cannot retry-transition after losing ownership (required scenario 7, retry path); end-to-end: two concurrent `processOutboxEntries` runs invoke the handler exactly once.
- `commandDispatcher.emulator.test.ts` (5 tests): the original 4 plus **two simultaneous commands with the same idempotency key execute the handler exactly once**, asserting every result is either the real cached success or a retryable `TEMPORARY_UNAVAILABLE` — never a bare/undefined result (required scenario 1, at the dispatcher level; also demonstrates required scenarios 2–4 by construction, since the assertion explicitly forbids a fabricated result from a `"processing"` or conflicting record).

All 7 required test scenarios are covered. Scenario 3 ("a completed request returns its stored response") and scenario 4 ("same key, different payload, stays conflict") are covered by the retained/updated tests in `idempotencyService.emulator.test.ts`.

`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` — all clean across both workspaces.

**Genuine RED evidence, not simulated:** before the Founder's `claimedAt` authorization, the exact same 3 emulator tests failed against the live emulator (documented above) — this was not a hypothetical risk description, it was an observed failure of the originally-planned mechanism.

## Architecture Conformance

- Command/Event/Error contracts (`CommandEnvelope<T>`, `DomainEvent<T>`, `PlatformErrorResponse`, the 14 TRD11 §11.35 categories) are unchanged.
- `IdempotencyRecord` (TRD11 §11.14) is unchanged — no field added; only the service's reservation logic and the dispatcher's use of it changed.
- `OutboxEntry` (TRD11 §11.17) gained exactly one field, `claimedAt?: Timestamp`, under explicit Founder authorization following the disclosed decision gap above — the only architecture-adjacent change in this correction, and it is additive/optional, not a breaking change to the type.
- `decideNextOutboxState`'s pure decision logic (TRD11 §11.29/§11.30) is byte-for-byte unchanged.
- `TEMPORARY_UNAVAILABLE` (already one of TRD11 §11.35's 14 categories) is now also used for the two new dispatcher-side "don't fabricate a result" cases — no new category invented.
- No domain command, event, or business rule was written. No Firestore Security Rules were authored or modified. No new Cloud Function was deployed.

## Risks

| Risk | Category | Notes |
|---|---|---|
| `CLAIM_TIMEOUT_MS` (5 minutes) is this correction's own disclosed numeric choice | Architectural observation | Not specified by TRD11 §11.17/§11.29. A future domain with materially different processing-duration expectations may need a different value; flagged for confirmation, not treated as a defect. |
| `checkAndReserveIdempotencyKey`'s treatment of a `"failed"` record as retryable-as-new | Disclosed interpretation | TRD11 §11.14's own "Idempotency Behaviour" text does not explicitly address a same-key, same-hash request against a previously-failed record. Treating it as retryable was judged the only operationally sound choice (the alternative is a permanently stuck key); flagged for confirmation if a future domain needs different behavior. |
| `reserveIdempotencyKey`/`ReserveIdempotencyKeyParams` removed from the public surface | Disclosed contract change | Per the task's own permission ("Preserve current public contracts unless correction is impossible without an authorized change") — kept because the unsafe two-call pattern is exactly the defect being fixed, and it had exactly one caller, now updated. No other file referenced it (confirmed via search before removal). |
| `applyOwnedTransition` exported (previously would have been internal-only) | Disclosed, minor contract addition | Exported specifically so the stale-worker-rejection guarantee has direct test coverage against the real emulator, rather than only being provable indirectly through `processOutboxEntries`. |
| `OutboxEntry.claimedAt` is a genuine schema addition | Authorized, not silently invented | See "Mid-Implementation Stop." Any code that reads `OutboxEntry` documents by field enumeration (none currently exists outside this module) would need to account for the new optional field; none does today. |
| No domain yet exists to prove either correction against real business logic | Expected, not a risk | Same position as the original `ENG-P1-002` report — the first real domain command/outbox handler (Phase 2+) is the true end-to-end validation. |

## Rollback Instructions

All changes are confined to the 9 files listed above, on the existing `chore/eng-p1-002-shared-foundation` branch (PR #12, not merged). No Firestore collection exists in any live environment yet — no domain writes to `idempotencyRecords` or `outboxEntries` until a future domain work package uses this shared layer, so no data migration is implicated either way. Rollback: revert the correction commit(s) on `chore/eng-p1-002-shared-foundation` (this branch has not been merged to `main`, so no `git revert` of a merge commit is needed — a plain revert or reset to the pre-correction commit `cbcdb31` is sufficient and safe). `ENG-P1-002`'s tracker status is unaffected by this correction (remains `Under Review`).

---

## Addendum — Commit, Push, and CI Evidence

*(Appended once validation, commit, and push completed. PR #12 was not merged, per this task's explicit constraint.)*
