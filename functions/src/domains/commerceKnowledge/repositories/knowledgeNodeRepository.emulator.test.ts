import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  KNOWLEDGE_NODES_COLLECTION,
  createKnowledgeNodePersisted,
  getKnowledgeNodeById,
  listKnowledgeNodeChildren,
  resolveHierarchyPlacement,
  retireKnowledgeNodePersisted,
  transitionKnowledgeNodeStatusPersisted,
} from "./knowledgeNodeRepository";
import { CommerceKnowledgeDomainError } from "../models/commerceKnowledgeErrors";

// Real Firestore round trip against the Firebase Emulator Suite. Not run as
// part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp({ projectId: "demo-11thonus" }, "knowledgeNodeRepositoryEmulatorTest");
const db = getFirestore(app);
const now = new Date("2026-08-21T00:00:00.000Z");

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

beforeEach(async () => {
  const snapshot = await db.collection(KNOWLEDGE_NODES_COLLECTION).get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

describe("knowledgeNodeRepository — create/read", () => {
  it("creates and reads back a root Industry node (scenario 1/5)", async () => {
    const node = await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });

    expect(node.depth).toBe(0);
    expect(node.path).toBe("/ind_food");
    expect(node.status).toBe("draft");

    const read = await getKnowledgeNodeById(db, "ind_food");
    expect(read).not.toBeNull();
    expect(read?.canonicalName).toBe("Food & Beverage");
  });

  it("creates a valid child node under a persisted parent (scenario 6)", async () => {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });

    const child = await createKnowledgeNodePersisted(db, {
      id: "cat_coffee_shop",
      nodeType: "business_category",
      parentId: "ind_food",
      canonicalName: "Coffee Shop",
      slug: "coffee-shop",
      createdAt: now,
    });

    expect(child.depth).toBe(1);
    expect(child.path).toBe("/ind_food/cat_coffee_shop");

    const children = await listKnowledgeNodeChildren(db, "ind_food");
    expect(children.map((c) => c.id)).toEqual(["cat_coffee_shop"]);
  });

  it("rejects a child whose declared parent does not exist (scenario 7)", async () => {
    await expect(
      createKnowledgeNodePersisted(db, {
        id: "cat_orphan",
        nodeType: "business_category",
        parentId: "does_not_exist",
        canonicalName: "Orphan Category",
        slug: "orphan-category",
        createdAt: now,
      }),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("rejects a child whose parent has the wrong nodeType (scenario 8)", async () => {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });

    // business_type may only parent under business_category, not industry.
    await expect(
      createKnowledgeNodePersisted(db, {
        id: "type_wrong",
        nodeType: "business_type",
        parentId: "ind_food",
        canonicalName: "Wrong Type",
        slug: "wrong-type",
        createdAt: now,
      }),
    ).rejects.toBeInstanceOf(CommerceKnowledgeDomainError);
  });

  it("cannot persist an incorrect child depth (scenario 9) — depth is always repository-derived, never caller-supplied", async () => {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });
    const child = await createKnowledgeNodePersisted(db, {
      id: "cat_coffee_shop",
      nodeType: "business_category",
      parentId: "ind_food",
      canonicalName: "Coffee Shop",
      slug: "coffee-shop",
      createdAt: now,
    });
    // No caller-supplied depth parameter exists at all on the repository
    // API — depth is always parent.depth + 1, structurally impossible to
    // override from outside.
    expect(child.depth).toBe(1);
  });

  it("rejects a self-cycle (parentId === nodeId) (scenario 10)", async () => {
    await expect(
      createKnowledgeNodePersisted(db, {
        id: "self_cycle",
        nodeType: "industry",
        parentId: "self_cycle",
        canonicalName: "Self Cycle",
        slug: "self-cycle",
        createdAt: now,
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("rejects an indirect cycle discovered via ancestor traversal (scenario 11)", async () => {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });
    await createKnowledgeNodePersisted(db, {
      id: "cat_coffee_shop",
      nodeType: "business_category",
      parentId: "ind_food",
      canonicalName: "Coffee Shop",
      slug: "coffee-shop",
      createdAt: now,
    });

    // Directly exercise the resolver as `001B`'s repository-backed cycle
    // check for a hypothetical re-parent of `ind_food` under its own
    // descendant `cat_coffee_shop` — a genuine indirect cycle.
    await expect(
      db.runTransaction((transaction) =>
        resolveHierarchyPlacement(transaction, db, {
          nodeId: "ind_food",
          nodeType: "industry",
          parentId: "cat_coffee_shop",
        }),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("valid ancestry (three levels) resolves without error (scenario 12)", async () => {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });
    await createKnowledgeNodePersisted(db, {
      id: "cat_coffee_shop",
      nodeType: "business_category",
      parentId: "ind_food",
      canonicalName: "Coffee Shop",
      slug: "coffee-shop",
      createdAt: now,
    });
    const type = await createKnowledgeNodePersisted(db, {
      id: "type_espresso_bar",
      nodeType: "business_type",
      parentId: "cat_coffee_shop",
      canonicalName: "Espresso Bar",
      slug: "espresso-bar",
      createdAt: now,
    });

    expect(type.depth).toBe(2);
    expect(type.path).toBe("/ind_food/cat_coffee_shop/type_espresso_bar");
  });

  it("malformed persisted document fails closed on read (scenario 4)", async () => {
    await db.collection(KNOWLEDGE_NODES_COLLECTION).doc("bad_node").set({
      nodeType: "industry",
      // missing required fields entirely
    });
    const read = await getKnowledgeNodeById(db, "bad_node");
    expect(read).toBeNull();
  });

  it("no businessId/tenant field is ever persisted on a knowledgeNode (scenario 20)", async () => {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });
    const raw = await db.collection(KNOWLEDGE_NODES_COLLECTION).doc("ind_food").get();
    const data = raw.data() ?? {};
    expect(Object.keys(data)).not.toContain("businessId");
    expect(Object.keys(data)).not.toContain("branchId");
    expect(Object.keys(data)).not.toContain("ownerUserId");
    expect(Object.keys(data)).not.toContain("membershipId");
  });
});

describe("knowledgeNodeRepository — lifecycle/retirement", () => {
  async function createActivePair() {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });
    await transitionKnowledgeNodeStatusPersisted(db, "ind_food", "in_review", { updatedAt: now });
    await transitionKnowledgeNodeStatusPersisted(db, "ind_food", "active", { updatedAt: now });

    await createKnowledgeNodePersisted(db, {
      id: "ind_food_v2",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage (v2)",
      slug: "food-beverage-v2",
      createdAt: now,
    });
    await transitionKnowledgeNodeStatusPersisted(db, "ind_food_v2", "in_review", {
      updatedAt: now,
    });
    await transitionKnowledgeNodeStatusPersisted(db, "ind_food_v2", "active", { updatedAt: now });
  }

  it("retirement replacement validation accepts a valid same-type replacement (scenario 15)", async () => {
    await createActivePair();
    const retired = await retireKnowledgeNodePersisted(db, "ind_food", {
      updatedAt: now,
      replacementNodeId: "ind_food_v2",
    });
    expect(retired.status).toBe("retired");
    expect(retired.replacementNodeId).toBe("ind_food_v2");
  });

  it("rejects retirement with a replacement that does not exist", async () => {
    await createActivePair();
    await expect(
      retireKnowledgeNodePersisted(db, "ind_food", {
        updatedAt: now,
        replacementNodeId: "does_not_exist",
      }),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
  });

  it("rejects retirement with a replacement of a different nodeType", async () => {
    await createActivePair();
    await createKnowledgeNodePersisted(db, {
      id: "cat_wrong_type",
      nodeType: "business_category",
      parentId: "ind_food_v2",
      canonicalName: "Wrong Type Replacement",
      slug: "wrong-type-replacement",
      createdAt: now,
    });
    await expect(
      retireKnowledgeNodePersisted(db, "ind_food", {
        updatedAt: now,
        replacementNodeId: "cat_wrong_type",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });

  it("rejects self-replacement", async () => {
    await createActivePair();
    await expect(
      retireKnowledgeNodePersisted(db, "ind_food", {
        updatedAt: now,
        replacementNodeId: "ind_food",
      }),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });
  });
});

describe("knowledgeNodeRepository — concurrency", () => {
  it("two concurrent creations under the same fresh id race safely (no partial/duplicate state)", async () => {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });

    const attempt = () =>
      createKnowledgeNodePersisted(db, {
        id: "cat_race",
        nodeType: "business_category",
        parentId: "ind_food",
        canonicalName: "Race Category",
        slug: "race-category",
        createdAt: now,
      });

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    // Review Phase L: a same-ID create race must never let the loser
    // silently overwrite the winner's already-committed canonical node —
    // exactly one attempt may succeed, the other must fail closed.
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    const stored = await getKnowledgeNodeById(db, "cat_race");
    expect(stored).not.toBeNull();
    expect(stored?.depth).toBe(1);
    expect(stored?.path).toBe("/ind_food/cat_race");
  });

  it("a create attempt against an id that already has a persisted canonical node fails closed rather than overwriting it", async () => {
    await createKnowledgeNodePersisted(db, {
      id: "ind_food",
      nodeType: "industry",
      parentId: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      createdAt: now,
    });

    await expect(
      createKnowledgeNodePersisted(db, {
        id: "ind_food",
        nodeType: "industry",
        parentId: null,
        canonicalName: "Food & Beverage (overwrite attempt)",
        slug: "food-beverage-overwrite",
        createdAt: now,
      }),
    ).rejects.toBeInstanceOf(CommerceKnowledgeDomainError);

    const stored = await getKnowledgeNodeById(db, "ind_food");
    expect(stored?.canonicalName).toBe("Food & Beverage");
  });
});
