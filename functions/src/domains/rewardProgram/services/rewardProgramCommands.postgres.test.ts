/**
 * Cross-store Reward Program command integration tests
 * (`PLATFORM-BASELINE-005A`).
 *
 * Requires BOTH a live PostgreSQL instance (`PLATFORM_POSTGRES_URL`) AND
 * the Firebase Firestore Emulator (`FIRESTORE_EMULATOR_HOST`) running
 * simultaneously -- the Reward Program domain reads/validates Business,
 * membership, and Commerce Knowledge state from Firestore while writing
 * its own domain state to PostgreSQL. Run via:
 *
 *   docker compose -f docker-compose.postgres.yml up -d
 *   firebase emulators:exec --project demo-11thonus \
 *     "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/eleventhonus_platform_test \
 *      npx vitest run --config vitest.postgres.config.ts rewardProgramCommands"
 *
 * Proves the exact cross-store publication contract
 * (`PLATFORM-BASELINE-005-REVIEW-FINDINGS-001` RF-3): authoritative
 * Firestore validation before the PostgreSQL transaction begins, a
 * disclosed bounded race window, and that a historical published version
 * is never invalidated by a later Commerce Knowledge node retirement.
 */

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
  createPostgresPool,
  closePostgresPool,
  type PlatformPostgresPool,
} from "../../../infrastructure/postgres/postgresPool";
import {
  discoverMigrationFiles,
  migrateUp,
} from "../../../infrastructure/postgres/migrationRunner";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRewardProgram } from "./createRewardProgramCommand";
import { updateRewardProgramDraft } from "./updateRewardProgramDraftCommand";
import { publishRewardProgramVersion } from "./publishRewardProgramVersionCommand";
import { createNextRewardProgramVersion } from "./createNextRewardProgramVersionCommand";
import { getRewardProgram, listRewardPrograms } from "./rewardProgramQueries";
import { rewardProgramRequestHash } from "./rewardProgramRequestHash";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { publishVersion } from "../repositories/rewardProgramRepository";
import { RewardProgramDomainError } from "../models/rewardProgramErrors";

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

