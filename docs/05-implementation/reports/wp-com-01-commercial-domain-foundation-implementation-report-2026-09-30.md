# `WP-COM-01` — Commercial Domain Foundation Implementation Report

> **Date:** 2026-09-30 · **Task:** `WP-COM-01`
> **Classification:** Implementation Report — primary-source document, written once at the time of the task
> **Entry `origin/main`:** `1d1eec7befafe33023e38150ea0f6e77f982fab3` (PR #284 merge commit; canonical design head `4bb4671d0dbb7ed36c67b18c8a8de778080c3bd5`)
> **Branch:** `claude/bold-meitner-uzys3a` (isolated clean cloud checkout; the contaminated primary checkout was not used)
> **Governing authority:** `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + `CORR-002` (canonical on `main`); `DEC-SUB-014` / `FD-COM-001`
> **Status:** Implemented — pending review. Not merged. Nothing deployed; no migration executed outside the local disposable test database.

---

## 1. Plain-language summary (for the Founder)

WP-COM-01 lays the **permanent foundation of the Commercial domain** and nothing else. After it, the platform has, in PostgreSQL:

- a **per-Business commercial account** (the running totals);
- an **append-only ledger** — the permanent accounting record that the account totals are derived from. Once written, a ledger line cannot be changed or deleted, even by direct database access;
- a place to store **effective-dated local unit prices** (BIF / RWF, on the USD 2 basis) — **empty**; no price was invented;
- an **immutable audit table** (who, what, which Business, when, why, which reference, what result);
- a small **standing timeline** (account opened, restricted, restored, paid service activated);
- the code seams future commands will use: idempotent command runner, Platform-Administrator authority check, ledger posting.

**None of it is connected to loyalty.** A customer buying, verifying, earning or redeeming behaves exactly as before; the loyalty code is byte-for-byte unchanged and cannot even import Commercial.

## 2. What was implemented

| Area | Delivered |
|---|---|
| Migration | `0021_commercial_domain_foundation.sql` (+ `.down.sql`) — five tables, five functions, immutability/integrity triggers |
| Account | `commercial_accounts`: Business-scoped, `settlement_market` (BI/RW), `commercial_effective_from`, materialised counters (`trial_remaining_units`, `paid_balance_units`, `trial_reserved_units`, `paid_reserved_units`), `service_restriction`, set-once `paid_service_activated_at`, `version`, timestamps |
| Ledger | `commercial_ledger_entries`: append-only authority; nine entry types; two buckets; `units_delta` + per-bucket reserved deltas; point-in-time `*_after`; soft provenance reference; idempotent `idempotency_scope_key`; deterministic per-Business order via `account_version`; attribution and correlation |
| Pricing | `commercial_price_schedules`: market/currency (BI→BIF, RW→RWF), `usd_equivalent_minor`, `local_unit_price_minor`, `effective_from`, reason/attribution; non-overlapping monotonic timeline; **no rows seeded**; no FX |
| Audit | `commercial_audit_events`: WHO / WHAT / WHICH BUSINESS / WHEN / WHY / REFERENCE / RESULT (+ before/after snapshots, related ledger/price ids, correlation, idempotency key) |
| Standing | `commercial_standing_events`: immutable administrative timeline |
| Code | `functions/src/domains/commercial/`: models, five repositories (account, ledger, price, audit, standing), `postCommercialLedgerEntry`, `runCommercialCommand` (idempotency adapter), `authorizeCommercialAdministrator` (authority seam) |
| Tests | 50 PostgreSQL integration tests, 18 unit/structural tests, 3 emulator tests; existing migration suites updated for `0021` |

## 3. What was deliberately NOT implemented

Capacity gating; `pending_admission`; admission port/processor; reservation/earmark tables (`commercial_admissions`, `commercial_admission_blocks`); consumption claims/events/projection; projection-failure table; trial-grant and manual-adjustment tables; settlements; notification intents; signal config; read-model views; any `verifyPurchase` / `confirmRedemption` change; Operator Console; Business commercial UI; scheduler/alerting; payment provider; any launch price value; any RBAC; any `index.ts` endpoint. The commands `openCommercialAccount`, `grantTrial`, `adjustTrial`, `setPriceSchedule` etc. are **not** built — only the primitives they will compose.

## 4. Schema added (migration `0021`)

Five tables — `commercial_accounts`, `commercial_ledger_entries`, `commercial_price_schedules`, `commercial_standing_events`, `commercial_audit_events` — and functions `commercial_reject_mutation`, `commercial_accounts_guard`, `commercial_price_schedules_versioning`, `commercial_assert_account_matches_ledger`. **No existing object is altered** (no `ALTER`, no `DROP`, no `INSERT`). Every foreign key points to another `commercial_*` table; `business_id` is an opaque `TEXT` exactly as in the loyalty tables (design §4.4 R10). No loyalty table references Commercial.

## 5. Domain boundaries

- Commercial imports **only** `shared/`, `infrastructure/postgres/`, the generic idempotency repository (`rewardProgram/repositories/idempotencyRepository`, which `purchase` also reuses) and the administrator record parser/collection name (`platformAdministration`). Nothing else.
- Commercial SQL writes **only** `commercial_*` tables and mentions no loyalty table.
- No file outside `domains/commercial` imports Commercial (including `index.ts`, `verifyPurchaseCommand.ts`, `confirmRedemptionCommand.ts`). Enforced by `commercialBoundary.test.ts`.
- Foreign-key strategy (design §4.4): Commercial→Commercial FKs only (R11); no Commercial→Loyalty FK (R8), no Loyalty→Commercial (R9). No lock interaction with any loyalty row is possible.

## 6. Account, ledger, pricing, audit models

**Account (derived state).** `available capacity = (trial_remaining + paid_balance) − (trial_reserved + paid_reserved)` is exposed as a read-only helper only; no gate uses it. Integrity CHECKs: `trial_reserved ≥ 0`, `trial_remaining ≥ trial_reserved`, `paid_reserved ≥ 0`. **No sign CHECK on `paid_balance_units`; no ceiling on any trial value; every counter defaults to 0.** The account is never deleted; `business_id`, `settlement_market`, `commercial_effective_from`, `created_at` are frozen; `paid_service_activated_at` is set-once.

**Version rule.** `version` advances by exactly 1 **when a counter changes** (one ledger append); flag-only administrative updates (restriction, paid activation) do not move it. A counter change without `+1`, or `+1` without a counter change, is rejected by trigger.

**Ledger (authority).** Entry types: `trial_grant`, `trial_adjustment`, `credit_grant`, `credit_adjustment`, `capacity_reserved`, `capacity_released`, `consumption`, `consumption_reversal`, `settlement_void_reversal`. A `type_shape` CHECK fixes bucket/sign semantics (e.g. `credit_grant` is paid and positive; `consumption` is exactly −1 and may release a reservation only on **its own** bucket). Negative paid balances are representable without limit. `UNIQUE(idempotency_scope_key)` and `UNIQUE(business_id, account_version)` give idempotent scope and deterministic order.

**Account ⇄ ledger derivation (I-1).** A `DEFERRABLE INITIALLY DEFERRED` constraint trigger on both tables makes a transaction **fail at COMMIT** unless the account's counters and version equal its latest ledger entry (or the zero opening state when it has none). This makes it impossible to commit a hand-edited account, an account created with a non-zero starting state (no silent trial default), or a ledger append without its account update. This goes slightly beyond the design (which relies on the repository) and is recorded in §13.

**Pricing.** `usd_equivalent_minor` is validated to be 200 (USD 2) by the command layer, deliberately **not** a DB CHECK (design §13). A trigger requires each new schedule's `effective_from` to be strictly after the market's latest (serialised per market by an advisory lock); `UNIQUE(market, effective_from)` backs it. Correction = new later row. `getEffectivePriceSchedule(market, at)` returns the latest row with `effective_from ≤ at`, else `null`. Future consumption events/settlements will snapshot the schedule id and values (design §13); the foundation provides the immutable source for that.

**Audit.** Insert-only; one row per `(idempotency_key, action_type)`; action vocabulary closed in code (design §15/§18), shape-checked in the table; `reason_text` mandatory and non-blank; `business_id` is a soft reference (audit must outlive and never lock other rows, R7). Customer Trust Events are **not** used.

## 7. Idempotency integration

No new framework. `runCommercialCommand` wraps the existing `checkAndReserveIdempotencyKey` / `completeIdempotencyKeyInTransaction` in the repository's single-transaction convention: `BEGIN → reserve → mutate → complete → COMMIT`. Proven: first run executes and completes the key (`operation_type = commercial.<command>`); duplicate returns the stored snapshot; same key with a different request hash returns `conflict` without running the body; a failure after partial work (ledger + audit written) **rolls back the reservation with everything else** — no `processing` row, no ledger, no audit, key reusable; the key is never completed on a failed path; concurrent duplicates run the body exactly once. Per design §23, a future no-op/hold must not call the runner (no key is reserved for a no-op).

## 8. Authority boundary

`authorizeCommercialAdministrator` = the `FD-BUS-ACT-001` precedent: an **active** `platformAdministrators` record parsed by the existing `fromPlatformAdministratorDocument` **plus** genuinely verified MFA (`deriveVerifiedMfaSatisfied` output, never a client flag), one enumeration-resistant denial reason. No role check, no new role/permission/override. No Business-side authority is accepted anywhere. Read happens before the PostgreSQL transaction (two-store limitation, design §21/§25). `DEC-GOV-007` remains open; Founder remains the sole Platform Administrator at launch. Proven with fakes (unit) and against the real Firestore Emulator.

## 9. Immutability and integrity mechanisms

| Mechanism | Applies to |
|---|---|
| `BEFORE UPDATE OR DELETE` trigger raising `restrict_violation` | ledger, audit, price schedules, standing events |
| `BEFORE TRUNCATE` statement trigger (in addition to PostgreSQL's FK guard) | the four above and accounts |
| `commercial_accounts_guard` (freeze fields, set-once activation, version rule, no delete) | accounts |
| Deferred account⇄ledger derivation trigger | accounts + ledger |
| CHECK / UNIQUE / FK (type shape, bucket, provenance pair, unique scope, unique version, market/currency pair, positive whole prices) | all |
| Price versioning trigger + advisory lock | price schedules |

## 10. Tests added

- `commercialFoundation.postgres.test.ts` — 50 tests: schema shape (exactly five tables; self-contained FKs; **no seed data**; no tier/plan column; no trial ceiling/3–5/default/negative floor); reversible migration and fail-closed rollback; account defaults/uniqueness/market/version/freeze/derivation; ledger append order, UPDATE/DELETE/TRUNCATE rejected, FK mismatch, replay/idempotent scope (including concurrent), duplicate version, type-shape, provenance pair, 8-way concurrent append (gap-free versions, no lost update); negative balance with no floor/max and recovery; the 3–5 rule **not** an account default/ceiling; reserved/trial integrity floor; reservation→consumption per bucket (INV-CAP-PROV compatibility, no policy); price effective-dating, non-overlap, unsupported currency/market/mismatch, USD-2 and whole-price validation, immutability; audit completeness, atomic rollback, replay de-dup, malformed input, immutability; standing idempotency/immutability; idempotency integration (§7). Price values are marked TEST-ONLY.
- `commercialBoundary.test.ts` — architectural boundary (§5) plus migration purity (additive, self-contained, no tier/trial-cap/price/negative-limit, no later-WP tables, no `pending_admission`, no consumption/admission/gate code).
- `commercialFoundation.test.ts`, `commercialAuthority.test.ts`, `commercialAuthority.emulator.test.ts` — vocabulary, derivations, authority.
- Existing `rewardProgramMigrations.postgres.test.ts` and `platformFoundationReadiness.postgres.test.ts` updated only to include `0021` in expected migration lists / rollback counts and to drop Commercial objects in their table teardown. No assertion about any pre-existing migration changed.

## 11. Validation performed (local disposable PostgreSQL 16 + Firestore Emulator)

`pnpm typecheck` ✔ · `pnpm lint` ✔ (0 errors; 1 pre-existing `apps/web` warning) · `pnpm format:check` ✔ · `pnpm build` ✔ · `pnpm test` ✔ (functions 1912/1912 incl. the new unit/structural tests; web 919/919) · PostgreSQL integration under the Firestore Emulator, cold vitest cache as in CI ✔ (12 files, **358** tests; the same command on pristine `origin/main` gives 11 files, 308 tests — the 50 new tests are this package's; every loyalty/redemption suite passes unchanged) · `pnpm emulators:validate` ✔ (66 files, 867 passed, 3 skipped, incl. the new authority emulator test). Only a local disposable PostgreSQL 16 was used; no shared/staging/production database was contacted.

**Pre-existing intermittent failure, not caused by this package.** With a *warm* local vitest cache, `platformFoundationReadiness.postgres.test.ts › reports migration foundation not established on a fresh database` fails whenever the sequencer runs it after the loyalty suites (which leave a migrated schema behind). Reproduced on pristine `origin/main` (3 failures in 6 warm-cache runs); with a cold cache (the CI condition) it passes deterministically on both `origin/main` and this branch. The new Commercial suite restores a pristine database on exit when it started from one, so it does not add to the problem. Left untouched as out of scope; suggested as a separate hygiene task (give that file a `beforeEach` that drops `schema_migrations`).

## 12. Verification of unchanged surfaces

- **Loyalty path:** `git diff origin/main` over `functions/src/domains/purchase`, `rewardProgram`, `trust` and `functions/src/index.ts` is **empty**; `verifyPurchaseCommand.ts` and `confirmRedemptionCommand.ts` byte-identical and asserted free of Commercial coupling.
- **Prototype / Experience Reference:** no file under `apps/`, `docs/stitch`, `docs/07-product-design` changed.
- **Dependencies / config:** `package.json`, `pnpm-lock.yaml`, `firebase.json` unchanged.
- **Product Truth:** none added, changed or interpreted; `DEC-SUB-013` and `DEC-GOV-007` untouched; Decision Register untouched; no subscription tier, no universal trial default, no trial ceiling, no negative-credit limit, no price value.

## 13. Deviations from / additions to the design (for review)

1. **Price-schedule table** (design assigns it to WP-COM-02) is pulled forward into this package because the task's scope requires the pricing data foundation. Settlements and `setPriceSchedule` remain WP-COM-02/03.
2. **Trial-grant table** (with its `units BETWEEN 3 AND 5` CHECK, design §9/§20) is **not** created here: it belongs with the `grantTrial` command (WP-COM-03). Consequently the 3–5 rule exists nowhere yet, and tests prove it is not an account/ledger default or ceiling.
3. **Ledger shape.** One `bucket` + `units_delta` + `trial_reserved_delta` / `paid_reserved_delta`, and separate `trial_reserved_after` / `paid_reserved_after` (design lists a single `reserved_after`). Superset, so INV-CAP-PROV per-bucket provenance stays satisfiable; a mixed-bucket reservation is two entries.
4. **Deferred derivation trigger and version rule** (§6) are stricter than the design's repository-only discipline.
5. **Audit** gains `result` and `reference` columns to satisfy the brief's "WHAT RESULT / WHICH REFERENCE"; `actor_role` is expressed as `actor_type` (`platform_administrator` | `system`).
6. **Standing events** get an `idempotency_scope_key` (design: "key unique").

## 14. Known risks

- **R1 — ledger CHECK strictness.** The `type_shape` CHECK encodes sign/bucket semantics; a later WP needing a new shape (e.g. a mixed-bucket single entry, or a new reason-driven type) needs an additive migration to widen it. Chosen deliberately: cheap to widen, dangerous to leave open on money data.
- **R2 — commit-time trigger cost.** The deferred derivation trigger runs one small indexed query per touched row at commit; negligible at expected volume, to be re-measured with the WP-COM-04/05b concurrency tests.
- **R3 — immutable rows complicate test cleanup.** DELETE/TRUNCATE are impossible by design; tests use unique Business ids and `DROP` in teardown. Any future suite needing a reset must do the same.
- **R4 — price timeline is strictly forward-only.** A backdated correction cannot be inserted; by design a correction is a later-effective row (design §13). Flagged in case operations expect retroactive fixes.
- **R5 — authority is administrator status, not a role,** until `DEC-GOV-007` (design §25). Adding a second Platform Administrator would confer commercial power; launch runbook check already recorded in the design.
- **R6 — two-store authority window.** Firestore admin revocation between check and PostgreSQL commit is the accepted limitation (design §21).
- **R7 — migration ordering.** `0021` presumes `0001–0020`; deployment ordering of `0019/0020` remains an acceptance criterion of the design (§31.6), not verified against any deployed database here.

## 15. Rollback

- **Code:** `git revert` the WP-COM-01 commit(s). Nothing imports the Commercial module outside itself, so removal cannot affect any other domain.
- **Database (local/test only, empty):** `migrateDown(pool, migrationsDir, 1)` runs `0021.down.sql`, which **fails closed** if any Commercial row exists (governed evidence is never silently discarded); on a populated database, restore a pre-`0021` backup. The migration touched no pre-existing object, so nothing else needs restoring.
- No deployment, configuration or dependency rollback is needed (none was made).

## 16. Next work package recommendation

**WP-COM-04 is not next.** Recommended next: **WP-COM-02 (settlements table, `setPriceSchedule` command, BI/RW market rules) immediately followed by WP-COM-03 (manual administration commands `openCommercialAccount`, `grantTrial`, `adjustTrial`, settlement/credit/restriction commands with audit and idempotency)** — they compose only the primitives delivered here, are still fully outside the loyalty path, and unblock WP-COM-04 (consumption projection), which is the first package that reads a loyalty fact. WP-COM-05a (Purchase-domain `pending_admission`, behind gate mode `off`) can run in parallel after review of this package.
