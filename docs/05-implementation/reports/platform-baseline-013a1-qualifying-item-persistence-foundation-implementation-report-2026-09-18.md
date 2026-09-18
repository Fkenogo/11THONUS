# PLATFORM-BASELINE-013A.1 — Business-Owned Qualifying Item Persistence Foundation: Implementation Report

> **Classification:** Implementation. Additive PostgreSQL persistence foundation only.
> **Date:** 2026-09-18 · **Performed by:** Claude (AI agent)
> **Governing design:** [`PLATFORM-BASELINE-012` implementation-readiness design](platform-baseline-012-business-owned-qualifying-item-implementation-readiness-design-2026-09-18.md), §5 (entity model), §6 (Reward Program binding), §8 (historical/versioning), §13 (migration strategy), §16 (PB-013A.1 package scope).
> **Governing decisions:** `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001`; `DEC-LOY-017` / `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001` (role authority — not implemented by this package; carried forward to `PLATFORM-BASELINE-013A.2`).
> **Scope:** exactly the persistence foundation authorized for `PLATFORM-BASELINE-013A.1` — migrations `0016`/`0017` and their test coverage. **No domain service, permission, callable, or UI code was added or changed.**

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

Exactly seven files, all within `functions/src/infrastructure/postgres/`:

1. `migrations/0016_create_qualifying_items.sql` — **new**.
2. `migrations/0016_create_qualifying_items.down.sql` — **new**.
3. `migrations/0017_create_reward_program_version_qualifying_items.sql` — **new**.
4. `migrations/0017_create_reward_program_version_qualifying_items.down.sql` — **new**.
5. `migrations/README.md` — **modified**: one additive paragraph describing the new package's migrations, matching the file's existing per-package convention.
6. `rewardProgramMigrations.postgres.test.ts` — **modified**: `dropAll()` extended for the two new tables; the four pre-existing hardcoded 15-item version-list assertions extended to 17; the pre-existing `PLATFORM-BASELINE-010B` scratch-directory test's filter corrected from "everything except `0015`" (which silently became non-contiguous once `0016`/`0017` were added after it) to a strict prefix ending before `0015`, with its `applied` assertion updated accordingly; one new top-level `describe` block (`PLATFORM-BASELINE-013A.1: qualifying_items persistence foundation`) added with 15 new tests.
7. `platformFoundationReadiness.postgres.test.ts` — **modified**: its own `afterEach` table-cleanup list extended for the two new tables (it also applies the real shipped `migrations/` directory); its one hardcoded 15-item applied-migration-list assertion extended to 17.

No file under `functions/src/domains/`, `functions/src/index.ts`, `apps/`, or any config/dependency manifest was touched. No implementation report or governance file other than this report and the changes-log entry below was created or modified.

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

15 new tests in `rewardProgramMigrations.postgres.test.ts` under `PLATFORM-BASELINE-013A.1: qualifying_items persistence foundation`, split into a `schema constraints` sub-block (full-schema tests, 11 tests) and top-level backfill/rollback tests that manage migration application precisely (4 tests):

