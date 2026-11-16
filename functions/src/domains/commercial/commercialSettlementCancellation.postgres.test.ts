/**
 * WP-COM-03A — Commercial recorded-settlement cancellation: real PostgreSQL tests.
 *
 *   PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *     npx vitest run --config vitest.postgres.config.ts commercialSettlementCancellation
 *
 * Same isolation model as the WP-COM-01/02/03 suites: Commercial rows are
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
import { migrateDown, migrateUp } from "../../infrastructure/postgres/migrationRunner";
import { withPlatformTransaction } from "../../infrastructure/postgres/postgresTransaction";
import {
  getCommercialAccount,
  insertCommercialAccount,
} from "./repositories/commercialAccountRepository";
import { listLedgerEntries } from "./repositories/commercialLedgerRepository";
import { listCommercialAuditEventsForBusiness } from "./repositories/commercialAuditRepository";
import { getSettlement } from "./repositories/commercialSettlementRepository";
import { listStandingEvents } from "./repositories/commercialStandingRepository";
import { postCommercialLedgerEntry } from "./services/postCommercialLedgerEntry";
import { setPriceSchedule } from "./services/setPriceSchedule";
import { recordSettlement } from "./services/recordSettlement";
import { confirmSettlement } from "./services/confirmSettlement";
import { voidSettlement } from "./services/voidSettlement";
import { cancelSettlement } from "./services/cancelSettlement";
import type {
  CommercialCommandContext,
  CommercialCommandDeps,
} from "./services/commercialAdministratorCommand";
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
    "wpcom03a_fail_cancel_audit",
  ]) {
    await pool.query(`DROP FUNCTION IF EXISTS ${fn}() CASCADE`);
  }
  const hasMigrations = await pool.query("SELECT to_regclass('public.schema_migrations') AS t");
  if (hasMigrations.rows[0].t !== null) {
    await pool.query(
      "DELETE FROM schema_migrations WHERE version IN ('0021', '0022', '0023', '0024', '0025', '0026', '0027', '0028', '0029')",
    );
    await pool
      .query("DELETE FROM idempotency_keys WHERE idempotency_key LIKE 'wpcom03a-%'")
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
const key = () => `wpcom03a-${randomUUID()}`;
const ctx = (overrides: Partial<CommercialCommandContext> = {}): CommercialCommandContext => ({
  adminUserId: ADMIN,
  verifiedMfaSatisfied: true,
  idempotencyKey: key(),
  correlationId: "corr-wpcom03a",
  ...overrides,
});
const newBusiness = () => `biz-${randomUUID()}`;

async function openAccount(businessId = newBusiness()) {
  const account = await withPlatformTransaction(pool, (tx) =>
    insertCommercialAccount(tx, {
      businessId,
      settlementMarket: "BI",
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

async function confirmedSettlement(businessId: string, units = 3) {
  const settlementId = await recordedSettlement(businessId, units);
  const conf = await confirmSettlement(d(), ctx(), {
    businessId,
    settlementId,
    confirmationNote: "verified",
  });
  return { settlementId, confirmation: conf.result };
}

const cancelIt = (
  businessId: string,
  settlementId: string,
  context = ctx(),
  overrides: Record<string, unknown> = {},
) =>
  cancelSettlement(d(), context, {
    businessId,
    settlementId,
    reasonText: "recorded against the wrong Business by mistake",
    reference: "REF-CANCEL-1",
    ...overrides,
  });

const confirmIt = (businessId: string, settlementId: string, context = ctx()) =>
  confirmSettlement(d(), context, { businessId, settlementId, confirmationNote: "verified" });

/** Raw `recorded -> cancelled` with each provenance column individually overridable (NULL by `null`). */
function rawCancel(settlementId: string, overrides: Record<string, string | null> = {}) {
  const v: Record<string, string | null> = {
    cancelled_by: "raw-admin",
    cancel_reason_text: "raw reason",
    cancel_reference: "raw-ref",
    cancel_idempotency_key: key(),
    cancel_correlation_id: "raw-corr",
    ...overrides,
  };
  return pool.query(
    `UPDATE commercial_settlements
        SET status = 'cancelled', cancelled_at = now(), cancelled_by = $2,
            cancel_reason_text = $3, cancel_reference = $4, cancel_idempotency_key = $5,
            cancel_correlation_id = $6
      WHERE id = $1`,
    [
      settlementId,
      v.cancelled_by,
      v.cancel_reason_text,
      v.cancel_reference,
      v.cancel_idempotency_key,
      v.cancel_correlation_id,
    ],
  );
}

const auditFor = async (businessId: string, actionType: string) =>
  (await listCommercialAuditEventsForBusiness(pool, businessId)).filter(
    (e) => e.actionType === actionType,
  );
/** Only the audit rows that record a mutation that actually happened. */
const succeededAuditFor = async (businessId: string, actionType: string) =>
  (await auditFor(businessId, actionType)).filter((e) => e.result === "succeeded");

