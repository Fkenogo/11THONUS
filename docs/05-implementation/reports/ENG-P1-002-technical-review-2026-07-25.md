> **Title:** ENG-P1-002 Technical Review — Shared Engineering Foundation
> **Status:** Final — verdict recorded below
> **Date:** 2026-07-25
> **Reviewer role:** Technical Review (11thONUS Engineering Governance framework), performed under `TASK — ENG-P1-002-TR`
> **Classification:** Read-only review; no implementation code was modified during this review except where an explicit factual validation failure would have required it (none was found)
> **Disclosed limitation:** this review was performed within the same continuous agent session that implemented `ENG-P1-002` and `ENG-P1-002-CR1` — unlike `ENG-P1-001`'s independent second-pass review, no separate reviewing session was used. Mitigation: every command was re-run fresh in this task rather than trusted from prior reports, and one governing-document conflict (§6 below) was found that no prior pass in this session had caught, sourced from an external automated reviewer (GitHub's Codex) on PR #11 and independently verified against TRD10 primary text rather than taken on faith.

# ENG-P1-002 Technical Review

## 1. Executive Summary

`ENG-P1-002`'s shared foundation — command/event/error contracts, correlation-ID service, structured logging, idempotency service, event outbox, and the `dispatchCommand` orchestrator — was reviewed against its Engineering Blueprint, its Implementation Report, the `FAR-001` architecture-review evidence package, the `ENG-P1-002-CR1` concurrency-safety correction report, the corrected source code itself, and CI evidence on the exact final commit. The two concurrency defects `FAR-001` surfaced (non-atomic idempotency reservation; unprotected outbox multi-worker processing) are confirmed fixed in `ENG-P1-002-CR1`, each proven against the real Firebase Emulator Suite rather than asserted — including a genuine RED/GREEN cycle where the first proposed fix (Firestore's own `updateTime` as an ownership token) failed its own tests and was replaced, under Founder authorization, by a minimal schema addition (`OutboxEntry.claimedAt`).

Independent verification during this review found **no Critical or blocking-High findings**. It found and verified one additional Medium-severity documentation-conformance gap not previously surfaced in this session's own reports (§6) — a real conflict between two authoritative documents over the shared metadata shape's field names — which does not affect current correctness (zero domain consumers exist yet) but should be resolved before a domain work package builds on `BaseMetadata`.

**Verdict: APPROVED WITH NON-BLOCKING OPERATIONAL OBSERVATIONS.**

`ENG-P1-002` is technically approvable now. PR #12 remains unmerged, pending Founder-authorized merge, per this task's explicit constraint.

## 2. Review Scope

