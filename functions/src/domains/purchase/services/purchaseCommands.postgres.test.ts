/**
 * Purchase / Verification cross-store integration tests
 * (`PLATFORM-BASELINE-006A`, design §29.19).
 *
 * Requires BOTH a live PostgreSQL instance (`PLATFORM_POSTGRES_URL`) AND
 * the Firebase Firestore Emulator (`FIRESTORE_EMULATOR_HOST`) running
 * simultaneously — the Purchase domain reads/validates Business,
 * membership, Customer Identity artifacts, Branch, and Commerce Knowledge
 * state from Firestore while writing its own domain state to PostgreSQL.
 * Run via:
 *
 *   firebase emulators:exec --project demo-11thonus \
 *     "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *      npx vitest run --config vitest.postgres.config.ts purchaseCommands"
 *
 * Covers the task §24 matrix: create (shared-policy five cases, program
 * eligibility, quantity rules, idempotency), verification (ownership,
 * stale state, races, one-credit, replay, rollback), cycles (first
 * creation, concurrent first verifies, split allocation, 9/10 race, no
 * overfill, single current), rewards (exactly-once, governing version,
 * quantity 1, replay), trust cardinality, conservation invariants, reject
 * (all reasons, no units), dispute (all reasons, no units), and read
 * isolation/side-effect-freedom.
 *
 * Quantity-note: the design's "optional Maximum Units per Purchase Record"
 * has no governed schema home (005A carries no maximum column;
 * `bulk_review_threshold` is review-visibility-only per DEC-LOY-003), so
 * no "quantity above max" case exists to test — quantity is governed by
 * `quantity >= 1` and the locked `multipleUnitsAllowed` rule only. See
 * the 006A implementation report.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createKnowledgeNodePersisted,
  transitionKnowledgeNodeStatusPersisted,
} from "../../commerceKnowledge/repositories/knowledgeNodeRepository";
import { createCustomerIdentity } from "../../identity/repositories/customerIdentityRepository";
import { issueLoyaltyNumberForIdentity } from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import {
  issueQrIdentityForIdentity,
  regenerateQrIdentityForIdentity,
} from "../../qrIdentity/repositories/qrIdentityRepository";
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
import { createRewardProgram } from "../../rewardProgram/services/createRewardProgramCommand";
import { publishRewardProgramVersion } from "../../rewardProgram/services/publishRewardProgramVersionCommand";
import { createNextRewardProgramVersion } from "../../rewardProgram/services/createNextRewardProgramVersionCommand";
import { insertQualifyingItem } from "../../qualifyingItem/repositories/qualifyingItemRepository";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { recordPurchase } from "./recordPurchaseCommand";
import { verifyPurchase } from "./verifyPurchaseCommand";
import { rejectPurchase } from "./rejectPurchaseCommand";
import { raisePurchaseDispute } from "./raisePurchaseDisputeCommand";
import {
  listPurchasesForBusiness,
  getPurchaseRecordForBusiness,
  listPurchasesWaitingForCustomer,
  getPurchaseRecordForCustomer,
  listAvailableRewardsForCustomer,
} from "./purchaseQueries";
import { getVerifiedUnitCreditForPurchase } from "../repositories/verifiedUnitRepository";
import {
  listAllocationPositionsForUnit,
  sumAllocatedPositionsForCycle,
  LOYALTY_CYCLE_THRESHOLD,
} from "../repositories/loyaltyCycleRepository";
import { listTrustEventsForPurchase } from "../repositories/trustEventRepository";
import { listNotificationIntentsForPurchase } from "../repositories/purchaseOutboxRepository";
import { PurchaseDomainError } from "../models/purchaseErrors";
import { IdentityDomainError } from "../../identity/models/identityErrors";
import type { PurchaseRejectReason, PurchaseDisputeReason } from "../models/purchase";

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

const app = initializeApp({ projectId: "demo-11thonus" }, "purchaseCommandsPostgresTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;

let seq = 0;
let customerSeq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

/** Loyalty Numbers must match /^[A-HJ-NP-Z]{3}[2-9]{3}$/ — digits stay in 2..9 by construction. */
function lnFor(i: number): string {
  const d = (n: number) => String(2 + (((n % 8) + 8) % 8));
  return `PVL${d(i)}${d(i + 3)}${d(i + 5)}`;
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
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite alongside a live PostgreSQL instance. See this file's header comment for the exact command.",
    );
  }
  pool = createPostgresPool(loadPostgresConfig());
  const files = await discoverMigrationFiles(migrationsDir);
  if (files.length === 0) {
    throw new Error("No migrations found — did the migrations/ directory get cleaned?");
  }
  await migrateUp(pool, migrationsDir);

  const existing = await db.collection("knowledgeNodes").doc("pvl_ind").get();
  if (!existing.exists) {
    const at = new Date("2026-09-14T00:00:00.000Z");
    async function activate(id: string) {
      await transitionKnowledgeNodeStatusPersisted(db, id, "in_review", { updatedAt: at });
      await transitionKnowledgeNodeStatusPersisted(db, id, "active", { updatedAt: at });
    }
    await createKnowledgeNodePersisted(db, {
      id: "pvl_ind",
      nodeType: "industry",
      parentId: null,
      canonicalName: "PVL Industry",
      slug: "pvl-industry",
      createdAt: at,
    });
    await activate("pvl_ind");
    await createKnowledgeNodePersisted(db, {
      id: "pvl_cat",
      nodeType: "business_category",
      parentId: "pvl_ind",
      canonicalName: "PVL Category",
      slug: "pvl-category",
      createdAt: at,
    });
    await activate("pvl_cat");
    await createKnowledgeNodePersisted(db, {
      id: "pvl_type",
      nodeType: "business_type",
      parentId: "pvl_cat",
      canonicalName: "PVL Type",
      slug: "pvl-type",
      createdAt: at,
    });
    await activate("pvl_type");
    await createKnowledgeNodePersisted(db, {
      id: "pvl_rpcat",
      nodeType: "reward_program_category",
      parentId: "pvl_type",
      canonicalName: "PVL Reward Category",
      slug: "pvl-reward-category",
      createdAt: at,
    });
    await activate("pvl_rpcat");
    await createKnowledgeNodePersisted(db, {
      id: "pvl_product",
      nodeType: "standard_product",
      parentId: "pvl_rpcat",
      canonicalName: "PVL Standard Product",
      slug: "pvl-standard-product",
      createdAt: at,
    });
    await activate("pvl_product");
  }
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
  await pool.query("DELETE FROM reward_program_version_qualifying_nodes");
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

