/**
 * WP-COM-01 — Commercial domain foundation: real PostgreSQL tests.
 *
 * Runs the shipped `0021` migration against a live PostgreSQL instance and
 * proves the foundation's schema, immutability, integrity, ledger, pricing,
 * audit and idempotency behaviour. Requires only PostgreSQL (no Firestore
 * emulator): the authority seam is unit-tested in `commercialAuthority.test.ts`.
 *
 *   PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *     npx vitest run --config vitest.postgres.config.ts commercialFoundation
 *
 * Isolation: Commercial rows are immutable (DELETE is rejected by design), so
 * this suite gives every test its own Business id and, before and after the
 * whole file, drops the Commercial schema objects and the `0021` bookkeeping
 * row so the shared test database is returned to its pre-0021 state.
 *
 * ALL price values below are TEST-ONLY fixtures. They are not, and must not
 * be read as, BIF/RWF launch prices (which are Founder launch inputs).
 */

import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadPostgresConfig } from "../../infrastructure/postgres/postgresConfig";
import {
  closePostgresPool,
  createPostgresPool,
  type PlatformPostgresPool,
} from "../../infrastructure/postgres/postgresPool";
import { migrateDown, migrateUp } from "../../infrastructure/postgres/migrationRunner";
import { withPlatformTransaction } from "../../infrastructure/postgres/postgresTransaction";
import {
  getCommercialAccount,
  insertCommercialAccount,
  lockCommercialAccount,
  updateAccountAdministrativeState,
  updateAccountCounters,
} from "./repositories/commercialAccountRepository";
import { listLedgerEntries, sumLedger } from "./repositories/commercialLedgerRepository";
import {
  getEffectivePriceSchedule,
  insertPriceSchedule,
  listPriceSchedules,
} from "./repositories/commercialPriceRepository";
import {
  appendCommercialAuditEvent,
  listCommercialAuditEventsForBusiness,
} from "./repositories/commercialAuditRepository";
import {
  insertStandingEvent,
  listStandingEvents,
} from "./repositories/commercialStandingRepository";
import {
  postCommercialLedgerEntry,
  type PostCommercialLedgerEntryInput,
} from "./services/postCommercialLedgerEntry";
import { runCommercialCommand } from "./services/commercialIdempotency";
import { availableCapacity, type CommercialMarket } from "./models/commercialFoundation";
import { CommercialDomainError } from "./models/commercialErrors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "..", "infrastructure", "postgres", "migrations");

let pool: PlatformPostgresPool;

const COMMERCIAL_TABLES = [
  "commercial_settlements",
  "commercial_audit_events",
  "commercial_standing_events",
  "commercial_ledger_entries",
  "commercial_price_schedules",
  "commercial_accounts",
];

async function dropCommercialObjects(): Promise<void> {
  for (const table of COMMERCIAL_TABLES) {
    await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }
  for (const fn of [
    "commercial_settlements_update_guard",
    "commercial_settlements_insert_guard",
    "commercial_assert_account_matches_ledger",
    "commercial_price_schedules_versioning",
    "commercial_accounts_guard",
    "commercial_reject_mutation",
  ]) {
    await pool.query(`DROP FUNCTION IF EXISTS ${fn}() CASCADE`);
  }
  const hasMigrations = await pool.query("SELECT to_regclass('public.schema_migrations') AS t");
  if (hasMigrations.rows[0].t !== null) {
    await pool.query("DELETE FROM schema_migrations WHERE version IN ('0021', '0022')");
  }
  await pool
    .query("DELETE FROM idempotency_keys WHERE idempotency_key LIKE 'wpcom01-%'")
    .catch(() => {});
}

// True when the shared test database held no tables at all when this file started:
// then this file owns everything it migrates, and returns the database to that exact
// pristine state, so no other file's "fresh database" assumption can depend on file order.
let startedFromEmptyDatabase = false;

beforeAll(async () => {
  if (!process.env.PLATFORM_POSTGRES_URL && process.env.PLATFORM_ENV !== "test") {
    throw new Error("This test requires a live PostgreSQL instance (PLATFORM_ENV=test).");
  }
  pool = createPostgresPool(loadPostgresConfig());
  const existing = await pool.query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'",
  );
  startedFromEmptyDatabase = existing.rows[0].n === 0;
  await dropCommercialObjects();
  await migrateUp(pool, migrationsDir);
}, 120000);

afterAll(async () => {
  await dropCommercialObjects();
  if (startedFromEmptyDatabase) {
    await pool.query("DROP SCHEMA public CASCADE");
    await pool.query("CREATE SCHEMA public");
  }
  await closePostgresPool(pool);
});

const newBusiness = () => `biz-${randomUUID()}`;
const newKey = () => `wpcom01-${randomUUID()}`;

async function openAccount(businessId = newBusiness(), market: CommercialMarket = "BI") {
  const account = await withPlatformTransaction(pool, (tx) =>
    insertCommercialAccount(tx, {
      businessId,
      settlementMarket: market,
      commercialEffectiveFrom: new Date("2026-01-01T00:00:00Z"),
      correlationId: "corr-test",
    }),
  );
  if (account === null) throw new Error("account unexpectedly existed");
  return account;
}

function entry(
  businessId: string,
  overrides: Partial<PostCommercialLedgerEntryInput> = {},
): PostCommercialLedgerEntryInput {
  return {
    businessId,
    entryType: "credit_adjustment",
    bucket: "paid",
    unitsDelta: 1,
    reasonCode: "correction",
    reasonText: "test entry",
    idempotencyScopeKey: `scope-${randomUUID()}`,
    createdBy: "admin-test",
    correlationId: "corr-test",
    ...overrides,
  };
}

const post = (input: PostCommercialLedgerEntryInput) =>
  withPlatformTransaction(pool, (tx) => postCommercialLedgerEntry(tx, input));

// TRUNCATE is refused either by the immutability trigger or, for tables that other
// Commercial tables reference, by PostgreSQL's own foreign-key guard -- both reject it.
const TRUNCATE_REJECTED =
  /append-only and immutable|not permitted|cannot truncate a table referenced/;

async function expectPgFailure(promise: Promise<unknown>, pattern: RegExp, code?: string) {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, "expected the statement to be rejected").toBeDefined();
  const message = (caught as Error).message;
  expect(message).toMatch(pattern);
  if (code !== undefined) expect((caught as { code?: string }).code).toBe(code);
}

