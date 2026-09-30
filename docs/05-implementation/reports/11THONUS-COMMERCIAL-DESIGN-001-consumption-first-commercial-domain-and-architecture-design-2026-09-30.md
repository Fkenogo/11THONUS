> **Title:** 11THONUS-COMMERCIAL-DESIGN-001 — Consumption-First Commercial Domain & Architecture Design  
> **Version:** 1.1 (`CORR-001`, `CORR-001-CLOSE-001`) · **Status:** Ready for Founder merge review (not canonical until merged) · **Classification:** Working (governance/design record)  
> **Governing documents:** 11thONUS Platform Constitution; [Decision Register](../../00-governance/decisions/decision-register.md) (`DEC-SUB-014`); [`FD-COM-001` decision record](../../00-governance/decisions/evidence/FD-COM-001-core-commercial-model-founder-decision-2026-09-29.md); [`11THONUS-EXP-REF-001` binding assessment](11THONUS-EXP-REF-001-experience-reference-product-truth-binding-assessment-2026-09-29.md)  
> **Source-of-truth path:** `docs/05-implementation/reports/11THONUS-COMMERCIAL-DESIGN-001-consumption-first-commercial-domain-and-architecture-design-2026-09-30.md`  
> **Scope:** Architecture/design assessment only. No application code, test, configuration, migration, dependency, payment integration, Operator Console, prototype change or Experience Assembly was made or started. Nothing was deployed.  
> **Version history:** v1.0 (`fea8ca7`, 2026-09-30) — initial design. **v1.1 (`CORR-001`)** — records Founder decisions FD-A–FD-D and the trial/currency directions, corrects the foreign-key strategy, and adds projection reliability, full path coverage, the reservation model and the pending-admission lifecycle. The v1.0→v1.1 change register is **Appendix A**. **`CORR-001-CLOSE-001`** (final bounded correction before merge review) corrects the trial-adjustment wording, withdraws specific UI copy for `pending_admission`, and adds the capacity-provenance invariant `INV-CAP-PROV` (§8.5.1); its register is **Appendix B**.

# 11THONUS-COMMERCIAL-DESIGN-001 — Consumption-First Commercial Domain & Architecture Design

## 0. Plain-language summary (for the Founder)

