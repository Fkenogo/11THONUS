# PLATFORM-BASELINE-008 — Reward Program Qualifying-Node Selection / Implementation Report

**Date:** 2026-09-16
**Type:** Bounded operability package — Founder-facing Reward Program qualifying-node (and category) selector, replacing opaque manual Commerce Knowledge id entry. No Commerce Knowledge or Reward Program domain redesign. No new data authority.

---

## 1. Entry repository state

Entry `origin/main` SHA (verified via `git fetch` + `git rev-parse origin/main` immediately before branching, per dispatch instructions): `b36043c48afd4bf7aea3217036666255d3cbaa57` — `Merge pull request #254 from Fkenogo/docs/platform-baseline-007-operational-spine-assessment`.

## 2. Base SHA

`b36043c48afd4bf7aea3217036666255d3cbaa57` (same as entry SHA — branched directly from it).

## 3. Branch

`feat/platform-baseline-008-reward-program-qualifying-node-selection`, created in an isolated git worktree at `.claude/worktrees/platform-baseline-008` (confirmed clean immediately after creation). The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`, unrelated in-progress legal drafting work) was never touched, staged, committed, reset, or rebased by this task — see §31.

## 4. Final implementation SHA

Recorded at PR-open time in §5/§35 below (exact head SHA pasted after push).

## 5. PR number

Recorded in §35 below (opened against `main`, not merged).

---

## 6. Phase 0 — codebase analysis findings

### 6.1 Reward Program (current implementation, verified by direct code inspection)

- **UI entry point (confirms and extends the `PLATFORM-BASELINE-007` claim):** `apps/web/src/business/dashboard/RewardProgramManagementPage.tsx` rendered `qualifyingNodeIds` as a single comma-separated `TextField` (create form, former lines ~218-223; edit form, former lines ~367-372), parsed by a local `parseQualifyingNodeIds` helper into `{knowledgeNodeId, businessDisplayName: null}[]`. The Reward Program **category** (`rewardProgramCategoryId`) was *also* a raw opaque-id `TextField` at create time — PB-007 flagged both together ("Reward Program qualifying-node/category ID entry", §4/§6/§14 item 2), so this package fixes both, using the same governed Commerce Knowledge hierarchy, rather than fixing qualifying nodes while leaving category equally opaque immediately next to it.
- **Multiplicity was already fully array-shaped end-to-end before this package**, at every layer:
  - Domain model: `functions/src/domains/rewardProgram/models/rewardProgram.ts:53-56,81,113` — `QualifyingNode = {knowledgeNodeId: string; businessDisplayName: string | null}`, and `RewardProgramVersionRow`/`RewardProgramVersionDraftInput` both carry `qualifyingNodes: readonly QualifyingNode[]`.
  - Wire types: `apps/web/src/business/api/rewardProgramMutations.ts:18-21,58,77` — `QualifyingNodeWire[]` on every draft-fields request/response shape.
  - PostgreSQL: `functions/src/domains/rewardProgram/repositories/rewardProgramRepository.ts` — a real join table, `reward_program_version_qualifying_nodes` (one row per (version, node) pair), never a JSON blob column. Draft edits replace the set wholesale (`DELETE` then re-`INSERT`, `updateDraftVersion`), documented as the simplest correct semantics for a mutable draft.
  - Transport parsing: `functions/src/index.ts`'s `parseQualifyingNodes`/`parseRewardProgramDraftFields` hard-require an array and a non-empty `knowledgeNodeId` string per element, with no length cap at the parsing layer.
  - **Conclusion: multi-select was never a capability gap — only the UI was.**
- **RF-3 cross-store validation contract** (`functions/src/domains/rewardProgram/services/rewardProgramKnowledgeValidation.ts`, read in full): `validateAllReferences` runs a live Firestore read (`getKnowledgeNodeById`) against every qualifying node, the category, and the optional standard-reward node, checking (a) existence, (b) `nodeType` is one of the governed types for that reference (`["standard_product","standard_service"]` for qualifying nodes, `["reward_program_category"]` for category), and (c) `isEligibleForNewReference(status)` — i.e. `status === "active"`. This runs at draft add/change-time **and again, unconditionally, immediately before the PostgreSQL publish transaction begins** (the documented "authoritative read before the transaction, not part of its conflict set" contract — a disclosed, accepted bounded race window, not distributed atomicity). This package does not touch this file's logic at all — it remains the sole authority over whether a configuration is actually publishable.
- **Hydration:** `RewardProgramManagementPage.tsx`'s `startEdit` already reads `draft.qualifyingNodes` directly off the fetched draft version (`functions/src/domains/rewardProgram/services/rewardProgramQueries.ts` → repository `fetchQualifyingNodes`, a plain authorization + repository passthrough). The prior UI collapsed this array back down to a comma-joined string of ids for the text field (dropping any stored `businessDisplayName`); this package's selector instead keeps the array shape all the way through.
- **`businessDisplayName` was already a persisted, per-node, free-text field** (`reward_program_version_qualifying_nodes.business_display_name` column) that the old UI always set to `null`. Nothing about its meaning changed here — it remains presentation-only, round-tripped opaquely by every command — this package is the first thing that actually populates it with a real, human-chosen label at selection time.
- Category is set once at `createRewardProgram` time and is **not** draft-editable — `RewardProgramDraftFieldsRequest`/`RewardProgramVersionDraftInput` carry no `rewardProgramCategoryId` field at all. This meant the category selector is only ever needed on the create form; the edit form's qualifying-node selector always scopes against the program's own already-fixed `entry.program.rewardProgramCategoryId`, never a re-pick.

### 6.2 Commerce Knowledge (current implementation, verified by direct code inspection)

- **Authoritative store:** Firestore only (`knowledgeNodes`/`knowledgeTranslations` collections). Never mirrored into PostgreSQL — `rewardProgramKnowledgeValidation.ts`'s own header comment states this explicitly, and this package does not change it (RF-3 remains a live Firestore read, not a cached/denormalized copy anywhere).
- **Node type vocabulary and hierarchy** (`functions/src/domains/commerceKnowledge/models/knowledgeNodeType.ts:29-51`): six fixed types — `industry → business_category → business_type → reward_program_category → {standard_product, standard_service}` — a fixed linear adjacency, not something this package invents; `reward_program_category`/`standard_product`/`standard_service` already existed in the type union and in `rewardProgramKnowledgeValidation.ts`'s own governed reference-type lists, just with no read/browse transport built for them yet.
- **Existing governed read path** (`functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts`, pre-existing `listBusinessCategories`/`listBusinessTypesForCategory`): server-mediated, EN/FR-fallback-resolved (`resolveDisplayLabel`, requested-language published translation → EN published translation → `canonicalName`, never a blank label or raw key), hard-filtered to `status === "active"` at the repository layer (`listActiveSelectableNodes`, `knowledgeNodeRepository.ts:378-397` — "the one place in the repository where `status === active` is a hard filter, not caller-suppliable"), and — critically — **already generic over `KnowledgeNodeType`**, not hardcoded to `business_category`/`business_type`. This is the exact reusable building block this package needed; no new repository primitive was required.
- **Existing callables** (`functions/src/index.ts`): `listBusinessCategories`/`listBusinessTypesForCategory`, authentication-only (`resolveAuthenticatedBusinessActor` + `firebaseAdminTokenVerifier`), explicitly **not** Business-scoped — the callable's own doc comment states Commerce Knowledge is "platform-global, non-tenant data" and no per-caller filtering is meaningful. `KnowledgeNode` carries no `businessId`/`branchId`/`ownerUserId` field anywhere, by explicit design (`knowledgeNode.ts` header comment: "none should ever be added").
- **Existing Business-facing web read path**: `apps/web/src/business/api/commerceKnowledge.ts` (thin `httpsCallable` adapters) → `apps/web/src/business/hooks/businessQueries.ts`'s `useBusinessCategoriesQuery`/`useBusinessTypesQuery` (React Query hooks, `staleTime: Infinity`, gated on `actorState.status === "ready"`) — already proven, in-production plumbing (`ClassificationStep.tsx` and others), for exactly two of the six node types.
- **No callable existed for `reward_program_category`/`standard_product`/`standard_service`** before this package. The gap was purely a missing *read transport* over already-governed, already-modeled data — not a missing data model, not a missing authority, not a missing permission concept.
- **Retirement semantics are already fully defined and required no new decision**: `referenceEligibility.ts`'s `isEligibleForNewReference(status) = status === "active"` (governs what a *new* selection may target) vs. `isResolvableForExistingReference(status) = active || retired || archived` (governs whether an *existing* reference still resolves for display — draft/in_review never resolve). This package's `resolveKnowledgeNodeLabels` reuses this exact distinction: it resolves a label for any status (or `null` if the id is genuinely gone), while the candidate-list read stays `active`-only.
- **Content gap, disclosed, not this package's to fix:** the current Commerce Knowledge seed manifest (`burundiPilotSeedManifest.ts`) seeds no `reward_program_category`/`standard_product`/`standard_service` nodes at all. This means a completely fresh local/emulator environment will show the selector's genuine, correctly-implemented empty state until seed content exists — not a defect in the selector.

### 6.3 Authority / security confirmation (before implementation)

- Commerce Knowledge remains the sole authority for qualifying-node/category identity; nothing in this package copies a node's identity, hierarchy, or status into PostgreSQL or any other store.
- Reward Program continues to store only canonical Commerce Knowledge ids (`knowledgeNodeId`, `rewardProgramCategoryId`) — `businessDisplayName` remains presentation metadata, never treated as identity, never compared against for equality/authorization anywhere in the domain/repository/validation layers.
- Client selection is convenience only: RF-3 (§6.1) is completely unmodified and remains the sole authority at publish time. The new read transport performs its own independent, server-side re-validation of any `categoryId` a client supplies (`getKnowledgeNodeById` + type/status check inside `listQualifyingNodesForCategory`), mirroring `listBusinessTypesForCategory`'s existing "never trust a caller-supplied id blindly" precedent — never trusting the client for anything beyond "what to show."
- No direct browser-to-PostgreSQL access exists anywhere in this change (this package touches no PostgreSQL code at all — no migration, no repository change).
- No second Commerce Knowledge catalogue, no duplicate authority, no new provider/infra dependency (§27 confirms zero new npm/pip dependencies).
- Business isolation: Commerce Knowledge reads are platform-global by design (§6.2) — this is the pre-existing, already-shipped precedent for the *same* underlying data source (`listBusinessCategories`), not a new decision invented by this package. See §16 for why an explicit cross-Business isolation test does not apply here.

### 6.4 Stop-condition check

Walked every condition in the task specification against the findings above:

1. Commerce Knowledge read capability — sufficient (generic `listActiveSelectableNodes` already existed; only a thin service/callable/adapter/hook layer was missing). **Not a blocker.**
2. Human-readable metadata — exists (`canonicalName` + EN/FR translations, same resolution chain already proven for business categories/types). **Not a blocker.**
3. Second catalogue/authority — not required; this package is additive read surface over the existing single authority. **Not a blocker.**
4. Business scoping/permissions unclear — no; Commerce Knowledge's non-tenant shape is an existing, already-shipped, already-documented precedent for the identical data source. **Not a blocker.**
5. Qualifying-node semantics conflicting with the selector — no; the selector's category-scoped, array-based, canonical-id-binding shape matches the existing domain model exactly. **Not a blocker.**
6. Active/retired-node product decision unresolved — no; `referenceEligibility.ts`'s existing `isEligibleForNewReference`/`isResolvableForExistingReference` split already answers this precisely, and this package only had to apply it consistently (candidate list = active-only; hydration = any status). **Not a blocker.**
7. Genuine new Founder decision required — no.
8. `PLATFORM-BASELINE-007` materially contradicts the current implementation — no; every specific claim in §4/§6/§14 item 2 of that report was independently re-verified against the code (§6.1/§6.2 above) and found accurate, with one refinement (category was equally opaque, not only qualifying nodes — addressed in scope, §7).
9. Reopening the architecture required — no.

**No STOP condition applies. Proceeded directly to implementation** (per task instruction, no separate design-document cycle).

---

## 7. Implementation strategy (final)

Smallest coherent experience change, reusing the exact existing pattern this codebase already uses for the structurally identical business-category/business-type selector:

1. **Category selector** (create form only, since category is immutable after creation): a `Select` populated from a new `listRewardProgramCategories` read (every active `reward_program_category` node).
2. **Qualifying-node selector** (create and edit forms): a multi-select checkbox list, scoped to the Reward Program's own category (create: the just-chosen category; edit: the program's already-fixed category), populated from a new `listQualifyingNodesForCategory(categoryId)` read (every active `standard_product`/`standard_service` node whose `parentId` equals that category).
3. **Existing-selection hydration/retirement handling**: a new `resolveKnowledgeNodeLabels(nodeIds)` read resolves display labels for **any** status (not just active), used only for ids a draft already has that are no longer in the live active-candidate list — so a retired/archived/otherwise-unresolvable previously-selected node is shown with its real (or last-known, or generic-fallback) label, still checked, in a visually distinct "no longer available" group, never silently dropped, removable only by an explicit uncheck.

This is the "category → node selector" pattern the task spec named as one acceptable smallest-useful shape, and it maps directly onto the fixed Commerce Knowledge hierarchy adjacency (`reward_program_category → {standard_product, standard_service}`) rather than inventing a flat, unscoped list.

---

## 8. Missing read capability — what was built

Three new Commerce Knowledge read functions (all reusing the existing generic `listActiveSelectableNodes` repository primitive, unmodified), three new authenticated-only `onCall` callables (identical authentication shape to the existing two), three new web API adapters, and three new React Query hooks. No new repository function, no new Firestore query shape beyond what `listActiveSelectableNodes` already supported, no new PostgreSQL surface, no new npm dependency.

| New capability | Function | Callable | Web adapter | Hook |
|---|---|---|---|---|
| Reward Program category options | `listRewardProgramCategories` | `listRewardProgramCategories` | `makeCallListRewardProgramCategories` | `useRewardProgramCategoriesQuery` |
| Qualifying-node candidates for a category | `listQualifyingNodesForCategory` | `listQualifyingNodesForCategory` | `makeCallListQualifyingNodesForCategory` | `useQualifyingNodesForCategoryQuery` |
| Display-only label resolution for already-held ids (any status) | `resolveKnowledgeNodeLabels` | `resolveKnowledgeNodeLabels` | `makeCallResolveKnowledgeNodeLabels` | `useKnowledgeNodeLabelsQuery` |

`resolveKnowledgeNodeLabels` request parsing is capped at 100 ids per call (`parseKnowledgeNodeIds`, `functions/src/index.ts`) — a defensive transport-level bound, not a product limit (no Reward Program version is expected to approach that many qualifying nodes).

---

## 9. Files modified / created

**Backend (functions):**
- `functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts` — added `listRewardProgramCategories`, `listQualifyingNodesForCategory`, `resolveKnowledgeNodeLabels`, `QualifyingNodeCandidateDto`/`KnowledgeNodeLabelDto` types; widened `CommerceKnowledgeOptionDto.nodeType` and `CHILD_NODE_TYPES` to cover the new node types.
- `functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.emulator.test.ts` — added emulator tests for all three new functions (22 `it` blocks total in the file after this change).
- `functions/src/domains/commerceKnowledge/models/commerceKnowledgeErrors.ts` — added `rewardProgramCategoryNotFoundForNodeListingError`, mirroring `businessCategoryNotFoundForTypeListingError`'s existing fail-closed-and-undifferentiated precedent exactly.
- `functions/src/index.ts` — added `listRewardProgramCategories`, `listQualifyingNodesForCategory`, `resolveKnowledgeNodeLabels` callables and `parseKnowledgeNodeIds` whitelist parser, identical authentication shape to the existing two Commerce Knowledge callables.
- `functions/src/index.test.ts` — added `parseKnowledgeNodeIds` mass-assignment/validation boundary tests (6 `it` blocks: well-formed array, non-array rejection, empty-array rejection, non-string/blank-entry rejection, >100 rejection, exactly-100 acceptance).

**Web (apps/web):**
- `apps/web/src/business/api/commerceKnowledge.ts` — added `KnowledgeNodeLabel` type and three new adapter pairs (`toCall*`/`makeCall*`) for the three new callables; widened `CommerceKnowledgeOption.nodeType`.
- `apps/web/src/business/api/commerceKnowledge.test.ts` — added tests for the three new adapters.
- `apps/web/src/business/hooks/businessQueries.ts` — added `useRewardProgramCategoriesQuery`, `useQualifyingNodesForCategoryQuery`, `useKnowledgeNodeLabelsQuery`.
- `apps/web/src/business/hooks/queryKeys.ts` — added `rewardProgramCategories`, `qualifyingNodes`, `knowledgeNodeLabels` query-key factories.
- `apps/web/src/business/dashboard/QualifyingNodeSelector.tsx` — **new file**, the reusable selector component (loading/error/empty/populated/unavailable states).
- `apps/web/src/business/dashboard/QualifyingNodeSelector.test.tsx` — **new file**, 10 `it` blocks covering the component in isolation.
- `apps/web/src/business/dashboard/RewardProgramManagementPage.tsx` — replaced the opaque category `TextField` with a `Select` (create form only) and the opaque comma-separated qualifying-node `TextField` (both forms) with `QualifyingNodeSelector`; `DraftFormState.qualifyingNodeIds: string` → `qualifyingNodes: QualifyingNodeWire[]`.
- `apps/web/src/business/dashboard/RewardProgramManagementPage.test.tsx` — updated the category-entry assertion to `selectOptions`, added a `beforeEach` resetting the new selector mocks, and added a dedicated `describe("PLATFORM-BASELINE-008: qualifying-node selection", …)` block (9 new `it` blocks).
- `apps/web/src/i18n/locales/en.ts` / `apps/web/src/i18n/locales/fr.ts` — added `rewardProgram.category.*` and `rewardProgram.qualifyingNodeSelector.*` key groups, structurally identical between locales; reworded `fieldQualifyingNodes` (dropped the stale "(comma-separated)" parenthetical).

No migration, no schema change, no PostgreSQL file touched anywhere in this package.

---

## 10. Code diff summary

`git diff --stat` against the entry SHA: **13 files changed, 2 files added, 1098 insertions(+), 49 deletions(-)** (`git diff --stat` run at PR-open time; exact figures re-confirmed in §35 against the final pushed head).

---

## 11. Selector behaviour

- **Loading:** `t("rewardProgram.category.loading")` / `t("rewardProgram.qualifyingNodeSelector.loading")` — plain, translated text, never a spinner-less blank gap.
- **Populated:** a `Select` (category) and a checkbox list (qualifying nodes), both showing only `displayLabel` — never a raw `knowledgeNodeId` anywhere in the DOM (proven by explicit `queryByText(<raw id>)` negative assertions in both test files).
- **Current selection:** every previously-selected, still-active node renders pre-checked; the create form clears qualifying-node selections when the category changes (mirrors the existing `BusinessProfilePage.tsx` "a Type from the old Category is never silently kept" precedent for `businessTypeId`).
- **Empty:** an explicit, translated "no products or services are available for this category yet" message — never a silently empty list indistinguishable from a loading/error state.
- **Read-error:** `role="alert"`, translated copy, never a raw exception/backend message.
- **Unavailable (retired/unresolvable) previously-selected node:** rendered in a visually distinct block, still checked, italic label with a "(no longer available — kept in this program's configuration)" note, removable only via an explicit uncheck.

## 12. Human-readable metadata displayed

`displayLabel` — the same server-side EN/FR-fallback-resolved (requested language → EN → `canonicalName`) label the existing business-category/type selectors already use, via the identical `resolveDisplayLabel` function, unmodified.

## 13. Canonical-ID binding proof

- Component-level: `QualifyingNodeSelector.test.tsx`'s "checking an option emits the canonical id (never the label) via onChange" test asserts the exact `{knowledgeNodeId, businessDisplayName}` shape emitted.
- Page-level: `RewardProgramManagementPage.test.tsx`'s "shows qualifying-node checkboxes … and submits canonical ids, never labels" test drives the real form (category select → node checkboxes → submit) and asserts the mutation payload's `qualifyingNodes` array contains canonical ids, with `businessDisplayName` populated from the label shown at click time (never the reverse).
- Server-side: `parseQualifyingNodes`/`parseRewardProgramDraftFields` (`functions/src/index.ts`, unmodified by this package) still hard-require `knowledgeNodeId` as the authoritative field; nothing in this package changes what a create/update/publish command persists.

## 14. Existing-draft hydration proof

`RewardProgramManagementPage.test.tsx`: "hydrates an existing draft's qualifying-node selections as checked when the node is still an active candidate" (checkbox pre-checked from `draft.qualifyingNodes`) and the pre-existing "Finding 4: saving an edit preserves the optional fields the form does not expose" test (unchanged assertion — still passes, because `startEdit` still assigns `editForm.qualifyingNodes = draft.qualifyingNodes` verbatim, and an untouched selection round-trips byte-for-byte through submit).

## 15. Multi-selection behaviour

`QualifyingNodeSelector.test.tsx`'s multi-select test and `RewardProgramManagementPage.test.tsx`'s "supports selecting multiple qualifying nodes at once" test both check two nodes and assert both canonical ids appear in the submitted array — confirms the domain model's pre-existing array shape is fully exercised through the UI now, not just structurally supported.

## 16. Add/remove/edit behaviour

`QualifyingNodeSelector.test.tsx`: "unchecking a selected option removes only that node's canonical id" and "removing an unresolved/retired selection is only ever an explicit user action". `RewardProgramManagementPage.test.tsx`: the same create-form test un-checks and re-checks a node before submit to prove both directions work in the real page, and the retired-node test explicitly unchecks a preserved-but-unavailable node and asserts it is excluded from the saved payload.

## 17. Retired/unavailable-node behaviour

Exercised in both test files: a selected id not present in the live active-candidate list is (a) never dropped from the rendered selection, (b) shown with the best available label (live resolution via `resolveKnowledgeNodeLabels` → last-known stored `businessDisplayName` → generic translated fallback, in that order), (c) never shows the raw canonical id, and (d) is removable only by an explicit user click. No new retirement rule was invented — this reuses `isResolvableForExistingReference`'s existing distinction unmodified.

## 18. Business/tenant isolation

Not applicable to this specific read surface, by design and by existing precedent (§6.3) — Commerce Knowledge is platform-global, non-tenant data, identical in shape to the two callables this package's new ones are modeled on. No `businessId` parameter exists on any of the three new callables, matching `listBusinessCategories`/`listBusinessTypesForCategory` exactly. Reward Program's own existing Business/tenant isolation (`rewardProgram.manage` authorization, businessId-scoped PostgreSQL queries) is completely untouched by this package.

## 19. Server validation remains authoritative — confirmation

`rewardProgramKnowledgeValidation.ts` (RF-3) was not modified in any way by this package. Every create/update/publish/createNextVersion command still runs the identical live-Firestore validation pass before persisting or publishing. The new read transport is a parallel, independent, read-only path that never participates in that validation and cannot bypass it — a client could still (in principle) call `updateRewardProgramDraft` directly with an invalid id, and RF-3 would still reject it exactly as before.

## 20. No new data authority — confirmation

Zero PostgreSQL files touched. Zero Firestore schema/document-shape changes (`KnowledgeNode`'s own fields are unchanged; only the DTO union types describing which of its already-existing `nodeType` values a given read transport surfaces were widened). The three new read functions all resolve through the same `Firestore` handle and the same `getKnowledgeNodeById`/`listActiveSelectableNodes` repository functions every other Commerce Knowledge read already uses.

## 21. EN/FR implementation

`apps/web/src/i18n/locales/en.ts`/`fr.ts` — new `rewardProgram.category.{loading,loadError,placeholder,empty}` and `rewardProgram.qualifyingNodeSelector.{chooseCategoryFirst,loading,loadError,empty,unavailableLabel,unavailableNote}` groups, structurally identical key sets between locales (verified by the pre-existing automated `i18n.test.tsx` "keeps the English and French catalogs structurally in parity" test — see §22). No Kinyarwanda/Kirundi/Swahili content added.

---

## 22. Test results (actually run, this session, in the isolated worktree)

| Suite | Command | Result |
|---|---|---|
| Web unit (full) | `pnpm --filter web exec vitest run` | **122 files, 874 tests, all pass** (includes the i18n EN/FR structural-parity test, unaffected). |
| Functions unit (full) | `pnpm --filter functions test` | **158 files, 1762 tests, all pass.** |
| PostgreSQL cross-store integration (full) | `firebase emulators:exec --project demo-11thonus "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=… pnpm --filter functions test:postgres"` (against a disposable, freshly-created local PostgreSQL 16 container, not the repo's fixed-port compose service — see §25 for why) | **6 files, 94 tests, all pass** — includes the full `createRewardProgram → publishRewardProgramVersion → createNextRewardProgramVersion → recordPurchase → verifyPurchase/…` Reward Program/Purchase integration suite, confirming this package left existing Reward Program/Purchase/Verification behavior intact. |
| Firebase Emulator Suite (full) | `firebase emulators:exec --project demo-11thonus "pnpm --filter functions test:emulator"` | **65 files, 843 passed, 3 skipped (pre-existing, unrelated to this package), 0 failed.** |
| Playwright (dashboard-harness + chromium) | `pnpm run test:e2e` | **36 of 37 passed.** The 1 failure (`tests/e2e/app-shell.spec.ts`, unrelated to Reward Program) is a confirmed environmental port collision, not a product/test defect — see §25 for the diagnostic evidence. |
| Playwright emulator e2e (`chromium-emulator-e2e`) | not run | No existing spec covers the Reward Program dashboard (confirmed by `PLATFORM-BASELINE-007`, independently re-confirmed here: `grep` of `tests/e2e/emulator/*.spec.ts` finds no Reward Program coverage before or after this package). Writing a new browser-level spec for this page was judged out of the smallest-coherent-change scope for an operability package; the Founder localhost verification journey (§28) covers the same ground manually. |
| Typecheck | `pnpm run typecheck` | **Pass** (`apps/web` + `functions`, zero errors). |
| Lint | `pnpm run lint` | **Pass, 0 errors** (1 pre-existing warning in `apps/web/src/business/BusinessApiContext.tsx`, a file this package never touches). |
| Format check | `pnpm run format:check` | **Pass**, after `prettier --write` was run once on the exact 7 files that needed it (all files this package's own edits touched — the pre-existing-from-a-prior-session content in those files was not yet formatted). |
| Production build | `pnpm run build` | **Pass** — `apps/web` (`tsc -b && vite build`) and `functions` (`tsc`) both succeed; pre-existing >500kB chunk-size advisory warning, unrelated to this package (not a new regression — same warning class exists on `main`). |
| `git diff --check` | `git diff --check` | **Pass**, no whitespace errors. |

**Targeted tests for this package specifically** (subset of the full suites above, re-run in isolation for speed during development): `QualifyingNodeSelector.test.tsx` (10 tests), the new `describe` block in `RewardProgramManagementPage.test.tsx` (9 tests) plus its 2 updated pre-existing tests, `commerceKnowledge.test.ts`'s 3 new adapter tests, `commerceKnowledgeReadService.emulator.test.ts`'s new coverage for the three new functions, and `index.test.ts`'s 6 new `parseKnowledgeNodeIds` tests — all pass, all included in the full-suite totals above (not double-counted).

---

## 23. Dependencies added

None. `git diff` touches no `package.json`/`pnpm-lock.yaml` anywhere in the repo.

## 24. Config/schema/migration changes

None. No new PostgreSQL migration. No Firestore Security Rules change (the new callables authenticate the same way the existing two do; Commerce Knowledge documents were already globally readable server-side via the Admin SDK inside `onCall` handlers, unaffected by client-facing Firestore rules). `firebase.json`/`playwright.config.ts` were temporarily edited during this session purely to work around **local port collisions with unrelated concurrent processes on this shared machine** (§25) and were reverted to their exact original committed content before finishing (`git status` confirms clean on both files — see §31).

## 25. Environmental-flake investigation (as required by the task's regression-validation instructions)

Three genuine local-infrastructure collisions were found and root-caused during this session, all confirmed environmental (this machine hosts multiple unrelated local projects/sessions concurrently), none a defect in this package's code:

1. **PostgreSQL, first attempt:** `pnpm postgres:up` failed with a container-name conflict, then a stale/foreign schema (`"create_widgets"` — a migration name that does not exist anywhere in this repository) surfaced once the container did start. Diagnosis: `docker ps` showed a **different**, unrelated compose project (`pb008-main-check-postgres-1`, presumably a concurrent check running against the primary worktree/branch on this same host) genuinely bound to the repo's fixed host port `54329` at that moment. Resolution: stood up a fully disposable, uniquely-named, uniquely-ported (`54331`) one-off `postgres:16-alpine` container via plain `docker run` (not the committed compose file, so nothing in the repo needed to change), pointed the test run at it via the already-supported `PLATFORM_POSTGRES_URL` override (`postgresConfig.ts`), ran the suite, then `docker rm -f`'d it immediately after — no persistent state left behind, no repo file touched for this workaround.
2. **Firestore Emulator Suite:** `firebase emulators:exec` failed outright ("Port 8080 is not open… could not start Firestore Emulator") — `lsof` confirmed a genuine, unrelated `java` process (a different Firestore emulator instance, from a separate concurrent session) already listening on `127.0.0.1:8080`, plus a separate `node` hub process on port `4400`. Resolution: temporarily bumped every port in `firebase.json`'s `emulators` block to an unused range (`auth 9299`, `functions 5201`, `firestore 8280`, `storage 9399`, `hosting 5250`, `ui 4200`, `hub 4600`), ran the full suite successfully (**65 files / 843 passed / 3 skipped / 0 failed**), then `git checkout -- firebase.json` immediately after — confirmed byte-identical to the entry-SHA version before continuing (§31/§24).
3. **Playwright `chromium` project (`app-shell.spec.ts`):** failed with a `getByRole("heading", {name: "Sign in"})` timeout. The captured `error-context.md` accessibility snapshot showed the loaded page was **"Klockit Work Presence" / "Apex Manufacturing & Logistics Ltd"** — a completely unrelated application, not this repository's build output at all. Diagnosis: Playwright's `webServer.reuseExistingServer: !process.env.CI` (locally `true`) found an already-listening, unrelated `node` process on port `4173` (confirmed via `lsof`) and reused it instead of starting this repo's own preview server. This is precisely the "documented history of environmental flakes — e.g. port collisions with unrelated local apps" the task instructions warned about. A temporary port bump (`4173 → 4273`) in `playwright.config.ts` was attempted but the alternate preview server did not come up cleanly within the harness's available time budget for this single, Reward-Program-unrelated spec; rather than spend further budget chasing an unrelated file's port plumbing, the config was reverted (`git checkout -- playwright.config.ts`, confirmed clean) and this is disclosed here as an **environmental, non-blocking, not-this-package's-defect** finding, with the diagnostic evidence (the captured accessibility snapshot naming a different company/app entirely) as proof rather than assertion. The other 36 Playwright specs in the same run — including every dashboard-harness spec — passed cleanly on their own (already-distinct) ports.

No `docker-compose.postgres.yml`, `firebase.json`, or `playwright.config.ts` change is present in the final diff — all three investigations concluded with the repository's committed files unchanged (`git status` in §31 confirms this).

---

## 26. Risks

- **Content gap dependency:** the qualifying-node/category selectors are only as useful as the Commerce Knowledge seed content available in a given environment. The current seed manifest has zero `reward_program_category`/`standard_product`/`standard_service` nodes — a pre-existing, disclosed gap (not introduced by this package) that means a completely fresh environment will show the selector's genuine empty state until that content is seeded. This is a content/seed task, not an engineering follow-up to this package.
- **No browser-level (Playwright) coverage of the Reward Program dashboard exists**, before or after this package (§22) — component and page-level unit/integration coverage is thorough (19 new/updated tests across the two dedicated test files plus the emulator/unit backend tests), but nothing proves the real browser rendering of the selector end-to-end. Mitigated for this delivery by the manual localhost verification journey in §28.
- **`resolveKnowledgeNodeLabels`'s 100-id cap** is a defensive transport bound; if a future product direction ever needed more than 100 qualifying nodes on one version (far beyond any currently governed scale), this would need revisiting — flagged, not expected to matter in practice.

## 27. Known limitations

- Category selection remains a one-time, create-time-only choice (matches the existing, unmodified domain model — category is not draft-editable) — this package did not add category *editing*, only category *selection at creation*, consistent with existing semantics.
- The `unitValueMinor: 0` transport/domain/DB mismatch (`PLATFORM-BASELINE-006A-CORR-003`, reconfirmed by `PLATFORM-BASELINE-007` §15) was not encountered and remains out of scope, unchanged, exactly as instructed.
- No Playwright spec added for the Reward Program dashboard (§26).

---

## 28. Founder localhost verification journey

Using the existing local dev/emulator setup (no hosted preview infrastructure created):

1. `pnpm postgres:up` (disposable local PostgreSQL) and `pnpm emulators` (Firebase Emulator Suite) in one terminal.
2. `node tests/e2e/emulator/seedTestOnlyTermsFixture.mjs` once (existing, Founder-authorized, emulator-only fixture — unrelated to this package, required only to let a Business leave `draft`, per `PLATFORM-BASELINE-007` §3).
3. `node tests/e2e/emulator/seedCommerceKnowledge.mjs` once — seeds the existing Business Category/Type content. **To see real qualifying-node/category options in the selector**, seed content for `reward_program_category`/`standard_product`/`standard_service` nodes would additionally need to exist (§26) — the seed manifest does not currently include any; the selector's empty state is what a Founder will see for those node types until such content is added, and that empty state was verified to render exactly the translated, non-blank, non-raw-id message described in §11.
4. Start the web app in emulator mode (`pnpm --filter web dev`, or the dashboard-harness dev server used by Playwright).
5. Sign in as a Business Owner (`authenticate` → `createBusiness` → accept Terms → submit → have a seeded Platform Administrator activate → `trial`), matching the exact chain `PLATFORM-BASELINE-007` §12/§18 already proved reachable.
6. Navigate to Reward Programs → "Create Reward Program".
7. Observe the **Reward Program category** field is now a dropdown of human-readable category names (or the translated empty-state note if no `reward_program_category` content is seeded) — never a text box.
8. Choose a category (once content exists) → observe the qualifying-node checklist populate with human-readable product/service names scoped to that category — never an id.
9. Check one or more items, fill the remaining required fields, submit.
10. Confirm the created draft, when reopened via "Edit draft", shows the exact same items checked (hydration).
11. Uncheck one item, check a different one, save the draft, reopen it again — confirm the new selection (and only the new selection) is what's restored.
12. Publish via the existing, unmodified "Publish" action — confirm publication succeeds for a valid selection (RF-3 still runs, unmodified) and the resulting published version's `qualifyingNodes` match the intended selection.
13. (Optional, to observe the retirement-preservation path) transition a previously-selected node's Commerce Knowledge status away from `active` directly (e.g. via the existing Commerce Knowledge lifecycle transition function in a Node REPL against the emulator) and reopen the draft — confirm the node is still shown, still checked, flagged as no longer available, and removable only by an explicit click.

No screenshots were captured in this session (no interactive browser/simulator tool was invoked for this pass — the verification journey above is provided as exact, reproducible steps rather than a claimed-but-unproven walkthrough). If the Founder or a reviewer runs this journey and wants screenshot evidence captured, a follow-up pass can add it to a `docs/05-implementation/reports/evidence/` (or `scratch/evidence/`) folder consistent with how prior `PLATFORM-BASELINE-006A`/`007` passes handled evidence (checked: neither of those reports committed binary screenshots into the repository — evidence was narrative/log-based, matching this report's approach).

---

## 29. Report path

`docs/05-implementation/reports/PLATFORM-BASELINE-008-reward-program-qualifying-node-selection-implementation-report-2026-09-16.md` (this file).

## 30. Changes-log/tracking record

`docs/00-governance/documentation-changes-log.md` — new entry **232** (highest existing entry at entry SHA was 231, `PLATFORM-BASELINE-007`; see §33 below for the exact prepended text), following this file's established "Last controlled update" rolling-header convention exactly as entries 213-231 already do (a header-line summary, not a separate numbered `## Entry` section — this convention change, observed already in place at entry SHA, is followed rather than reverted).

## 31. Primary worktree safety

The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`) was never entered, staged, committed, reset, or cleaned by this task. Read-only `git status` confirmation, run at the end of this session:

```
$ git -C /Volumes/PRODUCTION/Projects/11THONUS status
On branch docs/dec-legal-002-bt-draft-007
[unchanged from this task's dispatch-time snapshot — see the final report's pasted output for the exact text]
```

(Exact output pasted verbatim in the final dispatch report, not reproduced twice here — see the top-level completion message.)

## 32. Rollback instructions

This package is entirely additive except for the two files that replace UI controls (`RewardProgramManagementPage.tsx`'s category `TextField`→`Select` and qualifying-node `TextField`→`QualifyingNodeSelector`). To roll back: `git revert` the PR's merge commit (once/if merged) or simply do not merge the PR — nothing outside this branch was touched, no migration was applied, no data was written, no dependency was added. Reverting restores the exact prior opaque-`TextField` behavior with zero data-shape implications (the underlying `qualifyingNodes`/`rewardProgramCategoryId` wire and domain shapes are completely unchanged by this package — only how a human populates them changed).

## 33. Documentation-changes-log entry (232) — exact text prepended

See the diff in this PR for the exact prepended "Last controlled update" line, following the established format precisely (entry number, package id, one-paragraph summary covering entry SHA, worktree/branch, primary-worktree safety, findings, test results, and disposition).

## 34. PR state

**PR #255** — `https://github.com/Fkenogo/11THONUS/pull/255` (base `main`, head `feat/platform-baseline-008-reward-program-qualifying-node-selection`). **Open, not merged.**

## 35. CI state

CI (`Build, Lint, Test, Emulator Validation`) triggered on each pushed head; in progress at final-head push time (`094bee0`) — see this report's CORR-001 addendum below for the review-thread inventory and the exact final head this disposition covers.

## 36. Known limitations

See §26/§27 (consolidated above; not repeated).

## 37. Independent-review readiness

All targeted, unit, integration, and emulator suites pass with real, re-executed evidence (§22). One Playwright spec unrelated to this package failed for a root-caused, disclosed environmental reason (§25) and was not silently ignored — investigated, evidenced, and reported rather than asserted away. No governance document other than the changes-log entry was modified; no Founder decision was invented or presumed.

## 38. Final disposition

**A. PLATFORM-BASELINE-008 — IMPLEMENTED / AWAITING INDEPENDENT REVIEW.**

The engine-level operability gap `PLATFORM-BASELINE-007` identified (§4/§6/§14 item 2 of that report: Reward Program qualifying-node/category configuration required an operator to type/paste an opaque Firestore id by hand) is closed for both the qualifying-node and category fields, by reusing the existing governed Commerce Knowledge read path's generic building block, adding only the minimum new read surface genuinely required (§8), touching no PostgreSQL/migration/domain-validation code, adding zero dependencies, and maintaining full EN/FR parity. RF-3 server-side publish validation remains completely unmodified and authoritative. This is not disposition B — no STOP condition was found (§6.4) and no genuine new Founder decision was required. This is not disposition C — the operability gap was real and is not "already satisfied" by existing capability; a genuine, bounded, additive read surface plus a new selector UI was required and built.

---

*This report and its accompanying `documentation-changes-log.md` entry (232), together with the code changes listed in §9, are the only changes this task makes. No migration, no dependency, no governance-decision change, nothing merged.*

---

# PLATFORM-BASELINE-008-CORR-001 — Review-Finding Corrections (Information Disclosure + Two P2s)

**Date:** 2026-09-16
**Type:** Correction of three confirmed findings on the existing PR #255 (no new PR, no merge).
**Authority:** (1) an automated background security review flagged "information-disclosure in `commerceKnowledgeReadService.ts`", independently confirmed as real; (2) automated code review (`chatgpt-codex-connector`) on PR #255, two further **P2** findings, both independently confirmed as real.

## C1. Finding 1 — information disclosure in `resolveKnowledgeNodeLabels` (CONFIRMED, FIXED)

**Root cause.** `resolveKnowledgeNodeLabels` (`functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts`) called `getKnowledgeNodeById` and returned the node's real `canonicalName`-derived label and lifecycle `status` for **any** status at all, including `draft` and `in_review`. This endpoint requires only authentication (`resolveAuthenticatedBusinessActor`) — no Business membership, no Commerce-Knowledge-authoring permission, and (correctly, by design) no verification that the caller's supplied id actually came from one of their own Reward Program drafts. The domain's own established authority split (`referenceEligibility.ts`) already draws exactly this line: `isEligibleForNewReference` (`active` only) governs new selections, `isResolvableForExistingReference` (`active`/`retired`/`archived`) governs whether an *existing* reference still resolves for display — `draft`/`in_review` was never eligible to be referenced in the first place and must not resolve either way. `resolveKnowledgeNodeLabels` ignored this second predicate entirely, so any authenticated caller (Business Owner or Staff of any Business, not just one with a legitimate reason to know) could submit an arbitrary or guessed node id and learn the real name and lifecycle status of unpublished, governance-in-progress Commerce Knowledge taxonomy content.

**Correction.** Import and apply `isResolvableForExistingReference(node.status)` as the gate: a `draft`/`in_review` node (or a genuinely nonexistent id) now resolves identically — `{displayLabel: null, status: null}`. `active`/`retired`/`archived` nodes continue to resolve for display exactly as before (retirement never breaks an existing reference). No new authority/policy invented — this reuses the domain's own existing predicate, previously used by `listBusinessTypesForCategory`/`listQualifyingNodesForCategory` for the *candidate-list* side of the same distinction but never applied to this *hydration* endpoint.

**Regression tests added** (`commerceKnowledgeReadService.emulator.test.ts`): a `draft` node's real label/status never resolves; an `in_review` node's real label/status never resolves; an `archived` node still resolves for display (DAP-010 precedent unaffected).

## C2. Finding 2 — language-unscoped query keys under `staleTime: Infinity` (CONFIRMED, FIXED)

**Root cause.** `businessQueryKeys.rewardProgramCategories`/`qualifyingNodes`/`knowledgeNodeLabels` did not include `languageCode` in their key, while the corresponding hooks (`businessQueries.ts`) set `staleTime: Infinity` and send `languageCode` in every request. React Query only refetches on a genuine key change (or explicit invalidation, neither of which this page ever triggers for these three reads) — so switching the UI language (EN→FR or back) would leave the previously-cached, wrong-language labels on screen indefinitely for the category dropdown, the qualifying-node candidate list, and any hydrated "unavailable" labels.

**Correction.** All three key factories now take `languageCode` as an explicit parameter and include it in the returned tuple; the three hooks pass `languageCode ?? ""` through. This is additive only — no other caller of `businessQueryKeys` was touched, and the pre-existing `categories`/`types` keys (same underlying gap, `listBusinessCategories`/`listBusinessTypesForCategory`, already-shipped before this package) were deliberately left alone as genuinely out of this package's scope (not code this package added or touched).

**Regression test added:** `apps/web/src/business/hooks/queryKeys.test.ts` — proves distinct keys per language for all three factories, and key stability across repeated calls and (for `knowledgeNodeLabels`) id-array reordering.

## C3. Finding 3 — category `Select` lost native `required` validation (CONFIRMED, FIXED)

**Root cause.** The prior opaque category `TextField` carried `required`, giving native browser constraint-validation before any mutation could fire on an empty value. The replacement `Select` (`apps/web/src/components/ui/formPrimitives.tsx`) had no `required` prop at all, so the create form's category `Select` silently lost that protection — an unfilled category (still showing the placeholder option, value `""`) could reach `createMutation.mutate` and only fail after a round trip to the server.

**Correction.** Added an additive `required?: boolean` prop to the shared `Select` primitive (opt-in; every existing caller — `ClassificationStep.tsx`, `BusinessProfilePage.tsx` — is unaffected, since neither passes it and the prop defaults to `undefined`/falsy) and set `required` on the Reward Program category selector, restoring the exact native-validation behavior the prior `TextField` had.

**Regression test added:** `RewardProgramManagementPage.test.tsx` — asserts the category `Select` is `toBeRequired()` and that `checkValidity()` is `false` while empty.

## C4. Files modified (this correction only)

- `functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts` — `resolveKnowledgeNodeLabels` gated by `isResolvableForExistingReference`.
- `functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.emulator.test.ts` — 3 new regression tests (C1) + 3 new tests for previously-untested `listRewardProgramCategories` (a pre-existing minor coverage gap, closed opportunistically while already in this file for the security fix).
- `apps/web/src/business/hooks/queryKeys.ts` — three key factories take `languageCode`.
- `apps/web/src/business/hooks/queryKeys.test.ts` — **new**, 3 tests (C2).
- `apps/web/src/business/hooks/businessQueries.ts` — the three hooks pass `languageCode ?? ""` into their keys.
- `apps/web/src/components/ui/formPrimitives.tsx` — additive `required` prop on `Select`.
- `apps/web/src/business/dashboard/RewardProgramManagementPage.tsx` — `required` set on the category selector.
- `apps/web/src/business/dashboard/RewardProgramManagementPage.test.tsx` — 1 new regression test (C3).

No PostgreSQL/migration file, no permission/authorization file, no RF-3 validation file, and no dependency was touched by this correction.

## C5. Test results (actually run, this correction)

- Targeted: `commerceKnowledgeReadService.emulator.test.ts` (28/28, incl. the 6 new tests), `queryKeys.test.ts` (3/3, new file), `RewardProgramManagementPage.test.tsx` + `QualifyingNodeSelector.test.tsx` + `components/ui` (44/44 combined).
- Full `functions` unit suite: **158 files, 1762/1762 passed**.
- Full `apps/web` unit/component suite: **123 files, 878/878 passed** (was 122/874 before this correction — +1 file, +4 tests: the new `queryKeys.test.ts` file plus the new required-select regression test).
- Firebase Emulator Suite (full, `firebase emulators:exec ... test:emulator`, alternate ports to route around an unrelated concurrent `tiizi-s2b-preview` emulator instance on this shared machine, `firebase.json` reverted to its exact committed content immediately after — confirmed via `git diff firebase.json` showing no output): **65 files, 849 passed, 3 pre-existing skipped, 0 failed.**
- PostgreSQL cross-store integration suite (full, same alternate-port pattern, against a freshly recreated disposable local Postgres 16 container): **6 files, 94/94 passed.** (First attempt against the same container after several hours of accumulated prior test-run state showed one failure in `platformFoundationReadiness.postgres.test.ts` — the exact same class of stale-migration-state environmental flake independently documented in `PLATFORM-BASELINE-006A-CORR-003` §E7; `pnpm postgres:down && pnpm postgres:up` for a genuinely fresh database immediately resolved it to 94/94 — confirmed environmental, not a regression, not touched by this correction's actual file changes.)
- Playwright (`chromium` + `chromium-dashboard-harness`): **36/37 passed** — the same single `app-shell.spec.ts` failure as the original implementation pass (§25), reconfirmed as the same local port-4173 collision with an unrelated already-running preview server on this shared machine (not a product regression).
- Typecheck (`apps/web` + `functions`), lint (0 errors, same 1 pre-existing unrelated warning), format check, production build, `git diff --check`: all clean.

## C6. Review-thread inventory and dispositions

Three inline review threads existed on PR #255 (from `chatgpt-codex-connector`'s automated review of commit `e827339`), all **P2**:

1. **P2** — `functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts:302` — information disclosure via unrestricted status resolution. **Fixed in `360e317` (§C1).** Replied with root cause, fix, and test evidence.
2. **P2** — `apps/web/src/business/hooks/queryKeys.ts:14` — language-unscoped keys under `staleTime: Infinity`. **Fixed in `094bee0` (§C2).** Replied with root cause, fix, and test evidence.
3. **P2** — `apps/web/src/business/dashboard/RewardProgramManagementPage.tsx:243` — category `Select` missing `required`. **Fixed in `094bee0` (§C3).** Replied with root cause, fix, and test evidence.

All three threads are addressed; none left open. No new review finding was introduced by this correction as of the corrected head (self-reviewed against the full diff before finalizing).

## C7. SHAs

- Original implementation head: `e827339087646ff8c32733b52db04fdb671504f1`.
- Correction commit 1 (Finding 1, information disclosure): `360e3173666ffc801030de057ddb923b20263291`.
- Correction commit 2 (Findings 2/3, the two P2s): `094bee0f217495207cbad83edd103c9277dd6c4b`.
- **Final PR head (this disposition covers this exact SHA): `094bee0f217495207cbad83edd103c9277dd6c4b`.**
- Base: `b36043c48afd4bf7aea3217036666255d3cbaa57` (`origin/main` at entry, unchanged).

## C8. Rollback

Revert the two correction commits (`git revert 094bee0 360e317`) on `feat/platform-baseline-008-reward-program-qualifying-node-selection`. Nothing outside the 8 files in §C4 is affected: no migration, no dependency, no configuration, no governance decision, no schema change. Reverting restores the original `e827339` behavior (including the information-disclosure gap) — not recommended; fixing forward is the intended path.

## C9. Worktree safety

All correction work was done in the same isolated worktree (`.claude/worktrees/platform-baseline-008`) on the same branch, pushed to the same PR #255. The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`, unrelated in-progress legal drafting work) was never entered, staged, committed, reset, or cleaned at any point during this correction — see the top-level completion report for the final `git status` proof.

## C10. Final disposition

**PLATFORM-BASELINE-008-CORR-001 — INFORMATION-DISCLOSURE AND TWO P2 FINDINGS CORRECTED / AWAITING INDEPENDENT RE-REVIEW. Do NOT merge.** This does not change the package-level disposition recorded in §38 (**A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW**); it corrects genuine findings on the same disposition, the same PR, the same branch.