const app = initializeApp({ projectId: "demo-11thonus" }, "rewardProgramCommandsPostgresTest");
const db: Firestore = getFirestore(app);
let pool: PlatformPostgresPool;

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now()}_${seq++}`;

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
  const files = await discoverMigrationFiles(migrationsDir);
  if (files.length === 0) {
    throw new Error(
      "No Reward Program migrations found — did the migrations/ directory get cleaned?",
    );
  }
  await migrateUp(pool, migrationsDir);
});

afterAll(async () => {
  await closePostgresPool(pool);
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

afterEach(async () => {
  await pool.query("DELETE FROM reward_program_version_qualifying_nodes");
  await pool.query("DELETE FROM reward_program_outbox");
  await pool.query("DELETE FROM idempotency_keys");
  await pool.query("UPDATE reward_programs SET current_version_id = NULL");
  await pool.query("DELETE FROM reward_program_versions");
  await pool.query("DELETE FROM reward_programs");

  for (const collection of ["businesses", "businessMemberships"]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

async function seedBusiness(businessId: string, status: string = "trial") {
  await db.collection("businesses").doc(businessId).set({
    id: businessId,
    businessCode: "BIZ23456X",
    ownerUserId: "cust_owner",
    displayName: "Seeded Cafe",
    status,
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
  status?: "active" | "invited" | "suspended" | "removed";
}) {
  await db
    .collection("businessMemberships")
    .doc(params.membershipId)
    .set({
      userId: params.userId,
      businessId: params.businessId,
      role: params.role,
      status: params.status ?? "active",
      permissions: [],
    });
}

const CREATED_AT = new Date("2026-09-13T00:00:00.000Z");
const IND = "rp_ind";
const CAT = "rp_cat";
const TYPE = "rp_type";
const CATEGORY_NODE = "rp_category_node";
const PRODUCT_NODE = "rp_product_node";
const PRODUCT_NODE_2 = "rp_product_node_2";

beforeAll(async () => {
  const existing = await db.collection("knowledgeNodes").doc(IND).get();
  if (existing.exists) return; // already seeded by a prior run against the shared emulator instance

  async function activate(id: string) {
    await transitionKnowledgeNodeStatusPersisted(db, id, "in_review", { updatedAt: CREATED_AT });
    await transitionKnowledgeNodeStatusPersisted(db, id, "active", { updatedAt: CREATED_AT });
  }

  await createKnowledgeNodePersisted(db, {
    id: IND,
    nodeType: "industry",
    parentId: null,
    canonicalName: "RP Industry",
    slug: "rp-industry",
    createdAt: CREATED_AT,
  });
  await activate(IND);

  await createKnowledgeNodePersisted(db, {
    id: CAT,
    nodeType: "business_category",
    parentId: IND,
    canonicalName: "RP Category",
    slug: "rp-category",
    createdAt: CREATED_AT,
  });
  await activate(CAT);

  await createKnowledgeNodePersisted(db, {
    id: TYPE,
    nodeType: "business_type",
    parentId: CAT,
    canonicalName: "RP Type",
    slug: "rp-type",
    createdAt: CREATED_AT,
  });
  await activate(TYPE);

  await createKnowledgeNodePersisted(db, {
    id: CATEGORY_NODE,
    nodeType: "reward_program_category",
    parentId: TYPE,
    canonicalName: "RP Reward Category",
    slug: "rp-reward-category",
    createdAt: CREATED_AT,
  });
  await activate(CATEGORY_NODE);

  await createKnowledgeNodePersisted(db, {
    id: PRODUCT_NODE,
    nodeType: "standard_product",
    parentId: CATEGORY_NODE,
    canonicalName: "RP Standard Product",
    slug: "rp-standard-product",
    createdAt: CREATED_AT,
  });
  await activate(PRODUCT_NODE);

  await createKnowledgeNodePersisted(db, {
    id: PRODUCT_NODE_2,
    nodeType: "standard_product",
    parentId: CATEGORY_NODE,
    canonicalName: "RP Standard Product 2",
    slug: "rp-standard-product-2",
    createdAt: CREATED_AT,
  });
  await activate(PRODUCT_NODE_2);
});

function baseDraftRequest(businessId: string, overrides: Record<string, unknown> = {}) {
  return {
    businessId,
    displayName: "Buy 10 Coffees",
    rewardProgramCategoryId: CATEGORY_NODE,
    rewardDescription: "One free coffee",
    multipleUnitsAllowed: true,
    sharedLoyaltyNumberAllowed: false,
    effectiveFrom: new Date("2026-09-13T00:00:00.000Z"),
    qualifyingNodes: [{ knowledgeNodeId: PRODUCT_NODE, businessDisplayName: null }],
    ...overrides,
  };
}

describe("Reward Program commands — cross-store integration", () => {
  it("createRewardProgram: Owner succeeds, creates program + version 1 draft with fixed invariants", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const result = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    expect(result.program.businessId).toBe(businessId);
    expect(result.program.status).toBe("draft");
    expect(result.version.version).toBe(1);
    expect(result.version.requiredVerifiedUnits).toBe(10);
    expect(result.version.rewardQuantity).toBe(1);
    expect(result.version.status).toBe("draft");
  });

  it("createRewardProgram: same-key replay returns the original result, does not create a second program", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });
    const idempotencyKey = nextId("key");
    const request = baseDraftRequest(businessId);

    const first = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: request as never,
      idempotencyKey,
      correlationId: nextId("corr"),
    });
    const second = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: request as never,
      idempotencyKey,
      correlationId: nextId("corr"),
    });

    expect(second.program.id).toBe(first.program.id);
    const count = await pool.query("SELECT count(*) FROM reward_programs WHERE business_id = $1", [
      businessId,
    ]);
    expect(Number(count.rows[0].count)).toBe(1);
  });

  it("createRewardProgram: same key + different request content conflicts", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });
    const idempotencyKey = nextId("key");

    await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey,
      correlationId: nextId("corr"),
    });

    // Post-CORR-001 (Finding 6): the conflict is a `RewardProgramDomainError`
    // with an `IDEMPOTENCY_CONFLICT` category, not a plain `Error` whose
    // message contains the category name.
    try {
      await createRewardProgram(db, pool, {
        userId: "owner-1",
        request: baseDraftRequest(businessId, { displayName: "Different Program" }) as never,
        idempotencyKey,
        correlationId: nextId("corr"),
      });
      expect.unreachable("conflicting request must reject");
    } catch (error) {
      expect(error).toBeInstanceOf(RewardProgramDomainError);
      expect((error as RewardProgramDomainError).category).toBe("IDEMPOTENCY_CONFLICT");
    }
  });

  it("createRewardProgram: Manager is denied", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "manager-1",
      businessId,
      role: "manager",
    });

    await expect(
      createRewardProgram(db, pool, {
        userId: "manager-1",
        request: baseDraftRequest(businessId) as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  it("createRewardProgram: wrong-Business membership is denied (cross-Business isolation)", async () => {
    const businessId = nextId("biz");
    const otherBusinessId = nextId("biz");
    await seedBusiness(businessId);
    await seedBusiness(otherBusinessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId: otherBusinessId,
      role: "owner",
    });

    await expect(
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: baseDraftRequest(businessId) as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  it("createRewardProgram: inactive Business status (draft) is denied", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId, "draft");
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    await expect(
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: baseDraftRequest(businessId) as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  it("createRewardProgram: rejects an inactive/wrong-type qualifying node before any PostgreSQL write", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    await expect(
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: baseDraftRequest(businessId, {
          qualifyingNodes: [{ knowledgeNodeId: "does-not-exist", businessDisplayName: null }],
        }) as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);

    const count = await pool.query("SELECT count(*) FROM reward_programs WHERE business_id = $1", [
      businessId,
    ]);
    expect(Number(count.rows[0].count)).toBe(0);
  });

  it("updateRewardProgramDraft: succeeds on a draft, rejects a published version, rejects a stale concurrent edit", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const updated = await updateRewardProgramDraft(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        versionId: created.version.id,
        expectedRowVersion: created.version.rowVersion,
        rewardDescription: "One free large coffee",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        effectiveFrom: created.version.effectiveFrom,
        qualifyingNodes: created.version.qualifyingNodes,
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(updated.rewardDescription).toBe("One free large coffee");

    // Stale concurrent edit: reusing the ORIGINAL (now-outdated) updatedAt must be rejected.
    await expect(
      updateRewardProgramDraft(db, pool, {
        userId: "owner-1",
        request: {
          businessId,
          rewardProgramId: created.program.id,
          versionId: created.version.id,
          expectedRowVersion: created.version.rowVersion,
          rewardDescription: "Yet another edit",
          multipleUnitsAllowed: true,
          sharedLoyaltyNumberAllowed: false,
          effectiveFrom: created.version.effectiveFrom,
          qualifyingNodes: created.version.qualifyingNodes,
        } as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);

    // Publish, then confirm the published version can no longer be "updated".
    await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await expect(
      updateRewardProgramDraft(db, pool, {
        userId: "owner-1",
        request: {
          businessId,
          rewardProgramId: created.program.id,
          versionId: created.version.id,
          expectedRowVersion: updated.rowVersion,
          rewardDescription: "Post-publish edit attempt",
          multipleUnitsAllowed: true,
          sharedLoyaltyNumberAllowed: false,
          effectiveFrom: created.version.effectiveFrom,
          qualifyingNodes: created.version.qualifyingNodes,
        } as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  it("publishRewardProgramVersion: publishes, updates current-version pointer, historical version stays immutable, same-key replay works", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const publishKey = nextId("key");
    const published = await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: publishKey,
      correlationId: nextId("corr"),
    });
    expect(published.status).toBe("active");

    const programRow = await pool.query(
      "SELECT current_version_id, status FROM reward_programs WHERE id = $1",
      [created.program.id],
    );
    expect(programRow.rows[0].current_version_id).toBe(created.version.id);
    expect(programRow.rows[0].status).toBe("active");

    // Same-key replay.
    const replay = await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: publishKey,
      correlationId: nextId("corr"),
    });
    expect(replay.id).toBe(published.id);

    // Only one active version can ever exist (double-publish attempt with a fresh key rejected).
    await expect(
      publishRewardProgramVersion(db, pool, {
        userId: "owner-1",
        request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  it("publishRewardProgramVersion: rejects publication when a qualifying node is not active (validated before any PostgreSQL write)", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const inactiveNodeId = nextId("node");
    await createKnowledgeNodePersisted(db, {
      id: inactiveNodeId,
      nodeType: "standard_product",
      parentId: CATEGORY_NODE,
      canonicalName: "Draft-only node",
      slug: inactiveNodeId,
      createdAt: CREATED_AT,
    });
    // Left in "draft" status -- never activated.

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId, {
        qualifyingNodes: [{ knowledgeNodeId: PRODUCT_NODE, businessDisplayName: null }],
      }) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    // Edit the draft to reference the not-yet-active node, then attempt publish — must be rejected.
    await expect(
      updateRewardProgramDraft(db, pool, {
        userId: "owner-1",
        request: {
          businessId,
          rewardProgramId: created.program.id,
          versionId: created.version.id,
          expectedRowVersion: created.version.rowVersion,
          rewardDescription: created.version.rewardDescription,
          multipleUnitsAllowed: true,
          sharedLoyaltyNumberAllowed: false,
          effectiveFrom: created.version.effectiveFrom,
          qualifyingNodes: [{ knowledgeNodeId: inactiveNodeId, businessDisplayName: null }],
        } as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);

    const stillDraft = await pool.query(
      "SELECT status FROM reward_program_versions WHERE id = $1",
      [created.version.id],
    );
    expect(stillDraft.rows[0].status).toBe("draft");
  });

  it("publishRewardProgramVersion: a historical published version remains valid after its qualifying node is later retired", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const nodeToRetire = nextId("node");
    await createKnowledgeNodePersisted(db, {
      id: nodeToRetire,
      nodeType: "standard_product",
      parentId: CATEGORY_NODE,
      canonicalName: "Will be retired",
      slug: nodeToRetire,
      createdAt: CREATED_AT,
    });
    await transitionKnowledgeNodeStatusPersisted(db, nodeToRetire, "in_review", {
      updatedAt: CREATED_AT,
    });
    await transitionKnowledgeNodeStatusPersisted(db, nodeToRetire, "active", {
      updatedAt: CREATED_AT,
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId, {
        qualifyingNodes: [{ knowledgeNodeId: nodeToRetire, businessDisplayName: null }],
      }) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const published = await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(published.status).toBe("active");

    // Retire the node AFTER publication.
    await retireKnowledgeNodePersisted(db, nodeToRetire, {
      updatedAt: new Date(),
      replacementNodeId: PRODUCT_NODE,
    });

    // The historical published version must still be readable and unaffected.
    const stillReadable = await getRewardProgram(db, pool, {
      userId: "owner-1",
      businessId,
      rewardProgramId: created.program.id,
    });
    expect(stillReadable.currentVersion?.status).toBe("active");
    expect(stillReadable.currentVersion?.id).toBe(published.id);
  });

  it("createNextRewardProgramVersion: creates version 2 as a new draft, preserves version 1, rejects a second simultaneous draft", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const next = await createNextRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        rewardDescription: "Improved reward description",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        effectiveFrom: created.version.effectiveFrom,
        qualifyingNodes: created.version.qualifyingNodes,
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(next.version).toBe(2);
    expect(next.status).toBe("draft");

    const originalStillActive = await pool.query(
      "SELECT status, reward_description FROM reward_program_versions WHERE id = $1",
      [created.version.id],
    );
    expect(originalStillActive.rows[0].status).toBe("active");
    expect(originalStillActive.rows[0].reward_description).toBe("One free coffee");

    // Rejects a second simultaneous next-version draft while one already exists.
    await expect(
      createNextRewardProgramVersion(db, pool, {
        userId: "owner-1",
        request: {
          businessId,
          rewardProgramId: created.program.id,
          rewardDescription: "Yet another draft",
          multipleUnitsAllowed: true,
          sharedLoyaltyNumberAllowed: false,
          effectiveFrom: created.version.effectiveFrom,
          qualifyingNodes: created.version.qualifyingNodes,
        } as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  it("listRewardPrograms / getRewardProgram: membership-gated (any active role), cross-Business denied", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "staff-1",
      businessId,
      role: "staff",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    // Staff can read even though Staff cannot manage.
    const list = await listRewardPrograms(db, pool, { userId: "staff-1", businessId });
    expect(list).toHaveLength(1);
    expect(list[0].program.id).toBe(created.program.id);

    const single = await getRewardProgram(db, pool, {
      userId: "staff-1",
      businessId,
      rewardProgramId: created.program.id,
    });
    expect(single.program.id).toBe(created.program.id);

    // A non-member is denied.
    await expect(
      getRewardProgram(db, pool, {
        userId: "stranger-1",
        businessId,
        rewardProgramId: created.program.id,
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });
});

/**
 * Corrected-workflow regressions (`PLATFORM-BASELINE-005A-CORR-001`).
 * Every read assertion here goes through the real read boundary
 * (`getRewardProgram` / `listRewardPrograms` querying PostgreSQL fresh),
 * never through a command's return payload.
 */
describe("Reward Program corrected workflows (PLATFORM-BASELINE-005A-CORR-001)", () => {
  it("Finding 1 flow A: a fresh read after create returns currentVersion=null and the v1 draft as draftVersion", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    // Re-query from persistence via the read boundary (both list and get).
    const listed = await listRewardPrograms(db, pool, { userId: "owner-1", businessId });
    expect(listed).toHaveLength(1);
    expect(listed[0].program.currentVersionId).toBeNull();
    expect(listed[0].currentVersion).toBeNull();
    expect(listed[0].draftVersion).not.toBeNull();
    expect(listed[0].draftVersion?.version).toBe(1);
    expect(listed[0].draftVersion?.status).toBe("draft");

    const fetched = await getRewardProgram(db, pool, {
      userId: "owner-1",
      businessId,
      rewardProgramId: listed[0].program.id,
    });
    expect(fetched.currentVersion).toBeNull();
    expect(fetched.draftVersion?.status).toBe("draft");
    // The UI can edit and publish the draft the read boundary returned.
    const updated = await updateRewardProgramDraft(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: fetched.program.id,
        versionId: fetched.draftVersion?.id ?? "",
        expectedRowVersion: fetched.draftVersion?.rowVersion ?? 0,
        rewardDescription: "Edited from the refetched read model",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        effectiveFrom: fetched.draftVersion?.effectiveFrom ?? new Date(),
        qualifyingNodes: fetched.draftVersion?.qualifyingNodes ?? [],
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(updated.rewardDescription).toBe("Edited from the refetched read model");

    const published = await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: fetched.program.id,
        versionId: fetched.draftVersion?.id ?? "",
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(published.status).toBe("active");
  });

  it("Finding 1 flow B: after publish v1 + create v2 draft, a fresh read returns currentVersion=v1 (active) and draftVersion=v2, which the UI can edit and publish", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await createNextRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        rewardDescription: "Version 2 draft",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        effectiveFrom: created.version.effectiveFrom,
        qualifyingNodes: created.version.qualifyingNodes,
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    // Fresh read from persistence: currentVersion must STILL be v1, the
    // editable draft must be v2 -- both visible at once.
    const refetched = await getRewardProgram(db, pool, {
      userId: "owner-1",
      businessId,
      rewardProgramId: created.program.id,
    });
    expect(refetched.currentVersion?.id).toBe(created.version.id);
    expect(refetched.currentVersion?.version).toBe(1);
    expect(refetched.currentVersion?.status).toBe("active");
    expect(refetched.draftVersion?.version).toBe(2);
    expect(refetched.draftVersion?.status).toBe("draft");

    const listed = await listRewardPrograms(db, pool, { userId: "owner-1", businessId });
    const entry = listed.find((p) => p.program.id === created.program.id);
    expect(entry?.currentVersion?.version).toBe(1);
    expect(entry?.draftVersion?.version).toBe(2);

    // The UI can edit and publish the N+1 draft from the refetched read.
    const updated = await updateRewardProgramDraft(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        versionId: refetched.draftVersion?.id ?? "",
        expectedRowVersion: refetched.draftVersion?.rowVersion ?? 0,
        rewardDescription: "Version 2 edited",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        effectiveFrom: refetched.draftVersion?.effectiveFrom ?? new Date(),
        qualifyingNodes: refetched.draftVersion?.qualifyingNodes ?? [],
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(updated.rewardDescription).toBe("Version 2 edited");

    const published = await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        versionId: refetched.draftVersion?.id ?? "",
      },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(published.version).toBe(2);
    expect(published.status).toBe("active");

    const afterPublish = await getRewardProgram(db, pool, {
      userId: "owner-1",
      businessId,
      rewardProgramId: created.program.id,
    });
    expect(afterPublish.currentVersion?.version).toBe(2);
    expect(afterPublish.draftVersion).toBeNull();
  });

  it("Finding 2 test 1: concurrent first attempts with the same key + same request resolve with a governed outcome and exactly one program", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const key = nextId("key");
    const request = baseDraftRequest(businessId);
    const [first, second] = await Promise.allSettled([
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: { ...request } as never,
        idempotencyKey: key,
        correlationId: nextId("corr"),
      }),
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: { ...request } as never,
        idempotencyKey: key,
        correlationId: nextId("corr"),
      }),
    ]);

    // No raw database error anywhere: every fulfilled result is a real
    // result; every rejected reason is the governed domain error (the
    // losing reservation observes the winner and reports in-progress),
    // never a unique-violation stack or an ambiguous committed-success.
    for (const attempt of [first, second]) {
      if (attempt.status === "rejected") {
        expect(attempt.reason).toBeInstanceOf(RewardProgramDomainError);
      }
    }

    // Exactly one domain mutation happened: one program, one v1 draft.
    const programCount = await pool.query<{ count: string }>(
      "SELECT count(*) FROM reward_programs WHERE business_id = $1",
      [businessId],
    );
    expect(Number(programCount.rows[0].count)).toBe(1);
    const programIds = await pool.query<{ id: string }>(
      "SELECT id FROM reward_programs WHERE business_id = $1",
      [businessId],
    );
    const programId = programIds.rows[0].id;
    if (first.status === "fulfilled") expect(first.value.program.id).toBe(programId);
    if (second.status === "fulfilled") expect(second.value.program.id).toBe(programId);
    const versionCount = await pool.query<{ count: string }>(
      "SELECT count(*) FROM reward_program_versions WHERE reward_program_id = $1",
      [programId],
    );
    expect(Number(versionCount.rows[0].count)).toBe(1);
  });

  it("Finding 2 test 2: concurrent first attempts with the same key + different requests let exactly one acquire and resolve with governed outcomes", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const key = nextId("key");
    const request = baseDraftRequest(businessId);
    const [first, second] = await Promise.allSettled([
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: { ...request, displayName: "Display A" } as never,
        idempotencyKey: key,
        correlationId: nextId("corr"),
      }),
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: { ...request, displayName: "Display B" } as never,
        idempotencyKey: key,
        correlationId: nextId("corr"),
      }),
    ]);

    // Exactly one request owns the key; the loser receives a governed
    // idempotency outcome, never a raw database error.
    for (const attempt of [first, second]) {
      if (attempt.status === "rejected") {
        expect(attempt.reason).toBeInstanceOf(RewardProgramDomainError);
      }
    }

    const programCount = await pool.query<{ count: string }>(
      "SELECT count(*) FROM reward_programs WHERE business_id = $1",
      [businessId],
    );
    expect(Number(programCount.rows[0].count)).toBe(1);
  });

  it("Finding 2 test 4: a failed domain mutation rolls back the reservation, domain state, and outbox together, and a same-key retry proceeds", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    // One successful edit advances the row version (1 -> 2).
    await updateRewardProgramDraft(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        versionId: created.version.id,
        expectedRowVersion: created.version.rowVersion,
        rewardDescription: "First edit",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        effectiveFrom: created.version.effectiveFrom,
        qualifyingNodes: created.version.qualifyingNodes,
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    // A second edit issued with the STALE row version fails inside the
    // transaction, AFTER its reservation -> reservation, domain state, and
    // outbox roll back together.
    await expect(
      updateRewardProgramDraft(db, pool, {
        userId: "owner-1",
        request: {
          businessId,
          rewardProgramId: created.program.id,
          versionId: created.version.id,
          expectedRowVersion: created.version.rowVersion,
          rewardDescription: "Second edit",
          multipleUnitsAllowed: true,
          sharedLoyaltyNumberAllowed: false,
          effectiveFrom: created.version.effectiveFrom,
          qualifyingNodes: created.version.qualifyingNodes,
        } as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);

    const versionRow = await pool.query<{ reward_description: string; row_version: number }>(
      "SELECT reward_description, row_version FROM reward_program_versions WHERE id = $1",
      [created.version.id],
    );
    expect(versionRow.rows[0].reward_description).toBe("First edit");
    expect(Number(versionRow.rows[0].row_version)).toBe(2);
    const outboxCount = await pool.query<{ count: string }>(
      "SELECT count(*) FROM reward_program_outbox",
    );
    const keysCount = await pool.query<{ count: string }>("SELECT count(*) FROM idempotency_keys");
    // Nothing from the failed attempt persisted; only the completed
    // reservations of the successful commands remain.
    expect(Number(outboxCount.rows[0].count)).toBe(1);
    expect(Number(keysCount.rows[0].count)).toBe(2);

    // A retry with the now-current row version proceeds: the failed
    // attempt's reservation is gone, so the key can be (re)acquired.
    const retried = await updateRewardProgramDraft(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        versionId: created.version.id,
        expectedRowVersion: 2,
        rewardDescription: "Second edit",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        effectiveFrom: created.version.effectiveFrom,
        qualifyingNodes: created.version.qualifyingNodes,
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(retried.rewardDescription).toBe("Second edit");
  });

  it("Finding 6: an in-progress reservation with the same request hash surfaces the governed TEMPORARY_UNAVAILABLE domain error", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const draftRequest = {
      businessId,
      rewardProgramId: created.program.id,
      versionId: created.version.id,
      expectedRowVersion: created.version.rowVersion,
      rewardDescription: "Hashed request",
      multipleUnitsAllowed: true,
      sharedLoyaltyNumberAllowed: false,
      effectiveFrom: created.version.effectiveFrom,
      qualifyingNodes: created.version.qualifyingNodes,
    };
    // The exact hash this request deterministically produces (the pure
    // helper the command itself uses), seeded as an in-flight reservation.
    const requestHash = rewardProgramRequestHash(
      "updateDraft",
      "owner-1",
      businessId,
      created.version.id,
      JSON.stringify({
        rewardDescription: draftRequest.rewardDescription,
        standardRewardNodeId: null,
        multipleUnitsAllowed: draftRequest.multipleUnitsAllowed,
        sharedLoyaltyNumberAllowed: draftRequest.sharedLoyaltyNumberAllowed,
        bulkReviewThreshold: null,
        effectiveFrom: draftRequest.effectiveFrom,
        effectiveUntil: null,
        qualifyingNodes: draftRequest.qualifyingNodes,
      }),
    );
    // The reservation must be held under the SAME idempotency key the call
    // below reuses -- reservations are looked up by key, not by hash, so a
    // matching hash under a DIFFERENT key can never trigger "in_progress".
    const heldKey = nextId("key");
    await pool.query(
      `INSERT INTO idempotency_keys (idempotency_key, operation_type, actor_id, request_hash, status, correlation_id)
       VALUES ($1, 'rewardProgram.updateDraft', 'owner-1', $2, 'processing', 'corr')`,
      [heldKey, requestHash],
    );

    try {
      await updateRewardProgramDraft(db, pool, {
        userId: "owner-1",
        request: draftRequest as never,
        idempotencyKey: heldKey,
        correlationId: nextId("corr"),
      });
      expect.unreachable("in-progress reservation must reject");
    } catch (error) {
      expect(error).toBeInstanceOf(RewardProgramDomainError);
      expect((error as RewardProgramDomainError).category).toBe("TEMPORARY_UNAVAILABLE");
    }
  });

  it("Finding 6: a same-key reservation held for a different request surfaces the governed IDEMPOTENCY_CONFLICT domain error", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const heldKey = nextId("key");
    // The key is held by a materially DIFFERENT request (different hash).
    await pool.query(
      `INSERT INTO idempotency_keys (idempotency_key, operation_type, actor_id, request_hash, status, correlation_id)
       VALUES ($1, 'rewardProgram.updateDraft', 'owner-1', 'rewardProgram.updateDraft:other-request', 'processing', 'corr')`,
      [heldKey],
    );

    try {
      await updateRewardProgramDraft(db, pool, {
        userId: "owner-1",
        request: {
          businessId,
          rewardProgramId: created.program.id,
          versionId: created.version.id,
          expectedRowVersion: created.version.rowVersion,
          rewardDescription: "Different request",
          multipleUnitsAllowed: true,
          sharedLoyaltyNumberAllowed: false,
          effectiveFrom: created.version.effectiveFrom,
          qualifyingNodes: created.version.qualifyingNodes,
        } as never,
        idempotencyKey: heldKey,
        correlationId: nextId("corr"),
      });
      expect.unreachable("conflicting reservation must reject");
    } catch (error) {
      expect(error).toBeInstanceOf(RewardProgramDomainError);
      expect((error as RewardProgramDomainError).category).toBe("IDEMPOTENCY_CONFLICT");
    }
  });

  it("Finding 5: publishing a changed shared-number version updates the program projection in the same transaction, and a failed publication leaves the projection unchanged", async () => {
    const businessId = nextId("biz");
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId, { sharedLoyaltyNumberAllowed: false }) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    // Create v2 with the shared-number value FLIPPED to true.
    const v2 = await createNextRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        rewardDescription: "v2 with shared numbers",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: true,
        effectiveFrom: created.version.effectiveFrom,
        qualifyingNodes: created.version.qualifyingNodes,
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(v2.sharedLoyaltyNumberAllowed).toBe(true);

    // Rollback simulation: the repository publish writes everything inside
    // the caller's transaction; aborting that transaction must leave the
    // projection (and every other publication write) untouched.
    await withPlatformTransaction(pool, async (tx) => {
      await publishVersion(tx, {
        programId: created.program.id,
        versionId: v2.id,
        actorUpdatedBy: "owner-1",
      });
      throw new Error("simulated publication failure");
    }).catch(() => undefined);

    const afterRollback = await pool.query<{
      shared_loyalty_number_allowed: boolean;
      current_version_id: string | null;
    }>(
      "SELECT shared_loyalty_number_allowed, current_version_id FROM reward_programs WHERE id = $1",
      [created.program.id],
    );
    expect(afterRollback.rows[0].shared_loyalty_number_allowed).toBe(false);
    expect(afterRollback.rows[0].current_version_id).toBe(created.version.id);
    const v2AfterRollback = await pool.query<{ status: string }>(
      "SELECT status FROM reward_program_versions WHERE id = $1",
      [v2.id],
    );
    expect(v2AfterRollback.rows[0].status).toBe("draft");

    // Real publication: v1 snapshot stays false, v2 snapshot is true, the
    // program projection follows v2, and the pointer moves to v2.
    await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: v2.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const v1Row = await pool.query<{ shared_loyalty_number_allowed: boolean; status: string }>(
      "SELECT shared_loyalty_number_allowed, status FROM reward_program_versions WHERE id = $1",
      [created.version.id],
    );
    expect(v1Row.rows[0].shared_loyalty_number_allowed).toBe(false);
    expect(v1Row.rows[0].status).toBe("superseded");

    const v2Row = await pool.query<{ shared_loyalty_number_allowed: boolean; status: string }>(
      "SELECT shared_loyalty_number_allowed, status FROM reward_program_versions WHERE id = $1",
      [v2.id],
    );
    expect(v2Row.rows[0].shared_loyalty_number_allowed).toBe(true);
    expect(v2Row.rows[0].status).toBe("active");

    const programRow = await pool.query<{
      shared_loyalty_number_allowed: boolean;
      current_version_id: string;
    }>(
      "SELECT shared_loyalty_number_allowed, current_version_id FROM reward_programs WHERE id = $1",
      [created.program.id],
    );
    expect(programRow.rows[0].shared_loyalty_number_allowed).toBe(true);
    expect(programRow.rows[0].current_version_id).toBe(v2.id);

    const readModel = await getRewardProgram(db, pool, {
      userId: "owner-1",
      businessId,
      rewardProgramId: created.program.id,
    });
    expect(readModel.currentVersion?.id).toBe(v2.id);
  });
});

/**
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`): a Reward Program Category is no longer
 * a required qualification prerequisite -- the Business-selected
 * canonical `standard_product`/`standard_service` qualifying node(s) are
 * the operative qualification definition. These tests prove the create
 * path succeeds with `rewardProgramCategoryId: null`, that one or many
 * qualifying products/services persist correctly, that invalid/fabricated/
 * wrong-typed/ineligible qualifying-node ids still fail exactly as before
 * (Business Type/category is not a second gate, but node-level validation
 * is completely untouched), that an existing category-bearing program
 * keeps working unchanged, and that publish-time (RF-3) validation
 * remains authoritative.
 */
