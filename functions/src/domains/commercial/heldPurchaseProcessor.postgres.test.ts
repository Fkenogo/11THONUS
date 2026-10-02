/**
 * WP-COM-06a -- held-Purchase processor activation and recovery.
 *
 * Proves, on a live PostgreSQL (and the Firestore Emulator), through the REAL Commercial
 * commands, the REAL Purchase commands and the REAL canonical processor:
 *
 *  - which Commercial mutations signal, and that the signal is sent only AFTER the commit;
 *  - the mandatory post-commit gate: a failing/hanging signal never rolls the mutation back,
 *    nothing is admitted inside the Commercial transaction, recovery later admits exactly once,
 *    and duplicate signals racing the scheduler never double-admit or oversubscribe;
 *  - Business fairness (a persisted cursor reaches Business 101+), Business isolation,
 *    the 1000-row window (saturation reported, rows beyond it reached), skip-and-continue and
 *    same-stream ordering unchanged;
 *  - failure classification against REAL PostgreSQL errors and per-Purchase / per-Business
 *    isolation; another worker winning is not a failure;
 *  - observability (persisted run state, backlog) and default-OFF enablement.
 *
 * Run via:
 *
 *   firebase emulators:exec --only firestore --project demo-11thonus \
 *     "PLATFORM_ENV=test pnpm --filter functions exec vitest run --config vitest.postgres.config.ts heldPurchaseProcessor"
 */

import { randomUUID } from "node:crypto";
import { grantTrial } from "./services/grantTrial";
import { adjustTrial } from "./services/adjustTrial";
import { adjustCommercialCredit } from "./services/adjustCommercialCredit";
import { restrictNewStarts, restoreCommercialStanding } from "./services/commercialRestriction";
import { activatePaidService } from "./services/activatePaidService";
import { recordSettlement } from "./services/recordSettlement";
import { confirmSettlement } from "./services/confirmSettlement";
import { setPriceSchedule } from "./services/setPriceSchedule";
import type {
  CommercialCommandContext,
  CommercialCommandDeps,
} from "./services/commercialAdministratorCommand";
import { CommercialDomainError } from "./models/commercialErrors";
import type {
  CapacityIncreaseNotifier,
  CapacityIncreaseSignal,
} from "./models/commercialCapacitySignal";
import {
  processBusinessHeldPurchases,
  runHeldPurchaseRecovery,
  type BusinessPassSummary,
  type HeldPurchaseProcessorDeps,
  type HeldPurchaseRecoveryStateStore,
} from "../purchase/services/heldPurchaseRecovery";
import { classifyAdmissionFailure } from "../purchase/services/admissionFailureClassification";
import { purchaseStaleStateError } from "../purchase/models/purchaseErrors";
import {
  getHeldPurchaseBacklog,
  listPendingAdmissionWindow,
  type PendingScanCursor,
} from "../purchase/repositories/heldPurchaseRecoveryRepository";
import {
  SIGNAL_COALESCING_WINDOW_MS,
  admissionSignalDocumentId,
  createAdmissionSignalNotifier,
  handleAdmissionSignal,
  isHeldPurchaseProcessorEnabled,
  runHeldPurchaseRecoveryJob,
} from "../../composition/heldPurchaseProcessorWiring";

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import path from "node:path";
import { readFileSync } from "node:fs";
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
import { migrateUp } from "../../infrastructure/postgres/migrationRunner";
import { withPlatformTransaction } from "../../infrastructure/postgres/postgresTransaction";
import { createRewardProgram } from "../rewardProgram/services/createRewardProgramCommand";
import { publishRewardProgramVersion } from "../rewardProgram/services/publishRewardProgramVersionCommand";
import { insertQualifyingItem } from "../qualifyingItem/repositories/qualifyingItemRepository";
import { recordPurchase } from "../purchase/services/recordPurchaseCommand";
import {
  verifyPurchase,
  type VerifyPurchaseResult,
} from "../purchase/services/verifyPurchaseCommand";
import { reevaluatePendingAdmissions } from "../purchase/services/reevaluatePendingAdmissions";
import { type PurchaseAdmissionCapacityPort } from "../purchase/services/purchaseAdmissionPort";
import { createCommercialAdmissionPort } from "../../composition/commercialAdmissionBinding";
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
import {
  availableCapacity,
  type CommercialBucket,
  type CommercialLedgerEntryType,
} from "./models/commercialFoundation";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "..", "infrastructure", "postgres", "migrations");

const app = initializeApp({ projectId: "demo-11thonus" }, "commercialAdmissionTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;
// Suites after this one (`platformFoundationReadiness`, ...) expect the empty database the Commercial
// suites leave behind: when this suite started on an empty database it leaves it empty again.
let startedFromEmptyDatabase = false;
const port = createCommercialAdmissionPort();

let seq = 0;
let customerSeq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

function lnFor(i: number): string {
  // 512 distinct values (the shared 05b helper only yields 8, too few for multi-Business scenarios).
  const d = (n: number) => String(2 + (((n % 8) + 8) % 8));
  return `CAD${d(i >> 6)}${d(i >> 3)}${d(i)}`;
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
      "DELETE FROM schema_migrations WHERE version IN ('0021', '0022', '0023', '0024', '0025', '0026', '0027')",
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
  const existing = await pool.query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'",
  );
  startedFromEmptyDatabase = existing.rows[0].n === 0;
  await dropCommercialObjects(); // tolerate leftovers from a previous suite on a reused database
  await migrateUp(pool, migrationsDir);
}, 120000);

