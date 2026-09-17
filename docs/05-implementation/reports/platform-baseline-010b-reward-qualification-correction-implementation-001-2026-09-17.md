# PLATFORM-BASELINE-010B-REWARD-QUALIFICATION-CORRECTION-IMPLEMENTATION-001 — Implementation Report

**Date:** 2026-09-17
**Type:** Bounded correction implementation — makes `rewardProgramCategoryId` optional end-to-end and adds Business-Type-scoped + platform-wide-search qualifying-node discovery, per an already-recorded Founder decision. No new Founder decision, no decision-register change, no Commerce Knowledge taxonomy change, no non-qualification-boundary domain change.

---

## 1. Entry state

- Entry `origin/main` SHA (as given/confirmed via `git rev-parse HEAD` in the isolated worktree): `97fb91623497a0031447e8323a8a4159f6e09d80`.
- Branch: `feat/platform-baseline-010b-reward-qualification-correction-001`, in the isolated worktree `/Volumes/PRODUCTION/Projects/11THONUS-worktrees/platform-baseline-010b-reward-qualification-correction-001`. The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, unrelated legal-drafting branch `docs/dec-legal-002-bt-draft-007`) was never entered, read, or modified.

## 2. Background

A prior read-only investigation (`PLATFORM-BASELINE-010-REWARD-CATEGORY-AUTHORITY-TRACE-001`) found `rewardProgramCategoryId` to be a hard, non-optional prerequisite for Reward Program creation — enforced at the transport layer (`index.ts`), domain validation (`rewardProgramKnowledgeValidation.ts`), and the PostgreSQL schema (`reward_programs.reward_program_category_id TEXT NOT NULL`) — while zero `reward_program_category` Commerce-Knowledge nodes are seeded anywhere in the repository, making Reward Program creation unusable end-to-end in any environment using only the shipped seed content. This traces to genuinely Founder-authored product documents present since repo genesis, not code drift, but conflicted with the Founder's actual Phase 1 intent.

The Founder then issued `DEC-LOY-014` / `FD-REWARD-QUALIFICATION-001` (already recorded in governance docs; this package does not create or touch it): for Phase 1, a Reward Program does **not** require a Reward Program Category. The Business-selected canonical `standard_product`/`standard_service` node(s) are the operative qualification definition. Business Type/Commerce Knowledge relationships may assist *discovery* only, never become a second write-time qualification gate — an eligible node outside a Business's default discovery scope must remain reachable and selectable, and the server must accept it exactly as it would a default-scope node.

A design (`PLATFORM-BASELINE-010A`) was produced against that decision; this package (`PLATFORM-BASELINE-010B`) implements it.

## 3. Files created/modified — one-line summary per file

### Created
- `functions/src/infrastructure/postgres/migrations/0015_reward_programs_category_optional.sql` — forward migration, `DROP NOT NULL` on `reward_program_category_id`.
- `functions/src/infrastructure/postgres/migrations/0015_reward_programs_category_optional.down.sql` — rollback, documents the "no existing NULL rows" precondition in a comment.
- `docs/05-implementation/reports/platform-baseline-010b-reward-qualification-correction-implementation-001-2026-09-17.md` — this report.

### Modified — backend (`functions/`)
- `src/domains/rewardProgram/models/rewardProgram.ts` — `RewardProgramRow.rewardProgramCategoryId` widened to `string | null`.
- `src/domains/rewardProgram/repositories/rewardProgramRepository.ts` — `ProgramDbRow`/`CreateRewardProgramParams` category field widened to `string | null`; insert/mapping unchanged otherwise (parameterized `NULL` binds correctly as-is).
- `src/domains/rewardProgram/services/createRewardProgramCommand.ts` — `CreateRewardProgramRequest.rewardProgramCategoryId` widened to `string | null`.
- `src/domains/rewardProgram/services/rewardProgramKnowledgeValidation.ts` — new `validateOptionalCategoryReference` wrapper; `validateAllReferences` skips category validation when `null`; `validateStandardRewardNodeReference`/`validateQualifyingNodes` untouched.
- `src/domains/commerceKnowledge/models/commerceKnowledgeErrors.ts` — new `businessTypeNotFoundForNodeListingError`.
- `src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts` — two new additive reads: `listQualifyingNodesForBusinessType`, `searchQualifyingNodes`. The three pre-existing reads (`listRewardProgramCategories`, `listQualifyingNodesForCategory`, `resolveKnowledgeNodeLabels`) are byte-for-byte unmodified aside from the new imports/functions being appended.
- `src/index.ts` — `parseCreateRewardProgramRequest`'s `rewardProgramCategoryId` parsing made optional (mirrors `standardRewardNodeId`'s pattern); new `parseOptionalSearchText` helper; two new callables `listQualifyingNodesForBusinessType`, `searchQualifyingNodes` registered in the exact existing authentication-only pattern.