// ===========================================================================
describe("CANCEL — cancelSettlement", () => {
  it("cancels a recorded settlement: terminal status, full immutable provenance, no ledger effect, no account/price/standing change", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    const before = await getSettlement(pool, settlementId);
    const accountBefore = await getCommercialAccount(pool, businessId);
    const prices = await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules");
    const c = ctx({ correlationId: "corr-cancel-happy" });

    const res = await cancelIt(businessId, settlementId, c);
    expect(res.replayed).toBe(false);
    expect(res.result).toMatchObject({ settlementId, businessId, status: "cancelled" });

    const after = await getSettlement(pool, settlementId);
    expect(after).toMatchObject({
      status: "cancelled",
      cancelledBy: ADMIN,
      cancelReasonText: "recorded against the wrong Business by mistake",
      cancelReference: "REF-CANCEL-1",
      cancelIdempotencyKey: c.idempotencyKey,
      // Nothing was confirmed, credited or voided.
      confirmedBy: null,
      confirmedAt: null,
      ledgerEntryId: null,
      voidedBy: null,
      voidLedgerEntryId: null,
    });
    expect(after?.cancelledAt).toBeInstanceOf(Date);
    // Evidence and pricing provenance are retained verbatim.
    expect(after).toMatchObject({
      method: before?.method,
      externalReference: before?.externalReference,
      amountMinor: before?.amountMinor,
      unitsPurchased: before?.unitsPurchased,
      priceScheduleId: before?.priceScheduleId,
      unitPriceUsdMinor: before?.unitPriceUsdMinor,
      localUnitPriceMinor: before?.localUnitPriceMinor,
      recordedBy: before?.recordedBy,
      recordIdempotencyKey: before?.recordIdempotencyKey,
    });
    const stored = await pool.query(
      "SELECT cancel_correlation_id FROM commercial_settlements WHERE id = $1",
      [settlementId],
    );
    expect(stored.rows[0].cancel_correlation_id).toBe("corr-cancel-happy");

    // NO ledger effect, NO account mutation, NO price mutation, NO standing change.
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    expect(await getCommercialAccount(pool, businessId)).toEqual(accountBefore);
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      paidBalanceUnits: 0,
      version: 0,
    });
    expect(await count("SELECT COUNT(*)::int AS n FROM commercial_price_schedules")).toBe(prices);
    expect((await listStandingEvents(pool, businessId)).map((e) => e.eventType)).toEqual([]);
  });

  it("writes one immutable audit row: WHO / WHAT / BUSINESS / WHEN / WHY / REFERENCE / BEFORE / AFTER / RESULT", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 2);
    const c = ctx({ correlationId: "corr-audit" });
    const res = await cancelIt(businessId, settlementId, c);

    const events = await auditFor(businessId, "settlement_cancelled");
    expect(events).toHaveLength(1);
    const [audit] = events;
    expect(audit).toMatchObject({
      id: res.result.auditEventId,
      actorType: "platform_administrator",
      actorId: ADMIN, // WHO
      actionType: "settlement_cancelled", // WHAT
      targetType: "settlement",
      targetId: settlementId,
      businessId, // BUSINESS
      reasonText: "recorded against the wrong Business by mistake", // WHY
      reference: "REF-CANCEL-1", // REFERENCE
      correlationId: "corr-audit",
      idempotencyKey: c.idempotencyKey,
      result: "succeeded", // RESULT
      ledgerEntryId: null,
      beforeSnapshot: { settlementStatus: "recorded", paidBalanceUnits: 0, accountVersion: 0 }, // BEFORE
      afterSnapshot: {
        settlementStatus: "cancelled",
        paidBalanceUnits: 0,
        accountVersion: 0,
        unitsPurchased: 2,
        amountMinor: 2 * BI_PRICE,
        currency: "BIF",
      }, // AFTER
    });
    expect(audit.occurredAt).toBeInstanceOf(Date); // WHEN
    // Immutable: the database refuses to edit or delete it.
    await expectPgFailure(
      pool.query("UPDATE commercial_audit_events SET reason_text = 'x' WHERE id = $1", [audit.id]),
      /immutable|append-only|restrict|not permitted/i,
    );
    await expectPgFailure(
      pool.query("DELETE FROM commercial_audit_events WHERE id = $1", [audit.id]),
      /immutable|append-only|restrict|not permitted/i,
    );
  });

  it("the audit baseline reflects the account state under the lock when a credit races the cancel on the same Business", async () => {
    const { businessId } = await openAccount();
    const toCancel = await recordedSettlement(businessId, 2);
    const other = await recordedSettlement(businessId, 5);
    const results = await Promise.allSettled([
      cancelIt(businessId, toCancel),
      confirmIt(businessId, other),
    ]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const account = await getCommercialAccount(pool, businessId);
    const [audit] = await auditFor(businessId, "settlement_cancelled");
    const before = audit.beforeSnapshot as { paidBalanceUnits: number; accountVersion: number };
    const after = audit.afterSnapshot as { paidBalanceUnits: number; accountVersion: number };
    // A cancellation changes nothing on the account: before == after, and the pair is one of the
    // two real states (before or after the other settlement's credit), never a torn mixture.
    expect({ units: after.paidBalanceUnits, version: after.accountVersion }).toEqual({
      units: before.paidBalanceUnits,
      version: before.accountVersion,
    });
    expect([
      { units: 0, version: 0 },
      { units: 5, version: 1 },
    ]).toContainEqual({ units: before.paidBalanceUnits, version: before.accountVersion });
    expect(account).toMatchObject({ paidBalanceUnits: 5, version: 1 });
  });

  it("requires a reason and a reference (blank, whitespace, missing, non-string): validation error, nothing written", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    const audits = await count("SELECT COUNT(*)::int AS n FROM commercial_audit_events");
    for (const bad of [
      { reasonText: "" },
      { reasonText: "   " },
      { reasonText: undefined },
      { reasonText: 42 },
      { reference: "" },
      { reference: " \t " },
      { reference: undefined },
      { reference: null },
    ]) {
      await expectDomainError(
        cancelIt(businessId, settlementId, ctx(), bad as Record<string, unknown>),
        "VALIDATION_FAILED",
      );
    }
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
    expect(await count("SELECT COUNT(*)::int AS n FROM commercial_audit_events")).toBe(audits);
  });

  it("rejects unknown, malformed and cross-Business settlement ids as not found and writes nothing", async () => {
    const owner = (await openAccount()).businessId;
    const intruder = (await openAccount()).businessId;
    const settlementId = await recordedSettlement(owner, 3);
    await expectDomainError(cancelIt(intruder, settlementId), "RESOURCE_NOT_FOUND");
    await expectDomainError(cancelIt(owner, randomUUID()), "RESOURCE_NOT_FOUND");
    await expectDomainError(cancelIt(owner, "not-a-uuid"), "RESOURCE_NOT_FOUND");
    await expectDomainError(cancelIt("", settlementId), "VALIDATION_FAILED");
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
    expect(await succeededAuditFor(owner, "settlement_cancelled")).toHaveLength(0);
  });
});

