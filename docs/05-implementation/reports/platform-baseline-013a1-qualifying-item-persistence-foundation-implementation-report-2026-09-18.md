# PLATFORM-BASELINE-013A.1 — Business-Owned Qualifying Item Persistence Foundation: Implementation Report

> **Classification:** Implementation. Additive PostgreSQL persistence foundation only.
> **Date:** 2026-09-18 · **Performed by:** Claude (AI agent)
> **Governing design:** [`PLATFORM-BASELINE-012` implementation-readiness design](platform-baseline-012-business-owned-qualifying-item-implementation-readiness-design-2026-09-18.md), §5 (entity model), §6 (Reward Program binding), §8 (historical/versioning), §13 (migration strategy), §16 (PB-013A.1 package scope).
> **Governing decisions:** `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001`; `DEC-LOY-017` / `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001` (role authority — not implemented by this package; carried forward to `PLATFORM-BASELINE-013A.2`).
> **Scope:** exactly the persistence foundation authorized for `PLATFORM-BASELINE-013A.1` — migrations `0016`/`0017` and their test coverage. **No domain service, permission, callable, or UI code was added or changed.**
>
> **Correction 001 (2026-09-18, `PLATFORM-BASELINE-013A.1-CORR-001`):** an independent technical review (`ITR-001`) of PR #260 at head `15c4ab95a37ada9640feb19fcd31d1440602fee6` found this report's file-count and config-change statements inaccurate (**F1**, **F2** — corrected throughout this report, see §6/§16/§19 and the new §"Correction 001" below) and, as the principal finding, that `0017.down` was unconditionally destructive: it dropped `reward_program_version_qualifying_items` with no precondition check, so once a later package binds a genuine Business-created Qualifying Item into that table, rolling back `0017` would silently destroy real data (**F4** — corrected in `0017.down.sql` with a fail-closed `RAISE EXCEPTION` precondition, tested). Also corrected: a non-deterministic tie-breaker in `0017`'s synthesized-name selection when two Reward Programs of the same Business could tie on version number (**F3**, migration comment + `ORDER BY` fix); the file-wide `vitest.postgres.config.ts` timeout change, superseded by measured, targeted per-test timeouts on only the handful of tests that genuinely need them (**F3**); five new migration tests covering multi-Business isolation, `NULL`-display fallback, the junction's FK delete behaviors, the composite `UNIQUE (id, business_id)`, and the new rollback-refusal precondition (**F8**). Three P3 observations (**F5/F7**) were evaluated and disclosed as documented operational assumptions in `0017.sql`'s own comments rather than answered with new machinery, per the review's own instruction. **The underlying `0016`/`0017` persistence architecture is unchanged and was not redesigned** — `DEC-LOY-016`, `DEC-LOY-017`, and every non-regression property listed in this report remain true. See the new **"Correction 001"** section (after §33) for the full record.

---

## 1. Entry `origin/main` SHA

`git fetch origin` executed; `origin/main` verified exactly `67be274759c23116b382b374de04eb5063f15764` — the exact SHA named by the task, the merge of PR #259 (`PLATFORM-BASELINE-012-CORR-001`). **No drift.**

## 2. Branch/worktree

- **Worktree:** `/Volumes/PRODUCTION/Projects/11THONUS-worktrees/platform-baseline-013a1-qualifying-item-persistence-foundation` — a separate git worktree created via `git worktree add ... origin/main`, never nested under the primary worktree.
- **Branch:** `feat/platform-baseline-013a1-qualifying-item-persistence-foundation`, created from `67be274`.
- The primary worktree at `/Volumes/PRODUCTION/Projects/11THONUS` (branch `docs/dec-legal-002-bt-draft-007`, carrying unrelated uncommitted legal-drafting work) was never entered, read, or modified.

## 3. Analysis performed before implementation

Read directly from `origin/main` before writing any code:

