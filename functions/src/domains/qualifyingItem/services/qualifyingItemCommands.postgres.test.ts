/**
 * Cross-store Qualifying Item command/query integration tests
 * (`PLATFORM-BASELINE-013A.2`).
 *
 * Requires BOTH a live PostgreSQL instance (`PLATFORM_POSTGRES_URL`) AND
 * the Firebase Firestore Emulator (`FIRESTORE_EMULATOR_HOST`) running
 * simultaneously -- Business, membership and Commerce Knowledge state live
 * in Firestore while the Qualifying Item itself is PostgreSQL-owned. Run via:
 *
 *   firebase emulators:exec --project demo-11thonus \
 *     "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *      pnpm --filter functions exec vitest run --config vitest.postgres.config.ts qualifyingItemCommands"
 *
 * Covers PB-012 §15 cases A, B, C, F (application half), G (application
 * half), J, U, V, Z (service half), AA, AB and the security matrix the
 * PLATFORM-BASELINE-013A.2 task names (owner/manager/staff, Platform Admin,
 * cross-Business mutation and read isolation, fabricated ids, lifecycle,
 * optional mapping).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createKnowledgeNodePersisted,
  retireKnowledgeNodePersisted,
  transitionKnowledgeNodeStatusPersisted,
} from "../../commerceKnowledge/repositories/knowledgeNodeRepository";
import { loadPostgresConfig } from "../../../infrastructure/postgres/postgresConfig";
import {
  closePostgresPool,
  createPostgresPool,
  type PlatformPostgresPool,
} from "../../../infrastructure/postgres/postgresPool";
import {
  discoverMigrationFiles,
  migrateDown,
  migrateUp,
} from "../../../infrastructure/postgres/migrationRunner";
import { authorizeRewardProgramManage } from "../../rewardProgram/services/rewardProgramAuthorization";
import { QualifyingItemDomainError } from "../models/qualifyingItemErrors";
import {
  createQualifyingItem,
  retireQualifyingItem,
  updateQualifyingItem,
} from "./qualifyingItemCommands";
import { listQualifyingItems } from "./qualifyingItemQueries";
import { getQualifyingItem } from "../repositories/qualifyingItemRepository";

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

const app = initializeApp({ projectId: "demo-11thonus" }, "qualifyingItemCommandsPostgresTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;

const BIZ_A = "qi_biz_a";
const BIZ_B = "qi_biz_b";
const OWNER_A = "qi_owner_a";
const MANAGER_A = "qi_manager_a";
const STAFF_A = "qi_staff_a";
const OWNER_B = "qi_owner_b";
const PLATFORM_ADMIN = "qi_platform_admin";
const OUTSIDER = "qi_outsider";
const FABRICATED_UUID = "00000000-0000-4000-8000-000000000000";

const CREATED_AT = new Date("2026-09-19T00:00:00.000Z");
const IND = "qi_ind";
const CAT = "qi_cat";
const TYPE = "qi_type";
const REWARD_CAT = "qi_reward_category";
const PRODUCT_NODE = "qi_product_node";
const SERVICE_NODE = "qi_service_node";
const CATEGORY_TYPED_NODE = REWARD_CAT; // wrong type for a classification
const DRAFT_PRODUCT_NODE = "qi_draft_product_node"; // never activated

let keySeq = 0;
const nextKey = (prefix = "idem") => `${prefix}_${Date.now()}_${keySeq++}`;
const CORRELATION = "corr-qi-test";

beforeAll(async () => {
  if (!process.env.PLATFORM_POSTGRES_URL && process.env.PLATFORM_ENV !== "test") {
    throw new Error(
      "This test requires a live PostgreSQL instance (PLATFORM_ENV=test / PLATFORM_POSTGRES_URL).",
    );
  }
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite, run alongside a live PostgreSQL instance. See this file's header comment for the exact command.",
    );
  }
  pool = createPostgresPool(loadPostgresConfig());
  await migrateUp(pool, migrationsDir);
  await seedCommerceKnowledge();
}, 60_000);

afterAll(async () => {
  // Leave the shared database as this suite found it (no schema) -- see the
  // identical note in `qualifyingItemRepository.postgres.test.ts`.
  const files = await discoverMigrationFiles(migrationsDir);
  await migrateDown(pool, migrationsDir, files.length);
  await pool.query("DROP TABLE IF EXISTS schema_migrations");
  await closePostgresPool(pool);
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

afterEach(async () => {
  await pool.query("DELETE FROM qualifying_items");
  await pool.query("DELETE FROM idempotency_keys");
  for (const collection of ["businesses", "businessMemberships", "platformAdministrators"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

async function activate(id: string) {
  await transitionKnowledgeNodeStatusPersisted(db, id, "in_review", { updatedAt: CREATED_AT });
  await transitionKnowledgeNodeStatusPersisted(db, id, "active", { updatedAt: CREATED_AT });
}

async function seedCommerceKnowledge() {
  if ((await db.collection("knowledgeNodes").doc(IND).get()).exists) return;
  await createKnowledgeNodePersisted(db, {
    id: IND,
    nodeType: "industry",
    parentId: null,
    canonicalName: "QI Industry",
    slug: "qi-industry",
    createdAt: CREATED_AT,
  });
  await activate(IND);
  await createKnowledgeNodePersisted(db, {
    id: CAT,
    nodeType: "business_category",
    parentId: IND,
    canonicalName: "QI Category",
    slug: "qi-category",
    createdAt: CREATED_AT,
  });
  await activate(CAT);
  await createKnowledgeNodePersisted(db, {
    id: TYPE,
    nodeType: "business_type",
    parentId: CAT,
    canonicalName: "QI Type",
    slug: "qi-type",
    createdAt: CREATED_AT,
  });
  await activate(TYPE);
  await createKnowledgeNodePersisted(db, {
    id: REWARD_CAT,
    nodeType: "reward_program_category",
    parentId: TYPE,
    canonicalName: "QI Reward Category",
    slug: "qi-reward-category",
    createdAt: CREATED_AT,
  });
  await activate(REWARD_CAT);
  await createKnowledgeNodePersisted(db, {
    id: PRODUCT_NODE,
    nodeType: "standard_product",
    parentId: REWARD_CAT,
    canonicalName: "QI Product",
    slug: "qi-product",
    createdAt: CREATED_AT,
  });
  await activate(PRODUCT_NODE);
  await createKnowledgeNodePersisted(db, {
    id: SERVICE_NODE,
    nodeType: "standard_service",
    parentId: REWARD_CAT,
    canonicalName: "QI Service",
    slug: "qi-service",
    createdAt: CREATED_AT,
  });
  await activate(SERVICE_NODE);
  // Created but never activated: still `draft`, not eligible for a new reference.
  await createKnowledgeNodePersisted(db, {
    id: DRAFT_PRODUCT_NODE,
    nodeType: "standard_product",
    parentId: REWARD_CAT,
    canonicalName: "QI Draft Product",
    slug: "qi-draft-product",
    createdAt: CREATED_AT,
  });
}

async function seedBusiness(businessId: string, status: string = "trial") {
  await db
    .collection("businesses")
    .doc(businessId)
    .set({
      id: businessId,
      businessCode: "BIZ23456X",
      ownerUserId: "owner",
      displayName: `Seeded ${businessId}`,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: 1,
    });
}

async function seedMembership(params: {
  userId: string;
  businessId: string;
  role: "owner" | "manager" | "staff";
  status?: "active" | "invited" | "suspended" | "removed";
}) {
  await db
    .collection("businessMemberships")
    .doc(`m_${params.userId}_${params.businessId}`)
    .set({
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      status: params.status ?? "active",
      permissions: [],
    });
}

async function seedStandardWorld() {
  await seedBusiness(BIZ_A);
  await seedBusiness(BIZ_B);
  await seedMembership({ userId: OWNER_A, businessId: BIZ_A, role: "owner" });
  await seedMembership({ userId: MANAGER_A, businessId: BIZ_A, role: "manager" });
  await seedMembership({ userId: STAFF_A, businessId: BIZ_A, role: "staff" });
  await seedMembership({ userId: OWNER_B, businessId: BIZ_B, role: "owner" });
  // A genuine Platform Administrator with NO membership in either Business.
  await db
    .collection("platformAdministrators")
    .doc(PLATFORM_ADMIN)
    .set({
      roles: ["knowledge_approver"],
      status: "active",
      mfaRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: 1,
    });
}

function create(
  userId: string,
  businessId: string,
  name = "Black Coffee",
  extra: Record<string, unknown> = {},
) {
  return createQualifyingItem(db, pool, {
    userId,
    request: { businessId, name, ...extra },
    idempotencyKey: nextKey("create"),
    correlationId: CORRELATION,
  });
}

function rename(userId: string, businessId: string, qualifyingItemId: string, name: string) {
  return updateQualifyingItem(db, pool, {
    userId,
    request: { businessId, qualifyingItemId, name },
    idempotencyKey: nextKey("update"),
    correlationId: CORRELATION,
  });
}

function retire(userId: string, businessId: string, qualifyingItemId: string) {
  return retireQualifyingItem(db, pool, {
    userId,
    request: { businessId, qualifyingItemId },
    idempotencyKey: nextKey("retire"),
    correlationId: CORRELATION,
  });
}

async function expectDomainError(promise: Promise<unknown>, category: string) {
  await expect(promise).rejects.toBeInstanceOf(QualifyingItemDomainError);
  await promise.catch((error: QualifyingItemDomainError) => {
    expect(error.category).toBe(category);
  });
}

async function rowCount(): Promise<number> {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM qualifying_items");
  return rows[0].n;
}

describe("createQualifyingItem — role matrix (DEC-LOY-017)", () => {
  it("Owner can create a Qualifying Item (case A: no Commerce Knowledge mapping)", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Black Coffee");
    expect(item).toMatchObject({
      businessId: BIZ_A,
      name: "Black Coffee",
      knowledgeNodeId: null,
      status: "active",
      createdBy: OWNER_A,
      updatedBy: OWNER_A,
      schemaVersion: 1,
    });
    expect(await getQualifyingItem(pool, BIZ_A, item.id)).not.toBeNull();
  });

  it("Manager can create a Qualifying Item (case B)", async () => {
    await seedStandardWorld();
    const item = await create(MANAGER_A, BIZ_A, "Medium Pizza");
    expect(item).toMatchObject({ businessId: BIZ_A, name: "Medium Pizza", createdBy: MANAGER_A });
  });

  it("Staff cannot create a Qualifying Item: AUTH_FORBIDDEN and nothing is persisted", async () => {
    await seedStandardWorld();
    await expectDomainError(create(STAFF_A, BIZ_A), "AUTH_FORBIDDEN");
    expect(await rowCount()).toBe(0);
  });

  it("Platform Administrator with no membership receives no authority (AUTH_FORBIDDEN, nothing persisted)", async () => {
    await seedStandardWorld();
    await expectDomainError(create(PLATFORM_ADMIN, BIZ_A), "AUTH_FORBIDDEN");
    expect(await rowCount()).toBe(0);
  });

  it("a user with no membership in the Business is denied", async () => {
    await seedStandardWorld();
    await expectDomainError(create(OUTSIDER, BIZ_A), "AUTH_FORBIDDEN");
  });

  it.each(["suspended", "removed", "invited"] as const)(
    "a %s Owner membership is denied",
    async (status) => {
      await seedBusiness(BIZ_A);
      await seedMembership({ userId: OWNER_A, businessId: BIZ_A, role: "owner", status });
      await expectDomainError(create(OWNER_A, BIZ_A), "AUTH_FORBIDDEN");
    },
  );

  it.each(["draft", "pending_verification", "suspended", "closed"])(
    "Owner of a %s Business is denied BUSINESS_INACTIVE",
    async (status) => {
      await seedBusiness(BIZ_A, status);
      await seedMembership({ userId: OWNER_A, businessId: BIZ_A, role: "owner" });
      await expectDomainError(create(OWNER_A, BIZ_A), "BUSINESS_INACTIVE");
      expect(await rowCount()).toBe(0);
    },
  );

  it("an actor of Business A cannot create an item inside Business B", async () => {
    await seedStandardWorld();
    await expectDomainError(create(OWNER_A, BIZ_B), "AUTH_FORBIDDEN");
    expect(await rowCount()).toBe(0);
  });

  it("rejects an empty / whitespace name with VALIDATION_FAILED before persisting", async () => {
    await seedStandardWorld();
    await expectDomainError(create(OWNER_A, BIZ_A, "   "), "VALIDATION_FAILED");
    expect(await rowCount()).toBe(0);
  });

  it("trims the Business-authored name", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "  Cappuccino  ");
    expect(item.name).toBe("Cappuccino");
  });

  it("two items with the same name coexist (FQ-2: duplicate names permitted)", async () => {
    await seedStandardWorld();
    const first = await create(OWNER_A, BIZ_A, "Espresso");
    const second = await create(MANAGER_A, BIZ_A, "Espresso");
    expect(first.id).not.toBe(second.id);
  });
});

describe("Z — rewardProgram.manage is not widened (service half)", () => {
  it("Manager is still denied Reward Program management while allowed Qualifying Item management", async () => {
    await seedStandardWorld();
    await expect(authorizeRewardProgramManage(db, MANAGER_A, BIZ_A)).rejects.toMatchObject({
      category: "AUTH_FORBIDDEN",
    });
    const item = await create(MANAGER_A, BIZ_A);
    expect(item.status).toBe("active");
  });

  it("Owner still passes Reward Program management authorization", async () => {
    await seedStandardWorld();
    await expect(authorizeRewardProgramManage(db, OWNER_A, BIZ_A)).resolves.toBeUndefined();
  });

  it("creating Qualifying Items writes nothing to the Reward Program tables (no version binding in this package)", async () => {
    await seedStandardWorld();
    await create(OWNER_A, BIZ_A);
    for (const table of [
      "reward_programs",
      "reward_program_versions",
      "reward_program_version_qualifying_nodes",
      "reward_program_version_qualifying_items",
    ]) {
      const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${table}`);
      expect(rows[0].n, table).toBe(0);
    }
  });
});

describe("optional Commerce Knowledge classification (DEC-LOY-016)", () => {
  it("V: creating and editing an unmapped item performs zero Commerce Knowledge reads", async () => {
    await seedStandardWorld();
    const touched: string[] = [];
    const recordingDb = new Proxy(db, {
      get(target, prop, receiver) {
        if (prop === "collection" || prop === "collectionGroup" || prop === "doc") {
          return (arg: string) => {
            touched.push(`${String(prop)}:${arg}`);
            return (target as never as Record<string, (a: string) => unknown>)[prop as string](arg);
          };
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as Firestore;
    const item = await createQualifyingItem(recordingDb, pool, {
      userId: OWNER_A,
      request: { businessId: BIZ_A, name: "Plain Item" },
      idempotencyKey: nextKey(),
      correlationId: CORRELATION,
    });
    await updateQualifyingItem(recordingDb, pool, {
      userId: OWNER_A,
      request: { businessId: BIZ_A, qualifyingItemId: item.id, name: "Plain Item 2" },
      idempotencyKey: nextKey(),
      correlationId: CORRELATION,
    });
    expect(touched.filter((entry) => entry.includes("knowledgeNodes"))).toEqual([]);
  });

  it("an unmapped item is valid even when Commerce Knowledge holds no eligible node for it", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Homemade Special", { knowledgeNodeId: null });
    expect(item.knowledgeNodeId).toBeNull();
  });

  it.each([
    ["standard_product", PRODUCT_NODE],
    ["standard_service", SERVICE_NODE],
  ])("U: a supplied active %s classification is accepted and persisted", async (_type, nodeId) => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Classified", { knowledgeNodeId: nodeId });
    expect(item.knowledgeNodeId).toBe(nodeId);
  });

  it.each([
    ["a nonexistent node", "qi_no_such_node"],
    ["a node of the wrong type", CATEGORY_TYPED_NODE],
    ["a node that is not active", DRAFT_PRODUCT_NODE],
  ])(
    "U: a supplied classification pointing at %s is rejected and nothing is persisted",
    async (_label, nodeId) => {
      await seedStandardWorld();
      await expectDomainError(
        create(OWNER_A, BIZ_A, "Bad Mapping", { knowledgeNodeId: nodeId }),
        "VALIDATION_FAILED",
      );
      expect(await rowCount()).toBe(0);
    },
  );

  it("classification can be set later, changed, and cleared; clearing needs no Commerce Knowledge read", async () => {
    await seedStandardWorld();
    const item = await create(MANAGER_A, BIZ_A, "Later Mapped");
    const mapped = await updateQualifyingItem(db, pool, {
      userId: MANAGER_A,
      request: { businessId: BIZ_A, qualifyingItemId: item.id, knowledgeNodeId: PRODUCT_NODE },
      idempotencyKey: nextKey(),
      correlationId: CORRELATION,
    });
    expect(mapped.knowledgeNodeId).toBe(PRODUCT_NODE);
    const cleared = await updateQualifyingItem(db, pool, {
      userId: MANAGER_A,
      request: { businessId: BIZ_A, qualifyingItemId: item.id, knowledgeNodeId: null },
      idempotencyKey: nextKey(),
      correlationId: CORRELATION,
    });
    expect(cleared.knowledgeNodeId).toBeNull();
    expect(cleared.name).toBe("Later Mapped");
  });

  it("a mapping later retired in Commerce Knowledge never blocks renaming the item (no revalidation of an unchanged mapping)", async () => {
    await seedStandardWorld();
    const disposable = `qi_disposable_${Date.now()}`;
    await createKnowledgeNodePersisted(db, {
      id: disposable,
      nodeType: "standard_product",
      parentId: REWARD_CAT,
      canonicalName: "Disposable",
      slug: `disposable-${Date.now()}`,
      createdAt: CREATED_AT,
    });
    await activate(disposable);
    const item = await create(OWNER_A, BIZ_A, "Was Mapped", { knowledgeNodeId: disposable });
    await retireKnowledgeNodePersisted(db, disposable, {
      updatedAt: new Date(),
      replacementNodeId: PRODUCT_NODE,
    });
    const renamed = await rename(OWNER_A, BIZ_A, item.id, "Still Fine");
    expect(renamed).toMatchObject({ name: "Still Fine", knowledgeNodeId: disposable });
  });

  it("supplying an invalid classification on update is rejected and the item is unchanged", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Stable");
    await expectDomainError(
      updateQualifyingItem(db, pool, {
        userId: OWNER_A,
        request: {
          businessId: BIZ_A,
          qualifyingItemId: item.id,
          knowledgeNodeId: "qi_no_such_node",
        },
        idempotencyKey: nextKey(),
        correlationId: CORRELATION,
      }),
      "VALIDATION_FAILED",
    );
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.knowledgeNodeId).toBeNull();
  });
});

describe("updateQualifyingItem — rename", () => {
  it("Owner and Manager can rename; audit fields track the actor", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Original");
    const byManager = await rename(MANAGER_A, BIZ_A, item.id, "Renamed By Manager");
    expect(byManager).toMatchObject({
      id: item.id,
      name: "Renamed By Manager",
      createdBy: OWNER_A,
      updatedBy: MANAGER_A,
    });
    const byOwner = await rename(OWNER_A, BIZ_A, item.id, "Renamed By Owner");
    expect(byOwner).toMatchObject({ name: "Renamed By Owner", updatedBy: OWNER_A });
  });

  it("Staff cannot rename: AUTH_FORBIDDEN and the name is unchanged", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Untouchable");
    await expectDomainError(rename(STAFF_A, BIZ_A, item.id, "Hacked"), "AUTH_FORBIDDEN");
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.name).toBe("Untouchable");
  });

  it("Platform Administrator with no membership cannot rename", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Untouchable");
    await expectDomainError(rename(PLATFORM_ADMIN, BIZ_A, item.id, "Hacked"), "AUTH_FORBIDDEN");
  });

  it("G: an actor of Business B cannot rename Business A's item by supplying its id (indistinguishable from absent)", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "A Only");
    await expectDomainError(rename(OWNER_B, BIZ_B, item.id, "Hijacked"), "RESOURCE_NOT_FOUND");
    expect(await getQualifyingItem(pool, BIZ_A, item.id)).toMatchObject({
      name: "A Only",
      updatedBy: OWNER_A,
    });
  });

  it("G: an actor of Business A cannot reach Business B's item even while authorised in A", async () => {
    await seedStandardWorld();
    const foreign = await create(OWNER_B, BIZ_B, "B Only");
    await expectDomainError(rename(OWNER_A, BIZ_A, foreign.id, "Hijacked"), "RESOURCE_NOT_FOUND");
    expect((await getQualifyingItem(pool, BIZ_B, foreign.id))?.name).toBe("B Only");
  });

  it("an actor of Business A cannot claim Business B's businessId to reach B's item (fails authorization)", async () => {
    await seedStandardWorld();
    const foreign = await create(OWNER_B, BIZ_B, "B Only");
    await expectDomainError(rename(OWNER_A, BIZ_B, foreign.id, "Hijacked"), "AUTH_FORBIDDEN");
    expect((await getQualifyingItem(pool, BIZ_B, foreign.id))?.name).toBe("B Only");
  });

  it.each([
    ["a fabricated well-formed UUID", FABRICATED_UUID],
    ["a malformed id", "not-a-uuid"],
    ["an injection-shaped id", "'; DROP TABLE qualifying_items;--"],
  ])("H: %s fails safely with RESOURCE_NOT_FOUND", async (_label, id) => {
    await seedStandardWorld();
    await expectDomainError(rename(OWNER_A, BIZ_A, id, "Ghost"), "RESOURCE_NOT_FOUND");
  });

  it("rejects an update that supplies neither a name nor a classification", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A);
    await expectDomainError(
      updateQualifyingItem(db, pool, {
        userId: OWNER_A,
        request: { businessId: BIZ_A, qualifyingItemId: item.id },
        idempotencyKey: nextKey(),
        correlationId: CORRELATION,
      }),
      "VALIDATION_FAILED",
    );
  });

  it("rejects renaming to an empty name", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Keep Me");
    await expectDomainError(rename(OWNER_A, BIZ_A, item.id, "  "), "VALIDATION_FAILED");
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.name).toBe("Keep Me");
  });
});

describe("retireQualifyingItem — lifecycle (J)", () => {
  it("Owner and Manager can retire; the row and its historical identity are preserved", async () => {
    await seedStandardWorld();
    const first = await create(OWNER_A, BIZ_A, "Retire By Manager");
    const second = await create(OWNER_A, BIZ_A, "Retire By Owner");
    const retiredByManager = await retire(MANAGER_A, BIZ_A, first.id);
    const retiredByOwner = await retire(OWNER_A, BIZ_A, second.id);
    expect(retiredByManager).toMatchObject({
      id: first.id,
      status: "retired",
      name: "Retire By Manager",
      updatedBy: MANAGER_A,
    });
    expect(retiredByOwner).toMatchObject({ id: second.id, status: "retired" });
    expect(await rowCount()).toBe(2);
    expect((await getQualifyingItem(pool, BIZ_A, first.id))?.status).toBe("retired");
  });

  it("Staff cannot retire: AUTH_FORBIDDEN and the item stays active", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A);
    await expectDomainError(retire(STAFF_A, BIZ_A, item.id), "AUTH_FORBIDDEN");
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.status).toBe("active");
  });

  it("Platform Administrator with no membership cannot retire", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A);
    await expectDomainError(retire(PLATFORM_ADMIN, BIZ_A, item.id), "AUTH_FORBIDDEN");
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.status).toBe("active");
  });

  it("G: an actor of Business B cannot retire Business A's item", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A);
    await expectDomainError(retire(OWNER_B, BIZ_B, item.id), "RESOURCE_NOT_FOUND");
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.status).toBe("active");
  });

  it("retiring an already-retired item is an INVALID_STATE_TRANSITION (terminal)", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A);
    await retire(OWNER_A, BIZ_A, item.id);
    await expectDomainError(retire(OWNER_A, BIZ_A, item.id), "INVALID_STATE_TRANSITION");
  });

  it("a retired item cannot be renamed or reclassified (INVALID_STATE_TRANSITION) and is unchanged", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A, "Frozen");
    await retire(OWNER_A, BIZ_A, item.id);
    await expectDomainError(rename(OWNER_A, BIZ_A, item.id, "Thawed"), "INVALID_STATE_TRANSITION");
    expect((await getQualifyingItem(pool, BIZ_A, item.id))?.name).toBe("Frozen");
  });

  it("fabricated / malformed ids fail safely with RESOURCE_NOT_FOUND", async () => {
    await seedStandardWorld();
    await expectDomainError(retire(OWNER_A, BIZ_A, FABRICATED_UUID), "RESOURCE_NOT_FOUND");
    await expectDomainError(retire(OWNER_A, BIZ_A, "nope"), "RESOURCE_NOT_FOUND");
  });
});

describe("idempotency", () => {
  it("replaying create with the same key and request returns the same item and persists one row", async () => {
    await seedStandardWorld();
    const key = nextKey("replay");
    const request = { businessId: BIZ_A, name: "Once Only" };
    const first = await createQualifyingItem(db, pool, {
      userId: OWNER_A,
      request,
      idempotencyKey: key,
      correlationId: CORRELATION,
    });
    const second = await createQualifyingItem(db, pool, {
      userId: OWNER_A,
      request,
      idempotencyKey: key,
      correlationId: CORRELATION,
    });
    expect(second.id).toBe(first.id);
    expect(await rowCount()).toBe(1);
  });

  it("reusing a key for a materially different create is an IDEMPOTENCY_CONFLICT and persists nothing new", async () => {
    await seedStandardWorld();
    const key = nextKey("conflict");
    await createQualifyingItem(db, pool, {
      userId: OWNER_A,
      request: { businessId: BIZ_A, name: "First" },
      idempotencyKey: key,
      correlationId: CORRELATION,
    });
    await expectDomainError(
      createQualifyingItem(db, pool, {
        userId: OWNER_A,
        request: { businessId: BIZ_A, name: "Different" },
        idempotencyKey: key,
        correlationId: CORRELATION,
      }),
      "IDEMPOTENCY_CONFLICT",
    );
    expect(await rowCount()).toBe(1);
  });

  it("replaying retire with the same key returns the original result instead of failing as already-retired", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A);
    const key = nextKey("retire-replay");
    const params = {
      userId: OWNER_A,
      request: { businessId: BIZ_A, qualifyingItemId: item.id },
      idempotencyKey: key,
      correlationId: CORRELATION,
    };
    const first = await retireQualifyingItem(db, pool, params);
    const replay = await retireQualifyingItem(db, pool, params);
    expect(replay.id).toBe(first.id);
    expect(replay.status).toBe("retired");
  });
});

describe("listQualifyingItems — membership-gated read (AB)", () => {
  it.each([
    ["Owner", OWNER_A],
    ["Manager", MANAGER_A],
    ["Staff", STAFF_A],
  ])(
    "%s of the Business can view its Qualifying Items (Staff view/select without manage)",
    async (_role, userId) => {
      await seedStandardWorld();
      await create(OWNER_A, BIZ_A, "Espresso");
      await create(OWNER_A, BIZ_A, "Latte");
      const items = await listQualifyingItems(db, pool, { userId, businessId: BIZ_A });
      expect(items.map((i) => i.name)).toEqual(["Espresso", "Latte"]);
    },
  );

  it("Staff can read yet was denied every management operation on the same Business", async () => {
    await seedStandardWorld();
    const item = await create(OWNER_A, BIZ_A);
    expect(
      await listQualifyingItems(db, pool, { userId: STAFF_A, businessId: BIZ_A }),
    ).toHaveLength(1);
    await expectDomainError(create(STAFF_A, BIZ_A), "AUTH_FORBIDDEN");
    await expectDomainError(rename(STAFF_A, BIZ_A, item.id, "x"), "AUTH_FORBIDDEN");
    await expectDomainError(retire(STAFF_A, BIZ_A, item.id), "AUTH_FORBIDDEN");
  });

  it("defaults to active items; retired items are excluded unless requested", async () => {
    await seedStandardWorld();
    await create(OWNER_A, BIZ_A, "Live");
    const gone = await create(OWNER_A, BIZ_A, "Gone");
    await retire(OWNER_A, BIZ_A, gone.id);
    const active = await listQualifyingItems(db, pool, { userId: STAFF_A, businessId: BIZ_A });
    expect(active.map((i) => i.name)).toEqual(["Live"]);
    const all = await listQualifyingItems(db, pool, {
      userId: OWNER_A,
      businessId: BIZ_A,
      statusFilter: "all",
    });
    expect(all.map((i) => i.name).sort()).toEqual(["Gone", "Live"]);
    const retiredOnly = await listQualifyingItems(db, pool, {
      userId: OWNER_A,
      businessId: BIZ_A,
      statusFilter: "retired",
    });
    expect(retiredOnly.map((i) => i.name)).toEqual(["Gone"]);
  });

  it("does not leak another Business's items: each Business lists only its own", async () => {
    await seedStandardWorld();
    await create(OWNER_A, BIZ_A, "A Coffee");
    await create(OWNER_B, BIZ_B, "B Tea");
    expect(
      (await listQualifyingItems(db, pool, { userId: OWNER_A, businessId: BIZ_A })).map(
        (i) => i.name,
      ),
    ).toEqual(["A Coffee"]);
    expect(
      (await listQualifyingItems(db, pool, { userId: OWNER_B, businessId: BIZ_B })).map(
        (i) => i.name,
      ),
    ).toEqual(["B Tea"]);
  });

  it("an actor of Business A cannot list Business B's items", async () => {
    await seedStandardWorld();
    await create(OWNER_B, BIZ_B, "B Tea");
    await expectDomainError(
      listQualifyingItems(db, pool, { userId: OWNER_A, businessId: BIZ_B }),
      "AUTH_FORBIDDEN",
    );
  });

  it("Platform Administrator without membership cannot list a Business's items", async () => {
    await seedStandardWorld();
    await create(OWNER_A, BIZ_A);
    await expectDomainError(
      listQualifyingItems(db, pool, { userId: PLATFORM_ADMIN, businessId: BIZ_A }),
      "AUTH_FORBIDDEN",
    );
  });

  it("a suspended membership cannot read", async () => {
    await seedBusiness(BIZ_A);
    await seedMembership({
      userId: STAFF_A,
      businessId: BIZ_A,
      role: "staff",
      status: "suspended",
    });
    await expectDomainError(
      listQualifyingItems(db, pool, { userId: STAFF_A, businessId: BIZ_A }),
      "AUTH_FORBIDDEN",
    );
  });
});
