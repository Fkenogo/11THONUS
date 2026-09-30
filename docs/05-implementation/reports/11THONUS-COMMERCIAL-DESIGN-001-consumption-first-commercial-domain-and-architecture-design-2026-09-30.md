> **Title:** 11THONUS-COMMERCIAL-DESIGN-001 — Consumption-First Commercial Domain & Architecture Design  
> **Version:** 1.0 · **Status:** Design assessment — awaiting Founder review · **Classification:** Working (governance/design record)  
> **Governing documents:** 11thONUS Platform Constitution; [Decision Register](../../00-governance/decisions/decision-register.md) (`DEC-SUB-014`); [`FD-COM-001` decision record](../../00-governance/decisions/evidence/FD-COM-001-core-commercial-model-founder-decision-2026-09-29.md); [`11THONUS-EXP-REF-001` binding assessment](11THONUS-EXP-REF-001-experience-reference-product-truth-binding-assessment-2026-09-29.md)  
> **Source-of-truth path:** `docs/05-implementation/reports/11THONUS-COMMERCIAL-DESIGN-001-consumption-first-commercial-domain-and-architecture-design-2026-09-30.md`  
> **Scope:** Architecture/design assessment only. No application code, test, configuration, migration, dependency, payment integration, Operator Console, prototype change or Experience Assembly was made or started. Nothing was deployed.

# 11THONUS-COMMERCIAL-DESIGN-001 — Consumption-First Commercial Domain & Architecture Design

## 0. Plain-language summary (for the Founder)

You asked how billing ("commercial") should be built around the loyalty engine without ever being able to change loyalty. In one page:

- **Commercial becomes its own, separate module** with its own tables. It *reads* facts the loyalty engine already records (for example "this Reward became available"). It never writes to loyalty tables. Loyalty never depends on Commercial to finish a transaction.
- **A commercial unit is used up when a Circle's 10-unit earning side is complete** — the moment the Reward becomes available. The engine already records that moment exactly once per Circle, so it is a natural, safe "billing event". *(One confirmation needed from you: this, versus "when the Reward is redeemed". See Founder decision FD-B.)*
- **Credit is kept as a running record, not a single number.** Every trial grant, payment, adjustment and used-up unit is a permanent line. The balance is the sum of the lines, and a stored total is kept beside it for speed. This gives a full audit trail, allows negative balances, and lets you replay any past moment.
- **The "may this Business start a new Circle?" check happens on the server**, at the one point where a customer's first units of a new Circle are verified. It reserves one unit of capacity per Circle started, so a 3-unit trial really does mean about 3 Circles, not unlimited. *(Needs your confirmation: FD-A.)*
- **Circles already in progress always finish.** If credit runs out mid-Circle, the Circle finishes and the balance dips below zero. It is recovered when credit is added. No floor and no ceiling on negativity is introduced.
- **Rewards are never touched by commercial standing.** Redemption code is not changed at all by this design.
- **You are the only administrator at launch**, and every commercial action you take is permanently recorded with who, what, which Business, when, why, and the reference (for example a bank or mobile-money reference).
- **The approved Operator Console experience is kept as the target.** Almost all of it needs new "read" plumbing and new commands, not a redesign.

Five items genuinely need you (§27): what "usable capacity" means (FD-A), when a unit is consumed (FD-B), what a customer experiences when a new start is blocked (FD-C), who inside a Business may see commercial standing (FD-D), and the launch local-currency prices (an input, not a decision). Everything else can proceed on the recommended defaults.

---

## 1. Executive conclusion

1. **Feasible, and fits the current architecture.** The commercial domain can be added as a new PostgreSQL-authoritative domain (`functions/src/domains/commercial/`) using the repository's existing conventions (numbered migrations from `0021`, `withPlatformTransaction`, the generic `idempotency_keys` table, `*.postgres.test.ts`). It requires **no change to any loyalty state transition** and **exactly one narrow hook** in the existing verify path (§8).
2. **Recommended ledger:** **Option D — append-only ledger as the authority + a materialised per-Business account row**, both updated in one transaction under a per-Business row lock (§6–§7).
3. **Consumption** is recorded by a **Commercial-owned, idempotent projection over the existing `rewards` fact** (one row per Loyalty Cycle, `UNIQUE (loyalty_cycle_id)`), never inside the loyalty transaction, so a commercial fault can never roll back or alter loyalty state (§5).
4. **The capacity gate** sits in `verifyPurchase` at the moment new earning would begin a Circle position; it reads and locks only the Business's commercial account row, taken **last** in the canonical lock order, so it introduces no lock inversion (§8, §22).
5. **Commercial standing** is derived, not stored, except for two admin-set facts: an administrative restriction and a paid-service activation (§11).
6. **Audit** is Commercial's own append-only table (TRD18 §18.49 shape) written in the same transaction as each mutation, with a read projection for the Operator Audit tab. Customer-facing Trust Events are not used for internal administration (§18).
7. **Three findings change how parts of the brief should be read** and are surfaced rather than smoothed over:
   - **F-1 — "Circle completion" is ambiguous in production.** The engine's own code states the Cycle is *not* complete when the Reward becomes available; only redemption ends it (`confirmRedemptionCommand.ts:53–62`). DEC-SUB-014 bills "the 10 qualifying-unit earning side". This design binds consumption to the earning side (Reward available) and asks the Founder to confirm (FD-B).
   - **F-2 — There are two places a Cycle reaches 10:** `verifyPurchase` and the forward allocation inside `confirmRedemption`. Anchoring consumption to the `rewards` row (not to either code path) handles both without touching redemption.
   - **F-3 — Business lifecycle status cannot carry commercial restriction.** `purchase.record` is only permitted in lifecycle `trial`/`active`, while `redemption.confirm` is permitted in `trial`/`active`/`suspended` (`purchasePermissionCatalogue.ts:51`, `redemptionPermissionCatalogue.ts:69`). Modelling commercial restriction as Business `suspended`/`expired` would block *all* purchase recording, which would strand active Circles and contradict grace. Commercial standing therefore must be a **separate axis**.
8. **Authority for commercial commands** follows the existing, Founder-approved precedent `FD-BUS-ACT-001` (`activateBusinessAfterVerification`): an active `platformAdministrators` record plus genuinely verified MFA, with **no role scoping and no new role or permission** (§15, §25). This invents no RBAC.
9. **Disposition:** design complete; **implementation not started and not authorised**. Four bounded Founder decisions and one launch data input are identified (§27); none blocks the foundation work packages.

## 2. Authority reviewed

| Authority | Use |
|---|---|
| `DEC-SUB-014` (CONFIRMED) and `FD-COM-001` record, incl. §14 scope boundary | Governing commercial Product Truth |
| `DEC-SUB-013` (OPEN_FOUNDER) | Not resolved; trial ≠ complimentary arrangement (§9, §10 guard-rails) |
| `DEC-GOV-007` (OPEN), `DEC-GOV-011` | No RBAC invented; SoD referenced not redefined |
| `DEC-LOY-011` (CONFIRMED), PRD06 §5, `DEC-LOY-002`, `DEC-LOY-004`, `DEC-LOY-008`, `DEC-LOY-018` | Reward preservation, single current Cycle, no reversal, redemption authority |
| TRD17 (SUPERSESSION-BOUND banner) | §17.10 retained record-keeping/non-recalculation read onto settlement records |
| TRD18 §18.49–18.50 | Administrative audit record shape and search fields |
| `11THONUS-EXP-REF-001` (incl. §19 addendum) | Experience Reference inventory, classification, prototype-only list |
| `FD-BUS-ACT-001` | Precedent for Platform-Administrator-authorised non-knowledge actions |
| Code and migrations `0001`–`0020` | Existing architecture trace (§3) |

### 2.1 Entry verification record

| Check | Result |
|---|---|
| Repository identity | `Fkenogo/11THONUS` (origin `https://github.com/Fkenogo/11THONUS`, from `.git/config`) |
| `origin/main` SHA | **`439f95e99590f0ef44e3955c6b5649d8c2542e83`** — matches the expected baseline. Verified by GitHub `list_commits` on `main` (tip = "Merge pull request #283 …", 2026-09-30T06:04:34Z) and by the local reflog (`checkout … to claude/epic-archimedes-b7hvnd` from `439f95e`) |
| PR #283 | **MERGED** (`merged_at` 2026-09-30T06:04:34Z, merge commit `439f95e`) |
| `DEC-SUB-014` canonical on `main` | Present in `decision-register.md`, `FD-COM-001` record (Status APPROVED, CONFIRMED), TRD17 banner, agenda, CDR-001, Master Workflow |
| Isolated workspace | This session's own fresh clone on branch `claude/epic-archimedes-b7hvnd` at `439f95e`. The contaminated primary checkout (`/Volumes/PRODUCTION/Projects/11THONUS`) is not accessible from this environment and was **not** used or modified |
| Adopted Experience Reference SHA `18e8d700f505beefe46d324f6ea33f20a670abe7` | **Verified.** Fetched by exact SHA from the public `Fkenogo/11thonus-prototype` repository (read-only, outside this working tree): the commit exists and is "Merge pull request #2 … feat/redemption-experience-reference-pass1". The commercial/Operator facts cited in §16, §17, §26 and §28 were then **re-read from that commit's source** (`src/types.ts`, `src/components/operator/OperatorConsole.tsx`, `src/context/AppContext.tsx`, `src/data/initialData.ts`). The prototype was not modified |
| Authority state differs materially? | No. Stop condition not triggered |

