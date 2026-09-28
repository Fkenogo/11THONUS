/**
 * Capability 6 — redemption/verify lock-ordering regression tests
 * (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-002`, finding N1).
 *
 * The reproduced independent-review failure is a real PostgreSQL `40P01`
 * deadlock between:
 *
 * - Transaction A (redemption, OLD order): `lockRewardById` (`FOR UPDATE`
 *   on the Reward) → `transitionRewardToRedeemed` → `insertRedemption`
 *   (which takes a KEY-SHARE lock on the governing Cycle through its FKs)
 *   → THEN `ensureAndLockCycleStream` (waits for the stream);
 * - Transaction B (verify, canonical order): `ensureAndLockCycleStream`
 *   (holds the stream) → `lockCurrentCycle` (`FOR UPDATE` on the same
 *   Cycle — conflicts with A's key-share, waits).
 *
 * A holds Reward + key-share(Cycle) and wants Stream; B holds Stream and
 * wants Cycle: a lock-order cycle, and PostgreSQL aborts one side with
 * `40P01`. The command's own comment previously claimed "no code path
 * takes stream before reward, so there is no cycle in the lock graph" —
 * that was false: every verify takes stream before its reward insert.
 *
 * The correction aligns redemption with the canonical global lock order
 * (idempotency → purchase → stream → cycle → reward → appends): a
 * non-locking peek discovers the stream/cycle keys, then the transaction
 * takes stream → governing cycle → Reward, so both paths serialize on the
 * stream in the same order and no cycle can form.
 *
 * What this file proves, deterministically (no timing-only sleeps — every
 * "wait" below is a guaranteed lock-block, with `lock_timeout` converting
 * any hang into a loud failure instead of a stuck suite):
 *
 * - T1a/T1b: both valid serializations (verify-first, redemption-first),
 *   executed through the REAL repository helpers, commit cleanly;
 * - T1c: true concurrency — B really blocks on the stream A holds, then
 *   resolves once A commits — with no `40P01` and a coherent end state;
 * - T2: the OLD lock order, scripted manually, reproduces the reported
 *   `40P01` on this live database — proving the harness can produce the
 *   finding and the new order eliminates it.
 *
 * Coherence asserted everywhere: no `40P01` on the new order, both sides
 * commit, the Reward is redeemed exactly once, the governing Cycle is
 * closed, exactly one current Cycle remains, no duplicate Reward/cycle/
 * allocation, and allocation conservation holds.
 *
 * Requires BOTH a live PostgreSQL instance and the Firestore Emulator
 * (program/purchase setup runs the real commands). Run via:
 *
 *   firebase emulators:exec --only firestore --project demo-11thonus \
 *     "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *      npx vitest run --config vitest.postgres.config.ts confirmRedemptionLockOrder"
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
  type PoolClient,
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
  lockPurchaseRecordById,
  transitionPurchaseToVerified,
  appendPurchaseRecordEvent,
} from "../repositories/purchaseRecordRepository";
import { insertVerifiedUnitCredit } from "../repositories/verifiedUnitRepository";
import {
  LOYALTY_CYCLE_THRESHOLD,
  adoptCycleGoverningVersionForFirstAllocation,
  ensureAndLockCycleStream,
  lockCurrentCycle,
  lockCycleById,
  openCycleUnderStreamLock,
  addAllocatedUnitsToCycle,
  markCycleRewardRedeemed,
  listPendingAllocationPositions,
  convertPendingPositionToAllocated,
  getCycleById,
  insertAllocationPosition,
  appendAllocationEvent,
} from "../repositories/loyaltyCycleRepository";
import {
  lockRewardById,
  peekRewardScopeById,
  transitionRewardToRedeemed,
  insertRedemption,
} from "../repositories/redemptionRepository";

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

const app = initializeApp({ projectId: "demo-11thonus" }, "confirmRedemptionLockOrderTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;

let seq = 0;
let customerSeq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

/** Loyalty Numbers must match /^[A-HJ-NP-Z]{3}[2-9]{3}$/. */
function lnFor(i: number): string {
  const d = (n: number) => String(2 + (((n % 8) + 8) % 8));
  return `CRD${d(i)}${d(i + 3)}${d(i + 5)}`;
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
// Seeds (real commands only — the available Reward is earned, never inserted).
// ---------------------------------------------------------------------------

async function seedBusiness(businessId: string) {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ45678X",
      ownerUserId: `owner_of_${businessId}`,
      displayName: "CRD Cafe",
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
    generator: new FixedGenerator(`qrcrd${customerSeq}ref`),
    idempotencyKey: `key_qr_${suffix}`,
    requestHash: `hash_qr_${suffix}`,
  });
  return { customerId, ln };
}