async function seedBusiness(businessId: string, status = "trial") {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ34567X",
      ownerUserId: `owner_of_${businessId}`,
      displayName: "PVL Cafe",
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

async function seedMembership(params: {
  membershipId: string;
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
}) {
  await db.collection("businessMemberships").doc(params.membershipId).set({
    userId: params.userId,
    businessId: params.businessId,
    role: params.role,
    status: "active",
    permissions: [],
  });
}

async function seedCustomer(
  suffix: string,
): Promise<{ customerId: string; ln: string; qr: string }> {
  const customerId = nextId("cust");
  // Dedicated per-customer counter: consecutive customers in one test get
  // distinct Loyalty Numbers (global value→identity uniqueness holds
  // within the test's Firestore state; afterEach clears collections).
  customerSeq += 1;
  const ln = lnFor(customerSeq);
  const qr = `qrpvl${customerSeq}ref`;
  await createCustomerIdentity(db, {
    eventId: `evt_c_${suffix}`,
    correlationId: `corr_c_${suffix}`,
    actor,
    occurredAt: "2026-09-14T00:00:00.000Z",
    customerIdentityId: customerId,
    initialAuthenticationReference: {
      referenceId: `authuid_${customerId}`,
      referenceType: "phone_otp" as const,
      createdAt: new Date("2026-09-14T00:00:00.000Z"),
      createdBy: customerId,
    },
    createdAt: new Date("2026-09-14T00:00:00.000Z"),
    createdBy: customerId,
    idempotencyKey: `create_${suffix}`,
    requestHash: `hash_create_${suffix}`,
  });
  await issueLoyaltyNumberForIdentity(db, {
    eventId: `evt_ln_${suffix}`,
    correlationId: `corr_ln_${suffix}`,
    actor,
    occurredAt: "2026-09-14T00:05:00.000Z",
    customerIdentityId: customerId,
    assignedAt: new Date("2026-09-14T00:05:00.000Z"),
    createdBy: customerId,
    generator: new FixedGenerator(ln),
    idempotencyKey: `key_ln_${suffix}`,
    requestHash: `hash_ln_${suffix}`,
  });
  await issueQrIdentityForIdentity(db, {
    eventId: `evt_qr_${suffix}`,
    correlationId: `corr_qr_${suffix}`,
    actor,
    occurredAt: "2026-09-14T00:10:00.000Z",
    customerIdentityId: customerId,
    loyaltyNumber: ln,
    issuedAt: new Date("2026-09-14T00:10:00.000Z"),
    createdBy: customerId,
    generator: new FixedGenerator(qr),
    idempotencyKey: `key_qr_${suffix}`,
    requestHash: `hash_qr_${suffix}`,
  });
  return { customerId, ln, qr };
}

/**
 * Test-only Reward Program qualification setup (`PLATFORM-BASELINE-013B`):
 * these suites prove the PURCHASE contract, so the Reward Program under
 * test is configured with an unclassified Business-owned Qualifying Item
 * (`knowledgeNodeId = NULL`, zero Commerce Knowledge involvement). The
 * purchase request types, persistence, idempotency identity, and Trust
 * Events under test are untouched by this setup change.
 */
async function createQualifyingItemForTest(
  businessId: string,
  name = "PVL Test Item",
): Promise<string> {
  const item = await withPlatformTransaction(pool, async (tx) =>
    insertQualifyingItem(tx, {
      businessId,
      name,
      knowledgeNodeId: null,
      actorId: "test-seed",
    }),
  );
  return item.id;
}

async function createPublishedProgram(params: {
  businessId: string;
  ownerId: string;
  sharedLoyaltyNumberAllowed: boolean;
  multipleUnitsAllowed: boolean;
  rewardDescription?: string;
}): Promise<{ programId: string; versionId: string; qualifyingItemId: string }> {
  const qualifyingItemId = await createQualifyingItemForTest(params.businessId);
  const created = await createRewardProgram(db, pool, {
    userId: params.ownerId,
    request: {
      businessId: params.businessId,
      displayName: "PVL Program",
      rewardProgramCategoryId: "pvl_rpcat",
      rewardDescription: params.rewardDescription ?? "One free coffee",
      multipleUnitsAllowed: params.multipleUnitsAllowed,
      sharedLoyaltyNumberAllowed: params.sharedLoyaltyNumberAllowed,
      effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
      qualifyingItemIds: [qualifyingItemId],
    } as never,
    idempotencyKey: nextId("key_prog"),
    correlationId: nextId("corr_prog"),
  });
  const published = await publishRewardProgramVersion(db, pool, {
    userId: params.ownerId,
    request: {
      businessId: params.businessId,
      rewardProgramId: created.program.id,
      versionId: created.version.id,
    },
    idempotencyKey: nextId("key_pub"),
    correlationId: nextId("corr_pub"),
  });
  return { programId: created.program.id, versionId: published.id, qualifyingItemId };
}

async function setupBusinessWithProgram(params: {
  sharedLoyaltyNumberAllowed: boolean;
  multipleUnitsAllowed: boolean;
  recorderRole?: "owner" | "manager" | "staff";
}): Promise<{
  businessId: string;
  recorderId: string;
  programId: string;
  versionId: string;
  qualifyingItemId: string;
  customer: { customerId: string; ln: string; qr: string };
}> {
  const businessId = nextId("biz");
  const recorderId = nextId("rec");
  const ownerId = nextId("owner");
  await seedBusiness(businessId);
  await seedMembership({ membershipId: nextId("mem"), userId: ownerId, businessId, role: "owner" });
  await seedMembership({
    membershipId: nextId("mem"),
    userId: recorderId,
    businessId,
    role: params.recorderRole ?? "staff",
  });
  const { programId, versionId, qualifyingItemId } = await createPublishedProgram({
    businessId,
    ownerId,
    sharedLoyaltyNumberAllowed: params.sharedLoyaltyNumberAllowed,
    multipleUnitsAllowed: params.multipleUnitsAllowed,
  });
  const customer = await seedCustomer(nextId("s"));
  return { businessId, recorderId, programId, versionId, qualifyingItemId, customer };
}

/**
 * Base purchase body. `PLATFORM-BASELINE-013C`: the structural item identity
 * (`qualifyingItemId`) is the first argument -- the server derives the
 * human-readable `itemLabel` from the locked version's frozen snapshot, so no
 * item label is ever supplied by a caller.
 */
function baseRecordRequest(qualifyingItemId: string, overrides: Record<string, unknown> = {}) {
  return {
    quantity: 2,
    qualifyingItemId,
    purchaseDate: new Date("2026-09-14T10:00:00.000Z"),
    ...overrides,
  };
}

async function count(table: string): Promise<number> {
  const r = await pool.query(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(r.rows[0].c);
}

// ---------------------------------------------------------------------------
// recordPurchase.
// ---------------------------------------------------------------------------

describe("recordPurchase — artifact policy, program eligibility, quantity, idempotency", () => {
  it("LN + shared=true → allowed", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const result = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.status).toBe("waiting_for_customer");
    expect(result.purchase.presentedArtifactType).toBe("loyalty_number");
    expect(result.purchase.customerIdentityId).toBe(s.customer.customerId);
    expect(result.purchase.canonicalLoyaltyNumberValue).toBe(s.customer.ln);
    expect(result.purchase.rewardProgramVersionId).toBe(s.versionId);
    expect(result.purchase.recordedByRole).toBe("staff");
  });

  it("QR + shared=true → allowed", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const result = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { qrReference: s.customer.qr }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.presentedArtifactType).toBe("qr_identity");
    expect(result.purchase.customerIdentityId).toBe(s.customer.customerId);
  });

  it("LN + shared=false → rejected", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: false,
      multipleUnitsAllowed: true,
    });
    await expect(
      recordPurchase(db, pool, {
        userId: s.recorderId,
        request: {
          businessId: s.businessId,
          rewardProgramId: s.programId,
          ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln }),
        },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
    expect(await count("purchase_records")).toBe(0);
  });

  it("current QR + shared=false → allowed", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: false,
      multipleUnitsAllowed: true,
    });
    const result = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { qrReference: s.customer.qr }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.status).toBe("waiting_for_customer");
    expect(result.purchase.customerIdentityId).toBe(s.customer.customerId);
  });

  it("stale QR → rejected with no PG state", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const staleQr = s.customer.qr;
    await regenerateQrIdentityForIdentity(db, {
      eventId: `evt_regen_${seq}`,
      correlationId: `corr_regen_${seq}`,
      actor,
      occurredAt: "2026-09-14T01:00:00.000Z",
      customerIdentityId: s.customer.customerId,
      regeneratedAt: new Date("2026-09-14T01:00:00.000Z"),
      createdBy: s.customer.customerId,
      generator: new FixedGenerator(`qrpvl${seq}new`),
      idempotencyKey: nextId("key_regen"),
      requestHash: nextId("hash_regen"),
    });
    await expect(
      recordPurchase(db, pool, {
        userId: s.recorderId,
        request: {
          businessId: s.businessId,
          rewardProgramId: s.programId,
          ...baseRecordRequest(s.qualifyingItemId, { qrReference: staleQr }),
        },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(IdentityDomainError);
    expect(await count("purchase_records")).toBe(0);
  });

  it("draft (inactive, never-published) program fails closed", async () => {
    const businessId = nextId("biz");
    const ownerId = nextId("owner");
    const recorderId = nextId("rec");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: ownerId,
      businessId,
      role: "owner",
    });
    await seedMembership({
      membershipId: nextId("mem"),
      userId: recorderId,
      businessId,
      role: "staff",
    });
    const created = await createRewardProgram(db, pool, {
      userId: ownerId,
      request: {
        businessId,
        displayName: "PVL Draft Program",
        rewardProgramCategoryId: "pvl_rpcat",
        rewardDescription: "Draft terms",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: true,
        effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
        qualifyingItemIds: [await createQualifyingItemForTest(businessId)],
      } as never,
      idempotencyKey: nextId("key_prog"),
      correlationId: nextId("corr_prog"),
    });
    const customer = await seedCustomer(nextId("s"));
    await expect(
      recordPurchase(db, pool, {
        userId: recorderId,
        request: {
          businessId,
          rewardProgramId: created.program.id,
          ...baseRecordRequest("00000000-0000-0000-0000-000000000000", {
            loyaltyNumberValue: customer.ln,
          }),
        },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
    expect(await count("purchase_records")).toBe(0);
  });

  it("program of another Business fails closed", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const otherBiz = nextId("biz");
    const otherRec = nextId("rec");
    await seedBusiness(otherBiz);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: otherRec,
      businessId: otherBiz,
      role: "staff",
    });
    await expect(
      recordPurchase(db, pool, {
        userId: otherRec,
        request: {
          businessId: otherBiz,
          rewardProgramId: s.programId,
          ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln }),
        },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
    expect(await count("purchase_records")).toBe(0);
  });

  it("quantity=0 fails closed", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    await expect(
      recordPurchase(db, pool, {
        userId: s.recorderId,
        request: {
          businessId: s.businessId,
          rewardProgramId: s.programId,
          ...baseRecordRequest(s.qualifyingItemId, {
            loyaltyNumberValue: s.customer.ln,
            quantity: 0,
          }),
        },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
  });

  it("multipleUnitsAllowed=false with qty>1 fails closed; qty=1 allowed", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: false,
    });
    await expect(
      recordPurchase(db, pool, {
        userId: s.recorderId,
        request: {
          businessId: s.businessId,
          rewardProgramId: s.programId,
          ...baseRecordRequest(s.qualifyingItemId, {
            loyaltyNumberValue: s.customer.ln,
            quantity: 3,
          }),
        },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
    const ok = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 1,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(ok.purchase.quantity).toBe(1);
  });

  it("same key + same request replays the created record; same key + different request conflicts", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const key = nextId("key");
    const first = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln }),
      },
      idempotencyKey: key,
      correlationId: nextId("corr"),
    });
    const replay = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln }),
      },
      idempotencyKey: key,
      correlationId: nextId("corr"),
    });
    expect(replay.purchase.id).toBe(first.purchase.id);
    expect(await count("purchase_records")).toBe(1);
    await expect(
      recordPurchase(db, pool, {
        userId: s.recorderId,
        request: {
          businessId: s.businessId,
          rewardProgramId: s.programId,
          ...baseRecordRequest(s.qualifyingItemId, {
            loyaltyNumberValue: s.customer.ln,
            quantity: 5,
          }),
        },
        idempotencyKey: key,
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
  });

  it("records creation Trust Event, Customer Notification Intent, and outbox entry", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const result = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const events = await listTrustEventsForPurchase(pool, result.purchase.id);
    expect(events.map((e) => e.eventType)).toEqual(["purchase.recorded"]);
    expect(events[0].subjectType).toBe("purchase_record");
    const intents = await listNotificationIntentsForPurchase(pool, result.purchase.id);
    expect(intents.map((i) => i.intentType)).toEqual(["purchase_recorded_customer"]);
    expect(intents[0].recipientType).toBe("customer");
    expect(intents[0].recipientId).toBe(s.customer.customerId);
    expect(intents[0].status).toBe("pending");
    const outbox = await pool.query(
      `SELECT event_type FROM purchase_outbox WHERE aggregate_id = $1 ORDER BY occurred_at ASC`,
      [result.purchase.id],
    );
    expect(outbox.rows.map((r) => r.event_type)).toEqual(["purchase_recorded"]);
  });
});

