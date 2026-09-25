# PLATFORM-BASELINE-013E — Legacy Qualification Model Cleanup

**Status:** Implemented; awaiting independent review. No merge performed.

**Entry `origin/main`:** `7c4e7cc62b7bb264b4dd9c3d47fe04b10693c6a1`

**Branch:** `codex/platform-baseline-013e`

**Worktree:** `/private/tmp/11thonus-pb013e`

**PR:** [#273](https://github.com/Fkenogo/11THONUS/pull/273), OPEN against `main`, mergeable. Implementation head `85a195d62090553d26e8e7d2262607418f24ecaa`.

**Scope:** drop the superseded `reward_program_version_qualifying_nodes` table via migration `0019` after a fail-closed equivalence gate, and remove the proven-dead old qualification-model runtime surfaces. No authority, purchase, permission, contract, PB-013D, or P3-3 change.

## 1. Entry gate and worktree safety

`git fetch origin --prune` completed before implementation; `origin/main` verified exactly `7c4e7cc62b7bb264b4dd9c3d47fe04b10693c6a1`, matching the PB-013E-READINESS-001 assessment base — zero advancement, no reconciliation. Programme state confirmed: PB-013A.1/A.2/B/C, PB-013D-PRE-001, and PB-013D CLOSED; PB-013B P3-3 OPEN; latest migration `0018`; no `0019`; no `013E` branches; only unrelated open docs PRs (#164, #34). PB-013E had not begun.

All six readiness re-verifications held on the entry tree: zero production runtime readers/writers of the legacy table (only doc comments plus the 0017 backfill); 0017 the only later migration referencing it; no inbound FK; PB-013D, current Reward Program qualification, and purchase/10+1 all independent of it. No STOP condition.

Implementation used an isolated worktree/branch from `origin/main`. The primary checkout, carrying extensive unrelated dirty work on `docs/11thonus-cf-001-cloudflare-assessment-001`, was never stashed, reset, cleaned, or modified. Final Founder disposition of the two readiness preconditions was applied: `listQualifyingNodesForCategory` backend callable/service/tests RETAINED; `purchase_records.qualifying_item_id` NOT tightened and `purchase_records.knowledge_node_id` NOT removed.

## 2. Authority and documentation reviewed

- PB-012 readiness design in full, especially §13 (migration table: `0019 drop_legacy_qualifying_nodes`, deferred, only after 0017 backfill verified; optional later NOT NULL tightening) and §14 retain/adapt/remove matrix (table REPLACE-deferred; CK reads, label gate, language keys, search bounds, debounce RETAIN; category field RETAIN).
- PB-013E-READINESS-001 (accepted): complete legacy inventory, classification table, table-dependency audit, 0019 design, dead-code/CK/RP/purchase/test/docs/P3-3 audits, disposition B with the two preconditions decided above.
- PB-013A.1 report and migration `0017` (exact backfill semantics: per-(Business, node) marker synthesis, per-legacy-row frozen snapshots, `ON CONFLICT DO NOTHING`, disclosed assumptions) and its down-migration refusal precondition.
- PB-013B report (new authority, publish flow, P3-3 TOCTOU carry-forward), PB-013C report (purchase binding, legacy-NULL exemption, fingerprint item-awareness), PB-013D report and closure (classification surfaces that must keep working).
- `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001` and `DEC-LOY-017` / `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001`.
- Current models, repositories, commands, transport parsers/whitelists, permission catalogues, CK read service, web hooks/keys/adapters, and the migration test harness (`migrationRunner.ts`, scratch-prefix technique, `IF EXISTS` teardown convention).

No authority conflict found. TRD10 §10.9.2 staleness is recorded as a separate controlled-documentation carry-forward, not corrected here.

## 3. Pre-change flow and strategy

The legacy `reward_program_version_qualifying_nodes` junction (0003: version id + CK node id + nullable display name) was superseded by `reward_program_version_qualifying_items` in PB-013B and backfilled by copy in 0017, then retained unread through PB-013C/D. Dead companions survived with it: `validateQualifyingNodes` (whose "purchase write path" docblock was falsified by PB-013C), the `QualifyingNode` type, `invalidQualifyingNodeError`, a web category hook/key/adapter trio with zero callers, and pin-the-table test assertions.

Strategy, test-first: (1) prove the safety boundary with new migration tests (empty-DB drop, seeded-backfill survival, fail-closed gate, product smoke, structural-only down + re-apply); (2) add the 0019 pair; (3) delete only proven-dead runtime surfaces; (4) convert legacy-pinning tests to migration evidence or delete with the dead code; (5) full non-regression across every affected suite. The backend category callable stays per disposition; purchase columns stay per disposition; P3-3 untouched; TRD10 untouched.

## 4. Implementation and authority confirmations

- **Migration `0019` (`0019_drop_legacy_qualifying_nodes.sql`):** Gate 1 asserts `schema_migrations` records `0017` (protects manual application; the runner additionally guarantees ordered-prefix application). Gate 2 asserts, per legacy row, an `EXISTS` junction row with the same version id, same `knowledge_node_id_at_version`, and `item_name_at_version = COALESCE(business_display_name, knowledge_node_id)` — 0017 Step 2's exact semantics, scoped legacy→migrated (no naive global count; genuine post-013B bindings have no legacy counterpart). Any failure `RAISE EXCEPTION`s before the DROP. Then `DROP TABLE reward_program_version_qualifying_nodes` with default RESTRICT (CASCADE explicitly prohibited in comments as a would-be silent-dependent-dropper). Scope is exactly one table: purchase columns untouched.
- **`0019.down`:** structural-only recreation, byte-identical shape to 0003 (columns, composite PK, outbound FK, index) with a shell-marking table comment. Header documents lossiness explicitly (COALESCE collapse, canonical-name choice, remap lineage breaks, deleted versions, Firestore drift) and directs real recovery to a pre-0019 logical backup. No fabricated rows.
- **Dead backend removed:** `validateQualifyingNodes`, `QualifyingNode`, `invalidQualifyingNodeError`, their exclusive imports; stale comments reworded in `rewardProgramKnowledgeValidation.ts`, `index.ts` (BusinessType callable doc), `commerceKnowledgeReadService.ts`, `rewardProgramRepository.ts` (both tombstones now record the 0019 drop), `rewardProgram.ts` (junction note extended). `QUALIFYING_NODE_TYPES` retained (live standard-reward path). `assertNodeEligible`, category/standard-reward validators, `assertHasQualifyingItemsForPublish`, `validateAllReferences` untouched.
- **Dead web removed:** `useQualifyingNodesForCategoryQuery`, `businessQueryKeys.qualifyingNodes` (+ its key test), `toCall/makeCallListQualifyingNodesForCategory`, `ListQualifyingNodesForCategoryRequest`, the adapter test block, and two hook doc references. Backend `listQualifyingNodesForCategory` callable/service/emulator tests retained per disposition. Live PB-013D surfaces (BusinessType/search/labels hooks, editor, batching/retry, debounce, EN/FR keys) untouched.
- **Qualifying Item authority:** unchanged — `qualifyingItemId` structural, `itemNameAtVersion` frozen evidence, `knowledgeNodeIdAtVersion` nullable enrichment; CK state post-assignment still cannot invalidate.
- **Purchase / 10+1:** zero production/test semantic change; `qualifyingItemId` request, server-resolved version, server-derived label, fingerprint, Trust Events, verify/reject/dispute, units/cycles/rewards all proven unchanged by the untouched suites below.
- **Permissions:** unchanged (Owner/Manager/Staff/platform-admin boundaries; no catalogue, evaluator, or callable-auth change).
- **API contracts:** unchanged (whitelists already excluded legacy fields; whitelist-drop tests retained and passing).
- **PB-013B P3-3:** OPEN / UNCHANGED / NOT FIXED. Snapshot-resolution/transaction statements untouched (verified disjoint from every edit).
- **Historical migrations 0001–0018:** byte-identical (checksum-guarded by the runner; full suite green).

## 5. Files changed

Added:
- `functions/src/infrastructure/postgres/migrations/0019_drop_legacy_qualifying_nodes.sql` — gates + RESTRICT drop.
- `functions/src/infrastructure/postgres/migrations/0019_drop_legacy_qualifying_nodes.down.sql` — structural-only shell, documented lossy.
- This report (plus change-tracking updates below).

Modified (backend): `rewardProgramKnowledgeValidation.ts`, `rewardProgram.ts`, `rewardProgramErrors.ts`, `rewardProgramRepository.ts`, `index.ts`, `commerceKnowledgeReadService.ts` (dead symbols + stale comments only).

Modified (web): `businessQueries.ts`, `queryKeys.ts`, `queryKeys.test.ts`, `commerceKnowledge.ts`, `commerceKnowledge.test.ts` (dead category surface only).

Modified (tests): `rewardProgramMigrations.postgres.test.ts` (new 0019 A/B/C/D/F suite; version lists to nineteen; Case K/idempotency/down tests capped at pre-0019 scratch; legacy-constraint/retention tests removed; `IF EXISTS` teardown kept for the fail-closed survivor), `rewardProgramCommands.postgres.test.ts` (legacy cleanup line + never-written assertion removed), `purchaseCommands.postgres.test.ts` (cleanup line), `qualifyingItemCommands.postgres.test.ts` (one array entry), `platformFoundationReadiness.postgres.test.ts` (Case B list to nineteen; `IF EXISTS` teardown kept).

Deleted: none (no file fully removed; `QualifyingNodeSelector` was already gone).

No dependency, config, permission, purchase, or TRD change. PB-013B P3-3 untouched.

## 6. Tests and validation

- New 0019 suite: **5/5 passed** — A (empty-DB drop, structures intact), B (seeded legacy survives via backfill, byte-exact), C (broken representation → migration RAISES, table + row survive, 0019 unrecorded), D (bind/publish-shape/hydrate smoke with no legacy table), F (down recreates empty shell with 0003 shape, new rows untouched, 0019 re-applies).
- Full migration file: **41/41 passed** (backfill equivalence/idempotency/down-refusal/isolation/NULL-fallback preserved via pre-0019 scratch caps).
- Cross-store PG: Reward Program **50/50**, Qualifying Item **59/59**, Purchase **42/42** (create/update/next-version/publish/hydrate, classification assign/change/remove, record/verify/reject/dispute, units/cycles/rewards, fingerprint item-awareness).
- Infra PG (readiness/runner/transaction/QI repository): **46/46**.
- Functions unit: **162 files, 1,847 tests passed**. Web unit: **124 files, 902 passed** (incl. updated key/adapter tests). Emulator suite: **65 files, 864 passed, 3 pre-existing skipped**.
- Playwright: **37/37 passed** (initial local "37 failed" was a missing browser binary in the fresh worktree install; `playwright install chromium` then green — environmental, documented).
- Typecheck (functions + web): passed. Lint: 0 errors (1 pre-existing `react-refresh` warning in `BusinessApiContext.tsx:26`). Prettier on changed files: passed (`.sql` files are implicitly excluded repo-wide, verified against 0003). Builds (functions `tsc`, web `tsc -b` + vite): passed. `git diff --check`: clean.
- Environment notes: repo PG port 54329 was occupied by another worktree's container, so tests ran against a disposable container on 54331 via `PLATFORM_POSTGRES_URL` (precedent: Entries 232/233); a stale Firestore JVM from an earlier exec held 8080 and was cleared after attribution via its rules path (own worktree); another session holds emulator-UI 4000, so exec used a temp `--config` with UI disabled (repo `firebase.json` untouched). One self-caught defect during implementation: scratch post-dirs carrying only 0017+0018 violate the runner's exact-ordered-prefix rule — fixed to full pre-0019 prefixes before proceeding. No repo config changed for any of this. Runtime Node 22 vs requested Node 20 engine warning (pre-existing).

## 7. Change boundaries, risks, and rollback

Risk is concentrated in one irreversible step (the DROP), contained by: in-transaction gates (fail closed, proven by test C), RESTRICT-only semantics, `IF EXISTS` teardowns, and the structural-only down. Residual risks: a deployed DB that never ran 0017 cleanly will fail 0019 loudly at deploy time (intended — investigate, do not force); the down migration restores structure, never evidence (documented; real recovery = pre-0019 backup). Code-deletion risk is nil beyond compilation (zero callers proven, typechecks + full suites green). No P3-3 interaction (disjoint statements). Rollback: revert the PR merge for code/tests; for schema, `0019.down` recreates the empty shell only — data recovery requires the pre-drop backup.

Carry-forwards (explicitly NOT in this PR): PB-013B P3-3 stays OPEN; TRD10 §10.9.2 needs a separate controlled correction (stale canonical schema block naming the dropped table); `purchase_records.qualifying_item_id` NOT NULL tightening and `knowledge_node_id` disposition need a separate data-policy decision; the retained category callable's long-term future is undecided but harmless.

## 8. PR and final disposition

Branch `codex/platform-baseline-013e` pushed; PR opened against `main` (number recorded below); exact-head CI awaited. No merge will be performed.

**Final disposition:** `PLATFORM-BASELINE-013E — IMPLEMENTED / AWAITING INDEPENDENT REVIEW`.