**Reviewed in full:** the `ENG-P1-002` Implementation Report (2026-07-25); the `ENG-P1-002` Engineering Blueprint (2026-07-25, now merged via PR #11, commit `82a9af7`); the `FAR-001` Foundation Architecture Review evidence package (delivered as an Artifact, not committed — its content is reproduced/cross-referenced here where load-bearing); the `ENG-P1-002-CR1` Concurrency Safety Correction Report; every file under `functions/src/shared/{commands,correlation,errors,events,idempotency,logging,metadata,outbox,validation}` (18 source modules, 20 test files); PR #11's 4 automated Codex review comments (read in full, each independently verified against primary source, not taken on faith); CI evidence for commits `4b00b7c`, `587c9c3` (PR #12) and `82a9af7` (post-merge `main`).

**Explicitly out of scope:** any domain implementation (none exists yet); the primary checkout's own long-standing, unrelated, pre-existing uncommitted governance-document changes (confirmed via `git status --short` in that checkout to be untouched by this or any prior task in this session); `ENG-P1-003` and all Phase 2 work.

## 3. Entry Conditions (verified before any change)

| Condition | Result |
|---|---|
| PR #11 status and merge state | Was `OPEN`/`MERGEABLE`/`CLEAN`, CI green (`30158318982`); merged under this task's own explicit Founder authorization ("PR #11: approved for merge now") as merge commit `82a9af748cc53cfa5afbedfc933ec207e307fcdd`, 2026-07-25T18:12:10Z. Post-merge CI on `main` green (`30169156703`). |
| PR #12 head commit | Confirmed exactly `587c9c33de6a93a36191f66ba7ad6f2b052abb68` |
| PR #12 mergeable | `state: OPEN`, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN` |
| CI green on that exact commit | Run `30166313343` — success, all jobs including Firebase Emulator Suite validation |
| Repository branch clean | `git status --short` empty in the `chore/eng-p1-002-shared-foundation` worktree |
| `ENG-P1-002` tracker status | Confirmed `Under Review` in both the Engineering Implementation Programme and Coding-Agent Prompt Register before this review began |

All six conditions satisfied — proceeded without a stop condition.

## 4. FAR-001 Finding Disposition

`FAR-001` (read-only architecture review, immediately prior to `CR1`) recorded 6 architectural observations. Disposition of each:

1. **A tenth module, `metadata/`, exists but is not one of the nine items named in the FAR-001 Include list.** Unchanged — not a defect, a scope observation about the review brief itself. No action required.
2. **`commands`/`validation` two-hop relationship (not a cycle).** Unchanged, confirmed still accurate by re-reading the corrected `commandDispatcher.ts` — the relationship is structural, not a defect.
3. **`CommandActor.userId`/`authUid` equivalence assumption.** Unchanged — remains a disclosed Phase-2 dependency. Independently corroborated during this review by PR #11's own Codex finding (line 109), which raises the same concern from a different angle (trusted identity/membership resolution). Carried into this review's own non-blocking observations (§5.1).
4. **Outbox retry/backoff parameters are a disclosed numeric choice, not TRD-specified.** Unchanged — carried into this review's non-blocking observations (§5.4), joined by the new `CLAIM_TIMEOUT_MS` constant `CR1` introduced (§5.3).
5. **`idempotencyRecord.ts` has no dedicated test file (unlike its structural peers).** Unchanged — confirmed still true (`ls functions/src/shared/idempotency/` shows no `idempotencyRecord.test.ts`). Out of `CR1`'s scope (a test-coverage-completeness note, not a concurrency defect); its shape remains exercised via `idempotencyService.test.ts`'s fixtures. Not blocking.
6. **Both PR #11 and PR #12 were open/unmerged at time of review.** **Resolved for PR #11** — merged under this task (§3). PR #12 remains open, correctly, pending this Technical Review and Founder merge authorization — exactly the state this task exists to produce.

The two findings that became `CR1`'s actual scope — non-atomic idempotency reservation and unprotected outbox multi-worker processing — are **confirmed fixed** (§7).

## 5. Non-Blocking Operational Observations

Recorded as the Founder's own specified determination, verified against the corrected code rather than assumed:

1. **Failed idempotency records are currently retryable.** `evaluateIdempotency` treats a same-key, same-hash request against a `"failed"` record as `"new"` (eligible for re-execution). TRD11 §11.14 does not explicitly address this case; `CR1`'s own disclosed reasoning (the alternative is a permanently stuck key) was independently re-verified as sound during this review.
2. **Idempotency `"processing"` records do not yet have expiry or abandoned-reservation recovery.** Confirmed accurate by reading `idempotencyService.ts`: unlike the outbox's `claimedAt`/`CLAIM_TIMEOUT_MS` mechanism, no analogous recovery exists for an idempotency reservation abandoned mid-processing (e.g. a crashed dispatcher instance). A stuck `"processing"` idempotency record would return `"in_progress"` indefinitely to any retry attempt.
3. **Outbox claim timeout is currently a provisional five-minute value.** Confirmed: `CLAIM_TIMEOUT_MS = 5 * 60_000` in `outboxProcessor.ts`, disclosed in `CR1`'s own report as not TRD-specified.
4. **Retry/backoff constants remain provisional operational defaults.** Confirmed unchanged from the original `ENG-P1-002` implementation: `MAX_RETRIES = 5`, `INITIAL_BACKOFF_MS = 1_000`, `BACKOFF_MULTIPLIER = 2`.
5. **The first real domain work package must validate the foundation against actual domain business logic.** No domain command, event, or handler exists yet to exercise `dispatchCommand`/`processOutboxEntries` against real business logic — matches TRD22 §22.11's own Phase 1 exit criterion (a synthetic proof is correct at this stage).

**One additional observation found during this review, not in the Founder's specified list:**

6. **`BaseMetadata` conflicts with TRD10 §10.5's authoritative `BaseDocument`/`ScopedDocument` schema.** Sourced from PR #11's automated Codex review (comment on line 49, P2 severity) and independently verified against primary text:

   - The **Version 1 Engineering Blueprint §3.3** (citing TRD8 §8.7) defines the shared metadata shape as: `id, createdAt, createdBy, updatedAt, updatedBy, status, version`, plus optional `businessId, customerId, countryCode, languageCode, deletedAt, deletedBy`.
   - **TRD10 §10.5** defines it differently: `id, schemaVersion (not "version"), status, createdAt, createdBy: string | null (nullable), updatedAt, updatedBy: string | null (nullable)`, plus optional (`ScopedDocument`) `businessId, customerId, countryCode, currencyCode, timezone, archivedAt: Timestamp | null (not "deletedAt"), archivedBy: string | null (not "deletedBy")`.
   - `functions/src/shared/metadata/baseMetadata.ts` implements the **Version 1 Engineering Blueprint's** shape (its own doc comment cites "§3.3" explicitly), not TRD10 §10.5's. The two authoritative documents disagree on: the version-counter field name (`version` vs `schemaVersion`), audit-field nullability, and two scoped fields present in TRD10 but absent from the implementation (`currencyCode`, `timezone`) alongside a naming mismatch on the soft-delete pair (`deletedAt`/`deletedBy` vs `archivedAt`/`archivedBy`).
   - **Impact today: none.** No domain code writes an authoritative Firestore document yet, so no data has been written under either shape.
   - **Disposition:** genuinely non-blocking for this review, for the same reason as observation 5 — but should be reconciled (which document is authoritative for this shape?) **before** the first domain work package writes a document using `stampCreate`/`stampUpdate`/`BaseMetadata`, since a shape change after real data exists would be materially harder to correct than one made now. Not corrected as part of this review, per this task's own constraint ("Do not change implementation code unless a factual validation failure is discovered" — this is a documentation-conformance gap with zero current runtime impact, not a validation failure).

**PR #11 Codex findings not otherwise addressed above:** the two P1 findings on lines 314 and 319 (non-atomic reservation; unsafe outbox crash window) describe, near word-for-word, the exact defects `CR1` fixed — filed against the blueprint's original text before `CR1` existed. Per this programme's established practice (blueprints are historical planning documents, not living specs — see the original Implementation Report's own disclosed blueprint-text inaccuracies, left uncorrected in the blueprint itself), these are **resolved in the implementation**, not retroactively edited into the now-merged blueprint text. The line-319 comment's specific suggestion — "define event-ID deduplication or an equivalent consumer contract" — describes the residual at-least-once-delivery characteristic inherent to the outbox pattern itself (a crash between a handler's success and the `"completed"` write causes a legitimate re-delivery on reclaim); this is squarely covered by observation 5 above (first domain handler must be idempotent to its own event IDs) rather than something the domain-agnostic shared layer can unilaterally close.

## 6. Corrected Source Code Review

Read in full: `commandDispatcher.ts`, `idempotencyService.ts`, `outboxProcessor.ts`, `outboxEntry.ts`, and their test files (unit and emulator). Confirmed against the `CR1` report's own claims rather than trusted:

- `checkAndReserveIdempotencyKey` genuinely wraps lookup, hash-comparison, status-interpretation, and reservation in one `db.runTransaction` call — no residual non-atomic path exists in `commandDispatcher.ts`'s call site.
- `evaluateIdempotency` is genuinely status-aware; the dispatcher's `"in_progress"` and no-`responseSnapshot` branches genuinely return `TEMPORARY_UNAVAILABLE`/`retryable: true` rather than a bare/undefined success — confirmed by reading the actual conditional logic, not just the tests.
- `claimOutboxEntry`/`applyOwnedTransition` genuinely use `OutboxEntry.claimedAt` (not `updateTime`) as the ownership token, matching the `CR1` report's stated final design — no stale reference to the disproven `updateTime`-based approach remains in the code (only in the module's own doc comment, as an intentionally-retained explanation of why the design changed).
- `decideNextOutboxState` is byte-for-byte unchanged from the original `ENG-P1-002` implementation, confirmed via direct comparison.