// ===========================================================================
describe("LIFECYCLE — only recorded -> cancelled; cancelled is terminal", () => {
  it("a cancelled settlement cannot be confirmed (service and raw SQL): no credit is ever granted", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    await cancelIt(businessId, settlementId);

    await expectDomainError(confirmIt(businessId, settlementId), "INVALID_STATE_TRANSITION");
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(0);

    // Raw attempt, even with a well-formed forged credit id, is refused by the database guard.
    await expectPgFailure(
      pool.query(
        `UPDATE commercial_settlements
            SET status = 'confirmed', confirmed_by = 'x', confirmed_at = now(),
                confirmation_note = 'n', confirm_idempotency_key = $2,
                confirm_correlation_id = 'c', ledger_entry_id = $3
          WHERE id = $1`,
        [settlementId, key(), randomUUID()],
      ),
      /may only change recorded|foreign key|violates/,
    );
    expect((await getSettlement(pool, settlementId))?.status).toBe("cancelled");
  });

  it("a cancelled settlement cannot be voided, re-cancelled, or moved back to recorded (service and raw SQL)", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    await cancelIt(businessId, settlementId);

    await expectDomainError(
      voidSettlement(d(), ctx(), {
        businessId,
        settlementId,
        reasonText: "x",
        reference: "r",
      }),
      "INVALID_STATE_TRANSITION",
    );
    await expectDomainError(
      cancelIt(businessId, settlementId),
      "INVALID_STATE_TRANSITION",
      /already cancelled/,
    );
    for (const status of ["recorded", "voided", "confirmed"]) {
      await expectPgFailure(
        pool.query("UPDATE commercial_settlements SET status = $2 WHERE id = $1", [
          settlementId,
          status,
        ]),
        /may only change recorded|violates check|restrict/i,
      );
    }
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    expect((await getSettlement(pool, settlementId))?.status).toBe("cancelled");
  });

  it("a confirmed settlement cannot be cancelled (service and raw SQL); its credit and settlement are untouched", async () => {
    const { businessId } = await openAccount();
    const { settlementId, confirmation } = await confirmedSettlement(businessId, 3);
    const ledgerBefore = await listLedgerEntries(pool, businessId);
    const settlementBefore = await getSettlement(pool, settlementId);

    await expectDomainError(
      cancelIt(businessId, settlementId),
      "INVALID_STATE_TRANSITION",
      /only a recorded settlement can be cancelled/,
    );
    await expectPgFailure(rawCancel(settlementId), /may only change recorded|violates check/i);

    expect(await listLedgerEntries(pool, businessId)).toEqual(ledgerBefore);
    expect(await getSettlement(pool, settlementId)).toEqual(settlementBefore);
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      paidBalanceUnits: 3,
      version: 1,
    });
    expect(confirmation.ledgerEntryId).toBe(ledgerBefore[0].id);
    expect(await succeededAuditFor(businessId, "settlement_cancelled")).toHaveLength(0);
    // The refused attempt is itself audited, as a denial (never as a success).
    expect((await auditFor(businessId, "settlement_cancelled")).map((e) => e.result)).toEqual([
      "denied",
    ]);
  });

  it("a voided settlement cannot be cancelled (service and raw SQL); the void compensation is untouched", async () => {
    const { businessId } = await openAccount();
    const { settlementId } = await confirmedSettlement(businessId, 3);
    await voidSettlement(d(), ctx(), {
      businessId,
      settlementId,
      reasonText: "wrong Business",
      reference: "REF-VOID",
    });
    const ledgerBefore = await listLedgerEntries(pool, businessId);
    const settlementBefore = await getSettlement(pool, settlementId);

    await expectDomainError(
      cancelIt(businessId, settlementId),
      "INVALID_STATE_TRANSITION",
      /voided/,
    );
    await expectPgFailure(rawCancel(settlementId), /may only change recorded|violates check/i);

    expect(await listLedgerEntries(pool, businessId)).toEqual(ledgerBefore);
    expect(await getSettlement(pool, settlementId)).toEqual(settlementBefore);
    expect(settlementBefore?.status).toBe("voided");
  });

  it("confirmed -> voided is still the compensating path and still works alongside cancellation", async () => {
    const { businessId } = await openAccount();
    const cancelled = await recordedSettlement(businessId, 2);
    const { settlementId } = await confirmedSettlement(businessId, 4);
    await cancelIt(businessId, cancelled);
    const voided = await voidSettlement(d(), ctx(), {
      businessId,
      settlementId,
      reasonText: "mistaken credit",
      reference: "REF-VOID",
    });
    expect(voided.result).toMatchObject({
      status: "voided",
      unitsReversed: 4,
      paidBalanceAfter: 0,
    });
    expect((await getSettlement(pool, cancelled))?.status).toBe("cancelled");
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      paidBalanceUnits: 0,
      version: 2,
    });
  });
});

