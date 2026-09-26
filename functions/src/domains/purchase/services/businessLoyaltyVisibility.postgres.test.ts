/**
 * Business Reward / Loyalty-Cycle visibility integration tests
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`).
 *
 * Requires BOTH a live PostgreSQL instance and the Firestore Emulator (the
 * authorization gate reads the caller's Business membership from
 * Firestore; the loyalty spine lives in PostgreSQL). Run via:
 *
 *   firebase emulators:exec --only firestore --project demo-11thonus \
 *     "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *      npx vitest run --config vitest.postgres.config.ts businessLoyaltyVisibility"
 *
 * All loyalty state is produced by the real `recordPurchase` →
 * `verifyPurchase` spine (no hand-inserted Cycles or Rewards), so every
 * assertion reads actual persisted Product Truth. The Reward Program
 * create/publish commands are used only as test SETUP, exactly as the
 * existing purchase suite does; the code under test never touches the
 * publication path.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
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
import {
  listAvailableRewardsForBusiness,
  listLoyaltyCycleProgressForBusiness,
} from "./purchaseQueries";
import { PurchaseDomainError } from "../models/purchaseErrors";

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

const app = initializeApp({ projectId: "demo-11thonus" }, "businessLoyaltyVisibilityPostgresTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;

let seq = 0;
let customerSeq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

/** Loyalty Numbers must match /^[A-HJ-NP-Z]{3}[2-9]{3}$/. */
function lnFor(i: number): string {
  const d = (n: number) => String(2 + (((n % 8) + 8) % 8));
  return `BRV${d(i)}${d(i + 3)}${d(i + 5)}`;
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
  pool = createPostgresPool(loadPostgresConfig());
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
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

// ---------------------------------------------------------------------------
// Seeds.
// ---------------------------------------------------------------------------

async function seedBusiness(businessId: string) {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ34567X",
      ownerUserId: `owner_of_${businessId}`,
      displayName: "BRV Cafe",
      status: "trial",
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
}

async function seedMembership(params: {
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
  status?: "active" | "suspended";
}) {
  await db
    .collection("businessMemberships")
    .doc(nextId("mem"))
    .set({
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      status: params.status ?? "active",
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
    occurredAt: "2026-09-26T00:00:00.000Z",
    customerIdentityId: customerId,
    initialAuthenticationReference: {
      referenceId: `authuid_${customerId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-09-26T00:00:00.000Z"),
      createdBy: customerId,
    },
    createdAt: new Date("2026-09-26T00:00:00.000Z"),
    createdBy: customerId,
    idempotencyKey: `create_${suffix}`,
    requestHash: `hash_create_${suffix}`,
  });
  await issueLoyaltyNumberForIdentity(db, {
    eventId: `evt_ln_${suffix}`,
    correlationId: `corr_ln_${suffix}`,
    actor,
    occurredAt: "2026-09-26T00:05:00.000Z",
    customerIdentityId: customerId,
    assignedAt: new Date("2026-09-26T00:05:00.000Z"),
    createdBy: customerId,
    generator: new FixedGenerator(ln),
    idempotencyKey: `key_ln_${suffix}`,
    requestHash: `hash_ln_${suffix}`,
  });
  await issueQrIdentityForIdentity(db, {
    eventId: `evt_qr_${suffix}`,
    correlationId: `corr_qr_${suffix}`,
    actor,
    occurredAt: "2026-09-26T00:10:00.000Z",
    customerIdentityId: customerId,
    loyaltyNumber: ln,
    issuedAt: new Date("2026-09-26T00:10:00.000Z"),
    createdBy: customerId,
    generator: new FixedGenerator(`qrbrv${customerSeq}ref`),
    idempotencyKey: `key_qr_${suffix}`,
    requestHash: `hash_qr_${suffix}`,
  });
  return { customerId, ln };
}

type Program = { programId: string; qualifyingItemId: string; name: string };

async function createPublishedProgram(
  businessId: string,
  ownerId: string,
  name: string,
  rewardDescription: string,
): Promise<Program> {
  const item = await withPlatformTransaction(pool, async (tx) =>
    insertQualifyingItem(tx, {
      businessId,
      name: `${name} item`,
      knowledgeNodeId: null,
      actorId: "test-seed",
    }),
  );
  const created = await createRewardProgram(db, pool, {
    userId: ownerId,
    request: {
      businessId,
      displayName: name,
      rewardProgramCategoryId: null,
      rewardDescription,
      multipleUnitsAllowed: true,
      sharedLoyaltyNumberAllowed: true,
      effectiveFrom: new Date("2026-09-26T00:00:00.000Z"),
      qualifyingItemIds: [item.id],
    } as never,
    idempotencyKey: nextId("key_prog"),
    correlationId: nextId("corr_prog"),
  });
  await publishRewardProgramVersion(db, pool, {
    userId: ownerId,
    request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
    idempotencyKey: nextId("key_pub"),
    correlationId: nextId("corr_pub"),
  });
  return { programId: created.program.id, qualifyingItemId: item.id, name };
}

/** Real spine: record (by the Business) then verify (by the Customer). */
async function earnUnits(params: {
  businessId: string;
  recorderId: string;
  program: Program;
  customer: { customerId: string; ln: string };
  quantity: number;
}) {
  const rec = await recordPurchase(db, pool, {
    userId: params.recorderId,
    request: {
      businessId: params.businessId,
      rewardProgramId: params.program.programId,
      loyaltyNumberValue: params.customer.ln,
      quantity: params.quantity,
      qualifyingItemId: params.program.qualifyingItemId,
      purchaseDate: new Date("2026-09-26T10:00:00.000Z"),
    },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  await verifyPurchase(db, pool, {
    customerIdentityId: params.customer.customerId,
    request: { purchaseRecordId: rec.purchase.id },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
}

/**
 * Two Businesses sharing one Customer:
 * - Business A: programs "Coffee Club" and "Pastry Club"; Owner, Manager,
 *   Staff; customers `progressing` (3 units Coffee + 2 units Pastry),
 *   `rewarded` (12 units Coffee → reward available, 2 pending overflow),
 *   and `idle` (identity only, never transacted).
 * - Business B: program "Juice Club"; Owner; the SAME `progressing`
 *   Customer earns 5 units and a separate customer earns a reward.
 */
async function seedTwoBusinesses() {
  const a = {
    businessId: nextId("bizA"),
    owner: nextId("ownerA"),
    manager: nextId("mgrA"),
    staff: nextId("staffA"),
  };
  const b = { businessId: nextId("bizB"), owner: nextId("ownerB") };
  await seedBusiness(a.businessId);
  await seedBusiness(b.businessId);
  await seedMembership({ userId: a.owner, businessId: a.businessId, role: "owner" });
  await seedMembership({ userId: a.manager, businessId: a.businessId, role: "manager" });
  await seedMembership({ userId: a.staff, businessId: a.businessId, role: "staff" });
  await seedMembership({ userId: b.owner, businessId: b.businessId, role: "owner" });

  const coffee = await createPublishedProgram(
    a.businessId,
    a.owner,
    "Coffee Club",
    "One free coffee",
  );
  const pastry = await createPublishedProgram(
    a.businessId,
    a.owner,
    "Pastry Club",
    "One free pastry",
  );
  const juice = await createPublishedProgram(b.businessId, b.owner, "Juice Club", "One free juice");

  const progressing = await seedCustomer();
  const rewarded = await seedCustomer();
  const idle = await seedCustomer();
  const bRewarded = await seedCustomer();

  await earnUnits({
    businessId: a.businessId,
    recorderId: a.staff,
    program: coffee,
    customer: progressing,
    quantity: 3,
  });
  await earnUnits({
    businessId: a.businessId,
    recorderId: a.staff,
    program: pastry,
    customer: progressing,
    quantity: 2,
  });
  await earnUnits({
    businessId: a.businessId,
    recorderId: a.staff,
    program: coffee,
    customer: rewarded,
    quantity: 12,
  });
  await earnUnits({
    businessId: b.businessId,
    recorderId: b.owner,
    program: juice,
    customer: progressing,
    quantity: 5,
  });
  await earnUnits({
    businessId: b.businessId,
    recorderId: b.owner,
    program: juice,
    customer: bRewarded,
    quantity: 10,
  });

  return { a, b, coffee, pastry, juice, progressing, rewarded, idle, bRewarded };
}

async function tableCounts(): Promise<Record<string, number>> {
  const tables = [
    "rewards",
    "loyalty_cycles",
    "loyalty_cycle_streams",
    "verified_units",
    "verified_unit_allocations",
    "verified_unit_allocation_events",
    "purchase_records",
    "purchase_record_events",
    "trust_events",
    "notification_intents",
    "purchase_outbox",
    "idempotency_keys",
  ];
  const out: Record<string, number> = {};
  for (const table of tables) {
    const r = await pool.query(`SELECT COUNT(*) AS c FROM ${table}`);
    out[table] = Number(r.rows[0].c);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tests.
// ---------------------------------------------------------------------------

describe("listAvailableRewardsForBusiness", () => {
  it("Owner sees exactly this Business's available Rewards with program and Customer Loyalty Number", async () => {
    const s = await seedTwoBusinesses();
    const { rewards } = await listAvailableRewardsForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
    });
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toEqual({
      rewardProgramId: s.coffee.programId,
      rewardProgramName: "Coffee Club",
      customerLoyaltyNumber: s.rewarded.ln,
      rewardDescription: "One free coffee",
      rewardQuantity: 1,
      state: "available",
      availableAt: expect.any(String),
      cycleSequenceNumber: 1,
    });
  });

  it("Manager has the same visibility as the Owner", async () => {
    const s = await seedTwoBusinesses();
    const owner = await listAvailableRewardsForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
    });
    const manager = await listAvailableRewardsForBusiness(db, pool, {
      userId: s.a.manager,
      businessId: s.a.businessId,
    });
    expect(manager).toEqual(owner);
  });

  it("never exposes Customer Identity ids, row ids, or Commerce Knowledge ids", async () => {
    const s = await seedTwoBusinesses();
    const { rewards } = await listAvailableRewardsForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
    });
    const serialized = JSON.stringify(rewards);
    expect(serialized).not.toContain(s.rewarded.customerId);
    for (const key of [
      "customerIdentityId",
      "id",
      "loyaltyCycleId",
      "knowledgeNodeId",
      "businessId",
    ]) {
      expect(rewards[0]).not.toHaveProperty(key);
    }
  });
});

describe("listLoyaltyCycleProgressForBusiness", () => {
  it("returns each Customer's current Cycle with threshold, progress, pending units, and Reward relationship", async () => {
    const s = await seedTwoBusinesses();
    const { cycles } = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
    });
    expect(cycles).toHaveLength(3);
    const find = (programName: string, ln: string) =>
      cycles.find((c) => c.rewardProgramName === programName && c.customerLoyaltyNumber === ln);

    // Customer with no Reward (progressing, two programs).
    expect(find("Coffee Club", s.progressing.ln)).toMatchObject({
      cycleState: "active",
      cycleSequenceNumber: 1,
      allocatedUnits: 3,
      threshold: 10,
      unitsToReward: 7,
      pendingUnits: 0,
      reward: null,
    });
    expect(find("Pastry Club", s.progressing.ln)).toMatchObject({
      cycleState: "active",
      allocatedUnits: 2,
      unitsToReward: 8,
      reward: null,
    });
    // Customer with an available Reward and overflow held pending.
    expect(find("Coffee Club", s.rewarded.ln)).toMatchObject({
      cycleState: "reward_available",
      allocatedUnits: 10,
      threshold: 10,
      unitsToReward: 0,
      pendingUnits: 2,
      reward: {
        state: "available",
        rewardDescription: "One free coffee",
        availableAt: expect.any(String),
      },
    });
    // A Customer who never transacted has no Cycle — nothing is fabricated.
    expect(cycles.some((c) => c.customerLoyaltyNumber === s.idle.ln)).toBe(false);
  });

  it("Manager has the same visibility as the Owner", async () => {
    const s = await seedTwoBusinesses();
    const owner = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
    });
    const manager = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.manager,
      businessId: s.a.businessId,
    });
    expect(manager).toEqual(owner);
  });

  it("filters to one Reward Program within the Business", async () => {
    const s = await seedTwoBusinesses();
    const { cycles } = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
      rewardProgramId: s.pastry.programId,
    });
    expect(cycles.map((c) => c.rewardProgramName)).toEqual(["Pastry Club"]);
  });

  it("paginates with bounded limits", async () => {
    const s = await seedTwoBusinesses();
    const page1 = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
      limit: 2,
    });
    const page2 = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
      limit: 2,
      offset: 2,
    });
    expect(page1.cycles).toHaveLength(2);
    expect(page2.cycles).toHaveLength(1);
    await expect(
      listLoyaltyCycleProgressForBusiness(db, pool, {
        userId: s.a.owner,
        businessId: s.a.businessId,
        limit: 101,
      }),
    ).rejects.toThrow(PurchaseDomainError);
  });
});

describe("authorization — Owner/Manager only, fail closed", () => {
  it("rejects Staff for both reads", async () => {
    const s = await seedTwoBusinesses();
    await expect(
      listAvailableRewardsForBusiness(db, pool, { userId: s.a.staff, businessId: s.a.businessId }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    await expect(
      listLoyaltyCycleProgressForBusiness(db, pool, {
        userId: s.a.staff,
        businessId: s.a.businessId,
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("rejects a caller with no membership, an unknown Business, and a suspended Manager", async () => {
    const s = await seedTwoBusinesses();
    const stranger = nextId("stranger");
    await expect(
      listAvailableRewardsForBusiness(db, pool, { userId: stranger, businessId: s.a.businessId }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    await expect(
      listLoyaltyCycleProgressForBusiness(db, pool, {
        userId: s.a.owner,
        businessId: nextId("nobiz"),
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    const suspended = nextId("suspendedMgr");
    await seedMembership({
      userId: suspended,
      businessId: s.a.businessId,
      role: "manager",
      status: "suspended",
    });
    await expect(
      listLoyaltyCycleProgressForBusiness(db, pool, {
        userId: suspended,
        businessId: s.a.businessId,
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });
});

describe("tenant isolation — cross-Business reads fail or exclude foreign data", () => {
  it("an Owner of Business B cannot read Business A", async () => {
    const s = await seedTwoBusinesses();
    await expect(
      listAvailableRewardsForBusiness(db, pool, { userId: s.b.owner, businessId: s.a.businessId }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    await expect(
      listLoyaltyCycleProgressForBusiness(db, pool, {
        userId: s.b.owner,
        businessId: s.a.businessId,
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("a shared Customer's progress at Business B never appears in Business A's results, and vice versa", async () => {
    const s = await seedTwoBusinesses();
    const aCycles = (
      await listLoyaltyCycleProgressForBusiness(db, pool, {
        userId: s.a.owner,
        businessId: s.a.businessId,
      })
    ).cycles;
    const aRewards = (
      await listAvailableRewardsForBusiness(db, pool, {
        userId: s.a.owner,
        businessId: s.a.businessId,
      })
    ).rewards;
    expect(
      aCycles.some(
        (c) => c.rewardProgramName === "Juice Club" || c.rewardProgramId === s.juice.programId,
      ),
    ).toBe(false);
    expect(aCycles.some((c) => c.allocatedUnits === 5)).toBe(false);
    expect(aRewards.some((r) => r.customerLoyaltyNumber === s.bRewarded.ln)).toBe(false);

    const bCycles = (
      await listLoyaltyCycleProgressForBusiness(db, pool, {
        userId: s.b.owner,
        businessId: s.b.businessId,
      })
    ).cycles;
    const bRewards = (
      await listAvailableRewardsForBusiness(db, pool, {
        userId: s.b.owner,
        businessId: s.b.businessId,
      })
    ).rewards;
    expect(bCycles.map((c) => c.rewardProgramName).sort()).toEqual(["Juice Club", "Juice Club"]);
    expect(bCycles.find((c) => c.customerLoyaltyNumber === s.progressing.ln)?.allocatedUnits).toBe(
      5,
    );
    expect(bRewards.map((r) => r.customerLoyaltyNumber)).toEqual([s.bRewarded.ln]);
  });

  it("filtering by another Business's Reward Program id returns nothing (the filter never widens scope)", async () => {
    const s = await seedTwoBusinesses();
    const cycles = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
      rewardProgramId: s.juice.programId,
    });
    const rewards = await listAvailableRewardsForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
      rewardProgramId: s.juice.programId,
    });
    expect(cycles.cycles).toEqual([]);
    expect(rewards.rewards).toEqual([]);
  });
});

describe("read-only and deterministic", () => {
  it("returns identical results on repeated reads and writes nothing", async () => {
    const s = await seedTwoBusinesses();
    const before = await tableCounts();
    const first = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
    });
    const second = await listLoyaltyCycleProgressForBusiness(db, pool, {
      userId: s.a.owner,
      businessId: s.a.businessId,
    });
    const r1 = await listAvailableRewardsForBusiness(db, pool, {
      userId: s.a.manager,
      businessId: s.a.businessId,
    });
    const r2 = await listAvailableRewardsForBusiness(db, pool, {
      userId: s.a.manager,
      businessId: s.a.businessId,
    });
    expect(second).toEqual(first);
    expect(r2).toEqual(r1);
    expect(await tableCounts()).toEqual(before);
  });

  it("a Business with no loyalty activity reads as empty, not as an error", async () => {
    const businessId = nextId("bizEmpty");
    const owner = nextId("ownerEmpty");
    await seedBusiness(businessId);
    await seedMembership({ userId: owner, businessId, role: "owner" });
    expect(await listAvailableRewardsForBusiness(db, pool, { userId: owner, businessId })).toEqual({
      rewards: [],
    });
    expect(
      await listLoyaltyCycleProgressForBusiness(db, pool, { userId: owner, businessId }),
    ).toEqual({ cycles: [] });
  });
});
