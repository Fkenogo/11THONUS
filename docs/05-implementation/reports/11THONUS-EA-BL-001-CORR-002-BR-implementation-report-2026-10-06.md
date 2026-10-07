# 11THONUS — EA-BL-001-CORR-002-BR

## Business Review Domain Foundation — Implementation Report

> **Package:** `EA-BL-001-CORR-002-BR` · **Date:** 2026-10-06 · **Type:** backend / domain foundation (no UI)
> **Authority:** `DEC-PROD-015`; related `DEC-LOY-003`, `DEC-PROD-002`. Authorisation: PR #303 (merge `8d7491d6fa85879c6b2e75eed4198e18d073dd62`; corrected design head `5ed82867b1e06a5646040426f17f1b83f89a9257`). Design: [BR authorisation & design report](11THONUS-EA-BL-001-CORR-002-BR-authorisation-and-design-2026-10-06.md).
> **Status:** **IMPLEMENTED — TECHNICAL REVIEW PENDING** (pre-review correction applied, §15). Not Complete. Slice B/C are **not** authorised by this package.
> **Boundaries held:** no Staff UI, no Owner/Manager UI, no Slice B/C/D/E, no EA-BL-002, no WP-COM source change, no FEF-TLC adoption, no deployment, no self-review exception, no Staff review path, PR left open and unmerged.

---

## 1. Entry repository state

