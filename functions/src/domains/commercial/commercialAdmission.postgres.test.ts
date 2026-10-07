/**
 * WP-COM-05b — Commercial admission gate, earmarks and held-Purchase processor.
 *
 * Proves, on a live PostgreSQL, through the REAL Purchase commands and the REAL
 * Commercial primitives (no mocks of either domain):
 *
 *  - ADMIT: capacity available -> admitted; one Verified Unit, one admission, one
 *    earmark per begun Circle position; the funding bucket is fixed at ADMIT time
 *    and never changes; reservation ledger-consistent; `admit:<purchase_id>` reserved
 *    only after the locked decision;
 *  - HOLD: no capacity for a NEW Circle -> `pending_admission`, with NO Loyalty state,
 *    NO Commercial reservation, NO earmark and NO admission idempotency key;
 *  - ACTIVE-CIRCLE GRACE: a Purchase continuing an admitted Circle is never blocked, takes
 *    no Commercial lock and writes no Commercial row, even at negative capacity;
 *  - RE-EVALUATION: repeat-safe, FIFO, no overtaking, concurrent-worker safe;
 *  - CONCURRENCY: no oversubscription, no double admission, no deadlock (40P01);
 *  - parent-before-child (immediate FKs) and atomic rollback;
 *  - lock order, as a statement trace;
 *  - WP-COM-04 integration: the earmark is the normal consumption path, the fallback is
 *    exceptional.
 *
 * Requires a live PostgreSQL AND the Firestore Emulator. Run via:
 *
 *   firebase emulators:exec --only firestore --project demo-11thonus \
 *     "PLATFORM_ENV=test pnpm --filter functions exec vitest run --config vitest.postgres.config.ts commercialAdmission"
 */

import { randomUUID } from "node:crypto";
import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createCustomerIdentity } from "../identity/repositories/customerIdentityRepository";
import { issueLoyaltyNumberForIdentity } from "../loyaltyNumber/repositories/loyaltyNumberRepository";
import { issueQrIdentityForIdentity } from "../qrIdentity/repositories/qrIdentityRepository";
import type { LoyaltyNumberCandidateGenerator } from "../loyaltyNumber/services/loyaltyNumberGenerator";
import type { QrReferenceGenerator } from "../qrIdentity/services/qrReferenceGenerator";
import type { EventActor } from "../../shared/events/domainEvent";
import { loadPostgresConfig } from "../../infrastructure/postgres/postgresConfig";
import {
  createPostgresPool,
  closePostgresPool,
  type PlatformPostgresPool,
} from "../../infrastructure/postgres/postgresPool";
import { migrateDown, migrateUp } from "../../infrastructure/postgres/migrationRunner";
import { withPlatformTransaction } from "../../infrastructure/postgres/postgresTransaction";
import { createRewardProgram } from "../rewardProgram/services/createRewardProgramCommand";
import { publishRewardProgramVersion } from "../rewardProgram/services/publishRewardProgramVersionCommand";
import { insertQualifyingItem } from "../qualifyingItem/repositories/qualifyingItemRepository";
import { recordPurchase } from "../purchase/services/recordPurchaseCommand";
import {
  verifyPurchase,
  type VerifyPurchaseResult,
} from "../purchase/services/verifyPurchaseCommand";
import { admitOrHoldPurchase } from "../purchase/services/admitOrHoldPurchase";
import {
  reevaluateOne,
  reevaluatePendingAdmissions,
} from "../purchase/services/reevaluatePendingAdmissions";
import {
  admissionIdempotencyKey,
  computeNewBlocks,
  computeStreamRef,
  type PurchaseAdmissionCapacityPort,
} from "../purchase/services/purchaseAdmissionPort";
import { lockPurchaseRecordById } from "../purchase/repositories/purchaseRecordRepository";
import {
  getPurchaseRecordForBusiness,
  getPurchaseRecordForCustomer,
  listPurchasesForBusiness,
} from "../purchase/services/purchaseQueries";
import {
  admissionEarmarkResolver,
  createCommercialAdmissionPort,
} from "../../composition/commercialAdmissionBinding";
import {
  getCommercialAccount,
  insertCommercialAccount,
  lockCommercialAccount,
  updateAccountAdministrativeState,
} from "./repositories/commercialAccountRepository";
import { postCommercialLedgerEntry } from "./services/postCommercialLedgerEntry";
import { sumLedger } from "./repositories/commercialLedgerRepository";
import {
  listAdmissionsForBusiness,
  listBlocksForBusiness,
  sumEarmarkReservations,
} from "./repositories/commercialAdmissionRepository";
import { listCommercialAuditEventsForBusiness } from "./repositories/commercialAuditRepository";
import { projectCommercialConsumption } from "./services/projectCommercialConsumption";
import {
  availableCapacity,
  type CommercialBucket,
  type CommercialLedgerEntryType,
} from "./models/commercialFoundation";
import { decideCommercialAdmission, planAdmissionBlocks } from "./models/commercialAdmission";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "..", "infrastructure", "postgres", "migrations");
const srcDir = path.join(__dirname, "..", "..");

const app = initializeApp({ projectId: "demo-11thonus" }, "commercialAdmissionTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;
const port = createCommercialAdmissionPort();

let seq = 0;
let customerSeq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

function lnFor(i: number): string {
  const d = (n: number) => String(2 + (((n % 8) + 8) % 8));
  return `CAD${d(i)}${d(i + 3)}${d(i + 5)}`;
}

const actor: EventActor = { actorType: "system", actorId: "system" };

class FixedGenerator implements LoyaltyNumberCandidateGenerator, QrReferenceGenerator {
  constructor(private readonly value: string) {}
  generateCandidate(): string {
    return this.value;
  }
  generateReference(): string {
    return this.value;
  }
}

// ---------------------------------------------------------------------------
// Reset: Commercial rows are immutable (by trigger), so the suite resets by dropping the
// Commercial objects and re-applying their migrations (the same technique the other
// Commercial suites use), then clearing the Loyalty/Purchase tables.
// ---------------------------------------------------------------------------

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
const COMMERCIAL_FUNCTIONS = [
  "commercial_admission_assert_consistent",
  "commercial_consumption_events_earmark_guard",
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
  "commercial_reject_mutation",
];

async function dropCommercialObjects(): Promise<void> {
  for (const table of COMMERCIAL_TABLES) {
    await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }
  await pool.query("DROP INDEX IF EXISTS rewards_business_available_at_idx");
  for (const fn of COMMERCIAL_FUNCTIONS) {
    await pool.query(`DROP FUNCTION IF EXISTS ${fn}() CASCADE`);
  }
  const hasMigrations = await pool.query("SELECT to_regclass('public.schema_migrations') AS t");
  if (hasMigrations.rows[0].t !== null) {
    await pool.query(
      "DELETE FROM schema_migrations WHERE version IN ('0021', '0022', '0023', '0024', '0025', '0026', '0027', '0028')",
    );
  }
}

async function resetAll(): Promise<void> {
  await dropCommercialObjects();
  await pool.query("DELETE FROM purchase_outbox");
  await pool.query("DELETE FROM notification_intents");
  await pool.query("DELETE FROM trust_events");
  await pool.query("DELETE FROM redemptions");
  await pool.query("DELETE FROM rewards");
  await pool.query("DELETE FROM verified_unit_allocation_events");
  await pool.query("DELETE FROM verified_unit_allocations");
  await pool.query("DELETE FROM loyalty_cycles");
  await pool.query("DELETE FROM loyalty_cycle_streams");
  await pool.query("DELETE FROM verified_units");
  await pool.query("DELETE FROM purchase_record_events");
  await pool.query("DELETE FROM purchase_records");
  await pool.query("DELETE FROM reward_program_version_qualifying_items");
  await pool.query("DELETE FROM reward_program_outbox");
  await pool.query("DELETE FROM idempotency_keys");
  await pool.query("UPDATE reward_programs SET current_version_id = NULL");
  await pool.query("DELETE FROM reward_program_versions");
  await pool.query("DELETE FROM reward_programs");
  await pool.query("DELETE FROM qualifying_items");
  await migrateUp(pool, migrationsDir);
}

beforeAll(async () => {
  if (!process.env.PLATFORM_POSTGRES_URL && process.env.PLATFORM_ENV !== "test") {
    throw new Error("This test requires a live PostgreSQL instance (PLATFORM_ENV=test).");
  }
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error("FIRESTORE_EMULATOR_HOST is not set — run under the Firestore Emulator.");
  }
  pool = createPostgresPool(
    loadPostgresConfig({ ...process.env, PLATFORM_POSTGRES_POOL_MAX: "16" }),
  );
  await migrateUp(pool, migrationsDir);
}, 120000);