- Cases A/B/C (business-owned item creation, with and without a Commerce Knowledge mapping; two items per Business coexist independently).
- Required-field rejection: `NULL` name, `NULL` business_id.
- Lifecycle CHECK: default `'active'`, rejects an out-of-enum value, accepts `'retired'`.
- Junction FK rejection: non-existent `qualifying_item_id`, non-existent `reward_program_version_id`.
- Junction PK uniqueness: rejects a duplicate `(version, item)` pair.
- Junction NOT NULL/nullable split: rejects `NULL item_name_at_version`, accepts `NULL knowledge_node_id_at_version`.
- Rename-preserves-snapshot (Case I, schema level): renaming the live item never alters an already-recorded junction row's frozen name.
- The legacy table is retained and still enforces its own constraints.
- Case K: the `0017` backfill synthesizes exactly one qualifying item and one equivalent junction row per legacy reference; the legacy source row survives untouched.
- The `0017` backfill SQL is idempotent when re-executed directly (not merely via the migration runner's own "already applied" bookkeeping).
- `0017.down` removes only its own synthesized items and never a real Business-created item (rolls back only `0017`, inserts a real item with a real `created_by`, confirms it survives, then confirms `0016.down` afterward drops the whole table as an unconditional, intentionally irreversible-past-that-point operation).

Two pre-existing test files updated for correctness against the extended migration set (§6, items 6–7); zero test logic in either file changed beyond the version-list/table-list extensions and the one filter fix.

## 15. Exact test commands/results

Live PostgreSQL instance used: an already-running local Docker container (`platform-baseline-008-postgres-1`, `postgres:16-alpine`) bound to `localhost:54329` — this repository's own fixed local-dev port (`docker-compose.postgres.yml`), found already up rather than started fresh. `eleventhonus_platform_test` database already present.

```bash
export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 20   # repo requires Node >=20; the ambient shell had 18
cd functions
PLATFORM_ENV=test PLATFORM_POSTGRES_URL="postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test" \
  pnpm exec vitest run --config vitest.postgres.config.ts src/infrastructure/postgres/
```

Result: **4 test files, 53 tests, 53 passed, 0 failed.** (`rewardProgramMigrations.postgres.test.ts`: 30/30; `platformFoundationReadiness.postgres.test.ts`: 7/7; `migrationRunner.postgres.test.ts`: unaffected, passed; `postgresTransaction.postgres.test.ts`: unaffected, passed.) Re-run twice for stability; identical result both times.

```bash
pnpm exec vitest run --config vitest.postgres.config.ts src/infrastructure/postgres/ src/domains/purchase src/domains/rewardProgram
```

`purchaseCommands.postgres.test.ts` and `rewardProgramCommands.postgres.test.ts` fail their own `beforeAll` guard (`FIRESTORE_EMULATOR_HOST is not set`) — **pre-existing environmental requirement, unrelated to this change**: neither file was touched by this package, and both require the Firebase Emulator Suite running alongside PostgreSQL, which was not available in this session. Not run; disclosed rather than skipped silently. The infra-only run above (which does not depend on the emulator) is clean.

```bash
pnpm exec tsc --noEmit            # typecheck: clean, zero errors
pnpm run build                    # tsc build: clean
pnpm exec eslint <the two modified .ts test files>   # clean, zero warnings
pnpm exec vitest run              # full functions unit suite (no live DB/emulator needed)
```

Full unit suite result: **158 test files, 1765 tests, all passed.**

```bash
git diff --cached --check         # clean, no whitespace errors
```

## 16. Full relevant validation results

| Check | Result |
|---|---|
| Migration tests (postgres, infra-only) | 53/53 pass, re-run twice |
| Typecheck (`tsc --noEmit`) | clean |
| Build (`tsc`) | clean |
| Lint (`eslint`, changed files) | clean |
| Full unit suite (`vitest run`, no DB) | 158 files / 1765 tests pass |
| `git diff --check` | clean |
| Firestore-emulator-dependent postgres suites (`purchaseCommands`, `rewardProgramCommands`) | not run — pre-existing environmental requirement (no Firebase Emulator Suite in this session), unrelated to this change; disclosed, not fabricated as passing |

Investigated failures before disclosure: the initial test run had 4 failures, all traced to two distinct pre-existing bugs surfaced (not caused) by this package's addition of `0016`/`0017` after `0015` — a scratch-directory filter in the pre-existing `PLATFORM-BASELINE-010B` test that used to mean "everything except `0015`" and silently became non-contiguous once later migrations existed, and a vitest default 5000ms test timeout on `migrateDown`'s full-17-migration rollback that this host (7 concurrent PostgreSQL Docker containers observed via `docker ps`, competing for disk/CPU) exceeded, cascading into unrelated failures on the next tests via a still-running background query. Both root-caused and fixed (see §6); the timeout fix raised only the specific slow tests' own timeouts (20000ms), not any shared global config. Re-ran after each fix and confirmed genuinely resolved (all 30, then all 53, passing on repeated runs) — not merely re-run until green without understanding why.

## 17. CI state on exact head

Not applicable yet — PR not opened at the time of writing this report; see §"PR" below for the head SHA the PR was opened against.

## 18. Dependencies added

None. No `package.json`/`pnpm-lock.yaml` change.

## 19. Config changes

None.

## 20. Confirmation existing request contracts unchanged

Confirmed. No file under `functions/src/index.ts`, any `*Command.ts`, or any parser was touched. `git diff --stat` against `origin/main` touches only `functions/src/infrastructure/postgres/migrations/**` and two `*.postgres.test.ts` files.

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
3. **`0017.down`'s marker-scoped delete is the only safety net against deleting real data on rollback** — tested directly (§10); a full `0016`+`0017` rollback is documented as safe only when no real Business has created an item yet (§27 below), matching PB-012 §26's own rollback-order guidance.

## 27. Rollback instructions

Reverse order: `migrateDown(pool, migrationsDir, 1)` rolls back only `0017` (drops the junction table; deletes only its own synthesized `qualifying_items` rows, identified by the fixed `created_by` marker — never a real Business's own item). A second `migrateDown(pool, migrationsDir, 1)` then rolls back `0016` (`DROP TABLE qualifying_items`) — **safe only if no real Business has created its own item yet**, since `0016.down` is an unconditional `DROP TABLE`; this matches PB-012 §13/§26's own documented precondition exactly, and is not weakened here.

## 28. Unrelated files confirmation

Confirmed. `git diff --cached --stat` against `origin/main` shows exactly seven files, all under `functions/src/infrastructure/postgres/` (four new migration files, one README addition, two test-file extensions). No unrelated file touched.

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

## FINAL DISPOSITION

**PLATFORM-BASELINE-013A.1 — IMPLEMENTED / ADDITIVE PERSISTENCE FOUNDATION ESTABLISHED / AWAITING INDEPENDENT REVIEW.**

The additive PostgreSQL persistence foundation for the Business-owned Qualifying Item model (`DEC-LOY-016`) is implemented exactly to the approved `PLATFORM-BASELINE-012` design's §5/§6/§8/§13 specification: two new tables (`qualifying_items`, `reward_program_version_qualifying_items`), a tested, idempotent backfill from the legacy junction table, and full down-migration coverage including the rollback precondition that protects real Business-created data. Nothing outside `functions/src/infrastructure/postgres/` was touched; no request contract, Reward Program behaviour, purchase behaviour, or UI changed; no runtime path depends on the new schema. All available validation (53 postgres-infra tests, 1765 unit tests, typecheck, lint, build, `git diff --check`) passes; the two Firestore-emulator-dependent suites were not run in this session (environmental, pre-existing, unrelated to this change) and are disclosed rather than assumed passing. `PLATFORM-BASELINE-013A.2` and later packages were not started.
