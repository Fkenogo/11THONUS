/**
 * Capability 6 — Business redemption confirmation integration tests
 * (`CAPABILITY-6-REDEMPTION-ENGINE-001`, `DEC-LOY-018`).
 *
 * Requires BOTH a live PostgreSQL instance and the Firestore Emulator (the
 * LIVE `redemption.confirm` permission evaluation reads the caller's
 * Business membership and its overrides from Firestore; the loyalty and
 * redemption spine lives in PostgreSQL). Run via:
 *
 *   firebase emulators:exec --only firestore --project demo-11thonus \
 *     "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *      npx vitest run --config vitest.postgres.config.ts confirmRedemption"
 *
 * Every available Reward under test is produced by the real
 * `recordPurchase` → `verifyPurchase` spine (no hand-inserted Cycles or
 * Rewards), so every assertion reads actual persisted Product Truth. The
 * Reward Program create/publish commands appear only as test SETUP — the
 * code under test never touches the publication path, which is why
 * PB-013B P3-3 stays `OPEN / UNRESOLVED` and untouched by this package.
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
import { createNextRewardProgramVersion } from "../../rewardProgram/services/createNextRewardProgramVersionCommand";
import { publishRewardProgramVersion } from "../../rewardProgram/services/publishRewardProgramVersionCommand";
import { insertQualifyingItem } from "../../qualifyingItem/repositories/qualifyingItemRepository";
import { recordPurchase } from "./recordPurchaseCommand";
import { verifyPurchase } from "./verifyPurchaseCommand";
import { confirmRedemption } from "./confirmRedemptionCommand";
import { getRedemptionByRewardId } from "../repositories/redemptionRepository";
import {
  listAvailableRewardsForCustomer,
  listAvailableRewardsForBusiness,
} from "./purchaseQueries";

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

const app = initializeApp({ projectId: "demo-11thonus" }, "confirmRedemptionPostgresTest");
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
  // `0020`: `redemptions` references `rewards`, so it is cleared first.
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
// Seeds.
// ---------------------------------------------------------------------------

async function seedBusiness(businessId: string, status = "active") {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ45678X",
      ownerUserId: `owner_of_${businessId}`,
      displayName: "CRD Cafe",
      status,
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

/**
 * Seeds a Business membership, optionally with a live `redemption.confirm`
 * override, written in the established persisted `permissions[]` shape so
 * the LIVE evaluator resolves it exactly as the governed
 * `staff.assignPermissions` command would have written it.
 */
async function seedMembership(params: {
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
  status?: "active" | "suspended";
  override?: { direction: "grant" | "revoke"; permissionId?: string };
}): Promise<string> {
  const membershipId = nextId("mem");
  await db
    .collection("businessMemberships")
    .doc(membershipId)
    .set({
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      status: params.status ?? "active",
      permissions: params.override
        ? [
            {
              permissionId: params.override.permissionId ?? "redemption.confirm",
              direction: params.override.direction,
              grantedBy: "user-seeder",
              grantedAt: new Date("2026-09-27T00:00:00.000Z"),
            },
          ]
        : [],
    });
  return membershipId;
}

/** Replaces a membership's override — single-record override semantics. */
async function setOverride(membershipId: string, direction: "grant" | "revoke") {
  await db
    .collection("businessMemberships")
    .doc(membershipId)
    .set(
      {
        permissions: [
          {
            permissionId: "redemption.confirm",
            direction,
            grantedBy: "user-seeder",
            grantedAt: new Date("2026-09-27T00:00:00.000Z"),
          },
        ],
      },
      { merge: true },
    );
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
    occurredAt: "2026-09-27T00:00:00.000Z",
    customerIdentityId: customerId,
    initialAuthenticationReference: {
      referenceId: `authuid_${customerId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-09-27T00:00:00.000Z"),
      createdBy: customerId,
    },
    createdAt: new Date("2026-09-27T00:00:00.000Z"),
    createdBy: customerId,
    idempotencyKey: `create_${suffix}`,
    requestHash: `hash_create_${suffix}`,
  });
  await issueLoyaltyNumberForIdentity(db, {
    eventId: `evt_ln_${suffix}`,
    correlationId: `corr_ln_${suffix}`,
    actor,
    occurredAt: "2026-09-27T00:05:00.000Z",
    customerIdentityId: customerId,
    assignedAt: new Date("2026-09-27T00:05:00.000Z"),
    createdBy: customerId,
    generator: new FixedGenerator(ln),
    idempotencyKey: `key_ln_${suffix}`,
    requestHash: `hash_ln_${suffix}`,
  });
  await issueQrIdentityForIdentity(db, {
    eventId: `evt_qr_${suffix}`,
    correlationId: `corr_qr_${suffix}`,
    actor,
    occurredAt: "2026-09-27T00:10:00.000Z",
    customerIdentityId: customerId,
    loyaltyNumber: ln,
    issuedAt: new Date("2026-09-27T00:10:00.000Z"),
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
      effectiveFrom: new Date("2026-09-27T00:00:00.000Z"),
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
      purchaseDate: new Date("2026-09-27T10:00:00.000Z"),
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

type World = {
  businessId: string;
  owner: string;
  manager: string;
  staff: string;
  ownerMembershipId: string;
  program: Program;
  customer: { customerId: string; ln: string };
};

/** One Business, its three roles, a published program, and one earned reward. */
async function seedWorld(): Promise<World> {
  const businessId = nextId("biz");
  const owner = nextId("owner");
  const manager = nextId("mgr");
  const staff = nextId("staff");
  await seedBusiness(businessId);
  const ownerMembershipId = await seedMembership({ userId: owner, businessId, role: "owner" });
  await seedMembership({ userId: manager, businessId, role: "manager" });
  await seedMembership({ userId: staff, businessId, role: "staff" });
  const program = await createPublishedProgram(businessId, owner, "Redemption Club", "Free Coffee");
  const customer = await seedCustomer();
  await earnUnits({ businessId, recorderId: owner, program, customer, quantity: 10 });
  return { businessId, owner, manager, staff, ownerMembershipId, program, customer };
}

/** The world's single available Reward id, asserted to be genuinely available. */
async function availableRewardId(world: World): Promise<string> {
  const { rewards: available } = await listAvailableRewardsForCustomer(pool, {
    customerIdentityId: world.customer.customerId,
  });
  expect(available).toHaveLength(1);
  expect(available[0].state).toBe("available");
  return available[0].id;
}

/** Earns one more independent available Reward in the same Business. */
async function extraAvailableReward(world: World): Promise<string> {
  const customer = await seedCustomer();
  await earnUnits({
    businessId: world.businessId,
    recorderId: world.owner,
    program: world.program,
    customer,
    quantity: 10,
  });
  const { rewards: available } = await listAvailableRewardsForCustomer(pool, {
    customerIdentityId: customer.customerId,
  });
  expect(available).toHaveLength(1);
  return available[0].id;
}

function confirm(
  world: { businessId: string },
  params: { userId: string; rewardId: string; idempotencyKey?: string },
) {
  return confirmRedemption(db, pool, {
    userId: params.userId,
    businessId: world.businessId,
    request: { rewardId: params.rewardId },
    idempotencyKey: params.idempotencyKey ?? nextId("key"),
    correlationId: nextId("corr"),
  });
}

async function countRows(table: "redemptions", rewardId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT count(*) FROM ${table} WHERE reward_id = $1`,
    [rewardId],
  );
  return Number(result.rows[0].count);
}

