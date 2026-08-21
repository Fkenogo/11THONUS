import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runCommerceKnowledgeSeed } from "./seedLoader";
import { BURUNDI_PILOT_SEED_MANIFEST } from "./burundiPilotSeedManifest";
import type { CommerceKnowledgeSeedManifest } from "./seedManifest";
import {
  KNOWLEDGE_NODES_COLLECTION,
  retireKnowledgeNodePersisted,
} from "../repositories/knowledgeNodeRepository";
import {
  KNOWLEDGE_TRANSLATIONS_COLLECTION,
  getKnowledgeTranslationByTuple,
  transitionKnowledgeTranslationStatusPersisted,
} from "../repositories/knowledgeTranslationRepository";
import {
  getKnowledgeNodeById,
  transitionKnowledgeNodeStatusPersisted,
} from "../repositories/knowledgeNodeRepository";

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

  describe("partial-failure resumability (Phase D priority finding)", () => {
    const singleNodeManifest: CommerceKnowledgeSeedManifest = {
      manifestVersion: "resume-test-v1",
      nodes: [
        {
          id: "ind_resume_test",
          nodeType: "industry",
          parentId: null,
          canonicalName: "Resume Test Industry",
          slug: "resume-test-industry",
          translations: { en: "Resume Test Industry" },
          sourceRef: "test",
        },
      ],
    };

    it("resumes a node stuck in in_review from a simulated partial failure (create + in_review succeeded, active transition failed)", async () => {
      // Simulate the interrupted run directly: create the node and move it
      // to in_review — exactly what the loader itself does — then stop
      // short of the active transition, as if that call had thrown.
      const { createKnowledgeNodePersisted } =
        await import("../repositories/knowledgeNodeRepository");
      await createKnowledgeNodePersisted(db, {
        id: "ind_resume_test",
        nodeType: "industry",
        parentId: null,
        canonicalName: "Resume Test Industry",
        slug: "resume-test-industry",
        createdAt: now,
      });
      await transitionKnowledgeNodeStatusPersisted(db, "ind_resume_test", "in_review", {
        updatedAt: now,
      });

      const stuck = await getKnowledgeNodeById(db, "ind_resume_test");
      expect(stuck?.status).toBe("in_review");

      // Rerun the loader against the same manifest — this must heal the
      // interrupted node to `active`, not silently call it "unchanged".
      const result = await runCommerceKnowledgeSeed(db, singleNodeManifest, { now });

      const healed = await getKnowledgeNodeById(db, "ind_resume_test");
      expect(healed?.status).toBe("active");
      expect(result.created).not.toContain("ind_resume_test");
      expect(result.unchanged).not.toContain("ind_resume_test");
      expect(result.reconciled).toContain("ind_resume_test");
    });

    it("resumes a translation stuck in reviewed from a simulated partial failure (translation create + reviewed succeeded, published transition failed)", async () => {
      await runCommerceKnowledgeSeed(db, singleNodeManifest, { now });
      // Force the already-active node's translation back to a mid-flight
      // "reviewed" state to simulate the publish step having failed on a
      // prior run and never completing.
      const translation = await getKnowledgeTranslationByTuple(
        db,
        "knowledge_node",
        "ind_resume_test",
        "en",
      );
      if (!translation) throw new Error("expected translation to exist from setup run");
      await transitionKnowledgeTranslationStatusPersisted(db, translation.id, "draft", {
        updatedAt: now,
      });
      await transitionKnowledgeTranslationStatusPersisted(db, translation.id, "reviewed", {
        updatedAt: now,
      });

      const stuck = await getKnowledgeTranslationByTuple(
        db,
        "knowledge_node",
        "ind_resume_test",
        "en",
      );
      expect(stuck?.status).toBe("reviewed");

      const result = await runCommerceKnowledgeSeed(db, singleNodeManifest, { now });

      const healed = await getKnowledgeTranslationByTuple(
        db,
        "knowledge_node",
        "ind_resume_test",
        "en",
      );
      expect(healed?.status).toBe("published");
      expect(result.unchanged).not.toContain("ind_resume_test");
      expect(result.reconciled).toContain("ind_resume_test");
    });

    it("a true no-op rerun (already active/published) reports unchanged, not reconciled", async () => {
      await runCommerceKnowledgeSeed(db, singleNodeManifest, { now });
      const result = await runCommerceKnowledgeSeed(db, singleNodeManifest, { now });

      expect(result.unchanged).toContain("ind_resume_test");
      expect(result.reconciled).not.toContain("ind_resume_test");
      expect(result.created).not.toContain("ind_resume_test");
    });

    it("a retired canonical node is not silently resurrected by a seed rerun — fails closed", async () => {
      await runCommerceKnowledgeSeed(db, singleNodeManifest, { now });
      // Need a replacement target to legally retire the node per 001A's
      // own transition matrix (retirement requires replacementNodeId).
      const replacement: CommerceKnowledgeSeedManifest = {
        manifestVersion: "resume-test-v1-replacement",
        nodes: [
          {
            id: "ind_resume_test_replacement",
            nodeType: "industry",
            parentId: null,
            canonicalName: "Resume Test Industry Replacement",
            slug: "resume-test-industry-replacement",
            translations: { en: "Resume Test Industry Replacement" },
            sourceRef: "test",
          },
        ],
      };
      await runCommerceKnowledgeSeed(db, replacement, { now });
      await retireKnowledgeNodePersisted(db, "ind_resume_test", {
        updatedAt: now,
        replacementNodeId: "ind_resume_test_replacement",
      });

      const retired = await getKnowledgeNodeById(db, "ind_resume_test");
      expect(retired?.status).toBe("retired");

      await expect(runCommerceKnowledgeSeed(db, singleNodeManifest, { now })).rejects.toMatchObject(
        {
          category: "IDEMPOTENCY_CONFLICT",
        },
      );

      const stillRetired = await getKnowledgeNodeById(db, "ind_resume_test");
      expect(stillRetired?.status).toBe("retired");
    });
  });
});
