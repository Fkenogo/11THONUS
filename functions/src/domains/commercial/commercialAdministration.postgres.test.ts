/**
 * WP-COM-03 — Commercial manual administration commands: real PostgreSQL tests.
 *
 *   PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *     npx vitest run --config vitest.postgres.config.ts commercialAdministration
 *
 * Same isolation model as the WP-COM-01/02 suites: Commercial rows are
 * immutable, so every test uses its own Business id and the file drops the
 * Commercial objects before and after.
 *
 * ALL price values are TEST-ONLY fixtures, not BIF/RWF launch prices.
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
import { migrateUp } from "../../infrastructure/postgres/migrationRunner";
import { withPlatformTransaction } from "../../infrastructure/postgres/postgresTransaction";
import {
  getCommercialAccount,
  insertCommercialAccount,
} from "./repositories/commercialAccountRepository";
import { listLedgerEntries, sumLedger } from "./repositories/commercialLedgerRepository";
import { listCommercialAuditEventsForBusiness } from "./repositories/commercialAuditRepository";
import {
  listManualAdjustments,
  listTrialGrants,
} from "./repositories/commercialProvenanceRepository";
import { getSettlement } from "./repositories/commercialSettlementRepository";
import { listStandingEvents } from "./repositories/commercialStandingRepository";
import { postCommercialLedgerEntry } from "./services/postCommercialLedgerEntry";
import { setPriceSchedule } from "./services/setPriceSchedule";
import { recordSettlement } from "./services/recordSettlement";
import { confirmSettlement } from "./services/confirmSettlement";
import { openCommercialAccount } from "./services/openCommercialAccount";
import { grantTrial } from "./services/grantTrial";
import { adjustTrial } from "./services/adjustTrial";
import { adjustCommercialCredit } from "./services/adjustCommercialCredit";
import { activatePaidService } from "./services/activatePaidService";
import { restoreCommercialStanding, restrictNewStarts } from "./services/commercialRestriction";
import { voidSettlement } from "./services/voidSettlement";
import type {
  CommercialCommandContext,
  CommercialCommandDeps,
} from "./services/commercialAdministratorCommand";
import type { CommercialMarket } from "./models/commercialFoundation";
import { CommercialDomainError } from "./models/commercialErrors";
import type { ErrorCategory } from "../../shared/errors/errorCategories";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "..", "infrastructure", "postgres", "migrations");

let pool: PlatformPostgresPool;
let startedFromEmptyDatabase = false;

const COMMERCIAL_TABLES = [
  "commercial_admission_blocks",
  "commercial_admissions",
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
    "commercial_trial_grants_guard",
    "commercial_manual_adjustments_guard",
    "commercial_settlements_update_guard",
    "commercial_ledger_reject_cancelled_settlement_reference",
    "commercial_settlements_insert_guard",
    "commercial_assert_account_matches_ledger",
    "commercial_price_schedules_versioning",
    "commercial_accounts_guard",
    "commercial_consumption_claims_require_event",
    "commercial_consumption_events_ledger_guard",
    "commercial_consumption_claims_reward_business_guard",
    "commercial_admission_assert_consistent",
    "commercial_consumption_events_earmark_guard",
    "commercial_reject_mutation",
    "wpcom03_fail_grant_audit",
  ]) {
    await pool.query(`DROP FUNCTION IF EXISTS ${fn}() CASCADE`);
  }
  const hasMigrations = await pool.query("SELECT to_regclass('public.schema_migrations') AS t");
  if (hasMigrations.rows[0].t !== null) {
    await pool.query(
      "DELETE FROM schema_migrations WHERE version IN ('0021', '0022', '0023', '0024', '0025', '0026', '0027')",
    );
    await pool
      .query("DELETE FROM idempotency_keys WHERE idempotency_key LIKE 'wpcom03-%'")
      .catch(() => {});
  }
}

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
  // One TEST-ONLY BI schedule so settlements can be recorded (never a launch price).
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
  if (startedFromEmptyDatabase) {
    await pool.query("DROP SCHEMA public CASCADE");
    await pool.query("CREATE SCHEMA public");
  }
  await closePostgresPool(pool);
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const ts = (iso: string) => ({ toDate: () => new Date(iso) });
const adminRecord = (overrides: Record<string, unknown> = {}) => ({
  roles: ["knowledge_editor"],
  status: "active",
  mfaRequired: true,
  invitedBy: "founder",
  createdAt: ts("2026-01-01T00:00:00Z"),
  updatedAt: ts("2026-01-01T00:00:00Z"),
  schemaVersion: 1,
  ...overrides,
});
const ADMIN = "founder-uid";
const OTHER_ADMIN = "second-admin-uid";
const records: Record<string, unknown> = {
  [ADMIN]: adminRecord(),
  [OTHER_ADMIN]: adminRecord(),
  "inactive-admin": adminRecord({ status: "suspended" }),
  "business-owner-uid": undefined,
  "business-manager-uid": undefined,
  "business-staff-uid": undefined,
};
const NOW = new Date("2026-07-01T00:00:00Z");
const BI_PRICE = 1000; // TEST-ONLY
const d = (): CommercialCommandDeps => ({
  pool,
  readAdministratorRecord: async (uid) => records[uid],
  now: () => NOW,
});
const key = () => `wpcom03-${randomUUID()}`;
const ctx = (overrides: Partial<CommercialCommandContext> = {}): CommercialCommandContext => ({
  adminUserId: ADMIN,
  verifiedMfaSatisfied: true,
  idempotencyKey: key(),
  correlationId: "corr-wpcom03",
  ...overrides,
});
const newBusiness = () => `biz-${randomUUID()}`;

async function openAccount(market: CommercialMarket = "BI", businessId = newBusiness()) {
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

async function expectDomainError(
  promise: Promise<unknown>,
  category: ErrorCategory,
  pattern?: RegExp,
) {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, "expected a CommercialDomainError").toBeInstanceOf(CommercialDomainError);
  expect((caught as CommercialDomainError).category).toBe(category);
  if (pattern) expect((caught as Error).message).toMatch(pattern);
}

async function expectPgFailure(promise: Promise<unknown>, pattern: RegExp) {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, "expected the statement to be rejected").toBeDefined();
  expect((caught as Error).message).toMatch(pattern);
}

const count = async (sql: string, params: unknown[] = []) =>
  (await pool.query<{ n: number }>(sql, params)).rows[0].n;

const grant = (businessId: string, units: number, overrides: Record<string, unknown> = {}) =>
  grantTrial(d(), ctx(), {
    businessId,
    units,
    reasonText: "launch onboarding allowance",
    reference: "REF-GRANT",
    ...overrides,
  } as Parameters<typeof grantTrial>[2]);

const creditAdjust = (
  businessId: string,
  unitsDelta: number,
  overrides: Record<string, unknown> = {},
  context = ctx(),
) =>
  adjustCommercialCredit(d(), context, {
    businessId,
    unitsDelta,
    reasonCode: "correction",
    reasonText: "operator correction",
    reference: "REF-ADJ",
    ...overrides,
  } as Parameters<typeof adjustCommercialCredit>[2]);

/** A confirmed BI settlement of `units` units (evidence recorded, then finalised through the WP-COM-02 flow). */
async function confirmedSettlement(businessId: string, units = 3) {
  const rec = await recordSettlement(d(), ctx(), {
    businessId,
    method: "bank_transfer",
    externalReference: `ref-${randomUUID()}`,
    currency: "BIF",
    amountMinor: units * BI_PRICE,
    unitsPurchased: units,
    receivedAt: new Date("2026-04-01T00:00:00Z"),
    reasonText: "received offline",
  });
  const conf = await confirmSettlement(d(), ctx(), {
    businessId,
    settlementId: rec.result.settlementId,
    confirmationNote: "verified",
  });
  return { settlementId: rec.result.settlementId, confirmation: conf.result };
}

async function recordedSettlement(businessId: string, units = 3) {
  const rec = await recordSettlement(d(), ctx(), {
    businessId,
    method: "cash",
    externalReference: `ref-${randomUUID()}`,
    currency: "BIF",
    amountMinor: units * BI_PRICE,
    unitsPurchased: units,
    receivedAt: new Date("2026-04-01T00:00:00Z"),
    reasonText: "received offline",
  });
  return rec.result.settlementId;
}