### Modified — backend tests (`functions/`)
- `src/index.test.ts` — 3 new tests for omitted/null/empty-but-invalid `rewardProgramCategoryId` parsing.
- `src/domains/rewardProgram/services/rewardProgramCommands.postgres.test.ts` — 11 new integration tests (items A–J, Q, S below).
- `src/domains/commerceKnowledge/services/commerceKnowledgeReadService.emulator.test.ts` — 14 new tests for the two new discovery functions.
- `src/infrastructure/postgres/rewardProgramMigrations.postgres.test.ts` — migration-count assertions updated 14→15 (5 occurrences); 2 new tests (nullable-column direct check; migration-against-pre-existing-rows, item J).
- `src/infrastructure/postgres/platformFoundationReadiness.postgres.test.ts` — one assertion updated to include `"0015"`.

### Modified — frontend (`apps/web/`)
- `src/business/api/commerceKnowledge.ts` — two new adapters: `toCallListQualifyingNodesForBusinessType`/`makeCallListQualifyingNodesForBusinessType`, `toCallSearchQualifyingNodes`/`makeCallSearchQualifyingNodes`. Pre-existing three adapters untouched.
- `src/business/api/rewardProgramMutations.ts` — `RewardProgramWire.rewardProgramCategoryId` and `CreateRewardProgramRequest.rewardProgramCategoryId` widened to optional/nullable.
- `src/business/hooks/queryKeys.ts` — two new keys: `qualifyingNodesForBusinessType`, `searchQualifyingNodes` (both `languageCode`-scoped, matching the existing convention).
- `src/business/hooks/businessQueries.ts` — two new hooks: `useQualifyingNodesForBusinessTypeQuery`, `useSearchQualifyingNodesQuery`. `useRewardProgramCategoriesQuery`/`useQualifyingNodesForCategoryQuery`/`useKnowledgeNodeLabelsQuery` untouched (still exported, still used by nothing new — the page no longer imports the first two).
- `src/business/dashboard/QualifyingNodeSelector.tsx` — redesigned: `categoryId` prop replaced by `businessTypeId`; default candidates now come from `useQualifyingNodesForBusinessTypeQuery`; a new search input (`useSearchQualifyingNodesQuery`) is the escape hatch; unresolved-id detection now checks both candidate sources.
- `src/business/dashboard/RewardProgramManagementPage.tsx` — Reward Program Category `Select` removed from the create form entirely; `DraftFormState`/`emptyDraftForm`/submit payloads no longer carry `rewardProgramCategoryId`; both `QualifyingNodeSelector` usages now pass `businessTypeId={context.businessTypeId}`.
- `src/i18n/locales/en.ts` / `src/i18n/locales/fr.ts` — removed `rewardProgram.fieldCategory`/`rewardProgram.category.*` keys; removed `qualifyingNodeSelector.chooseCategoryFirst`; added `qualifyingNodeSelector.search*` keys (EN/FR).

### Modified — frontend tests (`apps/web/`)
- `src/business/api/commerceKnowledge.test.ts` — 2 new tests for the new adapters.
- `src/business/dashboard/QualifyingNodeSelector.test.tsx` — rewritten to mock the new hooks; added a "search escape hatch" describe block (3 new tests); all pre-existing behavioral assertions (labels-only, multi-select, retired-preservation, unresolvable-id fallback) preserved.
- `src/business/dashboard/RewardProgramManagementPage.test.tsx` — rewritten: fixture `programWire.rewardProgramCategoryId: null`; category-selection steps removed from every test; new test proving no Reward Category control exists anywhere in the create form (item M); new test proving a node found only via search (outside the default Business-Type scope) is accepted by the create mutation (items P/Q); all pre-existing Finding-1/Finding-4/multi-select/retired-preservation tests preserved.

### Modified — governance log
- `docs/00-governance/documentation-changes-log.md` — new `## Entry 236` (see §12 below for the numbering rationale); "Last controlled update" header line updated.

## 4. Exact migration file content