// ---------------------------------------------------------------------------
// PLATFORM-BASELINE-013C — purchase → Business-owned Qualifying Item.
// ---------------------------------------------------------------------------

describe("recordPurchase — Business-owned Qualifying Item authority (PLATFORM-BASELINE-013C)", () => {
  it("records a same-Business qualifying item and persists the structural id + server-derived snapshot (unclassified item is valid)", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const result = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.qualifyingItemId).toBe(s.qualifyingItemId);
    // Server-derived snapshot from the locked version's frozen name -- never a
    // client-supplied label -- and the retained knowledge_node_id stays NULL.
    expect(result.purchase.itemLabel).toBe("PVL Test Item");
    expect(result.purchase.knowledgeNodeId).toBeNull();

    const row = await pool.query<{
      qualifying_item_id: string;
      item_label: string;
      knowledge_node_id: string | null;
    }>(
      `SELECT qualifying_item_id, item_label, knowledge_node_id FROM purchase_records WHERE id = $1`,
      [result.purchase.id],
    );
    expect(row.rows[0].qualifying_item_id).toBe(s.qualifyingItemId);
    expect(row.rows[0].item_label).toBe("PVL Test Item");
    expect(row.rows[0].knowledge_node_id).toBeNull();
  });

  it("rejects fabricated, malformed, foreign-Business, and non-qualifying ids identically with no record written", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });

    // A second Business with its own genuine qualifying item (foreign id).
    const otherBiz = nextId("biz");
    await seedBusiness(otherBiz);
    const foreignItemId = await createQualifyingItemForTest(otherBiz, "Foreign Item");

    // A same-Business item that is deliberately NOT on the locked version.
    const unboundItemId = await createQualifyingItemForTest(s.businessId, "Unbound Item");

    const candidateIds = [
      "11111111-1111-4111-8111-111111111111", // fabricated (well-formed UUID)
      "not-a-uuid", // malformed
      foreignItemId, // foreign Business
      unboundItemId, // same Business, not on the version
    ];

    const errors: PurchaseDomainError[] = [];
    for (const itemId of candidateIds) {
      let rejected = false;
      try {
        await recordPurchase(db, pool, {
          userId: s.recorderId,
          request: {
            businessId: s.businessId,
            rewardProgramId: s.programId,
            ...baseRecordRequest(itemId, { loyaltyNumberValue: s.customer.ln }),
          },
          idempotencyKey: nextId("key"),
          correlationId: nextId("corr"),
        });
      } catch (error) {
        rejected = true;
        expect(error).toBeInstanceOf(PurchaseDomainError);
        errors.push(error as PurchaseDomainError);
      }
      expect(rejected, `expected "${itemId}" to be rejected`).toBe(true);
    }

    // Identical category AND message for every case: no cross-Business
    // existence disclosure (a foreign id is indistinguishable from a
    // fabricated one).
    expect(new Set(errors.map((e) => e.category))).toEqual(new Set(["VALIDATION_FAILED"]));
    expect(new Set(errors.map((e) => e.message))).toEqual(
      new Set(["The selected qualifying item is not available for this Reward Program."]),
    );
    expect(await count("purchase_records")).toBe(0);
  });

  it("ignores a client-injected itemLabel/knowledgeNodeId: the persisted label is the server-derived version snapshot", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const result = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          itemLabel: "ATTACKER LABEL",
          knowledgeNodeId: "attacker-node",
        }),
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.itemLabel).toBe("PVL Test Item");
    expect(result.purchase.knowledgeNodeId).toBeNull();
  });

  it("idempotency distinguishes different qualifyingItemIds (fingerprint is not item-blind)", async () => {
    const businessId = nextId("biz");
    const ownerId = nextId("owner");
    const recorderId = nextId("rec");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: ownerId,
      businessId,
      role: "owner",
    });
    await seedMembership({
      membershipId: nextId("mem"),
      userId: recorderId,
      businessId,
      role: "staff",
    });
    const itemA = await createQualifyingItemForTest(businessId, "Item A");
    const itemB = await createQualifyingItemForTest(businessId, "Item B");
    const created = await createRewardProgram(db, pool, {
      userId: ownerId,
      request: {
        businessId,
        displayName: "Two-item program",
        rewardProgramCategoryId: "pvl_rpcat",
        rewardDescription: "One free coffee",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: true,
        effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
        qualifyingItemIds: [itemA, itemB],
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
    const customer = await seedCustomer(nextId("s"));
    const sharedKey = nextId("key_same");
    const requestFor = (qualifyingItemId: string) => ({
      userId: recorderId,
      request: {
        businessId,
        rewardProgramId: created.program.id,
        ...baseRecordRequest(qualifyingItemId, { loyaltyNumberValue: customer.ln }),
      },
      idempotencyKey: sharedKey,
      correlationId: nextId("corr"),
    });

    const first = await recordPurchase(db, pool, requestFor(itemA));
    expect(first.purchase.qualifyingItemId).toBe(itemA);
    expect(first.purchase.itemLabel).toBe("Item A");

    // Same key, otherwise identical request, DIFFERENT qualifying item ->
    // conflict, never a silent duplicate of the first item.
    await expect(recordPurchase(db, pool, requestFor(itemB))).rejects.toThrow(PurchaseDomainError);
    expect(await count("purchase_records")).toBe(1);
  });

  it("purchase.recorded carries the opaque qualifyingItemId; wrong_item dispute stays coherent", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const events = await listTrustEventsForPurchase(pool, rec.purchase.id);
    expect(events.map((e) => e.eventType)).toEqual(["purchase.recorded"]);
    expect(events[0].payload.qualifyingItemId).toBe(s.qualifyingItemId);

    const disputed = await raisePurchaseDispute(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: rec.purchase.id, reason: "wrong_item" },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(disputed.purchase.disputeReason).toBe("wrong_item");
    expect(disputed.purchase.qualifyingItemId).toBe(s.qualifyingItemId);
    expect(disputed.purchase.itemLabel).toBe("PVL Test Item");
  });
});

