import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runCommerceKnowledgeSeed } from "./seedLoader";
import { BURUNDI_PILOT_SEED_MANIFEST } from "./burundiPilotSeedManifest";
import type { CommerceKnowledgeSeedManifest } from "./seedManifest";
import { KNOWLEDGE_NODES_COLLECTION } from "../repositories/knowledgeNodeRepository";
import { KNOWLEDGE_TRANSLATIONS_COLLECTION } from "../repositories/knowledgeTranslationRepository";
import { getKnowledgeNodeById } from "../repositories/knowledgeNodeRepository";

// Real Firestore round trip against the Firebase Emulator Suite. Not run as
// part of `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.

const app = initializeApp({ projectId: "demo-11thonus" }, "seedLoaderEmulatorTest");
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
  for (const collection of [KNOWLEDGE_NODES_COLLECTION, KNOWLEDGE_TRANSLATIONS_COLLECTION]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("runCommerceKnowledgeSeed — Burundi pilot manifest", () => {
  it("first load creates every manifest node as active with a published EN translation (scenario 16)", async () => {
    const result = await runCommerceKnowledgeSeed(db, BURUNDI_PILOT_SEED_MANIFEST, { now });

    expect(result.created.length).toBe(BURUNDI_PILOT_SEED_MANIFEST.nodes.length);
    expect(result.unchanged.length).toBe(0);

    const industry = await getKnowledgeNodeById(db, "ind_food_beverage");
    expect(industry?.status).toBe("active");
    expect(industry?.depth).toBe(0);

    const category = await getKnowledgeNodeById(db, "cat_coffee_shop");
    expect(category?.status).toBe("active");
    expect(category?.depth).toBe(1);
    expect(category?.path).toBe("/ind_food_beverage/cat_coffee_shop");

    const businessType = await getKnowledgeNodeById(db, "type_luxury_salon");
    expect(businessType?.depth).toBe(2);

    const translationSnapshot = await db
      .collection(KNOWLEDGE_TRANSLATIONS_COLLECTION)
      .doc("knowledge_node_ind_food_beverage_en")
      .get();
    expect(translationSnapshot.exists).toBe(true);
    expect(translationSnapshot.data()?.["status"]).toBe("published");
  });

  it("identical seed rerun is a safe no-op (scenario 17)", async () => {
    await runCommerceKnowledgeSeed(db, BURUNDI_PILOT_SEED_MANIFEST, { now });
    const second = await runCommerceKnowledgeSeed(db, BURUNDI_PILOT_SEED_MANIFEST, { now });

    expect(second.created.length).toBe(0);
    expect(second.unchanged.length).toBe(BURUNDI_PILOT_SEED_MANIFEST.nodes.length);
  });

  it("conflicting seed rerun fails closed without overwriting (scenario 18)", async () => {
    await runCommerceKnowledgeSeed(db, BURUNDI_PILOT_SEED_MANIFEST, { now });

    const conflicting: CommerceKnowledgeSeedManifest = {
      manifestVersion: "burundi-pilot-v1-conflict",
      nodes: BURUNDI_PILOT_SEED_MANIFEST.nodes.map((node) =>
        node.id === "ind_food_beverage"
          ? { ...node, canonicalName: "Food & Beverage (renamed)" }
          : node,
      ),
    };

    await expect(runCommerceKnowledgeSeed(db, conflicting, { now })).rejects.toMatchObject({
      category: "IDEMPOTENCY_CONFLICT",
    });

    // Original content must be untouched.
    const industry = await getKnowledgeNodeById(db, "ind_food_beverage");
    expect(industry?.canonicalName).toBe("Food & Beverage");
  });

  it("a partial/invalid manifest (dangling parent) fails validation before any write (scenario 19)", async () => {
    const invalid: CommerceKnowledgeSeedManifest = {
      manifestVersion: "invalid-v1",
      nodes: [
        {
          id: "cat_orphan",
          nodeType: "business_category",
          parentId: "does_not_exist",
          canonicalName: "Orphan",
          slug: "orphan",
          translations: { en: "Orphan" },
          sourceRef: "test",
        },
      ],
    };

    await expect(runCommerceKnowledgeSeed(db, invalid, { now })).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });

    const snapshot = await db.collection(KNOWLEDGE_NODES_COLLECTION).get();
    expect(snapshot.size).toBe(0);
  });

  it("a manifest with a hierarchy-invalid entry fails whole-manifest validation before any write is attempted", async () => {
    const invalidHierarchy: CommerceKnowledgeSeedManifest = {
      manifestVersion: "partial-v1",
      nodes: [
        {
          id: "ind_ok",
          nodeType: "industry",
          parentId: null,
          canonicalName: "OK Industry",
          slug: "ok-industry",
          translations: { en: "OK Industry" },
          sourceRef: "test",
        },
        {
          id: "type_wrong_parent",
          nodeType: "business_type",
          // business_type may not parent directly under an industry.
          parentId: "ind_ok",
          canonicalName: "Wrong Parent Type",
          slug: "wrong-parent-type",
          translations: { en: "Wrong Parent Type" },
          sourceRef: "test",
        },
      ],
    };

    await expect(runCommerceKnowledgeSeed(db, invalidHierarchy, { now })).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });

    // Whole-manifest validation (design §N) rejects this before any write
    // is attempted at all — not even the structurally valid `ind_ok`
    // entry is persisted. This is the documented, intentional consistency
    // model: "validate the full manifest before writes where practical."
    const okIndustry = await getKnowledgeNodeById(db, "ind_ok");
    expect(okIndustry).toBeNull();
    const badChild = await getKnowledgeNodeById(db, "type_wrong_parent");
    expect(badChild).toBeNull();
  });

  it("no businessId/tenant field is ever written by the seed loader (scenario 20)", async () => {
    await runCommerceKnowledgeSeed(db, BURUNDI_PILOT_SEED_MANIFEST, { now });
    const snapshot = await db.collection(KNOWLEDGE_NODES_COLLECTION).get();
    for (const doc of snapshot.docs) {
      expect(Object.keys(doc.data())).not.toContain("businessId");
    }
  });
});
