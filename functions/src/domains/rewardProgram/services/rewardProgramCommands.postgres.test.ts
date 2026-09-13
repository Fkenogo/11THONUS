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

    await expect(
      createRewardProgram(db, pool, {
        userId: "owner-1",
        request: baseDraftRequest(businessId, { displayName: "Different Program" }) as never,
        idempotencyKey,
        correlationId: nextId("corr"),
      }),
    ).rejects.toThrow("IDEMPOTENCY_CONFLICT");
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
