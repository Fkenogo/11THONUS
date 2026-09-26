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

## 10. PLATFORM-BASELINE-013E-CORR-002 — bound the 0019 legacy-evidence gate and complete its operational safety contract (2026-09-25, same PR #273, unmerged)

**Entry gate (verified before any change):** PR #273 OPEN/unmerged; head exactly `d5070ccc3026d32b050b65443505cbc550f56b81` (the CORR-001 head — no drift); base `7c4e7cc62b7bb264b4dd9c3d47fe04b10693c6a1`; exact-head CI `36147689880` SUCCESS; the P1/CORR-001 review thread present and `isResolved: false`. Work in an isolated worktree on the PR branch; primary dirty checkout untouched.

**Independent review disposition being addressed:** `PB-013E-CORR-001-ITR-001` = **B — CORRECTION INCOMPLETE**, two bounded findings: (F1) CORR-001's legs (b)/(c) admit a manually injected legacy row on a draft version that was never actually backfilled for that version (leg (b) via a shared (Business, node) marker from another version/program; leg (c) node-unconstrained via any same-Business marker binding); (F2) the draft→published fail-closed behaviour is incompletely disclosed (rename/reclassify named, but rebind/removal and multi-version frozen-name conflicts omitted).

**Timestamp-predicate analysis (required before changing code).** Question: can `reward_program_versions.created_at < schema_migrations.applied_at('0017')` safely distinguish pre-0017 from post-0017 versions? **Answer: YES.** Evidence: `0002_create_reward_program_versions.sql` defines `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`; `migrationRunner.ts` defines `schema_migrations.applied_at TIMESTAMPTZ NOT NULL DEFAULT now()` and records it in the SAME transaction that runs 0017's up SQL. Both columns are `TIMESTAMPTZ` (UTC) — no timezone/type mismatch. No production or test INSERT sets `created_at` explicitly (both `insertRewardProgramWithFirstDraft` and `insertNextDraftVersion` omit it, relying on the DEFAULT; `UPDATE` never touches it). 0017's own up SQL creates **no** versions (it only synthesizes `qualifying_items` and junction rows), so every legitimately backfilled version was created in a transaction strictly earlier than 0017's application transaction, hence `created_at < applied_at`. Postgres `now()` is the transaction-start timestamp, so the ordering is exact per-transaction, not per-statement. Residual anomalies are fail-safe or out-of-band: (i) a clock BACKWARD-jump after 0017 could make a post-0017 version appear older — but a post-0017 version can still never carry a legitimate legacy row (zero runtime writers), so exploiting it still requires manual injection; (ii) a clock backward-jump before 0017 could misclassify a pre-0017 draft as post-0017 — that only *disables* legs (b)/(c), i.e. fails closed, never opens the gate. No fixture, import, backfill, timestamp override, or migration-mechanism path produces a false positive. Conclusion: the predicate is sound and is the bounded correction applied.

**Root cause addressed:** CORR-001's draft escape legs keyed on *provenance existence* rather than *version age*, so a post-0017 draft (which can never legitimately own a legacy row) could inherit another version's marker and slip past the gate. CORR-002 requires the version itself to predate 0017, closing both F1 sub-cases while preserving every legitimate pre-0017 draft-evolution path.

**Exact Gate 2 after correction (`0019_drop_legacy_qualifying_nodes.sql`):** a legacy row is represented when ANY of — (a) EXACT current-junction match (version + `knowledge_node_id_at_version` + `item_name_at_version = COALESCE(business_display_name, knowledge_node_id)`) — unchanged, the only leg for non-draft versions; (b) DRAFT PROVENANCE: `rpv.status = 'draft'` AND `rpv.created_at < applied_0017_at` AND a 0017 marker item exists for the same (Business, `knowledge_node_id`); (c) DRAFT STRUCTURAL DESCENT: `rpv.status = 'draft'` AND `rpv.created_at < applied_0017_at` AND the current junction binds a same-Business marker item. `applied_0017_at` is read once from `schema_migrations` (Gate 1 already guarantees its presence; the `IS NOT NULL` guards make the legs fail closed if it were ever absent). Gate 1, the RESTRICT DROP, the down migration, and migrations 0001–0018 are all byte-identical/unmodified.

**Provenance semantics (documented in the migration header):** the 0017 marker is Business/node-level, not per-version/per-row — Step 1 synthesizes one item per distinct (Business, `knowledge_node_id`) pair shared by all referencing legacy rows. The marker proves "0017 backfilled at least one legacy reference for this (Business, node)", never "this specific version's row was backfilled". No version-level provenance column exists and none was added.

