# BUSINESS-REWARD-CYCLE-VISIBILITY-001 — Business-facing Reward / Loyalty-Cycle Visibility — Implementation Report

**Date:** 2026-09-26
**Status:** Implemented — awaiting independent review. Not merged.
**Authority:** Founder task `BUSINESS-REWARD-CYCLE-VISIBILITY-001`, implementing the next package recommended by the Master Programme Resumption Assessment and originally proposed in `PLATFORM-BASELINE-009` §11 (Business-facing Reward/Cycle visibility, read-only, decision-free prerequisite to Capability 6 redemption).
**Entry `origin/main`:** `65fc7ad0f5149e598613ade6896deeb5a3f99a95` (merge of PR #276).
**Branch:** `claude/cool-davinci-ke9sfo` (clean checkout at the entry SHA; no worktree needed — this cloud container holds no dirty primary checkout).

## 1. What this adds

A Business Owner or Manager can now see, for their own Business only:

- **Rewards ready** — every `available` Reward held by a Customer: Reward Program name, the Customer's Loyalty Number, the reward description and quantity (the governing version's snapshot), state, date it became available, and the Cycle number.
- **Customer progress** — each Customer's current Loyalty Cycle (`active` or `reward_available`) per Reward Program: verified units allocated, the threshold (governing version's `required_verified_units`), units to the next reward, units held pending for the next Cycle, Cycle state and number, and the Cycle's Reward if one exists.

Nothing can be changed from this surface.

## 2. Architecture analysis (verified before coding)

| Area | Finding on `origin/main` |
|---|---|
| Reward / Cycle models | `loyalty_cycles` (migration 0010), `rewards` (0012), `verified_unit_allocations` (0011, `pending` overflow), threshold on `reward_program_versions.required_verified_units` (0002, fixed at 10). All rows carry `business_id`; composite FKs prove program-in-Business. |
| Customer-facing read | `listAvailableRewardsForCustomer` → `loyaltyCycleRepository.listAvailableRewardsForCustomer` (customer-scoped SQL). Not reused: it is scoped by Customer, not Business, and carries no Business authorization. |
| Membership / permission model | Business reads are re-derived from the caller's live `businessMemberships` record, never the permission catalogues (`businessCallerAuthority.ts` §21: "the catalogues govern *mutating* within-Business authority"). Purchase reads: any active member (`authorizeBusinessPurchaseRead`). Precedent for role-narrowing a read without a new permission: `resolveAuthorizedBusinessForOwnerAction`. |
| Dashboard architecture | `BusinessDashboardRoutes` + `BusinessDashboardShell` (mobile hamburger / desktop sidebar); nav items are not role-filtered; pages derive the viewer's role from `useAccessibleBusinessesQuery` (`TeamManagementPage`). |
| Tenant scoping | Every Business-side SQL anchors on `business_id`; composite FKs make cross-Business rows structurally impossible to join. |
| Read-model conventions | Service in `purchaseQueries.ts`, bounded limit/offset (default 20, max 100), deterministic `… DESC, id DESC` ordering, whitelist transport parser in `index.ts`, `toHttpsError` mapping. |
| Customer identification for Businesses | `listPurchasesForBusiness` exposes `canonicalLoyaltyNumberValue`; the Purchases page shows "Customer loyalty number …". PRD1 §11: Businesses see the Loyalty Number. |
| Experience Reference | The separate 11thONUS prototype is not accessible from this repository or session. The slice therefore follows the already-assembled Business Dashboard conventions on `main` (bordered cards, mobile-first single column, shared shell) and introduces no state, rule, or permission beyond the server read model. |

**Strategy chosen:** one bounded read repository + two service functions in the existing purchase read-model module + two whitelisted callables + one read-only dashboard page. No reuse of the Customer endpoint (it would weaken Business authorization); no migration; no touch of the publication path.

## 3. Role authority finding

- **No existing permission** covers a Business-wide view of Customer reward/cycle state, and none is needed: reads are membership-derived by architecture, not catalogue-gated.
- **Owner + Manager, Staff excluded** is consistent with repository authority: PRD1 §6.3 (Owner: "view reports", "view all business purchase records"), §7.3 (Manager: "view transactions", "view operational reports"), §8.2/§8.3 (Staff: only "limited customer progress needed to complete the transaction"; may not "export customer lists"). This matches the Founder/programme direction.
- **Mechanism:** `authorizeBusinessLoyaltyVisibilityRead` — active membership in the requested Business with role `owner` or `manager`; otherwise `AUTH_FORBIDDEN` (identical for every failure cause).
- **No new permission** was created. **No Staff access. No Platform Administrator path** (only a Business membership can satisfy the gate).
- Not ambiguous, so no STOP was required.

## 4. Backend

- `functions/src/domains/purchase/models/businessLoyaltyVisibility.ts` — read DTO types.
- `functions/src/domains/purchase/repositories/businessLoyaltyVisibilityRepository.ts` — two SELECT-only queries. Both anchor on `business_id = $1` and join `reward_programs` on `(id, business_id)`. The Loyalty Number comes from a LATERAL read of the latest `purchase_records` row for the same Business and Customer; pending units come from summing `verified_unit_allocations` in state `pending`.
- `purchaseAuthorization.ts` — `authorizeBusinessLoyaltyVisibilityRead`.
- `purchaseQueries.ts` — `listAvailableRewardsForBusiness`, `listLoyaltyCycleProgressForBusiness` (authorize → paginate → read).
- `index.ts` — callables `listAvailableRewardsForBusiness`, `listLoyaltyCycleProgressForBusiness`; whitelist parser `parseBusinessLoyaltyVisibilityRequest` (`businessId`, optional `rewardProgramId`, `limit`, `offset` only).