async function rewardState(rewardId: string): Promise<string> {
  const result = await pool.query<{ state: string }>(`SELECT state FROM rewards WHERE id = $1`, [
    rewardId,
  ]);
  return result.rows[0].state;
}

// ---------------------------------------------------------------------------
// State transition.
// ---------------------------------------------------------------------------

describe("confirmRedemption — state transition (DEC-LOY-018)", () => {
  it("moves an AVAILABLE reward to redeemed and records the governed evidence", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);

    const result = await confirm(world, { userId: world.owner, rewardId });

    expect(result.reward.state).toBe("redeemed");
    expect(result.redemption.rewardId).toBe(rewardId);
    expect(result.redemption.businessId).toBe(world.businessId);
    expect(result.redemption.customerIdentityId).toBe(world.customer.customerId);
    expect(result.redemption.confirmedByUserId).toBe(world.owner);
    expect(result.redemption.confirmedByRole).toBe("owner");
    expect(result.redemption.redeemedAt).toBeInstanceOf(Date);

    const persisted = await getRedemptionByRewardId(pool, rewardId);
    expect(persisted?.confirmedByUserId).toBe(world.owner);
  });

  it("completes the governing Cycle (reward_available → reward_redeemed) and opens the next one", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const cycleRow = `SELECT state, allocated_units FROM loyalty_cycles
        WHERE id = (SELECT loyalty_cycle_id FROM rewards WHERE id = $1)`;
    const before = await pool.query<{ state: string; allocated_units: number }>(cycleRow, [
      rewardId,
    ]);
    expect(before.rows[0]).toEqual({ state: "reward_available", allocated_units: 10 });

    const result = await confirm(world, { userId: world.owner, rewardId });

    // TRD11 §11.26 "close Loyalty Cycle"; `reward_redeemed` is a canonical
    // stored Cycle state (PRD06 state-model note, TRD10 §10.11.2).
    const after = await pool.query<{ state: string; allocated_units: number }>(cycleRow, [
      rewardId,
    ]);
    expect(after.rows[0]).toEqual({ state: "reward_redeemed", allocated_units: 10 });
    expect(result.completedLoyaltyCycleId).toBe(
      (
        await pool.query<{ id: string }>(
          `SELECT loyalty_cycle_id AS id FROM rewards WHERE id = $1`,
          [rewardId],
        )
      ).rows[0].id,
    );

    // TRD11 §11.26 "create next Loyalty Cycle".
    const cycles = await pool.query<{ state: string; sequence_number: number }>(
      `SELECT state, sequence_number FROM loyalty_cycles
        WHERE customer_identity_id = $1 ORDER BY sequence_number`,
      [world.customer.customerId],
    );
    expect(cycles.rows).toHaveLength(2);
    expect(cycles.rows[1]).toEqual({ state: "active", sequence_number: 2 });
    expect(result.nextLoyaltyCycleId).toBe(
      (
        await pool.query<{ id: string }>(
          `SELECT id FROM loyalty_cycles WHERE sequence_number = 2 AND customer_identity_id = $1`,
          [world.customer.customerId],
        )
      ).rows[0].id,
    );
  });

  it("REGRESSION (independent review P1): after redemption the Customer keeps earning INTO the redemption-opened next Cycle", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const result = await confirm(world, { userId: world.owner, rewardId });
    const nextCycleId = result.nextLoyaltyCycleId;

    // The completed Cycle released the single-current-Cycle slot and the
    // redemption-opened next Cycle now occupies it: a second current Cycle
    // still cannot exist (DEC-LOY-002 partial unique index backstop).
    await expect(
      pool.query(
        `INSERT INTO loyalty_cycles
           (business_id, customer_identity_id, reward_program_id, opened_under_version_id,
            sequence_number, state, allocated_units, correlation_id)
         SELECT business_id, customer_identity_id, reward_program_id, opened_under_version_id,
                99, 'active', 0, 'probe'
           FROM loyalty_cycles WHERE id = $1`,
        [nextCycleId],
      ),
    ).rejects.toThrow();

    // The real path, WITHOUT deleting the redemption-created next Cycle:
    // 10 fresh units through the normal verify path allocate directly into
    // it and reach the next threshold.
    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 10,
    });
    const { rewards } = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: world.customer.customerId,
    });
    expect(rewards).toHaveLength(1);
    expect(rewards[0].state).toBe("available");

    // Reward B belongs to the ACTUAL next Cycle the redemption opened —
    // the Customer continued earning in it, not in a replacement.
    expect(rewards[0].loyaltyCycleId).toBe(nextCycleId);
    const next = await pool.query<{ state: string; allocated_units: number }>(
      `SELECT state, allocated_units FROM loyalty_cycles WHERE id = $1`,
      [nextCycleId],
    );
    expect(next.rows[0]).toEqual({ state: "reward_available", allocated_units: 10 });

    // Exactly one current Cycle at all times (DEC-LOY-002).
    const current = await pool.query<{ count: string }>(
      `SELECT count(*) FROM loyalty_cycles
        WHERE customer_identity_id = $1 AND state IN ('active','reward_available')`,
      [world.customer.customerId],
    );
    expect(Number(current.rows[0].count)).toBe(1);
  });

  it("refuses to redeem an already-redeemed reward and leaves no second evidence row", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    await confirm(world, { userId: world.owner, rewardId });

    await expect(confirm(world, { userId: world.owner, rewardId })).rejects.toMatchObject({
      category: "INVALID_STATE_TRANSITION",
    });

    expect(await countRows("redemptions", rewardId)).toBe(1);
  });

  it("rejects a reward that is not in the redeemable state at all", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    // Product Truth permits redemption only from `available`; a reward in
    // any other lifecycle state is structurally not redeemable here.
    await pool.query(`UPDATE rewards SET state = 'expired' WHERE id = $1`, [rewardId]);

    await expect(confirm(world, { userId: world.owner, rewardId })).rejects.toMatchObject({
      category: "INVALID_STATE_TRANSITION",
    });
    expect(await countRows("redemptions", rewardId)).toBe(0);
  });

  it("refuses a fabricated reward id without disclosing anything", async () => {
    const world = await seedWorld();
    await expect(
      confirm(world, {
        userId: world.owner,
        rewardId: "00000000-0000-4000-8000-000000000000",
      }),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });
});