// ===========================================================================
describe("IDEMPOTENCY — shared Commercial command runner", () => {
  it("same command + key + actor + payload safely replays: one cancellation, one audit row", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    const c = ctx();
    const a = await cancelIt(businessId, settlementId, c);
    const b = await cancelIt(businessId, settlementId, c);
    expect(a.replayed).toBe(false);
    expect(b.replayed).toBe(true);
    expect(b.result).toEqual(a.result);
    expect(await auditFor(businessId, "settlement_cancelled")).toHaveLength(1);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
  });

  it("a new key on an already-cancelled settlement is refused: no duplicate cancellation", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    const first = await cancelIt(businessId, settlementId);
    const settlementAfterFirst = await getSettlement(pool, settlementId);
    await expectDomainError(
      cancelIt(businessId, settlementId),
      "INVALID_STATE_TRANSITION",
      /already cancelled/,
    );
    expect(await getSettlement(pool, settlementId)).toEqual(settlementAfterFirst);
    expect(await succeededAuditFor(businessId, "settlement_cancelled")).toHaveLength(1);
    expect(
      (await auditFor(businessId, "settlement_cancelled")).map((e) => e.result).sort(),
    ).toEqual(["denied", "succeeded"]);
    expect(first.result.status).toBe("cancelled");
  });

  it("the same key with a different actor, command, payload or Business conflicts and writes nothing", async () => {
    const { businessId } = await openAccount();
    const otherBusiness = (await openAccount()).businessId;
    const settlementId = await recordedSettlement(businessId, 3);
    const otherSettlementId = await recordedSettlement(otherBusiness, 3);
    const c = ctx();
    await cancelIt(businessId, settlementId, c);
    const audits = await count("SELECT COUNT(*)::int AS n FROM commercial_audit_events");

    // different actor
    await expectDomainError(
      cancelIt(businessId, settlementId, { ...c, adminUserId: OTHER_ADMIN }),
      "IDEMPOTENCY_CONFLICT",
    );
    // different command (confirm) under the cancel key
    await expectDomainError(confirmIt(businessId, settlementId, { ...c }), "IDEMPOTENCY_CONFLICT");
    // different payload: reason, reference, settlement
    await expectDomainError(
      cancelIt(businessId, settlementId, { ...c }, { reasonText: "a different reason" }),
      "IDEMPOTENCY_CONFLICT",
    );
    await expectDomainError(
      cancelIt(businessId, settlementId, { ...c }, { reference: "REF-DIFFERENT" }),
      "IDEMPOTENCY_CONFLICT",
    );
    await expectDomainError(
      cancelIt(businessId, otherSettlementId, { ...c }),
      "IDEMPOTENCY_CONFLICT",
    );
    // cross-Business use of the key
    await expectDomainError(
      cancelIt(otherBusiness, otherSettlementId, { ...c }),
      "IDEMPOTENCY_CONFLICT",
    );

    expect((await getSettlement(pool, otherSettlementId))?.status).toBe("recorded");
    // Rejections are audited as `denied` (separate transaction) but never as a second success.
    expect(await auditFor(businessId, "settlement_cancelled")).toEqual(
      expect.arrayContaining([expect.objectContaining({ result: "succeeded" })]),
    );
    expect(
      (await auditFor(businessId, "settlement_cancelled")).filter((e) => e.result === "succeeded"),
    ).toHaveLength(1);
    expect(
      await count("SELECT COUNT(*)::int AS n FROM commercial_audit_events"),
    ).toBeGreaterThanOrEqual(audits);
  });

  it("a failed transaction rolls back the cancellation AND the processing reservation; the key is reusable", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    await pool.query(`
      CREATE FUNCTION wpcom03a_fail_cancel_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.action_type = 'settlement_cancelled' AND NEW.reference = 'ROLLBACK-CANCEL' THEN
          RAISE EXCEPTION 'simulated audit failure';
        END IF;
        RETURN NEW;
      END; $$`);
    await pool.query(
      `CREATE TRIGGER wpcom03a_fail_cancel_audit BEFORE INSERT ON commercial_audit_events
         FOR EACH ROW EXECUTE FUNCTION wpcom03a_fail_cancel_audit()`,
    );
    const c = ctx();
    try {
      await expectPgFailure(
        cancelIt(businessId, settlementId, c, { reference: "ROLLBACK-CANCEL" }),
        /simulated audit failure/,
      );
      // Settlement, key reservation and audit are all rolled back.
      expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
      expect((await getSettlement(pool, settlementId))?.cancelledBy).toBeNull();
      expect(
        await count("SELECT COUNT(*)::int AS n FROM idempotency_keys WHERE idempotency_key = $1", [
          c.idempotencyKey,
        ]),
      ).toBe(0);
      expect(await auditFor(businessId, "settlement_cancelled")).toHaveLength(0);
    } finally {
      await pool.query("DROP TRIGGER wpcom03a_fail_cancel_audit ON commercial_audit_events");
      await pool.query("DROP FUNCTION wpcom03a_fail_cancel_audit()");
    }
    const retry = await cancelIt(businessId, settlementId, c, { reference: "ROLLBACK-CANCEL" });
    expect(retry.replayed).toBe(false);
    expect((await getSettlement(pool, settlementId))?.status).toBe("cancelled");
  });
});

