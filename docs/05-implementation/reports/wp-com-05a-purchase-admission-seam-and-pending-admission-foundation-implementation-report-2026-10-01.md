# WP-COM-05a — Purchase Admission Seam & `pending_admission` Foundation — Implementation Report

> **Date:** 2026-10-01 · **Status:** Implemented — pending review (not merged) · **Classification:** Working (implementation record)
> **Authority:** `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + `CORR-002` (§8.8, §8.9, §8.13, §8.16, §22–§24) · **Entry `origin/main`:** `dccd9394412bd2902c6f8580ced7e54b40e1397a` (merge of WP-COM-04, PR #289)
> **Branch:** `claude/purchase-admission-seam-bi3yxn` · **Migration:** `0026_purchase_pending_admission`

**In one paragraph.** `verifyPurchase` previously contained, inline, the whole sequence that admits a verified Purchase into Loyalty. That sequence now lives in one internal operation, `admitPurchaseToLoyalty`, so a later package can re-admit a held Purchase without copying verification logic. The Purchase domain also gains one new governed state, `pending_admission` ("received and preserved, not invalid, not yet admitted"), with database-level integrity. The admission gate is OFF and can only be OFF: every eligible Purchase is admitted immediately exactly as before, nothing writes the new state, and no Commercial table is read, written or locked. **Behaviour is unchanged, and that is proven against the pre-change code, not asserted.**

---

## 1. Repository identity and entry gate

| Item | Result |
|---|---|
| Repository | `Fkenogo/11THONUS` (origin verified) |
| Entry `origin/main` (exact) | `dccd9394412bd2902c6f8580ced7e54b40e1397a` |
| Contains WP-COM-04 merge commit | Yes — `dccd939…` **is** `origin/main` |
| Migrations `0021`–`0025` canonical | Present on `main`: `0021` foundation, `0022` settlements, `0023` manual administration, `0024` settlement cancellation, `0025` consumption projection (each with `.down.sql`) |
| WP-COM-01/02/03/03A/04 reports canonical | All five reports present under `docs/05-implementation/reports/` |
| Branch / worktree | `claude/purchase-admission-seam-bi3yxn` (the session's clean isolated branch). A second detached worktree of `main` was used only to capture the "before" golden, then discarded. |
| Lifecycle vs design | **Matches** (see §3). No STOP condition. |

## 2. Strategy (stated before editing)

1. Migration `0026`: additive, Purchase table only.
2. Move the write sequence out of `verifyPurchase` **verbatim** (programmatically, not retyped) into `admitPurchaseToLoyalty`, parameterising only *who the actor is* and *which state the Purchase leaves*.
3. A gate seam that resolves only to `off` and fails closed on anything else.
4. Prove equivalence against `main` itself (golden rows **and** golden ordered SQL trace), then prove the new state, idempotency and lock order.

## 3. Current Purchase lifecycle (as found on `main`)

`recordPurchase` (Business) creates the row directly in `waiting_for_customer`. The **Customer** then calls `verifyPurchase`; in one PostgreSQL transaction it: reserves the client idempotency key → locks the Purchase → checks ownership and `waiting_for_customer` → transitions to `verified` (`verified_at` set) → appends the transition event → issues exactly one Verified Unit → ensures + locks the allocation stream → locks (or opens) the Cycle → binds the Cycle's governing version on first allocation → allocates up to 10 (overflow becomes `pending` positions) → at exactly 10 inserts the Reward and flips the Cycle → writes Trust Events, Notification Intents and outbox → completes the idempotency key.

`verified` therefore means "a Verified Unit exists". `reject`/`dispute` are conditional on `waiting_for_customer`. This is exactly the lifecycle the design (§8.8) assumes; it differs from it in no material way.

## 4. `pending_admission` semantics

*Received and preserved; not invalid; **not** admitted into Loyalty.* While in the state: `verified_at` is `NULL`, both reason fields are `NULL`, and there is no Verified Unit, no allocation position, no Cycle/stream, no Reward, no Trust Event, no Notification Intent and no outbox entry caused by the verification. It is re-admittable. It says nothing about validity and carries no commercial figures.

State machine (enforced by service **and** database):

```
waiting_for_customer ──▶ verified               (existing path, unchanged)
waiting_for_customer ──▶ pending_admission      (future hold; NO writer calls this in 05a)
pending_admission    ──▶ verified               (admission via admitPurchaseToLoyalty)
```
Nothing else enters or leaves `pending_admission` — no reject, dispute, cancel or expiry edge is created.

Enforcement layers: (1) status `CHECK` vocabulary; (2) `purchase_records_verified_fields` `CHECK` branch — `pending_admission` ⇒ no `verified_at`, no reason; (3) `BEFORE INSERT OR UPDATE OF status` guard trigger — refuses direct creation in the state, any exit other than `verified`, and any entry other than from `waiting_for_customer`; (4) the commands' conditional `UPDATE … WHERE status = <from>`.
**Provenance** needs no new column: the customer's confirmation actor/time is the (future) `waiting_for_customer → pending_admission` row in `purchase_record_events`, as designed (§8.9).

## 5. Extracted admission operation

`functions/src/domains/purchase/services/admitPurchaseToLoyalty.ts` — `admitPurchaseToLoyalty(tx, { locked, fromStatus, actor, correlationId, idempotencyKey })`.

- **Contract:** runs in the caller's transaction; the caller has already taken the earlier locks (client idempotency key, then the Purchase `FOR UPDATE`), authorised the actor and checked the status.
- **Body:** the previous `verifyPurchase` statements from the transition through the outbox, in the same order. Only three things became parameters: the actor (`customer` on live verify; `system` for a later re-admission), the source state (`waiting_for_customer` | `pending_admission`), and the `locked` row.
- **Does not:** reserve or complete any idempotency key; read any Commercial row; take any Commercial lock; decide capacity. The caller keeps ownership of the idempotency completion.
- `verifyPurchase` is now: validate → peek → reserve client key → lock Purchase → ownership/status checks → *gate decision (always admit)* → `admitPurchaseToLoyalty` → complete key. Its result shape, errors and idempotency behaviour are unchanged.
- Repository additions: `transitionPurchaseToVerified` takes an optional `fromStatus` (default `waiting_for_customer`, so the existing call is byte-equivalent) and `transitionPurchaseToPendingAdmission` (conditional on `waiting_for_customer`; **no command calls it**).

## 6. Gate-OFF equivalence proof

`purchaseAdmissionGate.ts`: the only mode is `off`; `resolvePurchaseAdmissionGateMode` defaults to it and **throws** for anything else (`shadow`/`enforce` do not exist until 05b); `decidePurchaseAdmission("off")` always returns `admit` from no inputs, so a Commercial dependency is structurally impossible. An unsupported mode is rejected before any write (tested).

The proof is a **golden captured from unmodified `main` (`dccd939…`)**, committed as `purchaseAdmissionSeam.golden.json`, over four scenarios — 1 unit; exactly 10 (Reward); 12 (10 allocated + 2 pending + Reward); 4 then 7 into one Cycle. For each, the test compares the rows produced (Purchase, events, Verified Unit, allocations + events, Cycle, Reward, Trust Events, intents, outbox, idempotency key) **and the ordered normalised SQL statement trace** (verb + table + lock clause) of `verifyPurchase`. Both match exactly, so the write order and the lock-taking statements are the same, not just the end state. (A first draft of the tracer double-counted statements and one fingerprint ordering was nondeterministic on same-timestamp rows; both were fixed and the golden was regenerated from `main`, then re-verified — see §20.)

Additional gate-OFF facts, each tested: no `pending_admission` row or event is produced by any normal flow; `verifyPurchase` completes while **every `commercial_*` table is `LOCK … ACCESS EXCLUSIVE`-locked by another session** (so it neither reads, writes nor locks any of them); the trace contains no `commercial` statement; a verify of a `pending_admission` Purchase is refused as a stale-state error (the gate-OFF path does not treat the new state as `waiting`).

**Verified Unit / Cycle allocation / Reward:** unchanged — covered by the golden (one unit per Purchase, allocation `allocated`/`pending` split, Reward exactly at 10, Cycle flip, first-allocation version binding).

## 7. Idempotency

Layers (the first two pre-exist and are *not* new reliance on service logic):

1. **DB:** `verified_units` partial unique index — one credit per Purchase; `rewards` unique per Cycle. Tested directly: a second credit for a Purchase and a second Reward for a Cycle both fail `23505`.
2. **Conditional transition:** `UPDATE … WHERE status = <from>`; zero rows ⇒ stale-state error, nothing committed.
3. **Purchase row lock:** serialises concurrent admitters.
4. **Client key** (`purchase.verify`): unchanged. Replay of the same key returns the stored result and creates no second unit (tested).

Results tested: same Purchase admitted once; 4 concurrent admitters of one held Purchase → exactly 1 succeeds, the others get `INVALID_STATE_TRANSITION`, 1 unit/1 allocation/1 Reward; a status-checked caller sees `not_pending` instead; an admission that **rolls back** (simulated crash after the full write phase) leaves the Purchase `pending_admission` with zero Loyalty rows and a retry succeeds.

**CORR-002 invariants preserved:** the seam reserves/completes no key; a hold (the simulated state transition) writes nothing to `idempotency_keys`; no `admit:<purchase_id>` key exists anywhere. That key is reserved only after a future locked ADMIT decision — **not implemented here** (05b).

## 8. Lock order

Re-derived from the code and from the statement trace of `main` (the golden):

`client idempotency key` → `purchase_records` (`FOR UPDATE`) → *(snapshot read of `reward_programs`)* → `loyalty_cycle_streams` (ensure, then `FOR UPDATE`) → `loyalty_cycles` (`FOR UPDATE`; open under the stream lock if none) → inserts (Verified Unit, allocation positions/events, Reward, Trust, intents, outbox) → completion of the key.

**Unchanged.** The extraction moved statements without reordering them (the golden trace proves it). The future canonical sequence `… → cycle → [reward, redemption only] → commercial account` is **not introduced**: no Commercial lock exists on this path. Note, for the record, that on `main` the Verified Unit insert precedes the stream lock; that pre-existing order is retained (the design's CORR-002 parent-before-child rule is satisfied: the unit's parent Purchase is already held).

## 9. Concurrency tests (no new deadlock cycle)

Real concurrent transactions on separate pool connections, each asserting no `40P01`, conservation and uniqueness:

- two concurrent Purchases, same customer/Business/program → both commit; 10 allocated + 2 pending; exactly one Reward;
- Cycle-completion race, three concurrent verifies (4+4+4) → one Reward, 10 allocated, 2 pending;
- same Purchase, different keys, concurrently → exactly one wins, losers are stale-state errors;
- same Purchase, same key, concurrently → one result;
- two customers of one Business → independent;
- held re-admission racing a live verify of the same stream → serialises on stream/cycle, both commit, units conserved;
- deterministic duplicate-admit race: the loser is observed **blocked on the Purchase lock** (via `pg_stat_activity`), then resolves after the winner commits.

The pre-existing `confirmRedemptionLockOrder` suite (verify × redemption, including the reproduction of the historical `40P01`) was re-run unchanged and passes (§22).

## 10. PB-013B P3-3 — remains OPEN, not fixed, not worsened

Reward Program publication (`publishRewardProgramVersionCommand.ts`) resolves Qualifying Item snapshots (`resolveQualifyingItemSnapshots`, ~line 133) **before** `withPlatformTransaction` (~line 140) and later publishes from those precomputed snapshots, so a concurrent draft edit can produce a mismatch. WP-COM-05a changes **zero** lines under `domains/rewardProgram` or `domains/qualifyingItem` (verified by diff), the admission path does not call publication, and nothing here depends on that behaviour. **Recorded as a separate open risk (R-6).**

## 11. Boundary verification

| Area | Result |
|---|---|
| `confirmRedemption` / redemption repositories | zero diff; a static test asserts redemption does not reference the seam or the new state |
| WP-COM-04 projector and all `domains/commercial` source | zero diff |
| `domains/commercial` tests | six **test** files touched, no source: `commercialBoundary.test.ts` (D1) and the five `commercial*.postgres.test.ts` reset helpers / migrate-down expectations, which now treat `0026` as the top migration (same mechanical update WP-COM-04 made for `0025`) |
| Commercial gate / capacity decision / earmarks / `commercial_admissions` / scheduler / read-model schema | none created; migration `0026` is asserted to alter only `purchase_records` and create no table |
| `apps/` (UI, i18n), prototype/Experience Reference | zero diff |
| `index.ts`, callables, firebase/firestore config, `package.json`, lockfile | zero diff |
| Rewards-program / qualifying-item code | zero diff |

## 12. Files modified / added

Added: `migrations/0026_purchase_pending_admission.sql` + `.down.sql`; `services/admitPurchaseToLoyalty.ts`; `services/purchaseAdmissionGate.ts`; `services/purchaseAdmissionSeam.postgres.test.ts`; `services/purchaseAdmissionSeam.golden.json`; this report.
Modified: `models/purchase.ts` (+1 union member); `repositories/purchaseRecordRepository.ts`; `services/verifyPurchaseCommand.ts` (~350 lines moved out); `commercialBoundary.test.ts`; `rewardProgramMigrations.postgres.test.ts`; `platformFoundationReadiness.postgres.test.ts`; migrations `README.md`; `IMPLEMENTATION_CHANGES.md`; `documentation-changes-log.md`.

## 13. Migration `0026`

Additive, local-only. (1) status `CHECK` gains `pending_admission`; (2) `purchase_records_verified_fields` gains the `pending_admission` branch; (3) guard function + trigger (new state only; other statuses' edges are deliberately not re-governed); (4) two partial indexes from design §8.16. Both constraints are swapped with `NOT VALID` then `VALIDATE`. No column, no table, no data. **`.down.sql` fails closed while any Purchase is `pending_admission`**, then restores the `0008` constraints and drops the trigger/function/indexes. Tested: up objects exist; additive (no row created); down refuses (and changes nothing); down→up round trip restores and re-applies cleanly. Not run against any shared/staging/production database.

## 14. Tests

`purchaseAdmissionSeam.postgres.test.ts` — 28 tests: gate-OFF equivalence (golden rows + trace; canonical lock order; unsupported-mode fail-closed; no `pending_admission` produced; all-Commercial-tables-locked probe; key replay), state machine (valid/not-invalid/credit-free held row; CHECK rejections; guard trigger rejections in every illegal direction incl. direct INSERT; service transitions; gate-OFF verify refuses a held row), seam/idempotency (re-admission equals live outcome except actor/from-state, with `system` provenance; no key/Commercial statement; rollback-retry; second admission refused; DB backstops; concurrent duplicate admit with and without a caller status check), locking (six concurrency cases), static boundary. Plus four 0026 migration tests, and the migration-list assertions extended to `0026` (including `migrateDown` counts).

## 15. Deviations

- **D1 — boundary tests updated (necessary).** WP-COM-01's `commercialBoundary.test.ts` asserted the token `pending_admission` appears nowhere in source or migrations. That was the right guard before this package and is now false by design. It is narrowed, not removed: the token is allowed only under `domains/purchase/` and in migration `0026`; it stays forbidden in Commercial and everywhere else; `commercial_admissions`/`admission_blocks`, earmark creation and `admitPurchase`-style names in Commercial sources stay forbidden. Besides the mechanical `0026` bookkeeping in the five Commercial PostgreSQL test files, this is the only change under `domains/commercial`.
- **D2 — no discriminated verify outcome / no web or i18n status handling.** The design's WP-COM-05a line also lists a "hold outcome" and "web/i18n status handling". This task's explicit scope (gate OFF, no hold semantics, do not modify prototype/UI, do not implement 05b command semantics) excludes both, so the `verifyPurchase` result stays `{ purchase, verifiedUnit, cycle, reward }`. **Deferred to 05b** (the callable and web adapters change together with the first real hold). Consequence: nothing in `apps/` knows the new status; since no flow produces it, no user can see it.
- **D3 — the status-filter allow-list in `purchaseQueries.ts` is untouched**, so a held Purchase cannot yet be filtered for explicitly. Deferred with D2 (read side belongs to the hold/visibility work).
- **D4 — `transitionPurchaseToPendingAdmission` exists but has no production caller.** It is the minimal state-machine edge needed to exercise and prove the foundation; the hold command that calls it is 05b.
- **D5 — DB guard trigger is not in the design's §8.16 list** (which names only the `CHECK`s and indexes). Added because the task asks for database-level state-machine enforcement; scoped to the new state only.

## 16. Risks

| # | Risk | Mitigation / status |
|---|---|---|
| R-1 | The extraction touches the hottest Loyalty write path | Golden rows + golden ordered statement trace from `main`; full PostgreSQL suite and the unchanged lock-order suite pass |
| R-2 | `ALTER … VALIDATE CONSTRAINT` scans `purchase_records` | `NOT VALID` then `VALIDATE` (only a `SHARE UPDATE EXCLUSIVE` lock for the scan); the table's `ACCESS EXCLUSIVE` moments are the two `DROP`/`ADD` pairs (metadata only). Rehearse on a production-sized copy before any deploy |
| R-3 | A future hold writes the state but the UI/transport does not yet know it | Deferred (D2); gate cannot leave `off` in this package |
| R-4 | Guard trigger adds a per-row check on `status` updates | One cheap function on `UPDATE OF status` only |
| R-5 | `verifyPurchase` on a `pending_admission` row returns a stale-state error rather than idempotent "current state" (design §8.10 wording) | Intentional for 05a; revisit with the hold outcome in 05b |
| R-6 | **PB-013B P3-3 remains OPEN** (§10) | Separate package; untouched |

## 17. Rollback

`git revert` the commit. On a database holding no `pending_admission` row (always true while the gate is OFF), `migrateDown` rolls `0026` back; it **fails closed** otherwise (admit the held purchases first, or restore a pre-`0026` backup). No deployment, config or data change was made.

## 18. Deferred to WP-COM-05b

Commercial admission port; the capacity decision (`evaluate`) and gate modes `shadow`/`enforce`; the hold command (`waiting_for_customer → pending_admission`) and the discriminated verify outcome; reservation ledger entries; `commercial_admissions` and earmark (`admission_blocks`) tables; the admission processor and `reevaluatePendingAdmissions`; the `admit:<purchase_id>` key (reserved only after a locked ADMIT); Commercial account lock in the admission sequence; web/i18n status handling; per-stream/Business hold-queue ordering; the 05b lock-order and concurrency tests (design §22.4).

## 19. Product Truth

Unchanged. No threshold, price, trial, capacity rule, reward rule or wording was added or altered. The new status carries the design's domain semantics only; no user-facing copy was written.

## 20. Validation record

All run locally against a disposable PostgreSQL 16 (port 54329, test database only) and the Firestore Emulator. **No shared, staging or production database was touched; nothing was deployed.**

| Check | Command | Result |
|---|---|---|
| Baseline on unmodified `main` | purchase + lock-order PostgreSQL suites | 46/46 pass (before any edit) |
| Typecheck | `pnpm typecheck` | pass (functions, apps/web) |
| Lint | `pnpm lint` | 0 errors; 1 pre-existing `apps/web` warning (`BusinessApiContext.tsx`) |
| Format | `pnpm format:check` | pass |
| Build | `pnpm build` | pass |
| Unit | `pnpm test` | functions **1935/1935**, apps/web **919/919** |
| **PostgreSQL suite, CI-equivalent** (fresh DB, cold vitest cache, run under the Firestore Emulator exactly as `ci.yml` does: `pnpm --filter functions test:postgres`) | | **17 files, 565/565 pass** (`main` had 16 files / 531) |
| Emulator suite | `pnpm emulators:validate` | 66 files, 867 pass, 3 skipped |
| New seam suite, repeated | `purchaseAdmissionSeam` ×3 | 28/28 each (stable) |
| Migration tests | `rewardProgramMigrations`, `platformFoundationReadiness`, `migrationRunner` | 70/70, incl. four new `0026` tests |
| Lock-order regression | `confirmRedemptionLockOrder` (unchanged) | pass, incl. the reproduced historical `40P01` |
| Proof can fail (mutation check) | temporarily moved the stream lock before the Verified Unit insert | both the golden test and the canonical-order test **failed**; change reverted and verified identical |
| Diff of protected areas vs entry `main` | `git diff dccd939 -- …` | empty for redemption, WP-COM-04 projector and all Commercial source, `rewardProgram`, `qualifyingItem`, `apps/`, `index.ts`, config, `package.json`, lockfile |

**Existing tests updated, and why (all test-only):** migration-list/`migrateDown` counts (`rewardProgramMigrations`, `platformFoundationReadiness`) and the five Commercial test files' reset helpers + two migrate-down expectations now account for `0026` as the new top migration (the same mechanical update WP-COM-04 made for `0025`); `commercialBoundary.test.ts` narrowed (D1). No assertion was weakened apart from D1.

**Pre-existing note (not caused by this package).** `platformFoundationReadiness.postgres.test.ts` "fresh database" test depends on no earlier file having left `schema_migrations` behind; with a warm vitest result cache that reorders files it fails identically after the unmodified `purchaseCommands` suite. CI has no cache and passes (above). Not fixed here (unrelated); recorded for the Technical Lead.