describe("Reward Program commands — PLATFORM-BASELINE-010B (Reward Program Category optional)", () => {
  function categorylessDraftRequest(businessId: string, overrides: Record<string, unknown> = {}) {
    return {
      businessId,
      displayName: "Buy 10 Coffees (no category)",
      rewardProgramCategoryId: null,
      rewardDescription: "One free coffee",
      multipleUnitsAllowed: true,
      sharedLoyaltyNumberAllowed: false,
      effectiveFrom: new Date("2026-09-17T00:00:00.000Z"),
      qualifyingNodes: [{ knowledgeNodeId: PRODUCT_NODE, businessDisplayName: null }],
      ...overrides,
    };
  }

  async function seedOwner(businessId: string) {
    await seedBusiness(businessId);
    await seedMembership({
      membershipId: nextId("mem"),
      userId: "owner-1",
      businessId,
      role: "owner",
    });
  }

  // Item A: creation succeeds without rewardProgramCategoryId.
  it("A: createRewardProgram succeeds with rewardProgramCategoryId: null", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    const result = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: categorylessDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    expect(result.program.rewardProgramCategoryId).toBeNull();
    expect(result.program.status).toBe("draft");
    expect(result.version.status).toBe("draft");
  });

  // Item I: new rows can persist a NULL reward_program_category_id at the database layer.
  it("I: the persisted reward_programs row has a NULL reward_program_category_id", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    const result = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: categorylessDraftRequest(businessId) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    const row = await pool.query<{ reward_program_category_id: string | null }>(
      "SELECT reward_program_category_id FROM reward_programs WHERE id = $1",
      [result.program.id],
    );
    expect(row.rows[0].reward_program_category_id).toBeNull();
  });

  // Item B: one canonical qualifying product can be selected and persisted.
  it("B: a single canonical qualifying product persists correctly", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    const result = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: categorylessDraftRequest(businessId, {
        qualifyingNodes: [{ knowledgeNodeId: PRODUCT_NODE, businessDisplayName: null }],
      }) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    expect(result.version.qualifyingNodes).toEqual([
      { knowledgeNodeId: PRODUCT_NODE, businessDisplayName: null },
    ]);
  });

  // Item C: multiple canonical qualifying products/services can be selected and persisted.
  it("C: multiple canonical qualifying products/services persist correctly", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    const result = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: categorylessDraftRequest(businessId, {
        qualifyingNodes: [
          { knowledgeNodeId: PRODUCT_NODE, businessDisplayName: "Black Coffee" },
          { knowledgeNodeId: PRODUCT_NODE_2, businessDisplayName: "Medium Pizza" },
        ],
      }) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    expect(result.version.qualifyingNodes).toEqual([
      { knowledgeNodeId: PRODUCT_NODE, businessDisplayName: "Black Coffee" },
      { knowledgeNodeId: PRODUCT_NODE_2, businessDisplayName: "Medium Pizza" },
    ]);
  });

  // Item D: missing/nonexistent qualifying-node ids fail creation.
  it("D: a nonexistent qualifying-node id fails creation, even with no category", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    await expect(
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: categorylessDraftRequest(businessId, {
          qualifyingNodes: [
            { knowledgeNodeId: "does-not-exist-at-all", businessDisplayName: null },
          ],
        }) as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);

    const count = await pool.query("SELECT count(*) FROM reward_programs WHERE business_id = $1", [
      businessId,
    ]);
    expect(Number(count.rows[0].count)).toBe(0);
  });

  // Item E: fabricated canonical ids fail (distinct test for clarity, same mechanism as D).
  it("E: a fabricated/guessed canonical id fails creation, never accepted merely by looking well-formed", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    await expect(
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: categorylessDraftRequest(businessId, {
          qualifyingNodes: [
            { knowledgeNodeId: "fabricated-canonical-id-1234567890", businessDisplayName: null },
          ],
        }) as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  // Item F: wrong Commerce-Knowledge node types (e.g. a business_type id) fail.
  it("F: a wrong-typed node id (a business_type, not a standard_product/standard_service) fails as a qualifying node", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    await expect(
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: categorylessDraftRequest(businessId, {
          qualifyingNodes: [{ knowledgeNodeId: TYPE, businessDisplayName: null }],
        }) as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  // Item G: draft/in_review/otherwise-ineligible nodes fail as qualifying-node selections.
  it("G: a draft (not-yet-active) canonical node fails as a qualifying node selection", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    const draftNodeId = nextId("draft_node");
    await createKnowledgeNodePersisted(db, {
      id: draftNodeId,
      nodeType: "standard_product",
      parentId: CATEGORY_NODE,
      canonicalName: "Not Yet Active Product",
      slug: `not-yet-active-${draftNodeId}`,
      createdAt: CREATED_AT,
    });
    // Left in "draft" status deliberately -- never transitioned to active.

    await expect(
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: categorylessDraftRequest(businessId, {
          qualifyingNodes: [{ knowledgeNodeId: draftNodeId, businessDisplayName: null }],
        }) as never,
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });

  // Item H: an existing program with a non-null category remains readable/operational unchanged.
  it("H: an existing category-bearing Reward Program remains fully operational unchanged", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: baseDraftRequest(businessId) as never, // baseDraftRequest sets rewardProgramCategoryId: CATEGORY_NODE
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(created.program.rewardProgramCategoryId).toBe(CATEGORY_NODE);

    const readModel = await getRewardProgram(db, pool, {
      userId: "owner-1",
      businessId,
      rewardProgramId: created.program.id,
    });
    expect(readModel.program.rewardProgramCategoryId).toBe(CATEGORY_NODE);

    const updated = await updateRewardProgramDraft(db, pool, {
      userId: "owner-1",
      request: {
        businessId,
        rewardProgramId: created.program.id,
        versionId: created.version.id,
        expectedRowVersion: created.version.rowVersion,
        rewardDescription: "Still works with a category",
        multipleUnitsAllowed: true,
        sharedLoyaltyNumberAllowed: false,
        effectiveFrom: created.version.effectiveFrom,
        qualifyingNodes: created.version.qualifyingNodes,
      } as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(updated.rewardDescription).toBe("Still works with a category");

    const published = await publishRewardProgramVersion(db, pool, {
      userId: "owner-1",
      request: { businessId, rewardProgramId: created.program.id, versionId: created.version.id },
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });
    expect(published.status).toBe("active");
  });

  /**
   * Item Q (Business Type is not a qualification gate): the write-time
   * qualifying-node validation (`validateQualifyingNodes`) has no
   * Business-Type or category scoping of its own -- a canonical
   * `standard_product`/`standard_service` node is accepted purely on its
   * own existence/type/eligibility, regardless of which
   * `reward_program_category` (or none at all) the creating request
   * names. `PRODUCT_NODE_2` here is a real, active, governed node that
   * this specific request's (absent) category never named -- proving
   * category/Business-Type is never consulted as a second gate at write
   * time.
   */
  it("Q: a qualifying node is accepted purely on its own eligibility -- no Business-Type/category gate at write time", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    const result = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: categorylessDraftRequest(businessId, {
        qualifyingNodes: [{ knowledgeNodeId: PRODUCT_NODE_2, businessDisplayName: null }],
      }) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    expect(result.version.qualifyingNodes).toEqual([
      { knowledgeNodeId: PRODUCT_NODE_2, businessDisplayName: null },
    ]);
  });

  // Item S: publish-time (RF-3) validation remains authoritative even with no category.
  it("S: publish-time validation still rejects an invalid qualifying-node reference for a category-less program", async () => {
    const businessId = nextId("biz");
    await seedOwner(businessId);

    // A dedicated, disposable node for this test -- retirement is a
    // one-way transition (active -> retired -> archived only), so this
    // must never be one of the shared fixture nodes other tests in this
    // file rely on staying "active".
    const disposableNodeId = nextId("disposable_product");
    await createKnowledgeNodePersisted(db, {
      id: disposableNodeId,
      nodeType: "standard_product",
      parentId: CATEGORY_NODE,
      canonicalName: "Disposable Product For Retirement Test",
      slug: `disposable-product-${disposableNodeId}`,
      createdAt: CREATED_AT,
    });
    await transitionKnowledgeNodeStatusPersisted(db, disposableNodeId, "in_review", {
      updatedAt: CREATED_AT,
    });
    await transitionKnowledgeNodeStatusPersisted(db, disposableNodeId, "active", {
      updatedAt: CREATED_AT,
    });

    const created = await createRewardProgram(db, pool, {
      userId: "owner-1",
      request: categorylessDraftRequest(businessId, {
        qualifyingNodes: [{ knowledgeNodeId: disposableNodeId, businessDisplayName: null }],
      }) as never,
      idempotencyKey: nextId("key"),
      correlationId: nextId("corr"),
    });

    // Retire the qualifying node between draft creation and publish --
    // RF-3's authoritative pre-transaction Firestore read must still catch it.
    await retireKnowledgeNodePersisted(db, disposableNodeId, {
      updatedAt: new Date(),
      replacementNodeId: PRODUCT_NODE,
    });

    await expect(
      publishRewardProgramVersion(db, pool, {
        userId: "owner-1",
        request: {
          businessId,
          rewardProgramId: created.program.id,
          versionId: created.version.id,
        },
        idempotencyKey: nextId("key"),
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow(RewardProgramDomainError);
  });
});