// ---------------------------------------------------------------------------
describe("0021 schema shape and migration lifecycle", () => {
  it("creates exactly the five foundation tables plus the WP-COM-02 settlements table, and none of the later-WP tables", async () => {
    const tables = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'commercial\\_%' ORDER BY table_name`,
    );
    expect(tables.rows.map((r) => r.table_name)).toEqual([
      "commercial_accounts",
      "commercial_audit_events",
      "commercial_ledger_entries",
      "commercial_price_schedules",
      "commercial_settlements",
      "commercial_standing_events",
    ]);
  });

  it("is self-contained: no foreign key to a non-Commercial table and none into Commercial from outside", async () => {
    const outbound = await pool.query<{ referenced: string }>(
      `SELECT confrelid::regclass::text AS referenced FROM pg_constraint
        WHERE contype = 'f' AND conrelid::regclass::text LIKE 'commercial\\_%'`,
    );
    for (const row of outbound.rows) expect(row.referenced).toMatch(/^commercial_/);
    const inbound = await pool.query(
      `SELECT conrelid::regclass::text AS child FROM pg_constraint
        WHERE contype = 'f' AND confrelid::regclass::text LIKE 'commercial\\_%'
          AND conrelid::regclass::text NOT LIKE 'commercial\\_%'`,
    );
    expect(inbound.rows).toEqual([]);
  });

  it("seeds NO data: no price schedule, account, ledger, audit or standing row exists after migration", async () => {
    // Use a fresh database state (own transaction-free re-migration) so earlier tests cannot interfere.
    await dropCommercialObjects();
    await migrateUp(pool, migrationsDir);
    for (const table of COMMERCIAL_TABLES) {
      const count = await pool.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
      expect(count.rows[0].n, table).toBe(0);
    }
  });

  it("defines no subscription-tier / plan column anywhere in the Commercial tables", async () => {
    const cols = await pool.query<{ table_name: string; column_name: string }>(
      `SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name LIKE 'commercial\\_%'`,
    );
    expect(cols.rows.length).toBeGreaterThan(30);
    for (const row of cols.rows) {
      expect(`${row.table_name}.${row.column_name}`).not.toMatch(/tier|plan|subscription/i);
    }
  });

  it("encodes no trial ceiling, no 3-5 rule, no trial default and no negative-credit floor or maximum", async () => {
    const defaults = await pool.query<{ column_name: string; column_default: string | null }>(
      `SELECT column_name, column_default FROM information_schema.columns
        WHERE table_name = 'commercial_accounts'
          AND column_name IN ('trial_remaining_units','paid_balance_units','trial_reserved_units','paid_reserved_units')`,
    );
    expect(defaults.rows).toHaveLength(4);
    for (const row of defaults.rows) expect(row.column_default).toBe("0");

    const defs = await pool.query<{ def: string }>(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE contype = 'c' AND conrelid::regclass::text IN ('commercial_accounts','commercial_ledger_entries')`,
    );
    const all = defs.rows.map((r) => r.def).join("\n");
    expect(all).not.toMatch(/BETWEEN\s+3/i);
    expect(all).not.toMatch(/<=\s*5\b/);
    expect(all).not.toMatch(/paid_balance_units\s*>=?\s*-?\d/);
    expect(all).not.toMatch(/paid_after\s*>=?\s*-?\d/);
    // The only account-level trial bound is the integrity relation trial >= reserved >= 0.
    expect(all).toMatch(/trial_remaining_units >= trial_reserved_units/);
  });

  it("is reversible on an empty database, and rollback fails closed when Commercial evidence exists", async () => {
    await dropCommercialObjects();
    await migrateUp(pool, migrationsDir);

    // Populated: refuse (and change nothing).
    const businessId = newBusiness();
    await openAccount(businessId);
    // Two steps: 0022 (no settlements yet) rolls back, then 0021 refuses because the account exists.
    await expectPgFailure(migrateDown(pool, migrationsDir, 2), /refusing to roll back/);
    const still = await pool.query("SELECT to_regclass('public.commercial_accounts') AS t");
    expect(still.rows[0].t).not.toBeNull();

    // Empty: rolls back cleanly and re-applies (drop + re-migrate resets the immutable rows first).
    await dropCommercialObjects();
    await migrateUp(pool, migrationsDir);
    const down = await migrateDown(pool, migrationsDir, 2);
    expect(down.rolledBack).toEqual(["0022", "0021"]);
    const gone = await pool.query("SELECT to_regclass('public.commercial_accounts') AS t");
    expect(gone.rows[0].t).toBeNull();
    const fnGone = await pool.query(
      "SELECT COUNT(*)::int AS n FROM pg_proc WHERE proname LIKE 'commercial\\_%'",
    );
    expect(fnGone.rows[0].n).toBe(0);
    const reapplied = await migrateUp(pool, migrationsDir);
    expect(reapplied.applied).toEqual(["0021", "0022"]);
  });
});

