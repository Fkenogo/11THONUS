# Held-Purchase Processor — Operations Runbook

> **Work package:** WP-COM-06a · **Status:** Implemented — pending review (not merged, nothing deployed) · **Classification:** Working (operational record)
> **Audience:** whoever operates the Commercial admission gate during a bounded pilot.
> **Report:** [`wp-com-06a-held-purchase-processor-activation-and-recovery-implementation-report-2026-10-01.md`](../05-implementation/reports/wp-com-06a-held-purchase-processor-activation-and-recovery-implementation-report-2026-10-01.md)

**Plain-language summary.** When the Commercial admission gate is **enforced**, a Purchase that would start a new Loyalty Circle is _held_ (`pending_admission`) if the Business has no usable capacity. A held Purchase is valid and preserved, but it earns nothing until it is _admitted_. Something must therefore re-check held Purchases when capacity returns. That is the **held-Purchase processor**. This runbook says how it is triggered, how it recovers from missed triggers, what to watch, and how to switch it off.

**The gate is OFF by default and stays OFF until the Founder approves a bounded pilot.** Nothing in this package turns it on.

---

## 1. How processing is triggered

There are two independent paths. Both end in the **same, unchanged** function (`reevaluatePendingAdmissions`, WP-COM-05b); neither contains any admission logic of its own.

| Path | When | Scope | Guarantee |
|---|---|---|---|
| **A. Post-commit signal** (fast path) | Right after a Commercial command **commits** a change that can raise a Business's usable capacity | One Business | **Best effort.** Can be lost. |
| **B. Scheduled recovery** (safety net) | Every 5 minutes | A bounded, rotating batch of Businesses | The guarantee: every held Purchase is re-examined eventually. |

**Path A is a best-effort post-commit signal, not a transactional outbox.** Nothing is written in the Commercial PostgreSQL transaction. The sequence is:

1. The Commercial command commits in PostgreSQL (the settlement/trial/credit/standing change is now permanent).
2. Only then the command runner calls a notifier, which writes one Firestore document `heldPurchaseReevaluationSignals/{businessId}__{windowStart}`.
3. A Firestore write-triggered Function (`reevaluateHeldPurchasesOnSignal`) _claims_ the signals counted so far on that document and processes that one Business.

If step 2 or 3 fails, the Commercial change **stays committed** and nothing is half-admitted; path B finds the held Purchase on its next run. A failed signal is logged (`capacity_signal_failed`, see §6).

**Which mutations signal** (and which deliberately do not):

| Command | Signals? | Why |
|---|---|---|
| `confirmSettlement` | Yes (`settlement_confirmed`) | Credits the paid bucket. |
| `grantTrial` | Yes (`trial_granted`) | Adds trial capacity (always 3–5 units). |
| `adjustTrial` | Only if the change is **positive** (`trial_adjusted_up`) | A reduction can never admit anything. |
| `adjustCommercialCredit` | Only if the change is **positive** (`credit_adjusted_up`) | Same. |
| `restoreCommercialStanding` | Yes (`standing_restored`) | Lifts the `restricted` hold. A no-op restore is refused, so success always means a real change. |
| `restrictNewStarts`, `voidSettlement`, `cancelSettlement`, `openCommercialAccount`, `setPriceSchedule`, `recordSettlement` | No | Cannot raise usable capacity. |
| `activatePaidService` | **No** | It only stamps `paid_service_activated_at`. The admission decision reads balance, reserved units, restriction and the hold queue — never that field — so it cannot change whether a held Purchase may be admitted. |

> **Important:** the Commercial administrator commands are not yet attached to any production endpoint in this codebase. The signal is implemented and proven at the command-runner level (the notifier is injected through `CommercialCommandDeps.capacityIncreaseNotifier`; `createAdmissionSignalNotifier(db)` in `composition/heldPurchaseProcessorWiring.ts` is the ready-made one). Whoever wires those commands to an endpoint must pass the notifier. Until then, scheduled recovery (path B) is the only live path.

## 2. Coalescing

All signals for one Business inside one **60-second window** share **one** signal document, keyed by **Business + window start** — not by trigger type. A second signal in the window merges its reason into `reasons` and bumps `signalCount`. The trigger fires on every write, but a handler only processes when it can atomically _claim_ unclaimed signals (`signalCount > claimedCount`), so redeliveries and the handler's own claim write do nothing. Capacity changes that arrive while a run is in progress are served by at most one follow-up run.