`functions/src/infrastructure/postgres/migrations/0015_reward_programs_category_optional.sql`:
```sql
-- Makes `reward_program_category_id` optional (`PLATFORM-BASELINE-010B`).
--
-- Founder decision `DEC-LOY-014` / `FD-REWARD-QUALIFICATION-001`
-- (recorded in governance docs, referenced by
-- `docs/00-governance/decisions/decision-register.md` -- not modified by
-- this migration): for Phase 1, a Reward Program does NOT require a
-- Reward Program Category. The Business-selected canonical
-- `standard_product`/`standard_service` qualifying node(s) are the
-- operative qualification definition; Business Type/Commerce Knowledge
-- category relationships may assist discovery only, never a second
-- write-time qualification gate.
--
-- `DROP COLUMN ... NOT NULL` is a pure constraint relaxation: it never
-- inspects or rewrites existing row values, so it is safe against a
-- table with zero, one, or many pre-existing rows -- every existing
-- non-null `reward_program_category_id` value is left byte-for-byte
-- unchanged. New rows may now persist a NULL in this column.
ALTER TABLE reward_programs
  ALTER COLUMN reward_program_category_id DROP NOT NULL;

COMMENT ON COLUMN reward_programs.reward_program_category_id IS
  'Optional as of PLATFORM-BASELINE-010B (Founder decision DEC-LOY-014 / FD-REWARD-QUALIFICATION-001) -- Phase 1 qualification authority is the version''s qualifyingNodes (standard_product/standard_service), never this category. Retained for Businesses/programs that already have one; never required for a new Reward Program.';
```

`functions/src/infrastructure/postgres/migrations/0015_reward_programs_category_optional.down.sql`:
```sql
-- Reverse of 0015_reward_programs_category_optional.sql.
--
-- PRECONDITION: this re-adds NOT NULL, which fails if any row currently
-- has a NULL `reward_program_category_id` (a Reward Program created under
-- PLATFORM-BASELINE-010B's Phase-1 category-optional rule). Do not run
-- this rollback against a database that has accepted any such row unless
-- those rows are first backfilled with a real category id or removed --
-- this migration performs no such backfill itself.
ALTER TABLE reward_programs
  ALTER COLUMN reward_program_category_id SET NOT NULL;
```

## 5. Test evidence — exact commands and results

