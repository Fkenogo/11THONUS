/**
 * WP-COM-05a — Purchase admission seam & `pending_admission` foundation.
 *
 * Proves, on a live PostgreSQL:
 *
 *  - GATE OFF EQUIVALENCE: the extraction of `admitPurchaseToLoyalty` from
 *    `verifyPurchase` changed nothing observable. `GOLDEN` below was captured by
 *    running the SAME scenarios against unmodified `main`
 *    (dccd9394412bd2902c6f8580ced7e54b40e1397a) -- both the resulting rows
 *    (Purchase, events, Verified Unit, allocations, Cycle, Reward, Trust,
 *    intents, outbox, idempotency) and the ordered SQL statement trace (so the
 *    lock/write order is byte-identical, not merely "similar");
 *  - the `pending_admission` state machine (CHECK + guard trigger + conditional
 *    transitions): valid, not invalid, credit-free, re-admittable;
 *  - the reusable admission seam: pending_admission -> verified, exactly-once
 *    (unique backstops), rollback-then-retry, concurrent duplicate admit;
 *  - locking: no new lock-order cycle (no 40P01) under concurrent verifies,
 *    duplicates and Cycle-completion races; no Commercial table is read,
 *    written or locked on the admission path.
 *
 * Requires a live PostgreSQL AND the Firestore Emulator (setup runs the real
 * commands). Run via:
 *
 *   firebase emulators:exec --only firestore --project demo-11thonus \
 *     "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *      pnpm --filter functions exec vitest run --config vitest.postgres.config.ts purchaseAdmissionSeam"
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import { issueLoyaltyNumberForIdentity } from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import { issueQrIdentityForIdentity } from "../../qrIdentity/repositories/qrIdentityRepository";
import type { LoyaltyNumberCandidateGenerator } from "../../loyaltyNumber/services/loyaltyNumberGenerator";
import type { QrReferenceGenerator } from "../../qrIdentity/services/qrReferenceGenerator";
import type { EventActor } from "../../../shared/events/domainEvent";
import { loadPostgresConfig } from "../../../infrastructure/postgres/postgresConfig";
import {
  createPostgresPool,
  closePostgresPool,
  type PlatformPostgresPool,
} from "../../../infrastructure/postgres/postgresPool";
import {
  discoverMigrationFiles,
  migrateUp,
} from "../../../infrastructure/postgres/migrationRunner";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { createRewardProgram } from "../../rewardProgram/services/createRewardProgramCommand";
import { publishRewardProgramVersion } from "../../rewardProgram/services/publishRewardProgramVersionCommand";
import { insertQualifyingItem } from "../../qualifyingItem/repositories/qualifyingItemRepository";
import { recordPurchase } from "./recordPurchaseCommand";
import { verifyPurchase } from "./verifyPurchaseCommand";
import { admitPurchaseToLoyalty } from "./admitPurchaseToLoyalty";
import { decidePurchaseAdmission, resolvePurchaseAdmissionGateMode } from "./purchaseAdmissionGate";
import {
  appendPurchaseRecordEvent,
  lockPurchaseRecordById,
  transitionPurchaseToPendingAdmission,
  transitionPurchaseToRejected,
  transitionPurchaseToUnderReview,
} from "../repositories/purchaseRecordRepository";
import { insertVerifiedUnitCredit } from "../repositories/verifiedUnitRepository";
import { insertRewardForCycle } from "../repositories/loyaltyCycleRepository";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "infrastructure",
  "postgres",
  "migrations",
);

const app = initializeApp({ projectId: "demo-11thonus" }, "purchaseAdmissionSeamTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;

let seq = 0;
let customerSeq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

/** Loyalty Numbers must match /^[A-HJ-NP-Z]{3}[2-9]{3}$/. */
function lnFor(i: number): string {
  const d = (n: number) => String(2 + (((n % 8) + 8) % 8));
  return `ADM${d(i)}${d(i + 3)}${d(i + 5)}`;
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

beforeAll(async () => {
  if (!process.env.PLATFORM_POSTGRES_URL && process.env.PLATFORM_ENV !== "test") {
    throw new Error(
      "This test requires a live PostgreSQL instance (PLATFORM_ENV=test / PLATFORM_POSTGRES_URL).",
    );
  }
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — run under the Firestore Emulator (see header).",
    );
  }
  pool = createPostgresPool(
    loadPostgresConfig({ ...process.env, PLATFORM_POSTGRES_POOL_MAX: "12" }),
  );
  const files = await discoverMigrationFiles(migrationsDir);
  if (files.length === 0) {
    throw new Error("No migrations found — did the migrations/ directory get cleaned?");
  }
  await migrateUp(pool, migrationsDir);
}, 120000);

