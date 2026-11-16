/**
 * Business Review × Commercial admission gate — orthogonality proof
 * (`EA-BL-001-CORR-002-BR`, PR #304 correction F).
 *
 *   business_review_required --(Business approval)--> waiting_for_customer
 *     --(Customer verify, gate = enforce)--> admitted/verified  OR  pending_admission
 *
 * Proves the Business Review decision never invokes admission and never reaches `pending_admission`
 * itself; the Customer's verification stays the only trigger, and the existing WP-COM admit / hold
 * semantics apply unchanged afterwards. No Commercial source is exercised differently than by the
 * Commercial suites: the real `createCommercialAdmissionPort()` is bound exactly as production binds it.
 *
 * Commercial rows are immutable, so this suite resets the way the Commercial suites do: drop the
 * Commercial objects, clear the Loyalty/Purchase tables, re-apply the migrations.
 *
 * Requires PostgreSQL + the Firestore Emulator (see `businessReview.postgres.test.ts`).
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
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
import { createCommercialAdmissionPort } from "../../composition/commercialAdmissionBinding";
import { insertCommercialAccount } from "./repositories/commercialAccountRepository";
import { postCommercialLedgerEntry } from "./services/postCommercialLedgerEntry";
import { recordPurchase } from "../purchase/services/recordPurchaseCommand";
import { verifyPurchase } from "../purchase/services/verifyPurchaseCommand";
import { approveBusinessReview } from "../purchase/services/businessReviewCommands";
import { listPurchaseRecordEvents } from "../purchase/repositories/purchaseRecordRepository";
import { PurchaseDomainError } from "../purchase/models/purchaseErrors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "..", "infrastructure", "postgres", "migrations");

const app = initializeApp({ projectId: "demo-11thonus" }, "businessReviewCommercialGateTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;
const port = createCommercialAdmissionPort();

let seq = 0;
let customerSeq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;
const THRESHOLD = 5;

function lnFor(i: number): string {
  const d = (n: number) => String(2 + (((n % 8) + 8) % 8));
  return `BRG${d(i)}${d(i + 3)}${d(i + 5)}`;
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

async function resetAll(): Promise<void> {
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
      "DELETE FROM schema_migrations WHERE version IN ('0021', '0022', '0023', '0024', '0025', '0026', '0027', '0028', '0029')",
    );
  }
  for (const table of [
    "purchase_outbox",
    "notification_intents",
    "trust_events",
    "redemptions",
    "rewards",
    "verified_unit_allocation_events",
    "verified_unit_allocations",
    "loyalty_cycles",
    "loyalty_cycle_streams",
    "verified_units",
    "purchase_record_events",
    "purchase_records",
    "reward_program_version_qualifying_items",
    "reward_program_outbox",
    "idempotency_keys",
  ]) {
    await pool.query(`DELETE FROM ${table}`);
  }
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
  pool = createPostgresPool(loadPostgresConfig());
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
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
}, 60000);

type World = {
  businessId: string;
  ownerId: string;
  staffId: string;
  programId: string;
  qualifyingItemId: string;
  customerId: string;
  ln: string;
};

async function seedWorld(): Promise<World> {
  const businessId = nextId("biz");
  const ownerId = nextId("owner");
  const staffId = nextId("staff");
  await db.collection("businesses").doc(businessId).set({
    id: businessId,
    businessCode: "BIZ45678X",
    ownerUserId: ownerId,
    displayName: "BRG Cafe",
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
  for (const [userId, role] of [
    [ownerId, "owner"],
    [staffId, "staff"],
  ] as const) {
    await db.collection("businessMemberships").doc(nextId("mem")).set({
      userId,
      businessId,
      role,
      status: "active",
      permissions: [],
    });
  }
  const item = await withPlatformTransaction(pool, async (tx) =>
    insertQualifyingItem(tx, {
      businessId,
      name: "Gate item",
      knowledgeNodeId: null,
      actorId: "test-seed",
    }),
  );
  const created = await createRewardProgram(db, pool, {
    userId: ownerId,
    request: {
      businessId,
      displayName: "Gate Club",
      rewardProgramCategoryId: null,
      rewardDescription: "Free Coffee",
      multipleUnitsAllowed: true,
      sharedLoyaltyNumberAllowed: true,
      businessReviewQuantityThreshold: THRESHOLD,
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
    generator: new FixedGenerator(`qrbrg${customerSeq}ref`),
    idempotencyKey: `key_qr_${suffix}`,
    requestHash: `hash_qr_${suffix}`,
  });
  return {
    businessId,
    ownerId,
    staffId,
    programId: created.program.id,
    qualifyingItemId: item.id,
    customerId,
    ln,
  };
}

async function openAccount(businessId: string, trial: number): Promise<void> {
  await withPlatformTransaction(pool, async (tx) => {
    await insertCommercialAccount(tx, {
      businessId,
      settlementMarket: "RW",
      commercialEffectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      correlationId: nextId("corr"),
    });
    if (trial > 0) {
      await postCommercialLedgerEntry(tx, {
        businessId,
        entryType: "trial_grant",
        bucket: "trial",
        unitsDelta: trial,
        idempotencyScopeKey: `test:trial:${businessId}`,
        createdBy: "test",
        correlationId: nextId("corr"),
      });
    }
  });
}

async function recordForReview(w: World): Promise<string> {
  const rec = await recordPurchase(db, pool, {
    userId: w.staffId,
    request: {
      businessId: w.businessId,
      rewardProgramId: w.programId,
      loyaltyNumberValue: w.ln,
      quantity: THRESHOLD,
      qualifyingItemId: w.qualifyingItemId,
      purchaseDate: new Date("2026-09-28T10:00:00.000Z"),
    },
    idempotencyKey: nextId("key"),
    correlationId: nextId("corr"),
  });
  expect(rec.purchase.status).toBe("business_review_required");
  return rec.purchase.id;
}

function verifyEnforced(w: World, purchaseRecordId: string) {
  return verifyPurchase(db, pool, {
    customerIdentityId: w.customerId,
    request: { purchaseRecordId },
    idempotencyKey: nextId("key_v"),
    correlationId: nextId("corr"),
    admissionGateMode: "enforce",
    commercialAdmission: port,
  });
}

async function count(table: string): Promise<number> {
  return Number((await pool.query(`SELECT COUNT(*) AS c FROM ${table}`)).rows[0].c);
}

async function status(id: string): Promise<string> {
  return (await pool.query(`SELECT status FROM purchase_records WHERE id=$1`, [id])).rows[0].status;
}

async function approve(w: World, purchaseRecordId: string) {
  // Owner approves a Purchase the Staff member recorded (reviewer != recorder).
  return approveBusinessReview(db, pool, {
    userId: w.ownerId,
    request: { businessId: w.businessId, purchaseRecordId },
    idempotencyKey: nextId("key_a"),
    correlationId: nextId("corr"),
  });
}

describe("Business Review × Commercial gate (enforce) — orthogonality", () => {
  it("approval does NOT invoke admission; the Customer's verification is still the trigger (capacity available → admitted)", async () => {
    const w = await seedWorld();
    await openAccount(w.businessId, 2);
    const id = await recordForReview(w);

    // While under review: the Customer cannot verify, so admission cannot run.
    await expect(verifyEnforced(w, id)).rejects.toBeInstanceOf(PurchaseDomainError);
    expect(await count("commercial_admissions")).toBe(0);

    const approved = await approve(w, id);
    expect(approved.purchase.status).toBe("waiting_for_customer");
    // Approval touched no Commercial or Loyalty state at all.
    expect(await count("commercial_admissions")).toBe(0);
    expect(await count("commercial_admission_blocks")).toBe(0);
    expect(await count("verified_units")).toBe(0);
    expect(await count("loyalty_cycles")).toBe(0);
    expect(await count("rewards")).toBe(0);

    // The Customer's verification now runs the EXISTING gate.
    const verified = await verifyEnforced(w, id);
    expect(verified.outcome).toBe("admitted");
    expect(await status(id)).toBe("verified");
    expect(await count("commercial_admissions")).toBe(1);
    expect(await count("verified_units")).toBe(1);
  });

  it("capacity unavailable → the existing pending_admission hold, reached ONLY via the Customer's verification", async () => {
    const w = await seedWorld();
    await openAccount(w.businessId, 0);
    const id = await recordForReview(w);

    await approve(w, id);
    // Still ordinary waiting_for_customer: Business approval never produces pending_admission.
    expect(await status(id)).toBe("waiting_for_customer");
    expect(await count("commercial_admissions")).toBe(0);

    const held = await verifyEnforced(w, id);
    expect(held.outcome).toBe("pending_admission");
    expect(await status(id)).toBe("pending_admission");
    // Held = received and preserved: no Loyalty state, no admission.
    expect(await count("verified_units")).toBe(0);
    expect(await count("loyalty_cycles")).toBe(0);
    expect(await count("rewards")).toBe(0);
    expect(await count("commercial_admissions")).toBe(0);
  });

  it("no lifecycle edge ever runs business_review_required → pending_admission (or → verified)", async () => {
    const w = await seedWorld();
    await openAccount(w.businessId, 0);
    const id = await recordForReview(w);
    await approve(w, id);
    await verifyEnforced(w, id);
    const edges = (await listPurchaseRecordEvents(pool, id)).map(
      (e) => `${e.fromStatus ?? "∅"}→${e.toStatus}`,
    );
    expect(edges).toEqual([
      "∅→business_review_required",
      "business_review_required→waiting_for_customer",
      "waiting_for_customer→pending_admission",
    ]);
    // …and the database refuses the shortcut outright.
    const other = await recordForReview(w);
    await expect(
      pool.query(`UPDATE purchase_records SET status='pending_admission' WHERE id=$1`, [other]),
    ).rejects.toThrow(/business_review/);
  });
});
