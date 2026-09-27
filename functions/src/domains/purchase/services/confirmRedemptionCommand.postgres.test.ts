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

  it("does NOT mutate the Loyalty Cycle — the cycle stays exactly reward_available", async () => {
    const world = await seedWorld();
    const rewardId = await availableRewardId(world);
    const cycleRow = `SELECT state, allocated_units FROM loyalty_cycles
        WHERE id = (SELECT loyalty_cycle_id FROM rewards WHERE id = $1)`;
    const before = await pool.query<{ state: string; allocated_units: number }>(cycleRow, [
      rewardId,
    ]);
    expect(before.rows[0]).toEqual({ state: "reward_available", allocated_units: 10 });

    await confirm(world, { userId: world.owner, rewardId });

    const after = await pool.query<{ state: string; allocated_units: number }>(cycleRow, [
      rewardId,
    ]);
    expect(after.rows[0]).toEqual({ state: "reward_available", allocated_units: 10 });
    // No next cycle is created by redemption either.
    const cycles = await pool.query<{ count: string }>(
      `SELECT count(*) FROM loyalty_cycles WHERE customer_identity_id = $1`,
      [world.customer.customerId],
    );
    expect(Number(cycles.rows[0].count)).toBe(1);
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
    // of the persisted Reward, never of the request.
    await expect(confirm(a, { userId: a.owner, rewardId: bRewardId })).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
    });

    expect(await countRows("redemptions", bRewardId)).toBe(0);
    expect(await rewardState(bRewardId)).toBe("available");
  });

  it("a membership in another Business confers no access, even with an explicit grant", async () => {
    const a = await seedWorld();
    const b = await seedWorld();
    const aRewardId = await availableRewardId(a);

    // A member of b, explicitly granted redemption.confirm, tries a's reward
    // while naming b as the business. Permission alone is not ownership.
    const intruder = nextId("intruder");
    await seedMembership({
      userId: intruder,
      businessId: b.businessId,
      role: "staff",
      override: { direction: "grant" },
    });

    await expect(confirm(b, { userId: intruder, rewardId: aRewardId })).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
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
  });

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
  });

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
