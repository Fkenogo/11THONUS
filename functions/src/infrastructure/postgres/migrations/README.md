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
for the full design rationale. `PLATFORM-BASELINE-006A` adds `0007`–`0014`: two additive composite
UNIQUEs on the Reward Program tables (same-program scope proofs) plus the
Purchase / Verification transactional spine (`purchase_records`,
`purchase_record_events`, `verified_units`, `loyalty_cycle_streams`,
`loyalty_cycles`, `verified_unit_allocations`,
`verified_unit_allocation_events`, `rewards`, `trust_events`,
`notification_intents`, `purchase_outbox`) — see
`docs/05-implementation/reports/PLATFORM-BASELINE-006-purchase-verification-entry-technical-design-2026-09-14.md`
§20 for the full schema rationale. `verification_decisions` and
`redemptions` remain un-created here — those belong to their own,
separately authorized future implementation packages.

`PLATFORM-BASELINE-013A.1` adds `0016`–`0017`: the additive,
Business-owned `qualifying_items` persistence foundation
(`qualifying_items`, `reward_program_version_qualifying_items`, plus a
backfill from the legacy `reward_program_version_qualifying_nodes` table)
— see
`docs/05-implementation/reports/platform-baseline-012-business-owned-qualifying-item-implementation-readiness-design-2026-09-18.md`
§5/§6/§13 for the full design rationale and
`../rewardProgramMigrations.postgres.test.ts` for coverage. This package
is persistence only: no application code reads or writes either new
table yet, and `reward_program_version_qualifying_nodes` is retained
unread, dropped only by a later, separately authorized, environment-gated
migration.

`PLATFORM-BASELINE-013C` adds `0018`: the additive purchase-binding column
`purchase_records.qualifying_item_id` plus two composite foreign keys
(`purchase_records_item_in_business` against `qualifying_items (id,
business_id)` and `purchase_records_item_in_version` against
`reward_program_version_qualifying_items (reward_program_version_id,
qualifying_item_id)`), added `NOT VALID` then `VALIDATE`d. This makes the
Business-owned Qualifying Item the structural purchase-item identity. The
column is deliberately left NULLABLE (legacy rows keep NULL); tightening it
to `NOT NULL` is the deferred, environment-gated `PB-013E`/`0019` job. See
`docs/05-implementation/reports/platform-baseline-012-business-owned-
qualifying-item-implementation-readiness-design-2026-09-18.md` §7/§10/§13
and `../rewardProgramMigrations.postgres.test.ts` for coverage.

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
