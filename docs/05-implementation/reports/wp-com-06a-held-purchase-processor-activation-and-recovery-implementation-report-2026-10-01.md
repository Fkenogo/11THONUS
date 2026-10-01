# WP-COM-06a — Held-Purchase Processor Activation & Recovery — Implementation Report

> **Date:** 2026-10-01 · **Status:** Implemented — pending review (not merged, nothing deployed) · **Classification:** Working (implementation record)
> **Authority:** `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + `CORR-002` (§8.11–§8.13, §22.3, §24) · **Entry `origin/main`:** `bb22f43af8a1696e04799f4ccd9dd234af7542cb` (merge of WP-COM-05b, PR #291)
> **Branch:** `claude/gallant-ramanujan-vzw1zd` · **Schema change:** none · **Runbook:** [`docs/runbooks/held-purchase-processor-runbook.md`](../../runbooks/held-purchase-processor-runbook.md)

**In one paragraph.** WP-COM-05b made the gate and a _callable_ processor for held Purchases but nothing called it. WP-COM-06a makes that processor operationally safe: (1) a **best-effort post-commit signal** after the Commercial mutations that can raise capacity, coalesced per Business and time window; (2) a **scheduled recovery** (every 5 minutes, deployment-time cadence) that compensates for any missed signal, with a **persisted cursor** so no Business beyond the first 100 is starved and a **rotating tail window** so held Purchases beyond 05b's 1000-row window are eventually reached; (3) **per-Purchase and per-Business failure isolation** with transient / concurrency-winner / permanent classification; (4) **backlog observability** as structured logs plus persisted run state; (5) the runbook. It adds **no admission logic**: every admission still runs through the unchanged `reevaluatePendingAdmissions` → `admitOrHoldPurchase`. The gate remains **default OFF**; nothing enables `enforce`.

---

## 0. Provenance — this is a fresh implementation

A previous session reported WP-COM-06a as implemented, but no commit, branch diff, PR, report or `scheduledReevaluation` / `admission_reeval` code existed anywhere on GitHub (verified across all 273 remote branches and all PRs). That report was **not** treated as evidence. This package was implemented from canonical `main` and validated here, where Node, pnpm, PostgreSQL 16 and the Firestore/Auth emulators were available.

## 1. Entry gate

| Item | Result |
|---|---|
| Repository | `Fkenogo/11THONUS` |
| Entry `origin/main` | `bb22f43af8a1696e04799f4ccd9dd234af7542cb` (re-fetched; unchanged) |
| Contains WP-COM-05b | Yes — merge of PR #291 (incl. CORR-001 FIFO scan + skip-and-continue) |
| Migrations `0021`–`0027` | Present, each with `.down.sql` |
| WP-COM-01…05b reports | Present under `docs/05-implementation/reports/` |
| Pre-existing scheduler / trigger code | **None.** No `onSchedule` or Firestore trigger existed anywhere; `trustEventHandler.ts` explicitly records "no `onSchedule`/pub-sub wiring exists anywhere yet". |
| Pre-existing Commercial endpoints | **None.** The Commercial administrator commands are not wired to any callable (stated in WP-COM-02/03 PRs). |
| Baseline (pristine `main`, this environment) | PostgreSQL suite 18 files / 638 tests green on a fresh database; unit 1943; emulator 66 files / 867 |

## 2. Strategy (stated before editing)

1. Inspect, don't assume: confirm what exists (nothing schedules; no Commercial endpoint; no Commercial outbox).
2. **Signal** = best-effort post-commit notifier, injected into the Commercial command runner behind a Commercial-owned port; the composition root binds it to a Firestore document write. No transactional outbox (none is called for; see §6).
3. **Processor activation** = a thin orchestration layer around the unchanged canonical processor, in the Purchase domain, with injected state store and observer (no Firebase/logger imports in the domain).
4. **Recovery** = one exported scheduled Function; stable-order persisted Business cursor; per-Business head + rotating tail window.
5. **Isolation** = classify errors; retry transient once; never let one Purchase or Business abort a pass.
6. **Observability** = closed-shape structured logs + persisted run/latest documents; be explicit that nothing is exported to Cloud Monitoring.
7. Prove each claim with real PostgreSQL, real Commercial/Purchase commands, a real Firestore emulator, and mutation checks.

## 3. Environment setup

| Need | Provided by |
|---|---|
| Node 22.22.0 / pnpm 9.15.9 | preinstalled (`pnpm install --frozen-lockfile`) |
| PostgreSQL 16 | Docker daemon unavailable; used the preinstalled PostgreSQL 16 binaries as a **disposable local cluster** on port 54329 (`initdb` in `/var/tmp`, database `eleventhonus_platform_test`), the same major version as the repo's `postgres:16-alpine` |
| Firestore + Auth emulators | `pnpm exec firebase emulators:exec` (JDK 21) |
| Storage / Pub-Sub emulators | **Not available** — their JAR downloads are blocked by the egress proxy (see §22) |
| Playwright Chromium | preinstalled build; run through an untracked scratch config pointing at it (as PR #292 did); removed afterwards |

No shared, staging or production database or Firebase project was touched.

## 4. Architecture found (before) and after

**Before:** `reevaluatePendingAdmissions` (Purchase domain) is a callable service nothing invokes. `index.ts` exports no scheduled/triggered Function. Commercial commands run through `runAdministratorCommand` and are attached to no endpoint. `composition/commercialAdmissionBinding.ts` is the only non-Commercial importer of Commercial.

**After:**

```
Commercial command  (runAdministratorCommand)
   ├─ PostgreSQL transaction ........ COMMIT  (mutation is final)
   └─ after commit: capacityIncreaseNotifier.notify()   ← Commercial-OWNED port (best effort)
                                                            failure/timeout: logged, swallowed