## 3. Existing architecture trace

### 3.1 Two data stores

Firestore owns identity, Business, membership, permissions, platform administrators and platform audit. PostgreSQL owns Reward Program, Purchase/Verification, Loyalty Cycle, Reward, Redemption, Trust Events, Notification Intents, idempotency. `business_id` and `customer_identity_id` are opaque `TEXT` in PostgreSQL. **There is no cross-store transaction.** Commercial state that must be atomic with loyalty facts (the capacity reservation) must therefore live in PostgreSQL.

### 3.2 Purchase → Verified Unit → Cycle (as implemented)

| Step | Where | Fact |
|---|---|---|
| Purchase recording | `recordPurchaseCommand.ts` (19-step contract) | Purchase row `waiting_for_customer`; authorisation needs Business lifecycle `trial`/`active` (`purchasePermissionCatalogue.ts:51`) |
| Customer verification | `verifyPurchaseCommand.ts:93–470` | **Customer-driven.** One transaction; lock order idempotency → purchase → stream → cycle → reward → appends |
| Verified Unit | `verifyPurchaseCommand.ts:179` | One credit per Purchase (`verified_units_one_credit_per_purchase`); `entry_type` already allows `'reversal'` (no writer yet) |
| Stream lock | `loyaltyCycleRepository.ts:63` `ensureAndLockCycleStream` | Per (Business, Customer, Program); owns the cycle sequence counter |
| Cycle start | `verifyPurchaseCommand.ts:197–209` | `lockCurrentCycle`; if none, `openCycleUnderStreamLock` |
| Allocation | `verifyPurchaseCommand.ts:239–297` | Up to capacity 10 into the single current Cycle; overflow becomes **pending** positions (`loyalty_cycle_id NULL`) |
| Threshold | `verifyPurchaseCommand.ts:299–318` | At exactly 10: `insertRewardForCycle` (`rewards_one_per_cycle`) then `markCycleRewardAvailable` |
| Redemption | `confirmRedemptionCommand.ts:142–611` | Lock order idempotency → stream → cycle → reward; `reward_available → reward_redeemed` (`:321`); opens next Cycle **empty or with forward-allocated pending units** (`:357–371`); forward allocation can itself hit 10 and create the next Reward (`:408–425`) |
| Cycle states | `0010_loyalty_cycles.sql` | `active`, `reward_available`, `reward_redeemed`, `closed`; one current per customer+program (`loyalty_cycles_one_current_per_customer_program`) |
| Immutable facts | migrations | `allocated_units` only increases; no reversal path decrements it (`loyaltyCycleRepository.ts:214–220`); `rewards.state` schema allows `cancelled`/`expired` but nothing writes them |

### 3.3 Locking (canonical, must not be inverted)

`idempotency → purchase → stream → cycle → reward → appends`. CORR-002 removed a real `40P01` deadlock caused by a lock-order inversion via foreign-key key-share locks (`confirmRedemptionCommand.ts:37–46`, `loyaltyCycleRepository.ts:453–461`). **This design treats FK key-share locks as locks.**

### 3.4 Commercial remnants (all inert)

- `Business.subscriptionId?` (`business.ts:52`) — never written by commands; deliberately excluded from the profile whitelist (`businessProfileCommand.ts:37–52`, `index.ts:753–756`).
- Error code `SUBSCRIPTION_LIMIT_REACHED` (`errorCategories.ts:14`, `index.ts:207`) — declared, never thrown.
- Business lifecycle `trial`/`expired` (`businessStatus.ts:32–54`); `trial → active` and `→ expired` "system-initiated, gated on subscription validity" were **never implemented** (`businessLifecycleCommand.ts:16–18`). Businesses activated via `FD-BUS-ACT-001` sit in `trial` indefinitely and can still record purchases.
- `Business.countryCode` / `currencyCode` (`business.ts:42–43`) — the Business's *own trading* currency, free-form and mutable through the profile command.

### 3.5 Trust Events, intents, audit, authority

- `trust_events` (`0013`): customer-facing commercial-trust evidence, **purchase-anchored** (`causal_purchase_record_id`), closed `event_type` CHECK; widened by `0020` for redemption. Not a general audit log.
- `notification_intents` (`0014`, widened `0020`): closed `intent_type` CHECK, purchase- or redemption-anchored, `status = 'pending'` CHECK (no delivery worker exists).
- `platformAdministrationAuditRecords` (Firestore): **write-only**, closed `actionType` vocabulary, fixed `targetType: "platform_administrator"` (`platformAdministrationAuditRecord.ts:16–36`). Header explicitly says it is a narrow Knowledge-Studio-scoped writer, not a generic audit domain.
- Platform administration is **knowledge-only**: two roles (`platformAdministratorRole.ts:23`), seven `knowledge.*` permissions, structural test forbidding import coupling with `business`/`permissions` (`frameworkBoundary.test.ts`).
- Existing precedent for non-knowledge platform authority: `activateBusinessAfterVerification` (`businessActivationCommand.ts:16–52, 132–143`): active `platformAdministrators` record + `verifiedMfaSatisfied`, no role scoping, audited through the domain's own event (no platform-audit vocabulary change).
- TRD18 §18.49 already specifies an `AdministrativeAuditRecord` shape (actor, role, target, business, reason code/text, before/after snapshots, correlation, time) and §18.50 audit search fields; `platformAdministrationAuditRecord.ts` classes the field list as an engineering choice, not a governed schema.

### 3.6 Reusable primitives

`idempotency_keys` + `checkAndReserveIdempotencyKey`/`peekIdempotencyKey`/`completeIdempotencyKeyInTransaction`; `withPlatformTransaction`; `platformAdministrators` record + `deriveVerifiedMfaSatisfied`; TRD18 §18.49 shape; the `notification_intents` intent-vs-delivery pattern; `purchase_outbox` pattern; migration runner with `.down.sql` convention; `*.postgres.test.ts` harness.

### 3.7 What does not exist

Any commercial table, ledger, balance, trial, price, settlement, standing, capacity check, Operator surface, audit *read* function, or non-knowledge platform permission catalogue.

## 4. Commercial domain boundary

### 4.1 What Commercial owns

Commercial accounts, ledger, trial grants, settlements, manual adjustments, price schedules, consumption records, administrative restriction/activation state, standing derivation, commercial audit, commercial signals.

### 4.2 Ownership and dependency direction

| Domain | Owns | Commercial's relationship |
|---|---|---|
| Purchase | Purchase Records, lifecycle | Commercial does not read or write. Purchase *calls* one narrow gate port at verify |
| Verified Unit | Credits (and future reversals) | Read-only fact for block arithmetic (passed in by Purchase, not queried by Commercial) |
| Loyalty Cycle | Cycle state, allocation, threshold | Read-only fact source (`rewards`, `loyalty_cycles`) |
| Reward | Reward entitlement | **Consumption source fact** (read-only) |
| Redemption | Redemption evidence | **No dependency.** `confirmRedemption` is unchanged |
| Customer Identity | Identity | None. Commercial stores **no customer identity** (privacy, §25) |
| Organisation/Business | Business lifecycle, country, currency | Commercial reads `countryCode` only at account opening to seed a settlement market; never writes `Business.status` |
| Notifications | Intent/delivery | Commercial has its own intents table (§19) |
| Platform Administration | Administrator identity | Commercial uses the *authority check* only |

```
Purchase/Loyalty ──(calls, one port)──▶ CommercialGate (read commercial account; write reservation)
      │  ▲                                        ▲
      │  └── never written by Commercial          │ Commercial writes only commercial_* tables
      ▼                                           │
  rewards (fact, immutable) ──(read-only)──▶ Consumption projection ──▶ commercial ledger
```

Rules: (1) Commercial never imports Purchase/Loyalty *write* repositories (structural test, mirroring `frameworkBoundary.test.ts`). (2) Purchase depends on a **port** (`NewCircleStartGate`) defined on the Purchase side and bound at the composition root. (3) **No foreign keys cross the boundary in either direction** — cross-domain references are opaque UUIDs, exactly as `business_id` is opaque. This is deliberate: an FK from a commercial insert to a `loyalty_cycles` row takes a key-share lock that conflicts with the verify path's `FOR UPDATE` and recreates the CORR-002 deadlock class. Integrity is proven by deriving ids from the loyalty tables themselves plus a reconciliation query (§21).

### 4.3 The one veto

Commercial is allowed exactly one effect on loyalty: **refusing to let a new Circle position begin** (DEC-SUB-014 §4). It cannot create, cancel, modify or re-interpret any loyalty row.

## 5. Consumption-event design

### 5.1 Which transition is authoritative

