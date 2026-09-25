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

## 9. PLATFORM-BASELINE-013E-CORR-001 — 0019 equivalence-gate correction for legitimately evolved drafts (2026-09-25, same PR #273, unmerged)

**Entry gate (verified before any change):** PR #273 OPEN/unmerged; head exactly `fe26931422aae6085ad64bffe4cbf6792555e4cd` (no drift); base `7c4e7cc62b7bb264b4dd9c3d47fe04b10693c6a1` (reviewed PB-013E baseline); exact-head CI green; P1 review thread present on `functions/src/infrastructure/postgres/migrations/0019_drop_legacy_qualifying_nodes.sql`. Work performed in an isolated worktree on the PR branch; the primary checkout (unrelated dirty docs work) untouched.

**Confirmed P1 root cause:** the shipped Gate 2 required every legacy row to byte-match the CURRENT authoritative junction (version id + CK node + frozen name). Draft edits replace the junction wholesale (`updateDraftVersion` DELETE+INSERT; publish refreshes snapshots) while the legacy table is intentionally never updated — so any legitimate post-0017 draft evolution (remove/rename/remap binding) rendered the legacy row "unrepresented" and aborted `0019`, blocking deployment for valid state. Proven before the fix: new tests B/C/D1/D2 all failed on the old gate with `refusing to drop ... 1 legacy row(s) have no equivalent ... representation`.

**Correction strategy (stated before modifying files):** keep Gate 1 (`0017` recorded) and the RESTRICT drop; keep exact-match as the ONLY leg for immutable (`active`/`superseded`) versions; add two draft-only legs derived from existing repository facts — 0017 Step 1 provenance (marker item for the same Business/node, surviving wholesale junction replacement) and structural descent (draft still binds a same-Business marker item, surviving live-item rename/reclassification with refreshed snapshots). Mutability read from `reward_program_versions.status`, the command layer's own lifecycle authority. Never "DROP if 0017 exists": per-row evidence is still required for every legacy row. No naive global count; CK never qualification authority; `0017` byte-identical.

**Revised Gate 2 (in `0019_drop_legacy_qualifying_nodes.sql`):** a legacy row is represented when (a) the exact current-junction match holds, OR (b) its version is still `draft` AND a marker-created item exists for the same (Business, knowledge_node_id), OR (c) its version is still `draft` AND its current junction binds a same-Business marker item. Anything else RAISES before the DROP (same atomicity: single-transaction file, table + rows remain, `0019` unrecorded). Header documents the full semantics plus the known conservative edge (a version published after 0017 with an intervening item rename/remap carries refreshed snapshots and blocks 0019 for hand verification — fail-closed by design).

**Tests (`rewardProgramMigrations.postgres.test.ts` only):** A (unchanged backfill — renamed from B), B (P1 regression: rebound draft → 0019 succeeds), C (removed draft binding → succeeds), D1 (renamed live item + re-saved draft → succeeds), D2 (reclassified live item + re-saved draft → succeeds), E./F. (published version with destroyed evidence → 0019 RAISES; table + rows remain; 0019 unrecorded; new structures untouched), G (product smoke — renamed from D), down-migration (structural shell + re-apply — renamed from F). The old fail-closed-on-draft test C was removed by necessity (its scenario is now the valid TEST C).

**Validation (final tree):** migration file 45/45; full PG suite 8 files/242 passed (Reward Program incl. cross-store commands under the Firestore emulator, Qualifying Item, Purchase, readiness, runner); functions unit 162 files/1847 passed; web unit 124 files/902 passed; typecheck, lint (0 errors; 1 pre-existing `react-refresh` warning), prettier, both builds, `git diff --check` clean. Exact-head CI awaited after push; P1 thread replied with root cause, revised semantics, and test evidence (thread left unresolved for independent re-review).

**Scope confirmation:** exactly the 0019 up migration + migration tests + this addendum + Entry 256 + the `IMPLEMENTATION_CHANGES.md` record. Retained: `listQualifyingNodesForCategory` callable/service; `purchase_records.qualifying_item_id` nullability; `purchase_records.knowledge_node_id`; PB-013D classification; permissions; API contracts; PB-013B P3-3 OPEN; TRD10 untouched. No dependency/config change. `0019.down` unchanged (structural shell only; pre-drop backup remains the recovery mechanism).

**Rollback:** revert the correction commit(s) on PR #273 (pre-correction gate restored). Do NOT merge; do NOT start PB-013B P3-3.

**Final disposition:** `PLATFORM-BASELINE-013E — CORRECTED / AWAITING NARROW INDEPENDENT RE-REVIEW`.
