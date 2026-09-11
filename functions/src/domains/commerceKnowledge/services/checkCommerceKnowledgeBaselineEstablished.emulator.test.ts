import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { checkCommerceKnowledgeBaselineEstablished } from "./checkCommerceKnowledgeBaselineEstablished";
import { runCommerceKnowledgeSeed } from "../seed/seedLoader";
import type { CommerceKnowledgeSeedManifest } from "../seed/seedManifest";
import { KNOWLEDGE_NODES_COLLECTION } from "../repositories/knowledgeNodeRepository";
import { KNOWLEDGE_TRANSLATIONS_COLLECTION } from "../repositories/knowledgeTranslationRepository";

const app = initializeApp(
  { projectId: "demo-11thonus" },
  "checkCommerceKnowledgeBaselineEstablishedEmulatorTest",
);
const db = getFirestore(app);

const manifest: CommerceKnowledgeSeedManifest = {
  manifestVersion: "test-1",
  nodes: [
    {
      id: "industry-test-readiness",
      nodeType: "industry",
      parentId: null,
      slug: "test-readiness-industry",
      canonicalName: "Test Readiness Industry",
      searchTerms: [],
      translations: { en: "Test Readiness Industry" },
      sourceRef: "PLATFORM-BASELINE-001 test fixture — not governed content",
    },
  ],
};

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

describe("checkCommerceKnowledgeBaselineEstablished", () => {
  it("returns false when the manifest's node does not exist", async () => {
    await expect(checkCommerceKnowledgeBaselineEstablished(db, manifest)).resolves.toBe(false);
  });

  it("returns true once the manifest has been seeded (reuses the existing seed loader)", async () => {
    await runCommerceKnowledgeSeed(db, manifest, { now: new Date("2026-09-11T00:00:00.000Z") });
    await expect(checkCommerceKnowledgeBaselineEstablished(db, manifest)).resolves.toBe(true);
  });

  it("never writes anything (read-only)", async () => {
    await checkCommerceKnowledgeBaselineEstablished(db, manifest);
    const snapshot = await db.collection(KNOWLEDGE_NODES_COLLECTION).get();
    expect(snapshot.empty).toBe(true);
  });
});