// ---------------------------------------------------------------------------
// verifyPurchase.
// ---------------------------------------------------------------------------

describe("verifyPurchase — ownership, states, races, replay, rollback", () => {
  async function setupVerifiedSetup(quantity: number) {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, { loyaltyNumberValue: s.customer.ln, quantity }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    return { ...s, purchaseId: rec.purchase.id };
  }

  it("valid verify transitions, issues one credit, allocates into a new cycle", async () => {
    const s = await setupVerifiedSetup(4);
    const result = await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: s.purchaseId },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.status).toBe("verified");
    expect(result.verifiedUnit.quantity).toBe(4);
    expect(result.verifiedUnit.purchaseRecordId).toBe(s.purchaseId);
    expect(result.cycle.allocatedUnits).toBe(4);
    expect(result.cycle.sequenceNumber).toBe(1);
    expect(result.reward).toBeNull();
  });

  it("wrong Customer is denied with no side effects", async () => {
    const s = await setupVerifiedSetup(2);
    const other = await seedCustomer(nextId("s"));
    await expect(
      verifyPurchase(db, pool, {
        customerIdentityId: other.customerId,
        request: { purchaseRecordId: s.purchaseId },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
    expect(await count("verified_units")).toBe(0);
    expect(await count("purchase_outbox")).toBe(1); // creation only
    const still = await getPurchaseRecordForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
      purchaseRecordId: s.purchaseId,
    });
    expect(still.purchase.status).toBe("waiting_for_customer");
  });

  it("stale state: second verify fails; verify after reject fails", async () => {
    const s = await setupVerifiedSetup(2);
    await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: s.purchaseId },
      idempotencyKey: nextId("key1"),
      correlationId: nextId("corr"),
    });
    await expect(
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: s.purchaseId },
        idempotencyKey: nextId("key2"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
    expect(await count("verified_units")).toBe(1);

    const s2 = await setupVerifiedSetup(1);
    await rejectPurchase(db, pool, {
      customerIdentityId: s2.customer.customerId,
      request: { purchaseRecordId: s2.purchaseId, reason: "duplicate" },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await expect(
      verifyPurchase(db, pool, {
        customerIdentityId: s2.customer.customerId,
        request: { purchaseRecordId: s2.purchaseId },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
  });

  it("verify-vs-reject race: exactly one transition commits", async () => {
    const s = await setupVerifiedSetup(2);
    const outcomes = await Promise.allSettled([
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: s.purchaseId },
        idempotencyKey: nextId("key_v"),
        correlationId: nextId("corr"),
      }),
      rejectPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: s.purchaseId, reason: "duplicate" },
        idempotencyKey: nextId("key_r"),
        correlationId: nextId("corr"),
      }),
    ]);
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);
    const detail = await getPurchaseRecordForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
      purchaseRecordId: s.purchaseId,
    });
    expect(["verified", "rejected"]).toContain(detail.purchase.status);
    // Exactly one post-creation transition event.
    expect(detail.events.filter((e) => e.toStatus !== "waiting_for_customer")).toHaveLength(1);
  });

  it("verify-vs-dispute race: exactly one transition commits", async () => {
    const s = await setupVerifiedSetup(2);
    const outcomes = await Promise.allSettled([
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: s.purchaseId },
        idempotencyKey: nextId("key_v"),
        correlationId: nextId("corr"),
      }),
      raisePurchaseDispute(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: s.purchaseId, reason: "wrong_quantity" },
        idempotencyKey: nextId("key_d"),
        correlationId: nextId("corr"),
      }),
    ]);
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);
  });

  it("replay returns the stored result without a second credit", async () => {
    const s = await setupVerifiedSetup(3);
    const key = nextId("key");
    const first = await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: s.purchaseId },
      idempotencyKey: key,
      correlationId: nextId("corr"),
    });
    const replay = await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: s.purchaseId },
      idempotencyKey: key,
      correlationId: nextId("corr"),
    });
    expect(replay.purchase.id).toBe(first.purchase.id);
    expect(await count("verified_units")).toBe(1);
    expect(await count("rewards")).toBe(0);
  });

  it("same key + different purchase conflicts", async () => {
    const s = await setupVerifiedSetup(2);
    const rec2 = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 1,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const key = nextId("key");
    await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: s.purchaseId },
      idempotencyKey: key,
      correlationId: nextId("corr"),
    });
    await expect(
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: rec2.purchase.id },
        idempotencyKey: key,
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
  });
});