## 7. Test and CI Evidence

| Suite | Result | Notes |
|---|---|---|
| `functions` unit tests (`pnpm test`, no emulator) | **92/92** | Up from 87/87 — 5 new/changed idempotency and dispatcher assertions from `CR1` |
| `apps/web` unit tests | **31/31** | Unaffected, unchanged |
| Playwright e2e | **1/1** | Unaffected surface |
| Real Firebase Emulator Suite integration tests (`pnpm emulators:validate`) | **23/23** | Up from 14/14 — includes all 7 concurrency scenarios `CR1`'s own required-tests list specified: 2-simultaneous-callers races (idempotency service level and dispatcher level), a completed request returning its stored response, same-key-different-payload staying a conflict, two outbox workers unable to both claim one entry, expired-lease recovery, and stale-worker rejection on both the completion and retry transition paths |
| CI on PR #12 head `587c9c3` | **Success** — run [30166313343](https://github.com/Fkenogo/11THONUS/actions/runs/30166313343), all jobs green including Firebase Emulator Suite validation |
| CI on PR #12 correction commit `4b00b7c` | **Success** — run [30166229204](https://github.com/Fkenogo/11THONUS/actions/runs/30166229204) |
| CI on `main` post-PR#11-merge (`82a9af7`) | **Success** — run [30169156703](https://github.com/Fkenogo/11THONUS/actions/runs/30169156703) |

`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` — all reconfirmed clean during this review, re-run fresh rather than trusted from prior reports.

## 8. Verdict

**APPROVED WITH NON-BLOCKING OPERATIONAL OBSERVATIONS.**

Zero Critical or blocking-High findings. Six non-blocking observations recorded (§5), five specified by the Founder and independently reconfirmed, one additional finding from this review's own independent verification. None require correction before Approval — all six are either inherent to the outbox/idempotency pattern at this stage of the programme (no domain consumer yet to validate against) or a documentation-conformance gap with zero current runtime impact. `ENG-P1-002` is **not** marked `Complete` by this review — per this programme's established Definition of Done sequencing (Technical Approval precedes merge, which precedes `Complete`), and per this task's own explicit constraint.

**PR #12 is not merged by this review.** It remains open, mergeable, CI-green on its exact final head, pending Founder-authorized merge.
