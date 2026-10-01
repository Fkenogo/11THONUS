# WP-COM-05b — Commercial Admission Gate, Earmarks & Held-Purchase Processor — Implementation Report

> **Date:** 2026-10-01 · **Status:** Implemented — pending review (not merged) · **Classification:** Working (implementation record)
> **Authority:** `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + `CORR-002` (§4.4, §5, §7, §8.1–§8.17, §22–§24) · **Entry `origin/main`:** `94fa71e6516ab5376fa355eaf9f771db6fa01aa9` (merge of WP-COM-05a, PR #290)
> **Branch:** `claude/exciting-brahmagupta-kxkep4` · **Migration:** `0027_commercial_admissions_and_earmarks`

**In one paragraph.** A valid Purchase that would start a **new Loyalty Circle** now faces a real Commercial decision: **ADMIT** if usable capacity exists, otherwise **HOLD** as `pending_admission` — preserved, valid, credit-free, re-admittable. An ADMIT reserves capacity in the same transaction that creates the Verified Unit and records an immutable **earmark** that fixes the funding bucket (trial or paid) for that Circle position forever, which the WP-COM-04 consumption projection already knows how to honour. A callable, repeat-safe processor (`reevaluatePendingAdmissions`) admits held Purchases in FIFO order when capacity returns. A Purchase that merely continues an already-admitted Circle is never gated and takes no Commercial lock. The gate defaults to **`off`** (today's behaviour, byte-for-byte), so nothing changes in any environment until it is deliberately enabled.

---

## 1. Repository identity and entry gate

| Item | Result |
|---|---|
| Repository | `Fkenogo/11THONUS` (origin verified) |
| Entry `origin/main` (exact) | `94fa71e6516ab5376fa355eaf9f771db6fa01aa9` |
| Contains WP-COM-05a merge commit | Yes — `94fa71e…` **is** `origin/main` |
| Migrations `0021`–`0026` canonical | Present on `main`, each with `.down.sql` |
| WP-COM-01/02/03/03A/04/05a reports canonical | All six present under `docs/05-implementation/reports/` |
| Canonical design re-read | §4.4 (FK strategy), §5 (consumption), §7, §8.1–§8.17 (FD-A, FD-C, reservation, earmark, ordering, retry), §9, §12, §22 (lock order), §23 (idempotency), §24.1 (crash analysis) |
| Code inspected | `verifyPurchase`, `admitPurchaseToLoyalty`, purchase transitions, Commercial account/ledger/audit/provenance repositories, WP-COM-04 projector and earmark port, trial adjustment floor, restriction commands, web/i18n Purchase status handling |
| Material design/code divergence | **None** — no STOP condition. (Two points where the code made a design detail concrete are recorded as deviations D4/D5.) |

## 2. Strategy (stated before editing)

1. Migration `0027` — two Commercial tables + the FK that `0025` left open.
2. Extend `admitPurchaseToLoyalty` with two optional extension points (a hook that runs right after the Verified Unit insert; pre-locked stream/Cycle). With the gate `off` the statement trace is byte-identical (the 05a golden still passes unchanged).
3. One shared orchestration, `admitOrHoldPurchase`, used by **both** live verification and the processor.
4. Purchase **defines** the port; Commercial **implements** it; one composition-root file binds them.
5. Prove it with real concurrent transactions, statement traces and mutation checks.

## 3. Admission decision model

`decideCommercialAdmission` (pure, `models/commercialAdmission.ts`) answers: *does this valid Purchase need a new Circle position, and if so is there usable capacity?*

- **Block arithmetic (Purchase-owned, design §8.3):** with `U` = the stream's net admitted Verified Units (read under the stream lock) and `q` the Purchase quantity, it begins `newBlocks = ceil((U+q)/10) − ceil(U/10)` positions, the first being `ceil(U/10)+1` (**block index = Circle `sequence_number`**). `newBlocks = 0` means "inside an already-admitted position".
- **Decision order:** stream has an earlier hold → HOLD `stream_queue`; `newBlocks = 0` → **ADMIT** (nothing reserved); no account → HOLD `not_established`; restricted → HOLD `restricted`; an earlier Purchase of the Business is held → HOLD `business_queue` (no overtaking); capacity below `newBlocks` → HOLD `insufficient_capacity`; else **ADMIT**.
- A Purchase is admitted or held **as a whole** (a Verified Unit is one row per Purchase and is never split).

## 4. Usable-capacity calculation (FD-A)

`usable capacity = (trial_remaining + paid_balance) − (trial_reserved + paid_reserved)` — i.e. accounting balance minus capacity already promised to admitted Circle positions. **Raw ledger balance is never used alone** (unit-tested: raw balance 5 with 4 reserved is 1 usable). Negative balances yield negative usable capacity and hold **new** starts only. No subscription tier exists anywhere.

## 5. HOLD path

`waiting_for_customer → pending_admission`, conditional update, plus a **neutral, payload-free** `purchase_record_events` row (reason `awaiting_admission`) and one Commercial audit row. Proven by assertion and by statement trace to write **nothing else**: no Verified Unit, no stream/Cycle, no allocation, no Reward, no Trust Event, no Notification Intent, no outbox, no ledger entry, no admission, no earmark, and **no `admit:<purchase_id>` idempotency key** (the only idempotency row touched is the customer's own request key, completed with the held outcome). A stream row the hold transaction itself created for locking is discarded, so no Loyalty structure survives. Re-verifying a held Purchase returns its current state (no second hold event, no forced admission).

## 6. ADMIT path

After the locked ADMIT decision, in this exact order: reserve `admit:<purchase_id>` → Purchase → `verified` + event → **INSERT Verified Unit** → `capacity_reserved` ledger entry (counters move under the account lock) → `commercial_admissions` row → one `commercial_admission_blocks` row per begun position → remaining Loyalty writes unchanged (open Cycle if none, allocation, Reward at exactly 10, Trust Events, intents, outbox) → complete `admit:<purchase_id>`.

## 7. Verified Unit ordering (parent before child)

The repository's foreign keys are immediate and `0027` adds none that are deferrable (asserted from `pg_constraint`). Commercial children are written **only** inside the hook that runs right after the Verified Unit insert (static test fixes the order unit → hook → allocation). Tests: recording an admission before its unit exists fails with `23503` at the statement; a failure after the unit **and** its Commercial children, or after the whole admission returns, rolls everything back (Purchase still `waiting_for_customer`, zero Loyalty/Commercial rows, no idempotency key left behind) and a retry succeeds. A mutation that moved the hook before the unit insert failed the admit tests.

## 8. Reservation model

One `capacity_reserved` ledger entry per admission (`units_delta = 0`, `trial_reserved_delta`/`paid_reserved_delta` = number of trial/paid earmarks, soft source reference to the Verified Unit, scope key `reserve:<verified_unit_id>`), posted through the existing `postCommercialLedgerEntry` primitive. Concurrent new starts serialise on the account lock and cannot oversubscribe. Nothing is consumed at admission; consumption still happens only at Reward-available (WP-COM-04). A deferred constraint trigger refuses to commit a reservation without matching earmarks (or earmarks without the reservation).

## 9. Earmark model (`INV-CAP-PROV`)

`commercial_admission_blocks`: one immutable row per Circle position — `admission_id`, `business_id`, opaque `stream_ref` (SHA-256 of business ‖ customer ‖ program; Commercial stores no raw customer identity), `block_index`, `funding_bucket`, `earmarked_at`; `UNIQUE (business_id, stream_ref, block_index)`. `commercial_admissions` records Business, Purchase, Verified Unit, ledger entry, `blocks_reserved`, `first_block_index`, `decided_by`, the account version / availability read under the lock, the `admit:` scope key and audit linkage. Both tables reject UPDATE/DELETE/TRUNCATE. The funding bucket is chosen once, under the account lock, and **never reclassified** (tested after trial adjustments, top-ups and paid reductions).

## 10. Trial / paid selection

For each begun position in index order: `trial` while uncommitted trial (`trial_remaining − trial_reserved`, less what this admission already earmarked) is positive, else `paid`. This is the trial-first order the design and prototype already use; it introduces no new commercial rule. The availability check guarantees the paid remainder is covered. Tested: trial first; trial exhausted → paid; a 25-unit Purchase with 1 trial + 2 paid earmarks `trial, paid, paid` deterministically.

## 11. Idempotency timing (CORR-002)

| Event | Result |
|---|---|
| HOLD (live or processor) | No `admit:<purchase_id>` key is ever reserved (asserted by rows and by statement trace) |
| ADMIT | Reserved only **after** the locked decision, completed in the same transaction |
| Rollback of an ADMIT | The reservation row rolls back with it (tested; retry then succeeds) |
| Same Purchase raced | The Purchase lock serialises; the loser sees current state; one Verified Unit, one admission, one earmark, one reservation |

## 12. Lock order (implemented and proven)

`[client idempotency key] → purchase (FOR UPDATE) → stream (ensure + FOR UPDATE) → current Cycle (FOR UPDATE, not opened) → [Commercial account FOR UPDATE — only if the Purchase begins new position(s) and its stream has no earlier hold] → decision → HOLD returns / ADMIT: admit key → Verified Unit → reservation → admission → earmarks → allocation …`

Proofs: (a) the statement trace of a real ADMIT is asserted in this order; (b) no Commercial statement precedes the Cycle lock; (c) no Reward lock and no price-schedule lock appear; (d) after the account lock no new `FOR UPDATE` is taken on any existing Loyalty row; (e) a continuing Purchase's trace contains **no** Commercial statement at all; (f) a processor HOLD's only writes are the empty stream's ensure/discard pair. Wait-graph argument: admin commands and the consumption projection hold the account lock but wait on nothing Loyalty (sinks); a verify/processor holder of the account lock can only wait on `reward_programs`-class key-shares held by record-purchase/publication, which never wait for the account. Redemption takes no account lock. Concurrency tests (§19) assert no `40P01`.

## 13. Re-evaluation processor

`reevaluatePendingAdmissions(pool, { businessId?, port, correlationId })` — callable service, **not scheduled** (no scheduler exists; that belongs to a later package). **Policy (CORR-001, Founder decision): FIFO scan order + skip-and-continue.** Per Business it examines held Purchases oldest-first by `(purchase_date, id)`, one transaction per Purchase; a Purchase that does not fit stays `pending_admission` exactly as it was (no key, no row) and the scan **continues** with the next-oldest; one that fits is admitted through the same `admitOrHoldPurchase` ADMIT path with the `system` actor. The stream rule still applies (a Purchase is not admitted past an older held Purchase of its own stream, so units enter a stream in order); the Business-wide no-overtaking rule is **not** applied by the processor (it is what would re-create head-of-line blocking). Live verification is unchanged (see CORR-001 §24B). Tested: cases A–E (capacity/cost examples below), deterministic scan order, stream rule, repeat-safety, five concurrent workers on one Purchase, two full passes at once, two workers on two Purchases competing for one unit, and passes racing credit, settlement-style credit and restriction/restore; each asserts no `40P01`, no oversubscription, no duplicate Verified Unit/earmark/admission/key.

## 14. Verify outcome

`verifyPurchase` returns a discriminated outcome: `{ outcome: "admitted", purchase, verifiedUnit, cycle, reward }` or `{ outcome: "pending_admission", purchase }`. A held Purchase is **not an error**. A response stored before this package has no `outcome` and means admitted. With the gate `off` (the default) the TypeScript overload returns the admitted shape only, so existing callers are unchanged.

## 15. Web / i18n status handling

Only what the new reachable status requires: the status type and the business status filter gain `pending_admission`; the server list allow-list (`purchaseQueries.ts`) accepts it; the customer page distinguishes a held verify result (`isVerifyPurchaseHeld`) from success and from error.

| Surface | English (primary) | French (optional, parity-enforced) |
|---|---|---|
| Status label (business and customer) | "Received · awaiting admission" | « Reçu · en attente d'admission » |
| Customer notice after verify | "Received. This purchase is saved and will be counted as soon as it can be admitted." | « Reçu. Cet achat est conservé et sera comptabilisé dès qu'il pourra être admis. » |

The copy never says rejected, invalid or failed and exposes no commercial reason or figure. **Read-model leak found and closed:** the existing Purchase detail reads return raw events (`reason`, `eventPayload`) to Customers and to any Business reader, so the hold event is deliberately neutral and payload-free; the decision (reason, availability) lives only in the Commercial audit row. A test asserts the serialised customer and business detail contain no commercial vocabulary. Wording remains provisional pending Experience Assembly. Broader Experience Assembly was not started.

## 16. WP-COM-04 integration

The projector, reconciliation, models and repositories have **zero diff**. A composition-root resolver (`admissionEarmarkResolver`) maps a Reward to its earmark with one plain, non-locking read of the Reward's Cycle (stream + `sequence_number` ⇒ `block_index`). Proven end-to-end through the unchanged projector: consumption debits **exactly** the earmarked bucket and releases that reservation; unaffected by trial adjustments/top-ups between admission and Reward-available; a paid earmark stays paid when trial is granted later; per-Circle buckets for a multi-position Purchase; a Circle admitted while the gate was `off` still takes the **flagged fallback** (so the fallback remains exceptional); the database refuses a consumption whose bucket differs from its earmark; no consumption occurs at admission.

## 17. Active-Circle grace

A continuing Purchase is admitted at zero **and** negative capacity (paid balance −3, usable below zero), takes **no** Commercial lock or row (trace has no `commercial` statement; account version and ledger count unchanged), completes the Circle, creates the Reward, and that Reward is later consumed through its earmark without being gated. Two Purchases completing a Circle concurrently at negative capacity produce exactly one Reward. A **new** start in the same Business is held. Redemption sources import neither the gate, the port, Commercial nor the held state (static test); `confirmRedemption` has zero diff.

## 18. Commercial restriction

A restricted account holds **new** Circle starts only (tested); it never invalidates a held Purchase, alters Verified Units, cancels a Circle, cancels a Reward or blocks redemption. Restoring standing only permits admission; the processor admits (tested).

## 19. Concurrency tests (real concurrent transactions)

| Case | Result |
|---|---|
| A. one capacity unit, two new starts (×3 rounds) | exactly 1 ADMIT + 1 HOLD; reserved 1; no oversubscription |
| A′. 5 new starts, 3 units | exactly 3 admitted, 2 held |
| B/B′. same customer/Circle, 1 unit left / 2 units | positions never oversubscribed / consecutive blocks 1, 2 |
| C. same Purchase ×3 (different keys) / ×2 on a HOLD / same key | admitted once / one hold event, no admission / one result |
| D. held re-evaluation × manual trial adjustment (×4) | consistent either order, then admitted |
| E. held re-evaluation × settlement-style credit grant (×3) | consistent, paid earmarks |
| F. restrict / restore × verify / processor | nothing admitted while restricted; consistent |
| G. trial adjustment at the reserved floor × admission | floor holds; either order consistent |
| H. two Purchases completing a Circle at negative capacity | one Reward, no Commercial change |
| I. new start at zero capacity beside a completing Circle | start held, completion admitted, no deadlock |

Every case asserts **no `40P01`** and runs the accounting invariants (counters = Σ ledger; reserved = earmarks − consumed per bucket; trial ≥ reserved ≥ 0; availability = balance − reserved).

## 20. PB-013B P3-3

Remains **OPEN**, not fixed, not worsened. `domains/rewardProgram` and `domains/qualifyingItem` have zero diff; the admission path does not call publication; a static test asserts the new files import nothing from Reward Program publication.

## 21. Files

**Added:** migration `0027_commercial_admissions_and_earmarks` (+ `.down.sql`); Commercial `models/commercialAdmission.ts`, `repositories/commercialAdmissionRepository.ts`, `services/commercialAdmission.ts`; Purchase `services/purchaseAdmissionPort.ts`, `services/admitOrHoldPurchase.ts`, `services/reevaluatePendingAdmissions.ts`; `composition/commercialAdmissionBinding.ts`; `commercialAdmission.postgres.test.ts` (59 tests); this report.
**Modified (code):** `admitPurchaseToLoyalty.ts` (two optional parameters), `purchaseAdmissionGate.ts` (`enforce`), `verifyPurchaseCommand.ts`, `purchaseRecordRepository.ts` / `loyaltyCycleRepository.ts` (additive reads and the tracked stream lock), `purchaseQueries.ts` (allow-list), `commercialFoundation.ts` (two audit actions), `index.ts` (gate env var + port wiring), web status handling and i18n.
**Modified (tests/docs):** boundary and migration-bookkeeping tests (D1), the five Commercial PostgreSQL suites' reset helpers, a fixture helper in the WP-COM-04 consumption suite (D8), `IMPLEMENTATION_CHANGES.md`, `documentation-changes-log.md`, migrations `README.md`.
**Zero diff:** `confirmRedemption` and redemption repositories; the WP-COM-04 projector, reconciliation, models and repositories; `domains/rewardProgram`; `domains/qualifyingItem`; `package.json`; lockfile; Firebase/Firestore config; prototype / Experience Reference.

## 22. Migration `0027`

Additive and local-only. Creates `commercial_admissions` and `commercial_admission_blocks` (immutable by trigger, incl. TRUNCATE), the deferred reservation↔earmark consistency trigger, the `commercial_consumption_events.earmark_id → commercial_admission_blocks` foreign key (`NOT VALID` then `VALIDATE`; table is empty of earmarked rows) and a guard that a consumption debits the earmark's bucket and Business. **No** payment-provider schema, scheduler tables, read models, views, data seed, or change to any Loyalty table. `.down.sql` fails closed while any admission or earmark exists. Tested: up objects, immediate FKs, consistency trigger, uniqueness, down refusal, empty round trip. Not run against any shared database.

## 23. Deviations

- **D1 — boundary tests narrowed (necessary).** The WP-COM-01/05a guards that said "no admission/earmark/gate/Commercial import exists anywhere" were correct before this package and are now false by design. Narrowed, not removed: Commercial may be imported only by the one composition-root file; admission/earmark tables only by the admission repository, migration `0027` and tests; the Purchase domain still never imports Commercial (new test); `confirmRedemption` still carries no held-state token.
- **D2 — `shadow` mode not implemented.** The brief defines ADMIT/HOLD only; `shadow` (evaluate-and-record-would-hold) stays out. Modes are `off` (default) and `enforce`; anything else fails closed.
- **D3 — admission rows exist only for Purchases that begin new positions.** A continuing Purchase takes no Commercial lock by design (§8.3), so it writes no admission row; reconciliation is unaffected.
- **D4 — neutral hold event.** The design (§8.9) put `commercial_admission_held` and a decision snapshot on the Purchase event; because existing reads expose events to Customers and staff (§15), the event is neutral/payload-free and the snapshot lives in the Commercial audit row (FD-D).
- **D5 — soft ledger reference.** The design listed an FK from the reservation ledger entry to the Verified Unit (R6); the immutable ledger from `0021` already carries a soft source reference, so no ledger column was added. The parent-before-child proof is the immediate FK on the admission row.
- **D6 — `admit:<purchase_id>` is reserved on the live ADMIT path too** (design lists it for the processor only); harmless extra cross-path idempotency, always after the locked decision.
- **D7 — one composition-root file** is the only non-Commercial importer of Commercial.
- **D8 — fixture earmarks in WP-COM-04 tests.** Those tests used random earmark UUIDs; `0027` makes `earmark_id` a real FK, so their fixture inserts an earmark on its own connection with `session_replication_role = replica`. Assertions unchanged; the real chain is proven in the new suite.
- **D9 — a hold-transaction stream row is discarded** (`DELETE … WHERE next_cycle_sequence = 1`) so a hold leaves no Loyalty structure; the processor's HOLD therefore issues an ensure/discard pair with no net row.
- **D10 — no automatic triggering.** Design §8.12(a) (re-evaluate after settlement/credit/trial/restore commits) and (b) (scheduled sweep) are **not** wired: the processor is a callable service only.

## 24. Risks

| # | Risk | Mitigation / status |
|---|---|---|
| R-1 | Enabling `enforce` holds every new start of a Business with **no Commercial account** (`not_established`) | Default `off`; go-live runbook must open accounts / grant trial first (design §31) |
| R-2 | `off`→`enforce` switch while transactions run: legacy mode inserts the Verified Unit before the stream lock | Switch with traffic drained; the two modes are never mixed in one deployment |
| R-3 | Nothing re-evaluates held Purchases automatically | D10; recommended next package (scheduler + triggers) |
| R-4 | Circles admitted while the gate was `off` have no earmark | WP-COM-04 flagged fallback, by design |
| R-5 | `ALTER … VALIDATE` on `commercial_consumption_events` | Table holds no earmarked rows; rehearse on a production-sized copy before deploy |
| R-6 | **PB-013B P3-3 remains OPEN** | Untouched, separate package |
| R-7 | Customer wording is provisional | Experience Assembly governs final copy; no commercial detail is exposed |


## 24A. Deployment prerequisites and review-gate findings (added at the final exact-head review)

**DO NOT ENABLE `PURCHASE_ADMISSION_GATE_MODE=enforce` until all four hold:**

1. every Business that takes Purchases has a Commercial account (otherwise every new Circle start is held as `not_established`);
2. trial/paid capacity has been provisioned as appropriate;
3. a production-safe invocation path for held-Purchase re-evaluation exists (the processor is callable only; nothing schedules or triggers it — WP-COM-06a);
4. operational read/alerting is sufficient to detect a held backlog (WP-COM-06a/06b).

**Finding F-1 — head-of-line blocking: RESOLVED by CORR-001.** A Purchase's cost is `newBlocks = ceil((U+q)/10) − ceil(U/10)`, which varies (0, 1, or more). The original strict-FIFO processor stopped at the first Purchase that did not fit. The Founder did not accept that; the processor now scans oldest-first and **skips and continues** (§24B).

**Finding F-2 — availability is a shared pool.** Usable capacity is `(trial_remaining + paid_balance) − (trial_reserved + paid_reserved)` (design §7/§8.5/§12). A negative paid balance therefore reduces usable capacity even when uncommitted trial alone would cover the new position (exhaustive check over 4,200 account states: 845 holds are of exactly this kind). This is the approved FD-A model ("negative balance ⇒ held until credit restores capacity"). **Founder-confirmed retained policy (CORR-001): not a defect in WP-COM-05b and unchanged;** any change would require a separate Product Truth decision. A test (`RETAINED POLICY…`) pins it: trial 1 uncommitted + paid −1 ⇒ usable 0 ⇒ a new start is held; restoring paid to 0 ⇒ usable 1 ⇒ admitted with a trial earmark. Admitted Purchases are always bucket-safe: in all 1,359 admitted states trial earmarks never exceed uncommitted trial and paid earmarks never exceed uncommitted paid.

## 24B. CORR-001 — processor policy: FIFO scan + skip-and-continue

| | Before | After |
|---|---|---|
| Scan order | oldest first `(purchase_date, id)` | unchanged |
| Non-fitting Purchase | **stop the pass** for the Business | stays `pending_admission`, nothing written, **scan continues** |
| Business no-overtaking rule in the processor | applied | not applied (`applyBusinessQueue: false`) |
| Stream rule | applied | applied |
| Window | 100 oldest held per Business | 1000 oldest held per Business (examined in full every pass) |

Live `verify` is unchanged: a newcomer who arrives while older Purchases are held is still held (`business_queue`) and is picked up by the next processor pass, which admits it if it fits. This is the one place the old rule survives; it delays a fitting newcomer until the next pass but never admits one past an older held Purchase. Reconsidering it is a separate decision.

**Capacity/cost examples (proven by tests).** Cost = positions begun: on an empty stream a quantity of 1–10 costs 1, 11–20 costs 2, 21–30 costs 3.

| Case | Capacity | Held (oldest first) | Result |
|---|---|---|---|
| A | 1 | P1 cost 2, P2 cost 1 | P1 pending, **P2 admits** |
| B | 2 | P1 cost 2, P2 cost 1 | P1 admits, P2 pending |
| C | 2 | P1 cost 3, P2 1, P3 1 | P1 pending, **P2 and P3 admit** |
| D | 1 | P1 cost 2, P2 cost 2 | both pending, nothing written |
| E | 1 then +3 | P1 2, P2 1, P3 1 | run 1: P2 admits; run 2: **P1 (oldest) admits first**, then P3 |

**Residual starvation risk (recorded, not mitigated).** Because a large-cost Purchase can be skipped while smaller ones keep being admitted, it can stay held for a long time under sustained small admissions. Every run still evaluates it **first** (oldest-first), a test shows it is examined first on every pass, and it is admitted the moment capacity covers it and its stream rule allows. No priority aging, reservation guarantee or hidden queue was introduced; a later operational policy can add one only if observed backlog warrants it. The 1000-Purchase window is a second, smaller exposure: a held Purchase beyond the 1000 oldest is not examined until older ones leave the window.

**Concurrency.** Two full passes at once over `[3,1,1,1]` with capacity 2 admit exactly two small Purchases and skip the large one; two workers on two Purchases competing for one unit admit exactly one; passes racing a manual credit adjustment, a settlement-style credit and restriction/restore are consistent in either order. All assert no `40P01`, no oversubscription, no duplicate Verified Unit, earmark, admission or admission key, and run the accounting invariants.

**Mutation checks.** Restoring "stop on first non-fit" fails 8 tests (A, C, D, E, scan order, stream rule, starvation, two-pass); applying the Business no-overtaking rule in the processor fails 6.

**P1 `admit:` namespace.** Unchanged and re-verified by the regression test (a client cannot use `admit:`; refused before any write; the held Purchase later admits under the system key).

## 25. Rollback

Set `PURCHASE_ADMISSION_GATE_MODE` to `off` (or unset it): instant, no deploy of code. `git revert` the commit. `migrateDown` rolls `0027` back on a database with no admission/earmark rows (fails closed otherwise — recovery of a populated database needs a backup). Held Purchases remain valid `pending_admission` rows; the `0026` down-migration still refuses while any exist.

## 26. Validation record

All run locally against a disposable PostgreSQL 16 (port 54329, test database only) and the Firestore Emulator. **No shared, staging or production database was touched; nothing was deployed.**

| Check | Result |
|---|---|
| `pnpm typecheck` | pass (functions, apps/web) |
| `pnpm lint` | 0 errors; 1 pre-existing `apps/web` warning (`BusinessApiContext.tsx`) |
| `pnpm format:check` | pass |
| `pnpm build` | pass |
| `pnpm test` (unit) | functions **1943/1943**, apps/web **926/926** |
| **PostgreSQL suite, CI-equivalent** (fresh DB, cold cache, under the Firestore Emulator, `pnpm --filter functions test:postgres`) | **18 files, 624/624** (05a: 17 files / 565) |
| New admission suite, repeated | 59/59 on every run |
| 05a seam suite (golden rows + statement trace, gate `off`) | 28/28 — **gate-off equivalence with `main` preserved** |
| `pnpm emulators:validate` | 66 files, 867 passed, 3 skipped |
| Boundary tests | 40/40 (8 new for 05b) |
| **Mutation checks (proof can fail)** | (1) reserving `admit:` before the decision → hold/admit/key tests fail; (2) taking the account lock when `newBlocks = 0` → both active-Circle-grace tests fail; (3) writing Commercial children before the Verified Unit → all admit tests fail. Each reverted and verified identical |

**Existing tests updated, and why (test-only):** migration-list and `migrateDown`-count assertions for the new top migration `0027` (`rewardProgramMigrations`, `platformFoundationReadiness`, the five Commercial suites), the 05a seam suite's three assertions that `enforce` is unsupported / that the verify command names no port, the Commercial foundation suite's table and FK allow-lists, and D1/D8 above. No assertion was weakened apart from D1.

## 27. Deferred (next scope)

Scheduler and automatic triggers for the processor (after settlement confirmation, positive credit/trial adjustment, restoring standing); `shadow` mode; the Operator-facing manual re-evaluation command with audit (`admissions_reevaluated`) and queue/age read models; Business-facing standing/held-Purchase read models (FD-D); capacity-low / admission-age signals; any payment-provider integration; Experience Assembly of the final held-Purchase treatment. **Recommended next WP:** `WP-COM-06` — operational wiring of the processor (scheduler + commit triggers) and the Business/Operator read models.

## 28. Product Truth

Unchanged. No threshold, price, trial rule, capacity rule or reward rule was added or altered; the trial-first order is the one the design and prototype already adopt. The only user-facing wording added is the minimal, provisional status/notice copy in §15, flagged for Experience Assembly.