// ---------------------------------------------------------------------------
describe("commercial_accounts", () => {
  it("opens a zero-state account: version 0, no trial default, no restriction, no paid activation", async () => {
    const account = await openAccount();
    expect(account).toMatchObject({
      trialRemainingUnits: 0,
      paidBalanceUnits: 0,
      trialReservedUnits: 0,
      paidReservedUnits: 0,
      serviceRestriction: "none",
      paidServiceActivatedAt: null,
      version: 0,
    });
  });

  it("is unique per Business and never overwritten by a second open", async () => {
    const businessId = newBusiness();
    await openAccount(businessId);
    const again = await withPlatformTransaction(pool, (tx) =>
      insertCommercialAccount(tx, {
        businessId,
        settlementMarket: "RW",
        commercialEffectiveFrom: new Date(),
        correlationId: "c2",
      }),
    );
    expect(again).toBeNull();
    expect((await getCommercialAccount(pool, businessId))?.settlementMarket).toBe("BI");
  });

  it("rejects an unsupported settlement market", async () => {
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_accounts (business_id, settlement_market, commercial_effective_from, correlation_id)
         VALUES ($1, 'KE', now(), 'c')`,
        [newBusiness()],
      ),
      /settlement_market/,
      "23514",
    );
  });

  it("rejects an account created with non-zero state and no ledger entries (no silent trial default)", async () => {
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_accounts (business_id, settlement_market, commercial_effective_from, correlation_id, trial_remaining_units)
         VALUES ($1, 'BI', now(), 'c', 3)`,
        [newBusiness()],
      ),
      /no ledger entries/,
      "23000",
    );
  });

  it("rejects DELETE and TRUNCATE", async () => {
    const { businessId } = await openAccount();
    await expectPgFailure(
      pool.query("DELETE FROM commercial_accounts WHERE business_id = $1", [businessId]),
      /never deleted/,
      "23001",
    );
    await expectPgFailure(pool.query("TRUNCATE commercial_accounts CASCADE"), TRUNCATE_REJECTED);
  });

  it("freezes business_id, settlement_market, commercial_effective_from and created_at", async () => {
    const { businessId } = await openAccount();
    for (const set of [
      "settlement_market = 'RW'",
      "commercial_effective_from = now()",
      "created_at = now() + interval '1 day'",
      "business_id = 'other'",
    ]) {
      await expectPgFailure(
        pool.query(`UPDATE commercial_accounts SET ${set} WHERE business_id = $1`, [businessId]),
        /immutable/,
        "23001",
      );
    }
  });

  it("enforces the account version invariant: counters move only with version +1; version never moves alone", async () => {
    const { businessId } = await openAccount();
    await expectPgFailure(
      pool.query("UPDATE commercial_accounts SET paid_balance_units = 5 WHERE business_id = $1", [
        businessId,
      ]),
      /version must advance by exactly 1/,
      "40001",
    );
    await expectPgFailure(
      pool.query(
        "UPDATE commercial_accounts SET paid_balance_units = 5, version = version + 2 WHERE business_id = $1",
        [businessId],
      ),
      /version must advance by exactly 1/,
      "40001",
    );
    await expectPgFailure(
      pool.query("UPDATE commercial_accounts SET version = version + 1 WHERE business_id = $1", [
        businessId,
      ]),
      /only change together with the counters/,
      "23001",
    );
  });

  it("refuses to commit an account edit that has no matching ledger entry (ledger is the authority)", async () => {
    const { businessId } = await openAccount();
    await expectPgFailure(
      pool.query(
        "UPDATE commercial_accounts SET paid_balance_units = 5, version = version + 1 WHERE business_id = $1",
        [businessId],
      ),
      /no ledger entries|do not equal its latest ledger entry/,
      "23000",
    );
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(0);
  });

  it("compare-and-set counter update returns null for a stale version", async () => {
    const { businessId } = await openAccount();
    await post(entry(businessId));
    const stale = await withPlatformTransaction(pool, async (tx) => {
      await lockCommercialAccount(tx, businessId);
      return updateAccountCounters(tx, businessId, 0, {
        trialRemainingUnits: 0,
        paidBalanceUnits: 9,
        trialReservedUnits: 0,
        paidReservedUnits: 0,
      });
    });
    expect(stale).toBeNull();
  });

  it("stores restriction and a set-once paid-activation timestamp without moving the version", async () => {
    const { businessId } = await openAccount();
    const restricted = await withPlatformTransaction(pool, (tx) =>
      updateAccountAdministrativeState(tx, businessId, { serviceRestriction: "restricted" }),
    );
    expect(restricted).toMatchObject({ serviceRestriction: "restricted", version: 0 });

    const activatedAt = new Date("2026-05-05T10:00:00Z");
    const activated = await withPlatformTransaction(pool, (tx) =>
      updateAccountAdministrativeState(tx, businessId, { paidServiceActivatedAt: activatedAt }),
    );
    expect(activated?.paidServiceActivatedAt?.toISOString()).toBe(activatedAt.toISOString());
    expect(activated?.serviceRestriction).toBe("restricted");

    await expectPgFailure(
      pool.query(
        "UPDATE commercial_accounts SET paid_service_activated_at = now() + interval '1 day' WHERE business_id = $1",
        [businessId],
      ),
      /set-once/,
      "23001",
    );
    await expectPgFailure(
      pool.query(
        "UPDATE commercial_accounts SET paid_service_activated_at = NULL WHERE business_id = $1",
        [businessId],
      ),
      /set-once/,
      "23001",
    );
  });
});