- A change committed _after_ the window's first run finished, but still inside the same minute, is **not** swallowed: it bumps `signalCount` and is claimed and processed by a follow-up run. A lost signal is still compensated by path B (≤ 5 minutes).
- Processor-level idempotency is still the final safety net: concurrent runs for the same Business never admit a Purchase twice (see §7).

## 3. Scheduled recovery

- **Function:** `recoverHeldPurchases` (exported from `functions/src/index.ts`).
- **Cadence:** `every 5 minutes`, defined as the constant `HELD_PURCHASE_RECOVERY_SCHEDULE` in `functions/src/composition/heldPurchaseProcessorWiring.ts`.
- **This is a deployment-time setting.** Cloud Scheduler reads it when the Function is deployed. Changing the cadence means editing the constant and redeploying. **There is no runtime setting.**
- `maxInstances: 1`, `retryCount: 0`, 300 s timeout. A failed run is not retried; the next tick does the work. Overlapping runs (if one ever occurs) are safe because the processor is idempotent.
- **Bounded work per run:** at most **100 Businesses** per run, and per Business at most **1000** held Purchases in its _head window_ plus one _tail window_ (§5). A run also stops starting new Businesses after 240 s.
- **Fairness (no Business is starved):** Businesses are visited in a stable `business_id` order starting after a **persisted cursor** (`heldPurchaseProcessorState/businessCursor`). The cursor advances after every Business and wraps to the start when the list is exhausted. So with `B` Businesses holding Purchases, every one is reached within `ceil(B / 100) + 1` runs (≈ 10 minutes for up to 200 Businesses).

## 4. Enablement (default OFF)

The Functions are deployed but **do nothing** unless one of these is set on the Functions runtime:

| Variable | Value | Effect |
|---|---|---|
| `PURCHASE_ADMISSION_GATE_MODE` | `enforce` | The gate is on **and** the processor runs. |
| `HELD_PURCHASE_PROCESSOR_MODE` | `drain` | The processor runs even though the gate is off — use only to admit already-held Purchases after rolling the gate back. |
| neither | — | **Default.** Every entry point returns immediately without touching PostgreSQL. |

No committed file sets either variable (a test asserts this).

## 5. Scan limits (the 1000-Purchase window)

WP-COM-05b examines at most 1000 held Purchases per Business per pass, oldest first (`purchase_date`, then `id`), skipping any that do not fit. On its own, a head window full of Purchases that can never fit (for example large ones) would hide every later row **forever**. WP-COM-06a closes that gap without changing the head behaviour:

- Every pass still examines the **head window** (oldest 1000) first — FIFO priority, skip-and-continue and same-stream ordering are exactly 05b's.
- If the head window is **saturated** (more held Purchases exist beyond it), the pass also examines **one tail window** starting _after_ a persisted per-Business cursor (`heldPurchaseProcessorState/tail__{businessId}`). The cursor advances window by window and wraps when it reaches the end. Every held row is therefore examined within `ceil(n / 1000)` passes.
- Saturation is reported (§6): log `held_purchase_scan_window_saturated` and `businessesSaturated` / `backlog.businessesOverWindow` in the run summary.
- The limits were **not** raised.

## 6. What to watch — metrics and logs

Be precise about what exists:

- **Structured logs** (the repository's closed `OperationalLog` shape, severity-tagged, to Cloud Logging).
- **Persisted operational state** in Firestore: one document per scheduled run (`heldPurchaseProcessorRuns/{runId}`, full counters) and a `heldPurchaseProcessorState/latest` document overwritten every run.
- **No Cloud Monitoring metrics or alerts exist yet.** Nothing is exported until someone creates **log-based metrics and alert policies** from the log fields below (a deployment action, not performed by this package). Until then, read the `latest` document and the logs.

**Log operations** (`domain=purchase`, `service=held_purchase_processor` unless noted):

| `operation` | Severity | Meaning / use |
|---|---|---|
| `held_purchase_recovery_run` | info / warning / error | One per scheduled run. `result` = `succeeded` \| `partial` \| `failed`; `durationMs`. **Alert** on `failed`, or on no such line for > 15 minutes while the gate is enforced (the schedule stopped). |
| `held_purchase_business_pass_signal` / `_recovery` | info / error | One per Business pass; `businessId`, `durationMs`. `error` = the whole Business pass failed (`errorCode`). |
| `held_purchase_failed` | warning (transient) / error (permanent) | One Purchase failed; `aggregateId` = Purchase id, `errorCode`, `result` = `transient` \| `permanent`. **Alert** on any `permanent`. |
| `held_purchase_scan_window_saturated` | warning | A Business holds more than the 1000-row window. |
| `held_purchase_continuation_state_failed` | error (run) / warning (single Business pass) | The continuation cursor could not be read/written (`errorCode` `CONTINUATION_STATE_FAILED`). **Alert** on any occurrence; the matching scheduled invocation also fails. |
| `held_purchase_run_state_persist_failed` | error | The run could not be recorded in Firestore (`RUN_STATE_PERSIST_FAILED`); the invocation fails. The PostgreSQL work of the run was still done. |
| `held_purchase_signal_malformed` | error | A signal document without a Business id was ignored. |
| `capacity_signal_failed` (`domain=commercial`, `service=capacity_signal`) | warning | A post-commit signal failed or the command stopped waiting for it (`errorCode` `SIGNAL_FAILED` or `SIGNAL_TIMEOUT`). On a timeout the notifier is **not cancelled**: its own best-effort work may still finish (or be cut off by the runtime) after the command returned, so a `SIGNAL_TIMEOUT` signal may in fact still have arrived. The mutation is committed; path B will compensate. Many in a row means Firestore/Functions trouble. |

**`heldPurchaseProcessorState/latest` fields** (also in each run document): `status`, `durationMs`, `businessesExamined`, `businessesFailed`, `businessesSaturated`, `purchasesExamined`, `admittedFromPending`, `stillHeld`, `skippedForCapacity`, `skippedOvertaken`, `notPending`, `failedTransient`, `failedPermanent`, `cursorStart`, `cursorEnd`, `wrapped`, `budgetExhausted`, `stateError`, and `backlog` { `totalPending`, `businessesWithPending`, `oldestPendingAgeSeconds`, `businessesOverWindow`, `topBusinesses[10]` }.

- **Total pending / pending by Business / oldest age:** `backlog.*`.
- **Processor success / failure / duration:** `status`, `failed*`, `durationMs` (and the log line).
- **Admitted from pending / still held / skipped for capacity:** `admittedFromPending`, `stillHeld`, `skippedForCapacity` (this run only).
- **Large-Purchase starvation indicator:** `skippedOvertaken` — held for insufficient capacity _while a younger Purchase of the same Business was admitted in the same pass_. Persistently > 0 for the same Business means a large Purchase is being passed over (the known residual risk of skip-and-continue; no priority aging exists).
- **On-demand backlog query:** `readHeldPurchaseBacklog(pool)` (a read-only aggregate over the existing partial index).
- Run documents carry an `expiresAt`; apply a Firestore **TTL policy** on `expiresAt` for `heldPurchaseProcessorRuns` and `heldPurchaseReevaluationSignals` (a deployment action, not performed here). Without it they accumulate (30-day intent).

**Suggested pilot thresholds** (starting points; tune from evidence):

| Signal | Investigate when |
|---|---|
| `failedPermanent` | > 0 in any run. |
| `status` | `failed`, or `partial` on 3 consecutive runs. |
| `backlog.oldestPendingAgeSeconds` | grows past the Business's expected top-up time (agree a number with the Founder; a Business that has not paid will legitimately stay held). |
| `backlog.businessesOverWindow` | > 0 (a Business has > 1000 held Purchases). |
| `budgetExhausted` | `true` repeatedly (a run no longer fits its time budget). |
| `stateError` | `true`. The continuation cursor in Firestore could not be read/written, so fairness across runs is degraded (the run restarts from the first Businesses; processing correctness is unaffected). A state error is **never** reported as a successful run: the run `status` is `partial`, the scheduled invocation **fails** (visible as a failed Function execution), and `held_purchase_continuation_state_failed` is logged at error severity. That log is written **before** any Firestore persistence, so it still appears during a Firestore outage that also prevents `latest` from being written. Treat it as urgent if it repeats: Businesses beyond the first 100 can be starved while it lasts. |
| `capacity_signal_failed` | more than a handful per hour. |

## 7. Failure handling

Each Purchase is its own transaction. One failing Purchase never stops its Business pass; one failing Business never stops the run.

| Class | Examples | What happens |
|---|---|---|
| **Transient** | deadlock `40P01`, lock timeout `55P03`, statement timeout `57014`, serialization `40001`, too-many-connections, connection loss, an admission key briefly held by another transaction | Retried once in-run (short back-off). If it still fails: recorded (`failedTransient`, `held_purchase_failed` warning), the Purchase stays held, and the next run tries again. |
| **Concurrency winner (not a failure)** | another worker already admitted the Purchase | The Purchase is simply no longer pending: counted as `notPending`. Confirmed by a fresh read. |
| **Permanent** | constraint violation (`23xxx`), invalid data, an invariant breach (a state error while the Purchase is _still_ pending), anything unrecognised | **Not** retried in-run. Recorded (`failedPermanent`, `held_purchase_failed` **error**). The Purchase stays held and is re-examined next run (it is never parked silently). |

## 8. Manual recovery

There is no new endpoint and no UI. The supported manual paths use existing IAM-controlled access:

1. **Business-scoped, immediate:** with Firestore write access (IAM; not reachable by app users — Security Rules deny all client access), create a document in `heldPurchaseReevaluationSignals` with field `businessId` = the Business id and any id (for example `manual__{businessId}__{timestamp}`). The write-triggered Function processes **that Business only**. (The document needs a `businessId`; a new document, or an existing one whose `signalCount` exceeds `claimedCount`, is processed.) Include a `reasons: ["manual"]` field for traceability.
2. **Whole sweep:** run the `recoverHeldPurchases` scheduler job now (Cloud Scheduler → _Force run_).
3. Both are safe to repeat: a second run finds nothing left to admit.

Never edit `purchase_records` or the Commercial tables by hand to "unstick" a Purchase.

## 9. Diagnosing a stuck held Purchase

1. Is the processor enabled? (§4) If not, nothing runs — by design.
2. Read `heldPurchaseProcessorState/latest`: is `status` `succeeded`, is it recent, is `stateError` false? (If Firestore itself is down, `latest` may be stale — check the logs for `held_purchase_continuation_state_failed` / `held_purchase_run_state_persist_failed` and for failed `recoverHeldPurchases` executions.)
3. Find the Purchase's Business; look at that Business's Commercial account (balance, reserved units, `service_restriction`). The hold reason is in the Commercial audit row (`admission_held`, `reason_code`): `not_established`, `restricted`, `insufficient_capacity`, `stream_queue` (an older Purchase of the same customer/program is still held), `business_queue`.
4. `insufficient_capacity` with positive-looking balance: usable capacity is **balance − reserved**, pooled across trial and paid; a negative paid balance reduces it (Founder-confirmed policy, unchanged).
5. Look for `held_purchase_failed` for that Purchase id.
6. If the Business has more than 1000 held Purchases, see §5 — rows beyond the head window are reached by the tail rotation, not on every run.

## 10. Keeping the gate OFF, and rollback

- **Keep OFF:** do not set `PURCHASE_ADMISSION_GATE_MODE` or `HELD_PURCHASE_PROCESSOR_MODE`. Nothing in the repository sets them.
- **Stop the processor (instant):** unset `HELD_PURCHASE_PROCESSOR_MODE` and set `PURCHASE_ADMISSION_GATE_MODE` to anything other than `enforce` (for example unset it). Both Functions then return immediately.
- **Disable the schedule entirely:** pause the Cloud Scheduler job, or delete the Function.
- **Roll the gate back while Purchases are held:** held Purchases stay valid and preserved. To admit them anyway, set `HELD_PURCHASE_PROCESSOR_MODE=drain` until the backlog is empty, then unset it.
- **Code rollback:** `git revert` the WP-COM-06a commit. There is **no schema change**, so no `migrateDown`. Leftover Firestore documents (`heldPurchaseReevaluationSignals`, `heldPurchaseProcessorState`, `heldPurchaseProcessorRuns`) are inert and can be deleted.

## 11. Before enabling `enforce` (all must be true; the Founder decides)

1. Relevant Businesses have Commercial accounts and capacity (trial/paid) provisioned.
2. A production path exists to run the Commercial administrator commands (WP-COM-06a does **not** add one) and it passes the capacity-signal notifier.
3. The Functions are deployed; the Cloud Scheduler job exists and runs; the Firestore trigger deploys in the Firestore database's region (the Functions region is `europe-west1`; **verify the database location is compatible before deploy**).
4. Log-based metrics and alert policies exist for §6 (at least: run `failed`, `permanent` failures, no run in 15 minutes, saturation).
5. Firestore TTL policies exist for the signal and run collections.
6. Someone is named to read `heldPurchaseProcessorState/latest` daily during the pilot.
7. The Founder has accepted the open policy risks recorded in the WP-COM-05b report §24A–§24B (large-Purchase starvation, shared-pool availability).
8. A bounded pilot scope is fixed (named Businesses, duration, exit criteria).