- **Commercial is its own module** with its own tables. It reads facts the loyalty engine already records (for example "this Reward became available"). It never writes loyalty state, and loyalty never depends on Commercial to finish a transaction.
- **A commercial unit is used up when a Circle's 10-unit earning side completes and the Reward becomes available** (FD-B). Redemption never creates or drives billing.
- **Credit is an append-only record with a stored running total.** Every trial grant, payment, adjustment and used-up unit is a permanent line. Negative balances are allowed, with no floor and no maximum.
- **Usable capacity is net of capacity already promised to Circles in progress** (FD-A). A Business with 3 units of capacity can be admitted to at most 3 new Circles, even if many customers buy at the same instant. This is an internal accounting rule; customers never see it.
- **If a purchase would start a new Circle but capacity is unavailable, the purchase is kept, not rejected and not credited** (FD-C). It moves to a clearly named holding state, **`pending_admission`**, and is admitted automatically, in order, once capacity returns. No loyalty credit exists until admission.
- **Who sees what** (FD-D): the Owner sees full commercial detail for their Business; the Manager sees standing and what it means for running the Business, but not money or ledger detail; Staff and customers see no commercial data (the wording of a held purchase's status is decided during Experience Assembly, within those limits).
- **Redemption code is not changed.** Every unit that reaches a Circle has already passed admission, so redemption only ever moves already-admitted units.
- **You are the only administrator at launch**, and every commercial action is permanently recorded with who, what, which Business, when, why and the reference.
- **Nothing here is blocked on a Founder decision.** Launch BIF/RWF prices are an input needed at go-live, not a design blocker (§27).

---

## 0.1 CORR-001 record — Founder decisions and directions designed against

| ID | Founder decision / direction (as given) | Where designed |
|---|---|---|
| **FD-A** | Usable commercial capacity is **net of already-admitted commitments/reservations**; concurrent new-Circle starts must not oversubscribe capacity; an internal accounting invariant, not customer-facing | §7, §8.5–8.7 |
| **FD-B** | A unit is consumed when the 10-unit earning side completes and the **Reward becomes available**; redemption does **not** create the unit; the event binds to the authoritative Reward-available/threshold outcome; commercial restriction afterwards never invalidates the earned Reward | §5 |
| **FD-C** | A genuine purchase that would require a **new Circle** without capacity: preserve the Purchase Record; do not create/admit the Circle or its Verified Unit; represent it as **commercially pending admission**; allow controlled re-evaluation/admission when capacity returns; never discard, never treat as invalid, no loyalty credit before admission | §8.8–8.16 |
| **FD-D** | Owner: full Business commercial read; Manager: standing and operational consequences, no Platform commercial administration; Staff: no commercial financial/ledger detail; Participant: no commercial data; Platform Administrator: governed manual administration as already authorised | §17 |
| Trial | Initial grant **3–5**. **Not** hard-coded: one lifetime grant only; a lifetime maximum of 5. Later adjustment allowed if explicitly performed by the Platform Administrator, attributable and auditable. Complimentary arrangements remain `DEC-SUB-013` (open) | §9 |
| Currency | **Effective-dated, Administrator-configured local unit prices** for BIF and RWF; **immutable historical price snapshots**; **no live per-transaction FX**; actual initial BIF/RWF values are launch inputs, not decided here | §13, §14 |

## 1. Executive conclusion

1. **Feasible and compatible.** Commercial is a new PostgreSQL-authoritative domain (`functions/src/domains/commercial/`) using existing conventions (numbered migrations from `0021`, `withPlatformTransaction`, generic `idempotency_keys`, `*.postgres.test.ts`).
2. **One canonical commercial admission boundary.** A Verified Unit is issued in exactly one place today (`insertVerifiedUnitCredit`, called only from `verifyPurchase`). **Commercial admission is made a precondition of Verified Unit issuance.** Every later loyalty movement — allocation, pending positions, redemption-created empty Cycle, forward allocation — moves units that have already been admitted, so those paths need **no commercial gate and no change** (§8.1–8.3). All current write paths are enumerated and covered (§8.1).
3. **Reservation at admission (FD-A).** Admission reserves capacity for each new Circle position the purchase begins, in the same transaction that issues the Verified Unit, under a per-Business row lock (§8.5–8.7).
4. **Pending admission (FD-C).** The Purchase domain gains one explicit state, `pending_admission`; a held purchase is preserved, ordered, evidenced, and admitted by an idempotent processor when capacity returns (§8.8–8.16).
5. **Consumption at Reward available (FD-B)**, recorded by an idempotent Commercial-owned projection over the existing `rewards` fact. It is durable, retryable, exactly-once, observable and reconciled, and cannot leave a Reward permanently unbilled (§5.3–5.10).
6. **Ledger:** append-only ledger as authority plus a materialised account row (Option D) (§6–§7).
7. **Foreign keys are decided per relation, not banned.** The rule is "no FK where a commercial transaction could wait on a loyalty lock while holding a lock a loyalty transaction waits for"; each relation is analysed (§4.4).
8. **Trial:** initial grants of 3–5, no default; no lifetime cap; no one-grant limit; later adjustment only by the authorised Platform Administrator, attributable and auditable, with no governed aggregate ceiling and none encoded (§9).
9. **Currency:** effective-dated, administrator-configured BIF/RWF unit prices with immutable snapshots; no live FX (§13–§14).
10. **Standing** is a set of separate dimensions with a presentation-only summary label — no mega-enum (§11).
11. **Authority** for commercial commands follows the existing `FD-BUS-ACT-001` precedent: an active `platformAdministrators` record plus verified MFA, no role scoping, no new RBAC (§15, §25).
12. **Business lifecycle status cannot carry commercial restriction.** `purchase.record` requires lifecycle `trial`/`active`, while `redemption.confirm` permits `suspended` (`purchasePermissionCatalogue.ts:51`, `redemptionPermissionCatalogue.ts:69`); commercial standing is a separate axis (§11).
13. **Disposition:** design complete and corrected; implementation not started and not authorised.

## 2. Authority reviewed

| Authority | Use |
|---|---|
| `DEC-SUB-014` (CONFIRMED) and `FD-COM-001` record incl. §14 | Governing commercial Product Truth |
| **CORR-001 Founder decisions FD-A–FD-D, trial and currency directions** (§0.1) | Recorded and designed against; supersede the v1.0 open items |
| `DEC-SUB-013` (OPEN_FOUNDER) | Not resolved; trial ≠ complimentary arrangement |
| `DEC-GOV-007` (OPEN), `DEC-GOV-011` | No RBAC invented; SoD referenced, not redefined |
| `DEC-LOY-011`, PRD06 §5, `DEC-LOY-002`, `DEC-LOY-004`, `DEC-LOY-008`, `DEC-LOY-017`, `DEC-LOY-018` | Reward preservation, single current Cycle, no reversal, catalogue precedent, redemption authority |
| TRD17 banner; TRD18 §18.49–18.50 | Retained record-keeping/non-recalculation; audit shape and search |
| `11THONUS-EXP-REF-001` incl. §19 | Experience Reference inventory, classification |
| `FD-BUS-ACT-001` | Precedent for Platform-Administrator-authorised non-knowledge actions |
| Code and migrations `0001`–`0020` | Existing architecture trace (§3) |

### 2.1 Entry verification record

| Check | Result |
|---|---|
| Repository | `Fkenogo/11THONUS` |
| `origin/main` (CORR-001 entry) | **`439f95e99590f0ef44e3955c6b5649d8c2542e83`** (unchanged since v1.0; re-fetched) |
| Design head at CORR-001 entry | **`fea8ca780e79f6873f5cbab90dc8b0ebdff9852f`** (branch `claude/epic-archimedes-b7hvnd`, equal to its remote) |
| PR #283 / `DEC-SUB-014` | Merged; canonical |
| Adopted Experience Reference SHA | `18e8d700f505beefe46d324f6ea33f20a670abe7` — verified in v1.0 by exact-SHA fetch (read-only); prototype unmodified |
| Isolated workspace | This session's fresh clone; the contaminated primary checkout was not used |

## 3. Existing architecture trace

### 3.1 Two data stores

Firestore owns identity, Business, membership, permissions, platform administrators, platform audit. PostgreSQL owns Reward Program, Purchase/Verification, Loyalty Cycle, Reward, Redemption, Trust Events, Notification Intents, idempotency. `business_id`/`customer_identity_id` are opaque `TEXT` in PostgreSQL. **There is no cross-store transaction**, so commercial state that must be atomic with loyalty facts (capacity reservation, purchase admission) lives in PostgreSQL.

### 3.2 Purchase → Verified Unit → Cycle (as implemented)

| Step | Where | Fact |
|---|---|---|
| Purchase recording | `recordPurchaseCommand.ts` | Purchase `waiting_for_customer`; needs Business lifecycle `trial`/`active` |
| Customer verification | `verifyPurchaseCommand.ts:93–470` | **Customer-driven.** One transaction; order idempotency → purchase → stream → cycle → reward → appends |
| Verified Unit | `verifyPurchaseCommand.ts:179` (`insertVerifiedUnitCredit`) | One credit per Purchase (`verified_units_one_credit_per_purchase`); `entry_type` already allows `'reversal'` (no writer) |
| Stream lock | `loyaltyCycleRepository.ts:63` | Per (Business, Customer, Program); owns the Cycle sequence |
| Cycle start | `verifyPurchaseCommand.ts:197–209` | `lockCurrentCycle`; if none, `openCycleUnderStreamLock` |
| Allocation | `verifyPurchaseCommand.ts:239–297` | Up to capacity 10 into the single current Cycle; overflow becomes **pending** positions |
| Threshold | `verifyPurchaseCommand.ts:299–318` | At 10: `insertRewardForCycle` (`rewards_one_per_cycle`) then `markCycleRewardAvailable` |
| Redemption | `confirmRedemptionCommand.ts:142–611` | `reward_available → reward_redeemed` (`:321`); opens next Cycle **empty or with forward-allocated pending units** (`:357–371`); forward allocation can itself reach 10 and create the next Reward (`:408–425`) |
| Cycle states | `0010_loyalty_cycles.sql` | `active`, `reward_available`, `reward_redeemed`, `closed`; one current per customer+program |
| Immutable facts | migrations | `allocated_units` only increases; `rewards.state` permits `cancelled`/`expired` but nothing writes them |

### 3.3 Purchase state machine (relevant to FD-C)

`purchase_records.status` ∈ `waiting_for_customer`, `verified`, `rejected`, `under_review`, `corrected`, `cancelled`, `expired`, `archived` (`0008:36–37`). The state-integrity CHECK `purchase_records_verified_fields` (`0008:55–65`) ties `verified_at` and reason fields to status. Only three transition writers exist: `→verified`, `→rejected`, `→under_review`, each conditional on `status = 'waiting_for_customer'` (`purchaseRecordRepository.ts:198–240`). `purchase_record_events.to_status` is free `TEXT` with no CHECK (`0008:98–110`), so a new status needs a CHECK change on `purchase_records` only. `corrected`, `cancelled`, `expired`, `archived` have no writer.

### 3.4 Locking, and foreign-key key-share locks

Canonical order: `idempotency → purchase → stream → cycle → reward → appends`. CORR-002 removed a real `40P01` deadlock caused by **FK key-share locks** (`confirmRedemptionCommand.ts:37–46`, `loyaltyCycleRepository.ts:453–461`). PostgreSQL semantics used throughout this design: inserting a child row takes `FOR KEY SHARE` on the referenced parent row; `FOR KEY SHARE` conflicts with `FOR UPDATE` (but not with `FOR NO KEY UPDATE`). Loyalty rows that other transactions lock `FOR UPDATE`:

| Loyalty row | Locked `FOR UPDATE` by |
|---|---|
| `purchase_records` | verify, reject, dispute, admission (`lockPurchaseRecordById`) |
| `loyalty_cycle_streams` | verify, redemption (`ensureAndLockCycleStream`) |
| `loyalty_cycles` | verify (`lockCurrentCycle`), redemption (`lockCycleById`) |
| `rewards` | redemption (`lockRewardById`) |
| `reward_programs`, `reward_program_versions` | record purchase, publication |
| `verified_units`, `verified_unit_allocations` | not locked `FOR UPDATE` by any transaction type except allocation-position conversion in redemption (`FOR UPDATE OF a`) |

### 3.5 Commercial remnants (all inert)

`Business.subscriptionId?` (never written; excluded from the profile whitelist); error code `SUBSCRIPTION_LIMIT_REACHED` (declared, never thrown); Business lifecycle `trial`/`expired` with `trial → active`/`→ expired` never implemented (`businessLifecycleCommand.ts:16–18`); `Business.countryCode`/`currencyCode` describe the Business's own trading currency, are free-form and mutable.

### 3.6 Trust Events, intents, audit, authority

`trust_events` (`0013`) is a customer-facing, purchase-anchored evidence substrate with a closed type CHECK; `notification_intents` (`0014`/`0020`) has closed CHECKs and purchase/redemption anchors and no delivery worker; `platformAdministrationAuditRecords` (Firestore) is write-only with a closed vocabulary and fixed `targetType`. Platform administration is knowledge-only (two roles, seven `knowledge.*` permissions, boundary test). Precedent for non-knowledge platform authority: `activateBusinessAfterVerification` (`businessActivationCommand.ts:16–52, 132–143`). TRD18 §18.49 specifies an `AdministrativeAuditRecord` shape.

### 3.7 Reusable primitives

`idempotency_keys` + reserve/peek/complete; `withPlatformTransaction`; `platformAdministrators` + `deriveVerifiedMfaSatisfied`; TRD18 §18.49 shape; the intent-vs-delivery pattern; migration runner with `.down.sql`; the `*.postgres.test.ts` harness; the CORR-002 lock-order test style (`confirmRedemptionLockOrder.postgres.test.ts`).

### 3.8 What does not exist

Any commercial table, ledger, trial, price, settlement, standing, capacity check, Operator surface, audit *read* function, non-knowledge platform permission catalogue, **and any scheduled-function mechanism** (no `onSchedule`/scheduler use exists in `functions/src`; the sweeps in §5 and §8 therefore imply a new scheduling capability, recorded as a deployment dependency in §30).

## 4. Commercial domain boundary

### 4.1 What Commercial owns

Accounts, ledger, trial grants, settlements, manual adjustments, price schedules, consumption records, admission decisions, administrative restriction/activation state, standing derivation, commercial audit, signals.

### 4.2 Ownership and dependency direction

| Domain | Owns | Commercial's relationship |
|---|---|---|
| Purchase | Purchase Records and their lifecycle, **including the new `pending_admission` state** | Purchase *calls* one admission port; Commercial never writes Purchase rows |
| Verified Unit | Credits (and future reversals) | Issued only through the admission boundary |
| Loyalty Cycle | Cycle state, allocation, threshold | Read-only fact source |
| Reward | Reward entitlement | **Consumption source fact** (read-only) |
| Redemption | Redemption evidence | **No dependency**; `confirmRedemption` unchanged |
| Customer Identity | Identity | None; Commercial stores no customer identity |
| Organisation/Business | Lifecycle, country, currency | Reads `countryCode` once at account opening; never writes `Business.status` |
| Notifications | Intent/delivery | Commercial has its own intent table |
| Platform Administration | Administrator identity | Authority check only |

```
Purchase verify / admission processor ──(port)──▶ CommercialAdmission (reads/locks commercial account)
        │                                              │ writes only commercial_* tables
        ▼                                              ▼
  Verified Unit ▶ Cycle ▶ rewards (immutable fact) ──(read)──▶ Consumption projection ▶ ledger
```

### 4.3 Rules

1. Commercial never imports Purchase/Loyalty **write** repositories (structural test).
2. Purchase depends on a **port** (`CommercialAdmissionPort`) defined on the Purchase side and bound at the composition root.
3. Commercial's only effect on loyalty is **admission**: allowing or holding a purchase's entry into loyalty (§8). It cannot create, cancel, modify or re-interpret any Cycle, Verified Unit or Reward.
4. Loyalty tables never reference Commercial rows.

### 4.4 Foreign-key strategy (per relation; replaces the v1.0 blanket rule)

**Decision rule.** A Commercial→Loyalty foreign key is **permitted** when at least one holds, and **prohibited** otherwise:

- **(i)** the referenced parent row is never locked `FOR UPDATE` by any other transaction type;
- **(ii)** the child is inserted by a transaction that already holds the parent lock (same transaction);
- **(iii)** the FK-bearing insert executes **before** the transaction takes the commercial account lock, so the transaction never holds the account lock while waiting on a loyalty lock.

What must never happen: a transaction that holds the **commercial account lock** waiting for a loyalty row that a loyalty transaction holds while that loyalty transaction waits for the account lock (the CORR-002 pattern). Because loyalty transactions take the account lock **last** (§22), condition (iii) is sufficient to make any remaining FK safe.

Options compared per relation — **FK** (relational proof, key-share lock), **soft reference** (opaque id, no lock, integrity by derivation + reconciliation), **immutable provenance** (snapshot columns copied from the loyalty row inside the same read):

| # | Relation | Parent lock exposure | FK | Soft ref | Provenance | **Selected** | Why it is safe |
|---|---|---|---|---|---|---|---|
| R1 | `consumption_events (source_reward_id, source_loyalty_cycle_id)` → `rewards (id, loyalty_cycle_id)` | `rewards` locked `FOR UPDATE` by redemption; cycle by verify/redemption | Composite FK using the existing `0020` unique `(id, loyalty_cycle_id)`; proves the Reward belongs to the Cycle | Loses proof | n/a | **FK (composite)** | Rule (iii): the projection inserts the event **before** locking the account. The worst case is the projection waiting on a redemption that holds the Reward; redemption never waits on anything the projection holds (it holds only a key-share and its own new row), so no cycle forms |
| R2 | `consumption_events.source_loyalty_cycle_id` alone | as above | Redundant with R1 | Fine | — | **Covered by R1** | — |
| R3 | `consumption_events.reward_program_id` | `reward_programs` locked by record-purchase/publication | Would add coupling for no proof gain | **Soft** | Copied from the Reward row | **Soft + provenance** | Provable via R1's Reward row; no lock taken |
| R4 | `admissions.verified_unit_id` → `verified_units (id)` | Not locked `FOR UPDATE` | FK | — | — | **FK** | Rule (i); also (ii): inserted by the transaction that created the unit |
| R5 | `admissions.purchase_record_id` → `purchase_records (id)` | Locked `FOR UPDATE` by verify/reject/dispute/admission | FK | Soft | — | **FK** | Rule (ii): the admission is written by the transaction that already holds the Purchase lock; no other commercial transaction writes this table |
| R6 | `ledger_entries.source_verified_unit_id` → `verified_units (id)` (reservation entry) | Not locked | FK | Soft | — | **FK** | Rules (i)+(ii): written in the transaction that issued the unit |
| R7 | `commercial_audit_events.purchase_record_id` (admission events) | Purchase locked by the writing transaction | FK | **Soft** | Snapshot in `after_snapshot` | **Soft** | Audit rows must outlive any future retention change and must never add a lock to a hot path; reference is provable through R5 |
| R8 | Any Commercial row → `loyalty_cycles`, `loyalty_cycle_streams` directly | Locked `FOR UPDATE` by verify/redemption | **Prohibited** | **Soft** | — | **Soft only** | No commercial transaction may key-share these; when a Cycle id is needed it is read from the Reward row (R1) |
| R9 | Loyalty/Purchase rows → Commercial rows | n/a | **Prohibited** | — | — | **None** | Loyalty state must not depend on commercial rows (DEC-SUB-014 §2.1) |
| R10 | `business_id` on every commercial table | Firestore-owned | n/a | **Soft (opaque)** | — | **Soft** | Cross-store; same convention as loyalty tables |
| R11 | Commercial → Commercial (ledger→accounts, settlements→price schedules, etc.) | Commercial-only | FK | — | — | **FK** | All under the account lock or immutable parents |

Each FK-bearing table gets a lock-order test in the CORR-002 style (§22.3).

## 5. Consumption-event design (FD-B)

### 5.1 Decision and binding

**FD-B (Founder-decided):** a commercial unit is consumed when the governed 10-unit earning side of a Circle completes and the Reward becomes available. **Redemption does not create the commercial unit.** The event binds to the authoritative Reward-available outcome: the **`rewards` row**, inserted in the same transaction as the Cycle's `active → reward_available` flip.

- The `rewards` row exists exactly once per Cycle (`rewards_one_per_cycle`) and is written by **both** threshold sites (verify `:308`, redemption forward allocation `:415`). Anchoring on it covers both without touching either, and **`confirmRedemption` requires no change and contains no commercial logic.**
- **Rows that count:** any `rewards` row (state `available` or `redeemed`) with `available_at ≥ account.commercial_effective_from`. A Reward redeemed before the projection runs is still consumed: the unit was consumed when the Reward became available.
- **Restriction never touches an earned Reward:** consumption is never gated, deferred by standing, or reversible by restriction. The gate (§8) acts only earlier, at admission.

### 5.2 Recorded fact and idempotency

`commercial_consumption_events` — one immutable row per consumed unit. **Idempotency key:** `source_loyalty_cycle_id`, `UNIQUE`; plus ledger `idempotency_scope_key = 'consume:<cycle_id>'`.

### 5.3 Durable detection

Detection is a **stateless pull query over the durable fact**, not a message that can be lost: the `rewards` row is committed atomically with the threshold flip and cannot be un-created (`ON DELETE RESTRICT`, no deletion path). Commercial detects unconsumed Rewards by anti-join:

```
rewards r JOIN commercial_accounts a ON a.business_id = r.business_id
      AND r.available_at >= a.commercial_effective_from
LEFT JOIN commercial_consumption_events e ON e.source_loyalty_cycle_id = r.loyalty_cycle_id
WHERE e.id IS NULL AND r.state IN ('available','redeemed')
```

There is no watermark, cursor or "last processed" value that could skip a row. A missed Reward is simply still present in the next pass. An additive index `rewards (business_id, available_at)` supports it (performance only).

### 5.4 Projection transaction (per Reward)

1. `INSERT` the consumption event (composite FK R1) `ON CONFLICT (source_loyalty_cycle_id) DO NOTHING` — **before** any commercial lock (rule iii). If the row already exists, stop (already projected).
2. Lock the Business's account row.
3. Post the ledger debit (`consumption`, one unit, **in the bucket earmarked at admission for this Circle**, §8.5.1 — never re-decided from current balances) and release the matching earmarked reservation, update the account, write the audit row (`actor = system:commercial-projection`), and snapshot price schedule id, USD equivalent and local unit price.
4. Commit. Steps 1–3 are **one** transaction, so an event can never exist without its debit.

Trigger: (a) best-effort immediately after the verify/redemption callable returns; (b) a scheduled sweep. The projection never runs inside a loyalty transaction, so a commercial fault can never roll back a Reward.

### 5.5 Retry and exactly-once

Retry is the sweep itself (idempotent, repeated indefinitely until every Reward is projected), plus in-process bounded retry with backoff for transient errors. Exactly-once is enforced at three layers: `UNIQUE (source_loyalty_cycle_id)`, `UNIQUE (idempotency_scope_key)` on the ledger, and the anti-join. Concurrent projectors race on the first unique constraint; the loser does nothing. A rollback in step 3 also rolls back the step-1 insert, leaving the Reward eligible for the next pass.

### 5.6 Reconciliation and backfill

A read-only reconciliation job (scheduled, and on demand from the Operator) reports, without auto-repair: Rewards past the grace interval with no consumption event; events with no `rewards` row (impossible under R1, checked anyway); events with no ledger debit; `account counters ≠ Σ ledger`; `trial_reserved`/`paid_reserved` ≠ Σ earmarks − Σ consumed earmarks per bucket; a consumption whose bucket differs from its earmark; an earmarked Circle consumed via the fallback; any earmark consumed twice. **Backfill is the same projection with no time window** — running it again is always safe. The deliberate exclusion is Rewards made available before `commercial_effective_from`, which is recorded on the account and never billed retroactively.

### 5.7 Lag observability and failure alerts

Derived metrics (queries, not new state): `unprojected_reward_count`, `oldest_unprojected_age`, `consumption_projection_failures` (from the append-only `commercial_projection_failures` table: cycle id, error class, attempt, time). Alerts: *lag warning*, *lag critical*, *repeated failure for one Reward*. The numeric thresholds are **engineering operating parameters** (configurable, proposed defaults of 5 and 30 minutes for the two lag levels and 5 consecutive failures) — they are not Product Truth and are adjustable without a decision. No alerting infrastructure exists in the repository today (§3.8); wiring it is a WP-COM-10 dependency.

### 5.8 Protection against overstated capacity

Available capacity is `accounting balance − reserved units`, and reservations are made **at admission**, before any Circle can complete. When a Circle completes but the projection lags, its reservation is still held, so **available capacity is unchanged whether or not the debit has posted**. Lag therefore cannot overstate capacity; if the projection stalls, capacity is understated (safe direction: new admissions hold) and alerts fire. Read models additionally surface `pending_consumption_units` (= unprojected Rewards) so displayed balances are labelled accurately.

### 5.9 Why a Reward cannot be permanently unbilled

(1) The fact is durable and undeletable. (2) Detection is a stateless pull with no watermark. (3) Projection is idempotent, so retry is always safe and never double-bills. (4) The reservation keeps capacity conservative until consumption posts. (5) Reconciliation and lag/failure alerts surface any stall. (6) The only exclusion is the explicit, recorded `commercial_effective_from` boundary. The residual risk — the sweep not running and nobody watching — is controlled by alerting and is stated in §29.

### 5.10 Answers to the standing questions

| Question | Answer |
|---|---|
| Authoritative transition | `active → reward_available`, evidenced by the `rewards` row (FD-B) |
| Loyalty transaction rollback | No `rewards` row exists → nothing to project |
| Can consumption be reversed? | Not today (no loyalty reversal; `DEC-LOY-004`). Structurally supported by a **compensating** `consumption_reversal` entry, never by update/delete |
| Future loyalty correction | `verified_units.entry_type='reversal'` and `rewards.state='cancelled'` exist unused. If a future governed correction cancels a Reward whose unit was consumed, Commercial adds one compensating entry (unique per consumption event). Whether that refunds capacity is a future policy; the ledger allows either without schema change |
| Loyalty lifecycle altered? | No |

## 6. Ledger / account options

Scoring: ●●● strong · ●● adequate · ● weak.

| Criterion | A. Mutable balance | B. Append-only, derived | C. Credit lots | **D. Ledger + materialised account** | E. Event-sourced streams |
|---|---|---|---|---|---|
| Auditability | ● | ●●● | ●●● | ●●● | ●●● |
| Concurrency | ●● | ●● | ●● | ●●● | ● |
| Idempotency | ● | ●●● | ●●● | ●●● | ●●● |
| Historical reconstruction | ● | ●●● | ●●● | ●●● | ●●● |
| Manual administration | ●● | ●●● | ●● | ●●● | ●● |
| Trial grants | ●● | ●●● | ●●● | ●●● | ●●● |
| Paid credit | ●● | ●●● | ●●● | ●●● | ●●● |
| Negative credit | ●●● | ●●● | ● | ●●● | ●●● |
| Pricing history | ● | ●● | ●●● | ●●● | ●●● |
| Future payment integration | ●● | ●●● | ●●● | ●●● | ●●● |
| Local-currency settlement | ●● | ●●● | ●●● | ●●● | ●●● |
| Operational simplicity | ●●● | ●●● | ● | ●● | ● |
| Fit with existing PostgreSQL | ●●● | ●●● | ●● | ●●● | ● |

A cannot reconstruct history. B makes the gate sum the ledger under a lock on every check. C adds FIFO lot allocation and negative-lot handling no governed rule needs (the traceability benefit is available in D via `source_settlement_id`). E is a new paradigm with no repository precedent. The prototype's displayed balance is not domain evidence.

## 7. Recommended ledger architecture (Option D)

- **`commercial_ledger_entries`** — append-only, **authoritative**.
- **`commercial_accounts`** — one mutable row per Business: materialised counters and two admin-set facts, updated only in the same transaction as a ledger append and only under its own row lock.
- **Separate dimensions (FD-A, brief item 8):**
  - **Accounting balance** = `trial_remaining_units + paid_balance_units` — may be negative; no floor, no maximum.
  - **Reserved units** — capacity already admitted to Circle positions that have not yet been consumed; never negative.
  - **Available capacity** = accounting balance − reserved units. **This is the FD-A "usable capacity".**
- **Buckets:** `trial` and `paid`. The bucket that funds a Circle is **earmarked once, at admission** (uncommitted trial first, then paid — the adopted prototype's trial-first order, `AppContext.tsx:383`) and **honoured at consumption**; it is never re-decided from balances at posting time (§8.5.1). `trial_remaining` cannot go below zero; **negative credit lives only on `paid`.** The *availability* model is unchanged: one shared pool, `available = (trial_remaining + paid_balance) − (trial_reserved + paid_reserved)`.
- **Invariants:** I-1 counters = Σ ledger deltas; I-2 one consumption event ⇔ one debit entry; I-3 ledger, audit, consumption and admission rows are never updated or deleted (`BEFORE UPDATE OR DELETE` triggers that raise — stronger than the repository's "absence of an updater" precedent, justified because these rows are money-affecting); I-4 `reserved_units ≥ 0`; **no CHECK on the sign of `paid_balance_units`.**
- **Entry types:** `trial_grant`, `trial_adjustment`, `credit_grant`, `credit_adjustment`, `capacity_reserved`, `capacity_released` (defined for future loyalty corrections; unused now), `consumption`, `consumption_reversal` (defined, unused now), `settlement_void_reversal`.
- Each entry stores `trial_after`/`paid_after`/`reserved_after` for point-in-time reads without replay.

## 8. Commercial admission boundary, capacity gate and reservation model

### 8.1 Every current path that creates a Circle, allocates a unit, or reopens a Circle

Enumerated from `functions/src`, `scripts`, `records`, `apps`, `tests` (grep of every caller of `openCycleUnderStreamLock`, `insertAllocationPosition`, `convertPendingPositionToAllocated`, `addAllocatedUnitsToCycle`, `insertRewardForCycle`, `markCycleRewardAvailable`, `insertVerifiedUnitCredit`, and direct `INSERT` into `loyalty_cycles`, `verified_units`, `verified_unit_allocations`, `rewards`):

| # | Path | Location | Creates a Circle | Allocates a first unit | Reopens/creates a next Circle | Verified Unit created? | Commercial treatment |
|---|---|---|---|---|---|---|---|
| P1 | Normal verification — open when none | `verifyPurchaseCommand.ts:201–209` | Yes | — | — | Yes (`:179`) | **Admission boundary** (§8.2) decides before the unit exists |
| P2 | Normal verification — allocate into a Cycle (incl. first allocation into an empty Cycle, `:220–237`) | `:239–273` | — | Yes | — | Yes | Covered by the same admission decision |
| P3 | Normal verification — overflow to **pending** positions | `:274–297` | — | — | — | Yes | Covered: admission counts pending units (§8.3) |
| P4 | Redemption — next Cycle opened (empty or under first forward unit's version) | `confirmRedemptionCommand.ts:357–371` | Yes | — | **Yes** | **No** | **No gate needed**: opens an *empty* Cycle; no earning, no commitment, no Verified Unit. Gating it would block redemption (`DEC-LOY-011`, PRD06 §5, `DEC-SUB-014` §7) |
| P5 | Redemption — forward allocation of pending positions into the next Cycle | `:385–400` | — | **Yes** | — | **No** (moves existing positions) | **No gate needed**: the units were admitted when their Purchases were admitted (their blocks were reserved then). Moving them consumes no new capacity |
| P6 | Redemption — threshold reached inside forward allocation (`insertRewardForCycle`, `markCycleRewardAvailable`) | `:408–425` | — | — | — | No | Handled by consumption projection (§5), which anchors on the `rewards` row |
| P7 | Pending allocation / replay | `listPendingAllocationPositions` has one caller (redemption, `:357`). Idempotent replays (`peekIdempotencyKey` / reservation `duplicate`) return a stored snapshot and **write nothing** | No | No | No | No | No writer exists outside P5. Nothing to gate |
| P8 | Imports / backfills / repair scripts | None found in `functions/src`, `scripts` (only `postgres/init-multiple-databases.sh`), `records`, `apps` (read-only customer UI), `tests` | — | — | — | — | None exist |
| P9 | **New:** admission processor (§8.12) | New | Yes | Yes | — | Yes | Uses the **same** admission core as P1 |
| P10 | **Future:** correction/reversal commands, imports, repair tools | Not built | — | — | — | Would issue units | Must call the same boundary (§8.2 enforcement) |

### 8.2 The one canonical admission boundary

**Invariant:** *no Verified Unit is issued unless the purchase has been commercially admitted; every later loyalty movement moves admitted units.* Verified Unit issuance is the sole point at which new earning enters the loyalty system, so admitting there covers P1–P6 with **one** boundary and **zero changes to redemption**.

Implementation shape (design):

- **`admitPurchaseToLoyalty(tx, purchase, actor)`** — a single Purchase-domain service that contains the steps currently in `verifyPurchase` from the Verified Unit insert through the outbox writes (steps 4–11). Both `verifyPurchase` (P1–P3) and the admission processor (P9) call it; neither contains a copy.
- **`CommercialAdmissionPort.evaluate(tx, {businessId, streamKey, unitsBefore, quantity, streamHasHeldPurchase})`** — the Commercial-side decision, returning `admit{blocksReserved}` or `hold{reason}`.
- **Enforcement:** a structural test fixes the set of importers of the loyalty write functions. `insertVerifiedUnitCredit` may be imported only by the admission core; `confirmRedemptionCommand.ts` must **not** import it; any new importer fails the test and requires review. This is what keeps P10 honest.

### 8.3 What "a new Circle position" means (block arithmetic)

Using the stream's net admitted Verified Units `U` (read under the stream lock, so consistent), a purchase of `q` units begins
`newBlocks = ceil((U+q)/10) − ceil(U/10)` new Circle positions. Allocated and pending units count uniformly, so a customer with an unredeemed Reward cannot use pending units to begin further Circles without admission. `10` is the loyalty threshold read from `LOYALTY_CYCLE_THRESHOLD`; Commercial never redefines it. `newBlocks = 0` means the purchase lies inside an already-admitted position and **takes no commercial lock at all**.

**Consequence (disclosed).** A Verified Unit is one row per Purchase and cannot be split without altering loyalty semantics. A purchase that straddles a block boundary (for example 8 admitted + 5 units) is admitted or held **as a whole**, even if part of it would fit. Splitting is not designed here.

### 8.4 Verify transaction order (canonical, corrected)

The gate must know `U` and must not create a Cycle before the decision, so the stream and current-Cycle locks move **before** the purchase transition and unit issue. This preserves the canonical order (purchase → stream → cycle) and only moves work after the locks:

```
idempotency → purchase (lock, ownership, state) → stream (ensure+lock) → current cycle (lock; NO open yet)
   → [only if newBlocks>0 or stream/business has held purchases] commercial account (lock)
   → decision:
        ADMIT  → reserve (ledger + admission row) → transition purchase → verified, issue unit,
                 open cycle if none, allocate, threshold, trust events, intents, outbox  (existing steps)
        HOLD   → transition purchase → pending_admission, event, audit; commit (a success outcome, not an error)
```

The account lock is the **last lock any loyalty transaction takes**.

### 8.5 Reservation model (FD-A)

| Aspect | Design |
|---|---|
| **When it occurs** | At admission, in the same transaction that issues the Verified Unit — from `verifyPurchase` (P1) or the admission processor (P9). Never at Cycle open, never at redemption |
| **Durable representation** | (1) an append-only ledger entry `capacity_reserved` (`reserved_delta = +newBlocks`, `units_delta = 0`, FK to the Verified Unit); (2) one immutable `commercial_admissions` row per admitted purchase (`purchase_record_id` unique, `verified_unit_id` unique, `blocks_reserved`, decision snapshot); (3) one immutable `commercial_admission_blocks` earmark row **per Circle position** (bucket provenance, §8.5.1); (4) the `trial_reserved_units` and `paid_reserved_units` counters on the account (`reserved_units` is their sum). Availability treats reserved capacity as **one shared pool**; provenance is per block, keyed by index — no Cycle or position state is copied |
| **Converts to consumed** | When the consumption projection records a Reward (§5): one `consumption` entry debits one unit **from the earmarked bucket** and releases the same bucket's reserved unit atomically (`units_delta = −1` and `reserved_delta = −1` on that bucket), recording the earmark it consumed |
| **Released without consumption** | Only by a future governed loyalty correction, via `capacity_released` (defined, unused now). No release path exists today because no cancellation/reversal exists |
| **Rollback** | Reservation, unit issue and allocation are one transaction. Rollback removes all of them together; a held purchase writes **no** reservation |
| **Concurrency** | Serialised by the account row lock. A second concurrent admission sees the first's reservation and is held if capacity is gone — **concurrent new-Circle starts cannot oversubscribe** |
| **Trial and paid** | One shared pool for availability: available = `trial_remaining + paid_balance − reserved` (accepted FD-A model, unchanged). **Funding provenance is earmarked per block at admission and honoured at consumption** (§8.5.1) |
| **Does not duplicate loyalty state** | Commercial stores counts, provenance ids and a per-block **index-keyed earmark** only. It never copies Cycle state, allocation positions or unit membership; those remain solely in loyalty tables. The earmark's link to a Circle is the derivable equality `block_index = cycle.sequence_number` (§8.5.1) |
| **Not customer-facing** | Reservation mechanics are internal. Businesses see "available capacity" and plain-language operational consequences (§17), never reservation rows |
| **Unearmarked consumption** | A Reward with no earmark (available before `commercial_effective_from`, or admitted while the gate was `off`/`shadow`) still consumes, using the defined fallback in §8.5.1, and the consumption event is flagged. Expected count in `enforce` mode is zero; a non-zero count raises an alert |

### 8.5.1 Capacity provenance at admission — implementation invariant `INV-CAP-PROV`

**Scope.** The accepted shared-capacity model (§7, §8.5) is **not redesigned**: availability remains one pool. This subsection only fixes *which funding bucket a Circle is treated as using*, so that the treatment cannot drift.

**The hazard found in review.** If the bucket were decided when the consumption is *posted* (trial-first from current balances), the result would depend on posting time and processing order. Example: Circle A1 is admitted when trial is exhausted (paid treatment); the administrator then adds trial capacity; Circle A2 is admitted (trial treatment); the projection is delayed; when it runs, A1's Reward is posted first and would take the trial unit, and A2's the paid unit. Totals match, but each Circle's commercial treatment has changed retroactively (paid→trial and trial→paid) purely because of delay. The same distortion follows from any trial adjustment, top-up, activation or settlement void between admission and Reward-available.

**Invariant `INV-CAP-PROV`.** *For every Circle admitted while the gate is in `enforce` mode, the funding bucket debited at consumption is exactly the bucket earmarked at that Circle's admission, regardless of projection delay, retry, reordering, concurrent projectors, reconciliation, backfill, trial adjustment, top-up, paid activation or settlement void. The bucket is never re-derived from balances at posting time.*

**Provenance retained at admission.**

| Item | Design |
|---|---|
| **Earmark rule** | For each Circle position an admission begins, in index order: bucket `trial` if uncommitted trial (`trial_remaining − trial_reserved`) is > 0 at that moment, else `paid`. A pure function of account state under the account lock. If the paid pool is negative, the availability check has already ensured uncommitted trial covers the admission, so no paid earmark is taken against a negative paid pool |
| **Durable row** | `commercial_admission_blocks`, immutable, one row per Circle position: `admission_id` (FK, R4-style — same transaction), `business_id`, `stream_ref`, `block_index`, `funding_bucket`, `earmarked_at`. `UNIQUE (business_id, stream_ref, block_index)` |
| **`stream_ref`** | Opaque deterministic digest of `business_id ‖ customer_identity_id ‖ reward_program_id`, computed on the Purchase side and passed through the port. Commercial tables therefore hold no raw customer identity, yet the projection can recompute the same value from the Reward row |
| **Mapping to a Circle** | Circle `sequence_number k` of a stream ⇔ `block_index k`. Each Circle holds exactly 10 units, a stream has one current Cycle, and the sequence increments once per opening, so the mapping is by **index**, not by which units sit inside a Circle (forward allocation orders units by purchase date while admission is ordered by decision time; the index mapping is unaffected). A Reward exists only after 10k units are admitted, so block k's earmark always precedes Reward k |
| **Counters** | `trial_reserved_units`, `paid_reserved_units` on the account; `reserved_units` is their sum. Availability formula unchanged |
| **At consumption** | Read (non-locking) the Reward's Cycle sequence, look up the earmark by `(business, stream_ref, sequence)`, debit **that** bucket, release **that** bucket's reservation, and store the consumed earmark on the consumption event (`earmark_id`, unique — an earmark can be consumed once) |
| **Never consulted at posting** | Current trial balance, paid balance, activation timestamp, restriction, settlements |
| **Fallback (no earmark exists)** | Reward available before `commercial_effective_from`, or admitted while the gate was `off`/`shadow`: consume from uncommitted trial first, then paid, and set `bucket_source = 'consumption_time_fallback'`. Never used when an earmark exists. Expected count is zero in `enforce`; non-zero raises an alert. It is also why go-live requires no in-flight Circles (§31) |
| **Future correction/reversal** | Reusing a `block_index` after a future loyalty reversal would violate the unique key and **fail closed**; that future design must add compensating release records. Out of scope, and safe by construction |

**Trial adjustment interaction.** The command floor (§9) prevents lowering trial capacity below earmarked trial, so an adjustment can never strand a trial-earmarked Circle. Upward adjustments and top-ups change only uncommitted capacity. Paid activation sets a timestamp and changes no earmark. A settlement void lowers the paid balance, possibly negative; paid-earmarked Circles still consume paid (the governed recoverable-negative outcome) and availability falls so new admissions hold.

**Transition analysis (trial ↔ paid).**

| # | Sequence | Outcome under `INV-CAP-PROV` |
|---|---|---|
| 1 | Admit with trial available → adjust trial up → top-up → activate paid → Reward | Consumes **trial** (earmarked); later admissions earmark by their own state |
| 2 | Admit with trial exhausted (paid earmark) → grant trial → Reward | Consumes **paid**; no paid→trial reassignment |
| 3 | Trial uncommitted = 1, admission begins 2 Circle positions | Block a `trial`, block b `paid`; each consumes its own bucket |
| 4 | Downward trial adjustment larger than uncommitted trial | Rejected by the floor; earmarks untouched |
| 5 | Settlement void after a paid earmark | Still consumes paid; paid balance may go negative; availability falls |
| 6 | Projection delayed, reordered, retried, run concurrently, or backfilled | Identical per-Circle buckets to prompt, ordered processing; no duplicate charge (unique cycle, unique earmark, unique ledger key) |
| 7 | Reward with no earmark | Fallback path, flagged and alerted; never overrides an existing earmark |

**Required implementation tests** (acceptance gate for WP-COM-04 and WP-COM-05b; each must assert **per-Circle bucket**, not just totals, and run the invariant checks I-1…I-4 plus counter reconciliation after every step):

1. Admission while trial capacity exists earmarks `trial`.
2. Admission with trial exhausted earmarks `paid`.
3. Admission beginning several positions across the trial/paid boundary earmarks each block deterministically.
4. Trial adjusted **up** between admission and Reward-available: earmark and consumption bucket unchanged.
5. Trial adjusted **down** within uncommitted trial: allowed, earmarks unchanged; below earmarked trial: rejected, including under a concurrent admission (floor enforced under the account lock).
6. Paid top-up, settlement confirmation and `activatePaidService` after a trial-earmarked admission: the Circle still consumes `trial`.
7. Trial grant/adjustment after a paid-earmarked admission: the Circle still consumes `paid` (no paid→trial reassignment).
8. Settlement void after a paid earmark: still `paid`, balance may go negative, availability holds new admissions.
9. Delayed, out-of-order, concurrent and repeated projection, verified as a property over permutations of processing order: per-Circle buckets identical to prompt ordered processing.
10. Retry after mid-transaction failure or rollback, reconciliation re-run and backfill: no change to any bucket, no duplicate.
11. No double charge: debits = Rewards; each earmark consumed at most once; Σ ledger = counters.
12. Reservation→consumption conversion is atomic: balance and the matching reserved counter move together.
13. Fallback: used only when no earmark exists, flagged, alerted; never chosen when an earmark exists.
14. Counter reconciliation: `trial_reserved = Σ trial earmarks − Σ consumed trial earmarks` (and paid likewise).
15. Admission vs trial-adjust-down vs top-up concurrency: no lost update, no `40P01`.

**Escalation clause.** If implementation analysis shows `INV-CAP-PROV` cannot be met without changing a governed commercial rule (for example, a rule about how trial capacity must be consumed relative to paid capacity), implementation **stops and escalates to the Founder**. This design found no such need: earmarking at admission uses the same trial-first order already recorded as a design default and introduces no new commercial rule.

### 8.6 Gate decision

`evaluate` returns **hold** when any of: no account exists (not commercially established); `service_restriction = restricted`; `available_capacity < newBlocks`; the stream already has a purchase in `pending_admission` (per-stream ordering); or the Business has any earlier purchase in `pending_admission` and `newBlocks > 0` (Business-level no-overtaking, §8.11). Otherwise **admit**. The decision is a pure function of `(account counters, restriction flag, newBlocks, hold-queue facts)`; it is server-side and never client-influenced.

### 8.7 Trial, paid, zero, negative, grace

| Situation | Behaviour |
|---|---|
| Trial-funded | A 3-unit trial admits three Circle positions |
| Paid-funded | Same formula |
| Zero available | New positions are held; in-flight Circles continue |
| Negative accounting balance | Available < 0 ⇒ held until credit restores capacity; history is never rewritten |
| **Grace** | An admitted Circle holds its reservation, so finishing it needs no gate, cannot be held, and consumes normally. Grace creates **no** capacity for new positions because those are decided on `available`, which the reservation already reduced |
| Administrative restriction | New positions are held regardless of capacity; in-flight Circles and all redemptions unaffected |

### 8.8 FD-C — Commercially pending admission: exact lifecycle

**Authoritative state.** The Purchase domain owns it. **A new explicit Purchase status is required:** `pending_admission`. It cannot be represented by `waiting_for_customer` (the customer has already confirmed and would keep seeing "waiting for you") or by `verified` (which means a unit has been issued — `verified` ⇒ a Verified Unit exists).

**Domain semantics of `pending_admission`** (the only meaning this design gives it): the Purchase has been **received and preserved**; it has **not yet been admitted into loyalty earning**; **no Verified Unit has been issued**; **no new Circle has been started**; **loyalty credit remains pending admission**. It says nothing about the Purchase's validity and carries no commercial figures. (The transition into it happens at the customer's verification step, which is recorded as the event's actor and time; that provenance is an evidence fact, not a statement about how the state is presented.)

```
waiting_for_customer ──(customer verifies; admission HOLD)──▶ pending_admission
waiting_for_customer ──(customer verifies; admission ADMIT)──▶ verified            (unchanged path)
pending_admission   ──(admission processor / re-evaluation; ADMIT)──▶ verified
```

No other transition is added: **no reject, dispute, cancel or expiry transition is created for `pending_admission`.** Once a customer has confirmed a purchase, the existing model already offers the Business no reject/dispute on it (verified is terminal in the current writers); corrections belong to the future correction command. This avoids inventing approval semantics.

### 8.9 What is stored

- `purchase_records.status = 'pending_admission'`, `verified_at IS NULL`, both reason fields `NULL` (an added branch in `purchase_records_verified_fields`). `verified_at` still means "the moment loyalty credit was issued".
- A `purchase_record_events` row `waiting_for_customer → pending_admission`, `actor_type = 'customer'`, `reason = 'commercial_admission_held'`, `event_payload` = decision snapshot (`newBlocks`, `available_before`, `reserved_before`, restriction flag, hold reason). Because `to_status` is free text, the events table needs no change. The customer's confirmation time is this event's `occurred_at`.
- Nothing else: **no Verified Unit, no allocation, no Cycle, no Reward, no Trust Event, no notification intent, no outbox entry.** The `purchase.verified` Trust Event and related evidence are emitted at admission, not at hold.
- Commercial writes one `commercial_audit_events` row (`admission_held`, soft reference to the purchase).

### 8.10 Customer and Business visibility of a held purchase

**Experience boundary.** This design fixes the *domain semantics* (§8.8) and the *audience boundary* (FD-D) only. **All customer-facing and Business-facing wording, composition, interaction and final experience treatment for this state are governed during Experience Assembly, with the adopted Experience Reference as the authority.** No sentence, label or copy in this report is Product Truth; earlier illustrative phrasing has been withdrawn. The constraints that *do* bind assembly are:

- **Participants see no commercial data** (FD-D): whatever the customer is shown must carry no commercial reason, figure or standing.
- **Staff see no commercial financial/ledger detail** (FD-D): whatever Staff are shown carries no figure, standing or reason.
- **Owner and Manager** may be shown that the purchase awaits admission and its operational consequence, within the FD-D limits (§17).
- The display must not imply the Purchase is invalid, rejected or lost, and must not imply loyalty credit has been issued.

Implementation impact (mechanical, independent of wording): every exhaustive switch on `PurchaseStatus` in the web adapters (`CustomerActivityPage`, `PurchaseRecordsPage`, `purchaseMutations`) must handle the new value, and any new i18n keys must be added to **both** EN and FR locale files (the enforced parity test).

### 8.11 Ordering

Admission order is **deterministic first-in-first-out per Business by `(purchase_date ASC, id ASC)`** — the accepted commercial occurrence, the same principle `CORR-003` uses for forward allocation, never database insertion time. Two rules protect it:

1. **Per stream:** if a customer/program stream has any `pending_admission` purchase, a later purchase in that stream is also held, so units enter the stream in order (governing-version binding depends on it).
2. **Per Business (no overtaking):** while any purchase is `pending_admission`, a new purchase with `newBlocks > 0` is held behind it. The processor stops at the first purchase that does not fit. This prevents a newly arriving customer from taking capacity ahead of a customer already waiting. (First-fit would be a one-line policy change in the processor, not a schema change.)

Purchases with `newBlocks = 0` are never held for capacity reasons (they need none) except by rule 1.

### 8.12 Who or what can retry

| Actor | Can | Cannot |
|---|---|---|
| **Admission processor** (system) — `system:commercial-admission` | Admit pending purchases in order when capacity permits | Bypass the gate |
| Platform Administrator | Run `reevaluatePendingAdmissions(businessId)` manually (idempotent; audited) | Force-admit against capacity; alter a purchase |
| Business users, Staff, customers | Nothing — a re-verify by the customer returns the current state idempotently | Force admission (would bypass capacity) |

**Triggers** (all lead to the same idempotent processor): (a) best-effort after commit of any commercial mutation that can raise available capacity — `confirmSettlement`, positive `credit_adjustment`, `trial_grant`/positive `trial_adjustment`, `restoreCommercialStanding`; (b) a scheduled sweep for every Business with held purchases; (c) the manual command. Restoration of capacity **permits** admission; it never admits by itself.

### 8.13 Processor mechanics and idempotency

For each candidate (non-locking read, FIFO), one transaction runs the canonical order: `idempotency (key 'admit:<purchase_id>') → purchase (lock) → stream → current cycle → commercial account → decision → admitPurchaseToLoyalty`. Exactly-once: the conditional transition `pending_admission → verified` (`WHERE status = 'pending_admission'`), the unique Verified Unit per Purchase, the idempotency key and `commercial_admissions.purchase_record_id UNIQUE`. Concurrent processors: the loser finds the status no longer `pending_admission` and does nothing. A candidate that still does not fit stays held with **no** new rows (re-evaluations that re-hold record nothing).

At admission the loyalty evidence is written exactly as a normal verification (`purchase.verified`, `verified_units.issued`, `loyalty_cycle.allocated`, and the reward pair when applicable), with `actor_type = 'system'` and payload `admittedAfterCommercialHold: true, customerConfirmedAt: <event time>`. The customer's confirmation stays attributable to the customer through the earlier event; admission is attributable to the system.

### 8.14 Expiration and correction

**No expiry, cancellation or automatic rejection is designed** — none is governed, and `expired`/`cancelled` have no writers. A held purchase waits indefinitely. Its **age** is observable (oldest held age per Business in the Operator queue); an age-based signal is configurable and ships disabled (§19).

### 8.15 Audit and evidence

`purchase_record_events` (hold and admit transitions, with decision snapshots); `commercial_admissions` (one immutable row per admission); `commercial_audit_events` (`admission_held`, `admission_admitted`, `admissions_reevaluated`); the standard loyalty Trust Events at admission.

### 8.16 Schema impact on the Purchase domain (design only; no migration exists)

One migration alters `purchase_records`: extend the `status` CHECK; add the `pending_admission` branch to `purchase_records_verified_fields`; add a partial index `(business_id, purchase_date, id) WHERE status = 'pending_admission'` (processor) and `(customer_identity_id, created_at DESC) WHERE status = 'pending_admission'` (per-stream/customer checks). The TypeScript `PurchaseStatus` union gains one value. The verify command result becomes a discriminated outcome (`admitted` with the existing payload, or `pending_admission` with the purchase only), which the callable transport and web adapters must handle; the idempotency response snapshot stores whichever occurred.

### 8.17 Rollout safety and record-time hint

Gate modes by configuration: `off` (no commercial admission; today's behaviour), `shadow` (evaluate and record would-hold without holding), `enforce`. Default `off` until launch; existing tests assume no account. `recordPurchase` may give the Business a **non-locking, advisory** hint that a new position would currently be held; it never blocks recording (the purchase is always preserved).

## 9. Trial design (corrected)

- **Grants.** `commercial_trial_grants` rows record every grant: `kind` (`initial`), `units`, `granted_by`, `granted_at`, `reason_code`, `reason_text`, `reference`, `ledger_entry_id`. **`units` must be 3–5 on every grant** (CHECK). **There is no default anywhere** — the command requires `units`, and the UI must neither pre-fill a value nor offer 1 or 2.
- **No lifetime cap; no single-grant limit.** The design does **not** hard-code one lifetime grant per Business and does **not** cap lifetime trial capacity at 5 (the v1.0 `UNIQUE(business_id)`, `trial_granted_units ≤ 5` and "cumulative ≤ 5" rules are removed). More than one grant may exist; each is a separate, attributable, audited, idempotent act. To guard against an *accidental* repeat, the command returns the Business's prior grants and the Operator surface displays them before confirming; this informs the administrator and does not block.
- **Later adjustment.** `adjustTrial(±n, reason)` may be performed explicitly by the authorised Platform Administrator and must be attributable and auditable (actor, Business, time, reason, reference, before/after). **No aggregate or lifetime ceiling on later adjustments is currently governed.** The design neither imposes a ceiling nor treats that absence as a rule that unlimited adjustment is authorised: it encodes **no** limit in either direction, and each adjustment stands or falls as an individually attributable, reason-bearing, audited act. Should a ceiling ever be wanted, it would be a new Founder decision and one additional predicate in the command, not a schema change. As an *informational visibility aid only* (never a rule or a block), the Operator view shows a Business's cumulative grants and adjustments so the administrator can see the history before acting.
- **Integrity floor (not a policy ceiling).** A downward adjustment may not reduce trial capacity below the amount already **earmarked to admitted Circles** (§8.5.1), because that would retroactively change those Circles' commercial treatment. The adjustable quantity is therefore the *uncommitted* trial (`trial_remaining − trial_reserved`); `trial_remaining` also cannot go below zero. Negative credit is a *paid-bucket* concept. This is a determinism invariant, not a new commercial rule, and it is consistent with `DEC-SUB-014` §8.2, which authorises adjusting the *remaining* trial allowance: capacity already committed to admitted Circles is not "remaining". (Were the Founder to want administrators to reduce trial below earmarked Circles, that would re-assign those Circles to paid treatment — a commercial-treatment question — so it is deliberately not designed.)
- **Remaining, consumption, exhaustion.** `trial_remaining_units` is materialised; trial capacity is earmarked to a Circle **at admission** (§8.5.1) and debited at consumption; exhaustion is `trial_remaining = 0`, not a state.
- **Not a tier, no expiry.** Trial is a ledger bucket plus grant records. No time-based expiry is modelled (none governed).
- **`DEC-SUB-013` remains open.** A trial grant is the launch onboarding allowance, not a complimentary arrangement; nothing here decides whether complimentary arrangements may exist. Because a repeat grant or a large adjustment could *look* like one, both are audit-visible and reason-mandatory; whether such use is permitted is exactly the open `DEC-SUB-013` question.
- **Business lifecycle.** `FD-BUS-ACT-001` moves a Business to lifecycle `trial`; that creates **no** trial allowance. The grant is a separate explicit command.

## 10. Paid-credit / manual activation design

### 10.1 Two-step settlement so future payment integration reuses the same commands

1. `recordSettlement` → `commercial_settlements` row `recorded` (offline/manual reference; no credit). Doubles as the "manual payment awaiting action" queue.
2. `confirmSettlement` → status `confirmed` and, **in the same transaction**, a `credit_grant` ledger entry referencing it.
3. `activatePaidService` → sets `paid_service_activated_at` once; invariant: at least one confirmed settlement exists.

A future provider integration calls `recordSettlement` with `source = 'provider'` and a unique provider event id (replay protection), then `confirmSettlement`. It never writes the ledger directly. Provider columns are reserved (nullable); nothing is built.

### 10.2 Units versus money

The operator states `units_purchased` and the recorded local `amount_minor`/`currency`. The system stores the price schedule in force and the **expected** amount and records any **variance** without blocking (a reason is mandatory when non-zero). No tolerance rule is invented.

### 10.3 Credit not backed by a settlement

Positive credit without a confirmed settlement is only possible through `adjustCommercialCredit` with a `reason_code` from a closed operational vocabulary (`correction`, `settlement_reconciliation`, `dispute_resolution`, `error_reversal`). There is deliberately no complimentary/pilot/partner/promotional code — that is `DEC-SUB-013`.

### 10.4 Correcting a mistaken settlement

`voidSettlement` marks it `voided` (a status transition, never a deletion) and appends a compensating `settlement_void_reversal` entry. If credit was already consumed the paid balance goes negative — a governed, recoverable outcome.

## 11. Commercial-standing model (revised)

**There is no standing enum.** Standing is a set of **separate dimensions**; two are stored, the rest derived. A single human-readable label is a **presentation function** of the dimensions and is never stored or used in logic.

| Dimension | Source | Notes |
|---|---|---|
| Established | account row exists | — |
| **Accounting balance** | `trial_remaining + paid_balance` (signed) | Negative allowed |
| **Reserved capacity** | `reserved_units` | Internal |
| **Available capacity** | balance − reserved | The admission input (FD-A) |
| **Administrative restriction** | **stored**: `service_restriction ∈ {none, restricted}` | Set by explicit administrator command with reason |
| **Paid-service activation** | **stored**: `paid_service_activated_at` | Set once |
| Funding source | derived, **presentation only**: `paid` if activated; `trial` if `trial_remaining > 0` and not activated; else `none`. It plays no part in bucket assignment, which comes solely from the admission earmark (§8.5.1) | — |
| **Grace** | derived: `reserved_units > 0` while new admission is blocked (available < 1 or restricted) | "Started Circles will finish" |
| **Admission holds** | derived: count and oldest age of `pending_admission` purchases | New with FD-C |
| Pending consumption | derived: unprojected Rewards | Keeps displayed balance honest (§5.8) |
| New-admission eligibility | derived: established ∧ not restricted ∧ available ≥ 1 ∧ no earlier held purchase | — |

Prototype labels (`CommercialStanding` = `trial | paid_active | grace | restricted | suspended`; `BusinessStatus` adds `onboarding`) are experience labels over these dimensions: *onboarding* = not established; *trial*/*paid_active* = funding with eligibility; *grace* = new admission blocked (exhausted or restricted) — the prototype shows it whenever trial and credit reach zero (`AppContext.tsx:1422, 1462`), while the dimension model additionally distinguishes whether Circles are actually in flight, so the notice can say "active Circles will finish" only when true; *restricted* = administrative restriction. `restrictBusiness`/`restoreBusiness` map to commands #8/#9.

**"Suspended" is not a commercial dimension.** It is Business lifecycle status (Firestore) and blocks purchase recording, which would contradict grace. Commercial restriction is labelled "new Circle starts paused". **Commercial standing does not drive `Business.status`** (no shared transaction; risk of blocking purchase recording). The unused `trial → active`/`→ expired` transitions should be documented as not commercially driven (a documentation follow-up on TRD10 §10.6.3).

## 12. Negative-credit model

- **How it occurs:** (i) a downward `credit_adjustment` or a `settlement_void_reversal` while Circles are in flight; (ii) consumption of a Reward whose blocks were never reserved (before `commercial_effective_from`, or in `off`/`shadow` mode); (iii) future correction-driven adjustments. Started Circles always finish, so consumption always proceeds.
- **How it recovers:** any later `credit_grant` or positive adjustment. History is never rewritten.
- **No floor, no maximum:** no CHECK, trigger or command limits `paid_balance_units` below zero. A future limit would be a new Founder decision and one extra predicate in the admission function, not a schema change.
- **Not unlimited new starts:** admission is decided on **available capacity**, which is negative whenever balance is negative, so a negative balance holds new admissions until recovered while never affecting Circles already admitted.

## 13. Pricing provenance

`USD 2` is a governed constant (`unit_price_usd_minor = 200`), validated by the command layer on every price-schedule write (not a DB CHECK, so a future Founder change is a controlled decision, not a migration).

| Record | Carries |
|---|---|
| `commercial_price_schedules` (append-only, effective-dated) | market, currency, `usd_equivalent_minor`, `local_unit_price_minor`, optional `rate_note`, `effective_from`, `created_by`, `reason` |
| Consumption event | `price_schedule_id` + immutable snapshots `unit_price_usd_minor`, `local_currency`, `local_unit_price_minor` **as at consumption** |
| Settlement | `price_schedule_id` + snapshots of expected/actual local amount, currency, units, nullable `tax_basis` |
| Credit ledger entry | references its settlement, therefore its price |

Schedule reference plus snapshots is required: the reference gives provenance, and the snapshots make history immune to later data repair. Schedule rows are never updated; a correction is a new row with a later `effective_from` and a reason. TRD17 §17.10's non-recalculation requirement holds by construction.

## 14. Local-currency design (Founder direction applied)

**Decided direction (CORR-001):** effective-dated, **Administrator-configured local unit prices** for BIF and RWF; immutable historical snapshots on relevant records; **no live per-transaction FX**. Actual initial values are launch inputs, not decided here.

- For each launch market (`BI` → BIF, `RW` → RWF) an append-only schedule row holds the fixed local unit price the administrator sets to express USD 2, plus `effective_from`. BIF and RWF have no minor unit, so amounts are whole integers; any rounding is applied **once, when the administrator sets the price**, never at settlement or consumption.
- The price in force at a moment is the latest row with `effective_from ≤ t` for the market. Settlements and consumption events snapshot it, so historical reconstruction is exact and independent of later changes.
- **No FX dependency exists anywhere in the runtime.** If automation is wanted later, a job may *propose* rows that the administrator approves — the same table, no new architecture.
- **Business ↔ market.** `commercial_accounts.settlement_market` (`BI`/`RW`) is set at account opening, seeded from `Business.countryCode` at that instant and then frozen (that field is mutable and describes the Business's own trading currency). Any other country is refused; scope is not broadened.
- **Launch input (not a blocker).** The initial BIF and RWF unit prices are supplied by the Founder as operational data before pricing go-live. The architecture, migrations and code do not depend on them.

## 15. Manual administration commands

**Common authority (all mutating commands):** an **active `platformAdministrators` record with genuinely verified MFA** — the exact `FD-BUS-ACT-001` gate (`businessActivationCommand.ts:132–143`), with a single enumeration-resistant denial. **No role check, no new role, no new permission, no per-administrator override.** The DEC-SUB-014 §8.1 non-authorisation boundary is structural: the commercial module has no import path to loyalty write functions. Idempotency: a client-supplied key reserved in `idempotency_keys` inside the same transaction. Every command appends one `commercial_audit_events` row in that transaction.

| # | Command | Input | Invariants | Idempotency / natural key | Reason/reference | Audit event | Effect |
|---|---|---|---|---|---|---|---|
| 1 | `openCommercialAccount` (implicit in #2/#4) | `businessId` | Market ∈ {BI, RW}; Business exists | `UNIQUE(business_id)` | reason code | `account_opened` | Account, `commercial_effective_from`, `settlement_market` |
| 2 | `grantTrial` | `businessId`, `units` (**required, 3–5**) | Account exists; **prior grants surfaced, not blocking; no cap** | key | reason, reference | `trial_granted` | +trial entry |
| 3 | `adjustTrial` | `businessId`, `delta`, reason | Integrity floor only: result ≥ trial earmarked to admitted Circles and ≥ 0. **No aggregate/lifetime ceiling is governed and none is encoded; absence of a ceiling is not an authorisation of unlimited adjustment** | key | reason mandatory | `trial_adjusted` | ± trial entry |
| 4 | `recordSettlement` | business, method, `externalReference`, amount, currency, `unitsPurchased`, `receivedAt` | Currency matches market; `UNIQUE(method, external_reference)` blocks replay | key + natural key | reference mandatory | `settlement_recorded` | Settlement `recorded`; no credit |
| 5 | `confirmSettlement` | `settlementId` | Status `recorded`; variance ⇒ reason | key; repeat is a no-op | confirmation note | `settlement_confirmed` | `confirmed` + `credit_grant` |
| 6 | `adjustCommercialCredit` | business, `delta ≠ 0`, `reasonCode` from closed set | Positive unsettled credit only with permitted codes (§10.3); may drive paid balance negative | key | reason + reference | `credit_adjusted` | ± paid entry |
| 7 | `activatePaidService` | `businessId` | ≥ 1 confirmed settlement; set-once | key | reason | `paid_service_activated` | Sets activation |
| 8 | `restrictNewStarts` | business, reason | Account exists; idempotent | key | reason mandatory | `service_restricted` | Restriction on: new admissions held; in-flight Circles and redemptions unaffected |
| 9 | `restoreCommercialStanding` | business, reason | Currently restricted | key | reason mandatory | `service_restored` | Restriction off; **triggers admission re-evaluation** |
| 10 | `voidSettlement` | `settlementId`, reason | Not already voided | key | reason mandatory | `settlement_voided` | `voided` + reversal entry |
| 11 | `setPriceSchedule` | market, `localUnitPriceMinor`, `effectiveFrom`, optional note, reason | USD equivalent = 200; `effective_from` not before latest; `UNIQUE(market, effective_from)` | key | reason | `price_schedule_set` | New schedule row |
| 12 | `reevaluatePendingAdmissions` | `businessId` | None; never force-admits | key | optional | `admissions_reevaluated` | Runs the processor once |
| 13 | Reads: inspect standing / history / audit / queues | business or filters | Same authority gate | n/a | n/a | optional coalesced `history_inspected` (Business-360, audit search) | None |

There is **no dual-control** command (impossible with a sole administrator; SoD beyond `DEC-GOV-011` remains the open governance item). Compensating controls needing no new authority: mandatory reasons, immutable audit, a read-only recent-changes digest.

## 16. Operator Console binding matrix (revised for FD-A–D, trial and currency)

Class: DB direct bind · AN assembly needed · AD adapter needed · AU authorised-but-unimplemented · TG truth gap · PO prototype-only. Disposition: REUSE / REFINE / REPLACE / DEFER. The seven tabs (`operations, businesses, commercial, support, integrity, platform, audit` — verified in `OperatorConsole.tsx:23–29`) are the target; none is redesigned.

| Tab | Existing data | Missing read model | Adapter | Command surface | Prototype-only | Unresolved truth | Class | Disp. |
|---|---|---|---|---|---|---|---|---|
| **Operations** | Firestore lifecycle; settlements `recorded`; **held purchases** | Cross-tenant queues: onboarding, payment awaiting action, **admissions held (count, oldest age)**, projection lag | `operator.listQueues` | #5, #12 deep-links | Scenario A–F | Support/integrity items | AD + AU | REFINE |
| **Businesses** (360) | Firestore Business/membership; commercial account | Aggregate incl. **available capacity, held purchases, grace, restriction** | `operator.getBusiness360` | #1–#12 deep-links | Persona switcher | Cross-tenant read beyond sole-admin (`DEC-GOV-007`) | AD | REFINE |
| **Commercial** | none | Standing dimensions, ledger history, settlements, trial grants (**multiple, with adjustments; cumulative history shown informationally, never as a limit**), **admission queue** | `operator.getCommercialStanding`, `getCommercialHistory` | #2–#12 | `$1.00`, 5-unit default, **1–5 trial input**, USD-clamped balance, `OperatorSubRole` | none | AU + AD | REFINE |
| **Support** | none | Case store | — | — | Case demo data | Support-case truth | AU / TG | DEFER |
| **Integrity** | `trust_events` (substrate) | Case management | — | — | Integrity demo | Workflow truth | TG | DEFER |
| **Platform** | `commerceKnowledge` (taxonomy) | **BIF/RWF effective-dated unit-price schedules** | `operator.listPriceSchedules` | #11 | Market demo config | Non-commercial platform configuration | AD (slice) / TG | REFINE / DEFER |
| **Audit** | Firestore audit write-only | Commercial audit projection incl. admission events (TRD18 §18.50 fields) | `operator.searchAudit` | Read only | `AuditLogEntry` shape | Cross-domain audit future | AD | REFINE |

Prototype scenarios A–F, phone frame, `OperatorSubRole`, demo personas remain PO. The prototype's `grantTrial`, `restrictBusiness`, `restoreBusiness` and scenario C/D/E map to commands #2, #8, #9 and #4–#7/#6.

## 17. Business experience binding and read model (FD-D)

### 17.1 Visibility matrix

| Audience | Sees | Does not see |
|---|---|---|
| **Owner** | **Full Business commercial read visibility:** standing dimensions, trial remaining, accounting balance (units), available capacity, "Circles in progress" (reserved, in plain language), grace and restriction notices, held purchases (count, age, list), Business-visible ledger lines (credits, adjustments, consumption counts), settlements for their Business, unit price for their market | Internal reason text, internal notes, audit trail, other Businesses, any administrator control |
| **Manager** | **Standing and the operational consequences needed to run the Business:** whether new Circles can currently start, that active Circles will finish, that earned Rewards are unaffected, the number of purchases awaiting admission, the standing label | Money, prices, balances in units beyond "can new Circles start", ledger, settlements, history, audit; **no Platform commercial administration** |
| **Staff** | At most a generic indication that an affected purchase is not yet admitted, worded during Experience Assembly | Any commercial figure, standing, ledger, reason |
| **Participant (customer)** | At most a neutral purchase status, worded during Experience Assembly | Any commercial data whatsoever |
| **Platform Administrator** | Governed manual administration as already authorised (§15) | — |

The Manager row is a **design interpretation of "operational consequences"**: it exposes yes/no eligibility and counts, not financial figures; narrowing it to the standing label alone is a one-line change in the read model.

### 17.2 Permission model (Business-scoped; no delegation invented)

A structurally separate catalogue module (the `DEC-LOY-017` precedent) with two non-inheritable permissions and **no explicit-grant eligible roles and no override**: `commercial.viewFinancial` (Owner only) and `commercial.viewStanding` (Owner and Manager). Staff and participant have none. Platform Administrator authority never flows to Business users, and Business users can never call a commercial command. Read models are scoped by `business_id` server-side; the two read models below are distinct so the Manager read model **cannot** leak Owner data.

### 17.3 Read models

- **`business.getCommercialStandingSummary`** (Owner, Manager): derived dimensions reduced to labels/booleans/counts — eligibility, grace, restriction, `held_purchase_count`, and for Owner additionally available capacity and Circles in progress.
- **`business.getCommercialFinancialSummary`** (Owner only): trial remaining, balance (units), pending consumption, Business-visible history, settlements, unit price for the market. Ledger rows expose a Business-visible label, never internal `reason_text`.
- **Held purchases** are read through the existing Purchase queries (status `pending_admission`), so no commercial data enters a Staff or customer response; their generic label carries no reason.

### 17.4 Experience element binding

| Experience element | Production source | Class | Disp. |
|---|---|---|---|
| Commercial standing notice | Derived dimensions (§11) via the standing summary | AD + AN | REFINE |
| Trial remaining | `trial_remaining_units` (Owner) | AD | REFINE |
| Credit / capacity | Balance in **units**, available capacity (Owner) | AD | REFINE (unit-denominated; see X-8) |
| Grace | Grace dimension (Owner, Manager) | AD | REFINE |
| Restriction ("new Circle starts paused") | Restriction / exhausted (Owner, Manager) | AD | REFINE |
| Held purchases | `pending_admission` (Owner, Manager; generic and detail-free for Staff); wording and treatment per the adopted Experience Reference at assembly | AD | REFINE (new) |
| Active-Circle preservation / earned-Reward preservation | Backed by §8.7 and `DEC-LOY-011`; redemption unchanged | AN (copy) | REUSE |
| History | Business-visible ledger lines (Owner only) | AD | REFINE |
| Price shown | USD 2 equivalent + the market's local price (never the prototype `$1`) | AN | REPLACE (value) |
| Credit panel / per-Circle "Covered by Trial · deducted" line | Unit balance and consumption records (`bucket`, price snapshot); money as display-only equivalent | AD | REFINE |

## 18. Audit model

**Commercial owns its own append-only audit table, with a read projection for the Operator Audit tab. Trust Events and the Firestore platform-audit collection are not reused** — audit must be atomic with the ledger mutation (a Firestore write cannot share a PostgreSQL transaction); `trust_events` is a customer-facing, purchase-anchored evidence substrate with a closed type set; the platform audit collection has a closed vocabulary, fixed `targetType`, and is write-only.

`commercial_audit_events` follows TRD18 §18.49: `actor_user_id`, `actor_role` (constant `platform_administrator`), `action_type`, `target_type`, `target_id`, `business_id`, `reason_code`, `reason_text`, `before_snapshot`, `after_snapshot`, related ids (`ledger_entry_id`, `settlement_id`, `trial_grant_id`, `consumption_event_id`, `admission_id`, `price_schedule_id`; purchase reference **soft**, per R7), `correlation_id`, `idempotency_key`, `occurred_at`, `schema_version`. System actors: `system:commercial-projection`, `system:commercial-admission`. Indexes serve the TRD18 §18.50 search fields. Triggers make rows immutable. A `platform_audit_v` projection selects commercial events today and can union other domains later. Reads of Business-360 and audit search may be recorded as coalesced `history_inspected`.

## 19. Notification and operational-queue design

Commercial uses its own **`commercial_notification_intents`** (intent-vs-delivery, `status = 'pending'`, no delivery worker) rather than widening the shared table. Operator queues are derived views.

| Signal | Kind | Threshold |
|---|---|---|
| Trial nearing exhaustion | Threshold | Not governed → `commercial_signal_config.trial_low_units`; NULL = disabled |
| Trial exhausted | State | none |
| Low commercial capacity | Threshold | Not governed → `commercial_signal_config.capacity_low_units`; NULL = disabled |
| Zero capacity | State (`available < 1`) | none |
| Negative credit | State | none |
| Manual payment awaiting action | State (settlement `recorded`) | none |
| Restricted Business | State | none |
| Grace-active | State | none |
| **Purchases pending admission** | State (count > 0) | none |
| **Oldest pending admission is old** | Threshold | Not governed → `commercial_signal_config.admission_age_minutes`; NULL = disabled |

Ungoverned Business-facing thresholds ship **disabled** until configured; no number is invented. (The engineering lag/failure alert parameters in §5.7 are operating parameters, not Business signals.) Intents are keyed `(business_id, signal_type, account_version, recipient_id)` and are versioned snapshots; consumers re-read current standing, so a late intent cannot resurrect a stale state. Business recipients follow §17.2 (Owner for financial signals; Owner and Manager for standing signals). No new `notification_intents` types are added and no customer notification about commercial matters exists.

## 20. Logical data model

Naming follows the repository: `snake_case`, `UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `business_id TEXT` (opaque), `correlation_id TEXT NOT NULL`, `schema_version INTEGER NOT NULL DEFAULT 1`. Next migration number `0021`. **Foreign keys follow §4.4** (per relation). *Design only; no migration exists.*

| Table | Purpose / owner | Key fields | Mutable | Constraints & idempotency | Lifecycle / audit |
|---|---|---|---|---|---|
| `commercial_accounts` | Materialised per-Business state | `business_id` PK; `settlement_market`; `commercial_effective_from`; `trial_remaining_units`, `paid_balance_units`, `trial_reserved_units`, `paid_reserved_units` (`reserved_units` = sum); `service_restriction`; `paid_service_activated_at`; `version`; `updated_at` | Counters/flags only, under own lock with a ledger append | `trial_remaining_units ≥ trial_reserved_units ≥ 0`; `paid_reserved_units ≥ 0`; **no sign CHECK on `paid_balance_units`; no cap on any trial value** | Created once; never deleted |
| `commercial_ledger_entries` | Authoritative ledger | `id`; `business_id` FK; `entry_type`; `bucket`; `units_delta`; `trial_reserved_delta`; `paid_reserved_delta`; `*_after`; refs; `idempotency_scope_key`; `created_by`; `occurred_at`; FK `source_verified_unit_id` (R6) | **Immutable** | `UNIQUE(idempotency_scope_key)` | Scope keys `consume:<cycle>`, `reserve:<vu>`, `cmd:<key>:<n>` |
| `commercial_admissions` | One row per admitted purchase | `id`; `business_id`; `purchase_record_id` FK UNIQUE (R5); `verified_unit_id` FK UNIQUE (R4); `blocks_reserved`; `decided_by` (`customer_verify`/`admission_processor`); `ledger_entry_id`; decision snapshot (`available_before`, `reserved_before`); `decided_at` | **Immutable** | `UNIQUE(purchase_record_id)`, `UNIQUE(verified_unit_id)` | Written in the admitting loyalty transaction |
| `commercial_admission_blocks` | **Bucket provenance**, one row per Circle position (`INV-CAP-PROV`, §8.5.1) | `id`; `admission_id` FK; `business_id`; `stream_ref` (opaque digest, no raw identity); `block_index`; `funding_bucket` (`trial`/`paid`); `earmarked_at` | **Immutable** | **`UNIQUE(business_id, stream_ref, block_index)`** | Written in the admitting loyalty transaction; consumed once via `consumption_events.earmark_id` |
| `commercial_consumption_events` | One row per consumed unit | `id`; `business_id`; `reward_program_id` (soft, R3); `source_loyalty_cycle_id`; `source_reward_id`; composite FK to `rewards (id, loyalty_cycle_id)` (R1); `source_fact_at`; `unit_count = 1`; `bucket` (the earmarked bucket); `earmark_id` (FK, **UNIQUE**, nullable only for the flagged fallback); `bucket_source` (`earmark` / `consumption_time_fallback`); `price_schedule_id`; price snapshots; `ledger_entry_id`; `recorded_at` | **Immutable** | **`UNIQUE(source_loyalty_cycle_id)`**; no customer identity | Written by the projection |
| `commercial_projection_failures` | Observability | cycle id, error class, attempt, time | Append-only | — | Feeds alerts |
| `commercial_trial_grants` | Every trial grant | `id`; `business_id`; `kind`; **`units` CHECK 3..5**; `granted_by`; `granted_at`; reason fields; `reference`; `ledger_entry_id` | Immutable | **No `UNIQUE(business_id)`; no lifetime cap**; idempotency key unique | Audit `trial_granted` |
| `commercial_manual_adjustments` | Trial and credit adjustments | `id`; `business_id`; `bucket`; `units_delta ≠ 0`; `reason_code`; `reason_text NOT NULL`; `reference`; `created_by`; `idempotency_key`; `ledger_entry_id` | Immutable | `UNIQUE(idempotency_key)`; **no aggregate/lifetime ceiling on trial adjustments is governed or encoded** (integrity floor only, enforced in the command under the account lock) | Audit |
| `commercial_settlements` | Offline/manual (later provider) payments | `id`; `business_id`; `status`; `source`; `method`; `external_reference`; `provider_event_id`; `amount_minor BIGINT`; `currency`; `market`; `units_purchased`; `price_schedule_id`; `expected_amount_minor`; `variance_minor`; `tax_basis`; `received_at`; actor/time fields | Status and confirm/void fields only | `UNIQUE(method, external_reference)`; `UNIQUE(provider_event_id)` | recorded → confirmed → voided |
| `commercial_price_schedules` | Effective-dated pricing | `id`; `market`; `currency`; `usd_equivalent_minor`; `local_unit_price_minor`; `rate_note`; `effective_from`; `created_by`; `reason` | **Immutable** | `UNIQUE(market, effective_from)` | Correction = new row |
| `commercial_standing_events` | Restriction/activation/opening timeline | `id`; `business_id`; `event_type`; actor; reason; time | Immutable | key unique | Feeds history |
| `commercial_audit_events` | Immutable admin audit (TRD18 §18.49) | as §18 | **Immutable** | `UNIQUE(idempotency_key, action_type)` | Read by projection |
| `commercial_notification_intents` | Intent, not delivery | `business_id`; `signal_type`; recipient; `account_version`; payload; `status='pending'` | Immutable | unique per §19 | Delivery deferred |
| `commercial_signal_config` | Ungoverned thresholds | `key` PK; `value NULL` | Admin-set | NULL = disabled | Audited |

**Purchase-domain change (§8.16):** `purchase_records` status CHECK, `verified_fields` branch, two partial indexes for `pending_admission`. **Additive loyalty-side performance indexes:** `rewards (business_id, available_at)`. No other loyalty table changes.

**Read models (views):** `commercial_account_standing_v`, `commercial_history_v` (Owner-visible and operator variants), `operator_commercial_queue_v` (incl. held purchases, lag), `platform_audit_v`.

## 21. Transaction boundaries

| Transaction | Contents (one PostgreSQL transaction each) |
|---|---|
| Verify (admit) | Idempotency → purchase → stream → cycle → account → reserve + admission row → purchase→verified, unit, Cycle, allocation, threshold, evidence |
| Verify (hold) | Idempotency → purchase → stream → cycle → account → purchase→`pending_admission` + event + audit; commits as a success outcome |
| Admission processor (per purchase) | As Verify (admit) with `system:commercial-admission` |
| Consumption projection (per Reward) | Event insert (FK, before account lock) → account lock → debit + release + audit |
| Admin command | Idempotency → account → command rows → ledger → account update → audit → idempotency complete |
| Settlement confirm | Settlement transition + `credit_grant` + audit atomically |
| Authority check | Firestore read of `platformAdministrators` **before** the PostgreSQL transaction (as `confirmRedemption` does); the residual revocation window is the accepted two-store limitation |
| Reconciliation | Read-only |

## 22. Concurrency and lock-order analysis

### 22.1 Canonical order

`idempotency → purchase → stream → cycle → reward → commercial_account → appends`. The commercial account row is the **last lock any loyalty transaction takes**, and only when the decision needs it.

### 22.2 Why no inversion

Commercial-only transactions take `idempotency → account → commercial rows`, with any FK-bearing insert against a loyalty row executed **before** the account lock (§4.4 rule iii). A commercial transaction therefore never waits on a loyalty lock while holding the account lock, so no cycle can form with a loyalty transaction that waits for the account lock last. Redemption is unchanged and takes no commercial lock at all.

### 22.3 Required tests (CORR-002 style)

Concurrent verify × verify (same Business, different streams; same stream); verify × projection; verify × admin credit/restrict; verify × admission processor; redemption × projection (Reward `FOR UPDATE` versus the R1 key-share); processor × processor; asserted absence of `40P01` in each.

| Scenario | Behaviour |
|---|---|
| Simultaneous Circle completion | Independent `rewards` rows; projections race on `UNIQUE(source_loyalty_cycle_id)`; loser does nothing |
| **Simultaneous new-Circle attempts (FD-A)** | Serialise on the account row; the second sees the first's reservation and is held if capacity is gone — **no oversubscription** |
| Consumption vs manual top-up | Both take the account lock; deltas commute; each entry records `*_after` |
| Consumption vs restriction | Restriction is read under the same lock and never affects consumption |
| Held purchase vs restoration | Restoration commits; processor admits in FIFO order under the same gate; a concurrent new verify sees the non-empty hold queue and is held behind (no overtaking) |
| Duplicate Operator commands | Idempotency replay; natural keys catch a re-keyed replay |
| Payment replay | `UNIQUE(method, external_reference)` / `UNIQUE(provider_event_id)` |
| Retry after timeout | Same key ⇒ stored result |
| Transaction rollback | Verify rollback discards reservation, unit and status change together; projection rollback leaves the Reward eligible |
| Out-of-order notification | Versioned snapshots; consumers re-read |

## 23. Idempotency model

| Operation | Key |
|---|---|
| Admin command | Client `idempotencyKey` in `idempotency_keys` (`commercial.<command>`) |
| Admission (verify) | Existing `purchase.verify` key; plus `UNIQUE(purchase_record_id)` on admissions |
| Admission (processor) | `admit:<purchase_id>`; conditional status transition; unique unit per purchase |
| Reservation | `reserve:<verified_unit_id>` |
| Consumption | `source_loyalty_cycle_id` unique + `consume:<cycle_id>` |
| Settlement | `(method, external_reference)`; future `provider_event_id` |
| Price schedule | `(market, effective_from)` |
| Signals | `(business_id, signal_type, account_version, recipient_id)` |

## 24. Failure and rollback behaviour

Projection fault: retried by the sweep; loyalty unaffected; alerts fire. Admission fault: the purchase stays `pending_admission` (or `waiting_for_customer` if the fault preceded the hold), never partially credited. Gate modes `off`/`shadow` give an instant operational switch back. Ledger errors are corrected only by compensating entries. Migration rollback: a `.down.sql` that **refuses when any ledger, settlement, admission or audit row exists, or any purchase is `pending_admission`**, mirroring `0020.down` (recovery of a populated database needs a backup).

## 25. Security and authority boundaries

- **Commands:** active Platform Administrator + verified MFA (`FD-BUS-ACT-001`); no role, override or new permission. Stated limitation: until `DEC-GOV-007`, commercial authority follows administrator status, so adding a second administrator would confer commercial power; `DEC-SUB-014` §9 already requires roles be defined first, and a launch runbook check records that the administrator set is exactly the Founder.
- **§8.1 boundary is structural:** no commercial import path to loyalty writes; the admission port is the sole coupling; the loyalty-write importer allow-list test.
- **Tenant isolation:** every commercial read/write is `business_id`-scoped.
- **Privacy:** commercial tables store no customer identity; participants see no commercial data (FD-D); whatever a held purchase's status shows a customer or Staff member carries no commercial reason or figure (wording is an Experience Assembly matter).
- **Mass-assignment:** transports whitelist fields; `units`, market and price are never client-defaulted.
- **Audit integrity:** immutability triggers; audit written in the mutation transaction.
- **Enumeration:** one denial reason for all authority failures.

## 26. Experience ↔ Product Truth conflicts

| # | Conflict | Class | Resolution |
|---|---|---|---|
| X-1 | Prototype `$1.00`/`unitAmountUSD: 1.0` vs USD 2 | Documentation-only | Bind to USD 2 (`FD-COM-001` §11) |
| X-2 | Prototype default 5-unit trial and 1–5 input (`OperatorConsole.tsx:85, 199`) vs 3–5, no default | Documentation-only | Explicit units in 3–5; no pre-fill; no 1 or 2 |
| X-3 | Prototype "suspended" label | Documentation-only | Map to dimensions; restriction labelled "new Circle starts paused" |
| X-4 | Dual control recommended by EXP-REF-001 vs sole administrator | Product-scope / integrity | Experience kept; compensating controls; SoD stays open |
| X-5 | Prototype `OperatorSubRole` vs no RBAC | Product-scope | One "Platform Administrator" as adopted; typing PO |
| X-6 | Cross-tenant Operator reads with no governed admin read model | Security | Sole-administrator authority; audited reads; no role invented |
| X-7 | *(Resolved by FD-D)* Business role visibility | — | §17 |
| X-8 | Prototype credit is a **USD balance clamped at zero** (`creditBalanceUSD`; `Math.max(0, balance − 1.0)`, `AppContext.tsx:383`) vs governed negative credit and USD 2 unit | **Integrity** | Authority is unit-denominated and signed; UI shows units with a display-only money equivalent; the experience keeps its credit panel and per-Circle coverage line |
| X-9 | Prototype consumes trial first | none — supports design | Trial-first order adopted, applied at admission-time earmarking |
| X-10 | Prototype has no held/pending-admission representation | Documentation-only | A held-purchase representation is needed; its composition, wording and treatment are decided at Experience Assembly by the adopted Experience Reference, within the FD-D audience limits. The reference is not altered |

No conflict requires degrading the adopted experience for implementation convenience.

## 27. Remaining Founder decisions

**FD-A, FD-B, FD-C and FD-D are resolved and are not open.** The trial and currency directions are decided. No Product Truth question remains that blocks the commercial architecture or any work package.

| Item | Status | Blocks architecture? |
|---|---|---|
| `DEC-SUB-013` complimentary arrangements | Open (pre-existing); not solved here | No |
| `DEC-GOV-007` administrator roles / SoD beyond `DEC-GOV-011` | Open (pre-existing) | No |
| **Launch input:** initial BIF and RWF unit prices | Operational data needed at pricing go-live | **No** — needed only when pricing is enabled |

**Design defaults (architecture; Technical Lead to confirm; reversible; not Founder decisions):** trial-first funding order, applied when the bucket is earmarked at admission (`INV-CAP-PROV`, §8.5.1); two-step settlement; closed reason-code vocabulary; gate `off/shadow/enforce`; immutability triggers; strict FIFO no-overtaking with first-fit as a policy alternative; whole-purchase admission for block-straddling purchases; Manager visibility as yes/no eligibility and counts; engineering alert thresholds for the projection.

## 28. Prototype-only inventory (commercial/Operator scope)

`unitAmountUSD: 1.0` and `$1.00 USD Deducted`; `trialAllowanceTotal: 5` on demo organisations and the Operator `trialUnits` default of 5 with its 1–5 input; `creditBalanceUSD` and its zero clamp; `creditDelta = -5` demo; operator scenarios A–F; `OperatorSubRole`; `CommercialStanding`/`BusinessStatus`/`OnboardingState` unions as type names; demo personas; scripted demo tour; `ManualActivationRecord`/`paidActivationRef` shapes (concept authorised, structure redesigned); `AuditLogEntry` shape (illustrative; the design covers every field). Verified against commit `18e8d700`.

## 29. Risks

| # | Risk | Sev. | Control |
|---|---|---|---|
| R-1 | Admission refactor touches the verify path (order change, extracted core) | High | `off/shadow/enforce`; only `newBlocks > 0` or hold-queue cases take the account lock; lock-order and concurrency tests; extracted core keeps existing tests green |
| R-2 | New Purchase status ripples into web adapters and EN/FR i18n | Med | Enumerated in §8.10/§8.16; parity test enforces both locales |
| R-3 | Consumption sweep and admission processor need a scheduler that does not exist in the repo | Med | Recorded as a WP-COM-10 dependency; best-effort post-commit triggers cover the common path; alerts cover a stalled sweep |
| R-4 | Projection stalls unnoticed | Med | Lag and failure alerts (§5.7); conservative capacity direction (§5.8) |
| R-5 | Head-of-line blocking by a large held purchase | Low | First-fit is a one-line policy alternative |
| R-6 | Purchase straddling a block boundary is held as a whole | Low | Disclosed (§8.3); splitting would alter loyalty semantics |
| R-7 | Authority follows platform-administrator status | Med | Runbook check; `DEC-GOV-007` |
| R-8 | Cross-store revocation window | Low | Same accepted window as redemption |
| R-9 | Retroactive billing of pre-account Rewards | Med | `commercial_effective_from` |
| R-10 | Repeat trial grants or large adjustments resembling complimentary arrangements (`DEC-SUB-013`) | Med | Audit-visible, reason-mandatory, prior grants surfaced; policy is the open decision |
| R-11 | Sole administrator can act unilaterally on money | Med | Mandatory reasons, immutable audit, change digest; SoD open |
| R-12 | Migration numbering depends on the unapplied `0019` deployment state | Low | Follows highest existing file; ordering is a WP-COM-10 item |
| R-13 | FK-bearing inserts must stay ahead of the account lock | Med | Rule (iii) and the §22.3 tests; code review checklist |
| R-15 | Bucket treatment drifting between admission and consumption | Med | `INV-CAP-PROV` (§8.5.1) with 15 required tests asserting per-Circle bucket; escalation clause if it cannot be met without a new commercial rule |
| R-16 | Circle-sequence ⇔ block-index mapping assumes today's single-current-Cycle model | Low | Holds by construction now (§8.5.1); a future loyalty change that breaks it fails closed on the unique key and must revisit provenance |
| R-14 | Tax basis and refund/void policy unspecified | Low | Nullable `tax_basis`; void is compensating |

## 30. Implementation work-package sequence (revised)

Dependency reasoning: the ledger must exist before anything posts to it; pricing before a settlement or consumption can snapshot it; consumption (which releases reservations) before the gate reserves; the Purchase-domain hold state and admission refactor before enforcement; enforcement touches the loyalty path so it comes after everything it depends on is proven.

| WP | Content | Depends on |
|---|---|---|
| **WP-COM-00** | Governance close-out: record FD-A–FD-D and this design in the Decision Register/agenda as appropriate; TRD17 governed rewrite for consumption-first; TRD10 §10.6.3 lifecycle-vocabulary note; implementation authorisation record | Founder authorisation |
| **WP-COM-01** | Domain foundation: migration `0021` (accounts, ledger, audit, standing events, immutability triggers), ledger primitives, authority seam, boundary and importer allow-list structural tests | 00 |
| **WP-COM-02** | Price schedules, settlements table, BI/RW market rules, `setPriceSchedule` | 01 |
| **WP-COM-03** | Manual administration commands #1–#11 with audit and idempotency | 01, 02 |
| **WP-COM-04** | Consumption projection (event + debit + release honouring the earmark), `rewards` index, failure table, reconciliation job (incl. earmark checks), lag metrics; tests 9–14 of §8.5.1 | 01, 02 |
| **WP-COM-05a** | Purchase domain: `pending_admission` status migration; extract `admitPurchaseToLoyalty`; verify order change; hold outcome; web/i18n status handling — behind gate mode `off` | 01 |
| **WP-COM-05b** | Commercial admission port, reservation entries, admissions and admission-blocks (earmark) tables, admission processor, tests 1–8 and 15 of §8.5.1, `reevaluatePendingAdmissions`, triggers; `shadow` then `enforce`; lock-order and concurrency tests | 03, 04, 05a |
| **WP-COM-06** | Standing and history read models (views + queries) | 01–04, 05b |
| **WP-COM-07** | Operator adapters | 03, 06 |
| **WP-COM-08** | Business read adapters and the two `commercial.view*` permissions | 06 |
| **WP-COM-09** | Signals, intents, queues, threshold config | 06 |
| **WP-COM-10** | Launch readiness: scheduler and alerting capability, data inputs (BIF/RWF prices), runbook, gate mode flip, migration ordering, rollback rehearsal | 05b, 09 |
| **WP-COM-11** | Experience assembly binding — **separate authorisation** under the Experience track | 07, 08 |

Critical path: 00 → 01 → 02 → 04 → 05b → 10; 05a parallelises after 01; 03 and 06–09 parallelise. **Recommended first implementation package: WP-COM-01 (Commercial domain foundation)** — additive, no change to any loyalty path, unblocks every other package, and lets the immutability triggers and boundary tests be proven before anything depends on them.

## 31. Acceptance criteria for implementation start

1. Separate Founder/Technical Lead implementation authorisation recorded.
2. Technical Lead confirms the design defaults in §27 and the `INV-CAP-PROV` test plan (§8.5.1), and agrees the escalation clause.
3. TRD17 governed-rewrite scope agreed (WP-COM-00).
4. No live loyalty data exists at commercial go-live (else a go-live baseline is required, §12(ii)).
5. `PB-013B P3-3` remains separately tracked (not a dependency).
6. Migration numbering confirmed against the deployment state of `0019`/`0020`.
7. Scheduler and alerting capability approach agreed before WP-COM-10 (not needed to begin WP-COM-01).
8. The BIF/RWF launch prices are needed only before pricing go-live; they do not gate WP-COM-01.

## 32. Explicit non-goals

No code, migration, test, config or dependency change; no payment-provider integration; no Operator Console or Business UI build; no Experience Assembly; no prototype change; no subscription tiers; no change to USD 2; no universal trial default; no lifetime trial cap; no negative-credit floor or maximum; no administrator RBAC or hierarchy; no change to `DEC-SUB-014`; no resolution of `DEC-SUB-013` or `DEC-GOV-007`; no broadening beyond Burundi and Rwanda; no alteration of the Cycle, Verified Unit or Reward lifecycles, thresholds, or redemption behaviour; no live FX; no complimentary-plan or tax policy; no expiry, cancel or reject semantics for pending admission.

---

## Appendix A — v1.0 → v1.1 (`CORR-001`) change register

| # | Area | v1.0 | v1.1 | Reason |
|---|---|---|---|---|
| 1 | FD-A | Open; net-of-commitments "recommended", gross alternative kept | Resolved; net of reservations is the design; gross alternative removed | Founder decision |
| 2 | FD-B | Open; redemption alternative kept | Resolved; consumption at Reward available only; redemption never drives billing | Founder decision |
| 3 | FD-C | Blocked start = verify refused, purchase left `waiting_for_customer` | Purchase preserved in explicit `pending_admission` state with ordering, processor, evidence | Founder decision; v1.0 breached "represent as commercially pending" |
| 4 | FD-D | Open; Manager saw more; single `commercial.view` | Owner/Manager/Staff/Participant matrix; two permissions; separate read models | Founder decision |
| 5 | Trial | One initial grant (`UNIQUE`); cumulative ≤ 5; adjustments capped | 3–5 per grant; no one-grant limit; no lifetime cap; later adjustments explicit, attributable, auditable, with **no governed aggregate ceiling and none encoded** (see CLOSE-001 change 1 for the wording correction of the v1.1 draft) | Founder clarification; v1.0 invented a cap |
| 6 | Currency | Admin-configured schedule with "Founder acknowledgement" and L-1 as a decision-like item | Decided direction; launch prices are an input, not a blocker | Founder direction |
| 7 | Foreign keys | Blanket "no FKs across the boundary" | Per-relation analysis with a safe-FK rule (§4.4) | Technical correction |
| 8 | Consumption reliability | Sweep + reconciliation asserted | Durable detection, retry, exactly-once, backfill, lag metrics, alerts, overstatement protection, "cannot be unbilled" argument | Technical correction |
| 9 | Gate coverage | "Verify is the single start point" | Full path enumeration P1–P10; one admission boundary at Verified Unit issuance; importer allow-list test | Technical correction |
| 10 | Reservation | Fungible counter, brief | Full lifecycle table; `commercial_admissions`; verify-order correction (cycle lock before account lock) | Technical correction |
| 11 | Standing | Two stored facts + derived table | Separate dimensions incl. admission holds and pending consumption; presentation-only label | Revisit after FD-A/FD-C |
| 12 | Operator binding | v1.0 matrix | Adds admission queue, multiple trial grants, BIF/RWF schedules, prototype 1–5 input | FD-A–D, trial, currency |
| 13 | Founder items | FD-A–D and L-1 open | None open; only pre-existing open items and a non-blocking launch input | Founder decisions |
| 14 | Work packages | WP-COM-00…11 | WP-COM-05 split into 05a (Purchase hold state and refactor) and 05b (admission/reservation/processor); first package named | Dependency analysis |

## Appendix B — `CORR-001-CLOSE-001` change register (v1.1 draft → v1.1 for merge review)

| # | Area | Before (`2bcaf85`) | After | Reason |
|---|---|---|---|---|
| 1 | Trial adjustments | "no upper bound"; described as unbounded in §9, §15, §20 and Appendix A | Explicit, attributable, auditable Platform Administrator act; **no governed aggregate ceiling, none encoded, and the absence is not an authorisation of unlimited adjustment**; integrity floor only (cannot lower below trial earmarked to admitted Circles or below zero); cumulative history shown informationally, never as a rule | Absence of a governed ceiling must not be converted into a positive rule |
| 2 | `pending_admission` wording | Illustrative UI sentences ("confirmed — being added to your card", "on hold — ask your manager", "processing") | Domain semantics only: received and preserved; not yet admitted to loyalty earning; no Verified Unit; no new Circle; credit pending admission. **All wording, composition and treatment governed at Experience Assembly by the adopted Experience Reference**; FD-D audience limits and "not invalid / not credited" constraints retained | No UI sentence may be canonised as Product Truth |
| 3 | Capacity bucket provenance | Fungible reserved count; bucket chosen at consumption (trial-first) — delay or reordering could retroactively re-label an admitted Circle | **`INV-CAP-PROV`**: bucket earmarked per Circle position at admission (`commercial_admission_blocks`, opaque `stream_ref`, `block_index ⇔ cycle.sequence_number`); consumption honours the earmark; split trial/paid reserved counters; flagged fallback; trial-adjust floor; transition analysis; 15 required tests asserting per-Circle bucket; escalation clause. **Shared-capacity availability model unchanged** | Determinism of trial/paid treatment under delayed consumption; no new Founder rule |
| 4 | Data model | Single `reserved_units` / `reserved_delta`; `unreserved` flag | `trial_reserved_units`, `paid_reserved_units`; ledger `trial_reserved_delta`/`paid_reserved_delta`; `commercial_admission_blocks`; consumption `earmark_id` (unique) and `bucket_source` | Supports change 3 |
| 5 | Work packages / acceptance | — | Tests 9–14 assigned to WP-COM-04, tests 1–8 and 15 to WP-COM-05b; Technical Lead confirms the test plan before implementation | Change 3 |
| 6 | Risks | R-1…R-14 | Adds R-15 (bucket drift, controlled by `INV-CAP-PROV`) and R-16 (sequence⇔index mapping assumption) | Change 3 |

---

**Disposition:** `11THONUS-COMMERCIAL-DESIGN-001 — READY FOR FOUNDER MERGE REVIEW`. Commercial design — not yet canonical until merged. FD-A / FD-B / FD-C / FD-D — RESOLVED. Commercial implementation — NOT STARTED. Experience Reference — UNCHANGED / FROZEN. Experience Assembly — NOT STARTED.
