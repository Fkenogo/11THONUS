# PLATFORM-BASELINE-006A — Purchase / Verification Transactional Spine / Implementation Report

**Date:** 2026-09-14
**Type:** Engineering implementation work package (first operational Purchase / Verification spine).
**Authority:** `PLATFORM-BASELINE-006-purchase-verification-entry-technical-design-2026-09-14.md` (merged, PR #252 — FINAL DESIGN CORRECTED / ITR-003 FINDINGS ADDRESSED).
**Disposition: IMPLEMENTED / AWAITING INDEPENDENT REVIEW. Do NOT merge.**

---

## 1. Entry repository state

- `git fetch origin`; `origin/main` verified exactly `a19c86a48b8c958fd09ce5be04edb462f7975bb0` (PR #252 design merge).
- Primary worktree `/Volumes/PRODUCTION/Projects/11THONUS` on branch `docs/dec-legal-002-bt-draft-007` with unrelated dirty legal/commercial work — **never touched** (verified clean separation via `git worktree list`; all work in `/tmp/11thonus-pb006a`).
- B68a385→a19c86a diff verified **docs-only** (3 docs files) before starting: the design's entry-state inventory (§4: zero purchase code, reusable seams) holds unchanged at the 006A entry head. **No material design-vs-codebase contradiction found** — one non-material schema note recorded in §22 (optional maximum-units cap).

## 2. Base SHA

`a19c86a48b8c958fd09ce5be04edb462f7975bb0` (`origin/main` at entry).

## 3. Branch

`feat/platform-baseline-006a-purchase-verification-spine` (created from `origin/main` in the isolated worktree).

## 4. Final implementation SHA

`f5352fb82cba6a6be75dd17029e46dad157063c3` (implementation commit; this reports commit follows on the same branch — PR head == reviewed head).

## 5. PR number

PR #253 — `https://github.com/Fkenogo/11THONUS/pull/253` (base `main`, head `feat/platform-baseline-006a-purchase-verification-spine`). Open, unmerged.

## 6. Files modified

Tracked modifications (19): 8 purchase callables + parsers + `toHttpsError` branch (`functions/src/index.ts`); evaluator classification/gate/Step-5c + 2 comment updates (`e
valuatePermission.ts`); `permissionErrors.ts` (new factory + disjointness message now naming 4 catalogues); `roleTemplate.ts` + `ordinaryPermissionCatalogue.ts` (stale `purchase.record`-as-ungoverned comment touch-ups); `evaluatePermission.test.ts` (ungoverned-id swap + new 006A block); `index.test.ts` (parser + transport tests); migrations `README.md`; `rewardProgramMigrations.postgres.test.ts` (0001–0014 pins + 006A `dropAll`); `platformFoundationReadiness.postgres.test.ts` (0001–0014 pin + 006A cleanup); Business shell/routes/queryKeys/`App.tsx`; customer `CustomerRoutes`/`CustomerShell` (+ header comment)/`CustomerShell.test.tsx`; locales `en.ts`/`fr.ts`.

New files (31): migrations `0007`–`0014` (+ 8 `.down.sql`); `functions/src/domains/purchase/` (models ×2, repositories ×6, services ×6, 1 cross-store test); `purchasePermissionCatalogue.ts`; web business api/hooks/page + tests (6); web customer api/hooks/pages + tests (8).

## 7. Code diff summary

- Backend: new `purchase` domain (4 commands, 5 query functions, 6 repositories, permission catalogue + evaluator branch, 9 callables). No existing domain logic altered except additive evaluator/catalogue branches and error-message text.
- Web: new Business `purchases` route + Customer `activity`/`rewards` real surfaces; EN/FR strings; api/hook layers with idempotency-key rotation.
- Tests: 34 cross-store PG tests, 9 evaluator tests, 4 parser/transport tests, 38 web tests (new/updated files).

## 8. Database migrations added

`0007_purchase_program_scope_uniques` (additive UNIQUEs on pre-existing tables) → `0008_purchase_records` → `0009_verified_units` → `0010_loyalty_cycles` → `0011_verified_unit_allocations` → `0012_rewards` → `0013_trust_events` → `0014_purchase_intents_outbox`. Each with a matching `.down.sql`. Migrations 0001–0006 untouched (verified by checksum validation in every run). Order avoids forward-reference FK failures (trust/intents/outbox last).

## 9. Schema/constraint summary

11 new tables exactly per design §20: `purchase_records` (A/B/C artifact columns, fact-preserving state CHECKs, single-verdict guard, reporting-pair CHECK, composite version∈program + program∈Business FKs, single directional replacement FK + one-replacement UNIQUE, identity-tuple UNIQUE); `purchase_record_events`; `verified_units` (purchase-tuple FK, reversal shape, one-credit-per-purchase + one-reversal-per-correction partial UNIQUEs, identity-tuple UNIQUE); `loyalty_cycle_streams` (PK parent); `loyalty_cycles` (0–10 CHECK, composite scope FKs, stream FK, governing-version UNIQUE, scoped sequence UNIQUE, one-current partial index); `verified_unit_allocations` (pending-shape CHECK, unit-tuple + cycle-scope FKs); `verified_unit_allocation_events` (shape CHECK); `rewards` (quantity=1, cycle-tuple + governing-version FKs, one-per-cycle UNIQUE); `trust_events` (subject-shape CHECK, causal + source-transition links, one-time lifetime UNIQUE + repeatable per-source UNIQUE); `notification_intents` (pending-only CHECK, per-source UNIQUE); `purchase_outbox`. Validated: full up (0001–0014) + full down + re-apply on a scratch DB through the real runner.

## 10. Domain services implemented

`recordPurchase` (19-step contract), `verifyPurchase` (atomic verify→unit→cycle→reward), `rejectPurchase`, `raisePurchaseDispute`, `purchaseQueries` (5 reads), `purchaseAuthorization` (`purchase.record` + membership reads), `purchaseRequestHash`.

## 11. Callables/API implemented

`recordPurchase`, `verifyPurchase`, `rejectPurchase`, `raisePurchaseDispute`, `listPurchasesForBusiness`, `getBusinessPurchaseRecord`, `listPurchasesWaitingForCustomer`, `getCustomerPurchaseRecord`, `listAvailableRewardsForCustomer` — whitelist parsers, actor resolution (business vs identity/read-only twins), `purchase_command_failed` transport mapping, no client authority fields accepted (mass-assignment-tested).

## 12. Permission changes

New disjoint `purchasePermissionCatalogue` (`purchase.record`, Staff/Manager/Owner per PRD5 §8, trial/active); evaluator `purchase` class + lifecycle gate + Step-5c role-default branch (no override path, revoke-override test proves it); `PermissionId` needed no change (open string). Reads stay membership/ownership-gated (no new catalogue entries).

## 13. Read models

Business list/get (membership-gated, same-Business enforced, status filter, limit/offset, `created_at DESC, id DESC`); Customer waiting list + get (ownership-scoped) + available rewards; get returns the lifecycle timeline; reads proven side-effect-free.

## 14. UI implemented

Business `purchases` route: record form (program select, artifact toggle, quantity/item/date/notes), status-filtered list, detail with event timeline. Customer `activity`: Waiting-for-You list, detail, verify/reject-with-5-reasons/dispute-with-3-reasons. Customer `rewards`: available rewards with governing terms. All exercise the real callables.

## 15. EN/FR localization

`business.purchase` (record/list/detail/statuses) + `customer.purchase` (waiting/detail/actions/5+3 reason labels/statuses/rewards) in full parity; nav entries; i18n parity suite passes; page tests assert EN + FR.

## 16. Idempotency implementation

Reused generic `idempotency_keys` with `purchase.create/verify/reject/dispute`; peek short-circuit + in-transaction atomic reserve; same/same replay, same/different conflict, in-progress retryable; reservation inside the domain transaction (rollback erases). Web hooks use `keyForRequest` rotation + `settleKeyOnError` (Business) and mirrored local helpers (customer).

## 17. Trust Event implementation

Causal + subject rows per transition in the same transaction; CORR-003 cardinality (one-time lifetime UNIQUEs; `loyalty_cycle.allocated` per-source UNIQUE); two-Purchases-one-Cycle coexistence proven; replay adds nothing; plain INSERTs (no silent swallow).

## 18. Notification Intent implementation

Durable source-linked intents per transition (`purchase_recorded_customer`, `purchase_verified_business`, `purchase_rejected_business`, `purchase_disputed_business`, `reward_available_customer`), `pending` by CHECK-enforced design, per-source structural UNIQUE; no delivery worker (deferred by design).

## 19. Cycle serialization/concurrency implementation

`loyalty_cycle_streams` parent (`INSERT … ON CONFLICT DO NOTHING` + `SELECT … FOR UPDATE`), stream-owned sequence counter, global lock ordering (idempotency→purchase→stream→cycle→reward→appends), partial-unique one-current backstop; proven: concurrent first verifies → one cycle (3+2=5); concurrent 9/10 → one crossing, no overfill, one reward.

## 20. Reward threshold implementation

Exactly one `available` Reward per cycle at 10 (`UNIQUE` backstop), `reward_quantity=1`, `available_at` set, terms = cycle `opened_under_version_id` (authority-answered, relationally enforced); version-bump test proves V1-pending verifies under V1 after V2 publishes.

## 21. Conservation guarantees

Constructional + test-enforced: `credit.quantity = SUM(current positions)` (split 2+2 proven; per-credit sums asserted in concurrency tests); `cycle.allocated_units = SUM(allocated positions)` (reconciliation query asserted); history rows never counted.

## 22. Cross-store handling

Firestore reads (auth, membership, artifact resolution, branch, knowledge) strictly pre-transaction; PG program/version proofs locked in-transaction; bounded-race disclosure per design §18 (snapshot rule, no distributed-transaction claim, live revalidation per command). One non-material schema note: the design's "optional Maximum Units per Purchase Record" has no governed home in the 005A version schema (`bulk_review_threshold` is review-only per DEC-LOY-003), so no cap is enforced or invented — quantity is governed by `quantity >= 1` + locked `multipleUnitsAllowed`. The task's "quantity above max" case is therefore not-applicable until a governed maximum field exists; recorded here explicitly, not silently redesigned.

## 23. Tests added

- `purchaseCommands.postgres.test.ts` (34 cross-store tests: §24 matrix incl. 5-case shared matrix, races, concurrency, version binding, cardinality, conservation, all 5+3 reasons, read isolation).
- Evaluator: 9 new tests (role×status allows, draft/suspended denies, revoke-override ignored, cross-business/unauthenticated denies) + ungoverned-id swap.
- `index.test.ts`: mass-assignment + transport mapping (4 tests).
- Web: api adapter tests (5), `PurchaseRecordsPage` (4), `CustomerActivityPage` (6), `CustomerRewardsPage` (3), updated shell routes (2 changed).
- Infra test updates: 0001–0014 pins, 006A cleanup in two files.

## 24. Commands executed

`pnpm install` (Node 20.20.0); `tsc --noEmit` (functions+web) clean; `eslint` (functions+web) clean (1 pre-existing unrelated warning); `prettier --write` on touched TS/TSX; full unit suites; full PG suite under `firebase emulators:exec --only firestore` (clean-DB re-run after a stale-state false alarm — see §35); `pnpm emulators:validate`; `pnpm build`; `git diff --check` clean. Local PG via the existing shared container (port 54329 already allocated by another worktree's instance — reused read-only as a server with a scratch DB, then the standard test DB; no other worktree's data touched).

## 25. Test results

- Functions unit: **158 files / 1756 tests pass** (was 1739 pre-change baseline per 005A report; +17 from evaluator/parser tests).
- Web unit: **116 files / 809 tests pass**.
- PostgreSQL (all 6 files, clean DB): **91/91 pass** (incl. 34 new purchase + updated migration pins).
- Emulator: **65 files / 833 pass, 3 pre-existing skips, 0 fail**.
- Migration up/down: full 0001–0014 apply, all 11 tables verified, full rollback, re-apply (scratch DB, real runner).
- Playwright e2e: **not run** — no purchase e2e seed/flow exists yet and none was added (see §36); the localhost Founder flow (§24/§28 of the design) is manual and remains to be exercised during independent review.

## 26. Dependencies added

None. No new npm packages (functions or web).

## 27. Config changes

None (no firebase.json, rules, env, CI workflow, or build config changes).

## 28. Risks

1. Pre-freeze PRD/TRD basis (design §27-R1) — unchanged, inherited.
2. DEC-AUTH-002 IdP direction — 006A uses the current TRD12 chain (inherited).
3. Quantity-mapping thinness (1:1) — inherited; plus the §22 maximum-cap note (new, minor).
4. Downstream-package coupling (006B, redemption, notification delivery must honor §§15–16/20/22–23 contracts).
5. Shared-test-DB ordering fragility: cross-store files leave `schema_migrations` populated by design (005A convention); an interrupted run can poison a later run's freshness-sensitive tests — observed once, resolved by recreating the disposable test DB. Disposable-local only; never production.
6. Cold-start hook flake: the new 34-test cross-store file's `beforeAll` once exceeded vitest's 10 s default hook timeout on a cold emulator+PG start — mitigated with an explicit 120 s hook timeout (test-only change).

## 29. Deferred items

Exactly the design §28 list: Reward redemption; Business-side dispute resolution; correction/replacement and reversal commands; expiry/cancellation/archival; notification delivery workers/providers; billing; analytics; POS/Mobile-Money/external-API integrations; hosted preview; Cloud SQL; auth-provider migration; phone-number lookup; multi-branch. Plus: purchase Playwright e2e seed/flow (see §36); the deferred oversized-pending split algorithm (future package).

## 30. Rollback instructions

- Unmerged PR: close the PR and delete the branch — `origin/main` is untouched.
- If migrations 0007–0014 were ever applied to a disposable DB: `migrateDown(pool, migrationsDir, 8)` (every migration has a tested `.down.sql`); validated on scratch.
- No Firestore writes are made by migrations; no shared/prod environment was touched.

## 31. Primary worktree safety

Primary worktree (`docs/dec-legal-002-bt-draft-007`, dirty legal/commercial work) never touched: all implementation in isolated worktree `/tmp/11thonus-pb006a` on a dedicated branch from `origin/main`. Pre/post `git status` of the primary worktree unchanged (its dirty set is unrelated and was never staged).

## 32. Report path

`docs/05-implementation/reports/PLATFORM-BASELINE-006A-purchase-verification-implementation-report-2026-09-14.md` (this file).

## 33. Changes-log/tracking record

Entry 227 appended to `docs/00-governance/documentation-changes-log.md` (controlled-update chain). No decision-register change (no new Founder decision; the §22 note answers to existing authority).

## 34. PR state

Open, unmerged, awaiting independent review (number/URL in §5 after opening).

## 35. CI state

**Green on the exact head.** `Build, Lint, Test, Emulator Validation` — SUCCESS on head `cd7dcce3ec919758bbf7c8d51b9b0a3710e7884b` (run `34876402984`, `https://github.com/Fkenogo/11THONUS/actions/runs/34876402984`). `mergeStateStatus` at last check: `UNSTABLE` (CI in progress at the time) → checks now `pass`; `mergeable: MERGEABLE`. CI steps include Build, Lint, Format check, Typecheck, Unit/component tests, PostgreSQL integration tests (full `test:postgres` under `firebase emulators:exec --only firestore`, covering the new 34-test cross-store file), Playwright e2e, and Firebase Emulator Suite validation — all success. No workflow change was needed or made (the 005A CORR-001.23 emulator-wrapped PG step already covers the new file).

## 36. Known limitations

1. No Playwright e2e for the purchase flow (no seed script added; e2e suite untouched and still green). The manual localhost Founder flow (design §24: trial Business → publish version → record → verify/reject/dispute → threshold journey → negative paths) is the prescribed review vehicle and is fully UI-supported.
2. `under_review` has no Business-side exit in 006A (006B boundary — by design).
3. Pending overflow accumulates but is never consumed in 006A (no redemption writer — by design).
4. Notification intents accumulate `pending` (no delivery worker — by design).
5. The "quantity above max" task case is not-applicable (§22).

## 37. Independent-review readiness

- Every task §2 item (1–24) is implemented; §3 exclusions respected (no behavior invented; forward-compatible columns only where the design explicitly names them).
- Evidence: 34 cross-store tests + 91/91 PG + 1756 functions + 809 web + 833 emulator + clean typecheck/lint/build + migration up/down proof.
- Review entry points: this report (§§8–22 for the load-bearing guarantees), the design §§15–16/20/22, `verifyPurchaseCommand.ts`, `loyaltyCycleRepository.ts`, migration `0008`–`0014`, `purchaseCommands.postgres.test.ts`.

## 38. Final disposition

**PLATFORM-BASELINE-006A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW. Do NOT merge.**

---

# PLATFORM-BASELINE-006A-CORR-001 — Concurrent Same-Key Idempotency Proof

**Date:** 2026-09-15
**Type:** Test/evidence correction on the existing PR #253 (no new PR, no merge).
**Authority:** Independent technical review `PLATFORM-BASELINE-006A-ITR-001` (single P2 finding).
**Disposition: CORRECTED / IDEMPOTENCY CONCURRENCY PROVEN / AWAITING NARROW INDEPENDENT RE-REVIEW. Do NOT merge.**

## C1. ITR-001 disposition

ITR-001 found **no production-code defect** in this package. It raised exactly one **P2** finding and a set of explicitly non-blocking **P3** observations. Only the P2 finding is addressed here; every P3 item (unchecked `responseSnapshot` runtime casts, callable direct-test coverage in `index.test.ts`, reward-list pagination, UI error/pending-state assertions, causal Purchase Trust Event DB dedup, outbox dispatch-status column, deferred pending-allocation redistribution, cross-store Firestore/PG TOCTOU boundary) is **deliberately untouched** and remains recorded as non-blocking.

## C2. The P2 finding

The real-PostgreSQL cross-store suite (`functions/src/domains/purchase/services/purchaseCommands.postgres.test.ts`) proved several genuine concurrency races against a live database (two concurrent first verifications creating one Cycle; two concurrent verifications at progress 9/10 with no overfill; verify-vs-reject; verify-vs-dispute) — but it never raced **two truly concurrent requests carrying the SAME idempotency key**. Same-key behaviour was only ever proven *sequentially* (replay after completion, conflict after completion). The concurrent interleaving — the one the `ON CONFLICT DO NOTHING` reservation exists for — was untested.

## C3. Same-key concurrency analysis (what the test had to account for)

**(A) How two same-key transactions interact.** Each command runs its own `withPlatformTransaction` — a distinct pooled connection with real `BEGIN`/`COMMIT`. Inside it, `checkAndReserveIdempotencyKey` issues `INSERT INTO idempotency_keys ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING ...`. Exactly one transaction's speculative insertion wins the unique index and returns a row (`acquired`). Only on conflict does the function fall through to `SELECT ... FOR UPDATE` on the now-guaranteed-existing row — locking a row that does exist, which is the only place row locking is meaningful.

**(B) Real PostgreSQL lock/conflict behaviour.** The loser's `INSERT` does **not** fail and does **not** immediately return: PostgreSQL makes the speculative insertion **wait on the winner's uncommitted tuple**. The loser therefore cannot observe a half-applied world. When the winner commits — having marked the key `completed` in the SAME transaction as its domain effect — `DO NOTHING` applies, and the loser's `FOR UPDATE` re-read sees `status = 'completed'` with a matching `request_hash`. If the winner instead rolls back, its reservation row disappears with it and the loser's own insert succeeds (retryable, never permanently stuck).

**(C) Externally observable outcomes that are valid.** Because of (B), the naturally-produced outcome is **one original success + one replayed duplicate** — and that is exactly what the live runs produce (instrumented probe on the final test code, three consecutive runs: `["fulfilled","fulfilled"]` for `verifyPurchase` and for `recordPurchase`; `["fulfilled","rejected:IDEMPOTENCY_CONFLICT"]` for the different-body case). A scheduling in which the loser's re-read observes a still-`processing` reservation would yield `in_progress` (`TEMPORARY_UNAVAILABLE`), which is equally governed and equally correct. The tests therefore assert the **union** of acceptable resolution shapes and never assume which caller wins or that a specific racer returns `in_progress`.

**(D) Invariants that must hold regardless of scheduling.** Exactly one applied effect: one terminal transition, one Verified Unit credit, one allocation of the purchase quantity, cycle progress advanced once, at most one Reward, no duplicated Trust Event / Notification Intent / outbox row, exactly one `idempotency_keys` row for the key, and strict quantity conservation (nothing created, nothing lost). Every racer must resolve through governed behaviour only — never a raw unhandled PostgreSQL error.

## C4. Concurrency proof added

Three tests, all real-Postgres and all genuinely simultaneous (`Promise.allSettled` over promises created before either is awaited; no mocked locking, no sequential awaits), in a new `describe("idempotency — two truly concurrent SAME-KEY requests (CORR-001)")` block:

1. **`verifyPurchase` — same key, same body.** Quantity 10, so the race also crosses the Cycle threshold and exercises the Reward sub-transaction. Asserts the union of governed resolution shapes (every rejection must be a `PurchaseDomainError` of category `TEMPORARY_UNAVAILABLE` or `IDEMPOTENCY_CONFLICT` — never a leaked `pg` error), that two fulfilled results reference the *same* Verified Unit / Cycle / Reward, and all eleven task §3 invariants directly against the database.
2. **`recordPurchase` — same actor, same body, same key.** Crosses the Firestore-read → PostgreSQL-write boundary using the file's existing fixtures (no new Firestore mocking infrastructure). Proves one Purchase Record, one creation lifecycle event, one Trust Event, one Notification Intent, one outbox effect, one idempotency record, and zero Verified Units.
3. **`verifyPurchase` — same key, DIFFERENT body.** Two simultaneous verifications of two different Purchases under one key. Proves exactly one establishes the operation, the incompatible one is refused by governed conflict semantics, and no second domain effect exists.

## C5. Production code, migrations, governance

**None changed.** No new test failed, so §6 of the task ("STOP and report") was never triggered — the implementation permitted no duplicate effect, did not deadlock, leaked no raw PostgreSQL error, and violated no idempotency semantics. The only source file changed is the test file above.

## C6. Test results (actually run)

Isolated environment: the shared local PostgreSQL container on port `54329` with a dedicated database `pb006a_corr1`, plus a private Firestore emulator (`firebase emulators:exec --only firestore`, alternate port) so neither the primary worktree nor any other session was disturbed.

- Targeted suite `purchaseCommands.postgres.test.ts`: **37 passed (37)** — 34 pre-existing + 3 new (baseline before the change re-verified at 34/34).
- Full PostgreSQL integration suite (all `*.postgres.test.ts`): **6 files, 94 passed (94)**.
- `functions` unit suite: **158 files, 1756 passed (1756)**.
- `apps/web` unit suite: **116 files, 809 passed (809)**.
- Typecheck: clean (`functions` + `apps/web`). Lint: 0 errors (1 pre-existing `react-refresh` warning in `apps/web/src/business/BusinessApiContext.tsx`, untouched). Format check: clean. Build: clean. `git diff --check`: clean.
- The Firebase Emulator Suite validation and Playwright e2e steps were left to CI on the exact pushed head (the local machine's default emulator ports were occupied by an unrelated session); both are unaffected by a test-file-only change.

## C7. Administrative review-count correction

The ITR-001 review summary recorded **"78 changed files"**. `gh pr view 253` reports **69 changed files** for PR #253 at its pre-correction head `4535807e715f3c9639a2c36d109634fb69806155`. This is recorded here as an **administrative review-count correction only**. It was not investigated and nothing was changed because of it.

## C8. SHAs

- Entry head (verified before any change): `4535807e715f3c9639a2c36d109634fb69806155`; base `a19c86a48b8c958fd09ce5be04edb462f7975bb0`; PR #253 OPEN, unmerged, `MERGEABLE`, exact-head CI `pass`.
- Correction commit: `8455d7e774e669622d7a88eb79079ef3f4e298f3` (test/evidence only). This report's own commit follows on the same branch, so the PR head equals the reviewed head.

## C9. Rollback

Revert the two CORR-001 commits on `feat/platform-baseline-006a-purchase-verification-spine` (`git revert 8455d7e` plus this report commit). Nothing else is affected: no production code, no migration, no dependency, no configuration, no governance decision.

## C10. Worktree safety

All work was done in the isolated agent worktree `/Volumes/PRODUCTION/Projects/11THONUS/.claude/worktrees/agent-a0f1b1d0649d131c5` at a detached checkout of the exact entry head (the branch itself was already checked out in another worktree). The primary worktree `/Volumes/PRODUCTION/Projects/11THONUS`, with its unrelated dirty legal/commercial work, was **never touched**.

## C11. Final disposition

**PLATFORM-BASELINE-006A — CORR-001 COMPLETE / IDEMPOTENCY CONCURRENCY PROVEN / AWAITING NARROW INDEPENDENT RE-REVIEW. Do NOT merge.**

---

# PLATFORM-BASELINE-006A-CORR-002 — Customer Cache Isolation and Quantity Validation

**Date:** 2026-09-16
**Type:** Correction of two confirmed P1 findings on the existing PR #253 (no new PR, no merge).
**Authority:** Automated `chatgpt-codex-connector` review threads on PR #253 (2 P1, independently re-inspected against the exact approved head and confirmed).
**Disposition: CORRECTED / AWAITING NARROW INDEPENDENT RE-REVIEW. Do NOT merge.**

## D1. Why the prior Founder merge approval no longer applies

The Founder merge approval covered head `6f5e256a4f9ffefedb06d8821f605e8662be217e` (the CORR-001 head). Two automated P1 review threads on that exact head — opened before CORR-001 and never addressed by it (CORR-001 scope was the ITR-001 P2 idempotency-concurrency finding only) — were independently re-inspected and confirmed as genuine defects. That head is therefore no longer approved for merge.

## D2. Why ITR-001/CORR-001 did not catch these findings

ITR-001's scope was a single P2 finding (same-key idempotency concurrency) and a set of explicitly non-blocking P3 observations; it did not re-run or re-triage the two `chatgpt-codex-connector` P1 threads (which target the Customer-facing React Query cache-key module and the Business quantity-input path — outside ITR-001's PostgreSQL-concurrency focus). CORR-001 closed exactly the one P2 finding it was scoped to and correctly left everything else untouched. The two P1 threads therefore remained open and unaddressed until this correction.

Two P2 threads also remain open on the same review (a purchase-date/timezone boundary issue and a zero-valued `unitValueMinor` rejection issue, both in files this task does not touch) — **out of scope for CORR-002 and deliberately left open**, per the task's narrow two-defect mandate.

## D3. P1-1 — Customer React Query cache isolation

**Root cause.** `customerPurchaseQueryKeys` (`apps/web/src/customer/hooks/queryKeys.ts`) produced actor-independent keys (`["customerPurchases","waiting"]`, `["customerPurchase", id]`, `["customerRewards","available"]`). The SPA uses one long-lived `QueryClient` (`apps/web/src/main.tsx`). If Customer A signs out and Customer B signs in without a full page reload, React Query can resolve B's `useQuery` calls from A's still-cached entries under those same keys before B's own refetch completes — a customer-data cross-identity leak.

**Architecture inspected before choosing a fix.** The Business domain's `businessQueryKeys` (`apps/web/src/business/hooks/queryKeys.ts`) already scopes every purchase/reward-program key by a server-verified `businessId`, establishing the codebase's own precedent for parameterized, scope-first query keys. `useAuthenticatedActor` (`apps/web/src/identity/hooks/useAuthenticatedActor.ts`) already resolves the signed-in Firebase `User` on every `onAuthStateChanged` transition but its `AuthenticatedActor` payload deliberately carries no `uid` (the server derives the Customer Identity from the ID token, never from a client-supplied id — see `identityCallableClient.ts`'s header). A separate existing pattern, `registerAuthLifecycle` (`apps/web/src/observability/authLifecycle.ts`), already clears identity-scoped client state on `onAuthStateChanged(user === null)`, but it operates on observability/correlation context, not the `QueryClient`.

**Correction chosen (smallest architecture-consistent option).** `useAuthenticatedActor`'s `ready` state now also carries `identityScope: user.uid` — additive only, never sent to the server (the `actor` payload passed to callables is unchanged) and used exclusively as a client-local cache-partitioning key. `customerPurchaseQueryKeys.waiting/purchase/rewards` each now take that `identityScope` as their first parameter. `purchaseQueries.ts` and `purchaseMutations.ts` derive it via a small `identityScopeOf` helper (`"pending"` placeholder while not yet `ready`, which is never a real `uid` and is never populated because those queries stay `enabled: false` until `ready`). Query *execution* was already correctly gated on `actorState.status === "ready"` and is unchanged.

**Why identity-scoped keys alone are sufficient (no auth-lifecycle cache clearing added).** Once every key includes `identityScope`, Customer A's and Customer B's cache entries live under permanently distinct keys — B's `useQuery` call for its own key never resolves from A's entry regardless of whether A's now-orphaned entry is ever evicted. Adding cache clearing on sign-out was considered (per the task's explicit prompt) and rejected as unnecessary scope: it would touch `observability/authLifecycle.ts` (unrelated domain, outside this task's two named files) to solve a problem the key-scoping change already fully closes, and the task's own guidance is to choose the smallest architecture-consistent correction.

**Client-supplied-id guard respected.** `identityScope` is `user.uid` from the Firebase Auth SDK's own resolved `User` object on a real `onAuthStateChanged` callback — never a value read from any request, response, or route parameter — so it cannot be a client-injected 'Customer Identity ID' used to opt into someone else's cache partition.

**Mutation invalidation.** `settleSuccess` in `purchaseMutations.ts` now invalidates `customerPurchaseQueryKeys.waiting/purchase/rewards` scoped by the same `identityScopeOf(harness.actorState)`, so a mutation's cache invalidation targets only the acting customer's own partition.

## D4. P1-1 regression tests

- `apps/web/src/customer/hooks/queryKeys.test.ts` — distinct keys for distinct identity scopes (waiting/purchase/rewards), and stable identical keys for the same scope (same-customer caching unaffected).
- `apps/web/src/customer/hooks/purchaseQueries.cacheIsolation.test.tsx` — four tests against the real hooks (`purchaseQueries.ts`) and a real `QueryClient`, driving a controllable `onAuthStateChanged` callback through a genuine A→sign-out→B transition within one mounted session:
  1. Waiting purchases: Customer B's query is `isPending`/undefined (never A's cached array) while B's own fetch is held open by a deferred promise, then resolves to B's own data; A's orphaned cache entry is verified still isolated (present but never read by B).
  2. Purchase detail: same proof for `useCustomerPurchaseQuery`, including that the `purchase` key itself (not only `waiting`/`rewards`) is identity-scoped.
  3. Available rewards: same proof for `useAvailableRewardsQuery`.
  4. Same-customer regression: unmounting and remounting under the *same* identity still serves the cached entry — the fix does not break ordinary same-customer caching.
- `apps/web/src/customer/hooks/purchaseMutations.test.tsx` — `useVerifyPurchaseMutation`'s `onSuccess` invalidation is asserted to target exactly Customer A's three identity-scoped keys and never contain another customer's scope.

All four files pass; the full existing `apps/web` suite (836 tests) shows no regression attributable to this change (see §D8).

## D5. P1-2 — Purchase quantity input validation

**Root cause.** `PurchaseRecordsPage.tsx`'s submit handler ran `Number.parseInt(form.quantity, 10)` on a free-form text input. `parseInt` silently truncates/coerces malformed text to a different valid integer (`"1.5"` → `1`, `"2abc"` → `2`), so the server (`functions/src/index.ts`'s `parsePurchaseQuantity`, which only checks `Number.isInteger(value) && value >= 1` on the already-coerced number) has no way to detect that the operator's original input was invalid — a wrong Purchase quantity could reach the server as a "valid" one, incorrectly sizing Verified Unit issuance and Loyalty Cycle progress.

**Path inspected end-to-end.** UI text input (`TextField`, already supports `errorMessage`/`aria-invalid`/`aria-describedby` via `apps/web/src/components/ui/formPrimitives.tsx`) → form state (`RecordFormState.quantity: string`) → submit parsing (the `parseInt` call) → `recordMutation.mutateAsync` → `useRecordPurchaseMutation` (business hook, unchanged) → `recordPurchase` callable → server `parsePurchaseQuantity`. The defect is entirely at the submit-parsing step; every other layer already behaves correctly once given a real integer.

**Correction.** A new pure validator, `parsePurchaseRecordQuantity` (`apps/web/src/business/dashboard/purchaseQuantityInput.ts`), accepts only text matching `^[1-9][0-9]*$` — the exact decimal digits of a positive integer: no sign, no leading zero, no decimal point, no trailing/leading characters or whitespace, non-empty. This mirrors (never relaxes or reinterprets) the server's integer-`>=1` rule; it only rejects malformed text before it can be silently coerced. `submitRecord` calls it in place of `Number.parseInt`; on `null` (rejection) it sets a `quantityError` flag and returns *before* calling `recordMutation.mutateAsync` — no mutation is invoked for any rejected input. The quantity `TextField` now passes `errorMessage={quantityError ? t("purchase.fieldQuantityError") : undefined}`, and editing the field again clears the error. No maximum quantity was invented; `bulk_review_threshold` was not touched or reinterpreted as a cap, per the task's explicit constraint.

**EN/FR parity.** Added `purchase.fieldQuantityError` to both `apps/web/src/i18n/locales/en.ts` ("Enter a whole number of 1 or more.") and `fr.ts` ("Saisissez un nombre entier supérieur ou égal à 1."). The repository's existing `i18n.test.tsx` EN/FR key-parity test covers the new key automatically.

## D6. P1-2 regression tests

- `apps/web/src/business/dashboard/purchaseQuantityInput.test.ts` — direct unit tests of the validator: accepts plain positive integers; rejects (parameterized) empty input, whitespace-only, `"0"`, `"-1"`, `"1.5"`, `"2abc"`, `"abc"`, `"NaN"`, `"Infinity"`, a leading-zero value (`"007"`), leading/trailing whitespace around a digit, and a plus-signed value.
- `apps/web/src/business/dashboard/PurchaseRecordsPage.test.tsx` (extended):
  - submits the exact typed integer quantity (e.g. `"7"` → `quantity: 7`, not silently altered);
  - parameterized rejection test (`"1.5"`, `"2abc"`, `"0"`, `"-1"`) each asserting `mockRecord` (the purchase-record mutation) is **never called** and the field's `role="alert"` shows the exact validation copy — proving malformed input cannot invoke the mutation;
  - clears the quantity error once the field is edited again.
  - (Empty input is covered at the unit-validator level; in the DOM it is additionally blocked by the field's pre-existing `required` attribute before the submit handler ever runs, which is itself a valid defense and does not need duplicate DOM-level coverage.)

## D7. Files modified

- `apps/web/src/identity/hooks/useAuthenticatedActor.ts` — `ready` state gains `identityScope: user.uid` (additive; `actor` payload unchanged).
- `apps/web/src/customer/hooks/queryKeys.ts` — every key now takes `identityScope` as its first parameter.
- `apps/web/src/customer/hooks/purchaseQueries.ts` — `identityScopeOf` helper; all three queries pass it into their key.
- `apps/web/src/customer/hooks/purchaseMutations.ts` — `identityScopeOf` helper (disclosed duplication, matching the module's existing convention); `settleSuccess` invalidates scoped keys.
- `apps/web/src/business/dashboard/purchaseQuantityInput.ts` — new: `parsePurchaseRecordQuantity`.
- `apps/web/src/business/dashboard/PurchaseRecordsPage.tsx` — strict client-side quantity validation before `mutateAsync`; `quantityError` UI state.
- `apps/web/src/i18n/locales/en.ts`, `apps/web/src/i18n/locales/fr.ts` — `purchase.fieldQuantityError`.
- New test files: `apps/web/src/customer/hooks/queryKeys.test.ts`, `apps/web/src/customer/hooks/purchaseQueries.cacheIsolation.test.tsx`, `apps/web/src/customer/hooks/purchaseMutations.test.tsx`, `apps/web/src/business/dashboard/purchaseQuantityInput.test.ts`.
- `apps/web/src/business/dashboard/PurchaseRecordsPage.test.tsx` — extended with the quantity-rejection tests in §D6.

No production code outside `apps/web` was touched. No PostgreSQL schema, migration, Verified Unit allocation, Loyalty Cycle, Reward, Trust Event, Notification Intent, permission, or auth-provider-architecture change was made or required by either correction.

## D8. Test results (actually run)

- Targeted: `queryKeys.test.ts`, `purchaseQueries.cacheIsolation.test.tsx`, `purchaseMutations.test.tsx`, `purchaseQuantityInput.test.ts`, `PurchaseRecordsPage.test.tsx` — **31 passed (31)**.
- Full `apps/web` unit/component suite: **836 tests**. One run showed 1 unrelated flaky failure (a hard-coded sub-80ms latency assertion in `PhoneAuthHarnessPage.test.tsx`, timing-sensitive and untouched by this correction); a second full run showed 835/836 passing with a *different* single flaky failure elsewhere (confirmed pre-existing scheduler/timing flakiness under full-suite parallelism, not a regression — verified by stashing this correction's changes and re-running the previously-failing files in isolation, where they passed cleanly against the unmodified baseline).
- Full `functions` unit suite: **158 files, 1756 passed (1756)** — unaffected, as expected (no `functions/` file touched).
- PostgreSQL integration suite, under the Firestore Emulator per the CI recipe (`firebase emulators:exec --only firestore -- ... pnpm --filter functions test:postgres`): **6 files, 94 passed (94)**.
- Firebase Emulator Suite validation (`pnpm emulators:validate`): **65 files, 833 passed, 3 skipped (836)** — matches the CORR-001 baseline exactly.
- Playwright e2e (`pnpm test:e2e`, local): **36 passed**, 1 failure (`app-shell.spec.ts` — "application shell loads") traced to a **local port collision only**: Playwright's `webServer` config reuses an already-listening server outside CI (`reuseExistingServer: !process.env.CI`), and port 4173 on this shared machine was already bound by an entirely unrelated dev server from a different project (confirmed by inspecting the failure's captured DOM snapshot, which rendered a different application, "Klockit Work Presence," not this repository's sign-in page). Forcing `CI=true` locally to reproduce the CI server-start path correctly failed with `EADDRINUSE` on that same pre-occupied port, confirming the cause. This is environmental to the local machine, not a code regression, and does not reproduce on a CI runner (a clean ephemeral host with nothing pre-bound to 4173).
- Typecheck (`pnpm typecheck`, both workspaces): clean.
- Lint (`pnpm lint`): 0 errors, 1 pre-existing `react-refresh` warning in `apps/web/src/business/BusinessApiContext.tsx` (untouched file, same warning recorded in CORR-001).
- Format check (`pnpm format:check`): clean.
- Build (`pnpm build`): clean (pre-existing >500kB chunk-size advisory only, unrelated).
- `git diff --check`: clean.

## D9. Review-thread inventory on the corrected head (pre-push)

Four total review threads existed on entry head `6f5e256a4f9ffefedb06d8821f605e8662be217e`, all unresolved:

1. **P1** — `apps/web/src/customer/hooks/queryKeys.ts:6` — cross-customer cache leakage. **Addressed by §D3/§D4.** Reply posted with root cause, correction, and test evidence; left unresolved for the independent reviewer to close.
2. **P1** — `apps/web/src/business/dashboard/PurchaseRecordsPage.tsx:79` — quantity truncation. **Addressed by §D5/§D6.** Reply posted; left unresolved for the independent reviewer to close.
3. **P2** — `apps/web/src/business/dashboard/PurchaseRecordsPage.tsx:87` — purchase-date/timezone boundary. **Out of scope for CORR-002 — untouched, left open**, per the task's narrow two-defect mandate.
4. **P2** — `functions/src/index.ts:1885` — zero-valued `unitValueMinor` rejected by `parsePurchaseQuantity`. **Out of scope for CORR-002 — untouched, left open.**

No new review finding was introduced by this correction as of the corrected head.

## D10. Rollback

Revert the CORR-002 commit(s) on `feat/platform-baseline-006a-purchase-verification-spine`. Nothing outside `apps/web` and this report/changes-log entry is affected: no migration, no dependency, no configuration, no governance decision, no schema change.

## D11. Worktree safety

All work was done in the isolated agent worktree `/Volumes/PRODUCTION/Projects/11THONUS/.claude/worktrees/agent-a0f1b1d0649d131c5`, on a new branch `platform-baseline-006a-corr-002` created off the exact confirmed entry head, then pushed to the existing `feat/platform-baseline-006a-purchase-verification-spine` branch backing PR #253. The primary worktree `/Volumes/PRODUCTION/Projects/11THONUS`, with its unrelated dirty `docs/dec-legal-002-bt-draft-007` legal/commercial work, was never touched.

## D12. Final disposition

**PLATFORM-BASELINE-006A-CORR-002 — CORRECTED / AWAITING NARROW INDEPENDENT RE-REVIEW. Do NOT merge.**

---

# PLATFORM-BASELINE-006A-CORR-003 — Purchase Date / Timezone Correction

**Date:** 2026-09-16
**Type:** Correction of one confirmed P2 finding on the existing PR #253 (no new PR, no merge).
**Authority:** `PLATFORM-BASELINE-006A-ITR-003` independent verification — both CORR-002 P1 findings confirmed CLOSED; the pre-existing purchase-date/timezone P2 independently reclassified as **VALID-BLOCKING** (reachable through the shipped UI, blocks the core purchase-recording workflow during ordinary business hours in the platform's stated target market).

## E1. Root cause

`PurchaseRecordsPage.tsx`'s submit handler sent `new Date(`${form.purchaseDate}T12:00:00.000Z`).toISOString()` for every purchase-date selection, and its default "today" value came from `new Date().toISOString().slice(0, 10)` (the **UTC** calendar date, not the operator's own local date). The server (`recordPurchaseCommand.ts:146`) rejects any `purchaseDate` later than `Date.now()`. For a business in a positive-UTC-offset timezone (the platform's stated target market is Burundi, UTC+2), the fixed noon-UTC anchor is 2pm local — so recording a purchase dated "today" before 2pm local time sent an instant that was still in the future relative to the real current UTC time, and the server rejected it. The default-date computation had a related, narrower defect: using the UTC calendar date could show the wrong date entirely for roughly two hours around each local midnight in UTC+2 (and analogous windows in other offsets).

## E2. Field semantics established before choosing a fix

The design (`docs/05-implementation/reports/PLATFORM-BASELINE-006-purchase-verification-entry-technical-design-2026-09-14.md`, purchase commercial snapshot) documents `purchase_date TIMESTAMPTZ NOT NULL` as a **"business-asserted commercial date, sanity-bounded, not future."** This is a COMMERCIAL CALENDAR DATE, not a precise event timestamp — it is stored as a `TIMESTAMPTZ` only because PostgreSQL has no bare "local date" type suited to a multi-timezone Business/Customer platform. The ITR-003 suggestion of blindly using `new Date().toISOString()` for every date was **not** applied without this analysis: doing so unconditionally would have silently converted every *historical* date selection into "right now" as well, discarding the operator's actual selection. The correction therefore treats "today" and "any other date" differently, preserving the field's calendar-date semantics for both cases.

## E3. Correction

New helper module `apps/web/src/business/dashboard/purchaseDateInput.ts`:

- `todayDateInputValue(now = new Date())` — the `YYYY-MM-DD` value for "today" in the caller's own (ambient/browser) timezone, using local `Date` getters (`getFullYear`/`getMonth`/`getDate`), not UTC ones. Used for the form's default date value (`emptyRecordForm`).
- `resolvePurchaseDateInstant(dateInputValue, now = new Date())` — if the selected date equals the caller's own "today," returns `now.toISOString()` (the real current instant, which by construction can never be ahead of the server's own clock). For any other date, anchors to **local** noon of that calendar date via the native local `Date` constructor (`new Date(year, month - 1, day, 12, 0, 0, 0)`) — never UTC noon — which is always safely in the past for a historical date, and correctly still resolves to a future instant (triggering the existing, unmodified server rejection) for a genuinely future calendar date.

Both call sites in `PurchaseRecordsPage.tsx` (the default-value computation and the submit-time construction) now use this module instead of ad-hoc `Date` construction. No new dependency, no timezone library — the whole correction relies only on the JS runtime's native local-time `Date` behavior, verified directly (`node -e`) to respect the ambient timezone correctly for both getters and the local constructor. **No client timezone becomes authoritative business/domain identity**: the browser's own ambient timezone is used exactly as the pre-existing design already did (to decide what instant to *attempt* to submit for a calendar-date selection) — the server's `purchaseDate > Date.now()` check (`recordPurchaseCommand.ts:146`) remains the sole, unmodified authority over what is actually accepted.

## E4. Regression tests — reproduce the actual bug, not just the helper

`apps/web/src/business/dashboard/purchaseDateInput.test.ts` (helper-level, 9 tests) and a new `describe` block appended to `apps/web/src/business/dashboard/PurchaseRecordsPage.test.tsx` (flow-level, 7 tests) drive the **real submit flow** through `fireEvent`/`mockRecord`, using `vi.useFakeTimers()` + `vi.setSystemTime()` together with `process.env.TZ` reassignment — verified directly on this runtime to genuinely change what `Date`'s local getters and local constructor report mid-process, so every test is deterministic regardless of the actual machine's configured timezone or wall clock:

- UTC+2 morning (09:00 UTC / 11:00 local), midday-straddling (11:30 UTC / 13:30 local), and later-in-day (16:00 UTC / 18:00 local) "today" submissions — each asserts the submitted instant is `<= Date.now()`.
- UTC (zero offset) "today" submission.
- A negative offset (UTC-5) "today" submission, including one case exactly at the local-date boundary (04:30 UTC = 23:30 the *previous* local day) that also proves `todayDateInputValue` reports the correct local calendar date across that boundary.
- A historical-date selection still resolves to a past instant.
- A genuinely future calendar-date selection still resolves to a future instant (server rejection remains meaningful).

**Verified these tests actually reproduce the bug:** the fix commit was temporarily reverted (via `git stash`) and the page-level suite re-run — the 4 "today" scenarios (UTC+2 morning/midday, UTC, UTC-5) failed exactly as expected against the old `T12:00:00.000Z` construction, while the historical-date, future-date, and UTC+2-later-in-day cases still passed (consistent with the old anchor only being unsafe for "today," which is exactly what CORR-003 targets). The fix was then restored and reconfirmed passing before commit.

## E5. CORR-002 protection

Re-ran the full CORR-002 regression suite unmodified: `queryKeys.test.ts`, `purchaseQueries.cacheIsolation.test.tsx`, `purchaseMutations.test.tsx`, `purchaseQuantityInput.test.ts`, `i18n.test.tsx` — **34/34 passed**. Customer query keys remain UID-scoped; Customer B still cannot synchronously observe Customer A's cached data; malformed quantities still cannot reach `mutateAsync`; EN/FR validation parity intact. Neither `customer/hooks/**` nor `purchaseQuantityInput.ts` was touched by this correction.

## E6. Files modified

- `apps/web/src/business/dashboard/purchaseDateInput.ts` — new helper (`todayDateInputValue`, `resolvePurchaseDateInstant`).
- `apps/web/src/business/dashboard/PurchaseRecordsPage.tsx` — both call sites switched to the new helper; no other change.
- `apps/web/src/business/dashboard/purchaseDateInput.test.ts` — new (9 tests).
- `apps/web/src/business/dashboard/PurchaseRecordsPage.test.tsx` — extended with a new `describe` block (7 tests).

No production code outside `apps/web`, no PostgreSQL schema/migration, no `functions/` change, no Cycle/Reward/Trust/Notification-architecture change, no auth-provider-architecture change, no new dependency.

## E7. Test results (actually run)

- Targeted (`purchaseDateInput.test.ts` + `PurchaseRecordsPage.test.tsx`): **26/26 passed**.
- CORR-002 protection suite: **34/34 passed**.
- Full `functions` unit suite: **158 files, 1756/1756 passed** — unaffected, as expected.
- Full `apps/web` unit/component suite: **121 files, 852/852 passed** — clean, no flakes this run.
- PostgreSQL integration suite (under the Firestore Emulator, CI recipe): first run showed **1 failure** in `platformFoundationReadiness.postgres.test.ts` ("Applied migration \"0001\" ... does not match" — a migration-identity fixture check unrelated to any file this correction touches); an immediate re-run against the same isolated container passed **6 files, 94/94**, confirming the first result was a one-off environmental flake, not a regression (no migration or Postgres infrastructure file was modified by CORR-003).
- Firebase Emulator Suite validation: **65 files, 833 passed, 3 skipped (836), zero failures** — matches the CORR-002 baseline exactly.
- Playwright e2e (local): **36 passed**, 1 failure (`app-shell.spec.ts`) — reconfirmed as the same local port-4173 collision documented in CORR-002 (the DOM snapshot again captured the unrelated "Klockit Work Presence" application; the process squatting on the port is unchanged from the prior correction). Exact-head CI (a clean runner) is authoritative for this check.
- Typecheck, lint (0 errors, the same pre-existing `react-refresh` warning), format check, build, `git diff --check`: all clean.

## E8. Review threads

The purchase-date P2 thread was replied to with root cause, correction, and test evidence, and left unresolved for the independent reviewer to close after re-verification. The two CORR-002 P1 threads were re-inspected against the corrected head and confirmed still correctly closed (no reply needed — the underlying code is unchanged and CORR-002's replies already stand). The `unitValueMinor=0` P2 thread is **explicitly not addressed** — recorded here as **VALID / NON-BLOCKING / DEFERRED FOLLOW-UP** per the task's scope boundary: the current shipped Business UI never sends `unitValueMinor`, so no shipped path is broken, and fixing it is out of CORR-003's bounded scope.

## E9. Rollback

Revert the CORR-003 commit on `feat/platform-baseline-006a-purchase-verification-spine`. Nothing outside the four files in §E6 is affected: no migration, no dependency, no configuration, no governance decision, no schema change.

## E10. Worktree safety

All work was done in the isolated agent worktree `/Volumes/PRODUCTION/Projects/11THONUS/.claude/worktrees/agent-a0f1b1d0649d131c5`, on a new branch `platform-baseline-006a-corr-003` created off the exact confirmed entry head, then pushed to the existing `feat/platform-baseline-006a-purchase-verification-spine` branch backing PR #253. The primary worktree `/Volumes/PRODUCTION/Projects/11THONUS`, with its unrelated dirty `docs/dec-legal-002-bt-draft-007` legal/commercial work, was never touched.

## E11. Final disposition

**PLATFORM-BASELINE-006A-CORR-003 — PURCHASE-DATE/TIMEZONE DEFECT CORRECTED / AWAITING NARROW FINAL VERIFICATION. Do NOT merge.**