All commands run from the worktree root unless noted. `pnpm install --frozen-lockfile` was run once at session start (no new dependency added — `pnpm-lock.yaml` untouched by any of this package's commits).

### 5.1 Typecheck
```
pnpm run typecheck
```
Result: `functions typecheck: Done`, `apps/web typecheck: Done`. Clean.

### 5.2 Lint
```
pnpm run lint
```
Result: `1 problem (0 errors, 1 warning)` — `apps/web/src/business/BusinessApiContext.tsx:26:17`, `react-refresh/only-export-components`, a pre-existing warning in a file this package never touched (also disclosed in Entries 231–234 of the governance log for the same file).

### 5.3 Format
```
pnpm run format:check
```
Result (after `prettier --write` on the 6 files this package's own new content needed reformatting): `All matched files use Prettier code style!`

### 5.4 Build
```
pnpm run build
```
Result: `functions build: Done`; `apps/web build: ... Done` (one pre-existing chunk-size advisory warning, unrelated to this change, present on `origin/main` too).

### 5.5 `git diff --check`
```
git diff --check
```
Result: exit 0, no output (no trailing-whitespace/conflict-marker issues).

### 5.6 Functions unit tests (no infra required)
```
pnpm --filter functions exec vitest run
```
Result: `Test Files 158 passed (158)`, `Tests 1765 passed (1765)`.

### 5.7 Web unit tests
```
cd apps/web && npx vitest run
```
Result: `Test Files 123 passed (123)`, `Tests 882 passed (882)`.

### 5.8 PostgreSQL cross-store integration tests (real Docker Postgres + Firestore Emulator)
Run via a disposable one-off Postgres container (`docker run -d --name pb010b-test-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eleventhonus_platform_test -p 54419:5432 postgres:16-alpine`) plus a Firestore-only Firebase Emulator on an alternate port (the repo's own fixed emulator/Postgres ports and the shared reusable dev container were already occupied by other concurrent local worktree sessions — investigated via `docker ps`/`lsof`, resolved by using disposable alternate ports/containers, no committed file touched):
```
firebase emulators:exec --project demo-11thonus --only firestore --config <alt-config> \
  "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54419/eleventhonus_platform_test \
   FIRESTORE_EMULATOR_HOST=localhost:8180 pnpm --filter functions exec vitest run --config vitest.postgres.config.ts"
```
Result (isolated run, `rewardProgramCommands` filter): `Test Files 1 passed (1)`, `Tests 32 passed (32)` (21 pre-existing + 11 new).
Result (isolated run, `rewardProgramMigrations` filter, no Firestore emulator needed): `Test Files 1 passed (1)`, `Tests 15 passed (15)` (13 pre-existing + 2 new; a later addition brought this to 18 total after the item-J migration test was added — reconfirmed passing).
Result (full 6-file suite together): non-deterministic — see §6 below; the two files touched by this package pass consistently and repeatedly in isolation and as part of the full suite when the full suite itself succeeds.

### 5.9 Firebase Emulator Suite (Firestore + Auth)
```
firebase emulators:exec --project demo-11thonus --only firestore,auth --config <alt-config> \
  "FIRESTORE_EMULATOR_HOST=localhost:8180 FIREBASE_AUTH_EMULATOR_HOST=localhost:9199 pnpm --filter functions exec vitest run --config vitest.emulator.config.ts"
```
Result: `Test Files 1 failed | 64 passed (65)`, `Tests 1 failed | 858 passed | 3 skipped (862)`. The one failure — `authenticationReferenceRepository.emulator.test.ts > links two different providers to the same identity concurrently without losing either` (a 5000ms test-timeout) — is in a file this package never touched (Customer Identity domain, unrelated to Reward Program/Commerce Knowledge). Re-run in isolation immediately after: `Test Files 1 passed (1)`, `Tests 20 passed (20)` — confirmed a timing flake, not a regression. The file this package added tests to (`commerceKnowledgeReadService.emulator.test.ts`) passed 38/38 in every run, isolated and as part of the full suite.

### 5.10 Playwright
Not run. No existing spec covers the Reward Program page (confirmed by search, consistent with Entries 232/234's own disclosure of the same pre-existing gap) and none was authored here — out of scope for this bounded correction, disclosed rather than fabricated.

## 6. Evidence-based regression determination for every failing/flaky check

Two non-deterministic failures were observed across the full validation pass. Both were determined to be genuine pre-existing environmental flakes, not regressions introduced by this package, using the following evidence:

1. **`platformFoundationReadiness.postgres.test.ts` first test, cross-file schema_migrations-state ordering flake.** Reproduced 2 of 3 times on a completely fresh, unmodified checkout of `origin/main` at the exact entry SHA (`git clone` + `git checkout 97fb91623497a0031447e8323a8a4159f6e09d80` into a scratch directory, fresh disposable Postgres container each run) running the identical full `vitest.postgres.config.ts` suite command — i.e. the failure occurs on code this package never touched, with zero of this package's changes present. Root cause: `rewardProgramCommands.postgres.test.ts`'s own `afterEach` (pre-existing, unmodified by this package) deletes rows but never drops the `reward_programs`/`schema_migrations` tables it creates in `beforeAll`, so a subsequent file in the same vitest run can observe non-fresh state depending on Vitest's file-execution order (which is not perfectly deterministic run-to-run despite `fileParallelism: false`). This exact flake class and root cause are independently corroborated by this repository's own governance log, Entry 230 (`PLATFORM-BASELINE-006A-CORR-003`): "one first-run failure in an unrelated migration-identity fixture check, `platformFoundationReadiness.postgres.test.ts`, confirmed a one-off environmental flake on an immediate re-run against the same container." **Determination: pre-existing environmental flake, not a regression.** (The one assertion this package genuinely needed to update in that file — the migration-count list including `"0015"` — is separate and correct; see §3.)
2. **`authenticationReferenceRepository.emulator.test.ts`'s concurrency test, a 5-second test timeout.** This file is in the Customer Identity domain and was not read, imported by, or modified by any file this package changed. Re-run in complete isolation immediately after the full-suite failure: passed cleanly, 20/20, including the specific test that had timed out. **Determination: a timing flake under concurrent local-machine load (multiple emulators/containers were running simultaneously on this machine during validation), not a regression.**

Both determinations are evidence-based (reproduced against unmodified `origin/main`, or reproduced-then-cleared in isolation), not assumed.

## 7. Non-regression boundary confirmation (§8 of the task)

Confirmed untouched by `git diff --stat` against this package's own commits: `functions/src/domains/purchase/**`, Verified Unit issuance, Circle/Loyalty-Cycle allocation, the 10-unit threshold constant, Reward creation, Trust Events, Notification Intents, outbox behavior, idempotency, Business Participation Terms, Business activation, redemption. No Reward/Loyalty visibility feature was implemented. No Reward Category content was seeded (`burundiPilotSeedManifest.ts` untouched).

## 8. `unitValueMinor=0` latent finding (§11 of the task)

Checked: every file referencing `unitValueMinor` (`functions/src/index.ts`'s purchase-record parsing, `purchaseRecordRepository.ts`, `recordPurchaseCommand.ts`, `purchase.ts`) is in the Purchase domain, entirely outside this package's diff. None of this package's commits touch any of them. Left completely alone, not investigated further, not fixed, per instruction.

## 9. Latest-decision-register cross-reference

This package cites `DEC-LOY-014` / `FD-REWARD-QUALIFICATION-001` as already-recorded Founder authority and does not create, edit, or reference `decisions/decision-register.md` in any way. The pre-existing `DEC-CKS-001`/`DEC-CKS-002` traceability gap (cited as authority in code/log comments with no matching decision-register entry — first flagged in Entry 234/`PLATFORM-BASELINE-009`) is unrelated to this package's scope and was not touched.

## 10. Discrepancies between the task prompt's summary and the actual code (as instructed, followed the code)

- The task prompt described `rewardProgramCategoryId` as `TEXT NOT NULL` at the schema layer and a hard-required transport field — both confirmed accurate by direct inspection before any change.
- One minor correction: the task prompt's illustrative wording for `parseCreateRewardProgramRequest`'s new optional-parsing shape ("`rewardProgramCategoryId?: string | null`") was followed exactly as the established `standardRewardNodeId` pattern requires (`undefined`/`null` → `null`; otherwise parsed as a non-empty string) — no functional deviation, just confirming the existing pattern was mirrored precisely rather than inventing a new parsing shape.

## 11. Risks, limitations, open questions

- The `platformFoundationReadiness`/`rewardProgramCommands`/`rewardProgramMigrations`/`purchaseCommands`-family cross-file Postgres test isolation gap (§6 item 1) is pre-existing and was not fixed here — fixing it would mean adding table-drop cleanup to `rewardProgramCommands.postgres.test.ts`'s `afterEach`/`afterAll`, which is outside this package's scope (it touches a file this package already modifies for unrelated reasons, so the risk of scope creep was judged higher than the value of fixing an unrelated pre-existing flake in the same pass). Flagged as a candidate for a future, separately-scoped correction.
- No Playwright/browser end-to-end coverage exists for the Reward Program page at all (pre-existing gap, not newly introduced).
- The Commerce Knowledge seed-content gap (zero `reward_program_category`/`standard_product`/`standard_service` nodes seeded anywhere) remains — this package makes the category optional and adds discovery/search reads, but a Business still needs SOME governed `standard_product`/`standard_service` content to exist before the qualifying-node picker (default or search) can show anything. Seeding that content was explicitly out of scope per the task instructions.
- `searchQualifyingNodes`'s substring match is intentionally simple (case-insensitive, in-memory over the already-small active candidate set) — not a search engine, matching this codebase's existing `DEC-TECH-008`-non-blocking precedent for every other Commerce Knowledge read.

## 12. Governance log numbering note

This worktree's copy of `docs/00-governance/documentation-changes-log.md` has header ("Last controlled update"/"Prior update") lines referencing Entries up to 235, but no `## Entry` body section exists in this worktree's copy of the file for any entry between 213 and 235 inclusive — evidently added to the header from a separate, not-yet-merged worktree/branch. This package's new entry is numbered **236** — the next number after the highest number appearing anywhere in the file (235, in the header index), not merely after the highest number with an actual body section present (212) — specifically to avoid reusing a number already claimed elsewhere in the file's own index, even though that claim's body section is absent here.

## 13. PR

PR #257 — `feat/platform-baseline-010b-reward-qualification-correction-001` → `main`.

---

## CORR-001 — Publication-Requires-Qualifying-Node Invariant + Bounded Discovery Search

**Date:** 2026-09-17
**Basis:** `PLATFORM-BASELINE-010B-ITR-001`, an independent review of this report's own PR #257, confirmed two findings (P1, P2). This section corrects exactly those two findings. Does not redesign this package; `DEC-LOY-014`/`FD-REWARD-QUALIFICATION-001` remain settled authority.

### CORR-001.1 Entry/analysis

- Entry PR head confirmed via `gh pr view 257 --json headRefOid`: exactly `b2574990a2d0e27cb7518f9cd1a00eb212797f67`, matching this worktree's own `git rev-parse HEAD`.
- CI on that exact head (`gh pr checks 257`): `Build, Lint, Test, Emulator Validation` — **pass**.
- Review threads inventoried (`gh api repos/Fkenogo/11THONUS/pulls/257/comments`): two, both from `chatgpt-codex-connector[bot]`, no others.
  1. P1 (badge `P1`) — `functions/src/domains/rewardProgram/services/rewardProgramKnowledgeValidation.ts:80` — "Require a qualifying node before publication."
  2. P2 (badge `P2`) — `functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts:342` — "Bound search before resolving every candidate label."
- Both findings read and confirmed against source directly (not assumed from the review comment text alone) before any edit — see CORR-001.2/CORR-001.3 root-cause paragraphs below.
- Worked in the existing isolated worktree (`/Volumes/PRODUCTION/Projects/11THONUS-worktrees/platform-baseline-010b-reward-qualification-correction-001`, same one this report's original package used) — no new worktree created, primary legal worktree never entered.

### CORR-001.2 P1 — publication-requires-qualifying-node invariant

**Root cause.** `validateAllReferences` (`rewardProgramKnowledgeValidation.ts`) is called by every create/draft-edit/publish command and does exactly two things per qualifying node: verify it exists, is the right type, and is active. With zero qualifying nodes, its `for` loop over `validateQualifyingNodes` is vacuously satisfied — nothing fails. Once `rewardProgramCategoryId` became optional (this package's own §3 change), `rewardProgramCategoryId: null` + `qualifyingNodes: []` had no remaining check anywhere in the publish path to reject it, so such a version could reach `publish`/`active` with no qualification definition of any kind.

**Fix strategy considered and chosen.** Three options were weighed: (a) reject this shape globally inside `validateAllReferences` — rejected, since every draft create/edit command also calls that function and a draft is explicitly allowed to hold zero qualifying nodes while configuration is in progress (task instruction: "DRAFT: MAY contain zero qualifying nodes"); (b) a database-level `CHECK` constraint on `reward_program_version_qualifying_nodes` — rejected as disproportionate to a value-shape invariant already expressible in the existing domain-error layer, and it would require a new migration for a purely additive Phase-1 rule; (c) a new, narrow, synchronous assertion called only at the publish boundary — chosen, as the smallest coherent enforcement point, consistent with the task's own preference ("Prefer enforcement at the publication boundary rather than globally in `validateAllReferences`").

**Exact enforcement point.** New exported function `assertHasQualifyingNodeForPublish(nodes)` in `rewardProgramKnowledgeValidation.ts` — pure and synchronous (no Firestore read needed; the node count is already known from the PostgreSQL-persisted draft). Called from exactly one place: `publishRewardProgramVersionCommand.ts`, immediately before the existing `validateAllReferences` call, using `draftPreview.qualifyingNodes` (already read from PostgreSQL for the pre-existing RF-3 validation step) — no new database or Firestore read added. Throws a new `rewardProgramPublishRequiresQualifyingNodeError()` (`rewardProgramErrors.ts`, category `VALIDATION_FAILED`, field `qualifyingNodes`, following the file's own existing error-shape convention exactly).

**Draft behavior after correction:** unchanged — `rewardProgramCategoryId: null` + `qualifyingNodes: []` remains a fully valid, persistable draft state (create, read, and edit all still succeed).

**Publish behavior after correction:** a version with zero qualifying nodes, category present or absent, is rejected with `RewardProgramDomainError` (`VALIDATION_FAILED`) before the PostgreSQL publish transaction ever begins; the version's status remains exactly `draft` (verified by re-reading it via `getRewardProgram` after the rejected attempt). One or more valid qualifying nodes, category present or absent, still publishes successfully exactly as before.

**Tests added** (`rewardProgramCommands.postgres.test.ts`, new describe block, items A–G mapped 1:1 to the task's minimum-proof list):
- A — draft creation with `category: null` + `qualifyingNodes: []` succeeds.
- B — publishing that draft is rejected (`RewardProgramDomainError`); the version reads back as `draft`, never partially published.
- C — publishing with one valid node and no category succeeds (`active`).
- D — publishing with two valid nodes and no category succeeds (`active`, both nodes persisted).
- E — a *non-null* category with zero qualifying nodes is rejected identically to a null category — isolates that the invariant is about node count, never category presence.
- F — a fabricated qualifying-node id on a category-less draft still fails the pre-existing eligibility check at create time (proves this correction is additive, not a replacement of `validateQualifyingNodes`).
- G — a draft edited down to zero qualifying nodes (an update the existing `updateRewardProgramDraft` command legitimately allows) then published directly via `publishRewardProgramVersion` is still rejected — the "malicious/direct callable request" proof: the publish callable (`functions/src/index.ts`) accepts no client-supplied `qualifyingNodes` field at all, so there is no alternate input path to smuggle a bypass through.
- H (web, `RewardProgramManagementPage.test.tsx`) — a governed publish rejection renders through the page's existing `MutationError` component (the same path every other publish failure already uses) and the Publish button remains offered — never a fabricated client-side success.

### CORR-001.3 P2 — bounded discovery search

**Root cause.** `searchQualifyingNodes` (`commerceKnowledgeReadService.ts`) read every `active` `standard_product`/`standard_service` node platform-wide on every call (`listActiveSelectableNodes` with no `parentId`/limit), resolved each one's display label via a `for` loop of sequential Firestore translation reads (`resolveDisplayLabel`, up to two reads per node), applied the substring filter only after all of that work, and treated empty input as "return everything" rather than "search nothing." On the client, `useSearchQualifyingNodesQuery`'s `enabled` gate was `searchText.trim().length > 0` — true after the very first keystroke — and `QualifyingNodeSelector.tsx` had no debouncing of any kind, so `searchText`'s query key changed, and a new callable fired, on every keystroke.

**Existing search architecture assessed** (per task instruction, before choosing a fix): `knowledgeNodeRepository.ts`'s `listActiveSelectableNodes` is a plain equality-filtered Firestore query (`nodeType == X`, `status == "active"`, optional `parentId == Y`) — no composite index required, and Firestore's query builder already supports `.limit(n)` as a one-line addition to the same query object. `resolveKnowledgeNodeLabels` already establishes a precedent for a defensive transport-level count bound (100 ids). `MAX_ANCESTOR_TRAVERSAL` in the same repository file establishes the precedent of "bound the underlying work as a defensive technical guard, not a product-level limit." No debounce utility exists anywhere in `apps/web/src` today. `useSearchQualifyingNodesQuery`'s query-key factory (`queryKeys.ts`) already includes `searchText`/`languageCode`, an established convention this correction reuses rather than inventing a new one. `translation` records are keyed by `(entityType, entityId, languageCode)` with no secondary index on `displayName` — confirming that a genuine server-side prefix/full-text query over translated labels is not available in the current Firestore/translation model without a larger architecture change (a denormalized per-token search index, `DEC-TECH-008`-scale). That larger change was judged out of this bounded correction's scope, and — per the task's explicit instruction — the limitation is disclosed here rather than an ungoverned denormalized index being built as an improvised workaround.

**Chosen bounded-search strategy and why.** The smallest architecture-consistent fix reusing every existing primitive:
1. An optional `limit` parameter added to `listActiveSelectableNodes` (backward-compatible; every other caller omits it and is byte-for-byte unaffected).
2. `searchQualifyingNodes` now: (a) requires `searchText.trim().length >= MIN_SEARCH_TEXT_LENGTH` (2) before performing any Firestore read at all — below that, `[]` is returned immediately, no scan; (b) supplies `MAX_SEARCH_CANDIDATE_NODES_PER_TYPE` (200) as the `limit` for each of the two node-type queries; (c) resolves display labels concurrently (`Promise.all`, replacing the serial `for` loop) since the candidate set reaching that step is now itself bounded; (d) caps the final filtered response at `MAX_SEARCH_RESULTS` (25).
3. Client-side, a new generic `useDebouncedValue` hook (`apps/web/src/business/hooks/useDebouncedValue.ts`, a small `useState`/`useEffect`/`setTimeout` pattern, no new dependency) debounces the search box's raw value by 300ms before it is passed into `useSearchQualifyingNodesQuery`. `useSearchQualifyingNodesQuery`'s own `enabled` gate was raised to the same `MIN_SEARCH_TEXT_LENGTH` (2) as a client-side request-avoidance courtesy; the server enforces its own copy of the same bound authoritatively and independently.

**Exact server-work bound:** at most 200 Firestore document reads per node type (400 total) per search request, versus previously unbounded.
**Exact result-count bound:** at most 25 results per response, versus previously unbounded.
**Client request-control/debounce behavior:** a 300ms debounce on the search box's value (verified via fake timers: typing "wash" character-by-character does not call the query hook with the settled value until the debounce window elapses) plus a minimum-length gate matching the server's own threshold.
**Search security assessment:** unchanged from before this correction — only `active` `standard_product`/`standard_service` nodes are ever discoverable (the same hard `status === "active"` filter `listActiveSelectableNodes` always enforced); draft/in_review/retired/archived content, and every other node type (including a `reward_program_category` with a coincidentally matching name), still never leak through, re-confirmed by new tests.
**Outside-Business-Type escape-hatch proof:** the pre-existing test proving a node outside a Business's default discovery scope remains findable by search (`P: finds an eligible node OUTSIDE a given business type's default discovery scope...`) still passes unmodified — this correction bounds the scan, it does not remove or gate it behind Business Type.
**PB-008 regression protection:** `resolveKnowledgeNodeLabels`'s unpublished-node disclosure gate (`isResolvableForExistingReference`) was not touched by this correction at all — a different function, a different code path — and its own test file was re-run and still passes in full.

**Tests added/modified:**
- `commerceKnowledgeReadService.emulator.test.ts`: the pre-existing "an empty searchText returns every active qualifying node platform-wide" test was **replaced** (its asserted behavior is exactly the unbounded scan this correction removes) with item **K** — empty/whitespace/one-character input all return `[]`, no scan. New: item **I** (response capped at 25 despite 30 matching candidates seeded), items **M/N** (only active `standard_product`/`standard_service` discoverable; a `reward_program_category` with a matching name never leaks through), item **P** (EN/FR label resolution/fallback for a search result, language-scoped, no cross-language leakage).
- `knowledgeNodeRepository.emulator.test.ts` (new describe block): item **J** — the `limit` param caps `listActiveSelectableNodes`'s own read/return count even when more active nodes exist; a companion test confirms omitting `limit` preserves every existing caller's exact prior unbounded behavior.
- `QualifyingNodeSelector.test.tsx` (new tests under the existing "search escape hatch" describe block): item **L** — typing a word character-by-character does not re-query the search hook per keystroke, only once typing settles (fake-timer-verified); item **K** (component-level) — the component still passes a debounced length-1 value through to the query hook, which is where the length gate itself lives (not duplicated in the component).

### CORR-001.4 Review-thread disposition

Both threads replied to on PR #257 with root cause, fix description, and test evidence (per the task's per-thread protocol). Neither marked resolved by this correction — left for independent re-review per instruction. No new review findings surfaced during this correction pass at time of writing.

### CORR-001.5 Validation

Commands executed: `pnpm typecheck` (functions+web), `pnpm lint`, `pnpm format:check`, `pnpm build`, `git diff --check`, `pnpm --filter functions test`, `pnpm --filter web test`, `pnpm emulators:validate` (`firebase emulators:exec ... test:emulator`), `firebase emulators:exec --only firestore ... test:postgres` (against a disposable one-off Postgres container on an alternate port — the repo's default emulator/Postgres ports and the shared dev container were occupied by other concurrent local worktree sessions, investigated via `docker ps`/`lsof`, resolved with disposable alternate ports/containers, no committed file left modified), `npx playwright test --project=chromium --project=chromium-dashboard-harness`.

**Targeted test results:** the two new/modified test files (`rewardProgramCommands.postgres.test.ts`'s new describe block, `commerceKnowledgeReadService.emulator.test.ts`'s new/modified tests, `knowledgeNodeRepository.emulator.test.ts`'s new describe block, `QualifyingNodeSelector.test.tsx`'s new tests, `RewardProgramManagementPage.test.tsx`'s new test) all pass.

**Full test results:** `pnpm --filter functions test` — 158 files / 1765 tests pass. `pnpm --filter web test` — 123 files / 885 tests pass. Firebase Emulator Suite — 65 files / 864 tests pass, 3 pre-existing skips. PostgreSQL cross-store integration (clean run) — 6 files / 114 tests pass. Playwright `chromium-dashboard-harness` — 36/36 pass.

**Three transient failures investigated, both determined pre-existing/environmental, not regressions** (full reasoning in the log Entry 237):
1. Three different "two concurrent operations" 5000ms-timeout tests, each failing once across three separate emulator-suite runs, in three different files this correction never touched — a clean re-run passed all three.
2. `platformFoundationReadiness.postgres.test.ts`'s "fresh database" test — failed as part of the full 6-file suite, passed 7/7 in isolation, and **reproduced identically on the unmodified base commit `b2574990a2d0e27cb7518f9cd1a00eb212797f67`** with this correction's own changes stashed out (same fresh container, same command) — direct proof of pre-existing cross-file test-ordering fragility, not a regression.
3. `tests/e2e/app-shell.spec.ts` (non-harness `chromium` Playwright project) — failed on a missing `apps/web/.env.local` (no Firebase project config exists in this worktree at all), a pre-existing local environment gap; the harness project (36 specs covering every Reward Program/Team/Terms screen with its own emulator-backed auth stub) passed cleanly.

**Exact-head CI:** not yet re-verified against the pushed correction commit at time of writing this report section — see the completion report delivered to the requester for the actual post-push CI result.

**Dependencies added:** none. **Config changes:** none committed (a temporary local `firebase.json` port remap used only to work around concurrent local sessions was fully reverted before this entry, confirmed via `git status`). **Schema/migration changes:** none. **`unitValueMinor` disposition:** left deferred, not investigated (out of scope, unchanged from §11 above).

### CORR-001.6 Risks/limitations/rollback

- **Risk:** `MAX_SEARCH_CANDIDATE_NODES_PER_TYPE` (200) means a match outside that request's candidate page is not found by that specific call once the catalogue exceeds 200 active nodes of one type — a disclosed, accepted limitation (§CORR-001.3), not a hidden one. No governed source specifies a different bound; this is a defensive technical cap, not a product decision.
- **Risk:** the pre-existing cross-file Postgres test-ordering fragility (§CORR-001.5 item 2) was reproduced and diagnosed but not fixed here — fixing it would mean adding table-drop cleanup to a file this correction did not otherwise need to touch, judged out of this bounded correction's scope. Flagged as a candidate for a future, separately-scoped correction.
- **Rollback:** revert this correction's commit(s) on `feat/platform-baseline-010b-reward-qualification-correction-001` — every change here is additive (a new assertion function, a new optional repository parameter, new bounds/constants, a new hook file) or a narrowing of existing behavior (the search minimum-length/candidate/response caps); no migration, no schema change, no data written differently, so a revert is a pure code rollback with no data-migration concern.

### CORR-001.7 Scope confirmation

Confirmed unrelated files untouched by `git diff --stat` against this correction's own commit(s). Confirmed the primary Founder legal worktree (`docs/dec-legal-002-bt-draft-007`) was never entered. Confirmed no Commerce Knowledge content was seeded, no redemption work started, no Reward/Loyalty visibility package started — this correction touches only the two files each finding named plus their direct call sites and tests.

**Disposition: A — CORRECTED / AWAITING NARROW INDEPENDENT RE-REVIEW.** PR #257 not merged.