type Program = { programId: string; qualifyingItemId: string };

async function createPublishedProgram(
  businessId: string,
  ownerId: string,
  name: string,
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
    userId: ownerId,
    request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
    idempotencyKey: nextId("key_pub"),
    correlationId: nextId("corr_pub"),
  });
  return { programId: created.program.id, qualifyingItemId: item.id };
}

type World = {
  businessId: string;
  owner: string;
  program: Program;
  customer: { customerId: string; ln: string };
  rewardId: string;
  cycleId: string;
};

async function seedWorldWithAvailableReward(): Promise<World> {
  const businessId = nextId("biz");
  const owner = `owner_of_${businessId}`;
  await seedBusiness(businessId);
  const program = await createPublishedProgram(businessId, owner, "Lock Order Club");
  const customer = await seedCustomer();
  // Earn 10 through the real spine: record (Business) then verify (Customer).
  const rec = await recordPurchase(db, pool, {
    userId: owner,
    request: {
      businessId,
      rewardProgramId: program.programId,
      loyaltyNumberValue: customer.ln,
      quantity: 10,
      qualifyingItemId: program.qualifyingItemId,
      purchaseDate: new Date("2026-09-28T10:00:00.000Z"),
    },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  await verifyPurchase(db, pool, {
    customerIdentityId: customer.customerId,
    request: { purchaseRecordId: rec.purchase.id },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  const reward = await pool.query<{ id: string; loyalty_cycle_id: string; state: string }>(
    `SELECT id, loyalty_cycle_id, state FROM rewards WHERE customer_identity_id = $1`,
    [customer.customerId],
  );
  expect(reward.rows).toHaveLength(1);
  expect(reward.rows[0].state).toBe("available");
  return {
    businessId,
    owner,
    program,
    customer,
    rewardId: reward.rows[0].id,
    cycleId: reward.rows[0].loyalty_cycle_id,
  };
}

/** Pre-records a waiting Purchase for B's scripted verify (real command, its own transaction). */
async function prerecordPurchase(world: World, quantity: number): Promise<string> {
  const rec = await recordPurchase(db, pool, {
    userId: world.owner,
    request: {
      businessId: world.businessId,
      rewardProgramId: world.program.programId,
      loyaltyNumberValue: world.customer.ln,
      quantity,
      qualifyingItemId: world.program.qualifyingItemId,
      purchaseDate: new Date("2026-09-28T11:00:00.000Z"),
    },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  return rec.purchase.id;
}

// ---------------------------------------------------------------------------
// Scripted transaction bodies — the REAL repository helpers, in the order
// the corrected commands take their locks. Firestore re-authorization is
// deliberately absent: it takes no PostgreSQL lock and therefore cannot
// participate in lock ordering either way.
// ---------------------------------------------------------------------------

/** Guard: any lock-wait longer than this fails loudly instead of hanging the suite. */
async function beginGuarded(client: PoolClient): Promise<void> {
  await client.query("BEGIN");
  await client.query("SET LOCAL lock_timeout = '10s'");
}

/**
 * Transaction A: the redemption PostgreSQL footprint in canonical order
 * (stream → governing cycle → Reward → dependent writes). No pending units
 * exist in this harness, so the forward-allocation loop is trivially empty
 * and the next Cycle opens under the completed Cycle's provisional version.
 */
async function runScriptedRedemption(
  client: PoolClient,
  world: World,
  opts?: { readonly onStreamLocked?: () => void },
): Promise<{ nextCycleId: string }> {
  await beginGuarded(client);
  try {
    const peeked = await peekRewardScopeById(client, {
      rewardId: world.rewardId,
      businessId: world.businessId,
    });
    if (!peeked) {
      throw new Error("scripted redemption: reward peek missed");
    }
    await ensureAndLockCycleStream(client, {
      businessId: peeked.businessId,
      customerIdentityId: peeked.customerIdentityId,
      rewardProgramId: peeked.rewardProgramId,
    });
    opts?.onStreamLocked?.();
    const governing = await lockCycleById(client, peeked.loyaltyCycleId);
    if (!governing) {
      throw new Error("scripted redemption: governing cycle missed");
    }
    const locked = await lockRewardById(client, world.rewardId);
    if (!locked || locked.businessId !== world.businessId || locked.state !== "available") {
      throw new Error("scripted redemption: locked-row check failed");
    }
    const reward = await transitionRewardToRedeemed(client, {
      rewardId: world.rewardId,
      redeemedAt: new Date(),
    });
    if (!reward) {
      throw new Error("scripted redemption: conditional transition lost");
    }
    await insertRedemption(client, {
      rewardId: reward.id,
      loyaltyCycleId: reward.loyaltyCycleId,
      businessId: reward.businessId,
      customerIdentityId: reward.customerIdentityId,
      rewardProgramId: reward.rewardProgramId,
      rewardProgramVersionId: reward.rewardProgramVersionId,
      confirmedByUserId: world.owner,
      confirmedByMembershipId: "scripted-membership",
      confirmedByRole: "owner",
      idempotencyKey: nextId("scripted_redemption"),
      correlationId: nextId("scripted_corr"),
    });
    const completed = await markCycleRewardRedeemed(client, reward.loyaltyCycleId);
    if (!completed) {
      throw new Error("scripted redemption: conditional cycle close lost");
    }
    const pending = await listPendingAllocationPositions(client, {
      customerIdentityId: reward.customerIdentityId,
      rewardProgramId: reward.rewardProgramId,
    });
    const next = await openCycleUnderStreamLock(client, {
      businessId: reward.businessId,
      customerIdentityId: reward.customerIdentityId,
      rewardProgramId: reward.rewardProgramId,
      openedUnderVersionId:
        pending.length > 0 ? pending[0].rewardProgramVersionId : completed.openedUnderVersionId,
      correlationId: nextId("scripted_corr"),
    });
    for (const position of pending) {
      const converted = await convertPendingPositionToAllocated(client, {
        position,
        loyaltyCycleId: next.id,
        quantity: position.allocatedQuantity,
        correlationId: nextId("scripted_corr"),
      });
      void converted;
      await addAllocatedUnitsToCycle(client, {
        cycleId: next.id,
        units: position.allocatedQuantity,
      });
    }
    await client.query("COMMIT");
    return { nextCycleId: next.id };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

/**
 * Transaction B: the verify PostgreSQL footprint in canonical order
 * (purchase → stream → cycle → allocation writes), replicating the verify
 * command's allocation faithfully (first-allocation version adoption,
 * capacity math, allocated/pending split).
 */
async function runScriptedVerify(
  client: PoolClient,
  params: { purchaseId: string; customerId: string },
): Promise<{ cycleId: string }> {
  await beginGuarded(client);
  try {
    const lockedPurchase = await lockPurchaseRecordById(client, params.purchaseId);
    if (!lockedPurchase || lockedPurchase.status !== "waiting_for_customer") {
      throw new Error("scripted verify: purchase lock/check failed");
    }
    const purchase =
      (await transitionPurchaseToVerified(client, {
        purchaseId: params.purchaseId,
        verifiedAt: new Date(),
      })) ?? lockedPurchase;
    await appendPurchaseRecordEvent(client, {
      purchaseRecordId: purchase.id,
      fromStatus: "waiting_for_customer",
      toStatus: "verified",
      actorType: "customer",
      actorId: params.customerId,
      reason: null,
      eventPayload: null,
      correlationId: nextId("scripted_corr"),
    });
    const verifiedUnit = await insertVerifiedUnitCredit(client, {
      purchaseRecordId: purchase.id,
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      rewardProgramId: purchase.rewardProgramId,
      rewardProgramVersionId: purchase.rewardProgramVersionId,
      quantity: purchase.quantity,
      reasonCode: "purchase_verified",
      correlationId: nextId("scripted_corr"),
      createdBy: params.customerId,
    });
    await ensureAndLockCycleStream(client, {
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      rewardProgramId: purchase.rewardProgramId,
    });
    let cycle = await lockCurrentCycle(client, {
      customerIdentityId: purchase.customerIdentityId,
      rewardProgramId: purchase.rewardProgramId,
    });
    if (!cycle) {
      throw new Error("scripted verify: expected a current cycle in this harness");
    }
    if (
      cycle.allocatedUnits === 0 &&
      cycle.openedUnderVersionId !== purchase.rewardProgramVersionId
    ) {
      const adopted = await adoptCycleGoverningVersionForFirstAllocation(client, {
        cycleId: cycle.id,
        versionId: purchase.rewardProgramVersionId,
      });
      if (!adopted) {
        throw new Error("scripted verify: first-allocation adoption failed");
      }
      cycle = adopted;
    }
    let allocatedNow = 0;
    let pendingNow = purchase.quantity;
    if (cycle.state === "active") {
      const room = LOYALTY_CYCLE_THRESHOLD - cycle.allocatedUnits;
      allocatedNow = Math.min(purchase.quantity, Math.max(room, 0));
      pendingNow = purchase.quantity - allocatedNow;
    }
    let allocationOrder = 0;
    if (allocatedNow > 0) {
      const position = await insertAllocationPosition(client, {
        verifiedUnitId: verifiedUnit.id,
        loyaltyCycleId: cycle.id,
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        rewardProgramId: purchase.rewardProgramId,
        rewardProgramVersionId: purchase.rewardProgramVersionId,
        allocatedQuantity: allocatedNow,
        allocationOrder,
        state: "allocated",
      });
      allocationOrder += 1;
      await appendAllocationEvent(client, {
        allocationPositionId: position.id,
        verifiedUnitId: verifiedUnit.id,
        fromState: "none",
        toState: "allocated",
        fromCycleId: null,
        toCycleId: cycle.id,
        quantity: allocatedNow,
        reason: "initial_placement",
        correlationId: nextId("scripted_corr"),
      });
      cycle = await addAllocatedUnitsToCycle(client, { cycleId: cycle.id, units: allocatedNow });
    }
    if (pendingNow > 0) {
      const position = await insertAllocationPosition(client, {
        verifiedUnitId: verifiedUnit.id,
        loyaltyCycleId: null,
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        rewardProgramId: purchase.rewardProgramId,
        rewardProgramVersionId: purchase.rewardProgramVersionId,
        allocatedQuantity: pendingNow,
        allocationOrder,
        state: "pending",
      });
      await appendAllocationEvent(client, {
        allocationPositionId: position.id,
        verifiedUnitId: verifiedUnit.id,
        fromState: "none",
        toState: "pending",
        fromCycleId: null,
        toCycleId: null,
        quantity: pendingNow,
        reason: "initial_placement",
        correlationId: nextId("scripted_corr"),
      });
    }
    await client.query("COMMIT");
    return { cycleId: cycle.id };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

/** End-state coherence both serializations must satisfy. */
async function assertCoherentSerialization(params: {
  customerId: string;
  rewardId: string;
  governingCycleId: string;
}): Promise<void> {
  const reward = await pool.query<{ state: string }>(`SELECT state FROM rewards WHERE id = $1`, [
    params.rewardId,
  ]);
  expect(reward.rows[0].state).toBe("redeemed");

  const redemptions = await pool.query<{ count: string }>(
    `SELECT count(*) FROM redemptions WHERE reward_id = $1`,
    [params.rewardId],
  );
  expect(Number(redemptions.rows[0].count)).toBe(1);

  const governing = await pool.query<{ state: string; allocated_units: number }>(
    `SELECT state, allocated_units FROM loyalty_cycles WHERE id = $1`,
    [params.governingCycleId],
  );
  expect(governing.rows[0]).toEqual({ state: "reward_redeemed", allocated_units: 10 });

  const current = await pool.query<{ count: string }>(
    `SELECT count(*) FROM loyalty_cycles
      WHERE customer_identity_id = $1 AND state IN ('active','reward_available')`,
    [params.customerId],
  );
  expect(Number(current.rows[0].count)).toBe(1);

  const rewardsPerCycle = await pool.query<{ max_count: string }>(
    `SELECT COALESCE(MAX(c), 0) AS max_count FROM
       (SELECT count(*) AS c FROM rewards GROUP BY loyalty_cycle_id) t`,
    [],
  );
  expect(Number(rewardsPerCycle.rows[0].max_count)).toBeLessThanOrEqual(1);

  const allocatedSum = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(allocated_quantity),0) AS total FROM verified_unit_allocations
      WHERE customer_identity_id = $1`,
    [params.customerId],
  );
  const creditSum = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(quantity),0) AS total FROM verified_units WHERE customer_identity_id = $1`,
    [params.customerId],
  );
  expect(Number(allocatedSum.rows[0].total)).toBe(Number(creditSum.rows[0].total));
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe("redemption/verify lock ordering (CORR-002 N1)", () => {
  it("T1a — verify-first serialization: both commit, no 40P01, coherent end state", async () => {
    const world = await seedWorldWithAvailableReward();
    const purchaseId = await prerecordPurchase(world, 2);

    const clientB = await pool.connect();
    const clientA = await pool.connect();
    try {
      // B (verify) runs first and commits: the full cycle is current, so
      // its 2 units wait as pending.
      const b = await runScriptedVerify(clientB, {
        purchaseId,
        customerId: world.customer.customerId,
      });
      expect(b.cycleId).toBe(world.cycleId);
      // A (redemption) then closes the cycle and forward-allocates B's
      // pending units into the next cycle.
      const a = await runScriptedRedemption(clientA, world);
      const next = await getCycleById(pool, a.nextCycleId);
      expect(next?.allocatedUnits).toBe(2);
      await assertCoherentSerialization({
        customerId: world.customer.customerId,
        rewardId: world.rewardId,
        governingCycleId: world.cycleId,
      });
    } finally {
      clientB.release();
      clientA.release();
    }
  });

  it("T1b — redemption-first serialization: both commit, no 40P01, coherent end state", async () => {
    const world = await seedWorldWithAvailableReward();
    const purchaseId = await prerecordPurchase(world, 2);

    const clientA = await pool.connect();
    const clientB = await pool.connect();
    try {
      // A (redemption) runs first: the next cycle opens empty.
      const a = await runScriptedRedemption(clientA, world);
      // B (verify) then allocates its 2 units directly into that next cycle.
      const b = await runScriptedVerify(clientB, {
        purchaseId,
        customerId: world.customer.customerId,
      });
      expect(b.cycleId).toBe(a.nextCycleId);
      const next = await getCycleById(pool, a.nextCycleId);
      expect(next?.allocatedUnits).toBe(2);
      await assertCoherentSerialization({
        customerId: world.customer.customerId,
        rewardId: world.rewardId,
        governingCycleId: world.cycleId,
      });
    } finally {
      clientA.release();
      clientB.release();
    }
  });

  it("T1c — true concurrency: B blocks on A's stream lock, then both resolve with no 40P01", async () => {
    const world = await seedWorldWithAvailableReward();
    const purchaseId = await prerecordPurchase(world, 2);

    const clientA = await pool.connect();
    const clientB = await pool.connect();
    try {
      // A takes the stream lock, then pauses while still holding it.
      await beginGuarded(clientA);
      const peeked = await peekRewardScopeById(clientA, {
        rewardId: world.rewardId,
        businessId: world.businessId,
      });
      expect(peeked).not.toBeNull();
      await ensureAndLockCycleStream(clientA, {
        businessId: world.businessId,
        customerIdentityId: world.customer.customerId,
        rewardProgramId: world.program.programId,
      });

      // B starts while A holds the stream: its stream lock CANNOT grant
      // until A commits — a guaranteed lock-block, not a sleep. If B ever
      // completed here, A would not be holding the stream (a real bug).
      const bPromise = runScriptedVerify(clientB, {
        purchaseId,
        customerId: world.customer.customerId,
      });
      const raced = await Promise.race([
        bPromise.then(
          () => "completed" as const,
          (error: unknown) => {
            throw error;
          },
        ),
        delay(400).then(() => "waiting" as const),
      ]);
      expect(raced).toBe("waiting");

      // A completes the redemption while B waits, then releases the stream.
      const governing = await lockCycleById(clientA, world.cycleId);
      expect(governing).not.toBeNull();
      const locked = await lockRewardById(clientA, world.rewardId);
      expect(locked?.state).toBe("available");
      await transitionRewardToRedeemed(clientA, {
        rewardId: world.rewardId,
        redeemedAt: new Date(),
      });
      await insertRedemption(clientA, {
        rewardId: world.rewardId,
        loyaltyCycleId: world.cycleId,
        businessId: world.businessId,
        customerIdentityId: world.customer.customerId,
        rewardProgramId: world.program.programId,
        rewardProgramVersionId: locked!.rewardProgramVersionId,
        confirmedByUserId: world.owner,
        confirmedByMembershipId: "scripted-membership",
        confirmedByRole: "owner",
        idempotencyKey: nextId("scripted_redemption"),
        correlationId: nextId("scripted_corr"),
      });
      await markCycleRewardRedeemed(clientA, world.cycleId);
      const next = await openCycleUnderStreamLock(clientA, {
        businessId: world.businessId,
        customerIdentityId: world.customer.customerId,
        rewardProgramId: world.program.programId,
        openedUnderVersionId: locked!.rewardProgramVersionId,
        correlationId: nextId("scripted_corr"),
      });
      await clientA.query("COMMIT");

      // B unblocks and resolves — no 40P01, no indefinite wait (the 10s
      // lock_timeout above would already have failed loudly on a hang).
      const b = await bPromise;
      expect(b.cycleId).toBe(next.id);
      await assertCoherentSerialization({
        customerId: world.customer.customerId,
        rewardId: world.rewardId,
        governingCycleId: world.cycleId,
      });
    } finally {
      clientA.release();
      clientB.release();
    }
  });

  it("T2 — the OLD order reproduces the reported 40P01 on this database", async () => {
    const world = await seedWorldWithAvailableReward();

    const clientA = await pool.connect();
    const clientB = await pool.connect();
    try {
      // A (OLD redemption order): Reward lock → transition → redemption
      // evidence insert — which now holds a KEY-SHARE lock on the governing
      // cycle — but has NOT taken the stream lock yet.
      await clientA.query("BEGIN");
      await clientA.query("SET LOCAL lock_timeout = '10s'");
      await clientA.query("SET LOCAL deadlock_timeout = '200ms'");
      await lockRewardById(clientA, world.rewardId);
      await transitionRewardToRedeemed(clientA, {
        rewardId: world.rewardId,
        redeemedAt: new Date(),
      });
      const rewardRow = await pool.query<{
        loyalty_cycle_id: string;
        reward_program_version_id: string;
      }>(`SELECT loyalty_cycle_id, reward_program_version_id FROM rewards WHERE id = $1`, [
        world.rewardId,
      ]);
      await insertRedemption(clientA, {
        rewardId: world.rewardId,
        loyaltyCycleId: rewardRow.rows[0].loyalty_cycle_id,
        businessId: world.businessId,
        customerIdentityId: world.customer.customerId,
        rewardProgramId: world.program.programId,
        rewardProgramVersionId: rewardRow.rows[0].reward_program_version_id,
        confirmedByUserId: world.owner,
        confirmedByMembershipId: "scripted-membership",
        confirmedByRole: "owner",
        idempotencyKey: nextId("scripted_redemption"),
        correlationId: nextId("scripted_corr"),
      });

      // B (verify order): takes the stream (free — A never took it), then
      // requests the governing cycle FOR UPDATE, which conflicts with A's
      // key-share and BLOCKS. Issued without awaiting: the promise stays
      // pending until the deadlock detector fires.
      await clientB.query("BEGIN");
      await clientB.query("SET LOCAL lock_timeout = '10s'");
      await clientB.query("SET LOCAL deadlock_timeout = '200ms'");
      await ensureAndLockCycleStream(clientB, {
        businessId: world.businessId,
        customerIdentityId: world.customer.customerId,
        rewardProgramId: world.program.programId,
      });
      const bCycleRequest = lockCurrentCycle(clientB, {
        customerIdentityId: world.customer.customerId,
        rewardProgramId: world.program.programId,
      });

      // A now requests the stream B holds: A waits on B, B waits on A.
      // PostgreSQL MUST report 40P01 on one of them — that is the exact
      // independent-review reproduction.
      const aStreamRequest = ensureAndLockCycleStream(clientA, {
        businessId: world.businessId,
        customerIdentityId: world.customer.customerId,
        rewardProgramId: world.program.programId,
      });
      const [aSettled, bSettled] = await Promise.allSettled([aStreamRequest, bCycleRequest]);
      const codes = [aSettled, bSettled]
        .filter((settled): settled is PromiseRejectedResult => settled.status === "rejected")
        .map((settled) => (settled.reason as { code?: string }).code);
      expect(codes).toContain("40P01");
    } finally {
      // Both transactions are test-only: roll back whatever survived so no
      // scripted write leaks into the shared test database.
      await clientA.query("ROLLBACK").catch(() => undefined);
      await clientB.query("ROLLBACK").catch(() => undefined);
      clientA.release();
      clientB.release();
    }

    // Nothing committed: the Reward is still available, its Cycle is still
    // the current one, and no redemption evidence exists.
    const reward = await pool.query<{ state: string }>(`SELECT state FROM rewards WHERE id = $1`, [
      world.rewardId,
    ]);
    expect(reward.rows[0].state).toBe("available");
    const redemptions = await pool.query<{ count: string }>(
      `SELECT count(*) FROM redemptions WHERE reward_id = $1`,
      [world.rewardId],
    );
    expect(Number(redemptions.rows[0].count)).toBe(0);
    const current = await pool.query<{ count: string }>(
      `SELECT count(*) FROM loyalty_cycles
        WHERE customer_identity_id = $1 AND state IN ('active','reward_available')`,
      [world.customer.customerId],
    );
    expect(Number(current.rows[0].count)).toBe(1);
  });
});