afterAll(async () => {
  await resetAll();
  await closePostgresPool(pool);
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

afterEach(async () => {
  await resetAll();
  for (const collection of [
    "businesses",
    "businessMemberships",
    "businessBranches",
    "users",
    "customerProfiles",
    "loyaltyNumbers",
    "qrIdentityRecords",
    "idempotencyRecords",
    "outboxEntries",
    "platformAdministrators",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
}, 60000);

// ---------------------------------------------------------------------------
// Seeds (real commands only)
// ---------------------------------------------------------------------------

type Customer = { customerId: string; ln: string };
type World = {
  businessId: string;
  owner: string;
  programId: string;
  qualifyingItemId: string;
  customer: Customer;
};

async function seedBusiness(businessId: string) {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ45678X",
      ownerUserId: `owner_of_${businessId}`,
      displayName: "CAD Cafe",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: 1,
    });
  await db.collection("businessBranches").doc(`branch_${businessId}`).set({
    businessId,
    displayName: "Main Branch",
    countryCode: "RW",
    city: "Kigali",
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
  });
  await db
    .collection("businessMemberships")
    .doc(nextId("mem"))
    .set({
      userId: `owner_of_${businessId}`,
      businessId,
      role: "owner",
      status: "active",
      permissions: [],
    });
}

async function seedCustomer(): Promise<Customer> {
  const suffix = nextId("s");
  const customerId = nextId("cust");
  customerSeq += 1;
  const ln = lnFor(customerSeq);
  await createCustomerIdentity(db, {
    eventId: `evt_c_${suffix}`,
    correlationId: `corr_c_${suffix}`,
    actor,
    occurredAt: "2026-09-28T00:00:00.000Z",
    customerIdentityId: customerId,
    initialAuthenticationReference: {
      referenceId: `authuid_${customerId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-09-28T00:00:00.000Z"),
      createdBy: customerId,
    },
    createdAt: new Date("2026-09-28T00:00:00.000Z"),
    createdBy: customerId,
    idempotencyKey: `create_${suffix}`,
    requestHash: `hash_create_${suffix}`,
  });
  await issueLoyaltyNumberForIdentity(db, {
    eventId: `evt_ln_${suffix}`,
    correlationId: `corr_ln_${suffix}`,
    actor,
    occurredAt: "2026-09-28T00:05:00.000Z",
    customerIdentityId: customerId,
    assignedAt: new Date("2026-09-28T00:05:00.000Z"),
    createdBy: customerId,
    generator: new FixedGenerator(ln),
    idempotencyKey: `key_ln_${suffix}`,
    requestHash: `hash_ln_${suffix}`,
  });
  await issueQrIdentityForIdentity(db, {
    eventId: `evt_qr_${suffix}`,
    correlationId: `corr_qr_${suffix}`,
    actor,
    occurredAt: "2026-09-28T00:10:00.000Z",
    customerIdentityId: customerId,
    loyaltyNumber: ln,
    issuedAt: new Date("2026-09-28T00:10:00.000Z"),
    createdBy: customerId,
    generator: new FixedGenerator(`qrcad${customerSeq}ref`),
    idempotencyKey: `key_qr_${suffix}`,
    requestHash: `hash_qr_${suffix}`,
  });
  return { customerId, ln };
}

async function seedWorld(): Promise<World> {
  const businessId = nextId("biz");
  const owner = `owner_of_${businessId}`;
  await seedBusiness(businessId);
  const item = await withPlatformTransaction(pool, async (tx) =>
    insertQualifyingItem(tx, {
      businessId,
      name: "Admission item",
      knowledgeNodeId: null,
      actorId: "test-seed",
    }),
  );
  const created = await createRewardProgram(db, pool, {
    userId: owner,
    request: {
      businessId,
      displayName: "Admission Club",
      rewardProgramCategoryId: null,
      rewardDescription: "Free Coffee",
      multipleUnitsAllowed: true,
      sharedLoyaltyNumberAllowed: true,
      effectiveFrom: new Date("2026-09-28T00:00:00.000Z"),
      qualifyingItemIds: [item.id],
    } as never,
    idempotencyKey: nextId("key_prog"),
    correlationId: nextId("corr_prog"),
  });
  await publishRewardProgramVersion(db, pool, {
    userId: owner,
    request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
    idempotencyKey: nextId("key_pub"),
    correlationId: nextId("corr_pub"),
  });
  const customer = await seedCustomer();
  return {
    businessId,
    owner,
    programId: created.program.id,
    qualifyingItemId: item.id,
    customer,
  };
}

/** Records a Purchase; `hour` makes `(purchase_date, id)` FIFO order explicit. */
async function record(
  world: World,
  quantity: number,
  opts: { customer?: Customer; hour?: number } = {},
): Promise<string> {
  const customer = opts.customer ?? world.customer;
  const hour = opts.hour ?? 10;
  const rec = await recordPurchase(db, pool, {
    userId: world.owner,
    request: {
      businessId: world.businessId,
      rewardProgramId: world.programId,
      loyaltyNumberValue: customer.ln,
      quantity,
      qualifyingItemId: world.qualifyingItemId,
      purchaseDate: new Date(`2026-09-28T${String(hour).padStart(2, "0")}:00:00.000Z`),
    },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  return rec.purchase.id;
}

function verifyEnforced(
  customer: Customer,
  purchaseRecordId: string,
  opts: { key?: string; gatePort?: PurchaseAdmissionCapacityPort } = {},
): Promise<VerifyPurchaseResult> {
  return verifyPurchase(db, pool, {
    customerIdentityId: customer.customerId,
    request: { purchaseRecordId },
    idempotencyKey: opts.key ?? nextId("key"),
    correlationId: nextId("corr"),
    admissionGateMode: "enforce",
    commercialAdmission: opts.gatePort ?? port,
  });
}

// ---------------------------------------------------------------------------
// Commercial account helpers (the same primitives the commands use)
// ---------------------------------------------------------------------------

async function openAccount(
  businessId: string,
  grants: { trial?: number; paid?: number } = {},
): Promise<void> {
  await withPlatformTransaction(pool, async (tx) => {
    await insertCommercialAccount(tx, {
      businessId,
      settlementMarket: "RW",
      commercialEffectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      correlationId: nextId("corr"),
    });
    if (grants.trial) {
      await postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "trial_grant",
        bucket: "trial",
        unitsDelta: grants.trial,
        idempotencyScopeKey: `test:trial:${businessId}`,
        createdBy: "test",
        correlationId: nextId("corr"),
      });
    }
    if (grants.paid) {
      await postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "credit_grant",
        bucket: "paid",
        unitsDelta: grants.paid,
        idempotencyScopeKey: `test:paid:${businessId}`,
        createdBy: "test",
        correlationId: nextId("corr"),
      });
    }
  });
}

/** A manual ledger posting, as an administrator command or settlement confirmation would make. */
async function post(
  businessId: string,
  entryType: CommercialLedgerEntryType,
  bucket: CommercialBucket,
  unitsDelta: number,
): Promise<void> {
  await withPlatformTransaction(pool, async (tx) => {
    await postCommercialLedgerEntry(tx, {
      businessId,
      entryType,
      bucket,
      unitsDelta,
      idempotencyScopeKey: `test:${entryType}:${randomUUID()}`,
      createdBy: "test",
      correlationId: nextId("corr"),
    });
  });
}

async function setRestriction(businessId: string, restricted: boolean): Promise<void> {
  await withPlatformTransaction(pool, async (tx) => {
    await lockCommercialAccount(tx, businessId);
    await updateAccountAdministrativeState(tx, businessId, {
      serviceRestriction: restricted ? "restricted" : "none",
    });
  });
}

// ---------------------------------------------------------------------------
// Observation helpers
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

async function rows<T = Json>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool.query(sql, params)).rows as T[];
}

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const r = await rows<{ n: string }>(`SELECT COUNT(*)::text AS n FROM (${sql}) q`, params);
  return Number(r[0].n);
}

/** The hold reason lives in the Commercial audit row only (never on the Purchase event). */
async function holdReasonOf(purchaseId: string): Promise<string | null> {
  const r = await rows<{ reason_code: string }>(
    "SELECT reason_code FROM commercial_audit_events WHERE action_type = 'admission_held' AND reference = $1",
    [purchaseId],
  );
  return r.length === 1 ? r[0].reason_code : null;
}

async function purchaseStatus(id: string): Promise<string> {
  return (
    await rows<{ status: string }>("SELECT status FROM purchase_records WHERE id = $1", [id])
  )[0].status;
}

async function account(businessId: string) {
  const a = await getCommercialAccount(pool, businessId);
  if (!a) throw new Error("no account");
  return a;
}

/** Loyalty/Purchase state a Purchase must NOT have when it is only held. */
async function loyaltyFootprint(world: World, customer = world.customer) {
  const c = customer.customerId;
  return {
    verifiedUnits: await count("SELECT 1 FROM verified_units WHERE customer_identity_id = $1", [c]),
    streams: await count("SELECT 1 FROM loyalty_cycle_streams WHERE customer_identity_id = $1", [
      c,
    ]),
    cycles: await count("SELECT 1 FROM loyalty_cycles WHERE customer_identity_id = $1", [c]),
    allocations: await count(
      "SELECT 1 FROM verified_unit_allocations WHERE customer_identity_id = $1",
      [c],
    ),
    rewards: await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [c]),
    // Only evidence an ADMISSION writes (recording a Purchase writes its own, unrelated, rows).
    trustEvents: await count(
      `SELECT 1 FROM trust_events WHERE customer_identity_id = $1 AND event_type IN
         ('purchase.verified','verified_units.issued','loyalty_cycle.allocated',
          'loyalty_cycle.reward_available','reward.available')`,
      [c],
    ),
    intents: await count(
      `SELECT 1 FROM notification_intents WHERE intent_type IN
         ('purchase_verified_business','reward_available_customer') AND purchase_record_id IN
         (SELECT id FROM purchase_records WHERE customer_identity_id = $1)`,
      [c],
    ),
    outbox: await count(
      `SELECT 1 FROM purchase_outbox WHERE event_type IN
         ('purchase_verified','verified_units_issued','loyalty_cycle_allocated',
          'loyalty_cycle_reward_available','reward_available') AND aggregate_id IN
         (SELECT id FROM purchase_records WHERE customer_identity_id = $1)`,
      [c],
    ),
  };
}

const NO_LOYALTY = {
  verifiedUnits: 0,
  streams: 0,
  cycles: 0,
  allocations: 0,
  rewards: 0,
  trustEvents: 0,
  intents: 0,
  outbox: 0,
};

async function commercialFootprint(businessId: string) {
  return {
    admissions: (await listAdmissionsForBusiness(pool, businessId)).length,
    earmarks: (await listBlocksForBusiness(pool, businessId)).length,
    reservations: await count(
      "SELECT 1 FROM commercial_ledger_entries WHERE business_id = $1 AND entry_type = 'capacity_reserved'",
      [businessId],
    ),
    admitKeys: await count("SELECT 1 FROM idempotency_keys WHERE idempotency_key LIKE 'admit:%'"),
  };
}

/**
 * The accounting invariants (design §7 I-1, §8.5.1 test 14), asserted after every scenario:
 * counters = Σ ledger; reserved = earmarks - consumed earmarks, per bucket; no negative
 * reservation; trial never below what is reserved; availability = balance - reserved.
 */
async function assertAccountingInvariants(businessId: string) {
  const a = await account(businessId);
  const l = await sumLedger(pool, businessId);
  expect(a.trialRemainingUnits).toBe(l.trialRemainingUnits);
  expect(a.paidBalanceUnits).toBe(l.paidBalanceUnits);
  expect(a.trialReservedUnits).toBe(l.trialReservedUnits);
  expect(a.paidReservedUnits).toBe(l.paidReservedUnits);
  expect(a.version).toBe(l.latestVersion);
  const e = await sumEarmarkReservations(pool, businessId);
  expect(a.trialReservedUnits).toBe(e.trialEarmarked - e.trialConsumed);
  expect(a.paidReservedUnits).toBe(e.paidEarmarked - e.paidConsumed);
  expect(a.trialReservedUnits).toBeGreaterThanOrEqual(0);
  expect(a.paidReservedUnits).toBeGreaterThanOrEqual(0);
  expect(a.trialRemainingUnits).toBeGreaterThanOrEqual(a.trialReservedUnits);
  expect(availableCapacity(a)).toBe(
    a.trialRemainingUnits + a.paidBalanceUnits - (a.trialReservedUnits + a.paidReservedUnits),
  );
}

const is40P01 = (r: PromiseSettledResult<unknown>) =>
  r.status === "rejected" &&
  ((r.reason as { code?: string })?.code === "40P01" ||
    /deadlock/i.test(String((r.reason as Error)?.message ?? "")));

function noDeadlocks(results: PromiseSettledResult<unknown>[]) {
  expect(results.filter(is40P01)).toEqual([]);
}

/** `VERB table [FOR UPDATE|FOR KEY SHARE]` -- the lock/write skeleton of a statement. */
function normaliseStatement(text: string): string {
  const s = text.replace(/\s+/g, " ").trim();
  const dml = s.match(/^(INSERT INTO|UPDATE|DELETE FROM)\s+(\w+)/i);
  if (dml) return `${dml[1].split(" ")[0].toUpperCase()} ${dml[2]}`;
  const from = s.match(/\bFROM\s+(\w+)/i);
  const lock = s.match(/FOR (NO KEY )?(UPDATE|KEY SHARE)/i);
  if (/^SELECT/i.test(s))
    return `SELECT ${from?.[1] ?? "?"}${lock ? ` ${lock[0].toUpperCase()}` : ""}`;
  return s.slice(0, 24);
}

/** Records every statement issued on pool clients while `fn` runs (order preserved). */
async function traceStatements<T>(fn: () => Promise<T>): Promise<{ result: T; trace: string[] }> {
  const trace: string[] = [];
  const originalConnect = pool.connect.bind(pool) as (...a: unknown[]) => unknown;
  const wrapped: Array<{ client: { query: unknown }; original: unknown }> = [];
  const seen = new WeakSet<object>();
  const wrap = (client: { query: (...a: unknown[]) => unknown }) => {
    if (seen.has(client)) return;
    seen.add(client);
    const original = client.query;
    wrapped.push({ client, original });
    client.query = (...args: unknown[]) => {
      const first = args[0];
      const text = typeof first === "string" ? first : (first as { text?: string })?.text;
      if (typeof text === "string") trace.push(normaliseStatement(text));
      return original.apply(client, args);
    };
  };
  (pool as unknown as { connect: unknown }).connect = (...args: unknown[]) => {
    const last = args[args.length - 1];
    if (typeof last === "function") {
      const cb = last as (err: unknown, client: unknown, done: unknown) => void;
      return originalConnect(
        ...args.slice(0, -1),
        (err: unknown, client: { query: (...a: unknown[]) => unknown }, done: unknown) => {
          if (client) wrap(client);
          cb(err, client, done);
        },
      );
    }
    return (originalConnect(...args) as Promise<{ query: (...a: unknown[]) => unknown }>).then(
      (client) => {
        wrap(client);
        return client;
      },
    );
  };
  try {
    const result = await fn();
    return { result, trace };
  } finally {
    delete (pool as unknown as { connect?: unknown }).connect;
    for (const { client, original } of wrapped.reverse()) client.query = original;
  }
}

function admitted(result: VerifyPurchaseResult) {
  expect(result.outcome).toBe("admitted");
  if (result.outcome !== "admitted") throw new Error("expected admitted");
  return result;
}

// ===========================================================================
// 1. The decision (pure) and the block arithmetic
// ===========================================================================

describe("WP-COM-05b — the Commercial admission decision (pure)", () => {
  it("block arithmetic: ceil((U+q)/10) - ceil(U/10), first position ceil(U/10)+1", () => {
    expect(computeNewBlocks(0, 1)).toEqual({ newBlocks: 1, firstBlockIndex: 1 });
    expect(computeNewBlocks(0, 10)).toEqual({ newBlocks: 1, firstBlockIndex: 1 });
    expect(computeNewBlocks(9, 1).newBlocks).toBe(0);
    expect(computeNewBlocks(10, 1)).toEqual({ newBlocks: 1, firstBlockIndex: 2 });
    expect(computeNewBlocks(8, 5)).toEqual({ newBlocks: 1, firstBlockIndex: 2 });
    expect(computeNewBlocks(5, 25)).toEqual({ newBlocks: 2, firstBlockIndex: 2 });
    expect(computeNewBlocks(0, 25)).toEqual({ newBlocks: 3, firstBlockIndex: 1 });
    expect(computeNewBlocks(20, 1)).toEqual({ newBlocks: 1, firstBlockIndex: 3 });
  });

  it("usable capacity is balance minus reserved, never raw balance (FD-A)", () => {
    const base = {
      businessId: "b",
      settlementMarket: "RW" as const,
      commercialEffectiveFrom: new Date(),
      trialRemainingUnits: 0,
      paidBalanceUnits: 5,
      trialReservedUnits: 0,
      paidReservedUnits: 4,
      serviceRestriction: "none" as const,
      paidServiceActivatedAt: null,
      version: 3,
      correlationId: "c",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Raw balance is 5, but 4 are already promised to admitted Circles: only 1 is usable.
    expect(availableCapacity(base)).toBe(1);
    const one = decideCommercialAdmission({
      account: base,
      newBlocks: 1,
      firstBlockIndex: 3,
      streamHasEarlierHold: false,
      businessQueue: { earlierHeldInBusiness: false },
    });
    expect(one.outcome).toBe("admit");
    const two = decideCommercialAdmission({
      account: base,
      newBlocks: 2,
      firstBlockIndex: 3,
      streamHasEarlierHold: false,
      businessQueue: { earlierHeldInBusiness: false },
    });
    expect(two).toMatchObject({ outcome: "hold", reason: "insufficient_capacity" });
  });

  it("holds: not established, restricted, business queue, stream queue; admits inside an admitted position", () => {
    const acct = {
      businessId: "b",
      settlementMarket: "RW" as const,
      commercialEffectiveFrom: new Date(),
      trialRemainingUnits: 5,
      paidBalanceUnits: 0,
      trialReservedUnits: 0,
      paidReservedUnits: 0,
      serviceRestriction: "none" as const,
      paidServiceActivatedAt: null,
      version: 1,
      correlationId: "c",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const q = { earlierHeldInBusiness: false };
    const d = (over: Record<string, unknown>) =>
      decideCommercialAdmission({
        account: acct,
        newBlocks: 1,
        firstBlockIndex: 1,
        streamHasEarlierHold: false,
        businessQueue: q,
        ...over,
      });
    expect(d({ account: null })).toMatchObject({ outcome: "hold", reason: "not_established" });
    expect(d({ account: { ...acct, serviceRestriction: "restricted" } })).toMatchObject({
      outcome: "hold",
      reason: "restricted",
    });
    expect(d({ businessQueue: { earlierHeldInBusiness: true } })).toMatchObject({
      outcome: "hold",
      reason: "business_queue",
    });
    expect(d({ streamHasEarlierHold: true })).toMatchObject({
      outcome: "hold",
      reason: "stream_queue",
    });
    // Active-Circle grace: no new position => admitted with nothing reserved, even with NO account.
    expect(d({ newBlocks: 0, account: null })).toEqual({ outcome: "admit", plan: null });
    expect(d({ newBlocks: 0, account: { ...acct, trialRemainingUnits: -0 } })).toEqual({
      outcome: "admit",
      plan: null,
    });
  });

  it("the earmark rule: trial while uncommitted trial is positive, then paid, in index order", () => {
    const acct = {
      businessId: "b",
      settlementMarket: "BI" as const,
      commercialEffectiveFrom: new Date(),
      trialRemainingUnits: 3,
      paidBalanceUnits: 10,
      trialReservedUnits: 2,
      paidReservedUnits: 0,
      serviceRestriction: "none" as const,
      paidServiceActivatedAt: null,
      version: 1,
      correlationId: "c",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Uncommitted trial = 3 - 2 = 1 -> first position trial, the rest paid.
    expect(planAdmissionBlocks(acct, 4, 3)).toEqual([
      { blockIndex: 4, fundingBucket: "trial" },
      { blockIndex: 5, fundingBucket: "paid" },
      { blockIndex: 6, fundingBucket: "paid" },
    ]);
  });
});

// ===========================================================================
// 2. ADMIT
// ===========================================================================

describe("WP-COM-05b — ADMIT", () => {
  it("capacity available -> admitted: one Verified Unit, one admission, one earmark, reservation, admit key", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 3 });
    const id = await record(world, 1);

    const result = admitted(await verifyEnforced(world.customer, id));
    expect(result.purchase.status).toBe("verified");
    expect(result.cycle.allocatedUnits).toBe(1);

    expect(await purchaseStatus(id)).toBe("verified");
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    const admissions = await listAdmissionsForBusiness(pool, world.businessId);
    expect(admissions).toHaveLength(1);
    expect(admissions[0]).toMatchObject({
      purchaseRecordId: id,
      verifiedUnitId: result.verifiedUnit.id,
      blocksReserved: 1,
      firstBlockIndex: 1,
      decidedBy: "customer_verify",
      admissionScopeKey: admissionIdempotencyKey(id),
    });
    const blocks = await listBlocksForBusiness(pool, world.businessId);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ blockIndex: 1, fundingBucket: "trial" });
    expect(blocks[0].streamRef).toBe(
      computeStreamRef({
        businessId: world.businessId,
        customerIdentityId: world.customer.customerId,
        rewardProgramId: world.programId,
      }),
    );
    // The reservation moved the counters through ONE capacity_reserved ledger entry.
    const a = await account(world.businessId);
    expect(a).toMatchObject({
      trialRemainingUnits: 3,
      trialReservedUnits: 1,
      paidReservedUnits: 0,
    });
    expect(availableCapacity(a)).toBe(2);
    const reserved = await rows<{ entry_type: string; source_reference_id: string }>(
      "SELECT entry_type, source_reference_id FROM commercial_ledger_entries WHERE entry_type = 'capacity_reserved'",
    );
    expect(reserved).toEqual([
      { entry_type: "capacity_reserved", source_reference_id: result.verifiedUnit.id },
    ]);
    // The admission key was reserved (after the decision) and completed with the snapshot.
    const key = await rows<{ status: string }>(
      "SELECT status FROM idempotency_keys WHERE idempotency_key = $1",
      [admissionIdempotencyKey(id)],
    );
    expect(key).toEqual([{ status: "completed" }]);
    // No consumption at admission: consumption happens only at Reward available.
    expect(await count("SELECT 1 FROM commercial_consumption_events")).toBe(0);
    const audit = await listCommercialAuditEventsForBusiness(pool, world.businessId);
    expect(audit.map((e) => e.actionType)).toContain("admission_admitted");
    await assertAccountingInvariants(world.businessId);
  });

  it("the trial bucket is used first; with trial exhausted the earmark is paid", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1, paid: 2 });
    const c1 = world.customer;
    const c2 = await seedCustomer();
    const c3 = await seedCustomer();
    for (const c of [c1, c2, c3])
      admitted(await verifyEnforced(c, await record(world, 1, { customer: c })));
    const blocks = await listBlocksForBusiness(pool, world.businessId);
    expect(blocks.map((b) => b.fundingBucket).sort()).toEqual(["paid", "paid", "trial"]);
    const a = await account(world.businessId);
    expect(a).toMatchObject({ trialReservedUnits: 1, paidReservedUnits: 2 });
    expect(availableCapacity(a)).toBe(0);
    await assertAccountingInvariants(world.businessId);
  });

  it("a Purchase beginning several positions across the trial/paid boundary earmarks each deterministically", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1, paid: 2 });
    // 25 units on an empty stream begins positions 1, 2 and 3.
    const result = admitted(await verifyEnforced(world.customer, await record(world, 25)));
    expect(result.cycle.allocatedUnits).toBe(10);
    const admission = (await listAdmissionsForBusiness(pool, world.businessId))[0];
    expect(admission).toMatchObject({ blocksReserved: 3, firstBlockIndex: 1 });
    const blocks = await listBlocksForBusiness(pool, world.businessId);
    expect(blocks.map((b) => [b.blockIndex, b.fundingBucket])).toEqual([
      [1, "trial"],
      [2, "paid"],
      [3, "paid"],
    ]);
    // ONE reservation entry carrying both buckets' deltas, matching the earmarks.
    const entry = (
      await rows<{ trial_reserved_delta: number; paid_reserved_delta: number }>(
        "SELECT trial_reserved_delta, paid_reserved_delta FROM commercial_ledger_entries WHERE entry_type = 'capacity_reserved'",
      )
    )[0];
    expect(entry).toEqual({ trial_reserved_delta: 1, paid_reserved_delta: 2 });
    await assertAccountingInvariants(world.businessId);
  });

  it("whole-Purchase admission: a Purchase that does not fit is held as a whole, never split", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 3 });
    // 8 admitted units, then a 5-unit Purchase begins a SECOND position (needs 1 more): fits.
    admitted(await verifyEnforced(world.customer, await record(world, 8)));
    admitted(await verifyEnforced(world.customer, await record(world, 5)));
    expect((await account(world.businessId)).trialReservedUnits).toBe(2);
    // 13 admitted; a 20-unit Purchase would begin positions 3, 4 and 5 (needs 3, 1 left): held whole.
    const big = await record(world, 20);
    const result = await verifyEnforced(world.customer, big);
    expect(result.outcome).toBe("pending_admission");
    expect((await account(world.businessId)).trialReservedUnits).toBe(2);
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [big])).toBe(
      0,
    );
  });

  it("the earmark funding bucket is immutable and independent of later balance changes", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    admitted(await verifyEnforced(world.customer, await record(world, 1)));
    const before = (await listBlocksForBusiness(pool, world.businessId))[0];
    expect(before.fundingBucket).toBe("trial");
    // Balances change after admission: more trial, a paid top-up, a paid reduction.
    await post(world.businessId, "trial_adjustment", "trial", 2);
    await post(world.businessId, "credit_grant", "paid", 5);
    await post(world.businessId, "credit_adjustment", "paid", -9);
    const after = (await listBlocksForBusiness(pool, world.businessId))[0];
    expect(after).toEqual(before);
    // The row cannot be reclassified: the database refuses UPDATE and DELETE.
    await expect(
      pool.query("UPDATE commercial_admission_blocks SET funding_bucket = 'paid'"),
    ).rejects.toThrow(/append-only and immutable/);
    await expect(pool.query("DELETE FROM commercial_admission_blocks")).rejects.toThrow(
      /append-only and immutable/,
    );
    await expect(
      pool.query("UPDATE commercial_admissions SET blocks_reserved = 2"),
    ).rejects.toThrow(/append-only and immutable/);
    await assertAccountingInvariants(world.businessId);
  });

  it("a verify replay with the same key returns the stored outcome and creates nothing more", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const id = await record(world, 1);
    const key = nextId("key");
    const first = admitted(await verifyEnforced(world.customer, id, { key }));
    const again = await verifyEnforced(world.customer, id, { key });
    expect(again.outcome).toBe("admitted");
    expect(await count("SELECT 1 FROM verified_units")).toBe(1);
    expect((await commercialFootprint(world.businessId)).admissions).toBe(1);
    expect(first.verifiedUnit.id).toBeDefined();
    await assertAccountingInvariants(world.businessId);
  });
});

// ===========================================================================
// 3. HOLD
// ===========================================================================

describe("WP-COM-05b — HOLD", () => {
  async function expectPureHold(world: World, id: string, reason: string) {
    expect(await purchaseStatus(id)).toBe("pending_admission");
    const p = (
      await rows<{
        verified_at: Date | null;
        rejection_reason: string | null;
        dispute_reason: string | null;
      }>(
        "SELECT verified_at, rejection_reason, dispute_reason FROM purchase_records WHERE id = $1",
        [id],
      )
    )[0];
    expect(p).toEqual({ verified_at: null, rejection_reason: null, dispute_reason: null });
    // NO partial Loyalty state.
    expect(await loyaltyFootprint(world)).toEqual(NO_LOYALTY);
    // NO Commercial reservation, admission, earmark or admission idempotency key.
    expect(await commercialFootprint(world.businessId)).toEqual({
      admissions: 0,
      earmarks: 0,
      reservations: 0,
      admitKeys: 0,
    });
    // The hold is recorded as a neutral, payload-free Purchase event (read by Customers and staff).
    const ev = await rows<{
      from_status: string;
      to_status: string;
      actor_type: string;
      reason: string;
      event_payload: Json | null;
    }>(
      "SELECT from_status, to_status, actor_type, reason, event_payload FROM purchase_record_events WHERE purchase_record_id = $1 AND to_status = 'pending_admission'",
      [id],
    );
    expect(ev).toHaveLength(1);
    expect(ev[0]).toEqual({
      from_status: "waiting_for_customer",
      to_status: "pending_admission",
      actor_type: "customer",
      reason: "awaiting_admission",
      event_payload: null,
    });
    // ...and the decision (reason, availability) is in the Commercial audit row only.
    expect(await holdReasonOf(id)).toBe(reason);
  }

  it("zero usable capacity + a NEW Circle -> pending_admission, with no Loyalty or Commercial footprint", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId); // established, nothing granted
    const id = await record(world, 1);
    const result = await verifyEnforced(world.customer, id);
    expect(result.outcome).toBe("pending_admission");
    expect(result.purchase.status).toBe("pending_admission");
    expect("verifiedUnit" in result).toBe(false);
    await expectPureHold(world, id, "insufficient_capacity");
    // The customer's request key completed with the HELD outcome (this request's result); it is not
    // the admission key.
    expect(
      await count(
        "SELECT 1 FROM idempotency_keys WHERE operation_type = 'purchase.verify' AND status = 'completed'",
      ),
    ).toBe(1);
    const audit = await listCommercialAuditEventsForBusiness(pool, world.businessId);
    expect(audit.map((e) => e.actionType)).toEqual(["admission_held"]);
    await assertAccountingInvariants(world.businessId);
  });

  it("no Commercial account (not commercially established) -> held", async () => {
    const world = await seedWorld();
    const id = await record(world, 1);
    const result = await verifyEnforced(world.customer, id);
    expect(result.outcome).toBe("pending_admission");
    expect(await purchaseStatus(id)).toBe("pending_admission");
    expect(await loyaltyFootprint(world)).toEqual(NO_LOYALTY);
    expect((await commercialFootprint(world.businessId)).admitKeys).toBe(0);
  });

  it("administrative restriction holds a NEW Circle start, regardless of capacity", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 5 });
    await setRestriction(world.businessId, true);
    const id = await record(world, 1);
    expect((await verifyEnforced(world.customer, id)).outcome).toBe("pending_admission");
    await expectPureHold(world, id, "restricted");
  });

  it("a held Purchase is valid and preserved: never rejected, and re-verifying it reports its state without forcing admission", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await record(world, 1);
    await verifyEnforced(world.customer, id);
    // A re-verify with a fresh key is idempotent: current state, no admission, no second hold event.
    const again = await verifyEnforced(world.customer, id);
    expect(again.outcome).toBe("pending_admission");
    expect(
      await count(
        "SELECT 1 FROM purchase_record_events WHERE purchase_record_id = $1 AND to_status = 'pending_admission'",
        [id],
      ),
    ).toBe(1);
    expect(
      await count("SELECT 1 FROM purchase_records WHERE status IN ('rejected','under_review')"),
    ).toBe(0);
    expect((await commercialFootprint(world.businessId)).admitKeys).toBe(0);
  });

  it("the existing read models show a held Purchase (status filter) with NO commercial reason or figure", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 0 });
    await post(world.businessId, "credit_adjustment", "paid", -2);
    const id = await record(world, 1);
    await verifyEnforced(world.customer, id);

    const listed = await listPurchasesForBusiness(db, pool, {
      userId: world.owner,
      businessId: world.businessId,
      status: "pending_admission",
    });
    expect(listed.purchases.map((p) => p.id)).toEqual([id]);
    const business = await getPurchaseRecordForBusiness(db, pool, {
      userId: world.owner,
      businessId: world.businessId,
      purchaseRecordId: id,
    });
    const customer = await getPurchaseRecordForCustomer(pool, {
      customerIdentityId: world.customer.customerId,
      purchaseRecordId: id,
    });
    for (const detail of [business, customer]) {
      expect(detail.purchase.status).toBe("pending_admission");
      const wire = JSON.stringify(detail);
      expect(wire).not.toMatch(
        /commercial|capacity|trial|paid|reserved|balance|restrict|insufficient|not_established|queue|available/i,
      );
      const held = detail.events.find((e) => e.toStatus === "pending_admission");
      expect(held).toMatchObject({ reason: "awaiting_admission", eventPayload: null });
    }
  });

  it("RETAINED POLICY (Founder-confirmed): pooled usable capacity -- a negative paid balance reduces it even when uncommitted trial exists", async () => {
    // usable = (trial + paid) - (trial reserved + paid reserved). Trial 1 uncommitted, paid -1: net 0.
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    await post(world.businessId, "credit_adjustment", "paid", -1);
    const a0 = await account(world.businessId);
    expect(a0.trialRemainingUnits - a0.trialReservedUnits).toBe(1); // uncommitted trial exists
    expect(availableCapacity(a0)).toBe(0); // ...but pooled usable capacity is 0
    const id = await record(world, 1);
    expect((await verifyEnforced(world.customer, id)).outcome).toBe("pending_admission");
    expect(await holdReasonOf(id)).toBe("insufficient_capacity");
    // Credit restores the pooled capacity (paid back to 0 -> usable 1): the start is admitted, trial-earmarked.
    await post(world.businessId, "credit_grant", "paid", 1);
    expect(availableCapacity(await account(world.businessId))).toBe(1);
    expect((await reevaluateOne(pool, { port, correlationId: nextId("corr") }, id)).outcome).toBe(
      "admitted",
    );
    expect((await listBlocksForBusiness(pool, world.businessId))[0].fundingBucket).toBe("trial");
    await assertAccountingInvariants(world.businessId);
  });

  it("stream queue: a later Purchase of a stream that already holds one is held behind it", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const first = await record(world, 1, { hour: 9 });
    const second = await record(world, 1, { hour: 10 });
    expect((await verifyEnforced(world.customer, first)).outcome).toBe("pending_admission");
    // Even with capacity now available, the stream's earlier hold goes first.
    await post(world.businessId, "trial_grant", "trial", 3);
    expect((await verifyEnforced(world.customer, second)).outcome).toBe("pending_admission");
    expect(await holdReasonOf(second)).toBe("stream_queue");
    expect((await commercialFootprint(world.businessId)).reservations).toBe(0);
  });

  it("business queue (no overtaking): a new Circle start is held behind an earlier held Purchase of the Business", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const c2 = await seedCustomer();
    const heldFirst = await record(world, 1, { hour: 9 });
    expect((await verifyEnforced(world.customer, heldFirst)).outcome).toBe("pending_admission");
    // Capacity appears, but another customer's new start must not take it ahead of the held Purchase.
    await post(world.businessId, "trial_grant", "trial", 1);
    const newcomer = await record(world, 1, { customer: c2, hour: 10 });
    expect((await verifyEnforced(c2, newcomer)).outcome).toBe("pending_admission");
    expect(await holdReasonOf(newcomer)).toBe("business_queue");
    expect((await account(world.businessId)).trialReservedUnits).toBe(0);
  });

  it("a held Purchase never invalidates anything else: existing Verified Units, Circle and Reward are untouched", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    admitted(await verifyEnforced(world.customer, await record(world, 10))); // Circle complete + Reward
    const before = await loyaltyFootprint(world);
    expect(before.rewards).toBe(1);
    // A new position now needs capacity that does not exist -> held.
    const next = await record(world, 1);
    expect((await verifyEnforced(world.customer, next)).outcome).toBe("pending_admission");
    const after = await loyaltyFootprint(world);
    expect(after).toEqual(before);
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1 AND state = 'available'", [
        world.customer.customerId,
      ]),
    ).toBe(1);
  });
});

// ===========================================================================
// 4. ACTIVE-CIRCLE GRACE
// ===========================================================================

describe("WP-COM-05b — active-Circle grace", () => {
  it("a Purchase continuing an admitted Circle is never blocked at zero or negative capacity, takes no Commercial lock and writes no Commercial row", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    admitted(await verifyEnforced(world.customer, await record(world, 1))); // begins position 1
    // Capacity collapses: negative paid balance, nothing usable.
    await post(world.businessId, "credit_adjustment", "paid", -3);
    const a0 = await account(world.businessId);
    expect(availableCapacity(a0)).toBeLessThan(0);
    const versionBefore = a0.version;
    const ledgerBefore = (await sumLedger(pool, world.businessId)).entryCount;

    // Units 2..9 continue position 1.
    for (let i = 2; i <= 9; i += 1) {
      const id = await record(world, 1);
      const { result, trace } = await traceStatements(() => verifyEnforced(world.customer, id));
      expect(result.outcome).toBe("admitted");
      // No Commercial statement at all, and in particular no account lock.
      expect(trace.filter((t) => /commercial/i.test(t))).toEqual([]);
    }
    expect((await account(world.businessId)).version).toBe(versionBefore);
    expect((await sumLedger(pool, world.businessId)).entryCount).toBe(ledgerBefore);
    expect((await commercialFootprint(world.businessId)).admissions).toBe(1);

    // The final earning unit completes the Circle and creates the Reward, still at negative capacity.
    const last = admitted(await verifyEnforced(world.customer, await record(world, 1)));
    expect(last.reward).not.toBeNull();
    expect(last.cycle.state).toBe("reward_available");
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
    await assertAccountingInvariants(world.businessId);

    // A NEW Circle start, in contrast, is held.
    const nextStart = await record(world, 1);
    expect((await verifyEnforced(world.customer, nextStart)).outcome).toBe("pending_admission");
  });

  it("the earned Reward is consumed through its earmark despite negative paid capacity (consumption is never gated)", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    const done = admitted(await verifyEnforced(world.customer, await record(world, 10)));
    await post(world.businessId, "credit_adjustment", "paid", -4);
    const projected = await projectCommercialConsumption(pool, {
      rewardId: done.reward!.id,
      correlationId: nextId("corr"),
      earmarkResolver: admissionEarmarkResolver,
    });
    expect(projected.outcome).toBe("projected");
    const a = await account(world.businessId);
    expect(a).toMatchObject({
      trialRemainingUnits: 0,
      trialReservedUnits: 0,
      paidBalanceUnits: -4,
    });
    await assertAccountingInvariants(world.businessId);
  });

  it("two purchases completing a Circle concurrently at negative capacity: one Reward, no Commercial change, no deadlock", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    admitted(await verifyEnforced(world.customer, await record(world, 8)));
    await post(world.businessId, "credit_adjustment", "paid", -3);
    const version = (await account(world.businessId)).version;
    const [a, b] = [await record(world, 1), await record(world, 1)];
    const results = await Promise.allSettled([
      verifyEnforced(world.customer, a),
      verifyEnforced(world.customer, b),
    ]);
    noDeadlocks(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
    expect(
      (await rows<{ allocated_units: number }>("SELECT allocated_units FROM loyalty_cycles"))[0]
        .allocated_units,
    ).toBe(10);
    expect((await account(world.businessId)).version).toBe(version);
    await assertAccountingInvariants(world.businessId);
  });

  it("redemption is not part of the admission path: no redemption source imports the gate, the port, Commercial or the held state", () => {
    const purchaseDir = path.join(srcDir, "domains", "purchase");
    const files = ["services", "repositories", "models"]
      .flatMap((d) =>
        readdirSync(path.join(purchaseDir, d)).map((f) => path.join(purchaseDir, d, f)),
      )
      .filter(
        (f) => /edemption/.test(path.basename(f)) && f.endsWith(".ts") && !f.endsWith(".test.ts"),
      );
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files.some((f) => f.endsWith("confirmRedemptionCommand.ts"))).toBe(true);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /admitOrHoldPurchase|purchaseAdmissionPort|purchaseAdmissionGate|domains\/commercial|commercial_|CommercialAccount|pending_admission/,
      );
    }
  });
});

// ===========================================================================
// 5. RE-EVALUATION (processor)
// ===========================================================================

describe("WP-COM-05b — reevaluatePendingAdmissions", () => {
  async function held(world: World, customer: Customer, hour: number): Promise<string> {
    const id = await record(world, 1, { customer, hour });
    expect((await verifyEnforced(customer, id)).outcome).toBe("pending_admission");
    return id;
  }

  async function writeSnapshot(businessId: string) {
    return {
      keys: await count("SELECT 1 FROM idempotency_keys"),
      ledger: (await sumLedger(pool, businessId)).entryCount,
      version: (await account(businessId)).version,
      footprint: await commercialFootprint(businessId),
      statuses: await rows("SELECT id, status FROM purchase_records ORDER BY id"),
      events: await count("SELECT 1 FROM purchase_record_events"),
      loyalty: await count("SELECT 1 FROM verified_units"),
      streams: await count("SELECT 1 FROM loyalty_cycle_streams"),
      audit: (await listCommercialAuditEventsForBusiness(pool, businessId)).length,
    };
  }

  it("a held Purchase stays held while capacity is unavailable, and each pass writes NOTHING (no key, no row)", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await held(world, world.customer, 10);
    const before = await writeSnapshot(world.businessId);
    for (let i = 0; i < 3; i += 1) {
      const pass = await reevaluatePendingAdmissions(pool, {
        businessId: world.businessId,
        port,
        correlationId: nextId("corr"),
      });
      expect(pass.results).toEqual([
        { purchaseId: id, outcome: "held", reason: "insufficient_capacity" },
      ]);
    }
    expect(await writeSnapshot(world.businessId)).toEqual(before);
    expect(await purchaseStatus(id)).toBe("pending_admission");
    expect((await commercialFootprint(world.businessId)).admitKeys).toBe(0);
  });

  it("admits when capacity appears, with the system actor, the same ADMIT path and an earmark", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await held(world, world.customer, 10);
    await post(world.businessId, "trial_grant", "trial", 1);
    const pass = await reevaluatePendingAdmissions(pool, {
      businessId: world.businessId,
      port,
      correlationId: nextId("corr"),
    });
    expect(pass.results).toEqual([{ purchaseId: id, outcome: "admitted" }]);
    expect(await purchaseStatus(id)).toBe("verified");
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    const admission = (await listAdmissionsForBusiness(pool, world.businessId))[0];
    expect(admission).toMatchObject({ purchaseRecordId: id, decidedBy: "admission_processor" });
    expect((await listBlocksForBusiness(pool, world.businessId))[0].fundingBucket).toBe("trial");
    // The admission key exists only now.
    expect(
      await count(
        "SELECT 1 FROM idempotency_keys WHERE idempotency_key = $1 AND status = 'completed'",
        [admissionIdempotencyKey(id)],
      ),
    ).toBe(1);
    // Attribution: the customer's confirmation is the hold event; admission is the system's.
    const events = await rows<{ to_status: string; actor_type: string }>(
      "SELECT to_status, actor_type FROM purchase_record_events WHERE purchase_record_id = $1 ORDER BY occurred_at, id",
      [id],
    );
    expect(events.slice(1).map((e) => [e.to_status, e.actor_type])).toEqual([
      ["pending_admission", "customer"],
      ["verified", "system"],
    ]);
    expect(
      await count(
        "SELECT 1 FROM trust_events WHERE causal_purchase_record_id = $1 AND event_type = 'purchase.verified' AND actor_type = 'system'",
        [id],
      ),
    ).toBe(1);
    await assertAccountingInvariants(world.businessId);
  });

  it("is repeat-safe: running again changes nothing and nothing is admitted twice", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await held(world, world.customer, 10);
    await post(world.businessId, "trial_grant", "trial", 3);
    await reevaluatePendingAdmissions(pool, {
      businessId: world.businessId,
      port,
      correlationId: nextId("corr"),
    });
    const before = await writeSnapshot(world.businessId);
    const again = await reevaluatePendingAdmissions(pool, {
      businessId: world.businessId,
      port,
      correlationId: nextId("corr"),
    });
    expect(again.results).toEqual([]);
    expect(await reevaluateOne(pool, { port, correlationId: nextId("corr") }, id)).toEqual({
      purchaseId: id,
      outcome: "not_pending",
    });
    expect(await writeSnapshot(world.businessId)).toEqual(before);
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
  });

  // ---- CORR-001: FIFO scan order + skip-and-continue ---------------------------------------
  // A Purchase's cost is the number of new Circle positions it begins: on an empty stream a
  // quantity of 1..10 costs 1, 11..20 costs 2, 21..30 costs 3.
  const COST_QTY: Record<number, number> = { 1: 1, 2: 11, 3: 21 };

  /** Holds one Purchase per customer, in purchase-date order (hour 9, 10, 11, ...), at zero capacity. */
  async function heldQueue(world: World, costs: number[]) {
    const ids: string[] = [];
    for (let i = 0; i < costs.length; i += 1) {
      const customer = i === 0 ? world.customer : await seedCustomer();
      const id = await record(world, COST_QTY[costs[i]], { customer, hour: 9 + i });
      expect((await verifyEnforced(customer, id)).outcome).toBe("pending_admission");
      ids.push(id);
    }
    return ids;
  }
  const scan = (world: World) =>
    reevaluatePendingAdmissions(pool, {
      businessId: world.businessId,
      port,
      correlationId: nextId("corr"),
    });
  const statusesOf = async (ids: string[]) => Promise.all(ids.map((id) => purchaseStatus(id)));

  it("CASE A: capacity 1, P1 costs 2, P2 costs 1 -> P1 stays pending, P2 admits (skip-and-continue)", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const [p1, p2] = await heldQueue(world, [2, 1]);
    await post(world.businessId, "trial_grant", "trial", 1);
    const pass = await scan(world);
    // Oldest-first scan order, skip then continue.
    expect(pass.results).toEqual([
      { purchaseId: p1, outcome: "held", reason: "insufficient_capacity" },
      { purchaseId: p2, outcome: "admitted" },
    ]);
    expect(await statusesOf([p1, p2])).toEqual(["pending_admission", "verified"]);
    // The skipped Purchase is unchanged: no key, no unit, no reservation of its own.
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [p1])).toBe(0);
    expect(
      await count("SELECT 1 FROM idempotency_keys WHERE idempotency_key = $1", [
        admissionIdempotencyKey(p1),
      ]),
    ).toBe(0);
    expect((await account(world.businessId)).trialReservedUnits).toBe(1);
    await assertAccountingInvariants(world.businessId);
  });

  it("CASE B: capacity 2, P1 costs 2, P2 costs 1 -> P1 admits, P2 stays pending", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const [p1, p2] = await heldQueue(world, [2, 1]);
    await post(world.businessId, "trial_grant", "trial", 2);
    const pass = await scan(world);
    expect(pass.results).toEqual([
      { purchaseId: p1, outcome: "admitted" },
      { purchaseId: p2, outcome: "held", reason: "insufficient_capacity" },
    ]);
    expect(await statusesOf([p1, p2])).toEqual(["verified", "pending_admission"]);
    expect((await account(world.businessId)).trialReservedUnits).toBe(2);
    await assertAccountingInvariants(world.businessId);
  });

  it("CASE C: capacity 2, P1 costs 3, P2 and P3 cost 1 -> P1 pending, P2 and P3 admit", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const [p1, p2, p3] = await heldQueue(world, [3, 1, 1]);
    await post(world.businessId, "trial_grant", "trial", 2);
    const pass = await scan(world);
    expect(pass.results).toEqual([
      { purchaseId: p1, outcome: "held", reason: "insufficient_capacity" },
      { purchaseId: p2, outcome: "admitted" },
      { purchaseId: p3, outcome: "admitted" },
    ]);
    expect(await statusesOf([p1, p2, p3])).toEqual(["pending_admission", "verified", "verified"]);
    expect((await account(world.businessId)).trialReservedUnits).toBe(2);
    await assertAccountingInvariants(world.businessId);
  });

  it("CASE D: capacity 1, P1 and P2 both cost 2 -> both stay pending, nothing is written", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const ids = await heldQueue(world, [2, 2]);
    await post(world.businessId, "trial_grant", "trial", 1);
    const before = await writeSnapshot(world.businessId);
    const pass = await scan(world);
    expect(pass.results.map((r) => r.outcome)).toEqual(["held", "held"]);
    expect(await statusesOf(ids)).toEqual(["pending_admission", "pending_admission"]);
    expect(await writeSnapshot(world.businessId)).toEqual(before);
    expect((await commercialFootprint(world.businessId)).admitKeys).toBe(0);
  });

  it("CASE E: a skipped older Purchase is admitted by a later run once capacity arrives, still oldest-first", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const [p1, p2, p3] = await heldQueue(world, [2, 1, 1]);
    await post(world.businessId, "trial_grant", "trial", 1);
    const first = await scan(world);
    expect(first.results.map((r) => [r.purchaseId, r.outcome])).toEqual([
      [p1, "held"],
      [p2, "admitted"],
      [p3, "held"],
    ]);
    // More capacity arrives: the OLDEST Purchase is evaluated first and now fits.
    await post(world.businessId, "trial_grant", "trial", 3);
    const second = await scan(world);
    expect(second.results.map((r) => [r.purchaseId, r.outcome])).toEqual([
      [p1, "admitted"],
      [p3, "admitted"],
    ]);
    expect(await statusesOf([p1, p2, p3])).toEqual(["verified", "verified", "verified"]);
    expect((await account(world.businessId)).trialReservedUnits).toBe(4);
    await assertAccountingInvariants(world.businessId);
  });

  it("scan order is deterministic oldest-first by (purchase_date, id), whatever the recording order", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const c2 = await seedCustomer();
    const c3 = await seedCustomer();
    // Recorded newest-first; the scan must still visit them oldest-first.
    const late = await record(world, 1, { customer: world.customer, hour: 15 });
    const mid = await record(world, 1, { customer: c2, hour: 12 });
    const early = await record(world, 1, { customer: c3, hour: 9 });
    for (const [c, id] of [
      [world.customer, late],
      [c2, mid],
      [c3, early],
    ] as const) {
      expect((await verifyEnforced(c, id)).outcome).toBe("pending_admission");
    }
    const pass = await scan(world);
    expect(pass.results.map((r) => r.purchaseId)).toEqual([early, mid, late]);
  });

  it("the stream rule still orders one customer's units: a later Purchase of the same stream is not admitted past an older held one", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const c2 = await seedCustomer();
    // Same customer: an older 2-position Purchase and a later 1-position Purchase; another customer in between.
    const older = await record(world, COST_QTY[2], { customer: world.customer, hour: 9 });
    expect((await verifyEnforced(world.customer, older)).outcome).toBe("pending_admission");
    const other = await record(world, 1, { customer: c2, hour: 10 });
    expect((await verifyEnforced(c2, other)).outcome).toBe("pending_admission");
    const later = await record(world, 1, { customer: world.customer, hour: 11 });
    expect((await verifyEnforced(world.customer, later)).outcome).toBe("pending_admission");
    await post(world.businessId, "trial_grant", "trial", 1);
    const pass = await scan(world);
    expect(pass.results).toEqual([
      { purchaseId: older, outcome: "held", reason: "insufficient_capacity" },
      { purchaseId: other, outcome: "admitted" },
      // Fits by capacity, but its stream's older Purchase is still held: units enter a stream in order.
      { purchaseId: later, outcome: "held", reason: "stream_queue" },
    ]);
  });

  it("starvation is bounded to evaluation, not skipped: the large Purchase is examined FIRST on every run", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const [big, ...small] = await heldQueue(world, [3, 1, 1, 1]);
    await post(world.businessId, "trial_grant", "trial", 1);
    for (let i = 0; i < 3; i += 1) {
      const pass = await scan(world);
      expect(pass.results[0]).toMatchObject({ purchaseId: big, outcome: "held" });
      await post(world.businessId, "trial_grant", "trial", 1);
    }
    // Residual risk, documented: under sustained small admissions the large one is still held.
    expect(await purchaseStatus(big)).toBe("pending_admission");
    expect((await statusesOf(small)).every((x) => x === "verified")).toBe(true);
  });

  it("processes every Business that holds a Purchase when no Business is named", async () => {
    const w1 = await seedWorld();
    const w2 = await seedWorld();
    await openAccount(w1.businessId);
    await openAccount(w2.businessId);
    const p1 = await held(w1, w1.customer, 10);
    const p2 = await held(w2, w2.customer, 10);
    await post(w1.businessId, "trial_grant", "trial", 1);
    await post(w2.businessId, "trial_grant", "trial", 1);
    const pass = await reevaluatePendingAdmissions(pool, { port, correlationId: nextId("corr") });
    expect(pass.admittedCount).toBe(2);
    expect(await purchaseStatus(p1)).toBe("verified");
    expect(await purchaseStatus(p2)).toBe("verified");
  });

  it("concurrent workers: one Purchase is admitted exactly once; the others see not_pending", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await held(world, world.customer, 10);
    await post(world.businessId, "trial_grant", "trial", 3);
    const results = await Promise.allSettled(
      [1, 2, 3, 4, 5].map(() => reevaluateOne(pool, { port, correlationId: nextId("corr") }, id)),
    );
    noDeadlocks(results);
    const values = results.map((r) => (r.status === "fulfilled" ? r.value.outcome : "error"));
    expect(values.filter((v) => v === "admitted")).toHaveLength(1);
    expect(values.filter((v) => v === "not_pending")).toHaveLength(4);
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect(await commercialFootprint(world.businessId)).toEqual({
      admissions: 1,
      earmarks: 1,
      reservations: 1,
      admitKeys: 1,
    });
    await assertAccountingInvariants(world.businessId);
  });

  it("a worker that HOLDs cannot poison another: no admission key remains, and a later ADMIT still succeeds", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await held(world, world.customer, 10);
    const hold = await reevaluateOne(pool, { port, correlationId: nextId("corr") }, id);
    expect(hold.outcome).toBe("held");
    expect(await count("SELECT 1 FROM idempotency_keys WHERE idempotency_key LIKE 'admit:%'")).toBe(
      0,
    );
    await post(world.businessId, "trial_grant", "trial", 1);
    const ok = await reevaluateOne(pool, { port, correlationId: nextId("corr") }, id);
    expect(ok.outcome).toBe("admitted");
  });

  it("restoring a restricted Business only PERMITS admission; the processor admits", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    await setRestriction(world.businessId, true);
    const id = await held(world, world.customer, 10);
    await setRestriction(world.businessId, false);
    expect(await purchaseStatus(id)).toBe("pending_admission"); // restoration admitted nothing by itself
    const pass = await reevaluatePendingAdmissions(pool, {
      businessId: world.businessId,
      port,
      correlationId: nextId("corr"),
    });
    expect(pass.admittedCount).toBe(1);
  });
});

// ===========================================================================
// 6. CONCURRENCY
// ===========================================================================

describe("WP-COM-05b — concurrency", () => {
  it("A. one remaining capacity unit + two new starts: exactly one ADMIT and one HOLD, no oversubscription", async () => {
    for (let round = 0; round < 3; round += 1) {
      const world = await seedWorld();
      const c2 = await seedCustomer();
      await openAccount(world.businessId, { trial: 1 });
      const p1 = await record(world, 1);
      const p2 = await record(world, 1, { customer: c2 });
      const results = await Promise.allSettled([
        verifyEnforced(world.customer, p1),
        verifyEnforced(c2, p2),
      ]);
      noDeadlocks(results);
      expect(results.every((r) => r.status === "fulfilled")).toBe(true);
      const outcomes = results.map(
        (r) => (r as PromiseFulfilledResult<VerifyPurchaseResult>).value.outcome,
      );
      expect([...outcomes].sort()).toEqual(["admitted", "pending_admission"]);
      expect(
        await count("SELECT 1 FROM verified_units WHERE business_id = $1", [world.businessId]),
      ).toBe(1);
      const a = await account(world.businessId);
      expect(a.trialReservedUnits).toBe(1);
      expect(availableCapacity(a)).toBe(0);
      await assertAccountingInvariants(world.businessId);
    }
  }, 60000);

  it("A'. many concurrent new starts against N units admit exactly N", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 3 });
    const customers = [world.customer];
    for (let i = 0; i < 4; i += 1) customers.push(await seedCustomer());
    const ids: string[] = [];
    for (const c of customers) ids.push(await record(world, 1, { customer: c }));
    const results = await Promise.allSettled(customers.map((c, i) => verifyEnforced(c, ids[i])));
    noDeadlocks(results);
    const outcomes = results.map(
      (r) => (r as PromiseFulfilledResult<VerifyPurchaseResult>).value.outcome,
    );
    expect(outcomes.filter((o) => o === "admitted")).toHaveLength(3);
    expect(outcomes.filter((o) => o === "pending_admission")).toHaveLength(2);
    expect(await count("SELECT 1 FROM verified_units")).toBe(3);
    expect((await account(world.businessId)).trialReservedUnits).toBe(3);
    await assertAccountingInvariants(world.businessId);
  }, 60000);

  it("B. two Purchases for the same customer/Circle with one unit left: positions never oversubscribed", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    // 5 + 7 = 12 units: the second begins position 2, which needs capacity that is not there.
    const [a, b] = [await record(world, 5), await record(world, 7)];
    const results = await Promise.allSettled([
      verifyEnforced(world.customer, a),
      verifyEnforced(world.customer, b),
    ]);
    noDeadlocks(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const out = results.map(
      (r) => (r as PromiseFulfilledResult<VerifyPurchaseResult>).value.outcome,
    );
    // Whichever took the stream lock first: if the 5 went first it begins position 1 and the 7
    // would begin position 2 (held); if the 7 went first it begins position 1 and the 5 stays
    // inside it (admitted at no cost). Never more than one position is reserved.
    expect(out.filter((o) => o === "admitted").length).toBeGreaterThanOrEqual(1);
    expect((await account(world.businessId)).trialReservedUnits).toBe(1);
    expect(await listBlocksForBusiness(pool, world.businessId)).toHaveLength(1);
    await assertAccountingInvariants(world.businessId);
  }, 60000);

  it("B'. with room for both, concurrent Purchases of one stream begin consecutive positions", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const [a, b] = [await record(world, 10), await record(world, 10)];
    const results = await Promise.allSettled([
      verifyEnforced(world.customer, a),
      verifyEnforced(world.customer, b),
    ]);
    noDeadlocks(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const blocks = await listBlocksForBusiness(pool, world.businessId);
    expect(blocks.map((x) => x.blockIndex)).toEqual([1, 2]);
    await assertAccountingInvariants(world.businessId);
  }, 60000);

  it("C. the same Purchase verified twice concurrently (different keys): admitted once", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const id = await record(world, 1);
    const results = await Promise.allSettled([
      verifyEnforced(world.customer, id),
      verifyEnforced(world.customer, id),
      verifyEnforced(world.customer, id),
    ]);
    noDeadlocks(results);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect(await commercialFootprint(world.businessId)).toMatchObject({
      admissions: 1,
      earmarks: 1,
      reservations: 1,
      admitKeys: 1,
    });
    await assertAccountingInvariants(world.businessId);
  }, 60000);

  it("C'. the same Purchase verified twice concurrently while it must be HELD: one hold, no admission", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await record(world, 1);
    const results = await Promise.allSettled([
      verifyEnforced(world.customer, id),
      verifyEnforced(world.customer, id),
    ]);
    noDeadlocks(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(
      await count(
        "SELECT 1 FROM purchase_record_events WHERE purchase_record_id = $1 AND to_status = 'pending_admission'",
        [id],
      ),
    ).toBe(1);
    expect((await commercialFootprint(world.businessId)).admitKeys).toBe(0);
    expect(await loyaltyFootprint(world)).toEqual(NO_LOYALTY);
  }, 60000);

  it("C''. the same key concurrently: one result", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const id = await record(world, 1);
    const key = nextId("key");
    const results = await Promise.allSettled([
      verifyEnforced(world.customer, id, { key }),
      verifyEnforced(world.customer, id, { key }),
    ]);
    noDeadlocks(results);
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect((await commercialFootprint(world.businessId)).admissions).toBe(1);
    await assertAccountingInvariants(world.businessId);
  }, 60000);

  it("D. held re-evaluation racing a manual trial adjustment: consistent either way, then admitted", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    for (let i = 0; i < 4; i += 1) {
      const customer = i === 0 ? world.customer : await seedCustomer();
      const id = await record(world, 1, { customer, hour: 9 });
      expect((await verifyEnforced(customer, id)).outcome).toBe("pending_admission");
      const race = await Promise.allSettled([
        post(world.businessId, "trial_adjustment", "trial", 1),
        reevaluateOne(pool, { port, correlationId: nextId("corr") }, id),
      ]);
      noDeadlocks(race);
      expect(race.every((r) => r.status === "fulfilled")).toBe(true);
      // Whichever won, a further pass leaves the Purchase admitted (capacity of 1 existed).
      await reevaluateOne(pool, { port, correlationId: nextId("corr") }, id);
      expect(await purchaseStatus(id)).toBe("verified");
      await assertAccountingInvariants(world.businessId);
    }
    expect((await account(world.businessId)).trialReservedUnits).toBe(4);
    expect(await count("SELECT 1 FROM verified_units")).toBe(4);
  }, 120000);

  it("E. held re-evaluation racing a settlement-confirmation credit: consistent either way, then admitted", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 0 });
    for (let i = 0; i < 3; i += 1) {
      const customer = i === 0 ? world.customer : await seedCustomer();
      const id = await record(world, 1, { customer, hour: 9 });
      expect((await verifyEnforced(customer, id)).outcome).toBe("pending_admission");
      const race = await Promise.allSettled([
        post(world.businessId, "credit_grant", "paid", 1),
        reevaluateOne(pool, { port, correlationId: nextId("corr") }, id),
      ]);
      noDeadlocks(race);
      expect(race.every((r) => r.status === "fulfilled")).toBe(true);
      await reevaluateOne(pool, { port, correlationId: nextId("corr") }, id);
      expect(await purchaseStatus(id)).toBe("verified");
    }
    const a = await account(world.businessId);
    expect(a.paidReservedUnits).toBe(3);
    expect(
      (await listBlocksForBusiness(pool, world.businessId)).every(
        (b) => b.fundingBucket === "paid",
      ),
    ).toBe(true);
    await assertAccountingInvariants(world.businessId);
  }, 120000);

  it("F. restriction / restore racing a verify: consistent either way, nothing admitted while restricted", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 5 });
    const id = await record(world, 1);
    const race = await Promise.allSettled([
      setRestriction(world.businessId, true),
      verifyEnforced(world.customer, id),
    ]);
    noDeadlocks(race);
    expect(race.every((r) => r.status === "fulfilled")).toBe(true);
    const status = await purchaseStatus(id);
    expect(["verified", "pending_admission"]).toContain(status);
    if (status === "verified") expect((await account(world.businessId)).trialReservedUnits).toBe(1);
    else expect((await account(world.businessId)).trialReservedUnits).toBe(0);
    // Restore racing the processor.
    const race2 = await Promise.allSettled([
      setRestriction(world.businessId, false),
      reevaluatePendingAdmissions(pool, {
        businessId: world.businessId,
        port,
        correlationId: nextId("corr"),
      }),
    ]);
    noDeadlocks(race2);
    await reevaluatePendingAdmissions(pool, {
      businessId: world.businessId,
      port,
      correlationId: nextId("corr"),
    });
    expect(await purchaseStatus(id)).toBe("verified");
    await assertAccountingInvariants(world.businessId);
  }, 60000);

  it("G. trial adjustment near the reserved amount racing an admission: the floor holds, no lost update", async () => {
    const world = await seedWorld();
    const c2 = await seedCustomer();
    await openAccount(world.businessId, { trial: 2 });
    admitted(await verifyEnforced(world.customer, await record(world, 1))); // reserves 1 of 2
    const second = await record(world, 1, { customer: c2 });
    const race = await Promise.allSettled([
      // Reducing trial by 1 leaves 1 = reserved 1: allowed ONLY if the second admission has not reserved.
      post(world.businessId, "trial_adjustment", "trial", -1),
      verifyEnforced(c2, second),
    ]);
    noDeadlocks(race);
    const a = await account(world.businessId);
    expect(a.trialRemainingUnits).toBeGreaterThanOrEqual(a.trialReservedUnits);
    const verifyResult = race[1];
    expect(verifyResult.status).toBe("fulfilled");
    const outcome = (verifyResult as PromiseFulfilledResult<VerifyPurchaseResult>).value.outcome;
    if (race[0].status === "fulfilled") {
      // The adjustment went first: trial 1, reserved 1 -> the second start is held.
      expect(outcome).toBe("pending_admission");
      expect(a.trialRemainingUnits).toBe(1);
    } else {
      // The admission went first (reserved 2 of 2): the adjustment would strand it and is refused.
      expect(outcome).toBe("admitted");
      expect(a.trialRemainingUnits).toBe(2);
    }
    await assertAccountingInvariants(world.businessId);
  }, 60000);

  it("I. a new-Circle start at zero capacity while the Business also completes another Circle: no deadlock", async () => {
    const world = await seedWorld();
    const c2 = await seedCustomer();
    await openAccount(world.businessId, { trial: 1 });
    admitted(await verifyEnforced(world.customer, await record(world, 9)));
    const completing = await record(world, 1);
    const newStart = await record(world, 1, { customer: c2 });
    const results = await Promise.allSettled([
      verifyEnforced(world.customer, completing),
      verifyEnforced(c2, newStart),
    ]);
    noDeadlocks(results);
    const [r1, r2] = results as PromiseFulfilledResult<VerifyPurchaseResult>[];
    expect(r1.value.outcome).toBe("admitted"); // inside position 1: never gated
    expect(r2.value.outcome).toBe("pending_admission"); // the only unit is already promised
    await assertAccountingInvariants(world.businessId);
  }, 60000);
});

// ===========================================================================
// 6A. CONCURRENCY OF THE SKIP-AND-CONTINUE PROCESSOR (CORR-001)
// ===========================================================================

describe("WP-COM-05b CORR-001 — processor concurrency", () => {
  const COST_QTY: Record<number, number> = { 1: 1, 2: 11, 3: 21 };

  async function heldQueue(world: World, costs: number[]) {
    const ids: string[] = [];
    for (let i = 0; i < costs.length; i += 1) {
      const customer = i === 0 ? world.customer : await seedCustomer();
      const id = await record(world, COST_QTY[costs[i]], { customer, hour: 9 + i });
      expect((await verifyEnforced(customer, id)).outcome).toBe("pending_admission");
      ids.push(id);
    }
    return ids;
  }
  const pass = (world: World) =>
    reevaluatePendingAdmissions(pool, {
      businessId: world.businessId,
      port,
      correlationId: nextId("corr"),
    });

  async function expectNoDoubleState(world: World, ids: string[]) {
    // No duplicate Verified Unit, admission, earmark, reservation or admission key per Purchase.
    for (const id of ids) {
      expect(
        await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id]),
      ).toBeLessThanOrEqual(1);
      expect(
        await count("SELECT 1 FROM commercial_admissions WHERE purchase_record_id = $1", [id]),
      ).toBeLessThanOrEqual(1);
      expect(
        await count("SELECT 1 FROM idempotency_keys WHERE idempotency_key = $1", [
          admissionIdempotencyKey(id),
        ]),
      ).toBeLessThanOrEqual(1);
    }
    const blocks = await listBlocksForBusiness(pool, world.businessId);
    expect(new Set(blocks.map((b) => `${b.streamRef}:${b.blockIndex}`)).size).toBe(blocks.length);
    await assertAccountingInvariants(world.businessId);
  }

  it("two full passes at once over [3,1,1,1] with capacity 2: exactly two small Purchases admit, the large one is skipped, no oversubscription", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const [big, ...small] = await heldQueue(world, [3, 1, 1, 1]);
    await post(world.businessId, "trial_grant", "trial", 2);
    const results = await Promise.allSettled([pass(world), pass(world)]);
    noDeadlocks(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await purchaseStatus(big)).toBe("pending_admission");
    const statuses = await Promise.all(small.map((id) => purchaseStatus(id)));
    expect(statuses.filter((x) => x === "verified")).toHaveLength(2);
    expect(statuses.filter((x) => x === "pending_admission")).toHaveLength(1);
    expect((await account(world.businessId)).trialReservedUnits).toBe(2);
    expect(await count("SELECT 1 FROM verified_units")).toBe(2);
    await expectNoDoubleState(world, [big, ...small]);
  }, 60000);

  it("two workers on two different Purchases competing for one remaining unit: one admits, one stays held", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const [a, b] = await heldQueue(world, [1, 1]);
    await post(world.businessId, "trial_grant", "trial", 1);
    const results = await Promise.allSettled([
      reevaluateOne(pool, { port, correlationId: nextId("corr") }, a),
      reevaluateOne(pool, { port, correlationId: nextId("corr") }, b),
    ]);
    noDeadlocks(results);
    const outcomes = results.map((r) => (r.status === "fulfilled" ? r.value.outcome : "error"));
    expect([...outcomes].sort()).toEqual(["admitted", "held"]);
    expect((await account(world.businessId)).trialReservedUnits).toBe(1);
    await expectNoDoubleState(world, [a, b]);
  }, 60000);

  it("a full pass racing a manual credit adjustment: consistent either order, final pass admits what fits", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const ids = await heldQueue(world, [2, 1, 1]);
    const race = await Promise.allSettled([
      post(world.businessId, "trial_adjustment", "trial", 2),
      pass(world),
    ]);
    noDeadlocks(race);
    expect(race.every((r) => r.status === "fulfilled")).toBe(true);
    await pass(world);
    // Capacity 2 in total: either the cost-2 Purchase, or the two cost-1 Purchases, never more.
    const a = await account(world.businessId);
    expect(a.trialReservedUnits).toBeLessThanOrEqual(2);
    expect(a.trialReservedUnits).toBeGreaterThanOrEqual(2);
    await expectNoDoubleState(world, ids);
  }, 60000);

  it("a full pass racing a settlement-confirmation credit: consistent, no stale capacity decision", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const ids = await heldQueue(world, [2, 1, 1]);
    const race = await Promise.allSettled([
      post(world.businessId, "credit_grant", "paid", 2),
      pass(world),
    ]);
    noDeadlocks(race);
    expect(race.every((r) => r.status === "fulfilled")).toBe(true);
    await pass(world);
    expect((await account(world.businessId)).paidReservedUnits).toBe(2);
    expect(
      (await listBlocksForBusiness(pool, world.businessId)).every(
        (x) => x.fundingBucket === "paid",
      ),
    ).toBe(true);
    await expectNoDoubleState(world, ids);
  }, 60000);

  it("a full pass racing restriction and restore: nothing admitted while restricted, consistent after", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 0 });
    const ids = await heldQueue(world, [2, 1]);
    await post(world.businessId, "trial_grant", "trial", 3);
    await setRestriction(world.businessId, true);
    const restrictedPass = await pass(world);
    expect(restrictedPass.results.every((r) => r.outcome === "held")).toBe(true);
    expect(await commercialFootprint(world.businessId)).toMatchObject({
      admissions: 0,
      admitKeys: 0,
    });
    const race = await Promise.allSettled([setRestriction(world.businessId, false), pass(world)]);
    noDeadlocks(race);
    await pass(world);
    expect(await Promise.all(ids.map((id) => purchaseStatus(id)))).toEqual([
      "verified",
      "verified",
    ]);
    await expectNoDoubleState(world, ids);
  }, 60000);
});

// ===========================================================================
// 7. PARENT-BEFORE-CHILD, ATOMICITY
// ===========================================================================

describe("WP-COM-05b — Verified Unit ordering and atomic rollback", () => {
  it("the foreign keys are IMMEDIATE (not deferrable): a child before its parent fails at the statement", async () => {
    const defs = await rows<{ conname: string; condeferrable: boolean }>(
      `SELECT conname, condeferrable FROM pg_constraint
        WHERE contype = 'f' AND conrelid IN ('commercial_admissions'::regclass, 'commercial_admission_blocks'::regclass)`,
    );
    expect(defs.length).toBeGreaterThanOrEqual(5);
    for (const d of defs) expect(d.condeferrable, d.conname).toBe(false);
  });

  it("recording an admission BEFORE its Verified Unit exists fails the foreign key (ordering is enforced, not incidental)", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const id = await record(world, 1);
    const plan = {
      blocks: [{ blockIndex: 1, fundingBucket: "trial" as const }],
      snapshot: {
        accountVersion: 1,
        trialRemainingUnits: 2,
        paidBalanceUnits: 0,
        trialReservedUnits: 0,
        paidReservedUnits: 0,
        availableBefore: 2,
        reservedBefore: 0,
        serviceRestriction: "none" as const,
      },
    };
    await expect(
      withPlatformTransaction(pool, async (tx) =>
        port.recordAdmission(tx, {
          businessId: world.businessId,
          purchaseRecordId: id,
          verifiedUnitId: randomUUID(), // the parent does not exist
          streamRef: "x",
          plan,
          decidedBy: "customer_verify",
          admissionScopeKey: admissionIdempotencyKey(id),
          correlationId: nextId("corr"),
        }),
      ),
    ).rejects.toMatchObject({ code: "23503" });
    // Nothing leaked from the failed transaction.
    expect(await commercialFootprint(world.businessId)).toEqual({
      admissions: 0,
      earmarks: 0,
      reservations: 0,
      admitKeys: 0,
    });
    expect((await account(world.businessId)).trialReservedUnits).toBe(0);
  });

  it("a failure AFTER the Verified Unit and Commercial children, before commit, rolls everything back atomically; retry succeeds", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const id = await record(world, 1);
    const ledgerBefore = (await sumLedger(pool, world.businessId)).entryCount;
    const failing: PurchaseAdmissionCapacityPort = {
      ...port,
      recordAdmission: async (tx, input) => {
        await port.recordAdmission(tx, input); // unit, reservation, admission, earmark all written
        throw new Error("boom-after-commercial-children");
      },
    };
    await expect(verifyEnforced(world.customer, id, { gatePort: failing })).rejects.toThrow(
      /boom-after-commercial-children/,
    );
    expect(await purchaseStatus(id)).toBe("waiting_for_customer");
    expect(await loyaltyFootprint(world)).toEqual(NO_LOYALTY);
    expect(await commercialFootprint(world.businessId)).toEqual({
      admissions: 0,
      earmarks: 0,
      reservations: 0,
      admitKeys: 0,
    });
    expect((await sumLedger(pool, world.businessId)).entryCount).toBe(ledgerBefore);
    expect((await account(world.businessId)).trialReservedUnits).toBe(0);
    // The in-progress reservations (client key and admission key) were rolled back with it.
    expect(
      await count(
        "SELECT 1 FROM idempotency_keys WHERE operation_type IN ('purchase.verify', 'purchase.admit')",
      ),
    ).toBe(0);
    const retried = await verifyEnforced(world.customer, id);
    expect(retried.outcome).toBe("admitted");
    await assertAccountingInvariants(world.businessId);
  });

  it("a failure AFTER the whole admission returned (last moment before commit) rolls everything back", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const id = await record(world, 10);
    await expect(
      withPlatformTransaction(pool, async (tx) => {
        const locked = await lockPurchaseRecordById(tx, id);
        const outcome = await admitOrHoldPurchase(tx, {
          locked: locked!,
          fromStatus: "waiting_for_customer",
          actor: { type: "customer", id: world.customer.customerId },
          correlationId: nextId("corr"),
          idempotencyKey: nextId("key"),
          port,
          decidedBy: "customer_verify",
          onHold: "record",
          applyBusinessQueue: true,
        });
        expect(outcome.outcome).toBe("admitted");
        throw new Error("boom-before-commit");
      }),
    ).rejects.toThrow(/boom-before-commit/);
    expect(await purchaseStatus(id)).toBe("waiting_for_customer");
    expect(await loyaltyFootprint(world)).toEqual(NO_LOYALTY);
    expect(await count("SELECT 1 FROM rewards")).toBe(0);
    expect(
      await count(
        "SELECT 1 FROM idempotency_keys WHERE operation_type IN ('purchase.verify', 'purchase.admit')",
      ),
    ).toBe(0);
    expect((await commercialFootprint(world.businessId)).reservations).toBe(0);
    await assertAccountingInvariants(world.businessId);
  });

  it("a client cannot occupy the system admission key namespace (reserved prefix refused)", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await record(world, 1);
    await expect(
      verifyEnforced(world.customer, id, { key: admissionIdempotencyKey(id) }),
    ).rejects.toThrow(/reserved prefix/);
    expect(await purchaseStatus(id)).toBe("waiting_for_customer");
    // The held Purchase can still be held and later admitted under the system key.
    expect((await verifyEnforced(world.customer, id)).outcome).toBe("pending_admission");
    await post(world.businessId, "trial_grant", "trial", 1);
    expect((await reevaluateOne(pool, { port, correlationId: nextId("corr") }, id)).outcome).toBe(
      "admitted",
    );
  });

  it("gate `enforce` without a Commercial port fails closed before any write", async () => {
    const world = await seedWorld();
    const id = await record(world, 1);
    await expect(
      verifyPurchase(db, pool, {
        customerIdentityId: world.customer.customerId,
        request: { purchaseRecordId: id },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
        admissionGateMode: "enforce",
      }),
    ).rejects.toThrow(/requires a Commercial admission port/);
    expect(await purchaseStatus(id)).toBe("waiting_for_customer");
    expect(
      await count(
        "SELECT 1 FROM idempotency_keys WHERE operation_type IN ('purchase.verify', 'purchase.admit')",
      ),
    ).toBe(0);
  });
});

// ===========================================================================
// 8. LOCK ORDER
// ===========================================================================

describe("WP-COM-05b — lock order (statement trace)", () => {
  it("ADMIT of a new Circle: client key -> Purchase -> stream -> Cycle -> account -> admit key -> Verified Unit -> reservation -> admission -> earmark -> allocation", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const id = await record(world, 1);
    const { result, trace } = await traceStatements(() => verifyEnforced(world.customer, id));
    expect(result.outcome).toBe("admitted");

    const first = (needle: string, from = 0) =>
      trace.findIndex((t, i) => i >= from && t === needle);
    const idxClientKey = first("INSERT idempotency_keys");
    const idxPurchase = first("SELECT purchase_records FOR UPDATE");
    const idxStream = first("SELECT loyalty_cycle_streams FOR UPDATE");
    const idxCycle = first("SELECT loyalty_cycles FOR UPDATE");
    const idxAccount = first("SELECT commercial_accounts FOR UPDATE");
    const idxAdmitKey = first("INSERT idempotency_keys", idxClientKey + 1);
    const idxUnit = first("INSERT verified_units");
    const idxReserve = first("INSERT commercial_ledger_entries");
    const idxAdmission = first("INSERT commercial_admissions");
    const idxBlock = first("INSERT commercial_admission_blocks");
    const idxAlloc = first("INSERT verified_unit_allocations");
    const order = [
      idxClientKey,
      idxPurchase,
      idxStream,
      idxCycle,
      idxAccount,
      idxAdmitKey,
      idxUnit,
      idxReserve,
      idxAdmission,
      idxBlock,
      idxAlloc,
    ];
    expect(
      order.every((p) => p >= 0),
      JSON.stringify({ order, trace }),
    ).toBe(true);
    expect(order, JSON.stringify(trace)).toEqual([...order].sort((a, b) => a - b));

    // Nothing locks the Commercial account before the Purchase, stream and Cycle locks.
    expect(trace.slice(0, idxCycle).some((t) => /commercial/i.test(t))).toBe(false);
    // No Reward lock, no price-schedule lock, anywhere on the path.
    expect(trace.some((t) => /SELECT rewards FOR/.test(t))).toBe(false);
    expect(trace.some((t) => /price/i.test(t))).toBe(false);
    // After the account lock, no new FOR UPDATE on any existing Loyalty row (only the account,
    // re-locked by the ledger primitive, and the idempotency row).
    const lateLocks = trace
      .slice(idxAccount + 1)
      .filter((t) => /FOR UPDATE/.test(t))
      .filter((t) => t !== "SELECT commercial_accounts FOR UPDATE");
    expect(lateLocks).toEqual([]);
  });

  it("HOLD: the lock phase runs and then NOTHING Loyalty or Commercial-reserving is written", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await record(world, 1);
    const { result, trace } = await traceStatements(() => verifyEnforced(world.customer, id));
    expect(result.outcome).toBe("pending_admission");
    for (const forbidden of [
      "INSERT verified_units",
      "INSERT loyalty_cycles",
      "INSERT verified_unit_allocations",
      "INSERT rewards",
      "INSERT trust_events",
      "INSERT notification_intents",
      "INSERT purchase_outbox",
      "INSERT commercial_ledger_entries",
      "INSERT commercial_admissions",
      "INSERT commercial_admission_blocks",
    ]) {
      expect(trace, forbidden).not.toContain(forbidden);
    }
    // Exactly one idempotency insert: the client key. The admission key is never touched.
    expect(trace.filter((t) => t === "INSERT idempotency_keys")).toHaveLength(1);
    expect(trace.filter((t) => t === "UPDATE idempotency_keys")).toHaveLength(1); // completing the client key
    // The Commercial account was locked only after Purchase, stream and Cycle.
    const iAccount = trace.indexOf("SELECT commercial_accounts FOR UPDATE");
    expect(iAccount).toBeGreaterThan(trace.indexOf("SELECT loyalty_cycles FOR UPDATE"));
    expect(trace.indexOf("SELECT loyalty_cycles FOR UPDATE")).toBeGreaterThan(
      trace.indexOf("SELECT loyalty_cycle_streams FOR UPDATE"),
    );
    expect(trace.indexOf("SELECT loyalty_cycle_streams FOR UPDATE")).toBeGreaterThan(
      trace.indexOf("SELECT purchase_records FOR UPDATE"),
    );
  });

  it("processor HOLD: writes nothing at all (no key, no row, no state change)", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId);
    const id = await record(world, 1);
    await verifyEnforced(world.customer, id);
    const { result, trace } = await traceStatements(() =>
      reevaluateOne(pool, { port, correlationId: nextId("corr") }, id),
    );
    expect(result.outcome).toBe("held");
    // The only statements are the stream's ensure-lock insert and its discard (no net row).
    const writes = trace.filter((t) => /^(INSERT|UPDATE|DELETE) /.test(t));
    expect(writes.filter((t) => !/loyalty_cycle_streams/.test(t))).toEqual([]);
    expect(await count("SELECT 1 FROM loyalty_cycle_streams")).toBe(0);
  });

  it("a Purchase inside an admitted position takes no Commercial lock and reads no Commercial row", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    admitted(await verifyEnforced(world.customer, await record(world, 1)));
    const next = await record(world, 1);
    const { result, trace } = await traceStatements(() => verifyEnforced(world.customer, next));
    expect(result.outcome).toBe("admitted");
    expect(trace.filter((t) => /commercial/i.test(t))).toEqual([]);
  });
});

// ===========================================================================
// 9. WP-COM-04 INTEGRATION (earmark-capable consumption; no change to the projector)
// ===========================================================================

describe("WP-COM-05b — WP-COM-04 consumes the admission earmark", () => {
  it("normal runtime: consumption debits exactly the earmarked bucket and releases that reservation; the fallback is not used", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    const done = admitted(await verifyEnforced(world.customer, await record(world, 10)));
    const earmark = (await listBlocksForBusiness(pool, world.businessId))[0];
    expect(earmark.fundingBucket).toBe("trial");
    // Between admission and Reward-available the balances shift every way they can.
    await post(world.businessId, "trial_adjustment", "trial", 3);
    await post(world.businessId, "credit_grant", "paid", 7);
    const projected = await projectCommercialConsumption(pool, {
      rewardId: done.reward!.id,
      correlationId: nextId("corr"),
      earmarkResolver: admissionEarmarkResolver,
    });
    expect(projected.outcome).toBe("projected");
    if (projected.outcome !== "projected") throw new Error("unreachable");
    expect(projected.event).toMatchObject({
      bucket: "trial",
      bucketSource: "earmark",
      earmarkId: earmark.id,
    });
    const a = await account(world.businessId);
    expect(a).toMatchObject({ trialRemainingUnits: 3, trialReservedUnits: 0, paidBalanceUnits: 7 });
    expect(
      await count(
        "SELECT 1 FROM commercial_consumption_events WHERE bucket_source = 'consumption_time_fallback'",
      ),
    ).toBe(0);
    await assertAccountingInvariants(world.businessId);
    // An earmark is consumed at most once.
    const again = await projectCommercialConsumption(pool, {
      rewardId: done.reward!.id,
      correlationId: nextId("corr"),
      earmarkResolver: admissionEarmarkResolver,
    });
    expect(again.outcome).toBe("already_projected");
  });

  it("a PAID earmark stays paid even if trial capacity is granted before consumption", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { paid: 1 });
    const done = admitted(await verifyEnforced(world.customer, await record(world, 10)));
    expect((await listBlocksForBusiness(pool, world.businessId))[0].fundingBucket).toBe("paid");
    await post(world.businessId, "trial_grant", "trial", 4);
    const projected = await projectCommercialConsumption(pool, {
      rewardId: done.reward!.id,
      correlationId: nextId("corr"),
      earmarkResolver: admissionEarmarkResolver,
    });
    if (projected.outcome !== "projected") throw new Error("expected projected");
    expect(projected.event.bucket).toBe("paid");
    expect(projected.event.bucketSource).toBe("earmark");
    const a = await account(world.businessId);
    expect(a).toMatchObject({ trialRemainingUnits: 4, paidBalanceUnits: 0, paidReservedUnits: 0 });
    await assertAccountingInvariants(world.businessId);
  });

  it("a multi-position Purchase's Circles consume their own earmarked buckets (per-Circle, not totals)", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1, paid: 1 });
    // 20 units on an empty stream: Circle 1 (trial) and Circle 2 (paid).
    admitted(await verifyEnforced(world.customer, await record(world, 20)));
    const rewards = await rows<{ id: string; sequence_number: number }>(
      `SELECT r.id, c.sequence_number FROM rewards r JOIN loyalty_cycles c ON c.id = r.loyalty_cycle_id
        ORDER BY c.sequence_number`,
    );
    // Only Circle 1's Reward exists (Circle 2 holds pending units). Redeem-free: consume it.
    expect(rewards.map((r) => r.sequence_number)).toEqual([1]);
    const p = await projectCommercialConsumption(pool, {
      rewardId: rewards[0].id,
      correlationId: nextId("corr"),
      earmarkResolver: admissionEarmarkResolver,
    });
    if (p.outcome !== "projected") throw new Error("expected projected");
    expect(p.event.bucket).toBe("trial");
    // The paid earmark of Circle 2 is still reserved, untouched.
    const a = await account(world.businessId);
    expect(a).toMatchObject({ trialReservedUnits: 0, paidReservedUnits: 1 });
    await assertAccountingInvariants(world.businessId);
  });

  it("the legacy/unearmarked path (a Circle admitted while the gate was OFF) still takes the flagged fallback", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    const legacy = await verifyPurchase(db, pool, {
      customerIdentityId: world.customer.customerId,
      request: { purchaseRecordId: await record(world, 10) },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(await count("SELECT 1 FROM commercial_admission_blocks")).toBe(0);
    const projected = await projectCommercialConsumption(pool, {
      rewardId: legacy.reward!.id,
      correlationId: nextId("corr"),
      earmarkResolver: admissionEarmarkResolver,
    });
    if (projected.outcome !== "projected") throw new Error("expected projected");
    expect(projected.event.bucketSource).toBe("consumption_time_fallback");
    expect(projected.event.earmarkId).toBeNull();
  });

  it("the database refuses a consumption whose bucket differs from its earmark (INV-CAP-PROV)", async () => {
    const world = await seedWorld();
    const c2 = await seedCustomer();
    await openAccount(world.businessId, { trial: 1, paid: 1 });
    const done = admitted(await verifyEnforced(world.customer, await record(world, 10)));
    admitted(await verifyEnforced(c2, await record(world, 1, { customer: c2 })));
    const blocks = await listBlocksForBusiness(pool, world.businessId);
    const trialBlock = blocks.find((b) => b.fundingBucket === "trial")!;
    const paidBlock = blocks.find((b) => b.fundingBucket === "paid")!;
    expect(trialBlock).toBeDefined();
    // A resolver that points a TRIAL debit at the PAID earmark (a re-decision at posting time).
    await expect(
      projectCommercialConsumption(pool, {
        rewardId: done.reward!.id,
        correlationId: nextId("corr"),
        earmarkResolver: async () => ({ earmarkId: paidBlock.id, bucket: "trial" }),
      }),
    ).rejects.toThrow(/must debit the bucket/);
    // Rolled back: both reservations still held, nothing consumed.
    expect(await count("SELECT 1 FROM commercial_consumption_events")).toBe(0);
    const a = await account(world.businessId);
    expect(a).toMatchObject({ trialReservedUnits: 1, paidReservedUnits: 1 });
    await assertAccountingInvariants(world.businessId);
  });
});

// ===========================================================================
// 10. SCHEMA (0027)
// ===========================================================================

describe("WP-COM-05b — migration 0027", () => {
  it("an admission cannot commit without earmarks matching its reservation", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    const id = await record(world, 1);
    // Build the pieces by hand: a Verified Unit, a reservation entry and an admission with NO earmark.
    await expect(
      withPlatformTransaction(pool, async (tx) => {
        const locked = (await lockPurchaseRecordById(tx, id))!;
        const unit = await tx.query<{ id: string }>(
          `INSERT INTO verified_units
             (purchase_record_id, business_id, customer_identity_id, reward_program_id,
              reward_program_version_id, quantity, entry_type, reason_code, correlation_id, created_by)
           VALUES ($1,$2,$3,$4,$5,1,'credit','purchase_verified','c','t') RETURNING id`,
          [
            id,
            locked.businessId,
            locked.customerIdentityId,
            locked.rewardProgramId,
            locked.rewardProgramVersionId,
          ],
        );
        const posted = await postCommercialLedgerEntry(tx, {
          businessId: world.businessId,
          entryType: "capacity_reserved",
          bucket: "trial",
          unitsDelta: 0,
          trialReservedDelta: 1,
          idempotencyScopeKey: `reserve:${unit.rows[0].id}`,
          createdBy: "t",
          correlationId: "c",
        });
        if (posted.outcome !== "posted") throw new Error("expected posted");
        await tx.query(
          `INSERT INTO commercial_admissions
             (business_id, purchase_record_id, verified_unit_id, ledger_entry_id, blocks_reserved,
              first_block_index, stream_ref, decided_by, account_version, available_before,
              reserved_before, admission_scope_key, correlation_id)
           VALUES ($1,$2,$3,$4,1,1,'s','customer_verify',1,2,0,$5,'c')`,
          [world.businessId, id, unit.rows[0].id, posted.entry.id, `admit:${id}`],
        );
      }),
    ).rejects.toThrow(/do not equal its reservation/);
  });

  it("a Circle position is earmarked exactly once (UNIQUE business/stream/index) and an earmark is consumed at most once", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 2 });
    admitted(await verifyEnforced(world.customer, await record(world, 1)));
    const block = (await listBlocksForBusiness(pool, world.businessId))[0];
    const admission = (await listAdmissionsForBusiness(pool, world.businessId))[0];
    await expect(
      pool.query(
        `INSERT INTO commercial_admission_blocks (admission_id, business_id, stream_ref, block_index, funding_bucket, correlation_id)
         VALUES ($1,$2,$3,$4,'paid','c')`,
        [admission.id, world.businessId, block.streamRef, block.blockIndex],
      ),
    ).rejects.toMatchObject({ code: "23505" });
    // Uniqueness per Purchase and per Verified Unit.
    await expect(
      pool.query(
        `INSERT INTO commercial_admissions
           (business_id, purchase_record_id, verified_unit_id, ledger_entry_id, blocks_reserved,
            first_block_index, stream_ref, decided_by, account_version, available_before,
            reserved_before, admission_scope_key, correlation_id)
         SELECT business_id, purchase_record_id, verified_unit_id, ledger_entry_id, 1, 1, 's',
                'customer_verify', 1, 0, 0, 'admit:other', 'c' FROM commercial_admissions`,
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("down fails closed while any admission or earmark exists, and round-trips when empty", async () => {
    const world = await seedWorld();
    await openAccount(world.businessId, { trial: 1 });
    admitted(await verifyEnforced(world.customer, await record(world, 1)));
    await expect(migrateDown(pool, migrationsDir, 2)).rejects.toThrow(
      /0027: refusing to roll back/,
    );
    expect(
      (
        await rows<{ t: string | null }>("SELECT to_regclass('public.commercial_admissions') AS t")
      )[0].t,
    ).not.toBeNull();
    // Empty: reset, roll back, re-apply.
    await resetAll();
    const down = await migrateDown(pool, migrationsDir, 2);
    expect(down.rolledBack).toEqual(["0028", "0027"]);
    expect(
      (
        await rows<{ t: string | null }>("SELECT to_regclass('public.commercial_admissions') AS t")
      )[0].t,
    ).toBeNull();
    const up = await migrateUp(pool, migrationsDir);
    expect(up.applied).toEqual(["0027", "0028"]);
  });
});
