# PLATFORM-BASELINE-006A — Purchase / Verification Transactional Spine / Implementation Report

**Date:** 2026-09-14
**Type:** Engineering implementation work package (first operational Purchase / Verification spine).
**Authority:** `PLATFORM-BASELINE-006-purchase-verification-entry-technical-design-2026-09-14.md` (merged, PR #252 — FINAL DESIGN CORRECTED / ITR-003 FINDINGS ADDRESSED).
**Disposition: IMPLEMENTED / AWAITING INDEPENDENT REVIEW. Do NOT merge.**

---

## 1. Entry repository state

- `git fetch origin`; `origin/main` verified exactly `a19c86a48b8c958fd09ce5be04edb462f7975bb0` (PR #252 design merge).
- Primary worktree `/Volumes/PRODUCTION/Projects/11THONUS` on branch `docs/dec-legal-002-bt-draft-007` with unrelated dirty legal/commercial work — **never touched** (verified clean separation via `git worktree list`; all work in `/tmp/11thonus-pb006a`).
- B68a385→a19c86a diff verified **docs-only** (3 docs files) before starting: the design's entry-state inventory (§4: zero purchase code, reusable seams) holds unchanged at the 006A entry head. **No material design-vs-codebase contradiction found** — one non-material schema note recorded in §22 (optional maximum-units cap).

## 2. Base SHA

`a19c86a48b8c958fd09ce5be04edb462f7975bb0` (`origin/main` at entry).

## 3. Branch

`feat/platform-baseline-006a-purchase-verification-spine` (created from `origin/main` in the isolated worktree).

## 4. Final implementation SHA

`f5352fb82cba6a6be75dd17029e46dad157063c3` (implementation commit; this reports commit follows on the same branch — PR head == reviewed head).

## 5. PR number

PR #253 — `https://github.com/Fkenogo/11THONUS/pull/253` (base `main`, head `feat/platform-baseline-006a-purchase-verification-spine`). Open, unmerged.

## 6. Files modified

Tracked modifications (19): 8 purchase callables + parsers + `toHttpsError` branch (`functions/src/index.ts`); evaluator classification/gate/Step-5c + 2 comment updates (`e
valuatePermission.ts`); `permissionErrors.ts` (new factory + disjointness message now naming 4 catalogues); `roleTemplate.ts` + `ordinaryPermissionCatalogue.ts` (stale `purchase.record`-as-ungoverned comment touch-ups); `evaluatePermission.test.ts` (ungoverned-id swap + new 006A block); `index.test.ts` (parser + transport tests); migrations `README.md`; `rewardProgramMigrations.postgres.test.ts` (0001–0014 pins + 006A `dropAll`); `platformFoundationReadiness.postgres.test.ts` (0001–0014 pin + 006A cleanup); Business shell/routes/queryKeys/`App.tsx`; customer `CustomerRoutes`/`CustomerShell` (+ header comment)/`CustomerShell.test.tsx`; locales `en.ts`/`fr.ts`.

New files (31): migrations `0007`–`0014` (+ 8 `.down.sql`); `functions/src/domains/purchase/` (models ×2, repositories ×6, services ×6, 1 cross-store test); `purchasePermissionCatalogue.ts`; web business api/hooks/page + tests (6); web customer api/hooks/pages + tests (8).

## 7. Code diff summary

- Backend: new `purchase` domain (4 commands, 5 query functions, 6 repositories, permission catalogue + evaluator branch, 9 callables). No existing domain logic altered except additive evaluator/catalogue branches and error-message text.
- Web: new Business `purchases` route + Customer `activity`/`rewards` real surfaces; EN/FR strings; api/hook layers with idempotency-key rotation.
- Tests: 34 cross-store PG tests, 9 evaluator tests, 4 parser/transport tests, 38 web tests (new/updated files).

## 8. Database migrations added

`0007_purchase_program_scope_uniques` (additive UNIQUEs on pre-existing tables) → `0008_purchase_records` → `0009_verified_units` → `0010_loyalty_cycles` → `0011_verified_unit_allocations` → `0012_rewards` → `0013_trust_events` → `0014_purchase_intents_outbox`. Each with a matching `.down.sql`. Migrations 0001–0006 untouched (verified by checksum validation in every run). Order avoids forward-reference FK failures (trust/intents/outbox last).

## 9. Schema/constraint summary

11 new tables exactly per design §20: `purchase_records` (A/B/C artifact columns, fact-preserving state CHECKs, single-verdict guard, reporting-pair CHECK, composite version∈program + program∈Business FKs, single directional replacement FK + one-replacement UNIQUE, identity-tuple UNIQUE); `purchase_record_events`; `verified_units` (purchase-tuple FK, reversal shape, one-credit-per-purchase + one-reversal-per-correction partial UNIQUEs, identity-tuple UNIQUE); `loyalty_cycle_streams` (PK parent); `loyalty_cycles` (0–10 CHECK, composite scope FKs, stream FK, governing-version UNIQUE, scoped sequence UNIQUE, one-current partial index); `verified_unit_allocations` (pending-shape CHECK, unit-tuple + cycle-scope FKs); `verified_unit_allocation_events` (shape CHECK); `rewards` (quantity=1, cycle-tuple + governing-version FKs, one-per-cycle UNIQUE); `trust_events` (subject-shape CHECK, causal + source-transition links, one-time lifetime UNIQUE + repeatable per-source UNIQUE); `notification_intents` (pending-only CHECK, per-source UNIQUE); `purchase_outbox`. Validated: full up (0001–0014) + full down + re-apply on a scratch DB through the real runner.

## 10. Domain services implemented

`recordPurchase` (19-step contract), `verifyPurchase` (atomic verify→unit→cycle→reward), `rejectPurchase`, `raisePurchaseDispute`, `purchaseQueries` (5 reads), `purchaseAuthorization` (`purchase.record` + membership reads), `purchaseRequestHash`.

## 11. Callables/API implemented

`recordPurchase`, `verifyPurchase`, `rejectPurchase`, `raisePurchaseDispute`, `listPurchasesForBusiness`, `getBusinessPurchaseRecord`, `listPurchasesWaitingForCustomer`, `getCustomerPurchaseRecord`, `listAvailableRewardsForCustomer` — whitelist parsers, actor resolution (business vs identity/read-only twins), `purchase_command_failed` transport mapping, no client authority fields accepted (mass-assignment-tested).

## 12. Permission changes

New disjoint `purchasePermissionCatalogue` (`purchase.record`, Staff/Manager/Owner per PRD5 §8, trial/active); evaluator `purchase` class + lifecycle gate + Step-5c role-default branch (no override path, revoke-override test proves it); `PermissionId` needed no change (open string). Reads stay membership/ownership-gated (no new catalogue entries).

## 13. Read models

Business list/get (membership-gated, same-Business enforced, status filter, limit/offset, `created_at DESC, id DESC`); Customer waiting list + get (ownership-scoped) + available rewards; get returns the lifecycle timeline; reads proven side-effect-free.

## 14. UI implemented

Business `purchases` route: record form (program select, artifact toggle, quantity/item/date/notes), status-filtered list, detail with event timeline. Customer `activity`: Waiting-for-You list, detail, verify/reject-with-5-reasons/dispute-with-3-reasons. Customer `rewards`: available rewards with governing terms. All exercise the real callables.

## 15. EN/FR localization

`business.purchase` (record/list/detail/statuses) + `customer.purchase` (waiting/detail/actions/5+3 reason labels/statuses/rewards) in full parity; nav entries; i18n parity suite passes; page tests assert EN + FR.

## 16. Idempotency implementation

Reused generic `idempotency_keys` with `purchase.create/verify/reject/dispute`; peek short-circuit + in-transaction atomic reserve; same/same replay, same/different conflict, in-progress retryable; reservation inside the domain transaction (rollback erases). Web hooks use `keyForRequest` rotation + `settleKeyOnError` (Business) and mirrored local helpers (customer).

## 17. Trust Event implementation

Causal + subject rows per transition in the same transaction; CORR-003 cardinality (one-time lifetime UNIQUEs; `loyalty_cycle.allocated` per-source UNIQUE); two-Purchases-one-Cycle coexistence proven; replay adds nothing; plain INSERTs (no silent swallow).

## 18. Notification Intent implementation

Durable source-linked intents per transition (`purchase_recorded_customer`, `purchase_verified_business`, `purchase_rejected_business`, `purchase_disputed_business`, `reward_available_customer`), `pending` by CHECK-enforced design, per-source structural UNIQUE; no delivery worker (deferred by design).

## 19. Cycle serialization/concurrency implementation

`loyalty_cycle_streams` parent (`INSERT … ON CONFLICT DO NOTHING` + `SELECT … FOR UPDATE`), stream-owned sequence counter, global lock ordering (idempotency→purchase→stream→cycle→reward→appends), partial-unique one-current backstop; proven: concurrent first verifies → one cycle (3+2=5); concurrent 9/10 → one crossing, no overfill, one reward.

## 20. Reward threshold implementation

Exactly one `available` Reward per cycle at 10 (`UNIQUE` backstop), `reward_quantity=1`, `available_at` set, terms = cycle `opened_under_version_id` (authority-answered, relationally enforced); version-bump test proves V1-pending verifies under V1 after V2 publishes.

## 21. Conservation guarantees

Constructional + test-enforced: `credit.quantity = SUM(current positions)` (split 2+2 proven; per-credit sums asserted in concurrency tests); `cycle.allocated_units = SUM(allocated positions)` (reconciliation query asserted); history rows never counted.

## 22. Cross-store handling

Firestore reads (auth, membership, artifact resolution, branch, knowledge) strictly pre-transaction; PG program/version proofs locked in-transaction; bounded-race disclosure per design §18 (snapshot rule, no distributed-transaction claim, live revalidation per command). One non-material schema note: the design's "optional Maximum Units per Purchase Record" has no governed home in the 005A version schema (`bulk_review_threshold` is review-only per DEC-LOY-003), so no cap is enforced or invented — quantity is governed by `quantity >= 1` + locked `multipleUnitsAllowed`. The task's "quantity above max" case is therefore not-applicable until a governed maximum field exists; recorded here explicitly, not silently redesigned.

## 23. Tests added

- `purchaseCommands.postgres.test.ts` (34 cross-store tests: §24 matrix incl. 5-case shared matrix, races, concurrency, version binding, cardinality, conservation, all 5+3 reasons, read isolation).
- Evaluator: 9 new tests (role×status allows, draft/suspended denies, revoke-override ignored, cross-business/unauthenticated denies) + ungoverned-id swap.
- `index.test.ts`: mass-assignment + transport mapping (4 tests).
- Web: api adapter tests (5), `PurchaseRecordsPage` (4), `CustomerActivityPage` (6), `CustomerRewardsPage` (3), updated shell routes (2 changed).
- Infra test updates: 0001–0014 pins, 006A cleanup in two files.

## 24. Commands executed

`pnpm install` (Node 20.20.0); `tsc --noEmit` (functions+web) clean; `eslint` (functions+web) clean (1 pre-existing unrelated warning); `prettier --write` on touched TS/TSX; full unit suites; full PG suite under `firebase emulators:exec --only firestore` (clean-DB re-run after a stale-state false alarm — see §35); `pnpm emulators:validate`; `pnpm build`; `git diff --check` clean. Local PG via the existing shared container (port 54329 already allocated by another worktree's instance — reused read-only as a server with a scratch DB, then the standard test DB; no other worktree's data touched).

## 25. Test results

- Functions unit: **158 files / 1756 tests pass** (was 1739 pre-change baseline per 005A report; +17 from evaluator/parser tests).
- Web unit: **116 files / 809 tests pass**.
- PostgreSQL (all 6 files, clean DB): **91/91 pass** (incl. 34 new purchase + updated migration pins).
- Emulator: **65 files / 833 pass, 3 pre-existing skips, 0 fail**.
- Migration up/down: full 0001–0014 apply, all 11 tables verified, full rollback, re-apply (scratch DB, real runner).
- Playwright e2e: **not run** — no purchase e2e seed/flow exists yet and none was added (see §36); the localhost Founder flow (§24/§28 of the design) is manual and remains to be exercised during independent review.

## 26. Dependencies added

None. No new npm packages (functions or web).

## 27. Config changes

None (no firebase.json, rules, env, CI workflow, or build config changes).

## 28. Risks

1. Pre-freeze PRD/TRD basis (design §27-R1) — unchanged, inherited.
2. DEC-AUTH-002 IdP direction — 006A uses the current TRD12 chain (inherited).
3. Quantity-mapping thinness (1:1) — inherited; plus the §22 maximum-cap note (new, minor).
4. Downstream-package coupling (006B, redemption, notification delivery must honor §§15–16/20/22–23 contracts).
5. Shared-test-DB ordering fragility: cross-store files leave `schema_migrations` populated by design (005A convention); an interrupted run can poison a later run's freshness-sensitive tests — observed once, resolved by recreating the disposable test DB. Disposable-local only; never production.
6. Cold-start hook flake: the new 34-test cross-store file's `beforeAll` once exceeded vitest's 10 s default hook timeout on a cold emulator+PG start — mitigated with an explicit 120 s hook timeout (test-only change).

## 29. Deferred items

Exactly the design §28 list: Reward redemption; Business-side dispute resolution; correction/replacement and reversal commands; expiry/cancellation/archival; notification delivery workers/providers; billing; analytics; POS/Mobile-Money/external-API integrations; hosted preview; Cloud SQL; auth-provider migration; phone-number lookup; multi-branch. Plus: purchase Playwright e2e seed/flow (see §36); the deferred oversized-pending split algorithm (future package).

## 30. Rollback instructions

- Unmerged PR: close the PR and delete the branch — `origin/main` is untouched.
- If migrations 0007–0014 were ever applied to a disposable DB: `migrateDown(pool, migrationsDir, 8)` (every migration has a tested `.down.sql`); validated on scratch.
- No Firestore writes are made by migrations; no shared/prod environment was touched.

## 31. Primary worktree safety

Primary worktree (`docs/dec-legal-002-bt-draft-007`, dirty legal/commercial work) never touched: all implementation in isolated worktree `/tmp/11thonus-pb006a` on a dedicated branch from `origin/main`. Pre/post `git status` of the primary worktree unchanged (its dirty set is unrelated and was never staged).

## 32. Report path

`docs/05-implementation/reports/PLATFORM-BASELINE-006A-purchase-verification-implementation-report-2026-09-14.md` (this file).

## 33. Changes-log/tracking record

Entry 227 appended to `docs/00-governance/documentation-changes-log.md` (controlled-update chain). No decision-register change (no new Founder decision; the §22 note answers to existing authority).

## 34. PR state

Open, unmerged, awaiting independent review (number/URL in §5 after opening).

## 35. CI state

**Green on the exact head.** `Build, Lint, Test, Emulator Validation` — SUCCESS on head `cd7dcce3ec919758bbf7c8d51b9b0a3710e7884b` (run `34876402984`, `https://github.com/Fkenogo/11THONUS/actions/runs/34876402984`). `mergeStateStatus` at last check: `UNSTABLE` (CI in progress at the time) → checks now `pass`; `mergeable: MERGEABLE`. CI steps include Build, Lint, Format check, Typecheck, Unit/component tests, PostgreSQL integration tests (full `test:postgres` under `firebase emulators:exec --only firestore`, covering the new 34-test cross-store file), Playwright e2e, and Firebase Emulator Suite validation — all success. No workflow change was needed or made (the 005A CORR-001.23 emulator-wrapped PG step already covers the new file).

## 36. Known limitations

1. No Playwright e2e for the purchase flow (no seed script added; e2e suite untouched and still green). The manual localhost Founder flow (design §24: trial Business → publish version → record → verify/reject/dispute → threshold journey → negative paths) is the prescribed review vehicle and is fully UI-supported.
2. `under_review` has no Business-side exit in 006A (006B boundary — by design).
3. Pending overflow accumulates but is never consumed in 006A (no redemption writer — by design).
4. Notification intents accumulate `pending` (no delivery worker — by design).
5. The "quantity above max" task case is not-applicable (§22).

## 37. Independent-review readiness

- Every task §2 item (1–24) is implemented; §3 exclusions respected (no behavior invented; forward-compatible columns only where the design explicitly names them).
- Evidence: 34 cross-store tests + 91/91 PG + 1756 functions + 809 web + 833 emulator + clean typecheck/lint/build + migration up/down proof.
- Review entry points: this report (§§8–22 for the load-bearing guarantees), the design §§15–16/20/22, `verifyPurchaseCommand.ts`, `loyaltyCycleRepository.ts`, migration `0008`–`0014`, `purchaseCommands.postgres.test.ts`.

## 38. Final disposition

**PLATFORM-BASELINE-006A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW. Do NOT merge.**
