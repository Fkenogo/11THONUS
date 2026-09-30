/**
 * WP-COM-02 — Commercial price schedules & manual settlement: real PostgreSQL tests.
 *
 *   PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *     npx vitest run --config vitest.postgres.config.ts commercialSettlement
 *
 * Same isolation model as `commercialFoundation.postgres.test.ts`: Commercial
 * rows are immutable, so each test uses its own Business id and the file
 * drops the Commercial objects before and after.
 *
 * ALL price values below are TEST-ONLY fixtures. They are not, and must not be
 * read as, BIF/RWF launch prices (Founder launch inputs). The tests are
 * ORDER-DEPENDENT within the price section on purpose: schedules are
 * append-only and strictly forward, and RW must have none until its own test.
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
import { insertPriceSchedule, listPriceSchedules } from "./repositories/commercialPriceRepository";
import { listCommercialAuditEventsForBusiness } from "./repositories/commercialAuditRepository";
import {
  getSettlement,
  listSettlementsForBusiness,
} from "./repositories/commercialSettlementRepository";
import { postCommercialLedgerEntry } from "./services/postCommercialLedgerEntry";
import { lookupCommercialPrice } from "./services/commercialPriceLookup";
import { setPriceSchedule } from "./services/setPriceSchedule";
import { recordSettlement, type RecordSettlementInput } from "./services/recordSettlement";
import { confirmSettlement } from "./services/confirmSettlement";
import {
  runAdministratorCommand,
  type CommercialCommandContext,
  type CommercialCommandDeps,
} from "./services/commercialAdministratorCommand";
import type { CommercialMarket } from "./models/commercialFoundation";
import { CommercialDomainError } from "./models/commercialErrors";
import type { ErrorCategory } from "../../shared/errors/errorCategories";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "..", "infrastructure", "postgres", "migrations");

let pool: PlatformPostgresPool;
let startedFromEmptyDatabase = false;

const COMMERCIAL_TABLES = [
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
  for (const fn of [
    "commercial_trial_grants_guard",
    "commercial_manual_adjustments_guard",
    "commercial_settlements_update_guard",
    "commercial_settlements_insert_guard",
    "commercial_assert_account_matches_ledger",
    "commercial_price_schedules_versioning",
    "commercial_accounts_guard",
    "commercial_reject_mutation",
    "wpcom02_fail_confirm_audit",
  ]) {
    await pool.query(`DROP FUNCTION IF EXISTS ${fn}() CASCADE`);
  }
  const hasMigrations = await pool.query("SELECT to_regclass('public.schema_migrations') AS t");
  if (hasMigrations.rows[0].t !== null) {
    await pool.query("DELETE FROM schema_migrations WHERE version IN ('0021', '0022', '0023')");
    await pool
      .query("DELETE FROM idempotency_keys WHERE idempotency_key LIKE 'wpcom02-%'")
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
  // Business roles have no platformAdministrators record at all.
  "business-owner-uid": undefined,
  "business-manager-uid": undefined,
  "business-staff-uid": undefined,
};

// Fixed clock so effective dating is deterministic.
const NOW = new Date("2026-07-01T00:00:00Z");
const deps: CommercialCommandDeps = {
  pool: undefined as unknown as PlatformPostgresPool,
  readAdministratorRecord: async (uid) => records[uid],
  now: () => NOW,
};
const d = (): CommercialCommandDeps => ({ ...deps, pool });

const key = () => `wpcom02-${randomUUID()}`;
const ctx = (overrides: Partial<CommercialCommandContext> = {}): CommercialCommandContext => ({
  adminUserId: ADMIN,
  verifiedMfaSatisfied: true,
  idempotencyKey: key(),
  correlationId: "corr-wpcom02",
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

// TEST-ONLY fixture prices (see file header).
const BI_P1 = 1000;
const BI_P2 = 1200;
const RW_P1 = 1500;
const T_BI1 = new Date("2026-03-01T00:00:00Z");
const T_BI2 = new Date("2026-06-01T00:00:00Z");

const price = (
  market: string,
  currency: string,
  localUnitPriceMinor: number,
  effectiveFrom: Date,
  extra: Record<string, unknown> = {},
) =>
  setPriceSchedule({ ...d(), now: () => new Date("2026-02-01T00:00:00Z") }, ctx(), {
    market,
    currency,
    localUnitPriceMinor,
    effectiveFrom,
    reasonText: "test fixture",
    ...extra,
  });

const settle = (businessId: string, overrides: Partial<RecordSettlementInput> = {}) =>
  recordSettlement(d(), ctx(), {
    businessId,
    method: "bank_transfer",
    externalReference: `ref-${randomUUID()}`,
    currency: "BIF",
    amountMinor: 3 * BI_P1,
    unitsPurchased: 3,
    receivedAt: new Date("2026-04-01T00:00:00Z"),
    reasonText: "received offline",
    ...overrides,
  });

// ===========================================================================
describe("PRICE — setPriceSchedule and lookup (order-dependent by design)", () => {
  it("seeds NO price schedule: launch prices are Founder inputs", async () => {
    expect(await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules")).toBe(0);
    await expectDomainError(
      lookupCommercialPrice(pool, { market: "BI", currency: "BIF", at: NOW }),
      "RESOURCE_NOT_FOUND",
      /No Commercial price schedule applies/,
    );
  });

  it("accepts only BI/BIF and RW/RWF; every other market or pairing is rejected", async () => {
    for (const [market, currency] of [
      ["KE", "KES"],
      ["BI", "RWF"],
      ["RW", "BIF"],
      ["BI", "USD"],
      ["bi", "BIF"],
    ] as const) {
      await expectDomainError(price(market, currency, 1000, T_BI1), "VALIDATION_FAILED");
    }
    expect(await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules")).toBe(0);
  });

  it("rejects non-integer, non-positive, non-canonical-basis, blank-reason and undated schedules", async () => {
    await expectDomainError(price("BI", "BIF", 1000.5, T_BI1), "VALIDATION_FAILED");
    await expectDomainError(price("BI", "BIF", 0, T_BI1), "VALIDATION_FAILED");
    await expectDomainError(price("BI", "BIF", -5, T_BI1), "VALIDATION_FAILED");
    await expectDomainError(
      price("BI", "BIF", 1000, T_BI1, { usdEquivalentMinor: 300 }),
      "VALIDATION_FAILED",
      /USD 2/,
    );
    await expectDomainError(
      price("BI", "BIF", 1000, T_BI1, { reasonText: "   " }),
      "VALIDATION_FAILED",
      /reason/,
    );
    await expectDomainError(
      price("BI", "BIF", 1000, new Date("invalid")),
      "VALIDATION_FAILED",
      /effectiveFrom/,
    );
    expect(await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules")).toBe(0);
  });

  it("refuses a schedule effective in the past (no rewriting of price history)", async () => {
    await expectDomainError(
      setPriceSchedule(d(), ctx(), {
        market: "BI",
        currency: "BIF",
        localUnitPriceMinor: 1000,
        effectiveFrom: new Date("2026-06-30T23:59:59Z"),
        reasonText: "backdated",
      }),
      "VALIDATION_FAILED",
      /not be in the past/,
    );
  });

  it("sets a BI schedule: audited, USD-2 basis defaulted, market-scoped audit, replay-safe", async () => {
    const c = ctx();
    const input = {
      market: "BI",
      currency: "BIF",
      localUnitPriceMinor: BI_P1,
      effectiveFrom: T_BI1,
      reasonText: "initial test price",
      reference: "FD-TEST-1",
      rateNote: "test fixture",
    };
    const shallow = { ...d(), now: () => new Date("2026-02-01T00:00:00Z") };
    const first = await setPriceSchedule(shallow, c, input);
    expect(first.replayed).toBe(false);
    expect(first.result).toMatchObject({
      market: "BI",
      currency: "BIF",
      usdEquivalentMinor: 200,
      localUnitPriceMinor: BI_P1,
      createdBy: ADMIN,
    });

    // Same key + same payload replays the stored result; nothing new is written.
    const again = await setPriceSchedule(shallow, c, input);
    expect(again.replayed).toBe(true);
    expect(again.result.priceScheduleId).toBe(first.result.priceScheduleId);
    expect(await listPriceSchedules(pool, "BI")).toHaveLength(1);

    const audit = await listCommercialAuditEventsForBusiness(pool, "platform:market:BI");
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actorType: "platform_administrator",
      actorId: ADMIN,
      actionType: "price_schedule_set",
      targetId: first.result.priceScheduleId,
      reasonText: "initial test price",
      reference: "FD-TEST-1",
      result: "succeeded",
      priceScheduleId: first.result.priceScheduleId,
    });
  });

  it("enforces the forward rule and keeps history immutable", async () => {
    const before = await listPriceSchedules(pool, "BI");
    const shallow = { ...d(), now: () => new Date("2026-02-01T00:00:00Z") };
    // Equal to, and before, the latest are rejected.
    for (const bad of [T_BI1, new Date("2026-02-15T00:00:00Z")]) {
      await expectDomainError(
        setPriceSchedule(shallow, ctx(), {
          market: "BI",
          currency: "BIF",
          localUnitPriceMinor: 999,
          effectiveFrom: bad,
          reasonText: "not forward",
        }),
        "VALIDATION_FAILED",
        /strictly after/,
      );
    }
    // A later one is accepted; the earlier row is byte-for-byte unchanged.
    await setPriceSchedule({ ...d(), now: () => new Date("2026-05-01T00:00:00Z") }, ctx(), {
      market: "BI",
      currency: "BIF",
      localUnitPriceMinor: BI_P2,
      effectiveFrom: T_BI2,
      reasonText: "later test price",
    });
    const after = await listPriceSchedules(pool, "BI");
    expect(after).toHaveLength(2);
    expect(after[0]).toEqual(before[0]);
    // The database itself refuses to rewrite or remove history.
    await expectPgFailure(
      pool.query("UPDATE commercial_price_schedules SET local_unit_price_minor = 1"),
      /append-only and immutable/,
    );
    await expectPgFailure(
      pool.query("DELETE FROM commercial_price_schedules"),
      /append-only and immutable/,
    );
  });

  it("rejects a concurrent overlapping/duplicate schedule: exactly one wins per effective date", async () => {
    const eff = new Date("2026-09-01T00:00:00Z");
    const run = () =>
      setPriceSchedule({ ...d(), now: () => new Date("2026-08-01T00:00:00Z") }, ctx(), {
        market: "BI",
        currency: "BIF",
        localUnitPriceMinor: 1300,
        effectiveFrom: eff,
        reasonText: "race",
      });
    const results = await Promise.allSettled([run(), run(), run(), run()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM commercial_price_schedules WHERE market = 'BI' AND effective_from = $1",
        [eff],
      ),
    ).toBe(1);
  });

  it("looks up deterministically, historically-safe, with no FX and no cross-market substitution", async () => {
    const at = (iso: string) => new Date(iso);
    await expectDomainError(
      lookupCommercialPrice(pool, {
        market: "BI",
        currency: "BIF",
        at: at("2026-02-28T23:59:59Z"),
      }),
      "RESOURCE_NOT_FOUND",
    );
    const a = await lookupCommercialPrice(pool, { market: "BI", currency: "BIF", at: T_BI1 });
    expect(a.localUnitPriceMinor).toBe(BI_P1);
    const mid = await lookupCommercialPrice(pool, {
      market: "BI",
      currency: "BIF",
      at: at("2026-05-31T23:59:59Z"),
    });
    expect(mid.id).toBe(a.id);
    const b = await lookupCommercialPrice(pool, { market: "BI", currency: "BIF", at: T_BI2 });
    expect(b.localUnitPriceMinor).toBe(BI_P2);
    // Repeatable.
    const b2 = await lookupCommercialPrice(pool, { market: "BI", currency: "BIF", at: T_BI2 });
    expect(b2).toEqual(b);

    // Cross-market currency is refused, never substituted.
    await expectDomainError(
      lookupCommercialPrice(pool, { market: "BI", currency: "RWF", at: T_BI2 }),
      "VALIDATION_FAILED",
    );
    // RW has no schedule: it does NOT borrow BI's price.
    await expectDomainError(
      lookupCommercialPrice(pool, { market: "RW", currency: "RWF", at: T_BI2 }),
      "RESOURCE_NOT_FOUND",
    );
    await expectDomainError(
      lookupCommercialPrice(pool, { market: "XX", currency: "BIF", at: T_BI2 }),
      "VALIDATION_FAILED",
    );
    // Set RW now that its "no price" case has been proven.
    await price("RW", "RWF", RW_P1, T_BI1);
    const rw = await lookupCommercialPrice(pool, { market: "RW", currency: "RWF", at: T_BI2 });
    expect(rw.localUnitPriceMinor).toBe(RW_P1);
  });
});

// ===========================================================================
describe("SETTLEMENT — record (step 1)", () => {
  it("records evidence only: status recorded, priced snapshot, NO ledger credit, account untouched", async () => {
    const { businessId } = await openAccount("BI");
    const res = await settle(businessId, { externalReference: "RCPT-001" });
    expect(res.replayed).toBe(false);
    expect(res.result).toMatchObject({
      businessId,
      status: "recorded",
      market: "BI",
      currency: "BIF",
      amountMinor: 3000,
      unitsPurchased: 3,
      unitPriceUsdMinor: 200,
      localUnitPriceMinor: BI_P1,
      expectedAmountMinor: 3000,
      varianceMinor: 0,
    });
    // Price in force AT receivedAt (2026-04-01) is schedule 1, not the later one.
    expect(res.result.priceEffectiveFrom).toBe(T_BI1.toISOString());

    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      paidBalanceUnits: 0,
      version: 0,
    });

    const audit = await listCommercialAuditEventsForBusiness(pool, businessId);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actorId: ADMIN,
      actionType: "settlement_recorded",
      targetId: res.result.settlementId,
      businessId,
      reference: "RCPT-001",
      reasonText: "received offline",
      result: "succeeded",
    });
  });

  it("uses the schedule in force at receivedAt, and records (never blocks) a variance", async () => {
    const { businessId } = await openAccount("BI");
    const res = await settle(businessId, {
      receivedAt: new Date("2026-06-15T00:00:00Z"),
      unitsPurchased: 2,
      amountMinor: 2000, // expected 2 * 1200 = 2400
    });
    expect(res.result).toMatchObject({
      localUnitPriceMinor: BI_P2,
      expectedAmountMinor: 2400,
      varianceMinor: -400,
      status: "recorded",
    });
  });

  it("fails explicitly when no schedule applied at receivedAt (no fallback price)", async () => {
    const { businessId } = await openAccount("BI");
    await expectDomainError(
      settle(businessId, { receivedAt: new Date("2026-02-01T00:00:00Z") }),
      "RESOURCE_NOT_FOUND",
      /No Commercial price schedule applies/,
    );
    expect(await listSettlementsForBusiness(pool, businessId)).toHaveLength(0);
  });

  it("validates market/currency, amounts, reference, method and dates", async () => {
    const bi = (await openAccount("BI")).businessId;
    const rw = (await openAccount("RW")).businessId;
    await expectDomainError(settle(bi, { currency: "RWF" }), "VALIDATION_FAILED", /BIF/);
    await expectDomainError(settle(rw, { currency: "BIF" }), "VALIDATION_FAILED", /RWF/);
    await expectDomainError(settle(bi, { amountMinor: 0 }), "VALIDATION_FAILED");
    await expectDomainError(settle(bi, { amountMinor: 10.5 }), "VALIDATION_FAILED");
    await expectDomainError(settle(bi, { unitsPurchased: 0 }), "VALIDATION_FAILED");
    await expectDomainError(settle(bi, { unitsPurchased: 1.5 }), "VALIDATION_FAILED");
    await expectDomainError(settle(bi, { externalReference: "" }), "VALIDATION_FAILED");
    await expectDomainError(settle(bi, { externalReference: " padded " }), "VALIDATION_FAILED");
    await expectDomainError(settle(bi, { method: "Bank Transfer" }), "VALIDATION_FAILED");
    await expectDomainError(settle(bi, { reasonText: " " }), "VALIDATION_FAILED");
    await expectDomainError(
      settle(bi, { receivedAt: new Date("2026-07-02T00:00:00Z") }),
      "VALIDATION_FAILED",
      /future/,
    );
    await expectDomainError(settle(newBusiness()), "RESOURCE_NOT_FOUND");
    // RW records fine against its own price.
    const ok = await settle(rw, { currency: "RWF", amountMinor: 3 * RW_P1 });
    expect(ok.result).toMatchObject({ market: "RW", currency: "RWF", localUnitPriceMinor: RW_P1 });
    expect(await listSettlementsForBusiness(pool, bi)).toHaveLength(0);
  });

  it("a conflicting external reference is refused (and audited denied), not silently replayed", async () => {
    const { businessId } = await openAccount("BI");
    const other = (await openAccount("BI")).businessId;
    const reference = `DUP-${randomUUID()}`;
    const first = await settle(businessId, { externalReference: reference });

    // Different key, same (method, reference), same or other Business: refused.
    await expectDomainError(
      settle(businessId, { externalReference: reference }),
      "INVALID_STATE_TRANSITION",
      /already recorded/,
    );
    await expectDomainError(
      settle(other, { externalReference: reference }),
      "INVALID_STATE_TRANSITION",
    );
    expect(await listSettlementsForBusiness(pool, businessId)).toHaveLength(1);
    expect(await listSettlementsForBusiness(pool, other)).toHaveLength(0);

    const audit = await listCommercialAuditEventsForBusiness(pool, businessId);
    expect(audit.map((a) => a.result).sort()).toEqual(["denied", "succeeded"]);
    // A different METHOD with the same reference is different evidence.
    const otherMethod = await settle(businessId, {
      externalReference: reference,
      method: "mobile_money",
    });
    expect(otherMethod.result.settlementId).not.toBe(first.result.settlementId);
  });

  it("same key + same payload replays; the reference is recorded exactly once", async () => {
    const { businessId } = await openAccount("BI");
    const c = ctx();
    const input: RecordSettlementInput = {
      businessId,
      method: "cash",
      externalReference: `REPLAY-${randomUUID()}`,
      currency: "BIF",
      amountMinor: 1000,
      unitsPurchased: 1,
      receivedAt: new Date("2026-04-01T00:00:00Z"),
      reasonText: "replay",
    };
    const a = await recordSettlement(d(), c, input);
    const b = await recordSettlement(d(), c, input);
    expect(b.replayed).toBe(true);
    expect(b.result).toEqual(a.result);
    expect(await listSettlementsForBusiness(pool, businessId)).toHaveLength(1);
    expect(await listCommercialAuditEventsForBusiness(pool, businessId)).toHaveLength(1);
  });
});

// ===========================================================================
describe("SETTLEMENT — confirm (step 2) and ledger/account effect", () => {
  it("confirms: exactly one paid credit_grant, account derived through the ledger, provenance kept", async () => {
    const { businessId } = await openAccount("BI");
    const rec = await settle(businessId, { externalReference: "CONF-1" });
    const settlementId = rec.result.settlementId;

    const res = await confirmSettlement(d(), ctx(), {
      businessId,
      settlementId,
      confirmationNote: "verified against bank statement",
    });
    expect(res.replayed).toBe(false);
    expect(res.result).toMatchObject({
      status: "confirmed",
      unitsCredited: 3,
      ledgerAccountVersion: 1,
      paidBalanceAfter: 3,
      priceScheduleId: rec.result.priceScheduleId,
    });

    const ledger = await listLedgerEntries(pool, businessId);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      id: res.result.ledgerEntryId,
      entryType: "credit_grant",
      bucket: "paid",
      unitsDelta: 3,
      trialReservedDelta: 0,
      paidReservedDelta: 0,
      sourceReferenceType: "settlement",
      sourceReferenceId: settlementId,
      idempotencyScopeKey: `settlement:${settlementId}:credit_grant`,
      createdBy: ADMIN,
    });

    // The account is DERIVED: it equals the ledger totals and its latest entry.
    const account = await getCommercialAccount(pool, businessId);
    const totals = await sumLedger(pool, businessId);
    expect(account).toMatchObject({ paidBalanceUnits: 3, trialRemainingUnits: 0, version: 1 });
    expect(totals.paidBalanceUnits).toBe(account?.paidBalanceUnits);

    const settlement = await getSettlement(pool, settlementId);
    expect(settlement).toMatchObject({
      status: "confirmed",
      confirmedBy: ADMIN,
      confirmationNote: "verified against bank statement",
      ledgerEntryId: res.result.ledgerEntryId,
      // Immutable pricing/settlement provenance is intact after confirmation.
      priceScheduleId: rec.result.priceScheduleId,
      localUnitPriceMinor: BI_P1,
      amountMinor: 3000,
      externalReference: "CONF-1",
      recordedBy: ADMIN,
    });

    const audit = (await listCommercialAuditEventsForBusiness(pool, businessId)).find(
      (a) => a.actionType === "settlement_confirmed",
    );
    expect(audit).toMatchObject({
      actorId: ADMIN,
      targetId: settlementId,
      businessId,
      reasonText: "verified against bank statement",
      reference: "CONF-1",
      result: "succeeded",
      ledgerEntryId: res.result.ledgerEntryId,
      priceScheduleId: rec.result.priceScheduleId,
    });
  });

  it("a duplicate confirmation (same key) replays safely: no second credit", async () => {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId);
    const c = ctx();
    const input = { businessId, settlementId: result.settlementId, confirmationNote: "ok" };
    const first = await confirmSettlement(d(), c, input);
    const second = await confirmSettlement(d(), c, input);
    expect(second.replayed).toBe(true);
    expect(second.result).toEqual(first.result);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);
  });

  it("a NEW key on an already-confirmed settlement is refused (prohibited repeat transition), audited denied", async () => {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId);
    const input = { businessId, settlementId: result.settlementId, confirmationNote: "ok" };
    await confirmSettlement(d(), ctx(), input);
    await expectDomainError(
      confirmSettlement(d(), ctx(), input),
      "INVALID_STATE_TRANSITION",
      /only a "recorded" settlement/,
    );
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);
    const denied = (await listCommercialAuditEventsForBusiness(pool, businessId)).filter(
      (a) => a.result === "denied",
    );
    expect(denied).toHaveLength(1);
    expect(denied[0].actionType).toBe("settlement_confirmed");
  });

  it("cross-Business confirmation is impossible: looks like not-found, nothing is written", async () => {
    const owner = (await openAccount("BI")).businessId;
    const intruder = (await openAccount("BI")).businessId;
    const { result } = await settle(owner);
    await expectDomainError(
      confirmSettlement(d(), ctx(), {
        businessId: intruder,
        settlementId: result.settlementId,
        confirmationNote: "not mine",
      }),
      "RESOURCE_NOT_FOUND",
    );
    expect((await getSettlement(pool, result.settlementId))?.status).toBe("recorded");
    expect(await listLedgerEntries(pool, owner)).toHaveLength(0);
    expect(await listLedgerEntries(pool, intruder)).toHaveLength(0);
    expect((await getCommercialAccount(pool, intruder))?.paidBalanceUnits).toBe(0);
  });

  it("rejects an unknown settlement, a malformed id and a missing note", async () => {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId);
    await expectDomainError(
      confirmSettlement(d(), ctx(), {
        businessId,
        settlementId: randomUUID(),
        confirmationNote: "x",
      }),
      "RESOURCE_NOT_FOUND",
    );
    await expectDomainError(
      confirmSettlement(d(), ctx(), { businessId, settlementId: "nope", confirmationNote: "x" }),
      "VALIDATION_FAILED",
    );
    await expectDomainError(
      confirmSettlement(d(), ctx(), {
        businessId,
        settlementId: result.settlementId,
        confirmationNote: "  ",
      }),
      "VALIDATION_FAILED",
    );
    expect((await getSettlement(pool, result.settlementId))?.status).toBe("recorded");
  });

  it("the ledger credit is exactly the settlement's units and accumulates on top of an existing balance", async () => {
    const { businessId } = await openAccount("BI");
    await withPlatformTransaction(pool, (tx) =>
      postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "credit_adjustment",
        bucket: "paid",
        unitsDelta: 5,
        reasonCode: "correction",
        reasonText: "pre-existing",
        idempotencyScopeKey: `scope-${randomUUID()}`,
        createdBy: "admin-test",
        correlationId: "c",
      }),
    );
    const { result } = await settle(businessId, { unitsPurchased: 4, amountMinor: 4000 });
    const done = await confirmSettlement(d(), ctx(), {
      businessId,
      settlementId: result.settlementId,
      confirmationNote: "ok",
    });
    expect(done.result).toMatchObject({
      unitsCredited: 4,
      paidBalanceAfter: 9,
      ledgerAccountVersion: 2,
    });
  });

  it("rollback: a failure after the credit and the transition leaves NO partial ledger/account/settlement/key state", async () => {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId, { externalReference: "ROLLBACK-1" });
    await pool.query(`
      CREATE FUNCTION wpcom02_fail_confirm_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.action_type = 'settlement_confirmed' AND NEW.reference = 'ROLLBACK-1' THEN
          RAISE EXCEPTION 'simulated audit failure';
        END IF;
        RETURN NEW;
      END; $$`);
    await pool.query(
      `CREATE TRIGGER wpcom02_fail_confirm_audit BEFORE INSERT ON commercial_audit_events
         FOR EACH ROW EXECUTE FUNCTION wpcom02_fail_confirm_audit()`,
    );
    const c = ctx();
    const input = { businessId, settlementId: result.settlementId, confirmationNote: "ok" };
    try {
      await expectPgFailure(confirmSettlement(d(), c, input), /simulated audit failure/);
      expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
      expect(await getCommercialAccount(pool, businessId)).toMatchObject({
        paidBalanceUnits: 0,
        version: 0,
      });
      expect((await getSettlement(pool, result.settlementId))?.status).toBe("recorded");
      // The processing reservation rolled back with everything else.
      expect(
        await count("SELECT COUNT(*)::int AS n FROM idempotency_keys WHERE idempotency_key = $1", [
          c.idempotencyKey,
        ]),
      ).toBe(0);
    } finally {
      await pool.query("DROP TRIGGER wpcom02_fail_confirm_audit ON commercial_audit_events");
      await pool.query("DROP FUNCTION wpcom02_fail_confirm_audit()");
    }
    // The same key is reusable once the fault is gone.
    const retry = await confirmSettlement(d(), c, input);
    expect(retry.replayed).toBe(false);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);
  });

  it("rollback at the primitive level: a throw after ledger posting leaves no ledger, account or reservation", async () => {
    const { businessId } = await openAccount("BI");
    const c = ctx();
    await expect(
      runAdministratorCommand(
        d(),
        c,
        { commandType: "probe", payload: { businessId } },
        async (tx, actor) => {
          await postCommercialLedgerEntry(tx, {
            businessId,
            entryType: "credit_grant",
            bucket: "paid",
            unitsDelta: 2,
            idempotencyScopeKey: `scope-${randomUUID()}`,
            createdBy: actor.id,
            correlationId: "c",
          });
          throw new Error("boom");
        },
      ),
    ).rejects.toThrow("boom");
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    expect((await getCommercialAccount(pool, businessId))?.version).toBe(0);
    expect(
      await count("SELECT COUNT(*)::int AS n FROM idempotency_keys WHERE idempotency_key = $1", [
        c.idempotencyKey,
      ]),
    ).toBe(0);
  });
});

// ===========================================================================
describe("IDEMPOTENCY", () => {
  async function recordedSettlement() {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId);
    return { businessId, settlementId: result.settlementId };
  }

  it("same key, different command => conflict, nothing executed", async () => {
    const { businessId, settlementId } = await recordedSettlement();
    const c = ctx();
    await recordSettlement(d(), c, {
      businessId,
      method: "cash",
      externalReference: `K-${randomUUID()}`,
      currency: "BIF",
      amountMinor: 1000,
      unitsPurchased: 1,
      receivedAt: new Date("2026-04-01T00:00:00Z"),
      reasonText: "x",
    });
    await expectDomainError(
      confirmSettlement(d(), c, { businessId, settlementId, confirmationNote: "x" }),
      "IDEMPOTENCY_CONFLICT",
    );
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
  });

  it("same key, different actor => conflict (a second administrator cannot replay another's command)", async () => {
    const { businessId, settlementId } = await recordedSettlement();
    const c = ctx();
    const input = { businessId, settlementId, confirmationNote: "x" };
    await confirmSettlement(d(), c, input);
    await expectDomainError(
      confirmSettlement(d(), { ...c, adminUserId: OTHER_ADMIN }, input),
      "IDEMPOTENCY_CONFLICT",
    );
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
  });

  it("same key, different payload => conflict", async () => {
    const { businessId, settlementId } = await recordedSettlement();
    const c = ctx();
    await confirmSettlement(d(), c, { businessId, settlementId, confirmationNote: "first note" });
    await expectDomainError(
      confirmSettlement(d(), c, { businessId, settlementId, confirmationNote: "other note" }),
      "IDEMPOTENCY_CONFLICT",
    );
    // Record-side: same key, different amount.
    const rc = ctx();
    const base: RecordSettlementInput = {
      businessId,
      method: "cash",
      externalReference: `P-${randomUUID()}`,
      currency: "BIF",
      amountMinor: 1000,
      unitsPurchased: 1,
      receivedAt: new Date("2026-04-01T00:00:00Z"),
      reasonText: "x",
    };
    await recordSettlement(d(), rc, base);
    await expectDomainError(
      recordSettlement(d(), rc, { ...base, amountMinor: 1100 }),
      "IDEMPOTENCY_CONFLICT",
    );
  });

  it("same key, different Business => conflict", async () => {
    const a = await recordedSettlement();
    const b = await recordedSettlement();
    const c = ctx();
    await confirmSettlement(d(), c, {
      businessId: a.businessId,
      settlementId: a.settlementId,
      confirmationNote: "x",
    });
    await expectDomainError(
      confirmSettlement(d(), c, {
        businessId: b.businessId,
        settlementId: b.settlementId,
        confirmationNote: "x",
      }),
      "IDEMPOTENCY_CONFLICT",
    );
    expect((await getSettlement(pool, b.settlementId))?.status).toBe("recorded");
    expect(await listLedgerEntries(pool, b.businessId)).toHaveLength(0);
  });

  it("concurrent duplicate confirmation (same key) credits exactly once", async () => {
    const { businessId, settlementId } = await recordedSettlement();
    const c = ctx();
    const input = { businessId, settlementId, confirmationNote: "race" };
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => confirmSettlement(d(), c, input)),
    );
    const executed = results.filter((r) => r.status === "fulfilled" && r.value.replayed === false);
    expect(executed).toHaveLength(1);
    for (const r of results) {
      if (r.status === "rejected") {
        expect((r.reason as CommercialDomainError).category).toBe("TEMPORARY_UNAVAILABLE");
      }
    }
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);
  });

  it("concurrent confirmations with DIFFERENT keys still credit exactly once", async () => {
    const { businessId, settlementId } = await recordedSettlement();
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        confirmSettlement(d(), ctx(), { businessId, settlementId, confirmationNote: "race" }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) {
      if (r.status === "rejected") {
        expect((r.reason as CommercialDomainError).category).toBe("INVALID_STATE_TRANSITION");
      }
    }
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);
  });

  it("concurrent recording of one reference under different keys creates one settlement", async () => {
    const { businessId } = await openAccount("BI");
    const reference = `RACE-${randomUUID()}`;
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => settle(businessId, { externalReference: reference })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await listSettlementsForBusiness(pool, businessId)).toHaveLength(1);
  });
});

// ===========================================================================
describe("AUTHORITY", () => {
  const denied = /Platform Administrator with verified MFA/;

  it("denies an inactive administrator, a missing MFA proof and Business roles for every command, writing nothing", async () => {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId);
    const before = {
      settlements: await count("SELECT COUNT(*)::int AS n FROM commercial_settlements"),
      audit: await count("SELECT COUNT(*)::int AS n FROM commercial_audit_events"),
      ledger: await count("SELECT COUNT(*)::int AS n FROM commercial_ledger_entries"),
      prices: await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules"),
    };
    const attackers: CommercialCommandContext[] = [
      ctx({ adminUserId: "inactive-admin" }),
      ctx({ verifiedMfaSatisfied: false }),
      ctx({ adminUserId: "business-owner-uid" }),
      ctx({ adminUserId: "business-manager-uid" }),
      ctx({ adminUserId: "business-staff-uid" }),
      ctx({ adminUserId: "" }),
    ];
    for (const attacker of attackers) {
      await expectDomainError(
        setPriceSchedule(d(), attacker, {
          market: "BI",
          currency: "BIF",
          localUnitPriceMinor: 5,
          effectiveFrom: new Date("2027-01-01T00:00:00Z"),
          reasonText: "x",
        }),
        "AUTH_FORBIDDEN",
        denied,
      );
      await expectDomainError(
        recordSettlement(d(), attacker, {
          businessId,
          method: "cash",
          externalReference: `A-${randomUUID()}`,
          currency: "BIF",
          amountMinor: 1000,
          unitsPurchased: 1,
          receivedAt: new Date("2026-04-01T00:00:00Z"),
          reasonText: "x",
        }),
        "AUTH_FORBIDDEN",
      );
      await expectDomainError(
        confirmSettlement(d(), attacker, {
          businessId,
          settlementId: result.settlementId,
          confirmationNote: "x",
        }),
        "AUTH_FORBIDDEN",
      );
    }
    expect({
      settlements: await count("SELECT COUNT(*)::int AS n FROM commercial_settlements"),
      audit: await count("SELECT COUNT(*)::int AS n FROM commercial_audit_events"),
      ledger: await count("SELECT COUNT(*)::int AS n FROM commercial_ledger_entries"),
      prices: await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules"),
    }).toEqual(before);
    expect((await getSettlement(pool, result.settlementId))?.status).toBe("recorded");
  });
});

// ===========================================================================
describe("DATABASE GUARDS and provenance immutability", () => {
  it("a later price schedule never rewrites a settlement's recorded pricing", async () => {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId, { externalReference: "PROV-1" });
    await setPriceSchedule({ ...d(), now: () => new Date("2026-10-01T00:00:00Z") }, ctx(), {
      market: "BI",
      currency: "BIF",
      localUnitPriceMinor: 2222,
      effectiveFrom: new Date("2026-11-01T00:00:00Z"),
      reasonText: "later change",
    });
    await confirmSettlement(d(), ctx(), {
      businessId,
      settlementId: result.settlementId,
      confirmationNote: "ok",
    });
    const s = await getSettlement(pool, result.settlementId);
    expect(s).toMatchObject({
      localUnitPriceMinor: BI_P1,
      expectedAmountMinor: 3000,
      priceScheduleId: result.priceScheduleId,
      status: "confirmed",
    });
    // Lookup for that historical instant is unchanged too.
    const again = await lookupCommercialPrice(pool, {
      market: "BI",
      currency: "BIF",
      at: new Date("2026-04-01T00:00:00Z"),
    });
    expect(again.id).toBe(result.priceScheduleId);
  });

  it("rejects direct tampering: evidence edits, status jumps, deletes, truncates, unbacked confirmation", async () => {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId);
    const id = result.settlementId;
    await expectPgFailure(
      pool.query("UPDATE commercial_settlements SET amount_minor = 1 WHERE id = $1", [id]),
      /may only change recorded -> confirmed|immutable/,
    );
    await expectPgFailure(
      pool.query("UPDATE commercial_settlements SET status = 'recorded' WHERE id = $1", [id]),
      /recorded -> confirmed/,
    );
    // Confirmation without a matching ledger credit is impossible.
    await expectPgFailure(
      pool.query(
        `UPDATE commercial_settlements SET status = 'confirmed', confirmed_by = 'x', confirmed_at = now(),
           confirmation_note = 'n', confirm_idempotency_key = 'k', confirm_correlation_id = 'c',
           ledger_entry_id = NULL WHERE id = $1`,
        [id],
      ),
      /must be confirmed by a paid credit_grant/,
    );
    await expectPgFailure(
      pool.query("DELETE FROM commercial_settlements WHERE id = $1", [id]),
      /append-only and immutable/,
    );
    await expectPgFailure(
      pool.query("TRUNCATE commercial_settlements"),
      /append-only and immutable|cannot truncate/,
    );
    expect((await getSettlement(pool, id))?.status).toBe("recorded");
  });

  it("a confirmed settlement can never change again, and one ledger credit cannot confirm two settlements", async () => {
    const { businessId } = await openAccount("BI");
    const a = (await settle(businessId)).result.settlementId;
    const b = (await settle(businessId)).result.settlementId;
    const done = await confirmSettlement(d(), ctx(), {
      businessId,
      settlementId: a,
      confirmationNote: "ok",
    });
    await expectPgFailure(
      pool.query("UPDATE commercial_settlements SET confirmation_note = 'edit' WHERE id = $1", [a]),
      /recorded -> confirmed/,
    );
    // Re-using A's credit to "confirm" B is refused (wrong source reference / unique entry).
    await expectPgFailure(
      pool.query(
        `UPDATE commercial_settlements SET status = 'confirmed', confirmed_by = 'x', confirmed_at = now(),
           confirmation_note = 'n', confirm_idempotency_key = 'k2', confirm_correlation_id = 'c',
           ledger_entry_id = $2 WHERE id = $1`,
        [b, done.result.ledgerEntryId],
      ),
      /must be confirmed by a paid credit_grant|duplicate key|unique/,
    );
  });

  it("rejects malformed inserts: born-confirmed, wrong market for the account, forged price snapshot, later schedule", async () => {
    const { businessId } = await openAccount("BI");
    const good = (await settle(businessId)).result;
    const insert = (over: Record<string, unknown>) => {
      const row: Record<string, unknown> = {
        business_id: businessId,
        status: "recorded",
        method: "cash",
        external_reference: `TAMPER-${randomUUID()}`,
        market: "BI",
        currency: "BIF",
        amount_minor: 1000,
        units_purchased: 1,
        received_at: new Date("2026-04-01T00:00:00Z"),
        price_schedule_id: good.priceScheduleId,
        unit_price_usd_minor: 200,
        local_unit_price_minor: BI_P1,
        price_effective_from: T_BI1,
        expected_amount_minor: BI_P1,
        variance_minor: 0,
        recorded_by: "x",
        record_reason_text: "x",
        record_idempotency_key: `k-${randomUUID()}`,
        record_correlation_id: "c",
        ...over,
      };
      const cols = Object.keys(row);
      return pool.query(
        `INSERT INTO commercial_settlements (${cols.join(",")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")})`,
        cols.map((c) => row[c]),
      );
    };
    await insert({}); // sanity: the fixture itself is valid
    await expectPgFailure(
      insert({ status: "confirmed" }),
      /must be inserted with status recorded|confirmation_consistency/,
    );
    await expectPgFailure(
      insert({ market: "RW", currency: "RWF" }),
      /does not match the Business account market/,
    );
    await expectPgFailure(
      insert({ local_unit_price_minor: 1, expected_amount_minor: 1 }),
      /does not equal its price schedule/,
    );
    // Uses schedule 1 although schedule 2 was in force at that received_at.
    await expectPgFailure(
      insert({ received_at: new Date("2026-06-15T00:00:00Z") }),
      /was not the schedule in force/,
    );
    await expectPgFailure(insert({ amount_minor: 1, variance_minor: 5 }), /variance|check/i);
    await expectPgFailure(
      insert({ currency: "RWF" }),
      /market_currency|does not equal its price schedule/,
    );
    await expectPgFailure(insert({ method: "Bad Method" }), /method|check/i);
  });
});

// ===========================================================================
describe("REVIEW FINDINGS (PR #286) — exactly-once credit, price serialisation, audit baseline", () => {
  it("the ledger itself refuses a second credit_grant for the same settlement, under any scope key", async () => {
    const { businessId } = await openAccount("BI");
    const { result } = await settle(businessId);
    const credit = (scope: string) =>
      withPlatformTransaction(pool, (tx) =>
        postCommercialLedgerEntry(tx, {
          businessId,
          entryType: "credit_grant",
          bucket: "paid",
          unitsDelta: 3,
          sourceReference: { type: "settlement", id: result.settlementId },
          idempotencyScopeKey: scope,
          createdBy: ADMIN,
          correlationId: "c",
        }),
      );
    await credit(`rogue-scope-${randomUUID()}`);
    await expectPgFailure(
      credit(`another-scope-${randomUUID()}`),
      /commercial_ledger_one_credit_per_settlement|duplicate key/,
    );
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
    // The rogue credit does not confirm the settlement through the command either: the
    // command's own scope key is a different one, so the unique index stops the second credit.
    await expectPgFailure(
      confirmSettlement(d(), ctx(), {
        businessId,
        settlementId: result.settlementId,
        confirmationNote: "x",
      }),
      /commercial_ledger_one_credit_per_settlement|duplicate key/,
    );
    expect((await getSettlement(pool, result.settlementId))?.status).toBe("recorded");
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);
  });

  it("settlement pricing waits for a concurrent, uncommitted schedule insert and then uses it", async () => {
    // RW has one schedule (effective 2026-03-01). A second one effective 2026-06-20 is
    // inserted in a transaction that stays open while a settlement received 2026-06-25 is recorded.
    const { businessId } = await openAccount("RW");
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    let inserted!: () => void;
    const insertedSignal = new Promise<void>((resolve) => (inserted = resolve));
    const writer = withPlatformTransaction(pool, async (tx) => {
      await insertPriceSchedule(tx, {
        market: "RW",
        localUnitPriceMinor: 1777,
        effectiveFrom: new Date("2026-06-20T00:00:00Z"),
        createdBy: ADMIN,
        reasonText: "concurrent schedule",
        correlationId: "c",
      });
      inserted();
      await gate;
    });
    await insertedSignal;

    let settled = false;
    const recording = settle(businessId, {
      currency: "RWF",
      amountMinor: 1777,
      unitsPurchased: 1,
      receivedAt: new Date("2026-06-25T00:00:00Z"),
    }).finally(() => (settled = true));
    await new Promise((r) => setTimeout(r, 400));
    expect(settled, "recording must wait for the schedule writer").toBe(false);

    release();
    await writer;
    const res = await recording;
    expect(res.result).toMatchObject({
      localUnitPriceMinor: 1777,
      priceEffectiveFrom: "2026-06-20T00:00:00.000Z",
      varianceMinor: 0,
    });
  });

  it("concurrent confirmations of two settlements keep an accurate audit baseline chain", async () => {
    const { businessId } = await openAccount("BI");
    const a = (await settle(businessId)).result.settlementId;
    const b = (await settle(businessId)).result.settlementId;
    await Promise.all(
      [a, b].map((settlementId) =>
        confirmSettlement(d(), ctx(), { businessId, settlementId, confirmationNote: "race" }),
      ),
    );
    const confirms = (await listCommercialAuditEventsForBusiness(pool, businessId)).filter(
      (e) => e.actionType === "settlement_confirmed",
    );
    expect(confirms).toHaveLength(2);
    const pairs = confirms
      .map((e) => [
        (e.beforeSnapshot as { accountVersion: number; paidBalanceUnits: number }).accountVersion,
        (e.afterSnapshot as { accountVersion: number }).accountVersion,
        (e.beforeSnapshot as { paidBalanceUnits: number }).paidBalanceUnits,
      ])
      .sort((x, y) => x[0] - y[0]);
    expect(pairs).toEqual([
      [0, 1, 0],
      [1, 2, 3],
    ]);
  });
});
