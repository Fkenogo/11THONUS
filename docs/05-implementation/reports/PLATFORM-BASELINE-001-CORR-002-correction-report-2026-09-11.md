# PLATFORM-BASELINE-001-CORR-002 — Final Migration-Readiness and CI Coverage Correction — Report

**Date:** 2026-09-11
**PR:** [#246](https://github.com/Fkenogo/11THONUS/pull/246) (branch `feat/platform-baseline-001-postgres-foundation`)
**Entry head:** `9d23bd63456c4bac0bc9cc84cd117b996854d40b`
**Task:** `PLATFORM-BASELINE-001-CORR-002` — two bounded corrections: (1) migration readiness must never report `ready` when `schema_migrations` is absent, and (2) run the PostgreSQL integration suite in canonical GitHub CI.

---

## 1. Entry head

`9d23bd63456c4bac0bc9cc84cd117b996854d40b` (PR #246 head at the start of this correction).

## 2. Final head

_Recorded after the correction commit is pushed (see §8 CI)._

## 3. Exact files modified

- `functions/src/infrastructure/postgres/platformFoundationReadiness.ts` — remove the empty-migration-set early `ready` short-circuit; a missing `schema_migrations` now always yields `migration_state not established`.
- `functions/src/infrastructure/postgres/platformFoundationReadiness.test.ts` — update the "ready" unit test to model `schema_migrations` existing (bootstrap already run) with no pending migrations.
- `functions/src/infrastructure/postgres/platformFoundationReadiness.postgres.test.ts` — add Case A / Case B against the **actual shipped** (empty) `migrations/` directory.
- `.github/workflows/ci.yml` — add a disposable `postgres:16-alpine` service container and a PostgreSQL integration-test step.
- `docs/05-implementation/reports/PLATFORM-BASELINE-001-CORR-002-correction-report-2026-09-11.md` — this report.

## 4. Migration-readiness correction

`checkMigrationState()` previously returned `ready: true` when `readAppliedMigrations()` returned `null` and the discovered migration set was empty. That let the shipped empty `migrations/` directory report a completely fresh database as having an established migration foundation even though `schema_migrations` was never created.

Correction: the empty-migration-set short-circuit is removed. `readAppliedMigrations() === null` now always returns `migration_state` `ready: false` with reason `migration foundation not established (schema_migrations table does not exist)`, regardless of how many migration files are discovered. Readiness remains strictly read-only (never creates `schema_migrations`). Only once the explicit bootstrap/migration path (`migrateUp`) has created `schema_migrations` can an empty migration set report `current/ready` (via `validateMigrationHistory([] , []) → ok, pending []`).

All prior checksum/prefix/history validation is unchanged and preserved.

## 5. Actual-shipped-directory test evidence

`platformFoundationReadiness.postgres.test.ts` now references `path.join(__dirname, "migrations")` — the package's real, shipped, intentionally-empty migrations directory — in addition to the throwaway `__fixtures__/migrations` directory.

- **Case A** (fresh database, shipped dir empty, `schema_migrations` absent): `migration_state.ready === false`, reason matches `not established`, and `SELECT to_regclass('schema_migrations')` remains `NULL` (read-only, no CREATE). Verified against a real disposable Postgres 16 instance.
- **Case B** (explicit `migrateUp` against the shipped empty dir, then readiness): `migrateUp` returns `{ applied: [] }`, `schema_migrations` now exists, and `migration_state.ready === true`.

Local run: `PLATFORM_ENV=test pnpm --filter functions test:postgres` → 3 files / 23 tests passed (was 21; +2 shipped-directory cases).

## 6. CI PostgreSQL service/setup

`.github/workflows/ci.yml` adds a native GitHub Actions **service container** (no Docker Compose, no external/hosted database, no secret):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: eleventhonus_platform_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd "pg_isready -U postgres"
      --health-interval 5s
      --health-timeout 5s
      --health-retries 10
```

And a new step (after unit tests, before Playwright/emulator — both unchanged):

```yaml
- name: PostgreSQL integration tests
  env:
    PLATFORM_ENV: test
    PLATFORM_POSTGRES_URL: postgres://postgres:postgres@localhost:5432/eleventhonus_platform_test
  run: PLATFORM_ENV=test pnpm --filter functions test:postgres
```

The runner waits for the `pg_isready` health check before proceeding; the database is ephemeral and CI-only. No existing step was weakened or removed.

## 7. Local validation

All executed locally (disposable `postgres:16-alpine` via `docker-compose.postgres.yml`, port 54329; real Firebase Emulator Suite):

| Check | Result |
|---|---|
| `pnpm run typecheck` | Passed |
| `pnpm run lint` | Passed (0 errors; 1 pre-existing unrelated `apps/web` warning) |
| `pnpm run format:check` | Passed |
| `pnpm --filter functions run test` | Passed — 157 files / 1699 tests |
| `pnpm run build` | Passed |
| `PLATFORM_ENV=test pnpm --filter functions test:postgres` | Passed — 3 files / 23 tests |
| `pnpm run emulators:validate` | Passed — 61 files / 772 tests, 2 skipped |

## 8. Exact-head CI run

_To be recorded after push. The CI run must itself include and pass the "PostgreSQL integration tests" step._

## 9. Confirmation that Postgres integration tests passed IN CI

_To be recorded after the exact-head CI run completes (see §8)._

## 10. Review-thread state

Re-inspected all existing PR review threads after this correction: the six CORR-001 P2 threads remain corrected/outdated, and their underlying issues remain resolved (verified, not merely outdated-by-line-move). Any newly generated automated review findings on this correction will be assessed before final disposition.

## 11. Dependencies

None added. No lockfile change.

## 12. Config changes

`.github/workflows/ci.yml` only (new service container + new test step). No `.env`, no deployment config, no secret.

## 13. Risks

- CI now depends on a `postgres:16-alpine` image pull per run (public Docker Hub image, no auth) — an ephemeral, low-risk dependency.
- The health-check wait relies on the GitHub runner's service-container health support; the `pg_isready` probe is the same one the local `docker-compose.postgres.yml` uses.

## 14. Rollback

`git revert <correction-commit>` (or drop the branch). No dependency, schema, or secret change; the disposable local Postgres container is torn down with `-v`.

## 15. Markdown correction report / change record

This document is the `.md` change-tracking record for `PLATFORM-BASELINE-001-CORR-002` (same convention as the `CORR-001` report; this task is not an `ENG-Pn-nnn` work package).

## Final disposition

`PLATFORM-BASELINE-001-CORR-002` — **IMPLEMENTED / AWAITING INDEPENDENT REVIEW**. Not merged.
