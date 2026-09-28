# `CAPABILITY-6-REDEMPTION-ENGINE-001` — Capability 6 Redemption Engine Implementation Report

> **Date:** 2026-09-27 · **Task:** `CAPABILITY-6-REDEMPTION-ENGINE-001`
> **Classification:** Implementation Report — primary-source document, written once at the time of the task
> **Entry `origin/main`:** `87c679c63dc79afe9b29cff793b93cee562904fb`
> **Branch / worktree:** `feat/capability-6-redemption-engine-001` (isolated clean worktree; Founder's primary checkout untouched)
> **Governing authority:** `DEC-LOY-018` (Decision Register) via `FD-REDEMPTION-AUTHORITY-001`

---

## 1. Scope actually delivered

The **server-authoritative Business redemption confirmation engine**: taking a persisted Reward from
`available` to the existing governed `redeemed` state, attributable to the individual authenticated
Business member who confirmed it, under a distinct governed permission, with live re-evaluation,
idempotency, concurrency safety, tenant isolation, Trust evidence and governed notification intents.

This is an **engine/backend capability package only**. It is not the production redemption experience.

Explicitly **not** delivered, by boundary: production redemption UI; any change to the separate
11thONUS prototype repository (the Experience Reference); redemption reversal; PB-013B P3-3 work;
commercial/billing work; auth-provider migration; Cloudflare/deployment work.

---

## 2. Pre-change architecture analysis (what the repository actually contained)

Findings that shaped the implementation, read from the code rather than assumed:

**Reward domain.** `rewards` (`0012_rewards.sql`) already carried the full governed lifecycle
`CHECK (state IN ('available','redeemed','cancelled','expired'))` and the composite FK chain
`rewards_match_cycle` / `rewards_governing_version`. The Reward is created exactly once by the
`verifyPurchase` threshold sub-transaction at exactly 10 allocated units
(`loyaltyCycleRepository.ts::insertRewardForCycle`), with terms snapshot from the Cycle's governing
version. **The `redeemed` state already existed** — this package implemented the transition into it,
not a new state. Reward reads (`listAvailableRewardsForCustomer`, and the `BUSINESS-REWARD-CYCLE-VISIBILITY-001`
Business read) already filter `state = 'available'`, so a redeemed Reward disappears from both with
no read-model query change.

**Loyalty cycle domain.** A cycle is opened under the stream lock, accumulates verified units, and at
exactly 10 flips to `reward_available` in the *same* transaction that creates the Reward.

> **CORRECTED (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-001`).** The original version of this report
> stated the opposite — that the cycle is "already complete when the Reward becomes available" and that
> "redemption requires no cycle mutation". **That was wrong, and independent review proved it against
> a live database.** `reward_available` is a *current* cycle state: both
> `loyalty_cycles_one_current_per_customer_program` and `lockCurrentCycle` count
> `active`/`reward_available` as current. A cycle left in `reward_available` therefore keeps the
> single-current-cycle slot taken, and the next cycle can never be opened — the Customer could never
> earn again after redeeming. The canonical stored state that ends a cycle, `reward_redeemed`, exists
> in PRD06, TRD10 §10.11.2 and the `0010` schema CHECK but had **no writer anywhere in the
> repository**. TRD11 §11.26 requires the redemption flow to "close Loyalty Cycle; create next
> Loyalty Cycle; allocate pending Verified Units"; DEC-LOY-002 and DEC-LOY-008/`FD-PVL-002`
> option (a) define what that means. Redemption now performs all of it in the same transaction as the
> Reward transition. The test that previously asserted "does NOT mutate the Loyalty Cycle" was
> removed and replaced with the Product-Truth lifecycle tests.

**Authorization architecture.** Permission catalogues are per-domain modules registered into the
closed `SENSITIVE_PERMISSION_IDS` set; `evaluateAuthorizationDecision` is a pure function and
`evaluatePermissionWithContext` is the single live-resolving service. Sensitive entries carried a
single-role `explicitGrantEligibleRole: Role | null`, which could express *one* eligible role — enough
for `staff.assignPermissions` (Owner default, Manager grant) but structurally unable to express
DEC-LOY-018's Manager re-grant **and** Staff grant on the same permission.

**Existing schema.** The rewards/cycles schema did **not** represent redemption evidence. The
migrations README already reserved a `redemptions` table name for a "separately authorized future
implementation package", which is this package. A migration was therefore justified on evidence, not
convenience.

---

## 3. Product Truth authorities used

| Authority | What it settled here |
|---|---|
| `DEC-LOY-018` (via `FD-REDEMPTION-AUTHORITY-001`) | Redemption mechanics; permission-based confirmation authority; D-1 interaction; D-2 defaults/delegation; D-3 reversal exclusion; attribution |
| `FD-REDEMPTION-AUTHORITY-001` §4 | The permission must be a **distinct module** (`DEC-LOY-017` precedent) and must **NOT** reuse `reward.override` |
| `DEC-LOY-017` | Precedent: a new authority is minted in its own disjoint catalogue module, not by widening an unrelated catalogue |
| PRD01 §11 / §12.5 | Owner + Manager hold redemption confirmation by default; the Owner-floor invariant |
| PRD07 §18, TRD11 §11.26 | Governed redemption notification intents |
| `DEC-LOY-011`, PRD06 §5 | Suspension / retired-programme axes preserved; redemption confirmation stays eligible during commercial suspension |
| `DEC-ID-002` | Shared accounts prohibited; individual attribution |
| `DEC-LOY-004` | Reversal excluded |
| `DEC-SEC-003` | Bounded redemption security slice; the residual quick-switch question stays OPEN |
| `DEC-LOY-013(a)` | Paused-programme edge stays unruled; no new rule invented |

**No new Product Truth was invented.** No redemption evidence, PIN, code, customer confirmation, staff
title, voucher, branch restriction, monetary value, expiry rule, offline behaviour, or new lifecycle
state was created.

**Deferred decisions reopened:** none. No deferred Product/Architecture/Commercial/Security/Operational
decision was necessary for this authorised outcome, so none was reopened. `DEC-SEC-003`'s residual
quick-switch question and `DEC-LOY-013(a)`'s paused-programme edge remain exactly as they were.

> **CORR-002 (2026-09-28) — one bounded clarification became necessary for the authorised outcome and
> was recorded, not invented:** which Reward Program version governs a Loyalty Cycle opened by the
> redemption continuation path. Per the programme principle (deferred decisions are resolved when the
> current authorised outcome depends on them), a dated Notes addendum was appended to the existing
> `DEC-LOY-008` (Status CONFIRMED unchanged; no new decision identifier): a Cycle's governing version
> is the version of the FIRST Verified Unit allocated into it — the verify path opens under its
> opening Purchase's creation-time snapshot (`DEC-PROD-014`); redemption opens under the first
> pending position's version in forward-allocation order, or provisionally under the completed
> Cycle's version when opened empty with first-future-allocation adoption in verify. Programme-
> current-at-redemption is explicitly NOT approved. The CORR-001 "current version" determination is
> superseded (see `IMPLEMENTATION_CHANGES.md` CORR-002 entry).

---

## 4. Implementation strategy

**4.1 Permission capability.** `redemption.confirm`, minted in a structurally separate module
`domains/permissions/models/redemptionPermissionCatalogue.ts` (the `DEC-LOY-017` precedent), registered
into the sensitive catalogue so it inherits Owner floor, override administration, and mandatory audit
through the *existing* architecture. There is no redemption-specific evaluator branch.

**4.2 Eligibility generalisation (the smallest coherent change).**
`explicitGrantEligibleRole: Role | null` → `explicitGrantEligibleRoles: readonly Role[] | null`, plus a
single `isRoleEligibleForExplicitGrant(entry, role)` predicate. Every existing entry passes a
single-element array, so no existing permission's behaviour changed; `redemption.confirm` is the only
entry with two (`["manager","staff"]`). `createPermissionOverride` remains the sole authority for
whether an override is constructible, and `evaluateAuthorizationDecision` revalidates eligibility
independently, so the constructor, the evaluator, and the reconciliation module all consume the same
predicate. The full existing permission suites (626 tests) pass unchanged, which is the regression
evidence that eligibility did not silently widen.

**4.3 Redemption command.** `confirmRedemptionCommand.ts`: live `redemption.confirm` evaluation →
idempotency peek → one PostgreSQL transaction (reserve key → `SELECT … FOR UPDATE` the Reward →
re-check existence/ownership/state → conditional `available → redeemed` → redemption evidence row →
Trust Events → Notification Intents → complete key). The client supplies only `businessId` and
`rewardId`; the transport whitelist (`parseConfirmRedemptionRequest`) excludes every other field.

> **CORRECTED (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-002`).** The transaction above locked the
> Reward FIRST and the stream/cycle afterwards — inverting the canonical global lock order
> (idempotency → purchase → stream → cycle → reward → appends) and deadlocking with a concurrent
> verify (PostgreSQL `40P01`: redemption held Reward + key-share(Cycle) wanting Stream while verify
> held Stream wanting Cycle). The command now takes a non-locking business-scoped Reward peek for
> lock-key discovery, then locks stream → governing cycle → Reward, with every precondition still
> decided off the locked row plus the conditional transition. The next Cycle opens under the first
> forward-allocated unit's version (provisional continuity version when opened empty), and verify
> adopts the first allocation's version into an empty Cycle — programme-current-at-redemption is
> removed. No second locking framework; the existing repository helpers are reused.

**4.4 Concurrency.** Four independent layers, deliberately: the idempotency key, the row lock, the
conditional `UPDATE … WHERE state = 'available'`, and the `redemptions_one_per_reward` UNIQUE
constraint. Two authorised members confirming the same Reward simultaneously produce exactly one
transition and exactly one `reward.redeemed` Trust Event. **CORR-002 adds the fifth, structural
guarantee: canonical lock ordering, proven by deterministic lock-order tests including the old
order reproducing the reported `40P01` on a live database.**

---

## 5. Schema / migration

`0020_redemption_store.sql` (+ `.down.sql`) — four additive, backward-compatible changes as a single
deployment unit (the command writes all of them in one transaction):

- **A.** `rewards (id, loyalty_cycle_id)` UNIQUE — the composite-FK target that lets a redemption prove
  the Reward it redeems is the very Reward of the Cycle it names.
- **B.** `redemptions` — one row per redeemed Reward. `UNIQUE (reward_id)` (exactly-once backstop) plus
  the composite FK chain `redemptions_reward_in_cycle`, `redemptions_match_cycle`,
  `redemptions_governing_version`. Individual attribution columns
  (`confirmed_by_user_id`, `confirmed_by_membership_id`, `confirmed_by_role`). **No cancellation or
  reversal fields** (`DEC-LOY-004`).
- **C.** `trust_events` — two new governed types (`reward.redeemed`, `loyalty_cycle.reward_redeemed`)
  mirroring the availability pair. The causal Purchase columns become NULLABLE because redemption is
  caused by a Business confirmation, not a Purchase transition; a shape CHECK preserves the spine
  invariant (NOT NULL) for every purchase-caused type and requires NULL for redemption-caused types.
- **D.** `notification_intents` — two new governed types anchored on the redemption via a
  `source_redemption_id` FK, with the same one-per-(source, type, recipient) dedup the existing
  purchase index provides, enforced by a partial unique index.

**Deliberately not widened:** `purchase_outbox`. Every event type and its `aggregate_id` FK are
Purchase-Record-scoped, and a Business-confirmed redemption has no causal Purchase Record. Widening it
would invent a mechanism rather than reuse one.

`0019` was **not executed** in any environment by this task. Historical migrations were not altered.

---

## 6. Evidence the existing permission semantics were preserved

- Full permissions domain suite: **626 tests pass unchanged** (no pre-existing expectation edited).
- `evaluatePermission.corr003.test.ts` Phase G was extended to *prove* the only exclusions from the
  legacy `{trial, active}` gate are `staff.manage` (the pre-existing `CORR-003` override) and
  `redemption.confirm` (its own `DEC-LOY-011` suspension override) — an exclusion by governed design,
  not by drift.
- `redemptionPermissionCatalogue.test.ts` proves `redemption.confirm` is claimed by **no other
  catalogue** and is never `reward.override`.
- The new integration suite proves at the behavioural level that a Staff redemption grant confers no
  unrelated permission and does not promote the member.

---

## 7. Verification results

| Suite | Result |
|---|---|
| Unit / pure (`npm test`) | **164 files, 1894 tests — all pass** |
| PostgreSQL (`npm run test:postgres`) | **11 files, 303 tests — all pass** |
| Firebase Emulator (`emulators:validate`) | **65 files, 864 passed / 3 skipped — exit 0** |
| Typecheck (`npm run typecheck`) | clean |

> **CORR-002 (2026-09-28) verification delta.** PostgreSQL grew from 10 files / 296 tests to 11 files
> / 303: new `confirmRedemptionLockOrder.postgres.test.ts` (4 tests — both serializations through the
> real repository helpers, true-concurrency B-blocks-on-A's-stream then resolves, and the OLD lock
> order scripted manually reproducing the reported `40P01`), plus three post-redemption version-
> binding scenarios in the redemption suite (39 tests: no-change continuity; V2-published-while-
> waiting with a normal-path control proving identical Rewards; mixed-version pendings proving
> first-pending governance and V1-terms threshold). The P1 REGRESSION test no longer deletes the
> redemption-opened Cycle — it earns INTO it through the normal verify path and proves Reward B
> belongs to it. Threshold assertions strengthened (exactly one current cycle / one next Reward /
> governed Trust pair / `reward_available_customer` intent / no duplicates). Full-suite runs are
> green except the known structural `platformFoundationReadiness` shared-DB flake (fails identically
> on the pristine head; untouched) and slow-seed 5s-timeout flakes on this machine (same); both
> pre-existing P3s. No schema change — no new migration; 0001→0020, 0019→0020 and the rollback-guard
> paths remain green via the untouched migration suite (49 tests).

New integration suite `confirmRedemptionCommand.postgres.test.ts` (**36 tests**) covers: state
transition and failure atomicity (a late transaction failure rolls back Reward, Cycle, next Cycle,
evidence, allocation, events and intents, and the idempotency reservation with them); **the
governed Loyalty Cycle lifecycle — `reward_available →
reward_redeemed`, next-Cycle creation, and pending Verified Unit forward allocation including the
quantity-conserving split at the threshold, plus a regression test that reproduces the independent
review's database failure and proves the Customer can keep earning**; already-redeemed and
non-redeemable-state rejection; tenant isolation in both directions with cross-tenant enumeration
resistance; the full
Owner / Manager / Staff / Platform Administrator / Customer permission matrix including revoke and
re-grant; live re-resolution after revocation and after suspension; grant confers no unrelated
permission; idempotent replay, key conflict, two-member race, and double-click (the two
simultaneous-transaction races carry explicit 30s timeouts — the corrected transaction is heavier
and exceeded vitest's 5s default under full-suite load); the UNIQUE schema
backstop; Trust Event pair with NULL Purchase causation; both notification intents; and both
available-reward reads. `rewardProgramMigrations.postgres.test.ts` additionally proves the `0020`
fail-closed guard refuses rollback while redemption evidence exists.

---

## 8. Programme alignment (facts, not aspirations)

- **Redemption engine implemented** on `feat/capability-6-redemption-engine-001`.
- **Capability 6 is NOT complete.** The engine implementation alone does not satisfy the governing
  capability definition: Experience Reference refinement and production Experience Assembly are
  both still pending, and nothing is deployed.
- **Experience Reference refinement:** still pending. The 11thONUS prototype repository is untouched
  and is the next step after engine acceptance.
- **Production Experience Assembly:** still pending. No production redemption UI was built.
- **Reversal:** excluded. No undo, admin reversal, reward restoration, or negative cycle adjustment exists.
- **PB-013B P3-3:** **remains `OPEN / UNRESOLVED`, untouched.** Dependency assessment: this package
  neither invokes nor modifies the Reward Program publication path. `createRewardProgram` /
  `publishRewardProgramVersion` appear in the new test file **only as test setup** for producing a real
  published program; no code under test reads, writes, or activates a publication snapshot. The
  activation boundary is therefore not crossed and the fix is not absorbed here. **CORR-002
  (2026-09-28): still NOT CROSSED** — the correction only reads published versions/current-cycle
  data; `createNextRewardProgramVersion` joins the test-setup-only list alongside the above.
- **Deployment status:** nothing deployed. No Cloudfire/hosting/database action was taken.
- **Migration 0019 status:** not executed by this task. `0020` is authored but not applied to any
  deployed database; it is applied only in the local test database.