afterAll(async () => {
  await resetAll();
  if (startedFromEmptyDatabase) {
    await pool.query("DROP SCHEMA public CASCADE");
    await pool.query("CREATE SCHEMA public");
  }
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

// ===========================================================================
// WP-COM-06a -- activation and recovery
// ===========================================================================

const ADMIN = "founder-uid";
const tsOf = (iso: string) => ({ toDate: () => new Date(iso) });
const adminRecord = {
  roles: ["knowledge_editor"],
  status: "active",
  mfaRequired: true,
  invitedBy: "founder",
  createdAt: tsOf("2026-01-01T00:00:00Z"),
  updatedAt: tsOf("2026-01-01T00:00:00Z"),
  schemaVersion: 1,
};
const NOW = new Date("2026-07-01T00:00:00Z");
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const noSleep = async () => {};

function cmdDeps(
  notifier?: CapacityIncreaseNotifier,
  extra: Partial<CommercialCommandDeps> = {},
): CommercialCommandDeps {
  return {
    pool,
    readAdministratorRecord: async (uid) => (uid === ADMIN ? adminRecord : undefined),
    now: () => NOW,
    ...(notifier ? { capacityIncreaseNotifier: notifier } : {}),
    ...extra,
  };
}
const ctx = (idempotencyKey = `wpcom06a-${randomUUID()}`): CommercialCommandContext => ({
  adminUserId: ADMIN,
  verifiedMfaSatisfied: true,
  idempotencyKey,
  correlationId: nextId("corr06a"),
});

type NotifierBehaviour = {
  fail?: boolean;
  hangMs?: number;
  /** Runs inside `notify`, i.e. strictly after the command's transaction committed. */
  probe?: (signal: CapacityIncreaseSignal) => Promise<void>;
};
function recordingNotifier(behaviour: NotifierBehaviour = {}) {
  const calls: CapacityIncreaseSignal[] = [];
  const notifier: CapacityIncreaseNotifier = {
    async notify(signal) {
      calls.push(signal);
      await behaviour.probe?.(signal);
      if (behaviour.hangMs) await sleep(behaviour.hangMs);
      if (behaviour.fail) throw new Error("firestore unavailable");
    },
  };
  return { notifier, calls };
}

beforeEach(async () => {
  // Commercial objects are re-created for every test (see `resetAll`); settlements need a price.
  await setPriceSchedule({ ...cmdDeps(), now: () => new Date("2026-02-01T00:00:00Z") }, ctx(), {
    market: "RW",
    currency: "RWF",
    localUnitPriceMinor: 1500, // TEST-ONLY, never a launch price
    effectiveFrom: new Date("2026-03-01T00:00:00Z"),
    reasonText: "test fixture",
  });
});

/** In-memory continuation store (the Firestore implementation is covered by the emulator suite). */
function memoryStore(): HeldPurchaseRecoveryStateStore & {
  businessCursor: string | null;
  tails: Map<string, PendingScanCursor>;
} {
  const store = {
    businessCursor: null as string | null,
    tails: new Map<string, PendingScanCursor>(),
    async getBusinessCursor() {
      return store.businessCursor;
    },
    async setBusinessCursor(c: string | null) {
      store.businessCursor = c;
    },
    async getTailCursor(id: string) {
      return store.tails.get(id) ?? null;
    },
    async setTailCursor(id: string, c: PendingScanCursor | null) {
      if (c === null) store.tails.delete(id);
      else store.tails.set(id, c);
    },
  };
  return store;
}

function processorDeps(
  overrides: Partial<HeldPurchaseProcessorDeps> = {},
): HeldPurchaseProcessorDeps & { store: ReturnType<typeof memoryStore> } {
  const store = memoryStore();
  return { pool, port, store, sleep: noSleep, ...overrides } as HeldPurchaseProcessorDeps & {
    store: ReturnType<typeof memoryStore>;
  };
}

/** A Business with a (zero-capacity) Commercial account. */
async function businessWithAccount(grants: { trial?: number; paid?: number } = {}) {
  const world = await seedWorld();
  await openAccount(world.businessId, grants);
  return world;
}

/** Records a Purchase for a fresh Customer (own stream) and verifies it into the held state. */
async function hold(world: World, quantity: number, hour: number): Promise<string> {
  const customer = await seedCustomer();
  const id = await record(world, quantity, { customer, hour });
  await verifyEnforced(customer, id);
  expect(await purchaseStatus(id)).toBe("pending_admission");
  return id;
}

const admissionCount = (businessId: string) =>
  count("SELECT 1 FROM commercial_admissions WHERE business_id = $1", [businessId]);

describe("WP-COM-06a trigger semantics -- post-commit, eligibility-gated", () => {
  it("confirmSettlement signals ONCE, AFTER the transaction committed, and nothing was admitted inside it", async () => {
    const world = await businessWithAccount();
    const heldId = await hold(world, 1, 10);
    const { notifier, calls } = recordingNotifier({
      probe: async (signal) => {
        // Observed from a different connection: the credit is already visible (committed) ...
        const paid = await rows<{ paid_balance_units: number }>(
          "SELECT paid_balance_units FROM commercial_accounts WHERE business_id = $1",
          [signal.businessId],
        );
        expect(paid[0].paid_balance_units).toBe(3);
        // ... and the command's transaction admitted nothing.
        expect(await purchaseStatus(heldId)).toBe("pending_admission");
        expect(await admissionCount(signal.businessId)).toBe(0);
      },
    });
    const rec = await recordSettlement(cmdDeps(), ctx(), {
      businessId: world.businessId,
      method: "bank_transfer",
      externalReference: `ref-${randomUUID()}`,
      currency: "RWF",
      amountMinor: 3 * 1500,
      unitsPurchased: 3,
      receivedAt: new Date("2026-04-01T00:00:00Z"),
      reasonText: "received offline",
    });
    await confirmSettlement(cmdDeps(notifier), ctx(), {
      businessId: world.businessId,
      settlementId: rec.result.settlementId,
      confirmationNote: "verified",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      businessId: world.businessId,
      reason: "settlement_confirmed",
    });
    expect(await purchaseStatus(heldId)).toBe("pending_admission");
  });

  it("grantTrial signals trial_granted", async () => {
    const world = await businessWithAccount();
    const { notifier, calls } = recordingNotifier();
    await grantTrial(cmdDeps(notifier), ctx(), {
      businessId: world.businessId,
      units: 3,
      reasonText: "onboarding",
      reference: "REF",
    });
    expect(calls.map((c) => c.reason)).toEqual(["trial_granted"]);
  });

  it("adjustTrial signals ONLY for a positive delta", async () => {
    const world = await businessWithAccount({ trial: 3 });
    const { notifier, calls } = recordingNotifier();
    const base = { businessId: world.businessId, reasonText: "fix", reference: "REF" };
    await adjustTrial(cmdDeps(notifier), ctx(), { ...base, unitsDelta: -1 });
    expect(calls).toHaveLength(0);
    await adjustTrial(cmdDeps(notifier), ctx(), { ...base, unitsDelta: 2 });
    expect(calls.map((c) => c.reason)).toEqual(["trial_adjusted_up"]);
  });

  it("adjustCommercialCredit signals ONLY for a positive delta", async () => {
    const world = await businessWithAccount({ paid: 5 });
    const { notifier, calls } = recordingNotifier();
    const base = {
      businessId: world.businessId,
      reasonCode: "correction",
      reasonText: "fix",
      reference: "REF",
    };
    await adjustCommercialCredit(cmdDeps(notifier), ctx(), { ...base, unitsDelta: -2 });
    expect(calls).toHaveLength(0);
    await adjustCommercialCredit(cmdDeps(notifier), ctx(), { ...base, unitsDelta: 4 });
    expect(calls.map((c) => c.reason)).toEqual(["credit_adjusted_up"]);
  });

  it("restoreCommercialStanding signals; restricting, and a refused no-op restore, do not", async () => {
    const world = await businessWithAccount();
    const { notifier, calls } = recordingNotifier();
    await restrictNewStarts(cmdDeps(notifier), ctx(), {
      businessId: world.businessId,
      reasonText: "unpaid",
      reference: "REF",
    });
    expect(calls).toHaveLength(0);
    await restoreCommercialStanding(cmdDeps(notifier), ctx(), {
      businessId: world.businessId,
      reasonText: "paid",
    });
    expect(calls.map((c) => c.reason)).toEqual(["standing_restored"]);
    await expect(
      restoreCommercialStanding(cmdDeps(notifier), ctx(), {
        businessId: world.businessId,
        reasonText: "again",
      }),
    ).rejects.toBeInstanceOf(CommercialDomainError);
    expect(calls).toHaveLength(1);
  });

  it("activatePaidService does NOT signal: it changes no input of the admission decision", async () => {
    const world = await businessWithAccount();
    const { notifier, calls } = recordingNotifier();
    const rec = await recordSettlement(cmdDeps(), ctx(), {
      businessId: world.businessId,
      method: "cash",
      externalReference: `ref-${randomUUID()}`,
      currency: "RWF",
      amountMinor: 3 * 1500,
      unitsPurchased: 3,
      receivedAt: new Date("2026-04-01T00:00:00Z"),
      reasonText: "received offline",
    });
    await confirmSettlement(cmdDeps(), ctx(), {
      businessId: world.businessId,
      settlementId: rec.result.settlementId,
      confirmationNote: "ok",
    });
    const before = await account(world.businessId);
    await activatePaidService(cmdDeps(notifier), ctx(), {
      businessId: world.businessId,
      reasonText: "go live",
    });
    const after = await account(world.businessId);
    expect(calls).toHaveLength(0);
    // Proof of "no effect on eligibility": every decision input is unchanged.
    expect(availableCapacity(after)).toBe(availableCapacity(before));
    expect(after.serviceRestriction).toBe(before.serviceRestriction);
    expect(after.paidBalanceUnits).toBe(before.paidBalanceUnits);
    expect(after.trialRemainingUnits).toBe(before.trialRemainingUnits);
    // And the admission decision source never reads it.
    const decision = readFileSync(path.join(__dirname, "models", "commercialAdmission.ts"), "utf8");
    expect(decision).not.toMatch(/paidServiceActivatedAt/);
  });

  it("a rejected command (nothing committed) signals nothing", async () => {
    const world = await businessWithAccount();
    const { notifier, calls } = recordingNotifier();
    await expect(
      confirmSettlement(cmdDeps(notifier), ctx(), {
        businessId: world.businessId,
        settlementId: randomUUID(),
        confirmationNote: "x",
      }),
    ).rejects.toBeInstanceOf(CommercialDomainError);
    expect(calls).toHaveLength(0);
  });

  it("an idempotent replay re-signals (a retry after a lost signal self-heals) without a second credit", async () => {
    const world = await businessWithAccount();
    const { notifier, calls } = recordingNotifier();
    const key = `wpcom06a-${randomUUID()}`;
    const run = () =>
      grantTrial(cmdDeps(notifier), ctx(key), {
        businessId: world.businessId,
        units: 4,
        reasonText: "onboarding",
        reference: "REF",
      });
    const first = await run();
    const second = await run();
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(calls).toHaveLength(2);
    expect((await account(world.businessId)).trialRemainingUnits).toBe(4);
  });

  it("without a notifier the commands behave exactly as before", async () => {
    const world = await businessWithAccount();
    const res = await grantTrial(cmdDeps(), ctx(), {
      businessId: world.businessId,
      units: 3,
      reasonText: "onboarding",
      reference: "REF",
    });
    expect(res.result.units).toBe(3);
  });
});

describe("WP-COM-06a post-commit failure safety (mandatory gate)", () => {
  async function recordedSettlementOf(world: World, units: number) {
    const rec = await recordSettlement(cmdDeps(), ctx(), {
      businessId: world.businessId,
      method: "bank_transfer",
      externalReference: `ref-${randomUUID()}`,
      currency: "RWF",
      amountMinor: units * 1500,
      unitsPurchased: units,
      receivedAt: new Date("2026-04-01T00:00:00Z"),
      reasonText: "received offline",
    });
    return rec.result.settlementId;
  }

  it("signal FAILS -> the settlement stays committed, nothing is admitted in its transaction, recovery later admits exactly once", async () => {
    const world = await businessWithAccount();
    const heldId = await hold(world, 1, 10);
    const settlementId = await recordedSettlementOf(world, 3);
    const { notifier, calls } = recordingNotifier({ fail: true });

    const confirmed = await confirmSettlement(cmdDeps(notifier), ctx(), {
      businessId: world.businessId,
      settlementId,
      confirmationNote: "verified",
    });

    // The command succeeded and the mutation is durable even though the signal failed.
    expect(confirmed.result.status).toBe("confirmed");
    expect(calls).toHaveLength(1);
    expect(
      (
        await rows<{ status: string }>("SELECT status FROM commercial_settlements WHERE id = $1", [
          settlementId,
        ])
      )[0].status,
    ).toBe("confirmed");
    expect((await account(world.businessId)).paidBalanceUnits).toBe(3);
    // No partial admission: the held Purchase is untouched and no Commercial/Loyalty row exists.
    expect(await purchaseStatus(heldId)).toBe("pending_admission");
    expect(await commercialFootprint(world.businessId)).toEqual({
      admissions: 0,
      earmarks: 0,
      reservations: 0,
      admitKeys: 0,
    });

    // Periodic recovery compensates for the lost signal.
    const run = await runHeldPurchaseRecovery(processorDeps(), { correlationId: "rec-1" });
    expect(run.status).toBe("succeeded");
    expect(run.admittedFromPending).toBe(1);
    expect(await purchaseStatus(heldId)).toBe("verified");
    expect(await commercialFootprint(world.businessId)).toMatchObject({
      admissions: 1,
      earmarks: 1,
      reservations: 1,
    });
    // A second sweep is a no-op (exactly once).
    const again = await runHeldPurchaseRecovery(processorDeps(), { correlationId: "rec-2" });
    expect(again.admittedFromPending).toBe(0);
    expect(await admissionCount(world.businessId)).toBe(1);
    await assertAccountingInvariants(world.businessId);
  });

  it.each([
    ["grantTrial", "trial"],
    ["adjustTrial", "trial"],
    ["adjustCommercialCredit", "paid"],
    ["restoreCommercialStanding", "restriction"],
  ] as const)("%s: a failing signal cannot roll back the mutation", async (command, kind) => {
    const world = await businessWithAccount({ trial: 3, paid: 3 });
    const { notifier } = recordingNotifier({ fail: true });
    const deps = cmdDeps(notifier);
    const before = await account(world.businessId);
    if (command === "grantTrial") {
      await grantTrial(deps, ctx(), {
        businessId: world.businessId,
        units: 5,
        reasonText: "x",
        reference: "R",
      });
    } else if (command === "adjustTrial") {
      await adjustTrial(deps, ctx(), {
        businessId: world.businessId,
        unitsDelta: 2,
        reasonText: "x",
        reference: "R",
      });
    } else if (command === "adjustCommercialCredit") {
      await adjustCommercialCredit(deps, ctx(), {
        businessId: world.businessId,
        unitsDelta: 2,
        reasonCode: "correction",
        reasonText: "x",
        reference: "R",
      });
    } else {
      await restrictNewStarts(cmdDeps(), ctx(), {
        businessId: world.businessId,
        reasonText: "x",
        reference: "R",
      });
      await restoreCommercialStanding(deps, ctx(), {
        businessId: world.businessId,
        reasonText: "x",
      });
    }
    const after = await account(world.businessId);
    if (kind === "trial")
      expect(after.trialRemainingUnits).toBeGreaterThan(before.trialRemainingUnits);
    if (kind === "paid") expect(after.paidBalanceUnits).toBe(before.paidBalanceUnits + 2);
    if (kind === "restriction") expect(after.serviceRestriction).toBe("none");
    await assertAccountingInvariants(world.businessId);
  });

  it("a notifier that never answers cannot hold the command beyond its bound; the mutation stands", async () => {
    const world = await businessWithAccount();
    const { notifier } = recordingNotifier({ hangMs: 5000 });
    const started = Date.now();
    const res = await grantTrial(cmdDeps(notifier, { capacitySignalTimeoutMs: 150 }), ctx(), {
      businessId: world.businessId,
      units: 3,
      reasonText: "x",
      reference: "R",
    });
    expect(Date.now() - started).toBeLessThan(2500);
    expect(res.result.units).toBe(3);
    expect((await account(world.businessId)).trialRemainingUnits).toBe(3);
  });

  it("duplicate signals racing the scheduler admit each Purchase exactly once and never oversubscribe", async () => {
    const world = await businessWithAccount();
    const ids = [
      await hold(world, 1, 8),
      await hold(world, 1, 9),
      await hold(world, 1, 10),
      await hold(world, 1, 11),
    ];
    await post(world.businessId, "credit_grant", "paid", 2); // capacity for exactly two
    const results = await Promise.all([
      processBusinessHeldPurchases(processorDeps(), {
        businessId: world.businessId,
        trigger: "signal",
        correlationId: "sig-a",
      }),
      processBusinessHeldPurchases(processorDeps(), {
        businessId: world.businessId,
        trigger: "signal",
        correlationId: "sig-b",
      }),
      runHeldPurchaseRecovery(processorDeps(), { correlationId: "rec-race" }),
    ]);
    const statuses = await Promise.all(ids.map(purchaseStatus));
    expect(statuses.filter((s) => s === "verified")).toHaveLength(2);
    expect(statuses.slice(0, 2)).toEqual(["verified", "verified"]); // FIFO: oldest two
    expect(await admissionCount(world.businessId)).toBe(2);
    expect(
      await count("SELECT 1 FROM verified_units WHERE business_id = $1", [world.businessId]),
    ).toBe(2);
    // Losing the race is not a failure.
    for (const r of results) {
      if ("head" in r) {
        expect(r.head.failedTransient + r.head.failedPermanent).toBe(0);
      } else {
        expect(r.failedTransient + r.failedPermanent).toBe(0);
        expect(r.status).toBe("succeeded");
      }
    }
    await assertAccountingInvariants(world.businessId);
    expect((await account(world.businessId)).paidReservedUnits).toBe(2);
  });
});

describe("WP-COM-06a Business fairness and isolation", () => {
  it("a bounded run walks the Businesses in stable order via a persisted cursor, wraps, and reaches every Business", async () => {
    const worlds = [];
    for (let i = 0; i < 5; i += 1) {
      const w = await businessWithAccount(); // zero capacity: stays held every run
      await hold(w, 1, 10);
      worlds.push(w);
    }
    const sorted = worlds.map((w) => w.businessId).sort();
    const deps = processorDeps({ maxBusinesses: 2 });
    const examined: string[][] = [];
    const summaries = [];
    for (let run = 0; run < 3; run += 1) {
      const seen: string[] = [];
      const observed = {
        ...deps,
        observer: { businessPass: (s: BusinessPassSummary) => void seen.push(s.businessId) },
      };
      summaries.push(await runHeldPurchaseRecovery(observed, { correlationId: `fair-${run}` }));
      examined.push(seen);
    }
    expect(examined).toEqual([sorted.slice(0, 2), sorted.slice(2, 4), sorted.slice(4)]);
    expect(new Set(examined.flat()).size).toBe(5); // nobody starved
    expect(summaries[2].wrapped).toBe(true);
    expect(deps.store.businessCursor).toBeNull();
    // The next run starts from the beginning again (fair rotation).
    const seen4: string[] = [];
    await runHeldPurchaseRecovery(
      {
        ...deps,
        observer: { businessPass: (s: BusinessPassSummary) => void seen4.push(s.businessId) },
      },
      { correlationId: "fair-3" },
    );
    expect(seen4).toEqual(sorted.slice(0, 2));
  });

  it("with the DEFAULT 100-Business bound, Businesses 101+ are reached on the next run", async () => {
    const client = await pool.connect();
    const ids: string[] = [];
    try {
      await client.query("SET session_replication_role = replica"); // seed rows only; FKs not under test
      const program = randomUUID();
      for (let i = 0; i < 105; i += 1) {
        const businessId = `fair_${String(i).padStart(3, "0")}`;
        ids.push(businessId);
        await client.query(
          `INSERT INTO purchase_records
             (business_id, customer_identity_id, presented_artifact_type, presented_artifact_reference,
              canonical_loyalty_number_value, reward_program_id, reward_program_version_id,
              shared_loyalty_number_allowed, multiple_units_allowed, branch_id, recorded_by_user_id,
              recorded_by_role, quantity, item_label, purchase_date, status, correlation_id)
           VALUES ($1,$2,'loyalty_number','x','LN',$3,$3,true,true,'b','u','owner',1,'i',
                   '2026-09-28T10:00:00Z','pending_admission','seed')`,
          [businessId, `cust_${i}`, program],
        );
      }
    } finally {
      client.release();
    }
    const examined = new Set<string>();
    const deps = processorDeps({
      port: createCommercialAdmissionPort(),
      observer: { businessPass: (s: BusinessPassSummary) => void examined.add(s.businessId) },
    });
    const run1 = await runHeldPurchaseRecovery(deps, { correlationId: "100-a" });
    expect(run1.businessesExamined).toBe(100);
    expect(run1.cursorEnd).toBe(ids[99]);
    expect(run1.wrapped).toBe(false);
    expect(examined.size).toBe(100);
    expect(examined.has(ids[100])).toBe(false);
    const run2 = await runHeldPurchaseRecovery(deps, { correlationId: "100-b" });
    expect(run2.businessesExamined).toBe(5);
    expect(run2.wrapped).toBe(true);
    expect(run2.cursorEnd).toBeNull();
    expect([...examined].sort()).toEqual(ids); // all 105, none starved
    // Seed Businesses have no Commercial account: each Purchase is cleanly HELD (not_established).
    expect(run1.stillHeld).toBe(100);
    expect(run2.stillHeld).toBe(5);
    expect(run1.status).toBe("succeeded");
    expect(run2.status).toBe("succeeded");
  }, 120000);

  it("one failing Business does not poison the run or the other Businesses", async () => {
    const bad = await businessWithAccount({ paid: 5 });
    const good = await businessWithAccount({ paid: 5 });
    // `bad` and `good` already hold capacity, so hold them first by seeding at zero then granting.
    await pool.query("SELECT 1"); // (accounts above start funded; purchases below are verified live)
    // Make both Businesses' Purchases held: restrict, hold, then restore capacity.
    for (const w of [bad, good]) await setRestriction(w.businessId, true);
    const badId = await hold(bad, 1, 10);
    const goodId = await hold(good, 1, 10);
    for (const w of [bad, good]) await setRestriction(w.businessId, false);
    const failingPort: PurchaseAdmissionCapacityPort = {
      ...port,
      evaluate: (tx, input) => {
        if (input.businessId === bad.businessId) {
          throw Object.assign(new Error("check violated"), { code: "23514" });
        }
        return port.evaluate(tx, input);
      },
    };
    const run = await runHeldPurchaseRecovery(processorDeps({ port: failingPort }), {
      correlationId: "iso",
    });
    expect(run.status).toBe("partial");
    expect(run.failedPermanent).toBe(1);
    expect(run.admittedFromPending).toBe(1);
    expect(await purchaseStatus(goodId)).toBe("verified");
    expect(await purchaseStatus(badId)).toBe("pending_admission");
    // The failing Business is retried (not parked) by the next run, and recovers once fixed.
    const healed = await runHeldPurchaseRecovery(processorDeps(), { correlationId: "iso-2" });
    expect(healed.admittedFromPending).toBe(1);
    expect(await purchaseStatus(badId)).toBe("verified");
  });
});

describe("WP-COM-06a scan windows", () => {
  it("rows beyond the 05b window were unreachable; the rotating tail window now reaches them (head FIFO untouched)", async () => {
    const world = await businessWithAccount();
    // Three LARGE older Purchases (3 Circle positions each) fill the head window and cannot fit.
    const large = [await hold(world, 30, 5), await hold(world, 30, 6), await hold(world, 30, 7)];
    // Two SMALL younger Purchases sit BEYOND a 3-row window and would fit.
    const small = [await hold(world, 1, 8), await hold(world, 1, 9)];
    await post(world.businessId, "credit_grant", "paid", 2);

    // 05b alone with a 3-row window: it keeps re-examining the same head rows, forever.
    const plain = await reevaluatePendingAdmissions(pool, {
      businessId: world.businessId,
      port,
      correlationId: "05b-only",
      maxPerBusiness: 3,
    });
    expect(plain.admittedCount).toBe(0);
    expect(plain.businesses[0]).toMatchObject({ examined: 3, saturated: true });
    expect(await purchaseStatus(small[0])).toBe("pending_admission");

    // WP-COM-06a: head (same 3 rows, same FIFO order) + one tail window beyond it.
    const deps = processorDeps({ maxPerBusiness: 3 });
    const pass = await processBusinessHeldPurchases(deps, {
      businessId: world.businessId,
      trigger: "recovery",
      correlationId: "06a",
    });
    expect(pass.headSaturated).toBe(true);
    expect(pass.head).toMatchObject({ examined: 3, admitted: 0, held: 3, saturated: true });
    expect(pass.tail).toMatchObject({ examined: 2, admitted: 2, saturated: false });
    expect(await Promise.all(small.map(purchaseStatus))).toEqual(["verified", "verified"]);
    expect(await Promise.all(large.map(purchaseStatus))).toEqual(
      Array(3).fill("pending_admission"),
    );
    // Tail exhausted -> wrapped (cursor cleared); nothing left beyond the head.
    expect(deps.store.tails.size).toBe(0);
    await assertAccountingInvariants(world.businessId);
  });

  it("a tail cursor advances window by window and wraps; the saturation is reported", async () => {
    const world = await businessWithAccount(); // zero capacity: everything stays held
    for (let h = 5; h < 12; h += 1) await hold(world, 1, h); // 7 held Purchases
    const deps = processorDeps({ maxPerBusiness: 2 });
    const tailExamined: Array<number | undefined> = [];
    const tailCursorStored: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const pass = await processBusinessHeldPurchases(deps, {
        businessId: world.businessId,
        trigger: "recovery",
        correlationId: `tail-${i}`,
      });
      expect(pass.headSaturated).toBe(true); // reported on every pass
      tailExamined.push(pass.tail?.examined);
      tailCursorStored.push(deps.store.tails.size);
    }
    // 7 held rows, window 2. Every pass re-examines the head (rows 1-2) first, then:
    //   pass 1: rows 3-4 (cursor kept) | pass 2: rows 5-6 (cursor kept)
    //   pass 3: row 7, end reached -> cursor cleared (wrap) | pass 4: starts over at rows 3-4.
    expect(tailExamined).toEqual([2, 2, 1, 2]);
    expect(tailCursorStored).toEqual([1, 1, 0, 1]);
  });

  it("repository window arithmetic is exact at the default 1000 boundary, with tied timestamps", async () => {
    const client = await pool.connect();
    const businessId = "window_biz";
    try {
      await client.query("SET session_replication_role = replica");
      await client.query(
        `INSERT INTO purchase_records
           (business_id, customer_identity_id, presented_artifact_type, presented_artifact_reference,
            canonical_loyalty_number_value, reward_program_id, reward_program_version_id,
            shared_loyalty_number_allowed, multiple_units_allowed, branch_id, recorded_by_user_id,
            recorded_by_role, quantity, item_label, purchase_date, status, correlation_id)
         SELECT $1, 'c'||g, 'loyalty_number','x','LN', gen_random_uuid(), gen_random_uuid(),
                true,true,'b','u','owner',1,'i','2026-09-28T10:00:00.123456Z','pending_admission','seed'
           FROM generate_series(1, 1003) g`,
        [businessId],
      );
    } finally {
      client.release();
    }
    const head = await listPendingAdmissionWindow(pool, { businessId, limit: 1000, after: null });
    expect(head.rows).toHaveLength(1000);
    expect(head.hasMore).toBe(true); // saturated
    const tail = await listPendingAdmissionWindow(pool, {
      businessId,
      limit: 1000,
      after: head.rows[999].cursor,
    });
    expect(tail.rows).toHaveLength(3);
    expect(tail.hasMore).toBe(false);
    const all = [...head.rows, ...tail.rows].map((r) => r.id);
    expect(new Set(all).size).toBe(1003); // no gaps, no duplicates, ties broken by id
    expect(all).toEqual([...all].sort());
    // Microsecond precision survives the cursor round-trip.
    expect(head.rows[0].cursor.purchaseDate).toContain(".123456");
    const backlog = await getHeldPurchaseBacklog(pool, { topBusinesses: 5, windowLimit: 1000 });
    expect(backlog).toMatchObject({
      totalPending: 1003,
      businessesWithPending: 1,
      businessesOverWindow: 1,
    });
    expect(backlog.topBusinesses[0]).toMatchObject({ businessId, pending: 1003 });
  }, 60000);

  it("skip-and-continue and same-stream ordering are unchanged: a large Purchase never blocks a smaller later one, a stream is never overtaken", async () => {
    const world = await businessWithAccount();
    const largeId = await hold(world, 30, 5); // 3 positions, cannot fit
    const smallId = await hold(world, 1, 6); // 1 position
    // Same stream: an OLDER held Purchase must be admitted before a younger one of its stream.
    const streamCustomer = await seedCustomer();
    const s1 = await record(world, 30, { customer: streamCustomer, hour: 7 });
    await verifyEnforced(streamCustomer, s1);
    const s2 = await record(world, 1, { customer: streamCustomer, hour: 8 });
    await verifyEnforced(streamCustomer, s2);
    await post(world.businessId, "credit_grant", "paid", 1);
    const run = await runHeldPurchaseRecovery(processorDeps(), { correlationId: "skip" });
    expect(await purchaseStatus(smallId)).toBe("verified"); // skipped past `largeId`
    expect(await purchaseStatus(largeId)).toBe("pending_admission");
    expect(await purchaseStatus(s2)).toBe("pending_admission"); // behind its own stream's s1
    expect(run.skippedForCapacity).toBeGreaterThanOrEqual(1);
    // The large Purchase was skipped while a younger one was admitted: the starvation indicator.
    expect(run.skippedOvertaken).toBeGreaterThanOrEqual(1);
  });
});

describe("WP-COM-06a failure classification", () => {
  it("classifies REAL PostgreSQL errors: deadlock, lock timeout, statement timeout, serialization, constraint", async () => {
    await pool.query("CREATE TEMP TABLE IF NOT EXISTS _cls_probe_never_used (a int)");
    await pool.query("DROP TABLE IF EXISTS cls_probe");
    await pool.query("CREATE TABLE cls_probe (id int PRIMARY KEY, v int)");
    await pool.query("INSERT INTO cls_probe VALUES (1,0),(2,0)");
    const codeOf = async (fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (e) {
        return classifyAdmissionFailure(e);
      }
      throw new Error("expected a database error");
    };
    try {
      // constraint violation (23505) -> permanent
      expect(await codeOf(() => pool.query("INSERT INTO cls_probe VALUES (1,1)"))).toEqual({
        failureClass: "permanent",
        code: "CONSTRAINT_23505",
      });
      // statement timeout (57014) -> transient
      expect(
        await codeOf(async () => {
          const c = await pool.connect();
          try {
            await c.query("SET statement_timeout = 50");
            await c.query("SELECT pg_sleep(2)");
          } finally {
            await c.query("RESET statement_timeout").catch(() => {});
            c.release();
          }
        }),
      ).toEqual({ failureClass: "transient", code: "STATEMENT_TIMEOUT" });
      // lock timeout (55P03) -> transient
      const holder = await pool.connect();
      try {
        await holder.query("BEGIN");
        await holder.query("SELECT * FROM cls_probe WHERE id = 1 FOR UPDATE");
        expect(
          await codeOf(async () => {
            const c = await pool.connect();
            try {
              await c.query("SET lock_timeout = 80");
              await c.query("SELECT * FROM cls_probe WHERE id = 1 FOR UPDATE");
            } finally {
              await c.query("RESET lock_timeout").catch(() => {});
              c.release();
            }
          }),
        ).toEqual({ failureClass: "transient", code: "LOCK_NOT_AVAILABLE" });
      } finally {
        await holder.query("ROLLBACK");
        holder.release();
      }
      // serialization failure (40001) -> transient
      const a = await pool.connect();
      const b = await pool.connect();
      try {
        await a.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
        await a.query("SELECT v FROM cls_probe WHERE id = 1");
        await b.query("UPDATE cls_probe SET v = 1 WHERE id = 1");
        expect(await codeOf(() => a.query("UPDATE cls_probe SET v = 2 WHERE id = 1"))).toEqual({
          failureClass: "transient",
          code: "SERIALIZATION_FAILURE",
        });
      } finally {
        await a.query("ROLLBACK").catch(() => {});
        a.release();
        b.release();
      }
      // deadlock (40P01) -> transient
      const x = await pool.connect();
      const y = await pool.connect();
      try {
        await x.query("BEGIN");
        await y.query("BEGIN");
        await x.query("SELECT * FROM cls_probe WHERE id = 1 FOR UPDATE");
        await y.query("SELECT * FROM cls_probe WHERE id = 2 FOR UPDATE");
        const settled = await Promise.allSettled([
          x.query("SELECT * FROM cls_probe WHERE id = 2 FOR UPDATE"),
          (async () => {
            await sleep(100);
            return y.query("SELECT * FROM cls_probe WHERE id = 1 FOR UPDATE");
          })(),
        ]);
        const failed = settled.find((s) => s.status === "rejected") as PromiseRejectedResult;
        expect(classifyAdmissionFailure(failed.reason)).toEqual({
          failureClass: "transient",
          code: "DEADLOCK_DETECTED",
        });
      } finally {
        await x.query("ROLLBACK").catch(() => {});
        await y.query("ROLLBACK").catch(() => {});
        x.release();
        y.release();
      }
    } finally {
      await pool.query("DROP TABLE IF EXISTS cls_probe");
    }
  }, 30000);

  it("a TRANSIENT failure is retried in-run and the Purchase is admitted (not counted as failed)", async () => {
    const world = await businessWithAccount();
    const heldId = await hold(world, 1, 10);
    await post(world.businessId, "credit_grant", "paid", 1);
    let calls = 0;
    const flaky: PurchaseAdmissionCapacityPort = {
      ...port,
      evaluate: (tx, input) => {
        calls += 1;
        if (calls === 1) throw Object.assign(new Error("deadlock detected"), { code: "40P01" });
        return port.evaluate(tx, input);
      },
    };
    const pass = await processBusinessHeldPurchases(processorDeps({ port: flaky }), {
      businessId: world.businessId,
      trigger: "signal",
      correlationId: "retry",
    });
    expect(pass.head).toMatchObject({ admitted: 1, failedTransient: 0, failedPermanent: 0 });
    expect(calls).toBe(2);
    expect(await purchaseStatus(heldId)).toBe("verified");
  });

  it("a PERSISTENT transient failure is reported, leaves the Purchase held, and does not stop the pass", async () => {
    const world = await businessWithAccount();
    const first = await hold(world, 1, 9);
    const second = await hold(world, 1, 10);
    await post(world.businessId, "credit_grant", "paid", 2);
    const seen: unknown[] = [];
    let call = 0;
    const port2: PurchaseAdmissionCapacityPort = {
      ...port,
      evaluate: (tx, input) => {
        call += 1;
        // The first Purchase fails on both attempts (initial + 1 retry); the next one is fine.
        if (call <= 2) throw Object.assign(new Error("lock timeout"), { code: "55P03" });
        return port.evaluate(tx, input);
      },
    };
    const deps = processorDeps({
      port: port2,
      observer: { purchaseFailure: (f) => void seen.push(f) },
    });
    const pass = await processBusinessHeldPurchases(deps, {
      businessId: world.businessId,
      trigger: "recovery",
      correlationId: "persist",
    });
    expect(pass.head).toMatchObject({ failedTransient: 1, admitted: 1 });
    expect(seen).toEqual([
      expect.objectContaining({
        purchaseId: first,
        failureClass: "transient",
        code: "LOCK_NOT_AVAILABLE",
      }),
    ]);
    expect(await purchaseStatus(first)).toBe("pending_admission");
    expect(await purchaseStatus(second)).toBe("verified");
    // The next run picks the first Purchase up again once the contention clears.
    const run = await runHeldPurchaseRecovery(processorDeps(), { correlationId: "persist-2" });
    expect(run.admittedFromPending).toBe(1);
    expect(await purchaseStatus(first)).toBe("verified");
  });

  it("a PERMANENT failure is not retried, is reported at error class, and does not poison the rest", async () => {
    const world = await businessWithAccount();
    const poisoned = await hold(world, 1, 9);
    const fine = await hold(world, 1, 10);
    await post(world.businessId, "credit_grant", "paid", 2);
    let calls = 0;
    const seen: Array<{ failureClass: string; code: string }> = [];
    const port3: PurchaseAdmissionCapacityPort = {
      ...port,
      evaluate: (tx, input) => {
        calls += 1;
        if (calls === 1) throw Object.assign(new Error("invariant"), { code: "23514" });
        return port.evaluate(tx, input);
      },
    };
    const pass = await processBusinessHeldPurchases(
      processorDeps({ port: port3, observer: { purchaseFailure: (f) => void seen.push(f) } }),
      { businessId: world.businessId, trigger: "recovery", correlationId: "perm" },
    );
    expect(calls).toBe(2); // one failed attempt (no retry) + one for the next Purchase
    expect(seen).toEqual([
      expect.objectContaining({ failureClass: "permanent", code: "CONSTRAINT_23514" }),
    ]);
    expect(pass.head).toMatchObject({ failedPermanent: 1, admitted: 1 });
    expect(await purchaseStatus(poisoned)).toBe("pending_admission");
    expect(await purchaseStatus(fine)).toBe("verified");
  });

  it("a state error while the Purchase is STILL pending is an invariant breach (permanent), never a benign race", async () => {
    const world = await businessWithAccount();
    const heldId = await hold(world, 1, 10);
    await post(world.businessId, "credit_grant", "paid", 1);
    const stale: PurchaseAdmissionCapacityPort = {
      ...port,
      evaluate: () => {
        throw purchaseStaleStateError("pending_admission", "verified");
      },
    };
    const pass = await processBusinessHeldPurchases(processorDeps({ port: stale }), {
      businessId: world.businessId,
      trigger: "recovery",
      correlationId: "stale",
    });
    expect(pass.head.failedPermanent).toBe(1);
    expect(await purchaseStatus(heldId)).toBe("pending_admission");
  });

  it("another worker winning is NOT a failure: concurrent passes over the same Business report no failures", async () => {
    const world = await businessWithAccount();
    for (let h = 5; h < 9; h += 1) await hold(world, 1, h);
    await post(world.businessId, "credit_grant", "paid", 4);
    const passes = await Promise.all(
      [0, 1, 2].map((i) =>
        processBusinessHeldPurchases(processorDeps(), {
          businessId: world.businessId,
          trigger: "signal",
          correlationId: `win-${i}`,
        }),
      ),
    );
    const admitted = passes.reduce((n, p) => n + p.head.admitted, 0);
    expect(admitted).toBe(4); // each Purchase admitted by exactly one worker
    expect(passes.reduce((n, p) => n + p.head.failedTransient + p.head.failedPermanent, 0)).toBe(0);
    expect(passes.reduce((n, p) => n + p.head.notPending, 0)).toBeGreaterThan(0);
    expect(await admissionCount(world.businessId)).toBe(4);
    await assertAccountingInvariants(world.businessId);
  });
});

describe("WP-COM-06a observability, enablement and boundaries", () => {
  it("a recovery run persists a run summary, the latest state and the backlog; observer events are emitted", async () => {
    const world = await businessWithAccount();
    await hold(world, 1, 9);
    await hold(world, 30, 10); // cannot fit
    await post(world.businessId, "credit_grant", "paid", 1);
    const summary = await runHeldPurchaseRecoveryJob(db, pool, {
      env: { PURCHASE_ADMISSION_GATE_MODE: "enforce" },
      overrides: { sleep: noSleep },
    });
    expect(summary).not.toBeNull();
    expect(summary).toMatchObject({
      status: "succeeded",
      businessesExamined: 1,
      admittedFromPending: 1,
      stillHeld: 1,
      skippedForCapacity: 1,
    });
    expect(summary!.backlog).toMatchObject({ totalPending: 1, businessesWithPending: 1 });
    expect(summary!.backlog!.oldestPurchaseDate).toBeInstanceOf(Date);
    const latest = (await db.collection("heldPurchaseProcessorState").doc("latest").get()).data()!;
    expect(latest).toMatchObject({
      status: "succeeded",
      admittedFromPending: 1,
      stillHeld: 1,
      skippedForCapacity: 1,
    });
    expect(latest["backlog"]).toMatchObject({ totalPending: 1, businessesOverWindow: 0 });
    expect(typeof latest["durationMs"]).toBe("number");
    const runDoc = await db
      .collection("heldPurchaseProcessorRuns")
      .doc(summary!.correlationId)
      .get();
    expect(runDoc.exists).toBe(true);
    const cursor = await db.collection("heldPurchaseProcessorState").doc("businessCursor").get();
    expect(cursor.exists).toBe(true);
    await db.collection("heldPurchaseProcessorRuns").doc(summary!.correlationId).delete();
    for (const doc of ["latest", "businessCursor"]) {
      await db.collection("heldPurchaseProcessorState").doc(doc).delete();
    }
  });

  it("the processor is a no-op unless the gate is enforced (default OFF): it never touches PostgreSQL", async () => {
    const explodingPool = new Proxy(
      {},
      {
        get() {
          throw new Error("PostgreSQL must not be touched while disabled");
        },
      },
    ) as unknown as PlatformPostgresPool;
    expect(await runHeldPurchaseRecoveryJob(db, explodingPool, { env: {} })).toBeNull();
    expect(
      await runHeldPurchaseRecoveryJob(db, explodingPool, {
        env: { PURCHASE_ADMISSION_GATE_MODE: "off" },
      }),
    ).toBeNull();
    expect(
      await handleAdmissionSignal(
        db,
        explodingPool,
        { signalId: "s", data: { businessId: "b" } },
        { env: {} },
      ),
    ).toBeNull();
    expect(isHeldPurchaseProcessorEnabled({ PURCHASE_ADMISSION_GATE_MODE: "enforce" })).toBe(true);
    expect(isHeldPurchaseProcessorEnabled({ HELD_PURCHASE_PROCESSOR_MODE: "drain" })).toBe(true);
    expect(isHeldPurchaseProcessorEnabled({})).toBe(false);
  });

  it("a signal for one Business processes ONLY that Business", async () => {
    const a = await businessWithAccount();
    const b = await businessWithAccount();
    const aId = await hold(a, 1, 10);
    const bId = await hold(b, 1, 10);
    await post(a.businessId, "credit_grant", "paid", 1);
    await post(b.businessId, "credit_grant", "paid", 1);
    const enforce = {
      env: { PURCHASE_ADMISSION_GATE_MODE: "enforce" },
      overrides: { sleep: noSleep },
    };
    const T = new Date("2026-10-01T12:00:10.000Z");
    const notifier = createAdmissionSignalNotifier(db, { now: () => T });
    const signalId = admissionSignalDocumentId(a.businessId, T, SIGNAL_COALESCING_WINDOW_MS);
    const send = (reason: string) =>
      notifier.notify({ businessId: a.businessId, reason, correlationId: "c" });
    const handle = async () =>
      handleAdmissionSignal(
        db,
        pool,
        {
          signalId,
          data: (await db.collection("heldPurchaseReevaluationSignals").doc(signalId).get()).data(),
        },
        enforce,
      );
    await send("trial_granted");
    const pass = await handle();
    expect(pass?.head.admitted).toBe(1);
    expect(await purchaseStatus(aId)).toBe("verified");
    expect(await purchaseStatus(bId)).toBe("pending_admission"); // untouched
    // Re-delivery with nothing new (e.g. the handler's own claim write re-firing the trigger): no work.
    expect(await handle()).toBeNull();
    // A LATER signal in the SAME window (coalesced into the existing document) is still processed.
    const lateId = await hold(a, 1, 11);
    await post(a.businessId, "credit_grant", "paid", 1);
    await send("credit_adjusted_up");
    expect((await handle())?.head.admitted).toBe(1);
    expect(await purchaseStatus(lateId)).toBe("verified");
    expect(await handle()).toBeNull();
    await db.collection("heldPurchaseReevaluationSignals").doc(signalId).delete();
    expect(
      await handleAdmissionSignal(
        db,
        pool,
        { signalId: "bad", data: {} },
        { env: { PURCHASE_ADMISSION_GATE_MODE: "enforce" } },
      ),
    ).toBeNull();
  });

  it("the gate is unchanged: with the gate OFF a Purchase is admitted exactly as before and nothing is held", async () => {
    const world = await seedWorld(); // no Commercial account at all
    const id = await record(world, 1);
    await verifyPurchase(db, pool, {
      customerIdentityId: world.customer.customerId,
      request: { purchaseRecordId: id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(await purchaseStatus(id)).toBe("verified");
    expect(await commercialFootprint(world.businessId)).toEqual({
      admissions: 0,
      earmarks: 0,
      reservations: 0,
      admitKeys: 0,
    });
  });
});

describe("TA-F001 continuation-state failure is never an ordinary successful run", () => {
  const brokenStore = (): HeldPurchaseRecoveryStateStore => {
    const fail = async () => {
      throw new Error("firestore unavailable");
    };
    return {
      getBusinessCursor: fail,
      setBusinessCursor: fail,
      getTailCursor: fail,
      setTailCursor: fail,
    };
  };
  const enforce = { PURCHASE_ADMISSION_GATE_MODE: "enforce" };
  /** A Firestore whose every read and write fails (a total outage). */
  const deadFirestore = {
    collection: () => ({
      doc: () => ({
        get: async () => {
          throw new Error("firestore unavailable");
        },
        set: async () => {
          throw new Error("firestore unavailable");
        },
        delete: async () => {
          throw new Error("firestore unavailable");
        },
      }),
    }),
  } as unknown as Firestore;

  it("a state-store failure yields status `partial` (not `succeeded`), flags stateError, and still recovers fail-toward-recovery", async () => {
    const world = await businessWithAccount();
    const heldId = await hold(world, 1, 10);
    await post(world.businessId, "credit_grant", "paid", 1);
    const run = await runHeldPurchaseRecovery(processorDeps({ store: brokenStore() }), {
      correlationId: "ta-f001-a",
    });
    expect(run.stateError).toBe(true);
    expect(run.status).toBe("partial");
    expect(run.status).not.toBe("succeeded");
    // Fail toward recovery: the run still started from the beginning and admitted the Purchase.
    expect(run.admittedFromPending).toBe(1);
    expect(await purchaseStatus(heldId)).toBe("verified");
  });

  it("the scheduled job FAILS (throws) on a state error, yet the run is still recorded when Firestore can record it", async () => {
    const world = await businessWithAccount();
    await hold(world, 1, 10);
    await expect(
      runHeldPurchaseRecoveryJob(db, pool, {
        env: enforce,
        overrides: { store: brokenStore(), sleep: noSleep },
      }),
    ).rejects.toThrow(/CONTINUATION_STATE_FAILED/);
    const latest = (await db.collection("heldPurchaseProcessorState").doc("latest").get()).data()!;
    expect(latest).toMatchObject({ status: "partial", stateError: true });
    await db.collection("heldPurchaseProcessorState").doc("latest").delete();
    const runs = await db.collection("heldPurchaseProcessorRuns").get();
    await Promise.all(runs.docs.map((d) => d.ref.delete()));
  });

  it("a total Firestore outage (cursor AND run persistence fail) still fails the job -- it cannot look successful", async () => {
    const world = await businessWithAccount();
    const heldId = await hold(world, 1, 10);
    await post(world.businessId, "credit_grant", "paid", 1);
    await expect(
      runHeldPurchaseRecoveryJob(deadFirestore, pool, {
        env: enforce,
        overrides: { sleep: noSleep },
      }),
    ).rejects.toThrow(/degraded/);
    // The PostgreSQL work was still done: recovery is not blocked by the Firestore outage.
    expect(await purchaseStatus(heldId)).toBe("verified");
  });

  it("an observer that cannot persist the run marks the RETURNED summary reportingFailed and non-success", async () => {
    const world = await businessWithAccount();
    await hold(world, 1, 10);
    const run = await runHeldPurchaseRecovery(
      processorDeps({
        observer: {
          runCompleted: async () => {
            throw new Error("cannot persist");
          },
        },
      }),
      { correlationId: "ta-f001-d" },
    );
    expect(run.reportingFailed).toBe(true);
    expect(run.status).toBe("partial");
  });
});

describe("TA-F002 signal timeout bounds the WAIT, it does not cancel the notifier", () => {
  it("the command returns at the bound while the notifier's own work may still complete afterwards", async () => {
    const world = await businessWithAccount();
    let completedLate = false;
    const notifier: CapacityIncreaseNotifier = {
      async notify() {
        await sleep(700);
        completedLate = true; // not cancelled: the best-effort work finishes after the command returned
      },
    };
    const res = await grantTrial(cmdDeps(notifier, { capacitySignalTimeoutMs: 100 }), ctx(), {
      businessId: world.businessId,
      units: 3,
      reasonText: "x",
      reference: "R",
    });
    expect(res.result.units).toBe(3);
    expect(completedLate).toBe(false); // the command did not wait for it
    await sleep(1000);
    expect(completedLate).toBe(true); // and nothing cancelled it
  });

  it("a notifier that rejects AFTER the bound raises no unhandled rejection and does not affect the committed mutation", async () => {
    const world = await businessWithAccount();
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => void unhandled.push(reason);
    process.on("unhandledRejection", onUnhandled);
    try {
      const notifier: CapacityIncreaseNotifier = {
        async notify() {
          await sleep(300);
          throw new Error("late failure");
        },
      };
      const res = await grantTrial(cmdDeps(notifier, { capacitySignalTimeoutMs: 80 }), ctx(), {
        businessId: world.businessId,
        units: 4,
        reasonText: "x",
        reference: "R",
      });
      await sleep(700);
      expect(res.result.units).toBe(4);
      expect(unhandled).toEqual([]);
      expect((await account(world.businessId)).trialRemainingUnits).toBe(4);
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });
});