afterAll(async () => {
  await closePostgresPool(pool);
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

afterEach(async () => {
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
});

// ---------------------------------------------------------------------------
// Seeds (real commands only)
// ---------------------------------------------------------------------------

async function seedBusiness(businessId: string) {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ45678X",
      ownerUserId: `owner_of_${businessId}`,
      displayName: "ADM Cafe",
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

async function seedCustomer(): Promise<{ customerId: string; ln: string }> {
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
    generator: new FixedGenerator(`qradm${customerSeq}ref`),
    idempotencyKey: `key_qr_${suffix}`,
    requestHash: `hash_qr_${suffix}`,
  });
  return { customerId, ln };
}

type World = {
  businessId: string;
  owner: string;
  programId: string;
  qualifyingItemId: string;
  customer: { customerId: string; ln: string };
};

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

async function record(world: World, quantity: number, customer = world.customer): Promise<string> {
  const rec = await recordPurchase(db, pool, {
    userId: world.owner,
    request: {
      businessId: world.businessId,
      rewardProgramId: world.programId,
      loyaltyNumberValue: customer.ln,
      quantity,
      qualifyingItemId: world.qualifyingItemId,
      purchaseDate: new Date("2026-09-28T10:00:00.000Z"),
    },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  return rec.purchase.id;
}

function verify(world: World, purchaseRecordId: string, idempotencyKey = nextId("key")) {
  return verifyPurchase(db, pool, {
    customerIdentityId: world.customer.customerId,
    request: { purchaseRecordId },
    idempotencyKey,
    correlationId: nextId("corr"),
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

/** Normalised, id/time-free picture of everything one world's verification wrote. */
async function fingerprint(world: World, purchaseIds: string[]): Promise<Json> {
  const p = await rows(
    `SELECT status, (verified_at IS NOT NULL) AS has_verified_at, quantity
       FROM purchase_records WHERE id = ANY($1::uuid[]) ORDER BY created_at, id`,
    [purchaseIds],
  );
  const events = await rows<{
    from_status: string | null;
    to_status: string;
    actor_type: string;
    reason: string | null;
    payload_keys: string[] | null;
  }>(
    `SELECT from_status, to_status, actor_type, reason,
            (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(event_payload) k) AS payload_keys
       FROM purchase_record_events WHERE purchase_record_id = ANY($1::uuid[])
      ORDER BY occurred_at, id`,
    [purchaseIds],
  );
  const bizId = world.businessId;
  const cust = world.customer.customerId;
  return {
    purchases: p,
    events,
    verifiedUnits: await rows(
      `SELECT entry_type, quantity, reason_code FROM verified_units
        WHERE customer_identity_id = $1 ORDER BY created_at, id`,
      [cust],
    ),
    allocations: await rows(
      `SELECT state, allocated_quantity, allocation_order, (loyalty_cycle_id IS NOT NULL) AS in_cycle
         FROM verified_unit_allocations WHERE customer_identity_id = $1
        ORDER BY created_at, allocation_order, id`,
      [cust],
    ),
    allocationEvents: await rows(
      `SELECT from_state, to_state, quantity, reason FROM verified_unit_allocation_events e
        WHERE verified_unit_id IN (SELECT id FROM verified_units WHERE customer_identity_id = $1)
        ORDER BY occurred_at, from_state, to_state, quantity`,
      [cust],
    ),
    cycles: await rows(
      `SELECT sequence_number, state, allocated_units FROM loyalty_cycles
        WHERE customer_identity_id = $1 ORDER BY sequence_number`,
      [cust],
    ),
    rewards: await rows(
      `SELECT state, reward_quantity FROM rewards WHERE customer_identity_id = $1 ORDER BY created_at, id`,
      [cust],
    ),
    trustEvents: await rows(
      `SELECT event_type, actor_type FROM trust_events
        WHERE business_id = $1 ORDER BY event_type, actor_type`,
      [bizId],
    ),
    intents: await rows(
      `SELECT intent_type, recipient_type, status FROM notification_intents
        WHERE purchase_record_id = ANY($1::uuid[]) ORDER BY intent_type, recipient_type`,
      [purchaseIds],
    ),
    outbox: await rows(
      `SELECT event_type FROM purchase_outbox WHERE aggregate_id = ANY($1::uuid[]) ORDER BY event_type`,
      [purchaseIds],
    ),
  };
}

/** `VERB table [FOR UPDATE|FOR KEY SHARE…]` -- the lock/write skeleton of a statement. */
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

/** Simulates the FUTURE hold (WP-COM-05b) so the state and the re-admission seam can be exercised. */
async function holdAsPendingAdmission(purchaseId: string, customerId: string) {
  await withPlatformTransaction(pool, async (tx) => {
    const locked = await lockPurchaseRecordById(tx, purchaseId);
    expect(locked?.status).toBe("waiting_for_customer");
    const held = await transitionPurchaseToPendingAdmission(tx, { purchaseId });
    expect(held).not.toBeNull();
    await appendPurchaseRecordEvent(tx, {
      purchaseRecordId: purchaseId,
      fromStatus: "waiting_for_customer",
      toStatus: "pending_admission",
      actorType: "customer",
      actorId: customerId,
      reason: "test_simulated_hold",
      eventPayload: null,
      correlationId: nextId("corr_hold"),
    });
  });
}

/** Lock the Purchase, optionally check status like a caller would, then run the seam. */
async function admitFromPending(
  purchaseId: string,
  opts: { checkStatus?: boolean; afterAdmit?: () => Promise<void> } = {},
) {
  return withPlatformTransaction(pool, async (tx) => {
    const locked = await lockPurchaseRecordById(tx, purchaseId);
    if (!locked) throw new Error("purchase not found");
    if (opts.checkStatus && locked.status !== "pending_admission") {
      return { outcome: "not_pending" as const, status: locked.status };
    }
    const admitted = await admitPurchaseToLoyalty(tx, {
      locked,
      fromStatus: "pending_admission",
      actor: { type: "system", id: "admission-processor" },
      correlationId: nextId("corr_admit"),
      idempotencyKey: `seam-test:${purchaseId}`,
    });
    if (opts.afterAdmit) await opts.afterAdmit();
    return { outcome: "admitted" as const, admitted };
  });
}

async function pgError(promise: Promise<unknown>): Promise<{ code?: string; message: string }> {
  try {
    await promise;
  } catch (e) {
    return e as { code?: string; message: string };
  }
  throw new Error("expected the statement to fail");
}

async function waitForLockWaiter(queryFragment: string, timeoutMs = 8000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const n = await count(
      `SELECT 1 FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query ILIKE $1`,
      [`%${queryFragment}%`],
    );
    if (n > 0) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`no backend ever blocked on a lock for "${queryFragment}"`);
}

// ---------------------------------------------------------------------------
// GOLDEN -- captured on unmodified main (dccd9394412bd2902c6f8580ced7e54b40e1397a)
// ---------------------------------------------------------------------------

const GOLDEN_PATH = path.join(__dirname, "purchaseAdmissionSeam.golden.json");
const SCENARIOS: Record<string, number[]> = {
  single_unit: [1],
  exact_completion: [10],
  overflow_with_pending: [12],
  two_purchases_into_one_cycle: [4, 7],
};

async function runScenario(quantities: number[]) {
  const world = await seedWorld();
  const purchaseIds: string[] = [];
  const traces: string[][] = [];
  const results: Json[] = [];
  for (const q of quantities) {
    const id = await record(world, q);
    purchaseIds.push(id);
    const { result, trace } = await traceStatements(() => verify(world, id));
    traces.push(trace);
    results.push({
      resultKeys: Object.keys(result).sort(),
      purchaseStatus: result.purchase.status,
      verifiedUnitQuantity: result.verifiedUnit.quantity,
      cycleState: result.cycle.state,
      cycleAllocatedUnits: result.cycle.allocatedUnits,
      rewardPresent: result.reward !== null,
    });
  }
  const keyRows = await rows(
    `SELECT operation_type, status FROM idempotency_keys WHERE actor_id = $1 ORDER BY reserved_at, idempotency_key`,
    [world.customer.customerId],
  );
  return {
    results,
    traces,
    idempotency: keyRows,
    fingerprint: await fingerprint(world, purchaseIds),
  };
}

describe("WP-COM-05a — gate OFF equivalence with pre-extraction main", () => {
  it("every scenario matches the golden captured on main (rows AND ordered statement trace)", async () => {
    const actual: Record<string, unknown> = {};
    for (const [name, quantities] of Object.entries(SCENARIOS)) {
      actual[name] = await runScenario(quantities);
    }
    if (process.env.GOLDEN_DUMP) {
      writeFileSync(process.env.GOLDEN_DUMP, JSON.stringify(actual, null, 2));
      return;
    }
    const golden = JSON.parse(readFileSync(GOLDEN_PATH, "utf8"));
    expect(JSON.parse(JSON.stringify(actual))).toEqual(golden);
  }, 120000);

  it("the statement trace of a full-completion verify takes locks in the canonical order, with no Commercial table", async () => {
    const world = await seedWorld();
    const id = await record(world, 12);
    const { trace } = await traceStatements(() => verify(world, id));
    const first = (needle: string) => trace.findIndex((t) => t.startsWith(needle));
    const order = [
      "SELECT idempotency_keys", // client key
      "SELECT purchase_records FOR UPDATE", // purchase
      "UPDATE purchase_records", // transition
      "INSERT verified_units", // unit
      "INSERT loyalty_cycle_streams", // stream ensure (then locked)
      "SELECT loyalty_cycle_streams FOR UPDATE",
      "SELECT loyalty_cycles FOR UPDATE", // cycle
      "INSERT rewards", // reward
      "INSERT trust_events",
      "INSERT purchase_outbox",
    ];
    const positions = order.map(first);
    expect(
      positions.every((p) => p >= 0),
      JSON.stringify({ order, positions, trace }),
    ).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(trace.filter((t) => /commercial/i.test(t))).toEqual([]);
  });

  it("gate resolution: default and explicit `off` admit; `enforce` is the WP-COM-05b mode; any other mode fails closed", () => {
    expect(resolvePurchaseAdmissionGateMode()).toBe("off");
    expect(resolvePurchaseAdmissionGateMode("off")).toBe("off");
    expect(resolvePurchaseAdmissionGateMode("enforce")).toBe("enforce");
    expect(decidePurchaseAdmission("off")).toEqual({ outcome: "admit" });
    for (const bad of ["shadow", "", "OFF", "on"]) {
      expect(() => resolvePurchaseAdmissionGateMode(bad)).toThrow(/not supported/);
    }
  });

  it("verifyPurchase with an unsupported gate mode fails closed BEFORE any write", async () => {
    const world = await seedWorld();
    const id = await record(world, 1);
    await expect(
      verifyPurchase(db, pool, {
        customerIdentityId: world.customer.customerId,
        request: { purchaseRecordId: id },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
        admissionGateMode: "shadow" as never,
      }),
    ).rejects.toThrow(/not supported/);
    expect((await rows("SELECT status FROM purchase_records WHERE id = $1", [id]))[0].status).toBe(
      "waiting_for_customer",
    );
    expect(
      await count("SELECT 1 FROM idempotency_keys WHERE actor_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(0);
  });

  it("no pending_admission state is produced by any normal gate-OFF flow", async () => {
    const world = await seedWorld();
    for (const q of [3, 10, 5]) await verify(world, await record(world, q));
    expect(await count("SELECT 1 FROM purchase_records WHERE status = 'pending_admission'")).toBe(
      0,
    );
    expect(
      await count("SELECT 1 FROM purchase_record_events WHERE to_status = 'pending_admission'"),
    ).toBe(0);
  });

  it("verifyPurchase completes while EVERY Commercial table is ACCESS EXCLUSIVE-locked (no Commercial read/write/lock)", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    const tables = await rows<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'commercial\\_%'`,
    );
    expect(tables.length).toBeGreaterThan(5);
    const blocker = await pool.connect();
    try {
      await blocker.query("BEGIN");
      for (const t of tables)
        await blocker.query(`LOCK TABLE ${t.tablename} IN ACCESS EXCLUSIVE MODE`);
      const outcome = await Promise.race([
        verify(world, id).then(() => "completed" as const),
        new Promise<"blocked">((r) => setTimeout(() => r("blocked"), 8000)),
      ]);
      expect(outcome).toBe("completed");
    } finally {
      await blocker.query("ROLLBACK");
      blocker.release();
    }
  }, 30000);

  it("idempotent replay of the same key returns the stored result and creates no second unit", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    const key = nextId("key");
    const first = await verify(world, id, key);
    const again = await verify(world, id, key);
    expect(again.verifiedUnit.id).toBe(first.verifiedUnit.id);
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// pending_admission state
// ---------------------------------------------------------------------------

describe("WP-COM-05a — pending_admission state machine", () => {
  it("a held Purchase is valid, preserved, NOT invalid, and carries no credit anywhere", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    await holdAsPendingAdmission(id, world.customer.customerId);

    const [row] = await rows<{
      status: string;
      verified_at: unknown;
      rejection_reason: unknown;
      dispute_reason: unknown;
    }>(
      "SELECT status, verified_at, rejection_reason, dispute_reason FROM purchase_records WHERE id = $1",
      [id],
    );
    expect(row).toEqual({
      status: "pending_admission",
      verified_at: null,
      rejection_reason: null,
      dispute_reason: null,
    });
    expect(["rejected", "under_review", "cancelled", "expired"]).not.toContain(row.status);

    const cust = world.customer.customerId;
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(0);
    expect(
      await count("SELECT 1 FROM verified_unit_allocations WHERE customer_identity_id = $1", [
        cust,
      ]),
    ).toBe(0);
    expect(
      await count("SELECT 1 FROM loyalty_cycles WHERE customer_identity_id = $1", [cust]),
    ).toBe(0);
    expect(
      await count("SELECT 1 FROM loyalty_cycle_streams WHERE customer_identity_id = $1", [cust]),
    ).toBe(0);
    expect(await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [cust])).toBe(0);
    expect(
      await count(
        "SELECT 1 FROM trust_events WHERE causal_purchase_record_id = $1 AND event_type <> 'purchase.recorded'",
        [id],
      ),
    ).toBe(0);
    expect(
      await count(
        "SELECT 1 FROM notification_intents WHERE purchase_record_id = $1 AND intent_type <> 'purchase_recorded_customer'",
        [id],
      ),
    ).toBe(0);
    expect(
      await count(
        "SELECT 1 FROM purchase_outbox WHERE aggregate_id = $1 AND event_type <> 'purchase_recorded'",
        [id],
      ),
    ).toBe(0);
    // CORR-002: a hold writes nothing to idempotency.
    expect(await count("SELECT 1 FROM idempotency_keys WHERE idempotency_key LIKE 'admit:%'")).toBe(
      0,
    );
    expect(await count("SELECT 1 FROM idempotency_keys WHERE actor_id = $1", [cust])).toBe(0);
  });

  it("DB state integrity: pending_admission cannot carry verified_at or a verdict reason", async () => {
    const world = await seedWorld();
    const id = await record(world, 2);
    for (const set of [
      "status='pending_admission', verified_at = now()",
      "status='pending_admission', rejection_reason = 'duplicate'",
      "status='pending_admission', dispute_reason = 'wrong_item'",
    ]) {
      const err = await pgError(
        pool.query(`UPDATE purchase_records SET ${set} WHERE id = $1`, [id]),
      );
      expect(err.code, set).toBe("23514");
    }
    expect((await rows("SELECT status FROM purchase_records WHERE id = $1", [id]))[0].status).toBe(
      "waiting_for_customer",
    );
  });

  it("DB guard: pending_admission is entered only from waiting_for_customer, left only to verified, never created directly", async () => {
    const world = await seedWorld();
    const held = await record(world, 2);
    await holdAsPendingAdmission(held, world.customer.customerId);

    // Illegal exits from pending_admission.
    for (const sql of [
      "UPDATE purchase_records SET status='rejected', rejection_reason='duplicate' WHERE id = $1",
      "UPDATE purchase_records SET status='under_review', dispute_reason='wrong_item' WHERE id = $1",
      "UPDATE purchase_records SET status='waiting_for_customer' WHERE id = $1",
      "UPDATE purchase_records SET status='cancelled' WHERE id = $1",
      "UPDATE purchase_records SET status='expired' WHERE id = $1",
      "UPDATE purchase_records SET status='archived' WHERE id = $1",
    ]) {
      const err = await pgError(pool.query(sql, [held]));
      expect(err.code, sql).toBe("23514");
      expect(err.message, sql).toMatch(/pending_admission/);
    }
    expect(
      (await rows("SELECT status FROM purchase_records WHERE id = $1", [held]))[0].status,
    ).toBe("pending_admission");

    // Illegal entries into pending_admission (from a verified purchase).
    const verifiedId = await record(world, 1);
    await verify(world, verifiedId);
    const entry = await pgError(
      pool.query(
        "UPDATE purchase_records SET status='pending_admission', verified_at = NULL WHERE id = $1",
        [verifiedId],
      ),
    );
    expect(entry.code).toBe("23514");

    // Direct creation is refused (INSERT path of the guard) -- clone a waiting row as pending.
    const direct = await pgError(
      pool.query(
        `INSERT INTO purchase_records
           (business_id, customer_identity_id, presented_artifact_type, presented_artifact_reference,
            canonical_loyalty_number_value, reward_program_id, reward_program_version_id,
            shared_loyalty_number_allowed, multiple_units_allowed, branch_id, recorded_by_user_id,
            recorded_by_role, quantity, qualifying_item_id, item_label, purchase_date, status, correlation_id)
         SELECT business_id, customer_identity_id, presented_artifact_type, presented_artifact_reference,
            canonical_loyalty_number_value, reward_program_id, reward_program_version_id,
            shared_loyalty_number_allowed, multiple_units_allowed, branch_id, recorded_by_user_id,
            recorded_by_role, quantity, qualifying_item_id, item_label, purchase_date, 'pending_admission', 'c'
           FROM purchase_records WHERE id = $1`,
        [verifiedId],
      ),
    );
    expect(direct.code).toBe("23514");
  });

  it("service transitions: reject / dispute cannot act on a held Purchase; entering the state needs waiting_for_customer", async () => {
    const world = await seedWorld();
    const id = await record(world, 2);
    await holdAsPendingAdmission(id, world.customer.customerId);
    await withPlatformTransaction(pool, async (tx) => {
      expect(
        await transitionPurchaseToRejected(tx, { purchaseId: id, reason: "duplicate" }),
      ).toBeNull();
      expect(
        await transitionPurchaseToUnderReview(tx, { purchaseId: id, reason: "wrong_item" }),
      ).toBeNull();
      // Already pending: a second hold is a no-op (conditional on waiting_for_customer).
      expect(await transitionPurchaseToPendingAdmission(tx, { purchaseId: id })).toBeNull();
    });
    expect((await rows("SELECT status FROM purchase_records WHERE id = $1", [id]))[0].status).toBe(
      "pending_admission",
    );
  });

  it("gate-OFF verifyPurchase does not treat pending_admission as waiting: stale-state error, nothing written", async () => {
    const world = await seedWorld();
    const id = await record(world, 2);
    await holdAsPendingAdmission(id, world.customer.customerId);
    await expect(verify(world, id)).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
    expect((await rows("SELECT status FROM purchase_records WHERE id = $1", [id]))[0].status).toBe(
      "pending_admission",
    );
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(0);
    expect(
      await count("SELECT 1 FROM idempotency_keys WHERE actor_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Re-admission seam + idempotency
// ---------------------------------------------------------------------------

describe("WP-COM-05a — admitPurchaseToLoyalty seam (pending_admission -> verified)", () => {
  it("re-admits a held Purchase with the SAME loyalty outcome as a live verify (only actor/from-state differ)", async () => {
    const live = await seedWorld();
    const liveId = await record(live, 12);
    await verify(live, liveId);
    const liveFp = await fingerprint(live, [liveId]);

    const held = await seedWorld();
    const heldId = await record(held, 12);
    await holdAsPendingAdmission(heldId, held.customer.customerId);
    const out = await admitFromPending(heldId);
    expect(out.outcome).toBe("admitted");
    const heldFp = await fingerprint(held, [heldId]);

    const strip = (fp: Json) => ({
      ...fp,
      events: (fp.events as Array<Json>)
        .filter((e) => e.to_status === "verified")
        .map((e) => ({
          to_status: e.to_status,
          payload_keys: e.payload_keys,
        })),
      trustEvents: (fp.trustEvents as Array<Json>).map((t) => t.event_type),
    });
    expect(strip(heldFp)).toEqual(strip(liveFp));

    // Provenance: the hold event (customer) then the admission event (system).
    const events = heldFp.events as Array<Json>;
    expect(
      events
        .filter((e) => e.to_status !== "waiting_for_customer")
        .map((e) => [e.from_status, e.to_status, e.actor_type]),
    ).toEqual([
      ["waiting_for_customer", "pending_admission", "customer"],
      ["pending_admission", "verified", "system"],
    ]);
    // Reward evidence is attributed to the system actor at admission.
    expect(
      (heldFp.trustEvents as Array<Json>)
        .filter((t) => t.event_type !== "purchase.recorded")
        .every((t) => t.actor_type === "system"),
    ).toBe(true);
    expect(heldFp.rewards).toEqual([{ state: "available", reward_quantity: 1 }]);
  });

  it("the seam reserves/completes NO idempotency key and reads no Commercial table", async () => {
    const world = await seedWorld();
    const id = await record(world, 3);
    await holdAsPendingAdmission(id, world.customer.customerId);
    const { trace } = await traceStatements(() => admitFromPending(id));
    expect(
      await count("SELECT 1 FROM idempotency_keys WHERE idempotency_key LIKE $1", [`%${id}%`]),
    ).toBe(0);
    expect(await count("SELECT 1 FROM idempotency_keys WHERE idempotency_key LIKE 'admit:%'")).toBe(
      0,
    );
    expect(trace.filter((t) => /idempotency|commercial/i.test(t))).toEqual([]);
  });

  it("an admission that rolls back leaves the Purchase pending_admission and a retry succeeds", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    await holdAsPendingAdmission(id, world.customer.customerId);
    const cust = world.customer.customerId;

    await expect(
      admitFromPending(id, {
        afterAdmit: async () => {
          throw new Error("simulated crash after the full write phase");
        },
      }),
    ).rejects.toThrow(/simulated crash/);

    expect(
      (await rows("SELECT status, verified_at FROM purchase_records WHERE id = $1", [id]))[0],
    ).toEqual({
      status: "pending_admission",
      verified_at: null,
    });
    for (const sql of [
      "SELECT 1 FROM verified_units WHERE customer_identity_id = $1",
      "SELECT 1 FROM verified_unit_allocations WHERE customer_identity_id = $1",
      "SELECT 1 FROM loyalty_cycles WHERE customer_identity_id = $1",
      "SELECT 1 FROM loyalty_cycle_streams WHERE customer_identity_id = $1",
      "SELECT 1 FROM rewards WHERE customer_identity_id = $1",
      "SELECT 1 FROM trust_events WHERE customer_identity_id = $1 AND event_type <> 'purchase.recorded'",
    ]) {
      expect(await count(sql, [cust]), sql).toBe(0);
    }

    const retry = await admitFromPending(id);
    expect(retry.outcome).toBe("admitted");
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect(await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [cust])).toBe(1);
  });

  it("a second admission after commit is refused (stale-state) -- one Verified Unit, one Reward", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    await holdAsPendingAdmission(id, world.customer.customerId);
    await admitFromPending(id);
    await expect(admitFromPending(id)).rejects.toMatchObject({
      category: "INVALID_STATE_TRANSITION",
    });
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect(
      await count("SELECT 1 FROM verified_unit_allocations WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
  });

  it("DB backstops independent of service logic: second credit per Purchase and second Reward per Cycle are unique-violations", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    await verify(world, id);
    const [p] = await rows<{
      business_id: string;
      customer_identity_id: string;
      reward_program_id: string;
      reward_program_version_id: string;
    }>(
      "SELECT business_id, customer_identity_id, reward_program_id, reward_program_version_id FROM purchase_records WHERE id = $1",
      [id],
    );
    const dupCredit = await pgError(
      withPlatformTransaction(pool, (tx) =>
        insertVerifiedUnitCredit(tx, {
          purchaseRecordId: id,
          businessId: p.business_id,
          customerIdentityId: p.customer_identity_id,
          rewardProgramId: p.reward_program_id,
          rewardProgramVersionId: p.reward_program_version_id,
          quantity: 10,
          reasonCode: "purchase_verified",
          correlationId: "dup",
          createdBy: "dup",
        }),
      ),
    );
    expect(dupCredit.code).toBe("23505");

    const [cycle] = await rows<{ id: string }>(
      "SELECT id FROM loyalty_cycles WHERE customer_identity_id = $1",
      [p.customer_identity_id],
    );
    const dupReward = await pgError(
      withPlatformTransaction(pool, (tx) =>
        insertRewardForCycle(tx, {
          loyaltyCycleId: cycle.id,
          businessId: p.business_id,
          customerIdentityId: p.customer_identity_id,
          rewardProgramId: p.reward_program_id,
          rewardProgramVersionId: p.reward_program_version_id,
          rewardDescription: "Free Coffee",
          correlationId: "dup",
        }),
      ),
    );
    expect(dupReward.code).toBe("23505");
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [
        p.customer_identity_id,
      ]),
    ).toBe(1);
  });

  it("concurrent duplicate admit: the loser blocks on the Purchase lock, then resolves as not-pending (status-checked caller)", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    await holdAsPendingAdmission(id, world.customer.customerId);

    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let signalLocked!: () => void;
    const locked = new Promise<void>((r) => (signalLocked = r));

    const first = withPlatformTransaction(pool, async (tx) => {
      const row = await lockPurchaseRecordById(tx, id);
      signalLocked();
      await gate;
      return admitPurchaseToLoyalty(tx, {
        locked: row!,
        fromStatus: "pending_admission",
        actor: { type: "system", id: "p1" },
        correlationId: nextId("c1"),
        idempotencyKey: "seam-test-1",
      });
    });
    await locked;
    const second = admitFromPending(id, { checkStatus: true });
    await waitForLockWaiter("FROM purchase_records WHERE id");
    release();

    const [a, b] = await Promise.all([first, second]);
    expect(a.verifiedUnit.quantity).toBe(10);
    expect(b).toEqual({ outcome: "not_pending", status: "verified" });
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
  }, 30000);

  it("concurrent duplicate admit WITHOUT a caller status check is still safe: the conditional transition refuses the loser", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    await holdAsPendingAdmission(id, world.customer.customerId);

    const results = await Promise.allSettled([1, 2, 3, 4].map(() => admitFromPending(id)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results.filter((r) => r.status === "rejected")) {
      expect((r as PromiseRejectedResult).reason).toMatchObject({
        category: "INVALID_STATE_TRANSITION",
      });
    }
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect(
      await count("SELECT 1 FROM verified_unit_allocations WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
  }, 30000);
});

// ---------------------------------------------------------------------------
// Locking: the extraction introduces no new deadlock cycle
// ---------------------------------------------------------------------------

function expectNoDeadlock(results: PromiseSettledResult<unknown>[]) {
  for (const r of results) {
    if (r.status === "rejected") {
      expect((r.reason as { code?: string }).code, String(r.reason)).not.toBe("40P01");
    }
  }
}

describe("WP-COM-05a — lock order / concurrency (no new deadlock cycle)", () => {
  it("two concurrent Purchases, same customer/business/program: both commit, allocation conserved, one Reward", async () => {
    const world = await seedWorld();
    const a = await record(world, 6);
    const b = await record(world, 6);
    const results = await Promise.allSettled([verify(world, a), verify(world, b)]);
    expectNoDeadlock(results);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
    const cust = world.customer.customerId;
    const alloc = await rows<{ state: string; q: string }>(
      "SELECT state, SUM(allocated_quantity)::text AS q FROM verified_unit_allocations WHERE customer_identity_id = $1 GROUP BY state ORDER BY state",
      [cust],
    );
    expect(alloc).toEqual([
      { state: "allocated", q: "10" },
      { state: "pending", q: "2" },
    ]);
    expect(await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [cust])).toBe(1);
    expect(
      await count(
        "SELECT 1 FROM loyalty_cycles WHERE customer_identity_id = $1 AND state = 'active'",
        [cust],
      ),
    ).toBe(0);
    expect(
      await count("SELECT 1 FROM verified_units WHERE customer_identity_id = $1", [cust]),
    ).toBe(2);
  }, 60000);

  it("Cycle-completion race: 3 concurrent verifies crossing the threshold produce exactly one Reward and conserve units", async () => {
    const world = await seedWorld();
    const ids = [await record(world, 4), await record(world, 4), await record(world, 4)];
    const results = await Promise.allSettled(ids.map((id) => verify(world, id)));
    expectNoDeadlock(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const cust = world.customer.customerId;
    expect(await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [cust])).toBe(1);
    expect(
      (
        await rows<{ n: string }>(
          "SELECT SUM(allocated_quantity)::text AS n FROM verified_unit_allocations WHERE customer_identity_id = $1 AND state='allocated'",
          [cust],
        )
      )[0].n,
    ).toBe("10");
    expect(
      (
        await rows<{ n: string }>(
          "SELECT SUM(allocated_quantity)::text AS n FROM verified_unit_allocations WHERE customer_identity_id = $1 AND state='pending'",
          [cust],
        )
      )[0].n,
    ).toBe("2");
  }, 60000);

  it("same Purchase verified concurrently under different keys: exactly one wins, the loser is a stale-state error, no 40P01", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    const results = await Promise.allSettled([1, 2, 3].map(() => verify(world, id)));
    expectNoDeadlock(results);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results.filter((r) => r.status === "rejected")) {
      expect((r as PromiseRejectedResult).reason).toMatchObject({
        category: "INVALID_STATE_TRANSITION",
      });
    }
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
    expect(
      await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [
        world.customer.customerId,
      ]),
    ).toBe(1);
  }, 60000);

  it("same Purchase, SAME key concurrently: both resolve to one result", async () => {
    const world = await seedWorld();
    const id = await record(world, 10);
    const key = nextId("key");
    const results = await Promise.allSettled([verify(world, id, key), verify(world, id, key)]);
    expectNoDeadlock(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const ids = results.map(
      (r) => (r as PromiseFulfilledResult<{ verifiedUnit: { id: string } }>).value.verifiedUnit.id,
    );
    expect(ids[0]).toBe(ids[1]);
    expect(await count("SELECT 1 FROM verified_units WHERE purchase_record_id = $1", [id])).toBe(1);
  }, 60000);

  it("different customers of one Business verify concurrently without interference or deadlock", async () => {
    const world = await seedWorld();
    const other = await seedCustomer();
    const mine = await record(world, 10);
    const theirs = await record(world, 10, other);
    const results = await Promise.allSettled([
      verify(world, mine),
      verifyPurchase(db, pool, {
        customerIdentityId: other.customerId,
        request: { purchaseRecordId: theirs },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ]);
    expectNoDeadlock(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await count("SELECT 1 FROM rewards WHERE business_id = $1", [world.businessId])).toBe(2);
  }, 60000);

  it("held re-admission racing a live verify of the same stream: serialises on stream/cycle, no 40P01, conserved", async () => {
    const world = await seedWorld();
    const held = await record(world, 7);
    await holdAsPendingAdmission(held, world.customer.customerId);
    const live = await record(world, 7);
    const results = await Promise.allSettled([admitFromPending(held), verify(world, live)]);
    expectNoDeadlock(results);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const cust = world.customer.customerId;
    expect(await count("SELECT 1 FROM rewards WHERE customer_identity_id = $1", [cust])).toBe(1);
    expect(
      (
        await rows<{ n: string }>(
          "SELECT SUM(allocated_quantity)::text AS n FROM verified_unit_allocations WHERE customer_identity_id = $1",
          [cust],
        )
      )[0].n,
    ).toBe("14");
  }, 60000);
});

// ---------------------------------------------------------------------------
// Boundary (static): no Commercial dependency, no earmark/gate/scheduler schema
// ---------------------------------------------------------------------------

describe("WP-COM-05a — boundary", () => {
  const read = (rel: string) => readFileSync(path.join(__dirname, rel), "utf8");
  const readMigration = () =>
    readFileSync(path.join(migrationsDir, "0026_purchase_pending_admission.sql"), "utf8");

  it("the admission path imports no Commercial module and names no Commercial table", () => {
    for (const f of [
      "admitPurchaseToLoyalty.ts",
      "purchaseAdmissionGate.ts",
      "verifyPurchaseCommand.ts",
    ]) {
      const src = read(f);
      expect(src, f).not.toMatch(
        /domains\/commercial|\/commercial\/|from "\.\.\/\.\.\/commercial|commercial_/i,
      );
      // WP-COM-05b: the verify command names its Purchase-side port, never Commercial types.
      if (f !== "verifyPurchaseCommand.ts")
        expect(src, f).not.toMatch(/earmark|CommercialAdmission/i);
    }
  });

  it("redemption does not use the admission seam", () => {
    const src = read("confirmRedemptionCommand.ts");
    expect(src).not.toMatch(/admitPurchaseToLoyalty|purchaseAdmissionGate|pending_admission/);
  });

  it("migration 0026 alters ONLY purchase_records and adds no earmark/admission/gate/scheduler/read-model schema", () => {
    const sql = readMigration().replace(/--.*$/gm, "");
    expect(sql).not.toMatch(/CREATE\s+TABLE/i);
    expect(sql).not.toMatch(/earmark|commercial_|capacity|reservation|scheduler|retry|gate/i);
    const alters = [...sql.matchAll(/ALTER\s+TABLE\s+(\w+)/gi)].map((m) => m[1]);
    expect(new Set(alters)).toEqual(new Set(["purchase_records"]));
  });
});