// ---------------------------------------------------------------------------
// Tenant isolation.
// ---------------------------------------------------------------------------

describe("confirmRedemption — tenant isolation", () => {
  it("Business A's authorised member cannot redeem Business B's reward", async () => {
    const a = await seedWorld();
    const b = await seedWorld();
    const bRewardId = await availableRewardId(b);

    // `a.owner` is fully authorised — in a, for a's own reward. Naming b's
    // reward against a's business must still fail: ownership is a property
    // of the persisted Reward, never of the request. The outcome is
    // deliberately the SAME not-found result a nonexistent id produces, so
    // the difference between the two cannot be used to probe another
    // tenant's Reward ids.
    await expect(confirm(a, { userId: a.owner, rewardId: bRewardId })).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });

    expect(await countRows("redemptions", bRewardId)).toBe(0);
    expect(await rewardState(bRewardId)).toBe("available");
  });

  it("reports a foreign reward identically to a nonexistent one (no cross-tenant enumeration)", async () => {
    const a = await seedWorld();
    const b = await seedWorld();
    const foreignId = await availableRewardId(b);
    const nonexistentId = "00000000-0000-4000-8000-000000000000";

    const foreign = await confirm(a, { userId: a.owner, rewardId: foreignId }).catch((e) => e);
    const nonexistent = await confirm(a, { userId: a.owner, rewardId: nonexistentId }).catch(
      (e) => e,
    );

    expect(foreign.category).toBe(nonexistent.category);
    // The message names the id the caller themselves supplied, so it differs
    // only by that echoed input — never by whether the Reward exists or which
    // tenant owns it. `toHttpsError` does not relay the message to the client.
    expect(foreign.message).toBe(nonexistent.message.replace(nonexistentId, foreignId));
    expect(foreign.message).toContain(foreignId);
  });

  it("rejects a malformed (non-UUID) reward id as not-found rather than a database error", async () => {
    const world = await seedWorld();
    // `rewards.id` is a UUID column; a non-UUID value would otherwise raise
    // PostgreSQL 22P02 and surface as an internal error.
    await expect(
      confirm(world, { userId: world.owner, rewardId: "not-a-uuid" }),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("a membership in another Business confers no access, even with an explicit grant", async () => {
    const a = await seedWorld();
    const b = await seedWorld();
    const aRewardId = await availableRewardId(a);

    // A member of b, explicitly granted redemption.confirm, tries a's reward
    // while naming b as the business. Permission alone is not ownership. The
    // outcome is the indistinguishable not-found, exactly as for any id that
    // is not a Reward of the named Business.
    const intruder = nextId("intruder");
    await seedMembership({
      userId: intruder,
      businessId: b.businessId,
      role: "staff",
      override: { direction: "grant" },
    });

    await expect(confirm(b, { userId: intruder, rewardId: aRewardId })).rejects.toMatchObject({
      category: "RESOURCE_NOT_FOUND",
    });
    expect(await rewardState(aRewardId)).toBe("available");
  });

  it("rejects a caller with no Business membership at all", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);

    await expect(confirm(world, { userId: nextId("stranger"), rewardId })).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
    });
  });
});

// ---------------------------------------------------------------------------
// Permission model (DEC-LOY-018 D-2) — resolved LIVE on every attempt.
// ---------------------------------------------------------------------------

