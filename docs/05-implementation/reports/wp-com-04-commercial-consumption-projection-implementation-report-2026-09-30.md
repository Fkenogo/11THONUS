# `WP-COM-04` — Commercial Consumption Projection Implementation Report

> **Date:** 2026-09-30 · **Task:** `WP-COM-04`
> **Classification:** Implementation Report — primary-source document, written once at the time of the task
> **Entry `origin/main`:** `5ec962c69ad432a1cbd68a4a5305f9de9ed79eae` (WP-COM-03A merge commit, PR #288)
> **Branch:** `claude/vigilant-ritchie-e449gj` (clean isolated cloud checkout at the entry SHA; the contaminated primary checkout was not used)
> **Governing authority:** `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + `CORR-002` (§4.4 R1–R3, §5, §8.5.1, §13, §18, §20, §22–§24)
> **Status:** Implemented — pending review. Not merged. Nothing deployed; migration `0025` was run only against a local disposable PostgreSQL 16.

---

## 1. Plain-language summary (for the Founder)

When a customer finishes the ten-purchase earning side of a Circle and the Reward becomes available, the Business has used **one Commercial unit**. This package makes that happen in the Commercial books.

- The unit is counted from the **Reward becoming available** — never from redemption, never from a screen, never from a payment.
- It is counted **exactly once per Circle**, enforced by the database itself, not just by code.
- A Business's paid balance is **allowed to go below zero**. A Circle that was already admitted must be able to finish, so counting a unit never fails because the balance ran out.
- The Commercial side **only reads** the Reward. It changes nothing in Loyalty — not the Reward, not the Circle, not a purchase, not a redemption.
- If anything fails half-way, **nothing is kept** and the Reward is simply picked up again next time. A catch-up routine (reconciliation) finds any Reward not yet counted and counts it, and it is safe to run as often as wanted.

**Nothing calls this yet.** No scheduler exists in the repository, and the brief forbids touching the verify/redemption code, so today the projection is a callable service only. Wiring it to run (a scheduled sweep, and an immediate best-effort trigger) is a later package. Until then no unit is actually consumed in a running system.

**What is deliberately not here:** the capacity gate, held ("pending") purchases, admission earmarks, screens, payment providers.

---

## 2. Authoritative source binding

| Question | Answer (verified against the actual code, not assumed) |
|---|---|
| Authoritative fact | The `rewards` row. It is inserted, once per Cycle (`rewards_one_per_cycle`), in the same transaction as the Cycle's `active → reward_available` flip, by **both** threshold sites (`verifyPurchaseCommand.ts` `insertRewardForCycle`, and `confirmRedemptionCommand.ts` forward allocation). |
| Identity | `loyalty_cycle_id` (one Reward per Cycle) plus `rewards.id`; the pair is proven by the existing `0020` `UNIQUE (id, loyalty_cycle_id)`. |
| "Available" timestamp | `rewards.available_at` (`NOT NULL DEFAULT now()`), which is the consumption instant. |
| States that count | `available` and `redeemed`. A Reward redeemed before projection still counts. `cancelled`/`expired` are not countable (nothing writes them today; they are skipped, not billed). |
| Redemption | Plays no part: no trigger, no read of `redemptions`, no dependence on Reward state beyond the countable set. |
| Design vs code | **No material difference found.** The Reward lifecycle, lock exposure and FK shape match design §3.2–§3.4 exactly, so implementation proceeded (no STOP). |

`verifyPurchase` and `confirmRedemption` are **unchanged** (zero diff) and contain no Commercial coupling.

---

## 3. Migration `0025_commercial_consumption_projection`

Additive; `.down.sql` fails closed while any claim, event or failure row exists.

| Object | Purpose |
|---|---|
| `commercial_consumption_claims` | The **unclassified claim**: FK anchor for one Reward. Columns: `business_id`, `source_reward_id`, `source_loyalty_cycle_id`, correlation, timestamp. **No bucket, no amount.** Composite FK `(source_reward_id, source_loyalty_cycle_id) → rewards (id, loyalty_cycle_id)` (design R1). `UNIQUE(source_loyalty_cycle_id)`, `UNIQUE(source_reward_id)`. |
| `commercial_consumption_events` | The **classified immutable fact**, one per Cycle: `bucket`, `bucket_source` (`earmark` / `consumption_time_fallback`), `earmark_id`, `account_version` (the locked version the decision read), `unit_count = 1`, pricing provenance (`price_schedule_id` + USD-equivalent / currency / local-price snapshots, all-or-none), `ledger_entry_id`. FK to its claim and to Commercial tables only — **no FK to any Loyalty row** (R2/R3/R8). `UNIQUE(claim_id)`, `UNIQUE(source_loyalty_cycle_id)`, `UNIQUE(ledger_entry_id)`, partial `UNIQUE(earmark_id)`. |
| `commercial_projection_failures` | Append-only failure log (cycle id, error class/message, attempt, time). Soft cycle reference. Not read to decide eligibility. |
| `rewards_business_available_at_idx` | Performance index for the detection anti-join (design §5.3/§20). **The only object attached to a Loyalty table.** |
| Triggers | Immutability + no-truncate on all three tables; claim's Business must equal the Reward's Business; event must match its ledger debit (type `consumption`, one unit, same bucket/Business, scope key `consume:<cycle>`); **a claim cannot be committed without its event** (deferred constraint trigger). |

`earmark_id` is a plain nullable UUID **without a foreign key** today; the earmark table belongs to WP-COM-05b, which adds the FK.

---

## 4. Claim → lock → classify → finalize (one transaction per Reward)

`services/projectCommercialConsumption.ts`:

1. **Identify** — plain `SELECT` of the Reward (no lock). Not eligible → return (`reward_not_found`, `reward_state_not_countable`, `no_commercial_account`, `before_commercial_effective_from`); nothing is written. An existing event → `already_projected`.
2. **Claim** — `INSERT … ON CONFLICT DO NOTHING` into the claims table. This is the only statement touching a Loyalty row (`FOR KEY SHARE` via the FK) and it happens **before** any Commercial lock (design §4.4 rule iii). A concurrent contender waits on the uncommitted claim, then does nothing (or proceeds if the first rolled back).
3. **Lock** the Business's `commercial_accounts` row `FOR UPDATE`.
4. **Resolve funding under the lock** — earmark port, else fallback (§6).
5. **Finalize atomically** — the per-market price-schedule lock is taken first (so a concurrent, uncommitted price schedule cannot be missed and frozen into the immutable snapshot; same order as `recordSettlement`: account → price), then ledger `consumption` debit + account counters (through the shared `postCommercialLedgerEntry` primitive, unchanged), the event, the audit row (`actor = system:commercial-projection`, `action = consumption_recorded`, snapshots before/after).
6. **Commit** — everything or nothing.

Each consumption is exactly **one** unit (`units_delta = -1`, `unit_count = 1`). No money is charged; pricing is a provenance snapshot only.

---

## 5. Exactly-once guarantees (database-level, not only service-level)

| Layer | Mechanism |
|---|---|
| Source claim | `UNIQUE(source_loyalty_cycle_id)` and `UNIQUE(source_reward_id)` on the claim |
| Event | `UNIQUE(source_loyalty_cycle_id)`, `UNIQUE(claim_id)`, `UNIQUE(ledger_entry_id)` |
| Ledger | existing `UNIQUE(idempotency_scope_key)` with key `consume:<cycle_id>` |
| Anti-join | detection excludes any Cycle that already has a claim |
| No half-state | deferred trigger: a claim without an event cannot commit; event→ledger FK and match-trigger: an event without its exact debit cannot exist |
| Audit | existing `UNIQUE(idempotency_key, action_type)` with key `consume:<cycle_id>` |

Tests attempt each violation by raw SQL (duplicate claim, duplicate ledger scope, lone claim, wrong-Business claim, wrong-Cycle claim, event linked to a non-matching debit) and all are rejected.

---

## 6. Funding provenance and the fallback

- **Normal governed runtime:** `ConsumptionEarmarkResolver` port. An earmark, when present, **is** the bucket; account state plays no part; the matching bucket **reservation is released in the same ledger entry** (`trial_reserved_delta` / `paid_reserved_delta = -1`). The port is called under the account lock and is contractually read-only toward Loyalty. An earmark with no held reservation fails with an integrity error (rolled back), never a silent mis-debit.
- **No earmark source exists yet** (admission earmark creation is WP-COM-05b, not implemented). The default resolver is `noAdmissionEarmarks` (returns `null`), so **every** Reward currently takes the fallback. That is the intended pre-WP-COM-05b state, not the long-term path.
- **Fallback (exceptional; migration / reconciliation / rollout only):** decided **only after the account lock**, from the locked counters — uncommitted trial first (`trial_remaining − trial_reserved > 0`), else paid. Recorded as `bucket_source = 'consumption_time_fallback'` with the `account_version` it read. The decision is never made before the lock and is never revisited: the event is immutable (trigger) and no later grant, adjustment, settlement, void or activation can re-classify it. This preserves CORR-002 exactly.
- **Observable:** `bucket_source` on every event, partial index for the count, `fallbackConsumptionCount` metric, `projectedViaFallback` in the reconciliation report.

---

## 7. Negative balance

The debit has no floor and no maximum: `paid_balance_units` has no sign CHECK (unchanged from WP-COM-01) and the projection adds none. Consumption never fails because paid capacity is exhausted or negative; only genuine integrity violations throw. Trial never goes below `trial_reserved` (existing integrity bound), which is why the fallback only picks trial when uncommitted trial exists. Restriction never gates consumption (tested).

---

## 8. Reconciliation and observability

`services/reconcileCommercialConsumption.ts` — **a callable service seam; no scheduler** (none exists in the repository, design §3.8; wiring is WP-COM-10):

- `reconcileCommercialConsumption(pool, {limit ≤ 500, businessId?, earmarkResolver?, now?})` — stateless anti-join over the durable Reward fact (no watermark that could skip a row), projects each unprojected Reward in its **own** transaction, oldest first, and returns a report `{scanned, projected, projectedViaFallback, alreadyProjected, notEligible, failed, metrics}`.
- Repeat-safe: re-running finds nothing new and posts nothing. "Backfill" is the same call.
- A failing Reward never aborts the pass: the failure is written to `commercial_projection_failures` on a **separate connection** (so it survives the rollback) and the pass continues. Ordering puts fewest-failures first, so a permanently failing Reward cannot starve the rest of a bounded pass.
- `getConsumptionProjectionMetrics(pool, now)` — derived by query, never stored: `unprojectedRewardCount`, `oldestUnprojectedAgeSeconds`, `fallbackConsumptionCount`, `projectionFailureCount`.
- Rewards available **before** the account's `commercial_effective_from`, and Businesses with no account, are excluded (never billed retroactively; design §5.6).

No alert thresholds or notifications were added (operating parameters and alert wiring are WP-COM-09/10).

---

## 9. Lock-order proof

Canonical order (design §22.1): `… → commercial account (A) → row inserts`. Projection sequence:

`[non-locking Reward read] → claim insert (key-share on Reward) → A (FOR UPDATE) → non-locking Loyalty reads only (earmark port) → per-market price advisory lock (schedule writers never take the account lock, so no cycle) → ledger + account + event + audit (Commercial rows only, no Loyalty FK)`.

**No cycle can form**, because:
1. Before A, the projector waits on at most the Reward row, held only by redemption (`FOR UPDATE`), which never takes A and never waits for anything the projector holds.
2. After A, the projector waits on **nothing**: it writes only Commercial rows, inserts nothing with a Loyalty foreign key (the event has none), and takes no Loyalty lock (the earmark port is read-only). It is a sink in the wait graph.
3. Other holders of A — admin commands (sinks) and the future admission path — can wait only on record-purchase/publication transactions, which never wait for A.

**What the tests prove (not just argue):**

| Case | Test |
|---|---|
| **A** earmarked, **B** fallback | While the projector is blocked on a Loyalty-held Reward, the account row can be locked `NOWAIT` — by the very transaction holding the Reward. Had the projector taken A first, this is exactly the CORR-002 cycle. |
| **C** same Reward concurrently | 8 simultaneous projections, and 5 rounds × 6 — exactly one wins, no `40P01`. |
| **D** two Rewards, one Business | 10 concurrent projections serialise on A; strict ledger order; no `40P01`; totals exact. |
| **E** racing mutations | Projection × {trial adjust down, trial adjust up, paid credit adjust, settlement confirm, settlement void, restrict, restore}, 3 rounds each, real commands: no deadlock, every projection succeeds, ledger = counters, and for every fallback event the bucket equals the decision computed from the account state at the recorded `account_version` **and** the debit's ledger version is exactly `account_version + 1` (nothing intervened between the locked read and the write). |
| Stale decision | Trial is removed (or granted) by a transaction that holds A while the projector waits — the fallback follows the **committed locked** state (paid / trial respectively). |
| Price schedule race | A price schedule left uncommitted while a Reward is projected: the projector queues on the market lock and then snapshots that schedule (fails without the lock; found in review). |
| Loyalty never blocked | With the projector parked after its claim, a Loyalty writer can `UPDATE rewards` and `FOR UPDATE` the Cycle and Stream within a 1 s `lock_timeout`. |

**Mutation checks** (temporary, reverted): moving the account lock before the claim made both A/B tests fail (`could not obtain lock`); deciding the fallback from the pre-lock read made both stale-decision tests fail.

---

## 10. Crash / retry analysis

Everything is one transaction, so a crash at any pre-commit point leaves no state (design §24.1). Tested:

| Crash point | Test result |
|---|---|
| After claim insert, before account lock | Connection killed with `pg_terminate_backend` while blocked on the account: claim never visible, Reward still eligible, retry succeeds |
| After account lock, before final inserts | Worker "hangs" holding A, then is killed: lock released (a new transaction locks A within 1 s), nothing persisted, retry succeeds |
| After all final inserts, before commit | Injected failure at the audit insert: claim, event, debit, account and audit all absent; retry succeeds |
| Funding resolution throws | Rolled back, retry succeeds |
| Duplicate retry after commit | `already_projected`, same event |
| Simultaneous retries | Exactly one debit |
| Reconciliation after a failure | Failure logged (`attempt = 1`, append-only history), next pass projects it |

No stale "processing" state exists to block a Reward: there is no committed claim without an event (deferred trigger) and no lease/timeout state.

---

## 11. Tests

New: `commercialConsumption.postgres.test.ts` — **54** real-PostgreSQL tests: SOURCE (5), BUCKET (10 incl. an INV-CAP-PROV order-permutation property), BALANCE (4), IDEMPOTENCY / EXACTLY-ONCE (6), CRASH (6), RECONCILIATION (6), LOCK ORDER (12 incl. 7 racing mutations), BOUNDARY (4), PRICE PROVENANCE (1) — each asserts the per-Circle bucket, not only totals, and reconciles account to ledger.
New boundary tests (`commercialBoundary.test.ts`, +6): migration 0025 shape and sole Loyalty FK/index; the Reward adapter is `SELECT`-only with no row lock and no Loyalty import; no update/delete path on claims/events/failures; static claim → lock → funding → ledger → event → audit order with exactly one Loyalty read and one lock; projection/reconciliation not wired into any Loyalty path or scheduler.

Zero-Loyalty-writes proof: row-hash **and `xmin`** of 12 Loyalty tables identical before/after projection, duplicate projection, reconciliation and a failed projection.

Existing tests updated only for the new migration (see §13 D5).

---

## 12. Validation (all local, disposable PostgreSQL 16 + Firestore emulator)

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ok |
| `prettier --check .` | clean |
| `eslint .` | 0 errors; 1 pre-existing `apps/web` warning (`BusinessApiContext.tsx`), untouched |
| `pnpm typecheck` | clean |
| `pnpm build` | clean |
| `pnpm test` (unit) | functions 167 files / 1935 tests; web 126 / 919 — all pass |
| `pnpm emulators:validate` | 66 files, 867 passed, 3 skipped |
| Full PostgreSQL suite under the Firestore emulator | 16 files, 531 tests pass (includes migrate up/down/re-up, redemption and verify lock-order suites) |

CI (`.github/workflows/ci.yml`) runs build, lint, format, typecheck, unit, e2e and emulator validation; the PostgreSQL suites are not part of CI, which is why they were run locally as above.

**Diff verification against `origin/main`:** zero diff in `functions/src/domains/purchase`, `functions/src/domains/rewardProgram`, `functions/src/index.ts`, `apps/` (web and Experience/prototype reference), rules files, `package.json`, `pnpm-lock.yaml`.

---

## 13. Deviations and risks

**Deviations (all for review):**

- **D1 — Index on a Loyalty table.** `rewards_business_available_at_idx` is the design-approved additive index (§20). A plain `CREATE INDEX` takes a `SHARE` lock on `rewards` while it builds (blocks writes for the build); the migration runner is transactional so `CONCURRENTLY` is unavailable. Rewards are one row per completed Circle so the build is short, but schedule it accordingly.
- **D2 — Earmark seam only.** Design lists tests 9–14 and earmark reconciliation checks under WP-COM-04; the earmark table does not exist, so: the earmark path is implemented and tested via the resolver port (and reservations created with the existing `capacity_reserved` ledger entry), but the reconciliation checks that need earmark rows (*earmarked Circle consumed via fallback*, *bucket ≠ earmark*, *earmark consumed twice*, *reserved ≠ Σ earmarks − Σ consumed*) are **deferred to WP-COM-05b**. The event's `earmark_id` has no FK until then.
- **D3 — Immediate best-effort trigger not wired.** Design §5.4 lists "best-effort immediately after the verify/redemption callable returns"; wiring it requires editing the Loyalty callables, which this WP forbids. Only the sweep seam exists.
- **D4 — Read-only reconciliation checks reduced.** Design §5.6 lists report-only integrity checks (events without ledger debit, counters ≠ Σ ledger, claim without event). Those are made **structurally impossible** by constraints/triggers (§5) and are asserted in tests rather than re-implemented as queries.
- **D5 — Existing tests changed.** Migration lists/counts and Commercial drop helpers in `rewardProgramMigrations`, `platformFoundationReadiness` and the four other Commercial PostgreSQL suites; `commercialFoundation.postgres` now permits exactly one non-Commercial FK (claim → Reward); in `commercialBoundary.test.ts` the "no consumption/claim tables exist" guard is narrowed to admissions/earmarks (still forbidden), the `projectConsumption` name is removed from the WP-COM-03 "later-package" guard, and the loyalty-table-name guard exempts the single read-only Reward adapter.
- **D6 — Extra database guards** beyond the design text (claim↔Reward Business trigger, event↔ledger match trigger, claim-requires-event constraint trigger). Strengthening only.
- **D7 — Price snapshot instant.** "As at consumption" is implemented as the schedule in force at the Reward's `available_at` (deterministic across retries). No schedule ⇒ snapshots are `NULL`; there is no default price and a missing price never blocks consumption.
- **D8 — Audit vocabulary** gains `consumption_recorded` (closed TS list; the table only checks shape).
- **D9 — Failure metric** is the raw count of failure rows; thresholds and alerting are not implemented (WP-COM-10).

**Risks:**

- **Nothing runs the projection yet** (no scheduler, no wiring). A deployed system would consume no units until WP-COM-05b/10 connect it — capacity accounting is stale by design until then.
- **Fallback is the only path** until WP-COM-05b creates earmarks; expected, and observable (count metric).
- **Reconciliation ordering** uses a per-candidate failure count; cheap at current volumes, worth revisiting if a large backlog ever accumulates.
- **Lag metrics** scan the unprojected set; bounded by the anti-join index and expected to be near zero in steady state.
- **Two-store limitation** does not apply (this WP is PostgreSQL-only).

---

## 14. Rollback

`git revert` the commit. On a database holding no consumption rows `migrateDown` rolls `0025` back (drops the three tables, three functions and the `rewards` index); it **fails closed** if any claim, event or failure row exists — restore a pre-`0025` backup in that case, because those rows are tied to immutable ledger debits that a rollback does not reverse. Nothing was applied to any shared, staging or production database.

---

## 15. Recommended next

**`WP-COM-05a`** — Purchase-domain `pending_admission` status migration and `admitPurchaseToLoyalty` extraction behind gate mode `off`. It depends only on `WP-COM-01` and can start now, is the prerequisite to the admission/earmark package (`WP-COM-05b`), and is the first package permitted to touch the verify path. `WP-COM-05b` then adds reservations, earmarks and the FK on `earmark_id`, at which point the fallback becomes the exception it is designed to be.
