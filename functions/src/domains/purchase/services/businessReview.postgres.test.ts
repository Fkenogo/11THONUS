/**
 * Business Review Domain Foundation — cross-store integration tests
 * (`EA-BL-001-CORR-002-BR`, `DEC-PROD-015`).
 *
 * Requires a live PostgreSQL instance AND the Firestore Emulator (membership/permission state lives in
 * Firestore). Run via:
 *
 *   firebase emulators:exec --only firestore --project demo-11thonus \
 *     "PLATFORM_ENV=test npx vitest run --config vitest.postgres.config.ts businessReview"
 *
 * Covers the BR task §24 matrix: threshold routing, approval, self-review prohibition, rejection,
 * loyalty safety (no Verified Unit / Cycle / Reward from any review decision), customer isolation,
 * idempotency, concurrency, evidence, and Staff ineligibility (fabricated Firestore grant).
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
import { createRewardProgram } from "../../rewardProgram/services/createRewardProgramCommand";
import { createNextRewardProgramVersion } from "../../rewardProgram/services/createNextRewardProgramVersionCommand";
import { publishRewardProgramVersion } from "../../rewardProgram/services/publishRewardProgramVersionCommand";
import { insertQualifyingItem } from "../../qualifyingItem/repositories/qualifyingItemRepository";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { recordPurchase } from "./recordPurchaseCommand";
import { approveBusinessReview, rejectBusinessReview } from "./businessReviewCommands";
import { listPurchaseRecordEvents } from "../repositories/purchaseRecordRepository";
import { verifyPurchase } from "./verifyPurchaseCommand";
import { rejectPurchase } from "./rejectPurchaseCommand";
import { raisePurchaseDispute } from "./raisePurchaseDisputeCommand";
import {
  getPurchaseRecordForBusiness,
  getPurchaseRecordForCustomer,
  listBusinessReviewQueue,
  listPurchasesForBusiness,
  listPurchasesWaitingForCustomer,
} from "./purchaseQueries";
import { listTrustEventsForPurchase } from "../repositories/trustEventRepository";
import { listNotificationIntentsForPurchase } from "../repositories/purchaseOutboxRepository";
import { PurchaseDomainError } from "../models/purchaseErrors";
import { redactPurchaseForCustomer } from "./purchaseQueries";
import {
  getRewardProgram,
  listRewardPrograms,
} from "../../rewardProgram/services/rewardProgramQueries";

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

const app = initializeApp({ projectId: "demo-11thonus" }, "businessReviewPostgresTest");
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
  // CAPABILITY-6-REDEMPTION-ENGINE-001 (0020): redemptions references rewards.
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
// Business Review fixtures.
// ---------------------------------------------------------------------------

type Setup = {
  businessId: string;
  ownerId: string;
  managerId: string;
  manager2Id: string;
  staffId: string;
  programId: string;
  versionId: string;
  qualifyingItemId: string;
  customer: { customerId: string; ln: string; qr: string };
};

const THRESHOLD = 5;

async function setupReviewBusiness(
  params: {
    threshold?: number | null;
    multipleUnitsAllowed?: boolean;
  } = {},
): Promise<Setup> {
  const businessId = nextId("biz");
  const ownerId = nextId("owner");
  const managerId = nextId("mgr");
  const manager2Id = nextId("mgr");
  const staffId = nextId("staff");
  await seedBusiness(businessId);
  for (const [userId, role] of [
    [ownerId, "owner"],
    [managerId, "manager"],
    [manager2Id, "manager"],
    [staffId, "staff"],
  ] as const) {
    await seedMembership({ membershipId: nextId("mem"), userId, businessId, role });
  }
  const qualifyingItemId = await createQualifyingItemForTest(businessId);
  const created = await createRewardProgram(db, pool, {
    userId: ownerId,
    request: {
      businessId,
      displayName: "BR Program",
      rewardProgramCategoryId: "pvl_rpcat",
      rewardDescription: "One free coffee",
      multipleUnitsAllowed: params.multipleUnitsAllowed ?? true,
      sharedLoyaltyNumberAllowed: true,
      businessReviewQuantityThreshold:
        params.threshold === undefined ? THRESHOLD : params.threshold,
      effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
      qualifyingItemIds: [qualifyingItemId],
    } as never,
    idempotencyKey: nextId("key_prog"),
    correlationId: nextId("corr_prog"),
  });
  const published = await publishRewardProgramVersion(db, pool, {
    userId: ownerId,
    request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
    idempotencyKey: nextId("key_pub"),
    correlationId: nextId("corr_pub"),
  });
  const customer = await seedCustomer(nextId("s"));
  return {
    businessId,
    ownerId,
    managerId,
    manager2Id,
    staffId,
    programId: created.program.id,
    versionId: published.id,
    qualifyingItemId,
    customer,
  };
}

async function record(s: Setup, quantity: number, recorderId = s.staffId) {
  return recordPurchase(db, pool, {
    userId: recorderId,
    request: {
      businessId: s.businessId,
      rewardProgramId: s.programId,
      ...baseRecordRequest(s.qualifyingItemId, {
        quantity,
        loyaltyNumberValue: s.customer.ln,
      }),
    },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
}

function approve(
  s: Setup,
  userId: string,
  purchaseRecordId: string,
  key = nextId("key_a"),
  extra = {},
) {
  return approveBusinessReview(db, pool, {
    userId,
    request: { businessId: s.businessId, purchaseRecordId, ...extra },
    idempotencyKey: key,
    correlationId: nextId("corr"),
  });
}

function reject(
  s: Setup,
  userId: string,
  purchaseRecordId: string,
  reason: unknown = "quantity_not_confirmed",
  key = nextId("key_r"),
  note?: unknown,
) {
  return rejectBusinessReview(db, pool, {
    userId,
    request: {
      businessId: s.businessId,
      purchaseRecordId,
      reason,
      ...(note === undefined ? {} : { note }),
    },
    idempotencyKey: key,
    correlationId: nextId("corr"),
  });
}

async function recordForReview(s: Setup, recorderId = s.staffId) {
  const r = await record(s, THRESHOLD, recorderId);
  expect(r.purchase.status).toBe("business_review_required");
  return r.purchase.id;
}

async function expectDomainError(p: Promise<unknown>, category?: string) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(PurchaseDomainError);
  if (category) expect((err as PurchaseDomainError).category).toBe(category);
}

async function loyaltyCounts() {
  return {
    units: await count("verified_units"),
    allocations: await count("verified_unit_allocations"),
    cycles: await count("loyalty_cycles"),
    rewards: await count("rewards"),
  };
}

const NO_LOYALTY = { units: 0, allocations: 0, cycles: 0, rewards: 0 };

async function verify(s: Setup, purchaseRecordId: string) {
  return verifyPurchase(db, pool, {
    customerIdentityId: s.customer.customerId,
    request: { purchaseRecordId },
    idempotencyKey: nextId("key_v"),
    correlationId: nextId("corr"),
  });
}

// ---------------------------------------------------------------------------
// Threshold routing (tests 1-6).
// ---------------------------------------------------------------------------

describe("Business Review — threshold routing", () => {
  it("threshold NULL → waiting_for_customer at any quantity", async () => {
    const s = await setupReviewBusiness({ threshold: null });
    const r = await record(s, 50);
    expect(r.purchase.status).toBe("waiting_for_customer");
    expect(r.review).toEqual({ required: false, status: "waiting_for_customer" });
  });

  it("below threshold → waiting_for_customer", async () => {
    const s = await setupReviewBusiness();
    expect((await record(s, THRESHOLD - 1)).purchase.status).toBe("waiting_for_customer");
  });

  it("exactly at threshold → business_review_required, with no customer notice and no loyalty", async () => {
    const s = await setupReviewBusiness();
    const r = await record(s, THRESHOLD);
    expect(r.purchase.status).toBe("business_review_required");
    expect(r.review).toEqual({ required: true, status: "business_review_required" });
    const intents = await listNotificationIntentsForPurchase(pool, r.purchase.id);
    expect(intents.map((i) => i.intentType)).toEqual([
      "purchase_business_review_required_business",
    ]);
    expect(await loyaltyCounts()).toEqual(NO_LOYALTY);
  });

  it("above threshold → business_review_required (never auto-rejected)", async () => {
    const s = await setupReviewBusiness();
    const r = await record(s, THRESHOLD * 10);
    expect(r.purchase.status).toBe("business_review_required");
    expect(r.purchase.rejectionReason).toBeNull();
    expect(r.purchase.businessReviewReason).toBeNull();
  });

  it("multipleUnitsAllowed=false still caps quantity at 1 (routing never relaxes the rule)", async () => {
    const s = await setupReviewBusiness({ multipleUnitsAllowed: false, threshold: 1 });
    await expectDomainError(record(s, 2));
    expect((await record(s, 1)).purchase.status).toBe("business_review_required");
  });

  it("routing uses the LOCKED version's threshold (frozen into the Trust Event)", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const events = await listTrustEventsForPurchase(pool, id);
    const required = events.find((e) => e.eventType === "purchase.business_review_required");
    expect(required?.payload).toMatchObject({
      rewardProgramVersionId: s.versionId,
      quantity: THRESHOLD,
      businessReviewQuantityThreshold: THRESHOLD,
    });
    // The lifecycle event never carries the configured threshold (Staff-visible read).
    const lifecycle = await listPurchaseRecordEvents(pool, id);
    expect(JSON.stringify(lifecycle)).not.toContain("businessReviewQuantityThreshold");
  });
});

describe("Business Review — per-version threshold lifecycle", () => {
  async function nextVersion(s: Setup, extra: Record<string, unknown>) {
    const draft = await createNextRewardProgramVersion(db, pool, {
      userId: s.ownerId,
      request: {
        businessId: s.businessId,
        rewardProgramId: s.programId,
        displayName: "BR Program",
        rewardProgramCategoryId: "pvl_rpcat",
        rewardDescription: "V2 terms",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: true,
        effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
        qualifyingItemIds: [s.qualifyingItemId],
        ...extra,
      } as never,
      idempotencyKey: nextId("key_v2"),
      correlationId: nextId("corr_v2"),
    });
    await publishRewardProgramVersion(db, pool, {
      userId: s.ownerId,
      request: { businessId: s.businessId, rewardProgramId: s.programId, versionId: draft.id },
      idempotencyKey: nextId("key_pub2"),
      correlationId: nextId("corr_pub2"),
    });
    return draft;
  }

  it("a next version that does not mention the threshold carries it forward (an edit never silently disables review)", async () => {
    const s = await setupReviewBusiness();
    const v2 = await nextVersion(s, {});
    expect(v2.businessReviewQuantityThreshold).toBe(THRESHOLD);
    expect((await record(s, THRESHOLD)).purchase.status).toBe("business_review_required");
  });

  it("an explicit null on the next version disables review for new Purchases only", async () => {
    const s = await setupReviewBusiness();
    const before = await recordForReview(s);
    const v2 = await nextVersion(s, { businessReviewQuantityThreshold: null });
    expect(v2.businessReviewQuantityThreshold).toBeNull();
    expect((await record(s, THRESHOLD * 4)).purchase.status).toBe("waiting_for_customer");
    // The earlier Purchase is still awaiting its decision under the version it was recorded against.
    expect(
      (await pool.query(`SELECT status FROM purchase_records WHERE id=$1`, [before])).rows[0]
        .status,
    ).toBe("business_review_required");
  });
});

// ---------------------------------------------------------------------------
// Approval (7-12) and self-review (13-15).
// ---------------------------------------------------------------------------

describe("Business Review — approval authority", () => {
  it("Owner approves → waiting_for_customer, reviewer + timestamp recorded", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const before = Date.now();
    const result = await approve(s, s.ownerId, id);
    expect(result.purchase.status).toBe("waiting_for_customer");
    expect(result.purchase.businessReviewDecision).toBe("approved");
    expect(result.purchase.businessReviewReviewerUserId).toBe(s.ownerId);
    expect(
      new Date(result.purchase.businessReviewDecidedAt as Date).getTime(),
    ).toBeGreaterThanOrEqual(before - 1000);
    expect(result.purchase.businessReviewReason).toBeNull();
    expect(result.purchase.verifiedAt).toBeNull();
  });

  it("an authorised Manager approves → waiting_for_customer", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const result = await approve(s, s.managerId, id);
    expect(result.purchase.status).toBe("waiting_for_customer");
    expect(result.purchase.businessReviewReviewerUserId).toBe(s.managerId);
  });

  it("Staff cannot approve or reject; nothing changes", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await expectDomainError(approve(s, s.staffId, id), "AUTH_FORBIDDEN");
    await expectDomainError(reject(s, s.staffId, id), "AUTH_FORBIDDEN");
    const events = await listPurchaseRecordEvents(pool, id);
    expect(events).toHaveLength(1);
  });

  it("a fabricated persisted Staff grant is not honoured (and Staff cannot read the queue)", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const snap = await db.collection("businessMemberships").where("userId", "==", s.staffId).get();
    await snap.docs[0].ref.update({
      permissions: [
        {
          permissionId: "purchase.businessReview",
          direction: "grant",
          grantedBy: s.ownerId,
          grantedAt: new Date(),
        },
      ],
    });
    await expectDomainError(approve(s, s.staffId, id), "AUTH_FORBIDDEN");
    await expectDomainError(
      listBusinessReviewQueue(db, pool, { userId: s.staffId, businessId: s.businessId }),
      "AUTH_FORBIDDEN",
    );
  });

  it("a revoked Manager is denied; the Owner still can; Manager re-grant restores it", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const snap = await db
      .collection("businessMemberships")
      .where("userId", "==", s.managerId)
      .get();
    const override = (direction: "grant" | "revoke") => ({
      permissionId: "purchase.businessReview",
      direction,
      grantedBy: s.ownerId,
      grantedAt: new Date(),
    });
    await snap.docs[0].ref.update({ permissions: [override("revoke")] });
    await expectDomainError(approve(s, s.managerId, id), "AUTH_FORBIDDEN");
    await snap.docs[0].ref.update({ permissions: [override("grant")] });
    expect((await approve(s, s.managerId, id)).purchase.status).toBe("waiting_for_customer");
  });

  it("a non-member (Platform Administrator by status alone) and a Customer are denied", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await expectDomainError(approve(s, nextId("platform_admin"), id), "AUTH_FORBIDDEN");
    await expectDomainError(approve(s, s.customer.customerId, id), "AUTH_FORBIDDEN");
    await expectDomainError(
      listBusinessReviewQueue(db, pool, {
        userId: s.customer.customerId,
        businessId: s.businessId,
      }),
      "AUTH_FORBIDDEN",
    );
  });

  it("another Business's Owner cannot review this Business's Purchase", async () => {
    const a = await setupReviewBusiness();
    const b = await setupReviewBusiness();
    const id = await recordForReview(a);
    await expectDomainError(approve(a, b.ownerId, id)); // not a member of A
    await expectDomainError(approve(b, b.ownerId, id), "RESOURCE_NOT_FOUND"); // scoped to B → indistinguishable from missing
  });
});

describe("Business Review — self-review prohibition (no exception)", () => {
  it("an Owner who recorded the Purchase cannot approve or reject it (sole-reviewer fails closed)", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s, s.ownerId);
    await expectDomainError(approve(s, s.ownerId, id), "AUTH_FORBIDDEN");
    await expectDomainError(reject(s, s.ownerId, id), "AUTH_FORBIDDEN");
    expect(
      (
        await getPurchaseRecordForBusiness(db, pool, {
          userId: s.managerId,
          businessId: s.businessId,
          purchaseRecordId: id,
        })
      ).purchase.status,
    ).toBe("business_review_required");
  });

  it("a Manager who recorded the Purchase cannot approve it; a different Manager can", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s, s.managerId);
    await expectDomainError(approve(s, s.managerId, id), "AUTH_FORBIDDEN");
    expect((await approve(s, s.manager2Id, id)).purchase.status).toBe("waiting_for_customer");
  });

  it("the database CHECK independently refuses a self-review", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await expect(
      pool.query(
        `UPDATE purchase_records SET status='waiting_for_customer', business_review_decision='approved',
           business_review_reviewer_user_id = recorded_by_user_id, business_review_decided_at = now()
         WHERE id = $1`,
        [id],
      ),
    ).rejects.toThrow(/business_review_not_self/);
  });
});

// ---------------------------------------------------------------------------
// Rejection (16-20).
// ---------------------------------------------------------------------------

describe("Business Review — rejection", () => {
  it("Owner rejects → rejected with the distinct Business Review reason; customer rejection_reason untouched", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const result = await reject(s, s.ownerId, id, "transaction_not_confirmed");
    expect(result.purchase.status).toBe("rejected");
    expect(result.purchase.businessReviewDecision).toBe("rejected");
    expect(result.purchase.businessReviewReason).toBe("transaction_not_confirmed");
    expect(result.purchase.businessReviewReviewerUserId).toBe(s.ownerId);
    expect(result.purchase.rejectionReason).toBeNull();
    expect(await loyaltyCounts()).toEqual(NO_LOYALTY);
  });

  it("a Manager rejects with every bounded reason", async () => {
    const s = await setupReviewBusiness();
    for (const reason of ["quantity_not_confirmed", "transaction_not_confirmed", "other"]) {
      const id = await recordForReview(s);
      const result = await reject(
        s,
        s.managerId,
        id,
        reason,
        nextId("key_r"),
        reason === "other" ? "Till record unclear" : undefined,
      );
      expect(result.purchase.businessReviewReason).toBe(reason);
    }
  });

  it("a missing / unknown / customer-vocabulary reason fails validation and writes nothing", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    for (const bad of [null, "", "did_not_happen", "duplicate", 7]) {
      await expectDomainError(reject(s, s.ownerId, id, bad), "VALIDATION_FAILED");
    }
    await expectDomainError(
      rejectBusinessReview(db, pool, {
        userId: s.ownerId,
        request: { businessId: s.businessId, purchaseRecordId: id } as never,
        idempotencyKey: nextId("k"),
        correlationId: nextId("c"),
      }),
      "VALIDATION_FAILED",
    );
    expect(await count("purchase_record_events")).toBe(1);
  });

  it("a rejected Purchase is terminal: the customer cannot verify, and no second decision is possible", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await reject(s, s.ownerId, id);
    await expectDomainError(verify(s, id));
    await expectDomainError(approve(s, s.managerId, id));
    expect(await loyaltyCounts()).toEqual(NO_LOYALTY);
  });
});

// ---------------------------------------------------------------------------
// Loyalty safety (21-26) and customer isolation (27-32).
// ---------------------------------------------------------------------------

describe("Business Review — approval never mints loyalty; Customer verification stays mandatory", () => {
  it("approval creates zero Verified Units, Cycle allocations or Rewards; verification then runs the existing path", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await approve(s, s.ownerId, id);
    expect(await loyaltyCounts()).toEqual(NO_LOYALTY);
    const verified = await verify(s, id);
    expect(verified.purchase.status).toBe("verified");
    expect(verified.verifiedUnit.quantity).toBe(THRESHOLD);
    expect(verified.cycle.allocatedUnits).toBe(THRESHOLD);
    expect((await loyaltyCounts()).units).toBe(1);
  });

  it("while review-required the Purchase is invisible to and unactionable by the Customer", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const waiting = await listPurchasesWaitingForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
    });
    expect(waiting.purchases.map((p) => p.id)).not.toContain(id);
    await expectDomainError(verify(s, id), "INVALID_STATE_TRANSITION");
    await expectDomainError(
      rejectPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: id, reason: "duplicate" },
        idempotencyKey: nextId("k"),
        correlationId: nextId("c"),
      }),
      "INVALID_STATE_TRANSITION",
    );
    await expectDomainError(
      raisePurchaseDispute(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: id, reason: "wrong_item" },
        idempotencyKey: nextId("k"),
        correlationId: nextId("c"),
      }),
      "INVALID_STATE_TRANSITION",
    );
    expect(await loyaltyCounts()).toEqual(NO_LOYALTY);
  });

  it("after approval the Customer sees it and reject / dispute work as today", async () => {
    const s = await setupReviewBusiness();
    const a = await recordForReview(s);
    const b = await recordForReview(s);
    await approve(s, s.ownerId, a);
    await approve(s, s.ownerId, b);
    const waiting = await listPurchasesWaitingForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
    });
    expect(waiting.purchases.map((p) => p.id).sort()).toEqual([a, b].sort());
    const rejected = await rejectPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: a, reason: "duplicate" },
      idempotencyKey: nextId("k"),
      correlationId: nextId("c"),
    });
    expect(rejected.purchase.rejectionReason).toBe("duplicate");
    expect(rejected.purchase.businessReviewReason).toBeNull();
    const disputed = await raisePurchaseDispute(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: b, reason: "wrong_quantity" },
      idempotencyKey: nextId("k"),
      correlationId: nextId("c"),
    });
    expect(disputed.purchase.status).toBe("under_review");
  });

  it("the review queue lists only review-required Purchases of THIS Business, oldest first", async () => {
    const s = await setupReviewBusiness();
    const other = await setupReviewBusiness();
    const a = await recordForReview(s);
    await record(s, 1);
    await recordForReview(other);
    const b = await recordForReview(s);
    const queue = await listBusinessReviewQueue(db, pool, {
      userId: s.managerId,
      businessId: s.businessId,
    });
    expect(queue.purchases.map((p) => p.id)).toEqual([a, b]);
    await approve(s, s.ownerId, a);
    const after = await listBusinessReviewQueue(db, pool, {
      userId: s.ownerId,
      businessId: s.businessId,
    });
    expect(after.purchases.map((p) => p.id)).toEqual([b]);
  });
});

// ---------------------------------------------------------------------------
// Idempotency (33-36) and concurrency (37-39).
// ---------------------------------------------------------------------------

describe("Business Review — idempotency", () => {
  it("same approve key + body replays the stored result with no duplicate evidence", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const key = nextId("key_a");
    const first = await approve(s, s.ownerId, id, key);
    const evidence = async () => ({
      events: (await listPurchaseRecordEvents(pool, id)).length,
      trust: (await listTrustEventsForPurchase(pool, id)).length,
      intents: (await listNotificationIntentsForPurchase(pool, id)).length,
      outbox: await count("purchase_outbox"),
    });
    const before = await evidence();
    const replay = await approve(s, s.ownerId, id, key);
    expect(replay.purchase.id).toBe(first.purchase.id);
    expect(replay.purchase.status).toBe("waiting_for_customer");
    expect(await evidence()).toEqual(before);
  });

  it("same reject key + body replays safely", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const key = nextId("key_r");
    await reject(s, s.ownerId, id, "other", key, "Till record unclear");
    const before = (await listPurchaseRecordEvents(pool, id)).length;
    const replay = await reject(s, s.ownerId, id, "other", key, "Till record unclear");
    expect(replay.purchase.status).toBe("rejected");
    expect((await listPurchaseRecordEvents(pool, id)).length).toBe(before);
  });

  it("same key + different body conflicts", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const key = nextId("key_a");
    await approve(s, s.ownerId, id, key, { note: "checked the till" });
    await expectDomainError(
      approve(s, s.ownerId, id, key, { note: "different" }),
      "IDEMPOTENCY_CONFLICT",
    );
  });

  it("a NEW key after the review was decided fails with stale state and writes nothing", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await approve(s, s.ownerId, id);
    const before = (await listPurchaseRecordEvents(pool, id)).length;
    await expectDomainError(approve(s, s.managerId, id), "INVALID_STATE_TRANSITION");
    await expectDomainError(reject(s, s.managerId, id), "INVALID_STATE_TRANSITION");
    expect((await listPurchaseRecordEvents(pool, id)).length).toBe(before);
  });
});

describe("Business Review — concurrency", () => {
  it("approve + approve: exactly one winner", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const out = await Promise.allSettled([approve(s, s.ownerId, id), approve(s, s.managerId, id)]);
    expect(out.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    expect(
      (await listPurchaseRecordEvents(pool, id)).filter(
        (e) => e.fromStatus === "business_review_required",
      ),
    ).toHaveLength(1);
  });

  it("approve + reject: exactly one winner, consistent final state", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const out = await Promise.allSettled([approve(s, s.ownerId, id), reject(s, s.managerId, id)]);
    expect(out.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    const row = await pool.query(
      `SELECT status, business_review_decision AS d FROM purchase_records WHERE id=$1`,
      [id],
    );
    expect(
      (row.rows[0].status === "waiting_for_customer" && row.rows[0].d === "approved") ||
        (row.rows[0].status === "rejected" && row.rows[0].d === "rejected"),
    ).toBe(true);
    expect(await loyaltyCounts()).toEqual(NO_LOYALTY);
  });

  it("customer verify racing the approval can never leapfrog the review", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    const out = await Promise.allSettled([approve(s, s.ownerId, id), verify(s, id)]);
    expect(out[0].status).toBe("fulfilled");
    if (out[1].status === "fulfilled") {
      // The verify may only have run AFTER the approval committed (waiting_for_customer),
      // i.e. it went through the existing path — never from business_review_required.
      const events = await listPurchaseRecordEvents(pool, id);
      const order = events.map((e) => e.toStatus);
      expect(order.indexOf("waiting_for_customer")).toBeLessThan(order.indexOf("verified"));
    } else {
      expect(await loyaltyCounts()).toEqual(NO_LOYALTY);
    }
  });
});

// ---------------------------------------------------------------------------
// Evidence (40-45).
// ---------------------------------------------------------------------------

describe("Business Review — durable evidence", () => {
  it("approval writes the lifecycle event, Trust Event, intents, outbox and audit exactly once", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await approve(s, s.ownerId, id, nextId("key_a"), { note: "ok" });

    const events = await listPurchaseRecordEvents(pool, id);
    const decision = events.find((e) => e.fromStatus === "business_review_required");
    expect(decision).toMatchObject({
      toStatus: "waiting_for_customer",
      actorType: "owner",
      actorId: s.ownerId,
    });

    const trust = (await listTrustEventsForPurchase(pool, id)).map((t) => t.eventType);
    expect(trust.filter((t) => t === "purchase.business_review_approved")).toHaveLength(1);
    expect(trust.filter((t) => t === "purchase.business_review_required")).toHaveLength(1);
    expect(
      trust.filter((t) => t.startsWith("verified_units") || t.startsWith("loyalty_cycle")),
    ).toEqual([]);

    const intents = (await listNotificationIntentsForPurchase(pool, id)).map((i) => i.intentType);
    expect(intents.sort()).toEqual(
      [
        "purchase_business_review_approved_business",
        "purchase_business_review_approved_customer",
        "purchase_business_review_required_business",
      ].sort(),
    );

    const outbox = await pool.query(
      `SELECT event_type FROM purchase_outbox WHERE aggregate_id=$1 `,
      [id],
    );
    expect(outbox.rows.map((r) => r.event_type).sort()).toEqual([
      "purchase_business_review_approved",
      "purchase_business_review_required",
      "purchase_recorded",
    ]);

    // Sensitive-decision audit (Firestore outbox) names the accountable reviewer + permission.
    const audit = await db.collection("outboxEntries").get();
    const blob = JSON.stringify(audit.docs.map((d) => d.data()));
    expect(blob).toContain("purchase.businessReview");
    expect(blob).toContain(s.ownerId);
  });

  it("the denied Staff attempt is itself audited (accountable deny) and decides nothing", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await expectDomainError(approve(s, s.staffId, id), "AUTH_FORBIDDEN");
    const blob = JSON.stringify(
      (await db.collection("outboxEntries").get()).docs.map((d) => d.data()),
    );
    expect(blob).toContain(s.staffId);
    expect((await listTrustEventsForPurchase(pool, id)).map((t) => t.eventType)).not.toContain(
      "purchase.business_review_approved",
    );
  });

  it("rejection evidence carries the Business Review reason on the lifecycle event and the Trust Event", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await reject(s, s.managerId, id, "quantity_not_confirmed");
    const events = await listPurchaseRecordEvents(pool, id);
    const decision = events.find((e) => e.toStatus === "rejected");
    expect(decision).toMatchObject({ reason: "quantity_not_confirmed", actorType: "manager" });
    const trust = (await listTrustEventsForPurchase(pool, id)).find(
      (t) => t.eventType === "purchase.business_review_rejected",
    );
    expect(trust?.payload).toMatchObject({
      reason: "quantity_not_confirmed",
      toStatus: "rejected",
    });
    const intents = (await listNotificationIntentsForPurchase(pool, id)).map((i) => i.intentType);
    expect(intents).toContain("purchase_business_review_rejected_customer");
    // No reviewer identity / reason in the customer-addressed payload.
    const customerIntent = (await listNotificationIntentsForPurchase(pool, id)).find(
      (i) => i.intentType === "purchase_business_review_rejected_customer",
    );
    expect(JSON.stringify(customerIntent?.payload)).not.toContain(s.managerId);
    expect(JSON.stringify(customerIntent?.payload)).not.toContain("quantity_not_confirmed");
  });

  it("a Business Review is recorded at most once per Purchase at the database level", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await approve(s, s.ownerId, id);
    await expect(
      pool.query(`UPDATE purchase_records SET status='business_review_required' WHERE id=$1`, [id]),
    ).rejects.toThrow(/may only be set when the Purchase is created|business_review/);
  });
});

// ---------------------------------------------------------------------------
// PR #304 pre-review corrections.
// ---------------------------------------------------------------------------

const NOTE = "internal-note-do-not-leak";

async function grantStaffReviewOverride(s: Setup, direction: "grant" | "revoke", userId: string) {
  const snap = await db.collection("businessMemberships").where("userId", "==", userId).get();
  await snap.docs[0].ref.update({
    permissions: [
      {
        permissionId: "purchase.businessReview",
        direction,
        grantedBy: s.ownerId,
        grantedAt: new Date(),
      },
    ],
  });
}

describe("Correction E — rejection reason `other` requires a note", () => {
  it("other + no note / blank note / non-text note → validation failure, nothing written", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    for (const note of [undefined, "", "   ", null, 5]) {
      await expectDomainError(
        reject(s, s.ownerId, id, "other", nextId("k"), note),
        "VALIDATION_FAILED",
      );
    }
    expect(await count("purchase_record_events")).toBe(1);
    expect(
      (await pool.query(`SELECT status FROM purchase_records WHERE id=$1`, [id])).rows[0].status,
    ).toBe("business_review_required");
  });

  it("other + a valid bounded note is allowed; an over-long note is refused", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await expectDomainError(
      reject(s, s.ownerId, id, "other", nextId("k"), "x".repeat(501)),
      "VALIDATION_FAILED",
    );
    const r = await reject(s, s.ownerId, id, "other", nextId("k"), NOTE);
    expect(r.purchase.businessReviewReason).toBe("other");
    const events = await listPurchaseRecordEvents(pool, id);
    expect(events.find((e) => e.toStatus === "rejected")?.eventPayload).toMatchObject({
      note: NOTE,
    });
  });

  it("quantity_not_confirmed and transaction_not_confirmed stay valid without a note", async () => {
    const s = await setupReviewBusiness();
    for (const reason of ["quantity_not_confirmed", "transaction_not_confirmed"]) {
      const id = await recordForReview(s);
      expect((await reject(s, s.ownerId, id, reason)).purchase.status).toBe("rejected");
    }
  });

  it("the note never reaches a Customer read (list, detail, timeline)", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await reject(s, s.managerId, id, "other", nextId("k"), NOTE);
    const detail = await getPurchaseRecordForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
      purchaseRecordId: id,
    });
    expect(JSON.stringify(detail)).not.toContain(NOTE);
    expect(JSON.stringify(detail)).not.toContain(s.managerId);
  });
});

describe("Correction A — a Customer never receives reviewer evidence", () => {
  async function approvedPurchase(s: Setup) {
    const id = await recordForReview(s);
    await approve(s, s.ownerId, id, nextId("key_a"), { note: NOTE });
    return id;
  }

  it("the waiting list returns the approved Purchase with every Business Review field redacted", async () => {
    const s = await setupReviewBusiness();
    const id = await approvedPurchase(s);
    const { purchases } = await listPurchasesWaitingForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
    });
    const row = purchases.find((p) => p.id === id);
    expect(row).toBeDefined();
    expect(row).toMatchObject({
      status: "waiting_for_customer",
      businessReviewDecision: null,
      businessReviewReviewerUserId: null,
      businessReviewDecidedAt: null,
      businessReviewReason: null,
    });
    const blob = JSON.stringify(purchases);
    expect(blob).not.toContain(s.ownerId);
    expect(blob).not.toContain(NOTE);
  });

  it("the detail read redacts the same fields and the review timeline", async () => {
    const s = await setupReviewBusiness();
    const id = await approvedPurchase(s);
    const detail = await getPurchaseRecordForCustomer(pool, {
      customerIdentityId: s.customer.customerId,
      purchaseRecordId: id,
    });
    expect(detail.purchase).toMatchObject({
      businessReviewDecision: null,
      businessReviewReviewerUserId: null,
      businessReviewDecidedAt: null,
      businessReviewReason: null,
    });
    const blob = JSON.stringify(detail);
    for (const secret of [s.ownerId, NOTE, "business_review_required", "reviewerMembershipId"]) {
      expect(blob, secret).not.toContain(secret);
    }
  });

  it("a customer-verified Purchase leaks nothing either: the verify result row is redacted at the boundary", async () => {
    const s = await setupReviewBusiness();
    const id = await approvedPurchase(s);
    const verified = await verify(s, id);
    const redacted = redactPurchaseForCustomer(verified.purchase);
    expect(redacted).toMatchObject({
      status: "verified",
      businessReviewDecision: null,
      businessReviewReviewerUserId: null,
      businessReviewDecidedAt: null,
      businessReviewReason: null,
    });
    // The underlying row DOES carry attribution (it is durable evidence); only the boundary redacts.
    expect(verified.purchase.businessReviewReviewerUserId).toBe(s.ownerId);
  });
});

describe("Correction B — the generic Business purchase list/detail is not a side door to the BR queue", () => {
  it("Staff: the review-required filter is refused; the unfiltered list hides the protected rows but keeps ordinary ones", async () => {
    const s = await setupReviewBusiness();
    const reviewId = await recordForReview(s);
    const ordinary = (await record(s, 1)).purchase.id;
    await expectDomainError(
      listPurchasesForBusiness(db, pool, {
        userId: s.staffId,
        businessId: s.businessId,
        status: "business_review_required",
      }),
      "AUTH_FORBIDDEN",
    );
    const all = await listPurchasesForBusiness(db, pool, {
      userId: s.staffId,
      businessId: s.businessId,
    });
    expect(all.purchases.map((p) => p.id)).toEqual([ordinary]);
    expect(all.purchases.map((p) => p.id)).not.toContain(reviewId);
    const waiting = await listPurchasesForBusiness(db, pool, {
      userId: s.staffId,
      businessId: s.businessId,
      status: "waiting_for_customer",
    });
    expect(waiting.purchases.map((p) => p.id)).toEqual([ordinary]);
  });

  it("Staff: a known review-required id is indistinguishable from a missing one", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await expectDomainError(
      getPurchaseRecordForBusiness(db, pool, {
        userId: s.staffId,
        businessId: s.businessId,
        purchaseRecordId: id,
      }),
      "RESOURCE_NOT_FOUND",
    );
  });

  it("Staff: after a decision the Purchase is readable but reviewer identity, reason and notes are redacted", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await approve(s, s.ownerId, id, nextId("key_a"), { note: NOTE });
    const detail = await getPurchaseRecordForBusiness(db, pool, {
      userId: s.staffId,
      businessId: s.businessId,
      purchaseRecordId: id,
    });
    expect(detail.purchase.status).toBe("waiting_for_customer");
    expect(detail.purchase.businessReviewReviewerUserId).toBeNull();
    expect(detail.purchase.businessReviewDecidedAt).toBeNull();
    const blob = JSON.stringify(detail);
    expect(blob).not.toContain(s.ownerId);
    expect(blob).not.toContain(NOTE);
    const listed = await listPurchasesForBusiness(db, pool, {
      userId: s.staffId,
      businessId: s.businessId,
    });
    expect(JSON.stringify(listed)).not.toContain(s.ownerId);
  });

  it("Owner and authorised Manager keep the full view: queue filter, detail and attribution", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    for (const userId of [s.ownerId, s.managerId]) {
      const filtered = await listPurchasesForBusiness(db, pool, {
        userId,
        businessId: s.businessId,
        status: "business_review_required",
      });
      expect(filtered.purchases.map((p) => p.id)).toEqual([id]);
      expect(
        (
          await getPurchaseRecordForBusiness(db, pool, {
            userId,
            businessId: s.businessId,
            purchaseRecordId: id,
          })
        ).purchase.status,
      ).toBe("business_review_required");
    }
    await approve(s, s.ownerId, id);
    const detail = await getPurchaseRecordForBusiness(db, pool, {
      userId: s.managerId,
      businessId: s.businessId,
      purchaseRecordId: id,
    });
    expect(detail.purchase.businessReviewReviewerUserId).toBe(s.ownerId);
  });

  it("a fabricated Staff grant stays ineffective on the generic list and detail", async () => {
    const s = await setupReviewBusiness();
    const id = await recordForReview(s);
    await grantStaffReviewOverride(s, "grant", s.staffId);
    await expectDomainError(
      listPurchasesForBusiness(db, pool, {
        userId: s.staffId,
        businessId: s.businessId,
        status: "business_review_required",
      }),
      "AUTH_FORBIDDEN",
    );
    await expectDomainError(
      getPurchaseRecordForBusiness(db, pool, {
        userId: s.staffId,
        businessId: s.businessId,
        purchaseRecordId: id,
      }),
      "RESOURCE_NOT_FOUND",
    );
  });

  it("a Manager whose authority was revoked loses the queue filter", async () => {
    const s = await setupReviewBusiness();
    await recordForReview(s);
    await grantStaffReviewOverride(s, "revoke", s.managerId);
    await expectDomainError(
      listPurchasesForBusiness(db, pool, {
        userId: s.managerId,
        businessId: s.businessId,
        status: "business_review_required",
      }),
      "AUTH_FORBIDDEN",
    );
  });
});

describe("Correction C — the Business Review threshold is never disclosed to Staff", () => {
  it("Owner and authorised Manager receive the threshold from getRewardProgram and listRewardPrograms", async () => {
    const s = await setupReviewBusiness();
    for (const userId of [s.ownerId, s.managerId]) {
      const one = await getRewardProgram(db, pool, {
        userId,
        businessId: s.businessId,
        rewardProgramId: s.programId,
      });
      expect(one.currentVersion?.businessReviewQuantityThreshold).toBe(THRESHOLD);
      const many = await listRewardPrograms(db, pool, { userId, businessId: s.businessId });
      expect(many[0].currentVersion?.businessReviewQuantityThreshold).toBe(THRESHOLD);
    }
  });

  it("Staff receive the program with the threshold KEY ABSENT (server-side), on both reads", async () => {
    const s = await setupReviewBusiness();
    const one = await getRewardProgram(db, pool, {
      userId: s.staffId,
      businessId: s.businessId,
      rewardProgramId: s.programId,
    });
    expect(one.currentVersion).not.toBeNull();
    expect(one.currentVersion).not.toHaveProperty("businessReviewQuantityThreshold");
    expect(one.currentVersion?.id).toBe(s.versionId);
    const many = await listRewardPrograms(db, pool, {
      userId: s.staffId,
      businessId: s.businessId,
    });
    expect(JSON.stringify(many)).not.toContain("businessReviewQuantityThreshold");
    expect(JSON.stringify(one)).not.toContain("businessReviewQuantityThreshold");
  });

  it("a fabricated Staff grant and a revoked Manager still do not see it", async () => {
    const s = await setupReviewBusiness();
    await grantStaffReviewOverride(s, "grant", s.staffId);
    await grantStaffReviewOverride(s, "revoke", s.managerId);
    for (const userId of [s.staffId, s.managerId]) {
      const many = await listRewardPrograms(db, pool, { userId, businessId: s.businessId });
      expect(JSON.stringify(many), userId).not.toContain("businessReviewQuantityThreshold");
    }
  });

  it("Staff can still record and are told the routing OUTCOME without the threshold", async () => {
    const s = await setupReviewBusiness();
    const below = await record(s, THRESHOLD - 1);
    const at = await record(s, THRESHOLD);
    expect(below.review).toEqual({ required: false, status: "waiting_for_customer" });
    expect(at.review).toEqual({ required: true, status: "business_review_required" });
    for (const r of [below, at]) {
      expect(JSON.stringify(r)).not.toContain("hreshold");
    }
  });
});