describe("confirmRedemption — permission model", () => {
  it("Owner succeeds through the Owner floor and is attributed individually", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);

    const result = await confirm(world, { userId: world.owner, rewardId });

    expect(result.redemption.confirmedByRole).toBe("owner");
    expect(result.redemption.confirmedByUserId).toBe(world.owner);
    expect(result.redemption.confirmedByMembershipId).not.toBe("");
  });

  it("Owner floor is preserved: an ordinary revoke override does not remove Owner authority", async () => {
    const world = await seedWorld();
    // A revoke override against an Owner is a state
    // `createPermissionOverride` would never construct, seeded directly to
    // prove the OWNER FLOOR — not the override set — is what protects them.
    await setOverride(world.ownerMembershipId, "revoke");
    const rewardId = await availableRewardId(world);

    const result = await confirm(world, { userId: world.owner, rewardId });
    expect(result.redemption.confirmedByRole).toBe("owner");
  });

  it("Manager succeeds by default", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);

    const result = await confirm(world, { userId: world.manager, rewardId });
    expect(result.redemption.confirmedByRole).toBe("manager");
  });

  it("an explicitly revoked Manager is denied and nothing is written", async () => {
    const world = await seedWorld();
    const revoked = nextId("mgr_revoked");
    await seedMembership({
      userId: revoked,
      businessId: world.businessId,
      role: "manager",
      override: { direction: "revoke" },
    });
    const rewardId = await availableRewardId(world);

    await expect(confirm(world, { userId: revoked, rewardId })).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
    });

    expect(await countRows("redemptions", rewardId)).toBe(0);
    expect(await rewardState(rewardId)).toBe("available");
  });

  it("a re-granted Manager succeeds again (the revoke is replaced by a grant)", async () => {
    const world = await seedWorld();
    const member = nextId("mgr_regranted");
    const membershipId = await seedMembership({
      userId: member,
      businessId: world.businessId,
      role: "manager",
      override: { direction: "revoke" },
    });
    const rewardId = await availableRewardId(world);

    await expect(confirm(world, { userId: member, rewardId })).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
    });

    await setOverride(membershipId, "grant");

    const result = await confirm(world, { userId: member, rewardId });
    expect(result.redemption.confirmedByRole).toBe("manager");
    expect(result.redemption.confirmedByUserId).toBe(member);
  });

  it("Staff is denied by default — the permission confers nothing implicitly", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);

    await expect(confirm(world, { userId: world.staff, rewardId })).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
    });
    expect(await countRows("redemptions", rewardId)).toBe(0);
  });

  it("an explicitly granted Staff member succeeds and is recorded as staff, not promoted", async () => {
    const world = await seedWorld();
    const trusted = nextId("staff_granted");
    const membershipId = await seedMembership({
      userId: trusted,
      businessId: world.businessId,
      role: "staff",
      override: { direction: "grant" },
    });
    const rewardId = await availableRewardId(world);

    const result = await confirm(world, { userId: trusted, rewardId });

    expect(result.redemption.confirmedByRole).toBe("staff");
    expect(result.redemption.confirmedByUserId).toBe(trusted);
    expect(result.redemption.confirmedByMembershipId).toBe(membershipId);
  });

  it("a revoked Staff grant fails again — the decision is re-resolved, not cached", async () => {
    const world = await seedWorld();
    const trusted = nextId("staff_revoked");
    const membershipId = await seedMembership({
      userId: trusted,
      businessId: world.businessId,
      role: "staff",
      override: { direction: "grant" },
    });
    await setOverride(membershipId, "revoke");
    const rewardId = await availableRewardId(world);

    await expect(confirm(world, { userId: trusted, rewardId })).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
    });
  });

  it("a Staff redemption grant confers NO unrelated permission", async () => {
    const world = await seedWorld();
    const trusted = nextId("staff_scoped");
    await seedMembership({
      userId: trusted,
      businessId: world.businessId,
      role: "staff",
      override: { direction: "grant", permissionId: "redemption.confirm" },
    });

    // The Business-wide reward/loyalty visibility read remains Owner/Manager
    // only: the redemption grant is not a role promotion and confers it
    // nothing.
    await expect(
      listAvailableRewardsForBusiness(db, pool, {
        userId: trusted,
        businessId: world.businessId,
      }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("a Platform Administrator without Business authority is denied", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const admin = nextId("padmin");
    await db.collection("platformAdministrators").doc(admin).set({
      userId: admin,
      status: "active",
      mfaEnrolled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: 1,
    });

    await expect(confirm(world, { userId: admin, rewardId })).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
    });
    expect(await countRows("redemptions", rewardId)).toBe(0);
  });

  it("the Customer who earned the Reward cannot confirm their own redemption", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);

    await expect(
      confirm(world, { userId: world.customer.customerId, rewardId }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("a suspended membership stops authorising confirmation (live re-resolution)", async () => {
    const world = await seedWorld();
    const trusted = nextId("staff_suspended");
    const membershipId = await seedMembership({
      userId: trusted,
      businessId: world.businessId,
      role: "staff",
      override: { direction: "grant" },
    });
    const rewardId = await availableRewardId(world);
    await confirm(world, { userId: trusted, rewardId });

    const secondRewardId = await extraAvailableReward(world);
    await db
      .collection("businessMemberships")
      .doc(membershipId)
      .set({ status: "suspended" }, { merge: true });

    await expect(
      confirm(world, { userId: trusted, rewardId: secondRewardId }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });
});

// ---------------------------------------------------------------------------
// Idempotency and concurrency.
// ---------------------------------------------------------------------------

describe("confirmRedemption — idempotency and concurrency", () => {
  it("replays the stored result for the same key and body, writing nothing twice", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const key = nextId("key");

    const first = await confirm(world, { userId: world.owner, rewardId, idempotencyKey: key });
    const replay = await confirm(world, { userId: world.owner, rewardId, idempotencyKey: key });

    expect(replay.redemption.id).toBe(first.redemption.id);
    expect(await countRows("redemptions", rewardId)).toBe(1);
  });

  it("confirms the same idempotency key against a different reward as a conflict", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const key = nextId("key");
    await confirm(world, { userId: world.owner, rewardId, idempotencyKey: key });

    const otherRewardId = await extraAvailableReward(world);

    await expect(
      confirm(world, { userId: world.owner, rewardId: otherRewardId, idempotencyKey: key }),
    ).rejects.toMatchObject({ category: "IDEMPOTENCY_CONFLICT" });
  });

  it("two authorised members confirming the SAME reward at once: exactly one transition", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);

    const results = await Promise.allSettled([
      confirm(world, { userId: world.owner, rewardId }),
      confirm(world, { userId: world.manager, rewardId }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(await countRows("redemptions", rewardId)).toBe(1);

    // No duplicate Trust evidence from the losing attempt.
    const events = await pool.query<{ count: string }>(
      `SELECT count(*) FROM trust_events
        WHERE subject_type = 'reward' AND subject_id = $1 AND event_type = 'reward.redeemed'`,
      [rewardId],
    );
    expect(Number(events.rows[0].count)).toBe(1);

    const intents = await pool.query<{ count: string }>(
      `SELECT count(*) FROM notification_intents WHERE source_redemption_id IS NOT NULL`,
    );
    expect(Number(intents.rows[0].count)).toBe(2);
    // Two simultaneous full redemption transactions serialise on the Reward
    // row lock; under full-suite load the loser can wait long enough to
    // exceed vitest's 5s default per-test timeout, so this race carries an
    // explicit timeout. The assertions above (not the timeout) prove
    // exactly-once.
  }, 30000);

  it("the same member double-clicking (identical key, simultaneous) commits exactly one transition", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const key = nextId("key");

    const results = await Promise.allSettled([
      confirm(world, { userId: world.owner, rewardId, idempotencyKey: key }),
      confirm(world, { userId: world.owner, rewardId, idempotencyKey: key }),
    ]);

    // Same key + same body is a genuine REPLAY under the existing
    // idempotency semantics (never an error, never a second effect): both
    // callers observe the same committed result.
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(2);
    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof confirm>>> =>
        r.status === "fulfilled",
    );
    expect(fulfilled[0].value.redemption.id).toBe(fulfilled[1].value.redemption.id);
    expect(await countRows("redemptions", rewardId)).toBe(1);

    const events = await pool.query<{ count: string }>(
      `SELECT count(*) FROM trust_events
        WHERE subject_type = 'reward' AND subject_id = $1 AND event_type = 'reward.redeemed'`,
      [rewardId],
    );
    expect(Number(events.rows[0].count)).toBe(1);
    // Same explicit timeout rationale as the two-member race above: two
    // simultaneous full transactions under full-suite load.
  }, 30000);

  it("the schema itself refuses a second redemption row for one reward (UNIQUE backstop)", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const result = await confirm(world, { userId: world.owner, rewardId });

    await expect(
      pool.query(
        `INSERT INTO redemptions
           (reward_id, loyalty_cycle_id, business_id, customer_identity_id,
            reward_program_id, reward_program_version_id,
            confirmed_by_user_id, confirmed_by_membership_id, confirmed_by_role,
            idempotency_key, correlation_id)
         VALUES ($1,$2,$3,$4,$5,$6,'user-x','mem-x','owner','key-x','corr-x')`,
        [
          result.redemption.rewardId,
          result.redemption.loyaltyCycleId,
          result.redemption.businessId,
          result.redemption.customerIdentityId,
          result.redemption.rewardProgramId,
          result.redemption.rewardProgramVersionId,
        ],
      ),
    ).rejects.toThrow(/redemptions_one_per_reward/);
  });
});