**Not exposed:** Customer Identity id, authentication references, profile data, cycle/reward row ids, `business_id`, Commerce Knowledge ids.

## 5. Web

- `business/api/businessLoyaltyVisibility.ts` (wire types + adapters), `business/hooks/businessLoyaltyQueries.ts` (read hooks with an `enabled` flag), two Business-scoped query keys.
- `business/dashboard/CustomerRewardsProgressPage.tsx` at `/business/:id/dashboard/customer-rewards`, with a "Customer Rewards" nav entry. It is mobile-first (one column, two from `md`). It has loading, empty, populated and error+retry states. Staff and unknown roles see a notice and no read is issued. It has no action controls, and all numbers are rendered verbatim from the server.
- EN/FR strings (`loyaltyVisibility.*`, `dashboard.nav.customerRewards`).
- Dev-only Founder-QA harness fixtures (`DashboardHarnessPage.tsx`, never shipped) plus a real-browser spec.
- **Defect found and fixed during real-browser verification:** date formatting with the raw detected language tag threw on a non-BCP-47 tag (`en-US@posix`) and crashed the page. It now formats with `baseLanguage()` (`en`/`fr`). A regression test was added; it fails on the original line and passes after the fix.

## 6. Tenant isolation evidence

PostgreSQL + Firestore-emulator integration tests (`businessLoyaltyVisibility.postgres.test.ts`) run on real persisted state produced by `recordPurchase` → `verifyPurchase`. The fixture has two Businesses sharing one Customer:

- The Owner of Business B reading Business A is rejected (`AUTH_FORBIDDEN`) on both reads.
- The shared Customer's 5-unit progress at B and B's reward never appear in A's results. B sees only its own.
- Filtering A by B's Reward Program id returns nothing (the filter narrows, never widens).
- **Mutation check:** allowing Staff in the gate, and replacing the `business_id` predicate, each made the relevant tests fail (5 failures). Both originals were restored.

## 7. Tests

| Suite | Result |
|---|---|
| New PG + emulator integration (`businessLoyaltyVisibility`) | 14/14 |
| All PostgreSQL integration files | 259/259 (9 files) |
| Functions unit | 1850/1850 (162 files; +3 parser tests) |
| Functions Firestore emulator suite | 864 passed + 3 skipped (unchanged baseline) |
| Web unit | 919/919 (126 files; +17: new page 12, adapter 3, query keys 1, shell 1) |
| Playwright (`pnpm test:e2e`) | 41/41 (37 existing + 4 new Customer Rewards harness tests: 375px, 768px, 1280px) |
| Typecheck (both packages), ESLint (0 errors; 1 pre-existing warning in an untouched file), Prettier | clean |

Integration coverage: Owner read, Manager read (equal to Owner), Staff rejected, no membership / unknown Business / suspended Manager rejected, cross-Business isolation, available rewards, cycle progress, multiple programs, a Customer with no reward, a Customer with an available reward plus pending overflow, a never-transacted Customer absent, program filter, pagination bounds, no internal ids, empty Business, deterministic repeated reads, and zero writes (row counts unchanged across 12 tables).

**Environment notes:** a disposable local PostgreSQL 16 on port 54329 (scratch cluster outside the repo). The Firestore emulator was started via `firebase emulators:exec`. Playwright's pinned headless-shell build was absent from the container, so it was symlinked to the pre-installed build at the container level only; no repository config changed.

## 8. Boundaries confirmed

- Read-only: SELECT only. No redemption, fulfilment, cancellation, reversal, cycle/purchase/verification mutation, dispute resolution, Trust Event, Notification Intent, reward state, or cycle state added.
- **Reward redemption was NOT implemented in this task.**
- **PB-013B P3-3 remains OPEN / UNRESOLVED unless separately authorised.** The implementation never calls or depends on `publishRewardProgramVersion`. The integration test uses it only as seed setup, exactly as the existing purchase suite does. P3-3 must be completed before either the target-environment deployment of the Reward Program publication path or production Reward Program authoring/publishing Experience Assembly, whichever comes first.
- Migration 0019 was not executed. No migration was added (existing schema sufficed).
- No authentication, MFA, session, provider, billing, plan-gating, dependency or config change.

## 9. Programme-document sync

These are minimal, dated, fact-only notes; no capability status was promoted and no history was rewritten:

- `CDR-001` §2 Capability 4/5/6 rows: notes record the merged PLATFORM-BASELINE engine facts (with PR numbers), state explicitly "Not `Complete` under §10", and record that redemption is not implemented. Mapping PB packages onto `ENG-P4`–`ENG-P6` numbering was **not** performed, because it is a Founder decision.
- Master Workflow §17: a currency note pointing to the above.
- Engineering Implementation Programme / Coding-Agent Prompt Register: **not** changed. Retrofitting the PB series into their numbering is a larger, contentious reconciliation and is left as a separate item.

## 10. Risks

- **Loyalty Number as Customer identifier:** the value shown is the latest `canonical_loyalty_number_value` on this Business's own Purchase Records. That is the same data the Purchases page already shows, so exposure does not widen. If a Loyalty Number were ever reissued, older rows would show the latest one the Business recorded.
- **List bound:** the page requests up to 100 rows per list and says "Showing the first 100" at the cap; there is no paging UI yet.
- **Nav entry is visible to Staff** (the shell has no role filtering, as with every other entry). The page shows Staff a notice and issues no read, and the server denies it regardless.

## 11. Rollback

Revert the implementation commit. There is no schema, data, or configuration to roll back.