// ---------------------------------------------------------------------------
// Concurrent SAME-KEY idempotency (CORR-001).
// ---------------------------------------------------------------------------

/**
 * `PLATFORM-BASELINE-006A-CORR-001` — closes the single P2 gap found by the
 * independent review `PLATFORM-BASELINE-006A-ITR-001`: the suite raced many
 * genuine concurrency scenarios against real PostgreSQL, but never raced two
 * truly simultaneous requests carrying the SAME idempotency key.
 *
 * Mechanism under test (`rewardProgram/repositories/idempotencyRepository.ts`):
 * each command reserves its key with
 * `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING ...` inside
 * its own `withPlatformTransaction` (a distinct pooled connection, real
 * `BEGIN`/`COMMIT`). Two same-key transactions therefore interact entirely
 * inside PostgreSQL:
 *
 *  - exactly one transaction's speculative insertion wins the unique index on
 *    `idempotency_key`; it returns a row and proceeds as `acquired`;
 *  - the loser's `INSERT` does not fail and does not return — PostgreSQL makes
 *    it WAIT on the winner's uncommitted tuple, so the loser cannot observe a
 *    half-applied world;
 *  - when the winner commits (having marked the key `completed` in the SAME
 *    transaction as its domain effect), `DO NOTHING` applies, the loser's
 *    `SELECT ... FOR UPDATE` re-read sees `completed` + a matching request
 *    hash, and the loser replays the winner's stored snapshot;
 *  - if the winner instead rolls back, its reservation row vanishes with it and
 *    the loser's own insert succeeds — retryable, never stuck.
 *
 * Both `duplicate` (winner already committed) and `in_progress` (re-read
 * observed a still-processing reservation) are governed, correct outcomes, so
 * these tests assert the UNION of acceptable resolution shapes plus the domain
 * invariants — never that a particular caller "wins".
 */

type SettledVerify = PromiseSettledResult<Awaited<ReturnType<typeof verifyPurchase>>>;

/** Governed idempotency resolutions a same-key racer may legitimately produce. */
const GOVERNED_IDEMPOTENCY_CATEGORIES = ["TEMPORARY_UNAVAILABLE", "IDEMPOTENCY_CONFLICT"];

function assertGovernedRejection(outcome: PromiseSettledResult<unknown>): void {
  if (outcome.status !== "rejected") return;
  // Never a raw pg error (e.g. a leaked unique_violation) — always a governed
  // domain error, and only the idempotency-governed categories.
  expect(outcome.reason).toBeInstanceOf(PurchaseDomainError);
  expect(GOVERNED_IDEMPOTENCY_CATEGORIES).toContain(
    (outcome.reason as PurchaseDomainError).category,
  );
}

async function countWhere(sql: string, params: unknown[]): Promise<number> {
  const r = await pool.query(sql, params);
  return Number(r.rows[0].c);
}