// ---------------------------------------------------------------------------
// Trust evidence and read-model consequences.
// ---------------------------------------------------------------------------

describe("confirmRedemption — evidence and read consequences", () => {
  it("records the governed Trust pair with NULL Purchase causation and the Redemption in the payload", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const result = await confirm(world, { userId: world.owner, rewardId });

    const events = await pool.query<{
      event_type: string;
      causal_purchase_record_id: string | null;
      source_purchase_record_event_id: string | null;
      actor_id: string;
      actor_role: string;
      business_id: string;
      customer_identity_id: string;
      occurred_at: Date;
    }>(
      `SELECT event_type, causal_purchase_record_id, source_purchase_record_event_id,
              actor_id, actor_role, business_id, customer_identity_id, occurred_at
         FROM trust_events
        WHERE subject_id IN ($1, $2)
          AND event_type IN ('reward.redeemed', 'loyalty_cycle.reward_redeemed')
        ORDER BY event_type ASC`,
      [rewardId, result.redemption.loyaltyCycleId],
    );

    expect(events.rows.map((r) => r.event_type)).toEqual([
      "loyalty_cycle.reward_redeemed",
      "reward.redeemed",
    ]);
    for (const row of events.rows) {
      // Redemption is caused by a Business confirmation, not a Purchase
      // lifecycle transition, so both causal Purchase columns are NULL.
      expect(row.causal_purchase_record_id).toBeNull();
      expect(row.source_purchase_record_event_id).toBeNull();
      expect(row.actor_id).toBe(world.owner);
      expect(row.actor_role).toBe("owner");
      expect(row.business_id).toBe(world.businessId);
      expect(row.customer_identity_id).toBe(world.customer.customerId);
      expect(row.occurred_at).toBeInstanceOf(Date);
    }
  });

  it("emits exactly one Customer and one Business notification intent, anchored on the redemption", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const result = await confirm(world, { userId: world.owner, rewardId });

    const intents = await pool.query<{
      intent_type: string;
      recipient_type: string;
      recipient_id: string;
      purchase_record_id: string | null;
      source_purchase_record_event_id: string | null;
      source_redemption_id: string;
    }>(
      `SELECT intent_type, recipient_type, recipient_id,
              purchase_record_id, source_purchase_record_event_id, source_redemption_id
         FROM notification_intents
        WHERE source_redemption_id = $1
        ORDER BY intent_type ASC`,
      [result.redemption.id],
    );

    expect(intents.rows).toEqual([
      {
        intent_type: "reward_redeemed_business",
        recipient_type: "business",
        recipient_id: world.businessId,
        purchase_record_id: null,
        source_purchase_record_event_id: null,
        source_redemption_id: result.redemption.id,
      },
      {
        intent_type: "reward_redeemed_customer",
        recipient_type: "customer",
        recipient_id: world.customer.customerId,
        purchase_record_id: null,
        source_purchase_record_event_id: null,
        source_redemption_id: result.redemption.id,
      },
    ]);
  });

  it("removes the redeemed Reward from the Customer's available-reward read", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const before = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: world.customer.customerId,
    });
    expect(before.rewards).toHaveLength(1);

    await confirm(world, { userId: world.owner, rewardId });

    const after = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: world.customer.customerId,
    });
    expect(after.rewards).toHaveLength(0);
  });

  it("removes the redeemed Reward from the Business's available-reward read", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const before = await listAvailableRewardsForBusiness(db, pool, {
      userId: world.owner,
      businessId: world.businessId,
    });
    expect(before.rewards).toHaveLength(1);

    await confirm(world, { userId: world.owner, rewardId });

    const after = await listAvailableRewardsForBusiness(db, pool, {
      userId: world.owner,
      businessId: world.businessId,
    });
    expect(after.rewards).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Loyalty Cycle lifecycle + pending Verified Unit forward allocation
// (TRD11 §11.26, DEC-LOY-002, DEC-LOY-008/`FD-PVL-002` option (a)).
// ---------------------------------------------------------------------------

async function pendingPositions(customerId: string) {
  const result = await pool.query<{
    id: string;
    loyalty_cycle_id: string | null;
    allocated_quantity: number;
    state: string;
  }>(
    `SELECT id, loyalty_cycle_id, allocated_quantity, state
       FROM verified_unit_allocations
      WHERE customer_identity_id = $1 AND state = 'pending'
      ORDER BY created_at, verified_unit_id, allocation_order`,
    [customerId],
  );
  return result.rows;
}

describe("confirmRedemption — pending Verified Unit forward allocation (FD-PVL-002)", () => {
  it("no pending units: the next Cycle is still created in the correct governed state", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    expect(await pendingPositions(world.customer.customerId)).toHaveLength(0);

    const result = await confirm(world, { userId: world.owner, rewardId });

    expect(result.unitsAllocatedForward).toBe(0);
    expect(result.nextReward).toBeNull();
    const next = await pool.query<{
      state: string;
      allocated_units: number;
      opened_under_version_id: string;
    }>(`SELECT state, allocated_units, opened_under_version_id FROM loyalty_cycles WHERE id = $1`, [
      result.nextLoyaltyCycleId,
    ]);
    expect(next.rows[0].state).toBe("active");
    expect(next.rows[0].allocated_units).toBe(0);
    // Empty next Cycle: provisional continuity version (the completed
    // Cycle's governor — no earning exists yet to bind). The first future
    // verification adopts its own version before any unit lands
    // (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-002`).
    const completed = await pool.query<{ opened_under_version_id: string }>(
      `SELECT opened_under_version_id FROM loyalty_cycles WHERE id = $1`,
      [result.completedLoyaltyCycleId],
    );
    expect(next.rows[0].opened_under_version_id).toBe(completed.rows[0].opened_under_version_id);
  });

  it("allocates pending units into the next Cycle in order, conserving total quantity", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const customerId = world.customer.customerId;

    // Earn 10 (fills cycle 1 → Reward), then 4 more which cannot fit and
    // therefore become PENDING overflow (DEC-LOY-008 option (a)).
    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 4,
    });
    const before = await pendingPositions(customerId);
    expect(before).toHaveLength(1);
    expect(before[0].allocated_quantity).toBe(4);

    const result = await confirm(world, { userId: world.owner, rewardId });

    // FD-PVL-002: pending units apply forward once the reward is redeemed and
    // the next cycle is created.
    expect(result.unitsAllocatedForward).toBe(4);
    expect(await pendingPositions(customerId)).toHaveLength(0);

    const next = await pool.query<{ state: string; allocated_units: number }>(
      `SELECT state, allocated_units FROM loyalty_cycles WHERE id = $1`,
      [result.nextLoyaltyCycleId],
    );
    expect(next.rows[0]).toEqual({ state: "active", allocated_units: 4 });

    // The whole pending position moved IN PLACE (row count unchanged), and a
    // single pending_to_allocated history event was appended (design §15/§33.2(e)).
    const moved = await pool.query<{ count: string }>(
      `SELECT count(*) FROM verified_unit_allocations WHERE id = $1`,
      [before[0].id],
    );
    expect(Number(moved.rows[0].count)).toBe(1);
    const events = await pool.query<{ count: string }>(
      `SELECT count(*) FROM verified_unit_allocation_events
        WHERE allocation_position_id = $1 AND reason = 'pending_to_allocated'`,
      [before[0].id],
    );
    expect(Number(events.rows[0].count)).toBe(1);
  });

  it("overflow crossing the threshold: 10 pending units make the NEXT reward available and leave the remainder pending", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const customerId = world.customer.customerId;

    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 13,
    });
    const before = await pendingPositions(customerId);
    expect(before[0].allocated_quantity).toBe(13);

    const result = await confirm(world, { userId: world.owner, rewardId });

    // DEC-LOY-002 forbids two current Cycles, so allocation fills the new
    // Cycle to exactly 10 and stops; the remaining 3 wait, exactly as an
    // ordinary over-threshold verify leaves overflow pending.
    expect(result.unitsAllocatedForward).toBe(10);
    expect(result.nextReward).not.toBeNull();
    expect(result.nextReward?.state).toBe("available");

    const nextCycle = await pool.query<{ state: string; allocated_units: number }>(
      `SELECT state, allocated_units FROM loyalty_cycles WHERE id = $1`,
      [result.nextLoyaltyCycleId],
    );
    expect(nextCycle.rows[0]).toEqual({ state: "reward_available", allocated_units: 10 });

    // Quantity-conserving split: 10 allocated + 3 still pending = 13, and the
    // credit row is untouched.
    const after = await pendingPositions(customerId);
    expect(after).toHaveLength(1);
    expect(after[0].allocated_quantity).toBe(3);
    const allocatedSum = await pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(allocated_quantity),0) AS total FROM verified_unit_allocations
        WHERE customer_identity_id = $1`,
      [customerId],
    );
    const creditSum = await pool.query<{ total: string }>(
      `SELECT COALESCE(SUM(quantity),0) AS total FROM verified_units WHERE customer_identity_id = $1`,
      [customerId],
    );
    expect(Number(allocatedSum.rows[0].total)).toBe(Number(creditSum.rows[0].total));

    // The customer now holds two rewards across two completed/available cycles.
    const { rewards } = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: customerId,
    });
    expect(rewards).toHaveLength(1);
    expect(rewards[0].id).toBe(result.nextReward?.id);

    // Threshold-crossing disclosure, asserted exactly:
    // - exactly one current Cycle (the next one, `reward_available`);
    // - exactly one next Reward (no duplicate via `rewards_one_per_cycle`);
    // - the governed availability Trust pair for the threshold crossing;
    // - the Customer availability intent anchored on THIS redemption.
    const current = await pool.query<{ count: string }>(
      `SELECT count(*) FROM loyalty_cycles
        WHERE customer_identity_id = $1 AND state IN ('active','reward_available')`,
      [customerId],
    );
    expect(Number(current.rows[0].count)).toBe(1);
    const nextRewards = await pool.query<{ count: string }>(
      `SELECT count(*) FROM rewards WHERE loyalty_cycle_id = $1`,
      [result.nextLoyaltyCycleId],
    );
    expect(Number(nextRewards.rows[0].count)).toBe(1);
    expect(result.nextReward?.state).toBe("available");
    const rewardAvailableEvents = await pool.query<{ count: string }>(
      `SELECT count(*) FROM trust_events
        WHERE event_type = 'reward.available' AND subject_reward_id = $1`,
      [result.nextReward?.id],
    );
    expect(Number(rewardAvailableEvents.rows[0].count)).toBe(1);
    const cycleAvailableEvents = await pool.query<{ count: string }>(
      `SELECT count(*) FROM trust_events
        WHERE event_type = 'loyalty_cycle.reward_available'
          AND subject_loyalty_cycle_id = $1`,
      [result.nextLoyaltyCycleId],
    );
    expect(Number(cycleAvailableEvents.rows[0].count)).toBe(1);
    const customerIntents = await pool.query<{ count: string }>(
      `SELECT count(*) FROM notification_intents
        WHERE intent_type = 'reward_available_customer'
          AND source_redemption_id = $1`,
      [result.redemption.id],
    );
    expect(Number(customerIntents.rows[0].count)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Post-redemption Loyalty Cycle version binding
// (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-002`, DEC-LOY-008 addendum
// 2026-09-28 / DEC-PROD-014).
//
// Product Truth under test: a Loyalty Cycle's governing version is the
// version of the FIRST Verified Unit allocated into it — the same rule the
// normal verify path implements by opening under its opening Purchase's
// creation-time snapshot version. The programme version current at
// redemption time MUST NOT govern the next Cycle: V1 earns "Free Coffee",
// V2 earns "Free Cake", and equivalent earning must produce the same
// Reward whichever path opened the Cycle.
// ---------------------------------------------------------------------------