Branch `feat/ea-bl-001-corr-002-br-implementation` from `origin/main` `8d7491d6fa85879c6b2e75eed4198e18d073dd62` (merge of PR #303). Migration head at entry: `0027`. All current-main lifecycle assumptions in the authorised design were verified against code; **no stop condition was triggered** (no discrepancy with the design, `0028` was free, no new table, Staff structurally ineligible without a permission redesign, the commercial semantics untouched).

## 2. Implementation strategy (as executed)

Additive only, following the existing purchase-command architecture:

1. One additive migration (`0028`) for status vocabulary, integrity, transition guard, per-version threshold, reviewer attribution, and evidence vocabularies. **No new table.**
2. Pure routing function evaluated from the **locked** `reward_program_versions` row inside `recordPurchase`'s existing transaction (no new read, no race).
3. A separate permission catalogue module (the `DEC-LOY-017/018` precedent) registered in the existing Sensitive catalogue, so evaluation, override administration and mandatory audit reuse the existing architecture.
4. Two decision commands + a bounded queue read, copying the existing command skeleton (idempotency → row lock → precondition → conditional transition → evidence → idempotency completion).
5. Smallest possible customer read/copy change: a neutral status token mapped to EN/FR copy.

## 3. Migration — `0028_business_review_foundation` (+ `.down.sql`)

- `reward_program_versions.business_review_quantity_threshold INTEGER NULL`, `CHECK (… IS NULL OR … >= 1)`. `NULL` = Business Review disabled. Routing only.
- `purchase_records`: `business_review_decision` (`approved|rejected`), `business_review_reviewer_user_id`, `business_review_decided_at`, `business_review_reason` (bounded vocabulary, **distinct from** customer `rejection_reason`).
- `purchase_records_status_check` gains `business_review_required`; `purchase_records_verified_fields` extended: `business_review_required` carries no verdict facts; `rejected` has exactly two disjoint provenances (customer reason XOR business-review reason).
- `purchase_records_business_review_fields` (the four attribution columns move together; approved ⇒ no reason; rejected ⇒ reason + `rejected`); `purchase_records_business_review_not_self` (`reviewer <> recorded_by_user_id`, DB backstop to the in-transaction rule).
- Guard trigger `purchase_records_business_review_guard`: `business_review_required` can be entered **only at INSERT**; it can leave **only** to `waiting_for_customer` (with `approved`) or `rejected` (with `rejected`); decisions are immutable once recorded. Existing edges between other statuses are deliberately not re-governed.
- Partial index `purchase_records_business_review_queue_idx` (rows awaiting review only).
- Evidence vocabularies extended in the single trust ledger / intents / outbox (no parallel audit system); unique index so a Purchase is reviewed at most once per event type.
- **Down migration fails closed** while any Purchase is in/decided from review, any version carries a threshold, or any BR evidence row exists; it never silently relabels or deletes governed meaning. No old migration was edited.

## 4. State machine

`∅ → waiting_for_customer`, `∅ → business_review_required`, `business_review_required → waiting_for_customer`, `business_review_required → rejected`. No new exits from `under_review`, `pending_admission`, `verified`, `rejected`, `corrected`, `cancelled`, `expired`, `archived`. `under_review`, `pending_admission`, customer `rejection_reason` and `bulk_review_threshold` are untouched.

## 5. Record-purchase routing & threshold

`resolveBusinessReviewRouting({threshold, quantity})` (`businessReviewRouting.ts`): `NULL` → waiting; `quantity < threshold` → waiting; `quantity >= threshold` → `business_review_required`; an invalid threshold fails closed to *disabled*. Threshold read from the same `FOR UPDATE` version row that supplies `multipleUnitsAllowed`. Never a cap, never a rejection, never loyalty math; `multipleUnitsAllowed=false` still caps at 1. On the review path: lifecycle event `∅ → business_review_required`, Trust Event `purchase.recorded` + `purchase.business_review_required` (frozen threshold evidence on the internal ledger only — **not** on the Staff-readable lifecycle event), a **Business** notification intent (the Customer is *not* asked to verify), outbox `purchase_recorded` + `purchase_business_review_required`. `RecordPurchaseResult` gains an additive `review: {required, status}` field (backward compatible).

The threshold is configurable per Reward Program Version through the existing create / draft-update / next-version commands (`businessReviewQuantityThreshold`; `undefined` carries forward, `null` disables, integer enables). An edit that does not mention the field can never silently disable review. The request-hash identity includes the field **only when supplied**, so pre-existing idempotency reservations keep matching.

## 6. Permission

`purchase.businessReview` (module `purchaseBusinessReviewPermissionCatalogue.ts`, registered in the Sensitive catalogue): Owner floor; Manager default via `owner_and_manager_default`, revocable and re-grantable through the existing override mechanism; mandatory audit; legacy Sensitive lifecycle set (`trial`, `active` — the redemption-style `suspended` default-allow does **not** transfer).

**Staff structural ineligibility (two independent layers, both tested):** `explicitGrantEligibleRoles = ["manager"]` so (1) `createPermissionOverride` refuses a Staff-targeted grant; (2) the evaluator independently returns `GRANT_NOT_HONORED` for a fabricated/stale persisted Staff grant (verified in a pure evaluator test **and** end-to-end with a forged Firestore membership document). A third backstop: `authorizePurchaseBusinessReview` narrows to Owner/Manager regardless of the evaluator result. Platform Administrator has no implicit tenant authority (no evaluator path; a non-member fails closed); a Customer holds no Business membership.

**Self-review:** `reviewer_user_id != recorded_by_user_id`, enforced after the row lock inside the transaction, role-blind, with the DB CHECK as a backstop. A single-owner Business whose Owner recorded the Purchase **fails closed** (no exception).

## 7. Commands, API, reads

- `approveBusinessReview` / `rejectBusinessReview` (`businessReviewCommands.ts`). Reviewer, role, Business scope and permission are resolved server-side; request whitelist = `businessId`, `purchaseRecordId`, optional bounded `note`, and (reject) `reason`. Live authority evaluated on every attempt (audited, allow **and** deny) and **re-validated at the mutation boundary** after the lock. Cross-Business purchase is indistinguishable from missing.
- Callables in `functions/src/index.ts`: `approveBusinessReview`, `rejectBusinessReview`, `listBusinessReviewQueue` (Business-authenticated, idempotency-key parser reused).
- `listBusinessReviewQueue`: Business-scoped, oldest-first, bounded and paginated, gated by the same live permission as the decisions (Staff, revoked Manager, Platform Admin, Customer all fail closed). Per-purchase history is the existing lifecycle timeline.
- **Business-rejection reason vocabulary (distinct column, not customer `rejection_reason`):** `quantity_not_confirmed | transaction_not_confirmed | other`. Deliberately minimal and not a fraud taxonomy (`DEC-PROD-015`); never customer-visible. **Flagged for Founder confirmation** — see §12.

## 8. Evidence, idempotency, concurrency

Per decision, in one transaction: `purchase_record_events` row (reviewer attribution, reason on reject, optional note in payload) → Trust Event `purchase.business_review_approved|rejected` → Business and Customer notification intents (ids only; no reviewer identity, reason or threshold) → outbox → idempotency completion. Sensitive-decision audit recorded via the existing `recordSensitiveDecisionStandalone` under the caller's idempotency key. Same key + same body replays with no duplicate evidence; same key + different body → idempotency conflict; new key after a decision → stale-state failure (`INVALID_STATE_TRANSITION`); approve+approve and approve+reject have exactly one winner; a customer verify cannot leapfrog the review (it requires `waiting_for_customer`). Lock order is unchanged from the existing purchase commands.

## 9. Customer isolation & copy

Customer verify / reject / dispute / waiting-queue reads all already require `status = 'waiting_for_customer'`, so a review-required Purchase is excluded **by construction** (and proven by tests). Activity projection maps the internal state to the neutral token `awaiting_business_confirmation` (no internal enum, reviewer or threshold exposed). EN: "Waiting for business confirmation"; FR: "En attente de confirmation du commerce". Business-side status labels added for the Business purchase records filter/list; no new screens.

## 10. Commercial orthogonality

Sequence preserved: `business_review_required → (approve) → waiting_for_customer → customer verify → existing commercial admission → verified | pending_admission`. **No WP-COM source file was modified.** Commercial test files changed only to account for migration `0028` becoming the migration head (rollback step counts / applied-version lists); `commercialBoundary.test.ts` exempts the `0028` migration from its "no `pending_admission` outside 0026" scan because `0028` necessarily restates the status vocabulary. A dedicated end-to-end "approve → verify under an enforced gate" test was **not** added (it would extend a WP-COM test file); orthogonality is established by construction (approval produces the ordinary `waiting_for_customer` state, the commercial code is untouched, and the unmodified commercial suites pass).

## 11. Validation (exact, local, against a disposable PostgreSQL 17 + Firestore/Auth emulators)

| Gate | Result |
|---|---|
| `pnpm build` | PASS (functions, web) |
| `pnpm typecheck` | PASS (functions, web) |
| `eslint` on every changed file | PASS |
| `prettier --check` on every changed file | PASS |
| functions unit (`pnpm test`) | **2015 passed**, 176 files (see §15 for the corrected-head counts) |
| web unit (`pnpm test`) | **938 passed**, 130 files |
| PostgreSQL + Firestore emulator (`test:postgres`) | **724 passed**, 20 files (includes 37 BR integration tests + 10 new 0028 migration tests) |
| Firestore + Auth emulator (`test:emulator`) | **877 passed**, 3 skipped (pre-existing skips), 67 files |
| `test:preview-tooling` | 44 / 44 |

New tests: `businessReview.postgres.test.ts` (37), `evaluatePermission.businessReview.test.ts`, `purchaseBusinessReviewPermissionCatalogue.test.ts`, `businessReviewRouting.test.ts`, parser mass-assignment tests (`index.test.ts`), EN/FR copy test (`i18n.test.tsx`), 0028 migration block in `rewardProgramMigrations.postgres.test.ts`. See the PR for the CI run on the exact head.

Failures encountered and disposition: (a) migration-head bookkeeping in six pre-existing migration tests — expected, fixed in this branch; (b) `Finding 6` idempotency-hash test — **a real regression caught by the suite** (the new threshold changed the create-program request hash); fixed so an absent field hashes as before; (c) one `PhoneAuthHarnessPage` timing test failed once while a full-repo `eslint` ran concurrently, passed in isolation and on the clean full re-run (timing flake under load; not exercised by this package; not independently re-proven against `origin/main`).

## 12. Architecture deviations & items for Founder / reviewer attention

1. **Permission identifier — CONFIRMED by the Founder (PR #304 disposition):** the canonical code identifier is **`purchase.businessReview`** (repository camelCase action convention, e.g. `staff.assignPermissions`; satisfies `PermissionId` syntax). The earlier design shorthand `purchase.business_review` is a conceptual name only and must not be used in code.
2. **Business-review reason vocabulary — APPROVED:** `quantity_not_confirmed | transaction_not_confirmed | other`; not to be expanded. Refinement: `other` **requires** a non-empty bounded internal note (§15).
3. **Sole-reviewer deadlock — CONFIRMED fail-closed:** a single-owner Business whose Owner records a threshold-crossing Purchase cannot advance it until a second eligible reviewer exists. No bypass or exception.
4. Purchases recorded before this package replay a stored `recordPurchase` result without the new additive `review` field; callers must treat it as optional on replays.

## 13. Risks & rollback

Risks: reason vocabulary (item 2); deadlock (item 3); the `0028` guard trigger governs only the Business Review state (no behaviour change for other edges). **Rollback:** revert the branch/PR. A database that holds *no* Business Review data rolls back cleanly (`0028.down`); a populated database **refuses** rollback by design (resolve the review Purchases and clear thresholds, or restore a pre-`0028` backup).

## 14. Programme status

`EA-BL-001-CORR-002-BR`: **IMPLEMENTED — TECHNICAL REVIEW PENDING** (not Complete). Slice B remains **blocked** until BR is independently reviewed, accepted and merged; Slice B/C/D/E and EA-BL-002 are not authorised. WP-COM untouched; FEF-TLC-001 not adopted. Final verdict: **IMPLEMENTED — READY FOR INDEPENDENT TECHNICAL REVIEW.**

---

## 15. PR #304 pre-review correction (Founder-directed; BR not redesigned)

Founder dispositions applied: permission id `purchase.businessReview` confirmed (§12.1); vocabulary approved and `other` requires a note; sole-reviewer fail-closed confirmed. Four open review findings plus two omitted proofs were corrected. Entry head `e2697cf491eec366500db4ad8f1a938ccc02ca5a`.

| # | Finding | Root cause | Resolution |
|---|---|---|---|
| A (P1) | Customer waiting list leaked reviewer evidence | `listPurchasesWaitingForCustomer` returned raw rows; after approval the row is `waiting_for_customer` again but keeps `businessReviewReviewerUserId/DecidedAt/Decision/Reason` | Every customer-facing row now goes through `redactPurchaseForCustomer` (exported). The same redaction is applied at the callable boundary to the `purchase` returned by `verifyPurchase`, `rejectPurchase` and `raisePurchaseDispute` (same leak class: those commands return the raw row after approval). |
| B (P1) | Staff could enumerate the protected queue via the generic list | `listPurchasesForBusiness` was membership-gated only and accepted `status=business_review_required` | New live, non-throwing `hasBusinessReviewAuthority` (same evaluation as the decisions). Non-reviewers: the review-required filter → `AUTH_FORBIDDEN`; the unfiltered list excludes review-required rows in SQL (`excludeBusinessReview`, pagination stays correct); ordinary statuses unchanged. Detail read: a review-required id is `RESOURCE_NOT_FOUND` for non-reviewers; after a decision, reviewer identity/decision time/reason and review event payload/notes are redacted for non-reviewers. Owner/authorised Manager keep the full view. |
| C (P1) | Staff received the review threshold | `businessReviewQuantityThreshold` was mapped into the membership-gated `getRewardProgram` / `listRewardPrograms` | Server-side redaction: only live `purchase.businessReview` holders (Owner, authorised Manager) receive it; for everyone else the **key is absent** (not `null`, which would read as "disabled"). Staff recording is unaffected (routing reads the locked version server-side) and Staff receive only the routing outcome. No web type/UI referenced the field. |
| D (P2) | Recording confirmation said "waiting for the customer" for review-routed Purchases | Web `RecordPurchaseResult` dropped the server `review` outcome | `review` preserved through the adapter (optional; falls back to `purchase.status` for pre-existing replays). `PurchaseRecordsPage` shows `purchase.recordSuccessReview` — EN "Purchase recorded. Business review is required before customer confirmation." / FR "Achat enregistré. Une validation du commerce est requise avant la confirmation du client." No threshold/reviewer/config disclosed. |
| E | `other` reason without audit context | — | `rejectBusinessReview`: `reason = other` requires a non-empty (≤500) note → `VALIDATION_FAILED` otherwise; the other two reasons keep an optional note. The note stays in the internal lifecycle event payload and is redacted from every Customer/non-reviewer read. |
| F | Missing commercial-gate proof | omitted in the first pass | `commercial/businessReviewOrthogonality.postgres.test.ts` (new file; no Commercial source touched). Under `gate = enforce` with the real `createCommercialAdmissionPort()`: review-required cannot be verified and invokes no admission; approval creates no admission/blocks/units/cycle/reward; Customer verify then yields the existing `admitted` (capacity) or `pending_admission` (no capacity); the lifecycle edges are exactly `∅→business_review_required → waiting_for_customer → pending_admission`; the DB refuses `business_review_required → pending_admission`. The test lives under `domains/commercial/` because the WP-COM boundary test forbids code outside it from importing Commercial. |

**Commercial test-file diffs (verified):** the eight modified WP-COM test files change only migration bookkeeping — the `schema_migrations` cleanup version lists gain `'0028'`, and rollback step counts / expected applied/rolled-back lists gain `0028`. No behavioural assertion was removed, loosened or altered. One non-mechanical edit: `commercialBoundary.test.ts` exempts migration `0028` from the "no `pending_admission` in migrations outside 0026" scan; this was **tightened** in the correction so `0028` may only restate the quoted status literal inside CHECK lists (after removing `'pending_admission'` literals the file must not contain the word at all) and the existing "no `commercial_admissions` outside 0027" rule still applies to it. **No WP-COM source (non-test) file is modified.**

**Invariants re-confirmed by tests:** distinct `business_review_required`; `under_review`, `pending_admission` semantics and `bulk_review_threshold` untouched; customer `rejection_reason` untouched and distinct from the business-review reason; Owner / authorised Manager only; Staff structurally ineligible (constructor + evaluator + role narrowing; fabricated Staff grant ineffective on decisions, queue, generic list, detail and threshold reads); self-review prohibited (no sole-reviewer exception); approval → `waiting_for_customer` only; approval and rejection create zero Verified Units / Cycle progress / Rewards; Customer verification mandatory; threshold routing-only and server-authoritative from the locked version; threshold not exposed to Staff; queue not enumerable by Staff; reviewer identity not Customer-visible.

**Observation (not changed, out of scope):** existing Customer purchase reads already expose the recorder's `recordedByUserId`; this predates BR and is not reviewer evidence. **Manager threshold read** is governed by the live `purchase.businessReview` evaluation (revoked Manager does not see it); the write-command results (Owner-only `rewardProgram.manage`) are unchanged.

**Validation on the corrected code (local, disposable PostgreSQL 17 + Firestore/Auth emulators):** functions unit **2015** (176 files); web unit **941** (130 files); PostgreSQL + emulator **746** (21 files; 54 BR integration + 3 commercial-gate + 10 migration-0028 + the existing suites); Firestore/Auth emulator **877** (+3 pre-existing skips, 67 files); typecheck, format check and eslint on all changed files green. Repo-wide `eslint .` on this machine ran out of memory (`FatalProcessOutOfMemory`, exit 134, also with `NODE_OPTIONS=--max-old-space-size=8192`) because git-ignored stale worktree checkouts (`.claude/worktrees`, `.kilo/worktrees`) are linted too; with `NODE_OPTIONS=--max-old-space-size=6144 npx eslint . --ignore-pattern ".claude/**" --ignore-pattern ".kilo/**"` it completes with **0 errors and 1 pre-existing warning** (`react-refresh/only-export-components` in the untouched `apps/web/src/business/BusinessApiContext.tsx`). **The lint gate is considered closed only by the green exact-head GitHub CI run**, recorded on PR #304 together with the corrected head SHA (a document cannot contain its own commit SHA).

**Test-order note (pre-existing, not caused by BR):** several PostgreSQL suites tear down by dropping tables and do not know about migration `0027`'s tables, so a *local* re-run that orders `platformFoundationReadiness`/`qualifyingItem*` before a commercial suite can fail with `relation "commercial_admissions" already exists` on a database that previous runs polluted. A clean database and a cleared vitest result cache (neutral ordering) pass 746/746; the Postgres suite is not part of the GitHub CI job.

Unresolved findings: none known at the time of writing.
