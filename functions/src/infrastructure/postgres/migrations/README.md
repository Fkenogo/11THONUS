# Postgres migrations

Every PostgreSQL-authoritative domain's schema migrations live here,
applied by `../migrationRunner.ts`.

`PLATFORM-BASELINE-001` proved the migration mechanism itself —
connectivity, ordered execution, current-version detection, idempotent
re-run, and rollback — and shipped this directory empty.

`PLATFORM-BASELINE-005A` is the first package to add real product
migrations: `0001`–`0005` establish the Reward Program schema
(`reward_programs`, `reward_program_versions`,
`reward_program_version_qualifying_nodes`) plus two generic PostgreSQL
supporting tables introduced for this domain (`idempotency_keys`,
`reward_program_outbox`) — see
`../rewardProgramMigrations.postgres.test.ts` for their coverage and
`docs/05-implementation/reports/PLATFORM-BASELINE-005A-reward-program-foundation-implementation-report-2026-09-13.md`
for the full design rationale. `purchase_records`, `verification_decisions`,
`verified_units`, `loyalty_cycles`, `rewards`, and `redemptions` remain
un-created here — those belong to their own, separately authorized future
implementation packages.

The migration runner's own bookkeeping table (`schema_migrations`) is
created directly by `migrationRunner.ts`'s `ensureMigrationsTable` — it is
migration-system metadata intrinsic to the mechanism, not a numbered
migration file in this directory.

Naming convention for future migrations added here by later packages:

```
NNNN_short_description.sql          # forward migration (required)
NNNN_short_description.down.sql     # rollback migration (optional but preferred)
```

`NNNN` is a zero-padded, strictly increasing integer, continuing from the
highest version already present in this directory. See
`../migrationRunner.test.ts` / `../migrationRunner.postgres.test.ts` for
the exact ordering, idempotency, and rollback semantics this convention
guarantees.