// ===========================================================================
describe("AUTHORITY — Platform Administrator with verified MFA only", () => {
  it("denies an inactive administrator, a missing MFA proof, an empty id and Business roles, writing nothing", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    const tally = async () => ({
      ledger: await count("SELECT COUNT(*)::int AS n FROM commercial_ledger_entries"),
      audit: await count("SELECT COUNT(*)::int AS n FROM commercial_audit_events"),
      keys: await count(
        "SELECT COUNT(*)::int AS n FROM idempotency_keys WHERE idempotency_key LIKE 'wpcom03a-%'",
      ),
      accounts: await count("SELECT COUNT(*)::int AS n FROM commercial_accounts"),
    });
    const before = await tally();
    for (const who of [
      ctx({ adminUserId: "inactive-admin" }),
      ctx({ verifiedMfaSatisfied: false }),
      ctx({ adminUserId: "business-owner-uid" }),
      ctx({ adminUserId: "business-manager-uid" }),
      ctx({ adminUserId: "business-staff-uid" }),
      ctx({ adminUserId: "unknown-uid" }),
      ctx({ adminUserId: "" }),
    ]) {
      await expectDomainError(
        cancelIt(businessId, settlementId, who),
        "AUTH_FORBIDDEN",
        /Platform Administrator with verified MFA/,
      );
    }
    expect(await tally()).toEqual(before);
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
  });
});

// ===========================================================================
describe("CONCURRENCY — exactly one terminal transition wins", () => {
  /** Whatever the interleaving, the settlement ends in exactly one coherent terminal state. */
  async function expectOneCoherentOutcome(businessId: string, settlementId: string, units: number) {
    const settlement = await getSettlement(pool, settlementId);
    const ledger = await listLedgerEntries(pool, businessId);
    const cancelAudits = await auditFor(businessId, "settlement_cancelled");
    const confirmAudits = await auditFor(businessId, "settlement_confirmed");
    const succeeded = (rows: { result: string }[]) => rows.filter((e) => e.result === "succeeded");
    const account = await getCommercialAccount(pool, businessId);

    // Never both.
    expect(["confirmed", "cancelled"]).toContain(settlement?.status);
    if (settlement?.status === "confirmed") {
      expect(settlement.cancelledBy).toBeNull();
      expect(ledger).toHaveLength(1);
      expect(ledger[0]).toMatchObject({ entryType: "credit_grant", unitsDelta: units });
      expect(settlement.ledgerEntryId).toBe(ledger[0].id);
      expect(succeeded(confirmAudits)).toHaveLength(1);
      expect(succeeded(cancelAudits)).toHaveLength(0);
      expect(account?.paidBalanceUnits).toBe(units);
    } else {
      // Never credit on a cancelled settlement.
      expect(settlement?.confirmedBy).toBeNull();
      expect(settlement?.cancelledBy).toBe(ADMIN);
      expect(ledger).toHaveLength(0);
      expect(succeeded(cancelAudits)).toHaveLength(1);
      expect(succeeded(confirmAudits)).toHaveLength(0);
      expect(account?.paidBalanceUnits).toBe(0);
      expect(account?.version).toBe(0);
    }
  }

  it("cancel vs confirm: exactly one wins, across many rounds and both launch orders", async () => {
    const seen = new Set<string>();
    for (let round = 0; round < 12; round += 1) {
      const { businessId } = await openAccount();
      const settlementId = await recordedSettlement(businessId, 3);
      const calls =
        round % 2 === 0
          ? [cancelIt(businessId, settlementId), confirmIt(businessId, settlementId)]
          : [confirmIt(businessId, settlementId), cancelIt(businessId, settlementId)];
      const results = await Promise.allSettled(calls);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      for (const r of results) {
        if (r.status === "rejected") {
          expect((r.reason as CommercialDomainError).category).toBe("INVALID_STATE_TRANSITION");
        }
      }
      await expectOneCoherentOutcome(businessId, settlementId, 3);
      seen.add((await getSettlement(pool, settlementId))?.status ?? "?");
    }
    expect(seen.size).toBeGreaterThanOrEqual(1);
  });

  it("confirm vs cancel with a contending third command still yields one winner and no duplicate", async () => {
    for (let round = 0; round < 6; round += 1) {
      const { businessId } = await openAccount();
      const settlementId = await recordedSettlement(businessId, 2);
      const results = await Promise.allSettled([
        confirmIt(businessId, settlementId),
        cancelIt(businessId, settlementId),
        cancelIt(businessId, settlementId),
        confirmIt(businessId, settlementId),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      await expectOneCoherentOutcome(businessId, settlementId, 2);
    }
  });

  it("cancel vs cancel (different keys): one cancellation, one audit row; the loser is refused cleanly", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => cancelIt(businessId, settlementId)),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) {
      if (r.status === "rejected") {
        expect((r.reason as CommercialDomainError).category).toBe("INVALID_STATE_TRANSITION");
      }
    }
    expect(
      (await auditFor(businessId, "settlement_cancelled")).filter((e) => e.result === "succeeded"),
    ).toHaveLength(1);
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    expect((await getSettlement(pool, settlementId))?.status).toBe("cancelled");
  });

  it("cancel vs cancel (same key): one execution, the rest replay or are told to retry", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    const c = ctx();
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => cancelIt(businessId, settlementId, c)),
    );
    expect(results.filter((r) => r.status === "fulfilled" && !r.value.replayed)).toHaveLength(1);
    for (const r of results) {
      if (r.status === "rejected") {
        expect((r.reason as CommercialDomainError).category).toBe("TEMPORARY_UNAVAILABLE");
      }
    }
    expect(await auditFor(businessId, "settlement_cancelled")).toHaveLength(1);
    expect((await getSettlement(pool, settlementId))?.status).toBe("cancelled");
  });

  it("database-level race: a raw cancel and a raw ledger credit against one recorded settlement cannot both commit", async () => {
    for (let round = 0; round < 8; round += 1) {
      const { businessId } = await openAccount();
      const settlementId = await recordedSettlement(businessId, 3);
      const credit = withPlatformTransaction(pool, (tx) =>
        postCommercialLedgerEntry(tx, {
          businessId,
          entryType: "credit_grant",
          bucket: "paid",
          unitsDelta: 3,
          sourceReference: { type: "settlement", id: settlementId },
          idempotencyScopeKey: `forged-${randomUUID()}`,
          createdBy: "raw",
          correlationId: "c",
        }),
      );
      const cancel = rawCancel(settlementId);
      const results = await Promise.allSettled(
        round % 2 === 0 ? [credit, cancel] : [cancel, credit],
      );
      const settlement = await getSettlement(pool, settlementId);
      const ledger = await listLedgerEntries(pool, businessId);
      // Never a cancelled settlement that holds credit.
      expect(settlement?.status === "cancelled" && ledger.length > 0).toBe(false);
      expect(results.filter((r) => r.status === "fulfilled").length).toBeGreaterThanOrEqual(1);
      if (settlement?.status === "cancelled") expect(ledger).toHaveLength(0);
    }
  });
});

