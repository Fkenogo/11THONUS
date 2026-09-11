# Postgres migrations — intentionally empty (PLATFORM-BASELINE-001)

This directory is where every future PostgreSQL-authoritative domain's
schema migrations belong, applied by `../migrationRunner.ts`.

`PLATFORM-BASELINE-001` proves the migration mechanism itself — connectivity,
ordered execution, current-version detection, idempotent re-run, and
rollback — without creating any loyalty-spine table. Per its scope
boundary, none of `reward_programs`, `reward_program_versions`,
`purchase_records`, `verification_decisions`, `verified_units`,
`loyalty_cycles`, `rewards`, `redemptions`, or a loyalty-spine outbox table
may be created here. Those belong to their own, separately authorized
future implementation packages.

The migration runner's own bookkeeping table (`schema_migrations`) is
created directly by `migrationRunner.ts`'s `ensureMigrationsTable` — it is
migration-system metadata intrinsic to the mechanism, not a numbered
migration file in this directory.

Naming convention for future migrations added here by later packages:

```
NNNN_short_description.sql          # forward migration (required)
NNNN_short_description.down.sql     # rollback migration (optional but preferred)
```

`NNNN` is a zero-padded, strictly increasing integer (e.g. `0001`, `0002`).
See `../migrationRunner.test.ts` / `../migrationRunner.postgres.test.ts` for
the exact ordering, idempotency, and rollback semantics this convention
guarantees.
