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
§20 for the full schema rationale. `verification_decisions` remains un-created here — it belongs to its own,
separately authorized future implementation package. (`redemptions` was
reserved here for exactly such a package and is created by `0020`, below.)

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

`CAPABILITY-6-REDEMPTION-ENGINE-001` adds `0020`: the redemption evidence
store and the redemption-caused widening of the existing Trust Event and
Notification Intent shapes. Four additive, backward-compatible changes in
one migration (a single deployment unit — `confirmRedemption` writes all of
them in one transaction): the `rewards (id, loyalty_cycle_id)` UNIQUE that
makes a redemption prove relationally that the Reward it redeems belongs to
the Cycle it names; the `redemptions` table itself (`UNIQUE (reward_id)` as
the exactly-once backstop, plus the `redemptions_reward_in_cycle` /
`redemptions_match_cycle` / `redemptions_governing_version` composite FK
chain) with individual-attribution columns and **no** cancellation or
reversal fields (`DEC-LOY-004`); two new governed Trust Event types
(`reward.redeemed`, `loyalty_cycle.reward_redeemed`) with the causal
Purchase columns made NULLABLE under a shape CHECK that keeps them NOT NULL
for every purchase-caused type — and, by the CORR-001 correction, a widened
causation shape for the existing availability pair (`reward.available` /
`loyalty_cycle.reward_available`, plus the `reward_available_customer`
intent): a forward allocation of pending Verified Units into the newly opened
Cycle can carry it straight to the threshold and make the next Reward
available under redemption causation (NULL Purchase columns, anchored on the
Redemption), because those units came from several Purchases and have no
single causal Purchase Record; and two new governed Notification Intent
types (`reward_redeemed_customer`, `reward_redeemed_business`) anchored on
a new `source_redemption_id` FK with the same per-recipient dedup the
purchase intents have. The `0020` down migration refuses outright when any
redemption evidence row exists (fail-closed guard — recovery of a populated
database requires a pre-0020 backup). `purchase_outbox` is deliberately NOT widened — it
is Purchase-Record-scoped and a Business-confirmed redemption has no causal
Purchase Record. See
`docs/05-implementation/reports/capability-6-redemption-engine-001-implementation-report-2026-09-27.md`
and `../rewardProgramMigrations.postgres.test.ts` for coverage. `0020` is
authored here but applied only in the local test database by this package;
it has not been applied to any deployed database.

`WP-COM-01` adds `0021`: the Commercial domain foundation
(`commercial_accounts`, `commercial_ledger_entries`,
`commercial_price_schedules`, `commercial_standing_events`,
`commercial_audit_events`) and the trigger functions that make the ledger,
audit, price and standing tables immutable and keep the account derived from
the ledger. Purely additive and self-contained: no existing object is
altered and no foreign key crosses into or out of the Loyalty/Purchase
tables. No data is seeded (in particular no BIF/RWF launch price). Its
`.down.sql` fails closed while any Commercial row exists. See
`docs/05-implementation/reports/wp-com-01-commercial-domain-foundation-implementation-report-2026-09-30.md`
and `../../../domains/commercial/commercialFoundation.postgres.test.ts`.
`0021` is authored here but applied only in the local test database by this
package; it has not been applied to any deployed database.

`WP-COM-02` adds `0022`: the `commercial_settlements` table (manual/offline
settlement evidence, two-step `recorded` -> `confirmed`) with insert/update
guard triggers. Purely additive and self-contained: one new table, foreign
keys only to other `commercial_*` tables, no existing object altered, no data
seeded. Its `.down.sql` fails closed while any settlement row exists. See
`docs/05-implementation/reports/wp-com-02-commercial-settlement-and-price-schedule-implementation-report-2026-09-30.md`
and `../../../domains/commercial/commercialSettlement.postgres.test.ts`.
`0022` is authored here but applied only in the local test database by this
package; it has not been applied to any deployed database.

`WP-COM-03` adds `0023`: the manual Commercial administration provenance
schema -- `commercial_trial_grants` (per-grant `units BETWEEN 3 AND 5`; no
lifetime cap, no default), `commercial_manual_adjustments` (trial and paid-credit
adjustments; closed reason vocabulary for paid credit), the `voided` settlement
status with its void columns and a replaced transition guard, and a partial
unique index allowing one void reversal per settlement. Every foreign key stays
inside `commercial_*`; no data is seeded. Its `.down.sql` restores the `0022`
settlement shape and fails closed while any grant, adjustment or voided
settlement exists. See
`docs/05-implementation/reports/wp-com-03-manual-commercial-administration-implementation-report-2026-09-30.md`
and `../../../domains/commercial/commercialAdministration.postgres.test.ts`.
`0023` is authored here but applied only in the local test database by this
package; it has not been applied to any deployed database.

`WP-COM-03A` adds `0024`: recorded-settlement cancellation -- the `cancelled`
settlement status with immutable cancellation provenance columns, a replaced
lifecycle CHECK and transition guard (only `recorded -> confirmed`,
`recorded -> cancelled`, `confirmed -> voided`), and one read-only BEFORE INSERT
trigger on the ledger so a cancelled settlement can never hold a ledger entry.
No table is created or dropped; no ledger row, account, price or Loyalty object
is altered. Its `.down.sql` restores the `0023` settlement shape and fails
closed while any cancelled settlement exists. See
`docs/05-implementation/reports/wp-com-03a-recorded-settlement-cancellation-implementation-report-2026-09-30.md`
and `../../../domains/commercial/commercialSettlementCancellation.postgres.test.ts`.
`0024` is authored here but applied only in the local test database by this
package; it has not been applied to any deployed database.

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