Candidates: (a) threshold crossing — `rewards` row inserted and Cycle `active → reward_available`; (b) `reward_redeemed`.

**Recommendation (a).** DEC-SUB-014 §2 bills "the governed 10 qualifying-unit earning side of the 10+1 Circle" and §2.1 says commercial uses "completion/consumption of the governed earning unit". The earning side is complete at the threshold. Billing at redemption would make revenue depend on whether a Business chooses to confirm a redemption, and would let an unredeemed Reward leave a completed earning side unbilled. The Cycle-lifecycle text ("cycle not complete until redeemed", `confirmRedemptionCommand.ts:53–62`) is about the *loyalty* slot being free, not about the billable unit.

This is a genuine wording ambiguity ("completed 10+1 Circle") → **FD-B** (§27). The design isolates the choice to a single projection query (§5.3), so either answer is a small change, not a redesign.

### 5.2 Source fact and exactly-once

- **Source fact:** the `rewards` row. It already exists exactly once per Cycle (`rewards_one_per_cycle`), in the same transaction as the threshold flip, from **both** code paths (verify and redemption forward-allocation). Consumption therefore covers both without modifying either.
- **Idempotency key:** `source_loyalty_cycle_id`. Enforced at three layers: `UNIQUE (source_loyalty_cycle_id)` on `commercial_consumption_events`; a ledger `idempotency_scope_key = 'consume:<cycle_id>'` unique; and the projection's anti-join (§5.3).
- **Rows that count:** rewards in state `available` or `redeemed`. State `cancelled`/`expired` (schema-permitted, unwritten) do not create consumption.

### 5.3 Mechanism: Commercial-owned projection, not a hook

Options considered:

| Option | Verdict |
|---|---|
| Loyalty transaction calls `recordConsumption` inline | **Rejected.** A commercial fault would roll back the Reward — commercial authoritative over loyalty |
| Consume from `purchase_outbox`/Trust Events | **Rejected as sole source.** Outbox is Purchase-Record-scoped and redemption forward-allocation has no Purchase Record (`0020` note); Trust Events are a closed evidence set |
| **Idempotent anti-join projection over `rewards`** | **Recommended.** Self-healing, no loyalty code change, exactly-once by unique key |

Projection (logical): for each `rewards` row in `available`/`redeemed` whose `available_at ≥ account.commercial_effective_from` and for which no `commercial_consumption_events` row exists, in one transaction: lock the commercial account row, insert the consumption event, insert the ledger debit, release one reservation, update the account, write an audit event (`actor = system:commercial-projection`). Triggered (i) best-effort right after the verify/redemption callable returns and (ii) by a scheduled sweep. **Lag is harmless to the gate**, because capacity was reserved at start (§8): when consumption lands, balance and reservation fall together and available capacity is unchanged.

`commercial_effective_from` (set at account opening) prevents retroactive billing of Circles completed before the Business was commercially established.

### 5.4 Answers to the brief's questions

| Question | Answer |
|---|---|
| Derived from Circle completion? | Derived from the Reward-available fact of the earning side (FD-B to confirm) |
| Authoritative transition | `active → reward_available` evidenced by the `rewards` row |
| Subscribe or record after? | Commercial **records after**, by projection over the committed fact |
| Exactly-once | Unique `source_loyalty_cycle_id` + unique ledger scope key + anti-join; safe under concurrent projectors (second insert conflicts, does nothing) |
| Idempotency key | `loyalty_cycle_id` |
| Loyalty transaction rollback | No `rewards` row exists → nothing to project → no consumption. Automatic and correct |
| Can consumption be reversed? | Not today (no loyalty reversal exists; DEC-LOY-004). Structurally supported by a **compensating** ledger entry type, never by deleting or updating |
| Future loyalty correction/reversal | `verified_units.entry_type='reversal'` and `rewards.state='cancelled'` already exist unused. If a future governed correction *cancels a Reward whose Circle was consumed*, Commercial adds one `consumption_reversal` entry (unique per consumption event) restoring one unit. Whether a reversal refunds capacity is a **future Founder policy**; the ledger permits either without schema change |
| Loyalty lifecycle altered? | **No** |

## 6. Ledger / account options

Scoring: ●●● strong · ●● adequate · ● weak.

| Criterion | A. Mutable balance | B. Append-only, derived | C. Credit lots | **D. Ledger + materialised account** | E. Event-sourced streams |
|---|---|---|---|---|---|
| Auditability | ● overwritten | ●●● | ●●● | ●●● | ●●● |
| Concurrency | ●● row lock | ●● needs sum under lock | ●● lot locks | ●●● one row lock, O(1) read | ● heavy |
| Idempotency | ● | ●●● unique keys | ●●● | ●●● | ●●● |
| Historical reconstruction | ● | ●●● | ●●● | ●●● | ●●● |
| Manual administration | ●● | ●●● | ●● lot selection burden | ●●● | ●● |
| Trial grants | ●● | ●●● | ●●● | ●●● (bucket) | ●●● |
| Paid credit | ●● | ●●● | ●●● | ●●● | ●●● |
| Negative credit | ●●● | ●●● | ● negative lots awkward | ●●● | ●●● |
| Pricing history | ● | ●● | ●●● per-lot price | ●●● (snapshots) | ●●● |
| Future payment integration | ●● | ●●● | ●●● | ●●● | ●●● |
| Local-currency settlement | ●● | ●●● | ●●● | ●●● | ●●● |
| Operational simplicity | ●●● | ●●● | ● | ●● | ● |
| Fit with existing PostgreSQL | ●●● | ●●● | ●● | ●●● | ● new paradigm |

**Why not the others.** A cannot reconstruct history or prove who changed a balance. B is correct but makes the gate sum the ledger under a lock on every check. C adds FIFO lot allocation and negative-lot handling that no governed rule needs (the price is flat); its one real benefit — tracing a consumed unit to the payment that funded it — is available in D by `source_settlement_id` on credit entries without lot mechanics. E is a new architectural paradigm with no precedent in this repository. The prototype's displayed balance is **not** treated as domain evidence.

## 7. Recommended ledger architecture (Option D)

- **`commercial_ledger_entries`** — append-only, **authoritative**. Every change to balance or reservation is a row.
- **`commercial_accounts`** — one mutable row per Business holding materialised counters and the two admin-set facts. It is a *cache of the ledger plus two stored flags*, updated only in the same transaction as the ledger append and only while holding its own row lock.
- **Two counters, kept separate on purpose** (brief item 8):
  - **Accounting balance** = `trial_remaining_units + paid_balance_units`. May be negative. No floor, no ceiling.
  - **Reserved units** = capacity committed to Circles that have begun but are not yet consumed. Never negative.
  - **Available capacity** = accounting balance − reserved units.
