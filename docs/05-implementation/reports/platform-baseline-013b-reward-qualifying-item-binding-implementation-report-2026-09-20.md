# PLATFORM-BASELINE-013B — Reward Program → Business-Owned Qualifying Item Binding: Implementation Report

> **Date:** 2026-09-20
> **Entry origin/main SHA:** `60ed656ab084b778f474081434d3c3d3fde10872` (verified via `git fetch origin` + `git rev-parse origin/main` before any change; matches the task's expected SHA exactly — no drift, no intervening commits to inspect)
> **Branch:** `feat/platform-baseline-013b-reward-qualifying-item-binding`
> **Worktree:** `/Volumes/PRODUCTION/Projects/11THONUS-worktrees/pb013b-binding-impl-001` (isolated; primary checkout untouched)
> **Governing authority (read directly from the repository before implementation):** `FD-REWARD-QUALIFYING-ITEM-001` / `DEC-LOY-016`; `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001` / `DEC-LOY-017`; `PLATFORM-BASELINE-012` implementation-readiness design incl. Correction 001 (§16 lettered packages, §16A root cause, §14 retain/adapt/replace matrix, §5/§6/§7/§8/§12); merged `PB-013A.1` (migrations `0016`/`0017`); merged `PB-013A.2` (QualifyingItem domain, `qualifyingItem.manage`, four callables). Nothing implemented from the task prompt alone.
> **Scope:** exactly `PB-013B` per §16 — Reward Program binding, atomic backend + consuming UI. No migration. No purchase file (non-test) touched. `PB-013C`/`D`/`E` not started.
> **Final disposition:** A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW (pending CI + review; DO NOT MERGE per instruction).

## 1. Analysis performed before modification

- Read the PB-012 design report end to end (§1–§30, both amendments, Correction 001), with focus on §5 (entity), §6 (junction replacement + why in-place adaptation is impossible — `knowledge_node_id` is half of a `PRIMARY KEY`, and PostgreSQL forbids `NULL` in PK columns), §7 (purchase binding — explicitly PB-013C, not this package), §8 (frozen-snapshot versioning), §11 (Commerce Knowledge as enrichment), §12 (UX flows A/B/C), §13 (migrations), §14 (24-row retain/adapt/replace matrix), §15 (test plan A–X + Y–AC), §16 (lettered packages; PB-013B row), §16A (atomic-merge-boundary rule).
- Read `DEC-LOY-016` evidence + `DEC-LOY-017` evidence + decision-register rows (via the design report's citations and the changes log Entries 238–246).
- Read migrations `0016`/`0017` (up + down, incl. the CORR-001 rollback-refusal precondition and the backfill's marker/tagging + tie-breakers).
- Read the full QualifyingItem domain from PB-013A.2 (model, repository with `business_id`-scoped statements, commands, `classifyMissingActiveItem`, queries, knowledge validation, `qualifyingItem.manage` catalogue + evaluator Step 5d, four callables + transport).
- Read the full Reward Program stack: model, repository, all four commands, knowledge validation, transport parsers in `index.ts`, `RewardProgramManagementPage`, `QualifyingNodeSelector`, API/mutation/hooks/query-keys, EN/FR copy, all RP tests, PB-008 protections, PB-010B corrections.

No repository contradiction with PB-012 was found; no settled decision needed reopening.

## 2. Existing Reward Program qualification flow found

`RewardProgramManagementPage` (form state `qualifyingNodes: QualifyingNodeWire[]`) + `QualifyingNodeSelector` (Commerce Knowledge candidate list + search escape hatch + unavailable section)
→ wire `QualifyingNodeWire {knowledgeNodeId, businessDisplayName}` (`api/rewardProgramMutations.ts`, hooks, language-scoped Commerce Knowledge query keys + `rewardPrograms`)
→ transport `parseQualifyingNodes` (`index.ts`)
→ commands (`create`/`updateDraft`/`createNextVersion` carry `qualifyingNodes`; `publish` carries ids only)
→ validation `validateQualifyingNodes` (Firestore `assertNodeEligible`: exists + `standard_product`/`standard_service` + `active`) at draft time and again pre-transaction at publish (RF-3); `assertHasQualifyingNodeForPublish` (≥1, publish-only)
→ persistence `reward_program_version_qualifying_nodes` rows (PK `(version, knowledge_node_id)`, nullable `business_display_name`)
→ publication `publishVersion` flips draft→active, supersedes prior active, moves `current_version_id`.

Canonical qualifying-node identity participated in: the `QualifyingNode` model type; repository fetch/insert; all four command request types + idempotency fingerprints; validation; three transport parsers; wire types; hook payloads; page form state + draft hydration + next-version seeding; the selector component; EN/FR copy (`fieldQualifyingNodes`, `qualifyingNodeSelector.*`); unit, postgres, transport, and UI tests; and (as setup fixtures only) the purchase postgres tests.

## 3. Correction strategy

Replace the identity end to end with `qualifyingItemId`, resolving frozen snapshots server-side, per PB-012 §14: REPLACE the model type/wire type/parsers/`validateQualifyingNodes`-for-RP/legacy-table access; ADAPT `businessDisplayName` → `NOT NULL item_name_at_version`; RETAIN category optionality, RF-3 discipline, all Commerce Knowledge reads, language-scoped keys, debounce, search bounds, the 10+1 engine byte-for-byte. Draft input carries ids only; version rows carry frozen snapshots. Publish re-validates the draft's current bindings and refreshes snapshot evidence at publish time. The legacy table is retained, untouched, and unread (no dual authority, no premature drop — that is PB-013E). Purchase is untouched (PB-013C owns it; purchase never reads a version's qualification set, verified by grep). UI moves atomically in the same merge (Correction 001 rule).

## 4. Files modified (25) + created (6)

Backend (`functions/src`): `domains/rewardProgram/models/rewardProgram.ts`, `models/rewardProgramErrors.ts`, `repositories/rewardProgramRepository.ts`, `services/{createRewardProgramCommand,updateRewardProgramDraftCommand,createNextRewardProgramVersionCommand,publishRewardProgramVersionCommand,rewardProgramKnowledgeValidation}.ts`, `index.ts`, `index.test.ts`, `domains/rewardProgram/services/rewardProgramCommands.postgres.test.ts`, `domains/purchase/services/purchaseCommands.postgres.test.ts` (fixtures only), `domains/commerceKnowledge/services/commerceKnowledgeReadService.ts` (two doc comments only).
Created: `domains/rewardProgram/services/rewardProgramQualificationValidation.ts`.
Frontend (`apps/web/src`): `business/api/rewardProgramMutations.ts`, `business/dashboard/RewardProgramManagementPage.tsx` (+ test rewrite), `business/hooks/{businessQueries.ts (comments),queryKeys.ts,rewardProgramMutations.test.tsx,queryKeys.test.ts,useDebouncedValue.ts (comment)}`, `i18n/locales/{en,fr}.ts`, `i18n/i18n.test.tsx`.
Created: `business/api/qualifyingItems.ts`, `business/hooks/{qualifyingItemQueries,qualifyingItemMutations}.ts`, `business/dashboard/QualifyingItemSelector.tsx` (+ test).
Deleted: `business/dashboard/QualifyingNodeSelector.tsx` (+ test) — superseded; classification-aid reads retained for PB-013D.

## 5. Reward Program model changes

`QualifyingItemRef {qualifyingItemId, itemNameAtVersion, knowledgeNodeIdAtVersion}` added; `RewardProgramVersionRow.qualifyingNodes` → `qualifyingItems: readonly QualifyingItemRef[]`; `RewardProgramVersionDraftInput.qualifyingNodes` → `qualifyingItemIds: readonly string[]`. `QualifyingNode` type retained ONLY for the purchase write path until PB-013C (documented at both use sites). New errors: `rewardProgramPublishRequiresQualifyingItemError`, `qualifyingItemReferenceNotFoundError` (`RESOURCE_NOT_FOUND`, no disclosure), `qualifyingItemReferenceNotActiveError` (`INVALID_STATE_TRANSITION`), `invalidQualifyingItemReferenceError`. `invalidQualifyingNodeError` retained for the purchase path only.

## 6. Persistence/binding changes

Repository reads/writes `reward_program_version_qualifying_items` exclusively (`fetchQualifyingItems` returns frozen snapshots ordered by name then id; `insertQualifyingItems` stores caller-resolved snapshots verbatim). Zero reads/writes of the legacy table (proven by a test asserting it stays empty). `publishVersion` refreshes snapshot evidence at publish time (delete + re-insert within the publish transaction). No migration (reads/writes the `0017` tables as §16 specifies).

## 7. Transport changes

`parseQualifyingNodes` → `parseQualifyingItemIds` (array of non-empty strings, field `qualifyingItemIds`); all three draft parsers updated. Legacy `qualifyingNodes`/`knowledgeNodeId`/`businessDisplayName` fields are structurally absent (whitelist drops them — tested). Publish parser unchanged (ids only, as before).

## 8. Validation changes

New `resolveQualifyingItemSnapshots` (Business-isolated repository reads; foreign/fabricated/malformed → `RESOURCE_NOT_FOUND` with identical message; same-Business retired → `INVALID_STATE_TRANSITION`; duplicates rejected; present classification re-checked via the unchanged `assertNodeEligible`, now exported; absent classification performs zero Commerce Knowledge reads). `validateAllReferences` narrowed to category + standard-reward (qualification moved out). `assertHasQualifyingNodeForPublish` → `assertHasQualifyingItemsForPublish` (counts only). `validateQualifyingNodes` retained ONLY for the purchase path until PB-013C.

## 9. Create/update/version/publish behavior

All four paths validate + snapshot server-side; fingerprints carry `qualifyingItemIds`. Drafts may carry zero items; publication requires ≥1 (authoritative, server-side). Publish re-validates the draft's current bindings pre-transaction (RF-3) and refreshes frozen evidence at publish time. UI owns no authority.

## 10. Business-isolation enforcement

Structural (`business_id`-scoped repository reads, reused — no duplicated lookup logic): foreign/fabricated/malformed ids are indistinguishable `RESOURCE_NOT_FOUND` (tested: identical category AND message for foreign vs fabricated). `rewardProgram.manage` untouched (Owner-only).

## 11. Retirement/historical-reference behavior

Retirement blocks every new binding path (create/update/next-version/publish-time) with `INVALID_STATE_TRANSITION`; never breaks an existing version (reads never consult item status; frozen snapshots render renames/remaps/retirements inert). No reactivation path added.

## 12. Frozen-snapshot behavior

`item_name_at_version` (`NOT NULL`) + `knowledge_node_id_at_version` (nullable) stored at draft-write, refreshed at publish. Tests prove: rename between draft-save and publish is captured; post-publish rename/remap never moves v1; post-rename v2 snapshots the new name.

## 13. Commerce Knowledge optionality confirmation

Unclassified items (`knowledgeNodeId = NULL`) create, bind, and publish with zero Commerce Knowledge reads (covered across create/update/publish tests, incl. an explicit unclassified UI path). Present mappings are re-validated with the unchanged eligibility predicate (wrong-typed/draft/retired mappings rejected at bind and at publish).

## 14. UI/wire transition (atomic, one merge)

`QualifyingItemWire` replaces `QualifyingNodeWire`; draft payloads carry `qualifyingItemIds: string[]`. New `api/qualifyingItems.ts` + `qualifyingItemQueries` + `qualifyingItemMutations` (key-rotation + narrow invalidation) + `queryKeys.qualifyingItems` (Business-scoped, deliberately not language-scoped — names are stored once, never translated). New `QualifyingItemSelector` (active-only checkboxes, snapshot-backed retired section, no ids, no taxonomy UI). Page gains the item library section (add/rename/two-step retire; Owner/Manager visible) and binds drafts through the new selector; published/draft views render frozen names. No shipped caller sends the old contract (verified by grep + typecheck).

## 15. EN/FR changes

Replaced `fieldQualifyingNodes` → `fieldQualifyingItems` + `boundItemsLabel`; replaced `qualifyingNodeSelector.*` → `qualifyingItemSelector.*` + `qualifyingItems.*` (section, add/rename/retire). Structural EN/FR parity test passes; new explicit EN + FR copy assertions added.

## 16. PB-008/PB-010B regression assessment

Retained and green: unpublished-knowledge disclosure gate (`resolveKnowledgeNodeLabels` + eligibility split — untouched); language cache isolation (Commerce Knowledge keys still language-scoped; still tested); server-side publish authority (RF-3 intact, still tested); minimum-one-qualification publication rule (still tested A–G); no canonical-id fabrication path (RP path no longer accepts canonical ids at all); no Business-Type taxonomy gate (still tested via Q-analogue). `useDebouncedValue`/search bounds retained for the deferred classification picker.

## 17. rewardProgram.manage non-regression

Zero diff to the permission catalogue/evaluator; Manager still denied create/update/next-version/publish (existing + new explicit publish/next-version denial tests); Manager `qualifyingItem.manage` allow explicitly asserted alongside (DEC-LOY-017 coexistence).

## 18. Purchase non-regression

Zero diff to every non-test purchase file (verified by `git diff --name-only`), incl. `parseRecordPurchaseRequest`, request types, persistence, Trust Events, UI, `purchaseRequestHash`. Purchase postgres suite: 37/37 green with RP fixtures re-based on unclassified items.

## 19. purchaseRequestHash non-regression

Zero diff (verified). RP fingerprint change (`qualifyingItemIds`) is confined to `rewardProgramRequestHash` callers.

## 20. 10+1 engine non-regression

Zero diff to `verifyPurchaseCommand`, verified-unit/loyalty-cycle repositories, invariants, migrations `0009`–`0014` (verified). Purchase suite's verify/reject/dispute/circle/reward/idempotency tests all green unmodified in behavior.

## 21. Tests added/changed

- `rewardProgramCommands.postgres.test.ts`: 39 → 49 tests. Migrated all fixtures to item ids; rewrote CK-identity tests as classification-mapping tests (F/G/Q/S analogues); new 10-test PB-013B block (single/multi/NULL-mapping bind, duplicates, foreign vs fabricated non-disclosure incl. message equality, malformed id, retired-on-all-paths, retire-between-draft-and-publish, publish-time snapshot refresh + post-publish rename/remap freezing + v2 new-name snapshot, Manager RP denial + item-manage allow, legacy-table-empty single-authority proof).
- `index.test.ts`: new contract parsing + legacy-field-drop + `qualifyingItemIds` shape rejections.
- `purchaseCommands.postgres.test.ts`: fixtures only (unclassified item per program; new-table cleanup).
- Web: `RewardProgramManagementPage.test.tsx` rewritten (32 tests), new `QualifyingItemSelector.test.tsx` (9), `rewardProgramMutations.test.tsx` payload re-based, `queryKeys.test.ts` + qualifyingItems key test, `i18n.test.tsx` + EN/FR copy tests.
- No snapshot-updates-to-pass; all assertions behavioral.

## 22. Commands executed (all in the isolated worktree)

`git fetch origin`; `git worktree add … -b feat/platform-baseline-013b-reward-qualifying-item-binding origin/main`; `pnpm install`; `pnpm --filter functions run typecheck`; `pnpm --filter functions run test`; local PG15 on `:54329` + Firestore emulator jar on `:8090` (ports 54329-fresh, 8080-taken); `PLATFORM_ENV=test … pnpm --filter functions test:postgres`; `FIRESTORE_EMULATOR_HOST=… pnpm --filter functions test:emulator` (+ scoped re-runs); unmodified-base isolation run in a second worktree (removed afterwards); `npx eslint` (functions scope + web business/i18n scopes); `pnpm --filter functions run build`; `pnpm --filter web run typecheck`; `pnpm --filter web run test`; `pnpm --filter web run build`; `git diff --check`.

## 23. Exact test results (final state)

- Functions unit: 162 files / 1847 tests pass.
- Functions postgres: 8 files / 226 tests pass (RP 49, purchase 37, qualifyingItem 59+23, migrations 35, infra 23).
- Web: 123 files / 890 tests pass.
- Functions emulator: 62 files / 810 pass; 3 files / 54 fail — `staffInvitation`, `acceptStaffInvitationIdempotency`, `staffMembershipIntegration` — all `getAuth().listUsers()` "No Firebase project" errors: the Firebase Auth emulator was not running in this environment. Isolation proof: the identical 3 files / 54 tests fail on the unmodified `origin/main` base worktree under the same setup. Pre-existing environmental failure, unrelated to this package (zero diff in those domains).
- Typecheck (functions + web), ESLint (0 errors; 1 pre-existing warning in untouched `BusinessApiContext.tsx`), both builds, `git diff --check`: clean.
- Playwright: no spec covers the Reward Program flow (only shell/profile/team/terms harnesses) — nothing applicable to run.

## 24. CI result on exact head

PR #265 head `e0c608f4745c583f096dbfb6c7693693d11e23c7`: CI run `35505524536` **SUCCESS** (completed 2026-09-20, full "Build, Lint, Test, Emulator Validation" workflow on the exact pushed head — no intervening commits). Recorded here by a docs-only follow-up commit; the follow-up head's own CI re-run is the final gate (see PR checks).

## 25. Dependencies added

None. No config changes. No schema/migration changes (reads/writes the merged `0016`/`0017` tables only).

## 26. Coherent-main proof

- RP backend and all shipped RP UI/wire callers agree on `qualifyingItemIds`/`QualifyingItemWire` (grep + typecheck + suites).
- Purchase flow agrees with its unchanged contract (zero non-test diff; 37 green).
- No runtime path requires PB-013C: purchase never reads a version's qualification set; RP never touches purchase tables; legacy table retained + unread.
- Main runs after PB-013B alone: additive-compatible cutover, no migration, both builds green.

## 27. Risks

- Emulator-suite Auth gap is environmental here; CI (full emulator set) is the authoritative gate — if CI shows the same 3-file failure, it is the known pre-existing condition, not this package.
- The `0017` backfill's synthesized rows (if any exist in a deployed DB) now resolve through the same read path as genuine items — by design (backfill rows are `active` items owned by the same Business).
- Deleted `QualifyingNodeSelector` will be re-created in re-scoped form by PB-013D; its Commerce Knowledge read surface is retained, so that package has its foundation.

## 28. Rollback instructions

Revert the PR merge commit (`git revert -m 1 <merge>`; single atomic unit per PB-012 §16 — backend + UI revert together, never one side). No migration to roll back (`0016`/`0017` pre-date this package and are untouched). Junction rows written by this package become unread after revert but harmless; the legacy table was never written.

## 29. Review-thread inventory / unrelated-file verification / safety

- Review threads: none yet (PR newly opened).
- Unrelated files: diff is 25 modified + 6 new + 2 deleted, all inside the §16 PB-013B file list; purchase/10+1/permissions/migration/infra diffs verified empty above.
- Primary-worktree safety: primary checkout never entered for edits; confirmed `git status` there untouched by this task (its pre-existing dirty state left alone). No stash/reset/clean/amend; no other worktree modified (verification worktree created and removed).
- `PB-013C`/`D`/`E` not started (no `0018`/`0019`, no `qualifyingItemId` purchase binding, no classification picker, no legacy drop).

## 30. Report path

This file: `docs/05-implementation/reports/platform-baseline-013b-reward-qualifying-item-binding-implementation-report-2026-09-20.md`. Changes-log entry: `docs/changes/IMPLEMENTATION_CHANGES.md` Entry 247 (TBD number at append time).