describe("idempotency — two truly concurrent SAME-KEY requests (CORR-001)", () => {
  it("verifyPurchase: same key, same body, fired simultaneously → exactly one applied effect", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    // Quantity 10 fills a fresh Cycle exactly, so this race also exercises the
    // threshold sub-transaction (Reward + reward Trust Events + reward intents).
    const rec = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 10,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const purchaseId = rec.purchase.id;

    const sharedKey = nextId("key_same");
    const call = () =>
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: purchaseId },
        idempotencyKey: sharedKey,
        correlationId: nextId("corr"),
      });
    // Genuinely simultaneous: both promises are created before either is
    // awaited, and each opens its own pooled PostgreSQL connection.
    const outcomes: SettledVerify[] = await Promise.allSettled([call(), call()]);

    // --- Resolution shapes (union, not a fixed winner) -----------------------
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    for (const outcome of outcomes) {
      assertGovernedRejection(outcome);
      if (outcome.status === "fulfilled") {
        // Original success or replayed duplicate — indistinguishable and
        // identical by contract.
        expect(outcome.value.purchase.id).toBe(purchaseId);
        expect(outcome.value.purchase.status).toBe("verified");
      }
    }
    if (fulfilled.length === 2) {
      const [a, b] = fulfilled.map((o) => (o as PromiseFulfilledResult<never>).value) as Awaited<
        ReturnType<typeof verifyPurchase>
      >[];
      // A replay returns the winner's stored snapshot — same effect, not a second one.
      expect(b.verifiedUnit.id).toBe(a.verifiedUnit.id);
      expect(b.cycle.id).toBe(a.cycle.id);
      expect(b.reward?.id ?? null).toBe(a.reward?.id ?? null);
    }

    // --- §3.1 terminal state reached exactly once ---------------------------
    const purchaseRows = await pool.query(`SELECT status FROM purchase_records WHERE id = $1`, [
      purchaseId,
    ]);
    expect(purchaseRows.rows).toHaveLength(1);
    expect(purchaseRows.rows[0].status).toBe("verified");

    // --- §3.2 exactly one Verified Unit credit ------------------------------
    expect(
      await countWhere(
        `SELECT COUNT(*) AS c FROM verified_units WHERE purchase_record_id = $1 AND entry_type = 'credit'`,
        [purchaseId],
      ),
    ).toBe(1);
    const unit = await getVerifiedUnitCreditForPurchase(pool, purchaseId);
    expect(unit).not.toBeNull();
    expect(unit!.quantity).toBe(10);

    // --- §3.3 allocation quantity exists exactly once ------------------------
    const positions = await listAllocationPositionsForUnit(pool, unit!.id);
    expect(positions).toHaveLength(1);
    expect(positions[0].allocatedQuantity).toBe(10);
    expect(positions[0].state).toBe("allocated");

    // --- §3.4 cycle progress counted once ------------------------------------
    const cycles = await pool.query(
      `SELECT id, allocated_units, state FROM loyalty_cycles WHERE customer_identity_id = $1`,
      [s.customer.customerId],
    );
    expect(cycles.rows).toHaveLength(1);
    expect(Number(cycles.rows[0].allocated_units)).toBe(LOYALTY_CYCLE_THRESHOLD);
    expect(cycles.rows[0].state).toBe("reward_available");

    // --- §3.5 at most one Reward across the crossed threshold ----------------
    expect(await count("rewards")).toBe(1);

    // --- §3.6 exactly one `verified` lifecycle transition event --------------
    expect(
      await countWhere(
        `SELECT COUNT(*) AS c FROM purchase_record_events WHERE purchase_record_id = $1 AND to_status = 'verified'`,
        [purchaseId],
      ),
    ).toBe(1);

    // --- §3.7 no duplicate Trust Event --------------------------------------
    const trustTypes = (await listTrustEventsForPurchase(pool, purchaseId))
      .map((e) => e.eventType)
      .sort();
    expect(trustTypes).toEqual(
      [
        "purchase.recorded",
        "purchase.verified",
        "verified_units.issued",
        "loyalty_cycle.allocated",
        "loyalty_cycle.reward_available",
        "reward.available",
      ].sort(),
    );
    expect(new Set(trustTypes).size).toBe(trustTypes.length);

    // --- §3.8 no duplicate Notification Intent -------------------------------
    const intentTypes = (await listNotificationIntentsForPurchase(pool, purchaseId))
      .map((i) => i.intentType)
      .sort();
    expect(intentTypes).toEqual(
      [
        "purchase_recorded_customer",
        "purchase_verified_business",
        "reward_available_customer",
      ].sort(),
    );
    expect(new Set(intentTypes).size).toBe(intentTypes.length);

    // --- §3.9 no duplicate outbox row ----------------------------------------
    const outboxTypes = (
      await pool.query(`SELECT event_type FROM purchase_outbox WHERE aggregate_id = $1`, [
        purchaseId,
      ])
    ).rows
      .map((r) => r.event_type as string)
      .sort();
    expect(outboxTypes).toEqual(
      [
        "purchase_recorded",
        "purchase_verified",
        "verified_units_issued",
        "loyalty_cycle_allocated",
        "loyalty_cycle_reward_available",
        "reward_available",
      ].sort(),
    );
    expect(new Set(outboxTypes).size).toBe(outboxTypes.length);

    // --- §3.10 exactly one idempotency record represents the operation -------
    const keyRows = await pool.query(
      `SELECT status, operation_type, result_reference FROM idempotency_keys WHERE idempotency_key = $1`,
      [sharedKey],
    );
    expect(keyRows.rows).toHaveLength(1);
    expect(keyRows.rows[0].status).toBe("completed");
    expect(keyRows.rows[0].operation_type).toBe("purchase.verify");
    expect(keyRows.rows[0].result_reference).toBe(purchaseId);

    // --- §3.11 conservation: nothing created, nothing lost -------------------
    const creditedTotal = await countWhere(
      `SELECT COALESCE(SUM(quantity), 0) AS c FROM verified_units WHERE purchase_record_id = $1 AND entry_type = 'credit'`,
      [purchaseId],
    );
    expect(creditedTotal).toBe(rec.purchase.quantity);
    expect(positions.reduce((sum, p) => sum + p.allocatedQuantity, 0)).toBe(rec.purchase.quantity);
    expect(await sumAllocatedPositionsForCycle(pool, cycles.rows[0].id)).toBe(
      rec.purchase.quantity,
    );
  });

  it("recordPurchase: same actor, same body, same key, fired simultaneously → one Purchase Record", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const sharedKey = nextId("key_same");
    // Identical request bodies → identical request fingerprints.
    const body = baseRecordRequest(s.qualifyingItemId, {
      loyaltyNumberValue: s.customer.ln,
      quantity: 3,
    });
    const call = () =>
      recordPurchase(db, pool, {
        userId: s.recorderId,
        request: { businessId: s.businessId, rewardProgramId: s.programId, ...body },
        idempotencyKey: sharedKey,
        correlationId: nextId("corr"),
      });
    const outcomes = await Promise.allSettled([call(), call()]);

    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    for (const outcome of outcomes) assertGovernedRejection(outcome);
    const purchaseIds = new Set(
      fulfilled.map(
        (o) =>
          (o as PromiseFulfilledResult<Awaited<ReturnType<typeof recordPurchase>>>).value.purchase
            .id,
      ),
    );
    expect(purchaseIds.size).toBe(1);
    const purchaseId = [...purchaseIds][0];

    // One Purchase Record; one creation lifecycle event.
    expect(await count("purchase_records")).toBe(1);
    expect(
      await countWhere(
        `SELECT COUNT(*) AS c FROM purchase_record_events WHERE purchase_record_id = $1`,
        [purchaseId],
      ),
    ).toBe(1);
    // One Trust Event, one Notification Intent, one outbox effect.
    expect((await listTrustEventsForPurchase(pool, purchaseId)).map((e) => e.eventType)).toEqual([
      "purchase.recorded",
    ]);
    expect(
      (await listNotificationIntentsForPurchase(pool, purchaseId)).map((i) => i.intentType),
    ).toEqual(["purchase_recorded_customer"]);
    expect(
      (
        await pool.query(`SELECT event_type FROM purchase_outbox WHERE aggregate_id = $1`, [
          purchaseId,
        ])
      ).rows.map((r) => r.event_type),
    ).toEqual(["purchase_recorded"]);
    // One idempotency record for the key.
    const keyRows = await pool.query(
      `SELECT status, operation_type FROM idempotency_keys WHERE idempotency_key = $1`,
      [sharedKey],
    );
    expect(keyRows.rows).toHaveLength(1);
    expect(keyRows.rows[0].status).toBe("completed");
    expect(keyRows.rows[0].operation_type).toBe("purchase.create");
    // No units issued by creation alone.
    expect(await count("verified_units")).toBe(0);
  });

  it("verifyPurchase: same key, DIFFERENT body, fired simultaneously → only one operation is established", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const recA = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 2,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const recB = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 3,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const sharedKey = nextId("key_same");
    // Same key, incompatible request fingerprints (different target Purchase).
    const outcomes: SettledVerify[] = await Promise.allSettled([
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: recA.purchase.id },
        idempotencyKey: sharedKey,
        correlationId: nextId("corr"),
      }),
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: recB.purchase.id },
        idempotencyKey: sharedKey,
        correlationId: nextId("corr"),
      }),
    ]);

    // Exactly one establishes the operation; the incompatible one is refused
    // by governed conflict/in-progress semantics, never a raw error.
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);
    for (const outcome of outcomes) assertGovernedRejection(outcome);

    // The loser created no second domain effect.
    expect(await count("verified_units")).toBe(1);
    expect(
      await countWhere(
        `SELECT COUNT(*) AS c FROM purchase_records WHERE status = 'verified' AND id IN ($1, $2)`,
        [recA.purchase.id, recB.purchase.id],
      ),
    ).toBe(1);
    const keyRows = await pool.query(
      `SELECT status FROM idempotency_keys WHERE idempotency_key = $1`,
      [sharedKey],
    );
    expect(keyRows.rows).toHaveLength(1);
    expect(keyRows.rows[0].status).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// Cycles, concurrency, threshold, rewards.
// ---------------------------------------------------------------------------

