# `WP-COM-03A` — Recorded Settlement Cancellation Implementation Report

> **Date:** 2026-09-30 · **Task:** `WP-COM-03A`
> **Classification:** Implementation Report — primary-source document, written once at the time of the task
> **Entry `origin/main`:** `e986d38ee7854404f6c8403bfc6ff329157668f6` (WP-COM-03 merge commit, PR #287)
> **Branch:** `claude/confident-lamport-jrvajp` (clean isolated cloud checkout at the entry SHA; the contaminated primary checkout was not used)
> **Governing authority:** `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + `CORR-002` (§10, §15, §18); closes `WP-COM-03` report deviation **D3**
> **Status:** Implemented — pending review. Not merged. Nothing deployed; migration `0024` was run only against a local disposable PostgreSQL 16.

---

## 1. Plain-language summary (for the Founder)

Until now a payment record entered by mistake and **not yet confirmed** could only sit there forever as evidence. After this package an Administrator can **cancel** it.

- Cancelling is only possible while the record is still *recorded* (no credit has been given).
- It needs a **reason** and a **reference**, and only the Platform Administrator (with verified MFA) can do it.
- It changes **no money**: no credit line is added, no balance moves, no price changes, nothing in Loyalty is touched.
- The record is never deleted. It stays, marked *cancelled*, with who/when/why permanently attached, plus an audit entry.
- A cancelled record can never be confirmed later, and no credit can ever be attached to it — the database itself refuses, not just the application.
- If credit was **already** granted (the settlement was confirmed), cancelling is refused. That case is still corrected the way it always was: **void**, which adds a reversing line to the ledger.
- Retrying the same request is safe.

This is the last piece of manual Commercial administration for the current launch scope. Nothing about the capacity gate, admissions or consumption is built here.

## 2. Settlement lifecycle after this package

```
recorded ──confirm──▶ confirmed ──void──▶ voided        (unchanged)
   │
   └──cancel (NEW)──▶ cancelled                           (terminal, no ledger effect)
```

| From \ To | recorded | confirmed | voided | cancelled |
|---|---|---|---|---|
| **recorded** | — | ✅ | ❌ | ✅ **new** |
| **confirmed** | ❌ | — | ✅ | ❌ |
| **voided** | ❌ | ❌ | — | ❌ |
| **cancelled** | ❌ | ❌ | ❌ | ❌ (terminal) |

The database transition guard enforces exactly the three ✅ edges. Existing rows in every previous status remain valid.

## 3. `cancelSettlement`

`functions/src/domains/commercial/services/cancelSettlement.ts`, built like `voidSettlement` and run through the same `runAdministratorCommand` (authority → idempotency → mutation **and** audit in one transaction).

| Aspect | Behaviour |
|---|---|
| Input | `businessId`, `settlementId`, `reasonText` (required), `reference` (required) |
| Actor | active Platform Administrator, verified MFA (existing seam; no new role) |
| Precondition | settlement belongs to `businessId` and is `recorded`; anything else → `INVALID_STATE_TRANSITION`; unknown/malformed/cross-Business id → `RESOURCE_NOT_FOUND` |
| Effect | `recorded → cancelled` with cancellation provenance; **no ledger entry, no account write, no price/standing/Loyalty write** |
| Locks | settlement row `FOR UPDATE`, then account row (same order as `confirmSettlement`/`voidSettlement`; no deadlock, no new lock class) |
| Idempotency | shared runner: key bound to command type + actor + payload hash (`businessId`, `settlementId`, `reasonText`, `reference`) |
| Audit | `settlement_cancelled`, written in the same transaction |
| Wiring | none (no callable, route or UI), like the other Commercial commands |

## 4. Migration `0024_commercial_settlement_cancellation`

Additive; **no table created or dropped, no existing column or row altered.**

1. **Provenance columns** on `commercial_settlements` (all NULL unless cancelled): `cancelled_by`, `cancelled_at`, `cancel_reason_text`, `cancel_reference`, `cancel_idempotency_key` (UNIQUE), `cancel_correlation_id`. Names follow the `void_*` convention.
2. **Status CHECK** widened to `recorded | confirmed | voided | cancelled`.
3. **Lifecycle CHECK replaced** (`commercial_settlements_confirmation_consistency`). Four branches. A `cancelled` row **requires** complete, non-blank cancellation provenance and **forbids** any confirmation, void or ledger data; every other status **forbids** any cancellation data. Every text column is tested `IS NOT NULL` first (the NULL-safety lesson of the PR #287 review: `length(btrim(NULL)) > 0` is UNKNOWN, which a CHECK accepts).
4. **Transition guard replaced** (`commercial_settlements_update_guard`): allows only `recorded→confirmed`, `recorded→cancelled`, `confirmed→voided`; freezes every evidence/pricing column on every transition; the confirm and void branches are copied verbatim from `0023`; the cancel branch **refuses if any ledger entry (any Business) references the settlement**.
5. **One BEFORE INSERT trigger on `commercial_ledger_entries`** (`commercial_ledger_reject_cancelled_settlement_reference`): a ledger entry may not reference a cancelled settlement. It takes `FOR SHARE` on the settlement row, which conflicts with the cancelling `UPDATE`, so a cancel and a raw credit cannot both commit (see §7). It only *reads* the settlement; the ledger table and its immutability triggers are not altered.

`.down.sql` restores the `0023` shape and guard and **fails closed** while any cancelled row exists (governed evidence; the restored status CHECK could not hold it).

Not created (later packages): `pending_admission`, admissions/earmarks, consumption projection, scheduler tables, Operator read models, payment-provider columns.

## 5. Database guarantees (independent of the service layer)

| Requirement | Enforced by |
|---|---|
| Cancelled row has full provenance | lifecycle CHECK (cancelled branch, NULL-safe) |
| Non-cancelled rows carry no cancellation data | lifecycle CHECK (other three branches) |
| `recorded → cancelled` is the only cancellation edge | transition guard |
| Cancelled → anything is impossible | transition guard (no edge out of `cancelled`) |
| A cancelled settlement has no ledger credit | CHECK (`ledger_entry_id`/`void_ledger_entry_id` NULL) + cancel-time ledger-reference check + ledger-insert trigger |
| Cancellation cannot alter or delete an existing credit | ledger immutability triggers (`0021`, untouched) + confirmed→cancelled is not an edge |
| Settlement can't be inserted already cancelled | insert guard (`0022`, unchanged: must be `recorded`) |
| Never deleted / truncated | existing settlement triggers |

## 6. Idempotency

Reuses `runCommercialCommand` unchanged. Verified against real PostgreSQL:

- same command + key + actor + payload → replay, `replayed: true`, one cancellation, one audit row;
- same key, **different actor** → `IDEMPOTENCY_CONFLICT`;
- same key, **different command** (`confirmSettlement`) → `IDEMPOTENCY_CONFLICT`;
- same key, **different payload** (reason, reference, settlement) → `IDEMPOTENCY_CONFLICT`;
- same key, **another Business** → `IDEMPOTENCY_CONFLICT`;
- **new** key on an already-cancelled settlement → refused (`INVALID_STATE_TRANSITION`), no duplicate;
- injected failure in the audit insert → cancellation **and** processing reservation roll back; the key is reusable and the retry succeeds.

## 7. Concurrency

The settlement row lock decides the terminal transition; the DB guards are an independent second line.

| Race | Result (repeated rounds, both launch orders, all stable across repeated runs) |
|---|---|
| cancel vs confirm | exactly one succeeds; the loser gets `INVALID_STATE_TRANSITION`; never both; a confirmed settlement has exactly one credit and no cancel audit; a cancelled one has zero ledger entries, a version-0 account and one cancel audit |
| confirm vs cancel (plus a second of each) | same |
| cancel vs cancel, different keys (×8) | one succeeds; no duplicate cancellation or audit |
| cancel vs cancel, same key (×8) | one execution; the rest replay or are told to retry (`TEMPORARY_UNAVAILABLE`) |
| **raw** cancel vs **raw** ledger credit on one recorded settlement | never both: a cancelled settlement never holds credit |
| cancel vs an unrelated confirm on the same Business | audit baseline is a real account state (before == after, never a torn mixture) |

## 8. Audit

One `settlement_cancelled` row per cancellation, immutable (DB rejects UPDATE/DELETE): WHO (`actor_type`/`actor_id`), WHAT (`action_type`, target), BUSINESS, WHEN (`occurred_at`), WHY (`reason_text`), REFERENCE, BEFORE (`{settlementStatus: recorded, paidBalanceUnits, accountVersion}`), AFTER (`{settlementStatus: cancelled, paidBalanceUnits, accountVersion, unitsPurchased, amountMinor, currency, settlementReference}` — account values equal the before values by construction), RESULT (`succeeded`), plus correlation id, idempotency key and price-schedule id. The baseline is read under the settlement row lock and the account lock. A *refused* attempt (`INVALID_STATE_TRANSITION`, `RESOURCE_NOT_FOUND`, `IDEMPOTENCY_CONFLICT`) writes a `denied` row in a separate transaction — the existing best-effort behaviour shared with `voidSettlement`. Authority failures write nothing (unchanged).

The audit vocabulary gained `settlement_cancelled` in code only; the `0021` table checks action-type *shape*, so no audit-table change was needed.

## 9. Tests

| File | Type | New tests |
|---|---|---|
| `commercialSettlementCancellation.postgres.test.ts` (new) | real PostgreSQL | 32 |
| `commercialBoundary.test.ts` | static | +6 |

Coverage of the brief's list: recorded cancellable; reason required; reference required; cancelled cannot confirm (service **and** raw SQL); confirmed cannot cancel; voided cannot cancel; duplicate cancellation safe; cancel/confirm concurrency; no ledger entry; account unchanged; audit correct; authority failures write nothing (inactive admin, no MFA, three Business roles, unknown and empty ids); raw transition without provenance rejected; **each** provenance column NULL rejected explicitly, plus blank values and NULL `cancelled_at`; smuggling cancel data onto a confirm, or confirm data onto a cancel, rejected; cancelled-at-insert rejected; evidence columns frozen; delete/truncate rejected; forged credit or reversal on a cancelled settlement rejected; raw cancel of a settlement that already has a credit rejected; existing confirmed credit untouched; all four statuses coexist; migration fail-closed rollback and clean rollback/re-apply.

Existing tests that legitimately changed because a migration `0024` now exists (no assertion weakened): migration-version lists and rollback step counts in `rewardProgramMigrations`/`platformFoundationReadiness`/`commercialFoundation` tests, the drop-helper lists in five Postgres suites, and one error-message regex in the void guard test (the guard's message now also lists `recorded -> cancelled`).

## 10. Boundary verification

- Loyalty path (`verifyPurchase`, `confirmRedemption`, Loyalty tables, Rewards, Cycles, Verified Units): **zero diff**. No file outside `domains/commercial`, the migrations directory, and migration-list assertions in two infrastructure tests changed; `cancelSettlement` is referenced by no non-Commercial code (asserted by test).
- `apps/`, prototype/Experience Reference, payment-provider code, `firestore.rules`, config, dependencies: **zero diff**.
- Product Truth unchanged: USD 2 unit price, trial 3–5 per explicit grant, pricing schedule, negative-credit allowance, capacity rules — none touched. No RBAC invented. No refund or provider workflow.

## 11. Deviations and risks

- **R1 — one trigger on the ledger table.** Necessary to make "a cancelled settlement never holds credit" a database fact against a raw insert; the brief asks for DB enforcement. It reads only; if reviewers prefer zero objects on the ledger, the alternative is service-only enforcement plus the cancel-time check (weaker against raw writes). Recommended: keep.
- **R2 — cancel-time ledger check spans all Businesses** (review finding, fixed): a ledger entry of any Business that references the settlement blocks its cancellation. There is no supporting index for `source_reference_id` on non-credit entry types, so the check may scan the ledger; cancellation is a rare administrator action, so this is accepted and an index is left to a later package if volume warrants.
- **R3 — `denied` audit rows** for refused attempts are inherited behaviour (best-effort, separate transaction) and are not counted as cancellations.
- **R4 — error wording.** The transition-guard message text changed; anything matching on it (none in production code) would need updating.
- No design gap found; nothing invented.

## 12. Rollback

`git revert` the commit. On a database with no cancelled settlements, `migrateDown` rolls `0024` back to the `0023` shape and guard. With cancelled rows it **refuses** (fails closed) — restore a pre-`0024` logical backup. Nothing was deployed anywhere.

## 13. Recommended next

`WP-COM-04` — consumption projection (separate package, not started here).
