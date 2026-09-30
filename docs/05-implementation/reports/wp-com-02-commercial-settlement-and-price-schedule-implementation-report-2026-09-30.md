# `WP-COM-02` — Commercial Settlement & Price Schedule Administration Implementation Report

> **Date:** 2026-09-30 · **Task:** `WP-COM-02`
> **Classification:** Implementation Report — primary-source document, written once at the time of the task
> **Entry `origin/main`:** `59e388c39fa4fdb304074c18b3e6e3a6891c55d4` (WP-COM-01 merge commit, PR #285)
> **Branch:** `claude/determined-ride-khunqe` (clean isolated cloud checkout; the contaminated primary checkout was not used)
> **Governing authority:** `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + `CORR-002`; `DEC-SUB-014` / `FD-COM-001`
> **Status:** Implemented — pending review. Not merged. Nothing deployed; migration `0022` was run only against a local disposable PostgreSQL 16.

---

## 1. Plain-language summary (for the Founder)

After this package an Administrator can, in code (there is still no screen and no public endpoint):

1. **Set a local unit price** for Burundi (BIF) or Rwanda (RWF), effective from a date. Nothing is pre-filled — the platform has **no default price**; you supply the number. Old prices are never edited; a new price is a new line that starts later.
2. **Record a manual payment** received outside the platform (bank transfer, cash, mobile money…). This writes down the evidence — who, how much, which reference, which price applied — but **gives the Business no credit yet**.
3. **Confirm** that payment. Only then, in a single all-or-nothing step, the Business receives its paid units in the ledger. A payment can be confirmed once; doing it twice, or racing two confirmations, cannot credit twice.

It does not touch loyalty (customers earning/redeeming behaves exactly as before), and it adds no payment provider, no live exchange rate, no roles, no screens.

## 2. Implemented scope

| Area | Delivered |
|---|---|
| Migration | `0022_commercial_settlements.sql` (+ `.down.sql`): one table, two guard functions |
| Price administration | `setPriceSchedule` |
| Price lookup | `lookupCommercialPrice(db, {market, currency, at})` |
| Settlement step 1 | `recordSettlement` |
| Settlement step 2 | `confirmSettlement` |
| Shared runner | `runAdministratorCommand` (authority → idempotency → body; optional rejection audit) |
| Repository | `commercialSettlementRepository` (insert, read, lock, one UPDATE: `recorded → confirmed`) |
| Tests | 34 PostgreSQL integration tests; 6 new structural boundary tests |

## 3. Explicitly not implemented

Trial grant/adjustment; paid credit adjustment; restriction/restoration; paid activation; `voidSettlement` (and the `voided` status); `pending_admission`; capacity gate; consumption projection; admission earmarks; Operator Console; Business UI; payment-provider integration/columns; loyalty-path changes; any launch BIF/RWF price value; any RBAC; any `index.ts` endpoint; any new dependency or configuration.

## 4. Schema (migration `0022`)

One table, `commercial_settlements`; functions `commercial_settlements_insert_guard`, `commercial_settlements_update_guard` (reuses `commercial_reject_mutation` from `0021`). **No existing object altered**; every FK points at a `commercial_*` table; `business_id` is the same opaque TEXT (design R10).

Columns: identity (`id`, `business_id` FK→`commercial_accounts`); `status` (`recorded`|`confirmed`); `source` (fixed `'manual'`); `method` (shape-checked label, no invented vocabulary); `external_reference` (mandatory, trimmed, ≤200); `market`/`currency` (BI/BIF, RW/RWF pair CHECK); `amount_minor`, `units_purchased`, `received_at`; **pricing provenance** — `price_schedule_id` FK + snapshots `unit_price_usd_minor`, `local_unit_price_minor`, `price_effective_from`, `expected_amount_minor` (= units × price, CHECK) and `variance_minor` (= amount − expected, CHECK); **step 1** — `recorded_by/at`, `record_reason_text`, `record_idempotency_key`, `record_correlation_id`; **step 2** (all NULL until confirmed, CHECK-enforced consistency) — `confirmed_by/at`, `confirmation_note`, `confirm_idempotency_key`, `confirm_correlation_id`, `ledger_entry_id` FK→ledger.

Uniqueness: `(method, external_reference)` (one piece of evidence, one settlement), `record_idempotency_key`, `confirm_idempotency_key`, `ledger_entry_id` (one credit finalises at most one settlement).

Database guards: insert only as `recorded`, in the Business account's own market, with a price snapshot equal to the schedule that was **in force at `received_at`**; update only `recorded → confirmed`, all evidence/pricing columns frozen, and the confirming ledger entry must be *this Business's paid `credit_grant` for exactly `units_purchased` referencing this settlement*; DELETE/TRUNCATE rejected.

No provider columns, no `tax_basis`, no `voided`, no later-package tables (asserted by a boundary test). `.down.sql` fails closed while any settlement row exists.

## 5. Commands

Common: `runAdministratorCommand` — (1) `authorizeCommercialAdministrator` (active administrator record + genuinely verified MFA; one enumeration-resistant `AUTH_FORBIDDEN`); (2) `runCommercialCommand` (reserve → mutate → complete in one transaction; key bound to command + actor + payload hash); (3) mutation **and** audit inside that one transaction. Results are JSON-safe so a replay returns the stored snapshot. Commands are **not** wired to any endpoint (same as WP-COM-01).

### 5.1 `setPriceSchedule`
Input: market, currency, `localUnitPriceMinor`, optional `usdEquivalentMinor` (must be 200), `effectiveFrom`, optional `rateNote`, mandatory `reasonText`, optional `reference`.
Rules: market ∈ {BI, RW}; currency = that market's own; price a positive whole integer; USD basis 200; effective date required; **strictly after the market's latest schedule**; **not in the past** (see §15); reason required. Effect: one new row; audit `price_schedule_set`. No default, no seed, no FX, no live-rate claim.

### 5.2 `recordSettlement` — step 1
| | |
|---|---|
| Permitted initial state | none (a settlement is born `recorded`) |
| Resulting state | `recorded` — **no ledger entry, account untouched** |
| Actor | active Platform Administrator, verified MFA |
| Reference | mandatory `(method, externalReference)`, unique |
| Idempotency | client key (command+actor+payload bound); a different key for an already-recorded reference is **refused**, not replayed |
| Audit | `settlement_recorded` (atomic) |
| Prohibited repeat | same reference again; same key with a different payload |

Validation under the per-Business account lock: account exists; currency = the account's market currency; `receivedAt` valid and not in the future; price looked up **at `receivedAt`** (explicit failure if none); expected amount/variance computed and recorded (never blocking — design §10.2; no tolerance invented).

### 5.3 `confirmSettlement` — step 2
| | |
|---|---|
| Permitted initial state | `recorded` |
| Resulting state | `confirmed` + exactly one paid `credit_grant` of `units_purchased` |
| Actor | active Platform Administrator, verified MFA |
| Reference | settlement id; ledger `source_reference = settlement:<id>`; scope key `settlement:<id>:credit_grant` |
| Idempotency | key bound to command+actor+payload (businessId, settlementId, note); same key replays; **new key on a confirmed settlement is refused** |
| Audit | `settlement_confirmed` with ledger entry id, price schedule id, account before/after |
| Prohibited repeat | any second confirmation (state check under the settlement row lock + unique ledger scope key + DB transition guard) |

## 6. Price lookup model
`lookupCommercialPrice`: latest schedule of the market with `effective_from <= at`. Fails with `RESOURCE_NOT_FOUND` when none applies; `VALIDATION_FAILED` for an unsupported market, a currency that is not the market's own (no cross-market substitution), or an invalid instant. No FX, no fallback. Because schedules only append forward and are immutable, the answer for a past instant never changes. Tested to the exact effective-date boundary and for RW not borrowing BI's price.

## 7. Ledger and account integration
`confirmSettlement` calls the existing `postCommercialLedgerEntry` (`credit_grant`, bucket `paid`, `+units_purchased`), which appends the ledger entry and moves the derived account together under the account lock; the deferred WP-COM-01 trigger still proves account = latest ledger entry at COMMIT. **No code path writes account counters for settlements** (a boundary test restricts `updateAccountCounters` to the posting primitive). A ledger scope that already exists for a still-`recorded` settlement aborts the transaction rather than being papered over.

## 8. Provenance
- **Pricing:** settlement stores `price_schedule_id` **and** the values (USD basis, local unit price, effective date, expected amount, variance) — reference for provenance, snapshot for immunity to later repair (design §13). Tested: a later schedule leaves an existing settlement's snapshot and the historical lookup unchanged.
- **Settlement:** actor(s), reasons/notes, external reference, amounts, timestamps, both idempotency keys, correlation ids, and the resulting ledger entry id are immutable once written (DB-enforced); the ledger entry links back via `source_reference`.

## 9. Idempotency (verified)
Command type and actor are bound into the request hash. Tested against PostgreSQL: same key/same payload replays with no second write; same key with a different **command**, **actor**, **payload**, or **Business** → `IDEMPOTENCY_CONFLICT` with nothing executed; a failure after the credit and the status flip (simulated by a temporary audit-insert fault) rolls back ledger, account, settlement and the key reservation, and the same key succeeds once the fault is removed; concurrent duplicate confirmations (8×, same key) credit once; concurrent confirmations with different keys (6×) credit once; concurrent recordings of one reference under different keys create one settlement.

## 10. Authority
Reuses WP-COM-01's `authorizeCommercialAdministrator` unchanged. Tested for all three commands: inactive administrator, verified-MFA absent, and Business Owner/Manager/Staff identities (which have no `platformAdministrators` record) — all `AUTH_FORBIDDEN`, and the settlement/audit/ledger/price row counts are unchanged. No Manager/Owner/Staff mutation, no new role, no administrator RBAC; `DEC-GOV-007` remains open.

## 11. Audit
`price_schedule_set`, `settlement_recorded`, `settlement_confirmed`, each: WHO (actor), WHAT (action, target), BUSINESS, WHEN, WHY (reason text), REFERENCE, RESULT, plus before/after snapshots and related ledger/price ids, written in the mutation's own transaction; replays cannot double-audit (`(idempotency_key, action_type)` unique). Rejected attempts that reach the domain — idempotency conflict, duplicate reference, wrong-state confirmation, cross-Business/unknown-settlement confirmation — write a `denied` audit row in a separate best-effort transaction (a failed audit never masks the real error). Customer Trust Events are not used.

## 12. Tests
`commercialSettlement.postgres.test.ts` — 34 tests, real PostgreSQL:
- **Price (8):** no seed; BI/BIF & RW/RWF only; integer/positive/USD-basis/reason/date validation; past-dating refused; audited, replay-safe set; forward rule + immutability (incl. DB UPDATE/DELETE rejection); concurrent same-date race (one winner); deterministic lookup to the boundary, no FX/no cross-market/no fallback.
- **Record (6):** evidence only (no ledger, account untouched); price at `receivedAt`, variance recorded; no price → explicit failure; validation; conflicting reference refused + audited; replay.
- **Confirm (8):** exactly-once credit and derived account; duplicate replay; new-key repeat refused; cross-Business rejected; unknown/malformed/no-note; accumulation; rollback (real fault) and primitive-level rollback.
- **Idempotency (7)**, **Authority (1, ×3 commands ×6 identities)**, **DB guards/provenance (4):** later price never rewrites a settlement; tamper attempts (evidence edit, status jump, DELETE, TRUNCATE, unbacked or re-used ledger entry, born-confirmed, wrong market, forged snapshot, non-current schedule, bad variance/currency/method).

Boundary tests (`commercialBoundary.test.ts`, +6): `0022` additive/self-contained/one table; no seed/provider/tier/later-WP concept; no account-counter write outside the posting flow; settlement UPDATE only via the `recorded→confirmed` statement, never DELETE/TRUNCATE; commands reuse authority/idempotency/ledger seams; no Business-side authority, RBAC, FX, provider, or later-package command in executable code.

Existing suites adjusted only for `0022` (expected migration lists, rollback step counts, teardown lists, `commercialFoundation` table list/rollback steps). No existing assertion about an older migration changed.

## 13. Validation performed (disposable local PostgreSQL 16 + Firestore Emulator)
`pnpm typecheck` ✔ · `pnpm lint` ✔ (0 errors; the 1 pre-existing `apps/web` warning) · `pnpm format:check` ✔ · `pnpm build` ✔ · `pnpm test` ✔ (functions 1918/1918, web 919/919) · PostgreSQL integration under `firebase emulators:exec --only firestore`, fresh database (the CI command) ✔ **13 files, 392 tests** (baseline 358 + 34 new) · `pnpm emulators:validate` ✔ (66 files, 867 passed, 3 skipped). Only a local disposable database was used; no shared/staging/production database was contacted.

## 14. Verification of unchanged surfaces
- **Loyalty path:** `git diff origin/main` over `domains/purchase`, `domains/rewardProgram`, `domains/trust`, `functions/src/index.ts` is empty; `verifyPurchase`/`confirmRedemption` unchanged and still asserted free of Commercial coupling.
- **UI / prototype:** no file under `apps/`, `docs/stitch`, `docs/07-product-design` changed.
- **Dependencies / config:** `package.json`, `pnpm-lock.yaml`, `firebase.json` unchanged.
- **Product Truth:** none added or reinterpreted; commercial unit = USD 2 basis; BI→BIF, RW→RWF; no live FX; no launch price invented; subscription tiers absent; `DEC-SUB-013` and `DEC-GOV-007` untouched.

## 15. Deviations / additions for review
1. **No-backdating rule.** The design only requires a new schedule's `effective_from` to be not before the latest. `setPriceSchedule` additionally refuses an `effectiveFrom` in the past, so `lookup(t)` for any past `t` can never change after the fact (historical safety). Easy to relax if the Founder wants a retroactive first price; note the first price can equally be set effective "now or later".
2. **Platform-scope audit marker.** `commercial_audit_events.business_id` is NOT NULL and a price schedule has no Business, so price audit rows carry `platform:market:<BI|RW>` instead of altering the WP-COM-01 table. Searching audit by action/actor finds them; by Business does not.
3. **Pricing point-in-time.** A settlement snapshots the schedule in force at **`receivedAt`** (when the money arrived), not at recording time; recording fails explicitly if none existed then.
4. **`voided` deferred.** Design §10.4 `voidSettlement` and the `voided` status belong to WP-COM-03; the ledger already has `settlement_void_reversal`, so adding it is additive.
5. **Confirmation note always mandatory** (design: "confirmation note"); variance is recorded and never blocks; no tolerance rule invented.
6. **Rejection audit is best-effort and separate**, and authority denials are not audited (no established actor to attribute).
7. **`provider_event_id` / `source='provider'` not added** (design says reserved-nullable, "nothing built"); `source` is fixed to `manual` and a future adapter widens it additively.
8. Method label is shape-checked (`^[a-z][a-z0-9_]{0,63}$`), no closed vocabulary invented.

## 16. Risks
- **R1 — `receivedAt` price lookup vs. later schedule.** Correct by construction (forward-only, no backdating), but a Business paying at an old price after a price change is priced at the old schedule if `receivedAt` says so — an operator input the audit trail records.
- **R2 — `(method, external_reference)` uniqueness** is global, not per Business: a reference typo colliding with another Business's evidence blocks recording (safe-fail; operator must correct).
- **R3 — two-store authority window** unchanged (design §21).
- **R4 — audit-by-Business omits price events** (deviation 2).
- **R5 — immutable rows complicate test cleanup** as in WP-COM-01; the new suite drops objects, and existing suites' rollback counts now include `0022`.
- **R6 — administrator status is authority** until `DEC-GOV-007`; a second Platform Administrator would gain commercial power (runbook check already recorded).

## 17. Rollback
- **Code:** `git revert` the WP-COM-02 commit(s); nothing outside `domains/commercial` imports it.
- **Database (local/test):** `migrateDown` rolls `0022` back; `0022.down.sql` refuses while any settlement row exists (restore a pre-`0022` backup instead). Touches no earlier object.
- No deployment, configuration or dependency rollback needed.

## 18. Deferred to `WP-COM-03`
`openCommercialAccount`; `grantTrial` / `adjustTrial` (trial-grant table, 3–5 rule); `adjustCommercialCredit`; `activatePaidService`; `restrictNewStarts` / `restoreCommercialStanding`; `voidSettlement` (+ `voided` status); read/inspection commands; optional provider-adapter columns. Still later: consumption projection (WP-COM-04), `pending_admission`/gate (WP-COM-05a/b), read models (WP-COM-06), Operator/Business UI.

## 19. Recommended next work package
**WP-COM-03** — the remaining manual administration commands, composing the same runner, authority, idempotency, audit and ledger primitives now proven by WP-COM-01/02.