**Tests (`rewardProgramMigrations.postgres.test.ts` only):**
- *Post-0017 false positives closed (new):* CORR-002 A (post-0017 draft + manual legacy row sharing the backfilled (Business, node) → 0019 RAISES; table + row remain, 0019 unrecorded, new structures untouched) and CORR-002 B (post-0017 draft + manual legacy row for a never-backfilled node + junction bound to a same-Business marker item → 0019 RAISES; the exact node-unconstrained leg-(c) shape).
- *Pre-0017 draft evolution preserved (existing, still green):* A (unchanged), B (rebound), C (removed binding), D1 (renamed item), D2 (reclassified item).
- *Draft→published fail-closed (new):* CORR-002 draft→published (pre-0017 draft rebound to a genuine item, then published → 0019 RAISES; table + row remain, 0019 unrecorded, status `active` intact). E./F. (published + removed evidence) retained as the removal/atomicity case.

**Operator preflight / recovery procedure (documented operational contract; no automated repair built):**
1. Confirm `schema_migrations` records `0017` as applied.
2. Run/read the 0019 preflight gate (a failing gate is itself the diagnostic; a read-only diagnostic query is documented in the report below).
3. If the gate passes: take/confirm the pre-0019 logical backup per existing operational practice, then apply `0019`.
4. If the gate fails: DO NOT bypass the gate; DO NOT manually delete legacy rows; DO NOT edit historical migrations.
5. Identify each failing legacy row and its Reward Program, version, version status, Business, legacy CK node, and the current qualifying-item/version snapshot.
6. Determine whether the mismatch is legitimate post-backfill evolution or genuinely unmigrated evidence.
7. Require explicit operator/Founder disposition before any target-specific remediation.

**Read-only diagnostic/preflight query (non-mutating):**
```sql
SELECT
  l.reward_program_version_id,
  rpv.reward_program_id,
  rpv.status                  AS version_status,
  rpv.version                 AS version_number,
  rp.business_id,
  rpv.created_at,
  (SELECT applied_at FROM schema_migrations WHERE version = '0017') AS applied_0017_at,
  rpv.created_at < (SELECT applied_at FROM schema_migrations WHERE version = '0017') AS version_predates_0017,
  l.knowledge_node_id         AS legacy_node,
  l.business_display_name     AS legacy_display_name,
  EXISTS (
    SELECT 1 FROM reward_program_version_qualifying_items m
    WHERE m.reward_program_version_id = l.reward_program_version_id
      AND m.knowledge_node_id_at_version = l.knowledge_node_id
      AND m.item_name_at_version = COALESCE(l.business_display_name, l.knowledge_node_id)
  ) AS has_exact_representation
FROM reward_program_version_qualifying_nodes l
JOIN reward_program_versions rpv ON rpv.id = l.reward_program_version_id
JOIN reward_programs rp ON rp.id = rpv.reward_program_id;
```
Rows with `has_exact_representation = FALSE` are the ones the gate will refuse; `version_status` and `version_predates_0017` tell the operator whether the mismatch is a legitimate post-backfill evolution (draft or published) or an out-of-band anomaly.

**Residual pre-0017 manual-injection limitation (documented, not hidden):** a PRE-0017 draft combined with a POST-0017 manual SQL insertion into the legacy table is still indistinguishable from genuinely migrated history, because the schema has no version-level provenance and CORR-002 adds none. This residual is **bounded**: (1) product runtime has zero writers to the legacy table; (2) it requires out-of-band/manual database mutation; (3) the target deployment is protected by the preflight check + pre-drop backup + the fail-closed non-draft gate. Analysis confirms the residual is not materially more dangerous than stated — it cannot lose any published/committed history (exact-match leg (a) still protects every non-draft version) and can only ever drop a manually injected, stale, draft-only row.

**Scope confirmation:** exactly the `0019_drop_legacy_qualifying_nodes.sql` up migration + `rewardProgramMigrations.postgres.test.ts` + this addendum + Entry 257 + the `IMPLEMENTATION_CHANGES.md` record. `0019.down` unchanged (structural shell only). Retained/untouched: `listQualifyingNodesForCategory`; `purchase_records.qualifying_item_id` nullability and `purchase_records.knowledge_node_id`; PB-013D classification; permissions; API contracts; purchase/10+1; PB-013B P3-3 (OPEN); TRD10; migrations 0001–0017. No dependency or config change.

**Rollback:** revert the CORR-002 commit on PR #273 (CORR-001 gate restored). Do NOT merge; do NOT start PB-013B P3-3.

**Final disposition:** `PLATFORM-BASELINE-013E — CORRECTED / AWAITING FINAL NARROW INDEPENDENT RE-REVIEW`.