// ===========================================================================
describe("OPEN — openCommercialAccount", () => {
  const openDeps = (country: string | null) => ({
    ...d(),
    resolveBusinessCountry: async () => country,
  });

  it("opens a ZERO-state account seeded from the Business country, with standing event and audit; grants nothing", async () => {
    const pricesBefore = await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules");
    for (const [country, market] of [
      ["BI", "BI"],
      ["RW", "RW"],
    ] as const) {
      const businessId = newBusiness();
      const res = await openCommercialAccount(openDeps(country), ctx(), {
        businessId,
        reasonText: "onboarding",
      });
      expect(res.replayed).toBe(false);
      expect(res.result).toMatchObject({ businessId, settlementMarket: market, version: 0 });
      expect(res.result.commercialEffectiveFrom).toBe(NOW.toISOString());

      expect(await getCommercialAccount(pool, businessId)).toMatchObject({
        settlementMarket: market,
        trialRemainingUnits: 0,
        paidBalanceUnits: 0,
        trialReservedUnits: 0,
        paidReservedUnits: 0,
        serviceRestriction: "none",
        paidServiceActivatedAt: null,
        version: 0,
      });
      // Nothing implicit: no ledger, no grant, no adjustment, no settlement.
      expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
      expect(await listTrialGrants(pool, businessId)).toHaveLength(0);
      expect(await listManualAdjustments(pool, businessId)).toHaveLength(0);
      const standing = await listStandingEvents(pool, businessId);
      expect(standing.map((e) => e.eventType)).toEqual(["account_opened"]);
      const audit = await listCommercialAuditEventsForBusiness(pool, businessId);
      expect(audit).toHaveLength(1);
      expect(audit[0]).toMatchObject({
        actorId: ADMIN,
        actionType: "account_opened",
        targetId: businessId,
        result: "succeeded",
        reasonText: "onboarding",
      });
    }
    // No price was set or invented.
    expect(await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules")).toBe(
      pricesBefore,
    );
  });

  it("refuses an unknown Business and any non-launch market; writes nothing", async () => {
    const missing = newBusiness();
    await expectDomainError(
      openCommercialAccount(openDeps(null), ctx(), { businessId: missing, reasonText: "x" }),
      "RESOURCE_NOT_FOUND",
    );
    const kenyan = newBusiness();
    await expectDomainError(
      openCommercialAccount(openDeps("KE"), ctx(), { businessId: kenyan, reasonText: "x" }),
      "VALIDATION_FAILED",
      /launch markets/,
    );
    await expectDomainError(
      openCommercialAccount(openDeps("BI"), ctx(), { businessId: newBusiness(), reasonText: " " }),
      "VALIDATION_FAILED",
    );
    for (const id of [missing, kenyan]) expect(await getCommercialAccount(pool, id)).toBeNull();
  });

  it("is replay-safe with the same key; a new key on an existing account is refused and audited denied", async () => {
    const businessId = newBusiness();
    const c = ctx();
    const input = { businessId, reasonText: "onboarding" };
    const a = await openCommercialAccount(openDeps("BI"), c, input);
    const b = await openCommercialAccount(openDeps("BI"), c, input);
    expect(b.replayed).toBe(true);
    expect(b.result).toEqual(a.result);
    await expectDomainError(
      openCommercialAccount(openDeps("BI"), ctx(), input),
      "INVALID_STATE_TRANSITION",
      /already exists/,
    );
    expect(await listStandingEvents(pool, businessId)).toHaveLength(1);
    const audit = await listCommercialAuditEventsForBusiness(pool, businessId);
    expect(audit.map((e) => e.result).sort()).toEqual(["denied", "succeeded"]);
  });
});

describe("OPEN — concurrency", () => {
  it("concurrent opens of one Business under different keys create exactly one account", async () => {
    const businessId = newBusiness();
    const openDeps = { ...d(), resolveBusinessCountry: async () => "RW" };
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        openCommercialAccount(openDeps, ctx(), { businessId, reasonText: "onboarding" }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) {
      if (r.status === "rejected") {
        expect((r.reason as CommercialDomainError).category).toBe("INVALID_STATE_TRANSITION");
      }
    }
    expect(await listStandingEvents(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.settlementMarket).toBe("RW");
  });
});

// ===========================================================================
describe("TRIAL — grantTrial", () => {
  it.each([3, 4, 5])(
    "accepts an explicit grant of %i units: ledger-backed, provenance row, audit",
    async (units) => {
      const { businessId } = await openAccount();
      const res = await grant(businessId, units);
      expect(res.replayed).toBe(false);
      expect(res.result).toMatchObject({
        units,
        trialRemainingAfter: units,
        ledgerAccountVersion: 1,
        priorGrants: [],
      });

      const ledger = await listLedgerEntries(pool, businessId);
      expect(ledger).toHaveLength(1);
      expect(ledger[0]).toMatchObject({
        id: res.result.ledgerEntryId,
        entryType: "trial_grant",
        bucket: "trial",
        unitsDelta: units,
        sourceReferenceType: "trial_grant",
        sourceReferenceId: res.result.grantId,
        createdBy: ADMIN,
      });
      const account = await getCommercialAccount(pool, businessId);
      expect(account).toMatchObject({
        trialRemainingUnits: units,
        paidBalanceUnits: 0,
        version: 1,
      });
      expect((await sumLedger(pool, businessId)).trialRemainingUnits).toBe(units);

      const grants = await listTrialGrants(pool, businessId);
      expect(grants).toHaveLength(1);
      expect(grants[0]).toMatchObject({
        kind: "initial",
        units,
        grantedBy: ADMIN,
        reference: "REF-GRANT",
        ledgerEntryId: res.result.ledgerEntryId,
      });
      const audit = (await listCommercialAuditEventsForBusiness(pool, businessId)).find(
        (e) => e.actionType === "trial_granted",
      );
      expect(audit).toMatchObject({
        actorId: ADMIN,
        targetId: res.result.grantId,
        businessId,
        reference: "REF-GRANT",
        result: "succeeded",
        ledgerEntryId: res.result.ledgerEntryId,
        beforeSnapshot: { trialRemainingUnits: 0, accountVersion: 0, priorGrantCount: 0 },
        afterSnapshot: { trialRemainingUnits: units, accountVersion: 1, grantedUnits: units },
      });
    },
  );

  it("rejects units outside 3..5, non-integers and a missing value: there is NO default", async () => {
    const { businessId } = await openAccount();
    for (const units of [0, 1, 2, 6, 10, -3, 3.5, Number.NaN, undefined, "4", null]) {
      await expectDomainError(
        grantTrial(d(), ctx(), {
          businessId,
          units: units as unknown as number,
          reasonText: "x",
          reference: "r",
        }),
        "VALIDATION_FAILED",
        /from 3 to 5/,
      );
    }
    expect(await listTrialGrants(pool, businessId)).toHaveLength(0);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    expect((await getCommercialAccount(pool, businessId))?.trialRemainingUnits).toBe(0);
  });

  it("requires reason and reference, and an existing account", async () => {
    const { businessId } = await openAccount();
    await expectDomainError(grant(businessId, 3, { reasonText: " " }), "VALIDATION_FAILED");
    await expectDomainError(grant(businessId, 3, { reference: "" }), "VALIDATION_FAILED");
    await expectDomainError(grant(newBusiness(), 3), "RESOURCE_NOT_FOUND");
    expect(await listTrialGrants(pool, businessId)).toHaveLength(0);
  });

  it("a duplicate command (same key) replays without a second grant", async () => {
    const { businessId } = await openAccount();
    const c = ctx();
    const input = { businessId, units: 4, reasonText: "onboarding", reference: "R1" };
    const a = await grantTrial(d(), c, input);
    const b = await grantTrial(d(), c, input);
    expect(b.replayed).toBe(true);
    expect(b.result).toEqual(a.result);
    expect(await listTrialGrants(pool, businessId)).toHaveLength(1);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.trialRemainingUnits).toBe(4);
  });

  it("3..5 is per grant, not a lifetime cap: further grants are allowed, prior grants are surfaced, never blocking", async () => {
    const { businessId } = await openAccount();
    await grant(businessId, 5);
    const second = await grant(businessId, 5, { reference: "REF-2" });
    expect(second.result.priorGrants).toHaveLength(1);
    expect(second.result.priorGrants[0].units).toBe(5);
    const third = await grant(businessId, 3, { reference: "REF-3" });
    expect(third.result.priorGrants).toHaveLength(2);
    // Cumulative trial (13) exceeds any single-grant limit: no lifetime cap is encoded.
    expect((await getCommercialAccount(pool, businessId))?.trialRemainingUnits).toBe(13);
    expect(await listTrialGrants(pool, businessId)).toHaveLength(3);
  });

  it("the database itself enforces 3..5 per grant, backing by a matching ledger entry, and immutability", async () => {
    const { businessId } = await openAccount();
    const ok = await grant(businessId, 3);
    // A ledger entry that satisfies the backing guard, so ONLY the range CHECK can reject the row.
    const forgedGrant = async (units: number) => {
      const id = randomUUID();
      const posted = await withPlatformTransaction(pool, (tx) =>
        postCommercialLedgerEntry(tx, {
          businessId,
          entryType: "trial_grant",
          bucket: "trial",
          unitsDelta: units,
          sourceReference: { type: "trial_grant", id },
          idempotencyScopeKey: `forged-${randomUUID()}`,
          createdBy: "x",
          correlationId: "c",
        }),
      );
      return pool.query(
        `INSERT INTO commercial_trial_grants
           (id, business_id, kind, units, granted_by, reason_text, reference, ledger_entry_id, idempotency_key, correlation_id)
         VALUES ($1,$2,'initial',$3,'x','r','ref',$4,$5,'c')`,
        [id, businessId, units, posted.entry.id, key()],
      );
    };
    await expectPgFailure(forgedGrant(6), /commercial_trial_grants_units_check|violates check/i);
    await expectPgFailure(forgedGrant(2), /commercial_trial_grants_units_check|violates check/i);
    await forgedGrant(5); // control: a valid-range grant with matching backing is accepted

    // Re-using an existing grant's ledger entry, or a grant with no matching entry, is refused.
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_trial_grants
           (id, business_id, kind, units, granted_by, reason_text, reference, ledger_entry_id, idempotency_key, correlation_id)
         VALUES (gen_random_uuid(),$1,'initial',3,'x','r','ref',$2,$3,'c')`,
        [businessId, ok.result.ledgerEntryId, key()],
      ),
      /must be backed by/,
    );
    await expectPgFailure(
      pool.query("UPDATE commercial_trial_grants SET units = 4 WHERE business_id = $1", [
        businessId,
      ]),
      /append-only and immutable/,
    );
    await expectPgFailure(
      pool.query("DELETE FROM commercial_trial_grants WHERE business_id = $1", [businessId]),
      /append-only and immutable/,
    );
    await expectPgFailure(
      pool.query("TRUNCATE commercial_trial_grants"),
      /append-only and immutable|cannot truncate/,
    );
  });

  it("schema: no per-Business uniqueness, no default on units, and no tier/plan concept", async () => {
    const constraints = await pool.query<{ def: string }>(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE conrelid = 'commercial_trial_grants'::regclass`,
    );
    const all = constraints.rows.map((r) => r.def).join("\n");
    expect(all).toMatch(/units >= 3\) AND \(units <= 5\)|BETWEEN 3 AND 5/i);
    expect(all).not.toMatch(/UNIQUE \(business_id\)/);
    const cols = await pool.query<{ column_name: string; column_default: string | null }>(
      `SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'commercial_trial_grants'`,
    );
    expect(cols.rows.find((c) => c.column_name === "units")?.column_default).toBeNull();
    for (const c of cols.rows) expect(c.column_name).not.toMatch(/tier|plan|subscription/i);
  });
});

