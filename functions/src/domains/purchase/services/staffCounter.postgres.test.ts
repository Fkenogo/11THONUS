/**
 * Staff Counter backend enablers — cross-store integration tests
 * (`EA-BL-001-CORR-002-B`, assessment §22/§23).
 *
 * Requires a live PostgreSQL instance AND the Firestore Emulator (membership/permission state lives
 * in Firestore). Run via:
 *
 *   firebase emulators:exec --only firestore --project demo-11thonus \
 *     "PLATFORM_ENV=test npx vitest run --config vitest.postgres.config.ts staffCounter"
 *
 * Proves: (1) the safe public error discriminator and that no raw internal detail crosses the
 * boundary; (2) the Staff-own recent read is enforced server-side (no colleague rows, bounded,
 * authority-gated, no reviewer/threshold/identity fields); (3) one intentional submission recovers
 * the original Purchase on a same-key retry while current authorisation still gates the retry;
 * (4) Staff confidentiality (threshold / reviewer / queue) and Staff incapability (review, verify).
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
import { publishRewardProgramVersion } from "../../rewardProgram/services/publishRewardProgramVersionCommand";
import { insertQualifyingItem } from "../../qualifyingItem/repositories/qualifyingItemRepository";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { recordPurchase, type RecordPurchaseRequest } from "./recordPurchaseCommand";
import { approveBusinessReview, rejectBusinessReview } from "./businessReviewCommands";
import { verifyPurchase } from "./verifyPurchaseCommand";
import {
  listBusinessReviewQueue,
  listMyRecentCounterPurchases,
  listPurchasesForBusiness,
} from "./purchaseQueries";
import { getCounterLoyaltyContext } from "./counterLoyaltyContext";
import { listRewardPrograms } from "../../rewardProgram/services/rewardProgramQueries";
import { PurchaseDomainError } from "../models/purchaseErrors";
import { toHttpsError } from "../../../index";

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

const app = initializeApp({ projectId: "demo-11thonus" }, "staffCounterPostgresTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;

let seq = 0;
let customerSeq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

/** Loyalty Numbers must match /^[A-HJ-NP-Z]{3}[2-9]{3}$/ — digits stay in 2..9 by construction. */
function lnFor(i: number): string {
  const d = (n: number) => String(2 + (((n % 8) + 8) % 8));
  return `SCT${d(i)}${d(i + 3)}${d(i + 5)}`;
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

  const existing = await db.collection("knowledgeNodes").doc("sct_ind").get();
  if (!existing.exists) {
    const at = new Date("2026-09-14T00:00:00.000Z");
    const activate = async (id: string) => {
      await transitionKnowledgeNodeStatusPersisted(db, id, "in_review", { updatedAt: at });
      await transitionKnowledgeNodeStatusPersisted(db, id, "active", { updatedAt: at });
    };
    const nodes = [
      ["sct_ind", "industry", null, "SCT Industry", "sct-industry"],
      ["sct_cat", "business_category", "sct_ind", "SCT Category", "sct-category"],
      ["sct_type", "business_type", "sct_cat", "SCT Type", "sct-type"],
      ["sct_rpcat", "reward_program_category", "sct_type", "SCT Reward Category", "sct-reward"],
    ] as const;
    for (const [id, nodeType, parentId, canonicalName, slug] of nodes) {
      await createKnowledgeNodePersisted(db, {
        id,
        nodeType,
        parentId,
        canonicalName,
        slug,
        createdAt: at,
      });
      await activate(id);
    }
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

async function seedBusiness(businessId: string) {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ34567X",
      ownerUserId: `owner_of_${businessId}`,
      displayName: "SCT Cafe",
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
}): Promise<string> {
  const membershipId = nextId("mem");
  await db.collection("businessMemberships").doc(membershipId).set({
    userId: params.userId,
    businessId: params.businessId,
    role: params.role,
    status: "active",
    permissions: [],
  });
  return membershipId;
}

async function seedCustomer(
  suffix: string,
): Promise<{ customerId: string; ln: string; qr: string }> {
  const customerId = nextId("cust");
  customerSeq += 1;
  const ln = lnFor(customerSeq);
  const qr = `qrsct${customerSeq}ref`;
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

async function createItem(businessId: string, name = "SCT Item"): Promise<string> {
  const item = await withPlatformTransaction(pool, async (tx) =>
    insertQualifyingItem(tx, { businessId, name, knowledgeNodeId: null, actorId: "test-seed" }),
  );
  return item.id;
}

type Setup = {
  businessId: string;
  ownerId: string;
  managerId: string;
  manager2Id: string;
  staffId: string;
  staff2Id: string;
  staffMembershipId: string;
  programId: string;
  itemId: string;
  customer: { customerId: string; ln: string; qr: string };
};

const THRESHOLD = 5;

async function setup(
  params: { shared?: boolean; multipleUnitsAllowed?: boolean; threshold?: number | null } = {},
): Promise<Setup> {
  const businessId = nextId("biz");
  const ownerId = nextId("owner");
  const managerId = nextId("mgr");
  const manager2Id = nextId("mgr");
  const staffId = nextId("staff");
  const staff2Id = nextId("staff");
  await seedBusiness(businessId);
  await seedMembership({ userId: ownerId, businessId, role: "owner" });
  await seedMembership({ userId: managerId, businessId, role: "manager" });
  await seedMembership({ userId: manager2Id, businessId, role: "manager" });
  const staffMembershipId = await seedMembership({ userId: staffId, businessId, role: "staff" });
  await seedMembership({ userId: staff2Id, businessId, role: "staff" });
  const itemId = await createItem(businessId);
  const created = await createRewardProgram(db, pool, {
    userId: ownerId,
    request: {
      businessId,
      displayName: "Counter Program",
      rewardProgramCategoryId: "sct_rpcat",
      rewardDescription: "One free coffee",
      multipleUnitsAllowed: params.multipleUnitsAllowed ?? true,
      sharedLoyaltyNumberAllowed: params.shared ?? true,
      businessReviewQuantityThreshold:
        params.threshold === undefined ? THRESHOLD : params.threshold,
      effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
      qualifyingItemIds: [itemId],
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
  return {
    businessId,
    ownerId,
    managerId,
    manager2Id,
    staffId,
    staff2Id,
    staffMembershipId,
    programId: created.program.id,
    itemId,
    customer,
  };
}

const FIXED_DATE = new Date("2026-09-14T10:00:00.000Z");

function request(s: Setup, overrides: Partial<RecordPurchaseRequest> = {}): RecordPurchaseRequest {
  return {
    businessId: s.businessId,
    rewardProgramId: s.programId,
    quantity: 1,
    qualifyingItemId: s.itemId,
    purchaseDate: FIXED_DATE,
    loyaltyNumberValue: s.customer.ln,
    ...overrides,
  };
}

function record(
  s: Setup,
  overrides: Partial<RecordPurchaseRequest> = {},
  userId = s.staffId,
  idempotencyKey = nextId("key"),
) {
  return recordPurchase(db, pool, {
    userId,
    request: request(s, overrides),
    idempotencyKey,
    correlationId: nextId("corr"),
  });
}

async function count(table: string): Promise<number> {
  const r = await pool.query(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(r.rows[0].c);
}

async function failure(p: Promise<unknown>): Promise<unknown> {
  return p.then(
    () => {
      throw new Error("expected the call to fail");
    },
    (e: unknown) => e,
  );
}

// ---------------------------------------------------------------------------
// 1. Safe public error discriminator.
// ---------------------------------------------------------------------------

describe("Staff Counter — safe public error discriminator", () => {
  async function publicFailure(p: Promise<unknown>) {
    return toHttpsError(await failure(p));
  }

  it("an unknown Loyalty Number → customer_artifact_invalid_or_not_found", async () => {
    const s = await setup();
    const err = await publicFailure(record(s, { loyaltyNumberValue: "ZZZ222" }));
    expect(err.code).toBe("invalid-argument");
    expect(err.message).toBe("purchase_command_failed");
    expect(err.details).toEqual({ reason: "customer_artifact_invalid_or_not_found" });
  });

  it("a malformed Loyalty Number and an unknown QR reference use the same token", async () => {
    const s = await setup();
    const malformed = await publicFailure(record(s, { loyaltyNumberValue: "not-a-number" }));
    expect(malformed.details).toEqual({ reason: "customer_artifact_invalid_or_not_found" });
    const unknownQr = await publicFailure(
      record(s, { loyaltyNumberValue: undefined, qrReference: "qrdoesnotexist1" }),
    );
    expect(unknownQr.details).toEqual({ reason: "customer_artifact_invalid_or_not_found" });
  });

  it("a shared-number policy refusal is INDISTINGUISHABLE from an unknown code (policy not leaked)", async () => {
    const s = await setup({ shared: false });
    const policy = await publicFailure(record(s));
    const unknown = await publicFailure(record(s, { loyaltyNumberValue: "ZZZ222" }));
    expect({ code: policy.code, message: policy.message, details: policy.details }).toEqual({
      code: unknown.code,
      message: unknown.message,
      details: unknown.details,
    });
    // The same programme accepts the same customer by QR (the neutral copy tells Staff to scan).
    const byQr = await record(s, { loyaltyNumberValue: undefined, qrReference: s.customer.qr });
    expect(byQr.review.status).toBe("waiting_for_customer");
  });

  it("an inactive programme, an unknown programme and another Business's programme → programme_unavailable", async () => {
    const s = await setup();
    await pool.query("UPDATE reward_programs SET status = 'paused' WHERE id = $1", [s.programId]);
    const paused = await publicFailure(record(s));
    expect(paused.details).toEqual({ reason: "programme_unavailable" });
    const other = await setup();
    const foreign = await publicFailure(record(s, { rewardProgramId: other.programId }));
    expect(foreign.details).toEqual({ reason: "programme_unavailable" });
    const unknown = await publicFailure(
      record(s, { rewardProgramId: "00000000-0000-4000-8000-000000000001" }),
    );
    expect(unknown.details).toEqual({ reason: "programme_unavailable" });
  });

  it("an item not on the programme (fabricated / foreign / malformed) → qualifying_item_invalid, identically", async () => {
    const s = await setup();
    const other = await setup();
    const foreignItem = await publicFailure(record(s, { qualifyingItemId: other.itemId }));
    const fabricated = await publicFailure(
      record(s, { qualifyingItemId: "00000000-0000-4000-8000-000000000000" }),
    );
    const malformed = await publicFailure(record(s, { qualifyingItemId: "nope" }));
    for (const err of [foreignItem, fabricated, malformed]) {
      expect(err.details).toEqual({ reason: "qualifying_item_invalid" });
      expect(err.message).toBe("purchase_command_failed");
    }
  });

  it("a quantity the programme does not allow → quantity_invalid", async () => {
    const s = await setup({ multipleUnitsAllowed: false });
    expect((await publicFailure(record(s, { quantity: 2 }))).details).toEqual({
      reason: "quantity_invalid",
    });
    expect((await publicFailure(record(s, { quantity: 0 }))).details).toEqual({
      reason: "quantity_invalid",
    });
  });

  it("any other validation failure → generic_validation_failed", async () => {
    const s = await setup();
    const future = await publicFailure(
      record(s, { purchaseDate: new Date(Date.now() + 3600_000) }),
    );
    expect(future.details).toEqual({ reason: "generic_validation_failed" });
    const both = await publicFailure(record(s, { qrReference: s.customer.qr }));
    expect(both.details).toEqual({ reason: "generic_validation_failed" });
  });

  it("no raw domain message, id, threshold or stack ever reaches the public error", async () => {
    const s = await setup();
    const errors = [
      await publicFailure(record(s, { loyaltyNumberValue: "ZZZ222" })),
      await publicFailure(record(s, { quantity: 0 })),
      await publicFailure(record(s, { qualifyingItemId: "nope" })),
    ];
    for (const err of errors) {
      const wire = JSON.stringify({ code: err.code, message: err.message, details: err.details });
      expect(wire).not.toContain(s.businessId);
      expect(wire).not.toContain(s.programId);
      expect(wire).not.toContain(s.customer.ln);
      expect(wire).not.toContain("Idempotency");
      expect(wire).not.toContain(String(THRESHOLD) + ",");
      expect(wire).not.toMatch(/businessReviewQuantityThreshold/);
      expect(wire).not.toContain("at ");
    }
  });

  it("authorisation failures stay a plain permission error with no discriminator (boundary preserved)", async () => {
    const s = await setup();
    const err = await publicFailure(record(s, {}, "not-a-member"));
    expect(err.code).toBe("permission-denied");
    expect(err.details).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. Staff-own recent activity (D6).
// ---------------------------------------------------------------------------

describe("Staff Counter — own recent submissions (server-side scoped)", () => {
  async function mine(s: Setup, userId: string, limit?: number) {
    return listMyRecentCounterPurchases(db, pool, { userId, businessId: s.businessId, limit });
  }

  it("returns ONLY the caller's own submissions; never a colleague's", async () => {
    const s = await setup();
    const a1 = await record(s, {}, s.staffId);
    const a2 = await record(s, { quantity: 2 }, s.staffId);
    const b1 = await record(s, {}, s.staff2Id);
    const m1 = await record(s, {}, s.managerId);

    const staffA = (await mine(s, s.staffId)).purchases.map((p) => p.id);
    expect(staffA).toEqual([a2.purchase.id, a1.purchase.id]); // newest first
    expect((await mine(s, s.staff2Id)).purchases.map((p) => p.id)).toEqual([b1.purchase.id]);
    // Manager (also a Counter user via purchase.record) sees only their own as well.
    expect((await mine(s, s.managerId)).purchases.map((p) => p.id)).toEqual([m1.purchase.id]);
    expect(staffA).not.toContain(b1.purchase.id);
    expect(staffA).not.toContain(m1.purchase.id);
  });

  it("is scoped to the Business: a member of two Businesses sees only the requested Business's own rows", async () => {
    const s = await setup();
    const other = await setup();
    await seedMembership({ userId: s.staffId, businessId: other.businessId, role: "staff" });
    await record(s, {}, s.staffId);
    await record(other, {}, s.staffId);
    expect((await mine(s, s.staffId)).purchases).toHaveLength(1);
    expect((await mine(other, s.staffId)).purchases).toHaveLength(1);
  });

  it("the projection carries no reviewer, reason, threshold, customer-identity or recorder fields", async () => {
    const s = await setup();
    const normal = await record(s, {}, s.staffId);
    const review = await record(s, { quantity: THRESHOLD }, s.staffId);
    const viaQr = await record(
      s,
      { loyaltyNumberValue: undefined, qrReference: s.customer.qr },
      s.staffId,
    );
    expect(review.review.status).toBe("business_review_required");
    const { purchases } = await mine(s, s.staffId);
    expect(purchases).toHaveLength(3);
    for (const row of purchases) {
      expect(Object.keys(row).sort()).toEqual(
        [
          "customerCodeHint",
          "id",
          "itemLabel",
          "presentedVia",
          "quantity",
          "recordedAt",
          "status",
        ].sort(),
      );
    }
    // The callable transport turns a `Date` into `{}`: the feed must carry text instants.
    for (const row of purchases) {
      expect(typeof row.recordedAt).toBe("string");
      expect(new Date(row.recordedAt).toISOString()).toBe(row.recordedAt);
    }
    const wire = JSON.stringify(purchases);
    for (const forbidden of [
      "businessReview",
      "reviewer",
      "Threshold",
      "customerIdentityId",
      "recordedBy",
      s.customer.customerId,
      s.staffId,
      s.customer.ln, // full number never returned
      s.customer.qr,
    ]) {
      expect(wire).not.toContain(forbidden);
    }
    // Staff's own review-required row IS listed (the outcome they were told), as a neutral status.
    expect(purchases.find((p) => p.id === review.purchase.id)?.status).toBe(
      "business_review_required",
    );
    // Hint only for a typed Loyalty Number; a QR scan reveals nothing about the number.
    expect(purchases.find((p) => p.id === normal.purchase.id)?.customerCodeHint).toBe(
      s.customer.ln.slice(-3),
    );
    expect(purchases.find((p) => p.id === viaQr.purchase.id)?.customerCodeHint).toBeNull();
    expect(purchases.find((p) => p.id === viaQr.purchase.id)?.presentedVia).toBe("qr_identity");
  });

  it("after a Business Review decision Staff see only the status — never reviewer, reason or note", async () => {
    const s = await setup();
    const a = await record(s, { quantity: THRESHOLD }, s.staffId);
    const b = await record(s, { quantity: THRESHOLD }, s.staffId);
    await approveBusinessReview(db, pool, {
      userId: s.managerId,
      request: { businessId: s.businessId, purchaseRecordId: a.purchase.id, note: "secret note" },
      idempotencyKey: nextId("k"),
      correlationId: nextId("c"),
    });
    await rejectBusinessReview(db, pool, {
      userId: s.manager2Id,
      request: {
        businessId: s.businessId,
        purchaseRecordId: b.purchase.id,
        reason: "other",
        note: "secret reason text",
      },
      idempotencyKey: nextId("k"),
      correlationId: nextId("c"),
    });
    const { purchases } = await mine(s, s.staffId);
    const statuses = Object.fromEntries(purchases.map((p) => [p.id, p.status]));
    expect(statuses[a.purchase.id]).toBe("waiting_for_customer");
    expect(statuses[b.purchase.id]).toBe("rejected");
    const wire = JSON.stringify(purchases);
    expect(wire).not.toContain("secret");
    expect(wire).not.toContain(s.managerId);
    expect(wire).not.toContain(s.manager2Id);
  });

  it("is bounded: a default page, an explicit limit, and out-of-range limits refused", async () => {
    const s = await setup();
    for (let i = 0; i < 12; i += 1) await record(s, {}, s.staffId);
    expect((await mine(s, s.staffId)).purchases).toHaveLength(10);
    expect((await mine(s, s.staffId, 3)).purchases).toHaveLength(3);
    for (const bad of [0, 21, 1.5]) {
      const err = await failure(mine(s, s.staffId, bad));
      expect(err).toBeInstanceOf(PurchaseDomainError);
      expect((err as PurchaseDomainError).category).toBe("VALIDATION_FAILED");
    }
  });

  it("follows the live purchase.record authority: suspended Staff, non-members and Customers are denied", async () => {
    const s = await setup();
    await record(s, {}, s.staffId);
    await db
      .collection("businessMemberships")
      .doc(s.staffMembershipId)
      .update({ status: "suspended" });
    for (const userId of [s.staffId, "outsider", s.customer.customerId]) {
      const err = await failure(mine(s, userId));
      expect(err).toBeInstanceOf(PurchaseDomainError);
      expect((err as PurchaseDomainError).category).toBe("AUTH_FORBIDDEN");
    }
  });

  it("does not reduce Owner/Manager: the Business-wide list still returns every submission", async () => {
    const s = await setup();
    await record(s, {}, s.staffId);
    await record(s, {}, s.staff2Id);
    await record(s, {}, s.managerId);
    const owner = await listPurchasesForBusiness(db, pool, {
      userId: s.ownerId,
      businessId: s.businessId,
    });
    expect(owner.purchases).toHaveLength(3);
    const manager = await listPurchasesForBusiness(db, pool, {
      userId: s.managerId,
      businessId: s.businessId,
    });
    expect(manager.purchases).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// 3. Idempotent recovery.
// ---------------------------------------------------------------------------

describe("Staff Counter — one intentional submission, one Purchase", () => {
  it("committed + lost response → retry with the SAME payload, purchaseDate and key recovers the original; one row", async () => {
    const s = await setup();
    const key = nextId("key_intent");
    const first = await record(s, {}, s.staffId, key); // commits; pretend the response was lost
    const retry = await record(s, {}, s.staffId, key); // identical payload + same purchaseDate + same key
    expect(retry.purchase.id).toBe(first.purchase.id);
    expect(retry.review).toEqual(first.review);
    expect(await count("purchase_records")).toBe(1);
    expect(await count("purchase_record_events")).toBe(1);
    expect(await count("trust_events")).toBe(1);
  });

  it("a recomputed purchaseDate under the same key is refused (why the date must be captured once), and writes nothing", async () => {
    const s = await setup();
    const key = nextId("key_intent");
    await record(s, {}, s.staffId, key);
    const err = await failure(
      record(s, { purchaseDate: new Date(FIXED_DATE.getTime() + 1500) }, s.staffId, key),
    );
    expect((err as PurchaseDomainError).category).toBe("IDEMPOTENCY_CONFLICT");
    expect(await count("purchase_records")).toBe(1);
  });

  it("a business-review-routed submission is recovered identically (same truthful routing outcome)", async () => {
    const s = await setup();
    const key = nextId("key_intent");
    const first = await record(s, { quantity: THRESHOLD }, s.staffId, key);
    const retry = await record(s, { quantity: THRESHOLD }, s.staffId, key);
    expect(retry.purchase.id).toBe(first.purchase.id);
    expect(retry.review).toEqual({ required: true, status: "business_review_required" });
    expect(await count("purchase_records")).toBe(1);
  });

  it("current authorisation still gates the retry: a revoked actor cannot recover the old result", async () => {
    const s = await setup();
    const key = nextId("key_intent");
    await record(s, {}, s.staffId, key);
    await db
      .collection("businessMemberships")
      .doc(s.staffMembershipId)
      .update({ status: "suspended" });
    const err = await failure(record(s, {}, s.staffId, key));
    expect(err).toBeInstanceOf(PurchaseDomainError);
    expect((err as PurchaseDomainError).category).toBe("AUTH_FORBIDDEN");
    expect(await count("purchase_records")).toBe(1); // original untouched, nothing new
  });

  it("a fresh intent (new key) for the same customer is a second, distinct Purchase", async () => {
    const s = await setup();
    await record(s, {}, s.staffId);
    await record(s, {}, s.staffId);
    expect(await count("purchase_records")).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 4. Confidentiality and Staff incapability.
// ---------------------------------------------------------------------------

describe("Staff Counter — Business Review confidentiality and Staff incapability", () => {
  it("the Staff programme read never carries the threshold; the Owner's does (the web whitelist covers both)", async () => {
    const s = await setup();
    const staffView = await listRewardPrograms(db, pool, {
      userId: s.staffId,
      businessId: s.businessId,
    });
    expect(JSON.stringify(staffView)).not.toContain("businessReviewQuantityThreshold");
    expect(staffView[0].currentVersion?.qualifyingItems.length).toBeGreaterThan(0);
    const ownerView = await listRewardPrograms(db, pool, {
      userId: s.ownerId,
      businessId: s.businessId,
    });
    expect(JSON.stringify(ownerView)).toContain("businessReviewQuantityThreshold");
  });

  it("the record result Staff receive for a review-routed Purchase carries no threshold, reviewer or reason", async () => {
    const s = await setup();
    const result = await record(s, { quantity: THRESHOLD }, s.staffId);
    expect(result.review).toEqual({ required: true, status: "business_review_required" });
    const wire = JSON.stringify(result);
    expect(wire).not.toContain("businessReviewQuantityThreshold");
    expect(result.purchase.businessReviewReviewerUserId).toBeNull();
    expect(result.purchase.businessReviewReason).toBeNull();
    expect(result.purchase.businessReviewDecision).toBeNull();
  });

  it("Staff cannot read the Business Review queue, approve or reject (and nothing changes)", async () => {
    const s = await setup();
    const r = await record(s, { quantity: THRESHOLD }, s.staffId);
    expect(
      (
        (await failure(
          listBusinessReviewQueue(db, pool, { userId: s.staffId, businessId: s.businessId }),
        )) as PurchaseDomainError
      ).category,
    ).toBe("AUTH_FORBIDDEN");
    for (const decide of [
      () =>
        approveBusinessReview(db, pool, {
          userId: s.staffId,
          request: { businessId: s.businessId, purchaseRecordId: r.purchase.id },
          idempotencyKey: nextId("k"),
          correlationId: nextId("c"),
        }),
      () =>
        rejectBusinessReview(db, pool, {
          userId: s.staffId,
          request: {
            businessId: s.businessId,
            purchaseRecordId: r.purchase.id,
            reason: "quantity_not_confirmed",
          },
          idempotencyKey: nextId("k"),
          correlationId: nextId("c"),
        }),
    ]) {
      expect(((await failure(decide())) as PurchaseDomainError).category).toBe("AUTH_FORBIDDEN");
    }
    const row = await pool.query("SELECT status FROM purchase_records WHERE id = $1", [
      r.purchase.id,
    ]);
    expect(row.rows[0].status).toBe("business_review_required");
  });

  it("Staff cannot verify a Purchase for the customer, and a review-required Purchase is not verifiable at all", async () => {
    const s = await setup();
    const normal = await record(s, {}, s.staffId);
    const review = await record(s, { quantity: THRESHOLD }, s.staffId);
    // The Staff member's own id is not the Purchase's customer: ownership fails closed.
    const asStaff = await failure(
      verifyPurchase(db, pool, {
        customerIdentityId: s.staffId,
        request: { purchaseRecordId: normal.purchase.id },
        idempotencyKey: nextId("k"),
        correlationId: nextId("c"),
      }),
    );
    expect(asStaff).toBeInstanceOf(PurchaseDomainError);
    // Even the rightful customer cannot verify before the Business Review is decided.
    const early = await failure(
      verifyPurchase(db, pool, {
        customerIdentityId: s.customer.customerId,
        request: { purchaseRecordId: review.purchase.id },
        idempotencyKey: nextId("k"),
        correlationId: nextId("c"),
      }),
    );
    expect(early).toBeInstanceOf(PurchaseDomainError);
    expect(await count("verified_units")).toBe(0);
  });

  it("recording mints no loyalty value and no customer-facing artefact beyond the pending Purchase", async () => {
    const s = await setup();
    await record(s, {}, s.staffId);
    await record(s, { quantity: THRESHOLD }, s.staffId);
    expect(await count("verified_units")).toBe(0);
    expect(await count("verified_unit_allocations")).toBe(0);
    expect(await count("loyalty_cycles")).toBe(0);
    expect(await count("rewards")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Recent-feed index (migration 0029).
// ---------------------------------------------------------------------------

describe("Staff Counter — recorder-scoped recent index (0029)", () => {
  it("exists with the exact column order and sort direction", async () => {
    const r = await pool.query(
      `SELECT indexdef FROM pg_indexes WHERE indexname = 'purchase_records_recorder_recent_idx'`,
    );
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].indexdef).toContain(
      "(business_id, recorded_by_user_id, created_at DESC, id DESC)",
    );
  });

  it("is applicable to the exact recent-feed query: an ordered index scan, no sort, bounded by LIMIT", async () => {
    const s = await setup();
    for (let i = 0; i < 3; i += 1) await record(s, {}, s.staffId);
    await pool.query("ANALYZE purchase_records");
    const client = await pool.connect();
    try {
      // Tiny tables legitimately prefer a seq scan; disable it to prove the index CAN serve the query.
      await client.query("SET enable_seqscan = off");
      const plan = await client.query(
        `EXPLAIN SELECT id, created_at, item_label, quantity, status, presented_artifact_type,
                canonical_loyalty_number_value
           FROM purchase_records
          WHERE business_id = $1 AND recorded_by_user_id = $2
          ORDER BY created_at DESC, id DESC
          LIMIT 10`,
        [s.businessId, s.staffId],
      );
      const text = plan.rows.map((row) => row["QUERY PLAN"]).join("\n");
      expect(text).toContain("purchase_records_recorder_recent_idx");
      expect(text).not.toMatch(/\bSort\b/);
      // The "load more" page (keyset on the same two sort columns) is served by the same index.
      const paged = await client.query(
        `EXPLAIN SELECT id, created_at, item_label, quantity, status, presented_artifact_type,
                canonical_loyalty_number_value
           FROM purchase_records
          WHERE business_id = $1 AND recorded_by_user_id = $2
            AND (created_at, id) < ($4::timestamptz, $5::uuid)
          ORDER BY created_at DESC, id DESC
          LIMIT $3`,
        [
          s.businessId,
          s.staffId,
          21,
          "2026-09-14T10:00:00.000000Z",
          "00000000-0000-4000-8000-000000000001",
        ],
      );
      const pagedText = paged.rows.map((row) => row["QUERY PLAN"]).join("\n");
      expect(pagedText).toContain("purchase_records_recorder_recent_idx");
      expect(pagedText).not.toMatch(/\bSort\b/);
    } finally {
      await client.query("RESET enable_seqscan");
      client.release();
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Activity view: bounded keyset pagination of the Staff-own feed.
// ---------------------------------------------------------------------------
describe("Staff Activity — paged own submissions (keyset, server-scoped)", () => {
  async function page(s: Setup, userId: string, limit?: number, cursor?: string | null) {
    return listMyRecentCounterPurchases(db, pool, {
      userId,
      businessId: s.businessId,
      limit,
      cursor,
    });
  }

  it("walks the caller's own history in stable pages with no gaps or repeats, then ends", async () => {
    const s = await setup();
    const own: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      own.push((await record(s, {}, s.staffId)).purchase.id);
      // Interleave a colleague's submission: it must never appear in the walk.
      await record(s, {}, s.staff2Id);
    }
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const result: Awaited<ReturnType<typeof page>> = await page(s, s.staffId, 2, cursor);
      seen.push(...result.purchases.map((purchase) => purchase.id));
      cursor = result.nextCursor;
      pages += 1;
    } while (cursor && pages < 10);
    expect(pages).toBe(3);
    expect(seen).toEqual([...own].reverse());
    expect(new Set(seen).size).toBe(5);
  });

  it("the last page has no cursor; a page smaller than the limit never offers one", async () => {
    const s = await setup();
    await record(s, {}, s.staffId);
    const result = await page(s, s.staffId, 5);
    expect(result.purchases).toHaveLength(1);
    expect(result.nextCursor).toBeNull();
  });

  it("a cursor never widens the scope: another member replaying it sees only their own rows", async () => {
    const s = await setup();
    for (let i = 0; i < 3; i += 1) await record(s, {}, s.staffId);
    const mineB = await record(s, {}, s.staff2Id);
    const first = await page(s, s.staffId, 1);
    expect(first.nextCursor).not.toBeNull();
    // staff2 replays staff's cursor: scope is still staff2's own rows only.
    const replay = await page(s, s.staff2Id, 5, first.nextCursor);
    expect(replay.purchases.map((purchase) => purchase.id)).not.toContain(first.purchases[0].id);
    for (const purchase of replay.purchases) expect(purchase.id).toBe(mineB.purchase.id);
  });

  it("a tampered, malformed or oversized cursor is a generic validation failure, not interpreted", async () => {
    const s = await setup();
    await record(s, {}, s.staffId);
    for (const cursor of [
      "not-base64-json",
      Buffer.from("[]").toString("base64url"),
      Buffer.from(JSON.stringify(["2026-09-14", "x"])).toString("base64url"),
      Buffer.from(JSON.stringify(["2026-09-14T10:00:00.000000Z", "' OR 1=1 --"])).toString(
        "base64url",
      ),
    ]) {
      const err = toHttpsError(await failure(page(s, s.staffId, 5, cursor)));
      expect(err.details).toEqual({ reason: "generic_validation_failed" });
    }
  });

  it("paged rows keep the neutral projection: no reviewer, reason, threshold, customer or recorder fields", async () => {
    const s = await setup();
    await record(s, { quantity: THRESHOLD }, s.staffId);
    await record(s, {}, s.staffId);
    const result = await page(s, s.staffId, 1);
    const wire = JSON.stringify(result);
    expect(wire).not.toMatch(/reviewer|reason|threshold|customerIdentity|recordedBy|staffId/i);
    expect(Object.keys(result).sort()).toEqual(["nextCursor", "purchases"]);
  });
});

// ---------------------------------------------------------------------------
// 7. Limited, transaction-scoped Staff loyalty context (supersedes D4).
// ---------------------------------------------------------------------------
describe("Staff loyalty context — limited and transaction-scoped", () => {
  function context(
    s: Setup,
    overrides: Partial<Parameters<typeof getCounterLoyaltyContext>[2]> = {},
    userId = s.staffId,
  ) {
    return getCounterLoyaltyContext(db, pool, {
      userId,
      correlationId: nextId("corr"),
      businessId: s.businessId,
      rewardProgramId: s.programId,
      loyaltyNumberValue: s.customer.ln,
      ...overrides,
    });
  }

  async function verifyAs(s: Setup, purchaseId: string) {
    await verifyPurchase(db, pool, {
      customerIdentityId: s.customer.customerId,
      request: { purchaseRecordId: purchaseId },
      idempotencyKey: nextId("k"),
      correlationId: nextId("c"),
    });
  }

  it("a valid Customer + Programme returns exactly the four limited values (no cycle yet → zero)", async () => {
    const s = await setup({ threshold: null });
    const result = await context(s);
    expect(result).toEqual({
      verifiedUnits: 0,
      requiredVerifiedUnits: 10,
      rewardStatus: "none",
      awaitingCustomerConfirmationUnits: 0,
    });
    expect(Object.keys(result).sort()).toEqual([
      "awaitingCustomerConfirmationUnits",
      "requiredVerifiedUnits",
      "rewardStatus",
      "verifiedUnits",
    ]);
  });

  it("the QR path resolves to the same Customer and the same answer as the Loyalty Number", async () => {
    const s = await setup({ threshold: null });
    const viaLn = await context(s);
    const viaQr = await context(s, { loyaltyNumberValue: undefined, qrReference: s.customer.qr });
    expect(viaQr).toEqual(viaLn);
  });

  it("a recorded-but-unconfirmed Purchase is reported as AWAITING and never raises the verified count", async () => {
    const s = await setup({ threshold: null });
    const first = await record(s, { quantity: 2 }, s.staffId);
    expect(await context(s)).toMatchObject({
      verifiedUnits: 0,
      awaitingCustomerConfirmationUnits: 2,
      rewardStatus: "none",
    });
    await verifyAs(s, first.purchase.id);
    expect(await context(s)).toMatchObject({
      verifiedUnits: 2,
      awaitingCustomerConfirmationUnits: 0,
    });
  });

  it("9 verified + 1 awaiting stays 9 verified (never 10 until the Customer verifies)", async () => {
    const s = await setup({ threshold: null });
    const nine = await record(s, { quantity: 9 }, s.staffId);
    await verifyAs(s, nine.purchase.id);
    const tenth = await record(s, {}, s.staffId);
    expect(await context(s)).toEqual({
      verifiedUnits: 9,
      requiredVerifiedUnits: 10,
      rewardStatus: "none",
      awaitingCustomerConfirmationUnits: 1,
    });
    await verifyAs(s, tenth.purchase.id);
    expect(await context(s)).toEqual({
      verifiedUnits: 10,
      requiredVerifiedUnits: 10,
      rewardStatus: "available",
      awaitingCustomerConfirmationUnits: 0,
    });
  });

  it("with a reward available, an ordinary Purchase can still be recorded; the read stays truthful", async () => {
    const s = await setup({ threshold: null });
    const ten = await record(s, { quantity: 10 }, s.staffId);
    await verifyAs(s, ten.purchase.id);
    expect((await context(s)).rewardStatus).toBe("available");
    const more = await record(s, {}, s.staffId);
    expect(more.review.status).toBe("waiting_for_customer");
    expect(await context(s)).toEqual({
      verifiedUnits: 10,
      requiredVerifiedUnits: 10,
      rewardStatus: "available",
      awaitingCustomerConfirmationUnits: 1,
    });
  });

  it("a Business-review-held Purchase is not counted as awaiting (review routing is never revealed)", async () => {
    const s = await setup();
    await record(s, { quantity: THRESHOLD }, s.staffId);
    expect((await context(s)).awaitingCustomerConfirmationUnits).toBe(0);
  });

  it("is scoped to the Programme: units in another Programme of the Business are not included", async () => {
    const s = await setup({ threshold: null });
    const otherProgramme = await createRewardProgram(db, pool, {
      userId: s.ownerId,
      request: {
        businessId: s.businessId,
        displayName: "Second Program",
        rewardProgramCategoryId: "sct_rpcat",
        rewardDescription: "Second reward",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: true,
        businessReviewQuantityThreshold: null,
        effectiveFrom: new Date("2026-09-14T00:00:00.000Z"),
        qualifyingItemIds: [s.itemId],
      } as never,
      idempotencyKey: nextId("key_prog"),
      correlationId: nextId("corr_prog"),
    });
    await publishRewardProgramVersion(db, pool, {
      userId: s.ownerId,
      request: {
        businessId: s.businessId,
        rewardProgramId: otherProgramme.program.id,
        versionId: otherProgramme.version.id,
      },
      idempotencyKey: nextId("key_pub"),
      correlationId: nextId("corr_pub"),
    });
    const onFirst = await record(s, { quantity: 3 }, s.staffId);
    await verifyAs(s, onFirst.purchase.id);
    expect((await context(s)).verifiedUnits).toBe(3);
    expect(await context(s, { rewardProgramId: otherProgramme.program.id })).toMatchObject({
      verifiedUnits: 0,
      awaitingCustomerConfirmationUnits: 0,
    });
  });

  it("a Customer's progress at one Business is never readable through another Business (cross-Business denied)", async () => {
    const a = await setup({ threshold: null });
    const b = await setup({ threshold: null });
    const inA = await record(a, { quantity: 4 }, a.staffId);
    await verifyAs(a, inA.purchase.id);
    // Staff of A is not a member of B: denied outright.
    const denied = await failure(context(b, { loyaltyNumberValue: a.customer.ln }, a.staffId));
    expect((denied as PurchaseDomainError).category).toBe("AUTH_FORBIDDEN");
    // A member of BOTH, asking B's programme for A's customer: progress is B-scoped (zero), not A's.
    await seedMembership({ userId: a.staffId, businessId: b.businessId, role: "staff" });
    const crossed = await context(b, { loyaltyNumberValue: a.customer.ln }, a.staffId);
    expect(crossed.verifiedUnits).toBe(0);
    // And A's programme through B's business id is refused as an unavailable programme.
    const wrongProgramme = toHttpsError(
      await failure(context(b, { rewardProgramId: a.programId }, a.staffId)),
    );
    expect(wrongProgramme.details).toEqual({ reason: "programme_unavailable" });
  });

  it("every artifact failure is the SAME neutral token: unknown, malformed, wrong QR, shared-policy refusal", async () => {
    const policy = await setup({ shared: false });
    const normal = await setup();
    const results = await Promise.all([
      failure(context(normal, { loyaltyNumberValue: "ZZZ222" })),
      failure(context(normal, { loyaltyNumberValue: "not-a-number" })),
      failure(context(normal, { loyaltyNumberValue: undefined, qrReference: "qrdoesnotexist1" })),
      failure(context(policy)), // a real Loyalty Number on a QR-only programme
    ]);
    const publics = results.map((err) => toHttpsError(err));
    for (const err of publics) {
      expect(err.code).toBe("invalid-argument");
      expect(err.message).toBe("purchase_command_failed");
      expect(err.details).toEqual({ reason: "customer_artifact_invalid_or_not_found" });
    }
    // The QR-only programme still answers the same customer by QR.
    expect(
      await context(policy, { loyaltyNumberValue: undefined, qrReference: policy.customer.qr }),
    ).toMatchObject({ verifiedUnits: 0 });
  });

  it("an unusable Programme (paused, unknown, foreign, non-UUID) is one neutral token, decided before any Customer lookup", async () => {
    const s = await setup();
    const other = await setup();
    await pool.query("UPDATE reward_programs SET status = 'paused' WHERE id = $1", [s.programId]);
    const attempts: Array<() => Promise<unknown>> = [
      () => context(s),
      () => context(s, { rewardProgramId: other.programId }),
      () => context(s, { rewardProgramId: "00000000-0000-4000-8000-000000000001" }),
      () => context(s, { rewardProgramId: "' OR 1=1 --" }),
      // Even with an unknown customer code, the programme failure wins (no customer probing).
      () => context(s, { loyaltyNumberValue: "ZZZ222" }),
    ];
    for (const attempt of attempts) {
      expect(toHttpsError(await failure(attempt())).details).toEqual({
        reason: "programme_unavailable",
      });
    }
  });

  it("exactly one artifact is required", async () => {
    const s = await setup();
    const none = await failure(context(s, { loyaltyNumberValue: undefined }));
    const both = await failure(context(s, { qrReference: s.customer.qr }));
    for (const err of [none, both]) {
      expect(toHttpsError(err).details).toEqual({ reason: "generic_validation_failed" });
    }
  });

  it("follows the live purchase.record authority: non-members, Customers and suspended Staff are denied", async () => {
    const s = await setup();
    await context(s); // allowed while active
    await db
      .collection("businessMemberships")
      .doc(s.staffMembershipId)
      .update({ status: "suspended" });
    for (const userId of [s.staffId, "outsider", s.customer.customerId]) {
      const err = await failure(context(s, {}, userId));
      expect(err).toBeInstanceOf(PurchaseDomainError);
      expect((err as PurchaseDomainError).category).toBe("AUTH_FORBIDDEN");
    }
  });

  it("is not a Customer directory: no identifiers in the answer, no write, no cycle created by reading", async () => {
    const s = await setup({ threshold: null });
    const before = {
      cycles: await count("loyalty_cycles"),
      units: await count("verified_units"),
      purchases: await count("purchase_records"),
      rewards: await count("rewards"),
    };
    const wire = JSON.stringify(await context(s));
    expect(wire).not.toContain(s.customer.customerId);
    expect(wire).not.toContain(s.customer.ln);
    expect(wire).not.toContain(s.customer.qr);
    expect(wire).not.toMatch(/name|phone|email|history|reviewer|threshold|business/i);
    expect({
      cycles: await count("loyalty_cycles"),
      units: await count("verified_units"),
      purchases: await count("purchase_records"),
      rewards: await count("rewards"),
    }).toEqual(before);
  });

  it("the Business Review threshold never appears in the answer (Staff confidentiality holds)", async () => {
    const s = await setup(); // threshold = 5
    const wire = JSON.stringify(await context(s));
    expect(wire).not.toMatch(/threshold|review/i);
  });
});