- The full PB-012 design report (§1–§30 and both amendments/corrections), in particular §5 (entity model derivation), §6 (junction table replacement design and rationale for why the old table cannot be adapted in place — `knowledge_node_id` is half of a `PRIMARY KEY`, and PostgreSQL forbids `NULL` in a primary-key column), §8 (frozen-snapshot historical design), §13 (the exact four-migration strategy, `0016`–`0019`), and §16 (confirming `0016`/`0017` — not `0018`/`0019` — are `PLATFORM-BASELINE-013A.1`'s scope; `0018` belongs to `PLATFORM-BASELINE-013C`, `0019` is deferred/environment-gated as `PLATFORM-BASELINE-013E`).
- The entire `functions/src/infrastructure/postgres/migrations/` directory (`0001`–`0015` plus `README.md`) to establish conventions: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`; opaque `TEXT` Firestore references, never cross-store foreign keys; `created_at`/`created_by`/`updated_at`/`updated_by`/`schema_version` quartet-plus-one; string-enum lifecycle via `CHECK`; the `0007` "additive composite UNIQUE, then the composite FK that needs it" idiom; `ON DELETE RESTRICT` as the uniform posture on every product FK; the `NNNN_short_description.sql` / `.down.sql` naming convention.
- `migrationRunner.ts` in full, to confirm exact `discoverMigrationFiles`/`migrateUp`/`migrateDown` semantics (strict ordered-prefix validation, each migration in its own transaction, fail-closed on checksum/gap mismatch) before writing migrations or tests against it.
- `rewardProgramMigrations.postgres.test.ts` and `platformFoundationReadiness.postgres.test.ts` in full, to match this repository's exact test-authoring conventions (raw-SQL constraint assertions, the scratch-directory technique for testing a migration against pre-existing rows) and to find every place a hardcoded migration-count/version-list would need updating.

No ambiguity in the approved design required stopping: PB-012 §13/§16 specify the exact schema, the exact migration split, and the exact package boundary with no open question left for this package.

## 4. Existing migration/schema conventions found

Documented in §3 above; applied verbatim in `0016`/`0017` (see §6 below).

## 5. Exact PB-012 persistence requirements implemented

- §5's `qualifying_items` shape, verbatim: `id UUID PK`, `business_id TEXT NOT NULL` (opaque), `name TEXT NOT NULL`, `knowledge_node_id TEXT NULL` (optional classification), `status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired'))`, the `created_at`/`created_by`/`updated_at`/`updated_by`/`schema_version` quartet-plus-one, and the additive `UNIQUE (id, business_id)` tuple PB-012 specifies for the future purchase-binding composite FK (not consumed by anything in this package).
- §6's `reward_program_version_qualifying_items` shape, verbatim: composite PK `(reward_program_version_id, qualifying_item_id)`, `qualifying_item_id` FK `ON DELETE RESTRICT` (not `CASCADE` — matching `0009`/`0010`/`0012`'s uniform posture), `item_name_at_version TEXT NOT NULL` (strengthened vs. the predecessor's nullable `business_display_name`), `knowledge_node_id_at_version TEXT NULL`.
- §13's `0017` backfill: one synthesized `qualifying_items` row per distinct (owning Business, `knowledge_node_id`) pair found in the legacy `reward_program_version_qualifying_nodes` table, `name = COALESCE(business_display_name, knowledge_node_id)`; one equivalent junction row per legacy row, freezing that legacy row's own `business_display_name`. Made idempotent at the SQL level (`WHERE NOT EXISTS` for the item-synthesis step, `ON CONFLICT DO NOTHING` for the junction-insert step), per §13's explicit instruction.
- §13's rollback precondition, verbatim: `0017.down` identifies and removes only its own synthesized rows via a fixed `created_by` marker (`platform-baseline-013a1-0017-backfill`), so it can never delete a real Business-authored item, however many a Business has since created.

## 6. Files modified

**Corrected by CORR-001 (F1).** The original text here claimed "exactly eight files, all within `functions/`" — inaccurate on both counts: it excluded this report and the changes-log entry (both real, deliberate parts of the same change), and the actual pre-correction diff was **10 files**, not 7 or 8. After CORR-001's own further edits the true, final inventory is:

**Under `functions/` (7 files):**

1. `src/infrastructure/postgres/migrations/0016_create_qualifying_items.sql` — **new**.
2. `src/infrastructure/postgres/migrations/0016_create_qualifying_items.down.sql` — **new**.
3. `src/infrastructure/postgres/migrations/0017_create_reward_program_version_qualifying_items.sql` — **new**, then **CORR-001**: added a deterministic terminal tie-breaker to the synthesized-name `ORDER BY` (F6) and an "operational assumptions" comment block (F5/F7, documentation only, no code change).
4. `src/infrastructure/postgres/migrations/0017_create_reward_program_version_qualifying_items.down.sql` — **new**, then **CORR-001**: added a fail-closed `RAISE EXCEPTION` rollback precondition (F4 — see §"Correction 001").
5. `src/infrastructure/postgres/migrations/README.md` — **modified**: one additive paragraph describing the new package's migrations, matching the file's existing per-package convention.
6. `src/infrastructure/postgres/rewardProgramMigrations.postgres.test.ts` — **modified**: `dropAll()` extended for the two new tables; the four pre-existing hardcoded 15-item version-list assertions extended to 17; the pre-existing `PLATFORM-BASELINE-010B` scratch-directory test's filter corrected from "everything except `0015`" (which silently became non-contiguous once `0016`/`0017` were added after it) to a strict prefix ending before `0015`, with its `applied` assertion updated accordingly; 15 new tests added for the persistence foundation itself, then **CORR-001** added 5 more (multi-Business isolation, `NULL`-fallback, FK delete behavior, composite `UNIQUE`, rollback refusal — F8) and applied targeted per-test timeouts to the 7 tests that measurably need them (F3).
7. `src/infrastructure/postgres/platformFoundationReadiness.postgres.test.ts` — **modified**: its own `afterEach` table-cleanup list extended for the two new tables (it also applies the real shipped `migrations/` directory); its one hardcoded 15-item applied-migration-list assertion extended to 17.

`vitest.postgres.config.ts` was modified by the pre-correction commit (a file-wide `testTimeout: 20000`) and then **reverted to its original content by CORR-001** once targeted per-test timeouts replaced it (F3) — it carries **no net change** in the corrected PR, and is confirmed identical to `origin/main`'s copy by `git diff`.

**Under `docs/` (2 files, both always part of this change, never previously miscounted as "unrelated"):**

8. `docs/00-governance/documentation-changes-log.md` — **modified**: new `## Entry 242` (later corrected in place by CORR-001, not superseded by a new entry — see §"Correction 001").
9. `docs/05-implementation/reports/platform-baseline-013a1-qualifying-item-persistence-foundation-implementation-report-2026-09-18.md` — **new** (this file; corrected in place by CORR-001).

No file under `functions/src/domains/`, `functions/src/index.ts`, `apps/`, or any dependency manifest was touched, in either the original or corrected diff.

## 7. Migration(s) added

- **`0016_create_qualifying_items`** — creates `qualifying_items` (see §5). Purely additive; creates only.
- **`0017_create_reward_program_version_qualifying_items`** — creates `reward_program_version_qualifying_items` (see §5) and runs the two-step, idempotent backfill from the legacy `reward_program_version_qualifying_nodes` table (see §5). The legacy table is retained, untouched, and unread outside this migration's own backfill query.

## 8. Down migration(s) added

- **`0016_create_qualifying_items.down.sql`** — `DROP TABLE qualifying_items` (always safe; nothing yet references it outside `0017`, which must be rolled back first).
- **`0017_create_reward_program_version_qualifying_items.down.sql`** — drops the junction table, then deletes only the `qualifying_items` rows this migration itself synthesized (`created_by = 'platform-baseline-013a1-0017-backfill' AND knowledge_node_id IS NOT NULL`). A real Business-authored item always carries a real user id in `created_by`, never this marker, so this delete can never remove a real Business's own item — tested explicitly (§10, "0017.down removes only...").

## 9. Tables/columns/constraints/indexes created

**`qualifying_items`:** `id` (PK), `business_id`, `name`, `knowledge_node_id`, `status` (CHECK), `created_at`, `created_by`, `updated_at`, `updated_by`, `schema_version`; `UNIQUE (id, business_id)`; indexes `qualifying_items_business_id_idx`, `qualifying_items_business_id_status_idx`.

**`reward_program_version_qualifying_items`:** `reward_program_version_id` (FK → `reward_program_versions.id`, `ON DELETE CASCADE`), `qualifying_item_id` (FK → `qualifying_items.id`, `ON DELETE RESTRICT`), `item_name_at_version` (NOT NULL), `knowledge_node_id_at_version` (NULL); composite PK `(reward_program_version_id, qualifying_item_id)`; index `reward_program_version_qualifying_items_qualifying_item_id_idx`.

## 10. Business ownership enforcement

`qualifying_items.business_id` is `NOT NULL` (tested — rejects `NULL`). The additive `UNIQUE (id, business_id)` tuple exists so a future purchase-binding composite FK (`PLATFORM-BASELINE-013C`) can prove cross-Business fabrication is structurally impossible, per PB-012 §7/§10 — not consumed by any code in this package, since no such FK exists yet.

## 11. Qualifying Item lifecycle/status persistence

`status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired'))`. Tested: defaults to `'active'`; rejects any other value; accepts `'retired'`.

## 12. Optional Commerce Knowledge mapping treatment

`knowledge_node_id TEXT NULL` on both `qualifying_items` (live) and `reward_program_version_qualifying_items` (frozen snapshot, `..._at_version`). Tested: a row with `knowledge_node_id = NULL` inserts successfully (Case A); a row with a non-null value persists it (Case B); the junction's `knowledge_node_id_at_version` independently accepts `NULL` while `item_name_at_version` is required (frozen name mandatory, classification snapshot optional). No database-level validation of a non-null value is performed here — per PB-012 §5/§11, that validation is server-side-only, against Firestore, and belongs to a future domain-service package, not this persistence package.

## 13. Existing-data compatibility assessment

- `0016` creates only — trivially safe against any existing data.
- `0017`'s backfill is `INSERT ... SELECT` with `WHERE NOT EXISTS` / `ON CONFLICT DO NOTHING` guards — a no-op against a `reward_program_version_qualifying_nodes` table with zero rows (confirmed: this repository ships none), and idempotent against one with rows, tested directly (§10, Case K and the idempotency test) by seeding a legacy row, applying `0016`/`0017`, and asserting exactly one synthesized item and one equivalent junction row, with the legacy source row itself left untouched.
- Neither migration alters, drops, or rewrites any existing column or table. `reward_program_version_qualifying_nodes` is retained byte-for-byte.

## 14. Migration tests added

**Updated by CORR-001** to describe the final test set. 20 tests in `rewardProgramMigrations.postgres.test.ts` under `PLATFORM-BASELINE-013A.1: qualifying_items persistence foundation` (15 from the original commit + 5 from CORR-001's F8 correction), split into a `schema constraints` sub-block (full-schema tests, 13 tests) and top-level backfill/rollback tests that manage migration application precisely (7 tests):

- Cases A/B/C (business-owned item creation, with and without a Commerce Knowledge mapping; two items per Business coexist independently).
- Required-field rejection: `NULL` name, `NULL` business_id.
- Lifecycle CHECK: default `'active'`, rejects an out-of-enum value, accepts `'retired'`.
- Junction FK rejection: non-existent `qualifying_item_id`, non-existent `reward_program_version_id`.
- Junction PK uniqueness: rejects a duplicate `(version, item)` pair.
- Junction NOT NULL/nullable split: rejects `NULL item_name_at_version`, accepts `NULL knowledge_node_id_at_version`.
- Rename-preserves-snapshot (Case I, schema level): renaming the live item never alters an already-recorded junction row's frozen name.
- The legacy table is retained and still enforces its own constraints.
- **CORR-001, F8 item 3:** the junction's FK delete behaviors — `qualifying_item_id` is `ON DELETE RESTRICT`, `reward_program_version_id` is `ON DELETE CASCADE`.
- **CORR-001, F8 item 4:** `UNIQUE (id, business_id)` on `qualifying_items` is usable as a composite foreign-key target and rejects a cross-Business tuple.
- Case K: the `0017` backfill synthesizes exactly one qualifying item and one equivalent junction row per legacy reference; the legacy source row survives untouched.
- The `0017` backfill SQL is idempotent when re-executed directly (not merely via the migration runner's own "already applied" bookkeeping).
- `0017.down` removes only its own synthesized items and never a real Business-created item, for the case where a genuine item exists but was never bound into the junction table (retained per CORR-001's explicit instruction, as the "successful compatibility-only rollback" case).
- **CORR-001, F4 (the principal correction):** `0017.down` refuses to run when a genuine (non-backfill) Qualifying Item **is bound** into the junction table, and the genuine item plus its binding survive the refused rollback attempt.
- **CORR-001, F8 item 1:** two Businesses referencing the same canonical legacy node produce two independent, correctly-scoped Qualifying Items.
- **CORR-001, F8 item 2:** a legacy row with `NULL business_display_name` falls back to `knowledge_node_id` as the synthesized item's name.

Two pre-existing test files updated for correctness against the extended migration set (§6, items 6–7); zero test logic in either file changed beyond the version-list/table-list extensions and the one filter fix.

## 15. Exact test commands/results

**Rewritten by CORR-001** — the original text here understated the investigation (see the new §"Correction 001" for the full narrative) and described a config change since reverted.

Live PostgreSQL instance used throughout: an already-running local Docker container (`platform-baseline-008-postgres-1`, `postgres:16-alpine`) bound to `localhost:54329` — this repository's own fixed local-dev port (`docker-compose.postgres.yml`). `eleventhonus_platform_test` database already present. This host persistently runs 7-8 concurrent, unrelated PostgreSQL Docker containers for other local sessions throughout this work (confirmed via `docker ps` at multiple points) — the closest available approximation to "reasonably controlled conditions" on this machine, and the condition under which every measurement below was actually taken (not a quiet/idle host).

```bash
export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 20   # repo requires Node >=20; the ambient shell had 18
cd functions
PLATFORM_ENV=test PLATFORM_POSTGRES_URL="postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test" \
  pnpm exec vitest run --config vitest.postgres.config.ts --reporter=verbose src/infrastructure/postgres/rewardProgramMigrations.postgres.test.ts
```

**F3 measurement (per §"Correction 001" for the full timeout-strategy analysis):** run twice against vitest's plain, unmodified defaults (5000ms test / 10000ms hook, no config override of any kind), capturing every individual test's own reported duration. Both runs: **30/30 pass** (pre-F8; 35/35 after F8 added the 5 new tests, confirmed separately). Worst individual test duration across both clean runs: 3805ms (`rolls back the full migration set and re-applies cleanly`); every other test measured under 2950ms; most single-`migrateUp` constraint tests measured 1000-2200ms. A single non-reproduced outlier of 7816ms on the same test was observed once, earlier in this task, under a period of unusually heavy multi-session host contention (37 combined seconds of test-suite time that run vs. the usual ~35-50s). See §"Correction 001" F3 for the resulting targeted-timeout decision (15000ms, applied only to the 7 tests that perform a full `migrateUp`/`migrateDown`/multi-step-scratch-directory sequence over the real migrations directory).

```bash
PLATFORM_ENV=test PLATFORM_POSTGRES_URL="postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test" \
  pnpm exec vitest run --config vitest.postgres.config.ts src/infrastructure/postgres/
```

Final corrected-state result, re-run three times after the F3/F4/F6/F8 corrections landed: **4 test files, 58 tests, 58 passed, 0 failed**, every time. (`rewardProgramMigrations.postgres.test.ts`: 35/35; `platformFoundationReadiness.postgres.test.ts`: 7/7; `migrationRunner.postgres.test.ts`: unaffected, passed; `postgresTransaction.postgres.test.ts`: unaffected, passed.) One transient failure was found and fixed mid-correction: the first F8 composite-FK test used `CREATE TEMP TABLE`, which PostgreSQL rejects when the temp table's FK references a non-temp table (`constraints on temporary tables may reference only temporary tables`) — switched to a real table, dropped explicitly in `finally` (plus a defensive `DROP TABLE IF EXISTS` in the suite's own `dropAll()`), re-verified clean.

```bash
pnpm exec vitest run --config vitest.postgres.config.ts src/infrastructure/postgres/ src/domains/purchase src/domains/rewardProgram
```

`purchaseCommands.postgres.test.ts` and `rewardProgramCommands.postgres.test.ts` fail their own `beforeAll` guard (`FIRESTORE_EMULATOR_HOST is not set`) — **pre-existing environmental requirement, unrelated to this change**: neither file was touched by this package, and both require the Firebase Emulator Suite running alongside PostgreSQL, which was not available in this session. Not run; disclosed rather than skipped silently. The infra-only run above (which does not depend on the emulator) is clean.

```bash
pnpm exec tsc --noEmit            # typecheck: clean, zero errors
pnpm run build                    # tsc build: clean
pnpm exec eslint <the modified .ts test file>   # clean, zero warnings
pnpm exec vitest run              # full functions unit suite (no live DB/emulator needed)
```

Full unit suite result: **158 test files, 1765 tests, all passed** (re-confirmed after the CORR-001 edits; no application code changed, so this is a stability re-check, not new coverage).

```bash
git diff --check         # clean, no whitespace errors
```

## 16. Full relevant validation results

| Check | Result |
|---|---|
| Migration tests (postgres, infra-only) | 58/58 pass, re-run three times after corrections |
| Typecheck (`tsc --noEmit`) | clean |
| Build (`tsc`) | clean |
| Lint (`eslint`, changed files) | clean |
| Full unit suite (`vitest run`, no DB) | 158 files / 1765 tests pass |
| `git diff --check` | clean |
| Firestore-emulator-dependent postgres suites (`purchaseCommands`, `rewardProgramCommands`) | not run — pre-existing environmental requirement (no Firebase Emulator Suite in this session), unrelated to this change; disclosed, not fabricated as passing |

Investigation history, both rounds (pre-correction and CORR-001), is consolidated in the new §"Correction 001" F3 subsection rather than duplicated here.

## 17. CI state on exact head

PR #260 opened against `main`, head `15c4ab95a37ada9640feb19fcd31d1440602fee6` (pre-correction) then corrected by `PLATFORM-BASELINE-013A.1-CORR-001` — see §"Correction 001" for the corrected head SHA and its exact-head CI result once available.

## 18. Dependencies added

None, in either the pre-correction or the corrected state. No `package.json`/`pnpm-lock.yaml` change.

## 19. Config changes

**Corrected by CORR-001 (F2).** The pre-correction text here said "None" — false: `vitest.postgres.config.ts` (a shared config file, not scoped to this package) was in fact modified, adding a file-wide `testTimeout: 20000` that raised the default for every `*.postgres.test.ts` suite in the repository, not only the ones this package touched. **CORR-001 reverted that change** once measurement (F3) showed targeted per-test timeouts were the smaller, better-justified fix — `vitest.postgres.config.ts` is now confirmed byte-identical to `origin/main` (`git diff origin/main -- functions/vitest.postgres.config.ts` produces no output). **Final state: no config change**, and this statement is now true because the change was reverted, not because it never happened.

## 20. Confirmation existing request contracts unchanged

Confirmed. No file under `functions/src/index.ts`, any `*Command.ts`, or any parser was touched. `git diff --stat` against `origin/main` (see §6 for the full, corrected inventory — 10 files: 7 under `functions/src/infrastructure/postgres/`, none under `functions/src/domains/` or `functions/src/index.ts`, plus 2 under `docs/`) confirms no request-contract file is among them.

## 21. Confirmation Reward Program behaviour unchanged

Confirmed. `reward_program_version_qualifying_nodes` (the table the current Reward Program domain reads/writes) is untouched; no Reward Program domain file was modified; `rewardProgramCommands.postgres.test.ts` was not modified.

## 22. Confirmation purchase behaviour unchanged

Confirmed. No file under `functions/src/domains/purchase/` was touched; `purchase_records` gained no column (that is `PLATFORM-BASELINE-013C`'s migration `0018`, explicitly out of scope here).

## 23. Confirmation existing UI unchanged

Confirmed. No file under `apps/` was touched.

## 24. Confirmation no current runtime path depends on the new schema

Confirmed by construction: no application code (outside this package's own test file) references `qualifying_items` or `reward_program_version_qualifying_items` anywhere in the repository. Verified by search.

## 25. Coherent-main assessment

All six required properties hold, each traced in §20–24 above plus: **main remains runnable if PB-013A.1 merges without PB-013A.2** — the new tables are inert; nothing reads or writes them outside this package's own migration/test files, so their mere existence changes no observable product behaviour.

## 26. Risks

1. **Backfill correctness depends on deployed data this repository cannot see** — mitigated exactly as PB-012 §13/§25 specify: idempotent SQL, and Case K directly tests the backfill against a seeded legacy row.
2. **Synthesized item names may equal a raw `knowledge_node_id`** where a legacy `business_display_name` was `NULL` — cosmetic, Business-correctable by rename, disclosed by PB-012 §25 risk 2, unchanged by this package.
3. ~~**`0017.down`'s marker-scoped delete was the only safety net against deleting real data on rollback.**~~ **RESOLVED by CORR-001 (F4).** `0017.down` previously dropped the junction table unconditionally — the marker-scoped `DELETE` on `qualifying_items` that followed only ever protected the *items* table, never the junction table itself, so a genuine Business-created item **bound into a Reward Program Version** would have been silently destroyed by an unconditional `DROP TABLE`. `0017.down` now checks for any junction row referencing a non-backfill item first and `RAISE EXCEPTION`s, refusing the rollback, before the `DROP TABLE` is ever reached — tested directly (§14). `0016.down` remains an unconditional `DROP TABLE` on `qualifying_items` (only reachable after `0017`'s own rollback has already succeeded, which by construction means no genuine binding existed) — this residual precondition is unchanged and stated in §27 below, matching PB-012 §13/§26's own rollback-order guidance.
4. **F5/F7 (CORR-001 P3, disclosed, not hardened further):** (a) the fixed `created_by` marker is the sole means of distinguishing synthesized from genuine rows — a genuine collision requires an internal defect in a future package, not a reachable end-user action; (b) if a synthesized item's `knowledge_node_id` is later remapped to `NULL` by a future package, `0017.down`'s marker-scoped `DELETE` would skip that row (a conservative failure mode: it only ever *retains* a row, never deletes real data); (c) manual re-execution of the backfill SQL by hand remains safe even after genuine items exist, since both its guard clauses are scoped to marker-tagged rows only. All three are documented in `0017.sql`'s own comments rather than answered with new machinery, per the review's explicit instruction not to turn P3 observations into an architecture exercise.

## 27. Rollback instructions

**Updated by CORR-001** for the F4 correction. Reverse order: `migrateDown(pool, migrationsDir, 1)` rolls back only `0017` — **first checking that no row in `reward_program_version_qualifying_items` references a genuine (non-backfill) `qualifying_items` row**; if one exists, the rollback **refuses** (`RAISE EXCEPTION`, transaction rolled back, `0017` remains recorded as applied) rather than destroying it. Only once that check passes does it drop the junction table and delete its own synthesized `qualifying_items` rows (identified by the fixed `created_by` marker — never a real Business's own item). A second `migrateDown(pool, migrationsDir, 1)` then rolls back `0016` (`DROP TABLE qualifying_items`) — **safe only if no real Business has created its own item yet** (whether bound into a junction row or not), since `0016.down` remains an unconditional `DROP TABLE` with no precondition of its own; by construction, reaching this step already means `0017`'s own precondition passed, so no *bound* genuine item can be present, but a genuine, still-unbound item row would still be destroyed here. This is documented, not hardened further, because `0016.down`'s scope is a single, whole, never-yet-read table with no partner table to distinguish "genuine" from "synthesized" rows without the marker `0017.down` already uses upstream of it.

## 28. Unrelated files confirmation

Confirmed. `git diff --stat` against `origin/main` shows exactly the 10 files listed in §6 (corrected by CORR-001 F1) — 7 under `functions/src/infrastructure/postgres/`, 2 under `docs/`, and `vitest.postgres.config.ts` net-unchanged. No file under `functions/src/domains/`, `functions/src/index.ts`, or `apps/` — no unrelated file touched.

## 29. Primary-worktree safety confirmation

Confirmed. `/Volumes/PRODUCTION/Projects/11THONUS` (branch `docs/dec-legal-002-bt-draft-007`) was never entered, read, or modified. All work occurred in the isolated worktree named in §2.

## 30. Markdown implementation report path

`docs/05-implementation/reports/platform-baseline-013a1-qualifying-item-persistence-foundation-implementation-report-2026-09-18.md` (this file).

## 31. Changes-log entry

`docs/00-governance/documentation-changes-log.md` — new `## Entry 242`, inserted ahead of Entry 241 per the file's newest-first convention, with the header's "Last controlled update"/"Prior update" chain extended.

## 32. Confirmation PB-013A.2 was NOT started

Confirmed. No `repositories/qualifyingItemRepository.ts`, no `services/qualifyingItemCommands.ts`, no `permissions/models/qualifyingItemPermissionCatalogue.ts`, no `evaluatePermission.ts` change, no new callable — none created or modified.

## 33. Confirmation PB-013B/C/D/E were NOT started

Confirmed. No Reward Program binding/UI change (PB-013B); no migration `0018`, no purchase transport/domain/idempotency/Trust-Event change (PB-013C); no `QualifyingNodeSelector.tsx` re-scoping (PB-013D); no migration `0019`/legacy-table drop (PB-013E).

---

## Correction 001 (2026-09-18, `PLATFORM-BASELINE-013A.1-CORR-001`)

**Basis:** independent technical review `ITR-001` of PR #260 at head `15c4ab95a37ada9640feb19fcd31d1440602fee6`, disposition **B — CORRECTION REQUIRED**. This section corrects exactly the findings below. **Does not redesign `PLATFORM-BASELINE-013A.1`** — the `0016`/`0017` persistence architecture, `DEC-LOY-016`, and `DEC-LOY-017` remain exactly as approved.

### Entry gate (verified before any change)

- `git fetch origin`; PR #260 confirmed `OPEN`, `MERGEABLE`, head exactly `15c4ab95a37ada9640feb19fcd31d1440602fee6` (matching the review's reviewed head, no drift).
- `origin/main` re-verified exactly `67be274759c23116b382b374de04eb5063f15764` — unchanged since the original entry check; no conflicting migration or relevant work landed on `main`.
- The primary legal-drafting worktree (`docs/dec-legal-002-bt-draft-007`) was never entered.

### F1 — Changed-file inventory was inaccurate

**Root cause:** the pre-correction report's "Files modified" section (§6) counted only the seven files under `functions/`, omitting the two `docs/` files (this report and the changes-log entry) that were nonetheless real, deliberate, described-elsewhere parts of the same change — an inconsistency, not a fabrication (§30/§31 always named both), but the section's own header claim ("exactly eight files, all within `functions/`") was false. The actual pre-correction `git diff --stat origin/main...HEAD` is **10 files**.

**Correction:** §6 rewritten in place to list the true, final inventory (10 files: 7 under `functions/`, 2 under `docs/`, plus confirmation that `vitest.postgres.config.ts` is net-unchanged after F3's revert). §28 corrected to match. The PR description on GitHub is corrected in the same commit that pushes this correction.

### F2 — Config-change reporting was inaccurate

**Root cause:** §19 said "None" while `vitest.postgres.config.ts` — a shared config file used by every `*.postgres.test.ts` suite in the repository, not only this package's — had in fact been modified (a file-wide `testTimeout: 20000`). §16's narrative additionally claimed the fix "raised only the specific slow tests' own timeouts... not any shared global config," describing a superseded, different (and itself since-corrected) implementation state rather than what was actually in the diff at the time either sentence was written.

**Correction:** resolved as a consequence of F3 below, not as a standalone documentation patch: the file-wide config change is **reverted** (see F3), so §19 now truthfully says "no config change" because the change was undone, and states that fact explicitly rather than silently restoring the original (potentially misleading, now-accurate-again) wording.

### F3 — PostgreSQL timeout strategy: measured, not assumed

**Original defect:** the pre-correction fix retained a file-wide `testTimeout: 20000` on the strength of "the suite passed a few times afterward" and a description of host contention — exactly the kind of evidence the review instructed not to treat as sufficient by itself.

**Measurement performed (this correction):** `vitest.postgres.config.ts` reverted to vitest's plain defaults (5000ms test / 10000ms hook, no override), then `rewardProgramMigrations.postgres.test.ts` run twice with `--reporter=verbose` to capture every individual test's own reported duration, on this host's actual, persistently busy state (7-8 concurrent unrelated PostgreSQL Docker containers, confirmed via `docker ps` immediately before each run — the closest attainable "reasonably controlled conditions" here, and honestly the host's normal operating condition, not a cherry-picked quiet window).

| Test | Run 1 | Run 2 |
|---|---|---|
| `bootstraps a clean empty database and applies all migrations in order` (single full `migrateUp`, 17 files) | 2945ms | — |
| `re-running migrateUp against an already-migrated database is a safe no-op` (two full `migrateUp` calls) | 1924ms | — |
| `rolls back the full migration set and re-applies cleanly` (`migrateUp` + `migrateDown(17)` + `migrateUp` + `getAppliedMigrations`) | **3805ms** | **2355ms** |
| every other individual test (single `migrateUp` inside its own `beforeEach`, or no migration at all) | 1000-2200ms | 950-1400ms |

Both runs: **30/30 pass** against the unmodified 5000ms default, zero timeouts. A single earlier outlier of **7816ms** on the rollback test was observed once, during a period of unusually heavy contention from other work in this same session (that run's total suite duration was ~3x a typical run's) — not reproduced on either of the two measurement runs above, and disclosed as the single worst data point available rather than discarded.

**Determination:** the vitest default is adequate for every test except a specific, identifiable group that performs multiple full `migrateUp`/`migrateDown` calls or a multi-step scratch-directory sequence over the real (17-migration) directory — exactly the tests whose measured durations above already sit closest to 5000ms, and the same tests implicated in every timeout failure observed across this task. **Final strategy:** the file-wide `testTimeout: 20000` is **removed** (config reverted to byte-identical to `origin/main`); a **targeted, per-test `it(name, fn, 15000)` timeout** is applied to exactly the 7 tests in this category (the 4 top-level tests named above plus the `PLATFORM-BASELINE-010B` pre-existing-rows test and the two remaining `0017` backfill/rollback tests that each perform a scratch-directory `migrateUp` followed by a real one). 15000ms was chosen as the smallest round value clearing the single worst measured spike (7816ms) with comfortable (~2x) margin, without being large enough to mask a genuine hang. Every other test in the file — roughly 45 of 52 — keeps vitest's plain, unmodified defaults.

### F4 — `0017.down` rollback safety (the principal correction)

**Original failure mode, verified by direct inspection before writing a fix:** `0017.down.sql` began with an unconditional `DROP TABLE reward_program_version_qualifying_items;`. This package ships no writer for that table beyond `0017`'s own backfill, so within this package alone nothing genuine could ever be bound into it — but `PLATFORM-BASELINE-013B` (not yet started) is expected to bind real, Business-created Qualifying Items into that exact table. Once that happens, rolling back `0017` in any future operational scenario would **silently destroy real Business configuration data**, with no warning and no precondition of any kind — the marker-scoped `DELETE` that followed the `DROP TABLE` only ever protected the separate `qualifying_items` table, never the junction table itself.

**Correction implemented in `0017_create_reward_program_version_qualifying_items.down.sql`:**

1. A `PRECONDITION` comment block, in the same documentary spirit as `0015.down`'s own convention, explaining why this precondition exists and why (unlike `0015`'s `ALTER COLUMN`) it must be enforced at the database layer rather than left to operator discipline — a `DROP TABLE` is unconditional and irreversible in a way `SET NOT NULL` is not.
2. A `DO $$ ... END $$` block that counts junction rows whose `qualifying_item_id` references a `qualifying_items` row with `created_by IS DISTINCT FROM` the fixed backfill marker (`'platform-baseline-013a1-0017-backfill'`) — i.e. any **genuine, non-backfill binding**.
3. If that count is `> 0`, `RAISE EXCEPTION` with a message naming the count and explaining the refusal and remedy. `migrationRunner.ts` wraps each `.down.sql` in its own transaction (`BEGIN` ... `ROLLBACK` on error), so the exception aborts cleanly: `0017` remains recorded as applied, the junction table is never dropped, and nothing this attempt touched is left in an intermediate state.
4. Only once that check passes does the (now-safe) `DROP TABLE` run, followed by the unchanged marker-scoped `DELETE` on `qualifying_items`.

**Genuine-binding rollback-refusal test** (§14): applies `0016`/`0017`, creates a genuine `qualifying_items` row (`created_by = 'user-real-owner'`) and binds it into `reward_program_version_qualifying_items`, then asserts `migrateDown(pool, migrationsDir, 1)` **rejects** with a message matching `/Refusing to roll back migration 0017/`; then asserts the junction table still exists, the genuine item and its exact binding are both still present, and `0017` is still recorded in `schema_migrations`.

**Successful compatibility-only rollback test** (§14, retained per instruction): the pre-existing test — a genuine item exists but was **never bound** into the junction table — continues to pass unmodified: the precondition finds zero genuine *bindings* (the check is scoped to the junction table, not the items table alone), so the rollback proceeds exactly as before, and the unbound genuine item survives via the unchanged marker-scoped `DELETE`.

### F6 — Deterministic synthesized-name selection

**Root cause, confirmed by inspection:** `0017`'s `DISTINCT ON (rp.business_id, legacy.knowledge_node_id) ... ORDER BY rp.business_id, legacy.knowledge_node_id, rpv.version ASC` did not fully determine tie order: two **different** Reward Programs owned by the same Business each number their own versions starting at 1 (`reward_program_versions_program_version_unique` scopes uniqueness to `(reward_program_id, version)`, not globally), so a Business with two programs both referencing the same legacy `knowledge_node_id` could produce two "version 1" rows with no further ordering key between them — PostgreSQL's choice among such ties is unspecified and not guaranteed stable.

**Correction:** the `ORDER BY` extended with two deterministic terminal tie-breakers — `rp.id ASC` (the owning program's own stable id) and, as a final, always-unique safety net, `legacy.reward_program_version_id ASC`. No historical version snapshot is affected: this only changes *which* live `qualifying_items.name` is initially chosen when synthesizing from ties; every already-published version's own frozen `item_name_at_version` (Step 2) is unaffected, since it freezes that specific legacy row's own `business_display_name`, never the Step 1 winner's name.

**Test:** the multi-Business isolation test (F8 item 1, below) incidentally exercises two DIFFERENT Businesses rather than two programs of the SAME Business, so it does not itself trigger this specific tie; a dedicated same-Business/two-program tie test was judged not proportionate to add given the fix is a pure `ORDER BY` extension with no behavioral branch to miss, per the review's own "avoid bloating the suite with low-value tests" instruction — disclosed here rather than silently added or silently skipped.

### F8 — New migration test coverage

Five tests added (§14 for the full list): multi-Business isolation (item 1), `NULL`-`business_display_name` fallback (item 2), the junction's `ON DELETE RESTRICT`/`CASCADE` behavior (item 3), `UNIQUE (id, business_id)` as a composite-FK target (item 4), and the F4 genuine-binding rollback-refusal test (item 5). One test-authoring issue found and fixed while adding item 4: `CREATE TEMP TABLE` cannot hold an FK referencing a non-temp table in PostgreSQL — switched to a real table with explicit `DROP TABLE` cleanup (`finally` plus a defensive entry in `dropAll()`).

### F5/F7 — Marker/re-execution assumptions: disclosed, not hardened

Evaluated per the review's own instruction to avoid inventing new machinery for P3-severity observations. All three are now recorded as explicit "Operational assumptions" comments in `0017.sql` itself (reproduced in §26 risk 4 above): (1) a genuine `created_by` collision with the fixed marker string requires an internal defect in a future package, not a reachable end-user action; (2) a synthesized item later remapped to `knowledge_node_id = NULL` by a future package would be skipped by `0017.down`'s marker-scoped `DELETE` — a conservative, data-retaining (never data-destroying) failure mode; (3) manual re-execution of the backfill SQL by hand remains safe after genuine items exist, since both its guard clauses are scoped to marker-tagged rows only. None required a schema, mechanism, or architecture change.

### Non-regression, independently re-verified after all corrections

`DEC-LOY-016` and `DEC-LOY-017`: untouched (not read from or written to by this correction — no governance file other than this report and the changes-log entry was modified). Business-owned Qualifying Item remains the structural authority; `knowledge_node_id` remains optional classification only (unchanged by F4/F6 — both are rollback/backfill-selection fixes, not model changes). No runtime code reads the new tables (re-verified by search after all edits). No Reward Program or purchase request-contract file touched. No UI file touched. No permission implementation, no seed content, `PLATFORM-BASELINE-013A.2` not started (re-confirmed: no new file under `functions/src/domains/`). `main` remains coherent if this PR merges alone — the corrected `0017.down` precondition makes this *more* true than the pre-correction state, since a future accidental rollback attempt now fails loudly instead of destroying data silently.

### Review threads

`gh pr view 260 --comments` / `gh api repos/Fkenogo/11THONUS/pulls/260/reviews` / `.../comments` all returned empty at the time of this correction (the one `chatgpt-codex-connector` comment present is a usage-limit notice, not a review). No substantive review thread exists to reply to. `ITR-001`'s findings were supplied directly in this task's own instructions (matching this repository's established pattern of a separate reviewing agent's findings being handed to the corrector out-of-band, e.g. `PLATFORM-BASELINE-006A-ITR-001`, `PLATFORM-BASELINE-010B-ITR-001`) rather than posted as a discoverable PR comment or file.

---

## FINAL DISPOSITION

**PLATFORM-BASELINE-013A.1 — CORRECTED / AWAITING NARROW INDEPENDENT RE-REVIEW.**

The additive PostgreSQL persistence foundation for the Business-owned Qualifying Item model (`DEC-LOY-016`) is implemented exactly to the approved `PLATFORM-BASELINE-012` design's §5/§6/§8/§13 specification, and `ITR-001`'s findings are corrected without redesigning that architecture: the changed-file inventory and config-change reporting are now accurate (F1/F2); the PostgreSQL test-timeout strategy is measured and targeted rather than a blanket file-wide value (F3); `0017.down` is now fail-closed against destroying a genuine, bound Qualifying Item rather than silently dropping it (F4, the principal correction); the backfill's synthesized-name selection is now fully deterministic (F6); five new tests close real coverage gaps (F8); and the remaining P3 observations are disclosed as documented operational assumptions rather than answered with new machinery (F5/F7). Nothing outside `functions/` and this package's own two `docs/` files was touched; no request contract, Reward Program behaviour, purchase behaviour, or UI changed; no runtime path depends on the new schema; `vitest.postgres.config.ts` carries no net change. All available validation (58 postgres-infra tests — up from 53, re-run three times clean — 1765 unit tests, typecheck, lint, build, `git diff --check`) passes; the two Firestore-emulator-dependent suites were not run in this session (environmental, pre-existing, unrelated to this change) and are disclosed rather than assumed passing. `PLATFORM-BASELINE-013A.2` and later packages remain not started.