async function currentVersionId(programId: string): Promise<string | null> {
  const result = await pool.query<{ current_version_id: string | null }>(
    `SELECT current_version_id FROM reward_programs WHERE id = $1`,
    [programId],
  );
  return result.rows[0].current_version_id;
}

async function cycleVersion(cycleId: string): Promise<string> {
  const result = await pool.query<{ opened_under_version_id: string }>(
    `SELECT opened_under_version_id FROM loyalty_cycles WHERE id = $1`,
    [cycleId],
  );
  return result.rows[0].opened_under_version_id;
}

async function rewardTerms(rewardId: string): Promise<{
  versionId: string;
  description: string;
  cycleId: string;
  state: string;
}> {
  const result = await pool.query<{
    reward_program_version_id: string;
    reward_description: string;
    loyalty_cycle_id: string;
    state: string;
  }>(
    `SELECT reward_program_version_id, reward_description, loyalty_cycle_id, state
       FROM rewards WHERE id = $1`,
    [rewardId],
  );
  const row = result.rows[0];
  return {
    versionId: row.reward_program_version_id,
    description: row.reward_description,
    cycleId: row.loyalty_cycle_id,
    state: row.state,
  };
}

/** Publishes a second program version with a different reward description. Setup only. */
async function publishSecondVersion(params: {
  businessId: string;
  ownerId: string;
  program: Program;
  rewardDescription: string;
}): Promise<string> {
  const next = await createNextRewardProgramVersion(db, pool, {
    userId: params.ownerId,
    request: {
      businessId: params.businessId,
      rewardProgramId: params.program.programId,
      rewardDescription: params.rewardDescription,
      multipleUnitsAllowed: true,
      sharedLoyaltyNumberAllowed: true,
      effectiveFrom: new Date("2026-09-27T12:00:00.000Z"),
      qualifyingItemIds: [params.program.qualifyingItemId],
    } as never,
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  const published = await publishRewardProgramVersion(db, pool, {
    userId: params.ownerId,
    request: {
      businessId: params.businessId,
      rewardProgramId: params.program.programId,
      versionId: next.id,
    },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  return published.id;
}

async function countCurrentCycles(customerId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT count(*) FROM loyalty_cycles
      WHERE customer_identity_id = $1 AND state IN ('active','reward_available')`,
    [customerId],
  );
  return Number(result.rows[0].count);
}

describe("confirmRedemption — post-redemption Cycle version binding (CORR-002)", () => {
  it("Scenario 1 — no version change: the next Cycle follows the same version rule as normal opening", async () => {
    const world = await seedWorld();
    const v1 = await currentVersionId(world.program.programId);
    const rewardId = await availableRewardId(world);

    const result = await confirm(world, { userId: world.owner, rewardId });

    // The completed Cycle was governed by V1, and the empty next Cycle
    // provisionally continues V1 — identical to what the normal path would
    // have opened for V1 earning.
    expect(await cycleVersion(result.completedLoyaltyCycleId)).toBe(v1);
    expect(await cycleVersion(result.nextLoyaltyCycleId)).toBe(v1);

    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 10,
    });
    const { rewards } = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: world.customer.customerId,
    });
    expect(rewards).toHaveLength(1);
    const terms = await rewardTerms(rewards[0].id);
    expect(terms.cycleId).toBe(result.nextLoyaltyCycleId);
    expect(terms.versionId).toBe(v1);
    expect(terms.description).toBe("Free Coffee");
    expect(await countCurrentCycles(world.customer.customerId)).toBe(1);
  });

  it("Scenario 2 — V2 published after Reward A was earned: equivalent new earning produces the same Reward on both paths", async () => {
    const world = await seedWorld();
    const v1 = await currentVersionId(world.program.programId);
    const rewardAId = await availableRewardId(world);

    // V2 ("Free Cake") publishes while Reward A waits to be redeemed.
    const v2 = await publishSecondVersion({
      businessId: world.businessId,
      ownerId: world.owner,
      program: world.program,
      rewardDescription: "Free Cake",
    });
    expect(v2).not.toBe(v1);
    expect(await currentVersionId(world.program.programId)).toBe(v2);

    const result = await confirm(world, { userId: world.owner, rewardId: rewardAId });

    // The already-earned Reward is NOT rebound by the publication it waited
    // through, and the empty next Cycle does NOT take programme-current:
    // it provisionally continues V1 until earning begins it.
    expect((await rewardTerms(rewardAId)).versionId).toBe(v1);
    expect((await rewardTerms(rewardAId)).description).toBe("Free Coffee");
    expect(await cycleVersion(result.nextLoyaltyCycleId)).toBe(v1);

    // New earning begins AFTER redemption (V2-bound purchases). The first
    // unit adopts V2 into the redemption-opened Cycle — the same rule as a
    // normally opened Cycle.
    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 10,
    });
    const { rewards } = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: world.customer.customerId,
    });
    expect(rewards).toHaveLength(1);
    const termsB = await rewardTerms(rewards[0].id);
    expect(termsB.cycleId).toBe(result.nextLoyaltyCycleId);
    expect(termsB.versionId).toBe(v2);
    expect(termsB.description).toBe("Free Cake");
    expect(await cycleVersion(result.nextLoyaltyCycleId)).toBe(v2);
    expect(await countCurrentCycles(world.customer.customerId)).toBe(1);

    // The normal-path control: a second customer earns the equivalent 10
    // V2 units with their Cycle opened purely by verification. Same
    // earning, same Reward — no path-dependent divergence.
    const control = await seedCustomer();
    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: control,
      quantity: 10,
    });
    const controlRewards = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: control.customerId,
    });
    expect(controlRewards.rewards).toHaveLength(1);
    const termsN = await rewardTerms(controlRewards.rewards[0].id);
    expect(termsN.versionId).toBe(v2);
    expect(termsN.description).toBe("Free Cake");
    expect(termsB.description).toBe(termsN.description);
    expect(termsB.versionId).toBe(termsN.versionId);
  });

  it("Scenario 3 — pending units at redemption: the first pending unit in forward order governs, and later mixed fills do not rebind", async () => {
    const world = await seedWorld();
    const v1 = await currentVersionId(world.program.programId);
    const rewardAId = await availableRewardId(world);
    const customerId = world.customer.customerId;

    // 4 V1 units overflow to pending (cycle 1 is full), then V2 publishes,
    // then 3 V2 units overflow to pending behind them.
    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 4,
    });
    const v2 = await publishSecondVersion({
      businessId: world.businessId,
      ownerId: world.owner,
      program: world.program,
      rewardDescription: "Free Cake",
    });
    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 3,
    });
    const pendingBefore = await pendingPositions(customerId);
    expect(pendingBefore).toHaveLength(2);
    // Deterministic forward order: the V1 overflow waits ahead of the V2
    // overflow (same order the forward allocator consumes).
    const versionsBefore = await pool.query<{ reward_program_version_id: string }>(
      `SELECT reward_program_version_id FROM verified_unit_allocations
        WHERE customer_identity_id = $1 AND state = 'pending'
        ORDER BY created_at ASC, verified_unit_id ASC, allocation_order ASC`,
      [customerId],
    );
    expect(versionsBefore.rows.map((r) => r.reward_program_version_id)).toEqual([v1, v2]);

    const result = await confirm(world, { userId: world.owner, rewardId: rewardAId });

    // The next Cycle is governed by the FIRST pending unit (V1) — even
    // though V2 is programme-current at redemption time. Current-version
    // binding would have produced "Free Cake" here; the approved rule
    // produces "Free Coffee".
    expect(await cycleVersion(result.nextLoyaltyCycleId)).toBe(v1);
    expect(result.unitsAllocatedForward).toBe(7);
    expect(result.nextReward).toBeNull();

    // Each position keeps its own earning version (mixed fill under V1
    // governance — exactly as a normally opened V1 Cycle fills).
    const allocatedVersions = await pool.query<{
      allocated_quantity: number;
      reward_program_version_id: string;
    }>(
      `SELECT allocated_quantity, reward_program_version_id FROM verified_unit_allocations
        WHERE loyalty_cycle_id = $1 AND state = 'allocated'
        ORDER BY created_at ASC`,
      [result.nextLoyaltyCycleId],
    );
    expect(allocatedVersions.rows).toHaveLength(2);
    expect(allocatedVersions.rows[0]).toMatchObject({
      allocated_quantity: 4,
      reward_program_version_id: v1,
    });
    expect(allocatedVersions.rows[1]).toMatchObject({
      allocated_quantity: 3,
      reward_program_version_id: v2,
    });

    // 3 more V2 units complete the Cycle: the threshold Reward follows the
    // FIRST unit's version (V1 "Free Coffee"), not the later fills.
    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 3,
    });
    const { rewards } = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: customerId,
    });
    expect(rewards).toHaveLength(1);
    const termsB = await rewardTerms(rewards[0].id);
    expect(termsB.cycleId).toBe(result.nextLoyaltyCycleId);
    expect(termsB.versionId).toBe(v1);
    expect(termsB.description).toBe("Free Coffee");
    expect(await countCurrentCycles(customerId)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Failure atomicity: every write in the redemption transaction commits
// together or not at all.
// ---------------------------------------------------------------------------

describe("confirmRedemption — failure atomicity", () => {
  it("a late transaction failure rolls back everything: Reward, Cycle, next Cycle, evidence, allocation, events, intents", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const customerId = world.customer.customerId;
    const key = nextId("key");

    // Pending overflow present BEFORE the redemption, so the test can prove
    // no partial forward allocation survives the rollback.
    await earnUnits({
      businessId: world.businessId,
      recorderId: world.owner,
      program: world.program,
      customer: world.customer,
      quantity: 4,
    });
    expect(await pendingPositions(customerId)).toHaveLength(1);

    // Force a failure AFTER all logical work: pre-seed a conflicting
    // one-time `reward.redeemed` Trust Event for this Reward subject, so the
    // command's own event insert violates
    // `trust_events_one_time_subject_event` after the Reward transition, the
    // redemption row, the Cycle close, the next-Cycle open and the forward
    // allocation have all executed inside the same transaction.
    await pool.query(
      `INSERT INTO trust_events
         (event_type, causal_purchase_record_id, source_purchase_record_event_id,
          subject_type, subject_id, subject_reward_id,
          business_id, customer_identity_id, actor_type, actor_id,
          correlation_id, payload)
       VALUES ('reward.redeemed', NULL, NULL,
          'reward', $1, $1,
          $2, $3, 'owner', $4,
          'conflict-seed', '{}')`,
      [rewardId, world.businessId, customerId, world.owner],
    );

    await expect(
      confirm(world, { userId: world.owner, rewardId, idempotencyKey: key }),
    ).rejects.toThrow();

    // Nothing committed: Reward still available, governing Cycle untouched,
    // no next Cycle, no redemption evidence, pending allocation undisturbed,
    // no redemption Trust Events, no redemption notification intents.
    expect(await rewardState(rewardId)).toBe("available");
    const cycle = await pool.query<{ state: string; allocated_units: number }>(
      `SELECT state, allocated_units FROM loyalty_cycles
        WHERE id = (SELECT loyalty_cycle_id FROM rewards WHERE id = $1)`,
      [rewardId],
    );
    expect(cycle.rows[0]).toEqual({ state: "reward_available", allocated_units: 10 });
    const cycles = await pool.query<{ count: string }>(
      `SELECT count(*) FROM loyalty_cycles WHERE customer_identity_id = $1`,
      [customerId],
    );
    expect(Number(cycles.rows[0].count)).toBe(1);
    expect(await countRows("redemptions", rewardId)).toBe(0);
    const pendingAfter = await pendingPositions(customerId);
    expect(pendingAfter).toHaveLength(1);
    expect(pendingAfter[0].allocated_quantity).toBe(4);
    const redeemedEvents = await pool.query<{ count: string }>(
      `SELECT count(*) FROM trust_events
        WHERE event_type IN ('reward.redeemed', 'loyalty_cycle.reward_redeemed')`,
      [],
    );
    // Only the deliberately pre-seeded conflicting row survives.
    expect(Number(redeemedEvents.rows[0].count)).toBe(1);
    const redemptionIntents = await pool.query<{ count: string }>(
      `SELECT count(*) FROM notification_intents WHERE source_redemption_id IS NOT NULL`,
      [],
    );
    expect(Number(redemptionIntents.rows[0].count)).toBe(0);

    // The idempotency reservation rolled back with the transaction: removing
    // the poison row and retrying with the SAME key succeeds.
    await pool.query(`DELETE FROM trust_events WHERE correlation_id = 'conflict-seed'`);
    const result = await confirm(world, { userId: world.owner, rewardId, idempotencyKey: key });
    expect(await rewardState(rewardId)).toBe("redeemed");
    expect(result.nextLoyaltyCycleId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