- **Two funding buckets:** `trial` and `paid`. Consumption draws `trial` while `trial_remaining > 0`, then `paid` (design assumption A-1; the trial-first order must be confirmed by the Technical Lead — it only affects labelling). `trial_remaining` cannot go below zero; **negative credit lives only on the `paid` bucket.**
- **Invariants (testable, and monitored by reconciliation, §21):** I-1 `account counters = Σ ledger deltas`; I-2 one consumption event ⇔ one debit entry; I-3 ledger and audit rows are never updated or deleted (enforced by `BEFORE UPDATE OR DELETE` triggers that raise — a *new* enforcement style beyond the repository's "absence of an updater" precedent, justified because these rows are money-affecting); I-4 `reserved_units ≥ 0`; **no CHECK on `paid_balance_units` sign** (negative is governed).
- **Entry types:** `trial_grant`, `trial_adjustment`, `credit_grant` (from a confirmed settlement), `credit_adjustment`, `capacity_reserved`, `consumption`, `consumption_reversal` (defined, unused now), `settlement_void_reversal`.
- **Concurrency:** one row lock per Business (§22). **Idempotency:** unique `idempotency_scope_key` per entry (§23). **Reconstruction:** replay entries ordered by `(occurred_at, id)`; each entry stores `trial_after`/`paid_after`/`reserved_after` for point-in-time reads without replay.

## 8. Capacity-gate design

### 8.1 Where it belongs — the exact start path

A Circle can begin in two existing places: `openCycleUnderStreamLock` in verify (`verifyPurchaseCommand.ts:201–209`), and the same call in `confirmRedemption` (`:365`). **Only the verify path is gated.**

Reason: the redemption path opens the next Cycle *empty* (or forward-allocates units the Customer already earned). Gating it would block or degrade redemption, violating `DEC-LOY-011`, PRD06 §5 and DEC-SUB-014 §7. And Verified Units are only ever *added* in verify (redemption moves them, it does not create them), so **verify is the single place where new commercial exposure is created.**

### 8.2 What "a new start" means, precisely

Using the stream's total Verified Units `U` (locked stream ⇒ consistent), a verification adding `q` units starts
`newBlocks = ceil((U+q)/10) − ceil(U/10)` new Circle positions. This counts allocated and pending earning uniformly, so a customer with an unredeemed Reward cannot use pending units to start further Circles for free (a leak a "cycle opened" test would miss). Purchase passes `{businessId, unitsBefore, quantity}` (loyalty facts) to the gate; Commercial applies the loyalty threshold constant read-only and never redefines it.

### 8.3 Behaviour

Inside the verify transaction, after the stream and cycle locks and before any inserts, **only when `newBlocks > 0`**:

1. `SELECT … FROM commercial_accounts WHERE business_id = $1 FOR UPDATE` (last lock, §22).
2. Refuse when: no account (not commercially established), `service_restriction = 'restricted'`, or `available_capacity < newBlocks`. Refusal throws a governed error (new code `COMMERCIAL_CAPACITY_UNAVAILABLE`; the dormant `SUBSCRIPTION_LIMIT_REACHED` must not be reused — it names a superseded model). The whole verify transaction rolls back: the Purchase stays `waiting_for_customer`, no unit is issued.
3. Otherwise append `capacity_reserved(+newBlocks)` (`scope_key = 'reserve:<verified_unit_id>'`), update the account, continue.

Not-a-start verifications (`newBlocks = 0`) take **no commercial lock at all**, so ordinary earning inside a started Circle is untouched and un-serialised.

### 8.4 Race handling

Two customers of one Business verifying concurrently serialise on the account row; the second sees the first's reservation and is refused when capacity is gone. There is no over-start and no dependence on projection lag.

### 8.5 Trial, paid, zero, negative, grace

| Situation | Behaviour |
|---|---|
| Trial funded | Available = trial + paid − reserved; a 3-unit trial permits three in-flight/completed Circles |
| Paid funded | Same formula |
| Zero available | New starts refused; in-flight Circles continue |
| Negative balance | Available < 0 ⇒ refused. Recovered only when credit brings available to ≥ `newBlocks` |
| **Grace** | An already-started Circle **holds its reservation**, so finishing it needs no gate call and cannot be refused. It completes; consumption debits; the balance may go negative if credit was reduced meanwhile. Grace creates **no** capacity for new starts because new starts are decided on `available`, which the reservation already reduced |
| Administrative restriction | Refuses new starts regardless of capacity; in-flight Circles and all redemptions unaffected |

Not client-authoritative: the client cannot supply, skip or influence the gate; the decision is server-side inside the transaction.

### 8.6 Record-time advisory check

`recordPurchase` may perform a **non-locking** read to give the Business immediate feedback when the Customer would start a new Circle and capacity is unavailable. It is advisory only; the verify-time gate is authoritative. This avoids the sad path of a sold item whose loyalty verification is later refused.

### 8.7 Interpretation and customer-treatment choices (Founder items)

- **"Usable capacity"** is read as *net of commitments* (recommended). The literal alternative — gross balance > 0 — lets a Business with balance 1 start unlimited Circles that all finish into negative credit, making a "3-unit trial" unbounded. Both readings are consistent with the wording, so the ledger supports both: the gate is a pure function of `(balance, reserved)`; the gross reading is `reserved := 0`. → **FD-A**.
- **Customer treatment when a start is blocked.** Baseline = refuse verification, Purchase remains unverified (no loyalty state changes). Accepting the units as `pending` until capacity returns would change loyalty semantics (an empty current Cycle plus pending units cannot occur today) and is therefore **not** designed here. → **FD-C**.

### 8.8 Rollout safety

The gate supports three modes by configuration (`off` / `shadow` = evaluate and record would-block without refusing / `enforce`). Existing purchase tests assume no commercial account, so `off` is the default until launch. Config is not changed by this design.

## 9. Trial design

- **Table `commercial_trial_grants`**: `units INTEGER CHECK (units BETWEEN 3 AND 5)`, `granted_by`, `granted_at`, `reason_code`, `reason_text`, `reference`, `ledger_entry_id`. **No default value anywhere** — the command requires `units` explicitly, and the UI must not pre-fill 5.
- **One initial grant per Business** (`UNIQUE (business_id)` on the initial-grant row). Trial is **not a subscription tier and not a state machine**: it is a ledger bucket plus a grant record. Whether a Business "is on trial" is derived (§11).
- **Remaining / consumption / exhaustion:** `trial_remaining_units` (materialised) falls by one per consumption while > 0. Exhaustion is simply `trial_remaining = 0`; no separate state.
- **Bounded adjustment** (DEC-SUB-014 §8.2): `adjustTrial(±n, reason)`; invariant *cumulative trial units granted for a Business never exceed 5 and `trial_remaining` never goes below 0*. Extending beyond 5 is not authorised by trial rules; additional capacity is added as **paid credit** with a confirmed settlement. (Design assumption A-2 — conservative; no Founder decision is needed to proceed.)
- **No time-based expiry** is modelled (none governed; TRD17 trial durations are superseded). If wanted, it is a new Founder decision.
- **Guard-rails:** no "complimentary/pilot/partner/promotional" reason code exists (§10.3) so the trial path cannot become a back door for `DEC-SUB-013`, which remains OPEN.
- **Business lifecycle:** `FD-BUS-ACT-001` moves a Business to lifecycle `trial`; that does **not** create a trial allowance. The grant is a separate explicit, audited command (a composed Operator "onboard" action may run both).

## 10. Paid-credit / manual activation design

### 10.1 Two-step settlement so future payment integration reuses the same commands

1. `recordSettlement` — creates a `commercial_settlements` row in status `recorded` (offline/manual reference; no credit yet). Doubles as the "manual payment awaiting action" queue.
2. `confirmSettlement` — after appropriate commercial confirmation, status `confirmed` and, **in the same transaction**, appends a `credit_grant` ledger entry referencing the settlement.
3. `activatePaidService` — sets `paid_service_activated_at` once; **invariant: at least one confirmed settlement exists**.

A future provider integration calls `recordSettlement` with `source = 'provider'`, a provider event id (unique, giving replay protection) and then `confirmSettlement`. It never touches the ledger directly, so it cannot bypass invariants or audit. Provider columns are reserved as nullable; no integration is built.

### 10.2 Units versus money

The operator states `units_purchased` and the recorded local `amount_minor`/`currency`. The system stores the price schedule id in force and the **expected** amount, and records any **variance** without blocking (a mandatory reason is required when non-zero). No tolerance rule is invented.

### 10.3 Credit that is not backed by a settlement

Positive credit with no confirmed settlement is only permitted through `adjustCommercialCredit` with a `reason_code` from a **closed operational vocabulary** (`correction`, `settlement_reconciliation`, `dispute_resolution`, `error_reversal`). There is deliberately **no** code for complimentary, pilot, partner or promotional credit — that is `DEC-SUB-013` (OPEN_FOUNDER) and is not decided here. The vocabulary is operational data (reviewable by the Technical Lead), not Product Truth.

### 10.4 Correction of a mistaken settlement

`voidSettlement` marks a settlement `voided` (status transition, no deletion) and appends a compensating `settlement_void_reversal` entry. If credit had already been consumed the paid balance goes negative — a governed, recoverable outcome.

## 11. Commercial-standing model

Only **two** standing facts are authoritative and stored on `commercial_accounts`:

1. `service_restriction` ∈ {`none`, `restricted`} — set by explicit administrator commands with a reason.
2. `paid_service_activated_at` — set once by `activatePaidService`.

Everything else is **derived** from ledger counters:

| Dimension | Derivation |
|---|---|
| Established | account row exists |
| Funding | `paid` if activated; `trial` if `trial_remaining > 0` and not activated; `none` otherwise |
| Capacity | `available ≥ 1` ⇒ available, else exhausted |
| Balance sign | `paid_balance < 0` ⇒ negative |
| Grace | `reserved_units > 0` while capacity is exhausted or restricted |
| New-start eligibility | established ∧ not restricted ∧ available ≥ 1 |

Prototype labels are **experience labels over these dimensions**, not domain states. The adopted `CommercialStanding` union is `trial | paid_active | grace | restricted | suspended` (and the prototype's separate `BusinessStatus` adds `onboarding`; both are self-labelled prototype-only in `types.ts`). Mapping: *onboarding* = not established; *trial* = funding trial with capacity available; *paid_active* = funding paid with capacity available; *grace* = capacity exhausted (the prototype shows it whenever trial and credit reach zero, `AppContext.tsx:1422, 1462`) — the derived model additionally distinguishes whether Circles are actually in flight (grace flag), which lets the notice say "active Circles will finish" only when true; *restricted* = `service_restriction = restricted` (or exhausted, with different wording); *suspended* — see below. The prototype's `restrictBusiness`/`restoreBusiness` (each with a mandatory reason; restore recomputes standing from balances) map directly to commands #8/#9 and to derived standing.

**"Suspended" is not a commercial state.** It is the Business lifecycle status (Firestore) and has different consequences (blocks purchase recording). A commercial "suspension for non-payment" that stops earning entirely would contradict grace and is not authorised. The experience must label commercial restriction as "new Circle starts paused", not "suspended".

**Do not drive `Business.status`** (`trial`/`active`/`expired`) from commercial standing (F-3). Doing so would make Firestore lifecycle depend on a PostgreSQL commercial fact with no shared transaction, and would risk blocking purchase recording. The unused `trial → active`/`→ expired` transitions should be documented as not commercially driven (a documentation follow-up on TRD10 §10.6.3, not a Founder decision).

## 12. Negative-credit model

- **How it occurs:** (i) a downward `credit_adjustment` or a `settlement_void_reversal` while Circles are in flight; (ii) consumption of a Circle that had no reservation (created before the account's `commercial_effective_from`, or in `off`/`shadow` mode); (iii) future correction-driven adjustments. Grace guarantees started Circles finish, so consumption always proceeds.
- **How it recovers:** any later `credit_grant` or positive adjustment; nothing else is required. History is never rewritten.
- **No floor, no maximum:** no CHECK, trigger or command limits `paid_balance_units` below zero. A future limit would be a new Founder decision and, by design, would be one additional predicate in the gate function, not a schema change.
- **Not unlimited new starts:** new starts are decided on **available capacity** (balance − reserved), which is negative whenever balance is negative. Negative accounting balance therefore blocks new starts until recovered, while never affecting Circles already started.

## 13. Pricing provenance

`USD 2` is a governed constant (`unit_price_usd_minor = 200`), validated by the command layer on every price-schedule write (not a database CHECK, so a future Founder change is a controlled code+decision change rather than a migration).

| Record | Carries |
|---|---|
| `commercial_price_schedules` (append-only, effective-dated) | market, currency, `usd_equivalent_minor`, `local_unit_price_minor`, `rate_reference`, `rounding_rule`, `effective_from`, `created_by`, `reason` |
| Consumption event | `price_schedule_id` + immutable snapshots `unit_price_usd_minor`, `local_currency`, `local_unit_price_minor` **as at consumption** |
| Settlement | `price_schedule_id` + snapshots of expected and actual local amount, currency, units, `tax_basis` (nullable; no tax logic invented) |
| Ledger entry (credit) | references the settlement, therefore its price |

**Combination** — schedule reference plus snapshots — is required: the reference gives provenance; the snapshots make history immune to any later data repair. Price schedule rows are never updated; a correction is a new row with a later `effective_from` and a reason. TRD17 §17.10's non-recalculation requirement is satisfied by construction.

## 14. Local-currency options and recommendation

| Option | Determinism | Auditability | Manual-launch fit | Future automation | Verdict |
|---|---|---|---|---|---|
| **Administrator-configured, effective-dated schedule (fixed local unit price per market)** | ●●● | ●●● | ●●● | ●● (an automated job can *propose* rows) | **Recommended** |
| Effective-dated platform FX rate table, local price derived at read time | ●● | ●● | ●● | ●●● | Viable later; adds a rate feed and a derivation rule |
| Settlement-time FX | ● not reproducible | ● | ● needs a feed | ●●● | Rejected (TRD17 note: prefer deterministic over live FX) |

**Recommended design.** For each launch market (`BI` → BIF, `RW` → RWF) an append-only schedule row holds the **fixed local unit price** the administrator has set to represent USD 2, the informational `rate_reference` used to derive it, and `effective_from`. BIF and RWF have no minor unit, so amounts are whole integers; the rounding rule is applied **once, when the schedule row is created**, never at settlement or consumption. All settlements and consumption events snapshot the row in force, so historical reconstruction is exact and independent of any later change. Future automation (an FX job) would insert *proposed* rows that the administrator approves — the same table, no new architecture.

**Business ↔ market.** `commercial_accounts.settlement_market` (`BI`/`RW`) is set at account opening, seeded from `Business.countryCode` at that instant and then **frozen** (Business `countryCode`/`currencyCode` are mutable via the profile command and describe the Business's own trading currency, a different thing). Account opening for any other country is refused — launch scope is not broadened.

**What this does not decide (Founder input, not a design choice):** the **initial BIF and RWF local unit prices** and who reviews them and when. These are launch operational inputs (§27, L-1). The mechanism above works with any values.

## 15. Manual administration commands

**Common authority (all mutating commands):** the caller is an **active `platformAdministrators` record with genuinely verified MFA** — the exact `FD-BUS-ACT-001` gate (`isAuthorizedPlatformAdministrator`, `businessActivationCommand.ts:132–143`), with a single enumeration-resistant denial. **No role check, no new role, no new permission, no per-administrator override.** All commands also enforce the DEC-SUB-014 §8.1 non-authorisation boundary structurally: the commercial module has no import path to loyalty write functions. Idempotency: a client-supplied `idempotencyKey` (as `confirmRedemption` does) reserved in `idempotency_keys` inside the same transaction. Every command appends exactly one `commercial_audit_events` row in that transaction.

| # | Command | Input | Invariants | Idempotency / natural key | Reason/reference | Audit event | Effect |
|---|---|---|---|---|---|---|---|
| 1 | `openCommercialAccount` (implicit in #2/#4 if absent) | `businessId` | Market ∈ {BI, RW}; Business exists (Firestore read) | `UNIQUE(business_id)` | reason code | `account_opened` | Creates account, sets `commercial_effective_from`, `settlement_market` |
| 2 | `grantTrial` | `businessId`, `units` (**required, 3–5**) | No initial grant yet; account exists | `UNIQUE(business_id)` on initial grant + key | reason, reference | `trial_granted` | +trial ledger entry |
| 3 | `adjustTrial` | `businessId`, `delta`, `reason` | Cumulative granted ≤ 5; `trial_remaining ≥ 0` | key | reason mandatory | `trial_adjusted` | ± trial entry |
| 4 | `recordSettlement` | `businessId`, method, `externalReference`, amount, currency, `unitsPurchased`, `receivedAt` | Currency matches account market; `UNIQUE(method, external_reference)` blocks payment replay | key + natural key | reference mandatory | `settlement_recorded` | Settlement `recorded`; no credit |
| 5 | `confirmSettlement` | `settlementId` | Status `recorded`; variance ⇒ reason | key; second confirm is a no-op duplicate | confirmation note | `settlement_confirmed` | Status `confirmed` + `credit_grant` entry |
| 6 | `adjustCommercialCredit` | `businessId`, `delta` (nonzero), `reasonCode` from closed set | Positive unsettled credit only with permitted codes (§10.3); may make paid balance negative | key | reason + reference | `credit_adjusted` | ± paid entry |
| 7 | `activatePaidService` | `businessId` | ≥ 1 confirmed settlement; not already activated | key; set-once | reason | `paid_service_activated` | Sets `paid_service_activated_at` |
| 8 | `restrictNewStarts` | `businessId`, reason | Account exists | key; idempotent when already restricted | reason mandatory | `service_restricted` | `service_restriction = restricted`; affects new starts only |
| 9 | `restoreCommercialStanding` | `businessId`, reason | Currently restricted | key | reason mandatory | `service_restored` | `service_restriction = none` |
| 10 | `voidSettlement` | `settlementId`, reason | Not already voided | key | reason mandatory | `settlement_voided` | `voided` + reversal entry |
| 11 | `setPriceSchedule` | market, `localUnitPriceMinor`, `effectiveFrom`, `rateReference`, reason | USD equivalent = 200; `effective_from` not before latest row; `UNIQUE(market, effective_from)` | key | reason + rate reference | `price_schedule_set` | New schedule row |
| 12 | Reads: inspect standing / history / audit / queues | `businessId` or filters | Same authority gate (read) | n/a | n/a | optional coalesced `history_inspected` for Business-360 and audit search only | No effect |

`setPriceSchedule` is a Platform-configuration act not listed among DEC-SUB-014 §8's eight capabilities; it is class "already-authorised platform configuration" in EXP-REF-001 §19.4-A, but it changes a *governed price's* local expression, so the Founder should explicitly acknowledge it (§27, L-1).

There is **no dual control** command: with a sole administrator it is impossible, and SoD specifics beyond `DEC-GOV-011` remain the open Product Truth gap already recorded. Compensating controls that need no new authority: mandatory reason on every mutation, immutable audit, and a read-only "recent commercial changes" digest (§19).

## 16. Operator Console binding matrix

Class: DB direct bind · AN assembly needed · AD adapter needed · AU authorised-but-unimplemented · TG truth gap · PO prototype-only. Disposition: REUSE / REFINE / REPLACE / DEFER. The adopted seven tabs are the target; none is redesigned.

| Tab | Existing data | Missing read model | Required adapter | Command surface | Prototype-only | Unresolved truth | Class | Disp. |
|---|---|---|---|---|---|---|---|---|
| **Operations** | Firestore Business lifecycle; `commercial_settlements` (recorded) | Cross-tenant onboarding/awaiting-action queue | `operator.listQueues` over Firestore business read + commercial queue view | None beyond the commercial commands it deep-links | Scenario A–F buttons | Which non-commercial queue items exist (support, integrity) | AD + AU | REFINE |
| **Businesses** (Business 360) | Firestore Business/membership; `commercial_accounts` | Cross-tenant Business aggregate incl. commercial summary | `operator.getBusiness360` | Deep-links to #1–#10 | Persona/role switcher | Cross-tenant read governance beyond sole-admin launch (`DEC-GOV-007`) | AD | REFINE |
| **Commercial** | none | Standing, ledger history, settlements queue, trial/credit/capacity view | `operator.getCommercialStanding`, `getCommercialHistory` | #2–#11 | `$1.00`, 5-unit trial default, scenario buttons, `OperatorSubRole` | none (mechanism designed) | AU + AD | REFINE |
| **Support** | none | Case store | — | — | Case workflow demo data | Support-case product truth (class A authorised, nothing implemented) | AU / TG | DEFER |
| **Integrity** | `trust_events` (evidence substrate only) | Case management | — | — | Integrity case demo | Integrity workflow truth; "no guilt from signals alone" | TG | DEFER |
| **Platform** | `commerceKnowledge` (taxonomy only) | Commercial price schedules by market (this design); other config | `operator.listPriceSchedules` | #11 | Market demo config | Non-commercial platform configuration | AD (commercial slice) / TG (rest) | REFINE (slice) / DEFER |
| **Audit** | Firestore audit is **write-only** | Commercial audit projection (this design) + future cross-domain | `operator.searchAudit` (TRD18 §18.50 fields) | Read only | Prototype `AuditLogEntry` shape | Cross-domain audit is future | AD | REFINE |

Prototype scenarios A–F, the phone-frame chrome, `OperatorSubRole` typing and demo personas are PO and never production architecture.

## 17. Business experience binding

Mapped to the adopted Business experience (Owner/Manager). **Reads only — Businesses have no commercial mutation at launch.**

| Experience element | Production source | Class | Disp. |
|---|---|---|---|
| Commercial standing notice | Derived standing (§11) via `business.getCommercialSummary` | AD + AN | REFINE |
| Trial remaining | `trial_remaining_units` | AD | REFINE |
| Credit / capacity | Balance in **units**, available capacity, reserved | AD | REFINE |
| Grace ("active Circles will finish") | Grace flag | AD | REFINE |
| Restriction ("new Circle starts paused") | `service_restriction`, exhausted | AD | REFINE |
| Active-Circle preservation | Statement backed by §8.5 | AN (copy) | REUSE |
| Earned-Reward preservation | Statement backed by `DEC-LOY-011`; unchanged redemption | AN (copy) | REUSE |
| History | Business-visible ledger lines (credits, adjustments, consumption counts); **excludes internal reason text and audit** | AD | REFINE |
| Prices shown | Bound to USD 2 equivalent + the market's local price, never the prototype's `$1` | AN | REPLACE (value) |
| Credit panel / per-Circle "Covered by Trial · deducted" line | Unit balance and consumption records (`bucket`, price snapshot); money shown as display-only equivalent | AD | REFINE (unit-denominated authority; see X-8) |

**Read vs mutation boundary.** Business-side visibility needs a Business-scoped read permission. The existing catalogues are Business-RBAC and Founder-governed (`DEC-LOY-017` precedent for adding `qualifyingItem.manage`). The recommendation is a structurally separate catalogue module with `commercial.view` for Owner and Manager and none for Staff, plus a generic non-financial "new enrolments paused" error for Staff at the counter. Because this amends the permission model it needs a Founder disposition (**FD-D**). Platform Administrator powers never flow to Business users, and Business users can never call an administrator command.

## 18. Audit model

**Recommendation: Commercial owns its own append-only audit table, with a read projection for the Operator Audit tab. Do not reuse Trust Events or the Firestore platform-audit collection.**

Why: (1) audit must be **atomic with the ledger mutation** — a Firestore audit write cannot share a PostgreSQL transaction; (2) `trust_events` is a customer-facing evidence substrate with purchase anchoring and a closed type set (`0013`), and internal commercial administration must not appear in it; (3) `platformAdministrationAuditRecords` has a closed vocabulary, fixed `targetType`, and is write-only.

**`commercial_audit_events`** follows TRD18 §18.49: `actor_user_id`, `actor_role` (constant `platform_administrator` — no hierarchy), `action_type`, `target_type`, `target_id`, `business_id`, `reason_code`, `reason_text`, `before_snapshot`, `after_snapshot` (counters and flags, no secrets), related ids (`ledger_entry_id`, `settlement_id`, `trial_grant_id`, `consumption_event_id`, `price_schedule_id`), `correlation_id`, `idempotency_key`, `occurred_at`, `schema_version`. System actions (projection) use `actor_user_id = 'system:commercial-projection'`. Indexes serve TRD18 §18.50 search fields (actor, action, target, business, date, correlation). Mutation triggers make rows immutable (I-3).

**Answer to "who did what to which Business, when, why, under what reference, before/after, related event":** one row per mutation with all of those columns. **Platform projection:** a view/adapter `platform_audit_v` selects commercial events today and can union other domains later without changing the write path. Reads of Business-360 and audit search may be recorded as coalesced `history_inspected` events (recommended, low priority).

## 19. Notification / operational-queue design

Commercial uses its own **`commercial_notification_intents`** (same intent-vs-delivery pattern as `notification_intents`, `status = 'pending'`, no delivery worker) rather than widening the shared table, whose closed CHECKs and purchase/redemption anchors would need another shape change. Operator queues are **derived views**, not stored rows.

| Signal | Kind | Threshold |
|---|---|---|
| Trial nearing exhaustion | Threshold | **Not governed** → `commercial_signal_config.trial_low_units`; NULL = disabled |
| Trial exhausted | State (`trial_remaining = 0`) | none |
| Low commercial capacity | Threshold | **Not governed** → `commercial_signal_config.capacity_low_units`; NULL = disabled |
| Zero capacity | State (`available < 1`) | none |
| Negative credit | State (`paid_balance < 0`) | none |
| Manual payment awaiting action | State (settlement `recorded`) | none |
| Restricted Business | State | none |
| Grace-active Circle | State (grace flag) | none |

**Ungoverned thresholds ship disabled** until configured; no number is invented. **Out-of-order delivery:** intents are keyed `(business_id, signal_type, account_version)` and are *snapshots*; consumers re-read current standing before acting, so a late intent cannot resurrect a stale state. Recipients: Business signals go to Owner (and Manager if FD-D allows); operator signals populate queues only.

## 20. Logical data model

Naming follows the repository: `snake_case`, `UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `business_id TEXT` (opaque), `correlation_id TEXT NOT NULL`, `created_at TIMESTAMPTZ`, `schema_version INTEGER NOT NULL DEFAULT 1`. Next migration number is `0021`. **All commercial tables: no foreign keys to loyalty tables.** *Design only; no migration exists.*

| Table | Purpose / owner | Key fields | Mutable | Constraints & idempotency | Lifecycle / audit |
|---|---|---|---|---|---|
| `commercial_accounts` | Materialised per-Business state (Commercial) | `business_id` PK; `settlement_market` (BI/RW, frozen); `commercial_effective_from`; `trial_granted_units`, `trial_remaining_units`, `paid_balance_units`, `reserved_units`; `service_restriction`; `paid_service_activated_at`; `version`; `updated_at` | Counters and two flags only, only under own row lock in same tx as a ledger append | `trial_remaining_units ≥ 0`, `reserved_units ≥ 0`, `trial_granted_units ≤ 5`; **no sign CHECK on `paid_balance_units`** | Created once; never deleted; each change has an audit row |
| `commercial_ledger_entries` | Authoritative ledger | `id`; `business_id` FK→accounts; `entry_type`; `bucket` (trial/paid/none); `units_delta`; `reserved_delta`; `trial_after`,`paid_after`,`reserved_after`; refs (`settlement_id`, `trial_grant_id`, `adjustment_id`, `consumption_event_id`, `source_verified_unit_id`); `idempotency_scope_key`; `created_by`; `occurred_at` | **Immutable** (trigger) | `UNIQUE(idempotency_scope_key)`; index `(business_id, occurred_at, id)` | Append-only; `consume:<cycle>`, `reserve:<vu>`, `cmd:<key>:<n>` |
| `commercial_consumption_events` | One row per consumed unit | `id`; `business_id`; `reward_program_id`; `source_loyalty_cycle_id`; `source_reward_id`; `source_transition` (`reward_available`); `source_fact_at`; `unit_count` (=1); `bucket`; `price_schedule_id`; `unit_price_usd_minor`; `local_currency`; `local_unit_price_minor`; `ledger_entry_id`; `recorded_at` | **Immutable** | **`UNIQUE(source_loyalty_cycle_id)`** (exactly-once); no customer identity stored | Written by projection; audit `consumption_recorded` |
| `commercial_trial_grants` | Explicit 3–5 grants | `id`; `business_id`; `units CHECK 3..5`; `granted_by`; `granted_at`; `reason_code`; `reason_text`; `reference`; `ledger_entry_id` | Immutable | `UNIQUE(business_id)` for the initial grant | Audit `trial_granted` |
| `commercial_manual_adjustments` | Trial and credit adjustments | `id`; `business_id`; `bucket`; `units_delta ≠ 0`; `reason_code`; `reason_text NOT NULL`; `reference`; `created_by`; `idempotency_key`; `ledger_entry_id` | Immutable | `UNIQUE(idempotency_key)` | Audit `trial_adjusted`/`credit_adjusted` |
| `commercial_settlements` | Offline/manual (later provider) payments | `id`; `business_id`; `status` (recorded/confirmed/voided); `source` (manual/provider); `method`; `external_reference`; `provider_event_id`; `amount_minor BIGINT`; `currency`; `market`; `units_purchased`; `price_schedule_id`; `expected_amount_minor`; `variance_minor`; `tax_basis`; `received_at`; `recorded_by`; `confirmed_by/at`; `voided_by/at/reason` | Status and confirm/void fields only (each transition also in audit and ledger) | `UNIQUE(method, external_reference) WHERE external_reference IS NOT NULL`; `UNIQUE(provider_event_id) WHERE NOT NULL` | recorded → confirmed → (voided); never deleted |
| `commercial_price_schedules` | Effective-dated pricing | `id`; `market`; `currency`; `usd_equivalent_minor`; `local_unit_price_minor`; `rate_reference`; `rounding_rule`; `effective_from`; `created_by`; `reason` | **Immutable** | `UNIQUE(market, effective_from)`; lookup = latest `effective_from ≤ t` | Correction = new row; audit `price_schedule_set` |
| `commercial_standing_events` | Restriction/activation/opening timeline | `id`; `business_id`; `event_type`; `actor`; `reason`; `occurred_at` | Immutable | `idempotency_key` unique | Feeds history view; audit row per event |
| `commercial_audit_events` | Immutable admin audit (TRD18 §18.49) | as §18 | **Immutable** | `UNIQUE(idempotency_key, action_type)` for command events | Read by audit projection |
| `commercial_notification_intents` | Intent, not delivery | `id`; `business_id`; `signal_type`; `recipient_type/id`; `account_version`; `payload`; `status='pending'` | Immutable until delivery package | `UNIQUE(business_id, signal_type, account_version, recipient_id)` | Delivery deferred |
| `commercial_signal_config` | Ungoverned thresholds | `key` PK; `value_units NULL` | Admin-set | NULL = disabled | Audited on change |

**Additive loyalty-side index (performance only, no schema semantics):** `rewards (business_id, available_at)` for the projection anti-join; and, if the record-time advisory check is built, a Business-scoped index for it. These are the only touches to loyalty tables and are flagged for the Technical Lead.

**Read models (views):** `commercial_account_standing_v` (derived dimensions), `commercial_history_v` (ledger + settlements + standing events, Business-visible and operator variants), `operator_commercial_queue_v`, `platform_audit_v`.

## 21. Transaction boundaries

| Transaction | Contents (one PostgreSQL transaction each) |
|---|---|
| Verify + gate | Existing verify transaction + (only if `newBlocks > 0`) account lock, gate decision, `capacity_reserved` ledger entry, account update |
| Consumption projection (per Cycle) | Account lock; consumption event; ledger debit + reservation release; account update; audit |
| Admin command | Idempotency reserve; account lock; command rows; ledger entries; account update; audit; idempotency complete |
| Settlement confirm | Settlement transition + `credit_grant` + audit in **one** transaction |
| Authority check | Firestore read of the `platformAdministrators` record **before** the PostgreSQL transaction (as `confirmRedemption` does with permissions); residual revocation window is the accepted two-store limitation already documented for redemption |
| Reconciliation (read-only job) | Compares `account counters` to `Σ ledger`; `rewards` without consumption after a grace interval; consumption without a `rewards` row; reports discrepancies (no auto-repair) |

## 22. Concurrency / lock-order analysis

**Canonical order extended:** `idempotency → purchase → stream → cycle → reward → commercial_account → appends`. The commercial account row is the **last** lock any loyalty transaction takes, and only when `newBlocks > 0`.

**Why no inversion.** Commercial-only transactions (admin commands, projection) take `idempotency → commercial_account → commercial rows` and touch **no loyalty row and no FK to one**. They therefore never wait on a loyalty lock while holding the account lock, so no cycle can form with a loyalty transaction that waits for the account lock last. This is precisely why cross-domain FKs are prohibited (§4.2): an FK insert from a commercial row would take a key-share on a `loyalty_cycles` row that verify holds `FOR UPDATE`, reproducing CORR-002. The projection reads `rewards`/`loyalty_cycles` with plain non-locking `SELECT`s (MVCC).

| Scenario | Behaviour |
|---|---|
| Simultaneous Circle completion | Independent `rewards` rows; projection inserts race on `UNIQUE(source_loyalty_cycle_id)`; loser does nothing; account lock serialises counters |
| Simultaneous new-Circle attempts | Serialise on account row; second sees first's reservation |
| Consumption vs manual top-up | Both take the account lock; order irrelevant to correctness (deltas commute); each ledger row records `*_after` |
| Consumption vs restriction | Restriction flag read under the same lock; restriction never affects consumption (in-flight Circles finish) |
| Duplicate Operator commands | `idempotency_keys` duplicate returns stored response; natural keys (`external_reference`) catch a re-keyed replay |
| Payment replay | `UNIQUE(method, external_reference)` / `UNIQUE(provider_event_id)` |
| Retry after timeout | Same key ⇒ replay of stored result; a rolled-back transaction released its key reservation (existing behaviour) |
| Transaction rollback | Verify rollback discards reservation with the Reward; projection rollback leaves the anti-join eligible for retry |
| Out-of-order notification delivery | Intents are versioned snapshots; consumers re-read (§19) |

## 23. Idempotency model

| Operation | Key |
|---|---|
| Admin command | Client `idempotencyKey` in `idempotency_keys` (operation types `commercial.<command>`), request hashed like `redemptionRequestHash` |
| Consumption | `source_loyalty_cycle_id` (unique) + ledger `consume:<cycle_id>` |
| Reservation | `reserve:<verified_unit_id>` (a Verified Unit is issued once per Purchase) |
| Settlement | `(method, external_reference)`; future `provider_event_id` |
| Price schedule | `(market, effective_from)` |
| Signals | `(business_id, signal_type, account_version, recipient_id)` |

## 24. Failure / rollback behaviour

Commercial fault during projection: retried by the sweep; loyalty unaffected. Commercial fault inside the gate: only affects a *new start* verification, which fails closed with a governed error (never a partial state). Gate mode `off`/`shadow` gives an instant operational switch back. Ledger errors are corrected only by compensating entries. Migration rollback: a `.down.sql` that **refuses when any ledger, settlement or audit row exists**, mirroring `0020.down` (fail-closed guard; recovery of a populated database needs a backup).

## 25. Security / authority boundaries

- **Commands:** active Platform Administrator + verified MFA (precedent `FD-BUS-ACT-001`); no role, no override, no new permission. Known limitation, stated plainly: until `DEC-GOV-007` is decided, commercial authority follows platform-administrator status, so *adding a second administrator would confer commercial power*. DEC-SUB-014 §9 already requires roles to be defined before any second administrator exists; a launch runbook check must record that the administrator set is exactly the Founder.
- **§8.1 boundary is structural:** no commercial import path to loyalty write functions (structural test), no commercial permission in any Business catalogue that grants purchase recording, redemption or loyalty mutation.
- **Tenant isolation:** every commercial read/write is `business_id`-scoped; Business callers see only their own summary.
- **Privacy:** commercial tables store no customer identity; customers never see commercial data.
- **Mass-assignment:** transports whitelist fields (as `index.ts:746–756`); `units`, market and price are never client-defaulted.
- **Audit integrity:** immutability triggers; audit written in the mutation transaction; no path to write audit without the mutation.
- **Enumeration:** single denial reason for all authority failures.

## 26. Experience ↔ Product Truth conflicts

| # | Conflict | Class | Resolution |
|---|---|---|---|
| X-1 | Prototype `$1.00`/`unitAmountUSD: 1.0` vs governed USD 2 | Documentation-only | Bind to USD 2 (already ruled, `FD-COM-001` §11); reference unchanged |
| X-2 | Prototype default 5-unit trial (`OperatorConsole.tsx:85`) **and a 1–5 numeric input** (`min={1} max={5}`, `:199`) vs "3–5, no universal default" | Documentation-only | Grant requires explicit units in 3–5; the assembled UI must not pre-fill and must not offer 1 or 2 |
| X-3 | Prototype standing labels include "suspended" | Documentation-only | Map to derived dimensions; commercial restriction never labelled as Business suspension (§11) |
| X-8 | **Prototype credit is a USD number clamped at zero** (`creditBalanceUSD`; consumption does `Math.max(0, balance − 1.0)`, `AppContext.tsx:383`) vs governed negative credit and a USD 2 unit | **Integrity** (would silently forgive debt and re-price balances) | Authority is **unit-denominated and signed** (§7); the assembled UI shows units, plus an optional *display-only* money equivalent (units × the market's schedule price). The experience keeps its "credit" panel and "Covered by Trial / deducted" per-Circle line — these map directly to the ledger bucket and price snapshot — so the experience is not degraded |
| X-9 | Prototype consumes trial first, then credit (`AppContext.tsx:383`) | none — **supports** design assumption A-1 | Trial-first order adopted |
| X-4 | EXP-REF-001 recommends "dual control" for money mutations; sole-administrator launch makes it impossible | **Product-scope / integrity** | Experience kept; compensating controls (mandatory reason, immutable audit, change digest); SoD beyond `DEC-GOV-011` stays the open truth gap. No experience degradation |
| X-5 | Prototype `OperatorSubRole` (ops/support/integrity/finance) vs no RBAC | Product-scope | Experience shows one "Platform Administrator" (as adopted); typing PO only |
| X-6 | Operator Console commercial operations need cross-tenant reads with no governed admin read model | Security | Sole-administrator authority; read-only queries audited; no role invented |
| X-7 | Business Commercial tab visible to which Business roles is ungoverned | Privacy / product-scope | FD-D; default Owner+Manager view |

No conflict requires degrading the adopted experience for implementation convenience.

## 27. Genuine remaining Founder decisions

Each is bounded, has a recommended default, and blocks **only the specific piece named**.

| ID | Decision | Recommended default | Blocks |
|---|---|---|---|
| **FD-A** | Does "usable commercial capacity" mean **balance net of capacity already committed to started Circles** (recommended) or **gross balance > 0**? | Net of commitments (bounds the trial and exposure; gross remains available as a one-line policy change) | Capacity-gate reservation logic (WP-COM-05) |
| **FD-B** | Is a commercial unit consumed when the **Reward becomes available** (earning side complete — recommended) or when the **Reward is redeemed**? | Reward available | Consumption projection source query (WP-COM-04) |
| **FD-C** | When a **new start is blocked at verification**, does the customer's purchase remain unverified until capacity returns (baseline) or is it accepted into a "pending" queue? (The latter alters loyalty semantics.) | Remains unverified; record-time advisory warns the Business | Customer-facing verify behaviour (WP-COM-05) |
| **FD-D** | Which **Business roles may view** commercial standing, balance and history? | Owner + Manager; Staff none | Business adapters (WP-COM-08) |
| **L-1 (input)** | Initial **BIF and RWF local unit prices** representing USD 2, who reviews them, and acknowledgement that `setPriceSchedule` is a Founder-level act | — | Pricing go-live (WP-COM-02 acceptance) |

**Design assumptions (architecture, reversible, Technical Lead to confirm — not Founder decisions):** A-1 trial-first funding order; A-2 trial adjustments capped at cumulative 5 (extra = paid credit); A-3 two-step settlement; A-4 closed reason-code vocabulary; A-5 gate `off/shadow/enforce` rollout; A-6 immutability triggers.

**Untouched and still open:** `DEC-SUB-013` (complimentary arrangements), `DEC-GOV-007` (administrator roles), SoD specifics beyond `DEC-GOV-011`. This design resolves none of them.

## 28. Prototype-only inventory (commercial/Operator scope)

`unitAmountUSD: 1.0` and `$1.00 USD Deducted`; `trialAllowanceTotal: 5` on all demo organisations and the Operator `trialUnits` default of 5; `creditDelta = -5` demo; operator review scenarios A–F and `applyOperatorScenario`; `OperatorSubRole` typing; `CommercialStanding`/`OnboardingState` unions as *type names*; demo personas and role switcher; scripted demo tour; `ManualActivationRecord`/`paidActivationRef` shapes as *shapes* (the concept is authorised, the structure is redesigned here); `AuditLogEntry` shape as illustrative. Verified against the adopted commit `18e8d700` (§2.1) and consistent with `11THONUS-EXP-REF-001` §4.1/§10.2. Additional items found on direct inspection: `creditBalanceUSD` as a USD balance with a zero clamp; `trialCirclesRemaining` naming; the Operator trial input's 1–5 range; `coverageType` (`trial` / paid) on per-Circle records. Bound and disposed of in §26 X-2, X-8, X-9.

## 29. Risks

| # | Risk | Sev. | Control |
|---|---|---|---|
| R-1 | *(Retired)* Prototype SHA and source were initially unverifiable; **now verified directly** at `18e8d700` (§2.1) | — | Closed |
| R-2 | Gate is the only hook in the verify path; a defect could block legitimate earning | High | `off/shadow/enforce` modes; only `newBlocks > 0` takes the lock; lock-order and concurrency tests before enforce |
| R-3 | Reservation model reads "capacity" more strictly than the literal text | Med | FD-A; policy is one function |
| R-4 | Consumption moment ambiguity (FD-B) | Med | Isolated to one query |
| R-5 | Authority follows platform-administrator status | Med | Runbook check; `DEC-GOV-007` |
| R-6 | Projection lag / missed rewards | Low | Reservation makes gate lag-proof; sweep + reconciliation job |
| R-7 | Cross-store: administrator revoked between Firestore check and PostgreSQL commit | Low | Same accepted window as redemption |
| R-8 | Retroactive billing for pre-account Circles | Med | `commercial_effective_from` |
| R-9 | Reason-code vocabulary becomes a back door for complimentary credit (`DEC-SUB-013`) | Med | No complimentary code; review any addition |
| R-10 | Migration `0019` still not applied anywhere; `0021` ordering depends on it | Low | Numbering follows the highest existing file; deployment ordering is a WP-COM-11 item |
| R-11 | Sole administrator can act unilaterally on money | Med | Mandatory reason, immutable audit, change digest; SoD is an open governance item |
| R-12 | Tax basis and refund/void policy unspecified | Low | Nullable `tax_basis`; void is compensating entry; policy is future |

## 30. Implementation work-package sequence (derived from dependencies, not a template)

Dependency reasoning: the ledger must exist before anything can post to it; pricing must exist before a settlement or consumption can snapshot it; consumption must exist (releasing reservations) before the gate reserves; the gate touches the loyalty path so it comes after everything it depends on has been proven; read models and adapters follow the data.

| WP | Content | Depends on |
|---|---|---|
| **WP-COM-00** | Governance close-out: Founder items FD-A…FD-D and L-1; TRD17 governed rewrite for consumption-first; TRD10 §10.6.3 lifecycle-vocabulary note; implementation authorisation record | Founder |
| **WP-COM-01** | Domain foundation: migration `0021` (accounts, ledger, audit, standing events, immutability triggers), ledger primitives, authority seam, boundary structural test | 00 |
| **WP-COM-02** | Price schedules, settlements table, BI/RW market rules, `setPriceSchedule` | 01 |
| **WP-COM-03** | Manual administration commands (#1–#11) with audit and idempotency | 01, 02 |
| **WP-COM-04** | Consumption projection + reservation release + `rewards` index; reconciliation job | 01, 02 (+FD-B) |
| **WP-COM-05** | Capacity gate + reservation in verify; record-time advisory; gate modes; lock-order and concurrency tests | 03, 04 (+FD-A, FD-C) |
| **WP-COM-06** | Standing and history read models (views + query functions) | 01–04 |
| **WP-COM-07** | Operator adapters (callables and web adapter layer) | 03, 06 |
| **WP-COM-08** | Business commercial read adapter and `commercial.view` catalogue | 06 (+FD-D) |
| **WP-COM-09** | Signals, intents, queues, threshold config | 06 |
| **WP-COM-10** | Launch readiness: data inputs, runbook, gate mode flip, deployment ordering, rollback rehearsal | 05, 09 |
| **WP-COM-11** | Experience assembly binding (Operator Commercial/Business tabs) — **separate authorisation** under the Experience track (`EXP-REF-002`+) | 07, 08 |

Critical path: 00 → 01 → 02 → 04 → 05 → 10. WP-COM-03, 06–09 parallelise after 01/02.

## 31. Acceptance criteria for implementation start

1. Separate Founder/Technical Lead implementation authorisation recorded.
2. FD-A, FD-B, FD-C closed (or the affected WP explicitly deferred); FD-D closed before WP-COM-08; L-1 supplied before pricing acceptance.
3. Technical Lead confirms design assumptions A-1…A-6.
4. TRD17 governed-rewrite scope agreed (WP-COM-00).
5. Confirmation that no live loyalty data exists at commercial go-live (else a go-live baseline is required, §12 (ii)).
6. `PB-013B P3-3` remains separately tracked (not a dependency of this work).
7. Migration numbering confirmed against deployment state of `0019`/`0020`.

## 32. Explicit non-goals

No code, migration, test, config or dependency change; no payment-provider integration; no Operator Console or Business UI build; no Experience Assembly; no prototype change; no subscription tiers; no change to USD 2; no universal trial default; no negative-credit floor or maximum; no administrator RBAC or role hierarchy; no change to `DEC-SUB-014`; no resolution of `DEC-SUB-013` or `DEC-GOV-007`; no broadening beyond Burundi and Rwanda; no alteration of the loyalty lifecycle, thresholds, Verified Units or Reward/redemption behaviour; no complimentary-plan policy; no tax policy.

---

**Disposition:** `11THONUS-COMMERCIAL-DESIGN-001 — COMPLETE / PENDING FOUNDER REVIEW`. Commercial implementation — NOT STARTED. Experience Reference — UNCHANGED / FROZEN. Experience Assembly — NOT STARTED.