// ---------------------------------------------------------------------------
describe("commercial_ledger_entries: authority, immutability, ordering", () => {
  it("appends in deterministic per-Business order and keeps the account equal to the ledger", async () => {
    const { businessId } = await openAccount();
    const other = (await openAccount()).businessId;
    await post(entry(businessId, { entryType: "trial_grant", bucket: "trial", unitsDelta: 3 }));
    await post(entry(other, { unitsDelta: 100 }));
    await post(entry(businessId, { entryType: "credit_grant", unitsDelta: 10 }));
    await post(entry(businessId, { entryType: "consumption", unitsDelta: -1 }));

    const ledger = await listLedgerEntries(pool, businessId);
    expect(ledger.map((e) => e.accountVersion)).toEqual([1, 2, 3]);
    expect(ledger.map((e) => e.entryType)).toEqual(["trial_grant", "credit_grant", "consumption"]);
    expect(ledger[2]).toMatchObject({ trialAfter: 3, paidAfter: 9, createdBy: "admin-test" });

    const account = await getCommercialAccount(pool, businessId);
    const totals = await sumLedger(pool, businessId);
    expect(account).toMatchObject({ version: 3, trialRemainingUnits: 3, paidBalanceUnits: 9 });
    expect(totals).toMatchObject({
      trialRemainingUnits: account?.trialRemainingUnits,
      paidBalanceUnits: account?.paidBalanceUnits,
      trialReservedUnits: account?.trialReservedUnits,
      paidReservedUnits: account?.paidReservedUnits,
      latestVersion: account?.version,
    });
    // The other Business is untouched (Business-scoped).
    expect((await getCommercialAccount(pool, other))?.paidBalanceUnits).toBe(100);
  });

  it("rejects UPDATE, DELETE and TRUNCATE on the ledger", async () => {
    const { businessId } = await openAccount();
    await post(entry(businessId));
    await expectPgFailure(
      pool.query("UPDATE commercial_ledger_entries SET units_delta = 99 WHERE business_id = $1", [
        businessId,
      ]),
      /append-only and immutable/,
      "23001",
    );
    await expectPgFailure(
      pool.query("UPDATE commercial_ledger_entries SET reason_text = 'x' WHERE business_id = $1", [
        businessId,
      ]),
      /append-only and immutable/,
      "23001",
    );
    await expectPgFailure(
      pool.query("DELETE FROM commercial_ledger_entries WHERE business_id = $1", [businessId]),
      /append-only and immutable/,
      "23001",
    );
    await expectPgFailure(pool.query("TRUNCATE commercial_ledger_entries"), TRUNCATE_REJECTED);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
  });

  it("rejects a ledger entry for a Business with no account (Business/account mismatch) at the FK", async () => {
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_ledger_entries
           (business_id, account_version, entry_type, bucket, units_delta, trial_after, paid_after,
            trial_reserved_after, paid_reserved_after, idempotency_scope_key, created_by, correlation_id)
         VALUES ($1, 1, 'credit_grant', 'paid', 1, 0, 1, 0, 0, $2, 'a', 'c')`,
        [newBusiness(), `scope-${randomUUID()}`],
      ),
      /foreign key/i,
      "23503",
    );
  });

  it("the service rejects posting to a Business with no account", async () => {
    await expect(post(entry(newBusiness()))).rejects.toMatchObject({
      name: "CommercialDomainError",
      category: "RESOURCE_NOT_FOUND",
    });
  });

  it("refuses to commit a ledger entry whose counters do not match the account (no account update / wrong Business state)", async () => {
    const a = (await openAccount()).businessId;
    const b = (await openAccount()).businessId;
    await post(entry(b, { unitsDelta: 50 }));
    // Append for A with B's counters and no account update: rejected at commit.
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_ledger_entries
           (business_id, account_version, entry_type, bucket, units_delta, trial_after, paid_after,
            trial_reserved_after, paid_reserved_after, idempotency_scope_key, created_by, correlation_id)
         VALUES ($1, 1, 'credit_grant', 'paid', 50, 0, 50, 0, 0, $2, 'a', 'c')`,
        [a, `scope-${randomUUID()}`],
      ),
      /do not equal its latest ledger entry/,
      "23000",
    );
    expect(await listLedgerEntries(pool, a)).toHaveLength(0);
  });

  it("enforces idempotent scope: a repeat writes nothing and returns the original; a raw duplicate is a unique violation", async () => {
    const { businessId } = await openAccount();
    const input = entry(businessId, { unitsDelta: 4 });
    const first = await post(input);
    const second = await post(input);
    expect(first.outcome).toBe("posted");
    expect(second.outcome).toBe("replayed");
    expect(second.entry.id).toBe(first.entry.id);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(4);

    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_ledger_entries
           (business_id, account_version, entry_type, bucket, units_delta, trial_after, paid_after,
            trial_reserved_after, paid_reserved_after, idempotency_scope_key, created_by, correlation_id)
         VALUES ($1, 2, 'credit_grant', 'paid', 1, 0, 5, 0, 0, $2, 'a', 'c')`,
        [businessId, input.idempotencyScopeKey],
      ),
      /idempotency_scope_unique/,
      "23505",
    );
  });

  it("rejects reusing a scope key that belongs to a different Business", async () => {
    const a = (await openAccount()).businessId;
    const b = (await openAccount()).businessId;
    const input = entry(a);
    await post(input);
    await expect(post({ ...input, businessId: b })).rejects.toBeInstanceOf(CommercialDomainError);
    expect(await listLedgerEntries(pool, b)).toHaveLength(0);
  });

  it("under concurrent contention, a scope key shared by two Businesses posts for exactly one and never replays a foreign entry", async () => {
    const a = (await openAccount()).businessId;
    const b = (await openAccount()).businessId;
    const shared = `scope-${randomUUID()}`;
    const results = await Promise.allSettled([
      post(entry(a, { idempotencyScopeKey: shared })),
      post(entry(b, { idempotencyScopeKey: shared })),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(CommercialDomainError);
    const winnerBusiness = (
      fulfilled[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof post>>>
    ).value.entry.businessId;
    const loser = winnerBusiness === a ? b : a;
    expect(await listLedgerEntries(pool, loser)).toEqual([]);
    expect(await listLedgerEntries(pool, winnerBusiness)).toHaveLength(1);
  });

  it("rejects duplicate (Business, account_version) and malformed entry shapes", async () => {
    const { businessId } = await openAccount();
    await post(entry(businessId));
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_ledger_entries
           (business_id, account_version, entry_type, bucket, units_delta, trial_after, paid_after,
            trial_reserved_after, paid_reserved_after, idempotency_scope_key, created_by, correlation_id)
         VALUES ($1, 1, 'credit_grant', 'paid', 1, 0, 2, 0, 0, $2, 'a', 'c')`,
        [businessId, `scope-${randomUUID()}`],
      ),
      /business_version_unique/,
      "23505",
    );
    // trial entry types must use the trial bucket; consumption is exactly one unit; unknown types refused.
    for (const [type, bucket, delta] of [
      ["trial_grant", "paid", 3],
      ["credit_grant", "trial", 3],
      ["consumption", "paid", -2],
      ["credit_grant", "paid", -1],
      ["not_a_type", "paid", 1],
    ] as const) {
      await expectPgFailure(
        pool.query(
          `INSERT INTO commercial_ledger_entries
             (business_id, account_version, entry_type, bucket, units_delta, trial_after, paid_after,
              trial_reserved_after, paid_reserved_after, idempotency_scope_key, created_by, correlation_id)
           VALUES ($1, 2, $2, $3, $4, 0, 0, 0, 0, $5, 'a', 'c')`,
          [businessId, type, bucket, delta, `scope-${randomUUID()}`],
        ),
        /check constraint/i,
        "23514",
      );
    }
  });

  it("requires source references as a pair and stores soft provenance without any FK", async () => {
    const { businessId } = await openAccount();
    const posted = await post(
      entry(businessId, { sourceReference: { type: "settlement", id: "ext-ref-1" } }),
    );
    expect(posted.entry).toMatchObject({
      sourceReferenceType: "settlement",
      sourceReferenceId: "ext-ref-1",
    });
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_ledger_entries
           (business_id, account_version, entry_type, bucket, units_delta, trial_after, paid_after,
            trial_reserved_after, paid_reserved_after, idempotency_scope_key, created_by, correlation_id,
            source_reference_type)
         VALUES ($1, 2, 'credit_grant', 'paid', 1, 0, 2, 0, 0, $2, 'a', 'c', 'settlement')`,
        [businessId, `scope-${randomUUID()}`],
      ),
      /source_reference_pair/,
      "23514",
    );
  });

  it("serialises concurrent appends under the account lock: gap-free versions, no lost update", async () => {
    const { businessId } = await openAccount();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => post(entry(businessId, { unitsDelta: 1 }))),
    );
    expect(results.every((r) => r.outcome === "posted")).toBe(true);
    const ledger = await listLedgerEntries(pool, businessId);
    expect(ledger.map((e) => e.accountVersion)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(ledger.map((e) => e.paidAfter)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      version: 8,
      paidBalanceUnits: 8,
    });
  });

  it("concurrent replays of the same scope key post exactly once", async () => {
    const { businessId } = await openAccount();
    const input = entry(businessId, { unitsDelta: 2 });
    const results = await Promise.all([post(input), post(input), post(input)]);
    expect(results.filter((r) => r.outcome === "posted")).toHaveLength(1);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(2);
  });
});

// ---------------------------------------------------------------------------
describe("balances: negative credit and trial semantics", () => {
  it("represents negative paid balance with no floor and no maximum, and available capacity goes negative", async () => {
    const { businessId } = await openAccount();
    await post(entry(businessId, { unitsDelta: -5 }));
    await post(entry(businessId, { entryType: "consumption", unitsDelta: -1 }));
    await post(entry(businessId, { unitsDelta: -1_000_000 }));
    const account = await getCommercialAccount(pool, businessId);
    expect(account?.paidBalanceUnits).toBe(-1_000_006);
    expect(account && availableCapacity(account)).toBe(-1_000_006);
    const ledger = await listLedgerEntries(pool, businessId);
    expect(ledger[0].paidAfter).toBe(-5);
  });

  it("recovers from negative through a later credit without rewriting history", async () => {
    const { businessId } = await openAccount();
    await post(entry(businessId, { unitsDelta: -3 }));
    await post(entry(businessId, { entryType: "credit_grant", unitsDelta: 10 }));
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(7);
    expect((await listLedgerEntries(pool, businessId)).map((e) => e.paidAfter)).toEqual([-3, 7]);
  });

  it("does NOT turn the governed 3-5 initial-grant rule into an account-level default or ceiling", async () => {
    // The 3-5 rule is a property of the (future) grant command, not of the account or ledger:
    // 1, 4 and 50 are all representable at the foundation layer, and a brand-new account holds 0.
    const { businessId } = await openAccount();
    expect((await getCommercialAccount(pool, businessId))?.trialRemainingUnits).toBe(0);
    for (const units of [1, 4, 50]) {
      await post(
        entry(businessId, { entryType: "trial_grant", bucket: "trial", unitsDelta: units }),
      );
    }
    expect((await getCommercialAccount(pool, businessId))?.trialRemainingUnits).toBe(55);
    // Downward trial adjustment is representable too (attributable act; no ceiling encoded either way).
    await post(
      entry(businessId, { entryType: "trial_adjustment", bucket: "trial", unitsDelta: -10 }),
    );
    expect((await getCommercialAccount(pool, businessId))?.trialRemainingUnits).toBe(45);
  });

  it("keeps only integrity bounds: trial cannot go below zero or below the trial capacity reserved against it; reserved never negative", async () => {
    const { businessId } = await openAccount();
    await post(entry(businessId, { entryType: "trial_grant", bucket: "trial", unitsDelta: 3 }));
    await post(
      entry(businessId, {
        entryType: "capacity_reserved",
        bucket: "trial",
        unitsDelta: 0,
        trialReservedDelta: 2,
      }),
    );
    await expect(
      post(entry(businessId, { entryType: "trial_adjustment", bucket: "trial", unitsDelta: -2 })),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
    await expect(
      post(
        entry(businessId, {
          entryType: "capacity_released",
          bucket: "trial",
          unitsDelta: 0,
          trialReservedDelta: -3,
        }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
    // Adjusting down within the uncommitted trial remains allowed.
    await post(
      entry(businessId, { entryType: "trial_adjustment", bucket: "trial", unitsDelta: -1 }),
    );
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      trialRemainingUnits: 2,
      trialReservedUnits: 2,
    });
    // Nothing failed above may have left a ledger residue.
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(3);
  });

  it("can represent a reservation converting to consumption from the earmarked bucket (INV-CAP-PROV compatibility, no policy implemented)", async () => {
    const { businessId } = await openAccount();
    await post(entry(businessId, { entryType: "trial_grant", bucket: "trial", unitsDelta: 3 }));
    await post(entry(businessId, { entryType: "credit_grant", unitsDelta: 1 }));
    // Reserve one trial-earmarked and one paid-earmarked position (two entries: bucket provenance per position).
    await post(
      entry(businessId, {
        entryType: "capacity_reserved",
        bucket: "trial",
        unitsDelta: 0,
        trialReservedDelta: 1,
      }),
    );
    await post(
      entry(businessId, {
        entryType: "capacity_reserved",
        bucket: "paid",
        unitsDelta: 0,
        paidReservedDelta: 1,
      }),
    );
    // Consume the paid-earmarked one: debit + release on the SAME bucket, atomically.
    await post(
      entry(businessId, {
        entryType: "consumption",
        bucket: "paid",
        unitsDelta: -1,
        paidReservedDelta: -1,
      }),
    );
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      trialRemainingUnits: 3,
      paidBalanceUnits: 0,
      trialReservedUnits: 1,
      paidReservedUnits: 0,
    });
    // Consumption may not release a reservation on the OTHER bucket.
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_ledger_entries
           (business_id, account_version, entry_type, bucket, units_delta, trial_reserved_delta,
            trial_after, paid_after, trial_reserved_after, paid_reserved_after, idempotency_scope_key, created_by, correlation_id)
         VALUES ($1, 6, 'consumption', 'paid', -1, -1, 3, -1, 0, 0, $2, 'a', 'c')`,
        [businessId, `scope-${randomUUID()}`],
      ),
      /check constraint/i,
      "23514",
    );
  });
});

