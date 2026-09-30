/**
 * WP-COM-04 — Commercial consumption projection: real PostgreSQL tests.
 *
 *   PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *     npx vitest run --config vitest.postgres.config.ts commercialConsumption
 *
 * Same isolation model as the other Commercial suites: Commercial rows are
 * immutable, so each test uses its own Business id and the file drops the
 * Commercial objects before and after.
 *
 * Loyalty rows (Reward Program -> Version -> Stream -> Cycle -> Reward) are
 * seeded with raw SQL FIXTURES ONLY. The code under test never writes them;
 * that is asserted (row-hash + xmin) in the BOUNDARY section. Price values are
 * TEST-ONLY fixtures, not launch prices.
 *
 * Lock-order and crash tests are deterministic: every "wait" is a guaranteed
 * lock block observed in `pg_stat_activity`, never a sleep-and-hope.
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
  type PoolClient,
} from "../../infrastructure/postgres/postgresPool";
import { migrateUp } from "../../infrastructure/postgres/migrationRunner";
import { withPlatformTransaction } from "../../infrastructure/postgres/postgresTransaction";
import {
  getCommercialAccount,
  insertCommercialAccount,
  lockCommercialAccount,
} from "./repositories/commercialAccountRepository";
import { listLedgerEntries, sumLedger } from "./repositories/commercialLedgerRepository";
import { listCommercialAuditEventsForBusiness } from "./repositories/commercialAuditRepository";
import {
  getConsumptionEventByCycle,
  listConsumptionEventsForBusiness,
} from "./repositories/commercialConsumptionRepository";
import { listUnprojectedRewardSources } from "./repositories/commercialRewardSourceRepository";
import { postCommercialLedgerEntry } from "./services/postCommercialLedgerEntry";
import { projectCommercialConsumption } from "./services/projectCommercialConsumption";
import {
  getConsumptionProjectionMetrics,
  reconcileCommercialConsumption,
} from "./services/reconcileCommercialConsumption";
import { setPriceSchedule } from "./services/setPriceSchedule";
import { adjustTrial } from "./services/adjustTrial";
import { adjustCommercialCredit } from "./services/adjustCommercialCredit";
import { recordSettlement } from "./services/recordSettlement";
import { confirmSettlement } from "./services/confirmSettlement";
import { voidSettlement } from "./services/voidSettlement";
import { restoreCommercialStanding, restrictNewStarts } from "./services/commercialRestriction";
import type {
  CommercialCommandContext,
  CommercialCommandDeps,
} from "./services/commercialAdministratorCommand";
import type { CommercialBucket, CommercialMarket } from "./models/commercialFoundation";
import type {
  ConsumptionEarmarkResolver,
  ProjectConsumptionResult,
} from "./models/commercialConsumption";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "..", "infrastructure", "postgres", "migrations");

let pool: PlatformPostgresPool;
let startedFromEmptyDatabase = false;

const COMMERCIAL_TABLES = [
  "commercial_projection_failures",
  "commercial_consumption_events",
  "commercial_consumption_claims",
  "commercial_trial_grants",
  "commercial_manual_adjustments",
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
  await pool.query("DROP INDEX IF EXISTS rewards_business_available_at_idx");
  for (const fn of [
    "commercial_consumption_claims_require_event",
    "commercial_consumption_events_ledger_guard",
    "commercial_consumption_claims_reward_business_guard",
    "commercial_trial_grants_guard",
    "commercial_manual_adjustments_guard",
    "commercial_settlements_update_guard",
    "commercial_ledger_reject_cancelled_settlement_reference",
    "commercial_settlements_insert_guard",
    "commercial_assert_account_matches_ledger",
    "commercial_price_schedules_versioning",
    "commercial_accounts_guard",
    "commercial_reject_mutation",
    "wpcom04_fail_consumption_audit",
  ]) {
    await pool.query(`DROP FUNCTION IF EXISTS ${fn}() CASCADE`);
  }
  const hasMigrations = await pool.query("SELECT to_regclass('public.schema_migrations') AS t");
  if (hasMigrations.rows[0].t !== null) {
    await pool.query(
      "DELETE FROM schema_migrations WHERE version IN ('0021', '0022', '0023', '0024', '0025')",
    );
    await pool
      .query("DELETE FROM idempotency_keys WHERE idempotency_key LIKE 'wpcom04-%'")
      .catch(() => {});
  }
}

/** Loyalty FIXTURE cleanup. Must run after the Commercial tables are gone (claims reference Rewards). */
async function dropLoyaltyFixtures(): Promise<void> {
  const present = await pool.query("SELECT to_regclass('public.rewards') AS t");
  if (present.rows[0].t === null) return; // pristine database: nothing to clean
  await pool.query("DELETE FROM rewards WHERE business_id LIKE 'wpcom04-%'");
  await pool.query("DELETE FROM loyalty_cycles WHERE business_id LIKE 'wpcom04-%'");
  await pool.query("DELETE FROM loyalty_cycle_streams WHERE business_id LIKE 'wpcom04-%'");
  await pool.query(
    "UPDATE reward_programs SET current_version_id = NULL WHERE business_id LIKE 'wpcom04-%'",
  );
  await pool.query(
    "DELETE FROM reward_program_versions WHERE reward_program_id IN (SELECT id FROM reward_programs WHERE business_id LIKE 'wpcom04-%')",
  );
  await pool.query("DELETE FROM reward_programs WHERE business_id LIKE 'wpcom04-%'");
}

beforeAll(async () => {
  if (!process.env.PLATFORM_POSTGRES_URL && process.env.PLATFORM_ENV !== "test") {
    throw new Error("This test requires a live PostgreSQL instance (PLATFORM_ENV=test).");
  }
  // Concurrency tests hold several connections at once (holders + projectors).
  pool = createPostgresPool({ ...loadPostgresConfig(), poolMax: 24 });
  // A backend terminated on purpose (crash simulation) emits a client 'error'; swallow it.
  pool.on("connect", (client) => client.on("error", () => undefined));
  const existing = await pool.query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'",
  );
  startedFromEmptyDatabase = existing.rows[0].n === 0;
  await dropCommercialObjects();
  await dropLoyaltyFixtures();
  await migrateUp(pool, migrationsDir);
  // TEST-ONLY BI schedule (effective 2026-03-01). RW deliberately has none.
  await setPriceSchedule({ ...d(), now: () => new Date("2026-02-01T00:00:00Z") }, ctx(), {
    market: "BI",
    currency: "BIF",
    localUnitPriceMinor: BI_PRICE,
    effectiveFrom: new Date("2026-03-01T00:00:00Z"),
    reasonText: "test fixture",
  });
}, 120000);

afterAll(async () => {
  await dropCommercialObjects();
  await dropLoyaltyFixtures();
  if (startedFromEmptyDatabase) {
    await pool.query("DROP SCHEMA public CASCADE");
    await pool.query("CREATE SCHEMA public");
  }
  await closePostgresPool(pool);
});

// ---------------------------------------------------------------------------
// Fixtures and helpers
// ---------------------------------------------------------------------------
const ts = (iso: string) => ({ toDate: () => new Date(iso) });
const ADMIN = "founder-uid";
const records: Record<string, unknown> = {
  [ADMIN]: {
    roles: ["knowledge_editor"],
    status: "active",
    mfaRequired: true,
    invitedBy: "founder",
    createdAt: ts("2026-01-01T00:00:00Z"),
    updatedAt: ts("2026-01-01T00:00:00Z"),
    schemaVersion: 1,
  },
};
const NOW = new Date("2026-07-01T00:00:00Z");
const BI_PRICE = 1000; // TEST-ONLY
const EFFECTIVE_FROM = new Date("2026-01-01T00:00:00Z");
const AVAILABLE_AT = new Date("2026-06-01T00:00:00Z");
const CORR = "corr-wpcom04";