// ===========================================================================
describe("TRIAL — adjustTrial", () => {
  const adjust = (
    businessId: string,
    unitsDelta: number,
    overrides: Record<string, unknown> = {},
  ) =>
    adjustTrial(d(), ctx(), {
      businessId,
      unitsDelta,
      reasonText: "support-led adjustment",
      reference: "REF-TADJ",
      ...overrides,
    } as Parameters<typeof adjustTrial>[2]);

  it("applies an explicit signed adjustment: ledger-backed, provenance row, audit with before/after", async () => {
    const { businessId } = await openAccount();
    await grant(businessId, 4);
    const up = await adjust(businessId, 2, { reasonCode: "support_top_up" });
    expect(up.result).toMatchObject({
      unitsDelta: 2,
      trialRemainingAfter: 6,
      ledgerAccountVersion: 2,
    });
    const down = await adjust(businessId, -3);
    expect(down.result).toMatchObject({
      unitsDelta: -3,
      trialRemainingAfter: 3,
      ledgerAccountVersion: 3,
    });

    const ledger = await listLedgerEntries(pool, businessId);
    expect(ledger.map((e) => [e.entryType, e.unitsDelta])).toEqual([
      ["trial_grant", 4],
      ["trial_adjustment", 2],
      ["trial_adjustment", -3],
    ]);
    expect(ledger[1]).toMatchObject({
      bucket: "trial",
      sourceReferenceType: "manual_adjustment",
      sourceReferenceId: up.result.adjustmentId,
    });
    const adjustments = await listManualAdjustments(pool, businessId);
    expect(adjustments.map((a) => [a.bucket, a.unitsDelta])).toEqual([
      ["trial", 2],
      ["trial", -3],
    ]);
    const audit = (await listCommercialAuditEventsForBusiness(pool, businessId)).filter(
      (e) => e.actionType === "trial_adjusted",
    );
    expect(audit).toHaveLength(2);
    const downAudit = audit.find((e) => e.targetId === down.result.adjustmentId);
    expect(downAudit).toMatchObject({
      reference: "REF-TADJ",
      result: "succeeded",
      ledgerEntryId: down.result.ledgerEntryId,
      beforeSnapshot: { trialRemainingUnits: 6, accountVersion: 2 },
      afterSnapshot: { trialRemainingUnits: 3, accountVersion: 3, unitsDelta: -3 },
    });
    // The paid bucket is untouched by a trial adjustment.
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(0);
  });

  it("requires a reason, a reference and a non-zero whole change", async () => {
    const { businessId } = await openAccount();
    await grant(businessId, 3);
    await expectDomainError(adjust(businessId, 1, { reasonText: " " }), "VALIDATION_FAILED");
    await expectDomainError(adjust(businessId, 1, { reference: "" }), "VALIDATION_FAILED");
    await expectDomainError(adjust(businessId, 0), "VALIDATION_FAILED");
    await expectDomainError(adjust(businessId, 1.5), "VALIDATION_FAILED");
    await expectDomainError(adjust(businessId, 1, { reasonCode: "Bad Code" }), "VALIDATION_FAILED");
    await expectDomainError(adjust(newBusiness(), 1), "RESOURCE_NOT_FOUND");
    expect(await listManualAdjustments(pool, businessId)).toHaveLength(0);
  });

  it("cannot take trial below zero or below trial already reserved for admitted Circles; reserved capacity stays untouched", async () => {
    const { businessId } = await openAccount();
    await grant(businessId, 5);
    // Simulate 3 trial units earmarked to admitted Circles (reservation behaviour itself is a later WP).
    await withPlatformTransaction(pool, (tx) =>
      postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "capacity_reserved",
        bucket: "trial",
        unitsDelta: 0,
        trialReservedDelta: 3,
        idempotencyScopeKey: `scope-${randomUUID()}`,
        createdBy: "system:test",
        correlationId: "c",
      }),
    );
    // Only 2 uncommitted units (5 - 3) may be removed.
    await expectDomainError(adjust(businessId, -3), "VALIDATION_FAILED", /only 2 uncommitted/);
    await expectDomainError(adjust(businessId, -5), "VALIDATION_FAILED", /reserved/);
    const ok = await adjust(businessId, -2);
    expect(ok.result.trialRemainingAfter).toBe(3);
    const account = await getCommercialAccount(pool, businessId);
    expect(account).toMatchObject({ trialRemainingUnits: 3, trialReservedUnits: 3 });
    await expectDomainError(adjust(businessId, -1), "VALIDATION_FAILED", /only 0 uncommitted/);
    // Upward is always possible and does not move the reserved amount.
    await adjust(businessId, 4);
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      trialRemainingUnits: 7,
      trialReservedUnits: 3,
    });
  });

  it("cannot go below zero on an unreserved account", async () => {
    const { businessId } = await openAccount();
    await grant(businessId, 3);
    await expectDomainError(adjust(businessId, -4), "VALIDATION_FAILED", /only 3 uncommitted/);
    await adjust(businessId, -3);
    expect((await getCommercialAccount(pool, businessId))?.trialRemainingUnits).toBe(0);
    await expectDomainError(adjust(businessId, -1), "VALIDATION_FAILED");
  });

  it("encodes NO aggregate or lifetime ceiling in either direction (structural fact, not an authorisation of unlimited adjustment)", async () => {
    const { businessId } = await openAccount();
    await grant(businessId, 3);
    // A very large but well-formed adjustment is not rejected by any encoded limit.
    const big = await adjust(businessId, 1_000_000, { reference: "REF-LARGE" });
    expect(big.result.trialRemainingAfter).toBe(1_000_003);
    const defs = await pool.query<{ def: string }>(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE contype = 'c' AND conrelid = 'commercial_manual_adjustments'::regclass`,
    );
    const all = defs.rows.map((r) => r.def).join("\n");
    expect(all).not.toMatch(/units_delta\s*(<=|>=|<|>)\s*-?\d/);
    // Every adjustment remains an individually attributable, reasoned, audited act.
    const audit = (await listCommercialAuditEventsForBusiness(pool, businessId)).find(
      (e) => e.targetId === big.result.adjustmentId,
    );
    expect(audit).toMatchObject({
      reasonText: "support-led adjustment",
      reference: "REF-LARGE",
      actorId: ADMIN,
    });
  });

  it("duplicate command replays; the same key for a different Business conflicts", async () => {
    const a = (await openAccount()).businessId;
    const b = (await openAccount()).businessId;
    const c = ctx();
    const input = { businessId: a, unitsDelta: 2, reasonText: "x", reference: "r" };
    const first = await adjustTrial(d(), c, input);
    const again = await adjustTrial(d(), c, input);
    expect(again.replayed).toBe(true);
    expect(again.result).toEqual(first.result);
    expect(await listManualAdjustments(pool, a)).toHaveLength(1);
    await expectDomainError(
      adjustTrial(d(), c, { ...input, businessId: b }),
      "IDEMPOTENCY_CONFLICT",
    );
    expect(await listManualAdjustments(pool, b)).toHaveLength(0);
  });
});

// ===========================================================================
describe("CREDIT — adjustCommercialCredit", () => {
  it("applies positive and negative signed adjustments through the ledger, with provenance and audit", async () => {
    const { businessId } = await openAccount();
    const up = await creditAdjust(businessId, 5);
    expect(up.result).toMatchObject({
      unitsDelta: 5,
      paidBalanceAfter: 5,
      ledgerAccountVersion: 1,
    });
    const down = await creditAdjust(businessId, -3, { reasonCode: "dispute_resolution" });
    expect(down.result).toMatchObject({ paidBalanceAfter: 2, ledgerAccountVersion: 2 });

    const ledger = await listLedgerEntries(pool, businessId);
    expect(ledger.map((e) => [e.entryType, e.bucket, e.unitsDelta, e.reasonCode])).toEqual([
      ["credit_adjustment", "paid", 5, "correction"],
      ["credit_adjustment", "paid", -3, "dispute_resolution"],
    ]);
    expect(ledger[0]).toMatchObject({
      sourceReferenceType: "manual_adjustment",
      sourceReferenceId: up.result.adjustmentId,
    });
    expect((await sumLedger(pool, businessId)).paidBalanceUnits).toBe(2);
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      paidBalanceUnits: 2,
      trialRemainingUnits: 0,
    });

    const adj = await listManualAdjustments(pool, businessId);
    expect(adj[1]).toMatchObject({
      bucket: "paid",
      unitsDelta: -3,
      reasonCode: "dispute_resolution",
      reference: "REF-ADJ",
      createdBy: ADMIN,
    });
    const audit = (await listCommercialAuditEventsForBusiness(pool, businessId)).find(
      (e) => e.targetId === down.result.adjustmentId,
    );
    expect(audit).toMatchObject({
      actionType: "credit_adjusted",
      reasonCode: "dispute_resolution",
      reference: "REF-ADJ",
      ledgerEntryId: down.result.ledgerEntryId,
      beforeSnapshot: { paidBalanceUnits: 5, accountVersion: 1 },
      afterSnapshot: { paidBalanceUnits: 2, accountVersion: 2, unitsDelta: -3 },
    });
  });

  it("allows a negative paid balance with NO floor and NO maximum, and it recovers by a later credit", async () => {
    const { businessId } = await openAccount();
    await creditAdjust(businessId, 2);
    const neg = await creditAdjust(businessId, -10);
    expect(neg.result.paidBalanceAfter).toBe(-8);
    const deeper = await creditAdjust(businessId, -100_000);
    expect(deeper.result.paidBalanceAfter).toBe(-100_008);
    const recovered = await creditAdjust(businessId, 100_020, { reasonCode: "error_reversal" });
    expect(recovered.result.paidBalanceAfter).toBe(12);
    const defs = await pool.query<{ def: string }>(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE contype = 'c' AND conrelid IN ('commercial_manual_adjustments'::regclass, 'commercial_accounts'::regclass)`,
    );
    expect(defs.rows.map((r) => r.def).join("\n")).not.toMatch(/paid_balance_units\s*>=?\s*-?\d/);
  });

  it("requires a closed-vocabulary reason code, reason text and reference; complimentary-style codes do not exist", async () => {
    const { businessId } = await openAccount();
    for (const reasonCode of [
      "complimentary",
      "pilot",
      "partner",
      "promotional",
      "",
      "Correction",
    ]) {
      await expectDomainError(
        creditAdjust(businessId, 1, { reasonCode }),
        "VALIDATION_FAILED",
        /reasonCode must be one of/,
      );
    }
    for (const code of [
      "correction",
      "settlement_reconciliation",
      "dispute_resolution",
      "error_reversal",
    ]) {
      await creditAdjust(businessId, 1, { reasonCode: code });
    }
    await expectDomainError(creditAdjust(businessId, 1, { reasonText: " " }), "VALIDATION_FAILED");
    await expectDomainError(creditAdjust(businessId, 1, { reference: "" }), "VALIDATION_FAILED");
    await expectDomainError(creditAdjust(businessId, 0), "VALIDATION_FAILED");
    await expectDomainError(creditAdjust(businessId, 0.5), "VALIDATION_FAILED");
    // The database enforces the vocabulary too (ledger backing crafted so only the CHECK can reject).
    const forgedId = randomUUID();
    const backing = await withPlatformTransaction(pool, (tx) =>
      postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "credit_adjustment",
        bucket: "paid",
        unitsDelta: 1,
        sourceReference: { type: "manual_adjustment", id: forgedId },
        idempotencyScopeKey: `forged-${randomUUID()}`,
        createdBy: "x",
        correlationId: "c",
      }),
    );
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_manual_adjustments
           (id, business_id, bucket, units_delta, reason_code, reason_text, reference, created_by,
            ledger_entry_id, idempotency_key, correlation_id)
         VALUES ($1,$2,'paid',1,'complimentary','r','r','x',$3,$4,'c')`,
        [forgedId, businessId, backing.entry.id, key()],
      ),
      /commercial_manual_adjustments_paid_reason_code|violates check/,
    );
    expect(await listManualAdjustments(pool, businessId)).toHaveLength(4);
  });

  it("refuses an adjustment that would leave the 32-bit counter range (technical bound only)", async () => {
    const { businessId } = await openAccount();
    await creditAdjust(businessId, 2_000_000_000);
    await expectDomainError(
      creditAdjust(businessId, 2_000_000_000),
      "VALIDATION_FAILED",
      /supported whole-number range/,
    );
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(2_000_000_000);
  });

  it("duplicate key replays safely; cross-Business, cross-actor, cross-command and payload reuse of a key conflict", async () => {
    const a = (await openAccount()).businessId;
    const b = (await openAccount()).businessId;
    const c = ctx();
    const first = await creditAdjust(a, 4, {}, c);
    const again = await creditAdjust(a, 4, {}, c);
    expect(again.replayed).toBe(true);
    expect(again.result).toEqual(first.result);
    expect(await listManualAdjustments(pool, a)).toHaveLength(1);

    await expectDomainError(creditAdjust(b, 4, {}, c), "IDEMPOTENCY_CONFLICT"); // other Business
    await expectDomainError(creditAdjust(a, 5, {}, c), "IDEMPOTENCY_CONFLICT"); // other payload
    await expectDomainError(
      creditAdjust(a, 4, {}, { ...c, adminUserId: OTHER_ADMIN }),
      "IDEMPOTENCY_CONFLICT",
    ); // other actor
    await expectDomainError(
      adjustTrial(d(), c, { businessId: a, unitsDelta: 4, reasonText: "x", reference: "r" }),
      "IDEMPOTENCY_CONFLICT",
    ); // other command
    expect(await listManualAdjustments(pool, b)).toHaveLength(0);
    expect((await getCommercialAccount(pool, a))?.paidBalanceUnits).toBe(4);
    await expectDomainError(creditAdjust(newBusiness(), 1), "RESOURCE_NOT_FOUND");
  });

  it("concurrent duplicates (same key) apply once; concurrent different keys apply serially with a gap-free chain", async () => {
    const { businessId } = await openAccount();
    const c = ctx();
    const dupes = await Promise.allSettled(
      Array.from({ length: 8 }, () => creditAdjust(businessId, 3, {}, c)),
    );
    expect(dupes.filter((r) => r.status === "fulfilled" && !r.value.replayed)).toHaveLength(1);
    for (const r of dupes) {
      if (r.status === "rejected")
        expect((r.reason as CommercialDomainError).category).toBe("TEMPORARY_UNAVAILABLE");
    }
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);

    await Promise.all(Array.from({ length: 6 }, (_, i) => creditAdjust(businessId, i + 1)));
    const account = await getCommercialAccount(pool, businessId);
    expect(account?.paidBalanceUnits).toBe(3 + 21);
    expect(account?.version).toBe(7);
    const ledger = await listLedgerEntries(pool, businessId);
    expect(ledger.map((e) => e.accountVersion)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    // Audit baselines were taken under the lock: each event's `before` is its predecessor's `after`.
    const chain = (await listCommercialAuditEventsForBusiness(pool, businessId))
      .filter((e) => e.actionType === "credit_adjusted")
      .map((e) => [
        (e.beforeSnapshot as { accountVersion: number }).accountVersion,
        (e.afterSnapshot as { accountVersion: number }).accountVersion,
      ])
      .sort((x, y) => x[0] - y[0]);
    expect(chain).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ]);
  });
});

// ===========================================================================
describe("ACTIVATION — activatePaidService", () => {
  const activate = (businessId: string, context = ctx(), overrides: Record<string, unknown> = {}) =>
    activatePaidService(d(), context, {
      businessId,
      reasonText: "first payment confirmed",
      ...overrides,
    });

  it("requires at least one CONFIRMED settlement: none, recorded-only and voided-only do not qualify", async () => {
    const { businessId } = await openAccount();
    await expectDomainError(
      activate(businessId),
      "INVALID_STATE_TRANSITION",
      /at least one settlement has been confirmed/,
    );
    await recordedSettlement(businessId);
    await expectDomainError(activate(businessId), "INVALID_STATE_TRANSITION");
    const { settlementId } = await confirmedSettlement(businessId, 2);
    await voidSettlement(d(), ctx(), {
      businessId,
      settlementId,
      reasonText: "mistake",
      reference: "V1",
    });
    await expectDomainError(activate(businessId), "INVALID_STATE_TRANSITION");
    expect((await getCommercialAccount(pool, businessId))?.paidServiceActivatedAt).toBeNull();
    expect((await listStandingEvents(pool, businessId)).map((e) => e.eventType)).not.toContain(
      "paid_service_activated",
    );
  });

  it("activates explicitly after a confirmed settlement: attributable, audited, standing event; ledger and balance untouched", async () => {
    const { businessId } = await openAccount();
    await confirmedSettlement(businessId, 3);
    const versionBefore = (await getCommercialAccount(pool, businessId))?.version;
    const ledgerBefore = await listLedgerEntries(pool, businessId);

    const res = await activate(businessId, ctx(), { reference: "REF-ACT" });
    expect(res.replayed).toBe(false);
    expect(res.result).toMatchObject({
      businessId,
      confirmedSettlementCount: 1,
      paidServiceActivatedAt: NOW.toISOString(),
    });

    const account = await getCommercialAccount(pool, businessId);
    expect(account?.paidServiceActivatedAt).toEqual(NOW);
    expect(account).toMatchObject({ version: versionBefore, paidBalanceUnits: 3 });
    expect(await listLedgerEntries(pool, businessId)).toEqual(ledgerBefore);
    expect((await listStandingEvents(pool, businessId)).map((e) => e.eventType)).toEqual([
      "paid_service_activated",
    ]);
    const audit = (await listCommercialAuditEventsForBusiness(pool, businessId)).find(
      (e) => e.actionType === "paid_service_activated",
    );
    expect(audit).toMatchObject({
      actorId: ADMIN,
      businessId,
      reference: "REF-ACT",
      result: "succeeded",
      beforeSnapshot: { paidServiceActivatedAt: null },
      afterSnapshot: { paidServiceActivatedAt: NOW.toISOString(), confirmedSettlementCount: 1 },
    });
  });

  it("duplicate activation: same key replays; a new key is refused (set-once) and the timestamp never moves", async () => {
    const { businessId } = await openAccount();
    await confirmedSettlement(businessId);
    const c = ctx();
    const a = await activate(businessId, c);
    const b = await activate(businessId, c);
    expect(b.replayed).toBe(true);
    expect(b.result).toEqual(a.result);
    await expectDomainError(activate(businessId), "INVALID_STATE_TRANSITION", /already activated/);
    expect(await listStandingEvents(pool, businessId)).toHaveLength(1);
    await expectPgFailure(
      pool.query(
        "UPDATE commercial_accounts SET paid_service_activated_at = now() WHERE business_id = $1",
        [businessId],
      ),
      /set-once/,
    );
  });

  it("is Business-scoped: a settlement of another Business does not qualify; key reuse across Business/actor conflicts", async () => {
    const withSettlement = (await openAccount()).businessId;
    const without = (await openAccount()).businessId;
    await confirmedSettlement(withSettlement);
    await expectDomainError(activate(without), "INVALID_STATE_TRANSITION");
    await expectDomainError(activate(newBusiness()), "RESOURCE_NOT_FOUND");
    const c = ctx();
    await activate(withSettlement, c);
    await expectDomainError(activate(without, c), "IDEMPOTENCY_CONFLICT");
    await expectDomainError(
      activate(withSettlement, { ...c, adminUserId: OTHER_ADMIN }),
      "IDEMPOTENCY_CONFLICT",
    );
    expect((await getCommercialAccount(pool, without))?.paidServiceActivatedAt).toBeNull();
  });

  it("concurrent activations credit the fact once", async () => {
    const { businessId } = await openAccount();
    await confirmedSettlement(businessId);
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => activate(businessId)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) {
      if (r.status === "rejected")
        expect((r.reason as CommercialDomainError).category).toBe("INVALID_STATE_TRANSITION");
    }
    expect(await listStandingEvents(pool, businessId)).toHaveLength(1);
  });

  it("requires a reason", async () => {
    const { businessId } = await openAccount();
    await confirmedSettlement(businessId);
    await expectDomainError(activate(businessId, ctx(), { reasonText: " " }), "VALIDATION_FAILED");
    await expectDomainError(activate(businessId, ctx(), { reference: " " }), "VALIDATION_FAILED");
  });
});

// ===========================================================================
describe("STANDING — restrictNewStarts / restoreCommercialStanding", () => {
  const restrict = (businessId: string, context = ctx(), overrides: Record<string, unknown> = {}) =>
    restrictNewStarts(d(), context, {
      businessId,
      reasonText: "payment overdue",
      reference: "REF-R",
      ...overrides,
    } as Parameters<typeof restrictNewStarts>[2]);
  const restore = (businessId: string, context = ctx(), overrides: Record<string, unknown> = {}) =>
    restoreCommercialStanding(d(), context, {
      businessId,
      reasonText: "payment received",
      ...overrides,
    });

  it("restricts and restores as pure standing facts: audited, standing events, counters/ledger/version untouched", async () => {
    const { businessId } = await openAccount();
    await creditAdjust(businessId, 4);
    const before = await getCommercialAccount(pool, businessId);
    const ledgerBefore = await listLedgerEntries(pool, businessId);

    const r1 = await restrict(businessId);
    expect(r1.result).toMatchObject({
      serviceRestriction: "restricted",
      accountVersion: before?.version,
    });
    expect((await getCommercialAccount(pool, businessId))?.serviceRestriction).toBe("restricted");
    const r2 = await restore(businessId, ctx(), { reference: "REF-RESTORE" });
    expect(r2.result.serviceRestriction).toBe("none");

    const after = await getCommercialAccount(pool, businessId);
    expect(after).toMatchObject({
      serviceRestriction: "none",
      paidBalanceUnits: 4,
      trialRemainingUnits: 0,
      trialReservedUnits: 0,
      paidReservedUnits: 0,
      version: before?.version,
    });
    expect(await listLedgerEntries(pool, businessId)).toEqual(ledgerBefore);
    expect((await listStandingEvents(pool, businessId)).map((e) => e.eventType)).toEqual([
      "service_restricted",
      "service_restored",
    ]);
    const audit = await listCommercialAuditEventsForBusiness(pool, businessId);
    const restricted = audit.find((e) => e.actionType === "service_restricted");
    const restored = audit.find((e) => e.actionType === "service_restored");
    expect(restricted).toMatchObject({
      actorId: ADMIN,
      reasonText: "payment overdue",
      reference: "REF-R",
      result: "succeeded",
      beforeSnapshot: { serviceRestriction: "none" },
      afterSnapshot: { serviceRestriction: "restricted" },
    });
    expect(restored).toMatchObject({
      reference: "REF-RESTORE",
      beforeSnapshot: { serviceRestriction: "restricted" },
      afterSnapshot: { serviceRestriction: "none" },
    });
  });

  it("duplicates are safe: same key replays; a state conflict under a new key is refused and audited denied", async () => {
    const { businessId } = await openAccount();
    const c = ctx();
    const a = await restrict(businessId, c);
    const b = await restrict(businessId, c);
    expect(b.replayed).toBe(true);
    expect(b.result).toEqual(a.result);
    await expectDomainError(restrict(businessId), "INVALID_STATE_TRANSITION", /already restricted/);
    await restore(businessId);
    await expectDomainError(restore(businessId), "INVALID_STATE_TRANSITION", /nothing to restore/);
    expect((await listStandingEvents(pool, businessId)).map((e) => e.eventType)).toEqual([
      "service_restricted",
      "service_restored",
    ]);
    const denied = (await listCommercialAuditEventsForBusiness(pool, businessId)).filter(
      (e) => e.result === "denied",
    );
    expect(denied.map((e) => e.actionType).sort()).toEqual([
      "service_restored",
      "service_restricted",
    ]);
  });

  it("restoring a never-restricted account is refused; reasons are mandatory, restriction also needs a reference", async () => {
    const { businessId } = await openAccount();
    await expectDomainError(restore(businessId), "INVALID_STATE_TRANSITION");
    await expectDomainError(restrict(businessId, ctx(), { reasonText: " " }), "VALIDATION_FAILED");
    await expectDomainError(restrict(businessId, ctx(), { reference: "" }), "VALIDATION_FAILED");
    await expectDomainError(restore(businessId, ctx(), { reasonText: "" }), "VALIDATION_FAILED");
    await expectDomainError(restrict(newBusiness()), "RESOURCE_NOT_FOUND");
    expect((await getCommercialAccount(pool, businessId))?.serviceRestriction).toBe("none");
  });

  it("key reuse across Business, actor or command conflicts", async () => {
    const a = (await openAccount()).businessId;
    const b = (await openAccount()).businessId;
    const c = ctx();
    await restrict(a, c);
    await expectDomainError(restrict(b, c), "IDEMPOTENCY_CONFLICT");
    await expectDomainError(
      restrict(a, { ...c, adminUserId: OTHER_ADMIN }),
      "IDEMPOTENCY_CONFLICT",
    );
    await expectDomainError(restore(a, c), "IDEMPOTENCY_CONFLICT");
    expect((await getCommercialAccount(pool, b))?.serviceRestriction).toBe("none");
  });

  it("concurrent restrictions: exactly one wins", async () => {
    const { businessId } = await openAccount();
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => restrict(businessId)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await listStandingEvents(pool, businessId)).toHaveLength(1);
  });

  it("touches Commercial standing only: no loyalty/purchase/redemption table changes", async () => {
    const tables = [
      "purchase_records",
      "verified_units",
      "loyalty_cycles",
      "rewards",
      "redemptions",
      "trust_events",
    ];
    const snapshot = async () => {
      const out: number[] = [];
      for (const t of tables) {
        const exists = await pool.query("SELECT to_regclass($1) AS t", [`public.${t}`]);
        out.push(
          exists.rows[0].t === null ? -1 : await count(`SELECT COUNT(*)::int AS n FROM ${t}`),
        );
      }
      return out;
    };
    const before = await snapshot();
    const { businessId } = await openAccount();
    await restrict(businessId);
    await restore(businessId);
    expect(await snapshot()).toEqual(before);
  });
});

// ===========================================================================
describe("VOID — voidSettlement", () => {
  const voidIt = (
    businessId: string,
    settlementId: string,
    context = ctx(),
    overrides: Record<string, unknown> = {},
  ) =>
    voidSettlement(d(), context, {
      businessId,
      settlementId,
      reasonText: "recorded against the wrong Business",
      reference: "REF-VOID",
      ...overrides,
    });

  it("compensates a confirmed settlement: original credit untouched, one reversal, settlement voided with full provenance, audit chain", async () => {
    const { businessId } = await openAccount();
    const { settlementId, confirmation } = await confirmedSettlement(businessId, 3);
    const creditBefore = (await listLedgerEntries(pool, businessId)).find(
      (e) => e.id === confirmation.ledgerEntryId,
    );
    const settlementBefore = await getSettlement(pool, settlementId);

    const res = await voidIt(businessId, settlementId);
    expect(res.replayed).toBe(false);
    expect(res.result).toMatchObject({
      status: "voided",
      unitsReversed: 3,
      originalLedgerEntryId: confirmation.ledgerEntryId,
      ledgerAccountVersion: 2,
      paidBalanceAfter: 0,
    });

    const ledger = await listLedgerEntries(pool, businessId);
    expect(ledger).toHaveLength(2);
    // The ORIGINAL credit is byte-for-byte unchanged and still visible.
    expect(ledger[0]).toEqual(creditBefore);
    expect(ledger[1]).toMatchObject({
      id: res.result.reversalLedgerEntryId,
      entryType: "settlement_void_reversal",
      bucket: "paid",
      unitsDelta: -3,
      sourceReferenceType: "settlement",
      sourceReferenceId: settlementId,
      idempotencyScopeKey: `settlement:${settlementId}:void_reversal`,
      createdBy: ADMIN,
    });
    // Reconstructable: ledger sum == derived account.
    expect((await sumLedger(pool, businessId)).paidBalanceUnits).toBe(0);
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      paidBalanceUnits: 0,
      version: 2,
    });

    const settlement = await getSettlement(pool, settlementId);
    expect(settlement).toMatchObject({
      status: "voided",
      voidedBy: ADMIN,
      voidReasonText: "recorded against the wrong Business",
      voidReference: "REF-VOID",
      voidLedgerEntryId: res.result.reversalLedgerEntryId,
      // Confirmation and pricing provenance retained.
      confirmedBy: settlementBefore?.confirmedBy,
      confirmationNote: settlementBefore?.confirmationNote,
      ledgerEntryId: confirmation.ledgerEntryId,
      priceScheduleId: settlementBefore?.priceScheduleId,
      amountMinor: settlementBefore?.amountMinor,
    });

    const audit = (await listCommercialAuditEventsForBusiness(pool, businessId)).find(
      (e) => e.actionType === "settlement_voided",
    );
    expect(audit).toMatchObject({
      actorId: ADMIN,
      targetId: settlementId,
      businessId,
      reference: "REF-VOID",
      result: "succeeded",
      ledgerEntryId: res.result.reversalLedgerEntryId,
      beforeSnapshot: { settlementStatus: "confirmed", paidBalanceUnits: 3, accountVersion: 1 },
      afterSnapshot: {
        settlementStatus: "voided",
        paidBalanceUnits: 0,
        accountVersion: 2,
        unitsReversed: 3,
        originalLedgerEntryId: confirmation.ledgerEntryId,
        reversalLedgerEntryId: res.result.reversalLedgerEntryId,
      },
    });
  });

  it("a void after the credit was consumed drives the paid balance negative (governed, recoverable; no floor)", async () => {
    const { businessId } = await openAccount();
    const { settlementId } = await confirmedSettlement(businessId, 3);
    for (let i = 0; i < 3; i++) {
      await withPlatformTransaction(pool, (tx) =>
        postCommercialLedgerEntry(tx, {
          businessId,
          entryType: "consumption",
          bucket: "paid",
          unitsDelta: -1,
          idempotencyScopeKey: `consume:${randomUUID()}`,
          createdBy: "system:test",
          correlationId: "c",
        }),
      );
    }
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(0);
    const res = await voidIt(businessId, settlementId);
    expect(res.result.paidBalanceAfter).toBe(-3);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(-3);
    const recovered = await creditAdjust(businessId, 3, {
      reasonCode: "settlement_reconciliation",
    });
    expect(recovered.result.paidBalanceAfter).toBe(0);
  });

  it("a recorded (unconfirmed) settlement cannot be voided: it granted nothing to reverse; nothing changes", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId);
    await expectDomainError(
      voidIt(businessId, settlementId),
      "INVALID_STATE_TRANSITION",
      /only a confirmed settlement can be voided/,
    );
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    const denied = (await listCommercialAuditEventsForBusiness(pool, businessId)).filter(
      (e) => e.result === "denied",
    );
    expect(denied).toHaveLength(1);
  });

  it("a duplicate void is exactly-once: same key replays, a new key is refused, one reversal exists", async () => {
    const { businessId } = await openAccount();
    const { settlementId } = await confirmedSettlement(businessId, 2);
    const c = ctx();
    const a = await voidIt(businessId, settlementId, c);
    const b = await voidIt(businessId, settlementId, c);
    expect(b.replayed).toBe(true);
    expect(b.result).toEqual(a.result);
    await expectDomainError(
      voidIt(businessId, settlementId),
      "INVALID_STATE_TRANSITION",
      /already voided/,
    );
    const reversals = (await listLedgerEntries(pool, businessId)).filter(
      (e) => e.entryType === "settlement_void_reversal",
    );
    expect(reversals).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(0);
  });

  it("concurrent voids compensate exactly once (same key and different keys)", async () => {
    const one = (await openAccount()).businessId;
    const s1 = (await confirmedSettlement(one, 4)).settlementId;
    const c = ctx();
    const sameKey = await Promise.allSettled(Array.from({ length: 8 }, () => voidIt(one, s1, c)));
    expect(sameKey.filter((r) => r.status === "fulfilled" && !r.value.replayed)).toHaveLength(1);
    for (const r of sameKey) {
      if (r.status === "rejected")
        expect((r.reason as CommercialDomainError).category).toBe("TEMPORARY_UNAVAILABLE");
    }

    const two = (await openAccount()).businessId;
    const s2 = (await confirmedSettlement(two, 4)).settlementId;
    const diffKeys = await Promise.allSettled(Array.from({ length: 6 }, () => voidIt(two, s2)));
    expect(diffKeys.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of diffKeys) {
      if (r.status === "rejected")
        expect((r.reason as CommercialDomainError).category).toBe("INVALID_STATE_TRANSITION");
    }
    for (const id of [one, two]) {
      expect(
        (await listLedgerEntries(pool, id)).filter(
          (e) => e.entryType === "settlement_void_reversal",
        ),
      ).toHaveLength(1);
      expect((await getCommercialAccount(pool, id))?.paidBalanceUnits).toBe(0);
    }
  });

  it("cross-Business void is impossible; unknown/malformed ids and missing reason/reference are rejected", async () => {
    const owner = (await openAccount()).businessId;
    const intruder = (await openAccount()).businessId;
    const { settlementId } = await confirmedSettlement(owner, 3);
    await expectDomainError(voidIt(intruder, settlementId), "RESOURCE_NOT_FOUND");
    await expectDomainError(voidIt(owner, randomUUID()), "RESOURCE_NOT_FOUND");
    await expectDomainError(voidIt(owner, "nope"), "RESOURCE_NOT_FOUND");
    await expectDomainError(
      voidIt(owner, settlementId, ctx(), { reasonText: " " }),
      "VALIDATION_FAILED",
    );
    await expectDomainError(
      voidIt(owner, settlementId, ctx(), { reference: "" }),
      "VALIDATION_FAILED",
    );
    expect((await getSettlement(pool, settlementId))?.status).toBe("confirmed");
    expect((await getCommercialAccount(pool, owner))?.paidBalanceUnits).toBe(3);
    expect((await getCommercialAccount(pool, intruder))?.paidBalanceUnits).toBe(0);
    // Same key across Business / actor conflicts.
    const c = ctx();
    await voidIt(owner, settlementId, c);
    await expectDomainError(voidIt(intruder, settlementId, c), "IDEMPOTENCY_CONFLICT");
    await expectDomainError(
      voidIt(owner, settlementId, { ...c, adminUserId: OTHER_ADMIN }),
      "IDEMPOTENCY_CONFLICT",
    );
  });

  it("audit chain stays correct when a void races a credit adjustment on the same Business", async () => {
    const { businessId } = await openAccount();
    const { settlementId } = await confirmedSettlement(businessId, 3); // version 1
    await Promise.all([voidIt(businessId, settlementId), creditAdjust(businessId, 2)]);
    const chain = (await listCommercialAuditEventsForBusiness(pool, businessId))
      .filter((e) => e.actionType === "settlement_voided" || e.actionType === "credit_adjusted")
      .map((e) => [
        (e.beforeSnapshot as { accountVersion: number }).accountVersion,
        (e.afterSnapshot as { accountVersion: number }).accountVersion,
      ])
      .sort((x, y) => x[0] - y[0]);
    expect(chain).toEqual([
      [1, 2],
      [2, 3],
    ]);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(2);
  });

  it("the database refuses to alter or duplicate the compensation: forged/second reversal, edited confirmation, further transitions, delete", async () => {
    const { businessId } = await openAccount();
    const other = await confirmedSettlement(businessId, 2);
    const { settlementId } = await confirmedSettlement(businessId, 3);
    // Unbacked void (no reversal) is refused.
    await expectPgFailure(
      pool.query(
        `UPDATE commercial_settlements SET status = 'voided', voided_by = 'x', voided_at = now(),
           void_reason_text = 'r', void_reference = 'r', void_idempotency_key = 'k', void_correlation_id = 'c',
           void_ledger_entry_id = $2 WHERE id = $1`,
        [settlementId, other.confirmation.ledgerEntryId],
      ),
      /must be voided by a paid settlement_void_reversal/,
    );
    const res = await voidIt(businessId, settlementId);
    // A second reversal for the same settlement is refused whatever its scope key.
    await expectPgFailure(
      withPlatformTransaction(pool, (tx) =>
        postCommercialLedgerEntry(tx, {
          businessId,
          entryType: "settlement_void_reversal",
          bucket: "paid",
          unitsDelta: -3,
          sourceReference: { type: "settlement", id: settlementId },
          idempotencyScopeKey: `rogue-${randomUUID()}`,
          createdBy: ADMIN,
          correlationId: "c",
        }),
      ),
      /commercial_ledger_one_void_reversal_per_settlement|duplicate key/,
    );
    await expectPgFailure(
      pool.query("UPDATE commercial_settlements SET confirmation_note = 'edited' WHERE id = $1", [
        settlementId,
      ]),
      /may only change|confirmation or original credit|immutable/,
    );
    await expectPgFailure(
      pool.query("UPDATE commercial_settlements SET status = 'confirmed' WHERE id = $1", [
        settlementId,
      ]),
      /may only change recorded -> confirmed/,
    );
    await expectPgFailure(
      pool.query("UPDATE commercial_ledger_entries SET units_delta = 99 WHERE id = $1", [
        res.result.originalLedgerEntryId,
      ]),
      /append-only and immutable/,
    );
    await expectPgFailure(
      pool.query("DELETE FROM commercial_settlements WHERE id = $1", [settlementId]),
      /append-only and immutable/,
    );
    expect(
      (await listLedgerEntries(pool, businessId)).filter(
        (e) => e.entryType === "settlement_void_reversal",
      ),
    ).toHaveLength(1);
  });
});

// ===========================================================================
describe("AUTHORITY — every WP-COM-03 command", () => {
  it("denies an inactive administrator, a missing MFA proof and Business roles, writing nothing", async () => {
    const { businessId } = await openAccount();
    const { settlementId } = await confirmedSettlement(businessId, 3);
    const attackers: CommercialCommandContext[] = [
      ctx({ adminUserId: "inactive-admin" }),
      ctx({ verifiedMfaSatisfied: false }),
      ctx({ adminUserId: "business-owner-uid" }),
      ctx({ adminUserId: "business-manager-uid" }),
      ctx({ adminUserId: "business-staff-uid" }),
      ctx({ adminUserId: "" }),
    ];
    const tally = async () => ({
      ledger: await count("SELECT COUNT(*)::int AS n FROM commercial_ledger_entries"),
      audit: await count("SELECT COUNT(*)::int AS n FROM commercial_audit_events"),
      grants: await count("SELECT COUNT(*)::int AS n FROM commercial_trial_grants"),
      adjustments: await count("SELECT COUNT(*)::int AS n FROM commercial_manual_adjustments"),
      standing: await count("SELECT COUNT(*)::int AS n FROM commercial_standing_events"),
      accounts: await count("SELECT COUNT(*)::int AS n FROM commercial_accounts"),
    });
    const before = await tally();
    const openDeps = { ...d(), resolveBusinessCountry: async () => "BI" };
    for (const who of attackers) {
      const calls: Promise<unknown>[] = [
        openCommercialAccount(openDeps, who, { businessId: newBusiness(), reasonText: "x" }),
        grantTrial(d(), who, { businessId, units: 3, reasonText: "x", reference: "r" }),
        adjustTrial(d(), who, { businessId, unitsDelta: 1, reasonText: "x", reference: "r" }),
        adjustCommercialCredit(d(), who, {
          businessId,
          unitsDelta: 1,
          reasonCode: "correction",
          reasonText: "x",
          reference: "r",
        }),
        activatePaidService(d(), who, { businessId, reasonText: "x" }),
        restrictNewStarts(d(), who, { businessId, reasonText: "x", reference: "r" }),
        restoreCommercialStanding(d(), who, { businessId, reasonText: "x" }),
        voidSettlement(d(), who, { businessId, settlementId, reasonText: "x", reference: "r" }),
      ];
      for (const call of calls) {
        await expectDomainError(call, "AUTH_FORBIDDEN", /Platform Administrator with verified MFA/);
      }
    }
    expect(await tally()).toEqual(before);
    expect((await getSettlement(pool, settlementId))?.status).toBe("confirmed");
    expect((await getCommercialAccount(pool, businessId))?.serviceRestriction).toBe("none");
  });
});

// ===========================================================================
describe("ROLLBACK — no partial state", () => {
  it("a failure after the ledger credit and grant row leaves no ledger, grant, account or key state, and the key is reusable", async () => {
    const { businessId } = await openAccount();
    await pool.query(`
      CREATE FUNCTION wpcom03_fail_grant_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.action_type = 'trial_granted' AND NEW.reference = 'ROLLBACK-GRANT' THEN
          RAISE EXCEPTION 'simulated audit failure';
        END IF;
        RETURN NEW;
      END; $$`);
    await pool.query(
      `CREATE TRIGGER wpcom03_fail_grant_audit BEFORE INSERT ON commercial_audit_events
         FOR EACH ROW EXECUTE FUNCTION wpcom03_fail_grant_audit()`,
    );
    const c = ctx();
    const input = { businessId, units: 4, reasonText: "x", reference: "ROLLBACK-GRANT" };
    try {
      await expectPgFailure(grantTrial(d(), c, input), /simulated audit failure/);
      expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
      expect(await listTrialGrants(pool, businessId)).toHaveLength(0);
      expect(await getCommercialAccount(pool, businessId)).toMatchObject({
        trialRemainingUnits: 0,
        version: 0,
      });
      expect(
        await count("SELECT COUNT(*)::int AS n FROM idempotency_keys WHERE idempotency_key = $1", [
          c.idempotencyKey,
        ]),
      ).toBe(0);
    } finally {
      await pool.query("DROP TRIGGER wpcom03_fail_grant_audit ON commercial_audit_events");
      await pool.query("DROP FUNCTION wpcom03_fail_grant_audit()");
    }
    const retry = await grantTrial(d(), c, input);
    expect(retry.replayed).toBe(false);
    expect((await getCommercialAccount(pool, businessId))?.trialRemainingUnits).toBe(4);
  });
});

// ===========================================================================
describe("REVIEW FINDINGS (PR #287) — NULL-safe CHECKs and counter range", () => {
  it("a paid adjustment with a NULL reason code is rejected by the database (NULL must not satisfy the closed vocabulary)", async () => {
    const { businessId } = await openAccount();
    const id = randomUUID();
    const backing = await withPlatformTransaction(pool, (tx) =>
      postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "credit_adjustment",
        bucket: "paid",
        unitsDelta: 1,
        sourceReference: { type: "manual_adjustment", id },
        idempotencyScopeKey: `forged-${randomUUID()}`,
        createdBy: "x",
        correlationId: "c",
      }),
    );
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_manual_adjustments
           (id, business_id, bucket, units_delta, reason_code, reason_text, reference, created_by,
            ledger_entry_id, idempotency_key, correlation_id)
         VALUES ($1,$2,'paid',1,NULL,'r','r','x',$3,$4,'c')`,
        [id, businessId, backing.entry.id, key()],
      ),
      /commercial_manual_adjustments_paid_reason_code|violates check/,
    );
    expect(await listManualAdjustments(pool, businessId)).toHaveLength(0);
  });

  it("a voided settlement cannot omit any void provenance column (NULL is rejected, not UNKNOWN-accepted)", async () => {
    const { businessId } = await openAccount();
    for (const nullColumn of [
      "voided_by",
      "void_reason_text",
      "void_reference",
      "void_idempotency_key",
    ]) {
      const { settlementId } = await confirmedSettlement(businessId, 2);
      const reversal = await withPlatformTransaction(pool, (tx) =>
        postCommercialLedgerEntry(tx, {
          businessId,
          entryType: "settlement_void_reversal",
          bucket: "paid",
          unitsDelta: -2,
          sourceReference: { type: "settlement", id: settlementId },
          idempotencyScopeKey: `forged-${randomUUID()}`,
          createdBy: "x",
          correlationId: "c",
        }),
      );
      const values: Record<string, string> = {
        voided_by: "x",
        void_reason_text: "r",
        void_reference: "ref",
        void_idempotency_key: key(),
      };
      values[nullColumn] = "";
      const params = Object.keys(values)
        .filter((c) => c !== nullColumn)
        .map((c) => values[c]);
      // Placeholders are numbered over the non-NULL columns only.
      let n = 2;
      const setSql = Object.keys(values)
        .map((c) => (c === nullColumn ? `${c} = NULL` : `${c} = $${++n}`))
        .join(", ");
      await expectPgFailure(
        pool.query(
          `UPDATE commercial_settlements
              SET status = 'voided', voided_at = now(), void_correlation_id = 'c',
                  void_ledger_entry_id = $2, ${setSql}
            WHERE id = $1`,
          [settlementId, reversal.entry.id, ...params],
        ),
        /commercial_settlements_confirmation_consistency|violates check/,
      );
      expect((await getSettlement(pool, settlementId))?.status).toBe("confirmed");
    }
  });

  it("a confirmed settlement cannot omit confirmation provenance either (same NULL-safety on the confirmed branch)", async () => {
    const { businessId } = await openAccount();
    for (const nullColumn of ["confirmed_by", "confirmation_note", "confirm_idempotency_key"]) {
      const settlementId = await recordedSettlement(businessId, 2);
      const credit = await withPlatformTransaction(pool, (tx) =>
        postCommercialLedgerEntry(tx, {
          businessId,
          entryType: "credit_grant",
          bucket: "paid",
          unitsDelta: 2,
          sourceReference: { type: "settlement", id: settlementId },
          idempotencyScopeKey: `forged-${randomUUID()}`,
          createdBy: "x",
          correlationId: "c",
        }),
      );
      const values: Record<string, string> = {
        confirmed_by: "x",
        confirmation_note: "n",
        confirm_idempotency_key: key(),
      };
      const params = Object.keys(values)
        .filter((c) => c !== nullColumn)
        .map((c) => values[c]);
      let n = 2;
      const setSql = Object.keys(values)
        .map((c) => (c === nullColumn ? `${c} = NULL` : `${c} = $${++n}`))
        .join(", ");
      await expectPgFailure(
        pool.query(
          `UPDATE commercial_settlements
              SET status = 'confirmed', confirmed_at = now(), confirm_correlation_id = 'c',
                  ledger_entry_id = $2, ${setSql}
            WHERE id = $1`,
          [settlementId, credit.entry.id, ...params],
        ),
        /commercial_settlements_confirmation_consistency|violates check/,
      );
      expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
    }
  });

  it("a grant that would overflow the trial counter is a Commercial validation error, not a raw database failure", async () => {
    const { businessId } = await openAccount();
    await adjustTrial(d(), ctx(), {
      businessId,
      unitsDelta: 2_147_483_646,
      reasonText: "x",
      reference: "r",
    });
    await expectDomainError(
      grant(businessId, 3),
      "VALIDATION_FAILED",
      /supported whole-number range/,
    );
    expect(await listTrialGrants(pool, businessId)).toHaveLength(0);
  });

  it("confirming a settlement that would overflow the paid counter is a validation error, and nothing is written", async () => {
    const { businessId } = await openAccount();
    await creditAdjust(businessId, 2_000_000_000);
    const rec = await recordSettlement(d(), ctx(), {
      businessId,
      method: "bank_transfer",
      externalReference: `ref-${randomUUID()}`,
      currency: "BIF",
      amountMinor: 2_000_000_000 * BI_PRICE,
      unitsPurchased: 2_000_000_000,
      receivedAt: new Date("2026-04-01T00:00:00Z"),
      reasonText: "large",
    });
    await expectDomainError(
      confirmSettlement(d(), ctx(), {
        businessId,
        settlementId: rec.result.settlementId,
        confirmationNote: "x",
      }),
      "VALIDATION_FAILED",
      /supported whole-number range/,
    );
    expect((await getSettlement(pool, rec.result.settlementId))?.status).toBe("recorded");
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(2_000_000_000);
  });
});