composition/heldPurchaseProcessorWiring.ts  (binds the port structurally; imports no Commercial module)
   └─ Firestore create  heldPurchaseReevaluationSignals/{business}__{window}   ← coalescing
         └─ onDocumentCreated  reevaluateHeldPurchasesOnSignal  ──┐
Cloud Scheduler "every 5 minutes"                                  │
         └─ onSchedule  recoverHeldPurchases ──────────────────────┤
                                                                   ▼
              domains/purchase/services/heldPurchaseRecovery.ts   (orchestration only)
                                                                   ▼
              reevaluatePendingAdmissions  (WP-COM-05b, unchanged policy)  →  admitOrHoldPurchase
```

## 5. Actual signalling semantics — and the "outbox" question

**This is not a transactional outbox.** Nothing is written in the Commercial PostgreSQL transaction. The Commercial mutation commits first; only then does a separate Firestore write happen. It is correctly described as a **best-effort post-commit signal + periodic reconciliation/recovery**. The code, comments, tests and runbook use that wording; a test asserts the notifier is called only after `runCommercialCommand` returns and never from a command body (so never inside a transaction).

A durable PostgreSQL outbox was **not** added: no Commercial outbox exists, the existing outbox tables belong to other domains and different consumers, and the recovery sweep already provides the eventual-consistency guarantee a durable outbox would otherwise give. Adding one would be a schema change with no behavioural gain at this scale.

Failure case — _Commercial mutation commits → signal fails_ — is proven (§18): the mutation stays committed; no partial admission; recovery later admits exactly once; the miss is logged (`capacity_signal_failed`).

## 6. Domain dependency direction

| | Before WP-COM-06a | After WP-COM-06a |
|---|---|---|
| Commercial → Purchase | none | **none** (a test scans every Commercial source's imports) |
| Purchase → Commercial | none | **none** (a test scans every Purchase source's imports) |
| Composition → both | `commercialAdmissionBinding.ts` (the only non-Commercial Commercial importer) | unchanged; the new `heldPurchaseProcessorWiring.ts` imports **no Commercial module** — the Commercial `CapacityIncreaseNotifier` port is satisfied structurally and checked by the compiler where a command is given the notifier; the Commercial admission port is obtained from the existing binding file |
| `index.ts` | imports the existing binding | additionally imports the new wiring (still no Commercial import) |

The Commercial side defines its own port (`models/commercialCapacitySignal.ts`) and calls it; it does not depend on Purchase implementation details. The existing 05b boundary test ("only the one composition root imports Commercial") passes unchanged.

## 7. Trigger-by-trigger eligibility

Eligibility inputs of the admission decision (`decideCommercialAdmission`): account existence, `serviceRestriction`, usable capacity (`balance − reserved`), the hold queue.

| Command | Raises eligibility? | Signals | Basis |
|---|---|---|---|
| `confirmSettlement` | Yes | `settlement_confirmed` | Paid `credit_grant` > 0 |
| `grantTrial` | Yes | `trial_granted` | Trial grant is always 3–5 units |
| `adjustTrial` | Only when delta > 0 | `trial_adjusted_up` | Negative delta cannot admit |
| `adjustCommercialCredit` | Only when delta > 0 | `credit_adjusted_up` | Negative delta cannot admit |
| `restoreCommercialStanding` | Yes | `standing_restored` | `restricted` → `none`; a no-op restore is refused, so success is always a real change |
| `activatePaidService` | **No — trigger not retained** | none | Sets only `paid_service_activated_at`. `decideCommercialAdmission` / `availableCapacity` never read it (a test asserts every decision input is unchanged by the command, and that the decision source never mentions the field). |
| `restrictNewStarts`, `voidSettlement`, `cancelSettlement`, `openCommercialAccount`, `setPriceSchedule`, `recordSettlement` | No | none | Cannot raise usable capacity |

For every signalling command: the signal happens only **after** commit; a signal failure is logged (`capacity_signal_failed`) and swallowed; the next scheduled run compensates. A rejected command (nothing committed) signals nothing; an idempotent **replay** re-signals (a client retry after a timeout is exactly when the first signal may have been lost; the signal is coalesced downstream).

## 8. Coalescing model

One Firestore document per **Business + 60-second window** (`{businessId}__{windowStartMs}`); trigger reasons are metadata (`reasons[]`, `signalCount`). The first signal `create()`s the document (firing the `onCreate` Function); later signals in the window only `update()` it (no second invocation). Different Businesses never share a document; a new window opens a new one. Proven against the real Firestore Emulator, including a concurrent burst of 8 signals → 1 document.

Trade-off, recorded: a capacity change committed after the window's processor run finished but inside the same minute is coalesced away until the next scheduled run (≤ 5 minutes). Processor idempotency remains the final safety net.

## 9. Scheduled function export / discovery

`recoverHeldPurchases` and `reevaluateHeldPurchasesOnSignal` are defined and **exported by name** from `functions/src/index.ts` (not a side-effect import). Verified three ways:

1. A test imports the entrypoint and asserts each export carries a deployable `__endpoint` with the right trigger (`scheduleTrigger` "every 5 minutes", maxInstances 1, retryCount 0, region `europe-west1`, timeout 300; Firestore `…document.v1.created` on `heldPurchaseReevaluationSignals/{signalId}`).
2. The compiled `lib/index.js` was loaded under Node and the same `__endpoint` metadata printed.
3. The **real Functions emulator** loaded the built entrypoint: `Loaded functions definitions from source: …, recoverHeldPurchases, reevaluateHeldPurchasesOnSignal`.

Not verified here: actually _running_ the scheduled/Firestore triggers under the emulator (it declined to start them because the Pub/Sub emulator and a Firestore-trigger download are blocked by the sandbox network) and a real deploy. The handler bodies are exercised directly by the PostgreSQL/emulator suites. **Nothing was deployed.**

## 10. Scheduler cadence and configuration

`every 5 minutes` — constant `HELD_PURCHASE_RECOVERY_SCHEDULE` in `composition/heldPurchaseProcessorWiring.ts`. **Deployment-time** (Cloud Scheduler reads it at deploy). There is **no runtime configuration**; a test asserts no environment variable decides it. Changing it means editing the constant and redeploying.

## 11. Business pagination / fairness (the 100-Business bound)

The original `listBusinessesWithPendingAdmission(limit)` orders by oldest Purchase and would select the same first 100 every run — a starvation blocker if used by a scheduler. Recovery therefore uses a **stable keyset**: Businesses ordered by `business_id`, `maxBusinesses` (100) per run, starting **after a persisted cursor** (`heldPurchaseProcessorState/businessCursor`), advanced after every Business (so a timeout or crash still progresses) and reset to the start when the list is exhausted (wrap, in the same run if the tail is empty). Every Business holding a Purchase is reached within `ceil(B/100)+1` runs.

Proof: real-SQL test with **105** seeded Businesses at the default bound — run 1 examines exactly 100 (cursor = the 100th), run 2 examines the remaining 5 and wraps; the union is all 105. A 5-Business test with `maxBusinesses=2` shows `[1,2] [3,4] [5]` then restart. Mutation check: disabling the persisted cursor fails the fairness test.

## 12. The 1000-Purchase window

**Blocker found and fixed.** WP-COM-05b examines the oldest 1000 held Purchases per Business and skip-and-continue re-examines the same window every pass. If those 1000 can never fit (for example large ones), row 1001+ was **unreachable forever** — a correctness/operational blocker. Fix, without raising any limit: every pass still examines the head window first (FIFO and skip-and-continue unchanged); if the head is **saturated**, one **tail window** is also examined strictly after a persisted per-Business keyset cursor `(purchase_date, id)` (microsecond-exact text round-trip), advancing each pass and wrapping at the end. Every held row is examined within `ceil(n/1000)` passes.

Proof: with a 3-row window, three large held Purchases fill the head and cannot fit; 05b alone admits nothing and re-examines the same three forever, while 06a admits the two small ones from the tail and leaves the large ones held and in order. A 1003-row seeded test checks exact arithmetic at the real 1000 boundary with tied timestamps (no gaps, no duplicates; id breaks ties). Saturation is observable (§17). Mutation check: disabling the tail window fails the test.

## 13. Failure classification

`services/admissionFailureClassification.ts`. Tested against **real PostgreSQL errors** (not only fabricated codes): a genuine deadlock `40P01`, lock timeout `55P03`, statement timeout `57014`, serialization failure `40001` and unique violation `23505`.

| Class | Includes | Behaviour |
|---|---|---|
| transient | `40001`, `40P01`, `55P03`, `57014`, `53300`, `57P01`, `57P03`, `08xxx`, `ECONNRESET`/`ETIMEDOUT`…, pool-exhaustion / terminated-connection messages, `admit:` key in progress | one in-run retry (short back-off); then recorded, Purchase stays held, next run retries |
| concurrency winner (not a failure) | another worker admitted it | counted `notPending`; a state error is accepted as a winner **only if a fresh read shows the Purchase left `pending_admission`**; if it is still pending it is an invariant breach → permanent |
| permanent | `23xxx` constraint violations, domain errors, idempotency **conflict**, any unrecognised error | not retried; logged at **error**; Purchase stays held and is re-examined next run (never parked silently) |

Isolation: per-Purchase (a failing Purchase is recorded and the scan continues — proven with a transient-persisting and a permanent failure alongside a healthy Purchase) and per-Business (a Business whose evaluation always throws does not stop another Business in the same run; the next run recovers it once healthy). The processor never throws for a Purchase; recovery never throws at all (its summary carries `status`).

Note: in 05b a thrown error aborted the whole pass. 06a changes that (required). The result type gains additive fields (`failedCount`, `businesses[]`); existing fields and all 05b tests are unchanged.

## 14. Concurrent winner / idempotency

Three concurrent Business passes over four held Purchases with capacity for all four: each Purchase admitted by exactly one worker, **zero failures**, `notPending > 0`, 4 admissions, accounting invariants hold. A race of two signal passes plus a scheduled sweep over four held Purchases and capacity for two: the oldest two admitted exactly once, no oversubscription, `paid_reserved = 2`, zero failures.

## 15. Business isolation

A signal for Business A processes only A (B's held Purchase untouched). Recovery isolates Businesses (§13). The coalescing document is per Business. Firestore state keys are per Business.

## 16. Post-commit failure / recovery proof (mandatory gate)

Tests in `heldPurchaseProcessor.postgres.test.ts` (real `confirmSettlement`, real Purchase commands):

1. **Commit visible before the signal:** inside `notify`, queried from a separate connection — the credit is already committed, the held Purchase is still `pending_admission`, and there is no admission row.
2. **Signal fails** → the command resolves, the settlement is `confirmed`, the paid balance is credited, **no** admission/earmark/reservation/idempotency key exists, the Purchase is untouched.
3. **Recovery** admits the Purchase; a second sweep admits nothing; exactly one admission; invariants hold.
4. **Trigger failure cannot roll back** `grantTrial`, `adjustTrial`, `adjustCommercialCredit`, `restoreCommercialStanding` (parameterised) or the settlement.
5. A notifier that **never answers** cannot hold the command beyond its bound (150 ms in the test; 3 s default); the mutation stands.
6. **Duplicate signals racing the scheduler** admit exactly once and never oversubscribe (§14).
7. A static test asserts the notifier is invoked only in the command runner, after `runCommercialCommand`, and never from a command body (so never in a transaction).

Mutation check: rethrowing a signal failure fails test 2.

## 17. Backlog observability — what actually exists

| Facility | Form |
|---|---|
| Structured logs | The repository's closed `OperationalLog` shape via the shared logger: `held_purchase_recovery_run` (result, duration), `held_purchase_business_pass_*`, `held_purchase_failed` (class, code, Purchase id), `held_purchase_scan_window_saturated`, `capacity_signal_failed`, `held_purchase_signal_malformed`. |
| Persisted operational state | Firestore `heldPurchaseProcessorRuns/{runId}` and `heldPurchaseProcessorState/latest`: status, duration, counts (admitted-from-pending, still-held, skipped-for-capacity, large-Purchase `skippedOvertaken`, not-pending, failed transient/permanent, Businesses examined/failed/saturated), cursors, `budgetExhausted`, `stateError`, and the backlog (total pending, Businesses with pending, **oldest pending age**, Businesses over the 1000 window, top-10 Businesses by pending). |
| Query service | `readHeldPurchaseBacklog(pool)` / `getHeldPurchaseBacklog` — read-only aggregates over the existing partial index. |
| Cloud Monitoring metrics / alerts | **Do not exist.** Nothing is exported until log-based metrics and alert policies are created from the log fields (a deployment action, not done here). The `OperationalLog` shape is closed (a change is a TRD20 change), so counts live in the persisted documents, not in log fields. |

Run documents carry an `expiresAt` for a Firestore TTL policy, which is **not** configured by this package.

## 18. Manual recovery

No new endpoint or UI. Supported paths (runbook §8): create a signal document for one Business via IAM-controlled Firestore access (Security Rules deny all client access to the new collections through the existing default-deny), or force-run the scheduler job. Both are repeat-safe. No Product Truth added.

## 19. Enablement (default OFF)

The processor is a no-op unless `PURCHASE_ADMISSION_GATE_MODE=enforce` or `HELD_PURCHASE_PROCESSOR_MODE=drain` (the latter only to drain held Purchases after rolling the gate back). With neither set, every entry point returns before touching PostgreSQL (a test passes a pool that throws on any access). A test asserts no committed configuration file (`firebase.json`, `.env`, workflows) names either variable, and that the only reader of the gate flag treats anything but the literal `"enforce"` as off.

## 20. Files

**Modified (8):** `functions/src/index.ts` (+2 exports, imports); `functions/src/domains/commercial/services/commercialAdministratorCommand.ts` (post-commit notifier, generic spec); `confirmSettlement.ts`, `grantTrial.ts`, `adjustTrial.ts`, `adjustCommercialCredit.ts`, `commercialRestriction.ts` (a one-line eligibility predicate each); `functions/src/domains/purchase/services/reevaluatePendingAdmissions.ts` (failure isolation, continuation window, scan statistics).

**New source (5):** `domains/commercial/models/commercialCapacitySignal.ts`; `domains/purchase/repositories/heldPurchaseRecoveryRepository.ts`; `domains/purchase/services/admissionFailureClassification.ts`; `domains/purchase/services/heldPurchaseRecovery.ts`; `composition/heldPurchaseProcessorWiring.ts`.

**New tests (4):** `domains/commercial/heldPurchaseProcessor.postgres.test.ts` (33), `composition/heldPurchaseProcessorWiring.emulator.test.ts` (8), `heldPurchaseProcessorFunctions.test.ts` (10: discovery, boundaries, default-OFF), `domains/purchase/services/admissionFailureClassification.test.ts` (18).

**Docs:** this report; `docs/runbooks/held-purchase-processor-runbook.md` (new); `docs/changes/IMPLEMENTATION_CHANGES.md`; `docs/00-governance/documentation-changes-log.md`.

**Not touched:** migrations (none added), `apps/`, `package.json`/lockfile, `firebase.json`, CI workflow, Redemption, Reward Program / Qualifying Item code, the WP-COM-04 projector, `admitOrHoldPurchase`, `admitPurchaseToLoyalty`, the Commercial admission service/model, the 05b policy, the 05b tests, the prototype.

## 21. Tests added and mutation evidence

| Suite | Count | Covers |
|---|---|---|
| PostgreSQL integration (live PG + Firestore emulator) | 33 | triggers & eligibility, post-commit gate, fairness (5 Businesses and 105 at default bound), tail window and rotation, exact 1000 boundary, skip-and-continue & same-stream order preserved, real DB error classification, transient/permanent/winner/invariant isolation, observability persistence, default-OFF, Business-scoped signal |
| Firestore emulator | 8 | coalescing (reasons merged, Business-isolated, window rollover, concurrent burst), id derivation, persisted cursors, logs at correct severity, saturation log, run summary persisted |
| Unit | 28 (10 + 18) | discovery & cadence, dependency direction both ways, no scheduling in domain code, no duplicated admission logic, signal-after-commit structure, gate default-OFF, classification table |

Four mutation checks, each confirmed to fail exactly the intended test, then reverted: (1) cursor never persisted → fairness test fails; (2) tail window disabled → window test fails; (3) signal failure rethrown → post-commit test fails; (4) deadlock classified permanent → classification test fails.

## 22. Validation record (this environment; disposable PostgreSQL 16 + Firebase emulators)

| Check | Result |
|---|---|
| `pnpm build` | pass |
| `pnpm lint` | 0 errors; 1 pre-existing `apps/web` warning |
| `pnpm format:check` | pass |
| `pnpm typecheck` | pass (tests are excluded from `tsc` by the repo; the four new test files were additionally type-checked with a scratch config) |
| `pnpm test` (unit) | functions **1971** pass (baseline 1943, +28) · web **926** pass (unchanged; `apps/` not touched) |
| PostgreSQL suite under Firestore emulator, **cold cache, fresh DB** (CI-equivalent) | **19 files, 671 tests pass** (baseline 18 / 638, +1 / +33) |
| Emulator suite (`test:emulator`) | **67 files, 875 passed, 3 skipped** (baseline 66 / 867, +1 / +8), run with `--only auth,firestore` because `pnpm emulators:validate` additionally starts the Storage emulator, whose JAR the sandbox blocks; the vitest set needs only Auth + Firestore |
| `pnpm test:e2e` | **41 passed** (Chromium via the preinstalled build; scratch config, removed) |
| Functions emulator discovery | both new Functions listed as loaded from source (§9) |
| Exact-head CI | see §33 |

**Pre-existing warm-cache ordering flake (not caused by this package).** With a **warm** vitest cache, `platformFoundationReadiness.postgres.test.ts` and `qualifyingItemRepository.postgres.test.ts` fail. Control run on an untouched `origin/main` worktree: cold cache passes (18 / 638); warm cache fails the **same two files**. PR #285 already records this for `platformFoundationReadiness`. CI always runs cold. The new PostgreSQL suite follows the other Commercial suites' convention (leave the database empty if it started empty) so it does not add to the problem.

## 23. Product Truth and boundary verification

| Boundary | Evidence |
|---|---|
| Product Truth | Unchanged. No customer/Business-visible text, status, field or UI changed; the held state is still neutral and payload-free. |
| WP-COM-05b admission policy, FIFO scan + skip-and-continue, same-stream no-overtake | Processor decision path untouched (`admitOrHoldPurchase`, port, decision model: zero diff). Tests: a large Purchase is skipped for a smaller later one; a younger Purchase of a stream is not admitted before its older one; the full 05b PostgreSQL suite passes unchanged. |
| Pooled negative-balance capacity | Zero diff to `availableCapacity` / decision; the 05b pinning test passes. |
| WP-COM-04 consumption timing / projector | Zero diff. |
| Redemption (`confirmRedemption`) | Zero diff; boundary test passes. |
| Reward Program / Qualifying Item | Zero diff; 05b boundary test passes. |
| Payment provider, Operator Console UI, Business read models, Experience Reference | Not touched; `apps/` zero diff. |
| **PB-013B P3-3** | **Remains OPEN.** Untouched and not worsened. |
| Gate | **DEFAULT OFF**; not enabled in any committed file; tests assert it. |
| WP-COM-06b | **Not started.** |

## 24. Deviations

- **D1 — no transactional outbox (deliberate).** §5.
- **D2 — added `skippedOvertaken`** (the large-Purchase starvation indicator the 05b policy header calls for "where practical"); computed within one pass, not across runs.
- **D3 — `reevaluatePendingAdmissions` modified** for failure isolation and a continuation window; its decision path is not. Previously a thrown error aborted the pass; now it is recorded.
- **D4 — default retry back-off lives in the recovery runner**, not the processor, to keep the existing 05b guard ("the processor schedules nothing — no timers") true.
- **D5 — new optional operational variable** `HELD_PURCHASE_PROCESSOR_MODE=drain` (not committed anywhere) so held Purchases can be drained after the gate is rolled back; absent by default.
- **D6 — idempotent replays re-signal**, deliberately (§7).
- **D7 — the new PostgreSQL test file copies the 05b fixture helpers** rather than refactoring them into a shared module (out of scope; the 05b test file is untouched) and uses a wider Loyalty-number generator, since the shared one yields only 8 distinct numbers.

## 25. Risks

| # | Risk | Mitigation / owner |
|---|---|---|
| R-1 | **No production path runs the Commercial commands**, so capacity cannot be provisioned or signalled through the product today; scheduled recovery is the only live path. | Condition before any pilot; whoever wires those commands passes `createAdmissionSignalNotifier(db)`. |
| R-2 | Cloud Scheduler job / Firestore trigger never deployed or run in a real project; Firestore database region vs `europe-west1` trigger region unverified; Pub/Sub emulator unavailable here. | Verify at first deploy to the dev project; runbook §11. |
| R-3 | No Cloud Monitoring metrics/alerts and no Firestore TTL policies exist. | Deployment actions listed in runbook §6, §11. |
| R-4 | Fixed-window coalescing can defer a same-minute change to the next scheduled run (≤ 5 min). | Documented; recovery cadence is the bound. |
| R-5 | The run time budget is checked between Businesses, not within a pass; a Business with ~2000 held rows is examined one Purchase per transaction. | Measure in the pilot; `budgetExhausted` flag surfaces it. |
| R-6 | Overlapping recovery runs (should not occur with `maxInstances: 1`) could examine the same Business slice twice. | Safe (idempotent); costs work only. |
| R-7 | Residual large-Purchase starvation (05b policy; no priority aging). | `skippedOvertaken` indicator; Founder policy decision. |
| R-8 | Pre-existing warm-cache PostgreSQL suite ordering flake. | Pre-existing; CI is cold. Recommend a separate hardening WP. |

## 26. Rollback

`git revert` the commit; no schema change, so no `migrateDown`. Runtime stop: unset the two environment variables (Functions become no-ops), pause the scheduler job, or delete the Functions. The three Firestore collections are inert and can be deleted. Detail: runbook §10.

## 27. Gate-enforcement readiness — technical assessment only

**READY WITH CONDITIONS** (not "ready for bounded pilot" yet). The processing, recovery, fairness, isolation, post-commit safety and observability behaviour is implemented and proven locally against real PostgreSQL and emulators. Conditions that must be met first (runbook §11): R-1 (a production path to run the Commercial commands, passing the notifier), R-2 (first real deploy confirms the schedule and the Firestore trigger run, and the database region is compatible), R-3 (log-based alerts and TTL policies), named daily owner of the `latest` state document, and Founder acceptance of the open 05b policy risks (R-7). **The gate remains OFF regardless.**

## 28. Next

`WP-COM-06b` — Business/Operator read models and the UI that surface the backlog and the held state. **Not started.** A separate, smaller package should wire the Commercial commands to a Platform-Administrator endpoint (R-1) if the pilot is to provision capacity through the product.

## 29. Change tracking

`docs/changes/IMPLEMENTATION_CHANGES.md` and `docs/00-governance/documentation-changes-log.md` (Entry 280) updated. No migration README change (no migration).