describe("cycles — allocation, concurrency, threshold, rewards", () => {
  it("4 units at Cycle progress 8 → 2 allocated + 2 pending, threshold crossed once", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec8 = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 8,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: rec8.purchase.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const rec4 = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 4,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const result = await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: rec4.purchase.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.cycle.allocatedUnits).toBe(LOYALTY_CYCLE_THRESHOLD);
    expect(result.cycle.state).toBe("reward_available");
    expect(result.reward).not.toBeNull();
    expect(result.reward?.rewardQuantity).toBe(1);
    expect(result.reward?.state).toBe("available");
    const positions = await listAllocationPositionsForUnit(pool, result.verifiedUnit.id);
    expect(positions).toHaveLength(2);
    expect(positions.map((p) => [p.allocatedQuantity, p.state]).sort()).toEqual([
      [2, "allocated"],
      [2, "pending"],
    ]);
    expect(await count("rewards")).toBe(1);
  });

  it("two concurrent first verifications create exactly one current cycle", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const recA = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 3,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const recB = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 2,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const [a, b] = await Promise.all([
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: recA.purchase.id },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: recB.purchase.id },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ]);
    expect(a.cycle.id).toBe(b.cycle.id);
    expect(a.cycle.sequenceNumber).toBe(1);
    const finalCycle = a.cycle.allocatedUnits === 5 ? a.cycle : b.cycle;
    expect(finalCycle.allocatedUnits).toBe(5);
    const current = await pool.query(
      `SELECT COUNT(*) AS c FROM loyalty_cycles WHERE customer_identity_id = $1 AND state IN ('active','reward_available')`,
      [s.customer.customerId],
    );
    expect(Number(current.rows[0].c)).toBe(1);
  });

  it("two concurrent verifies at 9/10: exactly one crosses, no overfill, one reward", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec9 = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 9,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: rec9.purchase.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const recA = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 2,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const recB = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 2,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await Promise.all([
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: recA.purchase.id },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: recB.purchase.id },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ]);
    const cycles = await pool.query(
      `SELECT id, allocated_units, state FROM loyalty_cycles WHERE customer_identity_id = $1`,
      [s.customer.customerId],
    );
    expect(cycles.rows).toHaveLength(1);
    expect(Number(cycles.rows[0].allocated_units)).toBe(LOYALTY_CYCLE_THRESHOLD);
    expect(cycles.rows[0].state).toBe("reward_available");
    expect(await count("rewards")).toBe(1);
    // Conservation per credit: each credit of 2 sums to 2 across positions.
    for (const rec of [recA, recB]) {
      const unit = await getVerifiedUnitCreditForPurchase(pool, rec.purchase.id);
      const positions = await listAllocationPositionsForUnit(pool, unit!.id);
      expect(positions.reduce((sum, p) => sum + p.allocatedQuantity, 0)).toBe(2);
    }
    // Cycle counter equals the sum of its allocated positions.
    const allocatedSum = await sumAllocatedPositionsForCycle(pool, cycles.rows[0].id);
    expect(allocatedSum).toBe(LOYALTY_CYCLE_THRESHOLD);
  });

  it("reward carries the cycle governing version across a version bump (FD-PVL-003)", async () => {
    const businessId = nextId("biz");
    const ownerId = nextId("owner");
    const recorderId = nextId("rec");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: ownerId,
      businessId,
      role: "owner",
    });
    await seedMembership({
      membershipId: nextId("mem"),
      userId: recorderId,
      businessId,
      role: "staff",
    });
    const v1ItemId = await createQualifyingItemForTest(businessId);
    const created = await createRewardProgram(db, pool, {
      userId: ownerId,
      request: {
        businessId,
        displayName: "PVL Program",
        rewardProgramCategoryId: "pvl_rpcat",
        rewardDescription: "V1 terms",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: true,
        effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
        qualifyingItemIds: [v1ItemId],
      } as never,
      idempotencyKey: nextId("key_prog"),
      correlationId: nextId("corr_prog"),
    });
    const v1 = await publishRewardProgramVersion(db, pool, {
      userId: ownerId,
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: nextId("key_pub"),
      correlationId: nextId("corr_pub"),
    });
    const customer = await seedCustomer(nextId("s"));
    // Record a 10-unit purchase under V1 (still pending).
    const rec = await recordPurchase(db, pool, {
      userId: recorderId,
      request: {
        businessId,
        rewardProgramId: created.program.id,
        ...baseRecordRequest(v1ItemId, { loyaltyNumberValue: customer.ln, quantity: 10 }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(rec.purchase.rewardProgramVersionId).toBe(v1.id);
    // Publish V2 while the purchase is pending.
    const draft2 = await createNextRewardProgramVersion(db, pool, {
      userId: ownerId,
      request: {
        businessId,
        rewardProgramId: created.program.id,
        displayName: "PVL Program",
        rewardProgramCategoryId: "pvl_rpcat",
        rewardDescription: "V2 terms",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: true,
        effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
        qualifyingItemIds: [v1ItemId],
      } as never,
      idempotencyKey: nextId("key_v2"),
      correlationId: nextId("corr_v2"),
    });
    await publishRewardProgramVersion(db, pool, {
      userId: ownerId,
      request: { businessId, rewardProgramId: created.program.id, versionId: draft2.id },
      idempotencyKey: nextId("key_pub2"),
      correlationId: nextId("corr_pub2"),
    });
    // Verification is NOT blocked and does NOT rebind: everything carries V1.
    const result = await verifyPurchase(db, pool, {
      customerIdentityId: customer.customerId,
      request: { purchaseRecordId: rec.purchase.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.rewardProgramVersionId).toBe(v1.id);
    expect(result.verifiedUnit.rewardProgramVersionId).toBe(v1.id);
    expect(result.cycle.openedUnderVersionId).toBe(v1.id);
    expect(result.reward?.rewardProgramVersionId).toBe(v1.id);
    expect(result.reward?.rewardDescription).toBe("V1 terms");
  });

  it("verify writes the full Trust trio + intents + outbox at threshold", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 10,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const result = await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: rec.purchase.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const events = await listTrustEventsForPurchase(pool, rec.purchase.id);
    expect(events.map((e) => e.eventType).sort()).toEqual(
      [
        "purchase.recorded",
        "purchase.verified",
        "verified_units.issued",
        "loyalty_cycle.allocated",
        "loyalty_cycle.reward_available",
        "reward.available",
      ].sort(),
    );
    const intents = await listNotificationIntentsForPurchase(pool, rec.purchase.id);
    expect(intents.map((i) => i.intentType).sort()).toEqual(
      [
        "purchase_recorded_customer",
        "purchase_verified_business",
        "reward_available_customer",
      ].sort(),
    );
    const outbox = await pool.query(
      `SELECT event_type FROM purchase_outbox WHERE aggregate_id = $1 ORDER BY occurred_at ASC`,
      [rec.purchase.id],
    );
    expect(outbox.rows.map((r) => r.event_type).sort()).toEqual(
      [
        "purchase_recorded",
        "purchase_verified",
        "verified_units_issued",
        "loyalty_cycle_allocated",
        "loyalty_cycle_reward_available",
        "reward_available",
      ].sort(),
    );
    expect(result.reward).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Trust cardinality.
// ---------------------------------------------------------------------------

describe("trust events — repeatable vs one-time cardinality (CORR-003)", () => {
  it("two Purchases allocating into the same Cycle each produce loyalty_cycle.allocated; replay duplicates nothing", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const recA = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 2,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const recB = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 3,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const keyA = nextId("key");
    const resA = await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: recA.purchase.id },
      idempotencyKey: keyA,
      correlationId: nextId("corr"),
    });
    await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: recB.purchase.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const eventsA = await listTrustEventsForPurchase(pool, recA.purchase.id);
    const eventsB = await listTrustEventsForPurchase(pool, recB.purchase.id);
    const allocA = eventsA.filter((e) => e.eventType === "loyalty_cycle.allocated");
    const allocB = eventsB.filter((e) => e.eventType === "loyalty_cycle.allocated");
    expect(allocA).toHaveLength(1);
    expect(allocB).toHaveLength(1);
    // Same Cycle subject, different source transitions — both coexist.
    expect(allocA[0].subjectId).toBe(allocB[0].subjectId);
    expect(allocA[0].sourcePurchaseRecordEventId).not.toBe(allocB[0].sourcePurchaseRecordEventId);
    // Replay of the same transition produces no duplicate.
    await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: recA.purchase.id },
      idempotencyKey: keyA,
      correlationId: nextId("corr"),
    });
    const eventsA2 = await listTrustEventsForPurchase(pool, recA.purchase.id);
    expect(eventsA2).toHaveLength(eventsA.length);
    expect(resA.cycle.allocatedUnits).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// rejectPurchase / raisePurchaseDispute.
// ---------------------------------------------------------------------------

describe("rejectPurchase — every reason, no units", () => {
  const reasons: PurchaseRejectReason[] = [
    "did_not_happen",
    "duplicate",
    "wrong_customer",
    "wrong_program",
    "wholly_invalid",
  ];
  it.each(reasons)("reason %s transitions to rejected with no units", async (reason) => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 2,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const result = await rejectPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: rec.purchase.id, reason },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.status).toBe("rejected");
    expect(result.purchase.rejectionReason).toBe(reason);
    expect(await getVerifiedUnitCreditForPurchase(pool, rec.purchase.id)).toBeNull();
    const events = await listTrustEventsForPurchase(pool, rec.purchase.id);
    expect(events.map((e) => e.eventType).sort()).toEqual(
      ["purchase.recorded", "purchase.rejected"].sort(),
    );
    const intents = await listNotificationIntentsForPurchase(pool, rec.purchase.id);
    expect(intents.map((i) => i.intentType).sort()).toEqual(
      ["purchase_recorded_customer", "purchase_rejected_business"].sort(),
    );
  });
});

