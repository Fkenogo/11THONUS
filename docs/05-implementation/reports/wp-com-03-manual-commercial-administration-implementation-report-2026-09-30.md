# `WP-COM-03` — Manual Commercial Administration Commands Implementation Report

> **Date:** 2026-09-30 · **Task:** `WP-COM-03`
> **Classification:** Implementation Report — primary-source document, written once at the time of the task
> **Entry `origin/main`:** `404617032ba0a59910e49a62c081f5487d945f55` (WP-COM-02 merge commit, PR #286; WP-COM-01 merge `59e388c39fa4fdb304074c18b3e6e3a6891c55d4`)
> **Branch:** `claude/determined-ride-khunqe` (restarted from the entry `origin/main` because its previous PR was merged; clean isolated cloud checkout — the contaminated primary checkout was not used)
> **Governing authority:** `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + `CORR-002` (§9, §10, §11, §12, §15, §18, §23); `DEC-SUB-014` / `FD-COM-001`
> **Status:** Implemented — pending review. Not merged. Nothing deployed; migration `0023` was run only against a local disposable PostgreSQL 16.

---

## 1. Plain-language summary (for the Founder)

After this package an Administrator can, in code (still no screen and no public endpoint), do the rest of the launch-time manual work on a Business's Commercial account:

- **Open** the account (only for a Business in Burundi or Rwanda; it starts empty — no trial, no credit, no price).
- **Grant a trial allowance** — you must pick 3, 4 or 5 units each time; there is no default and nothing is granted automatically. The 3–5 applies to each grant; it is not a lifetime limit.
- **Adjust the trial** up or down, with a reason and a reference. It can never take trial below zero or below what is already promised to running Circles.
- **Adjust paid credit** up or down (a correction), with a reason from a short fixed list and a reference. The balance may go negative; there is no floor and no maximum.
- **Activate paid service** — only after at least one payment has been confirmed; it can be done once.
- **Restrict / restore** new Circle starts — recorded as a standing fact only. Nothing enforces it yet (the gate is a later package), and it never touches loyalty data.
- **Void a confirmed settlement** — a mistaken payment is corrected by adding a reversing line to the ledger. The original credit is never edited or deleted, and if the credit was already used the balance goes negative (allowed, recoverable).

Every action is attributable, needs a reason, is audited with before/after, and is safe to retry. Loyalty is unchanged.

## 2. Implemented commands

| Command | File | Ledger effect | Storage / standing effect | Audit action |
|---|---|---|---|---|
| `openCommercialAccount` | `services/openCommercialAccount.ts` | none | zero-state account, `account_opened` standing event | `account_opened` |
| `grantTrial` | `services/grantTrial.ts` | `trial_grant` (+3..5, trial) | `commercial_trial_grants` row | `trial_granted` |
| `adjustTrial` | `services/adjustTrial.ts` | `trial_adjustment` (±, trial) | `commercial_manual_adjustments` row (bucket trial) | `trial_adjusted` |
| `adjustCommercialCredit` | `services/adjustCommercialCredit.ts` | `credit_adjustment` (±, paid) | `commercial_manual_adjustments` row (bucket paid) | `credit_adjusted` |
| `activatePaidService` | `services/activatePaidService.ts` | none | set-once `paid_service_activated_at`, `paid_service_activated` event | `paid_service_activated` |
| `restrictNewStarts` / `restoreCommercialStanding` | `services/commercialRestriction.ts` | none | `service_restriction` flag, `service_restricted` / `service_restored` events | `service_restricted` / `service_restored` |
| `voidSettlement` | `services/voidSettlement.ts` | `settlement_void_reversal` (−units, paid) | settlement `confirmed → voided` | `settlement_voided` |

All run through `runAdministratorCommand` (WP-COM-02): Platform-Administrator authority + verified MFA → `runCommercialCommand` idempotency (key bound to command type + actor + payload hash) → mutation **and** audit in one transaction. None is wired to an endpoint (`index.ts` unchanged). Credits and debits reach the account **only** through `postCommercialLedgerEntry`; there is no direct balance write.

## 3. Decisions (each follows the canonical design; none invents a rule)

1. **Account opening — an explicit command IS required.** No code creates accounts, and the ledger primitive and every other command fail with "no account" until one exists; the settlement market must be seeded from the Business's country at opening and then frozen (design §14, command #1). The Business lookup is a Firestore read owned by another domain, so it is **injected** (`resolveBusinessCountry`), preserving the "no import path from Commercial into Business/Loyalty" boundary. `commercial_effective_from` = the opening instant (Rewards before it are never billed retroactively, design §11). Grants nothing, sets no price, no standing beyond `account_opened`.
2. **Paid activation** (design §10.1 step 3, §15 #7): a **stored administrative standing fact**, **requires ≥ 1 confirmed settlement** (recorded-only and voided settlements do not count), **set-once**. Not derived from balance. It is not withdrawn if the qualifying settlement is later voided (set-once); a void changes the balance, not the historical fact.
3. **Settlement void** (design §10.4, §15 #10): `confirmed → voided` with exactly one compensating `settlement_void_reversal`. The design lifecycle is `recorded → confirmed → voided`; **voiding a `recorded` settlement is refused** — it granted nothing to reverse and its cancellation is not defined by the design, so it is not invented (see §13, D3).
4. **State conflicts** (already restricted, not restricted, already activated, already voided, account exists) are **refused under a new idempotency key** (`INVALID_STATE_TRANSITION`, audited `denied`) and **replay** under the same key — the same semantics `confirmSettlement` already has.
5. **Restoration does not admit anything.** The design's re-evaluation trigger belongs with the admission package; `pending_admission` does not exist, so there is nothing to re-evaluate.
6. **Provenance tables.** Design §20 assigns `commercial_trial_grants` (with the `units` 3–5 CHECK) and `commercial_manual_adjustments` to this work package. The WP-COM-01 ledger alone cannot carry the per-grant 3–5 rule or an explicit reference, so the narrow schema change is these two tables — no stop was needed.

## 4. Schema — migration `0023_commercial_manual_administration`

`.sql` + `.down.sql`; applied only to the local disposable database.

- **`commercial_trial_grants`**: `id`, `business_id` FK, `kind` (`initial`), **`units INTEGER CHECK (units BETWEEN 3 AND 5)`**, `granted_by/at`, `reason_code`, `reason_text` + `reference` (NOT NULL), `ledger_entry_id` (UNIQUE FK), `idempotency_key` (UNIQUE). **No `UNIQUE(business_id)`, no default on `units`, no aggregate limit.** A guard trigger requires the row to be backed by this Business's `trial_grant` ledger entry for exactly its units referencing it. UPDATE/DELETE/TRUNCATE rejected.
- **`commercial_manual_adjustments`**: `id`, `business_id` FK, `bucket` (trial|paid), `units_delta <> 0` (**no magnitude limit**), `reason_code`, `reason_text` + `reference` (NOT NULL), `created_by/at`, `ledger_entry_id` (UNIQUE FK), `idempotency_key` (UNIQUE). Paid rows must use the **closed** vocabulary (`correction`, `settlement_reconciliation`, `dispute_resolution`, `error_reversal`); **no complimentary/pilot/partner/promotional code** (`DEC-SUB-013` open). Backing-entry guard as above. Immutable.
- **`commercial_settlements` widened** (a 0022 table, created in this same programme; no deployed data): status adds `voided`; new void columns (`voided_by/at`, `void_reason_text`, `void_reference`, `void_idempotency_key`, `void_correlation_id`, `void_ledger_entry_id`); confirmation-consistency CHECK now covers all three states; the update guard is **replaced** to permit exactly `recorded → confirmed` and `confirmed → voided`, freeze every evidence/pricing/**confirmation** column, and require the voiding entry to be this Business's paid `settlement_void_reversal` of exactly `-units_purchased` referencing the settlement.
- **Index** `commercial_ledger_one_void_reversal_per_settlement` (partial unique): at most one reversal per settlement, whatever the scope key (the WP-COM-02 review lesson applied up front).
- **Not created:** admissions, earmarks, `pending_admission`, consumption tables, scheduler/notification tables, read models, provider columns, tier/plan concepts. No data seeded.
- **`0023.down.sql`** restores the 0022 settlement shape/guard and drops the additions; it **fails closed** if any grant, adjustment or voided settlement exists.

## 5. Invariants

- Account counters change only with a ledger append (WP-COM-01 deferred derivation trigger unchanged and re-proved by the new tests).
- Every grant/adjustment/void row is backed by exactly one matching ledger entry (DB-enforced) and every ledger entry it creates has a deterministic scope key `cmd:<key>:…` / `settlement:<id>:void_reversal`.
- Trial: `0 ≤ trial_reserved ≤ trial_remaining` always; a downward adjustment is limited to the **uncommitted** trial (`trial_remaining − trial_reserved`), checked under the account lock and re-enforced by the ledger primitive and CHECKs — an admitted Circle can never be silently re-classified.
- The original settlement credit and its confirmation provenance are immutable after a void; the account is reconstructable from the ledger (credit, then reversal).
- Restriction/activation are flag-only facts: they never move the account `version` or any counter.
- Snapshots (`before`/`after`) are read **under the account lock** (and the settlement lock first, matching `confirmSettlement`), so concurrent commands produce an accurate audit chain (tested).

## 6. Product Truth preserved

Consumption-first model; USD 2 basis and BI→BIF / RW→RWF untouched (no price set or read by any new command); subscription tiers absent; initial trial 3–5 chosen explicitly per grant, **no default, no automatic grant, not a lifetime cap**; later trial adjustment explicit, attributable, audited; **absence of an aggregate ceiling is NOT unlimited authorisation** (stated in code, migration and tests: each adjustment is an individually reasoned act; a ceiling would be a new Founder decision and one predicate); negative Commercial balance allowed with **no floor and no maximum** (the only bound is the 32-bit storage width of the counters — technical, not policy); zero-capacity gating is **not** implemented; active Circles and earned Rewards untouched; manual administration authorised; Founder sole Platform Administrator; `DEC-SUB-013` and `DEC-GOV-007` untouched.

## 7. Authority

`authorizeCommercialAdministrator` reused unchanged: active `platformAdministrators` record + genuinely verified MFA, one enumeration-resistant `AUTH_FORBIDDEN`. Tested for **all eight commands** × six identities (inactive administrator, no verified MFA, Business Owner / Manager / Staff, blank id): nothing is written (ledger, audit, grants, adjustments, standing, accounts all unchanged). No Owner/Manager/Staff authority, no new role, no delegated RBAC.

## 8. Idempotency

Command type, actor and payload hash are bound into the key (WP-COM-01/02 runner, unchanged). Tested: same key replays; same key across a different **Business**, **actor**, **command** or **payload** → `IDEMPOTENCY_CONFLICT` with nothing executed; a failure after ledger + provenance writes (real trigger fault) rolls back ledger, grant, account and the key reservation and the key is reusable; concurrency: 8× same-key duplicates apply once; 6× different-key credit adjustments apply serially with a gap-free version chain and a correct audit chain; concurrent open / activate / restrict / void each apply exactly once.

## 9. Audit

`account_opened`, `trial_granted`, `trial_adjusted`, `credit_adjusted`, `paid_service_activated`, `service_restricted`, `service_restored`, `settlement_voided` — each with WHO (actor), WHAT (action, target), BUSINESS, WHEN, WHY (reason), REFERENCE, BEFORE, AFTER, RESULT, ledger entry id where applicable, in the mutation's own transaction. Rejected attempts that reach the domain (idempotency conflict, state conflict, cross-Business/unknown settlement) write a `denied` row best-effort in a separate transaction; authority denials are not audited (no established actor). Customer Trust Events are not used.

## 10. Tests

- **`commercialAdministration.postgres.test.ts` — 52 PostgreSQL tests**: open (zero-state, country → market, unknown/non-launch refused, nothing granted, replay/conflict, concurrency); trial grant (3/4/5 accepted; 0,1,2,6,10,−3,3.5,NaN,undefined,"4",null rejected; no default; replay; further grants allowed and prior grants surfaced; DB CHECK/backing/immutability; schema has no per-Business uniqueness/default/tier); trial adjust (audited ±, reserved-capacity floor, zero floor, no encoded ceiling, replay/cross-Business); credit adjust (±, negative with no floor/max and recovery, closed vocabulary in code and DB, storage-width bound, replay and four conflict kinds, concurrency + audit chain); activation (preconditions incl. recorded-only and voided-only, effects, set-once, Business scoping, concurrency); restrict/restore (pure standing facts, duplicates, state conflicts audited, key reuse, concurrency, no loyalty/purchase table change); void (compensation with original credit byte-identical, negative-after-consumption and recovery, unconfirmed refused, exactly-once, concurrent voids, cross-Business, audit chain vs. racing adjustment, DB tamper refusals); authority (8 commands × 6 identities); rollback.
- **Boundary tests (+4 in `commercialBoundary.test.ts`)**: `0023` additive/self-contained (ALTER only on `commercial_settlements`, exactly two new tables, no seed); 3–5 on a single grant only, no default/cap/tier/complimentary/later-package concept; all commands use the shared runner and (where they change balances) the canonical ledger flow; only the opening command inserts accounts, and ledger/settlements are only compensated, never edited/deleted.
- Existing suites adjusted only for `0023` (expected migration lists, rollback counts, teardown lists, `commercialFoundation` table list and 3-step rollback). No assertion about an older migration changed; the WP-COM-02 boundary check that forbade the (now implemented) command names was narrowed accordingly.

## 11. Validation (disposable local PostgreSQL 16 + Firestore Emulator; cold vitest cache as in CI)

`pnpm typecheck` ✔ · `pnpm lint` ✔ (0 errors; the 1 pre-existing `apps/web` warning) · `pnpm format:check` ✔ · `pnpm build` ✔ · `pnpm test` ✔ (functions 1923, web 919) · PostgreSQL integration under `firebase emulators:exec --only firestore` on a fresh database ✔ **14 files, 447 tests** (baseline 395 + 52 new; every migration/loyalty/redemption suite passes) · `pnpm emulators:validate` ✔ (66 files, 867 passed, 3 skipped, incl. the Commercial authority emulator test). Only a local disposable database was used.

## 12. Verification of unchanged surfaces

Loyalty (`domains/purchase`, `rewardProgram`, `trust`, `identity`, `functions/src/index.ts`), `apps/`, prototype/Experience Reference docs, `package.json`, `pnpm-lock.yaml`, `firebase.json`: **zero diff**. `verifyPurchase` / `confirmRedemption` unchanged and still asserted free of Commercial coupling. No new dependency, configuration, endpoint or UI. No price value, tier, `pending_admission`, capacity gate, consumption projection, earmark, scheduler or provider integration anywhere.

## 13. Deviations / additions for review

- **D1 — explicit account-opening command with an injected Business resolver** (decision 1) rather than an implicit open.
- **D2 — state conflicts are refused, not silent no-ops** (decision 4). The design says restrict is "idempotent" and that no key is reserved for a no-op; here "idempotent" is realised as safe replay under the same key, consistent with `confirmSettlement`.
- **D3 — voiding a `recorded` settlement is refused.** Design §10.4/§15 #10 define `confirmed → voided`; a recorded settlement has no credit and no defined cancellation path, so a mistaken *recorded* entry simply stays as evidence. **Bounded design question for the Founder/Technical Lead:** should a mistaken *recorded* settlement be cancellable (e.g., a `cancelled` status)? Deferred; not guessed.
- **D4 — `reference` is mandatory** for credit/trial adjustments, trial grants, restriction and void (brief), optional for restore and activation (design: reason only).
- **D5 — closed reason vocabulary applies to paid-credit adjustments only** (design §10.3); trial adjustments take an optional shape-checked label because the design defines no trial vocabulary.
- **D6 — 32-bit counter bound.** Adjustments that would leave PostgreSQL INTEGER range are refused with a clear error. This is a storage-width guard, not a commercial floor/ceiling.
- **D7 — migration `0023` widens the 0022 `commercial_settlements` table and replaces its guard** (additive in effect; no deployed data). The `.down.sql` restores the 0022 shape.
- **D8 — `commercial_effective_from` = the opening instant** (design §11 states the purpose; the exact value at opening is taken as "now").

## 14. Risks

- **R1** — `resolveBusinessCountry` is invoked inside the transaction; the future adapter must keep it fast/idempotent (a Firestore read). It is read before any write in the body.
- **R2** — activation race: a void committing just after an activation that counted the same settlement serialises as activation-then-void; activation is set-once and is not withdrawn (decision 2). Documented, consistent with design set-once semantics.
- **R3** — the restriction flag blocks nothing until the admission package; operators must not assume enforcement.
- **R4** — authority is administrator status, not a role, until `DEC-GOV-007`; a second Platform Administrator would gain commercial power (runbook check already recorded).
- **R5** — two-store authority window (design §21) unchanged.
- **R6** — immutable rows complicate test cleanup as in WP-COM-01/02 (suites drop objects); rollback counts in older suites now include `0023`.
- **R7** — the pre-existing flaky identity emulator test (5 s timeout) seen on PR #286 may recur in CI; unrelated to Commercial.

## 15. Rollback

- **Code:** `git revert` the WP-COM-03 commit(s); nothing outside `domains/commercial` imports it.
- **Database (local/test):** `migrateDown` rolls back `0023`; `0023.down.sql` refuses while any trial grant, manual adjustment or voided settlement exists (restore a pre-`0023` backup instead). It restores the `0022` settlement shape and guard; no account/ledger/price/audit/standing object was altered.
- No deployment, configuration or dependency rollback needed.

## 16. Deferred

Capacity gate and `pending_admission`; admission earmarks/reservations; consumption projection (`WP-COM-04`); `reevaluatePendingAdmissions`; read models (`WP-COM-06`); Operator adapters/UI (`WP-COM-07`); Business read adapters (`WP-COM-08`); signals/queues (`WP-COM-09`); launch readiness incl. BIF/RWF price data and scheduler (`WP-COM-10`); cancelling a *recorded* settlement (D3); payment-provider adapter.

## 17. Review findings addressed (PR #287, automated review of `a6c3cf8`)
Three P2 findings were verified against the code and fixed; each has a regression test that fails without the fix (5 new tests).
1. **NULL passes a `CHECK`.** `reason_code IN (...)` on a nullable column evaluates to `UNKNOWN` for NULL, which PostgreSQL accepts, so a paid adjustment could carry no reason code. Fixed: the paid branch now requires `reason_code IS NOT NULL AND ... IN (...)`.
2. **Same defect in the settlement consistency CHECK.** `length(btrim(col)) > 0` on a NULL column is `UNKNOWN`, so a `voided` (and, carried over from `0022`, a `confirmed`) settlement could omit `voided_by`, reason, reference, idempotency key, `confirmed_by`, note or confirm key. Fixed in `0023` by testing `IS NOT NULL` before every length test on all three branches. Note: `0023.down.sql` restores the merged `0022` constraint verbatim, so a rollback re-introduces the `0022` NULL weakness (it is still guarded by NOT NULL columns and the command layer).
3. **Trial counter overflow.** `grantTrial` did not range-check the counter like the adjustment commands, leaking a raw INTEGER-overflow database error. Fixed with `assertCounterInRange`; the same root cause in `confirmSettlement` (paid balance) is fixed too.

## 18. Recommended next work package

**WP-COM-04** — consumption projection (event + debit honouring the earmark, failure table, reconciliation), the first package that reads a loyalty fact; **WP-COM-05a** (Purchase-domain `pending_admission` behind gate mode `off`) can run in parallel. WP-COM-06 (read models) can also start now that all administrative writes exist.