// ===========================================================================
describe("DATABASE GUARDS — enforced below the service layer", () => {
  it("a raw recorded -> cancelled without provenance is rejected", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    await expectPgFailure(
      pool.query("UPDATE commercial_settlements SET status = 'cancelled' WHERE id = $1", [
        settlementId,
      ]),
      /commercial_settlements_confirmation_consistency|violates check/,
    );
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
  });

  it("every cancellation provenance column is individually required: NULL is rejected explicitly", async () => {
    const { businessId } = await openAccount();
    for (const column of [
      "cancelled_by",
      "cancel_reason_text",
      "cancel_reference",
      "cancel_idempotency_key",
      "cancel_correlation_id",
    ]) {
      const settlementId = await recordedSettlement(businessId, 2);
      await expectPgFailure(
        rawCancel(settlementId, { [column]: null }),
        /commercial_settlements_confirmation_consistency|violates check/,
      );
      expect((await getSettlement(pool, settlementId))?.status, column).toBe("recorded");
    }
    // cancelled_at NULL as well.
    const settlementId = await recordedSettlement(businessId, 2);
    await expectPgFailure(
      pool.query(
        `UPDATE commercial_settlements
            SET status = 'cancelled', cancelled_at = NULL, cancelled_by = 'a',
                cancel_reason_text = 'r', cancel_reference = 'ref',
                cancel_idempotency_key = $2, cancel_correlation_id = 'c'
          WHERE id = $1`,
        [settlementId, key()],
      ),
      /commercial_settlements_confirmation_consistency|violates check/,
    );
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
  });

  it("blank (whitespace-only) cancellation provenance is rejected", async () => {
    const { businessId } = await openAccount();
    for (const column of [
      "cancelled_by",
      "cancel_reason_text",
      "cancel_reference",
      "cancel_idempotency_key",
    ]) {
      const settlementId = await recordedSettlement(businessId, 2);
      await expectPgFailure(
        rawCancel(settlementId, { [column]: "   " }),
        /commercial_settlements_confirmation_consistency|violates check/,
      );
      expect((await getSettlement(pool, settlementId))?.status, column).toBe("recorded");
    }
  });

  it("a complete raw recorded -> cancelled is the ONLY cancellation transition and is accepted (proves the guard is not over-strict)", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 2);
    await rawCancel(settlementId);
    expect((await getSettlement(pool, settlementId))?.status).toBe("cancelled");
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
  });

  it("non-cancelled rows cannot carry cancellation-only provenance", async () => {
    const { businessId } = await openAccount();
    // A recorded row cannot be given cancel columns without changing status.
    const recorded = await recordedSettlement(businessId, 2);
    await expectPgFailure(
      pool.query("UPDATE commercial_settlements SET cancelled_by = 'x' WHERE id = $1", [recorded]),
      /may only change recorded|violates check/i,
    );
    // A confirming transition cannot smuggle cancel provenance in.
    const toConfirm = await recordedSettlement(businessId, 2);
    const credit = await withPlatformTransaction(pool, (tx) =>
      postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "credit_grant",
        bucket: "paid",
        unitsDelta: 2,
        sourceReference: { type: "settlement", id: toConfirm },
        idempotencyScopeKey: `forged-${randomUUID()}`,
        createdBy: "raw",
        correlationId: "c",
      }),
    );
    await expectPgFailure(
      pool.query(
        `UPDATE commercial_settlements
            SET status = 'confirmed', confirmed_by = 'x', confirmed_at = now(),
                confirmation_note = 'n', confirm_idempotency_key = $2,
                confirm_correlation_id = 'c', ledger_entry_id = $3, cancelled_by = 'smuggled'
          WHERE id = $1`,
        [toConfirm, key(), credit.entry.id],
      ),
      /commercial_settlements_confirmation_consistency|violates check/,
    );
    // A cancelled row cannot also carry confirmation or void data.
    const both = await recordedSettlement(businessId, 2);
    await expectPgFailure(
      pool.query(
        `UPDATE commercial_settlements
            SET status = 'cancelled', cancelled_by = 'a', cancelled_at = now(),
                cancel_reason_text = 'r', cancel_reference = 'ref', cancel_idempotency_key = $2,
                cancel_correlation_id = 'c', confirmed_by = 'also-confirmed'
          WHERE id = $1`,
        [both, key()],
      ),
      /commercial_settlements_confirmation_consistency|violates check/,
    );
    // A settlement cannot be inserted already cancelled.
    const base = await getSettlement(pool, recorded);
    await expectPgFailure(
      pool.query(
        `INSERT INTO commercial_settlements
           (business_id, status, method, external_reference, market, currency, amount_minor,
            units_purchased, received_at, price_schedule_id, unit_price_usd_minor,
            local_unit_price_minor, price_effective_from, expected_amount_minor, variance_minor,
            recorded_by, record_reason_text, record_idempotency_key, record_correlation_id,
            cancelled_by, cancelled_at, cancel_reason_text, cancel_reference,
            cancel_idempotency_key, cancel_correlation_id)
         VALUES ($1,'cancelled','cash',$2,'BI','BIF',2000,2,$3,$4,$5,$6,$7,2000,0,'a','r',$8,'c',
                 'a', now(), 'r', 'ref', $9, 'c')`,
        [
          businessId,
          `ref-${randomUUID()}`,
          base?.receivedAt,
          base?.priceScheduleId,
          base?.unitPriceUsdMinor,
          base?.localUnitPriceMinor,
          base?.priceEffectiveFrom,
          key(),
          key(),
        ],
      ),
      /must be inserted with status recorded|violates check/,
    );
  });

  it("evidence and pricing columns stay frozen through a cancellation; the row can never be deleted or truncated", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 2);
    await expectPgFailure(
      pool.query(
        `UPDATE commercial_settlements
            SET status = 'cancelled', amount_minor = amount_minor + 1, variance_minor = variance_minor + 1,
                cancelled_by = 'a', cancelled_at = now(), cancel_reason_text = 'r',
                cancel_reference = 'ref', cancel_idempotency_key = $2, cancel_correlation_id = 'c'
          WHERE id = $1`,
        [settlementId, key()],
      ),
      /immutable/,
    );
    await cancelIt(businessId, settlementId);
    await expectPgFailure(
      pool.query("DELETE FROM commercial_settlements WHERE id = $1", [settlementId]),
      /immutable|append-only|restrict|not permitted/i,
    );
    await expectPgFailure(
      pool.query("TRUNCATE commercial_settlements"),
      /immutable|append-only|restrict|not permitted/i,
    );
    // Cancellation provenance is itself immutable.
    await expectPgFailure(
      pool.query("UPDATE commercial_settlements SET cancel_reason_text = 'edited' WHERE id = $1", [
        settlementId,
      ]),
      /may only change recorded/,
    );
  });

  it("a cancelled settlement can never hold a ledger entry: a forged credit or reversal referencing it is rejected", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    await cancelIt(businessId, settlementId);
    for (const [entryType, unitsDelta] of [
      ["credit_grant", 3],
      ["settlement_void_reversal", -3],
    ] as const) {
      await expectPgFailure(
        withPlatformTransaction(pool, (tx) =>
          postCommercialLedgerEntry(tx, {
            businessId,
            entryType,
            bucket: "paid",
            unitsDelta,
            sourceReference: { type: "settlement", id: settlementId },
            idempotencyScopeKey: `forged-${randomUUID()}`,
            createdBy: "raw",
            correlationId: "c",
          }),
        ),
        /cancelled and can never hold a ledger entry/,
      );
    }
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(0);
    expect(await getCommercialAccount(pool, businessId)).toMatchObject({
      paidBalanceUnits: 0,
      version: 0,
    });
  });

  it("a recorded settlement that already has a ledger entry cannot be cancelled by raw SQL", async () => {
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 3);
    await withPlatformTransaction(pool, (tx) =>
      postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "credit_grant",
        bucket: "paid",
        unitsDelta: 3,
        sourceReference: { type: "settlement", id: settlementId },
        idempotencyScopeKey: `forged-${randomUUID()}`,
        createdBy: "raw",
        correlationId: "c",
      }),
    );
    await expectPgFailure(rawCancel(settlementId), /a ledger entry already references it/);
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
    // The credit is intact.
    expect(await listLedgerEntries(pool, businessId)).toHaveLength(1);
  });

  it("a ledger entry of ANOTHER Business that references a recorded settlement also blocks its cancellation", async () => {
    const owner = (await openAccount()).businessId;
    const other = (await openAccount()).businessId;
    const settlementId = await recordedSettlement(owner, 3);
    await withPlatformTransaction(pool, (tx) =>
      postCommercialLedgerEntry(tx, {
        businessId: other,
        entryType: "credit_grant",
        bucket: "paid",
        unitsDelta: 3,
        sourceReference: { type: "settlement", id: settlementId },
        idempotencyScopeKey: `forged-${randomUUID()}`,
        createdBy: "raw",
        correlationId: "c",
      }),
    );
    await expectPgFailure(rawCancel(settlementId), /a ledger entry already references it/);
    // The service path is stopped by the same database guard (the backstop), and rolls back.
    await expectPgFailure(cancelIt(owner, settlementId), /a ledger entry already references it/);
    expect((await getSettlement(pool, settlementId))?.status).toBe("recorded");
  });

  it("no cancellation path can mutate or delete an existing confirmed ledger credit", async () => {
    const { businessId } = await openAccount();
    const { settlementId, confirmation } = await confirmedSettlement(businessId, 3);
    const ledgerBefore = await listLedgerEntries(pool, businessId);
    await expectDomainError(cancelIt(businessId, settlementId), "INVALID_STATE_TRANSITION");
    await expectPgFailure(rawCancel(settlementId), /may only change recorded|violates check/i);
    await expectPgFailure(
      pool.query("UPDATE commercial_ledger_entries SET units_delta = 0 WHERE id = $1", [
        confirmation.ledgerEntryId,
      ]),
      /immutable|append-only|restrict|not permitted/i,
    );
    await expectPgFailure(
      pool.query("DELETE FROM commercial_ledger_entries WHERE id = $1", [
        confirmation.ledgerEntryId,
      ]),
      /immutable|append-only|restrict|not permitted/i,
    );
    expect(await listLedgerEntries(pool, businessId)).toEqual(ledgerBefore);
    expect((await getCommercialAccount(pool, businessId))?.paidBalanceUnits).toBe(3);
  });

  it("existing recorded, confirmed and voided rows stay valid alongside cancelled rows (history preserved)", async () => {
    const { businessId } = await openAccount();
    const recorded = await recordedSettlement(businessId, 1);
    const confirmed = (await confirmedSettlement(businessId, 2)).settlementId;
    const voided = (await confirmedSettlement(businessId, 3)).settlementId;
    await voidSettlement(d(), ctx(), {
      businessId,
      settlementId: voided,
      reasonText: "x",
      reference: "r",
    });
    const cancelled = await recordedSettlement(businessId, 4);
    await cancelIt(businessId, cancelled);
    const rows = await pool.query<{ id: string; status: string }>(
      "SELECT id, status FROM commercial_settlements WHERE business_id = $1",
      [businessId],
    );
    const byId = Object.fromEntries(rows.rows.map((r) => [r.id, r.status]));
    expect(byId).toEqual({
      [recorded]: "recorded",
      [confirmed]: "confirmed",
      [voided]: "voided",
      [cancelled]: "cancelled",
    });
  });
});

