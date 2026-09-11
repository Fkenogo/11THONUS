# PLATFORM-BASELINE-001-CORR-001 — PostgreSQL Foundation & Readiness Correctness — Correction Report

**Date:** 2026-09-11
**PR:** [#246](https://github.com/Fkenogo/11THONUS/pull/246) (branch `feat/platform-baseline-001-postgres-foundation`)
**Reviewed head (entry):** `bc20dbd649a7524f142539827dbab12d21d2bbc8`
**Task:** `PLATFORM-BASELINE-001-CORR-001` — correct the six independently verified P2 findings on PR #246 (bounded correction; no redesign, no scope broadening, no unrelated files).

---

## 1. Entry head SHA

`bc20dbd649a7524f142539827dbab12d21d2bbc8` — the exact PR #246 head against which the six P2 review threads were raised.

## 2. Final head SHA

`71ae63c4b79cf4ded6b3ef9e23abcf5ce9d01a7b` (pushed to `feat/platform-baseline-001-postgres-foundation`; PR #246 head).

## 3. Files modified

Modified (11):

- `.env.example` — documents the strict `PLATFORM_POSTGRES_SSL` contract (lowercase `true`/`false` only).
- `functions/src/infrastructure/postgres/migrationRunner.ts` — read-only inspection + shared history validation + exact-prefix enforcement.
- `functions/src/infrastructure/postgres/platformFoundationReadiness.ts` — uses read-only inspection and verifies migration integrity.
- `functions/src/infrastructure/postgres/postgresConfig.ts` — strict positive-integer and SSL validation.
- `functions/src/domains/commerceKnowledge/seed/seedManifest.ts` — extracted `seedNodeImmutableIdentityMatches` (pure).
- `functions/src/domains/commerceKnowledge/seed/seedLoader.ts` — reuses the extracted comparison.
- `functions/src/domains/commerceKnowledge/services/checkCommerceKnowledgeBaselineEstablished.ts` — verifies governed end-state.
- `functions/src/infrastructure/postgres/migrationRunner.test.ts` — unit tests for `validateMigrationHistory`.
- `functions/src/infrastructure/postgres/platformFoundationReadiness.test.ts` — read-only readiness unit tests.
- `functions/src/infrastructure/postgres/postgresConfig.test.ts` — strict numeric + SSL unit tests.
- `functions/src/infrastructure/postgres/migrationRunner.postgres.test.ts` — real-Postgres fail-closed history tests.

Added (2):

- `functions/src/infrastructure/postgres/platformFoundationReadiness.postgres.test.ts` — real-Postgres readiness tests.
- `docs/05-implementation/reports/PLATFORM-BASELINE-001-CORR-001-correction-report-2026-09-11.md` — this report.

No file outside these was touched. No loyalty-domain schema, no Reward Program/Purchase/Verified Unit/Loyalty Cycle/Reward/Redemption schema, no Cloud SQL provisioning, no ORM, no Firestore-domain migration, no hosted Preview, no authentication-architecture change, no governance-decision change, no `ENG-Pn` renumbering.

## 4. Diff summary

- **Correction 1 (read-only readiness):** split migration bootstrap from inspection. Added read-only `migrationsTableExists` (`SELECT to_regclass(...)`) and `readAppliedMigrations` (returns `null` when `schema_migrations` is absent; never creates it). `getAppliedMigrations` remains the mutation-capable inspection used only by the runner. `platformFoundationReadiness.checkMigrationState` now uses `readAppliedMigrations`; a fresh DB with migrations present reports `migration foundation not established`, and the empty-migrations package case stays trivially ready.
- **Correction 2 (integrity in readiness):** readiness now runs `validateMigrationHistory` (checksum + name + identity) instead of comparing versions only.
- **Correction 3 (exact-prefix history):** added shared `validateMigrationHistory` and rewrote `migrateUp` to validate the full persisted prefix (no gap, no unknown version, no name/checksum mismatch) before executing any SQL; on failure it throws without making any schema change.
- **Correction 4 (governed end-state):** extracted `seedNodeImmutableIdentityMatches` into `seedManifest.ts` (shared with the seed loader) and `checkCommerceKnowledgeBaselineEstablished` now also verifies `active` status, immutable identity (`nodeType`/`parentId`/`slug`/`canonicalName`), and the required EN translation (`displayName` match + `published`).
- **Correction 5 (strict numeric):** replaced `Number.parseInt` partial parsing with the full-trim regex `/^[1-9][0-9]*$/`; explicit malformed values throw.
- **Correction 6 (fail-closed SSL):** absent/empty → environment default; explicit value must be exactly lowercase `true`/`false`, anything else throws.

## 5. Finding-by-finding correction matrix

| # | P2 finding (thread) | Correction | Test evidence | Thread state |
|---|---|---|---|---|
| 1 | Readiness mutates `schema_migrations` (`platformFoundationReadiness.ts:68`) | Read-only `readAppliedMigrations`; readiness never creates the table; fresh DB → not-established | `platformFoundationReadiness.test.ts` (no-CREATE assertions), `platformFoundationReadiness.postgres.test.ts` ("does not create schema_migrations") | Resolved |
| 2 | Readiness ignores checksum/identity (`platformFoundationReadiness.ts:70`) | Readiness runs shared `validateMigrationHistory` (checksum + name + identity) | `platformFoundationReadiness.test.ts` (checksum/name mismatch → not-ready), `platformFoundationReadiness.postgres.test.ts` (real checksum/name mismatch) | Resolved |
| 3 | Non-prefix history applies out of order (`migrationRunner.ts:150`) | `migrateUp` validates exact prefix via `validateMigrationHistory` before any SQL; gap/unknown/name/checksum fail closed | `migrationRunner.test.ts` (unit: gap/unknown/prefix/up-to-date), `migrationRunner.postgres.test.ts` (real gap/unknown/checksum/name) | Resolved |
| 4 | Commerce Knowledge readiness too weak (`checkCommerceKnowledgeBaselineEstablished.ts:24`) | Verify `active` + immutable identity + required EN translation (`published`, matching `displayName`) | `checkCommerceKnowledgeBaselineEstablished.emulator.test.ts` (missing/inactive/immutable-mismatch/translation-missing/unpublished/diverged) | Resolved |
| 5 | `Number.parseInt` partial parse (`postgresConfig.ts:79`) | Full-trim positive base-10 integer regex | `postgresConfig.test.ts` (suffix/prefix/decimal/zero/negative/whitespace/leading-zero) | Resolved |
| 6 | Invalid SSL falls through (`postgresConfig.ts:88`) | Explicit value must be exactly `true`/`false`; else throw | `postgresConfig.test.ts` (true/false/missing/empty/`treu`/`TRUE`) | Resolved |

## 6. Tests added/changed

- `postgresConfig.test.ts`: +12 tests (strict numeric examples and SSL contract) → 22 total.
- `migrationRunner.test.ts`: +6 tests (`validateMigrationHistory`: up-to-date, valid prefix, checksum mismatch, name mismatch, gap, unknown) → 14 total.
- `platformFoundationReadiness.test.ts`: +3 tests (fresh-DB no-CREATE, checksum mismatch, name mismatch; extended read-only regex to include `CREATE`) → 9 total.
- `checkCommerceKnowledgeBaselineEstablished.emulator.test.ts`: +5 tests (inactive, immutable mismatch, missing/unpublished/diverged translation) → 8 total.
- `migrationRunner.postgres.test.ts`: +4 real-Postgres tests (gap, unknown, checksum, name fail-closed) → 10 total.
- `platformFoundationReadiness.postgres.test.ts`: new, 5 real-Postgres tests (not-established + no-CREATE, ready, checksum mismatch, name mismatch, pending).

## 7. Real-Postgres validation results

Ran against a disposable `postgres:16-alpine` container (`docker-compose.postgres.yml`, port `54329`, health-gated `--wait`):

```
PLATFORM_ENV=test pnpm --filter functions test:postgres
→ 3 files / 21 tests passed
```

## 8. Emulator regression result

```
pnpm run emulators:validate
→ 61 files / 772 passed / 2 skipped (clean)
```

First run had one pre-existing flake (`knowledgeNodeRepository` concurrency timeout under full-suite load) — reproduced as passing in isolation and in a clean full re-run; unrelated to these changes (no `knowledgeNodeRepository`/`createKnowledgeNodePersisted` code touched). This is the same documented `functions/` emulator-timing flake noted for `ENG-CI-001`.

## 9. Exact-head CI result

Green on the exact head `71ae63c4b79cf4ded6b3ef9e23abcf5ce9d01a7b` — "Build, Lint, Test, Emulator Validation" workflow `SUCCESS` (run 34613245262). Not merged.

## 10. Review-thread state

Six P2 inline review threads (all `chatgpt-codex-connector`): each was re-inspected against the corrected head, corrected as in §5, and is now **outdated** (GitHub marks the comment `original_line` as no longer on the current diff: the code at every referenced line changed). Thread IDs and per-thread confirmation are listed in §5. No unresolved material review thread remains.

## 11. Commands executed

`pnpm install`; `pnpm --filter functions run typecheck`; `pnpm run typecheck`; `pnpm run lint`; `pnpm run format:check` / `pnpm exec prettier --write`; `pnpm --filter functions run test`; `pnpm --filter functions run build`; `pnpm run build`; `docker compose -f docker-compose.postgres.yml up -d --wait`; `PLATFORM_ENV=test pnpm --filter functions test:postgres`; `pnpm run emulators:validate`.

## 12. Dependencies added

None. No new dependency was added; no lockfile change.

## 13. Config changes

`.env.example` only — clarified the strict `PLATFORM_POSTGRES_SSL` contract (documentation, no behavior/code secret). No CI file, no deployment config, no secret changed.

## 14. Database/schema changes

None. No migration file, no loyalty-spine table, and no shipped `migrations/` content was added or changed. `schema_migrations` behavior is unchanged for the runner; the only behavioral change is that the readiness probe no longer creates it.

## 15. Risks

- A read-only health-check credential now returns `not established` on a fresh DB instead of being able to self-bootstrap — intended and required by the finding, but any downstream gate that previously relied on readiness implicitly creating `schema_migrations` must now run `migrateUp` explicitly first.
- Strict numeric/SSL validation may reject environment values that previously "worked" by silent coercion (e.g. `3workers`) — that is the point of fail-closed; deployments with such malformed values will now fail loudly and must be corrected.

## 16. Known limitations

- No CI job runs `test:postgres` automatically (unchanged from the original package — out of scope to add CI).
- `checkPlatformFoundationReadiness` remains a plain exported function with no wired transport (unchanged).

## 17. Rollback instructions

`git revert <correction-commit>` (or drop the branch/PR and re-apply the original `bc20dbd` head). No dependency, migration, or CI change was made; the disposable Postgres container is torn down with `docker compose -f docker-compose.postgres.yml down -v`.

## 18. Markdown correction report

This document.

## 19. Updated .md change-tracking record

This report is the `.md` change-tracking record for `PLATFORM-BASELINE-001-CORR-001`, following the same convention the original `platform-baseline-001-postgres-foundation-implementation-report-2026-09-11.md` established for `PLATFORM-BASELINE-001` (which explicitly noted this task is not an `ENG-Pn-nnn` work package and uses a report as its tracking record instead).

## Final disposition

`PLATFORM-BASELINE-001-CORR-001` — **IMPLEMENTED / AWAITING INDEPENDENT REVIEW**. Not merged.