describe("raisePurchaseDispute — every reason, no units, holding state", () => {
  const reasons: PurchaseDisputeReason[] = ["wrong_quantity", "wrong_item", "partially_inaccurate"];
  it.each(reasons)("reason %s transitions to under_review with no units", async (reason) => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 2,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const result = await raisePurchaseDispute(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: rec.purchase.id, reason },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(result.purchase.status).toBe("under_review");
    expect(result.purchase.disputeReason).toBe(reason);
    expect(await getVerifiedUnitCreditForPurchase(pool, rec.purchase.id)).toBeNull();
    const events = await listTrustEventsForPurchase(pool, rec.purchase.id);
    expect(events.map((e) => e.eventType).sort()).toEqual(
      ["purchase.recorded", "purchase.disputed"].sort(),
    );
    const intents = await listNotificationIntentsForPurchase(pool, rec.purchase.id);
    expect(intents.map((i) => i.intentType).sort()).toEqual(
      ["purchase_recorded_customer", "purchase_disputed_business"].sort(),
    );
    // Holding state: no customer exit in 006A (verify is stale).
    await expect(
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: rec.purchase.id },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(PurchaseDomainError);
  });
});

// ---------------------------------------------------------------------------
// Reads.
// ---------------------------------------------------------------------------

describe("reads — isolation, ownership, side-effect freedom", () => {
  it("Business isolation: no cross-Business leakage; Customer ownership enforced", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 2,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const otherBiz = nextId("biz");
    const otherUser = nextId("user");
    await seedBusiness(otherBiz);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: otherUser,
      businessId: otherBiz,
      role: "staff",
    });
    // Business list/get scoped to the caller's Business.
    const otherList = await listPurchasesForBusiness(db, pool, {
      userId: otherUser,
      businessId: otherBiz,
    });
    expect(otherList.purchases).toHaveLength(0);
    await expect(
      getPurchaseRecordForBusiness(db, pool, {
        userId: otherUser,
        businessId: otherBiz,
        purchaseRecordId: rec.purchase.id,
      }),
    ).rejects.toThrow(PurchaseDomainError);
    const ownList = await listPurchasesForBusiness(db, pool, {
      userId: s.recorderId,
      businessId: s.businessId,
    });
    expect(ownList.purchases.map((p) => p.id)).toContain(rec.purchase.id);

    // Customer ownership.
    const otherCust = await seedCustomer(nextId("s"));
    await expect(
      getPurchaseRecordForCustomer(pool, {
        customerIdentityId: otherCust.customerId,
        purchaseRecordId: rec.purchase.id,
      }),
    ).rejects.toThrow(PurchaseDomainError);
    const otherWaiting = await listPurchasesWaitingForCustomer(pool, {
      customerIdentityId: otherCust.customerId,
    });
    expect(otherWaiting.purchases).toHaveLength(0);
    const ownWaiting = await listPurchasesWaitingForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
    });
    expect(ownWaiting.purchases.map((p) => p.id)).toContain(rec.purchase.id);
  });

  it("reads create no records (side-effect freedom) and rewards read is ownership-scoped", async () => {
    const s = await setupBusinessWithProgram({
      sharedLoyaltyNumberAllowed: true,
      multipleUnitsAllowed: true,
    });
    const rec = await recordPurchase(db, pool, {
      userId: s.recorderId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        ...baseRecordRequest(s.qualifyingItemId, {
          loyaltyNumberValue: s.customer.ln,
          quantity: 10,
        }),
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: rec.purchase.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    const before = {
      purchases: await count("purchase_records"),
      events: await count("purchase_record_events"),
      trust: await count("trust_events"),
      intents: await count("notification_intents"),
      outbox: await count("purchase_outbox"),
    };
    await listPurchasesForBusiness(db, pool, { userId: s.recorderId, businessId: s.businessId });
    await getPurchaseRecordForBusiness(db, pool, {
      userId: s.recorderId,
      businessId: s.businessId,
      purchaseRecordId: rec.purchase.id,
    });
    await listPurchasesWaitingForCustomer(pool, { customerIdentityId: s.customer.customerId });
    await getPurchaseRecordForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
      purchaseRecordId: rec.purchase.id,
    });
    const rewards = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
    });
    expect(rewards.rewards).toHaveLength(1);
    expect(rewards.rewards[0].state).toBe("available");
    expect(rewards.rewards[0].rewardQuantity).toBe(1);
    const otherCust = await seedCustomer(nextId("s"));
    const otherRewards = await listAvailableRewardsForCustomer(pool, {
      customerIdentityId: otherCust.customerId,
    });
    expect(otherRewards.rewards).toHaveLength(0);
    const after = {
      purchases: await count("purchase_records"),
      events: await count("purchase_record_events"),
      trust: await count("trust_events"),
      intents: await count("notification_intents"),
      outbox: await count("purchase_outbox"),
    };
    expect(after).toEqual(before);
  });
});