// ---------------------------------------------------------------------------
describe("commercial_price_schedules (TEST-ONLY fixture values)", () => {
  // TEST-ONLY: fixture prices for schema behaviour. NOT BIF/RWF launch prices.
  const T = (iso: string) => new Date(iso);
  const base = {
    createdBy: "admin-test",
    reasonText: "test-only fixture",
    correlationId: "corr-test",
  } as const;

  it("is empty until an administrator sets a price: no effective schedule exists for either market", async () => {
    // Run against the freshly migrated (unseeded) table; fixtures below are inserted after.
    for (const market of ["BI", "RW"] as const) {
      expect(await getEffectivePriceSchedule(pool, market, new Date())).toBeNull();
      expect(await listPriceSchedules(pool, market)).toEqual([]);
    }
  });

  it("stores effective-dated BIF and RWF schedules on the USD 2 basis and resolves the one in force", async () => {
    const first = await withPlatformTransaction(pool, (tx) =>
      insertPriceSchedule(tx, {
        ...base,
        market: "BI",
        localUnitPriceMinor: 7,
        effectiveFrom: T("2030-01-01T00:00:00Z"),
      }),
    );
    const second = await withPlatformTransaction(pool, (tx) =>
      insertPriceSchedule(tx, {
        ...base,
        market: "BI",
        localUnitPriceMinor: 9,
        effectiveFrom: T("2030-06-01T00:00:00Z"),
        rateNote: "test",
      }),
    );
    const rw = await withPlatformTransaction(pool, (tx) =>
      insertPriceSchedule(tx, {
        ...base,
        market: "RW",
        localUnitPriceMinor: 13,
        effectiveFrom: T("2030-01-01T00:00:00Z"),
      }),
    );
    expect(first).toMatchObject({ market: "BI", currency: "BIF", usdEquivalentMinor: 200 });
    expect(rw).toMatchObject({ market: "RW", currency: "RWF", usdEquivalentMinor: 200 });

    expect(await getEffectivePriceSchedule(pool, "BI", T("2029-12-31T23:59:59Z"))).toBeNull();
    expect((await getEffectivePriceSchedule(pool, "BI", T("2030-03-01T00:00:00Z")))?.id).toBe(
      first.id,
    );
    expect((await getEffectivePriceSchedule(pool, "BI", T("2030-06-01T00:00:00Z")))?.id).toBe(
      second.id,
    );
    expect(
      (await getEffectivePriceSchedule(pool, "BI", T("2035-01-01T00:00:00Z")))?.localUnitPriceMinor,
    ).toBe(9);
    expect((await getEffectivePriceSchedule(pool, "RW", T("2035-01-01T00:00:00Z")))?.id).toBe(
      rw.id,
    );
    // Historic schedule rows remain intact and ordered (immutable history, no live FX).
    expect((await listPriceSchedules(pool, "BI")).map((p) => p.localUnitPriceMinor)).toEqual([
      7, 9,
    ]);
  });

  it("enforces non-overlapping, strictly monotonic versioning per market", async () => {
    const insert = (market: "BI" | "RW", iso: string) =>
      withPlatformTransaction(pool, (tx) =>
        insertPriceSchedule(tx, { ...base, market, localUnitPriceMinor: 5, effectiveFrom: T(iso) }),
      );
    await insert("RW", "2031-01-01T00:00:00Z");
    await expectPgFailure(
      insert("RW", "2031-01-01T00:00:00Z"),
      /not after the latest existing schedule/,
    );
    await expectPgFailure(
      insert("RW", "2030-12-31T00:00:00Z"),
      /not after the latest existing schedule/,
      "23514",
    );
    await insert("RW", "2031-01-02T00:00:00Z");
    // A different market has its own independent timeline.
    await insert("BI", "2031-01-01T00:00:00Z");
  });

  it("rejects unsupported currencies and markets, and market/currency mismatches, at the database", async () => {
    const raw = (market: string, currency: string) =>
      pool.query(
        `INSERT INTO commercial_price_schedules
           (market, currency, usd_equivalent_minor, local_unit_price_minor, effective_from, created_by, reason_text, correlation_id)
         VALUES ($1, $2, 200, 5, '2040-01-01T00:00:00Z', 'a', 'r', 'c')`,
        [market, currency],
      );
    await expectPgFailure(raw("BI", "USD"), /currency/, "23514");
    await expectPgFailure(raw("BI", "KES"), /currency/, "23514");
    await expectPgFailure(raw("KE", "BIF"), /market/, "23514");
    await expectPgFailure(raw("BI", "RWF"), /market_currency/, "23514");
    await expectPgFailure(raw("RW", "BIF"), /market_currency/, "23514");
  });

  it("validates the canonical USD 2 basis and a positive whole local price in the command layer", async () => {
    const attempt = (over: Partial<Parameters<typeof insertPriceSchedule>[1]>) =>
      withPlatformTransaction(pool, (tx) =>
        insertPriceSchedule(tx, {
          ...base,
          market: "BI",
          localUnitPriceMinor: 5,
          effectiveFrom: T("2050-01-01T00:00:00Z"),
          ...over,
        }),
      );
    await expect(attempt({ usdEquivalentMinor: 300 })).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
    await expect(attempt({ localUnitPriceMinor: 0 })).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
    await expect(attempt({ localUnitPriceMinor: -4 })).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
    await expect(attempt({ localUnitPriceMinor: 1.5 })).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
    await expect(attempt({ market: "KE" as unknown as "BI" })).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
    await expectPgFailure(attempt({ reasonText: "   " }), /reason_text/, "23514");
  });

  it("makes schedule rows immutable (UPDATE, DELETE, TRUNCATE rejected)", async () => {
    const row = await withPlatformTransaction(pool, (tx) =>
      insertPriceSchedule(tx, {
        ...base,
        market: "BI",
        localUnitPriceMinor: 5,
        effectiveFrom: T("2060-01-01T00:00:00Z"),
      }),
    );
    await expectPgFailure(
      pool.query("UPDATE commercial_price_schedules SET local_unit_price_minor = 1 WHERE id = $1", [
        row.id,
      ]),
      /append-only and immutable/,
      "23001",
    );
    await expectPgFailure(
      pool.query("DELETE FROM commercial_price_schedules WHERE id = $1", [row.id]),
      /append-only and immutable/,
      "23001",
    );
    await expectPgFailure(pool.query("TRUNCATE commercial_price_schedules"), TRUNCATE_REJECTED);
  });
});