// ===========================================================================
describe("MIGRATION 0024 — additive, reversible, fail-closed", () => {
  it("rollback refuses while a cancelled settlement exists (changing nothing); on a clean database it restores the 0023 shape and re-applies", async () => {
    // Populated: refuse, and leave everything as it was.
    await dropCommercialObjects();
    await migrateUp(pool, migrationsDir);
    await setPriceSchedule({ ...d(), now: () => new Date("2026-02-01T00:00:00Z") }, ctx(), {
      market: "BI",
      currency: "BIF",
      localUnitPriceMinor: BI_PRICE,
      effectiveFrom: new Date("2026-03-01T00:00:00Z"),
      reasonText: "test fixture",
    });
    const { businessId } = await openAccount();
    const settlementId = await recordedSettlement(businessId, 2);
    await cancelIt(businessId, settlementId);
    await expectPgFailure(
      migrateDown(pool, migrationsDir, 6),
      /refusing to roll back[\s\S]*cancelled settlement/,
    );
    expect((await getSettlement(pool, settlementId))?.status).toBe("cancelled");
    expect(
      await count("SELECT COUNT(*)::int AS n FROM pg_trigger WHERE tgname = $1", [
        "commercial_ledger_reject_cancelled_settlement_reference",
      ]),
    ).toBe(1);

    // Empty of cancellations: rolls back cleanly to the 0023 lifecycle...
    await dropCommercialObjects();
    await migrateUp(pool, migrationsDir);
    await setPriceSchedule({ ...d(), now: () => new Date("2026-02-01T00:00:00Z") }, ctx(), {
      market: "BI",
      currency: "BIF",
      localUnitPriceMinor: BI_PRICE,
      effectiveFrom: new Date("2026-03-01T00:00:00Z"),
      reasonText: "test fixture",
    });
    const down = await migrateDown(pool, migrationsDir, 6);
    expect(down.rolledBack).toEqual(["0029", "0028", "0027", "0026", "0025", "0024"]);
    expect(
      await count(
        "SELECT COUNT(*)::int AS n FROM information_schema.columns WHERE table_name = 'commercial_settlements' AND column_name LIKE 'cancel%'",
      ),
    ).toBe(0);
    expect(
      await count("SELECT COUNT(*)::int AS n FROM pg_proc WHERE proname = $1", [
        "commercial_ledger_reject_cancelled_settlement_reference",
      ]),
    ).toBe(0);
    // ...where `cancelled` is no longer a valid status,
    const statusCheck = await pool.query<{ def: string }>(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
        WHERE conname = 'commercial_settlements_status_check'`,
    );
    expect(statusCheck.rows[0].def).not.toMatch(/cancelled/);
    expect(statusCheck.rows[0].def).toMatch(/voided/);
    // ...and the migration re-applies over it (the 0023 price schedule fixture is still there).
    const reapplied = await migrateUp(pool, migrationsDir);
    expect(reapplied.applied).toEqual(["0024", "0025", "0026", "0027", "0028", "0029"]);
    const acct = await openAccount();
    const again = await recordedSettlement(acct.businessId, 2);
    await cancelIt(acct.businessId, again);
    expect((await getSettlement(pool, again))?.status).toBe("cancelled");

    // Restore the shared fixture for any later test in this file.
    await dropCommercialObjects();
    await migrateUp(pool, migrationsDir);
    await setPriceSchedule({ ...d(), now: () => new Date("2026-02-01T00:00:00Z") }, ctx(), {
      market: "BI",
      currency: "BIF",
      localUnitPriceMinor: BI_PRICE,
      effectiveFrom: new Date("2026-03-01T00:00:00Z"),
      reasonText: "test fixture",
    });
  });
});