const d = (): CommercialCommandDeps => ({
  pool,
  readAdministratorRecord: async (uid) => records[uid],
  now: () => NOW,
});
const ctx = (): CommercialCommandContext => ({
  adminUserId: ADMIN,
  verifiedMfaSatisfied: true,
  idempotencyKey: `wpcom04-${randomUUID()}`,
  correlationId: CORR,
});
const newBusiness = () => `wpcom04-${randomUUID()}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const count = async (sql: string, params: unknown[] = []) =>
  (await pool.query<{ n: number }>(sql, params)).rows[0].n;

async function openAccount(
  businessId = newBusiness(),
  opts: { market?: CommercialMarket; effectiveFrom?: Date } = {},
) {
  await withPlatformTransaction(pool, (tx) =>
    insertCommercialAccount(tx, {
      businessId,
      settlementMarket: opts.market ?? "BI",
      commercialEffectiveFrom: opts.effectiveFrom ?? EFFECTIVE_FROM,
      correlationId: "corr-test",
    }),
  );
  return businessId;
}

/** Direct ledger fixture entry (the sanctioned posting primitive), e.g. seeding trial/paid balances. */
async function post(
  businessId: string,
  entryType:
    "trial_grant" | "trial_adjustment" | "credit_grant" | "credit_adjustment" | "capacity_reserved",
  bucket: CommercialBucket,
  unitsDelta: number,
  reserved: { trial?: number; paid?: number } = {},
) {
  await withPlatformTransaction(pool, (tx) =>
    postCommercialLedgerEntry(tx, {
      businessId,
      entryType,
      bucket,
      unitsDelta,
      trialReservedDelta: reserved.trial,
      paidReservedDelta: reserved.paid,
      idempotencyScopeKey: `wpcom04-fixture-${randomUUID()}`,
      createdBy: "test-fixture",
      correlationId: "corr-test",
    }),
  );
}
const fund = async (businessId: string, trial: number, paid = 0) => {
  if (trial !== 0) await post(businessId, "trial_grant", "trial", trial);
  if (paid > 0) await post(businessId, "credit_grant", "paid", paid);
  if (paid < 0) await post(businessId, "credit_adjustment", "paid", paid);
};
const reserve = (businessId: string, bucket: CommercialBucket, units: number) =>
  post(businessId, "capacity_reserved", bucket, 0, {
    [bucket]: units,
  });

const programs = new Map<string, { programId: string; versionId: string }>();

/** Loyalty FIXTURE: a Reward in its Cycle. Never written by the code under test. */
async function seedReward(
  businessId: string,
  opts: { availableAt?: Date; state?: "available" | "redeemed" | "cancelled" | "expired" } = {},
) {
  let program = programs.get(businessId);
  if (!program) {
    const programId = randomUUID();
    const versionId = randomUUID();
    await pool.query(
      `INSERT INTO reward_programs (id, business_id, display_name, reward_program_category_id, status, created_by, updated_by)
       VALUES ($1, $2, 'WPCOM04 Club', NULL, 'active', 'seed', 'seed')`,
      [programId, businessId],
    );
    await pool.query(
      `INSERT INTO reward_program_versions (id, reward_program_id, version, required_verified_units, reward_quantity, shared_loyalty_number_allowed, reward_description, effective_from, status, created_by)
       VALUES ($1, $2, 1, 10, 1, true, 'Free coffee', '2026-01-01T00:00:00Z', 'active', 'seed')`,
      [versionId, programId],
    );
    program = { programId, versionId };
    programs.set(businessId, program);
  }
  const customer = `cust-${randomUUID()}`;
  const cycleId = randomUUID();
  const rewardId = randomUUID();
  await pool.query(
    `INSERT INTO loyalty_cycle_streams (business_id, customer_identity_id, reward_program_id)
     VALUES ($1, $2, $3)`,
    [businessId, customer, program.programId],
  );
  await pool.query(
    `INSERT INTO loyalty_cycles (id, business_id, customer_identity_id, reward_program_id, opened_under_version_id, sequence_number, state, allocated_units, correlation_id)
     VALUES ($1, $2, $3, $4, $5, 1, 'reward_available', 10, 'seed')`,
    [cycleId, businessId, customer, program.programId, program.versionId],
  );
  await pool.query(
    `INSERT INTO rewards (id, loyalty_cycle_id, business_id, customer_identity_id, reward_program_id, reward_program_version_id, reward_description, reward_quantity, state, available_at, correlation_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'Free coffee', 1, $7, $8, 'seed')`,
    [
      rewardId,
      cycleId,
      businessId,
      customer,
      program.programId,
      program.versionId,
      opts.state ?? "available",
      opts.availableAt ?? AVAILABLE_AT,
    ],
  );
  return { rewardId, cycleId };
}

const project = (rewardId: string, earmarkResolver?: ConsumptionEarmarkResolver) =>
  projectCommercialConsumption(pool, { rewardId, correlationId: CORR, earmarkResolver });

const asProjected = (r: ProjectConsumptionResult) => {
  expect(r.outcome).toBe("projected");
  if (r.outcome !== "projected") throw new Error("not projected");
  return r;
};

const earmarkFor = (bucket: CommercialBucket): ConsumptionEarmarkResolver => {
  const earmarkId = randomUUID();
  return async () => ({ earmarkId, bucket });
};

async function accountOf(businessId: string) {
  const a = await getCommercialAccount(pool, businessId);
  if (a === null) throw new Error("no account");
  return a;
}

/** Design §7 I-1: counters equal the ledger sums, and version equals the entry count. */
async function expectAccountEqualsLedger(businessId: string) {
  const a = await accountOf(businessId);
  const sum = await sumLedger(pool, businessId);
  expect(a.trialRemainingUnits).toBe(sum.trialRemainingUnits);
  expect(a.paidBalanceUnits).toBe(sum.paidBalanceUnits);
  expect(a.trialReservedUnits).toBe(sum.trialReservedUnits);
  expect(a.paidReservedUnits).toBe(sum.paidReservedUnits);
  expect(a.version).toBe(sum.latestVersion);
  expect(a.version).toBe(sum.entryCount);
}

const consumptionEntries = async (businessId: string) =>
  (await listLedgerEntries(pool, businessId)).filter((e) => e.entryType === "consumption");

/**
 * CORR-002 assertion: for every fallback consumption, the recorded bucket equals the
 * decision computed from the state the account had at the recorded `account_version`,
 * AND the debit's ledger version is exactly `account_version + 1` (nothing intervened
 * between the locked read and the write).
 */
async function expectFallbackDecisionsFollowLockedState(businessId: string) {
  const events = await listConsumptionEventsForBusiness(pool, businessId);
  const ledger = await listLedgerEntries(pool, businessId);
  for (const e of events) {
    const debit = ledger.find((l) => l.id === e.ledgerEntryId);
    expect(debit).toBeDefined();
    expect(debit!.accountVersion).toBe(e.accountVersion + 1);
    if (e.bucketSource !== "consumption_time_fallback") continue;
    const before =
      e.accountVersion === 0 ? null : ledger.find((l) => l.accountVersion === e.accountVersion);
    const trialUncommitted = before === null ? 0 : before.trialAfter - before.trialReservedAfter;
    expect(e.bucket, `event for cycle ${e.sourceLoyaltyCycleId}`).toBe(
      trialUncommitted > 0 ? "trial" : "paid",
    );
  }
}

function expectNoDeadlock(results: PromiseSettledResult<unknown>[]) {
  for (const r of results) {
    if (r.status === "rejected") {
      const reason = r.reason as { code?: string; message?: string };
      expect(`${reason?.code ?? ""} ${reason?.message ?? ""}`).not.toMatch(/40P01|deadlock/i);
    }
  }
}

/** Waits until some other backend is blocked on a lock in a statement matching `pattern`. */
async function waitForBlockedBackend(pattern: string, timeoutMs = 15000): Promise<number> {
  const started = Date.now();
  for (;;) {
    const r = await pool.query<{ pid: number }>(
      `SELECT pid FROM pg_stat_activity
        WHERE datname = current_database() AND pid <> pg_backend_pid()
          AND wait_event_type = 'Lock' AND query ILIKE $1`,
      [pattern],
    );
    if (r.rows.length > 0) return r.rows[0].pid;
    if (Date.now() - started > timeoutMs) {
      throw new Error(`timed out waiting for a backend blocked on ${pattern}`);
    }
    await sleep(20);
  }
}
const BLOCKED_ON_CLAIM = "%INSERT INTO commercial_consumption_claims%";
const BLOCKED_ON_ACCOUNT = "%FROM commercial_accounts%FOR UPDATE%";

type Holder = { client: PoolClient; commit(): Promise<void>; rollback(): Promise<void> };
async function begin(): Promise<Holder> {
  const client = await pool.connect();
  await client.query("BEGIN");
  let done = false;
  const finish = async (sql: string) => {
    if (done) return;
    done = true;
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  };
  return { client, commit: () => finish("COMMIT"), rollback: () => finish("ROLLBACK") };
}
/** Simulates a Loyalty transaction (redemption) holding the Reward row lock. */
async function holdRewardLock(rewardId: string): Promise<Holder> {
  const h = await begin();
  await h.client.query("SELECT id FROM rewards WHERE id = $1 FOR UPDATE", [rewardId]);
  return h;
}
async function holdAccountLock(businessId: string): Promise<Holder> {
  const h = await begin();
  await lockCommercialAccount(h.client, businessId);
  return h;
}

const LOYALTY_TABLES_SNAPSHOT = [
  "rewards",
  "loyalty_cycles",
  "loyalty_cycle_streams",
  "reward_programs",
  "reward_program_versions",
  "verified_units",
  "verified_unit_allocations",
  "purchase_records",
  "purchase_record_events",
  "redemptions",
  "trust_events",
  "notification_intents",
];
async function loyaltySnapshot(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const t of LOYALTY_TABLES_SNAPSHOT) {
    const r = await pool.query<{ h: string }>(
      `SELECT md5(COALESCE(string_agg(x::text || xmin::text, '|' ORDER BY x::text), '')) || ':' || count(*) AS h FROM ${t} x`,
    );
    out[t] = r.rows[0].h;
  }
  return out;
}

// ===========================================================================
describe("SOURCE — the Reward-available fact is the only consumption source", () => {
  it("a Reward Available projects exactly one Commercial unit: claim, event, ledger debit, account, audit", async () => {
    const b = await openAccount();
    await fund(b, 3, 2);
    const { rewardId, cycleId } = await seedReward(b);
    const before = await accountOf(b);

    const r = asProjected(await project(rewardId));

    expect(r.event.unitCount).toBe(1);
    expect(r.event.businessId).toBe(b);
    expect(r.event.sourceLoyaltyCycleId).toBe(cycleId);
    expect(r.event.sourceFactAt).toEqual(AVAILABLE_AT);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_consumption_claims WHERE business_id = $1",
        [b],
      ),
    ).toBe(1);
    const claim = await pool.query(
      "SELECT source_reward_id, source_loyalty_cycle_id FROM commercial_consumption_claims WHERE business_id = $1",
      [b],
    );
    expect(claim.rows[0]).toEqual({ source_reward_id: rewardId, source_loyalty_cycle_id: cycleId });

    const debits = await consumptionEntries(b);
    expect(debits).toHaveLength(1);
    expect(debits[0]).toMatchObject({
      unitsDelta: -1,
      idempotencyScopeKey: `consume:${cycleId}`,
      createdBy: "system:commercial-projection",
    });
    expect(debits[0].id).toBe(r.ledgerEntryId);

    const after = await accountOf(b);
    expect(after.version).toBe(before.version + 1);
    expect(after.trialRemainingUnits + after.paidBalanceUnits).toBe(
      before.trialRemainingUnits + before.paidBalanceUnits - 1,
    );

    const audit = (await listCommercialAuditEventsForBusiness(pool, b)).filter(
      (a) => a.actionType === "consumption_recorded",
    );
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actorType: "system",
      actorId: "system:commercial-projection",
      targetType: "consumption_event",
      targetId: r.event.id,
      reference: cycleId,
      idempotencyKey: `consume:${cycleId}`,
      ledgerEntryId: r.ledgerEntryId,
    });
    await expectAccountEqualsLedger(b);
  });

  it("carries pricing provenance as at the Reward's availability, and consumes with NO price when none applies", async () => {
    const priced = await openAccount();
    await fund(priced, 2);
    const a = await seedReward(priced); // 2026-06-01: BI schedule (from 2026-03-01) applies
    const evPriced = asProjected(await project(a.rewardId)).event;
    expect(evPriced.localCurrency).toBe("BIF");
    expect(evPriced.localUnitPriceMinor).toBe(BI_PRICE);
    expect(evPriced.unitPriceUsdMinor).toBe(200);
    expect(evPriced.priceScheduleId).not.toBeNull();

    const early = await seedReward(priced, { availableAt: new Date("2026-02-01T00:00:00Z") }); // before the schedule
    const evEarly = asProjected(await project(early.rewardId)).event;
    expect(evEarly.priceScheduleId).toBeNull();
    expect(evEarly.localUnitPriceMinor).toBeNull();

    const rw = await openAccount(newBusiness(), { market: "RW" }); // RW has no schedule at all
    await fund(rw, 1);
    const evRw = asProjected(await project((await seedReward(rw)).rewardId)).event;
    expect(evRw.priceScheduleId).toBeNull();
    expect(evRw.bucket).toBe("trial"); // a missing price never blocks or alters consumption
  });

  it("redemption does NOT create consumption, and a redeemed Reward still counts once", async () => {
    const b = await openAccount();
    await fund(b, 5);
    const pending = await seedReward(b);
    // Redeeming the Reward (a Loyalty fact) produces no consumption by itself: nothing is triggered.
    await pool.query("UPDATE rewards SET state = 'redeemed' WHERE id = $1", [pending.rewardId]);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_consumption_events WHERE business_id = $1",
        [b],
      ),
    ).toBe(0);
    expect((await accountOf(b)).version).toBe(1);

    // A Reward already redeemed before the projection runs was still consumed when it became available.
    const r = asProjected(await project(pending.rewardId));
    expect(r.event.sourceFactAt).toEqual(AVAILABLE_AT);

    // Redeeming AFTER projection changes nothing and never debits again.
    const live = await seedReward(b);
    const first = asProjected(await project(live.rewardId));
    await pool.query("UPDATE rewards SET state = 'redeemed' WHERE id = $1", [live.rewardId]);
    const again = await project(live.rewardId);
    expect(again.outcome).toBe("already_projected");
    if (again.outcome === "already_projected") expect(again.event.id).toBe(first.event.id);
    expect(await consumptionEntries(b)).toHaveLength(2);
  });

  it("is not eligible: unknown Reward, cancelled/expired Reward, no account, or available before commercial_effective_from", async () => {
    const b = await openAccount(newBusiness(), { effectiveFrom: new Date("2026-05-01T00:00:00Z") });
    await fund(b, 5);
    const cancelled = await seedReward(b, { state: "cancelled" });
    const expired = await seedReward(b, { state: "expired" });
    const tooEarly = await seedReward(b, { availableAt: new Date("2026-04-30T23:59:59Z") });
    const noAccount = await seedReward(newBusiness());

    const reasons = async (id: string) => {
      const r = await project(id);
      expect(r.outcome).toBe("not_eligible");
      return r.outcome === "not_eligible" ? r.reason : null;
    };
    expect(await reasons(randomUUID())).toBe("reward_not_found");
    expect(await reasons(cancelled.rewardId)).toBe("reward_state_not_countable");
    expect(await reasons(expired.rewardId)).toBe("reward_state_not_countable");
    expect(await reasons(tooEarly.rewardId)).toBe("before_commercial_effective_from");
    expect(await reasons(noAccount.rewardId)).toBe("no_commercial_account");

    // No claim, no event, no ledger movement for any of them.
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_consumption_claims WHERE business_id = $1",
        [b],
      ),
    ).toBe(0);
    expect((await accountOf(b)).version).toBe(1);
    // The boundary is inclusive: available exactly at commercial_effective_from counts.
    const exact = await seedReward(b, { availableAt: new Date("2026-05-01T00:00:00Z") });
    expect((await project(exact.rewardId)).outcome).toBe("projected");
  });

  it("two Rewards of one Business serialise safely and both consume", async () => {
    const b = await openAccount();
    await fund(b, 1, 5);
    const one = await seedReward(b);
    const two = await seedReward(b);
    const results = await Promise.allSettled([project(one.rewardId), project(two.rewardId)]);
    expectNoDeadlock(results);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
    const events = await listConsumptionEventsForBusiness(pool, b);
    expect(events).toHaveLength(2);
    expect(new Set(events.map((e) => e.sourceLoyaltyCycleId)).size).toBe(2);
    const versions = (await consumptionEntries(b))
      .map((e) => e.accountVersion)
      .sort((x, y) => x - y);
    expect(versions[1]).toBe(versions[0] + 1); // strictly serialised on the account
    await expectAccountEqualsLedger(b);
    await expectFallbackDecisionsFollowLockedState(b);
  });
});

// ===========================================================================
describe("BUCKET — funding provenance", () => {
  it("earmarked TRIAL: debits trial, releases the trial reservation, records the earmark; account state plays no part", async () => {
    const b = await openAccount();
    await fund(b, 3, 4);
    await reserve(b, "trial", 1);
    const { rewardId } = await seedReward(b);
    const resolver = earmarkFor("trial");
    const before = await accountOf(b);

    const { event } = asProjected(await project(rewardId, resolver));

    expect(event.bucket).toBe("trial");
    expect(event.bucketSource).toBe("earmark");
    expect(event.earmarkId).not.toBeNull();
    const after = await accountOf(b);
    expect(after.trialRemainingUnits).toBe(before.trialRemainingUnits - 1);
    expect(after.trialReservedUnits).toBe(before.trialReservedUnits - 1);
    expect(after.paidBalanceUnits).toBe(before.paidBalanceUnits);
    expect(after.paidReservedUnits).toBe(before.paidReservedUnits);
    await expectAccountEqualsLedger(b);
  });

  it("earmarked PAID beats a trial that is available: no re-classification, paid reservation released", async () => {
    const b = await openAccount();
    await fund(b, 3, 4); // uncommitted trial exists, yet the earmark says paid
    await reserve(b, "paid", 1);
    const { rewardId } = await seedReward(b);

    const { event } = asProjected(await project(rewardId, earmarkFor("paid")));

    expect(event.bucket).toBe("paid");
    expect(event.bucketSource).toBe("earmark");
    const after = await accountOf(b);
    expect(after.trialRemainingUnits).toBe(3);
    expect(after.paidBalanceUnits).toBe(3);
    expect(after.paidReservedUnits).toBe(0);
    await expectAccountEqualsLedger(b);
  });

  it("an earmark with no held reservation is an integrity failure, never a silent mis-debit", async () => {
    const b = await openAccount();
    await fund(b, 0, 3);
    const { rewardId, cycleId } = await seedReward(b);
    await expect(project(rewardId, earmarkFor("paid"))).rejects.toThrow(
      /Reserved capacity cannot become negative/,
    );
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_consumption_claims WHERE source_loyalty_cycle_id = $1",
        [cycleId],
      ),
    ).toBe(0);
    expect((await accountOf(b)).paidBalanceUnits).toBe(3);
  });

  it("fallback TRIAL: uncommitted trial first, recorded as consumption_time_fallback with the locked account_version", async () => {
    const b = await openAccount();
    await fund(b, 3, 5);
    const { rewardId } = await seedReward(b);
    const versionBefore = (await accountOf(b)).version;

    const { event } = asProjected(await project(rewardId)); // no earmark source exists

    expect(event.bucket).toBe("trial");
    expect(event.bucketSource).toBe("consumption_time_fallback");
    expect(event.earmarkId).toBeNull();
    expect(event.accountVersion).toBe(versionBefore);
    await expectFallbackDecisionsFollowLockedState(b);
    await expectAccountEqualsLedger(b);
  });

  it("fallback PAID: when trial is exhausted, or fully reserved (uncommitted trial is zero)", async () => {
    const exhausted = await openAccount();
    await fund(exhausted, 0, 3);
    const e1 = asProjected(await project((await seedReward(exhausted)).rewardId)).event;
    expect(e1.bucket).toBe("paid");
    expect(e1.bucketSource).toBe("consumption_time_fallback");

    const reserved = await openAccount();
    await fund(reserved, 2, 3);
    await reserve(reserved, "trial", 2); // all trial promised to admitted Circles
    const e2 = asProjected(await project((await seedReward(reserved)).rewardId)).event;
    expect(e2.bucket).toBe("paid"); // the fallback never takes trial capacity that is earmarked elsewhere
    expect((await accountOf(reserved)).trialReservedUnits).toBe(2);
    await expectFallbackDecisionsFollowLockedState(reserved);
  });

  it("a concurrent trial adjustment cannot stale the fallback decision: trial removed while the projector waits for the lock -> PAID", async () => {
    const b = await openAccount();
    await fund(b, 3, 5);
    const { rewardId } = await seedReward(b);
    const holder = await holdAccountLock(b);
    const projecting = project(rewardId);
    await waitForBlockedBackend(BLOCKED_ON_ACCOUNT); // claim inserted; blocked on the account
    await withHolder(holder, async () => {
      await postCommercialLedgerEntry(holder.client, {
        businessId: b,
        entryType: "trial_adjustment",
        bucket: "trial",
        unitsDelta: -3,
        idempotencyScopeKey: `wpcom04-fixture-${randomUUID()}`,
        createdBy: "test-fixture",
        correlationId: "corr-test",
      });
    });
    const { event } = asProjected(await projecting);
    expect(event.bucket).toBe("paid"); // decided from the COMMITTED locked state (trial 0), not a stale read (trial 3)
    expect(event.accountVersion).toBe(3); // grant, credit, adjustment
    await expectFallbackDecisionsFollowLockedState(b);
    await expectAccountEqualsLedger(b);
  });

  it("...and a trial grant committed while the projector waits flips the decision to TRIAL", async () => {
    const b = await openAccount();
    await fund(b, 0, 5);
    const { rewardId } = await seedReward(b);
    const holder = await holdAccountLock(b);
    const projecting = project(rewardId);
    await waitForBlockedBackend(BLOCKED_ON_ACCOUNT);
    await withHolder(holder, async () => {
      await postCommercialLedgerEntry(holder.client, {
        businessId: b,
        entryType: "trial_grant",
        bucket: "trial",
        unitsDelta: 2,
        idempotencyScopeKey: `wpcom04-fixture-${randomUUID()}`,
        createdBy: "test-fixture",
        correlationId: "corr-test",
      });
    });
    const { event } = asProjected(await projecting);
    expect(event.bucket).toBe("trial");
    await expectFallbackDecisionsFollowLockedState(b);
  });

  it("an earmarked bucket is unaffected by a concurrent trial grant (INV-CAP-PROV)", async () => {
    const b = await openAccount();
    await fund(b, 0, 5);
    await reserve(b, "paid", 1);
    const { rewardId } = await seedReward(b);
    const holder = await holdAccountLock(b);
    const projecting = project(rewardId, earmarkFor("paid"));
    await waitForBlockedBackend(BLOCKED_ON_ACCOUNT);
    await withHolder(holder, async () => {
      await postCommercialLedgerEntry(holder.client, {
        businessId: b,
        entryType: "trial_grant",
        bucket: "trial",
        unitsDelta: 4,
        idempotencyScopeKey: `wpcom04-fixture-${randomUUID()}`,
        createdBy: "test-fixture",
        correlationId: "corr-test",
      });
    });
    const { event } = asProjected(await projecting);
    expect(event.bucket).toBe("paid");
    expect(event.bucketSource).toBe("earmark");
    expect((await accountOf(b)).trialRemainingUnits).toBe(4); // the new trial untouched
  });

  it("INV-CAP-PROV property: per-Circle buckets are identical under prompt, reversed, shuffled and concurrent processing order", async () => {
    // Circle i is earmarked trial for i < 2 and paid otherwise; totals alone would hide a swap.
    const plan: CommercialBucket[] = ["trial", "trial", "paid", "paid", "paid"];
    const orders: number[][] = [
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [2, 0, 4, 1, 3],
    ];
    for (const order of [...orders, "concurrent" as const]) {
      const b = await openAccount();
      await fund(b, 2, 3);
      await reserve(b, "trial", 2);
      await reserve(b, "paid", 3);
      const circles = await Promise.all(plan.map(() => seedReward(b)));
      const resolver: ConsumptionEarmarkResolver = async (_tx, source) => {
        const index = circles.findIndex((c) => c.cycleId === source.loyaltyCycleId);
        return { earmarkId: randomUUID(), bucket: plan[index] };
      };
      if (order === "concurrent") {
        const results = await Promise.allSettled(circles.map((c) => project(c.rewardId, resolver)));
        expectNoDeadlock(results);
        expect(results.every((r) => r.status === "fulfilled")).toBe(true);
      } else {
        for (const i of order) asProjected(await project(circles[i].rewardId, resolver));
      }
      const events = await listConsumptionEventsForBusiness(pool, b);
      const bucketOf = (i: number) =>
        events.find((e) => e.sourceLoyaltyCycleId === circles[i].cycleId)?.bucket;
      expect(plan.map((_, i) => bucketOf(i))).toEqual(plan);
      const a = await accountOf(b);
      expect([
        a.trialRemainingUnits,
        a.paidBalanceUnits,
        a.trialReservedUnits,
        a.paidReservedUnits,
      ]).toEqual([0, 0, 0, 0]);
      await expectAccountEqualsLedger(b);
    }
  });

  it("consumption is immutable: bucket, provenance and claim can never be edited, deleted or truncated", async () => {
    const b = await openAccount();
    await fund(b, 2, 2);
    const { rewardId, cycleId } = await seedReward(b);
    const { event } = asProjected(await project(rewardId));
    const reject = async (sql: string) =>
      expect(pool.query(sql, [event.id])).rejects.toThrow(/append-only and immutable/);
    await reject("UPDATE commercial_consumption_events SET bucket = 'paid' WHERE id = $1");
    await reject(
      "UPDATE commercial_consumption_events SET bucket_source = 'earmark' WHERE id = $1",
    );
    await reject("DELETE FROM commercial_consumption_events WHERE id = $1");
    await expect(
      pool.query(
        "UPDATE commercial_consumption_claims SET business_id = 'x' WHERE source_loyalty_cycle_id = $1",
        [cycleId],
      ),
    ).rejects.toThrow(/append-only and immutable/);
    await expect(
      pool.query("DELETE FROM commercial_consumption_claims WHERE source_loyalty_cycle_id = $1", [
        cycleId,
      ]),
    ).rejects.toThrow(/append-only and immutable/);
    await expect(pool.query("TRUNCATE commercial_consumption_events")).rejects.toThrow(
      /append-only and immutable/,
    );
    await expect(pool.query("TRUNCATE commercial_consumption_claims CASCADE")).rejects.toThrow(
      /append-only and immutable/,
    );
    // Later trial/paid changes never re-classify it.
    await post(b, "trial_grant", "trial", 4);
    await post(b, "credit_grant", "paid", 4);
    expect((await getConsumptionEventByCycle(pool, cycleId))?.bucket).toBe(event.bucket);
  });
});

async function withHolder(holder: Holder, body: () => Promise<void>) {
  try {
    await body();
    await holder.commit();
  } catch (error) {
    await holder.rollback();
    throw error;
  }
}

// ===========================================================================
describe("BALANCE — negative paid balance, no floor, no maximum, never gated", () => {
  it("paid balance goes negative: an earned Reward always consumes, even when paid capacity is depleted", async () => {
    const b = await openAccount();
    await fund(b, 0, 1); // trial 0, paid 1
    const results: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const { event } = asProjected(await project((await seedReward(b)).rewardId));
      expect(event.bucket).toBe("paid");
      results.push((await accountOf(b)).paidBalanceUnits);
    }
    expect(results).toEqual([0, -1, -2, -3]); // no floor
    const a = await accountOf(b);
    expect(a.trialRemainingUnits).toBe(0);
    await expectAccountEqualsLedger(b);
  });

  it("no floor or maximum is introduced: consumption from a deeply negative paid balance still succeeds", async () => {
    const b = await openAccount();
    await fund(b, 0, -100);
    expect((await accountOf(b)).paidBalanceUnits).toBe(-100);
    asProjected(await project((await seedReward(b)).rewardId));
    expect((await accountOf(b)).paidBalanceUnits).toBe(-101);
    await expectAccountEqualsLedger(b);
  });

  it("an earmarked paid Circle consumes paid even after a settlement void drove the balance negative", async () => {
    const b = await openAccount();
    const rec = await recordSettlement(d(), ctx(), {
      businessId: b,
      method: "cash",
      externalReference: `ref-${randomUUID()}`,
      currency: "BIF",
      amountMinor: 3 * BI_PRICE,
      unitsPurchased: 3,
      receivedAt: new Date("2026-04-01T00:00:00Z"),
      reasonText: "received offline",
    });
    await confirmSettlement(d(), ctx(), {
      businessId: b,
      settlementId: rec.result.settlementId,
      confirmationNote: "verified",
    });
    await reserve(b, "paid", 1);
    await voidSettlement(d(), ctx(), {
      businessId: b,
      settlementId: rec.result.settlementId,
      reasonText: "bounced",
      reference: "REF-VOID",
    });
    expect((await accountOf(b)).paidBalanceUnits).toBe(0 - 0); // 3 credited, 3 reversed
    const { event } = asProjected(
      await project((await seedReward(b)).rewardId, earmarkFor("paid")),
    );
    expect(event.bucket).toBe("paid");
    expect((await accountOf(b)).paidBalanceUnits).toBe(-1);
    await expectAccountEqualsLedger(b);
  });

  it("restriction never blocks consumption: an earned Reward consumes while the Business is restricted", async () => {
    const b = await openAccount();
    await fund(b, 1, 0);
    await restrictNewStarts(d(), ctx(), {
      businessId: b,
      reasonText: "overdue",
      reference: "REF-R",
    });
    expect((await accountOf(b)).serviceRestriction).toBe("restricted");
    asProjected(await project((await seedReward(b)).rewardId));
    asProjected(await project((await seedReward(b)).rewardId)); // trial exhausted -> paid -1
    expect((await accountOf(b)).paidBalanceUnits).toBe(-1);
    expect((await accountOf(b)).serviceRestriction).toBe("restricted"); // projection never changes standing
  });
});

// ===========================================================================
describe("IDEMPOTENCY / EXACTLY-ONCE", () => {
  it("a duplicate sequential projection returns the existing consumption and posts nothing", async () => {
    const b = await openAccount();
    await fund(b, 3);
    const { rewardId, cycleId } = await seedReward(b);
    const first = asProjected(await project(rewardId));
    const versionAfterFirst = (await accountOf(b)).version;
    const second = await project(rewardId);
    expect(second.outcome).toBe("already_projected");
    if (second.outcome === "already_projected") expect(second.event.id).toBe(first.event.id);
    expect((await accountOf(b)).version).toBe(versionAfterFirst);
    expect(await consumptionEntries(b)).toHaveLength(1);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_audit_events WHERE business_id = $1 AND action_type = 'consumption_recorded'",
        [b],
      ),
    ).toBe(1);
    expect((await getConsumptionEventByCycle(pool, cycleId))?.id).toBe(first.event.id);
  });

  it("simultaneous duplicate projections of one Reward: exactly one wins, the rest see it, no deadlock, one debit", async () => {
    const b = await openAccount();
    await fund(b, 5);
    const { rewardId } = await seedReward(b);
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => project(rewardId)));
    expectNoDeadlock(results);
    const outcomes = results.map((r) => (r.status === "fulfilled" ? r.value.outcome : "REJECTED"));
    expect(outcomes.filter((o) => o === "projected")).toHaveLength(1);
    expect(outcomes.filter((o) => o === "already_projected")).toHaveLength(7);
    expect(await consumptionEntries(b)).toHaveLength(1);
    expect(await listConsumptionEventsForBusiness(pool, b)).toHaveLength(1);
    expect((await accountOf(b)).trialRemainingUnits).toBe(4); // debited exactly once
    await expectAccountEqualsLedger(b);
  });

  it("different Rewards are independent: each consumes exactly once under concurrent duplicate storms", async () => {
    const b = await openAccount();
    await fund(b, 2, 10);
    const rewards = await Promise.all(Array.from({ length: 4 }, () => seedReward(b)));
    const calls = rewards.flatMap((r) => [project(r.rewardId), project(r.rewardId)]);
    const results = await Promise.allSettled(calls);
    expectNoDeadlock(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await listConsumptionEventsForBusiness(pool, b)).toHaveLength(4);
    expect(await consumptionEntries(b)).toHaveLength(4);
    const a = await accountOf(b);
    expect(a.trialRemainingUnits + a.paidBalanceUnits).toBe(12 - 4);
    await expectAccountEqualsLedger(b);
    await expectFallbackDecisionsFollowLockedState(b);
  });

  it("the database itself enforces exactly-once: duplicate claim, duplicate ledger scope key", async () => {
    const b = await openAccount();
    await fund(b, 3);
    const { rewardId, cycleId } = await seedReward(b);
    const { ledgerEntryId } = asProjected(await project(rewardId));
    await expect(
      pool.query(
        `INSERT INTO commercial_consumption_claims (business_id, source_reward_id, source_loyalty_cycle_id, correlation_id)
         VALUES ($1, $2, $3, 'dup')`,
        [b, rewardId, cycleId],
      ),
    ).rejects.toThrow(/commercial_consumption_claims_(cycle|reward)_unique/);
    await expect(
      withPlatformTransaction(pool, (tx) =>
        postCommercialLedgerEntry(tx, {
          businessId: b,
          entryType: "consumption",
          bucket: "trial",
          unitsDelta: -1,
          idempotencyScopeKey: `consume:${cycleId}`,
          createdBy: "test",
          correlationId: "c",
        }),
      ),
    ).resolves.toMatchObject({ outcome: "replayed", entry: { id: ledgerEntryId } }); // replay writes nothing
    expect(await consumptionEntries(b)).toHaveLength(1);
    // Direct SQL cannot double-bind the ledger debit or the claim either.
    await expect(
      pool.query(
        `INSERT INTO commercial_ledger_entries
           (business_id, account_version, entry_type, bucket, units_delta, trial_after, paid_after, trial_reserved_after, paid_reserved_after, idempotency_scope_key, created_by, correlation_id)
         VALUES ($1, 99, 'consumption', 'trial', -1, 0, 0, 0, 0, $2, 'x', 'c')`,
        [b, `consume:${cycleId}`],
      ),
    ).rejects.toThrow(/commercial_ledger_entries_idempotency_scope_unique/);
  });

  it("a claim can never be committed without its event, and an event must match its ledger debit", async () => {
    const b = await openAccount();
    await fund(b, 3, 3);
    const { rewardId, cycleId } = await seedReward(b);
    // Claim alone: refused at COMMIT.
    await expect(
      withPlatformTransaction(pool, (tx) =>
        tx.query(
          `INSERT INTO commercial_consumption_claims (business_id, source_reward_id, source_loyalty_cycle_id, correlation_id)
           VALUES ($1, $2, $3, 'lonely')`,
          [b, rewardId, cycleId],
        ),
      ),
    ).rejects.toThrow(/never committed alone/);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_consumption_claims WHERE business_id = $1",
        [b],
      ),
    ).toBe(0);

    // Claim for a Business that is not the Reward's Business.
    const other = await openAccount();
    await expect(
      pool.query(
        `INSERT INTO commercial_consumption_claims (business_id, source_reward_id, source_loyalty_cycle_id, correlation_id)
         VALUES ($1, $2, $3, 'wrong-biz')`,
        [other, rewardId, cycleId],
      ),
    ).rejects.toThrow(/does not match the Business of Reward/);

    // Claim naming a Cycle the Reward does not belong to: the composite foreign key.
    const foreign = await seedReward(b);
    await expect(
      pool.query(
        `INSERT INTO commercial_consumption_claims (business_id, source_reward_id, source_loyalty_cycle_id, correlation_id)
         VALUES ($1, $2, $3, 'wrong-cycle')`,
        [b, rewardId, foreign.cycleId],
      ),
    ).rejects.toThrow(/commercial_consumption_claims_reward_in_cycle/);

    // An event linked to a ledger entry that is not this Cycle's consumption debit.
    await expect(
      withPlatformTransaction(pool, async (tx) => {
        const claim = await tx.query<{ id: string }>(
          `INSERT INTO commercial_consumption_claims (business_id, source_reward_id, source_loyalty_cycle_id, correlation_id)
           VALUES ($1, $2, $3, 'x') RETURNING id`,
          [b, rewardId, cycleId],
        );
        const credit = await tx.query<{ id: string }>(
          `SELECT id FROM commercial_ledger_entries WHERE business_id = $1 AND entry_type = 'credit_grant'`,
          [b],
        );
        await tx.query(
          `INSERT INTO commercial_consumption_events
             (claim_id, business_id, reward_program_id, source_loyalty_cycle_id, source_fact_at, unit_count, bucket, bucket_source, account_version, ledger_entry_id, correlation_id)
           VALUES ($1, $2, $3, $4, now(), 1, 'paid', 'consumption_time_fallback', 2, $5, 'x')`,
          [claim.rows[0].id, b, programs.get(b)!.programId, cycleId, credit.rows[0].id],
        );
      }),
    ).rejects.toThrow(/does not match its ledger debit/);
    expect(await consumptionEntries(b)).toHaveLength(0);
  });

  it("debits equal Rewards and the ledger reconciles to the counters after a mixed run", async () => {
    const b = await openAccount();
    await fund(b, 2, 2);
    for (let i = 0; i < 6; i += 1) asProjected(await project((await seedReward(b)).rewardId));
    expect(await consumptionEntries(b)).toHaveLength(6);
    expect(await listConsumptionEventsForBusiness(pool, b)).toHaveLength(6);
    const a = await accountOf(b);
    expect(a.trialRemainingUnits).toBe(0);
    expect(a.paidBalanceUnits).toBe(-2);
    await expectAccountEqualsLedger(b);
    await expectFallbackDecisionsFollowLockedState(b);
  });
});

// ===========================================================================
describe("CRASH / RETRY — every stage is one transaction", () => {
  const failAuditTrigger = async (on: boolean) => {
    if (on) {
      await pool.query(`
        CREATE FUNCTION wpcom04_fail_consumption_audit() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.action_type = 'consumption_recorded' THEN
            RAISE EXCEPTION 'wpcom04 injected failure after the final inserts';
          END IF;
          RETURN NEW;
        END; $$`);
      await pool.query(
        "CREATE TRIGGER wpcom04_fail_consumption_audit BEFORE INSERT ON commercial_audit_events FOR EACH ROW EXECUTE FUNCTION wpcom04_fail_consumption_audit()",
      );
    } else {
      await pool.query(
        "DROP TRIGGER IF EXISTS wpcom04_fail_consumption_audit ON commercial_audit_events",
      );
      await pool.query("DROP FUNCTION IF EXISTS wpcom04_fail_consumption_audit()");
    }
  };

  async function expectNothingCommitted(b: string, cycleId: string, versionBefore: number) {
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_consumption_claims WHERE source_loyalty_cycle_id = $1",
        [cycleId],
      ),
    ).toBe(0);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_consumption_events WHERE source_loyalty_cycle_id = $1",
        [cycleId],
      ),
    ).toBe(0);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_ledger_entries WHERE idempotency_scope_key = $1",
        [`consume:${cycleId}`],
      ),
    ).toBe(0);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_audit_events WHERE idempotency_key = $1",
        [`consume:${cycleId}`],
      ),
    ).toBe(0);
    expect((await accountOf(b)).version).toBe(versionBefore);
    await expectAccountEqualsLedger(b);
    // The Reward is still eligible: no stale "processing" state blocks it.
    expect(
      (await listUnprojectedRewardSources(pool, { limit: 500, businessId: b })).map(
        (r) => r.loyaltyCycleId,
      ),
    ).toContain(cycleId);
  }

  it("failure AFTER the final inserts but before commit: claim, event, debit, account and audit all roll back; retry succeeds", async () => {
    const b = await openAccount();
    await fund(b, 3);
    const { rewardId, cycleId } = await seedReward(b);
    const versionBefore = (await accountOf(b)).version;
    await failAuditTrigger(true);
    try {
      await expect(project(rewardId)).rejects.toThrow(/injected failure/);
    } finally {
      await failAuditTrigger(false);
    }
    await expectNothingCommitted(b, cycleId, versionBefore);
    const retry = asProjected(await project(rewardId));
    expect(retry.event.sourceLoyaltyCycleId).toBe(cycleId);
    expect(await consumptionEntries(b)).toHaveLength(1);
    await expectAccountEqualsLedger(b);
  });

  it("failure after the account lock (funding resolution throws): nothing persists, lock released, retry succeeds", async () => {
    const b = await openAccount();
    await fund(b, 3);
    const { rewardId, cycleId } = await seedReward(b);
    const versionBefore = (await accountOf(b)).version;
    await expect(
      project(rewardId, async () => {
        throw new Error("resolver blew up");
      }),
    ).rejects.toThrow(/resolver blew up/);
    await expectNothingCommitted(b, cycleId, versionBefore);
    asProjected(await project(rewardId));
  });

  it("crash AFTER the claim insert but BEFORE the account lock (connection killed while waiting): the claim vanishes with the transaction", async () => {
    const b = await openAccount();
    await fund(b, 3);
    const { rewardId, cycleId } = await seedReward(b);
    const versionBefore = (await accountOf(b)).version;
    const holder = await holdAccountLock(b);
    const projecting = project(rewardId).then(
      () => "completed",
      (e: Error) => `crashed: ${e.message}`,
    );
    const pid = await waitForBlockedBackend(BLOCKED_ON_ACCOUNT);
    // The claim exists ONLY inside the projector's uncommitted transaction.
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_consumption_claims WHERE source_loyalty_cycle_id = $1",
        [cycleId],
      ),
    ).toBe(0);
    await pool.query("SELECT pg_terminate_backend($1)", [pid]);
    expect(await projecting).toMatch(/^crashed:/);
    await holder.rollback();
    await expectNothingCommitted(b, cycleId, versionBefore);
    asProjected(await project(rewardId));
    await expectAccountEqualsLedger(b);
  });

  it("crash AFTER the account lock but BEFORE the final inserts (connection killed while holding the lock): lock released, nothing persisted, retry succeeds", async () => {
    const b = await openAccount();
    await fund(b, 3);
    const { rewardId, cycleId } = await seedReward(b);
    const versionBefore = (await accountOf(b)).version;
    let resolvePid!: (pid: number) => void;
    const pidSeen = new Promise<number>((r) => (resolvePid = r));
    const stuck: ConsumptionEarmarkResolver = async (tx) => {
      resolvePid((await tx.query<{ pid: number }>("SELECT pg_backend_pid() AS pid")).rows[0].pid);
      await tx.query("SELECT pg_sleep(60)"); // a worker that never comes back
      return null;
    };
    const projecting = project(rewardId, stuck).then(
      () => "completed",
      (e: Error) => `crashed: ${e.message}`,
    );
    const pid = await pidSeen;
    // While it "hangs" it really does hold the account lock...
    const probe = await begin();
    await expect(
      probe.client.query(
        "SELECT 1 FROM commercial_accounts WHERE business_id = $1 FOR UPDATE NOWAIT",
        [b],
      ),
    ).rejects.toThrow(/could not obtain lock/);
    await probe.rollback();
    // ...and killing it frees everything.
    await pool.query("SELECT pg_terminate_backend($1)", [pid]);
    expect(await projecting).toMatch(/^crashed:/);
    const free = await begin();
    await free.client.query("SET LOCAL lock_timeout = '1s'");
    await lockCommercialAccount(free.client, b); // would time out if the lock leaked
    await free.rollback();
    await expectNothingCommitted(b, cycleId, versionBefore);
    asProjected(await project(rewardId));
  });

  it("duplicate retry after commit returns the committed consumption", async () => {
    const b = await openAccount();
    await fund(b, 3);
    const { rewardId } = await seedReward(b);
    const first = asProjected(await project(rewardId));
    const retry = await project(rewardId);
    expect(retry.outcome).toBe("already_projected");
    if (retry.outcome === "already_projected") expect(retry.event).toEqual(first.event);
  });

  it("reconciliation after a previous failure projects it, and the failure history is preserved", async () => {
    const b = await openAccount();
    await fund(b, 3);
    const { cycleId } = await seedReward(b);
    await failAuditTrigger(true);
    let failedReport;
    try {
      failedReport = await reconcileCommercialConsumption(pool, {
        correlationId: CORR,
        businessId: b,
      });
    } finally {
      await failAuditTrigger(false);
    }
    expect(failedReport).toMatchObject({ scanned: 1, projected: 0, failed: 1 });
    expect(failedReport.metrics.projectionFailureCount).toBeGreaterThanOrEqual(1);
    const failures = await pool.query(
      "SELECT attempt, error_class, error_message FROM commercial_projection_failures WHERE source_loyalty_cycle_id = $1",
      [cycleId],
    );
    expect(failures.rows).toHaveLength(1);
    expect(failures.rows[0].attempt).toBe(1);
    expect(failures.rows[0].error_message).toMatch(/injected failure/);

    const recovered = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
    });
    expect(recovered).toMatchObject({ scanned: 1, projected: 1, failed: 0 });
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_projection_failures WHERE source_loyalty_cycle_id = $1",
        [cycleId],
      ),
    ).toBe(1); // append-only
    expect(await consumptionEntries(b)).toHaveLength(1);
  });
});

// ===========================================================================
describe("RECONCILIATION — bounded, repeat-safe, observable", () => {
  it("finds Rewards with no consumption, skips existing ones, and is safe to repeat", async () => {
    const b = await openAccount();
    await fund(b, 3, 3);
    const rewards = await Promise.all([seedReward(b), seedReward(b), seedReward(b)]);
    asProjected(await project(rewards[0].rewardId)); // already consumed by the normal path

    const first = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
    });
    expect(first).toMatchObject({
      scanned: 2,
      projected: 2,
      alreadyProjected: 0,
      notEligible: 0,
      failed: 0,
    });
    expect(await consumptionEntries(b)).toHaveLength(3);

    const versionAfter = (await accountOf(b)).version;
    for (let i = 0; i < 3; i += 1) {
      const again = await reconcileCommercialConsumption(pool, {
        correlationId: CORR,
        businessId: b,
      });
      expect(again).toMatchObject({ scanned: 0, projected: 0, failed: 0 });
    }
    expect((await accountOf(b)).version).toBe(versionAfter);
    expect(await consumptionEntries(b)).toHaveLength(3);
    await expectAccountEqualsLedger(b);
  });

  it("is bounded by `limit`, oldest first, and reports lag (count and oldest age) from a fixed clock", async () => {
    const b = await openAccount();
    await fund(b, 0, 10);
    const now = new Date("2026-06-10T00:00:00Z");
    const old = await seedReward(b, { availableAt: new Date("2026-06-09T00:00:00Z") }); // 1 day old
    await seedReward(b, { availableAt: new Date("2026-06-09T12:00:00Z") });
    await seedReward(b, { availableAt: new Date("2026-06-09T18:00:00Z") });

    const before = await getConsumptionProjectionMetrics(pool, now);
    const mine = await listUnprojectedRewardSources(pool, { limit: 500, businessId: b });
    expect(mine).toHaveLength(3);
    expect(before.unprojectedRewardCount).toBeGreaterThanOrEqual(3);
    expect(before.oldestUnprojectedAgeSeconds).toBeGreaterThanOrEqual(24 * 3600);

    const pass = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
      limit: 2,
      now,
    });
    expect(pass).toMatchObject({ scanned: 2, projected: 2 });
    expect((await getConsumptionEventByCycle(pool, old.cycleId))?.recordedAt).toBeDefined(); // oldest went first
    expect(await listUnprojectedRewardSources(pool, { limit: 500, businessId: b })).toHaveLength(1);
    const last = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
      limit: 2,
      now,
    });
    expect(last).toMatchObject({ scanned: 1, projected: 1 });
  });

  it("lag metrics: unprojected count and oldest age are exact for an isolated Business and fall to none when caught up", async () => {
    // Drain any unprojected Rewards left by other tests so the global metrics are attributable.
    while ((await reconcileCommercialConsumption(pool, { correlationId: CORR })).scanned > 0) {
      /* drain */
    }
    const b = await openAccount();
    await fund(b, 0, 5);
    const now = new Date("2026-06-01T01:00:00Z"); // AVAILABLE_AT + 1h
    await seedReward(b);
    const lag = await getConsumptionProjectionMetrics(pool, now);
    expect(lag.unprojectedRewardCount).toBe(1);
    expect(lag.oldestUnprojectedAgeSeconds).toBe(3600);
    await reconcileCommercialConsumption(pool, { correlationId: CORR, now });
    const caught = await getConsumptionProjectionMetrics(pool, now);
    expect(caught.unprojectedRewardCount).toBe(0);
    expect(caught.oldestUnprojectedAgeSeconds).toBeNull();
  });

  it("fallback consumption is observable: counted in the report and the metric; earmarked ones are not", async () => {
    const b = await openAccount();
    await fund(b, 0, 10);
    await reserve(b, "paid", 1);
    await seedReward(b);
    await seedReward(b);
    const fallbackBefore = (await getConsumptionProjectionMetrics(pool)).fallbackConsumptionCount;

    // One Reward has an earmark, one has none.
    let first = true;
    const mixed: ConsumptionEarmarkResolver = async () => {
      if (first) {
        first = false;
        return { earmarkId: randomUUID(), bucket: "paid" };
      }
      return null;
    };
    const report = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
      earmarkResolver: mixed,
    });
    expect(report).toMatchObject({ projected: 2, projectedViaFallback: 1 });
    expect(report.metrics.fallbackConsumptionCount).toBe(fallbackBefore + 1);
    const events = await listConsumptionEventsForBusiness(pool, b);
    expect(events.map((e) => e.bucketSource).sort()).toEqual([
      "consumption_time_fallback",
      "earmark",
    ]);
    await expectAccountEqualsLedger(b);
  });

  it("skips Businesses with no account and Rewards before commercial_effective_from (never billed retroactively)", async () => {
    const b = await openAccount(newBusiness(), { effectiveFrom: new Date("2026-05-15T00:00:00Z") });
    await fund(b, 5);
    await seedReward(b, { availableAt: new Date("2026-05-01T00:00:00Z") }); // before
    const inside = await seedReward(b, { availableAt: new Date("2026-05-20T00:00:00Z") });
    await seedReward(newBusiness()); // no Commercial account at all
    const report = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
    });
    expect(report).toMatchObject({ scanned: 1, projected: 1 });
    expect((await getConsumptionEventByCycle(pool, inside.cycleId))?.businessId).toBe(b);
    expect(await listUnprojectedRewardSources(pool, { limit: 500, businessId: b })).toHaveLength(0);
  });

  it("a persistently failing Reward cannot starve the rest of a bounded pass", async () => {
    const b = await openAccount();
    await fund(b, 0, 10);
    const poison = await seedReward(b, { availableAt: new Date("2026-05-01T00:00:00Z") }); // oldest
    const healthy = await seedReward(b, { availableAt: new Date("2026-05-02T00:00:00Z") });
    const resolver: ConsumptionEarmarkResolver = async (_tx, source) => {
      if (source.loyaltyCycleId === poison.cycleId) throw new Error("poison Reward");
      return null;
    };
    const one = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
      limit: 1,
      earmarkResolver: resolver,
    });
    expect(one).toMatchObject({ scanned: 1, projected: 0, failed: 1 }); // oldest first: the poison one
    const two = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
      limit: 1,
      earmarkResolver: resolver,
    });
    expect(two).toMatchObject({ scanned: 1, projected: 1, failed: 0 }); // fewest failures first: the healthy one
    expect(await getConsumptionEventByCycle(pool, healthy.cycleId)).not.toBeNull();
    expect(await getConsumptionEventByCycle(pool, poison.cycleId)).toBeNull();
    // Once the fault clears, the poison Reward consumes.
    const three = await reconcileCommercialConsumption(pool, {
      correlationId: CORR,
      businessId: b,
    });
    expect(three).toMatchObject({ scanned: 1, projected: 1 });
  });
});

// ===========================================================================
describe("LOCK ORDER — claim -> account lock -> classify -> finalize", () => {
  for (const mode of ["earmarked", "fallback"] as const) {
    it(`${mode}: while the projector waits for a Loyalty-held Reward it holds NO account lock, so a Loyalty-side transaction that needs the account cannot form a cycle`, async () => {
      const b = await openAccount();
      await fund(b, 0, 5);
      if (mode === "earmarked") await reserve(b, "paid", 1);
      const { rewardId } = await seedReward(b);
      // A Loyalty transaction (redemption-like) holds the Reward row FOR UPDATE ...
      const loyalty = await holdRewardLock(rewardId);
      const resolver = mode === "earmarked" ? earmarkFor("paid") : undefined;
      const projecting = project(rewardId, resolver);
      await waitForBlockedBackend(BLOCKED_ON_CLAIM); // ... the claim (key-share on the Reward) waits ...
      // ... holding nothing Commercial: the account can be locked NOWAIT right now, even by the very
      // transaction that holds the Reward. If the projector took the account first this would be the
      // CORR-002 deadlock cycle (projector: account -> Reward; loyalty: Reward -> account).
      await loyalty.client.query(
        "SELECT 1 FROM commercial_accounts WHERE business_id = $1 FOR UPDATE NOWAIT",
        [b],
      );
      await loyalty.commit();
      const { event } = asProjected(await projecting);
      expect(event.bucketSource).toBe(
        mode === "earmarked" ? "earmark" : "consumption_time_fallback",
      );
      await expectAccountEqualsLedger(b);
    });
  }

  it("redemption-like Reward lock x projection: the projector waits, then completes; the Reward is untouched", async () => {
    const b = await openAccount();
    await fund(b, 2);
    const { rewardId } = await seedReward(b);
    const loyalty = await holdRewardLock(rewardId);
    await loyalty.client.query("UPDATE rewards SET state = 'redeemed' WHERE id = $1", [rewardId]); // the redemption's own write
    const projecting = project(rewardId);
    await waitForBlockedBackend(BLOCKED_ON_CLAIM);
    await loyalty.commit();
    asProjected(await projecting);
    expect(
      (await pool.query("SELECT state FROM rewards WHERE id = $1", [rewardId])).rows[0].state,
    ).toBe("redeemed");
  });

  it("concurrent projection of the same Reward: no 40P01 across repeated rounds", async () => {
    const b = await openAccount();
    await fund(b, 20);
    for (let round = 0; round < 5; round += 1) {
      const { rewardId } = await seedReward(b);
      const results = await Promise.allSettled(Array.from({ length: 6 }, () => project(rewardId)));
      expectNoDeadlock(results);
      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    }
    expect(await consumptionEntries(b)).toHaveLength(5);
    await expectAccountEqualsLedger(b);
  });

  it("concurrent projection of two Rewards of one Business: serialised on the account, no 40P01, consistent totals", async () => {
    const b = await openAccount();
    await fund(b, 6, 6);
    const rewards = await Promise.all(Array.from({ length: 10 }, () => seedReward(b)));
    const results = await Promise.allSettled(rewards.map((r) => project(r.rewardId)));
    expectNoDeadlock(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const a = await accountOf(b);
    expect(a.trialRemainingUnits).toBe(0);
    expect(a.paidBalanceUnits).toBe(2);
    await expectAccountEqualsLedger(b);
    await expectFallbackDecisionsFollowLockedState(b);
    // 6 trial then 4 paid, in strict ledger order.
    const buckets = (await consumptionEntries(b)).map((e) => e.bucket);
    expect(buckets).toEqual([...Array(6).fill("trial"), ...Array(4).fill("paid")]);
  });

  describe("projection racing every Commercial account mutation (no deadlock; fallback decision follows the locked state)", () => {
    const rounds = 3;
    type Racer = {
      name: string;
      setup?: (b: string) => Promise<unknown>;
      race: (b: string, setupResult: unknown) => Promise<unknown>;
    };
    const racers: Racer[] = [
      {
        name: "trial adjustment (down within uncommitted)",
        race: (b) =>
          adjustTrial(d(), ctx(), {
            businessId: b,
            unitsDelta: -1,
            reasonText: "reduce",
            reference: "R",
          }),
      },
      {
        name: "trial adjustment (up)",
        race: (b) =>
          adjustTrial(d(), ctx(), {
            businessId: b,
            unitsDelta: 2,
            reasonText: "add",
            reference: "R",
          }),
      },
      {
        name: "paid credit adjustment",
        race: (b) =>
          adjustCommercialCredit(d(), ctx(), {
            businessId: b,
            unitsDelta: 3,
            reasonCode: "correction",
            reasonText: "operator correction",
            reference: "R",
          }),
      },
      {
        name: "settlement confirmation",
        setup: (b) =>
          recordSettlement(d(), ctx(), {
            businessId: b,
            method: "cash",
            externalReference: `ref-${randomUUID()}`,
            currency: "BIF",
            amountMinor: 2 * BI_PRICE,
            unitsPurchased: 2,
            receivedAt: new Date("2026-04-01T00:00:00Z"),
            reasonText: "received offline",
          }),
        race: (b, s) =>
          confirmSettlement(d(), ctx(), {
            businessId: b,
            settlementId: (s as { result: { settlementId: string } }).result.settlementId,
            confirmationNote: "verified",
          }),
      },
      {
        name: "settlement void",
        setup: async (b) => {
          const rec = await recordSettlement(d(), ctx(), {
            businessId: b,
            method: "cash",
            externalReference: `ref-${randomUUID()}`,
            currency: "BIF",
            amountMinor: 2 * BI_PRICE,
            unitsPurchased: 2,
            receivedAt: new Date("2026-04-01T00:00:00Z"),
            reasonText: "received offline",
          });
          await confirmSettlement(d(), ctx(), {
            businessId: b,
            settlementId: rec.result.settlementId,
            confirmationNote: "verified",
          });
          return rec;
        },
        race: (b, s) =>
          voidSettlement(d(), ctx(), {
            businessId: b,
            settlementId: (s as { result: { settlementId: string } }).result.settlementId,
            reasonText: "bounced",
            reference: "R",
          }),
      },
      {
        name: "restriction",
        race: (b) =>
          restrictNewStarts(d(), ctx(), { businessId: b, reasonText: "overdue", reference: "R" }),
      },
      {
        name: "restoration",
        setup: (b) =>
          restrictNewStarts(d(), ctx(), { businessId: b, reasonText: "overdue", reference: "R" }),
        race: (b) =>
          restoreCommercialStanding(d(), ctx(), { businessId: b, reasonText: "paid up" }),
      },
    ];

    for (const racer of racers) {
      it(`x ${racer.name}`, async () => {
        for (let round = 0; round < rounds; round += 1) {
          const b = await openAccount();
          await fund(b, 3, 1);
          const s = racer.setup ? await racer.setup(b) : undefined;
          const rewards = await Promise.all(Array.from({ length: 4 }, () => seedReward(b)));
          const results = await Promise.allSettled([
            ...rewards.map((r) => project(r.rewardId)),
            racer.race(b, s),
          ]);
          expectNoDeadlock(results);
          // Every projection must succeed: an earned Reward never fails because of a concurrent mutation.
          results.slice(0, 4).forEach((r) => expect(r.status).toBe("fulfilled"));
          // The racing command either committed or was refused by its own domain rule -- never a lock failure.
          const command = results[4];
          if (command.status === "rejected") {
            expect((command.reason as Error).name).toBe("CommercialDomainError");
          }
          expect(await consumptionEntries(b)).toHaveLength(4);
          expect(await listConsumptionEventsForBusiness(pool, b)).toHaveLength(4);
          await expectAccountEqualsLedger(b);
          await expectFallbackDecisionsFollowLockedState(b);
        }
      });
    }
  });
});

// ===========================================================================
describe("BOUNDARY — Commercial reads Loyalty and never writes it", () => {
  it("projection and reconciliation cause ZERO Loyalty writes: every Loyalty table row and xmin is unchanged", async () => {
    const b = await openAccount();
    await fund(b, 2, 2);
    const seeded = await Promise.all(Array.from({ length: 4 }, () => seedReward(b)));
    // Redemption-shaped state changes made by the fixture BEFORE the snapshot.
    await pool.query("UPDATE rewards SET state = 'redeemed' WHERE id = $1", [seeded[0].rewardId]);
    const before = await loyaltySnapshot();

    asProjected(await project(seeded[0].rewardId));
    await project(seeded[0].rewardId); // duplicate
    await reconcileCommercialConsumption(pool, { correlationId: CORR, businessId: b });
    await reconcileCommercialConsumption(pool, { correlationId: CORR, businessId: b });
    await getConsumptionProjectionMetrics(pool);

    expect(await loyaltySnapshot()).toEqual(before);
    expect(await consumptionEntries(b)).toHaveLength(4);
  });

  it("a failed projection also leaves Loyalty untouched", async () => {
    const b = await openAccount();
    await fund(b, 2);
    const { rewardId } = await seedReward(b);
    const before = await loyaltySnapshot();
    await expect(
      project(rewardId, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow(/boom/);
    expect(await loyaltySnapshot()).toEqual(before);
  });

  it("the projector takes no row lock on any Loyalty table beyond the claim's key-share: a Loyalty writer is never blocked by an in-flight projection", async () => {
    const b = await openAccount();
    await fund(b, 2);
    const { rewardId, cycleId } = await seedReward(b);
    const holder = await holdAccountLock(b); // keep the projector parked AFTER its claim
    const projecting = project(rewardId);
    await waitForBlockedBackend(BLOCKED_ON_ACCOUNT);
    // The claim's FOR KEY SHARE on the Reward does not conflict with a redemption's UPDATE (non-key columns),
    // and no lock at all exists on the Cycle, Stream or Program.
    const loyalty = await begin();
    await loyalty.client.query("SET LOCAL lock_timeout = '1s'");
    await loyalty.client.query("UPDATE rewards SET state = 'redeemed' WHERE id = $1", [rewardId]);
    await loyalty.client.query("SELECT 1 FROM loyalty_cycles WHERE id = $1 FOR UPDATE", [cycleId]);
    await loyalty.client.query(
      "SELECT 1 FROM loyalty_cycle_streams s JOIN loyalty_cycles c USING (business_id, customer_identity_id, reward_program_id) WHERE c.id = $1 FOR UPDATE OF s",
      [cycleId],
    );
    await loyalty.commit();
    await holder.commit();
    asProjected(await projecting);
  });

  it("consumption is keyed to the Reward/Circle, not to redemption: no Loyalty table has a trigger or reference into Commercial", async () => {
    const triggers = await pool.query(
      `SELECT c.relname, t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
        WHERE NOT t.tgisinternal AND c.relname = ANY($1::text[]) AND t.tgfoid::regproc::text LIKE 'commercial%'`,
      [LOYALTY_TABLES_SNAPSHOT],
    );
    expect(triggers.rows).toEqual([]);
    const inbound = await pool.query(
      `SELECT conrelid::regclass::text AS child FROM pg_constraint
        WHERE contype = 'f' AND confrelid::regclass::text LIKE 'commercial\\_%'
          AND conrelid::regclass::text NOT LIKE 'commercial\\_%'`,
    );
    expect(inbound.rows).toEqual([]);
  });
});