// ---------------------------------------------------------------------------
describe("commercial_audit_events and commercial_standing_events", () => {
  it("records WHO/WHAT/WHICH BUSINESS/WHEN/WHY/REFERENCE/RESULT atomically with the ledger mutation", async () => {
    const { businessId } = await openAccount();
    const key = newKey();
    await withPlatformTransaction(pool, async (tx) => {
      const { entry: e } = await postCommercialLedgerEntry(
        tx,
        entry(businessId, { unitsDelta: 5 }),
      );
      await appendCommercialAuditEvent(tx, {
        actor: { type: "platform_administrator", id: "founder-uid" },
        actionType: "credit_adjusted",
        targetType: "commercial_account",
        targetId: businessId,
        businessId,
        reasonCode: "correction",
        reasonText: "Recorded offline payment reconciliation",
        reference: "REF-123",
        correlationId: "corr-1",
        idempotencyKey: key,
        result: "succeeded",
        beforeSnapshot: { paidBalanceUnits: 0 },
        afterSnapshot: { paidBalanceUnits: 5 },
        ledgerEntryId: e.id,
      });
    });
    const [audit] = await listCommercialAuditEventsForBusiness(pool, businessId);
    expect(audit).toMatchObject({
      actorType: "platform_administrator",
      actorId: "founder-uid",
      actionType: "credit_adjusted",
      targetType: "commercial_account",
      targetId: businessId,
      businessId,
      reasonCode: "correction",
      reasonText: "Recorded offline payment reconciliation",
      reference: "REF-123",
      result: "succeeded",
      beforeSnapshot: { paidBalanceUnits: 0 },
      afterSnapshot: { paidBalanceUnits: 5 },
      idempotencyKey: key,
    });
    expect(audit.occurredAt).toBeInstanceOf(Date);
    expect(audit.ledgerEntryId).not.toBeNull();
  });

  it("rolls the audit row back together with a failed mutation (no audit without effect)", async () => {
    const { businessId } = await openAccount();
    await expect(
      withPlatformTransaction(pool, async (tx) => {
        await postCommercialLedgerEntry(tx, entry(businessId, { unitsDelta: 5 }));
        await appendCommercialAuditEvent(tx, {
          actor: { type: "system", id: "system:commercial-test" },
          actionType: "credit_adjusted",
          targetType: "commercial_account",
          targetId: businessId,
          businessId,
          reasonText: "will roll back",
          correlationId: "c",
          result: "succeeded",
        });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await listCommercialAuditEventsForBusiness(pool, businessId)).toEqual([]);
    expect(await listLedgerEntries(pool, businessId)).toEqual([]);
    expect((await getCommercialAccount(pool, businessId))?.version).toBe(0);
  });

  it("de-duplicates a replayed (idempotency key, action) and rejects malformed audit input", async () => {
    const { businessId } = await openAccount();
    const key = newKey();
    const params = {
      actor: { type: "platform_administrator", id: "founder-uid" } as const,
      actionType: "service_restricted" as const,
      targetType: "commercial_account",
      targetId: businessId,
      businessId,
      reasonText: "restrict",
      correlationId: "c",
      idempotencyKey: key,
      result: "succeeded" as const,
    };
    const first = await withPlatformTransaction(pool, (tx) =>
      appendCommercialAuditEvent(tx, params),
    );
    const replay = await withPlatformTransaction(pool, (tx) =>
      appendCommercialAuditEvent(tx, params),
    );
    expect(first).not.toBeNull();
    expect(replay).toBeNull();
    expect(await listCommercialAuditEventsForBusiness(pool, businessId)).toHaveLength(1);

    await expect(
      withPlatformTransaction(pool, (tx) =>
        appendCommercialAuditEvent(tx, {
          ...params,
          actionType: "grant_free_units" as never,
          idempotencyKey: undefined,
        }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
    await expectPgFailure(
      withPlatformTransaction(pool, (tx) =>
        appendCommercialAuditEvent(tx, { ...params, reasonText: "  ", idempotencyKey: undefined }),
      ),
      /reason_text/,
      "23514",
    );
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_audit_events (actor_type, actor_id, action_type, target_type, target_id, business_id, reason_text, correlation_id, result)
         VALUES ('customer', 'x', 'service_restricted', 't', 'i', 'b', 'r', 'c', 'succeeded')`,
      ),
      /actor_type/,
      "23514",
    );
  });

  it("rejects UPDATE, DELETE and TRUNCATE on audit and standing events", async () => {
    const { businessId } = await openAccount();
    await withPlatformTransaction(pool, async (tx) => {
      await appendCommercialAuditEvent(tx, {
        actor: { type: "system", id: "system:commercial-test" },
        actionType: "account_opened",
        targetType: "commercial_account",
        targetId: businessId,
        businessId,
        reasonText: "opened",
        correlationId: "c",
        result: "succeeded",
      });
      await insertStandingEvent(tx, {
        businessId,
        eventType: "account_opened",
        actorId: "founder-uid",
        reasonText: "opened",
        idempotencyScopeKey: `standing-${randomUUID()}`,
        correlationId: "c",
      });
    });
    for (const table of ["commercial_audit_events", "commercial_standing_events"]) {
      await expectPgFailure(
        pool.query(`UPDATE ${table} SET reason_text = 'tampered' WHERE business_id = $1`, [
          businessId,
        ]),
        /append-only and immutable/,
        "23001",
      );
      await expectPgFailure(
        pool.query(`DELETE FROM ${table} WHERE business_id = $1`, [businessId]),
        /append-only and immutable/,
        "23001",
      );
      await expectPgFailure(pool.query(`TRUNCATE ${table}`), TRUNCATE_REJECTED);
    }
    expect(await listStandingEvents(pool, businessId)).toHaveLength(1);
    expect(await listCommercialAuditEventsForBusiness(pool, businessId)).toHaveLength(1);
  });

  it("makes standing events idempotent per scope key and Business-bound", async () => {
    const { businessId } = await openAccount();
    const scope = `standing-${randomUUID()}`;
    const params = {
      businessId,
      eventType: "service_restricted" as const,
      actorId: "founder-uid",
      reasonText: "r",
      idempotencyScopeKey: scope,
      correlationId: "c",
    };
    expect(
      await withPlatformTransaction(pool, (tx) => insertStandingEvent(tx, params)),
    ).not.toBeNull();
    expect(await withPlatformTransaction(pool, (tx) => insertStandingEvent(tx, params))).toBeNull();
    await expectPgFailure(
      withPlatformTransaction(pool, (tx) =>
        insertStandingEvent(tx, {
          ...params,
          businessId: newBusiness(),
          idempotencyScopeKey: `s-${randomUUID()}`,
        }),
      ),
      /foreign key/i,
      "23503",
    );
  });
});

// ---------------------------------------------------------------------------
describe("idempotency integration (existing idempotency_keys infrastructure)", () => {
  const baseParams = (key: string, hash = "hash-a") => ({
    idempotencyKey: key,
    commandType: "adjustCommercialCredit",
    actorId: "founder-uid",
    requestHash: hash,
    correlationId: "corr-test",
  });

  async function keyRow(key: string) {
    const r = await pool.query(
      "SELECT status, operation_type, actor_id, response_snapshot FROM idempotency_keys WHERE idempotency_key = $1",
      [key],
    );
    return r.rows[0] as
      | { status: string; operation_type: string; actor_id: string; response_snapshot: unknown }
      | undefined;
  }

  it("executes once, completes the key in the same transaction, and replays the stored result for a duplicate", async () => {
    const { businessId } = await openAccount();
    const key = newKey();
    const body = async (tx: Parameters<Parameters<typeof runCommercialCommand>[2]>[0]) => {
      const posted = await postCommercialLedgerEntry(
        tx,
        entry(businessId, { unitsDelta: 3, idempotencyScopeKey: `cmd:${key}:1` }),
      );
      return {
        result: { entryId: posted.entry.id, paidAfter: posted.entry.paidAfter },
        resultReference: posted.entry.id,
      };
    };
    const first = await runCommercialCommand(pool, baseParams(key), body);
    expect(first.outcome).toBe("executed");
    const row = await keyRow(key);
    expect(row).toMatchObject({
      status: "completed",
      operation_type: "commercial.adjustCommercialCredit",
      actor_id: "founder-uid",
    });

    const second = await runCommercialCommand(pool, baseParams(key), body);
    expect(second).toEqual({
      outcome: "duplicate",
      responseSnapshot: (first as { result: unknown }).result,
    });
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);
  });

  it("reports a conflict when the same key is reused with a different request, and does not run the body", async () => {
    const key = newKey();
    await runCommercialCommand(pool, baseParams(key), async () => ({ result: { ok: true } }));
    let ran = false;
    const conflict = await runCommercialCommand(pool, baseParams(key, "hash-b"), async () => {
      ran = true;
      return { result: { ok: true } };
    });
    expect(conflict).toEqual({ outcome: "conflict" });
    expect(ran).toBe(false);
  });

  it("treats the same key and payload hash reused for a different command or administrator as a conflict, never a replay", async () => {
    const key = newKey();
    await runCommercialCommand(pool, baseParams(key), async () => ({ result: { first: true } }));
    let ran = 0;
    const body = async () => {
      ran += 1;
      return { result: {} };
    };
    const otherCommand = await runCommercialCommand(
      pool,
      { ...baseParams(key), commandType: "grantTrial" },
      body,
    );
    const otherActor = await runCommercialCommand(
      pool,
      { ...baseParams(key), actorId: "someone-else" },
      body,
    );
    expect(otherCommand).toEqual({ outcome: "conflict" });
    expect(otherActor).toEqual({ outcome: "conflict" });
    expect(ran).toBe(0);
  });

  it("rollback removes the in-progress reservation; the failed attempt leaves no key, ledger, audit or account change and the key is reusable", async () => {
    const { businessId } = await openAccount();
    const key = newKey();
    await expect(
      runCommercialCommand(pool, baseParams(key), async (tx) => {
        await postCommercialLedgerEntry(
          tx,
          entry(businessId, { unitsDelta: 3, idempotencyScopeKey: `cmd:${key}:1` }),
        );
        await appendCommercialAuditEvent(tx, {
          actor: { type: "platform_administrator", id: "founder-uid" },
          actionType: "credit_adjusted",
          targetType: "commercial_account",
          targetId: businessId,
          businessId,
          reasonText: "will fail",
          correlationId: "c",
          idempotencyKey: key,
          result: "succeeded",
        });
        throw new Error("mutation failed after partial work");
      }),
    ).rejects.toThrow("mutation failed after partial work");

    expect(await keyRow(key)).toBeUndefined(); // not 'processing', not 'completed'
    expect(await listLedgerEntries(pool, businessId)).toEqual([]);
    expect(await listCommercialAuditEventsForBusiness(pool, businessId)).toEqual([]);
    expect((await getCommercialAccount(pool, businessId))?.version).toBe(0);

    const retry = await runCommercialCommand(pool, baseParams(key), async (tx) => {
      const posted = await postCommercialLedgerEntry(
        tx,
        entry(businessId, { unitsDelta: 3, idempotencyScopeKey: `cmd:${key}:1` }),
      );
      return { result: { entryId: posted.entry.id } };
    });
    expect(retry.outcome).toBe("executed");
    expect((await keyRow(key))?.status).toBe("completed");
  });

  it("never completes the key when the database rejects the mutation (constraint failure path)", async () => {
    const key = newKey();
    await expect(
      runCommercialCommand(pool, baseParams(key), async (tx) => {
        // No account for this Business => the service throws inside the body.
        await postCommercialLedgerEntry(tx, entry(newBusiness()));
        return { result: {} };
      }),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
    expect(await keyRow(key)).toBeUndefined();
  });

  it("concurrent duplicates run the body exactly once; the loser sees the completed result", async () => {
    const { businessId } = await openAccount();
    const key = newKey();
    let runs = 0;
    const run = () =>
      runCommercialCommand(pool, baseParams(key), async (tx) => {
        runs += 1;
        const posted = await postCommercialLedgerEntry(
          tx,
          entry(businessId, { unitsDelta: 1, idempotencyScopeKey: `cmd:${key}:1` }),
        );
        return { result: { entryId: posted.entry.id } };
      });
    const [a, b] = await Promise.all([run(), run()]);
    expect([a.outcome, b.outcome].sort()).toEqual(["duplicate", "executed"]);
    expect(runs).toBe(1);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
  });
});
